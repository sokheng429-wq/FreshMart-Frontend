import React, { useState, useMemo, useEffect } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useLanguage } from '../../context/LanguageContext'
import {
  adminShipmentAPI,
  adminReturnShipmentAPI,
  adminSaleInvoiceAPI,
  adminSaleOrderAPI,
  adminTransferAPI,
} from '../../api/api'

// 3D & System Icons
import travelIcon from '../../assets/icon/3dicons-travel-dynamic-color.png'
import backwardIcon from '../../assets/icon/3dicons-backward-dynamic-color.png'
import moneyBagIcon from '../../assets/icon/3dicons-money-bag-dynamic-color.png'
import cubeIcon from '../../assets/icon/3dicons-cube-dynamic-color.png'
import clockIcon from '../../assets/icon/3dicons-clock-dynamic-color.png'
import fileTextIcon from '../../assets/icon/3dicons-file-text-dynamic-color.png'
import creditCardIcon from '../../assets/icon/3dicons-credit-card-dynamic-color.png'
import dollarIcon from '../../assets/icon/3dicons-dollar-dynamic-color.png'
import targetIcon from '../../assets/icon/3dicons-target-dynamic-color.png'
import walletIcon from '../../assets/icon/3dicons-wallet-dynamic-color.png'
import './ProductsHub.css'

// EXACT 3 CONSIGNMENT MODULES
export const ALL_CONSIGNMENT_MODULES = [
  {
    key: 'consignment-shipment',
    icon: travelIcon,
    en: 'Consignment',
    kh: 'ការដឹកជញ្ជូនបញ្ញើ',
    descEn: 'Issue and dispatch goods to third-party vendor stores on consignment basis.',
    descKh: 'ចេញ និងបញ្ជូនទំនិញទៅកាន់ហាងដៃគូលក់បញ្ញើ។',
    color: '#a855f7',
    bg: 'rgba(168, 85, 247, 0.12)',
    category: 'shipment',
    tag: 'Core',
    route: '/admin/consignments',
  },
  {
    key: 'return-shipment-consignment',
    icon: backwardIcon,
    en: 'Return Shipment',
    kh: 'ការប្រគល់ទំនិញបញ្ញើត្រឡប់',
    descEn: 'Receive unsold or expired consignment inventory back into central stock.',
    descKh: 'ទទួលទំនិញដែលលក់មិនទាន់អស់ ឬផុតកំណត់ត្រឡប់មកស្តុកកណ្តាល។',
    color: '#ef4444',
    bg: 'rgba(239, 68, 68, 0.12)',
    category: 'return',
    tag: 'Returns',
    route: '/admin/return-shipment-consignment',
  },
  {
    key: 'consignment-settlement',
    icon: moneyBagIcon,
    en: 'Shipment',
    kh: 'ការដឹកជញ្ជូនបញ្ញើ',
    descEn: 'Audit partner sold stock reports and compute periodic revenue splits.',
    descKh: 'ផ្ទៀងផ្ទាត់របាយការណ៍លក់ និងគណនាចំណែកប្រាក់ចំណូលតាមកាលកំណត់។',
    color: '#77BC1F',
    bg: 'rgba(119, 188, 31, 0.12)',
    category: 'settlement',
    tag: 'Settlement',
    route: '/admin/shipment',
  },
]

// Number and Currency Formatters
function formatCurrency(amount) {
  const val = Number(amount || 0)
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(val)
}

function formatNumber(val) {
  return new Intl.NumberFormat('en-US').format(Number(val || 0))
}

