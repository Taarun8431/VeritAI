import asyncio
import logging
import json
from agents.extractor import extract_claims, call_llm
from models import ClaimObject
import os

logging.basicConfig(level=logging.ERROR)

async def test():
    text = "The UN Climate Report released in 2023 states that global temperatures have risen by 1.1 degrees Celsius above pre-industrial levels."
    print("Testing call_llm directly...")
    try:
        raw = await call_llm(text, "Extract facts into JSON array of ClaimObjects. Schema: id, text, type, anchor, char_start, char_end.")
        print("RAW LLM OUTPUT:")
        print(raw)
    except Exception as e:
        print(f"Call LLM error: {e}")
        
    print("--- Running extract_claims ---")
    try:
        claims = await extract_claims(text)
        print("CLAIMS LIST:", claims)
    except Exception as e:
        print(f"Extract claims error: {e}")

if __name__ == "__main__":
    asyncio.run(test())
