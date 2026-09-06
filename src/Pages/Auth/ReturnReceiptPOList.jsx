import React, { useState, useEffect, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { useLanguage } from '../../context/LanguageContext'
import { useNotifications } from '../../context/NotificationContext'
import { adminReturnReceiptPOAPI } from '../../api/api'
import { exportStyledExcel } from '../../utils/excelExport'
import copyIcon from '../../assets/icon/3dicons-copy-dynamic-color.png'
import './ProductsHub.css'

// SVGs
function SearchIcon({ className = 'w-4 h-4' }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
    </svg>
  )
}

function FilterIcon({ className = 'w-4 h-4' }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
    </svg>
  )
}

function ChevronDownIcon({ className = 'w-4 h-4' }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
    </svg>
  )
}

function RefreshIcon({ className = 'w-4 h-4' }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
    </svg>
  )
}

function TrashIcon({ className = 'w-4 h-4' }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
    </svg>
  )
}

function DownloadIcon({ className = 'w-4 h-4' }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
    </svg>
  )
}

function EyeIcon({ className = 'w-4 h-4' }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
    </svg>
  )
}

function ColumnsIcon({ className = 'w-4 h-4' }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 4.5v15m6-15v15m-10.5 0h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15A2.25 2.25 0 002.25 6.75v10.5A2.25 2.25 0 004.5 19.5z" />
    </svg>
  )
}

// All available table columns for Choose Column
const ALL_COLUMNS = [
  { key: 'returnPoCode', label: { en: 'Return PO Code', kh: 'លេខកូដបង្វិល PO' }, always: true },
  { key: 'date', label: { en: 'Date', kh: 'កាលបរិច្ឆេទ' }, always: true },
  { key: 'poCode', label: { en: 'PO Code', kh: 'លេខកូដ PO' }, always: true },
  { key: 'receiptPoCode', label: { en: 'Receipt PO Code', kh: 'លេខកូដប័ណ្ណទទួល' } },
  { key: 'supplier', label: { en: 'Supplier', kh: 'អ្នកផ្គត់ផ្គង់' }, always: true },
  { key: 'amount', label: { en: 'Amount ($)', kh: 'ចំនួនទឹកប្រាក់ ($)' }, always: true },
  { key: 'outlet', label: { en: 'Outlet', kh: 'សាខា / ឃ្លាំង' } },
  { key: 'username', label: { en: 'Username', kh: 'អ្នកប្រើប្រាស់' } },
  { key: 'actions', label: { en: 'Actions', kh: 'សកម្មភាព' }, always: true },
]

const DEFAULT_VISIBLE = [
  'returnPoCode',
  'date',
  'poCode',
  'supplier',
  'amount',
  'status',
  'outlet',
  'username',
  'actions',
]

const OUTLET_OPTIONS = [
  'Main Store Warehouse',
  'Central Cold Storage',
  'Express Mart BKK1',
  'Toul Kork Branch',
  'Chbar Ampov Depot',
  'Siem Reap Hub',
]

const STATUS_OPTIONS = ['ALL', 'OPEN', 'DISPATCHED', 'COMPLETED', 'VOIDED', 'PENDING']

const SEARCH_BY_OPTIONS = [
  { value: 'Any', label: { en: 'Any', kh: 'ទាំងអស់' } },
  { value: 'Return Receipt Code', label: { en: 'Return Receipt Code', kh: 'កូដបង្វិល' } },
  { value: 'PO CODE', label: { en: 'PO CODE', kh: 'កូដ PO' } },
  { value: 'Supplier', label: { en: 'Supplier', kh: 'អ្នកផ្គត់ផ្គង់' } },
]

