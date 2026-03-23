import asyncio
import json
import os
import sys
# Add root module path for script when executed from scripts/ directory.
ROOT_PATH = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
if ROOT_PATH not in sys.path:
    sys.path.insert(0, ROOT_PATH)
from search_manager import _init_db as init_cache, search_with_fallback
from agents.extractor import extract_claims, call_llm
from agents.searcher import SEARCH_SYSTEM_PROMPT

DEMO_ARTICLES = [
    "India won the 2024 T20 World Cup. The final was played in Barbados, West Indies. Rohit Sharma was the captain of the Indian team. India defeated South Africa in the final match. The tournament was hosted by West Indies and the United States.",
    "Elon Musk founded Apple in 1976. The iPhone was first released in 2010. Apple is headquartered in Seattle, Washington. Steve Jobs was the CEO of Microsoft. Apple became the first company to reach a 3 trillion dollar market cap in 2020.",
    "The global average temperature has risen by 1.5 degrees Celsius since pre-industrial times. Renewable energy now accounts for 90 percent of all new electricity generation worldwide. Electric vehicles outsold petrol cars globally in 2023. The Amazon rainforest absorbs more carbon than it emits.",
    "Virat Kohli made his international cricket debut in 2008. The Eiffel Tower is located in Paris, France. Python was created by Guido van Rossum in 1991. The current population of India is 2 billion people. NASA was founded in 1958. The Great Wall of China is visible from space with the naked eye."
]

async def main():
    await init_cache()
    
    for i, article in enumerate(DEMO_ARTICLES, 1):
        print(f"Warming article {i}/4...")
        claims = await extract_claims(article)
        
        for j, claim in enumerate(claims, 1):
            print(f"  claim {j}/{len(claims)}...")
            prompt = f"Claim text: {claim.text}\nClaim type: {claim.type}"
            
            raw_response = await call_llm(prompt, SEARCH_SYSTEM_PROMPT)
            
            queries = []
            try:
                clean_response = raw_response.strip()
                if clean_response.startswith('```json'):
                    clean_response = clean_response[7:]
                elif clean_response.startswith('```'):
                    clean_response = clean_response[3:]
                if clean_response.endswith('```'):
                    clean_response = clean_response[:-3]
                
                clean_response = clean_response.strip()
                if not clean_response.startswith('['):
                    start_idx = clean_response.find('[')
                    end_idx = clean_response.rfind(']')
                    if start_idx != -1 and end_idx != -1:
                        clean_response = clean_response[start_idx:end_idx + 1]
                        
                parsed = json.loads(clean_response)
                if isinstance(parsed, list):
                    queries = [str(q) for q in parsed]
                else:
                    queries = [claim.text]
            except Exception:
                queries = [claim.text]
            
            if not queries:
                queries = [claim.text]
                
            for index, query in enumerate(queries[:2]):
                await search_with_fallback(query)
                await asyncio.sleep(0.5)
                
        print("done.")
        
    print("Cache warmed successfully. Demo is safe to run.")

if __name__ == "__main__":
    import asyncio
    asyncio.run(main())
