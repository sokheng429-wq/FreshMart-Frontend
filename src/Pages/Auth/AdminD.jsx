import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { adminProductAPI, applicationAPI, jobAPI, memberAPI, userAPI } from '../../api/api'
import { useLanguage } from '../../context/LanguageContext'
import { useNotifications } from '../../context/NotificationContext'
import { useAuth } from '../../context/AuthContext'
import DashboardOverview from './Dashboard/DashboardOverview'
import LanguageSwitcher from '../../components/LanguageSwitcher'
import sunIcon from '../../assets/icon/3dicons-sun-dynamic-color.png'
import bagIcon from '../../assets/icon/3dicons-bag-dynamic-color.png'
import targetIcon from '../../assets/icon/3dicons-target-dynamic-color.png'
import mailIcon from '../../assets/icon/3dicons-mail-dynamic-color.png'
import trophyIcon from '../../assets/icon/3dicons-trophy-dynamic-color.png'
import shieldIcon from '../../assets/icon/3dicons-shield-dynamic-color.png'
import giftIcon from '../../assets/icon/3dicons-gift-box-dynamic-color.png'
import travelIcon from '../../assets/icon/3dicons-travel-dynamic-color.png'
import linkIcon from '../../assets/icon/3dicons-link-dynamic-color.png'
import toolsIcon from '../../assets/icon/3dicons-tools-dynamic-color.png'
import canIcon from '../../assets/icon/3dicons-can-dynamic-color.png'
import rocketIcon from '../../assets/icon/3dicons-rocket-dynamic-color.png'
import cupIcon from '../../assets/icon/3dicons-cup-dynamic-color.png'
import boyIcon from '../../assets/icon/3dicons-boy-dynamic-color.png'
import AddProducts from './AddProducts'
import Addjobs from './Addjobs'
import AddMember from './Addmember'
import ManageUsers from './ManageUsers'
import Addpromotion from './Addpromotion'
import AddPartner from './AddPartner'
import AddDriver from './AddDriver'
import ProductsHub, { PRODUCT_SECTIONS, STOCK_OPERATIONS } from './ProductsHub'
import InformationHub from './InformationHub'
import SettingsHub from './SettingsHub'
import SettingsDetail from './SettingsDetail'
import SaleDashboard from './SaleDashboard'
import CustomerList from './CustomerList'
import CustomerForm from './CustomerForm'
import CustomerGroupList from './CustomerGroupList'
import OrderManagement from './OrderManagement'
import QuotationList from './QuotationList'
import SaleOrderList from './SaleOrderList'
import WebOrderList from './WebOrderList'
import ShipmentList from './ShipmentList'
import ReturnShipmentList from './ReturnShipmentList'
import ConsignmentManagement from './ConsignmentManagement'
import ConsignmentList from './ConsignmentList'
import SalePayment from './SalePayment'
import CustomerDepositList from './CustomerDepositList'
import ARCollectionList from './ARCollectionList'
import CustomerRefundList from './CustomerRefundList'
import PaymentTermList from './PaymentTermList'
import AgingInvoiceList from './AgingInvoiceList'
import PurchaseManagement from './PurchaseManagement'
import InventoryOrderList from './InventoryOrderList'
import RequisitionList from './RequisitionList'
import PurchaseOrderList from './PurchaseOrderList'
import ReceiptPOList from './ReceiptPOList'
import ReturnReceiptPOList from './ReturnReceiptPOList'
import { SaleInvoiceList } from './SaleInvoiceList'
import { SaleInvoiceCreate } from './SaleInvoiceCreate'
import { PendingInvoiceList } from './PendingInvoiceList'
import { ReturnInvoiceList } from './ReturnInvoiceList'
import { PromotionList } from './PromotionList'
import { PromotionForm } from './PromotionForm'
import FreightManagement from './FreightManagement'
import ShipmentTariffList from './ShipmentTariffList'
import ShipmentMethodList from './ShipmentMethodList'
import PendingReceiptPOList from './PendingReceiptPOList'
import PayableManagement from './PayableManagement'
import CashBook from './CashBook'
import CashInOutList from './CashInOutList'
import Employee from './Employee'
import Report from './Report'
import Integration from './Integration'
import { StocksList } from './StocksList'
import CatalogSection from './CatalogSection'
import MasterDataSection from './MasterDataSection'
import ProductGroups from './ProductGroups'
import Categories from './Categories'
import Brands from './Brands'
import Attributes from './Attributes'
import { Units } from './Units'
import SupplierGroups from './SupplierGroups'
import { Suppliers } from './Suppliers'
import TransactionSection from './TransactionSection'
import RequestTransferSection from './RequestTransferSection'
import ShipRequestTransferSection from './ShipRequestTransferSection'
import TransferProductsSection from './TransferProductsSection'
import ProductsQuantitiesSection from './ProductsQuantitiesSection'
import PrintLabelSection from './PrintLabelSection'
import ProductScaleSection from './ProductScaleSection'
import ChangeAttributeSection from './ChangeAttributeSection'
import CostChangeSection from './CostChangeSection'
import SerialInformationSection from './SerialInformationSection'
import ProductsSupplierSection from './ProductsSupplierSection'
import ToolsSection from './ToolsSection'
import MemberList from './MemberList'
import MemberForm from './MemberForm'
import MemberDetailPage from './MemberDetailPage'
import Applications from './Applications'
import ActivityHistory from './ActivityHistory'

const EMPTY_DASHBOARD_DATA = {
  products: null,
  jobs: null,
  members: null,
  applications: null,
  users: null,
}

const CATEGORY_META = [
  { key: 'Fruits & Vegetables', label: { en: 'Fruits & Vegetables', kh: 'ផ្លែឈើ និងបន្លែ' }, color: '#4caf50' },
  { key: 'Meat & Seafood', label: { en: 'Meat & Seafood', kh: 'សាច់ និងគ្រឿងសមុទ្រ' }, color: '#f44336' },
  { key: 'Dairy & Eggs', label: { en: 'Dairy & Eggs', kh: 'ទឹកដោះគោ និងស៊ុត' }, color: '#ff9800' },
  { key: 'Bakery & Bread', label: { en: 'Bakery & Bread', kh: 'នំប៉័ង និងនំ' }, color: '#795548' },
  { key: 'Drinks', label: { en: 'Drinks', kh: 'ភេសជ្ជៈ' }, color: '#2196f3' },
  { key: 'Snacks', label: { en: 'Snacks', kh: 'អាហារសម្រន់' }, color: '#9c27b0' },
  { key: 'Other', label: { en: 'Other', kh: 'ផ្សេងទៀត' }, color: '#64748b' },
]

const CATEGORY_FALLBACK_COLORS = ['#14b8a6', '#ec4899', '#8b5cf6', '#f97316', '#06b6d4']
const MONTHS = [
  { en: 'Jan', kh: 'មករា' }, { en: 'Feb', kh: 'កុម្ភៈ' }, { en: 'Mar', kh: 'មីនា' },
  { en: 'Apr', kh: 'មេសា' }, { en: 'May', kh: 'ឧសភា' }, { en: 'Jun', kh: 'មិថុនា' },
  { en: 'Jul', kh: 'កក្កដា' }, { en: 'Aug', kh: 'សីហា' }, { en: 'Sep', kh: 'កញ្ញា' },
  { en: 'Oct', kh: 'តុលា' }, { en: 'Nov', kh: 'វិច្ឆិកា' }, { en: 'Dec', kh: 'ធ្នូ' },
]

const toTimestamp = (value) => {
  if (typeof value === 'number') return Number.isFinite(value) ? value : null
  if (typeof value !== 'string' || !value.trim()) return null
  const timestamp = Date.parse(value)
  return Number.isFinite(timestamp) ? timestamp : null
}

const formatRelativeTime = (timestamp, lang) => {
  if (!Number.isFinite(timestamp)) return '—'

  const difference = Math.max(0, new Date().getTime() - timestamp)
  const minutes = Math.floor(difference / 60000)
  const hours = Math.floor(difference / 3600000)
  const days = Math.floor(difference / 86400000)

  if (minutes < 1) return lang === 'en' ? 'Just now' : 'មុននេះ'
  if (minutes < 60) return lang === 'en' ? `${minutes}m ago` : `${minutes}នាទីមុន`
  if (hours < 24) return lang === 'en' ? `${hours}h ago` : `${hours}ម៉ោងមុន`
  return lang === 'en' ? `${days}d ago` : `${days}ថ្ងៃមុន`
}

const normalizeCollection = (response) => (Array.isArray(response?.data) ? response.data : [])

const TEXTS = {
  dashboard: { en: 'Dashboard', kh: 'ផ្ទាំងគ្រប់គ្រង' },
  inventorySystem: { en: 'Inventory System', kh: 'ប្រព័ន្ធគ្រប់គ្រងស្តុក' },
  informationSide: { en: 'Information Side', kh: 'ផ្នែកព័ត៌មាន' },
  companyInfo: { en: 'Company Info', kh: 'ព័ត៌មានក្រុមហ៊ុន' },
  saleDashboard: { en: 'Sale Dashboard', kh: 'ផ្ទាំងលក់ដាច់' },
  auditHistory: { en: 'Audit History', kh: 'ប្រវត្តិសកម្មភាព' },
  products: { en: 'Stocks', kh: 'ផលិតផល' },
  jobs: { en: 'Jobs', kh: 'ការងារ' },
  applications: { en: 'Applications', kh: 'ពាក្យសុំការងារ' },
  members: { en: 'Members', kh: 'សមាជិក' },
  users: { en: 'Users', kh: 'អ្នកប្រើប្រាស់' },
  promotions: { en: 'Promotions', kh: 'ការផ្សព្វផ្សាយ' },
  partners: { en: 'Partners', kh: 'ដៃគូ' },
  drivers: { en: 'Delivery Drivers', kh: 'អ្នកដឹកជញ្ជូន' },
  addProduct: { en: 'Add Product', kh: 'បន្ថែមផលិតផល' },
  editProduct: { en: 'Edit Product', kh: 'កែប្រែផលិតផល' },
  deleteProduct: { en: 'Delete Product', kh: 'លុបផលិតផល' },
  updateProduct: { en: 'Update Product', kh: 'ធ្វើបច្ចុប្បន្នភាពផលិតផល' },
  addJob: { en: 'Add Job', kh: 'បន្ថែមការងារ' },
  editJob: { en: 'Edit Job', kh: 'កែប្រែការងារ' },
  deleteJob: { en: 'Delete Job', kh: 'លុបការងារ' },
  updateJob: { en: 'Update Job', kh: 'ធ្វើបច្ចុប្បន្នភាពការងារ' },
  addMember: { en: 'Add Member', kh: 'បន្ថែមសមាជិក' },
  editMember: { en: 'Edit Member', kh: 'កែប្រែសមាជិក' },
  deleteMember: { en: 'Delete Member', kh: 'លុបសមាជិក' },
  updateMember: { en: 'Update Member', kh: 'ធ្វើបច្ចុប្បន្នភាពសមាជិក' },
  addUser: { en: 'Add User', kh: 'បន្ថែមអ្នកប្រើប្រាស់' },
  editUser: { en: 'Edit User', kh: 'កែប្រែអ្នកប្រើប្រាស់' },
  deleteUser: { en: 'Delete User', kh: 'លុបអ្នកប្រើប្រាស់' },
  updateUser: { en: 'Update User', kh: 'ធ្វើបច្ចុប្បន្នភាពអ្នកប្រើប្រាស់' },
  addPromotion: { en: 'Add Promotion', kh: 'បន្ថែមការផ្សព្វផ្សាយ' },
  editPromotion: { en: 'Edit Promotion', kh: 'កែប្រែការផ្សព្វផ្សាយ' },
  deletePromotion: { en: 'Delete Promotion', kh: 'លុបការផ្សព្វផ្សាយ' },
  updatePromotion: { en: 'Update Promotion', kh: 'ធ្វើបច្ចុប្បន្នភាពការផ្សព្វផ្សាយ' },
  addPartner: { en: 'Add Partner', kh: 'បន្ថែមដៃគូ' },
  editPartner: { en: 'Edit Partner', kh: 'កែប្រែដៃគូ' },
  deletePartner: { en: 'Delete Partner', kh: 'លុបដៃគូ' },
  updatePartner: { en: 'Update Partner', kh: 'ធ្វើបច្ចុប្បន្នភាពដៃគូ' },
  shop: { en: 'Shop', kh: 'ហាង' },
  career: { en: 'Career', kh: 'ការងារ' },
  team: { en: 'Team', kh: 'ក្រុម' },
  backToSite: { en: 'Back to Site', kh: 'ត្រឡប់ទៅគេហទំព័រ' },
  overviewTitle: { en: 'Dashboard Overview', kh: 'ទិដ្ឋភាពទូទៅនៃផ្ទាំងគ្រប់គ្រង' },
  prodCategoryTitle: { en: 'Products by Category', kh: 'ផលិតផលតាមប្រភេទ' },
  prodCategorySub: { en: 'Distribution across categories', kh: 'ការបែងចែកតាមប្រភេទនីមួយៗ' },
  monthlyTitle: { en: 'Monthly Activity', kh: 'សកម្មភាពប្រចាំខែ' },
  monthlySub: { en: 'Products added this year', kh: 'ផលិតផលដែលបានបន្ថែមក្នុងឆ្នាំនេះ' },
  quickActions: { en: 'Quick Actions', kh: 'សកម្មភាពរហ័ស' },
  quickActionsSub: { en: 'Frequently used shortcuts', kh: 'ផ្លូវកាត់ដែលប្រើប្រាស់ញឹកញាប់' },
  recentTitle: { en: 'Recent Activity', kh: 'សកម្មភាពថ្មីៗ' },
  recentSub: { en: 'Latest jobs and applications', kh: 'ការងារ និងពាក្យសុំចុងក្រោយ' },
  liveData: { en: 'Live data', kh: 'ទិន្នន័យផ្ទាល់' },
  unavailable: { en: 'Not connected', kh: 'មិនទាន់ភ្ជាប់' },
  loadingOverview: { en: 'Loading dashboard overview…', kh: 'កំពុងផ្ទុកទិដ្ឋភាពទូទៅ…' },
  overviewError: { en: 'Some live dashboard data could not be loaded.', kh: 'ទិន្នន័យផ្ទាំងគ្រប់គ្រងផ្ទាល់មួយចំនួនមិនអាចផ្ទុកបានទេ។' },
  retry: { en: 'Try again', kh: 'ព្យាយាមម្ដងទៀត' },
  productDataUnavailable: { en: 'Product data is not connected to the server yet.', kh: 'ទិន្នន័យផលិតផលមិនទាន់ត្រូវបានភ្ជាប់ទៅម៉ាស៊ីនមេនៅឡើយទេ។' },
  noProducts: { en: 'No products to display yet.', kh: 'មិនទាន់មានផលិតផលសម្រាប់បង្ហាញទេ។' },
  noActivity: { en: 'No recent jobs or applications yet.', kh: 'មិនទាន់មានការងារ ឬពាក្យសុំថ្មីៗទេ។' },
  uncategorized: { en: 'Uncategorized', kh: 'មិនមានប្រភេទ' },
  activityTitle: { en: 'Job & application activity', kh: 'សកម្មភាពការងារ និងពាក្យសុំ' },
  activitySub: { en: 'Created this year', kh: 'បានបង្កើតក្នុងឆ្នាំនេះ' },
  jobPosted: { en: 'Job posted', kh: 'បានប្រកាសការងារ' },
  applicationReceived: { en: 'New application received', kh: 'បានទទួលពាក្យសុំថ្មី' },
}

