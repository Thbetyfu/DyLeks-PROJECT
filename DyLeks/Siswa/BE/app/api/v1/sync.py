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
from app.schemas.sync_schema import (
    SyncRequest, SyncResponse, SyncedSessionDetail,
    LearningBatchSyncRequest, LearningSyncResponse
)
from app.services.ollama_vision_service import analyze_dyslexia_image
from app.services.trocr_service import analyze_with_trocr
from app.services.scoring_service import ScoringService
from app.models.screening_session import ScreeningSession
from app.models.child_profile import ChildProfile
from app.models.exercise import Exercise, LearningSession, ExerciseResponse

router = APIRouter()

async def _process_image_ocr(image_base64: str, target_letter: str) -> dict:
    """
    Helper untuk memproses satu gambar base64 dengan OCR dual-engine.
    """
    b64_data = re.sub(r'^data:image/.+;base64,', '', image_base64)
    try:
        raw_bytes = base64.b64decode(b64_data)
        from app.services.image_processor import preprocess_handwriting
        raw_bytes = preprocess_handwriting(raw_bytes)
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


@router.post("/learning-batch", response_model=LearningSyncResponse)
async def sync_offline_learning_sessions(payload: LearningBatchSyncRequest, db: Session = Depends(get_db)):
    """
    Sinkronisasi batch riwayat latihan belajar luring ke database SQLite lokal server guru.
    
    Alasan ('Why'):
      Untuk PWA Offline-first, siswa mengerjakan latihan/game adaptif secara luring di perangkat HP mereka.
      Seluruh respons latihan diakumulasikan dan diunggah saat terhubung ke hotspot laptop guru di sekolah.
      Fungsi ini melakukan rekonsiliasi data dengan mencari relasi ke tabel 'exercises' berdasarkan target huruf/kata
      dan memperbarui tingkat level siswa aktif (current_level) pada tabel ChildProfile agar guru mendapat visualisasi ter-update.
    """
    child = db.query(ChildProfile).filter(ChildProfile.id == payload.child_id).first()
    if not child:
        raise HTTPException(status_code=404, detail="Siswa tidak ditemukan untuk disinkronisasikan.")

    synced_count = 0
    for session_payload in payload.sessions:
        # Cek duplikasi jika UUID sesi sudah ada di DB
        existing_session = db.query(LearningSession).filter(LearningSession.id == session_payload.id).first()
        if existing_session:
            continue

        # Parsing format ISO 8601 ke objek datetime Python secara aman
        from datetime import datetime
        try:
            start_dt = datetime.fromisoformat(session_payload.start_time.replace("Z", "+00:00"))
            end_dt = datetime.fromisoformat(session_payload.end_time.replace("Z", "+00:00")) if session_payload.end_time else start_dt
        except Exception:
            start_dt = datetime.utcnow()
            end_dt = datetime.utcnow()

        db_session = LearningSession(
            id=session_payload.id,
            child_id=payload.child_id,
            start_time=start_dt,
            end_time=end_dt,
            total_score=session_payload.total_score
        )
        db.add(db_session)

        # Proses data detail respons soal latihan
        for resp in session_payload.responses:
            # Cari ID soal di bank soal DB luring berdasarkan kata target
            exercise_id = None
            matched_exercise = (
                db.query(Exercise)
                .filter(Exercise.correct_answer == resp.target.upper())
                .first()
            )
            if matched_exercise:
                exercise_id = matched_exercise.id

            db_response = ExerciseResponse(
                session_id=db_session.id,
                exercise_id=exercise_id,
                user_answer=resp.attempt,
                is_correct=resp.is_correct,
                response_time_ms=resp.response_time_ms
            )
            db.add(db_response)

        synced_count += 1

    # Perbarui level siswa pada tabel profile ke level terbaru
    child.current_level = max(child.current_level, payload.current_level)
    db.commit()

    return LearningSyncResponse(
        status="success",
        synced_count=synced_count
    )
