import { useEffect, useState } from 'react'
import * as XLSX from 'xlsx'
import { useLanguage } from '../../context/LanguageContext'
import { adminProductAPI, adminStockDocAPI } from '../../api/api'
import { PageLoader } from '../../components/PageLoader'
import { useCollection, LOCATIONS } from './stockStore'
import ReceiveProductsCreate from './ReceiveProductsCreate'
import TransactionDocCreate from './TransactionDocCreate'
import fileNewIcon from '../../assets/icon/3dicons-file-new-dynamic-color.png'
import callOutIcon from '../../assets/icon/3dicons-call-out-dynamic-color.png'
import toolsIcon from '../../assets/icon/3dicons-tools-dynamic-color.png'
import mailIcon from '../../assets/icon/3dicons-mail-dynamic-color.png'
import rocketIcon from '../../assets/icon/3dicons-rocket-dynamic-color.png'
import travelIcon from '../../assets/icon/3dicons-travel-dynamic-color.png'
import { SectionShell, PrimaryButton, Modal, DataTable, Pill } from './stockUI'
import { exportStyledExcel } from '../../utils/excelExport'
import './TransactionSection.css'

const ORANGE = '#FF9900'

// Per-operation configuration.
const OPS = {
  'receive-products': {
    icon: fileNewIcon, color: '#22c55e', kind: 'receive',
    title: { en: 'Receive Products', kh: 'ទទួលទំនិញ' },
    subtitle: { en: 'Goods receipt from a supplier or PO — raises on-hand and recalculates moving average cost.', kh: 'ការទទួលទំនិញពីអ្នកផ្គត់ផ្គង់ ឬ PO — បង្កើនស្តុក និងគណនាចំណាយមធ្យមឡើងវិញ។' },
    docPrefix: 'GRN',
  },
  'issue-products': {
    icon: callOutIcon, color: '#f97316', kind: 'issue',
    title: { en: 'Issue Products', kh: 'ដកទំនិញចេញ' },
    subtitle: { en: 'Deduct stock for internal use, write-offs, samples or other non-sale outflows.', kh: 'ដកស្តុកសម្រាប់ប្រើប្រាស់ខាងក្នុង ជាគំរូ ឬការដកចេញផ្សេងទៀត។' },
    docPrefix: 'GI',
    sheet: 'Issue List',
    statusLabel: { en: 'Issued', kh: 'បានដកចេញ' },
    statusTone: 'orange',
    searchFields: ['type', 'outlet'],
  },
  'adjustment-products': {
    icon: toolsIcon, color: '#eab308', kind: 'adjust',
    title: { en: 'Adjustment Products', kh: 'កែតម្រូវស្តុក' },
    subtitle: { en: 'Reconcile physical counts with system quantities (breakage, theft, counting errors).', kh: 'តម្រឹមការរាប់ជាមួយបរិមាណក្នុងប្រព័ន្ធ (ខូច បាត់បង់ កំហុសរាប់)។' },
    docPrefix: 'ADJ',
    sheet: 'Adjustment List',
    statusLabel: { en: 'Adjusted', kh: 'បានកែតម្រូវ' },
    statusTone: 'slate',
    searchFields: ['type', 'outlet'],
  },
  // ---- transfer workflow: request → ship → receive ------------------------
  'request-transfer': {
    icon: mailIcon, color: '#0ea5e9', kind: 'transfer-request',
    title: { en: 'Request Transfer Products', kh: 'សំណើផ្ទេរទំនិញ' },
    subtitle: { en: 'A branch requests stock from another location. Requests start as PENDING until shipped.', kh: 'សាខាស្នើសុំស្តុកពីទីតាំងផ្សេង។ សំណើចាប់ផ្តើមជាស្ថានភាព PENDING រហូតដល់ដឹកជញ្ជូន។' },
    docPrefix: 'TR',
    sheet: 'Transfer Request List',
    searchFields: ['fromLoc', 'toLoc'],
    cols: [
      { key: 'route', label: { en: 'Route', kh: 'បណ្តោយ' } },
      { key: 'products', label: { en: 'Products', kh: 'ផលិតផល' } },
      { key: 'date', label: { en: 'Date', kh: 'កាលបរិច្ឆេទ' } },
      { key: 'qty', label: { en: 'QTY', kh: 'បរិមាណ' } },
      { key: 'note', label: { en: 'Note', kh: 'ចំណាំ' } },
      { key: 'status', label: { en: 'Status', kh: 'ស្ថានភាព' } },
    ],
  },
  'ship-request-transfer': {
    icon: rocketIcon, color: '#8b5cf6', kind: 'transfer-ship',
    title: { en: 'Ship & Request Transfer Products', kh: 'ដឹកជញ្ជូនសំណើផ្ទេរ' },
    subtitle: { en: 'Review pending transfer requests, pick items and mark them In-Transit.', kh: 'ពិនិត្យសំណើដែលរង់ចាំ ជ្រើសរើសទំនិញ និងសម្គាល់ជាកំពុងដឹកជញ្ជូន។' },
    docPrefix: '',
  },
  'transfer-products': {
    icon: travelIcon, color: '#14b8a6', kind: 'transfer-receive',
    title: { en: 'Transfer Products', kh: 'ទទួលទំនិញផ្ទេរ' },
    subtitle: { en: 'Confirm receipt of in-transit items to add them to local on-hand stock.', kh: 'បញ្ជាក់ការទទួលទំនិញកំពុងដឹកជញ្ជូន ដើម្បីបន្ថែមលើស្តុកមូលដ្ឋាន។' },
    docPrefix: '',
  },
}

// Receive List columns (Receive Products only) — mirrors the receive entity.
// "code" is the identity column and is always shown; the rest are offered in
// the Choose Column modal (same layout as Suppliers Group / Product Groups).
const RECEIVE_CODE_COL = { key: 'code', label: { en: 'Code', kh: 'កូដ' } }
const RECEIVE_OPTIONAL_COLS = [
  { key: 'products', label: { en: 'Products', kh: 'ផលិតផល' } },
  { key: 'date', label: { en: 'Date', kh: 'កាលបរិច្ឆេទ' } },
  { key: 'supplier', label: { en: 'Supplier', kh: 'អ្នកផ្គត់ផ្គង់' } },
  { key: 'qty', label: { en: 'QTY', kh: 'បរិមាណ' } },
  { key: 'totalCost', label: { en: 'Total Cost', kh: 'ចំណាយសរុប' } },
  { key: 'receiveType', label: { en: 'Receive Type', kh: 'ប្រភេទនៃការទទួល' } },
  { key: 'reference', label: { en: 'Reference', kh: 'យោង' } },
  { key: 'receivedBy', label: { en: 'Received By', kh: 'អ្នកទទួល' } },
  { key: 'status', label: { en: 'Status', kh: 'ស្ថានភាព' } },
]

