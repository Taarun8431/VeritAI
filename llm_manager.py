import os
import sys

sys.path.append(os.path.dirname(__file__))
from search_manager import KeyPool, AllKeysExhausted
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_groq import ChatGroq

gemini_pool = KeyPool("GEMINI")
groq_pool = KeyPool("GROQ")

async def get_llm_response(messages, temp=0.0) -> str:
    gemini_exhausted = False
    while not gemini_exhausted:
        try:
            api_key = gemini_pool.get_key()
            if not api_key: raise AllKeysExhausted()
            llm = ChatGoogleGenerativeAI(model="gemini-1.5-pro", temperature=temp, google_api_key=api_key)
            resp = await llm.ainvoke(messages)
            return resp.content.strip()
        except Exception as e:
            if isinstance(e, AllKeysExhausted) or "exhausted" in str(e).lower():
                gemini_exhausted = True
            else:
                try: gemini_pool.rotate()
                except AllKeysExhausted: gemini_exhausted = True

    groq_exhausted = False
    while not groq_exhausted:
        try:
            api_key = groq_pool.get_key()
            if not api_key: raise AllKeysExhausted()
            llm = ChatGroq(model="gemma2-9b-it", temperature=temp, api_key=api_key)
            resp = await llm.ainvoke(messages)
            return resp.content.strip()
        except Exception as e:
            if isinstance(e, AllKeysExhausted) or "exhausted" in str(e).lower():
                groq_exhausted = True
            else:
                try: groq_pool.rotate()
                except AllKeysExhausted: groq_exhausted = True

    raise Exception("All LLM providers and keys failed or exhausted.")
