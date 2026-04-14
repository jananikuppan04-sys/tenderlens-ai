import React from 'react'
import { X, User, Shield, Key, BookText, Copy, CheckCircle, Clock, Download } from 'lucide-react'
import { useApp } from '../context/AppContext'

// ─── Shared modal wrapper ────────────────────────────────────────────────────
function Modal({ title, icon: Icon, onClose, children }) {
  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      {/* Panel */}
      <div className="relative z-10 glass rounded-2xl border border-white/10 shadow-2xl w-full max-w-md animate-fade-in">
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.06]">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-indigo-500/15 border border-indigo-500/25 flex items-center justify-center">
              <Icon size={16} className="text-indigo-400" />
            </div>
            <span className="font-semibold text-sm text-white">{title}</span>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-slate-500 hover:text-white hover:bg-white/5 transition-all">
            <X size={16} />
          </button>
        </div>
        <div className="px-6 py-5">{children}</div>
      </div>
    </div>
  )
}

// ─── Profile Settings Modal ──────────────────────────────────────────────────
function ProfileSettingsModal({ onClose }) {
  const { user } = useApp()
  return (
    <Modal title="Profile Settings" icon={User} onClose={onClose}>
      <div className="space-y-5">
        {/* Avatar + name */}
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-xl font-bold text-white shrink-0">
            {user?.avatar || 'JA'}
          </div>
          <div>
            <div className="font-semibold text-white text-sm">{user?.name || 'Janani Admin'}</div>
            <div className="text-xs text-indigo-400 mt-0.5">{user?.role || 'Procurement Auditor'}</div>
            <div className="text-[11px] text-slate-500 mt-0.5">{user?.email || 'admin@tenderlens.ai'}</div>
          </div>
        </div>
        {/* Fields */}
        <div className="space-y-3">
          {[
            { label: 'Full Name', value: user?.name || 'Janani Admin' },
            { label: 'Email', value: user?.email || 'admin@tenderlens.ai' },
            { label: 'Role', value: user?.role || 'Procurement Auditor' },
            { label: 'Organization', value: 'Procurement Intelligence Corp' },
          ].map(f => (
            <div key={f.label}>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">{f.label}</label>
              <input type="text" defaultValue={f.value} className="w-full input-base text-xs py-2" />
            </div>
          ))}
        </div>
        <div className="flex gap-3 pt-2">
          <button className="btn-primary flex-1 py-2 text-xs">Save Changes</button>
          <button onClick={onClose} className="btn-secondary px-4 py-2 text-xs">Cancel</button>
        </div>
      </div>
    </Modal>
  )
}

// ─── Audit Logs Modal ────────────────────────────────────────────────────────
const MOCK_LOGS = [
  { id: 1, action: 'Signed In',              ip: '192.168.1.42',  time: '2026-04-14 11:05' },
  { id: 2, action: 'Viewed TND-1023',        ip: '192.168.1.42',  time: '2026-04-14 11:09' },
  { id: 3, action: 'Exported Risk Report',   ip: '192.168.1.42',  time: '2026-04-14 10:48' },
  { id: 4, action: 'Filter Applied: Dept',   ip: '192.168.1.42',  time: '2026-04-14 10:44' },
  { id: 5, action: 'Ran Bid Simulation',     ip: '203.0.113.7',   time: '2026-04-13 17:22' },
  { id: 6, action: 'Network Graph Accessed', ip: '203.0.113.7',   time: '2026-04-13 17:18' },
  { id: 7, action: 'Signed In',              ip: '203.0.113.7',   time: '2026-04-13 17:15' },
  { id: 8, action: 'Password Changed',       ip: '10.0.0.5',      time: '2026-04-12 09:05' },
]

