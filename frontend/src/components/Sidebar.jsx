import React from 'react'
import { Link, useLocation } from 'react-router-dom'
import {
  LayoutDashboard,
  Newspaper,
  ShieldAlert,
  ShieldCheck,
  Link as LinkIcon,
  Bookmark,
  Settings,
} from 'lucide-react'

export default function Sidebar() {
  const location = useLocation()
  const searchParams = new URLSearchParams(location.search)
  const currentAge = searchParams.get('age') || ''

  const isPath = (path) => location.pathname === path

  const navItems = [
    {
      name: 'Dashboard',
      to: '/',
      icon: LayoutDashboard,
      active: isPath('/'),
    },
    {
      name: 'All News',
      to: '/news',
      icon: Newspaper,
      active: isPath('/news') && !currentAge,
    },
    {
      name: '18+ News',
      to: '/news?age=18plus',
      icon: ShieldAlert,
      active: isPath('/news') && (currentAge === '18plus' || currentAge === '18+'),
      badge: '18+',
      badgeCls: 'bg-red-50 text-red-600 border border-red-200',
    },
    {
      name: 'Below 18 News',
      to: '/news?age=below18',
      icon: ShieldCheck,
      active: isPath('/news') && (currentAge === 'below18' || currentAge === 'Below 18'),
      badge: 'Safe',
      badgeCls: 'bg-green-50 text-green-700 border border-green-200',
    },
    {
      name: 'Analyze URL',
      to: '/analyze',
      icon: LinkIcon,
      active: isPath('/analyze'),
    },
    {
      name: 'Saved Articles',
      to: '/bookmarks',
      icon: Bookmark,
      active: isPath('/bookmarks'),
    },
    {
      name: 'Settings',
      to: '/settings',
      icon: Settings,
      active: isPath('/settings'),
    },
  ]

  return (
    <aside className="fixed left-0 top-0 bottom-0 w-[250px] bg-white border-r border-gray-200 z-30 flex flex-col">
      {/* Brand Header */}
      <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-3">
        <div className="w-9 h-9 rounded-lg bg-blue-600 flex items-center justify-center flex-shrink-0">
          <Newspaper className="w-5 h-5 text-white" strokeWidth={2} />
        </div>
        <div>
          <h1 className="font-bold text-gray-900 text-base leading-tight">NewsSafe AI</h1>
          <p className="text-[11px] text-gray-400 leading-tight">News Classification</p>
        </div>
      </div>

      {/* Nav Items */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest px-3 pb-2">
          Navigation
        </p>
        {navItems.map((item) => {
          const Icon = item.icon
          const isActive = item.active

          return (
            <Link
              key={item.name}
              to={item.to}
              className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                isActive
                  ? 'bg-blue-50 text-blue-700 font-medium'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`}
            >
              <Icon
                className={`w-4 h-4 flex-shrink-0 ${
                  isActive ? 'text-blue-600' : 'text-gray-400'
                }`}
                strokeWidth={isActive ? 2.2 : 1.8}
              />
              <span>{item.name}</span>
              {item.badge && (
                <span className={`ml-auto text-[10px] font-semibold px-1.5 py-0.5 rounded ${item.badgeCls}`}>
                  {item.badge}
                </span>
              )}
            </Link>
          )
        })}
      </nav>

      {/* Footer */}
      <div className="px-4 py-4 border-t border-gray-100">
        <p className="text-[11px] text-gray-400 leading-relaxed">
          Powered by NewsAPI
        </p>
        <p className="text-[11px] text-gray-300 mt-0.5">B.Tech Major Project</p>
      </div>
    </aside>
  )
}
