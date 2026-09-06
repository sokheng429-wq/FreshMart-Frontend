import React, { useState, useEffect, useMemo } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useLanguage } from '../../context/LanguageContext'
import { useNotifications } from '../../context/NotificationContext'
import { adminReceiptPOAPI } from '../../api/api'
import { exportStyledExcel } from '../../utils/excelExport'
import mailIcon from '../../assets/icon/3dicons-mail-dynamic-color.png'
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
  { key: 'receiptPoCode', label: { en: 'Receipt PO Code', kh: 'លេខកូដប័ណ្ណទទួល' }, always: true },
  { key: 'date', label: { en: 'Date', kh: 'កាលបរិច្ឆេទ' }, always: true },
  { key: 'poCode', label: { en: 'PO Code', kh: 'លេខកូដ PO' }, always: true },
  { key: 'supplier', label: { en: 'Supplier', kh: 'អ្នកផ្គត់ផ្គង់' }, always: true },
  { key: 'balance', label: { en: 'Balance ($)', kh: 'សមតុល្យ ($)' }, always: true },
  { key: 'amount', label: { en: 'Amount ($)', kh: 'ចំនួនទឹកប្រាក់ ($)' }, always: true },
  { key: 'qty', label: { en: 'QTY', kh: 'បរិមាណ' }, always: true },
  { key: 'status', label: { en: 'Status', kh: 'ស្ថានភាព' }, always: true },
  { key: 'outlet', label: { en: 'Outlet', kh: 'សាខា / ឃ្លាំង' } },
  { key: 'shipment', label: { en: 'Shipment', kh: 'ការដឹកជញ្ជូន' } },
  { key: 'username', label: { en: 'Username', kh: 'អ្នកប្រើប្រាស់' } },
  { key: 'actions', label: { en: 'Actions', kh: 'សកម្មភាព' }, always: true },
]

