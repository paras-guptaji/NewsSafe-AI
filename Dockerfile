# Single-stage lightweight Dockerfile for NewsSafe AI
FROM python:3.11-slim
WORKDIR /app

# Install build dependencies for lxml and trafilatura
RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc \
    libxml2-dev \
    libxslt-dev \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Install Python dependencies
COPY backend/requirements.txt ./backend/
RUN pip install --no-cache-dir -r backend/requirements.txt

# Copy backend application
COPY backend/ ./backend/

# Copy pre-built production frontend assets
COPY frontend/dist/ ./frontend/dist/

ENV PORT=8000
EXPOSE 8000

WORKDIR /app/backend
CMD ["sh", "-c", "uvicorn main:app --host 0.0.0.0 --port ${PORT:-8000}"]
