import React, { useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { useLanguage } from '../../context/LanguageContext'
import chartIcon from '../../assets/icon/3dicons-chart-dynamic-color.png'
import cubeIcon from '../../assets/icon/3dicons-cube-dynamic-color.png'
import moneyBagIcon from '../../assets/icon/3dicons-money-bag-dynamic-color.png'
import fileTextIcon from '../../assets/icon/3dicons-file-text-dynamic-color.png'
import travelIcon from '../../assets/icon/3dicons-travel-dynamic-color.png'
import calculatorIcon from '../../assets/icon/3dicons-calculator-dynamic-color.png'
import creditCardIcon from '../../assets/icon/3dicons-credit-card-dynamic-color.png'
import walletIcon from '../../assets/icon/3dicons-wallet-dynamic-color.png'
import dollarIcon from '../../assets/icon/3dicons-dollar-dynamic-color.png'
import './ProductsHub.css'

export const INVENTORY_SALES_REPORTS = [
  {
    key: 'stock',
    icon: cubeIcon,
    en: 'Stock & Inventory Valuation',
    kh: 'របាយការណ៍ស្តុក និងតម្លៃស្តុក',
    descEn: 'Current inventory on-hand, FIFO cost valuation, stock movement history, and waste/shrinkage logs.',
    descKh: 'ចំនួនស្តុកជាក់ស្តែង ការគណនាតម្លៃដើម FIFO ចលនាស្តុក និងការខូចខាតបាត់បង់។',
    color: '#3B82F6',
    bg: 'rgba(59, 130, 246, 0.12)',
    category: 'inventory',
    tag: 'Core',
    route: '/admin/report/stock',
  },
  {
    key: 'sale-payment',
    icon: moneyBagIcon,
    en: 'Sales & Revenue Performance',
    kh: 'របាយការណ៍លក់ និងចំណូល',
    descEn: 'Daily/monthly gross revenue, best-selling SKUs, department margins, and cashier counter reconciliations.',
    descKh: 'ចំណូលសរុបប្រចាំថ្ងៃ/ខែ មុខទំនិញលក់ដាច់បំផុត និងការផ្ទៀងផ្ទាត់កុងទ័រ។',
    color: '#77BC1F',
    bg: 'rgba(119, 188, 31, 0.12)',
    category: 'inventory',
    tag: 'Revenue',
    route: '/admin/report/sale-payment',
  },
  {
    key: 'order-management',
    icon: fileTextIcon,
    en: 'Order & Quotation Analytics',
    kh: 'របាយការណ៍បញ្ជាទិញ និងសម្រង់តម្លៃ',
    descEn: 'Quotation win rates, order fulfillment speed, backlog status, and delivery completion ratios.',
    descKh: 'អត្រាជោគជ័យនៃសម្រង់តម្លៃ ល្បឿនផ្គត់ផ្គង់ការបញ្ជាទិញ និងការដឹកជញ្ជូន។',
    color: '#FF9900',
    bg: 'rgba(255, 153, 0, 0.12)',
    category: 'inventory',
    route: '/admin/report/order-management',
  },
  {
    key: 'consignment',
    icon: travelIcon,
    en: 'Consignment Partner Audits',
    kh: 'របាយការណ៍សវនកម្មលក់បញ្ញើ',
    descEn: 'Off-site floor inventory, partner sales turnover, commission deductions, and pending returns.',
    descKh: 'ស្តុកនៅហាងដៃគូ ចំណូលលក់ជាក់ស្តែង កម្រៃជើងសារ និងការប្រគល់ត្រឡប់។',
    color: '#a855f7',
    bg: 'rgba(168, 85, 247, 0.12)',
    category: 'inventory',
    route: '/admin/report/consignment',
  },
]

export const FINANCIAL_PROCUREMENT_REPORTS = [
  {
    key: 'purchase-management',
    icon: calculatorIcon,
    en: 'Purchasing & Supplier Spend',
    kh: 'របាយការណ៍បញ្ជាទិញ និងការចំណាយ',
    descEn: 'Supplier price history comparison, PO compliance, on-time delivery rates, and vendor ratings.',
    descKh: 'ប្រៀបធៀបប្រវត្តិតម្លៃអ្នកផ្គត់ផ្គង់ ការអនុវត្ត PO និងអត្រាដឹកទាន់ពេល។',
    color: '#06b6d4',
    bg: 'rgba(6, 182, 212, 0.12)',
    category: 'finance',
    tag: 'Procurement',
    route: '/admin/report/purchase-management',
  },
  {
    key: 'payable-management',
    icon: creditCardIcon,
    en: 'Accounts Payable & Aging',
    kh: 'របាយការណ៍បំណុលត្រូវសង និងអាយុកាល',
    descEn: 'Pending vendor liabilities, aging debt distribution, supplier credit limits, and payment schedules.',
    descKh: 'បំណុលជំពាក់អ្នកផ្គត់ផ្គង់ តារាងអាយុកាលបំណុល និងកាលវិភាគទូទាត់។',
    color: '#ef4444',
    bg: 'rgba(239, 68, 68, 0.12)',
    category: 'finance',
    tag: 'Liabilities',
    route: '/admin/report/payable-management',
  },
  {
    key: 'cash-book',
    icon: walletIcon,
    en: 'Cash Flow & Bank Ledger',
    kh: 'របាយការណ៍លំហូរសាច់ប្រាក់ និងធនាគារ',
    descEn: 'Store petty cash disbursements, bank account balances, internal transfers, and daily register closing.',
    descKh: 'ការចំណាយលុយរាយ សមតុល្យគណនីធនាគារ ការផ្ទេរប្រាក់ និងការបិទបញ្ជីប្រចាំថ្ងៃ។',
    color: '#f59e0b',
    bg: 'rgba(245, 158, 11, 0.12)',
    category: 'finance',
    tag: 'Treasury',
    route: '/admin/report/cash-book',
  },
  {
    key: 'profit-loss',
    icon: dollarIcon,
    en: 'Profit & Loss Statement (P&L)',
    kh: 'របាយការណ៍ចំណេញ និងខាត (P&L)',
    descEn: 'Net grocery profit margins after COGS, freight allocation, operating overhead, and tax.',
    descKh: 'ប្រាក់ចំណេញសុទ្ធបន្ទាប់ពីកាត់ថ្លៃដើមទំនិញ ថ្លៃដឹកជញ្ជូន និងចំណាយប្រតិបត្តិការ។',
    color: '#10b981',
    bg: 'rgba(16, 185, 129, 0.12)',
    category: 'finance',
    tag: 'Executive',
    route: '/admin/report',
  },
]

export const ALL_REPORT_MODULES = [...INVENTORY_SALES_REPORTS, ...FINANCIAL_PROCUREMENT_REPORTS]

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
      to={item.route || '/admin/report'}
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
          <h3 className="text-sm sm:text-base font-bold text-white tracking-tight group-hover:text-violet-300 transition-colors font-['Montserrat']">
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
        <span>{lang === 'kh' ? 'បើករបាយការណ៍' : 'View Report'}</span>
        <span className="transform transition-transform duration-200 group-hover:translate-x-1">
          <ChevronIcon />
        </span>
      </div>
    </Link>
  )
}

