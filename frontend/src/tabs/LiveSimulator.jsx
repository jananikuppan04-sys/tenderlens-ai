import React, { useState, useMemo, useCallback } from 'react'
import { Zap, Plus, Trash2, AlertTriangle, CheckCircle, SlidersHorizontal, Play, RotateCcw, Target, TrendingUp, Users, DollarSign } from 'lucide-react'
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Cell } from 'recharts'

const DEFAULT_VENDORS = [
  { id: 1, name: 'Alpha Corp',   bid: 2500000 },
  { id: 2, name: 'Beta Systems', bid: 2800000 },
  { id: 3, name: 'Gamma Ltd',    bid: 2650000 },
]

function fmt(v) { return `₹${(v / 1e6).toFixed(2)}M` }

export default function LiveSimulator() {
  const [vendors, setVendors]       = useState(DEFAULT_VENDORS)
  const [marketCond, setMarketCond] = useState(50)
  const [nextId, setNextId]         = useState(4)
  const [running, setRunning]       = useState(false)
  const [animStep, setAnimStep]     = useState(0)

  const addVendor = useCallback(() => {
    setVendors(v => [...v, { id: nextId, name: `Vendor ${nextId}`, bid: Math.round(2000000 + Math.random() * 3000000) }])
    setNextId(n => n + 1)
  }, [nextId])

  const removeVendor = useCallback(id => {
    setVendors(v => v.filter(x => x.id !== id))
  }, [])

  const updateVendor = useCallback((id, field, value) => {
    setVendors(v => v.map(x => x.id === id ? { ...x, [field]: field === 'bid' ? Number(value) || 0 : value } : x))
  }, [])

  const reset = useCallback(() => {
    setVendors(DEFAULT_VENDORS)
    setMarketCond(50)
    setNextId(4)
    setRunning(false)
    setAnimStep(0)
  }, [])

  // ── Simulation core ─────────────────────────────────────────
  const results = useMemo(() => {
    if (vendors.length < 2) return null

    const bids          = vendors.map(v => v.bid).filter(b => b > 0)
    if (!bids.length) return null
    const minBid        = Math.min(...bids)
    const maxBid        = Math.max(...bids)
    const avgBid        = bids.reduce((s, b) => s + b, 0) / bids.length
    const bidSpread     = maxBid > 0 ? ((maxBid - minBid) / maxBid * 100) : 0

    // Fair price estimation
    const marketFactor  = 0.8 + (marketCond / 100) * 0.4
    const fairPrice     = avgBid * marketFactor * 0.92

    // Predicted winner
    const predicted     = vendors.reduce((best, v) => v.bid > 0 && v.bid < (best?.bid || Infinity) ? v : best, null)

    // Risk factors
    const spreadRisk    = bidSpread < 5 ? 80 : bidSpread < 10 ? 50 : bidSpread < 20 ? 25 : 10
    const countRisk     = vendors.length < 3 ? 70 : vendors.length < 5 ? 35 : 10
    const deviationRisk = predicted ? Math.min(100, Math.abs((predicted.bid - fairPrice) / fairPrice) * 200) : 0
    const marketRisk    = marketCond < 20 ? 60 : marketCond < 40 ? 35 : marketCond > 80 ? 30 : 10
    const riskScore     = +(spreadRisk * 0.3 + countRisk * 0.2 + deviationRisk * 0.3 + marketRisk * 0.2).toFixed(1)
    const riskLabel     = riskScore >= 65 ? 'High' : riskScore >= 35 ? 'Medium' : 'Low'

    return {
      predicted,
      fairPrice,
      riskScore,
      riskLabel,
      avgBid,
      bidSpread: +bidSpread.toFixed(1),
      factors: [
        { name: 'Bid Spread Risk', score: spreadRisk, color: '#ef4444' },
        { name: 'Competition Risk', score: countRisk, color: '#f59e0b' },
        { name: 'Price Deviation', score: deviationRisk.toFixed(0), color: '#8b5cf6' },
        { name: 'Market Conditions', score: marketRisk, color: '#3b82f6' },
      ],
    }
  }, [vendors, marketCond])

  const chartData = useMemo(() =>
    vendors.filter(v => v.bid > 0).map(v => ({
      name: v.name,
      bid: v.bid,
      isWinner: results?.predicted?.id === v.id,
    })).sort((a, b) => a.bid - b.bid),
    [vendors, results]
  )

  // Simulate animation
  const runSimulation = useCallback(() => {
    setRunning(true)
    setAnimStep(0)
    const steps = vendors.length
    let step = 0
    const interval = setInterval(() => {
      step++
      setAnimStep(step)
      if (step >= steps) {
        clearInterval(interval)
        setTimeout(() => setRunning(false), 500)
      }
    }, 600)
  }, [vendors])

  const riskColor = results?.riskScore >= 65 ? '#ef4444' : results?.riskScore >= 35 ? '#f59e0b' : '#22c55e'

  return (
    <div className="space-y-6 animate-slide-up">
      <div>
        <h1 className="text-xl font-bold text-white flex items-center gap-2">
          <Zap size={20} className="text-amber-400" /> Live Procurement Simulator
        </h1>
        <p className="text-sm text-slate-500 mt-0.5">Test bid scenarios in real-time — instant AI risk assessment</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        {/* ── Input panel ─────────────────────────── */}
        <div className="col-span-2 space-y-4">
          {/* Vendors */}
          <div className="glass rounded-2xl p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                <Users size={15} className="text-indigo-400" /> Bidding Vendors
              </h3>
              <button onClick={addVendor} className="btn-secondary text-xs flex items-center gap-1.5 py-1.5 px-3">
                <Plus size={13} /> Add Vendor
              </button>
            </div>
            <div className="space-y-2.5">
              {vendors.map((v, i) => (
                <div key={v.id} className={`flex items-center gap-2 p-2.5 rounded-xl bg-white/[0.02] border border-white/[0.06] transition-all ${running && i < animStep ? 'border-indigo-500/30 bg-indigo-500/5' : ''}`}>
                  <span className="text-[10px] text-slate-600 w-5 text-center font-mono">{i + 1}</span>
                  <input
                    type="text"
                    value={v.name}
                    onChange={e => updateVendor(v.id, 'name', e.target.value)}
                    className="input-base flex-1 text-xs py-1.5"
                    placeholder="Vendor name"
                  />
                  <div className="relative flex-1">
                    <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-500 text-xs">₹</span>
                    <input
                      type="number"
                      value={v.bid}
                      onChange={e => updateVendor(v.id, 'bid', e.target.value)}
                      className="input-base w-full text-xs py-1.5 pl-6 font-mono"
                      placeholder="Bid amount"
                    />
                  </div>
                  {vendors.length > 2 && (
                    <button onClick={() => removeVendor(v.id)} className="p-1.5 rounded-lg text-slate-600 hover:text-red-400 hover:bg-red-500/10 transition-all">
                      <Trash2 size={13} />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Market slider */}
          <div className="glass rounded-2xl p-5">
            <h3 className="text-sm font-semibold text-white flex items-center gap-2 mb-3">
              <SlidersHorizontal size={15} className="text-indigo-400" /> Market Conditions
            </h3>
            <div className="space-y-2">
              <input
                type="range" min="0" max="100" value={marketCond}
                onChange={e => setMarketCond(Number(e.target.value))}
                className="w-full accent-indigo-500 h-1.5"
              />
              <div className="flex justify-between text-[10px] text-slate-500">
                <span>Unfavorable (0)</span>
                <span className="font-semibold text-indigo-400">{marketCond}%</span>
                <span>Favorable (100)</span>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <button onClick={runSimulation} disabled={running || vendors.length < 2}
              className="btn-primary flex-1 flex items-center justify-center gap-2 disabled:opacity-50">
              <Play size={14} /> {running ? 'Simulating…' : 'Run Simulation'}
            </button>
            <button onClick={reset} className="btn-secondary flex items-center justify-center gap-2 px-4">
              <RotateCcw size={14} /> Reset
            </button>
          </div>
        </div>

        {/* ── Output panel ────────────────────────── */}
        <div className="col-span-3 space-y-4">
          {results ? (
            <>
              {/* Hero KPIs */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {[
                  { label: 'Predicted Winner', value: results.predicted?.name || '—', icon: Target, color: '#6366f1' },
                  { label: 'Risk Score', value: results.riskScore.toFixed(0), icon: AlertTriangle, color: riskColor },
                  { label: 'Fair Price Est.', value: fmt(results.fairPrice), icon: DollarSign, color: '#22c55e' },
                  { label: 'Bid Spread', value: `${results.bidSpread}%`, icon: TrendingUp, color: '#8b5cf6' },
                ].map((kpi, i) => {
                  const Icon = kpi.icon
                  return (
                    <div key={i} className="glass rounded-xl p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <Icon size={14} style={{ color: kpi.color }} />
                        <span className="text-[10px] uppercase tracking-wider text-slate-500">{kpi.label}</span>
                      </div>
                      <div className="text-lg font-bold text-white truncate" style={kpi.label === 'Risk Score' ? { color: kpi.color } : {}}>{kpi.value}</div>
                    </div>
                  )
                })}
              </div>

              {/* Risk gauge */}
              <div className="glass rounded-2xl p-5">
                <h3 className="text-sm font-semibold text-white mb-3">Composite Risk Assessment</h3>
                <div className="space-y-3">
                  {/* Big bar */}
                  <div className="relative w-full h-6 rounded-full bg-white/5 overflow-hidden">
                    <div className="h-full rounded-full transition-all duration-700 flex items-center justify-end px-3"
                      style={{ width: `${Math.max(8, results.riskScore)}%`, background: `linear-gradient(90deg, ${riskColor}60, ${riskColor})` }}>
                      <span className="text-[10px] font-bold text-white">{results.riskScore.toFixed(0)}</span>
                    </div>
                  </div>
                  <div className="flex justify-between text-[10px]">
                    <span className="text-emerald-500">Low Risk (0–35)</span>
                    <span className="text-amber-500">Medium (35–65)</span>
                    <span className="text-red-500">High (65–100)</span>
                  </div>

                  {/* Factor bars */}
                  <div className="grid grid-cols-2 gap-3 mt-4">
                    {results.factors.map((f, i) => (
                      <div key={i} className="glass-light rounded-xl px-4 py-3">
                        <div className="flex items-center justify-between text-xs mb-1.5">
                          <span className="text-slate-400">{f.name}</span>
                          <span className="font-bold" style={{ color: f.color }}>{f.score}</span>
                        </div>
                        <div className="w-full h-1.5 rounded-full bg-white/5">
                          <div className="h-full rounded-full transition-all duration-500" style={{ width: `${f.score}%`, background: f.color }} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Bid comparison chart */}
              <div className="glass rounded-2xl p-5">
                <h3 className="text-sm font-semibold text-white mb-4">Bid Comparison</h3>
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={chartData} barSize={24}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                    <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#94a3b8' }} tickLine={false} axisLine={false} />
                    <YAxis tick={{ fontSize: 9, fill: '#64748b' }} tickLine={false} axisLine={false} tickFormatter={v => `${(v/1e6).toFixed(1)}M`} />
                    <Tooltip content={({ active, payload }) =>
                      active && payload?.length ? (
                        <div className="glass rounded-xl px-3 py-2 border border-white/10 shadow-2xl text-xs">
                          <div className="font-semibold text-white">{payload[0].payload.name}</div>
                          <div className="text-slate-400 mt-1">Bid: <span className="text-slate-200 font-mono">{fmt(payload[0].value)}</span></div>
                          {payload[0].payload.isWinner && <div className="text-indigo-400 font-medium mt-1">★ Predicted Winner</div>}
                        </div>
                      ) : null
                    } />
                    <Bar dataKey="bid" radius={[6, 6, 0, 0]}>
                      {chartData.map((d, i) => (
                        <Cell key={i} fill={d.isWinner ? '#6366f1' : 'rgba(148,163,184,0.25)'} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
                {results?.fairPrice && (
                  <div className="flex items-center justify-center gap-2 mt-3 text-xs text-slate-500">
                    <span className="w-3 border-t border-dashed border-emerald-500" />
                    AI Fair Price Estimate: <span className="text-emerald-400 font-semibold font-mono">{fmt(results.fairPrice)}</span>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="glass rounded-2xl p-16 flex flex-col items-center justify-center text-center">
              <Zap size={40} className="text-slate-700 mb-4" />
              <div className="text-sm text-slate-500 font-medium">Add at least 2 vendors with bids to see live predictions</div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