export default function ReturnReceiptPOList() {
  const { lang } = useLanguage()
  const { addNotification } = useNotifications()

  // Main list state
  const [returnReceipts, setReturnReceipts] = useState([])
  const [loading, setLoading] = useState(true)

  // Search state
  // Search - textbox
  // Search by - dropdown - Any Return Receipt Code Po Cdoe Supplier
  // Search button
  const [searchText, setSearchText] = useState('')
  const [searchBy, setSearchBy] = useState('Any')
  const [appliedSearch, setAppliedSearch] = useState({ text: '', by: 'Any' })

  // Advance Filter state
  // Date to Date - Outlet Dropdown
  const [advanceFilterOpen, setAdvanceFilterOpen] = useState(false)
  const [fromDate, setFromDate] = useState('')
  const [toDate, setToDate] = useState('')
  const [outletFilter, setOutletFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('ALL')

  // Table Column Visibility
  const [chooseColumnOpen, setChooseColumnOpen] = useState(false)
  const [visibleColumns, setVisibleColumns] = useState(() => {
    try {
      const saved = localStorage.getItem('bg_return_receipt_po_columns')
      return saved ? JSON.parse(saved) : DEFAULT_VISIBLE
    } catch {
      return DEFAULT_VISIBLE
    }
  })

  // Modals
  const [detailModalOpen, setDetailModalOpen] = useState(false)
  const [selectedReturn, setSelectedReturn] = useState(null)

  // Persist column choices
  useEffect(() => {
    localStorage.setItem('bg_return_receipt_po_columns', JSON.stringify(visibleColumns))
  }, [visibleColumns])

  // Fetch Return Receipts from Backend
  const fetchReturnReceipts = async () => {
    try {
      setLoading(true)
      const params = {}
      if (appliedSearch.text.trim()) {
        params.search = appliedSearch.text.trim()
        if (appliedSearch.by !== 'Any') {
          params.searchBy = appliedSearch.by
        }
      }
      if (fromDate) params.fromDate = fromDate
      if (toDate) params.toDate = toDate
      if (outletFilter !== 'all') params.outlet = outletFilter
      if (statusFilter !== 'ALL') params.status = statusFilter

      const res = await adminReturnReceiptPOAPI.getAll(params)
      const list = res.data || res || []
      setReturnReceipts(Array.isArray(list) ? list : [])
    } catch (err) {
      console.error('Failed to fetch return receipt POs:', err)
      addNotification?.(err.message || 'Failed to load return receipt POs', 'error')
    } finally {
      setLoading(false)
    }
  }

  // Trigger fetch when search or filters change
  useEffect(() => {
    fetchReturnReceipts()
  }, [appliedSearch, fromDate, toDate, outletFilter, statusFilter])

  // Handle Search Trigger
  const handleTriggerSearch = () => {
    setAppliedSearch({ text: searchText, by: searchBy })
  }

  // Handle Reset Filters
  const handleResetFilters = () => {
    setSearchText('')
    setSearchBy('Any')
    setAppliedSearch({ text: '', by: 'Any' })
    setFromDate('')
    setToDate('')
    setOutletFilter('all')
    setStatusFilter('ALL')
    addNotification?.('Filters reset to default', 'info')
  }

  // Column toggle helper
  const toggleColumn = (key) => {
    setVisibleColumns((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    )
  }

  const selectAllColumns = () => {
    setVisibleColumns(ALL_COLUMNS.map((c) => c.key))
  }

  const deselectAllColumns = () => {
    setVisibleColumns(['returnPoCode', 'actions'])
  }

  const resetDefaultColumns = () => {
    setVisibleColumns(DEFAULT_VISIBLE)
  }

  // KPI Calculations
  const kpi = useMemo(() => {
    const totalCount = returnReceipts.length
    const totalAmount = returnReceipts.reduce((sum, r) => sum + (Number(r.amount) || 0), 0)
    const completedCount = returnReceipts.filter((r) => r.status === 'COMPLETED').length
    const dispatchedCount = returnReceipts.filter((r) => r.status === 'DISPATCHED').length
    const openCount = returnReceipts.filter((r) => r.status === 'OPEN').length
    return {
      totalCount,
      totalAmount,
      completedCount,
      dispatchedCount,
      openCount,
    }
  }, [returnReceipts])

  // Direct Status Update
  const handleUpdateStatus = async (id, newStatus) => {
    try {
      await adminReturnReceiptPOAPI.updateStatus(id, newStatus)
      addNotification?.(`Return Receipt PO status updated to ${newStatus}`, 'success')
      fetchReturnReceipts()
      if (selectedReturn && selectedReturn.id === id) {
        setSelectedReturn((prev) => ({ ...prev, status: newStatus }))
      }
    } catch (err) {
      addNotification?.(err.message || 'Failed to update status', 'error')
    }
  }

  // Delete Return Receipt PO
  const handleDeleteReturn = async (id, code) => {
    if (!window.confirm(`Are you sure you want to delete Return PO ${code}?`)) return
    try {
      await adminReturnReceiptPOAPI.delete(id)
      addNotification?.(`Return PO ${code} deleted`, 'success')
      fetchReturnReceipts()
    } catch (err) {
      addNotification?.(err.message || 'Failed to delete return PO', 'error')
    }
  }

  // Export to Excel
  const handleExportExcel = () => {
    if (returnReceipts.length === 0) {
      addNotification?.('No return receipt records to export', 'warning')
      return
    }

    const headers = [
      'Return PO Code',
      'Date',
      'PO Code',
      'Receipt PO Code',
      'Supplier',
      'Amount ($)',
      'Status',
      'Outlet',
      'Username',
      'Reason',
      'Reference',
      'Note',
    ]

    const data = returnReceipts.map((r) => [
      r.returnPoCode,
      r.date || '—',
      r.poCode || '—',
      r.receiptPoCode || '—',
      r.supplier || '—',
      Number(r.amount || 0).toFixed(2),
      r.status || 'OPEN',
      r.outlet || '—',
      r.username || '—',
      r.reason || '—',
      r.reference || '—',
      r.note || '—',
    ])

    const filename = `return_receipt_po_list_${new Date().toISOString().slice(0, 10)}.xlsx`
    exportStyledExcel(headers, data, filename, 'Return POs')
    addNotification?.('Return receipt list exported to Excel', 'success')
  }

  // Status Badge Class Helper
  const getStatusBadge = (st) => {
    const s = (st || '').toUpperCase()
    switch (s) {
      case 'OPEN':
        return 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
      case 'DISPATCHED':
        return 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
      case 'COMPLETED':
        return 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
      case 'VOIDED':
        return 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
      case 'PENDING':
        return 'bg-purple-500/20 text-purple-400 border border-purple-500/30'
      default:
        return 'bg-slate-700/50 text-slate-300 border border-slate-600/40'
    }
  }

  // Count active advance filters
  const activeAdvanceFilterCount = [
    fromDate ? 1 : 0,
    toDate ? 1 : 0,
    outletFilter !== 'all' ? 1 : 0,
    statusFilter !== 'ALL' ? 1 : 0,
  ].reduce((a, b) => a + b, 0)

  return (
    <div className="min-h-screen bg-slate-950 p-4 sm:p-6 lg:p-8 space-y-6 text-slate-100 font-['Montserrat']">
      {/* 1. GENERAL INFORMATION HEADER */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-400 mb-1">
            <Link to="/admin" className="hover:text-rose-400 transition-colors">
              {lang === 'en' ? 'Dashboard' : 'ផ្ទាំងគ្រប់គ្រង'}
            </Link>
            <span>/</span>
            <Link to="/admin/purchase-management" className="hover:text-rose-400 transition-colors">
              {lang === 'en' ? 'Purchase Management' : 'ការគ្រប់គ្រងការទិញ'}
            </Link>
            <span>/</span>
            <span className="text-rose-400 font-semibold">
              {lang === 'en' ? 'Return Receipt PO' : 'ការត្រឡប់ទំនិញទិញ'}
            </span>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-500/15 border border-rose-500/30 text-2xl shadow-lg shadow-rose-500/10">
              <img src={copyIcon} alt="Return Receipt PO" className="h-7 w-7 object-contain" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-black tracking-tight text-white font-['Montserrat']">
                  {lang === 'en' ? 'Return Receipt Purchase Order List' : 'បញ្ជីវត្ថុធាតុដើម/ទំនិញបង្វិលសងអ្នកផ្គត់ផ្គង់'}
                </h1>
                <span className="rounded-full bg-rose-500/20 px-2.5 py-0.5 text-xs font-bold text-rose-300 border border-rose-500/30">
                  {returnReceipts.length} {lang === 'en' ? 'Records' : 'ទិន្នន័យ'}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                {lang === 'en'
                  ? 'Information list of return receipt purchase order. Ex(Return PO Code, PO Code, Date...)'
                  : 'ព័ត៌មានលម្អិតនៃបញ្ជីបង្វិលទំនិញ PO (កូដបង្វិល PO, កូដ PO, កាលបរិច្ឆេទ...)'}
              </p>
            </div>
          </div>
        </div>

        {/* Action Buttons: Export Excel & Back to Hub */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleExportExcel}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-900/90 px-4 py-2.5 text-xs font-semibold text-rose-400 hover:bg-slate-800 hover:border-rose-500 transition-all active:scale-95 shadow-md shadow-rose-950/30"
            title="Export to Excel"
          >
            <DownloadIcon className="w-4 h-4" />
            <span>{lang === 'en' ? 'Export Excel' : 'ទាញយក Excel'}</span>
          </button>

          <Link
            to="/admin/purchase-management"
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-800 bg-slate-900/90 px-3.5 py-2.5 text-xs font-semibold text-slate-400 hover:text-white hover:border-slate-700 transition active:scale-95"
          >
            <span>←</span>
            <span>{lang === 'en' ? 'Back to Hub' : 'ត្រឡប់'}</span>
          </Link>
        </div>
      </div>

      {/* 2. KPI SUMMARY METRIC CARDS */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        <div className="rounded-2xl border border-slate-800/80 bg-slate-900/70 p-3.5 shadow-lg backdrop-blur-md">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
            {lang === 'en' ? 'Total Returns' : 'ប័ណ្ណបង្វិលសរុប'}
          </span>
          <div className="mt-1 text-2xl font-black text-white">{kpi.totalCount}</div>
          <span className="text-[10px] text-slate-500">
            {kpi.completedCount} {lang === 'en' ? 'closed/refunded' : 'បានបញ្ចប់'}
          </span>
        </div>

        <div className="rounded-2xl border border-rose-500/20 bg-rose-950/20 p-3.5 shadow-lg backdrop-blur-md">
          <span className="text-[11px] font-bold text-rose-400 uppercase tracking-wider">
            {lang === 'en' ? 'Total Return Value' : 'តម្លៃបង្វិលសរុប'}
          </span>
          <div className="mt-1 text-2xl font-black text-rose-300">
            ${kpi.totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <span className="text-[10px] text-rose-500/80">
            {lang === 'en' ? 'Claimed refund amount' : 'ទឹកប្រាក់ត្រូវទាមទារ'}
          </span>
        </div>

        <div className="rounded-2xl border border-amber-500/20 bg-amber-950/20 p-3.5 shadow-lg backdrop-blur-md">
          <span className="text-[11px] font-bold text-amber-400 uppercase tracking-wider">
            {lang === 'en' ? 'Open Returns' : 'កំពុងរង់ចាំ'}
          </span>
          <div className="mt-1 text-2xl font-black text-amber-300">{kpi.openCount}</div>
          <span className="text-[10px] text-amber-500/80">
            {lang === 'en' ? 'Pending dispatch' : 'រង់ចាំបញ្ជូនត្រឡប់'}
          </span>
        </div>

        <div className="rounded-2xl border border-cyan-500/20 bg-cyan-950/20 p-3.5 shadow-lg backdrop-blur-md">
          <span className="text-[11px] font-bold text-cyan-400 uppercase tracking-wider">
            {lang === 'en' ? 'Dispatched' : 'បានបញ្ជូន'}
          </span>
          <div className="mt-1 text-2xl font-black text-cyan-300">{kpi.dispatchedCount}</div>
          <span className="text-[10px] text-cyan-500/80">
            {lang === 'en' ? 'Awaiting vendor credit' : 'រង់ចាំប័ណ្ណឥណពន្ធ'}
          </span>
        </div>
      </div>

      {/* 3. SEARCH & ADVANCE FILTER & CHOOSE COLUMN CONTROLS */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-4 shadow-xl backdrop-blur-md space-y-3.5">
        <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
          {/* Search Textbox + Search By Dropdown (Any, Return Receipt Code, PO CODE, Supplier) + Search Button */}
          <div className="flex flex-1 flex-col sm:flex-row items-stretch sm:items-center gap-2">
            {/* Search By Dropdown */}
            <div className="relative min-w-[170px]">
              <select
                value={searchBy}
                onChange={(e) => setSearchBy(e.target.value)}
                className="w-full appearance-none rounded-xl border border-slate-700 bg-slate-800/90 px-3.5 py-2.5 text-xs font-semibold text-slate-200 outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500 transition-all cursor-pointer"
              >
                {SEARCH_BY_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value} className="bg-slate-900 text-slate-200">
                    {opt.label[lang] || opt.label.en}
                  </option>
                ))}
              </select>
              <ChevronDownIcon className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            </div>

            {/* Search Textbox */}
            <div className="relative flex-1">
              <input
                type="text"
                placeholder={
                  searchBy === 'Return Receipt Code'
                    ? lang === 'en' ? 'Enter Return PO Code (e.g. RPO-20260904-0001)...' : 'បញ្ចូលកូដបង្វិល PO...'
                    : searchBy === 'PO CODE'
                      ? lang === 'en' ? 'Enter PO Code (e.g. PO-20260904-0001)...' : 'បញ្ចូលកូដ PO...'
                      : searchBy === 'Supplier'
                        ? lang === 'en' ? 'Enter Supplier name...' : 'បញ្ចូលឈ្មោះអ្នកផ្គត់ផ្គង់...'
                        : lang === 'en' ? 'Search by Return PO Code, PO Code, Supplier...' : 'ស្វែងរកតាមកូដបង្វិល, កូដ PO, អ្នកផ្គត់ផ្គង់...'
                }
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleTriggerSearch()}
                className="w-full rounded-xl border border-slate-700 bg-slate-800/90 pl-9 pr-8 py-2.5 text-xs text-white placeholder-slate-500 outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500 transition-all"
              />
              <SearchIcon className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              {searchText && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchText('')
                    setAppliedSearch({ text: '', by: searchBy })
                  }}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-white"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Search Button */}
            <button
              type="button"
              onClick={handleTriggerSearch}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-rose-600 hover:bg-rose-500 px-4 py-2.5 text-xs font-bold text-white transition-all shadow-md shadow-rose-600/20 active:scale-95 whitespace-nowrap"
            >
              <SearchIcon className="w-4 h-4" />
              <span>{lang === 'en' ? 'Search' : 'ស្វែងរក'}</span>
            </button>
          </div>

          {/* Right Action Buttons: Advance Filter Toggle & Choose Column */}
          <div className="flex items-center gap-2 self-end md:self-auto">
            {/* Advance Filter Toggle */}
            <button
              type="button"
              onClick={() => setAdvanceFilterOpen((prev) => !prev)}
              className={`inline-flex items-center gap-2 rounded-xl border px-3.5 py-2.5 text-xs font-semibold transition-all active:scale-95 ${advanceFilterOpen || activeAdvanceFilterCount > 0
                  ? 'border-rose-500/60 bg-rose-500/15 text-rose-300'
                  : 'border-slate-700 bg-slate-800/90 text-slate-300 hover:bg-slate-700 hover:text-white'
                }`}
            >
              <FilterIcon className="w-4 h-4" />
              <span>{lang === 'en' ? 'Advance Filter' : 'តម្រងកម្រិតខ្ពស់'}</span>
              {activeAdvanceFilterCount > 0 && (
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-rose-500 text-[10px] font-bold text-slate-950">
                  {activeAdvanceFilterCount}
                </span>
              )}
            </button>

            {/* Choose Column */}
            <button
              type="button"
              onClick={() => setChooseColumnOpen(true)}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-800/90 px-3.5 py-2.5 text-xs font-semibold text-slate-300 hover:bg-slate-700 hover:text-white transition-all active:scale-95"
            >
              <ColumnsIcon className="w-4 h-4" />
              <span>{lang === 'en' ? 'Choose Column' : 'ជ្រើសរើសជួរឈរ'}</span>
            </button>

            {/* Refresh / Reset button */}
            <button
              type="button"
              onClick={handleResetFilters}
              title="Reset all filters"
              className="inline-flex items-center justify-center rounded-xl border border-slate-700 bg-slate-800/90 p-2.5 text-slate-400 hover:text-white hover:bg-slate-700 transition active:scale-95"
            >
              <RefreshIcon className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* 4. ADVANCE FILTER COLLAPSIBLE PANEL */}
        {advanceFilterOpen && (
          <div className="pt-3 border-t border-slate-800/80 grid grid-cols-1 sm:grid-cols-4 gap-3 animate-fadeIn">
            {/* From Date */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                {lang === 'en' ? 'From Date' : 'ចាប់ពីថ្ងៃ'}
              </label>
              <input
                type="date"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                className="w-full rounded-xl border border-slate-700 bg-slate-800/90 px-3 py-2 text-xs text-white outline-none focus:border-rose-500"
              />
            </div>

            {/* To Date */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                {lang === 'en' ? 'To Date' : 'ដល់ថ្ងៃ'}
              </label>
              <input
                type="date"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
                className="w-full rounded-xl border border-slate-700 bg-slate-800/90 px-3 py-2 text-xs text-white outline-none focus:border-rose-500"
              />
            </div>

            {/* Outlet Dropdown */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                {lang === 'en' ? 'Outlet' : 'សាខា / ឃ្លាំង'}
              </label>
              <select
                value={outletFilter}
                onChange={(e) => setOutletFilter(e.target.value)}
                className="w-full rounded-xl border border-slate-700 bg-slate-800/90 px-3 py-2 text-xs text-white outline-none focus:border-rose-500 cursor-pointer"
              >
                <option value="all">{lang === 'en' ? 'All Outlets' : 'គ្រប់សាខាទាំងអស់'}</option>
                {OUTLET_OPTIONS.map((ot) => (
                  <option key={ot} value={ot}>
                    {ot}
                  </option>
                ))}
              </select>
            </div>

            {/* Status Dropdown */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                {lang === 'en' ? 'Status' : 'ស្ថានភាព'}
              </label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full rounded-xl border border-slate-700 bg-slate-800/90 px-3 py-2 text-xs text-white outline-none focus:border-rose-500 cursor-pointer"
              >
                {STATUS_OPTIONS.map((st) => (
                  <option key={st} value={st}>
                    {st}
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}
      </div>

      {/* 5. RETURN RECEIPT PURCHASE ORDER LIST TABLE */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/80 shadow-2xl overflow-hidden backdrop-blur-md">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950/70 border-b border-slate-800 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              <tr>
                {visibleColumns.includes('returnPoCode') && (
                  <th className="px-4 py-3.5">{lang === 'en' ? 'Return PO Code' : 'កូដបង្វិល PO'}</th>
                )}
                {visibleColumns.includes('date') && (
                  <th className="px-4 py-3.5">{lang === 'en' ? 'Date' : 'កាលបរិច្ឆេទ'}</th>
                )}
                {visibleColumns.includes('poCode') && (
                  <th className="px-4 py-3.5">{lang === 'en' ? 'PO Code' : 'កូដ PO'}</th>
                )}
                {visibleColumns.includes('receiptPoCode') && (
                  <th className="px-4 py-3.5">{lang === 'en' ? 'Receipt PO Code' : 'កូដប័ណ្ណទទួល'}</th>
                )}
                {visibleColumns.includes('supplier') && (
                  <th className="px-4 py-3.5">{lang === 'en' ? 'Supplier' : 'អ្នកផ្គត់ផ្គង់'}</th>
                )}
                {visibleColumns.includes('amount') && (
                  <th className="px-4 py-3.5 text-right">{lang === 'en' ? 'Amount ($)' : 'ចំនួនទឹកប្រាក់ ($)'}</th>
                )}
                {visibleColumns.includes('status') && (
                  <th className="px-4 py-3.5 text-center">{lang === 'en' ? 'Status' : 'ស្ថានភាព'}</th>
                )}
                {visibleColumns.includes('outlet') && (
                  <th className="px-4 py-3.5">{lang === 'en' ? 'Outlet' : 'សាខា'}</th>
                )}
                {visibleColumns.includes('username') && (
                  <th className="px-4 py-3.5">{lang === 'en' ? 'Username' : 'អ្នកប្រើប្រាស់'}</th>
                )}
                {visibleColumns.includes('actions') && (
                  <th className="px-4 py-3.5 text-center">{lang === 'en' ? 'Actions' : 'សកម្មភាព'}</th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-medium">
              {loading ? (
                <tr>
                  <td colSpan={visibleColumns.length} className="px-4 py-12 text-center text-slate-500">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <div className="h-6 w-6 animate-spin rounded-full border-2 border-rose-500 border-t-transparent"></div>
                      <span>{lang === 'en' ? 'Loading return orders...' : 'កំពុងផ្ទុកទិន្នន័យ...'}</span>
                    </div>
                  </td>
                </tr>
              ) : returnReceipts.length === 0 ? (
                <tr>
                  <td colSpan={visibleColumns.length} className="px-4 py-12 text-center text-slate-500">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <span className="text-3xl">↩️</span>
                      <p className="font-semibold text-slate-400">
                        {lang === 'en' ? 'No Return Receipt PO records found' : 'មិនមានទិន្នន័យបង្វិលទំនិញ PO ទេ'}
                      </p>
                      <p className="text-xs text-slate-500 max-w-sm">
                        {lang === 'en'
                          ? 'Try adjusting your search conditions or date range.'
                          : 'សូមសាកល្បងផ្លាស់ប្តូរលក្ខខណ្ឌស្វែងរក ឬកាលបរិច្ឆេទ។'}
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                returnReceipts.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-800/40 transition-colors group">
                    {/* Return PO Code */}
                    {visibleColumns.includes('returnPoCode') && (
                      <td className="px-4 py-3.5">
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedReturn(r)
                            setDetailModalOpen(true)
                          }}
                          className="font-mono font-bold text-rose-400 hover:text-rose-300 hover:underline inline-flex items-center gap-1.5"
                        >
                          <span>{r.returnPoCode}</span>
                        </button>
                      </td>
                    )}

                    {/* Date */}
                    {visibleColumns.includes('date') && (
                      <td className="px-4 py-3.5 text-slate-300 whitespace-nowrap">
                        {r.date || '—'}
                      </td>
                    )}

                    {/* PO Code */}
                    {visibleColumns.includes('poCode') && (
                      <td className="px-4 py-3.5">
                        {r.poCode ? (
                          <span className="font-mono text-cyan-400 bg-cyan-950/40 px-2 py-0.5 rounded border border-cyan-800/40">
                            {r.poCode}
                          </span>
                        ) : (
                          <span className="text-slate-500">—</span>
                        )}
                      </td>
                    )}

                    {/* Receipt PO Code */}
                    {visibleColumns.includes('receiptPoCode') && (
                      <td className="px-4 py-3.5">
                        {r.receiptPoCode ? (
                          <span className="font-mono text-emerald-400 bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-800/40">
                            {r.receiptPoCode}
                          </span>
                        ) : (
                          <span className="text-slate-500">—</span>
                        )}
                      </td>
                    )}

                    {/* Supplier */}
                    {visibleColumns.includes('supplier') && (
                      <td className="px-4 py-3.5">
                        <div className="font-semibold text-white">{r.supplier}</div>
                        {r.reason && (
                          <div className="text-[10px] text-slate-500 truncate max-w-[150px]">
                            {r.reason}
                          </div>
                        )}
                      </td>
                    )}

                    {/* Amount */}
                    {visibleColumns.includes('amount') && (
                      <td className="px-4 py-3.5 text-right font-mono font-bold text-rose-400 whitespace-nowrap">
                        ${Number(r.amount || 0).toFixed(2)}
                      </td>
                    )}

                    {/* Status */}
                    {visibleColumns.includes('status') && (
                      <td className="px-4 py-3.5 text-center whitespace-nowrap">
                        <span className={`inline-block rounded-full px-2.5 py-0.5 text-[11px] font-bold ${getStatusBadge(r.status)}`}>
                          {r.status || 'OPEN'}
                        </span>
                      </td>
                    )}

                    {/* Outlet */}
                    {visibleColumns.includes('outlet') && (
                      <td className="px-4 py-3.5 text-slate-300 whitespace-nowrap">
                        {r.outlet || 'Main Store Warehouse'}
                      </td>
                    )}

                    {/* Username */}
                    {visibleColumns.includes('username') && (
                      <td className="px-4 py-3.5 text-slate-400 whitespace-nowrap">
                        <span className="inline-flex items-center gap-1 rounded bg-slate-800/80 px-2 py-0.5 text-[11px] text-slate-300">
                          👤 {r.username || 'Badmin'}
                        </span>
                      </td>
                    )}

                    {/* Actions */}
                    {visibleColumns.includes('actions') && (
                      <td className="px-4 py-3.5 text-center whitespace-nowrap">
                        <div className="flex items-center justify-center gap-1.5">
                          {/* View Detail Button */}
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedReturn(r)
                              setDetailModalOpen(true)
                            }}
                            className="rounded-lg p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition"
                            title="View Details"
                          >
                            <EyeIcon className="w-4 h-4" />
                          </button>

                          {/* Quick Status Dropdown */}
                          <select
                            value={r.status || 'OPEN'}
                            onChange={(e) => handleUpdateStatus(r.id, e.target.value)}
                            className="bg-slate-800/90 border border-slate-700 text-[10px] font-bold text-slate-200 rounded-lg px-2 py-1 outline-none cursor-pointer focus:border-rose-500"
                          >
                            <option value="OPEN">OPEN</option>
                            <option value="DISPATCHED">DISPATCHED</option>
                            <option value="COMPLETED">COMPLETED</option>
                            <option value="VOIDED">VOIDED</option>
                            <option value="PENDING">PENDING</option>
                          </select>

                          {/* Delete Button */}
                          <button
                            type="button"
                            onClick={() => handleDeleteReturn(r.id, r.returnPoCode)}
                            className="rounded-lg p-1.5 text-slate-500 hover:text-rose-400 hover:bg-slate-800 transition"
                            title="Delete"
                          >
                            <TrashIcon className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Table Footer */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-2 border-t border-slate-800 bg-slate-950/60 px-4 py-3 text-xs text-slate-400">
          <div>
            {lang === 'en'
              ? `Showing ${returnReceipts.length} return receipt records`
              : `បង្ហាញទិន្នន័យបង្វិលសរុប ${returnReceipts.length}`}
          </div>
          <div className="flex items-center gap-4 text-[11px]">
            <span>
              {lang === 'en' ? 'Total Return Amount:' : 'ទឹកប្រាក់បង្វិលសរុប:'}{' '}
              <strong className="text-rose-400">${kpi.totalAmount.toFixed(2)}</strong>
            </span>
          </div>
        </div>
      </div>

      {/* =========================================================
          6. MODAL: CHOOSE COLUMN
          Choose column you want to display on table
      ========================================================= */}
      {chooseColumnOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-md rounded-2xl border border-slate-700 bg-slate-900 shadow-2xl overflow-hidden animate-scaleUp">
            <div className="flex items-center justify-between border-b border-slate-800 bg-slate-950/70 px-5 py-4">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <ColumnsIcon className="w-5 h-5 text-rose-400" />
                  <span>{lang === 'en' ? 'Choose Column' : 'ជ្រើសរើសជួរឈរ'}</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  {lang === 'en'
                    ? 'Choose column you want to display on table'
                    : 'ជ្រើសរើសជួរឈរដែលអ្នកចង់បង្ហាញលើតារាង'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setChooseColumnOpen(false)}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="p-5 space-y-4">
              {/* Quick actions */}
              <div className="flex items-center justify-between text-xs pb-2 border-b border-slate-800">
                <button
                  type="button"
                  onClick={selectAllColumns}
                  className="font-semibold text-rose-400 hover:underline"
                >
                  {lang === 'en' ? 'Select All' : 'ជ្រើសរើសទាំងអស់'}
                </button>
                <button
                  type="button"
                  onClick={deselectAllColumns}
                  className="font-semibold text-slate-400 hover:underline"
                >
                  {lang === 'en' ? 'Deselect All' : 'ដោះជ្រើសរើស'}
                </button>
                <button
                  type="button"
                  onClick={resetDefaultColumns}
                  className="font-semibold text-cyan-400 hover:underline"
                >
                  {lang === 'en' ? 'Reset Default' : 'កំណត់ដើមវិញ'}
                </button>
              </div>

              {/* Column checkboxes */}
              <div className="grid grid-cols-2 gap-2.5 max-h-[300px] overflow-y-auto pr-1">
                {ALL_COLUMNS.map((col) => {
                  const checked = visibleColumns.includes(col.key)
                  return (
                    <label
                      key={col.key}
                      className={`flex items-center gap-2.5 rounded-xl border p-2.5 text-xs font-medium cursor-pointer transition-all ${checked
                          ? 'border-rose-500/40 bg-rose-950/20 text-white'
                          : 'border-slate-800 bg-slate-950/40 text-slate-400 hover:bg-slate-800'
                        }`}
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => toggleColumn(col.key)}
                        className="h-4 w-4 rounded border-slate-700 text-rose-600 focus:ring-rose-500 bg-slate-800 cursor-pointer"
                      />
                      <span>{col.label[lang] || col.label.en}</span>
                    </label>
                  )
                })}
              </div>
            </div>

            <div className="border-t border-slate-800 bg-slate-950/70 px-5 py-3.5 flex justify-end">
              <button
                type="button"
                onClick={() => setChooseColumnOpen(false)}
                className="rounded-xl bg-rose-600 px-5 py-2 text-xs font-bold text-white hover:bg-rose-500 active:scale-95 transition"
              >
                {lang === 'en' ? 'Apply & Close' : 'អនុវត្ត & បិទ'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================
          7. MODAL: VIEW RETURN RECEIPT PO DETAILS
      ========================================================= */}
      {detailModalOpen && selectedReturn && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-3xl rounded-2xl border border-slate-700 bg-slate-900 shadow-2xl overflow-hidden animate-scaleUp max-h-[90vh] flex flex-col">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-800 bg-slate-950/80 px-6 py-4">
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-500/20 border border-rose-500/40 text-rose-400 text-lg">
                  📋
                </span>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-lg font-black text-white font-['Montserrat']">
                      {selectedReturn.returnPoCode}
                    </h2>
                    <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold ${getStatusBadge(selectedReturn.status)}`}>
                      {selectedReturn.status || 'OPEN'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400">
                    {lang === 'en' ? 'Return Receipt PO Details & Claims' : 'ព័ត៌មានលម្អិតប័ណ្ណបង្វិលទំនិញ'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setDetailModalOpen(false)}
                className="rounded-lg p-2 text-slate-400 hover:bg-slate-800 hover:text-white"
              >
                ✕
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-5 text-xs">
              {/* Info Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 rounded-xl border border-slate-800 bg-slate-950/60">
                <div>
                  <span className="text-slate-500 block text-[10px] uppercase font-bold">{lang === 'en' ? 'Return Date' : 'កាលបរិច្ឆេទ'}</span>
                  <span className="font-semibold text-white">{selectedReturn.date || '—'}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px] uppercase font-bold">{lang === 'en' ? 'PO Reference' : 'កូដ PO'}</span>
                  <span className="font-mono text-cyan-400 font-bold">{selectedReturn.poCode || '—'}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px] uppercase font-bold">{lang === 'en' ? 'Receipt PO Ref' : 'កូដប័ណ្ណទទួល'}</span>
                  <span className="font-mono text-emerald-400 font-bold">{selectedReturn.receiptPoCode || '—'}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px] uppercase font-bold">{lang === 'en' ? 'Supplier' : 'អ្នកផ្គត់ផ្គង់'}</span>
                  <span className="font-semibold text-white">{selectedReturn.supplier}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px] uppercase font-bold">{lang === 'en' ? 'Outlet' : 'សាខា'}</span>
                  <span className="text-slate-300">{selectedReturn.outlet || 'Main Store Warehouse'}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px] uppercase font-bold">{lang === 'en' ? 'Authorized User' : 'អ្នកអនុញ្ញាត'}</span>
                  <span className="text-slate-300">{selectedReturn.username || 'Badmin'}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px] uppercase font-bold">{lang === 'en' ? 'Debit Note / Ref' : 'លេខយោងប័ណ្ណ'}</span>
                  <span className="text-slate-300">{selectedReturn.reference || '—'}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px] uppercase font-bold">{lang === 'en' ? 'Reason' : 'មូលហេតុ'}</span>
                  <span className="text-rose-400 font-semibold">{selectedReturn.reason || 'Damaged / Rejected'}</span>
                </div>
              </div>

              {/* Items List */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                  {lang === 'en' ? 'Returned Line Items' : 'ទំនិញបង្វិលជាក់ស្តែង'} ({selectedReturn.items?.length || 0})
                </h4>

                <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-950/60">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-900 border-b border-slate-800 text-[11px] font-bold text-slate-400 uppercase">
                      <tr>
                        <th className="px-3 py-2.5">Code</th>
                        <th className="px-3 py-2.5">Description</th>
                        <th className="px-3 py-2.5 text-center">UOM</th>
                        <th className="px-3 py-2.5 text-center">Return QTY</th>
                        <th className="px-3 py-2.5 text-right">Cost ($)</th>
                        <th className="px-3 py-2.5 text-right">Subtotal ($)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60 font-medium">
                      {!selectedReturn.items || selectedReturn.items.length === 0 ? (
                        <tr>
                          <td colSpan="6" className="px-3 py-6 text-center text-slate-500">
                            {lang === 'en' ? 'No line items recorded on this return note' : 'មិនមានទំនិញក្នុងប័ណ្ណបង្វិលនេះទេ'}
                          </td>
                        </tr>
                      ) : (
                        selectedReturn.items.map((it, idx) => (
                          <tr key={it.id || idx} className="hover:bg-slate-800/30">
                            <td className="px-3 py-2 font-mono text-slate-300">{it.code || '—'}</td>
                            <td className="px-3 py-2 font-semibold text-white">{it.description}</td>
                            <td className="px-3 py-2 text-center text-slate-400">{it.uom || 'Pcs'}</td>
                            <td className="px-3 py-2 text-center font-bold text-rose-400">{it.qty}</td>
                            <td className="px-3 py-2 text-right font-mono">${Number(it.cost || 0).toFixed(2)}</td>
                            <td className="px-3 py-2 text-right font-mono font-bold text-rose-400">
                              ${Number(it.total || 0).toFixed(2)}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Financial Totals */}
              <div className="p-4 rounded-xl border border-slate-800 bg-slate-950/80 flex items-center justify-between font-mono">
                <div>
                  <span className="text-slate-400 text-[10px] uppercase font-bold block">{lang === 'en' ? 'Return Items Count' : 'ចំនួនមុខទំនិញ'}</span>
                  <span className="text-lg font-black text-white">{selectedReturn.items?.length || 0}</span>
                </div>
                <div className="text-right">
                  <span className="text-slate-400 text-[10px] uppercase font-bold block">{lang === 'en' ? 'Total Refund Amount' : 'ទឹកប្រាក់បង្វិលសរុប'}</span>
                  <span className="text-2xl font-black text-rose-400">${Number(selectedReturn.amount || 0).toFixed(2)}</span>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="border-t border-slate-800 bg-slate-950/80 px-6 py-3.5 flex justify-end">
              <button
                type="button"
                onClick={() => setDetailModalOpen(false)}
                className="rounded-xl border border-slate-700 bg-slate-800 px-5 py-2 text-xs font-semibold text-slate-300 hover:bg-slate-700 transition"
              >
                {lang === 'en' ? 'Close' : 'បិទ'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
