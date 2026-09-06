import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import * as XLSX from 'xlsx'
import { useLanguage } from '../../context/LanguageContext'
import { useNotifications } from '../../context/NotificationContext'
import { adminProductAPI } from '../../api/api'
import { ConfirmModal } from './stockUI'
import { PageLoader } from '../../components/PageLoader'
import { exportStyledExcel } from '../../utils/excelExport'
import './StocksList.css'
import { PRODUCTS as DEMO_PRODUCTS, CATEGORIES, formatPrice } from '../../data/products'

// Theme constants — FreshMart dark admin palette.
const GREEN = '#77BC1F'
const ORANGE = '#FF9900'
const LOW_STOCK_THRESHOLD = 5
const PAGE_SIZE = 8

// Every column offered in the "Choose Column" modal. Field names match the
// backend ProductDto so exports round-trip straight back through Import.
// `get` reads the normalized row object built in useEffect below.
const COLUMN_DEFS = [
  { key: 'code', dto: 'code', label: { en: 'Code', kh: 'កូដ' } },
  { key: 'barcode', dto: 'barCode', label: { en: 'Bar Code', kh: 'បារកូដ' } },
  { key: 'nameKh', dto: 'nameKh', label: { en: 'Second Language', kh: 'ភាសាទី២' } },
  { key: 'name', dto: 'name', label: { en: 'Description', kh: 'ការពិពណ៌នា' }, always: true },
  { key: 'productGroup', dto: 'productGroup', label: { en: 'Product Group', kh: 'ក្រុមផលិតផល' } },
  { key: 'category', dto: 'category', label: { en: 'Category', kh: 'ប្រភេទ' } },
  { key: 'onHand', dto: 'onHand', label: { en: 'Onhand', kh: 'ស្តុកនៅសល់' } },
  { key: 'uom', dto: 'uom', label: { en: 'UOM', kh: 'ឯកតាវាស់' } },
  { key: 'basePrice', dto: 'basePrice', label: { en: 'Base Price', kh: 'តម្លៃដើម' } },
  { key: 'averageCost', dto: 'averageCost', label: { en: 'Ava Cost', kh: 'ចំណាយមធ្យម' } },
  { key: 'standardCost', dto: 'standardCost', label: { en: 'Standard Cost', kh: 'ចំណាយស្តង់ដារ' } },
  { key: 'createDate', dto: 'createDate', label: { en: 'Create Date', kh: 'កាលបរិច្ឆេទបង្កើត' } },
  { key: 'country', dto: 'country', label: { en: 'Country', kh: 'ប្រទេស' } },
  { key: 'supplier', dto: 'supplier', label: { en: 'Supplier', kh: 'អ្នកផ្គត់ផ្គង់' } },
  { key: 'partNumber', dto: 'partNumber', label: { en: 'Part Number', kh: 'លេខផ្នែក' } },
  { key: 'brand', dto: 'brand', label: { en: 'Brand', kh: 'ម៉ាក' } },
  { key: 'onPo', dto: 'onPo', label: { en: 'On PO', kh: 'លើ PO' } },
  { key: 'onSo', dto: 'onSo', label: { en: 'On SO', kh: 'លើ SO' } },
  { key: 'availableStock', dto: 'availableStock', label: { en: 'Ava Stock', kh: 'ស្តុកដែលមាន' } },
  { key: 'active', dto: 'active', label: { en: 'Active', kh: 'ដំណើរការ' }, bool: true },
  { key: 'serial', dto: 'serial', label: { en: 'Serial', kh: 'សៀរៀល' } },
  { key: 'expiryDate', dto: 'expiryDate', label: { en: 'Expiry Date', kh: 'ថ្ងៃផុតកំណត់' } },
  { key: 'allowDiscount', dto: 'allowDiscount', label: { en: 'Allow Discount', kh: 'អនុញ្ញាតបញ្ចុះតម្លៃ' }, bool: true },
  { key: 'tax', dto: 'tax', label: { en: 'Tax', kh: 'ពន្ធ' } },
  { key: 'outOfStock', dto: 'outOfStock', label: { en: 'Is Out of Stock', kh: 'អស់ស្តុក' }, bool: true },
  { key: 'favorite', dto: 'favorite', label: { en: 'Favorite', kh: 'ដែលចូលចិត្ត' }, bool: true },
]

// Columns shown before the user customizes anything.
const DEFAULT_COLS = ['barcode', 'name', 'category', 'basePrice', 'onHand', 'status']

// Flexible CSV header → DTO field. Our own exports round-trip because the
// normalized header ("barcode", "baseprice"…) hits the same aliases.
const HEADER_ALIASES = {
  code: 'code',
  barcode: 'barCode',
  secondlanguage: 'nameKh',
  namekh: 'nameKh',
  description: 'name',
  name: 'name',
  productgroup: 'productGroup',
  category: 'category',
  onhand: 'onHand',
  uom: 'uom',
  baseprice: 'basePrice',
  price: 'basePrice',
  avacost: 'averageCost',
  averagecost: 'averageCost',
  standardcost: 'standardCost',
  createdate: 'createDate',
  date: 'createDate',
  country: 'country',
  supplier: 'supplier',
  partnumber: 'partNumber',
  brand: 'brand',
  onpo: 'onPo',
  onso: 'onSo',
  avastock: 'availableStock',
  availablestock: 'availableStock',
  active: 'active',
  serial: 'serial',
  expirydate: 'expiryDate',
  expiredate: 'expiryDate',
  allowdiscount: 'allowDiscount',
  tax: 'tax',
  isoutofstock: 'outOfStock',
  outofstock: 'outOfStock',
  favorite: 'favorite',
}

// Build an .xlsx workbook from header + data rows and trigger a download.
function downloadExcel(filename, sheetName, headerRow, dataRows) {
  const ws = XLSX.utils.aoa_to_sheet([headerRow, ...dataRows])
  // sensible column widths so the file is readable straight away
  ws['!cols'] = headerRow.map((h) => ({ wch: Math.max(12, Math.min(28, String(h).length + 6)) }))
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, sheetName)
  XLSX.writeFile(wb, filename)
}

