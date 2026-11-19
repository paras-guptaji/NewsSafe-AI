import React, { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  ArrowLeft,
  Bookmark,
  ExternalLink,
  RefreshCw,
  Building2,
  Calendar,
  FileText,
  Clock,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react'
import AnalysisResult from '../components/AnalysisResult'
import LoadingSpinner from '../components/LoadingSpinner'
import CategoryBadge from '../components/CategoryBadge'
import { newsAPI, bookmarksAPI } from '../services/api'

export default function NewsDetail() {
  const { id } = useParams()
  const navigate = useNavigate()

  const [article, setArticle] = useState(null)
  const [loading, setLoading] = useState(true)
  const [errorMsg, setErrorMsg] = useState(null)
  const [isBookmarked, setIsBookmarked] = useState(false)

  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [isSummarizing, setIsSummarizing] = useState(false)
  const [actionSuccess, setActionSuccess] = useState(null)
  const [imgError, setImgError] = useState(false)

  const fetchArticle = useCallback(async () => {
    setLoading(true)
    setErrorMsg(null)
    try {
      const res = await newsAPI.getNewsById(id)
      const data = res.data
      setArticle(data)
      setIsBookmarked(Boolean(data.is_bookmarked))
    } catch (err) {
      console.error('Failed to load article detail:', err)
      setErrorMsg(err.message || 'Article could not be loaded.')
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => {
    if (id) {
      fetchArticle()
    }
  }, [id, fetchArticle])

  const handleToggleBookmark = async () => {
    const nextState = !isBookmarked
    setIsBookmarked(nextState)
    try {
      if (nextState) {
        await bookmarksAPI.addBookmark(id)
      } else {
        await bookmarksAPI.removeBookmark(id)
      }
    } catch {
      setIsBookmarked(!nextState)
      setErrorMsg('Failed to update bookmark status')
    }
  }

  const handleRunAnalysis = async () => {
    setIsAnalyzing(true)
    setErrorMsg(null)
    setActionSuccess(null)
    try {
      const res = await newsAPI.analyzeArticle(id)
      const updated = res.data || {}
      setArticle((prev) => ({
        ...prev,
        ...updated,
        analysis_status: 'analyzed',
      }))
      setActionSuccess('Article re-analyzed successfully.')
    } catch (err) {
      console.error('Analysis failed:', err)
      setErrorMsg(err.message || 'Analysis failed. Please check backend AI configuration.')
    } finally {
      setIsAnalyzing(false)
    }
  }

  const handleGenerateDetailedSummary = async () => {
    setIsSummarizing(true)
    setErrorMsg(null)
    setActionSuccess(null)
    try {
      const res = await newsAPI.getDetailedSummary(id)
      const detailed = res.data?.detailed_summary || res.data?.summary || res.data
      setArticle((prev) => ({
        ...prev,
        detailed_summary: typeof detailed === 'string' ? detailed : JSON.stringify(detailed),
      }))
      setActionSuccess('Detailed summary generated successfully.')
    } catch (err) {
      console.error('Detailed summary generation failed:', err)
      setErrorMsg(err.message || 'Failed to generate detailed summary.')
    } finally {
      setIsSummarizing(false)
    }
  }

  if (loading) {
    return (
      <div className="py-24 flex justify-center">
        <LoadingSpinner />
      </div>
    )
  }

  if (errorMsg && !article) {
    return (
      <div className="space-y-4 max-w-xl mx-auto py-12 text-center">
        <p className="text-sm text-red-600">{errorMsg}</p>
        <button
          onClick={() => navigate('/news')}
          className="inline-flex items-center gap-1.5 text-sm font-medium text-blue-600 hover:text-blue-700"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Return to News</span>
        </button>
      </div>
    )
  }

  const title = article?.title || 'Article Title'
  const sourceName = article?.source_name || (typeof article?.source === 'object' ? article?.source?.name : article?.source) || 'News Source'
  const imageUrl = article?.image_url || article?.url_to_image
  const articleUrl = article?.article_url || article?.url
  const category = article?.age_category || 'Pending'
  const publishedAt = article?.published_at || article?.created_at
  const analysisStatus = article?.analysis_status || (article?.classification_reason ? 'analyzed' : 'pending')

  const formatDate = (dateStr) => {
    if (!dateStr) return ''
    try {
      return new Date(dateStr).toLocaleDateString('en-IN', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      })
    } catch {
      return dateStr
    }
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-12">
      {/* Top Bar */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-1.5 text-xs font-medium text-gray-600 hover:text-gray-900 bg-white border border-gray-200 px-3 py-1.5 rounded-lg hover:bg-gray-50 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back</span>
        </button>

        <div className="flex items-center gap-2">
          <button
            onClick={handleToggleBookmark}
            type="button"
            className={`inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg border transition-colors ${
              isBookmarked
                ? 'bg-blue-600 text-white border-blue-600'
                : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
            }`}
          >
            <Bookmark className={`w-3.5 h-3.5 ${isBookmarked ? 'fill-current' : ''}`} />
            <span>{isBookmarked ? 'Saved' : 'Save'}</span>
          </button>

          {articleUrl && (
            <a
              href={articleUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-xs font-medium bg-white text-gray-700 border border-gray-200 hover:bg-gray-50 px-2.5 sm:px-3 py-1.5 rounded-lg transition-colors"
            >
              <span className="hidden xs:inline">Original Article</span>
              <span className="xs:hidden">Source</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          )}
        </div>
      </div>

      {actionSuccess && (
        <div className="p-3 bg-green-50 border border-green-200 text-green-700 text-xs font-medium rounded-lg flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-green-600 flex-shrink-0" />
          <span>{actionSuccess}</span>
        </div>
      )}

      {errorMsg && (
        <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs font-medium rounded-lg flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Article Header & Body */}
      <div className="bg-white border border-gray-200 rounded-xl p-4 sm:p-6 space-y-4 shadow-2xs">
        <div className="flex flex-wrap items-center gap-2 sm:gap-2.5">
          <CategoryBadge category={category} size="lg" />
          {sourceName && (
            <span className="inline-flex items-center gap-1 text-xs text-gray-600 bg-gray-100 px-2.5 py-0.5 rounded-md font-medium">
              <Building2 className="w-3 h-3 text-gray-500" />
              {sourceName}
            </span>
          )}
          {publishedAt && (
            <span className="inline-flex items-center gap-1 text-xs text-gray-400">
              <Calendar className="w-3 h-3" />
              {formatDate(publishedAt)}
            </span>
          )}
        </div>

        <h1 className="text-lg sm:text-2xl font-bold text-gray-900 leading-snug">
          {title}
        </h1>

        {imageUrl && !imgError && (
          <div className="w-full h-48 sm:h-72 rounded-lg overflow-hidden bg-gray-100">
            <img
              src={imageUrl}
              alt={title}
              onError={() => setImgError(true)}
              className="w-full h-full object-cover"
            />
          </div>
        )}

        {article?.description && (
          <p className="text-sm text-gray-700 font-medium leading-relaxed bg-gray-50 p-3.5 rounded-lg border-l-2 border-blue-600">
            {article.description.replace(/\[\+\d+\s*chars\]/gi, '').trim()}
          </p>
        )}

        {article?.content ? (
          <div className="text-sm text-gray-700 leading-relaxed space-y-3 pt-2">
            <p className="whitespace-pre-line">{article.content.replace(/\[\+\d+\s*chars\]/gi, '').trim()}</p>
          </div>
        ) : article?.summary ? (
          <div className="text-sm text-gray-700 leading-relaxed space-y-3 pt-2">
            <p className="whitespace-pre-line">{article.summary}</p>
          </div>
        ) : null}
      </div>

      {/* AI Analysis Section */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 className="text-base font-semibold text-gray-900">Content Moderation &amp; Summary</h2>
            <p className="text-xs text-gray-500">
              AI age classification, safety justification, and concise summary.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleRunAnalysis}
              disabled={isAnalyzing}
              className="inline-flex items-center gap-1 text-xs font-medium bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-3 h-3 ${isAnalyzing ? 'animate-spin' : ''}`} />
              <span>{isAnalyzing ? 'Analyzing...' : 'Re-analyze'}</span>
            </button>

            <button
              onClick={handleGenerateDetailedSummary}
              disabled={isSummarizing}
              className="inline-flex items-center gap-1 text-xs font-medium border border-gray-200 bg-white text-gray-700 hover:bg-gray-50 px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50"
            >
              <FileText className={`w-3 h-3 ${isSummarizing ? 'animate-spin' : ''}`} />
              <span>{isSummarizing ? 'Generating...' : 'Detailed Summary'}</span>
            </button>
          </div>
        </div>

        {analysisStatus === 'pending' && !article?.classification_reason && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 text-center space-y-2">
            <Clock className="w-5 h-5 text-yellow-600 mx-auto" />
            <p className="text-xs text-yellow-800 font-medium">This article is waiting for analysis.</p>
            <button
              onClick={handleRunAnalysis}
              disabled={isAnalyzing}
              className="text-xs bg-yellow-600 hover:bg-yellow-700 text-white font-medium px-3 py-1.5 rounded-lg"
            >
              {isAnalyzing ? 'Analyzing...' : 'Analyze Now'}
            </button>
          </div>
        )}

        <AnalysisResult analysis={article} />
      </div>
    </div>
  )
}
