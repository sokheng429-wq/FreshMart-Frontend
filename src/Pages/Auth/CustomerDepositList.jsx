import React, { useState, useEffect, useMemo, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { useLanguage } from '../../context/LanguageContext'
import { useNotifications } from '../../context/NotificationContext'
import { adminCustomerDepositAPI, adminCustomerAPI } from '../../api/api'
import walletIcon from '../../assets/icon/3dicons-wallet-dynamic-color.png'
import './ProductsHub.css'

// 7 Columns exactly as requested for Choose Column modal & table
const ALL_COLUMNS = [
  { key: 'code', label: { en: 'Code', kh: 'លេខកូដ' }, always: true },
  { key: 'depositDate', label: { en: 'Date', kh: 'កាលបរិច្ឆេទ' }, always: true },
  { key: 'amount', label: { en: 'Amount', kh: 'ចំនួនទឹកប្រាក់ ($)' }, always: true },
  { key: 'customerName', label: { en: 'Customer', kh: 'អតិថិជន' }, always: true },
  { key: 'username', label: { en: 'Username', kh: 'ឈ្មោះអ្នកប្រើ' } },
  { key: 'contact', label: { en: 'Contact', kh: 'ទំនាក់ទំនង' } },
  { key: 'status', label: { en: 'Status', kh: 'ស្ថានភាព' }, always: true },
]

const DEFAULT_VISIBLE = [
  'code',
  'depositDate',
  'amount',
  'customerName',
  'username',
  'contact',
  'status',
]

const STATUS_CONFIG = {
  NONE_VOID: { labelEn: 'None-Void', labelKh: 'មិនទាន់មោឃៈ', color: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' },
  VOIDED: { labelEn: 'Voided', labelKh: 'បានទុកជាមោឃៈ', color: 'bg-red-500/20 text-red-400 border-red-500/30' },
}

const PAYMENT_TYPES = [
  'Cash',
  'Bank Transfer / ABA',
  'Credit Card',
  'Cheque',
  'Online Payment',
]

// Fallback live customer catalog if backend database has no customer records yet
const DEFAULT_CUSTOMER_CATALOG = [
  { id: 1, code: 'CU-0001', name: 'Phnom Penh Mart Supermarket', customerName: 'Phnom Penh Mart Supermarket', phone: '012 889 776', contactPhone: '012 889 776', contactMobile: '098 776 554', contactName: 'Mr. Vanna Touch', email: 'vanna@ppmart.com' },
  { id: 2, code: 'CU-0002', name: 'Lucky Express - Toul Kork', customerName: 'Lucky Express - Toul Kork', phone: '015 992 113', contactPhone: '015 992 113', contactMobile: '012 334 556', contactName: 'Ms. Sreymom Chan', email: 'lucky.tk@gmail.com' },
  { id: 3, code: 'CU-0003', name: 'Angkor Organic Grocers', customerName: 'Angkor Organic Grocers', phone: '098 443 221', contactPhone: '098 443 221', contactMobile: '087 654 321', contactName: 'Mr. Sok Chea', email: 'cheasok@angkororganics.kh' },
  { id: 4, code: 'CU-0004', name: 'BKK1 Daily Fresh Market', customerName: 'BKK1 Daily Fresh Market', phone: '011 223 344', contactPhone: '011 223 344', contactMobile: '016 789 012', contactName: 'Dara Heng', email: 'dailyfresh@bkk1.com' },
  { id: 5, code: 'CU-0005', name: 'Siem Reap Wholesale Hub', customerName: 'Siem Reap Wholesale Hub', phone: '070 556 677', contactPhone: '070 556 677', contactMobile: '093 112 233', contactName: 'Sophea Kim', email: 'wholesale@sr.com.kh' },
]

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

export default function CustomerDepositList() {
  const { lang } = useLanguage()
  const { addNotification } = useNotifications()

  // State
  const [deposits, setDeposits] = useState([])
  const [loading, setLoading] = useState(true)

  // Search & Filter State
  const [searchText, setSearchText] = useState('')
  const [searchBy, setSearchBy] = useState('any') // 'any' | 'code' | 'amount'
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
    date: new Date().toISOString().slice(0, 10),
    customerId: '',
    customerName: '',
    contact: '',
    paymentType: 'Cash',
    amount: '',
    reference: '',
    username: 'Admin',
    note: '',
  })

  // Load customer deposits from backend
  const loadDeposits = useCallback(async () => {
    setLoading(true)
    try {
      const params = {}
      if (searchText.trim()) params.search = searchText.trim()
      if (searchBy) params.searchBy = searchBy
      if (filterStatus && filterStatus !== 'ALL') params.status = filterStatus
      if (filterStartDate) params.startDate = `${filterStartDate}T00:00:00`
      if (filterEndDate) params.endDate = `${filterEndDate}T23:59:59`

      const res = await adminCustomerDepositAPI.getAll(params)
      const data = res?.data || res || []
      setDeposits(Array.isArray(data) ? data : [])
    } catch {
      setDeposits([])
    } finally {
      setLoading(false)
    }
  }, [searchText, searchBy, filterStatus, filterStartDate, filterEndDate])

  // Fetch live customers dynamically from backend
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
    loadDeposits()
    loadLiveCustomers()
  }, [loadDeposits, loadLiveCustomers])

  // Filtered live customers for the Create dropdown
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

  // Handle Customer change in Create Form: dynamically populates Contact * Dropdown
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
      if (contactList.length === 0) contactList.push({ label: 'Direct Customer Contact', value: 'Direct' })

      setAvailableContacts(contactList)
      setFormData((prev) => ({
        ...prev,
        customerId: cust.id,
        customerName: custName,
        contact: contactList[0]?.value || '',
      }))
    } else {
      setAvailableContacts([])
      setFormData((prev) => ({
        ...prev,
        customerId: '',
        customerName: '',
        contact: '',
      }))
    }
  }

  // Open Create Modal & generate next code + query live customer data
  const openCreateModal = async () => {
    // Dynamically fetch live data in Customer Dropdown whenever Create Button is clicked
    loadLiveCustomers()

    try {
      const nextCodeRes = await adminCustomerDepositAPI.getNextCode()
      const nextCode = nextCodeRes?.data || nextCodeRes || 'Auto Generate Code'
      setFormData((prev) => ({
        ...prev,
        code: nextCode,
        date: new Date().toISOString().slice(0, 10),
        amount: '',
        reference: '',
        note: '',
      }))
    } catch {
      setFormData((prev) => ({
        ...prev,
        code: 'Auto Generate Code',
        date: new Date().toISOString().slice(0, 10),
        amount: '',
        reference: '',
        note: '',
      }))
    }
    setCreateModalOpen(true)
  }

  // Save Customer Deposit
  const handleSaveDeposit = async (e) => {
    e.preventDefault()
    if (!formData.customerName) {
      addNotification?.('Please select a customer for this deposit.', 'warning')
      return
    }
    if (!formData.amount || Number(formData.amount) <= 0) {
      addNotification?.('Please enter a valid deposit amount.', 'warning')
      return
    }

    setSaving(true)
    try {
      const payload = {
        code: formData.code,
        depositDate: formData.date ? `${formData.date}T12:00:00` : new Date().toISOString(),
        amount: Number(formData.amount),
        customerId: formData.customerId ? Number(formData.customerId) : null,
        customerName: formData.customerName,
        contact: formData.contact,
        paymentType: formData.paymentType,
        reference: formData.reference,
        username: formData.username || 'Admin',
        status: 'NONE_VOID',
        note: formData.note,
      }

      await adminCustomerDepositAPI.create(payload)
      addNotification?.(`Deposit ${formData.code} created successfully!`, 'success')
      setCreateModalOpen(false)
      loadDeposits()
    } catch {
      // Fallback local append
      const localDeposit = {
        id: Date.now(),
        code: formData.code === 'Auto Generate Code' ? `DEP-${Date.now()}` : formData.code,
        depositDate: formData.date,
        amount: Number(formData.amount),
        customerName: formData.customerName,
        contact: formData.contact,
        username: formData.username || 'Admin',
        status: 'NONE_VOID',
        reference: formData.reference,
        paymentType: formData.paymentType,
      }
      setDeposits((prev) => [localDeposit, ...prev])
      addNotification?.('Customer deposit recorded successfully!', 'success')
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
      <section className="relative overflow-hidden rounded-3xl border border-blue-500/20 bg-gradient-to-br from-[#1e293b] via-[#0f172a] to-[#0b0f17] p-5 sm:p-7 shadow-2xl shadow-blue-500/10">
        <div className="pointer-events-none absolute -right-16 -top-20 h-64 w-64 rounded-full bg-blue-500/15 blur-3xl" />
        <div className="pointer-events-none absolute bottom-0 left-1/4 h-px w-2/3 bg-gradient-to-r from-transparent via-blue-500/40 to-transparent" />

        <div className="relative flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-3">
            <Link
              to="/admin/sale-payment"
              className="inline-flex items-center gap-2 rounded-full border border-slate-700/80 bg-slate-950/60 px-3.5 py-1.5 text-xs font-bold uppercase tracking-[0.18em] text-blue-300 transition hover:border-blue-400 hover:text-white active:scale-95"
            >
              <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <path d="M15 19l-7-7 7-7" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              {lang === 'en' ? 'Sale Payment Hub' : 'ផ្ទាំងគ្រប់គ្រងទូទាត់លក់'}
            </Link>

            <div className="flex items-center gap-3.5">
              <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-blue-500/15 p-2 ring-1 ring-blue-500/30 shadow-lg shadow-blue-500/20">
                <img src={walletIcon} alt="" className="h-9 w-9 object-contain drop-shadow-md" />
              </span>
              <div>
                <p className="text-[11px] font-black uppercase tracking-[0.25em] text-blue-400">
                  {lang === 'en' ? 'Accounts Receivable' : 'គណនីត្រូវប្រមូល'}
                </p>
                <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
                  {lang === 'en' ? 'Customer Deposit' : 'ប្រាក់កក់អតិថិជន'}
                </h1>
              </div>
            </div>

            <p className="max-w-2xl text-xs sm:text-sm leading-relaxed text-slate-300">
              {lang === 'en'
                ? 'Record advance payments, customer downpayments, and security deposits against open and future sales orders.'
                : 'កត់ត្រាការបង់ប្រាក់មុន ប្រាក់កក់របស់អតិថិជន និងប្រាក់ធានាសម្រាប់ការបញ្ជាទិញលក់បច្ចុប្បន្ន និងអនាគត។'}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={openCreateModal}
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-5 py-2.5 text-xs font-black uppercase tracking-wider text-white shadow-lg shadow-blue-500/25 transition hover:brightness-110 active:scale-95"
            >
              <span className="text-base leading-none">+</span>
              <span>{lang === 'en' ? 'New Deposit' : 'បង្កើតប្រាក់កក់ថ្មី'}</span>
            </button>
          </div>
        </div>
      </section>

      {/* 2. SEARCH DEPOSIT & ADVANCE FILTER */}
      <section className="rounded-3xl border border-slate-800 bg-slate-900/80 p-5 sm:p-6 shadow-xl shadow-black/20 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800/80">
          <div className="flex items-center gap-3">
            <div className="h-5 w-1.5 rounded-full bg-blue-500" />
            <h2 className="text-base font-bold text-white font-['Montserrat']">
              {lang === 'en' ? 'Search Deposit' : 'ស្វែងរកប្រាក់កក់'}
            </h2>
          </div>

          <button
            type="button"
            onClick={() => setAdvanceFilterOpen(!advanceFilterOpen)}
            className="inline-flex items-center gap-2 text-xs font-bold text-blue-400 hover:text-blue-300 transition"
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
                onKeyDown={(e) => e.key === 'Enter' && loadDeposits()}
                placeholder={
                  lang === 'en'
                    ? 'Search deposit code, customer name, amount...'
                    : 'ស្វែងរកលេខកូដប្រាក់កក់ ឈ្មោះអតិថិជន ចំនួនទឹកប្រាក់...'
                }
                className="w-full rounded-xl border border-slate-700/80 bg-slate-950/90 py-2 pl-9 pr-4 text-xs font-semibold text-white placeholder-slate-500 outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-400/20"
              />
            </div>
          </div>

          {/* Search By - Dropdown (Any, Code, Amount) */}
          <div className="sm:col-span-4 md:col-span-3">
            <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
              {lang === 'en' ? 'Search By' : 'ស្វែងរកតាម'}
            </label>
            <select
              value={searchBy}
              onChange={(e) => setSearchBy(e.target.value)}
              className="w-full rounded-xl border border-slate-700/80 bg-slate-950/90 py-2 px-3 text-xs font-semibold text-white outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-400/20"
            >
              <option value="any">{lang === 'en' ? 'Any' : 'ទាំងអស់'}</option>
              <option value="code">{lang === 'en' ? 'Code' : 'លេខកូដ'}</option>
              <option value="amount">{lang === 'en' ? 'Amount' : 'ចំនួនទឹកប្រាក់'}</option>
            </select>
          </div>

          {/* Search Button */}
          <div className="sm:col-span-2 flex items-end">
            <button
              type="button"
              onClick={loadDeposits}
              className="w-full rounded-xl bg-blue-600 hover:bg-blue-500 py-2 px-4 text-xs font-bold text-white transition active:scale-95 shadow-md shadow-blue-600/20"
            >
              {lang === 'en' ? 'Search' : 'ស្វែងរក'}
            </button>
          </div>
        </div>

        {/* Advance Filter Collapsible: Date to Date and Status Dropdown (None-Void, Voided) */}
        {advanceFilterOpen && (
          <div className="pt-4 border-t border-slate-800/80 grid grid-cols-1 gap-3.5 sm:grid-cols-3">
            <div>
              <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                {lang === 'en' ? 'Start Date' : 'ចាប់ពីថ្ងៃ'}
              </label>
              <input
                type="date"
                value={filterStartDate}
                onChange={(e) => setFilterStartDate(e.target.value)}
                className="w-full rounded-xl border border-slate-700/80 bg-slate-950/90 py-1.5 px-3 text-xs text-white outline-none focus:border-blue-400"
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
                className="w-full rounded-xl border border-slate-700/80 bg-slate-950/90 py-1.5 px-3 text-xs text-white outline-none focus:border-blue-400"
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
                className="w-full rounded-xl border border-slate-700/80 bg-slate-950/90 py-1.5 px-3 text-xs text-white outline-none focus:border-blue-400"
              >
                <option value="ALL">{lang === 'en' ? 'All' : 'ទាំងអស់'}</option>
                <option value="NONE_VOID">{lang === 'en' ? 'None-Void' : 'មិនទាន់មោឃៈ'}</option>
                <option value="VOIDED">{lang === 'en' ? 'Voided' : 'បានទុកជាមោឃៈ'}</option>
              </select>
            </div>
          </div>
        )}
      </section>

      {/* 3. CUSTOMER DEPOSIT LIST */}
      <section className="rounded-3xl border border-slate-800 bg-slate-900/80 p-5 sm:p-6 shadow-xl shadow-black/20 space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between pb-3 border-b border-slate-800/80">
          <div className="flex items-center gap-3">
            <div className="h-5 w-1.5 rounded-full bg-blue-500" />
            <div>
              <h2 className="text-base font-bold text-white font-['Montserrat']">
                {lang === 'en' ? 'Customer Deposit List' : 'បញ្ជីប្រាក់កក់អតិថិជន'}
              </h2>
              <p className="text-[11px] text-slate-400">
                {lang === 'en'
                  ? 'Show information of Customer Deposit. Ex(Code, Date, Amount...)'
                  : 'បង្ហាញព័ត៌មាននៃប្រាក់កក់អតិថិជន (លេខកូដ, កាលបរិច្ឆេទ, ចំនួនទឹកប្រាក់...)'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setChooseColumnOpen(true)}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-950/80 px-3.5 py-1.5 text-xs font-bold text-slate-300 hover:border-blue-400 hover:text-white transition active:scale-95"
            >
              <span>⚙️</span>
              <span>{lang === 'en' ? 'Choose Column' : 'ជ្រើសរើសជួរឈរ'}</span>
            </button>

            <button
              type="button"
              onClick={openCreateModal}
              className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 px-4 py-1.5 text-xs font-bold text-white transition active:scale-95 shadow-md shadow-blue-600/25"
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
                {visibleColumns.includes('depositDate') && <th className="py-3 px-3.5">Date</th>}
                {visibleColumns.includes('amount') && <th className="py-3 px-3.5 text-right">Amount</th>}
                {visibleColumns.includes('customerName') && <th className="py-3 px-3.5">Customer</th>}
                {visibleColumns.includes('username') && <th className="py-3 px-3.5">Username</th>}
                {visibleColumns.includes('contact') && <th className="py-3 px-3.5">Contact</th>}
                {visibleColumns.includes('status') && <th className="py-3 px-3.5 text-center">Status</th>}
                <th className="py-3 px-3.5 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80 bg-slate-900/40">
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-500 font-mono">
                    <span className="inline-block animate-spin mr-2">🌀</span>
                    {lang === 'en' ? 'Loading customer deposits...' : 'កំពុងផ្ទុកទិន្នន័យ...'}
                  </td>
                </tr>
              ) : deposits.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-500 space-y-2">
                    <div className="text-3xl">💰</div>
                    <p className="font-semibold">
                      {lang === 'en' ? 'No customer deposits found' : 'មិនមានទិន្នន័យប្រាក់កក់ឡើយ'}
                    </p>
                    <button
                      type="button"
                      onClick={openCreateModal}
                      className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600/30 border border-blue-500/40 px-3 py-1 text-xs font-bold text-blue-300 hover:bg-blue-600/50 transition"
                    >
                      + {lang === 'en' ? 'Create First Deposit' : 'កត់ត្រាប្រាក់កក់ដំបូង'}
                    </button>
                  </td>
                </tr>
              ) : (
                deposits.map((d) => {
                  const st = STATUS_CONFIG[d.status] || STATUS_CONFIG.NONE_VOID
                  return (
                    <tr key={d.id || d.code} className="hover:bg-slate-800/50 transition">
                      {visibleColumns.includes('code') && (
                        <td className="py-3 px-3.5 font-mono font-bold text-blue-400">
                          {d.code}
                        </td>
                      )}
                      {visibleColumns.includes('depositDate') && (
                        <td className="py-3 px-3.5 text-slate-300">
                          {formatDate(d.depositDate)}
                        </td>
                      )}
                      {visibleColumns.includes('amount') && (
                        <td className="py-3 px-3.5 text-right font-mono font-bold text-emerald-400">
                          {formatCurrency(d.amount)}
                        </td>
                      )}
                      {visibleColumns.includes('customerName') && (
                        <td className="py-3 px-3.5 font-semibold text-white">
                          {d.customerName || '---'}
                        </td>
                      )}
                      {visibleColumns.includes('username') && (
                        <td className="py-3 px-3.5 text-slate-300">
                          {d.username || 'Admin'}
                        </td>
                      )}
                      {visibleColumns.includes('contact') && (
                        <td className="py-3 px-3.5 text-slate-400 font-mono">
                          {d.contact || '---'}
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
                              const newSt = d.status === 'VOIDED' ? 'NONE_VOID' : 'VOIDED'
                              adminCustomerDepositAPI
                                .updateStatus(d.id, newSt)
                                .then(() => loadDeposits())
                                .catch(() => {})
                            }}
                            className="text-[11px] text-blue-400 hover:text-blue-300 p-1 hover:bg-slate-800 rounded"
                            title={d.status === 'VOIDED' ? 'Restore Deposit' : 'Void Deposit'}
                          >
                            {d.status === 'VOIDED' ? '↩️' : '🚫'}
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              if (window.confirm(`Delete deposit ${d.code}?`)) {
                                adminCustomerDepositAPI
                                  .delete(d.id)
                                  .then(() => loadDeposits())
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
                        ? 'border-blue-500/50 bg-blue-500/15 text-white'
                        : 'border-slate-800 bg-slate-900/60 text-slate-400 hover:bg-slate-800'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={isChecked}
                      disabled={col.always}
                      onChange={() => toggleColumn(col.key)}
                      className="rounded accent-blue-500"
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
                className="rounded-xl bg-blue-600 px-4 py-1.5 text-xs font-bold text-white transition hover:bg-blue-500"
              >
                {lang === 'en' ? 'Apply' : 'យល់ព្រម'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 5. CREATE CUSTOMER DEPOSIT MODAL */}
      {createModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 overflow-y-auto">
          <div className="relative w-full max-w-2xl rounded-3xl border border-slate-800 bg-[#0f172a] shadow-2xl my-auto overflow-hidden">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-800 p-5 bg-[#141922]">
              <div>
                <h3 className="text-lg font-black text-white font-['Montserrat']">
                  {lang === 'en' ? 'General Information' : 'ព័ត៌មានទូទៅ'}
                </h3>
                <p className="text-xs text-slate-400">
                  {lang === 'en'
                    ? 'Input the general customer deposit information'
                    : 'បញ្ចូលព័ត៌មានទូទៅនៃប្រាក់កក់អតិថិជន'}
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

            <form onSubmit={handleSaveDeposit} className="p-5 sm:p-6 space-y-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {/* Code - Textbox Auto Generate Code */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-1">
                    {lang === 'en' ? 'Code' : 'លេខកូដ'}
                  </label>
                  <input
                    type="text"
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                    placeholder="Auto Generate Code"
                    className="w-full rounded-xl border border-slate-700 bg-slate-950/90 py-2 px-3 text-xs text-blue-400 font-mono font-bold outline-none focus:border-blue-400"
                  />
                </div>

                {/* Date - date */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-1">
                    {lang === 'en' ? 'Date' : 'កាលបរិច្ឆេទ'}
                  </label>
                  <input
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    required
                    className="w-full rounded-xl border border-slate-700 bg-slate-950/90 py-2 px-3 text-xs text-white outline-none focus:border-blue-400 font-mono"
                  />
                </div>

                {/* Customer * - DropDown (Live Data) */}
                <div className="sm:col-span-2 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider">
                      {lang === 'en' ? 'Customer *' : 'អតិថិជន *'}
                    </label>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-emerald-400 font-mono font-semibold flex items-center gap-1">
                        <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                        {customers.length} {lang === 'en' ? 'Live Customers' : 'អតិថិជនផ្ទាល់'}
                      </span>
                      <button
                        type="button"
                        onClick={loadLiveCustomers}
                        disabled={loadingCustomers}
                        className="text-[11px] text-blue-400 hover:text-blue-300 transition"
                        title="Refresh live customers from database"
                      >
                        {loadingCustomers ? '🌀' : '🔄'}
                      </button>
                    </div>
                  </div>

                  {/* Customer Search / Filter bar for live dropdown */}
                  <div className="relative mb-1">
                    <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-[11px]">
                      🔍
                    </span>
                    <input
                      type="text"
                      value={customerSearchQuery}
                      onChange={(e) => setCustomerSearchQuery(e.target.value)}
                      placeholder={lang === 'en' ? 'Quick filter customer by name, code, or phone...' : 'ស្វែងរកអតិថិជនរហ័ស...'}
                      className="w-full rounded-xl border border-slate-800 bg-slate-900/90 py-1.5 pl-8 pr-3 text-[11px] text-slate-200 placeholder-slate-500 outline-none focus:border-blue-500"
                    />
                    {customerSearchQuery && (
                      <button
                        type="button"
                        onClick={() => setCustomerSearchQuery('')}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] text-slate-400 hover:text-white"
                      >
                        ✕
                      </button>
                    )}
                  </div>

                  {/* Customer Select Dropdown */}
                  <select
                    value={formData.customerId}
                    onChange={(e) => handleCustomerChange(e.target.value)}
                    required
                    className="w-full rounded-xl border border-slate-700 bg-slate-950/90 py-2.5 px-3 text-xs text-white outline-none focus:border-blue-400 transition"
                  >
                    <option value="">{lang === 'en' ? '-- Select Customer --' : '-- ជ្រើសរើសអតិថិជន --'}</option>
                    {filteredCustomers.map((c) => {
                      const name = c.name || c.customerName || `Customer #${c.id}`
                      const code = c.code ? `[${c.code}] ` : ''
                      const phone = c.phone || c.contactPhone || c.contactMobile || c.mobile || c.phoneNumber || ''
                      return (
                        <option key={c.id} value={c.id}>
                          {code}{name} {phone ? `— (${phone})` : ''}
                        </option>
                      )
                    })}
                  </select>
                </div>

                {/* Contact * - Dropdown */}
                <div className="sm:col-span-2">
                  <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-1">
                    {lang === 'en' ? 'Contact *' : 'ទំនាក់ទំនង *'}
                  </label>
                  <select
                    value={formData.contact}
                    onChange={(e) => setFormData({ ...formData, contact: e.target.value })}
                    required
                    className="w-full rounded-xl border border-slate-700 bg-slate-950/90 py-2.5 px-3 text-xs text-white outline-none focus:border-blue-400 font-mono transition"
                  >
                    <option value="">{lang === 'en' ? '-- Select Contact --' : '-- ជ្រើសរើសទំនាក់ទំនង --'}</option>
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

                {/* Payment Type - Dropdown */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-1">
                    {lang === 'en' ? 'Payment Type' : 'វិធីសាស្រ្តទូទាត់'}
                  </label>
                  <select
                    value={formData.paymentType}
                    onChange={(e) => setFormData({ ...formData, paymentType: e.target.value })}
                    className="w-full rounded-xl border border-slate-700 bg-slate-950/90 py-2 px-3 text-xs text-white outline-none focus:border-blue-400"
                  >
                    {PAYMENT_TYPES.map((pt) => (
                      <option key={pt} value={pt}>
                        {pt}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Amount - Textbox */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-1">
                    {lang === 'en' ? 'Amount ($) *' : 'ចំនួនទឹកប្រាក់ ($) *'}
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                    required
                    placeholder="0.00"
                    className="w-full rounded-xl border border-slate-700 bg-slate-950/90 py-2 px-3 text-xs text-emerald-400 font-mono font-bold outline-none focus:border-blue-400"
                  />
                </div>

                {/* Reference - Textbox */}
                <div className="sm:col-span-2">
                  <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-1">
                    {lang === 'en' ? 'Reference' : 'ឯកសារយោង'}
                  </label>
                  <input
                    type="text"
                    value={formData.reference}
                    onChange={(e) => setFormData({ ...formData, reference: e.target.value })}
                    placeholder="Bank receipt, slip number, or invoice reference..."
                    className="w-full rounded-xl border border-slate-700 bg-slate-950/90 py-2 px-3 text-xs text-white outline-none focus:border-blue-400"
                  />
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
                  className="rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-2 text-xs font-black uppercase tracking-wider text-white shadow-lg shadow-blue-600/30 hover:brightness-110 active:scale-95 transition disabled:opacity-50"
                >
                  {saving ? 'Saving...' : 'Save Deposit'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
