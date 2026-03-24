import json
import httpx
from bs4 import BeautifulSoup
from fastapi import FastAPI, Request, Query, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sse_starlette.sse import EventSourceResponse
from typing import Optional

from pipeline import run_pipeline

app = FastAPI(title="VeritAI Backend")

origins = [
    "http://localhost:5173",
    "http://localhost:3000",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/health")
def health_check():
    return {"status": "ok"}

@app.get("/scrape")
async def scrape_url(url: str = Query(..., description="URL to scrape")):
    try:
        async with httpx.AsyncClient(timeout=10, follow_redirects=True) as client:
            resp = await client.get(url)
            resp.raise_for_status()
            soup = BeautifulSoup(resp.text, "html.parser")
            
            title = soup.title.string if soup.title else ""
            text_content = soup.get_text(separator=" ", strip=True)
            preview = text_content[:500] if text_content else ""
            
            return {
                "title": title.strip() if title else "",
                "preview": preview.strip(),
                "url": url
            }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.get("/verify")
async def verify_claim_endpoint(
    request: Request,
    text: Optional[str] = None,
    url: Optional[str] = None
):
    if not text and not url:
        raise HTTPException(status_code=400, detail="Must provide either 'text' or 'url' query parameter.")
        
    input_value = url if url else text
    is_url = bool(url)
    
    async def event_generator():
        try:
            async for event_type, data in run_pipeline(input_value, is_url):
                if await request.is_disconnected():
                    break
                
                if data is None:
                    continue
                    
                yield {
                    "event": event_type,
                    "data": json.dumps(data)
                }
        except Exception as e:
            yield {
                "event": "error_event",
                "data": json.dumps({
                    "type": "server_error",
                    "message": f"Pipeline crashed: {str(e)}",
                    "graceful_verdict": "Unverifiable"
                })
            }
            
    return EventSourceResponse(event_generator())
