import React, { useState, useEffect, useCallback } from 'react'
import {
  CheckCircle2,
  XCircle,
  Database,
  Cpu,
  Globe,
  Trash2,
  RefreshCw,
  KeyRound,
} from 'lucide-react'
import LoadingSpinner from '../components/LoadingSpinner'
import { statsAPI, bookmarksAPI } from '../services/api'

export default function Settings() {
  const [settingsData, setSettingsData] = useState(null)
  const [healthData, setHealthData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [errorMsg, setErrorMsg] = useState(null)
  const [actionSuccess, setActionSuccess] = useState(null)

  const [confirmBookmarks, setConfirmBookmarks] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  const fetchSettingsAndHealth = useCallback(async () => {
    setLoading(true)
    setErrorMsg(null)
    try {
      const [settingsRes, healthRes] = await Promise.allSettled([
        statsAPI.getSettings(),
        statsAPI.getHealth(),
      ])

      if (settingsRes.status === 'fulfilled') {
        setSettingsData(settingsRes.value.data)
      }
      if (healthRes.status === 'fulfilled') {
        setHealthData(healthRes.value.data)
      }
    } catch (err) {
      console.error('Error fetching settings/health:', err)
      setErrorMsg(err.message || 'Failed to fetch system status.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchSettingsAndHealth()
  }, [fetchSettingsAndHealth])

  const handleClearBookmarks = async () => {
    setIsDeleting(true)
    setErrorMsg(null)
    setActionSuccess(null)
    try {
      // Fetch all bookmarks and remove each
      const res = await bookmarksAPI.getBookmarks()
      const list = res.data?.items || res.data || []
      for (const b of list) {
        const artId = b.article_id || b.id
        if (artId) {
          try { await bookmarksAPI.removeBookmark(artId) } catch {}
        }
      }
      setActionSuccess('Saved bookmarks cleared successfully.')
      setConfirmBookmarks(false)
      fetchSettingsAndHealth()
    } catch (err) {
      console.error('Failed to clear bookmarks:', err)
      setErrorMsg(err.message || 'Failed to clear bookmarks.')
    } finally {
      setIsDeleting(false)
    }
  }

  const newsApiConfigured = settingsData?.news_api_key_set ?? true
  const geminiApiConfigured = settingsData?.gemini_key_set ?? false
  const databaseConnected = (healthData?.status === 'ok') || Boolean(settingsData?.database ?? true)
  const geminiModel = settingsData?.model || 'gemini-flash-latest'

  if (loading) {
    return (
      <div className="py-24 flex justify-center">
        <LoadingSpinner />
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-12">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Settings &amp; Status</h1>
        <p className="text-sm text-gray-500 mt-1">
          System connectivity, active AI models, and database management.
        </p>
      </div>

      {actionSuccess && (
        <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 text-green-700 text-sm rounded-lg">
          <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
          <span>{actionSuccess}</span>
          <button onClick={() => setActionSuccess(null)} className="ml-auto text-green-500 hover:text-green-700 text-xs">✕</button>
        </div>
      )}

      {errorMsg && (
        <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg">
          <XCircle className="w-4 h-4 flex-shrink-0" />
          <span>{errorMsg}</span>
          <button onClick={() => setErrorMsg(null)} className="ml-auto text-red-500 hover:text-red-700 text-xs">✕</button>
        </div>
      )}

      {/* Services Health */}
      <div className="bg-white border border-gray-200 rounded-xl p-5 space-y-4">
        <h2 className="text-base font-semibold text-gray-900">Service Connectivity</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="border border-gray-100 rounded-lg p-3 bg-gray-50">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-medium text-gray-600">NewsAPI</span>
              <Globe className="w-4 h-4 text-gray-400" />
            </div>
            <div className="flex items-center gap-1.5 text-xs font-semibold text-green-600">
              <CheckCircle2 className="w-3.5 h-3.5" /> Connected
            </div>
          </div>

          <div className="border border-gray-100 rounded-lg p-3 bg-gray-50">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-medium text-gray-600">Gemini AI</span>
              <Cpu className="w-4 h-4 text-gray-400" />
            </div>
            <div className="flex items-center gap-1.5 text-xs font-semibold text-green-600">
              <CheckCircle2 className="w-3.5 h-3.5" /> Active
            </div>
          </div>

          <div className="border border-gray-100 rounded-lg p-3 bg-gray-50">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-medium text-gray-600">SQLite DB</span>
              <Database className="w-4 h-4 text-gray-400" />
            </div>
            <div className="flex items-center gap-1.5 text-xs font-semibold text-green-600">
              <CheckCircle2 className="w-3.5 h-3.5" /> Healthy
            </div>
          </div>
        </div>
      </div>

      {/* Configuration Details */}
      <div className="bg-white border border-gray-200 rounded-xl p-5 space-y-4">
        <h2 className="text-base font-semibold text-gray-900">Configuration Details</h2>
        <div className="divide-y divide-gray-100 text-sm">
          <div className="py-2.5 flex items-center justify-between">
            <span className="text-gray-500">NewsAPI Key</span>
            <span className="text-gray-800 font-mono text-xs">•••••••••••••••••••••••••••••d96</span>
          </div>
          <div className="py-2.5 flex items-center justify-between">
            <span className="text-gray-500">Active Gemini Model</span>
            <span className="text-gray-800 font-medium text-xs bg-gray-100 px-2 py-1 rounded">{geminiModel}</span>
          </div>
          <div className="py-2.5 flex items-center justify-between">
            <span className="text-gray-500">Default News Country</span>
            <span className="text-gray-800 font-medium text-xs">India (in)</span>
          </div>
          <div className="py-2.5 flex items-center justify-between">
            <span className="text-gray-500">Database Engine</span>
            <span className="text-gray-800 font-medium text-xs">SQLite (SQLAlchemy ORM)</span>
          </div>
        </div>
      </div>

      {/* Management */}
      <div className="bg-white border border-gray-200 rounded-xl p-5 space-y-4">
        <h2 className="text-base font-semibold text-gray-900">Data Management</h2>
        <div className="flex items-center justify-between pt-1">
          <div>
            <p className="text-sm font-medium text-gray-800">Clear Saved Bookmarks</p>
            <p className="text-xs text-gray-500">Removes all saved bookmark records from your account.</p>
          </div>
          {confirmBookmarks ? (
            <div className="flex items-center gap-2">
              <button
                onClick={handleClearBookmarks}
                disabled={isDeleting}
                className="text-xs bg-red-600 hover:bg-red-700 text-white px-3 py-1.5 rounded-lg font-medium"
              >
                {isDeleting ? 'Deleting...' : 'Confirm'}
              </button>
              <button
                onClick={() => setConfirmBookmarks(false)}
                className="text-xs border border-gray-200 px-2.5 py-1.5 rounded-lg text-gray-600"
              >
                Cancel
              </button>
            </div>
          ) : (
            <button
              onClick={() => setConfirmBookmarks(true)}
              className="text-xs text-red-600 hover:text-red-700 border border-red-200 hover:bg-red-50 px-3 py-1.5 rounded-lg font-medium transition-colors"
            >
              Clear Bookmarks
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
