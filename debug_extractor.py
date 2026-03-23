import asyncio
import logging
from agents.extractor import extract_claims, call_llm
from models import ClaimObject
from search_manager import gemini_pool

logging.basicConfig(level=logging.DEBUG)

async def run_test():
    print("--- Starting Debug ---")
    print(f"Gemini keys loaded: {len(gemini_pool.keys)}")
    
    raw = await call_llm("India won the 2024 cup.", "Extract claims.")
    print("RAW RESPONSE:")
    print(raw)
    
    print("--- Running Full Extractor ---")
    claims = await extract_claims("India won the 2024 T20 World Cup final held in Barbados.")
    print("CLAIMS GENERATED:")
    print(claims)

if __name__ == "__main__":
    asyncio.run(run_test())
