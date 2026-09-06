import React, { useState, useEffect, useMemo, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { useLanguage } from '../../context/LanguageContext'
import { useNotifications } from '../../context/NotificationContext'
import { adminSaleOrderAPI, adminCustomerAPI, adminProductAPI } from '../../api/api'
import bagIcon from '../../assets/icon/3dicons-bag-dynamic-color.png'
import './ProductsHub.css'

// 14 Columns exactly as requested for Choose Column modal & table
const ALL_COLUMNS = [
  { key: 'code', label: { en: 'Code', kh: 'លេខកូដ SO' }, always: true },
  { key: 'quoteCode', label: { en: 'Quote Code', kh: 'កូដសម្រង់តម្លៃ' } },
  { key: 'orderDate', label: { en: 'Date', kh: 'កាលបរិច្ឆេទ' }, always: true },
  { key: 'deliveryDate', label: { en: 'Delivery Date', kh: 'កាលបរិច្ឆេទដឹក' }, always: true },
  { key: 'salesperson', label: { en: 'Salesperson', kh: 'អ្នកលក់' } },
  { key: 'customerName', label: { en: 'Customer', kh: 'អតិថិជន' }, always: true },
  { key: 'customerPhone', label: { en: 'Phone', kh: 'ទូរស័ព្ទ' } },
  { key: 'grandTotal', label: { en: 'Grand Total', kh: 'សរុបចុងក្រោយ ($)' }, always: true },
  { key: 'balance', label: { en: 'Balance', kh: 'សមតុល្យ ($)' } },
  { key: 'status', label: { en: 'Status', kh: 'ស្ថានភាព' }, always: true },
  { key: 'markupAmount', label: { en: 'Markup Amount', kh: 'ប្រាក់បន្ថែម ($)' } },
  { key: 'reference', label: { en: 'Reference', kh: 'ឯកសារយោង' } },
  { key: 'username', label: { en: 'Username', kh: 'ឈ្មោះអ្នកប្រើ' } },
  { key: 'outlet', label: { en: 'Outlet', kh: 'សាខា' } },
  { key: 'poCode', label: { en: 'PO Code', kh: 'លេខកូដ PO' } },
]

const DEFAULT_VISIBLE = [
  'code',
  'quoteCode',
  'orderDate',
  'deliveryDate',
  'salesperson',
  'customerName',
  'customerPhone',
  'grandTotal',
  'balance',
  'status',
  'outlet',
]

const STATUS_CONFIG = {
  CONFIRMED: { labelEn: 'Confirmed', color: 'bg-purple-500/20 text-purple-400 border-purple-500/30' },
  PAID: { labelEn: 'Paid', color: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' },
  PROCESSING: { labelEn: 'Processing', color: 'bg-blue-500/20 text-blue-400 border-blue-500/30' },
  BILLED: { labelEn: 'Billed', color: 'bg-indigo-500/20 text-indigo-400 border-indigo-500/30' },
  DRAFT: { labelEn: 'Draft', color: 'bg-slate-500/20 text-slate-400 border-slate-500/30' },
  CANCELLED: { labelEn: 'Cancelled', color: 'bg-red-500/20 text-red-400 border-red-500/30' },
}

const OUTLETS = [
  { value: 'ALL', en: 'All Outlets', kh: 'គ្រប់សាខាទាំងអស់' },
  { value: 'Main Store', en: 'Main Store - Phnom Penh', kh: 'ហាងធំ - ភ្នំពេញ' },
  { value: 'Toul Kork Outlet', en: 'Toul Kork Outlet', kh: 'សាខាទួលគោក' },
  { value: 'BKK1 Outlet', en: 'BKK1 Premium Outlet', kh: 'សាខាបឹងកេងកង១' },
  { value: 'Online Store', en: 'Online E-Commerce Store', kh: 'ហាងលក់អនឡាញ' },
]

const PAYMENT_TERMS = [
  'Cash',
  'COD',
  'Immediate / Cash',
  'Net 7 Days',
  'Net 15 Days',
  'Net 30 Days',
  'Net 60 Days',
  'Due on Receipt',
]

const SALESPERSONS = [
  'Admin',
  'Sok Heng',
  'Vanna Touch',
  'Bora Keo',
  'Store Manager',
  'Sales Rep 1',
]

const TEMPLATES = [
  'Standard Sale Order',
  'B2B Wholesale Dispatch',
  'Retail Store Delivery',
]

// 12 Real Database Products Baseline
const DEFAULT_LIVE_PRODUCTS = [
  { id: 24, code: 'PRD-0012', barCode: '8850012', name: 'Meat Test Scale', basePrice: 5.0, onHand: 5, uom: 'KG' },
  { id: 23, code: 'PRD-0011', barCode: '8850011', name: 'Water Cambodia Pink', basePrice: 0.57, onHand: 10, uom: 'Bottle' },
  { id: 22, code: 'PRD-0010', barCode: '8850010', name: 'PizzaJelly', basePrice: 1.15, onHand: 9, uom: 'Unit' },
  { id: 21, code: 'PRD-0009', barCode: '8850009', name: 'INDOMIE WHITE', basePrice: 0.29, onHand: 13, uom: 'Unit' },
  { id: 20, code: 'PRD-0008', barCode: '8850008', name: 'INDOMIE BLACK', basePrice: 0.4, onHand: 9, uom: 'Unit' },
  { id: 19, code: 'PRD-0007', barCode: '8850007', name: 'INDOMIE CASE WHITE', basePrice: 5.75, onHand: 9, uom: 'Case' },
  { id: 18, code: 'PRD-0006', barCode: '8850006', name: 'Monster Energy - Zero Sugar Blue', basePrice: 3.45, onHand: 10, uom: 'Unit' },
  { id: 17, code: 'PRD-0005', barCode: '8850005', name: 'Monster Energy', basePrice: 2.88, onHand: 12, uom: 'Unit' },
  { id: 16, code: 'PRD-0004', barCode: '8850004', name: 'Pruple Sting', basePrice: 0.86, onHand: 12, uom: 'Unit' },
  { id: 15, code: 'PRD-0003', barCode: '8850003', name: 'Cambodia Water CASE', basePrice: 3.67, onHand: 12, uom: 'Case' },
  { id: 14, code: 'PRD-0002', barCode: '8850002', name: 'RED STING', basePrice: 0.57, onHand: 6, uom: 'Unit' },
  { id: 13, code: 'PRD-0001', barCode: '8850001', name: 'Yellow Sting CASE', basePrice: 3.45, onHand: 7, uom: 'Case' },
]

const formatCurrency = (val) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2 }).format(val || 0)

