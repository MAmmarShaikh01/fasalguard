import os
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

router = APIRouter()

class ChatRequest(BaseModel):
    message: str
    history: list[dict] = []
    last_diagnosis: dict | None = None
    diagnosis_history: list[dict] = []

class ChatResponse(BaseModel):
    reply: str

_client = None
_SYSTEM_PROMPT = None

def _ensure_initialized():
    global _client, _SYSTEM_PROMPT
    if _client is not None:
        return True

    api_key = os.environ.get("GROQ_API_KEY")
    if not api_key:
        return False

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

        _SYSTEM_PROMPT = f"""You are FasalGuard, an AI plant disease diagnosis and treatment assistant. You ONLY answer questions about:

1. Plant disease identification, symptoms, and causes
2. Treatment recommendations (organic and chemical)
3. Prevention methods for plant diseases
4. Plant care (watering, sunlight, fertilizer)
5. Questions about the user's past scan results (history of diagnosed plants)
6. General agricultural and gardening advice related to plant health

STRICT RULES:
- If a question is NOT about plants, agriculture, gardening, or plant diseases, politely refuse: "I'm sorry, I can only answer questions about plants and plant diseases. Please ask me something about plant health or your scan results."
- Use the knowledge base below as your primary source. If information is not in the knowledge base, say so honestly.
- Recommend specific organic and chemical treatments when relevant
- Include dosage/preparation instructions when possible
- Keep responses concise but thorough
- Use plain text, not markdown formatting
- When the user asks about their scan history, reference the provided diagnosis history to answer

KNOWLEDGE BASE:
{knowledge_text}"""
        return True
    except ImportError:
        return False


@router.post("/api/chat", response_model=ChatResponse)
async def chat_with_bot(req: ChatRequest):
    if not req.message.strip():
        raise HTTPException(status_code=400, detail="Message cannot be empty")

    if not _ensure_initialized():
        if not os.environ.get("GROQ_API_KEY"):
            msg = "The treatment assistant needs a GROQ_API_KEY. Set it in Hugging Face Space Settings → Repository Secrets."
        else:
            msg = "The treatment assistant failed to initialize. Check that 'groq' Python package is installed."
        return ChatResponse(reply=msg)

    context_parts = []

    if req.last_diagnosis:
        d = req.last_diagnosis
        disease = d.get("disease", "unknown").replace("_", " ").replace("___", " — ")
        conf = d.get("confidence", 0)
        sev = d.get("severity_percentage", 0)
        context_parts.append(f"Current Diagnosis: {disease} (confidence: {conf:.1%}, severity: {sev:.1f}%)")

    if req.diagnosis_history:
        lines = ["\nPast Scan History:"]
        for i, diag in enumerate(req.diagnosis_history[-20:], 1):
            d_name = diag.get("disease", "unknown").replace("_", " ").replace("___", " — ")
            d_conf = diag.get("confidence", 0)
            d_sev = diag.get("severity_percentage", 0)
            d_time = diag.get("timestamp", 0)
            lines.append(f"  {i}. {d_name} (confidence: {d_conf:.1%}, severity: {d_sev:.1f}%)")
        context_parts.append("\n".join(lines))

    system_content = _SYSTEM_PROMPT
    if context_parts:
        system_content += "\n\n" + "\n".join(context_parts)

    messages = [{"role": "system", "content": system_content}]

    for msg in req.history[-6:]:
        role = "user" if msg.get("role") == "user" else "assistant"
        messages.append({"role": role, "content": msg.get("text", "")})

    messages.append({"role": "user", "content": req.message})

    try:
        completion = _client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=messages,
            temperature=0.3,
            max_tokens=1024,
        )
        return ChatResponse(reply=completion.choices[0].message.content)
    except Exception as e:
        return ChatResponse(reply=f"I encountered an error: {str(e)}")
