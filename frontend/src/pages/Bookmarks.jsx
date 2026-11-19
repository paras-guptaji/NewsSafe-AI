import React, { useState, useEffect, useCallback } from 'react'
import { Bookmark, Newspaper, ArrowRight } from 'lucide-react'
import { Link } from 'react-router-dom'
import NewsCard from '../components/NewsCard'
import LoadingSpinner from '../components/LoadingSpinner'
import { bookmarksAPI } from '../services/api'

export default function Bookmarks() {
  const [bookmarks, setBookmarks] = useState([])
  const [loading, setLoading] = useState(true)
  const [errorMsg, setErrorMsg] = useState(null)

  const fetchBookmarks = useCallback(async () => {
    setLoading(true)
    setErrorMsg(null)
    try {
      const res = await bookmarksAPI.getBookmarks()
      const data = res.data
      let list = []
      if (Array.isArray(data)) {
        list = data
      } else if (data && Array.isArray(data.bookmarks)) {
        list = data.bookmarks
      } else if (data && Array.isArray(data.items)) {
        list = data.items
      }
      setBookmarks(list)
    } catch (err) {
      console.error('Failed to load bookmarks:', err)
      setErrorMsg(err.message || 'Failed to load saved bookmarks.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchBookmarks()
  }, [fetchBookmarks])

  const handleRemoveBookmark = async (articleId) => {
    const previous = bookmarks
    setBookmarks((prev) => prev.filter((item) => (item.id || item.article_id) !== articleId))

    try {
      await bookmarksAPI.removeBookmark(articleId)
    } catch {
      setBookmarks(previous)
      setErrorMsg('Failed to remove bookmark.')
    }
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-12">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Saved Articles</h1>
          <p className="text-xs sm:text-sm text-gray-500 mt-0.5">
            Articles bookmarked for reference and reading.
          </p>
        </div>
        <span className="text-xs text-gray-500 bg-white border border-gray-200 px-3 py-1.5 rounded-lg">
          {bookmarks.length} saved
        </span>
      </div>

      {errorMsg && (
        <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-lg">
          {errorMsg}
        </div>
      )}

      {loading ? (
        <div className="py-24 flex justify-center">
          <LoadingSpinner />
        </div>
      ) : bookmarks.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-xl p-16 text-center max-w-md mx-auto space-y-3">
          <Newspaper className="w-10 h-10 text-gray-300 mx-auto" />
          <h3 className="text-base font-semibold text-gray-800">No saved articles</h3>
          <p className="text-xs text-gray-500">
            Bookmark any news article by clicking the bookmark icon on its card.
          </p>
          <div className="pt-2">
            <Link
              to="/news"
              className="inline-flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium px-4 py-2 rounded-lg transition-colors"
            >
              <span>Browse News</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {bookmarks.map((item) => {
            const article = item.article || item
            const articleId = article.id || item.article_id
            return (
              <NewsCard
                key={articleId}
                article={article}
                isBookmarked={true}
                onBookmark={() => handleRemoveBookmark(articleId)}
              />
            )
          })}
        </div>
      )}
    </div>
  )
}
