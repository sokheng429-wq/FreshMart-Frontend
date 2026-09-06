import { useEffect, useState } from 'react'
import * as XLSX from 'xlsx'
import { useLanguage } from '../../context/LanguageContext'
import { adminProductAPI, adminTransferAPI } from '../../api/api'
import { useCollection } from './stockStore'
import { PageLoader } from '../../components/PageLoader'
import RequestTransferCreate from './RequestTransferCreate'
import mailIcon from '../../assets/icon/3dicons-mail-dynamic-color.png'
import { SectionShell, PrimaryButton, GhostButton, Modal, Pill, ConfirmModal } from './stockUI'
import { exportStyledExcel } from '../../utils/excelExport'

// Identity column (Always shown)
const CODE_COL = { key: 'code', label: { en: 'Code', kh: 'កូដ' } }

// Optional columns that can be toggled in Choose Column modal
const OPTIONAL_COLS = [
  { key: 'requestTransferDate', label: { en: 'Request Transfer Date', kh: 'កាលបរិច្ឆេទស្នើសុំផ្ទេរ' } },
  { key: 'requiredDate', label: { en: 'Required Date', kh: 'កាលបរិច្ឆេទត្រូវការ' } },
  { key: 'requestOutlet', label: { en: 'Request Outlet', kh: 'សាខាស្នើសុំ' } },
  { key: 'requestLocation', label: { en: 'Request Location', kh: 'ទីតាំងស្នើសុំ' } },
  { key: 'toOutlet', label: { en: 'To Outlet', kh: 'ទៅសាខា' } },
  { key: 'toLocation', label: { en: 'To Location', kh: 'ទៅទីតាំង' } },
  { key: 'requestTransferType', label: { en: 'Request Transfer Type', kh: 'ប្រភេទសំណើផ្ទេរ' } },
  { key: 'reference', label: { en: 'Reference', kh: 'យោង' } },
  { key: 'products', label: { en: 'Products', kh: 'ផលិតផល' } },
  { key: 'qty', label: { en: 'Total Qty', kh: 'បរិមាណសរុប' } },
  { key: 'userName', label: { en: 'User Name', kh: 'ឈ្មោះអ្នកស្នើសុំ' } },
  { key: 'status', label: { en: 'Status', kh: 'ស្ថានភាព' } },
]

// Product thumbnail chips
const ProductChips = ({ lines, products }) => (
  <span className="flex max-w-[320px] flex-wrap items-center gap-x-4 gap-y-1.5">
    {(lines || []).length === 0 && <span className="text-slate-500">—</span>}
    {(lines || []).map((l, i) => {
      const p = products.find((x) => String(x.id) === String(l.productId))
      const img = l.imageUrl || (p && typeof p.imageUrl === 'string' && !p.imageUrl.startsWith('blob:') ? p.imageUrl : '')
      const desc = l.name || (typeof p?.name === 'object' ? p.name?.en : p?.name) || `#${l.productId}`
      const qty = l.qty
      return (
        <span key={i} className="inline-flex items-center gap-2" title={`${desc} × ${qty} ${l.uom || ''}`}>
          {img ? (
            <img src={img} alt="" className="h-8 w-8 rounded-lg object-cover ring-1 ring-slate-700" onError={(e) => { e.currentTarget.style.display = 'none' }} />
          ) : (
            <span className="flex h-8 w-8 items-center justify-center rounded-lg text-sm ring-1 ring-slate-700 bg-emerald-500/10">🥫</span>
          )}
          <span className="text-slate-200">{desc}</span>
          {qty != null && <span className="font-mono text-xs font-bold text-green-300">×{qty}</span>}
        </span>
      )
    })}
  </span>
)

