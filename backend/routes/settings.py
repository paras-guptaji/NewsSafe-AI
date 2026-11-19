import logging
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import text

from database import get_db
from config import NEWS_API_KEY, GEMINI_API_KEY, GEMINI_MODEL
from schemas import SystemStatusResponse

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/settings", tags=["Settings"])


@router.get("/status", response_model=SystemStatusResponse)
def get_system_status(db: Session = Depends(get_db)):
    """
    Check overall health and status of NewsAPI, Gemini AI model, and database.
    Never exposes actual API keys.
    """
    # 1. Database check
    db_ok = False
    try:
        db.execute(text("SELECT 1"))
        db_ok = True
    except Exception as e:
        logger.error(f"Database health check failed: {e}")

    # 2. Key presence checks
    news_key_set = bool(NEWS_API_KEY and len(NEWS_API_KEY.strip()) > 5)
    gemini_key_set = bool(GEMINI_API_KEY and len(GEMINI_API_KEY.strip()) > 5)

    # 3. Service readiness
    news_api_ready = news_key_set
    gemini_ready = gemini_key_set

    return SystemStatusResponse(
        news_api=news_api_ready,
        gemini=gemini_ready,
        database=db_ok,
        news_api_key_set=news_key_set,
        gemini_key_set=gemini_key_set,
        model=GEMINI_MODEL,
    )
