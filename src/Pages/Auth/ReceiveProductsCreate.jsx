import { useEffect, useRef, useState } from 'react'
import { useLanguage } from '../../context/LanguageContext'
import { adminProductAPI, adminSupplierAPI, adminUnitAPI, adminReceiveDocAPI } from '../../api/api'
import { nextAverageCost, LOCATIONS } from './stockStore'
import { Field, TextInput, SelectInput, PrimaryButton, GhostButton, Pill } from './stockUI'
import './ReceiveProductsCreate.css'

// Full-page Stock Receive form (opened by "Create" on the Receive Products
// list). Layout follows the Suppliers Group dark theme: General Information
// card on the left, Product card below/right, serial-number popup per line,
// and a save confirmation styled like a print preview.

const ORANGE = '#FF9900'

const RECEIVE_TYPES = ['Purchase Order', 'Return', 'Donation', 'Transfer In', 'Other']
const NOTE_OPTIONS = [
  { value: '', en: '—', kh: '—' },
  { value: 'receive-transfer', en: 'Receive transfer from other outlet', kh: 'ទទួលផ្ទេរពីហាងផ្សេងទៀត' },
  { value: 'goods-receipt', en: 'Goods receipt from supplier', kh: 'ទទួលទំនិញពីអ្នកផ្គត់ផ្គង់' },
  { value: 'customer-return', en: 'Customer return', kh: 'អតិថិជនត្រឡប់មកវិញ' },
]
const TEMPLATES = [
  { value: 'default', en: 'Default Template', kh: 'គំរូលំនាំដើម' },
  { value: 'blank', en: 'Blank', kh: 'ទំព័រទំនេរ' },
]

