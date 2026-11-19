import React, { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Search, User, Menu, Newspaper } from 'lucide-react'

export default function TopNav({ onMenuClick = () => {} }) {
  const navigate = useNavigate()
  const [search, setSearch] = useState('')

  const handleSearch = (e) => {
    e.preventDefault()
    if (search.trim()) {
      navigate(`/news?search=${encodeURIComponent(search.trim())}`)
    }
  }

  const today = new Date().toLocaleDateString('en-IN', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })

  return (
    <header className="h-14 bg-white border-b border-gray-200 sticky top-0 z-20 px-3 sm:px-6 flex items-center justify-between gap-2 sm:gap-4 shadow-xs">
      {/* Left: Mobile Hamburger & Logo */}
      <div className="flex items-center gap-2 sm:gap-3">
        <button
          onClick={onMenuClick}
          className="p-1.5 -ml-1 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg lg:hidden transition-colors"
          aria-label="Open navigation menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Mobile brand text */}
        <Link to="/" className="flex items-center gap-2 lg:hidden">
          <div className="w-7 h-7 rounded-md bg-blue-600 flex items-center justify-center flex-shrink-0">
            <Newspaper className="w-4 h-4 text-white" />
          </div>
          <span className="font-bold text-gray-900 text-sm hidden xs:inline tracking-tight">NewsSafe AI</span>
        </Link>
      </div>

      {/* Center: Search Bar */}
      <form onSubmit={handleSearch} className="flex-1 max-w-md relative">
        <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search news..."
          className="w-full pl-9 pr-3.5 py-1.5 text-xs sm:text-sm bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-colors"
        />
      </form>

      {/* Right: Date & Profile */}
      <div className="flex items-center gap-2 sm:gap-4 flex-shrink-0">
        <span className="hidden md:block text-xs text-gray-400">{today}</span>
        <div className="w-8 h-8 rounded-full bg-blue-50 border border-blue-100 flex items-center justify-center flex-shrink-0">
          <User className="w-4 h-4 text-blue-600" />
        </div>
      </div>
    </header>
  )
}
