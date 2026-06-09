"""
Screening API Router untuk mesin skrining DyLeks.
Logika: 5-Level Adaptive Pedagogy dengan Dual-Engine AI.

Engine Priority:
  1. Gemini Vision (jika GEMINI_API_KEY tersedia) — lebih akurat untuk handwriting anak
  2. TrOCR Transformer (fallback offline penuh) — berjalan lokal tanpa internet
"""

import base64
import re
import os
from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from app.core.rate_limiter import upload_rate_limiter
from app.schemas.screening_schema import (
    ScreeningRequest, ScreeningResponse,
    ScreeningSessionSubmit, ScreeningSessionResponse
)
from app.core.database import get_db
from app.services.ollama_vision_service import analyze_dyslexia_image
from app.services.trocr_service import analyze_with_trocr
from app.services.scoring_service import ScoringService
from app.models.screening_session import ScreeningSession
from app.models.child_profile import ChildProfile

router = APIRouter()

def _classify_risk(score: float, target_letter: str) -> tuple[str, int, str]:
    """
    Memetakan skor risiko ke label, rekomendasi level (1-5), dan pesan umpan balik.

    Alasan ('Why'):
      Level 1-5 merepresentasikan 5 level kurikulum DyLeks yang berbeda (huruf tunggal
      sampai kata morfologi STEM). Pembagian skor ini memastikan rekomendasi adaptif
      yang konsisten antara hasil skrining dan modul latihan.
    """
    if score >= 75:
        return "Tinggi", 1, (
            f"Pola tulisan '{target_letter}' menunjukkan risiko disleksia tinggi. "
            "Mulai dari fondasi Level 1 untuk mengenali huruf dasar secara visual."
        )
    elif score >= 55:
        return "Sedang-Tinggi", 2, (
            f"Terdeteksi beberapa kesulitan pada '{target_letter}'. "
            "Level 2 akan membantu memperkuat suku kata sederhana."
        )
    elif score >= 35:
        return "Sedang", 3, (
            f"Ada sedikit inkonsistensi pada penulisan '{target_letter}'. "
            "Level 3 cocok untuk melatih suku kata yang lebih kompleks."
        )
    elif score >= 15:
        return "Rendah", 4, (
            f"Penulisan '{target_letter}' cukup baik! "
            "Level 4 akan mengasah kata dengan fonem digraf dan diftong."
        )
    else:
        return "Sangat Rendah", 5, (
            f"Luar biasa! Tulisan '{target_letter}' sangat tepat. "
            "Level 5 siap untuk kata morfologi STEM yang lebih panjang."
        )

@router.post("/upload", response_model=ScreeningResponse, dependencies=[Depends(upload_rate_limiter.check_rate_limit)])
async def analyze_handwriting(payload: ScreeningRequest, db: Session = Depends(get_db)):
    """
    Analisis tulisan tangan anak dengan Dual-Engine AI.
    Ollama Vision (primary, 100% offline) → TrOCR Transformer (fallback).
    """
    if not payload.image_base64:
        raise HTTPException(status_code=400, detail="Data gambar tidak terdeteksi.")

    # Bersihkan header data:image/jpeg;base64
    b64_data = re.sub(r'^data:image/.+;base64,', '', payload.image_base64)
    try:
        raw_bytes = base64.b64decode(b64_data)
    except Exception:
        raise HTTPException(status_code=400, detail="Format base64 gambar tidak valid.")

    result = None
    engine_used = "unknown"

    # --- Engine 1: Ollama Vision (Primary, Offline) ---
    disable_ollama = os.getenv("DISABLE_OLLAMA_VISION") == "true"
    if not disable_ollama:
        try:
            result = await analyze_dyslexia_image(raw_bytes, payload.target_letter)
            engine_used = result.get("engine", "ollama-vision")
            print(f"[Engine] {engine_used.upper()} | Target: {payload.target_letter} | Skor: {result['score']}")
        except Exception as e:
            print(f"[Engine] Ollama Vision gagal, fallback ke TrOCR: {e}")
            result = None
    else:
        print(f"[Engine] Ollama Vision dinonaktifkan via diagnostic (skip ke TrOCR).")


    # --- Engine 2: TrOCR Transformer (Fallback Offline) ---
    if result is None:
        try:
            result = await analyze_with_trocr(raw_bytes, payload.target_letter)
            engine_used = "trocr-transformer"
            print(f"[Engine] TROCR | Target: {payload.target_letter} | Skor: {result['score']}")
        except Exception as e:
            print(f"[Engine] TrOCR juga gagal: {e}")
            # Last resort: kembalikan skor netral
            result = {
                "score": 50.0,
                "errors": ["Mesin analisis tidak dapat membaca gambar. Pastikan tulisan jelas dan terkena cahaya."]
            }
            engine_used = "fallback-static"

    dynamic_score: float = result.get("score", 50.0)
    errors: list = result.get("errors", [])

    # Hapus errors jika skor aman (tidak perlu menampilkan pesan kesalahan)
    label, level, feedback_msg = _classify_risk(dynamic_score, payload.target_letter)
    if dynamic_score < 35:
        errors = []

    return ScreeningResponse(
        status="success",
        risk_score=round(dynamic_score, 1),
        risk_level=label,
        recommended_level=level,
        feedback=feedback_msg,
        detected_errors=errors
    )

@router.post("/submit-session", response_model=ScreeningSessionResponse)
def submit_screening_session(
    payload: ScreeningSessionSubmit,
    db: Session = Depends(get_db)
):
    """
    Menyimpan sesi skrining baru ke database dari online flow.
    Jika child_id disediakan, perbarui ChildProfile.
    """
    # Simpan ScreeningSession ke DB
    db_session = ScreeningSession(
        child_id=payload.child_id,
        risk_score=payload.risk_score,
        risk_level=payload.risk_level,
        recommended_level=payload.recommended_level,
        feedback=payload.feedback
    )
    db.add(db_session)

    # Jika child_id disediakan dan valid, perbarui ChildProfile
    if payload.child_id:
        child = db.query(ChildProfile).filter(ChildProfile.id == payload.child_id).first()
        if child:
            child.risk_score = payload.risk_score
            child.risk_level = payload.risk_level
            child.current_level = payload.recommended_level

    db.commit()
    db.refresh(db_session)

    return ScreeningSessionResponse(
        status="success",
        session_id=db_session.id,
        risk_score=db_session.risk_score,
        risk_level=db_session.risk_level,
        recommended_level=db_session.recommended_level,
        feedback=db_session.feedback
    )