export const ReceiveProductsCreate = ({ products, onPosted, onClose }) => {
  const { lang } = useLanguage()
  const t = (en, kh) => (lang === 'en' ? en : kh)

  /* ---------- general information ---------- */
  const [liveProducts, setLiveProducts] = useState(Array.isArray(products) ? products : [])
  const [suppliers, setSuppliers] = useState([])
  const [units, setUnits] = useState([])
  const [code] = useState(() => `GRN-${String(Date.now()).slice(-6)}`)
  const [supplier, setSupplier] = useState('')
  const [outlet, setOutlet] = useState('main')
  const [location, setLocation] = useState('main')
  const [receiveType, setReceiveType] = useState('Purchase Order')
  const [receiveDate, setReceiveDate] = useState(new Date().toISOString().slice(0, 10))
  const [template, setTemplate] = useState('default')
  const [noteType, setNoteType] = useState('')
  const [noteText, setNoteText] = useState('')

  /* ---------- product lines ---------- */
  const [lines, setLines] = useState([])
  const [productQuery, setProductQuery] = useState('')
  const [searchFocused, setSearchFocused] = useState(false)
  const searchBoxRef = useRef(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)
  const [postedDoc, setPostedDoc] = useState(null) // set after save → print-preview message
  // index of the line whose serial popup is open (-1 = closed)
  const [serialIdx, setSerialIdx] = useState(-1)

  useEffect(() => {
    adminSupplierAPI.getAll().then((res) => setSuppliers(Array.isArray(res?.data) ? res.data : [])).catch(() => {})
    adminUnitAPI.getAll().then((res) => setUnits(Array.isArray(res?.data) ? res.data : [])).catch(() => {})
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
  // show the unit the way it was created — description first (e.g. "Kilogram (kg)")
  const uomLabel = (u) => u?.description || u?.code || ''
  const uomValue = (u) => u?.code || u?.description || String(u?.id ?? '')

  /* ---------- product search & add ---------- */
  const allProductsList = liveProducts.length > 0 ? liveProducts : (Array.isArray(products) ? products : [])
  const matches = (() => {
    const q = productQuery.trim().toLowerCase()
    if (!q) {
      return allProductsList.slice(0, 40)
    }
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
      setError(t('Product is already added.', 'ផលិតផលបានបន្ថែមរួចហើយ។'))
      return
    }
    setError(null)
    setLines([...lines, {
      productId: p.id,
      code: p.code || '',
      barCode: p.barCode || p.barcode || '',
      name: productName(p),
      imageUrl: p.imageUrl || '',
      onHand: Number(p.onHand) || 0,
      qty: '',
      cost: String(p.standardCost != null ? p.standardCost : (p.averageCost != null ? p.averageCost : '0.00')),
      uom: p.uom || '',
      averageCost: p.averageCost,
      availableStock: p.availableStock,
      raw: p,
      serials: [],
    }])
    setProductQuery('')
    setSearchFocused(false)
  }

  const patchLine = (i, patch) =>
    setLines(lines.map((l, j) => (j === i ? { ...l, ...patch } : l)))

  const removeLine = (i) => setLines(lines.filter((_, j) => j !== i))

  const lineTotal = (l) => (Number(l.qty) || 0) * (Number(l.cost) || 0)
  const grandTotal = lines.reduce((s, l) => s + lineTotal(l), 0)

  /* ---------- save (post to backend, then confirm) ---------- */
  const save = async () => {
    if (!lines.length) {
      setError(t('Add at least one product.', 'សូមបន្ថែមផលិតផលយ៉ាងតិចមួយ។'))
      return
    }
    const badQty = lines.find((l) => !(Number(l.qty) > 0))
    if (badQty) {
      setError(t(`Quantity required for ${badQty.name}.`, `ត្រូវការបរិមាណសម្រាប់ ${badQty.name}។`))
      return
    }
    setSaving(true)
    setError(null)

    const posted = []
    const fails = []
    
    const supplierName = suppliers.find((s) => String(s.id) === String(supplier))?.name || supplier || ''
    const totalCost = Math.round(lines.reduce((s, l) => s + (Number(l.qty) || 0) * (Number(l.cost) || 0), 0) * 100) / 100

    try {
      const docPayload = {
        docType: 'RECEIVE',
        code,
        date: receiveDate,
        supplier: supplierName,
        receiveType,
        reference: '',
        receivedBy: outlet,
        locationKey: location,
        note: noteText,
        totalCost,
        lines: lines.map((l) => ({
          productId: l.productId,
          nameSnapshot: l.name,
          qty: Number(l.qty),
          unitCost: Number(l.cost) || 0,
          serials: (l.serials || []).join(', '),
        })),
      }
      await adminReceiveDocAPI.create(docPayload)
    } catch (err) {
      console.warn('Backend stock document create failed, fallback to direct product update', err)
      for (const l of lines) {
        try {
          const p = l.raw
          const onHand = Number(p.onHand) || 0
          const qty = Number(l.qty)
          const newAvg = nextAverageCost(onHand, p.averageCost, qty, Number(l.cost) || 0)
          await adminProductAPI.update(p.id, {
            ...p,
            onHand: onHand + qty,
            averageCost: newAvg,
            availableStock: Number(p.availableStock) ? Number(p.availableStock) + qty : null,
          })
        } catch (subErr) {
          fails.push(`${l.name}: ${subErr.message}`)
        }
      }
    }

    for (const l of lines) {
      posted.push({ ...l, qty: Number(l.qty), cost: Number(l.cost) || 0 })
    }

    setSaving(false)
    if (!posted.length && fails.length) {
      setError(t('Nothing was saved.', 'មិនមានអ្វីបានរក្សាទុកទេ។'))
      return
    }

    onPosted({
      code,
      date: receiveDate,
      supplier: supplierName,
      totalCost,
      receiveType,
      reference: '',
      receivedBy: outlet,
      status: 'Received',
      outlet,
      location,
      template,
      noteType: NOTE_OPTIONS.find((n) => n.value === noteType)?.[lang] || '',
      note: noteText,
      lines: posted.map((l) => ({
        productId: l.productId, name: l.name, qty: l.qty, unitCost: l.cost,
        serials: l.serials, before: Number(l.raw.onHand) || 0, after: (Number(l.raw.onHand) || 0) + l.qty,
      })),
    })
    setPostedDoc({ fails, totalCost })
  }

  return (
    <div className="space-y-5">
      {/* ---------- general information ---------- */}
      <section className="rounded-2xl border border-slate-700/60 bg-slate-900/80 shadow-xl shadow-black/20">
        <h2 className="border-b border-slate-700/60 px-5 py-4 text-sm font-extrabold uppercase tracking-wide text-white">
          {t('General Information', 'ព័ត៌មានទូទៅ')}
        </h2>
        <div className="grid grid-cols-1 gap-4 p-5 sm:grid-cols-2 lg:grid-cols-3">
          {/* Supplier — live data */}
          <Field label={t('Supplier', 'អ្នកផ្គត់ផ្គង់')}>
            <SelectInput value={supplier} onChange={(e) => setSupplier(e.target.value)}>
              <option value="">{t('Select supplier…', 'ជ្រើសរើសអ្នកផ្គត់ផ្គង់…')}</option>
              {suppliers.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </SelectInput>
          </Field>

          {/* Outlet — searchable dropdown */}
          <Field label={t('Outlet', 'ហាង')}>
            <SearchSelect
              value={outlet}
              onChange={setOutlet}
              placeholder={t('Search outlet…', 'ស្វែងរកហាង…')}
              options={LOCATIONS.map((l) => ({ value: l.key, label: l[lang] }))}
            />
          </Field>

          <Field label={t('Receive Type', 'ប្រភេទនៃការទទួល')}>
            <SelectInput value={receiveType} onChange={(e) => setReceiveType(e.target.value)}>
              {RECEIVE_TYPES.map((rt) => <option key={rt} value={rt}>{rt}</option>)}
            </SelectInput>
          </Field>

          <Field label={t('Receive Date', 'កាលបរិច្ឆេទទទួល')} required>
            <TextInput type="date" value={receiveDate} onChange={(e) => setReceiveDate(e.target.value)} />
          </Field>

          <Field label={t('Location', 'ទីតាំង')}>
            <SelectInput value={location} onChange={(e) => setLocation(e.target.value)}>
              {LOCATIONS.map((l) => <option key={l.key} value={l.key}>{l[lang]}</option>)}
            </SelectInput>
          </Field>

          <Field label={t('Template Name', 'ឈ្មោះគំរូ')}>
            <SelectInput value={template} onChange={(e) => setTemplate(e.target.value)}>
              {TEMPLATES.map((tp) => <option key={tp.value} value={tp.value}>{tp[lang]}</option>)}
            </SelectInput>
          </Field>

          {/* Code — auto generated */}
          <Field label={t('Code', 'កូដ')}>
            <div className="flex items-center gap-2">
              <TextInput value={code} readOnly className="cursor-not-allowed opacity-70" />
              <Pill tone="green">AUTO</Pill>
            </div>
          </Field>

          <Field label={t('Stock Receive Note', 'ចំណាំការទទួលស្តុក')}>
            <SelectInput value={noteType} onChange={(e) => setNoteType(e.target.value)}>
              {NOTE_OPTIONS.map((n) => <option key={n.value} value={n.value}>{n[lang]}</option>)}
            </SelectInput>
          </Field>

          {noteType && (
            <Field label={t('Note Detail', 'ពណ៌នាចំណាំ')}>
              <TextInput value={noteText} onChange={(e) => setNoteText(e.target.value)} placeholder={t('Details…', 'លម្អិត…')} />
            </Field>
          )}
        </div>
      </section>

      {/* ---------- product side ---------- */}
      <section className="overflow-hidden rounded-2xl border border-slate-700/60 bg-slate-900/80 shadow-xl shadow-black/20">
        <div className="flex items-center justify-between border-b border-slate-700/60 px-5 py-4">
          <h2 className="text-sm font-extrabold uppercase tracking-wide text-white">
            {t('Product', 'ផលិតផល')}
          </h2>
          <span className="rounded-full bg-slate-800 px-3 py-1 text-xs font-semibold text-slate-300 border border-slate-700/60">
            {t('Store Catalog', 'កាតាឡុក')}: <span className="text-green-300 font-mono font-bold">{allProductsList.length}</span> {t('products available', 'ផលិតផល')}
          </span>
        </div>

        {/* product search — only products not yet added appear */}
        <div ref={searchBoxRef} className="relative border-b border-slate-700/60 p-4">
          <div className="relative">
            <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500"><SearchIcon /></span>
            <input
              type="text"
              value={productQuery}
              onFocus={() => setSearchFocused(true)}
              onChange={(e) => {
                setProductQuery(e.target.value)
                setSearchFocused(true)
              }}
              onKeyDown={(e) => { if (e.key === 'Enter' && matches.length) addProduct(matches[0]) }}
              placeholder={t('Search product by code / barcode / description…', 'ស្វែងរកផលិតផលតាមកូដ / បាកូដ / ពណ៌នា…')}
              className="w-full rounded-lg border border-slate-700/70 bg-slate-950/60 py-2.5 pl-10 pr-4 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-green-400 focus:bg-slate-950 focus:ring-4 focus:ring-green-500/10"
            />
          </div>
          {(searchFocused || productQuery.trim()) && matches.length > 0 && (
            <div className="absolute left-4 right-4 z-30 mt-1 max-h-72 overflow-hidden rounded-xl border border-slate-700 bg-slate-900 shadow-2xl shadow-black/80 flex flex-col">
              <div className="flex items-center justify-between px-4 py-2 text-[11px] font-semibold text-slate-400 bg-slate-950 border-b border-slate-800">
                <span>{productQuery.trim() ? t(`Search Results (${matches.length})`, `លទ្ធផលស្វែងរក (${matches.length})`) : t(`All Catalog Products (${allProductsList.length})`, `ផលិតផលទាំងអស់ក្នុងប្រព័ន្ធ (${allProductsList.length})`)}</span>
                <span className="text-slate-500">{t('Click item to add', 'ចុចដើម្បីបន្ថែម')}</span>
              </div>
              <ul className="overflow-y-auto divide-y divide-slate-800/60 max-h-60">
                {matches.map((p) => (
                  <li key={p.id}>
                    <button
                      type="button"
                      onClick={() => addProduct(p)}
                      className="flex w-full items-center justify-between gap-3 px-4 py-2.5 text-left text-sm text-slate-200 transition hover:bg-slate-800"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        {p.imageUrl && !p.imageUrl.startsWith('blob:') && (
                          <img src={p.imageUrl} alt="" className="h-7 w-7 rounded object-cover border border-slate-700/60 shrink-0" />
                        )}
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-white truncate">{productName(p)}</span>
                            {p.nameKh && typeof p.name !== 'object' && lang !== 'kh' && (
                              <span className="text-xs text-slate-400 truncate">({p.nameKh})</span>
                            )}
                          </div>
                          <div className="flex items-center gap-2 text-[11px] font-mono text-slate-400 mt-0.5">
                            {p.code && <span className="bg-slate-800 px-1.5 py-0.2 rounded text-slate-300">Code: {p.code}</span>}
                            {(p.barCode || p.barcode) && <span className="bg-slate-800 px-1.5 py-0.2 rounded text-slate-300">Barcode: {p.barCode || p.barcode}</span>}
                            {p.uom && <span className="text-slate-500">· {p.uom}</span>}
                          </div>
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <span className="text-xs font-semibold text-emerald-400 block">{t('on hand', 'ស្តុក')}: {Number(p.onHand) || 0}</span>
                        {p.basePrice != null && <span className="text-[11px] text-slate-400 font-mono">${Number(p.basePrice).toFixed(2)}</span>}
                      </div>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}
          {error && (
            <p className="mt-2 rounded-lg border border-red-500/40 bg-red-500/10 px-3 py-2 text-xs font-semibold text-red-300">{error}</p>
          )}
        </div>

        {/* added-product table */}
        <div className="overflow-x-auto">
          <table className="w-full min-w-[860px] text-left text-sm">
            <thead>
              <tr className="border-b border-slate-700/60 bg-slate-800/40 text-xs font-bold uppercase tracking-wide text-slate-500">
                <th className="whitespace-nowrap px-4 py-3">{t('Image', 'រូបភាព')}</th>
                <th className="whitespace-nowrap px-4 py-3">{t('Code / Barcode', 'កូដ / បាកូដ')}</th>
                <th className="whitespace-nowrap px-4 py-3">{t('Description', 'ពណ៌នា')}</th>
                <th className="whitespace-nowrap px-4 py-3 text-right">{t('On Hand', 'មានក្នុងស្តុក')}</th>
                <th className="whitespace-nowrap px-4 py-3">{t('QTY', 'បរិមាណ')}</th>
                <th className="whitespace-nowrap px-4 py-3">{t('Cost', 'ចំណាយ')}</th>
                <th className="whitespace-nowrap px-4 py-3">{t('Serials', 'ស៊ីរីល')}</th>
                <th className="whitespace-nowrap px-4 py-3">{t('UOM', 'ឯកតា')}</th>
                <th className="whitespace-nowrap px-4 py-3 text-right">{t('Total Cost', 'ចំណាយសរុប')}</th>
                <th className="w-16 px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {lines.length === 0 ? (
                <tr>
                  <td colSpan={10} className="px-4 py-14 text-center">
                    <span className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-slate-800"><SearchIcon /></span>
                    <p className="text-sm font-semibold text-slate-300">{t('No products added yet — search above to add.', 'មិនទាន់បានបន្ថែមផលិតផល — ស្វែងរកខាងលើដើម្បីបន្ថែម។')}</p>
                    <p className="mt-1 text-xs text-slate-500">{t(`You have ${allProductsList.length} product(s) available in your store catalog.`, `អ្នកមាន ${allProductsList.length} ផលិតផលនៅក្នុងកាតាឡុកហាងរបស់អ្នក។`)}</p>
                  </td>
                </tr>
              ) : (
                lines.map((l, i) => (
                  <tr key={l.productId} className="border-b border-slate-800/60 transition last:border-0 hover:bg-slate-800/40">
                    <td className="px-4 py-3">
                      {l.imageUrl
                        ? <img src={l.imageUrl} alt="" className="h-10 w-10 rounded-lg object-cover" onError={(e) => { e.currentTarget.style.display = 'none' }} />
                        : <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-800 text-slate-600">📦</span>}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3">
                      <p className="font-mono text-xs font-semibold text-green-300">{l.code || `#${l.productId}`}</p>
                      <p className="font-mono text-[11px] text-slate-500">{l.barCode || '—'}</p>
                    </td>
                    <td className="px-4 py-3"><span className="text-slate-200">{l.name}</span></td>
                    <td className="px-4 py-3 text-right"><span className="text-slate-400">{Number(l.onHand).toFixed(2)}</span></td>
                    <td className="px-4 py-3">
                      <input
                        type="number" min="0"
                        value={l.qty}
                        onChange={(e) => patchLine(i, { qty: e.target.value })}
                        placeholder="0"
                        className="w-20 rounded-lg border border-slate-700/70 bg-slate-950/60 px-2 py-1.5 text-sm text-white outline-none focus:border-green-400 focus:ring-4 focus:ring-green-500/10"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <input
                        type="number" min="0" step="0.01"
                        value={l.cost}
                        onChange={(e) => patchLine(i, { cost: e.target.value })}
                        onKeyDown={(e) => {
                          // Enter after typing a cost opens the serial popup
                          if (e.key === 'Enter' && Number(l.cost) > 0) setSerialIdx(i)
                        }}
                        title={t('Type a cost then press Enter to add serials', 'បញ្ចូលចំណាយរួចចុច Enter ដើម្បីបន្ថែមស៊ីរីល')}
                        className="w-24 rounded-lg border border-slate-700/70 bg-slate-950/60 px-2 py-1.5 text-sm text-white outline-none focus:border-green-400 focus:ring-4 focus:ring-green-500/10"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <button type="button" onClick={() => setSerialIdx(i)} className="inline-flex items-center gap-1.5">
                        <Pill tone={l.serials.length ? 'green' : 'slate'}>
                          {l.serials.length ? `${l.serials.length} ${t('serial(s)', 'ស៊ីរីល')}` : t('Add serials', 'បន្ថែមស៊ីរីល')}
                        </Pill>
                      </button>
                    </td>
                    <td className="px-4 py-3">
                      <select
                        value={l.uom}
                        onChange={(e) => patchLine(i, { uom: e.target.value })}
                        className="rounded-lg border border-slate-700/70 bg-slate-950/60 px-2 py-1.5 text-sm text-white outline-none focus:border-green-400"
                      >
                        <option value="">—</option>
                        {units.map((u) => (
                          <option key={u.id} value={uomValue(u)}>{uomLabel(u)}</option>
                        ))}
                      </select>
                    </td>
                    <td className="px-4 py-3 text-right"><span className="font-semibold text-white">${lineTotal(l).toFixed(2)}</span></td>
                    <td className="px-4 py-3">
                      <button type="button" onClick={() => removeLine(i)} style={{ color: ORANGE }} aria-label={t('Remove', 'ដកចេញ')} title={t('Remove', 'ដកចេញ')}>
                        <TrashIcon />
                      </button>
                    </td>
                  </tr>
                ))
              )}
              {lines.length > 0 && (
                <tr className="bg-slate-800/30">
                  <td colSpan={8} className="px-4 py-3 text-right text-xs font-bold uppercase tracking-wide text-slate-500">
                    {t('Grand Total', 'សរុបរួម')}
                  </td>
                  <td className="px-4 py-3 text-right"><span className="font-black text-green-300">${grandTotal.toFixed(2)}</span></td>
                  <td />
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* footer actions */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-slate-700/60 px-5 py-4 bg-slate-900/60">
          <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-start">
            <GhostButton onClick={onClose}>{t('Cancel', 'បោះបង់')}</GhostButton>
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <span>{t('Total Products:', 'ផលិតផលសរុប:')} <strong className="text-white font-mono">{allProductsList.length}</strong></span>
              <span>•</span>
              <span>{t('Added:', 'បានបន្ថែម:')} <strong className="text-green-300 font-mono">{lines.length}</strong> {t('items', 'មុខទំនិញ')} ({lines.reduce((sum, l) => sum + (Number(l.qty) || 0), 0)} {t('units', 'ចំនួន')})</span>
            </div>
          </div>
          <PrimaryButton onClick={save} disabled={saving || !lines.length}>
            {saving ? t('Saving…', 'កំពុងរក្សាទុក…') : t('Save', 'រក្សាទុក')}
          </PrimaryButton>
        </div>
      </section>

      {/* ---------- serial-number popup ---------- */}
      {serialIdx >= 0 && lines[serialIdx] && (
        <SerialPopup
          line={lines[serialIdx]}
          lang={lang}
          onCancel={() => setSerialIdx(-1)}
          onOk={(serials) => { patchLine(serialIdx, { serials }); setSerialIdx(-1) }}
        />
      )}

      {/* ---------- save confirmation — print-preview style ---------- */}
      {postedDoc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm" onClick={onClose}>
          <div role="dialog" aria-modal="true" className="w-full max-w-md overflow-hidden rounded-2xl border border-slate-700 bg-slate-900 shadow-2xl shadow-black/40" onClick={(e) => e.stopPropagation()}>
            {/* fake print-preview sheet */}
            <div className="mx-auto mt-6 w-[85%] rotate-[-1deg] rounded-lg bg-white p-4 font-mono text-[11px] leading-relaxed text-slate-800 shadow-xl">
              <p className="mb-1 text-center text-xs font-black tracking-widest">B&#39;GROCERIES</p>
              <p className="mb-2 text-center text-[10px] text-slate-500">{t('STOCK RECEIVE NOTE', 'បញ្ជាទទួលស្តុក')}</p>
              <div className="border-y border-dashed border-slate-300 py-1.5">
                <p>{t('Code', 'កូដ')}: {code}</p>
                <p>{t('Date', 'កាលបរិច្ឆេទ')}: {receiveDate}</p>
                {supplierName && <p>{t('Supplier', 'អ្នកផ្គត់ផ្គង់')}: {supplierName}</p>}
                <p>{t('Receive Type', 'ប្រភេទនៃការទទួល')}: {receiveType}</p>
              </div>
              <p className="mt-1.5">{t('Items', 'ទំនិញ')}: {lines.length} · {t('Total', 'សរុប')}: ${postedDoc.totalCost.toFixed(2)}</p>
            </div>
            <div className="p-5 text-center">
              <p className="text-base font-extrabold text-white">✓ {t('Document saved successfully', 'ឯកសារបានរក្សាទុកដោយជោគជ័យ')}</p>
              {postedDoc.fails.length > 0 && (
                <p className="mt-1 text-xs font-semibold" style={{ color: ORANGE }}>
                  {t(`${postedDoc.fails.length} line(s) failed`, `${postedDoc.fails.length} ជួរដេកបរាជ័យ`)}
                </p>
              )}
              <PrimaryButton className="mt-4 w-full justify-center" onClick={onClose}>
                {t('Continue', 'បន្ត')}
              </PrimaryButton>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

/* ---------- searchable dropdown (Outlet) ---------- */
const SearchSelect = ({ value, onChange, options, placeholder }) => {
  const [open, setOpen] = useState(false)
  const [q, setQ] = useState('')
  const selected = options.find((o) => o.value === value)
  const filtered = q ? options.filter((o) => o.label.toLowerCase().includes(q.toLowerCase())) : options

  return (
    <>
      {/* click-away layer sits BELOW the panel (panel z-50 > overlay z-40),
          otherwise the overlay swallows every click and the menu feels dead */}
      {open && <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />}
      <div className="relative">
        <button
          type="button"
          onClick={() => { setOpen(!open); setQ('') }}
          className="flex w-full items-center justify-between rounded-lg border border-slate-700/70 bg-slate-950/60 px-3 py-2.5 text-left text-sm font-medium text-white transition hover:border-slate-600 focus:border-green-400 focus:outline-none focus:ring-4 focus:ring-green-500/10"
        >
          <span>{selected ? selected.label : <span className="text-slate-500">{placeholder}</span>}</span>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className={`text-slate-500 transition ${open ? 'rotate-180' : ''}`}><polyline points="6 9 12 15 18 9" /></svg>
        </button>
        {open && (
          <div className="absolute left-0 right-0 top-full z-50 mt-1 overflow-visible rounded-xl border border-slate-700 bg-slate-900 shadow-2xl shadow-black/50">
            <div className="relative border-b border-slate-700/60 p-2">
              <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-500"><SearchIcon /></span>
              <input
                autoFocus
                type="text"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder={placeholder}
                className="w-full rounded-lg border border-slate-700/70 bg-slate-950/60 py-1.5 pl-9 pr-3 text-sm text-white outline-none placeholder:text-slate-500 focus:border-green-400"
              />
            </div>
            <ul className="max-h-48 overflow-y-auto">
              {(filtered.length ? filtered : options).map((o) => (
                <li key={o.value}>
                  <button
                    type="button"
                    onClick={() => { onChange(o.value); setOpen(false) }}
                    className={`block w-full px-4 py-2 text-left text-sm transition hover:bg-slate-800 ${o.value === value ? 'font-bold text-green-300' : 'text-slate-200'}`}
                  >
                    {o.label}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </>
  )
}

/* ---------- serial-number popup per product line ---------- */
const SerialPopup = ({ line, lang, onCancel, onOk }) => {
  const t = (en, kh) => (lang === 'en' ? en : kh)
  const [temp, setTemp] = useState(line.serials.map((s) => ({ ...s })))
  const [serialText, setSerialText] = useState('')
  const [editing, setEditing] = useState(-1) // index being edited, -1 otherwise
  // serials can never exceed the line's QTY (fixed from the create page)
  const maxSerials = Math.floor(Number(line.qty)) || 0
  const atLimit = temp.length >= maxSerials

  const commitEdit = () => {
    const s = serialText.trim()
    if (!s || atLimit) return
    if (editing >= 0) {
      setTemp(temp.map((it, i) => (i === editing ? { ...it, serial: s } : it)))
      setEditing(-1)
    } else {
      setTemp([{ serial: s, qty: Number(line.qty) || 0 }, ...temp])
    }
    setSerialText('')
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm" onClick={onCancel}>
      <div
        role="dialog"
        aria-modal="true"
        className="max-h-[88vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-slate-700 bg-slate-900 shadow-2xl shadow-black/40"
        onClick={(e) => e.stopPropagation()}
      >
        {/* header — product summary */}
        <div className="flex items-center gap-3 border-b border-slate-700/60 p-5">
          {line.imageUrl
            ? <img src={line.imageUrl} alt="" className="h-12 w-12 rounded-xl object-cover" onError={(e) => { e.currentTarget.style.display = 'none' }} />
            : <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-800">📦</span>}
          <div className="min-w-0">
            <p className="font-mono text-xs text-green-300">{line.code || `#${line.productId}`}{line.barCode ? ` · ${line.barCode}` : ''}</p>
            <p className="truncate text-sm font-bold text-white">{line.name}</p>
          </div>
          <Pill tone="blue">{t('QTY', 'បរិមាណ')}: {Number(line.qty) || 0}</Pill>
        </div>

        <div className="p-5">
          <p className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-500">{t('Product Attribute — Serial Numbers', 'លក្ខណៈផលិតផល — ស៊ីរីល')}</p>

          {/* serial entry — qty locked to the line quantity */}
          <div className="flex gap-2">
            <input
              type="text"
              value={serialText}
              onChange={(e) => setSerialText(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); commitEdit() } }}
              disabled={atLimit && editing < 0}
              placeholder={atLimit ? t('Limit reached — all QTY has serials', 'គ្រប់ចំណុះហើយ — បរិមាណទាំងអស់មានស៊ីរីល') : t('Enter serial number…', 'បញ្ចូលលេខស៊ីរីល…')}
              className="flex-1 rounded-lg border border-slate-700/70 bg-slate-950/60 px-3 py-2.5 text-sm text-white outline-none placeholder:text-slate-500 focus:border-green-400 focus:ring-4 focus:ring-green-500/10 disabled:cursor-not-allowed disabled:opacity-40"
            />
            <PrimaryButton onClick={commitEdit} disabled={atLimit && editing < 0}>
              {editing >= 0 ? t('Update', 'ធ្វើបច្ចុប្បន្នភាព') : t('Add', 'បន្ថែម')}
            </PrimaryButton>
          </div>

          <p className="mt-3 text-xs font-semibold text-slate-400">
            {t('Added', 'បានបន្ថែម')}: <span className="text-green-300">{temp.length}/{maxSerials}</span>
            {atLimit && <span style={{ color: ORANGE }}> · {t(`QTY limit (${maxSerials}) reached`, `ដល់ដែនកំណត់បរិមាណ (${maxSerials}) ហើយ`)}</span>}
            {!atLimit && <> · {t('QTY is fixed from the create page and cannot be edited here.', 'បរិមាណត្រូវបានកំណត់ពីទំព័របង្កើត ហើយមិនអាចកែបានទេ។')}</>}
          </p>

          {/* added serials — click to edit, ✕ to delete */}
          {temp.length > 0 && (
            <ul className="mt-3 max-h-52 space-y-1.5 overflow-y-auto rounded-xl border border-slate-700/60 bg-slate-950/40 p-2">
              {temp.map((s, i) => (
                <li key={`${s.serial}-${i}`} className="flex items-center justify-between gap-2 rounded-lg px-2 py-1.5 text-sm transition hover:bg-slate-800/60">
                  <button
                    type="button"
                    onClick={() => { setEditing(i); setSerialText(s.serial) }}
                    className={`min-w-0 flex-1 truncate text-left font-mono text-xs ${editing === i ? 'font-bold text-green-300' : 'text-slate-300'}`}
                    title={t('Click to edit', 'ចុចដើម្បីកែសម្រួល')}
                  >
                    {s.serial} <span className="text-slate-500">×{s.qty}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => { setTemp(temp.filter((_, j) => j !== i)); if (editing === i) { setEditing(-1); setSerialText('') } }}
                    className="shrink-0 transition hover:scale-110"
                    style={{ color: ORANGE }}
                    aria-label={t('Delete', 'លុប')}
                  >
                    <TrashIcon />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* footer */}
        <div className="flex items-center justify-end gap-3 border-t border-slate-700/60 px-5 py-4">
          <GhostButton onClick={() => { setEditing(-1); setSerialText(''); onCancel() }}>{t('Cancel', 'បោះបង់')}</GhostButton>
          <PrimaryButton onClick={() => onOk(temp)}>{t('OK', 'យល់ព្រម')}</PrimaryButton>
        </div>
      </div>
    </div>
  )
}

/* ---------- icons ---------- */
const SearchIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
    <circle cx="11" cy="11" r="7" />
    <line x1="21" y1="21" x2="16.5" y2="16.5" />
  </svg>
)

const TrashIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <polyline points="3 6 5 6 21 6" />
    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
    <line x1="10" y1="11" x2="10" y2="17" />
    <line x1="14" y1="11" x2="14" y2="17" />
  </svg>
)

export default ReceiveProductsCreate