// Issue / Adjustment list columns — same Choose Column pattern as the Receive
// List: Code is always shown, everything else can be toggled.
const DOC_CODE_COL = { key: 'code', label: { en: 'Code', kh: 'កូដ' } }
const ISSUE_OPTIONAL_COLS = [
  { key: 'products', label: { en: 'Products', kh: 'ផលិតផល' } },
  { key: 'date', label: { en: 'Date', kh: 'កាលបរិច្ឆេទ' } },
  { key: 'totalCost', label: { en: 'Total Cost', kh: 'ចំណាយសរុប' } },
  { key: 'type', label: { en: 'Issue Type', kh: 'ប្រភេទនៃការដកចេញ' } },
  { key: 'outlet', label: { en: 'Outlet', kh: 'ហាង' } },
  { key: 'qty', label: { en: 'QTY', kh: 'បរិមាណ' } },
  { key: 'reference', label: { en: 'Reference', kh: 'យោង' } },
  { key: 'issuedBy', label: { en: 'Issued By', kh: 'អ្នកដកចេញ' } },
  { key: 'note', label: { en: 'Note', kh: 'ចំណាំ' } },
  { key: 'status', label: { en: 'Status', kh: 'ស្ថានភាព' } },
]
const ADJUST_OPTIONAL_COLS = [
  { key: 'products', label: { en: 'Products', kh: 'ផលិតផល' } },
  { key: 'date', label: { en: 'Date', kh: 'កាលបរិច្ឆេទ' } },
  { key: 'totalCost', label: { en: 'Total Cost', kh: 'ចំណាយសរុប' } },
  { key: 'type', label: { en: 'Adjustment Type', kh: 'ប្រភេទនៃការកែតម្រូវ' } },
  { key: 'outlet', label: { en: 'Outlet', kh: 'ហាង' } },
  { key: 'diff', label: { en: 'Total Diff', kh: 'ភាពខុសគ្នា' } },
  { key: 'reference', label: { en: 'Reference', kh: 'យោង' } },
  { key: 'issuedBy', label: { en: 'Adjusted By', kh: 'អ្នកកែតម្រូវ' } },
  { key: 'note', label: { en: 'Note', kh: 'ចំណាំ' } },
  { key: 'status', label: { en: 'Status', kh: 'ស្ថានភាព' } },
]

// Build an .xlsx workbook from header + data rows and trigger a download
// (same pattern as StocksList.jsx).
const downloadExcel = (filename, sheetName, headerRow, dataRows) => {
  const ws = XLSX.utils.aoa_to_sheet([headerRow, ...dataRows])
  ws['!cols'] = headerRow.map((h) => ({ wch: Math.max(12, Math.min(28, String(h).length + 6)) }))
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, sheetName)
  XLSX.writeFile(wb, filename)
}

// Thumbnail + description chips for a document's product lines
// (same cell style as the Receive List).
const ProductChips = ({ lines, products }) => (
  <span className="flex max-w-[320px] flex-wrap items-center gap-x-4 gap-y-1.5">
    {(lines || []).length === 0 && <span className="text-slate-500">—</span>}
    {(lines || []).map((l, i) => {
      const p = products.find((x) => String(x.id) === String(l.productId))
      const img = p && typeof p.imageUrl === 'string' && !p.imageUrl.startsWith('blob:') ? p.imageUrl : ''
      const desc =
        typeof p?.name === 'object' ? p.name?.en : (p?.name || l.name || `#${l.productId}`)
      const qty = l.counted ?? l.qty
      return (
        <span key={i} className="inline-flex items-center gap-2" title={`${desc}${qty != null ? ` × ${qty}` : ''}`}>
          {img
            ? <img src={img} alt="" className="h-8 w-8 rounded-lg object-cover ring-1 ring-slate-700" onError={(e) => { e.currentTarget.style.display = 'none' }} />
            : <span className="flex h-8 w-8 items-center justify-center rounded-lg text-sm ring-1 ring-slate-700" style={{ backgroundColor: 'rgba(119,188,31,0.12)' }}>🥫</span>}
          <span className="text-slate-200">{desc}</span>
          {qty != null && <span className="font-mono text-xs text-green-300">×{qty}</span>}
        </span>
      )
    })}
  </span>
)

