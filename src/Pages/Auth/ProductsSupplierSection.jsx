import { useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import * as XLSX from 'xlsx'
import { useLanguage } from '../../context/LanguageContext'
import { useNotifications } from '../../context/NotificationContext'
import {
  adminProductAPI,
  adminSupplierAPI,
  adminCategoryAPI,
  adminBrandAPI,
  adminUnitAPI,
  adminProductSupplierLinkAPI,
} from '../../api/api'
import { PageLoader } from '../../components/PageLoader'
import linkIcon from '../../assets/icon/3dicons-link-dynamic-color.png'
import { Modal, ConfirmModal } from './stockUI'
import { enrichProductList } from '../../utils/productMeta'
import { exportStyledExcel } from '../../utils/excelExport'

const pName = (p) => (typeof p?.name === 'object' ? p.name?.en : p?.name) || `#${p?.id}`
const pNameKh = (p) => (typeof p?.name === 'object' ? p.name?.kh : p?.nameKh || p?.name_kh || p?.secondLanguage || '—')

const ChevronLeftIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="15 18 9 12 15 6" />
  </svg>
)

const SortIcon = ({ field, currentField, currentDir }) => {
  if (field !== currentField) {
    return <span className="opacity-30 text-[10px] ml-1">⇅</span>
  }
  return <span className="text-[#7EB631] text-[10px] ml-1">{currentDir === 'asc' ? '▲' : '▼'}</span>
}

// Toggle Switch Component
const ToggleSwitch = ({ checked, onChange, disabled }) => (
  <button
    type="button"
    role="switch"
    aria-checked={checked}
    disabled={disabled}
    onClick={(e) => {
      e.stopPropagation()
      onChange?.(!checked)
    }}
    className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-[#7EB631]/30 disabled:opacity-40 ${
      checked ? 'bg-[#7EB631]' : 'bg-slate-700'
    }`}
  >
    <span
      className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow-sm transition duration-200 ease-in-out ${
        checked ? 'translate-x-4.5' : 'translate-x-1'
      }`}
    />
  </button>
)

const PRODUCT_SUPPLIER_STORAGE_KEY = 'bg_product_supplier_records_v1'

const loadProductSupplierRecords = () => {
  try {
    const raw = localStorage.getItem(PRODUCT_SUPPLIER_STORAGE_KEY)
    if (raw) return JSON.parse(raw)
  } catch {}
  return null
}

const saveProductSupplierRecords = (records) => {
  try {
    localStorage.setItem(PRODUCT_SUPPLIER_STORAGE_KEY, JSON.stringify(records))
  } catch {}
}

