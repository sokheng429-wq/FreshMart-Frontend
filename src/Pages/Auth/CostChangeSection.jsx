import { useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import * as XLSX from 'xlsx'
import { useLanguage } from '../../context/LanguageContext'
import { useNotifications } from '../../context/NotificationContext'
import {
  adminProductAPI,
  adminProductGroupAPI,
  adminCategoryAPI,
  adminBrandAPI,
  adminUnitAPI,
  adminCostChangeLogAPI,
} from '../../api/api'
import { PageLoader } from '../../components/PageLoader'
import dollarIcon from '../../assets/icon/3dicons-dollar-dynamic-color.png'
import { Modal, ConfirmModal } from './stockUI'
import { enrichProductList, saveProductExtendedMeta } from '../../utils/productMeta'
import CostChangeNotePrint from '../../components/CostChangeNotePrint'
import { exportStyledExcel } from '../../utils/excelExport'

const pName = (p) => (typeof p?.name === 'object' ? p.name?.en : p?.name) || `#${p?.id}`
const pNameKh = (p) => (typeof p?.name === 'object' ? p.name?.kh : p?.nameKh || p?.name_kh || p?.secondLanguage || '—')

const formatNowDateTimeLocal = () => {
  const now = new Date()
  const pad = (n) => String(n).padStart(2, '0')
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}T${pad(now.getHours())}:${pad(now.getMinutes())}`
}

const formatDisplayDate = (dStr) => {
  if (!dStr) return '—'
  const d = new Date(dStr)
  if (Number.isNaN(d.getTime())) return dStr
  return d.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

const preparePrintDocData = (doc) => {
  return {
    company: {
      name: "FRESHMART SUPERMARKET",
      email: 'support@freshmart.com',
      website: 'www.freshmart.com',
      address: '#128, Preah Norodom Blvd, Phnom Penh, Cambodia (រាជធានីភ្នំពេញ)',
      phone: '+855 23 999 888 / +855 12 345 678',
    },
    document: {
      code: doc?.code || 'CC-000000',
      date: doc?.date || new Date().toISOString(),
      outlet: doc?.outlet || 'MAIN-OUTLET',
      location: doc?.location || 'DEFAULT-LOC',
      reference: doc?.reference || '—',
    },
    items: (doc?.items || []).map((it) => ({
      id: it.id,
      productCode: it.code || it.productCode || '—',
      description: it.name || it.description || '—',
      nameKh: it.nameKh || '',
      imageUrl: it.imageUrl || it.image || '',
      qty: it.qty || 1,
      uom: it.uom || 'Unit',
      oldCost: Number(it.oldCost || 0),
      oldTotalCost: Number(it.qty || 1) * Number(it.oldCost || 0),
      newCost: Number(it.newCost || 0),
      newTotalCost: Number(it.qty || 1) * Number(it.newCost || 0),
    })),
    printedBy: {
      user: 'Admin',
      timestamp: new Date().toLocaleString('en-GB'),
    },
  }
}

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

const COST_CHANGE_STORAGE_KEY = 'bg_cost_change_records_v1'

const loadCostChangeRecords = () => {
  try {
    const raw = localStorage.getItem(COST_CHANGE_STORAGE_KEY)
    if (raw) return JSON.parse(raw)
  } catch {}
  // Default sample records
  return [
    {
      id: 'cc-101',
      code: 'CC-20260831-001',
      date: '2026-08-31T10:30',
      outlet: 'MAIN-OUTLET',
      location: 'DEFAULT-LOC',
      reference: 'REF-SUPP-ADJ-AUG',
      changeBy: 'Admin / Sys',
      amount: 1450.0,
      linesCount: 3,
      items: [],
    },
    {
      id: 'cc-102',
      code: 'CC-20260830-002',
      date: '2026-08-30T14:15',
      outlet: 'MAIN-OUTLET',
      location: 'DEFAULT-LOC',
      reference: 'REF-FREIGHT-AUG26',
      changeBy: 'Sok Heng',
      amount: 820.75,
      linesCount: 2,
      items: [],
    },
  ]
}

const saveCostChangeRecords = (records) => {
  try {
    localStorage.setItem(COST_CHANGE_STORAGE_KEY, JSON.stringify(records))
  } catch {}
}

export const CostChangeSection = () => {
  const { lang } = useLanguage()
  const { addNotification } = useNotifications()
  const t = (en, kh) => (lang === 'en' ? en : kh)

  // Master Catalog Data
  const [catalogProducts, setCatalogProducts] = useState([])
  const [groups, setGroups] = useState([])
  const [categories, setCategories] = useState([])
  const [brands, setBrands] = useState([])
  const [units, setUnits] = useState([])
  const [pageLoading, setPageLoading] = useState(true)

  // View Mode: 'list' | 'create' | 'edit'
  const [viewMode, setViewMode] = useState('list')

  // Cost Change Documents List
  const [costChangeList, setCostChangeList] = useState(loadCostChangeRecords)

  // List View: Search & Filters
  const [searchQuery, setSearchQuery] = useState('')
  const [searchBy, setSearchBy] = useState('any') // 'any' | 'code'
  const [showAdvanceFilter, setShowAdvanceFilter] = useState(false)
  const [fromDate, setFromDate] = useState('')
  const [toDate, setToDate] = useState('')

  // List View: Sorting
  const [sortField, setSortField] = useState('date')
  const [sortDirection, setSortDirection] = useState('desc')

  // List View: Visible Columns Modal
  const [colModalOpen, setColModalOpen] = useState(false)
  const [visibleCols, setVisibleCols] = useState(() => new Set(['code', 'date', 'amount', 'reference', 'changeBy']))
  const [draftCols, setDraftCols] = useState(() => new Set(['code', 'date', 'amount', 'reference', 'changeBy']))

  // Create / Edit Form State
  const [editingId, setEditingId] = useState(null)
  const [formCode, setFormCode] = useState('')
  const [formDate, setFormDate] = useState(formatNowDateTimeLocal)
  const [formOutlet, setFormOutlet] = useState('MAIN-OUTLET')
  const [formLocation, setFormLocation] = useState('DEFAULT-LOC')
  const [formReference, setFormReference] = useState('')
  const [scannerCode, setScannerCode] = useState('')
  const [formProducts, setFormProducts] = useState([])

  // Modal: Product Picker in Create View
  const [pickerModalOpen, setPickerModalOpen] = useState(false)
  const [pickerSearch, setPickerSearch] = useState('')
  const [pickerSelectedIds, setPickerSelectedIds] = useState(() => new Set())

  // UI Alerts / Confirmation
  const [toast, setToast] = useState(null)
  const [confirmAction, setConfirmAction] = useState(null)
  const [saving, setSaving] = useState(false)
  const [printDocData, setPrintDocData] = useState(null)

  const scannerInputRef = useRef(null)

  // Fetch Catalog Master Data
  useEffect(() => {
    Promise.all([
      adminProductAPI.getAll().catch(() => ({ data: [] })),
      adminProductGroupAPI.getAll().catch(() => ({ data: [] })),
      adminCategoryAPI.getAll().catch(() => ({ data: [] })),
      adminBrandAPI.getAll().catch(() => ({ data: [] })),
      adminUnitAPI.getAll().catch(() => ({ data: [] })),
    ]).then(([pRes, gRes, cRes, bRes, uRes]) => {
      const rawProds = Array.isArray(pRes?.data) ? pRes.data : []
      const enriched = enrichProductList(rawProds)
      setCatalogProducts(enriched)
      setGroups(Array.isArray(gRes?.data) ? gRes.data : [])
      setCategories(Array.isArray(cRes?.data) ? cRes.data : [])
      setBrands(Array.isArray(bRes?.data) ? bRes.data : [])
      setUnits(Array.isArray(uRes?.data) ? uRes.data : [])
    }).finally(() => setPageLoading(false))
  }, [])

  // Auto-dismiss toast
  useEffect(() => {
    if (!toast) return
    const timer = setTimeout(() => setToast(null), 3500)
    return () => clearTimeout(timer)
  }, [toast])

  /* =========================================================================
     PAGE 1: LIST VIEW FILTERING & SORTING
     ========================================================================= */
  const filteredCostChanges = useMemo(() => {
    let list = [...costChangeList]

    // Text Search
    const q = searchQuery.trim().toLowerCase()
    if (q) {
      list = list.filter((item) => {
        const code = String(item.code || '').toLowerCase()
        const ref = String(item.reference || '').toLowerCase()
        const changeBy = String(item.changeBy || '').toLowerCase()

        if (searchBy === 'code') return code.includes(q)
        return code.includes(q) || ref.includes(q) || changeBy.includes(q)
      })
    }

    // Advance Date Range Filter (Change By Date)
    if (fromDate) {
      const fTime = new Date(fromDate).getTime()
      list = list.filter((item) => {
        const itemTime = new Date(item.date).getTime()
        return !Number.isNaN(itemTime) && itemTime >= fTime
      })
    }
    if (toDate) {
      // end of day for toDate
      const tDateObj = new Date(toDate)
      tDateObj.setHours(23, 59, 59, 999)
      const tTime = tDateObj.getTime()
      list = list.filter((item) => {
        const itemTime = new Date(item.date).getTime()
        return !Number.isNaN(itemTime) && itemTime <= tTime
      })
    }

    // Sorting
    list.sort((a, b) => {
      let valA = a[sortField]
      let valB = b[sortField]

      if (sortField === 'amount') {
        valA = Number(valA || 0)
        valB = Number(valB || 0)
      } else if (sortField === 'date') {
        valA = new Date(valA || 0).getTime()
        valB = new Date(valB || 0).getTime()
      } else {
        valA = String(valA || '').toLowerCase()
        valB = String(valB || '').toLowerCase()
      }

      if (valA < valB) return sortDirection === 'asc' ? -1 : 1
      if (valA > valB) return sortDirection === 'asc' ? 1 : -1
      return 0
    })

    return list
  }, [costChangeList, searchQuery, searchBy, fromDate, toDate, sortField, sortDirection])

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortField(field)
      setSortDirection('asc')
    }
  }

  const exportListExcel = () => {
    const headers = []
    if (visibleCols.has('code')) headers.push('Code')
    if (visibleCols.has('date')) headers.push('Date')
    if (visibleCols.has('amount')) headers.push('Amount ($)')
    if (visibleCols.has('reference')) headers.push('Reference')
    if (visibleCols.has('changeBy')) headers.push('Change By')
    headers.push('Lines Count')

    let totalAmountSum = 0

    const rows = filteredCostChanges.map((it) => {
      const r = []
      const amt = Number(it.amount || 0)
      totalAmountSum += amt

      if (visibleCols.has('code')) r.push(it.code || '—')
      if (visibleCols.has('date')) r.push(formatDisplayDate(it.date))
      if (visibleCols.has('amount')) r.push(amt.toFixed(2))
      if (visibleCols.has('reference')) r.push(it.reference || '—')
      if (visibleCols.has('changeBy')) r.push(it.changeBy || '—')
      r.push(it.linesCount || (it.items ? it.items.length : 0))
      return r
    })

    exportStyledExcel({
      filename: 'cost-change-list.xlsx',
      sheetName: 'Cost Change',
      title: 'COST CHANGE DOCUMENT LIST',
      subtitle: `Search: ${searchQuery || 'All'} · Date Range: ${fromDate || 'Any'} to ${toDate || 'Any'}`,
      headers,
      data: rows,
      summary: {
        'Total Cost Amount': `$${totalAmountSum.toFixed(2)}`,
        'Total Documents': rows.length,
      },
    })
  }

  /* =========================================================================
     PAGE 2: CREATE / EDIT LOGIC
     ========================================================================= */
  const openCreatePage = () => {
    setEditingId(null)
    const genCode = `CC-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${String(Math.floor(1000 + Math.random() * 9000))}`
    setFormCode(genCode)
    setFormDate(formatNowDateTimeLocal())
    setFormOutlet('MAIN-OUTLET')
    setFormLocation('DEFAULT-LOC')
    setFormReference('')
    setScannerCode('')
    setFormProducts([])
    setViewMode('create')
  }

  const openEditPage = (record) => {
    setEditingId(record.id)
    setFormCode(record.code)
    setFormDate(record.date || formatNowDateTimeLocal())
    setFormOutlet(record.outlet || 'MAIN-OUTLET')
    setFormLocation(record.location || 'DEFAULT-LOC')
    setFormReference(record.reference || '')
    setScannerCode('')
    setFormProducts(Array.isArray(record.items) && record.items.length > 0 ? record.items : [])
    setViewMode('edit')
  }

  const handleScannerSubmit = (e) => {
    if (e) e.preventDefault()
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
        message: t(`No product found with code "${scannerCode}". Opening catalog search.`, `រកមិនឃើញផលិតផលដែលមានកូដ "${scannerCode}" ទេ។`),
      })
      setPickerSearch(scannerCode)
      setPickerModalOpen(true)
    }
  }

  const addProductToForm = (p) => {
    setFormProducts((prev) => {
      const exists = prev.find((it) => String(it.id) === String(p.id))
      if (exists) {
        // Increment qty
        return prev.map((it) => (String(it.id) === String(p.id) ? { ...it, qty: Number(it.qty) + 1 } : it))
      }
      const oldCost = Number(p.averageCost ?? p.cost ?? 0)
      const img = p.imageUrl || p.image || (Array.isArray(p.photos) ? p.photos[0] : null) || ''
      return [
        ...prev,
        {
          id: p.id,
          code: p.code || '—',
          barcode: p.barCode || p.barcode || '—',
          name: pName(p),
          nameKh: pNameKh(p),
          imageUrl: img,
          qty: 1,
          uom: p.uom || 'Unit',
          oldCost: oldCost,
          newCost: oldCost > 0 ? oldCost : Number(p.basePrice ?? 0) * 0.7,
        },
      ]
    })
  }

  const updateFormProductRow = (id, field, val) => {
    setFormProducts((prev) =>
      prev.map((row) => {
        if (String(row.id) === String(id)) {
          const numVal = Number(val)
          return {
            ...row,
            [field]: Number.isNaN(numVal) ? 0 : Math.max(0, numVal),
          }
        }
        return row
      })
    )
  }

  const removeFormProductRow = (id) => {
    setFormProducts((prev) => prev.filter((it) => String(it.id) !== String(id)))
  }

  // Running sum of New Total Cost
  const calculatedGrandTotal = useMemo(() => {
    return formProducts.reduce((sum, it) => sum + (Number(it.qty || 0) * Number(it.newCost || 0)), 0)
  }, [formProducts])

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
      message: t(`✓ Added ${selectedList.length} product(s) to Cost Change`, `✓ បានបន្ថែម ${selectedList.length} ផលិតផល`),
    })
  }

  /* ---------- Save Cost Change Document ---------- */
  const handleSaveCostChange = async () => {
    if (formProducts.length === 0) {
      setToast({ tone: 'orange', message: t('Please add at least one product row.', 'សូមបន្ថែមផលិតផលយ៉ាងហោចណាស់មួយ។') })
      return
    }

    setSaving(true)
    try {
      // 1. Update product costs in live database & create cost change logs in database
      for (const row of formProducts) {
        if (row.id) {
          const currentProd = catalogProducts.find((p) => String(p.id) === String(row.id))
          const nextCost = Number(row.newCost || 0)
          const oldCost = Number(row.oldCost || 0)

          // Persist cost change log into PostgreSQL cost_change_logs table
          adminCostChangeLogAPI.create({
            productId: row.id,
            productName: pName(row),
            oldCost: oldCost,
            newCost: nextCost,
            adjustmentType: 'MANUAL',
            adjustmentValue: nextCost - oldCost,
            reason: formReference || `Cost Change Doc ${formCode}`,
            changedBy: 'Admin',
          }).catch(() => {})

          if (currentProd) {
            saveProductExtendedMeta(row.id || row.code, {
              cost: nextCost,
              averageCost: nextCost,
              lastCostChangeRef: formCode,
            })
            adminProductAPI.update(row.id, {
              ...currentProd,
              cost: nextCost,
              averageCost: nextCost,
            }).catch(() => {})
          }
        }
      }

      // 2. Persist Document Record
      const newDoc = {
        id: editingId || `cc-${Date.now()}`,
        code: formCode,
        date: formDate,
        outlet: formOutlet,
        location: formLocation,
        reference: formReference || '—',
        changeBy: 'Admin / Sys',
        amount: calculatedGrandTotal,
        linesCount: formProducts.length,
        items: formProducts,
      }

      let updatedList = []
      if (editingId) {
        updatedList = costChangeList.map((item) => (item.id === editingId ? newDoc : item))
      } else {
        updatedList = [newDoc, ...costChangeList]
      }

      setCostChangeList(updatedList)
      saveCostChangeRecords(updatedList)

      addNotification({
        type: 'product',
        action: 'edit',
        title: lang === 'en' ? 'Cost change applied' : 'បានអនុវត្តការប្តូរចំណាយ',
        detail: `Code: ${formCode} · Total: $${calculatedGrandTotal.toFixed(2)} (${formProducts.length} items)`,
      })

      setToast({
        tone: 'green',
        message: t(`✓ Successfully saved cost change ${formCode}!`, `✓ បានរក្សាទុកការប្តូរចំណាយ ${formCode} ដោយជោគជ័យ!`),
      })

      setViewMode('list')
      // Open printable document note immediately
      setPrintDocData(preparePrintDocData(newDoc))
    } catch {
      setToast({ tone: 'orange', message: t('Failed to save cost change.', 'ការរក្សាទុកបានបរាជ័យ។') })
    } finally {
      setSaving(false)
    }
  }

  const promptDeleteRecord = (id, code) => {
    setConfirmAction({
      title: { en: 'Delete Cost Change', kh: 'លុបកំណត់ត្រាប្តូរចំណាយ' },
      message: {
        en: `Are you sure you want to delete cost change record "${code}"?`,
        kh: `តើអ្នកពិតជាចង់លុបកំណត់ត្រាប្តូរចំណាយ "${code}" មែនទេ?`,
      },
      confirmText: { en: 'Confirm Delete', kh: 'យល់ព្រមលុប' },
      cancelText: { en: 'Cancel', kh: 'បោះបង់' },
      type: 'danger',
      onConfirm: () => {
        setCostChangeList((prev) => {
          const next = prev.filter((it) => String(it.id) !== String(id))
          saveCostChangeRecords(next)
          return next
        })
        setConfirmAction(null)
        setToast({ tone: 'slate', message: t('Record deleted.', 'បានលុបកំណត់ត្រា។') })
      },
    })
  }

  if (pageLoading) {
    return <PageLoader loading={true} message={t('Loading Cost Change…', 'កំពុងផ្ទុកការប្តូរចំណាយ…')} />
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
         PAGE 1: COST CHANGE LIST VIEW
         ========================================================================= */}
      {viewMode === 'list' && (
        <div className="space-y-6">
          {/* Header & Breadcrumb */}
          <div className="flex items-center justify-between">
            <nav className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-400">
              <Link to="/admin/products" className="text-slate-400 transition hover:text-[#7EB631] flex items-center gap-1.5">
                <span>📦</span>
                <span>{t('Stocks', 'ស្តុក')}</span>
              </Link>
              <span className="text-slate-600">&gt;</span>
              <span className="text-[#7EB631]">{t('Cost Change', 'ប្តូរចំណាយ')}</span>
            </nav>

            <Link
              to="/admin/products"
              className="inline-flex items-center gap-2 rounded-xl border border-slate-700/80 bg-slate-900/80 px-3.5 py-1.5 text-xs font-bold text-slate-300 transition hover:border-[#7EB631] hover:bg-slate-800 hover:text-white"
            >
              <span className="text-sm">←</span>
              <span>{t('Back to Stocks', 'ត្រឡប់ទៅស្តុក')}</span>
            </Link>
          </div>

          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between rounded-2xl border border-slate-800/80 bg-[#243040]/70 backdrop-blur-md p-5 shadow-lg shadow-black/20">
            <div className="flex items-center gap-4">
              <Link
                to="/admin/products"
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-slate-700/80 bg-slate-950/60 text-slate-400 transition hover:border-[#7EB631] hover:text-green-300 hover:scale-105 active:scale-95"
                title={t('Back to Stocks', 'ត្រឡប់ទៅស្តុក')}
              >
                <ChevronLeftIcon />
              </Link>
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-[#7EB631] to-green-600 shadow-lg shadow-green-500/20">
                <img src={dollarIcon} alt="" className="h-7 w-7 object-contain drop-shadow" />
              </div>
              <div>
                <h1 className="text-xl font-black tracking-tight text-white font-['Montserrat']">
                  {t('Cost Change', 'ការផ្លាស់ប្តូរចំណាយ')}
                </h1>
                <p className="text-xs text-slate-400 font-['Montserrat']">
                  {t('Add, view and new your cost change in one place', 'បន្ថែម មើល និងកែប្រែការប្តូរចំណាយទំនិញនៅកន្លែងតែមួយ')}
                </p>
              </div>
            </div>

            {/* + Create Button */}
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={openCreatePage}
                className="inline-flex items-center gap-2 rounded-xl bg-[#7EB631] px-5 py-2.5 text-xs font-black text-slate-950 shadow-lg shadow-green-600/25 transition hover:brightness-110 active:scale-95"
              >
                <span className="text-sm font-black">+</span>
                <span>{t('Create', 'បង្កើតថ្មី')}</span>
              </button>
            </div>
          </div>

          {/* "Search Cost Change" Section */}
          <div className="rounded-2xl border border-slate-800/80 bg-slate-900/80 p-5 shadow-lg shadow-black/20 space-y-4">
            <div className="flex items-center gap-3">
              <div className="h-6 w-1.5 rounded-full bg-[#7EB631]" />
              <div>
                <h2 className="text-sm font-bold text-white uppercase tracking-wider font-['Montserrat']">
                  {t('Search Cost Change', 'ស្វែងរកការប្តូរចំណាយ')}
                </h2>
                <p className="text-[11px] text-slate-400">
                  {t('Search cost change by any condition. Ex(Any, Code...)', 'ស្វែងរកការប្តូរចំណាយតាមលក្ខខណ្ឌណាមួយ ឧ. (ទាំងអស់, កូដ...)')}
                </p>
              </div>
            </div>

            {/* Search Input Row */}
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 pt-2">
              <div className="sm:col-span-6 relative">
                <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 text-xs">
                  🔍
                </span>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={t('Search here', 'ស្វែងរកនៅទីនេះ...')}
                  className="w-full rounded-xl border border-slate-700/80 bg-slate-950/70 py-2.5 pl-9 pr-3 text-xs font-medium text-white placeholder-slate-500 outline-none transition focus:border-[#7EB631]"
                />
              </div>

              <div className="sm:col-span-4">
                <select
                  value={searchBy}
                  onChange={(e) => setSearchBy(e.target.value)}
                  className="w-full rounded-xl border border-slate-700/80 bg-slate-950/70 px-3.5 py-2.5 text-xs font-bold text-white outline-none focus:border-[#7EB631]"
                >
                  <option value="any">{t('Search By: Any', 'ស្វែងរកដោយ: ទាំងអស់')}</option>
                  <option value="code">{t('Search By: Code', 'ស្វែងរកដោយ: កូដ')}</option>
                </select>
              </div>

              <div className="sm:col-span-2">
                <button
                  type="button"
                  className="w-full rounded-xl bg-slate-800 border border-slate-700 py-2.5 text-xs font-bold text-white transition hover:bg-slate-700"
                >
                  {t('Search', 'ស្វែងរក')}
                </button>
              </div>
            </div>

            {/* Advance Filter Toggle Button */}
            <div className="flex justify-end pt-1">
              <button
                type="button"
                onClick={() => setShowAdvanceFilter(!showAdvanceFilter)}
                className={`inline-flex items-center gap-1.5 rounded-xl border px-3.5 py-1.5 text-xs font-bold transition ${
                  showAdvanceFilter
                    ? 'border-[#7EB631] bg-[#7EB631]/20 text-green-300'
                    : 'border-slate-700 bg-slate-950 text-slate-400 hover:text-white'
                }`}
              >
                <span>⚡</span>
                <span>{t('Advance Filter', 'តម្រងកម្រិតខ្ពស់')}</span>
              </button>
            </div>

            {/* Advance Filter Panel (Change By Date Range) */}
            {showAdvanceFilter && (
              <div className="rounded-xl border border-slate-800 bg-slate-950/80 p-4 space-y-3">
                <label className="text-xs font-bold uppercase tracking-wider text-[#7EB631] block">
                  {t('Change By (Date Range Filter)', 'ប្តូរតាម (ចន្លោះកាលបរិច្ឆេទ)')}
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-xl">
                  <div>
                    <label className="text-[11px] font-bold text-slate-400 block mb-1">
                      {t('From Date', 'ចាប់ពីថ្ងៃ')}
                    </label>
                    <input
                      type="date"
                      value={fromDate}
                      onChange={(e) => setFromDate(e.target.value)}
                      className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-xs font-semibold text-white outline-none focus:border-[#7EB631]"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-slate-400 block mb-1">
                      {t('To Date', 'រហូតដល់ថ្ងៃ')}
                    </label>
                    <input
                      type="date"
                      value={toDate}
                      onChange={(e) => setToDate(e.target.value)}
                      className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-xs font-semibold text-white outline-none focus:border-[#7EB631]"
                    />
                  </div>
                </div>

                {(fromDate || toDate) && (
                  <div className="flex justify-end">
                    <button
                      type="button"
                      onClick={() => {
                        setFromDate('')
                        setToDate('')
                      }}
                      className="text-xs text-amber-400 hover:underline font-bold"
                    >
                      {t('Clear Date Filter', 'សម្អាតតម្រងថ្ងៃ')}
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* "Cost Change List" Section */}
          <div className="rounded-2xl border border-slate-800/80 bg-slate-900/80 p-5 shadow-lg shadow-black/20 space-y-4">
            {/* Header + Actions */}
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-3">
                <div className="h-6 w-1.5 rounded-full bg-[#243040]" />
                <div>
                  <h2 className="text-sm font-bold text-white uppercase tracking-wider font-['Montserrat']">
                    {t('Cost change list', 'បញ្ជីផ្លាស់ប្តូរចំណាយ')}
                  </h2>
                  <p className="text-[11px] text-slate-400">
                    {t('Show information of cost change', 'បង្ហាញព័ត៌មានលម្អិតនៃការផ្លាស់ប្តូរចំណាយ')}
                  </p>
                </div>
              </div>

              {/* Action Buttons Top Right: Column Toggle & Export */}
              <div className="flex items-center gap-2.5">
                <button
                  type="button"
                  onClick={() => {
                    setDraftCols(new Set(visibleCols))
                    setColModalOpen(true)
                  }}
                  className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-700 bg-slate-950/60 text-slate-300 transition hover:border-slate-500 hover:bg-slate-800 hover:text-white"
                  title={t('Toggle Columns', 'ជ្រើសរើសជួរឈរ')}
                >
                  ⚙️
                </button>
                <button
                  type="button"
                  onClick={exportListExcel}
                  className="inline-flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-950/60 px-3.5 py-2 text-xs font-bold text-slate-200 transition hover:bg-slate-800 hover:text-white"
                >
                  📊 {t('Export', 'នាំចេញ Excel')}
                </button>
              </div>
            </div>

            {/* Cost Change Table */}
            <div className="overflow-x-auto rounded-xl border border-slate-800/80 bg-slate-950/50">
              <table className="w-full min-w-[760px] text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-800 bg-[#243040]/80 text-[11px] font-bold uppercase tracking-wider text-slate-300">
                    {visibleCols.has('code') && (
                      <th
                        onClick={() => handleSort('code')}
                        className="px-4 py-3 cursor-pointer hover:text-white select-none"
                      >
                        {t('Code', 'កូដ')} <SortIcon field="code" currentField={sortField} currentDir={sortDirection} />
                      </th>
                    )}
                    {visibleCols.has('date') && (
                      <th
                        onClick={() => handleSort('date')}
                        className="px-4 py-3 cursor-pointer hover:text-white select-none"
                      >
                        {t('Date', 'កាលបរិច្ឆេទ')} <SortIcon field="date" currentField={sortField} currentDir={sortDirection} />
                      </th>
                    )}
                    {visibleCols.has('amount') && (
                      <th
                        onClick={() => handleSort('amount')}
                        className="px-4 py-3 cursor-pointer hover:text-white select-none text-right"
                      >
                        {t('Amount', 'ទឹកប្រាក់ ($)')} <SortIcon field="amount" currentField={sortField} currentDir={sortDirection} />
                      </th>
                    )}
                    {visibleCols.has('reference') && (
                      <th
                        onClick={() => handleSort('reference')}
                        className="px-4 py-3 cursor-pointer hover:text-white select-none"
                      >
                        {t('Reference', 'លេខយោង')} <SortIcon field="reference" currentField={sortField} currentDir={sortDirection} />
                      </th>
                    )}
                    {visibleCols.has('changeBy') && (
                      <th
                        onClick={() => handleSort('changeBy')}
                        className="px-4 py-3 cursor-pointer hover:text-white select-none"
                      >
                        {t('Change By', 'អ្នកកែប្រែ')} <SortIcon field="changeBy" currentField={sortField} currentDir={sortDirection} />
                      </th>
                    )}
                    <th className="w-24 px-4 py-3 text-center">{t('Action', 'សកម្មភាព')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {filteredCostChanges.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-14 text-center">
                        <div className="mx-auto flex flex-col items-center justify-center space-y-2">
                          <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-dashed border-slate-700 bg-slate-900/60 text-2xl text-slate-500">
                            🔍
                          </div>
                          <h4 className="text-sm font-black uppercase tracking-wider text-slate-300">
                            {t('NOT FOUND', 'រកមិនឃើញ')}
                          </h4>
                          <p className="text-[11px] text-slate-500 max-w-sm">
                            {costChangeList.length === 0
                              ? t('No cost change records yet. Click "+ Create" to make a new one.', 'មិនទាន់មានកំណត់ត្រាប្តូរចំណាយនៅឡើយទេ។')
                              : t('No cost changes match your search or date filter.', 'គ្មានទិន្នន័យត្រូវនឹងតម្រងស្វែងរកទេ។')}
                          </p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    filteredCostChanges.map((row) => (
                      <tr key={row.id} className="hover:bg-slate-900/40 transition-colors">
                        {visibleCols.has('code') && (
                          <td className="px-4 py-3 font-mono font-bold text-[#7EB631]">
                            {row.code || '—'}
                          </td>
                        )}
                        {visibleCols.has('date') && (
                          <td className="px-4 py-3 font-medium text-slate-300">
                            {formatDisplayDate(row.date)}
                          </td>
                        )}
                        {visibleCols.has('amount') && (
                          <td className="px-4 py-3 font-mono font-bold text-right text-amber-300">
                            ${Number(row.amount || 0).toFixed(2)}
                          </td>
                        )}
                        {visibleCols.has('reference') && (
                          <td className="px-4 py-3 font-mono text-slate-400">
                            {row.reference || '—'}
                          </td>
                        )}
                        {visibleCols.has('changeBy') && (
                          <td className="px-4 py-3 text-slate-300">
                            <span className="inline-flex items-center gap-1 rounded-md bg-slate-800 px-2 py-0.5 text-[11px] font-semibold text-slate-300">
                              👤 {row.changeBy || 'Admin'}
                            </span>
                          </td>
                        )}
                        <td className="px-4 py-3 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => setPrintDocData(preparePrintDocData(row))}
                              className="rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-800 hover:text-white"
                              title={t('Print Cost Change Note', 'បោះពុម្ពប័ណ្ណប្តូរចំណាយ')}
                            >
                              🖨️
                            </button>
                            <button
                              type="button"
                              onClick={() => openEditPage(row)}
                              className="rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-800 hover:text-white"
                              title={t('Edit / View', 'កែប្រែ / មើល')}
                            >
                              ✏️
                            </button>
                            <button
                              type="button"
                              onClick={() => promptDeleteRecord(row.id, row.code)}
                              className="rounded-lg p-1.5 text-slate-500 transition hover:bg-red-500/20 hover:text-red-300"
                              title={t('Delete', 'លុប')}
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

            {/* List Footer Count */}
            <div className="flex items-center justify-between pt-2 text-xs text-slate-400 font-mono">
              <span>{t('Total Records:', 'កំណត់ត្រាសរុប:')} {filteredCostChanges.length}</span>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
         PAGE 2: CREATE / EDIT COST CHANGE VIEW
         ========================================================================= */}
      {(viewMode === 'create' || viewMode === 'edit') && (
        <div className="space-y-6">
          {/* Top Navigation & Actions */}
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
                {t('Cost Change', 'ប្តូរចំណាយ')}
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
              <span>{t('Back to Cost Change List', 'ត្រឡប់ទៅបញ្ជីប្តូរចំណាយ')}</span>
            </button>
          </div>

          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between rounded-2xl border border-slate-800/80 bg-[#243040]/70 backdrop-blur-md p-5 shadow-lg shadow-black/20">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setViewMode('list')}
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-700/80 bg-slate-950/60 text-slate-400 transition hover:border-[#7EB631] hover:text-green-300 hover:scale-105 active:scale-95"
                title={t('Back to Cost Change List', 'ត្រឡប់ទៅបញ្ជីប្តូរចំណាយ')}
              >
                <ChevronLeftIcon />
              </button>
              <div>
                <h1 className="text-xl font-black tracking-tight text-white font-['Montserrat']">
                  {viewMode === 'create' ? t('Create Cost Change', 'បង្កើតការប្តូរចំណាយថ្មី') : t('Edit Cost Change', 'កែប្រែការប្តូរចំណាយ')}
                </h1>
                <p className="text-xs text-slate-400 font-['Montserrat']">
                  {t('Input information and new unit costs for inventory products', 'បញ្ចូលព័ត៌មាន និងចំណាយថ្លៃដើមថ្មីសម្រាប់ផលិតផល')}
                </p>
              </div>
            </div>

            {/* Print Note, Cancel & Save Action */}
            <div className="flex items-center gap-2.5">
              <button
                type="button"
                disabled={formProducts.length === 0}
                onClick={() => {
                  const tempDoc = {
                    code: formCode,
                    date: formDate,
                    outlet: formOutlet,
                    location: formLocation,
                    reference: formReference || '—',
                    items: formProducts,
                  }
                  setPrintDocData(preparePrintDocData(tempDoc))
                }}
                className="inline-flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2 text-xs font-bold text-slate-200 transition hover:border-[#7EB631] hover:text-white disabled:opacity-40"
              >
                <span>🖨️</span>
                <span>{t('Print Note', 'បោះពុម្ព')}</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode('list')}
                className="rounded-xl border border-slate-700 bg-slate-950 px-4 py-2 text-xs font-bold text-slate-300 transition hover:border-slate-500 hover:bg-slate-800 hover:text-white"
              >
                {t('Cancel', 'បោះបង់')}
              </button>
              <button
                type="button"
                disabled={saving || formProducts.length === 0}
                onClick={handleSaveCostChange}
                className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#7EB631] to-green-600 px-6 py-2.5 text-xs font-black text-slate-950 shadow-lg shadow-green-600/20 transition hover:brightness-110 active:scale-95 disabled:cursor-not-allowed disabled:opacity-40"
              >
                {saving ? (
                  <>
                    <span className="h-3 w-3 rounded-full border-2 border-slate-950 border-t-transparent animate-spin" />
                    {t('Saving…', 'កំពុងរក្សាទុក…')}
                  </>
                ) : (
                  <>💾 {t('Save & Print', 'រក្សាទុក & បោះពុម្ព')}</>
                )}
              </button>
            </div>
          </div>

          {/* "General Information" Section */}
          <div className="rounded-2xl border border-slate-800/80 bg-slate-900/80 p-5 shadow-lg shadow-black/20 space-y-4">
            <div className="flex items-center gap-3">
              <div className="h-6 w-1.5 rounded-full bg-[#7EB631]" />
              <div>
                <h2 className="text-sm font-bold text-white uppercase tracking-wider font-['Montserrat']">
                  {t('General Information', 'ព័ត៌មានទូទៅ')}
                </h2>
                <p className="text-[11px] text-slate-400">
                  {t('Input information for cost change', 'បញ្ចូលព័ត៌មានសម្រាប់ការប្តូរចំណាយ')}
                </p>
              </div>
            </div>

            {/* Row 1: Code | Date | Outlet */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1.5">
                  {t('Code', 'កូដ')} <span className="text-slate-500 font-normal">({t('Auto', 'ស្វ័យប្រវត្តិ')})</span>
                </label>
                <input
                  type="text"
                  readOnly
                  value={formCode}
                  placeholder="AUTO GENERATE CODE"
                  className="w-full rounded-xl border border-slate-800 bg-slate-950/40 px-3.5 py-2.5 text-xs font-mono font-bold text-green-400 cursor-not-allowed outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1.5">
                  {t('Date', 'កាលបរិច្ឆេទ')} <span className="text-[#E69D32]">*</span>
                </label>
                <div className="relative">
                  <input
                    type="datetime-local"
                    value={formDate}
                    onChange={(e) => setFormDate(e.target.value)}
                    className="w-full rounded-xl border border-slate-700/80 bg-slate-950/70 px-3.5 py-2.5 text-xs font-semibold text-white outline-none focus:border-[#7EB631]"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1.5">
                  {t('Outlet', 'សាខា')} <span className="text-[#E69D32]">*</span>
                </label>
                <select
                  value={formOutlet}
                  onChange={(e) => setFormOutlet(e.target.value)}
                  className="w-full rounded-xl border border-slate-700/80 bg-slate-950/70 px-3.5 py-2.5 text-xs font-semibold text-white outline-none focus:border-[#7EB631]"
                >
                  <option value="MAIN-OUTLET">MAIN-OUTLET (Warehouse Hyperstore)</option>
                  <option value="BKK1-BRANCH">BKK1-BRANCH (Boeng Keng Kang)</option>
                  <option value="TOUL-KORK-BRANCH">TOUL-KORK-BRANCH</option>
                  <option value="CHBAR-AMPOV-BRANCH">CHBAR-AMPOV-BRANCH</option>
                </select>
              </div>
            </div>

            {/* Row 2: Location | Reference */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1.5">
                  {t('Location', 'ទីតាំង')}
                </label>
                <select
                  value={formLocation}
                  onChange={(e) => setFormLocation(e.target.value)}
                  className="w-full rounded-xl border border-slate-700/80 bg-slate-950/70 px-3.5 py-2.5 text-xs font-semibold text-white outline-none focus:border-[#7EB631]"
                >
                  <option value="DEFAULT-LOC">DEFAULT-LOC (Main Storage Floor)</option>
                  <option value="WAREHOUSE-A">WAREHOUSE-A (Bulk Pallet)</option>
                  <option value="COLD-ROOM-01">COLD-ROOM-01 (Chilled / Meat)</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1.5">
                  {t('Reference', 'លេខយោង')}
                </label>
                <input
                  type="text"
                  value={formReference}
                  onChange={(e) => setFormReference(e.target.value)}
                  placeholder="e.g. REF-SUPPLIER-PRICE-HIKE"
                  className="w-full rounded-xl border border-slate-700/80 bg-slate-950/70 px-3.5 py-2.5 text-xs font-semibold text-white placeholder-slate-500 outline-none focus:border-[#7EB631]"
                />
              </div>
            </div>

            {/* Product Code Scanner Input */}
            <div className="pt-2 border-t border-slate-800/80">
              <form onSubmit={handleScannerSubmit} className="flex gap-2 max-w-xl">
                <div className="relative flex-1">
                  <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 text-xs">
                    🔍
                  </span>
                  <input
                    ref={scannerInputRef}
                    type="text"
                    value={scannerCode}
                    onChange={(e) => setScannerCode(e.target.value)}
                    placeholder={t('Hint: Product code here (press Enter to add)', 'ស្កេន ឬវាយកូដផលិតផលនៅទីនេះ (ចុច Enter)...')}
                    className="w-full rounded-xl border border-slate-700/80 bg-slate-950/90 py-2.5 pl-9 pr-3 text-xs font-semibold text-white placeholder-slate-500 outline-none transition focus:border-[#7EB631] focus:ring-2 focus:ring-[#7EB631]/20"
                  />

                  {/* Live Matched Products Popup with Picture */}
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
                              setToast({ tone: 'green', message: t(`✓ Added "${pName(p)}"`, `✓ បានបន្ថែម "${pName(p)}"`) })
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
                                  Code: <span className="text-green-300">{p.code || '—'}</span> · Cost:{' '}
                                  <span className="text-amber-300">${Number(p.averageCost ?? p.cost ?? 0).toFixed(2)}</span>
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
                  <span>📷</span>
                  <span>{t('Scan / Add', 'ស្កេន / បន្ថែម')}</span>
                </button>
              </form>
            </div>
          </div>

          {/* "Product" Section */}
          <div className="rounded-2xl border border-slate-800/80 bg-slate-900/80 p-5 shadow-lg shadow-black/20 space-y-4">
            {/* Header + Top Right Actions (Import & Add) */}
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-3">
                <div className="h-6 w-1.5 rounded-full bg-[#243040]" />
                <div>
                  <h2 className="text-sm font-bold text-white uppercase tracking-wider font-['Montserrat']">
                    {t('Product', 'ផលិតផល')}
                  </h2>
                  <p className="text-[11px] text-slate-400">
                    {t('Input product for cost change', 'បញ្ចូលផលិតផលសម្រាប់ការផ្លាស់ប្តូរចំណាយ')}
                  </p>
                </div>
              </div>

              {/* Action buttons top right: bulk import & Add Product */}
              <div className="flex items-center gap-2.5">
                <button
                  type="button"
                  onClick={() => {
                    setToast({ tone: 'slate', message: t('Bulk Excel import template ready.', 'ទម្រង់នាំចូល Excel រួចរាល់។') })
                  }}
                  className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-700 bg-slate-950/60 text-slate-300 transition hover:border-slate-500 hover:bg-slate-800 hover:text-white"
                  title={t('Import from File', 'នាំចូលពីឯកសារ')}
                >
                  📥
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setPickerSearch('')
                    setPickerSelectedIds(new Set())
                    setPickerModalOpen(true)
                  }}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-[#7EB631] px-4 py-2 text-xs font-bold text-slate-950 shadow-md shadow-green-600/20 transition hover:brightness-110 active:scale-95"
                >
                  + {t('Add Product', 'បន្ថែមផលិតផល')}
                </button>
              </div>
            </div>

            {/* Product Table */}
            <div className="overflow-x-auto rounded-xl border border-slate-800/80 bg-slate-950/50">
              <table className="w-full min-w-[840px] text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-800 bg-[#243040]/80 text-[11px] font-bold uppercase tracking-wider text-slate-300">
                    <th className="w-14 px-3 py-3 text-center">{t('Picture', 'រូបភាព')}</th>
                    <th className="px-4 py-3">{t('Code', 'កូដ')}</th>
                    <th className="px-4 py-3">{t('Barcode', 'បារកូដ')}</th>
                    <th className="px-4 py-3">{t('Description', 'ការពិពណ៌នា')}</th>
                    <th className="w-24 px-4 py-3 text-right">{t('QTY', 'ចំនួន')}</th>
                    <th className="px-4 py-3">{t('UOM', 'ខ្នាត')}</th>
                    <th className="px-4 py-3 text-right">{t('Old Cost', 'ចំណាយចាស់')}</th>
                    <th className="w-32 px-4 py-3 text-right">{t('New Cost', 'ចំណាយថ្មី')}</th>
                    <th className="px-4 py-3 text-right">{t('New Total Cost', 'សរុបចំណាយថ្មី')}</th>
                    <th className="w-14 px-4 py-3 text-center">{t('Action', 'សកម្មភាព')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {formProducts.length === 0 ? (
                    <tr>
                      <td colSpan={10} className="py-14 text-center">
                        <div className="mx-auto flex flex-col items-center justify-center space-y-2">
                          <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-dashed border-slate-700 bg-slate-900/60 text-2xl text-slate-500">
                            🔍
                          </div>
                          <h4 className="text-sm font-black uppercase tracking-wider text-slate-300">
                            {t('NOT FOUND', 'រកមិនឃើញ')}
                          </h4>
                          <p className="text-[11px] text-slate-500 max-w-sm">
                            {t('No product lines added yet. Scan a barcode above or click "+ Add Product".', 'មិនទាន់មានផលិតផលនៅឡើយទេ។ ស្កេនបារកូដ ឬចុច "+ បន្ថែមផលិតផល"។')}
                          </p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    formProducts.map((row) => {
                      const totalRow = Number(row.qty || 0) * Number(row.newCost || 0)
                      return (
                        <tr key={row.id} className="hover:bg-slate-900/40 transition-colors">
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
                          <td className="px-4 py-3 font-mono text-slate-400 align-middle">
                            {row.barcode || '—'}
                          </td>
                          <td className="px-4 py-3 align-middle">
                            <div className="font-bold text-white">{row.name}</div>
                            {row.nameKh !== '—' && (
                              <div className="text-[11px] text-slate-400">{row.nameKh}</div>
                            )}
                          </td>
                          <td className="px-4 py-2 text-right align-middle">
                            <input
                              type="number"
                              min="1"
                              step="1"
                              value={row.qty}
                              onChange={(e) => updateFormProductRow(row.id, 'qty', e.target.value)}
                              className="w-20 rounded-lg border border-slate-700 bg-slate-900 px-2 py-1 text-right font-mono font-bold text-white outline-none focus:border-[#7EB631]"
                            />
                          </td>
                          <td className="px-4 py-3 font-medium text-slate-300 align-middle">
                            {row.uom || 'Unit'}
                          </td>
                          <td className="px-4 py-3 font-mono text-right text-slate-400 align-middle">
                            ${Number(row.oldCost || 0).toFixed(2)}
                          </td>
                          <td className="px-4 py-2 text-right align-middle">
                            <input
                              type="number"
                              min="0"
                              step="0.01"
                              value={row.newCost}
                              onChange={(e) => updateFormProductRow(row.id, 'newCost', e.target.value)}
                              className="w-28 rounded-lg border border-[#7EB631]/80 bg-slate-900 px-2.5 py-1 text-right font-mono font-bold text-green-300 outline-none focus:ring-1 focus:ring-[#7EB631]"
                            />
                          </td>
                          <td className="px-4 py-3 font-mono font-bold text-right text-amber-300 align-middle">
                            ${totalRow.toFixed(2)}
                          </td>
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
                      )
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Footer Row: Total Lines (Left) & New Total Cost Sum (Right) */}
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between pt-3 border-t border-slate-800">
              <div className="flex items-center gap-3">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  {t('Total', 'សរុប')}:
                </span>
                <span className="inline-flex items-center rounded-lg border border-slate-700 bg-slate-950 px-3 py-1 text-xs font-black font-mono text-[#7EB631]">
                  {formProducts.length} {formProducts.length === 1 ? 'Line' : 'Lines'}
                </span>
              </div>

              <div className="flex items-center gap-3">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  {t('New Total Cost', 'សរុបចំណាយថ្មី')}:
                </span>
                <span className="text-base font-black font-mono text-amber-300">
                  ${calculatedGrandTotal.toFixed(2)}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
         MODAL 1: CHOOSE COLUMNS (LIST VIEW)
         ========================================================================= */}
      <Modal
        open={colModalOpen}
        onClose={() => setColModalOpen(false)}
        title={t('Choose Columns - Cost Change', 'ជ្រើសរើសជួរឈរ - ប្តូរចំណាយ')}
      >
        <div className="space-y-4 text-xs">
          <p className="text-slate-400">
            {t('Choose columns you want to display on the Cost Change table:', 'ជ្រើសរើសជួរឈរដែលអ្នកចង់បង្ហាញក្នុងតារាងប្តូរចំណាយ៖')}
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 py-2">
            {[
              { key: 'code', label: 'Code' },
              { key: 'date', label: 'Date' },
              { key: 'amount', label: 'Amount' },
              { key: 'reference', label: 'Reference' },
              { key: 'changeBy', label: 'Change By' },
            ].map((col) => {
              const isChecked = draftCols.has(col.key)
              return (
                <label
                  key={col.key}
                  className="flex items-center gap-3 rounded-xl border border-slate-800 bg-slate-950/60 p-3 cursor-pointer hover:border-slate-700 transition"
                >
                  <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={() => {
                      const next = new Set(draftCols)
                      if (next.has(col.key)) next.delete(col.key)
                      else next.add(col.key)
                      setDraftCols(next)
                    }}
                    className="rounded text-[#7EB631] focus:ring-[#7EB631] h-4 w-4"
                  />
                  <span className="font-bold text-white">{col.label}</span>
                </label>
              )
            })}
          </div>

          <div className="flex justify-end gap-3 border-t border-slate-800 pt-4">
            <button
              type="button"
              onClick={() => setColModalOpen(false)}
              className="rounded-xl border border-slate-700 bg-slate-950 px-4 py-2 text-xs font-bold text-slate-300 transition hover:bg-slate-800"
            >
              {t('Cancel', 'បោះបង់')}
            </button>
            <button
              type="button"
              onClick={() => {
                setVisibleCols(new Set(draftCols))
                setColModalOpen(false)
              }}
              className="rounded-xl bg-[#7EB631] px-5 py-2 text-xs font-black text-slate-950 transition hover:brightness-110"
            >
              {t('Apply', 'អនុវត្ត')}
            </button>
          </div>
        </div>
      </Modal>

      {/* =========================================================================
         MODAL 2: ADD PRODUCT PICKER (CREATE / EDIT VIEW)
         ========================================================================= */}
      <Modal
        open={pickerModalOpen}
        onClose={() => setPickerModalOpen(false)}
        title={t('Search Product for Cost Change', 'ស្វែងរកផលិតផលដើម្បីប្តូរចំណាយ')}
        maxWidth="max-w-3xl"
      >
        <div className="space-y-4 text-xs text-slate-200">
          <div className="relative">
            <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 text-xs">
              🔍
            </span>
            <input
              type="text"
              autoFocus
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
                              In Document
                            </span>
                          )}
                        </div>
                        <p className="font-mono text-[11px] text-slate-400">
                          Code: <span className="text-green-300">{p.code || '—'}</span> · Current Cost:{' '}
                          <span className="text-amber-300">${Number(p.averageCost ?? p.cost ?? 0).toFixed(2)}</span>
                        </p>
                      </div>
                    </div>

                    <div className="text-right shrink-0 ml-3 font-mono font-bold text-xs text-slate-300">
                      ${Number(p.basePrice ?? 0).toFixed(2)}
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

      {/* Printable Cost Change Note Document Overlay */}
      {printDocData && (
        <CostChangeNotePrint
          {...printDocData}
          onClose={() => setPrintDocData(null)}
        />
      )}
    </div>
  )
}

export default CostChangeSection
