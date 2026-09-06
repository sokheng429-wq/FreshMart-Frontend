import { useState, useMemo, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useLanguage } from '../../context/LanguageContext'
import { adminProductAPI, adminSupplierAPI } from '../../api/api'
import bagIcon from '../../assets/icon/3dicons-bag-dynamic-color.png'
import folderIcon from '../../assets/icon/3dicons-folder-dynamic-color.png'
import bookmarkIcon from '../../assets/icon/3dicons-bookmark-fav-dynamic-color.png'
import crownIcon from '../../assets/icon/3dicons-crown-dynamic-color.png'
import cubeIcon from '../../assets/icon/3dicons-cube-dynamic-color.png'
import paletteIcon from '../../assets/icon/3dicons-color-palette-dynamic-color.png'
import moneyBagIcon from '../../assets/icon/3dicons-money-bag-dynamic-color.png'
import folderFavIcon from '../../assets/icon/3dicons-folder-fav-dynamic-color.png'
import fileNewIcon from '../../assets/icon/3dicons-file-new-dynamic-color.png'
import callOutIcon from '../../assets/icon/3dicons-call-out-dynamic-color.png'
import toolsIcon from '../../assets/icon/3dicons-tools-dynamic-color.png'
import mailIcon from '../../assets/icon/3dicons-mail-dynamic-color.png'
import rocketIcon from '../../assets/icon/3dicons-rocket-dynamic-color.png'
import travelIcon from '../../assets/icon/3dicons-travel-dynamic-color.png'
import chartIcon from '../../assets/icon/3dicons-chart-dynamic-color.png'
import dollarIcon from '../../assets/icon/3dicons-dollar-dynamic-color.png'
import copyIcon from '../../assets/icon/3dicons-copy-dynamic-color.png'
import calculatorIcon from '../../assets/icon/3dicons-calculator-dynamic-color.png'
import toggleIcon from '../../assets/icon/3dicons-toggle-dynamic-color.png'
import walletIcon from '../../assets/icon/3dicons-wallet-dynamic-color.png'
import hashIcon from '../../assets/icon/3dicons-hash-dynamic-color.png'
import linkIcon from '../../assets/icon/3dicons-link-dynamic-color.png'
import './ProductsHub.css'

