import React, { useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { useLanguage } from '../../context/LanguageContext'
import travelIcon from '../../assets/icon/3dicons-travel-dynamic-color.png'
import dollarIcon from '../../assets/icon/3dicons-dollar-dynamic-color.png'
import clockIcon from '../../assets/icon/3dicons-clock-dynamic-color.png'
import './ProductsHub.css'

export const FREIGHT_MODULES = [
  {
    key: 'shipment-tariff',
    icon: dollarIcon,
    en: 'Shipment Tariff',
    kh: 'អត្រាតម្លៃដឹកជញ្ជូន',
    descEn: 'Configure zone-based courier rates, weight tiers, and surcharge formulas.',
    descKh: 'កំណត់អត្រាតម្លៃដឹកជញ្ជូនតាមតំបន់ កម្រិតទម្ងន់ និងថ្លៃបន្ថែម។',
    color: '#3B82F6',
    bg: 'rgba(59, 130, 246, 0.12)',
    tag: 'Pricing',
    route: '/admin/freight-management/shipment-tariff',
    badge: 'Active Rates',
  },
  {
    key: 'shipment-method',
    icon: travelIcon,
    en: 'Shipment Method',
    kh: 'វិធីសាស្ត្រដឹកជញ្ជូន',
    descEn: 'Manage road transport, cold-chain trucks, express motorbikes, and freight carriers.',
    descKh: 'គ្រប់គ្រងការដឹកជញ្ជូនតាមផ្លូវគោក រថយន្តក្លាសេ ម៉ូតូលឿន និងក្រុមហ៊ុនដឹកជញ្ជូន។',
    color: '#FF9900',
    bg: 'rgba(255, 153, 0, 0.12)',
    tag: 'Logistics',
    route: '/admin/freight-management/shipment-method',
    badge: 'Fleet & Transit',
  },
  {
    key: 'pending-receipt-po',
    icon: clockIcon,
    en: 'Pending Receipt PO',
    kh: 'ការទទួលទំនិញ PO ដែលរង់ចាំ',
    descEn: 'Monitor incoming freight from suppliers currently in transit to warehouse docks.',
    descKh: 'តាមដានការដឹកទំនិញពីអ្នកផ្គត់ផ្គង់ដែលកំពុងធ្វើដំណើរមកកាន់ឃ្លាំង។',
    color: '#77BC1F',
    bg: 'rgba(119, 188, 31, 0.12)',
    tag: 'Inbound PO',
    route: '/admin/freight-management/pending-receipt-po',
    badge: 'Dock Inbound',
  },
]

export const ALL_FREIGHT_MODULES = FREIGHT_MODULES
export const FREIGHT_TARIFF_MODULES = FREIGHT_MODULES.slice(0, 2)
export const INBOUND_FREIGHT_MODULES = FREIGHT_MODULES.slice(2)

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
      to={item.route}
      className="hub-card group relative overflow-hidden flex flex-col justify-between rounded-3xl border border-slate-800 bg-[#141922]/90 p-5 sm:p-6 text-left transition-all duration-300 hover:border-slate-700 hover:bg-[#1a2230] hover:shadow-2xl hover:shadow-black/50 hover:-translate-y-1"
    >
      <div
        className="pointer-events-none absolute -right-8 -top-8 h-32 w-32 rounded-full opacity-10 blur-2xl transition-opacity group-hover:opacity-30"
        style={{ background: item.color }}
      />

      <div className="relative space-y-4">
        <div className="flex items-start justify-between gap-2">
          <div
            className="hub-icon flex h-14 w-14 items-center justify-center rounded-2xl ring-1 transition-all duration-300 group-hover:scale-110 shadow-lg"
            style={{
              background: item.bg,
              borderColor: item.color + '40',
            }}
          >
            <img src={item.icon} alt="" className="h-8 w-8 object-contain drop-shadow" />
          </div>
          <div className="flex flex-col items-end gap-1">
            {item.tag && (
              <span
                className="rounded-full px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider font-mono shadow-sm"
                style={{
                  background: item.bg,
                  color: item.color,
                  border: `1px solid ${item.color}40`,
                }}
              >
                {item.tag}
              </span>
            )}
            {item.badge && (
              <span className="text-[10px] font-bold text-slate-500 font-mono">
                {item.badge}
              </span>
            )}
          </div>
        </div>

        <div>
          <h3 className="text-base sm:text-lg font-black text-white tracking-tight group-hover:text-amber-300 transition-colors font-['Montserrat']">
            {lang === 'kh' ? item.kh : item.en}
          </h3>
          <p className="mt-1.5 text-xs leading-relaxed text-slate-400">
            {lang === 'kh' ? item.descKh : item.descEn}
          </p>
        </div>
      </div>

      <div
        className="relative mt-6 flex items-center justify-between pt-3.5 border-t border-slate-800/80 text-xs font-bold transition-all"
        style={{ color: item.color }}
      >
        <span>{lang === 'kh' ? 'បើកដំណើរការ' : 'Open Module'}</span>
        <span className="transform transition-transform duration-200 group-hover:translate-x-1.5">
          <ChevronIcon />
        </span>
      </div>
    </Link>
  )
}

