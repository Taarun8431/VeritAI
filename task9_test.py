#!/usr/bin/env python3
import requests
import json
import time
import sys

def test_article(description, claim):
    print(f"\n🧪 Testing: {description}")
    print(f"Claim: {claim}")

    start_time = time.time()

    try:
        response = requests.post(
            "http://localhost:8000/verify",
            json={"claim": claim},
            headers={"Content-Type": "application/json"},
            timeout=120,  # Increased timeout
            stream=True
        )

        elapsed = time.time() - start_time

        if response.status_code == 200:
            # Read SSE stream
            content = ""
            for line in response.iter_lines():
                if line:
                    line_str = line.decode('utf-8')
                    if line_str.startswith('data: '):
                        content += line_str[6:] + "\n"

            # Parse the final result
            try:
                # Find the last complete JSON object
                lines = content.strip().split('\n')
                for line in reversed(lines):
                    if line.strip():
                        result = json.loads(line)
                        break

                verdict = result.get("verdict", "unknown")
                confidence = result.get("confidence", 0)

                print(f"⏱️  Time: {elapsed:.2f}s")
                print(f"Verdict: {verdict.upper()}")
                print(f"Confidence: {confidence}%")

                if elapsed <= 45:
                    print("✅ PASSED: Completed within 45 seconds")
                    return True
                else:
                    print("❌ FAILED: Exceeded 45 second limit")
                    return False
            except json.JSONDecodeError:
                print(f"❌ FAILED: Could not parse JSON response")
                print(f"Raw content: {content[:500]}...")
                return False
        else:
            print(f"❌ FAILED: HTTP {response.status_code}")
            print(f"Response: {response.text}")
            return False

    except Exception as e:
        elapsed = time.time() - start_time
        print(f"⏱️  Time: {elapsed:.2f}s")
        print(f"❌ FAILED: {str(e)}")
        return False

def main():
    print("🚀 TASK 9: Integration Testing - 4 Demo Articles")
    print("=" * 60)

    test_cases = [
        ("T20 Cricket", "Virat Kohli has scored 183 runs in T20 cricket"),
        ("False Claims", "The Earth is flat and NASA is hiding this fact"),
        ("Conflicting", "COVID-19 vaccines contain microchips for tracking"),
        ("Mixed Facts", "Albert Einstein failed mathematics in school")
    ]

    results = []
    for description, claim in test_cases:
        success = test_article(description, claim)
        results.append(success)
        time.sleep(2)  # Brief pause between tests

    print("\n" + "=" * 60)
    print("📊 TASK 9 RESULTS SUMMARY:")
    print(f"Passed: {sum(results)}/4 tests")

    if all(results):
        print("🎉 ALL TESTS PASSED - TASK 9 COMPLETE!")
        return 0
    else:
        print("⚠️  SOME TESTS FAILED - Check output above")
        return 1

if __name__ == "__main__":
    sys.exit(main())