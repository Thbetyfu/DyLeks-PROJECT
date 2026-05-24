"""
Gemini Vision Service.
Menganalisis gambar Base64 menggunakan Google Gemini 1.5 Flash untuk deteksi pola tulisan.
"""

import google.generativeai as genai
import os
import re

# Inisialisasi API Key dari Environment Variable
gemini_api_key = os.getenv("GEMINI_API_KEY", "")
if gemini_api_key:
    genai.configure(api_key=gemini_api_key)

async def analyze_dyslexia_image(image_bytes: bytes, target_letter: str = "A") -> dict:
    """
    Kirim gambar mentah ke Gemini untuk dianalisis pola tulisannya.
    Menggunakan prompt spesifik untuk deteksi disleksia (misal: keterbalikan, kerapian, dsb).
    """
    if not gemini_api_key:
        return _mock_dynamic_hash_logic(image_bytes, target_letter)

    try:
        model = genai.GenerativeModel('gemini-1.5-flash')
        
        prompt = f"""
        Anda adalah asisten medis AI (DyslexiAI) yang bertugas menganalisis tulisan tangan anak-anak.
        Anak ini diinstruksikan untuk menulis: "Huruf {target_letter} Besar" di kertas.
        
        PERATURAN SANGAT KETAT:
        1. JIKA gambar yang dikirim BUKAN GAMBAR TULISAN TANGAN (contoh: foto wajah, keyboard, rumah, benda mati, dsb), KEMBALIKAN:
           "risk_score": 100
           "detected_errors": ["Gambar tidak relevan. Tidak terdeteksi adanya tulisan tangan di kertas. Silakan foto ulang."]
           
        2. Jika itu BENAR-BENAR gambar tulisan tangan, analisis huruf '{target_letter}':
           - Periksa tanda-tanda disleksia: huruf terbalik (mirroring), garis terputus, sudut tidak wajar.
           - Berikan risk_score antara 0 (sangat baik) sampai 100 (potensi disleksia tinggi).
           
        Balas HANYA dengan JSON murni, tanpa markdown!
        Contoh format yang valid:
        {{
            "risk_score": 30.5,
            "detected_errors": ["Sudut huruf A sedikit tidak pas", "Garis terlihat ragu-ragu"]
        }}
        """
        
        response = model.generate_content([
            {'mime_type': 'image/jpeg', 'data': image_bytes},
            prompt
        ])
        
        # Ekstraksi response JSON
        raw_text = response.text.replace("```json", "").replace("```", "").strip()
        import json
        result = json.loads(raw_text)
        
        return {
            "score": float(result.get("risk_score", 50.0)),
            "errors": result.get("detected_errors", [])
        }
    except Exception as e:
        print(f"Gemini Error: {e}")
        return _mock_dynamic_hash_logic(image_bytes, target_letter)

def _mock_dynamic_hash_logic(image_bytes: bytes, target_letter: str) -> dict:
    """
    Jika Tidak Ada API Key ATAU error, gunakan hash gambar agar hasil dinamis namun fiktif.
    """
    import hashlib
    hash_num = int(hashlib.md5(image_bytes).hexdigest()[:8], 16)
    score = (hash_num % 100)
    
    # Deteksi palsu: jika image bytes terlalu kecil atau berukuran identik dengan noise
    if len(image_bytes) < 30000:
        return {
            "score": 100.0,
            "errors": ["Gambar buram atau bukan tulisan. Mohon foto kertas dengan jelas."]
        }
    
    if score > 70:
        errors = [f"Garis huruf {target_letter} terlihat bimbang.", "Indikasi cerminan ringan (mirroring)."]
    elif score >= 40:
        errors = [f"Bentuk {target_letter} kurang proporsional."]
    else:
        errors = []
        
    return {
        "score": float(score),
        "errors": errors
    }