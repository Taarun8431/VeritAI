import json
import logging
from typing import Dict, Any

from models import ClaimObject, VerificationResult
from agents.extractor import call_llm

REFLECTOR_SYSTEM_PROMPT = 'Review this verification result. Claim: {claim}. Verdict: {verdict}. Confidence: {confidence}. Evidence used: {evidence}. Ask yourself: is confidence below 0.6? Were the search queries too narrow? Would a different search angle find better evidence? If yes to any of these output JSON with retry as true and refined_query as a better search string. If no output JSON with retry as false.'

async def reflect(claim: ClaimObject, result: VerificationResult, retry_count: int) -> Dict[str, Any]:
    """Analyzes a VerificationResult to decide if another search iteration is necessary."""
    if retry_count >= 2:
        return {"retry": False, "refined_query": ""}
        
    # Compile the evidence into a readable block for the LLM
    evidence_text = "\n".join([f"- {src.title}: {src.snippet}" for src in result.sources]) if result.sources else "None"
    
    # Format the prompt using the exact exact string template required
    formatted_prompt = REFLECTOR_SYSTEM_PROMPT.format(
        claim=claim.text,
        verdict=result.verdict,
        confidence=result.confidence,
        evidence=evidence_text
    )
    
    # Pass generic user instruction, push the exact evaluated string into the main prompt requirement
    raw_response = await call_llm("Please review this verification result.", formatted_prompt)
    
    try:
        clean_response = raw_response.strip()
        if clean_response.startswith('```json'):
            clean_response = clean_response[7:]
        elif clean_response.startswith('```'):
            clean_response = clean_response[3:]
        if clean_response.endswith('```'):
            clean_response = clean_response[:-3]
        
        clean_response = clean_response.strip()
        
        if not clean_response.startswith('{'):
            start_idx = clean_response.find('{')
            end_idx = clean_response.rfind('}')
            if start_idx != -1 and end_idx != -1:
                clean_response = clean_response[start_idx:end_idx + 1]

        data = json.loads(clean_response)
        
        return {
            "retry": bool(data.get("retry", False)), 
            "refined_query": data.get("refined_query", "")
        }
        
    except Exception as e:
        logging.error(f"Failed to parse or map reflector response: {e}")
        return {"retry": False, "refined_query": ""}
