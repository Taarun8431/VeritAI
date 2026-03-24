from transformers import pipeline

try:
    classifier = pipeline("text-classification", model="Hello-SimpleAI/chatgpt-detector-roberta")
except Exception:
    classifier = None


def _heuristic_fallback(text: str) -> dict:
    snippet = (text or "").strip()[:512]
    if not snippet:
        return {
            "probability": 0.0,
            "label": "Likely human-written",
            "model": "heuristic-fallback",
        }

    words = [word for word in snippet.split() if word.strip()]
    unique_ratio = len({word.lower() for word in words}) / max(len(words), 1)
    avg_word_length = sum(len(word) for word in words) / max(len(words), 1)
    sentence_count = max(1, snippet.count(".") + snippet.count("!") + snippet.count("?"))
    avg_sentence_length = len(words) / sentence_count

    probability = 50.0
    if unique_ratio < 0.68:
        probability += 18
    if avg_sentence_length > 18:
        probability += 10
    if avg_word_length > 5.1:
        probability += 7
    if any(phrase in snippet.lower() for phrase in ["in conclusion", "overall,", "furthermore", "moreover"]):
        probability += 8

    probability = round(max(5.0, min(95.0, probability)), 1)
    label = "Likely AI-generated" if probability >= 50 else "Likely human-written"
    return {
        "probability": probability,
        "label": label,
        "model": "heuristic-fallback",
    }


def detect_ai_text(text: str) -> dict:
    try:
        if classifier is None:
            return _heuristic_fallback(text)

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
            "model": "chatgpt-detector-roberta",
        }
    except Exception:
        return _heuristic_fallback(text)
