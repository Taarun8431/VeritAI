import json
import asyncio
from typing import List, cast

from models import ClaimObject, EvidenceObject
from search_manager import search_with_fallback
from agents.extractor import call_llm

SEARCH_SYSTEM_PROMPT = 'Generate exactly 2 distinct search queries to verify or refute the given claim. Queries must approach the claim from different angles, not just paraphrase each other. For claims containing words like current, now, latest, or is, append the current year to at least one query. Keep each query under 8 words. Output a JSON array of exactly 2 strings only.'

def score_credibility(url: str) -> str:
    """Scores domain credibility based on specific sources and TLDs."""
    url_lower = url.lower()
    
    # High credibility
    high_domains = ['.gov', '.edu', 'bbc.com', 'reuters.com', 'apnews.com', 'theguardian.com']
    if any(domain in url_lower for domain in high_domains):
        return 'high'
        
    # Medium credibility (Known mid-tier news sites)
    mid_tier_domains = ['cnn.com', 'nytimes.com', 'wsj.com', 'washingtonpost.com', 'npr.org', 'bloomberg.com', 'cnbc.com', 'foxnews.com', 'usatoday.com']
    if any(domain in url_lower for domain in mid_tier_domains):
        return 'medium'
        
    # Low credibility
    return 'low'

async def search_claim(claim: ClaimObject) -> List[EvidenceObject]:
    """Generates queries for a claim, searches them concurrently, deduplicates, and scores."""
    # 1. Generate queries using LLM
    prompt = f"Claim text: {claim.text}\nClaim type: {claim.type}"
    raw_response = await call_llm(prompt, SEARCH_SYSTEM_PROMPT)
    
    queries = []
    try:
        clean_response = raw_response.strip()
        # Clean up markdown formatting if present
        if clean_response.startswith('```json'):
            clean_response = clean_response[7:]
        elif clean_response.startswith('```'):
            clean_response = clean_response[3:]
        if clean_response.endswith('```'):
            clean_response = clean_response[:-3]
        
        clean_response = clean_response.strip()
        
        # Fallback to extract array if prefixed by text
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
        # Fallback to the exact claim text if generation fails
        queries = [claim.text]
        
    if not queries:
        queries = [claim.text]
        
    # Enforce exactly exactly 2, just in case
    queries = queries[:2]
        
    # 2. Concurrently execute search_with_fallback for each query
    search_tasks = [search_with_fallback(q) for q in queries]
    results_list = await asyncio.gather(*search_tasks, return_exceptions=True)
    
    all_results = []
    for res in results_list:
        if isinstance(res, list):
            all_results.extend(res)
            
    # 3. Deduplicate results by URL
    seen_urls = set()
    unique_results = []
    for r in all_results:
        if not isinstance(r, dict):
            continue
            
        # Extract fields accommodating different search engines' output formats
        url = r.get('url') or r.get('link') or r.get('href', '')
        if not url or url in seen_urls:
            continue
            
        seen_urls.add(url)
        unique_results.append(r)
        
    # 4. Map to EvidenceObject and score credibility
    evidences = []
    for r in unique_results:
        url = r.get('url') or r.get('link') or r.get('href', '')
        title = r.get('title', '')
        snippet = r.get('content') or r.get('snippet') or r.get('body', '')
        published_date = r.get('published_date') or r.get('date')
        
        # Score credibility
        cred = score_credibility(url)
        
        evidence = EvidenceObject(
            claim_id=claim.id,
            url=url,
            title=title,
            snippet=snippet,
            credibility=cast("Literal['high', 'medium', 'low']", cred),
            published_date=published_date
        )
        evidences.append(evidence)
        
    return evidences

async def search_all_claims(claims: List[ClaimObject]) -> List[List[EvidenceObject]]:
    """Runs search_claim on all provided claims concurrently."""
    tasks = [search_claim(claim) for claim in claims]
    # Return a list of evidences for each claim
    return await asyncio.gather(*tasks)
