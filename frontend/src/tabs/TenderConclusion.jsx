import React, { useMemo } from 'react'
import { FileText, ShieldAlert, CheckCircle, XCircle, AlertTriangle, Brain, ArrowRight, ChevronRight } from 'lucide-react'
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Cell, RadialBarChart, RadialBar, PieChart, Pie } from 'recharts'
import { useApp } from '../context/AppContext'

function fmt(v) { return `₹${(v / 1e6).toFixed(2)}M` }

function riskTag(label) {
  if (label === 'High') return 'badge-high'
  if (label === 'Medium') return 'badge-medium'
  return 'badge-low'
}

function Gauge({ value, label, color }) {
  const data = [{ value, fill: color }]
  return (
    <div className="flex flex-col items-center">
      <ResponsiveContainer width={160} height={160}>
        <RadialBarChart cx="50%" cy="50%" innerRadius="70%" outerRadius="100%" startAngle={225} endAngle={-45} data={data} barSize={10}>
          <RadialBar background clockWise dataKey="value" cornerRadius={8} />
        </RadialBarChart>
      </ResponsiveContainer>
      <div className="-mt-20 text-center">
        <div className="text-3xl font-bold" style={{ color }}>{value.toFixed(0)}</div>
        <div className="text-[10px] uppercase tracking-wider text-slate-500 mt-0.5">{label}</div>
      </div>
    </div>
  )
}