const DEFAULT_VISIBLE = [
  'receiptPoCode',
  'date',
  'poCode',
  'supplier',
  'balance',
  'amount',
  'qty',
  'status',
  'outlet',
  'shipment',
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

const STATUS_OPTIONS = ['ALL', 'RECEIVED', 'PARTIAL', 'COMPLETED', 'VOIDED', 'PENDING']

const SEARCH_BY_OPTIONS = [
  { value: 'Any', label: { en: 'Any', kh: 'ទាំងអស់' } },
  { value: 'Receipt PO Code', label: { en: 'Receipt PO Code', kh: 'កូដប័ណ្ណទទួល' } },
  { value: 'PO CODE', label: { en: 'PO CODE', kh: 'កូដ PO' } },
  { value: 'Supplier', label: { en: 'Supplier', kh: 'អ្នកផ្គត់ផ្គង់' } },
]

export default function ReceiptPOList() {
  const { lang } = useLanguage()
  const { addNotification } = useNotifications()
  const navigate = useNavigate()

  // Main list state
  const [receipts, setReceipts] = useState([])
  const [loading, setLoading] = useState(true)

  // Search state
  // Search - Textbox
  // Search - Dropdown - Any - Receipt PO Code - PO CODE - Supplier
  // Search Button
  const [searchText, setSearchText] = useState('')
  const [searchBy, setSearchBy] = useState('Any')
  const [appliedSearch, setAppliedSearch] = useState({ text: '', by: 'Any' })

  // Advance Filter state
  // Date to Date - outlet DropDown
  const [advanceFilterOpen, setAdvanceFilterOpen] = useState(false)
  const [fromDate, setFromDate] = useState('')
  const [toDate, setToDate] = useState('')
  const [outletFilter, setOutletFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('ALL')

  // Table Column Visibility
  const [chooseColumnOpen, setChooseColumnOpen] = useState(false)
  const [visibleColumns, setVisibleColumns] = useState(() => {
    try {
      const saved = localStorage.getItem('bg_receipt_po_columns')
      return saved ? JSON.parse(saved) : DEFAULT_VISIBLE
    } catch {
      return DEFAULT_VISIBLE
    }
  })

  // Modals
  const [detailModalOpen, setDetailModalOpen] = useState(false)
  const [selectedReceipt, setSelectedReceipt] = useState(null)

  // Persist column choices
  useEffect(() => {
    localStorage.setItem('bg_receipt_po_columns', JSON.stringify(visibleColumns))
  }, [visibleColumns])

  // Fetch Receipts from Backend
  const fetchReceipts = async () => {
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

      const res = await adminReceiptPOAPI.getAll(params)
      const list = res.data || res || []
      setReceipts(Array.isArray(list) ? list : [])
    } catch (err) {
      console.error('Failed to fetch receipts:', err)
      addNotification?.(err.message || 'Failed to load receipts', 'error')
    } finally {
      setLoading(false)
    }
  }

  // Trigger fetch when search or filters change
  useEffect(() => {
    fetchReceipts()
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
    setVisibleColumns(['receiptPoCode', 'actions'])
  }

  const resetDefaultColumns = () => {
    setVisibleColumns(DEFAULT_VISIBLE)
  }

  // KPI Calculations
  const kpi = useMemo(() => {
    const totalCount = receipts.length
    const totalAmount = receipts.reduce((sum, r) => sum + (Number(r.amount) || 0), 0)
    const totalBalance = receipts.reduce((sum, r) => sum + (Number(r.balance) || 0), 0)
    const totalQty = receipts.reduce((sum, r) => sum + (Number(r.qty) || 0), 0)
    const completedCount = receipts.filter((r) => r.status === 'COMPLETED' || r.status === 'RECEIVED').length
    return {
      totalCount,
      totalAmount,
      totalBalance,
      totalQty,
      completedCount,
    }
  }, [receipts])

  // Direct Status Update
  const handleUpdateStatus = async (id, newStatus) => {
    try {
      await adminReceiptPOAPI.updateStatus(id, newStatus)
      addNotification?.(`Receipt PO status updated to ${newStatus}`, 'success')
      fetchReceipts()
      if (selectedReceipt && selectedReceipt.id === id) {
        setSelectedReceipt((prev) => ({ ...prev, status: newStatus }))
      }
    } catch (err) {
      addNotification?.(err.message || 'Failed to update status', 'error')
    }
  }

  // Delete Receipt PO
  const handleDeleteReceipt = async (id, code) => {
    if (!window.confirm(`Are you sure you want to delete Receipt PO ${code}?`)) return
    try {
      await adminReceiptPOAPI.delete(id)
      addNotification?.(`Receipt PO ${code} deleted`, 'success')
      fetchReceipts()
    } catch (err) {
      addNotification?.(err.message || 'Failed to delete receipt', 'error')
    }
  }

  // Export to Excel
  const handleExportExcel = () => {
    if (receipts.length === 0) {
      addNotification?.('No receipts to export', 'warning')
      return
    }

    const headers = [
      'Receipt PO Code',
      'Date',
      'PO Code',
      'Supplier',
      'Balance ($)',
      'Amount ($)',
      'QTY',
      'Status',
      'Outlet',
      'Shipment',
      'Username',
      'Reference',
      'Note',
    ]

    const data = receipts.map((r) => [
      r.receiptPoCode,
      r.date || '—',
      r.poCode || '—',
      r.supplier || '—',
      Number(r.balance || 0).toFixed(2),
      Number(r.amount || 0).toFixed(2),
      Number(r.qty || 0),
      r.status || 'RECEIVED',
      r.outlet || '—',
      r.shipment || '—',
      r.username || '—',
      r.reference || '—',
      r.note || '—',
    ])

    const filename = `receipt_po_list_${new Date().toISOString().slice(0, 10)}.xlsx`
    exportStyledExcel(headers, data, filename, 'Receipt POs')
    addNotification?.('Receipt PO list exported to Excel', 'success')
  }

  // Status Badge Class Helper
  const getStatusBadge = (st) => {
    const s = (st || '').toUpperCase()
    switch (s) {
      case 'RECEIVED':
        return 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
      case 'COMPLETED':
        return 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
      case 'PARTIAL':
        return 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
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
      {/* 1. BREADCRUMBS & TOP HEADER */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-400 mb-1">
            <Link to="/admin" className="hover:text-emerald-400 transition-colors">
              {lang === 'en' ? 'Dashboard' : 'ផ្ទាំងគ្រប់គ្រង'}
            </Link>
            <span>/</span>
            <Link to="/admin/purchase-management" className="hover:text-emerald-400 transition-colors">
              {lang === 'en' ? 'Purchase Management' : 'ការគ្រប់គ្រងការទិញ'}
            </Link>
            <span>/</span>
            <span className="text-emerald-400 font-semibold">
              {lang === 'en' ? 'Receipt PO' : 'ការទទួលទំនិញតាម PO'}
            </span>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-2xl shadow-lg shadow-emerald-500/10">
              <img src={mailIcon} alt="Receipt PO" className="h-7 w-7 object-contain" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-black tracking-tight text-white font-['Montserrat']">
                  {lang === 'en' ? 'Receipt PO List' : 'បញ្ជីប័ណ្ណទទួលទំនិញ PO'}
                </h1>
                <span className="rounded-full bg-emerald-500/20 px-2.5 py-0.5 text-xs font-bold text-emerald-300 border border-emerald-500/30">
                  {receipts.length} {lang === 'en' ? 'Records' : 'ទិន្នន័យ'}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                {lang === 'en'
                  ? 'Information of Receipt PO List. Ex(Receipt PO Code, PO Code, Date...)'
                  : 'ព័ត៌មាននៃបញ្ជីប័ណ្ណទទួល PO (កូដប័ណ្ណទទួល, កូដ PO, កាលបរិច្ឆេទ...)'}
              </p>
            </div>
          </div>
        </div>

        {/* Action Buttons: Export Excel & Back to Hub (No Create button as requested) */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleExportExcel}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-900/90 px-4 py-2.5 text-xs font-semibold text-emerald-400 hover:bg-slate-800 hover:border-emerald-500 transition-all active:scale-95 shadow-md shadow-emerald-950/30"
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
            {lang === 'en' ? 'Total Receipts' : 'ប័ណ្ណទទួលសរុប'}
          </span>
          <div className="mt-1 text-2xl font-black text-white">{kpi.totalCount}</div>
          <span className="text-[10px] text-slate-500">
            {kpi.completedCount} {lang === 'en' ? 'processed' : 'បានបញ្ចប់'}
          </span>
        </div>

        <div className="rounded-2xl border border-emerald-500/20 bg-emerald-950/20 p-3.5 shadow-lg backdrop-blur-md">
          <span className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider">
            {lang === 'en' ? 'Total Amount' : 'ទឹកប្រាក់សរុប'}
          </span>
          <div className="mt-1 text-2xl font-black text-emerald-300">
            ${kpi.totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <span className="text-[10px] text-emerald-500/80">
            {lang === 'en' ? 'Received value' : 'តម្លៃទំនិញទទួល'}
          </span>
        </div>

        <div className="rounded-2xl border border-amber-500/20 bg-amber-950/20 p-3.5 shadow-lg backdrop-blur-md">
          <span className="text-[11px] font-bold text-amber-400 uppercase tracking-wider">
            {lang === 'en' ? 'Total Balance' : 'សមតុល្យសរុប'}
          </span>
          <div className="mt-1 text-2xl font-black text-amber-300">
            ${kpi.totalBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <span className="text-[10px] text-amber-500/80">
            {lang === 'en' ? 'Remaining payable' : 'នៅសល់ត្រូវទូទាត់'}
          </span>
        </div>

        <div className="rounded-2xl border border-cyan-500/20 bg-cyan-950/20 p-3.5 shadow-lg backdrop-blur-md">
          <span className="text-[11px] font-bold text-cyan-400 uppercase tracking-wider">
            {lang === 'en' ? 'Total Intake QTY' : 'ចំនួនទទួលសរុប'}
          </span>
          <div className="mt-1 text-2xl font-black text-cyan-300">
            {kpi.totalQty.toLocaleString()}
          </div>
          <span className="text-[10px] text-cyan-500/80">
            {lang === 'en' ? 'Units received' : 'ឯកតាទំនិញ'}
          </span>
        </div>
      </div>

      {/* 3. SEARCH & ADVANCE FILTER & CHOOSE COLUMN CONTROLS */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-4 shadow-xl backdrop-blur-md space-y-3.5">
        <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
          {/* Search Textbox + Search Dropdown (Any, Receipt PO Code, PO CODE, Supplier) + Search Button */}
          <div className="flex flex-1 flex-col sm:flex-row items-stretch sm:items-center gap-2">
            {/* Search Dropdown */}
            <div className="relative min-w-[170px]">
              <select
                value={searchBy}
                onChange={(e) => setSearchBy(e.target.value)}
                className="w-full appearance-none rounded-xl border border-slate-700 bg-slate-800/90 px-3.5 py-2.5 text-xs font-semibold text-slate-200 outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all cursor-pointer"
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
                  searchBy === 'Receipt PO Code'
                    ? lang === 'en' ? 'Enter Receipt PO Code (e.g. REC-20260904-0001)...' : 'បញ្ចូលកូដប័ណ្ណទទួល...'
                    : searchBy === 'PO CODE'
                    ? lang === 'en' ? 'Enter PO Code (e.g. PO-20260904-0001)...' : 'បញ្ចូលកូដ PO...'
                    : searchBy === 'Supplier'
                    ? lang === 'en' ? 'Enter Supplier name...' : 'បញ្ចូលឈ្មោះអ្នកផ្គត់ផ្គង់...'
                    : lang === 'en' ? 'Search by Receipt PO Code, PO Code, Supplier...' : 'ស្វែងរកតាមកូដប័ណ្ណទទួល, កូដ PO, អ្នកផ្គត់ផ្គង់...'
                }
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleTriggerSearch()}
                className="w-full rounded-xl border border-slate-700 bg-slate-800/90 pl-9 pr-8 py-2.5 text-xs text-white placeholder-slate-500 outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all"
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
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 px-4 py-2.5 text-xs font-bold text-white transition-all shadow-md shadow-emerald-600/20 active:scale-95 whitespace-nowrap"
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
              className={`inline-flex items-center gap-2 rounded-xl border px-3.5 py-2.5 text-xs font-semibold transition-all active:scale-95 ${
                advanceFilterOpen || activeAdvanceFilterCount > 0
                  ? 'border-emerald-500/60 bg-emerald-500/15 text-emerald-300'
                  : 'border-slate-700 bg-slate-800/90 text-slate-300 hover:bg-slate-700 hover:text-white'
              }`}
            >
              <FilterIcon className="w-4 h-4" />
              <span>{lang === 'en' ? 'Advance Filter' : 'តម្រងកម្រិតខ្ពស់'}</span>
              {activeAdvanceFilterCount > 0 && (
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500 text-[10px] font-bold text-slate-950">
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
                className="w-full rounded-xl border border-slate-700 bg-slate-800/90 px-3 py-2 text-xs text-white outline-none focus:border-emerald-500"
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
                className="w-full rounded-xl border border-slate-700 bg-slate-800/90 px-3 py-2 text-xs text-white outline-none focus:border-emerald-500"
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
                className="w-full rounded-xl border border-slate-700 bg-slate-800/90 px-3 py-2 text-xs text-white outline-none focus:border-emerald-500 cursor-pointer"
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
                className="w-full rounded-xl border border-slate-700 bg-slate-800/90 px-3 py-2 text-xs text-white outline-none focus:border-emerald-500 cursor-pointer"
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

      {/* 5. RECEIPT PO LIST TABLE */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/80 shadow-2xl overflow-hidden backdrop-blur-md">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950/70 border-b border-slate-800 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              <tr>
                {visibleColumns.includes('receiptPoCode') && (
                  <th className="px-4 py-3.5">{lang === 'en' ? 'Receipt PO Code' : 'កូដប័ណ្ណទទួល'}</th>
                )}
                {visibleColumns.includes('date') && (
                  <th className="px-4 py-3.5">{lang === 'en' ? 'Date' : 'កាលបរិច្ឆេទ'}</th>
                )}
                {visibleColumns.includes('poCode') && (
                  <th className="px-4 py-3.5">{lang === 'en' ? 'PO Code' : 'កូដ PO'}</th>
                )}
                {visibleColumns.includes('supplier') && (
                  <th className="px-4 py-3.5">{lang === 'en' ? 'Supplier' : 'អ្នកផ្គត់ផ្គង់'}</th>
                )}
                {visibleColumns.includes('balance') && (
                  <th className="px-4 py-3.5 text-right">{lang === 'en' ? 'Balance ($)' : 'សមតុល្យ ($)'}</th>
                )}
                {visibleColumns.includes('amount') && (
                  <th className="px-4 py-3.5 text-right">{lang === 'en' ? 'Amount ($)' : 'ទឹកប្រាក់ ($)'}</th>
                )}
                {visibleColumns.includes('qty') && (
                  <th className="px-4 py-3.5 text-center">{lang === 'en' ? 'QTY' : 'បរិមាណ'}</th>
                )}
                {visibleColumns.includes('status') && (
                  <th className="px-4 py-3.5 text-center">{lang === 'en' ? 'Status' : 'ស្ថានភាព'}</th>
                )}
                {visibleColumns.includes('outlet') && (
                  <th className="px-4 py-3.5">{lang === 'en' ? 'Outlet' : 'សាខា'}</th>
                )}
                {visibleColumns.includes('shipment') && (
                  <th className="px-4 py-3.5">{lang === 'en' ? 'Shipment' : 'ការដឹកជញ្ជូន'}</th>
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
                      <div className="h-6 w-6 animate-spin rounded-full border-2 border-emerald-500 border-t-transparent"></div>
                      <span>{lang === 'en' ? 'Loading receipt orders...' : 'កំពុងផ្ទុកទិន្នន័យ...'}</span>
                    </div>
                  </td>
                </tr>
              ) : receipts.length === 0 ? (
                <tr>
                  <td colSpan={visibleColumns.length} className="px-4 py-12 text-center text-slate-500">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <span className="text-3xl">📭</span>
                      <p className="font-semibold text-slate-400">
                        {lang === 'en' ? 'No Receipt PO records found' : 'មិនមានទិន្នន័យប័ណ្ណទទួលទំនិញទេ'}
                      </p>
                      <p className="text-xs text-slate-500 max-w-sm">
                        {lang === 'en'
                          ? 'Try adjusting your search criteria or filters.'
                          : 'សូមសាកល្បងផ្លាស់ប្តូរពាក្យស្វែងរក ឬតម្រង។'}
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                receipts.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-800/40 transition-colors group">
                    {/* Receipt PO Code */}
                    {visibleColumns.includes('receiptPoCode') && (
                      <td className="px-4 py-3.5">
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedReceipt(r)
                            setDetailModalOpen(true)
                          }}
                          className="font-mono font-bold text-emerald-400 hover:text-emerald-300 hover:underline inline-flex items-center gap-1.5"
                        >
                          <span>{r.receiptPoCode}</span>
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

                    {/* Supplier */}
                    {visibleColumns.includes('supplier') && (
                      <td className="px-4 py-3.5">
                        <div className="font-semibold text-white">{r.supplier}</div>
                        {r.reference && (
                          <div className="text-[10px] text-slate-500 truncate max-w-[150px]">
                            Ref: {r.reference}
                          </div>
                        )}
                      </td>
                    )}

                    {/* Balance */}
                    {visibleColumns.includes('balance') && (
                      <td className="px-4 py-3.5 text-right font-mono font-bold text-amber-400 whitespace-nowrap">
                        ${Number(r.balance || 0).toFixed(2)}
                      </td>
                    )}

                    {/* Amount */}
                    {visibleColumns.includes('amount') && (
                      <td className="px-4 py-3.5 text-right font-mono font-bold text-emerald-400 whitespace-nowrap">
                        ${Number(r.amount || 0).toFixed(2)}
                      </td>
                    )}

                    {/* QTY */}
                    {visibleColumns.includes('qty') && (
                      <td className="px-4 py-3.5 text-center">
                        <span className="inline-block rounded-md bg-slate-800 px-2 py-0.5 font-mono text-xs font-bold text-slate-200 border border-slate-700">
                          {Number(r.qty || 0)}
                        </span>
                      </td>
                    )}

                    {/* Status */}
                    {visibleColumns.includes('status') && (
                      <td className="px-4 py-3.5 text-center whitespace-nowrap">
                        <span className={`inline-block rounded-full px-2.5 py-0.5 text-[11px] font-bold ${getStatusBadge(r.status)}`}>
                          {r.status || 'RECEIVED'}
                        </span>
                      </td>
                    )}

                    {/* Outlet */}
                    {visibleColumns.includes('outlet') && (
                      <td className="px-4 py-3.5 text-slate-300 whitespace-nowrap">
                        {r.outlet || 'Main Store Warehouse'}
                      </td>
                    )}

                    {/* Shipment */}
                    {visibleColumns.includes('shipment') && (
                      <td className="px-4 py-3.5 text-slate-300 whitespace-nowrap">
                        {r.shipment || 'Standard Trucking'}
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
                              setSelectedReceipt(r)
                              setDetailModalOpen(true)
                            }}
                            className="rounded-lg p-1.5 text-slate-400 hover:text-emerald-400 hover:bg-slate-800 transition"
                            title="View Details"
                          >
                            <EyeIcon className="w-4 h-4" />
                          </button>

                          {/* Quick Status Dropdown */}
                          <select
                            value={r.status || 'RECEIVED'}
                            onChange={(e) => handleUpdateStatus(r.id, e.target.value)}
                            className="bg-slate-800/90 border border-slate-700 text-[10px] font-bold text-slate-200 rounded-lg px-2 py-1 outline-none cursor-pointer focus:border-emerald-500"
                          >
                            <option value="RECEIVED">RECEIVED</option>
                            <option value="PARTIAL">PARTIAL</option>
                            <option value="COMPLETED">COMPLETED</option>
                            <option value="VOIDED">VOIDED</option>
                            <option value="PENDING">PENDING</option>
                          </select>

                          {/* Delete Button */}
                          <button
                            type="button"
                            onClick={() => handleDeleteReceipt(r.id, r.receiptPoCode)}
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
              ? `Showing ${receipts.length} receipt records`
              : `បង្ហាញទិន្នន័យប័ណ្ណទទួលសរុប ${receipts.length}`}
          </div>
          <div className="flex items-center gap-4 text-[11px]">
            <span>
              {lang === 'en' ? 'Total Intake:' : 'ទទួលសរុប:'}{' '}
              <strong className="text-emerald-400">${kpi.totalAmount.toFixed(2)}</strong>
            </span>
            <span>
              {lang === 'en' ? 'Payable Balance:' : 'សមតុល្យត្រូវទូទាត់:'}{' '}
              <strong className="text-amber-400">${kpi.totalBalance.toFixed(2)}</strong>
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
                  <ColumnsIcon className="w-5 h-5 text-emerald-400" />
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
                  className="font-semibold text-emerald-400 hover:underline"
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
                      className={`flex items-center gap-2.5 rounded-xl border p-2.5 text-xs font-medium cursor-pointer transition-all ${
                        checked
                          ? 'border-emerald-500/40 bg-emerald-950/20 text-white'
                          : 'border-slate-800 bg-slate-950/40 text-slate-400 hover:bg-slate-800'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => toggleColumn(col.key)}
                        className="h-4 w-4 rounded border-slate-700 text-emerald-600 focus:ring-emerald-500 bg-slate-800 cursor-pointer"
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
                className="rounded-xl bg-emerald-600 px-5 py-2 text-xs font-bold text-white hover:bg-emerald-500 active:scale-95 transition"
              >
                {lang === 'en' ? 'Apply & Close' : 'អនុវត្ត & បិទ'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================
          7. MODAL: VIEW RECEIPT PO DETAILS
      ========================================================= */}
      {detailModalOpen && selectedReceipt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-3xl rounded-2xl border border-slate-700 bg-slate-900 shadow-2xl overflow-hidden animate-scaleUp max-h-[90vh] flex flex-col">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-800 bg-slate-950/80 px-6 py-4">
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 text-lg">
                  📋
                </span>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-lg font-black text-white font-['Montserrat']">
                      {selectedReceipt.receiptPoCode}
                    </h2>
                    <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold ${getStatusBadge(selectedReceipt.status)}`}>
                      {selectedReceipt.status || 'RECEIVED'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400">
                    {lang === 'en' ? 'Goods Receipt PO Information & Items' : 'ព័ត៌មានលម្អិតប័ណ្ណទទួលទំនិញ'}
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
                  <span className="text-slate-500 block text-[10px] uppercase font-bold">{lang === 'en' ? 'Date' : 'កាលបរិច្ឆេទ'}</span>
                  <span className="font-semibold text-white">{selectedReceipt.date || '—'}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px] uppercase font-bold">{lang === 'en' ? 'PO Reference' : 'កូដ PO'}</span>
                  <span className="font-mono text-cyan-400 font-bold">{selectedReceipt.poCode || '—'}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px] uppercase font-bold">{lang === 'en' ? 'Supplier' : 'អ្នកផ្គត់ផ្គង់'}</span>
                  <span className="font-semibold text-white">{selectedReceipt.supplier}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px] uppercase font-bold">{lang === 'en' ? 'Username' : 'អ្នកទទួល'}</span>
                  <span className="text-slate-300">{selectedReceipt.username || 'Badmin'}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px] uppercase font-bold">{lang === 'en' ? 'Outlet' : 'សាខា'}</span>
                  <span className="text-slate-300">{selectedReceipt.outlet || 'Main Store Warehouse'}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px] uppercase font-bold">{lang === 'en' ? 'Shipment' : 'ការដឹកជញ្ជូន'}</span>
                  <span className="text-slate-300">{selectedReceipt.shipment || 'Standard Trucking'}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px] uppercase font-bold">{lang === 'en' ? 'Reference' : 'លេខយោង'}</span>
                  <span className="text-slate-300">{selectedReceipt.reference || '—'}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px] uppercase font-bold">{lang === 'en' ? 'Note' : 'កំណត់ចំណាំ'}</span>
                  <span className="text-slate-300">{selectedReceipt.note || '—'}</span>
                </div>
              </div>

              {/* Items List */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                  {lang === 'en' ? 'Intake Line Items' : 'ទំនិញទទួលជាក់ស្តែង'} ({selectedReceipt.items?.length || 0})
                </h4>

                <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-950/60">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-900 border-b border-slate-800 text-[11px] font-bold text-slate-400 uppercase">
                      <tr>
                        <th className="px-3 py-2.5">Code</th>
                        <th className="px-3 py-2.5">Description</th>
                        <th className="px-3 py-2.5 text-center">UOM</th>
                        <th className="px-3 py-2.5 text-center">QTY</th>
                        <th className="px-3 py-2.5 text-right">Cost ($)</th>
                        <th className="px-3 py-2.5 text-right">Total ($)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60 font-medium">
                      {!selectedReceipt.items || selectedReceipt.items.length === 0 ? (
                        <tr>
                          <td colSpan="6" className="px-3 py-6 text-center text-slate-500">
                            {lang === 'en' ? 'No items recorded on this receipt' : 'មិនមានទំនិញក្នុងប័ណ្ណនេះទេ'}
                          </td>
                        </tr>
                      ) : (
                        selectedReceipt.items.map((it, idx) => (
                          <tr key={it.id || idx} className="hover:bg-slate-800/30">
                            <td className="px-3 py-2 font-mono text-slate-300">{it.code || '—'}</td>
                            <td className="px-3 py-2 font-semibold text-white">{it.description}</td>
                            <td className="px-3 py-2 text-center text-slate-400">{it.uom || 'Pcs'}</td>
                            <td className="px-3 py-2 text-center font-bold text-cyan-400">{it.qty}</td>
                            <td className="px-3 py-2 text-right font-mono">${Number(it.cost || 0).toFixed(2)}</td>
                            <td className="px-3 py-2 text-right font-mono font-bold text-emerald-400">
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
              <div className="grid grid-cols-3 gap-4 p-4 rounded-xl border border-slate-800 bg-slate-950/80 text-center font-mono">
                <div>
                  <span className="text-slate-400 text-[10px] uppercase font-bold block">{lang === 'en' ? 'Total QTY' : 'បរិមាណសរុប'}</span>
                  <span className="text-lg font-black text-cyan-400">{Number(selectedReceipt.qty || 0)}</span>
                </div>
                <div>
                  <span className="text-slate-400 text-[10px] uppercase font-bold block">{lang === 'en' ? 'Total Amount' : 'ទឹកប្រាក់សរុប'}</span>
                  <span className="text-lg font-black text-emerald-400">${Number(selectedReceipt.amount || 0).toFixed(2)}</span>
                </div>
                <div>
                  <span className="text-slate-400 text-[10px] uppercase font-bold block">{lang === 'en' ? 'Balance' : 'សមតុល្យ'}</span>
                  <span className="text-lg font-black text-amber-400">${Number(selectedReceipt.balance || 0).toFixed(2)}</span>
                </div>
              </div>
            </div>

            {/* Modal Footer with Actions */}
            <div className="border-t border-slate-800 bg-slate-950/80 px-6 py-3.5 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setDetailModalOpen(false)
                    navigate('/admin/purchase-management/return-receipt-po', {
                      state: {
                        autoOpenCreate: true,
                        recRef: selectedReceipt.receiptPoCode,
                        poRef: selectedReceipt.poCode,
                        supplier: selectedReceipt.supplier,
                        items: selectedReceipt.items,
                      },
                    })
                  }}
                  className="rounded-xl border border-rose-500/30 bg-rose-950/20 px-3.5 py-2 text-xs font-bold text-rose-300 hover:bg-rose-900/40 transition"
                >
                  ↩️ {lang === 'en' ? 'Return to Vendor' : 'ត្រឡប់ទំនិញ'}
                </button>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setDetailModalOpen(false)}
                  className="rounded-xl border border-slate-700 bg-slate-800 px-4 py-2 text-xs font-semibold text-slate-300 hover:bg-slate-700 transition"
                >
                  {lang === 'en' ? 'Close' : 'បិទ'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
