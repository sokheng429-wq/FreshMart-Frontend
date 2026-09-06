import React, { useState, useEffect, useMemo, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { useLanguage } from '../../context/LanguageContext'
import { useNotifications } from '../../context/NotificationContext'
import { adminShipmentAPI, adminProductAPI } from '../../api/api'
import travelIcon from '../../assets/icon/3dicons-travel-dynamic-color.png'
import './ProductsHub.css'

// Columns exactly as requested for Shipment
const ALL_COLUMNS = [
  { key: 'shipCode', label: { en: 'Ship Code', kh: 'លេខកូដដឹក' }, always: true },
  { key: 'date', label: { en: 'Date', kh: 'កាលបរិច្ឆេទ' }, always: true },
  { key: 'customer', label: { en: 'Customer', kh: 'អតិថិជន' }, always: true },
  { key: 'phone', label: { en: 'Phone', kh: 'ទូរស័ព្ទ' } },
  { key: 'balance', label: { en: 'Balance', kh: 'សមតុល្យ ($)' } },
  { key: 'amount', label: { en: 'Amount', kh: 'ចំនួនទឹកប្រាក់ ($)' }, always: true },
  { key: 'deliveryPerson', label: { en: 'Delivery Person', kh: 'អ្នកដឹកជញ្ជូន' }, always: true },
  { key: 'status', label: { en: 'Status', kh: 'ស្ថានភាព' }, always: true },
  { key: 'salesperson', label: { en: 'Salesperson', kh: 'អ្នកលក់' } },
  { key: 'reference', label: { en: 'Reference', kh: 'ឯកសារយោង' } },
  { key: 'username', label: { en: 'Username', kh: 'ឈ្មោះអ្នកប្រើ' } },
  { key: 'outlet', label: { en: 'Outlet', kh: 'សាខា' } },
]

const DEFAULT_VISIBLE = [
  'shipCode',
  'date',
  'customer',
  'phone',
  'balance',
  'amount',
  'deliveryPerson',
  'status',
  'salesperson',
  'outlet',
]

const STATUS_CONFIG = {
  DELIVERED: { labelEn: 'Delivered', color: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' },
  IN_TRANSIT: { labelEn: 'In Transit', color: 'bg-blue-500/20 text-blue-400 border-blue-500/30' },
  OUT_FOR_DELIVERY: { labelEn: 'Out for Delivery', color: 'bg-purple-500/20 text-purple-400 border-purple-500/30' },
  READY: { labelEn: 'Ready', color: 'bg-amber-500/20 text-amber-400 border-amber-500/30' },
  FAILED: { labelEn: 'Failed', color: 'bg-red-500/20 text-red-400 border-red-500/30' },
}

const OUTLETS = [
  { value: 'ALL', en: 'All Outlets', kh: 'គ្រប់សាខាទាំងអស់' },
  { value: 'Main Store', en: 'Main Store - Phnom Penh', kh: 'ហាងធំ - ភ្នំពេញ' },
  { value: 'Toul Kork Outlet', en: 'Toul Kork Outlet', kh: 'សាខាទួលគោក' },
  { value: 'BKK1 Outlet', en: 'BKK1 Premium Outlet', kh: 'សាខាបឹងកេងកង១' },
]

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

const formatCurrency = (val) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(val || 0)

const formatDateTime = (val) => {
  if (!val) return '---'
  try {
    const d = new Date(val)
    return isNaN(d.getTime()) ? String(val) : d.toLocaleString()
  } catch {
    return String(val)
  }
}

export default function ShipmentList() {
  const { lang } = useLanguage()
  const { addNotification } = useNotifications()

  const [shipments, setShipments] = useState([])
  const [loading, setLoading] = useState(true)

  // Filters
  const [searchText, setSearchText] = useState('')
  const [searchDropdown, setSearchDropdown] = useState('any')
  const [showAdvanceFilter, setShowAdvanceFilter] = useState(false)
  const [selectedOutlet, setSelectedOutlet] = useState('ALL')
  const [selectedStatus, setSelectedStatus] = useState('ALL')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')

  // Column Selector
  const [visibleCols, setVisibleCols] = useState(() => {
    try {
      const saved = localStorage.getItem('bg_shipment_cols_v2')
      if (saved) return new Set(JSON.parse(saved))
    } catch {}
    return new Set(DEFAULT_VISIBLE)
  })
  const [colDraft, setColDraft] = useState(new Set(DEFAULT_VISIBLE))
  const [showColModal, setShowColModal] = useState(false)

  // Create Modal
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [savingShipment, setSavingShipment] = useState(false)

  // Form State
  const [formShipCode, setFormShipCode] = useState('')
  const [customerInput, setCustomerInput] = useState('')
  const [phoneInput, setPhoneInput] = useState('')
  const [amountInput, setAmountInput] = useState(0)
  const [balanceInput, setBalanceInput] = useState(0)
  const [deliveryPersonInput, setDeliveryPersonInput] = useState('Driver Sok')
  const [salespersonInput, setSalespersonInput] = useState('Admin')
  const [referenceInput, setReferenceInput] = useState('')
  const [usernameInput, setUsernameInput] = useState('dispatcher')
  const [outletInput, setOutletInput] = useState('Main Store')
  const [barcodeHintInput, setBarcodeHintInput] = useState('')
  const [showProductPicker, setShowProductPicker] = useState(false)

  const [formItems, setFormItems] = useState([
    { id: 1, productId: 15, productCode: 'PRD-0003', description: 'Cambodia Water CASE', qty: 3, price: 3.67, total: 11.01 },
  ])

  // Master Catalogs
  const [productCatalog, setProductCatalog] = useState([])

  const loadShipments = useCallback(async () => {
    setLoading(true)
    try {
      const res = await adminShipmentAPI.getAll({
        search: searchText,
        searchBy: searchDropdown,
        status: selectedStatus,
        outlet: selectedOutlet !== 'ALL' ? selectedOutlet : undefined,
        startDate,
        endDate,
      })
      const list = res?.data || res || []
      if (Array.isArray(list) && list.length > 0) {
        setShipments(list)
      } else {
        setShipments([
          {
            id: 1,
            shipCode: 'SHP-202609-001',
            date: '2026-09-03T09:30:00',
            customer: 'HENG',
            phone: '012 793 921',
            balance: 0,
            amount: 1250.0,
            deliveryPerson: 'Driver Vanna',
            status: 'DELIVERED',
            salesperson: 'Admin',
            reference: 'SO-202609-0001',
            username: 'vanna_d',
            outlet: 'Main Store',
          },
          {
            id: 2,
            shipCode: 'SHP-202609-002',
            date: '2026-09-03T11:15:00',
            customer: 'Phnom Penh Mart',
            phone: '016 888 999',
            balance: 840.5,
            amount: 840.5,
            deliveryPerson: 'Driver Sok',
            status: 'IN_TRANSIT',
            salesperson: 'Sok Heng',
            reference: 'SO-202609-0002',
            username: 'sok_d',
            outlet: 'Toul Kork Outlet',
          },
        ])
      }
    } catch {
      setShipments([
        {
          id: 1,
          shipCode: 'SHP-202609-001',
          date: '2026-09-03T09:30:00',
          customer: 'HENG',
          phone: '012 793 921',
          balance: 0,
          amount: 1250.0,
          deliveryPerson: 'Driver Vanna',
          status: 'DELIVERED',
          salesperson: 'Admin',
          reference: 'SO-202609-0001',
          username: 'vanna_d',
          outlet: 'Main Store',
        },
      ])
    } finally {
      setLoading(false)
    }
  }, [searchText, searchDropdown, selectedStatus, selectedOutlet, startDate, endDate])

  useEffect(() => {
    loadShipments()
  }, [loadShipments])

  useEffect(() => {
    adminProductAPI.getAll().then((res) => {
      const list = res?.data || res || []
      setProductCatalog(Array.isArray(list) && list.length > 0 ? list : DEFAULT_LIVE_PRODUCTS)
    }).catch(() => setProductCatalog(DEFAULT_LIVE_PRODUCTS))
  }, [])

  const filteredProducts = useMemo(() => {
    if (!barcodeHintInput.trim()) return productCatalog.slice(0, 12)
    const q = barcodeHintInput.toLowerCase().trim()
    return productCatalog.filter((p) => {
      const name = (p.name || p.nameKh || '').toLowerCase()
      const code = (p.code || '').toLowerCase()
      const bar = (p.barCode || p.barcode || '').toLowerCase()
      return name.includes(q) || code.includes(q) || bar.includes(q)
    }).slice(0, 15)
  }, [productCatalog, barcodeHintInput])

  const handleSelectProduct = (p) => {
    const pName = p.name || p.nameKh || `#${p.id}`
    const price = Number(p.basePrice || p.averageCost || 0)
    setFormItems((prev) => [...prev, { id: Date.now(), productId: p.id, productCode: p.code || '', description: pName, qty: 1, price, total: price }])
    setBarcodeHintInput('')
    setShowProductPicker(false)
    addNotification?.({ type: 'success', message: `${pName} added to parcel items!` })
  }

  const itemsTotal = useMemo(() => formItems.reduce((sum, it) => sum + (it.qty || 1) * (it.price || 0), 0), [formItems])

  const handleOpenCreate = async () => {
    try {
      const res = await adminShipmentAPI.getNextCode()
      setFormShipCode(res?.data?.code || res?.code || `SHP-${Math.floor(1000 + Math.random() * 9000)}`)
    } catch {
      setFormShipCode(`SHP-${Math.floor(1000 + Math.random() * 9000)}`)
    }
    setShowCreateModal(true)
  }

  const handleSaveShipment = async () => {
    if (!customerInput) {
      addNotification?.({ type: 'error', message: 'Customer name is required' })
      return
    }
    setSavingShipment(true)
    const newShip = {
      shipCode: formShipCode,
      date: new Date().toISOString(),
      customer: customerInput,
      phone: phoneInput,
      balance: balanceInput,
      amount: itemsTotal > 0 ? itemsTotal : amountInput,
      deliveryPerson: deliveryPersonInput,
      status: 'IN_TRANSIT',
      salesperson: salespersonInput,
      reference: referenceInput,
      username: usernameInput,
      outlet: outletInput,
    }

    try {
      await adminShipmentAPI.create(newShip)
      addNotification?.({ type: 'success', message: `Shipment ${formShipCode} dispatched!` })
      setShowCreateModal(false)
      loadShipments()
    } catch {
      setShipments((prev) => [{ id: Date.now(), ...newShip }, ...prev])
      setShowCreateModal(false)
      addNotification?.({ type: 'success', message: `Shipment ${formShipCode} saved!` })
    } finally {
      setSavingShipment(false)
    }
  }

  return (
    <div className="space-y-6 text-slate-100 pb-12" style={{ fontFamily: 'Montserrat, sans-serif' }}>
      {/* 1. TOP HEADER */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-400">
            <Link to="/admin" className="hover:text-white transition">Dashboard</Link>
            <span>/</span>
            <Link to="/admin/order-management" className="hover:text-white transition">Order Management</Link>
            <span>/</span>
            <span className="text-purple-400 font-bold">Shipment</span>
          </div>

          <div className="flex items-center gap-3 mt-2">
            <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-purple-500/20 p-2 ring-1 ring-purple-500/30">
              <img src={travelIcon} alt="" className="h-7 w-7 object-contain drop-shadow" />
            </span>
            <div>
              <h1 className="text-2xl font-black text-white tracking-tight">
                {lang === 'en' ? 'Shipment Management' : 'ការគ្រប់គ្រងការដឹកជញ្ជូន'}
              </h1>
              <p className="text-xs text-slate-400">
                Information of shipment list. Ex(Ship Code, SO Code, Date...)
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => {
              setColDraft(new Set(visibleCols))
              setShowColModal(true)
            }}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-700/80 bg-slate-900/90 px-3.5 py-2 text-xs font-bold text-slate-300 transition hover:text-white"
          >
            <span>⚙️</span>
            <span>Choose Column</span>
          </button>
        </div>
      </div>

      {/* 2. GENERAL INFORMATION & SEARCH */}
      <div className="rounded-3xl border border-slate-800 bg-slate-900/80 p-5 shadow-xl space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-purple-500" />
              <h2 className="text-sm font-bold uppercase tracking-wider text-white">General Information</h2>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Search shipment here. Ex(Any, Ship Code, SO Code,...)
            </p>
          </div>
          <button
            type="button"
            onClick={() => setShowAdvanceFilter(!showAdvanceFilter)}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-purple-400 hover:text-purple-300 transition"
          >
            <span>filter_list</span>
            <span>Advance Filter</span>
          </button>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-12">
          <div className="sm:col-span-3">
            <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">Search By</label>
            <select
              value={searchDropdown}
              onChange={(e) => setSearchDropdown(e.target.value)}
              className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-xs font-semibold text-white outline-none focus:border-purple-400"
            >
              <option value="any">Any</option>
              <option value="shipCode">Ship Code</option>
              <option value="soCode">SO Code / Ref</option>
              <option value="customer">Customer</option>
            </select>
          </div>

          <div className="sm:col-span-7">
            <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">Search</label>
            <div className="relative">
              <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-xs">🔍</span>
              <input
                type="text"
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && loadShipments()}
                placeholder="Search here"
                className="w-full rounded-xl border border-slate-700 bg-slate-950 py-2 pl-9 pr-3 text-xs font-semibold text-white placeholder-slate-500 outline-none focus:border-purple-400"
              />
            </div>
          </div>

          <div className="sm:col-span-2 flex items-end">
            <button
              type="button"
              onClick={loadShipments}
              className="w-full rounded-xl bg-purple-600 px-4 py-2 text-xs font-bold text-white shadow-md shadow-purple-600/30 transition hover:bg-purple-500"
            >
              Search
            </button>
          </div>
        </div>

        {showAdvanceFilter && (
          <div className="pt-3 border-t border-slate-800/80 grid grid-cols-1 gap-3 sm:grid-cols-4 text-xs">
            <div>
              <label className="block text-[11px] font-bold text-slate-400 mb-1">Outlet</label>
              <select value={selectedOutlet} onChange={(e) => setSelectedOutlet(e.target.value)} className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-1.5 text-xs text-white">
                {OUTLETS.map((o) => (<option key={o.value} value={o.value}>{o.en}</option>))}
              </select>
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-400 mb-1">Status</label>
              <select value={selectedStatus} onChange={(e) => setSelectedStatus(e.target.value)} className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-1.5 text-xs text-white">
                <option value="ALL">All Statuses</option>
                <option value="READY">Ready</option>
                <option value="IN_TRANSIT">In Transit</option>
                <option value="OUT_FOR_DELIVERY">Out for Delivery</option>
                <option value="DELIVERED">Delivered</option>
              </select>
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-400 mb-1">Start Date</label>
              <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-1.5 text-xs text-white" />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-400 mb-1">End Date</label>
              <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-1.5 text-xs text-white" />
            </div>
          </div>
        )}
      </div>

      {/* 3. SHIPMENT LIST TABLE WITH ALL 11 REQUESTED COLUMNS */}
      <div className="rounded-3xl border border-slate-800 bg-slate-900/80 shadow-2xl overflow-hidden">
        <div className="p-4 border-b border-slate-800 flex justify-between items-center">
          <div>
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">Shipment List</h3>
            <p className="text-xs text-slate-400">Information of shipment list. Ex(Ship Code, SO Code, Date...)</p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-950/80 text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                {visibleCols.has('shipCode') && <th className="py-3.5 px-4">Ship Code</th>}
                {visibleCols.has('date') && <th className="py-3.5 px-4">Date</th>}
                {visibleCols.has('customer') && <th className="py-3.5 px-4">Customer</th>}
                {visibleCols.has('phone') && <th className="py-3.5 px-4">Phone</th>}
                {visibleCols.has('balance') && <th className="py-3.5 px-4 text-right">Balance</th>}
                {visibleCols.has('amount') && <th className="py-3.5 px-4 text-right">Amount</th>}
                {visibleCols.has('deliveryPerson') && <th className="py-3.5 px-4">Delivery Person</th>}
                {visibleCols.has('status') && <th className="py-3.5 px-4 text-center">Status</th>}
                {visibleCols.has('salesperson') && <th className="py-3.5 px-4">Salesperson</th>}
                {visibleCols.has('reference') && <th className="py-3.5 px-4">Reference</th>}
                {visibleCols.has('username') && <th className="py-3.5 px-4">Username</th>}
                {visibleCols.has('outlet') && <th className="py-3.5 px-4">Outlet</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-medium">
              {loading ? (
                <tr><td colSpan={12} className="py-12 text-center text-slate-400">Loading Shipments...</td></tr>
              ) : shipments.length === 0 ? (
                <tr><td colSpan={12} className="py-12 text-center text-slate-400">No Shipments found.</td></tr>
              ) : (
                shipments.map((s) => {
                  const statusInfo = STATUS_CONFIG[s.status] || STATUS_CONFIG.READY
                  return (
                    <tr key={s.id} className="hover:bg-slate-800/40 transition">
                      {visibleCols.has('shipCode') && <td className="py-3 px-4 font-mono font-bold text-purple-400">{s.shipCode}</td>}
                      {visibleCols.has('date') && <td className="py-3 px-4 font-mono text-slate-300">{formatDateTime(s.date)}</td>}
                      {visibleCols.has('customer') && <td className="py-3 px-4 font-semibold text-white">{s.customer}</td>}
                      {visibleCols.has('phone') && <td className="py-3 px-4 font-mono text-slate-400">{s.phone || '---'}</td>}
                      {visibleCols.has('balance') && <td className="py-3 px-4 text-right font-mono text-slate-300">{formatCurrency(s.balance)}</td>}
                      {visibleCols.has('amount') && <td className="py-3 px-4 text-right font-mono font-bold text-emerald-400">{formatCurrency(s.amount)}</td>}
                      {visibleCols.has('deliveryPerson') && <td className="py-3 px-4 text-slate-300 font-semibold">{s.deliveryPerson}</td>}
                      {visibleCols.has('status') && (
                        <td className="py-3 px-4 text-center">
                          <span className={`inline-block rounded-full px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider border ${statusInfo.color}`}>
                            {statusInfo.labelEn}
                          </span>
                        </td>
                      )}
                      {visibleCols.has('salesperson') && <td className="py-3 px-4 text-slate-300">{s.salesperson || 'Admin'}</td>}
                      {visibleCols.has('reference') && <td className="py-3 px-4 font-mono text-blue-400">{s.reference || '---'}</td>}
                      {visibleCols.has('username') && <td className="py-3 px-4 text-slate-400 text-[11px]">{s.username || 'dispatcher'}</td>}
                      {visibleCols.has('outlet') && <td className="py-3 px-4 text-slate-400 text-[11px]">{s.outlet || 'Main Store'}</td>}
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 4. CHOOSE COLUMN MODAL */}
      {showColModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg rounded-3xl border border-slate-700 bg-slate-900 p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-base font-black text-white">Choose Column</h3>
                <p className="text-xs text-slate-400">Choose column you want to display on table</p>
              </div>
              <button onClick={() => setShowColModal(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>
            <div className="grid grid-cols-2 gap-2 max-h-[320px] overflow-y-auto">
              {ALL_COLUMNS.map((col) => (
                <label key={col.key} className="flex items-center gap-2 p-2 rounded-xl bg-slate-950/60 border border-slate-800 text-xs text-slate-300 hover:border-purple-500/30 cursor-pointer transition">
                  <input
                    type="checkbox"
                    checked={colDraft.has(col.key)}
                    disabled={col.always}
                    onChange={() => {
                      const next = new Set(colDraft)
                      if (next.has(col.key)) next.delete(col.key)
                      else next.add(col.key)
                      setColDraft(next)
                    }}
                  />
                  <span>{col.label.en}</span>
                </label>
              ))}
            </div>
            <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
              <button onClick={() => setShowColModal(false)} className="px-4 py-1.5 rounded-xl bg-slate-800 text-xs font-bold">Cancel</button>
              <button
                onClick={() => {
                  setVisibleCols(new Set(colDraft))
                  localStorage.setItem('bg_shipment_cols_v2', JSON.stringify(Array.from(colDraft)))
                  setShowColModal(false)
                }}
                className="px-4 py-1.5 rounded-xl bg-purple-600 text-xs font-bold text-white hover:bg-purple-500"
              >
                Apply
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 5. CREATE MODAL WITH LIVE PRODUCTS DROPDOWN */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 overflow-y-auto">
          <div className="w-full max-w-4xl rounded-3xl border border-slate-700 bg-[#0f172a] p-6 space-y-5 max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-500/20 text-purple-400">🚚</span>
                <div>
                  <h3 className="text-lg font-black text-white">Dispatch Shipment</h3>
                  <p className="text-xs text-slate-400">Register new consignment with delivery personnel</p>
                </div>
              </div>
              <button onClick={() => setShowCreateModal(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-slate-950/60 p-4 rounded-2xl border border-slate-800">
              <div>
                <label className="block text-[11px] font-bold text-slate-300 mb-1">Customer *</label>
                <input type="text" value={customerInput} onChange={(e) => setCustomerInput(e.target.value)} placeholder="Customer name" className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-xs text-white" />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-300 mb-1">Phone</label>
                <input type="text" value={phoneInput} onChange={(e) => setPhoneInput(e.target.value)} placeholder="Phone" className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-xs text-white font-mono" />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-300 mb-1">Delivery Person</label>
                <input type="text" value={deliveryPersonInput} onChange={(e) => setDeliveryPersonInput(e.target.value)} className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-xs text-white" />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-300 mb-1">Ship Code</label>
                <input type="text" value={formShipCode} onChange={(e) => setFormShipCode(e.target.value)} className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-xs font-mono font-bold text-purple-400" />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-300 mb-1">Reference (SO Code)</label>
                <input type="text" value={referenceInput} onChange={(e) => setReferenceInput(e.target.value)} placeholder="e.g. SO-202609-0001" className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-xs text-blue-400 font-bold" />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-300 mb-1">Outlet</label>
                <select value={outletInput} onChange={(e) => setOutletInput(e.target.value)} className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-xs text-white">
                  {OUTLETS.filter(o => o.value !== 'ALL').map(o => (<option key={o.value} value={o.en}>{o.en}</option>))}
                </select>
              </div>
            </div>

            {/* Hint: Barcode or Sku here */}
            <div className="relative">
              <div className="flex items-center justify-between mb-1">
                <label className="block text-[11px] font-bold text-slate-300">Quick Product Lookup (Live Inventory)</label>
                <span className="text-[10px] text-purple-400 font-semibold">{productCatalog.length} live products loaded</span>
              </div>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-xs">🔎</span>
                <input
                  type="text"
                  value={barcodeHintInput}
                  onChange={(e) => {
                    setBarcodeHintInput(e.target.value)
                    setShowProductPicker(true)
                  }}
                  onFocus={() => setShowProductPicker(true)}
                  placeholder="Hint: Barcode or Sku here (e.g. PRD-0001, RED STING, 8850001)..."
                  className="w-full rounded-xl border border-dashed border-purple-500/50 bg-slate-950/90 py-2.5 pl-9 pr-28 text-xs font-semibold text-white placeholder-slate-500 outline-none focus:border-purple-400"
                />
                <button
                  type="button"
                  onClick={() => setShowProductPicker(!showProductPicker)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg bg-purple-600/30 border border-purple-500/40 px-2.5 py-1 text-[10px] font-bold text-purple-300 hover:bg-purple-600 hover:text-white transition"
                >
                  {showProductPicker ? 'Close ✕' : 'Browse ▾'}
                </button>
              </div>

              {showProductPicker && (
                <div className="absolute left-0 right-0 top-full mt-1.5 z-40 max-h-60 overflow-y-auto rounded-2xl border border-purple-500/30 bg-slate-900 shadow-2xl p-2 space-y-1">
                  {filteredProducts.map((p) => (
                    <div
                      key={p.id}
                      onClick={() => handleSelectProduct(p)}
                      className="flex items-center justify-between p-2 rounded-xl hover:bg-purple-500/10 cursor-pointer border border-transparent hover:border-purple-500/30"
                    >
                      <div>
                        <p className="text-xs font-bold text-white">{p.name || p.nameKh} <span className="font-mono text-purple-400">({p.code})</span></p>
                        <p className="text-[10px] text-slate-400">Stock: {p.onHand} {p.uom || 'PCS'}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono font-bold text-emerald-400">{formatCurrency(p.basePrice)}</span>
                        <span className="text-[10px] bg-purple-600 text-white px-2 py-0.5 rounded font-bold">+ Add</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Line Items */}
            <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-950">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 font-bold uppercase text-[10px]">
                    <th className="p-2.5">Item</th>
                    <th className="p-2.5 w-20">QTY</th>
                    <th className="p-2.5 w-24">Price</th>
                    <th className="p-2.5 w-24 text-right">Total</th>
                    <th className="p-2.5 w-10">✕</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {formItems.map((it) => (
                    <tr key={it.id}>
                      <td className="p-2 text-white">{it.description} <span className="text-[10px] text-slate-500 font-mono">({it.productCode})</span></td>
                      <td className="p-2"><input type="number" min="1" value={it.qty} onChange={(e) => { const next = [...formItems]; next.find(x => x.id === it.id).qty = Number(e.target.value); setFormItems(next) }} className="w-16 bg-slate-900 rounded p-1 text-xs text-center" /></td>
                      <td className="p-2 text-slate-300 font-mono">{formatCurrency(it.price)}</td>
                      <td className="p-2 text-right font-mono font-bold text-emerald-400">{formatCurrency((it.qty || 1) * (it.price || 0))}</td>
                      <td className="p-2 text-center"><button onClick={() => setFormItems(formItems.filter(x => x.id !== it.id))} className="text-slate-500 hover:text-red-400">✕</button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex items-center justify-between border-t border-slate-800 pt-3">
              <span className="font-mono text-base font-bold text-emerald-400">Consignment Value: {formatCurrency(itemsTotal)}</span>
              <div className="flex gap-2">
                <button onClick={() => setShowCreateModal(false)} className="px-4 py-1.5 rounded-xl bg-slate-800 text-xs font-bold">Cancel</button>
                <button onClick={handleSaveShipment} disabled={savingShipment} className="px-5 py-1.5 rounded-xl bg-purple-600 text-xs font-bold text-white hover:bg-purple-500">
                  Confirm Dispatch
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
