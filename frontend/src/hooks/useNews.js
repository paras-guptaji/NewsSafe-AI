import { useState, useEffect, useCallback } from 'react'
import { newsAPI, bookmarksAPI } from '../services/api'

export function useNews(initialParams = {}) {
  const [news, setNews] = useState([])
  const [totalCount, setTotalCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [params, setParams] = useState(initialParams)
  const [bookmarkedIds, setBookmarkedIds] = useState(new Set())

  const fetchNews = useCallback(async (customParams = params) => {
    setLoading(true)
    setError(null)
    try {
      const response = await newsAPI.getNews(customParams)
      // Backend may return an array directly or an object { items: [], total: ... } or { news: [], count: ... }
      const data = response.data
      let articles = []
      let total = 0

      if (Array.isArray(data)) {
        articles = data
        total = data.length
      } else if (data && Array.isArray(data.articles)) {
        articles = data.articles
        total = data.total || data.count || data.articles.length
      } else if (data && Array.isArray(data.items)) {
        articles = data.items
        total = data.total || data.count || data.items.length
      } else if (data && Array.isArray(data.news)) {
        articles = data.news
        total = data.total || data.count || data.news.length
      } else {
        articles = []
      }

      setNews(articles)
      setTotalCount(total)

      // Sync bookmarked status if included in article objects
      const bookmarked = new Set()
      articles.forEach((art) => {
        if (art.is_bookmarked) {
          bookmarked.add(art.id)
        }
      })
      if (bookmarked.size > 0) {
        setBookmarkedIds((prev) => new Set([...prev, ...bookmarked]))
      }
    } catch (err) {
      console.error('Failed to fetch news:', err)
      setError(err.message || 'Failed to load news articles')
    } finally {
      setLoading(false)
    }
  }, [params])

  // Fetch bookmarks once to track globally
  const fetchBookmarks = useCallback(async () => {
    try {
      const res = await bookmarksAPI.getBookmarks()
      const data = res.data
      const list = Array.isArray(data) ? data : data.bookmarks || data.items || []
      const ids = new Set(list.map((b) => b.id || b.article_id))
      setBookmarkedIds(ids)
    } catch (err) {
      console.error('Failed to load bookmarks list:', err)
    }
  }, [])

  const toggleBookmark = useCallback(async (articleId) => {
    const isCurrentlyBookmarked = bookmarkedIds.has(articleId)
    // Optimistic update
    setBookmarkedIds((prev) => {
      const next = new Set(prev)
      if (isCurrentlyBookmarked) {
        next.delete(articleId)
      } else {
        next.add(articleId)
      }
      return next
    })

    try {
      if (isCurrentlyBookmarked) {
        await bookmarksAPI.removeBookmark(articleId)
      } else {
        await bookmarksAPI.addBookmark(articleId)
      }
    } catch (err) {
      // Revert optimistic update on failure
      setBookmarkedIds((prev) => {
        const next = new Set(prev)
        if (isCurrentlyBookmarked) {
          next.add(articleId)
        } else {
          next.delete(articleId)
        }
        return next
      })
      throw err
    }
  }, [bookmarkedIds])

  useEffect(() => {
    fetchNews()
  }, [fetchNews])

  useEffect(() => {
    fetchBookmarks()
  }, [fetchBookmarks])

  return {
    news,
    totalCount,
    loading,
    error,
    params,
    setParams,
    refetch: fetchNews,
    bookmarkedIds,
    toggleBookmark,
  }
}
