import json
import sys
import os
from typing import List
from langchain_core.messages import SystemMessage, HumanMessage

sys.path.append(os.path.dirname(os.path.dirname(__file__)))
from models import ClaimObject
from llm_manager import get_llm_response

SYSTEM_PROMPT = """You are an expert fact-checking analyst. Decompose input text into atomic, independently verifiable claims.

Rules:
1. Each claim must be verifiable alone — no pronouns, no ambiguity
2. Preserve original meaning exactly
3. Never combine two facts into one claim
4. Classify each as: factual / temporal / entity / opinion
5. Record the exact original sentence as anchor, plus char_start and char_end (character index in the original input text)
6. Skip opinions, predictions, and unverifiable statements

Think step by step:
- Read the full text
- Identify every factual assertion
- For each, ask "can this be verified by web search?"
- If yes, extract it

Output JSON array ONLY, no other text:
[{
  "id": "claim-1",
  "text": "...",
  "type": "factual|temporal|entity|opinion",
  "anchor": "exact original sentence",
  "char_start": 0,
  "char_end": 84,
  "verifiable": true
}]
"""

async def extract_claims(text: str) -> List[ClaimObject]:
    messages = [
        SystemMessage(content=SYSTEM_PROMPT),
        HumanMessage(content=text)
    ]
    
    try:
        content = await get_llm_response(messages, temp=0.1)
    except Exception as e:
        print(f"LLM Error in extraction: {e}")
        return []
        
    if content.startswith("```json"): content = content[7:-3].strip()
    elif content.startswith("```"): content = content[3:-3].strip()
        
    try:
        data = json.loads(content)
        claims = []
        for i, d in enumerate(data):
            if not d.get("verifiable", True):
                continue
                
            anchor = str(d.get("anchor", ""))
            char_start = int(d.get("char_start", 0))
            char_end = int(d.get("char_end", 0))
            
            snippet = text[char_start:char_end]
            if snippet != anchor:
                actual_start = text.find(anchor)
                if actual_start != -1:
                    char_start = actual_start
                    char_end = actual_start + len(anchor)
            
            c_type = d.get("type", "factual")
            if c_type not in ["factual", "temporal", "entity", "opinion"]:
                c_type = "factual"
                
            claims.append(ClaimObject(
                id=str(d.get("id", f"claim-{i+1}")),
                text=str(d.get("text", "")),
                type=c_type,
                anchor=anchor,
                char_start=char_start,
                char_end=char_end,
                status="pending"
            ))
        return claims
    except Exception as e:
        print(f"Extractor parsing error: {e}")
        return []
