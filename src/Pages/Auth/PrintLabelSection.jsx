import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useLanguage } from '../../context/LanguageContext'
import { adminProductAPI, adminProductGroupAPI, adminBrandAPI, adminCategoryAPI, adminUnitAPI } from '../../api/api'
import copyIcon from '../../assets/icon/3dicons-copy-dynamic-color.png'
import { GhostButton, Modal, ConfirmModal } from './stockUI'

const pName = (p) => (typeof p?.name === 'object' ? p.name?.en : p?.name) || `#${p?.id}`
const pNameKh = (p) => (typeof p?.name === 'object' ? p.name?.kh : p?.nameKh || p?.name_kh || p?.secondLanguage || '—')

export const PrintLabelSection = () => {
  const { lang } = useLanguage()
  const t = (en, kh) => (lang === 'en' ? en : kh)

  // Master Data (Live from Backend)
  const [catalogProducts, setCatalogProducts] = useState([])
  const [groups, setGroups] = useState([])
  const [brands, setBrands] = useState([])
  const [categories, setCategories] = useState([])
  const [units, setUnits] = useState([])

  // Configuration Panel States
  const [layout, setLayout] = useState('1col') // '1col' | '2col' | 'a4'
  const [printSize, setPrintSize] = useState('1.55x0.98')
  const [outlet, setOutlet] = useState('MAIN-OUTLET')
  const [priceBook, setPriceBook] = useState('BASEPRICE')
  const [selectedGroup, setSelectedGroup] = useState('')
  const [selectedBrand, setSelectedBrand] = useState('')
  const [printPriceBy, setPrintPriceBy] = useState('Product')
  const [forceOneCopy, setForceOneCopy] = useState(false)

  // Product Print Queue
  const [printQueue, setPrintQueue] = useState([])
  const [previewProductIdx, setPreviewProductIdx] = useState(0)

  // Add Product Modal State
  const [addModalOpen, setAddModalOpen] = useState(false)
  const [searchModalQuery, setSearchModalQuery] = useState('')
  const [modalGroupFilter, setModalGroupFilter] = useState('')
  const [modalBrandFilter, setModalBrandFilter] = useState('')

  // Layout View Mode (table vs card grid)
  const [viewMode, setViewMode] = useState('table') // 'table' | 'grid'
  const [toast, setToast] = useState(null)
  const [confirmAction, setConfirmAction] = useState(null)

  const getGroupLabel = (g) => (lang === 'kh' && g?.nameKh) ? g.nameKh : (g?.description || g?.name || g?.code || '')
  const getGroupVal = (g) => g?.description || g?.name || g?.code || String(g?.id || '')
  const getBrandLabel = (b) => (lang === 'kh' && b?.nameKh) ? b.nameKh : (b?.description || b?.name || b?.code || '')
  const getBrandVal = (b) => b?.description || b?.name || b?.code || String(b?.id || '')

  useEffect(() => {
    Promise.all([
      adminProductAPI.getAll().catch(() => ({ data: [] })),
      adminProductGroupAPI.getAll().catch(() => ({ data: [] })),
      adminBrandAPI.getAll().catch(() => ({ data: [] })),
      adminCategoryAPI.getAll().catch(() => ({ data: [] })),
      adminUnitAPI.getAll().catch(() => ({ data: [] })),
    ]).then(([prodRes, grpRes, brRes, catRes, unitRes]) => {
      const prods = Array.isArray(prodRes?.data) ? prodRes.data : []
      setCatalogProducts(prods)
      setGroups(Array.isArray(grpRes?.data) ? grpRes.data : [])
      setBrands(Array.isArray(brRes?.data) ? brRes.data : [])
      setCategories(Array.isArray(catRes?.data) ? catRes.data : [])
      setUnits(Array.isArray(unitRes?.data) ? unitRes.data : [])

      // Seed initial 3 items for demonstration
      if (prods.length > 0) {
        const seeded = prods.slice(0, 3).map((p) => ({
          ...p,
          copies: 1,
          country: p.country || p.origin || 'Cambodia',
        }))
        setPrintQueue(seeded)
        
        // Auto-select initial product's group and brand
        const first = seeded[0]
        if (first) {
          const rawG = first.productGroup || first.group || ''
          const grpList = Array.isArray(grpRes?.data) ? grpRes.data : []
          if (rawG) {
            const foundG = grpList.find((g) =>
              String(g.id) === rawG ||
              String(g.code || '').toLowerCase() === rawG.toLowerCase() ||
              String(g.description || '').toLowerCase() === rawG.toLowerCase() ||
              String(g.name || '').toLowerCase() === rawG.toLowerCase() ||
              String(g.nameKh || '').toLowerCase() === rawG.toLowerCase()
            )
            setSelectedGroup(foundG ? (foundG.description || foundG.code || foundG.id) : rawG)
          }
          const rawB = first.brand || ''
          const brList = Array.isArray(brRes?.data) ? brRes.data : []
          if (rawB) {
            const foundB = brList.find((b) =>
              String(b.id) === rawB ||
              String(b.code || '').toLowerCase() === rawB.toLowerCase() ||
              String(b.description || '').toLowerCase() === rawB.toLowerCase() ||
              String(b.name || '').toLowerCase() === rawB.toLowerCase() ||
              String(b.nameKh || '').toLowerCase() === rawB.toLowerCase()
            )
            setSelectedBrand(foundB ? (foundB.description || foundB.code || foundB.id) : rawB)
          }
        }
      }
    })
  }, [])

  // Dynamic Size Presets based on Layout
  const sizeOptions = useMemo(() => {
    if (layout === 'a4') {
      return [
        { id: '2.5x1.15', label: 'Print A4 Size 2.5 Inch x 1.15 Inch Image' },
        { id: '3.0x1.5', label: 'Print A4 Size 3.0 Inch x 1.5 Inch Image' },
        { id: '2.0x1.0', label: 'Print A4 Size 2.0 Inch x 1.0 Inch (30 per sheet)' },
      ]
    }
    return [
      { id: '1.55x0.98', label: 'Bar Code Size 1.55 Inch x 0.98 Inch' },
      { id: '2.0x1.0', label: 'Shelf Tag Size 2.0 Inch x 1.0 Inch' },
      { id: '2.25x1.25', label: 'Standard Label 2.25 Inch x 1.25 Inch' },
      { id: '4.0x2.0', label: 'Carton Tag 4.0 Inch x 2.0 Inch' },
    ]
  }, [layout])

  const handleLayoutChange = (newLayout) => {
    setLayout(newLayout)
    if (newLayout === 'a4') {
      setPrintSize('2.5x1.15')
    } else {
      setPrintSize('1.55x0.98')
    }
  }

  // Current product displayed in the live configuration preview
  const currentPreviewProduct = printQueue[previewProductIdx] || catalogProducts[0] || {
    code: 'P-10024',
    barCode: '8851234567890',
    name: { en: 'Organic Fresh Strawberries', kh: 'ផ្លែស្ត្រប៊ែរីសរីរាង្គស្រស់' },
    basePrice: 4.50,
    uom: 'Pack',
    country: 'Cambodia',
  }

  /* ---------- Handlers ---------- */
  const handleReset = () => {
    setPrintQueue([])
    setOutlet('MAIN-OUTLET')
    setPriceBook('BASEPRICE')
    setSelectedGroup('')
    setSelectedBrand('')
    setPrintPriceBy('Product')
    setForceOneCopy(false)
    setLayout('1col')
    setPrintSize('1.55x0.98')
    setToast({ tone: 'slate', message: t('Print label configuration and queue reset.', 'ការកំណត់ និងបញ្ជីបោះពុម្ពត្រូវបានកំណត់ឡើងវិញ។') })
  }

  const promptReset = () => {
    setConfirmAction({
      title: { en: 'Reset Print Label Configuration', kh: 'កំណត់ឡើងវិញការកំណត់បោះពុម្ព' },
      message: {
        en: 'Are you sure you want to reset all print settings and clear the product queue?',
        kh: 'តើអ្នកពិតជាចង់កំណត់ឡើងវិញនូវការកំណត់ទាំងអស់ និងសម្អាតបញ្ជីផលិតផលមែនទេ?',
      },
      confirmText: { en: 'Confirm Reset', kh: 'យល់ព្រមកំណត់ឡើងវិញ' },
      cancelText: { en: 'Cancel', kh: 'បោះបង់' },
      type: 'danger',
      onConfirm: handleReset,
    })
  }

  const promptRemoveQueueItem = (idx, prodName) => {
    setConfirmAction({
      title: { en: 'Remove Item from Print Queue', kh: 'ដកទំនិញចេញពីបញ្ជីបោះពុម្ព' },
      message: {
        en: `Are you sure you want to remove "${prodName || 'Product'}" from the print queue?`,
        kh: `តើអ្នកពិតជាចង់ដក "${prodName || 'ផលិតផល'}" ចេញពីបញ្ជីបោះពុម្ពមែនទេ?`,
      },
      confirmText: { en: 'Confirm Remove', kh: 'យល់ព្រមដកចេញ' },
      cancelText: { en: 'Cancel', kh: 'បោះបង់' },
      type: 'danger',
      onConfirm: () => removeQueueItem(idx),
    })
  }

  const handleRfidPrint = () => {
    if (printQueue.length === 0) {
      setToast({ tone: 'orange', message: t('Please add products to the print queue first.', 'សូមបន្ថែមផលិតផលទៅក្នុងបញ្ជីជាមុនសិន።') })
      return
    }
    setToast({
      tone: 'blue',
      message: t(
        `📡 RFID Encoding & Printing started for ${totalCopies} tags (EPC Gen2 / ISO 18000-6C).`,
        `📡 កំពុងចាប់ផ្តើមបោះពុម្ព និងសរសេរកូដ RFID ចំនួន ${totalCopies} ស្លាក។`
      ),
    })
  }

  const handleNativePrint = () => {
    if (printQueue.length === 0) {
      setToast({ tone: 'orange', message: t('Please add products to the print queue first.', 'សូមបន្ថែមផលិតផលទៅក្នុងបញ្ជីជាមុនសិន។') })
      return
    }

    const win = window.open('', '_blank', 'width=900,height=900')
    if (!win) return

    const labelItems = []
    printQueue.forEach((p) => {
      const copiesCount = forceOneCopy ? 1 : (Number(p.copies) || 1)
      for (let i = 0; i < copiesCount; i++) {
        labelItems.push(p)
      }
    })

    const isA4 = layout === 'a4'
    const is2Col = layout === '2col'

    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>FreshMart - Print Labels</title>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Kantumruy+Pro:wght@400;600;700&family=Montserrat:wght@500;700;900&display=swap');
            * { box-sizing: border-box; margin: 0; padding: 0; }
            body { font-family: 'Montserrat', 'Kantumruy Pro', sans-serif; background: #fff; color: #000; padding: 6mm; }
            .grid-container {
              display: grid;
              grid-template-columns: ${isA4 ? 'repeat(3, 1fr)' : is2Col ? 'repeat(2, 1fr)' : '1fr'};
              gap: 3mm;
            }
            .label-card {
              border: 1px solid #111;
              border-radius: 2mm;
              padding: 2.5mm;
              background: #fff;
              page-break-inside: avoid;
              display: flex;
              flex-direction: column;
              justify-content: space-between;
              height: ${isA4 ? '35mm' : '30mm'};
            }
            .label-header { display: flex; justify-content: space-between; align-items: baseline; font-size: 7.5px; font-weight: 900; }
            .code-underline { text-decoration: underline; font-family: monospace; }
            .desc { font-size: 9.5px; font-weight: 800; line-height: 1.15; margin: 1mm 0 0.5mm; }
            .desc-kh { font-size: 8px; color: #444; }
            .price-tag { font-size: 13px; font-weight: 900; color: #000; text-align: right; }
            .barcode-box { text-align: center; margin-top: auto; }
            .barcode-bars { font-family: monospace; letter-spacing: 1.5px; font-size: 14px; font-weight: 900; line-height: 0.8; }
            .barcode-text { font-family: monospace; font-size: 8.5px; letter-spacing: 1px; color: #222; }
            .a4-body { display: flex; gap: 2mm; align-items: center; }
            .img-box { width: 14mm; height: 14mm; border: 1px dashed #999; display: flex; align-items: center; justify-content: center; font-size: 8px; color: #666; }
            @media print {
              body { padding: 0; }
              .grid-container { gap: 1.5mm; }
            }
          </style>
        </head>
        <body>
          <div class="grid-container">
            ${labelItems.map((p) => {
              const code = p.code || 'SKU-001'
              const barcode = p.barCode || p.barcode || '8850000000000'
              const desc = pName(p)
              const descKh = pNameKh(p)
              const price = Number(p.basePrice ?? p.price ?? 0).toFixed(2)
              const uom = p.uom || 'Unit'
              const country = p.country || 'Cambodia'

              if (isA4) {
                return `
                  <div class="label-card">
                    <div class="desc">${desc}</div>
                    <div class="a4-body">
                      <div class="img-box">${p.imageUrl ? `<img src="${p.imageUrl}" style="width:100%;height:100%;object-fit:cover;"/>` : 'IMG'}</div>
                      <div style="flex:1;">
                        <div class="barcode-bars">||| | |||| || | ||| ||||</div>
                        <div class="barcode-text">${barcode}</div>
                        <div style="font-size:7px; color:#555;">Code: ${code} · ${country}</div>
                      </div>
                    </div>
                    <div class="label-header" style="margin-top:1mm; border-top:1px dashed #aaa; padding-top:1mm;">
                      <span class="desc-kh">${descKh} (${uom})</span>
                      <span class="price-tag">$${price}</span>
                    </div>
                  </div>
                `
              }

              return `
                <div class="label-card">
                  <div class="label-header">
                    <span class="code-underline">${code}</span>
                    <span class="price-tag">Price: ${price} $</span>
                  </div>
                  <div>
                    <div class="desc">${desc}</div>
                    <div class="desc-kh">${descKh}</div>
                  </div>
                  <div class="barcode-box">
                    <div class="barcode-bars">||| | |||| || | ||| |||| | |||</div>
                    <div class="barcode-text">${barcode}</div>
                  </div>
                </div>
              `
            }).join('')}
          </div>
          <script>
            window.onload = () => window.print();
          </script>
        </body>
      </html>
    `
    win.document.write(htmlContent)
    win.document.close()
  }

  const selectQueueItem = (idx, customList = null) => {
    const list = customList || printQueue
    setPreviewProductIdx(idx)
    const item = list[idx]
    if (!item) return

    // Sync Product Group
    const rawGrp = item.productGroup || item.group || ''
    if (rawGrp) {
      const pGrp = String(rawGrp).toLowerCase().trim()
      const foundG = groups.find((g) =>
        String(g.id) === pGrp ||
        String(g.code || '').toLowerCase().trim() === pGrp ||
        String(g.description || '').toLowerCase().trim() === pGrp ||
        String(g.name || '').toLowerCase().trim() === pGrp ||
        String(g.nameKh || '').toLowerCase().trim() === pGrp
      )
      setSelectedGroup(foundG ? getGroupVal(foundG) : rawGrp)
    } else {
      setSelectedGroup('')
    }

    // Sync Brand
    const rawBrand = item.brand || ''
    if (rawBrand) {
      const pBr = String(rawBrand).toLowerCase().trim()
      const foundB = brands.find((b) =>
        String(b.id) === pBr ||
        String(b.code || '').toLowerCase().trim() === pBr ||
        String(b.description || '').toLowerCase().trim() === pBr ||
        String(b.name || '').toLowerCase().trim() === pBr ||
        String(b.nameKh || '').toLowerCase().trim() === pBr
      )
      setSelectedBrand(foundB ? getBrandVal(foundB) : rawBrand)
    } else {
      setSelectedBrand('')
    }
  }

  const patchQueueItem = (idx, patch) => {
    setPrintQueue(printQueue.map((it, i) => (i === idx ? { ...it, ...patch } : it)))
  }

  const removeQueueItem = (idx) => {
    const next = printQueue.filter((_, i) => i !== idx)
    setPrintQueue(next)
    if (next.length > 0) {
      const nextIdx = Math.min(previewProductIdx, next.length - 1)
      selectQueueItem(nextIdx, next)
    } else {
      setSelectedGroup('')
      setSelectedBrand('')
    }
  }

  const addProductToQueue = (p) => {
    const existingIdx = printQueue.findIndex((it) => String(it.id) === String(p.id))
    let nextQueue
    let targetIdx
    if (existingIdx >= 0) {
      nextQueue = printQueue.map((it, i) => (i === existingIdx ? { ...it, copies: (Number(it.copies) || 1) + 1 } : it))
      targetIdx = existingIdx
    } else {
      const newItem = {
        ...p,
        copies: 1,
        country: p.country || p.origin || 'Cambodia',
      }
      nextQueue = [...printQueue, newItem]
      targetIdx = nextQueue.length - 1
    }
    setPrintQueue(nextQueue)
    selectQueueItem(targetIdx, nextQueue)
    setToast({ tone: 'green', message: t(`✓ Added ${pName(p)} to print queue`, `✓ បានបន្ថែម ${pName(p)} ទៅក្នុងបញ្ជីបោះពុម្ព`) })
  }

  const matchGroup = (p, gVal) => {
    if (!gVal) return true
    const gLower = gVal.toLowerCase()
    const pGroup = String(p.productGroup || p.group || '').toLowerCase()
    return pGroup === gLower || pGroup.includes(gLower)
  }

  const matchBrand = (p, bVal) => {
    if (!bVal) return true
    const bLower = bVal.toLowerCase()
    const pBrand = String(p.brand || '').toLowerCase()
    return pBrand === bLower || pBrand.includes(bLower)
  }

  const matchingGroupBrandProducts = useMemo(() => {
    if (!selectedGroup && !selectedBrand) return []
    return catalogProducts.filter((p) => matchGroup(p, selectedGroup) && matchBrand(p, selectedBrand))
  }, [catalogProducts, selectedGroup, selectedBrand])

  const addAllMatchingToQueue = () => {
    if (matchingGroupBrandProducts.length === 0) return
    const nextQueue = [...printQueue]
    matchingGroupBrandProducts.forEach((p) => {
      const existing = nextQueue.find((it) => String(it.id) === String(p.id))
      if (existing) {
        existing.copies = (Number(existing.copies) || 1) + 1
      } else {
        nextQueue.push({
          ...p,
          copies: 1,
          country: p.country || p.origin || 'Cambodia',
        })
      }
    })
    setPrintQueue(nextQueue)
    setToast({
      tone: 'green',
      message: t(
        `✓ Added ${matchingGroupBrandProducts.length} matching products to print queue.`,
        `✓ បានបន្ថែម ${matchingGroupBrandProducts.length} ផលិតផលត្រូវគ្នាក្នុងបញ្ជីបោះពុម្ព។`
      ),
    })
  }

  // Summary Metrics
  const totalItems = printQueue.length
  const totalCopies = printQueue.reduce((sum, it) => sum + (forceOneCopy ? 1 : (Number(it.copies) || 1)), 0)
  const totalQueueValue = printQueue.reduce((sum, it) => sum + (Number(it.basePrice ?? it.price ?? 0) * (forceOneCopy ? 1 : (Number(it.copies) || 1))), 0)

  // Filtered Catalog for Add Modal
  const modalFilteredProducts = useMemo(() => {
    const q = searchModalQuery.trim().toLowerCase()
    return catalogProducts.filter((p) => {
      const matchesQ = !q || (
        String(p.code || '').toLowerCase().includes(q) ||
        String(p.barCode || p.barcode || '').toLowerCase().includes(q) ||
        String(pName(p)).toLowerCase().includes(q) ||
        String(pNameKh(p)).toLowerCase().includes(q)
      )
      const matchesG = matchGroup(p, modalGroupFilter)
      const matchesB = matchBrand(p, modalBrandFilter)
      return matchesQ && matchesG && matchesB
    })
  }, [catalogProducts, searchModalQuery, modalGroupFilter, modalBrandFilter])

  return (
    <div className="space-y-6">

      {/* =========================================================================
         1. HEADER / BREADCRUMB
         ========================================================================= */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between border-b border-slate-800 pb-5">
        <div>
          {/* Breadcrumb */}
          <nav className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-400">
            <Link to="/admin/products" className="text-slate-400 transition hover:text-green-400">
              {t('Stocks', 'ស្តុក')}
            </Link>
            <span className="text-slate-600">/</span>
            <span className="text-green-400">{t('Print Label', 'បោះពុម្ពស្លាក')}</span>
          </nav>

          <h1 className="text-2xl font-black text-white md:text-3xl flex items-center gap-3">
            <span className="flex h-11 w-11 p-2 items-center justify-center rounded-xl bg-purple-500/20 ring-1 ring-purple-500/30">
              <img src={copyIcon} alt="" className="h-7 w-7 object-contain drop-shadow" />
            </span>
            {t('Print Label', 'បោះពុម្ពស្លាក')}
          </h1>
          <p className="mt-1 text-xs text-slate-400">
            {t('Add, view and edit your Print Label in one place', 'បន្ថែម មើល និងកែសម្រួលស្លាកបោះពុម្ពរបស់អ្នកនៅកន្លែងតែមួយ')}
          </p>
        </div>

        {/* Top-Right Action Buttons: Reset | RFID Print | Preview */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Reset (gray / outline) */}
          <GhostButton onClick={promptReset}>
            🔄 {t('Reset', 'កំណត់ឡើងវិញ')}
          </GhostButton>

          {/* RFID Print (blue) */}
          <button
            type="button"
            onClick={handleRfidPrint}
            className="inline-flex items-center gap-2 rounded-xl border border-sky-500/40 bg-sky-600 px-4 py-2.5 text-xs font-black text-white shadow-lg shadow-sky-600/25 transition hover:bg-sky-500 hover:-translate-y-0.5 active:translate-y-0"
          >
            📡 {t('RFID Print', 'បោះពុម្ព RFID')}
          </button>

          {/* Preview (blue, primary) */}
          <button
            type="button"
            onClick={handleNativePrint}
            className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-xs font-black text-white shadow-lg shadow-blue-600/30 transition hover:bg-blue-500 hover:-translate-y-0.5 active:translate-y-0"
          >
            👁️ {t('Preview & Print', 'មើលគំរូ & បោះពុម្ព')}
          </button>
        </div>
      </div>

      {/* Toast Alert */}
      {toast && (
        <div className={`flex items-center justify-between rounded-xl border px-4 py-3 text-sm font-semibold ${
          toast.tone === 'green' ? 'border-green-500/40 bg-green-500/10 text-green-300' :
          toast.tone === 'blue' ? 'border-sky-500/40 bg-sky-500/10 text-sky-300' :
          toast.tone === 'orange' ? 'border-amber-500/40 bg-amber-500/10 text-amber-300' :
          'border-slate-700 bg-slate-800/80 text-slate-300'
        }`}>
          <span>{toast.message}</span>
          <button type="button" onClick={() => setToast(null)} className="text-xs opacity-70 hover:opacity-100">✕</button>
        </div>
      )}

      {/* =========================================================================
         2. PRINT LABEL CONFIGURATION PANEL (Card divided into left & right)
         ========================================================================= */}
      <section className="rounded-3xl border border-slate-700/80 bg-slate-900 shadow-2xl overflow-hidden">
        <div className="grid grid-cols-1 lg:grid-cols-12 divide-y lg:divide-y-0 lg:divide-x divide-slate-800">

          {/* LEFT SIDE: Print Label (Layout, Size & Live Label Preview) */}
          <div className="lg:col-span-5 p-6 sm:p-7 space-y-5 bg-slate-900/60">
            <div>
              <h2 className="text-base font-black text-white flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full bg-purple-400"></span>
                {t('Print Label', 'បោះពុម្ពស្លាក')}
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                {t('Input print label information', 'បញ្ចូលព័ត៌មានស្លាកបោះពុម្ព')}
              </p>
            </div>

            {/* Radio Button Group: 1 Column / 2 Column / A4 */}
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-400">
                {t('Print Layout', 'ទម្រង់ប្លង់បោះពុម្ព')}
              </label>
              <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-slate-800 bg-slate-950/80 p-1.5">
                {[
                  { key: '1col', label: '1 Column' },
                  { key: '2col', label: '2 Column' },
                  { key: 'a4', label: 'A4' },
                ].map((opt) => (
                  <button
                    key={opt.key}
                    type="button"
                    onClick={() => handleLayoutChange(opt.key)}
                    className={`flex-1 rounded-xl py-2 px-3 text-xs font-extrabold transition text-center ${
                      layout === opt.key
                        ? 'bg-purple-600 text-white shadow-md shadow-purple-600/30'
                        : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Print Size Dropdown */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-400">
                {t('Print Size', 'ទំហំស្លាក')}
              </label>
              <select
                value={printSize}
                onChange={(e) => setPrintSize(e.target.value)}
                className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2.5 text-xs font-bold text-white outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-500/20"
              >
                {layout !== 'a4' ? (
                  <>
                    <option value="1.55x0.98">Bar Code Size 1.55 Inch x 0.98 Inch (40 × 30 mm)</option>
                    <option value="2.00x1.00">Bar Code Size 2.00 Inch x 1.00 Inch (50 × 25 mm)</option>
                    <option value="2.25x1.25">Bar Code Size 2.25 Inch x 1.25 Inch (58 × 40 mm)</option>
                    <option value="3.00x2.00">Bar Code Size 3.00 Inch x 2.00 Inch (80 × 50 mm)</option>
                  </>
                ) : (
                  <>
                    <option value="a4-2.5x1.15">Print A4 Size 2.5 Inch x 1.15 Inch Image (24 Labels/Page)</option>
                    <option value="a4-3.0x1.50">Print A4 Size 3.0 Inch x 1.50 Inch Image (18 Labels/Page)</option>
                    <option value="a4-4.0x2.00">Print A4 Size 4.0 Inch x 2.00 Inch Image (10 Labels/Page)</option>
                  </>
                )}
              </select>
            </div>

            {/* Live Label Preview Box */}
            <div className="space-y-2 pt-2">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span className="font-bold uppercase tracking-wider">{t('Live Label Preview', 'ការមើលគំរូជាក់ស្តែង')}</span>
                <span className="text-[11px] text-purple-400 font-mono">[{layout.toUpperCase()} - {printSize}]</span>
              </div>

              {/* Printable Label Box */}
              <div className="rounded-2xl border-2 border-dashed border-slate-700 bg-slate-950 p-4 flex flex-col items-center justify-center">
                {layout !== 'a4' ? (
                  /* 1/2 Column Printable Box */
                  <div className="w-full max-w-[280px] rounded-xl border border-slate-400 bg-white p-3.5 text-slate-900 shadow-xl space-y-2">
                    {/* Header: Product code underlined + Right Price */}
                    <div className="flex items-baseline justify-between border-b border-slate-200 pb-1">
                      <span className="font-mono text-xs font-black underline text-slate-900 tracking-wider">
                        {currentPreviewProduct.code || 'P-10024'}
                      </span>
                      <span className="font-mono text-sm font-black text-slate-950">
                        Price: {Number(currentPreviewProduct.basePrice ?? currentPreviewProduct.price ?? 0).toFixed(2)} $
                      </span>
                    </div>

                    {/* Product Description */}
                    <div>
                      <h4 className="font-black text-xs text-slate-900 leading-tight">
                        {pName(currentPreviewProduct)}
                      </h4>
                      <p className="text-[10px] font-medium text-slate-600 font-khmer leading-tight">
                        {pNameKh(currentPreviewProduct)}
                      </p>
                    </div>

                    {/* Barcode graphic and number below */}
                    <div className="text-center pt-1 border-t border-dashed border-slate-300">
                      <div className="font-mono text-xs tracking-widest font-black leading-none select-none text-slate-950">
                        ||| | |||| || | ||| |||| | |||
                      </div>
                      <div className="mt-1 font-mono text-[10px] font-bold tracking-wider text-slate-800">
                        {currentPreviewProduct.barCode || currentPreviewProduct.barcode || '8851234567890'}
                      </div>
                    </div>
                  </div>
                ) : (
                  /* A4 Layout Printable Box */
                  <div className="w-full max-w-[320px] rounded-xl border border-slate-400 bg-white p-3.5 text-slate-900 shadow-xl space-y-2.5">
                    {/* Heading Description */}
                    <div className="border-b border-slate-200 pb-1">
                      <h4 className="font-black text-xs text-slate-900 leading-tight">
                        {pName(currentPreviewProduct)}
                      </h4>
                    </div>

                    {/* Image box on left + Barcode & code on right */}
                    <div className="flex items-center gap-3">
                      <div className="h-14 w-14 rounded-lg border border-dashed border-slate-400 bg-slate-100 flex items-center justify-center text-xs font-bold text-slate-500">
                        {currentPreviewProduct.imageUrl ? (
                          <img src={currentPreviewProduct.imageUrl} alt="" className="h-full w-full rounded-lg object-cover" />
                        ) : (
                          <span>🖼️ IMG</span>
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="font-mono text-xs tracking-widest font-black leading-none select-none text-slate-950">
                          ||| | |||| || | ||| ||||
                        </div>
                        <div className="mt-1 font-mono text-[10px] font-bold text-slate-800">
                          {currentPreviewProduct.barCode || currentPreviewProduct.barcode || '8851234567890'}
                        </div>
                        <div className="font-mono text-[9px] text-slate-500">
                          Code: {currentPreviewProduct.code || 'P-10024'}
                        </div>
                      </div>
                    </div>

                    {/* Small Khmer label, quantity/unit, and price below */}
                    <div className="flex items-end justify-between border-t border-dashed border-slate-300 pt-1.5">
                      <div className="min-w-0">
                        <p className="text-[10px] font-medium text-slate-700 font-khmer truncate">
                          {pNameKh(currentPreviewProduct)}
                        </p>
                        <p className="text-[9px] text-slate-500">
                          Unit: {currentPreviewProduct.uom || 'Pack'} · {currentPreviewProduct.country || 'Cambodia'}
                        </p>
                      </div>

                      <div className="font-mono text-sm font-black text-slate-950">
                        ${Number(currentPreviewProduct.basePrice ?? currentPreviewProduct.price ?? 0).toFixed(2)}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* RIGHT SIDE: Two-column Form Grid & Filter Controls */}
          <div className="lg:col-span-7 p-6 sm:p-7 space-y-5 bg-slate-900/90 flex flex-col justify-between">
            <div className="space-y-5">
              <div>
                <h3 className="text-sm font-extrabold uppercase tracking-wide text-white">
                  {t('Target Outlet & Price Configuration', 'ការកំណត់សាខា និងតម្លៃ')}
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  {t('Select price book, outlet inventory source and filter criteria.', 'ជ្រើសរើសសៀវភៅតម្លៃ សាខា និងលក្ខខណ្ឌច្រោះ។')}
                </p>
              </div>

              {/* Two-Column Form Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

                {/* Outlet (Required) */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center justify-between">
                    <span>{t('Outlet', 'សាខា')} <span className="text-amber-400">*</span></span>
                  </label>
                  <select
                    value={outlet}
                    onChange={(e) => setOutlet(e.target.value)}
                    className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2.5 text-xs font-bold text-white outline-none focus:border-purple-400"
                  >
                    <option value="MAIN-OUTLET">MAIN-OUTLET (Warehouse Hyperstore)</option>
                    <option value="BKK1-BRANCH">BKK1 BRANCH (Boeng Keng Kang)</option>
                    <option value="TOUL-KORK-BRANCH">TOUL KORK BRANCH</option>
                    <option value="CHBAR-AMPOV-BRANCH">CHBAR AMPOV BRANCH</option>
                    <option value="SEN-SOK-BRANCH">SEN SOK BRANCH</option>
                  </select>
                </div>

                {/* Price Book (Required) */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center justify-between">
                    <span>{t('Price Book', 'សៀវភៅតម្លៃ')} <span className="text-amber-400">*</span></span>
                  </label>
                  <select
                    value={priceBook}
                    onChange={(e) => setPriceBook(e.target.value)}
                    className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2.5 text-xs font-bold text-white outline-none focus:border-purple-400"
                  >
                    <option value="BASEPRICE">BASEPRICE (Standard Retail Price)</option>
                    <option value="RETAIL-DEFAULT">RETAIL-DEFAULT</option>
                    <option value="MEMBER-PROMO">MEMBER-PROMO (Discount Book)</option>
                    <option value="VIP-WHOLESALE">VIP-WHOLESALE</option>
                  </select>
                </div>

                {/* Product Group */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center justify-between">
                    <span>{t('Product Group', 'ក្រុមផលិតផល')}</span>
                    {groups.length > 0 && <span className="text-[10px] text-purple-400 font-mono">({groups.length} live)</span>}
                  </label>
                  <select
                    value={selectedGroup}
                    onChange={(e) => setSelectedGroup(e.target.value)}
                    className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2.5 text-xs font-bold text-white outline-none focus:border-purple-400"
                  >
                    <option value="">{t('All Groups', 'គ្រប់ក្រុមផលិតផល')}</option>
                    {groups.map((g) => {
                      const label = getGroupLabel(g)
                      const val = getGroupVal(g)
                      return (
                        <option key={g.id || g.code || val} value={val}>
                          {label}
                        </option>
                      )
                    })}
                  </select>
                </div>

                {/* Brand */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center justify-between">
                    <span>{t('Brand', 'ម៉ាកយីហោ')}</span>
                    {brands.length > 0 && <span className="text-[10px] text-purple-400 font-mono">({brands.length} live)</span>}
                  </label>
                  <select
                    value={selectedBrand}
                    onChange={(e) => setSelectedBrand(e.target.value)}
                    className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2.5 text-xs font-bold text-white outline-none focus:border-purple-400"
                  >
                    <option value="">{t('All Brands', 'គ្រប់ម៉ាក')}</option>
                    {brands.map((b) => {
                      const label = getBrandLabel(b)
                      const val = getBrandVal(b)
                      return (
                        <option key={b.id || b.code || val} value={val}>
                          {label}
                        </option>
                      )
                    })}
                  </select>
                </div>

                {/* Quick Matching Products Banner when Group or Brand is chosen */}
                {(selectedGroup || selectedBrand) && (
                  <div className="sm:col-span-2 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-purple-500/40 bg-purple-500/10 p-3.5">
                    <div className="flex items-center gap-2">
                      <span className="text-sm">🏷️</span>
                      <span className="text-xs font-bold text-purple-200">
                        {t('Found', 'បានរកឃើញ')} <strong className="text-white font-mono text-sm">{matchingGroupBrandProducts.length}</strong> {t('product(s) in catalog matching selected filter.', 'ផលិតផលក្នុងបញ្ជីត្រូវនឹងលក្ខខណ្ឌ។')}
                      </span>
                    </div>
                    {matchingGroupBrandProducts.length > 0 && (
                      <button
                        type="button"
                        onClick={addAllMatchingToQueue}
                        className="rounded-xl bg-purple-600 px-3.5 py-1.5 text-xs font-extrabold text-white shadow-md shadow-purple-600/30 transition hover:bg-purple-500 hover:scale-105 active:scale-95"
                      >
                        + {t('Add All to Print Queue', 'បន្ថែមទាំងអស់ទៅក្នុងបញ្ជី')}
                      </button>
                    )}
                  </div>
                )}

              </div>

              {/* Print Price By dropdown + "1 copy" Checkbox */}
              <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-slate-800 bg-slate-950/60 p-4">
                <div className="flex-1 min-w-[200px] space-y-1">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    {t('Print Price By', 'បោះពុម្ពតម្លៃតាម')}
                  </label>
                  <select
                    value={printPriceBy}
                    onChange={(e) => setPrintPriceBy(e.target.value)}
                    className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-xs font-bold text-white outline-none focus:border-purple-400"
                  >
                    <option value="Product">{t('Product Standard Price', 'តម្លៃស្តង់ដារផលិតផល')}</option>
                    <option value="Variant">{t('Variant Specific Price', 'តម្លៃតាមជម្រើស')}</option>
                    <option value="Promotion">{t('Active Promotion Price', 'តម្លៃប្រូម៉ូសិន')}</option>
                    <option value="Member">{t('Member Club Price', 'តម្លៃសមាជិក')}</option>
                  </select>
                </div>

                <div className="flex items-center gap-2 pt-4">
                  <label className="flex items-center gap-2 text-xs font-bold text-white cursor-pointer bg-slate-900 border border-slate-700 px-3.5 py-2 rounded-xl transition hover:border-purple-400">
                    <input
                      type="checkbox"
                      checked={forceOneCopy}
                      onChange={(e) => setForceOneCopy(e.target.checked)}
                      className="rounded text-purple-500 focus:ring-purple-500"
                    />
                    <span>{t('1 copy for all items', '១ ច្បាប់ សម្រាប់គ្រប់ទំនិញ')}</span>
                  </label>
                </div>
              </div>
            </div>

            {/* Quick Action Hint */}
            <div className="flex items-center justify-between text-xs text-slate-400 pt-3 border-t border-slate-800">
              <span>{t('Queue count:', 'ចំនួនក្នុងបញ្ជី:')} <strong className="text-white">{printQueue.length}</strong> {t('SKUs', 'មុខ')}</span>
              <span>{t('Total Tags to Print:', 'ចំនួនស្លាកត្រូវបោះពុម្ព:')} <strong className="text-purple-400 font-mono text-sm">{totalCopies}</strong></span>
            </div>
          </div>

        </div>
      </section>

      {/* =========================================================================
         3. PRODUCT LIST TABLE
         ========================================================================= */}
      <section className="overflow-hidden rounded-3xl border border-slate-700/80 bg-slate-900 shadow-2xl">
        
        {/* Section Header */}
        <div className="flex flex-col gap-3 p-6 sm:flex-row sm:items-center sm:justify-between border-b border-slate-800">
          <div>
            <h2 className="text-lg font-black text-white flex items-center gap-2">
              <span>📋</span> {t('Product List', 'បញ្ជីផលិតផល')} ({printQueue.length})
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              {t(
                'The type of product we choose determines how manage inventory and print',
                'ប្រភេទផលិតផលដែលយើងជ្រើសរើសកំណត់ពីរបៀបគ្រប់គ្រងស្តុក និងការបោះពុម្ព'
              )}
            </p>
          </div>

          {/* Top-Right Controls: Grid/Layout Toggle + Add Button (Dark) */}
          <div className="flex items-center gap-2.5">
            {/* Grid/Layout Toggle */}
            <button
              type="button"
              onClick={() => setViewMode(viewMode === 'table' ? 'grid' : 'table')}
              className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-700 bg-slate-800 text-slate-300 transition hover:bg-slate-700 hover:text-white"
              title={t('Toggle View Mode', 'ប្តូរទម្រង់បង្ហាញ')}
            >
              {viewMode === 'table' ? '⊞' : '☰'}
            </button>

            {/* Add Button (Dark / Primary) */}
            <button
              type="button"
              onClick={() => { setSearchModalQuery(''); setAddModalOpen(true) }}
              className="inline-flex items-center gap-2 rounded-xl bg-slate-950 border border-slate-700 px-4 py-2.5 text-xs font-extrabold text-white shadow-lg transition hover:bg-slate-800 hover:border-slate-500 hover:scale-105 active:scale-95"
            >
              <span>+</span> {t('Add Product', 'បន្ថែមផលិតផល')}
            </button>
          </div>
        </div>

        {/* Product Table View */}
        {viewMode === 'table' ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-950/60 text-xs font-bold uppercase tracking-wider text-slate-400">
                  <th className="px-5 py-3.5">{t('Code', 'កូដ')}</th>
                  <th className="px-5 py-3.5">{t('Barcode', 'បារកូដ')}</th>
                  <th className="px-5 py-3.5">{t('Description', 'ការពិពណ៌នា')}</th>
                  <th className="px-5 py-3.5">{t('Country', 'ប្រទេស')}</th>
                  <th className="px-5 py-3.5 text-right">{t('Onhand', 'ក្នុងស្តុក')}</th>
                  <th className="px-5 py-3.5 text-center w-28">{t('Copies', 'ចំនួនច្បាប់')}</th>
                  <th className="px-5 py-3.5">{t('UOM', 'ខ្នាត')}</th>
                  <th className="px-5 py-3.5 text-right">{t('Price ($)', 'តម្លៃ ($)')}</th>
                  <th className="px-5 py-3.5 text-center">{t('Action', 'សកម្មភាព')}</th>
                </tr>
              </thead>
              <tbody>
                {printQueue.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="px-6 py-20 text-center text-slate-400">
                      <span className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-800 text-3xl">🖨️</span>
                      <p className="text-sm font-bold text-white">{t('No products in print queue', 'មិនទាន់មានផលិតផលក្នុងបញ្ជីបោះពុម្ពនៅឡើយទេ')}</p>
                      <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                        {t('Click "+ Add Product" button above to select items from catalog.', 'ចុចប៊ូតុង "+ បន្ថែមផលិតផល" ខាងលើ ដើម្បីជ្រើសរើសទំនិញពីបញ្ជី។')}
                      </p>
                    </td>
                  </tr>
                ) : (
                  printQueue.map((item, idx) => {
                    const isSelected = previewProductIdx === idx
                    return (
                      <tr
                        key={item.id || idx}
                        onClick={() => selectQueueItem(idx)}
                        className={`border-b border-slate-800/60 transition cursor-pointer ${
                          isSelected ? 'bg-purple-500/10' : 'hover:bg-slate-800/40'
                        }`}
                      >
                        {/* Code */}
                        <td className="px-5 py-3.5 font-mono text-xs font-bold text-purple-300">
                          {item.code || '—'}
                        </td>

                        {/* Barcode */}
                        <td className="px-5 py-3.5 font-mono text-xs text-slate-300">
                          {item.barCode || item.barcode || '—'}
                        </td>

                        {/* Description */}
                        <td className="px-5 py-3.5 font-semibold text-white">
                          <div>{pName(item)}</div>
                          <div className="text-xs font-normal text-slate-400 font-khmer">{pNameKh(item)}</div>
                        </td>

                        {/* Country */}
                        <td className="px-5 py-3.5 text-slate-300 text-xs">
                          {item.country || 'Cambodia'}
                        </td>

                        {/* Onhand */}
                        <td className="px-5 py-3.5 text-right font-mono font-bold text-slate-300">
                          {Number(item.onHand ?? 0).toFixed(2)}
                        </td>

                        {/* Copies */}
                        <td className="px-5 py-3.5" onClick={(e) => e.stopPropagation()}>
                          <input
                            type="number"
                            min="1"
                            max="999"
                            disabled={forceOneCopy}
                            value={forceOneCopy ? 1 : (item.copies || 1)}
                            onChange={(e) => patchQueueItem(idx, { copies: Math.max(1, parseInt(e.target.value) || 1) })}
                            className="w-20 rounded-lg border border-slate-700 bg-slate-950 px-2.5 py-1 text-center font-mono text-sm font-black text-white outline-none focus:border-purple-400 disabled:opacity-50"
                          />
                        </td>

                        {/* UOM */}
                        <td className="px-5 py-3.5 text-slate-400 text-xs">
                          <span className="rounded bg-slate-800 px-2 py-0.5 font-medium text-slate-300">
                            {item.uom || 'Pcs'}
                          </span>
                        </td>

                        {/* Price */}
                        <td className="px-5 py-3.5 text-right font-mono text-sm font-black text-green-300">
                          ${Number(item.basePrice ?? item.price ?? 0).toFixed(2)}
                        </td>

                        {/* Action */}
                        <td className="px-5 py-3.5 text-center" onClick={(e) => e.stopPropagation()}>
                          <button
                            type="button"
                            onClick={() => promptRemoveQueueItem(idx, pName(item))}
                            className="rounded-lg p-1.5 text-slate-400 transition hover:bg-red-500/20 hover:text-red-300"
                            title={t('Remove from queue', 'ដកចេញពីបញ្ជី')}
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
        ) : (
          /* Grid View Mode */
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 p-6">
            {printQueue.map((item, idx) => (
              <div
                key={item.id || idx}
                onClick={() => selectQueueItem(idx)}
                className={`rounded-2xl border p-4 transition cursor-pointer flex flex-col justify-between ${
                  previewProductIdx === idx
                    ? 'border-purple-500/80 bg-slate-950 ring-2 ring-purple-500/30'
                    : 'border-slate-800 bg-slate-950/60 hover:border-slate-700'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="font-mono text-purple-300 font-bold">{item.code}</span>
                    <span className="font-mono text-green-300 font-black">${Number(item.basePrice ?? 0).toFixed(2)}</span>
                  </div>
                  <h4 className="font-bold text-white text-sm truncate">{pName(item)}</h4>
                  <p className="text-xs text-slate-400 font-khmer truncate">{pNameKh(item)}</p>
                </div>

                <div className="mt-4 flex items-center justify-between border-t border-slate-800 pt-3">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-400">{t('Copies:', 'ច្បាប់:')}</span>
                    <input
                      type="number"
                      min="1"
                      disabled={forceOneCopy}
                      value={forceOneCopy ? 1 : (item.copies || 1)}
                      onChange={(e) => patchQueueItem(idx, { copies: Math.max(1, parseInt(e.target.value) || 1) })}
                      onClick={(e) => e.stopPropagation()}
                      className="w-14 rounded-lg border border-slate-700 bg-slate-900 px-2 py-0.5 text-center font-mono text-xs font-black text-white"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); promptRemoveQueueItem(idx, pName(item)); }}
                    className="text-slate-400 hover:text-red-400 p-1"
                  >
                    🗑️
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Bottom Running Total Bar */}
        <div className="flex flex-wrap items-center justify-between gap-4 border-t border-slate-800 bg-slate-950/80 px-6 py-4">
          <div className="flex items-center gap-4 text-xs text-slate-400">
            <span>{t('Total Products:', 'មុខទំនិញសរុប:')} <strong className="text-white font-mono">{totalItems}</strong></span>
            <span>·</span>
            <span>{t('Total Copies:', 'ចំនួនច្បាប់សរុប:')} <strong className="text-purple-400 font-mono text-sm">{totalCopies}</strong></span>
          </div>

          <div className="flex items-center gap-6">
            <div className="text-right">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">{t('Running Total Value:', 'តម្លៃសរុប:')}</span>
              <span className="ml-2 font-mono text-lg font-black text-green-300">
                ${totalQueueValue.toFixed(2)}
              </span>
            </div>
          </div>
        </div>

      </section>

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

      {/* =========================================================================
         ADD PRODUCT MODAL
         ========================================================================= */}
      <Modal
        open={addModalOpen}
        onClose={() => setAddModalOpen(false)}
        title={t('Add Products to Print Queue', 'បន្ថែមផលិតផលទៅក្នុងបញ្ជីបោះពុម្ព')}
        wide
      >
        <div className="space-y-4">
          {/* 3-Part Filter Toolbar: Search Query + Live Group Filter + Live Brand Filter */}
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
            <div className="relative sm:col-span-6">
              <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500">🔍</span>
              <input
                type="text"
                value={searchModalQuery}
                onChange={(e) => setSearchModalQuery(e.target.value)}
                placeholder={t('Search catalog by code, barcode, or description...', 'ស្វែងរកតាមកូដ បារកូដ ឬឈ្មោះ...')}
                className="w-full rounded-xl border border-slate-700 bg-slate-950/80 py-2 pl-10 pr-4 text-xs font-medium text-white placeholder-slate-500 outline-none focus:border-purple-400"
              />
            </div>

            <div className="sm:col-span-3">
              <select
                value={modalGroupFilter}
                onChange={(e) => setModalGroupFilter(e.target.value)}
                className="w-full rounded-xl border border-slate-700 bg-slate-950/80 py-2 px-3 text-xs font-semibold text-white outline-none focus:border-purple-400"
              >
                <option value="">{t('All Groups', 'គ្រប់ក្រុម')}</option>
                {groups.map((g) => (
                  <option key={g.id || g.code} value={getGroupVal(g)}>
                    {getGroupLabel(g)}
                  </option>
                ))}
              </select>
            </div>

            <div className="sm:col-span-3">
              <select
                value={modalBrandFilter}
                onChange={(e) => setModalBrandFilter(e.target.value)}
                className="w-full rounded-xl border border-slate-700 bg-slate-950/80 py-2 px-3 text-xs font-semibold text-white outline-none focus:border-purple-400"
              >
                <option value="">{t('All Brands', 'គ្រប់ម៉ាក')}</option>
                {brands.map((b) => (
                  <option key={b.id || b.code} value={getBrandVal(b)}>
                    {getBrandLabel(b)}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="max-h-96 overflow-y-auto rounded-xl border border-slate-800 divide-y divide-slate-800">
            {modalFilteredProducts.length === 0 ? (
              <div className="p-8 text-center text-slate-400 text-sm font-semibold">
                {t('No products matching search criteria.', 'មិនមានផលិតផលត្រូវនឹងការស្វែងរកទេ។')}
              </div>
            ) : (
              modalFilteredProducts.map((p) => {
                const inQueue = printQueue.some((it) => String(it.id) === String(p.id))
                const pGroup = p.productGroup || p.group
                const pBrand = p.brand
                return (
                  <div key={p.id} className="flex items-center justify-between p-3.5 hover:bg-slate-800/40 transition">
                    <div className="flex items-center gap-3 min-w-0">
                      {p.imageUrl ? (
                        <img src={p.imageUrl} alt="" className="h-10 w-10 rounded-lg object-cover ring-1 ring-slate-700 shrink-0" onError={(e) => { e.currentTarget.style.display = 'none' }} />
                      ) : (
                        <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-800 text-sm shrink-0">🥫</span>
                      )}
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <h4 className="font-bold text-white text-sm truncate">{pName(p)}</h4>
                          {pGroup && <span className="rounded bg-purple-500/20 px-1.5 py-0.5 text-[10px] font-bold text-purple-300 shrink-0">{pGroup}</span>}
                          {pBrand && <span className="rounded bg-sky-500/20 px-1.5 py-0.5 text-[10px] font-bold text-sky-300 shrink-0">{pBrand}</span>}
                        </div>
                        <p className="font-mono text-xs text-slate-400">
                          Code: <span className="text-purple-300">{p.code || '—'}</span> · Barcode: <span className="text-slate-300">{p.barCode || p.barcode || '—'}</span> · UOM: <span className="text-slate-300">{p.uom || 'Unit'}</span>
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 shrink-0">
                      <span className="font-mono text-sm font-black text-green-300">
                        ${Number(p.basePrice ?? p.price ?? 0).toFixed(2)}
                      </span>
                      <button
                        type="button"
                        onClick={() => addProductToQueue(p)}
                        className={`rounded-xl px-3 py-1.5 text-xs font-extrabold transition ${
                          inQueue
                            ? 'bg-purple-500/20 text-purple-300 hover:bg-purple-500 hover:text-white'
                            : 'bg-purple-600 text-white shadow-md shadow-purple-600/30 hover:bg-purple-500'
                        }`}
                      >
                        {inQueue ? `+1 ${t('Copy', 'ច្បាប់')}` : `+ ${t('Add', 'បន្ថែម')}`}
                      </button>
                    </div>
                  </div>
                )
              })
            )}
          </div>

          <div className="flex justify-end pt-2">
            <GhostButton onClick={() => setAddModalOpen(false)}>
              {t('Done', 'រួចរាល់')}
            </GhostButton>
          </div>
        </div>
      </Modal>

    </div>
  )
}

export default PrintLabelSection
