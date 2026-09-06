import { useEffect, useState } from 'react'
import * as XLSX from 'xlsx'
import { useLanguage } from '../../context/LanguageContext'
import { adminProductAPI, adminTransferAPI } from '../../api/api'
import { useCollection } from './stockStore'
import rocketIcon from '../../assets/icon/3dicons-rocket-dynamic-color.png'
import { SectionShell, PrimaryButton, GhostButton, Modal, Pill, ConfirmModal } from './stockUI'
import { exportStyledExcel } from '../../utils/excelExport'

// Identity column (Always shown)
const CODE_COL = { key: 'code', label: { en: 'Code', kh: 'កូដ' } }

// Optional columns that can be toggled in Choose Column modal
const OPTIONAL_COLS = [
  { key: 'date', label: { en: 'Date', kh: 'កាលបរិច្ឆេទ' } },
  { key: 'requestOutlet', label: { en: 'Request Outlet', kh: 'សាខាស្នើសុំ' } },
  { key: 'requestLocation', label: { en: 'Request Location', kh: 'ទីតាំងស្នើសុំ' } },
  { key: 'toOutlet', label: { en: 'To Outlet', kh: 'ទៅសាខា' } },
  { key: 'toLocation', label: { en: 'To Location', kh: 'ទៅទីតាំង' } },
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
            <span className="flex h-8 w-8 items-center justify-center rounded-lg text-sm ring-1 ring-slate-700 bg-purple-500/10">📦</span>
          )}
          <span className="text-slate-200">{desc}</span>
          {qty != null && <span className="font-mono text-xs font-bold text-green-300">×{qty}</span>}
        </span>
      )
    })}
  </span>
)

