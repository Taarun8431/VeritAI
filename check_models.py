import os
import google.generativeai as genai
from dotenv import load_dotenv

load_dotenv()
key1 = os.getenv("GEMINI_KEY_1")
key2 = os.getenv("GEMINI_KEY_2")

def check_key(key, name):
    if not key:
        return
    print(f"\n--- Checking {name} ---")
    genai.configure(api_key=key)
    try:
        models = list(genai.list_models())
        supported = [m.name for m in models if 'generateContent' in m.supported_generation_methods]
        print(f"Supported models: {supported}")
    except Exception as e:
        print(f"Error checking {name}: {e}")

check_key(key1, "GEMINI_KEY_1")
check_key(key2, "GEMINI_KEY_2")
