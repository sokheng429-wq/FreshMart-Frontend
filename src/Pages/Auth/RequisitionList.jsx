import React, { useState, useEffect, useMemo, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import * as XLSX from 'xlsx'
import { useLanguage } from '../../context/LanguageContext'
import { useNotifications } from '../../context/NotificationContext'
import { adminProductAPI, adminRequisitionAPI } from '../../api/api'
import { exportStyledExcel } from '../../utils/excelExport'
import fileNewIcon from '../../assets/icon/3dicons-file-new-dynamic-color.png'
import './ProductsHub.css'

// Icons
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

function PlusIcon({ className = 'w-4 h-4' }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
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

function UploadIcon({ className = 'w-4 h-4' }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
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

// Columns definition for Choose Column
const ALL_COLUMNS = [
  { key: 'code', label: { en: 'Code', kh: 'កូដ' }, always: true },
  { key: 'date', label: { en: 'Date', kh: 'កាលបរិច្ឆេទ' }, always: true },
  { key: 'requireDate', label: { en: 'Require Date', kh: 'កាលបរិច្ឆេទត្រូវការ' }, always: true },
  { key: 'requisitionType', label: { en: 'Requisition Type', kh: 'ប្រភេទស្នើសុំ' }, always: true },
  { key: 'requisitionAmount', label: { en: 'Requisition Amount', kh: 'ទឹកប្រាក់ស្នើសុំ' }, always: true },
  { key: 'reference', label: { en: 'Reference', kh: 'យោង' } },
  { key: 'referenceCode', label: { en: 'Reference Code', kh: 'កូដយោង' } },
  { key: 'userName', label: { en: 'User Name', kh: 'ឈ្មោះអ្នកប្រើ' } },
  { key: 'status', label: { en: 'Status', kh: 'ស្ថានភាព' }, always: true },
  { key: 'actions', label: { en: 'Actions', kh: 'សកម្មភាព' }, always: true },
]

const DEFAULT_VISIBLE = [
  'code',
  'date',
  'requireDate',
  'requisitionType',
  'requisitionAmount',
  'reference',
  'referenceCode',
  'userName',
  'status',
  'actions',
]

const UOM_OPTIONS = ['Can', 'Bottle', 'Pcs', 'Box', 'Bag', 'Kg', 'Pack', 'Carton']
const TEMPLATE_OPTIONS = [
  'Standard Template',
  'Weekly Replenishment',
  'Urgent Restock',
  'Branch Transfer',
  'Special Promo',
]
const TYPE_OPTIONS = [
  'Store Replenishment',
  'Low Stock Alert',
  'Asset Procurement',
  'Branch Request',
  'Emergency Restock',
]

export default function RequisitionList() {
  const { lang } = useLanguage()
  const { addNotification } = useNotifications()
  const navigate = useNavigate()
  const importFileInputRef = useRef(null)

  // Requisitions State
  const [requisitions, setRequisitions] = useState([])
  const [loading, setLoading] = useState(true)

  // Live Catalog for quick product search
  const [catalogProducts, setCatalogProducts] = useState([])

  // Search & Filter State
  const [searchText, setSearchText] = useState('')
  const [searchBy, setSearchBy] = useState('Any') // Any, Code, Reference, Reference Code, User Name
  const [appliedSearch, setAppliedSearch] = useState({ text: '', by: 'Any' })

  // Advance Filter State
  const [advanceFilterOpen, setAdvanceFilterOpen] = useState(false)
  const [fromDate, setFromDate] = useState('')
  const [toDate, setToDate] = useState('')
  const [statusFilter, setStatusFilter] = useState('ALL') // ALL, open, partial, Completed, Voided

  // Table Column Visibility
  const [chooseColumnOpen, setChooseColumnOpen] = useState(false)
  const [visibleColumns, setVisibleColumns] = useState(DEFAULT_VISIBLE)

  // Modals
  const [createModalOpen, setCreateModalOpen] = useState(false)
  const [detailModalOpen, setDetailModalOpen] = useState(false)
  const [selectedReq, setSelectedReq] = useState(null)
  const [submitting, setSubmitting] = useState(false)

  // Form State for Create Modal
  const [formCode, setFormCode] = useState('')
  const [formDate, setFormDate] = useState(() => new Date().toISOString().slice(0, 10))
  const [formRequireDate, setFormRequireDate] = useState(() => {
    const d = new Date(Date.now() + 7 * 86400000)
    return d.toISOString().slice(0, 10)
  })
  const [formTemplateName, setFormTemplateName] = useState('Standard Template')
  const [formType, setFormType] = useState('Store Replenishment')
  const [formReference, setFormReference] = useState('')
  const [formReferenceCode, setFormReferenceCode] = useState('')
  const [formNote, setFormNote] = useState('')

  // Product Line Items in Create Modal
  const [productSearchInput, setProductSearchInput] = useState('')
  const [lineItems, setLineItems] = useState([])

  // Load Requisitions from Backend API
  const fetchRequisitions = async () => {
    setLoading(true)
    try {
      const res = await adminRequisitionAPI.getAll({
        search: appliedSearch.text,
        searchBy: appliedSearch.by,
        fromDate: fromDate || undefined,
        toDate: toDate || undefined,
        status: statusFilter !== 'ALL' ? statusFilter : undefined,
      })
      if (res && res.data) {
        setRequisitions(Array.isArray(res.data) ? res.data : [])
      }
    } catch {
      // Fallback
    } finally {
      setLoading(false)
    }
  }

  // Load live products from backend for fast autocomplete
  const fetchCatalog = async () => {
    try {
      const res = await adminProductAPI.getAll()
      const list = res?.data || res || []
      if (Array.isArray(list) && list.length > 0) {
        setCatalogProducts(list)
      } else {
        // Fallback baseline products
        setCatalogProducts([
          {
            id: 101,
            code: 'BEV-CC-001',
            barCode: '8850123000124',
            name: 'Coca Cola 330ml Can',
            uom: 'Can',
            averageCost: 0.45,
            onHand: 4,
          },
          {
            id: 102,
            code: 'SNK-PO-002',
            barCode: '8850123000230',
            name: 'Lays Potato Chips Classic',
            uom: 'Pcs',
            averageCost: 1.10,
            onHand: 0,
          },
          {
            id: 103,
            code: 'DRY-RC-003',
            barCode: '8850123000347',
            name: 'Jasmine Fragrant Rice 5kg',
            uom: 'Bag',
            averageCost: 4.50,
            onHand: 3,
          },
          {
            id: 104,
            code: 'DAI-MK-004',
            barCode: '8850123000453',
            name: 'Fresh Whole Milk 1L',
            uom: 'Bottle',
            averageCost: 1.80,
            onHand: 6,
          },
        ])
      }
    } catch {
      // Keep empty
    }
  }

  useEffect(() => {
    fetchRequisitions()
    fetchCatalog()
  }, [appliedSearch, fromDate, toDate, statusFilter])

  // Open Create Modal & generate next code
  const handleOpenCreateModal = async () => {
    try {
      const res = await adminRequisitionAPI.getNextCode()
      if (res?.data?.code) {
        setFormCode(res.data.code)
      } else {
        const ymd = new Date().toISOString().slice(0, 10).replace(/-/g, '')
        setFormCode(`REQ-${ymd}-${Math.floor(1000 + Math.random() * 9000)}`)
      }
    } catch {
      const ymd = new Date().toISOString().slice(0, 10).replace(/-/g, '')
      setFormCode(`REQ-${ymd}-${Math.floor(1000 + Math.random() * 9000)}`)
    }

    setFormDate(new Date().toISOString().slice(0, 10))
    setFormRequireDate(new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10))
    setFormTemplateName('Standard Template')
    setFormType('Store Replenishment')
    setFormReference('')
    setFormReferenceCode('')
    setFormNote('')
    setProductSearchInput('')
    setLineItems([])
    setCreateModalOpen(true)
  }

  // Handle Search click
  const handleSearchClick = () => {
    setAppliedSearch({
      text: searchText.trim(),
      by: searchBy,
    })
  }

  // Clear advance filters
  const handleResetFilters = () => {
    setSearchText('')
    setSearchBy('Any')
    setAppliedSearch({ text: '', by: 'Any' })
    setFromDate('')
    setToDate('')
    setStatusFilter('ALL')
  }

  // Toggle Column
  const toggleColumn = (key) => {
    const def = ALL_COLUMNS.find((c) => c.key === key)
    if (def?.always) return
    setVisibleColumns((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    )
  }

  // Export Requisitions to Excel
  const handleExportRequisitions = () => {
    if (requisitions.length === 0) {
      addNotification?.('No requisitions to export', 'warning')
      return
    }
    const headers = [
      'Code',
      'Date',
      'Require Date',
      'Requisition Type',
      'Requisition Amount ($)',
      'Reference',
      'Reference Code',
      'User Name',
      'Status',
    ]
    const data = requisitions.map((r) => [
      r.code,
      r.date || '',
      r.requireDate || '',
      r.requisitionType || '',
      Number(r.requisitionAmount || 0).toFixed(2),
      r.reference || '',
      r.referenceCode || '',
      r.userName || '',
      r.status || 'OPEN',
    ])
    exportStyledExcel(
      headers,
      data,
      `requisitions_${new Date().toISOString().slice(0, 10)}.xlsx`,
      'Requisitions'
    )
    addNotification?.('Requisitions exported to Excel', 'success')
  }

  // ===== PRODUCT ALL-IN-ONE SEARCH & ADD IN CREATE MODAL =====
  const matchedCatalogProducts = useMemo(() => {
    if (!productSearchInput.trim()) return []
    const q = productSearchInput.trim().toLowerCase()
    return catalogProducts
      .filter((p) => {
        const code = String(p.code || p.productCode || '').toLowerCase()
        const barcode = String(p.barCode || p.barcode || '').toLowerCase()
        const desc = String(p.description || p.name || p.productName || '').toLowerCase()
        return code.includes(q) || barcode.includes(q) || desc.includes(q)
      })
      .slice(0, 10)
  }, [catalogProducts, productSearchInput])

  const handleAddProductToLines = (product) => {
    const code = product.code || product.productCode || `PRD-${product.id}`
    const barcode = product.barCode || product.barcode || '—'
    const desc = product.description || product.name || product.productName || 'Product Item'
    const cost = Number(product.averageCost || product.standardCost || product.basePrice || 1.0)
    const uom = product.uom || 'Pcs'

    // If item already in lines, increment qty
    const existing = lineItems.find((l) => l.productId === product.id || l.code === code)
    if (existing) {
      updateLine(existing.id, 'requisitionQty', Number(existing.requisitionQty) + 1)
      addNotification?.(`Increased quantity for ${desc}`, 'info')
    } else {
      const newLine = {
        id: Date.now() + Math.random(),
        productId: product.id,
        code,
        barcode,
        description: desc,
        requisitionQty: 1,
        uom,
        cost,
        total: cost,
      }
      setLineItems((prev) => [...prev, newLine])
      addNotification?.(`Added ${desc}`, 'success')
    }
    setProductSearchInput('')
  }

  // Update line item property
  const updateLine = (lineId, field, val) => {
    setLineItems((prev) =>
      prev.map((l) => {
        if (l.id !== lineId) return l
        const updated = { ...l, [field]: val }
        const q = Number(updated.requisitionQty) || 0
        const c = Number(updated.cost) || 0
        updated.total = q * c
        return updated
      })
    )
  }

  const removeLine = (lineId) => {
    setLineItems((prev) => prev.filter((l) => l.id !== lineId))
  }

  // Export line items from create modal
  const handleExportLines = () => {
    if (lineItems.length === 0) {
      addNotification?.('No product items to export', 'warning')
      return
    }
    const headers = ['Code', 'Barcode', 'Description', 'Requisition Qty', 'UOM', 'Cost', 'Total']
    const data = lineItems.map((l) => [
      l.code,
      l.barcode,
      l.description,
      l.requisitionQty,
      l.uom,
      l.cost,
      l.total.toFixed(2),
    ])
    exportStyledExcel(headers, data, `requisition_items_${formCode || 'draft'}.xlsx`, 'Items')
  }

  // Import line items from Excel file into create modal
  const handleImportLines = (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (evt) => {
      try {
        const bstr = evt.target.result
        const wb = XLSX.read(bstr, { type: 'binary' })
        const wsName = wb.SheetNames[0]
        const ws = wb.Sheets[wsName]
        const data = XLSX.utils.sheet_to_json(ws, { header: 1 })

        if (data.length <= 1) {
          addNotification?.('Uploaded file contains no data rows', 'warning')
          return
        }

        const newItems = []
        // Skip header row
        for (let i = 1; i < data.length; i++) {
          const row = data[i]
          if (!row || row.length === 0) continue
          const code = String(row[0] || '').trim()
          const barcode = String(row[1] || '—').trim()
          const desc = String(row[2] || 'Imported Product').trim()
          const qty = Number(row[3]) || 1
          const uom = String(row[4] || 'Pcs').trim()
          const cost = Number(row[5]) || 0

          if (code || desc) {
            newItems.push({
              id: Date.now() + i,
              productId: null,
              code: code || `PRD-${Date.now() + i}`,
              barcode,
              description: desc,
              requisitionQty: qty,
              uom,
              cost,
              total: qty * cost,
            })
          }
        }

        if (newItems.length > 0) {
          setLineItems((prev) => [...prev, ...newItems])
          addNotification?.(`Successfully imported ${newItems.length} products!`, 'success')
        } else {
          addNotification?.('Could not find valid product rows', 'warning')
        }
      } catch (err) {
        addNotification?.('Failed to parse Excel file', 'error')
      } finally {
        if (importFileInputRef.current) importFileInputRef.current.value = ''
      }
    }
    reader.readAsBinaryString(file)
  }

  // Line items totals
  const linesTotalAmount = useMemo(() => {
    return lineItems.reduce((sum, l) => sum + (Number(l.total) || 0), 0)
  }, [lineItems])

  const linesTotalQty = useMemo(() => {
    return lineItems.reduce((sum, l) => sum + (Number(l.requisitionQty) || 0), 0)
  }, [lineItems])

  // Submit Requisition to Backend
  const handleSubmitRequisition = async (e) => {
    e.preventDefault()
    if (!formCode.trim()) {
      addNotification?.('Please specify a Requisition Code', 'warning')
      return
    }
    if (lineItems.length === 0) {
      addNotification?.('Please add at least one product to the requisition', 'warning')
      return
    }

    setSubmitting(true)
    try {
      const payload = {
        code: formCode.trim(),
        date: formDate,
        requireDate: formRequireDate,
        templateName: formTemplateName,
        requisitionType: formType,
        requisitionAmount: linesTotalAmount,
        reference: formReference.trim(),
        referenceCode: formReferenceCode.trim(),
        userName: 'Badmin',
        status: 'OPEN',
        note: formNote.trim(),
        items: lineItems.map((l) => ({
          productId: l.productId,
          code: l.code,
          barcode: l.barcode,
          description: l.description,
          requisitionQty: Number(l.requisitionQty) || 1,
          uom: l.uom || 'Pcs',
          cost: Number(l.cost) || 0,
          total: Number(l.total) || 0,
        })),
      }

      await adminRequisitionAPI.create(payload)
      addNotification?.(`Requisition ${payload.code} created successfully!`, 'success')
      setCreateModalOpen(false)
      fetchRequisitions()
    } catch (err) {
      addNotification?.(err.message || 'Failed to create requisition', 'error')
    } finally {
      setSubmitting(false)
    }
  }

  // Update Status directly (e.g. mark Completed or Voided)
  const handleUpdateStatus = async (id, status) => {
    try {
      await adminRequisitionAPI.updateStatus(id, status)
      addNotification?.(`Requisition marked as ${status}`, 'success')
      fetchRequisitions()
    } catch (err) {
      addNotification?.(err.message || 'Failed to update status', 'error')
    }
  }

  // Status badge styling helper
  const renderStatusBadge = (status = 'OPEN') => {
    const s = String(status).toUpperCase()
    if (s === 'OPEN') {
      return (
        <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 font-mono">
          open
        </span>
      )
    }
    if (s === 'PARTIAL') {
      return (
        <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/30 font-mono">
          partial
        </span>
      )
    }
    if (s === 'COMPLETED') {
      return (
        <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 font-mono">
          Completed
        </span>
      )
    }
    if (s === 'VOIDED') {
      return (
        <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-rose-500/10 text-rose-400 border border-rose-500/30 font-mono">
          Voided
        </span>
      )
    }
    return (
      <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-slate-800 text-slate-300 font-mono">
        {status}
      </span>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-slate-100 p-4 sm:p-6 lg:p-8 font-sans">
      {/* Top Header & Breadcrumbs */}
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-400 mb-1">
            <Link to="/admin/purchase-management" className="hover:text-purple-400 transition-colors">
              {lang === 'en' ? 'Purchase Management' : 'ការគ្រប់គ្រងការទិញ'}
            </Link>
            <span>/</span>
            <span className="text-purple-400 font-medium">
              {lang === 'en' ? 'Requisition' : 'លិខិតស្នើសុំបញ្ជាទិញ'}
            </span>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500/20 to-indigo-600/30 border border-purple-500/30 flex items-center justify-center shadow-lg shadow-purple-900/20">
              <img src={fileNewIcon} alt="" className="w-6 h-6 object-contain" />
            </div>
            <div>
              <h1 className="text-2xl font-black tracking-tight text-white flex items-center gap-2">
                <span>{lang === 'en' ? 'Requisition' : 'លិខិតស្នើសុំបញ្ជាទិញ'}</span>
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-purple-500/10 text-purple-400 border border-purple-500/20">
                  {requisitions.length} records
                </span>
              </h1>
              <p className="text-xs text-slate-400 mt-0.5">
                {lang === 'en'
                  ? 'Manage internal stock purchase requests and procurement approvals.'
                  : 'គ្រប់គ្រងលិខិតស្នើសុំទិញស្តុកផ្ទៃក្នុង និងការអនុម័តលទ្ធកម្ម។'}
              </p>
            </div>
          </div>
        </div>

        {/* Global actions */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={fetchRequisitions}
            className="p-2.5 rounded-xl bg-slate-900 border border-slate-700/80 text-slate-300 hover:text-white hover:bg-slate-800 transition-all"
            title="Refresh Requisitions"
          >
            <RefreshIcon className={`w-4 h-4 ${loading ? 'animate-spin text-purple-400' : ''}`} />
          </button>
          <button
            type="button"
            onClick={() => setChooseColumnOpen(true)}
            className="px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-300 bg-slate-900/90 hover:bg-slate-800 border border-slate-700/80 transition-all"
          >
            {lang === 'en' ? 'Choose Column' : 'ជ្រើសរើសជួរឈរ'}
          </button>
          <button
            type="button"
            onClick={handleExportRequisitions}
            className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-500 hover:to-green-500 shadow-lg shadow-emerald-900/20 transition-all hover:scale-105 active:scale-95 flex items-center gap-2"
          >
            <span>{lang === 'en' ? 'Export Excel' : 'ទាញយក Excel'}</span>
          </button>
          <button
            type="button"
            onClick={handleOpenCreateModal}
            className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-600 hover:from-purple-500 hover:to-indigo-500 shadow-lg shadow-purple-900/30 transition-all hover:scale-105 active:scale-95 flex items-center gap-1.5"
          >
            <PlusIcon className="w-4 h-4" />
            <span>{lang === 'en' ? 'Create' : 'បង្កើតថ្មី'}</span>
          </button>
        </div>
      </div>

      {/* SEARCH SECTION: Search Requisition */}
      <div className="bg-slate-900/90 rounded-2xl border border-slate-800 shadow-xl p-5 mb-6 backdrop-blur-sm">
        <div className="mb-4">
          <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
            <SearchIcon className="w-4 h-4 text-purple-400" />
            <span>Search Requisition</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">Search requisition by any condition</p>
        </div>

        {/* First Row: Search Textbox + Search By Dropdown + Search Button + Advance Filter Toggle */}
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center">
          {/* Search - Textbox */}
          <div className="sm:col-span-6 relative">
            <input
              type="text"
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearchClick()}
              placeholder="Search requisition by any condition..."
              className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-purple-500 transition-colors shadow-inner"
            />
            <SearchIcon className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          </div>

          {/* Search By - Dropdown - Any - Code - Reference - Reference Code - User Name */}
          <div className="sm:col-span-3">
            <select
              value={searchBy}
              onChange={(e) => setSearchBy(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-purple-500 transition-colors"
            >
              <option value="Any">Search By: Any</option>
              <option value="Code">Search By: Code</option>
              <option value="Reference">Search By: Reference</option>
              <option value="Reference Code">Search By: Reference Code</option>
              <option value="User Name">Search By: User Name</option>
            </select>
          </div>

          {/* Search Button & Advance Filter Toggle */}
          <div className="sm:col-span-3 flex items-center gap-2">
            <button
              type="button"
              onClick={handleSearchClick}
              className="flex-1 py-2 px-4 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 shadow-md shadow-purple-900/30 transition-all hover:scale-[1.02] active:scale-95 flex items-center justify-center gap-1.5"
            >
              <SearchIcon className="w-3.5 h-3.5" />
              <span>Search</span>
            </button>

            {/* Advance Filter Button */}
            <button
              type="button"
              onClick={() => setAdvanceFilterOpen((prev) => !prev)}
              className={`px-3 py-2 rounded-xl text-xs font-semibold border transition-all flex items-center gap-1.5 ${
                advanceFilterOpen || fromDate || toDate || statusFilter !== 'ALL'
                  ? 'bg-purple-500/10 border-purple-500/40 text-purple-300'
                  : 'bg-slate-950 border-slate-700 text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
              title="Toggle Advance Filter"
            >
              <FilterIcon className="w-3.5 h-3.5" />
              <span className="hidden md:inline">Advance</span>
              <ChevronDownIcon
                className={`w-3.5 h-3.5 transition-transform duration-200 ${advanceFilterOpen ? 'rotate-180' : ''}`}
              />
            </button>
          </div>
        </div>

        {/* Collapsible Advance Filter: From date, To date, Status Dropdown (open, partial, Completed, Voided) */}
        {advanceFilterOpen && (
          <div className="mt-4 pt-4 border-t border-slate-800/80 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs animate-in fade-in duration-200">
            {/* From date */}
            <div>
              <label className="block text-slate-400 font-semibold mb-1">From Date</label>
              <input
                type="date"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-1.5 text-slate-200 focus:outline-none focus:border-purple-500"
              />
            </div>

            {/* To date */}
            <div>
              <label className="block text-slate-400 font-semibold mb-1">To Date</label>
              <input
                type="date"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-1.5 text-slate-200 focus:outline-none focus:border-purple-500"
              />
            </div>

            {/* Status Dropdown - open, partial, Completed, Voided */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-slate-400 font-semibold">Status</label>
                {(fromDate || toDate || statusFilter !== 'ALL') && (
                  <button
                    type="button"
                    onClick={handleResetFilters}
                    className="text-[11px] text-purple-400 hover:underline"
                  >
                    Reset All
                  </button>
                )}
              </div>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-1.5 text-slate-200 focus:outline-none focus:border-purple-500"
              >
                <option value="ALL">All Statuses</option>
                <option value="open">open</option>
                <option value="partial">partial</option>
                <option value="Completed">Completed</option>
                <option value="Voided">Voided</option>
              </select>
            </div>
          </div>
        )}
      </div>

      {/* TABLE SECTION: Requisition List */}
      <div className="bg-slate-900/90 rounded-2xl border border-slate-800 shadow-xl overflow-hidden backdrop-blur-sm">
        <div className="p-4 sm:p-5 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div>
            <h2 className="text-base font-bold text-white tracking-tight">Requisition List</h2>
            <p className="text-xs text-slate-400 mt-0.5">Show information of requisition list</p>
          </div>
          <div className="text-xs text-slate-400 font-mono">
            Total Requisitions: <span className="text-purple-400 font-bold">{requisitions.length}</span>
          </div>
        </div>

        {/* Data Table */}
        <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-slate-700">
          <table className="w-full text-xs text-left text-slate-300 border-collapse">
            <thead className="bg-slate-950/80 text-slate-400 uppercase tracking-wider font-semibold border-b border-slate-800">
              <tr>
                {visibleColumns.includes('code') && <th className="py-3 px-4">Code</th>}
                {visibleColumns.includes('date') && <th className="py-3 px-4">Date</th>}
                {visibleColumns.includes('requireDate') && <th className="py-3 px-4">Require Date</th>}
                {visibleColumns.includes('requisitionType') && <th className="py-3 px-4">Requisition Type</th>}
                {visibleColumns.includes('requisitionAmount') && (
                  <th className="py-3 px-4 text-right">Requisition Amount</th>
                )}
                {visibleColumns.includes('reference') && <th className="py-3 px-4">Reference</th>}
                {visibleColumns.includes('referenceCode') && <th className="py-3 px-4">Reference Code</th>}
                {visibleColumns.includes('userName') && <th className="py-3 px-4">User Name</th>}
                {visibleColumns.includes('status') && <th className="py-3 px-4 text-center">Status</th>}
                {visibleColumns.includes('actions') && <th className="py-3 px-4 text-center min-w-[140px]">Actions</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {requisitions.length > 0 ? (
                requisitions.map((req) => (
                  <tr key={req.id} className="hover:bg-slate-800/40 transition-colors group">
                    {/* Code */}
                    {visibleColumns.includes('code') && (
                      <td className="py-3 px-4 font-mono font-bold text-purple-400">{req.code}</td>
                    )}

                    {/* Date */}
                    {visibleColumns.includes('date') && (
                      <td className="py-3 px-4 font-mono text-slate-300">{req.date || '—'}</td>
                    )}

                    {/* Require Date */}
                    {visibleColumns.includes('requireDate') && (
                      <td className="py-3 px-4 font-mono text-slate-400">{req.requireDate || '—'}</td>
                    )}

                    {/* Requisition Type */}
                    {visibleColumns.includes('requisitionType') && (
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-200 text-[11px] font-medium">
                          {req.requisitionType || 'General'}
                        </span>
                      </td>
                    )}

                    {/* Requisition Amount */}
                    {visibleColumns.includes('requisitionAmount') && (
                      <td className="py-3 px-4 text-right font-mono font-bold text-emerald-400">
                        ${Number(req.requisitionAmount || 0).toFixed(2)}
                      </td>
                    )}

                    {/* Reference */}
                    {visibleColumns.includes('reference') && (
                      <td className="py-3 px-4 text-slate-300">{req.reference || '—'}</td>
                    )}

                    {/* Reference Code */}
                    {visibleColumns.includes('referenceCode') && (
                      <td className="py-3 px-4 font-mono text-slate-400">{req.referenceCode || '—'}</td>
                    )}

                    {/* User Name */}
                    {visibleColumns.includes('userName') && (
                      <td className="py-3 px-4 text-slate-300">{req.userName || 'Badmin'}</td>
                    )}

                    {/* Status */}
                    {visibleColumns.includes('status') && (
                      <td className="py-3 px-4 text-center">{renderStatusBadge(req.status)}</td>
                    )}

                    {/* Actions */}
                    {visibleColumns.includes('actions') && (
                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedReq(req)
                              setDetailModalOpen(true)
                            }}
                            className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-[11px]"
                          >
                            View
                          </button>
                          {req.status === 'OPEN' && (
                            <button
                              type="button"
                              onClick={() => handleUpdateStatus(req.id, 'COMPLETED')}
                              className="px-2 py-1 rounded bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20 text-[11px]"
                              title="Mark as Completed"
                            >
                              Complete
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => {
                              navigate('/admin/purchase-management/purchase-order', {
                                state: {
                                  fromRequisition: req,
                                  autoOpenCreate: true,
                                },
                              })
                            }}
                            className="px-2 py-1 rounded bg-cyan-600/20 border border-cyan-500/30 text-cyan-300 hover:bg-cyan-600/30 text-[11px] font-bold"
                            title="Convert into Purchase Order"
                          >
                            To PO →
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="10" className="py-12 text-center text-slate-500">
                    {loading ? (
                      <div className="flex flex-col items-center justify-center gap-2">
                        <RefreshIcon className="w-5 h-5 animate-spin text-purple-400" />
                        <span>Loading requisitions...</span>
                      </div>
                    ) : (
                      'No requisitions found matching your filter criteria.'
                    )}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* CHOOSE COLUMN MODAL */}
      {chooseColumnOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl">
            <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-white">Choose Column</h3>
                <p className="text-xs text-slate-400">Choose column you want to display on table</p>
              </div>
              <button
                type="button"
                onClick={() => setChooseColumnOpen(false)}
                className="text-slate-400 hover:text-white text-lg font-bold"
              >
                ✕
              </button>
            </div>
            <div className="p-5 space-y-2.5 max-h-96 overflow-y-auto">
              {ALL_COLUMNS.map((col) => {
                const checked = visibleColumns.includes(col.key)
                return (
                  <label
                    key={col.key}
                    className={`flex items-center justify-between p-2.5 rounded-xl border text-xs cursor-pointer transition-colors ${
                      checked
                        ? 'bg-purple-500/10 border-purple-500/30 text-white'
                        : 'bg-slate-950/40 border-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    <span className="font-semibold">{col.label[lang] || col.label.en}</span>
                    <input
                      type="checkbox"
                      disabled={col.always}
                      checked={checked}
                      onChange={() => toggleColumn(col.key)}
                      className="rounded border-slate-700 bg-slate-900 text-purple-500 focus:ring-purple-500"
                    />
                  </label>
                )
              })}
            </div>
            <div className="p-4 border-t border-slate-800 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setVisibleColumns(DEFAULT_VISIBLE)}
                className="px-3 py-1.5 rounded-xl text-xs text-slate-400 hover:text-white bg-slate-800"
              >
                Reset Default
              </button>
              <button
                type="button"
                onClick={() => setChooseColumnOpen(false)}
                className="px-4 py-1.5 rounded-xl text-xs font-bold text-white bg-purple-600 hover:bg-purple-500"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CREATE MODAL: General Information + Product Section */}
      {createModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-4xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden my-auto">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
              <div>
                <h3 className="text-base font-extrabold text-white flex items-center gap-2">
                  <span>Create Requisition</span>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-400 font-mono">
                    {formCode}
                  </span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">Input the general requisition information</p>
              </div>
              <button
                type="button"
                onClick={() => setCreateModalOpen(false)}
                className="text-slate-400 hover:text-white text-lg font-bold"
              >
                ✕
              </button>
            </div>

            {/* Modal Form Scrollable Body */}
            <form onSubmit={handleSubmitRequisition} className="p-6 overflow-y-auto space-y-6 text-xs flex-1">
              {/* SECTION 1: General Information */}
              <div className="bg-slate-950/60 rounded-xl p-4 border border-slate-800/80 space-y-4">
                <div className="border-b border-slate-800 pb-2">
                  <h4 className="text-sm font-bold text-white uppercase tracking-wider">General Information</h4>
                  <p className="text-[11px] text-slate-400">Input the general requisition information</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {/* Requisition Code - Auto Generate Code */}
                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">
                      Requisition Code <span className="text-purple-400 text-[10px]">(Auto Generate Code)</span>
                    </label>
                    <input
                      type="text"
                      value={formCode}
                      onChange={(e) => setFormCode(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-purple-300 font-mono font-bold focus:outline-none focus:border-purple-500"
                    />
                  </div>

                  {/* Requisition Date - Date */}
                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">Requisition Date</label>
                    <input
                      type="date"
                      value={formDate}
                      onChange={(e) => setFormDate(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-purple-500"
                    />
                  </div>

                  {/* Require Date - Date */}
                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">Require Date</label>
                    <input
                      type="date"
                      value={formRequireDate}
                      onChange={(e) => setFormRequireDate(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-purple-500"
                    />
                  </div>

                  {/* Template Name - Dropdown */}
                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">Template Name</label>
                    <select
                      value={formTemplateName}
                      onChange={(e) => setFormTemplateName(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-purple-500"
                    >
                      {TEMPLATE_OPTIONS.map((opt) => (
                        <option key={opt} value={opt}>
                          {opt}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Requisition Type - Dropdown */}
                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">Requisition Type</label>
                    <select
                      value={formType}
                      onChange={(e) => setFormType(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-purple-500"
                    >
                      {TYPE_OPTIONS.map((opt) => (
                        <option key={opt} value={opt}>
                          {opt}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Reference - textbox */}
                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">Reference</label>
                    <input
                      type="text"
                      value={formReference}
                      onChange={(e) => setFormReference(e.target.value)}
                      placeholder="e.g. Branch Replenishment Notice"
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-purple-500"
                    />
                  </div>

                  {/* Reference Code - textbox */}
                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">Reference Code</label>
                    <input
                      type="text"
                      value={formReferenceCode}
                      onChange={(e) => setFormReferenceCode(e.target.value)}
                      placeholder="e.g. REF-001"
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-slate-200 font-mono focus:outline-none focus:border-purple-500"
                    />
                  </div>
                </div>
              </div>

              {/* SECTION 2: Product (Add product for requisition) */}
              <div className="bg-slate-950/60 rounded-xl p-4 border border-slate-800/80 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-slate-800 pb-2">
                  <div>
                    <h4 className="text-sm font-bold text-white uppercase tracking-wider">Product</h4>
                    <p className="text-[11px] text-slate-400">Add product for requisition</p>
                  </div>

                  {/* Import & Export buttons */}
                  <div className="flex items-center gap-2">
                    <input
                      type="file"
                      ref={importFileInputRef}
                      onChange={handleImportLines}
                      accept=".xlsx,.xls,.csv"
                      className="hidden"
                    />
                    <button
                      type="button"
                      onClick={() => importFileInputRef.current?.click()}
                      className="px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-300 bg-slate-800 hover:bg-slate-700 hover:text-white border border-slate-700 flex items-center gap-1.5 transition-all"
                      title="Import product lines from Excel"
                    >
                      <UploadIcon className="w-3.5 h-3.5" />
                      <span>Import</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleExportLines}
                      className="px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-300 bg-slate-800 hover:bg-slate-700 hover:text-white border border-slate-700 flex items-center gap-1.5 transition-all"
                      title="Export current product lines to Excel"
                    >
                      <DownloadIcon className="w-3.5 h-3.5" />
                      <span>Export</span>
                    </button>
                  </div>
                </div>

                {/* Combined Product Search: Code | Barcode | Description */}
                <div className="relative">
                  <label className="block text-slate-300 font-semibold mb-1">
                    Search Product (Code, Barcode, Description)
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={productSearchInput}
                      onChange={(e) => setProductSearchInput(e.target.value)}
                      placeholder="Type Code, Barcode, or Description to add product..."
                      className="w-full bg-slate-900 border border-purple-500/40 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-purple-400 shadow-inner"
                    />
                    <SearchIcon className="w-4 h-4 text-purple-400 absolute left-3 top-2.5" />
                  </div>

                  {/* Autocomplete Dropdown */}
                  {matchedCatalogProducts.length > 0 && (
                    <div className="absolute left-0 right-0 top-full mt-1 z-30 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl max-h-56 overflow-y-auto divide-y divide-slate-800">
                      {matchedCatalogProducts.map((prod) => (
                        <div
                          key={prod.id}
                          onClick={() => handleAddProductToLines(prod)}
                          className="p-2.5 hover:bg-purple-950/40 cursor-pointer flex items-center justify-between transition-colors"
                        >
                          <div>
                            <div className="font-semibold text-white">
                              {prod.description || prod.name || prod.productName}
                            </div>
                            <div className="text-[11px] text-slate-400 flex items-center gap-2 font-mono">
                              <span>{prod.code || prod.productCode}</span>
                              {prod.barCode && (
                                <>
                                  <span>•</span>
                                  <span>{prod.barCode}</span>
                                </>
                              )}
                            </div>
                          </div>
                          <div className="text-right">
                            <span className="font-mono font-bold text-emerald-400">
                              ${Number(prod.averageCost || prod.basePrice || 1.0).toFixed(2)}
                            </span>
                            <span className="ml-2 px-2 py-0.5 rounded text-[10px] bg-purple-600/30 text-purple-300 font-bold">
                              + Add
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Line Items Table */}
                <div className="overflow-x-auto rounded-xl border border-slate-800">
                  <table className="w-full text-xs text-left text-slate-300 border-collapse">
                    <thead className="bg-slate-950 text-slate-400 uppercase tracking-wider font-semibold border-b border-slate-800">
                      <tr>
                        <th className="py-2.5 px-3">Code</th>
                        <th className="py-2.5 px-3">Barcode</th>
                        <th className="py-2.5 px-4 min-w-[180px]">Description</th>
                        <th className="py-2.5 px-3 text-right w-24">Requisition Qty</th>
                        <th className="py-2.5 px-3 text-center w-24">UOM</th>
                        <th className="py-2.5 px-3 text-right w-24">Cost</th>
                        <th className="py-2.5 px-3 text-right">Total</th>
                        <th className="py-2.5 px-2 w-8 text-center" />
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60">
                      {lineItems.length > 0 ? (
                        lineItems.map((line) => (
                          <tr key={line.id} className="hover:bg-slate-900/50 transition-colors">
                            <td className="py-2 px-3 font-mono text-purple-300">{line.code}</td>
                            <td className="py-2 px-3 font-mono text-slate-400">{line.barcode}</td>
                            <td className="py-2 px-4 font-semibold text-white">{line.description}</td>
                            <td className="py-2 px-3 text-right">
                              <input
                                type="number"
                                min="1"
                                value={line.requisitionQty}
                                onChange={(e) => updateLine(line.id, 'requisitionQty', e.target.value)}
                                className="w-20 bg-slate-900 border border-slate-700 rounded px-2 py-1 text-right text-purple-300 font-mono font-bold focus:outline-none focus:border-purple-400"
                              />
                            </td>
                            <td className="py-2 px-3 text-center">
                              <select
                                value={line.uom}
                                onChange={(e) => updateLine(line.id, 'uom', e.target.value)}
                                className="bg-slate-900 border border-slate-700 rounded px-2 py-1 text-[11px] text-slate-200"
                              >
                                {UOM_OPTIONS.map((u) => (
                                  <option key={u} value={u}>
                                    {u}
                                  </option>
                                ))}
                              </select>
                            </td>
                            <td className="py-2 px-3 text-right">
                              <input
                                type="number"
                                step="0.01"
                                min="0"
                                value={line.cost}
                                onChange={(e) => updateLine(line.id, 'cost', e.target.value)}
                                className="w-20 bg-slate-900 border border-slate-700 rounded px-2 py-1 text-right text-slate-200 font-mono focus:outline-none focus:border-purple-400"
                              />
                            </td>
                            <td className="py-2 px-3 text-right font-mono font-bold text-emerald-400">
                              ${Number(line.total || 0).toFixed(2)}
                            </td>
                            <td className="py-2 px-2 text-center">
                              <button
                                type="button"
                                onClick={() => removeLine(line.id)}
                                className="text-slate-500 hover:text-rose-400 p-1"
                                title="Remove line"
                              >
                                <TrashIcon className="w-3.5 h-3.5" />
                              </button>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan="8" className="py-8 text-center text-slate-500">
                            No products added yet. Use the search box above to add items.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Line Items Summary Footer */}
                <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between font-mono text-xs">
                  <div className="text-slate-400 font-sans">
                    Total Items: <span className="font-bold text-white">{lineItems.length}</span> | Qty:{' '}
                    <span className="font-bold text-white">{linesTotalQty}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-slate-400 font-sans mr-2">Total Amount:</span>
                    <span className="text-base font-bold text-emerald-400 font-mono">
                      ${linesTotalAmount.toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-2 flex items-center justify-end gap-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setCreateModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-6 py-2 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 shadow-lg shadow-purple-900/30 transition-all hover:scale-105 active:scale-95"
                >
                  {submitting ? 'Saving...' : 'Save Requisition'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DETAIL MODAL: View Requisition Details */}
      {detailModalOpen && selectedReq && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl p-6 space-y-4 text-xs">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-sm font-bold text-white font-mono">{selectedReq.code}</h3>
                <p className="text-slate-400 text-[11px]">{selectedReq.requisitionType}</p>
              </div>
              <button
                type="button"
                onClick={() => setDetailModalOpen(false)}
                className="text-slate-400 hover:text-white text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-950 p-3 rounded-xl border border-slate-800">
              <div>
                <div className="text-slate-500 text-[10px]">Date</div>
                <div className="font-mono text-white mt-0.5">{selectedReq.date || '—'}</div>
              </div>
              <div>
                <div className="text-slate-500 text-[10px]">Require Date</div>
                <div className="font-mono text-white mt-0.5">{selectedReq.requireDate || '—'}</div>
              </div>
              <div>
                <div className="text-slate-500 text-[10px]">User Name</div>
                <div className="text-white mt-0.5">{selectedReq.userName || 'Badmin'}</div>
              </div>
              <div>
                <div className="text-slate-500 text-[10px]">Status</div>
                <div className="mt-0.5">{renderStatusBadge(selectedReq.status)}</div>
              </div>
            </div>

            {/* Line Items List */}
            <div>
              <div className="font-bold text-white mb-2 uppercase tracking-wider text-[11px]">Requested Items</div>
              <div className="border border-slate-800 rounded-xl overflow-hidden">
                <table className="w-full text-left">
                  <thead className="bg-slate-950 text-slate-400 uppercase text-[10px]">
                    <tr>
                      <th className="py-2 px-3">Code</th>
                      <th className="py-2 px-3">Description</th>
                      <th className="py-2 px-3 text-right">Qty</th>
                      <th className="py-2 px-3 text-center">UOM</th>
                      <th className="py-2 px-3 text-right">Cost</th>
                      <th className="py-2 px-3 text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800">
                    {selectedReq.items && selectedReq.items.length > 0 ? (
                      selectedReq.items.map((it, idx) => (
                        <tr key={it.id || idx}>
                          <td className="py-2 px-3 font-mono text-purple-400">{it.code}</td>
                          <td className="py-2 px-3 font-semibold text-white">{it.description}</td>
                          <td className="py-2 px-3 text-right font-mono">{it.requisitionQty}</td>
                          <td className="py-2 px-3 text-center text-slate-400">{it.uom}</td>
                          <td className="py-2 px-3 text-right font-mono">${Number(it.cost || 0).toFixed(2)}</td>
                          <td className="py-2 px-3 text-right font-mono font-bold text-emerald-400">
                            ${Number(it.total || 0).toFixed(2)}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="6" className="py-4 text-center text-slate-500">
                          No line items found.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="flex justify-end pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setDetailModalOpen(false)}
                className="px-4 py-1.5 rounded-xl bg-slate-800 text-slate-300 hover:text-white"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
