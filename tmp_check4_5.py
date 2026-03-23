import asyncio
from agents.extractor import extract_claims
from agents.searcher import search_claim
from agents.verifier import verify_claim

async def run():
    claims = await extract_claims('The Eiffel Tower is in Paris')
    print(f'Check4: Extracted {len(claims)} claims')
    if claims:
        evidence = await search_claim(claims[0])
        print(f'Check4: Found {len(evidence)} evidence items')
        if evidence:
            print('  First source:', evidence[0].title)
            print('  Credibility:', evidence[0].credibility)
            print('  URL:', evidence[0].url)

    if claims:
        evidence = await search_claim(claims[0])
        result = await verify_claim(claims[0], evidence)
        print('Check5: Verdict =', result.verdict)
        print('  Confidence =', result.confidence)
        print('  Reasoning =', result.reasoning[:80], '...')
        print('  Sources =', len(result.sources))
        print('  Conflicting =', result.conflicting)
        valid_verdicts = ['True', 'False', 'Partially True', 'Conflicting', 'Unverifiable', 'Temporally Uncertain']
        print('  Verdict string VALID' if result.verdict in valid_verdicts else f'  ERROR: Invalid verdict string: {result.verdict}')

asyncio.run(run())