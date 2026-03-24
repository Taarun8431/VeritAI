import asyncio
from io import BytesIO
from urllib.parse import urljoin

import httpx
from bs4 import BeautifulSoup
from PIL import Image
from transformers import pipeline

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
        return extract_images_from_url_async(url)

    return asyncio.run(extract_images_from_url_async(url))


async def detect_deepfake(image_url: str) -> dict:
    try:
        if detector is None:
            return {
                "image_url": image_url,
                "score": 0.0,
                "label": "REAL",
                "type": "ai_generated",
            }

        async with httpx.AsyncClient() as client:
            response = await client.get(image_url, timeout=10)
        response.raise_for_status()

        img = Image.open(BytesIO(response.content)).convert("RGB")
        predictions = detector(img)

        fake_score = 0.0
        real_score = 0.0
        for item in predictions:
            item_label = item.get("label", "").lower()
            if "fake" in item_label:
                fake_score = max(fake_score, float(item.get("score", 0.0)))
            else:
                real_score = max(real_score, float(item.get("score", 0.0)))

        score = fake_score or max(0.0, 1.0 - real_score)
        label = "FAKE" if score > 0.7 else "REAL"
        media_type = "ai_generated" if score > 0.9 else "face_swapped"

        return {
            "image_url": image_url,
            "score": round(score, 3),
            "label": label,
            "type": media_type if label == "FAKE" else "ai_generated",
        }
    except Exception:
        return {
            "image_url": image_url,
            "score": 0.0,
            "label": "REAL",
            "type": "ai_generated",
        }


async def scan_url_for_deepfakes(url: str) -> list:
    try:
        images = await extract_images_from_url_async(url)
        if not images:
            return []

        results = []
        for image_url in images:
            result = await detect_deepfake(image_url)
            if result is not None:
                results.append(result)
        return results
    except Exception:
        return []
