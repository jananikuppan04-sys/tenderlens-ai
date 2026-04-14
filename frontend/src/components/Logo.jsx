import React from 'react'

// ─── High-fidelity SVG matching the user's actual TenderLens logo ───────────
// Circular swoosh ring (teal→navy gradient) containing 4 quadrants:
//   top-left: grid mesh  |  top-right: network nodes
//   bottom-right: bar chart+arrow  |  bottom-left: starburst
// Magnifying glass centered over all quadrants
export default function TenderLensLogo({ size = 32, className = '' }) {
  const id = `tl-${Math.random().toString(36).slice(2, 7)}`
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 120 120"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <defs>
        <linearGradient id={`ring-${id}`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%"   stopColor="#00b4d8" />
          <stop offset="40%"  stopColor="#0077b6" />
          <stop offset="70%"  stopColor="#023e8a" />
          <stop offset="100%" stopColor="#c9a84c" stopOpacity="0.7" />
        </linearGradient>
        <linearGradient id={`ring2-${id}`} x1="100%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%"   stopColor="#c9a84c" stopOpacity="0.5" />
          <stop offset="60%"  stopColor="#00b4d8" stopOpacity="0.4" />
        </linearGradient>
        <linearGradient id={`lens-${id}`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%"   stopColor="#90e0ef" />
          <stop offset="100%" stopColor="#0077b6" />
        </linearGradient>
        <linearGradient id={`bar-${id}`} x1="0%" y1="100%" x2="0%" y2="0%">
          <stop offset="0%"   stopColor="#0077b6" />
          <stop offset="100%" stopColor="#00b4d8" />
        </linearGradient>
        <clipPath id={`circle-clip-${id}`}>
          <circle cx="60" cy="60" r="42" />
        </clipPath>
        <radialGradient id={`bg-${id}`} cx="50%" cy="45%" r="50%">
          <stop offset="0%"   stopColor="#e0f4ff" />
          <stop offset="100%" stopColor="#c8e8f8" />
        </radialGradient>
      </defs>

      {/* Outer swoosh ring — thick, gradient */}
      <circle cx="60" cy="60" r="48" stroke={`url(#ring-${id})`}  strokeWidth="7" fill="none" strokeLinecap="round" />
      <circle cx="60" cy="60" r="48" stroke={`url(#ring2-${id})`} strokeWidth="3" fill="none" strokeLinecap="round" strokeDasharray="80 220" strokeDashoffset="-40" />

      {/* Inner filled circle (light background for quadrants) */}
      <circle cx="60" cy="60" r="42" fill={`url(#bg-${id})`} opacity="0.18" />

      {/* ── QUADRANT CLIP ── */}
      <g clipPath={`url(#circle-clip-${id})`}>

        {/* Dividers */}
        <line x1="60" y1="18" x2="60" y2="102" stroke="rgba(0,119,182,0.15)" strokeWidth="0.8" />
        <line x1="18" y1="60" x2="102" y2="60" stroke="rgba(0,119,182,0.15)" strokeWidth="0.8" />

        {/* TOP-LEFT: Grid/mesh pattern */}
        <g opacity="0.7">
          {[30,36,42,48,54].map(x => (
            <line key={`gv${x}`} x1={x} y1="22" x2={x} y2="58" stroke="#0077b6" strokeWidth="0.8" />
          ))}
          {[28,34,40,46,52,58].map(y => (
            <line key={`gh${y}`} x1="22" y1={y} x2="58" y2={y} stroke="#0077b6" strokeWidth="0.8" />
          ))}
        </g>

        {/* TOP-RIGHT: Network nodes */}
        <g opacity="0.85">
          {[
            [72,28],[85,35],[95,28],[80,45],[92,50],[68,42]
          ].map(([x,y], i, arr) => (
            <React.Fragment key={i}>
              <circle cx={x} cy={y} r="2.5" fill="#00b4d8" />
              {i > 0 && <line x1={arr[i-1][0]} y1={arr[i-1][1]} x2={x} y2={y} stroke="#00b4d8" strokeWidth="0.8" opacity="0.5" />}
            </React.Fragment>
          ))}
          <line x1="72" y1="28" x2="80" y2="45" stroke="#00b4d8" strokeWidth="0.8" opacity="0.5" />
          <line x1="85" y1="35" x2="92" y2="50" stroke="#00b4d8" strokeWidth="0.8" opacity="0.5" />
        </g>

        {/* BOTTOM-RIGHT: Bar chart with up arrow */}
        <g opacity="0.85">
          <rect x="70" y="76" width="5" height="22" rx="1" fill={`url(#bar-${id})`} />
          <rect x="78" y="70" width="5" height="28" rx="1" fill={`url(#bar-${id})`} />
          <rect x="86" y="65" width="5" height="33" rx="1" fill={`url(#bar-${id})`} />
          <rect x="94" y="60" width="5" height="38" rx="1" fill={`url(#bar-${id})`} />
          {/* Up arrow */}
          <polyline points="94,52 97,46 100,52" stroke="#00b4d8" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
          <line x1="97" y1="46" x2="97" y2="60" stroke="#00b4d8" strokeWidth="1.5" strokeLinecap="round" />
        </g>

        {/* BOTTOM-LEFT: Starburst / sun rays */}
        <g opacity="0.7">
          {Array.from({length: 10}, (_, i) => {
            const angle = (i * 36) * Math.PI / 180
            const cx = 38, cy = 80
            const r1 = 5, r2 = 14
            return (
              <line key={i}
                x1={cx + Math.cos(angle)*r1} y1={cy + Math.sin(angle)*r1}
                x2={cx + Math.cos(angle)*r2} y2={cy + Math.sin(angle)*r2}
                stroke="#c9a84c" strokeWidth="1.2" strokeLinecap="round"
              />
            )
          })}
          <circle cx="38" cy="80" r="4" fill="#c9a84c" opacity="0.8" />
        </g>
      </g>

      {/* ── MAGNIFYING GLASS (centered) ── */}
      {/* Glass lens */}
      <circle cx="56" cy="56" r="15" fill="rgba(144,224,239,0.18)" stroke={`url(#lens-${id})`} strokeWidth="3.5" />
      {/* Inner reflection */}
      <circle cx="50" cy="50" r="4" fill="white" opacity="0.25" />
      {/* Handle */}
      <line x1="67" y1="67" x2="82" y2="82" stroke={`url(#lens-${id})`} strokeWidth="4.5" strokeLinecap="round" />
      {/* Handle end cap */}
      <circle cx="82" cy="82" r="3" fill="#023e8a" opacity="0.6" />
    </svg>
  )
}

// ─── Wordmark: Logo + "TenderLens" text ──────────────────────────────────────
export function TenderLensWordmark({ size = 32, showSubtitle = true, className = '' }) {
  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      <TenderLensLogo size={size} />
      <div className="min-w-0">
        <div className="font-extrabold leading-tight tracking-tight" style={{ fontSize: size * 0.32 }}>
          <span style={{ color: '#1e3a5f' }} className="dark-text-override">Tender</span>
          <span style={{ color: '#0aacc5' }}>Lens</span>
        </div>
        {showSubtitle && (
          <div
            className="tracking-widest uppercase leading-tight text-slate-500"
            style={{ fontSize: size * 0.14 }}
          >
            Procurement Intel
          </div>
        )}
      </div>
    </div>
  )
}
