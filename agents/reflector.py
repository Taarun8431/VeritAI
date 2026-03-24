import os
import sys
import json
from typing import List
from langchain_core.messages import SystemMessage, HumanMessage

sys.path.append(os.path.dirname(os.path.dirname(__file__)))
from models import ClaimObject, EvidenceObject, VerificationResult
from llm_manager import get_llm_response

SYSTEM_PROMPT = """Review the following verification result:
Claim: {claim}
Verdict: {verdict} (confidence: {confidence})
Evidence used: {snippets}

Ask yourself:
1. Is confidence below 0.6?
2. Were the search queries too narrow or ambiguous?
3. Is there a better angle to search from?

If yes to any: output { "retry": true, "refined_query": "better search query here" }
Otherwise: output { "retry": false }

JSON only.
"""

async def generate_refined_query(claim: ClaimObject, v_result: VerificationResult, previous_evidence: List[EvidenceObject]) -> dict:
    snippets = "\n".join([f"- {e.title}: {e.snippet}" for e in previous_evidence[:3]])
    prompt = SYSTEM_PROMPT.format(
        claim=claim.text,
        verdict=v_result.verdict if v_result else "None",
        confidence=str(v_result.confidence) if v_result else "0.0",
        snippets=snippets if snippets else "None"
    )
    
    messages = [HumanMessage(content=prompt)]
    
    try:
        content = await get_llm_response(messages, temp=0.7)
        if content.startswith("```json"): content = content[7:-3].strip()
        elif content.startswith("```"): content = content[3:-3].strip()
        
        data = json.loads(content)
        return {
            "retry": bool(data.get("retry", False)),
            "refined_query": str(data.get("refined_query", ""))
        }
    except Exception as e:
        print(f"Reflector error: {e}")
        return {"retry": False, "refined_query": ""}
