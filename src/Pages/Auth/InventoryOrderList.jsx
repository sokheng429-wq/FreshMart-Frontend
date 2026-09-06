import React, { useState, useEffect, useMemo } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useLanguage } from '../../context/LanguageContext'
import { useNotifications } from '../../context/NotificationContext'
import {
  adminProductAPI,
  adminSupplierAPI,
  adminPaymentTermAPI,
  adminCategoryAPI,
  adminBrandAPI,
  adminProductGroupAPI,
} from '../../api/api'
import { exportStyledExcel } from '../../utils/excelExport'
import chartIcon from '../../assets/icon/3dicons-chart-dynamic-color.png'
import bagIcon from '../../assets/icon/3dicons-bag-dynamic-color.png'
import './ProductsHub.css'

// Truck / local_shipping icon
function LocalShippingIcon({ className = 'w-4 h-4' }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h2" />
    </svg>
  )
}

function SearchIcon({ className = 'w-4 h-4' }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
    </svg>
  )
}

function FilterIcon({ className = 'w-4 h-4' }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
    </svg>
  )
}

function ChevronDownIcon({ className = 'w-4 h-4' }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
    </svg>
  )
}

function RefreshIcon({ className = 'w-4 h-4' }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
    </svg>
  )
}

function PlusIcon({ className = 'w-4 h-4' }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
    </svg>
  )
}

function TrashIcon({ className = 'w-4 h-4' }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
    </svg>
  )
}

function CheckIcon({ className = 'w-4 h-4' }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
    </svg>
  )
}

function ImageIcon({ className = 'w-4 h-4' }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
  )
}

// Columns definition for Choose Column
const ALL_COLUMNS = [
  { key: 'picture', label: { en: 'Picture', kh: 'រូបភាព' }, always: true },
  { key: 'code', label: { en: 'Code', kh: 'កូដ' }, always: true },
  { key: 'barcode', label: { en: 'Barcode', kh: 'បាកូដ' }, always: true },
  { key: 'description', label: { en: 'Description', kh: 'ការពិពណ៌នា' }, always: true },
  { key: 'uom', label: { en: 'UOM', kh: 'ខ្នាត' }, always: true },
  { key: 'onhand', label: { en: 'Onhand', kh: 'ស្តុកជាក់ស្តែង' }, always: true },
  { key: 'orderPoint', label: { en: 'Order Point', kh: 'ចំណុចបញ្ជាទិញ' }, always: true },
  { key: 'orderQuantity', label: { en: 'Order Quantity', kh: 'បរិមាណបញ្ជាទិញ' }, always: true },
  { key: 'productGroup', label: { en: 'Product Group', kh: 'ក្រុមទំនិញ' } },
  { key: 'brand', label: { en: 'Brand', kh: 'ម៉ាក' } },
  { key: 'category', label: { en: 'Category', kh: 'ប្រភេទ' } },
  { key: 'actions', label: { en: 'Action', kh: 'សកម្មភាព' }, always: true },
]

const DEFAULT_VISIBLE = ['picture', 'code', 'barcode', 'description', 'uom', 'onhand', 'orderPoint', 'orderQuantity', 'actions']

// Format date time helper: MM/DD/YYYY hh:mm AM/PM
function formatDateTime(date = new Date()) {
  const d = new Date(date)
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  const year = d.getFullYear()
  let hours = d.getHours()
  const minutes = String(d.getMinutes()).padStart(2, '0')
  const ampm = hours >= 12 ? 'PM' : 'AM'
  hours = hours % 12 || 12
  const formattedHours = String(hours).padStart(2, '0')
  return `${month}/${day}/${year} ${formattedHours}:${minutes} ${ampm}`
}

function getDefaultRequiredDate() {
  const d = new Date(Date.now() + 7 * 86400000)
  return formatDateTime(d)
}

