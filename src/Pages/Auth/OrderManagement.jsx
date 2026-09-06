import React, { useState, useMemo, useEffect } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useLanguage } from '../../context/LanguageContext'
import {
  adminSaleInvoiceAPI,
  adminReturnInvoiceAPI,
  orderAPI,
  adminTransferAPI,
  adminQuotationAPI,
  adminSaleOrderAPI,
  adminWebOrderAPI,
  adminShipmentAPI,
  adminReturnShipmentAPI,
} from '../../api/api'

// 3D & System Icons
import bagIcon from '../../assets/icon/3dicons-bag-dynamic-color.png'
import travelIcon from '../../assets/icon/3dicons-travel-dynamic-color.png'
import fileTextIcon from '../../assets/icon/3dicons-file-text-dynamic-color.png'
import clockIcon from '../../assets/icon/3dicons-clock-dynamic-color.png'
import moneyBagIcon from '../../assets/icon/3dicons-money-bag-dynamic-color.png'
import backwardIcon from '../../assets/icon/3dicons-backward-dynamic-color.png'
import fileNewIcon from '../../assets/icon/3dicons-file-new-dynamic-color.png'
import rocketIcon from '../../assets/icon/3dicons-rocket-dynamic-color.png'
import folderFavIcon from '../../assets/icon/3dicons-folder-fav-dynamic-color.png'
import copyIcon from '../../assets/icon/3dicons-copy-dynamic-color.png'
import dollarIcon from '../../assets/icon/3dicons-dollar-dynamic-color.png'
import mobileIcon from '../../assets/icon/3dicons-mobile-dynamic-color.png'
import creditCardIcon from '../../assets/icon/3dicons-credit-card-dynamic-color.png'
import targetIcon from '../../assets/icon/3dicons-target-dynamic-color.png'
import toolsIcon from '../../assets/icon/3dicons-tools-dynamic-color.png'
import shieldIcon from '../../assets/icon/3dicons-shield-dynamic-color.png'
import cubeIcon from '../../assets/icon/3dicons-cube-dynamic-color.png'
import walletIcon from '../../assets/icon/3dicons-wallet-dynamic-color.png'
import './ProductsHub.css'

// 5 ORDER MANAGEMENT SECTIONS (ProductsHub Style)
export const ORDER_CATEGORIES = [
  {
    key: 'quote-mgmt',
    streamKey: 'quotation',
    color: '#3B82F6',
    titleEn: 'Quote',
    titleKh: 'ការគ្រប់គ្រងសម្រង់តម្លៃ',
    descEn: 'Draft, negotiate and convert customer price quotes',
    descKh: 'រៀបចំ ចរចា និងបម្លែងសម្រង់តម្លៃជូនអតិថិជន',
  },
  {
    key: 'sales-orders',
    streamKey: 'saleOrder',
    color: '#10B981',
    titleEn: 'Sales Orders',
    titleKh: 'ការបញ្ជាទិញលក់ និងការបំពេញទំនិញ',
    descEn: 'Confirmed sales orders, barcode item picking, packing, and billing',
    descKh: 'ការបញ្ជាទិញលក់ដែលបានបញ្ជាក់ ការរើសទំនិញតាមបារកូដ និងវិក័យប័ត្រ',
  },
  {
    key: 'web-orders',
    streamKey: 'webOrder',
    color: '#F59E0B',
    titleEn: 'Web Orders',
    titleKh: 'ការបញ្ជាទិញលើគេហទំព័រ និង Omnichannel',
    descEn: 'E-commerce incoming orders, digital checkouts, and dispatching',
    descKh: 'ការបញ្ជាទិញតាមអ៊ីនធឺណិត ការទូទាត់ឌីជីថល និងការបញ្ជូនទំនិញ',
  },
  {
    key: 'shipment-logistics',
    streamKey: 'shipment',
    color: '#8B5CF6',
    titleEn: 'Shipment',
    titleKh: 'ភស្តុភារ និងការដឹកជញ្ជូន',
    descEn: 'Assign drivers, generate dispatch manifests, and track outbound parcels',
    descKh: 'ចាត់តាំងអ្នកបើកបរ បង្កើតប័ណ្ណដឹកទំនិញ និងតាមដានកញ្ចប់ដឹកជញ្ជូន',
  },
  {
    key: 'return-shipment',
    streamKey: 'returnShipment',
    color: '#EF4444',
    titleEn: 'Return Shipment',
    titleKh: 'ការបញ្ជូនត្រឡប់ និងការត្រួតពិនិត្យ RMA',
    descEn: 'Process customer returns, damaged goods inspection, and credit refunds',
    descKh: 'ដំណើរការការប្រគល់ទំនិញត្រឡប់ ពិនិត្យទំនិញខូចខាត និងការសងប្រាក់ត្រឡប់',
  },
]

// ALL INDIVIDUAL CARDS ORGANIZED BY CATEGORY (ProductsHub Style)
export const ORDER_HUB_ITEMS = [
  // 1. Quote Management
  {
    key: 'new-quote',
    category: 'quote-mgmt',
    icon: fileNewIcon,
    en: 'New Quotation',
    kh: 'សម្រង់តម្លៃថ្មី',
    descEn: 'Draft, negotiate and send professional price quotes to customers.',
    descKh: 'រៀបចំ ចរចា និងផ្ញើសម្រង់តម្លៃប្រកបដោយវិជ្ជាជីវៈជូនអតិថិជន។',
    color: '#3B82F6',
    bg: 'rgba(59, 130, 246, 0.12)',
    tag: 'Core',
    route: '/admin/quotation',
    statKey: 'quotation',
  },

  // 2. Sales Orders & Fulfillment
  {
    key: 'create-so',
    category: 'sales-orders',
    icon: bagIcon,
    en: 'Sales Orders',
    kh: 'បង្កើតការបញ្ជាទិញលក់',
    descEn: 'Register direct B2B and retail sales orders with inventory reservation.',
    descKh: 'ចុះបញ្ជីការបញ្ជាទិញលក់ B2B និងរាយ ជាមួយការកក់ទុកស្តុកទំនិញ។',
    color: '#10B981',
    bg: 'rgba(16, 185, 129, 0.12)',
    tag: 'Core',
    route: '/admin/sale-order',
    statKey: 'saleOrder',
  },

  // 3. Web Storefront & Omnichannel
  {
    key: 'web-orders-hub',
    category: 'web-orders',
    icon: mobileIcon,
    en: 'Web Orders',
    kh: 'មជ្ឈមណ្ឌលការបញ្ជាទិញវេបសាយ',
    descEn: 'Monitor real-time incoming orders from e-commerce storefront and mobile applications.',
    descKh: 'តាមដានការបញ្ជាទិញផ្ទាល់ពីគេហទំព័រអេឡិចត្រូនិក និងកម្មវិធីទូរស័ព្ទ។',
    color: '#F59E0B',
    bg: 'rgba(245, 158, 11, 0.12)',
    tag: 'Omnichannel',
    route: '/admin/web-order',
    statKey: 'webOrder',
  },

  // 4. Shipment & Delivery Logistics
  {
    key: 'shipment-logistics',
    category: 'shipment-logistics',
    icon: travelIcon,
    en: 'Shipment',
    kh: 'ភស្តុភារការដឹកជញ្ជូន',
    descEn: 'Assign couriers like J&T Express, Grab Express, VET Express, and fleet drivers.',
    descKh: 'ចាត់តាំងក្រុមហ៊ុនដឹកជញ្ជូន J&T, Grab, VET និងអ្នកបើកបរផ្ទាល់។',
    color: '#8B5CF6',
    bg: 'rgba(139, 92, 246, 0.12)',
    tag: 'Logistics',
    route: '/admin/shipment',
    statKey: 'shipment',
  },
  // 5. Return Shipment & RMA Inspections
  {
    key: 'return-rma',
    category: 'return-shipment',
    icon: backwardIcon,
    en: 'Return Shipment',
    kh: 'ការបញ្ជូនត្រឡប់ (RMA)',
    descEn: 'Register customer return requests, linked SO/invoice references, and return reasons.',
    descKh: 'ចុះឈ្មោះសំណើប្រគល់ទំនិញត្រឡប់ ភ្ជាប់ជាមួយ SO/វិក័យប័ត្រដើម និងមូលហេតុ។',
    color: '#EF4444',
    bg: 'rgba(239, 68, 68, 0.12)',
    tag: 'RMA',
    route: '/admin/return-shipment',
    statKey: 'returnShipment',
  },
]

