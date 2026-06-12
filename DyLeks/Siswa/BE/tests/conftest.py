"""
Pytest configuration and global mocks for DyLeks tests.
Mocks heavy ML services (Ollama, TrOCR, Copilot) to prevent test suite hanging
and massive memory usage during automated testing.
"""
import pytest
from unittest.mock import patch, AsyncMock

@pytest.fixture(autouse=True)
def mock_ml_services():
    """
    Automatically mock ML models for all tests.
    Returns static safe responses instead of loading models.
    """
    with patch("app.api.v1.screening.analyze_dyslexia_image", new_callable=AsyncMock) as mock_ollama, \
         patch("app.api.v1.screening.analyze_with_trocr", new_callable=AsyncMock) as mock_trocr, \
         patch("app.api.v1.sync.analyze_dyslexia_image", new_callable=AsyncMock) as mock_sync_ollama, \
         patch("app.api.v1.sync.analyze_with_trocr", new_callable=AsyncMock) as mock_sync_trocr, \
         patch("app.services.ollama_service.copilot_service.get_reply", new_callable=AsyncMock) as mock_copilot:
         
        async def mock_analyze(image_bytes, target_letter):
            if b"invalid_image_bytes" in image_bytes:
                raise ValueError("Simulated ML Error")
            return {"score": 25.0, "errors": [], "engine": "mock-engine"}
            
        mock_ollama.side_effect = mock_analyze
        mock_trocr.side_effect = mock_analyze
        mock_sync_ollama.side_effect = mock_analyze
        mock_sync_trocr.side_effect = mock_analyze
        
        mock_copilot.return_value = "Ini adalah rekomendasi mock intervensi OG untuk pengujian."
        
        yield
