import asyncio
import hashlib
import json
import os
from datetime import datetime, timezone
from typing import List, Optional

import aiosqlite
from dotenv import load_dotenv

load_dotenv()


class KeyPool:
    def __init__(self, keys: List[Optional[str]], daily_limit: int):
        self.keys = [key for key in keys if key is not None and key.strip()]
        self.daily_limit = daily_limit
        self.usage = {key: 0 for key in self.keys}
        self.exhausted = {key: False for key in self.keys}
        self.current_index = 0

    def get_key(self) -> Optional[str]:
        if not self.keys:
            return None

        start_index = self.current_index
        while True:
            key = self.keys[self.current_index]
            if not self.exhausted[key] and self.usage.get(key, 0) < self.daily_limit:
                self.current_index = (self.current_index + 1) % len(self.keys)
                return key

            self.current_index = (self.current_index + 1) % len(self.keys)
            if self.current_index == start_index:
                return None

    def mark_used(self, key: str) -> None:
        if key in self.usage:
            self.usage[key] += 1
            if self.usage[key] >= self.daily_limit:
                self.exhausted[key] = True

    def mark_rate_limited(self, key: str) -> None:
        if key in self.exhausted:
            self.exhausted[key] = True


tavily_pool = KeyPool(
    [os.getenv("TAVILY_KEY_1"), os.getenv("TAVILY_KEY_2"), os.getenv("TAVILY_KEY_3")],
    daily_limit=1000,
)
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
        await db.execute(
            """
            CREATE TABLE IF NOT EXISTS verification_history (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                mode TEXT NOT NULL,
                input_value TEXT NOT NULL,
                source_text TEXT NOT NULL,
                ai_score TEXT,
                deepfakes TEXT NOT NULL,
                claims TEXT NOT NULL,
                verdicts TEXT NOT NULL,
                accuracy INTEGER NOT NULL DEFAULT 0,
                duration_seconds REAL NOT NULL DEFAULT 0,
                status TEXT NOT NULL DEFAULT 'complete',
                created_at TEXT NOT NULL
            )
            """
        )
        await db.commit()


async def cache_get(query: str) -> Optional[list]:
    query_hash = hashlib.md5(query.encode("utf-8")).hexdigest()
    try:
        await _init_db()
        async with aiosqlite.connect(DB_PATH) as db:
            async with db.execute(
                "SELECT results FROM search_cache WHERE query_hash = ?",
                (query_hash,),
            ) as cursor:
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
                (query_hash, json.dumps(results)),
            )
            await db.commit()
    except Exception:
        pass


async def save_verification_history(
    *,
    mode: str,
    input_value: str,
    source_text: str,
    ai_score: Optional[dict],
    deepfakes: list,
    claims: list,
    verdicts: dict,
    accuracy: int,
    duration_seconds: float,
    status: str,
) -> None:
    cleaned_input = (input_value or "").strip()
    if not cleaned_input:
        return

    try:
        await _init_db()
        async with aiosqlite.connect(DB_PATH) as db:
            await db.execute(
                """
                INSERT INTO verification_history (
                    mode,
                    input_value,
                    source_text,
                    ai_score,
                    deepfakes,
                    claims,
                    verdicts,
                    accuracy,
                    duration_seconds,
                    status,
                    created_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """,
                (
                    mode,
                    cleaned_input,
                    source_text or cleaned_input,
                    json.dumps(ai_score) if ai_score else None,
                    json.dumps(deepfakes),
                    json.dumps(claims),
                    json.dumps(verdicts),
                    int(max(0, accuracy)),
                    max(0.0, float(duration_seconds or 0.0)),
                    status or "complete",
                    datetime.now(timezone.utc).isoformat(),
                ),
            )
            await db.commit()
    except Exception:
        pass


async def get_verification_history(limit: int = 10) -> list:
    safe_limit = max(1, min(int(limit or 10), 25))
    try:
        await _init_db()
        async with aiosqlite.connect(DB_PATH) as db:
            db.row_factory = aiosqlite.Row
            async with db.execute(
                """
                SELECT
                    id,
                    mode,
                    input_value,
                    source_text,
                    ai_score,
                    deepfakes,
                    claims,
                    verdicts,
                    accuracy,
                    duration_seconds,
                    status,
                    created_at
                FROM verification_history
                ORDER BY id DESC
                LIMIT ?
                """,
                (safe_limit,),
            ) as cursor:
                rows = await cursor.fetchall()
    except Exception:
        return []

    history = []
    for row in rows:
        history.append(
            {
                "id": row["id"],
                "mode": row["mode"],
                "input_value": row["input_value"],
                "source_text": row["source_text"],
                "ai_score": json.loads(row["ai_score"]) if row["ai_score"] else None,
                "deepfakes": json.loads(row["deepfakes"] or "[]"),
                "claims": json.loads(row["claims"] or "[]"),
                "verdicts": json.loads(row["verdicts"] or "{}"),
                "accuracy": row["accuracy"],
                "duration_seconds": row["duration_seconds"],
                "status": row["status"],
                "created_at": row["created_at"],
            }
        )
    return history


async def _do_tavily_search(query: str, key: str) -> list:
    import httpx

    async with httpx.AsyncClient() as client:
        response = await client.post(
            "https://api.tavily.com/search",
            json={
                "api_key": key,
                "query": query,
                "search_depth": "basic",
                "max_results": 3,
            },
            timeout=10.0,
        )
        response.raise_for_status()
        return response.json().get("results", [])


async def _do_serpapi_search(query: str) -> list:
    import httpx

    serp_key = os.getenv("SERPAPI_KEY")
    if not serp_key:
        raise ValueError("No SERPAPI_KEY")

    async with httpx.AsyncClient() as client:
        response = await client.get(
            "https://serpapi.com/search",
            params={"q": query, "api_key": serp_key, "engine": "google"},
            timeout=10.0,
        )
        response.raise_for_status()
        return response.json().get("organic_results", [])


async def _do_duckduckgo_search(query: str) -> list:
    from duckduckgo_search import AsyncDDGS

    async with AsyncDDGS() as ddgs:
        results = []
        async for item in ddgs.text(query, max_results=5):
            results.append(item)
        return results


async def search_with_fallback(query: str) -> list:
    try:
        cached = await cache_get(query)
        if cached is not None:
            return cached

        results = None

        tavily_key = tavily_pool.get_key()
        if tavily_key:
            try:
                results = await _do_tavily_search(query, tavily_key)
                tavily_pool.mark_used(tavily_key)
            except Exception as exc:
                if (
                    hasattr(exc, "response")
                    and exc.response is not None
                    and exc.response.status_code == 429
                ):
                    tavily_pool.mark_rate_limited(tavily_key)
                results = None

        if not results:
            try:
                results = await _do_serpapi_search(query)
            except Exception:
                results = None

        if not results:
            try:
                results = await asyncio.wait_for(_do_duckduckgo_search(query), timeout=2.0)
            except Exception:
                results = None

        if results is not None:
            await cache_set(query, results)
            return results

        return []
    except Exception:
        return []


init_cache = _init_db
