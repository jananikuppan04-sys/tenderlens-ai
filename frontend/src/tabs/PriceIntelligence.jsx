import React, { useMemo } from 'react'
import { TrendingUp, AlertTriangle, DollarSign, Target } from 'lucide-react'
import {
  ResponsiveContainer, ScatterChart, Scatter, XAxis, YAxis,
  CartesianGrid, Tooltip, Cell, BarChart, Bar, ReferenceLine
} from 'recharts'
import { useApp } from '../context/AppContext'

function fmt(v) { return `₹${(v / 1e6).toFixed(1)}M` }

function CustomTooltip({ active, payload }) {
  if (!active || !payload?.length) return null
  const d = payload[0].payload
  return (
    <div className="glass rounded-xl px-3 py-2 border border-white/10 shadow-2xl text-xs max-w-xs">
      <div className="font-semibold text-white mb-1">{d.tender_id || d.id}</div>
      {d.winning_vendor && <div className="text-slate-400">Winner: <span className="text-slate-200">{d.winning_vendor}</span></div>}
      {d.fair_price && <div className="text-slate-400">Fair Price: <span className="text-emerald-400">{fmt(d.fair_price)}</span></div>}
      {d.winning_bid && <div className="text-slate-400">Actual Bid: <span className="text-slate-200">{fmt(d.winning_bid)}</span></div>}
      {d.price_deviation !== undefined && (
        <div className="text-slate-400">Deviation: <span className={d.price_deviation > 0 ? 'text-red-400 font-semibold' : 'text-emerald-400 font-semibold'}>
          {d.price_deviation > 0 ? '+' : ''}{d.price_deviation}%
        </span></div>
      )}
      {d.overpriced !== undefined && d.overpriced && <div className="text-red-400 font-medium mt-1">⚠ Overpriced</div>}
    </div>
  )
}

