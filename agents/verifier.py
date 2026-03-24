import json
import logging
from typing import List

from agents.extractor import call_llm
from models import ClaimObject, EvidenceObject, VerificationResult

VERIFIER_SYSTEM_PROMPT = (
    "You are a strict fact-verification engine. You receive a claim and evidence "
    "snippets retrieved from the web. CRITICAL RULE: Base your verdict only on the "
    "provided evidence. Do not use training data knowledge. If evidence is "
    "insufficient output Unverifiable. Verdict options: True, False, Partially "
    "True, Conflicting, Unverifiable, Temporally Uncertain. REQUIRED: In your "
    "reasoning field you must name specific source titles that support your verdict. "
    "Example: According to ESPN Cricinfo and BBC Sport India won the final. Do not "
    "write vague justifications like sources confirm. Self-check before finalising: "
    "is my verdict supported by at least one evidence snippet? Am I using any "
    "knowledge not in the evidence - if yes change to Unverifiable. Do sources "
    "directly contradict each other - if yes set Conflicting. If the claim contains "
    "any of these words: current, now, latest, today, recently, is the, are the - "
    "and the evidence cannot confirm the present-day status, set the verdict to "
    "Temporally Uncertain and explain that this claim is time-sensitive and may have "
    "changed. Output JSON only: verdict, confidence as float 0 to 1, reasoning as "
    "string naming sources, conflicting as bool."
)

VALID_VERDICTS = [
    "True",
    "False",
    "Partially True",
    "Conflicting",
    "Unverifiable",
    "Temporally Uncertain",
]

VERDICT_MAP = {
    "true": "True",
    "false": "False",
    "partially true": "Partially True",
    "partial": "Partially True",
    "conflicting": "Conflicting",
    "conflict": "Conflicting",
    "unverifiable": "Unverifiable",
    "not verifiable": "Unverifiable",
    "temporally uncertain": "Temporally Uncertain",
    "temporal": "Temporally Uncertain",
}


def _reasoning_mentions_sources(reasoning: str, evidence: List[EvidenceObject]) -> bool:
    reasoning_lower = reasoning.lower()
    for item in evidence[:3]:
        title = item.title.split(" - ")[0].strip()
        if len(title) >= 4 and title.lower() in reasoning_lower:
            return True
    return False


async def verify_claim(claim: ClaimObject, evidence: List[EvidenceObject]) -> VerificationResult:
    try:
        if not evidence:
            return VerificationResult(
                claim_id=claim.id,
                verdict="Unverifiable",
                confidence=0.0,
                reasoning="No evidence found for this claim.",
                sources=[],
                conflicting=False,
            )

        evidence_text = ""
        for i, item in enumerate(evidence[:5]):
            evidence_text += (
                f"\nSource {i + 1}: {item.title}\n"
                f"URL: {item.url}\n"
                f"Snippet: {item.snippet[:300]}\n"
            )

        user_prompt = f"""CLAIM: {claim.text}

EVIDENCE:
{evidence_text}

Based ONLY on the above evidence, verify the claim. Output valid JSON only."""

        response = await call_llm(user_prompt, VERIFIER_SYSTEM_PROMPT)

        if not response or not response.strip():
            return VerificationResult(
                claim_id=claim.id,
                verdict="Unverifiable",
                confidence=0.0,
                reasoning="LLM returned empty response.",
                sources=evidence,
                conflicting=False,
            )

        cleaned = response.strip()
        for fence in ["```json", "```JSON", "```"]:
            cleaned = cleaned.replace(fence, "")
        cleaned = cleaned.strip()

        start = cleaned.find("{")
        end = cleaned.rfind("}") + 1
        if start == -1 or end == 0:
            raise ValueError(f"No JSON object found: {cleaned[:100]}")

        data = json.loads(cleaned[start:end])

        verdict = str(data.get("verdict", "Unverifiable")).strip()
        verdict = VERDICT_MAP.get(verdict.lower(), verdict)
        if verdict not in VALID_VERDICTS:
            verdict = "Unverifiable"

        try:
            confidence = float(data.get("confidence", 0.5))
        except (TypeError, ValueError):
            confidence = 0.5
        confidence = max(0.0, min(1.0, confidence))

        reasoning = str(data.get("reasoning", "")).strip()
        if not reasoning:
            reasoning = "The available evidence was insufficient for a detailed explanation."

        if evidence and not _reasoning_mentions_sources(reasoning, evidence):
            cited_titles = [
                item.title.split(" - ")[0].strip()
                for item in evidence[:2]
                if item.title.strip()
            ]
            if cited_titles:
                reasoning = f"According to {' and '.join(cited_titles)}, {reasoning}"

        conflicting_value = data.get("conflicting", False)
        if isinstance(conflicting_value, bool):
            conflicting = conflicting_value
        else:
            conflicting = str(conflicting_value).strip().lower() == "true"

        return VerificationResult(
            claim_id=claim.id,
            verdict=verdict,
            confidence=confidence,
            reasoning=reasoning,
            sources=evidence,
            conflicting=conflicting,
        )

    except Exception as exc:
        logging.error(f"[verify_claim] Error: {exc}")
        return VerificationResult(
            claim_id=claim.id,
            verdict="Unverifiable",
            confidence=0.0,
            reasoning=f"Verification error: {exc}",
            sources=evidence,
            conflicting=False,
        )
