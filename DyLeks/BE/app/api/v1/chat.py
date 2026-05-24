"""
Chat API Router.
Endpoint untuk interaksi real-time dengan AI Tutor.
"""

from fastapi import APIRouter, HTTPException
from app.schemas.chat_schema import ChatRequest, ChatResponse
from app.services.ollama_service import ollama_service

router = APIRouter()

@router.post("/", response_model=ChatResponse)
async def chat_with_tutor(payload: ChatRequest):
    """
    Endpoint untuk mengirim pesan anak ke AI Tutor lokal (Ollama).
    """
    if not payload.message:
        raise HTTPException(status_code=400, detail="Pesan tidak boleh kosong.")
    
    # Memanggil service secara asinkron
    ai_reply = await ollama_service.get_tutor_reply(payload.message)
    
    return ChatResponse(reply=ai_reply)