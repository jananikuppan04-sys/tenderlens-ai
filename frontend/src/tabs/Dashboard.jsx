import React, { useMemo } from 'react'
import {
  FileText, AlertTriangle, TrendingUp, Star,
  ShieldAlert, Eye
} from 'lucide-react'
import {
  ResponsiveContainer, PieChart, Pie, Cell, Tooltip,
  LineChart, Line, XAxis, YAxis, CartesianGrid, Legend,
  BarChart, Bar
} from 'recharts'
import { useApp } from '../context/AppContext'
import KPICard from '../components/KPICard'

const RISK_COLORS = { High: '#ef4444', Medium: '#f59e0b', Low: '#22c55e' }
const CHART_THEME = { style: { background: 'transparent', border: 'none', borderRadius: 12, padding: '8px 12px', fontSize: 12 } }

function RiskBadge({ label }) {
  const cls = label === 'High' ? 'badge-high' : label === 'Medium' ? 'badge-medium' : 'badge-low'
  return <span className={cls}>{label}</span>
}

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  return (
    <div className="glass rounded-xl px-3 py-2 border border-white/10 shadow-2xl text-xs">
      <div className="font-semibold text-slate-200 mb-1">{label}</div>
      {payload.map((p, i) => (
        <div key={i} className="flex items-center gap-2 text-slate-400">
          <span className="w-2 h-2 rounded-full" style={{ background: p.color }} />
          {p.name}: <span className="font-semibold text-white">{typeof p.value === 'number' ? p.value.toFixed(1) : p.value}</span>
        </div>
      ))}
    </div>
  )
}