export default function Report() {
  const { lang } = useLanguage()
  const [searchQuery, setSearchQuery] = useState('')
  const [activeCategory, setActiveCategory] = useState('all')

  const filteredModules = useMemo(() => {
    const q = searchQuery.trim().toLowerCase()
    let list = ALL_REPORT_MODULES

    if (activeCategory === 'inventory') {
      list = INVENTORY_SALES_REPORTS
    } else if (activeCategory === 'finance') {
      list = FINANCIAL_PROCUREMENT_REPORTS
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

  const inventoryFiltered = useMemo(
    () => filteredModules.filter((s) => s.category === 'inventory'),
    [filteredModules]
  )
  const financeFiltered = useMemo(
    () => filteredModules.filter((s) => s.category === 'finance'),
    [filteredModules]
  )

  return (
    <div className="space-y-6 text-slate-100" style={{ fontFamily: 'Montserrat, sans-serif' }}>
      {/* 1. HERO BANNER */}
      <section className="relative overflow-hidden rounded-3xl border border-violet-500/20 bg-gradient-to-br from-[#1e293b] via-[#0f172a] to-[#0b0f17] p-5 sm:p-7 shadow-2xl shadow-violet-500/10">
        <div className="pointer-events-none absolute -right-16 -top-20 h-64 w-64 rounded-full bg-violet-500/15 blur-3xl" />
        <div className="pointer-events-none absolute bottom-0 left-1/4 h-px w-2/3 bg-gradient-to-r from-transparent via-violet-500/40 to-transparent" />

        <div className="relative flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-4">
            <Link
              to="/admin"
              className="inline-flex items-center gap-2 rounded-full border border-slate-700/80 bg-slate-950/60 px-3.5 py-1.5 text-xs font-bold uppercase tracking-[0.18em] text-violet-300 transition hover:border-violet-400 hover:text-white active:scale-95"
            >
              <ChevronLeftIcon /> {lang === 'en' ? 'Dashboard' : 'ផ្ទាំងគ្រប់គ្រង'}
            </Link>

            <div className="flex items-center gap-3.5">
              <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-violet-500/15 p-2 ring-1 ring-violet-500/30 shadow-lg shadow-violet-500/20">
                <img src={chartIcon} alt="" className="h-9 w-9 object-contain drop-shadow-md" />
              </span>
              <div>
                <p className="text-[11px] font-black uppercase tracking-[0.25em] text-violet-400">
                  {lang === 'en' ? "FreshMart Business Intelligence & Audits" : 'បញ្ញាសិប្បនិម្មិត និងរបាយការណ៍អាជីវកម្ម'}
                </p>
                <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
                  {lang === 'en' ? 'Reports & Analytics Hub' : 'មជ្ឈមណ្ឌលរបាយការណ៍ និងការវិភាគ'}
                </h1>
              </div>
            </div>

            <p className="max-w-2xl text-xs sm:text-sm leading-relaxed text-slate-300">
              {lang === 'en'
                ? 'Centralized executive intelligence — inspect inventory valuations, daily sales margins, purchasing trends, customer aging debts, cash flow statements and profit & loss analytics.'
                : 'មជ្ឈមណ្ឌលព័ត៌មានប្រតិបត្តិការ — ពិនិត្យតម្លៃស្តុក ប្រាក់ចំណេញលក់ប្រចាំថ្ងៃ និន្នាការបញ្ជាទិញ បំណុលអតិថិជន លំហូរសាច់ប្រាក់ និងរបាយការណ៍ចំណេញខាត។'}
            </p>
          </div>

          {/* Quick Stats Widget */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-2 lg:flex lg:flex-col shrink-0 min-w-[220px]">
            <div className="rounded-2xl border border-slate-800 bg-slate-950/80 p-3.5 shadow-md">
              <div className="flex items-center justify-between text-[11px] text-slate-400">
                <span>{lang === 'en' ? 'Report Templates' : 'គំរូរាយការណ៍'}</span>
                <span className="text-violet-400">● Active</span>
              </div>
              <p className="mt-1 font-mono text-2xl font-black text-white">
                {ALL_REPORT_MODULES.length}
              </p>
            </div>

            <div className="rounded-2xl border border-slate-800 bg-slate-950/80 p-3.5 shadow-md">
              <div className="flex items-center justify-between text-[11px] text-slate-400">
                <span>{lang === 'en' ? 'Export Engine' : 'ម៉ាស៊ីនទាញយក'}</span>
                <span className="text-emerald-400">● Excel & PDF</span>
              </div>
              <p className="mt-1 font-mono text-xs font-semibold text-slate-300">
                Print & Download Ready
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
                ? 'Search stock reports, sales margins, P&L, aging, cash flow...'
                : 'ស្វែងរករបាយការណ៍ស្តុក ប្រាក់ចំណេញ P&L បំណុល លំហូរសាច់ប្រាក់...'
            }
            className="w-full rounded-xl border border-slate-700/80 bg-slate-950/90 py-2 pl-9 pr-8 text-xs font-semibold text-white placeholder-slate-500 outline-none transition focus:border-violet-400 focus:ring-2 focus:ring-violet-400/20"
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
            { key: 'all', en: 'All Reports', kh: 'ទាំងអស់', count: ALL_REPORT_MODULES.length },
            { key: 'inventory', en: 'Inventory & Sales', kh: 'ស្តុក និងការលក់', count: INVENTORY_SALES_REPORTS.length },
            { key: 'finance', en: 'Finance & P&L', kh: 'ហិរញ្ញវត្ថុ និង P&L', count: FINANCIAL_PROCUREMENT_REPORTS.length },
          ].map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveCategory(tab.key)}
              className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold transition whitespace-nowrap active:scale-95 ${
                activeCategory === tab.key
                  ? 'bg-violet-500 text-white shadow-md shadow-violet-500/20 font-black'
                  : 'bg-slate-900/80 text-slate-400 border border-slate-700/60 hover:text-white hover:border-slate-500'
              }`}
            >
              <span>{lang === 'kh' ? tab.kh : tab.en}</span>
              <span
                className={`rounded-full px-1.5 py-0.2 text-[10px] font-mono ${
                  activeCategory === tab.key ? 'bg-slate-950 text-violet-300' : 'bg-slate-800 text-slate-400'
                }`}
              >
                {tab.count}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* 3. FEATURED ACTION CARD */}
      {(!searchQuery || 'stock report'.includes(searchQuery.toLowerCase())) && (
        <Link
          to="/admin/report/stock"
          className="group relative overflow-hidden flex flex-col gap-3 rounded-2xl border border-violet-500/40 bg-gradient-to-r from-violet-500/15 via-purple-500/10 to-slate-900/60 p-4 sm:p-5 transition-all duration-300 hover:-translate-y-1 hover:border-violet-400 hover:shadow-xl hover:shadow-violet-500/10 sm:flex-row sm:items-center sm:justify-between"
        >
          <div className="flex items-center gap-3.5">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-violet-500/20 text-2xl ring-1 ring-violet-400/40 shadow-md">
              📊
            </span>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-black text-white font-['Montserrat']">
                  {lang === 'en' ? 'Master Stock & Inventory Report' : 'របាយការណ៍ស្តុក និងទំនិញមេ'}
                </h3>
                <span className="rounded-full bg-violet-500 px-2 py-0.5 text-[10px] font-black text-white uppercase tracking-wider">
                  Full Analytics
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5 max-w-xl">
                {lang === 'en'
                  ? 'Detailed stock balance per supermarket department, reorder warning thresholds, inventory valuation and batch expirations.'
                  : 'សមតុល្យស្តុកលម្អិតតាមផ្នែកផ្សារទំនើប កម្រិតព្រមានស្តុកទាប ការវាយតម្លៃទំនិញ និងកាលបរិច្ឆេទផុតកំណត់។'}
              </p>
            </div>
          </div>

          <span className="inline-flex items-center gap-1.5 self-start sm:self-center text-xs font-bold text-violet-300 transition-transform group-hover:translate-x-1 shrink-0">
            <span>{lang === 'en' ? 'Generate Report' : 'បង្កើតរបាយការណ៍'}</span>
            <ChevronIcon />
          </span>
        </Link>
      )}

      {/* 4. INVENTORY & SALES REPORTS */}
      {inventoryFiltered.length > 0 && (
        <section className="rounded-3xl border border-slate-800 bg-slate-900/80 p-5 sm:p-6 shadow-xl shadow-black/20 space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800/80">
            <div className="flex items-center gap-3">
              <div className="h-5 w-1.5 rounded-full bg-violet-500" />
              <div>
                <h2 className="text-base font-bold text-white font-['Montserrat']">
                  {lang === 'en' ? 'Inventory, Sales & Logistics Reports' : 'របាយការណ៍ស្តុក ការលក់ និងការដឹកជញ្ជូន'}
                </h2>
                <p className="text-[11px] text-slate-400">
                  {lang === 'en' ? 'Stock valuation, sales revenue, order fulfillment, and partner consignment audits' : 'តម្លៃស្តុក ចំណូលលក់ ការផ្គត់ផ្គង់ និងសវនកម្មលក់បញ្ញើ'}
                </p>
              </div>
            </div>
            <span className="text-xs font-mono text-slate-400">{inventoryFiltered.length} items</span>
          </div>

          <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {inventoryFiltered.map((item) => (
              <ModuleCard key={item.key} item={item} lang={lang} />
            ))}
          </div>
        </section>
      )}

      {/* 5. FINANCE & PROCUREMENT REPORTS */}
      {financeFiltered.length > 0 && (
        <section className="rounded-3xl border border-slate-800 bg-slate-900/80 p-5 sm:p-6 shadow-xl shadow-black/20 space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800/80">
            <div className="flex items-center gap-3">
              <div className="h-5 w-1.5 rounded-full bg-[#77BC1F]" />
              <div>
                <h2 className="text-base font-bold text-white font-['Montserrat']">
                  {lang === 'en' ? 'Financial, AP Ledger & P&L Analytics' : 'ហិរញ្ញវត្ថុ បំណុលត្រូវសង និងរបាយការណ៍ចំណេញខាត'}
                </h2>
                <p className="text-[11px] text-slate-400">
                  {lang === 'en'
                    ? 'Purchasing trends, accounts payable aging, cash flow ledger and executive profit & loss summaries'
                    : 'និន្នាការបញ្ជាទិញ បំណុលចាស់ សៀវភៅលុយ និងរបាយការណ៍ចំណេញខាត'}
                </p>
              </div>
            </div>
            <span className="text-xs font-mono text-slate-400">{financeFiltered.length} items</span>
          </div>

          <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {financeFiltered.map((item) => (
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
            {lang === 'en' ? `No reports found matching "${searchQuery}"` : `រកមិនឃើញរបាយការណ៍ដែលត្រូវនឹង "${searchQuery}" ទេ`}
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
