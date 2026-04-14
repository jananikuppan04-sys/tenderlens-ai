import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react'
import { generateDataset, computeVendorRisks, getSummaryStats, getTrendData, getDeptData, getNetworkEdges, mutateTender } from '../data/tenders'

const AppContext = createContext(null)

export function AppProvider({ children }) {
  // ── Authentication ───────────────────────────────────────────
  const [user, setUser] = useState(null)
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  const login = (userData) => {
    setIsLoading(true)
    // Simulate API delay
    setTimeout(() => {
      setUser(userData)
      setIsAuthenticated(true)
      setIsLoading(false)
      addToast({ type: 'success', title: 'Welcome back', body: `Signed in as ${userData.name}` })
    }, 1000)
  }

  const logout = () => {
    setUser(null)
    setIsAuthenticated(false)
    setActiveTab('dashboard')
    addToast({ type: 'info', title: 'Signed out', body: 'You have been successfully logged out' })
  }

  // ── Dataset ──────────────────────────────────────────────────

  const [allTenders, setAllTenders]   = useState([])
  const [vendorRisks, setVendorRisks] = useState([])
  const [notifications, setNotifications] = useState([])
  const [toasts, setToasts]           = useState([])
  const toastIdRef                    = useRef(0)

  // ── Filters ───────────────────────────────────────────────────
  const [filterDept, setFilterDept]   = useState('All')
  const [filterCat,  setFilterCat]    = useState('All')
  const [filterDate, setFilterDate]   = useState({ from: '', to: '' })
  const [search,     setSearch]       = useState('')

  // ── Navigation ────────────────────────────────────────────────
  const [activeTab, setActiveTab]     = useState('dashboard')
  const [sidebarOpen, setSidebarOpen] = useState(true)

  // ── Selection ─────────────────────────────────────────────────
  const [selectedTender, setSelectedTender] = useState(null)
  const [selectedVendor, setSelectedVendor] = useState(null)

  // ── Loading ───────────────────────────────────────────────────
  const [isLoading, setIsLoading]     = useState(true)

  // ── Live Mode Toggle ──────────────────────────────────────────
  const [liveMode, setLiveMode]       = useState(true)

  // ── Theme Toggle ──────────────────────────────────────────────
  const [theme, setTheme]             = useState('dark') // 'dark' | 'light'
  const toggleTheme = useCallback(() => {
    setTheme(t => {
      const next = t === 'dark' ? 'light' : 'dark'
      document.documentElement.classList.toggle('light', next === 'light')
      return next
    })
  }, [])

  // ── Profile Panel ─────────────────────────────────────────────
  const [profilePanel, setProfilePanel] = useState(null) // null | 'settings' | 'logs' | 'api'

  // Bootstrap dataset
  useEffect(() => {
    setIsLoading(true)
    setTimeout(() => {
      const data = generateDataset()
      setAllTenders(data)
      setVendorRisks(computeVendorRisks(data))
      setSelectedTender(data[0])
      // seed notifications with high-risk tenders
      const highRisk = data.filter(t => t.risk_label === 'High').slice(0, 5)
      setNotifications(highRisk.map((t, i) => ({
        id: i, tender_id: t.tender_id, dept: t.department,
        message: `High risk detected in ${t.tender_id}`,
        risk: t.risk_score, read: false,
        time: t.date,
      })))
      setIsLoading(false)
    }, 800)
  }, [])

  // ── Real-time simulation (every 4s) ───────────────────────────
  useEffect(() => {
    if (isLoading || !liveMode) return
    const tick = setInterval(() => {
      setAllTenders(prev => {
        const idx = Math.floor(Math.random() * prev.length)
        const updated = [...prev]
        const old     = updated[idx]
        const fresh   = mutateTender(old)
        updated[idx]  = fresh
        // fire toast if risk crossed High threshold
        if (old.risk_label !== 'High' && fresh.risk_label === 'High') {
          addToast({ type: 'danger', title: 'High Risk Detected', body: `${fresh.tender_id} — ${fresh.department}` })
          setNotifications(n => [
            { id: Date.now(), tender_id: fresh.tender_id, dept: fresh.department,
              message: `Risk escalated on ${fresh.tender_id}`, risk: fresh.risk_score, read: false, time: new Date().toISOString().split('T')[0] },
            ...n.slice(0, 19),
          ])
        } else if (Math.random() < 0.07) {
          addToast({ type: 'warning', title: 'Suspicious Pattern', body: `Vendor activity flagged on ${fresh.tender_id}` })
        }
        return updated
      })
    }, 4000)
    return () => clearInterval(tick)
  }, [isLoading, liveMode])

  // Re-compute vendor risks when tenders change
  useEffect(() => {
    if (allTenders.length) setVendorRisks(computeVendorRisks(allTenders))
  }, [allTenders])

  // ── Toast helpers ─────────────────────────────────────────────
  const addToast = useCallback(({ type, title, body }) => {
    const id = ++toastIdRef.current
    setToasts(t => [...t, { id, type, title, body, exiting: false }])
    setTimeout(() => {
      setToasts(t => t.map(x => x.id === id ? { ...x, exiting: true } : x))
      setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 350)
    }, 4500)
  }, [])

  const dismissToast = useCallback(id => {
    setToasts(t => t.map(x => x.id === id ? { ...x, exiting: true } : x))
    setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 350)
  }, [])

  // ── Filtered dataset ──────────────────────────────────────────
  const tenders = allTenders.filter(t => {
    if (filterDept !== 'All' && t.department !== filterDept) return false
    if (filterCat  !== 'All' && t.category !== filterCat)   return false
    if (filterDate.from && t.date < filterDate.from)         return false
    if (filterDate.to   && t.date > filterDate.to)           return false
    if (search) {
      const q = search.toLowerCase()
      return t.tender_id.toLowerCase().includes(q) || t.winning_vendor.toLowerCase().includes(q) ||
             t.vendors.some(v => v.toLowerCase().includes(q))
    }
    return true
  })

  const summaryStats  = getSummaryStats(tenders)
  const trendData     = getTrendData(tenders)
  const deptData      = getDeptData(tenders)
  const networkEdges  = getNetworkEdges(tenders)

  const departments = ['All', ...new Set(allTenders.map(t => t.department))].sort()
  const categories  = ['All', ...new Set(allTenders.map(t => t.category))].sort()

  const markAllRead = useCallback(() =>
    setNotifications(n => n.map(x => ({ ...x, read: true }))), [])

  return (
    <AppContext.Provider value={{
      tenders, allTenders, vendorRisks, isLoading,
      summaryStats, trendData, deptData, networkEdges,
      filterDept, setFilterDept, filterCat, setFilterCat,
      filterDate, setFilterDate, search, setSearch,
      departments, categories,
      activeTab, setActiveTab,
      sidebarOpen, setSidebarOpen,
      selectedTender, setSelectedTender,
      selectedVendor, setSelectedVendor,
      notifications, markAllRead,
      toasts, addToast, dismissToast,
      user, isAuthenticated, login, logout,
      liveMode, setLiveMode,
      theme, toggleTheme,
      profilePanel, setProfilePanel,
    }}>
      {children}
    </AppContext.Provider>
  )
}

export const useApp = () => useContext(AppContext)