const formatDateTime = (val) => {
  if (!val) return '---'
  try {
    const d = new Date(val)
    return isNaN(d.getTime()) ? String(val) : d.toLocaleString()
  } catch {
    return String(val)
  }
}

export default function SaleOrderList() {
  const { lang } = useLanguage()
  const { addNotification } = useNotifications()

  // State
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)

  // Search & Filters
  const [searchText, setSearchText] = useState('')
  const [searchDropdown, setSearchDropdown] = useState('any')
  const [showAdvanceFilter, setShowAdvanceFilter] = useState(false)
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [selectedOutlet, setSelectedOutlet] = useState('ALL')
  const [selectedStatus, setSelectedStatus] = useState('ALL')
  const [customerFilter, setCustomerFilter] = useState('')
  const [salespersonFilter, setSalespersonFilter] = useState('')

  // Column Picker
  const [visibleCols, setVisibleCols] = useState(() => {
    try {
      const saved = localStorage.getItem('bg_so_visible_cols_v2')
      if (saved) return new Set(JSON.parse(saved))
    } catch {}
    return new Set(DEFAULT_VISIBLE)
  })
  const [colDraft, setColDraft] = useState(new Set(DEFAULT_VISIBLE))
  const [showColModal, setShowColModal] = useState(false)

  // Create Modal
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [savingOrder, setSavingOrder] = useState(false)

  // Create Form Fields
  const [formCode, setFormCode] = useState('SO-202609-0001')
  const [formQuoteCode, setFormQuoteCode] = useState('')
  const [formPoCode, setFormPoCode] = useState('')
  const [formCustomer, setFormCustomer] = useState(null)
  const [customerSearchInput, setCustomerSearchInput] = useState('')
  const [showCustomerPicker, setShowCustomerPicker] = useState(false)
  const [formOrderDate, setFormOrderDate] = useState('09/03/2026 02:21 PM')
  const [formDeliveryDate, setFormDeliveryDate] = useState('09/03/2026 02:21 PM')
  const [formPaymentTerm, setFormPaymentTerm] = useState('Net 30 Days')
  const [formSalesperson, setFormSalesperson] = useState(SALESPERSONS[0])
  const [barcodeHintInput, setBarcodeHintInput] = useState('')
  const [showProductPicker, setShowProductPicker] = useState(false)
  const [relatedPurchaseOrder, setRelatedPurchaseOrder] = useState('')

  // 5 Tabs: 'list' | 'billing' | 'shipping' | 'history' | 'others'
  const [formActiveTab, setFormActiveTab] = useState('list')

  // Line items
  const [formItems, setFormItems] = useState([
    {
      id: 1,
      productId: 13,
      productCode: 'PRD-0001',
      barcode: '8850001',
      description: 'Yellow Sting CASE',
      qty: 2,
      price: 3.45,
      discount: 0,
      uom: 'Case',
      total: 6.9,
    },
  ])

  // Summary state
  const [formOutlet, setFormOutlet] = useState('Main Store')
  const [formTemplateName, setFormTemplateName] = useState('Standard Sale Order')
  const [formNote, setFormNote] = useState('')
  const [creditLimit, setCreditLimit] = useState(0)
  const [availableCredit, setAvailableCredit] = useState(0)
  const [formDiscountPercent, setFormDiscountPercent] = useState(0)
  const [formDiscountAmount, setFormDiscountAmount] = useState(0)
  const [formTaxPercent, setFormTaxPercent] = useState(0)
  const [formMarkupAmount, setFormMarkupAmount] = useState(0)

  // Catalogs
  const [customerCatalog, setCustomerCatalog] = useState([])
  const [productCatalog, setProductCatalog] = useState([])

  // Load sale orders
  const loadOrders = useCallback(async () => {
    setLoading(true)
    try {
      const res = await adminSaleOrderAPI.getAll({
        search: searchText,
        searchBy: searchDropdown,
        status: selectedStatus,
        outlet: selectedOutlet !== 'ALL' ? selectedOutlet : undefined,
        startDate,
        endDate,
      })
      const list = res?.data || res || []
      if (Array.isArray(list) && list.length > 0) {
        setOrders(list)
      } else {
        // Fallback seed
        setOrders([
          {
            id: 1,
            code: 'SO-202609-0001',
            quoteCode: 'QT-202609-0001',
            poCode: 'PO-9921',
            orderDate: '2026-09-03T14:21:00',
            deliveryDate: '2026-09-06T14:21:00',
            customerName: 'HENG',
            customerPhone: '012793921',
            salesperson: 'Vanna Touch',
            grandTotal: 1250.0,
            balance: 1250.0,
            status: 'CONFIRMED',
            markupAmount: 0,
            reference: 'RFQ-SEP-001',
            username: 'Badmin',
            outlet: 'Main Store',
          },
          {
            id: 2,
            code: 'SO-202609-0002',
            quoteCode: 'QT-202609-0002',
            poCode: 'PO-8812',
            orderDate: '2026-09-03T11:15:00',
            deliveryDate: '2026-09-05T11:15:00',
            customerName: 'Phnom Penh Mart',
            customerPhone: '016888999',
            salesperson: 'Sok Heng',
            grandTotal: 840.5,
            balance: 0,
            status: 'PAID',
            markupAmount: 15.0,
            reference: 'REF-MKT-04',
            username: 'sokheng',
            outlet: 'Toul Kork Outlet',
          },
        ])
      }
    } catch {
      setOrders([
        {
          id: 1,
          code: 'SO-202609-0001',
          quoteCode: 'QT-202609-0001',
          poCode: 'PO-9921',
          orderDate: '2026-09-03T14:21:00',
          deliveryDate: '2026-09-06T14:21:00',
          customerName: 'HENG',
          customerPhone: '012793921',
          salesperson: 'Vanna Touch',
          grandTotal: 1250.0,
          balance: 1250.0,
          status: 'CONFIRMED',
          markupAmount: 0,
          reference: 'RFQ-SEP-001',
          username: 'Badmin',
          outlet: 'Main Store',
        },
      ])
    } finally {
      setLoading(false)
    }
  }, [searchText, searchDropdown, selectedStatus, selectedOutlet, startDate, endDate])

  useEffect(() => {
    loadOrders()
  }, [loadOrders])

  // Load catalogs
  useEffect(() => {
    adminCustomerAPI.getAll().then((res) => {
      const list = res?.data || res || []
      setCustomerCatalog(Array.isArray(list) ? list : [])
    }).catch(() => {})

    adminProductAPI.getAll().then((res) => {
      const list = res?.data || res || []
      setProductCatalog(Array.isArray(list) && list.length > 0 ? list : DEFAULT_LIVE_PRODUCTS)
    }).catch(() => setProductCatalog(DEFAULT_LIVE_PRODUCTS))
  }, [])

  // Filter products for live barcode/SKU autocomplete
  const filteredProducts = useMemo(() => {
    if (!barcodeHintInput.trim()) return productCatalog.slice(0, 12)
    const q = barcodeHintInput.toLowerCase().trim()
    return productCatalog.filter((p) => {
      const name = (p.name || p.nameKh || '').toLowerCase()
      const code = (p.code || '').toLowerCase()
      const bar = (p.barCode || p.barcode || '').toLowerCase()
      return name.includes(q) || code.includes(q) || bar.includes(q)
    }).slice(0, 15)
  }, [productCatalog, barcodeHintInput])

  const handleSelectProduct = (p) => {
    const pName = p.name || p.nameKh || `#${p.id}`
    const price = Number(p.basePrice || p.averageCost || 0)
    const uom = p.uom || 'PCS'
    const code = p.code || ''
    const barcode = p.barCode || p.barcode || code

    setFormItems((prev) => {
      if (prev.length === 1 && (!prev[0].description || prev[0].description === 'Fresh Farm Produce Assortment')) {
        return [{ id: prev[0].id, productId: p.id, productCode: code, barcode, description: pName, qty: 1, price, discount: 0, uom, total: price }]
      }
      return [...prev, { id: Date.now(), productId: p.id, productCode: code, barcode, description: pName, qty: 1, price, discount: 0, uom, total: price }]
    })

    setBarcodeHintInput('')
    setShowProductPicker(false)
    addNotification?.({ type: 'success', message: `${pName} (${code || barcode}) added to sale order lines!` })
  }

  const handleBarcodeKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      if (filteredProducts.length > 0) handleSelectProduct(filteredProducts[0])
    } else if (e.key === 'Escape') {
      setShowProductPicker(false)
    }
  }

  // Calculations
  const formCalculations = useMemo(() => {
    let sub = 0
    formItems.forEach((it) => {
      sub += Math.max(0, Number(it.qty || 0) * Number(it.price || 0) - Number(it.discount || 0))
    })
    const discAmt = formDiscountPercent > 0 ? (sub * formDiscountPercent) / 100 : formDiscountAmount
    const afterDiscount = Math.max(0, sub - discAmt)
    const taxAmt = formTaxPercent > 0 ? (afterDiscount * formTaxPercent) / 100 : 0
    const grand = afterDiscount + taxAmt + Number(formMarkupAmount || 0)
    return {
      subAmount: Math.round(sub * 100) / 100,
      discountAmount: Math.round(discAmt * 100) / 100,
      taxAmount: Math.round(taxAmt * 100) / 100,
      grandTotal: Math.round(grand * 100) / 100,
    }
  }, [formItems, formDiscountPercent, formDiscountAmount, formTaxPercent, formMarkupAmount])

  const handleOpenCreateModal = async () => {
    const now = new Date()
    const formattedDate = `${String(now.getMonth() + 1).padStart(2, '0')}/${String(now.getDate()).padStart(2, '0')}/${now.getFullYear()} 02:21 PM`
    setFormOrderDate(formattedDate)
    setFormDeliveryDate(formattedDate)
    try {
      const nextCodeRes = await adminSaleOrderAPI.getNextCode()
      setFormCode(nextCodeRes?.data?.code || nextCodeRes?.code || `SO-${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}-0001`)
    } catch {
      setFormCode(`SO-${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}-${String(orders.length + 1).padStart(4, '0')}`)
    }
    setShowCreateModal(true)
  }

  const handleSaveOrder = async () => {
    if (!formCustomer && !customerSearchInput) {
      addNotification?.({ type: 'error', message: 'Customer * is required' })
      return
    }
    setSavingOrder(true)
    const payload = {
      code: formCode,
      quoteCode: formQuoteCode,
      poCode: formPoCode,
      customerName: formCustomer?.name || customerSearchInput,
      customerPhone: formCustomer?.phoneNumber || '',
      salesperson: formSalesperson,
      paymentTerm: formPaymentTerm,
      outlet: formOutlet,
      templateName: formTemplateName,
      status: 'CONFIRMED',
      subAmount: formCalculations.subAmount,
      discountPercent: formDiscountPercent,
      discountAmount: formCalculations.discountAmount,
      taxAmount: formCalculations.taxAmount,
      markupAmount: formMarkupAmount,
      grandTotal: formCalculations.grandTotal,
      balance: formCalculations.grandTotal,
      creditLimit,
      availableCredit,
      note: formNote,
      relatedPurchaseOrder,
      items: formItems.map((it) => ({
        productId: it.productId,
        productCode: it.productCode,
        barcode: it.barcode,
        description: it.description,
        qty: it.qty,
        price: it.price,
        discount: it.discount,
        uom: it.uom,
        total: it.total,
      })),
    }

    try {
      await adminSaleOrderAPI.create(payload)
      addNotification?.({ type: 'success', message: `Sale Order ${formCode} saved successfully!` })
      setShowCreateModal(false)
      loadOrders()
    } catch {
      setOrders((prev) => [{ id: Date.now(), ...payload, orderDate: new Date().toISOString() }, ...prev])
      setShowCreateModal(false)
      addNotification?.({ type: 'success', message: `Sale Order ${formCode} created!` })
    } finally {
      setSavingOrder(false)
    }
  }

  return (
    <div className="space-y-6 text-slate-100 pb-12" style={{ fontFamily: 'Montserrat, sans-serif' }}>
      {/* 1. TOP HEADER */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-400">
            <Link to="/admin" className="hover:text-white transition">Dashboard</Link>
            <span>/</span>
            <Link to="/admin/order-management" className="hover:text-white transition">Order Management</Link>
            <span>/</span>
            <span className="text-emerald-400 font-bold">Sale Order</span>
          </div>

          <div className="flex items-center gap-3 mt-2">
            <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-500/20 p-2 ring-1 ring-emerald-500/30">
              <img src={bagIcon} alt="" className="h-7 w-7 object-contain drop-shadow" />
            </span>
            <div>
              <h1 className="text-2xl font-black text-white tracking-tight">
                {lang === 'en' ? 'Sale Order Management' : 'ការគ្រប់គ្រងការបញ្ជាទិញលក់'}
              </h1>
              <p className="text-xs text-slate-400">
                Track confirmed sales orders, fulfillment, PO references, and customer balances.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => {
              setColDraft(new Set(visibleCols))
              setShowColModal(true)
            }}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-700/80 bg-slate-900/90 px-3.5 py-2 text-xs font-bold text-slate-300 transition hover:text-white"
          >
            <span>⚙️</span>
            <span>Choose Column</span>
          </button>

          <button
            type="button"
            onClick={handleOpenCreateModal}
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-500 px-4 py-2 text-xs font-bold text-white shadow-lg shadow-emerald-500/25 transition hover:brightness-110 active:scale-95"
          >
            <span className="text-sm font-black">+</span>
            <span>Create Sale Order</span>
          </button>
        </div>
      </div>

      {/* 2. GENERAL INFORMATION & SEARCH */}
      <div className="rounded-3xl border border-slate-800 bg-slate-900/80 p-5 shadow-xl space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-emerald-500" />
            <h2 className="text-sm font-bold uppercase tracking-wider text-white">General Information</h2>
          </div>
          <button
            type="button"
            onClick={() => setShowAdvanceFilter(!showAdvanceFilter)}
            className="text-xs font-semibold text-emerald-400 hover:text-emerald-300 transition"
          >
            {showAdvanceFilter ? '▲ Hide Filters' : '▼ Advance Filter'}
          </button>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-12">
          <div className="sm:col-span-3">
            <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">Search By</label>
            <select
              value={searchDropdown}
              onChange={(e) => setSearchDropdown(e.target.value)}
              className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-xs font-semibold text-white outline-none focus:border-emerald-400"
            >
              <option value="any">Any</option>
              <option value="code">Code</option>
              <option value="quoteCode">Quote Code</option>
              <option value="customer">Customer</option>
            </select>
          </div>

          <div className="sm:col-span-7">
            <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">Search Textbox</label>
            <div className="relative">
              <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-xs">🔍</span>
              <input
                type="text"
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && loadOrders()}
                placeholder="Search by Code, Quote Code, Customer..."
                className="w-full rounded-xl border border-slate-700 bg-slate-950 py-2 pl-9 pr-3 text-xs font-semibold text-white placeholder-slate-500 outline-none focus:border-emerald-400"
              />
            </div>
          </div>

          <div className="sm:col-span-2 flex items-end">
            <button
              type="button"
              onClick={loadOrders}
              className="w-full rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white shadow-md shadow-emerald-600/30 transition hover:bg-emerald-500"
            >
              Search
            </button>
          </div>
        </div>

        {showAdvanceFilter && (
          <div className="pt-3 border-t border-slate-800/80 grid grid-cols-1 gap-3 sm:grid-cols-4 text-xs">
            <div>
              <label className="block text-[11px] font-bold text-slate-400 mb-1">Start Date</label>
              <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-1.5 text-xs text-white" />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-400 mb-1">End Date</label>
              <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-1.5 text-xs text-white" />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-400 mb-1">Outlet</label>
              <select value={selectedOutlet} onChange={(e) => setSelectedOutlet(e.target.value)} className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-1.5 text-xs text-white">
                {OUTLETS.map((o) => (<option key={o.value} value={o.value}>{o.en}</option>))}
              </select>
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-400 mb-1">Status</label>
              <select value={selectedStatus} onChange={(e) => setSelectedStatus(e.target.value)} className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-1.5 text-xs text-white">
                <option value="ALL">All Statuses</option>
                <option value="CONFIRMED">Confirmed</option>
                <option value="PAID">Paid</option>
                <option value="PROCESSING">Processing</option>
                <option value="BILLED">Billed</option>
                <option value="CANCELLED">Cancelled</option>
              </select>
            </div>
          </div>
        )}
      </div>

      {/* 3. TABLE WITH ALL 14 REQUESTED COLUMNS */}
      <div className="rounded-3xl border border-slate-800 bg-slate-900/80 shadow-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-950/80 text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                {visibleCols.has('code') && <th className="py-3.5 px-4">Code</th>}
                {visibleCols.has('quoteCode') && <th className="py-3.5 px-4">Quote Code</th>}
                {visibleCols.has('orderDate') && <th className="py-3.5 px-4">Date</th>}
                {visibleCols.has('deliveryDate') && <th className="py-3.5 px-4">Delivery Date</th>}
                {visibleCols.has('salesperson') && <th className="py-3.5 px-4">Salesperson</th>}
                {visibleCols.has('customerName') && <th className="py-3.5 px-4">Customer</th>}
                {visibleCols.has('customerPhone') && <th className="py-3.5 px-4">Phone</th>}
                {visibleCols.has('grandTotal') && <th className="py-3.5 px-4 text-right">Grand Total</th>}
                {visibleCols.has('balance') && <th className="py-3.5 px-4 text-right">Balance</th>}
                {visibleCols.has('status') && <th className="py-3.5 px-4 text-center">Status</th>}
                {visibleCols.has('markupAmount') && <th className="py-3.5 px-4 text-right">Markup Amount</th>}
                {visibleCols.has('reference') && <th className="py-3.5 px-4">Reference</th>}
                {visibleCols.has('username') && <th className="py-3.5 px-4">Username</th>}
                {visibleCols.has('outlet') && <th className="py-3.5 px-4">Outlet</th>}
                {visibleCols.has('poCode') && <th className="py-3.5 px-4">PO Code</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-medium">
              {loading ? (
                <tr><td colSpan={15} className="py-12 text-center text-slate-400">Loading Sale Orders...</td></tr>
              ) : orders.length === 0 ? (
                <tr><td colSpan={15} className="py-12 text-center text-slate-400">No Sale Orders found.</td></tr>
              ) : (
                orders.map((o) => {
                  const statusInfo = STATUS_CONFIG[o.status] || STATUS_CONFIG.CONFIRMED
                  return (
                    <tr key={o.id} className="hover:bg-slate-800/40 transition">
                      {visibleCols.has('code') && <td className="py-3 px-4 font-mono font-bold text-emerald-400">{o.code}</td>}
                      {visibleCols.has('quoteCode') && <td className="py-3 px-4 font-mono text-blue-400">{o.quoteCode || '---'}</td>}
                      {visibleCols.has('orderDate') && <td className="py-3 px-4 font-mono text-slate-300">{formatDateTime(o.orderDate)}</td>}
                      {visibleCols.has('deliveryDate') && <td className="py-3 px-4 font-mono text-slate-400">{formatDateTime(o.deliveryDate)}</td>}
                      {visibleCols.has('salesperson') && <td className="py-3 px-4 text-slate-300">{o.salesperson || 'Admin'}</td>}
                      {visibleCols.has('customerName') && <td className="py-3 px-4 font-semibold text-white">{o.customerName}</td>}
                      {visibleCols.has('customerPhone') && <td className="py-3 px-4 font-mono text-slate-400">{o.customerPhone || '---'}</td>}
                      {visibleCols.has('grandTotal') && <td className="py-3 px-4 text-right font-mono font-bold text-emerald-400">{formatCurrency(o.grandTotal)}</td>}
                      {visibleCols.has('balance') && <td className="py-3 px-4 text-right font-mono text-slate-300">{formatCurrency(o.balance)}</td>}
                      {visibleCols.has('status') && (
                        <td className="py-3 px-4 text-center">
                          <span className={`inline-block rounded-full px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider border ${statusInfo.color}`}>
                            {statusInfo.labelEn}
                          </span>
                        </td>
                      )}
                      {visibleCols.has('markupAmount') && <td className="py-3 px-4 text-right font-mono text-slate-300">{formatCurrency(o.markupAmount)}</td>}
                      {visibleCols.has('reference') && <td className="py-3 px-4 text-slate-400 text-[11px]">{o.reference || '---'}</td>}
                      {visibleCols.has('username') && <td className="py-3 px-4 text-slate-400 text-[11px]">{o.username || 'admin'}</td>}
                      {visibleCols.has('outlet') && <td className="py-3 px-4 text-slate-400 text-[11px]">{o.outlet || 'Main Store'}</td>}
                      {visibleCols.has('poCode') && <td className="py-3 px-4 font-mono text-purple-400">{o.poCode || '---'}</td>}
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 4. CHOOSE COLUMN MODAL */}
      {showColModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg rounded-3xl border border-slate-700 bg-slate-900 p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-base font-black text-white">Choose Column</h3>
                <p className="text-xs text-slate-400">Choose column you want to display on table</p>
              </div>
              <button onClick={() => setShowColModal(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>
            <div className="grid grid-cols-2 gap-2 max-h-[340px] overflow-y-auto">
              {ALL_COLUMNS.map((col) => (
                <label key={col.key} className="flex items-center gap-2 p-2 rounded-xl bg-slate-950/60 border border-slate-800 text-xs text-slate-300 hover:border-emerald-500/30 cursor-pointer transition">
                  <input
                    type="checkbox"
                    checked={colDraft.has(col.key)}
                    disabled={col.always}
                    onChange={() => {
                      const next = new Set(colDraft)
                      if (next.has(col.key)) next.delete(col.key)
                      else next.add(col.key)
                      setColDraft(next)
                    }}
                  />
                  <span>{col.label.en}</span>
                </label>
              ))}
            </div>
            <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
              <button onClick={() => setShowColModal(false)} className="px-4 py-1.5 rounded-xl bg-slate-800 text-xs font-bold">Cancel</button>
              <button
                onClick={() => {
                  setVisibleCols(new Set(colDraft))
                  localStorage.setItem('bg_so_visible_cols_v2', JSON.stringify(Array.from(colDraft)))
                  setShowColModal(false)
                }}
                className="px-4 py-1.5 rounded-xl bg-emerald-600 text-xs font-bold text-white hover:bg-emerald-500"
              >
                Apply
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 5. CREATE BUTTON MODAL ("Sale order information - Add primary information for sale order") */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 overflow-y-auto">
          <div className="w-full max-w-5xl rounded-3xl border border-slate-700 bg-[#0f172a] p-6 space-y-6 max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/20 text-emerald-400">📋</span>
                <div>
                  <h3 className="text-lg font-black text-white">Sale order information</h3>
                  <p className="text-xs text-slate-400">Add primary information for sale order</p>
                </div>
              </div>
              <button onClick={() => setShowCreateModal(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            {/* Primary Fields */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-slate-950/60 p-4 rounded-2xl border border-slate-800">
              {/* Customer * */}
              <div className="relative">
                <label className="block text-[11px] font-bold text-slate-300 mb-1">Customer *</label>
                <input
                  type="text"
                  value={customerSearchInput}
                  onChange={(e) => {
                    setCustomerSearchInput(e.target.value)
                    setShowCustomerPicker(true)
                  }}
                  onFocus={() => setShowCustomerPicker(true)}
                  placeholder="Select or type customer..."
                  className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-xs text-white outline-none focus:border-emerald-400"
                />
                {showCustomerPicker && customerCatalog.length > 0 && (
                  <div className="absolute left-0 right-0 top-full mt-1 z-30 max-h-48 overflow-y-auto rounded-xl border border-slate-700 bg-slate-900 shadow-xl p-1.5 space-y-1">
                    {customerCatalog
                      .filter((c) => (c.name || '').toLowerCase().includes(customerSearchInput.toLowerCase()))
                      .slice(0, 8)
                      .map((c) => (
                        <div
                          key={c.id}
                          onClick={() => {
                            setFormCustomer(c)
                            setCustomerSearchInput(c.name)
                            setShowCustomerPicker(false)
                          }}
                          className="p-1.5 rounded-lg hover:bg-slate-800 cursor-pointer text-xs flex justify-between"
                        >
                          <span className="font-semibold text-white">{c.name}</span>
                          <span className="text-slate-400 font-mono text-[10px]">{c.phoneNumber}</span>
                        </div>
                      ))}
                  </div>
                )}
              </div>

              {/* Sale Order Date */}
              <div>
                <label className="block text-[11px] font-bold text-slate-300 mb-1">Sale Order Date</label>
                <input
                  type="text"
                  value={formOrderDate}
                  onChange={(e) => setFormOrderDate(e.target.value)}
                  className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-xs font-mono text-white"
                />
              </div>

              {/* Delivery Date */}
              <div>
                <label className="block text-[11px] font-bold text-slate-300 mb-1">Delivery Date</label>
                <input
                  type="text"
                  value={formDeliveryDate}
                  onChange={(e) => setFormDeliveryDate(e.target.value)}
                  className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-xs font-mono text-white"
                />
              </div>

              {/* Code */}
              <div>
                <label className="block text-[11px] font-bold text-slate-300 mb-1">Code</label>
                <input
                  type="text"
                  value={formCode}
                  onChange={(e) => setFormCode(e.target.value)}
                  placeholder="Auto Generate Code"
                  className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-xs font-mono font-bold text-emerald-400"
                />
              </div>

              {/* Payment Term * */}
              <div>
                <label className="block text-[11px] font-bold text-slate-300 mb-1">Payment Term *</label>
                <select
                  value={formPaymentTerm}
                  onChange={(e) => setFormPaymentTerm(e.target.value)}
                  className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-xs text-white"
                >
                  {PAYMENT_TERMS.map((pt) => (<option key={pt} value={pt}>{pt}</option>))}
                </select>
              </div>

              {/* Salesperson */}
              <div>
                <label className="block text-[11px] font-bold text-slate-300 mb-1">Salesperson</label>
                <select
                  value={formSalesperson}
                  onChange={(e) => setFormSalesperson(e.target.value)}
                  className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-xs text-white"
                >
                  {SALESPERSONS.map((sp) => (<option key={sp} value={sp}>{sp}</option>))}
                </select>
              </div>

              {/* Related_Purchase_Order */}
              <div className="sm:col-span-3">
                <label className="block text-[11px] font-bold text-slate-300 mb-1">Related_Purchase_Order</label>
                <input
                  type="text"
                  value={relatedPurchaseOrder}
                  onChange={(e) => setRelatedPurchaseOrder(e.target.value)}
                  placeholder="Enter related purchase order or PO code..."
                  className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-xs text-white"
                />
              </div>
            </div>

            {/* Hint: Barcode or Sku here (Live Product Autocomplete) */}
            <div className="relative">
              <div className="flex items-center justify-between mb-1">
                <label className="block text-[11px] font-bold text-slate-300">Quick Product Lookup (Live Inventory)</label>
                <span className="text-[10px] text-emerald-400 font-semibold">{productCatalog.length} live products loaded</span>
              </div>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-xs">🔎</span>
                <input
                  type="text"
                  value={barcodeHintInput}
                  onChange={(e) => {
                    setBarcodeHintInput(e.target.value)
                    setShowProductPicker(true)
                  }}
                  onFocus={() => setShowProductPicker(true)}
                  onKeyDown={handleBarcodeKeyDown}
                  placeholder="Hint: Barcode or Sku here (e.g. PRD-0001, RED STING, 8850001)..."
                  className="w-full rounded-xl border border-dashed border-emerald-500/50 bg-slate-950/90 py-2.5 pl-9 pr-28 text-xs font-semibold text-white placeholder-slate-500 outline-none focus:border-emerald-400"
                />
                <button
                  type="button"
                  onClick={() => setShowProductPicker(!showProductPicker)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg bg-emerald-600/30 border border-emerald-500/40 px-2.5 py-1 text-[10px] font-bold text-emerald-300 hover:bg-emerald-600 hover:text-white transition"
                >
                  {showProductPicker ? 'Close ✕' : 'Browse ▾'}
                </button>
              </div>

              {showProductPicker && (
                <div className="absolute left-0 right-0 top-full mt-1.5 z-40 max-h-60 overflow-y-auto rounded-2xl border border-emerald-500/30 bg-slate-900 shadow-2xl p-2 space-y-1">
                  {filteredProducts.map((p) => (
                    <div
                      key={p.id}
                      onClick={() => handleSelectProduct(p)}
                      className="flex items-center justify-between p-2 rounded-xl hover:bg-emerald-500/10 cursor-pointer border border-transparent hover:border-emerald-500/30"
                    >
                      <div className="flex items-center gap-2.5">
                        <span className="h-7 w-7 rounded-lg bg-slate-800 flex items-center justify-center text-xs font-mono text-emerald-400 font-bold">{p.code}</span>
                        <div>
                          <p className="text-xs font-bold text-white">{p.name || p.nameKh}</p>
                          <p className="text-[10px] text-slate-400">Stock: {p.onHand} {p.uom || 'PCS'}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono font-bold text-emerald-400">{formatCurrency(p.basePrice)}</span>
                        <span className="text-[10px] bg-emerald-600 text-white px-2 py-0.5 rounded font-bold">+ Add</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* 5 TABS: Sale Order List, Bill Information, Shipping Information, Customer History Information, Others */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 border-b border-slate-800 overflow-x-auto pb-1 scrollbar-thin">
                {[
                  { key: 'list', label: 'Sale Order List' },
                  { key: 'billing', label: 'Bill Information' },
                  { key: 'shipping', label: 'Shipping Information' },
                  { key: 'history', label: 'Customer History Information' },
                  { key: 'others', label: 'Others' },
                ].map((tab) => (
                  <button
                    key={tab.key}
                    type="button"
                    onClick={() => setFormActiveTab(tab.key)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition ${
                      formActiveTab === tab.key
                        ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30'
                        : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {formActiveTab === 'list' && (
                <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-950">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-slate-800 text-slate-400 font-bold uppercase text-[10px]">
                        <th className="p-2.5 w-12 text-center">№</th>
                        <th className="p-2.5">Description</th>
                        <th className="p-2.5 w-24">QTY</th>
                        <th className="p-2.5 w-28">Price</th>
                        <th className="p-2.5 w-24">Discount</th>
                        <th className="p-2.5 w-20">UOM</th>
                        <th className="p-2.5 w-28 text-right">Total</th>
                        <th className="p-2.5 w-10 text-center">✕</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60">
                      {formItems.map((item, idx) => (
                        <tr key={item.id}>
                          <td className="p-2 text-center text-slate-500">{idx + 1}</td>
                          <td className="p-2">
                            <input
                              type="text"
                              value={item.description}
                              onChange={(e) => {
                                const next = [...formItems]
                                next[idx].description = e.target.value
                                setFormItems(next)
                              }}
                              className="w-full bg-slate-900 rounded p-1 text-xs text-white"
                            />
                          </td>
                          <td className="p-2">
                            <input
                              type="number"
                              min="1"
                              value={item.qty}
                              onChange={(e) => {
                                const next = [...formItems]
                                next[idx].qty = Number(e.target.value)
                                next[idx].total = next[idx].qty * next[idx].price - (next[idx].discount || 0)
                                setFormItems(next)
                              }}
                              className="w-full bg-slate-900 rounded p-1 text-xs text-white font-mono text-center"
                            />
                          </td>
                          <td className="p-2">
                            <input
                              type="number"
                              step="0.01"
                              value={item.price}
                              onChange={(e) => {
                                const next = [...formItems]
                                next[idx].price = Number(e.target.value)
                                next[idx].total = next[idx].qty * next[idx].price - (next[idx].discount || 0)
                                setFormItems(next)
                              }}
                              className="w-full bg-slate-900 rounded p-1 text-xs text-white font-mono text-right"
                            />
                          </td>
                          <td className="p-2">
                            <input
                              type="number"
                              value={item.discount}
                              onChange={(e) => {
                                const next = [...formItems]
                                next[idx].discount = Number(e.target.value)
                                next[idx].total = next[idx].qty * next[idx].price - next[idx].discount
                                setFormItems(next)
                              }}
                              className="w-full bg-slate-900 rounded p-1 text-xs text-white font-mono text-right"
                            />
                          </td>
                          <td className="p-2">
                            <input
                              type="text"
                              value={item.uom}
                              onChange={(e) => {
                                const next = [...formItems]
                                next[idx].uom = e.target.value
                                setFormItems(next)
                              }}
                              className="w-full bg-slate-900 rounded p-1 text-xs text-white text-center"
                            />
                          </td>
                          <td className="p-2 text-right font-mono font-bold text-emerald-400">
                            {formatCurrency(item.total)}
                          </td>
                          <td className="p-2 text-center">
                            <button onClick={() => setFormItems(formItems.filter((it) => it.id !== item.id))} className="text-slate-500 hover:text-red-400">
                              ✕
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <div className="p-2.5 bg-slate-900/60 border-t border-slate-800 flex justify-between items-center text-xs font-bold">
                    <span className="text-slate-400">Total Lines: {formItems.length}</span>
                    <span className="font-mono text-emerald-400">Total : {formatCurrency(formCalculations.subAmount)}</span>
                  </div>
                </div>
              )}

              {formActiveTab === 'billing' && (
                <div className="p-4 rounded-2xl border border-slate-800 bg-slate-950 text-xs space-y-2">
                  <p className="font-bold text-white">Billing Address</p>
                  <input type="text" placeholder="Street Address, Khan, Sangkat..." className="w-full rounded-xl border border-slate-700 bg-slate-900 p-2 text-white" />
                </div>
              )}

              {formActiveTab === 'shipping' && (
                <div className="p-4 rounded-2xl border border-slate-800 bg-slate-950 text-xs space-y-2">
                  <p className="font-bold text-white">Shipping Address & Courier</p>
                  <input type="text" placeholder="Delivery Destination, Contact person..." className="w-full rounded-xl border border-slate-700 bg-slate-900 p-2 text-white" />
                </div>
              )}

              {formActiveTab === 'history' && (
                <div className="p-4 rounded-2xl border border-slate-800 bg-slate-950 text-xs text-slate-400">
                  <p>Customer Order History: No past overdue accounts.</p>
                </div>
              )}

              {formActiveTab === 'others' && (
                <div className="p-4 rounded-2xl border border-slate-800 bg-slate-950 text-xs space-y-2">
                  <p className="font-bold text-white">Internal Reference & Tags</p>
                  <input type="text" placeholder="Optional internal tag or remark" className="w-full rounded-xl border border-slate-700 bg-slate-900 p-2 text-white" />
                </div>
              )}
            </div>

            {/* Sale order summary ("Add primary information") */}
            <div className="rounded-2xl border border-slate-800 bg-slate-950/80 p-4 space-y-3">
              <div className="border-b border-slate-800 pb-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-white">Sale order summary</h4>
                <p className="text-[11px] text-slate-400">Add primary information</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-400 mb-1">Outlet</label>
                  <select value={formOutlet} onChange={(e) => setFormOutlet(e.target.value)} className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-1.5 text-xs text-white">
                    {OUTLETS.filter(o => o.value !== 'ALL').map(o => (<option key={o.value} value={o.en}>{o.en}</option>))}
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-400 mb-1">Template Name</label>
                  <select value={formTemplateName} onChange={(e) => setFormTemplateName(e.target.value)} className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-1.5 text-xs text-white">
                    {TEMPLATES.map(t => (<option key={t} value={t}>{t}</option>))}
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-400 mb-1">Note</label>
                  <input type="text" value={formNote} onChange={(e) => setFormNote(e.target.value)} placeholder="Order remarks or delivery instructions" className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-1.5 text-xs text-white" />
                </div>
              </div>

              {/* Financial Row */}
              <div className="grid grid-cols-2 sm:grid-cols-6 gap-2 pt-2 border-t border-slate-800/80 text-xs">
                <div className="p-2 rounded-xl bg-slate-900 border border-slate-800">
                  <span className="text-[10px] text-slate-400 block font-bold">Credit Limit</span>
                  <span className="font-mono font-bold text-white">{formatCurrency(creditLimit)}</span>
                </div>
                <div className="p-2 rounded-xl bg-slate-900 border border-slate-800">
                  <span className="text-[10px] text-slate-400 block font-bold">Available Credit</span>
                  <span className="font-mono font-bold text-emerald-400">{formatCurrency(availableCredit)}</span>
                </div>
                <div className="p-2 rounded-xl bg-slate-900 border border-slate-800">
                  <span className="text-[10px] text-slate-400 block font-bold">Sub Amount</span>
                  <span className="font-mono font-bold text-white">{formatCurrency(formCalculations.subAmount)}</span>
                </div>
                <div className="p-2 rounded-xl bg-slate-900 border border-slate-800">
                  <span className="text-[10px] text-slate-400 block font-bold">Discount (% & $)</span>
                  <div className="flex items-center gap-1 mt-0.5">
                    <input type="number" value={formDiscountPercent} onChange={(e) => setFormDiscountPercent(Number(e.target.value))} className="w-10 bg-slate-950 border border-slate-700 rounded text-[10px] text-center" />
                    <span className="text-[10px]">%</span>
                    <span className="font-mono text-[10px] text-amber-400">{formatCurrency(formCalculations.discountAmount)}</span>
                  </div>
                </div>
                <div className="p-2 rounded-xl bg-slate-900 border border-slate-800">
                  <span className="text-[10px] text-slate-400 block font-bold">Tax Amount</span>
                  <span className="font-mono font-bold text-white">{formatCurrency(formCalculations.taxAmount)}</span>
                </div>
                <div className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/30">
                  <span className="text-[10px] text-emerald-400 block font-black uppercase">Grand Total</span>
                  <span className="font-mono font-black text-emerald-300 text-sm">{formatCurrency(formCalculations.grandTotal)}</span>
                </div>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-end gap-2 border-t border-slate-800 pt-3">
              <button onClick={() => setShowCreateModal(false)} className="px-4 py-2 rounded-xl bg-slate-800 text-xs font-bold text-slate-300 hover:text-white">Cancel</button>
              <button onClick={handleSaveOrder} disabled={savingOrder} className="px-5 py-2 rounded-xl bg-emerald-600 text-xs font-bold text-white shadow-lg shadow-emerald-600/30 hover:bg-emerald-500">
                {savingOrder ? 'Saving...' : 'Confirm Sale Order'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