// 5 Core Root Modules (for backwards compatibility)
export const ORDER_MODULES = [
  {
    key: 'quotation',
    category: 'quote-mgmt',
    icon: fileTextIcon,
    en: 'Quotation',
    kh: 'សម្រង់តម្លៃ',
    descEn: 'Draft, negotiate, track validity periods, and convert customer price quotes into sales orders.',
    descKh: 'រៀបចំ ចរចា តាមដានសុពលភាព និងបម្លែងសម្រង់តម្លៃជូនអតិថិជនទៅជាការបញ្ជាទិញលក់។',
    color: '#3B82F6',
    bg: 'rgba(59, 130, 246, 0.12)',
    tag: 'Quotation',
    route: '/admin/quotation',
    statKey: 'quotation',
  },
  {
    key: 'saleOrder',
    category: 'sales-orders',
    icon: bagIcon,
    en: 'Sale Order',
    kh: 'ការបញ្ជាទិញលក់',
    descEn: 'Manage confirmed B2B and retail sales orders, stock reservation, and billing schedules.',
    descKh: 'គ្រប់គ្រងការបញ្ជាទិញលក់ B2B និងរាយ ការបម្រុងទុកស្តុក និងកាលវិភាគវិក័យប័ត្រ។',
    color: '#10B981',
    bg: 'rgba(16, 185, 129, 0.12)',
    tag: 'Sales Order',
    route: '/admin/sale-order',
    statKey: 'saleOrder',
  },
  {
    key: 'webOrder',
    category: 'web-orders',
    icon: mobileIcon,
    en: 'Web Order',
    kh: 'ការបញ្ជាទិញលើគេហទំព័រ',
    descEn: 'Live customer orders streaming directly from the online supermarket storefront with instant sync.',
    descKh: 'ការបញ្ជាទិញផ្ទាល់ពីអតិថិជនតាមរយៈគេហទំព័រផ្សារទំនើប ជាមួយនឹងការធ្វើសមកាលកម្មភ្លាមៗ។',
    color: '#F59E0B',
    bg: 'rgba(245, 158, 11, 0.12)',
    tag: 'Web Order',
    route: '/admin/web-order',
    statKey: 'webOrder',
  },
  {
    key: 'shipment',
    category: 'shipment-logistics',
    icon: travelIcon,
    en: 'Shipment',
    kh: 'ការដឹកជញ្ជូន',
    descEn: 'Assign drivers, generate dispatch manifests, and track outbound parcels to recipient doorstep.',
    descKh: 'ចាត់តាំងអ្នកបើកបរ បង្កើតប័ណ្ណដឹកទំនិញ និងតាមដានកញ្ចប់ដឹកជញ្ជូនរហូតដល់ទ្វារផ្ទះ។',
    color: '#8B5CF6',
    bg: 'rgba(139, 92, 246, 0.12)',
    tag: 'Shipment',
    route: '/admin/shipment',
    statKey: 'shipment',
  },
  {
    key: 'returnShipment',
    category: 'return-shipment',
    icon: backwardIcon,
    en: 'Return Shipment',
    kh: 'ការបញ្ជូនត្រឡប់',
    descEn: 'Process customer returns, damaged goods inspection, RMA warranty replacements, and refunds.',
    descKh: 'ដំណើរការការប្រគល់ទំនិញត្រឡប់ ពិនិត្យទំនិញខូចខាត ការធានា និងការសងប្រាក់ត្រឡប់។',
    color: '#EF4444',
    bg: 'rgba(239, 68, 68, 0.12)',
    tag: 'Return Shipment',
    route: '/admin/return-shipment',
    statKey: 'returnShipment',
  },
]

// 5 Chart Streams Configuration
const CHART_OPTIONS = [
  {
    key: 'quotation',
    labelEn: 'Quotation',
    labelKh: 'សម្រង់តម្លៃ',
    icon: '📄',
    color: '#3B82F6',
    gradient: 'quotationGrad',
    accentBg: 'rgba(59, 130, 246, 0.15)',
    border: 'border-blue-500/40',
    unitEn: 'Quotes',
    unitKh: 'សម្រង់',
  },
  {
    key: 'saleOrder',
    labelEn: 'Sale Order',
    labelKh: 'ការបញ្ជាទិញលក់',
    icon: '📋',
    color: '#10B981',
    gradient: 'soGrad',
    accentBg: 'rgba(16, 185, 129, 0.15)',
    border: 'border-emerald-500/40',
    unitEn: 'Orders',
    unitKh: 'ការបញ្ជាទិញ',
  },
  {
    key: 'webOrder',
    labelEn: 'Web Order',
    labelKh: 'ការបញ្ជាទិញលើគេហទំព័រ',
    icon: '🌐',
    color: '#F59E0B',
    gradient: 'webOrderGrad',
    accentBg: 'rgba(245, 158, 11, 0.15)',
    border: 'border-amber-500/40',
    unitEn: 'Web Orders',
    unitKh: 'ការបញ្ជាទិញវេបសាយ',
  },
  {
    key: 'shipment',
    labelEn: 'Shipment',
    labelKh: 'ការដឹកជញ្ជូន',
    icon: '🚚',
    color: '#8B5CF6',
    gradient: 'shipmentGrad',
    accentBg: 'rgba(139, 92, 246, 0.15)',
    border: 'border-purple-500/40',
    unitEn: 'Shipments',
    unitKh: 'កញ្ចប់ដឹកជញ្ជូន',
  },
  {
    key: 'returnShipment',
    labelEn: 'Return Shipment',
    labelKh: 'ការបញ្ជូនត្រឡប់',
    icon: '↩️',
    color: '#EF4444',
    gradient: 'returnShipmentGrad',
    accentBg: 'rgba(239, 68, 68, 0.15)',
    border: 'border-red-500/40',
    unitEn: 'Returns',
    unitKh: 'ការប្រគល់ត្រឡប់',
  },
]

// Formatting helpers
const formatCurrency = (val) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(val || 0)
}

const formatNumber = (val) => {
  return new Intl.NumberFormat('en-US').format(val || 0)
}

