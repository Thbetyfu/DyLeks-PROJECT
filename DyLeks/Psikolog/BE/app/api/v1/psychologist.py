"""
Psychologist API Router.

Alasan ('Why'):
  Router ini mengelola seluruh aksi klinis dan medis profesional untuk peran Psikolog:
  1. Registrasi & Login akun Psikolog dengan pencatatan nomor STR.
  2. Mengambil seluruh rekam siswa (skor risiko, level) lintas guru.
  3. Mengambil riwayat detail kesalahan motorik tulisan tangan anak.
  4. Menuliskan diagnosis dan intervensi rujukan medis langsung.
"""
from fastapi import APIRouter, HTTPException, Depends, Header
from sqlalchemy.orm import Session
from typing import Optional, List

from app.core.database import get_db
from app.models.psychologist import Psychologist, PsychologistRecommendation
from app.models.child_profile import ChildProfile
from app.models.user import User
from app.models.screening_session import ScreeningSession
from app.schemas.psychologist_schema import (
    PsychologistCreate, PsychologistLogin, PsychologistResponse,
    RecommendationCreate, RecommendationResponse, StudentListResponse
)
from app.services.auth_service import (
    hash_password, verify_password,
    create_session_token, decode_session_token
)

router = APIRouter()


# ============================================================
# DEPENDENCY: Ekstrak psychologist_id dari header Authorization
# ============================================================
def get_current_psychologist(
    authorization: Optional[str] = Header(None),
    db: Session = Depends(get_db)
) -> Psychologist:
    """
    Dependency untuk memvalidasi token akses Psikolog yang sedang login.
    """
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Token otorisasi medis tidak ditemukan.")

    token = authorization.removeprefix("Bearer ").strip()
    payload = decode_session_token(token)

    if not payload:
        raise HTTPException(status_code=401, detail="Sesi medis tidak valid atau kadaluarsa.")

    psy = db.query(Psychologist).filter(Psychologist.id == payload["user_id"]).first()
    if not psy or not psy.is_active:
        raise HTTPException(status_code=401, detail="Akun psikolog tidak aktif atau tidak terdaftar.")

    return psy


# ============================================================
# AUTH ENDPOINTS FOR PSYCHOLOGIST
# ============================================================

@router.post("/register", response_model=PsychologistResponse, status_code=201)
def register_psychologist(payload: PsychologistCreate, db: Session = Depends(get_db)):
    """
    Mendaftarkan akun Psikolog baru lengkap dengan nomor STR dan klinik mitra.
    """
    existing = db.query(Psychologist).filter(Psychologist.username == payload.username).first()
    if existing:
        raise HTTPException(
            status_code=409,
            detail=f"Username '{payload.username}' sudah digunakan."
        )

    new_psy = Psychologist(
        full_name=payload.full_name,
        username=payload.username,
        hashed_password=hash_password(payload.password),
        license_number=payload.license_number,
        clinic_name=payload.clinic_name
    )
    db.add(new_psy)
    db.commit()
    db.refresh(new_psy)
    return new_psy


@router.post("/login")
def login_psychologist(payload: PsychologistLogin, db: Session = Depends(get_db)):
    """
    Melakukan verifikasi kredensial psikolog dan menerbitkan token otorisasi.
    """
    psy = db.query(Psychologist).filter(Psychologist.username == payload.username).first()
    if not psy or not verify_password(payload.password, psy.hashed_password):
        raise HTTPException(status_code=401, detail="Username atau password salah.")

    if not psy.is_active:
        raise HTTPException(status_code=403, detail="Akun dinonaktifkan.")

    token = create_session_token(psy.id)
    return {
        "access_token": token,
        "token_type": "bearer",
        "user": {
            "id": psy.id,
            "full_name": psy.full_name,
            "username": psy.username,
            "license_number": psy.license_number,
            "clinic_name": psy.clinic_name
        }
    }


@router.get("/me", response_model=PsychologistResponse)
def get_me(current_psy: Psychologist = Depends(get_current_psychologist)):
    """
    Mengambil data profil psikolog yang sedang login saat ini.
    """
    return current_psy


# ============================================================
# CLINICAL STUDENTS MONITORING ENDPOINTS
# ============================================================

