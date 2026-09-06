import React, { useState, useEffect, useMemo, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { useLanguage } from '../../context/LanguageContext'
import { useNotifications } from '../../context/NotificationContext'
import { adminShipmentTariffAPI, adminSupplierAPI } from '../../api/api'
import { exportStyledExcel } from '../../utils/excelExport'
import dollarIcon from '../../assets/icon/3dicons-dollar-dynamic-color.png'
import './ProductsHub.css'

// SVGs
function SearchIcon({ className = 'w-4 h-4' }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
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

function PlusIcon({ className = 'w-4 h-4' }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
    </svg>
  )
}

function EditIcon({ className = 'w-4 h-4' }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
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

function CheckIcon({ className = 'w-4 h-4' }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
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

// All available table columns for Choose Column
const ALL_COLUMNS = [
  { key: 'code', label: { en: 'Code', kh: 'លេខកូដ' }, always: true },
  { key: 'description', label: { en: 'Description', kh: 'ការពិពណ៌នា' }, always: true },
  { key: 'secondLanguage', label: { en: 'Second Language', kh: 'ភាសាទីពីរ (ខ្មែរ)' } },
  { key: 'supplier', label: { en: 'Supplier', kh: 'អ្នកផ្គត់ផ្គង់' } },
  { key: 'active', label: { en: 'Active', kh: 'ស្ថានភាពសកម្ម' } },
  { key: 'actions', label: { en: 'Actions', kh: 'សកម្មភាព' }, always: true },
]

const DEFAULT_VISIBLE_COLUMNS = ['code', 'description', 'secondLanguage', 'supplier', 'active', 'actions']

// Search By options matching user specification
const SEARCH_BY_OPTIONS = [
  { value: 'Any', label: { en: 'Any', kh: 'ទាំងអស់' } },
  { value: 'Code', label: { en: 'Code', kh: 'លេខកូដ' } },
  { value: 'Description', label: { en: 'Description', kh: 'ការពិពណ៌នា' } },
  { value: 'Second Language', label: { en: 'Second Language', kh: 'ភាសាទីពីរ' } },
]

// Status options matching user specification: Active - all - inactive
const STATUS_OPTIONS = [
  { value: 'all', label: { en: 'All', kh: 'ទាំងអស់' } },
  { value: 'active', label: { en: 'Active', kh: 'សកម្ម' } },
  { value: 'inactive', label: { en: 'Inactive', kh: 'អសកម្ម' } },
]

export default function ShipmentTariffList() {
  const { lang } = useLanguage()
  const { addNotification } = useNotifications()

  // State for data
  const [tariffs, setTariffs] = useState([])
  const [suppliers, setSuppliers] = useState([])
  const [loading, setLoading] = useState(true)

  // Search criteria
  // Search - Textbox
  // Search By - DropDown - Any Code Description - Second Language
  // Status - Dropdown - Active - all - inactive
  const [searchText, setSearchText] = useState('')
  const [searchBy, setSearchBy] = useState('Any')
  const [statusFilter, setStatusFilter] = useState('all')

  // Applied search filter state
  const [appliedFilters, setAppliedFilters] = useState({
    search: '',
    searchBy: 'Any',
    status: 'all',
  })

  // Choose Column state
  const [chooseColumnOpen, setChooseColumnOpen] = useState(false)
  const [visibleColumns, setVisibleColumns] = useState(() => {
    try {
      const saved = localStorage.getItem('bg_shipment_tariff_columns')
      return saved ? JSON.parse(saved) : DEFAULT_VISIBLE_COLUMNS
    } catch {
      return DEFAULT_VISIBLE_COLUMNS
    }
  })

  // Create / Edit Modal state
  const [modalOpen, setModalOpen] = useState(false)
  const [editingTariff, setEditingTariff] = useState(null)
  const [generatingCode, setGeneratingCode] = useState(false)
  const [saving, setSaving] = useState(false)

  // Form Data
  // Code - Auto Generate Code
  // Supplier - DropDown Live data
  // Active - Tickbox
  // Description* - textbox
  // Second Language - textbox
  const [formData, setFormData] = useState({
    code: '',
    supplierId: '',
    supplier: '',
    active: true,
    description: '',
    secondLanguage: '',
  })

  // Delete Confirmation Modal
  const [deleteModalOpen, setDeleteModalOpen] = useState(false)
  const [tariffToDelete, setTariffToDelete] = useState(null)
  const [deleting, setDeleting] = useState(false)

  // Save visible columns to localStorage
  const toggleColumn = (key) => {
    setVisibleColumns((prev) => {
      let updated
      if (prev.includes(key)) {
        updated = prev.filter((k) => k !== key)
      } else {
        updated = [...prev, key]
      }
      try {
        localStorage.setItem('bg_shipment_tariff_columns', JSON.stringify(updated))
      } catch (err) {
        console.error('Failed to save column preference', err)
      }
      return updated
    })
  }

  const resetColumnsToDefault = () => {
    setVisibleColumns(DEFAULT_VISIBLE_COLUMNS)
    try {
      localStorage.setItem('bg_shipment_tariff_columns', JSON.stringify(DEFAULT_VISIBLE_COLUMNS))
    } catch (err) {
      console.error(err)
    }
  }

  // Load suppliers live data
  const loadSuppliers = useCallback(async () => {
    try {
      const res = await adminSupplierAPI.getAll()
      if (res?.data && Array.isArray(res.data)) {
        setSuppliers(res.data)
      } else if (Array.isArray(res)) {
        setSuppliers(res)
      }
    } catch (err) {
      console.error('Failed to load suppliers:', err)
    }
  }, [])

  // Load shipment tariffs from backend
  const loadTariffs = useCallback(async (filters = appliedFilters) => {
    setLoading(true)
    try {
      const params = {}
      if (filters.search && filters.search.trim()) {
        params.search = filters.search.trim()
        params.searchBy = filters.searchBy
      }
      if (filters.status && filters.status !== 'all') {
        params.status = filters.status
      }

      const res = await adminShipmentTariffAPI.getAll(params)
      if (res?.data && Array.isArray(res.data)) {
        setTariffs(res.data)
      } else if (Array.isArray(res)) {
        setTariffs(res)
      } else {
        setTariffs([])
      }
    } catch (err) {
      console.error('Failed to load shipment tariffs:', err)
      addNotification?.('Failed to load shipment tariffs', 'error')
      setTariffs([])
    } finally {
      setLoading(false)
    }
  }, [appliedFilters, addNotification])

  useEffect(() => {
    loadSuppliers()
    loadTariffs()
  }, [loadSuppliers, loadTariffs])

  // Handle Search Trigger
  const handleSearch = (e) => {
    if (e) e.preventDefault()
    const newFilters = {
      search: searchText,
      searchBy: searchBy,
      status: statusFilter,
    }
    setAppliedFilters(newFilters)
    loadTariffs(newFilters)
  }

  // Handle Reset Filter Trigger
  const handleReset = () => {
    setSearchText('')
    setSearchBy('Any')
    setStatusFilter('all')
    const resetFilterObj = {
      search: '',
      searchBy: 'Any',
      status: 'all',
    }
    setAppliedFilters(resetFilterObj)
    loadTariffs(resetFilterObj)
  }

  // Generate next code
  const fetchNextCode = async () => {
    setGeneratingCode(true)
    try {
      const res = await adminShipmentTariffAPI.getNextCode()
      const code = res?.data?.code || res?.code || `ST-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-0001`
      setFormData((prev) => ({ ...prev, code }))
      return code
    } catch (err) {
      console.error('Failed to generate next code:', err)
      const fallback = `ST-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-0001`
      setFormData((prev) => ({ ...prev, code: fallback }))
      return fallback
    } finally {
      setGeneratingCode(false)
    }
  }

  // Open Create Modal
  const handleOpenCreate = async () => {
    setEditingTariff(null)
    setFormData({
      code: 'Loading...',
      supplierId: '',
      supplier: '',
      active: true,
      description: '',
      secondLanguage: '',
    })
    setModalOpen(true)
    await fetchNextCode()
  }

  // Open Edit Modal
  const handleOpenEdit = (tariff) => {
    setEditingTariff(tariff)
    setFormData({
      code: tariff.code || '',
      supplierId: tariff.supplierId || '',
      supplier: tariff.supplier || '',
      active: tariff.active !== false,
      description: tariff.description || '',
      secondLanguage: tariff.secondLanguage || '',
    })
    setModalOpen(true)
  }

  // Handle Supplier Selection in Modal
  const handleSupplierChange = (e) => {
    const sId = e.target.value
    if (!sId) {
      setFormData((prev) => ({ ...prev, supplierId: '', supplier: '' }))
      return
    }
    const found = suppliers.find((s) => String(s.id) === String(sId))
    setFormData((prev) => ({
      ...prev,
      supplierId: Number(sId),
      supplier: found ? found.name : '',
    }))
  }

  // Submit Modal Form (Create or Update)
  const handleSubmitForm = async (e) => {
    e.preventDefault()
    if (!formData.description || !formData.description.trim()) {
      addNotification?.('Description is required (*)', 'error')
      return
    }

    setSaving(true)
    try {
      const payload = {
        code: formData.code,
        supplierId: formData.supplierId ? Number(formData.supplierId) : null,
        supplier: formData.supplier || null,
        active: Boolean(formData.active),
        description: formData.description.trim(),
        secondLanguage: formData.secondLanguage ? formData.secondLanguage.trim() : '',
      }

      if (editingTariff) {
        await adminShipmentTariffAPI.update(editingTariff.id, payload)
        addNotification?.('Shipment tariff updated successfully', 'success')
      } else {
        await adminShipmentTariffAPI.create(payload)
        addNotification?.('Shipment tariff created successfully', 'success')
      }

      setModalOpen(false)
      loadTariffs()
    } catch (err) {
      console.error('Failed to save shipment tariff:', err)
      addNotification?.(err?.message || 'Failed to save shipment tariff', 'error')
    } finally {
      setSaving(false)
    }
  }

  // Toggle Status directly from table
  const handleToggleStatus = async (tariff) => {
    try {
      const newStatus = !tariff.active
      await adminShipmentTariffAPI.updateStatus(tariff.id, newStatus)
      setTariffs((prev) =>
        prev.map((t) => (t.id === tariff.id ? { ...t, active: newStatus } : t))
      )
      addNotification?.(
        `Tariff ${tariff.code} marked as ${newStatus ? 'Active' : 'Inactive'}`,
        'success'
      )
    } catch (err) {
      console.error('Failed to toggle status:', err)
      addNotification?.('Failed to update status', 'error')
    }
  }

  // Open Delete Confirmation
  const handleOpenDelete = (tariff) => {
    setTariffToDelete(tariff)
    setDeleteModalOpen(true)
  }

  // Confirm Delete
  const handleConfirmDelete = async () => {
    if (!tariffToDelete) return
    setDeleting(true)
    try {
      await adminShipmentTariffAPI.delete(tariffToDelete.id)
      addNotification?.(`Shipment tariff ${tariffToDelete.code} deleted`, 'success')
      setDeleteModalOpen(false)
      setTariffToDelete(null)
      loadTariffs()
    } catch (err) {
      console.error('Failed to delete tariff:', err)
      addNotification?.('Failed to delete shipment tariff', 'error')
    } finally {
      setDeleting(false)
    }
  }

  // Export to Excel
  const handleExportExcel = () => {
    if (!tariffs.length) {
      addNotification?.('No shipment tariffs to export', 'warning')
      return
    }

    const headers = [
      'Code',
      'Description',
      'Second Language',
      'Supplier',
      'Status',
      'Created At',
    ]

    const data = tariffs.map((t) => [
      t.code || '—',
      t.description || '—',
      t.secondLanguage || '—',
      t.supplier || '—',
      t.active ? 'Active' : 'Inactive',
      t.createdAt ? new Date(t.createdAt).toLocaleDateString() : '—',
    ])

    const filename = `shipment_tariffs_${new Date().toISOString().slice(0, 10)}.xlsx`
    exportStyledExcel(headers, data, filename, 'Shipment Tariffs')
    addNotification?.('Exported shipment tariffs to Excel', 'success')
  }

  return (
    <div className="space-y-6 pb-12 text-slate-100">
      {/* Top Header / Breadcrumbs */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-400">
            <Link to="/admin/freight-management" className="hover:text-blue-400 transition-colors">
              {lang === 'kh' ? 'មជ្ឈមណ្ឌលគ្រប់គ្រងការដឹកជញ្ជូន' : 'Freight Management Hub'}
            </Link>
            <span>/</span>
            <span className="text-blue-400">
              {lang === 'kh' ? 'អត្រាតម្លៃដឹកជញ្ជូន' : 'Shipment Tariff'}
            </span>
          </div>
          <div className="mt-1 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/10 border border-blue-500/20 shadow-sm">
              <img src={dollarIcon} alt="Tariff" className="h-6 w-6 object-contain drop-shadow" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white">
                {lang === 'kh' ? 'អត្រាតម្លៃដឹកជញ្ជូន' : 'Shipment Tariff'}
              </h1>
              <p className="text-xs sm:text-sm text-slate-400">
                {lang === 'kh'
                  ? 'កំណត់អត្រាតម្លៃដឹកជញ្ជូន និងថ្លៃសេវាអ្នកផ្គត់ផ្គង់'
                  : 'Manage shipment tariffs, zone rates, and supplier delivery charges.'}
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

      {/* 1. Search Shipment Tariff Card */}
      <div className="rounded-3xl border border-slate-800/80 bg-[#141922]/90 p-5 sm:p-6 shadow-xl backdrop-blur-md">
        <div className="mb-4">
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <SearchIcon className="w-4 h-4 text-blue-400" />
            {lang === 'kh' ? 'ស្វែងរកអត្រាតម្លៃដឹកជញ្ជូន' : 'Search Shipment Tariff'}
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            {lang === 'kh'
              ? 'ស្វែងរកអត្រាតម្លៃដឹកជញ្ជូនតាមលក្ខខណ្ឌណាមួយ (ឧ. ទាំងអស់, លេខកូដ, ការពិពណ៌នា...)'
              : 'Search shipment tariff by any condition . Ex(Any, Code, Description...)'}
          </p>
        </div>

        <form onSubmit={handleSearch} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-4 items-end">
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
                    ? 'បញ្ចូលពាក្យស្វែងរក...'
                    : 'Search by any condition (e.g. ST-2026, Express, Phnom Penh)...'
                }
                className="w-full rounded-xl border border-slate-800 bg-[#0d1117] px-3.5 py-2.5 pl-9 text-xs sm:text-sm text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-all"
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

          {/* Search By - DropDown - Any Code Description - Second Language */}
          <div className="lg:col-span-3 space-y-1.5">
            <label className="text-xs font-semibold text-slate-300">
              {lang === 'kh' ? 'ស្វែងរកតាម' : 'Search By'}
            </label>
            <select
              value={searchBy}
              onChange={(e) => setSearchBy(e.target.value)}
              className="w-full rounded-xl border border-slate-800 bg-[#0d1117] px-3.5 py-2.5 text-xs sm:text-sm text-white focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-all cursor-pointer"
            >
              {SEARCH_BY_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value} className="bg-slate-900 text-white">
                  {lang === 'kh' ? opt.label.kh : opt.label.en}
                </option>
              ))}
            </select>
          </div>

          {/* Status - Dropdown - Active - all - inactive */}
          <div className="lg:col-span-2 space-y-1.5">
            <label className="text-xs font-semibold text-slate-300">
              {lang === 'kh' ? 'ស្ថានភាព' : 'Status'}
            </label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full rounded-xl border border-slate-800 bg-[#0d1117] px-3.5 py-2.5 text-xs sm:text-sm text-white focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-all cursor-pointer"
            >
              {STATUS_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value} className="bg-slate-900 text-white">
                  {lang === 'kh' ? opt.label.kh : opt.label.en}
                </option>
              ))}
            </select>
          </div>

          {/* Buttons: Search & Reset */}
          <div className="lg:col-span-2 flex items-center gap-2">
            <button
              type="submit"
              className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 px-3.5 py-2.5 text-xs font-bold text-white shadow-lg shadow-blue-600/25 transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              <SearchIcon className="w-4 h-4" />
              <span>{lang === 'kh' ? 'ស្វែងរក' : 'Search'}</span>
            </button>
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
        </form>
      </div>

      {/* 2. Shipment Tariff List Section */}
      <div className="rounded-3xl border border-slate-800/80 bg-[#141922]/90 p-5 sm:p-6 shadow-xl backdrop-blur-md">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-5">
          <div>
            <div className="flex items-center gap-2.5">
              <h2 className="text-base sm:text-lg font-bold text-white">
                {lang === 'kh' ? 'បញ្ជីអត្រាតម្លៃដឹកជញ្ជូន' : 'Shipment Tariff List'}
              </h2>
              <span className="rounded-full bg-blue-500/10 border border-blue-500/20 px-2.5 py-0.5 text-xs font-bold text-blue-400">
                {tariffs.length} {lang === 'kh' ? 'កំណត់ត្រា' : 'Items'}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              {lang === 'kh'
                ? 'បង្ហាញព័ត៌មានលម្អិតនៃអត្រាតម្លៃដឹកជញ្ជូន'
                : 'Show information of shipment tariff'}
            </p>
          </div>

          <div className="flex items-center flex-wrap gap-2">
            {/* Export Excel Button */}
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
              <ColumnsIcon className="w-4 h-4 text-blue-400" />
              <span>{lang === 'kh' ? 'ជ្រើសរើសជួរឈរ' : 'Choose Column'}</span>
            </button>

            {/* Create Button */}
            <button
              type="button"
              onClick={handleOpenCreate}
              className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 px-4 py-2 text-xs font-bold text-white shadow-lg shadow-blue-600/25 transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              <PlusIcon className="w-4 h-4" />
              <span>{lang === 'kh' ? '+ បង្កើតអត្រាថ្មី' : '+ Create Shipment Tariff'}</span>
            </button>
          </div>
        </div>

        {/* Table View */}
        <div className="overflow-x-auto rounded-2xl border border-slate-800/80 bg-[#0d1117]/60">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-900/70 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                {visibleColumns.includes('code') && (
                  <th className="px-4 py-3.5">{lang === 'kh' ? 'លេខកូដ' : 'Code'}</th>
                )}
                {visibleColumns.includes('description') && (
                  <th className="px-4 py-3.5">{lang === 'kh' ? 'ការពិពណ៌នា' : 'Description'}</th>
                )}
                {visibleColumns.includes('secondLanguage') && (
                  <th className="px-4 py-3.5">{lang === 'kh' ? 'ភាសាទីពីរ' : 'Second Language'}</th>
                )}
                {visibleColumns.includes('supplier') && (
                  <th className="px-4 py-3.5">{lang === 'kh' ? 'អ្នកផ្គត់ផ្គង់' : 'Supplier'}</th>
                )}
                {visibleColumns.includes('active') && (
                  <th className="px-4 py-3.5 text-center">{lang === 'kh' ? 'ស្ថានភាព' : 'Active'}</th>
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
                      <div className="h-7 w-7 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />
                      <span className="text-xs">{lang === 'kh' ? 'កំពុងផ្ទុកទិន្នន័យ...' : 'Loading shipment tariffs...'}</span>
                    </div>
                  </td>
                </tr>
              ) : tariffs.length === 0 ? (
                <tr>
                  <td colSpan={visibleColumns.length} className="py-12 text-center text-slate-400">
                    <div className="flex flex-col items-center justify-center gap-2 max-w-sm mx-auto">
                      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-800/60 border border-slate-700/50 text-slate-400">
                        <SearchIcon className="w-6 h-6" />
                      </div>
                      <p className="text-sm font-semibold text-slate-300">
                        {lang === 'kh' ? 'មិនមានទិន្នន័យអត្រាតម្លៃដឹកជញ្ជូនទេ' : 'No shipment tariffs found'}
                      </p>
                      <p className="text-xs text-slate-500">
                        {appliedFilters.search || appliedFilters.status !== 'all'
                          ? lang === 'kh'
                            ? 'មិនមានទិន្នន័យត្រូវនឹងការស្វែងរករបស់អ្នកទេ។ សូមសាកល្បងកំណត់តម្រងឡើងវិញ។'
                            : 'No records match your search criteria. Try resetting your search filters.'
                          : lang === 'kh'
                          ? 'មិនទាន់មានអត្រាតម្លៃដឹកជញ្ជូននៅឡើយទេ។ ចុចប៊ូតុងខាងក្រោមដើម្បីបង្កើត។'
                          : 'No shipment tariffs registered yet. Create your first tariff.'}
                      </p>
                      {appliedFilters.search || appliedFilters.status !== 'all' ? (
                        <button
                          type="button"
                          onClick={handleReset}
                          className="mt-2 text-xs font-semibold text-blue-400 hover:text-blue-300 underline"
                        >
                          {lang === 'kh' ? 'កំណត់តម្រងឡើងវិញ' : 'Reset Search Filters'}
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={handleOpenCreate}
                          className="mt-2 inline-flex items-center gap-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 px-3.5 py-1.5 text-xs font-bold text-white shadow-md transition-all"
                        >
                          <PlusIcon className="w-3.5 h-3.5" />
                          <span>{lang === 'kh' ? 'បង្កើតអត្រាតម្លៃដំបូង' : 'Create First Tariff'}</span>
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                tariffs.map((tariff) => (
                  <tr
                    key={tariff.id}
                    className="hover:bg-slate-800/30 transition-colors group"
                  >
                    {/* Code */}
                    {visibleColumns.includes('code') && (
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        <span className="font-mono text-xs font-bold text-blue-400 bg-blue-500/10 border border-blue-500/20 px-2.5 py-1 rounded-lg">
                          {tariff.code}
                        </span>
                      </td>
                    )}

                    {/* Description */}
                    {visibleColumns.includes('description') && (
                      <td className="px-4 py-3.5 font-medium text-white">
                        {tariff.description || '—'}
                      </td>
                    )}

                    {/* Second Language */}
                    {visibleColumns.includes('secondLanguage') && (
                      <td className="px-4 py-3.5 text-slate-400">
                        {tariff.secondLanguage || <span className="text-slate-600">—</span>}
                      </td>
                    )}

                    {/* Supplier */}
                    {visibleColumns.includes('supplier') && (
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        {tariff.supplier ? (
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-800 border border-slate-700/80 px-2.5 py-0.5 text-xs text-slate-300 font-medium">
                            <span className="h-1.5 w-1.5 rounded-full bg-blue-400" />
                            {tariff.supplier}
                          </span>
                        ) : (
                          <span className="text-slate-600">—</span>
                        )}
                      </td>
                    )}

                    {/* Active */}
                    {visibleColumns.includes('active') && (
                      <td className="px-4 py-3.5 text-center whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => handleToggleStatus(tariff)}
                          title={lang === 'kh' ? 'ចុចដើម្បីប្តូរស្ថានភាព' : 'Click to toggle status'}
                          className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-bold transition-all cursor-pointer hover:scale-105 ${
                            tariff.active
                              ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/25'
                              : 'bg-slate-800 text-slate-400 border border-slate-700 hover:bg-slate-700'
                          }`}
                        >
                          <span
                            className={`h-1.5 w-1.5 rounded-full ${
                              tariff.active ? 'bg-emerald-400' : 'bg-slate-500'
                            }`}
                          />
                          {tariff.active
                            ? lang === 'kh'
                              ? 'សកម្ម'
                              : 'Active'
                            : lang === 'kh'
                            ? 'អសកម្ម'
                            : 'Inactive'}
                        </button>
                      </td>
                    )}

                    {/* Actions */}
                    {visibleColumns.includes('actions') && (
                      <td className="px-4 py-3.5 text-right whitespace-nowrap">
                        <div className="inline-flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleOpenEdit(tariff)}
                            title={lang === 'kh' ? 'កែប្រែ' : 'Edit'}
                            className="rounded-lg p-1.5 text-slate-400 hover:bg-blue-500/10 hover:text-blue-400 transition-colors"
                          >
                            <EditIcon className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleOpenDelete(tariff)}
                            title={lang === 'kh' ? 'លុប' : 'Delete'}
                            className="rounded-lg p-1.5 text-slate-400 hover:bg-rose-500/10 hover:text-rose-400 transition-colors"
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
      </div>

      {/* 3. Choose Column Modal */}
      {chooseColumnOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-md rounded-3xl border border-slate-800 bg-[#141922] p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <ColumnsIcon className="w-4 h-4 text-blue-400" />
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
                        ? 'border-blue-500/30 bg-blue-500/10 text-white'
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
                      className="h-4 w-4 rounded border-slate-700 bg-slate-800 text-blue-600 focus:ring-blue-500 disabled:opacity-50 cursor-pointer"
                    />
                  </label>
                )
              })}
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={resetColumnsToDefault}
                className="text-xs font-semibold text-slate-400 hover:text-white transition-colors"
              >
                {lang === 'kh' ? 'កំណត់លំនាំដើមឡើងវិញ' : 'Reset to Default'}
              </button>
              <button
                type="button"
                onClick={() => setChooseColumnOpen(false)}
                className="rounded-xl bg-blue-600 hover:bg-blue-500 px-4 py-2 text-xs font-bold text-white shadow-md transition-all"
              >
                {lang === 'kh' ? 'រួចរាល់' : 'Done'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 4. Create / Edit Shipment Tariff Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-xl rounded-3xl border border-slate-800 bg-[#141922] p-6 sm:p-7 shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div>
                <h3 className="text-lg font-bold text-white">
                  {editingTariff
                    ? lang === 'kh'
                      ? 'កែប្រែអត្រាតម្លៃដឹកជញ្ជូន'
                      : 'Edit Shipment Tariff'
                    : lang === 'kh'
                    ? 'បង្កើតអត្រាតម្លៃដឹកជញ្ជូនថ្មី'
                    : 'Create Shipment Tariff'}
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  {lang === 'kh'
                    ? 'បញ្ចូលព័ត៌មានលម្អិតនៃអត្រាតម្លៃដឹកជញ្ជូន'
                    : 'Configure shipment tariff rates and live supplier details'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="rounded-xl p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
              >
                <XMarkIcon className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitForm} className="space-y-5">
              {/* General Information Section Header */}
              <div className="rounded-2xl border border-blue-500/20 bg-blue-500/5 p-4">
                <h4 className="text-sm font-bold text-blue-400 flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-blue-400" />
                  {lang === 'kh' ? 'ព័ត៌មានទូទៅ' : 'General Information'}
                </h4>
                <p className="text-xs text-slate-400 mt-0.5">
                  {lang === 'kh'
                    ? 'បញ្ចូលព័ត៌មានទូទៅនៃអត្រាតម្លៃដឹកជញ្ជូន'
                    : 'Input the general shipment tariff information'}
                </p>
              </div>

              {/* Code - Auto Generate Code */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-slate-300">
                    {lang === 'kh' ? 'លេខកូដ' : 'Code'}
                  </label>
                  {!editingTariff && (
                    <span className="text-[11px] font-mono text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full">
                      {lang === 'kh' ? 'បង្កើតកូដស្វ័យប្រវត្តិ' : 'Auto Generate Code'}
                    </span>
                  )}
                </div>
                <div className="relative flex items-center">
                  <input
                    type="text"
                    value={formData.code}
                    onChange={(e) => setFormData((prev) => ({ ...prev, code: e.target.value }))}
                    placeholder="Auto Generate Code..."
                    className="w-full rounded-xl border border-slate-800 bg-[#0d1117] px-3.5 py-2.5 text-xs sm:text-sm text-white font-mono placeholder-slate-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-all pr-10"
                  />
                  {!editingTariff && (
                    <button
                      type="button"
                      onClick={fetchNextCode}
                      disabled={generatingCode}
                      title={lang === 'kh' ? 'បង្កើតកូដថ្មីឡើងវិញ' : 'Regenerate Code'}
                      className="absolute right-2 p-1.5 text-slate-400 hover:text-blue-400 disabled:opacity-50 transition-colors"
                    >
                      <RefreshIcon className={`w-4 h-4 ${generatingCode ? 'animate-spin' : ''}`} />
                    </button>
                  )}
                </div>
              </div>

              {/* Supplier - DropDown Live data */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">
                  {lang === 'kh' ? 'អ្នកផ្គត់ផ្គង់' : 'Supplier'}
                  <span className="ml-1 text-[11px] text-slate-500">
                    ({lang === 'kh' ? 'ទិន្នន័យបន្តផ្ទាល់' : 'DropDown Live data'})
                  </span>
                </label>
                <select
                  value={formData.supplierId || ''}
                  onChange={handleSupplierChange}
                  className="w-full rounded-xl border border-slate-800 bg-[#0d1117] px-3.5 py-2.5 text-xs sm:text-sm text-white focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-all cursor-pointer"
                >
                  <option value="" className="bg-slate-900 text-slate-400">
                    {lang === 'kh' ? '-- ជ្រើសរើសអ្នកផ្គត់ផ្គង់ --' : '-- Select Supplier --'}
                  </option>
                  {suppliers.map((s) => (
                    <option key={s.id} value={s.id} className="bg-slate-900 text-white">
                      {s.name} {s.code ? `(${s.code})` : ''}
                    </option>
                  ))}
                </select>
              </div>

              {/* Description* - textbox */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">
                  {lang === 'kh' ? 'ការពិពណ៌នា *' : 'Description*'}
                  <span className="text-rose-400 ml-1 font-bold">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.description}
                  onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
                  placeholder={
                    lang === 'kh'
                      ? 'ឧ. ការដឹកជញ្ជូនរហ័សតំបន់កណ្តាលភ្នំពេញ'
                      : 'Ex: Standard Express Delivery - Phnom Penh Ring'
                  }
                  className="w-full rounded-xl border border-slate-800 bg-[#0d1117] px-3.5 py-2.5 text-xs sm:text-sm text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-all"
                />
              </div>

              {/* Second Language - textbox */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">
                  {lang === 'kh' ? 'ភាសាទីពីរ (ខ្មែរ)' : 'Second Language'}
                </label>
                <input
                  type="text"
                  value={formData.secondLanguage}
                  onChange={(e) => setFormData((prev) => ({ ...prev, secondLanguage: e.target.value }))}
                  placeholder={
                    lang === 'kh'
                      ? 'បញ្ចូលការពិពណ៌នាជាភាសាខ្មែរ...'
                      : 'Khmer description or alternate language title...'
                  }
                  className="w-full rounded-xl border border-slate-800 bg-[#0d1117] px-3.5 py-2.5 text-xs sm:text-sm text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-all"
                />
              </div>

              {/* Active - Tickbox */}
              <div className="pt-1">
                <label className="flex items-center gap-3 p-3 rounded-xl border border-slate-800 bg-[#0d1117]/60 cursor-pointer hover:border-slate-700 transition-all">
                  <input
                    type="checkbox"
                    checked={formData.active}
                    onChange={(e) => setFormData((prev) => ({ ...prev, active: e.target.checked }))}
                    className="h-5 w-5 rounded border-slate-700 bg-slate-800 text-blue-600 focus:ring-blue-500 cursor-pointer"
                  />
                  <div>
                    <span className="text-xs sm:text-sm font-semibold text-white block">
                      {lang === 'kh' ? 'សកម្ម (Active)' : 'Active'}
                    </span>
                    <span className="text-[11px] text-slate-400">
                      {lang === 'kh'
                        ? 'កំណត់ថាតើអត្រាតម្លៃនេះអាចប្រើប្រាស់បានក្នុងការគណនាដឹកជញ្ជូន'
                        : 'Enable or disable this shipment tariff for logistics calculation'}
                    </span>
                  </div>
                </label>
              </div>

              {/* Modal Actions */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="rounded-xl border border-slate-800 bg-slate-900/80 px-4 py-2.5 text-xs font-semibold text-slate-300 hover:bg-slate-800 hover:text-white transition-all"
                >
                  {lang === 'kh' ? 'បោះបង់' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 px-5 py-2.5 text-xs font-bold text-white shadow-lg shadow-blue-600/25 transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50"
                >
                  {saving ? (
                    <>
                      <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                      <span>{lang === 'kh' ? 'កំពុងរក្សាទុក...' : 'Saving...'}</span>
                    </>
                  ) : (
                    <>
                      <CheckIcon className="w-4 h-4" />
                      <span>{editingTariff ? (lang === 'kh' ? 'កែប្រែ' : 'Update Tariff') : (lang === 'kh' ? 'រក្សាទុក' : 'Save Tariff')}</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 5. Delete Confirmation Modal */}
      {deleteModalOpen && tariffToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-sm rounded-3xl border border-rose-500/30 bg-[#141922] p-6 shadow-2xl space-y-4 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400">
              <TrashIcon className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">
                {lang === 'kh' ? 'លុបអត្រាតម្លៃដឹកជញ្ជូន?' : 'Delete Shipment Tariff?'}
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                {lang === 'kh'
                  ? `តើអ្នកប្រាកដជាចង់លុប "${tariffToDelete.code} - ${tariffToDelete.description}" មែនទេ? សកម្មភាពនេះមិនអាចត្រឡប់វិញបានទេ។`
                  : `Are you sure you want to delete "${tariffToDelete.code} - ${tariffToDelete.description}"? This action cannot be undone.`}
              </p>
            </div>
            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  setDeleteModalOpen(false)
                  setTariffToDelete(null)
                }}
                className="rounded-xl border border-slate-800 bg-slate-900/80 px-4 py-2 text-xs font-semibold text-slate-300 hover:bg-slate-800 hover:text-white transition-all"
              >
                {lang === 'kh' ? 'បោះបង់' : 'Cancel'}
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={deleting}
                className="inline-flex items-center gap-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 px-4 py-2 text-xs font-bold text-white shadow-lg shadow-rose-600/25 transition-all disabled:opacity-50"
              >
                {deleting ? (
                  <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                ) : (
                  <TrashIcon className="w-4 h-4" />
                )}
                <span>{lang === 'kh' ? 'លុប' : 'Delete'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
