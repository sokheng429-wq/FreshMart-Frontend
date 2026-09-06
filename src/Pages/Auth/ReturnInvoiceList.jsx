import React, { useState, useEffect, useMemo, useCallback } from 'react'
import { Link } from 'react-router-dom'
import * as XLSX from 'xlsx'
import { useLanguage } from '../../context/LanguageContext'
import { useNotifications } from '../../context/NotificationContext'
import { adminReturnInvoiceAPI, adminSaleInvoiceAPI } from '../../api/api'
import undoIcon from '../../assets/icon/3dicons-travel-dynamic-color.png'

const ALL_COLUMNS = [
  { key: 'invoiceCode', label: { en: 'Invoice Code', kh: 'លេខកូដវិក័យប័ត្រត្រឡប់' }, always: true },
  { key: 'applyToInvoice', label: { en: 'Apply to Invoice', kh: 'វិក័យប័ត្រយោង' }, always: true },
  { key: 'returnDate', label: { en: 'Date', kh: 'កាលបរិច្ឆេទ' }, always: true },
  { key: 'customerName', label: { en: 'Customer', kh: 'អតិថិជន' }, always: true },
  { key: 'customerPhone', label: { en: 'Phone', kh: 'ទូរស័ព្ទ' } },
  { key: 'grandTotal', label: { en: 'Total ($)', kh: 'សរុប ($)' }, always: true },
  { key: 'balance', label: { en: 'Balance ($)', kh: 'សមតុល្យ ($)' } },
  { key: 'taxCode', label: { en: 'Tax Code', kh: 'កូដពន្ធ' } },
  { key: 'customerAddress', label: { en: 'Address', kh: 'អាសយដ្ឋាន' } },
  { key: 'paymentTerm', label: { en: 'Payment Term', kh: 'លក្ខខណ្ឌ' } },
  { key: 'salesperson', label: { en: 'Salesperson', kh: 'អ្នកលក់' } },
  { key: 'markup', label: { en: 'Markup ($)', kh: 'បន្ថែម ($)' } },
  { key: 'outlet', label: { en: 'Outlet', kh: 'សាខា' } },
  { key: 'username', label: { en: 'User', kh: 'អ្នកប្រើប្រាស់' } },
  { key: 'soCode', label: { en: 'SO Code', kh: 'កូដ SO' } },
  { key: 'status', label: { en: 'Status', kh: 'ស្ថានភាព' }, always: true },
]

const DEFAULT_VISIBLE_COLUMNS = [
  'invoiceCode',
  'applyToInvoice',
  'returnDate',
  'customerName',
  'customerPhone',
  'grandTotal',
  'outlet',
  'status',
]

const OUTLETS = ['Main Branch - Phnom Penh', 'Toul Kork Outlet', 'BKK1 Branch', 'Siem Reap Outlet', 'Battambang Store']

