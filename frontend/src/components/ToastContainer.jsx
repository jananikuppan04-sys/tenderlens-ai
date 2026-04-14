import React from 'react'
import { X, AlertTriangle, Info, CheckCircle } from 'lucide-react'
import { useApp } from '../context/AppContext'

const TOAST_CONFIG = {
  danger:  { icon: AlertTriangle, bg: 'bg-red-500/15 border-red-500/30',   icon_cls: 'text-red-400',     title_cls: 'text-red-300' },
  warning: { icon: AlertTriangle, bg: 'bg-amber-500/15 border-amber-500/30', icon_cls: 'text-amber-400', title_cls: 'text-amber-300' },
  success: { icon: CheckCircle,   bg: 'bg-emerald-500/15 border-emerald-500/30', icon_cls: 'text-emerald-400', title_cls: 'text-emerald-300' },
  info:    { icon: Info,          bg: 'bg-blue-500/15 border-blue-500/30',  icon_cls: 'text-blue-400',    title_cls: 'text-blue-300' },
}

export default function ToastContainer() {
  const { toasts, dismissToast } = useApp()

  return (
    <div className="fixed bottom-6 right-6 z-[100] flex flex-col gap-3 pointer-events-none">
      {toasts.map(toast => {
        const cfg  = TOAST_CONFIG[toast.type] || TOAST_CONFIG.info
        const Icon = cfg.icon
        return (
          <div
            key={toast.id}
            className={`
              pointer-events-auto flex items-start gap-3 w-80 px-4 py-3.5 rounded-2xl
              border backdrop-blur-xl shadow-2xl
              ${cfg.bg}
              ${toast.exiting ? 'toast-exit' : 'toast-enter'}
            `}
          >
            <Icon size={18} className={`${cfg.icon_cls} shrink-0 mt-0.5`} />
            <div className="flex-1 min-w-0">
              <div className={`text-sm font-semibold ${cfg.title_cls}`}>{toast.title}</div>
              <div className="text-xs text-slate-400 mt-0.5 truncate">{toast.body}</div>
            </div>
            <button
              onClick={() => dismissToast(toast.id)}
              className="text-slate-500 hover:text-slate-300 shrink-0 transition-colors"
            >
              <X size={14} />
            </button>
          </div>
        )
      })}
    </div>
  )
}
