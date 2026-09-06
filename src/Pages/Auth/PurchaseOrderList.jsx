import React, { useState, useEffect, useMemo, useRef } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import * as XLSX from 'xlsx'
import { useLanguage } from '../../context/LanguageContext'
import { useNotifications } from '../../context/NotificationContext'
import { adminProductAPI, adminSupplierAPI, adminPurchaseOrderAPI } from '../../api/api'
import { exportStyledExcel } from '../../utils/excelExport'
import bagIcon from '../../assets/icon/3dicons-bag-dynamic-color.png'
import './ProductsHub.css'

// SVGs
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

function UploadIcon({ className = 'w-4 h-4' }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
    </svg>
  )
}

function DownloadIcon({ className = 'w-4 h-4' }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
    </svg>
  )
}

// All available table columns for Choose Column
const ALL_COLUMNS = [
  { key: 'code', label: { en: 'Code', kh: 'លេខកូដ' }, always: true },
  { key: 'date', label: { en: 'Date', kh: 'កាលបរិច្ឆេទ' }, always: true },
  { key: 'requireDate', label: { en: 'Require Date', kh: 'កាលបរិច្ឆេទត្រូវការ' }, always: true },
  { key: 'purchasePerson', label: { en: 'Purchase Person', kh: 'អ្នកបញ្ជាទិញ' }, always: true },
  { key: 'supplier', label: { en: 'Supplier', kh: 'អ្នកផ្គត់ផ្គង់' }, always: true },
  { key: 'phone', label: { en: 'Phone', kh: 'លេខទូរស័ព្ទ' } },
  { key: 'grandTotal', label: { en: 'Grand Total ($)', kh: 'សរុប ($)' }, always: true },
  { key: 'balance', label: { en: 'Balance ($)', kh: 'សមតុល្យ ($)' }, always: true },
  { key: 'reference', label: { en: 'Reference', kh: 'យោង' } },
  { key: 'voidedDate', label: { en: 'Voided Date', kh: 'កាលបរិច្ឆេទបោះបង់' } },
  { key: 'soCode', label: { en: 'SO Code', kh: 'កូដ SO' } },
  { key: 'status', label: { en: 'Status', kh: 'ស្ថានភាព' }, always: true },
  { key: 'username', label: { en: 'Username', kh: 'គណនី' } },
  { key: 'outlet', label: { en: 'Outlet', kh: 'សាខា / ឃ្លាំង' } },
  { key: 'actions', label: { en: 'Actions', kh: 'សកម្មភាព' }, always: true },
]

const DEFAULT_VISIBLE = [
  'code',
  'date',
  'requireDate',
  'purchasePerson',
  'supplier',
  'phone',
  'grandTotal',
  'balance',
  'reference',
  'status',
  'outlet',
  'actions',
]

const UOM_OPTIONS = ['Can', 'Bottle', 'Pcs', 'Box', 'Bag', 'Kg', 'Pack', 'Carton', 'Case']

const OUTLET_OPTIONS = [
  'Main Supermarket',
  'Tuol Kork Branch',
  'BKK1 Outlet',
  'Central Warehouse',
  'Chbar Ampov Branch',
]

const PURCHASE_PERSON_OPTIONS = [
  'Badmin',
  'Vanna Touch',
  'Sokha Lim',
  'Rathana Chea',
  'Dara Keo',
]

const PAYMENT_TERM_OPTIONS = [
  'Net 30 Days',
  'Net 15 Days',
  'Cash on Delivery (COD)',
  'Immediate Payment',
  '50% Advance, 50% on Delivery',
]

const SHIPMENT_METHOD_OPTIONS = [
  'Standard Freight',
  'Express Truck Delivery',
  'Supplier Fleet Transport',
  'Cold Chain Logistics',
  'Air Cargo Express',
]

const TEMPLATE_OPTIONS = [
  'Standard PO Template',
  'Weekly Restock Template',
  'Urgent Emergency Replenishment',
  'Direct Vendor Purchase',
  'Bulk Seasonal Order',
]

const STATUS_OPTIONS = ['Any', 'open', 'Partial', 'Completed', 'closed', 'voided']

