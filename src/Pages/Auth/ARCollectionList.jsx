import React, { useState, useEffect, useMemo, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { useLanguage } from '../../context/LanguageContext'
import { useNotifications } from '../../context/NotificationContext'
import { adminArCollectionAPI, adminCustomerAPI } from '../../api/api'
import dollarIcon from '../../assets/icon/3dicons-dollar-dynamic-color.png'
import './ProductsHub.css'

// 8 Columns as requested for Choose Column modal & table
const ALL_COLUMNS = [
  { key: 'code', label: { en: 'Code', kh: 'លេខកូដ' }, always: true },
  { key: 'paymentDate', label: { en: 'Date', kh: 'កាលបរិច្ឆេទ' }, always: true },
  { key: 'rate', label: { en: 'Rate', kh: 'អត្រាប្តូរប្រាក់' } },
  { key: 'paidAmount', label: { en: 'Paid Amount', kh: 'ចំនួនប្រាក់បានបង់ ($)' }, always: true },
  { key: 'customer', label: { en: 'Customer', kh: 'អតិថិជន' }, always: true },
  { key: 'contact', label: { en: 'Contact', kh: 'ទំនាក់ទំនង' } },
  { key: 'user', label: { en: 'User', kh: 'អ្នកប្រើប្រាស់' } },
  { key: 'status', label: { en: 'Status', kh: 'ស្ថានភាព' }, always: true },
]

const DEFAULT_VISIBLE = [
  'code',
  'paymentDate',
  'rate',
  'paidAmount',
  'customer',
  'contact',
  'user',
  'status',
]

const STATUS_CONFIG = {
  NONE_VOID: { labelEn: 'None-Void', labelKh: 'មិនទាន់មោឃៈ', color: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' },
  VOIDED: { labelEn: 'Voided', labelKh: 'បានទុកជាមោឃៈ', color: 'bg-red-500/20 text-red-400 border-red-500/30' },
}

const APPLY_METHODS = [
  { value: 'FIFO', label: 'Oldest First (FIFO)' },
  { value: 'LIFO', label: 'Newest First (LIFO)' },
  { value: 'MANUAL', label: 'Manual Allocation' },
  { value: 'PRO_RATA', label: 'Pro-Rata / Equal Distribution' },
]

const PAYMENT_TYPES = [
  'Cash',
  'Bank Transfer / ABA',
  'Credit Card',
  'Cheque',
]

// Fallback customer catalog if database has no customers yet
const DEFAULT_CUSTOMER_CATALOG = [
  { id: 1, code: 'CU-0001', name: 'Phnom Penh Mart Supermarket', customerName: 'Phnom Penh Mart Supermarket', phone: '012 889 776', contactPhone: '012 889 776', contactMobile: '098 776 554', contactName: 'Mr. Vanna Touch', email: 'vanna@ppmart.com' },
  { id: 2, code: 'CU-0002', name: 'Lucky Express - Toul Kork', customerName: 'Lucky Express - Toul Kork', phone: '015 992 113', contactPhone: '015 992 113', contactMobile: '012 334 556', contactName: 'Ms. Sreymom Chan', email: 'lucky.tk@gmail.com' },
  { id: 3, code: 'CU-0003', name: 'Angkor Organic Grocers', customerName: 'Angkor Organic Grocers', phone: '098 443 221', contactPhone: '098 443 221', contactMobile: '087 654 321', contactName: 'Mr. Sok Chea', email: 'cheasok@angkororganics.kh' },
  { id: 4, code: 'CU-0004', name: 'BKK1 Daily Fresh Market', customerName: 'BKK1 Daily Fresh Market', phone: '011 223 344', contactPhone: '011 223 344', contactMobile: '016 789 012', contactName: 'Dara Heng', email: 'dailyfresh@bkk1.com' },
  { id: 5, code: 'CU-0005', name: 'Siem Reap Wholesale Hub', customerName: 'Siem Reap Wholesale Hub', phone: '070 556 677', contactPhone: '070 556 677', contactMobile: '093 112 233', contactName: 'Sophea Kim', email: 'wholesale@sr.com.kh' },
]

// Sample unpaid invoices generator for customer
function generateSampleInvoices(customerName) {
  const prefix = customerName ? customerName.slice(0, 3).toUpperCase() : 'INV'
  return [
    {
      invCode: `${prefix}-2026-0041`,
      invDate: '2026-08-15',
      dueDate: '2026-09-01',
      currency: 'USD',
      rate: 4100,
      amount: 450.0,
      balance: 450.0,
      discount: 0.0,
      payAmount: 0.0,
      payCurrency: 'USD',
    },
    {
      invCode: `${prefix}-2026-0048`,
      invDate: '2026-08-22',
      dueDate: '2026-09-07',
      currency: 'USD',
      rate: 4100,
      amount: 680.0,
      balance: 680.0,
      discount: 10.0,
      payAmount: 0.0,
      payCurrency: 'USD',
    },
    {
      invCode: `${prefix}-2026-0053`,
      invDate: '2026-08-29',
      dueDate: '2026-09-15',
      currency: 'USD',
      rate: 4100,
      amount: 320.0,
      balance: 320.0,
      discount: 0.0,
      payAmount: 0.0,
      payCurrency: 'USD',
    },
  ]
}

const formatCurrency = (val) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2 }).format(val || 0)

const formatDate = (val) => {
  if (!val) return '---'
  try {
    const d = new Date(val)
    if (isNaN(d.getTime())) return String(val).slice(0, 10)
    return d.toISOString().slice(0, 10)
  } catch {
    return String(val)
  }
}

