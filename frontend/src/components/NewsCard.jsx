import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Bookmark, ExternalLink, Newspaper } from 'lucide-react'
import CategoryBadge from './CategoryBadge'

export default function NewsCard({ article = {}, onBookmark, isBookmarked = false }) {
  const navigate = useNavigate()
  const [imgError, setImgError] = useState(false)

  const id = article.id
  const title = article.title || 'Untitled Article'

  // Clean description and remove any NewsAPI [+123 chars] artifacts
  const rawDesc = article.description || article.summary || article.content || ''
  const description = rawDesc.replace(/\[\+\d+\s*chars\]/gi, '').trim()

  const sourceName =
    article.source_name ||
    (typeof article.source === 'object' ? article.source?.name : article.source) ||
    'News Source'
  const imageUrl = article.image_url || article.url_to_image
  const articleUrl = article.article_url || article.url
  const ageCategory = article.age_category || 'Pending'
  const publishedAt = article.published_at || article.created_at

  const formatDate = (d) => {
    if (!d) return ''
    try {
      return new Date(d).toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      })
    } catch {
      return ''
    }
  }

  const handleBookmark = (e) => {
    e.preventDefault()
    e.stopPropagation()
    if (onBookmark && id) onBookmark(id)
  }

  return (
    <div
      className="bg-white border border-gray-200 rounded-xl overflow-hidden hover:shadow-md transition-shadow duration-200 cursor-pointer flex flex-col"
      onClick={() => id && navigate(`/news/${id}`)}
    >
      {/* Image Area */}
      <div className="relative h-44 bg-gray-100 flex-shrink-0">
        {imageUrl && !imgError ? (
          <img
            src={imageUrl}
            alt={title}
            onError={() => setImgError(true)}
            className="w-full h-full object-cover"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gray-50">
            <Newspaper className="w-8 h-8 text-gray-300" />
          </div>
        )}

        {/* Age badge */}
        <div className="absolute top-2 left-2">
          <CategoryBadge category={ageCategory} />
        </div>

        {/* Bookmark */}
        <button
          onClick={handleBookmark}
          className={`absolute top-2 right-2 p-1.5 rounded-lg transition-colors ${
            isBookmarked
              ? 'bg-blue-600 text-white'
              : 'bg-white/90 text-gray-500 hover:text-blue-600 shadow-xs'
          }`}
          title={isBookmarked ? 'Remove bookmark' : 'Save article'}
        >
          <Bookmark className={`w-3.5 h-3.5 ${isBookmarked ? 'fill-current' : ''}`} />
        </button>
      </div>

      {/* Content */}
      <div className="p-4 flex-1 flex flex-col justify-between">
        <div>
          {sourceName && (
            <p className="text-xs font-medium text-blue-600 mb-1.5">{sourceName}</p>
          )}
          <h3 className="text-sm font-semibold text-gray-900 line-clamp-2 leading-snug mb-2">
            {title}
          </h3>
          {description && (
            <p className="text-xs text-gray-500 line-clamp-2 leading-relaxed mb-3">
              {description}
            </p>
          )}
        </div>

        <div className="mt-auto flex items-center justify-between pt-3 border-t border-gray-100">
          <span className="text-xs text-gray-400">{formatDate(publishedAt)}</span>
          <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
            {articleUrl && (
              <a
                href={articleUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-gray-400 hover:text-gray-700 flex items-center gap-1"
                title="Open original article"
              >
                <ExternalLink className="w-3 h-3" />
              </a>
            )}
            <Link
              to={id ? `/news/${id}` : '#'}
              className="text-xs font-medium text-blue-600 hover:text-blue-700"
            >
              View Analysis →
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