export default function PurchaseOrderList() {
  const { lang } = useLanguage()
  const { addNotification } = useNotifications()
  const location = useLocation()
  const navigate = useNavigate()
  const importFileInputRef = useRef(null)

  // PO Records State
  const [purchaseOrders, setPurchaseOrders] = useState([])
  const [loading, setLoading] = useState(true)

  // Live catalogs
  const [suppliers, setSuppliers] = useState([])
  const [catalogProducts, setCatalogProducts] = useState([])

  // Search state
  const [searchText, setSearchText] = useState('')
  const [searchBy, setSearchBy] = useState('Any') // Any, Code, Supplier, Part Number, Product Code, Reference
  const [appliedSearch, setAppliedSearch] = useState({ text: '', by: 'Any' })

  // Advance Filter state
  const [advanceFilterOpen, setAdvanceFilterOpen] = useState(false)
  const [fromDate, setFromDate] = useState('')
  const [toDate, setToDate] = useState('')
  const [outletFilter, setOutletFilter] = useState('all')
  const [purchasePersonFilter, setPurchasePersonFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('Any') // Any, open, Partial, Completed, closed, voided

  // Table Column Visibility
  const [chooseColumnOpen, setChooseColumnOpen] = useState(false)
  const [visibleColumns, setVisibleColumns] = useState(DEFAULT_VISIBLE)

  // Modals
  const [createModalOpen, setCreateModalOpen] = useState(false)
  const [detailModalOpen, setDetailModalOpen] = useState(false)
  const [selectedPO, setSelectedPO] = useState(null)
  const [submitting, setSubmitting] = useState(false)

  // Active Sub-Tab in Create PO Modal
  // Tabs: 'po_list', 'bill_info', 'shipping_info', 'freight_info', 'supplier_history', 'others'
  const [activeModalTab, setActiveModalTab] = useState('po_list')

  // Form State for Create PO
  const [formCode, setFormCode] = useState('')
  const [formSupplier, setFormSupplier] = useState('')
  const [formSupplierId, setFormSupplierId] = useState(null)
  const [formPhone, setFormPhone] = useState('')
  const [formDate, setFormDate] = useState('')
  const [formRequireDate, setFormRequireDate] = useState('')
  const [formPaymentTerm, setFormPaymentTerm] = useState('Net 30 Days')
  const [formPurchasePerson, setFormPurchasePerson] = useState('Badmin')
  const [formShipmentMethod, setFormShipmentMethod] = useState('Standard Freight')
  const [formOutlet, setFormOutlet] = useState('Main Supermarket')
  const [formTemplateName, setFormTemplateName] = useState('Standard PO Template')
  const [formReference, setFormReference] = useState('')
  const [formSoCode, setFormSoCode] = useState('')
  const [formNote, setFormNote] = useState('')

  // Billing / Shipping / Freight Extra Info
  const [formBillingAddress, setFormBillingAddress] = useState('B\'Groceries HQ, Phnom Penh')
  const [formShippingAddress, setFormShippingAddress] = useState('B\'Groceries Central Warehouse')
  const [formCarrier, setFormCarrier] = useState('J&T Express Cargo')
  const [formTrackingNumber, setFormTrackingNumber] = useState('')

  // Summary & Discount
  const [discountType, setDiscountType] = useState('percent') // 'percent' or 'amount'
  const [discountValue, setDiscountValue] = useState(0)
  const [taxPercent, setTaxPercent] = useState(0) // 0% or 10%

  // Line items inside Create Modal
  const [productSearchInput, setProductSearchInput] = useState('')
  const [selectedProductGroup, setSelectedProductGroup] = useState('all')
  const [lineItems, setLineItems] = useState([])

  // Load POs from Backend API
  const fetchPurchaseOrders = async () => {
    setLoading(true)
    try {
      const res = await adminPurchaseOrderAPI.getAll({
        search: appliedSearch.text || undefined,
        searchBy: appliedSearch.by !== 'Any' ? appliedSearch.by : undefined,
        fromDate: fromDate || undefined,
        toDate: toDate || undefined,
        outlet: outletFilter !== 'all' ? outletFilter : undefined,
        purchasePerson: purchasePersonFilter !== 'all' ? purchasePersonFilter : undefined,
        status: statusFilter !== 'Any' ? statusFilter : undefined,
      })
      if (res && res.data) {
        setPurchaseOrders(Array.isArray(res.data) ? res.data : [])
      }
    } catch {
      // Fallback
    } finally {
      setLoading(false)
    }
  }

  // Load suppliers and catalog products
  const fetchSuppliersAndProducts = async () => {
    try {
      const supRes = await adminSupplierAPI.getAll()
      const supList = supRes?.data || supRes || []
      if (Array.isArray(supList) && supList.length > 0) {
        setSuppliers(supList)
      } else {
        setSuppliers([
          { id: 1, supplierName: 'Cambodia Beverage Co.', contactPhone: '+855 12 889 900', paymentTerm: 'Net 30 Days' },
          { id: 2, supplierName: 'Global Food Supply Asia', contactPhone: '+855 11 223 344', paymentTerm: 'Cash on Delivery (COD)' },
          { id: 3, supplierName: 'Farm Pure Dairy Co.', contactPhone: '+855 77 445 566', paymentTerm: 'Net 15 Days' },
          { id: 4, supplierName: 'Angkor Organic Grains', contactPhone: '+855 92 112 233', paymentTerm: 'Net 30 Days' },
        ])
      }
    } catch {
      // Keep defaults
    }

    try {
      const prodRes = await adminProductAPI.getAll()
      const prodList = prodRes?.data || prodRes || []
      if (Array.isArray(prodList) && prodList.length > 0) {
        setCatalogProducts(prodList)
      } else {
        setCatalogProducts([
          { id: 101, code: 'BEV-CC-001', barCode: '8850123000124', name: 'Coca Cola 330ml Can', group: 'Beverages', uom: 'Can', averageCost: 0.45, onHand: 45, orderPoint: 100 },
          { id: 102, code: 'SNK-PO-002', barCode: '8850123000230', name: 'Lays Potato Chips Classic 50g', group: 'Snacks', uom: 'Pcs', averageCost: 1.10, onHand: 12, orderPoint: 50 },
          { id: 103, code: 'DRY-RC-003', barCode: '8850123000347', name: 'Jasmine Fragrant Rice 5kg', group: 'Grains', uom: 'Bag', averageCost: 4.50, onHand: 8, orderPoint: 20 },
          { id: 104, code: 'DAI-MK-004', barCode: '8850123000453', name: 'Fresh Whole Milk 1L', group: 'Dairy', uom: 'Bottle', averageCost: 1.80, onHand: 15, orderPoint: 40 },
          { id: 105, code: 'OIL-CK-005', barCode: '8850123000569', name: 'Pure Vegetable Cooking Oil 2L', group: 'Condiments', uom: 'Bottle', averageCost: 3.20, onHand: 5, orderPoint: 25 },
        ])
      }
    } catch {
      // Keep defaults
    }
  }

  useEffect(() => {
    fetchPurchaseOrders()
    fetchSuppliersAndProducts()
  }, [appliedSearch, fromDate, toDate, outletFilter, purchasePersonFilter, statusFilter])

  // Auto-open modal if navigated from Requisition or Inventory Order
  useEffect(() => {
    if (location.state?.fromRequisition || location.state?.fromInventoryOrder) {
      handleOpenCreateModal(location.state)
    }
  }, [location.state])

  // Open Create Modal & generate auto code
  const handleOpenCreateModal = async (initialState = null) => {
    try {
      const res = await adminPurchaseOrderAPI.getNextCode()
      if (res?.data?.code) {
        setFormCode(res.data.code)
      } else {
        const ymd = new Date().toISOString().slice(0, 10).replace(/-/g, '')
        setFormCode(`PO-${ymd}-${Math.floor(1000 + Math.random() * 9000)}`)
      }
    } catch {
      const ymd = new Date().toISOString().slice(0, 10).replace(/-/g, '')
      setFormCode(`PO-${ymd}-${Math.floor(1000 + Math.random() * 9000)}`)
    }

    const nowStr = new Date().toISOString().slice(0, 16)
    const nextWeekStr = new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 16)
    setFormDate(nowStr)
    setFormRequireDate(nextWeekStr)
    setFormSupplier('')
    setFormSupplierId(null)
    setFormPhone('')
    setFormPaymentTerm('Net 30 Days')
    setFormPurchasePerson('Badmin')
    setFormShipmentMethod('Standard Freight')
    setFormOutlet('Main Supermarket')
    setFormTemplateName('Standard PO Template')
    setFormReference('')
    setFormSoCode('')
    setFormNote('')
    setDiscountType('percent')
    setDiscountValue(0)
    setTaxPercent(0)
    setActiveModalTab('po_list')
    setProductSearchInput('')
    setSelectedProductGroup('all')

    // If pre-filled lines passed from Requisition or Inventory Order
    if (initialState?.items && Array.isArray(initialState.items)) {
      setLineItems(
        initialState.items.map((it, idx) => ({
          id: Date.now() + idx,
          productId: it.productId || null,
          itemCode: it.code || it.itemCode || `ITEM-${idx + 1}`,
          barcode: it.barcode || '—',
          description: it.description || it.productName || 'Product',
          description2: '',
          productGroup: it.group || 'General',
          onhand: it.onhand || 0,
          suggestQty: it.suggestQty || it.qty || 10,
          qty: it.qty || it.requisitionQty || 10,
          cost: it.cost || it.unitCost || 1.0,
          discount: 0,
          uom: it.uom || 'Pcs',
          total: (it.qty || it.requisitionQty || 10) * (it.cost || it.unitCost || 1.0),
        }))
      )
      if (initialState.requisitionCode) {
        setFormReference(`From Requisition: ${initialState.requisitionCode}`)
      }
    } else {
      setLineItems([])
    }

    setCreateModalOpen(true)
  }

  // Handle Supplier Selection in Create Modal
  const handleSupplierChange = (supName) => {
    setFormSupplier(supName)
    const found = suppliers.find((s) => (s.supplierName || s.name) === supName)
    if (found) {
      setFormSupplierId(found.id || null)
      setFormPhone(found.contactPhone || found.phone || '')
      if (found.paymentTerm) setFormPaymentTerm(found.paymentTerm)
    }
  }

  // Handle Search click
  const handleSearchClick = () => {
    setAppliedSearch({
      text: searchText.trim(),
      by: searchBy,
    })
  }

  // Handle Reset Filter button
  const handleResetFilters = () => {
    setSearchText('')
    setSearchBy('Any')
    setAppliedSearch({ text: '', by: 'Any' })
    setFromDate('')
    setToDate('')
    setOutletFilter('all')
    setPurchasePersonFilter('all')
    setStatusFilter('Any')
    addNotification?.('Filters reset to default', 'info')
  }

  // Toggle visible columns
  const toggleColumn = (key) => {
    if (visibleColumns.includes(key)) {
      setVisibleColumns(visibleColumns.filter((k) => k !== key))
    } else {
      setVisibleColumns([...visibleColumns, key])
    }
  }

  // Autocomplete products for unified line search
  const matchedCatalogProducts = useMemo(() => {
    const q = productSearchInput.trim().toLowerCase()
    if (!q) return []
    return catalogProducts
      .filter((p) => {
        const code = (p.code || p.productCode || '').toLowerCase()
        const barcode = (p.barCode || p.barcode || '').toLowerCase()
        const desc = (p.description || p.name || p.productName || '').toLowerCase()
        const grp = (p.group || p.productGroup || '').toLowerCase()

        if (selectedProductGroup !== 'all' && grp !== selectedProductGroup.toLowerCase()) {
          return false
        }
        return code.includes(q) || barcode.includes(q) || desc.includes(q)
      })
      .slice(0, 8)
  }, [productSearchInput, catalogProducts, selectedProductGroup])

  // Add Product to line items
  const handleAddProductToLines = (product) => {
    const existing = lineItems.find((l) => l.productId === product.id || l.itemCode === product.code)
    if (existing) {
      updateLine(existing.id, 'qty', Number(existing.qty) + 1)
      addNotification?.(`Increased quantity for ${existing.description}`, 'info')
    } else {
      const unitCost = Number(product.averageCost || product.basePrice || 1.0)
      const qty = 1
      const onhand = Number(product.onHand || product.onhand || 0)
      const suggest = Math.max(0, (Number(product.orderPoint) || 10) - onhand) || 10
      const newLine = {
        id: Date.now(),
        productId: product.id || null,
        itemCode: product.code || product.productCode || `PRD-${Date.now()}`,
        barcode: product.barCode || product.barcode || '—',
        description: product.description || product.name || product.productName || 'Product',
        description2: '',
        productGroup: product.group || 'General',
        onhand,
        suggestQty: suggest,
        qty,
        cost: unitCost,
        discount: 0,
        uom: product.uom || 'Pcs',
        total: qty * unitCost,
      }
      setLineItems((prev) => [...prev, newLine])
      addNotification?.(`Added ${newLine.description} to lines`, 'success')
    }
    setProductSearchInput('')
  }

  // Update line item property
  const updateLine = (id, field, value) => {
    setLineItems((prev) =>
      prev.map((l) => {
        if (l.id !== id) return l
        const updated = { ...l, [field]: value }
        const q = Number(updated.qty) || 0
        const c = Number(updated.cost) || 0
        const d = Number(updated.discount) || 0
        updated.total = Math.max(0, q * c - d)
        return updated
      })
    )
  }

  // Remove line item
  const removeLine = (id) => {
    setLineItems((prev) => prev.filter((l) => l.id !== id))
  }

  // Export line items to Excel
  const handleExportLines = () => {
    if (lineItems.length === 0) {
      addNotification?.('No product items to export', 'warning')
      return
    }
    const headers = ['№', 'Item Code', 'Barcode', 'Description', 'Onhand', 'Suggest QTY', 'QTY', 'Cost', 'Discount', 'UOM', 'Total']
    const data = lineItems.map((l, idx) => [
      idx + 1,
      l.itemCode,
      l.barcode,
      l.description,
      l.onhand,
      l.suggestQty,
      l.qty,
      l.cost,
      l.discount,
      l.uom,
      l.total.toFixed(2),
    ])
    exportStyledExcel(headers, data, `po_items_${formCode || 'draft'}.xlsx`, 'PO_Items')
  }

  // Import line items from Excel file
  const handleImportLines = (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (evt) => {
      try {
        const bstr = evt.target.result
        const wb = XLSX.read(bstr, { type: 'binary' })
        const wsName = wb.SheetNames[0]
        const ws = wb.Sheets[wsName]
        const data = XLSX.utils.sheet_to_json(ws, { header: 1 })

        if (data.length <= 1) {
          addNotification?.('Uploaded file contains no data rows', 'warning')
          return
        }

        const newItems = []
        for (let i = 1; i < data.length; i++) {
          const row = data[i]
          if (!row || row.length === 0) continue
          const itemCode = String(row[1] || row[0] || '').trim()
          const barcode = String(row[2] || '—').trim()
          const desc = String(row[3] || 'Imported Item').trim()
          const onhand = Number(row[4]) || 0
          const suggest = Number(row[5]) || 10
          const qty = Number(row[6]) || 1
          const cost = Number(row[7]) || 0
          const discount = Number(row[8]) || 0
          const uom = String(row[9] || 'Pcs').trim()

          if (itemCode || desc) {
            newItems.push({
              id: Date.now() + i,
              productId: null,
              itemCode: itemCode || `ITM-${Date.now() + i}`,
              barcode,
              description: desc,
              description2: '',
              productGroup: 'General',
              onhand,
              suggestQty: suggest,
              qty,
              cost,
              discount,
              uom,
              total: Math.max(0, qty * cost - discount),
            })
          }
        }

        if (newItems.length > 0) {
          setLineItems((prev) => [...prev, ...newItems])
          addNotification?.(`Successfully imported ${newItems.length} product lines!`, 'success')
        } else {
          addNotification?.('Could not find valid product rows', 'warning')
        }
      } catch {
        addNotification?.('Failed to parse Excel file', 'error')
      } finally {
        if (importFileInputRef.current) importFileInputRef.current.value = ''
      }
    }
    reader.readAsBinaryString(file)
  }

  // Summary Computations
  const subAmount = useMemo(() => {
    return lineItems.reduce((sum, l) => sum + (Number(l.total) || 0), 0)
  }, [lineItems])

  const calculatedDiscount = useMemo(() => {
    if (discountType === 'percent') {
      return (subAmount * (Number(discountValue) || 0)) / 100.0
    }
    return Number(discountValue) || 0
  }, [subAmount, discountType, discountValue])

  const calculatedTax = useMemo(() => {
    const afterDiscount = Math.max(0, subAmount - calculatedDiscount)
    return (afterDiscount * (Number(taxPercent) || 0)) / 100.0
  }, [subAmount, calculatedDiscount, taxPercent])

  const grandTotal = useMemo(() => {
    const res = subAmount - calculatedDiscount + calculatedTax
    return res > 0 ? res : 0
  }, [subAmount, calculatedDiscount, calculatedTax])

  // Submit PO to backend
  const handleSubmitPurchaseOrder = async (e) => {
    e.preventDefault()
    if (!formCode.trim()) {
      addNotification?.('Please specify a Purchase Order Code', 'warning')
      return
    }
    if (!formSupplier) {
      addNotification?.('Please select a Supplier', 'warning')
      return
    }
    if (lineItems.length === 0) {
      addNotification?.('Please add at least one product item to the order', 'warning')
      return
    }

    setSubmitting(true)
    try {
      const payload = {
        code: formCode.trim(),
        date: formDate ? formDate.slice(0, 10) : new Date().toISOString().slice(0, 10),
        requireDate: formRequireDate ? formRequireDate.slice(0, 10) : new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10),
        purchasePerson: formPurchasePerson,
        supplier: formSupplier,
        supplierId: formSupplierId,
        phone: formPhone,
        grandTotal,
        balance: grandTotal,
        reference: formReference.trim(),
        soCode: formSoCode.trim(),
        status: 'OPEN',
        username: 'Badmin',
        outlet: formOutlet,
        paymentTerm: formPaymentTerm,
        shipmentMethod: formShipmentMethod,
        templateName: formTemplateName,
        note: formNote.trim(),
        subAmount,
        discountPercent: discountType === 'percent' ? Number(discountValue) : 0,
        discountAmount: calculatedDiscount,
        taxAmount: calculatedTax,
        billingAddress: formBillingAddress,
        shippingAddress: formShippingAddress,
        carrier: formCarrier,
        trackingNumber: formTrackingNumber,
        items: lineItems.map((l) => ({
          productId: l.productId,
          itemCode: l.itemCode,
          barcode: l.barcode,
          description: l.description,
          description2: l.description2,
          productGroup: l.productGroup,
          onhand: Number(l.onhand) || 0,
          suggestQty: Number(l.suggestQty) || 0,
          qty: Number(l.qty) || 1,
          cost: Number(l.cost) || 0,
          discount: Number(l.discount) || 0,
          uom: l.uom || 'Pcs',
          total: Number(l.total) || 0,
        })),
      }

      await adminPurchaseOrderAPI.create(payload)
      addNotification?.(`Purchase Order ${payload.code} created successfully!`, 'success')
      setCreateModalOpen(false)
      fetchPurchaseOrders()
    } catch (err) {
      addNotification?.(err.message || 'Failed to create Purchase Order', 'error')
    } finally {
      setSubmitting(false)
    }
  }

  // Update Status directly
  const handleUpdateStatus = async (id, status) => {
    try {
      await adminPurchaseOrderAPI.updateStatus(id, status)
      addNotification?.(`Purchase Order marked as ${status}`, 'success')
      fetchPurchaseOrders()
    } catch (err) {
      addNotification?.(err.message || 'Failed to update status', 'error')
    }
  }

  // Export Table records to Excel
  const handleExportTable = () => {
    if (purchaseOrders.length === 0) {
      addNotification?.('No purchase orders to export', 'warning')
      return
    }
    const headers = [
      'Code',
      'Date',
      'Require Date',
      'Purchase Person',
      'Supplier',
      'Phone',
      'Grand Total ($)',
      'Balance ($)',
      'Reference',
      'Voided Date',
      'SO Code',
      'Status',
      'Username',
      'Outlet',
    ]
    const data = purchaseOrders.map((po) => [
      po.code,
      po.date || '—',
      po.requireDate || '—',
      po.purchasePerson || '—',
      po.supplier || '—',
      po.phone || '—',
      Number(po.grandTotal || 0).toFixed(2),
      Number(po.balance || 0).toFixed(2),
      po.reference || '—',
      po.voidedDate || '—',
      po.soCode || '—',
      po.status || 'OPEN',
      po.username || '—',
      po.outlet || '—',
    ])
    exportStyledExcel(headers, data, `purchase_orders_${new Date().toISOString().slice(0, 10)}.xlsx`, 'Orders')
    addNotification?.('Purchase orders exported to Excel', 'success')
  }

  // Status badge styling helper
  const renderStatusBadge = (status = 'OPEN') => {
    const s = String(status).toUpperCase()
    if (s === 'OPEN') {
      return (
        <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 font-mono">
          open
        </span>
      )
    }
    if (s === 'PARTIAL') {
      return (
        <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/30 font-mono">
          Partial
        </span>
      )
    }
    if (s === 'COMPLETED') {
      return (
        <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 font-mono">
          Completed
        </span>
      )
    }
    if (s === 'CLOSED') {
      return (
        <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-indigo-500/10 text-indigo-400 border border-indigo-500/30 font-mono">
          closed
        </span>
      )
    }
    if (s === 'VOIDED') {
      return (
        <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-rose-500/10 text-rose-400 border border-rose-500/30 font-mono">
          voided
        </span>
      )
    }
    return (
      <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-slate-800 text-slate-300 font-mono">
        {status}
      </span>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-slate-100 p-4 sm:p-6 lg:p-8 font-sans">
      {/* Top Header & Breadcrumbs */}
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-400 mb-1">
            <Link to="/admin/purchase-management" className="hover:text-cyan-400 transition-colors">
              {lang === 'en' ? 'Purchase Management' : 'ការគ្រប់គ្រងការទិញ'}
            </Link>
            <span>/</span>
            <span className="text-cyan-400 font-medium">
              {lang === 'en' ? 'Purchase Orders' : 'ការបញ្ជាទិញទំនិញ (PO)'}
            </span>
          </div>
          <div className="flex items-center gap-3">
            <img src={bagIcon} alt="PO" className="w-9 h-9 object-contain drop-shadow-md" />
            <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
              {lang === 'en' ? 'Purchase Orders' : 'ការបញ្ជាទិញទំនិញ (Purchase Orders)'}
            </h1>
          </div>
        </div>

        {/* Top Right Action Buttons */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            type="button"
            onClick={() => setChooseColumnOpen(true)}
            className="px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-300 bg-slate-900 hover:bg-slate-800 border border-slate-700/80 transition-all flex items-center gap-1.5 shadow-sm"
          >
            <FilterIcon className="w-3.5 h-3.5 text-cyan-400" />
            <span>{lang === 'en' ? 'Choose Column' : 'ជ្រើសរើសជួរឈរ'}</span>
          </button>

          <button
            type="button"
            onClick={handleExportTable}
            className="px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-300 bg-slate-900 hover:bg-slate-800 border border-slate-700/80 transition-all flex items-center gap-1.5 shadow-sm"
          >
            <DownloadIcon className="w-3.5 h-3.5 text-emerald-400" />
            <span>{lang === 'en' ? 'Export Excel' : 'ទាញយក Excel'}</span>
          </button>

          <button
            type="button"
            onClick={() => handleOpenCreateModal()}
            className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 shadow-lg shadow-cyan-900/30 transition-all flex items-center gap-2 hover:scale-105 active:scale-95"
          >
            <PlusIcon className="w-4 h-4" />
            <span>{lang === 'en' ? 'Create Purchase Order' : 'បង្កើតការបញ្ជាទិញថ្មី'}</span>
          </button>
        </div>
      </div>

      {/* SEARCH SECTION: Search Button - Textbox - Search By - Advance Filter */}
      <div className="mb-6 bg-slate-900/70 backdrop-blur-md rounded-2xl p-4 sm:p-5 border border-slate-800 shadow-xl space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex-1 flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
            {/* Search Input */}
            <div className="relative flex-1">
              <input
                type="text"
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearchClick()}
                placeholder={lang === 'en' ? 'Search Purchase Order by any condition...' : 'ស្វែងរកការបញ្ជាទិញ...'}
                className="w-full bg-slate-950/80 border border-slate-700 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-cyan-500"
              />
              <SearchIcon className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            </div>

            {/* Search By Dropdown: Any - Code - Supplier - Part Number - Product Code - Reference */}
            <div className="flex items-center gap-2">
              <label className="text-[11px] text-slate-400 font-semibold whitespace-nowrap">
                Search By:
              </label>
              <select
                value={searchBy}
                onChange={(e) => setSearchBy(e.target.value)}
                className="bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
              >
                <option value="Any">Any</option>
                <option value="Code">Code</option>
                <option value="Supplier">Supplier</option>
                <option value="Part Number">Part Number</option>
                <option value="Product Code">Product Code</option>
                <option value="Reference">Reference</option>
              </select>
            </div>

            {/* Search Button */}
            <button
              type="button"
              onClick={handleSearchClick}
              className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-cyan-600 hover:bg-cyan-500 transition-all flex items-center justify-center gap-1.5 shadow-md shadow-cyan-900/30"
            >
              <SearchIcon className="w-3.5 h-3.5" />
              <span>{lang === 'en' ? 'Search' : 'ស្វែងរក'}</span>
            </button>
          </div>

          {/* Toggle Advance Filter Button */}
          <button
            type="button"
            onClick={() => setAdvanceFilterOpen(!advanceFilterOpen)}
            className={`px-3.5 py-2 rounded-xl text-xs font-semibold border flex items-center justify-center gap-2 transition-all ${
              advanceFilterOpen
                ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40'
                : 'bg-slate-950/60 text-slate-400 border-slate-800 hover:text-white'
            }`}
          >
            <FilterIcon className="w-3.5 h-3.5 text-cyan-400" />
            <span>{lang === 'en' ? 'Advance Filter' : 'តម្រងកម្រិតខ្ពស់'}</span>
            <ChevronDownIcon className={`w-3.5 h-3.5 transition-transform duration-200 ${advanceFilterOpen ? 'rotate-180' : ''}`} />
          </button>
        </div>

        {/* ADVANCE FILTER PANEL */}
        {advanceFilterOpen && (
          <div className="pt-3 border-t border-slate-800/80 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 text-xs">
            {/* From Date */}
            <div>
              <label className="block text-slate-400 font-semibold mb-1">From Date</label>
              <input
                type="date"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-1.5 text-slate-200 focus:outline-none focus:border-cyan-500"
              />
            </div>

            {/* To Date */}
            <div>
              <label className="block text-slate-400 font-semibold mb-1">To Date</label>
              <input
                type="date"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-1.5 text-slate-200 focus:outline-none focus:border-cyan-500"
              />
            </div>

            {/* Outlet Dropdown */}
            <div>
              <label className="block text-slate-400 font-semibold mb-1">Outlet</label>
              <select
                value={outletFilter}
                onChange={(e) => setOutletFilter(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-1.5 text-slate-200 focus:outline-none focus:border-cyan-500"
              >
                <option value="all">All Outlets</option>
                {OUTLET_OPTIONS.map((o) => (
                  <option key={o} value={o}>{o}</option>
                ))}
              </select>
            </div>

            {/* Purchase Person Dropdown */}
            <div>
              <label className="block text-slate-400 font-semibold mb-1">Purchase Person</label>
              <select
                value={purchasePersonFilter}
                onChange={(e) => setPurchasePersonFilter(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-1.5 text-slate-200 focus:outline-none focus:border-cyan-500"
              >
                <option value="all">All Persons</option>
                {PURCHASE_PERSON_OPTIONS.map((p) => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
            </div>

            {/* Status Dropdown: Any - open - Partial - Completed - closed - voided + Reset */}
            <div className="flex items-end gap-2">
              <div className="flex-1">
                <label className="block text-slate-400 font-semibold mb-1">Status</label>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-1.5 text-slate-200 focus:outline-none focus:border-cyan-500"
                >
                  {STATUS_OPTIONS.map((st) => (
                    <option key={st} value={st}>{st}</option>
                  ))}
                </select>
              </div>
              <button
                type="button"
                onClick={handleResetFilters}
                className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 font-semibold text-xs flex items-center gap-1 transition-colors"
                title="Reset all filters"
              >
                <RefreshIcon className="w-3.5 h-3.5" />
                <span>Reset</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* PURCHASE ORDER LIST TABLE */}
      <div className="bg-slate-900/60 backdrop-blur-md rounded-2xl border border-slate-800 shadow-xl overflow-hidden">
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">
              {lang === 'en' ? 'Purchase Order List' : 'បញ្ជីការបញ្ជាទិញទំនិញ'}
            </h3>
            <p className="text-xs text-slate-400">
              {lang === 'en'
                ? 'Show information of purchase order list (Code, Date, Require Date, Supplier...)'
                : 'បង្ហាញព័ត៌មានលម្អិតនៃបញ្ជីបញ្ជាទិញទំនិញ'}
            </p>
          </div>
          <div className="text-xs font-mono text-cyan-400 bg-cyan-950/40 px-3 py-1 rounded-full border border-cyan-800/40">
            Total: {purchaseOrders.length} {purchaseOrders.length === 1 ? 'order' : 'orders'}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left text-slate-300 border-collapse">
            <thead className="bg-slate-950/80 text-slate-400 uppercase tracking-wider font-semibold border-b border-slate-800">
              <tr>
                {ALL_COLUMNS.filter((c) => visibleColumns.includes(c.key)).map((col) => (
                  <th
                    key={col.key}
                    className={`py-3 px-4 ${
                      ['grandTotal', 'balance'].includes(col.key)
                        ? 'text-right'
                        : col.key === 'status' || col.key === 'actions'
                        ? 'text-center'
                        : ''
                    }`}
                  >
                    {col.label[lang] || col.label.en}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {loading ? (
                <tr>
                  <td colSpan={visibleColumns.length} className="py-12 text-center text-slate-500">
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-4 h-4 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin" />
                      <span>Loading purchase orders...</span>
                    </div>
                  </td>
                </tr>
              ) : purchaseOrders.length === 0 ? (
                <tr>
                  <td colSpan={visibleColumns.length} className="py-12 text-center text-slate-500">
                    No purchase orders found matching the filter criteria.
                  </td>
                </tr>
              ) : (
                purchaseOrders.map((po) => (
                  <tr key={po.id} className="hover:bg-slate-800/40 transition-colors">
                    {visibleColumns.includes('code') && (
                      <td className="py-3 px-4 font-mono font-bold text-cyan-400">{po.code}</td>
                    )}
                    {visibleColumns.includes('date') && (
                      <td className="py-3 px-4 font-mono text-slate-300">{po.date || '—'}</td>
                    )}
                    {visibleColumns.includes('requireDate') && (
                      <td className="py-3 px-4 font-mono text-slate-400">{po.requireDate || '—'}</td>
                    )}
                    {visibleColumns.includes('purchasePerson') && (
                      <td className="py-3 px-4 text-slate-200 font-medium">{po.purchasePerson || '—'}</td>
                    )}
                    {visibleColumns.includes('supplier') && (
                      <td className="py-3 px-4 font-semibold text-white">{po.supplier || '—'}</td>
                    )}
                    {visibleColumns.includes('phone') && (
                      <td className="py-3 px-4 font-mono text-slate-400">{po.phone || '—'}</td>
                    )}
                    {visibleColumns.includes('grandTotal') && (
                      <td className="py-3 px-4 text-right font-mono font-bold text-emerald-400">
                        ${Number(po.grandTotal || 0).toFixed(2)}
                      </td>
                    )}
                    {visibleColumns.includes('balance') && (
                      <td className="py-3 px-4 text-right font-mono font-bold text-cyan-300">
                        ${Number(po.balance || 0).toFixed(2)}
                      </td>
                    )}
                    {visibleColumns.includes('reference') && (
                      <td className="py-3 px-4 text-slate-400">{po.reference || '—'}</td>
                    )}
                    {visibleColumns.includes('voidedDate') && (
                      <td className="py-3 px-4 font-mono text-slate-500">{po.voidedDate || '—'}</td>
                    )}
                    {visibleColumns.includes('soCode') && (
                      <td className="py-3 px-4 font-mono text-slate-400">{po.soCode || '—'}</td>
                    )}
                    {visibleColumns.includes('status') && (
                      <td className="py-3 px-4 text-center">{renderStatusBadge(po.status)}</td>
                    )}
                    {visibleColumns.includes('username') && (
                      <td className="py-3 px-4 text-slate-400">{po.username || '—'}</td>
                    )}
                    {visibleColumns.includes('outlet') && (
                      <td className="py-3 px-4 text-slate-300">{po.outlet || '—'}</td>
                    )}
                    {visibleColumns.includes('actions') && (
                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedPO(po)
                              setDetailModalOpen(true)
                            }}
                            className="px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-slate-800 hover:bg-slate-700 text-cyan-400 hover:text-cyan-300 border border-slate-700"
                          >
                            View
                          </button>
                          {po.status !== 'COMPLETED' && po.status !== 'VOIDED' && (
                            <button
                              type="button"
                              onClick={() => handleUpdateStatus(po.id, 'COMPLETED')}
                              className="px-2 py-1 rounded-lg text-[11px] font-semibold bg-emerald-950/40 text-emerald-400 border border-emerald-800/50 hover:bg-emerald-900/50"
                              title="Mark Completed"
                            >
                              ✓
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => {
                              navigate('/admin/purchase-management/receipt-po', {
                                state: { fromPO: true, poCode: po.code, poId: po.id, supplier: po.supplier, items: po.items },
                              })
                            }}
                            className="px-2 py-1 rounded-lg text-[11px] font-semibold bg-cyan-950/40 text-cyan-300 border border-cyan-800/40 hover:bg-cyan-900/50"
                            title="Convert to Receipt PO"
                          >
                            To Receipt →
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* CREATE PURCHASE ORDER MODAL */}
      {createModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/80 backdrop-blur-sm overflow-y-auto">
          <div className="relative w-full max-w-6xl my-auto bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
            {/* Modal Header */}
            <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/90">
              <div className="flex items-center gap-3">
                <span className="p-2 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
                  <bagIcon className="w-6 h-6" />
                </span>
                <div>
                  <h3 className="text-base sm:text-lg font-bold text-white">Purchase Order Information</h3>
                  <p className="text-xs text-slate-400">Add primary information for purchase order</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setCreateModalOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center text-sm transition-colors"
              >
                ✕
              </button>
            </div>

            {/* Modal Body: Scrollable */}
            <form onSubmit={handleSubmitPurchaseOrder} className="p-4 sm:p-6 overflow-y-auto space-y-6 text-xs flex-1">
              {/* PRIMARY INFORMATION GRID */}
              <div className="bg-slate-950/60 rounded-xl p-4 border border-slate-800/80 space-y-4">
                <h4 className="text-xs font-bold text-cyan-400 uppercase tracking-wider">
                  Primary Information
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  {/* Supplier * */}
                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">
                      Supplier <span className="text-rose-400">*</span>
                    </label>
                    <select
                      value={formSupplier}
                      onChange={(e) => handleSupplierChange(e.target.value)}
                      required
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-cyan-500"
                    >
                      <option value="">-- Select Supplier --</option>
                      {suppliers.map((s) => (
                        <option key={s.id} value={s.supplierName || s.name}>
                          {s.supplierName || s.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Purchase Order Date */}
                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">Purchase Order Date</label>
                    <input
                      type="datetime-local"
                      value={formDate}
                      onChange={(e) => setFormDate(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-cyan-500 font-mono"
                    />
                  </div>

                  {/* Required Date */}
                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">Required Date</label>
                    <input
                      type="datetime-local"
                      value={formRequireDate}
                      onChange={(e) => setFormRequireDate(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-cyan-500 font-mono"
                    />
                  </div>

                  {/* Code - Auto Generate Code */}
                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">
                      Code <span className="text-[10px] text-cyan-400 font-normal">(Auto Generated)</span>
                    </label>
                    <input
                      type="text"
                      value={formCode}
                      onChange={(e) => setFormCode(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-cyan-300 font-mono font-bold focus:outline-none focus:border-cyan-500"
                    />
                  </div>

                  {/* Payment Term * */}
                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">
                      Payment Term <span className="text-rose-400">*</span>
                    </label>
                    <select
                      value={formPaymentTerm}
                      onChange={(e) => setFormPaymentTerm(e.target.value)}
                      required
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-cyan-500"
                    >
                      {PAYMENT_TERM_OPTIONS.map((pt) => (
                        <option key={pt} value={pt}>{pt}</option>
                      ))}
                    </select>
                  </div>

                  {/* Purchase Person */}
                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">Purchase Person</label>
                    <select
                      value={formPurchasePerson}
                      onChange={(e) => setFormPurchasePerson(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-cyan-500"
                    >
                      {PURCHASE_PERSON_OPTIONS.map((pp) => (
                        <option key={pp} value={pp}>{pp}</option>
                      ))}
                    </select>
                  </div>

                  {/* Shipment Method */}
                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">Shipment Method</label>
                    <select
                      value={formShipmentMethod}
                      onChange={(e) => setFormShipmentMethod(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-cyan-500"
                    >
                      {SHIPMENT_METHOD_OPTIONS.map((sm) => (
                        <option key={sm} value={sm}>{sm}</option>
                      ))}
                    </select>
                  </div>

                  {/* Phone */}
                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">Supplier Phone</label>
                    <input
                      type="text"
                      value={formPhone}
                      onChange={(e) => setFormPhone(e.target.value)}
                      placeholder="+855 ..."
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-slate-200 font-mono focus:outline-none focus:border-cyan-500"
                    />
                  </div>
                </div>
              </div>

              {/* SUB-TABS NAVIGATION */}
              {/* Purchase Order List | Bill Information | Shipping Information | Freight Information | Supplier History | Others */}
              <div className="border-b border-slate-800 flex items-center gap-2 overflow-x-auto pb-1 text-xs">
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
                    onClick={() => setActiveModalTab(tab.key)}
                    className={`px-3.5 py-2 rounded-t-xl font-bold transition-all whitespace-nowrap ${
                      activeModalTab === tab.key
                        ? 'bg-slate-800 text-cyan-400 border-b-2 border-cyan-400'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* TAB 1: PURCHASE ORDER LIST (THE MAIN LINE ITEMS TABLE) */}
              {activeModalTab === 'po_list' && (
                <div className="space-y-4">
                  {/* Search Line & Product Group */}
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-slate-950/60 p-3 rounded-xl border border-slate-800">
                    <div className="relative flex-1">
                      <input
                        type="text"
                        value={productSearchInput}
                        onChange={(e) => setProductSearchInput(e.target.value)}
                        placeholder="Hint: Barcode or Sku here... (Item Code, Description, Description2, Barcode)"
                        className="w-full bg-slate-900 border border-cyan-500/40 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-cyan-400 shadow-inner"
                      />
                      <SearchIcon className="w-4 h-4 text-cyan-400 absolute left-3 top-2.5" />

                      {/* Autocomplete Results Dropdown */}
                      {matchedCatalogProducts.length > 0 && (
                        <div className="absolute left-0 right-0 top-full mt-1 z-30 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl max-h-56 overflow-y-auto divide-y divide-slate-800">
                          {matchedCatalogProducts.map((prod) => (
                            <div
                              key={prod.id}
                              onClick={() => handleAddProductToLines(prod)}
                              className="p-2.5 hover:bg-cyan-950/40 cursor-pointer flex items-center justify-between transition-colors"
                            >
                              <div>
                                <div className="font-semibold text-white">
                                  {prod.description || prod.name || prod.productName}
                                </div>
                                <div className="text-[11px] text-slate-400 flex items-center gap-2 font-mono">
                                  <span>{prod.code || prod.productCode}</span>
                                  {prod.barCode && (
                                    <>
                                      <span>•</span>
                                      <span>{prod.barCode}</span>
                                    </>
                                  )}
                                  <span>•</span>
                                  <span className="text-cyan-400">Onhand: {prod.onHand || prod.onhand || 0}</span>
                                </div>
                              </div>
                              <div className="text-right">
                                <span className="font-mono font-bold text-emerald-400">
                                  ${Number(prod.averageCost || prod.basePrice || 1.0).toFixed(2)}
                                </span>
                                <span className="ml-2 px-2 py-0.5 rounded text-[10px] bg-cyan-600/30 text-cyan-300 font-bold">
                                  + Add
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Product Group Dropdown */}
                    <div className="flex items-center gap-2">
                      <label className="text-slate-400 font-semibold whitespace-nowrap">Product Group:</label>
                      <select
                        value={selectedProductGroup}
                        onChange={(e) => setSelectedProductGroup(e.target.value)}
                        className="bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-cyan-500"
                      >
                        <option value="all">All Groups</option>
                        <option value="Beverages">Beverages</option>
                        <option value="Snacks">Snacks</option>
                        <option value="Dairy">Dairy</option>
                        <option value="Grains">Grains</option>
                        <option value="Condiments">Condiments</option>
                      </select>
                    </div>

                    {/* Import & Export buttons */}
                    <div className="flex items-center gap-2">
                      <input
                        type="file"
                        ref={importFileInputRef}
                        onChange={handleImportLines}
                        accept=".xlsx,.xls,.csv"
                        className="hidden"
                      />
                      <button
                        type="button"
                        onClick={() => importFileInputRef.current?.click()}
                        className="px-3 py-2 rounded-xl text-xs font-semibold text-slate-300 bg-slate-800 hover:bg-slate-700 hover:text-white border border-slate-700 flex items-center gap-1.5 transition-all"
                        title="Import lines from Excel"
                      >
                        <UploadIcon className="w-3.5 h-3.5" />
                        <span>Import</span>
                      </button>
                      <button
                        type="button"
                        onClick={handleExportLines}
                        className="px-3 py-2 rounded-xl text-xs font-semibold text-slate-300 bg-slate-800 hover:bg-slate-700 hover:text-white border border-slate-700 flex items-center gap-1.5 transition-all"
                        title="Export lines to Excel"
                      >
                        <DownloadIcon className="w-3.5 h-3.5" />
                        <span>Export</span>
                      </button>
                    </div>
                  </div>

                  {/* Line Items Table: № | Description | Onhand | Suggest QTY | QTY | Cost | Discount | UOM | Total */}
                  <div className="overflow-x-auto rounded-xl border border-slate-800">
                    <table className="w-full text-xs text-left text-slate-300 border-collapse">
                      <thead className="bg-slate-950 text-slate-400 uppercase tracking-wider font-semibold border-b border-slate-800">
                        <tr>
                          <th className="py-2.5 px-3 w-8 text-center">№</th>
                          <th className="py-2.5 px-3">Item Code</th>
                          <th className="py-2.5 px-4 min-w-[200px]">Description</th>
                          <th className="py-2.5 px-3 text-right">Onhand</th>
                          <th className="py-2.5 px-3 text-right">Suggest QTY</th>
                          <th className="py-2.5 px-3 text-right w-24">QTY</th>
                          <th className="py-2.5 px-3 text-right w-24">Cost</th>
                          <th className="py-2.5 px-3 text-right w-24">Discount ($)</th>
                          <th className="py-2.5 px-3 text-center w-24">UOM</th>
                          <th className="py-2.5 px-3 text-right">Total</th>
                          <th className="py-2.5 px-2 w-8 text-center" />
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/60">
                        {lineItems.length > 0 ? (
                          lineItems.map((line, idx) => (
                            <tr key={line.id} className="hover:bg-slate-900/50 transition-colors">
                              <td className="py-2 px-3 text-center font-mono text-slate-500">{idx + 1}</td>
                              <td className="py-2 px-3 font-mono text-cyan-300">
                                <div>{line.itemCode}</div>
                                {line.barcode && line.barcode !== '—' && (
                                  <div className="text-[10px] text-slate-500">{line.barcode}</div>
                                )}
                              </td>
                              <td className="py-2 px-4 font-semibold text-white">{line.description}</td>
                              <td className="py-2 px-3 text-right font-mono text-slate-400">{line.onhand}</td>
                              <td className="py-2 px-3 text-right font-mono text-cyan-400">{line.suggestQty}</td>
                              <td className="py-2 px-3 text-right">
                                <input
                                  type="number"
                                  min="1"
                                  value={line.qty}
                                  onChange={(e) => updateLine(line.id, 'qty', e.target.value)}
                                  className="w-20 bg-slate-900 border border-slate-700 rounded px-2 py-1 text-right text-cyan-300 font-mono font-bold focus:outline-none focus:border-cyan-400"
                                />
                              </td>
                              <td className="py-2 px-3 text-right">
                                <input
                                  type="number"
                                  step="0.01"
                                  min="0"
                                  value={line.cost}
                                  onChange={(e) => updateLine(line.id, 'cost', e.target.value)}
                                  className="w-20 bg-slate-900 border border-slate-700 rounded px-2 py-1 text-right text-slate-200 font-mono focus:outline-none focus:border-cyan-400"
                                />
                              </td>
                              <td className="py-2 px-3 text-right">
                                <input
                                  type="number"
                                  step="0.01"
                                  min="0"
                                  value={line.discount}
                                  onChange={(e) => updateLine(line.id, 'discount', e.target.value)}
                                  className="w-20 bg-slate-900 border border-slate-700 rounded px-2 py-1 text-right text-amber-300 font-mono focus:outline-none focus:border-cyan-400"
                                />
                              </td>
                              <td className="py-2 px-3 text-center">
                                <select
                                  value={line.uom}
                                  onChange={(e) => updateLine(line.id, 'uom', e.target.value)}
                                  className="bg-slate-900 border border-slate-700 rounded px-2 py-1 text-[11px] text-slate-200"
                                >
                                  {UOM_OPTIONS.map((u) => (
                                    <option key={u} value={u}>{u}</option>
                                  ))}
                                </select>
                              </td>
                              <td className="py-2 px-3 text-right font-mono font-bold text-emerald-400">
                                ${Number(line.total || 0).toFixed(2)}
                              </td>
                              <td className="py-2 px-2 text-center">
                                <button
                                  type="button"
                                  onClick={() => removeLine(line.id)}
                                  className="text-slate-500 hover:text-rose-400 p-1"
                                  title="Remove line"
                                >
                                  <TrashIcon className="w-3.5 h-3.5" />
                                </button>
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan="11" className="py-8 text-center text-slate-500">
                              No product lines added yet. Use the search bar above to select products.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>

                  {/* Summary Bar */}
                  <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between font-mono text-xs">
                    <span className="text-slate-400">
                      Total Items: <span className="font-bold text-white">{lineItems.length}</span> | Total Units:{' '}
                      <span className="font-bold text-white">
                        {lineItems.reduce((s, l) => s + (Number(l.qty) || 0), 0)}
                      </span>
                    </span>
                    <span className="text-slate-300">
                      Items Subtotal:{' '}
                      <span className="font-bold text-emerald-400 text-sm">${subAmount.toFixed(2)}</span>
                    </span>
                  </div>
                </div>
              )}

              {/* TAB 2: BILL INFORMATION */}
              {activeModalTab === 'bill_info' && (
                <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800 space-y-4">
                  <h4 className="font-bold text-cyan-400 uppercase">Billing Information</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-slate-300 font-semibold mb-1">Billing Address</label>
                      <textarea
                        rows="3"
                        value={formBillingAddress}
                        onChange={(e) => setFormBillingAddress(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-slate-200"
                      />
                    </div>
                    <div className="space-y-3">
                      <div>
                        <label className="block text-slate-300 font-semibold mb-1">Sales Order Code (SO Code)</label>
                        <input
                          type="text"
                          value={formSoCode}
                          onChange={(e) => setFormSoCode(e.target.value)}
                          placeholder="e.g. SO-20260904-001"
                          className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-slate-200 font-mono"
                        />
                      </div>
                      <div>
                        <label className="block text-slate-300 font-semibold mb-1">Tax No / VAT Identification</label>
                        <input
                          type="text"
                          defaultValue="K008-90219827"
                          className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-slate-200 font-mono"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 3: SHIPPING INFORMATION */}
              {activeModalTab === 'shipping_info' && (
                <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800 space-y-4">
                  <h4 className="font-bold text-cyan-400 uppercase">Shipping & Delivery Details</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-slate-300 font-semibold mb-1">Destination Shipping Address</label>
                      <textarea
                        rows="3"
                        value={formShippingAddress}
                        onChange={(e) => setFormShippingAddress(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-slate-200"
                      />
                    </div>
                    <div className="space-y-3">
                      <div>
                        <label className="block text-slate-300 font-semibold mb-1">Delivery Receiving Contact</label>
                        <input
                          type="text"
                          defaultValue="Receiving Dock Manager (+855 12 445 566)"
                          className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-slate-200"
                        />
                      </div>
                      <div>
                        <label className="block text-slate-300 font-semibold mb-1">Receiving Dock Door / Slot</label>
                        <input
                          type="text"
                          defaultValue="Door B - Cold Chain Entrance"
                          className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-slate-200"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 4: FREIGHT INFORMATION */}
              {activeModalTab === 'freight_info' && (
                <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800 space-y-4">
                  <h4 className="font-bold text-cyan-400 uppercase">Freight & Logistics</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-slate-300 font-semibold mb-1">Logistics Carrier</label>
                      <input
                        type="text"
                        value={formCarrier}
                        onChange={(e) => setFormCarrier(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-slate-200"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-300 font-semibold mb-1">Tracking Number / Consignment Note</label>
                      <input
                        type="text"
                        value={formTrackingNumber}
                        onChange={(e) => setFormTrackingNumber(e.target.value)}
                        placeholder="TRK-998822..."
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-slate-200 font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-300 font-semibold mb-1">Estimated Transit Days</label>
                      <input
                        type="number"
                        defaultValue="2"
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-slate-200 font-mono"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 5: SUPPLIER HISTORY */}
              {activeModalTab === 'supplier_history' && (
                <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800 space-y-3">
                  <h4 className="font-bold text-cyan-400 uppercase">Supplier Performance & History</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="p-3 bg-slate-900 rounded-xl border border-slate-800">
                      <div className="text-slate-400">Total Orders Fulfilled</div>
                      <div className="text-xl font-bold text-white font-mono mt-1">24 Orders</div>
                    </div>
                    <div className="p-3 bg-slate-900 rounded-xl border border-slate-800">
                      <div className="text-slate-400">On-Time Delivery Rate</div>
                      <div className="text-xl font-bold text-emerald-400 font-mono mt-1">98.5%</div>
                    </div>
                    <div className="p-3 bg-slate-900 rounded-xl border border-slate-800">
                      <div className="text-slate-400">Quality Inspection Pass</div>
                      <div className="text-xl font-bold text-cyan-400 font-mono mt-1">100%</div>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 6: OTHERS */}
              {activeModalTab === 'others' && (
                <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800 space-y-4">
                  <h4 className="font-bold text-cyan-400 uppercase">Other References & Audit</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-slate-300 font-semibold mb-1">Reference / Notice</label>
                      <input
                        type="text"
                        value={formReference}
                        onChange={(e) => setFormReference(e.target.value)}
                        placeholder="e.g. Branch Replenishment Notice #102"
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-slate-200"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-300 font-semibold mb-1">Author / Buyer</label>
                      <input
                        type="text"
                        value={formPurchasePerson}
                        readOnly
                        className="w-full bg-slate-900/50 border border-slate-700 rounded-xl px-3 py-2 text-slate-400"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* SECTION: PURCHASE ORDER SUMMARY */}
              <div className="bg-slate-950/70 rounded-xl p-4 sm:p-5 border border-slate-800 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <h4 className="text-xs font-bold text-cyan-400 uppercase tracking-wider">
                    Purchase Order Summary
                  </h4>
                  <span className="text-[11px] text-slate-400">Add primary information</span>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Left: Outlet, Template, Note */}
                  <div className="space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-slate-300 font-semibold mb-1">Outlet</label>
                        <select
                          value={formOutlet}
                          onChange={(e) => setFormOutlet(e.target.value)}
                          className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-cyan-500"
                        >
                          {OUTLET_OPTIONS.map((o) => (
                            <option key={o} value={o}>{o}</option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-slate-300 font-semibold mb-1">Template Name</label>
                        <select
                          value={formTemplateName}
                          onChange={(e) => setFormTemplateName(e.target.value)}
                          className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-cyan-500"
                        >
                          {TEMPLATE_OPTIONS.map((t) => (
                            <option key={t} value={t}>{t}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block text-slate-300 font-semibold mb-1">Note</label>
                      <textarea
                        rows="3"
                        value={formNote}
                        onChange={(e) => setFormNote(e.target.value)}
                        placeholder="Internal instructions for warehouse or supplier..."
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-slate-200 focus:outline-none focus:border-cyan-500"
                      />
                    </div>
                  </div>

                  {/* Right: Sub Amount, Discount, Tax, Grand Total */}
                  <div className="bg-slate-900/90 rounded-xl p-4 border border-slate-800 space-y-3 font-mono">
                    <div className="flex items-center justify-between text-slate-300">
                      <span>Sub Amount:</span>
                      <span className="font-bold text-white text-sm">${subAmount.toFixed(2)}</span>
                    </div>

                    {/* Discount Input (% or $) */}
                    <div className="flex items-center justify-between gap-3 pt-2 border-t border-slate-800">
                      <div className="flex items-center gap-2">
                        <span className="text-slate-300">Discount:</span>
                        <div className="flex rounded-lg border border-slate-700 overflow-hidden text-[10px]">
                          <button
                            type="button"
                            onClick={() => setDiscountType('percent')}
                            className={`px-2 py-0.5 ${discountType === 'percent' ? 'bg-cyan-600 text-white font-bold' : 'bg-slate-800 text-slate-400'}`}
                          >
                            %
                          </button>
                          <button
                            type="button"
                            onClick={() => setDiscountType('amount')}
                            className={`px-2 py-0.5 ${discountType === 'amount' ? 'bg-cyan-600 text-white font-bold' : 'bg-slate-800 text-slate-400'}`}
                          >
                            $
                          </button>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          value={discountValue}
                          onChange={(e) => setDiscountValue(e.target.value)}
                          className="w-24 bg-slate-950 border border-slate-700 rounded px-2 py-1 text-right text-amber-300 font-bold focus:outline-none focus:border-cyan-500"
                        />
                        <span className="text-amber-400 w-16 text-right">
                          -${calculatedDiscount.toFixed(2)}
                        </span>
                      </div>
                    </div>

                    {/* Tax Amount */}
                    <div className="flex items-center justify-between gap-3 pt-2 border-t border-slate-800">
                      <div className="flex items-center gap-2">
                        <span className="text-slate-300">Tax Amount:</span>
                        <select
                          value={taxPercent}
                          onChange={(e) => setTaxPercent(e.target.value)}
                          className="bg-slate-950 border border-slate-700 rounded px-2 py-1 text-[11px] text-slate-200"
                        >
                          <option value="0">0% VAT</option>
                          <option value="10">10% VAT</option>
                        </select>
                      </div>
                      <span className="text-slate-300 font-bold">${calculatedTax.toFixed(2)}</span>
                    </div>

                    {/* Grand Total */}
                    <div className="flex items-center justify-between pt-3 border-t-2 border-slate-700 text-base">
                      <span className="font-bold text-white font-sans">Grand Total:</span>
                      <span className="font-extrabold text-emerald-400 text-xl font-mono">
                        ${grandTotal.toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-2 flex items-center justify-end gap-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setCreateModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-6 py-2 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 shadow-lg shadow-cyan-900/30 transition-all hover:scale-105 active:scale-95"
                >
                  {submitting ? 'Creating...' : 'Create Purchase Order'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DETAIL MODAL */}
      {detailModalOpen && selectedPO && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="relative w-full max-w-3xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden">
            <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950">
              <div className="flex items-center gap-3">
                <span className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400 font-mono font-bold">
                  {selectedPO.code}
                </span>
                <div>
                  <h3 className="text-sm font-bold text-white">Purchase Order Summary</h3>
                  <p className="text-[11px] text-slate-400">{selectedPO.supplier}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setDetailModalOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center"
              >
                ✕
              </button>
            </div>

            <div className="p-5 space-y-4 text-xs max-h-[75vh] overflow-y-auto">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-950 p-3 rounded-xl border border-slate-800">
                <div>
                  <span className="text-slate-500 block">Date</span>
                  <span className="font-mono text-white">{selectedPO.date || '—'}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Require Date</span>
                  <span className="font-mono text-cyan-400">{selectedPO.requireDate || '—'}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Status</span>
                  <span>{renderStatusBadge(selectedPO.status)}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Grand Total</span>
                  <span className="font-mono font-bold text-emerald-400 text-sm">
                    ${Number(selectedPO.grandTotal || 0).toFixed(2)}
                  </span>
                </div>
              </div>

              {/* Items in PO */}
              <div>
                <h4 className="font-bold text-slate-300 uppercase mb-2">Product Items</h4>
                <div className="overflow-x-auto rounded-xl border border-slate-800">
                  <table className="w-full text-xs text-left text-slate-300">
                    <thead className="bg-slate-950 text-slate-400 font-semibold border-b border-slate-800">
                      <tr>
                        <th className="py-2 px-3">Item Code</th>
                        <th className="py-2 px-3">Description</th>
                        <th className="py-2 px-3 text-right">Qty</th>
                        <th className="py-2 px-3 text-right">Cost</th>
                        <th className="py-2 px-3 text-center">UOM</th>
                        <th className="py-2 px-3 text-right">Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60">
                      {selectedPO.items && selectedPO.items.length > 0 ? (
                        selectedPO.items.map((it) => (
                          <tr key={it.id}>
                            <td className="py-2 px-3 font-mono text-cyan-400">{it.itemCode}</td>
                            <td className="py-2 px-3 font-semibold text-white">{it.description}</td>
                            <td className="py-2 px-3 text-right font-mono">{it.qty}</td>
                            <td className="py-2 px-3 text-right font-mono">${Number(it.cost || 0).toFixed(2)}</td>
                            <td className="py-2 px-3 text-center font-mono">{it.uom}</td>
                            <td className="py-2 px-3 text-right font-mono font-bold text-emerald-400">
                              ${Number(it.total || 0).toFixed(2)}
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan="6" className="py-4 text-center text-slate-500">
                            No product lines found.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            <div className="p-4 border-t border-slate-800 bg-slate-950 flex items-center justify-between">
              <div className="text-slate-400 text-xs">
                Outlet: <span className="text-white font-semibold">{selectedPO.outlet || 'Main Supermarket'}</span>
              </div>
              <button
                type="button"
                onClick={() => setDetailModalOpen(false)}
                className="px-4 py-1.5 rounded-xl bg-slate-800 text-xs text-white"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CHOOSE COLUMN MODAL */}
      {chooseColumnOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="relative w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <FilterIcon className="w-4 h-4 text-cyan-400" />
                <h3 className="text-sm font-bold text-white">
                  {lang === 'en' ? 'Choose Column' : 'ជ្រើសរើសជួរឈរ'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setChooseColumnOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-400">
              {lang === 'en'
                ? 'Choose column you want to display on table:'
                : 'ជ្រើសរើសជួរឈរដែលអ្នកចង់បង្ហាញនៅលើតារាង៖'}
            </p>

            <div className="grid grid-cols-2 gap-2 max-h-72 overflow-y-auto p-1">
              {ALL_COLUMNS.map((col) => (
                <label
                  key={col.key}
                  className="flex items-center gap-2 p-2 rounded-xl bg-slate-950 border border-slate-800 hover:border-slate-700 cursor-pointer text-xs transition-colors"
                >
                  <input
                    type="checkbox"
                    checked={visibleColumns.includes(col.key)}
                    onChange={() => toggleColumn(col.key)}
                    className="rounded border-slate-700 text-cyan-600 focus:ring-cyan-500 bg-slate-900"
                  />
                  <span className="text-slate-200">{col.label[lang] || col.label.en}</span>
                </label>
              ))}
            </div>

            <div className="pt-3 border-t border-slate-800 flex items-center justify-between">
              <button
                type="button"
                onClick={() => setVisibleColumns(ALL_COLUMNS.map((c) => c.key))}
                className="text-xs text-cyan-400 hover:underline"
              >
                Select All
              </button>
              <button
                type="button"
                onClick={() => setChooseColumnOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-cyan-600 hover:bg-cyan-500"
              >
                Apply
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
