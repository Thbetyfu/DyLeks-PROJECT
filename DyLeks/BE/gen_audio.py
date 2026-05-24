import os
from gtts import gTTS

# Direktori asset frontend
output_dir = r"d:\4. Thoriq_KULIAH\1.Lomba Thoriq\SEMESTER 4\HackFest\ARCANA\ARCANA\FE\public\assets"
os.makedirs(output_dir, exist_ok=True)

# List 5 Level ARCANA
kata_target = ['A', 'BA', 'BAN', 'NYALA', 'MENEMANI']

print("--- Memulai Generasi Audio Screening ---")

for kata in kata_target:
    # Suara murni target kata agar anak fokus pada bunyinya
    text = f"{kata}"
    tts = gTTS(text=text, lang='id', slow=False)
    
    file_name = f"instruksi_{kata.lower()}.mp3"
    file_path = os.path.join(output_dir, file_name)
    
    tts.save(file_path)
    print(f"✅ Berhasil: {file_name}")

print("\n--- Audio Sinkronisasi Selesai ---")
