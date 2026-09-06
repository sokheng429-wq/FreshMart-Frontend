import React, { useState, useEffect, useMemo, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { useLanguage } from '../../context/LanguageContext'
import { useNotifications } from '../../context/NotificationContext'
import {
  adminAgingInvoiceAPI,
  adminSaleInvoiceAPI,
  adminCustomerAPI,
  adminCustomerGroupAPI,
} from '../../api/api'
import { exportStyledExcel } from '../../utils/excelExport'
import chartIcon from '../../assets/icon/3dicons-chart-dynamic-color.png'
import './ProductsHub.css'

// Available columns for Choose Column modal & table
const ALL_COLUMNS = [
  { key: 'code', label: { en: 'Code', kh: 'លេខកូដ' }, always: true },
  { key: 'date', label: { en: 'Date', kh: 'កាលបរិច្ឆេទ' }, always: true },
  { key: 'dueDate', label: { en: 'Due Date', kh: 'ថ្ងៃផុតកំណត់' }, always: true },
  { key: 'customer', label: { en: 'Customer', kh: 'អតិថិជន' }, always: true },
  { key: 'contactName', label: { en: 'Contact Name', kh: 'អ្នកទំនាក់ទំនង' } },
  { key: 'phone', label: { en: 'Phone', kh: 'ទូរស័ព្ទ' } },
  { key: 'status', label: { en: 'Status', kh: 'ស្ថានភាព' }, always: true },
  { key: 'grandTotal', label: { en: 'Grand Total', kh: 'សរុប ($)' }, always: true },
  { key: 'balance', label: { en: 'Balance', kh: 'សមតុល្យ ($)' }, always: true },
  { key: 'agingType', label: { en: 'Aging Type', kh: 'ប្រភេទអាយុកាល' } },
  { key: 'daysOverdue', label: { en: 'Days Overdue', kh: 'ថ្ងៃហួសកំណត់' } },
  { key: 'salesperson', label: { en: 'Salesperson', kh: 'អ្នកលក់' } },
  { key: 'customerGroup', label: { en: 'Customer Group', kh: 'ក្រុមអតិថិជន' } },
]

const DEFAULT_VISIBLE_COLUMNS = [
  'code',
  'date',
  'dueDate',
  'customer',
  'contactName',
  'phone',
  'status',
  'grandTotal',
  'balance',
  'agingType',
]

// Aging Buckets Definition
const AGING_BUCKETS = [
  { key: 'ALL', labelEn: 'All Aging Types', labelKh: 'គ្រប់ប្រភេទអាយុកាល', color: 'slate' },
  { key: 'CURRENT', labelEn: 'Current invoice', labelKh: 'វិក័យប័ត្របច្ចុប្បន្ន', color: 'emerald', daysRange: '0 Days' },
  { key: '1_30', labelEn: '1 - 30 Days', labelKh: '១ - ៣០ ថ្ងៃ', color: 'amber', daysRange: '1-30 Days' },
  { key: '31_60', labelEn: '31 60', labelKh: '៣១ - ៦០ ថ្ងៃ', color: 'orange', daysRange: '31-60 Days' },
  { key: '61_90', labelEn: '61 90', labelKh: '៦១ - ៩០ ថ្ងៃ', color: 'rose', daysRange: '61-90 Days' },
  { key: '91_120', labelEn: '91 120', labelKh: '៩១ - ១២០ ថ្ងៃ', color: 'red', daysRange: '91-120 Days' },
  { key: 'OVER_120', labelEn: 'Over 120 Days Remain', labelKh: 'លើសពី ១២០ ថ្ងៃ', color: 'purple', daysRange: '> 120 Days' },
]

// Helper to determine aging bucket from dueDate
function calculateAgingBucket(dueDateStr) {
  if (!dueDateStr) return { type: 'CURRENT', days: 0 }
  const due = new Date(dueDateStr)
  if (isNaN(due.getTime())) return { type: 'CURRENT', days: 0 }

  const today = new Date()
  today.setHours(0, 0, 0, 0)
  due.setHours(0, 0, 0, 0)

  const diffTime = today.getTime() - due.getTime()
  const days = Math.floor(diffTime / (1000 * 60 * 60 * 24))

  if (days <= 0) return { type: 'CURRENT', days: 0 }
  if (days <= 30) return { type: '1_30', days }
  if (days <= 60) return { type: '31_60', days }
  if (days <= 90) return { type: '61_90', days }
  if (days <= 120) return { type: '91_120', days }
  return { type: 'OVER_120', days }
}

export default function AgingInvoiceList() {
  const { lang } = useLanguage()
  const { addNotification } = useNotifications()

  // State: Data
  const [invoices, setInvoices] = useState([])
  const [loading, setLoading] = useState(true)

  // State: Search & Filters
  const [searchText, setSearchText] = useState('')
  // Search By: Any - Code - Date - Phone - Customer - Contact Name
  const [searchBy, setSearchBy] = useState('any')
  // Aging Type: Current invoice - 1 - 30 Days - 31 60 - 61 90 - 91 120 - Over 120 Days Remain
  const [agingType, setAgingType] = useState('ALL')

  // Advance Filter State
  const [advanceOpen, setAdvanceOpen] = useState(false)
  const [salespersonFilter, setSalespersonFilter] = useState('all')
  const [customerFilter, setCustomerFilter] = useState('all')
  const [customerGroupFilter, setCustomerGroupFilter] = useState('all')

  // Live Dropdown Catalogs
  const [salespersons, setSalespersons] = useState([])
  const [customers, setCustomers] = useState([])
  const [customerGroups, setCustomerGroups] = useState([])

  // Choose Column Modal State
  const [chooseColumnOpen, setChooseColumnOpen] = useState(false)
  const [visibleColumns, setVisibleColumns] = useState(DEFAULT_VISIBLE_COLUMNS)

  // Load live dropdown data (customers & groups)
  useEffect(() => {
    async function loadCatalogs() {
      try {
        const [cRes, gRes] = await Promise.allSettled([
          adminCustomerAPI.getAll(),
          adminCustomerGroupAPI.getAll(),
        ])
        if (cRes.status === 'fulfilled' && cRes.value) {
          const list = cRes.value.data || cRes.value || []
          if (Array.isArray(list)) setCustomers(list)
        }
        if (gRes.status === 'fulfilled' && gRes.value) {
          const list = gRes.value.data || gRes.value || []
          if (Array.isArray(list)) setCustomerGroups(list)
        }
      } catch {
        // Catalogs optional
      }
    }
    loadCatalogs()
  }, [])

  // Load Invoices from Backend with live fallback
  const loadAgingInvoices = useCallback(async () => {
    setLoading(true)
    try {
      // 1. Try dedicated Aging Invoices endpoint
      const params = {}
      if (searchText.trim()) params.search = searchText.trim()
      if (searchBy && searchBy !== 'any') params.searchBy = searchBy
      if (agingType && agingType !== 'ALL') params.agingType = agingType
      if (salespersonFilter && salespersonFilter !== 'all') params.salesperson = salespersonFilter
      if (customerFilter && customerFilter !== 'all') params.customer = customerFilter
      if (customerGroupFilter && customerGroupFilter !== 'all') params.customerGroup = customerGroupFilter

      let res = await adminAgingInvoiceAPI.getAll(params).catch(() => null)
      let data = res?.data != null ? res.data : (Array.isArray(res) ? res : null)

      // 2. If dedicated endpoint returned empty or failed, load directly from live sale-invoices!
      if (!data || data.length === 0) {
        const invRes = await adminSaleInvoiceAPI.getAll().catch(() => null)
        const liveInvoices = invRes?.data != null ? invRes.data : (Array.isArray(invRes) ? invRes : [])

        if (Array.isArray(liveInvoices) && liveInvoices.length > 0) {
          data = liveInvoices.map((inv) => {
            const dueDate = inv.dueDate || inv.invoiceDate
            const { type, days } = calculateAgingBucket(dueDate)
            return {
              id: inv.id,
              code: inv.invoiceCode || `INV-${inv.id}`,
              date: inv.invoiceDate || '',
              dueDate: dueDate || '',
              customer: inv.customerName || 'Customer',
              contactName: inv.billingName || inv.shippingRecipient || inv.customerName || '',
              phone: inv.customerPhone || inv.billingPhone || '',
              status: inv.status || 'UNPAID',
              grandTotal: Number(inv.grandTotal || 0),
              balance: Number(inv.balance != null ? inv.balance : inv.grandTotal || 0),
              salesperson: inv.salesperson || '',
              customerGroup: '',
              daysOverdue: days,
              agingType: type,
            }
          })
        }
      }

      const finalList = Array.isArray(data) ? data : []
      setInvoices(finalList)

      // Extract distinct salespersons from live data
      const distinctSalespersons = Array.from(
        new Set(finalList.map((i) => i.salesperson).filter(Boolean))
      )
      if (distinctSalespersons.length > 0) {
        setSalespersons(distinctSalespersons)
      }
    } catch {
      // Keep state
    } finally {
      setLoading(false)
    }
  }, [searchText, searchBy, agingType, salespersonFilter, customerFilter, customerGroupFilter])

  useEffect(() => {
    loadAgingInvoices()
  }, [loadAgingInvoices])

  // Filtered Invoices in Memory
  const displayedInvoices = useMemo(() => {
    return invoices.filter((inv) => {
      // 1. Aging Type Filter
      if (agingType !== 'ALL') {
        const itemType = inv.agingType || calculateAgingBucket(inv.dueDate).type
        if (itemType !== agingType) return false
      }

      // 2. Advance: Salesperson Filter
      if (salespersonFilter !== 'all' && salespersonFilter) {
        if (!inv.salesperson || !inv.salesperson.toLowerCase().includes(salespersonFilter.toLowerCase())) {
          return false
        }
      }

      // 3. Advance: Customer Filter
      if (customerFilter !== 'all' && customerFilter) {
        if (!inv.customer || !inv.customer.toLowerCase().includes(customerFilter.toLowerCase())) {
          return false
        }
      }

      // 4. Advance: Customer Group Filter
      if (customerGroupFilter !== 'all' && customerGroupFilter) {
        if (!inv.customerGroup || !inv.customerGroup.toLowerCase().includes(customerGroupFilter.toLowerCase())) {
          return false
        }
      }

      // 5. Search Text Filter
      if (!searchText.trim()) return true
      const q = searchText.trim().toLowerCase()

      switch (searchBy) {
        case 'code':
          return (inv.code || '').toLowerCase().includes(q)
        case 'date':
          return (inv.date || '').toLowerCase().includes(q) || (inv.dueDate || '').toLowerCase().includes(q)
        case 'phone':
          return (inv.phone || '').toLowerCase().includes(q)
        case 'customer':
          return (inv.customer || '').toLowerCase().includes(q)
        case 'contactName':
        case 'contact':
          return (inv.contactName || '').toLowerCase().includes(q)
        case 'any':
        default:
          return (
            (inv.code || '').toLowerCase().includes(q) ||
            (inv.customer || '').toLowerCase().includes(q) ||
            (inv.contactName || '').toLowerCase().includes(q) ||
            (inv.phone || '').toLowerCase().includes(q) ||
            (inv.date || '').toLowerCase().includes(q) ||
            (inv.status || '').toLowerCase().includes(q)
          )
      }
    })
  }, [invoices, agingType, salespersonFilter, customerFilter, customerGroupFilter, searchText, searchBy])

  // Aggregate KPI Statistics
  const stats = useMemo(() => {
    let totalInvoices = invoices.length
    let totalReceivable = 0
    let totalGrandTotal = 0
    const buckets = {
      CURRENT: { count: 0, balance: 0 },
      '1_30': { count: 0, balance: 0 },
      '31_60': { count: 0, balance: 0 },
      '61_90': { count: 0, balance: 0 },
      '91_120': { count: 0, balance: 0 },
      OVER_120: { count: 0, balance: 0 },
    }

    invoices.forEach((inv) => {
      const bal = Number(inv.balance || 0)
      const gt = Number(inv.grandTotal || 0)
      totalReceivable += bal
      totalGrandTotal += gt

      const type = inv.agingType || calculateAgingBucket(inv.dueDate).type
      if (buckets[type]) {
        buckets[type].count += 1
        buckets[type].balance += bal
      }
    })

    return {
      totalInvoices,
      totalReceivable,
      totalGrandTotal,
      buckets,
    }
  }, [invoices])

  // Column Chooser helpers
  const toggleColumn = (colKey) => {
    const colDef = ALL_COLUMNS.find((c) => c.key === colKey)
    if (colDef?.always) return
    setVisibleColumns((prev) =>
      prev.includes(colKey) ? prev.filter((k) => k !== colKey) : [...prev, colKey]
    )
  }

  const selectAllColumns = () => {
    setVisibleColumns(ALL_COLUMNS.map((c) => c.key))
  }

  const resetDefaultColumns = () => {
    setVisibleColumns(DEFAULT_VISIBLE_COLUMNS)
  }

  // Export to Excel handler
  const handleExportExcel = () => {
    if (displayedInvoices.length === 0) {
      addNotification?.('No invoices available to export.', 'warning')
      return
    }

    const headers = [
      'Invoice Code',
      'Invoice Date',
      'Due Date',
      'Customer',
      'Contact Name',
      'Phone',
      'Status',
      'Grand Total ($)',
      'Balance ($)',
      'Aging Bucket',
      'Days Overdue',
      'Salesperson',
      'Customer Group',
    ]

    const data = displayedInvoices.map((inv) => [
      inv.code || '',
      inv.date || '',
      inv.dueDate || '',
      inv.customer || '',
      inv.contactName || '',
      inv.phone || '',
      inv.status || '',
      Number(inv.grandTotal || 0).toFixed(2),
      Number(inv.balance || 0).toFixed(2),
      inv.agingType || '',
      inv.daysOverdue != null ? inv.daysOverdue : 0,
      inv.salesperson || '',
      inv.customerGroup || '',
    ])

    const totalBalance = displayedInvoices.reduce((sum, i) => sum + Number(i.balance || 0), 0)
    const totalGrand = displayedInvoices.reduce((sum, i) => sum + Number(i.grandTotal || 0), 0)

    try {
      exportStyledExcel({
        filename: `aging-invoices-${new Date().toISOString().slice(0, 10)}.xlsx`,
        sheetName: 'Aging Invoices',
        title: "FRESHMART AGING INVOICE REPORT",
        subtitle: `Filter: ${agingType} · Total Balance: $${totalBalance.toFixed(2)}`,
        headers,
        data,
        summary: {
          'Total Invoices': displayedInvoices.length,
          'Total Grand Total ($)': `$${totalGrand.toFixed(2)}`,
          'Total Balance ($)': `$${totalBalance.toFixed(2)}`,
        },
      })
      addNotification?.('Aging invoice report exported to Excel successfully!', 'success')
    } catch {
      addNotification?.('Failed to export Excel file. Please try again.', 'error')
    }
  }

  // Reset advance filters
  const resetFilters = () => {
    setSearchText('')
    setSearchBy('any')
    setAgingType('ALL')
    setSalespersonFilter('all')
    setCustomerFilter('all')
    setCustomerGroupFilter('all')
  }

  return (
    <div className="min-h-screen bg-slate-950 p-4 sm:p-6 lg:p-8 space-y-6 text-slate-100 font-['Montserrat']">
      {/* 1. TOP HEADER & BREADCRUMBS */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-400 mb-1">
            <Link to="/admin" className="hover:text-purple-400 transition">
              {lang === 'en' ? 'Dashboard' : 'ផ្ទាំងគ្រប់គ្រង'}
            </Link>
            <span>/</span>
            <Link to="/admin/sale-payment" className="hover:text-purple-400 transition">
              {lang === 'en' ? 'Sale Payment' : 'ការទូទាត់លក់'}
            </Link>
            <span>/</span>
            <span className="text-purple-400 font-semibold">
              {lang === 'en' ? 'Aging Invoice' : 'វិក័យប័ត្រតាមកាលកំណត់'}
            </span>
          </div>
          <div className="flex items-center gap-3">
            <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-purple-500/15 border border-purple-500/30 text-2xl shadow-lg shadow-purple-500/10">
              <img src={chartIcon} alt="" className="h-7 w-7 object-contain" />
            </span>
            <div>
              <h1 className="text-2xl font-black tracking-tight text-white flex items-center gap-2 font-['Montserrat']">
                {lang === 'en' ? 'Aging Invoice' : 'វិក័យប័ត្រតាមកាលកំណត់'}
                <span className="rounded-full bg-purple-500/20 px-2.5 py-0.5 text-xs font-bold text-purple-300 border border-purple-500/30">
                  Live
                </span>
              </h1>
              <p className="text-xs text-slate-400 mt-0.5">
                {lang === 'en'
                  ? 'Accounts receivable aging analysis, overdue debt buckets, and payment risk tracking.'
                  : 'វិភាគវិក័យប័ត្រជំពាក់តាមកាលកំណត់ និងតាមដានបំណុលហួសកាលបរិច្ឆេទ។'}
              </p>
            </div>
          </div>
        </div>

        {/* Back Link */}
        <div className="flex items-center gap-2">
          <Link
            to="/admin/sale-payment"
            className="inline-flex items-center gap-2 rounded-xl border border-slate-800 bg-slate-900/90 px-3.5 py-2 text-xs font-semibold text-slate-300 hover:border-purple-400 hover:text-white transition active:scale-95"
          >
            <span>←</span>
            <span>{lang === 'en' ? 'Back to Sale Payment' : 'ត្រឡប់ទៅការទូទាត់'}</span>
          </Link>
        </div>
      </div>

      {/* 2. AGING SUMMARY KPI CARDS */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
        {/* Total Receivables Card */}
        <div className="col-span-2 sm:col-span-4 lg:col-span-1 rounded-2xl border border-purple-500/40 bg-gradient-to-br from-purple-950/40 to-slate-900 p-3.5 shadow-lg shadow-purple-950/20">
          <p className="text-[10px] uppercase font-bold tracking-wider text-purple-300">
            {lang === 'en' ? 'Total Receivables' : 'បំណុលត្រូវប្រមូល'}
          </p>
          <p className="text-lg font-black text-white mt-1">
            ${stats.totalReceivable.toFixed(2)}
          </p>
          <p className="text-[10px] text-slate-400 mt-0.5">
            {stats.totalInvoices} {lang === 'en' ? 'Invoices' : 'វិក័យប័ត្រ'}
          </p>
        </div>

        {/* Current (0 Days) */}
        <div
          onClick={() => setAgingType('CURRENT')}
          className={`cursor-pointer rounded-2xl border p-3.5 transition hover:brightness-110 ${agingType === 'CURRENT'
            ? 'border-emerald-400 bg-emerald-950/40 ring-2 ring-emerald-400/20'
            : 'border-slate-800 bg-slate-900/60'
            }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-emerald-400 uppercase">Current</span>
            <span className="text-[10px] text-slate-400">0d</span>
          </div>
          <p className="text-base font-black text-emerald-300 mt-1">
            ${stats.buckets.CURRENT.balance.toFixed(2)}
          </p>
          <p className="text-[10px] text-slate-400">{stats.buckets.CURRENT.count} inv</p>
        </div>

        {/* 1 - 30 Days */}
        <div
          onClick={() => setAgingType('1_30')}
          className={`cursor-pointer rounded-2xl border p-3.5 transition hover:brightness-110 ${agingType === '1_30'
            ? 'border-amber-400 bg-amber-950/40 ring-2 ring-amber-400/20'
            : 'border-slate-800 bg-slate-900/60'
            }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-amber-400 uppercase">1 - 30 D</span>
            <span className="text-[10px] text-slate-400">1-30d</span>
          </div>
          <p className="text-base font-black text-amber-300 mt-1">
            ${stats.buckets['1_30'].balance.toFixed(2)}
          </p>
          <p className="text-[10px] text-slate-400">{stats.buckets['1_30'].count} inv</p>
        </div>

        {/* 31 - 60 Days */}
        <div
          onClick={() => setAgingType('31_60')}
          className={`cursor-pointer rounded-2xl border p-3.5 transition hover:brightness-110 ${agingType === '31_60'
            ? 'border-orange-400 bg-orange-950/40 ring-2 ring-orange-400/20'
            : 'border-slate-800 bg-slate-900/60'
            }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-orange-400 uppercase">31 - 60 D</span>
            <span className="text-[10px] text-slate-400">31-60d</span>
          </div>
          <p className="text-base font-black text-orange-300 mt-1">
            ${stats.buckets['31_60'].balance.toFixed(2)}
          </p>
          <p className="text-[10px] text-slate-400">{stats.buckets['31_60'].count} inv</p>
        </div>

        {/* 61 - 90 Days */}
        <div
          onClick={() => setAgingType('61_90')}
          className={`cursor-pointer rounded-2xl border p-3.5 transition hover:brightness-110 ${agingType === '61_90'
            ? 'border-rose-400 bg-rose-950/40 ring-2 ring-rose-400/20'
            : 'border-slate-800 bg-slate-900/60'
            }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-rose-400 uppercase">61 - 90 D</span>
            <span className="text-[10px] text-slate-400">61-90d</span>
          </div>
          <p className="text-base font-black text-rose-300 mt-1">
            ${stats.buckets['61_90'].balance.toFixed(2)}
          </p>
          <p className="text-[10px] text-slate-400">{stats.buckets['61_90'].count} inv</p>
        </div>

        {/* 91 - 120 Days */}
        <div
          onClick={() => setAgingType('91_120')}
          className={`cursor-pointer rounded-2xl border p-3.5 transition hover:brightness-110 ${agingType === '91_120'
            ? 'border-red-500 bg-red-950/40 ring-2 ring-red-500/20'
            : 'border-slate-800 bg-slate-900/60'
            }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-red-400 uppercase">91 - 120 D</span>
            <span className="text-[10px] text-slate-400">91-120d</span>
          </div>
          <p className="text-base font-black text-red-300 mt-1">
            ${stats.buckets['91_120'].balance.toFixed(2)}
          </p>
          <p className="text-[10px] text-slate-400">{stats.buckets['91_120'].count} inv</p>
        </div>

        {/* Over 120 Days */}
        <div
          onClick={() => setAgingType('OVER_120')}
          className={`cursor-pointer rounded-2xl border p-3.5 transition hover:brightness-110 ${agingType === 'OVER_120'
            ? 'border-purple-400 bg-purple-950/40 ring-2 ring-purple-400/20'
            : 'border-slate-800 bg-slate-900/60'
            }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-purple-400 uppercase">&gt; 120 D</span>
            <span className="text-[10px] text-slate-400">&gt;120d</span>
          </div>
          <p className="text-base font-black text-purple-300 mt-1">
            ${stats.buckets.OVER_120.balance.toFixed(2)}
          </p>
          <p className="text-[10px] text-slate-400">{stats.buckets.OVER_120.count} inv</p>
        </div>
      </div>

      {/* 3. SEARCH AGING INVOICE SECTION */}
      <section className="rounded-3xl border border-slate-800 bg-slate-900/70 p-5 sm:p-6 shadow-xl shadow-black/20 space-y-4">
        <div className="flex items-center gap-2 pb-2 border-b border-slate-800/80">
          <div className="h-4 w-1 rounded-full bg-purple-500" />
          <h2 className="text-xs font-bold uppercase tracking-wider text-purple-400 font-['Montserrat']">
            {lang === 'en' ? 'Search Aging invoice' : 'ស្វែងរកវិក័យប័ត្រតាមកាលកំណត់'}
          </h2>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-12 items-end">
          {/* Search - Textbox */}
          <div className="lg:col-span-4">
            <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
              {lang === 'en' ? 'Search' : 'ស្វែងរក'}
            </label>
            <input
              type="text"
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              placeholder={
                lang === 'en'
                  ? 'Search by code, customer, phone, date...'
                  : 'ស្វែងរកតាមកូដ, អតិថិជន, ទូរស័ព្ទ...'
              }
              className="w-full rounded-xl border border-slate-700/80 bg-slate-950/80 py-2 px-3 text-xs text-white placeholder-slate-500 outline-none transition focus:border-purple-400 focus:ring-2 focus:ring-purple-400/20"
            />
          </div>

          {/* Search by - Dropdown - Any - Code - Date - Phone - Customer - Contact Name */}
          <div className="lg:col-span-3">
            <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
              {lang === 'en' ? 'Search by' : 'ស្វែងរកតាម'}
            </label>
            <select
              value={searchBy}
              onChange={(e) => setSearchBy(e.target.value)}
              className="w-full rounded-xl border border-slate-700/80 bg-slate-950/80 py-2 px-3 text-xs text-white outline-none transition focus:border-purple-400"
            >
              <option value="any">{lang === 'en' ? 'Any' : 'ទាំងអស់'}</option>
              <option value="code">{lang === 'en' ? 'Code' : 'លេខកូដ'}</option>
              <option value="date">{lang === 'en' ? 'Date' : 'កាលបរិច្ឆេទ'}</option>
              <option value="phone">{lang === 'en' ? 'Phone' : 'ទូរស័ព្ទ'}</option>
              <option value="customer">{lang === 'en' ? 'Customer' : 'អតិថិជន'}</option>
              <option value="contactName">{lang === 'en' ? 'Contact Name' : 'អ្នកទំនាក់ទំនង'}</option>
            </select>
          </div>

          {/* Aging Type - Dropdown - Current invoice - 1 - 30 Days - 31 60 - 61 90 - 91 120 - Over 120 Days Remain */}
          <div className="lg:col-span-3">
            <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
              {lang === 'en' ? 'Aging Type' : 'ប្រភេទអាយុកាល'}
            </label>
            <select
              value={agingType}
              onChange={(e) => setAgingType(e.target.value)}
              className="w-full rounded-xl border border-slate-700/80 bg-slate-950/80 py-2 px-3 text-xs text-white outline-none transition focus:border-purple-400"
            >
              <option value="ALL">{lang === 'en' ? 'All Aging Types' : 'គ្រប់ប្រភេទអាយុកាល'}</option>
              <option value="CURRENT">{lang === 'en' ? 'Current invoice' : 'វិក័យប័ត្របច្ចុប្បន្ន (Current)'}</option>
              <option value="1_30">{lang === 'en' ? '1 - 30 Days' : '១ - ៣០ ថ្ងៃ'}</option>
              <option value="31_60">{lang === 'en' ? '31 - 60 Days' : '៣១ - ៦០ ថ្ងៃ'}</option>
              <option value="61_90">{lang === 'en' ? '61 - 90 Days' : '៦១ - ៩០ ថ្ងៃ'}</option>
              <option value="91_120">{lang === 'en' ? '91 - 120 Days' : '៩១ - ១២០ ថ្ងៃ'}</option>
              <option value="OVER_120">{lang === 'en' ? 'Over 120 Days Remain' : 'លើសពី ១២០ ថ្ងៃ (Over 120 Days Remain)'}</option>
            </select>
          </div>

          {/* Buttons: Search Button + Advance Button */}
          <div className="lg:col-span-2 flex items-center gap-2">
            <button
              type="button"
              onClick={loadAgingInvoices}
              className="flex-1 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:brightness-110 py-2 px-3 text-xs font-bold text-white transition active:scale-95 shadow-md shadow-purple-600/20 text-center"
            >
              {lang === 'en' ? 'Search' : 'ស្វែងរក'}
            </button>
            <button
              type="button"
              onClick={() => setAdvanceOpen((v) => !v)}
              className={`rounded-xl border px-3 py-2 text-xs font-bold transition active:scale-95 ${advanceOpen
                ? 'border-purple-400 bg-purple-500/20 text-purple-300'
                : 'border-slate-700 bg-slate-950/80 text-slate-300 hover:border-purple-400 hover:text-white'
                }`}
            >
              {lang === 'en' ? 'Advance' : 'កម្រិតខ្ពស់'} {advanceOpen ? '▲' : '▼'}
            </button>
          </div>
        </div>

        {/* Advance Filter Expandable Panel */}
        {advanceOpen && (
          <div className="mt-3 pt-4 border-t border-slate-800 grid grid-cols-1 gap-3 sm:grid-cols-3 bg-slate-950/40 p-4 rounded-2xl">
            {/* Salesperson - Dropdown */}
            <div>
              <label className="block text-[11px] font-bold text-purple-300 uppercase tracking-wider mb-1">
                {lang === 'en' ? 'Salesperson' : 'អ្នកលក់'}
              </label>
              <select
                value={salespersonFilter}
                onChange={(e) => setSalespersonFilter(e.target.value)}
                className="w-full rounded-xl border border-slate-700 bg-slate-900 py-2 px-3 text-xs text-white outline-none focus:border-purple-400"
              >
                <option value="all">{lang === 'en' ? 'All Salespersons' : 'អ្នកលក់ទាំងអស់'}</option>
                {salespersons.map((sp) => (
                  <option key={sp} value={sp}>
                    {sp}
                  </option>
                ))}
              </select>
            </div>

            {/* Customer - Dropdown */}
            <div>
              <label className="block text-[11px] font-bold text-purple-300 uppercase tracking-wider mb-1">
                {lang === 'en' ? 'Customer' : 'អតិថិជន'}
              </label>
              <select
                value={customerFilter}
                onChange={(e) => setCustomerFilter(e.target.value)}
                className="w-full rounded-xl border border-slate-700 bg-slate-900 py-2 px-3 text-xs text-white outline-none focus:border-purple-400"
              >
                <option value="all">{lang === 'en' ? 'All Customers' : 'អតិថិជនទាំងអស់'}</option>
                {customers.map((c) => (
                  <option key={c.id || c.customerName} value={c.customerName}>
                    {c.customerName} {c.code ? `(${c.code})` : ''}
                  </option>
                ))}
              </select>
            </div>

            {/* Customer Group - Dropdown */}
            <div>
              <label className="block text-[11px] font-bold text-purple-300 uppercase tracking-wider mb-1">
                {lang === 'en' ? 'Customer Group' : 'ក្រុមអតិថិជន'}
              </label>
              <select
                value={customerGroupFilter}
                onChange={(e) => setCustomerGroupFilter(e.target.value)}
                className="w-full rounded-xl border border-slate-700 bg-slate-900 py-2 px-3 text-xs text-white outline-none focus:border-purple-400"
              >
                <option value="all">{lang === 'en' ? 'All Groups' : 'ក្រុមទាំងអស់'}</option>
                {customerGroups.map((g) => (
                  <option key={g.id || g.name || g.groupName} value={g.name || g.groupName}>
                    {g.name || g.groupName}
                  </option>
                ))}
              </select>
            </div>

            <div className="sm:col-span-3 flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={resetFilters}
                className="text-xs text-slate-400 hover:text-rose-400 transition"
              >
                {lang === 'en' ? 'Reset All Filters' : 'កំណត់តម្រងឡើងវិញ'}
              </button>
            </div>
          </div>
        )}
      </section>

      {/* 4. AGING INVOICES TABLE SECTION */}
      <section className="rounded-3xl border border-slate-800 bg-slate-900/80 p-5 sm:p-6 shadow-xl shadow-black/20 space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between pb-3 border-b border-slate-800/80">
          <div className="flex items-center gap-3">
            <div className="h-5 w-1.5 rounded-full bg-purple-500" />
            <div>
              <h2 className="text-base font-bold text-white font-['Montserrat']">
                {lang === 'en' ? 'Aging Invoice List' : 'បញ្ជីវិក័យប័ត្រតាមកាលកំណត់'}
              </h2>
              <p className="text-[11px] text-slate-400">
                {lang === 'en'
                  ? `Showing ${displayedInvoices.length} aging records · Live Database`
                  : `បង្ហាញ ${displayedInvoices.length} វិក័យប័ត្រ · ទិន្នន័យផ្ទាល់`}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Choose Column Button */}
            <button
              type="button"
              onClick={() => setChooseColumnOpen(true)}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-950/80 px-3.5 py-1.5 text-xs font-bold text-slate-300 hover:border-purple-400 hover:text-white transition active:scale-95"
            >
              <span>⚙️</span>
              <span>{lang === 'en' ? 'Choose Column' : 'ជ្រើសរើសជួរឈរ'}</span>
            </button>

            {/* Export button as File Excel */}
            <button
              type="button"
              onClick={handleExportExcel}
              className="inline-flex items-center gap-2 rounded-xl bg-emerald-700 hover:bg-emerald-600 px-4 py-1.5 text-xs font-bold text-white transition active:scale-95 shadow-md shadow-emerald-700/25"
            >
              <span>📊</span>
              <span>{lang === 'en' ? 'Export as File Excel' : 'ទាញយកជា Excel'}</span>
            </button>
          </div>
        </div>

        {/* Invoices Table */}
        <div className="overflow-x-auto rounded-2xl border border-slate-800">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950/90 text-[11px] uppercase tracking-wider text-slate-400 font-bold border-b border-slate-800">
              <tr>
                {visibleColumns.includes('code') && <th className="py-3 px-3.5">Code</th>}
                {visibleColumns.includes('date') && <th className="py-3 px-3.5">Date</th>}
                {visibleColumns.includes('dueDate') && <th className="py-3 px-3.5">Due Date</th>}
                {visibleColumns.includes('customer') && <th className="py-3 px-3.5">Customer</th>}
                {visibleColumns.includes('contactName') && <th className="py-3 px-3.5">Contact Name</th>}
                {visibleColumns.includes('phone') && <th className="py-3 px-3.5">Phone</th>}
                {visibleColumns.includes('status') && <th className="py-3 px-3.5 text-center">Status</th>}
                {visibleColumns.includes('grandTotal') && <th className="py-3 px-3.5 text-right">Grand Total</th>}
                {visibleColumns.includes('balance') && <th className="py-3 px-3.5 text-right">Balance</th>}
                {visibleColumns.includes('agingType') && <th className="py-3 px-3.5 text-center">Aging Type</th>}
                {visibleColumns.includes('daysOverdue') && <th className="py-3 px-3.5 text-center">Days Overdue</th>}
                {visibleColumns.includes('salesperson') && <th className="py-3 px-3.5">Salesperson</th>}
                {visibleColumns.includes('customerGroup') && <th className="py-3 px-3.5">Customer Group</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80 bg-slate-900/40">
              {loading && invoices.length === 0 ? (
                <tr>
                  <td colSpan={visibleColumns.length} className="py-12 text-center text-slate-500 font-mono">
                    <span className="inline-block animate-spin mr-2">🌀</span>
                    {lang === 'en' ? 'Loading aging invoices...' : 'កំពុងផ្ទុកទិន្នន័យ...'}
                  </td>
                </tr>
              ) : displayedInvoices.length === 0 ? (
                <tr>
                  <td colSpan={visibleColumns.length} className="py-12 text-center text-slate-500 space-y-2">
                    <div className="text-3xl">📈</div>
                    <p className="font-semibold">
                      {lang === 'en' ? 'No aging invoices found' : 'មិនមានវិក័យប័ត្រឡើយ'}
                    </p>
                    <p className="text-xs text-slate-600">
                      {lang === 'en'
                        ? 'Try adjusting your search criteria or aging type filter'
                        : 'សូមសាកល្បងផ្លាស់ប្តូរពាក្យស្វែងរក ឬតម្រង'}
                    </p>
                  </td>
                </tr>
              ) : (
                displayedInvoices.map((inv) => {
                  const bucketInfo = calculateAgingBucket(inv.dueDate)
                  const currentType = inv.agingType || bucketInfo.type
                  const days = inv.daysOverdue != null ? inv.daysOverdue : bucketInfo.days

                  return (
                    <tr key={inv.id || inv.code} className="hover:bg-slate-800/50 transition">
                      {/* Code */}
                      {visibleColumns.includes('code') && (
                        <td className="py-3 px-3.5 font-mono font-bold text-purple-400 whitespace-nowrap">
                          <span className="bg-purple-500/10 border border-purple-500/25 px-2 py-0.5 rounded-lg">
                            {inv.code}
                          </span>
                        </td>
                      )}

                      {/* Date */}
                      {visibleColumns.includes('date') && (
                        <td className="py-3 px-3.5 whitespace-nowrap text-slate-300">
                          {inv.date}
                        </td>
                      )}

                      {/* Due Date */}
                      {visibleColumns.includes('dueDate') && (
                        <td className="py-3 px-3.5 whitespace-nowrap font-medium text-slate-200">
                          {inv.dueDate}
                        </td>
                      )}

                      {/* Customer */}
                      {visibleColumns.includes('customer') && (
                        <td className="py-3 px-3.5 font-bold text-white whitespace-nowrap">
                          {inv.customer}
                        </td>
                      )}

                      {/* Contact Name */}
                      {visibleColumns.includes('contactName') && (
                        <td className="py-3 px-3.5 text-slate-300 whitespace-nowrap">
                          {inv.contactName || '-'}
                        </td>
                      )}

                      {/* Phone */}
                      {visibleColumns.includes('phone') && (
                        <td className="py-3 px-3.5 font-mono text-slate-400 whitespace-nowrap">
                          {inv.phone || '-'}
                        </td>
                      )}

                      {/* Status */}
                      {visibleColumns.includes('status') && (
                        <td className="py-3 px-3.5 text-center whitespace-nowrap">
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${inv.status === 'PAID'
                              ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                              : inv.status === 'PARTIAL'
                                ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                                : inv.status === 'VOID'
                                  ? 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
                                  : 'bg-blue-500/15 text-blue-400 border border-blue-500/30'
                              }`}
                          >
                            {inv.status}
                          </span>
                        </td>
                      )}

                      {/* Grand Total */}
                      {visibleColumns.includes('grandTotal') && (
                        <td className="py-3 px-3.5 text-right font-mono font-semibold text-white whitespace-nowrap">
                          ${Number(inv.grandTotal || 0).toFixed(2)}
                        </td>
                      )}

                      {/* Balance */}
                      {visibleColumns.includes('balance') && (
                        <td className="py-3 px-3.5 text-right font-mono font-bold whitespace-nowrap">
                          {Number(inv.balance || 0) > 0 ? (
                            <span className="text-rose-400">${Number(inv.balance).toFixed(2)}</span>
                          ) : (
                            <span className="text-emerald-400">$0.00</span>
                          )}
                        </td>
                      )}

                      {/* Aging Type */}
                      {visibleColumns.includes('agingType') && (
                        <td className="py-3 px-3.5 text-center whitespace-nowrap">
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded-lg text-[10px] font-bold ${currentType === 'CURRENT'
                              ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                              : currentType === '1_30'
                                ? 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
                                : currentType === '31_60'
                                  ? 'bg-orange-500/15 text-orange-300 border border-orange-500/30'
                                  : currentType === '61_90'
                                    ? 'bg-rose-500/15 text-rose-300 border border-rose-500/30'
                                    : currentType === '91_120'
                                      ? 'bg-red-500/15 text-red-300 border border-red-500/30'
                                      : 'bg-purple-500/15 text-purple-300 border border-purple-500/30'
                              }`}
                          >
                            {currentType === 'CURRENT'
                              ? 'Current'
                              : currentType === '1_30'
                                ? '1 - 30 Days'
                                : currentType === '31_60'
                                  ? '31 - 60 Days'
                                  : currentType === '61_90'
                                    ? '61 - 90 Days'
                                    : currentType === '91_120'
                                      ? '91 - 120 Days'
                                      : 'Over 120 Days'}
                          </span>
                        </td>
                      )}

                      {/* Days Overdue */}
                      {visibleColumns.includes('daysOverdue') && (
                        <td className="py-3 px-3.5 text-center font-mono font-bold whitespace-nowrap">
                          {days > 0 ? (
                            <span className="text-amber-400">+{days} d</span>
                          ) : (
                            <span className="text-emerald-400">0 d</span>
                          )}
                        </td>
                      )}

                      {/* Salesperson */}
                      {visibleColumns.includes('salesperson') && (
                        <td className="py-3 px-3.5 text-slate-300 whitespace-nowrap">
                          {inv.salesperson || '-'}
                        </td>
                      )}

                      {/* Customer Group */}
                      {visibleColumns.includes('customerGroup') && (
                        <td className="py-3 px-3.5 text-slate-400 whitespace-nowrap">
                          {inv.customerGroup || '-'}
                        </td>
                      )}
                    </tr>
                  )
                })
              )}
            </tbody>
            {/* Table Footer Totals */}
            {displayedInvoices.length > 0 && (
              <tfoot className="bg-slate-950/90 font-bold border-t-2 border-slate-800 text-xs">
                <tr>
                  <td colSpan={3} className="py-3 px-3.5 text-purple-400">
                    TOTAL ({displayedInvoices.length} invoices)
                  </td>
                  <td colSpan={visibleColumns.length - 5} className="py-3 px-3.5"></td>
                  {visibleColumns.includes('grandTotal') && (
                    <td className="py-3 px-3.5 text-right text-white font-mono">
                      $
                      {displayedInvoices
                        .reduce((sum, i) => sum + Number(i.grandTotal || 0), 0)
                        .toFixed(2)}
                    </td>
                  )}
                  {visibleColumns.includes('balance') && (
                    <td className="py-3 px-3.5 text-right font-mono text-rose-400">
                      $
                      {displayedInvoices
                        .reduce((sum, i) => sum + Number(i.balance || 0), 0)
                        .toFixed(2)}
                    </td>
                  )}
                  {visibleColumns.includes('agingType') && <td></td>}
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </section>

      {/* 5. CHOOSE COLUMN MODAL */}
      {chooseColumnOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-md">
          <div className="w-full max-w-lg rounded-3xl border border-slate-700 bg-slate-900 p-6 shadow-2xl shadow-black/50 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div>
                <h3 className="text-base font-bold text-white">
                  {lang === 'en' ? 'Choose Column' : 'ជ្រើសរើសជួរឈរ'}
                </h3>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  {lang === 'en'
                    ? 'Choose column you want to display on table'
                    : 'ជ្រើសរើសជួរឈរដែលអ្នកចង់បង្ហាញនៅលើតារាង'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setChooseColumnOpen(false)}
                className="h-8 w-8 rounded-full bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white flex items-center justify-center text-sm font-bold transition"
              >
                ✕
              </button>
            </div>

            <div className="flex items-center justify-between pb-2">
              <span className="text-xs text-slate-400">
                {visibleColumns.length} of {ALL_COLUMNS.length} visible
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={selectAllColumns}
                  className="text-xs font-semibold text-purple-400 hover:underline"
                >
                  {lang === 'en' ? 'Select All' : 'ជ្រើសរើសទាំងអស់'}
                </button>
                <span className="text-slate-600">·</span>
                <button
                  type="button"
                  onClick={resetDefaultColumns}
                  className="text-xs font-semibold text-slate-400 hover:underline"
                >
                  {lang === 'en' ? 'Reset Default' : 'កំណត់លំនាំដើម'}
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-72 overflow-y-auto pr-1">
              {ALL_COLUMNS.map((col) => {
                const checked = visibleColumns.includes(col.key)
                return (
                  <label
                    key={col.key}
                    className={`flex items-center justify-between p-2.5 rounded-xl border transition cursor-pointer ${checked
                      ? 'border-purple-500/50 bg-purple-500/10 text-white'
                      : 'border-slate-800 bg-slate-950/60 text-slate-400 hover:border-slate-700'
                      }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <input
                        type="checkbox"
                        checked={checked}
                        disabled={col.always}
                        onChange={() => toggleColumn(col.key)}
                        className="rounded border-slate-700 text-purple-600 focus:ring-purple-500 h-4 w-4 accent-purple-500"
                      />
                      <span className="text-xs font-semibold">
                        {lang === 'en' ? col.label.en : col.label.kh}
                      </span>
                    </div>
                    {col.always && (
                      <span className="text-[10px] uppercase font-bold text-purple-400 bg-purple-500/20 px-2 py-0.5 rounded">
                        Required
                      </span>
                    )}
                  </label>
                )
              })}
            </div>

            <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setChooseColumnOpen(false)}
                className="rounded-xl bg-purple-600 hover:bg-purple-500 px-5 py-2 text-xs font-bold text-white transition active:scale-95"
              >
                {lang === 'en' ? 'Done' : 'រួចរាល់'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
