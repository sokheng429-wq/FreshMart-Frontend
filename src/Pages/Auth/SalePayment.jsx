import React, { useState, useMemo } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useLanguage } from '../../context/LanguageContext'
import moneyBagIcon from '../../assets/icon/3dicons-money-bag-dynamic-color.png'
import dollarIcon from '../../assets/icon/3dicons-dollar-dynamic-color.png'
import chartIcon from '../../assets/icon/3dicons-chart-dynamic-color.png'
import creditCardIcon from '../../assets/icon/3dicons-credit-card-dynamic-color.png'
import walletIcon from '../../assets/icon/3dicons-wallet-dynamic-color.png'
import calendarIcon from '../../assets/icon/3dicons-calendar-dynamic-color.png'
import './ProductsHub.css'

// EXACT 5 SALE PAYMENT MODULES
export const ALL_PAYMENT_MODULES = [
  {
    key: 'customer-deposit',
    icon: walletIcon,
    en: 'Customer Deposit',
    kh: 'ប្រាក់កក់អតិថិជន',
    descEn: 'Record and track customer advance payments, credit deposits and downpayments.',
    descKh: 'កត់ត្រា និងតាមដានការបង់ប្រាក់កក់មុនរបស់អតិថិជន។',
    color: '#3B82F6',
    bg: 'rgba(59, 130, 246, 0.12)',
    category: 'deposit',
    tag: 'Core',
    route: '/admin/sale-payment/customer-deposit',
  },
  {
    key: 'ar-collection',
    icon: dollarIcon,
    en: 'AR Collection',
    kh: 'ការប្រមូលប្រាក់ទារបំណុល',
    descEn: 'Collect payments against open customer invoices and print official receipts.',
    descKh: 'ទទួលការទូទាត់លើវិក័យប័ត្រជំពាក់ និងបោះពុម្ពប័ណ្ណទទួលប្រាក់។',
    color: '#77BC1F',
    bg: 'rgba(119, 188, 31, 0.12)',
    category: 'collection',
    tag: 'Popular',
    route: '/admin/sale-payment/ar-collection',
  },
  {
    key: 'customer-refund',
    icon: creditCardIcon,
    en: 'Customer Refund',
    kh: 'សងប្រាក់វិញជូនអតិថិជន',
    descEn: 'Process customer cash, card, or bank refund disbursements with authorization.',
    descKh: 'ដំណើរការការសងប្រាក់ត្រឡប់ជូនអតិថិជនតាមសាច់ប្រាក់ ឬកាត។',
    color: '#ef4444',
    bg: 'rgba(239, 68, 68, 0.12)',
    category: 'refund',
    tag: 'Refunds',
    route: '/admin/sale-payment/customer-refund',
  },
  {
    key: 'payment-term',
    icon: calendarIcon,
    en: 'Payment Term',
    kh: 'លក្ខខណ្ឌនៃការទូទាត់',
    descEn: 'Define payment due periods (Net 15, Net 30, COD) and settlement rules.',
    descKh: 'កំណត់រយៈពេលទូទាត់ (Net 15, Net 30, COD) និងការបញ្ចុះតម្លៃទូទាត់មុន។',
    color: '#FF9900',
    bg: 'rgba(255, 153, 0, 0.12)',
    category: 'term',
    tag: 'Config',
    route: '/admin/sale-payment/payment-term',
  },
  {
    key: 'aging-invoice',
    icon: chartIcon,
    en: 'Aging Invoice',
    kh: 'វិភាគវិក័យប័ត្រផុតកំណត់',
    descEn: 'Overdue debtor buckets (1-30, 31-60, 61-90+ days) and payment delinquency risk.',
    descKh: 'តាមដានបំណុលហួសកំណត់តាមកាលបរិច្ឆេទ និងវិភាគហានិភ័យ។',
    color: '#a855f7',
    bg: 'rgba(168, 85, 247, 0.12)',
    category: 'aging',
    tag: 'Audit',
    route: '/admin/sale-payment/aging-invoice',
  },
]

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

