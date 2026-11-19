# NewsSafe AI 🛡️

> **B.Tech 7th Semester Major Project**  
> AI-Powered News Age Classification and Summarization System

NewsSafe AI is a full-stack web application that automatically collects news articles from real news sources, analyzes their content using Google Gemini AI, classifies them into age-appropriate categories (**18+** or **Below 18**), and generates easy-to-understand summaries.

---

## ✨ Features

| Feature | Description |
|---------|-------------|
| 📰 **Live News Feed** | Fetches real-time news from NewsAPI.org (India default) |
| 🤖 **AI Classification** | Google Gemini 2.0 Flash analyzes full article content |
| 🔞 **Age Categorization** | Classifies every article as **18+** or **Below 18** |
| 📝 **AI Summarization** | Generates 2–4 sentence summaries + detailed summaries |
| 🔗 **URL Analyzer** | Paste any public news URL and analyze it instantly |
| 🔖 **Bookmarks** | Save and revisit interesting articles |
| 📊 **Analytics Dashboard** | Pie charts and bar charts from real database data |
| 🔍 **Search & Filter** | Filter by category, age group, source, keyword |
| 📜 **History** | Persistent analysis history |

---

## 🛠 Technology Stack

**Frontend**
- React 18 + Vite 5
- Tailwind CSS 3
- Lucide React (icons)
- Recharts (charts)
- Axios (HTTP client)
- React Router DOM v6

**Backend**
- Python 3.10+
- FastAPI 0.115
- SQLite + SQLAlchemy ORM
- Uvicorn (ASGI server)

**AI & Data**
- Google Gemini API (gemini-2.0-flash)
- NewsAPI.org
- BeautifulSoup4 + Trafilatura (article extraction)

---

## 📋 Prerequisites

Before you begin, make sure you have:

