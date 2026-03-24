import httpx
from bs4 import BeautifulSoup
from urllib.parse import urljoin
from PIL import Image
from io import BytesIO
from typing import List
from transformers import pipeline
import asyncio
from models import DeepfakeResult

image_classifier = None

def get_image_classifier():
    global image_classifier
    if image_classifier is None:
        try:
            image_classifier = pipeline("image-classification", model="Wvolf/ViT_Deepfake_Detection")
        except Exception as e:
            print(f"Failed to load Deepfake detector model: {e}")
            return None
    return image_classifier

def extract_images_from_url(html: str, base_url: str) -> List[str]:
    soup = BeautifulSoup(html, "html.parser")
    images = []
    for img in soup.find_all("img"):
        src = img.get("src")
        if not src:
            continue
            
        if src.startswith("data:"):
            continue
            
        abs_url = urljoin(base_url, src)
        
        w = img.get("width")
        h = img.get("height")
        try:
            if (w and int(str(w).replace("px", "")) < 50) or (h and int(str(h).replace("px", "")) < 50):
                continue
        except:
            pass
            
        if abs_url not in images:
            images.append(abs_url)
            
    return images

def _run_deepfakes(img_urls: List[str]) -> List[DeepfakeResult]:
    cls = get_image_classifier()
    if not cls:
        return [DeepfakeResult(image_url=u, score=0.0, label="REAL", type="ai_generated") for u in img_urls]
        
    results_list = []
    for url in img_urls:
        try:
            resp = httpx.get(url, timeout=10, follow_redirects=True)
            resp.raise_for_status()
            img = Image.open(BytesIO(resp.content)).convert("RGB")
            
            preds = cls(img)
            fake_score = 0.0
            real_score = 0.0
            
            for p in preds:
                if "fake" in p["label"].lower():
                    fake_score = p["score"]
                else:
                    real_score = p["score"]
            
            is_fake = fake_score > 0.7
            if is_fake:
                df_type = "ai_generated" if fake_score > 0.9 else "face_swapped"
                label = "FAKE"
            else:
                df_type = "ai_generated"
                label = "REAL"
                
            results_list.append(DeepfakeResult(
                image_url=url, score=fake_score if is_fake else (real_score or (1.0 - fake_score)),
                label=label, type=df_type
            ))
        except Exception as e:
            print(f"Deepfake inference error on {url}: {e}")
            results_list.append(DeepfakeResult(
                image_url=url, score=0.0, label="REAL", type="ai_generated"
            ))
            
    return results_list

async def detect_deepfakes(image_urls: List[str]) -> List[DeepfakeResult]:
    if not image_urls: return []
    return await asyncio.to_thread(_run_deepfakes, image_urls)
