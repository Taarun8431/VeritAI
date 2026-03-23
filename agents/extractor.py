import asyncio
import json
import logging
import os
from typing import List

from google import genai
from google.genai import types
from groq import AsyncGroq

from models import ClaimObject
from search_manager import gemini_pool, groq_pool

EXTRACTOR_SYSTEM_PROMPT = 'You are an expert fact-checking analyst. Decompose input text into atomic independently verifiable claims. Rules: each claim must be verifiable alone with no pronouns or ambiguity. Preserve original meaning exactly. Do not combine two facts into one claim. Classify each claim as factual, temporal, entity, or opinion. Record the exact original sentence as anchor and the character start and end position in the original text as char_start and char_end. Do not extract opinions predictions or unverifiable statements. Think step by step: read the full text, identify every factual assertion, for each ask can this be verified by web search, if yes extract it. Output a JSON array only with no preamble. Schema: id (string, unique identifier like "claim-1", "claim-2"), text, type, anchor, char_start, char_end.'

async def call_llm(user_prompt: str, system_prompt: str) -> str:
    # Try Groq first — faster and quota not exhausted
    groq_key = groq_pool.get_key()
    if groq_key:
        try:
            client = AsyncGroq(api_key=groq_key)
            response = await asyncio.wait_for(
                client.chat.completions.create(
                    model="llama-3.1-8b-instant",
                    messages=[
                        {"role": "system", "content": system_prompt},
                        {"role": "user", "content": user_prompt}
                    ],
                    max_tokens=1000,
                    temperature=0.1
                ),
                timeout=20.0
            )
            groq_pool.mark_used(groq_key)
            return response.choices[0].message.content
        except asyncio.TimeoutError:
            logging.error("[GROQ]: Timeout — trying Gemini")
            groq_pool.mark_rate_limited(groq_key)
        except Exception as e:
            logging.error(f"[GROQ ERROR]: {e}")
            groq_pool.mark_rate_limited(groq_key)

    # Fallback to Gemini
    gemini_key = gemini_pool.get_key()
    if gemini_key:
        try:
            from google import genai
            client = genai.Client(api_key=gemini_key)
            loop = asyncio.get_event_loop()
            response = await asyncio.wait_for(
                loop.run_in_executor(None, lambda: client.models.generate_content(
                    model="gemini-2.0-flash",
                    contents=f"{system_prompt}\n\n{user_prompt}",
                )),
                timeout=15.0
            )
            gemini_pool.mark_used(gemini_key)
            return response.text
        except asyncio.TimeoutError:
            logging.error("[GEMINI]: Timeout")
            gemini_pool.mark_rate_limited(gemini_key)
        except Exception as e:
            if "429" in str(e) or "quota" in str(e).lower():
                logging.error("[GEMINI]: Quota exhausted")
            else:
                logging.error(f"[GEMINI ERROR]: {e}")
            gemini_pool.mark_rate_limited(gemini_key)

    # Both failed
    logging.error("[CALL_LLM]: All LLM keys exhausted")
    return ""

def fallback_extract_claims(text: str) -> List[ClaimObject]:
    normalized = text.strip()
    if not normalized:
        return []
    # fallback to a single claim as last resort in no-LLM environments
    return [ClaimObject(
        id="fallback-1",
        text=normalized,
        type="factual",
        anchor=normalized,
        char_start=0,
        char_end=len(normalized) - 1
    )]


async def extract_claims(text: str) -> List[ClaimObject]:
    raw_response = await call_llm(text, EXTRACTOR_SYSTEM_PROMPT)
    
    if not raw_response:
        return fallback_extract_claims(text)

    # Attempt to gracefully parse the JSON response
    try:
        clean_response = raw_response.strip()
        # Remove typical Markdown code block wrappers if they exist
        if clean_response.startswith('```json'):
            clean_response = clean_response[7:]
        elif clean_response.startswith('```'):
            clean_response = clean_response[3:]
        if clean_response.endswith('```'):
            clean_response = clean_response[:-3]
        
        clean_response = clean_response.strip()
        
        # In case the model responds with any preamble before the first bracket
        if not clean_response.startswith('['):
            start_idx = clean_response.find('[')
            end_idx = clean_response.rfind(']')
            if start_idx != -1 and end_idx != -1:
                clean_response = clean_response[start_idx:end_idx + 1]

        data = json.loads(clean_response)
        
        if isinstance(data, list):
            claims = [ClaimObject(**item) for item in data]
            claims = claims[:4]  # max 4 claims for demo speed
            return claims
        elif isinstance(data, dict):
            # Sometimes LLMs wrap the array in an object (e.g., {"claims": [...]})
            for key, val in data.items():
                if isinstance(val, list):
                    claims = [ClaimObject(**item) for item in val]
                    claims = claims[:4]  # max 4 claims for demo speed
                    return claims
                    
        return fallback_extract_claims(text)
    except Exception as e:
        # Graceful failure on JSON decode or Pydantic validation error
        logging.error(f"Failed to parse or validate LLM response: {e}")
        return fallback_extract_claims(text)