export const RequestTransferSection = () => {
  const { lang } = useLanguage()
  const t = (en, kh) => (lang === 'en' ? en : kh)

  const [products, setProducts] = useState([])
  const [showCreatePage, setShowCreatePage] = useState(false)
  const [feedback, setFeedback] = useState(null)
  const [confirmAction, setConfirmAction] = useState(null)
  const [liveRequests, setLiveRequests] = useState([])
  const [loading, setLoading] = useState(false)

  // Search state
  const [searchQuery, setSearchQuery] = useState('')
  const [searchBy, setSearchBy] = useState('any')

  // Choose column state
  const [showColModal, setShowColModal] = useState(false)
  const [visibleCols, setVisibleCols] = useState(() => new Set(OPTIONAL_COLS.map((c) => c.key)))
  const [colDraft, setColDraft] = useState(visibleCols)

  // Local storage collection as cache fallback
  const [localRequests, requestApi] = useCollection('tr-requests')

  const loadData = async () => {
    setLoading(true)
    try {
      const [pRes, tRes] = await Promise.allSettled([
        adminProductAPI.getAll(),
        adminTransferAPI.getAll({ docType: 'REQUEST' }),
      ])
      if (pRes.status === 'fulfilled' && Array.isArray(pRes.value?.data)) {
        setProducts(pRes.value.data)
      }
      if (tRes.status === 'fulfilled' && Array.isArray(tRes.value?.data)) {
        setLiveRequests(tRes.value.data)
      } else {
        setLiveRequests(localRequests)
      }
    } catch {
      setLiveRequests(localRequests)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const requests = liveRequests.length > 0 ? liveRequests : localRequests

  /* ---------- Filtering ---------- */
  const q = searchQuery.trim().toLowerCase()
  const filteredRequests = requests.filter((r) => {
    if (!q) return true
    const codeStr = String(r.code || r.docNo || '').toLowerCase()
    const outletStr = String(r.requestOutlet || r.fromOutlet || r.fromLoc || '').toLowerCase()
    const toOutletStr = String(r.toOutlet || r.toLoc || '').toLowerCase()
    const userStr = String(r.userName || r.issuedBy || '').toLowerCase()
    const typeStr = String(r.requestTransferType || r.transferType || '').toLowerCase()
    const refStr = String(r.reference || '').toLowerCase()

    if (searchBy === 'code') return codeStr.includes(q)
    if (searchBy === 'requestOutlet') return outletStr.includes(q)
    if (searchBy === 'userName') return userStr.includes(q)

    // 'any'
    return (
      codeStr.includes(q) ||
      outletStr.includes(q) ||
      toOutletStr.includes(q) ||
      userStr.includes(q) ||
      typeStr.includes(q) ||
      refStr.includes(q) ||
      (r.lines || []).some((l) => String(l.name || '').toLowerCase().includes(q) || String(l.code || '').toLowerCase().includes(q))
    )
  })

  /* ---------- Choose Column Handler ---------- */
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
    setColDraft(new Set(OPTIONAL_COLS.map((c) => c.key)))
  }

  /* ---------- Excel Export ---------- */
  const exportExcel = () => {
    const activeOptional = OPTIONAL_COLS.filter((c) => visibleCols.has(c.key))
    const allCols = [CODE_COL, ...activeOptional]

    const headerLabels = allCols.map((c) => c.label.en)
    const dataRows = filteredRequests.map((r) =>
      allCols.map((c) => {
        if (c.key === 'code') return r.code || r.docNo || ''
        if (c.key === 'requestTransferDate') return r.requestTransferDate || r.transferDate || r.date || ''
        if (c.key === 'requiredDate') return r.requiredDate || '—'
        if (c.key === 'requestOutlet') return r.requestOutlet || r.fromOutlet || r.fromLoc || ''
        if (c.key === 'requestLocation') return r.requestLocation || r.fromLocation || ''
        if (c.key === 'toOutlet') return r.toOutlet || r.toLoc || ''
        if (c.key === 'toLocation') return r.toLocation || ''
        if (c.key === 'requestTransferType') return r.requestTransferType || r.transferType || 'Standard Transfer'
        if (c.key === 'reference') return r.reference || '—'
        if (c.key === 'products') return (r.lines || []).map((l) => `${l.name} (x${l.qty})`).join(', ')
        if (c.key === 'qty') return (r.lines || []).reduce((sum, l) => sum + (Number(l.qty) || 0), 0)
        if (c.key === 'userName') return r.userName || r.issuedBy || 'Staff'
        if (c.key === 'status') return r.status || 'PENDING'
        return r[c.key] ?? ''
      })
    )

    exportStyledExcel({
      filename: 'request-transfer-products-list.xlsx',
      sheetName: 'Request Transfers',
      title: 'REQUEST TRANSFER DOCUMENTS REPORT',
      subtitle: `Total Requests: ${dataRows.length}`,
      headers: headerLabels,
      data: dataRows,
    })
  }

  /* ---------- Save Callback from Create Page ---------- */
  const handleCreated = (newDoc) => {
    requestApi.add(newDoc)
    setLiveRequests((prev) => [newDoc, ...prev.filter((it) => it.id !== newDoc.id && it.code !== newDoc.code)])
    setShowCreatePage(false)
    setFeedback({
      tone: 'green',
      text: t(`✓ Request Transfer ${newDoc.code} created successfully`, `✓ បានបង្កើតសំណើផ្ទេរទំនិញ ${newDoc.code} ជោគជ័យ`),
    })
  }

  /* ---------- Delete / Status Updates ---------- */
  const handleDelete = (docId, codeStr) => {
    setConfirmAction({
      title: { en: 'Delete Request Transfer', kh: 'លុបសំណើផ្ទេរទំនិញ' },
      message: {
        en: `Are you sure you want to delete Request Transfer "${codeStr}"? This action cannot be undone.`,
        kh: `តើអ្នកពិតជាចង់លុបសំណើផ្ទេរ "${codeStr}" មែនទេ? សកម្មភាពនេះមិនអាចត្រឡប់វិញបានទេ។`,
      },
      confirmText: { en: 'Confirm Delete', kh: 'យល់ព្រមលុប' },
      cancelText: { en: 'Cancel', kh: 'បោះបង់' },
      type: 'danger',
      onConfirm: async () => {
        if (docId) {
          try {
            await adminTransferAPI.delete(docId)
          } catch (e) {
            console.warn('Backend transfer delete failed, falling back to local', e)
          }
        }
        requestApi.remove(docId)
        setLiveRequests((prev) => prev.filter((it) => it.id !== docId && it.code !== codeStr))
        setFeedback({
          tone: 'orange',
          text: t(`✓ Request Transfer ${codeStr} deleted`, `✓ បានលុបសំណើផ្ទេរ ${codeStr}`),
        })
      },
    })
  }

  const cycleStatus = async (r) => {
    const nextStatusMap = {
      PENDING: 'IN-TRANSIT',
      'IN-TRANSIT': 'RECEIVED',
      RECEIVED: 'PENDING',
      CANCELLED: 'PENDING',
    }
    const next = nextStatusMap[r.status] || 'PENDING'
    if (r.id) {
      try {
        await adminTransferAPI.updateStatus(r.id, { status: next })
      } catch (e) {
        console.warn('Backend transfer status update failed, fallback to local', e)
      }
    }
    requestApi.update(r.id, { status: next })
    setLiveRequests((prev) => prev.map((it) => (it.id === r.id ? { ...it, status: next } : it)))
  }

  if (showCreatePage) {
    return (
      <RequestTransferCreate
        products={products}
        onCreated={handleCreated}
        onClose={() => setShowCreatePage(false)}
      />
    )
  }

  const activeColumns = [CODE_COL, ...OPTIONAL_COLS.filter((c) => visibleCols.has(c.key))]

  return (
    <PageLoader loading={loading} message={lang === 'en' ? 'Loading transfers…' : 'កំពុងផ្ទុកទិន្នន័យ…'}>
    <SectionShell
      icon={mailIcon}
      color="#06b6d4"
      title={{ en: 'Request Transfer Products', kh: 'សំណើផ្ទេរផលិតផល' }}
      subtitle={{
        en: 'Manage stock transfer requests across retail outlets and warehouses.',
        kh: 'គ្រប់គ្រងសំណើផ្ទេរស្តុកទំនិញរវាងសាខាហាង និងឃ្លាំងស្តុក។',
      }}
      actions={
        <PrimaryButton onClick={() => setShowCreatePage(true)}>
          + {t('Create', 'បង្កើត')}
        </PrimaryButton>
      }
    >
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

      {/* Toast Feedback */}
      {feedback && (
        <div className={`flex items-center justify-between rounded-xl border px-4 py-3 text-sm font-semibold ${
          feedback.tone === 'green' ? 'border-green-500/40 bg-green-500/10 text-green-300' : 'border-orange-500/40 bg-orange-500/10 text-amber-300'
        }`}>
          <span>{feedback.text}</span>
          <button type="button" onClick={() => setFeedback(null)} className="text-xs opacity-70 hover:opacity-100">✕</button>
        </div>
      )}

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
                placeholder={t('Search Request Transfer (Code, Outlet, User, Product)...', 'ស្វែងរកសំណើផ្ទេរ (កូដ សាខា អ្នកស្នើសុំ ផលិតផល)...')}
                className="w-full rounded-xl border border-slate-700/70 bg-slate-950/60 py-2.5 pl-10 pr-8 text-sm text-white placeholder-slate-500 outline-none transition focus:border-green-400 focus:ring-4 focus:ring-green-500/10"
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

            {/* Search By: Any | Code | Request Outlet | User Name */}
            <div className="flex items-center gap-2">
              <span className="whitespace-nowrap text-xs font-bold uppercase tracking-wide text-slate-400">
                {t('Search By:', 'ស្វែងរកតាម:')}
              </span>
              <select
                value={searchBy}
                onChange={(e) => setSearchBy(e.target.value)}
                className="rounded-xl border border-slate-700/70 bg-slate-950/60 px-3 py-2.5 text-xs font-bold text-slate-200 outline-none focus:border-green-400"
              >
                <option value="any">{t('Any', 'ទាំងអស់')}</option>
                <option value="code">{t('Code', 'កូដ')}</option>
                <option value="requestOutlet">{t('Request Outlet', 'សាខាស្នើសុំ')}</option>
                <option value="userName">{t('User Name', 'ឈ្មោះអ្នកស្នើសុំ')}</option>
              </select>
            </div>

          </div>

          {/* Right: Choose Column + Export Excel */}
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

      {/* ---------- Request Transfer List Table ---------- */}
      <section className="overflow-hidden rounded-2xl border border-slate-700/60 bg-slate-900/80 shadow-xl shadow-black/20">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-700/60 bg-slate-800/50 text-xs font-bold uppercase tracking-wide text-slate-400">
                {activeColumns.map((c) => (
                  <th key={c.key} className="whitespace-nowrap px-4 py-3.5">{c.label[lang]}</th>
                ))}
                <th className="whitespace-nowrap px-4 py-3.5 text-center">{t('Action', 'សកម្មភាព')}</th>
              </tr>
            </thead>
            <tbody>
              {filteredRequests.length === 0 ? (
                <tr>
                  <td colSpan={activeColumns.length + 1} className="px-4 py-16 text-center text-slate-400">
                    <span className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-slate-800 text-2xl">📨</span>
                    <p className="text-sm font-semibold">{t('No request transfers found.', 'មិនមានសំណើផ្ទេរទំនិញត្រូវបានរកឃើញទេ។')}</p>
                    <p className="text-xs text-slate-500 mt-1">
                      {t('Click "+ Create" to start your first transfer request.', 'ចុច "+ បង្កើត" ដើម្បីចាប់ផ្តើមសំណើផ្ទេរដំបូង។')}
                    </p>
                  </td>
                </tr>
              ) : (
                filteredRequests.map((r) => (
                  <tr key={r.id} className="border-b border-slate-800/60 transition hover:bg-slate-800/40">
                    
                    {/* Code */}
                    <td className="px-4 py-3 font-mono text-xs font-bold text-green-300">
                      {r.code || r.docNo || '—'}
                    </td>

                    {/* Request Transfer Date */}
                    {visibleCols.has('requestTransferDate') && (
                      <td className="px-4 py-3 text-slate-300">
                        {r.requestTransferDate || r.date || '—'}
                      </td>
                    )}

                    {/* Required Date */}
                    {visibleCols.has('requiredDate') && (
                      <td className="px-4 py-3 font-medium text-amber-300/90">
                        {r.requiredDate || '—'}
                      </td>
                    )}

                    {/* Request Outlet */}
                    {visibleCols.has('requestOutlet') && (
                      <td className="px-4 py-3 font-medium text-white">
                        {r.requestOutlet || r.fromLoc || 'Main Warehouse'}
                      </td>
                    )}

                    {/* Request Location */}
                    {visibleCols.has('requestLocation') && (
                      <td className="px-4 py-3 text-slate-300">
                        {r.requestLocation || '—'}
                      </td>
                    )}

                    {/* To Outlet */}
                    {visibleCols.has('toOutlet') && (
                      <td className="px-4 py-3 font-medium text-white">
                        {r.toOutlet || r.toLoc || '—'}
                      </td>
                    )}

                    {/* To Location */}
                    {visibleCols.has('toLocation') && (
                      <td className="px-4 py-3 text-slate-300">
                        {r.toLocation || '—'}
                      </td>
                    )}

                    {/* Request Transfer Type */}
                    {visibleCols.has('requestTransferType') && (
                      <td className="px-4 py-3">
                        <span className="inline-block rounded-md bg-slate-800 px-2 py-0.5 text-xs font-semibold text-slate-200">
                          {r.requestTransferType || 'Standard Transfer'}
                        </span>
                      </td>
                    )}

                    {/* Reference */}
                    {visibleCols.has('reference') && (
                      <td className="px-4 py-3 font-mono text-xs text-slate-400">
                        {r.reference || '—'}
                      </td>
                    )}

                    {/* Products */}
                    {visibleCols.has('products') && (
                      <td className="px-4 py-3">
                        <ProductChips lines={r.lines} products={products} />
                      </td>
                    )}

                    {/* Total Qty */}
                    {visibleCols.has('qty') && (
                      <td className="px-4 py-3 font-mono font-bold text-white">
                        {(r.lines || []).reduce((sum, l) => sum + (Number(l.qty) || 0), 0)}
                        <span className="ml-1 text-xs font-normal text-slate-500">{t('items', 'ទំនិញ')}</span>
                      </td>
                    )}

                    {/* User Name */}
                    {visibleCols.has('userName') && (
                      <td className="px-4 py-3 font-medium text-slate-300">
                        {r.userName || r.issuedBy || 'Staff'}
                      </td>
                    )}

                    {/* Status */}
                    {visibleCols.has('status') && (
                      <td className="px-4 py-3">
                        <button
                          type="button"
                          onClick={() => cycleStatus(r)}
                          title={t('Click to advance status', 'ចុចដើម្បីប្តូរស្ថានភាព')}
                        >
                          <Pill tone={
                            r.status === 'RECEIVED' ? 'green' :
                            r.status === 'IN-TRANSIT' ? 'blue' :
                            r.status === 'CANCELLED' ? 'slate' : 'orange'
                          }>
                            {r.status || 'PENDING'} ↻
                          </Pill>
                        </button>
                      </td>
                    )}

                    {/* Action */}
                    <td className="px-4 py-3 text-center">
                      <button
                        type="button"
                        onClick={() => handleDelete(r.id, r.code || r.docNo)}
                        className="rounded-lg p-1.5 text-slate-400 transition hover:bg-red-500/20 hover:text-red-300"
                        title={t('Delete Request Transfer', 'លុបសំណើផ្ទេរ')}
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
            {t('Toggle visibility of columns for Request Transfer Products table.', 'បិទ/បើក ការបង្ហាញជួរឈរក្នុងតារាងសំណើផ្ទេរទំនិញ។')}
          </p>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {/* Code is always enabled */}
            <label className="flex items-center gap-3 rounded-xl border border-slate-700/80 bg-slate-950/60 p-3 opacity-60">
              <input type="checkbox" checked disabled className="rounded text-green-500" />
              <span className="text-xs font-bold text-white">{CODE_COL.label[lang]} ({t('Always on', 'ថេរ')})</span>
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
                  className="rounded text-green-500 focus:ring-green-500"
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
                className="text-xs font-bold text-green-400 hover:underline"
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

export default RequestTransferSection
