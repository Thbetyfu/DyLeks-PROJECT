"""
Chat Pydantic Schemas.
Mendefinisikan kontrak data untuk interaksi antara anak dan AI Tutor.
"""

from pydantic import BaseModel
from typing import Optional

# ==========================================
# [CATATAN UNTUK FE]: FORMAT REQUEST CHAT
# ==========================================
class ChatRequest(BaseModel):
    """Payload pesan dari anak."""
    child_id: str
    message: str

# ==========================================
# [CATATAN UNTUK FE]: FORMAT RESPONSE CHAT
# ==========================================
class ChatResponse(BaseModel):
    """Respon dari AI Tutor lokal."""
    reply: str
    context_id: Optional[str] = None  # ID untuk melacak konteks percakapan jika diperlukan
    