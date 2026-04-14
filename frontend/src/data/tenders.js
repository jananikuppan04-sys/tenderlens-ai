// ────────────────────────────────────────────────────────────────
//  TenderLens AI — Synthetic Procurement Dataset (100 tenders)
// ────────────────────────────────────────────────────────────────

const DEPARTMENTS = ['Ministry of Infrastructure', 'Health Department', 'Defence Procurement', 'Smart Cities Mission', 'Education Bureau', 'Energy & Power', 'Agriculture Ministry', 'Urban Development', 'Rural Development', 'IT & Digital']
const CATEGORIES  = ['Construction', 'IT Services', 'Medical Supplies', 'Consulting', 'Equipment', 'Transportation', 'Software Development', 'Security Services', 'Maintenance', 'Research & Development']
const VENDOR_POOL = [
  'Apex Infrastructure Ltd', 'NovaTech Solutions', 'BlueHorizon Consulting',
  'FusionBuild Corp', 'Stellar Engineering', 'Meridian Systems',
  'Cascade Technologies', 'Vanguard Supplies', 'Titan Procurement Co.',
  'Nexus IT Group', 'Pinnacle Works', 'Lumencraft Industries',
  'JetStream Solutions', 'ZeroPoint Engineering', 'AlphaCore Systems',
  'Stratos Consulting', 'Orbit Technologies', 'Crest Builders',
  'Vertex Solutions', 'Quantum Services', 'HorizonWorks Ltd',
  'Pacific Infra Group', 'Delta Force Supply', 'Ironclad Solutions',
  'StormBridge Corp', 'NorthStar Consulting', 'SilverEdge Systems',
  'EcoTech Builders', 'TrueNorth Engineering', 'Matrix Procurement',
]

const rnd  = (min, max) => Math.random() * (max - min) + min
const rndI = (min, max) => Math.floor(rnd(min, max))
const pick = arr => arr[rndI(0, arr.length)]

function shuffled(arr) {
  const a = [...arr]; for (let i = a.length - 1; i > 0; i--) { const j = rndI(0, i + 1);[a[i], a[j]] = [a[j], a[i]] } return a
}

function generateTender(id, dateOffset = 0) {
  const category  = pick(CATEGORIES)
  const dept      = pick(DEPARTMENTS)
  const nVendors  = rndI(3, 8)
  const vendors   = shuffled(VENDOR_POOL).slice(0, nVendors)
  const basePrice = rnd(500000, 50000000)

  // Introduce collusion patterns in some tenders
  const isColluded = Math.random() < 0.22
  const bids = vendors.map((_, i) => {
    if (isColluded && i > 0) {
      return +(basePrice * rnd(1.01, 1.08)).toFixed(0)
    }
    return +(basePrice * rnd(0.72, 1.35)).toFixed(0)
  })

  const winIdx      = bids.indexOf(Math.min(...bids))
  const fairPrice   = +(basePrice * rnd(0.88, 1.05)).toFixed(0)
  const winBid      = bids[winIdx]
  const priceDev    = +(((winBid - fairPrice) / fairPrice) * 100).toFixed(2)
  const hhi         = isColluded ? rnd(4500, 9000) : rnd(800, 3500)

  // Composite risk score
  const hhiRisk     = Math.min(100, (hhi / 10000) * 100)
  const priceRisk   = Math.min(100, Math.abs(priceDev) * 2.2)
  const networkRisk = isColluded ? rnd(55, 90) : rnd(10, 45)
  const winnerRisk  = nVendors < 4 ? rnd(40, 75) : rnd(5, 35)
  const riskScore   = +((hhiRisk * 0.3 + priceRisk * 0.25 + networkRisk * 0.25 + winnerRisk * 0.2)).toFixed(1)

  const now  = new Date()
  const date = new Date(now - dateOffset * 86400000 * 1000)

  return {
    tender_id:       `TND-${1001 + id}`,
    department:      dept,
    category,
    vendors,
    bid_values:      bids,
    winning_vendor:  vendors[winIdx],
    winning_bid:     winBid,
    fair_price:      fairPrice,
    estimated_value: +(basePrice).toFixed(0),
    risk_score:      riskScore,
    price_deviation: priceDev,
    hhi:             +hhi.toFixed(0),
    hhi_label:       hhi < 1500 ? 'Competitive' : hhi < 2500 ? 'Moderate' : 'Concentrated',
    is_colluded:     isColluded,
    network_risk:    +networkRisk.toFixed(1),
    winner_risk:     +winnerRisk.toFixed(1),
    price_risk:      +priceRisk.toFixed(1),
    hhi_risk:        +hhiRisk.toFixed(1),
    fairness_score:  +(100 - riskScore).toFixed(1),
    risk_label:      riskScore >= 65 ? 'High' : riskScore >= 35 ? 'Medium' : 'Low',
    n_vendors:       nVendors,
    date:            date.toISOString().split('T')[0],
    timestamp:       date.toISOString(),
    director_shared: isColluded && Math.random() < 0.55,
  }
}

