import os
import json
import asyncio
import hashlib
from typing import List, Optional

import aiosqlite
from dotenv import load_dotenv

load_dotenv()

class KeyPool:
    def __init__(self, keys: List[Optional[str]], daily_limit: int):
        self.keys = [k for k in keys if k is not None and k.strip()]
        self.daily_limit = daily_limit
        self.usage = {k: 0 for k in self.keys}
        self.exhausted = {k: False for k in self.keys}
        self.current_index = 0

    def get_key(self) -> Optional[str]:
        if not self.keys:
            return None
        
        start_index = self.current_index
        while True:
            key = self.keys[self.current_index]
            if not self.exhausted[key] and self.usage.get(key, 0) < self.daily_limit:
                # Move to next for round-robin rotation
                self.current_index = (self.current_index + 1) % len(self.keys)
                return key
            
            # Check next key
            self.current_index = (self.current_index + 1) % len(self.keys)
            if self.current_index == start_index:
                # Checked all keys, none available
                return None

    def mark_used(self, key: str) -> None:
        if key in self.usage:
            self.usage[key] += 1
            if self.usage[key] >= self.daily_limit:
                self.exhausted[key] = True

    def mark_rate_limited(self, key: str) -> None:
        if key in self.exhausted:
            self.exhausted[key] = True

# Level instances
tavily_pool = KeyPool([k for k in [os.getenv("TAVILY_KEY_1"), os.getenv("TAVILY_KEY_2"), os.getenv("TAVILY_KEY_3")] if k is not None], daily_limit=1000)
gemini_pool = KeyPool([os.getenv("GEMINI_KEY_1"), os.getenv("GEMINI_KEY_2")], daily_limit=1500)
groq_pool = KeyPool([os.getenv("GROQ_KEY_1"), os.getenv("GROQ_KEY_2")], daily_limit=14400)

DB_PATH = "search_cache.db"

async def _init_db():
    async with aiosqlite.connect(DB_PATH) as db:
        await db.execute(
            """
            CREATE TABLE IF NOT EXISTS search_cache (
                query_hash TEXT PRIMARY KEY,
                results TEXT
            )
            """
        )
        await db.commit()

async def cache_get(query: str) -> Optional[list]:
    query_hash = hashlib.md5(query.encode("utf-8")).hexdigest()
    try:
        await _init_db()
        async with aiosqlite.connect(DB_PATH) as db:
            async with db.execute("SELECT results FROM search_cache WHERE query_hash = ?", (query_hash,)) as cursor:
                row = await cursor.fetchone()
                if row:
                    return json.loads(row[0])
    except Exception:
        pass
    return None

async def cache_set(query: str, results: list) -> None:
    query_hash = hashlib.md5(query.encode("utf-8")).hexdigest()
    try:
        await _init_db()
        async with aiosqlite.connect(DB_PATH) as db:
            await db.execute(
                "INSERT OR REPLACE INTO search_cache (query_hash, results) VALUES (?, ?)",
                (query_hash, json.dumps(results))
            )
            await db.commit()
    except Exception:
        pass

async def _do_tavily_search(query: str, key: str) -> list:
    import httpx
    async with httpx.AsyncClient() as client:
        resp = await client.post(
            "https://api.tavily.com/search",
            json={"api_key": key, "query": query, "search_depth": "basic"},
            timeout=10.0
        )
        resp.raise_for_status()
        return resp.json().get("results", [])

async def _do_serpapi_search(query: str) -> list:
    import httpx
    serp_key = os.getenv("SERPAPI_KEY")
    if not serp_key:
        raise ValueError("No SERPAPI_KEY")
    async with httpx.AsyncClient() as client:
        resp = await client.get(
            "https://serpapi.com/search",
            params={"q": query, "api_key": serp_key, "engine": "google"},
            timeout=10.0
        )
        resp.raise_for_status()
        return resp.json().get("organic_results", [])

async def _do_duckduckgo_search(query: str) -> list:
    from duckduckgo_search import AsyncDDGS
    async with AsyncDDGS() as ddgs:
        results = []
        async for r in ddgs.text(query, max_results=5):
            results.append(r)
        return results

async def search_with_fallback(query: str) -> list:
    try:
        # 1. Check cache first
        cached = await cache_get(query)
        if cached is not None:
            return cached

        results = None

        # 2. Try Tavily
        tavily_key = tavily_pool.get_key()
        if tavily_key:
            try:
                results = await _do_tavily_search(query, tavily_key)
                tavily_pool.mark_used(tavily_key)
            except Exception as e:
                # Basic check for 429 rate limit to mark the key properly
                if hasattr(e, "response") and e.response is not None and e.response.status_code == 429: # type: ignore
                    tavily_pool.mark_rate_limited(tavily_key)
                results = None

        # 3. Try SerpApi
        if not results:
            try:
                results = await _do_serpapi_search(query)
            except Exception:
                results = None

        # 4. Try DuckDuckGo
        if not results:
            try:
                await asyncio.sleep(2)
                results = await _do_duckduckgo_search(query)
            except Exception:
                results = None

        # 5. Cache and return if found
        if results is not None:
            await cache_set(query, results)
            return results

        return []
    except Exception:
        # Never raise an exception -- always return a list
        return []

init_cache = _init_db
