import { useEffect, useRef, useState } from 'react'
import * as XLSX from 'xlsx'
import { useLanguage } from '../../context/LanguageContext'
import { useAuth } from '../../context/AuthContext'
import { adminUnitAPI, adminTransferAPI, adminProductAPI } from '../../api/api'
import { Field, TextInput, SelectInput, PrimaryButton, GhostButton, Pill } from './stockUI'
import { exportStyledExcel } from '../../utils/excelExport'
import './ReceiveProductsCreate.css'

const OUTLETS = [
  { key: 'main-warehouse', en: 'Main Warehouse', kh: 'ឃ្លាំងកណ្តាល' },
  { key: 'outlet-1-bkk1', en: 'Outlet 1 - BKK1', kh: 'សាខា ១ - បឹងកេងកង ១' },
  { key: 'outlet-2-toul-kork', en: 'Outlet 2 - Toul Kork', kh: 'សាខា ២ - ទួលគោក' },
  { key: 'outlet-3-chbar-ampov', en: 'Outlet 3 - Chbar Ampov', kh: 'សាខា ៣ - ច្បារអំពៅ' },
  { key: 'outlet-4-sen-sok', en: 'Outlet 4 - Sen Sok', kh: 'សាខា ៤ - សែនសុខ' },
]

const LOCATIONS_LIST = [
  { key: 'cold-storage-1', en: 'Cold Storage Bay 1 (4°C)', kh: 'ឃ្លាំងត្រជាក់ ១ (៤°C)' },
  { key: 'fresh-produce-hub', en: 'Fresh Produce Hub', kh: 'ឃ្លាំងបន្លែផ្លែឈើស្រស់' },
  { key: 'dry-goods-bay', en: 'Dry Goods Section', kh: 'ផ្នែកទំនិញស្ងួត' },
  { key: 'front-chiller', en: 'Front Display Chiller', kh: 'ទូត្រជាក់ខាងមុខ' },
  { key: 'backstore-rack', en: 'Backstore Storage Rack', kh: 'ធ្នើខាងក្រោយ' },
  { key: 'receiving-dock', en: 'Receiving Dock', kh: 'កន្លែងទទួលទំនិញ' },
]

const TRANSFER_TYPES = [
  'Direct Transfer',
  'Inter-Branch Transfer',
  'Warehouse Rebalancing',
  'Damaged Return',
  'Emergency Stock Transfer',
  'Store Restock',
  'Other',
]

const TEMPLATES = [
  { value: 'default', en: 'Default Template', kh: 'គំរូលំនាំដើម' },
  { value: 'inter-branch', en: 'Direct Inter-Store Transfer', kh: 'ផ្ទេរផ្ទាល់រវាងសាខា' },
  { value: 'rebalancing', en: 'Warehouse Rebalancing', kh: 'តម្រឹមស្តុកឃ្លាំង' },
  { value: 'blank', en: 'Blank Template', kh: 'ទំព័រទំនេរ' },
]

