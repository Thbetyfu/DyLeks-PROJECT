"""
Scoring and Visual Risk Assessment Service.
Mengolah metrik skor risiko berbasis fuzzy matching dan klasifikasi kesalahan disleksia.
"""
from rapidfuzz import fuzz

class ScoringService:
    """
    Layanan analisis pola kesalahan penulisan dan beban kognitif anak disleksia.
    """

    @staticmethod
    def calculate_risk(target_word: str, ocr_text: str) -> dict:
        """
        Menganalisis hasil pembacaan OCR dibandingkan dengan kata target untuk:
        1. Menghitung skor risiko (0 - 100).
        2. Mendeteksi tipe kesalahan disleksia spesifik (reversal, omission, insertion, dll).
        
        Alasan ('Why'):
          Anak disleksia memiliki pola keliru penulisan yang khas. Dengan memetakan kesalahan
          ke kategori yang tepat (dan kata kunci penanda seperti 'terbalik', 'hilang', 'tambah'),
          frontend dapat menyajikan grafik diagnosis visual yang akurat bagi para pendidik.
        """
        # Bersihkan string dari tanda baca dan spasi tambahan
        target_clean = "".join(filter(str.isalnum, target_word.lower())).strip()
        ocr_clean = "".join(filter(str.isalnum, ocr_text.lower())).strip()

        # Hitung kemiripan Levenshtein
        similarity_ratio = fuzz.ratio(target_clean, ocr_clean)

        # Logika pencocokan adaptif terhadap panjang kata:
        # Kata pendek (<= 4 karakter) sangat sensitif terhadap pertukaran huruf (b/d, p/q, dll).
        # Kata panjang (> 4 karakter) toleran terhadap minor typo atau noise pembacaan OCR.
        if len(target_clean) <= 4:
            is_match = (target_clean == ocr_clean)
        else:
            is_match = (target_clean == ocr_clean) or (similarity_ratio >= 80)

        # Kecuali jika terdeteksi adanya inversi b/d atau p/q, maka langsung batalkan kecocokan
        bd_reversal = (("b" in target_clean and "d" in ocr_clean) or 
                       ("d" in target_clean and "b" in ocr_clean))
        pq_reversal = (("p" in target_clean and "q" in ocr_clean) or 
                       ("q" in target_clean and "p" in ocr_clean))
                       
        if target_clean != ocr_clean and (bd_reversal or pq_reversal):
            is_match = False

        risk_score = 0.0
        errors = []

        if not is_match:
            # Skor risiko berbasis jarak kemiripan
            risk_score = min(100.0, 100.0 - (similarity_ratio * 0.4))

            if ocr_clean == "":
                errors.append("TrOCR tidak mendeteksi tulisan yang valid. Pastikan tulisan cukup tebal dan terkena cahaya terang.")
            else:
                # 1. Deteksi Inversi Spasial Huruf Mirip (b/d dan p/q)
                if bd_reversal:
                    errors.append(f"Terjadi inversi b/d terbalik: target '{target_word}', terbaca '{ocr_text}'")
                elif pq_reversal:
                    errors.append(f"Terjadi inversi p/q terbalik: target '{target_word}', terbaca '{ocr_text}'")
                
                # 2. Deteksi Reversal Urutan Huruf (anagram / posisi tertukar)
                elif sorted(target_clean) == sorted(ocr_clean) and target_clean != ocr_clean:
                    errors.append(f"Urutan huruf terbalik (reversal): target '{target_word}', terbaca '{ocr_text}'")
                
                # 3. Deteksi Omission (huruf hilang)
                elif len(ocr_clean) < len(target_clean):
                    errors.append(f"Huruf hilang (omission): target '{target_word}', terbaca '{ocr_text}'")
                
                # 4. Deteksi Insertion (huruf tambah)
                elif len(ocr_clean) > len(target_clean):
                    errors.append(f"Huruf tambah (insertion): target '{target_word}', terbaca '{ocr_text}'")
                
                # Fallback salah eja biasa (substitution)
                else:
                    errors.append(f"Salah eja: target '{target_word}', terbaca '{ocr_text}'")

        return {
            "score": round(risk_score, 1),
            "errors": errors,
            "is_match": is_match
        }