- **Python 3.10 or higher** → [python.org](https://www.python.org/downloads/)
- **Node.js 18 or higher** → [nodejs.org](https://nodejs.org/)
- **NewsAPI Key** → Already configured (see below)
- **Google Gemini API Key** → [Get it free here](https://aistudio.google.com/app/apikey)

---

## 🚀 Installation & Setup

### Step 1: Clone or navigate to the project folder

```bash
cd "NewsSafe-AI"
```

### Step 2: Configure Backend Environment

```bash
cd backend
```

The `.env` file already exists with the NewsAPI key. You only need to add your Gemini API key:

Open `backend/.env` and add your Gemini key:

```env
NEWS_API_KEY=781875ad47dd4666808d8b9fc48f3d96
GEMINI_API_KEY=your_gemini_api_key_here
GEMINI_MODEL=gemini-2.0-flash
DATABASE_URL=sqlite:///./newssafe.db
```

> **How to get a Gemini API key (FREE):**
> 1. Go to [https://aistudio.google.com/app/apikey](https://aistudio.google.com/app/apikey)
> 2. Sign in with your Google account
> 3. Click **"Create API Key"**
> 4. Copy the key and paste it into `backend/.env`

### Step 3: Install Backend Dependencies

```bash
cd backend
pip install -r requirements.txt
```

### Step 4: Install Frontend Dependencies

```bash
cd frontend
npm install
```

---

## ▶️ Running the Application

You need **two terminal windows** running simultaneously.

### Terminal 1 — Start Backend

```bash
cd backend
python -m uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

The backend API will be available at: **http://localhost:8000**  
Swagger API docs: **http://localhost:8000/docs**

### Terminal 2 — Start Frontend

```bash
cd frontend
npm run dev
```

The frontend will be available at: **http://localhost:5173**

---

## 🔑 API Key Setup Details

### NewsAPI Key (Already Configured)
- Key: `781875ad47dd4666808d8b9fc48f3d96`
- Already set in `backend/.env`
- Free plan: 100 requests/day, top headlines
- Default country: India (in)

### Google Gemini API Key (You Must Add This)
- **Required** for AI classification and summarization
- **Free tier:** 15 requests/minute, 1,500 requests/day
- **Without it:** Articles still get saved but show "Gemini API key not set" notice
- **With it:** Full AI classification, confidence scores, summaries

---

## 🗄️ Database Information

- **Type:** SQLite (file-based, no server needed)
- **Location:** `backend/newssafe.db`
- **Tables:**
  - `articles` — All news articles with AI analysis results
  - `bookmarks` — User-saved articles
  - `analysis_history` — Log of all analysis events
- **Created automatically** on first backend startup

---

## 🌐 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/health` | Server health check |
| `GET` | `/api/stats` | Dashboard statistics |
| `GET` | `/api/news` | List articles (with filters) |
| `POST` | `/api/news/refresh` | Fetch fresh news from NewsAPI |
| `GET` | `/api/news/{id}` | Single article details |
| `POST` | `/api/news/{id}/analyze` | Re-analyze an article |
| `POST` | `/api/news/{id}/detailed-summary` | Generate detailed summary |
| `POST` | `/api/analyze-url` | Analyze a news URL |
| `POST` | `/api/analyze-text` | Analyze manually pasted text |
| `GET` | `/api/bookmarks` | List bookmarks |
| `POST` | `/api/bookmarks/{id}` | Add bookmark |
| `DELETE` | `/api/bookmarks/{id}` | Remove bookmark |
| `GET` | `/api/history` | Analysis history |
| `GET` | `/api/settings/status` | API connectivity status |

**Full interactive API docs:** `http://localhost:8000/docs`

---

## 📁 Project Structure

```
NewsSafe-AI/
│
├── frontend/                   # React + Vite frontend
│   ├── src/
│   │   ├── components/         # Reusable UI components
│   │   ├── pages/              # Route pages (Dashboard, AllNews, etc.)
│   │   ├── services/           # Axios API client
│   │   ├── hooks/              # Custom React hooks
│   │   ├── layouts/            # Page layout wrappers
│   │   └── App.jsx             # Root component with routing
│   ├── package.json
│   └── vite.config.js
│
├── backend/                    # FastAPI Python backend
│   ├── main.py                 # App entry point, CORS, routes
│   ├── database.py             # SQLAlchemy engine setup
│   ├── models.py               # Database models
│   ├── schemas.py              # Pydantic request/response schemas
│   ├── config.py               # Environment configuration
│   ├── routes/                 # API route handlers
│   │   ├── news.py
│   │   ├── analyze.py
│   │   ├── bookmarks.py
│   │   ├── history.py
│   │   └── settings.py
│   ├── services/               # Business logic
│   │   ├── gemini_service.py   # Gemini AI integration
│   │   ├── news_service.py     # NewsAPI integration
│   │   ├── article_extractor.py# URL content extraction
│   │   └── classification_service.py
│   ├── requirements.txt
│   └── .env                    # API keys (not in git)
│
├── .env.example                # Example environment config
├── .gitignore
└── README.md
```

---

## 🔒 Security Features

- API keys stored server-side only (never sent to frontend)
- SSRF protection: blocks localhost, private IPs, internal hostnames
- Input validation on all endpoints
- Request timeouts (15 seconds)
- No stack traces exposed to users

---

## 🧪 How to Test

1. **Open** http://localhost:5173 in your browser
2. **Click "Refresh News"** on the dashboard → real articles from India will load
3. **Click "View Analysis"** on any article → see AI classification result
4. **Go to "Analyze URL"** → paste any public news article URL
5. **Check Settings page** → verify API connectivity status
6. **Bookmark articles** → check Bookmarks page
7. **View History** → see all past analyses

---

## 🐛 Troubleshooting

### Backend won't start
```
# Check Python version (needs 3.10+)
python --version

# Reinstall dependencies
pip install -r requirements.txt --force-reinstall
```

### "Gemini API key not configured"
- Add `GEMINI_API_KEY=your_key` to `backend/.env`
- Restart the backend server

### "Failed to connect to NewsAPI"
- Check your internet connection
- NewsAPI free plan: 100 requests/day limit

### CORS errors in browser
- Make sure backend is running on port 8000
- Make sure frontend is running on port 5173

### Frontend can't reach backend
- Vite proxies `/api` calls to `http://localhost:8000`
- Verify both servers are running simultaneously

---

## 👨‍💻 Project Information

- **Project Name:** NewsSafe AI
- **Type:** B.Tech 7th Semester Major Project
- **Domain:** AI / Full-Stack Web Development
- **Core Problem:** Need for age-appropriate news filtering for younger audiences
- **Solution:** AI-powered content moderation using Google Gemini

---

## 📊 How AI Classification Works

1. Article is fetched from NewsAPI or extracted from a URL
2. Title + Description + Content are sent to Google Gemini
3. Gemini analyzes the **context and severity** (not just keywords)
4. Returns: age category, confidence score, reason, sensitive indicators, summary
5. Result is stored in SQLite and displayed in the UI

**Classification rules:**
- 🟢 **Below 18** (default): Regular news, sports, education, technology, business
- 🔴 **18+** (strict threshold): Only when content has EXPLICIT graphic violence, sexual content, drug promotion, or self-harm details

---

*Built with ❤️ for academic purposes — NewsSafe AI B.Tech Major Project*