function ChevronLeftIcon() {
  return (
    <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
      <path d="M15 19l-7-7 7-7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function ChevronIcon() {
  return (
    <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
      <path d="M9 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

export default function OrderManagement() {
  const { lang } = useLanguage()
  const location = useLocation()
  const navigate = useNavigate()
  const [searchQuery, setSearchQuery] = useState('')
  const [activeFilter, setActiveFilter] = useState('all')

  // Selected Option for Order Management Chart: 'quotation' | 'saleOrder' | 'webOrder' | 'shipment' | 'returnShipment' | 'compareAll'
  const [chartOption, setChartOption] = useState('saleOrder')
  // Metric Mode: 'amount' ($) vs 'volume' (count)
  const [chartMetric, setChartMetric] = useState('amount')
  const [hoveredPoint, setHoveredPoint] = useState(null)
  const [isLoadingData, setIsLoadingData] = useState(false)

  // Synchronize route with active chart option if navigated directly
  useEffect(() => {
    if (location.pathname.startsWith('/admin/quotation')) {
      setChartOption('quotation')
      setActiveFilter('quotation')
    } else if (location.pathname.startsWith('/admin/sale-order')) {
      setChartOption('saleOrder')
      setActiveFilter('saleOrder')
    } else if (location.pathname.startsWith('/admin/web-order')) {
      setChartOption('webOrder')
      setActiveFilter('webOrder')
    } else if (location.pathname.startsWith('/admin/shipment')) {
      setChartOption('shipment')
      setActiveFilter('shipment')
    } else if (location.pathname.startsWith('/admin/return-shipment')) {
      setChartOption('returnShipment')
      setActiveFilter('returnShipment')
    }
  }, [location.pathname])

  // Current calendar month context
  const monthContext = useMemo(() => {
    const today = new Date()
    const year = today.getFullYear()
    const month = today.getMonth() // 0-indexed
    const daysInMonth = new Date(year, month + 1, 0).getDate()
    const currentDay = today.getDate()

    const monthNamesEn = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ]
    const monthNamesKh = [
      'មករា', 'កុម្ភៈ', 'មីនា', 'មេសា', 'ឧសភា', 'មិថុនា',
      'កក្កដា', 'សីហា', 'កញ្ញា', 'តុលា', 'វិច្ឆិកា', 'ធ្នូ'
    ]

    return {
      year,
      month,
      daysInMonth,
      currentDay,
      monthNameEn: monthNamesEn[month],
      monthNameKh: monthNamesKh[month],
      labelEn: `${monthNamesEn[month]} ${year}`,
      labelKh: `${monthNamesKh[month]} ${year}`,
    }
  }, [])

  // Live database raw data state (strictly ready for live data, defaults to 0)
  const [liveData, setLiveData] = useState({
    quotations: [],
    saleOrders: [],
    webOrders: [],
    shipments: [],
    returnShipments: [],
    loaded: false,
  })

  // Fetch real data from backend APIs
  useEffect(() => {
    let isMounted = true
    setIsLoadingData(true)

    Promise.all([
      adminQuotationAPI.getAll().catch(() => []),
      adminSaleOrderAPI.getAll().catch(() => []),
      adminSaleInvoiceAPI.getAll().catch(() => []),
      adminWebOrderAPI.getAll().catch(() => []),
      orderAPI.getAll().catch(() => []),
      adminShipmentAPI.getAll().catch(() => []),
      adminTransferAPI.getAll().catch(() => []),
      adminReturnShipmentAPI.getAll().catch(() => []),
      adminReturnInvoiceAPI.getAll().catch(() => []),
    ])
      .then(([quoteRes, soRes, invRes, webRes, ordRes, shipRes, transRes, retShipRes, retInvRes]) => {
        if (!isMounted) return
        const parseList = (res) => (Array.isArray(res?.data) ? res.data : Array.isArray(res) ? res : [])

        const quotes = parseList(quoteRes)
        const saleOrders = parseList(soRes).length > 0 ? parseList(soRes) : parseList(invRes)
        const webOrders = parseList(webRes).length > 0 ? parseList(webRes) : parseList(ordRes)
        const shipments = parseList(shipRes).length > 0 ? parseList(shipRes) : parseList(transRes)
        const returnShipments = parseList(retShipRes).length > 0 ? parseList(retShipRes) : parseList(retInvRes)

        setLiveData({
          quotations: quotes,
          saleOrders,
          webOrders,
          shipments,
          returnShipments,
          loaded: true,
        })
        setIsLoadingData(false)
      })
      .catch(() => {
        if (isMounted) {
          setIsLoadingData(false)
          setLiveData((prev) => ({ ...prev, loaded: true }))
        }
      })

    return () => {
      isMounted = false
    }
  }, [])

  // Build day-by-day dataset for ALL days of the CURRENT month (strictly 0 when empty, ready for live data)
  const monthlyTimeline = useMemo(() => {
    const { year, month, daysInMonth, currentDay } = monthContext
    const days = []

    for (let day = 1; day <= daysInMonth; day++) {
      const d = new Date(year, month, day)
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
      const dayName = d.toLocaleDateString('en-US', { weekday: 'short' })
      const dayNameKhMap = { Sun: 'អាទិត្យ', Mon: 'ច័ន្ទ', Tue: 'អង្គារ', Wed: 'ពុធ', Thu: 'ព្រហ', Fri: 'សុក្រ', Sat: 'សៅរ៍' }
      const dayNameKh = dayNameKhMap[dayName] || dayName

      // Check for live database matching records on this exact calendar date
      const matchDay = (item) => {
        const rawDate =
          item.quotationDate ||
          item.saleOrderDate ||
          item.orderDate ||
          item.shipmentDate ||
          item.returnDate ||
          item.date ||
          item.createdAt ||
          item.invoiceDate ||
          ''
        return rawDate.slice(0, 10) === dateStr
      }

      const dayQuotes = (liveData.quotations || []).filter(matchDay)
      const daySOs = (liveData.saleOrders || []).filter(matchDay)
      const dayWebOrders = (liveData.webOrders || []).filter(matchDay)
      const dayShipments = (liveData.shipments || []).filter(matchDay)
      const dayReturns = (liveData.returnShipments || []).filter(matchDay)

      // 1. Quotation stream (Live data only, 0 if none)
      const qCount = dayQuotes.length
      const qAmount = Math.round(dayQuotes.reduce((sum, q) => sum + Number(q.grandTotal || q.total || q.amount || 0), 0) * 100) / 100

      // 2. Sale Order stream (Live data only, 0 if none)
      const soCount = daySOs.length
      const soAmount = Math.round(daySOs.reduce((sum, so) => sum + Number(so.grandTotal || so.total || so.amount || 0), 0) * 100) / 100

      // 3. Web Order stream (Live data only, 0 if none)
      const woCount = dayWebOrders.length
      const woAmount = Math.round(dayWebOrders.reduce((sum, wo) => sum + Number(wo.grandTotal || wo.total || wo.amount || 0), 0) * 100) / 100

      // 4. Shipment stream (Live data only, 0 if none)
      const shipCount = dayShipments.length
      const shipAmount = Math.round(dayShipments.reduce((sum, s) => sum + Number(s.amount || s.grandTotal || s.total || 0), 0) * 100) / 100

      // 5. Return Shipment stream (Live data only, 0 if none)
      const returnCount = dayReturns.length
      const returnAmount = Math.round(dayReturns.reduce((sum, r) => sum + Number(r.amount || r.grandTotal || r.total || 0), 0) * 100) / 100

      days.push({
        day,
        dateStr,
        dayName,
        dayNameKh,
        formattedDateEn: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        formattedDateKh: `${day} ${monthContext.monthNameKh}`,
        isToday: day === currentDay,
        isPast: day <= currentDay,
        isFuture: day > currentDay,
        quotation: {
          count: qCount,
          amount: qAmount,
          status: qCount > 0 ? `${qCount} Quotes` : '0 Quotes',
        },
        saleOrder: {
          count: soCount,
          amount: soAmount,
          status: soCount > 0 ? `${soCount} Confirmed` : '0 SO',
        },
        webOrder: {
          count: woCount,
          amount: woAmount,
          status: woCount > 0 ? `${woCount} Online` : '0 Web Orders',
        },
        shipment: {
          count: shipCount,
          amount: shipAmount,
          status: shipCount > 0 ? `${shipCount} Shipped` : '0 Shipments',
        },
        returnShipment: {
          count: returnCount,
          amount: returnAmount,
          status: returnCount > 0 ? `${returnCount} Returned` : '0 Returns',
        },
      })
    }

    return days
  }, [monthContext, liveData])

  // Aggregate Top 5 KPIs for Current Month (Starts at 0 and increments with live data)
  const currentMonthKPIs = useMemo(() => {
    let totalQuote = 0
    let quoteAmount = 0
    let totalSO = 0
    let soAmount = 0
    let totalWebOrder = 0
    let webOrderAmount = 0
    let totalShipment = 0
    let shipAmount = 0
    let totalReturnShipment = 0
    let returnShipAmount = 0

    monthlyTimeline.forEach((d) => {
      totalQuote += d.quotation.count
      quoteAmount += d.quotation.amount
      totalSO += d.saleOrder.count
      soAmount += d.saleOrder.amount
      totalWebOrder += d.webOrder.count
      webOrderAmount += d.webOrder.amount
      totalShipment += d.shipment.count
      shipAmount += d.shipment.amount
      totalReturnShipment += d.returnShipment.count
      returnShipAmount += d.returnShipment.amount
    })

    return {
      totalQuote,
      quoteAmount: Math.round(quoteAmount * 100) / 100,
      totalSO,
      soAmount: Math.round(soAmount * 100) / 100,
      totalWebOrder,
      webOrderAmount: Math.round(webOrderAmount * 100) / 100,
      totalShipment,
      shipAmount: Math.round(shipAmount * 100) / 100,
      totalReturnShipment,
      returnShipAmount: Math.round(returnShipAmount * 100) / 100,
      conversionRate: totalQuote > 0 ? Math.round((totalSO / totalQuote) * 1000) / 10 : 0,
      fulfillmentRate: totalSO > 0 ? Math.round((totalShipment / totalSO) * 1000) / 10 : 0,
      returnRate: shipAmount > 0 ? Math.round((returnShipAmount / shipAmount) * 1000) / 10 : 0,
    }
  }, [monthlyTimeline])

  // SVG Chart Dimensions & Math Coordinates (Defaults to 0 baseline if empty)
  const chartConfig = useMemo(() => {
    const width = 940
    const height = 300
    const padding = { top: 35, right: 35, bottom: 45, left: 65 }
    const innerWidth = width - padding.left - padding.right
    const innerHeight = height - padding.top - padding.bottom

    // Determine max value for Y-axis scaling
    let maxVal = 0
    if (chartOption === 'compareAll') {
      monthlyTimeline.forEach((d) => {
        CHART_OPTIONS.forEach((opt) => {
          const val = chartMetric === 'amount' ? d[opt.key].amount : d[opt.key].count
          if (val > maxVal) maxVal = val
        })
      })
    } else {
      monthlyTimeline.forEach((d) => {
        const val = chartMetric === 'amount' ? d[chartOption].amount : d[chartOption].count
        if (val > maxVal) maxVal = val
      })
    }

    // Clean scaling: if maxVal is 0, default headroom to 100 (for amount) or 10 (for count)
    const yMax = maxVal > 0 ? Math.ceil(maxVal * 1.2) : (chartMetric === 'amount' ? 100 : 10)

    // Coordinates mapper
    const pointsMap = {}
    CHART_OPTIONS.forEach((opt) => {
      pointsMap[opt.key] = monthlyTimeline.map((d, i) => {
        const val = chartMetric === 'amount' ? d[opt.key].amount : d[opt.key].count
        const x = padding.left + (i / Math.max(1, monthlyTimeline.length - 1)) * innerWidth
        const y = padding.top + innerHeight - (val / yMax) * innerHeight
        return {
          ...d,
          value: val,
          x,
          y,
          optKey: opt.key,
        }
      })
    })

    // Generate smooth Bézier SVG paths
    const generatePaths = (points) => {
      if (!points || points.length === 0) return { linePath: '', areaPath: '' }
      if (points.length === 1) {
        return {
          linePath: `M ${points[0].x},${points[0].y}`,
          areaPath: `M ${points[0].x},${points[0].y} L ${points[0].x},${padding.top + innerHeight} Z`,
        }
      }

      let linePath = `M ${points[0].x},${points[0].y}`
      for (let i = 0; i < points.length - 1; i++) {
        const current = points[i]
        const next = points[i + 1]
        const controlX = (current.x + next.x) / 2
        linePath += ` C ${controlX},${current.y} ${controlX},${next.y} ${next.x},${next.y}`
      }

      const baselineY = padding.top + innerHeight
      const areaPath = `${linePath} L ${points[points.length - 1].x},${baselineY} L ${points[0].x},${baselineY} Z`

      return { linePath, areaPath }
    }

    const pathsMap = {}
    CHART_OPTIONS.forEach((opt) => {
      pathsMap[opt.key] = generatePaths(pointsMap[opt.key])
    })

    // Peak point for currently selected option
    const activePoints = pointsMap[chartOption] || pointsMap['saleOrder'] || []
    let peakPoint = activePoints[0] || null
    activePoints.forEach((p) => {
      if (!peakPoint || p.value > peakPoint.value) {
        peakPoint = p
      }
    })

    // Y Axis ticks (4 intervals)
    const yTicks = [0, 0.25, 0.5, 0.75, 1].map((factor) => {
      const val = Math.round(yMax * factor)
      const y = padding.top + innerHeight - factor * innerHeight
      return { val, y }
    })

    return {
      width,
      height,
      padding,
      innerWidth,
      innerHeight,
      yMax,
      pointsMap,
      pathsMap,
      peakPoint,
      yTicks,
    }
  }, [monthlyTimeline, chartOption, chartMetric])

  // Active theme colors based on selected chart option
  const activeOptionMeta = useMemo(() => {
    return (
      CHART_OPTIONS.find((c) => c.key === chartOption) || {
        key: 'compareAll',
        labelEn: 'Compare All (5 in 1)',
        labelKh: 'ប្រៀបធៀបទាំងអស់ (៥ ក្នុង ១)',
        icon: '📊',
        color: '#06B6D4',
        accentBg: 'rgba(6, 182, 212, 0.15)',
        border: 'border-cyan-500/40',
        unitEn: 'Volume/Amount',
        unitKh: 'បរិមាណ/ទឹកប្រាក់',
      }
    )
  }, [chartOption])

  // Filter modules based on search and active category tab (ProductsHub pattern)
  const filteredHubItems = useMemo(() => {
    const q = searchQuery.trim().toLowerCase()
    let list = ORDER_HUB_ITEMS

    if (activeFilter !== 'all') {
      list = ORDER_HUB_ITEMS.filter((m) => m.category === activeFilter)
    }

    if (!q) return list

    return list.filter((m) => {
      const en = (m.en || '').toLowerCase()
      const kh = (m.kh || '').toLowerCase()
      const descEn = (m.descEn || '').toLowerCase()
      const descKh = (m.descKh || '').toLowerCase()
      const tag = (m.tag || '').toLowerCase()
      const key = (m.key || '').toLowerCase()
      return (
        en.includes(q) ||
        kh.includes(q) ||
        descEn.includes(q) ||
        descKh.includes(q) ||
        tag.includes(q) ||
        key.includes(q)
      )
    })
  }, [searchQuery, activeFilter])

  const displayedModules = filteredHubItems

  return (
    <div className="space-y-7 text-slate-100 pb-12" style={{ fontFamily: 'Montserrat, sans-serif' }}>
      {/* 1. HERO BANNER WITH CURRENT MONTH STATUS */}
      <section className="relative overflow-hidden rounded-3xl border border-blue-500/25 bg-gradient-to-br from-[#1b2433] via-[#0f172a] to-[#080d14] p-5 sm:p-7 shadow-2xl shadow-blue-500/10">
        <div className="pointer-events-none absolute -right-16 -top-20 h-64 w-64 rounded-full bg-blue-500/15 blur-3xl" />
        <div className="pointer-events-none absolute bottom-0 left-1/4 h-px w-2/3 bg-gradient-to-r from-transparent via-blue-500/40 to-transparent" />

        <div className="relative flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              <Link
                to="/admin"
                className="inline-flex items-center gap-2 rounded-full border border-slate-700/80 bg-slate-950/70 px-3.5 py-1.5 text-xs font-bold uppercase tracking-[0.18em] text-blue-300 transition hover:border-blue-400 hover:text-white active:scale-95"
              >
                <ChevronLeftIcon /> {lang === 'en' ? 'Dashboard' : 'ផ្ទាំងគ្រប់គ្រង'}
              </Link>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-[11px] font-bold text-emerald-400">
                <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                {lang === 'en' ? `Active Month: ${monthContext.labelEn}` : `ខែបច្ចុប្បន្ន: ${monthContext.labelKh}`}
              </span>
            </div>

            <div className="flex items-center gap-3.5">
              <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600/30 to-indigo-600/20 p-2 ring-1 ring-blue-400/30 shadow-lg shadow-blue-500/20">
                <img src={travelIcon} alt="" className="h-9 w-9 object-contain drop-shadow-md" />
              </span>
              <div>
                <p className="text-[11px] font-black uppercase tracking-[0.25em] text-blue-400">
                  {lang === 'en' ? "FreshMart Order Lifecycle & Operations" : 'ប្រតិបត្តិការ និងការគ្រប់គ្រងការបញ្ជាទិញ'}
                </p>
                <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
                  {lang === 'en' ? 'Order Management' : 'ការគ្រប់គ្រងការបញ្ជាទិញ'}
                </h1>
              </div>
            </div>

            <p className="max-w-2xl text-xs sm:text-sm leading-relaxed text-slate-300">
              {lang === 'en'
                ? `Executive operations control for Quotation, Sale Order, Web Order, Shipment, and Return Shipment across ${monthContext.labelEn}.`
                : `ការគ្រប់គ្រងប្រតិបត្តិការសម្រាប់ សម្រង់តម្លៃ ការបញ្ជាទិញលក់ ការបញ្ជាទិញលើគេហទំព័រ ការដឹកជញ្ជូន និងការបញ្ជូនត្រឡប់ សម្រាប់ខែ ${monthContext.labelKh}។`}
            </p>
          </div>

          {/* Quick Stat Pill Widget */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-2 lg:flex lg:flex-col shrink-0 min-w-[220px]">
            <div className="rounded-2xl border border-slate-800 bg-slate-950/80 p-3.5 shadow-md">
              <div className="flex items-center justify-between text-[11px] text-slate-400">
                <span>{lang === 'en' ? 'Month Progress' : 'ដំណើរការខែនេះ'}</span>
                <span className="text-blue-400 font-bold">
                  {Math.round((monthContext.currentDay / monthContext.daysInMonth) * 100)}%
                </span>
              </div>
              <p className="mt-1 font-mono text-xl font-black text-white">
                Day {monthContext.currentDay} / {monthContext.daysInMonth}
              </p>
            </div>

            <div className="rounded-2xl border border-slate-800 bg-slate-950/80 p-3.5 shadow-md">
              <div className="flex items-center justify-between text-[11px] text-slate-400">
                <span>{lang === 'en' ? 'Core Modules' : 'ម៉ូឌុលចម្បង'}</span>
                <span className="text-emerald-400 font-bold">● 5 Active</span>
              </div>
              <p className="mt-1 font-mono text-xs font-semibold text-slate-300">
                Quote · SO · Web · Ship · Return
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 2. THE 5 TOP KPI STAT CARDS (Total Quote, Total SO, SO Amount, Ship Amount, Return Ship Amount) */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-blue-500" />
            <h2 className="text-sm sm:text-base font-bold text-white uppercase tracking-wider">
              {lang === 'en' ? `Key Performance Indicators — ${monthContext.labelEn}` : `សូចនាករសំខាន់ៗ — ${monthContext.labelKh}`}
            </h2>
          </div>
          <span className="text-xs text-slate-400 font-mono">
            {lang === 'en' ? 'Click card to view on chart' : 'ចុចលើកាតដើម្បីមើលលើក្រាហ្វ'}
          </span>
        </div>

        <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 lg:grid-cols-5">
          {/* 1. TOTAL QUOTE */}
          <button
            type="button"
            onClick={() => {
              setChartOption('quotation')
              setActiveFilter('quotation')
            }}
            className={`group relative overflow-hidden rounded-2xl border p-4 text-left transition-all duration-300 hover:-translate-y-1 hover:shadow-xl active:scale-95 ${chartOption === 'quotation'
              ? 'border-blue-400 bg-gradient-to-br from-blue-500/25 via-slate-900 to-slate-950 ring-2 ring-blue-500/40 shadow-lg shadow-blue-500/20'
              : 'border-slate-800 bg-slate-900/80 hover:border-blue-500/50 hover:bg-slate-800/80'
              }`}
          >
            <div className="flex items-start justify-between gap-2">
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-500/15 ring-1 ring-blue-500/30">
                <img src={fileTextIcon} alt="" className="h-7 w-7 object-contain drop-shadow" />
              </span>
              <span className="rounded-full bg-blue-500/20 border border-blue-500/30 px-2 py-0.5 text-[10px] font-black text-blue-300 uppercase tracking-wider">
                Quote
              </span>
            </div>
            <div className="mt-3">
              <p className="text-xs font-semibold text-slate-400">
                {lang === 'en' ? 'Total Quote' : 'សម្រង់តម្លៃសរុប'}
              </p>
              <p className="text-2xl font-black text-white mt-0.5 font-mono">
                {formatNumber(currentMonthKPIs.totalQuote)}
              </p>
              <div className="mt-2 flex items-center justify-between text-[11px] border-t border-slate-800/80 pt-2 text-slate-400">
                <span className="truncate">{formatCurrency(currentMonthKPIs.quoteAmount)}</span>
                <span className="text-blue-400 font-bold">~{currentMonthKPIs.conversionRate}% Win</span>
              </div>
            </div>
          </button>

          {/* 2. TOTAL SO */}
          <button
            type="button"
            onClick={() => {
              setChartOption('saleOrder')
              setActiveFilter('saleOrder')
            }}
            className={`group relative overflow-hidden rounded-2xl border p-4 text-left transition-all duration-300 hover:-translate-y-1 hover:shadow-xl active:scale-95 ${chartOption === 'saleOrder'
              ? 'border-emerald-400 bg-gradient-to-br from-emerald-500/25 via-slate-900 to-slate-950 ring-2 ring-emerald-500/40 shadow-lg shadow-emerald-500/20'
              : 'border-slate-800 bg-slate-900/80 hover:border-emerald-500/50 hover:bg-slate-800/80'
              }`}
          >
            <div className="flex items-start justify-between gap-2">
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-500/15 ring-1 ring-emerald-500/30">
                <img src={bagIcon} alt="" className="h-7 w-7 object-contain drop-shadow" />
              </span>
              <span className="rounded-full bg-emerald-500/20 border border-emerald-500/30 px-2 py-0.5 text-[10px] font-black text-emerald-300 uppercase tracking-wider">
                Sales Order
              </span>
            </div>
            <div className="mt-3">
              <p className="text-xs font-semibold text-slate-400">
                {lang === 'en' ? 'Total SO' : 'ការបញ្ជាទិញលក់សរុប'}
              </p>
              <p className="text-2xl font-black text-white mt-0.5 font-mono">
                {formatNumber(currentMonthKPIs.totalSO)}
              </p>
              <div className="mt-2 flex items-center justify-between text-[11px] border-t border-slate-800/80 pt-2 text-slate-400">
                <span>{lang === 'en' ? 'Confirmed Orders' : 'បានបញ្ជាក់'}</span>
                <span className="text-emerald-400 font-bold">● Live</span>
              </div>
            </div>
          </button>

          {/* 3. SO AMOUNT */}
          <button
            type="button"
            onClick={() => {
              setChartOption('saleOrder')
              setChartMetric('amount')
              setActiveFilter('saleOrder')
            }}
            className={`group relative overflow-hidden rounded-2xl border p-4 text-left transition-all duration-300 hover:-translate-y-1 hover:shadow-xl active:scale-95 ${chartOption === 'saleOrder' && chartMetric === 'amount'
              ? 'border-teal-400 bg-gradient-to-br from-teal-500/25 via-slate-900 to-slate-950 ring-2 ring-teal-500/40 shadow-lg shadow-teal-500/20'
              : 'border-slate-800 bg-slate-900/80 hover:border-teal-500/50 hover:bg-slate-800/80'
              }`}
          >
            <div className="flex items-start justify-between gap-2">
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-teal-500/15 ring-1 ring-teal-500/30">
                <img src={moneyBagIcon} alt="" className="h-7 w-7 object-contain drop-shadow" />
              </span>
              <span className="rounded-full bg-teal-500/20 border border-teal-500/30 px-2 py-0.5 text-[10px] font-black text-teal-300 uppercase tracking-wider">
                Revenue
              </span>
            </div>
            <div className="mt-3">
              <p className="text-xs font-semibold text-slate-400">
                {lang === 'en' ? 'SO Amount' : 'ចំនួនទឹកប្រាក់បញ្ជាទិញ'}
              </p>
              <p className="text-xl sm:text-2xl font-black text-white mt-0.5 font-mono truncate">
                {formatCurrency(currentMonthKPIs.soAmount)}
              </p>
              <div className="mt-2 flex items-center justify-between text-[11px] border-t border-slate-800/80 pt-2 text-slate-400">
                <span>{lang === 'en' ? 'Gross Revenue' : 'ចំណូលសរុប'}</span>
                <span className="text-teal-400 font-bold">● Live</span>
              </div>
            </div>
          </button>

          {/* 4. SHIP AMOUNT */}
          <button
            type="button"
            onClick={() => {
              setChartOption('shipment')
              setChartMetric('amount')
              setActiveFilter('shipment')
            }}
            className={`group relative overflow-hidden rounded-2xl border p-4 text-left transition-all duration-300 hover:-translate-y-1 hover:shadow-xl active:scale-95 ${chartOption === 'shipment'
              ? 'border-purple-400 bg-gradient-to-br from-purple-500/25 via-slate-900 to-slate-950 ring-2 ring-purple-500/40 shadow-lg shadow-purple-500/20'
              : 'border-slate-800 bg-slate-900/80 hover:border-purple-500/50 hover:bg-slate-800/80'
              }`}
          >
            <div className="flex items-start justify-between gap-2">
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-purple-500/15 ring-1 ring-purple-500/30">
                <img src={travelIcon} alt="" className="h-7 w-7 object-contain drop-shadow" />
              </span>
              <span className="rounded-full bg-purple-500/20 border border-purple-500/30 px-2 py-0.5 text-[10px] font-black text-purple-300 uppercase tracking-wider">
                Shipment
              </span>
            </div>
            <div className="mt-3">
              <p className="text-xs font-semibold text-slate-400">
                {lang === 'en' ? 'Ship Amount' : 'ចំនួនទឹកប្រាក់ដឹកជញ្ជូន'}
              </p>
              <p className="text-xl sm:text-2xl font-black text-white mt-0.5 font-mono truncate">
                {formatCurrency(currentMonthKPIs.shipAmount)}
              </p>
              <div className="mt-2 flex items-center justify-between text-[11px] border-t border-slate-800/80 pt-2 text-slate-400">
                <span>{currentMonthKPIs.totalShipment} parcels</span>
                <span className="text-purple-400 font-bold">{currentMonthKPIs.fulfillmentRate}% Shipped</span>
              </div>
            </div>
          </button>

          {/* 5. RETURN SHIP AMOUNT */}
          <button
            type="button"
            onClick={() => {
              setChartOption('returnShipment')
              setChartMetric('amount')
              setActiveFilter('returnShipment')
            }}
            className={`group relative overflow-hidden rounded-2xl border p-4 text-left transition-all duration-300 hover:-translate-y-1 hover:shadow-xl active:scale-95 ${chartOption === 'returnShipment'
              ? 'border-red-400 bg-gradient-to-br from-red-500/25 via-slate-900 to-slate-950 ring-2 ring-red-500/40 shadow-lg shadow-red-500/20'
              : 'border-slate-800 bg-slate-900/80 hover:border-red-500/50 hover:bg-slate-800/80'
              }`}
          >
            <div className="flex items-start justify-between gap-2">
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-red-500/15 ring-1 ring-red-500/30">
                <img src={backwardIcon} alt="" className="h-7 w-7 object-contain drop-shadow" />
              </span>
              <span className="rounded-full bg-red-500/20 border border-red-500/30 px-2 py-0.5 text-[10px] font-black text-red-300 uppercase tracking-wider">
                Returns
              </span>
            </div>
            <div className="mt-3">
              <p className="text-xs font-semibold text-slate-400">
                {lang === 'en' ? 'Return Ship Amount' : 'ទឹកប្រាក់បញ្ជូនត្រឡប់'}
              </p>
              <p className="text-xl sm:text-2xl font-black text-white mt-0.5 font-mono truncate">
                {formatCurrency(currentMonthKPIs.returnShipAmount)}
              </p>
              <div className="mt-2 flex items-center justify-between text-[11px] border-t border-slate-800/80 pt-2 text-slate-400">
                <span>{currentMonthKPIs.totalReturnShipment} returned</span>
                <span className="text-red-400 font-bold">{currentMonthKPIs.returnRate}% Return Rate</span>
              </div>
            </div>
          </button>
        </div>
      </section>

      {/* 3. ORDER MANAGEMENT CHART (Current Month with 5 Options) */}
      <section className="relative overflow-hidden rounded-3xl border border-slate-800 bg-gradient-to-br from-[#121824] via-[#0f172a] to-[#0a0e17] p-5 sm:p-7 shadow-2xl shadow-black/40 space-y-5">
        {/* Glow ambient background behind the active curve */}
        <div
          className="pointer-events-none absolute -right-16 -top-16 h-72 w-72 rounded-full blur-3xl opacity-20 transition-all duration-500"
          style={{ background: activeOptionMeta.color }}
        />

        {/* Chart Header Bar */}
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between border-b border-slate-800/90 pb-4">
          <div>
            <div className="flex items-center gap-2.5">
              <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-slate-800 text-lg shadow-inner">
                {activeOptionMeta.icon}
              </span>
              <h2 className="text-lg sm:text-xl font-black text-white tracking-tight">
                {lang === 'en' ? 'Order Management Chart' : 'ក្រាហ្វគ្រប់គ្រងការបញ្ជាទិញ'}
              </h2>
              <span className="rounded-full bg-blue-500/15 border border-blue-500/30 px-2.5 py-0.5 text-[11px] font-black text-blue-300">
                {monthContext.labelEn}
              </span>
              {isLoadingData && (
                <span className="inline-flex items-center gap-1 text-[11px] text-slate-400 animate-pulse">
                  <span className="h-1.5 w-1.5 rounded-full bg-blue-400" />
                  Syncing...
                </span>
              )}
            </div>
            <p className="mt-1 text-xs text-slate-400">
              {lang === 'en'
                ? `Order Management performance by current month across 5 options: Quotation, Sale Order, Web Order, Shipment, and Return Shipment.`
                : `ប្រតិបត្តិការបញ្ជាទិញតាមខែបច្ចុប្បន្ន ជាមួយ ៥ ជម្រើស: សម្រង់តម្លៃ ការបញ្ជាទិញលក់ ការបញ្ជាទិញលើវេបសាយ ការដឹកជញ្ជូន និងការបញ្ជូនត្រឡប់។`}
            </p>
          </div>

          {/* Metric Selector (Amount vs Count) */}
          <div className="flex items-center gap-2 self-start lg:self-center">
            <div className="flex items-center gap-1 rounded-xl bg-slate-950 p-1 border border-slate-800">
              <button
                type="button"
                onClick={() => setChartMetric('amount')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${chartMetric === 'amount'
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                  : 'text-slate-400 hover:text-white hover:bg-slate-850'
                  }`}
              >
                <span>💵</span>
                <span>{lang === 'en' ? 'Amount ($)' : 'ទឹកប្រាក់ ($)'}</span>
              </button>
              <button
                type="button"
                onClick={() => setChartMetric('volume')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${chartMetric === 'volume'
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                  : 'text-slate-400 hover:text-white hover:bg-slate-850'
                  }`}
              >
                <span>📦</span>
                <span>{lang === 'en' ? 'Volume (Count)' : 'ចំនួន (រាប់)'}</span>
              </button>
            </div>
          </div>
        </div>

        {/* 5 OPTIONS SELECTOR PILLS BAR */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-thin">
          {CHART_OPTIONS.map((opt) => {
            const isSelected = chartOption === opt.key
            return (
              <button
                key={opt.key}
                type="button"
                onClick={() => {
                  setChartOption(opt.key)
                  setActiveFilter(opt.key)
                }}
                className={`flex items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-bold transition-all whitespace-nowrap active:scale-95 ${isSelected
                  ? 'text-white shadow-lg'
                  : 'bg-slate-900/90 text-slate-400 border border-slate-800 hover:text-white hover:border-slate-700'
                  }`}
                style={{
                  background: isSelected
                    ? `linear-gradient(135deg, ${opt.color}dd, ${opt.color}88)`
                    : undefined,
                  boxShadow: isSelected ? `0 4px 14px ${opt.color}40` : undefined,
                }}
              >
                <span>{opt.icon}</span>
                <span>{lang === 'kh' ? opt.labelKh : opt.labelEn}</span>
                <span
                  className={`rounded-full px-1.5 py-0.2 text-[10px] font-mono ${isSelected ? 'bg-black/30 text-white' : 'bg-slate-800 text-slate-400'
                    }`}
                >
                  {chartMetric === 'amount'
                    ? formatCurrency(
                      opt.key === 'quotation'
                        ? currentMonthKPIs.quoteAmount
                        : opt.key === 'saleOrder'
                          ? currentMonthKPIs.soAmount
                          : opt.key === 'webOrder'
                            ? currentMonthKPIs.webOrderAmount
                            : opt.key === 'shipment'
                              ? currentMonthKPIs.shipAmount
                              : currentMonthKPIs.returnShipAmount
                    )
                    : formatNumber(
                      opt.key === 'quotation'
                        ? currentMonthKPIs.totalQuote
                        : opt.key === 'saleOrder'
                          ? currentMonthKPIs.totalSO
                          : opt.key === 'webOrder'
                            ? currentMonthKPIs.totalWebOrder
                            : opt.key === 'shipment'
                              ? currentMonthKPIs.totalShipment
                              : currentMonthKPIs.totalReturnShipment
                    )}
                </span>
              </button>
            )
          })}

          {/* 6th Toggle: Compare All (5 in 1) */}
          <button
            type="button"
            onClick={() => {
              setChartOption('compareAll')
              setActiveFilter('all')
            }}
            className={`flex items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-bold transition-all whitespace-nowrap active:scale-95 ${chartOption === 'compareAll'
              ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-lg shadow-cyan-500/20 ring-1 ring-cyan-400'
              : 'bg-slate-900/90 text-slate-400 border border-slate-800 hover:text-white hover:border-slate-700'
              }`}
          >
            <span>📊</span>
            <span>{lang === 'en' ? 'Compare All (5 in 1)' : 'ប្រៀបធៀបទាំងអស់'}</span>
          </button>
        </div>

        {/* INTERACTIVE SVG CHART VIEWPORT */}
        <div className="relative w-full rounded-2xl border border-slate-800/80 bg-slate-950/90 p-4 sm:p-5 select-none">
          <svg
            viewBox={`0 0 ${chartConfig.width} ${chartConfig.height}`}
            className="w-full h-auto overflow-visible"
            onMouseLeave={() => setHoveredPoint(null)}
          >
            <defs>
              {/* Gradients for each of the 5 options */}
              <linearGradient id="quotationGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#3B82F6" stopOpacity="0.45" />
                <stop offset="70%" stopColor="#3B82F6" stopOpacity="0.08" />
                <stop offset="100%" stopColor="#3B82F6" stopOpacity="0" />
              </linearGradient>

              <linearGradient id="soGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#10B981" stopOpacity="0.45" />
                <stop offset="70%" stopColor="#10B981" stopOpacity="0.08" />
                <stop offset="100%" stopColor="#10B981" stopOpacity="0" />
              </linearGradient>

              <linearGradient id="webOrderGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#F59E0B" stopOpacity="0.45" />
                <stop offset="70%" stopColor="#F59E0B" stopOpacity="0.08" />
                <stop offset="100%" stopColor="#F59E0B" stopOpacity="0" />
              </linearGradient>

              <linearGradient id="shipmentGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#8B5CF6" stopOpacity="0.45" />
                <stop offset="70%" stopColor="#8B5CF6" stopOpacity="0.08" />
                <stop offset="100%" stopColor="#8B5CF6" stopOpacity="0" />
              </linearGradient>

              <linearGradient id="returnShipmentGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#EF4444" stopOpacity="0.45" />
                <stop offset="70%" stopColor="#EF4444" stopOpacity="0.08" />
                <stop offset="100%" stopColor="#EF4444" stopOpacity="0" />
              </linearGradient>
            </defs>

            {/* Y Axis Grid Lines & Numeric Labels */}
            {chartConfig.yTicks.map((tick, idx) => (
              <g key={idx} className="transition-all">
                <line
                  x1={chartConfig.padding.left}
                  y1={tick.y}
                  x2={chartConfig.width - chartConfig.padding.right}
                  y2={tick.y}
                  stroke="#334155"
                  strokeWidth="1"
                  strokeDasharray={idx === 0 ? '0' : '4 4'}
                  opacity={idx === 0 ? 0.8 : 0.4}
                />
                <text
                  x={chartConfig.padding.left - 10}
                  y={tick.y + 4}
                  textAnchor="end"
                  fill="#94a3b8"
                  fontSize="11"
                  fontWeight="600"
                  fontFamily="monospace"
                >
                  {chartMetric === 'amount'
                    ? tick.val >= 1000
                      ? `$${(tick.val / 1000).toFixed(1)}k`
                      : `$${tick.val}`
                    : tick.val}
                </text>
              </g>
            ))}

            {/* Today Marker Line */}
            {(() => {
              const todayPoint = (chartConfig.pointsMap[chartOption === 'compareAll' ? 'saleOrder' : chartOption] || []).find(
                (p) => p.isToday
              )
              if (!todayPoint) return null
              return (
                <g>
                  <line
                    x1={todayPoint.x}
                    y1={chartConfig.padding.top}
                    x2={todayPoint.x}
                    y2={chartConfig.padding.top + chartConfig.innerHeight}
                    stroke="#60a5fa"
                    strokeWidth="1.5"
                    strokeDasharray="4 3"
                    opacity="0.8"
                  />
                  <rect
                    x={todayPoint.x - 22}
                    y={chartConfig.padding.top - 18}
                    width="44"
                    height="16"
                    rx="8"
                    fill="#1d4ed8"
                  />
                  <text
                    x={todayPoint.x}
                    y={chartConfig.padding.top - 6}
                    textAnchor="middle"
                    fill="#ffffff"
                    fontSize="9"
                    fontWeight="bold"
                  >
                    TODAY
                  </text>
                </g>
              )
            })()}

            {/* CURVES & AREAS */}
            {chartOption === 'compareAll' ? (
              // Multi-line overlay when Compare All is selected
              CHART_OPTIONS.map((opt) => {
                const paths = chartConfig.pathsMap[opt.key]
                return (
                  <g key={opt.key}>
                    <path
                      d={paths.linePath}
                      fill="none"
                      stroke={opt.color}
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      opacity="0.9"
                    />
                  </g>
                )
              })
            ) : (
              // Single Option with smooth gradient area
              <g>
                <path
                  d={chartConfig.pathsMap[chartOption]?.areaPath}
                  fill={`url(#${activeOptionMeta.gradient})`}
                />
                <path
                  d={chartConfig.pathsMap[chartOption]?.linePath}
                  fill="none"
                  stroke={activeOptionMeta.color}
                  strokeWidth="3"
                  strokeLinecap="round"
                  className="drop-shadow-md"
                />

                {/* Peak Day Annotation */}
                {chartConfig.peakPoint && (
                  <g>
                    <circle
                      cx={chartConfig.peakPoint.x}
                      cy={chartConfig.peakPoint.y}
                      r="5.5"
                      fill="#ffffff"
                      stroke={activeOptionMeta.color}
                      strokeWidth="3"
                      className="animate-pulse"
                    />
                    <rect
                      x={chartConfig.peakPoint.x - 45}
                      y={chartConfig.peakPoint.y - 28}
                      width="90"
                      height="20"
                      rx="6"
                      fill="#0f172a"
                      stroke={activeOptionMeta.color}
                      strokeWidth="1.2"
                    />
                    <text
                      x={chartConfig.peakPoint.x}
                      y={chartConfig.peakPoint.y - 14}
                      textAnchor="middle"
                      fill="#ffffff"
                      fontSize="10"
                      fontWeight="bold"
                      fontFamily="monospace"
                    >
                      Peak: {chartMetric === 'amount' ? formatCurrency(chartConfig.peakPoint.value) : `${chartConfig.peakPoint.value} ${activeOptionMeta.unitEn}`}
                    </text>
                  </g>
                )}
              </g>
            )}

            {/* Interactive Data Points & Hover Targets */}
            {monthlyTimeline.map((item, idx) => {
              const activePoints = chartConfig.pointsMap[chartOption === 'compareAll' ? 'saleOrder' : chartOption] || []
              const point = activePoints[idx]
              if (!point) return null

              const isHovered = hoveredPoint?.day === item.day

              return (
                <g key={item.day}>
                  {/* Vertical Hover Guide Line */}
                  {isHovered && (
                    <line
                      x1={point.x}
                      y1={chartConfig.padding.top}
                      x2={point.x}
                      y2={chartConfig.padding.top + chartConfig.innerHeight}
                      stroke="#94a3b8"
                      strokeWidth="1"
                      strokeDasharray="2 2"
                      opacity="0.8"
                    />
                  )}

                  {/* Dot on Line */}
                  {(chartOption !== 'compareAll' || isHovered) && (
                    <circle
                      cx={point.x}
                      cy={point.y}
                      r={isHovered ? 6 : item.isToday ? 4.5 : 2.5}
                      fill={isHovered ? '#ffffff' : activeOptionMeta.color}
                      stroke={isHovered ? activeOptionMeta.color : '#0f172a'}
                      strokeWidth={isHovered ? 3 : 1.5}
                      className="transition-all duration-150"
                    />
                  )}

                  {/* Invisible broad column for easy hovering */}
                  <rect
                    x={point.x - chartConfig.innerWidth / (monthlyTimeline.length * 2)}
                    y={chartConfig.padding.top}
                    width={chartConfig.innerWidth / monthlyTimeline.length}
                    height={chartConfig.innerHeight + chartConfig.padding.bottom}
                    fill="transparent"
                    className="cursor-pointer"
                    onMouseEnter={() => setHoveredPoint(item)}
                  />

                  {/* X Axis Day Label */}
                  {(item.day === 1 || item.day === 5 || item.day === 10 || item.day === 15 || item.day === 20 || item.day === 25 || item.day === monthContext.daysInMonth || item.isToday) && (
                    <text
                      x={point.x}
                      y={chartConfig.height - 12}
                      textAnchor="middle"
                      fill={item.isToday ? '#60a5fa' : '#94a3b8'}
                      fontSize={item.isToday ? '11' : '10'}
                      fontWeight={item.isToday ? 'bold' : '500'}
                      fontFamily="monospace"
                    >
                      {item.isToday ? `D${item.day}*` : `D${item.day}`}
                    </text>
                  )}
                </g>
              )
            })}
          </svg>

          {/* FLOATING HOVER TOOLTIP CARD */}
          {hoveredPoint && (
            <div
              className="pointer-events-none absolute z-30 transform -translate-x-1/2 -translate-y-full rounded-xl border border-slate-700/80 bg-slate-900/95 p-3 shadow-2xl backdrop-blur-md min-w-[210px] space-y-2 transition-all duration-100"
              style={{
                left: `${(chartConfig.pointsMap['saleOrder']?.[hoveredPoint.day - 1]?.x /
                  chartConfig.width) *
                  100
                  }%`,
                top: '38%',
              }}
            >
              {/* Header */}
              <div className="flex items-center justify-between border-b border-slate-800 pb-1.5 text-xs">
                <span className="font-bold text-white font-mono">
                  {lang === 'kh' ? hoveredPoint.formattedDateKh : hoveredPoint.formattedDateEn}
                </span>
                <span className="text-[10px] text-slate-400 font-mono">
                  {lang === 'kh' ? hoveredPoint.dayNameKh : hoveredPoint.dayName}
                  {hoveredPoint.isToday && ' · Today'}
                </span>
              </div>

              {/* Data Content */}
              {chartOption === 'compareAll' ? (
                <div className="space-y-1 text-xs">
                  {CHART_OPTIONS.map((opt) => (
                    <div key={opt.key} className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-1.5">
                        <span className="h-2 w-2 rounded-full" style={{ background: opt.color }} />
                        <span className="text-slate-300">{lang === 'kh' ? opt.labelKh : opt.labelEn}</span>
                      </div>
                      <span className="font-mono font-bold text-white">
                        {chartMetric === 'amount'
                          ? formatCurrency(hoveredPoint[opt.key].amount)
                          : `${hoveredPoint[opt.key].count} ${opt.unitEn}`}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="space-y-1 text-xs">
                  <div className="flex items-center justify-between text-slate-300">
                    <span>{lang === 'en' ? 'Amount' : 'ទឹកប្រាក់'}:</span>
                    <span className="font-mono font-black text-white text-sm">
                      {formatCurrency(hoveredPoint[chartOption]?.amount)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-slate-300">
                    <span>{lang === 'en' ? 'Order Volume' : 'ចំនួន'}:</span>
                    <span className="font-mono font-bold text-blue-300">
                      {hoveredPoint[chartOption]?.count} {activeOptionMeta.unitEn}
                    </span>
                  </div>
                  <div className="text-[10px] text-slate-400 pt-1 border-t border-slate-800 flex items-center justify-between">
                    <span>Status:</span>
                    <span className="text-emerald-400 font-semibold">{hoveredPoint[chartOption]?.status || 'Active'}</span>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* 4 SUMMARY STATS UNDER THE CHART */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 pt-2">
          <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-3.5">
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              {lang === 'en' ? 'Month Total Volume' : 'ចំនួនសរុបប្រចាំខែ'}
            </p>
            <p className="mt-1 font-mono text-lg font-black text-white">
              {chartMetric === 'amount'
                ? formatCurrency(
                  chartOption === 'quotation'
                    ? currentMonthKPIs.quoteAmount
                    : chartOption === 'saleOrder'
                      ? currentMonthKPIs.soAmount
                      : chartOption === 'webOrder'
                        ? currentMonthKPIs.webOrderAmount
                        : chartOption === 'shipment'
                          ? currentMonthKPIs.shipAmount
                          : chartOption === 'returnShipment'
                            ? currentMonthKPIs.returnShipAmount
                            : currentMonthKPIs.soAmount + currentMonthKPIs.webOrderAmount
                )
                : formatNumber(
                  chartOption === 'quotation'
                    ? currentMonthKPIs.totalQuote
                    : chartOption === 'saleOrder'
                      ? currentMonthKPIs.totalSO
                      : chartOption === 'webOrder'
                        ? currentMonthKPIs.totalWebOrder
                        : chartOption === 'shipment'
                          ? currentMonthKPIs.totalShipment
                          : chartOption === 'returnShipment'
                            ? currentMonthKPIs.totalReturnShipment
                            : currentMonthKPIs.totalSO + currentMonthKPIs.totalWebOrder
                )}
            </p>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-3.5">
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              {lang === 'en' ? 'Daily Average' : 'មធ្យមភាគប្រចាំថ្ងៃ'}
            </p>
            <p className="mt-1 font-mono text-lg font-black text-white">
              {chartMetric === 'amount'
                ? formatCurrency(
                  (chartOption === 'quotation'
                    ? currentMonthKPIs.quoteAmount
                    : chartOption === 'saleOrder'
                      ? currentMonthKPIs.soAmount
                      : chartOption === 'webOrder'
                        ? currentMonthKPIs.webOrderAmount
                        : chartOption === 'shipment'
                          ? currentMonthKPIs.shipAmount
                          : chartOption === 'returnShipment'
                            ? currentMonthKPIs.returnShipAmount
                            : currentMonthKPIs.soAmount) / monthContext.daysInMonth
                )
                : `${(
                  (chartOption === 'quotation'
                    ? currentMonthKPIs.totalQuote
                    : chartOption === 'saleOrder'
                      ? currentMonthKPIs.totalSO
                      : chartOption === 'webOrder'
                        ? currentMonthKPIs.totalWebOrder
                        : chartOption === 'shipment'
                          ? currentMonthKPIs.totalShipment
                          : chartOption === 'returnShipment'
                            ? currentMonthKPIs.totalReturnShipment
                            : currentMonthKPIs.totalSO) / monthContext.daysInMonth
                ).toFixed(1)} / day`}
            </p>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-3.5">
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              {lang === 'en' ? 'Peak Day Volume' : 'ថ្ងៃដែលខ្ពស់បំផុត'}
            </p>
            <p className="mt-1 font-mono text-lg font-black text-white">
              {chartConfig.peakPoint
                ? chartMetric === 'amount'
                  ? formatCurrency(chartConfig.peakPoint.value)
                  : `${chartConfig.peakPoint.value} orders`
                : '---'}
            </p>
            <p className="text-[10px] text-slate-400 font-mono mt-0.5">
              Day {chartConfig.peakPoint?.day || 1} ({chartConfig.peakPoint?.formattedDateEn})
            </p>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-3.5">
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              {lang === 'en' ? 'Success & Fulfillment' : 'អត្រាជោគជ័យ'}
            </p>
            <p className="mt-1 font-mono text-lg font-black text-emerald-400">
              {chartOption === 'returnShipment'
                ? `${currentMonthKPIs.returnRate}% Returned`
                : chartOption === 'quotation'
                  ? `${currentMonthKPIs.conversionRate}% Approved`
                  : `${currentMonthKPIs.fulfillmentRate}% Fulfilled`}
            </p>
            <p className="text-[10px] text-slate-400 font-mono mt-0.5">
              Across current month pipeline
            </p>
          </div>
        </div>
      </section>

      {/* 4. DYNAMIC SEARCH & CATEGORY FILTER BAR (ProductsHub Pattern) */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between rounded-2xl border border-slate-800/80 bg-[#1e293b]/70 backdrop-blur-md p-3.5 shadow-lg">
        {/* Search Input */}
        <div className="relative flex-1 max-w-md">
          <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 text-xs">
            🔍
          </span>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={
              lang === 'en'
                ? 'Quick search any order module (e.g. Quotation, Sale Order, Web, Carriers, RMA...)'
                : 'ស្វែងរកម៉ូឌុលរហ័ស (ឧ. សម្រង់តម្លៃ, ការបញ្ជាទិញលក់, វេបសាយ, ដឹកជញ្ជូន, RMA...)'
            }
            className="w-full rounded-xl border border-slate-700/80 bg-slate-950/90 py-2 pl-9 pr-8 text-xs font-semibold text-white placeholder-slate-500 outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-400/20"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white text-xs"
            >
              ✕
            </button>
          )}
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-thin">
          {[
            { key: 'all', en: 'All Modules', kh: 'ទាំងអស់', count: ORDER_HUB_ITEMS.length },
            ...ORDER_CATEGORIES.map((cat) => ({
              key: cat.key,
              en: cat.titleEn,
              kh: cat.titleKh,
              count: ORDER_HUB_ITEMS.filter((it) => it.category === cat.key).length,
              color: cat.color,
            })),
          ].map((tab) => {
            const isSelected = activeFilter === tab.key
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => {
                  setActiveFilter(tab.key)
                  const matchedCat = ORDER_CATEGORIES.find((c) => c.key === tab.key)
                  if (matchedCat) setChartOption(matchedCat.streamKey)
                }}
                className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold transition whitespace-nowrap active:scale-95 ${isSelected
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30 ring-1 ring-blue-400'
                  : 'bg-slate-900/80 text-slate-400 border border-slate-700/60 hover:text-white hover:border-slate-500'
                  }`}
              >
                <span>{lang === 'kh' ? tab.kh : tab.en}</span>
                <span
                  className={`rounded-full px-1.5 py-0.2 text-[10px] font-mono ${isSelected ? 'bg-slate-950 text-blue-300' : 'bg-slate-800 text-slate-400'
                    }`}
                >
                  {tab.count}
                </span>
              </button>
            )
          })}
        </div>
      </div>

      {/* 5. ORDER MANAGEMENT MODULES - ALL IN ONE PLACE */}
      {filteredHubItems.length > 0 && (
        <section className="rounded-3xl border border-slate-800 bg-slate-900/80 p-5 sm:p-6 shadow-xl shadow-black/20 space-y-5">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between pb-3 border-b border-slate-800/80">
            <div className="flex items-center gap-3">
              <div className="h-5 w-1.5 rounded-full bg-blue-500" />
              <div>
                <h2 className="text-base sm:text-lg font-bold text-white font-['Montserrat']">
                  {lang === 'en' ? 'Order Management Modules' : 'ម៉ូឌុលគ្រប់គ្រងការបញ្ជាទិញ'}
                </h2>
                <p className="text-[11px] text-slate-400">
                  {lang === 'en'
                    ? 'Core order lifecycle: Quotation, Sales Orders, Web Orders, Shipment, and Return Shipment'
                    : 'វដ្តជីវិតបញ្ជាទិញចម្បង៖ សម្រង់តម្លៃ, ការបញ្ជាទិញលក់, វេបសាយ, ការដឹកជញ្ជូន និងការបញ្ជូនត្រឡប់'}
                </p>
              </div>
            </div>
            <span className="text-xs font-mono text-slate-400 bg-slate-800/80 px-2.5 py-1 rounded-full border border-slate-700/60 w-fit">
              {filteredHubItems.length} {filteredHubItems.length === 1 ? 'module' : 'modules'}
            </span>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5">
            {filteredHubItems.map((item) => {
              const isChartActive = chartOption === item.statKey
              const isImg =
                typeof item.icon === 'string' &&
                (item.icon.includes('/') || item.icon.endsWith('.png'))

              return (
                <div
                  key={item.key}
                  onClick={() => navigate(item.route)}
                  className={`hub-card group relative flex flex-col justify-between rounded-2xl border p-4 sm:p-5 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-black/40 active:scale-[0.98] cursor-pointer select-none ${
                    isChartActive
                      ? 'border-blue-500/60 bg-[#161f2e] ring-1 ring-blue-500/30'
                      : 'border-slate-800 bg-slate-950/60 hover:border-slate-700 hover:bg-slate-950'
                  }`}
                >
                  {/* Ambient glow */}
                  <div
                    className="pointer-events-none absolute -right-8 -top-8 h-28 w-28 rounded-full opacity-10 blur-2xl transition-opacity group-hover:opacity-25"
                    style={{ background: item.color }}
                  />

                  <div>
                    <div className="flex items-center justify-between mb-3.5">
                      <span
                        className="flex h-12 w-12 items-center justify-center rounded-xl p-2 ring-1 ring-white/10 shadow-md shadow-black/30 transition-transform duration-300 group-hover:scale-110"
                        style={{ background: item.bg, borderColor: `${item.color}40` }}
                      >
                        {isImg ? (
                          <img
                            src={item.icon}
                            alt=""
                            className="h-8 w-8 object-contain drop-shadow-md"
                          />
                        ) : (
                          <span className="text-xl">{item.icon}</span>
                        )}
                      </span>

                      {item.tag && (
                        <span
                          className="rounded-full px-2 py-0.5 text-[9px] font-black uppercase tracking-wider font-mono shadow-sm"
                          style={{
                            background: item.bg,
                            color: item.color,
                            border: `1px solid ${item.color}40`,
                          }}
                        >
                          {item.tag}
                        </span>
                      )}
                    </div>

                    <h3 className="text-sm sm:text-base font-bold text-white font-['Montserrat'] group-hover:text-blue-300 transition-colors">
                      {lang === 'kh' ? item.kh : item.en}
                    </h3>

                    <p className="mt-1 text-xs leading-relaxed text-slate-400 line-clamp-2">
                      {lang === 'kh' ? item.descKh : item.descEn}
                    </p>
                  </div>

                  {/* Bottom action: Open Module link */}
                  <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between">
                    <span
                      className="inline-flex items-center gap-1.5 text-xs font-bold transition-transform group-hover:translate-x-1"
                      style={{ color: item.color }}
                    >
                      <span>{lang === 'en' ? 'Open Module' : 'បើកដំណើរការ'}</span>
                      <ChevronIcon />
                    </span>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation()
                        setChartOption(item.statKey)
                        window.scrollTo({ top: 120, behavior: 'smooth' })
                      }}
                      className="text-[11px] text-slate-500 hover:text-white transition p-1 hover:bg-slate-800/80 rounded-lg"
                      title="View on Chart"
                    >
                      📊
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        </section>
      )}

      {/* Empty Search State */}
      {filteredHubItems.length === 0 && (
        <div className="rounded-2xl border border-dashed border-slate-700 bg-slate-950/60 p-12 text-center space-y-3">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-900 text-3xl">
            🔍
          </div>
          <p className="text-sm font-bold text-white">
            {lang === 'en' ? `No order module found matching "${searchQuery}"` : `រកមិនឃើញម៉ូឌុលត្រូវនឹង "${searchQuery}" ទេ`}
          </p>
          <p className="text-xs text-slate-400">
            {lang === 'en'
              ? 'Try searching for Quotation, Sale Order, Web, Shipment, or Return RMA.'
              : 'សូមស្វែងរក សម្រង់តម្លៃ ការបញ្ជាទិញលក់ វេបសាយ ការដឹកជញ្ជូន ឬការបញ្ជូនត្រឡប់។'}
          </p>
          <button
            type="button"
            onClick={() => setSearchQuery('')}
            className="rounded-xl border border-slate-700 bg-slate-800 px-4 py-1.5 text-xs font-bold text-white transition hover:bg-slate-700"
          >
            {lang === 'en' ? 'Clear Search' : 'សម្អាតការស្វែងរក'}
          </button>
        </div>
      )}
    </div>
  )
}
