import asyncio
import httpx
from bs4 import BeautifulSoup
from urllib.parse import urljoin
from transformers import pipeline
from PIL import Image
from io import BytesIO

try:
    detector = pipeline("image-classification", model="Wvolf/ViT_Deepfake_Detection")
except Exception:
    detector = None

async def extract_images_from_url_async(url: str) -> list:
    try:
        headers = {"User-Agent": "Mozilla/5.0"}
        async with httpx.AsyncClient() as client:
            response = await client.get(url, headers=headers, timeout=10)
        response.raise_for_status()
        
        soup = BeautifulSoup(response.content, "html.parser")
        images = []
        for img in soup.find_all("img"):
            src = img.get("src")
            if not src:
                continue
                
            abs_url = urljoin(url, src)
            low_url = abs_url.lower()
            
            if "icon" in low_url or "logo" in low_url or "avatar" in low_url or "emoji" in low_url:
                continue
            if low_url.endswith(".svg") or low_url.endswith(".gif") or low_url.startswith("data:"):
                continue
                
            images.append(abs_url)
            if len(images) >= 5:
                break
                
        return images
    except Exception:
        return []


def extract_images_from_url(url: str) -> list:
    try:
        loop = asyncio.get_event_loop()
    except RuntimeError:
        loop = None

    if loop and loop.is_running():
        # In an async event loop, return the coroutine so caller can await explicitly.
        return extract_images_from_url_async(url)

    return asyncio.run(extract_images_from_url_async(url))

async def detect_deepfake(image_url: str) -> dict:
    try:
        if detector is None:
            return None
            
        async with httpx.AsyncClient() as client:
            response = await client.get(image_url, timeout=10)
        response.raise_for_status()
        
        img = Image.open(BytesIO(response.content)).convert("RGB")
        result = detector(img)[0]
        
        score = result["score"]
        label = "FAKE" if score > 0.7 else "REAL"
        
        return {
            "image_url": image_url,
            "score": round(score, 3),
            "label": label,
            "type": "ai_generated"
        }
    except Exception:
        return None

async def scan_url_for_deepfakes(url: str) -> list:
    try:
        images = await extract_images_from_url(url)
        results = []
        for img_url in images:
            res = await detect_deepfake(img_url)
            if res is not None:
                results.append(res)
        return results
    except Exception:
        return []