function generatePOCode() {
  const d = new Date()
  const ymd = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}`
  const rand = Math.floor(1000 + Math.random() * 9000)
  return `PO-${ymd}-${rand}`
}

// Intelligent Product Image Resolver
function resolveProductImage(p) {
  if (typeof p.imageUrl === 'string' && p.imageUrl.trim() && !p.imageUrl.startsWith('blob:')) {
    return p.imageUrl.trim()
  }
  if (typeof p.image === 'string' && p.image.trim() && !p.image.startsWith('blob:')) {
    return p.image.trim()
  }
  if (Array.isArray(p.photos) && p.photos.length > 0 && typeof p.photos[0] === 'string') {
    return p.photos[0].trim()
  }

  // Realistic grocery fallbacks based on description / category
  const desc = String(p.description || p.name || p.productName || '').toLowerCase()
  const cat = String(p.category || p.categoryName || '').toLowerCase()

  if (desc.includes('coca') || desc.includes('cola') || desc.includes('pepsi') || desc.includes('soda')) {
    return 'https://images.unsplash.com/photo-1629203851122-3726ecdf080e?w=200&h=200&fit=crop'
  }
  if (desc.includes('lays') || desc.includes('chip') || desc.includes('snack')) {
    return 'https://images.unsplash.com/photo-1566478989037-eec170784d0b?w=200&h=200&fit=crop'
  }
  if (desc.includes('rice') || desc.includes('jasmine')) {
    return 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=200&h=200&fit=crop'
  }
  if (desc.includes('milk') || desc.includes('dairy') || cat.includes('dairy')) {
    return 'https://images.unsplash.com/photo-1563636619-e9143da7973b?w=200&h=200&fit=crop'
  }
  if (desc.includes('tuna') || desc.includes('fish') || desc.includes('canned')) {
    return 'https://images.unsplash.com/photo-1607623814075-e51df1bdc82f?w=200&h=200&fit=crop'
  }
  if (desc.includes('egg') || cat.includes('egg')) {
    return 'https://images.unsplash.com/photo-1506976785307-8732e854ad03?w=200&h=200&fit=crop'
  }
  if (desc.includes('water') || desc.includes('drink') || cat.includes('beverage')) {
    return 'https://images.unsplash.com/photo-1548839140-29a749e1cf4d?w=200&h=200&fit=crop'
  }
  if (cat.includes('fruit') || desc.includes('apple') || desc.includes('banana')) {
    return 'https://images.unsplash.com/photo-1610832958506-aa56368176cf?w=200&h=200&fit=crop'
  }

  return 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=200&h=200&fit=crop'
}

export default function InventoryOrderList() {
  const { lang } = useLanguage()
  const { addNotification } = useNotifications()
  const navigate = useNavigate()

  // View mode: 'list' (main inventory table) or 'po_create' (purchase order info form)
  const [viewMode, setViewMode] = useState('list')

  // Raw catalog state
  const [rawProducts, setRawProducts] = useState([])
  const [suppliers, setSuppliers] = useState([])
  const [paymentTerms, setPaymentTerms] = useState([])
  const [productGroups, setProductGroups] = useState([])
  const [brands, setBrands] = useState([])
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)

  // Search & Filter state
  const [searchText, setSearchText] = useState('')
  const [searchBy, setSearchBy] = useState('Any') // Any, Code, Description, Barcode
  const [appliedSearch, setAppliedSearch] = useState({ text: '', by: 'Any' })

  // Advance filter state
  const [advanceFilterOpen, setAdvanceFilterOpen] = useState(false)
  const [filterProduct, setFilterProduct] = useState('')
  const [filterGroup, setFilterGroup] = useState('all')
  const [filterBrand, setFilterBrand] = useState('all')
  const [filterCategory, setFilterCategory] = useState('all')

  // Table Column Visibility
  const [chooseColumnOpen, setChooseColumnOpen] = useState(false)
  const [visibleColumns, setVisibleColumns] = useState(DEFAULT_VISIBLE)

  // ===== PO CREATE FORM STATE =====
  const [poSupplier, setPoSupplier] = useState('')
  const [poDate, setPoDate] = useState(() => formatDateTime(new Date()))
  const [poRequiredDate, setPoRequiredDate] = useState(() => getDefaultRequiredDate())
  const [poCode, setPoCode] = useState(() => generatePOCode())
  const [poPaymentTerm, setPoPaymentTerm] = useState('Net 30 Days')
  const [poPurchasePerson, setPoPurchasePerson] = useState('Badmin')
  const [poShipmentMethod, setPoShipmentMethod] = useState('Supplier Delivery')
  const [poBarcodeHint, setPoBarcodeHint] = useState('')

  // PO Tabs: 'po_list', 'bill_info', 'shipping_info', 'freight_info', 'supplier_history', 'others'
  const [activeTab, setActiveTab] = useState('po_list')

  // PO List tab filters
  const [poItemSearch, setPoItemSearch] = useState('')
  const [poItemGroupFilter, setPoItemGroupFilter] = useState('all')

  // PO Dynamic Lines
  const [poLines, setPoLines] = useState([])

  // PO Summary Fields
  const [poOutlet, setPoOutlet] = useState('Main Store Warehouse - Toul Kork')
  const [poTemplateName, setPoTemplateName] = useState('Standard Restock Template')
  const [poNote, setPoNote] = useState('')
  const [poDiscountPercent, setPoDiscountPercent] = useState(0)
  const [poDiscountAmount, setPoDiscountAmount] = useState(0)
  const [poTaxPercent, setPoTaxPercent] = useState(0) // 0% or 10%
  const [poSubmitting, setPoSubmitting] = useState(false)

  // Add Item Modal in PO creation
  const [addItemModalOpen, setAddItemModalOpen] = useState(false)
  const [itemPickerSearch, setItemPickerSearch] = useState('')

  // ===== FETCH LIVE DATA =====
  const fetchLiveData = async () => {
    setLoading(true)
    try {
      const [prodRes, supRes, termRes, catRes, brandRes, grpRes] = await Promise.allSettled([
        adminProductAPI.getAll(),
        adminSupplierAPI.getAll(),
        adminPaymentTermAPI.getAll(),
        adminCategoryAPI.getAll(),
        adminBrandAPI.getAll(),
        adminProductGroupAPI.getAll(),
      ])

      let prods = []
      if (prodRes.status === 'fulfilled' && prodRes.value) {
        prods = prodRes.value.data || prodRes.value || []
      }

      let sups = []
      if (supRes.status === 'fulfilled' && supRes.value) {
        sups = supRes.value.data || supRes.value || []
      }

      let terms = []
      if (termRes.status === 'fulfilled' && termRes.value) {
        terms = termRes.value.data || termRes.value || []
      }

      let cats = []
      if (catRes.status === 'fulfilled' && catRes.value) {
        cats = catRes.value.data || catRes.value || []
      }

      let brnds = []
      if (brandRes.status === 'fulfilled' && brandRes.value) {
        brnds = brandRes.value.data || brandRes.value || []
      }

      let grps = []
      if (grpRes.status === 'fulfilled' && grpRes.value) {
        grps = grpRes.value.data || grpRes.value || []
      }

      setSuppliers(Array.isArray(sups) ? sups : [])
      setPaymentTerms(Array.isArray(terms) ? terms : [])
      setCategories(Array.isArray(cats) ? cats : [])
      setBrands(Array.isArray(brnds) ? brnds : [])
      setProductGroups(Array.isArray(grps) ? grps : [])

      if (Array.isArray(prods) && prods.length > 0) {
        setRawProducts(prods)
      } else {
        // High quality baseline fallback if no products currently exist
        const fallbackProds = [
          {
            id: 101,
            code: 'BEV-CC-001',
            barCode: '8850123000124',
            name: 'Coca Cola 330ml Can',
            description: 'Coca Cola 330ml Original Can',
            uom: 'Can',
            onHand: 4,
            minStockLevel: 24,
            averageCost: 0.45,
            supplier: 'Cambodia Beverage Co.',
            productGroup: 'Beverages',
            brand: 'Coca-Cola',
            category: 'Drinks',
            imageUrl: 'https://images.unsplash.com/photo-1629203851122-3726ecdf080e?w=200&h=200&fit=crop',
          },
          {
            id: 102,
            code: 'SNK-PO-002',
            barCode: '8850123000230',
            name: 'Lays Potato Chips Classic',
            description: 'Lays Potato Chips Classic 50g',
            uom: 'Pcs',
            onHand: 0,
            minStockLevel: 15,
            averageCost: 1.10,
            supplier: 'Global Food Supply',
            productGroup: 'Snacks & Confectionery',
            brand: 'Lays',
            category: 'Snacks',
            imageUrl: 'https://images.unsplash.com/photo-1566478989037-eec170784d0b?w=200&h=200&fit=crop',
          },
          {
            id: 103,
            code: 'DRY-RC-003',
            barCode: '8850123000347',
            name: 'Jasmine Fragrant Rice 5kg',
            description: 'Angkor Jasmine Fragrant Premium Rice 5kg Bag',
            uom: 'Bag',
            onHand: 3,
            minStockLevel: 10,
            averageCost: 4.50,
            supplier: 'Angkor Rice Mills',
            productGroup: 'Grains & Staples',
            brand: 'Angkor Harvest',
            category: 'Dry Grocery',
            imageUrl: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=200&h=200&fit=crop',
          },
          {
            id: 104,
            code: 'DAI-MK-004',
            barCode: '8850123000453',
            name: 'Fresh Whole Milk 1L',
            description: 'Farm Pure Fresh Whole Pasteurized Milk 1L',
            uom: 'Bottle',
            onHand: 6,
            minStockLevel: 20,
            averageCost: 1.80,
            supplier: 'Farm Pure Dairy',
            productGroup: 'Dairy & Chilled',
            brand: 'Farm Pure',
            category: 'Dairy',
            imageUrl: 'https://images.unsplash.com/photo-1563636619-e9143da7973b?w=200&h=200&fit=crop',
          },
          {
            id: 105,
            code: 'CND-TB-005',
            barCode: '8850123000569',
            name: 'Canned Tuna in Olive Oil',
            description: 'Canned Yellowfin Tuna in Olive Oil 185g',
            uom: 'Can',
            onHand: 2,
            minStockLevel: 18,
            averageCost: 1.65,
            supplier: 'Ocean Blue Seafoods',
            productGroup: 'Canned Goods',
            brand: 'Ocean Catch',
            category: 'Dry Grocery',
            imageUrl: 'https://images.unsplash.com/photo-1607623814075-e51df1bdc82f?w=200&h=200&fit=crop',
          },
        ]
        setRawProducts(fallbackProds)
      }
    } catch {
      // Keep state
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchLiveData()
  }, [])

  // Process raw products into standardized Inventory to Order items
  const processedItems = useMemo(() => {
    return rawProducts.map((p, idx) => {
      const onhand = Number(
        p.onHand != null ? p.onHand : p.stockQuantity != null ? p.stockQuantity : p.stock != null ? p.stock : 0
      )
      const orderPoint = Number(
        p.minStockLevel || p.reorderPoint || (onhand <= 5 ? 20 : Math.max(10, Math.ceil(onhand * 1.5)))
      )
      // Calculated order quantity
      const orderQuantity =
        p.orderQuantity != null
          ? Number(p.orderQuantity)
          : onhand < orderPoint
          ? Math.max(1, orderPoint * 2 - Math.max(0, onhand))
          : Math.max(1, orderPoint)

      const cost = Number(p.averageCost || p.standardCost || p.costPrice || p.basePrice || 1.0)
      const code = p.code || p.productCode || `PRD-${String(p.id || idx + 1).padStart(4, '0')}`
      const barcode = p.barCode || p.barcode || '—'
      const description = p.description || p.name || p.productName || 'General Product'
      const uom = p.uom || p.unit || 'Pcs'
      const supplierName = p.supplier || p.supplierName || (suppliers[0]?.name || 'Primary Supplier')
      const productGroup = p.productGroup || p.groupName || 'General'
      const brand = p.brand || p.brandName || 'Generic'
      const category = p.category || p.categoryName || 'General'
      const imageUrl = resolveProductImage(p)

      return {
        id: p.id || idx + 1,
        code,
        barcode,
        description,
        nameKh: p.nameKh || '',
        uom,
        onhand,
        orderPoint,
        orderQuantity,
        cost,
        supplier: supplierName,
        productGroup,
        brand,
        category,
        imageUrl,
        originalProduct: p,
      }
    })
  }, [rawProducts, suppliers])

  // Extract distinct filter dropdown options
  const distinctGroups = useMemo(() => {
    const fromProds = processedItems.map((p) => p.productGroup).filter(Boolean)
    const fromApi = productGroups.map((g) => g.name || g.code).filter(Boolean)
    return Array.from(new Set([...fromApi, ...fromProds])).sort()
  }, [processedItems, productGroups])

  const distinctBrands = useMemo(() => {
    const fromProds = processedItems.map((p) => p.brand).filter(Boolean)
    const fromApi = brands.map((b) => b.description || b.code).filter(Boolean)
    return Array.from(new Set([...fromApi, ...fromProds])).sort()
  }, [processedItems, brands])

  const distinctCategories = useMemo(() => {
    const fromProds = processedItems.map((p) => p.category).filter(Boolean)
    const fromApi = categories.map((c) => c.description || c.code).filter(Boolean)
    return Array.from(new Set([...fromApi, ...fromProds])).sort()
  }, [processedItems, categories])

  // Execute Search button
  const handleSearchClick = () => {
    setAppliedSearch({
      text: searchText.trim(),
      by: searchBy,
    })
  }

  // Filtered Products
  const filteredProducts = useMemo(() => {
    return processedItems.filter((item) => {
      // 1. Primary Search
      if (appliedSearch.text) {
        const q = appliedSearch.text.toLowerCase()
        if (appliedSearch.by === 'Code') {
          if (!item.code.toLowerCase().includes(q)) return false
        } else if (appliedSearch.by === 'Description') {
          if (!item.description.toLowerCase().includes(q) && !item.nameKh.toLowerCase().includes(q)) return false
        } else if (appliedSearch.by === 'Barcode') {
          if (!item.barcode.toLowerCase().includes(q)) return false
        } else {
          // Any
          const anyMatch =
            item.code.toLowerCase().includes(q) ||
            item.barcode.toLowerCase().includes(q) ||
            item.description.toLowerCase().includes(q) ||
            item.nameKh.toLowerCase().includes(q) ||
            item.supplier.toLowerCase().includes(q)
          if (!anyMatch) return false
        }
      }

      // 2. Advance Filters
      if (filterProduct.trim()) {
        const pq = filterProduct.trim().toLowerCase()
        const prodMatch =
          item.code.toLowerCase().includes(pq) ||
          item.barcode.toLowerCase().includes(pq) ||
          item.description.toLowerCase().includes(pq)
        if (!prodMatch) return false
      }

      if (filterGroup !== 'all' && item.productGroup !== filterGroup) return false
      if (filterBrand !== 'all' && item.brand !== filterBrand) return false
      if (filterCategory !== 'all' && item.category !== filterCategory) return false

      return true
    })
  }, [processedItems, appliedSearch, filterProduct, filterGroup, filterBrand, filterCategory])

  // Reset Advance Filters
  const handleResetFilters = () => {
    setSearchText('')
    setSearchBy('Any')
    setAppliedSearch({ text: '', by: 'Any' })
    setFilterProduct('')
    setFilterGroup('all')
    setFilterBrand('all')
    setFilterCategory('all')
  }

  // Toggle Column
  const toggleColumn = (key) => {
    const def = ALL_COLUMNS.find((c) => c.key === key)
    if (def?.always) return
    setVisibleColumns((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    )
  }

  // Handle Export Excel
  const handleExportExcel = () => {
    if (filteredProducts.length === 0) {
      addNotification?.('No products to export', 'warning')
      return
    }
    const headers = [
      'Code',
      'Barcode',
      'Description',
      'UOM',
      'Onhand',
      'Order Point',
      'Order Quantity',
      'Product Group',
      'Brand',
      'Category',
      'Est. Unit Cost ($)',
    ]
    const data = filteredProducts.map((p) => [
      p.code,
      p.barcode,
      p.description,
      p.uom,
      p.onhand,
      p.orderPoint,
      p.orderQuantity,
      p.productGroup,
      p.brand,
      p.category,
      p.cost.toFixed(2),
    ])
    exportStyledExcel(
      headers,
      data,
      `inventory_to_order_${new Date().toISOString().slice(0, 10)}.xlsx`,
      'Inventory to Order'
    )
    addNotification?.('Inventory to Order exported successfully', 'success')
  }

  // ===== TRANSITION TO PURCHASE ORDER VIEW ON LOCAL_SHIPPING CLICK =====
  const handleOpenPOForProduct = (item) => {
    // Determine supplier
    const supName = item.supplier || (suppliers[0]?.name || 'Cambodia Beverage Co.')
    setPoSupplier(supName)
    setPoDate(formatDateTime(new Date()))
    setPoRequiredDate(getDefaultRequiredDate())
    setPoCode(generatePOCode())

    // Default payment term
    const defTerm = paymentTerms[0]?.description || paymentTerms[0]?.code || 'Net 30 Days'
    setPoPaymentTerm(defTerm)

    setPoPurchasePerson('Badmin')
    setPoShipmentMethod('Supplier Delivery')
    setPoBarcodeHint('')
    setActiveTab('po_list')
    setPoItemSearch('')
    setPoItemGroupFilter('all')

    // Create line item
    const initialLine = {
      id: 1,
      productId: item.id,
      code: item.code,
      barcode: item.barcode,
      description: item.description,
      description2: item.nameKh || item.productGroup,
      onhand: item.onhand,
      suggestQty: item.orderQuantity,
      qty: item.orderQuantity,
      cost: item.cost,
      discount: 0,
      uom: item.uom,
      total: item.orderQuantity * item.cost,
      imageUrl: item.imageUrl,
    }
    setPoLines([initialLine])

    setPoOutlet('Main Store Warehouse - Toul Kork')
    setPoTemplateName('Standard Restock Template')
    setPoNote(`Auto-drafted from Inventory to Order for low stock: ${item.code} (${item.description})`)
    setPoDiscountPercent(0)
    setPoDiscountAmount(0)
    setPoTaxPercent(0)

    // Switch view
    setViewMode('po_create')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  // ===== PO LINE MANAGEMENT =====
  const updateLine = (lineId, field, val) => {
    setPoLines((prev) =>
      prev.map((l) => {
        if (l.id !== lineId) return l
        const updated = { ...l, [field]: val }
        const q = Number(updated.qty) || 0
        const c = Number(updated.cost) || 0
        const d = Number(updated.discount) || 0
        updated.total = Math.max(0, q * c - d)
        return updated
      })
    )
  }

  const removeLine = (lineId) => {
    if (poLines.length <= 1) {
      addNotification?.('PO must contain at least one line item', 'warning')
      return
    }
    setPoLines((prev) => prev.filter((l) => l.id !== lineId))
  }

  // Quick Barcode / SKU Scan in PO
  const handleBarcodeScan = (e) => {
    if (e.key === 'Enter' && poBarcodeHint.trim()) {
      e.preventDefault()
      const query = poBarcodeHint.trim().toLowerCase()
      const match = processedItems.find(
        (p) =>
          p.barcode.toLowerCase() === query ||
          p.code.toLowerCase() === query ||
          p.description.toLowerCase().includes(query)
      )

      if (match) {
        // Check if already in lines
        const existing = poLines.find((l) => l.productId === match.id || l.code === match.code)
        if (existing) {
          updateLine(existing.id, 'qty', Number(existing.qty) + 1)
          addNotification?.(`Increased quantity for ${match.description}`, 'info')
        } else {
          const newLine = {
            id: Date.now(),
            productId: match.id,
            code: match.code,
            barcode: match.barcode,
            description: match.description,
            description2: match.nameKh || match.productGroup,
            onhand: match.onhand,
            suggestQty: match.orderQuantity,
            qty: match.orderQuantity || 1,
            cost: match.cost,
            discount: 0,
            uom: match.uom,
            total: (match.orderQuantity || 1) * match.cost,
            imageUrl: match.imageUrl,
          }
          setPoLines((prev) => [...prev, newLine])
          addNotification?.(`Added ${match.description} to PO`, 'success')
        }
        setPoBarcodeHint('')
      } else {
        addNotification?.(`No product matching barcode / SKU: "${poBarcodeHint}"`, 'warning')
      }
    }
  }

  // Add Item from Catalog Picker Modal
  const handleAddItemFromPicker = (item) => {
    const existing = poLines.find((l) => l.productId === item.id || l.code === item.code)
    if (existing) {
      updateLine(existing.id, 'qty', Number(existing.qty) + 1)
      addNotification?.(`Increased quantity for ${item.description}`, 'info')
    } else {
      const newLine = {
        id: Date.now(),
        productId: item.id,
        code: item.code,
        barcode: item.barcode,
        description: item.description,
        description2: item.nameKh || item.productGroup,
        onhand: item.onhand,
        suggestQty: item.orderQuantity,
        qty: item.orderQuantity || 1,
        cost: item.cost,
        discount: 0,
        uom: item.uom,
        total: (item.orderQuantity || 1) * item.cost,
        imageUrl: item.imageUrl,
      }
      setPoLines((prev) => [...prev, newLine])
      addNotification?.(`Added ${item.description}`, 'success')
    }
    setAddItemModalOpen(false)
  }

  // Filtered Lines in PO view tab
  const filteredPoLines = useMemo(() => {
    return poLines.filter((l) => {
      if (poItemSearch.trim()) {
        const q = poItemSearch.trim().toLowerCase()
        const match =
          l.code.toLowerCase().includes(q) ||
          l.barcode.toLowerCase().includes(q) ||
          l.description.toLowerCase().includes(q) ||
          String(l.description2 || '').toLowerCase().includes(q)
        if (!match) return false
      }
      if (poItemGroupFilter !== 'all') {
        const orig = processedItems.find((p) => p.id === l.productId || p.code === l.code)
        if (orig && orig.productGroup !== poItemGroupFilter) return false
      }
      return true
    })
  }, [poLines, poItemSearch, poItemGroupFilter, processedItems])

  // PO Line Totals
  const poTotals = useMemo(() => {
    const totalQty = poLines.reduce((sum, l) => sum + (Number(l.qty) || 0), 0)
    const totalDiscount = poLines.reduce((sum, l) => sum + (Number(l.discount) || 0), 0)
    const subAmount = poLines.reduce((sum, l) => sum + (Number(l.total) || 0), 0)

    // Summary discounts
    const pctDisc = (subAmount * (Number(poDiscountPercent) || 0)) / 100
    const fixedDisc = Number(poDiscountAmount) || 0
    const totalHeaderDiscount = pctDisc + fixedDisc

    const taxableAmount = Math.max(0, subAmount - totalHeaderDiscount)
    const taxAmount = (taxableAmount * (Number(poTaxPercent) || 0)) / 100
    const grandTotal = taxableAmount + taxAmount

    return {
      itemsCount: poLines.length,
      totalQty,
      totalDiscount,
      subAmount,
      totalHeaderDiscount,
      taxAmount,
      grandTotal,
    }
  }, [poLines, poDiscountPercent, poDiscountAmount, poTaxPercent])

  // Save Purchase Order to localStorage & return to list
  const handleSavePO = () => {
    if (!poSupplier) {
      addNotification?.('Please select a Supplier', 'warning')
      return
    }
    if (poLines.length === 0) {
      addNotification?.('Please add at least one line item', 'warning')
      return
    }

    setPoSubmitting(true)
    try {
      const newPO = {
        id: Date.now(),
        code: poCode || generatePOCode(),
        orderDate: poDate,
        deliveryDate: poRequiredDate,
        supplier: poSupplier,
        warehouse: poOutlet,
        paymentTerm: poPaymentTerm,
        buyer: poPurchasePerson,
        shipmentMethod: poShipmentMethod,
        templateName: poTemplateName,
        status: 'ISSUED',
        note: poNote,
        lines: poLines.map((l, idx) => ({
          id: idx + 1,
          productId: l.productId,
          productCode: l.code,
          productName: l.description,
          qty: Number(l.qty),
          unitCost: Number(l.cost),
          discount: Number(l.discount),
          uom: l.uom,
          lineTotal: Number(l.total),
          imageUrl: l.imageUrl,
        })),
        subtotal: poTotals.subAmount,
        discountPercent: Number(poDiscountPercent) || 0,
        discountAmount: Number(poDiscountAmount) || 0,
        taxPercent: Number(poTaxPercent) || 0,
        taxAmount: poTotals.taxAmount,
        grandTotal: poTotals.grandTotal,
        createdAt: new Date().toISOString(),
      }

      // Persist to bg_purchase_orders so it appears in Purchase Order list!
      let existingPOs = []
      try {
        const saved = localStorage.getItem('bg_purchase_orders')
        if (saved) existingPOs = JSON.parse(saved)
      } catch {
        existingPOs = []
      }

      const updated = [newPO, ...existingPOs]
      localStorage.setItem('bg_purchase_orders', JSON.stringify(updated))

      addNotification?.(`Purchase Order ${newPO.code} created successfully!`, 'success')
      setViewMode('list')
    } catch {
      addNotification?.('Failed to save Purchase Order', 'error')
    } finally {
      setPoSubmitting(false)
    }
  }

  // ==========================================
  // VIEW: PURCHASE ORDER INFORMATION (PO CREATE)
  // ==========================================
  if (viewMode === 'po_create') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-slate-100 p-4 sm:p-6 lg:p-8 font-sans">
        {/* Top Header & Breadcrumbs */}
        <div className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-slate-800 pb-5">
          <div>
            <div className="flex items-center gap-2 text-xs text-slate-400 mb-1">
              <Link to="/admin/purchase-management" className="hover:text-amber-400 transition-colors">
                {lang === 'en' ? 'Purchase Management' : 'ការគ្រប់គ្រងការទិញ'}
              </Link>
              <span>/</span>
              <button
                type="button"
                onClick={() => setViewMode('list')}
                className="hover:text-amber-400 transition-colors"
              >
                {lang === 'en' ? 'Inventory to Order' : 'ស្តុកដែលត្រូវបញ្ជាទិញ'}
              </button>
              <span>/</span>
              <span className="text-cyan-400 font-medium">
                {lang === 'en' ? 'Purchase Order Information' : 'ព័ត៌មានការបញ្ជាទិញ'}
              </span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500/20 to-blue-600/30 border border-cyan-500/30 flex items-center justify-center shadow-lg shadow-cyan-900/20">
                <img src={bagIcon} alt="" className="w-6 h-6 object-contain" />
              </div>
              <div>
                <h1 className="text-2xl font-black tracking-tight text-white flex items-center gap-2">
                  <span>{lang === 'en' ? 'Purchase Order Information' : 'ព័ត៌មានការបញ្ជាទិញ (PO)'}</span>
                  <span className="text-xs px-2.5 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 font-mono">
                    {poCode}
                  </span>
                </h1>
                <p className="text-xs text-slate-400 mt-0.5">
                  {lang === 'en'
                    ? 'Add primary information for purchase order'
                    : 'បញ្ចូលព័ត៌មានចម្បងសម្រាប់លិខិតបញ្ជាទិញទំនិញ'}
                </p>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={() => setViewMode('list')}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-300 bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700/60 transition-all active:scale-95"
            >
              {lang === 'en' ? '← Back to Inventory' : '← ត្រឡប់ក្រោយ'}
            </button>
            <button
              type="button"
              onClick={handleSavePO}
              disabled={poSubmitting}
              className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-cyan-500 via-blue-600 to-emerald-600 hover:from-cyan-400 hover:to-emerald-500 shadow-lg shadow-cyan-900/30 transition-all hover:scale-[1.02] active:scale-95 flex items-center gap-2"
            >
              <CheckIcon className="w-4 h-4" />
              <span>{poSubmitting ? 'Saving...' : lang === 'en' ? 'Save Purchase Order' : 'រក្សាទុកការបញ្ជាទិញ'}</span>
            </button>
          </div>
        </div>

        {/* TOP CARD: Primary Information */}
        <div className="bg-slate-900/90 rounded-2xl border border-slate-800 shadow-xl p-5 mb-6 backdrop-blur-sm">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-800/80">
            <div>
              <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
                {lang === 'en' ? 'Purchase Order Information' : 'ព័ត៌មានបឋមនៃ PO'}
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                {lang === 'en' ? 'Add primary information for purchase order' : 'បញ្ចូលព័ត៌មានលម្អិតបឋម'}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setPoCode(generatePOCode())}
              className="text-xs text-cyan-400 hover:text-cyan-300 flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-cyan-500/10 border border-cyan-500/20"
              title="Generate new PO Code"
            >
              <RefreshIcon className="w-3.5 h-3.5" />
              <span>{lang === 'en' ? 'New Code' : 'លេខកូដថ្មី'}</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
            {/* Supplier * */}
            <div>
              <label className="block text-slate-300 font-semibold mb-1.5">
                {lang === 'en' ? 'Supplier' : 'អ្នកផ្គត់ផ្គង់'} <span className="text-red-400">*</span>
              </label>
              <select
                value={poSupplier}
                onChange={(e) => setPoSupplier(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-cyan-500"
              >
                <option value="">{lang === 'en' ? '-- Select Supplier --' : '-- ជ្រើសរើសអ្នកផ្គត់ផ្គង់ --'}</option>
                {suppliers.length > 0 ? (
                  suppliers.map((s) => (
                    <option key={s.id || s.name} value={s.name}>
                      {s.name} {s.contactNumber ? `(${s.contactNumber})` : ''}
                    </option>
                  ))
                ) : (
                  <>
                    <option value="Cambodia Beverage Co.">Cambodia Beverage Co.</option>
                    <option value="Global Food Supply">Global Food Supply</option>
                    <option value="Angkor Rice Mills">Angkor Rice Mills</option>
                    <option value="Farm Pure Dairy">Farm Pure Dairy</option>
                    <option value="Ocean Blue Seafoods">Ocean Blue Seafoods</option>
                  </>
                )}
              </select>
            </div>

            {/* Purchase Order Date */}
            <div>
              <label className="block text-slate-300 font-semibold mb-1.5">
                {lang === 'en' ? 'Purchase Order Date' : 'កាលបរិច្ឆេទបញ្ជាទិញ'}
              </label>
              <input
                type="text"
                value={poDate}
                onChange={(e) => setPoDate(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-200 font-mono focus:outline-none focus:border-cyan-500"
                placeholder="MM/DD/YYYY hh:mm AM"
              />
            </div>

            {/* Required Date */}
            <div>
              <label className="block text-slate-300 font-semibold mb-1.5">
                {lang === 'en' ? 'Required Date' : 'កាលបរិច្ឆេទត្រូវការ'}
              </label>
              <input
                type="text"
                value={poRequiredDate}
                onChange={(e) => setPoRequiredDate(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-200 font-mono focus:outline-none focus:border-cyan-500"
                placeholder="MM/DD/YYYY hh:mm AM"
              />
            </div>

            {/* Code */}
            <div>
              <label className="block text-slate-300 font-semibold mb-1.5">
                {lang === 'en' ? 'Code' : 'លេខកូដ PO'}
              </label>
              <input
                type="text"
                value={poCode}
                onChange={(e) => setPoCode(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-cyan-300 font-mono font-bold focus:outline-none focus:border-cyan-500"
                placeholder="Auto Generate Code"
              />
            </div>

            {/* Payment Term * */}
            <div>
              <label className="block text-slate-300 font-semibold mb-1.5">
                {lang === 'en' ? 'Payment Term' : 'លក្ខខណ្ឌទូទាត់'} <span className="text-red-400">*</span>
              </label>
              <select
                value={poPaymentTerm}
                onChange={(e) => setPoPaymentTerm(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-cyan-500"
              >
                {paymentTerms.length > 0 ? (
                  paymentTerms.map((t) => (
                    <option key={t.id || t.code} value={t.description || t.code}>
                      {t.description || t.code} {t.days ? `(${t.days} Days)` : ''}
                    </option>
                  ))
                ) : (
                  <>
                    <option value="Net 30 Days">Net 30 Days</option>
                    <option value="Cash on Delivery (COD)">Cash on Delivery (COD)</option>
                    <option value="Net 15 Days">Net 15 Days</option>
                    <option value="Net 60 Days">Net 60 Days</option>
                    <option value="Immediate 100%">Immediate 100%</option>
                  </>
                )}
              </select>
            </div>

            {/* Purchase Person */}
            <div>
              <label className="block text-slate-300 font-semibold mb-1.5">
                {lang === 'en' ? 'Purchase Person' : 'អ្នកទទួលបន្ទុកបញ្ជាទិញ'}
              </label>
              <input
                type="text"
                value={poPurchasePerson}
                onChange={(e) => setPoPurchasePerson(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-cyan-500"
                placeholder="Purchase Person"
              />
            </div>

            {/* Shipment Method */}
            <div>
              <label className="block text-slate-300 font-semibold mb-1.5">
                {lang === 'en' ? 'Shipment Method' : 'មធ្យោបាយដឹកជញ្ជូន'}
              </label>
              <select
                value={poShipmentMethod}
                onChange={(e) => setPoShipmentMethod(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-cyan-500"
              >
                <option value="Supplier Delivery">Supplier Delivery</option>
                <option value="Standard Freight">Standard Freight</option>
                <option value="Express Cargo">Express Cargo</option>
                <option value="Air Freight">Air Freight</option>
                <option value="Store Pickup">Store Pickup</option>
              </select>
            </div>

            {/* Barcode or SKU Scanner hint */}
            <div>
              <label className="block text-cyan-400 font-semibold mb-1.5 flex items-center justify-between">
                <span>{lang === 'en' ? 'Quick Scan / Add' : 'ស្កេនបាកូដរហ័ស'}</span>
                <span className="text-[10px] text-slate-400 font-normal">Press Enter</span>
              </label>
              <input
                type="text"
                value={poBarcodeHint}
                onChange={(e) => setPoBarcodeHint(e.target.value)}
                onKeyDown={handleBarcodeScan}
                className="w-full bg-slate-950 border border-cyan-500/40 rounded-xl px-3 py-2 text-white font-mono placeholder:text-slate-500 focus:outline-none focus:border-cyan-400 shadow-inner"
                placeholder="Hint: Barcode or Sku here"
              />
            </div>
          </div>
        </div>

        {/* TAB NAVIGATION */}
        <div className="flex items-center gap-2 border-b border-slate-800 mb-6 overflow-x-auto scrollbar-none">
          {[
            { key: 'po_list', label: 'Purchase Order List' },
            { key: 'bill_info', label: 'Bill Information' },
            { key: 'shipping_info', label: 'Shipping Information' },
            { key: 'freight_info', label: 'Freight Information' },
            { key: 'supplier_history', label: 'Supplier History' },
            { key: 'others', label: 'Others' },
          ].map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveTab(tab.key)}
              className={`px-4 py-2.5 text-xs font-bold rounded-t-xl transition-all whitespace-nowrap ${
                activeTab === tab.key
                  ? 'bg-slate-900 text-cyan-400 border-t-2 border-cyan-400 border-x border-slate-800'
                  : 'text-slate-400 hover:text-white hover:bg-slate-900/40'
              }`}
            >
              {tab.label}
              {tab.key === 'po_list' && (
                <span className="ml-2 px-1.5 py-0.5 rounded-full text-[10px] bg-cyan-500/20 text-cyan-300">
                  {poLines.length}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* MAIN BODY: Grid with Tabs on Left (8 cols) and Summary on Right (4 cols) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* LEFT 8/12: TAB CONTENT */}
          <div className="lg:col-span-8 space-y-6">
            {/* TAB 1: PURCHASE ORDER LIST */}
            {activeTab === 'po_list' && (
              <div className="bg-slate-900/90 rounded-2xl border border-slate-800 shadow-xl p-5 backdrop-blur-sm">
                {/* Search & Filter Bar */}
                <div className="flex flex-col sm:flex-row items-center justify-between gap-3 mb-4 pb-4 border-b border-slate-800/80">
                  <div className="flex items-center gap-2 w-full sm:w-auto flex-1">
                    <div className="relative flex-1 max-w-sm">
                      <input
                        type="text"
                        value={poItemSearch}
                        onChange={(e) => setPoItemSearch(e.target.value)}
                        placeholder="Item Code Description Description2 Barcode"
                        className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-9 pr-3 py-1.5 text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-cyan-500"
                      />
                      <SearchIcon className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                    </div>

                    {/* Product Group Dropdown */}
                    <select
                      value={poItemGroupFilter}
                      onChange={(e) => setPoItemGroupFilter(e.target.value)}
                      className="bg-slate-950 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-cyan-500"
                    >
                      <option value="all">All Product Groups</option>
                      {distinctGroups.map((g) => (
                        <option key={g} value={g}>
                          {g}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Add Product Button */}
                  <button
                    type="button"
                    onClick={() => setAddItemModalOpen(true)}
                    className="px-3.5 py-1.5 rounded-xl text-xs font-bold text-white bg-cyan-600 hover:bg-cyan-500 flex items-center gap-1.5 shadow-md shadow-cyan-900/30 transition-all hover:scale-105 active:scale-95"
                  >
                    <PlusIcon className="w-3.5 h-3.5" />
                    <span>{lang === 'en' ? 'Add Item' : 'បន្ថែមមុខទំនិញ'}</span>
                  </button>
                </div>

                {/* Items Table with Picture Thumbnail */}
                <div className="overflow-x-auto rounded-xl border border-slate-800 scrollbar-thin scrollbar-thumb-slate-700">
                  <table className="w-full text-xs text-left text-slate-300 border-collapse">
                    <thead className="bg-slate-950/80 text-slate-400 uppercase tracking-wider font-semibold border-b border-slate-800">
                      <tr>
                        <th className="py-3 px-3 w-10 text-center">№</th>
                        <th className="py-3 px-4 min-w-[220px]">Description</th>
                        <th className="py-3 px-3 text-right">Onhand</th>
                        <th className="py-3 px-3 text-right">Suggest QTY</th>
                        <th className="py-3 px-3 text-right w-24">QTY</th>
                        <th className="py-3 px-3 text-right w-24">Cost</th>
                        <th className="py-3 px-3 text-right w-20">Discount</th>
                        <th className="py-3 px-3 text-center">UOM</th>
                        <th className="py-3 px-4 text-right">Total</th>
                        <th className="py-3 px-2 w-10 text-center" />
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60">
                      {filteredPoLines.length > 0 ? (
                        filteredPoLines.map((line, idx) => (
                          <tr key={line.id} className="hover:bg-slate-800/40 transition-colors">
                            <td className="py-2.5 px-3 text-center text-slate-500 font-mono">{idx + 1}</td>
                            <td className="py-2.5 px-4">
                              <div className="flex items-center gap-3">
                                <div className="w-9 h-9 min-w-[36px] rounded-lg overflow-hidden bg-slate-950 border border-slate-700/80 flex items-center justify-center shrink-0">
                                  <img
                                    src={line.imageUrl || 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=120&h=120&fit=crop'}
                                    alt=""
                                    className="w-full h-full object-cover rounded"
                                    onError={(e) => {
                                      e.currentTarget.onerror = null
                                      e.currentTarget.src = 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=120&h=120&fit=crop'
                                    }}
                                  />
                                </div>
                                <div>
                                  <div className="font-semibold text-white">{line.description}</div>
                                  <div className="text-[11px] text-slate-400 flex items-center gap-2 font-mono">
                                    <span>{line.code}</span>
                                    {line.barcode && line.barcode !== '—' && (
                                      <>
                                        <span>•</span>
                                        <span>{line.barcode}</span>
                                      </>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </td>
                            <td className="py-2.5 px-3 text-right font-mono text-slate-300">
                              <span
                                className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                                  line.onhand <= 0
                                    ? 'bg-rose-500/10 text-rose-400'
                                    : line.onhand <= 10
                                    ? 'bg-amber-500/10 text-amber-400'
                                    : 'bg-emerald-500/10 text-emerald-400'
                                }`}
                              >
                                {line.onhand}
                              </span>
                            </td>
                            <td className="py-2.5 px-3 text-right font-mono text-slate-400">{line.suggestQty}</td>
                            <td className="py-2.5 px-3 text-right">
                              <input
                                type="number"
                                min="1"
                                value={line.qty}
                                onChange={(e) => updateLine(line.id, 'qty', e.target.value)}
                                className="w-20 bg-slate-950 border border-slate-700 rounded-lg px-2 py-1 text-right text-cyan-300 font-mono font-bold focus:outline-none focus:border-cyan-400"
                              />
                            </td>
                            <td className="py-2.5 px-3 text-right">
                              <input
                                type="number"
                                step="0.01"
                                min="0"
                                value={line.cost}
                                onChange={(e) => updateLine(line.id, 'cost', e.target.value)}
                                className="w-20 bg-slate-950 border border-slate-700 rounded-lg px-2 py-1 text-right text-slate-200 font-mono focus:outline-none focus:border-cyan-400"
                              />
                            </td>
                            <td className="py-2.5 px-3 text-right">
                              <input
                                type="number"
                                step="0.01"
                                min="0"
                                value={line.discount}
                                onChange={(e) => updateLine(line.id, 'discount', e.target.value)}
                                className="w-16 bg-slate-950 border border-slate-700 rounded-lg px-2 py-1 text-right text-slate-400 font-mono focus:outline-none focus:border-cyan-400"
                              />
                            </td>
                            <td className="py-2.5 px-3 text-center">
                              <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 text-[10px] font-mono">
                                {line.uom}
                              </span>
                            </td>
                            <td className="py-2.5 px-4 text-right font-mono font-bold text-emerald-400">
                              ${Number(line.total || 0).toFixed(2)}
                            </td>
                            <td className="py-2.5 px-2 text-center">
                              <button
                                type="button"
                                onClick={() => removeLine(line.id)}
                                className="text-slate-500 hover:text-rose-400 transition-colors p-1"
                                title="Remove line"
                              >
                                <TrashIcon className="w-3.5 h-3.5" />
                              </button>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan="10" className="py-8 text-center text-slate-500">
                            No matching items in this purchase order.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Table Summary Bar */}
                <div className="mt-4 p-3 rounded-xl bg-slate-950 border border-slate-800/80 flex flex-wrap items-center justify-between gap-4 text-xs font-mono">
                  <div className="text-slate-400 font-sans">
                    <span className="font-bold text-white">Total : </span>
                    <span className="text-cyan-400">{poTotals.itemsCount}</span> items
                  </div>
                  <div className="flex items-center gap-6">
                    <div>
                      <span className="text-slate-500 font-sans mr-1.5">Total QTY:</span>
                      <span className="font-bold text-white">{poTotals.totalQty.toFixed(2)}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 font-sans mr-1.5">Discount:</span>
                      <span className="font-bold text-amber-400">{poTotals.totalDiscount.toFixed(2)}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 font-sans mr-1.5">Subtotal:</span>
                      <span className="font-bold text-emerald-400">${poTotals.subAmount.toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 2: BILL INFORMATION */}
            {activeTab === 'bill_info' && (
              <div className="bg-slate-900/90 rounded-2xl border border-slate-800 shadow-xl p-5 backdrop-blur-sm space-y-4 text-xs">
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">Bill Information</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-slate-400 mb-1">Bill To Company</label>
                    <input
                      type="text"
                      defaultValue="FreshMart Retail Group Co., Ltd."
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-200"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 mb-1">VAT / Tax ID Number</label>
                    <input
                      type="text"
                      defaultValue="K001-902348123"
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-200 font-mono"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-slate-400 mb-1">Billing Address</label>
                    <textarea
                      rows="2"
                      defaultValue="#128 Preah Monivong Blvd, Sangkat Phsar Thmei 2, Khan Daun Penh, Phnom Penh, Cambodia"
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-200"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 mb-1">Contact Person</label>
                    <input
                      type="text"
                      defaultValue="Accounting Dept / Mr. Sophea"
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-200"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 mb-1">Billing Email</label>
                    <input
                      type="email"
                      defaultValue="ap@freshmart.com"
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-200"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* TAB 3: SHIPPING INFORMATION */}
            {activeTab === 'shipping_info' && (
              <div className="bg-slate-900/90 rounded-2xl border border-slate-800 shadow-xl p-5 backdrop-blur-sm space-y-4 text-xs">
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">Shipping Information</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-slate-400 mb-1">Delivery Destination Outlet</label>
                    <input
                      type="text"
                      value={poOutlet}
                      onChange={(e) => setPoOutlet(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-200"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 mb-1">Receiving Contact & Phone</label>
                    <input
                      type="text"
                      defaultValue="Warehouse Manager (012 345 678)"
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-200"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-slate-400 mb-1">Delivery Address</label>
                    <textarea
                      rows="2"
                      defaultValue="#45 Street 289, Sangkat Boeung Kak 1, Khan Toul Kork, Phnom Penh"
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-200"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-slate-400 mb-1">Special Delivery Gate Instructions</label>
                    <input
                      type="text"
                      defaultValue="Unload at Loading Bay 2. Check temperature calibration upon arrival."
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-200"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* TAB 4: FREIGHT INFORMATION */}
            {activeTab === 'freight_info' && (
              <div className="bg-slate-900/90 rounded-2xl border border-slate-800 shadow-xl p-5 backdrop-blur-sm space-y-4 text-xs">
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">Freight Information</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-slate-400 mb-1">Freight Carrier</label>
                    <select className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-200">
                      <option>Supplier Dedicated Fleet</option>
                      <option>Kerry Worldbridge Logistics</option>
                      <option>J&T Cargo Express</option>
                      <option>Internal Transport Team</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-slate-400 mb-1">Incoterms</label>
                    <select className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-200">
                      <option>DDP (Delivered Duty Paid)</option>
                      <option>FOB (Free on Board)</option>
                      <option>CIF (Cost, Insurance & Freight)</option>
                      <option>EXW (Ex Works)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-slate-400 mb-1">Estimated Freight Cost ($)</label>
                    <input
                      type="number"
                      defaultValue="0.00"
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-200 font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 mb-1">Waybill / Tracking No.</label>
                    <input
                      type="text"
                      placeholder="e.g. WB-2026-9901"
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-200 font-mono"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* TAB 5: SUPPLIER HISTORY */}
            {activeTab === 'supplier_history' && (
              <div className="bg-slate-900/90 rounded-2xl border border-slate-800 shadow-xl p-5 backdrop-blur-sm space-y-4 text-xs">
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                  Supplier Performance History: {poSupplier || 'Vendor'}
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-center">
                    <div className="text-[10px] text-slate-400 uppercase">On-Time Delivery</div>
                    <div className="text-base font-bold text-emerald-400 mt-1 font-mono">98.5%</div>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-center">
                    <div className="text-[10px] text-slate-400 uppercase">Fulfillment Rate</div>
                    <div className="text-base font-bold text-cyan-400 mt-1 font-mono">99.1%</div>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-center">
                    <div className="text-[10px] text-slate-400 uppercase">Past Orders</div>
                    <div className="text-base font-bold text-amber-400 mt-1 font-mono">28 Orders</div>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-center">
                    <div className="text-[10px] text-slate-400 uppercase">Credit Rating</div>
                    <div className="text-base font-bold text-purple-400 mt-1">Tier A</div>
                  </div>
                </div>
                <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 text-slate-400 leading-relaxed">
                  Supplier has maintained an exceptional on-time fulfillment track record with no registered critical
                  quality discrepancies over the last 180 days.
                </div>
              </div>
            )}

            {/* TAB 6: OTHERS */}
            {activeTab === 'others' && (
              <div className="bg-slate-900/90 rounded-2xl border border-slate-800 shadow-xl p-5 backdrop-blur-sm space-y-4 text-xs">
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">Other Preferences & Tags</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-slate-400 mb-1">Priority Level</label>
                    <select className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-200">
                      <option>Normal Stock replenishment</option>
                      <option>Urgent - Low inventory critical</option>
                      <option>High - Promotional demand</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-slate-400 mb-1">Internal Reference / Project Code</label>
                    <input
                      type="text"
                      placeholder="e.g. PRJ-Q3-RESTOCK"
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-200 font-mono"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-slate-400 mb-1">Procurement Department Notes</label>
                    <textarea
                      rows="3"
                      placeholder="Add any internal procurement comments..."
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-200"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* RIGHT 4/12: PURCHASE ORDER SUMMARY */}
          <div className="lg:col-span-4">
            <div className="bg-slate-900/90 rounded-2xl border border-slate-800 shadow-xl p-5 backdrop-blur-sm sticky top-6 space-y-4">
              <div className="border-b border-slate-800 pb-3">
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">Purchase Order Summary</h3>
                <p className="text-xs text-slate-400 mt-0.5">Add primary information</p>
              </div>

              {/* Outlet */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Outlet</label>
                <select
                  value={poOutlet}
                  onChange={(e) => setPoOutlet(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
                >
                  <option value="Main Store Warehouse - Toul Kork">Main Store Warehouse - Toul Kork</option>
                  <option value="Branch 01 - BKK1 Supermarket">Branch 01 - BKK1 Supermarket</option>
                  <option value="Branch 02 - Sen Sok Mega Hub">Branch 02 - Sen Sok Mega Hub</option>
                  <option value="Central Cold Storage Facility">Central Cold Storage Facility</option>
                </select>
              </div>

              {/* Template Name */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Template Name</label>
                <input
                  type="text"
                  value={poTemplateName}
                  onChange={(e) => setPoTemplateName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
                  placeholder="Template Name"
                />
              </div>

              {/* Note */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Note</label>
                <textarea
                  rows="2"
                  value={poNote}
                  onChange={(e) => setPoNote(e.target.value)}
                  placeholder="Procurement notes, delivery instructions..."
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-cyan-500 resize-none"
                />
              </div>

              {/* Pricing breakdown */}
              <div className="space-y-3 pt-3 border-t border-slate-800 text-xs">
                {/* Sub Amount */}
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Sub Amount</span>
                  <span className="font-mono font-bold text-slate-200">${poTotals.subAmount.toFixed(2)}</span>
                </div>

                {/* Discount */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-slate-400">Discount</span>
                    <span className="font-mono text-amber-400">-${poTotals.totalHeaderDiscount.toFixed(2)}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="relative">
                      <input
                        type="number"
                        min="0"
                        max="100"
                        step="0.1"
                        value={poDiscountPercent}
                        onChange={(e) => setPoDiscountPercent(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2 py-1 pr-6 text-xs text-right font-mono text-slate-200 focus:outline-none focus:border-cyan-500"
                        placeholder="0.00"
                      />
                      <span className="absolute right-2 top-1 text-slate-500 text-[10px] font-bold">%</span>
                    </div>
                    <div className="relative">
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={poDiscountAmount}
                        onChange={(e) => setPoDiscountAmount(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2 py-1 pr-6 text-xs text-right font-mono text-slate-200 focus:outline-none focus:border-cyan-500"
                        placeholder="0.00"
                      />
                      <span className="absolute right-2 top-1 text-slate-500 text-[10px] font-bold">$</span>
                    </div>
                  </div>
                </div>

                {/* Tax Amount */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-slate-400">Tax Amount</span>
                    <select
                      value={poTaxPercent}
                      onChange={(e) => setPoTaxPercent(Number(e.target.value))}
                      className="bg-slate-950 border border-slate-800 rounded px-1.5 py-0.5 text-[10px] text-slate-400"
                    >
                      <option value={0}>0%</option>
                      <option value={10}>10% VAT</option>
                    </select>
                  </div>
                  <span className="font-mono text-slate-300">${poTotals.taxAmount.toFixed(2)}</span>
                </div>

                {/* Grand Total */}
                <div className="pt-3 border-t border-slate-800 flex items-center justify-between">
                  <span className="text-sm font-extrabold text-white uppercase tracking-wider">Grand Total</span>
                  <span className="text-xl font-black font-mono text-emerald-400 tracking-tight">
                    ${poTotals.grandTotal.toFixed(2)}
                  </span>
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="pt-3 space-y-2">
                <button
                  type="button"
                  onClick={handleSavePO}
                  disabled={poSubmitting}
                  className="w-full py-2.5 rounded-xl font-bold text-xs text-white bg-gradient-to-r from-cyan-500 to-emerald-600 hover:from-cyan-400 hover:to-emerald-500 shadow-lg shadow-cyan-900/40 transition-all hover:scale-[1.02] active:scale-95 flex items-center justify-center gap-2"
                >
                  <CheckIcon className="w-4 h-4" />
                  <span>{poSubmitting ? 'Saving...' : 'Save Purchase Order'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode('list')}
                  className="w-full py-2 rounded-xl font-semibold text-xs text-slate-400 hover:text-white bg-slate-950 hover:bg-slate-800 border border-slate-800 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* MODAL: ADD PRODUCT ITEM FROM CATALOG */}
        {addItemModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-150">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl">
              <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-white">Select Product to Add</h3>
                  <p className="text-xs text-slate-400">Search from active product catalog</p>
                </div>
                <button
                  type="button"
                  onClick={() => setAddItemModalOpen(false)}
                  className="text-slate-400 hover:text-white text-lg font-bold"
                >
                  ✕
                </button>
              </div>

              <div className="p-4 border-b border-slate-800">
                <div className="relative">
                  <input
                    type="text"
                    value={itemPickerSearch}
                    onChange={(e) => setItemPickerSearch(e.target.value)}
                    placeholder="Search by Code, Name, Barcode, or Category..."
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-cyan-500"
                    autoFocus
                  />
                  <SearchIcon className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                </div>
              </div>

              <div className="max-h-80 overflow-y-auto p-2 divide-y divide-slate-800/60 text-xs">
                {processedItems
                  .filter((p) => {
                    if (!itemPickerSearch.trim()) return true
                    const q = itemPickerSearch.trim().toLowerCase()
                    return (
                      p.code.toLowerCase().includes(q) ||
                      p.barcode.toLowerCase().includes(q) ||
                      p.description.toLowerCase().includes(q) ||
                      p.category.toLowerCase().includes(q)
                    )
                  })
                  .slice(0, 20)
                  .map((item) => (
                    <div
                      key={item.id}
                      className="p-2.5 hover:bg-slate-800/60 rounded-xl transition-colors flex items-center justify-between gap-3"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-11 h-11 min-w-[44px] rounded-xl overflow-hidden bg-slate-950 border border-slate-700/80 flex items-center justify-center shrink-0">
                          <img
                            src={item.imageUrl}
                            alt=""
                            className="w-full h-full object-cover rounded-lg"
                            onError={(e) => {
                              e.currentTarget.onerror = null
                              e.currentTarget.src = 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=120&h=120&fit=crop'
                            }}
                          />
                        </div>
                        <div>
                          <div className="font-semibold text-white">{item.description}</div>
                          <div className="text-[11px] text-slate-400 flex items-center gap-2 font-mono">
                            <span>{item.code}</span>
                            <span>•</span>
                            <span>{item.barcode}</span>
                            <span>•</span>
                            <span className="text-cyan-400">{item.category}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <div className="text-slate-400 font-mono text-[11px]">Onhand: {item.onhand}</div>
                          <div className="font-bold text-emerald-400 font-mono">${item.cost.toFixed(2)}</div>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleAddItemFromPicker(item)}
                          className="px-3 py-1.5 rounded-lg text-xs font-bold text-white bg-cyan-600 hover:bg-cyan-500 transition-all active:scale-95"
                        >
                          + Add
                        </button>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        )}
      </div>
    )
  }

  // ==========================================
  // VIEW: MAIN INVENTORY TO ORDER LIST
  // ==========================================
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-slate-100 p-4 sm:p-6 lg:p-8 font-sans">
      {/* Top Header & Breadcrumbs */}
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-400 mb-1">
            <Link to="/admin/purchase-management" className="hover:text-amber-400 transition-colors">
              {lang === 'en' ? 'Purchase Management' : 'ការគ្រប់គ្រងការទិញ'}
            </Link>
            <span>/</span>
            <span className="text-amber-400 font-medium">
              {lang === 'en' ? 'Inventory to Order' : 'ស្តុកដែលត្រូវបញ្ជាទិញ'}
            </span>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500/20 to-orange-600/30 border border-amber-500/30 flex items-center justify-center shadow-lg shadow-amber-900/20">
              <img src={chartIcon} alt="" className="w-6 h-6 object-contain" />
            </div>
            <div>
              <h1 className="text-2xl font-black tracking-tight text-white flex items-center gap-2">
                <span>{lang === 'en' ? 'Inventory to Order' : 'ស្តុកដែលត្រូវបញ្ជាទិញ'}</span>
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20">
                  {filteredProducts.length} items
                </span>
              </h1>
              <p className="text-xs text-slate-400 mt-0.5">
                {lang === 'en'
                  ? 'Show information of inventory to order. Ex(Code, Description, Barcode...)'
                  : 'បង្ហាញព័ត៌មានស្តុកដែលត្រូវបញ្ជាទិញ ដូចជាលេខកូដ ការពិពណ៌នា បាកូដ'}
              </p>
            </div>
          </div>
        </div>

        {/* Global actions */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={fetchLiveData}
            className="p-2.5 rounded-xl bg-slate-900 border border-slate-700/80 text-slate-300 hover:text-white hover:bg-slate-800 transition-all"
            title="Refresh Live Data"
          >
            <RefreshIcon className={`w-4 h-4 ${loading ? 'animate-spin text-amber-400' : ''}`} />
          </button>
          <button
            type="button"
            onClick={() => setChooseColumnOpen(true)}
            className="px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-300 bg-slate-900/90 hover:bg-slate-800 border border-slate-700/80 transition-all"
          >
            {lang === 'en' ? 'Choose Column' : 'ជ្រើសរើសជួរឈរ'}
          </button>
          <button
            type="button"
            onClick={handleExportExcel}
            className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-500 hover:to-green-500 shadow-lg shadow-emerald-900/20 transition-all hover:scale-105 active:scale-95 flex items-center gap-2"
          >
            <span>{lang === 'en' ? 'Export Excel' : 'ទាញយក Excel'}</span>
          </button>
        </div>
      </div>

      {/* SEARCH SECTION: Search Inventory to Order */}
      <div className="bg-slate-900/90 rounded-2xl border border-slate-800 shadow-xl p-5 mb-6 backdrop-blur-sm">
        <div className="mb-4">
          <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
            <SearchIcon className="w-4 h-4 text-amber-400" />
            <span>Search Inventory to Order</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">Search products by any condition. Ex(Any, Code, Description...)</p>
        </div>

        {/* First Row: Search Textbox + Search By Dropdown + Search Button + Advance Filter Toggle */}
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center">
          {/* Search - textbox */}
          <div className="sm:col-span-6 relative">
            <input
              type="text"
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearchClick()}
              placeholder="Search products by any condition..."
              className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-amber-500 transition-colors shadow-inner"
            />
            <SearchIcon className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          </div>

          {/* Search By - DropDown - Any - Code - Description - Barcode */}
          <div className="sm:col-span-3">
            <select
              value={searchBy}
              onChange={(e) => setSearchBy(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-amber-500 transition-colors"
            >
              <option value="Any">Search By: Any</option>
              <option value="Code">Search By: Code</option>
              <option value="Description">Search By: Description</option>
              <option value="Barcode">Search By: Barcode</option>
            </select>
          </div>

          {/* Search - Button */}
          <div className="sm:col-span-3 flex items-center gap-2">
            <button
              type="button"
              onClick={handleSearchClick}
              className="flex-1 py-2 px-4 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 shadow-md shadow-amber-900/30 transition-all hover:scale-[1.02] active:scale-95 flex items-center justify-center gap-1.5"
            >
              <SearchIcon className="w-3.5 h-3.5" />
              <span>Search</span>
            </button>

            {/* Advance Filter Toggle Button */}
            <button
              type="button"
              onClick={() => setAdvanceFilterOpen((prev) => !prev)}
              className={`px-3 py-2 rounded-xl text-xs font-semibold border transition-all flex items-center gap-1.5 ${
                advanceFilterOpen || filterProduct || filterGroup !== 'all' || filterBrand !== 'all' || filterCategory !== 'all'
                  ? 'bg-amber-500/10 border-amber-500/40 text-amber-300'
                  : 'bg-slate-950 border-slate-700 text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
              title="Toggle Advance Filter"
            >
              <FilterIcon className="w-3.5 h-3.5" />
              <span className="hidden md:inline">Advance</span>
              <ChevronDownIcon
                className={`w-3.5 h-3.5 transition-transform duration-200 ${advanceFilterOpen ? 'rotate-180' : ''}`}
              />
            </button>
          </div>
        </div>

        {/* Collapsible Advance Filter */}
        {advanceFilterOpen && (
          <div className="mt-4 pt-4 border-t border-slate-800/80 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs animate-in fade-in duration-200">
            {/* Product - textbox And Can Search in there */}
            <div>
              <label className="block text-slate-400 font-semibold mb-1">Product (Code or Name)</label>
              <input
                type="text"
                value={filterProduct}
                onChange={(e) => setFilterProduct(e.target.value)}
                placeholder="Type to filter product..."
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-1.5 text-slate-200 focus:outline-none focus:border-amber-500"
              />
            </div>

            {/* Product Group - Dropdown */}
            <div>
              <label className="block text-slate-400 font-semibold mb-1">Product Group</label>
              <select
                value={filterGroup}
                onChange={(e) => setFilterGroup(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-1.5 text-slate-200 focus:outline-none focus:border-amber-500"
              >
                <option value="all">All Groups</option>
                {distinctGroups.map((g) => (
                  <option key={g} value={g}>
                    {g}
                  </option>
                ))}
              </select>
            </div>

            {/* Brand - DropDown */}
            <div>
              <label className="block text-slate-400 font-semibold mb-1">Brand</label>
              <select
                value={filterBrand}
                onChange={(e) => setFilterBrand(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-1.5 text-slate-200 focus:outline-none focus:border-amber-500"
              >
                <option value="all">All Brands</option>
                {distinctBrands.map((b) => (
                  <option key={b} value={b}>
                    {b}
                  </option>
                ))}
              </select>
            </div>

            {/* Category - Dropdown */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-slate-400 font-semibold">Category</label>
                {(filterProduct || filterGroup !== 'all' || filterBrand !== 'all' || filterCategory !== 'all') && (
                  <button
                    type="button"
                    onClick={handleResetFilters}
                    className="text-[11px] text-amber-400 hover:underline"
                  >
                    Reset All
                  </button>
                )}
              </div>
              <select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-1.5 text-slate-200 focus:outline-none focus:border-amber-500"
              >
                <option value="all">All Categories</option>
                {distinctCategories.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}
      </div>

      {/* TABLE SECTION: Inventory to order List */}
      <div className="bg-slate-900/90 rounded-2xl border border-slate-800 shadow-xl overflow-hidden backdrop-blur-sm">
        {/* Table header */}
        <div className="p-4 sm:p-5 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div>
            <h2 className="text-base font-bold text-white tracking-tight">Inventory to order List</h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Show information of inventory to order. Ex(Code, Description, Barcode...)
            </p>
          </div>
          <div className="text-xs text-slate-400 font-mono">
            Showing <span className="text-amber-400 font-bold">{filteredProducts.length}</span> of{' '}
            <span>{processedItems.length}</span> items
          </div>
        </div>

        {/* Data Table */}
        <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-slate-700">
          <table className="w-full text-xs text-left text-slate-300 border-collapse">
            <thead className="bg-slate-950/80 text-slate-400 uppercase tracking-wider font-semibold border-b border-slate-800">
              <tr>
                {visibleColumns.includes('picture') && <th className="py-3 px-4 w-16 text-center">Picture</th>}
                {visibleColumns.includes('code') && <th className="py-3 px-4">Code</th>}
                {visibleColumns.includes('barcode') && <th className="py-3 px-4">Barcode</th>}
                {visibleColumns.includes('description') && <th className="py-3 px-4">Description</th>}
                {visibleColumns.includes('uom') && <th className="py-3 px-3 text-center">UOM</th>}
                {visibleColumns.includes('onhand') && <th className="py-3 px-4 text-right">Onhand</th>}
                {visibleColumns.includes('orderPoint') && <th className="py-3 px-4 text-right">Order Point</th>}
                {visibleColumns.includes('orderQuantity') && <th className="py-3 px-4 text-right">Order Quantity</th>}
                {visibleColumns.includes('productGroup') && <th className="py-3 px-4">Product Group</th>}
                {visibleColumns.includes('brand') && <th className="py-3 px-4">Brand</th>}
                {visibleColumns.includes('category') && <th className="py-3 px-4">Category</th>}
                {visibleColumns.includes('actions') && (
                  <th className="py-3 px-4 text-center min-w-[120px]">
                    <span className="flex items-center justify-center gap-1">
                      <LocalShippingIcon className="w-3.5 h-3.5 text-cyan-400" />
                      <span>PO Action</span>
                    </span>
                  </th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredProducts.length > 0 ? (
                filteredProducts.map((p) => {
                  const isZero = p.onhand <= 0
                  const isLow = p.onhand <= p.orderPoint

                  return (
                    <tr
                      key={p.id}
                      className="hover:bg-slate-800/40 transition-colors group"
                    >
                      {/* Picture Column */}
                      {visibleColumns.includes('picture') && (
                        <td className="py-2.5 px-4 w-16">
                          <div className="w-12 h-12 min-w-[48px] rounded-xl overflow-hidden bg-slate-950 border border-slate-700/80 flex items-center justify-center p-0.5 shadow-md group-hover:border-amber-500/50 group-hover:shadow-amber-500/10 transition-all">
                            <img
                              src={p.imageUrl}
                              alt={p.description}
                              className="w-full h-full object-cover rounded-lg group-hover:scale-105 transition-transform duration-300"
                              onError={(e) => {
                                e.currentTarget.onerror = null
                                e.currentTarget.src = 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=120&h=120&fit=crop'
                              }}
                            />
                          </div>
                        </td>
                      )}

                      {/* Code */}
                      {visibleColumns.includes('code') && (
                        <td className="py-3 px-4 font-mono font-bold text-amber-400">
                          {p.code}
                        </td>
                      )}

                      {/* Barcode */}
                      {visibleColumns.includes('barcode') && (
                        <td className="py-3 px-4 font-mono text-slate-300">
                          {p.barcode}
                        </td>
                      )}

                      {/* Description */}
                      {visibleColumns.includes('description') && (
                        <td className="py-3 px-4">
                          <div className="font-semibold text-white group-hover:text-amber-300 transition-colors">
                            {p.description}
                          </div>
                          {p.nameKh && <div className="text-[11px] text-slate-500">{p.nameKh}</div>}
                        </td>
                      )}

                      {/* UOM */}
                      {visibleColumns.includes('uom') && (
                        <td className="py-3 px-3 text-center">
                          <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 text-[10px] font-mono">
                            {p.uom}
                          </span>
                        </td>
                      )}

                      {/* Onhand */}
                      {visibleColumns.includes('onhand') && (
                        <td className="py-3 px-4 text-right font-mono">
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-bold ${
                              isZero
                                ? 'bg-rose-500/10 text-rose-400 border border-rose-500/30'
                                : isLow
                                ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                                : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                            }`}
                          >
                            {p.onhand}
                          </span>
                        </td>
                      )}

                      {/* Order Point */}
                      {visibleColumns.includes('orderPoint') && (
                        <td className="py-3 px-4 text-right font-mono text-slate-400">
                          {p.orderPoint}
                        </td>
                      )}

                      {/* Order Quantity */}
                      {visibleColumns.includes('orderQuantity') && (
                        <td className="py-3 px-4 text-right font-mono">
                          <span className="px-2.5 py-1 rounded-lg bg-cyan-500/10 text-cyan-300 border border-cyan-500/30 font-bold">
                            {p.orderQuantity}
                          </span>
                        </td>
                      )}

                      {/* Optional Columns */}
                      {visibleColumns.includes('productGroup') && (
                        <td className="py-3 px-4 text-slate-400">{p.productGroup}</td>
                      )}
                      {visibleColumns.includes('brand') && (
                        <td className="py-3 px-4 text-slate-400">{p.brand}</td>
                      )}
                      {visibleColumns.includes('category') && (
                        <td className="py-3 px-4 text-slate-400">{p.category}</td>
                      )}

                      {/* Action: local_shipping Button */}
                      {visibleColumns.includes('actions') && (
                        <td className="py-3 px-4 text-center">
                          <button
                            type="button"
                            onClick={() => handleOpenPOForProduct(p)}
                            className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 shadow-md shadow-cyan-900/30 hover:shadow-cyan-500/20 transition-all hover:scale-105 active:scale-95"
                            title="local_shipping - Create Purchase Order"
                          >
                            <LocalShippingIcon className="w-4 h-4" />
                            <span>Order</span>
                          </button>
                        </td>
                      )}
                    </tr>
                  )
                })
              ) : (
                <tr>
                  <td colSpan="12" className="py-12 text-center text-slate-500">
                    {loading ? (
                      <div className="flex flex-col items-center justify-center gap-2">
                        <RefreshIcon className="w-5 h-5 animate-spin text-amber-400" />
                        <span>Loading live inventory to order items...</span>
                      </div>
                    ) : (
                      'No inventory to order matching your search and filter criteria.'
                    )}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* CHOOSE COLUMN MODAL */}
      {chooseColumnOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl">
            <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-white">{lang === 'en' ? 'Choose Column' : 'ជ្រើសរើសជួរឈរ'}</h3>
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
            <div className="p-5 space-y-2.5 max-h-96 overflow-y-auto">
              {ALL_COLUMNS.map((col) => {
                const checked = visibleColumns.includes(col.key)
                return (
                  <label
                    key={col.key}
                    className={`flex items-center justify-between p-2.5 rounded-xl border text-xs cursor-pointer transition-colors ${
                      checked
                        ? 'bg-amber-500/10 border-amber-500/30 text-white'
                        : 'bg-slate-950/40 border-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    <span className="font-semibold">{col.label[lang] || col.label.en}</span>
                    <input
                      type="checkbox"
                      disabled={col.always}
                      checked={checked}
                      onChange={() => toggleColumn(col.key)}
                      className="rounded border-slate-700 bg-slate-900 text-amber-500 focus:ring-amber-500"
                    />
                  </label>
                )
              })}
            </div>
            <div className="p-4 border-t border-slate-800 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setVisibleColumns(DEFAULT_VISIBLE)}
                className="px-3 py-1.5 rounded-xl text-xs text-slate-400 hover:text-white bg-slate-800"
              >
                Reset Default
              </button>
              <button
                type="button"
                onClick={() => setChooseColumnOpen(false)}
                className="px-4 py-1.5 rounded-xl text-xs font-bold text-white bg-amber-500 hover:bg-amber-400"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
