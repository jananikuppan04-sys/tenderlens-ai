import React, { useEffect, useRef, useMemo, useState } from 'react'
import { useApp } from '../context/AppContext'
import { Network, Users, ArrowRight, X, AlertTriangle } from 'lucide-react'

function riskColor(score) {
  if (score >= 65) return '#ef4444'
  if (score >= 35) return '#f59e0b'
  return '#22c55e'
}

// Simple force-directed layout (pure JS, no d3 dependency)
function useForceLayout(nodes, edges, width, height) {
  const posRef = useRef({})

  return useMemo(() => {
    if (!nodes.length) return {}
    const pos = {}
    // Initialize random positions within bounds
    nodes.forEach(n => {
      if (!posRef.current[n.id]) {
        posRef.current[n.id] = {
          x: width * 0.1 + Math.random() * width * 0.8,
          y: height * 0.1 + Math.random() * height * 0.8,
        }
      }
      pos[n.id] = { ...posRef.current[n.id] }
    })

    // Run simplified force iterations
    const k2 = (width * height) / nodes.length
    for (let iter = 0; iter < 80; iter++) {
      const disp = {}
      nodes.forEach(n => { disp[n.id] = { x: 0, y: 0 } })

      // Repulsion
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const a = nodes[i], b = nodes[j]
          const dx = pos[a.id].x - pos[b.id].x
          const dy = pos[a.id].y - pos[b.id].y
          const dist = Math.max(1, Math.sqrt(dx * dx + dy * dy))
          const force = k2 / (dist * dist) * 0.6
          disp[a.id].x += (dx / dist) * force
          disp[a.id].y += (dy / dist) * force
          disp[b.id].x -= (dx / dist) * force
          disp[b.id].y -= (dy / dist) * force
        }
      }

      // Attraction
      edges.forEach(e => {
        if (!pos[e.source] || !pos[e.target]) return
        const dx = pos[e.source].x - pos[e.target].x
        const dy = pos[e.source].y - pos[e.target].y
        const dist = Math.max(1, Math.sqrt(dx * dx + dy * dy))
        const force = (dist * dist) / Math.sqrt(k2) * 0.04
        disp[e.source].x -= (dx / dist) * force
        disp[e.source].y -= (dy / dist) * force
        disp[e.target].x += (dx / dist) * force
        disp[e.target].y += (dy / dist) * force
      })

      // Apply with damping
      const t = Math.max(2, 20 / (1 + iter * 0.3))
      nodes.forEach(n => {
        const d  = disp[n.id]
        const dm = Math.max(1, Math.sqrt(d.x * d.x + d.y * d.y))
        pos[n.id].x = Math.max(20, Math.min(width - 20, pos[n.id].x + (d.x / dm) * Math.min(dm, t)))
        pos[n.id].y = Math.max(20, Math.min(height - 20, pos[n.id].y + (d.y / dm) * Math.min(dm, t)))
      })
    }

    posRef.current = pos
    return pos
  }, [nodes.map(n => n.id).join(','), width, height])
}

