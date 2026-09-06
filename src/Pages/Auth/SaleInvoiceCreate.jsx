import React, { useState, useEffect, useMemo, useRef } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useLanguage } from '../../context/LanguageContext'
import { useNotifications } from '../../context/NotificationContext'
import {
  adminSaleInvoiceAPI,
  adminCustomerAPI,
  adminProductAPI,
  adminUnitAPI,
} from '../../api/api'
import { SaleInvoicePaymentModal } from './SaleInvoicePaymentModal'
import { SaleInvoicePrintModal } from './SaleInvoicePrintModal'
import mailIcon from '../../assets/icon/3dicons-mail-dynamic-color.png'

const PAYMENT_TERMS = [
  { value: 'Cash', days: 0, en: 'Cash (Immediate)', kh: 'សាច់ប្រាក់ភ្លាមៗ' },
  { value: 'COD', days: 0, en: 'Cash on Delivery (COD)', kh: 'ទូទាត់ពេលដឹកជញ្ជូន' },
  { value: 'Net 7', days: 7, en: 'Net 7 Days', kh: 'ទូទាត់ក្នុង ៧ ថ្ងៃ' },
  { value: 'Net 15', days: 15, en: 'Net 15 Days', kh: 'ទូទាត់ក្នុង ១៥ ថ្ងៃ' },
  { value: 'Net 30', days: 30, en: 'Net 30 Days', kh: 'ទូទាត់ក្នុង ៣០ ថ្ងៃ' },
  { value: 'Net 60', days: 60, en: 'Net 60 Days', kh: 'ទូទាត់ក្នុង ៦០ ថ្ងៃ' },
]

const OUTLETS = [
  { value: 'main', en: 'Main Branch - Phnom Penh', kh: 'សាខាធំ - ភ្នំពេញ' },
  { value: 'outlet1', en: 'Toul Kork Outlet', kh: 'សាខាទួលគោក' },
  { value: 'outlet2', en: 'BKK1 Premium Outlet', kh: 'សាខាបឹងកេងកង១' },
  { value: 'online', en: 'Online E-Commerce Store', kh: 'ហាងលក់អនឡាញ' },
]

const LOCATIONS = [
  { value: 'main-store', en: 'Main Store Shelf', kh: 'ធ្នើរហាងធំ' },
  { value: 'front-warehouse', en: 'Front Warehouse', kh: 'ឃ្លាំងខាងមុខ' },
  { value: 'cold-storage', en: 'Cold Storage Room', kh: 'បន្ទប់រក្សាទុកត្រជាក់' },
  { value: 'warehouse-b', en: 'Central Warehouse B', kh: 'ឃ្លាំងកណ្តាល ខ' },
]

const TEMPLATES = [
  { value: 'default', en: 'Default Template', kh: 'គំរូលំនាំដើម' },
  { value: 'pos-receipt', en: 'POS Receipt (80mm)', kh: 'វិក័យប័ត្រម៉ាស៊ីនគិតលុយ (80mm)' },
  { value: 'standard-a4', en: 'Standard A4 Invoice', kh: 'វិក័យប័ត្រស្តង់ដារ A4' },
  { value: 'tax-invoice', en: 'Official Tax Invoice', kh: 'វិក័យប័ត្រពន្ធផ្លូវការ' },
]

const SALESPERSONS = [
  'Admin',
  'Sok Heng',
  'Vanna Touch',
  'Bora Keo',
  'Store Manager',
  'Online Cashier',
]

