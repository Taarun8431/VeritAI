import asyncio, sys, os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from agents.extractor import extract_claims
from agents.searcher import search_claim
from agents.verifier import verify_claim

async def diagnose():
    test_claim = "The Eiffel Tower is located in Paris France"
    print(f"\nTEST CLAIM: {test_claim}")
    print("=" * 50)

    print("\nSTEP 1 — Extractor output:")
    claims = await extract_claims(test_claim)
    print(f"  Claims returned: {len(claims)}")
    if claims:
        c = claims[0]
        print(f"  text: {repr(c.text)}")
        print(f"  type: {repr(c.type)}")
        print(f"  anchor: {repr(c.anchor)}")

    print("\nSTEP 2 — Searcher output:")
    evidence = await search_claim(claims[0]) if claims else []
    print(f"  Evidence items: {len(evidence)}")
    for i, e in enumerate(evidence[:2]):
        print(f"  [{i}] title: {repr(e.title[:50])}")
        print(f"       url: {repr(e.url)}")
        print(f"       credibility: {repr(e.credibility)}")
        print(f"       snippet: {repr(e.snippet[:80])}")

    print("\nSTEP 3 — Verifier raw output:")
    if claims and evidence:
        result = await verify_claim(claims[0], evidence)
        print(f"  verdict: {repr(result.verdict)}")
        print(f"  confidence: {repr(result.confidence)}")
        print(f"  reasoning: {repr(result.reasoning[:100])}")
        print(f"  conflicting: {repr(result.conflicting)}")
        print(f"  sources count: {len(result.sources)}")

    print("\nSTEP 4 — Second test with FALSE claim:")
    false_claim = "The Eiffel Tower is located in Berlin Germany"
    claims2 = await extract_claims(false_claim)
    evidence2 = await search_claim(claims2[0]) if claims2 else []
    if claims2 and evidence2:
        result2 = await verify_claim(claims2[0], evidence2)
        print(f"  verdict: {repr(result2.verdict)}")
        print(f"  confidence: {repr(result2.confidence)}")
        print(f"  reasoning: {repr(result2.reasoning[:100])}")

    print("\nSTEP 5 — Third test with obvious TRUE claim:")
    true_claim = "NASA was founded in 1958"
    claims3 = await extract_claims(true_claim)
    evidence3 = await search_claim(claims3[0]) if claims3 else []
    if claims3 and evidence3:
        result3 = await verify_claim(claims3[0], evidence3)
        print(f"  verdict: {repr(result3.verdict)}")
        print(f"  confidence: {repr(result3.confidence)}")

    print("\n" + "=" * 50)
    print("DIAGNOSIS COMPLETE")

asyncio.run(diagnose())