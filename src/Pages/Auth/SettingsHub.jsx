import React, { useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { useLanguage } from '../../context/LanguageContext'
import settingIcon from '../../assets/icon/3dicons-setting-dynamic-color.png'
import mapPinIcon from '../../assets/icon/3dicons-map-pin-dynamic-color.png'
import boyIcon from '../../assets/icon/3dicons-boy-dynamic-color.png'
import keyIcon from '../../assets/icon/3dicons-key-dynamic-color.png'
import shieldIcon from '../../assets/icon/3dicons-shield-dynamic-color.png'
import toggleIcon from '../../assets/icon/3dicons-toggle-dynamic-color.png'
import paletteIcon from '../../assets/icon/3dicons-color-palette-dynamic-color.png'
import sunIcon from '../../assets/icon/3dicons-sun-dynamic-color.png'
import calculatorIcon from '../../assets/icon/3dicons-calculator-dynamic-color.png'
import folderFavIcon from '../../assets/icon/3dicons-folder-fav-dynamic-color.png'
import './ProductsHub.css'

export const BUSINESS_SETUP_MODULES = [
  {
    key: 'company',
    icon: settingIcon,
    en: 'Company Profile',
    kh: 'ព័ត៌មានក្រុមហ៊ុន',
    descEn: 'Supermarket legal business name, tax identification (VATTIN), and corporate headquarters.',
    descKh: 'ឈ្មោះពាណិជ្ជកម្មផ្លូវការ លេខសម្គាល់អ្នកជាប់ពន្ធ និងការិយាល័យកណ្តាល។',
    color: '#3B82F6',
    bg: 'rgba(59, 130, 246, 0.12)',
    category: 'business',
    tag: 'Core',
    route: '/admin/settings/company',
  },
  {
    key: 'outlet',
    icon: mapPinIcon,
    en: 'Outlets & Branches',
    kh: 'សាខា និងច្រកលក់',
    descEn: 'Configure multiple store locations, operating hours, contact numbers, and retail counters.',
    descKh: 'កំណត់ទីតាំងសាខាហាង ម៉ោងបើកបម្រើការងារ និងកុងទ័រលក់។',
    color: '#10b981',
    bg: 'rgba(16, 185, 129, 0.12)',
    category: 'business',
    tag: 'Retail',
    route: '/admin/settings/outlet',
  },
  {
    key: 'location',
    icon: folderFavIcon,
    en: 'Warehouses & Zones',
    kh: 'ឃ្លាំង និងតំបន់ស្តុក',
    descEn: 'Manage physical storage racks, cold rooms, aisles, and staging bins for fast picking.',
    descKh: 'គ្រប់គ្រងធ្នើរទុកទំនិញ បន្ទប់ត្រជាក់ និងទីតាំងរៀបចំទំនិញ។',
    color: '#06b6d4',
    bg: 'rgba(6, 182, 212, 0.12)',
    category: 'business',
    route: '/admin/settings/location',
  },
]

export const USER_ACCESS_MODULES = [
  {
    key: 'users',
    icon: boyIcon,
    en: 'Users Management',
    kh: 'គណនីអ្នកប្រើប្រាស់',
    descEn: 'Admin and cashier staff login credentials, security passwords, and account status.',
    descKh: 'គណនីចូលប្រើប្រាស់របស់អ្នកគ្រប់គ្រង និងបុគ្គលិកគិតលុយ។',
    color: '#77BC1F',
    bg: 'rgba(119, 188, 31, 0.12)',
    category: 'access',
    tag: 'Security',
    route: '/admin/settings/users',
  },
  {
    key: 'roles',
    icon: keyIcon,
    en: 'Roles & Permissions',
    kh: 'តួនាទី និងសិទ្ធិប្រើប្រាស់',
    descEn: 'Granular role-based access control: Cashier, Supervisor, Inventory Manager, and Admin.',
    descKh: 'កំណត់សិទ្ធិប្រើប្រាស់តាមតួនាទី: អ្នកគិតលុយ ប្រធានផ្នែក និងរដ្ឋបាល។',
    color: '#a855f7',
    bg: 'rgba(168, 85, 247, 0.12)',
    category: 'access',
    tag: 'RBAC',
    route: '/admin/settings/roles',
  },
  {
    key: 'security',
    icon: shieldIcon,
    en: 'Audit Log & Security',
    kh: 'កំណត់ត្រាសុវត្ថិភាព និងសវនកម្ម',
    descEn: 'Track admin actions, discount overrides, cash drawer manual open events, and IP logs.',
    descKh: 'តាមដានសកម្មភាពរបស់អ្នកគ្រប់គ្រង ការបញ្ចុះតម្លៃពិសេស និងការបើកថតលុយ។',
    color: '#ec4899',
    bg: 'rgba(236, 72, 153, 0.12)',
    category: 'access',
    route: '/admin/settings/security',
  },
]

export const SYSTEM_PREFS_MODULES = [
  {
    key: 'general',
    icon: toggleIcon,
    en: 'General Preferences',
    kh: 'ការកំណត់ទូទៅ',
    descEn: 'Barcode scanner auto-submit, receipt auto-print on checkout, and rounding rules.',
    descKh: 'ការស្កេនបារកូដស្វ័យប្រវត្តិ ការបោះពុម្ពវិក័យប័ត្រ និងការបង្គត់តម្លៃ។',
    color: '#FF9900',
    bg: 'rgba(255, 153, 0, 0.12)',
    category: 'system',
    tag: 'System',
    route: '/admin/settings/general',
  },
  {
    key: 'locale',
    icon: sunIcon,
    en: 'Language & Currency',
    kh: 'ភាសា និងរូបិយប័ណ្ណ',
    descEn: 'Dual currency exchange rate (USD $ & KHR ៛), date formatting, and default language.',
    descKh: 'អត្រាប្តូរប្រាក់ពីរ (ដុល្លារ $ និងរៀល ៛) ទម្រង់កាលបរិច្ឆេទ និងភាសាលំនាំដើម។',
    color: '#f59e0b',
    bg: 'rgba(245, 158, 11, 0.12)',
    category: 'system',
    tag: 'USD / KHR',
    route: '/admin/settings/locale',
  },
  {
    key: 'tax',
    icon: calculatorIcon,
    en: 'Tax Rates & VAT',
    kh: 'អត្រាពន្ធ និងអាករលើតម្លៃបន្ថែម (VAT)',
    descEn: '10% standard VAT, zero-rated exports, and tax invoice registration options.',
    descKh: 'អាករលើតម្លៃបន្ថែម VAT ១០% និងការកំណត់វិក័យប័ត្រពន្ធ។',
    color: '#8b5cf6',
    bg: 'rgba(139, 92, 246, 0.12)',
    category: 'system',
    route: '/admin/settings/tax',
  },
  {
    key: 'backup',
    icon: paletteIcon,
    en: 'Database & Backup',
    kh: 'បម្រុងទុកទិន្នន័យ',
    descEn: 'Automated daily database snapshot backups, cloud synchronization, and restore utilities.',
    descKh: 'ការបម្រុងទុកទិន្នន័យស្វ័យប្រវត្តិប្រចាំថ្ងៃ និងឧបករណ៍ស្តារទិន្នន័យ។',
    color: '#0ea5e9',
    bg: 'rgba(14, 165, 233, 0.12)',
    category: 'system',
    tag: 'Backup',
    route: '/admin/settings/backup',
  },
]

export const ALL_SETTINGS_MODULES = [
  ...BUSINESS_SETUP_MODULES,
  ...USER_ACCESS_MODULES,
  ...SYSTEM_PREFS_MODULES,
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

function ModuleCard({ item, lang }) {
  return (
    <Link
      to={item.route || '/admin/settings'}
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
        <span>{lang === 'kh' ? 'បើកការកំណត់' : 'Configure'}</span>
        <span className="transform transition-transform duration-200 group-hover:translate-x-1">
          <ChevronIcon />
        </span>
      </div>
    </Link>
  )
}

export default function SettingsHub() {
  const { lang } = useLanguage()
  const [searchQuery, setSearchQuery] = useState('')
  const [activeCategory, setActiveCategory] = useState('all')

  const filteredModules = useMemo(() => {
    const q = searchQuery.trim().toLowerCase()
    let list = ALL_SETTINGS_MODULES

    if (activeCategory === 'business') {
      list = BUSINESS_SETUP_MODULES
    } else if (activeCategory === 'access') {
      list = USER_ACCESS_MODULES
    } else if (activeCategory === 'system') {
      list = SYSTEM_PREFS_MODULES
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

  const businessFiltered = useMemo(
    () => filteredModules.filter((s) => s.category === 'business'),
    [filteredModules]
  )
  const accessFiltered = useMemo(
    () => filteredModules.filter((s) => s.category === 'access'),
    [filteredModules]
  )
  const systemFiltered = useMemo(
    () => filteredModules.filter((s) => s.category === 'system'),
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
                <img src={settingIcon} alt="" className="h-9 w-9 object-contain drop-shadow-md" />
              </span>
              <div>
                <p className="text-[11px] font-black uppercase tracking-[0.25em] text-cyan-400">
                  {lang === 'en' ? "FreshMart Core System Configuration" : 'ការកំណត់ប្រព័ន្ធស្នូល'}
                </p>
                <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
                  {lang === 'en' ? 'System Settings Hub' : 'មជ្ឈមណ្ឌលការកំណត់ប្រព័ន្ធ'}
                </h1>
              </div>
            </div>

            <p className="max-w-2xl text-xs sm:text-sm leading-relaxed text-slate-300">
              {lang === 'en'
                ? 'Comprehensive system administration — configure company profiles, branch outlets, user roles & permissions, exchange rates (USD/KHR), VAT tax brackets, and automated database backups.'
                : 'ការគ្រប់គ្រងប្រព័ន្ធពេញលេញ — កំណត់ព័ត៌មានក្រុមហ៊ុន សាខាហាង សិទ្ធិអ្នកប្រើប្រាស់ អត្រាប្តូរប្រាក់ (USD/KHR) អាករ VAT និងការបម្រុងទុកទិន្នន័យ។'}
            </p>
          </div>

          {/* Quick Stats Widget */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-2 lg:flex lg:flex-col shrink-0 min-w-[220px]">
            <div className="rounded-2xl border border-slate-800 bg-slate-950/80 p-3.5 shadow-md">
              <div className="flex items-center justify-between text-[11px] text-slate-400">
                <span>{lang === 'en' ? 'Settings Modules' : 'ម៉ូឌុលការកំណត់'}</span>
                <span className="text-cyan-400">● Active</span>
              </div>
              <p className="mt-1 font-mono text-2xl font-black text-white">
                {ALL_SETTINGS_MODULES.length}
              </p>
            </div>

            <div className="rounded-2xl border border-slate-800 bg-slate-950/80 p-3.5 shadow-md">
              <div className="flex items-center justify-between text-[11px] text-slate-400">
                <span>{lang === 'en' ? 'System Health' : 'សុខភាពប្រព័ន្ធ'}</span>
                <span className="text-emerald-400">● Optimal</span>
              </div>
              <p className="mt-1 font-mono text-xs font-semibold text-slate-300">
                Protected & Secured
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
                ? 'Search company, outlets, users, roles, tax, backup...'
                : 'ស្វែងរកក្រុមហ៊ុន សាខា អ្នកប្រើប្រាស់ តួនាទី ពន្ធ...'
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
            { key: 'all', en: 'All Settings', kh: 'ទាំងអស់', count: ALL_SETTINGS_MODULES.length },
            { key: 'business', en: 'Business Setup', kh: 'អាជីវកម្ម', count: BUSINESS_SETUP_MODULES.length },
            { key: 'access', en: 'Users & Roles', kh: 'អ្នកប្រើ និងសិទ្ធិ', count: USER_ACCESS_MODULES.length },
            { key: 'system', en: 'System & Tax', kh: 'ប្រព័ន្ធ និងពន្ធ', count: SYSTEM_PREFS_MODULES.length },
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
      {(!searchQuery || 'company profile'.includes(searchQuery.toLowerCase())) && (
        <Link
          to="/admin/settings/company"
          className="group relative overflow-hidden flex flex-col gap-3 rounded-2xl border border-cyan-500/40 bg-gradient-to-r from-cyan-500/15 via-teal-500/10 to-slate-900/60 p-4 sm:p-5 transition-all duration-300 hover:-translate-y-1 hover:border-cyan-400 hover:shadow-xl hover:shadow-cyan-500/10 sm:flex-row sm:items-center sm:justify-between"
        >
          <div className="flex items-center gap-3.5">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-cyan-500/20 text-2xl ring-1 ring-cyan-400/40 shadow-md">
              🏢
            </span>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-black text-white font-['Montserrat']">
                  {lang === 'en' ? 'Supermarket Company Configuration' : 'ការកំណត់ព័ត៌មានក្រុមហ៊ុនផ្សារទំនើប'}
                </h3>
                <span className="rounded-full bg-cyan-500 px-2 py-0.5 text-[10px] font-black text-slate-950 uppercase tracking-wider">
                  Master Config
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5 max-w-xl">
                {lang === 'en'
                  ? 'Update business registration, tax IDs, brand logos, exchange rates, and branch communication channels.'
                  : 'កែប្រែព័ត៌មានចុះបញ្ជីអាជីវកម្ម លេខពន្ធ ស្លាកសញ្ញាម៉ាក អត្រាប្តូរប្រាក់ និងទំនាក់ទំនងសាខា។'}
              </p>
            </div>
          </div>

          <span className="inline-flex items-center gap-1.5 self-start sm:self-center text-xs font-bold text-cyan-300 transition-transform group-hover:translate-x-1 shrink-0">
            <span>{lang === 'en' ? 'Configure Company' : 'កំណត់ក្រុមហ៊ុន'}</span>
            <ChevronIcon />
          </span>
        </Link>
      )}

      {/* 4. BUSINESS SETUP SECTION */}
      {businessFiltered.length > 0 && (
        <section className="rounded-3xl border border-slate-800 bg-slate-900/80 p-5 sm:p-6 shadow-xl shadow-black/20 space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800/80">
            <div className="flex items-center gap-3">
              <div className="h-5 w-1.5 rounded-full bg-cyan-500" />
              <div>
                <h2 className="text-base font-bold text-white font-['Montserrat']">
                  {lang === 'en' ? 'Business Setup & Outlets' : 'ការកំណត់អាជីវកម្ម និងសាខា'}
                </h2>
                <p className="text-[11px] text-slate-400">
                  {lang === 'en' ? 'Company legal details, retail branches, and warehouse storage locations' : 'ព័ត៌មានច្បាប់ក្រុមហ៊ុន សាខាលក់រាយ និងទីតាំងស្តុកឃ្លាំង'}
                </p>
              </div>
            </div>
            <span className="text-xs font-mono text-slate-400">{businessFiltered.length} items</span>
          </div>

          <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 lg:grid-cols-3">
            {businessFiltered.map((item) => (
              <ModuleCard key={item.key} item={item} lang={lang} />
            ))}
          </div>
        </section>
      )}

      {/* 5. USER ACCESS SECTION */}
      {accessFiltered.length > 0 && (
        <section className="rounded-3xl border border-slate-800 bg-slate-900/80 p-5 sm:p-6 shadow-xl shadow-black/20 space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800/80">
            <div className="flex items-center gap-3">
              <div className="h-5 w-1.5 rounded-full bg-[#77BC1F]" />
              <div>
                <h2 className="text-base font-bold text-white font-['Montserrat']">
                  {lang === 'en' ? 'User Accounts & Access Control' : 'អ្នកប្រើប្រាស់ និងការគ្រប់គ្រងសិទ្ធិ'}
                </h2>
                <p className="text-[11px] text-slate-400">
                  {lang === 'en'
                    ? 'Staff login accounts, RBAC permission matrices, and security audit logs'
                    : 'គណនីបុគ្គលិក តារាងសិទ្ធិប្រើប្រាស់ និងកំណត់ត្រាសវនកម្មសុវត្ថិភាព'}
                </p>
              </div>
            </div>
            <span className="text-xs font-mono text-slate-400">{accessFiltered.length} items</span>
          </div>

          <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 lg:grid-cols-3">
            {accessFiltered.map((item) => (
              <ModuleCard key={item.key} item={item} lang={lang} />
            ))}
          </div>
        </section>
      )}

      {/* 6. SYSTEM PREFS SECTION */}
      {systemFiltered.length > 0 && (
        <section className="rounded-3xl border border-slate-800 bg-slate-900/80 p-5 sm:p-6 shadow-xl shadow-black/20 space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800/80">
            <div className="flex items-center gap-3">
              <div className="h-5 w-1.5 rounded-full bg-[#FF9900]" />
              <div>
                <h2 className="text-base font-bold text-white font-['Montserrat']">
                  {lang === 'en' ? 'System Preferences & Taxes' : 'ការកំណត់ប្រព័ន្ធ និងពន្ធដារ'}
                </h2>
                <p className="text-[11px] text-slate-400">
                  {lang === 'en'
                    ? 'General checkout rules, USD/KHR currencies, VAT tax rates, and database backup routines'
                    : 'លក្ខខណ្ឌគិតលុយ រូបិយប័ណ្ណ ដុល្លារ/រៀល អត្រាពន្ធ VAT និងការបម្រុងទុកទិន្នន័យ'}
                </p>
              </div>
            </div>
            <span className="text-xs font-mono text-slate-400">{systemFiltered.length} items</span>
          </div>

          <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {systemFiltered.map((item) => (
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
            {lang === 'en' ? `No settings found matching "${searchQuery}"` : `រកមិនឃើញការកំណត់ដែលត្រូវនឹង "${searchQuery}" ទេ`}
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