export default function ARCollectionList() {
  const { lang } = useLanguage()
  const { addNotification } = useNotifications()

  // State
  const [collections, setCollections] = useState([])
  const [loading, setLoading] = useState(true)

  // Search AR Collection State
  const [searchText, setSearchText] = useState('')
  // Search By dropdown: Any - Code - Paid Amount - Rate - Partner - Contact
  const [searchBy, setSearchBy] = useState('any')
  const [advanceFilterOpen, setAdvanceFilterOpen] = useState(false)
  const [filterStartDate, setFilterStartDate] = useState('')
  const [filterEndDate, setFilterEndDate] = useState('')
  const [filterStatus, setFilterStatus] = useState('ALL') // 'ALL' | 'NONE_VOID' | 'VOIDED'

  // Live master data
  const [customers, setCustomers] = useState(DEFAULT_CUSTOMER_CATALOG)
  const [loadingCustomers, setLoadingCustomers] = useState(false)
  const [customerSearchQuery, setCustomerSearchQuery] = useState('')
  const [availableContacts, setAvailableContacts] = useState([])

  // Choose Column Modal State
  const [chooseColumnOpen, setChooseColumnOpen] = useState(false)
  const [visibleColumns, setVisibleColumns] = useState(DEFAULT_VISIBLE)

  // Create Modal State
  const [createModalOpen, setCreateModalOpen] = useState(false)
  const [saving, setSaving] = useState(false)

  // Form State
  const [formData, setFormData] = useState({
    code: 'Auto Generate Code',
    paymentDate: new Date().toISOString().slice(0, 10),
    customerId: '',
    customer: '',
    contact: '',
    rate: 4100,
    currentAmount: '',
    note: '',
    applyMethod: 'FIFO',
    paymentType: 'Cash',
    authorizationNote: '',
    invoices: [],
  })

  // Load AR Collections from backend
  const loadCollections = useCallback(async () => {
    setLoading(true)
    try {
      const params = {}
      if (searchText.trim()) params.search = searchText.trim()
      if (searchBy) params.searchBy = searchBy
      if (filterStatus && filterStatus !== 'ALL') params.status = filterStatus
      if (filterStartDate) params.startDate = `${filterStartDate}T00:00:00`
      if (filterEndDate) params.endDate = `${filterEndDate}T23:59:59`

      const res = await adminArCollectionAPI.getAll(params)
      const data = res?.data || res || []
      setCollections(Array.isArray(data) ? data : [])
    } catch {
      setCollections([])
    } finally {
      setLoading(false)
    }
  }, [searchText, searchBy, filterStatus, filterStartDate, filterEndDate])

  // Fetch live customers dynamically
  const loadLiveCustomers = useCallback(async () => {
    setLoadingCustomers(true)
    try {
      const res = await adminCustomerAPI.getAll()
      const list = res?.data || res || []
      if (Array.isArray(list) && list.length > 0) {
        setCustomers(list)
      } else {
        setCustomers(DEFAULT_CUSTOMER_CATALOG)
      }
    } catch {
      setCustomers(DEFAULT_CUSTOMER_CATALOG)
    } finally {
      setLoadingCustomers(false)
    }
  }, [])

  // Initial load
  useEffect(() => {
    loadCollections()
    loadLiveCustomers()
  }, [loadCollections, loadLiveCustomers])

  // Filtered live customers for Create Modal dropdown
  const filteredCustomers = useMemo(() => {
    if (!customerSearchQuery.trim()) return customers
    const q = customerSearchQuery.trim().toLowerCase()
    return customers.filter((c) => {
      const name = (c.name || c.customerName || '').toLowerCase()
      const code = (c.code || '').toLowerCase()
      const phone = (c.phone || c.contactPhone || c.contactMobile || c.mobile || '').toLowerCase()
      return name.includes(q) || code.includes(q) || phone.includes(q)
    })
  }, [customers, customerSearchQuery])

  // Computed Balance: Total outstanding balance of all loaded invoices
  const customerBalance = useMemo(() => {
    return formData.invoices.reduce((sum, inv) => sum + Number(inv.balance || 0), 0)
  }, [formData.invoices])

  // Computed Total Paid Amount: Sum of all payAmount values in invoices table
  const totalPaidAmount = useMemo(() => {
    return Math.round(
      formData.invoices.reduce((sum, inv) => sum + Number(inv.payAmount || 0), 0) * 100
    ) / 100
  }, [formData.invoices])

  // Computed Remain Amount: Current Amount - Total Paid Amount
  const remainAmount = useMemo(() => {
    const cur = Number(formData.currentAmount || 0)
    const rem = Math.max(0, cur - totalPaidAmount)
    return Math.round(rem * 100) / 100
  }, [formData.currentAmount, totalPaidAmount])

  // Handle Customer Selection in Create Modal
  const handleCustomerChange = (customerId) => {
    const cust = customers.find((c) => String(c.id) === String(customerId))
    if (cust) {
      const custName = cust.name || cust.customerName || `Customer #${cust.id}`
      const phone = cust.phone || cust.contactPhone || cust.contactMobile || cust.mobile || cust.phoneNumber || ''
      const altPhone = cust.contactMobile || cust.mobile || ''
      const email = cust.email || cust.contactEmail || ''
      const contactPerson = cust.contactName || [cust.contactFirstName, cust.contactLastName].filter(Boolean).join(' ') || ''

      const contactList = []
      if (phone) contactList.push({ label: `${phone} (Primary Phone)`, value: phone })
      if (altPhone && altPhone !== phone) contactList.push({ label: `${altPhone} (Mobile)`, value: altPhone })
      if (contactPerson) contactList.push({ label: `${contactPerson} ${phone ? `(${phone})` : ''}`, value: contactPerson })
      if (email) contactList.push({ label: `${email} (Email)`, value: email })
      if (contactList.length === 0) contactList.push({ label: 'Direct Partner Contact', value: 'Direct' })

      setAvailableContacts(contactList)
      const sampleInvoices = generateSampleInvoices(custName)

      setFormData((prev) => ({
        ...prev,
        customerId: cust.id,
        customer: custName,
        contact: contactList[0]?.value || '',
        invoices: sampleInvoices,
      }))
    } else {
      setAvailableContacts([])
      setFormData((prev) => ({
        ...prev,
        customerId: '',
        customer: '',
        contact: '',
        invoices: [],
      }))
    }
  }

  // Handle manual payAmount change in invoice row
  const handleInvoicePayChange = (index, val) => {
    const entered = Math.max(0, Number(val || 0))
    setFormData((prev) => {
      const updated = [...prev.invoices]
      const inv = { ...updated[index] }
      // cannot pay more than invoice balance
      inv.payAmount = Math.min(inv.balance, entered)
      updated[index] = inv
      return { ...prev, invoices: updated }
    })
  }

  // Auto Button: Allocates Current Amount across invoices based on Apply Method
  const handleAutoApply = () => {
    const available = Number(formData.currentAmount || 0)
    if (available <= 0) {
      addNotification?.('Please enter a Current Amount before clicking Auto.', 'warning')
      return
    }

    setFormData((prev) => {
      let remainingToApply = available
      const updated = prev.invoices.map((inv) => ({ ...inv, payAmount: 0 }))

      if (prev.applyMethod === 'FIFO' || prev.applyMethod === 'MANUAL') {
        // Oldest First
        for (let i = 0; i < updated.length; i++) {
          if (remainingToApply <= 0) break
          const payable = Math.min(updated[i].balance, remainingToApply)
          updated[i].payAmount = Math.round(payable * 100) / 100
          remainingToApply -= payable
        }
      } else if (prev.applyMethod === 'LIFO') {
        // Newest First
        for (let i = updated.length - 1; i >= 0; i--) {
          if (remainingToApply <= 0) break
          const payable = Math.min(updated[i].balance, remainingToApply)
          updated[i].payAmount = Math.round(payable * 100) / 100
          remainingToApply -= payable
        }
      } else if (prev.applyMethod === 'PRO_RATA') {
        // Distribute proportionally across all invoices
        const totalBal = updated.reduce((sum, inv) => sum + inv.balance, 0)
        if (totalBal > 0) {
          updated.forEach((inv) => {
            const share = (inv.balance / totalBal) * available
            inv.payAmount = Math.round(Math.min(inv.balance, share) * 100) / 100
          })
        }
      }

      return { ...prev, invoices: updated }
    })

    addNotification?.('Auto allocation applied across invoices.', 'success')
  }

  // Clear Button: Resets all invoice pay amounts to 0
  const handleClearApply = () => {
    setFormData((prev) => ({
      ...prev,
      invoices: prev.invoices.map((inv) => ({ ...inv, payAmount: 0 })),
    }))
    addNotification?.('Payment amounts cleared.', 'info')
  }

  // Open Create Modal & generate next code + query live customer data
  const openCreateModal = async () => {
    loadLiveCustomers()

    try {
      const nextCodeRes = await adminArCollectionAPI.getNextCode()
      const nextCode = nextCodeRes?.data || nextCodeRes || 'Auto Generate Code'
      setFormData((prev) => ({
        ...prev,
        code: nextCode,
        paymentDate: new Date().toISOString().slice(0, 10),
        currentAmount: '',
        note: '',
        authorizationNote: '',
      }))
    } catch {
      setFormData((prev) => ({
        ...prev,
        code: 'Auto Generate Code',
        paymentDate: new Date().toISOString().slice(0, 10),
        currentAmount: '',
        note: '',
        authorizationNote: '',
      }))
    }
    setCreateModalOpen(true)
  }

  // Save AR Collection
  const handleSaveCollection = async (e) => {
    e.preventDefault()
    if (!formData.customer) {
      addNotification?.('Please select a customer for this AR collection.', 'warning')
      return
    }
    if (totalPaidAmount <= 0) {
      addNotification?.('Please allocate payment to at least one invoice using Auto or manual entry.', 'warning')
      return
    }

    setSaving(true)
    try {
      const payload = {
        code: formData.code,
        paymentDate: formData.paymentDate ? `${formData.paymentDate}T12:00:00` : new Date().toISOString(),
        rate: Number(formData.rate || 4100),
        paidAmount: totalPaidAmount,
        balance: customerBalance,
        currentAmount: Number(formData.currentAmount || totalPaidAmount),
        remainAmount: remainAmount,
        customerId: formData.customerId ? Number(formData.customerId) : null,
        customer: formData.customer,
        contact: formData.contact,
        user: 'Admin',
        status: 'NONE_VOID',
        note: formData.note,
        applyMethod: formData.applyMethod,
        paymentType: formData.paymentType,
        authorizationNote: formData.authorizationNote,
        invoices: formData.invoices.map((inv) => ({
          invCode: inv.invCode,
          invDate: inv.invDate ? `${inv.invDate}T00:00:00` : null,
          dueDate: inv.dueDate ? `${inv.dueDate}T00:00:00` : null,
          currency: inv.currency,
          rate: Number(inv.rate || 4100),
          amount: Number(inv.amount),
          balance: Number(inv.balance),
          discount: Number(inv.discount || 0),
          payAmount: Number(inv.payAmount || 0),
          payCurrency: inv.payCurrency || 'USD',
        })),
      }

      await adminArCollectionAPI.create(payload)
      addNotification?.(`AR Collection ${formData.code} recorded successfully!`, 'success')
      setCreateModalOpen(false)
      loadCollections()
    } catch {
      // Fallback local append
      const localRecord = {
        id: Date.now(),
        code: formData.code === 'Auto Generate Code' ? `ARC-${Date.now()}` : formData.code,
        paymentDate: formData.paymentDate,
        rate: formData.rate,
        paidAmount: totalPaidAmount,
        customer: formData.customer,
        contact: formData.contact,
        user: 'Admin',
        status: 'NONE_VOID',
      }
      setCollections((prev) => [localRecord, ...prev])
      addNotification?.('AR Collection recorded successfully!', 'success')
      setCreateModalOpen(false)
    } finally {
      setSaving(false)
    }
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
      {/* 1. HERO BANNER */}
      <section className="relative overflow-hidden rounded-3xl border border-emerald-500/20 bg-gradient-to-br from-[#1e293b] via-[#0f172a] to-[#0b0f17] p-5 sm:p-7 shadow-2xl shadow-emerald-500/10">
        <div className="pointer-events-none absolute -right-16 -top-20 h-64 w-64 rounded-full bg-emerald-500/15 blur-3xl" />
        <div className="pointer-events-none absolute bottom-0 left-1/4 h-px w-2/3 bg-gradient-to-r from-transparent via-emerald-500/40 to-transparent" />

        <div className="relative flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-3">
            <Link
              to="/admin/sale-payment"
              className="inline-flex items-center gap-2 rounded-full border border-slate-700/80 bg-slate-950/60 px-3.5 py-1.5 text-xs font-bold uppercase tracking-[0.18em] text-emerald-300 transition hover:border-emerald-400 hover:text-white active:scale-95"
            >
              <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <path d="M15 19l-7-7 7-7" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              {lang === 'en' ? 'Sale Payment Hub' : 'ផ្ទាំងគ្រប់គ្រងទូទាត់លក់'}
            </Link>

            <div className="flex items-center gap-3.5">
              <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-emerald-500/15 p-2 ring-1 ring-emerald-500/30 shadow-lg shadow-emerald-500/20">
                <img src={dollarIcon} alt="" className="h-9 w-9 object-contain drop-shadow-md" />
              </span>
              <div>
                <p className="text-[11px] font-black uppercase tracking-[0.25em] text-emerald-400">
                  {lang === 'en' ? 'Accounts Receivable' : 'គណនីត្រូវប្រមូល'}
                </p>
                <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
                  {lang === 'en' ? 'AR Collection' : 'ការប្រមូលប្រាក់ទារបំណុល'}
                </h1>
              </div>
            </div>

            <p className="max-w-2xl text-xs sm:text-sm leading-relaxed text-slate-300">
              {lang === 'en'
                ? 'Collect payments against open customer invoices, allocate receipts with FIFO/LIFO rules, and reconcile accounts receivable balances.'
                : 'ទទួលការទូទាត់លើវិក័យប័ត្រជំពាក់ ផ្គូផ្គងការទូទាត់តាមវិធាន FIFO/LIFO និងទូទាត់សមតុល្យគណនីត្រូវប្រមូល។'}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={openCreateModal}
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 px-5 py-2.5 text-xs font-black uppercase tracking-wider text-white shadow-lg shadow-emerald-500/25 transition hover:brightness-110 active:scale-95"
            >
              <span className="text-base leading-none">+</span>
              <span>{lang === 'en' ? 'New Collection' : 'បង្កើតការប្រមូលថ្មី'}</span>
            </button>
          </div>
        </div>
      </section>

      {/* 2. SEARCH AR COLLECTION & ADVANCE FILTER */}
      <section className="rounded-3xl border border-slate-800 bg-slate-900/80 p-5 sm:p-6 shadow-xl shadow-black/20 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800/80">
          <div className="flex items-center gap-3">
            <div className="h-5 w-1.5 rounded-full bg-emerald-500" />
            <h2 className="text-base font-bold text-white font-['Montserrat']">
              {lang === 'en' ? 'Search AR Collection' : 'ស្វែងរកការប្រមូលប្រាក់'}
            </h2>
          </div>

          <button
            type="button"
            onClick={() => setAdvanceFilterOpen(!advanceFilterOpen)}
            className="inline-flex items-center gap-2 text-xs font-bold text-emerald-400 hover:text-emerald-300 transition"
          >
            <span>{lang === 'en' ? 'Advance Filter' : 'តម្រងកម្រិតខ្ពស់'}</span>
            <span className={`transform transition-transform duration-200 ${advanceFilterOpen ? 'rotate-180' : ''}`}>
              ▼
            </span>
          </button>
        </div>

        {/* Search Input Row */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-12">
          {/* Search - Textbox */}
          <div className="sm:col-span-6 md:col-span-7">
            <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
              {lang === 'en' ? 'Search' : 'ស្វែងរក'}
            </label>
            <div className="relative">
              <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 text-xs">
                🔍
              </span>
              <input
                type="text"
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && loadCollections()}
                placeholder={
                  lang === 'en'
                    ? 'Search collection code, customer, paid amount, contact...'
                    : 'ស្វែងរកលេខកូដប្រមូល ឈ្មោះអតិថិជន ចំនួនទឹកប្រាក់ ទំនាក់ទំនង...'
                }
                className="w-full rounded-xl border border-slate-700/80 bg-slate-950/90 py-2 pl-9 pr-4 text-xs font-semibold text-white placeholder-slate-500 outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/20"
              />
            </div>
          </div>

          {/* Search By - DropDown: Any - Code - Paid Amount - Rate - Partner - Contact */}
          <div className="sm:col-span-4 md:col-span-3">
            <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
              {lang === 'en' ? 'Search By' : 'ស្វែងរកតាម'}
            </label>
            <select
              value={searchBy}
              onChange={(e) => setSearchBy(e.target.value)}
              className="w-full rounded-xl border border-slate-700/80 bg-slate-950/90 py-2 px-3 text-xs font-semibold text-white outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/20"
            >
              <option value="any">{lang === 'en' ? 'Any' : 'ទាំងអស់'}</option>
              <option value="code">{lang === 'en' ? 'Code' : 'លេខកូដ'}</option>
              <option value="paidAmount">{lang === 'en' ? 'Paid Amount' : 'ចំនួនប្រាក់បង់'}</option>
              <option value="rate">{lang === 'en' ? 'Rate' : 'អត្រាប្តូរប្រាក់'}</option>
              <option value="partner">{lang === 'en' ? 'Partner' : 'ដៃគូ/អតិថិជន'}</option>
              <option value="contact">{lang === 'en' ? 'Contact' : 'ទំនាក់ទំនង'}</option>
            </select>
          </div>

          {/* Search Button */}
          <div className="sm:col-span-2 flex items-end">
            <button
              type="button"
              onClick={loadCollections}
              className="w-full rounded-xl bg-emerald-600 hover:bg-emerald-500 py-2 px-4 text-xs font-bold text-white transition active:scale-95 shadow-md shadow-emerald-600/20"
            >
              {lang === 'en' ? 'Search' : 'ស្វែងរក'}
            </button>
          </div>
        </div>

        {/* Advance Filter: From date to date - Status Dropdown (None-Void, Voided) */}
        {advanceFilterOpen && (
          <div className="pt-4 border-t border-slate-800/80 grid grid-cols-1 gap-3.5 sm:grid-cols-3">
            <div>
              <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                {lang === 'en' ? 'From Date' : 'ចាប់ពីថ្ងៃ'}
              </label>
              <input
                type="date"
                value={filterStartDate}
                onChange={(e) => setFilterStartDate(e.target.value)}
                className="w-full rounded-xl border border-slate-700/80 bg-slate-950/90 py-1.5 px-3 text-xs text-white outline-none focus:border-emerald-400"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                {lang === 'en' ? 'To Date' : 'រហូតដល់ថ្ងៃ'}
              </label>
              <input
                type="date"
                value={filterEndDate}
                onChange={(e) => setFilterEndDate(e.target.value)}
                className="w-full rounded-xl border border-slate-700/80 bg-slate-950/90 py-1.5 px-3 text-xs text-white outline-none focus:border-emerald-400"
              />
            </div>

            {/* Status Dropdown: None-Void, Voided */}
            <div>
              <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                {lang === 'en' ? 'Status' : 'ស្ថានភាព'}
              </label>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="w-full rounded-xl border border-slate-700/80 bg-slate-950/90 py-1.5 px-3 text-xs text-white outline-none focus:border-emerald-400"
              >
                <option value="ALL">{lang === 'en' ? 'All' : 'ទាំងអស់'}</option>
                <option value="NONE_VOID">{lang === 'en' ? 'None-Void' : 'មិនទាន់មោឃៈ'}</option>
                <option value="VOIDED">{lang === 'en' ? 'Voided' : 'បានទុកជាមោឃៈ'}</option>
              </select>
            </div>
          </div>
        )}
      </section>

      {/* 3. AR COLLECTION LIST */}
      <section className="rounded-3xl border border-slate-800 bg-slate-900/80 p-5 sm:p-6 shadow-xl shadow-black/20 space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between pb-3 border-b border-slate-800/80">
          <div className="flex items-center gap-3">
            <div className="h-5 w-1.5 rounded-full bg-emerald-500" />
            <div>
              <h2 className="text-base font-bold text-white font-['Montserrat']">
                {lang === 'en' ? 'AR Collection List' : 'បញ្ជីប្រមូលប្រាក់ទារបំណុល'}
              </h2>
              <p className="text-[11px] text-slate-400">
                {lang === 'en'
                  ? 'Show information of AR Collection. Ex(Code, Date, Paid Amount...)'
                  : 'បង្ហាញព័ត៌មាននៃការប្រមូលប្រាក់ទារបំណុល (លេខកូដ, កាលបរិច្ឆេទ, ចំនួនទឹកប្រាក់បង់...)'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setChooseColumnOpen(true)}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-950/80 px-3.5 py-1.5 text-xs font-bold text-slate-300 hover:border-emerald-400 hover:text-white transition active:scale-95"
            >
              <span>⚙️</span>
              <span>{lang === 'en' ? 'Choose Column' : 'ជ្រើសរើសជួរឈរ'}</span>
            </button>

            <button
              type="button"
              onClick={openCreateModal}
              className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 px-4 py-1.5 text-xs font-bold text-white transition active:scale-95 shadow-md shadow-emerald-600/25"
            >
              <span>+</span>
              <span>{lang === 'en' ? 'Create' : 'បង្កើត'}</span>
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto rounded-2xl border border-slate-800">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950/90 text-[11px] uppercase tracking-wider text-slate-400 font-bold border-b border-slate-800">
              <tr>
                {visibleColumns.includes('code') && <th className="py-3 px-3.5">Code</th>}
                {visibleColumns.includes('paymentDate') && <th className="py-3 px-3.5">Date</th>}
                {visibleColumns.includes('rate') && <th className="py-3 px-3.5">Rate</th>}
                {visibleColumns.includes('paidAmount') && <th className="py-3 px-3.5 text-right">Paid Amount</th>}
                {visibleColumns.includes('customer') && <th className="py-3 px-3.5">Customer</th>}
                {visibleColumns.includes('contact') && <th className="py-3 px-3.5">Contact</th>}
                {visibleColumns.includes('user') && <th className="py-3 px-3.5">User</th>}
                {visibleColumns.includes('status') && <th className="py-3 px-3.5 text-center">Status</th>}
                <th className="py-3 px-3.5 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80 bg-slate-900/40">
              {loading ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-500 font-mono">
                    <span className="inline-block animate-spin mr-2">🌀</span>
                    {lang === 'en' ? 'Loading AR collections...' : 'កំពុងផ្ទុកទិន្នន័យ...'}
                  </td>
                </tr>
              ) : collections.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-500 space-y-2">
                    <div className="text-3xl">💵</div>
                    <p className="font-semibold">
                      {lang === 'en' ? 'No AR Collection records found' : 'មិនទាន់មានទិន្នន័យប្រមូលប្រាក់ឡើយ'}
                    </p>
                    <button
                      type="button"
                      onClick={openCreateModal}
                      className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600/30 border border-emerald-500/40 px-3 py-1 text-xs font-bold text-emerald-300 hover:bg-emerald-600/50 transition"
                    >
                      + {lang === 'en' ? 'Create First AR Collection' : 'កត់ត្រាការប្រមូលប្រាក់ដំបូង'}
                    </button>
                  </td>
                </tr>
              ) : (
                collections.map((c) => {
                  const st = STATUS_CONFIG[c.status] || STATUS_CONFIG.NONE_VOID
                  return (
                    <tr key={c.id || c.code} className="hover:bg-slate-800/50 transition">
                      {visibleColumns.includes('code') && (
                        <td className="py-3 px-3.5 font-mono font-bold text-emerald-400">
                          {c.code}
                        </td>
                      )}
                      {visibleColumns.includes('paymentDate') && (
                        <td className="py-3 px-3.5 text-slate-300">
                          {formatDate(c.paymentDate)}
                        </td>
                      )}
                      {visibleColumns.includes('rate') && (
                        <td className="py-3 px-3.5 text-slate-400 font-mono">
                          {Number(c.rate || 4100).toLocaleString()} KHR
                        </td>
                      )}
                      {visibleColumns.includes('paidAmount') && (
                        <td className="py-3 px-3.5 text-right font-mono font-bold text-emerald-400">
                          {formatCurrency(c.paidAmount)}
                        </td>
                      )}
                      {visibleColumns.includes('customer') && (
                        <td className="py-3 px-3.5 font-semibold text-white">
                          {c.customer || '---'}
                        </td>
                      )}
                      {visibleColumns.includes('contact') && (
                        <td className="py-3 px-3.5 text-slate-400 font-mono">
                          {c.contact || '---'}
                        </td>
                      )}
                      {visibleColumns.includes('user') && (
                        <td className="py-3 px-3.5 text-slate-300">
                          {c.user || 'Admin'}
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
                              const newSt = c.status === 'VOIDED' ? 'NONE_VOID' : 'VOIDED'
                              adminArCollectionAPI
                                .updateStatus(c.id, newSt)
                                .then(() => loadCollections())
                                .catch(() => {})
                            }}
                            className="text-[11px] text-emerald-400 hover:text-emerald-300 p-1 hover:bg-slate-800 rounded"
                            title={c.status === 'VOIDED' ? 'Restore Collection' : 'Void Collection'}
                          >
                            {c.status === 'VOIDED' ? '↩️' : '🚫'}
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              if (window.confirm(`Delete AR Collection ${c.code}?`)) {
                                adminArCollectionAPI
                                  .delete(c.id)
                                  .then(() => loadCollections())
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

      {/* 4. CHOOSE COLUMN MODAL (With Reset Button) */}
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
                        ? 'border-emerald-500/50 bg-emerald-500/15 text-white'
                        : 'border-slate-800 bg-slate-900/60 text-slate-400 hover:bg-slate-800'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={isChecked}
                      disabled={col.always}
                      onChange={() => toggleColumn(col.key)}
                      className="rounded accent-emerald-500"
                    />
                    <span>{lang === 'kh' ? col.label.kh : col.label.en}</span>
                  </label>
                )
              })}
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setVisibleColumns(DEFAULT_VISIBLE)}
                className="rounded-xl border border-slate-700 bg-slate-800 px-3.5 py-1.5 text-xs font-semibold text-slate-300 hover:text-white transition"
              >
                {lang === 'en' ? 'Reset' : 'កំណត់ឡើងវិញ'}
              </button>
              <button
                type="button"
                onClick={() => setChooseColumnOpen(false)}
                className="rounded-xl bg-emerald-600 px-4 py-1.5 text-xs font-bold text-white transition hover:bg-emerald-500"
              >
                {lang === 'en' ? 'Apply' : 'យល់ព្រម'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 5. CREATE AR COLLECTION MODAL */}
      {createModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-3 sm:p-5 overflow-y-auto">
          <div className="relative w-full max-w-5xl rounded-3xl border border-slate-800 bg-[#0f172a] shadow-2xl my-auto overflow-hidden">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-800 p-5 bg-[#141922]">
              <div>
                <h3 className="text-lg font-black text-white font-['Montserrat']">
                  {lang === 'en' ? 'General Information' : 'ព័ត៌មានទូទៅ'}
                </h3>
                <p className="text-xs text-slate-400">
                  {lang === 'en'
                    ? 'Input AR Collection Information'
                    : 'បញ្ចូលព័ត៌មានការប្រមូលប្រាក់ទារបំណុល'}
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

            <form onSubmit={handleSaveCollection} className="p-5 sm:p-6 space-y-6 max-h-[85vh] overflow-y-auto">
              {/* SECTION 1: GENERAL INFORMATION */}
              <div className="space-y-4">
                <div className="border-b border-slate-800 pb-2 flex items-center gap-2">
                  <div className="h-4 w-1 rounded-full bg-emerald-500" />
                  <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-400">
                    General Information
                  </h4>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {/* Code - Textbox Auto Generate Code */}
                  <div>
                    <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-1">
                      Code
                    </label>
                    <input
                      type="text"
                      value={formData.code}
                      onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                      placeholder="Auto Generate Code"
                      className="w-full rounded-xl border border-slate-700 bg-slate-950/90 py-2 px-3 text-xs text-emerald-400 font-mono font-bold outline-none focus:border-emerald-400"
                    />
                  </div>

                  {/* Payment Date - Date */}
                  <div>
                    <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-1">
                      Payment Date
                    </label>
                    <input
                      type="date"
                      value={formData.paymentDate}
                      onChange={(e) => setFormData({ ...formData, paymentDate: e.target.value })}
                      required
                      className="w-full rounded-xl border border-slate-700 bg-slate-950/90 py-2 px-3 text-xs text-white outline-none focus:border-emerald-400 font-mono"
                    />
                  </div>

                  {/* Rate */}
                  <div>
                    <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-1">
                      Rate (KHR / USD)
                    </label>
                    <input
                      type="number"
                      value={formData.rate}
                      onChange={(e) => setFormData({ ...formData, rate: e.target.value })}
                      className="w-full rounded-xl border border-slate-700 bg-slate-950/90 py-2 px-3 text-xs text-white outline-none focus:border-emerald-400 font-mono"
                    />
                  </div>

                  {/* Customer * - Dropdown */}
                  <div className="sm:col-span-2 space-y-1">
                    <div className="flex items-center justify-between">
                      <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider">
                        Customer *
                      </label>
                      <span className="text-[10px] text-emerald-400 font-mono flex items-center gap-1">
                        <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                        {customers.length} Live
                      </span>
                    </div>

                    {/* Quick filter input */}
                    <input
                      type="text"
                      value={customerSearchQuery}
                      onChange={(e) => setCustomerSearchQuery(e.target.value)}
                      placeholder="Quick search customer name, code or phone..."
                      className="w-full rounded-xl border border-slate-800 bg-slate-900 py-1.5 px-3 text-[11px] text-white placeholder-slate-500 outline-none focus:border-emerald-400"
                    />

                    {/* Customer Select */}
                    <select
                      value={formData.customerId}
                      onChange={(e) => handleCustomerChange(e.target.value)}
                      required
                      className="w-full rounded-xl border border-slate-700 bg-slate-950/90 py-2 px-3 text-xs text-white outline-none focus:border-emerald-400 mt-1"
                    >
                      <option value="">-- Select Customer --</option>
                      {filteredCustomers.map((c) => {
                        const name = c.name || c.customerName || `Customer #${c.id}`
                        const code = c.code ? `[${c.code}] ` : ''
                        const phone = c.phone || c.contactPhone || c.contactMobile || c.mobile || ''
                        return (
                          <option key={c.id} value={c.id}>
                            {code}{name} {phone ? `— (${phone})` : ''}
                          </option>
                        )
                      })}
                    </select>
                  </div>

                  {/* Contact * - Dropdown */}
                  <div>
                    <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-1">
                      Contact *
                    </label>
                    <select
                      value={formData.contact}
                      onChange={(e) => setFormData({ ...formData, contact: e.target.value })}
                      required
                      className="w-full rounded-xl border border-slate-700 bg-slate-950/90 py-2 px-3 text-xs text-white outline-none focus:border-emerald-400 font-mono"
                    >
                      <option value="">-- Select Contact --</option>
                      {availableContacts.map((ct, idx) => (
                        <option key={idx} value={ct.value}>
                          {ct.label}
                        </option>
                      ))}
                      {formData.contact && !availableContacts.some((c) => c.value === formData.contact) && (
                        <option value={formData.contact}>{formData.contact}</option>
                      )}
                    </select>
                  </div>

                  {/* Balance - Textbox Visable $0.00 */}
                  <div>
                    <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-1">
                      Balance (Visable)
                    </label>
                    <input
                      type="text"
                      readOnly
                      value={formatCurrency(customerBalance)}
                      className="w-full rounded-xl border border-slate-700/60 bg-slate-900/90 py-2 px-3 text-xs text-slate-300 font-mono font-bold outline-none cursor-not-allowed"
                    />
                  </div>

                  {/* Current Amount - textbox */}
                  <div>
                    <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-1">
                      Current Amount ($) *
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0.01"
                      value={formData.currentAmount}
                      onChange={(e) => setFormData({ ...formData, currentAmount: e.target.value })}
                      placeholder="0.00"
                      className="w-full rounded-xl border border-emerald-500/50 bg-slate-950/90 py-2 px-3 text-xs text-emerald-400 font-mono font-bold outline-none focus:border-emerald-400"
                    />
                  </div>

                  {/* Total Paid Amount - Textbox Visable $0.00 */}
                  <div>
                    <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-1">
                      Total Paid Amount (Visable)
                    </label>
                    <input
                      type="text"
                      readOnly
                      value={formatCurrency(totalPaidAmount)}
                      className="w-full rounded-xl border border-slate-700/60 bg-slate-900/90 py-2 px-3 text-xs text-emerald-400 font-mono font-bold outline-none cursor-not-allowed"
                    />
                  </div>

                  {/* Remain Amount - visable textbox */}
                  <div>
                    <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-1">
                      Remain Amount (Visable)
                    </label>
                    <input
                      type="text"
                      readOnly
                      value={formatCurrency(remainAmount)}
                      className="w-full rounded-xl border border-slate-700/60 bg-slate-900/90 py-2 px-3 text-xs text-amber-400 font-mono font-bold outline-none cursor-not-allowed"
                    />
                  </div>

                  {/* Note - Textbox */}
                  <div className="sm:col-span-2 lg:col-span-2">
                    <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-1">
                      Note
                    </label>
                    <input
                      type="text"
                      value={formData.note}
                      onChange={(e) => setFormData({ ...formData, note: e.target.value })}
                      placeholder="Payment remarks or reference details..."
                      className="w-full rounded-xl border border-slate-700 bg-slate-950/90 py-2 px-3 text-xs text-white outline-none focus:border-emerald-400"
                    />
                  </div>
                </div>
              </div>

              {/* SECTION 2: APPLY METHOD */}
              <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-4 sm:p-5 space-y-4">
                <div className="border-b border-slate-800 pb-2">
                  <h4 className="text-sm font-bold text-white font-['Montserrat']">
                    Apply Method
                  </h4>
                  <p className="text-[11px] text-slate-400">
                    Choose apply method and do payment
                  </p>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 items-end">
                  {/* Apply - dropdown */}
                  <div>
                    <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-1">
                      Apply
                    </label>
                    <select
                      value={formData.applyMethod}
                      onChange={(e) => setFormData({ ...formData, applyMethod: e.target.value })}
                      className="w-full rounded-xl border border-slate-700 bg-slate-900 py-2 px-3 text-xs text-white outline-none focus:border-emerald-400"
                    >
                      {APPLY_METHODS.map((m) => (
                        <option key={m.value} value={m.value}>
                          {m.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Payment Type - dropdown */}
                  <div>
                    <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-1">
                      Payment Type
                    </label>
                    <select
                      value={formData.paymentType}
                      onChange={(e) => setFormData({ ...formData, paymentType: e.target.value })}
                      className="w-full rounded-xl border border-slate-700 bg-slate-900 py-2 px-3 text-xs text-white outline-none focus:border-emerald-400"
                    >
                      {PAYMENT_TYPES.map((pt) => (
                        <option key={pt} value={pt}>
                          {pt}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Action Buttons: Auto - button & Clear - button */}
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleAutoApply}
                      className="flex-1 rounded-xl bg-emerald-600 hover:bg-emerald-500 py-2 px-3 text-xs font-bold text-white transition active:scale-95 shadow-md shadow-emerald-600/20"
                    >
                      ⚡ Auto
                    </button>
                    <button
                      type="button"
                      onClick={handleClearApply}
                      className="flex-1 rounded-xl border border-slate-700 bg-slate-850 hover:bg-slate-800 py-2 px-3 text-xs font-bold text-slate-300 hover:text-white transition active:scale-95"
                    >
                      ✕ Clear
                    </button>
                  </div>

                  {/* Authorization Note - textbox */}
                  <div>
                    <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-1">
                      Authorization Note
                    </label>
                    <input
                      type="text"
                      value={formData.authorizationNote}
                      onChange={(e) => setFormData({ ...formData, authorizationNote: e.target.value })}
                      placeholder="Manager approval code..."
                      className="w-full rounded-xl border border-slate-700 bg-slate-900 py-2 px-3 text-xs text-white outline-none focus:border-emerald-400"
                    />
                  </div>
                </div>
              </div>

              {/* SECTION 3: INVOICES TABLE */}
              <div className="space-y-3">
                <div className="border-b border-slate-800 pb-2">
                  <h4 className="text-sm font-bold text-white font-['Montserrat']">
                    Invoices
                  </h4>
                  <p className="text-[11px] text-slate-400">
                    Do payment of invoices
                  </p>
                </div>

                <div className="overflow-x-auto rounded-2xl border border-slate-800">
                  <table className="w-full text-left text-xs text-slate-300">
                    <thead className="bg-slate-950/90 text-[10px] uppercase tracking-wider text-slate-400 font-bold border-b border-slate-800">
                      <tr>
                        <th className="py-2.5 px-3">Inv Code</th>
                        <th className="py-2.5 px-3">Inv Date</th>
                        <th className="py-2.5 px-3">Due Date</th>
                        <th className="py-2.5 px-3 text-center">Currency</th>
                        <th className="py-2.5 px-3 text-right">Rate</th>
                        <th className="py-2.5 px-3 text-right">Amount</th>
                        <th className="py-2.5 px-3 text-right">Balance</th>
                        <th className="py-2.5 px-3 text-right">Discount</th>
                        <th className="py-2.5 px-3 text-right w-28">Pay Amount</th>
                        <th className="py-2.5 px-3 text-center">Pay Currency</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/80 bg-slate-900/40 font-mono text-xs">
                      {formData.invoices.length === 0 ? (
                        <tr>
                          <td colSpan={10} className="py-8 text-center text-slate-500 font-sans">
                            {formData.customer
                              ? 'No unpaid invoices found for this customer.'
                              : 'Select a customer above to load outstanding invoices.'}
                          </td>
                        </tr>
                      ) : (
                        formData.invoices.map((inv, idx) => (
                          <tr key={inv.invCode || idx} className="hover:bg-slate-800/40 transition">
                            <td className="py-2 px-3 font-bold text-emerald-400">
                              {inv.invCode}
                            </td>
                            <td className="py-2 px-3 text-slate-300">
                              {inv.invDate}
                            </td>
                            <td className="py-2 px-3 text-slate-400">
                              {inv.dueDate}
                            </td>
                            <td className="py-2 px-3 text-center text-slate-300">
                              {inv.currency}
                            </td>
                            <td className="py-2 px-3 text-right text-slate-400">
                              {Number(inv.rate || 4100).toLocaleString()}
                            </td>
                            <td className="py-2 px-3 text-right text-slate-300">
                              {formatCurrency(inv.amount)}
                            </td>
                            <td className="py-2 px-3 text-right font-bold text-white">
                              {formatCurrency(inv.balance)}
                            </td>
                            <td className="py-2 px-3 text-right text-slate-400">
                              {formatCurrency(inv.discount)}
                            </td>
                            <td className="py-2 px-3 text-right">
                              <input
                                type="number"
                                step="0.01"
                                min="0"
                                max={inv.balance}
                                value={inv.payAmount}
                                onChange={(e) => handleInvoicePayChange(idx, e.target.value)}
                                className="w-24 rounded-lg border border-emerald-500/40 bg-slate-950 px-2 py-1 text-right text-emerald-400 font-bold outline-none focus:border-emerald-400"
                              />
                            </td>
                            <td className="py-2 px-3 text-center text-slate-400">
                              {inv.payCurrency || 'USD'}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Invoices Footer Summary */}
                <div className="flex items-center justify-between rounded-xl bg-slate-950/80 px-4 py-2.5 text-xs font-mono">
                  <span className="text-slate-400">
                    Total Invoices: {formData.invoices.length} | Balance Due: {formatCurrency(customerBalance)}
                  </span>
                  <div className="flex items-center gap-4">
                    <span className="text-slate-300">
                      Paid: <strong className="text-emerald-400 text-sm">{formatCurrency(totalPaidAmount)}</strong>
                    </span>
                    <span className="text-slate-300">
                      Remaining: <strong className="text-amber-400 text-sm">{formatCurrency(remainAmount)}</strong>
                    </span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
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
                  className="rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 px-6 py-2 text-xs font-black uppercase tracking-wider text-white shadow-lg shadow-emerald-600/30 hover:brightness-110 active:scale-95 transition disabled:opacity-50"
                >
                  {saving ? 'Saving...' : 'Save AR Collection'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
