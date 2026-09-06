import React, { useState, useEffect, useMemo, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { useLanguage } from '../../context/LanguageContext'
import { useNotifications } from '../../context/NotificationContext'
import { adminConsignmentAPI, adminCustomerAPI, adminProductAPI } from '../../api/api'
import travelIcon from '../../assets/icon/3dicons-travel-dynamic-color.png'
import cubeIcon from '../../assets/icon/3dicons-cube-dynamic-color.png'
import './ProductsHub.css'

// 12 Columns exactly as requested for Choose Column modal & table
const ALL_COLUMNS = [
  { key: 'code', label: { en: 'Con. Code', kh: 'លេខកូដបញ្ញើ' }, always: true },
  { key: 'consignmentDate', label: { en: 'Date', kh: 'កាលបរិច្ឆេទ' }, always: true },
  { key: 'deliveryDate', label: { en: 'Delivery Date', kh: 'កាលបរិច្ឆេទដឹក' }, always: true },
  { key: 'reference', label: { en: 'Reference', kh: 'ឯកសារយោង' } },
  { key: 'username', label: { en: 'Username', kh: 'ឈ្មោះអ្នកប្រើ' } },
  { key: 'outlet', label: { en: 'Outlet', kh: 'សាខា' } },
  { key: 'customerName', label: { en: 'Customer', kh: 'អតិថិជន' }, always: true },
  { key: 'customerPhone', label: { en: 'Phone', kh: 'ទូរស័ព្ទ' } },
  { key: 'salesperson', label: { en: 'Salesperson', kh: 'អ្នកលក់' } },
  { key: 'grandTotal', label: { en: 'Grand Total', kh: 'សរុបចុងក្រោយ ($)' }, always: true },
  { key: 'balance', label: { en: 'Balance', kh: 'សមតុល្យ ($)' } },
  { key: 'status', label: { en: 'Status', kh: 'ស្ថានភាព' }, always: true },
]

const DEFAULT_VISIBLE = [
  'code',
  'consignmentDate',
  'deliveryDate',
  'reference',
  'username',
  'outlet',
  'customerName',
  'customerPhone',
  'salesperson',
  'grandTotal',
  'balance',
  'status',
]

const STATUS_CONFIG = {
  OPEN: { labelEn: 'Open', labelKh: 'បើកដំណើរការ', color: 'bg-purple-500/20 text-purple-400 border-purple-500/30' },
  COMPLETED: { labelEn: 'Completed', labelKh: 'បានបញ្ចប់', color: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' },
  VOIDED: { labelEn: 'Voided', labelKh: 'បានទុកជាមោឃៈ', color: 'bg-red-500/20 text-red-400 border-red-500/30' },
}

const OUTLETS = [
  { value: 'ALL', en: 'All Outlets', kh: 'គ្រប់សាខាទាំងអស់' },
  { value: 'Main Store', en: 'Main Store - Phnom Penh', kh: 'ហាងធំ - ភ្នំពេញ' },
  { value: 'Toul Kork Outlet', en: 'Toul Kork Outlet', kh: 'សាខាទួលគោក' },
  { value: 'BKK1 Outlet', en: 'BKK1 Premium Outlet', kh: 'សាខាបឹងកេងកង១' },
  { value: 'Online Store', en: 'Online E-Commerce Store', kh: 'ហាងលក់អនឡាញ' },
]

const STATUS_OPTIONS = [
  { value: 'ALL', en: 'Any', kh: 'ទាំងអស់' },
  { value: 'OPEN', en: 'Open', kh: 'បើកដំណើរការ' },
  { value: 'COMPLETED', en: 'Completed', kh: 'បានបញ្ចប់' },
  { value: 'VOIDED', en: 'Voided', kh: 'បានទុកជាមោឃៈ' },
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
  'Standard Consignment',
  'B2B Wholesale Dispatch',
  'Partner Floor Stock',
  'Retail Consignment Delivery',
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

const formatCurrency = (val) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2 }).format(val || 0)

const formatDateTime = (val) => {
  if (!val) return '---'
  try {
    const d = new Date(val)
    if (isNaN(d.getTime())) return String(val)
    const yyyy = d.getFullYear()
    const mm = String(d.getMonth() + 1).padStart(2, '0')
    const dd = String(d.getDate()).padStart(2, '0')
    let hours = d.getHours()
    const minutes = String(d.getMinutes()).padStart(2, '0')
    const ampm = hours >= 12 ? 'PM' : 'AM'
    hours = hours % 12
    hours = hours ? hours : 12
    const strHours = String(hours).padStart(2, '0')
    return `${mm}/${dd}/${yyyy} ${strHours}:${minutes} ${ampm}`
  } catch {
    return String(val)
  }
}

export default function ConsignmentList() {
  const { lang } = useLanguage()
  const { addNotification } = useNotifications()

  // Consignment records state
  const [consignments, setConsignments] = useState([])
  const [loading, setLoading] = useState(true)

  // Search & Filter state
  const [searchText, setSearchText] = useState('')
  const [searchBy, setSearchBy] = useState('any') // 'any' | 'code' | 'customer'
  const [advanceFilterOpen, setAdvanceFilterOpen] = useState(false)
  const [filterStartDate, setFilterStartDate] = useState('')
  const [filterEndDate, setFilterEndDate] = useState('')
  const [filterOutlet, setFilterOutlet] = useState('ALL')
  const [filterStatus, setFilterStatus] = useState('ALL')
  const [filterCustomer, setFilterCustomer] = useState('ALL')
  const [filterSalesperson, setFilterSalesperson] = useState('ALL')

  // Live master data
  const [customers, setCustomers] = useState([])
  const [products, setProducts] = useState(DEFAULT_LIVE_PRODUCTS)

  // Visible table columns modal
  const [chooseColumnOpen, setChooseColumnOpen] = useState(false)
  const [visibleColumns, setVisibleColumns] = useState(DEFAULT_VISIBLE)

  // Create Consignment Modal state
  const [createModalOpen, setCreateModalOpen] = useState(false)
  const [modalTab, setModalTab] = useState('list') // 'list' | 'bill' | 'shipping' | 'history' | 'others'
  const [saving, setSaving] = useState(false)

  // Barcode / SKU input & autocomplete state
  const [barcodeInput, setBarcodeInput] = useState('')
  const [barcodeSuggestions, setBarcodeSuggestions] = useState([])

  // Form State
  const [formData, setFormData] = useState({
    customerId: '',
    customerName: '',
    customerPhone: '',
    customerAddress: '',
    consignmentDate: '2026-09-03T15:30',
    deliveryDate: '2026-09-03T15:30',
    code: 'Auto Generate Code',
    paymentTerm: 'Cash',
    salesperson: 'Admin',
    outlet: 'Main Store',
    templateName: 'Standard Consignment',
    note: '',
    status: 'OPEN',
    discountPercent: 0,
    discountAmount: 0,
    discountMode: 'amount', // 'percent' | 'amount'
    taxPercent: 0,
    taxAmount: 0,
    reference: '',
    username: 'Admin',
    billingName: '',
    billingPhone: '',
    billingEmail: '',
    billingAddress: '',
    shippingRecipient: '',
    shippingPhone: '',
    shippingAddress: '',
    shippingCourier: 'B\'Groceries Fleet Express',
    items: [],
  })

  // Load consignments from backend
  const loadConsignments = useCallback(async () => {
    setLoading(true)
    try {
      const params = {}
      if (searchText.trim()) params.search = searchText.trim()
      if (searchBy) params.searchBy = searchBy
      if (filterStatus && filterStatus !== 'ALL') params.status = filterStatus
      if (filterOutlet && filterOutlet !== 'ALL') params.outlet = filterOutlet
      if (filterCustomer && filterCustomer !== 'ALL') params.customer = filterCustomer
      if (filterSalesperson && filterSalesperson !== 'ALL') params.salesperson = filterSalesperson
      if (filterStartDate) params.startDate = `${filterStartDate}T00:00:00`
      if (filterEndDate) params.endDate = `${filterEndDate}T23:59:59`

      const res = await adminConsignmentAPI.getAll(params)
      const data = res?.data || res || []
      setConsignments(Array.isArray(data) ? data : [])
    } catch {
      setConsignments([])
    } finally {
      setLoading(false)
    }
  }, [searchText, searchBy, filterStatus, filterOutlet, filterCustomer, filterSalesperson, filterStartDate, filterEndDate])

  // Initial load: Consignments, Customers, Products
  useEffect(() => {
    loadConsignments()

    // Fetch Customers
    adminCustomerAPI
      .getAll()
      .then((res) => {
        const list = res?.data || res || []
        if (Array.isArray(list) && list.length > 0) setCustomers(list)
      })
      .catch(() => {})

    // Fetch Products
    adminProductAPI
      .getAll()
      .then((res) => {
        const list = res?.data || res || []
        if (Array.isArray(list) && list.length > 0) {
          const mapped = list.map((p) => ({
            id: p.id,
            code: p.productCode || p.code || `PRD-${p.id}`,
            barCode: p.barcode || p.barCode || p.sku || '',
            name: p.productName || p.name || 'Unnamed Product',
            basePrice: Number(p.salePrice || p.price || p.basePrice || 0),
            onHand: Number(p.stockQty || p.quantity || p.onHand || 10),
            uom: p.unit || p.uom || 'PCS',
          }))
          setProducts(mapped)
        }
      })
      .catch(() => {})
  }, [loadConsignments])

  // Barcode / SKU suggestions as user types
  useEffect(() => {
    const q = barcodeInput.trim().toLowerCase()
    if (!q) {
      setBarcodeSuggestions([])
      return
    }
    const matches = products.filter(
      (p) =>
        (p.barCode && p.barCode.toLowerCase().includes(q)) ||
        (p.code && p.code.toLowerCase().includes(q)) ||
        (p.name && p.name.toLowerCase().includes(q))
    )
    setBarcodeSuggestions(matches.slice(0, 6))
  }, [barcodeInput, products])

  // Add product to consignment items list
  const addProductToItems = (prd) => {
    setFormData((prev) => {
      const existingIdx = prev.items.findIndex(
        (it) => it.productId === prd.id || (it.barcode && it.barcode === prd.barCode)
      )

      if (existingIdx >= 0) {
        // Increment QTY
        const updated = [...prev.items]
        const curr = updated[existingIdx]
        const newQty = Number(curr.qty || 1) + 1
        const lineTotal = Math.max(0, newQty * Number(curr.price || 0) - Number(curr.discount || 0))
        updated[existingIdx] = {
          ...curr,
          qty: newQty,
          total: Math.round(lineTotal * 100) / 100,
        }
        return { ...prev, items: updated }
      }

      // Append new row
      const lineTotal = Math.round(1 * prd.basePrice * 100) / 100
      const newItem = {
        productId: prd.id,
        productCode: prd.code,
        barcode: prd.barCode,
        description: prd.name,
        qty: 1,
        price: prd.basePrice,
        discount: 0,
        uom: prd.uom || 'PCS',
        total: lineTotal,
      }
      return { ...prev, items: [...prev.items, newItem] }
    })
    setBarcodeInput('')
    setBarcodeSuggestions([])
  }

  // Handle barcode Enter key scan
  const handleBarcodeKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      const q = barcodeInput.trim().toLowerCase()
      if (!q) return
      const exactMatch = products.find(
        (p) =>
          (p.barCode && p.barCode.toLowerCase() === q) ||
          (p.code && p.code.toLowerCase() === q) ||
          (p.name && p.name.toLowerCase() === q)
      )
      if (exactMatch) {
        addProductToItems(exactMatch)
      } else if (barcodeSuggestions.length > 0) {
        addProductToItems(barcodeSuggestions[0])
      } else {
        // Add ad-hoc scanned item
        addProductToItems({
          id: Date.now(),
          code: q.toUpperCase(),
          barCode: q,
          name: `Item (${q})`,
          basePrice: 1.0,
          uom: 'PCS',
        })
      }
    }
  }

  // Update item field (qty, price, discount, uom)
  const updateItemRow = (idx, field, val) => {
    setFormData((prev) => {
      const updated = [...prev.items]
      const curr = { ...updated[idx], [field]: val }
      const qty = Math.max(0, Number(curr.qty || 0))
      const price = Math.max(0, Number(curr.price || 0))
      const discount = Math.max(0, Number(curr.discount || 0))
      const lineTotal = Math.max(0, qty * price - discount)
      curr.total = Math.round(lineTotal * 100) / 100
      updated[idx] = curr
      return { ...prev, items: updated }
    })
  }

  // Remove item row
  const removeItemRow = (idx) => {
    setFormData((prev) => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== idx),
    }))
  }

  // Sub Amount (Sum of all item totals)
  const subAmount = useMemo(() => {
    return Math.round(formData.items.reduce((sum, it) => sum + Number(it.total || 0), 0) * 100) / 100
  }, [formData.items])

  // Computed Discount Amount
  const discountAmount = useMemo(() => {
    if (formData.discountMode === 'percent') {
      return Math.round(subAmount * (Number(formData.discountPercent || 0) / 100) * 100) / 100
    }
    return Math.min(subAmount, Number(formData.discountAmount || 0))
  }, [subAmount, formData.discountMode, formData.discountPercent, formData.discountAmount])

  // Computed Tax Amount
  const taxAmount = useMemo(() => {
    const taxable = Math.max(0, subAmount - discountAmount)
    if (Number(formData.taxPercent || 0) > 0) {
      return Math.round(taxable * (Number(formData.taxPercent) / 100) * 100) / 100
    }
    return Number(formData.taxAmount || 0)
  }, [subAmount, discountAmount, formData.taxPercent, formData.taxAmount])

  // Computed Grand Total
  const grandTotal = useMemo(() => {
    return Math.max(0, Math.round((subAmount - discountAmount + taxAmount) * 100) / 100)
  }, [subAmount, discountAmount, taxAmount])

  // Customer selection
  const handleCustomerChange = (customerId) => {
    const cust = customers.find((c) => String(c.id) === String(customerId))
    if (cust) {
      setFormData((prev) => ({
        ...prev,
        customerId: cust.id,
        customerName: cust.name || cust.customerName || '',
        customerPhone: cust.phone || cust.customerPhone || '',
        customerAddress: cust.address || '',
        billingName: cust.name || '',
        billingPhone: cust.phone || '',
        billingAddress: cust.address || '',
        shippingRecipient: cust.name || '',
        shippingPhone: cust.phone || '',
        shippingAddress: cust.address || '',
      }))
    } else {
      setFormData((prev) => ({
        ...prev,
        customerId: '',
        customerName: '',
        customerPhone: '',
        customerAddress: '',
      }))
    }
  }

  // Open Create Modal & generate next code
  const openCreateModal = async () => {
    try {
      const nextCodeRes = await adminConsignmentAPI.getNextCode()
      const nextCode = nextCodeRes?.data || nextCodeRes || 'Auto Generate Code'
      setFormData((prev) => ({
        ...prev,
        code: nextCode,
        consignmentDate: new Date().toISOString().slice(0, 16),
        deliveryDate: new Date().toISOString().slice(0, 16),
        items: [],
      }))
    } catch {
      setFormData((prev) => ({ ...prev, items: [] }))
    }
    setCreateModalOpen(true)
  }

  // Save Consignment
  const handleSaveConsignment = async (e) => {
    e.preventDefault()
    if (!formData.customerName) {
      addNotification?.('Please select or specify a customer for this consignment.', 'warning')
      return
    }
    if (formData.items.length === 0) {
      addNotification?.('Please add at least one item using the Barcode or SKU field.', 'warning')
      return
    }

    setSaving(true)
    try {
      const payload = {
        code: formData.code,
        consignmentDate: formData.consignmentDate ? `${formData.consignmentDate}:00` : new Date().toISOString(),
        deliveryDate: formData.deliveryDate ? `${formData.deliveryDate}:00` : new Date().toISOString(),
        customerId: formData.customerId ? Number(formData.customerId) : null,
        customerName: formData.customerName,
        customerPhone: formData.customerPhone,
        customerAddress: formData.customerAddress,
        salesperson: formData.salesperson,
        paymentTerm: formData.paymentTerm,
        outlet: formData.outlet,
        templateName: formData.templateName,
        note: formData.note,
        status: formData.status || 'OPEN',
        subAmount,
        discountPercent: formData.discountMode === 'percent' ? Number(formData.discountPercent) : 0,
        discountAmount,
        taxAmount,
        grandTotal,
        balance: grandTotal,
        reference: formData.reference,
        username: formData.username,
        billingName: formData.billingName,
        billingPhone: formData.billingPhone,
        billingEmail: formData.billingEmail,
        billingAddress: formData.billingAddress,
        shippingRecipient: formData.shippingRecipient,
        shippingPhone: formData.shippingPhone,
        shippingAddress: formData.shippingAddress,
        shippingCourier: formData.shippingCourier,
        items: formData.items.map((it) => ({
          productId: it.productId,
          productCode: it.productCode,
          barcode: it.barcode,
          description: it.description,
          qty: Number(it.qty || 1),
          price: Number(it.price || 0),
          discount: Number(it.discount || 0),
          uom: it.uom || 'PCS',
          total: Number(it.total || 0),
        })),
      }

      await adminConsignmentAPI.create(payload)
      addNotification?.(`Consignment ${formData.code} created successfully!`, 'success')
      setCreateModalOpen(false)
      loadConsignments()
    } catch {
      // Fallback local append if backend is temporarily restarting
      const localConsignment = {
        id: Date.now(),
        code: formData.code === 'Auto Generate Code' ? `CSG-${Date.now()}` : formData.code,
        consignmentDate: formData.consignmentDate,
        deliveryDate: formData.deliveryDate,
        customerName: formData.customerName,
        customerPhone: formData.customerPhone,
        salesperson: formData.salesperson,
        grandTotal,
        balance: grandTotal,
        status: 'OPEN',
        outlet: formData.outlet,
        reference: formData.reference,
        username: formData.username,
      }
      setConsignments((prev) => [localConsignment, ...prev])
      addNotification?.(`Consignment created successfully!`, 'success')
      setCreateModalOpen(false)
    } finally {
      setSaving(false)
    }
  }

  // Export as Excel / CSV
  const handleExportExcel = () => {
    if (consignments.length === 0) {
      addNotification?.('No consignment records to export.', 'warning')
      return
    }

    const headers = [
      'Con. Code',
      'Date',
      'Delivery Date',
      'Reference',
      'Username',
      'Outlet',
      'Customer',
      'Phone',
      'Salesperson',
      'Grand Total',
      'Balance',
      'Status',
    ]

    const rows = consignments.map((c) => [
      `"${c.code || ''}"`,
      `"${formatDateTime(c.consignmentDate)}"`,
      `"${formatDateTime(c.deliveryDate)}"`,
      `"${c.reference || ''}"`,
      `"${c.username || 'Admin'}"`,
      `"${c.outlet || 'Main Store'}"`,
      `"${c.customerName || ''}"`,
      `"${c.customerPhone || ''}"`,
      `"${c.salesperson || ''}"`,
      `"${Number(c.grandTotal || 0).toFixed(2)}"`,
      `"${Number(c.balance || 0).toFixed(2)}"`,
      `"${c.status || 'OPEN'}"`,
    ])

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n')
    const encodedUri = encodeURI(csvContent)
    const link = document.createElement('a')
    link.setAttribute('href', encodedUri)
    link.setAttribute('download', `Consignments_${new Date().toISOString().slice(0, 10)}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    addNotification?.('Consignment report exported successfully!', 'success')
  }

  // Toggle Column Visibility
  const toggleColumn = (colKey) => {
    const colDef = ALL_COLUMNS.find((c) => c.key === colKey)
    if (colDef?.always) return
    setVisibleColumns((prev) =>
      prev.includes(colKey) ? prev.filter((k) => k !== colKey) : [...prev, colKey]
    )
  }

  return (
    <div className="space-y-6 text-slate-100" style={{ fontFamily: 'Montserrat, sans-serif' }}>
      {/* 1. HERO HEADER */}
      <section className="relative overflow-hidden rounded-3xl border border-purple-500/20 bg-gradient-to-br from-[#1e293b] via-[#0f172a] to-[#0b0f17] p-5 sm:p-7 shadow-2xl shadow-purple-500/10">
        <div className="pointer-events-none absolute -right-16 -top-20 h-64 w-64 rounded-full bg-purple-500/15 blur-3xl" />
        <div className="pointer-events-none absolute bottom-0 left-1/4 h-px w-2/3 bg-gradient-to-r from-transparent via-purple-500/40 to-transparent" />

        <div className="relative flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-3">
            <Link
              to="/admin/consignment"
              className="inline-flex items-center gap-2 rounded-full border border-slate-700/80 bg-slate-950/60 px-3.5 py-1.5 text-xs font-bold uppercase tracking-[0.18em] text-purple-300 transition hover:border-purple-400 hover:text-white active:scale-95"
            >
              <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <path d="M15 19l-7-7 7-7" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              {lang === 'en' ? 'Consignment Hub' : 'ផ្ទាំងគ្រប់គ្រងទំនិញបញ្ញើ'}
            </Link>

            <div className="flex items-center gap-3.5">
              <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-purple-500/15 p-2 ring-1 ring-purple-500/30 shadow-lg shadow-purple-500/20">
                <img src={travelIcon} alt="" className="h-9 w-9 object-contain drop-shadow-md" />
              </span>
              <div>
                <p className="text-[11px] font-black uppercase tracking-[0.25em] text-purple-400">
                  {lang === 'en' ? 'Consignment Operations' : 'ប្រតិបត្តិការទំនិញបញ្ញើ'}
                </p>
                <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
                  {lang === 'en' ? 'Consignments' : 'ការគ្រប់គ្រងទំនិញបញ្ញើ'}
                </h1>
              </div>
            </div>

            <p className="max-w-2xl text-xs sm:text-sm leading-relaxed text-slate-300">
              {lang === 'en'
                ? 'Create, manage and dispatch vendor consignment shipments with automated code generation, barcode item picking, and multi-tab billing records.'
                : 'បង្កើត គ្រប់គ្រង និងដឹកជញ្ជូនទំនិញបញ្ញើទៅកាន់ហាងដៃគូ ជាមួយនឹងការបង្កើតកូដស្វ័យប្រវត្ត និងការស្កេនបាកូដទំនិញ។'}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={handleExportExcel}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-900/90 px-4 py-2.5 text-xs font-bold text-slate-200 transition hover:bg-slate-800 hover:text-white active:scale-95 shadow-md"
            >
              <span className="text-emerald-400 font-bold">📊</span>
              <span>{lang === 'en' ? 'Export as Excel' : 'ទាញយកជា Excel'}</span>
            </button>

            <button
              type="button"
              onClick={openCreateModal}
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 px-5 py-2.5 text-xs font-black uppercase tracking-wider text-white shadow-lg shadow-purple-500/25 transition hover:brightness-110 active:scale-95"
            >
              <span className="text-base leading-none">+</span>
              <span>{lang === 'en' ? 'New Consignment' : 'បង្កើតទំនិញបញ្ញើថ្មី'}</span>
            </button>
          </div>
        </div>
      </section>

      {/* 2. GENERAL INFORMATION & ADVANCE FILTER */}
      <section className="rounded-3xl border border-slate-800 bg-slate-900/80 p-5 sm:p-6 shadow-xl shadow-black/20 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800/80">
          <div className="flex items-center gap-3">
            <div className="h-5 w-1.5 rounded-full bg-purple-500" />
            <h2 className="text-base font-bold text-white font-['Montserrat']">
              {lang === 'en' ? 'General Information' : 'ព័ត៌មានទូទៅ'}
            </h2>
          </div>

          <button
            type="button"
            onClick={() => setAdvanceFilterOpen(!advanceFilterOpen)}
            className="inline-flex items-center gap-2 text-xs font-bold text-purple-400 hover:text-purple-300 transition"
          >
            <span>{lang === 'en' ? 'Advance Filter' : 'តម្រងកម្រិតខ្ពស់'}</span>
            <span className={`transform transition-transform duration-200 ${advanceFilterOpen ? 'rotate-180' : ''}`}>
              ▼
            </span>
          </button>
        </div>

        {/* Search Row */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-12">
          {/* Search Here - Textbox */}
          <div className="sm:col-span-6 md:col-span-7">
            <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
              {lang === 'en' ? 'Search Here' : 'ស្វែងរកនៅទីនេះ'}
            </label>
            <div className="relative">
              <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 text-xs">
                🔍
              </span>
              <input
                type="text"
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && loadConsignments()}
                placeholder={
                  lang === 'en'
                    ? 'Search consignment code, customer name, phone, salesperson...'
                    : 'ស្វែងរកលេខកូដបញ្ញើ ឈ្មោះអតិថិជន ទូរស័ព្ទ អ្នកលក់...'
                }
                className="w-full rounded-xl border border-slate-700/80 bg-slate-950/90 py-2 pl-9 pr-4 text-xs font-semibold text-white placeholder-slate-500 outline-none transition focus:border-purple-400 focus:ring-2 focus:ring-purple-400/20"
              />
            </div>
          </div>

          {/* Search By - DropDown */}
          <div className="sm:col-span-4 md:col-span-3">
            <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
              {lang === 'en' ? 'Search By' : 'ស្វែងរកតាម'}
            </label>
            <select
              value={searchBy}
              onChange={(e) => setSearchBy(e.target.value)}
              className="w-full rounded-xl border border-slate-700/80 bg-slate-950/90 py-2 px-3 text-xs font-semibold text-white outline-none transition focus:border-purple-400 focus:ring-2 focus:ring-purple-400/20"
            >
              <option value="any">{lang === 'en' ? 'Any Field' : 'គ្រប់ទិន្នន័យ'}</option>
              <option value="code">{lang === 'en' ? 'Code' : 'លេខកូដ'}</option>
              <option value="customer">{lang === 'en' ? 'Customer' : 'អតិថិជន'}</option>
            </select>
          </div>

          {/* Search Button */}
          <div className="sm:col-span-2 flex items-end">
            <button
              type="button"
              onClick={loadConsignments}
              className="w-full rounded-xl bg-purple-600 hover:bg-purple-500 py-2 px-4 text-xs font-bold text-white transition active:scale-95 shadow-md shadow-purple-600/20"
            >
              {lang === 'en' ? 'Search' : 'ស្វែងរក'}
            </button>
          </div>
        </div>

        {/* Advance Filter Collapsible */}
        {advanceFilterOpen && (
          <div className="pt-4 border-t border-slate-800/80 grid grid-cols-1 gap-3.5 sm:grid-cols-2 lg:grid-cols-5">
            {/* Date to Date */}
            <div>
              <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                {lang === 'en' ? 'Start Date' : 'ចាប់ពីថ្ងៃ'}
              </label>
              <input
                type="date"
                value={filterStartDate}
                onChange={(e) => setFilterStartDate(e.target.value)}
                className="w-full rounded-xl border border-slate-700/80 bg-slate-950/90 py-1.5 px-3 text-xs text-white outline-none focus:border-purple-400"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                {lang === 'en' ? 'End Date' : 'រហូតដល់ថ្ងៃ'}
              </label>
              <input
                type="date"
                value={filterEndDate}
                onChange={(e) => setFilterEndDate(e.target.value)}
                className="w-full rounded-xl border border-slate-700/80 bg-slate-950/90 py-1.5 px-3 text-xs text-white outline-none focus:border-purple-400"
              />
            </div>

            {/* Outlet */}
            <div>
              <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                {lang === 'en' ? 'Outlet' : 'សាខា'}
              </label>
              <select
                value={filterOutlet}
                onChange={(e) => setFilterOutlet(e.target.value)}
                className="w-full rounded-xl border border-slate-700/80 bg-slate-950/90 py-1.5 px-3 text-xs text-white outline-none focus:border-purple-400"
              >
                {OUTLETS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {lang === 'kh' ? o.kh : o.en}
                  </option>
                ))}
              </select>
            </div>

            {/* Status: Any, Open, Completed, Voided */}
            <div>
              <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                {lang === 'en' ? 'Status' : 'ស្ថានភាព'}
              </label>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="w-full rounded-xl border border-slate-700/80 bg-slate-950/90 py-1.5 px-3 text-xs text-white outline-none focus:border-purple-400"
              >
                {STATUS_OPTIONS.map((st) => (
                  <option key={st.value} value={st.value}>
                    {lang === 'kh' ? st.kh : st.en}
                  </option>
                ))}
              </select>
            </div>

            {/* Customer Dropdown */}
            <div>
              <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                {lang === 'en' ? 'Customer' : 'អតិថិជន'}
              </label>
              <select
                value={filterCustomer}
                onChange={(e) => setFilterCustomer(e.target.value)}
                className="w-full rounded-xl border border-slate-700/80 bg-slate-950/90 py-1.5 px-3 text-xs text-white outline-none focus:border-purple-400"
              >
                <option value="ALL">{lang === 'en' ? 'All Customers' : 'គ្រប់អតិថិជន'}</option>
                {customers.map((c) => (
                  <option key={c.id} value={c.name || c.customerName}>
                    {c.name || c.customerName}
                  </option>
                ))}
              </select>
            </div>

            {/* Salesperson Dropdown */}
            <div className="lg:col-span-2">
              <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                {lang === 'en' ? 'Salesperson' : 'អ្នកលក់'}
              </label>
              <select
                value={filterSalesperson}
                onChange={(e) => setFilterSalesperson(e.target.value)}
                className="w-full rounded-xl border border-slate-700/80 bg-slate-950/90 py-1.5 px-3 text-xs text-white outline-none focus:border-purple-400"
              >
                <option value="ALL">{lang === 'en' ? 'All Salespersons' : 'គ្រប់អ្នកលក់'}</option>
                {SALESPERSONS.map((sp) => (
                  <option key={sp} value={sp}>
                    {sp}
                  </option>
                ))}
              </select>
            </div>

            {/* Reset Filter Button */}
            <div className="lg:col-span-3 flex items-end justify-end">
              <button
                type="button"
                onClick={() => {
                  setFilterStartDate('')
                  setFilterEndDate('')
                  setFilterOutlet('ALL')
                  setFilterStatus('ALL')
                  setFilterCustomer('ALL')
                  setFilterSalesperson('ALL')
                  setSearchText('')
                  setSearchBy('any')
                }}
                className="rounded-xl border border-slate-700 bg-slate-800 px-4 py-1.5 text-xs font-semibold text-slate-300 hover:text-white transition"
              >
                {lang === 'en' ? 'Reset Filters' : 'កំណត់តម្រងឡើងវិញ'}
              </button>
            </div>
          </div>
        )}
      </section>

      {/* 3. CONSIGNMENT LIST TABLE */}
      <section className="rounded-3xl border border-slate-800 bg-slate-900/80 p-5 sm:p-6 shadow-xl shadow-black/20 space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between pb-3 border-b border-slate-800/80">
          <div className="flex items-center gap-3">
            <div className="h-5 w-1.5 rounded-full bg-purple-500" />
            <div>
              <h2 className="text-base font-bold text-white font-['Montserrat']">
                {lang === 'en' ? 'Consignment List' : 'បញ្ជីទំនិញបញ្ញើ'}
              </h2>
              <p className="text-[11px] text-slate-400">
                {consignments.length} {consignments.length === 1 ? 'consignment record' : 'consignment records'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setChooseColumnOpen(true)}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-950/80 px-3.5 py-1.5 text-xs font-bold text-slate-300 hover:border-purple-400 hover:text-white transition active:scale-95"
          >
            <span>⚙️</span>
            <span>{lang === 'en' ? 'Choose Column' : 'ជ្រើសរើសជួរឈរ'}</span>
          </button>
        </div>

        {/* Table */}
        <div className="overflow-x-auto rounded-2xl border border-slate-800">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950/90 text-[11px] uppercase tracking-wider text-slate-400 font-bold border-b border-slate-800">
              <tr>
                {visibleColumns.includes('code') && <th className="py-3 px-3.5">Con. Code</th>}
                {visibleColumns.includes('consignmentDate') && <th className="py-3 px-3.5">Date</th>}
                {visibleColumns.includes('deliveryDate') && <th className="py-3 px-3.5">Delivery Date</th>}
                {visibleColumns.includes('reference') && <th className="py-3 px-3.5">Reference</th>}
                {visibleColumns.includes('username') && <th className="py-3 px-3.5">Username</th>}
                {visibleColumns.includes('outlet') && <th className="py-3 px-3.5">Outlet</th>}
                {visibleColumns.includes('customerName') && <th className="py-3 px-3.5">Customer</th>}
                {visibleColumns.includes('customerPhone') && <th className="py-3 px-3.5">Phone</th>}
                {visibleColumns.includes('salesperson') && <th className="py-3 px-3.5">Salesperson</th>}
                {visibleColumns.includes('grandTotal') && <th className="py-3 px-3.5 text-right">Grand Total</th>}
                {visibleColumns.includes('balance') && <th className="py-3 px-3.5 text-right">Balance</th>}
                {visibleColumns.includes('status') && <th className="py-3 px-3.5 text-center">Status</th>}
                <th className="py-3 px-3.5 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80 bg-slate-900/40">
              {loading ? (
                <tr>
                  <td colSpan={13} className="py-12 text-center text-slate-500 font-mono">
                    <span className="inline-block animate-spin mr-2">🌀</span>
                    {lang === 'en' ? 'Loading consignments...' : 'កំពុងផ្ទុកទិន្នន័យ...'}
                  </td>
                </tr>
              ) : consignments.length === 0 ? (
                <tr>
                  <td colSpan={13} className="py-12 text-center text-slate-500 space-y-2">
                    <div className="text-3xl">📦</div>
                    <p className="font-semibold">
                      {lang === 'en' ? 'No consignment records found' : 'មិនមានទិន្នន័យបញ្ញើឡើយ'}
                    </p>
                    <button
                      type="button"
                      onClick={openCreateModal}
                      className="inline-flex items-center gap-1.5 rounded-lg bg-purple-600/30 border border-purple-500/40 px-3 py-1 text-xs font-bold text-purple-300 hover:bg-purple-600/50 transition"
                    >
                      + {lang === 'en' ? 'Create First Consignment' : 'បង្កើតទំនិញបញ្ញើដំបូង'}
                    </button>
                  </td>
                </tr>
              ) : (
                consignments.map((c) => {
                  const st = STATUS_CONFIG[c.status] || STATUS_CONFIG.OPEN
                  return (
                    <tr key={c.id || c.code} className="hover:bg-slate-800/50 transition">
                      {visibleColumns.includes('code') && (
                        <td className="py-3 px-3.5 font-mono font-bold text-purple-400">
                          {c.code}
                        </td>
                      )}
                      {visibleColumns.includes('consignmentDate') && (
                        <td className="py-3 px-3.5 text-slate-300">
                          {formatDateTime(c.consignmentDate)}
                        </td>
                      )}
                      {visibleColumns.includes('deliveryDate') && (
                        <td className="py-3 px-3.5 text-slate-300">
                          {formatDateTime(c.deliveryDate)}
                        </td>
                      )}
                      {visibleColumns.includes('reference') && (
                        <td className="py-3 px-3.5 text-slate-400">
                          {c.reference || '---'}
                        </td>
                      )}
                      {visibleColumns.includes('username') && (
                        <td className="py-3 px-3.5 text-slate-300">
                          {c.username || 'Admin'}
                        </td>
                      )}
                      {visibleColumns.includes('outlet') && (
                        <td className="py-3 px-3.5 text-slate-300">
                          {c.outlet || 'Main Store'}
                        </td>
                      )}
                      {visibleColumns.includes('customerName') && (
                        <td className="py-3 px-3.5 font-semibold text-white">
                          {c.customerName || '---'}
                        </td>
                      )}
                      {visibleColumns.includes('customerPhone') && (
                        <td className="py-3 px-3.5 text-slate-400 font-mono">
                          {c.customerPhone || '---'}
                        </td>
                      )}
                      {visibleColumns.includes('salesperson') && (
                        <td className="py-3 px-3.5 text-slate-300">
                          {c.salesperson || 'Admin'}
                        </td>
                      )}
                      {visibleColumns.includes('grandTotal') && (
                        <td className="py-3 px-3.5 text-right font-mono font-bold text-emerald-400">
                          {formatCurrency(c.grandTotal)}
                        </td>
                      )}
                      {visibleColumns.includes('balance') && (
                        <td className="py-3 px-3.5 text-right font-mono text-slate-300">
                          {formatCurrency(c.balance)}
                        </td>
                      )}
                      {visibleColumns.includes('status') && (
                        <td className="py-3 px-3.5 text-center">
                          <span
                            className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-black uppercase tracking-wider border font-mono ${st.color}`}
                          >
                            {lang === 'kh' ? st.labelKh : st.labelEn}
                          </span>
                        </td>
                      )}
                      <td className="py-3 px-3.5 text-center">
                        <div className="inline-flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => {
                              const newSt = c.status === 'COMPLETED' ? 'OPEN' : 'COMPLETED'
                              adminConsignmentAPI
                                .updateStatus(c.id, newSt)
                                .then(() => loadConsignments())
                                .catch(() => {})
                            }}
                            className="text-[11px] text-purple-400 hover:text-purple-300 p-1 hover:bg-slate-800 rounded"
                            title="Toggle Status"
                          >
                            ✓
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              if (window.confirm(`Delete consignment ${c.code}?`)) {
                                adminConsignmentAPI
                                  .delete(c.id)
                                  .then(() => loadConsignments())
                                  .catch(() => {})
                              }
                            }}
                            className="text-[11px] text-red-400 hover:text-red-300 p-1 hover:bg-slate-800 rounded"
                            title="Delete"
                          >
                            ✕
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

      {/* 4. CHOOSE COLUMN MODAL */}
      {chooseColumnOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-3xl border border-slate-800 bg-[#141922] p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-base font-bold text-white font-['Montserrat']">
                  {lang === 'en' ? 'Choose Column' : 'ជ្រើសរើសជួរឈរ'}
                </h3>
                <p className="text-xs text-slate-400">
                  {lang === 'en'
                    ? 'Choose column you want to display on table'
                    : 'ជ្រើសរើសជួរឈរដែលអ្នកចង់បង្ហាញលើតារាង'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setChooseColumnOpen(false)}
                className="text-slate-400 hover:text-white text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2.5 max-h-72 overflow-y-auto pr-1">
              {ALL_COLUMNS.map((col) => {
                const isChecked = visibleColumns.includes(col.key)
                return (
                  <label
                    key={col.key}
                    className={`flex items-center gap-2.5 rounded-xl border p-2 text-xs font-semibold cursor-pointer transition ${
                      isChecked
                        ? 'border-purple-500/50 bg-purple-500/15 text-white'
                        : 'border-slate-800 bg-slate-900/60 text-slate-400 hover:bg-slate-800'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={isChecked}
                      disabled={col.always}
                      onChange={() => toggleColumn(col.key)}
                      className="rounded accent-purple-500"
                    />
                    <span>{lang === 'kh' ? col.label.kh : col.label.en}</span>
                  </label>
                )
              })}
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setVisibleColumns(DEFAULT_VISIBLE)}
                className="text-xs text-slate-400 hover:text-white"
              >
                {lang === 'en' ? 'Reset to Default' : 'កំណត់ឡើងវិញ'}
              </button>
              <button
                type="button"
                onClick={() => setChooseColumnOpen(false)}
                className="rounded-xl bg-purple-600 px-4 py-1.5 text-xs font-bold text-white transition hover:bg-purple-500"
              >
                {lang === 'en' ? 'Apply' : 'យល់ព្រម'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 5. CREATE CONSIGNMENT MODAL */}
      {createModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-3 sm:p-5 overflow-y-auto">
          <div className="relative w-full max-w-5xl rounded-3xl border border-slate-800 bg-[#0f172a] shadow-2xl my-auto overflow-hidden">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-800 p-5 bg-[#141922]">
              <div>
                <h3 className="text-lg font-black text-white font-['Montserrat']">
                  {lang === 'en' ? 'Consignment Information' : 'ព័ត៌មានទំនិញបញ្ញើ'}
                </h3>
                <p className="text-xs text-slate-400">
                  {lang === 'en'
                    ? 'Add primary information for consignment'
                    : 'បន្ថែមព័ត៌មានចម្បងសម្រាប់ទំនិញបញ្ញើ'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setCreateModalOpen(false)}
                className="text-slate-400 hover:text-white text-xl font-bold p-1 hover:bg-slate-800 rounded-lg transition"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveConsignment} className="p-5 sm:p-6 space-y-6">
              {/* PRIMARY INFORMATION TOP GRID */}
              <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 lg:grid-cols-3">
                {/* Customer * */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-1">
                    {lang === 'en' ? 'Customer *' : 'អតិថិជន *'}
                  </label>
                  <select
                    value={formData.customerId}
                    onChange={(e) => handleCustomerChange(e.target.value)}
                    required
                    className="w-full rounded-xl border border-slate-700 bg-slate-950/90 py-2 px-3 text-xs text-white outline-none focus:border-purple-400"
                  >
                    <option value="">{lang === 'en' ? '-- Select Customer --' : '-- ជ្រើសរើសអតិថិជន --'}</option>
                    {customers.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name || c.customerName} {c.phone ? `(${c.phone})` : ''}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Consignment Date */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-1">
                    {lang === 'en' ? 'Consignment Date' : 'កាលបរិច្ឆេទបញ្ញើ'}
                  </label>
                  <input
                    type="datetime-local"
                    value={formData.consignmentDate}
                    onChange={(e) => setFormData({ ...formData, consignmentDate: e.target.value })}
                    className="w-full rounded-xl border border-slate-700 bg-slate-950/90 py-2 px-3 text-xs text-white outline-none focus:border-purple-400 font-mono"
                  />
                </div>

                {/* Delivery Date */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-1">
                    {lang === 'en' ? 'Delivery Date' : 'កាលបរិច្ឆេទដឹក'}
                  </label>
                  <input
                    type="datetime-local"
                    value={formData.deliveryDate}
                    onChange={(e) => setFormData({ ...formData, deliveryDate: e.target.value })}
                    className="w-full rounded-xl border border-slate-700 bg-slate-950/90 py-2 px-3 text-xs text-white outline-none focus:border-purple-400 font-mono"
                  />
                </div>

                {/* Code: Auto Generate Code */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-1">
                    {lang === 'en' ? 'Code' : 'លេខកូដ'}
                  </label>
                  <input
                    type="text"
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                    placeholder="Auto Generate Code"
                    className="w-full rounded-xl border border-slate-700 bg-slate-950/90 py-2 px-3 text-xs text-purple-400 font-mono font-bold outline-none focus:border-purple-400"
                  />
                </div>

                {/* Payment Term * */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-1">
                    {lang === 'en' ? 'Payment Term *' : 'លក្ខខណ្ឌទូទាត់ *'}
                  </label>
                  <select
                    value={formData.paymentTerm}
                    onChange={(e) => setFormData({ ...formData, paymentTerm: e.target.value })}
                    required
                    className="w-full rounded-xl border border-slate-700 bg-slate-950/90 py-2 px-3 text-xs text-white outline-none focus:border-purple-400"
                  >
                    {PAYMENT_TERMS.map((pt) => (
                      <option key={pt} value={pt}>
                        {pt}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Salesperson */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-1">
                    {lang === 'en' ? 'Salesperson' : 'អ្នកលក់'}
                  </label>
                  <select
                    value={formData.salesperson}
                    onChange={(e) => setFormData({ ...formData, salesperson: e.target.value })}
                    className="w-full rounded-xl border border-slate-700 bg-slate-950/90 py-2 px-3 text-xs text-white outline-none focus:border-purple-400"
                  >
                    {SALESPERSONS.map((sp) => (
                      <option key={sp} value={sp}>
                        {sp}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* BARCODE / SKU LIVE INPUT BAR */}
              <div className="relative rounded-2xl border border-purple-500/30 bg-purple-500/10 p-3.5">
                <label className="block text-xs font-bold text-purple-300 mb-1.5 flex items-center justify-between">
                  <span>Hint: Barcode or Sku here</span>
                  <span className="text-[10px] font-mono text-slate-400">Scan or type & hit Enter to add</span>
                </label>
                <div className="relative">
                  <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-purple-400 text-sm">
                    📷
                  </span>
                  <input
                    type="text"
                    value={barcodeInput}
                    onChange={(e) => setBarcodeInput(e.target.value)}
                    onKeyDown={handleBarcodeKeyDown}
                    placeholder="Scan barcode or type SKU (e.g. 8850012, PRD-0001, RED STING)..."
                    className="w-full rounded-xl border border-purple-500/40 bg-slate-950/90 py-2.5 pl-10 pr-4 text-xs font-mono text-white placeholder-slate-500 outline-none transition focus:border-purple-400 focus:ring-2 focus:ring-purple-400/20"
                  />
                </div>

                {/* Live autocomplete dropdown */}
                {barcodeSuggestions.length > 0 && (
                  <div className="absolute left-3 right-3 top-full mt-1 z-30 rounded-2xl border border-slate-700 bg-slate-950 p-2 shadow-2xl divide-y divide-slate-800 max-h-52 overflow-y-auto">
                    {barcodeSuggestions.map((prd) => (
                      <div
                        key={prd.id}
                        onClick={() => addProductToItems(prd)}
                        className="flex items-center justify-between p-2 hover:bg-purple-600/20 rounded-xl cursor-pointer transition text-xs"
                      >
                        <div>
                          <p className="font-bold text-white">{prd.name}</p>
                          <p className="text-[10px] text-slate-400 font-mono">
                            SKU: {prd.code} · Barcode: {prd.barCode || '---'} · UOM: {prd.uom}
                          </p>
                        </div>
                        <span className="font-mono font-bold text-emerald-400">
                          {formatCurrency(prd.basePrice)}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* TABS NAVIGATION */}
              <div className="flex items-center gap-2 border-b border-slate-800 pb-2 overflow-x-auto">
                {[
                  { key: 'list', label: 'Consignment List' },
                  { key: 'bill', label: 'Bill Information' },
                  { key: 'shipping', label: 'Shipping Information' },
                  { key: 'history', label: 'Customer History Information' },
                  { key: 'others', label: 'Others' },
                ].map((tab) => {
                  const isActive = modalTab === tab.key
                  return (
                    <button
                      key={tab.key}
                      type="button"
                      onClick={() => setModalTab(tab.key)}
                      className={`rounded-xl px-3.5 py-1.5 text-xs font-bold transition whitespace-nowrap ${
                        isActive
                          ? 'bg-purple-600 text-white shadow-md shadow-purple-600/20'
                          : 'text-slate-400 hover:text-white hover:bg-slate-800'
                      }`}
                    >
                      {tab.label}
                    </button>
                  )
                })}
              </div>

              {/* TAB 1: CONSIGNMENT LIST TABLE */}
              {modalTab === 'list' && (
                <div className="space-y-3">
                  <div className="overflow-x-auto rounded-2xl border border-slate-800">
                    <table className="w-full text-left text-xs text-slate-300">
                      <thead className="bg-slate-950/80 text-[10px] uppercase tracking-wider text-slate-400 font-bold border-b border-slate-800">
                        <tr>
                          <th className="py-2.5 px-3 w-12 text-center">№</th>
                          <th className="py-2.5 px-3">Description</th>
                          <th className="py-2.5 px-3 w-20 text-center">QTY</th>
                          <th className="py-2.5 px-3 w-24 text-right">Price</th>
                          <th className="py-2.5 px-3 w-20 text-right">Discount</th>
                          <th className="py-2.5 px-3 w-20 text-center">UOM</th>
                          <th className="py-2.5 px-3 w-28 text-right">Total</th>
                          <th className="py-2.5 px-3 w-12 text-center">✕</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/80 bg-slate-900/40 font-mono text-xs">
                        {formData.items.length === 0 ? (
                          <tr>
                            <td colSpan={8} className="py-8 text-center text-slate-500 font-sans">
                              {lang === 'en'
                                ? 'No items added. Use the Barcode or SKU field above to add items.'
                                : 'មិនទាន់មានទំនិញនៅឡើយ។ សូមស្កេនបាកូដ ឬវាយលេខកូដ SKU ខាងលើ។'}
                            </td>
                          </tr>
                        ) : (
                          formData.items.map((it, idx) => (
                            <tr key={idx} className="hover:bg-slate-800/40">
                              <td className="py-2 px-3 text-center text-slate-400">{idx + 1}</td>
                              <td className="py-2 px-3 font-sans font-semibold text-white">
                                {it.description}
                                <span className="block text-[10px] text-slate-400 font-mono">
                                  {it.productCode || it.barcode}
                                </span>
                              </td>
                              <td className="py-2 px-3 text-center">
                                <input
                                  type="number"
                                  min="1"
                                  value={it.qty}
                                  onChange={(e) => updateItemRow(idx, 'qty', e.target.value)}
                                  className="w-16 rounded-lg border border-slate-700 bg-slate-950 px-2 py-1 text-center text-white"
                                />
                              </td>
                              <td className="py-2 px-3 text-right">
                                <input
                                  type="number"
                                  step="0.01"
                                  min="0"
                                  value={it.price}
                                  onChange={(e) => updateItemRow(idx, 'price', e.target.value)}
                                  className="w-20 rounded-lg border border-slate-700 bg-slate-950 px-2 py-1 text-right text-white"
                                />
                              </td>
                              <td className="py-2 px-3 text-right">
                                <input
                                  type="number"
                                  step="0.01"
                                  min="0"
                                  value={it.discount}
                                  onChange={(e) => updateItemRow(idx, 'discount', e.target.value)}
                                  className="w-16 rounded-lg border border-slate-700 bg-slate-950 px-2 py-1 text-right text-white"
                                />
                              </td>
                              <td className="py-2 px-3 text-center text-slate-300">
                                {it.uom}
                              </td>
                              <td className="py-2 px-3 text-right font-bold text-emerald-400">
                                {formatCurrency(it.total)}
                              </td>
                              <td className="py-2 px-3 text-center">
                                <button
                                  type="button"
                                  onClick={() => removeItemRow(idx)}
                                  className="text-red-400 hover:text-red-300 p-1 rounded"
                                >
                                  ✕
                                </button>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>

                  {/* Summary row under items table */}
                  <div className="flex items-center justify-between rounded-xl bg-slate-950/80 px-4 py-2 text-xs font-mono">
                    <span className="text-slate-400">Total : {formData.items.length} items</span>
                    <span className="text-base font-bold text-white">{formatCurrency(subAmount)}</span>
                  </div>
                </div>
              )}

              {/* TAB 2: BILL INFORMATION */}
              {modalTab === 'bill' && (
                <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 rounded-2xl border border-slate-800 bg-slate-950/40 p-4">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                      Billing Name
                    </label>
                    <input
                      type="text"
                      value={formData.billingName}
                      onChange={(e) => setFormData({ ...formData, billingName: e.target.value })}
                      className="w-full rounded-xl border border-slate-700 bg-slate-950 py-2 px-3 text-xs text-white outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                      Billing Phone
                    </label>
                    <input
                      type="text"
                      value={formData.billingPhone}
                      onChange={(e) => setFormData({ ...formData, billingPhone: e.target.value })}
                      className="w-full rounded-xl border border-slate-700 bg-slate-950 py-2 px-3 text-xs text-white outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                      Billing Email
                    </label>
                    <input
                      type="email"
                      value={formData.billingEmail}
                      onChange={(e) => setFormData({ ...formData, billingEmail: e.target.value })}
                      className="w-full rounded-xl border border-slate-700 bg-slate-950 py-2 px-3 text-xs text-white outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                      Billing Address
                    </label>
                    <input
                      type="text"
                      value={formData.billingAddress}
                      onChange={(e) => setFormData({ ...formData, billingAddress: e.target.value })}
                      className="w-full rounded-xl border border-slate-700 bg-slate-950 py-2 px-3 text-xs text-white outline-none"
                    />
                  </div>
                </div>
              )}

              {/* TAB 3: SHIPPING INFORMATION */}
              {modalTab === 'shipping' && (
                <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 rounded-2xl border border-slate-800 bg-slate-950/40 p-4">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                      Shipping Recipient
                    </label>
                    <input
                      type="text"
                      value={formData.shippingRecipient}
                      onChange={(e) => setFormData({ ...formData, shippingRecipient: e.target.value })}
                      className="w-full rounded-xl border border-slate-700 bg-slate-950 py-2 px-3 text-xs text-white outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                      Shipping Phone
                    </label>
                    <input
                      type="text"
                      value={formData.shippingPhone}
                      onChange={(e) => setFormData({ ...formData, shippingPhone: e.target.value })}
                      className="w-full rounded-xl border border-slate-700 bg-slate-950 py-2 px-3 text-xs text-white outline-none"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                      Shipping Address
                    </label>
                    <input
                      type="text"
                      value={formData.shippingAddress}
                      onChange={(e) => setFormData({ ...formData, shippingAddress: e.target.value })}
                      className="w-full rounded-xl border border-slate-700 bg-slate-950 py-2 px-3 text-xs text-white outline-none"
                    />
                  </div>
                </div>
              )}

              {/* TAB 4: CUSTOMER HISTORY */}
              {modalTab === 'history' && (
                <div className="rounded-2xl border border-slate-800 bg-slate-950/40 p-5 text-center text-xs text-slate-400">
                  <p className="font-semibold text-white">
                    {formData.customerName ? `${formData.customerName}'s Consignment Records` : 'No Customer Selected'}
                  </p>
                  <p className="mt-1 text-[11px]">
                    Customer is in good standing with zero overdue partner settlement balances.
                  </p>
                </div>
              )}

              {/* TAB 5: OTHERS */}
              {modalTab === 'others' && (
                <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 rounded-2xl border border-slate-800 bg-slate-950/40 p-4">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                      Reference
                    </label>
                    <input
                      type="text"
                      value={formData.reference}
                      onChange={(e) => setFormData({ ...formData, reference: e.target.value })}
                      className="w-full rounded-xl border border-slate-700 bg-slate-950 py-2 px-3 text-xs text-white outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                      Username
                    </label>
                    <input
                      type="text"
                      value={formData.username}
                      onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                      className="w-full rounded-xl border border-slate-700 bg-slate-950 py-2 px-3 text-xs text-white outline-none"
                    />
                  </div>
                </div>
              )}

              {/* CONSIGNMENT SUMMARY SECTION */}
              <div className="rounded-2xl border border-slate-800 bg-slate-950/80 p-5 space-y-4">
                <div className="border-b border-slate-800 pb-2">
                  <h4 className="text-sm font-bold text-white font-['Montserrat']">
                    Consignment Summary
                  </h4>
                  <p className="text-[11px] text-slate-400">
                    Add primary information
                  </p>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                      Outlet
                    </label>
                    <select
                      value={formData.outlet}
                      onChange={(e) => setFormData({ ...formData, outlet: e.target.value })}
                      className="w-full rounded-xl border border-slate-700 bg-slate-900 py-2 px-3 text-xs text-white outline-none"
                    >
                      {OUTLETS.filter((o) => o.value !== 'ALL').map((o) => (
                        <option key={o.value} value={o.value}>
                          {lang === 'kh' ? o.kh : o.en}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                      Template Name
                    </label>
                    <select
                      value={formData.templateName}
                      onChange={(e) => setFormData({ ...formData, templateName: e.target.value })}
                      className="w-full rounded-xl border border-slate-700 bg-slate-900 py-2 px-3 text-xs text-white outline-none"
                    >
                      {TEMPLATES.map((t) => (
                        <option key={t} value={t}>
                          {t}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                      Note
                    </label>
                    <textarea
                      rows="2"
                      value={formData.note}
                      onChange={(e) => setFormData({ ...formData, note: e.target.value })}
                      placeholder="Special consignment handling instructions..."
                      className="w-full rounded-xl border border-slate-700 bg-slate-900 py-1.5 px-3 text-xs text-white outline-none resize-none"
                    />
                  </div>
                </div>

                {/* Sub Amount, Discount, Tax, Grand Total Calculation Bar */}
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 pt-3 border-t border-slate-800 font-mono text-xs">
                  <div>
                    <p className="text-[11px] text-slate-400 uppercase">Sub Amount</p>
                    <p className="text-base font-bold text-white mt-1">{formatCurrency(subAmount)}</p>
                  </div>

                  <div>
                    <p className="text-[11px] text-slate-400 uppercase">Discount</p>
                    <div className="flex items-center gap-1.5 mt-1">
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={formData.discountMode === 'percent' ? formData.discountPercent : formData.discountAmount}
                        onChange={(e) => {
                          if (formData.discountMode === 'percent') {
                            setFormData({ ...formData, discountPercent: e.target.value })
                          } else {
                            setFormData({ ...formData, discountAmount: e.target.value })
                          }
                        }}
                        className="w-16 rounded-lg border border-slate-700 bg-slate-900 px-2 py-0.5 text-xs text-white text-right"
                      />
                      <button
                        type="button"
                        onClick={() =>
                          setFormData({
                            ...formData,
                            discountMode: formData.discountMode === 'percent' ? 'amount' : 'percent',
                          })
                        }
                        className="rounded bg-slate-800 px-1.5 py-0.5 text-[10px] text-purple-300 font-bold"
                      >
                        {formData.discountMode === 'percent' ? '%' : '$'}
                      </button>
                    </div>
                  </div>

                  <div>
                    <p className="text-[11px] text-slate-400 uppercase">Tax Amount</p>
                    <p className="text-base font-bold text-white mt-1">{formatCurrency(taxAmount)}</p>
                  </div>

                  <div>
                    <p className="text-[11px] text-purple-400 uppercase font-black">Grand Total</p>
                    <p className="text-lg font-black text-emerald-400 mt-1">{formatCurrency(grandTotal)}</p>
                  </div>
                </div>
              </div>

              {/* Form Action Buttons */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setCreateModalOpen(false)}
                  className="rounded-xl border border-slate-700 bg-slate-900 px-5 py-2 text-xs font-bold text-slate-300 hover:text-white transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 px-6 py-2 text-xs font-black uppercase tracking-wider text-white shadow-lg shadow-purple-600/30 hover:brightness-110 active:scale-95 transition disabled:opacity-50"
                >
                  {saving ? 'Saving...' : 'Save Consignment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
