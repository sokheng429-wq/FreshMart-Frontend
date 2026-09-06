import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import * as XLSX from 'xlsx'
import { useLanguage } from '../../context/LanguageContext'
import { useNotifications } from '../../context/NotificationContext'
import {
  adminProductAPI,
  adminCategoryAPI,
  adminBrandAPI,
  adminUnitAPI,
  adminSerialNumberAPI,
} from '../../api/api'
import { PageLoader } from '../../components/PageLoader'
import hashIcon from '../../assets/icon/3dicons-hash-dynamic-color.png'
import { Modal } from './stockUI'
import { enrichProductList } from '../../utils/productMeta'
import { exportStyledExcel } from '../../utils/excelExport'

const pName = (p) => (typeof p?.name === 'object' ? p.name?.en : p?.name) || `#${p?.id}`
const pNameKh = (p) => (typeof p?.name === 'object' ? p.name?.kh : p?.nameKh || p?.name_kh || p?.secondLanguage || '—')

const SortIcon = ({ field, currentField, currentDir }) => {
  if (field !== currentField) {
    return <span className="opacity-30 text-[10px] ml-1">⇅</span>
  }
  return <span className="text-[#7EB631] text-[10px] ml-1">{currentDir === 'asc' ? '▲' : '▼'}</span>
}

const SERIAL_STORAGE_KEY = 'bg_serial_information_records_v1'

const loadSerialRecords = () => {
  try {
    const raw = localStorage.getItem(SERIAL_STORAGE_KEY)
    if (raw) return JSON.parse(raw)
  } catch {}
  return null
}

const saveSerialRecords = (records) => {
  try {
    localStorage.setItem(SERIAL_STORAGE_KEY, JSON.stringify(records))
  } catch {}
}

