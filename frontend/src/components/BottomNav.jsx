import React from 'react'
import { Link, useLocation } from 'react-router-dom'
import {
  LayoutDashboard,
  Newspaper,
  ShieldAlert,
  ShieldCheck,
  Link as LinkIcon,
} from 'lucide-react'

export default function BottomNav() {
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
      activeColor: 'text-red-600',
      activeBg: 'bg-red-50 text-red-600',
    },
    {
      name: 'Below 18',
      to: '/news?age=below18',
      icon: ShieldCheck,
      active: isPath('/news') && (currentAge === 'below18' || currentAge === 'Below 18'),
      activeColor: 'text-green-600',
      activeBg: 'bg-green-50 text-green-700',
    },
    {
      name: 'Analyze',
      to: '/analyze',
      icon: LinkIcon,
      active: isPath('/analyze'),
    },
  ]

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-30 bg-white/95 backdrop-blur-md border-t border-gray-200 py-1.5 px-2 flex items-center justify-around lg:hidden shadow-lg safe-area-pb">
      {navItems.map((item) => {
        const Icon = item.icon
        const isActive = item.active

        return (
          <Link
            key={item.name}
            to={item.to}
            className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-lg text-[10px] font-medium transition-all ${
              isActive
                ? item.activeBg || 'text-blue-600 bg-blue-50/80 font-semibold'
                : 'text-gray-500 hover:text-gray-800'
            }`}
          >
            <Icon
              className={`w-5 h-5 mb-0.5 ${
                isActive ? item.activeColor || 'text-blue-600' : 'text-gray-400'
              }`}
              strokeWidth={isActive ? 2.2 : 1.8}
            />
            <span className="truncate max-w-[58px]">{item.name}</span>
          </Link>
        )
      })}
    </nav>
  )
}
