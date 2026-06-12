import os
import sys
import pytest
from fastapi.testclient import TestClient

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app.main import app

client = TestClient(app)

def test_full_e2e_flow():
    print("\n--- [QA] Memulai Skenario E2E Flow ---")
    
    # 1. GURU REGISTRASI & LOGIN
    username = "qa_test_guru"
    password = "qa_password123"
    
    res_reg = client.post("/api/v1/auth/register", json={
        "full_name": "QA Tester Guru",
        "username": username,
        "password": password,
        "role": "teacher"
    })
    
    if res_reg.status_code == 409 and "Username" in res_reg.json()["detail"]:
        # Jika sudah ada, lewati registrasi
        pass
    else:
        assert res_reg.status_code == 201
        
    res_login = client.post("/api/v1/auth/login", json={
        "username": username,
        "password": password
    })
    assert res_login.status_code == 200
    guru_token = res_login.json()["access_token"]
    guru_headers = {"Authorization": f"Bearer {guru_token}"}
    
    print("[1] Registrasi dan Login Guru BERHASIL.")
    
    # 2. GURU MEMBUAT PROFIL ANAK (SISWA)
    res_child = client.post("/api/v1/auth/children", json={
        "name": "QA Test Siswa",
        "age": 8,
        "notes": "Anak fiktif untuk pengujian QA."
    }, headers=guru_headers)
    assert res_child.status_code == 201
    child_id = res_child.json()["id"]
    
    print(f"[2] Pembuatan Profil Siswa (ID: {child_id}) BERHASIL.")
    
    # 3. GURU MENG-GENERATE QR TOKEN
    res_qr = client.post("/api/v1/auth/qr/generate", json={
        "child_id": child_id
    }, headers=guru_headers)
    assert res_qr.status_code == 200
    qr_token = res_qr.json()["token"]
    
    print(f"[3] Generate QR Token ({qr_token}) BERHASIL.")
    
    # 4. SISWA DEVICE MENGECEK INFO QR
    res_qr_info = client.get(f"/api/v1/auth/qr/info/{qr_token}")
    assert res_qr_info.status_code == 200
    assert res_qr_info.json()["child_id"] == child_id
    
    print("[4] Pengecekan Info QR oleh Device Siswa BERHASIL.")
    
    # 5. SISWA DEVICE CONNECT & MENDAPATKAN TOKEN SISWA
    res_connect = client.post("/api/v1/auth/qr/connect", json={
        "token": qr_token
    })
    assert res_connect.status_code == 200
    siswa_token = res_connect.json()["access_token"]
    siswa_headers = {"Authorization": f"Bearer {siswa_token}"}
    
    print("[5] Device Siswa Terkoneksi dan Mendapatkan Akses BERHASIL.")
    
    # 6. SISWA MENGUPLOAD GAMBAR SKRINING (MOCK)
    import base64
    valid_base64 = "data:image/jpeg;base64," + base64.b64encode(b"fake_valid_image_bytes_for_testing").decode('utf-8')
    res_upload = client.post("/api/v1/screening/upload", json={
        "image_base64": valid_base64,
        "target_letter": "A"
    }, headers=siswa_headers)
    assert res_upload.status_code == 200
    upload_data = res_upload.json()
    assert upload_data["status"] == "success"
    # Menggunakan mock, jadi skor adalah 25.0
    assert upload_data["risk_score"] == 25.0 
    
    print(f"[6] Siswa Mengupload Gambar Skrining (Score: {upload_data['risk_score']}) BERHASIL.")
    
    # 7. SISWA SUBMIT SESI SKRINING
    res_submit = client.post("/api/v1/screening/submit-session", json={
        "child_id": child_id,
        "risk_score": 25.0,
        "risk_level": "Rendah",
        "recommended_level": 2,
        "feedback": "Hasil pengujian otomatis."
    }, headers=siswa_headers)
    
    assert res_submit.status_code == 200
    assert res_submit.json()["status"] == "success"
    
    print("[7] Siswa Submit Sesi Skrining BERHASIL.")
    
    # 8. CEK UPDATE PROFIL OLEH GURU
    res_check = client.get(f"/api/v1/auth/children/{child_id}", headers=guru_headers)
    assert res_check.status_code == 200
    profile_data = res_check.json()
    assert profile_data["risk_score"] == 25.0
    assert profile_data["risk_level"] == "Rendah"
    assert profile_data["current_level"] == 2
    
    print("[8] Pengecekan Update Profil Anak oleh Guru BERHASIL.")
    
    # 9. UJI BATCH SYNC OFFLINE SISWA
    res_sync = client.post("/api/v1/sync/batch", json={
        "sessions": [
            {
                "id": "e2e-sync-session-1",
                "child_id": child_id,
                "timestamp": "2026-06-12T10:00:00Z",
                "word_attempts": [
                    {
                        "target_letter": "B",
                        "image_base64": valid_base64
                    }
                ]
            }
        ]
    }, headers=siswa_headers)
    assert res_sync.status_code == 200
    sync_data = res_sync.json()
    assert sync_data["synced_count"] == 1
    assert sync_data["synced_sessions"][0]["risk_score"] == 25.0
    
    print("[9] Sinkronisasi Batch Skrining (Offline Sync) BERHASIL.")
    
    print("--- [QA] Skenario E2E Flow SELESAI TANPA ERROR ---\n")
