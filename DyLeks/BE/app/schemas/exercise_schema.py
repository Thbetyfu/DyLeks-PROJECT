"""
Exercise & Learning Schemas.
Kontrak data untuk pengambilan soal dan pengiriman jawaban dari Next.js.
"""

from pydantic import BaseModel
from typing import List, Optional, Any

# ==========================================
# [CATATAN UNTUK FE]: DATA SOAL
# ==========================================
class ExerciseResponse(BaseModel):
    """Data soal yang dikirim ke FE."""
    id: str
    level: int
    type: str
    content: Any # Bisa berupa object berisi {text: "", audio_url: "", options: []}
    
    class Config:
        from_attributes = True

# ==========================================
# [CATATAN UNTUK FE]: KIRIM JAWABAN
# ==========================================
class SubmitAnswerRequest(BaseModel):
    """Payload saat anak menjawab soal."""
    exercise_id: str
    answer: str
    response_time_ms: int

class SessionResultResponse(BaseModel):
    """Hasil akhir setelah sesi latihan selesai."""
    session_id: str
    correct_count: int
    wrong_count: int
    accuracy: float