import asyncio
import json
import logging
from typing import Any, Callable, Dict, List, TypedDict

from langgraph.graph import END, START, StateGraph

from agents.extractor import extract_claims
from agents.reflector import reflect
from agents.searcher import search_all_claims
from agents.verifier import verify_claim
from models import ClaimObject, EvidenceObject, PipelineEvent, VerificationResult


class PipelineState(TypedDict, total=False):
    text: str
    claims: List[ClaimObject]
    evidence_map: Dict[str, List[EvidenceObject]]
    results: List[VerificationResult]
    retry_counts: Dict[str, int]
    events: List[Dict[str, Any]]
    _needs_retry: bool


async def extract_node(state: PipelineState) -> dict:
    events = list(state.get("events", []))
    events.append(
        {
            "event": "status",
            "data": {
                "stage": "extracting",
                "progress": 0.0,
                "claims_total": 0,
                "claims_done": 0,
            },
        }
    )

    claims = await extract_claims(state["text"])

    for claim in claims:
        events.append(
            {
                "event": "claim",
                "data": {
                    "id": claim.id,
                    "text": claim.text,
                    "type": claim.type,
                    "anchor": claim.anchor,
                    "char_start": claim.char_start,
                    "char_end": claim.char_end,
                    "status": "searching",
                },
            }
        )

    events.append(
        {
            "event": "status",
            "data": {
                "stage": "searching",
                "progress": 0.1,
                "claims_total": len(claims),
                "claims_done": 0,
            },
        }
    )

    return {"claims": claims, "events": events}


async def search_node(state: PipelineState) -> dict:
    claims = state["claims"]
    existing_map = dict(state.get("evidence_map", {}))
    retry_counts = dict(state.get("retry_counts", {}))
    events = list(state.get("events", []))

    claims_to_search = [
        claim
        for claim in claims
        if claim.id not in existing_map or retry_counts.get(claim.id, 0) > 0
    ]

    if claims_to_search:
        new_evidence = await search_all_claims(claims_to_search)
        existing_map.update(new_evidence)

    events.append(
        {
            "event": "status",
            "data": {
                "stage": "verifying",
                "progress": 0.3,
                "claims_total": len(claims),
                "claims_done": 0,
            },
        }
    )

    return {"evidence_map": existing_map, "events": events}


async def verify_node(state: PipelineState) -> dict:
    claims = state["claims"]
    evidence_map = state["evidence_map"]
    events = list(state.get("events", []))
    results: List[VerificationResult] = []

    if not claims:
        events.append(
            {
                "event": "status",
                "data": {
                    "stage": "complete",
                    "progress": 1.0,
                    "claims_total": 0,
                    "claims_done": 0,
                },
            }
        )
        return {"results": results, "events": events}

    tasks = []
    for claim in claims:
        evidence = evidence_map.get(claim.id, [])
        tasks.append(asyncio.create_task(verify_claim(claim, evidence)))

    for i, task in enumerate(asyncio.as_completed(tasks)):
        result = await task
        results.append(result)

        events.append(
            {
                "event": "verdict",
                "data": {
                    "claim_id": result.claim_id,
                    "verdict": result.verdict,
                    "confidence": result.confidence,
                    "reasoning": result.reasoning,
                    "conflicting": result.conflicting,
                    "sources": [
                        {
                            "url": source.url,
                            "title": source.title,
                            "snippet": source.snippet,
                            "credibility": source.credibility,
                        }
                        for source in result.sources[:4]
                    ],
                },
            }
        )

        progress = 0.3 + (0.65 * ((i + 1) / len(claims)))
        events.append(
            {
                "event": "status",
                "data": {
                    "stage": "verifying",
                    "progress": round(progress, 2),
                    "claims_total": len(claims),
                    "claims_done": i + 1,
                },
            }
        )

    events.append(
        {
            "event": "status",
            "data": {
                "stage": "complete",
                "progress": 1.0,
                "claims_total": len(claims),
                "claims_done": len(claims),
            },
        }
    )

    return {"results": results, "events": events}


async def reflect_node(state: PipelineState) -> dict:
    results = state.get("results", [])
    retry_counts = dict(state.get("retry_counts", {}))
    events = list(state.get("events", []))

    needs_retry = False
    for result in results:
        if result.confidence < 0.6 and retry_counts.get(result.claim_id, 0) < 2:
            retry_counts[result.claim_id] = retry_counts.get(result.claim_id, 0) + 1
            needs_retry = True

    return {
        "retry_counts": retry_counts,
        "events": events,
        "_needs_retry": needs_retry,
    }


def should_retry(state: PipelineState) -> str:
    needs_retry = state.get("_needs_retry", False)
    retry_counts = state.get("retry_counts", {})
    if needs_retry and any(value < 2 for value in retry_counts.values()):
        return "search_node"
    return END


graph = StateGraph(PipelineState)
graph.add_node("extract_node", extract_node)
graph.add_node("search_node", search_node)
graph.add_node("verify_node", verify_node)
graph.add_node("reflect_node", reflect_node)

graph.add_edge(START, "extract_node")
graph.add_edge("extract_node", "search_node")
graph.add_edge("search_node", "verify_node")
graph.add_edge("verify_node", "reflect_node")
graph.add_conditional_edges(
    "reflect_node",
    should_retry,
    {"search_node": "search_node", END: END},
)

app = graph.compile()


async def run_pipeline(text: str, event_callback: Callable) -> list:
    initial_state: PipelineState = {
        "text": text,
        "claims": [],
        "evidence_map": {},
        "results": [],
        "retry_counts": {},
        "events": [],
        "_needs_retry": False,
    }

    emitted_event_ids = set()
    final_results: List[VerificationResult] = []

    async for chunk in app.astream(initial_state):
        for node_state in chunk.values():
            if "events" in node_state:
                for event in node_state["events"]:
                    event_id = f"{event['event']}_{json.dumps(event['data'], sort_keys=True)}"
                    if event_id not in emitted_event_ids:
                        emitted_event_ids.add(event_id)
                        await event_callback(event)

            if "results" in node_state and node_state["results"]:
                final_results = node_state["results"]

    return final_results
