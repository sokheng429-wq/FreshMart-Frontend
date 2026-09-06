import { useState, useMemo, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useLanguage } from '../../context/LanguageContext'
import { adminCustomerAPI, adminSaleInvoiceAPI, adminReturnInvoiceAPI } from '../../api/api'
import bagIcon from '../../assets/icon/3dicons-bag-dynamic-color.png'
import boyIcon from '../../assets/icon/3dicons-boy-dynamic-color.png'
import mailIcon from '../../assets/icon/3dicons-mail-dynamic-color.png'
import giftIcon from '../../assets/icon/3dicons-gift-box-dynamic-color.png'
import dollarIcon from '../../assets/icon/3dicons-dollar-dynamic-color.png'
import chartIcon from '../../assets/icon/3dicons-chart-dynamic-color.png'
import './ProductsHub.css'

// Sale Dashboard Modules
const CUSTOMER_MODULES = [
  {
    key: 'customers',
    icon: boyIcon,
    en: 'Customers',
    kh: 'អតិថិជន',
    descEn: 'Manage customer accounts and information',
    descKh: 'គ្រប់គ្រងគណនីអតិថិជន និងព័ត៌មាន',
    color: '#77BC1F',
    bg: 'rgba(119, 188, 31, 0.12)',
    category: 'customer',
    tag: 'Core',
  },
  {
    key: 'customer-groups',
    icon: bagIcon,
    en: 'Customer Groups',
    kh: 'ក្រុមអតិថិជន',
    descEn: 'Organize customers into groups',
    descKh: 'ចាត់ចែងអតិថិជនទៅក្នុងក្រុម',
    color: '#14b8a6',
    bg: 'rgba(20, 184, 166, 0.12)',
    category: 'customer',
  },
]

const INVOICE_MODULES = [
  {
    key: 'sale-invoice',
    icon: mailIcon,
    en: 'Sale Invoices',
    kh: 'វិក័យប័ត្រលក់',
    descEn: 'View and manage all sale invoices',
    descKh: 'មើល និងគ្រប់គ្រងវិក័យប័ត្រលក់ទាំងអស់',
    color: '#FF9900',
    bg: 'rgba(255, 153, 0, 0.12)',
    category: 'invoice',
    tag: 'Popular',
  },
  {
    key: 'pending-invoice',
    icon: chartIcon,
    en: 'Pending Invoices',
    kh: 'វិក័យប័ត្រមិនទាន់បង់',
    descEn: 'Track pending and unpaid invoices',
    descKh: 'តាមដានវិក័យប័ត្រមិនទាន់បង់ប្រាក់',
    color: '#f59e0b',
    bg: 'rgba(245, 158, 11, 0.12)',
    category: 'invoice',
  },
  {
    key: 'return-invoice',
    icon: dollarIcon,
    en: 'Return Invoices',
    kh: 'វិក័យប័ត្រត្រឡប់ទំនិញ',
    descEn: 'Manage returned items and refunds',
    descKh: 'គ្រប់គ្រងការត្រឡប់ទំនិញ និងការសងប្រាក់វិញ',
    color: '#ef4444',
    bg: 'rgba(239, 68, 68, 0.12)',
    category: 'invoice',
  },
]

const PROMOTION_MODULES = [
  {
    key: 'promotions',
    icon: giftIcon,
    en: 'Promotion',
    kh: 'ការផ្សព្វផ្សាយ',
    descEn: 'View and manage promotions',
    descKh: 'មើល និងគ្រប់គ្រងការផ្សព្វផ្សាយ',
    color: '#3B82F6',
    bg: 'rgba(59, 130, 246, 0.12)',
    category: 'promotion',
    tag: 'Core',
  },
]

const ALL_SALE_MODULES = [...CUSTOMER_MODULES, ...INVOICE_MODULES, ...PROMOTION_MODULES]

/**
 * Helper to safely extract YYYY-MM-DD from any date representation (string, ISO, timestamp)
 */
const extractDateKey = (rawDate) => {
  if (!rawDate) return null
  if (typeof rawDate === 'string') {
    if (/^\d{4}-\d{2}-\d{2}/.test(rawDate)) {
      return rawDate.slice(0, 10)
    }
  }
  try {
    const d = new Date(rawDate)
    if (!isNaN(d.getTime())) {
      const year = d.getFullYear()
      const month = String(d.getMonth() + 1).padStart(2, '0')
      const day = String(d.getDate()).padStart(2, '0')
      return `${year}-${month}-${day}`
    }
  } catch (e) {
    // ignore
  }
  return null
}

/**
 * Generate daily sales timeline based 100% on real invoices from the database
 */
