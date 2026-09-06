import { useEffect, useMemo, useState } from 'react'
import * as XLSX from 'xlsx'
import { useLanguage } from '../../context/LanguageContext'
import { adminProductAPI, adminPriceHistoryAPI } from '../../api/api'
import { useCollection, eanCheckDigit } from './stockStore'
import { PageLoader } from '../../components/PageLoader'
import dollarIcon from '../../assets/icon/3dicons-dollar-dynamic-color.png'
import calculatorIcon from '../../assets/icon/3dicons-calculator-dynamic-color.png'
import toggleIcon from '../../assets/icon/3dicons-toggle-dynamic-color.png'
import walletIcon from '../../assets/icon/3dicons-wallet-dynamic-color.png'
import hashIcon from '../../assets/icon/3dicons-hash-dynamic-color.png'
import linkIcon from '../../assets/icon/3dicons-link-dynamic-color.png'
import copyIcon from '../../assets/icon/3dicons-copy-dynamic-color.png'
import { SectionShell, Field, TextInput, SelectInput, PrimaryButton, GhostButton, Modal, Pill, ConfirmModal } from './stockUI'
import ProductScaleSection from './ProductScaleSection'
import ChangeAttributeSection from './ChangeAttributeSection'
import CostChangeSection from './CostChangeSection'
import SerialInformationSection from './SerialInformationSection'
import ProductsSupplierSection from './ProductsSupplierSection'
import { exportStyledExcel, downloadExcel } from '../../utils/excelExport'
import './ToolsSection.css'

const pName = (p) => (typeof p?.name === 'object' ? p.name?.en : p?.name) || `#${p?.id}`
const pNameKh = (p) => (typeof p?.name === 'object' ? p.name?.kh : p?.nameKh || p?.name_kh || p?.secondLanguage || '—')

const COST_CHANGE_COLS = [
  { key: 'barcode', label: { en: 'Barcode', kh: 'បារកូដ' } },
  { key: 'name', label: { en: 'Description', kh: 'ការពិពណ៌នា' } },
  { key: 'nameKh', label: { en: 'Second Language', kh: 'ភាសាខ្មែរ' } },
  { key: 'currentCost', label: { en: 'Current Cost', kh: 'ចំណាយបច្ចុប្បន្ន' } },
  { key: 'projectedCost', label: { en: 'Projected Cost', kh: 'ចំណាយប៉ាន់ស្មាន' } },
  { key: 'costDelta', label: { en: 'Delta ($ / %)', kh: 'បម្រែបម្រួល' } },
  { key: 'retailPrice', label: { en: 'Retail Price', kh: 'តម្លៃលក់' } },
  { key: 'grossMargin', label: { en: 'Gross Margin %', kh: 'អត្រាចំណេញ' } },
]

/* =========================================================================
   MAIN TOOLS SECTION DISPATCHER
   ========================================================================= */
