import React from 'react'
import { AlertCircle, X } from 'lucide-react'

export default function ErrorBanner({ message, title = 'Error', onDismiss, className = '' }) {
  if (!message) return null

  return (
    <div
      role="alert"
      className={`bg-red-50 border border-red-200 text-red-800 rounded-2xl p-4 flex items-start gap-3 shadow-xs animate-in fade-in duration-200 ${className}`}
    >
      <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
      <div className="flex-1 text-sm">
        {title && <h4 className="font-semibold text-red-900 mb-0.5">{title}</h4>}
        <p className="text-red-700 leading-relaxed">{message}</p>
      </div>
      {onDismiss && (
        <button
          onClick={onDismiss}
          type="button"
          aria-label="Dismiss alert"
          className="text-red-400 hover:text-red-700 p-1 rounded-lg hover:bg-red-100 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  )
}
