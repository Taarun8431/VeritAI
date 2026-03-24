import asyncio
from typing import TypedDict, List, Dict, Any, Optional
from bs4 import BeautifulSoup
import httpx
from langgraph.graph import StateGraph, END
from models import ClaimObject, EvidenceObject, VerificationResult

from bonus.ai_detector import detect_ai_text
from bonus.deepfake import detect_deepfakes, extract_images_from_url
from agents.extractor import extract_claims
from agents.searcher import run_searches_for_claims
from agents.verifier import verify_claim
from agents.reflector import generate_refined_query
from search_manager import search

class GraphState(TypedDict):
    input_value: str
    is_url: bool
    queue: Any
    full_text: str
    images: List[str]
    claims: List[ClaimObject]
    evidence_map: Dict[str, List[EvidenceObject]]
    verdicts: Dict[str, VerificationResult]
    retries: Dict[str, int]

async def node_preprocess(state: GraphState):
    input_val = state["input_value"]
    is_url = state["is_url"]
    q = state["queue"]
    
    text = input_val
    images = []
    
    if is_url:
        try:
            async with httpx.AsyncClient(timeout=15, follow_redirects=True) as client:
                resp = await client.get(input_val)
                resp.raise_for_status()
                html = resp.text
                soup = BeautifulSoup(html, "html.parser")
                text = soup.get_text(separator="\n", strip=True)
                
                images = extract_images_from_url(html, input_val)
        except Exception as e:
            text = f"Error scraping URL: {e}"
            await q.put(("error_event", {"type": "search_failed", "message": str(e), "graceful_verdict": "Unverifiable"}))
            
    try:
        ai_score = await detect_ai_text(text)
        await q.put(("ai_score", ai_score.model_dump()))
    except Exception as e:
        print(f"AI Detect Pipeline error: {e}")
    
    if is_url and images:
        try:
            results = await detect_deepfakes(images[:3])
            for r in results:
                await q.put(("deepfake", r.model_dump()))
        except Exception as e:
            print(f"Deepfake Pipeline error: {e}")
            
    return {"full_text": text, "images": images}

async def node_extract(state: GraphState):
    q = state["queue"]
    text = state.get("full_text", state["input_value"])
    
    await q.put(("status", {"stage": "extracting", "progress": 0.05, "claims_total": 0, "claims_done": 0}))
    
    try:
        claims = await extract_claims(text)
    except Exception as e:
        claims = []
        await q.put(("error_event", {"type": "server_error", "message": f"Extraction failed: {e}", "graceful_verdict": "Unverifiable"}))
    
    seen = set()
    deduped = []
    for c in claims:
        t = c.text.lower()
        if t not in seen:
            seen.add(t)
            deduped.append(c)
            
    rank = {"temporal": 0, "entity": 1, "factual": 2, "opinion": 3}
    deduped.sort(key=lambda x: rank.get(x.type, 4))
    
    for c in deduped:
        await q.put(("claim", c.model_dump()))
        
    return {"claims": deduped, "evidence_map": {}, "verdicts": {}, "retries": {c.id: 0 for c in deduped}}

async def node_search(state: GraphState):
    q = state["queue"]
    claims = state["claims"]
    
    pending = [c for c in claims if c.status == "pending"]
    if not pending:
        return {}
        
    await q.put(("status", {"stage": "searching", "progress": 0.3, "claims_total": len(claims), "claims_done": 0}))
    
    for c in pending:
        await q.put(("claim", {**c.model_dump(), "status": "searching"}))
        
    try:
        ev_map = await run_searches_for_claims(pending)
    except Exception as e:
        ev_map = {}
        await q.put(("error_event", {"type": "server_error", "message": f"Search execution failed: {e}", "graceful_verdict": "Unverifiable"}))
    
    current_map = state.get("evidence_map", {})
    for cid, ev in ev_map.items():
        if cid in current_map:
            current_map[cid].extend(ev)
        else:
            current_map[cid] = ev
            
    return {"evidence_map": current_map}

