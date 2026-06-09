import os
import sys
import pytest
from fastapi.testclient import TestClient
import base64

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app.main import app

client = TestClient(app)

def test_health_check():
    response = client.get("/docs")
    assert response.status_code == 200

def test_upload_screening_empty_base64():
    # Test validasi input kosong
    response = client.post("/api/v1/screening/upload", json={
        "image_base64": "",
        "target_letter": "A"
    })
    assert response.status_code == 400
    assert "Data gambar tidak terdeteksi" in response.json()["detail"]

def test_upload_screening_invalid_base64():
    # Test bagaimana backend merespon base64 yang bukan gambar (misal teks biasa)
    # Ini harus ditangani dan tidak membuat server crash
    response = client.post("/api/v1/screening/upload", json={
        "image_base64": "data:image/jpeg;base64,aW52YWxpZF9pbWFnZV9ieXRlcw==",
        "target_letter": "A"
    })
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "success"
    # Karena gagal baca gambar, TrOCR akan mengembalikan skor 50 dan errors "Kesalahan internal mesin TrOCR"
    assert "Kesalahan internal mesin TrOCR" in data["detected_errors"][0]
    assert data["risk_score"] == 50.0

def test_get_exercises():
    # Test endpoint latihan adaptif
    response = client.get("/api/v1/learning/get-exercises/1")
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    assert len(data) > 0
    assert "content" in data[0]

def test_submit_session():
    # Test submit sesi skrining daring
    response = client.post("/api/v1/screening/submit-session", json={
        "child_id": None,
        "risk_score": 45.0,
        "risk_level": "Sedang",
        "recommended_level": 3,
        "feedback": "Latihan yang direkomendasikan."
    })
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "success"
    assert data["risk_score"] == 45.0
    assert data["risk_level"] == "Sedang"
    assert data["recommended_level"] == 3

def test_sync_batch():
    # Test sinkronisasi batch skrining luring
    response = client.post("/api/v1/sync/batch", json={
        "sessions": [
            {
                "id": "test-session-123",
                "child_id": None,
                "timestamp": "2026-06-09T12:00:00Z",
                "word_attempts": [
                    {
                        "target_letter": "A",
                        "image_base64": "data:image/jpeg;base64,aW52YWxpZF9pbWFnZV9ieXRlcw=="
                    }
                ]
            }
        ]
    })
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "success"
    assert data["synced_count"] == 1
    assert len(data["synced_sessions"]) == 1
    assert data["synced_sessions"][0]["client_id"] == "test-session-123"
    assert data["synced_sessions"][0]["risk_score"] == 50.0 # Karena gambar mock tidak valid

def test_hardware_diagnostic():
    # Test jalannya hardware diagnostic
    from app.services.hardware_diagnostic import run_diagnostic, get_total_ram_gb
    import os
    
    # Bersihkan env vars agar bersih sebelum test
    os.environ.pop("DISABLE_OLLAMA_VISION", None)
    os.environ.pop("OLLAMA_VISION_MODEL", None)
    
    run_diagnostic()
    
    ram = get_total_ram_gb()
    assert ram > 0
    
    disable_flag = os.getenv("DISABLE_OLLAMA_VISION")
    assert disable_flag in ("true", "false")
    
    vision_model = os.getenv("OLLAMA_VISION_MODEL")
    assert vision_model is not None

def test_sqlite_wal_mode():
    # Test bahwa mode WAL (Write-Ahead Logging) teraktifkan pada SQLite3
    from app.core.database import SessionLocal
    from sqlalchemy import text
    db = SessionLocal()
    try:
        bind_url = str(db.bind.url)
        if "sqlite" in bind_url:
            result = db.execute(text("PRAGMA journal_mode;")).scalar()
            assert result.lower() == "wal"
            
            sync_result = db.execute(text("PRAGMA synchronous;")).scalar()
            # PRAGMA synchronous=NORMAL mengembalikan nilai integer 1
            assert sync_result in (1, "NORMAL")
    finally:
        db.close()



