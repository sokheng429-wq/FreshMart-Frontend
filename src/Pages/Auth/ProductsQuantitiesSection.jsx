import { useEffect, useMemo, useState } from 'react'
import * as XLSX from 'xlsx'
import { useLanguage } from '../../context/LanguageContext'
import { adminProductAPI, adminUnitAPI } from '../../api/api'
import chartIcon from '../../assets/icon/3dicons-chart-dynamic-color.png'
import { SectionShell, PrimaryButton, GhostButton, Modal, Pill } from './stockUI'
import { PageLoader } from '../../components/PageLoader'
import { exportStyledExcel } from '../../utils/excelExport'

// Primary identity column (Always shown)
const BARCODE_COL = { key: 'barcode', label: { en: 'Barcode', kh: 'បារកូដ' } }

// Optional columns that can be toggled in Choose Column modal
const OPTIONAL_COLS = [
  { key: 'description', label: { en: 'Description', kh: 'ការពិពណ៌នា' } },
  { key: 'secondLanguage', label: { en: 'Second Language', kh: 'ភាសាទី២ (ខ្មែរ)' } },
  { key: 'qty', label: { en: 'QTY (On Hand)', kh: 'បរិមាណ (ក្នុងស្តុក)' } },
  { key: 'uom', label: { en: 'UOM', kh: 'ខ្នាត' } },
  { key: 'price', label: { en: 'Price', kh: 'តម្លៃលក់' } },
  { key: 'avgCost', label: { en: 'AVG Cost', kh: 'ចំណាយមធ្យម' } },
  { key: 'status', label: { en: 'Status', kh: 'ស្ថានភាព' } },
  { key: 'totalValue', label: { en: 'Stock Value', kh: 'តម្លៃស្តុកសរុប' } },
]

