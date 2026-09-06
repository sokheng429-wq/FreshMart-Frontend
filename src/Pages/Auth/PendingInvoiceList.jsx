import React, { useState, useEffect, useMemo, useCallback } from 'react'
import { Link } from 'react-router-dom'
import * as XLSX from 'xlsx'
import { useLanguage } from '../../context/LanguageContext'
import { useNotifications } from '../../context/NotificationContext'
import { adminSaleInvoiceAPI } from '../../api/api'
import { SaleInvoicePrintModal } from './SaleInvoicePrintModal'
import { SaleInvoicePaymentModal } from './SaleInvoicePaymentModal'
import clockIcon from '../../assets/icon/3dicons-clock-dynamic-color.png'

const ALL_COLUMNS = [
  { key: 'invoiceCode', label: { en: 'Code', kh: 'លេខកូដ' }, always: true },
  { key: 'invoiceDate', label: { en: 'Date', kh: 'កាលបរិច្ឆេទ' }, always: true },
  { key: 'customerName', label: { en: 'Customer', kh: 'អតិថិជន' }, always: true },
  { key: 'customerPhone', label: { en: 'Phone', kh: 'ទូរស័ព្ទ' } },
  { key: 'grandTotal', label: { en: 'Total ($)', kh: 'សរុប ($)' }, always: true },
  { key: 'balance', label: { en: 'Balance ($)', kh: 'សមតុល្យនៅសល់ ($)' } },
  { key: 'dueDate', label: { en: 'Due Date', kh: 'ថ្ងៃផុតកំណត់' } },
  { key: 'paymentTerm', label: { en: 'Payment Term', kh: 'លក្ខខណ្ឌ' } },
  { key: 'salesperson', label: { en: 'Salesperson', kh: 'អ្នកលក់' } },
  { key: 'outlet', label: { en: 'Outlet', kh: 'សាខា' } },
  { key: 'status', label: { en: 'Status', kh: 'ស្ថានភាព' } },
]

const DEFAULT_VISIBLE_COLUMNS = [
  'invoiceCode',
  'invoiceDate',
  'customerName',
  'customerPhone',
  'grandTotal',
  'balance',
  'dueDate',
  'status',
]

const OUTLETS = ['Main Branch - Phnom Penh', 'Toul Kork Outlet', 'BKK1 Branch', 'Siem Reap Outlet', 'Battambang Store']

