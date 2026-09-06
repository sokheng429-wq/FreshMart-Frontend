import React, { useState, useEffect, useMemo, useCallback } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import * as XLSX from 'xlsx'
import { useLanguage } from '../../context/LanguageContext'
import { useNotifications } from '../../context/NotificationContext'
import { adminSaleInvoiceAPI } from '../../api/api'
import { SaleInvoicePrintModal, printInvoiceDocument } from './SaleInvoicePrintModal'
import { SaleInvoicePaymentModal } from './SaleInvoicePaymentModal'
import mailIcon from '../../assets/icon/3dicons-mail-dynamic-color.png'

const ALL_COLUMNS = [
  { key: 'invoiceCode', label: { en: 'Invoice Code', kh: 'លេខកូដវិក័យប័ត្រ' }, always: true },
  { key: 'invoiceDate', label: { en: 'Date', kh: 'កាលបរិច្ឆេទ' }, always: true },
  { key: 'customerName', label: { en: 'Customer', kh: 'អតិថិជន' }, always: true },
  { key: 'customerPhone', label: { en: 'Phone', kh: 'ទូរស័ព្ទ' } },
  { key: 'grandTotal', label: { en: 'Total ($)', kh: 'សរុប ($)' }, always: true },
  { key: 'balance', label: { en: 'Balance ($)', kh: 'សមតុល្យ ($)' } },
  { key: 'status', label: { en: 'Status', kh: 'ស្ថានភាព' }, always: true },
  { key: 'customerAddress', label: { en: 'Address', kh: 'អាសយដ្ឋាន' } },
  { key: 'paymentTerm', label: { en: 'Payment Term', kh: 'លក្ខខណ្ឌទូទាត់' } },
  { key: 'salesperson', label: { en: 'Salesperson', kh: 'អ្នកលក់' } },
  { key: 'markupAmount', label: { en: 'Markup Amount', kh: 'ប្រាក់បន្ថែម' } },
  { key: 'outlet', label: { en: 'Outlet', kh: 'សាខា' } },
  { key: 'username', label: { en: 'Username', kh: 'ឈ្មោះអ្នកប្រើ' } },
  { key: 'soCode', label: { en: 'SO Code', kh: 'កូដ SO' } },
  { key: 'taxAmount', label: { en: 'Tax ($)', kh: 'ពន្ធ ($)' } },
]

const DEFAULT_VISIBLE_COLUMNS = [
  'invoiceCode',
  'invoiceDate',
  'customerName',
  'customerPhone',
  'grandTotal',
  'balance',
  'status',
  'paymentTerm',
  'salesperson',
  'outlet',
]

