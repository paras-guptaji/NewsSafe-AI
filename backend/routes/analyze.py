import hashlib
import logging
from datetime import datetime
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from database import get_db
from models import Article, AnalysisHistory, Bookmark
from schemas import (
    AnalyzeUrlRequest,
    AnalyzeTextRequest,
    AnalyzeResponse,
    ArticleResponse,
)
from services.article_extractor import extract_article
from services.gemini_service import analyze_article, generate_detailed_summary

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api", tags=["Analyze"])


@router.post("/analyze-url", response_model=AnalyzeResponse)
def analyze_url_endpoint(
    payload: AnalyzeUrlRequest,
    db: Session = Depends(get_db),
):
    """
    Extract article content from a URL and perform AI age-suitability analysis.
    """
    url = (payload.url or "").strip()
    if not url:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A valid URL is required.",
        )

    # 1. Extract content with SSRF protection
    extracted = extract_article(url)
    if extracted.get("error"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=extracted["error"],
        )

    title = extracted.get("title") or "Article from " + (extracted.get("source") or "Web")
    description = extracted.get("description") or ""
    content = extracted.get("content") or ""
    image_url = extracted.get("image_url") or None
    source = extracted.get("source") or None

    # 2. Run Gemini analysis
    analysis = analyze_article(
        title=title,
        description=description,
        content=content,
        url=url,
    )

    # 3. Save or update Article in database
    existing_article = db.query(Article).filter(Article.article_url == url).first()
    if existing_article:
        article = existing_article
        article.title = title
        if description:
            article.description = description
        if content:
            article.content = content
        if image_url:
            article.image_url = image_url
        if source:
            article.source_name = source
        article.age_category = analysis["age_category"]
        article.classification_reason = analysis["reason"]
        article.sensitive_indicators = analysis.get("sensitive_indicators", [])
        article.summary = analysis["summary"]
        article.confidence = analysis["confidence"]
        article.analysis_status = "analyzed"
        article.analyzed_at = datetime.utcnow()
    else:
        article = Article(
            title=title,
            description=description,
            content=content,
            source_name=source,
            article_url=url,
            image_url=image_url,
            published_at=datetime.utcnow(),
            news_category="custom",
            age_category=analysis["age_category"],
            classification_reason=analysis["reason"],
            sensitive_indicators=analysis.get("sensitive_indicators", []),
            summary=analysis["summary"],
            confidence=analysis["confidence"],
            analysis_status="analyzed",
            analyzed_at=datetime.utcnow(),
        )
        db.add(article)

    db.flush()

    # Log in AnalysisHistory
    history = AnalysisHistory(
        article_id=article.id,
        age_category=analysis["age_category"],
        summary=analysis["summary"],
        analysis_date=datetime.utcnow(),
    )
    db.add(history)
    db.commit()
    db.refresh(article)

    is_bookmarked = db.query(Bookmark).filter(Bookmark.article_id == article.id).first() is not None
    article_res = ArticleResponse.model_validate(article)
    article_res.is_bookmarked = is_bookmarked

    return AnalyzeResponse(
        age_category=analysis["age_category"],
        confidence=analysis["confidence"],
        reason=analysis["reason"],
        sensitive_indicators=analysis.get("sensitive_indicators", []),
        summary=analysis["summary"],
        content_severity=analysis.get("content_severity", "Low"),
        detailed_summary=article.detailed_summary,
        article=article_res,
    )


@router.post("/analyze-text", response_model=AnalyzeResponse)
def analyze_text_endpoint(
    payload: AnalyzeTextRequest,
    db: Session = Depends(get_db),
):
    """
    Analyze manually pasted news text or draft content for age suitability.
    """
    title = (payload.title or "").strip()
    content = (payload.content or "").strip()

    if not title and not content:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Either article title or content must be provided.",
        )

    if not title:
        title = content[:60] + "..." if len(content) > 60 else content

    # Run analysis
    analysis = analyze_article(
        title=title,
        description=content[:200] if len(content) > 200 else "",
        content=content,
        url=payload.url or "",
    )

    # Deterministic or user-provided URL
    if payload.url and payload.url.strip():
        article_url = payload.url.strip()
    else:
        text_hash = hashlib.sha256(f"{title}_{content[:200]}".encode("utf-8")).hexdigest()[:16]
        article_url = f"custom://text/{text_hash}"

    existing_article = db.query(Article).filter(Article.article_url == article_url).first()
    if existing_article:
        article = existing_article
        article.title = title
        article.content = content
        article.age_category = analysis["age_category"]
        article.classification_reason = analysis["reason"]
        article.sensitive_indicators = analysis.get("sensitive_indicators", [])
        article.summary = analysis["summary"]
        article.confidence = analysis["confidence"]
        article.analysis_status = "analyzed"
        article.analyzed_at = datetime.utcnow()
    else:
        article = Article(
            title=title,
            description=content[:200] if len(content) > 200 else "",
            content=content,
            source_name="Manual Input",
            article_url=article_url,
            published_at=datetime.utcnow(),
            news_category="manual",
            age_category=analysis["age_category"],
            classification_reason=analysis["reason"],
            sensitive_indicators=analysis.get("sensitive_indicators", []),
            summary=analysis["summary"],
            confidence=analysis["confidence"],
            analysis_status="analyzed",
            analyzed_at=datetime.utcnow(),
        )
        db.add(article)

    db.flush()

    history = AnalysisHistory(
        article_id=article.id,
        age_category=analysis["age_category"],
        summary=analysis["summary"],
        analysis_date=datetime.utcnow(),
    )
    db.add(history)
    db.commit()
    db.refresh(article)

    is_bookmarked = db.query(Bookmark).filter(Bookmark.article_id == article.id).first() is not None
    article_res = ArticleResponse.model_validate(article)
    article_res.is_bookmarked = is_bookmarked

    return AnalyzeResponse(
        age_category=analysis["age_category"],
        confidence=analysis["confidence"],
        reason=analysis["reason"],
        sensitive_indicators=analysis.get("sensitive_indicators", []),
        summary=analysis["summary"],
        content_severity=analysis.get("content_severity", "Low"),
        detailed_summary=article.detailed_summary,
        article=article_res,
    )
