import React from 'react'
import { ShieldAlert, ShieldCheck, Clock } from 'lucide-react'

export default function CategoryBadge({ category, size = 'md' }) {
  const val = String(category || '').trim()

  let label = 'Pending'
  let cls = 'bg-yellow-50 text-yellow-700 border-yellow-200'
  let Icon = Clock

  if (val === '18+' || val.toLowerCase().includes('18+') || val.toLowerCase().includes('adult')) {
    label = '18+'
    cls = 'bg-red-50 text-red-700 border-red-200'
    Icon = ShieldAlert
  } else if (val === 'Below 18' || val.toLowerCase().includes('below') || val.toLowerCase().includes('safe')) {
    label = 'Below 18'
    cls = 'bg-green-50 text-green-700 border-green-200'
    Icon = ShieldCheck
  }

  const sizeCls = size === 'lg'
    ? 'px-3 py-1 text-sm gap-1.5'
    : 'px-2 py-0.5 text-xs gap-1'

  return (
    <span className={`inline-flex items-center font-medium rounded-full border ${cls} ${sizeCls}`}>
      <Icon className="w-3 h-3" strokeWidth={2} />
      {label}
    </span>
  )
}
