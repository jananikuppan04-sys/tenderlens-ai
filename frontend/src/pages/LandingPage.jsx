import React from 'react'
import { ArrowRight, Network, TrendingUp, Zap, Globe } from 'lucide-react'
import { TenderLensWordmark } from '../components/Logo'

export default function LandingPage({ onGetStarted }) {
  return (
    <div className="min-h-screen bg-navy-950 text-white overflow-hidden relative">
      {/* Background Glows */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-600/10 blur-[120px] rounded-full" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-600/10 blur-[120px] rounded-full" />

      {/* Nav */}
      <nav className="relative z-10 flex items-center justify-between px-8 py-6 max-w-7xl mx-auto">
        <TenderLensWordmark size={40} showSubtitle={false} />
        <div className="hidden md:flex items-center gap-8">
          {['Solutions', 'Technology', 'Network', 'Pricing'].map(item => (
            <a key={item} href="#" className="text-sm font-medium text-slate-400 hover:text-white transition-colors">{item}</a>
          ))}
        </div>
        <button 
          onClick={onGetStarted}
          className="btn-primary"
        >
          Access Portal
        </button>
      </nav>

      {/* Hero Section */}
      <section className="relative z-10 pt-20 pb-32 px-6 max-w-7xl mx-auto text-center">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full glass border border-indigo-500/20 mb-8 animate-fade-in">
          <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
          <span className="text-[11px] font-bold uppercase tracking-widest text-indigo-400">V2.0 Now Live — Enterprise Ready</span>
        </div>
        
        <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight mb-8 leading-[1.1] animate-slide-up">
          Unmask Civil Corruption with <br />
          <span className="text-gradient">Predictive Intelligence.</span>
        </h1>
        
        <p className="text-lg md:text-xl text-slate-400 max-w-3xl mx-auto mb-12 animate-slide-up [animation-delay:100ms]">
          The world's first AI-powered procurement audit platform. Detect bid rigging, 
          collusive networks, and pricing anomalies before they drain public funds.
        </p>
        
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-slide-up [animation-delay:200ms]">
          <button 
            onClick={onGetStarted}
            className="btn-primary text-base px-8 py-3.5 flex items-center gap-2 group"
          >
            Get Started <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
          </button>
          <button className="btn-secondary text-base px-8 py-3.5">
            Book a Demo
          </button>
        </div>

        {/* Floating Metrics Mockup */}
        <div className="mt-24 relative max-w-5xl mx-auto animate-slide-up [animation-delay:400ms]">
          <div className="glass rounded-3xl border border-white/10 p-4 shadow-2xl relative">
            <div className="absolute -top-6 -right-6 glass rounded-2xl p-4 border border-indigo-500/30 shadow-xl hidden lg:block">
              <div className="text-[10px] uppercase font-bold text-slate-500 mb-1">Risk Detected</div>
              <div className="text-xl font-bold text-red-400">92.4%</div>
              <div className="mt-1 h-1 w-20 bg-red-500/20 rounded-full">
                <div className="h-full w-[92%] bg-red-500 rounded-full" />
              </div>
            </div>
            <div className="absolute -bottom-6 -left-6 glass rounded-2xl p-4 border border-emerald-500/30 shadow-xl hidden lg:block text-left">
              <div className="text-[10px] uppercase font-bold text-slate-500 mb-1">Savings Forecast</div>
              <div className="text-xl font-bold text-emerald-400">₹42.8M</div>
              <div className="text-[10px] text-slate-400 text-nowrap">Recovery in last 3 months</div>
            </div>
            <img 
              src="https://images.unsplash.com/photo-1551288049-bbda4833effb?auto=format&fit=crop&q=80&w=2000" 
              alt="Dashboard Preview" 
              className="rounded-2xl w-full opacity-60 grayscale hover:grayscale-0 transition-all duration-700"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-navy-950 via-transparent to-transparent rounded-2xl" />
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="relative z-10 py-24 px-6 max-w-7xl mx-auto border-t border-white/[0.05]">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            { 
              icon: Network, 
              title: 'Network Intelligence', 
              desc: 'Uncover hidden cartel connections and shared board memberships using autonomous graph analysis.' 
            },
            { 
              icon: TrendingUp, 
              title: 'Price Anomaly Engine', 
              desc: 'Compare every bid against predicted fair value to identify extreme outliers instantly.' 
            },
            { 
              icon: Zap, 
              title: 'Real-time Simulation', 
              desc: 'Predict winner probabilities and risk vectors before the official award ceremony.' 
            }
          ].map((f, i) => (
            <div key={i} className="glass rounded-2xl p-8 hover:bg-white/[0.03] transition-all group">
              <div className="w-12 h-12 rounded-xl bg-indigo-500/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <f.icon className="text-indigo-400" size={24} />
              </div>
              <h3 className="text-xl font-bold mb-3">{f.title}</h3>
              <p className="text-slate-400 text-sm leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 py-12 px-8 border-t border-white/[0.05] max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-2">
          <TenderLensWordmark size={36} showSubtitle={true} />
            <span className="text-slate-600 text-[10px] ml-2">© 2026 Procurement Intelligence Corp</span>
          </div>
          <div className="flex items-center gap-6">
            <Globe size={14} className="text-slate-500" />
            <div className="flex gap-4">
              <span className="text-[10px] uppercase font-bold text-slate-500 hover:text-slate-300 cursor-pointer">Security</span>
              <span className="text-[10px] uppercase font-bold text-slate-500 hover:text-slate-300 cursor-pointer">Terms</span>
              <span className="text-[10px] uppercase font-bold text-slate-500 hover:text-slate-300 cursor-pointer">Privacy</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