export const SerialInformationSection = () => {
  const { lang } = useLanguage()
  const { addNotification } = useNotifications()

  const [pageLoading, setPageLoading] = useState(true)
  const [catalogProducts, setCatalogProducts] = useState([])
  const [serialList, setSerialList] = useState([])

  // Search & Filter State
  const [searchInput, setSearchInput] = useState('')
  const [activeSearch, setActiveSearch] = useState('')
  const [onhandFilter, setOnhandFilter] = useState('All') // 'All' | 'Onhand > 0' | 'Onhand = 0'
  const [searchBy, setSearchBy] = useState('Any') // 'Any' | 'Serial' | 'Code'

  // Sorting
  const [sortField, setSortField] = useState('serial')
  const [sortDirection, setSortDirection] = useState('asc')

  // Column Visibility
  const [colModalOpen, setColModalOpen] = useState(false)
  const [visibleCols, setVisibleCols] = useState(
    () => new Set(['picture', 'serial', 'code', 'description', 'onhand', 'uom'])
  )

  // Detail / Preview Modal
  const [selectedSerial, setSelectedSerial] = useState(null)
  const [toast, setToast] = useState(null)

  const t = (en, kh) => (lang === 'en' ? en : kh)

  // Fetch Catalog Master Data & Backend Serials
  useEffect(() => {
    Promise.all([
      adminProductAPI.getAll().catch(() => ({ data: [] })),
      adminCategoryAPI.getAll().catch(() => ({ data: [] })),
      adminBrandAPI.getAll().catch(() => ({ data: [] })),
      adminUnitAPI.getAll().catch(() => ({ data: [] })),
      adminSerialNumberAPI.getAll().catch(() => ({ data: [] })),
    ]).then(([pRes, cRes, bRes, uRes, sRes]) => {
      const rawProds = Array.isArray(pRes?.data) ? pRes.data : []
      const enriched = enrichProductList(rawProds)
      setCatalogProducts(enriched)

      const dbSerials = Array.isArray(sRes?.data) ? sRes.data : []
      if (dbSerials.length > 0) {
        // Map serials from PostgreSQL database
        const mapped = dbSerials.map((s, idx) => {
          const match = enriched.find((p) => String(p.id) === String(s.productId) || String(p.code) === String(s.productCode))
          return {
            id: `sn-db-${s.id}`,
            serialRecordId: s.id,
            productId: s.productId,
            serial: s.serialNumber || `SN-${s.id}`,
            code: s.productCode || match?.code || `PRD-${s.productId}`,
            barcode: match?.barCode || match?.barcode || '—',
            name: s.productName || (match ? pName(match) : `Product #${s.productId}`),
            nameKh: match ? pNameKh(match) : '—',
            imageUrl: match?.imageUrl || match?.image || '',
            onhand: 1,
            uom: match?.uom || 'Unit',
            category: match?.categoryName || 'Grocery',
            batch: s.batchLot || `LOT-${new Date().getFullYear()}-01`,
            location: 'DEFAULT-LOC (Main Floor)',
            outlet: 'MAIN-OUTLET',
            receivedDate: s.createdAt ? s.createdAt.slice(0, 10) : new Date().toISOString().slice(0, 10),
            expiryDate: s.expiryDate || new Date(Date.now() + 90 * 86400000).toISOString().slice(0, 10),
            warrantyMonths: 12,
            supplier: 'B-Global Suppliers Ltd.',
            cost: Number(match?.averageCost ?? match?.cost ?? 0),
            price: Number(match?.basePrice ?? 0),
          }
        })
        setSerialList(mapped)
      } else {
        // Initialize serial items from storage or seed
        const saved = loadSerialRecords()
        if (saved && Array.isArray(saved) && saved.length > 0) {
          // Hydrate saved serials with live catalog details
          const hydrated = saved.map((s) => {
            const match = enriched.find((p) => String(p.id) === String(s.productId) || String(p.code) === String(s.code))
            if (match) {
              return {
                ...s,
                name: pName(match),
                nameKh: pNameKh(match),
                imageUrl: match.imageUrl || match.image || s.imageUrl || '',
                barcode: match.barCode || match.barcode || s.barcode || '—',
                uom: match.uom || s.uom || 'Unit',
                category: match.categoryName || s.category || 'General',
              }
            }
            return s
          })
          setSerialList(hydrated)
        } else {
          // Generate seed serial items from active catalog products
          const sampleSerials = []
          enriched.slice(0, 15).forEach((p, idx) => {
            const baseNum = 10000 + idx * 47
            const onhand = idx % 5 === 0 ? 0 : Math.max(1, (idx * 3) % 18)
            const img = p.imageUrl || p.image || (Array.isArray(p.photos) ? p.photos[0] : null) || ''
            
            sampleSerials.push({
              id: `sn-init-${p.id || idx}-1`,
              productId: p.id,
              serial: `SN-${new Date().getFullYear()}${String(baseNum + 1).padStart(5, '0')}`,
              code: p.code || `PRD-${1000 + idx}`,
              barcode: p.barCode || p.barcode || `88512345${baseNum}`,
              name: pName(p),
              nameKh: pNameKh(p),
              imageUrl: img,
              onhand: onhand,
              uom: p.uom || 'Unit',
              category: p.categoryName || 'Grocery',
              batch: `LOT-${new Date().getFullYear()}-0${(idx % 4) + 1}`,
              location: idx % 2 === 0 ? 'DEFAULT-LOC (Main Floor)' : 'COLD-ROOM-01',
              outlet: 'MAIN-OUTLET',
              receivedDate: new Date(Date.now() - (idx + 1) * 86400000 * 3).toISOString().slice(0, 10),
              expiryDate: new Date(Date.now() + (idx + 12) * 86400000 * 15).toISOString().slice(0, 10),
              warrantyMonths: idx % 3 === 0 ? 24 : 12,
              supplier: 'B-Global Suppliers Ltd.',
              cost: Number(p.averageCost ?? p.cost ?? 0),
              price: Number(p.basePrice ?? 0),
            })

            if (idx % 2 === 1) {
              sampleSerials.push({
                id: `sn-init-${p.id || idx}-2`,
                productId: p.id,
                serial: `SN-${new Date().getFullYear()}${String(baseNum + 2).padStart(5, '0')}`,
                code: p.code || `PRD-${1000 + idx}`,
                barcode: p.barCode || p.barcode || `88512345${baseNum}`,
                name: pName(p),
                nameKh: pNameKh(p),
                imageUrl: img,
                onhand: onhand > 0 ? onhand - 1 : 0,
                uom: p.uom || 'Unit',
                category: p.categoryName || 'Grocery',
                batch: `LOT-${new Date().getFullYear()}-0${(idx % 4) + 1}`,
                location: 'WAREHOUSE-A (Bulk Pallet)',
                outlet: 'MAIN-OUTLET',
                receivedDate: new Date(Date.now() - (idx + 2) * 86400000 * 4).toISOString().slice(0, 10),
                expiryDate: new Date(Date.now() + (idx + 15) * 86400000 * 15).toISOString().slice(0, 10),
                warrantyMonths: 12,
                supplier: 'B-Global Suppliers Ltd.',
                cost: Number(p.averageCost ?? p.cost ?? 0),
                price: Number(p.basePrice ?? 0),
              })
            }
          })

          setSerialList(sampleSerials)
          saveSerialRecords(sampleSerials)
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

  // Trigger search on button click or form submit
  const handleSearchSubmit = (e) => {
    if (e) e.preventDefault()
    setActiveSearch(searchInput.trim())
  }

  // Filtered & Sorted Serial List
  const filteredSerials = useMemo(() => {
    let list = [...serialList]
    const q = (activeSearch || searchInput).trim().toLowerCase()

    // 1. Search Query Filter
    if (q) {
      list = list.filter((item) => {
        const serial = String(item.serial || '').toLowerCase()
        const code = String(item.code || '').toLowerCase()
        const nameEn = String(item.name || '').toLowerCase()
        const nameKh = String(item.nameKh || '').toLowerCase()
        const batch = String(item.batch || '').toLowerCase()

        if (searchBy === 'Serial') {
          return serial.includes(q)
        }
        if (searchBy === 'Code') {
          return code.includes(q)
        }
        // 'Any'
        return (
          serial.includes(q) ||
          code.includes(q) ||
          nameEn.includes(q) ||
          nameKh.includes(q) ||
          batch.includes(q)
        )
      })
    }

    // 2. Onhand Filter
    if (onhandFilter === 'Onhand > 0') {
      list = list.filter((it) => Number(it.onhand || 0) > 0)
    } else if (onhandFilter === 'Onhand = 0') {
      list = list.filter((it) => Number(it.onhand || 0) <= 0)
    }

    // 3. Sorting
    list.sort((a, b) => {
      let valA = a[sortField] ?? ''
      let valB = b[sortField] ?? ''

      if (sortField === 'onhand') {
        valA = Number(valA || 0)
        valB = Number(valB || 0)
      } else {
        valA = String(valA || '').toLowerCase()
        valB = String(valB || '').toLowerCase()
      }

      if (valA < valB) return sortDirection === 'asc' ? -1 : 1
      if (valA > valB) return sortDirection === 'asc' ? 1 : -1
      return 0
    })

    return list
  }, [serialList, activeSearch, searchInput, onhandFilter, searchBy, sortField, sortDirection])

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortField(field)
      setSortDirection('asc')
    }
  }

  // Export filtered serials to Excel
  const exportSerialsExcel = () => {
    const headers = []
    if (visibleCols.has('serial')) headers.push('Serial Number')
    if (visibleCols.has('code')) headers.push('Product Code')
    if (visibleCols.has('description')) headers.push('Description (EN)')
    headers.push('Description (KH)')
    if (visibleCols.has('onhand')) headers.push('Onhand QTY')
    if (visibleCols.has('uom')) headers.push('UOM')
    headers.push('Batch / Lot', 'Location', 'Outlet', 'Received Date', 'Expiry Date', 'Warranty (Months)')

    const rows = filteredSerials.map((it) => {
      const r = []
      if (visibleCols.has('serial')) r.push(it.serial || '—')
      if (visibleCols.has('code')) r.push(it.code || '—')
      if (visibleCols.has('description')) r.push(it.name || '—')
      r.push(it.nameKh || '—')
      if (visibleCols.has('onhand')) r.push(Number(it.onhand || 0))
      if (visibleCols.has('uom')) r.push(it.uom || 'Unit')
      r.push(
        it.batch || '—',
        it.location || '—',
        it.outlet || 'MAIN-OUTLET',
        it.receivedDate || '—',
        it.expiryDate || '—',
        it.warrantyMonths || '12'
      )
      return r
    })

    exportStyledExcel({
      filename: 'serial-information-list.xlsx',
      sheetName: 'Serial Inventory',
      title: 'SERIAL INFORMATION INVENTORY REPORT',
      subtitle: `Onhand Filter: ${onhandFilter} · Search By: ${searchBy} (${activeSearch || 'All'})`,
      headers,
      data: rows,
      summary: {
        'In Stock Items': filteredSerials.filter((s) => Number(s.onhand || 0) > 0).length,
        'Out of Stock Items': filteredSerials.filter((s) => Number(s.onhand || 0) <= 0).length,
      },
    })
    setToast({
      tone: 'green',
      message: t(`✓ Exported ${rows.length} serial records to Excel`, `✓ បានទាញយកទិន្នន័យ ${rows.length} កំណត់ត្រា`),
    })
  }

  // Copy serial number to clipboard
  const copyToClipboard = (text, label = 'Serial Number') => {
    if (!text) return
    navigator.clipboard?.writeText(text)
    setToast({
      tone: 'green',
      message: t(`✓ Copied ${label}: "${text}"`, `✓ បានចម្លង ${label}: "${text}"`),
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

  if (pageLoading) {
    return <PageLoader loading={true} message={t('Loading Serial Information…', 'កំពុងផ្ទុកព័ត៌មានសៀរៀល…')} />
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

      {/* Header & Breadcrumb */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <nav className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
            <Link to="/admin/products" className="text-slate-400 transition hover:text-[#7EB631] flex items-center gap-1.5">
              <span>📦</span>
              <span>{t('Stocks', 'ស្តុក')}</span>
            </Link>
            <span className="text-slate-600">&gt;</span>
            <span className="text-[#7EB631]">{t('Serial Information', 'ព័ត៌មានសៀរៀល')}</span>
          </nav>
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-slate-700/80 bg-[#243040] shadow-md">
              <img src={hashIcon} alt="" className="h-6 w-6 object-contain" />
            </div>
            <div>
              <h1 className="text-2xl font-black tracking-tight text-white font-['Montserrat']">
                {t('Serial Information', 'ព័ត៌មានសៀរៀល')}
              </h1>
              <p className="text-xs text-slate-400 font-['Montserrat']">
                {t('Preview Serial Information', 'មើលព័ត៌មានសៀរៀល')}
              </p>
            </div>
          </div>
        </div>

        <Link
          to="/admin/products"
          className="inline-flex items-center gap-2 self-start rounded-xl border border-slate-700/80 bg-slate-900/80 px-4 py-2 text-xs font-bold text-slate-300 transition hover:border-[#7EB631] hover:bg-slate-800 hover:text-white"
        >
          <span className="text-sm">←</span>
          <span>{t('Back to Stocks', 'ត្រឡប់ទៅស្តុក')}</span>
        </Link>
      </div>

      {/* =========================================================================
         SECTION 1: SEARCH SERIAL INFORMATION
         ========================================================================= */}
      <div className="rounded-2xl border border-slate-800/80 bg-[#243040]/70 backdrop-blur-md p-5 shadow-lg shadow-black/20 space-y-4">
        {/* Section Title */}
        <div className="flex items-center gap-3">
          <div className="h-6 w-1.5 rounded-full bg-[#7EB631]" />
          <div>
            <h2 className="text-sm font-bold text-white uppercase tracking-wider font-['Montserrat']">
              {t('Search Serial Information', 'ស្វែងរកព័ត៌មានសៀរៀល')}
            </h2>
            <p className="text-[11px] text-slate-400 font-['Montserrat']">
              {t(
                'Search serial information by any condition. Ex(Any, Serial, Code...)',
                'ស្វែងរកព័ត៌មានសៀរៀលតាមលក្ខខណ្ឌណាមួយ។ ឧ. (ទាំងអស់, សៀរៀល, កូដ...)'
              )}
            </p>
          </div>
        </div>

        {/* Three-Field Search Row */}
        <form onSubmit={handleSearchSubmit} className="grid grid-cols-1 gap-3 sm:grid-cols-12 items-center pt-1">
          {/* 1. Search Text Input */}
          <div className="relative sm:col-span-6">
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

          {/* 2. Onhand Dropdown */}
          <div className="sm:col-span-2">
            <select
              value={onhandFilter}
              onChange={(e) => setOnhandFilter(e.target.value)}
              className="w-full rounded-xl border border-slate-700/80 bg-slate-950/90 px-3 py-2.5 text-xs font-semibold text-white outline-none transition focus:border-[#7EB631]"
            >
              <option value="All">{t('All', 'ទាំងអស់')}</option>
              <option value="Onhand > 0">{t('Onhand > 0', 'មានក្នុងស្តុក > 0')}</option>
              <option value="Onhand = 0">{t('Onhand = 0', 'អស់ពីស្តុក = 0')}</option>
            </select>
          </div>

          {/* 3. Search By Dropdown */}
          <div className="sm:col-span-2">
            <select
              value={searchBy}
              onChange={(e) => setSearchBy(e.target.value)}
              className="w-full rounded-xl border border-slate-700/80 bg-slate-950/90 px-3 py-2.5 text-xs font-semibold text-white outline-none transition focus:border-[#7EB631]"
            >
              <option value="Any">{t('Any', 'ទាំងអស់ (Any)')}</option>
              <option value="Serial">{t('Serial', 'លេខសៀរៀល (Serial)')}</option>
              <option value="Code">{t('Code', 'កូដទំនិញ (Code)')}</option>
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

      {/* =========================================================================
         SECTION 2: SERIAL INFORMATION LIST
         ========================================================================= */}
      <div className="rounded-2xl border border-slate-800/80 bg-slate-900/80 p-5 shadow-lg shadow-black/20 space-y-4">
        {/* Header & Top Right Actions */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between pb-2 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="h-6 w-1.5 rounded-full bg-[#E69D32]" />
            <div>
              <h2 className="text-sm font-bold text-white uppercase tracking-wider font-['Montserrat']">
                {t('Serial information list', 'បញ្ជីព័ត៌មានសៀរៀល')}
              </h2>
              <p className="text-[11px] text-slate-400">
                {t('Show information of serial information', 'បង្ហាញព័ត៌មាននៃលេខសៀរៀលទំនិញ')}
              </p>
            </div>
          </div>

          {/* Action buttons top right: Column Visibility & Export */}
          <div className="flex items-center gap-2.5">
            {/* Column Toggle (Blue Icon) */}
            <button
              type="button"
              onClick={() => setColModalOpen(true)}
              className="flex h-9 w-9 items-center justify-center rounded-xl border border-blue-500/40 bg-blue-500/10 text-blue-400 shadow-sm transition hover:bg-blue-500/20 hover:border-blue-400"
              title={t('Toggle Columns', 'ជ្រើសរើសជួរឈរ')}
            >
              <span className="text-sm">▦</span>
            </button>

            {/* Export Excel Button */}
            <button
              type="button"
              onClick={exportSerialsExcel}
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2 text-xs font-bold text-slate-300 shadow-sm transition hover:border-[#7EB631] hover:bg-slate-800 hover:text-white"
            >
              <span>📊</span>
              <span>{t('Export', 'នាំចេញ')}</span>
            </button>
          </div>
        </div>

        {/* Serial Information Table */}
        <div className="overflow-x-auto rounded-xl border border-slate-800/80 bg-slate-950/50">
          <table className="w-full min-w-[760px] text-left text-xs">
            <thead>
              <tr className="border-b border-slate-800 bg-[#243040]/80 text-[11px] font-bold uppercase tracking-wider text-slate-300">
                {visibleCols.has('picture') && (
                  <th className="w-14 px-3 py-3 text-center">{t('Picture', 'រូបភាព')}</th>
                )}
                {visibleCols.has('serial') && (
                  <th
                    onClick={() => handleSort('serial')}
                    className="cursor-pointer px-4 py-3 select-none hover:text-white"
                  >
                    <div className="flex items-center gap-1">
                      <span>{t('Serial', 'សៀរៀល')}</span>
                      <SortIcon field="serial" currentField={sortField} currentDir={sortDirection} />
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
                {visibleCols.has('onhand') && (
                  <th
                    onClick={() => handleSort('onhand')}
                    className="cursor-pointer px-4 py-3 text-right select-none hover:text-white w-28"
                  >
                    <div className="flex items-center justify-end gap-1">
                      <span>{t('Onhand', 'ក្នុងស្តុក')}</span>
                      <SortIcon field="onhand" currentField={sortField} currentDir={sortDirection} />
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
                {/* Last Column: Unlabeled Right-Aligned Actions */}
                <th className="w-20 px-4 py-3 text-right"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredSerials.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-14 text-center">
                    <div className="mx-auto flex flex-col items-center justify-center space-y-2">
                      <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-dashed border-slate-700 bg-slate-900/60 text-2xl text-slate-500">
                        🔍
                      </div>
                      <h4 className="text-sm font-black uppercase tracking-wider text-slate-300">
                        {t('NOT FOUND', 'រកមិនឃើញ')}
                      </h4>
                      <p className="text-[11px] text-slate-500 max-w-sm">
                        {t(
                          'No serial records match your search or filter condition.',
                          'គ្មានព័ត៌មានសៀរៀលត្រូវនឹងការស្វែងរក ឬតម្រងរបស់អ្នកទេ។'
                        )}
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredSerials.map((row) => {
                  const onhandQty = Number(row.onhand || 0)
                  return (
                    <tr key={row.id} className="hover:bg-slate-900/40 transition-colors">
                      {/* Picture Column */}
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

                      {/* Serial Column */}
                      {visibleCols.has('serial') && (
                        <td className="px-4 py-3 font-mono font-bold text-sky-400 align-middle">
                          <div className="flex items-center gap-1.5">
                            <span>{row.serial || '—'}</span>
                            <button
                              type="button"
                              onClick={() => copyToClipboard(row.serial, 'Serial')}
                              className="text-slate-500 hover:text-white transition p-0.5"
                              title={t('Copy Serial', 'ចម្លងលេខសៀរៀល')}
                            >
                              📋
                            </button>
                          </div>
                        </td>
                      )}

                      {/* Code Column */}
                      {visibleCols.has('code') && (
                        <td className="px-4 py-3 font-mono font-bold text-[#7EB631] align-middle">
                          {row.code || '—'}
                        </td>
                      )}

                      {/* Description Column */}
                      {visibleCols.has('description') && (
                        <td className="px-4 py-3 align-middle">
                          <div className="font-bold text-white">{row.name || '—'}</div>
                          {row.nameKh && row.nameKh !== '—' && (
                            <div className="text-[11px] text-slate-400 font-['Kantumruy_Pro']">{row.nameKh}</div>
                          )}
                          {row.batch && (
                            <div className="text-[10px] text-slate-500 font-mono">Lot: {row.batch}</div>
                          )}
                        </td>
                      )}

                      {/* Onhand Column */}
                      {visibleCols.has('onhand') && (
                        <td className="px-4 py-3 text-right font-mono font-bold align-middle">
                          <span
                            className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-black ${
                              onhandQty > 0
                                ? 'bg-[#7EB631]/20 text-[#7EB631] border border-[#7EB631]/30'
                                : 'bg-red-500/20 text-red-400 border border-red-500/30'
                            }`}
                          >
                            {onhandQty}
                          </span>
                        </td>
                      )}

                      {/* UOM Column */}
                      {visibleCols.has('uom') && (
                        <td className="px-4 py-3 font-medium text-slate-300 align-middle">
                          {row.uom || 'Unit'}
                        </td>
                      )}

                      {/* Last Column (Row Action: View Detail / Copy) */}
                      <td className="px-4 py-3 text-right align-middle">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => setSelectedSerial(row)}
                            className="rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-800 hover:text-white"
                            title={t('View Serial Detail', 'មើលព័ត៌មានលម្អិត')}
                          >
                            👁️
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Footer Record Summary */}
        <div className="flex flex-col sm:flex-row items-center justify-between pt-2 text-xs text-slate-400 font-mono gap-2">
          <span>
            {t('Total:', 'សរុប:')} <span className="font-bold text-white">{filteredSerials.length} Lines</span>
          </span>
          <div className="flex items-center gap-3 text-[11px]">
            <span className="text-green-400">
              ● In Stock: {filteredSerials.filter((s) => Number(s.onhand || 0) > 0).length}
            </span>
            <span className="text-slate-500">|</span>
            <span className="text-red-400">
              ● Out of Stock: {filteredSerials.filter((s) => Number(s.onhand || 0) <= 0).length}
            </span>
          </div>
        </div>
      </div>

      {/* =========================================================================
         MODAL 1: COLUMN VISIBILITY TOGGLE
         ========================================================================= */}
      <Modal open={colModalOpen} onClose={() => setColModalOpen(false)} title={t('Table Column Settings', 'ការកំណត់ជួរឈរ')}>
        <div className="space-y-4 p-2">
          <p className="text-xs text-slate-400">
            {t('Select which columns you want to show or hide in the table.', 'ជ្រើសរើសជួរឈរដែលអ្នកចង់បង្ហាញ ឬលាក់ក្នុងតារាង។')}
          </p>

          <div className="space-y-2.5">
            {[
              { key: 'picture', label: t('Product Picture', 'រូបភាពផលិតផល') },
              { key: 'serial', label: t('Serial Number', 'លេខសៀរៀល') },
              { key: 'code', label: t('Product Code', 'កូដផលិតផល') },
              { key: 'description', label: t('Description', 'ការពិពណ៌នា') },
              { key: 'onhand', label: t('Onhand Quantity', 'ចំនួនក្នុងស្តុក') },
              { key: 'uom', label: t('Unit of Measure', 'ខ្នាត') },
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
         MODAL 2: SERIAL ITEM PREVIEW / DETAIL PANEL
         ========================================================================= */}
      {selectedSerial && (
        <Modal
          open={!!selectedSerial}
          onClose={() => setSelectedSerial(null)}
          title={t('Serial Detail Preview', 'ព័ត៌មានលម្អិតសៀរៀល')}
        >
          <div className="space-y-5 text-slate-200 p-1 font-['Montserrat']">
            {/* Header Identity Badge */}
            <div className="flex items-start justify-between rounded-2xl border border-slate-800 bg-slate-950/80 p-4">
              <div className="flex items-center gap-3.5">
                {selectedSerial.imageUrl ? (
                  <img
                    src={selectedSerial.imageUrl}
                    alt=""
                    className="h-14 w-14 shrink-0 rounded-xl object-cover ring-1 ring-slate-700"
                  />
                ) : (
                  <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-slate-800 text-2xl">
                    🥫
                  </div>
                )}
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-base font-black text-sky-400">{selectedSerial.serial}</span>
                    <button
                      type="button"
                      onClick={() => copyToClipboard(selectedSerial.serial, 'Serial')}
                      className="rounded-md bg-slate-800 px-2 py-0.5 text-[10px] font-bold text-slate-300 hover:text-white"
                    >
                      Copy
                    </button>
                  </div>
                  <h3 className="text-sm font-bold text-white mt-0.5">{selectedSerial.name}</h3>
                  {selectedSerial.nameKh && selectedSerial.nameKh !== '—' && (
                    <p className="text-xs text-slate-400 font-['Kantumruy_Pro']">{selectedSerial.nameKh}</p>
                  )}
                </div>
              </div>

              <span
                className={`rounded-xl px-2.5 py-1 text-xs font-black uppercase ${
                  Number(selectedSerial.onhand || 0) > 0
                    ? 'bg-[#7EB631]/20 text-[#7EB631] border border-[#7EB631]/30'
                    : 'bg-red-500/20 text-red-400 border border-red-500/30'
                }`}
              >
                {Number(selectedSerial.onhand || 0) > 0 ? 'In Stock' : 'Out of Stock'}
              </span>
            </div>

            {/* Spec Information Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
              <div className="rounded-xl border border-slate-800/80 bg-slate-950/60 p-3 space-y-1">
                <span className="text-[10px] font-bold uppercase text-slate-400">Product Code</span>
                <p className="font-mono font-bold text-[#7EB631]">{selectedSerial.code || '—'}</p>
              </div>

              <div className="rounded-xl border border-slate-800/80 bg-slate-950/60 p-3 space-y-1">
                <span className="text-[10px] font-bold uppercase text-slate-400">Barcode</span>
                <p className="font-mono font-bold text-slate-200">{selectedSerial.barcode || '—'}</p>
              </div>

              <div className="rounded-xl border border-slate-800/80 bg-slate-950/60 p-3 space-y-1">
                <span className="text-[10px] font-bold uppercase text-slate-400">Onhand Quantity</span>
                <p className="font-mono font-black text-amber-300">
                  {selectedSerial.onhand} {selectedSerial.uom}
                </p>
              </div>

              <div className="rounded-xl border border-slate-800/80 bg-slate-950/60 p-3 space-y-1">
                <span className="text-[10px] font-bold uppercase text-slate-400">Batch / Lot Number</span>
                <p className="font-mono font-semibold text-slate-300">{selectedSerial.batch || '—'}</p>
              </div>

              <div className="rounded-xl border border-slate-800/80 bg-slate-950/60 p-3 space-y-1">
                <span className="text-[10px] font-bold uppercase text-slate-400">Warehouse Location</span>
                <p className="font-medium text-slate-300">{selectedSerial.location || 'DEFAULT-LOC'}</p>
              </div>

              <div className="rounded-xl border border-slate-800/80 bg-slate-950/60 p-3 space-y-1">
                <span className="text-[10px] font-bold uppercase text-slate-400">Outlet</span>
                <p className="font-medium text-slate-300">{selectedSerial.outlet || 'MAIN-OUTLET'}</p>
              </div>

              <div className="rounded-xl border border-slate-800/80 bg-slate-950/60 p-3 space-y-1">
                <span className="text-[10px] font-bold uppercase text-slate-400">Received Date</span>
                <p className="font-mono text-slate-300">{selectedSerial.receivedDate || '—'}</p>
              </div>

              <div className="rounded-xl border border-slate-800/80 bg-slate-950/60 p-3 space-y-1">
                <span className="text-[10px] font-bold uppercase text-slate-400">Expiry Date</span>
                <p className="font-mono text-slate-300">{selectedSerial.expiryDate || '—'}</p>
              </div>

              <div className="rounded-xl border border-slate-800/80 bg-slate-950/60 p-3 space-y-1">
                <span className="text-[10px] font-bold uppercase text-slate-400">Warranty Period</span>
                <p className="font-semibold text-slate-300">{selectedSerial.warrantyMonths || 12} Months</p>
              </div>
            </div>

            {/* Close Button */}
            <div className="flex justify-end pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setSelectedSerial(null)}
                className="rounded-xl border border-slate-700 bg-slate-950 px-5 py-2 text-xs font-bold text-slate-300 transition hover:bg-slate-800 hover:text-white"
              >
                {t('Close', 'បិទ')}
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
}

export default SerialInformationSection
