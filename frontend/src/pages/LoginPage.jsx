import React, { useState } from 'react'
import { Mail, Lock, LogIn, ChevronLeft, Github, ShieldAlert } from 'lucide-react'
import { TenderLensWordmark } from '../components/Logo'
import { useApp } from '../context/AppContext'

export default function LoginPage({ onExit }) {
  const { login } = useApp()
  const [email, setEmail]       = useState('admin@tenderlens.ai')
  const [password, setPassword] = useState('********')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = (e) => {
    e.preventDefault()
    setIsSubmitting(true)
    login({ 
      email, 
      name: 'Janani Admin', 
      role: 'Procurement Strategist',
      avatar: 'JA'
    })
  }

  return (
    <div className="min-h-screen bg-navy-950 flex relative overflow-hidden">
      {/* Background Decor */}
      <div className="absolute top-0 right-0 w-[50%] h-full bg-indigo-600/[0.03] skew-x-[-12deg] translate-x-[15%]" />
      
      {/* Left Column: Branding (Hidden on mobile) */}
      <div className="hidden lg:flex flex-col justify-between w-[40%] p-12 relative z-10 border-r border-white/[0.05]">
        <div className="cursor-pointer" onClick={onExit}>
          <TenderLensWordmark size={36} showSubtitle={true} />
        </div>

        <div>
          <h2 className="text-3xl font-extrabold mb-4 leading-tight">
            Secure Access to <br />
            <span className="text-gradient">Civil Intelligence.</span>
          </h2>
          <p className="text-slate-400 text-sm leading-relaxed max-w-sm">
            Enter your credentials to access the TenderLens audit dashboard. 
            All sessions are encrypted and logged for regulatory compliance.
          </p>
        </div>

        <div className="flex items-center gap-4 text-slate-500">
          <ShieldAlert size={16} />
          <span className="text-[10px] uppercase font-bold tracking-widest">ISO 27001 Certified Environment</span>
        </div>
      </div>

      {/* Right Column: Form */}
      <div className="flex-1 flex items-center justify-center p-6 relative z-10">
        <button 
          onClick={onExit}
          className="absolute top-8 left-8 lg:hidden flex items-center gap-2 text-slate-400 hover:text-white transition-colors"
        >
          <ChevronLeft size={16} /> Back
        </button>

        <div className="w-full max-w-sm animate-fade-in">
          <div className="lg:hidden flex justify-center mb-8">
            <TenderLensWordmark size={44} showSubtitle={true} />
          </div>

          <div className="text-center lg:text-left mb-8">
            <h1 className="text-2xl font-bold text-white mb-2">Portal Sign In</h1>
            <p className="text-slate-500 text-sm">Welcome back. Please enter your details.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5 ml-1">Email Address</label>
              <div className="relative">
                <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-600" />
                <input 
                  type="email" 
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="w-full input-base py-2.5 pl-10"
                  placeholder="name@tenderlens.ai"
                  required
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5 ml-1">
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider">Password</label>
                <a href="#" className="text-[11px] font-bold text-indigo-400 hover:text-indigo-300">Forgot?</a>
              </div>
              <div className="relative">
                <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-600" />
                <input 
                  type="password" 
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="w-full input-base py-2.5 pl-10"
                  required
                />
              </div>
            </div>

            <div className="flex items-center gap-2 px-1 py-1">
              <input type="checkbox" id="remember" className="w-3.5 h-3.5 rounded bg-navy-700 border-white/10 accent-indigo-500" />
              <label htmlFor="remember" className="text-xs text-slate-400">Remember for 30 days</label>
            </div>

            <button 
              type="submit" 
              disabled={isSubmitting}
              className="btn-primary w-full py-3 flex items-center justify-center gap-2 text-base disabled:opacity-50"
            >
              {isSubmitting ? (
                <span className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
              ) : (
                <>Sign In <LogIn size={18} /></>
              )}
            </button>
          </form>

          <div className="mt-8">
            <div className="relative flex items-center justify-center">
              <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-white/[0.05]" /></div>
              <span className="relative z-10 px-4 bg-navy-950 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Enterprise Auth</span>
            </div>

            <div className="mt-6 flex flex-col gap-3">
              <button className="btn-secondary w-full py-2.5 flex items-center justify-center gap-2 group">
                <Github size={18} className="text-slate-400 group-hover:text-white" /> Continue with SSO
              </button>
            </div>
          </div>

          <p className="mt-8 text-center text-xs text-slate-500">
            Don't have access? <a href="#" className="text-indigo-400 font-bold hover:underline">Request an internal account</a>
          </p>
        </div>
      </div>
    </div>
  )
}