export const PendingInvoiceList = () => {
  const { lang } = useLanguage()
  const { addNotification } = useNotifications()

  const [invoices, setInvoices] = useState([])
  const [loading, setLoading] = useState(true)

  // General Search & Search By
  const [searchQuery, setSearchQuery] = useState('')
  const [searchBy, setSearchBy] = useState('any') // any, invoiceCode, customer, phone

  // Advance Filter
  const [showAdvanceFilter, setShowAdvanceFilter] = useState(false)
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [selectedOutlet, setSelectedOutlet] = useState('all')

  // Pagination
  const [page, setPage] = useState(1)
  const pageSize = 12

  // Column Visibility Modal
  const [visibleCols, setVisibleCols] = useState(() => {
    try {
      const saved = localStorage.getItem('bg_pending_invoice_columns')
      if (saved) return new Set(JSON.parse(saved))
    } catch {}
    return new Set(DEFAULT_VISIBLE_COLUMNS)
  })
  const [colDraft, setColDraft] = useState(new Set(DEFAULT_VISIBLE_COLUMNS))
  const [showColModal, setShowColModal] = useState(false)

  // Modals
  const [selectedInvoice, setSelectedInvoice] = useState(null)
  const [showPrintModal, setShowPrintModal] = useState(false)
  const [showPayModal, setShowPayModal] = useState(false)
  const [savingPayment, setSavingPayment] = useState(false)

  // Load Invoices
  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      const res = await adminSaleInvoiceAPI.getAll({
        search: searchQuery,
        searchBy: searchBy === 'code' ? 'invoiceCode' : searchBy,
        outlet: selectedOutlet,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
      })

      const list = res?.data || res || []
      const arr = Array.isArray(list) ? list : []
      // Filter only pending / unpaid / partial / credit / draft
      const pendingList = arr.filter((inv) => {
        const s = (inv.status || '').toUpperCase()
        const hasBalance = Number(inv.balance) > 0
        return s !== 'PAID' && s !== 'VOID' && (hasBalance || s === 'UNPAID' || s === 'PARTIAL' || s === 'CREDIT' || s === 'DRAFT')
      })

      setInvoices(pendingList)
      setLoading(false)
    } catch (err) {
      console.error('Failed to load pending invoices:', err)
      setLoading(false)
    }
  }, [searchQuery, searchBy, selectedOutlet, startDate, endDate])

  useEffect(() => {
    loadData()
  }, [loadData])

  // Apply Columns
  const handleApplyColumns = () => {
    setVisibleCols(new Set(colDraft))
    try {
      localStorage.setItem('bg_pending_invoice_columns', JSON.stringify(Array.from(colDraft)))
    } catch {}
    setShowColModal(false)
    addNotification?.({
      type: 'success',
      title: 'Columns Updated',
      message: 'Your table column preferences have been saved.',
    })
  }

  // Export to Excel
  const handleExportExcel = () => {
    if (invoices.length === 0) {
      addNotification?.({
        type: 'warning',
        title: 'Export Warning',
        message: 'No pending invoice data to export.',
      })
      return
    }

    const exportRows = invoices.map((inv, idx) => {
      const row = { '#': idx + 1 }
      ALL_COLUMNS.forEach((col) => {
        if (visibleCols.has(col.key)) {
          const header = lang === 'en' ? col.label.en : col.label.kh
          let val = inv[col.key] || ''
          if (col.key === 'grandTotal' || col.key === 'balance') {
            val = Number(val || 0).toFixed(2)
          }
          row[header] = val
        }
      })
      return row
    })

    const worksheet = XLSX.utils.json_to_sheet(exportRows)
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Pending Invoices')
    const fileName = `Pending_Invoices_${new Date().toISOString().slice(0, 10)}.xlsx`
    XLSX.writeFile(workbook, fileName)

    addNotification?.({
      type: 'success',
      title: 'Export Completed',
      message: `Exported ${exportRows.length} pending invoices to ${fileName}.`,
    })
  }

  // Settle Payment
  const handleRecordPayment = async (paymentInfo) => {
    if (!selectedInvoice) return
    setSavingPayment(true)
    try {
      await adminSaleInvoiceAPI.recordPayment(selectedInvoice.id, {
        amountDollar: paymentInfo.paidAmount,
        amountKhmer: Math.round(paymentInfo.paidAmount * (selectedInvoice.exchangeRate || 4100)),
        paymentType: paymentInfo.paymentType,
        reference: paymentInfo.reference,
        note: paymentInfo.note,
        receivedBy: 'Staff',
      })

      setShowPayModal(false)
      setSelectedInvoice(null)
      setSavingPayment(false)
      loadData()

      addNotification?.({
        type: 'success',
        title: 'Payment Recorded',
        message: `Settlement recorded for #${selectedInvoice.invoiceCode}.`,
      })
    } catch (err) {
      console.error('Failed to record payment:', err)
      setSavingPayment(false)
      addNotification?.({
        type: 'error',
        title: 'Payment Failed',
        message: err.message || 'Could not record payment.',
      })
    }
  }

  // KPI Calculations
  const stats = useMemo(() => {
    const totalCount = invoices.length
    const totalPendingAmount = invoices.reduce((sum, i) => sum + Number(i.balance || i.grandTotal || 0), 0)
    const overdueCount = invoices.filter((i) => {
      if (!i.dueDate) return false
      return new Date(i.dueDate) < new Date()
    }).length
    return { totalCount, totalPendingAmount, overdueCount }
  }, [invoices])

  // Pagination Slice
  const totalPages = Math.ceil(invoices.length / pageSize) || 1
  const paginatedInvoices = useMemo(() => {
    const start = (page - 1) * pageSize
    return invoices.slice(start, start + pageSize)
  }, [invoices, page])

  const formatCurrency = (val) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(Number(val) || 0)

  return (
    <div className="min-h-screen bg-slate-950 text-white p-4 sm:p-6 lg:p-8 space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800/80 pb-6">
        <div className="flex items-center gap-3">
          <Link
            to="/admin/sale-dashboard"
            className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-900 border border-slate-700 text-slate-300 hover:text-white hover:bg-slate-800 transition"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
          </Link>
          <img src={clockIcon} alt="Pending Invoice" className="w-10 h-10 object-contain drop-shadow-md" />
          <div>
            <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white flex items-center gap-2">
              <span>{lang === 'en' ? 'Pending Invoices' : 'វិក័យប័ត្រមិនទាន់ទូទាត់'}</span>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 font-bold">
                {invoices.length} {lang === 'en' ? 'Pending' : 'នៅសល់'}
              </span>
            </h1>
            <p className="text-xs text-slate-400 mt-0.5">
              {lang === 'en'
                ? 'Track, filter, and settle unpaid customer invoices & outstanding balances'
                : 'តាមដាន ត្រួតពិនិត្យ និងទូទាត់វិក័យប័ត្រដែលមិនទាន់បានបង់ប្រាក់'}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => {
              setColDraft(new Set(visibleCols))
              setShowColModal(true)
            }}
            className="inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl border border-slate-700 bg-slate-900 text-xs font-bold text-slate-300 hover:text-white hover:bg-slate-800 transition"
          >
            <svg className="w-4 h-4 text-[#77BC1F]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" />
            </svg>
            {lang === 'en' ? 'Choose Column' : 'ជ្រើសរើសជួរឈរ'}
          </button>

          <button
            onClick={handleExportExcel}
            className="inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl border border-slate-700 bg-slate-900 text-xs font-bold text-slate-300 hover:text-white hover:bg-slate-800 transition"
          >
            <svg className="w-4 h-4 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            {lang === 'en' ? 'Export Excel' : 'ទាញយក Excel'}
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-2xl border border-slate-800/80 bg-slate-900/60 p-4 flex items-center justify-between shadow-lg">
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">{lang === 'en' ? 'Pending Count' : 'ចំនួនមិនទាន់បង់'}</p>
            <h3 className="text-2xl font-black text-amber-400 mt-1">{stats.totalCount}</h3>
          </div>
          <div className="h-11 w-11 rounded-xl bg-amber-500/15 flex items-center justify-center text-amber-400">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-800/80 bg-slate-900/60 p-4 flex items-center justify-between shadow-lg">
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">{lang === 'en' ? 'Outstanding Balance' : 'សមតុល្យនៅខ្វះសរុប'}</p>
            <h3 className="text-2xl font-black text-red-400 mt-1">{formatCurrency(stats.totalPendingAmount)}</h3>
          </div>
          <div className="h-11 w-11 rounded-xl bg-red-500/15 flex items-center justify-center text-red-400">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-800/80 bg-slate-900/60 p-4 flex items-center justify-between shadow-lg">
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">{lang === 'en' ? 'Overdue Invoices' : 'វិក័យប័ត្រហួសកាលកំណត់'}</p>
            <h3 className="text-2xl font-black text-purple-400 mt-1">{stats.overdueCount}</h3>
          </div>
          <div className="h-11 w-11 rounded-xl bg-purple-500/15 flex items-center justify-center text-purple-400">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
        </div>
      </div>

      {/* General Information Search & Advance Filter Bar */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-4 space-y-3 shadow-xl">
        <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3">
          {/* Search Textbox */}
          <div className="relative flex-1">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value)
                setPage(1)
              }}
              placeholder={lang === 'en' ? 'Search pending invoices...' : 'ស្វែងរកវិក័យប័ត្រមិនទាន់បង់...'}
              className="w-full rounded-xl border border-slate-700 bg-slate-950 pl-10 pr-4 py-2.5 text-xs sm:text-sm text-white placeholder-slate-500 focus:border-amber-400 focus:outline-none"
            />
            <svg className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>

          {/* Search By Dropdown: Any - Code - Customer - Phone */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider whitespace-nowrap">
              {lang === 'en' ? 'Search By:' : 'ស្វែងរកតាម:'}
            </span>
            <select
              value={searchBy}
              onChange={(e) => {
                setSearchBy(e.target.value)
                setPage(1)
              }}
              className="rounded-xl border border-slate-700 bg-slate-950 px-3 py-2.5 text-xs font-bold text-slate-200 focus:border-amber-400 focus:outline-none cursor-pointer"
            >
              <option value="any">{lang === 'en' ? 'Any' : 'ទាំងអស់'}</option>
              <option value="code">{lang === 'en' ? 'Code' : 'លេខកូដ'}</option>
              <option value="customer">{lang === 'en' ? 'Customer' : 'អតិថិជន'}</option>
              <option value="phone">{lang === 'en' ? 'Phone' : 'ទូរស័ព្ទ'}</option>
            </select>
          </div>

          {/* Advance Filter Toggle Button */}
          <button
            onClick={() => setShowAdvanceFilter(!showAdvanceFilter)}
            className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border text-xs font-bold transition ${
              showAdvanceFilter || startDate || endDate || selectedOutlet !== 'all'
                ? 'border-amber-500 bg-amber-500/10 text-amber-300'
                : 'border-slate-700 bg-slate-950 text-slate-300 hover:text-white hover:bg-slate-800'
            }`}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
            </svg>
            {lang === 'en' ? 'Advance Filter' : 'តម្រងកម្រិតខ្ពស់'}
            {(startDate || endDate || selectedOutlet !== 'all') && (
              <span className="h-2 w-2 rounded-full bg-amber-400"></span>
            )}
          </button>
        </div>

        {/* Advance Filter Drawer (Date to Date & Outlet) */}
        {showAdvanceFilter && (
          <div className="pt-3 border-t border-slate-800/80 grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-slate-400 uppercase mb-1">
                {lang === 'en' ? 'From Date' : 'ចាប់ពីថ្ងៃ'}
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-xs font-semibold text-white focus:border-amber-400 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-400 uppercase mb-1">
                {lang === 'en' ? 'To Date' : 'ដល់ថ្ងៃ'}
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-xs font-semibold text-white focus:border-amber-400 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-400 uppercase mb-1">
                {lang === 'en' ? 'Outlet' : 'សាខា'}
              </label>
              <select
                value={selectedOutlet}
                onChange={(e) => setSelectedOutlet(e.target.value)}
                className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-xs font-semibold text-white focus:border-amber-400 focus:outline-none cursor-pointer"
              >
                <option value="all">{lang === 'en' ? 'All Outlets' : 'គ្រប់សាខាទាំងអស់'}</option>
                {OUTLETS.map((o) => (
                  <option key={o} value={o}>{o}</option>
                ))}
              </select>
            </div>

            <div className="sm:col-span-3 flex justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => {
                  setStartDate('')
                  setEndDate('')
                  setSelectedOutlet('all')
                }}
                className="px-3 py-1.5 rounded-lg border border-slate-700 text-xs font-bold text-slate-400 hover:text-white"
              >
                {lang === 'en' ? 'Clear Filter' : 'សម្អាតតម្រង'}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Pending Invoice Table */}
      <div className="rounded-2xl border border-slate-800/80 bg-slate-900/60 overflow-hidden shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-950/70 text-slate-400 uppercase text-[10px] tracking-wider">
                <th className="py-3 px-4 w-12 text-center">#</th>
                {ALL_COLUMNS.filter((c) => visibleCols.has(c.key)).map((col) => (
                  <th key={col.key} className="py-3 px-4 font-bold">
                    {lang === 'en' ? col.label.en : col.label.kh}
                  </th>
                ))}
                <th className="py-3 px-4 text-right">{lang === 'en' ? 'Actions' : 'សកម្មភាព'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {loading ? (
                <tr>
                  <td colSpan={visibleCols.size + 2} className="py-12 text-center text-slate-400">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <div className="h-7 w-7 animate-spin rounded-full border-2 border-amber-400 border-t-transparent" />
                      <span>{lang === 'en' ? 'Loading pending invoices...' : 'កំពុងផ្ទុកវិក័យប័ត្រ...'}</span>
                    </div>
                  </td>
                </tr>
              ) : paginatedInvoices.length === 0 ? (
                <tr>
                  <td colSpan={visibleCols.size + 2} className="py-12 text-center text-slate-400">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <span className="text-3xl">🎉</span>
                      <span className="font-bold text-slate-300">
                        {lang === 'en' ? 'No pending invoices found' : 'មិនមានវិក័យប័ត្រដែលត្រូវទូទាត់ទេ'}
                      </span>
                      <span className="text-xs text-slate-500">
                        {lang === 'en' ? 'All customer invoices are settled or matched criteria.' : 'វិក័យប័ត្រទាំងអស់ត្រូវបានទូទាត់រួចរាល់។'}
                      </span>
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedInvoices.map((inv, idx) => (
                  <tr key={inv.id || idx} className="hover:bg-slate-800/40 transition">
                    <td className="py-3 px-4 text-center font-bold text-slate-500">
                      {(page - 1) * pageSize + idx + 1}
                    </td>

                    {visibleCols.has('invoiceCode') && (
                      <td className="py-3 px-4">
                        <button
                          onClick={() => {
                            setSelectedInvoice(inv)
                            setShowPrintModal(true)
                          }}
                          className="font-black text-amber-400 hover:text-amber-300 hover:underline"
                        >
                          {inv.invoiceCode}
                        </button>
                      </td>
                    )}

                    {visibleCols.has('invoiceDate') && (
                      <td className="py-3 px-4 text-slate-300 font-semibold">
                        {inv.invoiceDate || '—'}
                      </td>
                    )}

                    {visibleCols.has('customerName') && (
                      <td className="py-3 px-4">
                        <p className="font-bold text-white">{inv.customerName || 'Walk-in Customer'}</p>
                        {inv.customerPhone && <p className="text-[10px] text-slate-400">{inv.customerPhone}</p>}
                      </td>
                    )}

                    {visibleCols.has('customerPhone') && (
                      <td className="py-3 px-4 text-slate-300">
                        {inv.customerPhone || '—'}
                      </td>
                    )}

                    {visibleCols.has('grandTotal') && (
                      <td className="py-3 px-4 font-bold text-white">
                        {formatCurrency(inv.grandTotal)}
                      </td>
                    )}

                    {visibleCols.has('balance') && (
                      <td className="py-3 px-4 font-black text-red-400">
                        {formatCurrency(inv.balance || inv.grandTotal)}
                      </td>
                    )}

                    {visibleCols.has('dueDate') && (
                      <td className="py-3 px-4 text-slate-300">
                        {inv.dueDate || '—'}
                      </td>
                    )}

                    {visibleCols.has('paymentTerm') && (
                      <td className="py-3 px-4 text-slate-300">
                        {inv.paymentTerm || 'Cash'}
                      </td>
                    )}

                    {visibleCols.has('salesperson') && (
                      <td className="py-3 px-4 text-slate-300">
                        {inv.salesperson || 'Staff'}
                      </td>
                    )}

                    {visibleCols.has('outlet') && (
                      <td className="py-3 px-4 text-slate-400 text-[11px]">
                        {inv.outlet || 'Main Branch'}
                      </td>
                    )}

                    {visibleCols.has('status') && (
                      <td className="py-3 px-4">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-500/10 text-amber-400 border border-amber-500/30">
                          {inv.status || 'UNPAID'}
                        </span>
                      </td>
                    )}

                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => {
                            setSelectedInvoice(inv)
                            setShowPayModal(true)
                          }}
                          className="px-3 py-1.5 rounded-lg bg-[#FF9900] hover:bg-orange-500 text-slate-950 font-black text-[11px] uppercase tracking-wider shadow transition"
                        >
                          {lang === 'en' ? 'Make Pay' : 'ទូទាត់'}
                        </button>
                        <button
                          onClick={() => {
                            setSelectedInvoice(inv)
                            setShowPrintModal(true)
                          }}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
                          title="Print / View"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-slate-800 bg-slate-950/60 text-xs">
            <span className="text-slate-400">
              {lang === 'en'
                ? `Showing ${paginatedInvoices.length} of ${invoices.length} entries`
                : `បង្ហាញ ${paginatedInvoices.length} ក្នុងចំណោម ${invoices.length}`}
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-3 py-1 rounded-lg border border-slate-700 disabled:opacity-40"
              >
                {lang === 'en' ? 'Prev' : 'មុន'}
              </button>
              <span className="font-bold text-amber-400">
                {page} / {totalPages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="px-3 py-1 rounded-lg border border-slate-700 disabled:opacity-40"
              >
                {lang === 'en' ? 'Next' : 'បន្ទាប់'}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* CHOOSE COLUMN MODAL */}
      {showColModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-slate-700 bg-slate-900 p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-black text-white">
                {lang === 'en' ? 'Customize Table Columns' : 'កំណត់ជួរឈរតារាង'}
              </h3>
              <button onClick={() => setShowColModal(false)} className="text-slate-400 hover:text-white">
                ✕
              </button>
            </div>
            <div className="grid grid-cols-2 gap-2 max-h-72 overflow-y-auto pr-1">
              {ALL_COLUMNS.map((col) => (
                <label
                  key={col.key}
                  className={`flex items-center gap-2.5 p-2 rounded-xl border text-xs font-semibold cursor-pointer transition ${
                    colDraft.has(col.key)
                      ? 'border-[#77BC1F]/60 bg-green-500/10 text-white'
                      : 'border-slate-800 bg-slate-950/60 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={colDraft.has(col.key)}
                    onChange={() => {
                      const next = new Set(colDraft)
                      if (next.has(col.key)) {
                        if (next.size > 1) next.delete(col.key)
                      } else {
                        next.add(col.key)
                      }
                      setColDraft(next)
                    }}
                    className="accent-[#77BC1F] rounded"
                  />
                  <span>{lang === 'en' ? col.label.en : col.label.kh}</span>
                </label>
              ))}
            </div>
            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setShowColModal(false)}
                className="px-4 py-2 rounded-xl border border-slate-700 text-xs font-bold text-slate-300"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleApplyColumns}
                className="px-5 py-2 rounded-xl bg-[#77BC1F] text-slate-950 text-xs font-black uppercase tracking-wider"
              >
                Apply Columns
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PAYMENT MODAL */}
      {selectedInvoice && (
        <SaleInvoicePaymentModal
          open={showPayModal}
          onClose={() => {
            setShowPayModal(false)
            setSelectedInvoice(null)
          }}
          invoiceData={{
            invoiceCode: selectedInvoice.invoiceCode,
            grandTotal: selectedInvoice.balance || selectedInvoice.grandTotal,
            exchangeRate: selectedInvoice.exchangeRate || 4100,
          }}
          saving={savingPayment}
          onSaveAndPay={handleRecordPayment}
          onPreview={() => {
            setShowPayModal(false)
            setShowPrintModal(true)
          }}
          onPrint={() => {
            setShowPayModal(false)
            setShowPrintModal(true)
          }}
        />
      )}

      {/* PRINT PREVIEW MODAL */}
      {selectedInvoice && (
        <SaleInvoicePrintModal
          open={showPrintModal}
          invoice={selectedInvoice}
          onClose={() => {
            setShowPrintModal(false)
            setSelectedInvoice(null)
          }}
        />
      )}
    </div>
  )
}
export default PendingInvoiceList