export default function SalePayment() {
  const { lang } = useLanguage()
  const navigate = useNavigate()
  const [searchQuery, setSearchQuery] = useState('')
  const [activeCategory, setActiveCategory] = useState('all')

  const filteredModules = useMemo(() => {
    const q = searchQuery.trim().toLowerCase()
    let list = ALL_PAYMENT_MODULES

    if (activeCategory !== 'all') {
      list = list.filter((s) => s.category === activeCategory)
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

  return (
    <div className="space-y-6 text-slate-100" style={{ fontFamily: 'Montserrat, sans-serif' }}>
      {/* 1. HERO BANNER */}
      <section className="relative overflow-hidden rounded-3xl border border-emerald-500/20 bg-gradient-to-br from-[#1e293b] via-[#0f172a] to-[#0b0f17] p-5 sm:p-7 shadow-2xl shadow-emerald-500/10">
        <div className="pointer-events-none absolute -right-16 -top-20 h-64 w-64 rounded-full bg-emerald-500/15 blur-3xl" />
        <div className="pointer-events-none absolute bottom-0 left-1/4 h-px w-2/3 bg-gradient-to-r from-transparent via-emerald-500/40 to-transparent" />

        <div className="relative flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-4">
            <Link
              to="/admin"
              className="inline-flex items-center gap-2 rounded-full border border-slate-700/80 bg-slate-950/60 px-3.5 py-1.5 text-xs font-bold uppercase tracking-[0.18em] text-emerald-300 transition hover:border-emerald-400 hover:text-white active:scale-95"
            >
              <ChevronLeftIcon /> {lang === 'en' ? 'Dashboard' : 'ផ្ទាំងគ្រប់គ្រង'}
            </Link>

            <div className="flex items-center gap-3.5">
              <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-emerald-500/15 p-2 ring-1 ring-emerald-500/30 shadow-lg shadow-emerald-500/20">
                <img src={moneyBagIcon} alt="" className="h-9 w-9 object-contain drop-shadow-md" />
              </span>
              <div>
                <p className="text-[11px] font-black uppercase tracking-[0.25em] text-emerald-400">
                  {lang === 'en' ? "FreshMart Accounts Receivable" : 'ការទូទាត់ និងប្រមូលប្រាក់លក់'}
                </p>
                <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
                  {lang === 'en' ? 'Sale Payment' : 'ការទូទាត់លក់'}
                </h1>
              </div>
            </div>

            <p className="max-w-2xl text-xs sm:text-sm leading-relaxed text-slate-300">
              {lang === 'en'
                ? 'Manage customer cash receipts, deposit accounts, AR collections, customer refunds, payment term definitions and invoice aging summaries.'
                : 'គ្រប់គ្រងការប្រមូលប្រាក់ពីអតិថិជន ប្រាក់កក់ ការទារបំណុល ការសងប្រាក់ត្រឡប់ លក្ខខណ្ឌឥណទាន និងរបាយការណ៍បំណុលតាមអាយុកាល។'}
            </p>
          </div>

          {/* Quick Stats Widget */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-2 lg:flex lg:flex-col shrink-0 min-w-[220px]">
            <div className="rounded-2xl border border-slate-800 bg-slate-950/80 p-3.5 shadow-md">
              <div className="flex items-center justify-between text-[11px] text-slate-400">
                <span>{lang === 'en' ? 'Payment Modules' : 'ម៉ូឌុលទូទាត់'}</span>
                <span className="text-emerald-400 font-bold">● 5 Live</span>
              </div>
              <p className="mt-1 font-mono text-2xl font-black text-white">
                {ALL_PAYMENT_MODULES.length}
              </p>
            </div>

            <div className="rounded-2xl border border-slate-800 bg-slate-950/80 p-3.5 shadow-md">
              <div className="flex items-center justify-between text-[11px] text-slate-400">
                <span>{lang === 'en' ? 'AR Ledger' : 'សៀវភៅបំណុល'}</span>
                <span className="text-blue-400 font-bold">● Synced</span>
              </div>
              <p className="mt-1 font-mono text-xs font-semibold text-slate-300">
                Real-Time Auditing
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
                ? 'Search deposits, AR collections, refunds, terms, aging invoices...'
                : 'ស្វែងរកប្រាក់កក់ ការប្រមូលប្រាក់ ការសងប្រាក់ លក្ខខណ្ឌ វិក័យប័ត្រចាស់...'
            }
            className="w-full rounded-xl border border-slate-700/80 bg-slate-950/90 py-2 pl-9 pr-8 text-xs font-semibold text-white placeholder-slate-500 outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/20"
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

        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-thin">
          {[
            { key: 'all', en: 'All Modules', kh: 'ទាំងអស់', count: ALL_PAYMENT_MODULES.length },
            { key: 'deposit', en: 'Customer Deposit', kh: 'ប្រាក់កក់អតិថិជន', count: 1 },
            { key: 'collection', en: 'AR Collection', kh: 'ការប្រមូលប្រាក់', count: 1 },
            { key: 'refund', en: 'Customer Refund', kh: 'សងប្រាក់វិញ', count: 1 },
            { key: 'term', en: 'Payment Term', kh: 'លក្ខខណ្ឌបង់', count: 1 },
            { key: 'aging', en: 'Aging Invoice', kh: 'វិក័យប័ត្រចាស់', count: 1 },
          ].map((tab) => {
            const isSelected = activeCategory === tab.key
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => setActiveCategory(tab.key)}
                className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold transition whitespace-nowrap active:scale-95 ${
                  isSelected
                    ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30 ring-1 ring-emerald-400'
                    : 'bg-slate-900/80 text-slate-400 border border-slate-700/60 hover:text-white hover:border-slate-500'
                }`}
              >
                <span>{lang === 'kh' ? tab.kh : tab.en}</span>
                <span
                  className={`rounded-full px-1.5 py-0.2 text-[10px] font-mono ${
                    isSelected ? 'bg-slate-950 text-emerald-300' : 'bg-slate-800 text-slate-400'
                  }`}
                >
                  {tab.count}
                </span>
              </button>
            )
          })}
        </div>
      </div>

      {/* 3. SALE PAYMENT MODULES - ALL 5 IN ONE PLACE */}
      {filteredModules.length > 0 && (
        <section className="rounded-3xl border border-slate-800 bg-slate-900/80 p-5 sm:p-6 shadow-xl shadow-black/20 space-y-5">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between pb-3 border-b border-slate-800/80">
            <div className="flex items-center gap-3">
              <div className="h-5 w-1.5 rounded-full bg-emerald-500" />
              <div>
                <h2 className="text-base sm:text-lg font-bold text-white font-['Montserrat']">
                  {lang === 'en' ? 'Sale Payment Modules' : 'ម៉ូឌុលគ្រប់គ្រងការទូទាត់លក់'}
                </h2>
                <p className="text-[11px] text-slate-400">
                  {lang === 'en'
                    ? 'Customer Deposit, AR Collection, Customer Refund, Payment Term, and Aging Invoice'
                    : 'ប្រាក់កក់អតិថិជន ការប្រមូលប្រាក់ ការសងប្រាក់ត្រឡប់ លក្ខខណ្ឌទូទាត់ និងវិក័យប័ត្រផុតកំណត់'}
                </p>
              </div>
            </div>
            <span className="text-xs font-mono text-slate-400 bg-slate-800/80 px-2.5 py-1 rounded-full border border-slate-700/60 w-fit">
              {filteredModules.length} {filteredModules.length === 1 ? 'module' : 'modules'}
            </span>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5">
            {filteredModules.map((item) => {
              const isImg =
                typeof item.icon === 'string' &&
                (item.icon.includes('/') || item.icon.endsWith('.png'))

              return (
                <div
                  key={item.key}
                  onClick={() => navigate(item.route)}
                  className="hub-card group relative flex flex-col justify-between rounded-2xl border border-slate-800 bg-slate-950/60 p-5 transition-all duration-300 hover:-translate-y-1 hover:border-slate-700 hover:bg-slate-950 hover:shadow-xl hover:shadow-black/40 active:scale-[0.98] cursor-pointer select-none"
                >
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
                          <img src={item.icon} alt="" className="h-8 w-8 object-contain drop-shadow-md" />
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

                    <h3 className="text-sm sm:text-base font-bold text-white font-['Montserrat'] group-hover:text-emerald-300 transition-colors">
                      {lang === 'kh' ? item.kh : item.en}
                    </h3>

                    <p className="mt-1 text-xs leading-relaxed text-slate-400 line-clamp-2">
                      {lang === 'kh' ? item.descKh : item.descEn}
                    </p>
                  </div>

                  {/* Bottom action */}
                  <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between">
                    <span
                      className="inline-flex items-center gap-1.5 text-xs font-bold transition-transform group-hover:translate-x-1"
                      style={{ color: item.color }}
                    >
                      <span>{lang === 'en' ? 'Open Module' : 'បើកដំណើរការ'}</span>
                      <ChevronIcon />
                    </span>
                  </div>
                </div>
              )
            })}
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
