import React, { useState, useEffect } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useLanguage } from '../../context/LanguageContext'
import { useNotifications } from '../../context/NotificationContext'
import { adminSalePromotionAPI, adminProductAPI, adminProductGroupAPI } from '../../api/api'
import giftIcon from '../../assets/icon/3dicons-gift-box-dynamic-color.png'

const PRICE_BOOKS = [
  'Standard Retail Price Book',
  'Wholesale Tier 1 Book',
  'VIP Club Member Book',
  'Special Partner Book',
]

const DAYS_OF_WEEK = [
  { key: 'SUN', label: 'Sun', full: 'Sunday' },
  { key: 'MON', label: 'Mon', full: 'Monday' },
  { key: 'TUE', label: 'Tue', full: 'Tuesday' },
  { key: 'WED', label: 'Wed', full: 'Wednesday' },
  { key: 'THU', label: 'Thu', full: 'Thursday' },
  { key: 'FRI', label: 'Fri', full: 'Friday' },
  { key: 'SAT', label: 'Sat', full: 'Saturday' },
]

const MONTHS_OF_YEAR = [
  { key: 'JAN', label: 'Jan' },
  { key: 'FEB', label: 'Feb' },
  { key: 'MAR', label: 'Mar' },
  { key: 'APR', label: 'Apr' },
  { key: 'MAY', label: 'May' },
  { key: 'JUN', label: 'Jun' },
  { key: 'JUL', label: 'Jul' },
  { key: 'AUG', label: 'Aug' },
  { key: 'SEP', label: 'Sep' },
  { key: 'OCT', label: 'Oct' },
  { key: 'NOV', label: 'Nov' },
  { key: 'DEC', label: 'Dec' },
]

