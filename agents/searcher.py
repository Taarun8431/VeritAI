import sys
import os
import json
import asyncio
from typing import List, Dict
from langchain_core.messages import SystemMessage, HumanMessage

sys.path.append(os.path.dirname(os.path.dirname(__file__)))
from models import ClaimObject, EvidenceObject
from search_manager import search
from llm_manager import get_llm_response

QUERY_GENERATION_PROMPT = """Generate exactly 2 distinct search queries to verify or refute this claim.
Use different angles — not paraphrases of each other.
For temporal claims containing words like current/now/latest/is/are, append the current year to at least one query.
Keep each query under 8 words.
Output JSON array of exactly 2 strings only. No other text.
"""

async def generate_queries(claim: ClaimObject) -> List[str]:
    msgs = [
        SystemMessage(content=QUERY_GENERATION_PROMPT),
        HumanMessage(content=f"Claim: {claim.text}")
    ]
    try:
        content = await get_llm_response(msgs, temp=0.7)
        if content.startswith("```json"): content = content[7:-3].strip()
        elif content.startswith("```"): content = content[3:-3].strip()
        data = json.loads(content)
        if isinstance(data, list) and len(data) > 0:
            return [str(q) for q in data[:2]]
    except Exception as e:
        print(f"Query generation error: {e}")
    return [claim.text]

async def run_searches_for_claims(claims: List[ClaimObject]) -> Dict[str, List[EvidenceObject]]:
    async def _search_for_claim(claim: ClaimObject):
        try:
            queries = await generate_queries(claim)
            
            all_evidence = []
            for q in queries:
                evs = await search(q, claim.id)
                all_evidence.extend(evs)
                
            seen_urls = set()
            deduped = []
            for e in all_evidence:
                if e.url and e.url not in seen_urls:
                    seen_urls.add(e.url)
                    deduped.append(e)
                    
            return claim.id, deduped
        except Exception as e:
            print(f"Failure in search for claim {claim.id}: {e}")
            return claim.id, []
        
    tasks = [_search_for_claim(c) for c in claims if c.status == "pending"]
    if not tasks: return {}
        
    results = await asyncio.gather(*tasks, return_exceptions=True)
    
    evidence_map = {}
    for res in results:
        if isinstance(res, Exception):
            print(f"Search task raised exception: {res}")
            continue
        if len(res) == 2:
            evidence_map[res[0]] = res[1]
    return evidence_map
