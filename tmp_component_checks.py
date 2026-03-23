import asyncio

async def check3():
    from agents.extractor import extract_claims
    claims = await extract_claims("India won the 2024 T20 World Cup in Barbados")
    print(f"Check 3: Extracted {len(claims)} claims")
    if claims:
        print(f"  First claim: {claims[0].text}")
        print(f"  Type: {claims[0].type}")
        print(f"  char_start: {claims[0].char_start}, char_end: {claims[0].char_end}")

async def check4():
    from agents.extractor import extract_claims
    from agents.searcher import search_claim
    claims = await extract_claims("The Eiffel Tower is in Paris")
    if claims:
        evidence = await search_claim(claims[0])
        print(f"Check 4: Found {len(evidence)} evidence items")
        if evidence:
            print(f"  First source: {evidence[0].title}")
            print(f"  Credibility: {evidence[0].credibility}")
            print(f"  URL: {evidence[0].url}")
    else:
        print("Check 4: No claims extracted; search skipped")

async def check5():
    from agents.extractor import extract_claims
    from agents.searcher import search_claim
    from agents.verifier import verify_claim
    claims = await extract_claims("The Eiffel Tower is in Paris France")
    if claims:
        evidence = await search_claim(claims[0])
        result = await verify_claim(claims[0], evidence)
        print(f"Check 5: Verdict = {result.verdict}")
        print(f"  Confidence = {result.confidence}")
        print(f"  Reasoning = {result.reasoning[:80]}...")
        print(f"  Sources = {len(result.sources)}")
        print(f"  Conflicting = {result.conflicting}")
        valid_verdicts = ['True','False','Partially True','Conflicting','Unverifiable','Temporally Uncertain']
        print("  Verdict string VALID" if result.verdict in valid_verdicts else f"  ERROR: Invalid verdict string: {result.verdict}")
    else:
        print("Check 5: No claims extracted; verifier skipped")

async def check6():
    from pipeline import run_pipeline
    events = []
    async def callback(event):
        events.append(event)
        print(f"  Event: {event.get('event')} — {str(event.get('data', {}))[:60]}")
    await run_pipeline('NASA was founded in 1958', callback)
    status_events = [e for e in events if e.get('event') == 'status']
    verdict_events = [e for e in events if e.get('event') == 'verdict']
    claim_events = [e for e in events if e.get('event') == 'claim']
    print(f"Check 6: Pipeline complete")
    print(f"  Status events: {len(status_events)}")
    print(f"  Claim events: {len(claim_events)}")
    print(f"  Verdict events: {len(verdict_events)}")
    stages = [e['data'].get('stage') for e in status_events]
    print(f"  Stages seen: {stages}")
    print("  Pipeline reached COMPLETE stage — PASS" if 'complete' in stages else "  ERROR: Pipeline never reached complete stage")

async def main():
    await check3()
    await check4()
    await check5()
    await check6()

if __name__ == '__main__':
    asyncio.run(main())
