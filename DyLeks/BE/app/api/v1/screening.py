"""
Screening API Router untuk mesin skrining DyLeks.
Logika: 5-Level Adaptive Pedagogy.
"""

import base64
import re
from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from app.schemas.screening_schema import ScreeningRequest, ScreeningResponse
from app.core.database import get_db
from app.services.trocr_service import analyze_with_trocr

router = APIRouter()

@router.post("/upload", response_model=ScreeningResponse)
async def analyze_handwriting(payload: ScreeningRequest, db: Session = Depends(get_db)):
    """
    Analisis dengan Mesin TrOCR (Transformer OCR).
    Deteksi tulisan tangan level kata dengan Fuzzy Matching.
    """
    try:
        if not payload.image_base64:
            raise HTTPException(status_code=400, detail="Data gambar tidak terdeteksi.")

        # Bersihkan header data:image/jpeg;base64
        b64_data = re.sub(r'^data:image/.+;base64,', '', payload.image_base64)
        raw_bytes = base64.b64decode(b64_data)
        
        # Eksekusi AI (Mesin Utama)
        result = await analyze_with_trocr(raw_bytes, payload.target_letter)
        
        dynamic_score = result["score"]
        errors = result["errors"]
        engine = result.get("engine", "trocr")
        debug = result.get("debug", {})

        print(f"[Engine] {engine.upper()} | Target: {payload.target_letter} | Skor: {dynamic_score}")

        # Klasifikasi Diagnostik & Rekomendasi Level
        if dynamic_score >= 80:
            label, level = "Tinggi", 1
            msg = f"Hasil menunjukkan risiko disleksia tinggi pada penulisan '{payload.target_letter}'. Mari mulai fondasi dari Level 1."
        elif dynamic_score >= 40:
            label, level = "Sedang", 2
            msg = f"Terdapat pola disleksia moderat. Kami merekomendasikan Level 2 untuk penguatan suku kata."
        else:
            label, level = "Rendah", 3
            msg = f"Sangat bagus! Anak sudah mampu menguasai '{payload.target_letter}' dengan stabil. Lanjutkan ke Level 3."
            errors = []

        return ScreeningResponse(
            status="success",
            risk_score=round(dynamic_score, 1),
            risk_level=label,
            recommended_level=level,
            feedback=msg,
            detected_errors=errors
        )

    except HTTPException as he:
        raise he
    except Exception as e:
        print(f"[API ERROR] {str(e)}")
        # If it's a decoding error or other error before TrOCR
        return ScreeningResponse(
            status="success",
            risk_score=50.0,
            risk_level="Sedang",
            recommended_level=1,
            feedback="Terjadi kesalahan internal saat membaca gambar.",
            detected_errors=[f"Kesalahan internal mesin TrOCR: {str(e)}"]
        )