import logging
from datetime import datetime
from typing import Optional
from sqlalchemy.orm import Session
from models import Article, AnalysisHistory
from services.gemini_service import analyze_article
from services.article_extractor import extract_article

logger = logging.getLogger(__name__)

def classify_article(db: Session, article_id: int) -> bool:
    """
    Loads an article from DB, enriches content if needed via article_extractor,
    calls gemini_service.analyze_article, updates the article record,
    and logs the result in AnalysisHistory.
    """
    article: Optional[Article] = db.query(Article).filter(Article.id == article_id).first()
    if not article:
        logger.error(f"Cannot classify article {article_id}: Not found in database.")
        return False

    try:
        content_text = (article.content or "").strip()
        # If neither content nor description is present, attempt quick extraction
        if not content_text and not article.description and article.article_url:
            try:
                extracted = extract_article(article.article_url)
                if extracted and extracted.get("content"):
                    article.content = extracted["content"]
                    content_text = extracted["content"]
                    if not article.image_url and extracted.get("image_url"):
                        article.image_url = extracted["image_url"]
                    if not article.description and extracted.get("description"):
                        article.description = extracted["description"]
            except Exception as ext_err:
                logger.warning(f"Failed to enrich article {article_id} via extractor: {ext_err}")

        # Call Gemini analysis
        analysis_result = analyze_article(
            title=article.title,
            description=article.description or "",
            content=content_text,
            url=article.article_url or "",
        )

        # Update article fields
        article.age_category = analysis_result["age_category"]
        article.classification_reason = analysis_result["reason"]
        article.sensitive_indicators = analysis_result.get("sensitive_indicators", [])
        article.summary = analysis_result["summary"]
        article.confidence = analysis_result["confidence"]
        article.analysis_status = "analyzed"
        article.analyzed_at = datetime.utcnow()

        # Record in AnalysisHistory
        history_entry = AnalysisHistory(
            article_id=article.id,
            age_category=article.age_category,
            summary=article.summary,
            analysis_date=datetime.utcnow(),
        )
        db.add(history_entry)

        db.commit()
        db.refresh(article)
        return True

    except Exception as exc:
        logger.error(f"Error during classification of article {article_id}: {exc}", exc_info=True)
        try:
            article.analysis_status = "failed"
            db.commit()
        except Exception:
            db.rollback()
        return False