export const ToolsSection = ({ sectionKey }) => {
  const { lang } = useLanguage()
  const [products, setProducts] = useState([])
  const [query, setQuery] = useState('')
  const [searchBy, setSearchBy] = useState('any')
  const [feedback, setFeedback] = useState(null)
  const [saving, setSaving] = useState(false)

  // Sub-module specific states
  const [priceEdits, setPriceEdits] = useState({})
  const [activeMarkup, setActiveMarkup] = useState(null)
  const [costPct, setCostPct] = useState('')
  const [costFixed, setCostFixed] = useState('')
  const [costReason, setCostReason] = useState('Supplier Price Adjustment')
  const [costColModalOpen, setCostColModalOpen] = useState(false)
  const [visibleCostCols, setVisibleCostCols] = useState(() => new Set(['barcode', 'name', 'currentCost', 'projectedCost', 'costDelta', 'retailPrice']))
  const [draftCostCols, setDraftCostCols] = useState(() => new Set(['barcode', 'name', 'currentCost', 'projectedCost', 'costDelta', 'retailPrice']))
  const [confirmAction, setConfirmAction] = useState(null)
  const [suppliers] = useCollection('md-suppliers')
  const [supplierLinks, supplierLinkApi] = useCollection('ps-links')
  const [linkForm, setLinkForm] = useState(null)
  const [attrDefs] = useCollection('md-attributes')
  const [changeAttr, setChangeAttr] = useState({ attrId: '', value: '' })
  const [labelSize, setLabelSize] = useState('58x40')
  const [selectedLabelProducts, setSelectedLabelProducts] = useState(() => new Set())
  const [pageLoading, setPageLoading] = useState(true)

  useEffect(() => {
    adminProductAPI.getAll()
      .then((res) => {
        const list = Array.isArray(res?.data) ? res.data : []
        setProducts(list)
        setSelectedLabelProducts(new Set(list.map((p) => p.id)))
      })
      .catch(() => {})
      .finally(() => setPageLoading(false))
  }, [])

  const t = (en, kh) => (lang === 'en' ? en : kh)

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return products
    return products.filter((p) => {
      const nameEn = String(pName(p)).toLowerCase()
      const nameKh = String(pNameKh(p)).toLowerCase()
      const code = String(p.code || '').toLowerCase()
      const barcode = String(p.barCode || p.barcode || '').toLowerCase()

      if (searchBy === 'code') return code.includes(q)
      if (searchBy === 'barcode') return barcode.includes(q)
      if (searchBy === 'name') return nameEn.includes(q) || nameKh.includes(q)
      return nameEn.includes(q) || nameKh.includes(q) || code.includes(q) || barcode.includes(q)
    })
  }, [products, query, searchBy])

  if (pageLoading) return <PageLoader loading={true} message={t('Loading products…', 'កំពុងផ្ទុកផលិតផល…')} />

  if (sectionKey === 'products-scale') {
    return <ProductScaleSection />
  }

  if (sectionKey === 'change-attribute') {
    return <ChangeAttributeSection key="change-attribute" />
  }

  if (sectionKey === 'cost-change') {
    return <CostChangeSection key="cost-change" />
  }

  if (sectionKey === 'serial-information') {
    return <SerialInformationSection key="serial-information" />
  }

  if (sectionKey === 'products-supplier') {
    return <ProductsSupplierSection key="products-supplier" />
  }

  /* =========================================================================
     1. PRODUCTS PRICES (💲)
     ========================================================================= */
  if (sectionKey === 'products-prices') {
    const dirtyCount = Object.keys(priceEdits).length

    const saveAllPrices = async () => {
      setSaving(true)
      let ok = 0
      for (const [id, price] of Object.entries(priceEdits)) {
        try {
          const p = products.find((x) => String(x.id) === String(id))
          const numPrice = Number(price)
          if (!Number.isNaN(numPrice)) {
            // Persist price history to PostgreSQL price_histories table
            adminPriceHistoryAPI.create({
              productId: p?.id || Number(id),
              productName: p ? pName(p) : `Product #${id}`,
              oldPrice: Number(p?.basePrice ?? 0),
              newPrice: numPrice,
              changeType: 'SELLING_PRICE',
              markupPercent: activeMarkup || 0,
              reason: 'Selling price adjustment via Products Prices',
              changedBy: 'Admin',
            }).catch(() => {})

            await adminProductAPI.update(id, { ...p, basePrice: numPrice })
            ok += 1
          }
        } catch { /* skip failed */ }
      }
      setPriceEdits({})
      setActiveMarkup(null)
      setFeedback({
        tone: 'green',
        text: t(`✓ Successfully updated ${ok} product price(s) and recorded in database`, `✓ បានធ្វើបច្ចុប្បន្នភាពតម្លៃផលិតផលចំនួន ${ok} និងកត់ត្រាក្នុងមូលដ្ឋានទិន្នន័យ`),
      })
      setSaving(false)
      // refresh products list
      adminProductAPI.getAll().then((res) => setProducts(Array.isArray(res?.data) ? res.data : []))
    }

    const promptSaveAllPrices = () => {
      setConfirmAction({
        title: { en: 'Save Price Changes', kh: 'រក្សាទុកការផ្លាស់ប្តូរតម្លៃ' },
        message: {
          en: `Are you sure you want to apply new selling prices to ${dirtyCount} product(s)?`,
          kh: `តើអ្នកប្រាកដជាចង់អនុវត្តតម្លៃលក់ថ្មីលើផលិតផលចំនួន ${dirtyCount} មែនទេ?`,
        },
        confirmText: { en: 'Confirm & Save', kh: 'យល់ព្រមរក្សាទុក' },
        cancelText: { en: 'Cancel', kh: 'បោះបង់' },
        type: 'save',
        onConfirm: saveAllPrices,
      })
    }

    const applyBulkMarkup = (markupPercent) => {
      const pct = Number(markupPercent)
      if (Number.isNaN(pct)) return
      setActiveMarkup(pct)
      const next = { ...priceEdits }
      filtered.forEach((p) => {
        const cost = Number(p.averageCost ?? p.cost ?? p.standardCost ?? 0)
        const currentPrice = Number(priceEdits[p.id] ?? p.basePrice ?? cost ?? 0)
        const base = pct < 0 ? (currentPrice > 0 ? currentPrice : cost) : (cost > 0 ? cost : currentPrice)
        if (base > 0) {
          const newPrice = Math.max(0.01, Math.round(base * (1 + pct / 100) * 100) / 100)
          next[p.id] = newPrice.toFixed(2)
        }
      })
      setPriceEdits(next)
      const sign = pct > 0 ? `+${pct}%` : `${pct}%`
      setFeedback({
        tone: pct >= 0 ? 'blue' : 'orange',
        text: t(
          `Calculated ${sign} adjustment on ${filtered.length} product(s). Click "Save Changes" to apply.`,
          `បានគណនាតម្លៃ ${sign} លើ ${filtered.length} ផលិតផល។ ចុច "រក្សាទុក" ដើម្បីអនុវត្ត។`
        ),
      })
    }

    const resetAllPriceEdits = () => {
      setPriceEdits({})
      setActiveMarkup(null)
      setFeedback({
        tone: 'orange',
        text: t('Draft price changes cleared.', 'បានលុបចោលការកែប្រែតម្លៃបណ្តោះអាសន្ន។'),
      })
    }

    const cancelProductEdit = (productId) => {
      const next = { ...priceEdits }
      delete next[productId]
      setPriceEdits(next)
    }

    const exportPriceList = () => {
      const headers = ['Code', 'Barcode', 'Description', 'Second Language', 'Cost ($)', 'Current Price ($)', 'New Price ($)', 'Margin %']
      const rows = filtered.map((p) => {
        const cost = Number(p.averageCost ?? p.cost ?? 0)
        const price = Number(priceEdits[p.id] ?? p.basePrice ?? 0)
        const margin = price > 0 ? (((price - cost) / price) * 100).toFixed(1) : '0.0'
        return [
          p.code || '—',
          p.barCode || p.barcode || '—',
          pName(p),
          pNameKh(p),
          cost.toFixed(2),
          Number(p.basePrice ?? 0).toFixed(2),
          price.toFixed(2),
          `${margin}%`,
        ]
      })
      downloadExcel('products-price-list.xlsx', 'Prices', headers, rows)
    }

    return (
      <SectionShell
        icon={dollarIcon}
        color="#16a34a"
        title={{ en: 'Products Prices', kh: 'តម្លៃផលិតផល' }}
        subtitle={{
          en: 'Manage cost, selling prices, markup margins and execute batch price updates.',
          kh: 'គ្រប់គ្រងតម្លៃដើម តម្លៃលក់ អត្រាចំណេញ និងធ្វើបច្ចុប្បន្នភាពតម្លៃជាក្រុម។',
        }}
        actions={
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={exportPriceList}
              className="inline-flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-800/80 px-3.5 py-2 text-xs font-bold text-slate-200 transition hover:bg-slate-700 hover:text-white"
            >
              📊 {t('Export Excel', 'នាំចេញ Excel')}
            </button>
            {dirtyCount > 0 && (
              <GhostButton onClick={resetAllPriceEdits}>
                ✕ {t('Cancel Changes', 'បោះបង់ការផ្លាស់ប្តូរ')}
              </GhostButton>
            )}
            <PrimaryButton onClick={promptSaveAllPrices} disabled={dirtyCount === 0 || saving}>
              {saving ? t('Saving…', 'កំពុងរក្សាទុក…') : `✓ ${t('Save Changes', 'រក្សាទុកការផ្លាស់ប្តូរ')} (${dirtyCount})`}
            </PrimaryButton>
          </div>
        }
      >
        {feedback && <Banner feedback={feedback} onClose={() => setFeedback(null)} />}
        {confirmAction && (
          <ConfirmModal
            {...confirmAction}
            open={!!confirmAction}
            onClose={() => setConfirmAction(null)}
            onConfirm={async () => {
              const fn = confirmAction.onConfirm
              setConfirmAction(null)
              if (fn) await fn()
            }}
          />
        )}

        {/* Quick Batch Markup (+) and Markdown (-) Bar */}
        <div className="flex flex-col gap-3 rounded-2xl border border-slate-700/60 bg-slate-900/80 p-4">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3">
            {/* Positive Markup Presets */}
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-xs font-bold uppercase tracking-wide text-green-400">
                📈 {t('Markup (+):', 'ឡើងថ្លៃ (+):')}
              </span>
              {[5, 10, 15, 20, 25, 30, 40, 50].map((pct) => {
                const isSelected = activeMarkup === pct
                return (
                  <button
                    key={`plus-${pct}`}
                    type="button"
                    onClick={() => applyBulkMarkup(pct)}
                    className={`rounded-lg border px-2.5 py-1 text-xs font-bold transition hover:scale-105 active:scale-95 ${
                      isSelected
                        ? 'border-green-400 bg-green-500 text-slate-950 shadow-md shadow-green-500/30 ring-2 ring-green-400/50'
                        : 'border-green-500/30 bg-green-500/10 text-green-300 hover:bg-green-500/30 hover:border-green-400'
                    }`}
                    title={t(`Apply +${pct}% markup from cost`, `គណនាបន្ថែម +${pct}% ពីតម្លៃដើម`)}
                  >
                    +{pct}%
                  </button>
                )
              })}
            </div>

            <div className="flex items-center gap-2">
              {(activeMarkup !== null || dirtyCount > 0) && (
                <button
                  type="button"
                  onClick={resetAllPriceEdits}
                  className="inline-flex items-center gap-1 rounded-lg border border-rose-500/40 bg-rose-500/20 px-2.5 py-1 text-xs font-bold text-rose-300 transition hover:bg-rose-500/30"
                  title={t('Cancel current markup selection', 'បោះបង់ការជ្រើសរើស')}
                >
                  ✕ {t('Cancel Selection', 'បោះបង់ការជ្រើសរើស')}
                </button>
              )}
              <span className="text-xs text-slate-400">
                {t('Total SKUs:', 'មុខទំនិញសរុប:')} <strong className="text-white">{filtered.length}</strong>
                {dirtyCount > 0 && <span className="ml-2 font-mono text-green-300">({dirtyCount} edited)</span>}
              </span>
            </div>
          </div>

          {/* Negative Markdown / Discount Presets */}
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-xs font-bold uppercase tracking-wide text-rose-400">
              📉 {t('Discount (-):', 'បញ្ចុះតម្លៃ (-):')}
            </span>
            {[5, 10, 15, 20, 25, 30, 40, 50].map((pct) => {
              const isSelected = activeMarkup === -pct
              return (
                <button
                  key={`minus-${pct}`}
                  type="button"
                  onClick={() => applyBulkMarkup(-pct)}
                  className={`rounded-lg border px-2.5 py-1 text-xs font-bold transition hover:scale-105 active:scale-95 ${
                    isSelected
                      ? 'border-rose-400 bg-rose-500 text-white shadow-md shadow-rose-500/30 ring-2 ring-rose-400/50'
                      : 'border-rose-500/30 bg-rose-500/10 text-rose-300 hover:bg-rose-500/30 hover:border-rose-400'
                  }`}
                  title={t(`Apply -${pct}% discount on current price`, `គណនាបញ្ចុះតម្លៃ -${pct}% ពីតម្លៃបច្ចុប្បន្ន`)}
                >
                  -{pct}%
                </button>
              )
            })}
          </div>
        </div>

        <SearchBox query={query} setQuery={setQuery} searchBy={searchBy} setSearchBy={setSearchBy} t={t} />

        {/* Prices Table */}
        <div className="overflow-x-auto rounded-2xl border border-slate-700/60 bg-slate-900/80 shadow-xl">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-700/60 bg-slate-800/50 text-xs font-bold uppercase tracking-wide text-slate-400">
                <th className="px-4 py-3.5">{t('Code', 'កូដ')}</th>
                <th className="px-4 py-3.5">{t('Barcode', 'បារកូដ')}</th>
                <th className="px-4 py-3.5">{t('Description', 'ការពិពណ៌នា')}</th>
                <th className="px-4 py-3.5">{t('Second Language', 'ភាសាខ្មែរ')}</th>
                <th className="px-4 py-3.5 text-right">{t('Cost', 'តម្លៃដើម')}</th>
                <th className="px-4 py-3.5 text-right">{t('Current Price', 'តម្លៃបច្ចុប្បន្ន')}</th>
                <th className="px-4 py-3.5 text-center w-44">{t('New Price ($)', 'តម្លៃថ្មី ($)')}</th>
                <th className="px-4 py-3.5 text-right">{t('Gross Margin', 'អត្រាចំណេញ')}</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((p) => {
                const cost = Number(p.averageCost ?? p.cost ?? 0)
                const curPrice = Number(p.basePrice ?? 0)
                const newPriceVal = priceEdits[p.id] !== undefined ? Number(priceEdits[p.id]) : curPrice
                const isDirty = priceEdits[p.id] !== undefined && priceEdits[p.id] !== String(curPrice)
                const margin = newPriceVal > 0 ? (((newPriceVal - cost) / newPriceVal) * 100) : 0
                const imgUrl = p.imageUrl || p.image

                return (
                  <tr key={p.id} className={`border-b border-slate-800/60 transition ${isDirty ? 'bg-green-500/10' : 'hover:bg-slate-800/30'}`}>
                    <td className="px-4 py-3 font-mono text-xs font-bold text-slate-300">{p.code || '—'}</td>
                    <td className="px-4 py-3 font-mono text-xs text-slate-400">{p.barCode || p.barcode || '—'}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        {imgUrl && !imgUrl.startsWith('blob:') ? (
                          <img src={imgUrl} alt="" className="h-9 w-9 flex-shrink-0 rounded-lg object-cover ring-1 ring-slate-700" onError={(e) => { e.currentTarget.style.display = 'none' }} />
                        ) : (
                          <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg text-base ring-1 ring-slate-700" style={{ backgroundColor: 'rgba(119,188,31,0.1)' }}>🥫</span>
                        )}
                        <span className="font-semibold text-white">{pName(p)}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 font-medium text-slate-300 font-khmer">{pNameKh(p)}</td>
                    <td className="px-4 py-3 text-right font-mono text-amber-300">${cost.toFixed(2)}</td>
                    <td className="px-4 py-3 text-right font-mono text-slate-400">${curPrice.toFixed(2)}</td>
                    <td className="px-4 py-3 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={priceEdits[p.id] ?? curPrice.toFixed(2)}
                          onChange={(e) => setPriceEdits({ ...priceEdits, [p.id]: e.target.value })}
                          className={`w-24 rounded-lg border px-2 py-1.5 text-center font-mono text-sm font-black outline-none transition ${
                            isDirty ? 'border-green-400 bg-slate-950 text-green-300 ring-2 ring-green-500/20' : 'border-slate-700 bg-slate-950/70 text-white focus:border-green-400'
                          }`}
                        />
                        {isDirty && (
                          <button
                            type="button"
                            onClick={() => cancelProductEdit(p.id)}
                            title={t('Cancel / Revert to original price', 'បោះបង់ / ត្រឡប់ទៅតម្លៃដើម')}
                            className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-700 bg-slate-800 text-xs font-bold text-rose-300 hover:bg-rose-500/20 hover:border-rose-400 transition"
                          >
                            ✕
                          </button>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-bold ${
                        margin >= 25 ? 'bg-green-500/20 text-green-300' : margin >= 10 ? 'bg-amber-500/20 text-amber-300' : 'bg-red-500/20 text-red-300'
                      }`}>
                        {margin.toFixed(1)}%
                      </span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </SectionShell>
    )
  }

  /* =========================================================================
     2. PRINT LABEL (🖨️)
     ========================================================================= */
  if (sectionKey === 'print-label') {
    const SIZES = {
      '40x30': { w: 40, h: 30, font: 9, name: '40 × 30 mm (Shelf Edge)' },
      '58x40': { w: 58, h: 40, font: 11, name: '58 × 40 mm (Retail Tag)' },
      '80x50': { w: 80, h: 50, font: 13, name: '80 × 50 mm (Box / Produce)' },
    }
    const size = SIZES[labelSize] || SIZES['58x40']
    const printable = filtered.filter((p) => selectedLabelProducts.has(p.id))

    const toggleSelectAllLabels = () => {
      if (selectedLabelProducts.size === filtered.length) {
        setSelectedLabelProducts(new Set())
      } else {
        setSelectedLabelProducts(new Set(filtered.map((p) => p.id)))
      }
    }

    const toggleLabelProduct = (id) => {
      const next = new Set(selectedLabelProducts)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      setSelectedLabelProducts(next)
    }

    const doPrint = () => {
      const win = window.open('', '_blank', 'width=850,height=900')
      if (!win) return
      const labels = printable.map((p) => `
        <div class="lbl" style="width:${size.w}mm;height:${size.h}mm">
          <div class="header">B' GROCERIES</div>
          <div class="nm">${pName(p)}</div>
          <div class="nm-kh">${pNameKh(p)}</div>
          <div class="barcode-box">
            <div class="bars">||| | |||| || | ||| |||| | |||</div>
            <div class="bc">${p.barCode || p.barcode || p.code || '8850000000000'}</div>
          </div>
          <div class="footer">
            <span class="code">${p.barCode || p.barcode || p.code || ''}</span>
            <span class="pr">$${Number(p.basePrice ?? 0).toFixed(2)}</span>
          </div>
        </div>`)

      win.document.write(`<html><head><title>Print Shelf Labels - FreshMart</title><style>
        body{font-family:'Montserrat',sans-serif;margin:0;padding:5mm;display:flex;flex-wrap:wrap;gap:2mm}
        .lbl{display:flex;flex-direction:column;justify-content:space-between;border:1px solid #111;box-sizing:border-box;padding:2.5mm;text-align:center;page-break-inside:avoid;background:#fff;border-radius:2mm}
        .header{font-size:7px;font-weight:900;letter-spacing:1px;color:#555}
        .nm{font-weight:800;font-size:${size.font}px;line-height:1.15;max-height:2.4em;overflow:hidden}
        .nm-kh{font-size:${size.font - 2}px;color:#444}
        .barcode-box{margin:1mm 0}
        .bars{font-family:monospace;letter-spacing:1px;font-weight:900;font-size:14px;line-height:0.8}
        .bc{font-family:monospace;font-size:9px;color:#222;letter-spacing:1px}
        .footer{display:flex;justify-content:space-between;align-items:flex-end;border-top:1px dashed #bbb;padding-top:1mm}
        .code{font-size:8px;font-family:monospace;color:#555}
        .pr{font-weight:900;font-size:${size.font + 5}px;color:#000}
        @media print{body{padding:0}.lbl{border-style:solid;margin:0}}
      </style></head><body>${labels.join('')}<script>window.onload=()=>window.print()<` + `/script></body></html>`)
      win.document.close()
    }

    return (
      <SectionShell
        icon={copyIcon}
        color="#a855f7"
        title={{ en: 'Print Label', kh: 'បោះពុម្ពស្លាក' }}
        subtitle={{
          en: 'Generate and print thermal barcode price tags, shelf edge labels and box tags.',
          kh: 'បង្កើត និងបោះពុម្ពស្លាកបារកូដ ស្លាកតម្លៃលើធ្នើ និងស្លាកប្រអប់ទំនិញ។',
        }}
        actions={
          <div className="flex items-center gap-2">
            <select
              value={labelSize}
              onChange={(e) => setLabelSize(e.target.value)}
              className="rounded-xl border border-slate-700 bg-slate-800 px-3 py-2 text-xs font-bold text-white outline-none focus:border-purple-400"
            >
              {Object.entries(SIZES).map(([k, v]) => (
                <option key={k} value={k}>{v.name}</option>
              ))}
            </select>
            <PrimaryButton onClick={doPrint} disabled={printable.length === 0}>
              🖨️ {t(`Print Labels (${printable.length})`, `បោះពុម្ពស្លាក (${printable.length})`)}
            </PrimaryButton>
          </div>
        }
      >
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-700/60 bg-slate-900/80 p-4">
          <div className="flex items-center gap-3">
            <label className="flex items-center gap-2 text-xs font-bold text-white cursor-pointer">
              <input
                type="checkbox"
                checked={selectedLabelProducts.size === filtered.length && filtered.length > 0}
                onChange={toggleSelectAllLabels}
                className="rounded text-purple-500"
              />
              <span>{t('Select All for Printing', 'ជ្រើសរើសទាំងអស់ដើម្បីបោះពុម្ព')}</span>
            </label>
            <span className="text-xs text-slate-400">
              ({selectedLabelProducts.size} {t('selected', 'បានជ្រើសរើស')})
            </span>
          </div>

          <div className="text-xs text-purple-300">
            {t(`Showing preview of ${Math.min(printable.length, 12)} label(s)`, `បង្ហាញគំរូ ${Math.min(printable.length, 12)} ស្លាក`)}
          </div>
        </div>

        <SearchBox query={query} setQuery={setQuery} searchBy={searchBy} setSearchBy={setSearchBy} t={t} />

        {/* Live Thermal Label Cards Preview Grid */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filtered.map((p) => {
            const isChecked = selectedLabelProducts.has(p.id)
            return (
              <div
                key={p.id}
                onClick={() => toggleLabelProduct(p.id)}
                className={`relative flex cursor-pointer flex-col justify-between rounded-2xl border p-4 shadow-lg transition hover:scale-[1.02] ${
                  isChecked
                    ? 'border-purple-500/80 bg-slate-900 ring-2 ring-purple-500/30'
                    : 'border-slate-700/60 bg-slate-950/60 opacity-60'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <span className="text-[10px] font-black uppercase tracking-widest text-purple-400">B' GROCERIES</span>
                    <h4 className="truncate text-sm font-bold text-white">{pName(p)}</h4>
                    <p className="truncate text-xs text-slate-400 font-khmer">{pNameKh(p)}</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={() => {}}
                    className="rounded text-purple-500"
                  />
                </div>

                {/* Barcode Mock Visual */}
                <div className="my-3 rounded-lg border border-dashed border-slate-700 bg-white p-2 text-center text-black">
                  <div className="font-mono text-xs tracking-widest font-black leading-none select-none">
                    ||| | |||| || | ||| |||| | |||
                  </div>
                  <div className="mt-1 font-mono text-[10px] font-bold text-slate-800">
                    {p.barCode || p.barcode || p.code || '8850000000000'}
                  </div>
                </div>

                <div className="flex items-end justify-between border-t border-slate-800 pt-2">
                  <span className="font-mono text-xs text-slate-400">{p.barCode || p.barcode || p.code || '—'}</span>
                  <span className="font-mono text-lg font-black text-green-300">
                    ${Number(p.basePrice ?? 0).toFixed(2)}
                  </span>
                </div>
              </div>
            )
          })}
        </div>
      </SectionShell>
    )
  }

  /* =========================================================================
     3. PRODUCTS SCALE (🧮)
     ========================================================================= */
  if (sectionKey === 'products-scale') {
    return <ProductScaleSection />
  }

  /* =========================================================================
     4. CHANGE ATTRIBUTE (🔀)
     ========================================================================= */
  if (sectionKey === 'change-attribute') {
    const defs = attrDefs.length > 0 ? attrDefs : [
      { id: 'origin', name: 'Country of Origin' },
      { id: 'storage', name: 'Storage Temperature' },
      { id: 'organic', name: 'Organic Certified' },
      { id: 'brand', name: 'Brand Line' },
    ]

    const applyBulkAttribute = async () => {
      const def = defs.find((d) => String(d.id) === changeAttr.attrId)
      if (!def || !changeAttr.value.trim()) return
      setSaving(true)
      let ok = 0
      for (const p of filtered) {
        try {
          const currentDesc = String(p.description || '').trim()
          const newEntry = `${def.name}: ${changeAttr.value.trim()}`
          const updatedDesc = currentDesc ? `${currentDesc} | ${newEntry}` : newEntry
          await adminProductAPI.update(p.id, { ...p, description: updatedDesc })
          ok += 1
        } catch { /* skip */ }
      }
      setFeedback({
        tone: 'green',
        text: t(`✓ Applied attribute "${def.name}: ${changeAttr.value}" to ${ok} product(s)`, `✓ បានអនុវត្តលក្ខណៈសម្បត្តិ "${def.name}: ${changeAttr.value}" លើ ${ok} ផលិតផល`),
      })
      setChangeAttr({ attrId: '', value: '' })
      setSaving(false)
      adminProductAPI.getAll().then((res) => setProducts(Array.isArray(res?.data) ? res.data : []))
    }

    const promptBulkAttribute = () => {
      const def = defs.find((d) => String(d.id) === changeAttr.attrId)
      setConfirmAction({
        title: { en: 'Apply Attribute Change', kh: 'អនុវត្តការប្តូរលក្ខណៈសម្បត្តិ' },
        message: {
          en: `Are you sure you want to assign "${def?.name}: ${changeAttr.value.trim()}" across ${filtered.length} filtered product(s)?`,
          kh: `តើអ្នកប្រាកដជាចង់កំណត់ "${def?.name}: ${changeAttr.value.trim()}" លើផលិតផលចំនួន ${filtered.length} មែនទេ?`,
        },
        confirmText: { en: 'Confirm & Apply', kh: 'យល់ព្រមអនុវត្ត' },
        cancelText: { en: 'Cancel', kh: 'បោះបង់' },
        type: 'save',
        onConfirm: applyBulkAttribute,
      })
    }

    return (
      <SectionShell
        icon={toggleIcon}
        color="#ec4899"
        title={{ en: 'Change Attribute', kh: 'ប្តូរលក្ខណៈសម្បត្តិ' }}
        subtitle={{
          en: 'Batch assign or update dynamic attributes across filtered product lines.',
          kh: 'កំណត់ ឬកែប្រែលក្ខណៈសម្បត្តិផលិតផលជាក្រុមលើទំនិញដែលបានជ្រើសរើស។',
        }}
      >
        {feedback && <Banner feedback={feedback} onClose={() => setFeedback(null)} />}
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

        <div className="flex flex-wrap items-end gap-3 rounded-2xl border border-slate-700/60 bg-slate-900/80 p-5">
          <div className="w-64">
            <Field label={t('Select Attribute Definition', 'ជ្រើសរើសលក្ខណៈសម្បត្តិ')} required>
              <SelectInput
                value={changeAttr.attrId}
                onChange={(e) => setChangeAttr({ ...changeAttr, attrId: e.target.value })}
              >
                <option value="">{t('Select attribute…', 'ជ្រើសរើស…')}</option>
                {defs.map((d) => (
                  <option key={d.id} value={d.id}>{d.name}</option>
                ))}
              </SelectInput>
            </Field>
          </div>

          <div className="flex-1 min-w-[200px]">
            <Field label={t('New Attribute Value', 'តម្លៃលក្ខណៈសម្បត្តិថ្មី')} required>
              <TextInput
                value={changeAttr.value}
                onChange={(e) => setChangeAttr({ ...changeAttr, value: e.target.value })}
                placeholder={t('e.g. Cambodia, 4°C Fresh, 100% Organic, CamGAP', 'ឧ. កម្ពុជា, ៤°C ត្រជាក់, សរីរាង្គ ១០០%')}
              />
            </Field>
          </div>

          <PrimaryButton
            onClick={promptBulkAttribute}
            disabled={!changeAttr.attrId || !changeAttr.value.trim() || saving}
          >
            {saving ? t('Applying…', 'កំពុងអនុវត្ត…') : `🔀 ${t('Apply to All Filtered', 'អនុវត្តលើទាំងអស់')} (${filtered.length})`}
          </PrimaryButton>
        </div>

        <SearchBox query={query} setQuery={setQuery} searchBy={searchBy} setSearchBy={setSearchBy} t={t} />

        <div className="overflow-x-auto rounded-2xl border border-slate-700/60 bg-slate-900/80 shadow-xl">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-700/60 bg-slate-800/50 text-xs font-bold uppercase tracking-wide text-slate-400">
                <th className="px-4 py-3.5">{t('Barcode', 'បារកូដ')}</th>
                <th className="px-4 py-3.5">{t('Code', 'កូដ')}</th>
                <th className="px-4 py-3.5">{t('Product Name', 'ឈ្មោះផលិតផល')}</th>
                <th className="px-4 py-3.5">{t('Current Attributes / Description', 'លក្ខណៈសម្បត្តិបច្ចុប្បន្ន')}</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((p) => (
                <tr key={p.id} className="border-b border-slate-800/60 transition hover:bg-slate-800/30">
                  <td className="px-4 py-3 font-mono text-xs font-bold text-sky-300">{p.barCode || p.barcode || '—'}</td>
                  <td className="px-4 py-3 font-mono text-xs font-bold text-pink-300">{p.code || '—'}</td>
                  <td className="px-4 py-3 font-semibold text-white">{pName(p)}</td>
                  <td className="px-4 py-3">
                    {p.description ? (
                      <div className="flex flex-wrap gap-1.5">
                        {p.description.split('|').map((tag, idx) => (
                          <span key={idx} className="rounded-md bg-slate-800 px-2 py-0.5 text-xs text-slate-300 border border-slate-700">
                            {tag.trim()}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <span className="text-slate-500 italic">—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </SectionShell>
    )
  }

  /* =========================================================================
     5. COST CHANGE (💱)
     ========================================================================= */
  if (sectionKey === 'cost-change') {
    const applyCostAdjustment = async () => {
      const pct = Number(costPct)
      const fixed = Number(costFixed)
      if (Number.isNaN(pct) && Number.isNaN(fixed)) return
      setSaving(true)
      let ok = 0
      for (const p of filtered) {
        try {
          const oldCost = Number(p.averageCost ?? p.cost ?? p.standardCost ?? 0)
          let newCost = oldCost
          if (costPct) newCost = Math.round(oldCost * (1 + pct / 100) * 10000) / 10000
          else if (costFixed) newCost = Math.max(0, Math.round((oldCost + fixed) * 10000) / 10000)

          await adminProductAPI.update(p.id, { ...p, averageCost: newCost })
          ok += 1
        } catch { /* skip */ }
      }
      setFeedback({
        tone: 'green',
        text: t(`✓ Applied cost adjustment on ${ok} product(s) (Reason: ${costReason})`, `✓ បានអនុវត្តការកែប្រែចំណាយលើ ${ok} ផលិតផល (មូលហេតុ: ${costReason})`),
      })
      setCostPct('')
      setCostFixed('')
      setSaving(false)
      adminProductAPI.getAll().then((res) => setProducts(Array.isArray(res?.data) ? res.data : []))
    }

    const promptCostAdjustment = () => {
      setConfirmAction({
        title: { en: 'Apply Cost Update', kh: 'អនុវត្តការកែប្រែចំណាយ' },
        message: {
          en: `Are you sure you want to adjust moving average costs for ${filtered.length} product(s)? (Reason: ${costReason})`,
          kh: `តើអ្នកប្រាកដជាចង់កែប្រែចំណាយមធ្យមលើផលិតផលចំនួន ${filtered.length} មែនទេ? (មូលហេតុ: ${costReason})`,
        },
        confirmText: { en: 'Confirm & Update', kh: 'យល់ព្រមកែប្រែ' },
        cancelText: { en: 'Cancel', kh: 'បោះបង់' },
        type: 'save',
        onConfirm: applyCostAdjustment,
      })
    }

    const exportCostChangeExcel = () => {
      const headers = ['Code']
      if (visibleCostCols.has('barcode')) headers.push('Barcode')
      if (visibleCostCols.has('name')) headers.push('Description')
      if (visibleCostCols.has('nameKh')) headers.push('Second Language')
      if (visibleCostCols.has('currentCost')) headers.push('Current Cost ($)')
      if (visibleCostCols.has('projectedCost')) headers.push('Projected Cost ($)')
      if (visibleCostCols.has('costDelta')) headers.push('Cost Delta ($)')
      if (visibleCostCols.has('retailPrice')) headers.push('Retail Price ($)')
      if (visibleCostCols.has('grossMargin')) headers.push('Gross Margin %')

      const rows = filtered.map((p) => {
        const oldCost = Number(p.averageCost ?? p.cost ?? 0)
        let projected = oldCost
        if (costPct) projected = oldCost * (1 + Number(costPct) / 100)
        else if (costFixed) projected = Math.max(0, oldCost + Number(costFixed))
        const delta = projected - oldCost
        const price = Number(p.basePrice ?? 0)
        const margin = price > 0 ? (((price - projected) / price) * 100).toFixed(1) : '0.0'

        const r = [p.code || '—']
        if (visibleCostCols.has('barcode')) r.push(p.barCode || p.barcode || '—')
        if (visibleCostCols.has('name')) r.push(pName(p))
        if (visibleCostCols.has('nameKh')) r.push(pNameKh(p))
        if (visibleCostCols.has('currentCost')) r.push(oldCost.toFixed(2))
        if (visibleCostCols.has('projectedCost')) r.push(projected.toFixed(2))
        if (visibleCostCols.has('costDelta')) r.push(delta >= 0 ? `+${delta.toFixed(2)}` : delta.toFixed(2))
        if (visibleCostCols.has('retailPrice')) r.push(price.toFixed(2))
        if (visibleCostCols.has('grossMargin')) r.push(`${margin}%`)
        return r
      })

      downloadExcel('products-cost-change.xlsx', 'Cost Change', headers, rows)
    }

    return (
      <SectionShell
        icon={walletIcon}
        color="#f472b6"
        title={{ en: 'Cost Change', kh: 'ប្តូរចំណាយដើម' }}
        subtitle={{
          en: 'Review and bulk-adjust moving average costs due to supplier increases or freight changes.',
          kh: 'ពិនិត្យ និងកែសម្រួលចំណាយមធ្យមជាក្រុម ដោយសារការឡើងថ្លៃរបស់អ្នកផ្គត់ផ្គង់ ឬការដឹកជញ្ជូន។',
        }}
        actions={
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => { setDraftCostCols(new Set(visibleCostCols)); setCostColModalOpen(true) }}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-800/80 px-3.5 py-2 text-xs font-bold text-slate-200 transition hover:bg-slate-700 hover:text-white"
            >
              ⚙️ {t('Choose Column', 'ជ្រើសរើសជួរឈរ')}
            </button>
            <button
              type="button"
              onClick={exportCostChangeExcel}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-800/80 px-3.5 py-2 text-xs font-bold text-slate-200 transition hover:bg-slate-700 hover:text-white"
            >
              📊 {t('Export File Excel', 'នាំចេញឯកសារ Excel')}
            </button>
          </div>
        }
      >
        {feedback && <Banner feedback={feedback} onClose={() => setFeedback(null)} />}
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

        <div className="grid grid-cols-1 gap-4 rounded-2xl border border-slate-700/60 bg-slate-900/80 p-5 sm:grid-cols-2 lg:grid-cols-4">
          <Field label={t('Percentage Adjustment (%)', 'កែប្រែជាភាគរយ (%)')}>
            <TextInput
              type="number"
              step="0.1"
              value={costPct}
              onChange={(e) => { setCostPct(e.target.value); setCostFixed('') }}
              placeholder="e.g. 5.5 or -3.0"
            />
          </Field>

          <Field label={t('Fixed Amount Adjustment ($)', 'កែប្រែជាចំនួនថេរ ($)')}>
            <TextInput
              type="number"
              step="0.01"
              value={costFixed}
              onChange={(e) => { setCostFixed(e.target.value); setCostPct('') }}
              placeholder="e.g. 0.50 or -0.25"
            />
          </Field>

          <Field label={t('Adjustment Reason', 'មូលហេតុនៃការកែប្រែ')}>
            <SelectInput value={costReason} onChange={(e) => setCostReason(e.target.value)}>
              <option value="Supplier Price Adjustment">{t('Supplier Price Increase', 'ការឡើងថ្លៃអ្នកផ្គត់ផ្គង់')}</option>
              <option value="Freight & Logistics Surcharge">{t('Freight / Fuel Surcharge', 'ថ្លៃដឹកជញ្ជូន/ប្រេង')}</option>
              <option value="Exchange Rate Change">{t('Exchange Rate Fluctuation', 'បម្រែបម្រួលអត្រាប្តូរប្រាក់')}</option>
              <option value="Seasonal Discount">{t('Seasonal Vendor Discount', 'ការបញ្ចុះតម្លៃរដូវកាល')}</option>
            </SelectInput>
          </Field>

          <div className="flex items-end">
            <PrimaryButton
              onClick={promptCostAdjustment}
              disabled={(!costPct && !costFixed) || saving}
            >
              {saving ? t('Applying…', 'កំពុងអនុវត្ត…') : `✓ ${t('Apply Cost Update', 'អនុវត្តការប្តូរចំណាយ')}`}
            </PrimaryButton>
          </div>
        </div>

        <SearchBox query={query} setQuery={setQuery} searchBy={searchBy} setSearchBy={setSearchBy} t={t} />

        <div className="overflow-x-auto rounded-2xl border border-slate-700/60 bg-slate-900/80 shadow-xl">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-700/60 bg-slate-800/50 text-xs font-bold uppercase tracking-wide text-slate-400">
                <th className="px-4 py-3.5">{t('Code', 'កូដ')}</th>
                {visibleCostCols.has('barcode') && <th className="px-4 py-3.5">{t('Barcode', 'បារកូដ')}</th>}
                {visibleCostCols.has('name') && <th className="px-4 py-3.5">{t('Product Description', 'ការពិពណ៌នា')}</th>}
                {visibleCostCols.has('nameKh') && <th className="px-4 py-3.5">{t('Second Language', 'ភាសាខ្មែរ')}</th>}
                {visibleCostCols.has('currentCost') && <th className="px-4 py-3.5 text-right">{t('Current Cost', 'ចំណាយបច្ចុប្បន្ន')}</th>}
                {visibleCostCols.has('projectedCost') && <th className="px-4 py-3.5 text-right">{t('Projected Cost', 'ចំណាយប៉ាន់ស្មាន')}</th>}
                {visibleCostCols.has('costDelta') && <th className="px-4 py-3.5 text-right">{t('Delta', 'បម្រែបម្រួល')}</th>}
                {visibleCostCols.has('retailPrice') && <th className="px-4 py-3.5 text-right">{t('Retail Price', 'តម្លៃលក់')}</th>}
                {visibleCostCols.has('grossMargin') && <th className="px-4 py-3.5 text-right">{t('Gross Margin', 'អត្រាចំណេញ')}</th>}
              </tr>
            </thead>
            <tbody>
              {filtered.map((p) => {
                const oldCost = Number(p.averageCost ?? p.cost ?? 0)
                let projected = oldCost
                if (costPct) projected = oldCost * (1 + Number(costPct) / 100)
                else if (costFixed) projected = Math.max(0, oldCost + Number(costFixed))
                const delta = projected - oldCost
                const price = Number(p.basePrice ?? 0)
                const margin = price > 0 ? (((price - projected) / price) * 100) : 0

                return (
                  <tr key={p.id} className="border-b border-slate-800/60 transition hover:bg-slate-800/30">
                    <td className="px-4 py-3 font-mono text-xs font-bold text-slate-400">{p.code || '—'}</td>
                    {visibleCostCols.has('barcode') && (
                      <td className="px-4 py-3 font-mono text-xs text-slate-400">{p.barCode || p.barcode || '—'}</td>
                    )}
                    {visibleCostCols.has('name') && (
                      <td className="px-4 py-3 font-semibold text-white">{pName(p)}</td>
                    )}
                    {visibleCostCols.has('nameKh') && (
                      <td className="px-4 py-3 font-medium text-slate-300 font-khmer">{pNameKh(p)}</td>
                    )}
                    {visibleCostCols.has('currentCost') && (
                      <td className="px-4 py-3 text-right font-mono text-slate-300">${oldCost.toFixed(2)}</td>
                    )}
                    {visibleCostCols.has('projectedCost') && (
                      <td className="px-4 py-3 text-right font-mono font-bold text-amber-300">
                        ${projected.toFixed(2)}
                      </td>
                    )}
                    {visibleCostCols.has('costDelta') && (
                      <td className="px-4 py-3 text-right font-mono text-xs">
                        <span className={`font-bold ${delta > 0 ? 'text-red-400' : delta < 0 ? 'text-green-400' : 'text-slate-500'}`}>
                          {delta > 0 ? `+$${delta.toFixed(2)}` : delta < 0 ? `-$${Math.abs(delta).toFixed(2)}` : '$0.00'}
                        </span>
                      </td>
                    )}
                    {visibleCostCols.has('retailPrice') && (
                      <td className="px-4 py-3 text-right font-mono font-bold text-green-300">${price.toFixed(2)}</td>
                    )}
                    {visibleCostCols.has('grossMargin') && (
                      <td className="px-4 py-3 text-right">
                        <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-bold ${
                          margin >= 25 ? 'bg-green-500/20 text-green-300' : margin >= 10 ? 'bg-amber-500/20 text-amber-300' : 'bg-red-500/20 text-red-300'
                        }`}>
                          {margin.toFixed(1)}%
                        </span>
                      </td>
                    )}
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        {/* Choose Column Modal for Cost Change */}
        <Modal
          open={costColModalOpen}
          onClose={() => setCostColModalOpen(false)}
          title={t('Choose Columns - Cost Change', 'ជ្រើសរើសជួរឈរ - ប្តូរចំណាយ')}
        >
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800 text-xs">
              <span className="text-slate-400">{t('Toggle table column visibility:', 'ជ្រើសរើសជួរឈរដែលត្រូវបង្ហាញ៖')}</span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setDraftCostCols(new Set(COST_CHANGE_COLS.map((c) => c.key)))}
                  className="text-green-400 hover:underline font-bold"
                >
                  {t('Select All', 'ជ្រើសរើសទាំងអស់')}
                </button>
                <span className="text-slate-600">·</span>
                <button
                  type="button"
                  onClick={() => setDraftCostCols(new Set(['barcode', 'name', 'currentCost', 'projectedCost', 'costDelta', 'retailPrice']))}
                  className="text-slate-400 hover:underline"
                >
                  {t('Reset Default', 'កំណត់ឡើងវិញ')}
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 py-2">
              <div className="flex items-center gap-3 rounded-xl border border-slate-800 bg-slate-950/60 p-3 opacity-60">
                <input type="checkbox" checked disabled className="rounded text-pink-500" />
                <span className="text-xs font-bold text-white">{t('Code (Fixed)', 'កូដ (ថេរ)')}</span>
              </div>

              {COST_CHANGE_COLS.map((col) => {
                const isChecked = draftCostCols.has(col.key)
                return (
                  <label
                    key={col.key}
                    className="flex items-center gap-3 rounded-xl border border-slate-800 bg-slate-950/60 p-3 cursor-pointer hover:border-slate-700 transition"
                  >
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => {
                        const next = new Set(draftCostCols)
                        if (next.has(col.key)) next.delete(col.key)
                        else next.add(col.key)
                        setDraftCostCols(next)
                      }}
                      className="rounded text-pink-500 focus:ring-pink-500"
                    />
                    <span className="text-xs font-bold text-white">{t(col.label.en, col.label.kh)}</span>
                  </label>
                )
              })}
            </div>

            <div className="flex justify-end gap-3 border-t border-slate-800 pt-4">
              <GhostButton onClick={() => setCostColModalOpen(false)}>{t('Cancel', 'បោះបង់')}</GhostButton>
              <PrimaryButton onClick={() => { setVisibleCostCols(new Set(draftCostCols)); setCostColModalOpen(false) }}>
                {t('Apply Columns', 'អនុវត្ត')}
              </PrimaryButton>
            </div>
          </div>
        </Modal>
      </SectionShell>
    )
  }

  /* =========================================================================
     6. PRODUCTS SUPPLIER (🏭)
     ========================================================================= */
  if (sectionKey === 'products-supplier') {
    const exportSupplierLinks = () => {
      const headers = ['Product Code', 'Product Name', 'Supplier Name', 'Vendor Part Number (VPN)', 'Standard Cost ($)']
      const rows = supplierLinks.map((l) => [
        l.productCode || '—',
        l.productName || '—',
        l.supplierName || '—',
        l.partNumber || '—',
        l.cost ? Number(l.cost).toFixed(2) : '—',
      ])
      downloadExcel('products-supplier-mapping.xlsx', 'Suppliers Mapping', headers, rows)
    }

    const promptDeleteSupplierLink = (linkId, prodName, supName) => {
      setConfirmAction({
        title: { en: 'Delete Supplier Mapping', kh: 'លុបការភ្ជាប់អ្នកផ្គត់ផ្គង់' },
        message: {
          en: `Are you sure you want to remove supplier link for "${prodName || 'Product'}" with "${supName || 'Supplier'}"?`,
          kh: `តើអ្នកប្រាកដជាចង់លុបការភ្ជាប់រវាង "${prodName || 'ផលិតផល'}" និង "${supName || 'អ្នកផ្គត់ផ្គង់'}" មែនទេ?`,
        },
        confirmText: { en: 'Confirm & Delete', kh: 'យល់ព្រមលុប' },
        cancelText: { en: 'Cancel', kh: 'បោះបង់' },
        type: 'danger',
        onConfirm: () => supplierLinkApi.remove(linkId),
      })
    }

    const promptSaveSupplierLink = () => {
      const sup = suppliers.find((s) => String(s.id) === linkForm.supplierId)
      const prod = products.find((p) => String(p.id) === linkForm.productId)
      setConfirmAction({
        title: { en: 'Save Supplier Mapping', kh: 'រក្សាទុកការភ្ជាប់អ្នកផ្គត់ផ្គង់' },
        message: {
          en: `Are you sure you want to link "${prod ? pName(prod) : 'Product'}" to "${sup?.name || 'Supplier'}"?`,
          kh: `តើអ្នកប្រាកដជាចង់ភ្ជាប់ "${prod ? pName(prod) : 'ផលិតផល'}" ទៅកាន់ "${sup?.name || 'អ្នកផ្គត់ផ្គង់'}" មែនទេ?`,
        },
        confirmText: { en: 'Confirm & Save', kh: 'យល់ព្រមរក្សាទុក' },
        cancelText: { en: 'Cancel', kh: 'បោះបង់' },
        type: 'save',
        onConfirm: () => {
          supplierLinkApi.add({
            productId: linkForm.productId,
            productCode: prod?.code || '',
            productName: prod ? pName(prod) : '',
            supplierId: linkForm.supplierId,
            supplierName: sup?.name || 'Main Supplier',
            partNumber: linkForm.partNumber.trim() || '—',
            cost: linkForm.cost,
          })
          setLinkForm(null)
        },
      })
    }

    return (
      <SectionShell
        icon={linkIcon}
        color="#fb7185"
        title={{ en: 'Products Supplier', kh: 'ផលិតផល-អ្នកផ្គត់ផ្គង់' }}
        subtitle={{
          en: 'Link SKUs to suppliers, map vendor part numbers (VPN) and negotiate purchase costs.',
          kh: 'ភ្ជាប់ផលិតផលទៅកាន់អ្នកផ្គត់ផ្គង់ កំណត់លេខកូដអ្នកលក់ (VPN) និងតម្លៃទិញ។',
        }}
        actions={
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={exportSupplierLinks}
              className="inline-flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-800/80 px-3.5 py-2 text-xs font-bold text-slate-200 transition hover:bg-slate-700 hover:text-white"
            >
              📊 {t('Export Excel', 'នាំចេញ Excel')}
            </button>
            <PrimaryButton
              onClick={() => setLinkForm({ productId: '', supplierId: '', partNumber: '', cost: '', leadTime: '3' })}
            >
              + {t('Link Product to Supplier', 'ភ្ជាប់ផលិតផលទៅអ្នកផ្គត់ផ្គង់')}
            </PrimaryButton>
          </div>
        }
      >
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

        <div className="overflow-x-auto rounded-2xl border border-slate-700/60 bg-slate-900/80 shadow-xl">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-700/60 bg-slate-800/50 text-xs font-bold uppercase tracking-wide text-slate-400">
                <th className="px-4 py-3.5">{t('Product Name', 'ឈ្មោះផលិតផល')}</th>
                <th className="px-4 py-3.5">{t('Supplier Name', 'អ្នកផ្គត់ផ្គង់')}</th>
                <th className="px-4 py-3.5">{t('Vendor Part No. (VPN)', 'លេខផ្នែកអ្នកលក់')}</th>
                <th className="px-4 py-3.5 text-right">{t('Purchase Cost ($)', 'តម្លៃទិញ ($)')}</th>
                <th className="px-4 py-3.5 text-center">{t('Action', 'សកម្មភាព')}</th>
              </tr>
            </thead>
            <tbody>
              {supplierLinks.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-16 text-center text-slate-400">
                    <span className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-slate-800 text-2xl">🏭</span>
                    <p className="text-sm font-semibold">{t('No supplier mappings linked yet.', 'មិនទាន់មានការភ្ជាប់អ្នកផ្គត់ផ្គង់ទេ។')}</p>
                  </td>
                </tr>
              ) : (
                supplierLinks.map((l) => (
                  <tr key={l.id} className="border-b border-slate-800/60 transition hover:bg-slate-800/30">
                    <td className="px-4 py-3 font-semibold text-white">{l.productName || `#${l.productId}`}</td>
                    <td className="px-4 py-3 font-medium text-slate-300">{l.supplierName || '—'}</td>
                    <td className="px-4 py-3 font-mono text-xs text-rose-300">{l.partNumber || '—'}</td>
                    <td className="px-4 py-3 text-right font-mono font-bold text-amber-300">
                      {l.cost ? `$${Number(l.cost).toFixed(2)}` : '—'}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <button
                        type="button"
                        onClick={() => promptDeleteSupplierLink(l.id, l.productName, l.supplierName)}
                        className="rounded-lg p-1.5 text-slate-400 transition hover:bg-red-500/20 hover:text-red-300"
                        title={t('Delete link', 'លុបការភ្ជាប់')}
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

        {/* Link Modal */}
        <Modal
          open={!!linkForm}
          onClose={() => setLinkForm(null)}
          title={t('Link Product to Supplier', 'ភ្ជាប់ផលិតផលទៅអ្នកផ្គត់ផ្គង់')}
        >
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label={t('Product', 'ផលិតផល')} required>
              <SelectInput
                value={linkForm?.productId || ''}
                onChange={(e) => setLinkForm({ ...linkForm, productId: e.target.value })}
              >
                <option value="">{t('Select product…', 'ជ្រើសរើស…')}</option>
                {products.map((p) => (
                  <option key={p.id} value={p.id}>{pName(p)}</option>
                ))}
              </SelectInput>
            </Field>

            <Field label={t('Supplier', 'អ្នកផ្គត់ផ្គង់')} required>
              <SelectInput
                value={linkForm?.supplierId || ''}
                onChange={(e) => setLinkForm({ ...linkForm, supplierId: e.target.value })}
              >
                <option value="">{t('Select supplier…', 'ជ្រើសរើស…')}</option>
                {suppliers.map((s) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </SelectInput>
            </Field>

            <Field label={t('Vendor Part No. (VPN)', 'លេខផ្នែកអ្នកលក់')}>
              <TextInput
                value={linkForm?.partNumber || ''}
                onChange={(e) => setLinkForm({ ...linkForm, partNumber: e.target.value })}
                placeholder="e.g. VEND-SKU-990"
              />
            </Field>

            <Field label={t('Contracted Purchase Cost ($)', 'តម្លៃទិញ ($)')}>
              <TextInput
                type="number"
                min="0"
                step="0.01"
                value={linkForm?.cost || ''}
                onChange={(e) => setLinkForm({ ...linkForm, cost: e.target.value })}
                placeholder="e.g. 2.45"
              />
            </Field>
          </div>

          <div className="mt-6 flex justify-end gap-3 border-t border-slate-800 pt-4">
            <GhostButton onClick={() => setLinkForm(null)}>{t('Cancel', 'បោះបង់')}</GhostButton>
            <PrimaryButton
              disabled={!linkForm?.productId || !linkForm?.supplierId}
              onClick={promptSaveSupplierLink}
            >
              {t('Save Mapping', 'រក្សាទុក')}
            </PrimaryButton>
          </div>
        </Modal>
      </SectionShell>
    )
  }

  return null
}

/* =========================================================================
   7. SERIAL INFORMATION (🔖)
   ========================================================================= */
export const SerialInformation = () => {
  const { lang } = useLanguage()
  const [products, setProducts] = useState([])
  const [serials, serialApi] = useCollection('serials')
  const [formOpen, setFormOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [confirmAction, setConfirmAction] = useState(null)
  const [form, setForm] = useState({
    productId: '',
    serial: '',
    batch: '',
    expiryDate: '',
    warrantyMonths: '12',
  })

  const t = (en, kh) => (lang === 'en' ? en : kh)

  useEffect(() => {
    adminProductAPI.getAll()
      .then((res) => setProducts(Array.isArray(res?.data) ? res.data : []))
      .catch(() => {})
  }, [])

  const filteredSerials = serials.filter((s) => {
    const q = searchQuery.trim().toLowerCase()
    if (!q) return true
    return (
      String(s.productName || '').toLowerCase().includes(q) ||
      String(s.serial || '').toLowerCase().includes(q) ||
      String(s.batch || '').toLowerCase().includes(q)
    )
  })

  const exportSerials = () => {
    const headers = ['Product Code', 'Product Name', 'Serial Number', 'Batch / Lot', 'Expiry Date', 'Status']
    const rows = filteredSerials.map((s) => [
      s.productCode || '—',
      s.productName || '—',
      s.serial || '—',
      s.batch || '—',
      s.expiryDate || '—',
      s.expiryDate && new Date(s.expiryDate) < new Date() ? 'Expired' : 'Active',
    ])
    downloadExcel('product-serials-inventory.xlsx', 'Serials', headers, rows)
  }

  const promptDeleteSerial = (serialId, serialNum, prodName) => {
    setConfirmAction({
      title: { en: 'Delete Serial Number', kh: 'លុបលេខសៀរៀល' },
      message: {
        en: `Are you sure you want to delete serial "${serialNum}" for "${prodName || 'Product'}"?`,
        kh: `តើអ្នកប្រាកដជាចង់លុបលេខសៀរៀល "${serialNum}" សម្រាប់ "${prodName || 'ផលិតផល'}" មែនទេ?`,
      },
      confirmText: { en: 'Confirm & Delete', kh: 'យល់ព្រមលុប' },
      cancelText: { en: 'Cancel', kh: 'បោះបង់' },
      type: 'danger',
      onConfirm: () => serialApi.remove(serialId),
    })
  }

  const promptSaveSerial = () => {
    const prod = products.find((p) => String(p.id) === form.productId)
    setConfirmAction({
      title: { en: 'Save Serial Record', kh: 'រក្សាទុកលេខសៀរៀល' },
      message: {
        en: `Are you sure you want to record serial number "${form.serial}" for "${prod ? pName(prod) : 'Product'}"?`,
        kh: `តើអ្នកប្រាកដជាចង់កត់ត្រាលេខសៀរៀល "${form.serial}" សម្រាប់ "${prod ? pName(prod) : 'ផលិតផល'}" មែនទេ?`,
      },
      confirmText: { en: 'Confirm & Save', kh: 'យល់ព្រមរក្សាទុក' },
      cancelText: { en: 'Cancel', kh: 'បោះបង់' },
      type: 'save',
      onConfirm: () => {
        serialApi.add({
          productId: form.productId,
          productCode: prod?.code || '',
          productName: prod ? pName(prod) : '',
          serial: form.serial.trim(),
          batch: form.batch.trim() || '—',
          expiryDate: form.expiryDate,
        })
        setFormOpen(false)
      },
    })
  }

  return (
    <SectionShell
      icon={hashIcon}
      color="#38bdf8"
      title={{ en: 'Serial Information', kh: 'ព័ត៌មានសៀរៀល' }}
      subtitle={{
        en: 'Track serialized goods, batch lot numbers and warranty expiration dates.',
        kh: 'តាមដានលេខសៀរៀលទំនិញ លេខបាច់/ឡុត និងកាលបរិច្ឆេទផុតកំណត់។',
      }}
      actions={
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={exportSerials}
            className="inline-flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-800/80 px-3.5 py-2 text-xs font-bold text-slate-200 transition hover:bg-slate-700 hover:text-white"
          >
            📊 {t('Export Excel', 'នាំចេញ Excel')}
          </button>
          <PrimaryButton onClick={() => {
            setForm({
              productId: '',
              serial: `SN-${new Date().getFullYear()}${String(Date.now()).slice(-5)}`,
              batch: `LOT-${String(Date.now()).slice(-4)}`,
              expiryDate: '',
              warrantyMonths: '12',
            })
            setFormOpen(true)
          }}>
            + {t('New Serial Number', 'សៀរៀលថ្មី')}
          </PrimaryButton>
        </div>
      }
    >
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

      <div className="relative mb-4 max-w-md">
        <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500">🔍</span>
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder={t('Search Serial, Batch, or Product Name...', 'ស្វែងរកសៀរៀល បាច់ ឬឈ្មោះផលិតផល...')}
          className="w-full rounded-xl border border-slate-700/70 bg-slate-950/60 py-2.5 pl-10 pr-4 text-sm text-white placeholder-slate-500 outline-none focus:border-sky-400"
        />
      </div>

      <div className="overflow-x-auto rounded-2xl border border-slate-700/60 bg-slate-900/80 shadow-xl">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-slate-700/60 bg-slate-800/50 text-xs font-bold uppercase tracking-wide text-slate-400">
              <th className="px-4 py-3.5">{t('Product Name', 'ឈ្មោះផលិតផល')}</th>
              <th className="px-4 py-3.5">{t('Serial Number', 'លេខសៀរៀល')}</th>
              <th className="px-4 py-3.5">{t('Batch / Lot', 'បាច់ / ឡុត')}</th>
              <th className="px-4 py-3.5">{t('Expiry Date', 'ថ្ងៃផុតកំណត់')}</th>
              <th className="px-4 py-3.5">{t('Status', 'ស្ថានភាព')}</th>
              <th className="px-4 py-3.5 text-center">{t('Action', 'សកម្មភាព')}</th>
            </tr>
          </thead>
          <tbody>
            {filteredSerials.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-16 text-center text-slate-400">
                  <span className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-slate-800 text-2xl">🔖</span>
                  <p className="text-sm font-semibold">{t('No serial numbers recorded yet.', 'មិនទាន់មានលេខសៀរៀលទេ។')}</p>
                </td>
              </tr>
            ) : (
              filteredSerials.map((s) => {
                const isExpired = s.expiryDate && new Date(s.expiryDate) < new Date()
                return (
                  <tr key={s.id} className="border-b border-slate-800/60 transition hover:bg-slate-800/30">
                    <td className="px-4 py-3 font-semibold text-white">{s.productName || `#${s.productId}`}</td>
                    <td className="px-4 py-3 font-mono text-xs font-bold text-sky-300">{s.serial}</td>
                    <td className="px-4 py-3 font-mono text-xs text-amber-300">{s.batch || '—'}</td>
                    <td className="px-4 py-3 text-slate-300">{s.expiryDate || '—'}</td>
                    <td className="px-4 py-3">
                      <Pill tone={isExpired ? 'red' : 'green'}>
                        {isExpired ? t('Expired', 'ផុតកំណត់') : t('Active', 'មានសុពលភាព')}
                      </Pill>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <button
                        type="button"
                        onClick={() => promptDeleteSerial(s.id, s.serial, s.productName)}
                        className="rounded-lg p-1.5 text-slate-400 transition hover:bg-red-500/20 hover:text-red-300"
                        title={t('Delete serial', 'លុបសៀរៀល')}
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

      <Modal open={formOpen} onClose={() => setFormOpen(false)} title={t('Record New Serial / Batch Number', 'កត់ត្រាលេខសៀរៀល / បាច់ថ្មី')}>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label={t('Product', 'ផលិតផល')} required>
            <SelectInput value={form.productId} onChange={(e) => setForm({ ...form, productId: e.target.value })}>
              <option value="">{t('Select product…', 'ជ្រើសរើស…')}</option>
              {products.map((p) => (
                <option key={p.id} value={p.id}>{pName(p)}</option>
              ))}
            </SelectInput>
          </Field>

          <Field label={t('Serial Number', 'លេខសៀរៀល')} required>
            <TextInput value={form.serial} onChange={(e) => setForm({ ...form, serial: e.target.value })} placeholder="SN-2026-00001" />
          </Field>

          <Field label={t('Batch / Lot Number', 'លេខបាច់/ឡុត')}>
            <TextInput value={form.batch} onChange={(e) => setForm({ ...form, batch: e.target.value })} placeholder="LOT-A17" />
          </Field>

          <Field label={t('Expiry Date', 'ថ្ងៃផុតកំណត់')}>
            <TextInput type="date" value={form.expiryDate} onChange={(e) => setForm({ ...form, expiryDate: e.target.value })} />
          </Field>
        </div>

        <div className="mt-6 flex justify-end gap-3 border-t border-slate-800 pt-4">
          <GhostButton onClick={() => setFormOpen(false)}>{t('Cancel', 'បោះបង់')}</GhostButton>
          <PrimaryButton
            disabled={!form.productId || !form.serial.trim()}
            onClick={promptSaveSerial}
          >
            {t('Save Serial', 'រក្សាទុក')}
          </PrimaryButton>
        </div>
      </Modal>
    </SectionShell>
  )
}

/* ---------- Shared Subcomponents ---------- */
const SearchBox = ({ query, setQuery, searchBy, setSearchBy, t }) => (
  <div className="my-4 flex flex-col gap-3 sm:flex-row sm:items-center">
    <div className="relative flex-1">
      <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500">🔍</span>
      <input
        type="text"
        placeholder={t('Search products by code, barcode, or name…', 'ស្វែងរកតាមកូដ បារកូដ ឬឈ្មោះ…')}
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        className="w-full rounded-xl border border-slate-700/70 bg-slate-950/60 py-2.5 pl-10 pr-8 text-sm text-white placeholder-slate-500 outline-none focus:border-green-400"
      />
      {query && (
        <button
          type="button"
          onClick={() => setQuery('')}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-500 hover:text-white"
        >
          ✕
        </button>
      )}
    </div>

    {setSearchBy && (
      <div className="flex items-center gap-2">
        <span className="whitespace-nowrap text-xs font-bold uppercase tracking-wide text-slate-400">
          {t('Filter:', 'ច្រោះ:')}
        </span>
        <select
          value={searchBy}
          onChange={(e) => setSearchBy(e.target.value)}
          className="rounded-xl border border-slate-700 bg-slate-950 px-3 py-2.5 text-xs font-bold text-slate-200 outline-none focus:border-green-400"
        >
          <option value="any">{t('Any', 'ទាំងអស់')}</option>
          <option value="name">{t('Name', 'ឈ្មោះ')}</option>
          <option value="code">{t('Code', 'កូដ')}</option>
          <option value="barcode">{t('Barcode', 'បារកូដ')}</option>
        </select>
      </div>
    )}
  </div>
)

const Banner = ({ feedback, onClose }) => (
  <div className={`mb-4 flex items-center justify-between rounded-xl border px-4 py-3 text-sm font-semibold ${
    feedback.tone === 'green' ? 'border-green-500/40 bg-green-500/10 text-green-300' :
    feedback.tone === 'blue' ? 'border-sky-500/40 bg-sky-500/10 text-sky-300' :
    'border-orange-500/40 bg-orange-500/10 text-amber-300'
  }`}>
    <span>{feedback.text}</span>
    {onClose && <button type="button" onClick={onClose} className="text-xs opacity-70 hover:opacity-100">✕</button>}
  </div>
)

export default ToolsSection
