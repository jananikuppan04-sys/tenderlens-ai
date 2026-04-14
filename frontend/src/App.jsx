import React, { useState } from 'react'
import { AppProvider, useApp } from './context/AppContext'
import Sidebar from './components/Sidebar'
import TopBar from './components/TopBar'
import ToastContainer from './components/ToastContainer'
import Dashboard from './tabs/Dashboard'
import VendorNetwork from './tabs/VendorNetwork'
import PriceIntelligence from './tabs/PriceIntelligence'
import TenderConclusion from './tabs/TenderConclusion'
import LiveSimulator from './tabs/LiveSimulator'
import LandingPage from './pages/LandingPage'
import LoginPage from './pages/LoginPage'
import TenderLensLogo from './components/Logo'
import ProfileModals from './components/ProfileModals'

function LoadingScreen() {
  return (
    <div className="fixed inset-0 z-[200] bg-navy-950 flex flex-col items-center justify-center gap-6">
      <div className="relative">
        <TenderLensLogo size={72} />
        <div className="absolute -inset-5 rounded-3xl border border-indigo-500/20 animate-ping" />
      </div>
      <div className="text-center">
        <h2 className="text-lg font-bold text-white">
          <span>TENDER</span><span className="text-indigo-400">LENS</span> AI
        </h2>
        <p className="text-xs text-slate-500 mt-1 tracking-wider uppercase">Initializing procurement intelligence…</p>
      </div>
      <div className="w-48 h-1 rounded-full bg-white/5 overflow-hidden">
        <div className="h-full rounded-full bg-gradient-to-r from-indigo-600 to-indigo-400 animate-pulse" style={{ width: '60%' }} />
      </div>
    </div>
  )
}

const TABS = {
  dashboard:  Dashboard,
  network:    VendorNetwork,
  pricing:    PriceIntelligence,
  conclusion: TenderConclusion,
  simulator:  LiveSimulator,
}

function AppContent() {
  const { activeTab, sidebarOpen, isLoading, isAuthenticated } = useApp()
  const [page, setPage] = useState('landing') // 'landing' | 'login'

  if (isLoading) return <LoadingScreen />

  if (!isAuthenticated) {
    if (page === 'login') return <LoginPage onExit={() => setPage('landing')} />
    return <LandingPage onGetStarted={() => setPage('login')} />
  }

  const ActivePage = TABS[activeTab] || Dashboard

  return (
    <div className="min-h-screen bg-navy-950">
      <Sidebar />
      <TopBar />
      <ToastContainer />
      <ProfileModals />

      <main
        className={`
          pt-20 pb-8 px-6 transition-all duration-300
          ${sidebarOpen ? 'ml-64' : 'ml-16'}
        `}
      >
        <ActivePage />
      </main>
    </div>
  )
}

export default function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  )
}
