import { useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import * as XLSX from 'xlsx'
import { useLanguage } from '../../context/LanguageContext'
import { adminProductAPI, adminProductGroupAPI, adminCategoryAPI, adminBrandAPI, adminUnitAPI, adminProductScaleAPI } from '../../api/api'
import { eanCheckDigit } from './stockStore'
import { PageLoader } from '../../components/PageLoader'
import calculatorIcon from '../../assets/icon/3dicons-calculator-dynamic-color.png'
import { SectionShell, PrimaryButton, GhostButton, Modal, Pill, ConfirmModal } from './stockUI'
import { enrichProductList, saveProductExtendedMeta } from '../../utils/productMeta'
import { exportStyledExcel } from '../../utils/excelExport'

const pName = (p) => (typeof p?.name === 'object' ? p.name?.en : p?.name) || `#${p?.id}`
const pNameKh = (p) => (typeof p?.name === 'object' ? p.name?.kh : p?.nameKh || p?.name_kh || p?.secondLanguage || '—')

/* =========================================================================
   SEARCHABLE DROPDOWN COMPONENT
   ========================================================================= */
const SearchableSelect = ({ label, required, value, onChange, options, placeholder, emptyLabel }) => {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  const ref = useRef(null)

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (ref.current && !ref.current.contains(e.target)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const filteredOptions = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return options
    return options.filter(
      (opt) =>
        opt.label.toLowerCase().includes(q) ||
        (opt.subLabel && opt.subLabel.toLowerCase().includes(q)) ||
        (opt.value && String(opt.value).toLowerCase().includes(q))
    )
  }, [options, search])

  const selectedOpt = options.find((o) => o.value === value)

  return (
    <div className="relative flex flex-col gap-1.5" ref={ref}>
      <label className="text-[11px] font-black uppercase tracking-wider text-slate-400">
        {label} {required && <span className="text-red-400">*</span>}
      </label>

      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className={`flex h-11 items-center justify-between rounded-xl border bg-slate-950/70 px-3.5 text-xs font-semibold transition ${
          open
            ? 'border-teal-500 ring-2 ring-teal-500/20'
            : 'border-slate-700/90 text-slate-200 hover:border-slate-600'
        }`}
      >
        <span className="truncate">
          {selectedOpt ? selectedOpt.label : (placeholder || 'Select...')}
        </span>
        <span className="ml-2 text-[10px] text-slate-400">▼</span>
      </button>

      {open && (
        <div className="absolute left-0 top-full z-50 mt-1.5 w-full rounded-2xl border border-slate-700 bg-slate-900 p-2 shadow-2xl backdrop-blur-xl">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search..."
            autoFocus
            className="mb-2 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-1.5 text-xs text-white placeholder-slate-500 outline-none focus:border-teal-500"
          />

          <div className="max-h-56 overflow-y-auto space-y-1 scrollbar-thin">
            {emptyLabel && (
              <button
                type="button"
                onClick={() => {
                  onChange('')
                  setOpen(false)
                  setSearch('')
                }}
                className={`flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-xs font-semibold transition ${
                  value === ''
                    ? 'bg-teal-500/20 text-teal-300'
                    : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <span>{emptyLabel}</span>
              </button>
            )}

            {filteredOptions.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => {
                  onChange(opt.value)
                  setOpen(false)
                  setSearch('')
                }}
                className={`flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-xs font-semibold transition ${
                  value === opt.value
                    ? 'bg-teal-500/20 text-teal-300'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <div className="flex flex-col">
                  <span>{opt.label}</span>
                  {opt.subLabel && <span className="text-[10px] text-slate-400 font-normal">{opt.subLabel}</span>}
                </div>
                {value === opt.value && <span className="text-teal-400 text-sm">✓</span>}
              </button>
            ))}

            {filteredOptions.length === 0 && (
              <p className="p-3 text-center text-xs text-slate-400">No matches found</p>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

/* =========================================================================
   TABLE CONFIGURATION CONSTANTS
   ========================================================================= */
const ALL_COLUMNS = [
  { key: 'code', label: { en: 'Code', kh: 'កូដ' } },
  { key: 'plu', label: { en: 'PLU', kh: 'កូដ PLU' } },
  { key: 'description', label: { en: 'Description', kh: 'ការពិពណ៌នា' } },
  { key: 'uom', label: { en: 'UOM', kh: 'ឯកតា' } },
  { key: 'expireDate', label: { en: 'Expire Date', kh: 'កាលបរិច្ឆេទផុតកំណត់' } },
  { key: 'price', label: { en: 'Price', kh: 'តម្លៃ' } },
  { key: 'noneWeight', label: { en: 'None Weight', kh: 'មិនថ្លឹង' } },
]

const DEFAULT_COLS = ['code', 'plu', 'description', 'uom', 'expireDate', 'price', 'noneWeight']

/* =========================================================================
   MAIN PRODUCT SCALE SECTION COMPONENT
   ========================================================================= */
export const ProductScaleSection = () => {
  const { lang } = useLanguage()
  const t = (en, kh) => (lang === 'en' ? en : kh)

  // Master Data
  const [catalogProducts, setCatalogProducts] = useState([])
  const [groups, setGroups] = useState([])
  const [categories, setCategories] = useState([])
  const [brands, setBrands] = useState([])
  const [units, setUnits] = useState([])
  const [loading, setLoading] = useState(true)

  // Configuration Dropdowns State (with Search)
  const [outlet, setOutlet] = useState('MAIN-OUTLET')
  const [productGroup, setProductGroup] = useState('')
  const [priceBook, setPriceBook] = useState('BASEPRICE')

  // Table Column Visibility State
  const [visibleCols, setVisibleCols] = useState(() => new Set(DEFAULT_COLS))
  const [draftCols, setDraftCols] = useState(visibleCols)
  const [colModalOpen, setColModalOpen] = useState(false)

  // Scale Products List (Active Queue)
  const [scaleList, setScaleList] = useState([])
  const [tableSearchQuery, setTableSearchQuery] = useState('')

  // Add Product Small Page / Modal State
  const [addModalOpen, setAddModalOpen] = useState(false)
  const [modalSearchQuery, setModalSearchQuery] = useState('')
  const [modalSearchBy, setModalSearchBy] = useState('any') // 'any' | 'code' | 'barcode' | 'description'
  const [modalOnhandFilter, setModalOnhandFilter] = useState('all') // 'all' | 'instock' | 'positive'
  const [showAdvanceFilter, setShowAdvanceFilter] = useState(false)
  const [modalCategoryFilter, setModalCategoryFilter] = useState('')
  const [modalBrandFilter, setModalBrandFilter] = useState('')
  const [selectedProductIds, setSelectedProductIds] = useState(() => new Set())

  // UI Feedback
  const [toast, setToast] = useState(null)
  const [confirmAction, setConfirmAction] = useState(null)

  // Fetch initial master data & backend scales
  useEffect(() => {
    Promise.all([
      adminProductAPI.getAll().catch(() => ({ data: [] })),
      adminProductGroupAPI.getAll().catch(() => ({ data: [] })),
      adminCategoryAPI.getAll().catch(() => ({ data: [] })),
      adminBrandAPI.getAll().catch(() => ({ data: [] })),
      adminUnitAPI.getAll().catch(() => ({ data: [] })),
      adminProductScaleAPI.getAll().catch(() => ({ data: [] })),
    ]).then(([pRes, gRes, cRes, bRes, uRes, sRes]) => {
      const rawProds = Array.isArray(pRes?.data) ? pRes.data : []
      const prods = enrichProductList(rawProds)
      setCatalogProducts(prods)
      setGroups(Array.isArray(gRes?.data) ? gRes.data : [])
      setCategories(Array.isArray(cRes?.data) ? cRes.data : [])
      setBrands(Array.isArray(bRes?.data) ? bRes.data : [])

      const dbScales = Array.isArray(sRes?.data) ? sRes.data : []
      if (dbScales.length > 0) {
        // Map scales from backend database
        const mapped = dbScales.map((s, idx) => {
          const matchedProd = prods.find((p) => String(p.id) === String(s.productId))
          const numCode = Number(s.pluCode) || (matchedProd ? Number(matchedProd.code) : 10001 + idx)
          const code5 = String(Math.abs(Math.trunc(numCode)) % 100000).padStart(5, '0')
          const scaleBarcode = s.scaleBarcode || `20${code5}00000${eanCheckDigit(`20${code5}00000`)}`
          return {
            ...(matchedProd || {}),
            id: matchedProd?.id || s.productId || s.id,
            scaleRecordId: s.id,
            code: matchedProd?.code || `PRD-${s.productId}`,
            pluCode: s.pluCode || code5,
            scaleBarcode,
            uom: s.uom || matchedProd?.uom || 'Kg',
            expireDays: matchedProd?.expireDays || 7,
            noneWeight: matchedProd?.noneWeight ?? false,
          }
        })
        setScaleList(mapped)
      } else {
        // Fallback: Initialize scale list with products that have scale ticked/enabled
        const scaleOnly = prods.filter((p) => p.scale === true || p.isScale === true || p.hasScale === true)
        const initial = scaleOnly.map((p, idx) => {
          const numCode = Number(p.plu) || Number(p.code) || Number(p.id) || (10001 + idx)
          const code5 = String(Math.abs(Math.trunc(numCode)) % 100000).padStart(5, '0')
          const scaleBarcode = `20${code5}00000${eanCheckDigit(`20${code5}00000`)}`
          return {
            ...p,
            pluCode: p.plu || code5,
            scaleBarcode,
            expireDays: p.expireDays || 7,
            noneWeight: !!p.noneWeight,
          }
        })
        setScaleList(initial)
      }
    }).finally(() => setLoading(false))
  }, [])

  /* ---------- Dropdown Options (with labels) ---------- */
  const outletOptions = [
    { value: 'MAIN-OUTLET', label: 'MAIN-OUTLET (Warehouse Hyperstore)', subLabel: 'Warehouse' },
    { value: 'BKK1-BRANCH', label: 'BKK1-BRANCH (Boeng Keng Kang)', subLabel: 'Branch 01' },
    { value: 'TOUL-KORK-BRANCH', label: 'TOUL-KORK-BRANCH', subLabel: 'Branch 02' },
    { value: 'CHBAR-AMPOV-BRANCH', label: 'CHBAR-AMPOV-BRANCH', subLabel: 'Branch 03' },
    { value: 'SEN-SOK-BRANCH', label: 'SEN-SOK-BRANCH', subLabel: 'Branch 04' },
  ]

  const productGroupOptions = useMemo(() => {
    return groups.map((g) => {
      const label = (lang === 'kh' && g.nameKh) ? g.nameKh : (g.description || g.name || g.code)
      const val = g.description || g.code || g.name || String(g.id)
      return { value: val, label, subLabel: g.code }
    })
  }, [groups, lang])

  const priceBookOptions = [
    { value: 'BASEPRICE', label: 'BASEPRICE (Standard Retail Price)', subLabel: 'Standard' },
    { value: 'RETAIL-DEFAULT', label: 'RETAIL-DEFAULT (Retail Counter)', subLabel: 'Counter' },
    { value: 'MEMBER-PROMO', label: 'MEMBER-PROMO (Discount Book)', subLabel: 'Discount' },
    { value: 'VIP-WHOLESALE', label: 'VIP-WHOLESALE (Tier 1)', subLabel: 'Wholesale' },
  ]

  /* ---------- Filtered Scale List ---------- */
  const filteredScaleList = useMemo(() => {
    const q = tableSearchQuery.trim().toLowerCase()
    return scaleList.filter((p) => {
      // Filter by selected Group if set
      if (productGroup) {
        const pGrp = String(p.productGroup || p.group || '').toLowerCase()
        if (pGrp !== productGroup.toLowerCase() && !pGrp.includes(productGroup.toLowerCase())) {
          return false
        }
      }
      if (!q) return true
      return (
        String(p.code || '').toLowerCase().includes(q) ||
        String(p.pluCode || '').toLowerCase().includes(q) ||
        String(pName(p)).toLowerCase().includes(q) ||
        String(pNameKh(p)).toLowerCase().includes(q) ||
        String(p.scaleBarcode || '').toLowerCase().includes(q)
      )
    })
  }, [scaleList, tableSearchQuery, productGroup])

  /* ---------- Filtered Catalog for "Add Product" Modal ---------- */
  const modalCatalogProducts = useMemo(() => {
    const q = modalSearchQuery.trim().toLowerCase()
    return catalogProducts.filter((p) => {
      // Strictly ONLY show Scale Products (scale: true / isScale: true / hasScale: true)
      if (!p.scale && !p.isScale && !p.hasScale) return false

      // Search By
      if (q) {
        const code = String(p.code || '').toLowerCase()
        const barcode = String(p.barCode || p.barcode || '').toLowerCase()
        const nameEn = String(pName(p)).toLowerCase()
        const nameKh = String(pNameKh(p)).toLowerCase()

        if (modalSearchBy === 'code' && !code.includes(q)) return false
        if (modalSearchBy === 'barcode' && !barcode.includes(q)) return false
        if (modalSearchBy === 'description' && !nameEn.includes(q) && !nameKh.includes(q)) return false
        if (modalSearchBy === 'any' && !code.includes(q) && !barcode.includes(q) && !nameEn.includes(q) && !nameKh.includes(q)) return false
      }

      // Onhand filter
      const onHand = Number(p.onHand ?? p.availableStock ?? 0)
      if (modalOnhandFilter === 'instock' && onHand <= 0) return false
      if (modalOnhandFilter === 'positive' && onHand <= 0) return false

      // Advance filters
      if (modalCategoryFilter) {
        const pCat = String(p.category || '').toLowerCase()
        if (pCat !== modalCategoryFilter.toLowerCase() && !pCat.includes(modalCategoryFilter.toLowerCase())) return false
      }
      if (modalBrandFilter) {
        const pBr = String(p.brand || '').toLowerCase()
        if (pBr !== modalBrandFilter.toLowerCase() && !pBr.includes(modalBrandFilter.toLowerCase())) return false
      }

      return true
    })
  }, [catalogProducts, modalSearchQuery, modalSearchBy, modalOnhandFilter, modalCategoryFilter, modalBrandFilter])

  /* ---------- Column Modal Handlers ---------- */
  const toggleCol = (key) => {
    const next = new Set(draftCols)
    if (next.has(key)) {
      if (next.size === 1) return
      next.delete(key)
    } else {
      next.add(key)
    }
    setDraftCols(next)
  }

  const applyColumns = () => {
    setVisibleCols(new Set(draftCols))
    setColModalOpen(false)
    setToast({ tone: 'blue', message: t('Table columns updated.', 'បានធ្វើបច្ចុប្បន្នភាពជួរឈរ។') })
  }

  const resetDefaultCols = () => {
    setDraftCols(new Set(DEFAULT_COLS))
  }

  /* ---------- Add Product Modal Actions ---------- */
  const openAddModal = () => {
    setModalSearchQuery('')
    setSelectedProductIds(new Set())
    setAddModalOpen(true)
  }

  const toggleSelectProduct = (id) => {
    const next = new Set(selectedProductIds)
    if (next.has(id)) next.delete(id)
    else next.add(id)
    setSelectedProductIds(next)
  }

  const selectAllModalProducts = () => {
    if (selectedProductIds.size === modalCatalogProducts.length) {
      setSelectedProductIds(new Set())
    } else {
      setSelectedProductIds(new Set(modalCatalogProducts.map((p) => p.id)))
    }
  }

  const confirmAddSelectedProducts = () => {
    if (selectedProductIds.size === 0) {
      setToast({ tone: 'orange', message: t('Please select at least one product.', 'សូមជ្រើសរើសយ៉ាងហោចណាស់ផលិតផលមួយ។') })
      return
    }

    const toAdd = catalogProducts.filter((p) => selectedProductIds.has(p.id))
    const nextList = [...scaleList]
    let addedCount = 0

    toAdd.forEach((p) => {
      if (!nextList.some((it) => String(it.id) === String(p.id))) {
        const numCode = Number(p.plu) || Number(p.code) || Number(p.id) || (10001 + nextList.length)
        const code5 = String(Math.abs(Math.trunc(numCode)) % 100000).padStart(5, '0')
        const scaleBarcode = `20${code5}00000${eanCheckDigit(`20${code5}00000`)}`
        const scaleItem = {
          ...p,
          scale: true,
          pluCode: p.plu || code5,
          scaleBarcode,
          expireDays: p.expireDays || 7,
          noneWeight: !!p.noneWeight,
        }
        nextList.push(scaleItem)
        addedCount++

        // Persist scale in PostgreSQL database via API
        if (p.id) {
          adminProductScaleAPI.create({
            productId: p.id,
            productName: pName(p),
            pluCode: p.plu || code5,
            scaleBarcode,
            uom: p.uom || 'Kg',
            tareWeight: 0,
            active: true,
          }).then((res) => {
            if (res?.data?.id) {
              scaleItem.scaleRecordId = res.data.id
            }
          }).catch(() => {})
        }

        // Persist scale enabled locally & on product table
        const targetKey = p.id || p.code
        saveProductExtendedMeta(targetKey, {
          scale: true,
          isScale: true,
          hasScale: true,
          plu: p.plu || code5,
          expireDays: p.expireDays || 7,
          noneWeight: !!p.noneWeight,
        })
        if (p.id) {
          adminProductAPI.update(p.id, { ...p, scale: true, plu: p.plu || code5 }).catch(() => {})
        }
      }
    })

    setScaleList(nextList)
    setAddModalOpen(false)
    setToast({
      tone: 'green',
      message: t(`✓ Added ${addedCount} product(s) to Product Scale List & Database`, `✓ បានបន្ថែមផលិតផល ${addedCount} ទៅក្នុងបញ្ជីជញ្ជីង & មូលដ្ឋានទិន្នន័យ`),
    })
  }

  /* ---------- Excel Export ---------- */
  const exportScaleExcel = () => {
    const headers = []
    if (visibleCols.has('code')) headers.push('Code')
    if (visibleCols.has('plu')) headers.push('PLU')
    if (visibleCols.has('description')) headers.push('Description')
    if (visibleCols.has('uom')) headers.push('UOM')
    if (visibleCols.has('expireDate')) headers.push('Expire Date (Day)')
    if (visibleCols.has('price')) headers.push('Price ($)')
    if (visibleCols.has('noneWeight')) headers.push('None Weight')
    headers.push('Scale Barcode')

    const rows = filteredScaleList.map((p) => {
      const row = []
      if (visibleCols.has('code')) row.push(p.code || '—')
      if (visibleCols.has('plu')) row.push(p.pluCode || '—')
      if (visibleCols.has('description')) row.push(pName(p))
      if (visibleCols.has('uom')) row.push(p.uom || 'Kg')
      if (visibleCols.has('expireDate')) row.push(p.expireDays || 7)
      if (visibleCols.has('price')) row.push(Number(p.basePrice ?? 0).toFixed(2))
      if (visibleCols.has('noneWeight')) row.push(p.noneWeight ? 'Yes' : 'No')
      row.push(p.scaleBarcode || '—')
      return row
    })

    exportStyledExcel({
      filename: 'products-scale-list.xlsx',
      sheetName: 'Product Scale',
      title: 'PRODUCT SCALE / PLU LIST REPORT',
      subtitle: `Scale Items: ${rows.length}`,
      headers,
      data: rows,
    })
  }

  const promptRemoveItem = (id, name) => {
    setConfirmAction({
      title: { en: 'Remove from Scale List', kh: 'ដកចេញពីបញ្ជីជញ្ជីង' },
      message: {
        en: `Are you sure you want to remove "${name}" from the product scale list?`,
        kh: `តើអ្នកប្រាកដជាចង់ដក "${name}" ចេញពីបញ្ជីជញ្ជីងមែនទេ?`,
      },
      confirmText: { en: 'Confirm Remove', kh: 'យល់ព្រមដកចេញ' },
      cancelText: { en: 'Cancel', kh: 'បោះបង់' },
      type: 'danger',
      onConfirm: () => {
        const target = scaleList.find((it) => String(it.id) === String(id))
        setScaleList((prev) => prev.filter((it) => String(it.id) !== String(id)))
        saveProductExtendedMeta(id, { scale: false, isScale: false, hasScale: false })

        if (target?.scaleRecordId) {
          adminProductScaleAPI.delete(target.scaleRecordId).catch(() => {})
        }
        if (id) {
          if (target) {
            adminProductAPI.update(id, { ...target, scale: false }).catch(() => {})
          }
        }
        setToast({ tone: 'slate', message: t('Item removed from scale list and database.', 'បានដកទំនិញចេញពីមូលដ្ឋានទិន្នន័យ។') })
      },
    })
  }

  if (loading) return <PageLoader loading={true} message={t('Loading Product Scale…', 'កំពុងផ្ទុកទំនិញជញ្ជីង…')} />

  return (
    <SectionShell
      icon={calculatorIcon}
      color="#14b8a6"
      title={{ en: 'Product Scale', kh: 'ទំនិញថ្លឹងជញ្ជីង' }}
      subtitle={{
        en: 'Configure electronic weigh scale PLUs, embedded barcodes, and scale catalog per outlet.',
        kh: 'កំណត់កូដ PLU ជញ្ជីងថ្លឹង បារកូដបង្កប់ និងបញ្ជីទំនិញជញ្ជីងតាមសាខា។',
      }}
      actions={
        <div className="flex flex-wrap items-center gap-2">
          {/* Choose Column Button */}
          <button
            type="button"
            onClick={() => { setDraftCols(new Set(visibleCols)); setColModalOpen(true) }}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-800/90 px-3.5 py-2 text-xs font-bold text-slate-200 shadow-md transition hover:bg-slate-700 hover:text-white"
          >
            ⚙️ {t('Choose Column', 'ជ្រើសរើសជួរឈរ')}
          </button>

          {/* Export As Excel */}
          <button
            type="button"
            onClick={exportScaleExcel}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-800/90 px-3.5 py-2 text-xs font-bold text-slate-200 shadow-md transition hover:bg-slate-700 hover:text-white"
          >
            📊 {t('Export As Excel', 'នាំចេញជា Excel')}
          </button>

          {/* Add Button */}
          <PrimaryButton onClick={openAddModal}>
            + {t('Add', 'បន្ថែម')}
          </PrimaryButton>
        </div>
      }
    >
      {/* Toast Alert */}
      {toast && (
        <div className={`flex items-center justify-between rounded-2xl border px-4 py-3 text-sm font-semibold shadow-lg ${
          toast.tone === 'green' ? 'border-green-500/40 bg-green-500/10 text-green-300' :
          toast.tone === 'blue' ? 'border-teal-500/40 bg-teal-500/10 text-teal-300' :
          toast.tone === 'orange' ? 'border-amber-500/40 bg-amber-500/10 text-amber-300' :
          'border-slate-700 bg-slate-800/80 text-slate-300'
        }`}>
          <span>{toast.message}</span>
          <button type="button" onClick={() => setToast(null)} className="text-xs opacity-70 hover:opacity-100">✕</button>
        </div>
      )}

      {/* Confirmation Modal */}
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
         1. TOP SEARCHABLE DROPDOWNS: Outlet | Product Group | Price Book (Required)
         ========================================================================= */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 rounded-3xl border border-slate-700/80 bg-slate-900/90 p-5 shadow-xl">
        {/* Outlet - Dropdown with search */}
        <SearchableSelect
          label={t('Outlet', 'សាខា')}
          value={outlet}
          onChange={setOutlet}
          options={outletOptions}
          placeholder={t('Select Outlet...', 'ជ្រើសរើសសាខា...')}
        />

        {/* Product Group - Dropdown with search */}
        <SearchableSelect
          label={t('Product Group', 'ក្រុមផលិតផល')}
          value={productGroup}
          onChange={setProductGroup}
          options={productGroupOptions}
          placeholder={t('All Groups', 'គ្រប់ក្រុមផលិតផល')}
          emptyLabel={t('All Groups (No Filter)', 'គ្រប់ក្រុមផលិតផល')}
        />

        {/* Price Book - Dropdown with search (Required) */}
        <SearchableSelect
          label={t('Price Book', 'សៀវភៅតម្លៃ')}
          required={true}
          value={priceBook}
          onChange={setPriceBook}
          options={priceBookOptions}
          placeholder={t('Select Price Book...', 'ជ្រើសរើសសៀវភៅតម្លៃ...')}
        />
      </div>

      {/* Protocol Banner & Quick Filter */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-teal-500/30 bg-teal-500/10 p-4">
        <div className="flex items-center gap-2.5">
          <span className="text-base">⚖️</span>
          <span className="text-xs text-teal-200">
            <strong>{t('Scale EAN-13 Format:', 'ទម្រង់បារកូដជញ្ជីង EAN-13:')}</strong>{' '}
            <code className="font-mono font-bold text-teal-300">20 + [5-digit PLU] + [5-digit Weight] + [Check Digit]</code>
          </span>
        </div>

        <div className="flex items-center gap-2">
          <input
            type="text"
            value={tableSearchQuery}
            onChange={(e) => setTableSearchQuery(e.target.value)}
            placeholder={t('Filter scale table...', 'ស្វែងរកក្នុងតារាងជញ្ជីង...')}
            className="w-48 sm:w-60 rounded-xl border border-slate-700 bg-slate-950 px-3 py-1.5 text-xs text-white placeholder-slate-500 outline-none focus:border-teal-400"
          />
          {tableSearchQuery && (
            <button
              type="button"
              onClick={() => setTableSearchQuery('')}
              className="text-xs text-slate-400 hover:text-white"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* =========================================================================
         2. PRODUCT SCALE LIST TABLE
         ========================================================================= */}
      <div className="overflow-hidden rounded-3xl border border-slate-700/80 bg-slate-900 shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-800 p-5">
          <div>
            <h3 className="text-base font-black text-white flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full bg-teal-400"></span>
              {t('Product Scale List', 'បញ្ជីទំនិញជញ្ជីង')} ({filteredScaleList.length})
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              {t('Active products synced with weighing scale hardware for outlet:', 'ទំនិញសកម្មតភ្ជាប់ជាមួយជញ្ជីងថ្លឹងសម្រាប់សាខា:')} <strong className="text-teal-300">{outlet}</strong>
            </p>
          </div>

          <span className="rounded-xl border border-slate-700 bg-slate-950 px-3 py-1 text-xs font-mono font-bold text-slate-300">
            {t('Price Book:', 'សៀវភៅតម្លៃ:')} <strong className="text-white">{priceBook}</strong>
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-950/60 text-xs font-bold uppercase tracking-wider text-slate-400">
                {visibleCols.has('code') && <th className="px-5 py-3.5">{t('Code', 'កូដ')}</th>}
                {visibleCols.has('plu') && <th className="px-5 py-3.5 font-mono text-teal-300">{t('PLU', 'លេខ PLU')}</th>}
                {visibleCols.has('description') && <th className="px-5 py-3.5">{t('Description', 'ការពិពណ៌នា')}</th>}
                {visibleCols.has('uom') && <th className="px-5 py-3.5">{t('UOM', 'ខ្នាត')}</th>}
                {visibleCols.has('expireDate') && <th className="px-5 py-3.5 text-center">{t('Expire Date (Day)', 'ថ្ងៃផុតកំណត់')}</th>}
                {visibleCols.has('price') && <th className="px-5 py-3.5 text-right">{t('Price', 'តម្លៃ')}</th>}
                {visibleCols.has('noneWeight') && <th className="px-5 py-3.5 text-center">{t('None Weight', 'មិនថ្លឹង')}</th>}
                <th className="px-5 py-3.5 text-center">{t('Action', 'សកម្មភាព')}</th>
              </tr>
            </thead>
            <tbody>
              {filteredScaleList.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-16 text-center text-slate-400">
                    <span className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-800 text-2xl">⚖️</span>
                    <p className="text-sm font-bold text-white">{t('No products in scale list', 'មិនទាន់មានទំនិញក្នុងបញ្ជីជញ្ជីងទេ')}</p>
                    <p className="text-xs text-slate-500 mt-1">
                      {t('Click "+ Add" button at the top to select products from catalog.', 'ចុចប៊ូតុង "+ បន្ថែម" ខាងលើ ដើម្បីជ្រើសរើសទំនិញ។')}
                    </p>
                  </td>
                </tr>
              ) : (
                filteredScaleList.map((p) => (
                  <tr key={p.id} className="border-b border-slate-800/60 transition hover:bg-slate-800/40">
                    {/* Code */}
                    {visibleCols.has('code') && (
                      <td className="px-5 py-3.5 font-mono text-xs font-bold text-slate-300">
                        {p.code || '—'}
                      </td>
                    )}

                    {/* PLU */}
                    {visibleCols.has('plu') && (
                      <td className="px-5 py-3.5 font-mono text-sm font-black text-teal-300">
                        {p.pluCode}
                      </td>
                    )}

                    {/* Description */}
                    {visibleCols.has('description') && (
                      <td className="px-5 py-3.5 font-semibold text-white">
                        <div className="flex items-center gap-3">
                          {p.imageUrl ? (
                            <img src={p.imageUrl} alt="" className="h-8 w-8 rounded-lg object-cover ring-1 ring-slate-700 shrink-0" onError={(e) => { e.currentTarget.style.display = 'none' }} />
                          ) : (
                            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-800 text-xs shrink-0">🥩</span>
                          )}
                          <div>
                            <div>{pName(p)}</div>
                            <div className="text-xs font-normal text-slate-400 font-khmer">{pNameKh(p)}</div>
                          </div>
                        </div>
                      </td>
                    )}

                    {/* UOM */}
                    {visibleCols.has('uom') && (
                      <td className="px-5 py-3.5 text-xs text-slate-300">
                        <span className="rounded-md bg-slate-800/80 px-2 py-0.5 font-semibold text-slate-200">
                          {p.uom || 'Kg'}
                        </span>
                      </td>
                    )}

                    {/* Expire Date (Day) */}
                    {visibleCols.has('expireDate') && (
                      <td className="px-5 py-3.5 text-center font-mono text-xs font-bold text-amber-300">
                        {p.expireDays ? `${p.expireDays} d` : '7 d'}
                      </td>
                    )}

                    {/* Price */}
                    {visibleCols.has('price') && (
                      <td className="px-5 py-3.5 text-right font-mono text-sm font-black text-green-300">
                        ${Number(p.basePrice ?? 0).toFixed(2)}
                      </td>
                    )}

                    {/* None Weight */}
                    {visibleCols.has('noneWeight') && (
                      <td className="px-5 py-3.5 text-center">
                        <Pill tone={p.noneWeight ? 'slate' : 'green'}>
                          {p.noneWeight ? t('Piece (Fixed)', 'ដុំ (មិនថ្លឹង)') : t('Weighed (Kg)', 'ថ្លឹង (គីឡូ)')}
                        </Pill>
                      </td>
                    )}

                    {/* Action */}
                    <td className="px-5 py-3.5 text-center">
                      <button
                        type="button"
                        onClick={() => promptRemoveItem(p.id, pName(p))}
                        className="rounded-lg p-1.5 text-slate-400 transition hover:bg-red-500/20 hover:text-red-300"
                        title={t('Remove from scale list', 'ដកចេញពីបញ្ជីជញ្ជីង')}
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
      </div>

      {/* =========================================================================
         3. CHOOSE COLUMN MODAL
         ========================================================================= */}
      <Modal
        open={colModalOpen}
        onClose={() => setColModalOpen(false)}
        title={t('Choose Column', 'ជ្រើសរើសជួរឈរ')}
      >
        <div className="space-y-4">
          <p className="text-xs text-slate-400">
            {t('Choose column you want to display on table', 'ជ្រើសរើសជួរឈរដែលអ្នកចង់បង្ហាញនៅលើតារាង')}
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {ALL_COLUMNS.map((col) => {
              const active = draftCols.has(col.key)
              return (
                <button
                  key={col.key}
                  type="button"
                  onClick={() => toggleCol(col.key)}
                  className={`flex items-center justify-between rounded-xl border p-3 text-xs font-bold transition text-left ${
                    active
                      ? 'border-teal-500/60 bg-teal-500/20 text-teal-200 shadow-md'
                      : 'border-slate-700 bg-slate-950/60 text-slate-400 hover:border-slate-600 hover:text-white'
                  }`}
                >
                  <span>{col.label[lang] || col.label.en}</span>
                  <span className={`text-base ${active ? 'text-teal-400' : 'text-slate-600'}`}>
                    {active ? '☑' : '☐'}
                  </span>
                </button>
              )
            })}
          </div>

          <div className="flex items-center justify-between border-t border-slate-800 pt-4">
            <button
              type="button"
              onClick={resetDefaultCols}
              className="text-xs font-bold text-slate-400 hover:text-white transition"
            >
              🔄 {t('Reset to Normal', 'កំណត់ឡើងវិញ')}
            </button>

            <div className="flex items-center gap-2">
              <GhostButton onClick={() => setColModalOpen(false)}>
                {t('Cancel', 'បោះបង់')}
              </GhostButton>
              <PrimaryButton onClick={applyColumns}>
                ✓ {t('Apply', 'អនុវត្ត')}
              </PrimaryButton>
            </div>
          </div>
        </div>
      </Modal>

      {/* =========================================================================
         4. ADD PRODUCT SMALL PAGE / MODAL (Search Product)
         ========================================================================= */}
      <Modal
        open={addModalOpen}
        onClose={() => setAddModalOpen(false)}
        title={t('Search Product', 'ស្វែងរកផលិតផល')}
        wide
      >
        <div className="space-y-4">
          <p className="text-xs text-slate-400 -mt-2">
            {t(
              'Search product by any condition. Ex(Any, Code, Description...)',
              'ស្វែងរកផលិតផលតាមលក្ខខណ្ឌណាមួយ ឧ. (ទាំងអស់, កូដ, ការពិពណ៌នា...)'
            )}
          </p>

          {/* Search Header & Toolbar */}
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 rounded-2xl border border-slate-800 bg-slate-950/80 p-3.5">
            {/* Search Input: "Search here" */}
            <div className="sm:col-span-5 relative">
              <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-xs">🔍</span>
              <input
                type="text"
                autoFocus
                value={modalSearchQuery}
                onChange={(e) => setModalSearchQuery(e.target.value)}
                placeholder={t('Search here', 'ស្វែងរកនៅទីនេះ...')}
                className="w-full rounded-xl border border-slate-700 bg-slate-900 py-2 pl-8 pr-3 text-xs font-semibold text-white placeholder-slate-500 outline-none focus:border-teal-400"
              />
            </div>

            {/* Search By */}
            <div className="sm:col-span-3">
              <select
                value={modalSearchBy}
                onChange={(e) => setModalSearchBy(e.target.value)}
                className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-xs font-bold text-white outline-none focus:border-teal-400"
              >
                <option value="any">{t('Search By: Any', 'ស្វែងរកដោយ: ទាំងអស់')}</option>
                <option value="code">{t('Search By: Code', 'ស្វែងរកដោយ: កូដ')}</option>
                <option value="barcode">{t('Search By: Barcode', 'ស្វែងរកដោយ: បារកូដ')}</option>
                <option value="description">{t('Search By: Description', 'ស្វែងរកដោយ: ការពិពណ៌នា')}</option>
              </select>
            </div>

            {/* Onhand filter */}
            <div className="sm:col-span-2">
              <select
                value={modalOnhandFilter}
                onChange={(e) => setModalOnhandFilter(e.target.value)}
                className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-xs font-bold text-white outline-none focus:border-teal-400"
              >
                <option value="all">{t('Onhand: All', 'ស្តុក: ទាំងអស់')}</option>
                <option value="instock">{t('In Stock Only', 'មានស្តុក')}</option>
                <option value="positive">{t('Onhand > 0', 'ស្តុក > 0')}</option>
              </select>
            </div>

            {/* Advance Filter Toggle */}
            <div className="sm:col-span-2">
              <button
                type="button"
                onClick={() => setShowAdvanceFilter(!showAdvanceFilter)}
                className={`flex w-full items-center justify-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-bold transition ${
                  showAdvanceFilter
                    ? 'border-teal-400 bg-teal-500/20 text-teal-300'
                    : 'border-slate-700 bg-slate-900 text-slate-300 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <span>⚡</span>
                <span className="truncate">{t('Advance Filter', 'តម្រងកម្រិតខ្ពស់')}</span>
              </button>
            </div>
          </div>

          {/* Advance Filter Drawer */}
          {showAdvanceFilter && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 rounded-2xl border border-slate-800 bg-slate-900/60 p-3.5">
              <div>
                <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                  {t('Filter Category', 'ប្រភេទ')}
                </label>
                <select
                  value={modalCategoryFilter}
                  onChange={(e) => setModalCategoryFilter(e.target.value)}
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-1.5 text-xs text-white outline-none focus:border-teal-400"
                >
                  <option value="">{t('All Categories', 'គ្រប់ប្រភេទ')}</option>
                  {categories.map((c) => (
                    <option key={c.id || c.code} value={c.description || c.name || c.code}>
                      {(lang === 'kh' && c.nameKh) ? c.nameKh : (c.description || c.name || c.code)}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                  {t('Filter Brand', 'ម៉ាកយីហោ')}
                </label>
                <select
                  value={modalBrandFilter}
                  onChange={(e) => setModalBrandFilter(e.target.value)}
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-1.5 text-xs text-white outline-none focus:border-teal-400"
                >
                  <option value="">{t('All Brands', 'គ្រប់ម៉ាក')}</option>
                  {brands.map((b) => (
                    <option key={b.id || b.code} value={b.description || b.name || b.code}>
                      {(lang === 'kh' && b.nameKh) ? b.nameKh : (b.description || b.name || b.code)}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {/* Sub-header: Product List By Outlet : MAIN-OUTLET */}
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <div>
              <h4 className="text-xs font-black uppercase tracking-wider text-teal-400">
                {t('Product List By Outlet :', 'បញ្ជីផលិតផលតាមសាខា :')} <span className="text-white">{outlet}</span>
              </h4>
              <p className="text-[11px] text-slate-400">
                {t('Show information of product. Ex(Code, Description, Onhand...)', 'បង្ហាញព័ត៌មានផលិតផល ឧ. (កូដ, ការពិពណ៌នា, ស្តុក...)')}
              </p>
            </div>

            <button
              type="button"
              onClick={selectAllModalProducts}
              className="text-xs font-bold text-teal-400 hover:underline"
            >
              {selectedProductIds.size === modalCatalogProducts.length && modalCatalogProducts.length > 0
                ? t('Deselect All', 'ដោះការជ្រើសរើស')
                : t(`Select All (${modalCatalogProducts.length})`, `ជ្រើសរើសទាំងអស់`)}
            </button>
          </div>

          {/* Modal Product List Table */}
          <div className="max-h-80 overflow-y-auto rounded-2xl border border-slate-800 divide-y divide-slate-800/60">
            {modalCatalogProducts.length === 0 ? (
              <div className="p-10 text-center text-xs font-semibold text-slate-400 space-y-2">
                <p>⚖️ {t('No scale products found matching filter criteria.', 'មិនមានផលិតផលជញ្ជីងត្រូវនឹងលក្ខខណ្ឌទេ។')}</p>
                <p className="text-[11px] text-slate-500 font-normal">
                  {t('Make sure products have the "Scale" checkbox enabled in Add/Edit Products (under Sale Option).', 'សូមប្រាកដថាផលិតផលត្រូវបានធីក "ជញ្ជីងថ្លឹង (Scale)" នៅក្នុងការបន្ថែម/កែប្រែផលិតផល (ក្រោមជម្រើសលក់)។')}
                </p>
              </div>
            ) : (
              modalCatalogProducts.map((p) => {
                const isSelected = selectedProductIds.has(p.id)
                const alreadyInScale = scaleList.some((it) => String(it.id) === String(p.id))
                return (
                  <div
                    key={p.id}
                    onClick={() => toggleSelectProduct(p.id)}
                    className={`flex items-center justify-between p-3 transition cursor-pointer ${
                      isSelected
                        ? 'bg-teal-500/20 text-teal-200'
                        : 'hover:bg-slate-800/40 text-slate-200'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => {}} // handled by parent onClick
                        className="rounded text-teal-500 focus:ring-teal-500 h-4 w-4"
                      />
                      {p.imageUrl ? (
                        <img src={p.imageUrl} alt="" className="h-9 w-9 rounded-lg object-cover ring-1 ring-slate-700 shrink-0" onError={(e) => { e.currentTarget.style.display = 'none' }} />
                      ) : (
                        <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-800 text-xs shrink-0">🥫</span>
                      )}
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-white text-xs truncate">{pName(p)}</span>
                          {alreadyInScale && <span className="rounded bg-teal-500/20 px-1.5 py-0.2 text-[9px] font-bold text-teal-300">In Scale</span>}
                        </div>
                        <p className="font-mono text-[11px] text-slate-400">
                          Code: <span className="text-teal-300">{p.code || '—'}</span> · Onhand: <span className="text-green-400 font-bold">{Number(p.onHand ?? 0).toFixed(2)} {p.uom || 'Kg'}</span>
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      <span className="font-mono text-xs font-black text-green-300">
                        ${Number(p.basePrice ?? 0).toFixed(2)}
                      </span>
                    </div>
                  </div>
                )
              })
            )}
          </div>

          {/* Action Buttons: Cancel | OK | Create */}
          <div className="flex flex-wrap items-center justify-between border-t border-slate-800 pt-4 gap-2">
            <Link
              to="/add-products"
              className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-400 hover:text-teal-300 transition"
            >
              + {t('Create New Product', 'បង្កើតផលិតផលថ្មី')}
            </Link>

            <div className="flex items-center gap-2">
              <GhostButton onClick={() => setAddModalOpen(false)}>
                {t('Cancel', 'បោះបង់')}
              </GhostButton>

              <button
                type="button"
                onClick={confirmAddSelectedProducts}
                disabled={selectedProductIds.size === 0}
                className="inline-flex items-center gap-2 rounded-xl bg-teal-600 px-5 py-2.5 text-xs font-extrabold text-white shadow-lg shadow-teal-600/30 transition hover:bg-teal-500 active:scale-95 disabled:opacity-50"
              >
                ✓ {t('OK / Add Selected', 'យល់ព្រម')} ({selectedProductIds.size})
              </button>
            </div>
          </div>
        </div>
      </Modal>

    </SectionShell>
  )
}

export default ProductScaleSection