// Generate stable 100-tender dataset
let _cache = null
export function generateDataset() {
  if (_cache) return _cache
  const tenders = Array.from({ length: 100 }, (_, i) => generateTender(i, Math.random()))
  tenders.sort((a, b) => new Date(b.date) - new Date(a.date))
  _cache = tenders
  return tenders
}

// Vendor risk aggregation
export function computeVendorRisks(tenders) {
  const map = {}
  tenders.forEach(t => {
    const winner = t.winning_vendor
    if (!map[winner]) map[winner] = { wins: 0, totalRisk: 0, count: 0, tenders: [] }
    map[winner].wins++
    map[winner].totalRisk += t.risk_score
    map[winner].tenders.push(t.tender_id)

    t.vendors.forEach(v => {
      if (!map[v]) map[v] = { wins: 0, totalRisk: 0, count: 0, tenders: [] }
      map[v].count++
      if (!map[v].tenders.includes(t.tender_id)) map[v].tenders.push(t.tender_id)
    })
  })
  return Object.entries(map).map(([name, d]) => ({
    company_name:  name,
    total_bids:    d.count || d.wins,
    tenders_won:   d.wins,
    win_rate:      d.count > 0 ? +((d.wins / (d.count || 1)) * 100).toFixed(1) : 0,
    avg_risk_score: d.wins > 0 ? +(d.totalRisk / d.wins).toFixed(1) : +(Math.random() * 40 + 10).toFixed(1),
    risk_label:    d.totalRisk / (d.wins || 1) >= 65 ? 'High' : d.totalRisk / (d.wins || 1) >= 35 ? 'Medium' : 'Low',
    suspicion_flag: d.wins > 3 || (d.totalRisk / (d.wins || 1)) > 65,
    tender_ids:    d.tenders,
  })).sort((a, b) => b.avg_risk_score - a.avg_risk_score)
}

// Simulated real-time ticker mutations
export function mutateTender(tender) {
  const delta = (Math.random() - 0.5) * 6
  const newScore = Math.max(0, Math.min(100, tender.risk_score + delta))
  return {
    ...tender,
    risk_score:     +newScore.toFixed(1),
    fairness_score: +(100 - newScore).toFixed(1),
    risk_label:     newScore >= 65 ? 'High' : newScore >= 35 ? 'Medium' : 'Low',
    price_deviation: +(tender.price_deviation + (Math.random() - 0.5) * 2).toFixed(2),
  }
}

// Summary statistics
export function getSummaryStats(tenders) {
  const highRisk  = tenders.filter(t => t.risk_label === 'High')
  const avgDev    = tenders.reduce((s, t) => s + Math.abs(t.price_deviation), 0) / tenders.length
  const avgFair   = tenders.reduce((s, t) => s + t.fairness_score, 0) / tenders.length
  return {
    total:          tenders.length,
    high_risk:      highRisk.length,
    high_risk_pct:  +((highRisk.length / tenders.length) * 100).toFixed(1),
    avg_deviation:  +avgDev.toFixed(1),
    fairness_index: +avgFair.toFixed(1),
  }
}

// Trend data (last 12 months)
export function getTrendData(tenders) {
  const months = {}
  tenders.forEach(t => {
    const mo = t.date.slice(0, 7)
    if (!months[mo]) months[mo] = { month: mo, avg_risk: 0, count: 0, high: 0 }
    months[mo].avg_risk += t.risk_score
    months[mo].count++
    if (t.risk_label === 'High') months[mo].high++
  })
  return Object.values(months)
    .map(m => ({ ...m, avg_risk: +(m.avg_risk / m.count).toFixed(1), fairness: +(100 - m.avg_risk / m.count).toFixed(1) }))
    .sort((a, b) => a.month.localeCompare(b.month))
    .slice(-12)
}

// Department aggregation
export function getDeptData(tenders) {
  const map = {}
  tenders.forEach(t => {
    if (!map[t.department]) map[t.department] = { dept: t.department, total: 0, risk_sum: 0 }
    map[t.department].total++
    map[t.department].risk_sum += t.risk_score
  })
  return Object.values(map)
    .map(d => ({ dept: d.dept.replace('Ministry of ', 'Min. of ').replace(' Department', ' Dept'), avg_risk: +(d.risk_sum / d.total).toFixed(1), total: d.total }))
    .sort((a, b) => b.avg_risk - a.avg_risk)
}

// Network graph edges
export function getNetworkEdges(tenders) {
  const shared = {}
  tenders.forEach(t => {
    for (let i = 0; i < t.vendors.length; i++) {
      for (let j = i + 1; j < t.vendors.length; j++) {
        const key = [t.vendors[i], t.vendors[j]].sort().join('||')
        if (!shared[key]) shared[key] = { source: t.vendors[i], target: t.vendors[j], weight: 0, colluded: 0 }
        shared[key].weight++
        if (t.is_colluded) shared[key].colluded++
      }
    }
  })
  return Object.values(shared).filter(e => e.weight >= 2)
}