export const SaleInvoiceCreate = () => {
  const { lang } = useLanguage()
  const { addNotification } = useNotifications()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const editId = searchParams.get('id')

  // Live master data
  const [customers, setCustomers] = useState([])
  const [products, setProducts] = useState([])
  const [units, setUnits] = useState([])
  const [loadingInitial, setLoadingInitial] = useState(true)

  // Active Tab: 'items' | 'billing' | 'shipping' | 'history' | 'others'
  const [activeTab, setActiveTab] = useState('items')

  // Top General Information
  const [invoiceCode, setInvoiceCode] = useState('')
  const [selectedCustomerId, setSelectedCustomerId] = useState('')
  const [customerSearch, setCustomerSearch] = useState('')
  const [showCustomerDropdown, setShowCustomerDropdown] = useState(false)
  const [customerName, setCustomerName] = useState('')
  const [customerPhone, setCustomerPhone] = useState('')
  const [customerAddress, setCustomerAddress] = useState('')
  const [salesperson, setSalesperson] = useState(SALESPERSONS[0])
  const [invoiceDate, setInvoiceDate] = useState(() => new Date().toISOString().slice(0, 10))
  const [paymentTerm, setPaymentTerm] = useState('Cash')
  const [dueDate, setDueDate] = useState(() => new Date().toISOString().slice(0, 10))
  const [soCode, setSoCode] = useState('')
  const [barcodeInput, setBarcodeInput] = useState('')

  // Line items
  const [lines, setLines] = useState([
    {
      id: Date.now(),
      productId: null,
      productCode: '',
      description: '',
      qty: 1,
      unitPrice: 0,
      discount: 0,
      uom: 'Pcs',
      totalPrice: 0,
    },
  ])

  // Billing Snapshot
  const [billingName, setBillingName] = useState('')
  const [billingPhone, setBillingPhone] = useState('')
  const [billingEmail, setBillingEmail] = useState('')
  const [billingAddress, setBillingAddress] = useState('')
  const [billingCity, setBillingCity] = useState('Phnom Penh')
  const [billingTaxNo, setBillingTaxNo] = useState('')

  // Shipping Snapshot
  const [shippingRecipient, setShippingRecipient] = useState('')
  const [shippingPhone, setShippingPhone] = useState('')
  const [shippingAddress, setShippingAddress] = useState('')
  const [shippingMethod, setShippingMethod] = useState('Standard Delivery')
  const [trackingNo, setTrackingNo] = useState('')

  // Others & Remarks
  const [outlet, setOutlet] = useState('main')
  const [location, setLocation] = useState('main-store')
  const [templateName, setTemplateName] = useState('default')
  const [note, setNote] = useState('')

  // Calculations & Right Card
  const [discountPercent, setDiscountPercent] = useState(0)
  const [discountAmount, setDiscountAmount] = useState(0)
  const [taxPercent, setTaxPercent] = useState(0)
  const [markupAmount, setMarkupAmount] = useState(0)
  const [exchangeRate] = useState(4100)

  // Modals & Flows
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [showPrintModal, setShowPrintModal] = useState(false)
  const [createdInvoice, setCreatedInvoice] = useState(null)
  const [saving, setSaving] = useState(false)
  const [successPrompt, setSuccessPrompt] = useState(null)

  const customerDropdownRef = useRef(null)
  const barcodeInputRef = useRef(null)

  // Fetch Master Data on Mount
  useEffect(() => {
    let isMounted = true

    Promise.all([
      adminCustomerAPI.getAll().catch(() => []),
      adminProductAPI.getAll().catch(() => []),
      adminUnitAPI.getAll().catch(() => []),
      !editId ? adminSaleInvoiceAPI.getNextCode().catch(() => ({ data: { code: `INV-${Date.now().toString().slice(-6)}` } })) : Promise.resolve(null),
    ]).then(([custRes, prodRes, unitRes, codeRes]) => {
      if (!isMounted) return
      const custList = custRes?.data || custRes || []
      const prodList = prodRes?.data || prodRes || []
      const unitList = unitRes?.data || unitRes || []

      setCustomers(Array.isArray(custList) ? custList : [])
      setProducts(Array.isArray(prodList) ? prodList : [])
      setUnits(Array.isArray(unitList) ? unitList : [])

      if (codeRes?.data?.code) {
        setInvoiceCode(codeRes.data.code)
      } else if (!editId) {
        setInvoiceCode(`INV-${new Date().toISOString().slice(2, 10).replace(/-/g, '')}-0001`)
      }

      setLoadingInitial(false)
    })

    return () => {
      isMounted = false
    }
  }, [editId])

  // Click outside listener for customer dropdown
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (customerDropdownRef.current && !customerDropdownRef.current.contains(e.target)) {
        setShowCustomerDropdown(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Auto-calculate Due Date when Payment Term changes
  const handlePaymentTermChange = (termValue) => {
    setPaymentTerm(termValue)
    const found = PAYMENT_TERMS.find((t) => t.value === termValue)
    const days = found ? found.days : 0
    const invD = new Date(invoiceDate || new Date())
    invD.setDate(invD.getDate() + days)
    setDueDate(invD.toISOString().slice(0, 10))
  }

  // Handle Customer Selection
  const handleSelectCustomer = (c) => {
    setSelectedCustomerId(c.id)
    setCustomerName(c.customerName || '')
    const phone = c.contactPhone || c.contactMobile || c.addressPhone || ''
    setCustomerPhone(phone)
    const addr = [c.addressLine1, c.addressCity, c.addressCountry].filter(Boolean).join(', ')
    setCustomerAddress(addr)
    setCustomerSearch(c.customerName || '')
    setShowCustomerDropdown(false)

    // Sync billing info
    setBillingName(c.customerName || '')
    setBillingPhone(phone)
    setBillingEmail(c.contactEmail || c.addressEmail || '')
    setBillingAddress(c.addressLine1 || addr)
    setBillingCity(c.addressCity || 'Phnom Penh')
    setBillingTaxNo(c.taxNo || '')

    // Sync shipping info
    setShippingRecipient(c.customerName || '')
    setShippingPhone(phone)
    setShippingAddress(addr)

    // Sync payment term if customer has preference
    if (c.paymentTerm) {
      handlePaymentTermChange(c.paymentTerm)
    }
  }

  // Filtered Customers for Search
  const filteredCustomers = useMemo(() => {
    if (!customerSearch.trim()) return customers.slice(0, 20)
    const q = customerSearch.toLowerCase()
    return customers.filter(
      (c) =>
        (c.customerName && c.customerName.toLowerCase().includes(q)) ||
        (c.code && c.code.toLowerCase().includes(q)) ||
        (c.contactPhone && c.contactPhone.toLowerCase().includes(q))
    )
  }, [customers, customerSearch])

  // Selected Customer Object for History tab
  const activeCustomer = useMemo(() => {
    return customers.find((c) => String(c.id) === String(selectedCustomerId)) || null
  }, [customers, selectedCustomerId])

  // Handle Barcode Scan / Fast Add
  const handleBarcodeSubmit = (e) => {
    if (e) e.preventDefault()
    const code = barcodeInput.trim()
    if (!code) return

    const matchedProduct = products.find(
      (p) =>
        (p.barCode && p.barCode.toLowerCase() === code.toLowerCase()) ||
        (p.code && p.code.toLowerCase() === code.toLowerCase()) ||
        (p.partNumber && p.partNumber.toLowerCase() === code.toLowerCase())
    )

    if (matchedProduct) {
      addProductToLines(matchedProduct)
      setBarcodeInput('')
      addNotification?.({
        type: 'success',
        title: 'Product Added via Barcode',
        message: `${matchedProduct.name || matchedProduct.nameKh} added to invoice.`,
      })
    } else {
      addNotification?.({
        type: 'error',
        title: 'Barcode Not Found',
        message: `No product matching barcode "${code}" was found.`,
      })
    }
  }

  // Add Product to Line items
  const addProductToLines = (product) => {
    const pName =
      (typeof product.name === 'object'
        ? (lang === 'kh' ? product.name.kh || product.name.en : product.name.en || product.name.kh)
        : (lang === 'kh' && product.nameKh ? product.nameKh : product.name)) || `#${product.id}`

    const price = Number(product.basePrice || product.averageCost || 0)
    const uom = product.uom || 'Pcs'

    setLines((prev) => {
      // Check if existing empty line
      const emptyIdx = prev.findIndex((l) => !l.description && (!l.productId || l.productId === null))
      if (emptyIdx !== -1) {
        const copy = [...prev]
        copy[emptyIdx] = {
          ...copy[emptyIdx],
          productId: product.id,
          productCode: product.code || '',
          description: pName,
          qty: 1,
          unitPrice: price,
          discount: 0,
          uom: uom,
          totalPrice: price,
        }
        return copy
      }

      // Check if item already exists -> increment QTY
      const existIdx = prev.findIndex((l) => l.productId === product.id)
      if (existIdx !== -1) {
        const copy = [...prev]
        const newQty = (copy[existIdx].qty || 1) + 1
        const lineTotal = newQty * (copy[existIdx].unitPrice || 0) - (copy[existIdx].discount || 0)
        copy[existIdx] = {
          ...copy[existIdx],
          qty: newQty,
          totalPrice: Math.max(0, lineTotal),
        }
        return copy
      }

      // Add new row
      return [
        ...prev,
        {
          id: Date.now() + Math.random(),
          productId: product.id,
          productCode: product.code || '',
          description: pName,
          qty: 1,
          unitPrice: price,
          discount: 0,
          uom: uom,
          totalPrice: price,
        },
      ]
    })
  }

  // Update Line Field
  const updateLineField = (idx, field, val) => {
    setLines((prev) => {
      const copy = [...prev]
      const row = { ...copy[idx], [field]: val }

      const qty = field === 'qty' ? Number(val) : Number(row.qty || 1)
      const price = field === 'unitPrice' ? Number(val) : Number(row.unitPrice || 0)
      const disc = field === 'discount' ? Number(val) : Number(row.discount || 0)

      const lineTotal = qty * price - disc
      row.totalPrice = Math.max(0, lineTotal)
      copy[idx] = row
      return copy
    })
  }

  // Add empty row
  const handleAddEmptyRow = () => {
    setLines((prev) => [
      ...prev,
      {
        id: Date.now() + Math.random(),
        productId: null,
        productCode: '',
        description: '',
        qty: 1,
        unitPrice: 0,
        discount: 0,
        uom: 'Pcs',
        totalPrice: 0,
      },
    ])
  }

  // Remove row
  const handleRemoveRow = (idx) => {
    if (lines.length <= 1) {
      setLines([
        {
          id: Date.now(),
          productId: null,
          productCode: '',
          description: '',
          qty: 1,
          unitPrice: 0,
          discount: 0,
          uom: 'Pcs',
          totalPrice: 0,
        },
      ])
      return
    }
    setLines((prev) => prev.filter((_, i) => i !== idx))
  }

  // Calculations
  const subTotal = useMemo(() => {
    return lines.reduce((acc, l) => acc + (Number(l.totalPrice) || 0), 0)
  }, [lines])

  // Sync discount percent and dollar
  const handleDiscountPercentChange = (p) => {
    const num = Math.max(0, Math.min(100, Number(p) || 0))
    setDiscountPercent(num)
    const dollar = (subTotal * num) / 100
    setDiscountAmount(Number(dollar.toFixed(2)))
  }

  const handleDiscountAmountChange = (amt) => {
    const num = Math.max(0, Number(amt) || 0)
    setDiscountAmount(num)
    if (subTotal > 0) {
      const pct = (num / subTotal) * 100
      setDiscountPercent(Number(pct.toFixed(2)))
    }
  }

  const taxAmount = useMemo(() => {
    if (taxPercent <= 0) return 0
    const taxable = Math.max(0, subTotal - discountAmount)
    return Number(((taxable * taxPercent) / 100).toFixed(2))
  }, [subTotal, discountAmount, taxPercent])

  const grandTotal = useMemo(() => {
    const total = subTotal - discountAmount + taxAmount + Number(markupAmount || 0)
    return Math.max(0, Number(total.toFixed(2)))
  }, [subTotal, discountAmount, taxAmount, markupAmount])

  const grandTotalKhmer = useMemo(() => {
    return Math.round(grandTotal * exchangeRate)
  }, [grandTotal, exchangeRate])

  // Prepare Invoice Payload
  const getInvoicePayload = (paymentInfo = null) => {
    const validLines = lines
      .filter((l) => l.description && l.description.trim() !== '')
      .map((l) => ({
        productId: l.productId,
        productCode: l.productCode,
        description: l.description,
        qty: Number(l.qty) || 1,
        unitPrice: Number(l.unitPrice) || 0,
        discount: Number(l.discount) || 0,
        uom: l.uom || 'Pcs',
        totalPrice: Number(l.totalPrice) || 0,
      }))

    return {
      invoiceCode: invoiceCode.trim(),
      invoiceDate: invoiceDate,
      dueDate: dueDate,
      soCode: soCode,
      customerId: selectedCustomerId ? Number(selectedCustomerId) : null,
      customerName: customerName || 'Walk-in Customer',
      customerPhone: customerPhone,
      customerAddress: customerAddress,
      salesperson: salesperson,
      paymentTerm: paymentTerm,
      outlet: outlet,
      location: location,
      templateName: templateName,
      subTotal: subTotal,
      discountPercent: discountPercent,
      discountAmount: discountAmount,
      taxAmount: taxAmount,
      taxPercent: taxPercent,
      markupAmount: Number(markupAmount) || 0,
      grandTotal: grandTotal,
      paidAmount: paymentInfo ? Number(paymentInfo.paidAmount) : 0,
      balance: paymentInfo ? Number(paymentInfo.balance) : grandTotal,
      exchangeRate: exchangeRate,
      grandTotalKhmer: grandTotalKhmer,
      barcode: barcodeInput,
      username: salesperson,
      note: note,
      paymentType: paymentInfo ? paymentInfo.paymentType : 'UNPAID',
      billingName: billingName || customerName,
      billingPhone: billingPhone || customerPhone,
      billingEmail: billingEmail,
      billingAddress: billingAddress || customerAddress,
      billingCity: billingCity,
      billingTaxNo: billingTaxNo,
      shippingRecipient: shippingRecipient || customerName,
      shippingPhone: shippingPhone || customerPhone,
      shippingAddress: shippingAddress || customerAddress,
      shippingMethod: shippingMethod,
      trackingNo: trackingNo,
      lines: validLines,
      payments: paymentInfo && paymentInfo.paidAmount > 0 ? [
        {
          paymentDate: new Date().toISOString(),
          amountDollar: paymentInfo.paidAmount,
          amountKhmer: Math.round(paymentInfo.paidAmount * exchangeRate),
          paymentType: paymentInfo.paymentType,
          reference: paymentInfo.reference,
          note: paymentInfo.note,
          receivedBy: salesperson,
        }
      ] : [],
    }
  }

  // Handle Make Pay Click
  const handleOpenPayment = () => {
    if (!customerName && !selectedCustomerId) {
      // Allow walk-in but friendly prompt
      setCustomerName('Walk-in Customer')
    }
    setShowPaymentModal(true)
  }

  // Handle Save from Payment Modal
  const handleSaveAndPay = async (paymentInfo) => {
    setSaving(true)
    try {
      const payload = getInvoicePayload(paymentInfo)
      const res = await adminSaleInvoiceAPI.create(payload)
      const savedDoc = res?.data || res

      setShowPaymentModal(false)
      setCreatedInvoice(savedDoc)
      setSaving(false)

      addNotification?.({
        type: 'success',
        title: 'Invoice Saved Successfully',
        message: `Sale Invoice #${savedDoc.invoiceCode || invoiceCode} recorded.`,
      })

      // Immediately navigate to Sale Invoice list and show preview modal ready to print
      navigate('/admin/sale-dashboard/sale-invoice', {
        state: { printInvoice: savedDoc },
      })
    } catch (err) {
      console.error('Failed to save invoice:', err)
      setSaving(false)
      addNotification?.({
        type: 'error',
        title: 'Save Failed',
        message: err.message || 'Could not save sale invoice.',
      })
    }
  }

  // Quick Draft Save
  const handleSaveDraft = async () => {
    setSaving(true)
    try {
      const payload = getInvoicePayload()
      payload.status = 'DRAFT'
      const res = await adminSaleInvoiceAPI.create(payload)
      setSaving(false)
      addNotification?.({
        type: 'success',
        title: 'Draft Saved',
        message: `Invoice #${invoiceCode} saved as draft.`,
      })
      navigate('/admin/sale-dashboard/sale-invoice')
    } catch (err) {
      console.error('Failed to save draft:', err)
      setSaving(false)
      addNotification?.({
        type: 'error',
        title: 'Save Failed',
        message: err.message || 'Could not save draft.',
      })
    }
  }

  const formatCurrency = (val) => `$ ${Number(val || 0).toFixed(2)}`

  return (
    <div className="space-y-6 text-slate-100" style={{ fontFamily: 'Montserrat, sans-serif' }}>
      {/* Top Breadcrumb & Actions Bar */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-400">
            <Link to="/admin/sale-dashboard" className="text-green-400 hover:text-green-300">
              {lang === 'en' ? 'Sale Dashboard' : 'ផ្ទាំងលក់'}
            </Link>
            <span>/</span>
            <Link to="/admin/sale-dashboard/sale-invoice" className="text-slate-300 hover:text-white">
              {lang === 'en' ? 'Sale Invoices' : 'វិក័យប័ត្រលក់'}
            </Link>
            <span>/</span>
            <span className="text-[#FF9900]">{lang === 'en' ? 'Create Invoice' : 'បង្កើតវិក័យប័ត្រ'}</span>
          </div>

          <div className="flex items-center gap-3 mt-2">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-orange-500/20 text-[#FF9900] shadow-lg shadow-orange-500/10">
              <img src={mailIcon} alt="" className="h-7 w-7" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
                {lang === 'en' ? 'Create Sale Invoice' : 'បង្កើតវិក័យប័ត្រលក់ថ្មី'}
              </h1>
              <p className="text-xs text-slate-400">
                {lang === 'en' ? 'Issue customer sales, apply discounts, and process live payments' : 'ចេញវិក័យប័ត្រលក់ បញ្ចុះតម្លៃ និងទទួលការទូទាត់ប្រាក់'}
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => navigate('/admin/sale-dashboard/sale-invoice')}
            className="px-4 py-2.5 rounded-xl border border-slate-700 bg-slate-900/80 text-xs font-bold text-slate-300 hover:bg-slate-800 hover:text-white transition"
          >
            {lang === 'en' ? 'Cancel' : 'បោះបង់'}
          </button>

          <button
            type="button"
            onClick={handleSaveDraft}
            disabled={saving}
            className="px-4 py-2.5 rounded-xl border border-slate-700 bg-slate-800 text-xs font-bold text-slate-200 hover:bg-slate-700 transition"
          >
            {lang === 'en' ? 'Save as Draft' : 'រក្សាទុកជាព្រាង'}
          </button>

          <button
            type="button"
            onClick={handleOpenPayment}
            className="inline-flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-[#FF9900] to-[#e68a00] hover:from-[#ffaa26] hover:to-[#cc7a00] text-slate-950 text-xs font-black uppercase tracking-wider rounded-xl shadow-xl shadow-orange-500/25 transition transform hover:-translate-y-0.5 active:scale-95"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            <span>{lang === 'en' ? `Make Pay (${formatCurrency(grandTotal)})` : `ទូទាត់ប្រាក់ (${formatCurrency(grandTotal)})`}</span>
          </button>
        </div>
      </div>

      {/* TOP SECTION: Invoice Information Header */}
      <section className="rounded-2xl border border-slate-700/80 bg-slate-900/90 p-5 sm:p-6 shadow-xl backdrop-blur-sm">
        <div className="mb-4 flex items-center justify-between pb-3 border-b border-slate-800">
          <h2 className="text-sm font-extrabold uppercase tracking-wider text-orange-400 flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-orange-400" />
            {lang === 'en' ? 'Invoice Information' : 'ព័ត៌មានវិក័យប័ត្រ'}
          </h2>
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <span>Exchange:</span>
            <strong className="text-white">$1 = {exchangeRate} KHR</strong>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {/* Customer Dropdown with Live Data */}
          <div className="relative" ref={customerDropdownRef}>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
              {lang === 'en' ? 'Customer *' : 'អតិថិជន *'} <span className="text-orange-400">*</span>
            </label>
            <div className="relative">
              <input
                type="text"
                placeholder={lang === 'en' ? 'Search or select customer...' : 'ស្វែងរកអតិថិជន...'}
                value={customerSearch}
                onFocus={() => setShowCustomerDropdown(true)}
                onChange={(e) => {
                  setCustomerSearch(e.target.value)
                  setCustomerName(e.target.value)
                  setShowCustomerDropdown(true)
                }}
                className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2.5 text-sm font-semibold text-white placeholder-slate-500 focus:border-green-400 focus:outline-none focus:ring-2 focus:ring-green-500/20"
              />
              <button
                type="button"
                onClick={() => setShowCustomerDropdown(!showCustomerDropdown)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                </svg>
              </button>
            </div>

            {/* Live Dropdown menu */}
            {showCustomerDropdown && (
              <div className="absolute left-0 right-0 top-full z-40 mt-1 max-h-60 overflow-y-auto rounded-xl border border-slate-700 bg-slate-900 shadow-2xl">
                {filteredCustomers.length > 0 ? (
                  filteredCustomers.map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => handleSelectCustomer(c)}
                      className="w-full text-left px-3.5 py-2.5 hover:bg-slate-800 transition border-b border-slate-800/60 last:border-none flex items-center justify-between"
                    >
                      <div>
                        <p className="text-xs font-bold text-white">{c.customerName}</p>
                        <p className="text-[11px] text-slate-400">
                          {c.code || 'CU'} • {c.contactPhone || c.contactMobile || 'No phone'}
                        </p>
                      </div>
                      {c.balance > 0 && (
                        <span className="text-[10px] font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded">
                          Bal: ${Number(c.balance).toFixed(2)}
                        </span>
                      )}
                    </button>
                  ))
                ) : (
                  <div className="p-3 text-center text-xs text-slate-500">
                    {lang === 'en' ? 'No customers found' : 'រកមិនឃើញអតិថិជន'}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Salesperson */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
              {lang === 'en' ? 'Sales Person' : 'បុគ្គលិកផ្នែកលក់'}
            </label>
            <select
              value={salesperson}
              onChange={(e) => setSalesperson(e.target.value)}
              className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2.5 text-sm font-semibold text-white focus:border-green-400 focus:outline-none"
            >
              {SALESPERSONS.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>

          {/* Invoice Date */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
              {lang === 'en' ? 'Invoice Date' : 'កាលបរិច្ឆេទវិក័យប័ត្រ'}
            </label>
            <input
              type="date"
              value={invoiceDate}
              onChange={(e) => {
                setInvoiceDate(e.target.value)
                const found = PAYMENT_TERMS.find((t) => t.value === paymentTerm)
                const days = found ? found.days : 0
                const d = new Date(e.target.value)
                d.setDate(d.getDate() + days)
                setDueDate(d.toISOString().slice(0, 10))
              }}
              className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2.5 text-sm font-semibold text-white focus:border-green-400 focus:outline-none"
            />
          </div>

          {/* Code (Auto Generated) */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
              {lang === 'en' ? 'Invoice Code' : 'លេខកូដវិក័យប័ត្រ'}
            </label>
            <div className="relative">
              <input
                type="text"
                value={invoiceCode}
                onChange={(e) => setInvoiceCode(e.target.value)}
                className="w-full rounded-xl border border-slate-700 bg-slate-950/80 px-3.5 py-2.5 text-sm font-bold text-orange-400 focus:border-orange-400 focus:outline-none"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-black uppercase tracking-wider text-slate-500">
                Auto
              </span>
            </div>
          </div>

          {/* Payment Term * */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
              {lang === 'en' ? 'Payment Term *' : 'លក្ខខណ្ឌទូទាត់ *'} <span className="text-orange-400">*</span>
            </label>
            <select
              value={paymentTerm}
              onChange={(e) => handlePaymentTermChange(e.target.value)}
              className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2.5 text-sm font-semibold text-white focus:border-green-400 focus:outline-none"
            >
              {PAYMENT_TERMS.map((term) => (
                <option key={term.value} value={term.value}>
                  {lang === 'en' ? term.en : term.kh}
                </option>
              ))}
            </select>
          </div>

          {/* Due Date */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
              {lang === 'en' ? 'Due Date' : 'កាលបរិច្ឆេទផុតកំណត់'}
            </label>
            <input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2.5 text-sm font-semibold text-white focus:border-green-400 focus:outline-none"
            />
          </div>

          {/* SO Code Reference */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
              {lang === 'en' ? 'SO Code (Optional)' : 'លេខកូដបញ្ជាទិញ SO'}
            </label>
            <input
              type="text"
              placeholder="e.g. SO-260901-0012"
              value={soCode}
              onChange={(e) => setSoCode(e.target.value)}
              className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2.5 text-sm font-semibold text-white focus:border-green-400 focus:outline-none"
            />
          </div>

          {/* Barcode with Scan Icon as requested */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-green-400 mb-1.5 flex items-center justify-between">
              <span>{lang === 'en' ? 'Barcode Scan' : 'ស្កេនបាកូដទំនិញ'}</span>
              <span className="text-[10px] text-slate-400">Press Enter to Add</span>
            </label>
            <form onSubmit={handleBarcodeSubmit} className="relative">
              <input
                ref={barcodeInputRef}
                type="text"
                placeholder="Scan / Type Barcode..."
                value={barcodeInput}
                onChange={(e) => setBarcodeInput(e.target.value)}
                className="w-full rounded-xl border border-green-500/60 bg-slate-950 pl-3.5 pr-10 py-2.5 text-sm font-semibold text-white focus:border-green-400 focus:ring-2 focus:ring-green-500/20 focus:outline-none"
              />
              <button
                type="submit"
                title="Scan Barcode"
                className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1.5 rounded-lg bg-green-500/20 text-green-400 hover:bg-green-500/30 transition"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
                </svg>
              </button>
            </form>
          </div>
        </div>
      </section>

      {/* MAIN TWO-COLUMN WORKSPACE: Tabs on Left (8 cols) & Invoice Payment on Right (4 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* LEFT COLUMN: 5 Tabs */}
        <div className="lg:col-span-8 space-y-4">
          {/* Tab Navigation Header */}
          <div className="flex flex-wrap items-center gap-1.5 p-1.5 rounded-2xl border border-slate-700/80 bg-slate-900/90 shadow-lg backdrop-blur-sm">
            {[
              { key: 'items', en: 'Sale invoice List', kh: 'បញ្ជីមុខទំនិញវិក័យប័ត្រ', icon: '📦' },
              { key: 'billing', en: 'Bill information', kh: 'ព័ត៌មានវិក្កយបត្រ', icon: '📝' },
              { key: 'shipping', en: 'Shipping information', kh: 'ព័ត៌មានដឹកជញ្ជូន', icon: '🚚' },
              { key: 'history', en: 'Customer History Information', kh: 'ប្រវត្តិអតិថិជន', icon: '👤' },
              { key: 'others', en: 'Others', kh: 'ផ្សេងៗ', icon: '⚙️' },
            ].map((tab) => (
              <button
                key={tab.key}
                type="button"
                onClick={() => setActiveTab(tab.key)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition ${
                  activeTab === tab.key
                    ? 'bg-gradient-to-r from-orange-500 to-amber-600 text-slate-950 shadow-md font-black'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                <span>{tab.icon}</span>
                <span>{lang === 'en' ? tab.en : tab.kh}</span>
              </button>
            ))}
          </div>

          {/* TAB 1: Sale invoice List (Items Table) */}
          {activeTab === 'items' && (
            <div className="rounded-2xl border border-slate-700/80 bg-slate-900/90 p-5 shadow-xl backdrop-blur-sm space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-extrabold uppercase tracking-wider text-white">
                    {lang === 'en' ? 'Invoice Item Details' : 'តារាងមុខទំនិញ'}
                  </h3>
                  <span className="px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-400 text-xs font-bold">
                    {lines.filter((l) => l.description).length} Items
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleAddEmptyRow}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-green-500/40 bg-green-500/10 text-xs font-bold text-green-400 hover:bg-green-500/20 transition"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                    </svg>
                    {lang === 'en' ? 'Add Line' : 'បន្ថែមជួរ'}
                  </button>
                </div>
              </div>

              {/* Items Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse min-w-[700px]">
                  <thead>
                    <tr className="border-b border-slate-800 text-slate-400 uppercase text-[10px] tracking-wider bg-slate-950/60">
                      <th className="py-3 px-2 w-10 text-center">№</th>
                      <th className="py-3 px-3 min-w-[220px]">{lang === 'en' ? 'Description' : 'បរិយាយមុខទំនិញ'}</th>
                      <th className="py-3 px-2 w-20 text-center">QTY</th>
                      <th className="py-3 px-2 w-28 text-right">Price ($)</th>
                      <th className="py-3 px-2 w-24 text-right">Discount ($)</th>
                      <th className="py-3 px-2 w-24 text-center">UOM</th>
                      <th className="py-3 px-3 w-28 text-right">Total ($)</th>
                      <th className="py-3 px-2 w-10 text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/80">
                    {lines.map((line, idx) => (
                      <tr key={line.id || idx} className="hover:bg-slate-800/40 transition">
                        <td className="py-2.5 px-2 text-center font-bold text-slate-500">{idx + 1}</td>

                        {/* Description (Searchable product or text) */}
                        <td className="py-2.5 px-3">
                          <div className="relative">
                            <input
                              type="text"
                              placeholder={lang === 'en' ? 'Type item name or search...' : 'បញ្ចូលឈ្មោះទំនិញ...'}
                              value={line.description}
                              onChange={(e) => updateLineField(idx, 'description', e.target.value)}
                              className="w-full rounded-lg border border-slate-700 bg-slate-950 px-2.5 py-1.5 text-xs text-white placeholder-slate-600 focus:border-green-400 focus:outline-none"
                            />
                            {/* Quick product selector dropdown if typing matches */}
                            {line.description && !line.productId && products.length > 0 && (
                              <div className="absolute left-0 right-0 top-full z-30 mt-1 max-h-40 overflow-y-auto rounded-lg border border-slate-700 bg-slate-950 shadow-xl">
                                {products
                                  .filter((p) => {
                                    const n = (p.name || p.nameKh || '').toLowerCase()
                                    return n.includes(line.description.toLowerCase())
                                  })
                                  .slice(0, 5)
                                  .map((p) => (
                                    <button
                                      key={p.id}
                                      type="button"
                                      onClick={() => {
                                        updateLineField(idx, 'productId', p.id)
                                        updateLineField(idx, 'productCode', p.code || '')
                                        updateLineField(idx, 'description', p.name || p.nameKh || `#${p.id}`)
                                        updateLineField(idx, 'unitPrice', Number(p.basePrice || p.averageCost || 0))
                                        updateLineField(idx, 'uom', p.uom || 'Pcs')
                                      }}
                                      className="w-full text-left px-3 py-1.5 hover:bg-slate-800 text-[11px] text-white flex justify-between"
                                    >
                                      <span>{p.name || p.nameKh}</span>
                                      <span className="text-green-400 font-bold">${Number(p.basePrice || 0).toFixed(2)}</span>
                                    </button>
                                  ))}
                              </div>
                            )}
                          </div>
                        </td>

                        {/* QTY */}
                        <td className="py-2.5 px-2">
                          <input
                            type="number"
                            min="1"
                            step="1"
                            value={line.qty}
                            onChange={(e) => updateLineField(idx, 'qty', e.target.value)}
                            className="w-full rounded-lg border border-slate-700 bg-slate-950 px-2 py-1.5 text-center text-xs font-bold text-white focus:border-green-400 focus:outline-none"
                          />
                        </td>

                        {/* Price */}
                        <td className="py-2.5 px-2">
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            value={line.unitPrice}
                            onChange={(e) => updateLineField(idx, 'unitPrice', e.target.value)}
                            className="w-full rounded-lg border border-slate-700 bg-slate-950 px-2 py-1.5 text-right text-xs font-bold text-white focus:border-green-400 focus:outline-none"
                          />
                        </td>

                        {/* Discount */}
                        <td className="py-2.5 px-2">
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            value={line.discount}
                            onChange={(e) => updateLineField(idx, 'discount', e.target.value)}
                            className="w-full rounded-lg border border-slate-700 bg-slate-950 px-2 py-1.5 text-right text-xs text-amber-400 focus:border-green-400 focus:outline-none"
                          />
                        </td>

                        {/* UOM */}
                        <td className="py-2.5 px-2">
                          <select
                            value={line.uom}
                            onChange={(e) => updateLineField(idx, 'uom', e.target.value)}
                            className="w-full rounded-lg border border-slate-700 bg-slate-950 px-2 py-1.5 text-center text-xs text-slate-300 focus:border-green-400 focus:outline-none"
                          >
                            <option value="Pcs">Pcs</option>
                            <option value="Box">Box</option>
                            <option value="Kg">Kg</option>
                            <option value="Pack">Pack</option>
                            <option value="Bottle">Bottle</option>
                            <option value="Can">Can</option>
                            {units.map((u) => (
                              <option key={u.id} value={u.code || u.description}>
                                {u.code || u.description}
                              </option>
                            ))}
                          </select>
                        </td>

                        {/* Total */}
                        <td className="py-2.5 px-3 text-right font-black text-white text-xs">
                          {formatCurrency(line.totalPrice)}
                        </td>

                        {/* Delete Action */}
                        <td className="py-2.5 px-2 text-center">
                          <button
                            type="button"
                            onClick={() => handleRemoveRow(idx)}
                            className="p-1 text-slate-500 hover:text-red-400 rounded transition"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Add item and clear bar */}
              <div className="flex items-center justify-between pt-2">
                <button
                  type="button"
                  onClick={handleAddEmptyRow}
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-green-400 hover:text-green-300 transition"
                >
                  <span className="text-base">+</span> {lang === 'en' ? 'Add Another Line Item' : 'បន្ថែមជួរទំនិញថ្មី'}
                </button>

                <button
                  type="button"
                  onClick={() =>
                    setLines([
                      {
                        id: Date.now(),
                        productId: null,
                        productCode: '',
                        description: '',
                        qty: 1,
                        unitPrice: 0,
                        discount: 0,
                        uom: 'Pcs',
                        totalPrice: 0,
                      },
                    ])
                  }
                  className="text-xs text-slate-500 hover:text-slate-300 transition"
                >
                  {lang === 'en' ? 'Clear Table' : 'សម្អាតតារាង'}
                </button>
              </div>
            </div>
          )}

          {/* TAB 2: Bill Information */}
          {activeTab === 'billing' && (
            <div className="rounded-2xl border border-slate-700/80 bg-slate-900/90 p-6 shadow-xl backdrop-blur-sm space-y-4">
              <h3 className="text-sm font-extrabold uppercase tracking-wider text-orange-400 pb-2 border-b border-slate-800">
                {lang === 'en' ? 'Billing Details & Tax Information' : 'ព័ត៌មានវិក្កយបត្រ និងពន្ធដារ'}
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-400 mb-1">Billing Name</label>
                  <input
                    type="text"
                    value={billingName}
                    onChange={(e) => setBillingName(e.target.value)}
                    className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2 text-xs text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 mb-1">Billing Phone</label>
                  <input
                    type="text"
                    value={billingPhone}
                    onChange={(e) => setBillingPhone(e.target.value)}
                    className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2 text-xs text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 mb-1">Billing Email</label>
                  <input
                    type="email"
                    value={billingEmail}
                    onChange={(e) => setBillingEmail(e.target.value)}
                    className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2 text-xs text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 mb-1">VAT / Tax Identification No.</label>
                  <input
                    type="text"
                    placeholder="e.g. K008-902201948"
                    value={billingTaxNo}
                    onChange={(e) => setBillingTaxNo(e.target.value)}
                    className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2 text-xs text-white"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-400 mb-1">Billing Address</label>
                  <textarea
                    rows="2"
                    value={billingAddress}
                    onChange={(e) => setBillingAddress(e.target.value)}
                    className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2 text-xs text-white"
                  />
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: Shipping Information */}
          {activeTab === 'shipping' && (
            <div className="rounded-2xl border border-slate-700/80 bg-slate-900/90 p-6 shadow-xl backdrop-blur-sm space-y-4">
              <h3 className="text-sm font-extrabold uppercase tracking-wider text-orange-400 pb-2 border-b border-slate-800">
                {lang === 'en' ? 'Shipping & Delivery Details' : 'ព័ត៌មានដឹកជញ្ជូនទំនិញ'}
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-400 mb-1">Recipient Name</label>
                  <input
                    type="text"
                    value={shippingRecipient}
                    onChange={(e) => setShippingRecipient(e.target.value)}
                    className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2 text-xs text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 mb-1">Recipient Phone</label>
                  <input
                    type="text"
                    value={shippingPhone}
                    onChange={(e) => setShippingPhone(e.target.value)}
                    className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2 text-xs text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 mb-1">Shipping Method</label>
                  <select
                    value={shippingMethod}
                    onChange={(e) => setShippingMethod(e.target.value)}
                    className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2 text-xs text-white"
                  >
                    <option value="Standard Delivery">Standard Delivery (1-2 Days)</option>
                    <option value="Express Same-Day">Express Same-Day Delivery</option>
                    <option value="In-Store Pickup">In-Store Self Pickup</option>
                    <option value="Courier Partner">Third-Party Courier</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 mb-1">Tracking Number</label>
                  <input
                    type="text"
                    placeholder="e.g. BG-TRK-88201"
                    value={trackingNo}
                    onChange={(e) => setTrackingNo(e.target.value)}
                    className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2 text-xs text-white"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-400 mb-1">Delivery Address</label>
                  <textarea
                    rows="2"
                    value={shippingAddress}
                    onChange={(e) => setShippingAddress(e.target.value)}
                    className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2 text-xs text-white"
                  />
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: Customer History Information */}
          {activeTab === 'history' && (
            <div className="rounded-2xl border border-slate-700/80 bg-slate-900/90 p-6 shadow-xl backdrop-blur-sm space-y-4">
              <h3 className="text-sm font-extrabold uppercase tracking-wider text-orange-400 pb-2 border-b border-slate-800">
                {lang === 'en' ? 'Customer Profile & Credit Summary' : 'ប្រវត្តិ និងសមតុល្យឥណទានអតិថិជន'}
              </h3>
              {activeCustomer ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 rounded-xl bg-slate-950/60 border border-slate-800">
                    <div>
                      <p className="text-[10px] uppercase font-bold text-slate-400">Current Balance</p>
                      <p className={`text-base font-black ${activeCustomer.balance > 0 ? 'text-red-400' : 'text-green-400'}`}>
                        ${Number(activeCustomer.balance || 0).toFixed(2)}
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] uppercase font-bold text-slate-400">Credit Limit</p>
                      <p className="text-base font-black text-white">
                        ${Number(activeCustomer.creditLimit || 0).toFixed(2)}
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] uppercase font-bold text-slate-400">Credit Deposit</p>
                      <p className="text-base font-black text-blue-400">
                        ${Number(activeCustomer.creditDeposit || 0).toFixed(2)}
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] uppercase font-bold text-slate-400">Group</p>
                      <p className="text-sm font-bold text-slate-200">
                        {activeCustomer.customerGroup || 'Retail Customer'}
                      </p>
                    </div>
                  </div>

                  <div className="p-4 rounded-xl border border-slate-800 bg-slate-950/40 text-xs space-y-1 text-slate-300">
                    <p><strong>Customer Code:</strong> {activeCustomer.code}</p>
                    <p><strong>Contact Person:</strong> {activeCustomer.contactFirstName} {activeCustomer.contactLastName}</p>
                    <p><strong>Phone:</strong> {activeCustomer.contactPhone || activeCustomer.contactMobile}</p>
                    <p><strong>Email:</strong> {activeCustomer.contactEmail || 'None'}</p>
                    <p><strong>Preferred Price Book:</strong> {activeCustomer.priceBook || 'Standard Retail'}</p>
                  </div>
                </div>
              ) : (
                <div className="p-8 text-center text-slate-500">
                  <p className="text-sm">Please select a customer from the dropdown above to view their financial history.</p>
                </div>
              )}
            </div>
          )}

          {/* TAB 5: Others */}
          {activeTab === 'others' && (
            <div className="rounded-2xl border border-slate-700/80 bg-slate-900/90 p-6 shadow-xl backdrop-blur-sm space-y-4">
              <h3 className="text-sm font-extrabold uppercase tracking-wider text-orange-400 pb-2 border-b border-slate-800">
                {lang === 'en' ? 'Internal Remarks & Options' : 'កំណត់សម្គាល់ផ្ទៃក្នុង'}
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-400 mb-1">Internal Remarks</label>
                  <textarea
                    rows="3"
                    placeholder="Internal store notes visible to cashiers only..."
                    className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2 text-xs text-white"
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* RIGHT COLUMN: Invoice Payment & Totals Card */}
        <div className="lg:col-span-4 space-y-4">
          <div className="rounded-2xl border border-slate-700/80 bg-slate-900/95 p-5 sm:p-6 shadow-2xl backdrop-blur-sm space-y-5">
            <h2 className="text-sm font-black uppercase tracking-wider text-white pb-3 border-b border-slate-800 flex items-center justify-between">
              <span>{lang === 'en' ? 'Invoice Payment' : 'ការទូទាត់វិក័យប័ត្រ'}</span>
              <span className="text-[10px] font-bold text-[#FF9900] bg-orange-500/10 px-2.5 py-0.5 rounded-full border border-orange-500/20">
                Summary
              </span>
            </h2>

            {/* Outlet Dropdown */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                {lang === 'en' ? 'Outlet' : 'សាខាហាង'}
              </label>
              <select
                value={outlet}
                onChange={(e) => setOutlet(e.target.value)}
                className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2 text-xs font-semibold text-white focus:border-green-400 focus:outline-none"
              >
                {OUTLETS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {lang === 'en' ? o.en : o.kh}
                  </option>
                ))}
              </select>
            </div>

            {/* Location Dropdown */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                {lang === 'en' ? 'Location' : 'ទីតាំងស្តុក'}
              </label>
              <select
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2 text-xs font-semibold text-white focus:border-green-400 focus:outline-none"
              >
                {LOCATIONS.map((loc) => (
                  <option key={loc.value} value={loc.value}>
                    {lang === 'en' ? loc.en : loc.kh}
                  </option>
                ))}
              </select>
            </div>

            {/* Template Name Dropdown */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                {lang === 'en' ? 'Template Name' : 'ទម្រង់វិក័យប័ត្រ'}
              </label>
              <select
                value={templateName}
                onChange={(e) => setTemplateName(e.target.value)}
                className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2 text-xs font-semibold text-white focus:border-green-400 focus:outline-none"
              >
                {TEMPLATES.map((tmpl) => (
                  <option key={tmpl.value} value={tmpl.value}>
                    {lang === 'en' ? tmpl.en : tmpl.kh}
                  </option>
                ))}
              </select>
            </div>

            {/* Note Textbox */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                {lang === 'en' ? 'Note' : 'ចំណាំ'}
              </label>
              <textarea
                rows="2"
                placeholder={lang === 'en' ? 'Invoice note printed on customer receipt...' : 'ចំណាំលើវិក័យប័ត្រ...'}
                value={note}
                onChange={(e) => setNote(e.target.value)}
                className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2 text-xs text-white placeholder-slate-600 focus:border-green-400 focus:outline-none"
              />
            </div>

            {/* Financial Calculations */}
            <div className="space-y-3 pt-3 border-t border-slate-800 text-xs">
              {/* Sub Amount */}
              <div className="flex justify-between items-center text-slate-300">
                <span className="font-semibold">{lang === 'en' ? 'Sub Amount' : 'ចំនួនទឹកប្រាក់រង'}</span>
                <span className="font-bold text-white text-sm">{formatCurrency(subTotal)}</span>
              </div>

              {/* Discount (% and $) as requested */}
              <div className="space-y-1.5">
                <div className="flex justify-between items-center text-slate-400">
                  <span className="font-semibold">{lang === 'en' ? 'Discount' : 'បញ្ចុះតម្លៃ'}</span>
                  <span className="text-emerald-400 font-bold">- {formatCurrency(discountAmount)}</span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="relative">
                    <input
                      type="number"
                      step="0.1"
                      min="0"
                      max="100"
                      placeholder="0.00 %"
                      value={discountPercent || ''}
                      onChange={(e) => handleDiscountPercentChange(e.target.value)}
                      className="w-full rounded-lg border border-slate-700 bg-slate-950 px-2.5 py-1.5 text-xs text-emerald-400 font-bold focus:border-emerald-400 focus:outline-none"
                    />
                    <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] text-slate-500 font-bold">%</span>
                  </div>
                  <div className="relative">
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="0.00 $"
                      value={discountAmount || ''}
                      onChange={(e) => handleDiscountAmountChange(e.target.value)}
                      className="w-full rounded-lg border border-slate-700 bg-slate-950 px-2.5 py-1.5 text-xs text-emerald-400 font-bold focus:border-emerald-400 focus:outline-none"
                    />
                    <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] text-slate-500 font-bold">$</span>
                  </div>
                </div>
              </div>

              {/* Tax Amount */}
              <div className="flex justify-between items-center text-slate-300">
                <span className="font-semibold">{lang === 'en' ? 'Tax Amount (VAT)' : 'ពន្ធអាករ (VAT)'}</span>
                <div className="flex items-center gap-2">
                  <select
                    value={taxPercent}
                    onChange={(e) => setTaxPercent(Number(e.target.value))}
                    className="rounded bg-slate-950 border border-slate-700 text-[10px] py-0.5 px-1 text-slate-300"
                  >
                    <option value="0">0%</option>
                    <option value="5">5%</option>
                    <option value="10">10%</option>
                  </select>
                  <span className="font-bold text-white">{formatCurrency(taxAmount)}</span>
                </div>
              </div>

              {/* Markup Amount */}
              <div className="flex justify-between items-center text-slate-300">
                <span className="font-semibold">{lang === 'en' ? 'Markup Amount' : 'ប្រាក់បន្ថែម'}</span>
                <div className="w-24">
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={markupAmount || ''}
                    onChange={(e) => setMarkupAmount(Number(e.target.value))}
                    placeholder="0.00"
                    className="w-full rounded bg-slate-950 border border-slate-700 text-right px-2 py-0.5 text-xs text-white"
                  />
                </div>
              </div>

              {/* Grand Total */}
              <div className="p-4 rounded-xl bg-gradient-to-br from-slate-950 to-slate-900 border border-orange-500/40 shadow-inner space-y-1">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-black uppercase text-orange-400">
                    {lang === 'en' ? 'Grand Total' : 'សរុបរួម'}
                  </span>
                  <span className="text-xl font-black text-white">{formatCurrency(grandTotal)}</span>
                </div>
                <div className="flex justify-between items-center text-[11px] text-slate-400">
                  <span>Khmer Riel (៛)</span>
                  <span className="font-bold text-blue-400">
                    {new Intl.NumberFormat('km-KH').format(grandTotalKhmer)} ៛
                  </span>
                </div>
              </div>

              {/* Make Pay Button as requested */}
              <button
                type="button"
                onClick={handleOpenPayment}
                className="w-full py-3.5 bg-gradient-to-r from-[#77BC1F] to-[#5ea113] hover:from-[#65a317] hover:to-[#4e880e] text-slate-950 text-sm font-black uppercase tracking-wider rounded-xl shadow-xl shadow-green-500/25 transition transform hover:-translate-y-0.5 active:scale-95 flex items-center justify-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                <span>{lang === 'en' ? `Make Pay (${formatCurrency(grandTotal)})` : `ទូទាត់ប្រាក់ (${formatCurrency(grandTotal)})`}</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Payment Information Modal */}
      <SaleInvoicePaymentModal
        open={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        invoiceData={{
          invoiceCode: invoiceCode,
          grandTotal: grandTotal,
          exchangeRate: exchangeRate,
        }}
        saving={saving}
        onSaveAndPay={handleSaveAndPay}
        onPreview={() => setShowPrintModal(true)}
        onPrint={() => setShowPrintModal(true)}
      />

      {/* Invoice Print & Preview Modal */}
      <SaleInvoicePrintModal
        open={showPrintModal}
        invoice={createdInvoice || getInvoicePayload()}
        onClose={() => setShowPrintModal(false)}
      />

      {/* Success Confirmation Prompt & Ask to Print */}
      {successPrompt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-green-500/50 bg-slate-900 p-6 shadow-2xl text-center space-y-4">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-green-500/20 text-green-400">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
              </svg>
            </div>

            <div>
              <h3 className="text-lg font-black text-white">Invoice Saved!</h3>
              <p className="mt-1 text-xs text-slate-400">{successPrompt.message}</p>
            </div>

            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  setSuccessPrompt(null)
                  navigate('/admin/sale-dashboard/sale-invoice')
                }}
                className="px-4 py-2.5 rounded-xl border border-slate-700 bg-slate-800 text-xs font-bold text-slate-300 hover:bg-slate-700 transition"
              >
                {lang === 'en' ? 'Back to Invoices' : 'ត្រឡប់ទៅបញ្ជី'}
              </button>

              <button
                type="button"
                onClick={() => {
                  setSuccessPrompt(null)
                  setShowPrintModal(true)
                }}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-[#FF9900] to-[#e68a00] text-slate-950 text-xs font-black uppercase tracking-wider rounded-xl shadow-lg shadow-orange-500/20 transition"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                </svg>
                {lang === 'en' ? 'Print Invoice' : 'បោះពុម្ពវិក័យប័ត្រ'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