export default function Dashboard() {
  const { tenders, vendorRisks, summaryStats, trendData, deptData, isLoading, setActiveTab, setSelectedTender } = useApp()

  const riskDist = useMemo(() => {
    const counts = { High: 0, Medium: 0, Low: 0 }
    tenders.forEach(t => counts[t.risk_label]++)
    return Object.entries(counts).map(([name, value]) => ({ name, value }))
  }, [tenders])

  const sparkBase = useMemo(() =>
    trendData.slice(-8).map(d => ({ v: d.avg_risk })), [trendData])

  const kpis = [
    {
      label: 'Total Tenders',
      value: summaryStats.total,
      subtitle: 'Active in selected range',
      icon: FileText,
      trend: 4.2,
      trendLabel: '+4.2% this month',
      color: '#6366f1',
      sparkData: trendData.slice(-8).map(d => ({ v: d.total })),
    },
    {
      label: 'High Risk Rate',
      value: `${summaryStats.high_risk_pct}%`,
      subtitle: `${summaryStats.high_risk} tenders flagged`,
      icon: AlertTriangle,
      trend: -2.1,
      trendLabel: '-2.1% vs last month',
      color: '#ef4444',
      sparkData: trendData.slice(-8).map(d => ({ v: d.high })),
    },
    {
      label: 'Avg Price Deviation',
      value: `${summaryStats.avg_deviation}%`,
      subtitle: 'From estimated fair price',
      icon: TrendingUp,
      trend: 1.3,
      trendLabel: '+1.3% increase',
      color: '#f59e0b',
      sparkData: sparkBase,
    },
    {
      label: 'Fairness Index',
      value: summaryStats.fairness_index.toFixed(1),
      subtitle: 'Out of 100',
      icon: Star,
      trend: -0.8,
      trendLabel: '-0.8 points',
      color: '#22c55e',
      sparkData: trendData.slice(-8).map(d => ({ v: d.fairness })),
    },
  ]

  const topRisky = vendorRisks.slice(0, 8)

  return (
    <div className="space-y-6 animate-slide-up">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-white">Executive Intelligence Dashboard</h1>
        <p className="text-sm text-slate-500 mt-0.5">Real-time procurement risk intelligence across {summaryStats.total} tenders</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        {kpis.map((kpi, i) => <KPICard key={i} {...kpi} loading={isLoading} />)}
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Risk distribution pie */}
        <div className="glass rounded-2xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-white flex items-center gap-2">
              <ShieldAlert size={15} className="text-indigo-400" /> Risk Distribution
            </h3>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={riskDist} cx="50%" cy="50%" innerRadius={62} outerRadius={88}
                paddingAngle={3} dataKey="value" label={({ name, percent }) => `${name} ${(percent*100).toFixed(0)}%`}
                labelLine={false} fontSize={11}>
                {riskDist.map((d, i) => <Cell key={i} fill={RISK_COLORS[d.name]} opacity={0.85} />)}
              </Pie>
              <Tooltip contentStyle={CHART_THEME.style} />
            </PieChart>
          </ResponsiveContainer>
          <div className="flex justify-center gap-4 mt-2">
            {riskDist.map(d => (
              <div key={d.name} className="flex items-center gap-1.5 text-xs text-slate-400">
                <span className="w-2.5 h-2.5 rounded-full" style={{ background: RISK_COLORS[d.name] }} />
                {d.name} ({d.value})
              </div>
            ))}
          </div>
        </div>

        {/* Fairness trend */}
        <div className="glass rounded-2xl p-5 col-span-1 lg:col-span-2">
          <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
            <TrendingUp size={15} className="text-indigo-400" /> Risk & Fairness Trend
          </h3>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={trendData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
              <XAxis dataKey="month" tick={{ fontSize: 10, fill: '#64748b' }} tickLine={false} axisLine={false} />
              <YAxis tick={{ fontSize: 10, fill: '#64748b' }} tickLine={false} axisLine={false} domain={[0, 100]} />
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ fontSize: 11, color: '#64748b' }} />
              <Line type="monotone" dataKey="avg_risk" name="Avg Risk" stroke="#ef4444" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="fairness" name="Fairness" stroke="#22c55e" strokeWidth={2} dot={false} />
              {/* Reference lines via custom rendering not needed, add annotations via recharts ReferenceLine */}
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Dept comparison + High risk vendors */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        {/* Dept bar */}
        <div className="glass rounded-2xl p-5 col-span-2">
          <h3 className="text-sm font-semibold text-white mb-4">Department Risk Heatmap</h3>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={deptData.slice(0, 8)} layout="vertical" barSize={8}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" horizontal={false} />
              <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 9, fill: '#64748b' }} tickLine={false} axisLine={false} />
              <YAxis type="category" dataKey="dept" width={100} tick={{ fontSize: 9, fill: '#94a3b8' }} tickLine={false} axisLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="avg_risk" name="Avg Risk" radius={[0, 4, 4, 0]}>
                {deptData.slice(0, 8).map((d, i) => (
                  <Cell key={i} fill={d.avg_risk >= 65 ? '#ef4444' : d.avg_risk >= 35 ? '#f59e0b' : '#22c55e'} opacity={0.8} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* High risk vendors table */}
        <div className="glass rounded-2xl p-5 col-span-3">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-white flex items-center gap-2">
              <AlertTriangle size={15} className="text-red-400" /> High Risk Vendors
            </h3>
            <span className="text-[10px] text-slate-500">{topRisky.length} vendors</span>
          </div>
          <div className="overflow-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-white/[0.06]">
                  {['Vendor', 'Avg Risk', 'Win Rate', 'Tenders', 'Flag'].map(h => (
                    <th key={h} className="text-left py-2 pr-4 text-[10px] uppercase tracking-wider font-semibold text-slate-500 whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {topRisky.map((v, i) => (
                  <tr key={i} className={`tr-base ${v.risk_label === 'High' ? 'bg-red-500/[0.04]' : ''}`}>
                    <td className="py-2.5 pr-4 font-medium text-slate-200 whitespace-nowrap max-w-[140px] truncate">{v.company_name}</td>
                    <td className="py-2.5 pr-4">
                      <div className="flex items-center gap-2">
                        <div className="w-16 h-1.5 rounded-full bg-white/10 overflow-hidden">
                          <div className="h-full rounded-full" style={{ width: `${v.avg_risk_score}%`, background: v.avg_risk_score >= 65 ? '#ef4444' : '#f59e0b' }} />
                        </div>
                        <span className={v.avg_risk_score >= 65 ? 'text-red-400 font-semibold' : 'text-amber-400 font-semibold'}>{v.avg_risk_score}</span>
                      </div>
                    </td>
                    <td className="py-2.5 pr-4 text-slate-400">{v.win_rate}%</td>
                    <td className="py-2.5 pr-4 text-slate-400">{v.tenders_won}</td>
                    <td className="py-2.5">
                      {v.suspicion_flag
                        ? <span className="badge-high">⚠ Flagged</span>
                        : <span className="badge-low">✓ Clear</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Recent tenders table */}
      <div className="glass rounded-2xl p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-white">Recent Tenders</h3>
          <span className="text-[10px] text-slate-500">Showing {Math.min(10, tenders.length)} of {tenders.length}</span>
        </div>
        <div className="overflow-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-white/[0.06]">
                {['Tender ID', 'Department', 'Category', 'Winner', 'Bid (₹)', 'Price Dev', 'Risk Score', 'Status', ''].map(h => (
                  <th key={h} className="text-left py-2 pr-4 text-[10px] uppercase tracking-wider font-semibold text-slate-500 whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {tenders.slice(0, 10).map(t => (
                <tr key={t.tender_id} className={`tr-base ${t.risk_label === 'High' ? 'bg-red-500/[0.03]' : ''}`}>
                  <td className="py-2.5 pr-4 font-mono font-semibold text-indigo-400">{t.tender_id}</td>
                  <td className="py-2.5 pr-4 text-slate-400 max-w-[130px] truncate">{t.department}</td>
                  <td className="py-2.5 pr-4 text-slate-400">{t.category}</td>
                  <td className="py-2.5 pr-4 text-slate-200 max-w-[120px] truncate">{t.winning_vendor}</td>
                  <td className="py-2.5 pr-4 text-slate-300 font-mono">₹{(t.winning_bid / 1e6).toFixed(2)}M</td>
                  <td className="py-2.5 pr-4">
                    <span className={t.price_deviation > 0 ? 'text-red-400' : 'text-emerald-400'}>
                      {t.price_deviation > 0 ? '+' : ''}{t.price_deviation}%
                    </span>
                  </td>
                  <td className="py-2.5 pr-4">
                    <div className="flex items-center gap-2">
                      <div className="w-12 h-1.5 rounded-full bg-white/10 overflow-hidden">
                        <div className="h-full rounded-full" style={{ width: `${t.risk_score}%`, background: t.risk_score >= 65 ? '#ef4444' : t.risk_score >= 35 ? '#f59e0b' : '#22c55e' }} />
                      </div>
                      <span className="font-semibold text-slate-300">{t.risk_score.toFixed(0)}</span>
                    </div>
                  </td>
                  <td className="py-2.5 pr-4"><RiskBadge label={t.risk_label} /></td>
                  <td className="py-2.5">
                    <button onClick={() => { setSelectedTender(t); setActiveTab('conclusion') }}
                      className="text-slate-500 hover:text-indigo-400 transition-colors" title="View details">
                      <Eye size={14} />
                    </button>
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
