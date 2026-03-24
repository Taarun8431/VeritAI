import asyncio
import json
import logging
import time
from contextlib import asynccontextmanager
from typing import Any

import httpx
from bs4 import BeautifulSoup
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse

from pipeline import run_pipeline
from search_manager import get_verification_history, init_cache, save_verification_history


@asynccontextmanager
async def lifespan(app: FastAPI):
    await init_cache()
    yield


app = FastAPI(lifespan=lifespan)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


def _json_default(value: Any):
    if hasattr(value, "model_dump"):
        return value.model_dump()
    if hasattr(value, "dict"):
        return value.dict()
    return str(value)


def _compute_accuracy(verdicts: dict) -> int:
    values = list(verdicts.values())
    if not values:
        return 0

    weights = {
        "True": 1,
        "Partially True": 0.65,
        "Conflicting": 0.45,
        "Temporally Uncertain": 0.5,
        "Unverifiable": 0.3,
        "False": 0,
    }

    total = sum(weights.get(item.get("verdict"), 0.25) for item in values)
    return round((total / len(values)) * 100)


async def fetch_article_text(url: str) -> str:
    async with httpx.AsyncClient() as client:
        headers = {"User-Agent": "Mozilla/5.0"}
        response = await client.get(
            url,
            headers=headers,
            timeout=10.0,
            follow_redirects=True,
        )
        response.raise_for_status()

    soup = BeautifulSoup(response.text, "html.parser")
    paragraphs = soup.find_all("p")
    text = "\n".join(p.get_text(strip=True) for p in paragraphs)

    if not text:
        text = soup.get_text(separator="\n", strip=True)

    return text


@app.post("/verify")
async def verify(request: Request):
    body = await request.json()
    text = body.get("text", "")
    url = body.get("url", None)

    if url and not text:
        try:
            text = await fetch_article_text(url)
        except Exception as exc:
            logging.error(f"[SCRAPE] {exc}")
            text = ""

    async def event_generator():
        queue: asyncio.Queue = asyncio.Queue()
        pipeline_task = None
        started_at = time.perf_counter()
        ai_result = None
        deepfake_results = []
        claims_by_id = {}
        verdicts_by_id = {}
        history_status = "complete"

        async def persist_history():
            mode = "URL" if url else "TEXT"
            input_value = url if url else text
            await save_verification_history(
                mode=mode,
                input_value=input_value,
                source_text=text,
                ai_score=ai_result,
                deepfakes=deepfake_results,
                claims=list(claims_by_id.values()),
                verdicts=verdicts_by_id,
                accuracy=_compute_accuracy(verdicts_by_id),
                duration_seconds=time.perf_counter() - started_at,
                status=history_status,
            )

        try:
            try:
                from bonus.ai_detector import detect_ai_text

                ai_result = detect_ai_text(text[:512] if text else "")
                yield (
                    "data: "
                    f"{json.dumps({'event': 'ai_score', 'data': ai_result}, default=_json_default)}\n\n"
                )
            except Exception as exc:
                logging.error(f"[AI DETECTOR] {exc}")

            if url:
                try:
                    from bonus.deepfake import scan_url_for_deepfakes

                    deepfake_results = await scan_url_for_deepfakes(url)
                    for result in deepfake_results:
                        yield (
                            "data: "
                            f"{json.dumps({'event': 'deepfake', 'data': result}, default=_json_default)}\n\n"
                        )
                except Exception as exc:
                    logging.error(f"[DEEPFAKE] {exc}")

            if not text or not text.strip():
                history_status = "error"
                yield (
                    "data: "
                    f"{json.dumps({'event': 'error', 'data': {'claim_id': 'system', 'type': 'no_text', 'message': 'No text to verify'}})}\n\n"
                )
                await persist_history()
                return

            async def pipeline_callback(event):
                await queue.put(event)

            async def run():
                try:
                    await run_pipeline(text, pipeline_callback)
                except Exception as exc:
                    logging.error(f"[PIPELINE] {exc}")
                    nonlocal history_status
                    history_status = "error"
                    await queue.put(
                        {
                            "event": "error",
                            "data": {
                                "claim_id": "system",
                                "type": "pipeline",
                                "message": str(exc),
                            },
                        }
                    )
                finally:
                    await queue.put(None)

            pipeline_task = asyncio.create_task(run())

            while True:
                try:
                    event = await asyncio.wait_for(queue.get(), timeout=60.0)
                    if event is None:
                        break
                    if event.get("event") == "claim":
                        claims_by_id[event["data"]["id"]] = event["data"]
                    if event.get("event") == "verdict":
                        verdicts_by_id[event["data"]["claim_id"]] = event["data"]
                    if event.get("event") == "error":
                        history_status = "error"
                    yield f"data: {json.dumps(event, default=_json_default)}\n\n"
                except asyncio.TimeoutError:
                    logging.error("[SSE] Pipeline timeout 60s")
                    history_status = "error"
                    yield (
                        "data: "
                        f"{json.dumps({'event': 'error', 'data': {'claim_id': 'system', 'type': 'timeout', 'message': 'Pipeline timed out'}})}\n\n"
                    )
                    if pipeline_task and not pipeline_task.done():
                        pipeline_task.cancel()
                    break

            if pipeline_task:
                await asyncio.gather(pipeline_task, return_exceptions=True)

            await persist_history()

        except Exception as exc:
            logging.error(f"[SSE GENERATOR] {exc}")
            history_status = "error"
            yield (
                "data: "
                f"{json.dumps({'event': 'error', 'data': {'claim_id': 'system', 'type': 'fatal', 'message': str(exc)}})}\n\n"
            )
            await persist_history()

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
            "Access-Control-Allow-Origin": "*",
        },
    )


@app.get("/health")
async def health_endpoint():
    return {"status": "ok"}


@app.get("/scrape")
async def scrape_endpoint(url: str):
    try:
        text = await fetch_article_text(url)
        return {"text": text}
    except Exception as exc:
        return {"error": f"Failed to scrape URL: {exc}"}


@app.get("/history")
async def history_endpoint(limit: int = 10):
    return {"items": await get_verification_history(limit=limit)}


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=8000)