function AdminD() {
  const { lang } = useLanguage()
  const location = useLocation()
  const { user } = useAuth()
  
  // Extract and normalize role from all common schemas
  const userRole = (() => {
    let r = user?.role || ''
    if (!r && Array.isArray(user?.roles) && user.roles.length > 0) {
      const first = user.roles[0]
      r = typeof first === 'string' ? first : first.name || first.role || ''
    }
    if (!r && typeof user?.roleName === 'string') r = user.roleName
    if (!r && typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem('user')
        if (stored) {
          const parsed = JSON.parse(stored)
          r = parsed.role || (Array.isArray(parsed.roles) ? parsed.roles[0] : '') || ''
        }
      } catch {}
    }
    const clean = (r || 'ADMIN').replace(/^ROLE_/, '').toUpperCase()
    return clean || 'ADMIN'
  })()

  // STORE ("Online Store") sees the products side only; ADMIN sees everything.
  const isAdmin = userRole === 'ADMIN' || userRole === 'SUPERADMIN' || userRole === 'SUPER_ADMIN' || userRole === 'MANAGER'
  const canStore = isAdmin || userRole === 'STORE'
  const { notifications, unreadCount, markAsRead, markAllRead, clearAll } = useNotifications()
  const [sidebarOpen, setSidebarOpen] = useState(() => (typeof window !== 'undefined' ? window.innerWidth >= 1024 : true))

  // Auto-close mobile drawer on route navigation
  useEffect(() => {
    if (typeof window !== 'undefined' && window.innerWidth < 1024) {
      setSidebarOpen(false)
    }
  }, [location.pathname])

  // Handle resize
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        setSidebarOpen(true)
      }
    }
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  const [openDropdowns, setOpenDropdowns] = useState({
    products: false,
    jobs: false,
    members: false,
    users: false,
    promotions: false,
    partners: false,
    drivers: false,
    saleDashboard: false,
    orderManagement: false,
    consignment: false,
    salePayment: false,
    purchaseManagement: false,
    freightManagement: false,
    payableManagement: false,
    cashBook: false,
    employee: false,
    report: false,
    integration: false,
    settings: false,
  })
  const [showNotifications, setShowNotifications] = useState(false)
  const [dashboardData, setDashboardData] = useState(EMPTY_DASHBOARD_DATA)
  const [dashboardLoading, setDashboardLoading] = useState(false)
  const [dashboardError, setDashboardError] = useState(false)
  const [dashboardRefreshKey, setDashboardRefreshKey] = useState(0)
  const notificationRef = useRef(null)
  const isOverview = location.pathname === '/admin'

  useEffect(() => {
    if (!isOverview) return undefined

    let cancelled = false
    const loadDashboard = async () => {
      setDashboardLoading(true)
      setDashboardError(false)

      const requests = [
        ['products', () => adminProductAPI.getAll()],
        ['jobs', () => jobAPI.getAll()],
        ['members', () => memberAPI.getAll()],
        ['applications', () => applicationAPI.getAll()],
        ['users', () => userAPI.getAll()],
      ]
      const results = await Promise.allSettled(requests.map(([, request]) => Promise.resolve().then(request)))
      if (cancelled) return

      const nextData = { ...EMPTY_DASHBOARD_DATA }
      let hasError = false
      results.forEach((result, index) => {
        const [key] = requests[index]
        if (result.status === 'fulfilled') {
          nextData[key] = normalizeCollection(result.value)
        } else {
          hasError = true
        }
      })

      setDashboardData(nextData)
      setDashboardError(hasError)
      setDashboardLoading(false)
    }

    loadDashboard()
    return () => {
      cancelled = true
    }
  }, [dashboardRefreshKey, isAdmin, isOverview])

  const stats = useMemo(() => {
    const items = [
      { label: { en: 'Total Products', kh: 'ផលិតផលសរុប' }, value: dashboardData.products?.length, icon: bagIcon, color: '#4caf50', bg: 'rgba(76, 175, 80, 0.15)', link: '/admin/products' },
    ]

    if (isAdmin) {
      items.push(
        { label: { en: 'Open Jobs', kh: 'ការងារកំពុងរើស' }, value: dashboardData.jobs?.length, icon: targetIcon, color: '#ff9800', bg: 'rgba(255, 152, 0, 0.15)', link: '/admin/jobs' },
        { label: { en: 'Team Members', kh: 'សមាជិកក្រុម' }, value: dashboardData.members?.length, icon: trophyIcon, color: '#2196f3', bg: 'rgba(33, 150, 243, 0.15)', link: '/admin/members' },
        { label: { en: 'Applications', kh: 'ពាក្យសុំការងារ' }, value: dashboardData.applications?.length, icon: mailIcon, color: '#9c27b0', bg: 'rgba(156, 39, 176, 0.15)', link: '/admin/applications' },
      )
    }

    return items
  }, [dashboardData, isAdmin])

  const categoryData = useMemo(() => {
    const counts = new Map()
      ; (dashboardData.products || []).forEach((product) => {
        const category = String(product.category || '').trim()
        counts.set(category, (counts.get(category) || 0) + 1)
      })

    return [...counts.entries()]
      .map(([category, value], index) => {
        const knownCategory = CATEGORY_META.find((item) => item.key === category)
        return {
          label: knownCategory?.label || (category ? { en: category, kh: category } : TEXTS.uncategorized),
          value,
          color: knownCategory?.color || CATEGORY_FALLBACK_COLORS[index % CATEGORY_FALLBACK_COLORS.length],
        }
      })
      .sort((a, b) => b.value - a.value || a.label.en.localeCompare(b.label.en))
  }, [dashboardData.products])

  const monthlyData = useMemo(() => {
    const currentYear = new Date().getFullYear()
    const counts = Array(MONTHS.length).fill(0)

      ;[...(dashboardData.jobs || []), ...(dashboardData.applications || [])].forEach((item) => {
        const timestamp = toTimestamp(item.createdAt)
        if (!timestamp) return

        const date = new Date(timestamp)
        if (date.getFullYear() === currentYear) counts[date.getMonth()] += 1
      })

    return MONTHS.map((month, index) => ({ ...month, value: counts[index] }))
  }, [dashboardData.applications, dashboardData.jobs])

  const recentActivity = useMemo(() => [
    ...(dashboardData.jobs || []).map((job) => ({
      id: `job-${job.id || job.createdAt || job.title}`,
      type: 'job',
      detail: job.title || '—',
      timestamp: toTimestamp(job.createdAt),
      icon: '💼',
      color: '#ff9800',
    })),
    ...(dashboardData.applications || []).map((application) => ({
      id: `application-${application.id || application.createdAt || application.email}`,
      type: 'application',
      detail: application.fullName
        ? `${application.fullName} — ${application.jobTitle || '—'}`
        : application.jobTitle || application.email || '—',
      timestamp: toTimestamp(application.createdAt),
      icon: '📋',
      color: '#9c27b0',
    })),
  ]
    .filter((item) => item.timestamp !== null)
    .sort((a, b) => b.timestamp - a.timestamp)
    .slice(0, 5), [dashboardData.applications, dashboardData.jobs])

  // Close notification dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (notificationRef.current && !notificationRef.current.contains(event.target)) {
        setShowNotifications(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const toggleDropdown = (key) => {
    setOpenDropdowns((prev) => ({
      ...prev,
      [key]: !prev[key],
    }))
  }

  const formatTime = (timestamp) => formatRelativeTime(toTimestamp(timestamp), lang)

  const maxCategoryValue = Math.max(...categoryData.map((category) => category.value), 1)
  const maxMonthlyValue = Math.max(...monthlyData.map((month) => month.value), 1)

  // CEO analytics — computed from live data
  const stockKpis = useMemo(() => {
    const prods = dashboardData.products || []
    let inventoryValue = 0
    let lowStock = 0
    let outOfStock = 0
    let activeCount = 0
    prods.forEach((p) => {
      const qty = Number(p.onHand ?? 0)
      const cost = Number(p.averageCost ?? p.standardCost ?? 0)
      inventoryValue += qty * cost
      if (qty <= 0) outOfStock++
      else if (qty <= 5) lowStock++
      if (p.active !== false) activeCount++
    })
    return { total: prods.length, inventoryValue, lowStock, outOfStock, active: activeCount }
  }, [dashboardData.products])

  const appsByStatus = useMemo(() => {
    const apps = dashboardData.applications || []
    const map = {}
    apps.forEach((a) => {
      const s = (a.status || 'PENDING').toUpperCase()
      map[s] = (map[s] || 0) + 1
    })
    return map
  }, [dashboardData.applications])

  const topLowStock = useMemo(() => {
    return (dashboardData.products || [])
      .filter((p) => Number(p.onHand ?? 0) <= 5)
      .sort((a, b) => Number(a.onHand ?? 0) - Number(b.onHand ?? 0))
      .slice(0, 6)
  }, [dashboardData.products])

  const monthlyProducts = useMemo(() => {
    const year = new Date().getFullYear()
    const counts = Array(12).fill(0)
    ;(dashboardData.products || []).forEach((p) => {
      const ts = toTimestamp(p.createdAt || p.createDate)
      if (!ts) return
      const d = new Date(ts)
      if (d.getFullYear() === year) counts[d.getMonth()]++
    })
    return MONTHS.map((m, i) => ({ ...m, value: counts[i] }))
  }, [dashboardData.products])

  const maxProductsMonthly = Math.max(...monthlyProducts.map((m) => m.value), 1)

  const renderContent = () => {
    const path = location.pathname

    // Role-based access: Jobs / Members / Users are ADMIN-only; a STORE user
    // who opens one of these URLs directly gets a restricted screen.
    const adminOnly =
      path === '/add-jobs' || path.startsWith('/admin/jobs') ||
      path === '/add-member' || path.startsWith('/admin/members') ||
      path === '/manage-users' || path.startsWith('/admin/users') ||
      path === '/admin/applications' || path.startsWith('/admin/applications') ||
      path === '/admin/information' || path.startsWith('/admin/information')
    const storeOnly =
      path === '/add-products' || path.startsWith('/admin/products') ||
      path === '/add-promotion' || path.startsWith('/admin/promotions') ||
      path === '/add-partner' || path.startsWith('/admin/partners') ||
      path === '/add-driver' || path.startsWith('/admin/drivers')

    if ((adminOnly && !isAdmin) || (storeOnly && !canStore)) {
      return (
        <div className="flex min-h-64 flex-col items-center justify-center gap-4 rounded-3xl border border-slate-700/60 bg-slate-900/80 p-12 text-center">
          <span className="text-4xl">🔒</span>
          <p className="text-sm font-semibold text-slate-300">
            {lang === 'en' ? 'You do not have access to this section.' : 'អ្នកគ្មានសិទ្ធិចូលប្រើផ្នែកនេះទេ។'}
          </p>
          <Link to="/admin" className="rounded-xl border border-slate-700 px-4 py-2 text-sm font-bold text-slate-300 transition hover:border-green-400 hover:bg-green-500/10 hover:text-green-300">
            {TEXTS.dashboard[lang]}
          </Link>
        </div>
      )
    }

    if (path === '/admin/information' || path === '/admin/information/') {
      return <InformationHub />
    }

    if (path === '/add-products') {
      return <AddProducts />
    }
    if (
      path === '/admin/products' ||
      path === '/admin/products/' ||
      path === '/admin/stocks' ||
      path === '/admin/stocks/' ||
      path === '/admin/stock' ||
      path === '/admin/stock/'
    ) {
      return <ProductsHub />
    }
    if (path === '/admin/products/all' || path === '/admin/stocks/all') {
      return <StocksList />
    }
    if (path.startsWith('/admin/products') || path.startsWith('/admin/stocks') || path.startsWith('/admin/stock')) {
      // The classic Add/Edit Products page handles the CRUD sub-actions plus
      // "manage". Master-data sections get real CRUD pages, transaction
      // sections get document posting pages; anything unknown falls back to
      // the generic catalog landing.
      const sub = path.split('/')[3] || ''
      if (['add', 'edit', 'delete', 'update', 'manage'].includes(sub)) return <AddProducts />
      if (sub === 'all') return <StocksList />
      if (sub === 'groups') return <ProductGroups />
      if (sub === 'categories') return <Categories />
      if (sub === 'brands') return <Brands />
      if (sub === 'attributes') return <Attributes key="attributes" />
      if (sub === 'units') return <Units />
      if (sub === 'supplier-groups') return <SupplierGroups />
      if (sub === 'suppliers') return <Suppliers />
      if (sub === 'serial-information') return <SerialInformationSection key="serial-information" />
      if (sub === 'request-transfer') return <RequestTransferSection key="request-transfer" />
      if (sub === 'ship-request-transfer') return <ShipRequestTransferSection key="ship-request-transfer" />
      if (sub === 'transfer-products') return <TransferProductsSection key="transfer-products" />
      if (sub === 'products-quantities') return <ProductsQuantitiesSection key="products-quantities" />
      if (sub === 'print-label') return <PrintLabelSection key="print-label" />
      if (['groups', 'categories', 'brands', 'units', 'suppliers', 'supplier-groups'].includes(sub)) {
        return <MasterDataSection sectionKey={sub} key={sub} />
      }
      if (['receive-products', 'issue-products', 'adjustment-products'].includes(sub)) {
        return <TransactionSection sectionKey={sub} key={sub} />
      }
      if (sub === 'products-scale') return <ProductScaleSection key="products-scale" />
      if (sub === 'change-attribute') return <ChangeAttributeSection key="change-attribute" />
      if (sub === 'cost-change') return <CostChangeSection key="cost-change" />
      if (sub === 'products-supplier') return <ProductsSupplierSection key="products-supplier" />
      if (sub === 'products-prices') return <ToolsSection sectionKey={sub} key={sub} />
      return <ProductsHub />
    }
    if (path === '/add-jobs' || path.startsWith('/admin/jobs')) {
      return <Addjobs />
    }
    if (path === '/admin/applications' || path.startsWith('/admin/applications')) {
      return <Applications />
    }
    if (path === '/add-member') {
      return <AddMember />
    }
    if (path.startsWith('/admin/members')) {
      if (path === '/admin/members') return <MemberList />
      if (path.startsWith('/admin/members/add')) return <MemberForm />
      if (path.startsWith('/admin/members/edit')) return <MemberForm />
      return <MemberDetailPage />
    }
    if (path === '/manage-users' || path.startsWith('/admin/users') || path === '/admin/manage-users') {
      return <ManageUsers />
    }
    if (path === '/add-promotion' || path.startsWith('/admin/promotions')) {
      return <Addpromotion />
    }
    if (path === '/add-partner' || path.startsWith('/admin/partners')) {
      return <AddPartner />
    }
    if (path === '/add-driver' || path.startsWith('/admin/drivers')) {
      return <AddDriver />
    }
    if (path === '/admin/notifications' || path.startsWith('/admin/notifications') || path.startsWith('/admin/history')) {
      return <ActivityHistory />
    }
    if (path === '/admin/settings') {
      return <SettingsHub />
    }

    if (path.startsWith('/admin/settings/')) {
      const settingType = path.replace('/admin/settings/', '')
      return <SettingsDetail settingType={settingType} />
    }

    if (path === '/admin/customers' || path.startsWith('/admin/customers/')) {
      const subPath = path.split('/')[3]
      if (subPath === 'create' || subPath === 'edit') {
        return <CustomerForm />
      }
      return <CustomerList />
    }

    if (path === '/admin/customer-groups' || path.startsWith('/admin/customer-groups/')) {
      const subPath = path.split('/')[3]
      if (subPath === 'create' || subPath === 'edit') {
        return <CustomerGroupForm />
      }
      return <CustomerGroupList />
    }

    if (path === '/admin/sale-invoice' || path.startsWith('/admin/sale-invoice/')) {
      const subPath = path.split('/')[3]
      if (subPath === 'create' || subPath === 'edit') {
        return <SaleInvoiceCreate />
      }
      return <SaleInvoiceList />
    }

    if (path === '/admin/pending-invoice' || path.startsWith('/admin/pending-invoice/')) {
      return <PendingInvoiceList />
    }

    if (path === '/admin/return-invoice' || path.startsWith('/admin/return-invoice/')) {
      return <ReturnInvoiceList />
    }

    if (path === '/admin/promotions' || path.startsWith('/admin/promotions/')) {
      const subPath = path.split('/')[3]
      if (subPath === 'create' || subPath === 'edit') {
        return <PromotionForm />
      }
      return <PromotionList />
    }

    if (path === '/admin/sale-dashboard' || path === '/admin/sale-dashboard/') {
      return <SaleDashboard />
    }

    // Sale Dashboard sub-modules
    if (path.startsWith('/admin/sale-dashboard/')) {
      const module = path.split('/')[3] || ''

      if (module === 'customers') {
        const subPath = path.split('/')[4]
        if (subPath === 'create' || subPath === 'edit') {
          return <CustomerForm />
        }
        return <CustomerList />
      }
      if (module === 'customer-groups') {
        const subPath = path.split('/')[4]
        if (subPath === 'create' || subPath === 'edit') {
          return <CustomerGroupForm />
        }
        return <CustomerGroupList />
      }
      if (module === 'sale-invoice') {
        const subPath = path.split('/')[4]
        if (subPath === 'create' || subPath === 'edit') {
          return <SaleInvoiceCreate />
        }
        return <SaleInvoiceList />
      }
      if (module === 'pending-invoice') {
        return <PendingInvoiceList />
      }
      if (module === 'return-invoice') {
        return <ReturnInvoiceList />
      }
      if (module === 'promotions') {
        const subPath = path.split('/')[4]
        if (subPath === 'create' || subPath === 'edit') {
          return <PromotionForm />
        }
        return <PromotionList />
      }
      // Fallback to dashboard if module not recognized
      return <SaleDashboard />
    }

    if (path.startsWith('/admin/quotation')) {
      return <QuotationList />
    }

    if (path.startsWith('/admin/sale-order')) {
      return <SaleOrderList />
    }

    if (path.startsWith('/admin/web-order')) {
      return <WebOrderList />
    }

    if (path.startsWith('/admin/shipment')) {
      return <ShipmentList />
    }

    if (path.startsWith('/admin/return-shipment')) {
      return <ReturnShipmentList />
    }

    if (path === '/admin/order-management') {
      return <OrderManagement />
    }

    if (path.startsWith('/admin/consignments') || path.startsWith('/admin/consignment-order') || path.startsWith('/admin/consignment-shipment')) {
      return <ConsignmentList />
    }

    if (path.startsWith('/admin/consignment-settlement')) {
      return <Report />
    }

    if (path === '/admin/consignment') {
      return <ConsignmentManagement />
    }

    if (path.startsWith('/admin/sale-payment/customer-deposit') || path.startsWith('/admin/cash-book/customer-deposit')) {
      return <CustomerDepositList />
    }

    if (path.startsWith('/admin/sale-payment/ar-collection')) {
      return <ARCollectionList />
    }

    if (path.startsWith('/admin/sale-payment/customer-refund')) {
      return <CustomerRefundList />
    }

    if (path.startsWith('/admin/sale-payment/payment-term')) {
      return <PaymentTermList />
    }

    if (path.startsWith('/admin/sale-payment/aging-invoice')) {
      return <AgingInvoiceList />
    }

    if (path === '/admin/sale-payment') {
      return <SalePayment />
    }

    if (path.startsWith('/admin/purchase-management/inventory-to-order') || path === '/admin/inventory-to-order') {
      return <InventoryOrderList />
    }

    if (path.startsWith('/admin/purchase-management/requisition') || path === '/admin/requisition') {
      return <RequisitionList />
    }

    if (path.startsWith('/admin/purchase-management/purchase-order') || path === '/admin/purchase-order') {
      return <PurchaseOrderList />
    }

    if (path.startsWith('/admin/purchase-management/receipt-po') || path === '/admin/receipt-po') {
      return <ReceiptPOList />
    }

    if (path.startsWith('/admin/purchase-management/return-receipt-po') || path === '/admin/return-receipt-po') {
      return <ReturnReceiptPOList />
    }

    if (path.startsWith('/admin/purchase-management/suppliers')) {
      return <Suppliers />
    }

    if (path.startsWith('/admin/purchase-management/supplier-groups')) {
      return <SupplierGroups />
    }

    if (path.startsWith('/admin/purchase-management/product-supplier')) {
      return <ProductsSupplierSection key="products-supplier" />
    }

    if (path === '/admin/purchase-management') {
      return <PurchaseManagement />
    }

    if (path.startsWith('/admin/freight-management/shipment-tariff') || path === '/admin/shipment-tariff') {
      return <ShipmentTariffList />
    }

    if (path.startsWith('/admin/freight-management/shipment-method') || path === '/admin/shipment-method') {
      return <ShipmentMethodList />
    }

    if (path.startsWith('/admin/freight-management/pending-receipt-po') || path === '/admin/pending-receipt-po') {
      return <PendingReceiptPOList />
    }

    if (path === '/admin/freight-management') {
      return <FreightManagement />
    }

    if (path.startsWith('/admin/payable-management') || path === '/admin/payable-management') {
      return <PayableManagement />
    }

    if (path.startsWith('/admin/cash-book/cash-in-out') || path === '/admin/cash-in-out') {
      return <CashInOutList />
    }

    if (path === '/admin/cash-book') {
      return <CashBook />
    }

    if (path === '/admin/employee') {
      return <Employee />
    }

    if (path === '/admin/report') {
      return <Report />
    }

    if (path === '/admin/integration') {
      return <Integration />
    }

    if (path.startsWith('/settings')) {
      return <SettingsHub />
    }

    return (
      <DashboardOverview
        dashboardData={dashboardData}
        dashboardLoading={dashboardLoading}
        dashboardError={dashboardError}
        setDashboardRefreshKey={setDashboardRefreshKey}
        lang={lang}
        isAdmin={isAdmin}
        user={user}
        categoryData={categoryData}
        monthlyProducts={monthlyProducts}
        monthlyData={monthlyData}
        stockKpis={stockKpis}
        appsByStatus={appsByStatus}
        topLowStock={topLowStock}
        recentActivity={recentActivity}
        formatTime={formatTime}
        TEXTS={TEXTS}
      />
    )
  }

  return (
    <div className="flex h-screen w-full overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Mobile Backdrop Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/70 backdrop-blur-sm lg:hidden transition-opacity duration-300"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed lg:relative inset-y-0 left-0 h-full max-h-screen bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 border-r border-slate-700/50 flex flex-col flex-shrink-0 z-50 transition-all duration-300 overflow-hidden ${
          sidebarOpen
            ? 'w-72 min-w-[18rem] max-w-[18rem] translate-x-0 shadow-2xl lg:shadow-none'
            : 'w-0 min-w-0 max-w-0 -translate-x-full lg:w-0 lg:min-w-0 lg:max-w-0 border-0 opacity-0 pointer-events-none'
        }`}
      >
        {/* Brand Header - Fixed */}
        <div className="flex items-center justify-between px-5 py-5 border-b border-slate-700/50 flex-shrink-0 bg-slate-900/90 backdrop-blur-sm">
          <div className="flex items-center gap-3">
            <span className="w-10 h-10 min-w-[40px] rounded-xl bg-gradient-to-br from-green-500 to-green-700 text-white font-black text-sm flex items-center justify-center shadow-lg shadow-green-500/30">
              FM
            </span>
            <div>
              <h3 className="text-white font-bold text-base leading-tight">FreshMart</h3>
              <p className="text-slate-400 text-xs mt-0.5">{lang === 'en' ? 'Admin Panel' : 'ផ្ទាំងគ្រប់គ្រង'}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
            aria-label="Close Sidebar"
          >
            ✕
          </button>
        </div>

        {/* Scrollable Navigation */}
        <nav className="flex-1 min-h-0 px-4 py-5 overflow-y-auto overscroll-contain scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-slate-900/60 hover:scrollbar-thumb-slate-500 sidebar-scroll-container">{/* ... rest of nav content ... */}
          {/* Main Group */}
          <div className="mb-6">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider px-3 block mb-2">{lang === 'en' ? 'Main' : 'មេ'}</span>
            <Link to="/admin" className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${location.pathname === '/admin' ? 'bg-gradient-to-r from-green-500/20 to-green-600/10 text-green-400 border border-green-500/30 shadow-lg shadow-green-500/10' : 'text-slate-400 hover:bg-slate-800/60 hover:text-white'}`}>
              <img src={sunIcon} alt="" className="w-5 h-5 object-contain drop-shadow" />
              <span className="font-semibold">{TEXTS.dashboard[lang]}</span>
            </Link>
          </div>

          {/* Inventory Management System Side (ADMIN + STORE) */}
          {canStore && (
            <div className="mb-6">
              <div className="flex items-center justify-between px-3 mb-2">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                  {TEXTS.inventorySystem[lang]}
                </span>
                <Link
                  to="/admin/products"
                  className="text-[10px] font-bold text-green-400 hover:text-green-300 transition-colors uppercase tracking-wider"
                  title={lang === 'en' ? 'Open Inventory Hub' : 'បើកផ្ទាំងស្តុក'}
                >
                  {lang === 'en' ? 'Hub' : 'ផ្ទាំង'} ↗
                </Link>
              </div>

              {/* 1. Stocks & Inventory Hub */}
              <div className="mb-2">
                <div className="flex items-stretch">
                  <Link
                    to="/admin/products"
                    className={`flex min-w-0 flex-1 items-center gap-3 px-3 py-2.5 text-sm font-medium transition-all ${location.pathname.startsWith('/admin/products') || location.pathname.startsWith('/admin/stocks') || location.pathname.startsWith('/admin/stock') || location.pathname === '/add-products' ? 'bg-gradient-to-r from-green-500/20 to-green-600/10 text-green-400 rounded-l-xl border-y border-l border-green-500/30 font-bold' : 'text-slate-400 hover:bg-slate-800/60 hover:text-white hover:rounded-l-xl'}`}
                  >
                    <img src={bagIcon} alt="" className="w-5 h-5 object-contain drop-shadow" />
                    <span className="truncate">{TEXTS.products[lang]}</span>
                  </Link>
                  <button
                    type="button"
                    aria-label={lang === 'en' ? 'Toggle stocks menu' : 'បើកម៉ឺនុយស្តុក'}
                    aria-expanded={openDropdowns.products}
                    className={`flex w-9 items-center justify-center text-sm transition-all ${location.pathname.startsWith('/admin/products') || location.pathname.startsWith('/admin/stocks') || location.pathname.startsWith('/admin/stock') || location.pathname === '/add-products' ? 'bg-gradient-to-r from-green-500/20 to-green-600/10 text-green-400 rounded-r-xl border-y border-r border-green-500/30' : 'text-slate-400 hover:bg-slate-800/60 hover:text-white hover:rounded-r-xl'}`}
                    onClick={() => toggleDropdown('products')}
                  >
                    <span className={`transition-transform duration-200 ${openDropdowns.products ? 'rotate-180' : ''}`}>
                      <ChevronDownIcon />
                    </span>
                  </button>
                </div>
                {openDropdowns.products && (
                  <div className="mt-1.5 ml-4 pl-3 border-l-2 border-slate-700/60 space-y-1 py-1">
                    <Link to="/admin/products/all" className="flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-slate-300 hover:bg-slate-800 hover:text-white transition-colors">
                      <span className="text-sm">📋</span> {lang === 'en' ? 'All Products' : 'ផលិតផលទាំងអស់'}
                    </Link>
                    <Link to="/admin/products/manage" className="flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-slate-300 hover:bg-slate-800 hover:text-white transition-colors">
                      <span className="text-sm">📦</span> {lang === 'en' ? 'Add / Edit Catalog' : 'កាតាឡុកផលិតផល'}
                    </Link>
                    {PRODUCT_SECTIONS.filter((s) => s.key !== 'manage').map((section) => {
                      const isImg = typeof section.icon === 'string' && (section.icon.includes('/') || section.icon.endsWith('.png'))
                      return (
                        <Link key={section.key} to={`/admin/products/${section.key}`} className="flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-xs text-slate-400 hover:bg-slate-800 hover:text-white transition-colors">
                          {isImg ? (
                            <img src={section.icon} alt="" className="h-4 w-4 object-contain" />
                          ) : (
                            <span className="text-sm">{section.icon}</span>
                          )}
                          <span>{lang === 'kh' ? section.kh : section.en}</span>
                        </Link>
                      )
                    })}

                    <div className="my-2 border-t border-slate-700/60" role="separator" />
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider px-2 block">{lang === 'en' ? 'Stock Operations' : 'ប្រតិបត្តិការស្តុក'}</span>
                    {STOCK_OPERATIONS.map((section) => {
                      const isImg = typeof section.icon === 'string' && (section.icon.includes('/') || section.icon.endsWith('.png'))
                      return (
                        <Link key={section.key} to={`/admin/products/${section.key}`} className="flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-xs text-slate-400 hover:bg-slate-800 hover:text-white transition-colors">
                          {isImg ? (
                            <img src={section.icon} alt="" className="h-4 w-4 object-contain" />
                          ) : (
                            <span className="text-sm">{section.icon}</span>
                          )}
                          <span>{lang === 'kh' ? section.kh : section.en}</span>
                        </Link>
                      )
                    })}
                  </div>
                )}
              </div>

              {/* 2. Sale Dashboard & Operations */}
              <div className="mb-2">
                <div className="flex items-stretch">
                  <Link
                    to="/admin/sale-dashboard"
                    className={`flex min-w-0 flex-1 items-center gap-3 px-3 py-2.5 text-sm font-medium transition-all ${location.pathname.startsWith('/admin/sale-dashboard') || location.pathname.startsWith('/admin/customers') || location.pathname.startsWith('/admin/sale-invoice') || location.pathname.startsWith('/admin/promotions') ? 'bg-gradient-to-r from-pink-500/20 to-pink-600/10 text-pink-400 rounded-l-xl border-y border-l border-pink-500/30 font-bold' : 'text-slate-400 hover:bg-slate-800/60 hover:text-white hover:rounded-l-xl'}`}
                  >
                    <img src={giftIcon} alt="" className="w-5 h-5 object-contain drop-shadow" />
                    <span className="truncate">{TEXTS.saleDashboard[lang]}</span>
                  </Link>
                  <button
                    type="button"
                    aria-label={lang === 'en' ? 'Toggle sale dashboard menu' : 'បើកម៉ឺនុយផ្ទាំងលក់'}
                    aria-expanded={openDropdowns.saleDashboard}
                    className={`flex w-9 items-center justify-center text-sm transition-all ${location.pathname.startsWith('/admin/sale-dashboard') || location.pathname.startsWith('/admin/customers') || location.pathname.startsWith('/admin/sale-invoice') || location.pathname.startsWith('/admin/promotions') ? 'bg-gradient-to-r from-pink-500/20 to-pink-600/10 text-pink-400 rounded-r-xl border-y border-r border-pink-500/30' : 'text-slate-400 hover:bg-slate-800/60 hover:text-white hover:rounded-r-xl'}`}
                    onClick={() => toggleDropdown('saleDashboard')}
                  >
                    <span className={`transition-transform duration-200 ${openDropdowns.saleDashboard ? 'rotate-180' : ''}`}>
                      <ChevronDownIcon />
                    </span>
                  </button>
                </div>
                {openDropdowns.saleDashboard && (
                  <div className="mt-1.5 ml-4 pl-3 border-l-2 border-pink-500/30 space-y-1 py-1">
                    <Link to="/admin/sale-dashboard/customers" className="flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-slate-300 hover:bg-slate-800 hover:text-white transition-colors">
                      <span className="text-sm">👤</span> {lang === 'en' ? 'Customer' : 'អតិថិជន'}
                    </Link>
                    <Link to="/admin/sale-dashboard/customer-groups" className="flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-xs text-slate-400 hover:bg-slate-800 hover:text-white transition-colors">
                      <span className="text-sm">👥</span> {lang === 'en' ? 'Customer Groups' : 'ក្រុមអតិថិជន'}
                    </Link>
                    <Link to="/admin/sale-dashboard/sale-invoice" className="flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-xs text-slate-400 hover:bg-slate-800 hover:text-white transition-colors">
                      <span className="text-sm">📄</span> {lang === 'en' ? 'Sale Invoice' : 'វិក័យប័ត្រលក់'}
                    </Link>
                    <Link to="/admin/sale-dashboard/pending-invoice" className="flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-xs text-slate-400 hover:bg-slate-800 hover:text-white transition-colors">
                      <span className="text-sm">⏳</span> {lang === 'en' ? 'Pending Invoice' : 'វិក័យប័ត្របង្អាក់'}
                    </Link>
                    <Link to="/admin/sale-dashboard/return-invoice" className="flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-xs text-slate-400 hover:bg-slate-800 hover:text-white transition-colors">
                      <span className="text-sm">↩️</span> {lang === 'en' ? 'Return Invoice' : 'វិក័យប័ត្របង្ហាញ'}
                    </Link>
                    <Link to="/admin/sale-dashboard/promotions" className="flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-xs text-slate-400 hover:bg-slate-800 hover:text-white transition-colors">
                      <span className="text-sm">🏷️</span> {TEXTS.promotions[lang]}
                    </Link>
                  </div>
                )}
              </div>

              {/* 3. Order Management */}
              <div className="mb-2">
                <div className="flex items-stretch">
                  <Link
                    to="/admin/order-management"
                    className={`flex min-w-0 flex-1 items-center gap-3 px-3 py-2.5 text-sm font-medium transition-all ${location.pathname === '/admin/order-management' || location.pathname.startsWith('/admin/quotation') || location.pathname.startsWith('/admin/sale-order') || location.pathname.startsWith('/admin/web-order') || location.pathname.startsWith('/admin/shipment') || location.pathname.startsWith('/admin/return-shipment') ? 'bg-gradient-to-r from-blue-500/20 to-blue-600/10 text-blue-400 rounded-l-xl border-y border-l border-blue-500/30 font-bold' : 'text-slate-400 hover:bg-slate-800/60 hover:text-white hover:rounded-l-xl'}`}
                  >
                    <span className="text-lg">🛒</span>
                    <span className="truncate">{lang === 'en' ? 'Order Management' : 'ការគ្រប់គ្រងការបញ្ជាទិញ'}</span>
                  </Link>
                  <button
                    type="button"
                    aria-label={lang === 'en' ? 'Toggle order management menu' : 'បើកម៉ឺនុយការគ្រប់គ្រងការបញ្ជាទិញ'}
                    aria-expanded={openDropdowns.orderManagement}
                    className={`flex w-9 items-center justify-center text-sm transition-all ${location.pathname === '/admin/order-management' || location.pathname.startsWith('/admin/quotation') || location.pathname.startsWith('/admin/sale-order') || location.pathname.startsWith('/admin/web-order') || location.pathname.startsWith('/admin/shipment') || location.pathname.startsWith('/admin/return-shipment') ? 'bg-gradient-to-r from-blue-500/20 to-blue-600/10 text-blue-400 rounded-r-xl border-y border-r border-blue-500/30' : 'text-slate-400 hover:bg-slate-800/60 hover:text-white hover:rounded-r-xl'}`}
                    onClick={() => toggleDropdown('orderManagement')}
                  >
                    <span className={`transition-transform duration-200 ${openDropdowns.orderManagement ? 'rotate-180' : ''}`}>
                      <ChevronDownIcon />
                    </span>
                  </button>
                </div>
                {openDropdowns.orderManagement && (
                  <div className="mt-1.5 ml-4 pl-3 border-l-2 border-blue-500/30 space-y-1 py-1">
                    <Link to="/admin/quotation" className="flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-slate-300 hover:bg-slate-800 hover:text-white transition-colors">
                      <span className="text-sm">📄</span> {lang === 'en' ? 'Quotation' : 'សម្រង់តម្លៃ'}
                    </Link>
                    <Link to="/admin/sale-order" className="flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-xs text-slate-400 hover:bg-slate-800 hover:text-white transition-colors">
                      <span className="text-sm">📋</span> {lang === 'en' ? 'Sale Order' : 'ការបញ្ជាទិញលក់'}
                    </Link>
                    <Link to="/admin/web-order" className="flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-xs text-slate-400 hover:bg-slate-800 hover:text-white transition-colors">
                      <span className="text-sm">🌐</span> {lang === 'en' ? 'Web Order' : 'ការបញ្ជាទិញលើគេហទំព័រ'}
                    </Link>
                    <Link to="/admin/shipment" className="flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-xs text-slate-400 hover:bg-slate-800 hover:text-white transition-colors">
                      <span className="text-sm">🚚</span> {lang === 'en' ? 'Shipment' : 'ការដឹកជញ្ជូន'}
                    </Link>
                    <Link to="/admin/return-shipment" className="flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-xs text-slate-400 hover:bg-slate-800 hover:text-white transition-colors">
                      <span className="text-sm">↩️</span> {lang === 'en' ? 'Return Shipment' : 'ការបញ្ជូនត្រឡប់'}
                    </Link>
                  </div>
                )}
              </div>

              {/* 4. Consignment */}
              <div className="mb-2">
                <div className="flex items-stretch">
                  <Link
                    to="/admin/consignment"
                    className={`flex min-w-0 flex-1 items-center gap-3 px-3 py-2.5 text-sm font-medium transition-all ${location.pathname === '/admin/consignment' || location.pathname.startsWith('/admin/consignments') || location.pathname.startsWith('/admin/consignment-shipment') || location.pathname.startsWith('/admin/return-shipment-consignment') || location.pathname.startsWith('/admin/consignment-settlement') ? 'bg-gradient-to-r from-purple-500/20 to-purple-600/10 text-purple-400 rounded-l-xl border-y border-l border-purple-500/30 font-bold' : 'text-slate-400 hover:bg-slate-800/60 hover:text-white hover:rounded-l-xl'}`}
                  >
                    <span className="text-lg">📦</span>
                    <span className="truncate">{lang === 'en' ? 'Consignment' : 'ការដឹកជញ្ជូនបង្ហាញ'}</span>
                  </Link>
                  <button
                    type="button"
                    aria-label={lang === 'en' ? 'Toggle consignment menu' : 'បើកម៉ឺនុយការដឹកជញ្ជូនបង្ហាញ'}
                    aria-expanded={openDropdowns.consignment}
                    className={`flex w-9 items-center justify-center text-sm transition-all ${location.pathname === '/admin/consignment' || location.pathname.startsWith('/admin/consignments') || location.pathname.startsWith('/admin/consignment-shipment') || location.pathname.startsWith('/admin/return-shipment-consignment') || location.pathname.startsWith('/admin/consignment-settlement') ? 'bg-gradient-to-r from-purple-500/20 to-purple-600/10 text-purple-400 rounded-r-xl border-y border-r border-purple-500/30' : 'text-slate-400 hover:bg-slate-800/60 hover:text-white hover:rounded-r-xl'}`}
                    onClick={() => toggleDropdown('consignment')}
                  >
                    <span className={`transition-transform duration-200 ${openDropdowns.consignment ? 'rotate-180' : ''}`}>
                      <ChevronDownIcon />
                    </span>
                  </button>
                </div>
                {openDropdowns.consignment && (
                  <div className="mt-1.5 ml-4 pl-3 border-l-2 border-purple-500/30 space-y-1 py-1">
                    <Link to="/admin/consignments" className="flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-slate-300 hover:bg-slate-800 hover:text-white transition-colors">
                      <span className="text-sm">📦</span> {lang === 'en' ? 'Consignment' : 'ការដឹកជញ្ជូនបញ្ញើ'}
                    </Link>
                    <Link to="/admin/return-shipment-consignment" className="flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-xs text-slate-400 hover:bg-slate-800 hover:text-white transition-colors">
                      <span className="text-sm">↩️</span> {lang === 'en' ? 'Return Shipment' : 'ការបញ្ជូនត្រឡប់'}
                    </Link>
                    <Link to="/admin/consignment-settlement" className="flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-xs text-slate-400 hover:bg-slate-800 hover:text-white transition-colors">
                      <span className="text-sm">💵</span> {lang === 'en' ? 'Consignment Settlement' : 'ការទូទាត់លក់បញ្ញើ'}
                    </Link>
                  </div>
                )}
              </div>

              {/* 5. Sale Payment */}
              <div className="mb-2">
                <div className="flex items-stretch">
                  <Link
                    to="/admin/sale-payment"
                    className={`flex min-w-0 flex-1 items-center gap-3 px-3 py-2.5 text-sm font-medium transition-all ${location.pathname === '/admin/sale-payment' ? 'bg-gradient-to-r from-blue-500/20 to-blue-600/10 text-blue-400 rounded-l-xl border-y border-l border-blue-500/30 font-bold' : 'text-slate-400 hover:bg-slate-800/60 hover:text-white hover:rounded-l-xl'}`}
                  >
                    <span className="text-lg">💰</span>
                    <span className="truncate">{lang === 'en' ? 'Sale Payment' : 'ការទូទាត់លក់'}</span>
                  </Link>
                  <button
                    type="button"
                    onClick={() => toggleDropdown('salePayment')}
                    className={`flex w-9 items-center justify-center text-sm transition-all ${location.pathname === '/admin/sale-payment' ? 'bg-gradient-to-r from-blue-500/20 to-blue-600/10 text-blue-400 rounded-r-xl border-y border-r border-blue-500/30' : 'text-slate-400 hover:bg-slate-800/60 hover:text-white hover:rounded-r-xl'}`}
                  >
                    <span className={`transition-transform duration-200 ${openDropdowns.salePayment ? 'rotate-180' : ''}`}><ChevronDownIcon /></span>
                  </button>
                </div>
                {openDropdowns.salePayment && (
                  <div className="mt-1.5 ml-4 pl-3 border-l-2 border-blue-500/30 space-y-1 py-1">
                    <Link to="/admin/sale-payment/customer-deposit" className="flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-xs text-slate-300 hover:bg-slate-800 hover:text-white transition-colors"><span className="text-sm">💰</span> {lang === 'en' ? 'Customer Deposit' : 'ប្រាក់កក់អតិថិជន'}</Link>
                    <Link to="/admin/sale-payment/ar-collection" className="flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-xs text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"><span className="text-sm">📊</span> {lang === 'en' ? 'AR Collection' : 'ការរង្វើយប្រាក់'}</Link>
                    <Link to="/admin/sale-payment/customer-refund" className="flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-xs text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"><span className="text-sm">↩️</span> {lang === 'en' ? 'Customer Refund' : 'សងប្រាក់វិញ'}</Link>
                    <Link to="/admin/sale-payment/payment-term" className="flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-xs text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"><span className="text-sm">📅</span> {lang === 'en' ? 'Payment Term' : 'លក្ខខណ្ឌបង់'}</Link>
                    <Link to="/admin/sale-payment/aging-invoice" className="flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-xs text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"><span className="text-sm">📈</span> {lang === 'en' ? 'Aging Invoice' : 'វិក័យប័ត្របាត់ន័យ'}</Link>
                  </div>
                )}
              </div>

              {/* 6. Purchase Management */}
              <div className="mb-2">
                <div className="flex items-stretch">
                  <Link
                    to="/admin/purchase-management"
                    className={`flex min-w-0 flex-1 items-center gap-3 px-3 py-2.5 text-sm font-medium transition-all ${location.pathname === '/admin/purchase-management' ? 'bg-gradient-to-r from-green-500/20 to-green-600/10 text-green-400 rounded-l-xl border-y border-l border-green-500/30 font-bold' : 'text-slate-400 hover:bg-slate-800/60 hover:text-white hover:rounded-l-xl'}`}
                  >
                    <span className="text-lg">🏭</span>
                    <span className="truncate">{lang === 'en' ? 'Purchase Management' : 'ការគ្រប់គ្រងការកម្ចាក់'}</span>
                  </Link>
                  <button
                    type="button"
                    onClick={() => toggleDropdown('purchaseManagement')}
                    className={`flex w-9 items-center justify-center text-sm transition-all ${location.pathname === '/admin/purchase-management' ? 'bg-gradient-to-r from-green-500/20 to-green-600/10 text-green-400 rounded-r-xl border-y border-r border-green-500/30' : 'text-slate-400 hover:bg-slate-800/60 hover:text-white hover:rounded-r-xl'}`}
                  >
                    <span className={`transition-transform duration-200 ${openDropdowns.purchaseManagement ? 'rotate-180' : ''}`}><ChevronDownIcon /></span>
                  </button>
                </div>
                {openDropdowns.purchaseManagement && (
                  <div className="mt-1.5 ml-4 pl-3 border-l-2 border-green-500/30 space-y-1 py-1">
                    <Link to="/admin/purchase-management/suppliers" className="flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-xs text-slate-300 hover:bg-slate-800 hover:text-white transition-colors"><span className="text-sm">🏭</span> {lang === 'en' ? 'Suppliers' : 'អ្នកផ្គត់ផ្គង់'}</Link>
                    <Link to="/admin/purchase-management/supplier-groups" className="flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-xs text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"><span className="text-sm">👥</span> {lang === 'en' ? 'Supplier Groups' : 'ក្រុមអ្នកផ្គត់ផ្គង់'}</Link>
                    <Link to="/admin/purchase-management/product-supplier" className="flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-xs text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"><span className="text-sm">📦</span> {lang === 'en' ? 'Product Supplier' : 'ផលិតផលអ្នកផ្គត់ផ្គង់'}</Link>
                    <Link to="/admin/purchase-management/inventory-to-order" className="flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-xs text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"><span className="text-sm">📊</span> {lang === 'en' ? 'Inventory to Order' : 'ស្តុកដែលត្រូវបញ្ជាទិញ'}</Link>
                    <Link to="/admin/purchase-management/requisition" className="flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-xs text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"><span className="text-sm">📝</span> {lang === 'en' ? 'Requisition' : 'ស្នើសុំ'}</Link>
                    <Link to="/admin/purchase-management/purchase-order" className="flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-xs text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"><span className="text-sm">🛒</span> {lang === 'en' ? 'Purchase Order' : 'ការបញ្ជាទិញ'}</Link>
                    <Link to="/admin/purchase-management/receipt-po" className="flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-xs text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"><span className="text-sm">📬</span> {lang === 'en' ? 'Receipt PO' : 'ការទទួលបញ្ជាទិញ'}</Link>
                    <Link to="/admin/purchase-management/return-receipt-po" className="flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-xs text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"><span className="text-sm">↩️</span> {lang === 'en' ? 'Return Receipt PO' : 'ការត្រឡប់ទិញ'}</Link>
                  </div>
                )}
              </div>

              {/* 7. Freight Management */}
              <div className="mb-2">
                <div className="flex items-stretch">
                  <Link
                    to="/admin/freight-management"
                    className={`flex min-w-0 flex-1 items-center gap-3 px-3 py-2.5 text-sm font-medium transition-all ${location.pathname === '/admin/freight-management' ? 'bg-gradient-to-r from-orange-500/20 to-orange-600/10 text-orange-400 rounded-l-xl border-y border-l border-orange-500/30 font-bold' : 'text-slate-400 hover:bg-slate-800/60 hover:text-white hover:rounded-l-xl'}`}
                  >
                    <span className="text-lg">🚚</span>
                    <span className="truncate">{lang === 'en' ? 'Freight Management' : 'ការគ្រប់គ្រងសរុបលើក'}</span>
                  </Link>
                  <button
                    type="button"
                    onClick={() => toggleDropdown('freightManagement')}
                    className={`flex w-9 items-center justify-center text-sm transition-all ${location.pathname === '/admin/freight-management' ? 'bg-gradient-to-r from-orange-500/20 to-orange-600/10 text-orange-400 rounded-r-xl border-y border-r border-orange-500/30' : 'text-slate-400 hover:bg-slate-800/60 hover:text-white hover:rounded-r-xl'}`}
                  >
                    <span className={`transition-transform duration-200 ${openDropdowns.freightManagement ? 'rotate-180' : ''}`}><ChevronDownIcon /></span>
                  </button>
                </div>
                {openDropdowns.freightManagement && (
                  <div className="mt-1.5 ml-4 pl-3 border-l-2 border-orange-500/30 space-y-1 py-1">
                    <Link to="/admin/freight-management/shipment-tariff" className="flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-xs text-slate-300 hover:bg-slate-800 hover:text-white transition-colors"><span className="text-sm">💵</span> {lang === 'en' ? 'Shipment Tariff' : 'អត្រាដឹកជញ្ជូន'}</Link>
                    <Link to="/admin/freight-management/shipment-method" className="flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-xs text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"><span className="text-sm">🚚</span> {lang === 'en' ? 'Shipment Method' : 'វិធីដឹកជញ្ជូន'}</Link>
                    <Link to="/admin/freight-management/pending-receipt-po" className="flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-xs text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"><span className="text-sm">⏳</span> {lang === 'en' ? 'Pending Receipt PO' : 'ការទទួលដែលរង់ចាំ'}</Link>
                  </div>
                )}
              </div>

              {/* 8. Payable Management */}
              <div className="mb-2">
                <div className="flex items-stretch">
                  <Link
                    to="/admin/payable-management"
                    className={`flex min-w-0 flex-1 items-center gap-3 px-3 py-2.5 text-sm font-medium transition-all ${location.pathname === '/admin/payable-management' ? 'bg-gradient-to-r from-red-500/20 to-red-600/10 text-red-400 rounded-l-xl border-y border-l border-red-500/30 font-bold' : 'text-slate-400 hover:bg-slate-800/60 hover:text-white hover:rounded-l-xl'}`}
                  >
                    <span className="text-lg">💳</span>
                    <span className="truncate">{lang === 'en' ? 'Payable Management' : 'ការគ្រប់គ្រងថ្លៃដែលបង់'}</span>
                  </Link>
                  <button
                    type="button"
                    onClick={() => toggleDropdown('payableManagement')}
                    className={`flex w-9 items-center justify-center text-sm transition-all ${location.pathname === '/admin/payable-management' ? 'bg-gradient-to-r from-red-500/20 to-red-600/10 text-red-400 rounded-r-xl border-y border-r border-red-500/30' : 'text-slate-400 hover:bg-slate-800/60 hover:text-white hover:rounded-r-xl'}`}
                  >
                    <span className={`transition-transform duration-200 ${openDropdowns.payableManagement ? 'rotate-180' : ''}`}><ChevronDownIcon /></span>
                  </button>
                </div>
                {openDropdowns.payableManagement && (
                  <div className="mt-1.5 ml-4 pl-3 border-l-2 border-red-500/30 space-y-1 py-1">
                    <Link to="/admin/payable-management/enter-bill" className="flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-xs text-slate-300 hover:bg-slate-800 hover:text-white transition-colors"><span className="text-sm">📄</span> {lang === 'en' ? 'Enter Bill' : 'បញ្ចូលប៊ីល'}</Link>
                    <Link to="/admin/payable-management/bill-payment" className="flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-xs text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"><span className="text-sm">💳</span> {lang === 'en' ? 'Bill Payment' : 'ការបង់ប្រាក់ប៊ីល'}</Link>
                    <Link to="/admin/payable-management/enter-freight" className="flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-xs text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"><span className="text-sm">🚚</span> {lang === 'en' ? 'Enter Freight' : 'វិក័យប័ត្រដឹកជញ្ជូន'}</Link>
                    <Link to="/admin/payable-management/supplier-deposit" className="flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-xs text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"><span className="text-sm">💎</span> {lang === 'en' ? 'Supplier Deposit' : 'ប្រាក់កក់អ្នកផ្គត់ផ្គង់'}</Link>
                    <Link to="/admin/payable-management/supplier-refund" className="flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-xs text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"><span className="text-sm">↩️</span> {lang === 'en' ? 'Supplier Refund' : 'ប្រាក់សងត្រឡប់'}</Link>
                  </div>
                )}
              </div>

              {/* 9. Cash Book */}
              <div className="mb-2">
                <div className="flex items-stretch">
                  <Link
                    to="/admin/cash-book"
                    className={`flex min-w-0 flex-1 items-center gap-3 px-3 py-2.5 text-sm font-medium transition-all ${location.pathname === '/admin/cash-book' ? 'bg-gradient-to-r from-yellow-500/20 to-yellow-600/10 text-yellow-400 rounded-l-xl border-y border-l border-yellow-500/30 font-bold' : 'text-slate-400 hover:bg-slate-800/60 hover:text-white hover:rounded-l-xl'}`}
                  >
                    <span className="text-lg">📊</span>
                    <span className="truncate">{lang === 'en' ? 'Cash Book' : 'សៀវភៅលុយ'}</span>
                  </Link>
                  <button
                    type="button"
                    onClick={() => toggleDropdown('cashBook')}
                    className={`flex w-9 items-center justify-center text-sm transition-all ${location.pathname === '/admin/cash-book' ? 'bg-gradient-to-r from-yellow-500/20 to-yellow-600/10 text-yellow-400 rounded-r-xl border-y border-r border-yellow-500/30' : 'text-slate-400 hover:bg-slate-800/60 hover:text-white hover:rounded-r-xl'}`}
                  >
                    <span className={`transition-transform duration-200 ${openDropdowns.cashBook ? 'rotate-180' : ''}`}><ChevronDownIcon /></span>
                  </button>
                </div>
                {openDropdowns.cashBook && (
                  <div className="mt-1.5 ml-4 pl-3 border-l-2 border-yellow-500/30 space-y-1 py-1">
                    <Link to="/admin/cash-book/cash-category" className="flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-xs text-slate-300 hover:bg-slate-800 hover:text-white transition-colors"><span className="text-sm">📂</span> {lang === 'en' ? 'Cash Category' : 'ក្រុមលុយសាច'}</Link>
                    <Link to="/admin/cash-book/cash-in-out" className="flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-xs text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"><span className="text-sm">💸</span> {lang === 'en' ? 'Cash In/Out' : 'លុយចូល/ចេញ'}</Link>
                    <Link to="/admin/cash-book/bank-in-out" className="flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-xs text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"><span className="text-sm">🏦</span> {lang === 'en' ? 'Bank In/Out' : 'ធនាគារចូល/ចេញ'}</Link>
                    <Link to="/admin/cash-book/bank-transfer" className="flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-xs text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"><span className="text-sm">🔄</span> {lang === 'en' ? 'Bank Transfer' : 'ផ្ទេរលុយ'}</Link>
                    <Link to="/admin/cash-book/customer-deposit" className="flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-xs text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"><span className="text-sm">💰</span> {lang === 'en' ? 'Customer Deposit' : 'ប្រាក់កក់អតិថិជន'}</Link>
                    <Link to="/admin/cash-book/ar-collection" className="flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-xs text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"><span className="text-sm">📊</span> {lang === 'en' ? 'AR Collection' : 'ការរង្វើយប្រាក់'}</Link>
                    <Link to="/admin/cash-book/supplier-deposit" className="flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-xs text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"><span className="text-sm">💎</span> {lang === 'en' ? 'Supplier Deposit' : 'ប្រាក់កក់អ្នកផ្គត់ផ្គង់'}</Link>
                    <Link to="/admin/cash-book/bill-payment" className="flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-xs text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"><span className="text-sm">💳</span> {lang === 'en' ? 'Bill Payment' : 'ការបង់ប៊ីល'}</Link>
                  </div>
                )}
              </div>

              {/* 10. Employee */}
              <div className="mb-2">
                <div className="flex items-stretch">
                  <Link
                    to="/admin/employee"
                    className={`flex min-w-0 flex-1 items-center gap-3 px-3 py-2.5 text-sm font-medium transition-all ${location.pathname === '/admin/employee' ? 'bg-gradient-to-r from-indigo-500/20 to-indigo-600/10 text-indigo-400 rounded-l-xl border-y border-l border-indigo-500/30 font-bold' : 'text-slate-400 hover:bg-slate-800/60 hover:text-white hover:rounded-l-xl'}`}
                  >
                    <span className="text-lg">👥</span>
                    <span className="truncate">{lang === 'en' ? 'Employee' : 'និយោជក'}</span>
                  </Link>
                  <button
                    type="button"
                    onClick={() => toggleDropdown('employee')}
                    className={`flex w-9 items-center justify-center text-sm transition-all ${location.pathname === '/admin/employee' ? 'bg-gradient-to-r from-indigo-500/20 to-indigo-600/10 text-indigo-400 rounded-r-xl border-y border-r border-indigo-500/30' : 'text-slate-400 hover:bg-slate-800/60 hover:text-white hover:rounded-r-xl'}`}
                  >
                    <span className={`transition-transform duration-200 ${openDropdowns.employee ? 'rotate-180' : ''}`}><ChevronDownIcon /></span>
                  </button>
                </div>
                {openDropdowns.employee && (
                  <div className="mt-1.5 ml-4 pl-3 border-l-2 border-indigo-500/30 space-y-1 py-1">
                    <Link to="/admin/employee/list" className="flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-xs text-slate-300 hover:bg-slate-800 hover:text-white transition-colors"><span className="text-sm">👤</span> {lang === 'en' ? 'Employee' : 'និយោជក'}</Link>
                    <Link to="/admin/employee/office" className="flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-xs text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"><span className="text-sm">🏢</span> {lang === 'en' ? 'Office' : 'ការិយាល័យ'}</Link>
                    <Link to="/admin/employee/department" className="flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-xs text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"><span className="text-sm">📋</span> {lang === 'en' ? 'Department' : 'ដេប៉ាតឺម៉ង់'}</Link>
                    <Link to="/admin/employee/section" className="flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-xs text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"><span className="text-sm">🔖</span> {lang === 'en' ? 'Section' : 'ផ្នែក'}</Link>
                    <Link to="/admin/employee/position" className="flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-xs text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"><span className="text-sm">⭐</span> {lang === 'en' ? 'Position' : 'មុខតំណែង'}</Link>
                  </div>
                )}
              </div>

              {/* 11. Report */}
              <div className="mb-2">
                <div className="flex items-stretch">
                  <Link
                    to="/admin/report"
                    className={`flex min-w-0 flex-1 items-center gap-3 px-3 py-2.5 text-sm font-medium transition-all ${location.pathname === '/admin/report' ? 'bg-gradient-to-r from-violet-500/20 to-violet-600/10 text-violet-400 rounded-l-xl border-y border-l border-violet-500/30 font-bold' : 'text-slate-400 hover:bg-slate-800/60 hover:text-white hover:rounded-l-xl'}`}
                  >
                    <span className="text-lg">📈</span>
                    <span className="truncate">{lang === 'en' ? 'Report' : 'របាយការណ៍'}</span>
                  </Link>
                  <button
                    type="button"
                    onClick={() => toggleDropdown('report')}
                    className={`flex w-9 items-center justify-center text-sm transition-all ${location.pathname === '/admin/report' ? 'bg-gradient-to-r from-violet-500/20 to-violet-600/10 text-violet-400 rounded-r-xl border-y border-r border-violet-500/30' : 'text-slate-400 hover:bg-slate-800/60 hover:text-white hover:rounded-r-xl'}`}
                  >
                    <span className={`transition-transform duration-200 ${openDropdowns.report ? 'rotate-180' : ''}`}><ChevronDownIcon /></span>
                  </button>
                </div>
                {openDropdowns.report && (
                  <div className="mt-1.5 ml-4 pl-3 border-l-2 border-violet-500/30 space-y-1 py-1">
                    <Link to="/admin/report/stock" className="flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-xs text-slate-300 hover:bg-slate-800 hover:text-white transition-colors"><span className="text-sm">📦</span> {lang === 'en' ? 'Stock' : 'ស្តុក'}</Link>
                    <Link to="/admin/report/sale-payment" className="flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-xs text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"><span className="text-sm">💰</span> {lang === 'en' ? 'Sale Payment' : 'ការទូទាត់លក់'}</Link>
                    <Link to="/admin/report/order-management" className="flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-xs text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"><span className="text-sm">📋</span> {lang === 'en' ? 'Order Management' : 'ការគ្រប់គ្រងការបញ្ជាទិញ'}</Link>
                    <Link to="/admin/report/consignment" className="flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-xs text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"><span className="text-sm">🚚</span> {lang === 'en' ? 'Consignment' : 'ការដឹកជញ្ជូន'}</Link>
                    <Link to="/admin/report/purchase-management" className="flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-xs text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"><span className="text-sm">🏭</span> {lang === 'en' ? 'Purchase Management' : 'ការគ្រប់គ្រងការកម្ចាក់'}</Link>
                    <Link to="/admin/report/payable-management" className="flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-xs text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"><span className="text-sm">💳</span> {lang === 'en' ? 'Payable Management' : 'ការគ្រប់គ្រងថ្លៃដែលបង់'}</Link>
                    <Link to="/admin/report/cash-book" className="flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-xs text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"><span className="text-sm">📊</span> {lang === 'en' ? 'Cash Book' : 'សៀវភៅលុយ'}</Link>
                  </div>
                )}
              </div>

              {/* 12. Integration */}
              <div className="mb-2">
                <div className="flex items-stretch">
                  <Link
                    to="/admin/integration"
                    className={`flex min-w-0 flex-1 items-center gap-3 px-3 py-2.5 text-sm font-medium transition-all ${location.pathname === '/admin/integration' ? 'bg-gradient-to-r from-cyan-500/20 to-cyan-600/10 text-cyan-400 rounded-l-xl border-y border-l border-cyan-500/30 font-bold' : 'text-slate-400 hover:bg-slate-800/60 hover:text-white hover:rounded-l-xl'}`}
                  >
                    <span className="text-lg">🔗</span>
                    <span className="truncate">{lang === 'en' ? 'Integration' : 'ការរួមបញ្ចូល'}</span>
                  </Link>
                  <button
                    type="button"
                    onClick={() => toggleDropdown('integration')}
                    className={`flex w-9 items-center justify-center text-sm transition-all ${location.pathname === '/admin/integration' ? 'bg-gradient-to-r from-cyan-500/20 to-cyan-600/10 text-cyan-400 rounded-r-xl border-y border-r border-cyan-500/30' : 'text-slate-400 hover:bg-slate-800/60 hover:text-white hover:rounded-r-xl'}`}
                  >
                    <span className={`transition-transform duration-200 ${openDropdowns.integration ? 'rotate-180' : ''}`}><ChevronDownIcon /></span>
                  </button>
                </div>
                {openDropdowns.integration && (
                  <div className="mt-1.5 ml-4 pl-3 border-l-2 border-cyan-500/30 space-y-1 py-1">
                    <Link to="/admin/integration/payment-gateway" className="flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-xs text-slate-300 hover:bg-slate-800 hover:text-white transition-colors"><span className="text-sm">💳</span> {lang === 'en' ? 'Payment Gateway' : 'ច្នៃលម្អិត'}</Link>
                    <Link to="/admin/integration/app" className="flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-xs text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"><span className="text-sm">📱</span> {lang === 'en' ? 'App' : 'កម្មវិធី'}</Link>
                    <Link to="/admin/integration/template" className="flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-xs text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"><span className="text-sm">📄</span> {lang === 'en' ? 'Template' : 'ឯកសារគំរូ'}</Link>
                    <Link to="/admin/integration/key" className="flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-xs text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"><span className="text-sm">🔑</span> {lang === 'en' ? 'Key' : 'សោះ'}</Link>
                    <Link to="/admin/integration/station-info" className="flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-xs text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"><span className="text-sm">🏪</span> {lang === 'en' ? 'Station Info' : 'ព័ត៌មានស្ថានីយ'}</Link>
                    <Link to="/admin/integration/sync-notification" className="flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-xs text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"><span className="text-sm">🔔</span> {lang === 'en' ? 'Sync Notification' : 'សម្ព័ន្ធភាព'}</Link>
                    <Link to="/admin/integration/communication" className="flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-xs text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"><span className="text-sm">💬</span> {lang === 'en' ? 'Communication' : 'ការឆ្លាក់'}</Link>
                    <Link to="/admin/integration/setting" className="flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-xs text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"><span className="text-sm">⚙️</span> {lang === 'en' ? 'Setting' : 'ការកំណត់'}</Link>
                    <Link to="/admin/integration/dual-display" className="flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-xs text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"><span className="text-sm">📺</span> {lang === 'en' ? 'Dual Display' : 'បង្ហាញពីរ'}</Link>
                  </div>
                )}
              </div>

              {/* 13. Notifications & Stored History */}
              <div className="mb-2">
                <Link
                  to="/admin/notifications"
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${location.pathname === '/admin/notifications' || location.pathname.startsWith('/admin/history') ? 'bg-gradient-to-r from-purple-500/20 to-indigo-600/10 text-purple-400 border border-purple-500/30 shadow-lg shadow-purple-500/10 font-bold' : 'text-slate-400 hover:bg-slate-800/60 hover:text-white'}`}
                >
                  <span className="text-lg">🔔</span>
                  <span className="truncate">{TEXTS.auditHistory[lang]}</span>
                </Link>
              </div>

              {/* 6. Inventory Settings Hub */}
              <div className="mb-2">
                <div className="flex items-stretch">
                  <Link
                    to="/admin/settings"
                    className={`flex min-w-0 flex-1 items-center gap-3 px-3 py-2.5 text-sm font-medium transition-all ${location.pathname.startsWith('/admin/settings') ? 'bg-gradient-to-r from-cyan-500/20 to-cyan-600/10 text-cyan-400 rounded-l-xl border-y border-l border-cyan-500/30 font-bold' : 'text-slate-400 hover:bg-slate-800/60 hover:text-white hover:rounded-l-xl'}`}
                  >
                    <span className="text-lg">⚙️</span>
                    <span className="truncate">{lang === 'en' ? 'Settings' : 'ការកំណត់'}</span>
                  </Link>
                  <button
                    type="button"
                    aria-label={lang === 'en' ? 'Toggle settings menu' : 'បើកម៉ឺនុយការកំណត់'}
                    aria-expanded={openDropdowns.settings}
                    className={`flex w-9 items-center justify-center text-sm transition-all ${location.pathname.startsWith('/admin/settings') ? 'bg-gradient-to-r from-cyan-500/20 to-cyan-600/10 text-cyan-400 rounded-r-xl border-y border-r border-cyan-500/30' : 'text-slate-400 hover:bg-slate-800/60 hover:text-white hover:rounded-r-xl'}`}
                    onClick={() => toggleDropdown('settings')}
                  >
                    <span className={`transition-transform duration-200 ${openDropdowns.settings ? 'rotate-180' : ''}`}>
                      <ChevronDownIcon />
                    </span>
                  </button>
                </div>
                {openDropdowns.settings && (
                  <div className="mt-1.5 ml-4 pl-3 border-l-2 border-cyan-500/30 space-y-1 py-1">
                    <Link to="/admin/settings" className="flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-slate-300 hover:bg-slate-800 hover:text-white transition-colors">
                      <span className="text-sm">⚙️</span> {lang === 'en' ? 'All Settings' : 'ការកំណត់ទាំងអស់'}
                    </Link>
                    <Link to="/admin/settings/company" className="flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-xs text-slate-400 hover:bg-slate-800 hover:text-white transition-colors">
                      <span className="text-sm">🏢</span> {lang === 'en' ? 'Company' : 'ក្រុមហ៊ុន'}
                    </Link>
                    <Link to="/admin/settings/outlet" className="flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-xs text-slate-400 hover:bg-slate-800 hover:text-white transition-colors">
                      <span className="text-sm">🏪</span> {lang === 'en' ? 'Outlet' : 'ច្រក'}
                    </Link>
                    <Link to="/admin/settings/location" className="flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-xs text-slate-400 hover:bg-slate-800 hover:text-white transition-colors">
                      <span className="text-sm">📍</span> {lang === 'en' ? 'Location' : 'ទីតាំង'}
                    </Link>
                    <Link to="/admin/settings/users" className="flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-xs text-slate-400 hover:bg-slate-800 hover:text-white transition-colors">
                      <span className="text-sm">👤</span> {lang === 'en' ? 'User' : 'អ្នកប្រើប្រាស់'}
                    </Link>
                    <Link to="/admin/settings/role" className="flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-xs text-slate-400 hover:bg-slate-800 hover:text-white transition-colors">
                      <span className="text-sm">🔑</span> {lang === 'en' ? 'Role' : 'តួនាទី'}
                    </Link>
                    <Link to="/admin/settings/tax" className="flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-xs text-slate-400 hover:bg-slate-800 hover:text-white transition-colors">
                      <span className="text-sm">📋</span> {lang === 'en' ? 'Tax' : 'ពន្ធ'}
                    </Link>
                    <Link to="/admin/settings/currency" className="flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-xs text-slate-400 hover:bg-slate-800 hover:text-white transition-colors">
                      <span className="text-sm">💱</span> {lang === 'en' ? 'Currency' : 'រូបិយប័ណ្ណ'}
                    </Link>
                    <Link to="/admin/settings/price-book" className="flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-xs text-slate-400 hover:bg-slate-800 hover:text-white transition-colors">
                      <span className="text-sm">📚</span> {lang === 'en' ? 'Price Book' : 'សៀវភៅតម្លៃ'}
                    </Link>
                    <Link to="/admin/settings/approval-type" className="flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-xs text-slate-400 hover:bg-slate-800 hover:text-white transition-colors">
                      <span className="text-sm">✅</span> {lang === 'en' ? 'Approval Type' : 'ប្រភេទការម៉ាក'}
                    </Link>
                    <Link to="/admin/settings/payment-type" className="flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-xs text-slate-400 hover:bg-slate-800 hover:text-white transition-colors">
                      <span className="text-sm">💳</span> {lang === 'en' ? 'Payment Type' : 'ប្រភេទទូទាត់'}
                    </Link>
                    <Link to="/admin/settings/email" className="flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-xs text-slate-400 hover:bg-slate-800 hover:text-white transition-colors">
                      <span className="text-sm">📧</span> {lang === 'en' ? 'Email' : 'សារអ៊ីមែល'}
                    </Link>
                    <Link to="/admin/settings/terms" className="flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-xs text-slate-400 hover:bg-slate-800 hover:text-white transition-colors">
                      <span className="text-sm">📝</span> {lang === 'en' ? 'Terms & Condition' : 'លក្ខខណ្ឌ'}
                    </Link>
                    <Link to="/admin/settings/system-key" className="flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-xs text-slate-400 hover:bg-slate-800 hover:text-white transition-colors">
                      <span className="text-sm">🔐</span> {lang === 'en' ? 'System Key' : 'សោលគន្លឹះ'}
                    </Link>
                    <Link to="/admin/settings/bank-account" className="flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-xs text-slate-400 hover:bg-slate-800 hover:text-white transition-colors">
                      <span className="text-sm">🏦</span> {lang === 'en' ? 'Bank Account' : 'គណនីធនាគារ'}
                    </Link>
                    <Link to="/admin/settings/import-beginning" className="flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-xs text-slate-400 hover:bg-slate-800 hover:text-white transition-colors">
                      <span className="text-sm">📥</span> {lang === 'en' ? 'Import Beginning' : 'ចាប់ផ្តើម'}
                    </Link>
                    <Link to="/admin/settings/preference" className="flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-xs text-slate-400 hover:bg-slate-800 hover:text-white transition-colors">
                      <span className="text-sm">⭐</span> {lang === 'en' ? 'Preference' : 'ចូលចិត្ត'}
                    </Link>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Information Side Group (ADMIN only) */}
          {isAdmin && (
            <div className="mb-6">
              <div className="flex items-center justify-between px-3 mb-2">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                  {TEXTS.informationSide[lang]}
                </span>
                <Link
                  to="/admin/information"
                  className="text-[10px] font-bold text-blue-400 hover:text-blue-300 transition-colors uppercase tracking-wider"
                  title={lang === 'en' ? 'Open Information Hub' : 'បើកផ្ទាំងព័ត៌មាន'}
                >
                  {lang === 'en' ? 'Hub' : 'ផ្ទាំង'} ↗
                </Link>
              </div>

              {/* 1. Jobs & Careers */}
              <div className="mb-2">
                <div className="flex items-stretch">
                  <Link
                    to="/admin/jobs"
                    className={`flex min-w-0 flex-1 items-center gap-3 px-3 py-2.5 text-sm font-medium transition-all ${location.pathname.startsWith('/admin/jobs') || location.pathname === '/add-jobs' || location.pathname.startsWith('/admin/applications') ? 'bg-gradient-to-r from-orange-500/20 to-orange-600/10 text-orange-400 rounded-l-xl border-y border-l border-orange-500/30 font-bold' : 'text-slate-400 hover:bg-slate-800/60 hover:text-white hover:rounded-l-xl'}`}
                  >
                    <img src={targetIcon} alt="" className="w-5 h-5 object-contain drop-shadow" />
                    <span className="truncate">{TEXTS.jobs[lang]}</span>
                  </Link>
                  <button
                    type="button"
                    aria-label={lang === 'en' ? 'Toggle jobs menu' : 'បើកម៉ឺនុយការងារ'}
                    aria-expanded={openDropdowns.jobs}
                    className={`flex w-9 items-center justify-center text-sm transition-all ${location.pathname.startsWith('/admin/jobs') || location.pathname === '/add-jobs' || location.pathname.startsWith('/admin/applications') ? 'bg-gradient-to-r from-orange-500/20 to-orange-600/10 text-orange-400 rounded-r-xl border-y border-r border-orange-500/30' : 'text-slate-400 hover:bg-slate-800/60 hover:text-white hover:rounded-r-xl'}`}
                    onClick={() => toggleDropdown('jobs')}
                  >
                    <span className={`transition-transform duration-200 ${openDropdowns.jobs ? 'rotate-180' : ''}`}>
                      <ChevronDownIcon />
                    </span>
                  </button>
                </div>
                {openDropdowns.jobs && (
                  <div className="mt-1.5 ml-4 pl-3 border-l-2 border-orange-500/30 space-y-1 py-1">
                    <Link to="/admin/jobs" className="flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-slate-300 hover:bg-slate-800 hover:text-white transition-colors">
                      <span className="text-sm">💼</span> {lang === 'en' ? 'Manage Jobs' : 'គ្រប់គ្រងការងារ'}
                    </Link>
                    <Link to="/admin/jobs/add" className="flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-xs text-slate-400 hover:bg-slate-800 hover:text-white transition-colors">
                      <span className="text-sm">➕</span> {TEXTS.addJob[lang]}
                    </Link>
                    <Link to="/admin/applications" className="flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs text-slate-400 hover:bg-slate-800 hover:text-white transition-colors">
                      <span className="flex items-center gap-2">
                        <span className="text-sm">📋</span> {TEXTS.applications[lang]}
                      </span>
                      {Number(dashboardData.applications?.length) > 0 && (
                        <span className="rounded-full bg-orange-500/20 px-2 py-0.5 text-[10px] font-bold text-orange-400 border border-orange-500/40">
                          {dashboardData.applications.length}
                        </span>
                      )}
                    </Link>
                  </div>
                )}
              </div>

              {/* 2. Company Info (Members & Partners) */}
              <div className="mb-2">
                <div className="flex items-stretch">
                  <Link
                    to="/admin/members"
                    className={`flex min-w-0 flex-1 items-center gap-3 px-3 py-2.5 text-sm font-medium transition-all ${location.pathname.startsWith('/admin/members') || location.pathname === '/add-member' || location.pathname.startsWith('/admin/partners') || location.pathname === '/add-partner' ? 'bg-gradient-to-r from-blue-500/20 to-blue-600/10 text-blue-400 rounded-l-xl border-y border-l border-blue-500/30 font-bold' : 'text-slate-400 hover:bg-slate-800/60 hover:text-white hover:rounded-l-xl'}`}
                  >
                    <img src={trophyIcon} alt="" className="w-5 h-5 object-contain drop-shadow" />
                    <span className="truncate">{TEXTS.companyInfo[lang]}</span>
                  </Link>
                  <button
                    type="button"
                    aria-label={lang === 'en' ? 'Toggle company menu' : 'បើកម៉ឺនុយក្រុមហ៊ុន'}
                    aria-expanded={openDropdowns.members}
                    className={`flex w-9 items-center justify-center text-sm transition-all ${location.pathname.startsWith('/admin/members') || location.pathname === '/add-member' || location.pathname.startsWith('/admin/partners') || location.pathname === '/add-partner' ? 'bg-gradient-to-r from-blue-500/20 to-blue-600/10 text-blue-400 rounded-r-xl border-y border-r border-blue-500/30' : 'text-slate-400 hover:bg-slate-800/60 hover:text-white hover:rounded-r-xl'}`}
                    onClick={() => toggleDropdown('members')}
                  >
                    <span className={`transition-transform duration-200 ${openDropdowns.members ? 'rotate-180' : ''}`}>
                      <ChevronDownIcon />
                    </span>
                  </button>
                </div>
                {openDropdowns.members && (
                  <div className="mt-1.5 ml-4 pl-3 border-l-2 border-blue-500/30 space-y-1 py-1">
                    <Link to="/admin/members" className="flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-slate-300 hover:bg-slate-800 hover:text-white transition-colors">
                      <span className="text-sm">👥</span> {TEXTS.members[lang]}
                    </Link>
                    <Link to="/admin/members/add" className="flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-xs text-slate-400 hover:bg-slate-800 hover:text-white transition-colors">
                      <span className="text-sm">➕</span> {TEXTS.addMember[lang]}
                    </Link>
                    <Link to="/admin/partners" className="flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-xs text-slate-400 hover:bg-slate-800 hover:text-white transition-colors">
                      <span className="text-sm">🤝</span> {TEXTS.partners[lang]}
                    </Link>
                    <Link to="/admin/partners/add" className="flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-xs text-slate-400 hover:bg-slate-800 hover:text-white transition-colors">
                      <span className="text-sm">➕</span> {TEXTS.addPartner[lang]}
                    </Link>
                  </div>
                )}
              </div>

              {/* 3. User Access & Roles */}
              <div className="mb-2">
                <Link
                  to="/admin/users"
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${location.pathname.startsWith('/admin/users') || location.pathname === '/manage-users' ? 'bg-gradient-to-r from-purple-500/20 to-purple-600/10 text-purple-400 border border-purple-500/30 shadow-lg shadow-purple-500/10 font-bold' : 'text-slate-400 hover:bg-slate-800/60 hover:text-white'}`}
                >
                  <img src={shieldIcon} alt="" className="w-5 h-5 object-contain drop-shadow" />
                  <span>{TEXTS.users[lang]}</span>
                </Link>
              </div>
            </div>
          )}

          {/* Public Storefront Group */}
          <div className="mb-6">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider px-3 block mb-2">{lang === 'en' ? 'Public Storefront' : 'ទំព័រសាធារណៈ'}</span>
            <Link to="/products" className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-slate-400 hover:bg-slate-800 hover:text-white transition-all">
              <img src={canIcon} alt="" className="w-5 h-5 object-contain drop-shadow" />
              <span>{TEXTS.shop[lang]}</span>
            </Link>
            <Link to="/career" className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-slate-400 hover:bg-slate-800 hover:text-white transition-all">
              <img src={rocketIcon} alt="" className="w-5 h-5 object-contain drop-shadow" />
              <span>{TEXTS.career[lang]}</span>
            </Link>
            <Link to="/member" className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-slate-400 hover:bg-slate-800 hover:text-white transition-all">
              <img src={cupIcon} alt="" className="w-5 h-5 object-contain drop-shadow" />
              <span>{TEXTS.team[lang]}</span>
            </Link>
          </div>
        </nav>

        {/* Footer - Fixed at bottom */}
        <div className="px-4 py-4 border-t border-slate-700/50 flex-shrink-0 bg-slate-950/90 backdrop-blur-sm">
          <Link to="/" className="flex items-center justify-center gap-2 w-full px-4 py-2.5 text-sm font-semibold text-slate-400 hover:text-white border border-slate-700 hover:border-green-500/50 rounded-lg hover:bg-slate-800 transition-all">
            <ArrowLeftIcon />
            <span>{TEXTS.backToSite[lang]}</span>
          </Link>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 min-w-0 h-full max-h-screen flex flex-col transition-all duration-300 overflow-hidden">
        {/* Top bar */}
        <header className="flex-shrink-0 z-30 flex items-center justify-between px-3.5 sm:px-6 lg:px-8 py-3 sm:py-4 bg-slate-900/80 backdrop-blur-xl border-b border-slate-700/50">
          <div className="flex items-center gap-2.5 sm:gap-4 min-w-0">
            <button
              className="flex items-center justify-center w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-slate-800 border border-slate-700 text-green-400 hover:bg-green-500 hover:text-white hover:scale-105 transition-all shadow-lg hover:shadow-green-500/30 shrink-0"
              onClick={() => setSidebarOpen(!sidebarOpen)}
              aria-label="Toggle Sidebar"
              title={sidebarOpen ? "Hide sidebar" : "Show sidebar"}
            >
              <MenuToggleIcon />
            </button>
            <div className="min-w-0">
              <h1 className="text-white font-bold text-base sm:text-xl lg:text-2xl truncate">{TEXTS.overviewTitle[lang]}</h1>
            </div>
          </div>
          <div className="flex items-center gap-2 sm:gap-4 shrink-0">
            {/* ENG / KH language toggle */}
            <LanguageSwitcher />

            {/* Notification Bell with Dropdown */}
            <div className="relative" ref={notificationRef}>
              <button
                className="relative w-9 h-9 sm:w-11 sm:h-11 flex items-center justify-center rounded-xl bg-slate-800 border border-slate-700 hover:bg-slate-700 hover:border-slate-600 transition-all"
                onClick={() => setShowNotifications(!showNotifications)}
                aria-label="Notifications"
              >
                <span className="text-base sm:text-lg">🔔</span>
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 sm:top-1.5 sm:right-1.5 w-4 h-4 sm:w-5 sm:h-5 min-w-[16px] bg-cyan-500 rounded-full text-white text-[9px] sm:text-[10px] font-bold flex items-center justify-center animate-pulse">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </button>

              {showNotifications && (
                <div className="absolute right-0 top-full mt-2 w-72 sm:w-80 md:w-96 bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl shadow-black/50 overflow-hidden z-50 animate-in fade-in-0 zoom-in-95 duration-200">
                  {/* Header */}
                  <div className="flex items-center justify-between px-4 py-3 border-b border-slate-700">
                    <h3 className="text-white font-bold text-sm">{lang === 'en' ? 'Notifications' : 'ការជូនដំណឹង'}</h3>
                    <div className="flex items-center gap-2">
                      {unreadCount > 0 && (
                        <button
                          onClick={(e) => { e.stopPropagation(); markAllRead(); }}
                          className="text-xs text-cyan-400 hover:text-cyan-300 font-medium"
                        >
                          {lang === 'en' ? 'Mark all read' : 'គេហដំណឹងទាំងអស់'}
                        </button>
                      )}
                      <button
                        onClick={(e) => { e.stopPropagation(); clearAll(); }}
                        className="text-xs text-slate-400 hover:text-slate-300 font-medium"
                      >
                        {lang === 'en' ? 'Clear all' : 'លុបទាំងអស់'}
                      </button>
                    </div>
                  </div>

                  {/* List */}
                  <div className="max-h-96 overflow-y-auto">
                    {notifications.length === 0 ? (
                      <div className="px-4 py-8 text-center">
                        <span className="text-4xl block mb-2">🔔</span>
                        <p className="text-slate-400 text-sm">{lang === 'en' ? 'No notifications yet' : 'មិនមានការជូនដំណឹងនៅមុននេះ'}</p>
                      </div>
                    ) : (
                      <ul className="divide-y divide-slate-700/50">
                        {notifications.map((n) => (
                          <li
                            key={n.id}
                            className={`px-4 py-3 flex gap-3 transition-colors ${!n.read ? 'bg-cyan-500/5' : 'hover:bg-slate-800/50'}`}
                            onClick={() => {
                              if (!n.read) markAsRead(n.id)
                              if (n.href) window.location.href = n.href
                              setShowNotifications(false)
                            }}
                          >
                            <span
                              className="w-9 h-9 min-w-[36px] flex items-center justify-center rounded-xl text-base flex-shrink-0"
                              style={{ background: `${n.color}20`, color: n.color }}
                            >
                              {n.icon}
                            </span>
                            <div className="flex-1 min-w-0">
                              <p className={`text-sm leading-snug ${!n.read ? 'text-white font-medium' : 'text-slate-300'}`}>
                                {n.title}
                              </p>
                              {n.detail && (
                                <p className="text-[11px] text-slate-500 mt-0.5 truncate">{n.detail}</p>
                              )}
                              <p className="text-[10px] text-slate-500 mt-1">{formatTime(n.createdAt)}</p>
                            </div>
                            {!n.read && (
                              <span className="w-2 h-2 bg-cyan-500 rounded-full flex-shrink-0 mt-2" />
                            )}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>

                  {/* Dropdown Footer: Full Stored History */}
                  <div className="border-t border-slate-800 bg-slate-950 p-2 text-center">
                    <Link
                      to="/admin/notifications"
                      onClick={() => setShowNotifications(false)}
                      className="flex items-center justify-center gap-1.5 rounded-xl py-2 text-xs font-bold text-purple-400 hover:bg-purple-500/10 hover:text-purple-300 transition"
                    >
                      <span>📜</span>
                      <span>{lang === 'en' ? 'View Full Stored History' : 'មើលប្រវត្តិសកម្មភាពទាំងអស់'} →</span>
                    </Link>
                  </div>
                </div>
              )}
            </div>

          </div>
        </header>

        <div className="flex-1 min-h-0 p-3 sm:p-5 md:p-6 lg:p-8 overflow-y-auto overflow-x-hidden max-w-full min-w-0 scrollbar-thin">{renderContent()}</div>
      </main>
    </div>
  )
}

const MenuToggleIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="3" y1="6" x2="21" y2="6" />
    <line x1="3" y1="12" x2="21" y2="12" />
    <line x1="3" y1="18" x2="21" y2="18" />
  </svg>
)

const ChevronIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
    <polyline points="9 18 15 12 9 6" />
  </svg>
)

const HomeIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
    <polyline points="9 22 9 12 15 12 15 22" />
  </svg>
)

const PackageIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <line x1="16.5" y1="9.4" x2="7.5" y2="4.21" />
    <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
    <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
    <line x1="12" y1="22.08" x2="12" y2="12" />
  </svg>
)

const BriefcaseIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
    <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
  </svg>
)

const UsersIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
  </svg>
)

const ShopIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
    <line x1="3" y1="6" x2="21" y2="6" />
    <path d="M16 10a4 4 0 0 1-8 0" />
  </svg>
)

const GlobeIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <circle cx="12" cy="12" r="10" />
    <line x1="2" y1="12" x2="22" y2="12" />
    <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
  </svg>
)

const TeamIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
  </svg>
)

const ArrowLeftIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
    <line x1="19" y1="12" x2="5" y2="12" />
    <polyline points="12 19 5 12 12 5" />
  </svg>
)

const ShieldIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
  </svg>
)

const TagIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" />
    <line x1="7" y1="7" x2="7.01" y2="7" />
  </svg>
)

const HandshakeIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M11 17a1 1 0 0 1 2 0" />
    <path d="M3 11.5V8a2 2 0 0 1 2-2h1.5L8 4h4l2 2h3.5a2 2 0 0 1 2 2v3.5" />
    <path d="M21 12.5V16a2 2 0 0 1-2 2h-1.5L16 20h-4l-2-2H8.5" />
    <path d="M3 11.5l4.5 4.5" />
    <path d="M21 12.5l-4.5 4.5" />
    <path d="M12 17l-2 2" />
    <path d="M12 17l2 2" />
  </svg>
)

const ChevronDownIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
    <polyline points="6 9 12 15 18 9" />
  </svg>
)

const TruckIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
    <path d="M16 8h4l3 3v5a2 2 0 0 1-2 2h-1" />
    <circle cx="5.5" cy="18.5" r="2.5" />
    <circle cx="18.5" cy="18.5" r="2.5" />
  </svg>
)

const ClipboardIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
    <rect x="8" y="2" width="8" height="4" rx="1" ry="1" />
  </svg>
)

export default AdminD
