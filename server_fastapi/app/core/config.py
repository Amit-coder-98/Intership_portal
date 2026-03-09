from pydantic_settings import BaseSettings
from typing import Optional
import os


class Settings(BaseSettings):
    MONGODB_URI: str = "mongodb://localhost:27017/mit_internship"
    JWT_SECRET: str = "mit-vpu-internship-portal-secret-key-2026"
    JWT_EXPIRE_MINUTES: int = 10080  # 7 days
    UPLOAD_DIR: str = "/tmp/uploads" if os.environ.get("VERCEL") else "uploads"
    MAX_FILE_SIZE: int = 10 * 1024 * 1024  # 10MB
    ALLOWED_EXTENSIONS: set = {".pdf", ".doc", ".docx", ".pptx", ".jpeg", ".jpg", ".png"}

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        extra = "ignore"


settings = Settings()