function ChevronLeftIcon() {
  return (
    <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
      <path d="M15 19l-7-7 7-7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function ChevronIcon() {
  return (
    <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
      <path d="M9 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

export default function ConsignmentManagement() {
  const { lang } = useLanguage()
  const navigate = useNavigate()
  const location = useLocation()

  const [searchQuery, setSearchQuery] = useState('')
  const [activeCategory, setActiveCategory] = useState('all')

  // Chart States:
  // 'compare' (Consignment Value vs Invoiced Amount) | 'consignmentValue' | 'invoicedAmount' | 'shippedAmount' | 'returnAmount' | 'pendingPayment' | 'orders'
  const [chartOption, setChartOption] = useState('compare')
  const [chartMetric, setChartMetric] = useState('amount') // 'amount' vs 'volume'
  const [hoveredPoint, setHoveredPoint] = useState(null)
  const [isLoadingData, setIsLoadingData] = useState(false)

  // Calendar month context
  const monthContext = useMemo(() => {
    const today = new Date()
    const year = today.getFullYear()
    const month = today.getMonth()
    const daysInMonth = new Date(year, month + 1, 0).getDate()
    const currentDay = today.getDate()

    const monthNamesEn = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ]
    const monthNamesKh = [
      'មករា', 'កុម្ភៈ', 'មីនា', 'មេសា', 'ឧសភា', 'មិថុនា',
      'កក្កដា', 'សីហា', 'កញ្ញា', 'តុលា', 'វិច្ឆិកា', 'ធ្នូ'
    ]

    return {
      year,
      month,
      daysInMonth,
      currentDay,
      monthNameEn: monthNamesEn[month],
      monthNameKh: monthNamesKh[month],
      labelEn: `${monthNamesEn[month]} ${year}`,
      labelKh: `${monthNamesKh[month]} ${year}`,
    }
  }, [])

  // Live database state (defaults strictly to 0)
  const [liveData, setLiveData] = useState({
    shipments: [],
    returnShipments: [],
    invoices: [],
    saleOrders: [],
    loaded: false,
  })

  // Fetch real consignment-related live data from backend APIs
  useEffect(() => {
    let isMounted = true
    setIsLoadingData(true)

    Promise.all([
      adminShipmentAPI.getAll().catch(() => []),
      adminTransferAPI.getAll().catch(() => []),
      adminReturnShipmentAPI.getAll().catch(() => []),
      adminSaleInvoiceAPI.getAll().catch(() => []),
      adminSaleOrderAPI.getAll().catch(() => []),
    ])
      .then(([shipRes, transRes, retRes, invRes, soRes]) => {
        if (!isMounted) return
        const parseList = (res) => (Array.isArray(res?.data) ? res.data : Array.isArray(res) ? res : [])

        const shipments = parseList(shipRes).length > 0 ? parseList(shipRes) : parseList(transRes)
        const returnShipments = parseList(retRes)
        const invoices = parseList(invRes)
        const saleOrders = parseList(soRes)

        setLiveData({
          shipments,
          returnShipments,
          invoices,
          saleOrders,
          loaded: true,
        })
        setIsLoadingData(false)
      })
      .catch(() => {
        if (isMounted) {
          setIsLoadingData(false)
          setLiveData((prev) => ({ ...prev, loaded: true }))
        }
      })

    return () => {
      isMounted = false
    }
  }, [])

  // Build day-by-day dataset for ALL days of CURRENT month (defaults strictly to 0)
  const monthlyTimeline = useMemo(() => {
    const { year, month, daysInMonth, currentDay } = monthContext
    const days = []

    for (let day = 1; day <= daysInMonth; day++) {
      const d = new Date(year, month, day)
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
      const dayName = d.toLocaleDateString('en-US', { weekday: 'short' })
      const dayNameKhMap = { Sun: 'អាទិត្យ', Mon: 'ច័ន្ទ', Tue: 'អង្គារ', Wed: 'ពុធ', Thu: 'ព្រហ', Fri: 'សុក្រ', Sat: 'សៅរ៍' }
      const dayNameKh = dayNameKhMap[dayName] || dayName

      const matchDay = (item) => {
        const rawDate = item.shipmentDate || item.returnDate || item.invoiceDate || item.date || item.createdAt || ''
        return rawDate.slice(0, 10) === dateStr
      }

      const dayShips = (liveData.shipments || []).filter(matchDay)
      const dayReturns = (liveData.returnShipments || []).filter(matchDay)
      const dayInvoices = (liveData.invoices || []).filter(matchDay)

      // Live stream calculations (strictly 0 if empty)
      const shipAmount = Math.round(dayShips.reduce((sum, s) => sum + Number(s.amount || s.grandTotal || 0), 0) * 100) / 100
      const shipCount = dayShips.length

      const returnAmount = Math.round(dayReturns.reduce((sum, r) => sum + Number(r.amount || r.grandTotal || 0), 0) * 100) / 100
      const returnCount = dayReturns.length

      const invoicedAmount = Math.round(dayInvoices.reduce((sum, i) => sum + Number(i.grandTotal || i.total || 0), 0) * 100) / 100
      const invoiceCount = dayInvoices.length

      // Consignment Value = dispatched consignment inventory on floor
      const consignmentValue = shipAmount
      const pendingPayment = Math.max(0, consignmentValue - invoicedAmount)
      const pendingPickups = dayShips.filter((s) => s.status === 'Pending' || s.status === 'Processing').length

      days.push({
        day,
        dateStr,
        dayName,
        dayNameKh,
        formattedDateEn: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        formattedDateKh: `${day} ${monthContext.monthNameKh}`,
        isToday: day === currentDay,
        isPast: day <= currentDay,
        isFuture: day > currentDay,
        consignmentValue,
        invoicedAmount,
        shippedAmount: shipAmount,
        returnAmount,
        pendingPayment,
        ordersCount: shipCount + returnCount,
        pendingPickups,
      })
    }

    return days
  }, [monthContext, liveData])

  // Aggregate The 7 Top KPIs for Current Month (Starts strictly at 0)
  const kpis = useMemo(() => {
    let totalOrders = 0
    let pendingPickups = 0
    let consignmentValue = 0
    let shippedAmount = 0
    let invoicedAmount = 0
    let returnAmount = 0
    let pendingPayment = 0

    monthlyTimeline.forEach((d) => {
      totalOrders += d.ordersCount
      pendingPickups += d.pendingPickups
      consignmentValue += d.consignmentValue
      shippedAmount += d.shippedAmount
      invoicedAmount += d.invoicedAmount
      returnAmount += d.returnAmount
      pendingPayment += d.pendingPayment
    })

    return {
      totalOrders,
      pendingPickups,
      consignmentValue: Math.round(consignmentValue * 100) / 100,
      shippedAmount: Math.round(shippedAmount * 100) / 100,
      invoicedAmount: Math.round(invoicedAmount * 100) / 100,
      returnAmount: Math.round(returnAmount * 100) / 100,
      pendingPayment: Math.round(pendingPayment * 100) / 100,
    }
  }, [monthlyTimeline])

  // SVG Chart Geometry and Bézier Path Generator
  const chartConfig = useMemo(() => {
    const width = 940
    const height = 300
    const padding = { top: 35, right: 35, bottom: 45, left: 65 }
    const innerWidth = width - padding.left - padding.right
    const innerHeight = height - padding.top - padding.bottom

    let maxVal = 0
    monthlyTimeline.forEach((d) => {
      if (chartOption === 'compare') {
        if (d.consignmentValue > maxVal) maxVal = d.consignmentValue
        if (d.invoicedAmount > maxVal) maxVal = d.invoicedAmount
      } else if (chartOption === 'consignmentValue' && d.consignmentValue > maxVal) {
        maxVal = d.consignmentValue
      } else if (chartOption === 'invoicedAmount' && d.invoicedAmount > maxVal) {
        maxVal = d.invoicedAmount
      } else if (chartOption === 'shippedAmount' && d.shippedAmount > maxVal) {
        maxVal = d.shippedAmount
      } else if (chartOption === 'returnAmount' && d.returnAmount > maxVal) {
        maxVal = d.returnAmount
      } else if (chartOption === 'pendingPayment' && d.pendingPayment > maxVal) {
        maxVal = d.pendingPayment
      } else if (chartOption === 'orders' && d.ordersCount > maxVal) {
        maxVal = d.ordersCount
      }
    })

    const yMax = maxVal > 0 ? Math.ceil(maxVal * 1.2) : (chartMetric === 'amount' ? 100 : 10)

    const mapPoints = (key) =>
      monthlyTimeline.map((d, i) => {
        const val = d[key] || 0
        const x = padding.left + (i / Math.max(1, monthlyTimeline.length - 1)) * innerWidth
        const y = padding.top + innerHeight - (val / yMax) * innerHeight
        return { ...d, value: val, x, y }
      })

    const generatePaths = (points) => {
      if (!points || points.length === 0) return { linePath: '', areaPath: '' }
      let linePath = `M ${points[0].x},${points[0].y}`
      for (let i = 0; i < points.length - 1; i++) {
        const current = points[i]
        const next = points[i + 1]
        const controlX = (current.x + next.x) / 2
        linePath += ` C ${controlX},${current.y} ${controlX},${next.y} ${next.x},${next.y}`
      }
      const baselineY = padding.top + innerHeight
      const areaPath = `${linePath} L ${points[points.length - 1].x},${baselineY} L ${points[0].x},${baselineY} Z`
      return { linePath, areaPath }
    }

    const valuePoints = mapPoints('consignmentValue')
    const invoicePoints = mapPoints('invoicedAmount')
    const shippedPoints = mapPoints('shippedAmount')
    const returnPoints = mapPoints('returnAmount')
    const paymentPoints = mapPoints('pendingPayment')
    const ordersPoints = mapPoints('ordersCount')

    return {
      width,
      height,
      padding,
      innerWidth,
      innerHeight,
      yMax,
      valuePoints,
      invoicePoints,
      shippedPoints,
      returnPoints,
      paymentPoints,
      ordersPoints,
      valuePaths: generatePaths(valuePoints),
      invoicePaths: generatePaths(invoicePoints),
      shippedPaths: generatePaths(shippedPoints),
      returnPaths: generatePaths(returnPoints),
      paymentPaths: generatePaths(paymentPoints),
      ordersPaths: generatePaths(ordersPoints),
      yTicks: [0, Math.round(yMax * 0.33), Math.round(yMax * 0.66), yMax],
    }
  }, [monthlyTimeline, chartOption, chartMetric])

  // Filtered module cards for search & pills
  const filteredModules = useMemo(() => {
    const q = searchQuery.trim().toLowerCase()
    let list = ALL_CONSIGNMENT_MODULES

    if (activeCategory !== 'all') {
      list = list.filter((s) => s.category === activeCategory)
    }

    if (!q) return list

    return list.filter((s) => {
      const en = (s.en || '').toLowerCase()
      const kh = (s.kh || '').toLowerCase()
      const descEn = (s.descEn || '').toLowerCase()
      const descKh = (s.descKh || '').toLowerCase()
      const key = (s.key || '').toLowerCase()
      return en.includes(q) || kh.includes(q) || descEn.includes(q) || descKh.includes(q) || key.includes(q)
    })
  }, [searchQuery, activeCategory])

  return (
    <div className="space-y-6 text-slate-100" style={{ fontFamily: 'Montserrat, sans-serif' }}>
      {/* 1. HERO BANNER */}
      <section className="relative overflow-hidden rounded-3xl border border-purple-500/20 bg-gradient-to-br from-[#1e293b] via-[#0f172a] to-[#0b0f17] p-5 sm:p-7 shadow-2xl shadow-purple-500/10">
        <div className="pointer-events-none absolute -right-16 -top-20 h-64 w-64 rounded-full bg-purple-500/15 blur-3xl" />
        <div className="pointer-events-none absolute bottom-0 left-1/4 h-px w-2/3 bg-gradient-to-r from-transparent via-purple-500/40 to-transparent" />

        <div className="relative flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-4">
            <Link
              to="/admin"
              className="inline-flex items-center gap-2 rounded-full border border-slate-700/80 bg-slate-950/60 px-3.5 py-1.5 text-xs font-bold uppercase tracking-[0.18em] text-purple-300 transition hover:border-purple-400 hover:text-white active:scale-95"
            >
              <ChevronLeftIcon /> {lang === 'en' ? 'Dashboard' : 'ផ្ទាំងគ្រប់គ្រង'}
            </Link>

            <div className="flex items-center gap-3.5">
              <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-purple-500/15 p-2 ring-1 ring-purple-500/30 shadow-lg shadow-purple-500/20">
                <img src={cubeIcon} alt="" className="h-9 w-9 object-contain drop-shadow-md" />
              </span>
              <div>
                <p className="text-[11px] font-black uppercase tracking-[0.25em] text-purple-400">
                  {lang === 'en' ? "FreshMart Vendor Consignments" : 'ការគ្រប់គ្រងទំនិញបញ្ញើ'}
                </p>
                <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
                  {lang === 'en' ? 'Consignment Management' : 'ការគ្រប់គ្រងការលក់បញ្ញើ'}
                </h1>
              </div>
            </div>

            <p className="max-w-2xl text-xs sm:text-sm leading-relaxed text-slate-300">
              {lang === 'en'
                ? 'Centralized executive control for off-site consignment inventory — track dispatch shipments, returns, sales splits, and monitor live performance across partner stores.'
                : 'ការគ្រប់គ្រងកណ្តាលសម្រាប់ស្តុកទំនិញបញ្ញើនៅក្រៅទីតាំង — តាមដានការដឹកជញ្ជូន ការប្រគល់ត្រឡប់ ការទូទាត់ និងតាមដានដំណើរការលក់ជាក់ស្តែង។'}
            </p>
          </div>

          {/* Quick Stats Widget */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-2 lg:flex lg:flex-col shrink-0 min-w-[220px]">
            <div className="rounded-2xl border border-slate-800 bg-slate-950/80 p-3.5 shadow-md">
              <div className="flex items-center justify-between text-[11px] text-slate-400">
                <span>{lang === 'en' ? 'Active Modules' : 'ម៉ូឌុលសកម្ម'}</span>
                <span className="text-purple-400 font-bold">● 3 Live</span>
              </div>
              <p className="mt-1 font-mono text-2xl font-black text-white">
                {ALL_CONSIGNMENT_MODULES.length}
              </p>
            </div>

            <div className="rounded-2xl border border-slate-800 bg-slate-950/80 p-3.5 shadow-md">
              <div className="flex items-center justify-between text-[11px] text-slate-400">
                <span>{lang === 'en' ? 'Settlement' : 'ការទូទាត់'}</span>
                <span className="text-emerald-400 font-bold">● Ready</span>
              </div>
              <p className="mt-1 font-mono text-xs font-semibold text-slate-300">
                Auto Reconciliation
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 2. THE 7 TOP KPI STAT CARDS */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-purple-500" />
            <h2 className="text-sm sm:text-base font-bold text-white uppercase tracking-wider">
              {lang === 'en' ? `Key Performance Indicators — ${monthContext.labelEn}` : `សូចនាករសំខាន់ៗ — ${monthContext.labelKh}`}
            </h2>
          </div>
          <span className="text-xs text-slate-400 font-mono">
            {lang === 'en' ? 'Click card to view on chart' : 'ចុចលើកាតដើម្បីមើលលើក្រាហ្វ'}
          </span>
        </div>

        <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7">
          {/* 1. TOTAL CONSIGNMENT ORDERS */}
          <button
            type="button"
            onClick={() => {
              setChartOption('orders')
              setChartMetric('volume')
            }}
            className={`group relative overflow-hidden rounded-2xl border p-4 text-left transition-all duration-300 hover:-translate-y-1 hover:shadow-xl active:scale-95 ${chartOption === 'orders'
              ? 'border-indigo-400 bg-gradient-to-br from-indigo-500/25 via-slate-900 to-slate-950 ring-2 ring-indigo-500/40 shadow-lg shadow-indigo-500/20'
              : 'border-slate-800 bg-slate-900/80 hover:border-indigo-500/50 hover:bg-slate-800/80'
              }`}
          >
            <div className="flex items-start justify-between gap-2">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-500/15 ring-1 ring-indigo-500/30">
                <img src={cubeIcon} alt="" className="h-6 w-6 object-contain drop-shadow" />
              </span>
              <span className="rounded-full bg-indigo-500/20 border border-indigo-500/30 px-2 py-0.5 text-[9px] font-black text-indigo-300 uppercase tracking-wider font-mono">
                Orders
              </span>
            </div>
            <div className="mt-3">
              <p className="text-xs font-semibold text-slate-400">
                {lang === 'en' ? 'Total Consignment Orders' : 'ការបញ្ជាទិញបញ្ញើសរុប'}
              </p>
              <p className="text-2xl font-black text-white mt-0.5 font-mono">
                {formatNumber(kpis.totalOrders)}
              </p>
              <div className="mt-2 text-[11px] border-t border-slate-800/80 pt-2 text-slate-400 truncate">
                {kpis.totalOrders} Total Consignment Orders
              </div>
            </div>
          </button>

          {/* 2. PENDING PICKUPS */}
          <button
            type="button"
            onClick={() => {
              setChartOption('orders')
              setChartMetric('volume')
            }}
            className="group relative overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/80 p-4 text-left transition-all duration-300 hover:-translate-y-1 hover:border-amber-500/50 hover:bg-slate-800/80 hover:shadow-xl active:scale-95"
          >
            <div className="flex items-start justify-between gap-2">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/15 ring-1 ring-amber-500/30">
                <img src={clockIcon} alt="" className="h-6 w-6 object-contain drop-shadow" />
              </span>
              <span className="rounded-full bg-amber-500/20 border border-amber-500/30 px-2 py-0.5 text-[9px] font-black text-amber-300 uppercase tracking-wider font-mono">
                Pickups
              </span>
            </div>
            <div className="mt-3">
              <p className="text-xs font-semibold text-slate-400">
                {lang === 'en' ? 'Pending Pickups' : 'រង់ចាំការមកយក'}
              </p>
              <p className="text-2xl font-black text-white mt-0.5 font-mono">
                {formatNumber(kpis.pendingPickups)}
              </p>
              <div className="mt-2 text-[11px] border-t border-slate-800/80 pt-2 text-slate-400 truncate">
                {kpis.pendingPickups} Pending Pickups
              </div>
            </div>
          </button>

          {/* 3. TOTAL CONSIGNMENT VALUE */}
          <button
            type="button"
            onClick={() => {
              setChartOption('consignmentValue')
              setChartMetric('amount')
            }}
            className={`group relative overflow-hidden rounded-2xl border p-4 text-left transition-all duration-300 hover:-translate-y-1 hover:shadow-xl active:scale-95 ${chartOption === 'consignmentValue'
              ? 'border-purple-400 bg-gradient-to-br from-purple-500/25 via-slate-900 to-slate-950 ring-2 ring-purple-500/40 shadow-lg shadow-purple-500/20'
              : 'border-slate-800 bg-slate-900/80 hover:border-purple-500/50 hover:bg-slate-800/80'
              }`}
          >
            <div className="flex items-start justify-between gap-2">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-500/15 ring-1 ring-purple-500/30">
                <img src={moneyBagIcon} alt="" className="h-6 w-6 object-contain drop-shadow" />
              </span>
              <span className="rounded-full bg-purple-500/20 border border-purple-500/30 px-2 py-0.5 text-[9px] font-black text-purple-300 uppercase tracking-wider font-mono">
                Value
              </span>
            </div>
            <div className="mt-3">
              <p className="text-xs font-semibold text-slate-400">
                {lang === 'en' ? 'Total Consignment Value' : 'តម្លៃទំនិញបញ្ញើសរុប'}
              </p>
              <p className="text-xl sm:text-2xl font-black text-white mt-0.5 font-mono truncate">
                {formatCurrency(kpis.consignmentValue)}
              </p>
              <div className="mt-2 text-[11px] border-t border-slate-800/80 pt-2 text-slate-400 truncate">
                {formatCurrency(kpis.consignmentValue)} Total Consignment Value
              </div>
            </div>
          </button>

          {/* 4. SHIPPED AMOUNT */}
          <button
            type="button"
            onClick={() => {
              setChartOption('shippedAmount')
              setChartMetric('amount')
            }}
            className={`group relative overflow-hidden rounded-2xl border p-4 text-left transition-all duration-300 hover:-translate-y-1 hover:shadow-xl active:scale-95 ${chartOption === 'shippedAmount'
              ? 'border-blue-400 bg-gradient-to-br from-blue-500/25 via-slate-900 to-slate-950 ring-2 ring-blue-500/40 shadow-lg shadow-blue-500/20'
              : 'border-slate-800 bg-slate-900/80 hover:border-blue-500/50 hover:bg-slate-800/80'
              }`}
          >
            <div className="flex items-start justify-between gap-2">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/15 ring-1 ring-blue-500/30">
                <img src={travelIcon} alt="" className="h-6 w-6 object-contain drop-shadow" />
              </span>
              <span className="rounded-full bg-blue-500/20 border border-blue-500/30 px-2 py-0.5 text-[9px] font-black text-blue-300 uppercase tracking-wider font-mono">
                Shipped
              </span>
            </div>
            <div className="mt-3">
              <p className="text-xs font-semibold text-slate-400">
                {lang === 'en' ? 'Shipped Amount' : 'ចំនួនទឹកប្រាក់ដឹកជញ្ជូន'}
              </p>
              <p className="text-xl sm:text-2xl font-black text-white mt-0.5 font-mono truncate">
                {formatCurrency(kpis.shippedAmount)}
              </p>
              <div className="mt-2 text-[11px] border-t border-slate-800/80 pt-2 text-slate-400 truncate">
                {formatCurrency(kpis.shippedAmount)} Shipped Amount
              </div>
            </div>
          </button>

          {/* 5. INVOICED AMOUNT */}
          <button
            type="button"
            onClick={() => {
              setChartOption('invoicedAmount')
              setChartMetric('amount')
            }}
            className={`group relative overflow-hidden rounded-2xl border p-4 text-left transition-all duration-300 hover:-translate-y-1 hover:shadow-xl active:scale-95 ${chartOption === 'invoicedAmount'
              ? 'border-emerald-400 bg-gradient-to-br from-emerald-500/25 via-slate-900 to-slate-950 ring-2 ring-emerald-500/40 shadow-lg shadow-emerald-500/20'
              : 'border-slate-800 bg-slate-900/80 hover:border-emerald-500/50 hover:bg-slate-800/80'
              }`}
          >
            <div className="flex items-start justify-between gap-2">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/15 ring-1 ring-emerald-500/30">
                <img src={fileTextIcon} alt="" className="h-6 w-6 object-contain drop-shadow" />
              </span>
              <span className="rounded-full bg-emerald-500/20 border border-emerald-500/30 px-2 py-0.5 text-[9px] font-black text-emerald-300 uppercase tracking-wider font-mono">
                Invoiced
              </span>
            </div>
            <div className="mt-3">
              <p className="text-xs font-semibold text-slate-400">
                {lang === 'en' ? 'Invoiced Amount' : 'ចំនួនទឹកប្រាក់វិក័យប័ត្រ'}
              </p>
              <p className="text-xl sm:text-2xl font-black text-white mt-0.5 font-mono truncate">
                {formatCurrency(kpis.invoicedAmount)}
              </p>
              <div className="mt-2 text-[11px] border-t border-slate-800/80 pt-2 text-slate-400 truncate">
                {formatCurrency(kpis.invoicedAmount)} Invoiced Amount
              </div>
            </div>
          </button>

          {/* 6. RETURN CONSIGNMENT AMOUNT */}
          <button
            type="button"
            onClick={() => {
              setChartOption('returnAmount')
              setChartMetric('amount')
            }}
            className={`group relative overflow-hidden rounded-2xl border p-4 text-left transition-all duration-300 hover:-translate-y-1 hover:shadow-xl active:scale-95 ${chartOption === 'returnAmount'
              ? 'border-red-400 bg-gradient-to-br from-red-500/25 via-slate-900 to-slate-950 ring-2 ring-red-500/40 shadow-lg shadow-red-500/20'
              : 'border-slate-800 bg-slate-900/80 hover:border-red-500/50 hover:bg-slate-800/80'
              }`}
          >
            <div className="flex items-start justify-between gap-2">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-500/15 ring-1 ring-red-500/30">
                <img src={backwardIcon} alt="" className="h-6 w-6 object-contain drop-shadow" />
              </span>
              <span className="rounded-full bg-red-500/20 border border-red-500/30 px-2 py-0.5 text-[9px] font-black text-red-300 uppercase tracking-wider font-mono">
                Returns
              </span>
            </div>
            <div className="mt-3">
              <p className="text-xs font-semibold text-slate-400">
                {lang === 'en' ? 'Return Consignment Amount' : 'ចំនួនទឹកប្រាក់បញ្ជូនត្រឡប់'}
              </p>
              <p className="text-xl sm:text-2xl font-black text-white mt-0.5 font-mono truncate">
                {formatCurrency(kpis.returnAmount)}
              </p>
              <div className="mt-2 text-[11px] border-t border-slate-800/80 pt-2 text-slate-400 truncate">
                {formatCurrency(kpis.returnAmount)} Return Consignment Amount
              </div>
            </div>
          </button>

          {/* 7. PENDING PAYMENT */}
          <button
            type="button"
            onClick={() => {
              setChartOption('pendingPayment')
              setChartMetric('amount')
            }}
            className={`group relative overflow-hidden rounded-2xl border p-4 text-left transition-all duration-300 hover:-translate-y-1 hover:shadow-xl active:scale-95 ${chartOption === 'pendingPayment'
              ? 'border-teal-400 bg-gradient-to-br from-teal-500/25 via-slate-900 to-slate-950 ring-2 ring-teal-500/40 shadow-lg shadow-teal-500/20'
              : 'border-slate-800 bg-slate-900/80 hover:border-teal-500/50 hover:bg-slate-800/80'
              }`}
          >
            <div className="flex items-start justify-between gap-2">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-500/15 ring-1 ring-teal-500/30">
                <img src={dollarIcon} alt="" className="h-6 w-6 object-contain drop-shadow" />
              </span>
              <span className="rounded-full bg-teal-500/20 border border-teal-500/30 px-2 py-0.5 text-[9px] font-black text-teal-300 uppercase tracking-wider font-mono">
                Payment
              </span>
            </div>
            <div className="mt-3">
              <p className="text-xs font-semibold text-slate-400">
                {lang === 'en' ? 'Pending Payment' : 'ការទូទាត់រង់ចាំ'}
              </p>
              <p className="text-xl sm:text-2xl font-black text-white mt-0.5 font-mono truncate">
                {formatCurrency(kpis.pendingPayment)}
              </p>
              <div className="mt-2 text-[11px] border-t border-slate-800/80 pt-2 text-slate-400 truncate">
                {formatCurrency(kpis.pendingPayment)} Pending Payment
              </div>
            </div>
          </button>
        </div>
      </section>

      {/* 3. PERFORMANCE CHART: Consignment Value vs Invoiced Amount */}
      <section className="relative overflow-hidden rounded-3xl border border-slate-800 bg-gradient-to-br from-[#121824] via-[#0f172a] to-[#0a0e17] p-5 sm:p-7 shadow-2xl shadow-black/40 space-y-5">
        {/* Glow ambient background behind the active curve */}
        <div
          className="pointer-events-none absolute -right-16 -top-16 h-72 w-72 rounded-full blur-3xl opacity-20 transition-all duration-500"
          style={{
            background:
              chartOption === 'invoicedAmount'
                ? '#10B981'
                : chartOption === 'shippedAmount'
                  ? '#3b82f6'
                  : chartOption === 'returnAmount'
                    ? '#ef4444'
                    : '#a855f7',
          }}
        />

        {/* Chart Header Bar */}
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between border-b border-slate-800/90 pb-4">
          <div>
            <div className="flex items-center gap-2.5">
              <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-purple-500/20 text-purple-300 text-lg shadow-inner">
                📈
              </span>
              <div>
                <h2 className="text-lg sm:text-xl font-black text-white tracking-tight">
                  {lang === 'en' ? 'Consignment Value vs Invoiced Amount' : 'តម្លៃទំនិញបញ្ញើ ធៀបនឹង ចំនួនទឹកប្រាក់វិក័យប័ត្រ'}
                </h2>
                <p className="text-xs text-slate-400 font-medium mt-0.5">
                  {lang === 'en' ? 'Overview of consignment performance' : 'ទិដ្ឋភាពទូទៅនៃដំណើរការទំនិញបញ្ញើ'}
                </p>
              </div>
              <span className="ml-2 rounded-full bg-purple-500/15 border border-purple-500/30 px-2.5 py-0.5 text-[11px] font-black text-purple-300">
                {monthContext.labelEn}
              </span>
              {isLoadingData && (
                <span className="inline-flex items-center gap-1 text-[11px] text-slate-400 animate-pulse">
                  ● Syncing...
                </span>
              )}
            </div>
          </div>

          {/* Chart Controls: Stream Selector + Metric Switch */}
          <div className="flex flex-wrap items-center gap-2">
            {/* 5 Stream Switcher Tabs */}
            <div className="flex items-center rounded-xl bg-slate-950/80 p-1 border border-slate-800">
              {[
                { key: 'compare', label: 'Value vs Invoiced', color: '#a855f7' },
                { key: 'consignmentValue', label: 'Value', color: '#a855f7' },
                { key: 'invoicedAmount', label: 'Invoiced', color: '#10b981' },
                { key: 'shippedAmount', label: 'Shipped', color: '#3b82f6' },
                { key: 'returnAmount', label: 'Returns', color: '#ef4444' },
                { key: 'pendingPayment', label: 'Pending', color: '#14b8a6' },
              ].map((tab) => {
                const isActive = chartOption === tab.key
                return (
                  <button
                    key={tab.key}
                    type="button"
                    onClick={() => setChartOption(tab.key)}
                    className={`rounded-lg px-2.5 py-1 text-xs font-bold transition whitespace-nowrap ${isActive
                      ? 'bg-purple-600 text-white shadow-sm ring-1 ring-purple-400'
                      : 'text-slate-400 hover:text-white'
                      }`}
                  >
                    {tab.label}
                  </button>
                )
              })}
            </div>

            {/* Metric Mode Toggle */}
            <div className="flex items-center rounded-xl bg-slate-950/80 p-1 border border-slate-800">
              <button
                type="button"
                onClick={() => setChartMetric('amount')}
                className={`rounded-lg px-2.5 py-1 text-xs font-bold transition ${chartMetric === 'amount'
                  ? 'bg-purple-600 text-white shadow-sm ring-1 ring-purple-400'
                  : 'text-slate-400 hover:text-white'
                  }`}
              >
                Amount ($)
              </button>
              <button
                type="button"
                onClick={() => setChartMetric('volume')}
                className={`rounded-lg px-2.5 py-1 text-xs font-bold transition ${chartMetric === 'volume'
                  ? 'bg-purple-600 text-white shadow-sm ring-1 ring-purple-400'
                  : 'text-slate-400 hover:text-white'
                  }`}
              >
                Volume (#)
              </button>
            </div>
          </div>
        </div>

        {/* Interactive SVG Bézier Chart Area */}
        <div className="relative w-full overflow-x-auto">
          <svg
            viewBox={`0 0 ${chartConfig.width} ${chartConfig.height}`}
            className="w-full h-auto min-w-[700px] select-none"
          >
            <defs>
              {/* Gradients */}
              <linearGradient id="consignmentGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#a855f7" stopOpacity="0.35" />
                <stop offset="100%" stopColor="#a855f7" stopOpacity="0.0" />
              </linearGradient>
              <linearGradient id="invoiceGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#10B981" stopOpacity="0.30" />
                <stop offset="100%" stopColor="#10B981" stopOpacity="0.0" />
              </linearGradient>
            </defs>

            {/* Horizontal Grid Ticks & Guides */}
            {chartConfig.yTicks.map((tickVal, idx) => {
              const y =
                chartConfig.padding.top +
                chartConfig.innerHeight -
                (tickVal / chartConfig.yMax) * chartConfig.innerHeight
              return (
                <g key={idx}>
                  <line
                    x1={chartConfig.padding.left}
                    y1={y}
                    x2={chartConfig.padding.left + chartConfig.innerWidth}
                    y2={y}
                    stroke="#334155"
                    strokeWidth="1"
                    strokeDasharray={idx === 0 ? 'none' : '4,4'}
                    opacity={idx === 0 ? 0.6 : 0.25}
                  />
                  <text
                    x={chartConfig.padding.left - 10}
                    y={y + 4}
                    textAnchor="end"
                    className="text-[10px] fill-slate-500 font-mono font-bold"
                  >
                    {chartMetric === 'amount' ? `$${formatNumber(tickVal)}` : formatNumber(tickVal)}
                  </text>
                </g>
              )
            })}

            {/* CURVES */}
            {/* Compare Mode: Dual Curves */}
            {chartOption === 'compare' && (
              <>
                {/* Consignment Value Area & Line */}
                <path d={chartConfig.valuePaths.areaPath} fill="url(#consignmentGrad)" />
                <path
                  d={chartConfig.valuePaths.linePath}
                  fill="none"
                  stroke="#a855f7"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                />

                {/* Invoiced Amount Area & Line */}
                <path d={chartConfig.invoicePaths.areaPath} fill="url(#invoiceGrad)" />
                <path
                  d={chartConfig.invoicePaths.linePath}
                  fill="none"
                  stroke="#10B981"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                />
              </>
            )}

            {/* Individual Stream Curves */}
            {chartOption === 'consignmentValue' && (
              <>
                <path d={chartConfig.valuePaths.areaPath} fill="url(#consignmentGrad)" />
                <path d={chartConfig.valuePaths.linePath} fill="none" stroke="#a855f7" strokeWidth="3" strokeLinecap="round" />
              </>
            )}
            {chartOption === 'invoicedAmount' && (
              <>
                <path d={chartConfig.invoicePaths.areaPath} fill="url(#invoiceGrad)" />
                <path d={chartConfig.invoicePaths.linePath} fill="none" stroke="#10B981" strokeWidth="3" strokeLinecap="round" />
              </>
            )}
            {chartOption === 'shippedAmount' && (
              <path d={chartConfig.shippedPaths.linePath} fill="none" stroke="#3b82f6" strokeWidth="3" strokeLinecap="round" />
            )}
            {chartOption === 'returnAmount' && (
              <path d={chartConfig.returnPaths.linePath} fill="none" stroke="#ef4444" strokeWidth="3" strokeLinecap="round" />
            )}
            {chartOption === 'pendingPayment' && (
              <path d={chartConfig.paymentPaths.linePath} fill="none" stroke="#14b8a6" strokeWidth="3" strokeLinecap="round" />
            )}
            {chartOption === 'orders' && (
              <path d={chartConfig.ordersPaths.linePath} fill="none" stroke="#6366f1" strokeWidth="3" strokeLinecap="round" />
            )}

            {/* X-Axis Day Labels */}
            {monthlyTimeline.map((d, i) => {
              const x = chartConfig.padding.left + (i / Math.max(1, monthlyTimeline.length - 1)) * chartConfig.innerWidth
              const y = chartConfig.padding.top + chartConfig.innerHeight + 18
              const shouldShowLabel =
                d.day === 1 ||
                d.day === 5 ||
                d.day === 10 ||
                d.day === 15 ||
                d.day === 20 ||
                d.day === 25 ||
                d.day === monthlyTimeline.length ||
                d.isToday

              if (!shouldShowLabel) return null

              return (
                <g key={d.day}>
                  <text
                    x={x}
                    y={y}
                    textAnchor="middle"
                    className={`text-[10px] font-mono font-bold ${d.isToday ? 'fill-purple-400 font-black' : 'fill-slate-500'
                      }`}
                  >
                    {d.day}
                  </text>
                  {d.isToday && (
                    <circle cx={x} cy={y + 8} r="2" fill="#a855f7" />
                  )}
                </g>
              )
            })}

            {/* Interactive Hover Probe Bars */}
            {monthlyTimeline.map((d, i) => {
              const x = chartConfig.padding.left + (i / Math.max(1, monthlyTimeline.length - 1)) * chartConfig.innerWidth
              const widthCol = chartConfig.innerWidth / monthlyTimeline.length
              return (
                <rect
                  key={d.day}
                  x={x - widthCol / 2}
                  y={chartConfig.padding.top}
                  width={widthCol}
                  height={chartConfig.innerHeight}
                  fill="transparent"
                  className="cursor-pointer"
                  onMouseEnter={() => setHoveredPoint(d)}
                  onMouseLeave={() => setHoveredPoint(null)}
                />
              )
            })}

            {/* Hover Tooltip Overlay */}
            {hoveredPoint && (
              <g>
                <line
                  x1={
                    chartConfig.padding.left +
                    ((hoveredPoint.day - 1) / Math.max(1, monthlyTimeline.length - 1)) * chartConfig.innerWidth
                  }
                  y1={chartConfig.padding.top}
                  x2={
                    chartConfig.padding.left +
                    ((hoveredPoint.day - 1) / Math.max(1, monthlyTimeline.length - 1)) * chartConfig.innerWidth
                  }
                  y2={chartConfig.padding.top + chartConfig.innerHeight}
                  stroke="#a855f7"
                  strokeWidth="1.5"
                  strokeDasharray="3,3"
                />
              </g>
            )}
          </svg>

          {/* Floating Card Tooltip */}
          {hoveredPoint && (
            <div
              className="pointer-events-none absolute top-4 z-20 rounded-xl border border-purple-500/40 bg-slate-950/95 p-3 shadow-xl backdrop-blur-md text-xs space-y-1.5"
              style={{
                left: `${Math.min(
                  80,
                  Math.max(
                    15,
                    ((hoveredPoint.day - 1) / Math.max(1, monthlyTimeline.length - 1)) * 100
                  )
                )}%`,
                transform: 'translateX(-50%)',
              }}
            >
              <p className="font-bold text-white border-b border-slate-800 pb-1 flex items-center justify-between gap-3">
                <span>Day {hoveredPoint.day} ({hoveredPoint.formattedDateEn})</span>
                <span className="text-purple-400 font-mono">Consignment</span>
              </p>
              <div className="space-y-1 font-mono text-[11px]">
                <p className="flex justify-between gap-4 text-purple-300">
                  <span>Value:</span>
                  <span className="font-bold">{formatCurrency(hoveredPoint.consignmentValue)}</span>
                </p>
                <p className="flex justify-between gap-4 text-emerald-400">
                  <span>Invoiced:</span>
                  <span className="font-bold">{formatCurrency(hoveredPoint.invoicedAmount)}</span>
                </p>
                <p className="flex justify-between gap-4 text-blue-400">
                  <span>Shipped:</span>
                  <span className="font-bold">{formatCurrency(hoveredPoint.shippedAmount)}</span>
                </p>
                <p className="flex justify-between gap-4 text-red-400">
                  <span>Returns:</span>
                  <span className="font-bold">{formatCurrency(hoveredPoint.returnAmount)}</span>
                </p>
              </div>
            </div>
          )}
        </div>

        {/* 4 SUMMARY STATS UNDER THE CHART */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 pt-2">
          <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-3.5">
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              {lang === 'en' ? 'Consignment Value' : 'តម្លៃទំនិញបញ្ញើ'}
            </p>
            <p className="mt-1 font-mono text-lg font-black text-purple-400">
              {formatCurrency(kpis.consignmentValue)}
            </p>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-3.5">
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              {lang === 'en' ? 'Invoiced Amount' : 'ចំនួនទឹកប្រាក់វិក័យប័ត្រ'}
            </p>
            <p className="mt-1 font-mono text-lg font-black text-emerald-400">
              {formatCurrency(kpis.invoicedAmount)}
            </p>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-3.5">
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              {lang === 'en' ? 'Shipped Amount' : 'ទឹកប្រាក់ដឹកជញ្ជូន'}
            </p>
            <p className="mt-1 font-mono text-lg font-black text-blue-400">
              {formatCurrency(kpis.shippedAmount)}
            </p>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-3.5">
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              {lang === 'en' ? 'Settlement Clearance' : 'អត្រាទូទាត់រួច'}
            </p>
            <p className="mt-1 font-mono text-lg font-black text-white">
              {kpis.consignmentValue > 0
                ? `${Math.round((kpis.invoicedAmount / kpis.consignmentValue) * 100)}%`
                : '0%'}
            </p>
          </div>
        </div>
      </section>

      {/* 4. SEARCH & CATEGORY FILTER BAR */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between rounded-2xl border border-slate-800/80 bg-[#1e293b]/70 backdrop-blur-md p-3.5 shadow-lg">
        <div className="relative flex-1 max-w-md">
          <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 text-xs">
            🔍
          </span>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={
              lang === 'en'
                ? 'Quick search consignment module (e.g. Shipment, Return Shipment...)'
                : 'ស្វែងរកម៉ូឌុលរហ័ស (ឧ. ការដឹកជញ្ជូន, ការប្រគល់ត្រឡប់...)'
            }
            className="w-full rounded-xl border border-slate-700/80 bg-slate-950/90 py-2 pl-9 pr-8 text-xs font-semibold text-white placeholder-slate-500 outline-none transition focus:border-purple-400 focus:ring-2 focus:ring-purple-400/20"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white text-xs"
            >
              ✕
            </button>
          )}
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-thin">
          {[
            { key: 'all', en: 'All Modules', kh: 'ទាំងអស់', count: ALL_CONSIGNMENT_MODULES.length },
            { key: 'shipment', en: 'Consignment Shipment', kh: 'ការដឹកជញ្ជូនបញ្ញើ', count: 1 },
            { key: 'return', en: 'Return Shipment', kh: 'ការបញ្ជូនត្រឡប់', count: 1 },
            { key: 'settlement', en: 'Shipment', kh: 'ការដឹកជញ្ជូនបញ្ញើ', count: 1 },
          ].map((tab) => {
            const isSelected = activeCategory === tab.key
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => setActiveCategory(tab.key)}
                className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold transition whitespace-nowrap active:scale-95 ${isSelected
                  ? 'bg-purple-600 text-white shadow-md shadow-purple-600/30 ring-1 ring-purple-400'
                  : 'bg-slate-900/80 text-slate-400 border border-slate-700/60 hover:text-white hover:border-slate-500'
                  }`}
              >
                <span>{lang === 'kh' ? tab.kh : tab.en}</span>
                <span
                  className={`rounded-full px-1.5 py-0.2 text-[10px] font-mono ${isSelected ? 'bg-slate-950 text-purple-300' : 'bg-slate-800 text-slate-400'
                    }`}
                >
                  {tab.count}
                </span>
              </button>
            )
          })}
        </div>
      </div>

      {/* 5. CONSIGNMENT MODULES - ALL 3 IN ONE PLACE */}
      {filteredModules.length > 0 && (
        <section className="rounded-3xl border border-slate-800 bg-slate-900/80 p-5 sm:p-6 shadow-xl shadow-black/20 space-y-5">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between pb-3 border-b border-slate-800/80">
            <div className="flex items-center gap-3">
              <div className="h-5 w-1.5 rounded-full bg-purple-500" />
              <div>
                <h2 className="text-base sm:text-lg font-bold text-white font-['Montserrat']">
                  {lang === 'en' ? 'Consignment Modules' : 'ម៉ូឌុលគ្រប់គ្រងការលក់បញ្ញើ'}
                </h2>
                <p className="text-[11px] text-slate-400">
                  {lang === 'en'
                    ? 'Consignment Shipment, Return Shipment, and Shipment Logistics'
                    : 'ការដឹកជញ្ជូនបញ្ញើ ការប្រគល់ទំនិញត្រឡប់ និងការដឹកជញ្ជូន'}
                </p>
              </div>
            </div>
            <span className="text-xs font-mono text-slate-400 bg-slate-800/80 px-2.5 py-1 rounded-full border border-slate-700/60 w-fit">
              {filteredModules.length} {filteredModules.length === 1 ? 'module' : 'modules'}
            </span>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filteredModules.map((item) => {
              const isImg =
                typeof item.icon === 'string' &&
                (item.icon.includes('/') || item.icon.endsWith('.png'))

              return (
                <div
                  key={item.key}
                  onClick={() => navigate(item.route)}
                  className="hub-card group relative flex flex-col justify-between rounded-2xl border border-slate-800 bg-slate-950/60 p-5 transition-all duration-300 hover:-translate-y-1 hover:border-slate-700 hover:bg-slate-950 hover:shadow-xl hover:shadow-black/40 active:scale-[0.98] cursor-pointer select-none"
                >
                  <div
                    className="pointer-events-none absolute -right-8 -top-8 h-28 w-28 rounded-full opacity-10 blur-2xl transition-opacity group-hover:opacity-25"
                    style={{ background: item.color }}
                  />

                  <div>
                    <div className="flex items-center justify-between mb-3.5">
                      <span
                        className="flex h-12 w-12 items-center justify-center rounded-xl p-2 ring-1 ring-white/10 shadow-md shadow-black/30 transition-transform duration-300 group-hover:scale-110"
                        style={{ background: item.bg, borderColor: `${item.color}40` }}
                      >
                        {isImg ? (
                          <img src={item.icon} alt="" className="h-8 w-8 object-contain drop-shadow-md" />
                        ) : (
                          <span className="text-xl">{item.icon}</span>
                        )}
                      </span>

                      {item.tag && (
                        <span
                          className="rounded-full px-2 py-0.5 text-[9px] font-black uppercase tracking-wider font-mono shadow-sm"
                          style={{
                            background: item.bg,
                            color: item.color,
                            border: `1px solid ${item.color}40`,
                          }}
                        >
                          {item.tag}
                        </span>
                      )}
                    </div>

                    <h3 className="text-sm sm:text-base font-bold text-white font-['Montserrat'] group-hover:text-purple-300 transition-colors">
                      {lang === 'kh' ? item.kh : item.en}
                    </h3>

                    <p className="mt-1 text-xs leading-relaxed text-slate-400 line-clamp-2">
                      {lang === 'kh' ? item.descKh : item.descEn}
                    </p>
                  </div>

                  {/* Bottom action */}
                  <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between">
                    <span
                      className="inline-flex items-center gap-1.5 text-xs font-bold transition-transform group-hover:translate-x-1"
                      style={{ color: item.color }}
                    >
                      <span>{lang === 'en' ? 'Open Module' : 'បើកដំណើរការ'}</span>
                      <ChevronIcon />
                    </span>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation()
                        setChartOption(item.key === 'return-shipment-consignment' ? 'returnAmount' : 'consignmentValue')
                        window.scrollTo({ top: 120, behavior: 'smooth' })
                      }}
                      className="text-[11px] text-slate-500 hover:text-white transition p-1 hover:bg-slate-800/80 rounded-lg"
                      title="View on Chart"
                    >
                      📊
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        </section>
      )}

      {/* Empty Search State */}
      {filteredModules.length === 0 && (
        <div className="rounded-2xl border border-dashed border-slate-700 bg-slate-950/60 p-12 text-center space-y-3">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-900 text-3xl">
            🔍
          </div>
          <p className="text-sm font-bold text-white">
            {lang === 'en' ? `No modules found matching "${searchQuery}"` : `រកមិនឃើញម៉ូឌុលដែលត្រូវនឹង "${searchQuery}" ទេ`}
          </p>
          <button
            type="button"
            onClick={() => setSearchQuery('')}
            className="rounded-xl border border-slate-700 bg-slate-800 px-4 py-1.5 text-xs font-bold text-white transition hover:bg-slate-700"
          >
            {lang === 'en' ? 'Clear Search' : 'សម្អាតការស្វែងរក'}
          </button>
        </div>
      )}
    </div>
  )
}
