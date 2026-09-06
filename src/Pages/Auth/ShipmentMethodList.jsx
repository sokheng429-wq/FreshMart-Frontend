import React, { useState, useEffect, useMemo, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { useLanguage } from '../../context/LanguageContext'
import { useNotifications } from '../../context/NotificationContext'
import { adminShipmentMethodAPI, adminShipmentTariffAPI } from '../../api/api'
import { exportStyledExcel } from '../../utils/excelExport'
import travelIcon from '../../assets/icon/3dicons-travel-dynamic-color.png'
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

// Columns for Shipment Method Table
const ALL_METHOD_COLUMNS = [
  { key: 'code', label: { en: 'Code', kh: 'លេខកូដ' }, always: true },
  { key: 'description', label: { en: 'Description', kh: 'ការពិពណ៌នា' }, always: true },
  { key: 'secondLanguage', label: { en: 'Second Language', kh: 'ភាសាទីពីរ (ខ្មែរ)' } },
  { key: 'costProration', label: { en: 'Cost Proration', kh: 'វិធីបែងចែកថ្លៃដើម' } },
  { key: 'tariffs', label: { en: 'Tariffs', kh: 'អត្រាតម្លៃភ្ជាប់' } },
  { key: 'active', label: { en: 'Active', kh: 'ស្ថានភាព' } },
  { key: 'actions', label: { en: 'Actions', kh: 'សកម្មភាព' }, always: true },
]

const DEFAULT_METHOD_COLUMNS = ['code', 'description', 'secondLanguage', 'costProration', 'tariffs', 'active', 'actions']

// Columns for Sub-Modal Shipment Tariff Table
const ALL_TARIFF_COLUMNS = [
  { key: 'code', label: { en: 'Code', kh: 'លេខកូដ' }, always: true },
  { key: 'description', label: { en: 'Description', kh: 'ការពិពណ៌នា' }, always: true },
  { key: 'secondLanguage', label: { en: 'Second Language', kh: 'ភាសាទីពីរ' } },
  { key: 'active', label: { en: 'Active', kh: 'ស្ថានភាព' } },
]

const DEFAULT_TARIFF_COLUMNS = ['code', 'description', 'secondLanguage', 'active']

// Search By options for Shipment Method
const METHOD_SEARCH_BY_OPTIONS = [
  { value: 'Any', label: { en: 'Any', kh: 'ទាំងអស់' } },
  { value: 'Code', label: { en: 'Code', kh: 'លេខកូដ' } },
  { value: 'Description', label: { en: 'Description', kh: 'ការពិពណ៌នា' } },
  { value: 'Second Language', label: { en: 'Second Language', kh: 'ភាសាទីពីរ' } },
]

// Status options: Active - All - inactive
const STATUS_OPTIONS = [
  { value: 'all', label: { en: 'All', kh: 'ទាំងអស់' } },
  { value: 'active', label: { en: 'Active', kh: 'សកម្ម' } },
  { value: 'inactive', label: { en: 'Inactive', kh: 'អសកម្ម' } },
]

// Cost Proration Dropdown options: Value - Qty
const COST_PRORATION_OPTIONS = [
  { value: 'VALUE', label: { en: 'Value', kh: 'តាមតម្លៃទំនិញ (Value)' } },
  { value: 'QTY', label: { en: 'Qty', kh: 'តាមបរិមាណ (Qty)' } },
]

export default function ShipmentMethodList() {
  const { lang } = useLanguage()
  const { addNotification } = useNotifications()

  // Main methods state
  const [methods, setMethods] = useState([])
  const [loading, setLoading] = useState(true)

  // Search Shipment Method state
  // Search - Textbox
  // Search By - Dropdown - Any - Code - Description - Second Language
  // Status - Active - All - inactive
  const [searchText, setSearchText] = useState('')
  const [searchBy, setSearchBy] = useState('Any')
  const [statusFilter, setStatusFilter] = useState('all')

  const [appliedFilters, setAppliedFilters] = useState({
    search: '',
    searchBy: 'Any',
    status: 'all',
  })

  // Choose Column for Method Table
  const [chooseColumnOpen, setChooseColumnOpen] = useState(false)
  const [visibleColumns, setVisibleColumns] = useState(() => {
    try {
      const saved = localStorage.getItem('bg_shipment_method_columns')
      return saved ? JSON.parse(saved) : DEFAULT_METHOD_COLUMNS
    } catch {
      return DEFAULT_METHOD_COLUMNS
    }
  })

  // Create / Edit Modal State
  const [modalOpen, setModalOpen] = useState(false)
  const [editingMethod, setEditingMethod] = useState(null)
  const [generatingCode, setGeneratingCode] = useState(false)
  const [saving, setSaving] = useState(false)

  // Form Data
  // General Information:
  // Code - Auto Generate Code - Textbox
  // Cost Proration - Dropdown - Value - Qty
  // Active - Tickbox
  // Description* - Textbox
  // Second Language - Textbox
  // Shipment tariff information:
  // Attached tariffs list
  const [formData, setFormData] = useState({
    code: '',
    costProration: 'VALUE',
    active: true,
    description: '',
    secondLanguage: '',
    tariffs: [], // array of selected tariff objects
  })

  // Delete Confirmation Modal
  const [deleteModalOpen, setDeleteModalOpen] = useState(false)
  const [methodToDelete, setMethodToDelete] = useState(null)
  const [deleting, setDeleting] = useState(false)

  // --- Sub-Modal: Search Shipment Tariff (Add Button from Shipment tariff information) ---
  const [tariffPickerOpen, setTariffPickerOpen] = useState(false)
  const [pickerTariffs, setPickerTariffs] = useState([])
  const [pickerLoading, setPickerLoading] = useState(false)
  const [pickerSearch, setPickerSearch] = useState('')
  const [pickerSearchBy, setPickerSearchBy] = useState('Any')
  const [pickerSelectedIds, setPickerSelectedIds] = useState(new Set())
  const [pickerChooseColumnOpen, setPickerChooseColumnOpen] = useState(false)
  const [pickerVisibleColumns, setPickerVisibleColumns] = useState(DEFAULT_TARIFF_COLUMNS)

  // Sub-modal inline create tariff form
  const [quickCreateOpen, setQuickCreateOpen] = useState(false)
  const [quickTariffData, setQuickTariffData] = useState({
    code: '',
    description: '',
    secondLanguage: '',
    active: true,
  })
  const [quickCreating, setQuickCreating] = useState(false)

  // Toggle method table columns
  const toggleColumn = (key) => {
    setVisibleColumns((prev) => {
      const updated = prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
      try {
        localStorage.setItem('bg_shipment_method_columns', JSON.stringify(updated))
      } catch (err) {
        console.error(err)
      }
      return updated
    })
  }

  // Load methods from backend
  const loadMethods = useCallback(async (filters = appliedFilters) => {
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

      const res = await adminShipmentMethodAPI.getAll(params)
      if (res?.data && Array.isArray(res.data)) {
        setMethods(res.data)
      } else if (Array.isArray(res)) {
        setMethods(res)
      } else {
        setMethods([])
      }
    } catch (err) {
      console.error('Failed to load shipment methods:', err)
      addNotification?.('Failed to load shipment methods', 'error')
      setMethods([])
    } finally {
      setLoading(false)
    }
  }, [appliedFilters, addNotification])

  useEffect(() => {
    loadMethods()
  }, [loadMethods])

  // Handle Search Trigger
  const handleSearch = (e) => {
    if (e) e.preventDefault()
    const newFilters = {
      search: searchText,
      searchBy,
      status: statusFilter,
    }
    setAppliedFilters(newFilters)
    loadMethods(newFilters)
  }

  // Handle Reset Trigger
  const handleReset = () => {
    setSearchText('')
    setSearchBy('Any')
    setStatusFilter('all')
    const resetObj = {
      search: '',
      searchBy: 'Any',
      status: 'all',
    }
    setAppliedFilters(resetObj)
    loadMethods(resetObj)
  }

  // Generate next code for Shipment Method
  const fetchNextMethodCode = async () => {
    setGeneratingCode(true)
    try {
      const res = await adminShipmentMethodAPI.getNextCode()
      const code = res?.data?.code || res?.code || `SM-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-0001`
      setFormData((prev) => ({ ...prev, code }))
      return code
    } catch (err) {
      console.error('Failed to generate next code:', err)
      const fallback = `SM-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-0001`
      setFormData((prev) => ({ ...prev, code: fallback }))
      return fallback
    } finally {
      setGeneratingCode(false)
    }
  }

  // Open Create Modal
  const handleOpenCreate = async () => {
    setEditingMethod(null)
    setFormData({
      code: 'Loading...',
      costProration: 'VALUE',
      active: true,
      description: '',
      secondLanguage: '',
      tariffs: [],
    })
    setModalOpen(true)
    await fetchNextMethodCode()
  }

  // Open Edit Modal
  const handleOpenEdit = (method) => {
    setEditingMethod(method)
    setFormData({
      code: method.code || '',
      costProration: method.costProration || 'VALUE',
      active: method.active !== false,
      description: method.description || '',
      secondLanguage: method.secondLanguage || '',
      tariffs: method.tariffs || [],
    })
    setModalOpen(true)
  }

  // Save Method Form
  const handleSubmitMethod = async (e) => {
    e.preventDefault()
    if (!formData.description || !formData.description.trim()) {
      addNotification?.('Description is required (*)', 'error')
      return
    }

    setSaving(true)
    try {
      const payload = {
        code: formData.code,
        costProration: formData.costProration,
        active: Boolean(formData.active),
        description: formData.description.trim(),
        secondLanguage: formData.secondLanguage ? formData.secondLanguage.trim() : '',
        tariffIds: (formData.tariffs || []).map((t) => t.id),
      }

      if (editingMethod) {
        await adminShipmentMethodAPI.update(editingMethod.id, payload)
        addNotification?.('Shipment method updated successfully', 'success')
      } else {
        await adminShipmentMethodAPI.create(payload)
        addNotification?.('Shipment method created successfully', 'success')
      }

      setModalOpen(false)
      loadMethods()
    } catch (err) {
      console.error('Failed to save shipment method:', err)
      addNotification?.(err?.message || 'Failed to save shipment method', 'error')
    } finally {
      setSaving(false)
    }
  }

  // Toggle Status directly from table
  const handleToggleStatus = async (method) => {
    try {
      const newStatus = !method.active
      await adminShipmentMethodAPI.updateStatus(method.id, newStatus)
      setMethods((prev) =>
        prev.map((m) => (m.id === method.id ? { ...m, active: newStatus } : m))
      )
      addNotification?.(
        `Method ${method.code} marked as ${newStatus ? 'Active' : 'Inactive'}`,
        'success'
      )
    } catch (err) {
      console.error('Failed to toggle status:', err)
      addNotification?.('Failed to update status', 'error')
    }
  }

  // Delete handlers
  const handleOpenDelete = (method) => {
    setMethodToDelete(method)
    setDeleteModalOpen(true)
  }

  const handleConfirmDelete = async () => {
    if (!methodToDelete) return
    setDeleting(true)
    try {
      await adminShipmentMethodAPI.delete(methodToDelete.id)
      addNotification?.(`Shipment method ${methodToDelete.code} deleted`, 'success')
      setDeleteModalOpen(false)
      setMethodToDelete(null)
      loadMethods()
    } catch (err) {
      console.error('Failed to delete method:', err)
      addNotification?.('Failed to delete shipment method', 'error')
    } finally {
      setDeleting(false)
    }
  }

  // Export to Excel
  const handleExportExcel = () => {
    if (!methods.length) {
      addNotification?.('No shipment methods to export', 'warning')
      return
    }

    const headers = ['Code', 'Description', 'Second Language', 'Cost Proration', 'Tariffs Count', 'Status']
    const data = methods.map((m) => [
      m.code || '—',
      m.description || '—',
      m.secondLanguage || '—',
      m.costProration === 'QTY' ? 'Qty' : 'Value',
      (m.tariffs || []).length,
      m.active ? 'Active' : 'Inactive',
    ])

    const filename = `shipment_methods_${new Date().toISOString().slice(0, 10)}.xlsx`
    exportStyledExcel(headers, data, filename, 'Shipment Methods')
    addNotification?.('Exported shipment methods to Excel', 'success')
  }

  // --- Sub-Modal: Tariff Picker Handlers ---
  const loadPickerTariffs = async (search = pickerSearch, by = pickerSearchBy) => {
    setPickerLoading(true)
    try {
      const params = {}
      if (search && search.trim()) {
        params.search = search.trim()
        params.searchBy = by
      }
      const res = await adminShipmentTariffAPI.getAll(params)
      if (res?.data && Array.isArray(res.data)) {
        setPickerTariffs(res.data)
      } else if (Array.isArray(res)) {
        setPickerTariffs(res)
      } else {
        setPickerTariffs([])
      }
    } catch (err) {
      console.error('Failed to search tariffs in picker:', err)
      setPickerTariffs([])
    } finally {
      setPickerLoading(false)
    }
  }

  // Open Tariff Picker Sub-Modal
  const handleOpenTariffPicker = () => {
    setPickerSearch('')
    setPickerSearchBy('Any')
    const currentIds = new Set((formData.tariffs || []).map((t) => t.id))
    setPickerSelectedIds(currentIds)
    setQuickCreateOpen(false)
    setTariffPickerOpen(true)
    loadPickerTariffs('', 'Any')
  }

  // Toggle selection in picker
  const handleTogglePickerTariff = (tariffId) => {
    setPickerSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(tariffId)) {
        next.delete(tariffId)
      } else {
        next.add(tariffId)
      }
      return next
    })
  }

  // Confirm selection from picker (Ok button)
  const handleConfirmTariffPicker = () => {
    // Collect all tariffs currently matching pickerSelectedIds
    const selectedList = pickerTariffs.filter((t) => pickerSelectedIds.has(t.id))
    
    // Also retain any tariffs that were previously selected and kept
    const prevTariffsMap = new Map((formData.tariffs || []).map((t) => [t.id, t]))
    const combinedMap = new Map()

    pickerSelectedIds.forEach((id) => {
      const foundInPicker = selectedList.find((t) => t.id === id)
      if (foundInPicker) {
        combinedMap.set(id, foundInPicker)
      } else if (prevTariffsMap.has(id)) {
        combinedMap.set(id, prevTariffsMap.get(id))
      }
    })

    setFormData((prev) => ({ ...prev, tariffs: Array.from(combinedMap.values()) }))
    setTariffPickerOpen(false)
    addNotification?.(`Updated linked shipment tariffs (${combinedMap.size} selected)`, 'info')
  }

  // Remove a tariff from method form directly
  const handleRemoveTariffFromForm = (tariffId) => {
    setFormData((prev) => ({
      ...prev,
      tariffs: (prev.tariffs || []).filter((t) => t.id !== tariffId),
    }))
  }

  // Open Quick Create Tariff inside sub-modal
  const handleOpenQuickCreateTariff = async () => {
    try {
      const res = await adminShipmentTariffAPI.getNextCode()
      const code = res?.data?.code || res?.code || `ST-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-0001`
      setQuickTariffData({
        code,
        description: '',
        secondLanguage: '',
        active: true,
      })
      setQuickCreateOpen(true)
    } catch (err) {
      console.error(err)
      setQuickTariffData({
        code: `ST-${Date.now()}`,
        description: '',
        secondLanguage: '',
        active: true,
      })
      setQuickCreateOpen(true)
    }
  }

  // Submit Quick Create Tariff inside sub-modal
  const handleSubmitQuickTariff = async (e) => {
    e.preventDefault()
    if (!quickTariffData.description || !quickTariffData.description.trim()) {
      addNotification?.('Tariff description is required', 'error')
      return
    }
    setQuickCreating(true)
    try {
      const res = await adminShipmentTariffAPI.create({
        code: quickTariffData.code,
        description: quickTariffData.description.trim(),
        secondLanguage: quickTariffData.secondLanguage ? quickTariffData.secondLanguage.trim() : '',
        active: Boolean(quickTariffData.active),
      })
      const created = res?.data || res
      addNotification?.(`Created tariff ${created.code}`, 'success')
      setQuickCreateOpen(false)
      // Automatically add to picker list and select it!
      setPickerTariffs((prev) => [created, ...prev])
      setPickerSelectedIds((prev) => new Set([...prev, created.id]))
    } catch (err) {
      console.error('Failed to quick create tariff:', err)
      addNotification?.('Failed to create tariff', 'error')
    } finally {
      setQuickCreating(false)
    }
  }

  return (
    <div className="space-y-6 pb-12 text-slate-100">
      {/* Top Header / Breadcrumbs */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-400">
            <Link to="/admin/freight-management" className="hover:text-amber-400 transition-colors">
              {lang === 'kh' ? 'មជ្ឈមណ្ឌលគ្រប់គ្រងការដឹកជញ្ជូន' : 'Freight Management Hub'}
            </Link>
            <span>/</span>
            <span className="text-amber-400">
              {lang === 'kh' ? 'វិធីសាស្ត្រដឹកជញ្ជូន' : 'Shipment Method'}
            </span>
          </div>
          <div className="mt-1 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/10 border border-amber-500/20 shadow-sm">
              <img src={travelIcon} alt="Method" className="h-6 w-6 object-contain drop-shadow" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white">
                {lang === 'kh' ? 'វិធីសាស្ត្រដឹកជញ្ជូន' : 'Shipment Method'}
              </h1>
              <p className="text-xs sm:text-sm text-slate-400">
                {lang === 'kh'
                  ? 'គ្រប់គ្រងវិធីសាស្ត្រដឹកជញ្ជូន ការបែងចែកថ្លៃដើម និងអត្រាតម្លៃដឹកជញ្ជូនដែលពាក់ព័ន្ធ'
                  : 'Manage shipping methods, cost proration valuation, and linked shipment tariffs.'}
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

      {/* 1. Search Shipment Method Card */}
      <div className="rounded-3xl border border-slate-800/80 bg-[#141922]/90 p-5 sm:p-6 shadow-xl backdrop-blur-md">
        <div className="mb-4">
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <SearchIcon className="w-4 h-4 text-amber-400" />
            {lang === 'kh' ? 'ស្វែងរកវិធីសាស្ត្រដឹកជញ្ជូន' : 'Search Shipment Method'}
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            {lang === 'kh'
              ? 'ស្វែងរកវិធីសាស្ត្រដឹកជញ្ជូនតាមលក្ខខណ្ឌណាមួយ (ឧ. ទាំងអស់, លេខកូដ, ការពិពណ៌នា...)'
              : 'Search shipment method by any condition. Ex(Any, Code, Description...)'}
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
                    ? 'បញ្ចូលពាក្យស្វែងរក (ឧ. SM-2026, Cold-Chain, Motorbike)...'
                    : 'Search by any condition (e.g. SM-2026, Cold-Chain, Express)...'
                }
                className="w-full rounded-xl border border-slate-800 bg-[#0d1117] px-3.5 py-2.5 pl-9 text-xs sm:text-sm text-white placeholder-slate-500 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500 transition-all"
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

          {/* Search By - Dropdown - Any - Code - Description - Second Language */}
          <div className="lg:col-span-3 space-y-1.5">
            <label className="text-xs font-semibold text-slate-300">
              {lang === 'kh' ? 'ស្វែងរកតាម' : 'Search By'}
            </label>
            <select
              value={searchBy}
              onChange={(e) => setSearchBy(e.target.value)}
              className="w-full rounded-xl border border-slate-800 bg-[#0d1117] px-3.5 py-2.5 text-xs sm:text-sm text-white focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500 transition-all cursor-pointer"
            >
              {METHOD_SEARCH_BY_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value} className="bg-slate-900 text-white">
                  {lang === 'kh' ? opt.label.kh : opt.label.en}
                </option>
              ))}
            </select>
          </div>

          {/* Status - Active - All - inactive */}
          <div className="lg:col-span-2 space-y-1.5">
            <label className="text-xs font-semibold text-slate-300">
              {lang === 'kh' ? 'ស្ថានភាព' : 'Status'}
            </label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full rounded-xl border border-slate-800 bg-[#0d1117] px-3.5 py-2.5 text-xs sm:text-sm text-white focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500 transition-all cursor-pointer"
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
              className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-xl bg-amber-600 hover:bg-amber-500 px-3.5 py-2.5 text-xs font-bold text-white shadow-lg shadow-amber-600/25 transition-all hover:scale-[1.02] active:scale-[0.98]"
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

      {/* 2. Shipment Method List Section */}
      <div className="rounded-3xl border border-slate-800/80 bg-[#141922]/90 p-5 sm:p-6 shadow-xl backdrop-blur-md">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-5">
          <div>
            <div className="flex items-center gap-2.5">
              <h2 className="text-base sm:text-lg font-bold text-white">
                {lang === 'kh' ? 'បញ្ជីវិធីសាស្ត្រដឹកជញ្ជូន' : 'Shipment Method List'}
              </h2>
              <span className="rounded-full bg-amber-500/10 border border-amber-500/20 px-2.5 py-0.5 text-xs font-bold text-amber-400">
                {methods.length} {lang === 'kh' ? 'កំណត់ត្រា' : 'Items'}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              {lang === 'kh'
                ? 'បង្ហាញព័ត៌មានលម្អិតនៃវិធីសាស្ត្រដឹកជញ្ជូន'
                : 'Show information of shipment method'}
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
              <ColumnsIcon className="w-4 h-4 text-amber-400" />
              <span>{lang === 'kh' ? 'ជ្រើសរើសជួរឈរ' : 'Choose Column'}</span>
            </button>

            {/* Create Button */}
            <button
              type="button"
              onClick={handleOpenCreate}
              className="inline-flex items-center gap-1.5 rounded-xl bg-amber-600 hover:bg-amber-500 px-4 py-2 text-xs font-bold text-white shadow-lg shadow-amber-600/25 transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              <PlusIcon className="w-4 h-4" />
              <span>{lang === 'kh' ? '+ បង្កើតវិធីសាស្ត្រថ្មី' : '+ Create Shipment Method'}</span>
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
                {visibleColumns.includes('costProration') && (
                  <th className="px-4 py-3.5">{lang === 'kh' ? 'បែងចែកថ្លៃដើម' : 'Cost Proration'}</th>
                )}
                {visibleColumns.includes('tariffs') && (
                  <th className="px-4 py-3.5">{lang === 'kh' ? 'អត្រាតម្លៃ' : 'Tariffs'}</th>
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
                      <div className="h-7 w-7 animate-spin rounded-full border-2 border-amber-500 border-t-transparent" />
                      <span className="text-xs">{lang === 'kh' ? 'កំពុងផ្ទុកទិន្នន័យ...' : 'Loading shipment methods...'}</span>
                    </div>
                  </td>
                </tr>
              ) : methods.length === 0 ? (
                <tr>
                  <td colSpan={visibleColumns.length} className="py-12 text-center text-slate-400">
                    <div className="flex flex-col items-center justify-center gap-2 max-w-sm mx-auto">
                      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-800/60 border border-slate-700/50 text-slate-400">
                        <SearchIcon className="w-6 h-6" />
                      </div>
                      <p className="text-sm font-semibold text-slate-300">
                        {lang === 'kh' ? 'មិនមានទិន្នន័យវិធីសាស្ត្រដឹកជញ្ជូនទេ' : 'No shipment methods found'}
                      </p>
                      <p className="text-xs text-slate-500">
                        {appliedFilters.search || appliedFilters.status !== 'all'
                          ? lang === 'kh'
                            ? 'មិនមានទិន្នន័យត្រូវនឹងការស្វែងរករបស់អ្នកទេ។ សូមសាកល្បងកំណត់តម្រងឡើងវិញ។'
                            : 'No records match your search criteria. Try resetting your search filters.'
                          : lang === 'kh'
                          ? 'មិនទាន់មានវិធីសាស្ត្រដឹកជញ្ជូននៅឡើយទេ។ ចុចប៊ូតុងខាងក្រោមដើម្បីបង្កើត។'
                          : 'No shipment methods registered yet. Create your first method.'}
                      </p>
                      {appliedFilters.search || appliedFilters.status !== 'all' ? (
                        <button
                          type="button"
                          onClick={handleReset}
                          className="mt-2 text-xs font-semibold text-amber-400 hover:text-amber-300 underline"
                        >
                          {lang === 'kh' ? 'កំណត់តម្រងឡើងវិញ' : 'Reset Search Filters'}
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={handleOpenCreate}
                          className="mt-2 inline-flex items-center gap-1.5 rounded-xl bg-amber-600 hover:bg-amber-500 px-3.5 py-1.5 text-xs font-bold text-white shadow-md transition-all"
                        >
                          <PlusIcon className="w-3.5 h-3.5" />
                          <span>{lang === 'kh' ? 'បង្កើតវិធីសាស្ត្រដំបូង' : 'Create First Method'}</span>
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                methods.map((method) => (
                  <tr key={method.id} className="hover:bg-slate-800/30 transition-colors group">
                    {/* Code */}
                    {visibleColumns.includes('code') && (
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        <span className="font-mono text-xs font-bold text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2.5 py-1 rounded-lg">
                          {method.code}
                        </span>
                      </td>
                    )}

                    {/* Description */}
                    {visibleColumns.includes('description') && (
                      <td className="px-4 py-3.5 font-medium text-white">
                        {method.description || '—'}
                      </td>
                    )}

                    {/* Second Language */}
                    {visibleColumns.includes('secondLanguage') && (
                      <td className="px-4 py-3.5 text-slate-400">
                        {method.secondLanguage || <span className="text-slate-600">—</span>}
                      </td>
                    )}

                    {/* Cost Proration */}
                    {visibleColumns.includes('costProration') && (
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold uppercase font-mono border ${
                            method.costProration === 'QTY'
                              ? 'bg-purple-500/10 text-purple-400 border-purple-500/20'
                              : 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20'
                          }`}
                        >
                          {method.costProration === 'QTY' ? 'Qty' : 'Value'}
                        </span>
                      </td>
                    )}

                    {/* Tariffs badge */}
                    {visibleColumns.includes('tariffs') && (
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        {(method.tariffs || []).length > 0 ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-blue-500/10 border border-blue-500/20 px-2.5 py-0.5 text-xs text-blue-400 font-semibold">
                            <img src={dollarIcon} alt="" className="w-3 h-3" />
                            {method.tariffs.length} {lang === 'kh' ? 'អត្រា' : 'Tariff(s)'}
                          </span>
                        ) : (
                          <span className="text-slate-500 text-xs">—</span>
                        )}
                      </td>
                    )}

                    {/* Active */}
                    {visibleColumns.includes('active') && (
                      <td className="px-4 py-3.5 text-center whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => handleToggleStatus(method)}
                          title={lang === 'kh' ? 'ចុចដើម្បីប្តូរស្ថានភាព' : 'Click to toggle status'}
                          className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-bold transition-all cursor-pointer hover:scale-105 ${
                            method.active
                              ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/25'
                              : 'bg-slate-800 text-slate-400 border border-slate-700 hover:bg-slate-700'
                          }`}
                        >
                          <span
                            className={`h-1.5 w-1.5 rounded-full ${
                              method.active ? 'bg-emerald-400' : 'bg-slate-500'
                            }`}
                          />
                          {method.active
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
                            onClick={() => handleOpenEdit(method)}
                            title={lang === 'kh' ? 'កែប្រែ' : 'Edit'}
                            className="rounded-lg p-1.5 text-slate-400 hover:bg-amber-500/10 hover:text-amber-400 transition-colors"
                          >
                            <EditIcon className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleOpenDelete(method)}
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

      {/* 3. Choose Column Modal for Method Table */}
      {chooseColumnOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-md rounded-3xl border border-slate-800 bg-[#141922] p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <ColumnsIcon className="w-4 h-4 text-amber-400" />
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
              {ALL_METHOD_COLUMNS.map((col) => {
                const isChecked = visibleColumns.includes(col.key)
                const isMandatory = col.always
                return (
                  <label
                    key={col.key}
                    className={`flex items-center justify-between p-2.5 rounded-xl border transition-all cursor-pointer ${
                      isChecked
                        ? 'border-amber-500/30 bg-amber-500/10 text-white'
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
                      className="h-4 w-4 rounded border-slate-700 bg-slate-800 text-amber-600 focus:ring-amber-500 disabled:opacity-50 cursor-pointer"
                    />
                  </label>
                )
              })}
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setVisibleColumns(DEFAULT_METHOD_COLUMNS)}
                className="text-xs font-semibold text-slate-400 hover:text-white transition-colors"
              >
                {lang === 'kh' ? 'កំណត់លំនាំដើមឡើងវិញ' : 'Reset to Default'}
              </button>
              <button
                type="button"
                onClick={() => setChooseColumnOpen(false)}
                className="rounded-xl bg-amber-600 hover:bg-amber-500 px-4 py-2 text-xs font-bold text-white shadow-md transition-all"
              >
                {lang === 'kh' ? 'រួចរាល់' : 'Done'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 4. Create / Edit Shipment Method Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-2xl rounded-3xl border border-slate-800 bg-[#141922] p-6 sm:p-7 shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div>
                <h3 className="text-lg font-bold text-white">
                  {editingMethod
                    ? lang === 'kh'
                      ? 'កែប្រែវិធីសាស្ត្រដឹកជញ្ជូន'
                      : 'Edit Shipment Method'
                    : lang === 'kh'
                    ? 'បង្កើតវិធីសាស្ត្រដឹកជញ្ជូនថ្មី'
                    : 'Create Shipment Method'}
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  {lang === 'kh'
                    ? 'កំណត់វិធីសាស្ត្រដឹកជញ្ជូន ការបែងចែកថ្លៃដើម និងអត្រាតម្លៃដឹកជញ្ជូន'
                    : 'Configure shipment method information and attached tariff rate structures'}
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

            <form onSubmit={handleSubmitMethod} className="space-y-6">
              {/* SECTION 1: General Information */}
              <div className="space-y-4">
                <div className="rounded-2xl border border-amber-500/20 bg-amber-500/5 p-4">
                  <h4 className="text-sm font-bold text-amber-400 flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-amber-400" />
                    {lang === 'kh' ? 'ព័ត៌មានទូទៅ' : 'General Information'}
                  </h4>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {lang === 'kh'
                      ? 'បញ្ចូលព័ត៌មានទូទៅនៃវិធីសាស្ត្រដឹកជញ្ជូន'
                      : 'Input the general shipment method information'}
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Code - Auto Generate Code - Textbox */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-semibold text-slate-300">
                        {lang === 'kh' ? 'លេខកូដ' : 'Code'}
                      </label>
                      {!editingMethod && (
                        <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full">
                          {lang === 'kh' ? 'កូដស្វ័យប្រវត្តិ' : 'Auto Generate Code'}
                        </span>
                      )}
                    </div>
                    <div className="relative flex items-center">
                      <input
                        type="text"
                        value={formData.code}
                        onChange={(e) => setFormData((prev) => ({ ...prev, code: e.target.value }))}
                        placeholder="Auto Generate Code..."
                        className="w-full rounded-xl border border-slate-800 bg-[#0d1117] px-3.5 py-2.5 text-xs sm:text-sm text-white font-mono placeholder-slate-500 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500 transition-all pr-10"
                      />
                      {!editingMethod && (
                        <button
                          type="button"
                          onClick={fetchNextMethodCode}
                          disabled={generatingCode}
                          title={lang === 'kh' ? 'បង្កើតកូដថ្មីឡើងវិញ' : 'Regenerate Code'}
                          className="absolute right-2 p-1.5 text-slate-400 hover:text-amber-400 disabled:opacity-50 transition-colors"
                        >
                          <RefreshIcon className={`w-4 h-4 ${generatingCode ? 'animate-spin' : ''}`} />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Cost Proration - Dropdown - Value - Qty */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-300">
                      {lang === 'kh' ? 'ការបែងចែកថ្លៃដើម (Cost Proration)' : 'Cost Proration'}
                    </label>
                    <select
                      value={formData.costProration}
                      onChange={(e) => setFormData((prev) => ({ ...prev, costProration: e.target.value }))}
                      className="w-full rounded-xl border border-slate-800 bg-[#0d1117] px-3.5 py-2.5 text-xs sm:text-sm text-white focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500 transition-all cursor-pointer"
                    >
                      {COST_PRORATION_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value} className="bg-slate-900 text-white">
                          {lang === 'kh' ? opt.label.kh : opt.label.en}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Description* - Textbox */}
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
                        ? 'ឧ. រថយន្តដឹកទំនិញក្លាសេត្រជាក់ - Cold Chain Road'
                        : 'Ex: Cold-Chain Truck Logistics / Express Motorbike'
                    }
                    className="w-full rounded-xl border border-slate-800 bg-[#0d1117] px-3.5 py-2.5 text-xs sm:text-sm text-white placeholder-slate-500 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500 transition-all"
                  />
                </div>

                {/* Second Language - Textbox */}
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
                        : 'Khmer description or alternate title...'
                    }
                    className="w-full rounded-xl border border-slate-800 bg-[#0d1117] px-3.5 py-2.5 text-xs sm:text-sm text-white placeholder-slate-500 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500 transition-all"
                  />
                </div>

                {/* Active - Tickbox */}
                <div className="pt-1">
                  <label className="flex items-center gap-3 p-3 rounded-xl border border-slate-800 bg-[#0d1117]/60 cursor-pointer hover:border-slate-700 transition-all">
                    <input
                      type="checkbox"
                      checked={formData.active}
                      onChange={(e) => setFormData((prev) => ({ ...prev, active: e.target.checked }))}
                      className="h-5 w-5 rounded border-slate-700 bg-slate-800 text-amber-600 focus:ring-amber-500 cursor-pointer"
                    />
                    <div>
                      <span className="text-xs sm:text-sm font-semibold text-white block">
                        {lang === 'kh' ? 'សកម្ម (Active)' : 'Active'}
                      </span>
                      <span className="text-[11px] text-slate-400">
                        {lang === 'kh'
                          ? 'បើកដំណើរការវិធីសាស្ត្រដឹកជញ្ជូននេះក្នុងប្រតិបត្តិការ'
                          : 'Enable this shipping method for purchase order logistics'}
                      </span>
                    </div>
                  </label>
                </div>
              </div>

              {/* SECTION 2: Shipment tariff information */}
              <div className="space-y-4 pt-2 border-t border-slate-800">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 rounded-2xl border border-blue-500/20 bg-blue-500/5 p-4">
                  <div>
                    <h4 className="text-sm font-bold text-blue-400 flex items-center gap-2">
                      <img src={dollarIcon} alt="" className="w-4 h-4" />
                      {lang === 'kh' ? 'ព័ត៌មានអត្រាតម្លៃដឹកជញ្ជូន' : 'Shipment tariff information'}
                    </h4>
                    <p className="text-xs text-slate-400 mt-0.5">
                      {lang === 'kh'
                        ? 'ប្រភេទនៃអត្រាតម្លៃដឹកជញ្ជូនដែលយើងជ្រើសរើស កំណត់ពីរបៀបដែលយើងគ្រប់គ្រងវិធីសាស្ត្រដឹកជញ្ជូន'
                        : 'The type of shipment tariff we choose determines how we manage shipment method'}
                    </p>
                  </div>
                  {/* Add Button connected to Shipment Tariff */}
                  <button
                    type="button"
                    onClick={handleOpenTariffPicker}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 px-3.5 py-2 text-xs font-bold text-white shadow-md shadow-blue-600/20 transition-all hover:scale-105 active:scale-95 shrink-0"
                  >
                    <PlusIcon className="w-3.5 h-3.5" />
                    <span>{lang === 'kh' ? '+ បន្ថែមអត្រាតម្លៃ' : '+ Add Tariff'}</span>
                  </button>
                </div>

                {/* Table of selected tariffs */}
                <div className="overflow-x-auto rounded-xl border border-slate-800 bg-[#0d1117]/60">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-slate-800 bg-slate-900/60 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                        <th className="px-3.5 py-2.5">{lang === 'kh' ? 'លេខកូដ' : 'Code'}</th>
                        <th className="px-3.5 py-2.5">{lang === 'kh' ? 'ការពិពណ៌នា' : 'Description'}</th>
                        <th className="px-3.5 py-2.5">{lang === 'kh' ? 'ភាសាទីពីរ' : 'Second Language'}</th>
                        <th className="px-3.5 py-2.5">{lang === 'kh' ? 'អ្នកផ្គត់ផ្គង់' : 'Supplier'}</th>
                        <th className="px-3.5 py-2.5 text-right">{lang === 'kh' ? 'ដកចេញ' : 'Remove'}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60">
                      {formData.tariffs && formData.tariffs.length > 0 ? (
                        formData.tariffs.map((t) => (
                          <tr key={t.id} className="hover:bg-slate-800/30">
                            <td className="px-3.5 py-2 font-mono text-blue-400 font-bold whitespace-nowrap">
                              {t.code}
                            </td>
                            <td className="px-3.5 py-2 text-white font-medium">{t.description || '—'}</td>
                            <td className="px-3.5 py-2 text-slate-400">{t.secondLanguage || '—'}</td>
                            <td className="px-3.5 py-2 text-slate-400">{t.supplier || '—'}</td>
                            <td className="px-3.5 py-2 text-right">
                              <button
                                type="button"
                                onClick={() => handleRemoveTariffFromForm(t.id)}
                                className="text-slate-400 hover:text-rose-400 p-1 transition-colors"
                                title="Remove tariff"
                              >
                                <XMarkIcon className="w-4 h-4" />
                              </button>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={5} className="py-6 text-center text-slate-500 text-xs">
                            {lang === 'kh'
                              ? 'មិនទាន់មានអត្រាតម្លៃដឹកជញ្ជូនត្រូវបានភ្ជាប់នៅឡើយទេ។ សូមចុច "+ បន្ថែមអត្រាតម្លៃ" ខាងលើ។'
                              : 'No shipment tariffs linked yet. Click "+ Add Tariff" above to connect tariffs.'}
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
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
                  className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-amber-600 hover:bg-amber-500 px-5 py-2.5 text-xs font-bold text-white shadow-lg shadow-amber-600/25 transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50"
                >
                  {saving ? (
                    <>
                      <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                      <span>{lang === 'kh' ? 'កំពុងរក្សាទុក...' : 'Saving...'}</span>
                    </>
                  ) : (
                    <>
                      <CheckIcon className="w-4 h-4" />
                      <span>
                        {editingMethod
                          ? lang === 'kh'
                            ? 'កែប្រែវិធីសាស្ត្រ'
                            : 'Update Method'
                          : lang === 'kh'
                          ? 'រក្សាទុកវិធីសាស្ត្រ'
                          : 'Save Method'}
                      </span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 5. Sub-Modal: Search Shipment Tariff (Add Button from Shipment Tariff Information) */}
      {tariffPickerOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
          <div className="w-full max-w-3xl rounded-3xl border border-slate-800 bg-[#141922] p-6 sm:p-7 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div>
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <SearchIcon className="w-5 h-5 text-blue-400" />
                  {lang === 'kh' ? 'ស្វែងរកអត្រាតម្លៃដឹកជញ្ជូន' : 'Search Shipment Tariff'}
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  {lang === 'kh'
                    ? 'ស្វែងរកអត្រាតម្លៃដឹកជញ្ជូនតាមលក្ខខណ្ឌណាមួយ (ឧ. ទាំងអស់, លេខកូដ, ការពិពណ៌នា...)'
                    : 'Search shipment tariff by any condition . Ex(Any, Code, Description...)'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setTariffPickerOpen(false)}
                className="rounded-xl p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
              >
                <XMarkIcon className="w-5 h-5" />
              </button>
            </div>

            {/* Search Controls in Sub-Modal */}
            <div className="rounded-2xl border border-slate-800 bg-[#0d1117]/60 p-4 space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end">
                {/* Search - textbox */}
                <div className="sm:col-span-6 space-y-1">
                  <label className="text-xs font-semibold text-slate-300">
                    {lang === 'kh' ? 'ស្វែងរក' : 'Search'}
                  </label>
                  <input
                    type="text"
                    value={pickerSearch}
                    onChange={(e) => setPickerSearch(e.target.value)}
                    placeholder="Search Code, Description..."
                    className="w-full rounded-xl border border-slate-800 bg-[#141922] px-3 py-2 text-xs text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none"
                  />
                </div>

                {/* Search By - Dropdown - any - code - description - Second Language */}
                <div className="sm:col-span-4 space-y-1">
                  <label className="text-xs font-semibold text-slate-300">
                    {lang === 'kh' ? 'ស្វែងរកតាម' : 'Search By'}
                  </label>
                  <select
                    value={pickerSearchBy}
                    onChange={(e) => setPickerSearchBy(e.target.value)}
                    className="w-full rounded-xl border border-slate-800 bg-[#141922] px-3 py-2 text-xs text-white focus:border-blue-500 focus:outline-none cursor-pointer"
                  >
                    <option value="Any">Any</option>
                    <option value="Code">Code</option>
                    <option value="Description">Description</option>
                    <option value="Second Language">Second Language</option>
                  </select>
                </div>

                {/* Search button */}
                <div className="sm:col-span-2 flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => loadPickerTariffs(pickerSearch, pickerSearchBy)}
                    className="w-full inline-flex items-center justify-center gap-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 px-3 py-2 text-xs font-bold text-white shadow transition-all"
                  >
                    <SearchIcon className="w-3.5 h-3.5" />
                    <span>{lang === 'kh' ? 'ស្វែងរក' : 'Search'}</span>
                  </button>
                </div>
              </div>

              {/* Sub-modal helper toolbar: Choose Column & Quick Create */}
              <div className="flex items-center justify-between pt-2 border-t border-slate-800/80">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setPickerChooseColumnOpen((p) => !p)}
                    className="text-[11px] font-semibold text-slate-400 hover:text-white flex items-center gap-1"
                  >
                    <ColumnsIcon className="w-3.5 h-3.5" />
                    <span>{lang === 'kh' ? 'ជ្រើសរើសជួរឈរ' : 'Choose Column'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setPickerSearch('')
                      setPickerSearchBy('Any')
                      loadPickerTariffs('', 'Any')
                    }}
                    className="text-[11px] font-semibold text-slate-400 hover:text-white flex items-center gap-1 ml-2"
                  >
                    <RefreshIcon className="w-3 h-3" />
                    <span>{lang === 'kh' ? 'កំណត់ឡើងវិញ' : 'Reset'}</span>
                  </button>
                </div>

                {/* Create button */}
                <button
                  type="button"
                  onClick={handleOpenQuickCreateTariff}
                  className="inline-flex items-center gap-1 text-xs font-bold text-emerald-400 hover:text-emerald-300"
                >
                  <PlusIcon className="w-3.5 h-3.5" />
                  <span>{lang === 'kh' ? '+ បង្កើតអត្រាថ្មី' : '+ Create Tariff'}</span>
                </button>
              </div>

              {/* Choose Column inline drawer for sub-modal */}
              {pickerChooseColumnOpen && (
                <div className="flex items-center gap-4 p-2.5 rounded-xl bg-slate-900/90 border border-slate-800 text-xs">
                  <span className="text-slate-400 font-medium">Display columns:</span>
                  {ALL_TARIFF_COLUMNS.map((col) => (
                    <label key={col.key} className="inline-flex items-center gap-1.5 cursor-pointer text-slate-300">
                      <input
                        type="checkbox"
                        checked={pickerVisibleColumns.includes(col.key)}
                        disabled={col.always}
                        onChange={() => {
                          setPickerVisibleColumns((prev) =>
                            prev.includes(col.key) ? prev.filter((k) => k !== col.key) : [...prev, col.key]
                          )
                        }}
                        className="rounded border-slate-700 bg-slate-800 text-blue-500"
                      />
                      <span>{col.label.en}</span>
                    </label>
                  ))}
                </div>
              )}

              {/* Inline Quick Create Tariff Form if triggered */}
              {quickCreateOpen && (
                <form onSubmit={handleSubmitQuickTariff} className="p-3.5 rounded-2xl border border-emerald-500/30 bg-emerald-500/5 space-y-3 animate-fadeIn">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-emerald-400">Quick Create Shipment Tariff</span>
                    <button type="button" onClick={() => setQuickCreateOpen(false)} className="text-slate-400 hover:text-white">
                      <XMarkIcon className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="text-[11px] text-slate-300 block mb-1">Code</label>
                      <input
                        type="text"
                        value={quickTariffData.code}
                        readOnly
                        className="w-full rounded-lg border border-slate-800 bg-slate-900 px-2.5 py-1.5 text-xs text-white font-mono"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] text-slate-300 block mb-1">Description *</label>
                      <input
                        type="text"
                        required
                        value={quickTariffData.description}
                        onChange={(e) => setQuickTariffData((prev) => ({ ...prev, description: e.target.value }))}
                        placeholder="Tariff name..."
                        className="w-full rounded-lg border border-slate-800 bg-slate-900 px-2.5 py-1.5 text-xs text-white"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] text-slate-300 block mb-1">Second Language</label>
                      <input
                        type="text"
                        value={quickTariffData.secondLanguage}
                        onChange={(e) => setQuickTariffData((prev) => ({ ...prev, secondLanguage: e.target.value }))}
                        placeholder="Khmer..."
                        className="w-full rounded-lg border border-slate-800 bg-slate-900 px-2.5 py-1.5 text-xs text-white"
                      />
                    </div>
                  </div>
                  <div className="flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setQuickCreateOpen(false)}
                      className="px-3 py-1 text-xs text-slate-400 hover:text-white"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={quickCreating}
                      className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-xs font-bold text-white rounded-lg"
                    >
                      {quickCreating ? 'Saving...' : 'Create & Select'}
                    </button>
                  </div>
                </form>
              )}
            </div>

            {/* Shipment Tariff List in Sub-Modal */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300">
                  {lang === 'kh' ? 'បញ្ជីអត្រាតម្លៃដឹកជញ្ជូន' : 'Shipment Tariff List'}
                </h4>
                <span className="text-xs text-slate-400">
                  {pickerSelectedIds.size} {lang === 'kh' ? 'បានជ្រើសរើស' : 'Selected'}
                </span>
              </div>
              <p className="text-[11px] text-slate-400 mb-2">
                {lang === 'kh' ? 'បង្ហាញព័ត៌មាននៃអត្រាតម្លៃដឹកជញ្ជូន' : 'Show information of shipment tariff'}
              </p>

              <div className="overflow-x-auto rounded-xl border border-slate-800 bg-[#0d1117]/60 max-h-60 overflow-y-auto">
                <table className="w-full text-left text-xs">
                  <thead className="sticky top-0 bg-slate-900 border-b border-slate-800 text-[11px] font-bold text-slate-400">
                    <tr>
                      <th className="px-3 py-2.5 w-10 text-center">Select</th>
                      {pickerVisibleColumns.includes('code') && <th className="px-3 py-2.5">Code</th>}
                      {pickerVisibleColumns.includes('description') && <th className="px-3 py-2.5">Description</th>}
                      {pickerVisibleColumns.includes('secondLanguage') && <th className="px-3 py-2.5">Second Language</th>}
                      {pickerVisibleColumns.includes('active') && <th className="px-3 py-2.5 text-center">Active</th>}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {pickerLoading ? (
                      <tr>
                        <td colSpan={5} className="py-8 text-center text-slate-400">
                          <div className="flex items-center justify-center gap-2">
                            <div className="h-5 w-5 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />
                            <span>Loading tariffs...</span>
                          </div>
                        </td>
                      </tr>
                    ) : pickerTariffs.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="py-8 text-center text-slate-500">
                          No shipment tariffs found. Try searching or click "+ Create Tariff".
                        </td>
                      </tr>
                    ) : (
                      pickerTariffs.map((t) => {
                        const isSelected = pickerSelectedIds.has(t.id)
                        return (
                          <tr
                            key={t.id}
                            onClick={() => handleTogglePickerTariff(t.id)}
                            className={`cursor-pointer transition-colors ${
                              isSelected ? 'bg-blue-500/10' : 'hover:bg-slate-800/30'
                            }`}
                          >
                            <td className="px-3 py-2 text-center" onClick={(e) => e.stopPropagation()}>
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={() => handleTogglePickerTariff(t.id)}
                                className="h-4 w-4 rounded border-slate-700 bg-slate-800 text-blue-600 cursor-pointer"
                              />
                            </td>
                            {pickerVisibleColumns.includes('code') && (
                              <td className="px-3 py-2 font-mono font-bold text-blue-400 whitespace-nowrap">
                                {t.code}
                              </td>
                            )}
                            {pickerVisibleColumns.includes('description') && (
                              <td className="px-3 py-2 text-white font-medium">{t.description || '—'}</td>
                            )}
                            {pickerVisibleColumns.includes('secondLanguage') && (
                              <td className="px-3 py-2 text-slate-400">{t.secondLanguage || '—'}</td>
                            )}
                            {pickerVisibleColumns.includes('active') && (
                              <td className="px-3 py-2 text-center whitespace-nowrap">
                                <span
                                  className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                    t.active
                                      ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                                      : 'bg-slate-800 text-slate-400'
                                  }`}
                                >
                                  {t.active ? 'Active' : 'Inactive'}
                                </span>
                              </td>
                            )}
                          </tr>
                        )
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Sub-modal Action Buttons: Cancel and Ok */}
            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setTariffPickerOpen(false)}
                className="rounded-xl border border-slate-800 bg-slate-900/80 px-4 py-2 text-xs font-semibold text-slate-300 hover:bg-slate-800 hover:text-white transition-all"
              >
                {lang === 'kh' ? 'បោះបង់' : 'Cancel'}
              </button>
              <button
                type="button"
                onClick={handleConfirmTariffPicker}
                className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 px-5 py-2 text-xs font-bold text-white shadow-lg shadow-blue-600/25 transition-all hover:scale-105 active:scale-95"
              >
                <CheckIcon className="w-4 h-4" />
                <span>{lang === 'kh' ? 'យល់ព្រម (Ok)' : 'Ok'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 6. Delete Confirmation Modal */}
      {deleteModalOpen && methodToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-sm rounded-3xl border border-rose-500/30 bg-[#141922] p-6 shadow-2xl space-y-4 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400">
              <TrashIcon className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">
                {lang === 'kh' ? 'លុបវិធីសាស្ត្រដឹកជញ្ជូន?' : 'Delete Shipment Method?'}
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                {lang === 'kh'
                  ? `តើអ្នកប្រាកដជាចង់លុប "${methodToDelete.code} - ${methodToDelete.description}" មែនទេ? សកម្មភាពនេះមិនអាចត្រឡប់វិញបានទេ។`
                  : `Are you sure you want to delete "${methodToDelete.code} - ${methodToDelete.description}"? This action cannot be undone.`}
              </p>
            </div>
            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  setDeleteModalOpen(false)
                  setMethodToDelete(null)
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