export const SaleInvoiceList = () => {
  const { lang } = useLanguage()
  const { addNotification } = useNotifications()
  const navigate = useNavigate()

  const [invoices, setInvoices] = useState([])
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState(null)

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('')
  const [searchBy, setSearchBy] = useState('any') // invoiceCode, any, soCode, customer, phone
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [page, setPage] = useState(1)
  const pageSize = 12

  // Column Visibility Modal
  const [visibleCols, setVisibleCols] = useState(() => {
    try {
      const saved = localStorage.getItem('bg_sale_invoice_columns')
      if (saved) return new Set(JSON.parse(saved))
    } catch {}
    return new Set(DEFAULT_VISIBLE_COLUMNS)
  })
  const [colDraft, setColDraft] = useState(new Set(DEFAULT_VISIBLE_COLUMNS))
  const [showColModal, setShowColModal] = useState(false)

  const location = useLocation()

  // Modals & Action Targets
  const [selectedInvoice, setSelectedInvoice] = useState(null)
  const [showPrintModal, setShowPrintModal] = useState(false)
  const [showPayModal, setShowPayModal] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState(null)
  const [savingPayment, setSavingPayment] = useState(false)

  // Auto-open print preview when redirected from Make Pay / Create page
  useEffect(() => {
    if (location.state?.printInvoice) {
      setSelectedInvoice(location.state.printInvoice)
      setShowPrintModal(true)
      // Clear state in history so refreshing doesn't re-trigger
      window.history.replaceState({}, document.title)
    }
  }, [location.state])

  // Fetch Invoices
  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      const [res, statsRes] = await Promise.all([
        adminSaleInvoiceAPI.getAll({
          search: searchQuery,
          searchBy: searchBy,
          status: statusFilter,
        }),
        adminSaleInvoiceAPI.getStats().catch(() => null),
      ])

      const list = res?.data || res || []
      setInvoices(Array.isArray(list) ? list : [])
      if (statsRes?.data) setStats(statsRes.data)
      setLoading(false)
    } catch (err) {
      console.error('Failed to load invoices:', err)
      setLoading(false)
    }
  }, [searchQuery, searchBy, statusFilter])

  useEffect(() => {
    loadData()
  }, [loadData])

  // Save Column Draft
  const handleApplyColumns = () => {
    setVisibleCols(new Set(colDraft))
    try {
      localStorage.setItem('bg_sale_invoice_columns', JSON.stringify(Array.from(colDraft)))
    } catch {}
    setShowColModal(false)
    addNotification?.({
      type: 'info',
      title: 'Columns Updated',
      message: 'Table column view preferences saved.',
    })
  }

  // Reset to default columns
  const handleResetColumns = () => {
    setColDraft(new Set(DEFAULT_VISIBLE_COLUMNS))
  }

  // Export to Excel as requested
  const handleExportExcel = () => {
    if (invoices.length === 0) {
      addNotification?.({
        type: 'warning',
        title: 'Export Empty',
        message: 'No invoices to export.',
      })
      return
    }

    const activeColDefs = ALL_COLUMNS.filter((c) => visibleCols.has(c.key))
    const headerRow = activeColDefs.map((c) => (lang === 'en' ? c.label.en : c.label.kh))

    const dataRows = invoices.map((inv) => {
      return activeColDefs.map((c) => {
        const val = inv[c.key]
        if (c.key === 'grandTotal' || c.key === 'balance' || c.key === 'markupAmount' || c.key === 'taxAmount') {
          return Number(val || 0).toFixed(2)
        }
        return val !== null && val !== undefined ? String(val) : ''
      })
    })

    const ws = XLSX.utils.aoa_to_sheet([headerRow, ...dataRows])
    ws['!cols'] = headerRow.map((h) => ({ wch: Math.max(14, String(h).length + 4) }))
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Sale Invoices')
    const fileName = `Sale_Invoices_${new Date().toISOString().slice(0, 10)}.xlsx`
    XLSX.writeFile(wb, fileName)

    addNotification?.({
      type: 'success',
      title: 'Excel Exported',
      message: `Downloaded ${fileName} successfully.`,
    })
  }

  // Delete invoice
  const handleDeleteInvoice = async (id) => {
    try {
      await adminSaleInvoiceAPI.delete(id)
      setDeleteConfirm(null)
      loadData()
      addNotification?.({
        type: 'success',
        title: 'Invoice Deleted',
        message: 'Sale invoice has been removed.',
      })
    } catch (err) {
      addNotification?.({
        type: 'error',
        title: 'Delete Failed',
        message: err.message || 'Could not delete invoice.',
      })
    }
  }

  // Quick Pay on an existing invoice
  const handleRecordPayment = async (paymentData) => {
    if (!selectedInvoice) return
    setSavingPayment(true)
    try {
      await adminSaleInvoiceAPI.recordPayment(selectedInvoice.id, paymentData)
      setSavingPayment(false)
      setShowPayModal(false)
      loadData()
      addNotification?.({
        type: 'success',
        title: 'Payment Received',
        message: `Payment of $${paymentData.paidAmount} recorded for #${selectedInvoice.invoiceCode}.`,
      })
    } catch (err) {
      setSavingPayment(false)
      addNotification?.({
        type: 'error',
        title: 'Payment Failed',
        message: err.message || 'Failed to record payment.',
      })
    }
  }

  // Pagination
  const totalPages = Math.ceil(invoices.length / pageSize) || 1
  const paginatedInvoices = useMemo(() => {
    const start = (page - 1) * pageSize
    return invoices.slice(start, start + pageSize)
  }, [invoices, page, pageSize])

  const formatCurrency = (val) => `$ ${Number(val || 0).toFixed(2)}`

  const renderStatusBadge = (status) => {
    const s = (status || 'UNPAID').toUpperCase()
    switch (s) {
      case 'PAID':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
            Paid
          </span>
        )
      case 'PARTIAL':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-500/15 text-amber-400 border border-amber-500/30">
            <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
            Partial
          </span>
        )
      case 'CREDIT':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-purple-500/15 text-purple-400 border border-purple-500/30">
            <span className="h-1.5 w-1.5 rounded-full bg-purple-400" />
            Credit
          </span>
        )
      case 'VOID':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-slate-700/50 text-slate-400 border border-slate-600">
            Void
          </span>
        )
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-red-500/15 text-red-400 border border-red-500/30">
            <span className="h-1.5 w-1.5 rounded-full bg-red-400" />
            Unpaid
          </span>
        )
    }
  }

  return (
    <div className="space-y-6 text-slate-100" style={{ fontFamily: 'Montserrat, sans-serif' }}>
      {/* HEADER WITH KPIS */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-400">
            <Link to="/admin/sale-dashboard" className="text-green-400 hover:text-green-300">
              {lang === 'en' ? 'Sale Dashboard' : 'ផ្ទាំងលក់'}
            </Link>
            <span>/</span>
            <span className="text-[#FF9900]">{lang === 'en' ? 'Sale Invoices' : 'វិក័យប័ត្រលក់'}</span>
          </div>

          <div className="flex items-center gap-3 mt-2">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-orange-500/20 text-[#FF9900] shadow-lg shadow-orange-500/10">
              <img src={mailIcon} alt="" className="h-7 w-7" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
                {lang === 'en' ? 'Sale Invoices' : 'វិក័យប័ត្រលក់'}
              </h1>
              <p className="text-xs text-slate-400">
                {lang === 'en' ? 'Track, search, export and manage customer sale invoices and payment settlements' : 'គ្រប់គ្រង ស្វែងរក ទាញយកទិន្នន័យ និងទូទាត់វិក័យប័ត្រលក់'}
              </p>
            </div>
          </div>
        </div>

        {/* Action Buttons: Choose Column, Export Excel, + Create */}
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => {
              setColDraft(new Set(visibleCols))
              setShowColModal(true)
            }}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-700/80 bg-slate-900/80 text-xs font-bold text-slate-300 hover:bg-slate-800 hover:text-white transition shadow-sm"
          >
            <svg className="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" />
            </svg>
            <span>{lang === 'en' ? 'Choose Column' : 'ជ្រើសរើសជួរឈរ'}</span>
          </button>

          <button
            type="button"
            onClick={handleExportExcel}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-emerald-500/40 bg-emerald-500/10 text-xs font-bold text-emerald-400 hover:bg-emerald-500/20 transition shadow-sm"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            <span>{lang === 'en' ? 'Export Excel' : 'ទាញយក Excel'}</span>
          </button>

          <button
            type="button"
            onClick={() => navigate('/admin/sale-dashboard/sale-invoice/create')}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-[#FF9900] to-[#e68a00] hover:from-[#ffaa26] hover:to-[#cc7a00] text-slate-950 text-xs font-black uppercase tracking-wider rounded-xl shadow-lg shadow-orange-500/20 transition transform hover:-translate-y-0.5 active:scale-95"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4" />
            </svg>
            <span>{lang === 'en' ? 'Create Invoice' : 'បង្កើតវិក័យប័ត្រថ្មី'}</span>
          </button>
        </div>
      </div>

      {/* KPI STATS CARDS */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-4 shadow-md backdrop-blur-sm">
          <p className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">Total Invoices</p>
          <p className="mt-1 text-2xl font-black text-white">{stats?.totalInvoices ?? invoices.length}</p>
          <span className="text-[10px] text-slate-500">All registered records</span>
        </div>

        <div className="rounded-2xl border border-emerald-500/30 bg-emerald-950/20 p-4 shadow-md backdrop-blur-sm">
          <p className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-400">Paid Invoices</p>
          <p className="mt-1 text-2xl font-black text-emerald-400">{stats?.paidInvoices ?? invoices.filter((i) => i.status === 'PAID').length}</p>
          <span className="text-[10px] text-emerald-500">Fully settled</span>
        </div>

        <div className="rounded-2xl border border-red-500/30 bg-red-950/20 p-4 shadow-md backdrop-blur-sm">
          <p className="text-[10px] font-extrabold uppercase tracking-wider text-red-400">Unpaid / Credit</p>
          <p className="mt-1 text-2xl font-black text-red-400">{stats?.unpaidInvoices ?? invoices.filter((i) => i.status === 'UNPAID' || i.status === 'CREDIT').length}</p>
          <span className="text-[10px] text-red-400 font-bold">Bal: {formatCurrency(stats?.totalBalance ?? 0)}</span>
        </div>

        <div className="rounded-2xl border border-orange-500/30 bg-orange-950/20 p-4 shadow-md backdrop-blur-sm">
          <p className="text-[10px] font-extrabold uppercase tracking-wider text-orange-400">Total Revenue</p>
          <p className="mt-1 text-xl sm:text-2xl font-black text-white">{formatCurrency(stats?.totalAmount ?? invoices.reduce((acc, i) => acc + Number(i.grandTotal || 0), 0))}</p>
          <span className="text-[10px] text-orange-400 font-bold">Today: {formatCurrency(stats?.todaySales ?? 0)}</span>
        </div>
      </div>

      {/* FILTER & SEARCH BAR */}
      <div className="rounded-2xl border border-slate-700/80 bg-slate-900/90 p-4 shadow-xl backdrop-blur-sm flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-3 flex-1">
          {/* Search Input */}
          <div className="relative flex-1 min-w-[200px]">
            <input
              type="text"
              placeholder={lang === 'en' ? 'Search invoices by query...' : 'ស្វែងរកវិក័យប័ត្រ...'}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-xl border border-slate-700 bg-slate-950 py-2 pl-10 pr-4 text-xs font-semibold text-white placeholder-slate-500 focus:border-green-400 focus:outline-none"
            />
            <svg className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>

          {/* Search By Dropdown as requested: Invoice Code - ANy - SO code - Customer - phone */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400 font-bold whitespace-nowrap">Search By:</span>
            <select
              value={searchBy}
              onChange={(e) => setSearchBy(e.target.value)}
              className="rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-xs font-bold text-orange-400 focus:border-orange-400 focus:outline-none"
            >
              <option value="any">Any (All Fields)</option>
              <option value="invoiceCode">Invoice Code</option>
              <option value="soCode">SO Code</option>
              <option value="customer">Customer</option>
              <option value="phone">Phone</option>
            </select>
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400 font-bold whitespace-nowrap">Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-xs font-bold text-slate-200 focus:border-green-400 focus:outline-none"
            >
              <option value="ALL">All Status</option>
              <option value="PAID">Paid</option>
              <option value="PARTIAL">Partial</option>
              <option value="UNPAID">Unpaid</option>
              <option value="CREDIT">Credit</option>
              <option value="VOID">Void</option>
            </select>
          </div>
        </div>

        <button
          type="button"
          onClick={loadData}
          className="p-2.5 rounded-xl border border-slate-700 text-slate-400 hover:text-white hover:bg-slate-800 transition"
          title="Refresh Data"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
        </button>
      </div>

      {/* DATA TABLE */}
      <div className="rounded-2xl border border-slate-700/80 bg-slate-900/90 shadow-2xl overflow-hidden backdrop-blur-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-950/80 text-slate-400 uppercase text-[10px] tracking-wider">
                <th className="py-3.5 px-3 w-10 text-center">№</th>
                {ALL_COLUMNS.filter((c) => visibleCols.has(c.key)).map((c) => (
                  <th
                    key={c.key}
                    className={`py-3.5 px-3 font-bold ${
                      c.key === 'grandTotal' || c.key === 'balance' || c.key === 'markupAmount' || c.key === 'taxAmount'
                        ? 'text-right'
                        : c.key === 'status'
                        ? 'text-center'
                        : 'text-left'
                    }`}
                  >
                    {lang === 'en' ? c.label.en : c.label.kh}
                  </th>
                ))}
                <th className="py-3.5 px-3 text-center w-28">{lang === 'en' ? 'Actions' : 'សកម្មភាព'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80">
              {loading ? (
                <tr>
                  <td colSpan={visibleCols.size + 2} className="py-12 text-center text-slate-400">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <div className="h-6 w-6 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
                      <span>Loading sale invoices...</span>
                    </div>
                  </td>
                </tr>
              ) : paginatedInvoices.length > 0 ? (
                paginatedInvoices.map((inv, idx) => (
                  <tr key={inv.id || idx} className="hover:bg-slate-800/50 transition">
                    <td className="py-3 px-3 text-center text-slate-500 font-bold">
                      {(page - 1) * pageSize + idx + 1}
                    </td>

                    {ALL_COLUMNS.filter((c) => visibleCols.has(c.key)).map((c) => {
                      const val = inv[c.key]

                      if (c.key === 'invoiceCode') {
                        return (
                          <td key={c.key} className="py-3 px-3 font-black text-orange-400 whitespace-nowrap">
                            #{val}
                          </td>
                        )
                      }
                      if (c.key === 'status') {
                        return (
                          <td key={c.key} className="py-3 px-3 text-center whitespace-nowrap">
                            {renderStatusBadge(val)}
                          </td>
                        )
                      }
                      if (c.key === 'grandTotal' || c.key === 'balance' || c.key === 'markupAmount' || c.key === 'taxAmount') {
                        return (
                          <td key={c.key} className="py-3 px-3 text-right font-black text-white whitespace-nowrap">
                            {formatCurrency(val)}
                          </td>
                        )
                      }
                      return (
                        <td key={c.key} className="py-3 px-3 text-slate-300 font-medium whitespace-nowrap">
                          {val || '—'}
                        </td>
                      )
                    })}

                    {/* Actions */}
                    <td className="py-3 px-3 text-center whitespace-nowrap">
                      <div className="flex items-center justify-center gap-1.5">
                        {/* Print / Preview */}
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedInvoice(inv)
                            setShowPrintModal(true)
                          }}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
                          title="Print / View Invoice"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                          </svg>
                        </button>

                        {/* Make Pay if unpaid/partial */}
                        {inv.status !== 'PAID' && (
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedInvoice(inv)
                              setShowPayModal(true)
                            }}
                            className="p-1.5 rounded-lg text-green-400 hover:text-green-300 hover:bg-green-500/20 transition"
                            title="Make Payment"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                            </svg>
                          </button>
                        )}

                        {/* Delete */}
                        <button
                          type="button"
                          onClick={() => setDeleteConfirm(inv)}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition"
                          title="Delete Invoice"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={visibleCols.size + 2} className="py-16 text-center text-slate-500">
                    <div className="flex flex-col items-center justify-center gap-3">
                      <div className="h-12 w-12 rounded-2xl bg-slate-800/80 flex items-center justify-center text-slate-600">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                      </div>
                      <p className="text-sm font-bold text-slate-400">No sale invoices found</p>
                      <button
                        onClick={() => navigate('/admin/sale-dashboard/sale-invoice/create')}
                        className="px-4 py-2 bg-green-500/20 text-green-400 rounded-xl text-xs font-bold hover:bg-green-500/30 transition"
                      >
                        + Create First Sale Invoice
                      </button>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* PAGINATION FOOTER */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between px-6 py-4 border-t border-slate-800 bg-slate-950/60 text-xs text-slate-400">
          <div>
            Showing <strong className="text-white">{invoices.length > 0 ? (page - 1) * pageSize + 1 : 0}</strong> to{' '}
            <strong className="text-white">{Math.min(page * pageSize, invoices.length)}</strong> of{' '}
            <strong className="text-white">{invoices.length}</strong> invoices
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="px-3 py-1.5 rounded-lg border border-slate-700 bg-slate-900 text-slate-300 disabled:opacity-40 hover:bg-slate-800 transition"
            >
              Previous
            </button>
            <span className="px-3 py-1 text-slate-400 font-bold">
              {page} / {totalPages}
            </span>
            <button
              type="button"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              className="px-3 py-1.5 rounded-lg border border-slate-700 bg-slate-900 text-slate-300 disabled:opacity-40 hover:bg-slate-800 transition"
            >
              Next
            </button>
          </div>
        </div>
      </div>

      {/* CHOOSE COLUMN MODAL */}
      {showColModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-2xl border border-slate-700 bg-slate-900 p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-base font-black text-white">
                {lang === 'en' ? 'Customize Table Columns' : 'កំណត់ជួរឈរតារាង'}
              </h3>
              <button
                onClick={() => setShowColModal(false)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <p className="text-xs text-slate-400">
              {lang === 'en' ? 'Select which columns you would like to display on the invoice table.' : 'ជ្រើសរើសជួរឈរដែលអ្នកចង់បង្ហាញនៅលើតារាងវិក័យប័ត្រ។'}
            </p>

            <div className="grid grid-cols-2 gap-2.5 max-h-72 overflow-y-auto p-1">
              {ALL_COLUMNS.map((col) => {
                const checked = colDraft.has(col.key)
                return (
                  <label
                    key={col.key}
                    className={`flex items-center gap-2.5 p-2.5 rounded-xl border transition cursor-pointer text-xs font-semibold ${
                      checked
                        ? 'border-green-500/40 bg-green-500/10 text-white'
                        : 'border-slate-800 bg-slate-950/60 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={(e) => {
                        const next = new Set(colDraft)
                        if (e.target.checked) next.add(col.key)
                        else next.delete(col.key)
                        setColDraft(next)
                      }}
                      className="rounded border-slate-700 text-green-500 focus:ring-green-500/20"
                    />
                    <span>{lang === 'en' ? col.label.en : col.label.kh}</span>
                  </label>
                )
              })}
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={handleResetColumns}
                className="text-xs text-slate-400 hover:text-white font-semibold underline"
              >
                Reset Default
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowColModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-700 text-xs font-bold text-slate-300 hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleApplyColumns}
                  className="px-5 py-2 rounded-xl bg-[#77BC1F] text-slate-950 text-xs font-black uppercase tracking-wider shadow-lg hover:bg-green-400"
                >
                  Apply Columns
                </button>
              </div>
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
              <h3 className="text-base font-black text-white">Delete Invoice #{deleteConfirm.invoiceCode}?</h3>
              <p className="mt-1 text-xs text-slate-400">
                Are you sure you want to permanently delete this sale invoice? This action cannot be undone.
              </p>
            </div>
            <div className="flex items-center justify-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setDeleteConfirm(null)}
                className="px-4 py-2 rounded-xl border border-slate-700 text-xs font-bold text-slate-300 hover:bg-slate-800"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleDeleteInvoice(deleteConfirm.id)}
                className="px-5 py-2 rounded-xl bg-red-500 text-white text-xs font-black uppercase tracking-wider hover:bg-red-400 shadow-lg shadow-red-500/20"
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
