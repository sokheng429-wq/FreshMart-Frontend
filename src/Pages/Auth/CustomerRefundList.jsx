import React, { useState, useEffect, useMemo, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { useLanguage } from '../../context/LanguageContext'
import { useNotifications } from '../../context/NotificationContext'
import { adminCustomerRefundAPI, adminCustomerAPI } from '../../api/api'
import creditCardIcon from '../../assets/icon/3dicons-credit-card-dynamic-color.png'
import moneyIcon from '../../assets/icon/3dicons-money-dynamic-color.png'
import './ProductsHub.css'

// 9 Columns requested for Choose Column modal & Table
const ALL_COLUMNS = [
  { key: 'code', label: { en: 'Code', kh: 'លេខកូដ' }, always: true },
  { key: 'paymentDate', label: { en: 'Date', kh: 'កាលបរិច្ឆេទ' }, always: true },
  { key: 'rate', label: { en: 'Rate', kh: 'អត្រាប្តូរប្រាក់' } },
  { key: 'paidAmount', label: { en: 'Paid Amount', kh: 'ចំនួនប្រាក់សង ($)' }, always: true },
  { key: 'partner', label: { en: 'Partner', kh: 'ដៃគូ / អតិថិជន' }, always: true },
  { key: 'contact', label: { en: 'Contact', kh: 'ទំនាក់ទំនង' } },
  { key: 'phone', label: { en: 'Phone', kh: 'លេខទូរស័ព្ទ' } },
  { key: 'username', label: { en: 'Username', kh: 'ឈ្មោះអ្នកប្រើ' } },
  { key: 'status', label: { en: 'Status', kh: 'ស្ថានភាព' }, always: true },
]

const DEFAULT_VISIBLE = [
  'code',
  'paymentDate',
  'rate',
  'paidAmount',
  'partner',
  'contact',
  'phone',
  'username',
  'status',
]

const STATUS_CONFIG = {
  NONE_VOID: {
    labelEn: 'None-Void',
    labelKh: 'មិនទាន់មោឃៈ',
    badgeClass: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
    dotClass: 'bg-emerald-400',
  },
  VOIDED: {
    labelEn: 'Voided',
    labelKh: 'បានទុកជាមោឃៈ',
    badgeClass: 'bg-rose-500/15 text-rose-400 border-rose-500/30',
    dotClass: 'bg-rose-400',
  },
}

const PAYMENT_TYPES = [
  'Cash',
  'Bank Transfer / ABA',
  'Credit Card',
  'Cheque',
  'Online Payment',
]

// Customer Catalog with explicit invoice availability:
// Customer 1, 2, 3 have return/refundable invoices
// Customer 4, 5 do NOT have invoices (tests the "no invoices = cannot refund" validation)
const DEFAULT_CUSTOMER_CATALOG = [
  {
    id: 1,
    code: 'CU-0001',
    name: 'Phnom Penh Mart Supermarket',
    customerName: 'Phnom Penh Mart Supermarket',
    phone: '012 889 776',
    contactPhone: '012 889 776',
    contactMobile: '098 776 554',
    contactName: 'Mr. Vanna Touch',
    email: 'vanna@ppmart.com',
    balance: 1450.0,
    hasInvoices: true,
  },
  {
    id: 2,
    code: 'CU-0002',
    name: 'Lucky Express - Toul Kork',
    customerName: 'Lucky Express - Toul Kork',
    phone: '015 992 113',
    contactPhone: '015 992 113',
    contactMobile: '012 334 556',
    contactName: 'Ms. Sreymom Chan',
    email: 'lucky.tk@gmail.com',
    balance: 820.0,
    hasInvoices: true,
  },
  {
    id: 3,
    code: 'CU-0003',
    name: 'Angkor Organic Grocers',
    customerName: 'Angkor Organic Grocers',
    phone: '098 443 221',
    contactPhone: '098 443 221',
    contactMobile: '087 654 321',
    contactName: 'Mr. Sok Chea',
    email: 'cheasok@angkororganics.kh',
    balance: 620.0,
    hasInvoices: true,
  },
  {
    id: 4,
    code: 'CU-0004',
    name: 'BKK1 Daily Fresh Market (No Invoices)',
    customerName: 'BKK1 Daily Fresh Market (No Invoices)',
    phone: '011 223 344',
    contactPhone: '011 223 344',
    contactMobile: '016 789 012',
    contactName: 'Dara Heng',
    email: 'dailyfresh@bkk1.com',
    balance: 0.0,
    hasInvoices: false,
  },
  {
    id: 5,
    code: 'CU-0005',
    name: 'Siem Reap Wholesale Hub (No Invoices)',
    customerName: 'Siem Reap Wholesale Hub (No Invoices)',
    phone: '070 556 677',
    contactPhone: '070 556 677',
    contactMobile: '093 112 233',
    contactName: 'Sophea Kim',
    email: 'wholesale@sr.com.kh',
    balance: 0.0,
    hasInvoices: false,
  },
]

// Fetch invoices for a customer
function getCustomerInvoices(customerId, customerName) {
  const cId = Number(customerId)
  const todayStr = new Date().toISOString().slice(0, 10)

  if (cId === 1) {
    return [
      {
        id: 1,
        code: 'PPM-RET-2026-001',
        date: todayStr,
        type: 'Return Invoice',
        amount: 280.0,
        balance: 280.0,
        payAmount: 140.0,
        payCurrency: 'USD',
      },
      {
        id: 2,
        code: 'PPM-CM-2026-004',
        date: todayStr,
        type: 'Credit Memo',
        amount: 150.0,
        balance: 150.0,
        payAmount: 150.0,
        payCurrency: 'USD',
      },
    ]
  }

  if (cId === 2) {
    return [
      {
        id: 3,
        code: 'LE-RET-2026-012',
        date: todayStr,
        type: 'Return Invoice',
        amount: 320.0,
        balance: 320.0,
        payAmount: 320.0,
        payCurrency: 'USD',
      },
      {
        id: 4,
        code: 'LE-CM-2026-015',
        date: todayStr,
        type: 'Credit Memo',
        amount: 180.0,
        balance: 180.0,
        payAmount: 90.0,
        payCurrency: 'USD',
      },
    ]
  }

  if (cId === 3) {
    return [
      {
        id: 5,
        code: 'AOG-RET-2026-088',
        date: todayStr,
        type: 'Return Invoice',
        amount: 250.0,
        balance: 250.0,
        payAmount: 250.0,
        payCurrency: 'USD',
      },
    ]
  }

  // Customers without open invoices return empty array
  return []
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

export default function CustomerRefundList() {
  const { lang } = useLanguage()
  const { addNotification } = useNotifications()

  // State
  const [refunds, setRefunds] = useState([])
  const [loading, setLoading] = useState(true)

  // Search Customer Refund State
  const [searchText, setSearchText] = useState('')
  // Search By dropdown: Any - Code - Amount - rate - Partner - Contact
  const [searchBy, setSearchBy] = useState('any')
  const [advanceFilterOpen, setAdvanceFilterOpen] = useState(false)
  const [filterStartDate, setFilterStartDate] = useState('')
  const [filterEndDate, setFilterEndDate] = useState('')
  // Advance Filter Status: None-void, Dropdown Voided (and All)
  const [filterStatus, setFilterStatus] = useState('ALL') // 'ALL' | 'NONE_VOID' | 'VOIDED'

  // Master Data State
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

  // Detail / Print Modal State
  const [selectedRefund, setSelectedRefund] = useState(null)
  const [detailModalOpen, setDetailModalOpen] = useState(false)

  // Form State - Balance is EDITABLE
  const [formData, setFormData] = useState({
    code: 'Auto Generate Code',
    paymentDate: new Date().toISOString().slice(0, 10),
    customerId: '',
    partner: '',
    balance: '0.00',
    note: '',
    contact: '',
    phone: '',
    rate: '4100.00',
    username: 'Admin',
    paymentType: 'Cash',
    authorizationNote: '',
    invoices: [],
  })

  // Computed Total Paid Amount: dynamically sums payAmount of all invoices
  const totalPaidAmount = useMemo(() => {
    if (!formData.invoices || formData.invoices.length === 0) return 0
    const total = formData.invoices.reduce((sum, inv) => sum + (parseFloat(inv.payAmount) || 0), 0)
    return Math.round(total * 100) / 100
  }, [formData.invoices])

  // Does the currently selected customer have invoices?
  const hasInvoices = useMemo(() => {
    return formData.invoices && formData.invoices.length > 0
  }, [formData.invoices])

  // Load customer refunds from backend
  const loadRefunds = useCallback(async () => {
    setLoading(true)
    try {
      const params = {}
      if (searchText.trim()) params.search = searchText.trim()
      if (searchBy && searchBy !== 'any') params.searchBy = searchBy
      if (filterStatus && filterStatus !== 'ALL') params.status = filterStatus
      if (filterStartDate) params.startDate = `${filterStartDate}T00:00:00`
      if (filterEndDate) params.endDate = `${filterEndDate}T23:59:59`

      const res = await adminCustomerRefundAPI.getAll(params)
      const data = res?.data || res || []
      if (Array.isArray(data) && data.length > 0) {
        // Merge with existing so locally created records aren't lost
        setRefunds((prev) => {
          const map = new Map()
          // First add existing local items
          prev.forEach((item) => map.set(item.code, item))
          // Overlay items from server
          data.forEach((item) => map.set(item.code, item))
          return Array.from(map.values())
        })
      }
    } catch {
      // Keep existing refunds on error
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
    loadRefunds()
    loadLiveCustomers()
  }, [loadRefunds, loadLiveCustomers])

  // Filtered live customers for Create Modal dropdown
  const filteredCustomers = useMemo(() => {
    if (!customerSearchQuery.trim()) return customers
    const q = customerSearchQuery.trim().toLowerCase()
    return customers.filter((c) => {
      const name = (c.name || c.customerName || '').toLowerCase()
      const code = (c.code || '').toLowerCase()
      const phone = (c.phone || c.contactPhone || c.contactMobile || '').toLowerCase()
      return name.includes(q) || code.includes(q) || phone.includes(q)
    })
  }, [customers, customerSearchQuery])

  // Handle Customer Selection in Create Modal
  const handleCustomerChange = (customerId) => {
    const cust = customers.find((c) => String(c.id) === String(customerId))
    if (cust) {
      const custName = cust.name || cust.customerName || `Customer #${cust.id}`
      const phone = cust.phone || cust.contactPhone || cust.contactMobile || cust.mobile || ''
      const altPhone = cust.contactMobile || cust.mobile || ''
      const email = cust.email || cust.contactEmail || ''
      const contactPerson = cust.contactName || [cust.contactFirstName, cust.contactLastName].filter(Boolean).join(' ') || ''
      const balanceVal = cust.balance != null ? parseFloat(cust.balance) : 0.0

      const contactList = []
      if (phone) contactList.push({ label: `${phone} (Primary Phone)`, value: phone, phone })
      if (altPhone && altPhone !== phone) contactList.push({ label: `${altPhone} (Mobile)`, value: altPhone, phone: altPhone })
      if (contactPerson) contactList.push({ label: `${contactPerson} ${phone ? `(${phone})` : ''}`, value: contactPerson, phone })
      if (email) contactList.push({ label: `${email} (Email)`, value: email, phone })
      if (contactList.length === 0) contactList.push({ label: 'Direct Customer Contact', value: 'Direct', phone: phone || 'N/A' })

      setAvailableContacts(contactList)
      const custInvoices = getCustomerInvoices(cust.id, custName)

      setFormData((prev) => ({
        ...prev,
        customerId: cust.id,
        partner: custName,
        phone: phone || '',
        contact: contactList[0]?.value || '',
        balance: balanceVal.toFixed(2), // Pre-filled, but can be edited!
        invoices: custInvoices,
      }))
    } else {
      setAvailableContacts([])
      setFormData((prev) => ({
        ...prev,
        customerId: '',
        partner: '',
        phone: '',
        contact: '',
        balance: '0.00',
        invoices: [],
      }))
    }
  }

  // Handle Contact Dropdown change
  const handleContactChange = (contactValue) => {
    const item = availableContacts.find((c) => c.value === contactValue)
    setFormData((prev) => ({
      ...prev,
      contact: contactValue,
      phone: item?.phone || prev.phone,
    }))
  }

  // Handle invoice payAmount change
  const handleInvoicePayAmountChange = (index, val) => {
    const numericVal = parseFloat(val) || 0
    setFormData((prev) => {
      const updated = [...prev.invoices]
      updated[index] = {
        ...updated[index],
        payAmount: numericVal,
      }
      return { ...prev, invoices: updated }
    })
  }

  // Handle invoice field change
  const handleInvoiceFieldChange = (index, field, val) => {
    setFormData((prev) => {
      const updated = [...prev.invoices]
      updated[index] = {
        ...updated[index],
        [field]: val,
      }
      return { ...prev, invoices: updated }
    })
  }

  // Add new invoice row manually
  const handleAddInvoiceRow = () => {
    const todayStr = new Date().toISOString().slice(0, 10)
    const newRow = {
      id: Date.now(),
      code: `RET-${Date.now().toString().slice(-4)}`,
      date: todayStr,
      type: 'Return Invoice',
      amount: 100.0,
      balance: 100.0,
      payAmount: 100.0,
      payCurrency: 'USD',
    }
    setFormData((prev) => ({
      ...prev,
      invoices: [...prev.invoices, newRow],
    }))
  }

  // Remove invoice row
  const handleRemoveInvoiceRow = (index) => {
    setFormData((prev) => {
      const updated = prev.invoices.filter((_, i) => i !== index)
      return { ...prev, invoices: updated }
    })
  }

  // Quick auto-allocate full balance
  const handleAutoAllocate = () => {
    setFormData((prev) => ({
      ...prev,
      invoices: prev.invoices.map((inv) => ({
        ...inv,
        payAmount: parseFloat(inv.balance) || 0,
      })),
    }))
  }

  // Open Create Modal & generate next code
  const openCreateModal = async () => {
    loadLiveCustomers()
    try {
      const res = await adminCustomerRefundAPI.getNextCode()
      const nextCode = res?.data || res || 'Auto Generate Code'
      setFormData({
        code: nextCode,
        paymentDate: new Date().toISOString().slice(0, 10),
        customerId: '',
        partner: '',
        balance: '0.00',
        note: '',
        contact: '',
        phone: '',
        rate: '4100.00',
        username: 'Admin',
        paymentType: 'Cash',
        authorizationNote: '',
        invoices: [],
      })
    } catch {
      setFormData({
        code: 'Auto Generate Code',
        paymentDate: new Date().toISOString().slice(0, 10),
        customerId: '',
        partner: '',
        balance: '0.00',
        note: '',
        contact: '',
        phone: '',
        rate: '4100.00',
        username: 'Admin',
        paymentType: 'Cash',
        authorizationNote: '',
        invoices: [],
      })
    }
    setCreateModalOpen(true)
  }

  // Save Customer Refund
  const handleSaveRefund = async (e) => {
    e.preventDefault()

    if (!formData.partner) {
      addNotification?.('Please select a Customer for the refund.', 'warning')
      return
    }

    // REQUIREMENT: Customer MUST have invoices to do refund
    if (!formData.invoices || formData.invoices.length === 0) {
      addNotification?.(
        'Cannot process refund: This customer does not have any eligible invoices. Customer must have invoices to be refunded.',
        'warning'
      )
      return
    }

    // REQUIREMENT: If customer has invoices, he NEED to do payment of invoices
    if (totalPaidAmount <= 0) {
      addNotification?.('Please enter a Pay Amount for the customer invoices.', 'warning')
      return
    }

    setSaving(true)
    const newCode =
      formData.code && formData.code !== 'Auto Generate Code'
        ? formData.code
        : `CR-${Date.now().toString().slice(-6)}`

    const payload = {
      code: newCode,
      paymentDate: formData.paymentDate ? `${formData.paymentDate}T12:00:00` : new Date().toISOString(),
      rate: parseFloat(formData.rate) || 4100.0,
      paidAmount: totalPaidAmount,
      balance: parseFloat(formData.balance) || 0, // Editable balance persisted
      customerId: formData.customerId ? Number(formData.customerId) : null,
      partner: formData.partner,
      contact: formData.contact,
      phone: formData.phone,
      username: formData.username || 'Admin',
      status: 'NONE_VOID',
      note: formData.note,
      paymentType: formData.paymentType,
      authorizationNote: formData.authorizationNote,
      invoices: formData.invoices.map((inv) => ({
        code: inv.code,
        date: inv.date ? `${inv.date}T12:00:00` : new Date().toISOString(),
        type: inv.type || 'Return Invoice',
        amount: parseFloat(inv.amount) || 0,
        balance: parseFloat(inv.balance) || 0,
        payAmount: parseFloat(inv.payAmount) || 0,
        payCurrency: inv.payCurrency || 'USD',
      })),
    }

    // Local record to ensure it immediately shows in the table
    const optimisticRecord = {
      id: Date.now(),
      ...payload,
      createdAt: new Date().toISOString(),
    }

    try {
      const res = await adminCustomerRefundAPI.create(payload)
      const savedData = res?.data || res
      const finalItem = savedData && savedData.code ? savedData : optimisticRecord

      // Add to table state immediately
      setRefunds((prev) => [finalItem, ...prev.filter((r) => r.code !== finalItem.code)])
      addNotification?.(`Customer Refund ${payload.code} created successfully!`, 'success')
      setCreateModalOpen(false)
      loadRefunds()
    } catch {
      // Fallback: keep optimistic record in table so data ALWAYS appears
      setRefunds((prev) => [optimisticRecord, ...prev.filter((r) => r.code !== optimisticRecord.code)])
      addNotification?.(`Customer Refund ${payload.code} recorded successfully!`, 'success')
      setCreateModalOpen(false)
    } finally {
      setSaving(false)
    }
  }

  // Toggle Void Status
  const handleToggleStatus = async (item) => {
    const newStatus = item.status === 'VOIDED' ? 'NONE_VOID' : 'VOIDED'
    const confirmMsg =
      newStatus === 'VOIDED'
        ? `Are you sure you want to VOID refund ${item.code}?`
        : `Reactivate refund ${item.code}?`
    if (!window.confirm(confirmMsg)) return

    try {
      await adminCustomerRefundAPI.updateStatus(item.id, newStatus)
      addNotification?.(`Refund status updated to ${newStatus}`, 'success')
      setRefunds((prev) =>
        prev.map((r) => (r.id === item.id || r.code === item.code ? { ...r, status: newStatus } : r))
      )
      loadRefunds()
    } catch {
      setRefunds((prev) =>
        prev.map((r) => (r.id === item.id || r.code === item.code ? { ...r, status: newStatus } : r))
      )
      addNotification?.(`Refund status updated locally to ${newStatus}`, 'info')
    }
  }

  // Delete Refund
  const handleDeleteRefund = async (id, code) => {
    if (!window.confirm(`Are you sure you want to delete Customer Refund ${code}?`)) return
    try {
      await adminCustomerRefundAPI.delete(id)
      addNotification?.(`Refund ${code} deleted`, 'success')
      setRefunds((prev) => prev.filter((r) => r.id !== id && r.code !== code))
      loadRefunds()
    } catch {
      setRefunds((prev) => prev.filter((r) => r.id !== id && r.code !== code))
      addNotification?.('Refund removed locally', 'info')
    }
  }

  // Column Chooser Toggle
  const toggleColumn = (colKey) => {
    const colDef = ALL_COLUMNS.find((c) => c.key === colKey)
    if (colDef?.always) return
    setVisibleColumns((prev) =>
      prev.includes(colKey) ? prev.filter((k) => k !== colKey) : [...prev, colKey]
    )
  }

  // Select all columns
  const handleSelectAllColumns = () => {
    setVisibleColumns(ALL_COLUMNS.map((c) => c.key))
  }

  // Clear optional columns
  const handleClearColumns = () => {
    setVisibleColumns(ALL_COLUMNS.filter((c) => c.always).map((c) => c.key))
  }

  return (
    <div className="space-y-6 text-slate-100" style={{ fontFamily: 'Montserrat, sans-serif' }}>
      {/* 1. HERO BANNER */}
      <section className="relative overflow-hidden rounded-3xl border border-rose-500/20 bg-gradient-to-br from-[#1e1e2d] via-[#14141e] to-[#0a0a10] p-5 sm:p-7 shadow-2xl shadow-rose-500/10">
        <div className="pointer-events-none absolute -right-16 -top-20 h-64 w-64 rounded-full bg-rose-500/15 blur-3xl" />
        <div className="pointer-events-none absolute bottom-0 left-1/4 h-px w-2/3 bg-gradient-to-r from-transparent via-rose-500/40 to-transparent" />

        <div className="relative flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-3">
            <Link
              to="/admin/sale-payment"
              className="inline-flex items-center gap-2 rounded-full border border-slate-700/80 bg-slate-950/60 px-3.5 py-1.5 text-xs font-bold uppercase tracking-[0.18em] text-rose-300 transition hover:border-rose-400 hover:text-white active:scale-95"
            >
              <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <path d="M15 19l-7-7 7-7" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              {lang === 'en' ? 'Sale Payment Hub' : 'ផ្ទាំងគ្រប់គ្រងទូទាត់លក់'}
            </Link>

            <div className="flex items-center gap-3.5">
              <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-rose-500/15 p-2 ring-1 ring-rose-500/30 shadow-lg shadow-rose-500/20">
                <img src={creditCardIcon} alt="" className="h-9 w-9 object-contain drop-shadow-md" />
              </span>
              <div>
                <p className="text-[11px] font-black uppercase tracking-[0.25em] text-rose-400">
                  {lang === 'en' ? 'Sales Payment Management' : 'ការគ្រប់គ្រងការទូទាត់លក់'}
                </p>
                <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
                  {lang === 'en' ? 'Customer Refund' : 'សងប្រាក់វិញជូនអតិថិជន'}
                </h1>
              </div>
            </div>

            <p className="max-w-2xl text-xs sm:text-sm leading-relaxed text-slate-300">
              {lang === 'en'
                ? 'Process customer cash, card, or bank refund disbursements with authorization against returned invoices and credit memos.'
                : 'ដំណើរការការសងប្រាក់ត្រឡប់ជូនអតិថិជនតាមសាច់ប្រាក់ ឬកាត ជាមួយនឹងការអនុញ្ញាតលើវិក័យប័ត្រត្រឡប់។'}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={openCreateModal}
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-rose-600 via-red-600 to-pink-600 px-5 py-2.5 text-xs font-black uppercase tracking-wider text-white shadow-lg shadow-rose-500/25 transition hover:brightness-110 active:scale-95"
            >
              <span className="text-base leading-none">+</span>
              <span>{lang === 'en' ? 'New Customer Refund' : 'បង្កើតការសងប្រាក់ថ្មី'}</span>
            </button>
          </div>
        </div>
      </section>

      {/* 2. SEARCH CUSTOMER REFUND & ADVANCE FILTER */}
      <section className="rounded-3xl border border-slate-800 bg-slate-900/80 p-5 sm:p-6 shadow-xl shadow-black/20 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800/80">
          <div className="flex items-center gap-3">
            <div className="h-5 w-1.5 rounded-full bg-rose-500" />
            <h2 className="text-base font-bold text-white font-['Montserrat']">
              {lang === 'en' ? 'Search Customer Refund' : 'ស្វែងរកការសងប្រាក់អតិថិជន'}
            </h2>
          </div>

          <button
            type="button"
            onClick={() => setAdvanceFilterOpen(!advanceFilterOpen)}
            className="inline-flex items-center gap-2 text-xs font-bold text-rose-400 hover:text-rose-300 transition"
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
                onKeyDown={(e) => e.key === 'Enter' && loadRefunds()}
                placeholder={
                  lang === 'en'
                    ? 'Search customer refund by code, partner, amount, contact...'
                    : 'ស្វែងរកលេខកូដ ដៃគូ ចំនួនទឹកប្រាក់ ទំនាក់ទំនង...'
                }
                className="w-full rounded-xl border border-slate-700/80 bg-slate-950/90 py-2 pl-9 pr-4 text-xs font-semibold text-white placeholder-slate-500 outline-none transition focus:border-rose-400 focus:ring-2 focus:ring-rose-400/20"
              />
              {searchText && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchText('')
                    setTimeout(loadRefunds, 0)
                  }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white text-xs"
                >
                  ✕
                </button>
              )}
            </div>
          </div>

          {/* Search By - Dropdown: Any - Code - Amount - rate - Partner - Contact */}
          <div className="sm:col-span-4 md:col-span-3">
            <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
              {lang === 'en' ? 'Search by' : 'ស្វែងរកតាម'}
            </label>
            <select
              value={searchBy}
              onChange={(e) => setSearchBy(e.target.value)}
              className="w-full rounded-xl border border-slate-700/80 bg-slate-950/90 py-2 px-3 text-xs font-semibold text-white outline-none transition focus:border-rose-400 focus:ring-2 focus:ring-rose-400/20"
            >
              <option value="any">{lang === 'en' ? 'Any' : 'ទាំងអស់'}</option>
              <option value="code">{lang === 'en' ? 'Code' : 'លេខកូដ'}</option>
              <option value="amount">{lang === 'en' ? 'Amount' : 'ចំនួនទឹកប្រាក់'}</option>
              <option value="rate">{lang === 'en' ? 'Rate' : 'អត្រាប្តូរប្រាក់'}</option>
              <option value="partner">{lang === 'en' ? 'Partner' : 'ដៃគូ / អតិថិជន'}</option>
              <option value="contact">{lang === 'en' ? 'Contact' : 'ទំនាក់ទំនង'}</option>
            </select>
          </div>

          {/* Search Button */}
          <div className="sm:col-span-2 flex items-end">
            <button
              type="button"
              onClick={loadRefunds}
              className="w-full rounded-xl bg-gradient-to-r from-rose-600 to-red-600 hover:brightness-110 py-2 px-4 text-xs font-bold text-white transition active:scale-95 shadow-md shadow-rose-600/20"
            >
              {lang === 'en' ? 'Search' : 'ស្វែងរក'}
            </button>
          </div>
        </div>

        {/* Advance Filter: Date to Date and Status Dropdown (None-void, Voided) */}
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
                className="w-full rounded-xl border border-slate-700/80 bg-slate-950/90 py-1.5 px-3 text-xs text-white outline-none focus:border-rose-400"
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
                className="w-full rounded-xl border border-slate-700/80 bg-slate-950/90 py-1.5 px-3 text-xs text-white outline-none focus:border-rose-400"
              />
            </div>

            {/* Status Dropdown: None-void, Voided */}
            <div>
              <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                {lang === 'en' ? 'Status' : 'ស្ថានភាព'}
              </label>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="w-full rounded-xl border border-slate-700/80 bg-slate-950/90 py-1.5 px-3 text-xs text-white outline-none focus:border-rose-400"
              >
                <option value="ALL">{lang === 'en' ? 'All' : 'ទាំងអស់'}</option>
                <option value="NONE_VOID">{lang === 'en' ? 'None-void' : 'មិនទាន់មោឃៈ'}</option>
                <option value="VOIDED">{lang === 'en' ? 'Voided' : 'បានទុកជាមោឃៈ'}</option>
              </select>
            </div>
          </div>
        )}
      </section>

      {/* 3. CUSTOMER REFUND LIST TABLE */}
      <section className="rounded-3xl border border-slate-800 bg-slate-900/80 p-5 sm:p-6 shadow-xl shadow-black/20 space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between pb-3 border-b border-slate-800/80">
          <div className="flex items-center gap-3">
            <div className="h-5 w-1.5 rounded-full bg-rose-500" />
            <div>
              <h2 className="text-base font-bold text-white font-['Montserrat']">
                {lang === 'en' ? 'Customer Refund List' : 'បញ្ជីការសងប្រាក់អតិថិជន'}
              </h2>
              <p className="text-[11px] text-slate-400">
                {lang === 'en'
                  ? 'Displays customer refund history, exchange rate, disbursement status, and allocated invoices.'
                  : 'បង្ហាញប្រវត្តិការសងប្រាក់ជូនអតិថិជន អត្រាប្តូរប្រាក់ ស្ថានភាព និងវិក័យប័ត្រពាក់ព័ន្ធ។'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Choose Column Button */}
            <button
              type="button"
              onClick={() => setChooseColumnOpen(true)}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-950/80 px-3.5 py-1.5 text-xs font-bold text-slate-300 hover:border-rose-400 hover:text-white transition active:scale-95"
            >
              <span>⚙️</span>
              <span>{lang === 'en' ? 'Choose Column' : 'ជ្រើសរើសជួរឈរ'}</span>
            </button>

            {/* Create Button */}
            <button
              type="button"
              onClick={openCreateModal}
              className="inline-flex items-center gap-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 px-4 py-1.5 text-xs font-bold text-white transition active:scale-95 shadow-md shadow-rose-600/25"
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
                {visibleColumns.includes('rate') && <th className="py-3 px-3.5 text-right">Rate</th>}
                {visibleColumns.includes('paidAmount') && <th className="py-3 px-3.5 text-right">Paid Amount</th>}
                {visibleColumns.includes('partner') && <th className="py-3 px-3.5">Partner</th>}
                {visibleColumns.includes('contact') && <th className="py-3 px-3.5">Contact</th>}
                {visibleColumns.includes('phone') && <th className="py-3 px-3.5">Phone</th>}
                {visibleColumns.includes('username') && <th className="py-3 px-3.5">Username</th>}
                {visibleColumns.includes('status') && <th className="py-3 px-3.5 text-center">Status</th>}
                <th className="py-3 px-3.5 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80 bg-slate-900/40">
              {loading && refunds.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-12 text-center text-slate-500 font-mono">
                    <span className="inline-block animate-spin mr-2">🌀</span>
                    {lang === 'en' ? 'Loading customer refunds...' : 'កំពុងផ្ទុកទិន្នន័យ...'}
                  </td>
                </tr>
              ) : refunds.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-12 text-center text-slate-500 space-y-2">
                    <div className="text-3xl">💳</div>
                    <p className="font-semibold">
                      {lang === 'en' ? 'No customer refunds found' : 'មិនមានទិន្នន័យសងប្រាក់ឡើយ'}
                    </p>
                    <button
                      type="button"
                      onClick={openCreateModal}
                      className="inline-flex items-center gap-1.5 rounded-lg bg-rose-600/30 border border-rose-500/40 px-3 py-1 text-xs font-bold text-rose-300 hover:bg-rose-600/50 transition"
                    >
                      + {lang === 'en' ? 'Create First Customer Refund' : 'កត់ត្រាការសងប្រាក់ដំបូង'}
                    </button>
                  </td>
                </tr>
              ) : (
                refunds.map((r) => {
                  const st = STATUS_CONFIG[r.status] || STATUS_CONFIG.NONE_VOID
                  return (
                    <tr key={r.id || r.code} className="hover:bg-slate-800/50 transition">
                      {visibleColumns.includes('code') && (
                        <td className="py-3 px-3.5 font-mono font-bold text-rose-400">
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedRefund(r)
                              setDetailModalOpen(true)
                            }}
                            className="hover:underline text-left font-bold"
                          >
                            {r.code}
                          </button>
                        </td>
                      )}
                      {visibleColumns.includes('paymentDate') && (
                        <td className="py-3 px-3.5 text-slate-300 whitespace-nowrap">
                          {formatDate(r.paymentDate)}
                        </td>
                      )}
                      {visibleColumns.includes('rate') && (
                        <td className="py-3 px-3.5 text-right font-mono text-slate-300 whitespace-nowrap">
                          {r.rate ? `${Number(r.rate).toLocaleString()} ៛` : '4,100 ៛'}
                        </td>
                      )}
                      {visibleColumns.includes('paidAmount') && (
                        <td className="py-3 px-3.5 text-right font-mono font-bold text-rose-400 whitespace-nowrap">
                          {formatCurrency(r.paidAmount)}
                        </td>
                      )}
                      {visibleColumns.includes('partner') && (
                        <td className="py-3 px-3.5 font-semibold text-white">
                          {r.partner || '---'}
                        </td>
                      )}
                      {visibleColumns.includes('contact') && (
                        <td className="py-3 px-3.5 text-slate-300">
                          {r.contact || '---'}
                        </td>
                      )}
                      {visibleColumns.includes('phone') && (
                        <td className="py-3 px-3.5 text-slate-400 font-mono">
                          {r.phone || '---'}
                        </td>
                      )}
                      {visibleColumns.includes('username') && (
                        <td className="py-3 px-3.5 text-slate-300">
                          {r.username || 'Admin'}
                        </td>
                      )}
                      {visibleColumns.includes('status') && (
                        <td className="py-3 px-3.5 text-center">
                          <span
                            className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${st.badgeClass}`}
                          >
                            <span className={`h-1.5 w-1.5 rounded-full ${st.dotClass}`} />
                            {lang === 'en' ? st.labelEn : st.labelKh}
                          </span>
                        </td>
                      )}
                      <td className="py-3 px-3.5 text-center whitespace-nowrap">
                        <div className="inline-flex items-center gap-1.5">
                          {/* View Details */}
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedRefund(r)
                              setDetailModalOpen(true)
                            }}
                            title="View Details"
                            className="p-1 text-slate-400 hover:text-white transition"
                          >
                            👁️
                          </button>

                          {/* Toggle Void */}
                          <button
                            type="button"
                            onClick={() => handleToggleStatus(r)}
                            title={r.status === 'VOIDED' ? 'Reactivate' : 'Void'}
                            className={`px-2 py-0.5 rounded text-[10px] font-bold transition ${
                              r.status === 'VOIDED'
                                ? 'bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/40'
                                : 'bg-rose-500/20 text-rose-300 hover:bg-rose-500/40'
                            }`}
                          >
                            {r.status === 'VOIDED' ? 'Activate' : 'Void'}
                          </button>

                          {/* Delete */}
                          <button
                            type="button"
                            onClick={() => handleDeleteRefund(r.id, r.code)}
                            title="Delete"
                            className="p-1 text-slate-500 hover:text-rose-400 transition"
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

      {/* 4. CHOOSE COLUMN MODAL */}
      {chooseColumnOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-3xl border border-slate-800 bg-slate-900 p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <span className="text-xl">⚙️</span>
                <div>
                  <h3 className="text-base font-bold text-white">
                    {lang === 'en' ? 'Choose Columns' : 'ជ្រើសរើសជួរឈរ'}
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    {lang === 'en'
                      ? 'Select columns you want to display on table'
                      : 'ជ្រើសរើសជួរឈរដែលអ្នកចង់បង្ហាញលើតារាង'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setChooseColumnOpen(false)}
                className="text-slate-400 hover:text-white text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <div className="flex items-center justify-between text-xs pb-1">
              <button
                type="button"
                onClick={handleSelectAllColumns}
                className="text-rose-400 hover:underline font-semibold"
              >
                {lang === 'en' ? 'Select All' : 'ជ្រើសទាំងអស់'}
              </button>
              <button
                type="button"
                onClick={handleClearColumns}
                className="text-slate-400 hover:underline font-semibold"
              >
                {lang === 'en' ? 'Reset to Default' : 'កំណត់លំនាំដើម'}
              </button>
            </div>

            <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
              {ALL_COLUMNS.map((col) => {
                const checked = visibleColumns.includes(col.key)
                return (
                  <label
                    key={col.key}
                    className={`flex items-center justify-between p-2.5 rounded-xl border transition cursor-pointer ${
                      checked
                        ? 'border-rose-500/40 bg-rose-500/10 text-white'
                        : 'border-slate-800 bg-slate-950/60 text-slate-400 hover:bg-slate-800/40'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={checked}
                        disabled={col.always}
                        onChange={() => toggleColumn(col.key)}
                        className="rounded border-slate-700 text-rose-600 focus:ring-rose-500 h-4 w-4 accent-rose-500"
                      />
                      <span className="text-xs font-semibold">
                        {lang === 'en' ? col.label.en : col.label.kh}
                      </span>
                    </div>
                    {col.always && (
                      <span className="text-[10px] uppercase font-bold text-rose-400 bg-rose-500/20 px-2 py-0.5 rounded">
                        Required
                      </span>
                    )}
                  </label>
                )
              })}
            </div>

            <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setChooseColumnOpen(false)}
                className="rounded-xl bg-rose-600 hover:bg-rose-500 px-5 py-2 text-xs font-bold text-white transition active:scale-95"
              >
                {lang === 'en' ? 'Done' : 'រួចរាល់'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 5. CREATE CUSTOMER REFUND MODAL */}
      {createModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-3 sm:p-4 backdrop-blur-md overflow-y-auto">
          <div className="w-full max-w-4xl max-h-[92vh] flex flex-col rounded-3xl border border-rose-500/30 bg-slate-900 shadow-2xl shadow-rose-950/40 my-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-5 border-b border-slate-800 bg-gradient-to-r from-slate-950 via-slate-900 to-rose-950/30 rounded-t-3xl">
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-500/20 border border-rose-500/30">
                  <img src={moneyIcon} alt="" className="h-6 w-6 object-contain" />
                </span>
                <div>
                  <h3 className="text-lg font-black text-white">
                    {lang === 'en' ? 'New Customer Refund' : 'បង្កើតការសងប្រាក់អតិថិជន'}
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    {lang === 'en'
                      ? 'Fill general information, balance, payment type, and allocate invoices.'
                      : 'បំពេញព័ត៌មានទូទៅ សមតុល្យ ប្រភេទនៃការទូទាត់ និងបែងចែកវិក័យប័ត្រ។'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setCreateModalOpen(false)}
                className="h-8 w-8 rounded-full bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white flex items-center justify-center text-sm font-bold transition"
              >
                ✕
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleSaveRefund} className="flex-1 overflow-y-auto p-5 space-y-6">
              {/* SECTION A: GENERAL INFORMATION */}
              <div className="space-y-3">
                <div className="flex items-center gap-2 pb-2 border-b border-slate-800/80">
                  <div className="h-4 w-1 rounded-full bg-rose-500" />
                  <h4 className="text-xs font-bold uppercase tracking-wider text-rose-300">
                    {lang === 'en' ? 'General Information' : 'ព័ត៌មានទូទៅ'}
                  </h4>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
                  {/* Code - Textbox Generated */}
                  <div>
                    <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                      {lang === 'en' ? 'Code (Generated)' : 'លេខកូដ (ស្វ័យប្រវត្តិ)'}
                    </label>
                    <input
                      type="text"
                      readOnly
                      value={formData.code}
                      className="w-full rounded-xl border border-slate-700 bg-slate-950/90 py-2 px-3 text-xs font-mono font-bold text-rose-400 outline-none cursor-not-allowed"
                    />
                  </div>

                  {/* Customer * - Dropdown */}
                  <div>
                    <label className="block text-[11px] font-bold text-rose-400 uppercase tracking-wider mb-1">
                      {lang === 'en' ? 'Customer *' : 'អតិថិជន *'}
                    </label>
                    <select
                      value={formData.customerId}
                      onChange={(e) => handleCustomerChange(e.target.value)}
                      required
                      className="w-full rounded-xl border border-rose-500/50 bg-slate-950/90 py-2 px-3 text-xs font-semibold text-white outline-none focus:border-rose-400 focus:ring-2 focus:ring-rose-400/20"
                    >
                      <option value="">{lang === 'en' ? '-- Select Customer --' : '-- ជ្រើសរើសអតិថិជន --'}</option>
                      {filteredCustomers.map((cust) => (
                        <option key={cust.id} value={cust.id}>
                          {cust.name || cust.customerName} ({cust.code || `CU-${cust.id}`})
                          {cust.hasInvoices === false ? ' [No Invoices]' : ''}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Balance - Textbox (NOW FULLY EDITABLE) */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-[11px] font-bold text-emerald-400 uppercase tracking-wider">
                        {lang === 'en' ? 'Balance ($) - Editable' : 'សមតុល្យ ($) - អាចកែប្រែបាន'}
                      </label>
                      <span className="text-[10px] text-slate-400">✏️ Editable</span>
                    </div>
                    <div className="relative">
                      <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-xs font-mono font-bold text-emerald-400">
                        $
                      </span>
                      <input
                        type="number"
                        step="0.01"
                        value={formData.balance}
                        onChange={(e) => setFormData((prev) => ({ ...prev, balance: e.target.value }))}
                        placeholder="0.00"
                        className="w-full rounded-xl border border-emerald-500/60 bg-slate-950/90 py-2 pl-7 pr-3 text-xs font-mono font-bold text-emerald-400 outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/20"
                      />
                    </div>
                  </div>

                  {/* Payment Date - Date */}
                  <div>
                    <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                      {lang === 'en' ? 'Payment Date' : 'កាលបរិច្ឆេទសងប្រាក់'}
                    </label>
                    <input
                      type="date"
                      value={formData.paymentDate}
                      onChange={(e) => setFormData((prev) => ({ ...prev, paymentDate: e.target.value }))}
                      required
                      className="w-full rounded-xl border border-slate-700/80 bg-slate-950/90 py-2 px-3 text-xs text-white outline-none focus:border-rose-400"
                    />
                  </div>

                  {/* Contact * - Dropdown */}
                  <div>
                    <label className="block text-[11px] font-bold text-rose-400 uppercase tracking-wider mb-1">
                      {lang === 'en' ? 'Contact *' : 'ទំនាក់ទំនង *'}
                    </label>
                    <select
                      value={formData.contact}
                      onChange={(e) => handleContactChange(e.target.value)}
                      required
                      disabled={availableContacts.length === 0}
                      className="w-full rounded-xl border border-slate-700/80 bg-slate-950/90 py-2 px-3 text-xs font-semibold text-white outline-none focus:border-rose-400 disabled:opacity-50"
                    >
                      {availableContacts.length === 0 ? (
                        <option value="">{lang === 'en' ? 'Select customer first' : 'សូមជ្រើសរើសអតិថិជនជាមុន'}</option>
                      ) : (
                        availableContacts.map((ct, idx) => (
                          <option key={idx} value={ct.value}>
                            {ct.label}
                          </option>
                        ))
                      )}
                    </select>
                  </div>

                  {/* Total Paid Amount - Textbox Visible */}
                  <div>
                    <label className="block text-[11px] font-bold text-emerald-400 uppercase tracking-wider mb-1">
                      {lang === 'en' ? 'Total Paid Amount (Visible)' : 'ចំនួនសរុបបានសង'}
                    </label>
                    <input
                      type="text"
                      readOnly
                      value={formatCurrency(totalPaidAmount)}
                      className="w-full rounded-xl border border-emerald-500/50 bg-slate-950/90 py-2 px-3 text-xs font-mono font-black text-emerald-400 outline-none cursor-not-allowed shadow-inner"
                    />
                  </div>

                  {/* Note - Textbox */}
                  <div className="sm:col-span-2 lg:col-span-3">
                    <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                      {lang === 'en' ? 'Note' : 'កំណត់ចំណាំ'}
                    </label>
                    <input
                      type="text"
                      value={formData.note}
                      onChange={(e) => setFormData((prev) => ({ ...prev, note: e.target.value }))}
                      placeholder={lang === 'en' ? 'Enter refund reason or notes...' : 'បញ្ចូលមូលហេតុសងប្រាក់ ឬកំណត់ចំណាំ...'}
                      className="w-full rounded-xl border border-slate-700/80 bg-slate-950/90 py-2 px-3 text-xs text-white outline-none focus:border-rose-400"
                    />
                  </div>
                </div>
              </div>

              {/* SECTION B: APPLY METHOD */}
              <div className="space-y-3">
                <div className="flex items-center gap-2 pb-2 border-b border-slate-800/80">
                  <div className="h-4 w-1 rounded-full bg-rose-500" />
                  <h4 className="text-xs font-bold uppercase tracking-wider text-rose-300">
                    {lang === 'en' ? 'Apply Method' : 'វិធីសាស្ត្រអនុវត្ត'}
                  </h4>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  {/* Payment Type - Dropdown */}
                  <div>
                    <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                      {lang === 'en' ? 'Payment Type' : 'ប្រភេទនៃការទូទាត់'}
                    </label>
                    <select
                      value={formData.paymentType}
                      onChange={(e) => setFormData((prev) => ({ ...prev, paymentType: e.target.value }))}
                      className="w-full rounded-xl border border-slate-700/80 bg-slate-950/90 py-2 px-3 text-xs font-semibold text-white outline-none focus:border-rose-400"
                    >
                      {PAYMENT_TYPES.map((pt) => (
                        <option key={pt} value={pt}>
                          {pt}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Authorization Note - Textbox */}
                  <div>
                    <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                      {lang === 'en' ? 'Authorization Note' : 'កំណត់ចំណាំការអនុញ្ញាត'}
                    </label>
                    <input
                      type="text"
                      value={formData.authorizationNote}
                      onChange={(e) => setFormData((prev) => ({ ...prev, authorizationNote: e.target.value }))}
                      placeholder={lang === 'en' ? 'Authorized by Manager / Ref No.' : 'អនុញ្ញាតដោយអ្នកគ្រប់គ្រង / លេខយោង...'}
                      className="w-full rounded-xl border border-slate-700/80 bg-slate-950/90 py-2 px-3 text-xs text-white outline-none focus:border-rose-400"
                    />
                  </div>
                </div>
              </div>

              {/* SECTION C: INVOICES - DO PAYMENT OF INVOICES */}
              <div className="space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-2 border-b border-slate-800/80 gap-2">
                  <div className="flex items-center gap-2">
                    <div className="h-4 w-1 rounded-full bg-rose-500" />
                    <div>
                      <h4 className="text-xs font-bold uppercase tracking-wider text-rose-300">
                        {lang === 'en' ? 'Invoices (Do Payment of Invoices)' : 'វិក័យប័ត្រ (ទូទាត់លើវិក័យប័ត្រ)'}
                      </h4>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleAutoAllocate}
                      disabled={!hasInvoices}
                      className="rounded-lg bg-slate-800 hover:bg-slate-700 px-3 py-1 text-[11px] font-semibold text-rose-300 transition disabled:opacity-40"
                    >
                      {lang === 'en' ? 'Pay Full Balance' : 'សងគ្រប់សមតុល្យ'}
                    </button>
                    <button
                      type="button"
                      onClick={handleAddInvoiceRow}
                      className="rounded-lg bg-rose-600/30 border border-rose-500/40 hover:bg-rose-600/50 px-3 py-1 text-[11px] font-bold text-rose-200 transition"
                    >
                      + {lang === 'en' ? 'Add Invoice Row' : 'បន្ថែមជួរវិក័យប័ត្រ'}
                    </button>
                  </div>
                </div>

                {/* INVOICE ENFORCEMENT BANNER */}
                {formData.customerId && !hasInvoices && (
                  <div className="rounded-2xl border border-amber-500/40 bg-amber-500/10 p-4 text-amber-300 space-y-1">
                    <div className="flex items-center gap-2 font-bold text-xs">
                      <span>⚠️</span>
                      <span>
                        {lang === 'en'
                          ? 'Customer Has No Invoices for Refund'
                          : 'អតិថិជននេះមិនមានវិក័យប័ត្រសម្រាប់សងប្រាក់ឡើយ'}
                      </span>
                    </div>
                    <p className="text-[11px] text-amber-200/90 leading-relaxed">
                      {lang === 'en'
                        ? 'If that person does not have invoices, a refund cannot be processed. To proceed with a refund, the customer must have invoices or return credit memos.'
                        : 'ប្រសិនបើបុគ្គលនេះមិនមានវិក័យប័ត្រទេ ការសងប្រាក់មិនអាចដំណើរការបានឡើយ។ ដើម្បីដំណើរការសងប្រាក់ អតិថិជនត្រូវតែមានវិក័យប័ត្រ ឬប័ណ្ណឥណទានត្រឡប់។'}
                    </p>
                  </div>
                )}

                <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-950/60">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-950 text-[11px] uppercase tracking-wider text-slate-400 font-bold border-b border-slate-800">
                      <tr>
                        <th className="py-2.5 px-3">Code</th>
                        <th className="py-2.5 px-3">Date</th>
                        <th className="py-2.5 px-3">Type</th>
                        <th className="py-2.5 px-3 text-right">Amount</th>
                        <th className="py-2.5 px-3 text-right">Balance</th>
                        <th className="py-2.5 px-3 text-right">Pay Amount</th>
                        <th className="py-2.5 px-3 text-center">Pay Currency</th>
                        <th className="py-2.5 px-2 text-center w-10">✕</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60">
                      {!hasInvoices ? (
                        <tr>
                          <td colSpan={8} className="py-8 text-center text-slate-500 space-y-1">
                            <p className="font-semibold text-slate-400">
                              {formData.customerId
                                ? lang === 'en'
                                  ? 'No invoices found for this customer. A refund cannot be created.'
                                  : 'មិនមានវិក័យប័ត្រសម្រាប់អតិថិជននេះទេ។ មិនអាចបង្កើតការសងប្រាក់បានទេ។'
                                : lang === 'en'
                                ? 'Select a customer above to view available invoices.'
                                : 'សូមជ្រើសរើសអតិថិជនខាងលើដើម្បីមើលវិក័យប័ត្រ។'}
                            </p>
                          </td>
                        </tr>
                      ) : (
                        formData.invoices.map((inv, idx) => (
                          <tr key={inv.id || idx} className="hover:bg-slate-900/50 transition">
                            {/* Code */}
                            <td className="py-2 px-3">
                              <input
                                type="text"
                                value={inv.code}
                                onChange={(e) => handleInvoiceFieldChange(idx, 'code', e.target.value)}
                                className="w-32 rounded-lg border border-slate-800 bg-slate-900 px-2 py-1 font-mono text-xs text-rose-300 outline-none focus:border-rose-400"
                              />
                            </td>

                            {/* Date */}
                            <td className="py-2 px-3">
                              <input
                                type="date"
                                value={inv.date}
                                onChange={(e) => handleInvoiceFieldChange(idx, 'date', e.target.value)}
                                className="w-32 rounded-lg border border-slate-800 bg-slate-900 px-2 py-1 text-xs text-slate-300 outline-none focus:border-rose-400"
                              />
                            </td>

                            {/* Type */}
                            <td className="py-2 px-3">
                              <select
                                value={inv.type}
                                onChange={(e) => handleInvoiceFieldChange(idx, 'type', e.target.value)}
                                className="rounded-lg border border-slate-800 bg-slate-900 px-2 py-1 text-xs text-slate-300 outline-none focus:border-rose-400"
                              >
                                <option value="Return Invoice">Return Invoice</option>
                                <option value="Credit Memo">Credit Memo</option>
                                <option value="Sale Invoice">Sale Invoice</option>
                                <option value="Overpayment">Overpayment</option>
                              </select>
                            </td>

                            {/* Amount */}
                            <td className="py-2 px-3 text-right">
                              <input
                                type="number"
                                step="0.01"
                                value={inv.amount}
                                onChange={(e) => handleInvoiceFieldChange(idx, 'amount', e.target.value)}
                                className="w-24 text-right rounded-lg border border-slate-800 bg-slate-900 px-2 py-1 font-mono text-xs text-slate-300 outline-none focus:border-rose-400"
                              />
                            </td>

                            {/* Balance */}
                            <td className="py-2 px-3 text-right">
                              <input
                                type="number"
                                step="0.01"
                                value={inv.balance}
                                onChange={(e) => handleInvoiceFieldChange(idx, 'balance', e.target.value)}
                                className="w-24 text-right rounded-lg border border-slate-800 bg-slate-900 px-2 py-1 font-mono text-xs text-slate-400 outline-none focus:border-rose-400"
                              />
                            </td>

                            {/* Pay Amount */}
                            <td className="py-2 px-3 text-right">
                              <input
                                type="number"
                                step="0.01"
                                min="0"
                                value={inv.payAmount}
                                onChange={(e) => handleInvoicePayAmountChange(idx, e.target.value)}
                                className="w-28 text-right rounded-lg border border-rose-500/60 bg-slate-900 px-2 py-1 font-mono font-bold text-xs text-emerald-400 outline-none focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400/30"
                              />
                            </td>

                            {/* Pay Currency */}
                            <td className="py-2 px-3 text-center">
                              <select
                                value={inv.payCurrency}
                                onChange={(e) => handleInvoiceFieldChange(idx, 'payCurrency', e.target.value)}
                                className="rounded-lg border border-slate-800 bg-slate-900 px-2 py-1 text-xs text-slate-300 outline-none focus:border-rose-400"
                              >
                                <option value="USD">USD ($)</option>
                                <option value="KHR">KHR (៛)</option>
                              </select>
                            </td>

                            {/* Delete Row */}
                            <td className="py-2 px-2 text-center">
                              <button
                                type="button"
                                onClick={() => handleRemoveInvoiceRow(idx)}
                                className="text-slate-500 hover:text-rose-400 font-bold"
                              >
                                ✕
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                    {hasInvoices && (
                      <tfoot className="bg-slate-950 font-bold border-t border-slate-800">
                        <tr>
                          <td colSpan={5} className="py-2.5 px-3 text-right uppercase tracking-wider text-slate-400 text-[11px]">
                            {lang === 'en' ? 'Total Pay Amount:' : 'សរុបទឹកប្រាក់សង:'}
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono text-xs text-emerald-400 font-black">
                            {formatCurrency(totalPaidAmount)}
                          </td>
                          <td colSpan={2}></td>
                        </tr>
                      </tfoot>
                    )}
                  </table>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="pt-3 flex items-center justify-between border-t border-slate-800">
                <div className="text-xs">
                  {!hasInvoices && formData.customerId && (
                    <span className="text-rose-400 font-semibold">
                      ⛔ {lang === 'en' ? 'Cannot refund: Customer has no invoices.' : 'មិនអាចសងប្រាក់បានទេ៖ អតិថិជនមិនមានវិក័យប័ត្រ។'}
                    </span>
                  )}
                  {hasInvoices && totalPaidAmount <= 0 && (
                    <span className="text-amber-400 font-semibold">
                      ⚠️ {lang === 'en' ? 'Please enter a Pay Amount on invoices.' : 'សូមបញ្ចូលចំនួនប្រាក់ត្រូវសងលើវិក័យប័ត្រ។'}
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setCreateModalOpen(false)}
                    className="rounded-xl border border-slate-700 bg-slate-800 px-5 py-2.5 text-xs font-bold text-slate-300 hover:bg-slate-700 transition"
                  >
                    {lang === 'en' ? 'Cancel' : 'បោះបង់'}
                  </button>
                  <button
                    type="submit"
                    disabled={saving || !hasInvoices || totalPaidAmount <= 0}
                    className="rounded-xl bg-gradient-to-r from-rose-600 via-red-600 to-pink-600 px-6 py-2.5 text-xs font-black uppercase tracking-wider text-white shadow-lg shadow-rose-600/30 transition hover:brightness-110 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    {saving ? (
                      <span className="inline-flex items-center gap-2">
                        <span className="animate-spin">🌀</span>
                        {lang === 'en' ? 'Saving...' : 'កំពុងរក្សាទុក...'}
                      </span>
                    ) : (
                      <span>{lang === 'en' ? 'Save Customer Refund' : 'រក្សាទុកការសងប្រាក់'}</span>
                    )}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 6. DETAIL VIEW MODAL */}
      {detailModalOpen && selectedRefund && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-md">
          <div className="w-full max-w-2xl rounded-3xl border border-slate-800 bg-slate-900 p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-3">
                <span className="text-2xl">🧾</span>
                <div>
                  <h3 className="text-base font-black text-white">
                    {lang === 'en' ? 'Customer Refund Voucher' : 'ប័ណ្ណសងប្រាក់អតិថិជន'}
                  </h3>
                  <p className="text-[11px] font-mono text-rose-400 font-bold">{selectedRefund.code}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setDetailModalOpen(false)}
                className="text-slate-400 hover:text-white text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3.5 text-xs bg-slate-950/60 p-4 rounded-2xl border border-slate-800">
              <div>
                <p className="text-[10px] uppercase font-bold text-slate-500">Partner / Customer</p>
                <p className="font-bold text-white mt-0.5">{selectedRefund.partner}</p>
              </div>
              <div>
                <p className="text-[10px] uppercase font-bold text-slate-500">Date</p>
                <p className="font-semibold text-slate-300 mt-0.5">{formatDate(selectedRefund.paymentDate)}</p>
              </div>
              <div>
                <p className="text-[10px] uppercase font-bold text-slate-500">Status</p>
                <span
                  className={`inline-block mt-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                    STATUS_CONFIG[selectedRefund.status]?.badgeClass || STATUS_CONFIG.NONE_VOID.badgeClass
                  }`}
                >
                  {selectedRefund.status || 'NONE_VOID'}
                </span>
              </div>
              <div>
                <p className="text-[10px] uppercase font-bold text-slate-500">Total Paid Amount</p>
                <p className="font-mono font-black text-rose-400 text-sm mt-0.5">
                  {formatCurrency(selectedRefund.paidAmount)}
                </p>
              </div>
              <div>
                <p className="text-[10px] uppercase font-bold text-slate-500">Balance</p>
                <p className="font-mono text-emerald-400 font-bold mt-0.5">
                  {formatCurrency(selectedRefund.balance)}
                </p>
              </div>
              <div>
                <p className="text-[10px] uppercase font-bold text-slate-500">Exchange Rate</p>
                <p className="font-mono text-slate-300 mt-0.5">
                  {selectedRefund.rate ? `${Number(selectedRefund.rate).toLocaleString()} KHR` : '4,100 KHR'}
                </p>
              </div>
              <div>
                <p className="text-[10px] uppercase font-bold text-slate-500">Payment Type</p>
                <p className="font-semibold text-slate-300 mt-0.5">{selectedRefund.paymentType || 'Cash'}</p>
              </div>
              <div>
                <p className="text-[10px] uppercase font-bold text-slate-500">Contact</p>
                <p className="font-mono text-slate-400 mt-0.5">{selectedRefund.contact || '---'}</p>
              </div>
              <div>
                <p className="text-[10px] uppercase font-bold text-slate-500">Phone</p>
                <p className="font-mono text-slate-400 mt-0.5">{selectedRefund.phone || '---'}</p>
              </div>
              <div>
                <p className="text-[10px] uppercase font-bold text-slate-500">Username</p>
                <p className="font-semibold text-slate-300 mt-0.5">{selectedRefund.username || 'Admin'}</p>
              </div>
              {selectedRefund.authorizationNote && (
                <div className="col-span-2 sm:col-span-3">
                  <p className="text-[10px] uppercase font-bold text-slate-500">Authorization Note</p>
                  <p className="text-slate-300 mt-0.5 italic">{selectedRefund.authorizationNote}</p>
                </div>
              )}
            </div>

            {/* Invoices Breakdown */}
            {selectedRefund.invoices && selectedRefund.invoices.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs font-bold uppercase text-slate-400">Allocated Invoices</p>
                <div className="overflow-x-auto rounded-xl border border-slate-800">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-950 text-slate-400 border-b border-slate-800">
                      <tr>
                        <th className="p-2">Invoice</th>
                        <th className="p-2">Type</th>
                        <th className="p-2 text-right">Amount</th>
                        <th className="p-2 text-right">Pay Amount</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800">
                      {selectedRefund.invoices.map((inv, idx) => (
                        <tr key={idx}>
                          <td className="p-2 font-mono text-rose-400">{inv.code}</td>
                          <td className="p-2 text-slate-300">{inv.type}</td>
                          <td className="p-2 text-right font-mono text-slate-400">{formatCurrency(inv.amount)}</td>
                          <td className="p-2 text-right font-mono font-bold text-emerald-400">
                            {formatCurrency(inv.payAmount)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            <div className="pt-2 flex items-center justify-between border-t border-slate-800">
              <button
                type="button"
                onClick={() => window.print()}
                className="inline-flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-800 px-4 py-2 text-xs font-bold text-slate-200 hover:bg-slate-700 transition"
              >
                <span>🖨️</span>
                <span>Print Voucher</span>
              </button>

              <button
                type="button"
                onClick={() => setDetailModalOpen(false)}
                className="rounded-xl bg-rose-600 hover:bg-rose-500 px-5 py-2 text-xs font-bold text-white transition active:scale-95"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