export default function TenderConclusion() {
  const { tenders, selectedTender, setSelectedTender } = useApp()

  const t = selectedTender || tenders[0]
  if (!t) return null

  const bidData = useMemo(() =>
    t.vendors.map((v, i) => ({
      vendor: v.split(' ').slice(0, 2).join(' '),
      fullName: v,
      bid: t.bid_values[i],
      isWinner: v === t.winning_vendor,
      diff: ((t.bid_values[i] - t.fair_price) / t.fair_price * 100).toFixed(1),
    })).sort((a, b) => a.bid - b.bid),
    [t]
  )

  const riskFactors = useMemo(() => [
    { name: 'Market Concentration (HHI)', score: t.hhi_risk, weight: '30%', color: '#ef4444' },
    { name: 'Network Risk', score: t.network_risk, weight: '25%', color: '#f59e0b' },
    { name: 'Price Risk', score: t.price_risk, weight: '25%', color: '#8b5cf6' },
    { name: 'Winner Dominance', score: t.winner_risk, weight: '20%', color: '#3b82f6' },
  ], [t])

  const recommendation = t.risk_score >= 65 ? 'Reject' : t.risk_score >= 35 ? 'Review' : 'Approve'
  const recCfg = {
    Approve: { icon: CheckCircle, color: '#22c55e', bg: 'bg-emerald-500/10 border-emerald-500/20', desc: 'This tender shows no significant anomalies. Automated approval is recommended.' },
    Review:  { icon: AlertTriangle, color: '#f59e0b', bg: 'bg-amber-500/10 border-amber-500/20', desc: 'Moderate risk signals detected. Manual review by a procurement officer is advised before proceeding.' },
    Reject:  { icon: XCircle, color: '#ef4444', bg: 'bg-red-500/10 border-red-500/20', desc: 'Multiple high-risk indicators flagged. This tender should be escalated for formal investigation.' },
  }[recommendation]

  // AI risk narrative
  const narratives = []
  if (t.hhi_risk > 50) narratives.push(`Market concentration is ${t.hhi_label.toLowerCase()} (HHI: ${t.hhi}), indicating limited competition and potential vendor dominance.`)
  if (t.network_risk > 50) narratives.push(`Network analysis reveals suspicious co-bidding patterns among participating vendors, suggesting possible collusion.`)
  if (t.price_risk > 50) narratives.push(`Winning bid deviates ${Math.abs(t.price_deviation).toFixed(1)}% from the AI-predicted fair price, raising pricing manipulation concerns.`)
  if (t.winner_risk > 50) narratives.push(`The winning vendor shows a disproportionately high success rate, which may indicate preferential treatment or bid rigging.`)
  if (t.director_shared) narratives.push(`⚠ Shared directorship detected between bidding vendors — a strong collusion indicator.`)
  if (!narratives.length) narratives.push(`No significant risk indicators detected. Bid pricing, vendor diversity, and market conditions are within acceptable parameters.`)

  const RecIcon = recCfg.icon

  return (
    <div className="space-y-6 animate-slide-up">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <FileText size={20} className="text-indigo-400" /> Tender Conclusion Panel
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">Detailed AI-powered assessment for {t.tender_id}</p>
        </div>
        {/* Tender selector */}
        <select
          value={t.tender_id}
          onChange={e => setSelectedTender(tenders.find(x => x.tender_id === e.target.value))}
          className="input-base text-xs w-44"
        >
          {tenders.slice(0, 50).map(x => (
            <option key={x.tender_id} value={x.tender_id}>{x.tender_id} — {x.risk_label}</option>
          ))}
        </select>
      </div>

      {/* Tender header card */}
      <div className="glass rounded-2xl p-5">
        <div className="flex flex-wrap items-center gap-x-8 gap-y-3">
          <div><div className="text-[10px] uppercase tracking-wider text-slate-500">Tender ID</div><div className="font-mono text-lg font-bold text-indigo-400">{t.tender_id}</div></div>
          <div><div className="text-[10px] uppercase tracking-wider text-slate-500">Department</div><div className="text-sm font-medium text-slate-200">{t.department}</div></div>
          <div><div className="text-[10px] uppercase tracking-wider text-slate-500">Category</div><div className="text-sm font-medium text-slate-200">{t.category}</div></div>
          <div><div className="text-[10px] uppercase tracking-wider text-slate-500">Winner</div><div className="text-sm font-semibold text-white">{t.winning_vendor}</div></div>
          <div><div className="text-[10px] uppercase tracking-wider text-slate-500">Winning Bid</div><div className="text-sm font-mono font-semibold text-slate-200">{fmt(t.winning_bid)}</div></div>
          <div><div className="text-[10px] uppercase tracking-wider text-slate-500">Status</div><span className={riskTag(t.risk_label)}>{t.risk_label} Risk</span></div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Left column: Gauges + risk breakdown */}
        <div className="space-y-4">
          {/* Gauges */}
          <div className="glass rounded-2xl p-5 flex items-center justify-around">
            <Gauge value={t.fairness_score} label="Fairness" color={t.risk_score >= 65 ? '#ef4444' : t.risk_score >= 35 ? '#f59e0b' : '#22c55e'} />
            <Gauge value={t.risk_score} label="Risk Score" color={t.risk_score >= 65 ? '#ef4444' : t.risk_score >= 35 ? '#f59e0b' : '#22c55e'} />
          </div>

          {/* Risk breakdown */}
          <div className="glass rounded-2xl p-5">
            <h3 className="text-sm font-semibold text-white mb-4">Risk Factor Breakdown</h3>
            <div className="space-y-3">
              {riskFactors.map((f, i) => (
                <div key={i}>
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="text-slate-400">{f.name}</span>
                    <span className="text-slate-300 font-semibold">{f.score.toFixed(0)} <span className="text-slate-600 font-normal">({f.weight})</span></span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-white/5 overflow-hidden">
                    <div className="h-full rounded-full transition-all duration-500" style={{ width: `${f.score}%`, background: f.color }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Middle column: Bid comparison */}
        <div className="glass rounded-2xl p-5">
          <h3 className="text-sm font-semibold text-white mb-4">Bid Comparison</h3>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={bidData} barSize={16}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
              <XAxis dataKey="vendor" tick={{ fontSize: 9, fill: '#94a3b8' }} tickLine={false} axisLine={false} angle={-20} textAnchor="end" height={50} />
              <YAxis tick={{ fontSize: 9, fill: '#64748b' }} tickLine={false} axisLine={false} tickFormatter={v => `${(v/1e6).toFixed(0)}M`} />
              <Tooltip content={({ active, payload }) =>
                active && payload?.length ? (
                  <div className="glass rounded-xl px-3 py-2 border border-white/10 shadow-2xl text-xs">
                    <div className="font-semibold text-white">{payload[0].payload.fullName}</div>
                    <div className="text-slate-400 mt-1">Bid: <span className="text-slate-200 font-mono">{fmt(payload[0].value)}</span></div>
                    <div className="text-slate-400">vs Fair Price: <span className={Number(payload[0].payload.diff) > 0 ? 'text-red-400' : 'text-emerald-400'}>{payload[0].payload.diff}%</span></div>
                    {payload[0].payload.isWinner && <div className="text-indigo-400 font-medium mt-1">★ Winner</div>}
                  </div>
                ) : null
              } />
              <Bar dataKey="bid" radius={[4, 4, 0, 0]}>
                {bidData.map((d, i) => (
                  <Cell key={i} fill={d.isWinner ? '#6366f1' : 'rgba(148,163,184,0.3)'} stroke={d.isWinner ? '#818cf8' : 'transparent'} strokeWidth={d.isWinner ? 2 : 0} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
          <div className="mt-3 overflow-auto">
            <table className="w-full text-xs">
              <thead><tr className="border-b border-white/[0.06]">
                {['Vendor', 'Bid', 'vs Fair'].map(h => <th key={h} className="text-left py-1.5 pr-3 text-[10px] uppercase tracking-wider text-slate-500">{h}</th>)}
              </tr></thead>
              <tbody>{bidData.map((d, i) => (
                <tr key={i} className={`tr-base ${d.isWinner ? 'bg-indigo-500/[0.06]' : ''}`}>
                  <td className="py-1.5 pr-3 text-slate-300 max-w-[100px] truncate">{d.isWinner && <span className="text-indigo-400 mr-1">★</span>}{d.fullName}</td>
                  <td className="py-1.5 pr-3 font-mono text-slate-300">{fmt(d.bid)}</td>
                  <td className="py-1.5"><span className={Number(d.diff) > 0 ? 'text-red-400' : 'text-emerald-400'}>{Number(d.diff) > 0 ? '+' : ''}{d.diff}%</span></td>
                </tr>
              ))}</tbody>
            </table>
          </div>
        </div>

        {/* Right column: AI Insights */}
        <div className="space-y-4">
          {/* Recommendation */}
          <div className={`glass rounded-2xl p-5 border ${recCfg.bg}`}>
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: `${recCfg.color}20`, border: `1px solid ${recCfg.color}40` }}>
                <RecIcon size={20} style={{ color: recCfg.color }} />
              </div>
              <div>
                <div className="text-[10px] uppercase tracking-wider text-slate-500">AI Recommendation</div>
                <div className="text-lg font-bold" style={{ color: recCfg.color }}>{recommendation}</div>
              </div>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">{recCfg.desc}</p>
          </div>

          {/* AI narrative */}
          <div className="glass rounded-2xl p-5">
            <h3 className="text-sm font-semibold text-white flex items-center gap-2 mb-3">
              <Brain size={15} className="text-indigo-400" /> AI Risk Explanation
            </h3>
            <div className="space-y-2.5">
              {narratives.map((n, i) => (
                <div key={i} className="flex items-start gap-2 text-xs text-slate-400 leading-relaxed">
                  <ChevronRight size={12} className="text-indigo-400 shrink-0 mt-0.5" />
                  <span>{n}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Fraud indicators */}
          <div className="glass rounded-2xl p-5">
            <h3 className="text-sm font-semibold text-white mb-3">Fraud Indicators</h3>
            <div className="space-y-2">
              {[
                { label: 'Bid Clustering', active: t.hhi_risk > 40, desc: 'Bids are suspiciously close together' },
                { label: 'Price Inflation', active: t.price_deviation > 10, desc: 'Winning bid exceeds fair price by >10%' },
                { label: 'Vendor Collusion', active: t.is_colluded, desc: 'Co-bidding pattern detected' },
                { label: 'Shared Directors', active: t.director_shared, desc: 'Common board members found' },
                { label: 'Low Competition', active: t.n_vendors < 4, desc: 'Fewer than 4 bidders' },
              ].map((ind, i) => (
                <div key={i} className={`flex items-center justify-between px-3 py-2 rounded-lg text-xs ${ind.active ? 'bg-red-500/10 border border-red-500/15' : 'bg-white/[0.02]'}`}>
                  <div className="flex items-center gap-2">
                    {ind.active ? <AlertTriangle size={12} className="text-red-400" /> : <CheckCircle size={12} className="text-emerald-500" />}
                    <span className={ind.active ? 'text-red-300 font-medium' : 'text-slate-500'}>{ind.label}</span>
                  </div>
                  <span className={ind.active ? 'text-red-400 font-semibold' : 'text-emerald-500 font-medium'}>{ind.active ? 'DETECTED' : 'CLEAR'}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