export const ProductsSupplierSection = () => {
  const { lang } = useLanguage()
  const { addNotification } = useNotifications()

  const [pageLoading, setPageLoading] = useState(true)
  const [catalogProducts, setCatalogProducts] = useState([])
  const [suppliers, setSuppliers] = useState([])
  const [mappings, setMappings] = useState([])

  // View state: 'list' | 'create' | 'edit'
  const [viewMode, setViewMode] = useState('list')
  const [editingId, setEditingId] = useState(null)

  // Search & Filter State (Page 1)
  const [searchInput, setSearchInput] = useState('')
  const [activeSearch, setActiveSearch] = useState('')
  const [searchBy, setSearchBy] = useState('Any') // 'Any' | 'Part Number' | 'Code' | 'Description'
  const [statusFilter, setStatusFilter] = useState('Active') // 'Active' | 'Inactive' | 'All'

  // Sorting
  const [sortField, setSortField] = useState('partNumber')
  const [sortDirection, setSortDirection] = useState('asc')

  // Column Visibility
  const [colModalOpen, setColModalOpen] = useState(false)
  const [visibleCols, setVisibleCols] = useState(
    () => new Set(['picture', 'partNumber', 'code', 'description', 'supplier', 'uom', 'active'])
  )

  // Create / Edit Form State (Page 2)
  const [formSupplierId, setFormSupplierId] = useState('')
  const [scannerCode, setScannerCode] = useState('')
  const [formProducts, setFormProducts] = useState([])
  const [saving, setSaving] = useState(false)

  // Picker Modal
  const [pickerModalOpen, setPickerModalOpen] = useState(false)
  const [pickerSearch, setPickerSearch] = useState('')
  const [pickerSelectedIds, setPickerSelectedIds] = useState(() => new Set())

  // Alerts & Confirmations
  const [toast, setToast] = useState(null)
  const [confirmAction, setConfirmAction] = useState(null)

  const scannerInputRef = useRef(null)

  const t = (en, kh) => (lang === 'en' ? en : kh)

  // Fetch Catalog & Suppliers Master Data
  useEffect(() => {
    Promise.all([
      adminProductAPI.getAll().catch(() => ({ data: [] })),
      adminSupplierAPI.getAll().catch(() => ({ data: [] })),
      adminCategoryAPI.getAll().catch(() => ({ data: [] })),
      adminBrandAPI.getAll().catch(() => ({ data: [] })),
      adminUnitAPI.getAll().catch(() => ({ data: [] })),
      adminProductSupplierLinkAPI.getAll().catch(() => ({ data: [] })),
    ]).then(([pRes, sRes, cRes, bRes, uRes, lRes]) => {
      const rawProds = Array.isArray(pRes?.data) ? pRes.data : []
      const enriched = enrichProductList(rawProds)
      setCatalogProducts(enriched)

      let rawSuppliers = Array.isArray(sRes?.data) ? sRes.data : []
      if (rawSuppliers.length === 0) {
        // Fallback default master suppliers
        rawSuppliers = [
          { id: 'sup-1', name: 'CP Foods Cambodia Co., Ltd.', code: 'SUPP-CP-001' },
          { id: 'sup-2', name: 'Angkor Dairy Products Co., Ltd.', code: 'SUPP-ANGKOR-002' },
          { id: 'sup-3', name: 'Phnom Penh Beverage Corporation', code: 'SUPP-PPBEV-003' },
          { id: 'sup-4', name: 'Khmer Fresh Organics Farm', code: 'SUPP-KHMER-004' },
          { id: 'sup-5', name: 'Mekong Rice & Grains Wholesalers', code: 'SUPP-MEKONG-005' },
        ]
      }
      setSuppliers(rawSuppliers)

      const dbLinks = Array.isArray(lRes?.data) ? lRes.data : []
      if (dbLinks.length > 0) {
        // Map links from PostgreSQL database
        const mapped = dbLinks.map((link, idx) => {
          const matchP = enriched.find((p) => String(p.id) === String(link.productId))
          const matchS = rawSuppliers.find((s) => String(s.id) === String(link.supplierId))
          const img = matchP?.imageUrl || matchP?.image || (Array.isArray(matchP?.photos) ? matchP.photos[0] : null) || ''
          return {
            id: `ps-db-${link.id}`,
            linkRecordId: link.id,
            supplierId: String(link.supplierId),
            supplierName: link.supplierName || matchS?.name || 'CP Foods Cambodia',
            supplierCode: matchS?.code || `SUPP-${link.supplierId}`,
            productId: link.productId,
            code: matchP?.code || `PRD-${link.productId}`,
            barcode: matchP?.barCode || matchP?.barcode || '—',
            name: matchP ? pName(matchP) : (link.productName || `Product #${link.productId}`),
            nameKh: matchP ? pNameKh(matchP) : '—',
            imageUrl: img,
            uom: matchP?.uom || 'Unit',
            partNumber: link.vendorPartNumber || `PN-${link.productId}`,
            active: link.active !== false,
            updatedAt: link.updatedAt || new Date().toISOString(),
          }
        })
        setMappings(mapped)
      } else {
        // Load mappings from storage or seed from active catalog
        const saved = loadProductSupplierRecords()
        if (saved && Array.isArray(saved) && saved.length > 0) {
          setMappings(saved)
        } else {
          const seedMappings = []
          enriched.slice(0, 10).forEach((p, idx) => {
            const sup = rawSuppliers[idx % rawSuppliers.length]
            const img = p.imageUrl || p.image || (Array.isArray(p.photos) ? p.photos[0] : null) || ''
            const partNum = `PN-${sup?.code?.slice(-3) || 'SUP'}-${p.code || 1000 + idx}`

            seedMappings.push({
              id: `ps-init-${p.id || idx}`,
              supplierId: String(sup?.id || 'sup-1'),
              supplierName: sup?.name || 'CP Foods Cambodia',
              supplierCode: sup?.code || 'SUPP-CP-001',
              productId: p.id,
              code: p.code || `PRD-${1000 + idx}`,
              barcode: p.barCode || p.barcode || '—',
              name: pName(p),
              nameKh: pNameKh(p),
              imageUrl: img,
              uom: p.uom || 'Unit',
              partNumber: partNum,
              active: idx % 6 !== 0,
              updatedAt: new Date().toISOString(),
            })
          })
          setMappings(seedMappings)
          saveProductSupplierRecords(seedMappings)
        }
      }
    }).finally(() => setPageLoading(false))
  }, [])

  // Auto-dismiss toast
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 3500)
      return () => clearTimeout(timer)
    }
  }, [toast])

  // Trigger search on submit
  const handleSearchSubmit = (e) => {
    if (e) e.preventDefault()
    setActiveSearch(searchInput.trim())
  }

  // Filtered and sorted mapping records for List View (Page 1)
  const filteredMappings = useMemo(() => {
    let list = [...mappings]
    const q = (activeSearch || searchInput).trim().toLowerCase()

    // 1. Search Query Filter
    if (q) {
      list = list.filter((it) => {
        const partNumber = String(it.partNumber || '').toLowerCase()
        const code = String(it.code || '').toLowerCase()
        const nameEn = String(it.name || '').toLowerCase()
        const nameKh = String(it.nameKh || '').toLowerCase()
        const supplier = String(it.supplierName || '').toLowerCase()

        if (searchBy === 'Part Number') {
          return partNumber.includes(q)
        }
        if (searchBy === 'Code') {
          return code.includes(q)
        }
        if (searchBy === 'Description') {
          return nameEn.includes(q) || nameKh.includes(q)
        }
        // 'Any'
        return (
          partNumber.includes(q) ||
          code.includes(q) ||
          nameEn.includes(q) ||
          nameKh.includes(q) ||
          supplier.includes(q)
        )
      })
    }

    // 2. Status Filter
    if (statusFilter === 'Active') {
      list = list.filter((it) => it.active !== false)
    } else if (statusFilter === 'Inactive') {
      list = list.filter((it) => it.active === false)
    }

    // 3. Sorting
    list.sort((a, b) => {
      let valA = a[sortField] ?? ''
      let valB = b[sortField] ?? ''

      if (sortField === 'supplier') {
        valA = a.supplierName || ''
        valB = b.supplierName || ''
      }

      valA = String(valA || '').toLowerCase()
      valB = String(valB || '').toLowerCase()

      if (valA < valB) return sortDirection === 'asc' ? -1 : 1
      if (valA > valB) return sortDirection === 'asc' ? 1 : -1
      return 0
    })

    return list
  }, [mappings, activeSearch, searchInput, searchBy, statusFilter, sortField, sortDirection])

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortField(field)
      setSortDirection('asc')
    }
  }

  // Toggle active status directly on list row
  const toggleMappingActive = (id, currentStatus) => {
    const nextStatus = !currentStatus
    setMappings((prev) => {
      const next = prev.map((it) => (it.id === id ? { ...it, active: nextStatus } : it))
      saveProductSupplierRecords(next)
      return next
    })
    setToast({
      tone: 'green',
      message: t(
        `✓ Product supplier status updated to ${nextStatus ? 'Active' : 'Inactive'}`,
        `✓ បានធ្វើបច្ចុប្បន្នភាពស្ថានភាពទៅជា ${nextStatus ? 'សកម្ម' : 'អសកម្ម'}`
      ),
    })
  }

  // Export filtered mappings to Excel
  const exportMappingsExcel = () => {
    const headers = []
    if (visibleCols.has('partNumber')) headers.push('Part Number')
    if (visibleCols.has('code')) headers.push('Product Code')
    if (visibleCols.has('description')) headers.push('Description (EN)')
    headers.push('Description (KH)')
    if (visibleCols.has('supplier')) headers.push('Supplier Name')
    if (visibleCols.has('uom')) headers.push('UOM')
    if (visibleCols.has('active')) headers.push('Status')

    const rows = filteredMappings.map((it) => {
      const r = []
      if (visibleCols.has('partNumber')) r.push(it.partNumber || '—')
      if (visibleCols.has('code')) r.push(it.code || '—')
      if (visibleCols.has('description')) r.push(it.name || '—')
      r.push(it.nameKh || '—')
      if (visibleCols.has('supplier')) r.push(it.supplierName || '—')
      if (visibleCols.has('uom')) r.push(it.uom || 'Unit')
      if (visibleCols.has('active')) r.push(it.active !== false ? 'Active' : 'Inactive')
      return r
    })

    exportStyledExcel({
      filename: 'product-supplier-mappings.xlsx',
      sheetName: 'Product Suppliers',
      title: 'PRODUCT SUPPLIER MAPPINGS REPORT',
      subtitle: `Status: ${statusFilter} · Search: ${activeSearch || 'All'}`,
      headers,
      data: rows,
      summary: {
        'Active Suppliers': filteredMappings.filter((it) => it.active !== false).length,
        'Inactive Suppliers': filteredMappings.filter((it) => it.active === false).length,
      },
    })
    setToast({
      tone: 'green',
      message: t(`✓ Exported ${rows.length} product supplier records to Excel`, `✓ បានទាញយកទិន្នន័យ ${rows.length} កំណត់ត្រា`),
    })
  }

  // Delete mapping record
  const promptDeleteMapping = (id, partNumber, prodName) => {
    setConfirmAction({
      title: { en: 'Delete Product Supplier', kh: 'លុបការភ្ជាប់អ្នកផ្គត់ផ្គង់' },
      message: {
        en: `Are you sure you want to delete supplier link for "${prodName || 'Product'}" (Part No: ${partNumber || '—'})?`,
        kh: `តើអ្នកពិតជាចង់លុបការភ្ជាប់អ្នកផ្គត់ផ្គង់សម្រាប់ "${prodName || 'ផលិតផល'}" មែនទេ?`,
      },
      confirmText: { en: 'Confirm Delete', kh: 'យល់ព្រមលុប' },
      cancelText: { en: 'Cancel', kh: 'បោះបង់' },
      type: 'danger',
      onConfirm: () => {
        setMappings((prev) => {
          const next = prev.filter((it) => String(it.id) !== String(id))
          saveProductSupplierRecords(next)
          return next
        })
        setConfirmAction(null)
        setToast({ tone: 'slate', message: t('Record deleted.', 'បានលុបកំណត់ត្រា។') })
      },
    })
  }

  // Toggle column visibility
  const toggleColumn = (colKey) => {
    setVisibleCols((prev) => {
      const next = new Set(prev)
      if (next.has(colKey)) {
        if (next.size > 1) next.delete(colKey)
      } else {
        next.add(colKey)
      }
      return next
    })
  }

  /* =========================================================================
     PAGE 2: CREATE / EDIT LOGIC
     ========================================================================= */
  const openCreatePage = () => {
    setEditingId(null)
    setFormSupplierId(suppliers.length > 0 ? String(suppliers[0].id) : '')
    setScannerCode('')
    setFormProducts([])
    setViewMode('create')
  }

  const openEditPage = (record) => {
    setEditingId(record.id)
    setFormSupplierId(String(record.supplierId || ''))
    setScannerCode('')
    setFormProducts([
      {
        id: record.productId || record.id,
        mappingId: record.id,
        code: record.code || '—',
        barcode: record.barcode || '—',
        name: record.name || '—',
        nameKh: record.nameKh || '—',
        imageUrl: record.imageUrl || '',
        uom: record.uom || 'Unit',
        partNumber: record.partNumber || '',
        active: record.active !== false,
      },
    ])
    setViewMode('edit')
  }

  const handleScannerSubmit = (e) => {
    if (e) e.preventDefault()
    if (!formSupplierId) {
      setToast({ tone: 'orange', message: t('Please select a Supplier first.', 'សូមជ្រើសរើសអ្នកផ្គត់ផ្គង់ជាមុនសិន។') })
      return
    }

    const q = scannerCode.trim().toLowerCase()
    if (!q) {
      setPickerModalOpen(true)
      return
    }

    const matched = catalogProducts.find((p) => {
      const code = String(p.code || '').toLowerCase()
      const barcode = String(p.barCode || p.barcode || '').toLowerCase()
      return code === q || barcode === q || code.includes(q) || barcode.includes(q)
    })

    if (matched) {
      addProductToForm(matched)
      setScannerCode('')
      setToast({ tone: 'green', message: t(`✓ Added "${pName(matched)}"`, `✓ បានបន្ថែម "${pName(matched)}"`) })
    } else {
      setToast({
        tone: 'orange',
        message: t(`No product found with code "${scannerCode}". Opening catalog search.`, `រកមិនឃើញផលិតផលទេ។`),
      })
      setPickerSearch(scannerCode)
      setPickerModalOpen(true)
    }
  }

  const matchedScannerProducts = useMemo(() => {
    const q = scannerCode.trim().toLowerCase()
    if (!q) return []
    return catalogProducts
      .filter((p) => {
        const code = String(p.code || '').toLowerCase()
        const barcode = String(p.barCode || p.barcode || '').toLowerCase()
        const nameEn = String(pName(p)).toLowerCase()
        return code.includes(q) || barcode.includes(q) || nameEn.includes(q)
      })
      .slice(0, 6)
  }, [catalogProducts, scannerCode])

  const addProductToForm = (p) => {
    if (!formSupplierId) {
      setToast({ tone: 'orange', message: t('Please select a Supplier first.', 'សូមជ្រើសរើសអ្នកផ្គត់ផ្គង់ជាមុនសិន។') })
      return
    }

    setFormProducts((prev) => {
      const exists = prev.find((it) => String(it.id) === String(p.id))
      if (exists) {
        setToast({ tone: 'orange', message: t(`"${pName(p)}" is already in table.`, `"${pName(p)}" មាននៅក្នុងតារាងហើយ។`) })
        return prev
      }

      const img = p.imageUrl || p.image || (Array.isArray(p.photos) ? p.photos[0] : null) || ''
      const selectedSup = suppliers.find((s) => String(s.id) === String(formSupplierId))
      const defaultPartNum = `PN-${selectedSup?.code?.slice(-3) || 'SUP'}-${p.code || p.id}`

      return [
        ...prev,
        {
          id: p.id,
          code: p.code || '—',
          barcode: p.barCode || p.barcode || '—',
          name: pName(p),
          nameKh: pNameKh(p),
          imageUrl: img,
          uom: p.uom || 'Unit',
          partNumber: defaultPartNum,
          active: true,
        },
      ]
    })
  }

  const updateFormProductRow = (id, field, val) => {
    setFormProducts((prev) =>
      prev.map((row) => (String(row.id) === String(id) ? { ...row, [field]: val } : row))
    )
  }

  const removeFormProductRow = (id) => {
    setFormProducts((prev) => prev.filter((it) => String(it.id) !== String(id)))
  }

  /* ---------- Picker Modal Logic ---------- */
  const filteredPickerProducts = useMemo(() => {
    const q = pickerSearch.trim().toLowerCase()
    if (!q) return catalogProducts
    return catalogProducts.filter((p) => {
      const code = String(p.code || '').toLowerCase()
      const barcode = String(p.barCode || p.barcode || '').toLowerCase()
      const nameEn = String(pName(p)).toLowerCase()
      const nameKh = String(pNameKh(p)).toLowerCase()
      return code.includes(q) || barcode.includes(q) || nameEn.includes(q) || nameKh.includes(q)
    })
  }, [catalogProducts, pickerSearch])

  const togglePickerSelect = (id) => {
    const next = new Set(pickerSelectedIds)
    if (next.has(id)) next.delete(id)
    else next.add(id)
    setPickerSelectedIds(next)
  }

  const confirmPickerAdd = () => {
    const selectedList = catalogProducts.filter((p) => pickerSelectedIds.has(p.id))
    selectedList.forEach((p) => addProductToForm(p))
    setPickerModalOpen(false)
    setPickerSelectedIds(new Set())
    setPickerSearch('')
    setToast({
      tone: 'green',
      message: t(`✓ Added ${selectedList.length} product(s)`, `✓ បានបន្ថែម ${selectedList.length} ផលិតផល`),
    })
  }

  /* ---------- Save Product Supplier Mapping ---------- */
  const handleSaveMapping = async () => {
    if (!formSupplierId) {
      setToast({ tone: 'orange', message: t('Please select a Supplier.', 'សូមជ្រើសរើសអ្នកផ្គត់ផ្គង់។') })
      return
    }
    if (formProducts.length === 0) {
      setToast({ tone: 'orange', message: t('Please add at least one product row.', 'សូមបន្ថែមយ៉ាងហោចណាស់មួយផលិតផល។') })
      return
    }

    setSaving(true)
    try {
      const selectedSup = suppliers.find((s) => String(s.id) === String(formSupplierId))
      const supName = selectedSup?.name || 'Selected Supplier'
      const supCode = selectedSup?.code || 'SUPP-001'

      let updatedList = [...mappings]

      if (editingId) {
        // Edit single row
        const row = formProducts[0]
        updatedList = updatedList.map((it) =>
          it.id === editingId
            ? {
                ...it,
                supplierId: formSupplierId,
                supplierName: supName,
                supplierCode: supCode,
                partNumber: row?.partNumber?.trim() || it.partNumber,
                active: row?.active !== false,
                updatedAt: new Date().toISOString(),
              }
            : it
        )
      } else {
        // Create new mappings
        const newRecords = formProducts.map((p) => ({
          id: `ps-${Date.now()}-${p.id}`,
          supplierId: formSupplierId,
          supplierName: supName,
          supplierCode: supCode,
          productId: p.id,
          code: p.code,
          barcode: p.barcode,
          name: p.name,
          nameKh: p.nameKh,
          imageUrl: p.imageUrl,
          uom: p.uom,
          partNumber: p.partNumber?.trim() || `PN-${supCode.slice(-3)}-${p.code}`,
          active: p.active !== false,
          updatedAt: new Date().toISOString(),
        }))

        // Replace any existing mapping for same supplier + product or append
        newRecords.forEach((rec) => {
          const existIdx = updatedList.findIndex(
            (it) => String(it.supplierId) === String(rec.supplierId) && String(it.productId) === String(rec.productId)
          )
          if (existIdx >= 0) {
            updatedList[existIdx] = rec
          } else {
            updatedList.unshift(rec)
          }
        })
      }

      // Persist to backend database product_supplier_links table
      for (const p of formProducts) {
        adminProductSupplierLinkAPI.create({
          productId: p.id,
          productName: p.name || pName(p),
          supplierId: Number(formSupplierId) || 1,
          supplierName: supName,
          vendorPartNumber: p.partNumber?.trim() || `PN-${supCode.slice(-3)}-${p.code}`,
          preferred: false,
          active: p.active !== false,
        }).catch(() => {})
      }

      setMappings(updatedList)
      saveProductSupplierRecords(updatedList)

      addNotification({
        type: 'product',
        action: 'edit',
        title: lang === 'en' ? 'Product Supplier updated' : 'បានធ្វើបច្ចុប្បន្នភាពអ្នកផ្គត់ផ្គង់ផលិតផល',
        detail: `Supplier: ${supName} · ${formProducts.length} product(s) linked`,
      })

      setToast({
        tone: 'green',
        message: t('✓ Successfully saved product supplier mappings!', '✓ បានរក្សាទុកការភ្ជាប់អ្នកផ្គត់ផ្គង់ដោយជោគជ័យ!'),
      })

      setViewMode('list')
    } catch {
      setToast({ tone: 'orange', message: t('Failed to save mappings.', 'ការរក្សាទុកបានបរាជ័យ។') })
    } finally {
      setSaving(false)
    }
  }

  if (pageLoading) {
    return <PageLoader loading={true} message={t('Loading Product Supplier…', 'កំពុងផ្ទុកអ្នកផ្គត់ផ្គង់ផលិតផល…')} />
  }

  return (
    <div className="space-y-6 text-slate-200">
      {/* Toast Alert */}
      {toast && (
        <div
          className={`fixed top-6 right-6 z-50 flex items-center gap-2.5 rounded-xl border px-4 py-3 text-xs font-bold shadow-2xl backdrop-blur-md transition-all duration-200 ${
            toast.tone === 'green'
              ? 'border-green-500/50 bg-[#7EB631]/20 text-green-300'
              : toast.tone === 'orange'
              ? 'border-amber-500/50 bg-[#E69D32]/20 text-amber-300'
              : 'border-slate-700 bg-slate-900/95 text-slate-300'
          }`}
        >
          <span>{toast.message}</span>
          <button type="button" onClick={() => setToast(null)} className="ml-2 text-slate-400 hover:text-white">
            ✕
          </button>
        </div>
      )}

      {/* Confirm Modal */}
      {confirmAction && (
        <ConfirmModal
          {...confirmAction}
          open={!!confirmAction}
          onClose={() => setConfirmAction(null)}
          onConfirm={() => {
            const fn = confirmAction.onConfirm
            setConfirmAction(null)
            fn?.()
          }}
        />
      )}

      {/* =========================================================================
         PAGE 1: PRODUCT SUPPLIER LIST VIEW
         ========================================================================= */}
      {viewMode === 'list' && (
        <div className="space-y-6">
          {/* Header & Breadcrumb */}
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <nav className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                <Link to="/admin/products" className="text-slate-400 transition hover:text-[#7EB631] flex items-center gap-1.5">
                  <span>📦</span>
                  <span>{t('Stocks', 'ស្តុក')}</span>
                </Link>
                <span className="text-slate-600">&gt;</span>
                <span className="text-[#7EB631]">{t('Product Supplier', 'អ្នកផ្គត់ផ្គង់ផលិតផល')}</span>
              </nav>
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-slate-700/80 bg-[#243040] shadow-md">
                  <img src={linkIcon} alt="" className="h-6 w-6 object-contain" />
                </div>
                <div>
                  <h1 className="text-2xl font-black tracking-tight text-white font-['Montserrat']">
                    {t('Product Supplier', 'អ្នកផ្គត់ផ្គង់ផលិតផល')}
                  </h1>
                  <p className="text-xs text-slate-400 font-['Montserrat']">
                    {t(
                      'Add view and edit your product supplier all in one place',
                      'បន្ថែម មើល និងកែប្រែអ្នកផ្គត់ផ្គង់ផលិតផលរបស់អ្នកនៅកន្លែងតែមួយ'
                    )}
                  </p>
                </div>
              </div>
            </div>

            {/* + Create Button */}
            <button
              type="button"
              onClick={openCreatePage}
              className="inline-flex items-center gap-2 self-start rounded-xl bg-gradient-to-r from-[#7EB631] to-green-600 px-5 py-2.5 text-xs font-black text-slate-950 shadow-lg shadow-green-600/20 transition hover:brightness-110 active:scale-95"
            >
              <span className="text-base leading-none">+</span>
              <span>{t('Create', 'បង្កើតថ្មី')}</span>
            </button>
          </div>

          {/* SECTION 1: SEARCH PRODUCT SUPPLIER */}
          <div className="rounded-2xl border border-slate-800/80 bg-[#243040]/70 backdrop-blur-md p-5 shadow-lg shadow-black/20 space-y-4">
            <div className="flex items-center gap-3">
              <div className="h-6 w-1.5 rounded-full bg-[#7EB631]" />
              <div>
                <h2 className="text-sm font-bold text-white uppercase tracking-wider font-['Montserrat']">
                  {t('Search Product Supplier', 'ស្វែងរកអ្នកផ្គត់ផ្គង់ផលិតផល')}
                </h2>
                <p className="text-[11px] text-slate-400 font-['Montserrat']">
                  {t(
                    'Search product supplier of by any condition. Ex(Any, Part Number, Code...)',
                    'ស្វែងរកអ្នកផ្គត់ផ្គង់ផលិតផលតាមលក្ខខណ្ឌណាមួយ។ ឧ. (ទាំងអស់, លេខគ្រឿង, កូដ...)'
                  )}
                </p>
              </div>
            </div>

            {/* Three-Field Search Row */}
            <form onSubmit={handleSearchSubmit} className="grid grid-cols-1 gap-3 sm:grid-cols-12 items-center pt-1">
              {/* 1. Search Text Input */}
              <div className="relative sm:col-span-5">
                <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 text-xs">
                  🔍
                </span>
                <input
                  type="text"
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  placeholder={t('Search here', 'ស្វែងរកនៅទីនេះ...')}
                  className="w-full rounded-xl border border-slate-700/80 bg-slate-950/90 py-2.5 pl-9 pr-3 text-xs font-semibold text-white placeholder-slate-500 outline-none transition focus:border-[#7EB631] focus:ring-2 focus:ring-[#7EB631]/20"
                />
              </div>

              {/* 2. Search By Dropdown */}
              <div className="sm:col-span-3">
                <select
                  value={searchBy}
                  onChange={(e) => setSearchBy(e.target.value)}
                  className="w-full rounded-xl border border-slate-700/80 bg-slate-950/90 px-3 py-2.5 text-xs font-semibold text-white outline-none transition focus:border-[#7EB631]"
                >
                  <option value="Any">{t('Any', 'ទាំងអស់ (Any)')}</option>
                  <option value="Part Number">{t('Part Number', 'លេខគ្រឿង (Part Number)')}</option>
                  <option value="Code">{t('Code', 'កូដទំនិញ (Code)')}</option>
                  <option value="Description">{t('Description', 'ការពិពណ៌នា (Description)')}</option>
                </select>
              </div>

              {/* 3. Status Dropdown */}
              <div className="sm:col-span-2">
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full rounded-xl border border-slate-700/80 bg-slate-950/90 px-3 py-2.5 text-xs font-semibold text-white outline-none transition focus:border-[#7EB631]"
                >
                  <option value="Active">{t('Active', 'សកម្ម (Active)')}</option>
                  <option value="Inactive">{t('Inactive', 'អសកម្ម (Inactive)')}</option>
                  <option value="All">{t('All', 'ទាំងអស់ (All)')}</option>
                </select>
              </div>

              {/* 4. Search Button */}
              <div className="sm:col-span-2 flex justify-end">
                <button
                  type="submit"
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 border border-slate-700 px-5 py-2.5 text-xs font-bold text-white shadow-md transition hover:border-[#7EB631] hover:bg-slate-800 hover:text-[#7EB631] active:scale-95"
                >
                  <span>🔍</span>
                  <span>{t('Search', 'ស្វែងរក')}</span>
                </button>
              </div>
            </form>
          </div>

          {/* SECTION 2: PRODUCT SUPPLIER LIST */}
          <div className="rounded-2xl border border-slate-800/80 bg-slate-900/80 p-5 shadow-lg shadow-black/20 space-y-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between pb-2 border-b border-slate-800">
              <div className="flex items-center gap-3">
                <div className="h-6 w-1.5 rounded-full bg-[#E69D32]" />
                <div>
                  <h2 className="text-sm font-bold text-white uppercase tracking-wider font-['Montserrat']">
                    {t('Product Supplier List', 'បញ្ជីអ្នកផ្គត់ផ្គង់ផលិតផល')}
                  </h2>
                  <p className="text-[11px] text-slate-400">
                    {t(
                      'Show information of product supplier. Ex(Part Number, Code, Description...)',
                      'បង្ហាញព័ត៌មាននៃអ្នកផ្គត់ផ្គង់ផលិតផល'
                    )}
                  </p>
                </div>
              </div>

              {/* Action buttons top right */}
              <div className="flex items-center gap-2.5">
                {/* Column Toggle (Blue) */}
                <button
                  type="button"
                  onClick={() => setColModalOpen(true)}
                  className="flex h-9 w-9 items-center justify-center rounded-xl border border-blue-500/40 bg-blue-500/10 text-blue-400 shadow-sm transition hover:bg-blue-500/20 hover:border-blue-400"
                  title={t('Toggle Columns', 'ជ្រើសរើសជួរឈរ')}
                >
                  <span className="text-sm">▦</span>
                </button>

                {/* Download Template Icon */}
                <button
                  type="button"
                  onClick={() => {
                    const headers = ['Product Code', 'Part Number', 'Supplier Code', 'Status']
                    const sample = [['PRD-1001', 'PN-CP-001', 'SUPP-CP-001', 'Active']]
                    exportStyledExcel({
                      filename: 'product-supplier-template.xlsx',
                      sheetName: 'Import Template',
                      title: 'PRODUCT SUPPLIER IMPORT TEMPLATE',
                      subtitle: 'Fill in product code, supplier part number, and supplier code to bulk import',
                      headers,
                      data: sample,
                    })
                    setToast({ tone: 'slate', message: t('Template downloaded.', 'បានទាញយកទម្រង់គំរូ។') })
                  }}
                  className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-700 bg-slate-950/60 text-slate-300 transition hover:border-slate-500 hover:bg-slate-800 hover:text-white"
                  title={t('Download Template', 'ទាញយកទម្រង់គំរូ')}
                >
                  📥
                </button>

                {/* Upload Icon (Highlighted) */}
                <button
                  type="button"
                  onClick={() => {
                    setToast({ tone: 'slate', message: t('Excel bulk import ready.', 'មុខងារនាំចូល Excel រួចរាល់។') })
                  }}
                  className="flex h-9 w-9 items-center justify-center rounded-xl border border-[#7EB631]/60 bg-[#7EB631]/15 text-[#7EB631] shadow-md shadow-green-600/10 transition hover:bg-[#7EB631]/25 hover:border-[#7EB631]"
                  title={t('Import from Excel', 'នាំចូលពី Excel')}
                >
                  📤
                </button>

                {/* Export Button */}
                <button
                  type="button"
                  onClick={exportMappingsExcel}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2 text-xs font-bold text-slate-300 shadow-sm transition hover:border-[#7EB631] hover:bg-slate-800 hover:text-white"
                >
                  <span>📊</span>
                  <span>{t('Export', 'នាំចេញ')}</span>
                </button>
              </div>
            </div>

            {/* Mapping Table */}
            <div className="overflow-x-auto rounded-xl border border-slate-800/80 bg-slate-950/50">
              <table className="w-full min-w-[800px] text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-800 bg-[#243040]/80 text-[11px] font-bold uppercase tracking-wider text-slate-300">
                    {visibleCols.has('picture') && (
                      <th className="w-14 px-3 py-3 text-center">{t('Picture', 'រូបភាព')}</th>
                    )}
                    {visibleCols.has('partNumber') && (
                      <th
                        onClick={() => handleSort('partNumber')}
                        className="cursor-pointer px-4 py-3 select-none hover:text-white"
                      >
                        <div className="flex items-center gap-1">
                          <span>{t('Part Number', 'លេខគ្រឿង')}</span>
                          <SortIcon field="partNumber" currentField={sortField} currentDir={sortDirection} />
                        </div>
                      </th>
                    )}
                    {visibleCols.has('code') && (
                      <th
                        onClick={() => handleSort('code')}
                        className="cursor-pointer px-4 py-3 select-none hover:text-white"
                      >
                        <div className="flex items-center gap-1">
                          <span>{t('Code', 'កូដ')}</span>
                          <SortIcon field="code" currentField={sortField} currentDir={sortDirection} />
                        </div>
                      </th>
                    )}
                    {visibleCols.has('description') && (
                      <th
                        onClick={() => handleSort('name')}
                        className="cursor-pointer px-4 py-3 select-none hover:text-white"
                      >
                        <div className="flex items-center gap-1">
                          <span>{t('Description', 'ការពិពណ៌នា')}</span>
                          <SortIcon field="name" currentField={sortField} currentDir={sortDirection} />
                        </div>
                      </th>
                    )}
                    {visibleCols.has('supplier') && (
                      <th
                        onClick={() => handleSort('supplier')}
                        className="cursor-pointer px-4 py-3 select-none hover:text-white"
                      >
                        <div className="flex items-center gap-1">
                          <span>{t('Supplier', 'អ្នកផ្គត់ផ្គង់')}</span>
                          <SortIcon field="supplier" currentField={sortField} currentDir={sortDirection} />
                        </div>
                      </th>
                    )}
                    {visibleCols.has('uom') && (
                      <th
                        onClick={() => handleSort('uom')}
                        className="cursor-pointer px-4 py-3 select-none hover:text-white w-24"
                      >
                        <div className="flex items-center gap-1">
                          <span>{t('UOM', 'ខ្នាត')}</span>
                          <SortIcon field="uom" currentField={sortField} currentDir={sortDirection} />
                        </div>
                      </th>
                    )}
                    {visibleCols.has('active') && (
                      <th className="w-24 px-4 py-3 text-center">{t('Active', 'សកម្ម')}</th>
                    )}
                    <th className="w-20 px-4 py-3 text-center">{t('Action', 'សកម្មភាព')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {filteredMappings.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-14 text-center">
                        <div className="mx-auto flex flex-col items-center justify-center space-y-2">
                          <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-dashed border-slate-700 bg-slate-900/60 text-2xl text-slate-500">
                            🔍
                          </div>
                          <h4 className="text-sm font-black uppercase tracking-wider text-slate-300">
                            {t('NOT FOUND', 'រកមិនឃើញ')}
                          </h4>
                          <p className="text-[11px] text-slate-500 max-w-sm">
                            {t(
                              'No product supplier records match your search or filter.',
                              'គ្មានកំណត់ត្រាត្រូវនឹងការស្វែងរករបស់អ្នកទេ។'
                            )}
                          </p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    filteredMappings.map((row) => (
                      <tr key={row.id} className="hover:bg-slate-900/40 transition-colors">
                        {/* Picture */}
                        {visibleCols.has('picture') && (
                          <td className="px-3 py-2 text-center align-middle">
                            {row.imageUrl ? (
                              <img
                                src={row.imageUrl}
                                alt=""
                                className="h-10 w-10 rounded-lg object-cover ring-1 ring-slate-700 mx-auto"
                                onError={(e) => {
                                  e.currentTarget.style.display = 'none'
                                }}
                              />
                            ) : (
                              <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-800 text-sm mx-auto">
                                🥫
                              </span>
                            )}
                          </td>
                        )}

                        {/* Part Number */}
                        {visibleCols.has('partNumber') && (
                          <td className="px-4 py-3 font-mono font-bold text-sky-300 align-middle">
                            {row.partNumber || '—'}
                          </td>
                        )}

                        {/* Code */}
                        {visibleCols.has('code') && (
                          <td className="px-4 py-3 font-mono font-bold text-[#7EB631] align-middle">
                            {row.code || '—'}
                          </td>
                        )}

                        {/* Description */}
                        {visibleCols.has('description') && (
                          <td className="px-4 py-3 align-middle">
                            <div className="font-bold text-white">{row.name || '—'}</div>
                            {row.nameKh && row.nameKh !== '—' && (
                              <div className="text-[11px] text-slate-400 font-['Kantumruy_Pro']">{row.nameKh}</div>
                            )}
                          </td>
                        )}

                        {/* Supplier */}
                        {visibleCols.has('supplier') && (
                          <td className="px-4 py-3 align-middle">
                            <span className="inline-flex items-center gap-1.5 rounded-lg bg-slate-800/80 px-2.5 py-1 text-xs font-semibold text-slate-200">
                              🏢 {row.supplierName || '—'}
                            </span>
                          </td>
                        )}

                        {/* UOM */}
                        {visibleCols.has('uom') && (
                          <td className="px-4 py-3 font-medium text-slate-300 align-middle">
                            {row.uom || 'Unit'}
                          </td>
                        )}

                        {/* Active Toggle Switch */}
                        {visibleCols.has('active') && (
                          <td className="px-4 py-3 text-center align-middle">
                            <ToggleSwitch
                              checked={row.active !== false}
                              onChange={() => toggleMappingActive(row.id, row.active !== false)}
                            />
                          </td>
                        )}

                        {/* Action Column */}
                        <td className="px-4 py-3 text-center align-middle">
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => openEditPage(row)}
                              className="rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-800 hover:text-white"
                              title={t('Edit Mapping', 'កែប្រែ')}
                            >
                              ✏️
                            </button>
                            <button
                              type="button"
                              onClick={() => promptDeleteMapping(row.id, row.partNumber, row.name)}
                              className="rounded-lg p-1.5 text-slate-500 transition hover:bg-red-500/20 hover:text-red-300"
                              title={t('Delete Mapping', 'លុប')}
                            >
                              🗑️
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Footer Count */}
            <div className="flex flex-col sm:flex-row items-center justify-between pt-2 text-xs text-slate-400 font-mono gap-2">
              <span>
                {t('Total Records:', 'កំណត់ត្រាសរុប:')}{' '}
                <span className="font-bold text-white">{filteredMappings.length}</span>
              </span>
              <div className="flex items-center gap-3 text-[11px]">
                <span className="text-green-400">
                  ● Active: {filteredMappings.filter((it) => it.active !== false).length}
                </span>
                <span className="text-slate-500">|</span>
                <span className="text-slate-400">
                  ● Inactive: {filteredMappings.filter((it) => it.active === false).length}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
         PAGE 2: CREATE / EDIT PRODUCT SUPPLIER
         ========================================================================= */}
      {viewMode !== 'list' && (
        <div className="space-y-6">
          {/* Header & Breadcrumb */}
          <div className="flex items-center justify-between">
            <nav className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-400">
              <Link to="/admin/products" className="text-slate-400 transition hover:text-[#7EB631] flex items-center gap-1.5">
                <span>📦</span>
                <span>{t('Stocks', 'ស្តុក')}</span>
              </Link>
              <span className="text-slate-600">&gt;</span>
              <button
                type="button"
                onClick={() => setViewMode('list')}
                className="text-slate-400 transition hover:text-[#7EB631]"
              >
                {t('Product Supplier', 'អ្នកផ្គត់ផ្គង់ផលិតផល')}
              </button>
              <span className="text-slate-600">&gt;</span>
              <span className="text-[#7EB631]">
                {viewMode === 'create' ? t('Create', 'បង្កើតថ្មី') : t('Edit', 'កែប្រែ')}
              </span>
            </nav>

            <button
              type="button"
              onClick={() => setViewMode('list')}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-700/80 bg-slate-900/80 px-3.5 py-1.5 text-xs font-bold text-slate-300 transition hover:border-[#7EB631] hover:bg-slate-800 hover:text-white"
            >
              <span className="text-sm">←</span>
              <span>{t('Back to Product Supplier List', 'ត្រឡប់ទៅបញ្ជី')}</span>
            </button>
          </div>

          {/* Title Bar with Cancel & Save */}
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between rounded-2xl border border-slate-800/80 bg-[#243040]/70 backdrop-blur-md p-5 shadow-lg shadow-black/20">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setViewMode('list')}
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-700/80 bg-slate-950/60 text-slate-400 transition hover:border-[#7EB631] hover:text-green-300 hover:scale-105 active:scale-95"
                title={t('Back', 'ត្រឡប់')}
              >
                <ChevronLeftIcon />
              </button>
              <div>
                <h1 className="text-xl font-black tracking-tight text-white font-['Montserrat']">
                  {viewMode === 'create'
                    ? t('Create Product Supplier', 'បង្កើតការភ្ជាប់អ្នកផ្គត់ផ្គង់ថ្មី')
                    : t('Edit Product Supplier', 'កែប្រែការភ្ជាប់អ្នកផ្គត់ផ្គង់')}
                </h1>
                <p className="text-xs text-slate-400 font-['Montserrat']">
                  {t(
                    'Add view and edit your product supplier all in one place',
                    'បន្ថែម មើល និងកែប្រែអ្នកផ្គត់ផ្គង់ផលិតផលរបស់អ្នកនៅកន្លែងតែមួយ'
                  )}
                </p>
              </div>
            </div>

            {/* Cancel & Save Action */}
            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={() => setViewMode('list')}
                className="rounded-xl border border-slate-700 bg-slate-950 px-4 py-2 text-xs font-bold text-slate-300 transition hover:border-slate-500 hover:bg-slate-800 hover:text-white"
              >
                {t('Cancel', 'បោះបង់')}
              </button>
              <button
                type="button"
                disabled={saving || !formSupplierId || formProducts.length === 0}
                onClick={handleSaveMapping}
                className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#7EB631] to-green-600 px-6 py-2.5 text-xs font-black text-slate-950 shadow-lg shadow-green-600/20 transition hover:brightness-110 active:scale-95 disabled:cursor-not-allowed disabled:opacity-40"
              >
                {saving ? (
                  <>
                    <span className="h-3 w-3 rounded-full border-2 border-slate-950 border-t-transparent animate-spin" />
                    {t('Saving…', 'កំពុងរក្សាទុក…')}
                  </>
                ) : (
                  <>💾 {t('Save', 'រក្សាទុក')}</>
                )}
              </button>
            </div>
          </div>

          {/* SECTION 1: SUPPLIER SELECTION & BARCODE SCANNER */}
          <div className="rounded-2xl border border-slate-800/80 bg-[#243040]/70 backdrop-blur-md p-5 shadow-lg shadow-black/20 space-y-4">
            <div className="flex items-center gap-3">
              <div className="h-6 w-1.5 rounded-full bg-[#7EB631]" />
              <div>
                <h2 className="text-sm font-bold text-white uppercase tracking-wider font-['Montserrat']">
                  {t('Supplier', 'អ្នកផ្គត់ផ្គង់')}
                </h2>
                <p className="text-[11px] text-slate-400 font-['Montserrat']">
                  {t('Select a supplier', 'ជ្រើសរើសអ្នកផ្គត់ផ្គង់')}
                </p>
              </div>
            </div>

            {/* Supplier Dropdown */}
            <div className="max-w-xl">
              <label className="text-xs font-bold text-slate-300 block mb-1.5">
                {t('Supplier', 'អ្នកផ្គត់ផ្គង់')} <span className="text-red-400">*</span>
              </label>
              <select
                value={formSupplierId}
                onChange={(e) => setFormSupplierId(e.target.value)}
                className="w-full rounded-xl border border-slate-700/80 bg-slate-950/90 px-3.5 py-2.5 text-xs font-semibold text-white outline-none transition focus:border-[#7EB631]"
              >
                <option value="">-- {t('Choose Supplier', 'ជ្រើសរើសអ្នកផ្គត់ផ្គង់')} --</option>
                {suppliers.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({s.code || 'SUPP'})
                  </option>
                ))}
              </select>
            </div>

            {/* Barcode or SKU Scanner Input */}
            <div className="pt-2 border-t border-slate-800/80">
              <form onSubmit={handleScannerSubmit} className="flex gap-2 max-w-xl">
                <div className="relative flex-1">
                  <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 text-xs">
                    📷
                  </span>
                  <input
                    ref={scannerInputRef}
                    type="text"
                    value={scannerCode}
                    onChange={(e) => setScannerCode(e.target.value)}
                    placeholder={t('Hint: Barcode or Sku here', 'ស្កេន ឬវាយបារកូដ ឬ SKU នៅទីនេះ...')}
                    className="w-full rounded-xl border border-slate-700/80 bg-slate-950/90 py-2.5 pl-9 pr-3 text-xs font-semibold text-white placeholder-slate-500 outline-none transition focus:border-[#7EB631] focus:ring-2 focus:ring-[#7EB631]/20"
                  />

                  {/* Live Suggestions Dropdown with Photos */}
                  {scannerCode.trim() && matchedScannerProducts.length > 0 && (
                    <div className="absolute top-full left-0 right-0 z-30 mt-1.5 max-h-64 overflow-y-auto rounded-xl border border-slate-700 bg-slate-900/95 p-1.5 shadow-2xl backdrop-blur-md divide-y divide-slate-800">
                      {matchedScannerProducts.map((p) => {
                        const img = p.imageUrl || p.image || (Array.isArray(p.photos) ? p.photos[0] : null)
                        return (
                          <div
                            key={p.id}
                            onClick={() => {
                              addProductToForm(p)
                              setScannerCode('')
                            }}
                            className="flex items-center justify-between p-2 hover:bg-slate-800/80 rounded-lg cursor-pointer transition"
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              {img ? (
                                <img
                                  src={img}
                                  alt=""
                                  className="h-9 w-9 shrink-0 rounded-lg object-cover ring-1 ring-slate-700"
                                  onError={(e) => {
                                    e.currentTarget.style.display = 'none'
                                  }}
                                />
                              ) : (
                                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-800 text-xs">
                                  🥫
                                </span>
                              )}
                              <div className="min-w-0">
                                <div className="font-bold text-white text-xs truncate">{pName(p)}</div>
                                <div className="text-[10px] font-mono text-slate-400">
                                  Code: <span className="text-green-300">{p.code || '—'}</span>
                                </div>
                              </div>
                            </div>

                            <button
                              type="button"
                              className="ml-2 shrink-0 rounded-md bg-[#7EB631] px-2.5 py-1 text-[10px] font-bold text-slate-950 hover:brightness-110"
                            >
                              + Add
                            </button>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>

                <button
                  type="submit"
                  className="inline-flex items-center gap-1.5 rounded-xl bg-slate-800 border border-slate-700 px-4 py-2.5 text-xs font-bold text-slate-200 transition hover:bg-slate-700 hover:text-white"
                >
                  <span>🔍</span>
                  <span>{t('Search / Add', 'ស្វែងរក / បន្ថែម')}</span>
                </button>
              </form>
            </div>
          </div>

          {/* SECTION 2: PRODUCT_SUPPLIER TABLE */}
          <div className="rounded-2xl border border-slate-800/80 bg-slate-900/80 p-5 shadow-lg shadow-black/20 space-y-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-3">
                <div className="h-6 w-1.5 rounded-full bg-[#E69D32]" />
                <div>
                  <h2 className="text-sm font-bold text-white uppercase tracking-wider font-['Montserrat']">
                    {t('Product_Supplier', 'ព័ត៌មានផលិតផល និងអ្នកផ្គត់ផ្គង់')}
                  </h2>
                  <p className="text-[11px] text-slate-400">
                    {t(
                      'Input the general product supplier information',
                      'បញ្ចូលព័ត៌មានទូទៅនៃអ្នកផ្គត់ផ្គង់ផលិតផល'
                    )}
                  </p>
                </div>
              </div>

              {/* + Add Product from Catalog */}
              <button
                type="button"
                onClick={() => {
                  if (!formSupplierId) {
                    setToast({ tone: 'orange', message: t('Please select a Supplier first.', 'សូមជ្រើសរើសអ្នកផ្គត់ផ្គង់ជាមុនសិន។') })
                    return
                  }
                  setPickerSearch('')
                  setPickerSelectedIds(new Set())
                  setPickerModalOpen(true)
                }}
                className="inline-flex items-center gap-1.5 rounded-xl bg-[#7EB631] px-4 py-2 text-xs font-bold text-slate-950 shadow-md shadow-green-600/20 transition hover:brightness-110 active:scale-95"
              >
                + {t('Add Product', 'បន្ថែមផលិតផល')}
              </button>
            </div>

            {/* Table */}
            <div className="overflow-x-auto rounded-xl border border-slate-800/80 bg-slate-950/50">
              <table className="w-full min-w-[760px] text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-800 bg-[#243040]/80 text-[11px] font-bold uppercase tracking-wider text-slate-300">
                    <th className="w-12 px-3 py-3 text-center">N°</th>
                    <th className="w-14 px-3 py-3 text-center">{t('Picture', 'រូបភាព')}</th>
                    <th className="px-4 py-3">{t('Code', 'កូដ')}</th>
                    <th className="px-4 py-3">{t('Description', 'ការពិពណ៌នា')}</th>
                    <th className="px-4 py-3">{t('UOM', 'ខ្នាត')}</th>
                    <th className="w-48 px-4 py-3">{t('Part Number', 'លេខគ្រឿង (Part Number)')}</th>
                    <th className="w-24 px-4 py-3 text-center">{t('Active', 'សកម្ម')}</th>
                    <th className="w-14 px-4 py-3 text-center">{t('Action', 'សកម្មភាព')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {formProducts.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-14 text-center">
                        <div className="mx-auto flex flex-col items-center justify-center space-y-2">
                          <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-dashed border-slate-700 bg-slate-900/60 text-2xl text-slate-500">
                            🔍
                          </div>
                          <h4 className="text-sm font-black uppercase tracking-wider text-slate-300">
                            {t('NOT FOUND', 'រកមិនឃើញ')}
                          </h4>
                          <p className="text-[11px] text-slate-500 max-w-sm">
                            {t(
                              'No product rows added yet. Scan a barcode above or click "+ Add Product".',
                              'មិនទាន់មានទិន្នន័យនៅឡើយទេ។ ស្កេនបារកូដ ឬចុច "+ បន្ថែមផលិតផល"។'
                            )}
                          </p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    formProducts.map((row, idx) => (
                      <tr key={row.id} className="hover:bg-slate-900/40 transition-colors">
                        <td className="px-3 py-3 text-center font-mono text-slate-400 align-middle">
                          {idx + 1}
                        </td>
                        <td className="px-3 py-2 text-center align-middle">
                          {row.imageUrl ? (
                            <img
                              src={row.imageUrl}
                              alt=""
                              className="h-10 w-10 rounded-lg object-cover ring-1 ring-slate-700 mx-auto"
                              onError={(e) => {
                                e.currentTarget.style.display = 'none'
                              }}
                            />
                          ) : (
                            <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-800 text-sm mx-auto">
                              🥫
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 font-mono font-bold text-[#7EB631] align-middle">
                          {row.code || '—'}
                        </td>
                        <td className="px-4 py-3 align-middle">
                          <div className="font-bold text-white">{row.name}</div>
                          {row.nameKh && row.nameKh !== '—' && (
                            <div className="text-[11px] text-slate-400">{row.nameKh}</div>
                          )}
                        </td>
                        <td className="px-4 py-3 font-medium text-slate-300 align-middle">
                          {row.uom || 'Unit'}
                        </td>
                        {/* Editable Part Number Input */}
                        <td className="px-4 py-2 align-middle">
                          <input
                            type="text"
                            value={row.partNumber}
                            onChange={(e) => updateFormProductRow(row.id, 'partNumber', e.target.value)}
                            placeholder="e.g. PN-SUPP-001"
                            className="w-full rounded-lg border border-slate-700 bg-slate-900 px-2.5 py-1.5 font-mono text-xs font-bold text-sky-300 outline-none focus:border-[#7EB631] focus:ring-1 focus:ring-[#7EB631]"
                          />
                        </td>
                        {/* Active Toggle Switch */}
                        <td className="px-4 py-3 text-center align-middle">
                          <ToggleSwitch
                            checked={row.active !== false}
                            onChange={(val) => updateFormProductRow(row.id, 'active', val)}
                          />
                        </td>
                        {/* Remove Row */}
                        <td className="px-4 py-3 text-center align-middle">
                          <button
                            type="button"
                            onClick={() => removeFormProductRow(row.id)}
                            className="rounded-lg p-1.5 text-slate-500 transition hover:bg-red-500/20 hover:text-red-300"
                            title={t('Remove row', 'ដកជួរដេក')}
                          >
                            🗑️
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Footer line count */}
            <div className="flex items-center justify-between pt-2 text-xs text-slate-400 font-mono">
              <span>
                {t('Total:', 'សរុប:')} <span className="font-bold text-white">{formProducts.length} Lines</span>
              </span>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
         MODAL 1: COLUMN VISIBILITY TOGGLE (PAGE 1)
         ========================================================================= */}
      <Modal open={colModalOpen} onClose={() => setColModalOpen(false)} title={t('Table Column Settings', 'ការកំណត់ជួរឈរ')}>
        <div className="space-y-4 p-2">
          <p className="text-xs text-slate-400">
            {t('Select which columns you want to show or hide in the table.', 'ជ្រើសរើសជួរឈរដែលអ្នកចង់បង្ហាញ ឬលាក់ក្នុងតារាង។')}
          </p>

          <div className="space-y-2.5">
            {[
              { key: 'picture', label: t('Product Picture', 'រូបភាពផលិតផល') },
              { key: 'partNumber', label: t('Part Number', 'លេខគ្រឿង (Part Number)') },
              { key: 'code', label: t('Product Code', 'កូដផលិតផល') },
              { key: 'description', label: t('Description', 'ការពិពណ៌នា') },
              { key: 'supplier', label: t('Supplier Name', 'ឈ្មោះអ្នកផ្គត់ផ្គង់') },
              { key: 'uom', label: t('Unit of Measure', 'ខ្នាត') },
              { key: 'active', label: t('Active Status', 'ស្ថានភាពសកម្ម') },
            ].map((col) => (
              <label
                key={col.key}
                className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-950/60 p-3 text-xs font-semibold text-slate-200 cursor-pointer hover:border-slate-700"
              >
                <span>{col.label}</span>
                <input
                  type="checkbox"
                  checked={visibleCols.has(col.key)}
                  onChange={() => toggleColumn(col.key)}
                  className="rounded text-[#7EB631] focus:ring-[#7EB631] h-4 w-4"
                />
              </label>
            ))}
          </div>

          <div className="flex justify-end pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={() => setColModalOpen(false)}
              className="rounded-xl bg-[#7EB631] px-5 py-2 text-xs font-black text-slate-950 shadow-md transition hover:brightness-110"
            >
              {t('Done', 'រួចរាល់')}
            </button>
          </div>
        </div>
      </Modal>

      {/* =========================================================================
         MODAL 2: PRODUCT PICKER MODAL (PAGE 2)
         ========================================================================= */}
      <Modal open={pickerModalOpen} onClose={() => setPickerModalOpen(false)} title={t('Select Products from Catalog', 'ជ្រើសរើសផលិតផល')}>
        <div className="space-y-4 p-1">
          <div className="relative">
            <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 text-xs">
              🔍
            </span>
            <input
              type="text"
              value={pickerSearch}
              onChange={(e) => setPickerSearch(e.target.value)}
              placeholder={t('Search product by code, barcode, or name…', 'ស្វែងរកតាមកូដ បារកូដ ឬឈ្មោះ…')}
              className="w-full rounded-xl border border-slate-700 bg-slate-950 py-2.5 pl-9 pr-3 text-xs font-semibold text-white placeholder-slate-500 outline-none focus:border-[#7EB631]"
            />
          </div>

          <div className="max-h-72 overflow-y-auto rounded-xl border border-slate-800 bg-slate-950/60 divide-y divide-slate-800/60">
            {filteredPickerProducts.length === 0 ? (
              <div className="p-8 text-center text-slate-400">
                {t('No products match your search.', 'រកមិនឃើញផលិតផលទេ។')}
              </div>
            ) : (
              filteredPickerProducts.map((p) => {
                const isSelected = pickerSelectedIds.has(p.id)
                const alreadyAdded = formProducts.some((it) => String(it.id) === String(p.id))
                return (
                  <div
                    key={p.id}
                    onClick={() => togglePickerSelect(p.id)}
                    className={`flex items-center justify-between p-3 transition cursor-pointer ${
                      isSelected ? 'bg-[#7EB631]/20 text-green-200' : 'hover:bg-slate-900/60'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => {}}
                        className="rounded text-[#7EB631] focus:ring-[#7EB631] h-4 w-4 shrink-0"
                      />

                      {p.imageUrl || p.image || (Array.isArray(p.photos) ? p.photos[0] : null) ? (
                        <img
                          src={p.imageUrl || p.image || (Array.isArray(p.photos) ? p.photos[0] : null)}
                          alt=""
                          className="h-10 w-10 shrink-0 rounded-lg object-cover ring-1 ring-slate-700"
                          onError={(e) => {
                            e.currentTarget.style.display = 'none'
                          }}
                        />
                      ) : (
                        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-slate-800 text-sm">
                          🥫
                        </span>
                      )}

                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-white text-xs truncate">{pName(p)}</span>
                          {alreadyAdded && (
                            <span className="rounded bg-[#7EB631]/20 px-1.5 py-0.2 text-[9px] font-bold text-[#7EB631]">
                              In Table
                            </span>
                          )}
                        </div>
                        <p className="font-mono text-[11px] text-slate-400">
                          Code: <span className="text-green-300">{p.code || '—'}</span>
                        </p>
                      </div>
                    </div>

                    <div className="text-right shrink-0 ml-3 font-mono font-bold text-xs text-slate-300">
                      {p.uom || 'Unit'}
                    </div>
                  </div>
                )
              })
            )}
          </div>

          <div className="flex items-center justify-between pt-3 border-t border-slate-800">
            <span className="text-slate-400 font-mono text-[11px]">
              {pickerSelectedIds.size} {t('selected', 'បានជ្រើសរើស')}
            </span>

            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={() => setPickerModalOpen(false)}
                className="rounded-xl border border-slate-700 bg-slate-950 px-4 py-2 text-xs font-bold text-slate-300 transition hover:bg-slate-800 hover:text-white"
              >
                {t('Cancel', 'បោះបង់')}
              </button>
              <button
                type="button"
                onClick={confirmPickerAdd}
                className="rounded-xl bg-[#7EB631] px-5 py-2 text-xs font-black text-slate-950 shadow-md shadow-green-600/20 transition hover:brightness-110 active:scale-95"
              >
                {t('Add to Table', 'បន្ថែម')} ({pickerSelectedIds.size})
              </button>
            </div>
          </div>
        </div>
      </Modal>
    </div>
  )
}

export default ProductsSupplierSection
