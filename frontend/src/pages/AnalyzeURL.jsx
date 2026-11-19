import React, { useState, useEffect } from 'react'
import { Link as LinkIcon, FileText, ExternalLink, Loader2, AlertTriangle, CheckCircle, XCircle } from 'lucide-react'
import AnalysisResult from '../components/AnalysisResult'
import { analyzeAPI } from '../services/api'

export default function AnalyzeURL() {
  const [tab, setTab] = useState('url')
  const [urlInput, setUrlInput] = useState('')
  const [textTitle, setTextTitle] = useState('')
  const [textContent, setTextContent] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [progressStep, setProgressStep] = useState(0)
  const [result, setResult] = useState(null)
  const [error, setError] = useState(null)
  const [warning, setWarning] = useState(null)

  const steps = [
    'Fetching the webpage...',
    'Extracting article text...',
    'Running AI analysis...',
    'Building results...',
  ]

  useEffect(() => {
    let interval
    if (isLoading) {
      setProgressStep(0)
      interval = setInterval(() => {
        setProgressStep((p) => (p < steps.length - 1 ? p + 1 : p))
      }, 1800)
    }
    return () => clearInterval(interval)
  }, [isLoading])

  const handleAnalyzeURL = async (e) => {
    e?.preventDefault()
    if (!urlInput.trim()) return
    try { new URL(urlInput) } catch {
      setError('Please enter a valid URL starting with http:// or https://')
      return
    }
    setIsLoading(true)
    setError(null)
    setWarning(null)
    setResult(null)
    try {
      const res = await analyzeAPI.analyzeURL(urlInput.trim())
      const data = res.data
      if (data.partial || data.is_partial) {
        setWarning('This website restricted full text access. AI analyzed only the available excerpt — results may be less accurate.')
      }
      setResult(data)
    } catch (err) {
      const msg = err?.response?.data?.detail || err.message || 'Failed to analyze this URL.'
      setError(msg + (msg.includes('extract') ? ' Try the "Paste Text" tab instead.' : ''))
    } finally {
      setIsLoading(false)
    }
  }

  const handleAnalyzeText = async (e) => {
    e?.preventDefault()
    if (!textContent.trim()) return
    setIsLoading(true)
    setError(null)
    setWarning(null)
    setResult(null)
    try {
      const res = await analyzeAPI.analyzeText({
        title: textTitle.trim() || 'Manual Text Analysis',
        text: textContent.trim(),
      })
      setResult(res.data)
    } catch (err) {
      setError(err?.response?.data?.detail || err.message || 'Analysis failed.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleClear = () => {
    setUrlInput('')
    setTextTitle('')
    setTextContent('')
    setResult(null)
    setError(null)
    setWarning(null)
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-10">
      {/* Header */}
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Analyze News Article</h1>
        <p className="text-xs sm:text-sm text-gray-500 mt-1">
          Paste a news article URL and let AI analyze its age suitability and generate a summary.
        </p>
      </div>

      {/* Alerts */}
      {error && (
        <div className="flex gap-3 p-4 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
          <XCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-medium">Error</p>
            <p className="text-red-600 mt-0.5">{error}</p>
          </div>
          <button onClick={() => setError(null)} className="ml-auto text-red-400 hover:text-red-600 text-xs self-start">✕</button>
        </div>
      )}
      {warning && (
        <div className="flex gap-3 p-4 bg-amber-50 border border-amber-200 rounded-xl text-sm text-amber-700">
          <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
          <p>{warning}</p>
        </div>
      )}

      {/* Input Card */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        {/* Tabs */}
        <div className="flex border-b border-gray-100">
          <button
            onClick={() => setTab('url')}
            className={`flex items-center gap-2 px-5 py-3 text-sm font-medium border-b-2 transition-colors ${
              tab === 'url'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <LinkIcon className="w-4 h-4" />
            Analyze URL
          </button>
          <button
            onClick={() => setTab('text')}
            className={`flex items-center gap-2 px-5 py-3 text-sm font-medium border-b-2 transition-colors ${
              tab === 'text'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <FileText className="w-4 h-4" />
            Paste Text
          </button>
        </div>

        {/* Form */}
        <div className="p-4 sm:p-6">
          {tab === 'url' ? (
            <form onSubmit={handleAnalyzeURL} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Article URL</label>
                <input
                  type="text"
                  value={urlInput}
                  onChange={(e) => setUrlInput(e.target.value)}
                  placeholder="https://example.com/news/article"
                  disabled={isLoading}
                  className="w-full px-3.5 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 disabled:bg-gray-50 disabled:text-gray-400 transition-colors"
                />
                <p className="text-xs text-gray-400 mt-1.5">Only public, non-paywalled article URLs are supported.</p>
              </div>
              <div className="flex gap-3">
                <button
                  type="submit"
                  disabled={isLoading || !urlInput.trim()}
                  className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white text-sm font-medium px-5 py-2.5 rounded-lg flex items-center gap-2 transition-colors"
                >
                  {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                  {isLoading ? 'Analyzing...' : 'Analyze Article'}
                </button>
                <button
                  type="button"
                  onClick={handleClear}
                  disabled={isLoading}
                  className="text-sm text-gray-500 hover:text-gray-700 px-4 py-2.5 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Clear
                </button>
              </div>
            </form>
          ) : (
            <form onSubmit={handleAnalyzeText} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Article Title (optional)</label>
                <input
                  type="text"
                  value={textTitle}
                  onChange={(e) => setTextTitle(e.target.value)}
                  placeholder="Enter the article headline..."
                  disabled={isLoading}
                  className="w-full px-3.5 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 disabled:bg-gray-50 transition-colors"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Article Text</label>
                <textarea
                  rows={7}
                  value={textContent}
                  onChange={(e) => setTextContent(e.target.value)}
                  placeholder="Paste the article text here..."
                  disabled={isLoading}
                  required
                  className="w-full px-3.5 py-2.5 border border-gray-300 rounded-lg text-sm resize-y focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 disabled:bg-gray-50 transition-colors"
                />
              </div>
              <div className="flex gap-3">
                <button
                  type="submit"
                  disabled={isLoading || !textContent.trim()}
                  className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white text-sm font-medium px-5 py-2.5 rounded-lg flex items-center gap-2 transition-colors"
                >
                  {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                  {isLoading ? 'Analyzing...' : 'Analyze Text'}
                </button>
                <button
                  type="button"
                  onClick={handleClear}
                  disabled={isLoading}
                  className="text-sm text-gray-500 hover:text-gray-700 px-4 py-2.5 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Clear
                </button>
              </div>
            </form>
          )}
        </div>
      </div>

      {/* Loading Progress */}
      {isLoading && (
        <div className="bg-white border border-gray-200 rounded-xl p-6">
          <p className="text-sm font-medium text-gray-700 mb-4 flex items-center gap-2">
            <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
            Analyzing article...
          </p>
          <div className="space-y-2.5">
            {steps.map((step, i) => (
              <div key={i} className={`flex items-center gap-2.5 text-sm ${
                i < progressStep ? 'text-green-600' : i === progressStep ? 'text-blue-600 font-medium' : 'text-gray-300'
              }`}>
                {i < progressStep ? (
                  <CheckCircle className="w-4 h-4 flex-shrink-0" />
                ) : i === progressStep ? (
                  <Loader2 className="w-4 h-4 animate-spin flex-shrink-0" />
                ) : (
                  <div className="w-4 h-4 rounded-full border border-gray-200 flex-shrink-0" />
                )}
                {step}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Result */}
      {result && !isLoading && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">Analysis Result</h2>
            {(result.url || result.article_url) && (
              <a
                href={result.url || result.article_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-blue-600 hover:text-blue-700 flex items-center gap-1"
              >
                Original article <ExternalLink className="w-3 h-3" />
              </a>
            )}
          </div>
          {result.title && (
            <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
              <p className="text-xs text-gray-400 mb-1">Article analyzed</p>
              <h3 className="text-sm font-semibold text-gray-900">{result.title}</h3>
              {result.source_name && <p className="text-xs text-gray-500 mt-1">{result.source_name}</p>}
            </div>
          )}
          <AnalysisResult analysis={result} />
          <button
            onClick={handleClear}
            className="text-sm text-blue-600 hover:text-blue-700 font-medium"
          >
            ← Analyze another article
          </button>
        </div>
      )}
    </div>
  )
}
