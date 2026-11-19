import React from 'react'
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from 'recharts'

const AGE_COLORS = {
  '18+': '#DC2626',
  'Adult': '#DC2626',
  'Below 18': '#16A34A',
  'Safe': '#16A34A',
  'Pending': '#D97706',
}

const DEFAULT_AGE_COLOR = '#64748B'

export function AgePieChart({ data = [] }) {
  // Normalize incoming data: could be array of { name, value } or object { "18+": 5, "Below 18": 10 }
  let chartData = []
  if (Array.isArray(data)) {
    chartData = data.filter((item) => (item.value || item.count || 0) > 0).map((item) => ({
      name: item.name || item.label || 'Unknown',
      value: item.value || item.count || 0,
    }))
  } else if (typeof data === 'object' && data !== null) {
    chartData = Object.entries(data)
      .map(([key, value]) => ({
        name: key,
        value: Number(value) || 0,
      }))
      .filter((d) => d.value > 0)
  }

  if (chartData.length === 0) {
    chartData = [
      { name: '18+', value: 0 },
      { name: 'Below 18', value: 0 },
      { name: 'Pending', value: 0 },
    ]
  }

  const hasValues = chartData.some((d) => d.value > 0)

  return (
    <div className="w-full h-64 flex flex-col items-center justify-center">
      {!hasValues ? (
        <div className="text-center text-xs text-slate-400 py-12">
          No classification data available yet.
        </div>
      ) : (
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Tooltip
              contentStyle={{
                backgroundColor: '#0F172A',
                borderRadius: '12px',
                border: 'none',
                color: '#FFFFFF',
                fontSize: '12px',
                boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
              }}
              itemStyle={{ color: '#F8FAFC' }}
            />
            <Legend
              verticalAlign="bottom"
              height={36}
              iconType="circle"
              wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }}
            />
            <Pie
              data={chartData}
              cx="50%"
              cy="45%"
              innerRadius={50}
              outerRadius={80}
              paddingAngle={4}
              dataKey="value"
            >
              {chartData.map((entry) => {
                const color = AGE_COLORS[entry.name] || DEFAULT_AGE_COLOR
                return <Cell key={`cell-${entry.name}`} fill={color} />
              })}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
      )}
    </div>
  )
}

export function CategoryBarChart({ data = [] }) {
  // Normalize incoming data: could be array of { category, count } or object { "technology": 10 }
  let chartData = []
  if (Array.isArray(data)) {
    chartData = data.map((item) => ({
      name: (item.name || item.category || 'Other').toUpperCase(),
      count: item.count || item.value || 0,
    }))
  } else if (typeof data === 'object' && data !== null) {
    chartData = Object.entries(data).map(([cat, count]) => ({
      name: cat.charAt(0).toUpperCase() + cat.slice(1),
      count: Number(count) || 0,
    }))
  }

  const hasValues = chartData.some((d) => d.count > 0)

  return (
    <div className="w-full h-64 flex flex-col items-center justify-center">
      {!hasValues ? (
        <div className="text-center text-xs text-slate-400 py-12">
          No category distribution data available yet.
        </div>
      ) : (
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
            <XAxis
              dataKey="name"
              tick={{ fontSize: 11, fill: '#64748B' }}
              tickLine={false}
              axisLine={{ stroke: '#CBD5E1' }}
              interval={0}
              angle={-20}
              textAnchor="end"
            />
            <YAxis
              tick={{ fontSize: 11, fill: '#64748B' }}
              tickLine={false}
              axisLine={false}
              allowDecimals={false}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: '#0F172A',
                borderRadius: '12px',
                border: 'none',
                color: '#FFFFFF',
                fontSize: '12px',
              }}
              cursor={{ fill: 'rgba(37, 99, 235, 0.05)' }}
            />
            <Bar
              dataKey="count"
              fill="#2563EB"
              radius={[6, 6, 0, 0]}
              maxBarSize={40}
            />
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  )
}