// Parse an uploaded .xlsx/.xls/.csv file into { headers, rows } (arrays of strings).
async function readExcel(file) {
  const buffer = await file.arrayBuffer()
  const wb = XLSX.read(buffer, { type: 'array' })
  const first = wb.Sheets[wb.SheetNames[0]]
  const aoa = XLSX.utils.sheet_to_json(first, { header: 1, raw: false, defval: '' })
  if (!aoa.length) return { headers: [], rows: [] }
  const [headers, ...rows] = aoa
  return { headers: headers.map((h) => String(h)), rows: rows.map((r) => r.map((c) => String(c ?? ''))) }
}

const truthy = (v) => /^(true|1|yes|y)$/i.test(String(v).trim())
const numOrEmpty = (v) => (v === '' || v == null ? null : Number(v))

// "All Products" landing page for the Stocks menu — inventory dashboard on
// the dark admin theme. Tries the live backend first and falls back to the
// bundled demo catalog so the page is never empty.
export const StocksList = () => {
  const { lang } = useLanguage()
  const { addNotification } = useNotifications()
  const navigate = useNavigate()
  const importRef = useRef(null)

  // Clicking a row jumps into the edit form pre-filled with that product.
  // The edit page reads ?id= and loads the full record from the backend.
  const onEditProduct = (product) => navigate(`/admin/products/edit?id=${product.id}`)

  const [confirmAction, setConfirmAction] = useState(null)

  // Delete with a confirm dialog; on success removes the row locally (and
  // clears it from any active filters' source list) without a full reload.
  const onDeleteProduct = (product) => {
    const name = typeof product.name === 'object' ? product.name?.en : product.name
    setConfirmAction({
      title: { en: 'Delete Product', kh: 'លុបផលិតផល' },
      message: {
        en: `Are you sure you want to permanently delete "${name || `#${product.id}`}"? This action cannot be undone.`,
        kh: `តើអ្នកពិតជាចង់លុប "${name || `#${product.id}`}" ចេញជាអចិន្ត្រៃយ៍មែនទេ? សកម្មភាពនេះមិនអាចត្រឡប់វិញបានទេ។`,
      },
      confirmText: { en: 'Confirm Delete', kh: 'យល់ព្រមលុប' },
      cancelText: { en: 'Cancel', kh: 'បោះបង់' },
      type: 'danger',
      onConfirm: () => {
        setDeletingId(String(product.id))
        adminProductAPI
          .delete(product.id)
          .then(() => {
            setProducts((prev) => prev.filter((p) => String(p.id) !== String(product.id)))
            setSelected((prev) => {
              const next = new Set(prev)
              next.delete(String(product.id))
              return next
            })
            addNotification({
              type: 'product',
              action: 'delete',
              title: lang === 'en' ? 'Product deleted' : 'បានលុបផលិតផល',
              detail: name,
            })
          })
          .catch((err) => {
            console.error(err)
          })
          .finally(() => setDeletingId(null))
      },
    })
  }

  const [products, setProducts] = useState(DEMO_PRODUCTS)
  const [source, setSource] = useState('demo') // 'live' | 'demo'
  const [query, setQuery] = useState('')
  const [searchBy, setSearchBy] = useState('name') // name | code
  const [status, setStatus] = useState('all') // all | in | low | out
  const [category, setCategory] = useState('all')
  // advanced filter panel
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [brand, setBrand] = useState('all')
  const [supplier, setSupplier] = useState('all')
  const [productType, setProductType] = useState('all')
  // row selection + pagination
  const [selected, setSelected] = useState(new Set())
  const [page, setPage] = useState(1)
  // choose-column modal: draft edits live here until "Apply"
  const [showColModal, setShowColModal] = useState(false)
  const [visibleCols, setVisibleCols] = useState(() => new Set(DEFAULT_COLS))
  const [colDraft, setColDraft] = useState(visibleCols)
  // excel (CSV) import feedback
  const [importResult, setImportResult] = useState(null) // { ok, fail, errors[] }
  const [importing, setImporting] = useState(false)
  // delete flow: id currently being deleted (shows a spinner on its button)
  const [deletingId, setDeletingId] = useState(null)
  const [pageLoading, setPageLoading] = useState(true)

  const mapBackendItem = (item, index) => ({
    id: item.id ?? index,
    name:
      typeof item.name === 'object' && item.name !== null
        ? { en: item.name.en ?? '', kh: item.name.kh ?? item.name.en ?? '' }
        : { en: String(item.name ?? ''), kh: String(item.nameKh ?? item.name ?? '') },
    category: item.category || 'other',
    oldPrice: item.oldPrice ? Number(item.oldPrice) : null,
    // blob: URLs died with the page that created them — drop them so the
    // placeholder shows instead of a permanently broken <img>
    image:
      typeof item.imageUrl === 'string' && item.imageUrl && !item.imageUrl.startsWith('blob:')
        ? item.imageUrl
        : null,
    // full ProductDto passthrough for the extended columns
    code: item.code ?? '',
    barCode: item.barCode ?? '',
    nameKh: typeof item.nameKh === 'string' ? item.nameKh : '',
    description: typeof item.description === 'string' ? item.description : '',
    // onHand defaults to 0 for newly created products until stock is added
    onHand: Number(item.onHand ?? item.stock ?? 0) || 0,
    uom: item.uom ?? '',
    basePrice: Number(item.basePrice ?? item.price) || 0,
    averageCost: item.averageCost ?? '',
    standardCost: item.standardCost ?? '',
    createDate: item.createDate ?? '',
    country: item.country ?? '',
    supplier: item.supplier ?? '',
    partNumber: item.partNumber ?? '',
    brand: item.brand ?? '',
    onPo: item.onPo ?? '',
    onSo: item.onSo ?? '',
    availableStock: item.availableStock ?? '',
    active: item.active !== false,
    serial: item.serial ?? '',
    expiryDate: item.expiryDate ?? '',
    allowDiscount: item.allowDiscount !== false,
    tax: item.tax ?? '',
    outOfStock: !!item.outOfStock,
    favorite: !!item.favorite,
  })

  // Loads from the ADMIN endpoint — the same table AddProducts writes to, so
  // products created there show up here immediately. Falls back silently to
  // the demo catalog when the backend is unreachable or returns nothing.
  const loadProducts = () => {
    adminProductAPI
      .getAll()
      .then((res) => {
        if (Array.isArray(res?.data) && res.data.length > 0) {
          setProducts(res.data.map(mapBackendItem))
          setSource('live')
        }
      })
      .catch(() => {})
      .finally(() => setPageLoading(false))
  }

  useEffect(() => {
    loadProducts()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // stock state helper: out → low (≤ threshold) → in
  const stockState = (stock) => {
    const n = Number(stock) || 0
    if (n <= 0) return 'out'
    if (n <= LOW_STOCK_THRESHOLD) return 'low'
    return 'in'
  }

  // distinct non-empty values of a field, for the advanced filter dropdowns
  const uniqueValues = (field) =>
    [...new Set(products.map((p) => p[field]).filter(Boolean))].sort()

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return products.filter((product) => {
      const matchesCategory = category === 'all' || product.category === category
      const matchesStatus = status === 'all' || stockState(product.onHand) === status
      const matchesBrand = brand === 'all' || (product.brand || '') === brand
      const matchesSupplier = supplier === 'all' || (product.supplier || '') === supplier
      const haystack =
        searchBy === 'code'
          ? `${product.code} ${product.id}`
          : lang === 'kh'
            ? `${product.name.kh} ${product.name.en}`
            : `${product.name.en} ${product.name.kh}`
      const matchesQuery = !q || haystack.toLowerCase().includes(q)
      return matchesCategory && matchesStatus && matchesBrand && matchesSupplier && matchesQuery
    })
  }, [products, query, searchBy, category, status, brand, supplier, lang])

  // KPIs are computed over the whole catalog, not just the current filters.
  const kpis = useMemo(() => {
    let totalValue = 0
    let lowStock = 0
    let outOfStock = 0
    products.forEach((product) => {
      totalValue += (Number(product.basePrice) || 0) * (Number(product.onHand) || 0)
      const state = stockState(product.onHand)
      if (state === 'low') lowStock += 1
      if (state === 'out') outOfStock += 1
    })
    return [
      { key: 'total', label: { en: 'Total Products', kh: 'ផលិតផលសរុប' }, value: String(products.length), icon: <BoxIcon />, tone: 'green', clickable: true },
      { key: 'low', label: { en: 'Low Stock', kh: 'ស្តុកតិច' }, value: String(lowStock), icon: <AlertIcon />, tone: 'orange', clickable: true },
      { key: 'out', label: { en: 'Out of Stock', kh: 'អស់ស្តុក' }, value: String(outOfStock), icon: <XCircleIcon />, tone: 'red', clickable: true },
      { key: 'value', label: { en: 'Total Value', kh: 'តម្លៃសរុប' }, value: formatPrice(totalValue), icon: <DollarIcon />, tone: 'navy', clickable: false },
    ]
  }, [products])

  // KPI widgets act as one-click filters on the table.
  const onKpiClick = (key) => {
    if (key === 'total') { setStatus('all'); setPage(1); return }
    if (key === 'value') return
    setStatus(key)
    setPage(1)
  }

  const usedCategories = useMemo(() => {
    const keys = [...new Set(products.map((product) => product.category).filter(Boolean))]
    return CATEGORIES.filter((c) => keys.includes(c.key))
  }, [products])

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const safePage = Math.min(page, totalPages)
  const paged = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE)

  const allOnPageSelected = paged.length > 0 && paged.every((p) => selected.has(String(p.id)))

  const toggleAllOnPage = () =>
    setSelected((prev) => {
      const next = new Set(prev)
      if (allOnPageSelected) paged.forEach((p) => next.delete(String(p.id)))
      else paged.forEach((p) => next.add(String(p.id)))
      return next
    })

  const toggleOne = (id) =>
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })

  // keep at least one column visible so the table never renders empty-headed
  const toggleColDraft = (key) =>
    setColDraft((prev) => {
      const next = new Set(prev)
      if (next.has(key)) {
        if (next.size > 1) next.delete(key)
      } else {
        next.add(key)
      }
      return next
    })

  const openColModal = () => {
    setColDraft(new Set(visibleCols))
    setShowColModal(true)
  }

  const applyColumns = () => {
    setVisibleCols(new Set(colDraft))
    setShowColModal(false)
  }

  // restore the default column selection inside the open modal
  const resetColumns = () => setColDraft(new Set(DEFAULT_COLS))

  const clearFilters = () => {
    setQuery('')
    setSearchBy('name')
    setStatus('all')
    setCategory('all')
    setBrand('all')
    setSupplier('all')
    setProductType('all')
    setPage(1)
  }

  const activeFilterCount =
    (query ? 1 : 0) +
    (status !== 'all' ? 1 : 0) +
    (category !== 'all' ? 1 : 0) +
    (brand !== 'all' ? 1 : 0) +
    (supplier !== 'all' ? 1 : 0)

  /* ---------- Excel import / export ---------- */

  // Blank template = every DTO column header + one example row.
  const exportTemplate = () => {
    const header = COLUMN_DEFS.map((c) => c.dto)
    const example = ['PRD-001', '888645900001', 'ផលិតផលគំរូ', 'Sample Product', 'Grocery', 'Other', 10, 'piece', 2.5, 1.8, 2.0, '2026-01-01', 'Cambodia', '', 'PN-0001', 'Generic', 0, 0, 10, true, '', '2026-12-31', true, 0, false, false]
    exportStyledExcel({
      filename: 'b-groceries-product-template.xlsx',
      sheetName: 'Products Template',
      title: 'PRODUCT IMPORT TEMPLATE',
      subtitle: 'Use this template to import new products or update stock attributes',
      headers: header,
      data: [example],
    })
  }

  const exportCurrent = () => {
    const cols = COLUMN_DEFS.filter((c) => visibleCols.has(c.key))
    const header = cols.map((c) => (typeof c.label === 'object' ? c.label.en : c.label || c.dto))
    const rows = filtered.map((p) =>
      cols.map((c) => (c.bool ? (p[c.key] ? 'Active' : 'Inactive') : p[c.key] ?? ''))
    )
    exportStyledExcel({
      filename: 'b-groceries-products-inventory.xlsx',
      sheetName: 'Products',
      title: 'PRODUCTS & INVENTORY CATALOG REPORT',
      subtitle: `Category: ${category} · Brand: ${brand} · Supplier: ${supplier} · Status: ${status}`,
      headers: header,
      data: rows,
      summary: {
        'Total Products': rows.length,
        'Active': filtered.filter((p) => p.status === 'active' || p.active !== false).length,
      },
    })
  }

  const handleImportFile = async (e) => {
    const file = e.target.files?.[0]
    e.target.value = '' // allow re-selecting the same file
    if (!file) return
    setImporting(true)
    setImportResult(null)
    try {
      const { headers, rows } = await readExcel(file)
      if (rows.length < 1) throw new Error(lang === 'en' ? 'File has no data rows.' : 'ឯកសារគ្មានទិន្នន័យ។')

      // map header row → DTO fields via aliases; unknown headers are skipped
      const colMap = headers.map((h) => HEADER_ALIASES[h.toLowerCase().replace(/[^a-z0-9]/g, '')] || null)
      const errors = []
      let ok = 0
      for (let i = 0; i < rows.length; i++) {
        const cells = rows[i]
        const record = {}
        colMap.forEach((dto, idx) => {
          if (dto && cells[idx] !== undefined && cells[idx] !== '') record[dto] = cells[idx]
        })
        const name = String(record.name || '').trim()
        if (!name) { errors.push(`Row ${i + 2}: missing Description`); continue }
        const numeric = ['onHand', 'basePrice', 'averageCost', 'standardCost', 'tax']
        numeric.forEach((f) => { if (f in record) record[f] = numOrEmpty(record[f]) })
        ;['active', 'allowDiscount'].forEach((f) => { if (f in record) record[f] = truthy(record[f]) })
        ;['outOfStock', 'favorite'].forEach((f) => { if (f in record) record[f] = truthy(record[f]) })
        try {
          await adminProductAPI.create({
            active: true,
            allowDiscount: true,
            ...record,
            expiryDate: record.expiryDate || null,
          })
          ok += 1
        } catch (err) {
          errors.push(`Row ${i + 2}: ${err.message}`)
        }
      }
      setImportResult({ ok, fail: errors.length, errors: errors.slice(0, 5) })
      if (ok > 0) {
        addNotification({
          type: 'product',
          action: 'add',
          title: lang === 'en' ? `${ok} product(s) imported` : `បាននាំចូលផលិតផល ${ok}`,
          detail: file.name,
        })
        // refresh the table with the newly created products
        loadProducts()
      }
    } catch (err) {
      setImportResult({ ok: 0, fail: 1, errors: [err.message] })
    } finally {
      setImporting(false)
    }
  }

  const categoryLabel = (key) => {
    const cat = CATEGORIES.find((c) => c.key === key)
    if (!cat) return key
    return lang === 'kh' ? cat.kh : cat.en
  }

  const STATUS_META = {
    in: { label: { en: 'In Stock', kh: 'មានស្តុក' }, color: '#A3E635', bg: 'rgba(119,188,31,0.15)' },
    low: { label: { en: 'Low Stock', kh: 'ស្តុកតិច' }, color: ORANGE, bg: 'rgba(255,153,0,0.15)' },
    out: { label: { en: 'Out of Stock', kh: 'អស់ស្តុក' }, color: '#FB7185', bg: 'rgba(244,63,94,0.15)' },
  }

  const TEXTS = {
    back: { en: 'Stocks', kh: 'ស្តុក' },
    heroTitle: { en: 'All Products', kh: 'ផលិតផលទាំងអស់' },
    heroSub: {
      en: 'Every product in the B\'Groceries catalog — search, filter, import and export.',
      kh: 'ផលិតផលទាំងអស់ក្នុងកាតាឡុក — ស្វែងរក ត្រង នាំចូល និងនាំចេញ។',
    },
    liveData: { en: 'Live data', kh: 'ទិន្នន័យផ្ទាល់' },
    demoData: { en: 'Demo catalog', kh: 'កាតាឡុកសាកល្បង' },
    createProduct: { en: 'Create Product', kh: 'បង្កើតផលិតផល' },
    importBtn: { en: 'Import Excel', kh: 'នាំចូល Excel' },
    templateBtn: { en: 'Export Template', kh: 'នាំចេញទំព័រគំរូ' },
    exportBtn: { en: 'Export', kh: 'នាំចេញ' },
    importing: { en: 'Importing…', kh: 'កំពុងនាំចូល…' },
    searchByLabel: { en: 'Search By', kh: 'ស្វែងរកដោយ' },
    searchPlaceholder: { en: 'Search products…', kh: 'ស្វែងរកផលិតផល…' },
    byName: { en: 'Name', kh: 'ឈ្មោះ' },
    byCode: { en: 'Code', kh: 'កូដ' },
    onhandLabel: { en: 'Onhand', kh: 'ស្តុកនៅសល់' },
    allCats: { en: 'All categories', kh: 'ប្រភេទទាំងអស់' },
    allOnhand: { en: 'All onhand', kh: 'ស្តុកទាំងអស់' },
    filters: { en: 'Filters', kh: 'តម្រង' },
    clearFilters: { en: 'Clear Filters', kh: 'សម្អាតតម្រង' },
    productType: { en: 'Product Type', kh: 'ប្រភេទផលិតផល' },
    brand: { en: 'Brand', kh: 'ម៉ាក' },
    supplier: { en: 'Supplier', kh: 'អ្នកផ្គត់ផ្គង់' },
    allTypes: { en: 'All types', kh: 'ប្រភេទទាំងអស់' },
    allBrands: { en: 'All brands', kh: 'ម៉ាកទាំងអស់' },
    allSuppliers: { en: 'All suppliers', kh: 'អ្នកផ្គត់ផ្គង់ទាំងអស់' },
    chooseColumn: { en: 'Choose Column', kh: 'ជ្រើសរើសជួរឈរ' },
    resetCols: { en: 'Reset to Normal', kh: 'កំណត់ឡើងវិញតាមដើម' },
    cancel: { en: 'Cancel', kh: 'បោះបង់' },
    apply: { en: 'Apply', kh: 'អនុវត្ត' },
    colProduct: { en: 'Product', kh: 'ផលិតផល' },
    colCategory: { en: 'Category', kh: 'ប្រភេទ' },
    colStatus: { en: 'Status', kh: 'ស្ថានភាព' },
    showing: { en: 'Showing', kh: 'បង្ហាញ' },
    of: { en: 'of', kh: 'ក្នុងចំណោម' },
    productsWord: { en: 'products', kh: 'ផលិតផល' },
    selected: { en: 'selected', kh: 'បានជ្រើសរើស' },
    noResults: { en: 'No products match your filters.', kh: 'គ្មានផលិតផលត្រូវនឹងការត្រងទេ។' },
    prev: { en: 'Previous', kh: 'មុន' },
    next: { en: 'Next', kh: 'បន្ទាប់' },
    units: { en: 'units', kh: 'ឯកតា' },
    edit: { en: 'Edit', kh: 'កែប្រែ' },
    delete: { en: 'Delete', kh: 'លុប' },
    importOk: { en: 'imported', kh: 'បាននាំចូល' },
    importFail: { en: 'failed', kh: 'បរាជ័យ' },
  }

  // shared dark select styling — green focus ring
  const selectCls = 'w-full rounded-lg border border-slate-700/70 bg-slate-950/60 px-3 py-2.5 text-sm font-medium text-white outline-none transition focus:border-green-400 focus:bg-slate-950 focus:ring-4 focus:ring-green-500/10 hover:border-slate-600'
  const ghostBtnCls = 'inline-flex items-center justify-center gap-2 rounded-lg border border-slate-700 px-3.5 py-2.5 text-xs font-bold text-slate-300 transition hover:border-slate-600 hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-40'

  // cell renderer per column key (used by both thead labels and tbody cells)
  const renderCell = (product, key) => {
    switch (key) {
      case 'name':
        return (
          <button type="button" onClick={() => onEditProduct(product)} className="flex items-center gap-3 text-left" title={lang === 'en' ? 'Click to edit this product' : 'ចុចដើម្បីកែប្រែផលិតផលនេះ'}>
            {product.image ? (
              <img src={product.image} alt="" className="h-10 w-10 flex-shrink-0 rounded-lg object-cover ring-1 ring-slate-700" onError={(e) => {
                // broken URL (e.g. truncated legacy upload) — swap to the placeholder
                e.currentTarget.outerHTML = '<span class="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg text-lg ring-1 ring-slate-700" style="background-color:rgba(119,188,31,0.12)">🥫</span>'
              }} />
            ) : (
              <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg text-lg ring-1 ring-slate-700" style={{ backgroundColor: 'rgba(119,188,31,0.12)' }}>🥫</span>
            )}
            <span className="min-w-0">
              <span className="block max-w-[240px] truncate font-semibold text-white">{(lang === 'kh' ? product.name?.kh : product.name?.en) || '—'}</span>
            </span>
          </button>
        )
      case 'category':
        return <span className="text-slate-400">{categoryLabel(product.category)}</span>
      case 'status': {
        const meta = STATUS_META[stockState(product.onHand)]
        return (
          <span className="inline-block rounded-full px-2.5 py-1 text-[11px] font-bold" style={{ backgroundColor: meta.bg, color: meta.color }}>
            {meta.label[lang]}
          </span>
        )
      }
      case 'onHand':
        return (
          <span className="inline-flex items-center gap-1.5 font-semibold text-white">
            {stockState(product.onHand) === 'low' && <span style={{ color: ORANGE }}><AlertIcon size={13} /></span>}
            {Number(product.onHand) || 0} <span className="text-xs font-normal text-slate-500">{TEXTS.units[lang]}</span>
          </span>
        )
      case 'basePrice':
        return (
          <span className="font-semibold text-white">
            {formatPrice(product.basePrice)}
            {product.oldPrice > product.basePrice && (
              <span className="ml-1.5 text-xs line-through text-slate-600">{formatPrice(product.oldPrice)}</span>
            )}
          </span>
        )
      case 'barcode':
        return <span className="font-mono text-xs text-slate-300">{product.barCode || `#${product.id}`}</span>
      default: {
        const def = COLUMN_DEFS.find((c) => c.key === key)
        const value = def?.bool ? (product[key] ? '✓' : '✗') : (product[key] ?? '')
        return <span className={def?.bool ? 'font-semibold' : ''} style={{ color: def?.bool ? (product[key] ? GREEN : '#FB7185') : undefined }}>{value || '—'}</span>
      }
    }
  }

  // columns actually rendered: user-picked defs first, then the Status pill
  const activeCols = [
    ...COLUMN_DEFS.filter((c) => visibleCols.has(c.key)),
    ...(visibleCols.has('status') ? [{ key: 'status', label: TEXTS.colStatus }] : []),
  ]

  return (
    <PageLoader loading={pageLoading} message={lang === 'en' ? 'Loading products…' : 'កំពុងផ្ទុកផលិតផល…'}>
    <div className="space-y-5">
      {/* Page header */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <Link to="/admin/products" className="mb-2 inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-[0.16em] text-green-400 transition hover:text-green-300">
            <ChevronLeftIcon /> {TEXTS.back[lang]}
          </Link>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-extrabold tracking-tight text-white md:text-3xl">{TEXTS.heroTitle[lang]}</h1>
            <span
              className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-bold"
              style={source === 'live'
                ? { backgroundColor: 'rgba(119,188,31,0.15)', color: GREEN }
                : { backgroundColor: 'rgba(255,153,0,0.15)', color: ORANGE }}
            >
              ● {source === 'live' ? TEXTS.liveData[lang] : TEXTS.demoData[lang]}
            </span>
          </div>
          <p className="mt-1 max-w-2xl text-sm text-slate-400">{TEXTS.heroSub[lang]}</p>
        </div>
        {/* Import / Template / Export / Create */}
        <div className="flex flex-wrap items-center gap-2">
          <input ref={importRef} type="file" accept=".xlsx,.xls,.csv" onChange={handleImportFile} className="hidden" />
          <button type="button" onClick={() => importRef.current?.click()} disabled={importing} className={ghostBtnCls}>
            <UploadIcon /> {importing ? TEXTS.importing[lang] : TEXTS.importBtn[lang]}
          </button>
          <button type="button" onClick={exportTemplate} className={ghostBtnCls}>
            <TemplateIcon /> {TEXTS.templateBtn[lang]}
          </button>
          <button type="button" onClick={exportCurrent} className={ghostBtnCls}>
            <DownloadIcon /> {TEXTS.exportBtn[lang]}
          </button>
          <Link
            to="/admin/products/add"
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-green-500 px-5 py-2.5 text-sm font-black text-slate-950 shadow-lg shadow-green-500/20 transition hover:-translate-y-0.5 hover:bg-green-400"
          >
            <PlusIcon /> {TEXTS.createProduct[lang]}
          </Link>
        </div>
      </div>

      {/* Import result banner */}
      {importResult && (
        <div className={`rounded-xl border px-4 py-3 text-sm ${importResult.fail > 0 ? 'border-orange-500/40 bg-orange-500/10' : 'border-green-500/40 bg-green-500/10'}`}>
          <p className="font-bold" style={{ color: importResult.fail > 0 ? ORANGE : GREEN }}>
            ✓ {importResult.ok} {TEXTS.importOk[lang]} · {importResult.fail} {TEXTS.importFail[lang]}
          </p>
          {importResult.errors.length > 0 && (
            <ul className="mt-1 space-y-0.5 text-xs text-slate-400">
              {importResult.errors.map((err, i) => <li key={i}>• {err}</li>)}
            </ul>
          )}
        </div>
      )}

      {/* KPI widgets */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {kpis.map((kpi) => (
          <button
            key={kpi.key}
            type="button"
            onClick={() => onKpiClick(kpi.key)}
            disabled={!kpi.clickable}
            className={`flex items-center gap-4 rounded-2xl border border-slate-700/60 bg-slate-900/80 p-5 text-left shadow-xl shadow-black/20 transition ${kpi.clickable ? 'cursor-pointer hover:-translate-y-0.5 hover:border-green-500/40' : 'cursor-default'}`}
          >
            <span
              className="flex h-12 w-12 min-w-[48px] items-center justify-center rounded-xl"
              style={{
                backgroundColor:
                  kpi.tone === 'orange' ? 'rgba(255,153,0,0.15)'
                    : kpi.tone === 'red' ? 'rgba(244,63,94,0.15)'
                      : kpi.tone === 'navy' ? 'rgba(148,163,184,0.12)'
                        : 'rgba(119,188,31,0.15)',
                color:
                  kpi.tone === 'orange' ? ORANGE
                    : kpi.tone === 'red' ? '#FB7185'
                      : kpi.tone === 'navy' ? '#CBD5E1'
                        : GREEN,
              }}
            >
              {kpi.icon}
            </span>
            <span className="min-w-0">
              <span className="block truncate text-2xl font-extrabold leading-tight text-white">{kpi.value}</span>
              <span className="block text-xs font-semibold text-slate-400">{kpi.label[lang]}</span>
            </span>
          </button>
        ))}
      </div>

      {/* Data table card */}
      <section className="overflow-hidden rounded-2xl border border-slate-700/60 bg-slate-900/80 shadow-xl shadow-black/20">
        {/* Filter bar */}
        <div className="flex flex-col gap-3 border-b border-slate-700/60 p-4 lg:flex-row lg:items-center">
          {/* Search By dropdown */}
          <select
            value={searchBy}
            onChange={(e) => setSearchBy(e.target.value)}
            aria-label={TEXTS.searchByLabel[lang]}
            className={`${selectCls} w-full sm:w-auto sm:min-w-[130px]`}
          >
            <option value="name">{TEXTS.searchByLabel[lang]}: {TEXTS.byName[lang]}</option>
            <option value="code">{TEXTS.searchByLabel[lang]}: {TEXTS.byCode[lang]}</option>
          </select>

          {/* Search input */}
          <div className="relative min-w-0 flex-1">
            <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500"><SearchIcon /></span>
            <input
              type="text"
              value={query}
              onChange={(e) => { setQuery(e.target.value); setPage(1) }}
              placeholder={TEXTS.searchPlaceholder[lang]}
              className="w-full rounded-lg border border-slate-700/70 bg-slate-950/60 py-2.5 pl-10 pr-4 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-green-400 focus:bg-slate-950 focus:ring-4 focus:ring-green-500/10"
            />
          </div>

          {/* Onhand dropdown */}
          <select
            value={status}
            onChange={(e) => { setStatus(e.target.value); setPage(1) }}
            aria-label={TEXTS.onhandLabel[lang]}
            className={`${selectCls} w-full sm:w-auto sm:min-w-[150px]`}
          >
            <option value="all">{TEXTS.allOnhand[lang]}</option>
            <option value="in">{STATUS_META.in.label[lang]}</option>
            <option value="low">{STATUS_META.low.label[lang]}</option>
            <option value="out">{STATUS_META.out.label[lang]}</option>
          </select>

          {/* Advanced filters toggle + active-count badge */}
          <button
            type="button"
            onClick={() => setShowAdvanced((v) => !v)}
            aria-expanded={showAdvanced}
            className={`inline-flex items-center justify-center gap-2 rounded-lg border px-4 py-2.5 text-sm font-bold transition ${showAdvanced || activeFilterCount > 0 ? 'border-green-400 text-green-300' : 'border-slate-700 text-slate-300 hover:border-slate-600 hover:bg-slate-800'}`}
          >
            <FunnelIcon /> {TEXTS.filters[lang]}
            {activeFilterCount > 0 && (
              <span className="rounded-full bg-green-500 px-1.5 py-0.5 text-[10px] font-black leading-none text-slate-950">{activeFilterCount}</span>
            )}
          </button>

          {/* Choose Column trigger */}
          <button
            type="button"
            onClick={openColModal}
            title={TEXTS.chooseColumn[lang]}
            className={ghostBtnCls}
          >
            <ColumnsIcon /> <span className="hidden xl:inline">{TEXTS.chooseColumn[lang]}</span>
          </button>
        </div>

        {/* Advanced filter panel */}
        {showAdvanced && (
          <div className="border-b border-slate-700/60 bg-slate-800/30 p-4">
            <div className="mb-3 flex items-center justify-between">
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">{TEXTS.filters[lang]}</p>
              <button
                type="button"
                onClick={clearFilters}
                className="text-xs font-bold underline-offset-2 transition hover:underline"
                style={{ color: ORANGE }}
              >
                {TEXTS.clearFilters[lang]}
              </button>
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <label className="block space-y-1.5">
                <span className="text-xs font-bold uppercase tracking-wide text-slate-400">{TEXTS.productType[lang]}</span>
                <select value={productType} onChange={(e) => { setProductType(e.target.value); setPage(1) }} className={selectCls}>
                  <option value="all">{TEXTS.allTypes[lang]}</option>
                  {uniqueValues('productGroup').map((v) => <option key={v} value={v}>{v}</option>)}
                </select>
              </label>
              <label className="block space-y-1.5">
                <span className="text-xs font-bold uppercase tracking-wide text-slate-400">{TEXTS.brand[lang]}</span>
                <select value={brand} onChange={(e) => { setBrand(e.target.value); setPage(1) }} className={selectCls}>
                  <option value="all">{TEXTS.allBrands[lang]}</option>
                  {uniqueValues('brand').map((v) => <option key={v} value={v}>{v}</option>)}
                </select>
              </label>
              <label className="block space-y-1.5">
                <span className="text-xs font-bold uppercase tracking-wide text-slate-400">{TEXTS.colCategory[lang]}</span>
                <select value={category} onChange={(e) => { setCategory(e.target.value); setPage(1) }} className={selectCls}>
                  <option value="all">{TEXTS.allCats[lang]}</option>
                  {usedCategories.map((cat) => (
                    <option key={cat.key} value={cat.key}>{lang === 'kh' ? cat.kh : cat.en}</option>
                  ))}
                </select>
              </label>
              <label className="block space-y-1.5">
                <span className="text-xs font-bold uppercase tracking-wide text-slate-400">{TEXTS.supplier[lang]}</span>
                <select value={supplier} onChange={(e) => { setSupplier(e.target.value); setPage(1) }} className={selectCls}>
                  <option value="all">{TEXTS.allSuppliers[lang]}</option>
                  {uniqueValues('supplier').map((v) => <option key={v} value={v}>{v}</option>)}
                </select>
              </label>
            </div>
          </div>
        )}

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead>
              <tr className="border-b border-slate-700/60 bg-slate-800/40 text-xs font-bold uppercase tracking-wide text-slate-500">
                <th className="w-12 px-4 py-3">
                  <input
                    type="checkbox"
                    checked={allOnPageSelected}
                    onChange={toggleAllOnPage}
                    aria-label={lang === 'en' ? 'Select all on page' : 'ជ្រើសរើសទាំងអស់'}
                    className="h-4 w-4 cursor-pointer rounded accent-green-500"
                  />
                </th>
                {activeCols.map((col) => (
                  <th key={col.key} className="whitespace-nowrap px-3 py-3">
                    {typeof col.label === 'object' ? col.label[lang] : col.label}
                  </th>
                ))}
                <th className="w-20 px-3 py-3" />
              </tr>
            </thead>
            <tbody>
              {paged.length === 0 ? (
                <tr>
                  <td colSpan={2 + activeCols.length} className="px-4 py-16 text-center">
                    <span className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-slate-800 text-slate-500"><SearchIcon /></span>
                    <p className="text-sm text-slate-400">{TEXTS.noResults[lang]}</p>
                  </td>
                </tr>
              ) : (
                paged.map((product) => {
                  const idStr = String(product.id)
                  return (
                    <tr key={product.id} className={`border-b border-slate-800/60 transition last:border-0 ${selected.has(idStr) ? 'bg-green-500/[0.06]' : 'hover:bg-slate-800/40'}`}>
                      <td className="px-4 py-3">
                        <input
                          type="checkbox"
                          checked={selected.has(idStr)}
                          onChange={() => toggleOne(idStr)}
                          aria-label={(lang === 'en' ? 'Select ' : 'ជ្រើសរើស ') + (product.name?.en || '')}
                          className="h-4 w-4 cursor-pointer rounded accent-green-500"
                        />
                      </td>
                      {activeCols.map((col) => (
                        <td key={col.key} className="whitespace-nowrap px-3 py-3">
                          {renderCell(product, col.key)}
                        </td>
                      ))}
                      <td className="px-3 py-3">
                        <span className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => onEditProduct(product)}
                            aria-label={TEXTS.edit[lang]}
                            title={TEXTS.edit[lang]}
                            className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 transition hover:bg-slate-800 hover:text-green-300"
                          >
                            <EditIcon />
                          </button>
                          <button
                            type="button"
                            onClick={() => onDeleteProduct(product)}
                            disabled={deletingId === String(product.id)}
                            aria-label={TEXTS.delete[lang]}
                            title={TEXTS.delete[lang]}
                            style={{ color: ORANGE }}
                            className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 transition hover:bg-slate-800 hover:scale-110 disabled:cursor-not-allowed disabled:opacity-40"
                          >
                            {deletingId === String(product.id) ? <SpinnerIcon /> : <TrashIcon />}
                          </button>
                        </span>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex flex-col gap-3 border-t border-slate-700/60 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-slate-500">
            {filtered.length > 0
              ? `${TEXTS.showing[lang]} ${(safePage - 1) * PAGE_SIZE + 1}–${Math.min(safePage * PAGE_SIZE, filtered.length)} ${TEXTS.of[lang]} ${filtered.length} ${TEXTS.productsWord[lang]}`
              : ''}
            {selected.size > 0 && (
              <span className="ml-2 inline-block rounded-full px-2 py-0.5 text-[11px] font-bold" style={{ backgroundColor: 'rgba(119,188,31,0.15)', color: GREEN }}>
                {selected.size} {TEXTS.selected[lang]}
              </span>
            )}
          </p>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={safePage <= 1}
              className="rounded-lg border border-slate-700 px-3 py-1.5 text-xs font-semibold text-slate-300 transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {TEXTS.prev[lang]}
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1)
              .filter((n) => n === 1 || n === totalPages || Math.abs(n - safePage) <= 1)
              .map((n, idx, arr) => (
                <span key={n} className="flex items-center gap-1.5">
                  {idx > 0 && arr[idx - 1] !== n - 1 && <span className="px-0.5 text-xs text-slate-600">…</span>}
                  <button
                    type="button"
                    onClick={() => setPage(n)}
                    aria-current={safePage === n ? 'page' : undefined}
                    className={`h-8 min-w-8 rounded-lg px-2 text-xs font-bold transition ${
                      safePage === n
                        ? 'bg-green-500 text-slate-950 shadow-md shadow-green-500/20'
                        : 'border border-slate-700 text-slate-300 hover:bg-slate-800'
                    }`}
                  >
                    {n}
                  </button>
                </span>
              ))}
            <button
              type="button"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={safePage >= totalPages}
              className="rounded-lg border border-slate-700 px-3 py-1.5 text-xs font-semibold text-slate-300 transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {TEXTS.next[lang]}
            </button>
          </div>
        </div>
      </section>

      {/* Choose Column modal */}
      {showColModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center modal-overlay p-3 sm:p-4"
          onClick={() => setShowColModal(false)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-label={TEXTS.chooseColumn[lang]}
            className="max-h-[85vh] w-full max-w-xl overflow-hidden rounded-2xl border border-slate-700/80 bg-slate-900 shadow-2xl shadow-black/60 modal-panel"
            onClick={(e) => e.stopPropagation()}
          >
            {/* header */}
            <div className="flex items-center justify-between border-b border-slate-700/60 px-5 py-4">
              <h3 className="text-base font-extrabold text-white">{TEXTS.chooseColumn[lang]}</h3>
              <button
                type="button"
                onClick={() => setShowColModal(false)}
                aria-label={TEXTS.cancel[lang]}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 transition hover:bg-slate-800 hover:text-white"
              >
                <XSmallIcon />
              </button>
            </div>

            {/* two-column checkbox grid (scrollable — 27 columns) */}
            <div className="grid max-h-[55vh] grid-cols-1 gap-x-6 gap-y-1 overflow-y-auto p-5 sm:grid-cols-2">
              {/* Status pill column (derived, not a DTO field) */}
              <label className={`flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2 text-sm font-semibold transition ${colDraft.has('status') ? 'text-white' : 'text-slate-400'} hover:bg-slate-800`}>
                <input type="checkbox" checked={colDraft.has('status')} onChange={() => toggleColDraft('status')} className="h-4 w-4 cursor-pointer rounded accent-green-500" />
                {TEXTS.colStatus[lang]}
              </label>
              {COLUMN_DEFS.map((col) => {
                const checked = colDraft.has(col.key)
                return (
                  <label
                    key={col.key}
                    className={`flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2 text-sm font-semibold transition ${checked ? 'text-white' : 'text-slate-400'} hover:bg-slate-800`}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggleColDraft(col.key)}
                      className="h-4 w-4 cursor-pointer rounded accent-green-500"
                    />
                    {col.label[lang]}
                  </label>
                )
              })}
            </div>

            {/* footer actions */}
            <div className="flex items-center justify-between gap-3 border-t border-slate-700/60 px-5 py-4">
              <button
                type="button"
                onClick={resetColumns}
                title={TEXTS.resetCols[lang]}
                className="inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-bold transition hover:bg-slate-800"
                style={{ color: ORANGE }}
              >
                <ResetIcon /> {TEXTS.resetCols[lang]}
              </button>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setShowColModal(false)}
                  className="rounded-lg border border-slate-700 px-5 py-2 text-sm font-bold text-slate-300 transition hover:bg-slate-800"
                >
                  {TEXTS.cancel[lang]}
                </button>
              <button
                type="button"
                onClick={applyColumns}
                className="rounded-lg bg-green-500 px-5 py-2 text-sm font-black text-slate-950 shadow-md shadow-green-500/20 transition hover:bg-green-400"
              >
                {TEXTS.apply[lang]}
              </button>
              </div>
            </div>
          </div>
        </div>
      )}

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
    </div>
    </PageLoader>
  )
}

/* ---------- icons ---------- */

const ChevronLeftIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
    <polyline points="15 18 9 12 15 6" />
  </svg>
)

const PlusIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
    <line x1="12" y1="5" x2="12" y2="19" />
    <line x1="5" y1="12" x2="19" y2="12" />
  </svg>
)

const SearchIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
    <circle cx="11" cy="11" r="7" />
    <line x1="21" y1="21" x2="16.5" y2="16.5" />
  </svg>
)

const FunnelIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
  </svg>
)

const ColumnsIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <rect x="3" y="3" width="18" height="18" rx="2" />
    <line x1="9" y1="3" x2="9" y2="21" />
    <line x1="15" y1="3" x2="15" y2="21" />
  </svg>
)

const XSmallIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
)

const UploadIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    <polyline points="17 8 12 3 7 8" />
    <line x1="12" y1="3" x2="12" y2="15" />
  </svg>
)

const DownloadIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    <polyline points="7 10 12 15 17 10" />
    <line x1="12" y1="15" x2="12" y2="3" />
  </svg>
)

const TemplateIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <rect x="3" y="3" width="18" height="18" rx="2" />
    <line x1="3" y1="9" x2="21" y2="9" />
    <line x1="9" y1="9" x2="9" y2="21" />
  </svg>
)

const ResetIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
    <path d="M3 12a9 9 0 1 0 2.64-6.36L3 8" />
    <polyline points="3 3 3 8 8 8" />
  </svg>
)

const BoxIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <line x1="16.5" y1="9.4" x2="7.5" y2="4.21" />
    <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
    <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
    <line x1="12" y1="22.08" x2="12" y2="12" />
  </svg>
)

const AlertIcon = ({ size = 22 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
    <line x1="12" y1="9" x2="12" y2="13" />
    <line x1="12" y1="17" x2="12.01" y2="17" />
  </svg>
)

const XCircleIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <circle cx="12" cy="12" r="10" />
    <line x1="15" y1="9" x2="9" y2="15" />
    <line x1="9" y1="9" x2="15" y2="15" />
  </svg>
)

const DollarIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <line x1="12" y1="1" x2="12" y2="23" />
    <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
  </svg>
)

const EditIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
  </svg>
)

const TrashIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <polyline points="3 6 5 6 21 6" />
    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
    <line x1="10" y1="11" x2="10" y2="17" />
    <line x1="14" y1="11" x2="14" y2="17" />
  </svg>
)

const SpinnerIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" className="animate-spin">
    <path d="M21 12a9 9 0 1 1-6.2-8.56" />
  </svg>
)
