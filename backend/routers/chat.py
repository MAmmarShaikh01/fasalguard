import os
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

router = APIRouter()

class ChatRequest(BaseModel):
    message: str
    history: list[dict] = []
    last_diagnosis: dict | None = None

class ChatResponse(BaseModel):
    reply: str

_client = None
_SYSTEM_PROMPT = None

def _init():
    global _client, _SYSTEM_PROMPT

    api_key = os.environ.get("GROQ_API_KEY")
    if not api_key:
        return

    try:
        from groq import Groq

        from knowledge_base.plant_diseases import KNOWLEDGE_BASE
        knowledge_text = ""
        for entry in KNOWLEDGE_BASE:
            knowledge_text += (
                f"Disease: {entry['title']}\n"
                f"Crop: {entry['crop']}\n"
                f"Symptoms: {entry['symptoms']}\n"
                f"Organic Treatment: {entry['treatment_organic']}\n"
                f"Chemical Treatment: {entry['treatment_chemical']}\n"
                f"Prevention: {entry['prevention']}\n\n"
            )

        _client = Groq(api_key=api_key)

        _SYSTEM_PROMPT = f"""You are FasalGuard, an expert plant disease treatment assistant.
Answer questions about plant diseases using the knowledge base below.
Be specific, practical, and actionable.

KNOWLEDGE BASE:
{knowledge_text}

Rules:
- Recommend specific organic and chemical treatments when relevant
- Include dosage/preparation instructions when possible
- If you don't know something, say so honestly
- Keep responses concise but thorough
- Use plain text, not markdown formatting"""
    except ImportError:
        pass


_init()


@router.post("/api/chat", response_model=ChatResponse)
async def chat_with_bot(req: ChatRequest):
    if not req.message.strip():
        raise HTTPException(status_code=400, detail="Message cannot be empty")

    if _client is None:
        if not os.environ.get("GROQ_API_KEY"):
            msg = "The treatment assistant needs a GROQ_API_KEY. Set it in Hugging Face Space Settings → Repository Secrets."
        else:
            msg = "The treatment assistant failed to initialize. Check that 'groq' Python package is installed."
        return ChatResponse(reply=msg)

    diagnosis_context = ""
    if req.last_diagnosis:
        d = req.last_diagnosis
        disease = d.get("disease", "unknown").replace("_", " ").replace("___", " — ")
        conf = d.get("confidence", 0)
        sev = d.get("severity_percentage", 0)
        diagnosis_context = f"\nCurrent Diagnosis: {disease} (confidence: {conf:.1%}, severity: {sev:.1f}%)"

    messages = [{"role": "system", "content": _SYSTEM_PROMPT + diagnosis_context}]

    for msg in req.history[-6:]:
        role = "user" if msg.get("role") == "user" else "assistant"
        messages.append({"role": role, "content": msg.get("text", "")})

    messages.append({"role": "user", "content": req.message})

    try:
        completion = _client.chat.completions.create(
            model="llama3-70b-8192",
            messages=messages,
            temperature=0.3,
            max_tokens=1024,
        )
        return ChatResponse(reply=completion.choices[0].message.content)
    except Exception as e:
        return ChatResponse(reply=f"I encountered an error: {str(e)}")
