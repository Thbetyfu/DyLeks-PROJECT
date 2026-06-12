import os
import sys
import pytest
from fastapi.testclient import TestClient

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app.main import app

client = TestClient(app)

def test_speech_evaluate_correct():
    # Test pelafalan yang tepat (cocok sempurna)
    response = client.post("/api/v1/speech/evaluate", json={
        "user_speech": "buku",
        "target_word": "buku"
    })
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "success"
    assert data["is_correct"] is True
    assert data["error_type"] == "none"
    assert data["score"] == 100.0
    assert "sangat tepat" in data["details"].lower()

def test_speech_evaluate_substitution_dyslexia():
    # Test penggantian fonik (reversal b/d) yang khas disleksia
    response = client.post("/api/v1/speech/evaluate", json={
        "user_speech": "duku",
        "target_word": "buku"
    })
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "success"
    assert data["is_correct"] is False
    assert data["error_type"] == "substitution"
    assert "reversal" in data["details"].lower() or "substitusi" in data["details"].lower()

def test_speech_evaluate_omission():
    # Test penghilangan huruf/bunyi (omisi)
    response = client.post("/api/v1/speech/evaluate", json={
        "user_speech": "pisag",
        "target_word": "pisang"
    })
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "success"
    assert data["is_correct"] is False
    assert data["error_type"] == "omission"
    assert "omisi" in data["details"].lower() or "hilang" in data["details"].lower()

def test_speech_evaluate_insertion():
    # Test penambahan huruf/bunyi berlebih (insersi)
    response = client.post("/api/v1/speech/evaluate", json={
        "user_speech": "bukuu",
        "target_word": "buku"
    })
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "success"
    assert data["is_correct"] is True  # Karena kemiripan masih tinggi (di atas 80)
    assert data["error_type"] == "insertion"
    assert "insersi" in data["details"].lower() or "tambahan" in data["details"].lower()

def test_speech_evaluate_transposition():
    # Test urutan tertukar (transposisi)
    response = client.post("/api/v1/speech/evaluate", json={
        "user_speech": "loba",
        "target_word": "bola"
    })
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "success"
    assert data["is_correct"] is False
    assert data["error_type"] == "transposition"
    assert "transposisi" in data["details"].lower() or "tertukar" in data["details"].lower()

def test_speech_evaluate_empty_input():
    # Test input kosong
    response = client.post("/api/v1/speech/evaluate", json={
        "user_speech": "",
        "target_word": "buku"
    })
    assert response.status_code == 400
    assert "harus diisi" in response.json()["detail"]
