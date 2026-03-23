import logging
logging.basicConfig(level=logging.ERROR)
import asyncio
from agents.extractor import extract_claims
async def test():
    claims = await extract_claims('India won the 2024 T20 World Cup in Barbados')
    print(f'PASS: Extracted {len(claims)} claims')
    if claims:
        print(f'  First claim: {claims[0].text}')
        print(f'  Type: {claims[0].type}')
        print(f'  char_start: {claims[0].char_start}, char_end: {claims[0].char_end}')
asyncio.run(test())
