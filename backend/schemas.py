from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, ConfigDict, Field

class ArticleBase(BaseModel):
    title: str
    description: Optional[str] = None
    content: Optional[str] = None
    source_name: Optional[str] = None
    source_url: Optional[str] = None
    article_url: str
    image_url: Optional[str] = None
    published_at: Optional[datetime] = None
    news_category: Optional[str] = "general"
    age_category: Optional[str] = "Pending"
    classification_reason: Optional[str] = None
    sensitive_indicators: Optional[List[str]] = Field(default_factory=list)
    summary: Optional[str] = None
    detailed_summary: Optional[str] = None
    confidence: Optional[float] = None
    analysis_status: Optional[str] = "pending"

class ArticleCreate(ArticleBase):
    pass

class ArticleResponse(ArticleBase):
    id: int
    created_at: datetime
    analyzed_at: Optional[datetime] = None
    is_bookmarked: bool = False

    model_config = ConfigDict(from_attributes=True)

class ArticleListResponse(BaseModel):
    items: List[ArticleResponse]
    total: int
    skip: int
    limit: int

class BookmarkResponse(BaseModel):
    id: int
    article_id: int
    created_at: datetime
    article: Optional[ArticleResponse] = None

    model_config = ConfigDict(from_attributes=True)

class HistoryResponse(BaseModel):
    id: int
    article_id: int
    age_category: str
    summary: Optional[str] = None
    analysis_date: datetime
    article_title: Optional[str] = None
    article_url: Optional[str] = None
    source_name: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)

class AnalyzeUrlRequest(BaseModel):
    url: str

class AnalyzeTextRequest(BaseModel):
    title: str
    content: str
    url: Optional[str] = None

class AnalyzeResponse(BaseModel):
    age_category: str
    confidence: float
    reason: str
    sensitive_indicators: List[str] = Field(default_factory=list)
    summary: str
    content_severity: str = "Low"
    detailed_summary: Optional[str] = None
    article: Optional[ArticleResponse] = None

class NewsRefreshRequest(BaseModel):
    category: Optional[str] = "general"
    country: Optional[str] = "in"
    page_size: Optional[int] = 20

class NewsRefreshResponse(BaseModel):
    fetched: int
    new: int
    analyzed: int
    message: Optional[str] = None

class SystemStatusResponse(BaseModel):
    news_api: bool
    gemini: bool
    database: bool
    news_api_key_set: bool
    gemini_key_set: bool
    model: str

class StatsResponse(BaseModel):
    total: int
    age_18plus: int
    below_18: int
    pending: int
    bookmarks: int

class DetailedSummaryResponse(BaseModel):
    detailed_summary: str
