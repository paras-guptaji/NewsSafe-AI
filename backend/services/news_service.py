import logging
from datetime import datetime
from typing import List, Dict, Any, Optional
import requests
from dateutil import parser as date_parser
from sqlalchemy.orm import Session
from config import NEWS_API_KEY
from models import Article

logger = logging.getLogger(__name__)

NEWS_API_BASE_URL = "https://newsapi.org/v2"

class NewsAPIException(Exception):
    def __init__(self, message: str, status_code: int = 400):
        super().__init__(message)
        self.message = message
        self.status_code = status_code


def parse_datetime(dt_str: Optional[str]) -> Optional[datetime]:
    if not dt_str:
        return None
    try:
        return date_parser.parse(dt_str)
    except Exception:
        return None


def fetch_news(
    category: str = "general",
    country: str = "in",
    page_size: int = 20,
    keywords: Optional[str] = None
) -> List[Dict[str, Any]]:
    """
    Fetches news from NewsAPI top-headlines and everything endpoints.
    Deduplicates results by article URL.
    """
    if not NEWS_API_KEY:
        raise NewsAPIException("NewsAPI key is not configured.", status_code=500)

    headers = {
        "X-Api-Key": NEWS_API_KEY,
        "User-Agent": "NewsSafeAI/1.0"
    }

    articles_by_url: Dict[str, Dict[str, Any]] = {}

    # 1. Fetch top-headlines
    top_params: Dict[str, Any] = {
        "pageSize": min(page_size, 100),
    }
    if country:
        top_params["country"] = country
    if category and category != "all":
        top_params["category"] = category
    if keywords:
        top_params["q"] = keywords

    try:
        resp = requests.get(
            f"{NEWS_API_BASE_URL}/top-headlines",
            params=top_params,
            headers=headers,
            timeout=15
        )
        data = resp.json()
        if resp.status_code != 200 or data.get("status") == "error":
            code = data.get("code", "")
            message = data.get("message", "Unknown NewsAPI error")
            logger.warning(f"NewsAPI top-headlines warning ({code}): {message}")
            if resp.status_code in (401, 403):
                raise NewsAPIException(f"NewsAPI authentication error: {message}", status_code=resp.status_code)
            elif resp.status_code == 429:
                raise NewsAPIException(f"NewsAPI rate limit exceeded: {message}", status_code=429)
        else:
            for item in data.get("articles", []):
                url = (item.get("url") or "").strip()
                title = (item.get("title") or "").strip()
                if not url or not title or title == "[Removed]" or url == "https://removed.com":
                    continue
                articles_by_url[url] = item

    except requests.RequestException as e:
        logger.error(f"Network error calling NewsAPI top-headlines: {e}")
        if not articles_by_url and not keywords:
            raise NewsAPIException(f"Failed to connect to NewsAPI: {str(e)}", status_code=503)

    # 2. Fetch everything if keywords provided or if top-headlines yielded few items
    if keywords or len(articles_by_url) < (page_size // 2):
        query_text = keywords if keywords else (category if category != "general" else "news")
        everything_params = {
            "q": query_text,
            "sortBy": "publishedAt",
            "pageSize": min(page_size, 100),
            "language": "en",
        }
        try:
            resp = requests.get(
                f"{NEWS_API_BASE_URL}/everything",
                params=everything_params,
                headers=headers,
                timeout=15
            )
            data = resp.json()
            if resp.status_code == 200 and data.get("status") == "ok":
                for item in data.get("articles", []):
                    url = (item.get("url") or "").strip()
                    title = (item.get("title") or "").strip()
                    if not url or not title or title == "[Removed]" or url == "https://removed.com":
                        continue
                    if url not in articles_by_url:
                        articles_by_url[url] = item
        except requests.RequestException as e:
            logger.warning(f"Network error calling NewsAPI everything endpoint: {e}")

    # Format articles into standardized dicts
    results: List[Dict[str, Any]] = []
    for item in articles_by_url.values():
        source_data = item.get("source") or {}
        results.append({
            "title": (item.get("title") or "").strip(),
            "description": (item.get("description") or "").strip(),
            "content": (item.get("content") or "").strip(),
            "source_name": (source_data.get("name") or "").strip() or None,
            "source_url": None,
            "article_url": (item.get("url") or "").strip(),
            "image_url": (item.get("urlToImage") or "").strip() or None,
            "published_at": parse_datetime(item.get("publishedAt")),
            "news_category": category,
        })

    return results[:page_size]


def refresh_news(
    db: Session,
    category: str = "general",
    country: str = "in",
    page_size: int = 20
) -> Dict[str, Any]:
    """
    Fetches latest news from NewsAPI, saves new articles to database with status='pending',
    and triggers automated classification for new articles.
    """
    from services.classification_service import classify_article

    fetched_articles = fetch_news(
        category=category,
        country=country,
        page_size=page_size
    )

    new_count = 0
    analyzed_count = 0
    new_article_ids: List[int] = []

    for art_data in fetched_articles:
        url = art_data["article_url"]
        # Skip duplicates in database
        existing = db.query(Article).filter(Article.article_url == url).first()
        if existing:
            continue

        new_article = Article(
            title=art_data["title"],
            description=art_data["description"],
            content=art_data["content"],
            source_name=art_data["source_name"],
            source_url=art_data["source_url"],
            article_url=art_data["article_url"],
            image_url=art_data["image_url"],
            published_at=art_data["published_at"],
            news_category=art_data["news_category"],
            age_category="Pending",
            analysis_status="pending",
        )
        db.add(new_article)
        db.flush()  # Populates new_article.id
        new_article_ids.append(new_article.id)
        new_count += 1

    db.commit()

    # Trigger classification on newly inserted articles
    for art_id in new_article_ids:
        try:
            success = classify_article(db, art_id)
            if success:
                analyzed_count += 1
        except Exception as e:
            logger.error(f"Error classifying article {art_id}: {e}")

    return {
        "fetched": len(fetched_articles),
        "new": new_count,
        "analyzed": analyzed_count,
        "message": f"Successfully fetched {len(fetched_articles)} articles, added {new_count} new, analyzed {analyzed_count}."
    }