// The catalog sub-sections (Master Data)
export const PRODUCT_SECTIONS = [
  {
    key: 'manage',
    icon: bagIcon,
    en: 'Products',
    kh: 'ផលិតផល',
    descEn: 'Create, edit and delete products in the shop catalog.',
    descKh: 'បង្កើត កែប្រែ និងលុបផលិតផលក្នុងកាតាឡុកហាង។',
    color: '#22c55e',
    bg: 'rgba(34, 197, 94, 0.12)',
    category: 'master',
    tag: 'Core',
  },
  {
    key: 'groups',
    icon: folderIcon,
    en: 'Product Groups',
    kh: 'ក្រុមផលិតផល',
    descEn: 'Group related products together for pricing and filtering.',
    descKh: 'បង្កុំប្រជុំផលិតផលដែលទាក់ទងគ្នា សម្រាប់តម្លៃ និងការច្រោក។',
    color: '#14b8a6',
    bg: 'rgba(20, 184, 166, 0.12)',
    category: 'master',
  },
  {
    key: 'categories',
    icon: bookmarkIcon,
    en: 'Category',
    kh: 'ប្រភេទ',
    descEn: 'Manage the product categories shown across the shop.',
    descKh: 'គ្រប់គ្រងប្រភេទផលិតផលដែលបង្ហាញក្នុងហាងទាំងមូល។',
    color: '#f59e0b',
    bg: 'rgba(245, 158, 11, 0.12)',
    category: 'master',
  },
  {
    key: 'brands',
    icon: crownIcon,
    en: 'Brands',
    kh: 'ម៉ាក',
    descEn: 'Register the brands carried by B\'Groceries.',
    descKh: 'ចុះឈ្មោះម៉ាកទំនិញដែល B\'Groceries លក់។',
    color: '#8b5cf6',
    bg: 'rgba(139, 92, 246, 0.12)',
    category: 'master',
  },
  {
    key: 'units',
    icon: cubeIcon,
    en: 'Unit of Measure',
    kh: 'ឯកតាវាស់',
    descEn: 'Define units such as kg, g, L, ml and piece.',
    descKh: 'កំណត់ឯកតាដូចជា គីឡូ ក្រាម លីត្រ មីលីលីត្រ និងដុំ។',
    color: '#06b6d4',
    bg: 'rgba(6, 182, 212, 0.12)',
    category: 'master',
  },
  {
    key: 'attributes',
    icon: paletteIcon,
    en: 'Attribute',
    kh: 'លក្ខណៈសម្បត្តិ',
    descEn: 'Extra specs like origin, organic label or storage temp.',
    descKh: 'ព័ត៌មានបន្ថែមដូចជា ប្រភព ស្លាកសញ្ញា ឬសីតុណ្ហភាពរក្សាទុក។',
    color: '#ec4899',
    bg: 'rgba(236, 72, 153, 0.12)',
    category: 'master',
  },
  {
    key: 'suppliers',
    icon: moneyBagIcon,
    en: 'Suppliers',
    kh: 'អ្នកផ្គត់ផ្គង់',
    descEn: 'Contact details for farms, producers and wholesalers.',
    descKh: 'ព័ត៌មានទំនាក់ទំនងរបស់កសិដ្ឋាន អ្នកផលិត និងពាណិជ្ជករធំៗ។',
    color: '#f97316',
    bg: 'rgba(249, 115, 22, 0.12)',
    category: 'master',
  },
  {
    key: 'supplier-groups',
    icon: folderFavIcon,
    en: 'Suppliers Group',
    kh: 'ក្រុមអ្នកផ្គត់ផ្គង់',
    descEn: 'Organize suppliers into regional or category groups.',
    descKh: 'រៀបចំអ្នកផ្គត់ផ្គង់ជាក្រុមតាមតំបន់ ឬប្រភេទ។',
    color: '#3b82f6',
    bg: 'rgba(59, 130, 246, 0.12)',
    category: 'master',
  },
]

