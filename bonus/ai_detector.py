from transformers import pipeline

try:
    classifier = pipeline("text-classification", model="Hello-SimpleAI/chatgpt-detector-roberta")
except Exception:
    classifier = None

def detect_ai_text(text: str) -> dict:
    try:
        if classifier is None:
            return {"probability": 0.0, "label": "Detection unavailable", "model": "error"}
        
        snippet = text[:512]
        result = classifier(snippet)[0]
        
        label = result["label"]
        if label == "Label_1" or label == "LABEL_1":
            mapped_label = "Likely AI-generated"
        else:
            mapped_label = "Likely human-written"
            
        probability = round(result["score"] * 100, 1)
        
        return {
            "probability": probability,
            "label": mapped_label,
            "model": "chatgpt-detector-roberta"
        }
    except Exception:
        return {"probability": 0.0, "label": "Detection unavailable", "model": "error"}
