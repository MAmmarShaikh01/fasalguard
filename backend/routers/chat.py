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

_llm = None
_system_prompt = None

def _setup():
    global _llm, _system_prompt

    api_key = os.environ.get("GROQ_API_KEY")
    if not api_key:
        return None

    try:
        from langchain_groq import ChatGroq
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

        _llm = ChatGroq(
            model="llama3-70b-8192",
            temperature=0.3,
            max_tokens=1024,
            api_key=api_key,
        )

        _system_prompt = f"""You are FasalGuard, an expert plant disease treatment assistant.
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
        return True
    except Exception:
        return None


@router.post("/api/chat", response_model=ChatResponse)
async def chat_with_bot(req: ChatRequest):
    if not req.message.strip():
        raise HTTPException(status_code=400, detail="Message cannot be empty")

    if _llm is None:
        ok = _setup()
        if not ok:
            status = "no_key" if not os.environ.get("GROQ_API_KEY") else "setup_error"
            if status == "no_key":
                msg = "The treatment assistant needs a GROQ_API_KEY. Set it in Hugging Face Space Settings → Repository Secrets."
            else:
                msg = "The treatment assistant is having trouble starting. This may be a temporary issue - please try again."
            return ChatResponse(reply=msg)

    diagnosis_context = ""
    if req.last_diagnosis:
        d = req.last_diagnosis
        disease = d.get("disease", "unknown").replace("_", " ").replace("___", " — ")
        conf = d.get("confidence", 0)
        sev = d.get("severity_percentage", 0)
        diagnosis_context = f"\nCurrent Diagnosis: {disease} (confidence: {conf:.1%}, severity: {sev:.1f}%)"

    history_text = ""
    for msg in req.history[-4:]:
        role = "User" if msg.get("role") == "user" else "Assistant"
        history_text += f"{role}: {msg.get('text', '')}\n"

    prompt = f"{_system_prompt}{diagnosis_context}\n\n{history_text}User: {req.message}\nAssistant:"

    try:
        result = _llm.invoke(prompt)
        return ChatResponse(reply=result.content)
    except Exception:
        return ChatResponse(reply="I encountered an error processing your request. Please try again.")
