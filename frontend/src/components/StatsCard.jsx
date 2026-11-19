import React from 'react'

export default function StatsCard({
  title,
  value,
  icon: Icon,
  color = 'blue',
  change,
  subtitle,
  onClick,
}) {
  const colorThemes = {
    blue: {
      bar: 'bg-gradient-to-r from-blue-600 to-indigo-600',
      iconBg: 'bg-blue-50 text-blue-600 ring-1 ring-blue-100',
      badge: 'text-blue-700 bg-blue-50',
    },
    red: {
      bar: 'bg-gradient-to-r from-red-500 to-rose-600',
      iconBg: 'bg-red-50 text-red-600 ring-1 ring-red-100',
      badge: 'text-red-700 bg-red-50',
    },
    green: {
      bar: 'bg-gradient-to-r from-emerald-500 to-teal-600',
      iconBg: 'bg-emerald-50 text-emerald-600 ring-1 ring-emerald-100',
      badge: 'text-emerald-700 bg-emerald-50',
    },
    amber: {
      bar: 'bg-gradient-to-r from-amber-500 to-yellow-600',
      iconBg: 'bg-amber-50 text-amber-600 ring-1 ring-amber-100',
      badge: 'text-amber-700 bg-amber-50',
    },
    violet: {
      bar: 'bg-gradient-to-r from-violet-600 to-purple-600',
      iconBg: 'bg-violet-50 text-violet-600 ring-1 ring-violet-100',
      badge: 'text-violet-700 bg-violet-50',
    },
  }

  const theme = colorThemes[color] || colorThemes.blue

  return (
    <div
      onClick={onClick}
      className={`relative bg-white rounded-2xl border border-slate-100 p-5 shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden ${
        onClick ? 'cursor-pointer hover:-translate-y-0.5' : ''
      }`}
    >
      {/* Top accent gradient bar */}
      <div className={`absolute top-0 left-0 right-0 h-1.5 ${theme.bar}`} />

      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">{title}</p>
          <h3 className="text-3xl font-extrabold text-slate-900 tracking-tight">
            {typeof value === 'number' ? value.toLocaleString() : value ?? 0}
          </h3>
        </div>
        {Icon && (
          <div className={`p-3 rounded-xl ${theme.iconBg} flex items-center justify-center transition-transform hover:scale-105`}>
            <Icon className="w-5 h-5" />
          </div>
        )}
      </div>

      {(subtitle || change) && (
        <div className="mt-3 pt-3 border-t border-slate-50 flex items-center justify-between text-xs text-slate-500">
          <span>{subtitle}</span>
          {change && (
            <span className={`font-medium px-2 py-0.5 rounded-full ${theme.badge}`}>
              {change}
            </span>
          )}
        </div>
      )}
    </div>
  )
}
