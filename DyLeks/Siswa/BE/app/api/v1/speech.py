"""
Speech Evaluation API Router.
Menganalisis hasil transkripsi lisan anak dan mendeteksi tipe kesalahan fonologis secara offline.
"""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from rapidfuzz import fuzz
from rapidfuzz.distance import Levenshtein

router = APIRouter()

class SpeechRequest(BaseModel):
    user_speech: str
    target_word: str

class SpeechResponse(BaseModel):
    status: str
    is_correct: bool
    error_type: str
    score: float
    details: str

def analyze_phonological_error(user_text: str, target_text: str) -> dict:
    user_text = user_text.strip().lower()
    target_text = target_text.strip().lower()
    
    # 1. Kecocokan Sempurna
    if user_text == target_text:
        return {
            "is_correct": True,
            "error_type": "none",
            "score": 100.0,
            "details": "Pelafalan sangat tepat!"
        }
        
    similarity = fuzz.ratio(user_text, target_text)
    
    try:
        ops = Levenshtein.editops(target_text, user_text)
    except Exception:
        ops = []
        
    op_types = [op[0] for op in ops]
    
    error_type = "other"
    details = "Ada sedikit ketidaksesuaian pelafalan."
    
    if not ops:
        return {
            "is_correct": similarity >= 80,
            "error_type": "none",
            "score": similarity,
            "details": "Pelafalan hampir tepat!"
        }
        
    # 2. Tipe Transposisi (Urutan Tertukar)
    if len(user_text) == len(target_text) and sorted(user_text) == sorted(target_text):
        error_type = "transposition"
        details = "Urutan bunyi atau huruf tertukar (transposisi)."
        
    # 3. Tipe Substitusi (Penggantian Bunyi)
    elif all(op == 'replace' for op in op_types):
        error_type = "substitution"
        swaps = []
        for op in ops:
            src_char = target_text[op[1]] if op[1] < len(target_text) else ""
            dest_char = user_text[op[2]] if op[2] < len(user_text) else ""
            if src_char and dest_char:
                swaps.append(f"'{src_char}' diganti '{dest_char}'")
        
        details = f"Terjadi penggantian bunyi fonem: {', '.join(swaps)}."
        
        # Cek pola disleksia umum: b/d, p/q, m/n, t/d, b/p
        common_dyslexia_swaps = {
            ('b', 'd'), ('d', 'b'), ('p', 'q'), ('q', 'p'), 
            ('m', 'n'), ('n', 'm'), ('t', 'd'), ('d', 't'),
            ('b', 'p'), ('p', 'b'), ('f', 'v'), ('v', 'f')
        }
        is_dyslexia_swap = False
        for op in ops:
            if op[1] < len(target_text) and op[2] < len(user_text):
                if (target_text[op[1]], user_text[op[2]]) in common_dyslexia_swaps:
                    is_dyslexia_swap = True
                    break
        if is_dyslexia_swap:
            details += " Ini adalah pola substitusi fonik disleksia yang umum (kebingungan orientasi bunyi b/d/p/q)."
            
    # 4. Tipe Omisi (Penghilangan Bunyi)
    elif all(op == 'delete' for op in op_types):
        error_type = "omission"
        omitted = [target_text[op[1]] for op in ops if op[1] < len(target_text)]
        details = f"Ada bunyi/huruf yang hilang (omisi): {', '.join(f'\'{x}\'' for x in omitted)}."
        
    # 5. Tipe Insersi (Bunyi Tambahan)
    elif all(op == 'insert' for op in op_types):
        error_type = "insertion"
        inserted = [user_text[op[2]] for op in ops if op[2] < len(user_text)]
        details = f"Ada bunyi/huruf tambahan yang tidak perlu (insersi): {', '.join(f'\'{x}\'' for x in inserted)}."
        
    else:
        error_type = "mixed"
        details = "Terdapat kombinasi kesalahan bunyi (campuran omisi/substitusi/insersi)."
        
    # Ambang batas kelulusan pelafalan adaptif
    is_correct = similarity >= 80.0
    
    # Omisi dan transposisi dianggap salah secara mutlak
    if error_type in ("omission", "transposition"):
        is_correct = False
    
    return {
        "is_correct": is_correct,
        "error_type": error_type,
        "score": round(similarity, 1),
        "details": details
    }

@router.post("/evaluate", response_model=SpeechResponse)
def evaluate_speech(payload: SpeechRequest):
    """
    Endpoint untuk mengevaluasi teks hasil ucapan siswa dengan kata target.
    """
    if not payload.user_speech or not payload.target_word:
        raise HTTPException(status_code=400, detail="Teks ucapan dan kata target harus diisi.")
        
    result = analyze_phonological_error(payload.user_speech, payload.target_word)
    
    return SpeechResponse(
        status="success",
        is_correct=result["is_correct"],
        error_type=result["error_type"],
        score=result["score"],
        details=result["details"]
    )