async def node_verify(state: GraphState):
    q = state["queue"]
    claims = state["claims"]
    ev_map = state["evidence_map"]
    verdicts = state.get("verdicts", {})
    
    await q.put(("status", {"stage": "verifying", "progress": 0.6, "claims_total": len(claims), "claims_done": len(verdicts)}))
    
    for i, c in enumerate(claims):
        if c.id in verdicts and verdicts[c.id].confidence >= 0.6:
            continue
            
        ev = ev_map.get(c.id, [])
        try:
            v_result = await verify_claim(c, ev)
            verdicts[c.id] = v_result
            await q.put(("verdict", v_result.model_dump()))
        except Exception as e:
            fallback = VerificationResult(
                claim_id=c.id, verdict="Unverifiable", confidence=0.0,
                reasoning=f"Verification failed: {e}", sources=ev, conflicting=False
            )
            verdicts[c.id] = fallback
            await q.put(("error_event", {"claim_id": c.id, "type": "server_error", "message": str(e), "graceful_verdict": "Unverifiable"}))
            await q.put(("verdict", fallback.model_dump()))
            
        await q.put(("status", {"stage": "verifying", "progress": 0.6 + (0.3 * (i+1)/max(1, len(claims))), "claims_total": len(claims), "claims_done": i+1}))
        
    return {"verdicts": verdicts}

async def node_reflect(state: GraphState):
    q = state["queue"]
    claims = state["claims"]
    ev_map = state["evidence_map"]
    verdicts = state["verdicts"]
    retries = state.get("retries", {})
    
    needs_retry = False
    
    for c in claims:
        v = verdicts.get(c.id)
        r_count = retries.get(c.id, 0)
        
        if v and v.confidence < 0.6 and r_count < 2:
            needs_retry = True
            retries[c.id] = r_count + 1
            
            try:
                ref_resp = await generate_refined_query(c, v, ev_map.get(c.id, []))
                
                if ref_resp.get("retry"):
                    new_query = ref_resp.get("refined_query", "")
                    if not new_query: new_query = c.text
                    
                    new_ev = await search(new_query, c.id)
                    
                    existing = ev_map.get(c.id, [])
                    seen_urls = {e.url for e in existing}
                    for ne in new_ev:
                        if ne.url not in seen_urls:
                            existing.append(ne)
                    
                    ev_map[c.id] = existing
            except Exception as e:
                await q.put(("error_event", {"claim_id": c.id, "type": "server_error", "message": f"Reflection failed: {e}", "graceful_verdict": "Unverifiable"}))
            
    if needs_retry:
        return {"evidence_map": ev_map, "retries": retries}
        
    return {"retries": retries}

def route_reflect(state: GraphState):
    verdicts = state.get("verdicts", {})
    retries = state.get("retries", {})
    
    for cid, v in verdicts.items():
        if v.confidence < 0.6 and retries.get(cid, 0) < 2:
            return "verify"
            
    return END

workflow = StateGraph(GraphState)

workflow.add_node("preprocess", node_preprocess)
workflow.add_node("extract", node_extract)
workflow.add_node("search", node_search)
workflow.add_node("verify", node_verify)
workflow.add_node("reflect", node_reflect)

workflow.set_entry_point("preprocess")
workflow.add_edge("preprocess", "extract")
workflow.add_edge("extract", "search")
workflow.add_edge("search", "verify")
workflow.add_edge("verify", "reflect")
workflow.add_conditional_edges("reflect", route_reflect)

app_graph = workflow.compile()

async def run_pipeline(input_value: str, is_url: bool):
    q = asyncio.Queue()
    
    async def run_graph():
        try:
            await app_graph.ainvoke({
                "input_value": input_value,
                "is_url": is_url,
                "queue": q,
                "full_text": "",
                "images": [],
                "claims": [],
                "evidence_map": {},
                "verdicts": {},
                "retries": {}
            })
        except Exception as e:
            await q.put(("error_event", {"type": "search_failed", "message": f"Graph error: {e}", "graceful_verdict": "Unverifiable"}))
        finally:
            await q.put(None)
            
    task = asyncio.create_task(run_graph())
    
    while True:
        event = await q.get()
        if event is None:
            break
        event_type, data = event
        yield event_type, data
        
    await task
    yield "status", {"stage": "complete", "progress": 1.0, "claims_total": 0, "claims_done": 0}
