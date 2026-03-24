import os
import sqlite3
import hashlib
import json
import time
import asyncio
from datetime import datetime, timedelta
from typing import List, Dict, Optional
from urllib.parse import urlparse
from models import EvidenceObject, CredibilityLevel

try:
    from tavily import AsyncTavilyClient
except ImportError:
    AsyncTavilyClient = None

try:
    from google_search_results import GoogleSearchResults
except ImportError:
    GoogleSearchResults = None

try:
    from duckduckgo_search import DDGS
except ImportError:
    DDGS = None

class AllKeysExhausted(Exception):
    pass

class KeyPool:
    def __init__(self, env_var_prefix: str):
        self.keys = []
        base = os.getenv(f"{env_var_prefix}_API_KEY")
        if base: self.keys.append(base)
        for i in range(1, 10):
            k = os.getenv(f"{env_var_prefix}_API_KEY_{i}")
            if k: self.keys.append(k)
        
        self.current_idx = 0
        
    def get_key(self) -> str:
        if not self.keys: raise AllKeysExhausted(f"No keys for {self.__class__.__name__}")
        return self.keys[self.current_idx]
        
    def rotate(self):
        if not self.keys: return
        self.current_idx += 1
        if self.current_idx >= len(self.keys):
            raise AllKeysExhausted()

CACHE_DB = "search_cache.db"
TTL_HOURS = 24

def init_db():
    conn = sqlite3.connect(CACHE_DB)
    c = conn.cursor()
    c.execute('''
        CREATE TABLE IF NOT EXISTS search_cache (
            query_hash TEXT PRIMARY KEY,
            results JSON,
            created_at TIMESTAMP
        )
    ''')
    conn.commit()
    conn.close()

init_db()

def get_cached_results(query: str) -> Optional[List[dict]]:
    query_hash = hashlib.md5(query.encode()).hexdigest()
    conn = sqlite3.connect(CACHE_DB)
    c = conn.cursor()
    c.execute('SELECT results, created_at FROM search_cache WHERE query_hash=?', (query_hash,))
    row = c.fetchone()
    conn.close()
    
    if row:
        results_json, created_at_str = row
        try:
            created_at = datetime.fromisoformat(created_at_str)
            if datetime.now() - created_at < timedelta(hours=TTL_HOURS):
                return json.loads(results_json)
        except:
            pass
    return None

def save_to_cache(query: str, results: List[dict]):
    query_hash = hashlib.md5(query.encode()).hexdigest()
    conn = sqlite3.connect(CACHE_DB)
    c = conn.cursor()
    c.execute('''
        INSERT OR REPLACE INTO search_cache (query_hash, results, created_at)
        VALUES (?, ?, ?)
    ''', (query_hash, json.dumps(results), datetime.now().isoformat()))
    conn.commit()
    conn.close()

def assign_credibility(url: str) -> CredibilityLevel:
    try:
        parsed = urlparse(url)
        domain = parsed.netloc.lower()
    except:
        return "low"
    
    high_cred_domains = [".gov", ".edu", "wikipedia.org", "bbc.com", "nytimes.com", "reuters.com", "apnews.com", "espn.com", "npr.org", "wsj.com"]
    low_cred_domains = ["twitter.com", "x.com", "facebook.com", "reddit.com", "tiktok.com", "instagram.com", "youtube.com"]
    
    for hc in high_cred_domains:
        if hc in domain: return "high"
    for lc in low_cred_domains:
        if lc in domain: return "low"
    return "medium"

tavily_pool = KeyPool("TAVILY")
serpapi_pool = KeyPool("SERPAPI")

async def search(query: str, claim_id: str) -> List[EvidenceObject]:
    # 1. SQLite cache
    cached = get_cached_results(query)
    if cached is not None:
        objs = []
        for r in cached:
            objs.append(EvidenceObject(
                claim_id=claim_id, url=r.get("url",""), title=r.get("title",""),
                snippet=r.get("snippet",""), credibility=r.get("credibility","medium"),
                published_date=r.get("published_date")
            ))
        return objs

    raw_results = []
    
    # 2. Tavily fallback loop
    tavily_success = False
    while not tavily_success:
        try:
            api_key = tavily_pool.get_key()
            if not AsyncTavilyClient: raise Exception("Tavily client missing")
            client = AsyncTavilyClient(api_key=api_key)
            resp = await client.search(query=query, search_depth="basic", max_results=3)
            for r in resp.get("results", []):
                raw_results.append({
                    "url": r.get("url", ""), "title": r.get("title", ""),
                    "snippet": r.get("content", ""), "published_date": r.get("published_date", "")
                })
            tavily_success = True
        except AllKeysExhausted:
            break
        except Exception as e:
            msg = str(e).lower()
            if "429" in msg or "rate limit" in msg:
                try: tavily_pool.rotate()
                except AllKeysExhausted: break
            else:
                break
                
    # 3. SerpApi fallback
    if not tavily_success:
        serpapi_success = False
        while not serpapi_success:
            try:
                api_key = serpapi_pool.get_key()
                if not GoogleSearchResults: raise Exception("SerpApi missing")
                
                def run_serp():
                    search_obj = GoogleSearchResults({"q": query, "api_key": api_key, "num": 3})
                    res = search_obj.get_dict()
                    status = 200
                    if "error" in res and "Rate limit" in res["error"]:
                        status = 429
                    return res, status
                
                response, status_code = await asyncio.to_thread(run_serp)
                if status_code == 429:
                    try: serpapi_pool.rotate()
                    except: break
                    continue
                    
                for r in response.get("organic_results", []):
                    raw_results.append({
                        "url": r.get("link", ""), "title": r.get("title", ""),
                        "snippet": r.get("snippet", ""), "published_date": r.get("date", "")
                    })
                serpapi_success = True
            except AllKeysExhausted:
                break
            except Exception as e:
                break

    # 4. DuckDuckGo fallback
    if not tavily_success and not raw_results:
        try:
            if not DDGS: raise Exception("DDGS missing")
            await asyncio.sleep(2) # 2s sleep to avoid blocks
            def run_ddg():
                with DDGS() as ddgs: return list(ddgs.text(query, max_results=3))
            
            resp = await asyncio.to_thread(run_ddg)
            for r in resp:
                raw_results.append({
                    "url": r.get("href", ""), "title": r.get("title", ""),
                    "snippet": r.get("body", ""), "published_date": ""
                })
        except Exception as e:
            pass

    # Process and return
    evidence_list = []
    cache_store = []
    
    seen_urls = set()
    for r in raw_results:
        url = r.get("url")
        if not url or url in seen_urls: continue
        seen_urls.add(url)
        cred = assign_credibility(url)
        
        ev = EvidenceObject(
            claim_id=claim_id, url=url, title=r.get("title","")[:200],
            snippet=r.get("snippet","")[:500], credibility=cred,
            published_date=r.get("published_date") or None
        )
        evidence_list.append(ev)
        
        cache_store.append({
            "url": url, "title": r.get("title","")[:200],
            "snippet": r.get("snippet","")[:500], "credibility": cred,
            "published_date": r.get("published_date")
        })
        
    save_to_cache(query, cache_store)
    return evidence_list
