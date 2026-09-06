import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import * as XLSX from 'xlsx'
import { useLanguage } from '../../context/LanguageContext'
import { useNotifications } from '../../context/NotificationContext'
import {
  adminProductAPI,
  adminProductGroupAPI,
  adminCategoryAPI,
  adminBrandAPI,
  adminSupplierAPI,
  adminUnitAPI,
  adminAttributeChangeLogAPI,
} from '../../api/api'
import { COUNTRIES } from '../../data/countries'
import { PageLoader } from '../../components/PageLoader'
import toggleIcon from '../../assets/icon/3dicons-toggle-dynamic-color.png'
import { Modal, ConfirmModal } from './stockUI'
import { enrichProductList, saveProductExtendedMeta } from '../../utils/productMeta'
import { exportStyledExcel } from '../../utils/excelExport'

const pName = (p) => (typeof p?.name === 'object' ? p.name?.en : p?.name) || `#${p?.id}`
const pNameKh = (p) => (typeof p?.name === 'object' ? p.name?.kh : p?.nameKh || p?.name_kh || p?.secondLanguage || '—')

const ChevronLeftIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="15 18 9 12 15 6" />
  </svg>
)

export const ChangeAttributeSection = () => {
  const { lang } = useLanguage()
  const { addNotification } = useNotifications()
  const navigate = useNavigate()
  const t = (en, kh) => (lang === 'en' ? en : kh)

  // Master Data
  const [catalogProducts, setCatalogProducts] = useState([])
  const [groups, setGroups] = useState([])
  const [categories, setCategories] = useState([])
  const [brands, setBrands] = useState([])
  const [suppliers, setSuppliers] = useState([])
  const [units, setUnits] = useState([])
  const [pageLoading, setPageLoading] = useState(true)

  // Section 1: General Information
  const [reference, setReference] = useState(() => `ATTR-${Date.now().toString().slice(-6)}`)

  // Section 2: Attribute of Product Information
  const [attributeRows, setAttributeRows] = useState([])
  const [tableSearch, setTableSearch] = useState('')

  // Modal: Search Product State
  const [searchModalOpen, setSearchModalOpen] = useState(false)
  const [modalSearch, setModalSearch] = useState('')
  const [modalSearchBy, setModalSearchBy] = useState('any') // 'any' | 'code' | 'barcode' | 'description'
  const [showAdvanceFilter, setShowAdvanceFilter] = useState(false)

  // Modal Advance Filters
  const [filterGroup, setFilterGroup] = useState('')
  const [filterBrand, setFilterBrand] = useState('')
  const [filterCategory, setFilterCategory] = useState('')
  const [filterCountry, setFilterCountry] = useState('')
  const [filterSupplier, setFilterSupplier] = useState('')
  const [filterTag, setFilterTag] = useState('')

  // Modal Selection
  const [selectedModalIds, setSelectedModalIds] = useState(() => new Set())

  // UI States
  const [toast, setToast] = useState(null)
  const [confirmAction, setConfirmAction] = useState(null)
  const [saving, setSaving] = useState(false)

  // Load master data
  useEffect(() => {
    Promise.all([
      adminProductAPI.getAll().catch(() => ({ data: [] })),
      adminProductGroupAPI.getAll().catch(() => ({ data: [] })),
      adminCategoryAPI.getAll().catch(() => ({ data: [] })),
      adminBrandAPI.getAll().catch(() => ({ data: [] })),
      adminSupplierAPI.getAll().catch(() => ({ data: [] })),
      adminUnitAPI.getAll().catch(() => ({ data: [] })),
    ]).then(([pRes, gRes, cRes, bRes, sRes, uRes]) => {
      const rawProds = Array.isArray(pRes?.data) ? pRes.data : []
      const enriched = enrichProductList(rawProds)
      setCatalogProducts(enriched)
      setGroups(Array.isArray(gRes?.data) ? gRes.data : [])
      setCategories(Array.isArray(cRes?.data) ? cRes.data : [])
      setBrands(Array.isArray(bRes?.data) ? bRes.data : [])
      setSuppliers(Array.isArray(sRes?.data) ? sRes.data : [])
      setUnits(Array.isArray(uRes?.data) ? uRes.data : [])

      // Initial demo attribute rows if desired
      if (enriched.length > 0) {
        const initial = enriched.slice(0, 3).map((p) => ({
          ...p,
          remark: p.remark || p.tags || '',
        }))
        setAttributeRows(initial)
      }
    }).finally(() => setPageLoading(false))
  }, [])

  // Auto-dismiss toast
  useEffect(() => {
    if (!toast) return
    const timer = setTimeout(() => setToast(null), 3500)
    return () => clearTimeout(timer)
  }, [toast])

  /* ---------- Filtered Attribute Table Rows ---------- */
  const filteredAttributeRows = useMemo(() => {
    const q = tableSearch.trim().toLowerCase()
    if (!q) return attributeRows
    return attributeRows.filter((p) => {
      const code = String(p.code || '').toLowerCase()
      const nameEn = String(pName(p)).toLowerCase()
      const nameKh = String(pNameKh(p)).toLowerCase()
      const uom = String(p.uom || '').toLowerCase()
      const remark = String(p.remark || '').toLowerCase()
      return (
        code.includes(q) ||
        nameEn.includes(q) ||
        nameKh.includes(q) ||
        uom.includes(q) ||
        remark.includes(q)
      )
    })
  }, [attributeRows, tableSearch])

  /* ---------- Filtered Modal Catalog Products ---------- */
  const modalFilteredProducts = useMemo(() => {
    const q = modalSearch.trim().toLowerCase()
    return catalogProducts.filter((p) => {
      // Search input filter
      if (q) {
        const code = String(p.code || '').toLowerCase()
        const barcode = String(p.barCode || p.barcode || '').toLowerCase()
        const nameEn = String(pName(p)).toLowerCase()
        const nameKh = String(pNameKh(p)).toLowerCase()

        if (modalSearchBy === 'code' && !code.includes(q)) return false
        if (modalSearchBy === 'barcode' && !barcode.includes(q)) return false
        if (modalSearchBy === 'description' && !nameEn.includes(q) && !nameKh.includes(q)) return false
        if (
          modalSearchBy === 'any' &&
          !code.includes(q) &&
          !barcode.includes(q) &&
          !nameEn.includes(q) &&
          !nameKh.includes(q)
        ) {
          return false
        }
      }

      // Advance filters
      if (filterGroup) {
        const pGrp = String(p.productGroup || '').toLowerCase()
        if (pGrp !== filterGroup.toLowerCase() && !pGrp.includes(filterGroup.toLowerCase())) return false
      }
      if (filterBrand) {
        const pBr = String(p.brand || '').toLowerCase()
        if (pBr !== filterBrand.toLowerCase() && !pBr.includes(filterBrand.toLowerCase())) return false
      }
      if (filterCategory) {
        const pCat = String(p.category || '').toLowerCase()
        if (pCat !== filterCategory.toLowerCase() && !pCat.includes(filterCategory.toLowerCase())) return false
      }
      if (filterCountry) {
        const pCtry = String(p.country || '').toLowerCase()
        if (pCtry !== filterCountry.toLowerCase() && !pCtry.includes(filterCountry.toLowerCase())) return false
      }
      if (filterSupplier) {
        const pSup = String(p.supplier || '').toLowerCase()
        if (pSup !== filterSupplier.toLowerCase() && !pSup.includes(filterSupplier.toLowerCase())) return false
      }
      if (filterTag) {
        const pTag = String(p.tags || '').toLowerCase()
        if (!pTag.includes(filterTag.toLowerCase())) return false
      }

      return true
    })
  }, [
    catalogProducts,
    modalSearch,
    modalSearchBy,
    filterGroup,
    filterBrand,
    filterCategory,
    filterCountry,
    filterSupplier,
    filterTag,
  ])

  /* ---------- Modal Actions ---------- */
  const openAddModal = () => {
    setModalSearch('')
    setSelectedModalIds(new Set())
    setSearchModalOpen(true)
  }

  const toggleSelectModalProduct = (id) => {
    const next = new Set(selectedModalIds)
    if (next.has(id)) next.delete(id)
    else next.add(id)
    setSelectedModalIds(next)
  }

  const toggleSelectAllModal = () => {
    if (selectedModalIds.size === modalFilteredProducts.length) {
      setSelectedModalIds(new Set())
    } else {
      setSelectedModalIds(new Set(modalFilteredProducts.map((p) => p.id)))
    }
  }

  const confirmAddSelectedToAttributes = () => {
    if (selectedModalIds.size === 0) {
      setToast({ tone: 'orange', message: t('Please select at least one product.', 'សូមជ្រើសរើសផលិតផលយ៉ាងហោចណាស់មួយ។') })
      return
    }

    const toAdd = catalogProducts.filter((p) => selectedModalIds.has(p.id))
    const nextList = [...attributeRows]
    let addedCount = 0

    toAdd.forEach((p) => {
      if (!nextList.some((it) => String(it.id) === String(p.id))) {
        nextList.push({
          ...p,
          remark: p.remark || p.tags || '',
        })
        addedCount++
      }
    })

    setAttributeRows(nextList)
    setSearchModalOpen(false)
    setToast({
      tone: 'green',
      message: t(`✓ Added ${addedCount} product(s) to Attribute Information`, `✓ បានបន្ថែម ${addedCount} ផលិតផលទៅក្នុងព័ត៌មានលក្ខណៈ`),
    })
  }

  /* ---------- Main Page Handlers ---------- */
  const handleUpdateRemark = (id, newRemark) => {
    setAttributeRows((prev) =>
      prev.map((item) => (String(item.id) === String(id) ? { ...item, remark: newRemark } : item))
    )
  }

  const promptRemoveRow = (id, name) => {
    setAttributeRows((prev) => prev.filter((it) => String(it.id) !== String(id)))
    setToast({ tone: 'slate', message: t('Removed product from attribute table.', 'បានដកផលិតផលចេញ។') })
  }

  const promptResetTable = () => {
    setConfirmAction({
      title: { en: 'Reset Attribute Table', kh: 'កំណត់តារាងលក្ខណៈឡើងវិញ' },
      message: {
        en: 'Are you sure you want to clear all product rows from the attribute table?',
        kh: 'តើអ្នកពិតជាចង់សម្អាតជួរផលិតផលទាំងអស់ចេញពីតារាងលក្ខណៈមែនទេ?',
      },
      confirmText: { en: 'Reset All', kh: 'កំណត់ឡើងវិញ' },
      cancelText: { en: 'Cancel', kh: 'បោះបង់' },
      type: 'danger',
      onConfirm: () => {
        setAttributeRows([])
        setTableSearch('')
        setToast({ tone: 'orange', message: t('Attribute table cleared.', 'បានសម្អាតតារាងលក្ខណៈ។') })
      },
    })
  }

  const handleSaveAttributeChanges = async () => {
    if (attributeRows.length === 0) {
      setToast({ tone: 'orange', message: t('No attribute rows to save.', 'មិនមានជួរលក្ខណៈសម្រាប់រក្សាទុកទេ។') })
      return
    }

    setSaving(true)
    try {
      // Persist extended metadata & updates for each product row and log in database
      for (const row of attributeRows) {
        if (row.id) {
          adminAttributeChangeLogAPI.create({
            productId: row.id,
            productName: pName(row),
            attributeName: 'Remark / Tags',
            oldValue: row.oldRemark || row.tags || '—',
            newValue: row.remark || row.tags || '—',
            reason: reference,
            changedBy: 'Admin',
          }).catch(() => {})
        }

        saveProductExtendedMeta(row.id || row.code, {
          remark: row.remark,
          tags: row.remark || row.tags,
          lastAttributeChangeRef: reference,
        })
        if (row.id) {
          adminProductAPI.update(row.id, {
            ...row,
            tags: row.remark || row.tags,
          }).catch(() => {})
        }
      }

      addNotification({
        type: 'product',
        action: 'edit',
        title: lang === 'en' ? 'Attributes updated' : 'បានធ្វើបច្ចុប្បន្នភាពលក្ខណៈ',
        detail: `Reference: ${reference} (${attributeRows.length} items)`,
      })

      setToast({
        tone: 'green',
        message: t(`✓ Successfully saved attributes for ${attributeRows.length} product(s)!`, `✓ បានរក្សាទុកការផ្លាស់ប្តូរលក្ខណៈសម្រាប់ ${attributeRows.length} ផលិតផលដោយជោគជ័យ!`),
      })
    } catch {
      setToast({ tone: 'orange', message: t('Failed to save attributes.', 'ការរក្សាទុកបានបរាជ័យ។') })
    } finally {
      setSaving(false)
    }
  }

  const exportExcel = () => {
    const headers = ['Code', 'Description', 'Second Language', 'Onhand', 'UOM', 'Base Price ($)', 'Remark', 'Reference']
    const rows = filteredAttributeRows.map((p) => [
      p.code || '—',
      pName(p),
      pNameKh(p),
      Number(p.onHand ?? 0).toFixed(2),
      p.uom || '—',
      Number(p.basePrice ?? 0).toFixed(2),
      p.remark || '—',
      reference || '—',
    ])
    exportStyledExcel({
      filename: `change-attributes-${reference || 'all'}.xlsx`,
      sheetName: 'Change Attributes',
      title: 'PRODUCT ATTRIBUTE CHANGE LIST',
      subtitle: `Reference: ${reference || 'General'} · Total Rows: ${rows.length}`,
      headers,
      data: rows,
    })
  }

  if (pageLoading) {
    return <PageLoader loading={true} message={t('Loading Change Attribute…', 'កំពុងផ្ទុកការផ្លាស់ប្តូរលក្ខណៈ…')} />
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

      {/* Confirmation Modal */}
      {confirmAction && (
        <ConfirmModal
          open={!!confirmAction}
          onClose={() => setConfirmAction(null)}
          onConfirm={() => {
            const fn = confirmAction.onConfirm
            setConfirmAction(null)
            fn?.()
          }}
          {...confirmAction}
        />
      )}

      {/* Breadcrumb & Go Back to Stocks */}
      <div className="flex items-center justify-between">
        <nav className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-400">
          <Link to="/admin/products" className="text-slate-400 transition hover:text-[#7EB631] flex items-center gap-1.5">
            <span>📦</span>
            <span>{t('Stocks', 'ស្តុក')}</span>
          </Link>
          <span className="text-slate-600">/</span>
          <span className="text-[#7EB631]">{t('Change Attribute', 'ផ្លាស់ប្តូរលក្ខណៈ')}</span>
        </nav>

        <Link
          to="/admin/products"
          className="inline-flex items-center gap-2 rounded-xl border border-slate-700/80 bg-slate-900/80 px-3.5 py-1.5 text-xs font-bold text-slate-300 transition hover:border-[#7EB631] hover:bg-slate-800 hover:text-white"
        >
          <span className="text-sm">←</span>
          <span>{t('Back to Stocks', 'ត្រឡប់ទៅស្តុក')}</span>
        </Link>
      </div>

      {/* Header Banner */}
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
            <img src={toggleIcon} alt="" className="h-7 w-7 object-contain drop-shadow" />
          </div>
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-xl font-black tracking-tight text-white font-['Montserrat']">
                {t('Change Attribute', 'ផ្លាស់ប្តូរលក្ខណៈផលិតផល')}
              </h1>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-green-500/40 bg-[#7EB631]/10 px-2.5 py-0.5 text-[11px] font-bold text-green-300">
                <span className="h-1.5 w-1.5 rounded-full bg-[#7EB631] animate-pulse" />
                {t('Live Manager', 'កម្មវិធីគ្រប់គ្រង')}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5 font-['Montserrat']">
              {t(
                'Update, adjust and manage custom attributes and metadata across stock items',
                'កែសម្រួល ផ្លាស់ប្តូរ និងគ្រប់គ្រងលក្ខណៈពិសេសរបស់ទំនិញក្នុងស្តុក'
              )}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={exportExcel}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-900/80 px-3.5 py-2 text-xs font-bold text-slate-200 transition hover:bg-slate-800 hover:text-white"
          >
            📊 {t('Export Excel', 'នាំចេញ Excel')}
          </button>
        </div>
      </div>

      {/* =========================================================================
         1. GENERAL INFORMATION SECTION
         ========================================================================= */}
      <div className="rounded-2xl border border-slate-800/80 bg-slate-900/80 p-5 shadow-lg shadow-black/20 space-y-4">
        {/* Section Header with Small Accent Bar */}
        <div className="flex items-center gap-3">
          <div className="h-6 w-1.5 rounded-full bg-[#7EB631]" />
          <div>
            <h2 className="text-sm font-bold text-white uppercase tracking-wider font-['Montserrat']">
              {t('General Information', 'ព័ត៌មានទូទៅ')}
            </h2>
            <p className="text-[11px] text-slate-400">
              {t('Set reference code for this attribute update session', 'កំណត់លេខយោងសម្រាប់ការផ្លាស់ប្តូរលក្ខណៈនេះ')}
            </p>
          </div>
        </div>

        {/* Reference Input Field */}
        <div className="max-w-md pt-2">
          <label className="block text-xs font-bold text-slate-300 mb-1.5">
            {t('Reference', 'លេខយោង')} <span className="text-[#E69D32]">*</span>
          </label>
          <input
            type="text"
            value={reference}
            onChange={(e) => setReference(e.target.value)}
            placeholder="e.g. ATTR-2026-001"
            className="w-full rounded-xl border border-slate-700/80 bg-slate-950/70 px-3.5 py-2.5 text-xs font-bold text-white placeholder-slate-500 outline-none transition focus:border-[#7EB631] focus:ring-2 focus:ring-[#7EB631]/20"
          />
        </div>
      </div>

      {/* =========================================================================
         2. ATTRIBUTE OF PRODUCT INFORMATION SECTION
         ========================================================================= */}
      <div className="rounded-2xl border border-slate-800/80 bg-slate-900/80 p-5 shadow-lg shadow-black/20 space-y-4">
        {/* Section Header + Actions */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="h-6 w-1.5 rounded-full bg-[#243040]" />
            <div>
              <h2 className="text-sm font-bold text-white uppercase tracking-wider font-['Montserrat']">
                {t('Attribute of Product Information', 'ព័ត៌មានលក្ខណៈផលិតផល')}
              </h2>
              <p className="text-[11px] text-slate-400">
                {t(
                  'Manage and update attributes across selected inventory items',
                  'គ្រប់គ្រង និងធ្វើបច្ចុប្បន្នភាពលក្ខណៈផលិតផលក្នុងតារាង'
                )}
              </p>
            </div>
          </div>

          {/* Top Right Actions: Reset & Add */}
          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={promptResetTable}
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-950/60 px-4 py-2 text-xs font-bold text-slate-300 transition hover:border-slate-500 hover:bg-slate-800 hover:text-white"
            >
              🔄 {t('Reset', 'កំណត់ឡើងវិញ')}
            </button>
            <button
              type="button"
              onClick={openAddModal}
              className="inline-flex items-center gap-1.5 rounded-xl bg-[#7EB631] px-4 py-2 text-xs font-bold text-slate-950 shadow-md shadow-green-600/20 transition hover:brightness-110 active:scale-95"
            >
              + {t('Add', 'បន្ថែម')}
            </button>
          </div>
        </div>

        {/* Search Bar: "Search here" */}
        <div className="relative max-w-md">
          <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 text-xs">
            🔍
          </span>
          <input
            type="text"
            value={tableSearch}
            onChange={(e) => setTableSearch(e.target.value)}
            placeholder={t('Search here', 'ស្វែងរកនៅទីនេះ...')}
            className="w-full rounded-xl border border-slate-700/80 bg-slate-950/70 py-2 pl-9 pr-8 text-xs font-medium text-white placeholder-slate-500 outline-none transition focus:border-[#7EB631] focus:ring-2 focus:ring-[#7EB631]/20"
          />
          {tableSearch && (
            <button
              type="button"
              onClick={() => setTableSearch('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-500 hover:text-white"
            >
              ✕
            </button>
          )}
        </div>

        {/* Attribute Table */}
        <div className="overflow-x-auto rounded-xl border border-slate-800/80 bg-slate-950/50">
          <table className="w-full min-w-[720px] text-left text-xs">
            <thead>
              <tr className="border-b border-slate-800 bg-[#243040]/80 text-[11px] font-bold uppercase tracking-wider text-slate-300">
                <th className="px-4 py-3">{t('Code', 'កូដ')}</th>
                <th className="px-4 py-3">{t('Description', 'ការពិពណ៌នា')}</th>
                <th className="px-4 py-3">{t('Onhand', 'ស្តុកនៅសល់')}</th>
                <th className="px-4 py-3">{t('UOM', 'ខ្នាត')}</th>
                <th className="px-4 py-3">{t('Remark', 'ចំណាំ / លក្ខណៈ')}</th>
                <th className="w-16 px-4 py-3 text-center">{t('Action', 'សកម្មភាព')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredAttributeRows.length === 0 ? (
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
                        {attributeRows.length === 0
                          ? t(
                              'No product rows added yet. Click "+ Add" above to search and select products.',
                              'មិនទាន់មានទំនិញក្នុងតារាងនៅឡើយទេ។ ចុច "+ បន្ថែម" ខាងលើដើម្បីជ្រើសរើស។'
                            )
                          : t(
                              'No products match your current search query.',
                              'គ្មានផលិតផលត្រូវនឹងពាក្យស្វែងរករបស់អ្នកទេ។'
                            )}
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredAttributeRows.map((row) => (
                  <tr key={row.id} className="hover:bg-slate-900/40 transition-colors">
                    <td className="px-4 py-3 font-mono font-bold text-[#7EB631]">
                      {row.code || '—'}
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-bold text-white">{pName(row)}</div>
                      {pNameKh(row) !== '—' && (
                        <div className="text-[11px] text-slate-400">{pNameKh(row)}</div>
                      )}
                    </td>
                    <td className="px-4 py-3 font-mono font-bold text-green-400">
                      {Number(row.onHand ?? 0).toFixed(2)}
                    </td>
                    <td className="px-4 py-3 font-medium text-slate-300">
                      {row.uom || 'Unit'}
                    </td>
                    <td className="px-4 py-2">
                      <input
                        type="text"
                        value={row.remark || ''}
                        onChange={(e) => handleUpdateRemark(row.id, e.target.value)}
                        placeholder={t('Add remark or attribute note...', 'បន្ថែមចំណាំ ឬលក្ខណៈ...')}
                        className="w-full rounded-lg border border-slate-700/80 bg-slate-900/80 px-2.5 py-1.5 text-xs text-white placeholder-slate-500 outline-none transition focus:border-[#7EB631] focus:ring-1 focus:ring-[#7EB631]/30"
                      />
                    </td>
                    <td className="px-4 py-3 text-center">
                      <button
                        type="button"
                        onClick={() => promptRemoveRow(row.id, pName(row))}
                        className="rounded-lg p-1.5 text-slate-500 transition hover:bg-red-500/20 hover:text-red-300"
                        title={t('Remove from table', 'ដកចេញ')}
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

        {/* Footer Row: Total + Line Count & Save Action */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between pt-3 border-t border-slate-800">
          <div className="flex items-center gap-3">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              {t('Total', 'សរុប')}:
            </span>
            <span className="inline-flex items-center rounded-lg border border-slate-700 bg-slate-950 px-3 py-1 text-xs font-black font-mono text-[#7EB631]">
              {attributeRows.length} {attributeRows.length === 1 ? 'Line' : 'Lines'}
            </span>
          </div>

          <button
            type="button"
            disabled={saving || attributeRows.length === 0}
            onClick={handleSaveAttributeChanges}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#7EB631] to-green-600 px-6 py-2.5 text-xs font-black text-slate-950 shadow-lg shadow-green-600/20 transition hover:brightness-110 active:scale-95 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {saving ? (
              <>
                <span className="h-3 w-3 rounded-full border-2 border-slate-950 border-t-transparent animate-spin" />
                {t('Saving Changes…', 'កំពុងរក្សាទុក…')}
              </>
            ) : (
              <>💾 {t('Save Attribute Changes', 'រក្សាទុកការផ្លាស់ប្តូរលក្ខណៈ')}</>
            )}
          </button>
        </div>
      </div>

      {/* =========================================================================
         SEARCH PRODUCT MODAL (OPENS WHEN "ADD" IS CLICKED)
         ========================================================================= */}
      <Modal
        open={searchModalOpen}
        onClose={() => setSearchModalOpen(false)}
        title={t('Search Product', 'ស្វែងរកផលិតផល')}
        maxWidth="max-w-4xl"
      >
        <div className="space-y-4 text-xs text-slate-200">
          <p className="text-xs text-slate-400 -mt-2">
            {t(
              'Search product by any condition. Ex(Any, Code, Description...)',
              'ស្វែងរកផលិតផលតាមលក្ខខណ្ឌណាមួយ ឧ. (ទាំងអស់, កូដ, ការពិពណ៌នា...)'
            )}
          </p>

          {/* Search Header Row */}
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 rounded-2xl border border-slate-800 bg-[#243040]/60 p-3.5">
            {/* Search Input: "Search here" */}
            <div className="sm:col-span-5 relative">
              <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-xs">
                🔍
              </span>
              <input
                type="text"
                autoFocus
                value={modalSearch}
                onChange={(e) => setModalSearch(e.target.value)}
                placeholder={t('Search here', 'ស្វែងរកនៅទីនេះ...')}
                className="w-full rounded-xl border border-slate-700 bg-slate-950 py-2 pl-8 pr-3 text-xs font-semibold text-white placeholder-slate-500 outline-none focus:border-[#7EB631]"
              />
            </div>

            {/* Search By */}
            <div className="sm:col-span-4">
              <select
                value={modalSearchBy}
                onChange={(e) => setModalSearchBy(e.target.value)}
                className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-xs font-bold text-white outline-none focus:border-[#7EB631]"
              >
                <option value="any">{t('Search By: Any', 'ស្វែងរកដោយ: ទាំងអស់')}</option>
                <option value="code">{t('Search By: Code', 'ស្វែងរកដោយ: កូដ')}</option>
                <option value="barcode">{t('Search By: Barcode', 'ស្វែងរកដោយ: បារកូដ')}</option>
                <option value="description">{t('Search By: Description', 'ស្វែងរកដោយ: ការពិពណ៌នា')}</option>
              </select>
            </div>

            {/* Advance Filter Button */}
            <div className="sm:col-span-3">
              <button
                type="button"
                onClick={() => setShowAdvanceFilter(!showAdvanceFilter)}
                className={`flex w-full items-center justify-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-bold transition ${
                  showAdvanceFilter
                    ? 'border-[#7EB631] bg-[#7EB631]/20 text-green-300'
                    : 'border-slate-700 bg-slate-950 text-slate-300 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <span>⚡</span>
                <span className="truncate">{t('Advance Filter', 'តម្រងកម្រិតខ្ពស់')}</span>
              </button>
            </div>
          </div>

          {/* Advance Filter Panel (6 Dropdowns) */}
          {showAdvanceFilter && (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 rounded-2xl border border-slate-800 bg-slate-900/90 p-4 shadow-inner">
              {/* 1. Product Group */}
              <div>
                <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                  {t('Product Group', 'ក្រុមផលិតផល')}
                </label>
                <select
                  value={filterGroup}
                  onChange={(e) => setFilterGroup(e.target.value)}
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-1.5 text-xs text-white outline-none focus:border-[#7EB631]"
                >
                  <option value="">{t('All Groups', 'គ្រប់ក្រុម')}</option>
                  {groups.map((g) => (
                    <option key={g.id} value={g.description || g.name || g.code}>
                      {(lang === 'kh' && g.nameKh) ? g.nameKh : (g.description || g.name || g.code)}
                    </option>
                  ))}
                </select>
              </div>

              {/* 2. Brand */}
              <div>
                <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                  {t('Brand', 'ម៉ាក')}
                </label>
                <select
                  value={filterBrand}
                  onChange={(e) => setFilterBrand(e.target.value)}
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-1.5 text-xs text-white outline-none focus:border-[#7EB631]"
                >
                  <option value="">{t('All Brands', 'គ្រប់ម៉ាក')}</option>
                  {brands.map((b) => (
                    <option key={b.id} value={b.description || b.name || b.code}>
                      {(lang === 'kh' && b.nameKh) ? b.nameKh : (b.description || b.name || b.code)}
                    </option>
                  ))}
                </select>
              </div>

              {/* 3. Category */}
              <div>
                <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                  {t('Category', 'ប្រភេទ')}
                </label>
                <select
                  value={filterCategory}
                  onChange={(e) => setFilterCategory(e.target.value)}
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-1.5 text-xs text-white outline-none focus:border-[#7EB631]"
                >
                  <option value="">{t('All Categories', 'គ្រប់ប្រភេទ')}</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.description || c.code}>
                      {(lang === 'kh' && c.nameKh) ? c.nameKh : (c.description || c.code)}
                    </option>
                  ))}
                </select>
              </div>

              {/* 4. Country */}
              <div>
                <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                  {t('Country', 'ប្រទេស')}
                </label>
                <select
                  value={filterCountry}
                  onChange={(e) => setFilterCountry(e.target.value)}
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-1.5 text-xs text-white outline-none focus:border-[#7EB631]"
                >
                  <option value="">{t('All Countries', 'គ្រប់ប្រទេស')}</option>
                  {COUNTRIES.map((ctry) => (
                    <option key={ctry.code} value={ctry.name}>
                      {ctry.name} {ctry.nameKh ? `(${ctry.nameKh})` : ''}
                    </option>
                  ))}
                </select>
              </div>

              {/* 5. Supplier */}
              <div>
                <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                  {t('Supplier', 'អ្នកផ្គត់ផ្គង់')}
                </label>
                <select
                  value={filterSupplier}
                  onChange={(e) => setFilterSupplier(e.target.value)}
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-1.5 text-xs text-white outline-none focus:border-[#7EB631]"
                >
                  <option value="">{t('All Suppliers', 'គ្រប់អ្នកផ្គត់ផ្គង់')}</option>
                  {suppliers.map((s) => (
                    <option key={s.id} value={s.name}>
                      {s.name} {s.nameKh ? `(${s.nameKh})` : ''}
                    </option>
                  ))}
                </select>
              </div>

              {/* 6. Tags */}
              <div>
                <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                  {t('Tags', 'ស្លាក')}
                </label>
                <select
                  value={filterTag}
                  onChange={(e) => setFilterTag(e.target.value)}
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-1.5 text-xs text-white outline-none focus:border-[#7EB631]"
                >
                  <option value="">{t('All Tags', 'គ្រប់ស្លាក')}</option>
                  <option value="New">New</option>
                  <option value="Organic">Organic</option>
                  <option value="Promo">Promo</option>
                  <option value="Best seller">Best seller</option>
                </select>
              </div>
            </div>
          )}

          {/* Product List By Outlet: MAIN-OUTLET */}
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <div>
              <h4 className="text-xs font-black uppercase tracking-wider text-[#7EB631]">
                {t('Product List By Outlet :', 'បញ្ជីផលិតផលតាមសាខា :')}{' '}
                <span className="text-white">MAIN-OUTLET</span>
              </h4>
              <p className="text-[11px] text-slate-400">
                {t(
                  'Show information of product. Ex(Code, Description, Onhand...)',
                  'បង្ហាញព័ត៌មានផលិតផល ឧ. (កូដ, ការពិពណ៌នា, ស្តុក...)'
                )}
              </p>
            </div>

            <button
              type="button"
              onClick={toggleSelectAllModal}
              className="text-xs font-bold text-[#7EB631] hover:underline"
            >
              {selectedModalIds.size === modalFilteredProducts.length && modalFilteredProducts.length > 0
                ? t('Deselect All', 'ដោះការជ្រើសរើស')
                : t(`Select All (${modalFilteredProducts.length})`, `ជ្រើសរើសទាំងអស់`)}
            </button>
          </div>

          {/* Modal Product Table */}
          <div className="max-h-80 overflow-y-auto rounded-xl border border-slate-800 bg-slate-950/60 divide-y divide-slate-800/60">
            {modalFilteredProducts.length === 0 ? (
              <div className="p-10 text-center text-xs font-semibold text-slate-400">
                {t('No products matching filter criteria.', 'មិនមានផលិតផលត្រូវនឹងលក្ខខណ្ឌទេ។')}
              </div>
            ) : (
              modalFilteredProducts.map((p) => {
                const isSelected = selectedModalIds.has(p.id)
                const alreadyInTable = attributeRows.some((it) => String(it.id) === String(p.id))
                return (
                  <div
                    key={p.id}
                    onClick={() => toggleSelectModalProduct(p.id)}
                    className={`flex items-center justify-between p-3 transition cursor-pointer ${
                      isSelected
                        ? 'bg-[#7EB631]/20 text-green-200'
                        : 'hover:bg-slate-900/60 text-slate-200'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => {}} // handled by row onClick
                        className="rounded text-[#7EB631] focus:ring-[#7EB631] h-4 w-4"
                      />
                      {p.imageUrl ? (
                        <img
                          src={p.imageUrl}
                          alt=""
                          className="h-9 w-9 rounded-lg object-cover ring-1 ring-slate-700 shrink-0"
                          onError={(e) => {
                            e.currentTarget.style.display = 'none'
                          }}
                        />
                      ) : (
                        <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-800 text-xs shrink-0">
                          🥫
                        </span>
                      )}
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-white text-xs truncate">{pName(p)}</span>
                          {alreadyInTable && (
                            <span className="rounded bg-[#7EB631]/20 px-1.5 py-0.2 text-[9px] font-bold text-[#7EB631]">
                              In Table
                            </span>
                          )}
                        </div>
                        <p className="font-mono text-[11px] text-slate-400">
                          Code: <span className="text-green-300">{p.code || '—'}</span> · Barcode:{' '}
                          <span className="text-slate-300">{p.barCode || p.barcode || '—'}</span> · UOM:{' '}
                          <span className="text-slate-300">{p.uom || 'Unit'}</span>
                        </p>
                      </div>
                    </div>

                    <div className="text-right shrink-0 ml-3">
                      <div className="font-mono font-bold text-xs text-green-400">
                        {Number(p.onHand ?? 0).toFixed(2)} {p.uom || 'Unit'}
                      </div>
                      <div className="text-[11px] font-mono text-slate-400">
                        ${Number(p.basePrice ?? 0).toFixed(2)}
                      </div>
                    </div>
                  </div>
                )
              })
            )}
          </div>

          {/* Modal Footer: Create (left, orange) / Cancel & Ok (right) */}
          <div className="flex items-center justify-between pt-3 border-t border-slate-800">
            {/* Create Button (Left, Orange #E69D32) */}
            <button
              type="button"
              onClick={() => {
                setSearchModalOpen(false)
                navigate('/admin/products/add')
              }}
              className="inline-flex items-center gap-1.5 rounded-xl bg-[#E69D32] px-4 py-2 text-xs font-black text-slate-950 shadow-md shadow-amber-600/20 transition hover:brightness-110 active:scale-95"
            >
              + {t('Create', 'បង្កើតថ្មី')}
            </button>

            {/* Right: Cancel and Ok buttons */}
            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={() => setSearchModalOpen(false)}
                className="rounded-xl border border-slate-700 bg-slate-950 px-4 py-2 text-xs font-bold text-slate-300 transition hover:border-slate-500 hover:bg-slate-800 hover:text-white"
              >
                {t('Cancel', 'បោះបង់')}
              </button>
              <button
                type="button"
                onClick={confirmAddSelectedToAttributes}
                className="rounded-xl bg-[#7EB631] px-5 py-2 text-xs font-black text-slate-950 shadow-md shadow-green-600/20 transition hover:brightness-110 active:scale-95"
              >
                {t('Ok', 'យល់ព្រម')} ({selectedModalIds.size})
              </button>
            </div>
          </div>
        </div>
      </Modal>
    </div>
  )
}

export default ChangeAttributeSection