export const TransactionSection = ({ sectionKey }) => {
  const { lang } = useLanguage()
  const op = OPS[sectionKey]
  const [products, setProducts] = useState([])
  // full-page create form (same pattern as Receive Products)
  const [showCreatePage, setShowCreatePage] = useState(false)
  const [feedback, setFeedback] = useState(null)
  // Receive List: search + column visibility (receive only)
  const [receiveQuery, setReceiveQuery] = useState('')
  const [receiveSearchBy, setReceiveSearchBy] = useState('any')
  const [showReceiveCols, setShowReceiveCols] = useState(false)
  const [receiveVisibleCols, setReceiveVisibleCols] = useState(() => new Set(RECEIVE_OPTIONAL_COLS.map((c) => c.key)))
  const [receiveColDraft, setReceiveColDraft] = useState(receiveVisibleCols)
  // Issue/Adjustment/Transfer-request list search
  const [docQuery, setDocQuery] = useState('')
  const [docSearchBy, setDocSearchBy] = useState('any')
  // Choose Column for the Issue / Adjustment lists (same pattern as Receive)
  const [showDocCols, setShowDocCols] = useState(false)
  const [docVisibleCols, setDocVisibleCols] = useState(() => new Set(['products', 'date', 'totalCost', 'type', 'outlet', 'qty', 'diff', 'reference', 'issuedBy', 'note', 'status']))
  const [docColDraft, setDocColDraft] = useState(docVisibleCols)

  // Date range filter
  const [fromDate, setFromDate] = useState('')
  const [toDate, setToDate] = useState('')

  // ledgers — shared transfer workflow + per-op posting history
  const [requests, requestApi] = useCollection('tr-requests')
  const [localHistory, historyApi] = useCollection(`ledger-${sectionKey}`)
  const [liveHistory, setLiveHistory] = useState([])
  const [loading, setLoading] = useState(false)

  const docTypeMap = {
    'receive': 'RECEIVE',
    'issue': 'ISSUE',
    'adjust': 'ADJUST',
  }

  const loadData = async () => {
    setLoading(true)
    try {
      const [pRes, sRes] = await Promise.allSettled([
        adminProductAPI.getAll(),
        docTypeMap[op?.kind] ? adminStockDocAPI.getAll(docTypeMap[op.kind]) : Promise.resolve(null),
      ])
      if (pRes.status === 'fulfilled' && Array.isArray(pRes.value?.data)) {
        setProducts(pRes.value.data)
      }
      if (sRes.status === 'fulfilled' && Array.isArray(sRes.value?.data)) {
        const backendDocs = sRes.value.data.map((d) => ({
          id: d.id,
          code: d.code,
          date: d.date,
          type: d.receiveType || d.docType,
          supplier: d.supplier,
          receiveType: d.receiveType,
          reference: d.reference || '',
          receivedBy: d.receivedBy || '',
          issuedBy: d.receivedBy || '',
          outlet: d.locationKey || d.receivedBy || '',
          location: d.locationKey || '',
          totalCost: d.totalCost ?? 0,
          status: d.status || (op.kind === 'receive' ? 'Received' : op.statusLabel?.[lang] || 'Completed'),
          note: d.note || '',
          posted: (d.lines || []).map((l) => ({
            productId: l.productId,
            name: l.nameSnapshot || `#${l.productId}`,
            qty: l.qty,
            counted: l.countedQty,
            before: l.qtyBefore,
            after: l.qtyAfter,
            unitCost: l.unitCost,
            diff: l.qty != null ? l.qty : (l.countedQty != null && l.qtyBefore != null ? l.countedQty - l.qtyBefore : 0),
            serials: l.serials,
          })),
          lines: (d.lines || []).map((l) => ({
            productId: l.productId,
            name: l.nameSnapshot || `#${l.productId}`,
            qty: l.qty,
            counted: l.countedQty,
            before: l.qtyBefore,
            after: l.qtyAfter,
            unitCost: l.unitCost,
            diff: l.qty != null ? l.qty : (l.countedQty != null && l.qtyBefore != null ? l.countedQty - l.qtyBefore : 0),
            serials: l.serials,
          })),
        }))
        setLiveHistory(backendDocs)
      }
    } catch {
      // fallback to local collection
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [sectionKey])

  const history = liveHistory.length > 0 ? liveHistory : localHistory

  if (!op) return null

  const t = (en, kh) => (lang === 'en' ? en : kh)
  const selectCls = 'w-full rounded-lg border border-slate-700/70 bg-slate-950/60 px-3 py-2.5 text-sm font-medium text-white outline-none transition focus:border-green-400 focus:bg-slate-950 focus:ring-4 focus:ring-green-500/10 hover:border-slate-600'
  const ghostBtnCls = 'inline-flex items-center justify-center gap-2 rounded-lg border border-slate-700 px-3.5 py-2.5 text-xs font-bold text-slate-300 transition hover:border-slate-600 hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-40'
  const isTransferFlow = ['transfer-request', 'transfer-ship', 'transfer-receive'].includes(op.kind)
  const hasDocList = ['receive', 'issue', 'adjust', 'transfer-request'].includes(op.kind)
  // Optional columns offered in the Choose Column modal (issue/adjust only;
  // transfer-request keeps its fixed layout).
  const docOptionalCols = op.kind === 'issue' ? ISSUE_OPTIONAL_COLS : ADJUST_OPTIONAL_COLS
  const visibleDocCols = op.kind === 'issue' || op.kind === 'adjust'
    ? docOptionalCols.filter((c) => docVisibleCols.has(c.key))
    : op.cols

  const toggleDocCol = (key) => {
    const next = new Set(docColDraft)
    if (next.has(key)) {
      if (next.size === 1) return // never allow zero visible columns
      next.delete(key)
    } else {
      next.add(key)
    }
    setDocColDraft(next)
  }

  const openDocColModal = () => {
    setDocColDraft(new Set(docVisibleCols))
    setShowDocCols(true)
  }

  /* ---------- document list (Receive-style, non-receive sections) ---------- */
  // Normalize every stored record into the document shape used by the list:
  // { id, code, date, lines: [...] }. Legacy per-line rows from the old modal
  // workflow are wrapped into one pseudo-document per line so nothing vanishes.
  const locLabel = (key) => LOCATIONS.find((l) => l.key === key)?.[lang] || key || '—'

  let docs = []
  if (op.kind === 'transfer-request') {
    docs = requests.map((r) => ({
      raw: r,
      id: r.id,
      code: r.code || r.docNo,
      date: r.date || String(r.createdAt || '').slice(0, 10),
      fromLoc: r.fromLoc,
      toLoc: r.toLoc,
      note: r.note || '',
      status: r.status || 'PENDING',
      lines: (r.lines || []).map((l) => ({ productId: l.productId, name: l.name, qty: l.qty })),
    }))
  } else if (op.kind === 'issue' || op.kind === 'adjust') {
    docs = history.map((d) => {
      if (d.posted) {
        return {
          id: d.id,
          code: d.code || d.docNo,
          date: d.date || String(d.createdAt || '').slice(0, 10),
          type: d.type || '',
          outlet: d.outlet || '',
          reference: d.reference || '',
          issuedBy: d.issuedBy || '',
          totalCost: d.totalCost ?? 0,
          note: d.note || '',
          status: d.status || op.statusLabel?.[lang],
          lines: (d.posted || []).map((l) => ({ ...l })),
        }
      }
      // legacy single-line row from the old modal workflow
      return {
        legacy: true,
        id: d.id,
        code: d.docNo,
        date: String(d.createdAt || '').slice(0, 10),
        type: '', outlet: '', note: '',
        reference: '', issuedBy: '', totalCost: 0,
        status: op.statusLabel?.[lang],
        lines: [{ productId: d.productId, name: d.name, qty: d.qty, counted: null, before: d.before, after: d.after, diff: d.diff }],
      }
    })
  }

  const dq = docQuery.trim().toLowerCase()
  const filteredDocs = docs.filter((d) => {
    if (fromDate && d.date && d.date < fromDate) return false
    if (toDate && d.date && d.date > toDate) return false
    if (!dq) return true
    if (docSearchBy === 'code') return String(d.code || '').toLowerCase().includes(dq)
    if (docSearchBy === 'type') return String(d.type || '').toLowerCase().includes(dq)
    if (docSearchBy === 'outlet') return String(d.outlet || '').toLowerCase().includes(dq)
    if (docSearchBy === 'fromLoc') return locLabel(d.fromLoc).toLowerCase().includes(dq)
    if (docSearchBy === 'toLoc') return locLabel(d.toLoc).toLowerCase().includes(dq)
    return (
      [d.code, d.type, d.outlet].some((v) => String(v || '').toLowerCase().includes(dq)) ||
      (op.kind === 'transfer-request' &&
        [locLabel(d.fromLoc), locLabel(d.toLoc)].some((v) => v.toLowerCase().includes(dq))) ||
      (d.lines || []).some((l) => String(l.name || '').toLowerCase().includes(dq))
    )
  })

  const exportDocs = () => {
    // Issue/Adjust respect the visible columns; transfer-request keeps its fixed set
    const optional = op.kind === 'issue' || op.kind === 'adjust'
      ? docOptionalCols.filter((c) => docVisibleCols.has(c.key))
      : op.cols
    const cols = [DOC_CODE_COL, ...optional]
    const headers = cols.map((c) => (typeof c.label === 'object' ? c.label.en : c.label))
    const rows = filteredDocs.map((d) =>
      cols.map((c) => {
        if (c.key === 'products') return (d.lines || []).map((l) => `${l.name} ×${l.counted ?? l.qty}`).join(', ')
        if (c.key === 'qty') return (d.lines || []).reduce((sum, l) => sum + (Number(l.qty) || 0), 0)
        if (c.key === 'diff') return (d.lines || []).reduce((sum, l) => sum + (Number(l.diff) || 0), 0)
        if (c.key === 'route') return `${locLabel(d.fromLoc)} → ${locLabel(d.toLoc)}`
        if (c.key === 'outlet') return locLabel(d.outlet)
        if (c.key === 'status') return d.status || ''
        const v = d[c.key]
        return typeof v === 'number' ? v : (v ?? '')
      })
    )
    exportStyledExcel({
      filename: `b-groceries-${sectionKey}-list.xlsx`,
      sheetName: op.sheet || 'Documents',
      title: `${(op.title?.en || sectionKey).toUpperCase()} DOCUMENT REPORT`,
      subtitle: `Total Documents: ${rows.length}`,
      headers,
      data: rows,
    })
  }

  /* ---------- save callback from the full-page create form ---------- */
  const handleDocCreated = (doc) => {
    if (doc.kind === 'transfer-request') {
      requestApi.add({
        docNo: doc.code, code: doc.code, date: doc.date,
        fromLoc: doc.fromLoc, toLoc: doc.toLoc, status: 'PENDING', note: doc.note,
        lines: doc.lines.map((l) => ({ productId: l.productId, name: l.name, qty: l.qty })),
      })
      setFeedback({ tone: 'green', text: t(`✓ Request ${doc.code} created`, `✓ បានបង្កើតសំណើ ${doc.code}`), fails: [] })
    } else {
      historyApi.add({
        code: doc.code, date: doc.date, type: doc.type, outlet: doc.outlet,
        reference: doc.reference || '', issuedBy: doc.issuedBy || '',
        totalCost: doc.totalCost ?? 0,
        status: op.statusLabel?.[lang] || 'Saved',
        note: doc.note,
        posted: doc.posted,
      })
      setFeedback({ tone: 'green', text: t(`✓ Document ${doc.code} saved`, `✓ ឯកសារ ${doc.code} បានរក្សាទុក`), fails: [] })
    }
  }

  // Called by the Receive create form after posting — records the document
  // in the Receive List and returns to it.
  const handleReceiveCreated = (doc) => {
    historyApi.add(doc)
    setShowCreatePage(false)
    setFeedback({ tone: 'green', text: t(`✓ Document ${doc.code} saved`, `✓ ឯកសារ ${doc.code} បានរក្សាទុក`), fails: [] })
  }


  /* ---------- transfer-request delete ---------- */
  // Removing a request only moves workflow state; issue/adjust/receive
  // documents are permanent records with no delete action.
  const deleteDoc = async (d) => {
    requestApi.remove(d.raw ? d.raw.id : d.id)
    setFeedback({ tone: 'green', text: t(`✓ Transfer ${d.code} deleted`, `✓ ការផ្ទេរ ${d.code} បានលុប`), fails: [] })
  }

  // Deleting a receive document would have to undo what posting it did, but
  // documents are kept as permanent records — no delete action is exposed.

  /* ---------- transfer workflow actions (ship / receive pages) ---------- */
  const shipRequests = () => {
    const pending = requests.filter((r) => r.status === 'PENDING')
    pending.forEach((r) => requestApi.update(r.id, { status: 'IN-TRANSIT' }))
    setFeedback({ tone: 'blue', text: t(`${pending.length} request(s) marked In-Transit`, `${pending.length} សំណើជាកំពុងដឹកជញ្ជូន`), fails: [] })
  }

  const receiveTransfers = () => {
    const transit = requests.filter((r) => r.status === 'IN-TRANSIT')
    transit.forEach((r) => requestApi.update(r.id, { status: 'RECEIVED' }))
    setFeedback({ tone: 'green', text: t(`${transit.length} transfer(s) received into stock`, `${transit.length} ការផ្ទេរបានទទួល`), fails: [] })
  }

  const closeCreatePage = () => {
    setShowCreatePage(false)
  }

  /* ---------- Receive List: filtering + export ---------- */
  let filteredReceiveDocs = []
  if (op.kind === 'receive') {
    const q = receiveQuery.trim().toLowerCase()
    const match = (doc) => {
      if (fromDate && doc.date && doc.date < fromDate) return false
      if (toDate && doc.date && doc.date > toDate) return false
      if (!q) return true
      switch (receiveSearchBy) {
        case 'code': return String(doc.code || doc.docNo || '').toLowerCase().includes(q)
        case 'supplier': return String(doc.supplier || '').toLowerCase().includes(q)
        case 'receiveType': return String(doc.receiveType || '').toLowerCase().includes(q)
        case 'receivedBy': return String(doc.receivedBy || '').toLowerCase().includes(q)
        default:
          return (
            [doc.code, doc.docNo, doc.supplier, doc.receiveType, doc.reference, doc.receivedBy]
              .some((v) => String(v || '').toLowerCase().includes(q)) ||
            (doc.lines || []).some((l) => String(l.name || '').toLowerCase().includes(q))
          )
      }
    }
    filteredReceiveDocs = history.filter(match)
  }

  const toggleReceiveCol = (key) => {
    const next = new Set(receiveColDraft)
    if (next.has(key)) {
      if (next.size === 1) return // never allow zero visible columns
      next.delete(key)
    } else {
      next.add(key)
    }
    setReceiveColDraft(next)
  }

  const openReceiveColModal = () => {
    setReceiveColDraft(new Set(receiveVisibleCols))
    setShowReceiveCols(true)
  }

  const exportReceiveList = () => {
    const cols = [RECEIVE_CODE_COL, ...RECEIVE_OPTIONAL_COLS.filter((c) => receiveVisibleCols.has(c.key))]
    const headers = cols.map((c) => (typeof c.label === 'object' ? c.label.en : c.label))
    const rows = filteredReceiveDocs.map((d) =>
      cols.map((c) => {
        if (c.key === 'qty') return (d.lines || []).reduce((sum, l) => sum + (Number(l.qty) || 0), 0)
        if (c.key === 'products') return (d.lines || []).map((l) => `${l.name} ×${l.qty}`).join(', ')
        const v = d[c.key]
        return typeof v === 'number' ? v : (v ?? '')
      })
    )
    exportStyledExcel({
      filename: 'b-groceries-receive-list.xlsx',
      sheetName: 'Receive Products',
      title: 'GOODS RECEIVE (GRN) DOCUMENTS REPORT',
      subtitle: `Total Receive Documents: ${rows.length}`,
      headers,
      data: rows,
    })
  }

  /* ---------- cell renderer for the issue/adjust/transfer-request list ---------- */
  const renderCell = (d, key) => {
    switch (key) {
      case 'products': return <ProductChips lines={d.lines} products={products} />
      case 'date': return <span className="text-slate-200">{d.date || '—'}</span>
      case 'type': return <span className="text-slate-200">{d.type || '—'}</span>
      case 'outlet': return <span className="text-slate-200">{locLabel(d.outlet)}</span>
      case 'route': return (
        <span className="inline-flex items-center gap-2 whitespace-nowrap text-slate-200">
          {locLabel(d.fromLoc)} <span className="font-bold text-green-400">→</span> {locLabel(d.toLoc)}
        </span>
      )
      case 'qty': return (
        <span className="font-semibold text-white">
          {(d.lines || []).reduce((sum, l) => sum + (Number(l.qty) || 0), 0)}
          <span className="ml-1.5 text-xs font-normal text-slate-500">{t('items', 'ទំនិញ')}</span>
        </span>
      )
      case 'diff': {
        const totalDiff = (d.lines || []).reduce((sum, l) => sum + (Number(l.diff) || 0), 0)
        return <Pill tone={totalDiff >= 0 ? 'green' : 'red'}>{totalDiff >= 0 ? `+${totalDiff}` : totalDiff}</Pill>
      }
      case 'totalCost': return <span className="font-semibold text-green-300">${Number(d.totalCost || 0).toFixed(2)}</span>
      case 'reference': return <span className="text-slate-200">{d.reference || '—'}</span>
      case 'issuedBy': return <span className="text-slate-200">{d.issuedBy || '—'}</span>
      case 'note': return <span className="block max-w-[220px] truncate text-slate-400" title={d.note}>{d.note || '—'}</span>
      case 'status':
        if (op.kind === 'transfer-request') {
          return <Pill tone={d.status === 'RECEIVED' ? 'green' : d.status === 'IN-TRANSIT' ? 'blue' : 'orange'}>{d.status}</Pill>
        }
        return <Pill tone={op.statusTone}>{d.status || op.statusLabel?.[lang]}</Pill>
      default: return null
    }
  }

  // Search-field labels for the Search By dropdown (per section)
  const SEARCH_FIELD_LABELS = {
    type: op.kind === 'adjust'
      ? { en: 'Adjustment Type', kh: 'ប្រភេទនៃការកែតម្រូវ' }
      : { en: 'Issue Type', kh: 'ប្រភេទនៃការដកចេញ' },
    outlet: { en: 'Outlet', kh: 'ហាង' },
    fromLoc: { en: 'From Location', kh: 'ទីតាំងចេញ' },
    toLoc: { en: 'To Location', kh: 'ទីតាំងទៅ' },
  }

  return (
    <PageLoader loading={loading} message={lang === 'en' ? 'Loading data…' : 'កំពុងផ្ទុកទិន្នន័យ…'}>
    <SectionShell
      icon={op.icon}
      color={op.color}
      title={op.title}
      subtitle={op.subtitle}
      actions={hasDocList && (
        <PrimaryButton onClick={() => setShowCreatePage(true)}>
          {`+ ${t('Create', 'បង្កើត')}`}
        </PrimaryButton>
      )}
    >
      {/* full-page create forms */}
      {hasDocList && showCreatePage && (op.kind === 'receive'
        ? <ReceiveProductsCreate products={products} onPosted={handleReceiveCreated} onClose={closeCreatePage} />
        : <TransactionDocCreate sectionKey={sectionKey} products={products} onCreated={handleDocCreated} onClose={closeCreatePage} />)}

      {feedback && (
        <div className={`rounded-xl border px-4 py-3 text-sm font-semibold ${
          feedback.tone === 'green' ? 'border-green-500/40 bg-green-500/10 text-green-300'
            : feedback.tone === 'blue' ? 'border-sky-500/40 bg-sky-500/10 text-sky-300'
              : feedback.tone === 'red' ? 'border-red-500/40 bg-red-500/10 text-red-300'
                : 'border-orange-500/40 bg-orange-500/10'
        }`} style={feedback.tone === 'orange' ? { color: ORANGE } : undefined}>
          <p>{feedback.text}</p>
          {(feedback.fails || []).map((f, i) => <p key={i} className="text-xs text-slate-400">• {f}</p>)}
        </div>
      )}

      {/* ship page — review pending requests */}
      {isTransferFlow && op.kind !== 'transfer-request' && (
        <>
          <DataTable
            headers={[t('Doc No', 'លេខឯកសារ'), t('From', 'ពី'), t('To', 'ទៅ'), t('Items', 'ទំនិញ'), t('Action', 'សកម្មភាព')]}
            rows={requests
              .filter((r) => (op.kind === 'transfer-ship' ? r.status === 'PENDING' : r.status !== 'PENDING'))
              .map((r) => ({
                id: r.id,
                cells: [
                  <span key="d" className="font-mono text-xs text-slate-300">{r.code || r.docNo}</span>,
                  <span key="f" className="text-slate-200">{LOCATIONS.find((l) => l.key === r.fromLoc)?.[lang]}</span>,
                  <span key="t2" className="text-slate-200">{LOCATIONS.find((l) => l.key === r.toLoc)?.[lang]}</span>,
                  <span key="i" className="text-slate-300">{(r.lines || []).map((l) => `${l.name} ×${l.qty}`).join(', ')}</span>,
                  <button
                    key="del"
                    type="button"
                    onClick={() => deleteDoc({ raw: r, id: r.id, code: r.code || r.docNo })}
                    className="transition hover:scale-110"
                    style={{ color: ORANGE }}
                    aria-label={t('Delete', 'លុប')}
                    title={t('Delete', 'លុប')}
                  >
                    <TrashIcon />
                  </button>,
                ],
              }))}
            emptyText={op.kind === 'transfer-ship'
              ? { en: 'No pending requests.', kh: 'មិនមានសំណើរង់ចាំទេ។' }
              : { en: 'No in-transit transfers yet.', kh: 'មិនទាន់មានការផ្ទេរកំពុងដឹកទេ។' }}
            emptyIcon={op.icon}
          />
          {op.kind === 'transfer-ship' && (
            <div className="flex justify-end">
              <PrimaryButton onClick={shipRequests} disabled={!requests.some((r) => r.status === 'PENDING')}>
                {t('Mark All Pending as In-Transit', 'ដាក់សំណើទាំងអស់ជាកំពុងដឹក')}
              </PrimaryButton>
            </div>
          )}
          {op.kind === 'transfer-receive' && (
            <div className="flex justify-end">
              <PrimaryButton onClick={receiveTransfers} disabled={!requests.some((r) => r.status === 'IN-TRANSIT')}>
                {t('Receive All In-Transit', 'ទទួលទាំងអស់')}
              </PrimaryButton>
            </div>
          )}
        </>
      )}

      {/* ---------- Receive List (unchanged layout, incl. Choose Column) ---------- */}
      {op.kind === 'receive' && (
        <section className="overflow-hidden rounded-2xl border border-slate-700/60 bg-slate-900/80 shadow-xl shadow-black/20">
          {/* Filter bar — same layout as Suppliers Group */}
          <div className="flex flex-col gap-3 border-b border-slate-700/60 p-4 lg:flex-row lg:items-center">
            <select
              value={receiveSearchBy}
              onChange={(e) => setReceiveSearchBy(e.target.value)}
              aria-label={t('Search By', 'ស្វែងរកដោយ')}
              className={`${selectCls} w-full sm:w-auto sm:min-w-[170px]`}
            >
              <option value="any">{t('Search By', 'ស្វែងរកដោយ')}: {t('Any', 'ណាមួយ')}</option>
              <option value="code">{t('Search By', 'ស្វែងរកដោយ')}: {t('Code', 'កូដ')}</option>
              <option value="supplier">{t('Search By', 'ស្វែងរកដោយ')}: {t('Supplier', 'អ្នកផ្គត់ផ្គង់')}</option>
              <option value="receiveType">{t('Search By', 'ស្វែងរកដោយ')}: {t('Receive Type', 'ប្រភេទនៃការទទួល')}</option>
              <option value="receivedBy">{t('Search By', 'ស្វែងរកដោយ')}: {t('Received By', 'អ្នកទទួល')}</option>
            </select>

            <div className="relative min-w-0 flex-1">
              <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500"><SearchIcon /></span>
              <input
                type="text"
                value={receiveQuery}
                onChange={(e) => setReceiveQuery(e.target.value)}
                placeholder={t('Type to search receive list…', 'បញ្ចូលដើម្បីស្វែងរកបញ្ជីទទួល…')}
                className="w-full rounded-lg border border-slate-700/70 bg-slate-950/60 py-2.5 pl-10 pr-4 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-green-400 focus:bg-slate-950 focus:ring-4 focus:ring-green-500/10"
              />
            </div>

            {/* Date range filter */}
            <div className="flex items-center gap-1.5 flex-wrap sm:flex-nowrap">
              <div className="flex items-center gap-1.5 rounded-lg border border-slate-700/70 bg-slate-950/60 px-2.5 py-2 text-xs text-slate-300">
                <span className="text-slate-400 font-medium">{t('From', 'ពី')}:</span>
                <input
                  type="date"
                  value={fromDate}
                  onChange={(e) => setFromDate(e.target.value)}
                  aria-label={t('From Date', 'កាលបរិច្ឆេទចាប់ពី')}
                  className="bg-transparent text-white outline-none cursor-pointer [color-scheme:dark] text-xs font-mono"
                />
              </div>
              <div className="flex items-center gap-1.5 rounded-lg border border-slate-700/70 bg-slate-950/60 px-2.5 py-2 text-xs text-slate-300">
                <span className="text-slate-400 font-medium">{t('To', 'ដល់')}:</span>
                <input
                  type="date"
                  value={toDate}
                  onChange={(e) => setToDate(e.target.value)}
                  aria-label={t('To Date', 'កាលបរិច្ឆេទដល់')}
                  className="bg-transparent text-white outline-none cursor-pointer [color-scheme:dark] text-xs font-mono"
                />
              </div>
              {(fromDate || toDate) && (
                <button
                  type="button"
                  onClick={() => { setFromDate(''); setToDate('') }}
                  className="rounded-lg border border-slate-700 bg-slate-800/80 px-2.5 py-2 text-xs font-semibold text-rose-300 hover:bg-slate-700 hover:text-white transition shrink-0"
                  title={t('Clear Date Filter', 'សម្អាតកាលបរិច្ឆេទ')}
                >
                  ✕ {t('Clear', 'សម្អាត')}
                </button>
              )}
            </div>

            <button type="button" onClick={exportReceiveList} title={t('Export File Excel', 'នាំចេញ Excel')} className={`${ghostBtnCls}`}>
              <DownloadIcon /> <span className="hidden xl:inline">{t('Export File Excel', 'នាំចេញ Excel')}</span>
            </button>
            <button type="button" onClick={openReceiveColModal} title={t('Choose Column', 'ជ្រើសរើសជួរឈរ')} className={`${ghostBtnCls}`}>
              <ColumnsIcon /> <span className="hidden xl:inline">{t('Choose Column', 'ជ្រើសរើសជួរឈរ')}</span>
            </button>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead>
                <tr className="border-b border-slate-700/60 bg-slate-800/40 text-xs font-bold uppercase tracking-wide text-slate-500">
                  <th className="whitespace-nowrap px-4 py-3">{t('Code', 'កូដ')}</th>
                  {RECEIVE_OPTIONAL_COLS.filter((col) => receiveVisibleCols.has(col.key)).map((col) => (
                    <th key={col.key} className="whitespace-nowrap px-4 py-3">{col.label[lang]}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredReceiveDocs.length === 0 ? (
                  <tr>
                    <td colSpan={1 + receiveVisibleCols.size} className="px-4 py-14 text-center">
                      <span className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-slate-800"><SearchIcon /></span>
                      <p className="text-sm text-slate-400">{history.length === 0 ? t('No documents posted yet.', 'មិនទាន់មានឯកសារកត់ត្រាទេ។') : t('No documents match your filters.', 'រកមិនឃើញឯកសារតាមតម្រូវការ។')}</p>
                    </td>
                  </tr>
                ) : (
                  filteredReceiveDocs.map((d) => (
                    <tr key={d.id} className="border-b border-slate-800/60 transition last:border-0 hover:bg-slate-800/40">
                      <td className="whitespace-nowrap px-4 py-3">
                        <span className="font-mono font-semibold text-green-300">{d.code}</span>
                      </td>
                      {RECEIVE_OPTIONAL_COLS.filter((col) => receiveVisibleCols.has(col.key)).map((col) => {
                        const renderReceiveCell = (key) => {
                          switch (key) {
                            // each received item: picture thumbnail + description
                            case 'products': return <ProductChips lines={d.lines} products={products} />
                            case 'date': return <span className="text-slate-200">{d.date || '—'}</span>
                            case 'supplier': return <span className="text-slate-200">{d.supplier || '—'}</span>
                            case 'qty': return (
                              <span className="font-semibold text-white">
                                {(d.lines || []).reduce((sum, l) => sum + (Number(l.qty) || 0), 0)}
                                <span className="ml-1.5 text-xs font-normal text-slate-500">{t('items', 'ទំនិញ')}</span>
                              </span>
                            )
                            case 'totalCost': return <span className="text-slate-200">${Number(d.totalCost || 0).toFixed(2)}</span>
                            case 'receiveType': return <span className="text-slate-200">{d.receiveType || '—'}</span>
                            case 'reference': return <span className="text-slate-200">{d.reference || '—'}</span>
                            case 'receivedBy': return <span className="text-slate-200">{d.receivedBy || '—'}</span>
                            case 'status': return <Pill tone="green">{d.status || t('Received', 'បានទទួល')}</Pill>
                            default: return null
                          }
                        }
                        return <td key={col.key} className="whitespace-nowrap px-4 py-3">{renderReceiveCell(col.key)}</td>
                      })}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* ---------- Issue / Adjustment / Transfer-request document list ----------
          Same layout as the Receive List: filter bar, search, Excel export,
          product chips, status pills. */}
      {(op.kind === 'issue' || op.kind === 'adjust' || op.kind === 'transfer-request') && (
        <section className="overflow-hidden rounded-2xl border border-slate-700/60 bg-slate-900/80 shadow-xl shadow-black/20">
          {/* Filter bar */}
          <div className="flex flex-col gap-3 border-b border-slate-700/60 p-4 lg:flex-row lg:items-center">
            <select
              value={docSearchBy}
              onChange={(e) => setDocSearchBy(e.target.value)}
              aria-label={t('Search By', 'ស្វែងរកដោយ')}
              className={`${selectCls} w-full sm:w-auto sm:min-w-[170px]`}
            >
              <option value="any">{t('Search By', 'ស្វែងរកដោយ')}: {t('Any', 'ណាមួយ')}</option>
              <option value="code">{t('Search By', 'ស្វែងរកដោយ')}: {t('Code', 'កូដ')}</option>
              {(op.searchFields || []).map((f) => (
                <option key={f} value={f}>
                  {t('Search By', 'ស្វែងរកដោយ')}: {SEARCH_FIELD_LABELS[f][lang]}
                </option>
              ))}
            </select>

            <div className="relative min-w-0 flex-1">
              <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500"><SearchIcon /></span>
              <input
                type="text"
                value={docQuery}
                onChange={(e) => setDocQuery(e.target.value)}
                placeholder={t('Type to search…', 'បញ្ចូលដើម្បីស្វែងរក…')}
                className="w-full rounded-lg border border-slate-700/70 bg-slate-950/60 py-2.5 pl-10 pr-4 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-green-400 focus:bg-slate-950 focus:ring-4 focus:ring-green-500/10"
              />
            </div>

            {/* Date range filter */}
            <div className="flex items-center gap-1.5 flex-wrap sm:flex-nowrap">
              <div className="flex items-center gap-1.5 rounded-lg border border-slate-700/70 bg-slate-950/60 px-2.5 py-2 text-xs text-slate-300">
                <span className="text-slate-400 font-medium">{t('From', 'ពី')}:</span>
                <input
                  type="date"
                  value={fromDate}
                  onChange={(e) => setFromDate(e.target.value)}
                  aria-label={t('From Date', 'កាលបរិច្ឆេទចាប់ពី')}
                  className="bg-transparent text-white outline-none cursor-pointer [color-scheme:dark] text-xs font-mono"
                />
              </div>
              <div className="flex items-center gap-1.5 rounded-lg border border-slate-700/70 bg-slate-950/60 px-2.5 py-2 text-xs text-slate-300">
                <span className="text-slate-400 font-medium">{t('To', 'ដល់')}:</span>
                <input
                  type="date"
                  value={toDate}
                  onChange={(e) => setToDate(e.target.value)}
                  aria-label={t('To Date', 'កាលបរិច្ឆេទដល់')}
                  className="bg-transparent text-white outline-none cursor-pointer [color-scheme:dark] text-xs font-mono"
                />
              </div>
              {(fromDate || toDate) && (
                <button
                  type="button"
                  onClick={() => { setFromDate(''); setToDate('') }}
                  className="rounded-lg border border-slate-700 bg-slate-800/80 px-2.5 py-2 text-xs font-semibold text-rose-300 hover:bg-slate-700 hover:text-white transition shrink-0"
                  title={t('Clear Date Filter', 'សម្អាតកាលបរិច្ឆេទ')}
                >
                  ✕ {t('Clear', 'សម្អាត')}
                </button>
              )}
            </div>

            <button type="button" onClick={exportDocs} title={t('Export File Excel', 'នាំចេញ Excel')} className={`${ghostBtnCls}`}>
              <DownloadIcon /> <span className="hidden xl:inline">{t('Export File Excel', 'នាំចេញ Excel')}</span>
            </button>
            {(op.kind === 'issue' || op.kind === 'adjust') && (
              <button type="button" onClick={openDocColModal} title={t('Choose Column', 'ជ្រើសរើសជួរឈរ')} className={`${ghostBtnCls}`}>
                <ColumnsIcon /> <span className="hidden xl:inline">{t('Choose Column', 'ជ្រើសរើសជួរឈរ')}</span>
              </button>
            )}
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-left text-sm">
              <thead>
                <tr className="border-b border-slate-700/60 bg-slate-800/40 text-xs font-bold uppercase tracking-wide text-slate-500">
                  <th className="whitespace-nowrap px-4 py-3">{t('Code', 'កូដ')}</th>
                  {visibleDocCols.map((col) => (
                    <th key={col.key} className="whitespace-nowrap px-4 py-3">{col.label[lang]}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredDocs.length === 0 ? (
                  <tr>
                    <td colSpan={visibleDocCols.length + 1} className="px-4 py-14 text-center">
                      <span className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-slate-800"><SearchIcon /></span>
                      <p className="text-sm text-slate-400">{docs.length === 0 ? t('No documents posted yet.', 'មិនទាន់មានឯកសារកត់ត្រាទេ។') : t('No documents match your filters.', 'រកមិនឃើញឯកសារតាមតម្រូវការ។')}</p>
                    </td>
                  </tr>
                ) : (
                  filteredDocs.map((d) => (
                    <tr key={d.id} className="border-b border-slate-800/60 transition last:border-0 hover:bg-slate-800/40">
                      <td className="whitespace-nowrap px-4 py-3">
                        <span className="font-mono font-semibold text-green-300">{d.code}</span>
                      </td>
                      {visibleDocCols.map((col) => (
                        <td key={col.key} className="whitespace-nowrap px-4 py-3">{renderCell(d, col.key)}</td>
                      ))}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* ---------- Receive List: Choose Column modal (unchanged) ---------- */}
      {showReceiveCols && (
        <Modal open onClose={() => setShowReceiveCols(false)} title={t('Choose Column', 'ជ្រើសរើសជួរឈរ')}>
          {/* checkbox grid — the entity columns (Code is always shown) */}
          <div className="grid grid-cols-1 gap-x-6 gap-y-1 sm:grid-cols-2">
            {RECEIVE_OPTIONAL_COLS.map((col) => {
              const checked = receiveColDraft.has(col.key)
              return (
                <label
                  key={col.key}
                  className={`flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2 text-sm font-semibold transition ${checked ? 'text-white' : 'text-slate-400'} hover:bg-slate-800`}
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => toggleReceiveCol(col.key)}
                    className="h-4 w-4 cursor-pointer rounded accent-green-500"
                  />
                  {col.label[lang]}
                </label>
              )
            })}
          </div>

          {/* footer actions */}
          <div className="mt-4 flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={() => setReceiveColDraft(new Set(RECEIVE_OPTIONAL_COLS.map((c) => c.key)))}
              title={t('Reset to Normal', 'កំណត់ឡើងវិញតាមដើម')}
              className="inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-bold transition hover:bg-slate-800"
              style={{ color: ORANGE }}
            >
              <ResetIcon /> {t('Reset to Normal', 'កំណត់ឡើងវិញតាមដើម')}
            </button>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setShowReceiveCols(false)}
                className="rounded-lg border border-slate-700 px-5 py-2 text-sm font-bold text-slate-300 transition hover:bg-slate-800"
              >
                {t('Cancel', 'បោះបង់')}
              </button>
              <button
                type="button"
                onClick={() => { setReceiveVisibleCols(new Set(receiveColDraft)); setShowReceiveCols(false) }}
                className="rounded-lg bg-green-500 px-5 py-2 text-sm font-black text-slate-950 shadow-md shadow-green-500/20 transition hover:bg-green-400"
              >
                {t('Apply', 'អនុវត្ត')}
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* ---------- Issue / Adjustment List: Choose Column modal ---------- */}
      {showDocCols && (
        <Modal open onClose={() => setShowDocCols(false)} title={t('Choose Column', 'ជ្រើសរើសជួរឈរ')}>
          <p className="mb-3 text-xs font-semibold text-slate-500">
            {t('Code is always shown.', 'កូដត្រូវបានបង្ហាញជានិច្ច។')}
          </p>
          {/* checkbox grid — the entity columns (Code is always shown) */}
          <div className="grid grid-cols-1 gap-x-6 gap-y-1 sm:grid-cols-2">
            {docOptionalCols.map((col) => {
              const checked = docColDraft.has(col.key)
              return (
                <label
                  key={col.key}
                  className={`flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2 text-sm font-semibold transition ${checked ? 'text-white' : 'text-slate-400'} hover:bg-slate-800`}
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => toggleDocCol(col.key)}
                    className="h-4 w-4 cursor-pointer rounded accent-green-500"
                  />
                  {col.label[lang]}
                </label>
              )
            })}
          </div>

          {/* footer actions */}
          <div className="mt-4 flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={() => setDocColDraft(new Set(docOptionalCols.map((c) => c.key)))}
              title={t('Reset to Normal', 'កំណត់ឡើងវិញតាមដើម')}
              className="inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-bold transition hover:bg-slate-800"
              style={{ color: ORANGE }}
            >
              <ResetIcon /> {t('Reset to Normal', 'កំណត់ឡើងវិញតាមដើម')}
            </button>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setShowDocCols(false)}
                className="rounded-lg border border-slate-700 px-5 py-2 text-sm font-bold text-slate-300 transition hover:bg-slate-800"
              >
                {t('Cancel', 'បោះបង់')}
              </button>
              <button
                type="button"
                onClick={() => { setDocVisibleCols(new Set(docColDraft)); setShowDocCols(false) }}
                className="rounded-lg bg-green-500 px-5 py-2 text-sm font-black text-slate-950 shadow-md shadow-green-500/20 transition hover:bg-green-400"
              >
                {t('Apply', 'អនុវត្ត')}
              </button>
            </div>
          </div>
        </Modal>
      )}
    </SectionShell>
    </PageLoader>
  )
}

/* ---------- icons ---------- */
const SearchIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
    <circle cx="11" cy="11" r="7" />
    <line x1="21" y1="21" x2="16.5" y2="16.5" />
  </svg>
)

const DownloadIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    <polyline points="7 10 12 15 17 10" />
    <line x1="12" y1="15" x2="12" y2="3" />
  </svg>
)

const ColumnsIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <rect x="3" y="3" width="18" height="18" rx="2" />
    <line x1="9" y1="3" x2="9" y2="21" />
    <line x1="15" y1="3" x2="15" y2="21" />
  </svg>
)

const ResetIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
    <path d="M3 12a9 9 0 1 0 2.6-6.3L3 8" />
    <polyline points="3 3 3 8 8 8" />
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

export default TransactionSection
