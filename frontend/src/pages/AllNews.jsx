import React, { useState, useEffect, useCallback } from 'react'
import { useSearchParams } from 'react-router-dom'
import {
  Search,
  Filter,
  Layers,
  Calendar,
  Building2,
  ChevronLeft,
  ChevronRight,
  RotateCcw,
} from 'lucide-react'
import NewsCard from '../components/NewsCard'
import LoadingSpinner from '../components/LoadingSpinner'
import { newsAPI, bookmarksAPI } from '../services/api'

export default function AllNews() {
  const [searchParams, setSearchParams] = useSearchParams()

  // Derived filter state directly from URL query parameters (single source of truth)
  const urlAge = searchParams.get('age') || 'all'
  const activeAge =
    urlAge === '18plus' || urlAge === '18+'
      ? '18+'
      : urlAge === 'below18' || urlAge === 'Below 18'
      ? 'Below 18'
      : urlAge === 'pending'
      ? 'Pending'
      : 'all'

  const activeSearch = searchParams.get('search') || ''
  const activeCategory = searchParams.get('category') || 'all'
  const activeSort = searchParams.get('sort') || 'newest'
  const activeSource = searchParams.get('source') || 'all'
  const currentPage = parseInt(searchParams.get('page') || '1', 10)
  const pageSize = 12

  // Local search input state (debounced)
  const [searchInput, setSearchInput] = useState(activeSearch)

  // Keep local search input synced if URL search changes externally
  useEffect(() => {
    setSearchInput(activeSearch)
  }, [activeSearch])

  // Data states
  const [articles, setArticles] = useState([])
  const [totalCount, setTotalCount] = useState(0)
  const [availableSources, setAvailableSources] = useState([])
  const [loading, setLoading] = useState(true)
  const [errorMsg, setErrorMsg] = useState(null)
  const [bookmarkedIds, setBookmarkedIds] = useState(new Set())

  // Helper to update a URL parameter safely without circular loops
  const updateQueryParam = useCallback(
    (key, value) => {
      setSearchParams((prev) => {
        const next = new URLSearchParams(prev)
        if (!value || value === 'all' || value === '') {
          next.delete(key)
        } else {
          next.set(key, value)
        }
        if (key !== 'page') {
          next.delete('page') // Reset to page 1 on filter changes
        }
        return next
      })
    },
    [setSearchParams]
  )

  // Debounce search input to URL (400ms)
  useEffect(() => {
    const handler = setTimeout(() => {
      if (searchInput !== activeSearch) {
        updateQueryParam('search', searchInput.trim())
      }
    }, 400)
    return () => clearTimeout(handler)
  }, [searchInput, activeSearch, updateQueryParam])

  // Fetch bookmarks
  const fetchBookmarks = useCallback(async () => {
    try {
      const res = await bookmarksAPI.getBookmarks()
      const data = res.data
      const list = Array.isArray(data) ? data : data.bookmarks || data.items || []
      setBookmarkedIds(new Set(list.map((b) => b.id || b.article_id)))
    } catch (err) {
      console.error('Error fetching bookmarks:', err)
    }
  }, [])

  // Fetch News articles
  const fetchArticles = useCallback(async () => {
    setLoading(true)
    setErrorMsg(null)
    try {
      const queryParams = {
        skip: (currentPage - 1) * pageSize,
        limit: pageSize,
        sort: activeSort,
      }
      if (activeSearch) queryParams.search = activeSearch
      if (activeAge !== 'all') queryParams.age_category = activeAge
      if (activeCategory !== 'all') queryParams.category = activeCategory
      if (activeSource !== 'all') queryParams.source = activeSource

      const response = await newsAPI.getNews(queryParams)
      const data = response.data

      let list = []
      let total = 0

      if (Array.isArray(data)) {
        list = data
        total = data.length
      } else if (data && Array.isArray(data.items)) {
        list = data.items
        total = data.total || data.items.length
      } else if (data && Array.isArray(data.articles)) {
        list = data.articles
        total = data.total || data.articles.length
      }

      setArticles(list)
      setTotalCount(total)

      // Collect sources
      const sourcesSet = new Set(availableSources)
      list.forEach((item) => {
        const sName =
          item.source_name ||
          (typeof item.source === 'object' ? item.source?.name : item.source)
        if (sName) sourcesSet.add(sName)
      })
      setAvailableSources(Array.from(sourcesSet))
    } catch (err) {
      console.error('Error loading news:', err)
      setErrorMsg(err.message || 'Failed to load news articles')
    } finally {
      setLoading(false)
    }
  }, [currentPage, pageSize, activeSort, activeSearch, activeAge, activeCategory, activeSource])

  useEffect(() => {
    fetchArticles()
  }, [fetchArticles])

  useEffect(() => {
    fetchBookmarks()
  }, [fetchBookmarks])

  const handleToggleBookmark = async (articleId) => {
    const isBookmarked = bookmarkedIds.has(articleId)
    setBookmarkedIds((prev) => {
      const next = new Set(prev)
      if (isBookmarked) next.delete(articleId)
      else next.add(articleId)
      return next
    })

    try {
      if (isBookmarked) {
        await bookmarksAPI.removeBookmark(articleId)
      } else {
        await bookmarksAPI.addBookmark(articleId)
      }
    } catch {
      setBookmarkedIds((prev) => {
        const next = new Set(prev)
        if (isBookmarked) next.add(articleId)
        else next.delete(articleId)
        return next
      })
    }
  }

  const handleResetFilters = () => {
    setSearchInput('')
    setSearchParams(new URLSearchParams())
  }

  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize))

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-12">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          News Directory
        </h1>
        <p className="text-sm text-gray-500 mt-0.5">
          Browse, filter, and inspect verified news stories with AI age classification.
        </p>
      </div>

      {errorMsg && (
        <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-lg">
          {errorMsg}
        </div>
      )}

      {/* Filter Toolbar */}
      <div className="bg-white border border-gray-200 rounded-xl p-4 space-y-3.5">
        {/* Row 1: Search + Quick Age Pills */}
        <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
          {/* Search Box */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search by keywords, titles, or topics..."
              className="w-full pl-9 pr-3.5 py-1.5 text-sm bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-colors"
            />
          </div>

          {/* Age Classification Filter Pills */}
          <div className="flex items-center gap-1 p-1 bg-gray-100 rounded-lg overflow-x-auto no-scrollbar w-full sm:w-auto">
            {[
              { id: 'all', label: 'All' },
              { id: 'below18', label: 'Below 18' },
              { id: '18plus', label: '18+ Restricted' },
              { id: 'pending', label: 'Pending' },
            ].map((tab) => {
              const isActive =
                tab.id === 'all'
                  ? activeAge === 'all'
                  : tab.id === '18plus'
                  ? activeAge === '18+'
                  : tab.id === 'below18'
                  ? activeAge === 'Below 18'
                  : activeAge === 'Pending'

              return (
                <button
                  key={tab.id}
                  onClick={() => updateQueryParam('age', tab.id === 'all' ? '' : tab.id)}
                  className={`px-3 py-1.5 rounded-md text-xs font-medium whitespace-nowrap flex-shrink-0 transition-colors ${
                    isActive
                      ? 'bg-white text-gray-900 shadow-xs font-semibold'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  {tab.label}
                </button>
              )
            })}
          </div>
        </div>

        {/* Row 2: Secondary Dropdowns */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3 border-t border-gray-100">
          {/* Topic Category */}
          <div>
            <label className="block text-[11px] font-medium text-gray-500 mb-1">Topic</label>
            <select
              value={activeCategory}
              onChange={(e) => updateQueryParam('category', e.target.value)}
              className="w-full bg-gray-50 border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs text-gray-700 focus:outline-none focus:border-blue-400"
            >
              <option value="all">All Topics</option>
              <option value="general">General</option>
              <option value="technology">Technology</option>
              <option value="business">Business</option>
              <option value="sports">Sports</option>
              <option value="entertainment">Entertainment</option>
              <option value="health">Health</option>
              <option value="science">Science</option>
            </select>
          </div>

          {/* Source Filter */}
          <div>
            <label className="block text-[11px] font-medium text-gray-500 mb-1">Publisher</label>
            <select
              value={activeSource}
              onChange={(e) => updateQueryParam('source', e.target.value)}
              className="w-full bg-gray-50 border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs text-gray-700 focus:outline-none focus:border-blue-400"
            >
              <option value="all">All Publishers</option>
              {availableSources.map((src) => (
                <option key={src} value={src}>
                  {src}
                </option>
              ))}
            </select>
          </div>

          {/* Sort Order */}
          <div>
            <label className="block text-[11px] font-medium text-gray-500 mb-1">Sort Order</label>
            <select
              value={activeSort}
              onChange={(e) => updateQueryParam('sort', e.target.value)}
              className="w-full bg-gray-50 border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs text-gray-700 focus:outline-none focus:border-blue-400"
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
            </select>
          </div>

          {/* Reset Filters Button */}
          <div className="flex items-end">
            <button
              type="button"
              onClick={handleResetFilters}
              className="w-full h-8 px-3 rounded-lg border border-gray-200 hover:bg-gray-50 text-gray-600 text-xs font-medium flex items-center justify-center gap-1.5 transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset</span>
            </button>
          </div>
        </div>
      </div>

      {/* Results Count */}
      <div className="flex items-center justify-between text-xs text-gray-500 px-1">
        <span>
          Showing <strong className="text-gray-800">{articles.length}</strong> of{' '}
          <strong className="text-gray-800">{totalCount || articles.length}</strong> articles
        </span>
        {totalPages > 1 && (
          <span>
            Page {currentPage} of {totalPages}
          </span>
        )}
      </div>

      {/* Grid of Articles */}
      {loading ? (
        <div className="py-24 flex justify-center">
          <LoadingSpinner />
        </div>
      ) : articles.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-xl p-16 text-center space-y-3">
          <Filter className="w-10 h-10 text-gray-300 mx-auto" />
          <h3 className="text-base font-semibold text-gray-800">No articles match your filters</h3>
          <p className="text-xs text-gray-400 max-w-sm mx-auto">
            Try choosing a different age category, clearing the search box, or resetting filters.
          </p>
          <button
            onClick={handleResetFilters}
            className="inline-flex items-center gap-1.5 text-xs font-medium text-blue-600 bg-blue-50 px-3.5 py-2 rounded-lg hover:bg-blue-100 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Reset Filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {articles.map((article) => (
            <NewsCard
              key={article.id}
              article={article}
              isBookmarked={bookmarkedIds.has(article.id)}
              onBookmark={handleToggleBookmark}
            />
          ))}
        </div>
      )}

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="pt-4 flex items-center justify-center gap-2">
          <button
            onClick={() => updateQueryParam('page', String(Math.max(1, currentPage - 1)))}
            disabled={currentPage === 1 || loading}
            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-gray-200 bg-white text-xs font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
            <span>Prev</span>
          </button>

          <span className="px-3 py-1.5 text-xs text-gray-600 bg-gray-100 rounded-lg">
            {currentPage} / {totalPages}
          </span>

          <button
            onClick={() => updateQueryParam('page', String(Math.min(totalPages, currentPage + 1)))}
            disabled={currentPage >= totalPages || loading}
            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-gray-200 bg-white text-xs font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            <span>Next</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </div>
  )
}
