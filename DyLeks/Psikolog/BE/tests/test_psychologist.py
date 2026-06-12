import os
import sys
import pytest
from fastapi.testclient import TestClient

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app.main import app
from app.core.database import SessionLocal
from app.models.child_profile import ChildProfile
from app.models.psychologist import Psychologist, PsychologistRecommendation

client = TestClient(app)

def test_psychologist_auth_and_recommendation_flow():
    # 1. Register a psychologist
    reg_response = client.post("/api/v1/psychologist/register", json={
        "full_name": "Dr. Sarah Sp.Psi",
        "username": "drsarah",
        "password": "secretpassword",
        "license_number": "STR-12345-67890",
        "clinic_name": "Klinik Tumbuh Kembang Sejahtera"
    })
    
    assert reg_response.status_code == 201
    data = reg_response.json()
    assert data["username"] == "drsarah"
    assert data["license_number"] == "STR-12345-67890"

    # 2. Login psychologist
    login_response = client.post("/api/v1/psychologist/login", json={
        "username": "drsarah",
        "password": "secretpassword"
    })
    
    assert login_response.status_code == 200
    token_data = login_response.json()
    assert "access_token" in token_data
    token = token_data["access_token"]
    
    headers = {"Authorization": f"Bearer {token}"}

    # 3. Add a mock student to the database to ensure we can list and write recommendations
    db = SessionLocal()
    try:
        # Create a mock child
        mock_child = ChildProfile(
            name="Rizky",
            age=8,
            gender="L",
            grade="Kelas 2 SD",
            current_level=1,
            risk_score=75.0,
            risk_level="Tinggi",
            teacher_notes="Siswa sering menukar huruf b dan d."
        )
        db.add(mock_child)
        db.commit()
        db.refresh(mock_child)
        child_id = mock_child.id
    finally:
        db.close()

    # 4. List students (must contain Rizky)
    list_response = client.get("/api/v1/psychologist/students", headers=headers)
    assert list_response.status_code == 200
    students = list_response.json()
    assert len(students) > 0
    assert any(s["name"] == "Rizky" for s in students)

    # 5. Get student clinical details
    details_response = client.get(f"/api/v1/psychologist/students/{child_id}", headers=headers)
    assert details_response.status_code == 200
    details = details_response.json()
    assert details["name"] == "Rizky"
    assert details["risk_level"] == "Tinggi"

    # 6. Submit a medical recommendation
    rec_response = client.post(f"/api/v1/psychologist/students/{child_id}/recommendations", json={
        "clinical_notes": "Siswa menunjukkan disleksia visual berat dengan pembalikan b/d.",
        "medical_recommendations": "Gunakan pendekatan Orton-Gillingham taktil (menulis di pasir) selama 3 minggu berturut-turut."
    }, headers=headers)
    
    assert rec_response.status_code == 200
    rec_data = rec_response.json()
    assert rec_data["child_id"] == child_id
    assert "Orton-Gillingham" in rec_data["medical_recommendations"]

    # 7. Clean up database
    db = SessionLocal()
    try:
        db.query(PsychologistRecommendation).filter(PsychologistRecommendation.child_id == child_id).delete()
        db.query(ChildProfile).filter(ChildProfile.id == child_id).delete()
        db.query(Psychologist).filter(Psychologist.username == "drsarah").delete()
        db.commit()
    finally:
        db.close()