export const TransferProductsCreate = ({ products, onCreated, onClose }) => {
  const { lang } = useLanguage()
  const { user } = useAuth()
  const fileInputRef = useRef(null)

  const t = (en, kh) => (lang === 'en' ? en : kh)

  /* ---------- General Information State ---------- */
  const [docCode] = useState(() => `TF-${String(Date.now()).slice(-6)}`)
  const [transferDate, setTransferDate] = useState(() => new Date().toISOString().slice(0, 10))
  const [templateName, setTemplateName] = useState('default')
  const [requestTransferDate, setRequestTransferDate] = useState(() => new Date().toISOString().slice(0, 10))
  const [transferType, setTransferType] = useState('Direct Transfer')
  const [reference, setReference] = useState('')
  const [fromOutlet, setFromOutlet] = useState('main-warehouse')
  const [fromLocation, setFromLocation] = useState('cold-storage-1')
  const [toOutlet, setToOutlet] = useState('outlet-1-bkk1')
  const [toLocation, setToLocation] = useState('front-chiller')
  const [userName, setUserName] = useState(() => user?.fullName || user?.username || 'Sokheng Thoeun')

  /* ---------- Product Lines State ---------- */
  const [liveProducts, setLiveProducts] = useState(Array.isArray(products) ? products : [])
  const [units, setUnits] = useState([])
  const [lines, setLines] = useState([])
  const [productQuery, setProductQuery] = useState('')
  const [searchFocused, setSearchFocused] = useState(false)
  const searchBoxRef = useRef(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)
  const [postedDoc, setPostedDoc] = useState(null)

  useEffect(() => {
    adminUnitAPI.getAll()
      .then((res) => setUnits(Array.isArray(res?.data) ? res.data : []))
      .catch(() => {})
    adminProductAPI.getAll()
      .then((res) => {
        if (Array.isArray(res?.data) && res.data.length > 0) {
          setLiveProducts(res.data)
        }
      })
      .catch(() => {})
  }, [])

  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (searchBoxRef.current && !searchBoxRef.current.contains(e.target)) {
        setSearchFocused(false)
      }
    }
    document.addEventListener('mousedown', handleOutsideClick)
    return () => document.removeEventListener('mousedown', handleOutsideClick)
  }, [])

  const productName = (p) => {
    if (!p) return ''
    if (typeof p.name === 'object' && p.name !== null) {
      return (lang === 'kh' ? p.name.kh || p.name.en : p.name.en || p.name.kh) || `#${p.id}`
    }
    if (lang === 'kh' && p.nameKh) return p.nameKh
    return p.name || p.nameKh || p.description || `#${p.id}`
  }

  /* ---------- Product Search (Code | Barcode | Description) ---------- */
  const allProductsList = liveProducts.length > 0 ? liveProducts : (Array.isArray(products) ? products : [])
  const matches = (() => {
    const q = productQuery.trim().toLowerCase()
    if (!q) return allProductsList.slice(0, 40)
    return allProductsList.filter((p) => {
      const codeStr = String(p.code || '').toLowerCase()
      const barCodeStr = String(p.barCode || p.barcode || '').toLowerCase()
      const nameEnStr = String(typeof p.name === 'object' ? p.name?.en : p.name || '').toLowerCase()
      const nameKhStr = String(p.nameKh || (typeof p.name === 'object' ? p.name?.kh : '') || '').toLowerCase()
      const descStr = String(p.description || '').toLowerCase()
      return codeStr.includes(q) || barCodeStr.includes(q) || nameEnStr.includes(q) || nameKhStr.includes(q) || descStr.includes(q)
    }).slice(0, 40)
  })()

  const addProduct = (p) => {
    if (lines.some((l) => String(l.productId) === String(p.id))) {
      setError(t('Product is already in the transfer list.', 'ផលិតផលបានបន្ថែមរួចហើយ។'))
      return
    }
    setError(null)
    setLines([...lines, {
      productId: p.id,
      code: p.code || `#${p.id}`,
      barCode: p.barCode || p.barcode || '—',
      name: productName(p),
      imageUrl: (typeof p.imageUrl === 'string' && !p.imageUrl.startsWith('blob:')) ? p.imageUrl : '',
      onHand: Number(p.onHand) || 0,
      qty: '1',
      uom: p.uom || p.unit || 'Kg',
      raw: p,
    }])
    setProductQuery('')
    setSearchFocused(false)
  }

  const patchLine = (i, patch) =>
    setLines(lines.map((l, j) => (j === i ? { ...l, ...patch } : l)))

  const removeLine = (i) => setLines(lines.filter((_, j) => j !== i))

  const totalQty = lines.reduce((sum, l) => sum + (Number(l.qty) || 0), 0)

  /* ---------- Excel Export ---------- */
  const exportProductLines = () => {
    if (lines.length === 0) {
      setError(t('Add at least one product before exporting.', 'សូមបន្ថែមផលិតផលយ៉ាងតិចមួយមុនពេលនាំចេញ។'))
      return
    }
    const headers = ['Code', 'Barcode', 'Description', 'Onhand', 'Request Qty', 'UOM']
    const dataRows = lines.map((l) => [
      l.code || '—',
      l.barCode || '—',
      l.name || '—',
      Number(l.onHand || 0),
      Number(l.qty) || 0,
      l.uom || 'Unit',
    ])
    exportStyledExcel({
      filename: `transfer-products-${docCode}.xlsx`,
      sheetName: 'Transfer Lines',
      title: `TRANSFER PRODUCTS ITEMS - ${docCode}`,
      subtitle: `Outlet: ${requestOutlet} · Location: ${requestLocation} · Lines: ${lines.length}`,
      headers,
      data: dataRows,
    })
  }

  /* ---------- Excel Import ---------- */
  const handleExcelImport = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setError(null)
    const reader = new FileReader()
    reader.onload = (evt) => {
      try {
        const data = new Uint8Array(evt.target.result)
        const workbook = XLSX.read(data, { type: 'array' })
        const firstSheetName = workbook.SheetNames[0]
        const worksheet = workbook.Sheets[firstSheetName]
        const rows = XLSX.utils.sheet_to_json(worksheet, { header: 1 })
        if (rows.length < 2) {
          setError(t('Excel file is empty or missing data rows.', 'ឯកសារ Excel គ្មានទិន្នន័យ។'))
          return
        }

        const newLines = [...lines]
        let addedCount = 0

        const headerRow = rows[0].map((h) => String(h || '').toLowerCase().trim())
        const codeIdx = headerRow.findIndex((h) => h.includes('code') && !h.includes('bar'))
        const barcodeIdx = headerRow.findIndex((h) => h.includes('barcode') || h.includes('bar code'))
        const descIdx = headerRow.findIndex((h) => h.includes('desc') || h.includes('name') || h.includes('product'))
        const qtyIdx = headerRow.findIndex((h) => h.includes('qty') || h.includes('quantity') || h.includes('request'))
        const uomIdx = headerRow.findIndex((h) => h.includes('uom') || h.includes('unit'))

        for (let i = 1; i < rows.length; i++) {
          const row = rows[i]
          if (!row || row.length === 0) continue
          const rowCode = codeIdx >= 0 ? String(row[codeIdx] || '').trim() : ''
          const rowBarcode = barcodeIdx >= 0 ? String(row[barcodeIdx] || '').trim() : ''
          const rowDesc = descIdx >= 0 ? String(row[descIdx] || '').trim() : ''
          const rowQty = qtyIdx >= 0 ? Number(row[qtyIdx]) || 1 : 1
          const rowUom = uomIdx >= 0 ? String(row[uomIdx] || '').trim() : 'Kg'

          const matched = products.find((p) => {
            if (rowCode && String(p.code || '').toLowerCase() === rowCode.toLowerCase()) return true
            if (rowBarcode && String(p.barCode || p.barcode || '').toLowerCase() === rowBarcode.toLowerCase()) return true
            if (rowDesc && String(productName(p) || '').toLowerCase() === rowDesc.toLowerCase()) return true
            return false
          })

          const lineObj = matched
            ? {
                productId: matched.id,
                code: matched.code || `#${matched.id}`,
                barCode: matched.barCode || matched.barcode || '—',
                name: productName(matched),
                imageUrl: (typeof matched.imageUrl === 'string' && !matched.imageUrl.startsWith('blob:')) ? matched.imageUrl : '',
                onHand: Number(matched.onHand) || 0,
                qty: String(rowQty),
                uom: rowUom || matched.uom || 'Kg',
                raw: matched,
              }
            : {
                productId: Date.now() + i,
                code: rowCode || `IMP-${i}`,
                barCode: rowBarcode || '—',
                name: rowDesc || `Imported Item ${i}`,
                imageUrl: '',
                onHand: 0,
                qty: String(rowQty),
                uom: rowUom || 'Kg',
                raw: { onHand: 0 },
              }

          if (!newLines.some((l) => l.code === lineObj.code || (matched && String(l.productId) === String(matched.id)))) {
            newLines.push(lineObj)
            addedCount++
          }
        }

        setLines(newLines)
        if (addedCount === 0) {
          setError(t('No new products added from Excel (items may already exist in list).', 'គ្មានផលិតផលថ្មីត្រូវបានបន្ថែមទេ។'))
        }
      } catch (err) {
        setError(t(`Failed to import Excel file: ${err.message}`, `មិនអាចនាំចូល Excel បានទេ: ${err.message}`))
      } finally {
        if (fileInputRef.current) fileInputRef.current.value = ''
      }
    }
    reader.readAsArrayBuffer(file)
  }

  /* ---------- Save Transfer Products ---------- */
  const save = async () => {
    if (lines.length === 0) {
      setError(t('Please add at least one product.', 'សូមបន្ថែមផលិតផលយ៉ាងតិចមួយ។'))
      return
    }
    if (fromOutlet === toOutlet && fromLocation === toLocation) {
      setError(t('Source and Destination Outlet/Location must be different.', 'ទីតាំងចេញ និងទីតាំងគោលដៅមិនអាចដូចគ្នាទេ។'))
      return
    }
    const badLine = lines.find((l) => !(Number(l.qty) > 0))
    if (badLine) {
      setError(t(`Valid quantity (> 0) required for ${badLine.name}.`, `ត្រូវការបរិមាណត្រឹមត្រូវសម្រាប់ ${badLine.name}។`))
      return
    }

    setSaving(true)
    setError(null)

    const fromOutletObj = OUTLETS.find((o) => o.key === fromOutlet)
    const fromLocationObj = LOCATIONS_LIST.find((l) => l.key === fromLocation)
    const toOutletObj = OUTLETS.find((o) => o.key === toOutlet)
    const toLocationObj = LOCATIONS_LIST.find((l) => l.key === toLocation)

    const newDoc = {
      code: docCode,
      docType: 'TRANSFER',
      date: transferDate,
      transferDate,
      requestTransferDate,
      templateName,
      transferType,
      requestTransferType: transferType,
      reference: reference.trim() || '—',
      requestOutlet: fromOutletObj?.[lang] || fromOutlet,
      requestLocation: fromLocationObj?.[lang] || fromLocation,
      fromOutlet: fromOutletObj?.[lang] || fromOutlet,
      fromLocation: fromLocationObj?.[lang] || fromLocation,
      toOutlet: toOutletObj?.[lang] || toOutlet,
      toLocation: toLocationObj?.[lang] || toLocation,
      userName: userName.trim() || 'Staff',
      status: 'COMPLETED',
      lines: lines.map((l) => ({
        productId: typeof l.productId === 'number' ? l.productId : null,
        code: l.code,
        barCode: l.barCode,
        name: l.name,
        imageUrl: l.imageUrl,
        onHand: Number(l.onHand) || 0,
        qty: Number(l.qty),
        uom: l.uom,
      })),
    }

    try {
      const res = await adminTransferAPI.create(newDoc)
      const created = res?.data || newDoc
      setSaving(false)
      onCreated(created)
      if (typeof onClose === 'function') {
        onClose()
      } else {
        setPostedDoc(created)
      }
    } catch (err) {
      console.warn('Backend direct transfer create error, fallback to local', err)
      setSaving(false)
      onCreated(newDoc)
      if (typeof onClose === 'function') {
        onClose()
      } else {
        setPostedDoc(newDoc)
      }
    }
  }

  return (
    <div className="space-y-6">

      {/* ---------- Top Actions Bar ---------- */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-700/60 pb-4">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onClose}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-800/80 px-3.5 py-2 text-xs font-bold text-slate-200 transition hover:bg-slate-700 hover:text-white"
          >
            ← {t('Back to List', 'ត្រឡប់ទៅបញ្ជី')}
          </button>
          <div>
            <h2 className="text-xl font-extrabold text-white">
              {t('Create Transfer Products', 'បង្កើតការផ្ទេរទំនិញ')}
            </h2>
            <p className="text-xs text-slate-400">
              {t('Execute stock transfer between outlets and warehouse locations.', 'អនុវត្តការផ្ទេរស្តុករវាងសាខាហាង និងទីតាំងឃ្លាំង។')}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <GhostButton onClick={onClose}>
            {t('Cancel', 'បោះបង់')}
          </GhostButton>
          <PrimaryButton onClick={save} disabled={saving}>
            {saving ? t('Saving...', 'កំពុងរក្សាទុក...') : `✓ ${t('Save Transfer Products', 'រក្សាទុកការផ្ទេរ')}`}
          </PrimaryButton>
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm font-semibold text-red-300">
          ⚠️ {error}
        </div>
      )}

      {/* ---------- General Information Card ---------- */}
      <section className="rounded-2xl border border-slate-700/60 bg-slate-900/80 shadow-xl shadow-black/20">
        <div className="flex items-center justify-between border-b border-slate-700/60 px-6 py-4">
          <h3 className="text-sm font-extrabold uppercase tracking-wide text-white">
            {t('General Information', 'ព័ត៌មានទូទៅ')}
          </h3>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-400">{t('Auto Code:', 'កូដស្វ័យប្រវត្តិ:')}</span>
            <span className="font-mono text-xs font-black text-green-300">{docCode}</span>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-5 p-6 sm:grid-cols-2 lg:grid-cols-3">

          {/* Document Code - Auto Generated Code */}
          <Field label={t('Document Code', 'កូដឯកសារ')} required>
            <div className="flex items-center gap-2">
              <TextInput value={docCode} readOnly className="cursor-not-allowed opacity-75 font-mono font-bold text-green-300" />
              <Pill tone="green">AUTO</Pill>
            </div>
          </Field>

          {/* transfer Date - DropDown date */}
          <Field label={t('Transfer Date', 'កាលបរិច្ឆេទផ្ទេរ')} required>
            <TextInput
              type="date"
              value={transferDate}
              onChange={(e) => setTransferDate(e.target.value)}
            />
          </Field>

          {/* template Name - DropDown Name */}
          <Field label={t('Template Name', 'ឈ្មោះគំរូ')}>
            <SelectInput value={templateName} onChange={(e) => setTemplateName(e.target.value)}>
              {TEMPLATES.map((tp) => (
                <option key={tp.value} value={tp.value}>{tp[lang]}</option>
              ))}
            </SelectInput>
          </Field>

          {/* Request Transfer Date - Dropdown Date */}
          <Field label={t('Request Transfer Date', 'កាលបរិច្ឆេទស្នើសុំផ្ទេរ')} required>
            <TextInput
              type="date"
              value={requestTransferDate}
              onChange={(e) => setRequestTransferDate(e.target.value)}
            />
          </Field>

          {/* Transfer type - DropDown - Search texbox */}
          <Field label={t('Transfer Type', 'ប្រភេទផ្ទេរ')} required>
            <SelectInput value={transferType} onChange={(e) => setTransferType(e.target.value)}>
              {TRANSFER_TYPES.map((type) => (
                <option key={type} value={type}>{type}</option>
              ))}
            </SelectInput>
          </Field>

          {/* Reference - Textbox */}
          <Field label={t('Reference', 'យោង')}>
            <TextInput
              type="text"
              placeholder={t('e.g. REF-TF-2026-001', 'ឧ. REF-TF-2026-001')}
              value={reference}
              onChange={(e) => setReference(e.target.value)}
            />
          </Field>

          {/* From Outlet - Dropdown */}
          <Field label={t('From Outlet', 'ពីសាខា')} required>
            <SelectInput value={fromOutlet} onChange={(e) => setFromOutlet(e.target.value)}>
              {OUTLETS.map((o) => (
                <option key={o.key} value={o.key}>{o[lang]}</option>
              ))}
            </SelectInput>
          </Field>

          {/* To Outlet - Dropdown */}
          <Field label={t('To Outlet', 'ទៅសាខា')} required>
            <SelectInput value={toOutlet} onChange={(e) => setToOutlet(e.target.value)}>
              {OUTLETS.map((o) => (
                <option key={o.key} value={o.key}>{o[lang]}</option>
              ))}
            </SelectInput>
          </Field>

          {/* To Location - Dropdown */}
          <Field label={t('To Location', 'ទៅទីតាំង')} required>
            <SelectInput value={toLocation} onChange={(e) => setToLocation(e.target.value)}>
              {LOCATIONS_LIST.map((l) => (
                <option key={l.key} value={l.key}>{l[lang]}</option>
              ))}
            </SelectInput>
          </Field>

          {/* From Location - Dropdown */}
          <Field label={t('From Location', 'ពីទីតាំង')} required>
            <SelectInput value={fromLocation} onChange={(e) => setFromLocation(e.target.value)}>
              {LOCATIONS_LIST.map((l) => (
                <option key={l.key} value={l.key}>{l[lang]}</option>
              ))}
            </SelectInput>
          </Field>

          {/* User Name - Textbox */}
          <Field label={t('User Name', 'ឈ្មោះអ្នកផ្ទេរ')}>
            <TextInput
              type="text"
              value={userName}
              onChange={(e) => setUserName(e.target.value)}
              placeholder={t('Enter user name...', 'បញ្ចូលឈ្មោះអ្នកផ្ទេរ...')}
            />
          </Field>

        </div>
      </section>

      {/* ---------- Product Section ---------- */}
      <section className="overflow-hidden rounded-2xl border border-slate-700/60 bg-slate-900/80 shadow-xl shadow-black/20">
        
        {/* Product Section Header & Excel Action Buttons */}
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-700/60 px-6 py-4">
          <div className="flex items-center gap-3">
            <h3 className="text-sm font-extrabold uppercase tracking-wide text-white">
              {t('Product List', 'បញ្ជីផលិតផល')} ({lines.length})
            </h3>
            {allProductsList.length > 0 && (
              <span className="rounded-full bg-teal-500/10 px-2.5 py-0.5 text-[11px] font-semibold text-teal-300 ring-1 ring-teal-500/20">
                {t(`Store Catalog: ${allProductsList.length} products available`, `កាតាឡុកហាង: ${allProductsList.length} មុខទំនិញ`)}
              </span>
            )}
          </div>

          <div className="flex items-center gap-3">
            <input
              type="file"
              ref={fileInputRef}
              accept=".xlsx, .xls, .csv"
              className="hidden"
              onChange={handleExcelImport}
            />

            {/* Import Excel Button */}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="inline-flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-800/90 px-3.5 py-2 text-xs font-bold text-slate-200 transition hover:border-slate-600 hover:bg-slate-700 hover:text-white"
            >
              📥 {t('Import File Excel', 'នាំចូល Excel')}
            </button>

            {/* Export Excel Button */}
            <button
              type="button"
              onClick={exportProductLines}
              className="inline-flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-800/90 px-3.5 py-2 text-xs font-bold text-slate-200 transition hover:border-slate-600 hover:bg-slate-700 hover:text-white"
            >
              📤 {t('Export File Excel', 'នាំចេញ Excel')}
            </button>
          </div>
        </div>

        {/* Product Search Textbox (Code | Barcode | Description) */}
        <div ref={searchBoxRef} className="relative border-b border-slate-700/60 bg-slate-950/40 p-4">
          <div className="relative">
            <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500">
              🔍
            </span>
            <input
              type="text"
              value={productQuery}
              onFocus={() => setSearchFocused(true)}
              onChange={(e) => {
                setProductQuery(e.target.value)
                setSearchFocused(true)
              }}
              placeholder={t('Search Product by Code, Barcode, or Description...', 'ស្វែងរកផលិតផលតាមកូដ បារកូដ ឬការពិពណ៌នា...')}
              className="w-full rounded-xl border border-slate-700/70 bg-slate-900/90 py-2.5 pl-10 pr-4 text-sm text-white placeholder-slate-500 outline-none transition focus:border-teal-400 focus:ring-4 focus:ring-teal-500/10"
            />
            {productQuery && (
              <button
                type="button"
                onClick={() => setProductQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-500 hover:text-white"
              >
                ✕
              </button>
            )}
          </div>

          {/* Autocomplete Dropdown List */}
          {(searchFocused || productQuery.trim()) && matches.length > 0 && (
            <div className="absolute left-4 right-4 top-full z-30 mt-1 max-h-72 overflow-y-auto rounded-xl border border-slate-700 bg-slate-900 shadow-2xl shadow-black/80">
              <div className="flex items-center justify-between border-b border-slate-800 bg-slate-950/80 px-4 py-2 text-[11px] font-bold text-slate-400">
                <span>{productQuery.trim() ? t(`Search Results (${matches.length})`, `លទ្ធផលស្វែងរក (${matches.length})`) : t(`All Catalog Products (${matches.length})`, `ផលិតផលទាំងអស់ក្នុងស្តុក (${matches.length})`)}</span>
                <span className="text-[10px] text-teal-400">{t('Click to add to transfer', 'ចុចដើម្បីបន្ថែម')}</span>
              </div>
              <ul>
              {matches.map((p) => {
                const desc = productName(p)
                const isAdded = lines.some((l) => String(l.productId) === String(p.id))
                return (
                  <li key={p.id}>
                    <button
                      type="button"
                      disabled={isAdded}
                      onClick={() => addProduct(p)}
                      className="flex w-full items-center justify-between gap-3 border-b border-slate-800/80 px-4 py-3 text-left transition hover:bg-slate-800 disabled:opacity-40"
                    >
                      <div className="flex items-center gap-3">
                        {p.imageUrl && !p.imageUrl.startsWith('blob:') ? (
                          <img src={p.imageUrl} alt="" className="h-9 w-9 rounded-lg object-cover ring-1 ring-slate-700" onError={(e) => { e.currentTarget.style.display = 'none' }} />
                        ) : (
                          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-800 text-sm">🥫</span>
                        )}
                        <div>
                          <p className="text-sm font-bold text-white">{desc}</p>
                          <p className="font-mono text-xs text-slate-400">
                            Code: <span className="text-teal-300">{p.code || `#${p.id}`}</span> · Barcode: <span className="text-slate-300">{p.barCode || p.barcode || '—'}</span>
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="font-mono text-xs font-semibold text-slate-300">
                          {t('Onhand:', 'ក្នុងស្តុក:')} <span className="text-white">{Number(p.onHand || 0).toFixed(2)}</span>
                        </span>
                        {isAdded ? (
                          <span className="ml-2 text-xs font-bold text-slate-500">{t('(Added)', '(បានបន្ថែម)')}</span>
                        ) : (
                          <span className="ml-2 rounded bg-teal-500/20 px-2 py-0.5 text-xs font-bold text-teal-300">+ {t('Add', 'បន្ថែម')}</span>
                        )}
                      </div>
                    </button>
                  </li>
                )
              })}
              </ul>
            </div>
          )}
        </div>

        {/* Product Table: Code | Barcode | Description | Onhand | Request Qty | UOM | Action */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-700/60 bg-slate-800/40 text-xs font-bold uppercase tracking-wide text-slate-400">
                <th className="px-4 py-3">{t('Item', 'ទំនិញ')}</th>
                <th className="px-4 py-3">{t('Code', 'កូដ')}</th>
                <th className="px-4 py-3">{t('Barcode', 'បារកូដ')}</th>
                <th className="px-4 py-3">{t('Description', 'ការពិពណ៌នា')}</th>
                <th className="px-4 py-3 text-right">{t('Onhand', 'ក្នុងស្តុក')}</th>
                <th className="px-4 py-3 text-center w-32">{t('Request Qty', 'ចំនួនផ្ទេរ')}</th>
                <th className="px-4 py-3 w-36">{t('UOM', 'ខ្នាត')}</th>
                <th className="px-4 py-3 text-center">{t('Action', 'សកម្មភាព')}</th>
              </tr>
            </thead>
            <tbody>
              {lines.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-12 text-center text-slate-400">
                    <span className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-slate-800 text-2xl">📦</span>
                    <p className="text-sm font-semibold">{t('No products added yet.', 'មិនទាន់មានផលិតផលត្រូវបានបន្ថែមទេ។')}</p>
                    <p className="text-xs text-slate-500 mt-1">{t('Search by Code, Barcode, or Description above or import from Excel.', 'ស្វែងរកតាមកូដ បារកូដ ឬការពិពណ៌នាខាងលើ ឬនាំចូលពី Excel។')}</p>
                  </td>
                </tr>
              ) : (
                lines.map((line, idx) => (
                  <tr key={line.productId || idx} className="border-b border-slate-800/60 transition hover:bg-slate-800/30">
                    
                    {/* Thumbnail */}
                    <td className="px-4 py-3">
                      {line.imageUrl ? (
                        <img src={line.imageUrl} alt="" className="h-10 w-10 rounded-lg object-cover ring-1 ring-slate-700" onError={(e) => { e.currentTarget.style.display = 'none' }} />
                      ) : (
                        <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-800 text-base">🥫</span>
                      )}
                    </td>

                    {/* Code */}
                    <td className="px-4 py-3 font-mono text-xs font-bold text-teal-300">
                      {line.code}
                    </td>

                    {/* Barcode */}
                    <td className="px-4 py-3 font-mono text-xs text-slate-300">
                      {line.barCode}
                    </td>

                    {/* Description */}
                    <td className="px-4 py-3 font-semibold text-white">
                      {line.name}
                    </td>

                    {/* Onhand - 0.00 */}
                    <td className="px-4 py-3 text-right font-mono font-bold text-slate-300">
                      {Number(line.onHand || 0).toFixed(2)}
                    </td>

                    {/* Request Qty - Textbox - 0 */}
                    <td className="px-4 py-3">
                      <input
                        type="number"
                        min="1"
                        step="1"
                        value={line.qty}
                        onChange={(e) => patchLine(idx, { qty: e.target.value })}
                        className="w-24 rounded-lg border border-slate-700/80 bg-slate-950 px-3 py-1.5 text-center font-mono text-sm font-black text-white outline-none focus:border-teal-400 focus:ring-2 focus:ring-teal-500/20"
                      />
                    </td>

                    {/* UOM - Dropdown live data */}
                    <td className="px-4 py-3">
                      <select
                        value={line.uom}
                        onChange={(e) => patchLine(idx, { uom: e.target.value })}
                        className="w-full rounded-lg border border-slate-700/80 bg-slate-950 px-2.5 py-1.5 text-xs font-bold text-slate-200 outline-none focus:border-teal-400"
                      >
                        {units.length > 0 ? (
                          units.map((u) => (
                            <option key={u.id || u.code} value={u.code || u.description}>
                              {u.description ? `${u.description} (${u.code || ''})` : u.code}
                            </option>
                          ))
                        ) : (
                          <>
                            <option value="Kg">Kilogram (Kg)</option>
                            <option value="Pcs">Pieces (Pcs)</option>
                            <option value="Pack">Pack</option>
                            <option value="Box">Box</option>
                            <option value="Bottle">Bottle</option>
                            <option value="Bag">Bag</option>
                            <option value="Carton">Carton</option>
                          </>
                        )}
                      </select>
                    </td>

                    {/* Action */}
                    <td className="px-4 py-3 text-center">
                      <button
                        type="button"
                        onClick={() => removeLine(idx)}
                        className="rounded-lg p-1.5 text-slate-400 transition hover:bg-red-500/20 hover:text-red-300"
                        title={t('Remove line', 'លុបជួរ')}
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

        {/* Footer Summary */}
        <div className="flex flex-wrap items-center justify-between gap-4 border-t border-slate-700/60 bg-slate-950/60 px-6 py-4">
          <div className="flex items-center gap-6 text-sm">
            <span className="text-slate-400">
              {t('Total in Store:', 'ផលិតផលក្នុងហាង:')} <strong className="text-white font-mono">{allProductsList.length}</strong>
            </span>
            <span className="text-slate-400">
              {t('Total Items Added:', 'មុខទំនិញបានបន្ថែម:')} <strong className="text-teal-300 font-mono">{lines.length}</strong>
            </span>
            <span className="text-slate-400">
              {t('Total Transfer Qty:', 'បរិមាណផ្ទេរសរុប:')} <strong className="text-teal-300 font-mono">{totalQty}</strong>
            </span>
          </div>

          <div className="flex items-center gap-3">
            <GhostButton onClick={onClose}>
              {t('Cancel', 'បោះបង់')}
            </GhostButton>
            <PrimaryButton onClick={save} disabled={saving}>
              {saving ? t('Saving...', 'កំពុងរក្សាទុក...') : `✓ ${t('Save Transfer Products', 'រក្សាទុកការផ្ទេរ')}`}
            </PrimaryButton>
          </div>
        </div>

      </section>

      {/* Confirmation Success Modal */}
      {postedDoc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-teal-500/40 bg-slate-900 p-6 shadow-2xl">
            <div className="mb-4 flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-500/20 text-xl text-teal-400">✓</span>
              <div>
                <h4 className="text-base font-extrabold text-white">{t('Transfer Products Created!', 'បានបង្កើតការផ្ទេរទំនិញជោគជ័យ!')}</h4>
                <p className="font-mono text-xs text-teal-300">{postedDoc.code}</p>
              </div>
            </div>
            <p className="text-sm text-slate-300">
              {t(
                `Transfer document with ${postedDoc.lines?.length || 0} product(s) has been transferred to ${postedDoc.toOutlet}.`,
                `ឯកសារផ្ទេរទំនិញចំនួន ${postedDoc.lines?.length || 0} មុខ ត្រូវបានផ្ទេរទៅកាន់ ${postedDoc.toOutlet}។`
              )}
            </p>
            <div className="mt-6 flex justify-end">
              <PrimaryButton onClick={onClose}>
                {t('OK & Return to List', 'យល់ព្រម និងត្រឡប់ទៅបញ្ជី')}
              </PrimaryButton>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}

export default TransferProductsCreate
