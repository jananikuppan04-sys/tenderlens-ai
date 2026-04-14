import React from 'react'
import {
  LayoutDashboard, Network, TrendingUp, FileText, Zap,
  ChevronLeft, ChevronRight, SlidersHorizontal,
  Building2, Tag, Calendar
} from 'lucide-react'
import { useApp } from '../context/AppContext'
import TenderLensLogo, { TenderLensWordmark } from './Logo'

const NAV_ITEMS = [
  { id: 'dashboard',   label: 'Executive Dashboard',  icon: LayoutDashboard },
  { id: 'network',     label: 'Vendor Network',        icon: Network },
  { id: 'pricing',     label: 'Price Intelligence',    icon: TrendingUp },
  { id: 'conclusion',  label: 'Tender Conclusion',     icon: FileText },
  { id: 'simulator',   label: 'Live Simulator',        icon: Zap },
]

export default function Sidebar() {
  const {
    sidebarOpen, setSidebarOpen,
    activeTab,   setActiveTab,
    filterDept,  setFilterDept, departments,
    filterCat,   setFilterCat,  categories,
    filterDate,  setFilterDate,
    liveMode,
  } = useApp()

  return (
    <aside
      className={`
        fixed inset-y-0 left-0 z-40 flex flex-col
        bg-navy-900 border-r border-white/[0.06]
        transition-all duration-300 ease-in-out
        ${sidebarOpen ? 'w-64' : 'w-16'}
      `}
    >
      {/* Logo */}
      <div className="flex items-center h-16 px-3 border-b border-white/[0.06] shrink-0">
        <div className="flex items-center gap-2 min-w-0 flex-1 overflow-hidden">
          {sidebarOpen ? (
            <TenderLensWordmark size={34} showSubtitle={true} className="animate-fade-in min-w-0" />
          ) : (
            <TenderLensLogo size={34} />
          )}
        </div>
        <button
          onClick={() => setSidebarOpen(v => !v)}
          className="p-1.5 rounded-lg text-slate-500 hover:text-slate-300 hover:bg-white/5 transition-all shrink-0 ml-auto"
        >
          {sidebarOpen ? <ChevronLeft size={16} /> : <ChevronRight size={16} />}
        </button>
      </div>

      <div className="flex-1 overflow-y-auto py-4 px-2 space-y-6">
        {/* Filters */}
        {sidebarOpen && (
          <div className="animate-fade-in">
            <div className="flex items-center gap-2 px-2 mb-3">
              <SlidersHorizontal size={12} className="text-slate-500" />
              <span className="text-[10px] font-semibold uppercase tracking-widest text-slate-500">Filters</span>
            </div>

            <div className="space-y-3">
              <div className="px-1">
                <label className="flex items-center gap-1.5 text-[11px] font-medium text-slate-400 mb-1.5">
                  <Building2 size={11} className="text-indigo-400" /> Department
                </label>
                <select value={filterDept} onChange={e => setFilterDept(e.target.value)} className="w-full input-base text-xs py-1.5">
                  {departments.map(d => <option key={d} value={d}>{d === 'All' ? 'All Departments' : d.replace('Ministry of ', '')}</option>)}
                </select>
              </div>

              <div className="px-1">
                <label className="flex items-center gap-1.5 text-[11px] font-medium text-slate-400 mb-1.5">
                  <Tag size={11} className="text-indigo-400" /> Category
                </label>
                <select value={filterCat} onChange={e => setFilterCat(e.target.value)} className="w-full input-base text-xs py-1.5">
                  {categories.map(c => <option key={c} value={c}>{c === 'All' ? 'All Categories' : c}</option>)}
                </select>
              </div>

              <div className="px-1">
                <label className="flex items-center gap-1.5 text-[11px] font-medium text-slate-400 mb-1.5">
                  <Calendar size={11} className="text-indigo-400" /> Date Range
                </label>
                <div className="space-y-1.5">
                  <input type="date" value={filterDate.from} onChange={e => setFilterDate(p => ({...p, from: e.target.value}))} className="w-full input-base text-xs py-1.5" />
                  <input type="date" value={filterDate.to}   onChange={e => setFilterDate(p => ({...p, to: e.target.value}))}   className="w-full input-base text-xs py-1.5" />
                </div>
                {(filterDate.from || filterDate.to) && (
                  <button onClick={() => setFilterDate({ from: '', to: '' })} className="mt-1.5 text-[10px] text-indigo-400 hover:text-indigo-300 transition-colors">
                    ✕ Clear dates
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Navigation */}
        <div>
          {sidebarOpen && (
            <div className="flex items-center gap-2 px-2 mb-2">
              <span className="text-[10px] font-semibold uppercase tracking-widest text-slate-500">Navigation</span>
            </div>
          )}
          <nav className="space-y-0.5">
            {NAV_ITEMS.map(item => {
              const Icon = item.icon
              const active = activeTab === item.id
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`nav-item w-full ${active ? 'active' : ''} ${!sidebarOpen ? 'justify-center px-0' : ''}`}
                  title={!sidebarOpen ? item.label : undefined}
                >
                  <Icon size={16} className={active ? 'text-indigo-400 shrink-0' : 'shrink-0'} />
                  {sidebarOpen && <span className="truncate animate-fade-in">{item.label}</span>}
                  {sidebarOpen && active && <span className="ml-auto w-1.5 h-1.5 rounded-full bg-indigo-400 shrink-0" />}
                </button>
              )
            })}
          </nav>
        </div>
      </div>

      {/* Footer badge */}
      {sidebarOpen && (
        <div className="shrink-0 px-3 py-3 border-t border-white/[0.06] animate-fade-in">
          <div className="glass-light rounded-xl px-3 py-2">
            <div className="text-[10px] text-slate-500 font-medium">SYSTEM STATUS</div>
            <div className="flex items-center gap-2 mt-1">
              <span className={`w-2 h-2 rounded-full shrink-0 ${liveMode ? 'bg-emerald-400 animate-pulse' : 'bg-slate-500'}`} />
              <span className={`text-xs font-medium ${liveMode ? 'text-emerald-400' : 'text-slate-500'}`}>
                {liveMode ? 'Live Monitoring' : 'Monitoring Paused'}
              </span>
            </div>
          </div>
        </div>
      )}
    </aside>
  )
}
