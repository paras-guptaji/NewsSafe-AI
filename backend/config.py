import os
from pathlib import Path
from dotenv import load_dotenv

# Base directory for backend
BASE_DIR = Path(__file__).resolve().parent

# Load .env file explicitly from the backend directory
load_dotenv(dotenv_path=BASE_DIR / ".env")

NEWS_API_KEY = os.getenv("NEWS_API_KEY", "781875ad47dd4666808d8b9fc48f3d96").strip()
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "").strip()
GEMINI_MODEL = os.getenv("GEMINI_MODEL", "gemini-3-flash-preview").strip()
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./newssafe.db").strip()

def get_settings():
    return {
        "NEWS_API_KEY": NEWS_API_KEY,
        "GEMINI_API_KEY": GEMINI_API_KEY,
        "GEMINI_MODEL": GEMINI_MODEL,
        "DATABASE_URL": DATABASE_URL,
    }