export const PromotionForm = () => {
  const { lang } = useLanguage()
  const { addNotification } = useNotifications()
  const navigate = useNavigate()
  const { id } = useParams()
  const isEdit = Boolean(id)

  // 1. Primary Information
  const [code, setCode] = useState('')
  const [description, setDescription] = useState('')
  const [secondLanguage, setSecondLanguage] = useState('')
  const [active, setActive] = useState(true)

  // 2. Price Book
  const [priceBook, setPriceBook] = useState(PRICE_BOOKS[0])

  // 3. Discount Type: PERCENTAGE | FIXED_AMOUNT | BUY_X_GET_Y
  const [discountType, setDiscountType] = useState('PERCENTAGE')

  // 4. Minimum Requirement (for Percentage & Fixed Amount)
  // ENTIRE_ORDER | MIN_PURCHASE_AMOUNT | MIN_QUANTITY
  const [minReqType, setMinReqType] = useState('ENTIRE_ORDER')
  const [minReqPurchaseAmount, setMinReqPurchaseAmount] = useState('0')
  const [minReqQuantity, setMinReqQuantity] = useState('0')

  // 5. Discount Value (for Percentage & Fixed Amount)
  // ENTIRE_ORDER | SPECIFIC_PRODUCT_GROUP | SPECIFIC_PRODUCT
  const [discountScope, setDiscountScope] = useState('ENTIRE_ORDER')
  const [discountValue, setDiscountValue] = useState('0')
  const [selectedProductGroups, setSelectedProductGroups] = useState([])
  const [selectedSpecificProducts, setSelectedSpecificProducts] = useState([])

  // Buy X Get Y Dedicated State
  const [buyXGetYRule, setBuyXGetYRule] = useState('MIN_QUANTITY') // 'MIN_PURCHASE_AMOUNT' | 'MIN_QUANTITY'
  const [buyXGetYAmount, setBuyXGetYAmount] = useState('0.00')
  const [buyProducts, setBuyProducts] = useState([])
  const [rewardProducts, setRewardProducts] = useState([])

  // 6. Active Date: INTERVAL | RECURRENT
  const [dateType, setDateType] = useState('INTERVAL')
  const [startDate, setStartDate] = useState(new Date().toISOString().slice(0, 10))
  const [endDate, setEndDate] = useState(() => {
    const d = new Date()
    d.setDate(d.getDate() + 30)
    return d.toISOString().slice(0, 10)
  })

  // Recurrent Days & Months
  const [selectedDays, setSelectedDays] = useState(new Set(DAYS_OF_WEEK.map((d) => d.key)))
  const [selectedMonths, setSelectedMonths] = useState(new Set(MONTHS_OF_YEAR.map((m) => m.key)))

  // Master live data loaded from backend
  const [availableGroups, setAvailableGroups] = useState([])
  const [availableProducts, setAvailableProducts] = useState([])
  const [loadingData, setLoadingData] = useState(true)

  // Selection Modals
  const [showGroupModal, setShowGroupModal] = useState(false)
  const [showProductModal, setShowProductModal] = useState(null) // 'discount' | 'buy_x' | 'reward_y' | null
  const [modalSearch, setModalSearch] = useState('')

  // Validation Popup Modal
  const [showValidationModal, setShowValidationModal] = useState(false)
  const [validationErrors, setValidationErrors] = useState([])

  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(isEdit)

  // Fetch 100% Real Live Master Data from Database
  useEffect(() => {
    let isMounted = true
    setLoadingData(true)

    Promise.all([
      adminProductGroupAPI.getAll().catch(() => []),
      adminProductAPI.getAll().catch(() => []),
    ])
      .then(([groupRes, prodRes]) => {
        if (!isMounted) return

        const gList = Array.isArray(groupRes?.data) ? groupRes.data : Array.isArray(groupRes) ? groupRes : []
        const pList = Array.isArray(prodRes?.data) ? prodRes.data : Array.isArray(prodRes) ? prodRes : []

        setAvailableGroups(
          gList.map((g, idx) => ({
            id: g.id,
            code: g.code || `PG-${String(idx + 1).padStart(4, '0')}`,
            description: g.name || g.description || 'Product Group',
            secondLanguage: g.nameKh || g.secondLanguage || '',
          }))
        )

        setAvailableProducts(
          pList.map((p, idx) => ({
            id: p.id,
            code: p.code || p.barCode || `PRD-${String(idx + 1).padStart(3, '0')}`,
            description: p.name || p.description || 'Product',
            secondLanguage: p.nameKh || '',
            uom: p.uom || 'Pcs',
            basePrice: p.basePrice || p.price || 0,
          }))
        )

        setLoadingData(false)
      })
      .catch(() => {
        if (isMounted) setLoadingData(false)
      })

    return () => {
      isMounted = false
    }
  }, [])

  // Load next code or existing promotion details
  useEffect(() => {
    if (isEdit) {
      adminSalePromotionAPI.getById(id)
        .then((res) => {
          const p = res?.data || res
          if (p) {
            setCode(p.code || '')
            setDescription(p.description || '')
            setSecondLanguage(p.secondLanguage || '')
            setActive(p.active !== false)
            setPriceBook(p.priceBook || PRICE_BOOKS[0])
            setDiscountType(p.discountType || 'PERCENTAGE')
            setMinReqType(p.minRequirementType || 'ENTIRE_ORDER')
            if (p.minRequirementType === 'MIN_PURCHASE_AMOUNT') {
              setMinReqPurchaseAmount(String(p.minRequirementValue || 0))
              setBuyXGetYRule('MIN_PURCHASE_AMOUNT')
              setBuyXGetYAmount(String(p.minRequirementValue || 0))
            } else if (p.minRequirementType === 'MIN_QUANTITY') {
              setMinReqQuantity(String(p.minRequirementValue || 0))
              setBuyXGetYRule('MIN_QUANTITY')
              setBuyXGetYAmount(String(p.minRequirementValue || 0))
            }
            setDiscountScope(p.discountValueScope || 'ENTIRE_ORDER')
            setDiscountValue(p.discountValue ? String(p.discountValue) : '0')
            setDateType(p.dateType || 'INTERVAL')
            if (p.startDate) setStartDate(p.startDate)
            if (p.endDate) setEndDate(p.endDate)
          }
          setLoading(false)
        })
        .catch((err) => {
          console.error('Failed to load promo:', err)
          setLoading(false)
        })
    } else {
      adminSalePromotionAPI.getNextCode()
        .then((res) => {
          const next = res?.data?.nextCode || res?.nextCode || res?.data?.code
          if (next) {
            setCode(next)
          } else {
            setCode(`PR-${new Date().toISOString().slice(2, 10).replace(/-/g, '')}-0001`)
          }
        })
        .catch(() => {
          setCode(`PR-${new Date().toISOString().slice(2, 10).replace(/-/g, '')}-0001`)
        })
    }
  }, [id, isEdit])

  // Recurrent Days Handlers
  const handleToggleAllDays = () => {
    if (selectedDays.size === DAYS_OF_WEEK.length) {
      setSelectedDays(new Set())
    } else {
      setSelectedDays(new Set(DAYS_OF_WEEK.map((d) => d.key)))
    }
  }

  const handleToggleDay = (dayKey) => {
    const next = new Set(selectedDays)
    if (next.has(dayKey)) next.delete(dayKey)
    else next.add(dayKey)
    setSelectedDays(next)
  }

  // Recurrent Months Handlers
  const handleToggleAllMonths = () => {
    if (selectedMonths.size === MONTHS_OF_YEAR.length) {
      setSelectedMonths(new Set())
    } else {
      setSelectedMonths(new Set(MONTHS_OF_YEAR.map((m) => m.key)))
    }
  }

  const handleToggleMonth = (monthKey) => {
    const next = new Set(selectedMonths)
    if (next.has(monthKey)) next.delete(monthKey)
    else next.add(monthKey)
    setSelectedMonths(next)
  }

  const handleSubmit = async (e) => {
    if (e && typeof e.preventDefault === 'function') {
      e.preventDefault()
    }

    // Comprehensive Missing Info Validation
    const errors = []

    if (!code.trim()) {
      errors.push({
        title: 'Promotion Code',
        message: 'Please provide or generate a valid Promotion Code.',
      })
    }

    if (!description.trim()) {
      errors.push({
        title: 'Description',
        message: 'Please enter a promotion description (e.g. 15% OFF on Fresh Fruits).',
      })
    }

    if (!startDate) {
      errors.push({
        title: 'Start Date',
        message: 'Please choose a valid Start Date.',
      })
    }

    if (!endDate) {
      errors.push({
        title: 'End Date',
        message: 'Please choose a valid End Date.',
      })
    }

    if (startDate && endDate && endDate < startDate) {
      errors.push({
        title: 'Date Range Error',
        message: 'End Date cannot be earlier than Start Date.',
      })
    }

    if (discountType !== 'BUY_X_GET_Y') {
      // Minimum Requirement
      if (minReqType === 'MIN_PURCHASE_AMOUNT' && (!minReqPurchaseAmount || Number(minReqPurchaseAmount) <= 0)) {
        errors.push({
          title: 'Minimum Purchase Amount',
          message: 'Please enter an amount greater than $0.00.',
        })
      }
      if (minReqType === 'MIN_QUANTITY' && (!minReqQuantity || Number(minReqQuantity) <= 0)) {
        errors.push({
          title: 'Minimum Quantity',
          message: 'Please enter a minimum product quantity of at least 1 item.',
        })
      }

      // Discount Value
      if (!discountValue || Number(discountValue) <= 0) {
        errors.push({
          title: 'Discount Value',
          message: `Please specify a discount value greater than 0 ${discountType === 'PERCENTAGE' ? '%' : '$'}.`,
        })
      }
      if (discountType === 'PERCENTAGE' && Number(discountValue) > 100) {
        errors.push({
          title: 'Invalid Percentage',
          message: 'Discount percentage cannot exceed 100%.',
        })
      }

      // Target Scopes
      if (discountScope === 'SPECIFIC_PRODUCT_GROUP' && selectedProductGroups.length === 0) {
        errors.push({
          title: 'Specific Product Group',
          message: 'Please click "+ Add" to select at least one product group from the database.',
        })
      }
      if (discountScope === 'SPECIFIC_PRODUCT' && selectedSpecificProducts.length === 0) {
        errors.push({
          title: 'Specific Product',
          message: 'Please click "+ Add" to select at least one product from live inventory.',
        })
      }
    } else {
      // Buy X Get Y validation
      if (buyXGetYRule === 'MIN_PURCHASE_AMOUNT' && (!buyXGetYAmount || Number(buyXGetYAmount) <= 0)) {
        errors.push({
          title: 'Buy X Requirement Amount',
          message: 'Please enter a minimum purchase amount greater than $0.00.',
        })
      }
      if (buyXGetYRule === 'MIN_QUANTITY' && (!buyXGetYAmount || Number(buyXGetYAmount) <= 0)) {
        errors.push({
          title: 'Buy X Requirement Quantity',
          message: 'Please enter a minimum purchase quantity of at least 1 item.',
        })
      }
      if (buyProducts.length === 0) {
        errors.push({
          title: 'Qualifying Products to Buy',
          message: 'Please click "+ Add" to choose at least one product customer must buy.',
        })
      }
      if (rewardProducts.length === 0) {
        errors.push({
          title: 'Promotion Reward Products',
          message: 'Please click "+ Add" to choose at least one free or discounted reward product.',
        })
      }
    }

    // Recurrent Schedule
    if (dateType === 'RECURRENT') {
      if (selectedDays.size === 0) {
        errors.push({
          title: 'Days of Week',
          message: 'Please select at least one day of the week for the recurrent cycle.',
        })
      }
      if (selectedMonths.size === 0) {
        errors.push({
          title: 'Months of Year',
          message: 'Please select at least one month of the year for the recurrent cycle.',
        })
      }
    }

    // If any errors exist, popup the modal message immediately
    if (errors.length > 0) {
      setValidationErrors(errors)
      setShowValidationModal(true)
      return
    }

    setSaving(true)

    // Calculate minimum requirement value based on rule
    let calculatedMinVal = 0
    if (discountType === 'BUY_X_GET_Y') {
      calculatedMinVal = Number(buyXGetYAmount) || 0
    } else if (minReqType === 'MIN_PURCHASE_AMOUNT') {
      calculatedMinVal = Number(minReqPurchaseAmount) || 0
    } else if (minReqType === 'MIN_QUANTITY') {
      calculatedMinVal = Number(minReqQuantity) || 0
    }

    const payload = {
      code: code.trim(),
      description: description.trim(),
      secondLanguage: secondLanguage.trim(),
      active: active,
      priceBook: priceBook,
      discountType: discountType,
      minRequirementType: discountType === 'BUY_X_GET_Y' ? buyXGetYRule : minReqType,
      minRequirementValue: calculatedMinVal,
      discountValueScope: discountScope,
      targetScopeName: discountScope === 'SPECIFIC_PRODUCT_GROUP'
        ? selectedProductGroups.map((g) => g.description).join(', ')
        : discountScope === 'SPECIFIC_PRODUCT'
        ? selectedSpecificProducts.map((p) => p.description).join(', ')
        : 'ENTIRE_ORDER',
      discountValue: Number(discountValue) || 0,
      dateType: dateType,
      startDate: startDate || null,
      endDate: endDate || null,
    }

    try {
      if (isEdit) {
        await adminSalePromotionAPI.update(id, payload)
        addNotification?.({
          type: 'success',
          title: 'Promotion Updated',
          message: `Promotion #${code} updated successfully.`,
        })
      } else {
        await adminSalePromotionAPI.create(payload)
        addNotification?.({
          type: 'success',
          title: 'Promotion Created',
          message: `New promotion #${code} is now active.`,
        })
      }
      navigate('/admin/sale-dashboard/promotions')
    } catch (err) {
      console.error('Save promo failed:', err)
      setSaving(false)
      addNotification?.({
        type: 'error',
        title: 'Save Failed',
        message: err.message || 'Could not save promotion.',
      })
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-green-500 border-t-transparent" />
          <span className="text-xs text-slate-400">Loading promotion details...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white pb-10">
      {/* Top Header - Action Bar */}
      <div className="border-b border-slate-800/90 bg-slate-900/60 backdrop-blur-md px-4 sm:px-6 lg:px-8 py-3.5 mb-5 shadow-sm">
        <div className="max-w-[1700px] mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link
              to="/admin/sale-dashboard/promotions"
              className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-900 border border-slate-700 text-slate-300 hover:text-white hover:bg-slate-800 transition shadow-sm"
              title="Back to Promotions"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
            </Link>
            <img src={giftIcon} alt="Promotion" className="w-8 h-8 object-contain drop-shadow-md hidden sm:block" />
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base sm:text-lg font-black tracking-tight text-white">
                  {isEdit ? (lang === 'en' ? 'Edit Promotion' : 'កែប្រែការផ្សព្វផ្សាយ') : (lang === 'en' ? 'Create Promotion' : 'បង្កើតការផ្សព្វផ្សាយថ្មី')}
                </h1>
                <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-green-500/10 text-[#77BC1F] border border-green-500/20 font-bold font-mono">
                  {code || 'PROMO'}
                </span>
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
                  active ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-slate-800 text-slate-400'
                }`}>
                  {active ? 'Active' : 'Draft'}
                </span>
              </div>
              <p className="text-[11px] text-slate-400 hidden sm:block">
                {lang === 'en'
                  ? 'Configure rules, eligible products, discount value, and duration cycle'
                  : 'កំណត់លក្ខខណ្ឌ ទំនិញអនុវត្ត តម្លៃបញ្ចុះ និងកាលវិភាគ'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <Link
              to="/admin/sale-dashboard/promotions"
              className="px-3.5 py-2 rounded-xl border border-slate-700 bg-slate-900 text-xs font-bold text-slate-300 hover:bg-slate-800 hover:text-white transition"
            >
              {lang === 'en' ? 'Cancel' : 'បោះបង់'}
            </Link>
            <button
              onClick={handleSubmit}
              disabled={saving}
              className="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-gradient-to-r from-[#77BC1F] to-[#5ea113] hover:from-[#65a317] hover:to-[#4e880e] text-slate-950 font-black text-xs uppercase tracking-wider shadow-lg shadow-green-500/20 transition active:scale-95 disabled:opacity-50"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
              </svg>
              {saving ? 'Saving...' : isEdit ? 'Update' : 'Save Promotion'}
            </button>
          </div>
        </div>
      </div>

      {/* Main Fit-to-screen Ergonomic Layout */}
      <div className="max-w-[1700px] mx-auto px-4 sm:px-6 lg:px-8">
        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
            
            {/* LEFT COLUMN: Setup & Conditions (5 Cols on Large Screen) */}
            <div className="lg:col-span-5 space-y-4">
              
              {/* Card 1: Primary Information & Price Book */}
              <div className="rounded-2xl border border-slate-800/90 bg-slate-900/70 p-4 space-y-3.5 shadow-lg">
                <div className="flex items-center justify-between border-b border-slate-800/80 pb-2.5">
                  <h2 className="text-xs font-black uppercase tracking-wider text-white flex items-center gap-2">
                    <span className="flex h-5 w-5 items-center justify-center rounded-lg bg-green-500/20 text-[#77BC1F] text-[11px]">
                      1
                    </span>
                    <span>{lang === 'en' ? 'Primary Information' : 'ព័ត៌មានចម្បង'}</span>
                  </h2>
                  <label className="inline-flex items-center gap-2 text-xs font-bold cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={active}
                      onChange={(e) => setActive(e.target.checked)}
                      className="w-3.5 h-3.5 accent-[#77BC1F] rounded cursor-pointer"
                    />
                    <span className={active ? 'text-[#77BC1F]' : 'text-slate-500'}>
                      {active ? 'Active' : 'Inactive'}
                    </span>
                  </label>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div>
                    <label className="block font-bold text-slate-400 uppercase text-[11px] mb-1">
                      {lang === 'en' ? 'Code' : 'កូដ'}
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        value={code}
                        onChange={(e) => setCode(e.target.value)}
                        placeholder="Auto Generate"
                        required
                        className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-orange-400 font-bold font-mono focus:border-green-400 focus:outline-none"
                      />
                      <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[9px] uppercase font-bold text-slate-500">
                        Auto
                      </span>
                    </div>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-400 uppercase text-[11px] mb-1">
                      {lang === 'en' ? 'Second Language' : 'ភាសាទីពីរ'}
                    </label>
                    <input
                      type="text"
                      value={secondLanguage}
                      onChange={(e) => setSecondLanguage(e.target.value)}
                      placeholder="ឧ. បញ្ចុះតម្លៃពិសេស..."
                      className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-white focus:border-green-400 focus:outline-none"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block font-bold text-slate-400 uppercase text-[11px] mb-1">
                      {lang === 'en' ? 'Description *' : 'ការពិពណ៌នា *'}
                    </label>
                    <input
                      type="text"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="e.g. 15% OFF for All Fresh Fruits on Orders over $20"
                      required
                      className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-white font-semibold focus:border-green-400 focus:outline-none"
                    />
                  </div>

                  <div className="sm:col-span-2 pt-1 border-t border-slate-800/80">
                    <label className="block font-bold text-slate-400 uppercase text-[11px] mb-1">
                      {lang === 'en' ? 'Price Book' : 'សៀវភៅតម្លៃ'}
                    </label>
                    <select
                      value={priceBook}
                      onChange={(e) => setPriceBook(e.target.value)}
                      className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-white font-semibold focus:border-green-400 focus:outline-none cursor-pointer"
                    >
                      {PRICE_BOOKS.map((b) => (
                        <option key={b} value={b}>{b}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Card 2: Discount Type */}
              <div className="rounded-2xl border border-slate-800/90 bg-slate-900/70 p-4 space-y-3 shadow-lg">
                <div className="flex items-center gap-2 border-b border-slate-800/80 pb-2.5">
                  <span className="flex h-5 w-5 items-center justify-center rounded-lg bg-amber-500/20 text-amber-400 font-black text-[11px]">
                    2
                  </span>
                  <h2 className="text-xs font-black uppercase tracking-wider text-white">
                    {lang === 'en' ? 'Discount Type' : 'ប្រភេទនៃការបញ្ចុះតម្លៃ'}
                  </h2>
                </div>

                <div className="grid grid-cols-3 gap-2 text-xs">
                  {/* Percentage */}
                  <label
                    onClick={() => setDiscountType('PERCENTAGE')}
                    className={`flex flex-col items-center justify-center p-3 rounded-xl border cursor-pointer text-center transition ${
                      discountType === 'PERCENTAGE'
                        ? 'border-[#77BC1F] bg-green-500/10 text-white font-bold'
                        : 'border-slate-800 bg-slate-950 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <input
                      type="radio"
                      name="discountType"
                      checked={discountType === 'PERCENTAGE'}
                      onChange={() => setDiscountType('PERCENTAGE')}
                      className="accent-[#77BC1F] w-3.5 h-3.5 mb-1"
                    />
                    <p className="text-white font-bold text-xs">Percentage</p>
                    <p className="text-[10px] text-slate-500">(%)</p>
                  </label>

                  {/* Fixed Amount */}
                  <label
                    onClick={() => setDiscountType('FIXED_AMOUNT')}
                    className={`flex flex-col items-center justify-center p-3 rounded-xl border cursor-pointer text-center transition ${
                      discountType === 'FIXED_AMOUNT'
                        ? 'border-[#77BC1F] bg-green-500/10 text-white font-bold'
                        : 'border-slate-800 bg-slate-950 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <input
                      type="radio"
                      name="discountType"
                      checked={discountType === 'FIXED_AMOUNT'}
                      onChange={() => setDiscountType('FIXED_AMOUNT')}
                      className="accent-[#77BC1F] w-3.5 h-3.5 mb-1"
                    />
                    <p className="text-white font-bold text-xs">Fixed Amount</p>
                    <p className="text-[10px] text-slate-500">($)</p>
                  </label>

                  {/* Buy X Get Y */}
                  <label
                    onClick={() => setDiscountType('BUY_X_GET_Y')}
                    className={`flex flex-col items-center justify-center p-3 rounded-xl border cursor-pointer text-center transition ${
                      discountType === 'BUY_X_GET_Y'
                        ? 'border-indigo-500 bg-indigo-500/10 text-white font-bold'
                        : 'border-slate-800 bg-slate-950 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <input
                      type="radio"
                      name="discountType"
                      checked={discountType === 'BUY_X_GET_Y'}
                      onChange={() => setDiscountType('BUY_X_GET_Y')}
                      className="accent-indigo-500 w-3.5 h-3.5 mb-1"
                    />
                    <p className="text-white font-bold text-xs">Buy X Get Y</p>
                    <p className="text-[10px] text-slate-500">Free / Bonus</p>
                  </label>
                </div>
              </div>

              {/* Card 3: Active Date & Recurrent Schedule */}
              <div className="rounded-2xl border border-slate-800/90 bg-slate-900/70 p-4 space-y-3.5 shadow-lg">
                <div className="flex items-center gap-2 border-b border-slate-800/80 pb-2.5">
                  <span className="flex h-5 w-5 items-center justify-center rounded-lg bg-rose-500/20 text-rose-400 font-black text-[11px]">
                    3
                  </span>
                  <h2 className="text-xs font-black uppercase tracking-wider text-white">
                    {lang === 'en' ? 'Active Date' : 'កាលបរិច្ឆេទសុពលភាព'}
                  </h2>
                </div>

                <div className="space-y-3 text-xs">
                  {/* Interval vs Recurrent Segmented Tabs */}
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setDateType('INTERVAL')}
                      className={`py-2 px-3 rounded-xl border font-bold text-xs transition ${
                        dateType === 'INTERVAL'
                          ? 'border-rose-500 bg-rose-500/10 text-white'
                          : 'border-slate-800 bg-slate-950 text-slate-400 hover:border-slate-700'
                      }`}
                    >
                      Interval (Range)
                    </button>
                    <button
                      type="button"
                      onClick={() => setDateType('RECURRENT')}
                      className={`py-2 px-3 rounded-xl border font-bold text-xs transition ${
                        dateType === 'RECURRENT'
                          ? 'border-rose-500 bg-rose-500/10 text-white'
                          : 'border-slate-800 bg-slate-950 text-slate-400 hover:border-slate-700'
                      }`}
                    >
                      Recurrent (Cycle)
                    </button>
                  </div>

                  {/* Start Date & End Date */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block font-bold text-slate-400 uppercase text-[10px] mb-1">
                        Start Date
                      </label>
                      <input
                        type="date"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        onClick={(e) => {
                          try {
                            e.target.showPicker?.()
                          } catch (_) {}
                        }}
                        required
                        className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-1.5 text-white text-xs focus:border-rose-400 focus:outline-none cursor-pointer [color-scheme:dark]"
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-slate-400 uppercase text-[10px] mb-1">
                        End Date
                      </label>
                      <input
                        type="date"
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                        onClick={(e) => {
                          try {
                            e.target.showPicker?.()
                          } catch (_) {}
                        }}
                        required
                        className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-1.5 text-white text-xs focus:border-rose-400 focus:outline-none cursor-pointer [color-scheme:dark]"
                      />
                    </div>
                  </div>

                  {/* Recurrent Schedule: Days & Months */}
                  {dateType === 'RECURRENT' && (
                    <div className="pt-2 border-t border-slate-800 space-y-3">
                      {/* Days of Week */}
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="font-bold text-slate-300">Days of Week</span>
                          <label className="inline-flex items-center gap-1.5 cursor-pointer font-bold text-[#77BC1F]">
                            <input
                              type="checkbox"
                              checked={selectedDays.size === DAYS_OF_WEEK.length}
                              onChange={handleToggleAllDays}
                              className="w-3.5 h-3.5 accent-[#77BC1F] rounded"
                            />
                            <span>All Days</span>
                          </label>
                        </div>
                        <div className="grid grid-cols-7 gap-1">
                          {DAYS_OF_WEEK.map((d) => {
                            const isChecked = selectedDays.has(d.key)
                            return (
                              <button
                                type="button"
                                key={d.key}
                                onClick={() => handleToggleDay(d.key)}
                                className={`py-1.5 px-1 rounded-lg border text-[11px] font-bold transition text-center ${
                                  isChecked
                                    ? 'border-[#77BC1F] bg-green-500/15 text-white'
                                    : 'border-slate-800 bg-slate-950 text-slate-500 hover:border-slate-700'
                                }`}
                                title={d.full}
                              >
                                {d.label}
                              </button>
                            )
                          })}
                        </div>
                      </div>

                      {/* Months of Year */}
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="font-bold text-slate-300">Months of Year</span>
                          <label className="inline-flex items-center gap-1.5 cursor-pointer font-bold text-blue-400">
                            <input
                              type="checkbox"
                              checked={selectedMonths.size === MONTHS_OF_YEAR.length}
                              onChange={handleToggleAllMonths}
                              className="w-3.5 h-3.5 accent-blue-400 rounded"
                            />
                            <span>All Months</span>
                          </label>
                        </div>
                        <div className="grid grid-cols-6 gap-1">
                          {MONTHS_OF_YEAR.map((m) => {
                            const isChecked = selectedMonths.has(m.key)
                            return (
                              <button
                                type="button"
                                key={m.key}
                                onClick={() => handleToggleMonth(m.key)}
                                className={`py-1 px-1 rounded-lg border text-[10px] font-bold transition text-center ${
                                  isChecked
                                    ? 'border-blue-500 bg-blue-500/15 text-white'
                                    : 'border-slate-800 bg-slate-950 text-slate-500 hover:border-slate-700'
                                }`}
                              >
                                {m.label}
                              </button>
                            )
                          })}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* RIGHT COLUMN: Promotion Target & Discount Calculations (7 Cols on Large Screen) */}
            <div className="lg:col-span-7 space-y-4">

              {/* FLOW A: PERCENTAGE & FIXED AMOUNT */}
              {discountType !== 'BUY_X_GET_Y' && (
                <>
                  {/* Minimum Requirement Card */}
                  <div className="rounded-2xl border border-slate-800/90 bg-slate-900/70 p-4 sm:p-5 space-y-4 shadow-lg">
                    <div className="flex items-center gap-2 border-b border-slate-800/80 pb-2.5">
                      <span className="flex h-5 w-5 items-center justify-center rounded-lg bg-purple-500/20 text-purple-400 font-black text-[11px]">
                        4
                      </span>
                      <h2 className="text-xs font-black uppercase tracking-wider text-white">
                        {lang === 'en' ? 'Minimum Requirement' : 'លក្ខខណ្ឌតម្រូវអប្បបរមា'}
                      </h2>
                    </div>

                    <div className="space-y-2.5 text-xs">
                      {/* Entire Order */}
                      <label
                        onClick={() => setMinReqType('ENTIRE_ORDER')}
                        className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition ${
                          minReqType === 'ENTIRE_ORDER'
                            ? 'border-purple-500 bg-purple-500/10 text-white font-bold'
                            : 'border-slate-800 bg-slate-950 text-slate-400 hover:border-slate-700'
                        }`}
                      >
                        <input
                          type="radio"
                          name="minReqType"
                          checked={minReqType === 'ENTIRE_ORDER'}
                          onChange={() => setMinReqType('ENTIRE_ORDER')}
                          className="accent-purple-500 w-3.5 h-3.5"
                        />
                        <span>{lang === 'en' ? 'Entire Order' : 'ការបញ្ជាទិញទាំងមូល'}</span>
                      </label>

                      {/* Minimum Purchase Amount */}
                      <div
                        onClick={() => setMinReqType('MIN_PURCHASE_AMOUNT')}
                        className={`p-3 rounded-xl border cursor-pointer transition space-y-2.5 ${
                          minReqType === 'MIN_PURCHASE_AMOUNT'
                            ? 'border-purple-500 bg-purple-500/10 text-white font-bold'
                            : 'border-slate-800 bg-slate-950 text-slate-400 hover:border-slate-700'
                        }`}
                      >
                        <label className="flex items-center gap-3 cursor-pointer">
                          <input
                            type="radio"
                            name="minReqType"
                            checked={minReqType === 'MIN_PURCHASE_AMOUNT'}
                            onChange={() => setMinReqType('MIN_PURCHASE_AMOUNT')}
                            className="accent-purple-500 w-3.5 h-3.5"
                          />
                          <span>{lang === 'en' ? 'Minimum Purchase Amount' : 'ចំនួនទឹកប្រាក់ទិញអប្បបរមា'}</span>
                        </label>

                        {/* Textbox * Applies to entire order 0 $ */}
                        {minReqType === 'MIN_PURCHASE_AMOUNT' && (
                          <div className="pl-6 pt-1">
                            <label className="block text-[11px] font-bold text-slate-300 mb-1">
                              * Applies to entire order
                            </label>
                            <div className="relative w-48">
                              <input
                                type="number"
                                step="0.01"
                                value={minReqPurchaseAmount}
                                onChange={(e) => setMinReqPurchaseAmount(e.target.value)}
                                placeholder="0.00"
                                required
                                className="w-full rounded-xl border border-purple-400 bg-slate-950 px-3 py-1.5 text-white font-black text-sm focus:outline-none"
                                onClick={(e) => e.stopPropagation()}
                              />
                              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold">
                                $
                              </span>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Minimum Quantity of Products */}
                      <div
                        onClick={() => setMinReqType('MIN_QUANTITY')}
                        className={`p-3 rounded-xl border cursor-pointer transition space-y-2.5 ${
                          minReqType === 'MIN_QUANTITY'
                            ? 'border-purple-500 bg-purple-500/10 text-white font-bold'
                            : 'border-slate-800 bg-slate-950 text-slate-400 hover:border-slate-700'
                        }`}
                      >
                        <label className="flex items-center gap-3 cursor-pointer">
                          <input
                            type="radio"
                            name="minReqType"
                            checked={minReqType === 'MIN_QUANTITY'}
                            onChange={() => setMinReqType('MIN_QUANTITY')}
                            className="accent-purple-500 w-3.5 h-3.5"
                          />
                          <span>{lang === 'en' ? 'Minimum Quantity of Products' : 'ចំនួនបរិមាណទំនិញអប្បបរមា'}</span>
                        </label>

                        {/* Textbox * Minimum Quantity */}
                        {minReqType === 'MIN_QUANTITY' && (
                          <div className="pl-6 pt-1">
                            <label className="block text-[11px] font-bold text-slate-300 mb-1">
                              * Minimum Quantity
                            </label>
                            <div className="relative w-48">
                              <input
                                type="number"
                                min="1"
                                value={minReqQuantity}
                                onChange={(e) => setMinReqQuantity(e.target.value)}
                                placeholder="0"
                                required
                                className="w-full rounded-xl border border-purple-400 bg-slate-950 px-3 py-1.5 text-white font-black text-sm focus:outline-none"
                                onClick={(e) => e.stopPropagation()}
                              />
                              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs font-bold">
                                Items
                              </span>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Discount Value & Scope Card */}
                  <div className="rounded-2xl border border-slate-800/90 bg-slate-900/70 p-4 sm:p-5 space-y-4 shadow-lg">
                    <div className="flex items-center justify-between border-b border-slate-800/80 pb-2.5">
                      <div className="flex items-center gap-2">
                        <span className="flex h-5 w-5 items-center justify-center rounded-lg bg-emerald-500/20 text-emerald-400 font-black text-[11px]">
                          5
                        </span>
                        <h2 className="text-xs font-black uppercase tracking-wider text-white">
                          {lang === 'en' ? 'Discount Value' : 'តម្លៃបញ្ចុះ'}
                        </h2>
                      </div>
                      {/* Value Input Header Badge */}
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] font-bold text-slate-400 uppercase">Value:</span>
                        <div className="relative w-28">
                          <input
                            type="number"
                            step="0.01"
                            value={discountValue}
                            onChange={(e) => setDiscountValue(e.target.value)}
                            placeholder="0"
                            required
                            className="w-full rounded-lg border border-slate-700 bg-slate-950 px-2.5 py-1 text-emerald-400 text-sm font-black focus:border-emerald-400 focus:outline-none text-right pr-6"
                          />
                          <span className="absolute right-2 top-1/2 -translate-y-1/2 font-black text-xs text-slate-400">
                            {discountType === 'PERCENTAGE' ? '%' : '$'}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-3 text-xs">
                      {/* Scope Options */}
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                        <label
                          onClick={() => setDiscountScope('ENTIRE_ORDER')}
                          className={`flex items-center gap-2.5 p-2.5 rounded-xl border cursor-pointer transition ${
                            discountScope === 'ENTIRE_ORDER'
                              ? 'border-emerald-500 bg-emerald-500/10 text-white font-bold'
                              : 'border-slate-800 bg-slate-950 text-slate-400 hover:border-slate-700'
                          }`}
                        >
                          <input
                            type="radio"
                            name="discountScope"
                            checked={discountScope === 'ENTIRE_ORDER'}
                            onChange={() => setDiscountScope('ENTIRE_ORDER')}
                            className="accent-emerald-500 w-3.5 h-3.5"
                          />
                          <span className="truncate">Entire Order</span>
                        </label>

                        <label
                          onClick={() => setDiscountScope('SPECIFIC_PRODUCT_GROUP')}
                          className={`flex items-center gap-2.5 p-2.5 rounded-xl border cursor-pointer transition ${
                            discountScope === 'SPECIFIC_PRODUCT_GROUP'
                              ? 'border-emerald-500 bg-emerald-500/10 text-white font-bold'
                              : 'border-slate-800 bg-slate-950 text-slate-400 hover:border-slate-700'
                          }`}
                        >
                          <input
                            type="radio"
                            name="discountScope"
                            checked={discountScope === 'SPECIFIC_PRODUCT_GROUP'}
                            onChange={() => setDiscountScope('SPECIFIC_PRODUCT_GROUP')}
                            className="accent-emerald-500 w-3.5 h-3.5"
                          />
                          <span className="truncate">Specific Product Group</span>
                        </label>

                        <label
                          onClick={() => setDiscountScope('SPECIFIC_PRODUCT')}
                          className={`flex items-center gap-2.5 p-2.5 rounded-xl border cursor-pointer transition ${
                            discountScope === 'SPECIFIC_PRODUCT'
                              ? 'border-emerald-500 bg-emerald-500/10 text-white font-bold'
                              : 'border-slate-800 bg-slate-950 text-slate-400 hover:border-slate-700'
                          }`}
                        >
                          <input
                            type="radio"
                            name="discountScope"
                            checked={discountScope === 'SPECIFIC_PRODUCT'}
                            onChange={() => setDiscountScope('SPECIFIC_PRODUCT')}
                            className="accent-emerald-500 w-3.5 h-3.5"
                          />
                          <span className="truncate">Specific Product</span>
                        </label>
                      </div>

                      {/* Specific Product Group Table Section */}
                      {discountScope === 'SPECIFIC_PRODUCT_GROUP' && (
                        <div className="rounded-xl border border-emerald-500/30 bg-slate-950/80 p-3.5 space-y-3">
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                            <div>
                              <h3 className="text-xs font-black text-white">Specific Product Group</h3>
                              <p className="text-[10px] text-slate-400">
                                The type of product we choose determines how we manage inventory and reporting
                              </p>
                            </div>
                            <button
                              type="button"
                              onClick={() => {
                                setModalSearch('')
                                setShowGroupModal(true)
                              }}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#77BC1F] hover:bg-[#65a317] text-slate-950 font-black text-xs uppercase tracking-wider transition active:scale-95 shrink-0"
                            >
                              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4" />
                              </svg>
                              Add
                            </button>
                          </div>

                          <div className="overflow-x-auto rounded-lg border border-slate-800 max-h-52 overflow-y-auto">
                            <table className="w-full text-left border-collapse text-xs">
                              <thead className="sticky top-0 bg-slate-900 border-b border-slate-800 text-slate-400 font-bold uppercase text-[10px]">
                                <tr>
                                  <th className="py-2 px-3">Code</th>
                                  <th className="py-2 px-3">Description</th>
                                  <th className="py-2 px-3">Second Language</th>
                                  <th className="py-2 px-3 text-right">Action</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-800/60">
                                {selectedProductGroups.map((g, idx) => (
                                  <tr key={idx} className="hover:bg-slate-900/40">
                                    <td className="py-2 px-3 font-mono font-bold text-orange-400">{g.code}</td>
                                    <td className="py-2 px-3 font-semibold text-white">{g.description}</td>
                                    <td className="py-2 px-3 text-slate-400">{g.secondLanguage || '—'}</td>
                                    <td className="py-2 px-3 text-right">
                                      <button
                                        type="button"
                                        onClick={() => setSelectedProductGroups((prev) => prev.filter((_, i) => i !== idx))}
                                        className="text-rose-400 hover:text-rose-300 font-bold text-xs"
                                      >
                                        Remove
                                      </button>
                                    </td>
                                  </tr>
                                ))}
                                {selectedProductGroups.length === 0 && (
                                  <tr>
                                    <td colSpan={4} className="py-4 text-center text-slate-500 italic text-[11px]">
                                      No product group added yet. Click "+ Add" to choose from live database.
                                    </td>
                                  </tr>
                                )}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      )}

                      {/* Specific Product Table Section */}
                      {discountScope === 'SPECIFIC_PRODUCT' && (
                        <div className="rounded-xl border border-emerald-500/30 bg-slate-950/80 p-3.5 space-y-3">
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                            <div>
                              <h3 className="text-xs font-black text-white">Specific Product</h3>
                              <p className="text-[10px] text-slate-400">
                                The type of product we choose determines how we manage inventory and reporting
                              </p>
                            </div>
                            <button
                              type="button"
                              onClick={() => {
                                setModalSearch('')
                                setShowProductModal('discount')
                              }}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#77BC1F] hover:bg-[#65a317] text-slate-950 font-black text-xs uppercase tracking-wider transition active:scale-95 shrink-0"
                            >
                              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4" />
                              </svg>
                              Add
                            </button>
                          </div>

                          <div className="overflow-x-auto rounded-lg border border-slate-800 max-h-52 overflow-y-auto">
                            <table className="w-full text-left border-collapse text-xs">
                              <thead className="sticky top-0 bg-slate-900 border-b border-slate-800 text-slate-400 font-bold uppercase text-[10px]">
                                <tr>
                                  <th className="py-2 px-3">Code</th>
                                  <th className="py-2 px-3">Description</th>
                                  <th className="py-2 px-3">Second Language</th>
                                  <th className="py-2 px-3 text-right">Action</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-800/60">
                                {selectedSpecificProducts.map((p, idx) => (
                                  <tr key={idx} className="hover:bg-slate-900/40">
                                    <td className="py-2 px-3 font-mono font-bold text-orange-400">{p.code}</td>
                                    <td className="py-2 px-3 font-semibold text-white">{p.description}</td>
                                    <td className="py-2 px-3 text-slate-400">{p.secondLanguage || '—'}</td>
                                    <td className="py-2 px-3 text-right">
                                      <button
                                        type="button"
                                        onClick={() => setSelectedSpecificProducts((prev) => prev.filter((_, i) => i !== idx))}
                                        className="text-rose-400 hover:text-rose-300 font-bold text-xs"
                                      >
                                        Remove
                                      </button>
                                    </td>
                                  </tr>
                                ))}
                                {selectedSpecificProducts.length === 0 && (
                                  <tr>
                                    <td colSpan={4} className="py-4 text-center text-slate-500 italic text-[11px]">
                                      No product added yet. Click "+ Add" to choose from live database.
                                    </td>
                                  </tr>
                                )}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </>
              )}

              {/* FLOW B: BUY X GET Y DEDICATED SECTION */}
              {discountType === 'BUY_X_GET_Y' && (
                <div className="rounded-2xl border border-indigo-500/40 bg-slate-900/80 p-4 sm:p-5 space-y-4 shadow-xl">
                  <div className="border-b border-slate-800/90 pb-3 flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="flex h-5 w-5 items-center justify-center rounded-lg bg-indigo-500/20 text-indigo-400 font-black text-xs">
                          ★
                        </span>
                        <h2 className="text-sm font-black uppercase tracking-wider text-white">
                          Buy specific product to get another promotion
                        </h2>
                      </div>
                      <p className="text-[11px] text-indigo-300/80 mt-0.5">
                        Click and input promotion information
                      </p>
                    </div>
                  </div>

                  {/* Requirement Selection & Amount */}
                  <div className="p-3.5 rounded-xl border border-slate-800 bg-slate-950/70 space-y-3 text-xs">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      <label
                        onClick={() => setBuyXGetYRule('MIN_PURCHASE_AMOUNT')}
                        className={`flex items-center gap-2.5 p-2.5 rounded-xl border cursor-pointer transition ${
                          buyXGetYRule === 'MIN_PURCHASE_AMOUNT'
                            ? 'border-indigo-500 bg-indigo-500/10 text-white font-bold'
                            : 'border-slate-800 bg-slate-900 text-slate-400 hover:border-slate-700'
                        }`}
                      >
                        <input
                          type="radio"
                          name="buyXGetYRule"
                          checked={buyXGetYRule === 'MIN_PURCHASE_AMOUNT'}
                          onChange={() => setBuyXGetYRule('MIN_PURCHASE_AMOUNT')}
                          className="accent-indigo-500 w-3.5 h-3.5"
                        />
                        <span>Minimum Purchase Amount</span>
                      </label>

                      <label
                        onClick={() => setBuyXGetYRule('MIN_QUANTITY')}
                        className={`flex items-center gap-2.5 p-2.5 rounded-xl border cursor-pointer transition ${
                          buyXGetYRule === 'MIN_QUANTITY'
                            ? 'border-indigo-500 bg-indigo-500/10 text-white font-bold'
                            : 'border-slate-800 bg-slate-900 text-slate-400 hover:border-slate-700'
                        }`}
                      >
                        <input
                          type="radio"
                          name="buyXGetYRule"
                          checked={buyXGetYRule === 'MIN_QUANTITY'}
                          onChange={() => setBuyXGetYRule('MIN_QUANTITY')}
                          className="accent-indigo-500 w-3.5 h-3.5"
                        />
                        <span>Minimum Quantity of Products</span>
                      </label>
                    </div>

                    <div className="flex items-center gap-3 pt-1 border-t border-slate-800/80">
                      <label className="font-bold text-slate-400 uppercase text-[11px] shrink-0">
                        Amount:
                      </label>
                      <div className="relative w-40">
                        <input
                          type="number"
                          step="0.01"
                          value={buyXGetYAmount}
                          onChange={(e) => setBuyXGetYAmount(e.target.value)}
                          placeholder="0.00"
                          className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-1 text-white font-black text-xs focus:border-indigo-400 focus:outline-none"
                        />
                        <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 text-[11px] font-bold">
                          {buyXGetYRule === 'MIN_PURCHASE_AMOUNT' ? '$' : 'Qty'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Table 1: Buy the following product to get promotion */}
                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-xs font-black text-white">Buy the following product to get promotion</h3>
                        <p className="text-[10px] text-slate-400">Products the customer must purchase to trigger reward</p>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => setBuyProducts([])}
                          className="px-2.5 py-1 rounded-lg border border-slate-700 text-[11px] font-bold text-rose-400 hover:bg-rose-500/10 transition"
                        >
                          Clear
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setModalSearch('')
                            setShowProductModal('buy_x')
                          }}
                          className="inline-flex items-center gap-1 px-3 py-1 rounded-lg bg-[#77BC1F] hover:bg-[#65a317] text-slate-950 font-black text-xs uppercase tracking-wider transition active:scale-95"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4" />
                          </svg>
                          Add
                        </button>
                      </div>
                    </div>

                    <div className="overflow-x-auto rounded-xl border border-slate-800 max-h-48 overflow-y-auto">
                      <table className="w-full text-left border-collapse text-xs">
                        <thead className="sticky top-0 bg-slate-900 border-b border-slate-800 text-slate-400 font-bold uppercase text-[10px]">
                          <tr>
                            <th className="py-2 px-3">Code</th>
                            <th className="py-2 px-3">Description</th>
                            <th className="py-2 px-3">UOM</th>
                            <th className="py-2 px-3 text-right">Action</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800/60">
                          {buyProducts.map((p, idx) => (
                            <tr key={idx} className="hover:bg-slate-900/40">
                              <td className="py-1.5 px-3 font-mono font-bold text-orange-400">{p.code}</td>
                              <td className="py-1.5 px-3 font-semibold text-white">{p.description}</td>
                              <td className="py-1.5 px-3 text-slate-300">{p.uom || 'Pcs'}</td>
                              <td className="py-1.5 px-3 text-right">
                                <button
                                  type="button"
                                  onClick={() => setBuyProducts((prev) => prev.filter((_, i) => i !== idx))}
                                  className="text-rose-400 hover:text-rose-300 font-bold text-xs"
                                >
                                  Remove
                                </button>
                              </td>
                            </tr>
                          ))}
                          {buyProducts.length === 0 && (
                            <tr>
                              <td colSpan={4} className="py-4 text-center text-slate-500 italic text-[11px]">
                                No product added yet. Click "+ Add" to select items from live inventory.
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Table 2: List of promotion product (Rewards) */}
                  <div className="space-y-2.5 pt-1">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-xs font-black text-white">List of promotion product</h3>
                        <p className="text-[10px] text-slate-400">Bonus, free, or discounted products given to customer</p>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => setRewardProducts([])}
                          className="px-2.5 py-1 rounded-lg border border-slate-700 text-[11px] font-bold text-rose-400 hover:bg-rose-500/10 transition"
                        >
                          Clear
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setModalSearch('')
                            setShowProductModal('reward_y')
                          }}
                          className="inline-flex items-center gap-1 px-3 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-black text-xs uppercase tracking-wider transition active:scale-95"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4" />
                          </svg>
                          Add
                        </button>
                      </div>
                    </div>

                    <div className="overflow-x-auto rounded-xl border border-slate-800 max-h-48 overflow-y-auto">
                      <table className="w-full text-left border-collapse text-xs">
                        <thead className="sticky top-0 bg-slate-900 border-b border-slate-800 text-slate-400 font-bold uppercase text-[10px]">
                          <tr>
                            <th className="py-2 px-3">Code</th>
                            <th className="py-2 px-3">Description</th>
                            <th className="py-2 px-3">UOM</th>
                            <th className="py-2 px-3">Discount</th>
                            <th className="py-2 px-3">Value</th>
                            <th className="py-2 px-3">QTY</th>
                            <th className="py-2 px-3 text-right">Action</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800/60">
                          {rewardProducts.map((p, idx) => (
                            <tr key={idx} className="hover:bg-slate-900/40">
                              <td className="py-1.5 px-3 font-mono font-bold text-orange-400">{p.code}</td>
                              <td className="py-1.5 px-3 font-semibold text-white">{p.description}</td>
                              <td className="py-1.5 px-3 text-slate-300">{p.uom || 'Pcs'}</td>
                              <td className="py-1.5 px-3">
                                <select
                                  value={p.discountType || 'Free (100% OFF)'}
                                  onChange={(e) => {
                                    const val = e.target.value
                                    setRewardProducts((prev) =>
                                      prev.map((item, i) =>
                                        i === idx ? { ...item, discountType: val, value: val.includes('Free') ? '100%' : '50%' } : item
                                      )
                                    )
                                  }}
                                  className="rounded border border-slate-700 bg-slate-950 px-1.5 py-0.5 text-white text-[11px] focus:outline-none"
                                >
                                  <option value="Free (100% OFF)">Free (100% OFF)</option>
                                  <option value="Percentage">Percentage (%)</option>
                                  <option value="Fixed Amount">Fixed Amount ($)</option>
                                </select>
                              </td>
                              <td className="py-1.5 px-3">
                                <input
                                  type="text"
                                  value={p.value || '100%'}
                                  onChange={(e) => {
                                    const val = e.target.value
                                    setRewardProducts((prev) =>
                                      prev.map((item, i) => (i === idx ? { ...item, value: val } : item))
                                    )
                                  }}
                                  className="w-14 rounded border border-slate-700 bg-slate-950 px-1.5 py-0.5 text-white font-bold text-[11px] focus:outline-none"
                                />
                              </td>
                              <td className="py-1.5 px-3">
                                <input
                                  type="number"
                                  min="1"
                                  value={p.qty || 1}
                                  onChange={(e) => {
                                    const val = Number(e.target.value) || 1
                                    setRewardProducts((prev) =>
                                      prev.map((item, i) => (i === idx ? { ...item, qty: val } : item))
                                    )
                                  }}
                                  className="w-12 rounded border border-slate-700 bg-slate-950 px-1.5 py-0.5 text-white font-bold text-[11px] focus:outline-none"
                                />
                              </td>
                              <td className="py-1.5 px-3 text-right">
                                <button
                                  type="button"
                                  onClick={() => setRewardProducts((prev) => prev.filter((_, i) => i !== idx))}
                                  className="text-rose-400 hover:text-rose-300 font-bold text-xs"
                                >
                                  Remove
                                </button>
                              </td>
                            </tr>
                          ))}
                          {rewardProducts.length === 0 && (
                            <tr>
                              <td colSpan={7} className="py-4 text-center text-slate-500 italic text-[11px]">
                                No reward product added yet. Click "+ Add" to add free or discounted bonus items.
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </form>
      </div>

      {/* LIVE MODAL: SELECT PRODUCT GROUP */}
      {showGroupModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-lg rounded-2xl border border-slate-700 bg-slate-900 p-5 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                  Live Database: Select Product Group
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowGroupModal(false)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <input
              type="text"
              placeholder="Search product group by code or name..."
              value={modalSearch}
              onChange={(e) => setModalSearch(e.target.value)}
              className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2 text-xs text-white focus:outline-none focus:border-green-400"
              autoFocus
            />

            <div className="max-h-64 overflow-y-auto space-y-1 divide-y divide-slate-800/60 text-xs">
              {availableGroups
                .filter(
                  (g) =>
                    g.description.toLowerCase().includes(modalSearch.toLowerCase()) ||
                    g.code.toLowerCase().includes(modalSearch.toLowerCase()) ||
                    (g.secondLanguage && g.secondLanguage.toLowerCase().includes(modalSearch.toLowerCase()))
                )
                .map((g, idx) => {
                  const alreadyAdded = selectedProductGroups.some((item) => item.code === g.code)
                  return (
                    <div
                      key={idx}
                      className="flex items-center justify-between py-2.5 px-2 hover:bg-slate-800/60 rounded-lg transition"
                    >
                      <div>
                        <p className="font-bold text-white">{g.description}</p>
                        <p className="text-[11px] text-slate-400 font-mono">
                          {g.code} {g.secondLanguage ? `• ${g.secondLanguage}` : ''}
                        </p>
                      </div>
                      <button
                        type="button"
                        disabled={alreadyAdded}
                        onClick={() => {
                          setSelectedProductGroups((prev) => [...prev, g])
                          setShowGroupModal(false)
                        }}
                        className={`px-3 py-1 rounded-lg text-xs font-bold transition active:scale-95 ${
                          alreadyAdded
                            ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                            : 'bg-[#77BC1F] text-slate-950 hover:bg-[#65a317]'
                        }`}
                      >
                        {alreadyAdded ? 'Added' : 'Select'}
                      </button>
                    </div>
                  )
                })}
              {availableGroups.length === 0 && (
                <div className="py-6 text-center text-slate-500 italic">
                  No product groups found in database.
                </div>
              )}
            </div>

            <div className="flex justify-end pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setShowGroupModal(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 text-xs font-bold text-slate-300 hover:text-white"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* LIVE MODAL: SELECT PRODUCT (Discount Target, Buy X, or Reward Y) */}
      {showProductModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-lg rounded-2xl border border-slate-700 bg-slate-900 p-5 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                  {showProductModal === 'buy_x'
                    ? 'Select Qualifying Product to Buy'
                    : showProductModal === 'reward_y'
                    ? 'Select Promotion Reward Product'
                    : 'Select Specific Product for Discount'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowProductModal(null)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <input
              type="text"
              placeholder="Search product name or code..."
              value={modalSearch}
              onChange={(e) => setModalSearch(e.target.value)}
              className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2 text-xs text-white focus:outline-none focus:border-green-400"
              autoFocus
            />

            <div className="max-h-64 overflow-y-auto space-y-1 divide-y divide-slate-800/60 text-xs">
              {availableProducts
                .filter(
                  (p) =>
                    p.description.toLowerCase().includes(modalSearch.toLowerCase()) ||
                    p.code.toLowerCase().includes(modalSearch.toLowerCase())
                )
                .map((p, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between py-2.5 px-2 hover:bg-slate-800/60 rounded-lg transition"
                  >
                    <div>
                      <p className="font-bold text-white">{p.description}</p>
                      <p className="text-[11px] text-slate-400 font-mono">
                        {p.code} • {p.uom} • ${Number(p.basePrice || 0).toFixed(2)}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        if (showProductModal === 'discount') {
                          if (!selectedSpecificProducts.some((item) => item.code === p.code)) {
                            setSelectedSpecificProducts((prev) => [...prev, p])
                          }
                        } else if (showProductModal === 'buy_x') {
                          if (!buyProducts.some((item) => item.code === p.code)) {
                            setBuyProducts((prev) => [...prev, { code: p.code, description: p.description, uom: p.uom }])
                          }
                        } else if (showProductModal === 'reward_y') {
                          if (!rewardProducts.some((item) => item.code === p.code)) {
                            setRewardProducts((prev) => [
                              ...prev,
                              { code: p.code, description: p.description, uom: p.uom, discountType: 'Free (100% OFF)', value: '100%', qty: 1 }
                            ])
                          }
                        }
                        setShowProductModal(null)
                      }}
                      className="px-3 py-1 rounded-lg text-xs font-bold bg-[#77BC1F] text-slate-950 hover:bg-[#65a317] transition active:scale-95"
                    >
                      Select
                    </button>
                  </div>
                ))}
              {availableProducts.length === 0 && (
                <div className="py-6 text-center text-slate-500 italic">
                  No products found in live database.
                </div>
              )}
            </div>

            <div className="flex justify-end pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setShowProductModal(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 text-xs font-bold text-slate-300 hover:text-white"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* POPUP MODAL: MISSING INFORMATION */}
      {showValidationModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in">
          <div className="w-full max-w-md rounded-2xl border border-rose-500/30 bg-slate-900 p-6 space-y-5 shadow-2xl shadow-rose-950/40">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-rose-500/20 text-rose-400 border border-rose-500/30 shadow-inner">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-base font-black text-white">
                  {lang === 'en' ? 'Missing Information' : 'ព័ត៌មានដែលត្រូវការ'}
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  {lang === 'en'
                    ? 'Please review and fill in the required fields below before saving:'
                    : 'សូមបំពេញព័ត៌មានចាំបាច់ខាងក្រោម មុនពេលរក្សាទុក៖'}
                </p>
              </div>
            </div>

            <div className="max-h-60 overflow-y-auto space-y-2 rounded-xl bg-slate-950/80 p-3.5 border border-slate-800/80">
              {validationErrors.map((err, idx) => (
                <div key={idx} className="flex items-start gap-2.5 text-xs">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-rose-500/20 text-rose-400 font-bold text-[10px] mt-0.5">
                    {idx + 1}
                  </span>
                  <div>
                    <span className="font-bold text-rose-300">{err.title}: </span>
                    <span className="text-slate-300">{err.message}</span>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setShowValidationModal(false)}
                className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#77BC1F] to-[#5ea113] hover:from-[#65a317] hover:to-[#4e880e] text-slate-950 font-black text-xs uppercase tracking-wider shadow-lg shadow-green-500/20 transition active:scale-95"
              >
                {lang === 'en' ? 'Got it, Review Info' : 'យល់ព្រម ពិនិត្យឡើងវិញ'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
export default PromotionForm