export const ShipRequestTransferSection = () => {
  const { lang } = useLanguage()
  const t = (en, kh) => (lang === 'en' ? en : kh)

  const [products, setProducts] = useState([])
  const [feedback, setFeedback] = useState(null)
  const [liveRequests, setLiveRequests] = useState([])
  const [loading, setLoading] = useState(false)

  // Filter tabs: 'ALL', 'PENDING', 'IN-TRANSIT', 'RECEIVED'
  const [activeTab, setActiveTab] = useState('ALL')
  const [confirmAction, setConfirmAction] = useState(null)

  // Search state
  const [searchQuery, setSearchQuery] = useState('')
  const [searchBy, setSearchBy] = useState('any')

  // Choose column state
  const [showColModal, setShowColModal] = useState(false)
  const [visibleCols, setVisibleCols] = useState(() => new Set(OPTIONAL_COLS.map((c) => c.key)))
  const [colDraft, setColDraft] = useState(visibleCols)

  // Dispatch / Ship Modal State
  const [selectedDoc, setSelectedDoc] = useState(null)
  const [carrier, setCarrier] = useState('B-Express Cold Van #04')
  const [trackingNumber, setTrackingNumber] = useState('')
  const [dispatchNote, setDispatchNote] = useState('')

  // Detail inspection modal
  const [inspectDoc, setInspectDoc] = useState(null)

  // Shared requests collection
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
    // Tab filter
    if (activeTab === 'PENDING' && r.status !== 'PENDING') return false
    if (activeTab === 'IN-TRANSIT' && r.status !== 'IN-TRANSIT') return false
    if (activeTab === 'RECEIVED' && r.status !== 'RECEIVED') return false

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
        if (c.key === 'date') return r.requestTransferDate || r.date || ''
        if (c.key === 'requestOutlet') return r.requestOutlet || r.fromLoc || ''
        if (c.key === 'requestLocation') return r.requestLocation || ''
        if (c.key === 'toOutlet') return r.toOutlet || r.toLoc || ''
        if (c.key === 'toLocation') return r.toLocation || ''
        if (c.key === 'reference') return r.reference || '—'
        if (c.key === 'products') return (r.lines || []).map((l) => `${l.name} (x${l.qty})`).join(', ')
        if (c.key === 'qty') return (r.lines || []).reduce((sum, l) => sum + (Number(l.qty) || 0), 0)
        if (c.key === 'userName') return r.userName || r.issuedBy || 'Staff'
        if (c.key === 'status') return r.status || 'PENDING'
        return r[c.key] ?? ''
      })
    )

    exportStyledExcel({
      filename: 'ship-request-transfer-list.xlsx',
      sheetName: 'Ship Requests',
      title: 'SHIP REQUEST TRANSFER DOCUMENTS REPORT',
      subtitle: `Total Documents: ${dataRows.length}`,
      headers: headerLabels,
      data: dataRows,
    })
  }

  /* ---------- Shipping & Status Actions ---------- */
  const openShipModal = (doc) => {
    setSelectedDoc(doc)
    setTrackingNumber(`TRK-${String(Date.now()).slice(-6)}`)
    setCarrier('B-Express Cold Logistics')
    setDispatchNote('')
  }

  const confirmShipment = async () => {
    if (!selectedDoc) return
    const docToShip = selectedDoc
    if (docToShip.id) {
      try {
        await adminTransferAPI.updateStatus(docToShip.id, {
          status: 'IN-TRANSIT',
          carrier,
          trackingNumber,
          dispatchNote,
        })
      } catch (e) {
        console.warn('Backend transfer status update failed, fallback to local', e)
      }
    }
    requestApi.update(docToShip.id, {
      status: 'IN-TRANSIT',
      shippedAt: new Date().toISOString(),
      carrier,
      trackingNumber,
      dispatchNote,
    })
    setLiveRequests((prev) =>
      prev.map((it) =>
        it.id === docToShip.id || it.code === docToShip.code
          ? { ...it, status: 'IN-TRANSIT', carrier, trackingNumber, dispatchNote }
          : it
      )
    )
    setFeedback({
      tone: 'blue',
      text: t(
        `✓ Request ${docToShip.code || docToShip.docNo} shipped via ${carrier} (Tracking: ${trackingNumber})`,
        `✓ បានដឹកជញ្ជូនសំណើ ${docToShip.code || docToShip.docNo} តាមរយៈ ${carrier} (លេខតាមដាន: ${trackingNumber})`
      ),
    })
    setSelectedDoc(null)
  }

  const markReceived = (doc) => {
    setConfirmAction({
      title: { en: 'Confirm Stock Receipt', kh: 'បញ្ជាក់ការទទួលស្តុក' },
      message: {
        en: `Are you sure you want to mark Request "${doc.code || doc.docNo}" as RECEIVED into destination stock?`,
        kh: `តើអ្នកពិតជាចង់បញ្ជាក់ការទទួលសំណើ "${doc.code || doc.docNo}" ចូលស្តុកសាខាគោលដៅមែនទេ?`,
      },
      confirmText: { en: 'Confirm Receipt', kh: 'យល់ព្រមទទួល' },
      cancelText: { en: 'Cancel', kh: 'បោះបង់' },
      type: 'save',
      onConfirm: async () => {
        setConfirmAction(null)
        if (doc.id) {
          try {
            await adminTransferAPI.updateStatus(doc.id, { status: 'RECEIVED' })
          } catch (e) {
            console.warn('Backend transfer status update failed, fallback to local', e)
          }
        }
        requestApi.update(doc.id, {
          status: 'RECEIVED',
          receivedAt: new Date().toISOString(),
        })
        setLiveRequests((prev) =>
          prev.map((it) => (it.id === doc.id || it.code === doc.code ? { ...it, status: 'RECEIVED' } : it))
        )
        setFeedback({
          tone: 'green',
          text: t(
            `✓ Request ${doc.code || doc.docNo} marked as RECEIVED into destination stock`,
            `✓ បានបញ្ជាក់ការទទួលសំណើ ${doc.code || doc.docNo} ចូលស្តុកគោលដៅ`
          ),
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

  const handleDelete = (docId, codeStr) => {
    setConfirmAction({
      title: { en: 'Delete Transfer Request', kh: 'លុបសំណើផ្ទេរទំនិញ' },
      message: {
        en: `Are you sure you want to delete Transfer Request "${codeStr}"? This action cannot be undone.`,
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
            console.warn('Backend transfer delete failed, fallback to local', e)
          }
        }
        requestApi.remove(docId)
        setLiveRequests((prev) => prev.filter((it) => it.id !== docId && it.code !== codeStr))
        setFeedback({
          tone: 'orange',
          text: t(`✓ Transfer request ${codeStr} deleted`, `✓ បានលុបសំណើផ្ទេរ ${codeStr}`),
        })
      },
    })
  }

  // Bulk ship all pending
  const pendingCount = requests.filter((r) => r.status === 'PENDING').length
  const transitCount = requests.filter((r) => r.status === 'IN-TRANSIT').length
  const receivedCount = requests.filter((r) => r.status === 'RECEIVED').length

  const shipAllPending = () => {
    const pendingList = requests.filter((r) => r.status === 'PENDING')
    if (pendingList.length === 0) return
    setConfirmAction({
      title: { en: 'Ship All Pending Requests', kh: 'បញ្ជូនសំណើទាំងអស់ដែលរង់ចាំ' },
      message: {
        en: `Are you sure you want to dispatch all ${pendingList.length} pending transfer request(s)?`,
        kh: `តើអ្នកពិតជាចង់បញ្ជូនសំណើផ្ទេរទំនិញចំនួន ${pendingList.length} ដែលកំពុងរង់ចាំមែនទេ?`,
      },
      confirmText: { en: 'Confirm & Dispatch', kh: 'យល់ព្រមបញ្ជូន' },
      cancelText: { en: 'Cancel', kh: 'បោះបង់' },
      type: 'save',
      onConfirm: async () => {
        try {
          await adminTransferAPI.shipBulk({
            carrier: 'B-Express Cold Logistics',
            dispatchNote: 'Bulk dispatched from fulfillment hub',
          })
        } catch (e) {
          console.warn('Backend bulk ship failed, fallback to local', e)
        }
        pendingList.forEach((r) => {
          requestApi.update(r.id, {
            status: 'IN-TRANSIT',
            shippedAt: new Date().toISOString(),
          })
        })
        setLiveRequests((prev) =>
          prev.map((it) => (it.status === 'PENDING' ? { ...it, status: 'IN-TRANSIT' } : it))
        )
        setFeedback({
          tone: 'blue',
          text: t(
            `✓ ${pendingList.length} transfer request(s) marked In-Transit`,
            `✓ ${pendingList.length} សំណើផ្ទេរត្រូវបានសម្គាល់ជាកំពុងដឹកជញ្ជូន`
          ),
        })
      },
    })
  }

  const activeColumns = [CODE_COL, ...OPTIONAL_COLS.filter((c) => visibleCols.has(c.key))]

  return (
    <SectionShell
      icon={rocketIcon}
      color="#8b5cf6"
      title={{ en: 'Ship & Request Transfer Products', kh: 'ដឹកជញ្ជូន និងសំណើផ្ទេរផលិតផល' }}
      subtitle={{
        en: 'Pick, dispatch and track stock transfer shipments across retail outlets and fulfillment centers.',
        kh: 'រៀបចំទំនិញ ដឹកជញ្ជូន និងតាមដានការផ្ទេរស្តុករវាងសាខាហាង និងឃ្លាំងស្តុក។',
      }}
      actions={
        pendingCount > 0 && (
          <PrimaryButton onClick={shipAllPending}>
            🚀 {t(`Ship All Pending (${pendingCount})`, `ដឹកជញ្ជូនទាំងអស់ (${pendingCount})`)}
          </PrimaryButton>
        )
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
      {/* Toast Feedback */}
      {feedback && (
        <div className={`flex items-center justify-between rounded-xl border px-4 py-3 text-sm font-semibold ${
          feedback.tone === 'green' ? 'border-green-500/40 bg-green-500/10 text-green-300' :
          feedback.tone === 'blue' ? 'border-sky-500/40 bg-sky-500/10 text-sky-300' :
          'border-orange-500/40 bg-orange-500/10 text-amber-300'
        }`}>
          <span>{feedback.text}</span>
          <button type="button" onClick={() => setFeedback(null)} className="text-xs opacity-70 hover:opacity-100">✕</button>
        </div>
      )}

      {/* ---------- Status Tabs ---------- */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-700/60 pb-3">
        {[
          { key: 'ALL', label: t('All Transfers', 'ទាំងអស់'), count: requests.length },
          { key: 'PENDING', label: t('Pending Dispatch', 'រង់ចាំដឹកជញ្ជូន'), count: pendingCount, tone: 'orange' },
          { key: 'IN-TRANSIT', label: t('In-Transit', 'កំពុងដឹកជញ្ជូន'), count: transitCount, tone: 'blue' },
          { key: 'RECEIVED', label: t('Delivered & Received', 'បានទទួល'), count: receivedCount, tone: 'green' },
        ].map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setActiveTab(tab.key)}
            className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-extrabold transition ${
              activeTab === tab.key
                ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/30 ring-2 ring-purple-400/50'
                : 'border border-slate-700/80 bg-slate-900/80 text-slate-400 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <span>{tab.label}</span>
            <span className="rounded-full bg-black/30 px-2 py-0.5 font-mono text-[11px] font-bold text-slate-200">
              {tab.count}
            </span>
          </button>
        ))}
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
                placeholder={t('Search Request Transfer (Code, Outlet, User, Product)...', 'ស្វែងរកសំណើផ្ទេរ (កូដ សាខា អ្នកស្នើសុំ ផលិតផល)...')}
                className="w-full rounded-xl border border-slate-700/70 bg-slate-950/60 py-2.5 pl-10 pr-8 text-sm text-white placeholder-slate-500 outline-none transition focus:border-purple-400 focus:ring-4 focus:ring-purple-500/10"
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
                className="rounded-xl border border-slate-700/70 bg-slate-950/60 px-3 py-2.5 text-xs font-bold text-slate-200 outline-none focus:border-purple-400"
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
                    <span className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-slate-800 text-2xl">🛫</span>
                    <p className="text-sm font-semibold">{t('No transfer requests found for this filter.', 'មិនមានសំណើផ្ទេរទំនិញត្រូវបានរកឃើញទេ។')}</p>
                    <p className="text-xs text-slate-500 mt-1">
                      {t('New requests created under Request Transfer Products will appear here for dispatch.', 'សំណើថ្មីដែលបានបង្កើតនឹងបង្ហាញនៅទីនេះដើម្បីរៀបចំដឹកជញ្ជូន។')}
                    </p>
                  </td>
                </tr>
              ) : (
                filteredRequests.map((r) => {
                  const isPending = r.status === 'PENDING'
                  const isTransit = r.status === 'IN-TRANSIT'
                  const isReceived = r.status === 'RECEIVED'

                  return (
                    <tr key={r.id} className="border-b border-slate-800/60 transition hover:bg-slate-800/40">
                      
                      {/* Code */}
                      <td className="px-4 py-3">
                        <button
                          type="button"
                          onClick={() => setInspectDoc(r)}
                          className="font-mono text-xs font-bold text-purple-400 hover:text-purple-300 hover:underline"
                        >
                          {r.code || r.docNo || '—'}
                        </button>
                      </td>

                      {/* Date */}
                      {visibleCols.has('date') && (
                        <td className="px-4 py-3 text-slate-300">
                          {r.requestTransferDate || r.date || '—'}
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
                            title={t('Click to cycle status', 'ចុចដើម្បីប្តូរស្ថានភាព')}
                          >
                            <Pill tone={
                              isReceived ? 'green' :
                              isTransit ? 'blue' :
                              r.status === 'CANCELLED' ? 'slate' : 'orange'
                            }>
                              {r.status || 'PENDING'} ↻
                            </Pill>
                          </button>
                        </td>
                      )}

                      {/* Action Buttons */}
                      <td className="px-4 py-3 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          {isPending && (
                            <button
                              type="button"
                              onClick={() => openShipModal(r)}
                              className="inline-flex items-center gap-1 rounded-lg bg-purple-600/20 px-2.5 py-1 text-xs font-bold text-purple-300 transition hover:bg-purple-600 hover:text-white"
                              title={t('Pick & Ship items', 'រៀបចំទំនិញ និងដឹកជញ្ជូន')}
                            >
                              🛫 {t('Ship', 'ដឹកជញ្ជូន')}
                            </button>
                          )}

                          {isTransit && (
                            <button
                              type="button"
                              onClick={() => markReceived(r)}
                              className="inline-flex items-center gap-1 rounded-lg bg-emerald-600/20 px-2.5 py-1 text-xs font-bold text-emerald-300 transition hover:bg-emerald-600 hover:text-white"
                              title={t('Confirm receipt into destination stock', 'បញ្ជាក់ការទទួលចូលស្តុក')}
                            >
                              📥 {t('Receive', 'ទទួល')}
                            </button>
                          )}

                          <button
                            type="button"
                            onClick={() => setInspectDoc(r)}
                            className="rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-800 hover:text-slate-200"
                            title={t('View details', 'មើលព័ត៌មានលម្អិត')}
                          >
                            👁️
                          </button>

                          <button
                            type="button"
                            onClick={() => handleDelete(r.id, r.code || r.docNo)}
                            className="rounded-lg p-1.5 text-slate-400 transition hover:bg-red-500/20 hover:text-red-300"
                            title={t('Delete request', 'លុបសំណើ')}
                          >
                            🗑️
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
            {t('Toggle visibility of columns for Ship & Request Transfer Products table.', 'បិទ/បើក ការបង្ហាញជួរឈរក្នុងតារាងដឹកជញ្ជូនសំណើផ្ទេរ។')}
          </p>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {/* Code is always enabled */}
            <label className="flex items-center gap-3 rounded-xl border border-slate-700/80 bg-slate-950/60 p-3 opacity-60">
              <input type="checkbox" checked disabled className="rounded text-purple-500" />
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
                  className="rounded text-purple-500 focus:ring-purple-500"
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
                className="text-xs font-bold text-purple-400 hover:underline"
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

      {/* ---------- Ship / Dispatch Modal ---------- */}
      {selectedDoc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-2xl border border-purple-500/50 bg-slate-900 p-6 shadow-2xl">
            <div className="mb-4 flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-500/20 text-xl text-purple-300">🛫</span>
                <div>
                  <h4 className="text-base font-extrabold text-white">{t('Dispatch & Ship Transfer', 'ដឹកជញ្ជូនសំណើផ្ទេរ')}</h4>
                  <p className="font-mono text-xs text-purple-300">{selectedDoc.code || selectedDoc.docNo}</p>
                </div>
              </div>
              <button type="button" onClick={() => setSelectedDoc(null)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <div className="space-y-4">
              <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-3 text-xs text-slate-300">
                <p><strong>{t('Route:', 'ផ្លូវដឹកជញ្ជូន:')}</strong> {selectedDoc.requestOutlet || selectedDoc.fromLoc} ➔ {selectedDoc.toOutlet || selectedDoc.toLoc}</p>
                <p className="mt-1"><strong>{t('Items:', 'ទំនិញ:')}</strong> {(selectedDoc.lines || []).map((l) => `${l.name} (x${l.qty})`).join(', ')}</p>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wide text-slate-400 mb-1">
                  {t('Carrier / Logistics Courier', 'ក្រុមហ៊ុនដឹកជញ្ជូន / អ្នកដឹក')}
                </label>
                <select
                  value={carrier}
                  onChange={(e) => setCarrier(e.target.value)}
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white outline-none focus:border-purple-400"
                >
                  <option value="B-Express Cold Logistics">B-Express Cold Logistics (4°C Reefer)</option>
                  <option value="Direct Branch Van #01">Direct Branch Van #01</option>
                  <option value="Inter-City Express Courier">Inter-City Express Courier</option>
                  <option value="Internal Staff Transfer">Internal Staff Transfer</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wide text-slate-400 mb-1">
                  {t('Tracking Number / Dispatch Code', 'លេខតាមដាន / កូដបញ្ជូន')}
                </label>
                <input
                  type="text"
                  value={trackingNumber}
                  onChange={(e) => setTrackingNumber(e.target.value)}
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 font-mono text-sm text-green-300 outline-none focus:border-purple-400"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wide text-slate-400 mb-1">
                  {t('Dispatch Note / Remarks', 'ចំណាំការដឹកជញ្ជូន')}
                </label>
                <textarea
                  rows={2}
                  value={dispatchNote}
                  onChange={(e) => setDispatchNote(e.target.value)}
                  placeholder={t('Driver temperature locked, seal #8812...', 'សីតុណ្ហភាពត្រជាក់ជាប់កំណត់...')}
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white outline-none focus:border-purple-400"
                />
              </div>
            </div>

            <div className="mt-6 flex items-center justify-end gap-3 border-t border-slate-800 pt-4">
              <GhostButton onClick={() => setSelectedDoc(null)}>{t('Cancel', 'បោះបង់')}</GhostButton>
              <button
                type="button"
                onClick={confirmShipment}
                className="inline-flex items-center gap-2 rounded-xl bg-purple-600 px-4 py-2 text-sm font-bold text-white shadow-lg shadow-purple-600/30 transition hover:bg-purple-500"
              >
                🛫 {t('Confirm & Mark In-Transit', 'បញ្ជាក់ និងដាក់ជាកំពុងដឹកជញ្ជូន')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ---------- Details Inspection Modal ---------- */}
      {inspectDoc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
          <div className="w-full max-w-xl rounded-2xl border border-slate-700 bg-slate-900 p-6 shadow-2xl">
            <div className="mb-4 flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-800 text-xl">📋</span>
                <div>
                  <h4 className="text-base font-extrabold text-white">{t('Transfer Request Details', 'ព័ត៌មានលម្អិតសំណើផ្ទេរ')}</h4>
                  <p className="font-mono text-xs text-purple-300">{inspectDoc.code || inspectDoc.docNo}</p>
                </div>
              </div>
              <button type="button" onClick={() => setInspectDoc(null)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <div className="space-y-3 text-xs text-slate-300">
              <div className="grid grid-cols-2 gap-3 rounded-xl border border-slate-800 bg-slate-950/60 p-3">
                <div><span className="text-slate-500">{t('Date:', 'កាលបរិច្ឆេទ:')}</span> {inspectDoc.requestTransferDate || inspectDoc.date || '—'}</div>
                <div><span className="text-slate-500">{t('Status:', 'ស្ថានភាព:')}</span> <strong className="text-white">{inspectDoc.status}</strong></div>
                <div><span className="text-slate-500">{t('From:', 'ពី:')}</span> {inspectDoc.requestOutlet || inspectDoc.fromLoc} ({inspectDoc.requestLocation || 'Main'})</div>
                <div><span className="text-slate-500">{t('To:', 'ទៅ:')}</span> {inspectDoc.toOutlet || inspectDoc.toLoc} ({inspectDoc.toLocation || 'Display'})</div>
                <div><span className="text-slate-500">{t('Reference:', 'យោង:')}</span> {inspectDoc.reference || '—'}</div>
                <div><span className="text-slate-500">{t('Requested By:', 'អ្នកស្នើសុំ:')}</span> {inspectDoc.userName || inspectDoc.issuedBy || 'Staff'}</div>
                {inspectDoc.carrier && <div className="col-span-2"><span className="text-slate-500">{t('Carrier:', 'ក្រុមហ៊ុនដឹក:')}</span> {inspectDoc.carrier} (Tracking: {inspectDoc.trackingNumber})</div>}
              </div>

              <div className="mt-4">
                <h5 className="font-bold uppercase tracking-wider text-slate-400 mb-2">{t('Product Items', 'មុខទំនិញ')}</h5>
                <ul className="space-y-1.5 max-h-48 overflow-y-auto">
                  {(inspectDoc.lines || []).map((l, i) => (
                    <li key={i} className="flex items-center justify-between rounded-lg bg-slate-800/60 px-3 py-2">
                      <span className="font-semibold text-white">{l.name}</span>
                      <span className="font-mono text-xs text-green-300">×{l.qty} {l.uom || 'Kg'}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="mt-6 flex justify-end">
              <GhostButton onClick={() => setInspectDoc(null)}>{t('Close', 'បិទ')}</GhostButton>
            </div>
          </div>
        </div>
      )}

      {/* ---------- Confirm Action Modal Dialog ---------- */}
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

    </SectionShell>
  )
}

export default ShipRequestTransferSection
