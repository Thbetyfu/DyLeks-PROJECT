from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.database import engine, Base
from app.api.v1 import screening, chat, learning

# Load all models explicitly before creating tables
from app.models import user, child_profile, exercise, screening_session

# Inisialisasi Database
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="DyslexiAI Backend API",
    description="API untuk platform deteksi dini disleksia (Anonymous Mode).",
    version="1.1.0"
)

origins = ["*"] # Mengizinkan akses dari mana saja untuk kemudahan testing lokal

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Registrasi Router
app.include_router(screening.router, prefix="/api/v1/screening", tags=["Screening Mode"])
app.include_router(chat.router, prefix="/api/v1/chat", tags=["AI Tutor Chat"])
app.include_router(learning.router, prefix="/api/v1/learning", tags=["Learning Mode"])

@app.on_event("startup")
async def startup_event():
    from app.services.trocr_service import get_trocr_engine
    print("[Startup] Menyiapkan Otak AI (TrOCR)...")
    get_trocr_engine()
    print("[Startup] Otak AI Siap!")

@app.get("/")
def read_root():
    return {"status": "ok", "message": "DyslexiAI API is running in Anonymous Mode!"}
