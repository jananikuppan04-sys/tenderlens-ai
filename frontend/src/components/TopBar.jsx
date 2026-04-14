import React, { useState, useRef, useEffect } from 'react'
import { Search, Bell, ChevronDown, X, Check, Sun, Moon, Settings, BookText, Key, LogOut, Activity, PauseCircle } from 'lucide-react'
import { useApp } from '../context/AppContext'

function riskColor(r) {
  if (r >= 65) return 'text-red-400'
  if (r >= 35) return 'text-amber-400'
  return 'text-emerald-400'
}

export default function TopBar() {
  const {
    search, setSearch,
    notifications, markAllRead,
    sidebarOpen,
    logout, user,
    liveMode, setLiveMode,
    theme, toggleTheme,
    setProfilePanel,
  } = useApp()

  const [notifOpen, setNotifOpen]   = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)
  const notifRef   = useRef(null)
  const profileRef = useRef(null)
  const unread     = notifications.filter(n => !n.read).length

  useEffect(() => {
    const handler = e => {
      if (notifRef.current   && !notifRef.current.contains(e.target))   setNotifOpen(false)
      if (profileRef.current && !profileRef.current.contains(e.target)) setProfileOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  return (
    <header className={`
      fixed top-0 right-0 z-30 h-16 flex items-center gap-3 px-6
      bg-navy-900/80 backdrop-blur-xl border-b border-white/[0.06]
      transition-all duration-300
      ${sidebarOpen ? 'left-64' : 'left-16'}
    `}>

      {/* Search */}
      <div className="flex-1 max-w-md relative">
        <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
        <input
          type="text"
          placeholder="Search tender ID, vendor name…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full input-base pl-9 py-2 text-sm"
        />
        {search && (
          <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300">
            <X size={14} />
          </button>
        )}
      </div>

      <div className="flex items-center gap-2 ml-auto">

        {/* ── LIVE TOGGLE ─────────────────────────────── */}
        <button
          onClick={() => setLiveMode(v => !v)}
          title={liveMode ? 'Pause live simulation' : 'Enable live simulation'}
          className={`
            hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full border transition-all duration-300
            ${liveMode
              ? 'glass border-emerald-500/30 hover:border-emerald-500/60'
              : 'bg-white/5 border-white/10 hover:border-white/20'}
          `}
        >
          {liveMode ? (
            <>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-[11px] font-bold text-emerald-400">LIVE</span>
              <PauseCircle size={12} className="text-emerald-400/60" />
            </>
          ) : (
            <>
              <Activity size={12} className="text-slate-500" />
              <span className="text-[11px] font-bold text-slate-500">PAUSED</span>
            </>
          )}
        </button>

        {/* ── THEME TOGGLE ─────────────────────────────── */}
        <button
          onClick={toggleTheme}
          title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
          className="p-2 rounded-xl text-slate-400 hover:text-amber-400 hover:bg-white/5 transition-all relative group"
        >
          {theme === 'dark'
            ? <Sun size={18} className="group-hover:rotate-12 transition-transform duration-300" />
            : <Moon size={18} className="group-hover:-rotate-12 transition-transform duration-300" />
          }
        </button>

        {/* ── NOTIFICATIONS ────────────────────────────── */}
        <div className="relative" ref={notifRef}>
          <button
            onClick={() => setNotifOpen(v => !v)}
            className="relative p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/5 transition-all"
          >
            <Bell size={18} />
            {unread > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-red-500 ring-2 ring-navy-900" />
            )}
          </button>

          {notifOpen && (
            <div className="absolute right-0 top-full mt-2 w-80 glass rounded-2xl shadow-2xl border border-white/10 animate-fade-in overflow-hidden">
              <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.06]">
                <span className="font-semibold text-sm text-white">Risk Alerts</span>
                <div className="flex items-center gap-2">
                  {unread > 0 && <span className="badge-high">{unread} new</span>}
                  <button onClick={markAllRead} className="text-[11px] text-indigo-400 hover:text-indigo-300 flex items-center gap-1">
                    <Check size={11} /> Mark all read
                  </button>
                </div>
              </div>
              <div className="max-h-72 overflow-y-auto divide-y divide-white/[0.04]">
                {notifications.length === 0 && (
                  <div className="px-4 py-6 text-center text-xs text-slate-500">No alerts at this time.</div>
                )}
                {notifications.slice(0, 10).map(n => (
                  <div key={n.id} className={`px-4 py-3 hover:bg-white/[0.03] transition-colors ${!n.read ? 'bg-red-500/5' : ''}`}>
                    <div className="flex items-start gap-3">
                      <span className={`mt-0.5 w-2 h-2 rounded-full shrink-0 ${!n.read ? 'bg-red-400' : 'bg-slate-600'}`} />
                      <div className="min-w-0">
                        <div className="text-xs font-medium text-slate-200 truncate">{n.message}</div>
                        <div className="text-[11px] text-slate-500 mt-0.5">
                          {n.dept} • Risk: <span className={`font-semibold ${riskColor(n.risk)}`}>{n.risk.toFixed(0)}</span>
                        </div>
                        <div className="text-[10px] text-slate-600 mt-0.5">{n.time}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* ── USER PROFILE ──────────────────────────────── */}
        <div className="relative" ref={profileRef}>
          <button
            onClick={() => setProfileOpen(v => !v)}
            className="flex items-center gap-2.5 pl-2 pr-3 py-1.5 rounded-xl hover:bg-white/5 transition-all"
          >
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-xs font-bold text-white shrink-0">
              {user?.avatar || 'JA'}
            </div>
            <div className="hidden sm:block text-left">
              <div className="text-xs font-semibold text-slate-200">{user?.name || 'Janani Admin'}</div>
              <div className="text-[10px] text-slate-500">{user?.role || 'Procurement Auditor'}</div>
            </div>
            <ChevronDown size={13} className="text-slate-500" />
          </button>

          {profileOpen && (
            <div className="absolute right-0 top-full mt-2 w-52 glass rounded-2xl shadow-2xl border border-white/10 animate-fade-in overflow-hidden">
              {/* User info header */}
              <div className="px-4 py-3 border-b border-white/[0.06]">
                <div className="text-xs font-semibold text-white">{user?.name || 'Janani Admin'}</div>
                <div className="text-[10px] text-slate-500 mt-0.5">{user?.email || 'admin@tenderlens.ai'}</div>
              </div>

              {/* Menu items */}
              <div className="py-1">
                <button onClick={() => { setProfilePanel('settings'); setProfileOpen(false) }} className="w-full flex items-center gap-3 px-4 py-2.5 text-xs text-slate-300 hover:bg-white/5 hover:text-white transition-colors text-left">
                  <Settings size={14} className="text-slate-500" /> Profile Settings
                </button>
                <button onClick={() => { setProfilePanel('logs'); setProfileOpen(false) }} className="w-full flex items-center gap-3 px-4 py-2.5 text-xs text-slate-300 hover:bg-white/5 hover:text-white transition-colors text-left">
                  <BookText size={14} className="text-slate-500" /> Audit Logs
                </button>
                <button onClick={() => { setProfilePanel('api'); setProfileOpen(false) }} className="w-full flex items-center gap-3 px-4 py-2.5 text-xs text-slate-300 hover:bg-white/5 hover:text-white transition-colors text-left">
                  <Key size={14} className="text-slate-500" /> API Access
                </button>
              </div>

              <div className="border-t border-white/[0.06]" />

              {/* Sign out */}
              <div className="py-1">
                <button
                  onClick={() => { logout(); setProfileOpen(false) }}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-xs text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-colors text-left"
                >
                  <LogOut size={14} /> Sign Out
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
