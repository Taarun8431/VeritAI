import os
import json
import sys
from typing import List
from langchain_core.messages import SystemMessage, HumanMessage

sys.path.append(os.path.dirname(os.path.dirname(__file__)))
from models import ClaimObject, EvidenceObject, VerificationResult
from llm_manager import get_llm_response

SYSTEM_PROMPT = """You are a strict fact-verification engine. You receive a claim and evidence snippets retrieved from the web.

CRITICAL: Base your verdict ONLY on the provided evidence. Do NOT use your training data. If evidence is insufficient, output Unverifiable.

Verdict options: True, False, Partially True, Conflicting, Unverifiable, Temporally Uncertain

REQUIRED: In the reasoning field, you MUST name specific source titles.
Example: "According to ESPN Cricinfo and BBC Sport, India won the final."
Do NOT write "sources confirm" — name them explicitly.

Self-check before outputting:
1. Is my verdict supported by the evidence provided?
2. Am I using knowledge NOT in the evidence? If yes → Unverifiable
3. Do sources directly contradict each other? If yes → Conflicting
4. Is this a current-state claim (CEO, price, president, latest)? If yes → Temporally Uncertain

Output JSON ONLY:
{
  "verdict": "True|False|Partially True|Conflicting|Unverifiable|Temporally Uncertain",
  "confidence": 0.0,
  "reasoning": "Names specific source titles that support the verdict",
  "conflicting": false
}
"""

async def verify_claim(claim: ClaimObject, evidence: List[EvidenceObject]) -> VerificationResult:
    messages = [SystemMessage(content=SYSTEM_PROMPT)]
    ev_text = "\n\n".join([f"Source: {e.title}\nContent: {e.snippet}" for e in evidence])
    prompt = f"Claim: {claim.text}\nContext: {claim.anchor}\n\nEvidence:\n{ev_text}"
    messages.append(HumanMessage(content=prompt))
    
    try:
        content = await get_llm_response(messages, temp=0.0)
    except Exception as e:
        print(f"Verifier LLM Error: {e}")
        return VerificationResult(
            claim_id=claim.id, verdict="Unverifiable", confidence=0.0,
            reasoning=f"LLM Error: {e}", sources=evidence, conflicting=False
        )
        
    if content.startswith("```json"): content = content[7:-3].strip()
    elif content.startswith("```"): content = content[3:-3].strip()
        
    try:
        data = json.loads(content)
        verdict = data.get("verdict", "Unverifiable")
        if verdict not in ["True", "False", "Partially True", "Conflicting", "Unverifiable", "Temporally Uncertain"]:
            verdict = "Unverifiable"
            
        return VerificationResult(
            claim_id=claim.id, verdict=verdict, confidence=float(data.get("confidence", 0.0)),
            reasoning=str(data.get("reasoning", "")), sources=evidence, conflicting=bool(data.get("conflicting", False))
        )
    except Exception as e:
        print(f"Verifier parsing error: {e}\nContent was: {content}")
        return VerificationResult(
            claim_id=claim.id, verdict="Unverifiable", confidence=0.0,
            reasoning=f"Failed to parse LLM output: {e}", sources=evidence, conflicting=False
        )
