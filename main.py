import json
import asyncio
from typing import Optional
from contextlib import asynccontextmanager

import httpx
import uvicorn
from fastapi import FastAPI
from fastapi.responses import StreamingResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from bs4 import BeautifulSoup

from pipeline import run_pipeline
from search_manager import _init_db
# from bonus.ai_detector import detect_ai_text
# from bonus.deepfake import scan_url_for_deepfakes

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Start the cache database on startup via lifespan context manager
    await _init_db()
    yield

app = FastAPI(lifespan=lifespan)

# Enabling unhindered CORS for active development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class VerifyRequest(BaseModel):
    text: str = ""
    url: Optional[str] = None

async def fetch_article_text(url: str) -> str:
    """Scrapes paragraph data natively from a designated URL payload using BeautifulSoup."""
    async with httpx.AsyncClient() as client:
        # Standard header to respect endpoints and avoid basic blocks
        headers = {"User-Agent": "Mozilla/5.0"}
        response = await client.get(url, headers=headers, timeout=10.0, follow_redirects=True)
        response.raise_for_status()
        
        soup = BeautifulSoup(response.text, "html.parser")
        
        # Primarily scrape structured writing avoiding ad tags/navbars
        paragraphs = soup.find_all("p")
        text = "\n".join([p.get_text(strip=True) for p in paragraphs])
        
        if not text:
            # Global document fallback if P tags are missing
            text = soup.get_text(separator="\n", strip=True)
            
        return text

@app.post("/verify")
async def verify_endpoint(req: VerifyRequest):
    """Verifies a claim physically returning dynamic Server Sent Events continuously."""
    target_text = req.text
    
    # Optional URL override parsing
    if req.url:
        try:
            target_text = await fetch_article_text(req.url)
        except Exception as e:
            return {"error": f"Failed to scrape URL: {str(e)}"}
            
    if not target_text:
        return {"error": "No text provided to verify."}

    async def event_generator():
        # Step 1: Push foundational AI probabilities right immediately at start
        loop = asyncio.get_event_loop()
        # ai_result = await loop.run_in_executor(None, detect_ai_text, target_text)
        ai_result = {"ai_probability": 0.5, "human_probability": 0.5}  # dummy
        yield f"data: {json.dumps({'event': 'ai_score', 'data': ai_result})}\n\n"
        
        # Step 2: Intercept valid domains running exhaustive image synthesis pipelines
        if req.url is not None:
            # deepfakes = await scan_url_for_deepfakes(req.url)
            deepfakes = []  # dummy
            for df in deepfakes:
                yield f"data: {json.dumps({'event': 'deepfake', 'data': df})}\n\n"
                
        # Setup an async bridge queue connecting the independent pipeline run blocks to out-facing SSE yields
        event_queue = asyncio.Queue()
        
        async def event_callback(event: dict):
            await event_queue.put(event)
            
        async def run_worker():
            try:
                await run_pipeline(target_text, event_callback)
            finally:
                # Dispatch generic None/False block indicating completed transmission logic
                await event_queue.put(False)
                
        # Detach parallel execution
        task = asyncio.create_task(run_worker())
        
        while True:
            event = await event_queue.get()
            if event is False:
                break
                
            # Formatting as an SSE stream dictating rules: data: {payload}\n\n
            yield f"data: {json.dumps(event)}\n\n"
            
    return StreamingResponse(event_generator(), media_type="text/event-stream")

@app.get("/health")
async def health_endpoint():
    return {"status": "ok"}


@app.get("/scrape")
async def scrape_endpoint(url: str):
    try:
        text = await fetch_article_text(url)
        return {"text": text}
    except Exception as e:
        return {"error": f"Failed to scrape URL: {str(e)}"}

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