export const ReturnInvoiceList = () => {
  const { lang } = useLanguage()
  const { addNotification } = useNotifications()

  const [returnInvoices, setReturnInvoices] = useState([])
  const [loading, setLoading] = useState(true)

  // General Search & Search By
  const [searchQuery, setSearchQuery] = useState('')
  const [searchBy, setSearchBy] = useState('any') // any, invoiceCode, applyToInvoice, customer, phone

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
      const saved = localStorage.getItem('bg_return_invoice_columns')
      if (saved) return new Set(JSON.parse(saved))
    } catch {}
    return new Set(DEFAULT_VISIBLE_COLUMNS)
  })
  const [colDraft, setColDraft] = useState(new Set(DEFAULT_VISIBLE_COLUMNS))
  const [showColModal, setShowColModal] = useState(false)

  // Modals & Create Return Flow
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [selectedReturn, setSelectedReturn] = useState(null)
  const [deleteConfirm, setDeleteConfirm] = useState(null)

  // Fetch Return Invoices
  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      const res = await adminReturnInvoiceAPI.getAll({
        search: searchQuery,
        searchBy: searchBy,
        outlet: selectedOutlet,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
      })
      const list = res?.data || res || []
      setReturnInvoices(Array.isArray(list) ? list : [])
      setLoading(false)
    } catch (err) {
      console.error('Failed to load return invoices:', err)
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
      localStorage.setItem('bg_return_invoice_columns', JSON.stringify(Array.from(colDraft)))
    } catch {}
    setShowColModal(false)
    addNotification?.({
      type: 'success',
      title: 'Columns Updated',
      message: 'Your table columns have been updated.',
    })
  }

  // Export to Excel
  const handleExportExcel = () => {
    if (returnInvoices.length === 0) {
      addNotification?.({
        type: 'warning',
        title: 'Export Warning',
        message: 'No return invoices available to export.',
      })
      return
    }

    const exportRows = returnInvoices.map((ret, idx) => {
      const row = { '#': idx + 1 }
      ALL_COLUMNS.forEach((col) => {
        if (visibleCols.has(col.key)) {
          const header = lang === 'en' ? col.label.en : col.label.kh
          let val = ret[col.key] || ''
          if (col.key === 'grandTotal' || col.key === 'balance' || col.key === 'markup') {
            val = Number(val || 0).toFixed(2)
          }
          row[header] = val
        }
      })
      return row
    })

    const worksheet = XLSX.utils.json_to_sheet(exportRows)
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Return Invoices')
    const fileName = `Return_Invoices_${new Date().toISOString().slice(0, 10)}.xlsx`
    XLSX.writeFile(workbook, fileName)

    addNotification?.({
      type: 'success',
      title: 'Export Completed',
      message: `Exported ${exportRows.length} return invoices to ${fileName}.`,
    })
  }

  // Delete Return Invoice
  const handleDelete = async (id) => {
    try {
      await adminReturnInvoiceAPI.delete(id)
      setDeleteConfirm(null)
      loadData()
      addNotification?.({
        type: 'success',
        title: 'Return Deleted',
        message: 'Return invoice deleted successfully.',
      })
    } catch (err) {
      console.error('Delete failed:', err)
      addNotification?.({
        type: 'error',
        title: 'Delete Failed',
        message: err.message || 'Could not delete return invoice.',
      })
    }
  }

  // KPI Calculations
  const stats = useMemo(() => {
    const totalCount = returnInvoices.length
    const totalRefundAmount = returnInvoices.reduce((sum, r) => sum + Number(r.grandTotal || 0), 0)
    const totalBalance = returnInvoices.reduce((sum, r) => sum + Number(r.balance || 0), 0)
    return { totalCount, totalRefundAmount, totalBalance }
  }, [returnInvoices])

  // Pagination Slice
  const totalPages = Math.ceil(returnInvoices.length / pageSize) || 1
  const paginatedReturns = useMemo(() => {
    const start = (page - 1) * pageSize
    return returnInvoices.slice(start, start + pageSize)
  }, [returnInvoices, page])

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
          <img src={undoIcon} alt="Return Invoice" className="w-10 h-10 object-contain drop-shadow-md" />
          <div>
            <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white flex items-center gap-2">
              <span>{lang === 'en' ? 'Return Invoices' : 'វិក័យប័ត្រត្រឡប់ទំនិញ'}</span>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/20 font-bold">
                {returnInvoices.length} {lang === 'en' ? 'Returns' : 'ត្រឡប់'}
              </span>
            </h1>
            <p className="text-xs text-slate-400 mt-0.5">
              {lang === 'en'
                ? 'Manage customer product returns, refund credits, and apply returns to invoices'
                : 'គ្រប់គ្រងការត្រឡប់ទំនិញរបស់អតិថិជន និងការសងប្រាក់ត្រឡប់'}
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
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">{lang === 'en' ? 'Total Returns' : 'ចំនួនត្រឡប់សរុប'}</p>
            <h3 className="text-2xl font-black text-rose-400 mt-1">{stats.totalCount}</h3>
          </div>
          <div className="h-11 w-11 rounded-xl bg-rose-500/15 flex items-center justify-center text-rose-400">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 15v-1a4 4 0 00-4-4H4m0 0l3-3m-3 3l3 3m5 4v1a4 4 0 004 4h8m0 0l-3-3m3 3l-3 3" />
            </svg>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-800/80 bg-slate-900/60 p-4 flex items-center justify-between shadow-lg">
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">{lang === 'en' ? 'Total Refund Value' : 'ទឹកប្រាក់សងសរុប'}</p>
            <h3 className="text-2xl font-black text-white mt-1">{formatCurrency(stats.totalRefundAmount)}</h3>
          </div>
          <div className="h-11 w-11 rounded-xl bg-purple-500/15 flex items-center justify-center text-purple-400">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-800/80 bg-slate-900/60 p-4 flex items-center justify-between shadow-lg">
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">{lang === 'en' ? 'Unsettled Balance' : 'សមតុល្យមិនទាន់ទូទាត់'}</p>
            <h3 className="text-2xl font-black text-amber-400 mt-1">{formatCurrency(stats.totalBalance)}</h3>
          </div>
          <div className="h-11 w-11 rounded-xl bg-amber-500/15 flex items-center justify-center text-amber-400">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 14l6-6m0 0l-6-6m6 6H3" />
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
              placeholder={lang === 'en' ? 'Search return invoices...' : 'ស្វែងរកវិក័យប័ត្រត្រឡប់...'}
              className="w-full rounded-xl border border-slate-700 bg-slate-950 pl-10 pr-4 py-2.5 text-xs sm:text-sm text-white placeholder-slate-500 focus:border-rose-400 focus:outline-none"
            />
            <svg className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>

          {/* Search By Dropdown: Any - Invoice Code - Apply to invoice - Customer - Phone */}
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
              className="rounded-xl border border-slate-700 bg-slate-950 px-3 py-2.5 text-xs font-bold text-slate-200 focus:border-rose-400 focus:outline-none cursor-pointer"
            >
              <option value="any">{lang === 'en' ? 'Any' : 'ទាំងអស់'}</option>
              <option value="invoiceCode">{lang === 'en' ? 'Invoice Code' : 'លេខកូដវិក័យប័ត្រ'}</option>
              <option value="applyToInvoice">{lang === 'en' ? 'Apply to Invoice' : 'វិក័យប័ត្រយោង'}</option>
              <option value="customer">{lang === 'en' ? 'Customer' : 'អតិថិជន'}</option>
              <option value="phone">{lang === 'en' ? 'Phone' : 'ទូរស័ព្ទ'}</option>
            </select>
          </div>

          {/* Advance Filter Toggle Button */}
          <button
            onClick={() => setShowAdvanceFilter(!showAdvanceFilter)}
            className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border text-xs font-bold transition ${
              showAdvanceFilter || startDate || endDate || selectedOutlet !== 'all'
                ? 'border-rose-500 bg-rose-500/10 text-rose-300'
                : 'border-slate-700 bg-slate-950 text-slate-300 hover:text-white hover:bg-slate-800'
            }`}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
            </svg>
            {lang === 'en' ? 'Advance Filter' : 'តម្រងកម្រិតខ្ពស់'}
            {(startDate || endDate || selectedOutlet !== 'all') && (
              <span className="h-2 w-2 rounded-full bg-rose-400"></span>
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
                className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-xs font-semibold text-white focus:border-rose-400 focus:outline-none"
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
                className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-xs font-semibold text-white focus:border-rose-400 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-400 uppercase mb-1">
                {lang === 'en' ? 'Outlet' : 'សាខា'}
              </label>
              <select
                value={selectedOutlet}
                onChange={(e) => setSelectedOutlet(e.target.value)}
                className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-xs font-semibold text-white focus:border-rose-400 focus:outline-none cursor-pointer"
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

      {/* Return Invoice Table */}
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
                      <div className="h-7 w-7 animate-spin rounded-full border-2 border-rose-400 border-t-transparent" />
                      <span>{lang === 'en' ? 'Loading return invoices...' : 'កំពុងផ្ទុកវិក័យប័ត្រត្រឡប់...'}</span>
                    </div>
                  </td>
                </tr>
              ) : paginatedReturns.length === 0 ? (
                <tr>
                  <td colSpan={visibleCols.size + 2} className="py-12 text-center text-slate-400">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <span className="text-3xl">📦</span>
                      <span className="font-bold text-slate-300">
                        {lang === 'en' ? 'No return invoices found' : 'មិនមានវិក័យប័ត្រត្រឡប់ទំនិញទេ'}
                      </span>
                      <span className="text-xs text-slate-500">
                        {lang === 'en' ? 'Create a return invoice using the button above.' : 'បង្កើតវិក័យប័ត្រត្រឡប់ដោយចុចប៊ូតុងខាងលើ។'}
                      </span>
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedReturns.map((ret, idx) => (
                  <tr key={ret.id || idx} className="hover:bg-slate-800/40 transition">
                    <td className="py-3 px-4 text-center font-bold text-slate-500">
                      {(page - 1) * pageSize + idx + 1}
                    </td>

                    {visibleCols.has('invoiceCode') && (
                      <td className="py-3 px-4">
                        <button
                          onClick={() => setSelectedReturn(ret)}
                          className="font-black text-rose-400 hover:text-rose-300 hover:underline"
                        >
                          {ret.invoiceCode}
                        </button>
                      </td>
                    )}

                    {visibleCols.has('applyToInvoice') && (
                      <td className="py-3 px-4 text-amber-400 font-bold">
                        {ret.applyToInvoice || '—'}
                      </td>
                    )}

                    {visibleCols.has('returnDate') && (
                      <td className="py-3 px-4 text-slate-300 font-semibold">
                        {ret.returnDate || '—'}
                      </td>
                    )}

                    {visibleCols.has('customerName') && (
                      <td className="py-3 px-4">
                        <p className="font-bold text-white">{ret.customerName || 'Walk-in Customer'}</p>
                        {ret.customerPhone && <p className="text-[10px] text-slate-400">{ret.customerPhone}</p>}
                      </td>
                    )}

                    {visibleCols.has('customerPhone') && (
                      <td className="py-3 px-4 text-slate-300">
                        {ret.customerPhone || '—'}
                      </td>
                    )}

                    {visibleCols.has('grandTotal') && (
                      <td className="py-3 px-4 font-black text-rose-400">
                        {formatCurrency(ret.grandTotal)}
                      </td>
                    )}

                    {visibleCols.has('balance') && (
                      <td className="py-3 px-4 font-bold text-slate-300">
                        {formatCurrency(ret.balance)}
                      </td>
                    )}

                    {visibleCols.has('taxCode') && (
                      <td className="py-3 px-4 text-slate-400">
                        {ret.taxCode || '—'}
                      </td>
                    )}

                    {visibleCols.has('customerAddress') && (
                      <td className="py-3 px-4 text-slate-400 max-w-xs truncate">
                        {ret.customerAddress || '—'}
                      </td>
                    )}

                    {visibleCols.has('paymentTerm') && (
                      <td className="py-3 px-4 text-slate-300">
                        {ret.paymentTerm || 'Cash Refund'}
                      </td>
                    )}

                    {visibleCols.has('salesperson') && (
                      <td className="py-3 px-4 text-slate-300">
                        {ret.salesperson || 'Staff'}
                      </td>
                    )}

                    {visibleCols.has('markup') && (
                      <td className="py-3 px-4 text-slate-400">
                        {formatCurrency(ret.markup)}
                      </td>
                    )}

                    {visibleCols.has('outlet') && (
                      <td className="py-3 px-4 text-slate-400 text-[11px]">
                        {ret.outlet || 'Main Branch'}
                      </td>
                    )}

                    {visibleCols.has('username') && (
                      <td className="py-3 px-4 text-slate-400">
                        {ret.username || 'admin'}
                      </td>
                    )}

                    {visibleCols.has('soCode') && (
                      <td className="py-3 px-4 text-slate-400">
                        {ret.soCode || '—'}
                      </td>
                    )}

                    {visibleCols.has('status') && (
                      <td className="py-3 px-4">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                          ret.status === 'REFUNDED'
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                            : 'bg-rose-500/10 text-rose-400 border border-rose-500/30'
                        }`}>
                          {ret.status || 'RETURNED'}
                        </span>
                      </td>
                    )}

                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => setSelectedReturn(ret)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
                          title="View Details"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                        </button>
                        <button
                          onClick={() => setDeleteConfirm(ret)}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-500/10"
                          title="Delete"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
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
                ? `Showing ${paginatedReturns.length} of ${returnInvoices.length} entries`
                : `បង្ហាញ ${paginatedReturns.length} ក្នុងចំណោម ${returnInvoices.length}`}
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-3 py-1 rounded-lg border border-slate-700 disabled:opacity-40"
              >
                {lang === 'en' ? 'Prev' : 'មុន'}
              </button>
              <span className="font-bold text-rose-400">
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
                {lang === 'en' ? 'Customize Return Columns' : 'កំណត់ជួរឈរតារាងត្រឡប់'}
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
                      ? 'border-rose-500/60 bg-rose-500/10 text-white'
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
                    className="accent-rose-500 rounded"
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
                className="px-5 py-2 rounded-xl bg-rose-600 text-white text-xs font-black uppercase tracking-wider"
              >
                Apply Columns
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CREATE RETURN INVOICE MODAL */}
      {showCreateModal && (
        <CreateReturnModal
          open={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          onSuccess={() => {
            setShowCreateModal(false)
            loadData()
          }}
        />
      )}

      {/* VIEW RETURN DETAILS MODAL */}
      {selectedReturn && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-2xl rounded-2xl border border-slate-700 bg-slate-900 p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-lg font-black text-rose-400">
                  {selectedReturn.invoiceCode}
                </h3>
                <p className="text-xs text-slate-400">
                  Apply to Invoice: <strong className="text-amber-400">{selectedReturn.applyToInvoice || 'N/A'}</strong>
                </p>
              </div>
              <button onClick={() => setSelectedReturn(null)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <div className="grid grid-cols-2 gap-4 text-xs">
              <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800 space-y-1">
                <p className="text-slate-500 font-bold uppercase">Customer Info</p>
                <p className="text-white font-bold">{selectedReturn.customerName || 'Walk-in'}</p>
                <p className="text-slate-400">{selectedReturn.customerPhone || 'No phone'}</p>
                <p className="text-slate-400">{selectedReturn.customerAddress || 'No address'}</p>
              </div>

              <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800 space-y-1">
                <p className="text-slate-500 font-bold uppercase">Return Meta</p>
                <p><span className="text-slate-400">Date:</span> {selectedReturn.returnDate}</p>
                <p><span className="text-slate-400">Outlet:</span> {selectedReturn.outlet || 'Main'}</p>
                <p><span className="text-slate-400">Salesperson:</span> {selectedReturn.salesperson || 'Staff'}</p>
                <p><span className="text-slate-400">Status:</span> <strong className="text-rose-400">{selectedReturn.status}</strong></p>
              </div>
            </div>

            {selectedReturn.reason && (
              <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl text-xs">
                <p className="font-bold text-rose-300">Return Reason:</p>
                <p className="text-rose-200 mt-0.5">{selectedReturn.reason}</p>
              </div>
            )}

            <div className="flex justify-between items-center p-4 bg-slate-950 rounded-xl border border-slate-800 text-sm">
              <span className="font-bold text-slate-300">Total Refund Amount:</span>
              <span className="text-xl font-black text-rose-400">{formatCurrency(selectedReturn.grandTotal)}</span>
            </div>

            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => setSelectedReturn(null)}
                className="px-5 py-2 rounded-xl bg-slate-800 text-xs font-bold text-white hover:bg-slate-700"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-2xl border border-red-500/50 bg-slate-900 p-6 shadow-2xl text-center space-y-4">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-red-500/20 text-red-400">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </div>
            <div>
              <h3 className="text-base font-black text-white">Delete Return #{deleteConfirm.invoiceCode}?</h3>
              <p className="mt-1 text-xs text-slate-400">
                Are you sure you want to delete this return invoice?
              </p>
            </div>
            <div className="flex items-center justify-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setDeleteConfirm(null)}
                className="px-4 py-2 rounded-xl border border-slate-700 text-xs font-bold text-slate-300"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleDelete(deleteConfirm.id)}
                className="px-5 py-2 rounded-xl bg-red-600 text-white text-xs font-black uppercase tracking-wider"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

/**
 * Modal to quickly create a new Return Invoice
 */
function CreateReturnModal({ open, onClose, onSuccess }) {
  const { lang } = useLanguage()
  const { addNotification } = useNotifications()

  const [code, setCode] = useState('')
  const [applyToInvoice, setApplyToInvoice] = useState('')
  const [returnDate, setReturnDate] = useState(new Date().toISOString().slice(0, 10))
  const [customerName, setCustomerName] = useState('')
  const [customerPhone, setCustomerPhone] = useState('')
  const [customerAddress, setCustomerAddress] = useState('')
  const [taxCode, setTaxCode] = useState('')
  const [paymentTerm, setPaymentTerm] = useState('Cash Refund')
  const [salesperson, setSalesperson] = useState('Staff')
  const [outlet, setOutlet] = useState(OUTLETS[0])
  const [reason, setReason] = useState('')
  const [grandTotal, setGrandTotal] = useState('')
  const [saving, setSaving] = useState(false)

  // Invoices autocomplete for "Apply to Invoice"
  const [invoiceList, setInvoiceList] = useState([])

  useEffect(() => {
    adminReturnInvoiceAPI.getNextCode()
      .then((res) => {
        if (res?.data?.nextCode || res?.nextCode) {
          setCode(res.data?.nextCode || res.nextCode)
        }
      })
      .catch(() => {})

    adminSaleInvoiceAPI.getAll()
      .then((res) => {
        const list = res?.data || res || []
        setInvoiceList(Array.isArray(list) ? list : [])
      })
      .catch(() => {})
  }, [])

  const handleSelectInvoice = (invCode) => {
    setApplyToInvoice(invCode)
    const match = invoiceList.find((i) => i.invoiceCode === invCode)
    if (match) {
      setCustomerName(match.customerName || '')
      setCustomerPhone(match.customerPhone || '')
      setCustomerAddress(match.customerAddress || '')
      setSalesperson(match.salesperson || 'Staff')
      setOutlet(match.outlet || OUTLETS[0])
      setGrandTotal(match.grandTotal ? String(match.grandTotal) : '')
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!customerName) {
      addNotification?.({ type: 'warning', title: 'Customer Required', message: 'Please provide a customer name.' })
      return
    }

    setSaving(true)
    try {
      await adminReturnInvoiceAPI.create({
        invoiceCode: code,
        applyToInvoice: applyToInvoice,
        returnDate: returnDate,
        customerName: customerName,
        customerPhone: customerPhone,
        customerAddress: customerAddress,
        taxCode: taxCode,
        paymentTerm: paymentTerm,
        salesperson: salesperson,
        outlet: outlet,
        status: 'RETURNED',
        reason: reason,
        grandTotal: Number(grandTotal) || 0,
        balance: 0,
        markup: 0,
        lines: [
          {
            description: `Returned products against ${applyToInvoice || 'order'}`,
            qty: 1,
            unitPrice: Number(grandTotal) || 0,
            discount: 0,
            uom: 'Set',
            totalPrice: Number(grandTotal) || 0,
          },
        ],
      })

      addNotification?.({
        type: 'success',
        title: 'Return Invoice Created',
        message: `Return invoice #${code} recorded.`,
      })
      onSuccess()
    } catch (err) {
      console.error('Failed to create return:', err)
      setSaving(false)
      addNotification?.({
        type: 'error',
        title: 'Creation Failed',
        message: err.message || 'Could not create return invoice.',
      })
    }
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="w-full max-w-2xl rounded-2xl border border-rose-500/50 bg-slate-900 p-6 shadow-2xl space-y-4 max-h-[92vh] overflow-y-auto">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-rose-500/20 text-rose-400 font-bold">
              ↩
            </span>
            <h3 className="text-base font-black text-white">
              {lang === 'en' ? 'Create Return Invoice' : 'បង្កើតវិក័យប័ត្រត្រឡប់'}
            </h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white">✕</button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-bold text-slate-400 uppercase mb-1">
                {lang === 'en' ? 'Return Invoice Code' : 'លេខកូដវិក័យប័ត្រ'}
              </label>
              <input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                required
                className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-rose-400 font-bold focus:border-rose-400 focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-400 uppercase mb-1">
                {lang === 'en' ? 'Apply to Invoice' : 'វិក័យប័ត្រយោង'}
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={applyToInvoice}
                  onChange={(e) => setApplyToInvoice(e.target.value)}
                  placeholder="e.g. INV-260902-0001"
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-white focus:border-rose-400 focus:outline-none"
                  list="sale-invoice-options"
                />
                <datalist id="sale-invoice-options">
                  {invoiceList.map((inv) => (
                    <option key={inv.id} value={inv.invoiceCode}>
                      {inv.invoiceCode} - {inv.customerName} (${inv.grandTotal})
                    </option>
                  ))}
                </datalist>
              </div>
            </div>

            <div>
              <label className="block font-bold text-slate-400 uppercase mb-1">
                {lang === 'en' ? 'Return Date' : 'កាលបរិច្ឆេទត្រឡប់'}
              </label>
              <input
                type="date"
                value={returnDate}
                onChange={(e) => setReturnDate(e.target.value)}
                className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-white focus:border-rose-400 focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-400 uppercase mb-1">
                {lang === 'en' ? 'Customer Name *' : 'ឈ្មោះអតិថិជន *'}
              </label>
              <input
                type="text"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                required
                className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-white focus:border-rose-400 focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-400 uppercase mb-1">
                {lang === 'en' ? 'Customer Phone' : 'ទូរស័ព្ទ'}
              </label>
              <input
                type="text"
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-white focus:border-rose-400 focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-400 uppercase mb-1">
                {lang === 'en' ? 'Refund Total ($) *' : 'ចំនួនទឹកប្រាក់សង ($) *'}
              </label>
              <input
                type="number"
                step="0.01"
                value={grandTotal}
                onChange={(e) => setGrandTotal(e.target.value)}
                placeholder="0.00"
                required
                className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-rose-400 font-bold focus:border-rose-400 focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-400 uppercase mb-1">
                {lang === 'en' ? 'Outlet' : 'សាខា'}
              </label>
              <select
                value={outlet}
                onChange={(e) => setOutlet(e.target.value)}
                className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-white focus:border-rose-400 focus:outline-none cursor-pointer"
              >
                {OUTLETS.map((o) => (
                  <option key={o} value={o}>{o}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-400 uppercase mb-1">
                {lang === 'en' ? 'Payment Term' : 'លក្ខខណ្ឌសងប្រាក់'}
              </label>
              <select
                value={paymentTerm}
                onChange={(e) => setPaymentTerm(e.target.value)}
                className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-white focus:border-rose-400 focus:outline-none cursor-pointer"
              >
                <option value="Cash Refund">Cash Refund</option>
                <option value="Store Credit">Store Credit</option>
                <option value="ABA Transfer">ABA Transfer</option>
                <option value="Deduct from Balance">Deduct from Balance</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block font-bold text-slate-400 uppercase mb-1">
              {lang === 'en' ? 'Return Reason & Remarks' : 'មូលហេតុត្រឡប់'}
            </label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows="2"
              placeholder="e.g. Expired product, damaged packaging, customer changed mind..."
              className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-white focus:border-rose-400 focus:outline-none resize-none"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-slate-700 text-xs font-bold text-slate-300 hover:bg-slate-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2 rounded-xl bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-500 hover:to-rose-600 text-white text-xs font-black uppercase tracking-wider shadow-lg shadow-rose-500/20 disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Save Return'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
export default ReturnInvoiceList
