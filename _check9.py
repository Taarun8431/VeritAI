from bonus.ai_detector import detect_ai_text
result = detect_ai_text('The quick brown fox jumps over the lazy dog')
print(f'PASS: AI detector returned probability={result["probability"]}% label={result["label"]}')