export default function PriceIntelligence() {
  const { tenders } = useApp()

  const scatterData = useMemo(() =>
    tenders.map(t => ({
      tender_id: t.tender_id,
      winning_vendor: t.winning_vendor,
      fair_price: t.fair_price / 1e6,
      winning_bid: t.winning_bid / 1e6,
      price_deviation: t.price_deviation,
      overpriced: t.price_deviation > 10,
      risk_score: t.risk_score,
      raw_fair: t.fair_price,
      raw_bid: t.winning_bid,
    })),
    [tenders]
  )

  const outliers = useMemo(() =>
    tenders
      .filter(t => Math.abs(t.price_deviation) > 12)
      .sort((a, b) => Math.abs(b.price_deviation) - Math.abs(a.price_deviation))
      .slice(0, 12),
    [tenders]
  )

  const suspiciousCount = tenders.filter(t => t.price_deviation > 10).length
  const avgDev = (tenders.reduce((s, t) => s + Math.abs(t.price_deviation), 0) / tenders.length).toFixed(1)
  const maxOverprice = Math.max(...tenders.map(t => t.price_deviation)).toFixed(1)

  const deviationBars = useMemo(() =>
    tenders
      .sort((a, b) => Math.abs(b.price_deviation) - Math.abs(a.price_deviation))
      .slice(0, 20)
      .map(t => ({
        id: t.tender_id,
        deviation: t.price_deviation,
        color: t.price_deviation > 10 ? '#ef4444' : t.price_deviation > 0 ? '#f59e0b' : '#22c55e',
      })),
    [tenders]
  )

  return (
    <div className="space-y-6 animate-slide-up">
      <div>
        <h1 className="text-xl font-bold text-white flex items-center gap-2">
          <TrendingUp size={20} className="text-indigo-400" /> Price Intelligence & Anomaly Detection
        </h1>
        <p className="text-sm text-slate-500 mt-0.5">AI-predicted fair prices vs actual bids — outlier detection engine</p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'Outlier Bids', value: outliers.length, icon: AlertTriangle, color: '#ef4444' },
          { label: 'Suspicious Pricing', value: suspiciousCount, icon: Target, color: '#f59e0b' },
          { label: 'Avg Price Deviation', value: `${avgDev}%`, icon: TrendingUp, color: '#8b5cf6' },
          { label: 'Max Overpricing', value: `+${maxOverprice}%`, icon: DollarSign, color: '#ef4444' },
        ].map((kpi, i) => {
          const Icon = kpi.icon
          return (
            <div key={i} className="glass rounded-xl p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">{kpi.label}</div>
                  <div className="text-2xl font-bold mt-1" style={{ color: kpi.color }}>{kpi.value}</div>
                </div>
                <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: `${kpi.color}15`, border: `1px solid ${kpi.color}30` }}>
                  <Icon size={16} style={{ color: kpi.color }} />
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Scatter + Deviation bars */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        {/* Scatter: Fair Price vs Actual */}
        <div className="glass rounded-2xl p-5 col-span-3">
          <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
            <Target size={15} className="text-indigo-400" /> Predicted Fair Price vs Actual Bid
          </h3>
          <ResponsiveContainer width="100%" height={340}>
            <ScatterChart margin={{ top: 10, right: 20, bottom: 30, left: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
              <XAxis type="number" dataKey="fair_price" name="Fair Price (₹M)" unit="M"
                tick={{ fontSize: 10, fill: '#64748b' }} tickLine={false} axisLine={false}
                label={{ value: 'AI Predicted Fair Price (₹M)', position: 'bottom', offset: 15, fontSize: 10, fill: '#64748b' }} />
              <YAxis type="number" dataKey="winning_bid" name="Actual Bid (₹M)" unit="M"
                tick={{ fontSize: 10, fill: '#64748b' }} tickLine={false} axisLine={false}
                label={{ value: 'Actual Winning Bid (₹M)', angle: -90, position: 'left', offset: -5, fontSize: 10, fill: '#64748b' }} />
              <Tooltip content={<CustomTooltip />} />
              <ReferenceLine segment={[{ x: 0, y: 0 }, { x: Math.max(...scatterData.map(d => d.fair_price)), y: Math.max(...scatterData.map(d => d.fair_price)) }]}
                stroke="#6366f1" strokeDasharray="6 4" strokeWidth={1.5} />
              <Scatter data={scatterData} shape="circle">
                {scatterData.map((d, i) => (
                  <Cell key={i} fill={d.overpriced ? '#ef4444' : d.price_deviation > 0 ? '#f59e0b' : '#22c55e'} fillOpacity={0.7} r={5} />
                ))}
              </Scatter>
            </ScatterChart>
          </ResponsiveContainer>
          <div className="flex justify-center gap-6 mt-2 text-[10px] text-slate-500">
            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> Under fair price</span>
            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-amber-500" /> Slightly over</span>
            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-red-500" /> Overpriced (&gt;10%)</span>
            <span className="flex items-center gap-1.5"><span className="w-6 border-t border-dashed border-indigo-500" /> 1:1 Line</span>
          </div>
        </div>

        {/* Deviation bars */}
        <div className="glass rounded-2xl p-5 col-span-2">
          <h3 className="text-sm font-semibold text-white mb-4">Top 20 Price Deviations</h3>
          <ResponsiveContainer width="100%" height={340}>
            <BarChart data={deviationBars} layout="vertical" barSize={6}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" horizontal={false} />
              <XAxis type="number" tick={{ fontSize: 9, fill: '#64748b' }} tickLine={false} axisLine={false} />
              <YAxis type="category" dataKey="id" width={60} tick={{ fontSize: 9, fill: '#94a3b8' }} tickLine={false} axisLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <ReferenceLine x={0} stroke="rgba(255,255,255,0.1)" />
              <Bar dataKey="deviation" name="Deviation %" radius={[0, 4, 4, 0]}>
                {deviationBars.map((d, i) => <Cell key={i} fill={d.color} opacity={0.8} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Outlier table */}
      <div className="glass rounded-2xl p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-white flex items-center gap-2">
            <AlertTriangle size={15} className="text-red-400" /> Suspicious Pricing Detector
          </h3>
          <span className="badge-high flex items-center gap-1"><AlertTriangle size={11} /> {outliers.length} anomalies detected</span>
        </div>
        <div className="overflow-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-white/[0.06]">
                {['Tender ID', 'Category', 'Winner', 'Fair Price', 'Winning Bid', 'Deviation', 'Verdict'].map(h => (
                  <th key={h} className="text-left py-2 pr-4 text-[10px] uppercase tracking-wider font-semibold text-slate-500 whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {outliers.map(t => (
                <tr key={t.tender_id} className="tr-base bg-red-500/[0.03]">
                  <td className="py-2.5 pr-4 font-mono font-semibold text-indigo-400">{t.tender_id}</td>
                  <td className="py-2.5 pr-4 text-slate-400">{t.category}</td>
                  <td className="py-2.5 pr-4 text-slate-200 max-w-[120px] truncate">{t.winning_vendor}</td>
                  <td className="py-2.5 pr-4 text-emerald-400 font-mono">{fmt(t.fair_price)}</td>
                  <td className="py-2.5 pr-4 text-slate-200 font-mono">{fmt(t.winning_bid)}</td>
                  <td className="py-2.5 pr-4">
                    <span className={`font-semibold ${t.price_deviation > 0 ? 'text-red-400' : 'text-emerald-400'}`}>
                      {t.price_deviation > 0 ? '+' : ''}{t.price_deviation}%
                    </span>
                  </td>
                  <td className="py-2.5">
                    {t.price_deviation > 15
                      ? <span className="badge-high">🔴 Severe Overpricing</span>
                      : t.price_deviation > 10
                        ? <span className="badge-medium">🟡 Overpriced</span>
                        : <span className="badge-low">🟢 Underpriced</span>
                    }
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
