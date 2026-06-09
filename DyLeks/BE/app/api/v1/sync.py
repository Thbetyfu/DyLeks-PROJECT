"""
Offline Sync Router.
Menangani sinkronisasi data batch skrining luring (offline-first) dari client PWA.
"""

import base64
import re
import os
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.core.rate_limiter import upload_rate_limiter
from typing import List

from app.core.database import get_db
from app.schemas.sync_schema import SyncRequest, SyncResponse, SyncedSessionDetail
from app.services.ollama_vision_service import analyze_dyslexia_image
from app.services.trocr_service import analyze_with_trocr
from app.services.scoring_service import ScoringService
from app.models.screening_session import ScreeningSession
from app.models.child_profile import ChildProfile

router = APIRouter()

async def _process_image_ocr(image_base64: str, target_letter: str) -> dict:
    """
    Helper untuk memproses satu gambar base64 dengan OCR dual-engine.
    """
    b64_data = re.sub(r'^data:image/.+;base64,', '', image_base64)
    try:
        raw_bytes = base64.b64decode(b64_data)
    except Exception:
        return {
            "score": 50.0,
            "errors": ["Format base64 gambar tidak valid."]
        }

    # --- Engine 1: Ollama Vision (Primary, Offline) ---
    disable_ollama = os.getenv("DISABLE_OLLAMA_VISION") == "true"
    if not disable_ollama:
        try:
            result = await analyze_dyslexia_image(raw_bytes, target_letter)
            if result:
                return result
        except Exception as e:
            print(f"[Sync Engine] Ollama Vision gagal: {e}")

    # --- Engine 2: TrOCR (Fallback Offline) ---
    try:
        result = await analyze_with_trocr(raw_bytes, target_letter)
        if result:
            return result
    except Exception as e:
        print(f"[Sync Engine] TrOCR gagal: {e}")

    # Fallback static jika semua gagal
    return {
        "score": 50.0,
        "errors": ["Gagal menganalisis gambar luring secara otomatis."]
    }

@router.post("/batch", response_model=SyncResponse, dependencies=[Depends(upload_rate_limiter.check_rate_limit)])
async def sync_offline_sessions(payload: SyncRequest, db: Session = Depends(get_db)):
    """
    Menerima beberapa sesi skrining luring, memproses gambar via AI OCR secara berurutan,
    menyimpan data sesi ke SQLite, dan memperbarui profil siswa terkait.
    """
    synced_sessions = []

    for session in payload.sessions:
        word_scores = []
        all_errors = []

        # Proses masing-masing kata dalam sesi luring
        for attempt in session.word_attempts:
            ocr_result = await _process_image_ocr(attempt.image_base64, attempt.target_letter)
            score = ocr_result.get("score", 50.0)
            errors = ocr_result.get("errors", [])
            
            word_scores.append(score)
            all_errors.extend(errors)

        if not word_scores:
            continue

        # Hitung rata-rata skor risiko sesi luring
        avg_risk = sum(word_scores) / len(word_scores)
        
        # Klasifikasi risiko sesi
        risk_label, rec_level = ScoringService.classify_risk_level(avg_risk)

        # Analisis tipe error dominan dari list pesan error
        # Memetakan pesan error kembali ke tipe error (sederhana)
        error_frequency = {}
        for err in all_errors:
            err_lower = err.lower()
            if "inversi" in err_lower:
                error_frequency["reversal"] = error_frequency.get("reversal", 0) + 1
            elif "hilang" in err_lower or "omission" in err_lower:
                error_frequency["omission"] = error_frequency.get("omission", 0) + 1
            elif "tambahan" in err_lower or "insertion" in err_lower:
                error_frequency["insertion"] = error_frequency.get("insertion", 0) + 1
            elif "terbalik" in err_lower or "transposition" in err_lower:
                error_frequency["transposition"] = error_frequency.get("transposition", 0) + 1
            else:
                error_frequency["substitution"] = error_frequency.get("substitution", 0) + 1

        dominant_error = max(error_frequency, key=error_frequency.get) if error_frequency else None
        
        # Ambil rekomendasi intervensi
        from app.services.fuzzy_matching import _get_intervention_recommendation
        feedback_msg = _get_intervention_recommendation(dominant_error, avg_risk)

        # Simpan sesi skrining ke basis data
        db_session = ScreeningSession(
            child_id=session.child_id,
            risk_score=avg_risk,
            risk_level=risk_label,
            recommended_level=rec_level,
            feedback=feedback_msg
        )
        db.add(db_session)

        # Perbarui profil anak jika ada child_id
        if session.child_id:
            child = db.query(ChildProfile).filter(ChildProfile.id == session.child_id).first()
            if child:
                child.risk_score = avg_risk
                child.risk_level = risk_label
                child.current_level = rec_level

        db.commit()
        db.refresh(db_session)

        synced_sessions.append(SyncedSessionDetail(
            client_id=session.id,
            db_id=db_session.id,
            risk_score=avg_risk,
            risk_level=risk_label,
            recommended_level=rec_level,
            feedback=db_session.feedback
        ))

    return SyncResponse(
        status="success",
        synced_count=len(synced_sessions),
        synced_sessions=synced_sessions
    )
