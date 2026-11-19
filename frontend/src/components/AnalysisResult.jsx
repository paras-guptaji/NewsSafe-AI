import React from 'react'
import { AlertTriangle, Info, FileText } from 'lucide-react'
import CategoryBadge from './CategoryBadge'

export default function AnalysisResult({ analysis = {} }) {
  if (!analysis || Object.keys(analysis).length === 0) {
    return <div className="bg-white border border-gray-200 rounded-xl p-6 text-center text-gray-400 text-sm">No analysis data available.</div>
  }

  const category = analysis.age_category || analysis.category || 'Pending'
  const reason = analysis.classification_reason || analysis.reason || 'No reasoning provided.'
  const summary = analysis.summary || analysis.ai_summary || 'No summary available.'
  const detailedSummary = analysis.detailed_summary
  const indicators = Array.isArray(analysis.sensitive_indicators) ? analysis.sensitive_indicators : []
  const severity = (analysis.content_severity || 'Low')
  const analyzedAt = analysis.analyzed_at || analysis.analysis_date

  let rawConf = analysis.confidence ?? analysis.confidence_score ?? 0
  if (rawConf > 0 && rawConf <= 1) rawConf = Math.round(rawConf * 100)
  const confidence = Math.round(rawConf)

  const formatDate = (d) => {
    if (!d) return null
    try { return new Date(d).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' }) }
    catch { return d }
  }

  const isAdult = category === '18+' || category.toLowerCase().includes('18+')

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-5 space-y-5">
      {/* Category + confidence */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          <CategoryBadge category={category} size="lg" />
          <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${
            severity === 'High' ? 'bg-red-50 text-red-600 border-red-200' :
            severity === 'Medium' ? 'bg-yellow-50 text-yellow-600 border-yellow-200' :
            'bg-gray-50 text-gray-500 border-gray-200'
          }`}>
            {severity} severity
          </span>
        </div>
        {analyzedAt && <span className="text-xs text-gray-400">{formatDate(analyzedAt)}</span>}
      </div>

      {/* Confidence bar */}
      {confidence > 0 && (
        <div>
          <div className="flex justify-between text-xs text-gray-500 mb-1">
            <span>AI Confidence</span>
            <span className="font-semibold text-gray-700">{confidence}%</span>
          </div>
          <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full ${confidence >= 80 ? 'bg-blue-500' : confidence >= 50 ? 'bg-yellow-400' : 'bg-gray-400'}`}
              style={{ width: `${Math.max(confidence, 5)}%` }}
            />
          </div>
        </div>
      )}

      {/* Reason */}
      <div className="bg-gray-50 rounded-lg p-4">
        <h4 className="text-xs font-semibold text-gray-500 flex items-center gap-1.5 mb-2">
          <Info className="w-3.5 h-3.5" />
          Classification Reason
        </h4>
        <p className="text-sm text-gray-700 leading-relaxed">{reason}</p>
      </div>

      {/* Sensitive indicators (only 18+) */}
      {indicators.length > 0 && (
        <div>
          <h4 className="text-xs font-semibold text-gray-500 flex items-center gap-1.5 mb-2">
            <AlertTriangle className="w-3.5 h-3.5 text-red-400" />
            Sensitive Content Flags
          </h4>
          <div className="flex flex-wrap gap-1.5">
            {indicators.map((tag, i) => (
              <span key={i} className="text-xs px-2.5 py-1 bg-red-50 text-red-700 border border-red-100 rounded-full font-medium">
                {tag}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Summary */}
      <div>
        <h4 className="text-xs font-semibold text-gray-500 flex items-center gap-1.5 mb-2">
          <FileText className="w-3.5 h-3.5" />
          AI Summary
        </h4>
        <p className="text-sm text-gray-700 leading-relaxed">{summary}</p>
      </div>

      {/* Detailed summary */}
      {detailedSummary && (
        <div className="border-t border-gray-100 pt-4">
          <h4 className="text-xs font-semibold text-gray-500 mb-2">Detailed Summary</h4>
          <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-line">{detailedSummary}</p>
        </div>
      )}
    </div>
  )
}
