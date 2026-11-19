import time
import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request, Depends
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session

from database import engine, Base, get_db
from models import Article, Bookmark
from schemas import StatsResponse
from routes.news import router as news_router
from routes.bookmarks import router as bookmarks_router
from routes.history import router as history_router
from routes.settings import router as settings_router
from routes.analyze import router as analyze_router

# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger("NewsSafeAI")


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Starting NewsSafe AI Backend...")
    # Create database tables if they do not exist
    Base.metadata.create_all(bind=engine)
    logger.info("Database schema initialized.")
    yield
    logger.info("Shutting down NewsSafe AI Backend...")


app = FastAPI(
    title="NewsSafe AI API",
    description="Intelligent News Categorization, Age-Suitability Moderation, and Summarization API",
    version="1.0.0",
    lifespan=lifespan,
)

# CORS Middleware (allow all origins for dev)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Request logging middleware
@app.middleware("http")
async def log_requests(request: Request, call_next):
    start_time = time.time()
    response = await call_next(request)
    process_time = time.time() - start_time
    logger.info(
        f"{request.method} {request.url.path} -> {response.status_code} ({process_time:.4f}s)"
    )
    return response


# Include modular routers
app.include_router(news_router)
app.include_router(bookmarks_router)
app.include_router(history_router)
app.include_router(settings_router)
app.include_router(analyze_router)


# Core system routes
@app.get("/api/health", tags=["Health"])
def health_check():
    """
    Health check endpoint returning system status and version.
    """
    return {
        "status": "ok",
        "version": "1.0.0",
        "service": "NewsSafe AI Backend",
    }


@app.get("/api/stats", response_model=StatsResponse, tags=["Stats"])
def get_stats(db: Session = Depends(get_db)):
    """
    Aggregate statistics for articles, age classifications, and bookmarks.
    """
    total = db.query(Article).count()
    age_18plus = db.query(Article).filter(Article.age_category == "18+").count()
    below_18 = db.query(Article).filter(Article.age_category == "Below 18").count()
    pending = db.query(Article).filter(Article.age_category == "Pending").count()
    bookmarks_count = db.query(Bookmark).count()

    return StatsResponse(
        total=total,
        age_18plus=age_18plus,
        below_18=below_18,
        pending=pending,
        bookmarks=bookmarks_count,
    )


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
