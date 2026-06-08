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

_chain = None

def _get_chain():
    global _chain
    if _chain is not None:
        return _chain

    api_key = os.environ.get("GROQ_API_KEY")
    if not api_key:
        return None

    try:
        from langchain_groq import ChatGroq
        from langchain.chains import create_retrieval_chain
        from langchain.chains.combine_documents import create_stuff_documents_chain
        from langchain.prompts import ChatPromptTemplate
        from langchain_community.vectorstores import Chroma
        from langchain_community.embeddings import FastEmbedEmbeddings
        from knowledge_base.plant_diseases import KNOWLEDGE_BASE

        texts = []
        for entry in KNOWLEDGE_BASE:
            chunk = f"Disease: {entry['title']}\nCrop: {entry['crop']}\nSymptoms: {entry['symptoms']}\nOrganic Treatment: {entry['treatment_organic']}\nChemical Treatment: {entry['treatment_chemical']}\nPrevention: {entry['prevention']}"
            texts.append(chunk)

        embedding = FastEmbedEmbeddings(model_name="BAAI/bge-small-en-v1.5")
        vectorstore = Chroma.from_texts(texts, embedding)
        retriever = vectorstore.as_retriever(search_kwargs={"k": 3})

        llm = ChatGroq(
            model="llama3-70b-8192",
            temperature=0.3,
            max_tokens=1024,
            api_key=api_key,
        )

        prompt = ChatPromptTemplate.from_messages([
            ("system", """You are FasalGuard, an expert plant disease treatment assistant. Answer questions about plant diseases using ONLY the provided context. Be specific, practical, and actionable.

Context: {context}

Current Diagnosis: {diagnosis}

Rules:
- Recommend specific organic and chemical treatments when relevant
- Include dosage/preparation instructions when possible
- If the user asks about their current diagnosis, prioritize that disease
- If you don't know something, say so honestly
- Keep responses concise but thorough
- Use plain text, not markdown formatting"""),
            ("human", "{input}"),
        ])

        chain = create_stuff_documents_chain(llm, prompt)
        _chain = create_retrieval_chain(retriever, chain)
    except Exception as e:
        _chain = None
        raise e

    return _chain


@router.post("/api/chat", response_model=ChatResponse)
async def chat_with_bot(req: ChatRequest):
    if not req.message.strip():
        raise HTTPException(status_code=400, detail="Message cannot be empty")

    chain = _get_chain()

    if chain is None:
        return ChatResponse(
            reply="The treatment assistant is not configured yet. Please set the GROQ_API_KEY environment variable on Railway. You can get a free key at https://console.groq.com"
        )

    diagnosis_text = "No recent diagnosis"
    if req.last_diagnosis:
        d = req.last_diagnosis
        disease = d.get("disease", "unknown").replace("_", " ").replace("___", " — ")
        conf = d.get("confidence", 0)
        sev = d.get("severity_percentage", 0)
        diagnosis_text = f"{disease} (confidence: {conf:.1%}, severity: {sev:.1f}%)"

    result = await chain.ainvoke({
        "input": req.message,
        "diagnosis": diagnosis_text,
    })

    return ChatResponse(reply=result["answer"])
