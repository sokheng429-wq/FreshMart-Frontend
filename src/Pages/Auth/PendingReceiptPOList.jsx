import React, { useState, useEffect, useMemo, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { useLanguage } from '../../context/LanguageContext'
import { useNotifications } from '../../context/NotificationContext'
import { adminReceiptPOAPI } from '../../api/api'
import { exportStyledExcel } from '../../utils/excelExport'
import clockIcon from '../../assets/icon/3dicons-clock-dynamic-color.png'
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
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 3c-4.97 0-9 4.03-9 9 0 2.12.74 4.07 1.97 5.61L4.35 21l3.39-.64C9.28 20.72 10.6 21 12 21c4.97 0 9-4.03 9-9s-4.03-9-9-9z" />
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

function ColumnsIcon({ className = 'w-4 h-4' }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 4.5v15m6-15v15m-10.5 0h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15A2.25 2.25 0 002.25 6.75v10.5A2.25 2.25 0 004.5 19.5z" />
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
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  )
}

function XMarkIcon({ className = 'w-4 h-4' }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
    </svg>
  )
}

function ChevronDownIcon({ className = 'w-4 h-4' }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
    </svg>
  )
}

// Available Table Columns matching user specification:
// PO Code, Supplier, Balance, Amount, Freight Amount, Outlet, Status, Reset
const ALL_COLUMNS = [
  { key: 'poCode', label: { en: 'PO Code', kh: 'លេខកូដ PO' }, always: true },
  { key: 'supplier', label: { en: 'Supplier', kh: 'អ្នកផ្គត់ផ្គង់' }, always: true },
  { key: 'balance', label: { en: 'Balance', kh: 'សមតុល្យនៅសល់' } },
  { key: 'amount', label: { en: 'Amount', kh: 'ចំនួនទឹកប្រាក់' } },
  { key: 'freightAmount', label: { en: 'Freight Amount', kh: 'ថ្លៃដឹកជញ្ជូន' } },
  { key: 'outlet', label: { en: 'Outlet', kh: 'សាខា / ឃ្លាំង' } },
  { key: 'status', label: { en: 'Status', kh: 'ស្ថានភាព' } },
  { key: 'receiptPoCode', label: { en: 'Receipt PO Code', kh: 'លេខកូដប័ណ្ណទទួល' } },
  { key: 'date', label: { en: 'Date', kh: 'កាលបរិច្ឆេទ' } },
  { key: 'actions', label: { en: 'Actions', kh: 'សកម្មភាព' }, always: true },
]

const DEFAULT_VISIBLE_COLUMNS = [
  'poCode',
  'supplier',
  'balance',
  'amount',
  'freightAmount',
  'outlet',
  'status',
  'actions',
]

// Search By DropDown options: Any - Po Code - Supplier
const SEARCH_BY_OPTIONS = [
  { value: 'Any', label: { en: 'Any', kh: 'ទាំងអស់' } },
  { value: 'Po Code', label: { en: 'PO Code', kh: 'លេខកូដ PO' } },
  { value: 'Supplier', label: { en: 'Supplier', kh: 'អ្នកផ្គត់ផ្គង់' } },
]

// Outlets for Advance Filter
const OUTLET_OPTIONS = [
  'all',
  'Main Store Warehouse',
  'Central Cold Storage',
  'Express Mart BKK1',
  'Toul Kork Branch',
  'Chbar Ampov Depot',
  'Siem Reap Hub',
]