const computeDailySalesTimeline = (invoices = [], daysCount = 7) => {
  const result = []
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  // Group actual real invoices by date key (YYYY-MM-DD)
  const salesByDate = {}
  if (Array.isArray(invoices)) {
    invoices.forEach((inv) => {
      if (!inv || inv.status === 'VOID') return
      const dateKey = extractDateKey(inv.invoiceDate || inv.createdAt)
      if (!dateKey) return

      if (!salesByDate[dateKey]) {
        salesByDate[dateKey] = { total: 0, paid: 0, count: 0, balance: 0 }
      }
      salesByDate[dateKey].total += Number(inv.grandTotal || 0)
      salesByDate[dateKey].paid += Number(inv.paidAmount || 0)
      salesByDate[dateKey].balance += Number(inv.balanceDue || 0)
      salesByDate[dateKey].count += 1
    })
  }

  // Iterate exactly over each day in the selected period (7, 14, 30 days)
  for (let i = daysCount - 1; i >= 0; i--) {
    const d = new Date(today)
    d.setDate(d.getDate() - i)

    const year = d.getFullYear()
    const month = String(d.getMonth() + 1).padStart(2, '0')
    const dayOfMonth = String(d.getDate()).padStart(2, '0')
    const dateStr = `${year}-${month}-${dayOfMonth}`

    const isToday = i === 0
    const dayName = d.toLocaleDateString('en-US', { weekday: 'short' })
    const formattedDate = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })

    const realData = salesByDate[dateStr] || { total: 0, paid: 0, count: 0, balance: 0 }

    result.push({
      dateStr,
      day: isToday ? 'Today' : dayName,
      fullDay: d.toLocaleDateString('en-US', { weekday: 'long' }),
      date: formattedDate,
      sales: Math.round(realData.total * 100) / 100,
      paid: Math.round(realData.paid * 100) / 100,
      balance: Math.round(realData.balance * 100) / 100,
      invoicesCount: realData.count,
      isToday,
      hasRealInvoice: realData.count > 0,
    })
  }

  return result
}

