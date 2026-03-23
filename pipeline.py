import asyncio
from typing import Dict, List, Any, TypedDict
from langgraph.graph import StateGraph, START, END

from models import ClaimObject, EvidenceObject, VerificationResult, PipelineEvent
from agents.extractor import extract_claims
from agents.searcher import search_all_claims
from agents.verifier import verify_claim
from agents.reflector import reflect

class PipelineState(TypedDict):
    text: str
    claims: List[ClaimObject]
    evidence_map: Dict[str, List[EvidenceObject]]
    results: List[VerificationResult]
    retry_counts: Dict[str, int]
    current_claim_index: int
    events: List[Dict[str, Any]]

async def extract_node(state: PipelineState) -> PipelineState:
    events = list(state.get("events", []))
    events.append({"event": "status", "data": {"stage": "extracting", "progress": 0.0, "claims_total": 0, "claims_done": 0}})
    
    text = state.get("text", "")
    claims = await extract_claims(text)
    
    valid_claims = []
    for c in claims:
        if isinstance(c, dict) and c.get("event") == "error":
            events.append(c)
        else:
            valid_claims.append(c)
            events.append({"event": "claim", "data": c.model_dump()})
        
    return {
        "text": text,
        "claims": valid_claims,
        "evidence_map": dict(state.get("evidence_map", {})),
        "results": list(state.get("results", [])),
        "retry_counts": {c.id: 0 for c in claims},
        "current_claim_index": state.get("current_claim_index", 0),
        "events": events
    }

async def search_node(state: PipelineState) -> PipelineState:
    claims = state.get("claims", [])
    evidence_map = dict(state.get("evidence_map", {}))
    events = list(state.get("events", []))
    events.append({"event": "status", "data": {"stage": "searching", "progress": 0.2, "claims_total": len(claims), "claims_done": 0}})
    
    # Filter for claims missing from evidence_map to only search un-searched ones mapping to rules
    claims_to_search = [c for c in claims if c.id not in evidence_map]
            
    if claims_to_search:
        all_new_evidences = await search_all_claims(claims_to_search)
        
        for claim, ev_list in zip(claims_to_search, all_new_evidences):
            evidence_map[claim.id] = ev_list
            events.append({"event": "search_completed", "data": {"claim_id": claim.id, "evidence_count": len(ev_list)}})

    return {"evidence_map": evidence_map, "events": events} # type: ignore

async def verify_node(state: PipelineState) -> PipelineState:
    claims = state.get("claims", [])
    evidence_map = state.get("evidence_map", {})
    events = list(state.get("events", []))
    results = list(state.get("results", []))
    
    results_claim_ids = {r.claim_id for r in results}
    claims_total = len(claims)
    
    for c in claims:
        if c.id not in results_claim_ids:
            ev_list = evidence_map.get(c.id, [])
            res = await verify_claim(c, ev_list)
            
            if isinstance(res, dict) and res.get("event") == "error":
                events.append(res)
                continue
                
            results.append(res)
            events.append({"event": "verdict", "data": res.model_dump()})
            
            claims_done = len(results)
            events.append({
                "event": "status", 
                "data": {
                    "stage": "verifying", 
                    "progress": 0.2 + (0.8 * claims_done / claims_total) if claims_total > 0 else 1.0, 
                    "claims_total": claims_total, 
                    "claims_done": claims_done
                }
            })
            
    return {"results": results, "events": events} # type: ignore

async def reflect_node(state: PipelineState) -> PipelineState:
    claims = state.get("claims", [])
    results = list(state.get("results", []))
    retry_counts = dict(state.get("retry_counts", {}))
    evidence_map = dict(state.get("evidence_map", {}))
    events = list(state.get("events", []))
    
    new_results = []
    
    for res in results:
        c = next((claim for claim in claims if claim.id == res.claim_id), None)
        if c and res.needs_reflection:
            count = retry_counts.get(c.id, 0)
            reflection = await reflect(c, res, count)
            
            if reflection.get("retry") and count < 2:
                retry_counts[c.id] = count + 1
                refined_query = reflection.get("refined_query", "")
                
                # Append refined query directly contextually so searcher automatically uses it optimally
                if refined_query:
                    c.text = f"{c.text} (Refined Context: {refined_query})"
                
                # Pop evidence_map effectively flagging it for re-search in search_node
                if c.id in evidence_map:
                    del evidence_map[c.id]
                    
                events.append({"event": "retry", "data": {"claim_id": c.id, "retry_count": count + 1}})
                # Note: Not adding to new_results since it's going back to be completely re-verified
            else:
                res.needs_reflection = False
                new_results.append(res)
        else:
            new_results.append(res)
            
    if len(new_results) >= len(claims):
        claims_total = len(claims)
        events.append({
            "event": "status", 
            "data": {
                "stage": "complete", 
                "progress": 1.0, 
                "claims_total": claims_total, 
                "claims_done": claims_total
            }
        })

    return {
        "claims": claims,
        "results": new_results,
        "retry_counts": retry_counts,
        "evidence_map": evidence_map,
        "events": events
    } # type: ignore

def should_continue(state: PipelineState) -> str:
    claims = state.get("claims", [])
    results = state.get("results", [])
    
    if len(results) < len(claims):
        return "search_node"
        
    return END

# Instantiating Pipeline Graph
workflow = StateGraph(PipelineState)

# Adding defined nodes
workflow.add_node("extract_node", extract_node) # type: ignore
workflow.add_node("search_node", search_node) # type: ignore
workflow.add_node("verify_node", verify_node) # type: ignore
workflow.add_node("reflect_node", reflect_node) # type: ignore

# Routing execution paths
workflow.add_edge(START, "extract_node")
workflow.add_edge("extract_node", "search_node")
workflow.add_edge("search_node", "verify_node")
workflow.add_edge("verify_node", "reflect_node")

# Connecting routing edges conditionally
workflow.add_conditional_edges("reflect_node", should_continue)

app = workflow.compile()

async def run_pipeline(text: str, event_callback):
    """Executes the pipeline graph over an input text, firing Server-Sent Event callbacks on milestones."""
    state = {
        "text": text,
        "claims": [],
        "evidence_map": {},
        "results": [],
        "retry_counts": {},
        "current_claim_index": 0,
        "events": []
    }
    
    last_event_index = 0
    
    async for output in app.astream(state):
        node_name = list(output.keys())[0]
        current_state = output[node_name]
        
        events = current_state.get("events", [])
        
        # Fire Server-Sent Event callbacks for all un-yielded streamed events iteratively
        while last_event_index < len(events):
            await event_callback(events[last_event_index])
            last_event_index += 1
