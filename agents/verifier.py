import json
import logging
from typing import List, cast

from models import ClaimObject, EvidenceObject, VerificationResult
from agents.extractor import call_llm

VERIFIER_SYSTEM_PROMPT = 'You are a strict fact-verification engine. You receive a claim and evidence snippets retrieved from the web. CRITICAL RULE: Base your verdict only on the provided evidence. Do not use training data knowledge. If evidence is insufficient output Unverifiable. Verdict options: True, False, Partially True, Conflicting, Unverifiable, Temporally Uncertain. REQUIRED: In your reasoning field you must name specific source titles that support your verdict. Example: According to ESPN Cricinfo and BBC Sport India won the final. Do not write vague justifications like sources confirm. Self-check before finalising: is my verdict supported by at least one evidence snippet? Am I using any knowledge not in the evidence - if yes change to Unverifiable. Do sources directly contradict each other - if yes set Conflicting. If the claim contains any of these words: current, now, latest, today, recently, is the, are the — and the evidence cannot confirm the present-day status, set the verdict to Temporally Uncertain and explain that this claim is time-sensitive and may have changed. Output JSON only: verdict, confidence as float 0 to 1, reasoning as string naming sources, conflicting as bool.'

async def verify_claim(claim: ClaimObject, evidence: List[EvidenceObject]) -> VerificationResult:
    try:
        """Verifies a claim against gathered evidence using an LLM to assess validity."""
        # 1. Build user prompt
        prompt = f"Claim text: {claim.text}\nClaim type: {claim.type}\n\nEvidence Snippets:\n"
        if not evidence:
            prompt += "No evidence retrieved.\n"
        else:
            for i, ev in enumerate(evidence, 1):
                prompt += f"[{i}] Title: {ev.title}\nURL: {ev.url}\nCredibility: {ev.credibility}\nSnippet: {ev.snippet}\n\n"
                
        # 2. Call the LLM
        raw_response = await call_llm(prompt, VERIFIER_SYSTEM_PROMPT)
        
        # 3. Defaults
        verdict_val = "Unverifiable"
        confidence_val = 0.0
        reasoning_val = "Parse error or insufficient reasoning provided."
        conflicting_val = False
        
        # 4. Parse the JSON response securely
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
            
            # Robustly extract data
            if "verdict" in data and isinstance(data["verdict"], str):
                verdict_val = data["verdict"]
            if "confidence" in data:
                confidence_val = float(data["confidence"])
            if "reasoning" in data and isinstance(data["reasoning"], str):
                reasoning_val = data["reasoning"]
            if "conflicting" in data:
                conflicting_val = bool(data["conflicting"])
                
        except Exception as e:
            logging.error(f"Failed to parse or map verifier response: {e}")
            # Instead of returning dict, return proper VerificationResult
            return VerificationResult(
                claim_id=claim.id,
                verdict="Unverifiable",
                confidence=0.0,
                reasoning=f"Parse error: {str(e)}",
                sources=evidence,
                conflicting=False,
                needs_reflection=True
            )
            
        # 5. Build VerificationResult adding the reflection flag rule
        result = VerificationResult(
            claim_id=claim.id,
            verdict=cast("Literal['True', 'False', 'Partially True', 'Conflicting', 'Unverifiable', 'Temporally Uncertain']", verdict_val),
            confidence=confidence_val,
            reasoning=reasoning_val,
            sources=evidence,
            conflicting=conflicting_val,
            needs_reflection=(confidence_val < 0.6)  # Set flag based on > 60% confidence requirement
        )
        
        # Always ensure we return a VerificationResult object, never a plain dict
        if isinstance(result, dict):
            return VerificationResult(
                claim_id=claim.id,
                verdict=result.get("verdict", "Unverifiable"),
                confidence=float(result.get("confidence", 0.0)),
                reasoning=result.get("reasoning", "Could not verify."),
                sources=evidence,
                conflicting=result.get("conflicting", False),
                needs_reflection=True
            )
        return result
    except Exception as e:
        logging.error(f"[VERIFIER ERROR]: {e}")
        return VerificationResult(
            claim_id=claim.id,
            verdict="Unverifiable",
            confidence=0.0,
            reasoning=f"Verification failed due to error: {str(e)}",
            sources=evidence,
            conflicting=False,
            needs_reflection=True
        )