export default function PendingReceiptPOList() {
  const { lang } = useLanguage()
  const { addNotification } = useNotifications()

  // Main data state
  const [receipts, setReceipts] = useState([])
  const [loading, setLoading] = useState(true)

  // Search Controls
  // Search - textbox
  // Search By - DropDown - Any - Po Code - Supplier
  const [searchText, setSearchText] = useState('')
  const [searchBy, setSearchBy] = useState('Any')

  // Advance Filter - Date to Date - Outlet DropDown
  const [advanceFilterOpen, setAdvanceFilterOpen] = useState(false)
  const [fromDate, setFromDate] = useState('')
  const [toDate, setToDate] = useState('')
  const [outletFilter, setOutletFilter] = useState('all')

  // Applied Filters
  const [appliedFilters, setAppliedFilters] = useState({
    search: '',
    searchBy: 'Any',
    fromDate: '',
    toDate: '',
    outlet: 'all',
  })

  // Choose Column
  const [chooseColumnOpen, setChooseColumnOpen] = useState(false)
  const [visibleColumns, setVisibleColumns] = useState(() => {
    try {
      const saved = localStorage.getItem('bg_pending_receipt_po_columns')
      return saved ? JSON.parse(saved) : DEFAULT_VISIBLE_COLUMNS
    } catch {
      return DEFAULT_VISIBLE_COLUMNS
    }
  })

  // View Details Modal
  const [selectedReceipt, setSelectedReceipt] = useState(null)
  const [detailModalOpen, setDetailModalOpen] = useState(false)

  // Column toggle
  const toggleColumn = (key) => {
    setVisibleColumns((prev) => {
      const updated = prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
      try {
        localStorage.setItem('bg_pending_receipt_po_columns', JSON.stringify(updated))
      } catch (err) {
        console.error(err)
      }
      return updated
    })
  }

  // Load receipts from backend
  const loadReceipts = useCallback(async (filters = appliedFilters) => {
    setLoading(true)
    try {
      const params = {}
      if (filters.search && filters.search.trim()) {
        params.search = filters.search.trim()
        params.searchBy = filters.searchBy
      }
      if (filters.fromDate) params.fromDate = filters.fromDate
      if (filters.toDate) params.toDate = filters.toDate
      if (filters.outlet && filters.outlet !== 'all') params.outlet = filters.outlet

      const res = await adminReceiptPOAPI.getAll(params)
      if (res?.data && Array.isArray(res.data)) {
        setReceipts(res.data)
      } else if (Array.isArray(res)) {
        setReceipts(res)
      } else {
        setReceipts([])
      }
    } catch (err) {
      console.error('Failed to load pending receipt POs:', err)
      addNotification?.('Failed to load pending receipt POs', 'error')
      setReceipts([])
    } finally {
      setLoading(false)
    }
  }, [appliedFilters, addNotification])

  useEffect(() => {
    loadReceipts()
  }, [loadReceipts])

  // Handle Search Trigger
  const handleSearch = (e) => {
    if (e) e.preventDefault()
    const newFilters = {
      search: searchText,
      searchBy,
      fromDate,
      toDate,
      outlet: outletFilter,
    }
    setAppliedFilters(newFilters)
    loadReceipts(newFilters)
  }

  // Handle Reset Trigger
  // Reset - button
  const handleReset = () => {
    setSearchText('')
    setSearchBy('Any')
    setFromDate('')
    setToDate('')
    setOutletFilter('all')
    const resetObj = {
      search: '',
      searchBy: 'Any',
      fromDate: '',
      toDate: '',
      outlet: 'all',
    }
    setAppliedFilters(resetObj)
    loadReceipts(resetObj)
  }

  // Export to Excel
  const handleExportExcel = () => {
    if (!receipts.length) {
      addNotification?.('No receipt records to export', 'warning')
      return
    }

    const headers = [
      'PO Code',
      'Receipt PO Code',
      'Date',
      'Supplier',
      'Balance ($)',
      'Amount ($)',
      'Freight Amount ($)',
      'Outlet',
      'Status',
    ]

    const data = receipts.map((r) => [
      r.poCode || '—',
      r.receiptPoCode || '—',
      r.date || '—',
      r.supplier || '—',
      Number(r.balance || 0).toFixed(2),
      Number(r.amount || 0).toFixed(2),
      Number(r.freightAmount || 0).toFixed(2),
      r.outlet || '—',
      r.status || 'PENDING',
    ])

    const filename = `pending_receipt_po_list_${new Date().toISOString().slice(0, 10)}.xlsx`
    exportStyledExcel(headers, data, filename, 'Pending Receipt POs')
    addNotification?.('Exported receipt PO list to Excel', 'success')
  }

  // Status Badge Class Helper
  const getStatusBadge = (st) => {
    const s = (st || '').toUpperCase()
    switch (s) {
      case 'PENDING':
        return 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
      case 'IN TRANSIT':
      case 'IN_TRANSIT':
        return 'bg-cyan-500/15 text-cyan-400 border border-cyan-500/30'
      case 'RECEIVED':
        return 'bg-blue-500/15 text-blue-400 border border-blue-500/30'
      case 'PARTIAL':
        return 'bg-purple-500/15 text-purple-400 border border-purple-500/30'
      case 'COMPLETED':
        return 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
      case 'VOIDED':
        return 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
      default:
        return 'bg-slate-800 text-slate-400 border border-slate-700'
    }
  }

  const activeAdvanceFilterCount =
    (fromDate ? 1 : 0) + (toDate ? 1 : 0) + (outletFilter !== 'all' ? 1 : 0)

  return (
    <div className="space-y-6 pb-12 text-slate-100">
      {/* Top Header / Breadcrumbs */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-400">
            <Link to="/admin/freight-management" className="hover:text-emerald-400 transition-colors">
              {lang === 'kh' ? 'មជ្ឈមណ្ឌលគ្រប់គ្រងការដឹកជញ្ជូន' : 'Freight Management Hub'}
            </Link>
            <span>/</span>
            <span className="text-emerald-400">
              {lang === 'kh' ? 'ការទទួលទំនិញ PO ដែលរង់ចាំ' : 'Pending Receipt PO'}
            </span>
          </div>
          <div className="mt-1 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 border border-emerald-500/20 shadow-sm">
              <img src={clockIcon} alt="Pending PO" className="h-6 w-6 object-contain drop-shadow" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white">
                {lang === 'kh' ? 'ការទទួលទំនិញ PO ដែលរង់ចាំ' : 'Pending Receipt PO'}
              </h1>
              <p className="text-xs sm:text-sm text-slate-400">
                {lang === 'kh'
                  ? 'តាមដានការដឹកជញ្ជូនទំនិញពីអ្នកផ្គត់ផ្គង់ដែលកំពុងធ្វើដំណើរ និងថ្លៃសេវាដឹកជញ្ជូន'
                  : 'Track inbound supplier freight, shipping costs, and pending dock intake balances.'}
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Link
            to="/admin/freight-management"
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-800 bg-slate-900/80 px-3.5 py-2 text-xs font-semibold text-slate-300 hover:bg-slate-800 hover:text-white transition-all shadow-sm"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
            </svg>
            {lang === 'kh' ? 'ត្រឡប់ក្រោយ' : 'Back to Hub'}
          </Link>
        </div>
      </div>

      {/* 1. General Information Search Card */}
      <div className="rounded-3xl border border-slate-800/80 bg-[#141922]/90 p-5 sm:p-6 shadow-xl backdrop-blur-md space-y-4">
        <div>
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <SearchIcon className="w-4 h-4 text-emerald-400" />
            {lang === 'kh' ? 'ព័ត៌មានទូទៅ' : 'General Information'}
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            {lang === 'kh'
              ? 'ស្វែងរកការទទួលទំនិញ PO ដែលរង់ចាំនៅទីនេះ (ឧ. ទាំងអស់, លេខកូដ PO, អ្នកផ្គត់ផ្គង់...)'
              : 'Search pending receipt PO here. Ex(Any,PO Code, Supplier...)'}
          </p>
        </div>

        <form onSubmit={handleSearch} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-4 items-end">
            {/* Search - Textbox */}
            <div className="lg:col-span-5 space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">
                {lang === 'kh' ? 'ស្វែងរក' : 'Search'}
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={searchText}
                  onChange={(e) => setSearchText(e.target.value)}
                  placeholder={
                    lang === 'kh'
                      ? 'ស្វែងរកតាមលក្ខខណ្ឌណាមួយ (PO Code, Supplier)...'
                      : 'Search pending receipt PO here. Ex(Any, PO Code, Supplier)...'
                  }
                  className="w-full rounded-xl border border-slate-800 bg-[#0d1117] px-3.5 py-2.5 pl-9 text-xs sm:text-sm text-white placeholder-slate-500 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 transition-all"
                />
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                  <SearchIcon className="w-4 h-4" />
                </div>
                {searchText && (
                  <button
                    type="button"
                    onClick={() => setSearchText('')}
                    className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-500 hover:text-slate-300"
                  >
                    <XMarkIcon className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>

            {/* Search By - DropDown - Any - Po Code - Supplier */}
            <div className="lg:col-span-3 space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">
                {lang === 'kh' ? 'ស្វែងរកតាម' : 'Search By'}
              </label>
              <select
                value={searchBy}
                onChange={(e) => setSearchBy(e.target.value)}
                className="w-full rounded-xl border border-slate-800 bg-[#0d1117] px-3.5 py-2.5 text-xs sm:text-sm text-white focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 transition-all cursor-pointer"
              >
                {SEARCH_BY_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value} className="bg-slate-900 text-white">
                    {lang === 'kh' ? opt.label.kh : opt.label.en}
                  </option>
                ))}
              </select>
            </div>

            {/* Action Buttons: Search, Advance Filter Toggle, Reset */}
            <div className="lg:col-span-4 flex items-center gap-2">
              {/* Search button */}
              <button
                type="submit"
                className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 px-3.5 py-2.5 text-xs font-bold text-white shadow-lg shadow-emerald-600/25 transition-all hover:scale-[1.02] active:scale-[0.98]"
              >
                <SearchIcon className="w-4 h-4" />
                <span>{lang === 'kh' ? 'ស្វែងរក' : 'Search'}</span>
              </button>

              {/* Advance Filter toggle */}
              <button
                type="button"
                onClick={() => setAdvanceFilterOpen((prev) => !prev)}
                className={`inline-flex items-center gap-1.5 rounded-xl border px-3 py-2.5 text-xs font-semibold transition-all ${
                  advanceFilterOpen || activeAdvanceFilterCount > 0
                    ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-400'
                    : 'border-slate-800 bg-slate-900/80 text-slate-300 hover:bg-slate-800'
                }`}
              >
                <FilterIcon className="w-3.5 h-3.5" />
                <span>{lang === 'kh' ? 'តម្រងកម្រិតខ្ពស់' : 'Advance Filter'}</span>
                {activeAdvanceFilterCount > 0 && (
                  <span className="h-4 w-4 rounded-full bg-emerald-500 text-[10px] font-bold text-black flex items-center justify-center">
                    {activeAdvanceFilterCount}
                  </span>
                )}
                <ChevronDownIcon
                  className={`w-3.5 h-3.5 transition-transform ${advanceFilterOpen ? 'rotate-180' : ''}`}
                />
              </button>

              {/* Reset - button */}
              <button
                type="button"
                onClick={handleReset}
                title={lang === 'kh' ? 'កំណត់ឡើងវិញ' : 'Reset Filters'}
                className="inline-flex items-center justify-center rounded-xl border border-slate-800 bg-slate-900/80 hover:bg-slate-800 px-3 py-2.5 text-xs font-semibold text-slate-300 hover:text-white transition-all shadow-sm"
              >
                <RefreshIcon className="w-4 h-4" />
                <span className="hidden sm:inline ml-1">{lang === 'kh' ? 'កំណត់ឡើងវិញ' : 'Reset'}</span>
              </button>
            </div>
          </div>

          {/* Advance Filter Drawer: Date to Date - Outlet DropDown */}
          {advanceFilterOpen && (
            <div className="rounded-2xl border border-slate-800/80 bg-[#0d1117]/80 p-4 grid grid-cols-1 sm:grid-cols-3 gap-4 animate-fadeIn">
              {/* From Date */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-400">
                  {lang === 'kh' ? 'ចាប់ពីថ្ងៃ (From Date)' : 'From Date'}
                </label>
                <input
                  type="date"
                  value={fromDate}
                  onChange={(e) => setFromDate(e.target.value)}
                  className="w-full rounded-xl border border-slate-800 bg-[#141922] px-3.5 py-2 text-xs text-white focus:border-emerald-500 focus:outline-none"
                />
              </div>

              {/* To Date */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-400">
                  {lang === 'kh' ? 'ដល់ថ្ងៃ (To Date)' : 'To Date'}
                </label>
                <input
                  type="date"
                  value={toDate}
                  onChange={(e) => setToDate(e.target.value)}
                  className="w-full rounded-xl border border-slate-800 bg-[#141922] px-3.5 py-2 text-xs text-white focus:border-emerald-500 focus:outline-none"
                />
              </div>

              {/* Outlet DropDown */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-400">
                  {lang === 'kh' ? 'សាខា / ឃ្លាំង (Outlet)' : 'Outlet'}
                </label>
                <select
                  value={outletFilter}
                  onChange={(e) => setOutletFilter(e.target.value)}
                  className="w-full rounded-xl border border-slate-800 bg-[#141922] px-3.5 py-2 text-xs text-white focus:border-emerald-500 focus:outline-none cursor-pointer"
                >
                  {OUTLET_OPTIONS.map((o) => (
                    <option key={o} value={o} className="bg-slate-900 text-white">
                      {o === 'all'
                        ? lang === 'kh'
                          ? '-- គ្រប់សាខាទាំងអស់ --'
                          : '-- All Outlets --'
                        : o}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}
        </form>
      </div>

      {/* 2. Receipt PO List Section */}
      <div className="rounded-3xl border border-slate-800/80 bg-[#141922]/90 p-5 sm:p-6 shadow-xl backdrop-blur-md">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-5">
          <div>
            <div className="flex items-center gap-2.5">
              <h2 className="text-base sm:text-lg font-bold text-white">
                {lang === 'kh' ? 'បញ្ជីប័ណ្ណទទួល PO' : 'Receipt PO List'}
              </h2>
              <span className="rounded-full bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-0.5 text-xs font-bold text-emerald-400">
                {receipts.length} {lang === 'kh' ? 'កំណត់ត្រា' : 'Items'}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              {lang === 'kh'
                ? 'ព័ត៌មានលម្អិតនៃបញ្ជីប័ណ្ណទទួលទំនិញ PO (លេខកូដប័ណ្ណទទួល, លេខកូដ PO, កាលបរិច្ឆេទ...)'
                : 'Information of Receipt PO List. Ex(Receipt PO Code, PO Code, Date...)'}
            </p>
          </div>

          <div className="flex items-center flex-wrap gap-2">
            {/* Export Button */}
            <button
              type="button"
              onClick={handleExportExcel}
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-800 bg-slate-900/80 px-3.5 py-2 text-xs font-semibold text-slate-300 hover:bg-slate-800 hover:text-white transition-all shadow-sm"
            >
              <DownloadIcon className="w-4 h-4 text-emerald-400" />
              <span>{lang === 'kh' ? 'ទាញយក Excel' : 'Export'}</span>
            </button>

            {/* Choose Column Button */}
            <button
              type="button"
              onClick={() => setChooseColumnOpen(true)}
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-800 bg-slate-900/80 px-3.5 py-2 text-xs font-semibold text-slate-300 hover:bg-slate-800 hover:text-white transition-all shadow-sm"
            >
              <ColumnsIcon className="w-4 h-4 text-emerald-400" />
              <span>{lang === 'kh' ? 'ជ្រើសរើសជួរឈរ' : 'Choose Column'}</span>
            </button>
          </div>
        </div>

        {/* Table View */}
        <div className="overflow-x-auto rounded-2xl border border-slate-800/80 bg-[#0d1117]/60">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-900/70 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                {visibleColumns.includes('poCode') && (
                  <th className="px-4 py-3.5">{lang === 'kh' ? 'លេខកូដ PO' : 'PO Code'}</th>
                )}
                {visibleColumns.includes('receiptPoCode') && (
                  <th className="px-4 py-3.5">{lang === 'kh' ? 'លេខកូដប័ណ្ណទទួល' : 'Receipt PO Code'}</th>
                )}
                {visibleColumns.includes('date') && (
                  <th className="px-4 py-3.5">{lang === 'kh' ? 'កាលបរិច្ឆេទ' : 'Date'}</th>
                )}
                {visibleColumns.includes('supplier') && (
                  <th className="px-4 py-3.5">{lang === 'kh' ? 'អ្នកផ្គត់ផ្គង់' : 'Supplier'}</th>
                )}
                {visibleColumns.includes('balance') && (
                  <th className="px-4 py-3.5 text-right">{lang === 'kh' ? 'សមតុល្យ' : 'Balance'}</th>
                )}
                {visibleColumns.includes('amount') && (
                  <th className="px-4 py-3.5 text-right">{lang === 'kh' ? 'ចំនួនទឹកប្រាក់' : 'Amount'}</th>
                )}
                {visibleColumns.includes('freightAmount') && (
                  <th className="px-4 py-3.5 text-right">{lang === 'kh' ? 'ថ្លៃដឹកជញ្ជូន' : 'Freight Amount'}</th>
                )}
                {visibleColumns.includes('outlet') && (
                  <th className="px-4 py-3.5">{lang === 'kh' ? 'សាខា / ឃ្លាំង' : 'Outlet'}</th>
                )}
                {visibleColumns.includes('status') && (
                  <th className="px-4 py-3.5 text-center">{lang === 'kh' ? 'ស្ថានភាព' : 'Status'}</th>
                )}
                {visibleColumns.includes('actions') && (
                  <th className="px-4 py-3.5 text-right">{lang === 'kh' ? 'សកម្មភាព' : 'Actions'}</th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {loading ? (
                <tr>
                  <td colSpan={visibleColumns.length} className="py-12 text-center text-slate-400">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <div className="h-7 w-7 animate-spin rounded-full border-2 border-emerald-500 border-t-transparent" />
                      <span className="text-xs">{lang === 'kh' ? 'កំពុងផ្ទុកទិន្នន័យ...' : 'Loading receipt POs...'}</span>
                    </div>
                  </td>
                </tr>
              ) : receipts.length === 0 ? (
                <tr>
                  <td colSpan={visibleColumns.length} className="py-12 text-center text-slate-400">
                    <div className="flex flex-col items-center justify-center gap-2 max-w-sm mx-auto">
                      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-800/60 border border-slate-700/50 text-slate-400">
                        <SearchIcon className="w-6 h-6" />
                      </div>
                      <p className="text-sm font-semibold text-slate-300">
                        {lang === 'kh' ? 'មិនមានប័ណ្ណទទួលទំនិញ PO ទេ' : 'No receipt PO records found'}
                      </p>
                      <p className="text-xs text-slate-500">
                        {appliedFilters.search || appliedFilters.fromDate || appliedFilters.toDate || appliedFilters.outlet !== 'all'
                          ? lang === 'kh'
                            ? 'មិនមានទិន្នន័យត្រូវនឹងការស្វែងរករបស់អ្នកទេ។ សូមសាកល្បងកំណត់តម្រងឡើងវិញ។'
                            : 'No records match your search criteria. Try resetting your search filters.'
                          : lang === 'kh'
                          ? 'មិនទាន់មានប័ណ្ណទទួលទំនិញ PO នៅឡើយទេ។'
                          : 'No pending receipt PO records in database yet.'}
                      </p>
                      <button
                        type="button"
                        onClick={handleReset}
                        className="mt-2 text-xs font-semibold text-emerald-400 hover:text-emerald-300 underline"
                      >
                        {lang === 'kh' ? 'កំណត់តម្រងឡើងវិញ' : 'Reset Search Filters'}
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                receipts.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-800/30 transition-colors group">
                    {/* PO Code */}
                    {visibleColumns.includes('poCode') && (
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        <span className="font-mono text-xs font-bold text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2.5 py-1 rounded-lg">
                          {r.poCode || '—'}
                        </span>
                      </td>
                    )}

                    {/* Receipt PO Code */}
                    {visibleColumns.includes('receiptPoCode') && (
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        <span className="font-mono text-xs font-semibold text-blue-400 bg-blue-500/10 border border-blue-500/20 px-2.5 py-1 rounded-lg">
                          {r.receiptPoCode || '—'}
                        </span>
                      </td>
                    )}

                    {/* Date */}
                    {visibleColumns.includes('date') && (
                      <td className="px-4 py-3.5 whitespace-nowrap text-slate-300 font-medium">
                        {r.date || '—'}
                      </td>
                    )}

                    {/* Supplier */}
                    {visibleColumns.includes('supplier') && (
                      <td className="px-4 py-3.5 font-medium text-white">
                        {r.supplier || '—'}
                      </td>
                    )}

                    {/* Balance */}
                    {visibleColumns.includes('balance') && (
                      <td className="px-4 py-3.5 text-right font-mono font-bold text-amber-300 whitespace-nowrap">
                        ${Number(r.balance || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                    )}

                    {/* Amount */}
                    {visibleColumns.includes('amount') && (
                      <td className="px-4 py-3.5 text-right font-mono font-bold text-white whitespace-nowrap">
                        ${Number(r.amount || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                    )}

                    {/* Freight Amount */}
                    {visibleColumns.includes('freightAmount') && (
                      <td className="px-4 py-3.5 text-right whitespace-nowrap">
                        <span className="font-mono font-bold text-cyan-400 bg-cyan-500/10 border border-cyan-500/20 px-2 py-0.5 rounded-lg">
                          ${Number(r.freightAmount || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </span>
                      </td>
                    )}

                    {/* Outlet */}
                    {visibleColumns.includes('outlet') && (
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-800 border border-slate-700/80 px-2.5 py-0.5 text-xs text-slate-300">
                          {r.outlet || '—'}
                        </span>
                      </td>
                    )}

                    {/* Status */}
                    {visibleColumns.includes('status') && (
                      <td className="px-4 py-3.5 text-center whitespace-nowrap">
                        <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-bold ${getStatusBadge(r.status)}`}>
                          <span className="h-1.5 w-1.5 rounded-full bg-current" />
                          {r.status || 'PENDING'}
                        </span>
                      </td>
                    )}

                    {/* Actions */}
                    {visibleColumns.includes('actions') && (
                      <td className="px-4 py-3.5 text-right whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedReceipt(r)
                            setDetailModalOpen(true)
                          }}
                          title={lang === 'kh' ? 'មើលព័ត៌មានលម្អិត' : 'View Details'}
                          className="rounded-lg p-1.5 text-slate-400 hover:bg-emerald-500/10 hover:text-emerald-400 transition-colors"
                        >
                          <EyeIcon className="w-4 h-4" />
                        </button>
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 3. Choose Column Modal */}
      {chooseColumnOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-md rounded-3xl border border-slate-800 bg-[#141922] p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <ColumnsIcon className="w-4 h-4 text-emerald-400" />
                  {lang === 'kh' ? 'ជ្រើសរើសជួរឈរ' : 'Choose Column'}
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  {lang === 'kh'
                    ? 'ជ្រើសរើសជួរឈរដែលអ្នកចង់បង្ហាញនៅលើតារាង'
                    : 'Choose column you want to display on table'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setChooseColumnOpen(false)}
                className="rounded-xl p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
              >
                <XMarkIcon className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
              {ALL_COLUMNS.map((col) => {
                const isChecked = visibleColumns.includes(col.key)
                const isMandatory = col.always
                return (
                  <label
                    key={col.key}
                    className={`flex items-center justify-between p-2.5 rounded-xl border transition-all cursor-pointer ${
                      isChecked
                        ? 'border-emerald-500/30 bg-emerald-500/10 text-white'
                        : 'border-slate-800 bg-slate-900/50 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <span className="text-xs font-semibold">
                      {lang === 'kh' ? col.label.kh : col.label.en}
                      {isMandatory && (
                        <span className="ml-1.5 text-[10px] text-slate-500 uppercase font-mono">
                          ({lang === 'kh' ? 'ចាំបាច់' : 'Required'})
                        </span>
                      )}
                    </span>
                    <input
                      type="checkbox"
                      checked={isChecked}
                      disabled={isMandatory}
                      onChange={() => toggleColumn(col.key)}
                      className="h-4 w-4 rounded border-slate-700 bg-slate-800 text-emerald-600 focus:ring-emerald-500 disabled:opacity-50 cursor-pointer"
                    />
                  </label>
                )
              })}
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setVisibleColumns(DEFAULT_VISIBLE_COLUMNS)}
                className="text-xs font-semibold text-slate-400 hover:text-white transition-colors"
              >
                {lang === 'kh' ? 'កំណត់លំនាំដើមឡើងវិញ' : 'Reset to Default'}
              </button>
              <button
                type="button"
                onClick={() => setChooseColumnOpen(false)}
                className="rounded-xl bg-emerald-600 hover:bg-emerald-500 px-4 py-2 text-xs font-bold text-white shadow-md transition-all"
              >
                {lang === 'kh' ? 'រួចរាល់' : 'Done'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 4. Detailed View Modal */}
      {detailModalOpen && selectedReceipt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-3xl rounded-3xl border border-slate-800 bg-[#141922] p-6 sm:p-7 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-bold text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded">
                    {selectedReceipt.poCode}
                  </span>
                  <span className="font-mono text-xs font-bold text-blue-400 bg-blue-500/10 border border-blue-500/20 px-2 py-0.5 rounded">
                    {selectedReceipt.receiptPoCode}
                  </span>
                </div>
                <h3 className="text-lg font-bold text-white mt-1">
                  {selectedReceipt.supplier}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setDetailModalOpen(false)}
                className="rounded-xl p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
              >
                <XMarkIcon className="w-5 h-5" />
              </button>
            </div>

            {/* Financial & Logistics Metric Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="rounded-2xl border border-slate-800 bg-[#0d1117] p-3.5">
                <span className="text-[11px] text-slate-400 block font-medium">Balance</span>
                <span className="text-base font-bold text-amber-400 font-mono">
                  ${Number(selectedReceipt.balance || 0).toFixed(2)}
                </span>
              </div>
              <div className="rounded-2xl border border-slate-800 bg-[#0d1117] p-3.5">
                <span className="text-[11px] text-slate-400 block font-medium">Order Amount</span>
                <span className="text-base font-bold text-white font-mono">
                  ${Number(selectedReceipt.amount || 0).toFixed(2)}
                </span>
              </div>
              <div className="rounded-2xl border border-cyan-500/20 bg-cyan-500/5 p-3.5">
                <span className="text-[11px] text-cyan-400 block font-medium">Freight Amount</span>
                <span className="text-base font-bold text-cyan-400 font-mono">
                  ${Number(selectedReceipt.freightAmount || 0).toFixed(2)}
                </span>
              </div>
              <div className="rounded-2xl border border-slate-800 bg-[#0d1117] p-3.5">
                <span className="text-[11px] text-slate-400 block font-medium">Status</span>
                <span className={`inline-flex items-center mt-1 px-2 py-0.5 rounded text-[11px] font-bold ${getStatusBadge(selectedReceipt.status)}`}>
                  {selectedReceipt.status}
                </span>
              </div>
            </div>

            {/* Logistics Attributes */}
            <div className="rounded-2xl border border-slate-800 bg-[#0d1117]/60 p-4 grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
              <div>
                <span className="text-slate-400 block">Date:</span>
                <span className="font-semibold text-white">{selectedReceipt.date || '—'}</span>
              </div>
              <div>
                <span className="text-slate-400 block">Outlet Destination:</span>
                <span className="font-semibold text-white">{selectedReceipt.outlet || '—'}</span>
              </div>
              <div>
                <span className="text-slate-400 block">Shipment Method:</span>
                <span className="font-semibold text-white">{selectedReceipt.shipment || '—'}</span>
              </div>
              <div>
                <span className="text-slate-400 block">Reference:</span>
                <span className="font-semibold text-white">{selectedReceipt.reference || '—'}</span>
              </div>
              <div>
                <span className="text-slate-400 block">Receiver User:</span>
                <span className="font-semibold text-white">{selectedReceipt.username || '—'}</span>
              </div>
              <div>
                <span className="text-slate-400 block">Dock Note:</span>
                <span className="font-semibold text-white">{selectedReceipt.note || '—'}</span>
              </div>
            </div>

            {/* Line Items Table */}
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300 mb-2">
                Itemized Inbound Manifest ({selectedReceipt.items?.length || 0} items)
              </h4>
              <div className="overflow-x-auto rounded-xl border border-slate-800 bg-[#0d1117]">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-800 bg-slate-900/80 text-[11px] font-bold text-slate-400">
                      <th className="px-3.5 py-2.5">Code / Barcode</th>
                      <th className="px-3.5 py-2.5">Description</th>
                      <th className="px-3.5 py-2.5 text-center">Qty</th>
                      <th className="px-3.5 py-2.5 text-center">UOM</th>
                      <th className="px-3.5 py-2.5 text-right">Cost</th>
                      <th className="px-3.5 py-2.5 text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {selectedReceipt.items && selectedReceipt.items.length > 0 ? (
                      selectedReceipt.items.map((it, idx) => (
                        <tr key={idx} className="hover:bg-slate-800/30">
                          <td className="px-3.5 py-2 font-mono whitespace-nowrap">
                            <span className="text-blue-400 font-bold">{it.code}</span>
                            {it.barcode && <span className="text-slate-500 text-[11px] block">{it.barcode}</span>}
                          </td>
                          <td className="px-3.5 py-2 text-white font-medium">{it.description || '—'}</td>
                          <td className="px-3.5 py-2 text-center font-bold text-white">{it.qty}</td>
                          <td className="px-3.5 py-2 text-center text-slate-400">{it.uom || '—'}</td>
                          <td className="px-3.5 py-2 text-right font-mono text-slate-300">
                            ${Number(it.cost || 0).toFixed(2)}
                          </td>
                          <td className="px-3.5 py-2 text-right font-mono font-bold text-white">
                            ${Number(it.total || 0).toFixed(2)}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={6} className="py-4 text-center text-slate-500">
                          No line items recorded for this receipt.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Footer */}
            <div className="flex justify-end pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setDetailModalOpen(false)}
                className="rounded-xl bg-slate-800 hover:bg-slate-700 px-5 py-2 text-xs font-bold text-white transition-all"
              >
                {lang === 'kh' ? 'បិទ' : 'Close'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