// Stock Operations & Tools
export const STOCK_OPERATIONS = [
  {
    key: 'receive-products',
    icon: fileNewIcon,
    en: 'Receive Products',
    kh: 'ទទួលផលិតផល (GRN)',
    descEn: 'Record incoming stock deliveries from suppliers.',
    descKh: 'កត់ត្រាការដឹកជញ្ជូនទំនិញចូលពីអ្នកផ្គត់ផ្គង់។',
    color: '#22c55e',
    bg: 'rgba(34, 197, 94, 0.12)',
    category: 'ops',
    tag: 'Popular',
  },
  {
    key: 'issue-products',
    icon: callOutIcon,
    en: 'Issue Products',
    kh: 'បញ្ចេញផលិតផល',
    descEn: 'Issue stock out of the warehouse for orders or usage.',
    descKh: 'បញ្ចេញទំនិញចេញពីឃ្លាំងសម្រាប់ការបញ្ជាទិញ ឬការប្រើប្រាស់។',
    color: '#f97316',
    bg: 'rgba(249, 115, 22, 0.12)',
    category: 'ops',
  },
  {
    key: 'adjustment-products',
    icon: toolsIcon,
    en: 'Adjustment Products',
    kh: 'កែតម្លៃផលិតផល',
    descEn: 'Correct stock counts after audits or damages.',
    descKh: 'កែសម្រួលចំនួនស្តុកបន្ទាប់ពីត្រួតពិនិត្យ ឬបាតបង់។',
    color: '#eab308',
    bg: 'rgba(234, 179, 8, 0.12)',
    category: 'ops',
  },
  {
    key: 'request-transfer',
    icon: mailIcon,
    en: 'Request Transfer Products',
    kh: 'សំណើបញ្ជូនផលិតផល',
    descEn: 'Ask another branch or warehouse to send stock.',
    descKh: 'ស្នើសុំសាខា ឬឃ្លាំងផ្សេងទៀតឱ្យបញ្ជូនទំនិញ។',
    color: '#06b6d4',
    bg: 'rgba(6, 182, 212, 0.12)',
    category: 'ops',
  },
  {
    key: 'ship-request-transfer',
    icon: rocketIcon,
    en: 'Ship & Request Transfer',
    kh: 'ដឹកជញ្ជូន និងសំណើបញ្ជូន',
    descEn: 'Ship requested transfers and track them in transit.',
    descKh: 'ដឹកជញ្ជូនសំណើបញ្ជូន ហើយតាមដានវាពេលកំពុងផ្ញើ។',
    color: '#8b5cf6',
    bg: 'rgba(139, 92, 246, 0.12)',
    category: 'ops',
  },
  {
    key: 'transfer-products',
    icon: travelIcon,
    en: 'Transfer Products',
    kh: 'បញ្ជូនផលិតផល',
    descEn: 'Move products between warehouses and stores.',
    descKh: 'ផ្លាស់ទីផលិតផលរវាងឃ្លាំង និងហាង។',
    color: '#14b8a6',
    bg: 'rgba(20, 184, 166, 0.12)',
    category: 'ops',
  },
  {
    key: 'products-quantities',
    icon: chartIcon,
    en: 'Products Quantities',
    kh: 'បរិមាណផលិតផល',
    descEn: 'See and set on-hand quantities per location.',
    descKh: 'មើល និងកំណត់ចំនួនស្តុកតាមទីតាំងនីមួយៗ។',
    color: '#3b82f6',
    bg: 'rgba(59, 130, 246, 0.12)',
    category: 'ops',
  },
  {
    key: 'products-prices',
    icon: dollarIcon,
    en: 'Products Prices',
    kh: 'តម្លៃផលិតផល',
    descEn: 'Manage cost and selling prices per product.',
    descKh: 'គ្រប់គ្រងតម្លៃចំណាយ និងតម្លៃលក់តាមផលិតផលនីមួយៗ។',
    color: '#f59e0b',
    bg: 'rgba(245, 158, 11, 0.12)',
    category: 'ops',
  },
  {
    key: 'print-label',
    icon: copyIcon,
    en: 'Print Label',
    kh: 'បោះពុម្ពស្លាក',
    descEn: 'Print barcode and price labels for shelf items.',
    descKh: 'បោះពុម្ពស្លាកបារកូដ និងតម្លៃសម្រាប់ទំនិញលើធ្នើ។',
    color: '#64748b',
    bg: 'rgba(100, 116, 139, 0.15)',
    category: 'ops',
  },
  {
    key: 'products-scale',
    icon: calculatorIcon,
    en: 'Products Scale',
    kh: 'ទំនឹងផលិតផល (PLU)',
    descEn: 'Configure scale-linked weighed goods.',
    descKh: 'កំណត់ទំនិញដែលជាប់តាមទំនឹង។',
    color: '#84cc16',
    bg: 'rgba(132, 204, 22, 0.12)',
    category: 'ops',
    tag: 'Scale',
  },
  {
    key: 'change-attribute',
    icon: toggleIcon,
    en: 'Change Attribute',
    kh: 'ផ្លាស់ប្តូរលក្ខណៈសម្បត្តិ',
    descEn: 'Bulk-edit product attribute values.',
    descKh: 'កែតម្លៃលក្ខណៈសម្បត្តិផលិតផលជាក្រុម។',
    color: '#ec4899',
    bg: 'rgba(236, 72, 153, 0.12)',
    category: 'ops',
  },
  {
    key: 'cost-change',
    icon: walletIcon,
    en: 'Cost Change',
    kh: 'ផ្លាស់ប្តូរចំណាយ (Cost Change)',
    descEn: 'Review and apply supplier cost changes with printable note.',
    descKh: 'ពិនិត្យ និងអនុវត្តការផ្លាស់ប្តូរតម្លៃចំណាយពីអ្នកផ្គត់ផ្គង់។',
    color: '#ef4444',
    bg: 'rgba(239, 68, 68, 0.12)',
    category: 'ops',
    tag: 'Printable',
  },
  {
    key: 'serial-information',
    icon: hashIcon,
    en: 'Serial Information',
    kh: 'ព័ត៌មានស៊េរី (Serial)',
    descEn: 'Track serialized items by serial number and batch.',
    descKh: 'តាមដានទំនិញលេខស៊េរីតាមលេខស៊េរីនីមួយៗ។',
    color: '#a855f7',
    bg: 'rgba(168, 85, 247, 0.12)',
    category: 'ops',
  },
  {
    key: 'products-supplier',
    icon: linkIcon,
    en: 'Products Supplier',
    kh: 'អ្នកផ្គត់ផ្គង់ផលិតផល',
    descEn: 'Link products to the suppliers with part numbers & active toggles.',
    descKh: 'ភ្ជាប់ផលិតផលទៅអ្នកផ្គត់ផ្គង់ដែលផ្ដល់វា។',
    color: '#0ea5e9',
    bg: 'rgba(14, 165, 233, 0.12)',
    category: 'ops',
    tag: 'New',
  },
]

