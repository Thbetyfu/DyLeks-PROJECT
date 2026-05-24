"""
Ollama Asynchronous Service.
Menangani komunikasi dengan instance Ollama lokal dan manajemen prompt empatik.
"""

import httpx
import os
import json

class OllamaService:
    def __init__(self):
        self.base_url = os.getenv("OLLAMA_BASE_URL", "http://localhost:11434")
        self.model = os.getenv("OLLAMA_MODEL", "llama3")
        
        # System Prompt untuk AI Tutor Disleksia
        self.system_instructions = (
            "Kamu adalah seorang AI Tutor bernama 'Sahabat DyslexiAI'. "
            "Tugasmu adalah membantu anak-anak dengan disleksia belajar membaca dan menulis. "
            "Gunakan bahasa Indonesia yang sangat sederhana, ramah, dan penuh semangat. "
            "Jika anak melakukan kesalahan ejaan, jangan menyalahkan. Berikan apresiasi atas usahanya, "
            "lalu berikan perbaikan dengan cara yang lembut. Contoh: 'Wah, usahamu hebat! "
            "Sedikit lagi tepat, kalau kata [KATA] itu hurufnya begini ya: ...'"
        )

    async def get_tutor_reply(self, user_message: str) -> str:
        """
        Mengirim pesan ke Ollama dan mengembalikan respon teks.
        """
        payload = {
            "model": self.model,
            "prompt": f"{self.system_instructions}\n\nAnak: {user_message}\nSahabat DyslexiAI:",
            "stream": False
        }

        async with httpx.AsyncClient(timeout=30.0) as client:
            try:
                response = await client.post(f"{self.base_url}/api/generate", json=payload)
                response.raise_for_status()
                data = response.json()
                return data.get("response", "Maaf, Sahabat DyslexiAI sedang beristirahat sebentar.")
            except Exception as e:
                return f"Oops, ada kendala koneksi ke Ollama: {str(e)}"

ollama_service = OllamaService()