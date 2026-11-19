import logging
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session, joinedload

from database import get_db
from models import Article, Bookmark
from schemas import BookmarkResponse, ArticleResponse

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/bookmarks", tags=["Bookmarks"])


@router.get("", response_model=List[BookmarkResponse])
def get_bookmarks(db: Session = Depends(get_db)):
    """
    Retrieve all bookmarked articles.
    """
    bookmarks = (
        db.query(Bookmark)
        .options(joinedload(Bookmark.article))
        .order_by(Bookmark.created_at.desc())
        .all()
    )

    results = []
    for bm in bookmarks:
        art_res = None
        if bm.article:
            art_res = ArticleResponse.model_validate(bm.article)
            art_res.is_bookmarked = True

        results.append(
            BookmarkResponse(
                id=bm.id,
                article_id=bm.article_id,
                created_at=bm.created_at,
                article=art_res,
            )
        )
    return results


@router.post("/{article_id}", response_model=BookmarkResponse, status_code=status.HTTP_201_CREATED)
def add_bookmark(article_id: int, db: Session = Depends(get_db)):
    """
    Bookmark an article by ID.
    """
    article = db.query(Article).filter(Article.id == article_id).first()
    if not article:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Article with ID {article_id} not found.",
        )

    existing = db.query(Bookmark).filter(Bookmark.article_id == article_id).first()
    if existing:
        art_res = ArticleResponse.model_validate(article)
        art_res.is_bookmarked = True
        return BookmarkResponse(
            id=existing.id,
            article_id=existing.article_id,
            created_at=existing.created_at,
            article=art_res,
        )

    new_bm = Bookmark(article_id=article_id)
    db.add(new_bm)
    db.commit()
    db.refresh(new_bm)

    art_res = ArticleResponse.model_validate(article)
    art_res.is_bookmarked = True

    return BookmarkResponse(
        id=new_bm.id,
        article_id=new_bm.article_id,
        created_at=new_bm.created_at,
        article=art_res,
    )


@router.delete("/{article_id}")
def remove_bookmark(article_id: int, db: Session = Depends(get_db)):
    """
    Remove a bookmark for an article by ID.
    """
    bm = db.query(Bookmark).filter(Bookmark.article_id == article_id).first()
    if not bm:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Bookmark for article ID {article_id} does not exist.",
        )

    db.delete(bm)
    db.commit()
    return {"detail": f"Bookmark for article ID {article_id} removed successfully."}