export const ALL_CATALOG_SECTIONS = [...PRODUCT_SECTIONS, ...STOCK_OPERATIONS]

export const ProductsHub = () => {
  const { lang } = useLanguage()
  const [searchQuery, setSearchQuery] = useState('')
  const [activeCategory, setActiveCategory] = useState('all') // 'all' | 'master' | 'ops'
  const [stats, setStats] = useState({ totalProducts: 0, totalSuppliers: 0, loading: true })

  // Load live counts for dynamic KPI
  useEffect(() => {
    Promise.all([
      adminProductAPI.getAll().catch(() => ({ data: [] })),
      adminSupplierAPI.getAll().catch(() => ({ data: [] })),
    ]).then(([pRes, sRes]) => {
      const pCount = Array.isArray(pRes?.data) ? pRes.data.length : 0
      const sCount = Array.isArray(sRes?.data) ? sRes.data.length : 0
      setStats({ totalProducts: pCount, totalSuppliers: sCount, loading: false })
    })
  }, [])

  // Filter modules based on search and active tab
  const filteredSections = useMemo(() => {
    const q = searchQuery.trim().toLowerCase()
    let list = ALL_CATALOG_SECTIONS

    if (activeCategory === 'master') {
      list = PRODUCT_SECTIONS
    } else if (activeCategory === 'ops') {
      list = STOCK_OPERATIONS
    }

    if (!q) return list

    return list.filter((s) => {
      const en = (s.en || '').toLowerCase()
      const kh = (s.kh || '').toLowerCase()
      const descEn = (s.descEn || '').toLowerCase()
      const descKh = (s.descKh || '').toLowerCase()
      const key = (s.key || '').toLowerCase()
      return en.includes(q) || kh.includes(q) || descEn.includes(q) || descKh.includes(q) || key.includes(q)
    })
  }, [searchQuery, activeCategory])

  const masterFiltered = useMemo(
    () => filteredSections.filter((s) => s.category === 'master'),
    [filteredSections]
  )

  const opsFiltered = useMemo(
    () => filteredSections.filter((s) => s.category === 'ops'),
    [filteredSections]
  )

  return (
    <div className="space-y-6 text-slate-100">
      {/* 1. HERO BANNER WITH DYNAMIC GLOW & LIVE KPIS */}
      <section className="relative overflow-hidden rounded-3xl border border-green-500/20 bg-gradient-to-br from-[#1e293b] via-[#0f172a] to-[#0b0f17] p-5 sm:p-7 shadow-2xl shadow-green-500/10">
        <div className="pointer-events-none absolute -right-16 -top-20 h-64 w-64 rounded-full bg-[#7EB631]/15 blur-3xl" />
        <div className="pointer-events-none absolute bottom-0 left-1/4 h-px w-2/3 bg-gradient-to-r from-transparent via-[#7EB631]/40 to-transparent" />

        <div className="relative flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-4">
            <Link
              to="/admin"
              className="inline-flex items-center gap-2 rounded-full border border-slate-700/80 bg-slate-950/60 px-3.5 py-1.5 text-xs font-bold uppercase tracking-[0.18em] text-green-300 transition hover:border-[#7EB631] hover:text-white active:scale-95"
            >
              <ChevronLeftIcon /> {lang === 'en' ? 'Dashboard' : 'ផ្ទាំងគ្រប់គ្រង'}
            </Link>

            <div className="flex items-center gap-3.5">
              <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-[#7EB631]/15 p-2 ring-1 ring-[#7EB631]/30 shadow-lg shadow-green-500/20">
                <img src={bagIcon} alt="" className="h-9 w-9 object-contain drop-shadow-md" />
              </span>
              <div>
                <p className="text-[11px] font-black uppercase tracking-[0.25em] text-[#7EB631]">
                  {lang === 'en' ? "FreshMart Stocks Hub" : 'មជ្ឈមណ្ឌលគ្រប់គ្រងស្តុក'}
                </p>
                <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white font-['Montserrat']">
                  {lang === 'en' ? 'Stocks & Inventory Hub' : 'មជ្ឈមណ្ឌលស្តុក និងទំនិញ'}
                </h1>
              </div>
            </div>

            <p className="max-w-2xl text-xs sm:text-sm leading-relaxed text-slate-300 font-['Montserrat']">
              {lang === 'en'
                ? 'Central command for your supermarket inventory — master catalog, suppliers, barcode scales, transfers, goods receipt, and cost modifications.'
                : 'មជ្ឈមណ្ឌលបញ្ជាកណ្តាលសម្រាប់ស្តុកទំនិញផ្សារទំនើប — កាតាឡុកមេ អ្នកផ្គត់ផ្គង់ ជញ្ជីងបារកូដ ការផ្ទេរទំនិញ ការទទួលទំនិញ និងការកែប្រែចំណាយ។'}
            </p>
          </div>

          {/* Quick Stats Widget */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-2 lg:flex lg:flex-col shrink-0 min-w-[220px]">
            <div className="rounded-2xl border border-slate-800 bg-slate-950/80 p-3.5 shadow-md">
              <div className="flex items-center justify-between text-[11px] text-slate-400">
                <span>{lang === 'en' ? 'Live SKUs' : 'មុខទំនិញសកម្ម'}</span>
                <span className="text-emerald-400">● Live</span>
              </div>
              <p className="mt-1 font-mono text-2xl font-black text-white">
                {stats.loading ? '…' : stats.totalProducts}
              </p>
            </div>

            <div className="rounded-2xl border border-slate-800 bg-slate-950/80 p-3.5 shadow-md">
              <div className="flex items-center justify-between text-[11px] text-slate-400">
                <span>{lang === 'en' ? 'Suppliers' : 'អ្នកផ្គត់ផ្គង់'}</span>
                <span className="text-blue-400">● Master</span>
              </div>
              <p className="mt-1 font-mono text-2xl font-black text-white">
                {stats.loading ? '…' : stats.totalSuppliers}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 2. DYNAMIC SEARCH & CATEGORY FILTER BAR */}
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
                ? 'Quick search any module (e.g. Scale, Cost Change, Supplier, Receive…)'
                : 'ស្វែងរកម៉ូឌុលរហ័ស (ឧ. ជញ្ជីង, ចំណាយ, អ្នកផ្គត់ផ្គង់…)'
            }
            className="w-full rounded-xl border border-slate-700/80 bg-slate-950/90 py-2 pl-9 pr-8 text-xs font-semibold text-white placeholder-slate-500 outline-none transition focus:border-[#7EB631] focus:ring-2 focus:ring-[#7EB631]/20"
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
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          {[
            { key: 'all', en: 'All Modules', kh: 'ទាំងអស់', count: ALL_CATALOG_SECTIONS.length },
            { key: 'master', en: 'Master Data', kh: 'ទិន្នន័យគោល', count: PRODUCT_SECTIONS.length },
            { key: 'ops', en: 'Stock Operations', kh: 'ប្រតិបត្តិការ', count: STOCK_OPERATIONS.length },
          ].map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveCategory(tab.key)}
              className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold transition whitespace-nowrap active:scale-95 ${
                activeCategory === tab.key
                  ? 'bg-[#7EB631] text-slate-950 shadow-md shadow-green-600/20'
                  : 'bg-slate-900/80 text-slate-400 border border-slate-700/60 hover:text-white hover:border-slate-500'
              }`}
            >
              <span>{lang === 'kh' ? tab.kh : tab.en}</span>
              <span
                className={`rounded-full px-1.5 py-0.2 text-[10px] font-mono ${
                  activeCategory === tab.key ? 'bg-slate-950 text-green-300' : 'bg-slate-800 text-slate-400'
                }`}
              >
                {tab.count}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* 3. FEATURED OVERVIEW: ALL PRODUCTS HERO CARD */}
      {(!searchQuery || 'all products'.includes(searchQuery.toLowerCase())) && (
        <Link
          to="/admin/products/all"
          className="group relative overflow-hidden flex flex-col gap-3 rounded-2xl border border-green-500/40 bg-gradient-to-r from-green-500/15 via-emerald-500/10 to-slate-900/60 p-4 sm:p-5 transition-all duration-300 hover:-translate-y-1 hover:border-green-400 hover:shadow-xl hover:shadow-green-500/10 sm:flex-row sm:items-center sm:justify-between"
        >
          <div className="flex items-center gap-3.5">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-green-500/20 text-2xl ring-1 ring-green-400/40 shadow-md">
              📋
            </span>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-black text-white font-['Montserrat']">
                  {lang === 'en' ? 'All Products Master List' : 'បញ្ជីផលិតផលទាំងអស់'}
                </h3>
                <span className="rounded-full bg-[#7EB631] px-2 py-0.5 text-[10px] font-black text-slate-950 uppercase tracking-wider">
                  Full Catalog
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5 max-w-xl">
                {lang === 'en'
                  ? 'Complete table of every SKU with category filters, bulk pricing, Excel import/export, and instant search.'
                  : 'តារាងពេញលេញនៃគ្រប់មុខទំនិញ ជាមួយការត្រងប្រភេទ តម្លៃដុំ ការនាំចេញ/នាំចូល Excel និងការស្វែងរកភ្លាមៗ។'}
              </p>
            </div>
          </div>

          <span className="inline-flex items-center gap-1.5 self-start sm:self-center text-xs font-bold text-green-300 transition-transform group-hover:translate-x-1 shrink-0">
            <span>{lang === 'en' ? 'Open Catalog' : 'បើកកាតាឡុក'}</span>
            <ChevronIcon />
          </span>
        </Link>
      )}

      {/* 4. MASTER DATA SECTION */}
      {masterFiltered.length > 0 && (
        <section className="rounded-3xl border border-slate-800 bg-slate-900/80 p-5 sm:p-6 shadow-xl shadow-black/20 space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800/80">
            <div className="flex items-center gap-3">
              <div className="h-5 w-1.5 rounded-full bg-[#7EB631]" />
              <div>
                <h2 className="text-base font-bold text-white font-['Montserrat']">
                  {lang === 'en' ? 'Catalog Master Data' : 'ទិន្នន័យគោលកាតាឡុក'}
                </h2>
                <p className="text-[11px] text-slate-400">
                  {lang === 'en' ? 'Manage products, groups, categories, units & suppliers' : 'គ្រប់គ្រងផលិតផល ក្រុម ប្រភេទ ខ្នាត និងអ្នកផ្គត់ផ្គង់'}
                </p>
              </div>
            </div>
            <span className="text-xs font-mono text-slate-400">{masterFiltered.length} items</span>
          </div>

          <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {masterFiltered.map((section) => (
              <ModuleCard key={section.key} section={section} lang={lang} />
            ))}
          </div>
        </section>
      )}

      {/* 5. STOCK OPERATIONS SECTION */}
      {opsFiltered.length > 0 && (
        <section className="rounded-3xl border border-slate-800 bg-slate-900/80 p-5 sm:p-6 shadow-xl shadow-black/20 space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800/80">
            <div className="flex items-center gap-3">
              <div className="h-5 w-1.5 rounded-full bg-[#E69D32]" />
              <div>
                <h2 className="text-base font-bold text-white font-['Montserrat']">
                  {lang === 'en' ? 'Stock Operations & Tools' : 'ប្រតិបត្តិការស្តុក និងឧបករណ៍'}
                </h2>
                <p className="text-[11px] text-slate-400">
                  {lang === 'en'
                    ? 'Day-to-day warehouse movements, receiving, transfers, scale barcodes, and cost changes'
                    : 'ចលនាស្តុកប្រចាំថ្ងៃ ការទទួល ការផ្ទេរ ជញ្ជីងបារកូដ និងការផ្លាស់ប្តូរចំណាយ'}
                </p>
              </div>
            </div>
            <span className="text-xs font-mono text-slate-400">{opsFiltered.length} items</span>
          </div>

          <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {opsFiltered.map((section) => (
              <ModuleCard key={section.key} section={section} lang={lang} />
            ))}
          </div>
        </section>
      )}

      {/* Empty Search State */}
      {filteredSections.length === 0 && (
        <div className="rounded-2xl border border-dashed border-slate-700 bg-slate-950/60 p-12 text-center space-y-3">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-900 text-3xl">
            🔍
          </div>
          <h3 className="text-base font-bold text-white">
            {lang === 'en' ? 'No stock module found' : 'រកមិនឃើញម៉ូឌុលស្តុកទេ'}
          </h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            {lang === 'en'
              ? `No module matching "${searchQuery}". Try searching for Products, Scale, Cost, Suppliers or Transfers.`
              : `គ្មានម៉ូឌុលត្រូវនឹង "${searchQuery}" ទេ។`}
          </p>
          <button
            type="button"
            onClick={() => setSearchQuery('')}
            className="rounded-xl bg-[#7EB631] px-4 py-2 text-xs font-bold text-slate-950 hover:brightness-110"
          >
            {lang === 'en' ? 'Clear Search' : 'សម្អាតការស្វែងរក'}
          </button>
        </div>
      )}
    </div>
  )
}

// Interactive Module Card Component
const ModuleCard = ({ section, lang }) => {
  const isImg = typeof section.icon === 'string' && (section.icon.includes('/') || section.icon.endsWith('.png'))

  return (
    <Link
      to={`/admin/products/${section.key}`}
      className="group relative flex flex-col justify-between rounded-2xl border border-slate-700/60 bg-slate-950/60 p-4 sm:p-5 transition-all duration-300 hover:-translate-y-1 hover:border-slate-500 hover:bg-slate-950 hover:shadow-xl hover:shadow-black/40 active:scale-[0.98]"
    >
      <div>
        <div className="flex items-center justify-between mb-3.5">
          <span
            className="flex h-12 w-12 items-center justify-center rounded-xl p-2 ring-1 ring-white/10 shadow-md shadow-black/30 transition-transform duration-300 group-hover:scale-110"
            style={{ background: section.bg }}
          >
            {isImg ? (
              <img src={section.icon} alt="" className="h-8 w-8 object-contain drop-shadow-md" />
            ) : (
              <span className="text-xl">{section.icon}</span>
            )}
          </span>

          {section.tag && (
            <span
              className="rounded-full px-2 py-0.5 text-[9px] font-black uppercase tracking-wider shadow-sm"
              style={{ background: `${section.color}25`, color: section.color }}
            >
              {section.tag}
            </span>
          )}
        </div>

        <h3 className="text-sm sm:text-base font-bold text-white font-['Montserrat'] group-hover:text-green-300 transition-colors">
          {lang === 'kh' ? section.kh : section.en}
        </h3>

        <p className="mt-1 text-xs leading-relaxed text-slate-400 line-clamp-2">
          {lang === 'kh' ? section.descKh : section.descEn}
        </p>
      </div>

      <div className="mt-4 pt-2.5 border-t border-slate-800/80 flex items-center justify-between">
        <span
          className="inline-flex items-center gap-1.5 text-xs font-bold transition-transform group-hover:translate-x-1"
          style={{ color: section.color }}
        >
          <span>{lang === 'en' ? 'Open' : 'បើក'}</span>
          <ChevronIcon />
        </span>
        <span className="text-[10px] font-mono text-slate-500">→</span>
      </div>
    </Link>
  )
}

const ChevronLeftIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
    <polyline points="15 18 9 12 15 6" />
  </svg>
)

const ChevronIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
    <polyline points="9 18 15 12 9 6" />
  </svg>
)

export default ProductsHub
