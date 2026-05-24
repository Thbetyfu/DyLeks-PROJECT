"""
Child Profile Model Definition (Simplified).
Menyimpan profil anak secara lokal tanpa ketergantungan pada akun User.
"""
from sqlalchemy import Column, String, Integer, Float, DateTime
from sqlalchemy.orm import relationship
from datetime import datetime
import uuid
from app.core.database import Base

class ChildProfile(Base):
    __tablename__ = "child_profiles"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()), index=True)
    name = Column(String(100), nullable=False)
    age = Column(Integer)
    current_level = Column(Integer, default=1)
    risk_score = Column(Float, default=0.0)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relasi ke sesi belajar
    learning_sessions = relationship("LearningSession", backref="child", lazy=True)
