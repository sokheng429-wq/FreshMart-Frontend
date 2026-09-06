import React, { useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { useLanguage } from '../../context/LanguageContext'
import creditCardIcon from '../../assets/icon/3dicons-credit-card-dynamic-color.png'
import fileTextIcon from '../../assets/icon/3dicons-file-text-dynamic-color.png'
import walletIcon from '../../assets/icon/3dicons-wallet-dynamic-color.png'
import travelIcon from '../../assets/icon/3dicons-travel-dynamic-color.png'
import dollarIcon from '../../assets/icon/3dicons-dollar-dynamic-color.png'
import crownIcon from '../../assets/icon/3dicons-crown-dynamic-color.png'
import './ProductsHub.css'

export const PAYABLE_MODULES = [
  {
    key: 'enter-bill',
    icon: fileTextIcon,
    en: 'Enter Bill',
    kh: 'បញ្ចូលប៊ីលអ្នកផ្គត់ផ្គង់',
    descEn: 'Match supplier invoices against received PO shipments and record accounts payable liabilities.',
    descKh: 'ផ្ទៀងផ្ទាត់វិក័យប័ត្រអ្នកផ្គត់ផ្គង់ជាមួយ PO និងបញ្ចូលប៊ីលត្រូវបង់។',
    color: '#3B82F6',
    bg: 'rgba(59, 130, 246, 0.12)',
    tag: 'Billing',
    badge: 'Invoices',
    route: '/admin/payable-management/enter-bill',
  },
  {
    key: 'bill-payment',
    icon: walletIcon,
    en: 'Bill Payment',
    kh: 'ការបង់ប្រាក់ប៊ីល',
    descEn: 'Disburse supplier payments, manage bank transfers, and settle open vendor bills.',
    descKh: 'គ្រប់គ្រងការទូទាត់ប្រាក់ជូនអ្នកផ្គត់ផ្គង់ ផ្ទេរប្រាក់ និងកាត់កងប៊ីលដែលនៅជំពាក់។',
    color: '#10B981',
    bg: 'rgba(16, 185, 129, 0.12)',
    tag: 'Disbursement',
    badge: 'Settlement',
    route: '/admin/payable-management/bill-payment',
  },
  {
    key: 'enter-freight',
    icon: travelIcon,
    en: 'Enter Freight',
    kh: 'វិក័យប័ត្រដឹកជញ្ជូន',
    descEn: 'Record inbound shipping bills, port demurrage, customs duties, and allocate freight expenses.',
    descKh: 'បញ្ចូលវិក័យប័ត្រដឹកជញ្ជូន ថ្លៃលើកដាក់កំពង់ផែ និងបែងចែកថ្លៃដើមដឹកជញ្ជូន។',
    color: '#FF9900',
    bg: 'rgba(255, 153, 0, 0.12)',
    tag: 'Logistics',
    badge: 'Freight & Port',
    route: '/admin/payable-management/enter-freight',
  },
  {
    key: 'supplier-deposit',
    icon: crownIcon,
    en: 'Supplier Deposit',
    kh: 'ប្រាក់កក់អ្នកផ្គត់ផ្គង់',
    descEn: 'Record advance procurement deposits held with key suppliers, farmers, and distributors.',
    descKh: 'កត់ត្រាប្រាក់កក់មុនដែលបានបង់ជូនកសិករ រោងចក្រ និងអ្នកផ្គត់ផ្គង់។',
    color: '#8B5CF6',
    bg: 'rgba(139, 92, 246, 0.12)',
    tag: 'Advance',
    badge: 'Vendor Deposit',
    route: '/admin/payable-management/supplier-deposit',
  },
  {
    key: 'supplier-refund',
    icon: dollarIcon,
    en: 'Supplier Refund',
    kh: 'ប្រាក់សងត្រឡប់ពីអ្នកផ្គត់ផ្គង់',
    descEn: 'Process supplier cash refunds, credit adjustments, and debit notes for returned stock.',
    descKh: 'ទទួលប្រាក់សងត្រឡប់ពីអ្នកផ្គត់ផ្គង់សម្រាប់ទំនិញខូច ឬប្រគល់ត្រឡប់វិញ។',
    color: '#EC4899',
    bg: 'rgba(236, 72, 153, 0.12)',
    tag: 'Refund',
    badge: 'Credit Memo',
    route: '/admin/payable-management/supplier-refund',
  },
]

export const ALL_PAYABLE_MODULES = PAYABLE_MODULES

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
          <h3 className="text-base sm:text-lg font-black text-white tracking-tight group-hover:text-red-300 transition-colors font-['Montserrat']">
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

export default function PayableManagement() {
  const { lang } = useLanguage()
  const [searchQuery, setSearchQuery] = useState('')
  const [activeFilter, setActiveFilter] = useState('all')

  const filteredModules = useMemo(() => {
    const q = searchQuery.trim().toLowerCase()
    let list = PAYABLE_MODULES

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
      <section className="relative overflow-hidden rounded-3xl border border-red-500/20 bg-gradient-to-br from-[#1e293b] via-[#0f172a] to-[#0b0f17] p-5 sm:p-7 shadow-2xl shadow-red-500/10">
        <div className="pointer-events-none absolute -right-16 -top-20 h-64 w-64 rounded-full bg-red-500/15 blur-3xl" />
        <div className="pointer-events-none absolute bottom-0 left-1/4 h-px w-2/3 bg-gradient-to-r from-transparent via-red-500/40 to-transparent" />

        <div className="relative flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-4">
            <Link
              to="/admin"
              className="inline-flex items-center gap-2 rounded-full border border-slate-700/80 bg-slate-950/60 px-3.5 py-1.5 text-xs font-bold uppercase tracking-[0.18em] text-red-300 transition hover:border-red-400 hover:text-white active:scale-95"
            >
              <ChevronLeftIcon /> {lang === 'en' ? 'Dashboard' : 'ផ្ទាំងគ្រប់គ្រង'}
            </Link>

            <div className="flex items-center gap-3.5">
              <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-red-500/15 p-2 ring-1 ring-red-500/30 shadow-lg shadow-red-500/20">
                <img src={creditCardIcon} alt="" className="h-9 w-9 object-contain drop-shadow-md" />
              </span>
              <div>
                <p className="text-[11px] font-black uppercase tracking-[0.25em] text-red-400">
                  {lang === 'en' ? "FreshMart Accounts Payable" : 'ការគ្រប់គ្រងបំណុល និងប៊ីលត្រូវសង'}
                </p>
                <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
                  {lang === 'en' ? 'Payable Management Hub' : 'មជ្ឈមណ្ឌលគ្រប់គ្រងថ្លៃត្រូវបង់'}
                </h1>
              </div>
            </div>

            <p className="max-w-2xl text-xs sm:text-sm leading-relaxed text-slate-300">
              {lang === 'en'
                ? 'Accounts payable management — enter vendor bills, process payments, allocate freight invoices, record supplier deposits, and manage supplier refunds.'
                : 'គ្រប់គ្រងបំណុលត្រូវសង — បញ្ចូលប៊ីលអ្នកផ្គត់ផ្គង់ បង់ប្រាក់ប៊ីល វិក័យប័ត្រដឹកជញ្ជូន ប្រាក់កក់អ្នកផ្គត់ផ្គង់ និងការសងប្រាក់ត្រឡប់មកវិញ។'}
            </p>
          </div>

          {/* Quick Stats Widget */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-2 lg:flex lg:flex-col shrink-0 min-w-[220px]">
            <div className="rounded-2xl border border-slate-800 bg-slate-950/80 p-3.5 shadow-md">
              <div className="flex items-center justify-between text-[11px] text-slate-400">
                <span>{lang === 'en' ? 'Payable Modules' : 'ម៉ូឌុលត្រូវសង'}</span>
                <span className="text-red-400 font-bold">● 5 Active</span>
              </div>
              <p className="mt-1 font-mono text-2xl font-black text-white">
                5
              </p>
            </div>

            <div className="rounded-2xl border border-slate-800 bg-slate-950/80 p-3.5 shadow-md">
              <div className="flex items-center justify-between text-[11px] text-slate-400">
                <span>{lang === 'en' ? 'AP & Cash Flow' : 'លំហូរបំណុល និងសាច់ប្រាក់'}</span>
                <span className="text-emerald-400">● Operational</span>
              </div>
              <p className="mt-1 font-mono text-xs font-semibold text-slate-300">
                Automated Ledger
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
                ? 'Search Enter Bill, Bill Payment, Enter Freight, Supplier Deposit, Supplier Refund...'
                : 'ស្វែងរកបញ្ចូលប៊ីល ការបង់ប៊ីល វិក័យប័ត្រដឹក ប្រាក់កក់ សងប្រាក់វិញ...'
            }
            className="w-full rounded-xl border border-slate-700/80 bg-slate-950/90 py-2 pl-9 pr-8 text-xs font-semibold text-white placeholder-slate-500 outline-none transition focus:border-red-400 focus:ring-2 focus:ring-red-400/20"
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
            { key: 'all', en: 'All 5 Modules', kh: 'ទាំងអស់ (៥)', count: 5 },
            { key: 'enter-bill', en: 'Enter Bill', kh: 'បញ្ចូលប៊ីល', count: 1 },
            { key: 'bill-payment', en: 'Bill Payment', kh: 'ការបង់ប៊ីល', count: 1 },
            { key: 'enter-freight', en: 'Enter Freight', kh: 'វិក័យប័ត្រដឹក', count: 1 },
            { key: 'supplier-deposit', en: 'Supplier Deposit', kh: 'ប្រាក់កក់', count: 1 },
            { key: 'supplier-refund', en: 'Supplier Refund', kh: 'សងប្រាក់វិញ', count: 1 },
          ].map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveFilter(tab.key)}
              className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold transition whitespace-nowrap active:scale-95 ${
                activeFilter === tab.key
                  ? 'bg-red-500 text-white shadow-md shadow-red-500/20 font-black'
                  : 'bg-slate-900/80 text-slate-400 border border-slate-700/60 hover:text-white hover:border-slate-500'
              }`}
            >
              <span>{lang === 'kh' ? tab.kh : tab.en}</span>
              <span
                className={`rounded-full px-1.5 py-0.2 text-[10px] font-mono ${
                  activeFilter === tab.key ? 'bg-slate-950 text-red-300' : 'bg-slate-800 text-slate-400'
                }`}
              >
                {tab.count}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* 3. FEATURED ACTION CARD */}
      {(!searchQuery || 'enter bill'.includes(searchQuery.toLowerCase())) && activeFilter === 'all' && (
        <Link
          to="/admin/payable-management/enter-bill"
          className="group relative overflow-hidden flex flex-col gap-3 rounded-2xl border border-red-500/40 bg-gradient-to-r from-red-500/15 via-pink-500/10 to-slate-900/60 p-4 sm:p-5 transition-all duration-300 hover:-translate-y-1 hover:border-red-400 hover:shadow-xl hover:shadow-red-500/10 sm:flex-row sm:items-center sm:justify-between"
        >
          <div className="flex items-center gap-3.5">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-red-500/20 text-2xl ring-1 ring-red-400/40 shadow-md">
              💳
            </span>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-black text-white font-['Montserrat']">
                  {lang === 'en' ? 'Direct Vendor Bill Entry' : 'បញ្ចូលប៊ីលអ្នកផ្គត់ផ្គង់រហ័ស'}
                </h3>
                <span className="rounded-full bg-red-500 px-2 py-0.5 text-[10px] font-black text-white uppercase tracking-wider">
                  New Entry
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5 max-w-xl">
                {lang === 'en'
                  ? 'Record supplier invoices, match line items with purchase orders, apply discounts, and schedule payable dues.'
                  : 'កត់ត្រាវិក័យប័ត្រអ្នកផ្គត់ផ្គង់ ផ្ទៀងផ្ទាត់ជាមួយការបញ្ជាទិញ កាត់ពន្ធ និងកំណត់កាលបរិច្ឆេទទូទាត់។'}
              </p>
            </div>
          </div>

          <span className="inline-flex items-center gap-1.5 self-start sm:self-center text-xs font-bold text-red-300 transition-transform group-hover:translate-x-1 shrink-0">
            <span>{lang === 'en' ? 'Enter New Bill' : 'បញ្ចូលប៊ីលថ្មី'}</span>
            <ChevronIcon />
          </span>
        </Link>
      )}

      {/* 4. THE 5 CORE PAYABLE MODULES GRID */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4.5">
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
            {lang === 'en' ? 'Reset View' : 'សម្អាតការស្វែងរក'}
          </button>
        </div>
      )}
    </div>
  )
}
