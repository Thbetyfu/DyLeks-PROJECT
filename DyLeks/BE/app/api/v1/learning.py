"""
Learning API Router.
Menangani alur pengambilan soal latihan dan pengolahan skor sesi.
"""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.exercise import Exercise, LearningSession
from app.schemas.exercise_schema import ExerciseResponse, SubmitAnswerRequest
from typing import List

router = APIRouter()

@router.get("/get-exercises/{level}", response_model=List[ExerciseResponse])
def get_exercises_by_level(level: int, db: Session = Depends(get_db)):
    """
    Mengambil daftar soal berdasarkan level anak.
    """
    exercises = db.query(Exercise).filter(Exercise.level == level).limit(10).all()
    if not exercises:
        # Jika belum ada soal di DB, kembalikan list kosong
        return []
    return exercises

@router.post("/submit-answer")
def submit_answer(payload: SubmitAnswerRequest, db: Session = Depends(get_db)):
    """
    Menerima jawaban anak dan mengecek kebenarannya.
    """
    exercise = db.query(Exercise).filter(Exercise.id == payload.exercise_id).first()
    if not exercise:
        raise HTTPException(status_code=404, detail="Soal tidak ditemukan.")

    is_correct = exercise.correct_answer.lower() == payload.answer.lower()
    
    # TODO: Simpan ke tabel ExerciseResponse untuk analisis progress
    
    return {
        "is_correct": is_correct,
        "correct_answer": exercise.correct_answer if not is_correct else None
    }