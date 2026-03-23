import asyncio
from agents.extractor import extract_claims
from agents.searcher import search_claim
from agents.verifier import verify_claim
async def test():
    claims = await extract_claims('The Eiffel Tower is in Paris France')
    if claims:
        evidence = await search_claim(claims[0])
        result = await verify_claim(claims[0], evidence)
        print(f'PASS: Verdict = {result.verdict}')
        print(f'  Confidence = {result.confidence}')
        print(f'  Reasoning = {result.reasoning[:80]}...')
        print(f'  Sources = {len(result.sources)}')
        print(f'  Conflicting = {result.conflicting}')
        valid_verdicts = ['True','False','Partially True','Conflicting','Unverifiable','Temporally Uncertain']
        if result.verdict in valid_verdicts:
            print(f'  Verdict string VALID')
        else:
            print(f'  ERROR: Invalid verdict string: {result.verdict}')
asyncio.run(test())
