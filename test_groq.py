import os
import asyncio
from groq import AsyncGroq
from dotenv import load_dotenv

load_dotenv()

async def test_groq():
    key = os.getenv("GROQ_KEY_1")
    print(f"Testing Groq with key starting with: {key[:10] if key else 'None'}")
    try:
        client = AsyncGroq(api_key=key)
        completion = await client.chat.completions.create(
            model="llama-3.1-8b-instant",
            messages=[{"role": "user", "content": "Hello"}],
            temperature=0.0
        )
        print("GROQ SUCCESS:")
        print(completion.choices[0].message.content)
    except Exception as e:
        print("GROQ FATAL ERROR:")
        print(str(e))

asyncio.run(test_groq())
