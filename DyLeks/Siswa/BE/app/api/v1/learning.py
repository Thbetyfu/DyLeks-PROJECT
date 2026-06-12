"""
Learning API Router.
Menangani alur pengambilan soal latihan adaptif (Orton-Gillingham)
dan pengolahan skor sesi secara luring.
"""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.schemas.exercise_schema import ExerciseResponse, SubmitAnswerRequest, SubmitAnswerResponse
from app.services.adaptive_engine import AdaptiveEngine
from typing import List

router = APIRouter()

@router.get("/get-exercises/{level}", response_model=List[ExerciseResponse])
def get_exercises_by_level(level: int, db: Session = Depends(get_db)):
    """
    Mengambil daftar soal luring adaptif berdasarkan level anak (80% level aktif, 20% level dasar).
    """
    # Menggunakan dummy child_id untuk mode luring anonim
    exercises = AdaptiveEngine.get_next_exercises(db, child_id="anon_child", current_level=level, limit=10)
    return exercises

@router.post("/submit-answer", response_model=SubmitAnswerResponse)
def submit_answer(payload: SubmitAnswerRequest, db: Session = Depends(get_db)):
    """
    Menerima respons jawaban anak dan menilai ketepatan secara luring serta
    menghitung status kesulitan dinamis (DDS) secara real-time.
    
    Why session_id diteruskan: agar AdaptiveEngine bisa membaca riwayat jawaban
    beruntun langsung dari DB, bukan hanya dari state frontend yang ephemeral.
    """
    result = AdaptiveEngine.evaluate_answer(
        db=db,
        exercise_id=payload.exercise_id,
        user_answer=payload.answer,
        response_time_ms=payload.response_time_ms,
        grip_pressure=payload.grip_pressure,
        grip_tremor=payload.grip_tremor,
        grip_hesitation=payload.grip_hesitation,
        session_id=payload.session_id
    )
    
    if result["status"] == "error":
        raise HTTPException(status_code=404, detail=result["message"])
        
    return {
        "is_correct": result["is_correct"],
        "correct_answer": result["correct_answer"] if not result["is_correct"] else None,
        "feedback": result["feedback"],
        "dds_active": result["dds_active"],
        "dds_action": result["dds_action"],
        "dds_message": result["dds_message"],
        "reduced_options": result["reduced_options"],
        "consecutive_errors": result.get("consecutive_errors", 0)
    }