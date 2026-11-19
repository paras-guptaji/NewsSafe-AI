from datetime import datetime
from sqlalchemy import Column, Integer, String, Text, Float, DateTime, ForeignKey, JSON
from sqlalchemy.orm import relationship
from database import Base

class Article(Base):
    __tablename__ = "articles"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    title = Column(String(500), nullable=False)
    description = Column(Text, nullable=True)
    content = Column(Text, nullable=True)
    source_name = Column(String(200), nullable=True)
    source_url = Column(String(500), nullable=True)
    article_url = Column(String(1000), unique=True, index=True, nullable=False)
    image_url = Column(String(1000), nullable=True)
    published_at = Column(DateTime, nullable=True)
    news_category = Column(String(100), nullable=True, default="general")
    age_category = Column(String(50), nullable=False, default="Pending")  # "18+", "Below 18", "Pending"
    classification_reason = Column(Text, nullable=True)
    sensitive_indicators = Column(JSON, nullable=True, default=list)
    summary = Column(Text, nullable=True)
    detailed_summary = Column(Text, nullable=True)
    confidence = Column(Float, nullable=True)
    analysis_status = Column(String(50), nullable=False, default="pending")  # "pending", "analyzed", "failed"
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    analyzed_at = Column(DateTime, nullable=True)

    bookmarks = relationship("Bookmark", back_populates="article", cascade="all, delete-orphan")
    history = relationship("AnalysisHistory", back_populates="article", cascade="all, delete-orphan")


class Bookmark(Base):
    __tablename__ = "bookmarks"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    article_id = Column(Integer, ForeignKey("articles.id", ondelete="CASCADE"), nullable=False, unique=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    article = relationship("Article", back_populates="bookmarks")


class AnalysisHistory(Base):
    __tablename__ = "analysis_history"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    article_id = Column(Integer, ForeignKey("articles.id", ondelete="CASCADE"), nullable=False)
    age_category = Column(String(50), nullable=False)
    summary = Column(Text, nullable=True)
    analysis_date = Column(DateTime, default=datetime.utcnow, nullable=False)

    article = relationship("Article", back_populates="history")
