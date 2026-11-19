import React, { useState, useEffect, useCallback } from 'react'
import { RefreshCw, ShieldAlert, ShieldCheck, Clock, Newspaper, ChevronRight, CheckCircle, AlertCircle } from 'lucide-react'
import { Link } from 'react-router-dom'
import NewsCard from '../components/NewsCard'
import LoadingSpinner from '../components/LoadingSpinner'
import { newsAPI, statsAPI, bookmarksAPI } from '../services/api'

export default function Dashboard() {
  const [stats, setStats] = useState(null)
  const [recentNews, setRecentNews] = useState([])
  const [newsLoading, setNewsLoading] = useState(true)
  const [bookmarkedIds, setBookmarkedIds] = useState(new Set())
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [notification, setNotification] = useState(null)
  const [error, setError] = useState(null)

  const fetchStats = useCallback(async () => {
    try {
      const res = await statsAPI.getStats()
      setStats(res.data)
    } catch (e) {
      console.error('Stats error:', e)
    }
  }, [])

  const fetchRecentNews = useCallback(async () => {
    setNewsLoading(true)
    try {
      const res = await newsAPI.getNews({ limit: 9, sort: 'newest' })
      const data = res.data
      const list = Array.isArray(data) ? data : data.items || data.articles || data.news || []
      setRecentNews(list)
    } catch (e) {
      console.error('News fetch error:', e)
    } finally {
      setNewsLoading(false)
    }
  }, [])

  const fetchBookmarks = useCallback(async () => {
    try {
      const res = await bookmarksAPI.getBookmarks()
      const data = res.data
      const list = Array.isArray(data) ? data : data.bookmarks || data.items || []
      setBookmarkedIds(new Set(list.map((b) => b.article_id || b.id)))
    } catch (e) {
      console.error('Bookmarks error:', e)
    }
  }, [])

  useEffect(() => {
    fetchStats()
    fetchRecentNews()
    fetchBookmarks()
  }, [fetchStats, fetchRecentNews, fetchBookmarks])

  const handleRefresh = async () => {
    setIsRefreshing(true)
    setError(null)
    setNotification(null)
    try {
      const res = await newsAPI.refreshNews({ category: 'general', country: 'in', page_size: 20 })
      const r = res.data || {}
      const fetched = r.fetched ?? 0
      const analyzed = r.analyzed ?? 0
      setNotification(`Fetched ${fetched} articles, ${analyzed} analyzed.`)
      await Promise.all([fetchStats(), fetchRecentNews()])
    } catch (e) {
      setError(e?.response?.data?.detail || e.message || 'Failed to refresh news')
    } finally {
      setIsRefreshing(false)
    }
  }

  const handleToggleBookmark = async (articleId) => {
    const isBookmarked = bookmarkedIds.has(articleId)
    setBookmarkedIds((prev) => {
      const next = new Set(prev)
      isBookmarked ? next.delete(articleId) : next.add(articleId)
      return next
    })
    try {
      isBookmarked
        ? await bookmarksAPI.removeBookmark(articleId)
        : await bookmarksAPI.addBookmark(articleId)
    } catch {
      setBookmarkedIds((prev) => {
        const next = new Set(prev)
        isBookmarked ? next.add(articleId) : next.delete(articleId)
        return next
      })
    }
  }

  const total = stats?.total ?? 0
  const adult = stats?.age_18plus ?? 0
  const below = stats?.below_18 ?? 0
  const pending = stats?.pending ?? 0

  return (
    <div className="max-w-7xl mx-auto space-y-7 pb-10">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-sm text-gray-500 mt-0.5">AI-powered news classification and summarization</p>
        </div>
        <button
          onClick={handleRefresh}
          disabled={isRefreshing}
          className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
        >
          <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          {isRefreshing ? 'Refreshing...' : 'Refresh News'}
        </button>
      </div>

      {/* Notification */}
      {notification && (
        <div className="flex items-center gap-2 text-sm text-green-700 bg-green-50 border border-green-200 px-4 py-3 rounded-lg">
          <CheckCircle className="w-4 h-4 flex-shrink-0" />
          <span>{notification}</span>
          <button onClick={() => setNotification(null)} className="ml-auto text-green-500 hover:text-green-700 text-xs">Dismiss</button>
        </div>
      )}
      {error && (
        <div className="flex items-center gap-2 text-sm text-red-700 bg-red-50 border border-red-200 px-4 py-3 rounded-lg">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
          <button onClick={() => setError(null)} className="ml-auto text-red-500 hover:text-red-700 text-xs">Dismiss</button>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-medium text-gray-500">Total Articles</span>
            <Newspaper className="w-4 h-4 text-gray-400" />
          </div>
          <p className="text-2xl font-bold text-gray-900">{total}</p>
          <p className="text-xs text-gray-400 mt-1">In database</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-medium text-gray-500">18+ Restricted</span>
            <ShieldAlert className="w-4 h-4 text-red-400" />
          </div>
          <p className="text-2xl font-bold text-red-600">{adult}</p>
          <p className="text-xs text-gray-400 mt-1">Mature content</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-medium text-gray-500">Below 18 Safe</span>
            <ShieldCheck className="w-4 h-4 text-green-400" />
          </div>
          <p className="text-2xl font-bold text-green-600">{below}</p>
          <p className="text-xs text-gray-400 mt-1">Family friendly</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-medium text-gray-500">Pending</span>
            <Clock className="w-4 h-4 text-yellow-400" />
          </div>
          <p className="text-2xl font-bold text-yellow-600">{pending}</p>
          <p className="text-xs text-gray-400 mt-1">Awaiting analysis</p>
        </div>
      </div>

      {/* Recent Headlines */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Recent Headlines</h2>
          <Link
            to="/news"
            className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1"
          >
            View all <ChevronRight className="w-4 h-4" />
          </Link>
        </div>

        {newsLoading ? (
          <div className="py-16 flex justify-center">
            <LoadingSpinner />
          </div>
        ) : recentNews.length === 0 ? (
          <div className="bg-white border border-gray-200 rounded-xl p-12 text-center">
            <Newspaper className="w-10 h-10 text-gray-300 mx-auto mb-3" />
            <h3 className="text-base font-medium text-gray-700 mb-1">No news yet</h3>
            <p className="text-sm text-gray-400">Click "Refresh News" to fetch latest articles from India.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {recentNews.map((article) => (
              <NewsCard
                key={article.id}
                article={article}
                isBookmarked={bookmarkedIds.has(article.id)}
                onBookmark={handleToggleBookmark}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
