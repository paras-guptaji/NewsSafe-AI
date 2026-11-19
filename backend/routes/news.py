import logging
from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from sqlalchemy import or_, desc, asc

from database import get_db
from models import Article, Bookmark
from schemas import (
    ArticleResponse,
    ArticleListResponse,
    NewsRefreshRequest,
    NewsRefreshResponse,
    DetailedSummaryResponse,
)
from services.news_service import refresh_news, NewsAPIException
from services.classification_service import classify_article
from services.gemini_service import generate_detailed_summary

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/news", tags=["News"])


def format_article_response(article: Article, is_bookmarked: bool = False) -> ArticleResponse:
    res = ArticleResponse.model_validate(article)
    res.is_bookmarked = is_bookmarked
    return res


@router.get("", response_model=ArticleListResponse)
def list_news(
    category: Optional[str] = Query(None, description="News category filter (e.g. general, tech)"),
    age_category: Optional[str] = Query(None, description="Age suitability filter: 18+, Below 18, Pending"),
    age: Optional[str] = Query(None, description="Alias for age_category: 18+, Below 18, 18plus, below18"),
    search: Optional[str] = Query(None, description="Search keyword in title or content"),
    source: Optional[str] = Query(None, description="Source name filter"),
    sort: Optional[str] = Query("newest", description="Sort by: newest, oldest, confidence_high, confidence_low"),
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    page: int = Query(1, ge=1),
    db: Session = Depends(get_db),
):
    """
    List news articles with filtering, searching, sorting, and pagination.
    """
    # Resolve skip from page if page provided
    if page > 1 and skip == 0:
        skip = (page - 1) * limit

    query = db.query(Article)

    # Category filter
    if category and category.lower() not in ("all", ""):
        query = query.filter(Article.news_category.ilike(f"%{category.strip()}%"))

    # Resolve age filter: accept both ?age= and ?age_category= params
    resolved_age = age_category or age
    if resolved_age and resolved_age.lower() not in ("all", ""):
        raw = resolved_age.strip()
        # Normalize URL-friendly variants
        if raw.lower() in ("18plus", "18+"):
            raw = "18+"
        elif raw.lower() in ("below18", "below 18"):
            raw = "Below 18"
        elif raw.lower() == "pending":
            raw = "Pending"
        query = query.filter(Article.age_category == raw)

    # Source filter
    if source and source.lower() not in ("all", ""):
        query = query.filter(Article.source_name.ilike(f"%{source.strip()}%"))

    # Search filter
    if search and search.strip():
        term = f"%{search.strip()}%"
        query = query.filter(
            or_(
                Article.title.ilike(term),
                Article.description.ilike(term),
                Article.content.ilike(term),
            )
        )

    # Sorting
    if sort == "oldest":
        query = query.order_by(asc(Article.published_at), asc(Article.created_at))
    elif sort == "confidence_high":
        query = query.order_by(desc(Article.confidence), desc(Article.created_at))
    elif sort == "confidence_low":
        query = query.order_by(asc(Article.confidence), desc(Article.created_at))
    else:  # newest default
        query = query.order_by(desc(Article.published_at), desc(Article.created_at))

    total = query.count()
    articles = query.offset(skip).limit(limit).all()

    # Get set of bookmarked article IDs for fast lookup
    article_ids = [a.id for a in articles]
    bookmarked_ids = set()
    if article_ids:
        bmarks = db.query(Bookmark.article_id).filter(Bookmark.article_id.in_(article_ids)).all()
        bookmarked_ids = {b[0] for b in bmarks}

    items = [format_article_response(art, is_bookmarked=(art.id in bookmarked_ids)) for art in articles]

    return ArticleListResponse(
        items=items,
        total=total,
        skip=skip,
        limit=limit,
    )


@router.post("/refresh", response_model=NewsRefreshResponse)
def refresh_news_endpoint(
    payload: NewsRefreshRequest,
    db: Session = Depends(get_db),
):
    """
    Fetch the latest news from NewsAPI, insert new items, and classify them.
    """
    try:
        result = refresh_news(
            db=db,
            category=payload.category or "general",
            country=payload.country or "in",
            page_size=payload.page_size or 20,
        )
        return NewsRefreshResponse(**result)
    except NewsAPIException as ne:
        raise HTTPException(status_code=ne.status_code, detail=ne.message)
    except Exception as e:
        logger.error(f"Unexpected error during news refresh: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to refresh news: {str(e)}",
        )


@router.get("/{id}", response_model=ArticleResponse)
def get_article(
    id: int,
    db: Session = Depends(get_db),
):
    """
    Get detailed information for a single article, auto-enriching content if incomplete.
    """
    article = db.query(Article).filter(Article.id == id).first()
    if not article:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Article with ID {id} not found",
        )

    # Auto-enrich article if content is incomplete or truncated
    content_str = (article.content or "").strip()
    if article.article_url and (len(content_str) < 300 or "[+" in content_str):
        try:
            from services.article_extractor import extract_article
            extracted = extract_article(article.article_url)
            if extracted and extracted.get("content") and len(extracted["content"]) > len(content_str):
                article.content = extracted["content"]
                if not article.image_url and extracted.get("image_url"):
                    article.image_url = extracted["image_url"]
                if not article.description and extracted.get("description"):
                    article.description = extracted["description"]
                db.commit()
                db.refresh(article)
        except Exception as enrich_err:
            logger.warning(f"Could not auto-enrich article {id}: {enrich_err}")

    is_bookmarked = db.query(Bookmark).filter(Bookmark.article_id == id).first() is not None
    return format_article_response(article, is_bookmarked=is_bookmarked)


@router.post("/{id}/analyze", response_model=ArticleResponse)
def analyze_article_endpoint(
    id: int,
    db: Session = Depends(get_db),
):
    """
    Re-run AI classification on an existing article.
    """
    article = db.query(Article).filter(Article.id == id).first()
    if not article:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Article with ID {id} not found",
        )

    success = classify_article(db, id)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Classification process failed for this article.",
        )

    db.refresh(article)
    is_bookmarked = db.query(Bookmark).filter(Bookmark.article_id == id).first() is not None
    return format_article_response(article, is_bookmarked=is_bookmarked)


@router.post("/{id}/detailed-summary", response_model=DetailedSummaryResponse)
def generate_article_detailed_summary(
    id: int,
    db: Session = Depends(get_db),
):
    """
    Generate or retrieve a detailed 6-10 sentence summary for an article.
    """
    article = db.query(Article).filter(Article.id == id).first()
    if not article:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Article with ID {id} not found",
        )

    # If detailed summary already exists, return it
    if article.detailed_summary and len(article.detailed_summary) > 50:
        return DetailedSummaryResponse(detailed_summary=article.detailed_summary)

    content_for_summary = article.content or article.description or article.title
    detailed_text = generate_detailed_summary(
        title=article.title,
        content=content_for_summary,
    )

    article.detailed_summary = detailed_text
    db.commit()
    db.refresh(article)

    return DetailedSummaryResponse(detailed_summary=detailed_text)