export default function FreightManagement() {
  const { lang } = useLanguage()
  const [searchQuery, setSearchQuery] = useState('')
  const [activeFilter, setActiveFilter] = useState('all')

  const filteredModules = useMemo(() => {
    const q = searchQuery.trim().toLowerCase()
    let list = FREIGHT_MODULES

    if (activeFilter !== 'all') {
      list = list.filter((m) => m.key === activeFilter)
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
  }, [searchQuery, activeFilter])

  return (
    <div className="space-y-6 text-slate-100 font-['Montserrat']">
      {/* 1. HERO BANNER */}
      <section className="relative overflow-hidden rounded-3xl border border-amber-500/20 bg-gradient-to-br from-[#1e293b] via-[#0f172a] to-[#0b0f17] p-5 sm:p-7 shadow-2xl shadow-amber-500/10">
        <div className="pointer-events-none absolute -right-16 -top-20 h-64 w-64 rounded-full bg-amber-500/15 blur-3xl" />
        <div className="pointer-events-none absolute bottom-0 left-1/4 h-px w-2/3 bg-gradient-to-r from-transparent via-amber-500/40 to-transparent" />

        <div className="relative flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-4">
            <Link
              to="/admin"
              className="inline-flex items-center gap-2 rounded-full border border-slate-700/80 bg-slate-950/60 px-3.5 py-1.5 text-xs font-bold uppercase tracking-[0.18em] text-amber-300 transition hover:border-amber-400 hover:text-white active:scale-95"
            >
              <ChevronLeftIcon /> {lang === 'en' ? 'Dashboard' : 'ផ្ទាំងគ្រប់គ្រង'}
            </Link>

            <div className="flex items-center gap-3.5">
              <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-amber-500/15 p-2 ring-1 ring-amber-500/30 shadow-lg shadow-amber-500/20">
                <img src={travelIcon} alt="" className="h-9 w-9 object-contain drop-shadow-md" />
              </span>
              <div>
                <p className="text-[11px] font-black uppercase tracking-[0.25em] text-amber-400">
                  {lang === 'en' ? "FreshMart Logistics Hub" : 'ការគ្រប់គ្រងការដឹកជញ្ជូនទំនិញ'}
                </p>
                <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
                  {lang === 'en' ? 'Freight Management Hub' : 'មជ្ឈមណ្ឌលគ្រប់គ្រងថ្លៃដឹកជញ្ជូន'}
                </h1>
              </div>
            </div>

            <p className="max-w-2xl text-xs sm:text-sm leading-relaxed text-slate-300">
              {lang === 'en'
                ? 'Control shipment tariffs, delivery methods, and pending purchase order shipments.'
                : 'គ្រប់គ្រងអត្រាតម្លៃដឹកជញ្ជូន វិធីសាស្ត្រដឹកជញ្ជូន និងការទទួលទំនិញ PO ដែលរង់ចាំ។'}
            </p>
          </div>

          {/* Quick Stats Widget */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-2 lg:flex lg:flex-col shrink-0 min-w-[220px]">
            <div className="rounded-2xl border border-slate-800 bg-slate-950/80 p-3.5 shadow-md">
              <div className="flex items-center justify-between text-[11px] text-slate-400">
                <span>{lang === 'en' ? 'Freight Modules' : 'ម៉ូឌុលដឹកជញ្ជូន'}</span>
                <span className="text-amber-400">● 3 Active</span>
              </div>
              <p className="mt-1 font-mono text-2xl font-black text-white">
                3
              </p>
            </div>

            <div className="rounded-2xl border border-slate-800 bg-slate-950/80 p-3.5 shadow-md">
              <div className="flex items-center justify-between text-[11px] text-slate-400">
                <span>{lang === 'en' ? 'Logistics Engine' : 'ប្រព័ន្ធដឹកជញ្ជូន'}</span>
                <span className="text-emerald-400">● Operational</span>
              </div>
              <p className="mt-1 font-mono text-xs font-semibold text-slate-300">
                Tariff & Inbound PO
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 2. SEARCH & QUICK FILTER BAR */}
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
                ? 'Search Shipment Tariff, Shipment Method, Pending Receipt PO...'
                : 'ស្វែងរកអត្រាតម្លៃ វិធីដឹកជញ្ជូន ការទទួល PO...'
            }
            className="w-full rounded-xl border border-slate-700/80 bg-slate-950/90 py-2 pl-9 pr-8 text-xs font-semibold text-white placeholder-slate-500 outline-none transition focus:border-amber-400 focus:ring-2 focus:ring-amber-400/20"
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
            { key: 'all', en: 'All 3 Modules', kh: 'ទាំងអស់ (៣)', count: 3 },
            { key: 'shipment-tariff', en: 'Shipment Tariff', kh: 'អត្រាតម្លៃ', count: 1 },
            { key: 'shipment-method', en: 'Shipment Method', kh: 'វិធីដឹក', count: 1 },
            { key: 'pending-receipt-po', en: 'Pending Receipt PO', kh: 'ការទទួល PO', count: 1 },
          ].map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveFilter(tab.key)}
              className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold transition whitespace-nowrap active:scale-95 ${
                activeFilter === tab.key
                  ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20 font-black'
                  : 'bg-slate-900/80 text-slate-400 border border-slate-700/60 hover:text-white hover:border-slate-500'
              }`}
            >
              <span>{lang === 'kh' ? tab.kh : tab.en}</span>
              <span
                className={`rounded-full px-1.5 py-0.2 text-[10px] font-mono ${
                  activeFilter === tab.key ? 'bg-slate-950 text-amber-300' : 'bg-slate-800 text-slate-400'
                }`}
              >
                {tab.count}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* 3. THE 3 CORE FREIGHT MODULES GRID */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {filteredModules.map((item) => (
          <ModuleCard key={item.key} item={item} lang={lang} />
        ))}
      </div>

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
            onClick={() => {
              setSearchQuery('')
              setActiveFilter('all')
            }}
            className="rounded-xl border border-slate-700 bg-slate-800 px-4 py-1.5 text-xs font-bold text-white transition hover:bg-slate-700"
          >
            {lang === 'en' ? 'Reset View' : 'សម្អាត'}
          </button>
        </div>
      )}
    </div>
  )
}