@router.get("/students", response_model=List[StudentListResponse])
def list_clinical_students(
    db: Session = Depends(get_db),
    current_psy: Psychologist = Depends(get_current_psychologist)
):
    """
    Mengambil daftar seluruh siswa lintas guru untuk ditinjau oleh psikolog.
    Menampilkan status apakah siswa sudah mendapatkan saran medis/terapi.
    """
    students = db.query(ChildProfile).all()
    response_list = []

    for s in students:
        # Cek apakah sudah ada setidaknya 1 rekomendasi medis
        has_rec = db.query(PsychologistRecommendation).filter(
            PsychologistRecommendation.child_id == s.id
        ).first() is not None

        # Cari nama guru yang mengampu
        teacher_name = "Umum/Luring"
        if s.teacher_id:
            teacher = db.query(User).filter(User.id == s.teacher_id).first()
            if teacher:
                teacher_name = teacher.full_name

        response_list.append(
            StudentListResponse(
                id=s.id,
                name=s.name,
                age=s.age,
                grade=s.grade,
                current_level=s.current_level,
                risk_score=s.risk_score,
                risk_level=s.risk_level,
                has_medical_recommendation=has_rec,
                teacher_name=teacher_name
            )
        )

    return response_list


@router.get("/students/{child_id}")
def get_clinical_student_details(
    child_id: str,
    db: Session = Depends(get_db),
    current_psy: Psychologist = Depends(get_current_psychologist)
):
    """
    Mengambil berkas riwayat kesalahan tulisan anak (telemetri) secara detail
    beserta riwayat rekomendasi medis yang pernah diberikan.
    """
    child = db.query(ChildProfile).filter(ChildProfile.id == child_id).first()
    if not child:
        raise HTTPException(status_code=404, detail="Siswa tidak ditemukan.")

    # Ambil riwayat skrining terbaru untuk mendapatkan feedback TrOCR
    screenings = db.query(ScreeningSession).filter(
        ScreeningSession.child_id == child_id
    ).order_by(ScreeningSession.created_at.desc()).all()

    screening_history = []
    for sc in screenings:
        screening_history.append({
            "id": sc.id,
            "risk_score": sc.risk_score,
            "risk_level": sc.risk_level,
            "recommended_level": sc.recommended_level,
            "feedback": sc.feedback,
            "created_at": sc.created_at
        })

    # Ambil seluruh riwayat rekomendasi medis
    recs = db.query(PsychologistRecommendation).filter(
        PsychologistRecommendation.child_id == child_id
    ).order_by(PsychologistRecommendation.created_at.desc()).all()

    recommendation_history = []
    for r in recs:
        psy_name = "Psikolog Medis"
        psy = db.query(Psychologist).filter(Psychologist.id == r.psychologist_id).first()
        if psy:
            psy_name = f"{psy.full_name} ({psy.license_number})"

        recommendation_history.append({
            "id": r.id,
            "clinical_notes": r.clinical_notes,
            "medical_recommendations": r.medical_recommendations,
            "created_at": r.created_at,
            "psychologist_name": psy_name
        })

    # Dapatkan info guru
    teacher_name = "Umum/Luring"
    school_name = "Mitra Lokal"
    if child.teacher_id:
        teacher = db.query(User).filter(User.id == child.teacher_id).first()
        if teacher:
            teacher_name = teacher.full_name
            school_name = teacher.school_name

    return {
        "id": child.id,
        "name": child.name,
        "age": child.age,
        "gender": child.gender,
        "grade": child.grade,
        "current_level": child.current_level,
        "risk_score": child.risk_score,
        "risk_level": child.risk_level,
        "teacher_notes": child.teacher_notes,
        "teacher_name": teacher_name,
        "school_name": school_name,
        "screening_history": screening_history,
        "recommendation_history": recommendation_history
    }


@router.post("/students/{child_id}/recommendations", response_model=RecommendationResponse)
def submit_medical_recommendation(
    child_id: str,
    payload: RecommendationCreate,
    db: Session = Depends(get_db),
    current_psy: Psychologist = Depends(get_current_psychologist)
):
    """
    Mengirimkan saran terapi / rekomendasi medis klinis resmi untuk anak disleksia.
    """
    child = db.query(ChildProfile).filter(ChildProfile.id == child_id).first()
    if not child:
        raise HTTPException(status_code=404, detail="Siswa tidak ditemukan.")

    new_rec = PsychologistRecommendation(
        child_id=child_id,
        psychologist_id=current_psy.id,
        clinical_notes=payload.clinical_notes,
        medical_recommendations=payload.medical_recommendations
    )
    db.add(new_rec)
    db.commit()
    db.refresh(new_rec)

    # Siapkan response
    return RecommendationResponse(
        id=new_rec.id,
        child_id=new_rec.child_id,
        psychologist_id=new_rec.psychologist_id,
        clinical_notes=new_rec.clinical_notes,
        medical_recommendations=new_rec.medical_recommendations,
        created_at=new_rec.created_at,
        psychologist_name=f"{current_psy.full_name} ({current_psy.license_number})"
    )
