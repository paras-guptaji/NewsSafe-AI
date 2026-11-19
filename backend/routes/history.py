import logging
from datetime import datetime
from typing import List, Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import desc
from dateutil import parser as date_parser

from database import get_db
from models import AnalysisHistory
from schemas import HistoryResponse

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/history", tags=["History"])


@router.get("", response_model=List[HistoryResponse])
def get_history(
    age_category: Optional[str] = Query(None, description="Filter by age category (18+, Below 18)"),
    date_from: Optional[str] = Query(None, description="Start date ISO string"),
    date_to: Optional[str] = Query(None, description="End date ISO string"),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
    db: Session = Depends(get_db),
):
    """
    Retrieve historical AI classification events with optional filtering.
    """
    query = db.query(AnalysisHistory).options(joinedload(AnalysisHistory.article))

    if age_category and age_category.lower() not in ("all", ""):
        query = query.filter(AnalysisHistory.age_category.ilike(age_category.strip()))

    if date_from:
        try:
            dt_from = date_parser.parse(date_from)
            query = query.filter(AnalysisHistory.analysis_date >= dt_from)
        except Exception:
            pass

    if date_to:
        try:
            dt_to = date_parser.parse(date_to)
            query = query.filter(AnalysisHistory.analysis_date <= dt_to)
        except Exception:
            pass

    history_records = (
        query.order_by(desc(AnalysisHistory.analysis_date))
        .offset(skip)
        .limit(limit)
        .all()
    )

    results = []
    for h in history_records:
        art_title = h.article.title if h.article else None
        art_url = h.article.article_url if h.article else None
        source_name = h.article.source_name if h.article else None

        results.append(
            HistoryResponse(
                id=h.id,
                article_id=h.article_id,
                age_category=h.age_category,
                summary=h.summary,
                analysis_date=h.analysis_date,
                article_title=art_title,
                article_url=art_url,
                source_name=source_name,
            )
        )

    return results
