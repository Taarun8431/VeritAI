#!/usr/bin/env python3
import asyncio
import sys
import os

# Add current directory to path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from agents.extractor import extract_claims

async def test_extractor():
    test_text = "Virat Kohli has scored 183 runs in T20 cricket"
    print(f"Testing extractor with: {test_text}")

    try:
        claims = await extract_claims(test_text)
        print(f"Extracted {len(claims)} claims:")
        for i, claim in enumerate(claims):
            print(f"  {i+1}. {claim.text} (type: {claim.type})")
        return len(claims) > 0
    except Exception as e:
        print(f"Error: {e}")
        return False

if __name__ == "__main__":
    success = asyncio.run(test_extractor())
    sys.exit(0 if success else 1)