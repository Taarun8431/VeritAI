import asyncio
import json
import logging
import os

from google import genai
from groq import AsyncGroq

from models import ClaimObject
from search_manager import gemini_pool, groq_pool

EXTRACTOR_SYSTEM_PROMPT = (
    "You are an expert fact-checking analyst. Decompose input text into atomic "
    "independently verifiable claims. Rules: each claim must be verifiable alone "
    "with no pronouns or ambiguity. Preserve original meaning exactly. Do not "
    "combine two facts into one claim. Classify each claim as factual, temporal, "
    "entity, or opinion. Record the exact original sentence as anchor and the "
    "character start and end position in the original text as char_start and "
    "char_end. Do not extract opinions predictions or unverifiable statements. "
    "Think step by step: read the full text, identify every factual assertion, for "
    "each ask can this be verified by web search, if yes extract it. Output a JSON "
    'array only with no preamble. Schema: id (string, unique identifier like '
    '"claim-1", "claim-2"), text, type, anchor, char_start, char_end.'
)

VALID_CLAIM_TYPES = {"factual", "temporal", "entity", "opinion"}


async def call_llm(user_prompt: str, system_prompt: str) -> str:
    full_prompt = f"{system_prompt}\n\n{user_prompt}"

    gemini_key = gemini_pool.get_key()
    if gemini_key:
        try:
            client = genai.Client(api_key=gemini_key)
            loop = asyncio.get_running_loop()
            response = await asyncio.wait_for(
                loop.run_in_executor(
                    None,
                    lambda: client.models.generate_content(
                        model="gemini-2.0-flash",
                        contents=full_prompt,
                    ),
                ),
                timeout=15.0,
            )
            result = getattr(response, "text", "") or ""
            if result.strip():
                gemini_pool.mark_used(gemini_key)
                return result.strip()
        except asyncio.TimeoutError:
            logging.warning("[GEMINI] Timeout 15s - switching to Groq")
            gemini_pool.mark_rate_limited(gemini_key)
        except Exception as exc:
            err = str(exc)
            if "429" in err or "quota" in err.lower() or "exhausted" in err.lower():
                logging.warning("[GEMINI] Quota exhausted - switching to Groq")
            else:
                logging.error(f"[GEMINI] Error: {exc}")
            gemini_pool.mark_rate_limited(gemini_key)

    groq_key = groq_pool.get_key()
    if groq_key:
        try:
            client = AsyncGroq(api_key=groq_key)
            response = await asyncio.wait_for(
                client.chat.completions.create(
                    model="llama-3.3-70b-versatile",
                    messages=[
                        {"role": "system", "content": system_prompt},
                        {"role": "user", "content": user_prompt},
                    ],
                    max_tokens=1500,
                    temperature=0.1,
                ),
                timeout=20.0,
            )
            result = response.choices[0].message.content or ""
            if result.strip():
                groq_pool.mark_used(groq_key)
                return result.strip()
        except asyncio.TimeoutError:
            logging.warning("[GROQ] Timeout 20s")
            groq_pool.mark_rate_limited(groq_key)
        except Exception as exc:
            logging.error(f"[GROQ] Error: {exc}")
            groq_pool.mark_rate_limited(groq_key)

    logging.error("[call_llm] All LLM keys exhausted")
    return ""


async def extract_claims(text: str) -> list:
    if not text or not text.strip():
        return []

    truncated = text[:2000]
    user_prompt = f"Extract verifiable claims from this text:\n\n{truncated}"
    response = await call_llm(user_prompt, EXTRACTOR_SYSTEM_PROMPT)

    if not response:
        logging.error("[extract_claims] Empty LLM response")
        return []

    cleaned = response.strip()
    for fence in ["```json", "```JSON", "```"]:
        cleaned = cleaned.replace(fence, "")
    cleaned = cleaned.strip()

    start = cleaned.find("[")
    end = cleaned.rfind("]") + 1
    if start == -1 or end == 0:
        logging.error(f"[extract_claims] No JSON array found in: {cleaned[:200]}")
        return []

    json_str = cleaned[start:end]

    try:
        raw_claims = json.loads(json_str)
    except json.JSONDecodeError as exc:
        logging.error(f"[extract_claims] JSON parse error: {exc}")
        return []

    if not isinstance(raw_claims, list):
        logging.error("[extract_claims] Parsed payload is not a JSON array")
        return []

    claims = []
    for i, item in enumerate(raw_claims[:5]):
        try:
            if not isinstance(item, dict):
                raise TypeError("Claim item is not a JSON object")

            claim_text = str(item.get("text", "")).strip()
            if not claim_text:
                continue

            claim_type = str(item.get("type", "factual")).strip().lower() or "factual"
            if claim_type not in VALID_CLAIM_TYPES:
                claim_type = "factual"

            anchor = str(item.get("anchor", claim_text))
            char_start = int(item.get("char_start", 0))
            char_end = int(item.get("char_end", len(claim_text)))
            char_start = max(0, min(char_start, len(truncated)))
            char_end = max(char_start, min(char_end, len(truncated)))

            claim = ClaimObject(
                id=str(item.get("id", str(i + 1))),
                text=claim_text,
                type=claim_type,
                anchor=anchor,
                char_start=char_start,
                char_end=char_end,
                status="searching",
            )
            claims.append(claim)
        except Exception as exc:
            logging.error(f"[extract_claims] ClaimObject error item {i}: {exc}")
            continue

    logging.info(f"[extract_claims] Extracted {len(claims)} claims")
    return claims
