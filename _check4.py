import asyncio
from agents.extractor import extract_claims
from agents.searcher import search_claim
async def test():
    claims = await extract_claims('The Eiffel Tower is in Paris')
    if claims:
        evidence = await search_claim(claims[0])
        print(f'PASS: Found {len(evidence)} evidence items')
        if evidence:
            print(f'  First source: {evidence[0].title}')
            print(f'  Credibility: {evidence[0].credibility}')
            print(f'  URL: {evidence[0].url}')
asyncio.run(test())