export default function VendorNetwork() {
  const { tenders, vendorRisks, networkEdges, setSelectedVendor, selectedVendor } = useApp()
  const canvasRef   = useRef(null)
  const [dims, setDims]   = useState({ w: 800, h: 480 })
  const [hovered, setHovered] = useState(null)
  const [tooltip, setTooltip] = useState(null)

  // Pick top 30 vendors for legibility
  const nodes = useMemo(() => {
    const vSet = new Set()
    networkEdges.forEach(e => { vSet.add(e.source); vSet.add(e.target) })
    return vendorRisks
      .filter(v => vSet.has(v.company_name))
      .slice(0, 30)
      .map(v => ({ id: v.company_name, risk: v.avg_risk_score, label: v.company_name, wins: v.tenders_won, flag: v.suspicion_flag }))
  }, [vendorRisks, networkEdges])

  const edges = useMemo(() =>
    networkEdges.filter(e => nodes.find(n => n.id === e.source) && nodes.find(n => n.id === e.target)).slice(0, 80),
    [networkEdges, nodes])

  useEffect(() => {
    const updateSize = () => {
      if (canvasRef.current) {
        const rect = canvasRef.current.parentElement.getBoundingClientRect()
        setDims({ w: rect.width, h: Math.max(400, rect.height) })
      }
    }
    updateSize()
    window.addEventListener('resize', updateSize)
    return () => window.removeEventListener('resize', updateSize)
  }, [])

  const positions = useForceLayout(nodes, edges, dims.w, dims.h)

  // Canvas renderer
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || !Object.keys(positions).length) return
    const ctx = canvas.getContext('2d')
    const dpr = window.devicePixelRatio || 1
    canvas.width  = dims.w * dpr
    canvas.height = dims.h * dpr
    canvas.style.width  = `${dims.w}px`
    canvas.style.height = `${dims.h}px`
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)

    ctx.clearRect(0, 0, dims.w, dims.h)

    // Draw edges
    edges.forEach(e => {
      const s = positions[e.source], t = positions[e.target]
      if (!s || !t) return
      const isSuspect = e.colluded > 0
      ctx.beginPath()
      ctx.moveTo(s.x, s.y)
      ctx.lineTo(t.x, t.y)
      ctx.strokeStyle = isSuspect ? 'rgba(239,68,68,0.35)' : 'rgba(99,102,241,0.15)'
      ctx.lineWidth   = isSuspect ? 1.5 : 0.8
      if (isSuspect) ctx.setLineDash([4, 3])
      else ctx.setLineDash([])
      ctx.stroke()
      ctx.setLineDash([])
    })

    // Draw nodes
    nodes.forEach(n => {
      const p = positions[n.id]
      if (!p) return
      const r    = Math.max(10, Math.min(22, 10 + n.wins * 1.5))
      const col  = riskColor(n.risk)
      const isHov = hovered === n.id
      const isSel = selectedVendor?.id === n.id

      // Glow
      if (isHov || isSel) {
        ctx.beginPath()
        ctx.arc(p.x, p.y, r + 8, 0, Math.PI * 2)
        const grd = ctx.createRadialGradient(p.x, p.y, r, p.x, p.y, r + 8)
        grd.addColorStop(0, col.replace(')', ',0.3)').replace('rgb', 'rgba'))
        grd.addColorStop(1, 'transparent')
        ctx.fillStyle = grd
        ctx.fill()
      }

      // Node circle
      ctx.beginPath()
      ctx.arc(p.x, p.y, r, 0, Math.PI * 2)
      ctx.fillStyle = col + '30'
      ctx.fill()
      ctx.strokeStyle = col
      ctx.lineWidth   = isHov || isSel ? 2.5 : 1.5
      ctx.stroke()

      // Label
      if (isHov || isSel || r > 16) {
        ctx.font        = `${isHov ? 600 : 500} 9px Inter, sans-serif`
        ctx.fillStyle   = isHov ? '#ffffff' : '#94a3b8'
        ctx.textAlign   = 'center'
        ctx.textBaseline = 'top'
        const short = n.label.split(' ').slice(0, 2).join(' ')
        ctx.fillText(short, p.x, p.y + r + 3)
      }
    })
  }, [positions, nodes, edges, hovered, selectedVendor, dims])

  // Mouse events
  const getHitNode = (clientX, clientY) => {
    const rect    = canvasRef.current?.getBoundingClientRect()
    if (!rect) return null
    const mx = clientX - rect.left, my = clientY - rect.top
    return nodes.find(n => {
      const p = positions[n.id]
      if (!p) return false
      const dx = p.x - mx, dy = p.y - my
      const r  = Math.max(10, Math.min(22, 10 + n.wins * 1.5))
      return dx * dx + dy * dy <= (r + 4) * (r + 4)
    }) || null
  }

  const onMouseMove = e => {
    const hit = getHitNode(e.clientX, e.clientY)
    setHovered(hit?.id || null)
    if (hit) {
      const rect = canvasRef.current.getBoundingClientRect()
      setTooltip({ node: hit, x: e.clientX - rect.left, y: e.clientY - rect.top })
    } else setTooltip(null)
    canvasRef.current.style.cursor = hit ? 'pointer' : 'default'
  }

  const onClick = e => {
    const hit = getHitNode(e.clientX, e.clientY)
    if (hit) setSelectedVendor(v => v?.id === hit.id ? null : { id: hit.id, ...hit })
  }

  const vendorDetail = useMemo(() => {
    if (!selectedVendor) return null
    return vendorRisks.find(v => v.company_name === selectedVendor.id)
  }, [selectedVendor, vendorRisks])

  return (
    <div className="space-y-4 animate-slide-up">
      <div>
        <h1 className="text-xl font-bold text-white flex items-center gap-2">
          <Network size={20} className="text-indigo-400" /> Vendor Network Intelligence
        </h1>
        <p className="text-sm text-slate-500 mt-0.5">Graph-based relationship mapping — red dashed edges indicate potential collusion</p>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'Vendors Mapped', value: nodes.length, color: '#6366f1' },
          { label: 'Relationships', value: edges.length, color: '#8b5cf6' },
          { label: 'Suspicious Links', value: edges.filter(e => e.colluded > 0).length, color: '#ef4444' },
          { label: 'Flagged Vendors', value: nodes.filter(n => n.flag).length, color: '#f59e0b' },
        ].map((s, i) => (
          <div key={i} className="glass rounded-xl p-4">
            <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">{s.label}</div>
            <div className="text-2xl font-bold mt-1" style={{ color: s.color }}>{s.value}</div>
          </div>
        ))}
      </div>

      <div className="flex gap-4">
        {/* Graph canvas */}
        <div className="glass rounded-2xl overflow-hidden flex-1 min-w-0" style={{ height: 480 }}>
          <div className="flex items-center justify-between px-5 py-3 border-b border-white/[0.06]">
            <span className="text-sm font-semibold text-white">Co-Bidding Relationship Graph</span>
            <div className="flex items-center gap-4 text-[10px] text-slate-500">
              <span className="flex items-center gap-1.5"><span className="w-6 border-t border-indigo-500/60" /> Shared bid</span>
              <span className="flex items-center gap-1.5"><span className="w-6 border-t-2 border-dashed border-red-400/80" /> Collusion risk</span>
              <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full border border-emerald-500 bg-emerald-500/20" /> Low risk</span>
              <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full border border-red-500 bg-red-500/20" /> High risk</span>
            </div>
          </div>
          <div style={{ height: 430, position: 'relative' }}>
            <canvas ref={canvasRef} onMouseMove={onMouseMove} onClick={onClick} style={{ display: 'block' }} />
            {tooltip && (
              <div className="absolute z-50 pointer-events-none glass rounded-xl px-3 py-2 border border-white/10 shadow-2xl text-xs"
                style={{ left: tooltip.x + 14, top: tooltip.y - 10, maxWidth: 200 }}>
                <div className="font-semibold text-white mb-1">{tooltip.node.label}</div>
                <div className="text-slate-400 space-y-0.5">
                  <div>Risk Score: <span className="font-semibold" style={{ color: riskColor(tooltip.node.risk) }}>{tooltip.node.risk?.toFixed(1)}</span></div>
                  <div>Tenders Won: <span className="font-semibold text-slate-200">{tooltip.node.wins}</span></div>
                  {tooltip.node.flag && <div className="text-red-400 font-medium">⚠ Suspicion Flag Active</div>}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Vendor detail panel */}
        {selectedVendor && vendorDetail && (
          <div className="glass rounded-2xl w-72 shrink-0 overflow-hidden animate-slide-right">
            <div className="flex items-center justify-between px-5 py-3 border-b border-white/[0.06]">
              <span className="text-sm font-semibold text-white">Vendor Profile</span>
              <button onClick={() => setSelectedVendor(null)} className="text-slate-500 hover:text-white transition-colors">
                <X size={15} />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <div className="font-bold text-white text-sm">{vendorDetail.company_name}</div>
                <div className="flex items-center gap-2 mt-1.5">
                  <span className={vendorDetail.risk_label === 'High' ? 'badge-high' : vendorDetail.risk_label === 'Medium' ? 'badge-medium' : 'badge-low'}>
                    {vendorDetail.risk_label} Risk
                  </span>
                  {vendorDetail.suspicion_flag && <span className="badge-high">⚠ Flagged</span>}
                </div>
              </div>

              {[
                ['Avg Risk Score', vendorDetail.avg_risk_score?.toFixed(1), '#ef4444'],
                ['Total Bids', vendorDetail.total_bids, '#6366f1'],
                ['Tenders Won', vendorDetail.tenders_won, '#22c55e'],
                ['Win Rate', `${vendorDetail.win_rate}%`, '#f59e0b'],
              ].map(([label, val, col]) => (
                <div key={label} className="glass-light rounded-xl px-4 py-3">
                  <div className="text-[10px] uppercase tracking-wider text-slate-500">{label}</div>
                  <div className="text-xl font-bold mt-1" style={{ color: col }}>{val}</div>
                </div>
              ))}

              <div>
                <div className="text-[10px] uppercase tracking-wider text-slate-500 mb-2">Associated Tenders</div>
                <div className="flex flex-wrap gap-1.5">
                  {vendorDetail.tender_ids?.slice(0, 8).map(id => (
                    <span key={id} className="text-[10px] font-mono bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 px-2 py-0.5 rounded-md">{id}</span>
                  ))}
                </div>
              </div>

              {vendorDetail.suspicion_flag && (
                <div className="flex items-start gap-2 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">
                  <AlertTriangle size={14} className="text-red-400 shrink-0 mt-0.5" />
                  <div className="text-xs text-red-300">
                    This vendor has an abnormally high win rate or risk concentration. Manual audit recommended.
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
