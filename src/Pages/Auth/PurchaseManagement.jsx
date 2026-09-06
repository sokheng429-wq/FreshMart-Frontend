import React, { useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { useLanguage } from '../../context/LanguageContext'
import moneyBagIcon from '../../assets/icon/3dicons-money-bag-dynamic-color.png'
import folderFavIcon from '../../assets/icon/3dicons-folder-fav-dynamic-color.png'
import linkIcon from '../../assets/icon/3dicons-link-dynamic-color.png'
import chartIcon from '../../assets/icon/3dicons-chart-dynamic-color.png'
import fileNewIcon from '../../assets/icon/3dicons-file-new-dynamic-color.png'
import bagIcon from '../../assets/icon/3dicons-bag-dynamic-color.png'
import mailIcon from '../../assets/icon/3dicons-mail-dynamic-color.png'
import copyIcon from '../../assets/icon/3dicons-copy-dynamic-color.png'
import creditCardIcon from '../../assets/icon/3dicons-credit-card-dynamic-color.png'
import './ProductsHub.css'

export const VENDOR_MASTER_MODULES = [
  {
    key: 'suppliers',
    icon: moneyBagIcon,
    en: 'Suppliers Master',
    kh: 'អ្នកផ្គត់ផ្គង់',
    descEn: 'Register farms, producers and wholesalers with contact and credit terms.',
    descKh: 'ចុះឈ្មោះកសិដ្ឋាន ក្រុមហ៊ុនផលិត និងលក្ខខណ្ឌឥណទាន។',
    color: '#77BC1F',
    bg: 'rgba(119, 188, 31, 0.12)',
    category: 'master',
    tag: 'Core',
    route: '/admin/products/suppliers',
  },
  {
    key: 'supplier-groups',
    icon: folderFavIcon,
    en: 'Supplier Groups',
    kh: 'ក្រុមអ្នកផ្គត់ផ្គង់',
    descEn: 'Categorize suppliers by perishables, dry goods, beverages and logistics.',
    descKh: 'បែងចែកក្រុមអ្នកផ្គត់ផ្គង់តាមប្រភេទបន្លែស្រស់ ទំនិញស្ងួត និងភេសជ្ជៈ។',
    color: '#14b8a6',
    bg: 'rgba(20, 184, 166, 0.12)',
    category: 'master',
    route: '/admin/products/supplier-groups',
  },
  {
    key: 'product-supplier',
    icon: linkIcon,
    en: 'Product Supplier Links',
    kh: 'ផលិតផលអ្នកផ្គត់ផ្គង់',
    descEn: 'Link catalog products to primary and secondary suppliers with part numbers.',
    descKh: 'ភ្ជាប់ផលិតផលទៅកាន់អ្នកផ្គត់ផ្គង់ចម្បង និងបន្ទាប់បន្សំ។',
    color: '#3B82F6',
    bg: 'rgba(59, 130, 246, 0.12)',
    category: 'master',
    tag: 'Mapping',
    route: '/admin/products/products-supplier',
  },
  {
    key: 'inventory-to-order',
    icon: chartIcon,
    en: 'Inventory to Order',
    kh: 'ស្តុកដែលត្រូវបញ្ជាទិញ',
    descEn: 'Auto-detect low inventory below reorder points and draft procurement orders.',
    descKh: 'ស្វ័យប្រវត្តិកំណត់ស្តុកដែលធ្លាក់ចុះក្រោមចំណុចបញ្ជាទិញឡើងវិញ។',
    color: '#FF9900',
    bg: 'rgba(255, 153, 0, 0.12)',
    category: 'master',
    tag: 'Smart',
    route: '/admin/purchase-management/inventory-to-order',
  },
]

export const PURCHASE_OPS_MODULES = [
  {
    key: 'requisition',
    icon: fileNewIcon,
    en: 'Requisition',
    kh: 'លិខិតស្នើសុំបញ្ជាទិញ',
    descEn: 'Internal stock purchase requests created by branch and floor managers.',
    descKh: 'លិខិតស្នើសុំទិញស្តុកផ្ទៃក្នុងដែលបង្កើតឡើងដោយអ្នកគ្រប់គ្រងសាខា។',
    color: '#8b5cf6',
    bg: 'rgba(139, 92, 246, 0.12)',
    category: 'procurement',
    tag: 'Workflow',
    route: '/admin/purchase-management/requisition',
  },
  {
    key: 'purchase-order',
    icon: bagIcon,
    en: 'Purchase Orders',
    kh: 'ការបញ្ជាទិញទំនិញ',
    descEn: 'Official purchase orders sent to vendors with quantities, pricing and ETAs.',
    descKh: 'លិខិតបញ្ជាទិញផ្លូវការផ្ញើជូនអ្នកផ្គត់ផ្គង់ ជាមួយតម្លៃ និងកាលបរិច្ឆេទដឹក។',
    color: '#06b6d4',
    bg: 'rgba(6, 182, 212, 0.12)',
    category: 'procurement',
    tag: 'Core',
    route: '/admin/purchase-management/purchase-order',
  },
  {
    key: 'receipt-po',
    icon: mailIcon,
    en: 'Receipt PO',
    kh: 'ការទទួលទំនិញតាម PO',
    descEn: 'Inspect physical shipments, record received batches, and verify delivery notes.',
    descKh: 'ពិនិត្យទំនិញជាក់ស្តែង កត់ត្រាចំនួនទទួល និងផ្ទៀងផ្ទាត់ប័ណ្ណដឹក។',
    color: '#10b981',
    bg: 'rgba(16, 185, 129, 0.12)',
    category: 'procurement',
    tag: 'Receiving',
    route: '/admin/purchase-management/receipt-po',
  },
  {
    key: 'return-receipt-po',
    icon: copyIcon,
    en: 'Return Receipt PO',
    kh: 'ការប្រគល់ទំនិញត្រឡប់ជូនអ្នកផ្គត់ផ្គង់',
    descEn: 'Return rejected or damaged items back to suppliers with debit notes.',
    descKh: 'ប្រគល់ទំនិញខូច ឬមិនត្រូវតាមស្តង់ដារត្រឡប់ជូនអ្នកផ្គត់ផ្គង់វិញ។',
    color: '#ef4444',
    bg: 'rgba(239, 68, 68, 0.12)',
    category: 'procurement',
    tag: 'Returns',
    route: '/admin/purchase-management/return-receipt-po',
  },
]

export const ALL_PURCHASE_MODULES = [...VENDOR_MASTER_MODULES, ...PURCHASE_OPS_MODULES]

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

function ModuleCard({ item, lang }) {
  return (
    <Link
      to={item.route || '/admin/purchase-management'}
      className="hub-card group relative overflow-hidden flex flex-col justify-between rounded-2xl border border-slate-800 bg-[#141922]/90 p-4 sm:p-5 text-left transition-all duration-300 hover:border-slate-700 hover:bg-[#1a2230] hover:shadow-xl hover:shadow-black/40"
    >
      <div
        className="pointer-events-none absolute -right-8 -top-8 h-28 w-28 rounded-full opacity-10 blur-2xl transition-opacity group-hover:opacity-25"
        style={{ background: item.color }}
      />

      <div className="relative space-y-3">
        <div className="flex items-start justify-between gap-2">
          <div
            className="hub-icon flex h-12 w-12 sm:h-13 sm:w-13 items-center justify-center rounded-xl ring-1 transition-all duration-300 group-hover:scale-110"
            style={{
              background: item.bg,
              borderColor: item.color + '40',
            }}
          >
            <img src={item.icon} alt="" className="h-7 w-7 sm:h-8 sm:w-8 object-contain drop-shadow" />
          </div>
          {item.tag && (
            <span
              className="rounded-full px-2 py-0.5 text-[10px] font-black uppercase tracking-wider font-mono shadow-sm"
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

        <div>
          <h3 className="text-sm sm:text-base font-bold text-white tracking-tight group-hover:text-green-300 transition-colors font-['Montserrat']">
            {lang === 'kh' ? item.kh : item.en}
          </h3>
          <p className="mt-1 text-xs leading-relaxed text-slate-400 line-clamp-2">
            {lang === 'kh' ? item.descKh : item.descEn}
          </p>
        </div>
      </div>

      <div
        className="relative mt-4 flex items-center justify-between pt-3 border-t border-slate-800/80 text-xs font-bold transition-all"
        style={{ color: item.color }}
      >
        <span>{lang === 'kh' ? 'បើកដំណើរការ' : 'Open Module'}</span>
        <span className="transform transition-transform duration-200 group-hover:translate-x-1">
          <ChevronIcon />
        </span>
      </div>
    </Link>
  )
}

export default function PurchaseManagement() {
  const { lang } = useLanguage()
  const [searchQuery, setSearchQuery] = useState('')
  const [activeCategory, setActiveCategory] = useState('all')

  const filteredModules = useMemo(() => {
    const q = searchQuery.trim().toLowerCase()
    let list = ALL_PURCHASE_MODULES

    if (activeCategory === 'master') {
      list = VENDOR_MASTER_MODULES
    } else if (activeCategory === 'procurement') {
      list = PURCHASE_OPS_MODULES
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
    () => filteredModules.filter((s) => s.category === 'master'),
    [filteredModules]
  )
  const procFiltered = useMemo(
    () => filteredModules.filter((s) => s.category === 'procurement'),
    [filteredModules]
  )

  return (
    <div className="space-y-6 text-slate-100" style={{ fontFamily: 'Montserrat, sans-serif' }}>
      {/* 1. HERO BANNER */}
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
                <img src={moneyBagIcon} alt="" className="h-9 w-9 object-contain drop-shadow-md" />
              </span>
              <div>
                <p className="text-[11px] font-black uppercase tracking-[0.25em] text-[#7EB631]">
                  {lang === 'en' ? "FreshMart Procurement & Sourcing" : 'ការបញ្ជាទិញ និងផ្គត់ផ្គង់'}
                </p>
                <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
                  {lang === 'en' ? 'Purchase Management Hub' : 'មជ្ឈមណ្ឌលគ្រប់គ្រងការបញ្ជាទិញទំនិញ'}
                </h1>
              </div>
            </div>

            <p className="max-w-2xl text-xs sm:text-sm leading-relaxed text-slate-300">
              {lang === 'en'
                ? 'Supermarket procurement central — manage vendor relationships, supplier groups, automatic reorder forecasting, purchase requisitions, PO issuing and receiving docks.'
                : 'មជ្ឈមណ្ឌលលទ្ធកម្មផ្សារទំនើប — គ្រប់គ្រងទំនាក់ទំនងអ្នកផ្គត់ផ្គង់ ការបញ្ជាទិញស្តុកដោយស្វ័យប្រវត្តិ លិខិតស្នើសុំទិញ ការចេញ PO និងការទទួលទំនិញចូលស្តុក។'}
            </p>
          </div>

          {/* Quick Stats Widget */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-2 lg:flex lg:flex-col shrink-0 min-w-[220px]">
            <div className="rounded-2xl border border-slate-800 bg-slate-950/80 p-3.5 shadow-md">
              <div className="flex items-center justify-between text-[11px] text-slate-400">
                <span>{lang === 'en' ? 'Procurement Nodes' : 'ម៉ូឌុលលទ្ធកម្ម'}</span>
                <span className="text-emerald-400">● Active</span>
              </div>
              <p className="mt-1 font-mono text-2xl font-black text-white">
                {ALL_PURCHASE_MODULES.length}
              </p>
            </div>

            <div className="rounded-2xl border border-slate-800 bg-slate-950/80 p-3.5 shadow-md">
              <div className="flex items-center justify-between text-[11px] text-slate-400">
                <span>{lang === 'en' ? 'Receiving Dock' : 'ច្រកទទួលទំនិញ'}</span>
                <span className="text-blue-400">● Live</span>
              </div>
              <p className="mt-1 font-mono text-xs font-semibold text-slate-300">
                Barcode Integrated
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 2. SEARCH & CATEGORY FILTER BAR */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between rounded-2xl border border-slate-800/80 bg-[#1e293b]/70 backdrop-blur-md p-3.5 shadow-lg">
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
                ? 'Search suppliers, POs, requisitions, receiving, RTV...'
                : 'ស្វែងរកអ្នកផ្គត់ផ្គង់ បញ្ជាទិញ ស្នើសុំ ការទទួលទំនិញ...'
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

        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          {[
            { key: 'all', en: 'All Modules', kh: 'ទាំងអស់', count: ALL_PURCHASE_MODULES.length },
            { key: 'master', en: 'Suppliers Master', kh: 'អ្នកផ្គត់ផ្គង់', count: VENDOR_MASTER_MODULES.length },
            { key: 'procurement', en: 'PO & Receiving', kh: 'PO និងការទទួល', count: PURCHASE_OPS_MODULES.length },
          ].map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveCategory(tab.key)}
              className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold transition whitespace-nowrap active:scale-95 ${activeCategory === tab.key
                ? 'bg-[#7EB631] text-slate-950 shadow-md shadow-green-600/20 font-black'
                : 'bg-slate-900/80 text-slate-400 border border-slate-700/60 hover:text-white hover:border-slate-500'
                }`}
            >
              <span>{lang === 'kh' ? tab.kh : tab.en}</span>
              <span
                className={`rounded-full px-1.5 py-0.2 text-[10px] font-mono ${activeCategory === tab.key ? 'bg-slate-950 text-green-300' : 'bg-slate-800 text-slate-400'
                  }`}
              >
                {tab.count}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* 3. FEATURED ACTION CARD */}
      {(!searchQuery || 'suppliers'.includes(searchQuery.toLowerCase())) && (
        <Link
          to="/admin/products/suppliers"
          className="group relative overflow-hidden flex flex-col gap-3 rounded-2xl border border-green-500/40 bg-gradient-to-r from-green-500/15 via-emerald-500/10 to-slate-900/60 p-4 sm:p-5 transition-all duration-300 hover:-translate-y-1 hover:border-green-400 hover:shadow-xl hover:shadow-green-500/10 sm:flex-row sm:items-center sm:justify-between"
        >
          <div className="flex items-center gap-3.5">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-green-500/20 text-2xl ring-1 ring-green-400/40 shadow-md">
              🏭
            </span>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-black text-white font-['Montserrat']">
                  {lang === 'en' ? 'Supplier Master Directory' : 'បញ្ជីអ្នកផ្គត់ផ្គង់មេ'}
                </h3>
                <span className="rounded-full bg-[#7EB631] px-2 py-0.5 text-[10px] font-black text-slate-950 uppercase tracking-wider">
                  Live Master
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5 max-w-xl">
                {lang === 'en'
                  ? 'Access live supplier database with automated SP-#### codes, tax registration, payment terms, and direct purchase links.'
                  : 'ចូលទៅកាន់បញ្ជីអ្នកផ្គត់ផ្គង់ជាក់ស្តែង ជាមួយកូដ SP-#### ស្វ័យប្រវត្តិ លេខពន្ធ និងលក្ខខណ្ឌទូទាត់។'}
              </p>
            </div>
          </div>

          <span className="inline-flex items-center gap-1.5 self-start sm:self-center text-xs font-bold text-green-300 transition-transform group-hover:translate-x-1 shrink-0">
            <span>{lang === 'en' ? 'Open Directory' : 'បើកបញ្ជី'}</span>
            <ChevronIcon />
          </span>
        </Link>
      )}

      {/* 4. VENDOR MASTER DATA */}
      {masterFiltered.length > 0 && (
        <section className="rounded-3xl border border-slate-800 bg-slate-900/80 p-5 sm:p-6 shadow-xl shadow-black/20 space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800/80">
            <div className="flex items-center gap-3">
              <div className="h-5 w-1.5 rounded-full bg-[#7EB631]" />
              <div>
                <h2 className="text-base font-bold text-white font-['Montserrat']">
                  {lang === 'en' ? 'Suppliers & Product Sourcing' : 'អ្នកផ្គត់ផ្គង់ និងការស្វែងរកទំនិញ'}
                </h2>
                <p className="text-[11px] text-slate-400">
                  {lang === 'en' ? 'Supplier registry, groupings, item mapping, and low-stock replenishment' : 'បញ្ជីអ្នកផ្គត់ផ្គង់ ក្រុម ការភ្ជាប់ទំនិញ និងការបំពេញស្តុកទាប'}
                </p>
              </div>
            </div>
            <span className="text-xs font-mono text-slate-400">{masterFiltered.length} items</span>
          </div>

          <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {masterFiltered.map((item) => (
              <ModuleCard key={item.key} item={item} lang={lang} />
            ))}
          </div>
        </section>
      )}

      {/* 5. PROCUREMENT WORKFLOW */}
      {procFiltered.length > 0 && (
        <section className="rounded-3xl border border-slate-800 bg-slate-900/80 p-5 sm:p-6 shadow-xl shadow-black/20 space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800/80">
            <div className="flex items-center gap-3">
              <div className="h-5 w-1.5 rounded-full bg-[#06b6d4]" />
              <div>
                <h2 className="text-base font-bold text-white font-['Montserrat']">
                  {lang === 'en' ? 'Purchase Workflow & Receiving' : 'លំហូរការបញ្ជាទិញ និងការទទួល'}
                </h2>
                <p className="text-[11px] text-slate-400">
                  {lang === 'en'
                    ? 'Purchase requisitions, purchase order documents, goods receipt notes and return to vendor'
                    : 'លិខិតស្នើសុំទិញ ឯកសារបញ្ជាទិញ ប័ណ្ណទទួលទំនិញ និងការប្រគល់ត្រឡប់'}
                </p>
              </div>
            </div>
            <span className="text-xs font-mono text-slate-400">{procFiltered.length} items</span>
          </div>

          <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {procFiltered.map((item) => (
              <ModuleCard key={item.key} item={item} lang={lang} />
            ))}
          </div>
        </section>
      )}

      {/* Empty Search State */}
      {filteredModules.length === 0 && (
        <div className="rounded-2xl border border-dashed border-slate-700 bg-slate-950/60 p-12 text-center space-y-3">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-900 text-3xl">
            🔍
          </div>
          <p className="text-sm font-bold text-white">
            {lang === 'en' ? `No modules found matching "${searchQuery}"` : `រកមិនឃើញម៉ូឌុលដែលត្រូវនឹង "${searchQuery}" ទេ`}
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
