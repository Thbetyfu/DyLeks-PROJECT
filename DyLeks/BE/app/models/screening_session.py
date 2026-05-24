"""
Screening Pydantic Schemas.
Mendefinisikan format JSON untuk input gambar tulisan tangan dan output hasil analisis.
"""

from pydantic import BaseModel
from typing import Optional

# ==========================================
# [CATATAN UNTUK FE]: FORMAT REQUEST (POST)
# ==========================================
class ScreeningRequest(BaseModel):
    """
    Payload yang harus dikirim FE saat anak selesai menulis.
    """
    child_id: Optional[str] = None  # Bisa None jika ini sesi coba-coba (belum login)
    image_base64: str               # String gambar dari canvas (contoh: "data:image/png;base64,iVBORw0KG...")

# ==========================================
# [CATATAN UNTUK FE]: FORMAT RESPONSE
# ==========================================
class ScreeningResponse(BaseModel):
    """
    Hasil balasan dari BE setelah gambar dianalisis oleh AI.
    """
    status: str
    risk_score: float        # Skor 0 - 100
    risk_label: str          # "Rendah", "Sedang", atau "Tinggi"
    recommended_level: int   # Rekomendasi level belajar (1-5)
    feedback_message: str    # Pesan ramah/saran untuk orang tua