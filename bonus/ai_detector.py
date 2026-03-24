from transformers import pipeline
from models import AIScoreResult
import asyncio

classifier = None

def get_classifier():
    global classifier
    if classifier is None:
        try:
            # Setup Model mapping required by specs
            classifier = pipeline("text-classification", model="Hello-SimpleAI/chatgpt-detector-roberta")
        except Exception as e:
            print(f"Failed to load AI text detector: {e}")
            return None
    return classifier

def _run_ai_detection(text: str) -> AIScoreResult:
    cls = get_classifier()
    if not cls:
        return AIScoreResult(
            probability=0.0,
            label="Likely human-written",
            model="Hello-SimpleAI/chatgpt-detector-roberta"
        )
        
    try:
        snippet = text[:1500] 
        results = cls(snippet)
        res = results[0]
        label_str = res["label"].lower()
        score = res["score"] * 100.0
        
        is_ai = "chatgpt" in label_str or "ai" in label_str
        
        return AIScoreResult(
            probability=score if is_ai else (100.0 - score),
            label="Likely AI-generated" if is_ai else "Likely human-written",
            model="Hello-SimpleAI/chatgpt-detector-roberta"
        )
    except Exception as e:
        print(f"AI text inference error: {e}")
        return AIScoreResult(
            probability=0.0,
            label="Likely human-written",
            model="error"
        )

async def detect_ai_text(text: str) -> AIScoreResult:
    return await asyncio.to_thread(_run_ai_detection, text)
