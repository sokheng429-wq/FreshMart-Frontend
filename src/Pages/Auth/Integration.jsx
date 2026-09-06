import React, { useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { useLanguage } from '../../context/LanguageContext'
import creditCardIcon from '../../assets/icon/3dicons-credit-card-dynamic-color.png'
import mobileIcon from '../../assets/icon/3dicons-mobile-dynamic-color.png'
import fileTextIcon from '../../assets/icon/3dicons-file-text-dynamic-color.png'
import keyIcon from '../../assets/icon/3dicons-key-dynamic-color.png'
import canIcon from '../../assets/icon/3dicons-can-dynamic-color.png'
import bellIcon from '../../assets/icon/3dicons-bell-dynamic-color.png'
import chatIcon from '../../assets/icon/3dicons-chat-bubble-dynamic-color.png'
import settingIcon from '../../assets/icon/3dicons-setting-dynamic-color.png'
import flashIcon from '../../assets/icon/3dicons-flash-dynamic-color.png'
import './ProductsHub.css'

export const PAYMENT_CHANNELS_MODULES = [
  {
    key: 'payment-gateway',
    icon: creditCardIcon,
    en: 'Payment Gateway',
    kh: 'ច្រកទូទាត់ប្រាក់ (Payment Gateway)',
    descEn: 'Configure ABA KHQR, Wing, ACLEDA, Visa, MasterCard, and Alipay merchants.',
    descKh: 'ភ្ជាប់ និងកំណត់ច្រកទូទាត់ ABA KHQR, Wing, ACLEDA, Visa និង MasterCard។',
    color: '#3B82F6',
    bg: 'rgba(59, 130, 246, 0.12)',
    category: 'channels',
    tag: 'Payment',
    route: '/admin/integration/payment-gateway',
  },
  {
    key: 'app',
    icon: mobileIcon,
    en: 'Mobile & Web Apps',
    kh: 'កម្មវិធីទូរស័ព្ទ និងវេបសាយ',
    descEn: 'Manage e-commerce shopper mobile app, customer loyalty tokens, and push webhooks.',
    descKh: 'គ្រប់គ្រងកម្មវិធីទូរស័ព្ទទិញទំនិញ ប្រព័ន្ធពិន្ទុសមាជិក និង Webhook។',
    color: '#10b981',
    bg: 'rgba(16, 185, 129, 0.12)',
    category: 'channels',
    tag: 'Apps',
    route: '/admin/integration/app',
  },
  {
    key: 'template',
    icon: fileTextIcon,
    en: 'Print & Receipt Templates',
    kh: 'គំរូបោះពុម្ព និងវិក័យប័ត្រ',
    descEn: 'Customize 80mm thermal receipt formats, ESC/POS printer codes, and invoice headers.',
    descKh: 'កំណត់ទម្រង់វិក័យប័ត្រកម្ដៅ ៨០មម ភាសាខ្មែរ និងក្បាលលិខិតវិក័យប័ត្រ។',
    color: '#FF9900',
    bg: 'rgba(255, 153, 0, 0.12)',
    category: 'channels',
    tag: 'Thermal',
    route: '/admin/integration/template',
  },
  {
    key: 'key',
    icon: keyIcon,
    en: 'API Keys & Webhooks',
    kh: 'កូនសោ API និង Webhooks',
    descEn: 'Generate developer API bearer tokens, manage OAuth clients, and audit webhook logs.',
    descKh: 'បង្កើតសោ API គ្រប់គ្រងកម្មវិធីភ្ជាប់ និងតាមដានកំណត់ត្រា Webhook។',
    color: '#a855f7',
    bg: 'rgba(168, 85, 247, 0.12)',
    category: 'channels',
    tag: 'Developer',
    route: '/admin/integration/key',
  },
]

export const HARDWARE_SYNC_MODULES = [
  {
    key: 'station-info',
    icon: canIcon,
    en: 'POS Stations & Hardware',
    kh: 'ព័ត៌មានស្ថានីយ POS និងឧបករណ៍',
    descEn: 'Register counter POS terminals, pole displays, cash drawers, and barcode scanners.',
    descKh: 'ចុះឈ្មោះស្ថានីយ POS កុងទ័រ ថតលុយស្វ័យប្រវត្តិ និងម៉ាស៊ីនស្កេនបារកូដ។',
    color: '#06b6d4',
    bg: 'rgba(6, 182, 212, 0.12)',
    category: 'hardware',
    tag: 'POS Terminal',
    route: '/admin/integration/station-info',
  },
  {
    key: 'dual-display',
    icon: flashIcon,
    en: 'Customer Dual Display',
    kh: 'អេក្រង់បង្ហាញអតិថិជន (Dual Display)',
    descEn: 'Configure secondary customer-facing screens for live totals and promotional media.',
    descKh: 'កំណត់អេក្រង់ទីពីរសម្រាប់អតិថិជនមើលតម្លៃទំនិញ និងផ្ទាំងផ្សាយពាណិជ្ជកម្ម។',
    color: '#ec4899',
    bg: 'rgba(236, 72, 153, 0.12)',
    category: 'hardware',
    tag: 'Display',
    route: '/admin/integration/dual-display',
  },
  {
    key: 'sync-notification',
    icon: bellIcon,
    en: 'Sync & Realtime Alerts',
    kh: 'ការធ្វើសមកាលកម្ម និងការជូនដំណឹង',
    descEn: 'Telegram bot notifications for low stock alerts, cashier drawer opens, and huge sales.',
    descKh: 'ការផ្ញើសារជូនដំណឹងតាម Telegram ពេលស្តុកទាប ឬបើកថតលុយ។',
    color: '#f59e0b',
    bg: 'rgba(245, 158, 11, 0.12)',
    category: 'hardware',
    tag: 'Telegram',
    route: '/admin/integration/sync-notification',
  },
  {
    key: 'communication',
    icon: chatIcon,
    en: 'SMS & Messaging Channels',
    kh: 'សារ SMS និងការផ្ញើសារ',
    descEn: 'Connect SMS gateway providers for OTP authentication, invoice links, and delivery SMS.',
    descKh: 'ភ្ជាប់ច្រក SMS សម្រាប់លេខកូដ OTP តំណវិក័យប័ត្រ និងការដឹកជញ្ជូន។',
    color: '#77BC1F',
    bg: 'rgba(119, 188, 31, 0.12)',
    category: 'hardware',
    route: '/admin/integration/communication',
  },
  {
    key: 'setting',
    icon: settingIcon,
    en: 'Integration Preferences',
    kh: 'ការកំណត់ការតភ្ជាប់ទូទៅ',
    descEn: 'Network timeout limits, automatic sync intervals, and SSL certificates.',
    descKh: 'កំណត់ពេលវេលាឆ្លើយតបបណ្តាញ ភាពញឹកញាប់នៃការធ្វើសមកាលកម្ម និង SSL។',
    color: '#8b5cf6',
    bg: 'rgba(139, 92, 246, 0.12)',
    category: 'hardware',
    route: '/admin/integration/setting',
  },
]

export const ALL_INTEGRATION_MODULES = [...PAYMENT_CHANNELS_MODULES, ...HARDWARE_SYNC_MODULES]

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
      to={item.route || '/admin/integration'}
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
          <h3 className="text-sm sm:text-base font-bold text-white tracking-tight group-hover:text-cyan-300 transition-colors font-['Montserrat']">
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
        <span>{lang === 'kh' ? 'បើកដំណើរការ' : 'Open Integration'}</span>
        <span className="transform transition-transform duration-200 group-hover:translate-x-1">
          <ChevronIcon />
        </span>
      </div>
    </Link>
  )
}