export const ProductsQuantitiesSection = () => {
  const { lang } = useLanguage()
  const t = (en, kh) => (lang === 'en' ? en : kh)

  const [products, setProducts] = useState([])
  const [units, setUnits] = useState([])
  const [loading, setLoading] = useState(true)

  // Search state
  const [searchQuery, setSearchQuery] = useState('')
  const [searchBy, setSearchBy] = useState('any')

  // Choose column state
  const [showColModal, setShowColModal] = useState(false)
  const [visibleCols, setVisibleCols] = useState(() => new Set(['description', 'secondLanguage', 'qty', 'uom', 'price', 'avgCost', 'status']))
  const [colDraft, setColDraft] = useState(visibleCols)

  useEffect(() => {
    Promise.allSettled([
      adminProductAPI.getAll(),
      adminUnitAPI.getAll(),
    ])
      .then(([pRes, uRes]) => {
        if (pRes.status === 'fulfilled' && Array.isArray(pRes.value?.data)) {
          setProducts(pRes.value.data)
        }
        if (uRes.status === 'fulfilled' && Array.isArray(uRes.value?.data)) {
          setUnits(uRes.value.data)
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  // Helper getters for description and second language
  const getDescription = (p) => {
    if (typeof p.name === 'object') return p.name?.en || p.name?.kh || '—'
    return p.name || p.description || '—'
  }

  const getSecondLanguage = (p) => {
    if (typeof p.name === 'object') return p.name?.kh || p.name?.en || '—'
    return p.nameKh || p.name_kh || p.secondLanguage || p.descriptionKh || '—'
  }

  const getBarcode = (p) => {
    return p.barCode || p.barcode || p.code || '—'
  }

  const getQty = (p) => {
    return Number(p.onHand ?? p.availableStock ?? 0)
  }

  const getPrice = (p) => {
    return Number(p.basePrice ?? p.price ?? 0)
  }

  const getAvgCost = (p) => {
    return Number(p.averageCost ?? p.cost ?? p.standardCost ?? 0)
  }

  const getUOM = (p) => {
    if (!p) return '—'
    const raw = String(p.uom || p.unit || p.unitOfMeasure || '').trim()
    if (!raw) return '—'

    const found = units.find((u) =>
      String(u.id) === raw ||
      String(u.code || '').toLowerCase() === raw.toLowerCase() ||
      String(u.description || '').toLowerCase() === raw.toLowerCase() ||
      String(u.nameKh || '').toLowerCase() === raw.toLowerCase()
    )

    if (found) {
      if (lang === 'kh' && found.nameKh) return found.nameKh
      return found.description || found.code || raw
    }

    return raw
  }

  const updateProductUOM = async (productId, newUom) => {
    try {
      const product = products.find((p) => p.id === productId)
      if (!product) return
      await adminProductAPI.update(productId, {
        ...product,
        uom: newUom,
      })
      setProducts((prev) =>
        prev.map((p) => (p.id === productId ? { ...p, uom: newUom } : p))
      )
    } catch (e) {
      console.warn('Failed to update product UOM', e)
    }
  }

  /* ---------- Filtering ---------- */
  const q = searchQuery.trim().toLowerCase()
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      if (!q) return true
      const barcodeStr = String(getBarcode(p)).toLowerCase()
      const descStr = String(getDescription(p)).toLowerCase()
      const secondLangStr = String(getSecondLanguage(p)).toLowerCase()
      const codeStr = String(p.code || '').toLowerCase()

      if (searchBy === 'barcode') return barcodeStr.includes(q)
      if (searchBy === 'description') return descStr.includes(q)
      if (searchBy === 'secondLanguage') return secondLangStr.includes(q)

      // 'any'
      return (
        barcodeStr.includes(q) ||
        descStr.includes(q) ||
        secondLangStr.includes(q) ||
        codeStr.includes(q)
      )
    })
  }, [products, q, searchBy])

  /* ---------- Summary Metrics ---------- */
  const totalSKUs = filteredProducts.length
  const totalStockQty = filteredProducts.reduce((sum, p) => sum + getQty(p), 0)
  const totalCostValue = filteredProducts.reduce((sum, p) => sum + (getQty(p) * getAvgCost(p)), 0)
  const totalRetailValue = filteredProducts.reduce((sum, p) => sum + (getQty(p) * getPrice(p)), 0)
  const lowStockCount = filteredProducts.filter((p) => getQty(p) > 0 && getQty(p) <= 5).length
  const outOfStockCount = filteredProducts.filter((p) => getQty(p) <= 0).length

  /* ---------- Column Modal Handlers ---------- */
  const toggleCol = (key) => {
    const next = new Set(colDraft)
    if (next.has(key)) {
      if (next.size === 1) return
      next.delete(key)
    } else {
      next.add(key)
    }
    setColDraft(next)
  }

  const selectAllCols = () => {
    setColDraft(new Set(OPTIONAL_COLS.map((c) => c.key)))
  }

  const resetDefaultCols = () => {
    setColDraft(new Set(['description', 'secondLanguage', 'qty', 'uom', 'price', 'avgCost', 'status']))
  }

  /* ---------- Excel Export ---------- */
  const exportExcel = () => {
    const activeOptional = OPTIONAL_COLS.filter((c) => visibleCols.has(c.key))
    const allCols = [BARCODE_COL, ...activeOptional]

    const headerLabels = allCols.map((c) => c.label.en)
    const dataRows = filteredProducts.map((p) =>
      allCols.map((c) => {
        if (c.key === 'barcode') return getBarcode(p)
        if (c.key === 'description') return getDescription(p)
        if (c.key === 'secondLanguage') return getSecondLanguage(p)
        if (c.key === 'qty') return getQty(p)
        if (c.key === 'uom') return getUOM(p)
        if (c.key === 'price') return Number(getPrice(p)).toFixed(2)
        if (c.key === 'avgCost') return Number(getAvgCost(p)).toFixed(2)
        if (c.key === 'totalValue') return (getQty(p) * getAvgCost(p)).toFixed(2)
        if (c.key === 'status') {
          const qty = getQty(p)
          return qty <= 0 ? 'Out of Stock' : qty <= 5 ? 'Low Stock' : 'In Stock'
        }
        return p[c.key] ?? ''
      })
    )

    exportStyledExcel({
      filename: 'products-quantities-inventory.xlsx',
      sheetName: 'Inventory Quantities',
      title: 'PRODUCTS QUANTITIES & INVENTORY REPORT',
      subtitle: `Total Products: ${dataRows.length}`,
      headers: headerLabels,
      data: dataRows,
    })
  }

  const activeColumns = [BARCODE_COL, ...OPTIONAL_COLS.filter((c) => visibleCols.has(c.key))]

  return (
    <PageLoader loading={loading} message={lang === 'en' ? 'Loading inventory…' : 'កំពុងផ្ទុកស្តុក…'}>
    <SectionShell
      icon={chartIcon}
      color="#0ea5e9"
      title={{ en: 'Products Quantities', kh: 'បរិមាណផលិតផល' }}
      subtitle={{
        en: 'Live inventory stock levels, barcode tracking, pricing, and moving average costs across the catalog.',
        kh: 'កម្រិតស្តុកជាក់ស្តែង ការតាមដានបារកូដ តម្លៃលក់ និងចំណាយមធ្យមនៃផលិតផលទាំងអស់។',
      }}
      // NO Create button as requested
    >
      {/* ---------- Metrics KPI Banner ---------- */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        <div className="rounded-2xl border border-slate-700/60 bg-slate-900/80 p-3.5 shadow-lg">
          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">{t('Total SKUs', 'មុខទំនិញសរុប')}</p>
          <p className="mt-1 font-mono text-xl font-extrabold text-white">{totalSKUs}</p>
        </div>

        <div className="rounded-2xl border border-slate-700/60 bg-slate-900/80 p-3.5 shadow-lg">
          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">{t('Total Stock QTY', 'បរិមាណស្តុកសរុប')}</p>
          <p className="mt-1 font-mono text-xl font-extrabold text-sky-400">{totalStockQty.toLocaleString()}</p>
        </div>

        <div className="rounded-2xl border border-slate-700/60 bg-slate-900/80 p-3.5 shadow-lg">
          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">{t('Inventory Cost Value', 'តម្លៃដើមសរុប')}</p>
          <p className="mt-1 font-mono text-xl font-extrabold text-amber-300">${totalCostValue.toFixed(2)}</p>
        </div>

        <div className="rounded-2xl border border-slate-700/60 bg-slate-900/80 p-3.5 shadow-lg">
          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">{t('Inventory Retail Value', 'តម្លៃលក់សរុប')}</p>
          <p className="mt-1 font-mono text-xl font-extrabold text-green-300">${totalRetailValue.toFixed(2)}</p>
        </div>

        <div className="rounded-2xl border border-slate-700/60 bg-slate-900/80 p-3.5 shadow-lg">
          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">{t('Low Stock (<= 5)', 'ស្តុកតិច')}</p>
          <p className="mt-1 font-mono text-xl font-extrabold text-orange-400">{lowStockCount}</p>
        </div>

        <div className="rounded-2xl border border-slate-700/60 bg-slate-900/80 p-3.5 shadow-lg">
          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">{t('Out of Stock', 'អស់ស្តុក')}</p>
          <p className="mt-1 font-mono text-xl font-extrabold text-red-400">{outOfStockCount}</p>
        </div>
      </div>

      {/* ---------- Search & Action Controls Bar ---------- */}
      <section className="rounded-2xl border border-slate-700/60 bg-slate-900/80 p-4 shadow-xl shadow-black/20">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">

          {/* Left: Search Box + Search By dropdown */}
          <div className="flex flex-1 flex-col gap-3 sm:flex-row sm:items-center">
            
            {/* Search Textbox */}
            <div className="relative flex-1">
              <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500">🔍</span>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t('Search by Barcode, Description, or Second Language...', 'ស្វែងរកតាមបារកូដ ការពិពណ៌នា ឬភាសាខ្មែរ...')}
                className="w-full rounded-xl border border-slate-700/70 bg-slate-950/60 py-2.5 pl-10 pr-8 text-sm text-white placeholder-slate-500 outline-none transition focus:border-sky-400 focus:ring-4 focus:ring-sky-500/10"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-500 hover:text-white"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Search By: Any | Barcode | Description | Second Language */}
            <div className="flex items-center gap-2">
              <span className="whitespace-nowrap text-xs font-bold uppercase tracking-wide text-slate-400">
                {t('Search By:', 'ស្វែងរកតាម:')}
              </span>
              <select
                value={searchBy}
                onChange={(e) => setSearchBy(e.target.value)}
                className="rounded-xl border border-slate-700/70 bg-slate-950/60 px-3 py-2.5 text-xs font-bold text-slate-200 outline-none focus:border-sky-400"
              >
                <option value="any">{t('Any', 'ទាំងអស់')}</option>
                <option value="barcode">{t('Barcode', 'បារកូដ')}</option>
                <option value="description">{t('Description', 'ការពិពណ៌នា')}</option>
                <option value="secondLanguage">{t('Second Language', 'ភាសាទី២ (ខ្មែរ)')}</option>
              </select>
            </div>

          </div>

          {/* Right: Choose Column + Export Excel (NO Create Button) */}
          <div className="flex flex-wrap items-center gap-2.5">
            <GhostButton onClick={() => { setColDraft(new Set(visibleCols)); setShowColModal(true) }}>
              ⚙️ {t('Choose Column', 'ជ្រើសរើសជួរឈរ')}
            </GhostButton>

            <button
              type="button"
              onClick={exportExcel}
              className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-700 bg-slate-800/80 px-3.5 py-2.5 text-xs font-bold text-slate-200 transition hover:border-slate-600 hover:bg-slate-700 hover:text-white"
            >
              📊 {t('Export Excel', 'នាំចេញ Excel')}
            </button>
          </div>

        </div>
      </section>

      {/* ---------- Products Quantities Table ---------- */}
      <section className="overflow-hidden rounded-2xl border border-slate-700/60 bg-slate-900/80 shadow-xl shadow-black/20">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-700/60 bg-slate-800/50 text-xs font-bold uppercase tracking-wide text-slate-400">
                <th className="px-4 py-3.5 w-16">{t('Photo', 'រូបភាព')}</th>
                {activeColumns.map((c) => (
                  <th key={c.key} className={`whitespace-nowrap px-4 py-3.5 ${
                    ['qty', 'price', 'avgCost', 'totalValue'].includes(c.key) ? 'text-right' : ''
                  }`}>
                    {c.label[lang]}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={activeColumns.length + 1} className="px-4 py-16 text-center text-slate-400">
                    <span className="mx-auto mb-2 flex h-12 w-12 animate-spin items-center justify-center rounded-full bg-slate-800 text-2xl">⏳</span>
                    <p className="text-sm font-semibold">{t('Loading products inventory...', 'កំពុងទាញយកទិន្នន័យស្តុកផលិតផល...')}</p>
                  </td>
                </tr>
              ) : filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={activeColumns.length + 1} className="px-4 py-16 text-center text-slate-400">
                    <span className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-slate-800 text-2xl">📦</span>
                    <p className="text-sm font-semibold">{t('No products matching search criteria.', 'មិនមានផលិតផលត្រូវនឹងការស្វែងរកទេ។')}</p>
                  </td>
                </tr>
              ) : (
                filteredProducts.map((p) => {
                  const barcode = getBarcode(p)
                  const desc = getDescription(p)
                  const secondLang = getSecondLanguage(p)
                  const qty = getQty(p)
                  const uom = getUOM(p)
                  const price = getPrice(p)
                  const avgCost = getAvgCost(p)
                  const status = qty <= 0 ? 'OUT' : qty <= 5 ? 'LOW' : 'IN'
                  const img = (typeof p.imageUrl === 'string' && !p.imageUrl.startsWith('blob:')) ? p.imageUrl : ''

                  return (
                    <tr key={p.id} className="border-b border-slate-800/60 transition hover:bg-slate-800/40">
                      
                      {/* Photo */}
                      <td className="px-4 py-3">
                        {img ? (
                          <img src={img} alt="" className="h-10 w-10 rounded-xl object-cover ring-1 ring-slate-700" onError={(e) => { e.currentTarget.style.display = 'none' }} />
                        ) : (
                          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-800 text-base ring-1 ring-slate-700">🥫</span>
                        )}
                      </td>

                      {/* Barcode (Identity column) */}
                      <td className="px-4 py-3 font-mono text-xs font-bold text-sky-300">
                        {barcode}
                      </td>

                      {/* Description */}
                      {visibleCols.has('description') && (
                        <td className="px-4 py-3 font-semibold text-white">
                          {desc}
                        </td>
                      )}

                      {/* Second Language */}
                      {visibleCols.has('secondLanguage') && (
                        <td className="px-4 py-3 font-medium text-slate-300 font-khmer">
                          {secondLang}
                        </td>
                      )}

                      {/* QTY */}
                      {visibleCols.has('qty') && (
                        <td className="px-4 py-3 text-right">
                          <span className={`font-mono text-base font-black ${
                            qty <= 0 ? 'text-red-400' : qty <= 5 ? 'text-orange-400' : 'text-green-400'
                          }`}>
                            {qty.toFixed(2)}
                          </span>
                        </td>
                      )}

                      {/* UOM */}
                      {visibleCols.has('uom') && (
                        <td className="px-4 py-3">
                          {units.length > 0 ? (
                            <select
                              value={p.uom || p.unit || ''}
                              onChange={(e) => updateProductUOM(p.id, e.target.value)}
                              className="rounded-lg border border-slate-700/80 bg-slate-950 px-2.5 py-1 text-xs font-semibold text-slate-200 outline-none focus:border-green-400 cursor-pointer hover:border-slate-500 transition"
                              title={t('Live Unit of Measure (Click to change)', 'ខ្នាតវាស់ជាក់ស្តែង (ចុចដើម្បីប្តូរ)')}
                            >
                              <option value="">{uom !== '—' ? uom : `— ${t('Select UOM', 'ជ្រើសរើសខ្នាត')} —`}</option>
                              {units.map((u) => {
                                const label = (lang === 'kh' && u.nameKh) ? u.nameKh : (u.description || u.code)
                                const val = u.description || u.code
                                return (
                                  <option key={u.id} value={val}>
                                    {label}
                                  </option>
                                )
                              })}
                            </select>
                          ) : (
                            <span className="inline-block rounded-md bg-slate-800/80 px-2.5 py-1 text-xs text-slate-300 font-semibold">
                              {uom}
                            </span>
                          )}
                        </td>
                      )}

                      {/* Price */}
                      {visibleCols.has('price') && (
                        <td className="px-4 py-3 text-right font-mono font-bold text-green-300">
                          ${price.toFixed(2)}
                        </td>
                      )}

                      {/* AVG Cost */}
                      {visibleCols.has('avgCost') && (
                        <td className="px-4 py-3 text-right font-mono font-bold text-amber-300">
                          ${avgCost.toFixed(2)}
                        </td>
                      )}

                      {/* Status */}
                      {visibleCols.has('status') && (
                        <td className="px-4 py-3">
                          <Pill tone={status === 'IN' ? 'green' : status === 'LOW' ? 'orange' : 'red'}>
                            {status === 'IN' ? t('In Stock', 'មានស្តុក') : status === 'LOW' ? t('Low Stock', 'ស្តុកតិច') : t('Out of Stock', 'អស់ស្តុក')}
                          </Pill>
                        </td>
                      )}

                      {/* Total Value */}
                      {visibleCols.has('totalValue') && (
                        <td className="px-4 py-3 text-right font-mono font-semibold text-slate-300">
                          ${(qty * avgCost).toFixed(2)}
                        </td>
                      )}

                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* ---------- Choose Column Modal ---------- */}
      <Modal
        open={showColModal}
        onClose={() => setShowColModal(false)}
        title={t('Choose Columns to Display', 'ជ្រើសរើសជួរឈរដើម្បីបង្ហាញ')}
        wide
      >
        <div className="space-y-4">
          <p className="text-xs text-slate-400">
            {t('Toggle visibility of columns for Products Quantities inventory table.', 'បិទ/បើក ការបង្ហាញជួរឈរក្នុងតារាងបរិមាណស្តុកផលិតផល។')}
          </p>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {/* Barcode is always enabled */}
            <label className="flex items-center gap-3 rounded-xl border border-slate-700/80 bg-slate-950/60 p-3 opacity-60">
              <input type="checkbox" checked disabled className="rounded text-sky-500" />
              <span className="text-xs font-bold text-white">{BARCODE_COL.label[lang]} ({t('Always on', 'ថេរ')})</span>
            </label>

            {OPTIONAL_COLS.map((col) => (
              <label
                key={col.key}
                className="flex cursor-pointer items-center gap-3 rounded-xl border border-slate-700/80 bg-slate-950/60 p-3 transition hover:border-slate-600 hover:bg-slate-800"
              >
                <input
                  type="checkbox"
                  checked={colDraft.has(col.key)}
                  onChange={() => toggleCol(col.key)}
                  className="rounded text-sky-500 focus:ring-sky-500"
                />
                <span className="text-xs font-semibold text-slate-200">{col.label[lang]}</span>
              </label>
            ))}
          </div>

          <div className="flex items-center justify-between border-t border-slate-800 pt-4">
            <div className="flex gap-2">
              <button
                type="button"
                onClick={selectAllCols}
                className="text-xs font-bold text-sky-400 hover:underline"
              >
                {t('Select All', 'ជ្រើសរើសទាំងអស់')}
              </button>
              <span className="text-slate-600">·</span>
              <button
                type="button"
                onClick={resetDefaultCols}
                className="text-xs font-bold text-slate-400 hover:underline"
              >
                {t('Reset Default', 'កំណត់ឡើងវិញ')}
              </button>
            </div>

            <div className="flex gap-2">
              <GhostButton onClick={() => setShowColModal(false)}>
                {t('Cancel', 'បោះបង់')}
              </GhostButton>
              <PrimaryButton onClick={() => { setVisibleCols(colDraft); setShowColModal(false) }}>
                {t('Apply Columns', 'អនុវត្ត')}
              </PrimaryButton>
            </div>
          </div>
        </div>
      </Modal>

    </SectionShell>
    </PageLoader>
  )
}

export default ProductsQuantitiesSection
