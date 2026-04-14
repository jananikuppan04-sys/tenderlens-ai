import React from 'react'
import { TrendingUp, TrendingDown, Minus } from 'lucide-react'
import { LineChart, Line, ResponsiveContainer } from 'recharts'

function Sparkline({ data, color }) {
  return (
    <ResponsiveContainer width="100%" height={36}>
      <LineChart data={data}>
        <Line type="monotone" dataKey="v" stroke={color} strokeWidth={1.5} dot={false} />
      </LineChart>
    </ResponsiveContainer>
  )
}

export default function KPICard({ label, value, subtitle, icon: Icon, trend, trendLabel, color = '#6366f1', sparkData, loading }) {
  const trendUp  = trend > 0
  const trendNeu = trend === 0

  if (loading) {
    return (
      <div className="glass rounded-2xl p-5 space-y-3 animate-pulse">
        <div className="skeleton h-4 w-24" /><div className="skeleton h-8 w-32 mt-2" /><div className="skeleton h-4 w-20" />
      </div>
    )
  }

  return (
    <div className="glass rounded-2xl p-5 hover:border-white/15 transition-all duration-300 group">
      <div className="flex items-start justify-between mb-3">
        <div>
          <div className="text-[11px] font-semibold uppercase tracking-widest text-slate-500 mb-1">{label}</div>
          <div className="text-2xl font-bold text-white leading-none">{value}</div>
          {subtitle && <div className="text-xs text-slate-500 mt-1">{subtitle}</div>}
        </div>
        <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: `${color}20`, border: `1px solid ${color}40` }}>
          <Icon size={18} style={{ color }} />
        </div>
      </div>

      {sparkData && (
        <div className="mb-2 -mx-1">
          <Sparkline data={sparkData} color={color} />
        </div>
      )}

      <div className="flex items-center gap-1.5">
        {trendNeu
          ? <Minus size={13} className="text-slate-500" />
          : trendUp
            ? <TrendingUp size={13} className="text-emerald-400" />
            : <TrendingDown size={13} className="text-red-400" />
        }
        <span className={`text-xs font-medium ${trendNeu ? 'text-slate-500' : trendUp ? 'text-emerald-400' : 'text-red-400'}`}>
          {trendLabel}
        </span>
      </div>
    </div>
  )
}