function AuditLogsModal({ onClose }) {
  return (
    <Modal title="Audit Logs" icon={BookText} onClose={onClose}>
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-[11px] text-slate-500">Last 30 days • {MOCK_LOGS.length} events</span>
          <button className="flex items-center gap-1.5 text-[11px] text-indigo-400 hover:text-indigo-300 transition-colors">
            <Download size={12} /> Export CSV
          </button>
        </div>
        <div className="space-y-1.5 max-h-64 overflow-y-auto">
          {MOCK_LOGS.map(log => (
            <div key={log.id} className="glass-light rounded-xl px-3 py-2.5 flex items-start justify-between gap-3">
              <div className="flex items-start gap-2">
                <Clock size={12} className="text-slate-500 mt-0.5 shrink-0" />
                <div>
                  <div className="text-xs text-slate-200 font-medium">{log.action}</div>
                  <div className="text-[10px] text-slate-500 mt-0.5">IP: {log.ip}</div>
                </div>
              </div>
              <div className="text-[10px] text-slate-500 shrink-0">{log.time.split(' ')[1]}<br />{log.time.split(' ')[0]}</div>
            </div>
          ))}
        </div>
        <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl px-4 py-2.5 text-[11px] text-amber-300">
          ⚠ Unusual sign-in from IP 203.0.113.7 detected. Please verify.
        </div>
      </div>
    </Modal>
  )
}

// ─── API Access Modal ────────────────────────────────────────────────────────
function APIAccessModal({ onClose }) {
  const [copied, setCopied] = React.useState(false)
  const apiKey = 'tlai_live_a9f3c2b1d8e74f5a_2026041480x7z'

  const handleCopy = () => {
    navigator.clipboard.writeText(apiKey).catch(() => {})
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <Modal title="API Access" icon={Key} onClose={onClose}>
      <div className="space-y-4">
        <div className="glass-light rounded-xl px-4 py-3">
          <div className="text-[10px] uppercase font-bold tracking-wider text-slate-500 mb-2">Your API Key</div>
          <div className="flex items-center gap-2">
            <code className="flex-1 text-[11px] text-indigo-300 font-mono truncate bg-indigo-500/10 px-2 py-1.5 rounded-lg">
              {apiKey}
            </code>
            <button onClick={handleCopy} className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 transition-all shrink-0">
              {copied ? <CheckCircle size={14} className="text-emerald-400" /> : <Copy size={14} className="text-slate-400" />}
            </button>
          </div>
          <div className="text-[10px] text-slate-500 mt-2">This key grants read access to the TenderLens API v2.0</div>
        </div>

        <div className="space-y-2">
          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Usage This Month</div>
          <div className="grid grid-cols-3 gap-2">
            {[
              { label: 'API Calls', value: '1,248' },
              { label: 'Rate Limit', value: '5,000/mo' },
              { label: 'Remaining', value: '3,752' },
            ].map(s => (
              <div key={s.label} className="glass-light rounded-xl px-3 py-2 text-center">
                <div className="text-[10px] text-slate-500">{s.label}</div>
                <div className="text-sm font-bold text-white mt-0.5">{s.value}</div>
              </div>
            ))}
          </div>
          <div className="w-full h-1.5 rounded-full bg-white/5">
            <div className="h-full w-[25%] rounded-full bg-indigo-500" />
          </div>
          <div className="text-[10px] text-slate-500 text-right">25% of monthly quota used</div>
        </div>

        <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
          <Shield size={14} className="text-emerald-400 shrink-0" />
          <span className="text-[11px] text-emerald-300">Key is active and secured with TLS 1.3</span>
        </div>

        <div className="flex gap-3">
          <button className="btn-secondary flex-1 py-2 text-xs">Regenerate Key</button>
          <button onClick={onClose} className="btn-primary px-4 py-2 text-xs">Done</button>
        </div>
      </div>
    </Modal>
  )
}

// ─── Main export: renders the correct modal based on `profilePanel` ──────────
export default function ProfileModals() {
  const { profilePanel, setProfilePanel } = useApp()
  const close = () => setProfilePanel(null)

  if (profilePanel === 'settings') return <ProfileSettingsModal onClose={close} />
  if (profilePanel === 'logs')     return <AuditLogsModal onClose={close} />
  if (profilePanel === 'api')      return <APIAccessModal onClose={close} />
  return null
}