export default function Integration() {
  const { lang } = useLanguage()
  const [searchQuery, setSearchQuery] = useState('')
  const [activeCategory, setActiveCategory] = useState('all')

  const filteredModules = useMemo(() => {
    const q = searchQuery.trim().toLowerCase()
    let list = ALL_INTEGRATION_MODULES

    if (activeCategory === 'channels') {
      list = PAYMENT_CHANNELS_MODULES
    } else if (activeCategory === 'hardware') {
      list = HARDWARE_SYNC_MODULES
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

  const channelsFiltered = useMemo(
    () => filteredModules.filter((s) => s.category === 'channels'),
    [filteredModules]
  )
  const hardwareFiltered = useMemo(
    () => filteredModules.filter((s) => s.category === 'hardware'),
    [filteredModules]
  )

  return (
    <div className="space-y-6 text-slate-100" style={{ fontFamily: 'Montserrat, sans-serif' }}>
      {/* 1. HERO BANNER */}
      <section className="relative overflow-hidden rounded-3xl border border-cyan-500/20 bg-gradient-to-br from-[#1e293b] via-[#0f172a] to-[#0b0f17] p-5 sm:p-7 shadow-2xl shadow-cyan-500/10">
        <div className="pointer-events-none absolute -right-16 -top-20 h-64 w-64 rounded-full bg-cyan-500/15 blur-3xl" />
        <div className="pointer-events-none absolute bottom-0 left-1/4 h-px w-2/3 bg-gradient-to-r from-transparent via-cyan-500/40 to-transparent" />

        <div className="relative flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-4">
            <Link
              to="/admin"
              className="inline-flex items-center gap-2 rounded-full border border-slate-700/80 bg-slate-950/60 px-3.5 py-1.5 text-xs font-bold uppercase tracking-[0.18em] text-cyan-300 transition hover:border-cyan-400 hover:text-white active:scale-95"
            >
              <ChevronLeftIcon /> {lang === 'en' ? 'Dashboard' : 'ផ្ទាំងគ្រប់គ្រង'}
            </Link>

            <div className="flex items-center gap-3.5">
              <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-cyan-500/15 p-2 ring-1 ring-cyan-500/30 shadow-lg shadow-cyan-500/20">
                <img src={creditCardIcon} alt="" className="h-9 w-9 object-contain drop-shadow-md" />
              </span>
              <div>
                <p className="text-[11px] font-black uppercase tracking-[0.25em] text-cyan-400">
                  {lang === 'en' ? "FreshMart Connected Ecosystem" : 'ប្រព័ន្ធតភ្ជាប់ និងឧបករណ៍'}
                </p>
                <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
                  {lang === 'en' ? 'Integration & Hardware Hub' : 'មជ្ឈមណ្ឌលការតភ្ជាប់ និងឧបករណ៍'}
                </h1>
              </div>
            </div>

            <p className="max-w-2xl text-xs sm:text-sm leading-relaxed text-slate-300">
              {lang === 'en'
                ? 'External channel connectivity — integrate ABA KHQR payment gateways, mobile apps, ESC/POS thermal printers, counter POS stations, customer dual displays, and Telegram alert webhooks.'
                : 'ការតភ្ជាប់ប្រព័ន្ធខាងក្រៅ — ច្រកទូទាត់ ABA KHQR កម្មវិធីទូរស័ព្ទ ម៉ាស៊ីនបោះពុម្ពបង្កាន់ដៃ ស្ថានីយ POS អេក្រង់បង្ហាញអតិថិជន និងសារជូនដំណឹង Telegram។'}
            </p>
          </div>

          {/* Quick Stats Widget */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-2 lg:flex lg:flex-col shrink-0 min-w-[220px]">
            <div className="rounded-2xl border border-slate-800 bg-slate-950/80 p-3.5 shadow-md">
              <div className="flex items-center justify-between text-[11px] text-slate-400">
                <span>{lang === 'en' ? 'Active Gateways' : 'ច្រកតភ្ជាប់'}</span>
                <span className="text-cyan-400">● Live</span>
              </div>
              <p className="mt-1 font-mono text-2xl font-black text-white">
                {ALL_INTEGRATION_MODULES.length}
              </p>
            </div>

            <div className="rounded-2xl border border-slate-800 bg-slate-950/80 p-3.5 shadow-md">
              <div className="flex items-center justify-between text-[11px] text-slate-400">
                <span>{lang === 'en' ? 'KHQR & POS' : 'KHQR និង POS'}</span>
                <span className="text-emerald-400">● Connected</span>
              </div>
              <p className="mt-1 font-mono text-xs font-semibold text-slate-300">
                Zero-Latency Sync
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
                ? 'Search payment gateways, POS stations, API keys, thermal printers...'
                : 'ស្វែងរកច្រកទូទាត់ ស្ថានីយ POS សោ API ម៉ាស៊ីនបោះពុម្ព...'
            }
            className="w-full rounded-xl border border-slate-700/80 bg-slate-950/90 py-2 pl-9 pr-8 text-xs font-semibold text-white placeholder-slate-500 outline-none transition focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/20"
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
            { key: 'all', en: 'All Integrations', kh: 'ទាំងអស់', count: ALL_INTEGRATION_MODULES.length },
            { key: 'channels', en: 'Payment & APIs', kh: 'ការទូទាត់ និង API', count: PAYMENT_CHANNELS_MODULES.length },
            { key: 'hardware', en: 'Hardware & POS', kh: 'ឧបករណ៍ និង POS', count: HARDWARE_SYNC_MODULES.length },
          ].map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveCategory(tab.key)}
              className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold transition whitespace-nowrap active:scale-95 ${
                activeCategory === tab.key
                  ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20 font-black'
                  : 'bg-slate-900/80 text-slate-400 border border-slate-700/60 hover:text-white hover:border-slate-500'
              }`}
            >
              <span>{lang === 'kh' ? tab.kh : tab.en}</span>
              <span
                className={`rounded-full px-1.5 py-0.2 text-[10px] font-mono ${
                  activeCategory === tab.key ? 'bg-slate-950 text-cyan-300' : 'bg-slate-800 text-slate-400'
                }`}
              >
                {tab.count}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* 3. FEATURED ACTION CARD */}
      {(!searchQuery || 'payment gateway'.includes(searchQuery.toLowerCase())) && (
        <Link
          to="/admin/integration/payment-gateway"
          className="group relative overflow-hidden flex flex-col gap-3 rounded-2xl border border-cyan-500/40 bg-gradient-to-r from-cyan-500/15 via-teal-500/10 to-slate-900/60 p-4 sm:p-5 transition-all duration-300 hover:-translate-y-1 hover:border-cyan-400 hover:shadow-xl hover:shadow-cyan-500/10 sm:flex-row sm:items-center sm:justify-between"
        >
          <div className="flex items-center gap-3.5">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-cyan-500/20 text-2xl ring-1 ring-cyan-400/40 shadow-md">
              💳
            </span>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-black text-white font-['Montserrat']">
                  {lang === 'en' ? 'ABA KHQR & Digital Payment Gateway' : 'ច្រកទូទាត់ ABA KHQR និងឌីជីថល'}
                </h3>
                <span className="rounded-full bg-cyan-500 px-2 py-0.5 text-[10px] font-black text-slate-950 uppercase tracking-wider">
                  Live Gateway
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5 max-w-xl">
                {lang === 'en'
                  ? 'Dynamic customer KHQR display at counter checkout with instant payment webhook confirmation.'
                  : 'បង្ហាញលេខកូដ KHQR ដោយស្វ័យប្រវត្តិតាមកុងទ័រទូទាត់ ជាមួយការផ្ទៀងផ្ទាត់ការបង់ប្រាក់ភ្លាមៗ។'}
              </p>
            </div>
          </div>

          <span className="inline-flex items-center gap-1.5 self-start sm:self-center text-xs font-bold text-cyan-300 transition-transform group-hover:translate-x-1 shrink-0">
            <span>{lang === 'en' ? 'Configure Gateway' : 'កំណត់ច្រកទូទាត់'}</span>
            <ChevronIcon />
          </span>
        </Link>
      )}

      {/* 4. PAYMENT & API CHANNELS */}
      {channelsFiltered.length > 0 && (
        <section className="rounded-3xl border border-slate-800 bg-slate-900/80 p-5 sm:p-6 shadow-xl shadow-black/20 space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800/80">
            <div className="flex items-center gap-3">
              <div className="h-5 w-1.5 rounded-full bg-cyan-500" />
              <div>
                <h2 className="text-base font-bold text-white font-['Montserrat']">
                  {lang === 'en' ? 'Payment Gateways & External APIs' : 'ច្រកទូទាត់ និង API ខាងក្រៅ'}
                </h2>
                <p className="text-[11px] text-slate-400">
                  {lang === 'en' ? 'Digital payments, shopper mobile apps, printable templates, and API access keys' : 'ការទូទាត់ឌីជីថល កម្មវិធីទូរស័ព្ទ គំរូបង្កាន់ដៃ និងសោ API'}
                </p>
              </div>
            </div>
            <span className="text-xs font-mono text-slate-400">{channelsFiltered.length} items</span>
          </div>

          <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {channelsFiltered.map((item) => (
              <ModuleCard key={item.key} item={item} lang={lang} />
            ))}
          </div>
        </section>
      )}

      {/* 5. HARDWARE & POS SYNC */}
      {hardwareFiltered.length > 0 && (
        <section className="rounded-3xl border border-slate-800 bg-slate-900/80 p-5 sm:p-6 shadow-xl shadow-black/20 space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800/80">
            <div className="flex items-center gap-3">
              <div className="h-5 w-1.5 rounded-full bg-[#77BC1F]" />
              <div>
                <h2 className="text-base font-bold text-white font-['Montserrat']">
                  {lang === 'en' ? 'Hardware Stations & Realtime Sync' : 'ឧបករណ៍ស្ថានីយ និងការជូនដំណឹង'}
                </h2>
                <p className="text-[11px] text-slate-400">
                  {lang === 'en'
                    ? 'POS cash registers, dual customer screens, Telegram notifications, and SMS gateway'
                    : 'កុងទ័រ POS អេក្រង់អតិថិជន ការជូនដំណឹង Telegram និងច្រក SMS'}
                </p>
              </div>
            </div>
            <span className="text-xs font-mono text-slate-400">{hardwareFiltered.length} items</span>
          </div>

          <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {hardwareFiltered.map((item) => (
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
            {lang === 'en' ? `No integrations found matching "${searchQuery}"` : `រកមិនឃើញការតភ្ជាប់ដែលត្រូវនឹង "${searchQuery}" ទេ`}
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