export default function SaleDashboard() {
  const { lang } = useLanguage()
  const [searchQuery, setSearchQuery] = useState('')
  const [activeCategory, setActiveCategory] = useState('all')
  const [chartDays, setChartDays] = useState(7) // 7, 14, 30
  const [hoveredDay, setHoveredDay] = useState(null)
  const [allInvoices, setAllInvoices] = useState([])

  const [stats, setStats] = useState({
    totalCustomers: 0,
    totalInvoices: 0,
    saleAmount: 0,
    refundAmount: 0,
    profit: 0,
    loading: true,
  })

  // Load live statistics and invoices from backend
  useEffect(() => {
    let isMounted = true

    Promise.all([
      adminCustomerAPI.getAll().catch(() => []),
      adminSaleInvoiceAPI.getStats().catch(() => null),
      adminSaleInvoiceAPI.getAll().catch(() => []),
      adminReturnInvoiceAPI.getAll().catch(() => []),
    ])
      .then(([custRes, invoiceStatsRes, invoicesRes, returnsRes]) => {
        if (!isMounted) return
        const customerList = custRes?.data || custRes || []
        const customerCount = Array.isArray(customerList) ? customerList.length : 0

        const invList = invoicesRes?.data || invoicesRes || []
        const rawInvoices = Array.isArray(invList) ? invList : []
        setAllInvoices(rawInvoices)

        const retList = returnsRes?.data || returnsRes || []
        const rawReturns = Array.isArray(retList) ? retList : []
        const totalRefunds = rawReturns.reduce((acc, r) => acc + Number(r.grandTotal || 0), 0)

        const invStats = invoiceStatsRes?.data || null
        const totalSale = invStats?.totalAmount ? Number(invStats.totalAmount) : rawInvoices.reduce((acc, i) => acc + Number(i.grandTotal || 0), 0)
        const totalPaid = invStats?.totalPaid ? Number(invStats.totalPaid) : rawInvoices.reduce((acc, i) => acc + Number(i.paidAmount || 0), 0)
        const totalInvCount = invStats?.totalInvoices !== undefined ? invStats.totalInvoices : rawInvoices.length

        setStats({
          totalCustomers: customerCount,
          totalInvoices: totalInvCount,
          saleAmount: totalSale,
          refundAmount: totalRefunds,
          profit: Math.max(0, totalPaid - totalRefunds),
          loading: false,
        })
      })
      .catch((err) => {
        console.error('Failed to load dashboard stats:', err)
        if (isMounted) {
          setStats((prev) => ({ ...prev, loading: false }))
        }
      })

    return () => {
      isMounted = false
    }
  }, [])

  // Refresh live statistics and invoices on demand
  const refreshLiveStats = () => {
    setStats((prev) => ({ ...prev, loading: true }))
    Promise.all([
      adminCustomerAPI.getAll().catch(() => []),
      adminSaleInvoiceAPI.getStats().catch(() => null),
      adminSaleInvoiceAPI.getAll().catch(() => []),
      adminReturnInvoiceAPI.getAll().catch(() => []),
    ])
      .then(([custRes, invoiceStatsRes, invoicesRes, returnsRes]) => {
        const customerList = custRes?.data || custRes || []
        const customerCount = Array.isArray(customerList) ? customerList.length : 0

        const invList = invoicesRes?.data || invoicesRes || []
        const rawInvoices = Array.isArray(invList) ? invList : []
        setAllInvoices(rawInvoices)

        const retList = returnsRes?.data || returnsRes || []
        const rawReturns = Array.isArray(retList) ? retList : []
        const totalRefunds = rawReturns.reduce((acc, r) => acc + Number(r.grandTotal || 0), 0)

        const invStats = invoiceStatsRes?.data || null
        const totalSale = invStats?.totalAmount ? Number(invStats.totalAmount) : rawInvoices.reduce((acc, i) => acc + Number(i.grandTotal || 0), 0)
        const totalPaid = invStats?.totalPaid ? Number(invStats.totalPaid) : rawInvoices.reduce((acc, i) => acc + Number(i.paidAmount || 0), 0)
        const totalInvCount = invStats?.totalInvoices !== undefined ? invStats.totalInvoices : rawInvoices.length

        setStats({
          totalCustomers: customerCount,
          totalInvoices: totalInvCount,
          saleAmount: totalSale,
          refundAmount: totalRefunds,
          profit: Math.max(0, totalPaid - totalRefunds),
          loading: false,
        })
      })
      .catch((err) => {
        console.error('Failed to reload live stats:', err)
        setStats((prev) => ({ ...prev, loading: false }))
      })
  }

  // Calculate daily sales list based on selected range
  const dailySales = useMemo(() => {
    return computeDailySalesTimeline(allInvoices, chartDays)
  }, [allInvoices, chartDays])

  // Chart aggregation summary (100% pure live calculations)
  const chartSummary = useMemo(() => {
    const total = dailySales.reduce((sum, d) => sum + d.sales, 0)
    const avg = dailySales.length > 0 ? total / dailySales.length : 0
    let peak = { sales: 0, day: '—', date: '—' }
    dailySales.forEach((d) => {
      if (d.sales > peak.sales) peak = d
    })
    const totalOrders = dailySales.reduce((sum, d) => sum + d.invoicesCount, 0)
    return { total, avg, peak, totalOrders }
  }, [dailySales])

  // Maximum scale for chart grid
  const realMaxSales = Math.max(...dailySales.map((d) => d.sales), 0)
  const scaleMax = realMaxSales > 0 ? realMaxSales : 100

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
    }).format(Number(amount) || 0)
  }

  // Filter modules based on search and active tab
  const filteredModules = useMemo(() => {
    const q = searchQuery.trim().toLowerCase()
    let list = ALL_SALE_MODULES

    if (activeCategory === 'customer') {
      list = CUSTOMER_MODULES
    } else if (activeCategory === 'invoice') {
      list = INVOICE_MODULES
    } else if (activeCategory === 'promotion') {
      list = PROMOTION_MODULES
    }

    if (!q) return list

    return list.filter((m) => {
      const en = (m.en || '').toLowerCase()
      const kh = (m.kh || '').toLowerCase()
      const descEn = (m.descEn || '').toLowerCase()
      const descKh = (m.descKh || '').toLowerCase()
      const key = (m.key || '').toLowerCase()
      return en.includes(q) || kh.includes(q) || descEn.includes(q) || descKh.includes(q) || key.includes(q)
    })
  }, [searchQuery, activeCategory])

  const customerFiltered = useMemo(
    () => filteredModules.filter((m) => m.category === 'customer'),
    [filteredModules]
  )

  const invoiceFiltered = useMemo(
    () => filteredModules.filter((m) => m.category === 'invoice'),
    [filteredModules]
  )

  const promotionFiltered = useMemo(
    () => filteredModules.filter((m) => m.category === 'promotion'),
    [filteredModules]
  )

  const text = {
    en: {
      backToAdmin: '← Back to Admin',
      title: 'Sale Dashboard',
      subtitle: 'Manage sales operations, invoices, customer relations, and daily revenue',
      totalCustomers: 'Total Customers',
      totalInvoices: 'Total Invoices',
      saleAmount: 'Sale Amount',
      refundAmount: 'Refund Amount',
      profit: 'Net Revenue',
      dailySales: 'Daily Sales Performance',
      searchPlaceholder: 'Search modules...',
      all: 'All',
      customerManagement: 'Customer Management',
      customerSubtitle: 'Manage customer accounts and relationships',
      invoiceManagement: 'Invoice Management',
      invoiceSubtitle: 'Track and manage all invoices and returns',
      promotions: 'Sales Promotions',
      promotionSubtitle: 'Create and manage sales campaigns & discounts',
      noResults: 'No modules found',
    },
    kh: {
      backToAdmin: '← ត្រឡប់ទៅផ្ទាំងគ្រប់គ្រង',
      title: 'ផ្ទាំងគ្រប់គ្រងការលក់',
      subtitle: 'គ្រប់គ្រងប្រតិបត្តិការលក់ វិក័យប័ត្រ និងចំណូលប្រចាំថ្ងៃ',
      totalCustomers: 'អតិថិជនសរុប',
      totalInvoices: 'វិក័យប័ត្រសរុប',
      saleAmount: 'ចំនួនលក់សរុប',
      refundAmount: 'ចំនួនសងប្រាក់ត្រឡប់',
      profit: 'ចំណូលសុទ្ធ',
      dailySales: 'ប្រតិបត្តិការលក់ប្រចាំថ្ងៃ',
      searchPlaceholder: 'ស្វែងរកម៉ូឌុល...',
      all: 'ទាំងអស់',
      customerManagement: 'ការគ្រប់គ្រងអតិថិជន',
      customerSubtitle: 'គ្រប់គ្រងគណនីអតិថិជន និងក្រុមអតិថិជន',
      invoiceManagement: 'ការគ្រប់គ្រងវិក័យប័ត្រ',
      invoiceSubtitle: 'តាមដាន និងគ្រប់គ្រងវិក័យប័ត្រលក់ និងការត្រឡប់',
      promotions: 'ការផ្សព្វផ្សាយ និងការបញ្ចុះតម្លៃ',
      promotionSubtitle: 'បង្កើត និងគ្រប់គ្រងការផ្សព្វផ្សាយលក់',
      noResults: 'រកមិនឃើញម៉ូឌុលទេ',
    },
  }

  const t = text[lang] || text.en

  return (
    <div className="min-h-screen space-y-6 bg-slate-950 p-4 text-white sm:p-6 lg:p-8">
      {/* TOP BAR / BACK LINK */}
      <div className="flex items-center justify-between">
        <Link
          to="/admin"
          className="inline-flex items-center gap-2 text-sm font-semibold text-slate-400 transition hover:text-white"
        >
          {t.backToAdmin}
        </Link>
      </div>

      {/* HERO SECTION */}
      <section className="relative overflow-hidden rounded-3xl border border-slate-700/60 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-6 shadow-2xl backdrop-blur-sm sm:p-8">
        <div className="relative z-10 flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-[#77BC1F] to-[#5ea113] p-3 shadow-lg shadow-green-500/20 sm:h-20 sm:w-20">
              <img src={chartIcon} alt="Sale Dashboard" className="h-full w-full object-contain" />
            </div>
            <div>
              <h1 className="text-2xl font-black tracking-tight text-white sm:text-4xl">{t.title}</h1>
              <p className="mt-1 text-xs text-slate-300 sm:text-sm">{t.subtitle}</p>
            </div>
          </div>
        </div>
      </section>

      {/* KPI CARDS & DAILY SALES CHART */}
      <section className="rounded-3xl border border-slate-700/60 bg-gradient-to-br from-slate-900/90 to-slate-950 p-6 shadow-2xl backdrop-blur-sm sm:p-8 space-y-6">
        {/* KPI Grid */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5 sm:gap-4">
          {/* Total Customers */}
          <Link
            to="/admin/sale-dashboard/customers"
            className="flex items-center gap-3 rounded-2xl border border-blue-500/30 bg-gradient-to-br from-blue-500/10 to-transparent px-4 py-3.5 shadow-md backdrop-blur-sm hover:border-blue-500 transition"
          >
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-blue-500/20">
              <svg className="h-6 w-6 text-blue-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <div>
              <p className="text-xl font-black text-white">{stats.loading ? '...' : stats.totalCustomers}</p>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">{t.totalCustomers}</p>
            </div>
          </Link>

          {/* Total Invoices */}
          <Link
            to="/admin/sale-dashboard/sale-invoice"
            className="flex items-center gap-3 rounded-2xl border border-amber-500/30 bg-gradient-to-br from-amber-500/10 to-transparent px-4 py-3.5 shadow-md backdrop-blur-sm hover:border-amber-500 transition"
          >
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-amber-500/20">
              <svg className="h-6 w-6 text-amber-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <div>
              <p className="text-xl font-black text-white">{stats.loading ? '...' : stats.totalInvoices}</p>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">{t.totalInvoices}</p>
            </div>
          </Link>

          {/* Sale Amount */}
          <div className="flex items-center gap-3 rounded-2xl border border-[#77BC1F]/30 bg-gradient-to-br from-[#77BC1F]/10 to-transparent px-4 py-3.5 shadow-md backdrop-blur-sm">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#77BC1F]/20">
              <svg className="h-6 w-6 text-[#77BC1F]" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <div>
              <p className="text-xl font-black text-white">{stats.loading ? '...' : formatCurrency(stats.saleAmount)}</p>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">{t.saleAmount}</p>
            </div>
          </div>

          {/* Refund Amount */}
          <Link
            to="/admin/sale-dashboard/return-invoice"
            className="flex items-center gap-3 rounded-2xl border border-red-500/30 bg-gradient-to-br from-red-500/10 to-transparent px-4 py-3.5 shadow-md backdrop-blur-sm hover:border-red-500 transition"
          >
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-red-500/20">
              <svg className="h-6 w-6 text-red-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <div>
              <p className="text-xl font-black text-white">{stats.loading ? '...' : formatCurrency(stats.refundAmount)}</p>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">{t.refundAmount}</p>
            </div>
          </Link>

          {/* Net Revenue */}
          <div className="col-span-2 sm:col-span-1 flex items-center gap-3 rounded-2xl border border-emerald-500/30 bg-gradient-to-br from-emerald-500/10 to-transparent px-4 py-3.5 shadow-md backdrop-blur-sm">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-emerald-500/20">
              <svg className="h-6 w-6 text-emerald-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <div>
              <p className="text-xl font-black text-white">{stats.loading ? '...' : formatCurrency(stats.profit)}</p>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">{t.profit}</p>
            </div>
          </div>
        </div>

        {/* INTERACTIVE DAILY SALES CHART - 100% REAL LIVE DATA */}
        <div className="rounded-2xl border border-slate-700/60 bg-slate-900/90 p-5 backdrop-blur-sm shadow-xl space-y-4">
          {/* Chart Controls Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-green-500/20 text-[#77BC1F]">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                  </svg>
                </span>
                <h3 className="text-base font-black text-white">{t.dailySales}</h3>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-bold tracking-wider uppercase">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                  Live Database
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                {lang === 'en'
                  ? `Real-time invoice revenue trend over the past ${chartDays} days`
                  : `និន្នាការចំណូលវិក័យប័ត្រផ្ទាល់ពីមូលដ្ឋានទិន្នន័យក្នុងរយៈពេល ${chartDays} ថ្ងៃចុងក្រោយ`}
              </p>
            </div>

            {/* Range Selector & Refresh */}
            <div className="flex items-center gap-2">
              <button
                onClick={refreshLiveStats}
                title={lang === 'en' ? 'Refresh live database data' : 'ទាញយកទិន្នន័យផ្ទាល់ឡើងវិញ'}
                className="flex h-8 w-8 items-center justify-center rounded-xl bg-slate-950 border border-slate-800 text-slate-400 hover:text-white hover:border-slate-700 transition active:scale-95"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </button>

              <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800">
                {[
                  { label: '7 Days', val: 7 },
                  { label: '14 Days', val: 14 },
                  { label: '30 Days', val: 30 },
                ].map((btn) => (
                  <button
                    key={btn.val}
                    onClick={() => setChartDays(btn.val)}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition ${
                      chartDays === btn.val
                        ? 'bg-gradient-to-r from-[#77BC1F] to-[#5ea113] text-slate-950 shadow-md'
                        : 'text-slate-400 hover:text-white hover:bg-slate-800'
                    }`}
                  >
                    {btn.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Quick Metrics Badges */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800/80">
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Period Total</span>
              <p className="text-base font-black text-white mt-0.5">{formatCurrency(chartSummary.total)}</p>
            </div>
            <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800/80">
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Daily Average</span>
              <p className="text-base font-black text-emerald-400 mt-0.5">{formatCurrency(chartSummary.avg)}</p>
            </div>
            <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800/80">
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Peak Sales Day</span>
              <p className="text-base font-black text-amber-400 mt-0.5">
                {chartSummary.peak.sales > 0
                  ? `${chartSummary.peak.day} (${formatCurrency(chartSummary.peak.sales)})`
                  : lang === 'en' ? 'No sales yet' : 'មិនទាន់មានលក់'}
              </p>
            </div>
            <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800/80">
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Total Orders</span>
              <p className="text-base font-black text-blue-400 mt-0.5">{chartSummary.totalOrders} invoices</p>
            </div>
          </div>

          {/* Bar Chart Canvas with Hover Tooltips */}
          <div className="relative pt-4 pb-2">
            {/* Horizontal Grid Milestone Lines */}
            <div className="absolute inset-0 top-4 bottom-10 flex flex-col justify-between pointer-events-none opacity-20">
              <div className="border-b border-slate-500 border-dashed w-full flex justify-end text-[10px] pr-2 text-slate-400">{formatCurrency(scaleMax)}</div>
              <div className="border-b border-slate-500 border-dashed w-full flex justify-end text-[10px] pr-2 text-slate-400">{formatCurrency(scaleMax * 0.66)}</div>
              <div className="border-b border-slate-500 border-dashed w-full flex justify-end text-[10px] pr-2 text-slate-400">{formatCurrency(scaleMax * 0.33)}</div>
              <div className="border-b border-slate-500 w-full flex justify-end text-[10px] pr-2 text-slate-400">$0.00</div>
            </div>

            {/* Bars Flex Container */}
            <div className="relative z-10 flex items-end justify-between gap-1.5 sm:gap-3 h-56 px-2">
              {dailySales.map((day, idx) => {
                const hasSales = day.sales > 0
                const heightPercent = hasSales ? Math.max(8, (day.sales / scaleMax) * 100) : 0
                const isHovered = hoveredDay && hoveredDay.dateStr === day.dateStr

                return (
                  <div
                    key={idx}
                    onMouseEnter={() => setHoveredDay(day)}
                    onMouseLeave={() => setHoveredDay(null)}
                    className="group relative flex flex-1 flex-col items-center justify-end h-full cursor-pointer"
                  >
                    {/* Floating Hover Card */}
                    {isHovered && (
                      <div className="absolute bottom-full mb-3 z-30 pointer-events-none transition-all duration-200 animate-in fade-in zoom-in-95">
                        <div className="rounded-xl border border-slate-700 bg-slate-900/95 p-2.5 text-center shadow-2xl backdrop-blur-md min-w-[130px]">
                          <p className="text-[11px] font-black text-white">{day.fullDay}, {day.date}</p>
                          <p className={`text-sm font-black mt-0.5 ${hasSales ? 'text-[#77BC1F]' : 'text-slate-400'}`}>
                            {formatCurrency(day.sales)}
                          </p>
                          <p className="text-[10px] text-slate-400 mt-0.5">
                            {day.invoicesCount} Invoices • Paid: {formatCurrency(day.paid)}
                          </p>
                          {day.isToday && (
                            <span className="inline-block mt-1 px-1.5 py-0.5 rounded bg-orange-500/20 text-orange-400 text-[9px] font-black uppercase">
                              Today
                            </span>
                          )}
                        </div>
                        {/* Tooltip caret */}
                        <div className="w-2.5 h-2.5 bg-slate-900 border-r border-b border-slate-700 rotate-45 mx-auto -mt-1"></div>
                      </div>
                    )}

                    {/* Amount Label on Top of Bar (For <= 14 days) */}
                    {chartDays <= 14 && (
                      <span className={`mb-1.5 text-[10px] font-bold transition ${
                        isHovered
                          ? 'text-white scale-110 font-black'
                          : hasSales
                          ? day.isToday ? 'text-orange-400 font-bold' : 'text-slate-300'
                          : 'text-slate-600'
                      }`}>
                        {hasSales ? `$${Math.round(day.sales)}` : '$0'}
                      </span>
                    )}

                    {/* Bar Pillar */}
                    <div className="w-full max-w-[40px] relative flex items-end justify-center">
                      {hasSales ? (
                        <div
                          className={`w-full rounded-t-xl transition-all duration-500 ${
                            day.isToday
                              ? 'bg-gradient-to-t from-orange-600 via-orange-500 to-amber-400 shadow-lg shadow-orange-500/30'
                              : isHovered
                              ? 'bg-gradient-to-t from-[#77BC1F] via-[#8ad628] to-[#bbf758] shadow-lg shadow-green-500/40 brightness-125 scale-105'
                              : 'bg-gradient-to-t from-[#5ea113] via-[#77BC1F] to-[#9DD948] hover:brightness-110'
                          }`}
                          style={{ height: `${heightPercent}%` }}
                        >
                          {/* Shimmer top reflection */}
                          <div className="w-full h-1.5 bg-white/40 rounded-t-xl"></div>
                        </div>
                      ) : (
                        <div className={`w-full h-1.5 rounded-full transition ${
                          isHovered ? 'bg-slate-500 scale-125' : 'bg-slate-800'
                        }`} />
                      )}
                    </div>

                    {/* X-Axis Date Labels */}
                    <div className="text-center mt-2.5">
                      <div className={`text-[11px] font-bold transition ${
                        day.isToday ? 'text-orange-400 font-black' : isHovered ? 'text-white' : 'text-slate-300'
                      }`}>
                        {day.day}
                      </div>
                      <div className="text-[9px] text-slate-500 hidden sm:block">{day.date}</div>
                    </div>
                  </div>
                )
              })}
            </div>

            {/* If 0 sales in the period, show helpful prompt */}
            {chartSummary.total === 0 && (
              <div className="mt-4 p-4 rounded-xl border border-slate-800 bg-slate-950/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-center sm:text-left">
                <div className="flex items-center gap-3 justify-center sm:justify-start">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div className="text-left">
                    <p className="text-xs font-bold text-white">
                      {lang === 'en' ? 'No sales recorded in this period' : 'មិនទាន់មានការលក់ក្នុងរយៈពេលនេះទេ'}
                    </p>
                    <p className="text-[11px] text-slate-400">
                      {lang === 'en'
                        ? 'Create a sale invoice to start tracking live revenue on the chart.'
                        : 'បង្កើតវិក័យប័ត្រលក់ថ្មីដើម្បីចាប់ផ្តើមតាមដានចំណូលផ្ទាល់នៅលើគំនូសតាង។'}
                    </p>
                  </div>
                </div>
                <Link
                  to="/admin/sale-dashboard/sale-invoice/create"
                  className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-[#77BC1F] to-[#5ea113] hover:from-[#65a317] hover:to-[#4e880e] text-slate-950 text-xs font-black uppercase tracking-wider shadow-md transition active:scale-95"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4" />
                  </svg>
                  {lang === 'en' ? '+ Create Invoice' : '+ បង្កើតវិក័យប័ត្រ'}
                </Link>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* CATEGORY TABS + SEARCH */}
      <section className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="inline-flex gap-2 rounded-xl border border-slate-700/60 bg-slate-900/80 p-1 shadow-lg backdrop-blur-sm">
          {[
            { key: 'all', label: t.all },
            { key: 'customer', label: text[lang].customerManagement },
            { key: 'invoice', label: text[lang].invoiceManagement },
            { key: 'promotion', label: text[lang].promotions },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveCategory(tab.key)}
              className={`rounded-lg px-4 py-2 text-sm font-bold uppercase tracking-wide transition ${
                activeCategory === tab.key
                  ? 'bg-[#7EB631] text-white shadow-md'
                  : 'text-slate-400 hover:bg-slate-800 hover:text-white'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="relative">
          <input
            type="text"
            placeholder={t.searchPlaceholder}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-xl border border-slate-700/60 bg-slate-900/80 py-2.5 pl-11 pr-4 text-sm text-white placeholder-slate-500 shadow-lg backdrop-blur-sm transition focus:border-[#7EB631] focus:outline-none focus:ring-2 focus:ring-[#7EB631]/50 sm:w-80"
          />
          <svg
            className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            viewBox="0 0 24 24"
          >
            <path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
      </section>

      {/* CUSTOMER MANAGEMENT */}
      {(activeCategory === 'all' || activeCategory === 'customer') && customerFiltered.length > 0 && (
        <section className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="h-1 w-1 rounded-full bg-[#7EB631]" />
            <h2 className="text-xl font-black uppercase tracking-tight text-white">{text[lang].customerManagement}</h2>
            <div className="h-px flex-1 bg-gradient-to-r from-slate-700 to-transparent" />
            <span className="rounded-full bg-slate-800/80 px-3 py-1 text-xs font-bold text-slate-400">
              {customerFiltered.length}
            </span>
          </div>
          <p className="text-sm text-slate-400">{text[lang].customerSubtitle}</p>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {customerFiltered.map((module) => (
              <Link
                key={module.key}
                to={`/admin/sale-dashboard/${module.key}`}
                className="hub-card group relative overflow-hidden rounded-2xl border border-slate-700/60 bg-gradient-to-br from-slate-800/80 to-slate-900/80 p-5 text-left shadow-xl backdrop-blur-sm transition hover:border-[#7EB631]/50 hover:shadow-2xl"
              >
                <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full opacity-10 blur-2xl" style={{ background: module.color }} />

                <div className="relative space-y-3">
                  <div className="flex items-start justify-between">
                    <div className="hub-icon flex h-14 w-14 items-center justify-center rounded-xl" style={{ background: module.bg }}>
                      <img src={module.icon} alt="" className="h-9 w-9" />
                    </div>
                    {module.tag && (
                      <span
                        className="rounded-md px-2 py-1 text-[10px] font-black uppercase tracking-wider"
                        style={{ background: module.bg, color: module.color }}
                      >
                        {module.tag}
                      </span>
                    )}
                  </div>

                  <div>
                    <h3 className="text-base font-bold text-white">{lang === 'en' ? module.en : module.kh}</h3>
                    <p className="mt-1 text-xs leading-relaxed text-slate-400">
                      {lang === 'en' ? module.descEn : module.descKh}
                    </p>
                  </div>

                  <div className="flex items-center gap-1.5 pt-2 text-xs font-bold" style={{ color: module.color }}>
                    <span>{lang === 'en' ? 'Open' : 'បើក'}</span>
                    <svg className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24">
                      <path d="M9 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* INVOICE MANAGEMENT */}
      {(activeCategory === 'all' || activeCategory === 'invoice') && invoiceFiltered.length > 0 && (
        <section className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="h-1 w-1 rounded-full bg-[#FF9900]" />
            <h2 className="text-xl font-black uppercase tracking-tight text-white">{text[lang].invoiceManagement}</h2>
            <div className="h-px flex-1 bg-gradient-to-r from-slate-700 to-transparent" />
            <span className="rounded-full bg-slate-800/80 px-3 py-1 text-xs font-bold text-slate-400">
              {invoiceFiltered.length}
            </span>
          </div>
          <p className="text-sm text-slate-400">{text[lang].invoiceSubtitle}</p>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {invoiceFiltered.map((module) => (
              <Link
                key={module.key}
                to={`/admin/sale-dashboard/${module.key}`}
                className="hub-card group relative overflow-hidden rounded-2xl border border-slate-700/60 bg-gradient-to-br from-slate-800/80 to-slate-900/80 p-5 text-left shadow-xl backdrop-blur-sm transition hover:border-[#FF9900]/50 hover:shadow-2xl"
              >
                <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full opacity-10 blur-2xl" style={{ background: module.color }} />

                <div className="relative space-y-3">
                  <div className="flex items-start justify-between">
                    <div className="hub-icon flex h-14 w-14 items-center justify-center rounded-xl" style={{ background: module.bg }}>
                      <img src={module.icon} alt="" className="h-9 w-9" />
                    </div>
                    {module.tag && (
                      <span
                        className="rounded-md px-2 py-1 text-[10px] font-black uppercase tracking-wider"
                        style={{ background: module.bg, color: module.color }}
                      >
                        {module.tag}
                      </span>
                    )}
                  </div>

                  <div>
                    <h3 className="text-base font-bold text-white">{lang === 'en' ? module.en : module.kh}</h3>
                    <p className="mt-1 text-xs leading-relaxed text-slate-400">
                      {lang === 'en' ? module.descEn : module.descKh}
                    </p>
                  </div>

                  <div className="flex items-center gap-1.5 pt-2 text-xs font-bold" style={{ color: module.color }}>
                    <span>{lang === 'en' ? 'Open' : 'បើក'}</span>
                    <svg className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24">
                      <path d="M9 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* PROMOTIONS */}
      {(activeCategory === 'all' || activeCategory === 'promotion') && promotionFiltered.length > 0 && (
        <section className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="h-1 w-1 rounded-full bg-[#3B82F6]" />
            <h2 className="text-xl font-black uppercase tracking-tight text-white">{text[lang].promotions}</h2>
            <div className="h-px flex-1 bg-gradient-to-r from-slate-700 to-transparent" />
            <span className="rounded-full bg-slate-800/80 px-3 py-1 text-xs font-bold text-slate-400">
              {promotionFiltered.length}
            </span>
          </div>
          <p className="text-sm text-slate-400">{text[lang].promotionSubtitle}</p>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {promotionFiltered.map((module) => (
              <Link
                key={module.key}
                to={`/admin/sale-dashboard/${module.key}`}
                className="hub-card group relative overflow-hidden rounded-2xl border border-slate-700/60 bg-gradient-to-br from-slate-800/80 to-slate-900/80 p-5 text-left shadow-xl backdrop-blur-sm transition hover:border-[#3B82F6]/50 hover:shadow-2xl"
              >
                <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full opacity-10 blur-2xl" style={{ background: module.color }} />

                <div className="relative space-y-3">
                  <div className="flex items-start justify-between">
                    <div className="hub-icon flex h-14 w-14 items-center justify-center rounded-xl" style={{ background: module.bg }}>
                      <img src={module.icon} alt="" className="h-9 w-9" />
                    </div>
                    {module.tag && (
                      <span
                        className="rounded-md px-2 py-1 text-[10px] font-black uppercase tracking-wider"
                        style={{ background: module.bg, color: module.color }}
                      >
                        {module.tag}
                      </span>
                    )}
                  </div>

                  <div>
                    <h3 className="text-base font-bold text-white">{lang === 'en' ? module.en : module.kh}</h3>
                    <p className="mt-1 text-xs leading-relaxed text-slate-400">
                      {lang === 'en' ? module.descEn : module.descKh}
                    </p>
                  </div>

                  <div className="flex items-center gap-1.5 pt-2 text-xs font-bold" style={{ color: module.color }}>
                    <span>{lang === 'en' ? 'Open' : 'បើក'}</span>
                    <svg className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24">
                      <path d="M9 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* NO RESULTS */}
      {filteredModules.length === 0 && (
        <div className="flex min-h-[300px] items-center justify-center rounded-2xl border border-slate-700/60 bg-slate-900/50">
          <div className="text-center">
            <p className="text-lg font-bold text-slate-400">{t.noResults}</p>
            <p className="mt-2 text-sm text-slate-500">Try adjusting your search or filter</p>
          </div>
        </div>
      )}
    </div>
  )
}
