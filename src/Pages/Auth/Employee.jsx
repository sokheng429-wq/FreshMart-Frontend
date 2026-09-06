import React, { useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { useLanguage } from '../../context/LanguageContext'
import boyIcon from '../../assets/icon/3dicons-boy-dynamic-color.png'
import girlIcon from '../../assets/icon/3dicons-girl-dynamic-color.png'
import folderFavIcon from '../../assets/icon/3dicons-folder-fav-dynamic-color.png'
import bookmarkIcon from '../../assets/icon/3dicons-bookmark-fav-dynamic-color.png'
import starIcon from '../../assets/icon/3dicons-star-dynamic-color.png'
import calendarIcon from '../../assets/icon/3dicons-calendar-dynamic-color.png'
import crownIcon from '../../assets/icon/3dicons-crown-dynamic-color.png'
import clockIcon from '../../assets/icon/3dicons-clock-dynamic-color.png'
import './ProductsHub.css'

export const STAFF_DIRECTORY_MODULES = [
  {
    key: 'employee-list',
    icon: boyIcon,
    en: 'Employee Profiles',
    kh: 'បុគ្គលិកទាំងអស់',
    descEn: 'Full staff database, employment contracts, contact details, and ID badges.',
    descKh: 'ទិន្នន័យបុគ្គលិកពេញលេញ កិច្ចសន្យាការងារ ព័ត៌មានទំនាក់ទំនង និងកាតសម្គាល់។',
    color: '#3B82F6',
    bg: 'rgba(59, 130, 246, 0.12)',
    category: 'staff',
    tag: 'Directory',
    route: '/admin/employee/list',
  },
  {
    key: 'attendance',
    icon: clockIcon,
    en: 'Attendance & Shifts',
    kh: 'វត្តមាន និងវេនការងារ',
    descEn: 'Biometric fingerprint logs, shift scheduling, clock in/out, and overtime records.',
    descKh: 'កំណត់ត្រាស្កេនមេដៃ កាលវិភាគវេនការងារ និងម៉ោងបន្ថែម។',
    color: '#77BC1F',
    bg: 'rgba(119, 188, 31, 0.12)',
    category: 'staff',
    tag: 'Live Logs',
    route: '/admin/employee',
  },
  {
    key: 'payroll-summary',
    icon: calendarIcon,
    en: 'Payroll & Allowances',
    kh: 'ប្រាក់បៀវត្សរ៍ និងប្រាក់ឧបត្ថម្ភ',
    descEn: 'Monthly salary calculation, NSSF social security, commission, and pay slips.',
    descKh: 'គណនាប្រាក់ខែប្រចាំខែ ប.ស.ស កម្រៃជើងសារ និងប័ណ្ណបើកប្រាក់ខែ។',
    color: '#FF9900',
    bg: 'rgba(255, 153, 0, 0.12)',
    category: 'staff',
    route: '/admin/employee',
  },
]

export const ORG_STRUCTURE_MODULES = [
  {
    key: 'office',
    icon: folderFavIcon,
    en: 'Office Locations',
    kh: 'ការិយាល័យ និងសាខា',
    descEn: 'Define supermarket retail branches, central offices, and regional warehouses.',
    descKh: 'កំណត់សាខាហាងលក់រាយ ការិយាល័យកណ្តាល និងឃ្លាំងប្រចាំតំបន់។',
    color: '#a855f7',
    bg: 'rgba(168, 85, 247, 0.12)',
    category: 'org',
    tag: 'Structure',
    route: '/admin/employee/office',
  },
  {
    key: 'department',
    icon: bookmarkIcon,
    en: 'Departments',
    kh: 'ដេប៉ាតឺម៉ង់ / ផ្នែកធំ',
    descEn: 'Manage business units (Procurement, Operations, Sales, Finance, IT & HR).',
    descKh: 'គ្រប់គ្រងផ្នែកអាជីវកម្ម (លទ្ធកម្ម ប្រតិបត្តិការ លក់ ហិរញ្ញវត្ថុ IT និងធនធានមនុស្ស)។',
    color: '#06b6d4',
    bg: 'rgba(6, 182, 212, 0.12)',
    category: 'org',
    tag: 'Core',
    route: '/admin/employee/department',
  },
  {
    key: 'section',
    icon: starIcon,
    en: 'Sections & Teams',
    kh: 'ផ្នែកការងារ និងក្រុម',
    descEn: 'Sub-divisions: Butchery, Bakery, Produce, Cashier Squad, and Fleet Dispatch.',
    descKh: 'ផ្នែករង: សាច់ នំបុ័ង បន្លែផ្លែឈើ ក្រុមគិតលុយ និងក្រុមដឹកជញ្ជូន។',
    color: '#10b981',
    bg: 'rgba(16, 185, 129, 0.12)',
    category: 'org',
    route: '/admin/employee/section',
  },
  {
    key: 'position',
    icon: crownIcon,
    en: 'Job Positions',
    kh: 'មុខតំណែង',
    descEn: 'Hierarchy levels: Store Manager, Supervisor, Cashier, Stock Keeper, and Driver.',
    descKh: 'កម្រិតតំណែង: អ្នកគ្រប់គ្រងហាង ប្រធានផ្នែក អ្នកគិតលុយ បុគ្គលិកស្តុក និងអ្នកបើកបរ។',
    color: '#ec4899',
    bg: 'rgba(236, 72, 153, 0.12)',
    category: 'org',
    tag: 'Hierarchy',
    route: '/admin/employee/position',
  },
]

export const ALL_EMPLOYEE_MODULES = [...STAFF_DIRECTORY_MODULES, ...ORG_STRUCTURE_MODULES]

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
      to={item.route || '/admin/employee'}
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
          <h3 className="text-sm sm:text-base font-bold text-white tracking-tight group-hover:text-indigo-300 transition-colors font-['Montserrat']">
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

export default function Employee() {
  const { lang } = useLanguage()
  const [searchQuery, setSearchQuery] = useState('')
  const [activeCategory, setActiveCategory] = useState('all')

  const filteredModules = useMemo(() => {
    const q = searchQuery.trim().toLowerCase()
    let list = ALL_EMPLOYEE_MODULES

    if (activeCategory === 'staff') {
      list = STAFF_DIRECTORY_MODULES
    } else if (activeCategory === 'org') {
      list = ORG_STRUCTURE_MODULES
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

  const staffFiltered = useMemo(
    () => filteredModules.filter((s) => s.category === 'staff'),
    [filteredModules]
  )
  const orgFiltered = useMemo(
    () => filteredModules.filter((s) => s.category === 'org'),
    [filteredModules]
  )

  return (
    <div className="space-y-6 text-slate-100" style={{ fontFamily: 'Montserrat, sans-serif' }}>
      {/* 1. HERO BANNER */}
      <section className="relative overflow-hidden rounded-3xl border border-indigo-500/20 bg-gradient-to-br from-[#1e293b] via-[#0f172a] to-[#0b0f17] p-5 sm:p-7 shadow-2xl shadow-indigo-500/10">
        <div className="pointer-events-none absolute -right-16 -top-20 h-64 w-64 rounded-full bg-indigo-500/15 blur-3xl" />
        <div className="pointer-events-none absolute bottom-0 left-1/4 h-px w-2/3 bg-gradient-to-r from-transparent via-indigo-500/40 to-transparent" />

        <div className="relative flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-4">
            <Link
              to="/admin"
              className="inline-flex items-center gap-2 rounded-full border border-slate-700/80 bg-slate-950/60 px-3.5 py-1.5 text-xs font-bold uppercase tracking-[0.18em] text-indigo-300 transition hover:border-indigo-400 hover:text-white active:scale-95"
            >
              <ChevronLeftIcon /> {lang === 'en' ? 'Dashboard' : 'ផ្ទាំងគ្រប់គ្រង'}
            </Link>

            <div className="flex items-center gap-3.5">
              <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-indigo-500/15 p-2 ring-1 ring-indigo-500/30 shadow-lg shadow-indigo-500/20">
                <img src={boyIcon} alt="" className="h-9 w-9 object-contain drop-shadow-md" />
              </span>
              <div>
                <p className="text-[11px] font-black uppercase tracking-[0.25em] text-indigo-400">
                  {lang === 'en' ? "FreshMart Human Resources & Teams" : 'ធនធានមនុស្ស និងបុគ្គលិក'}
                </p>
                <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
                  {lang === 'en' ? 'Employee & HR Hub' : 'មជ្ឈមណ្ឌលគ្រប់គ្រងបុគ្គលិក'}
                </h1>
              </div>
            </div>

            <p className="max-w-2xl text-xs sm:text-sm leading-relaxed text-slate-300">
              {lang === 'en'
                ? 'Human resources and corporate directory — manage staff profiles, biometric shift attendance, organizational offices, departments, specialized work sections, and job positions.'
                : 'គ្រប់គ្រងធនធានមនុស្ស និងរចនាសម្ព័ន្ធស្ថាប័ន — គ្រប់គ្រងប្រវត្តិរូបបុគ្គលិក វត្តមានស្កេនមេដៃ ការិយាល័យសាខា ដេប៉ាតឺម៉ង់ ផ្នែកការងារ និងមុខតំណែង។'}
            </p>
          </div>

          {/* Quick Stats Widget */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-2 lg:flex lg:flex-col shrink-0 min-w-[220px]">
            <div className="rounded-2xl border border-slate-800 bg-slate-950/80 p-3.5 shadow-md">
              <div className="flex items-center justify-between text-[11px] text-slate-400">
                <span>{lang === 'en' ? 'HR Modules' : 'ម៉ូឌុលធនធានមនុស្ស'}</span>
                <span className="text-indigo-400">● Live</span>
              </div>
              <p className="mt-1 font-mono text-2xl font-black text-white">
                {ALL_EMPLOYEE_MODULES.length}
              </p>
            </div>

            <div className="rounded-2xl border border-slate-800 bg-slate-950/80 p-3.5 shadow-md">
              <div className="flex items-center justify-between text-[11px] text-slate-400">
                <span>{lang === 'en' ? 'Team Sync' : 'រចនាសម្ព័ន្ធក្រុម'}</span>
                <span className="text-emerald-400">● Configured</span>
              </div>
              <p className="mt-1 font-mono text-xs font-semibold text-slate-300">
                Multi-Branch Support
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
                ? 'Search employees, offices, departments, positions, attendance...'
                : 'ស្វែងរកបុគ្គលិក ការិយាល័យ ដេប៉ាតឺម៉ង់ មុខតំណែង...'
            }
            className="w-full rounded-xl border border-slate-700/80 bg-slate-950/90 py-2 pl-9 pr-8 text-xs font-semibold text-white placeholder-slate-500 outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-400/20"
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
            { key: 'all', en: 'All Modules', kh: 'ទាំងអស់', count: ALL_EMPLOYEE_MODULES.length },
            { key: 'staff', en: 'Staff & Attendance', kh: 'បុគ្គលិក និងវត្តមាន', count: STAFF_DIRECTORY_MODULES.length },
            { key: 'org', en: 'Org Structure', kh: 'រចនាសម្ព័ន្ធស្ថាប័ន', count: ORG_STRUCTURE_MODULES.length },
          ].map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveCategory(tab.key)}
              className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold transition whitespace-nowrap active:scale-95 ${
                activeCategory === tab.key
                  ? 'bg-indigo-500 text-white shadow-md shadow-indigo-500/20 font-black'
                  : 'bg-slate-900/80 text-slate-400 border border-slate-700/60 hover:text-white hover:border-slate-500'
              }`}
            >
              <span>{lang === 'kh' ? tab.kh : tab.en}</span>
              <span
                className={`rounded-full px-1.5 py-0.2 text-[10px] font-mono ${
                  activeCategory === tab.key ? 'bg-slate-950 text-indigo-300' : 'bg-slate-800 text-slate-400'
                }`}
              >
                {tab.count}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* 3. FEATURED ACTION CARD */}
      {(!searchQuery || 'employee'.includes(searchQuery.toLowerCase())) && (
        <Link
          to="/admin/employee/list"
          className="group relative overflow-hidden flex flex-col gap-3 rounded-2xl border border-indigo-500/40 bg-gradient-to-r from-indigo-500/15 via-purple-500/10 to-slate-900/60 p-4 sm:p-5 transition-all duration-300 hover:-translate-y-1 hover:border-indigo-400 hover:shadow-xl hover:shadow-indigo-500/10 sm:flex-row sm:items-center sm:justify-between"
        >
          <div className="flex items-center gap-3.5">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-indigo-500/20 text-2xl ring-1 ring-indigo-400/40 shadow-md">
              👥
            </span>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-black text-white font-['Montserrat']">
                  {lang === 'en' ? 'Employee Master Directory' : 'បញ្ជីបុគ្គលិកមេ'}
                </h3>
                <span className="rounded-full bg-indigo-500 px-2 py-0.5 text-[10px] font-black text-white uppercase tracking-wider">
                  Full Roster
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5 max-w-xl">
                {lang === 'en'
                  ? 'Access full employee records, assign supermarket departments, manage compensation packages, and set system login privileges.'
                  : 'ចូលមើលកំណត់ត្រាបុគ្គលិកពេញលេញ ចាត់ចែងដេប៉ាតឺម៉ង់ និងកំណត់សិទ្ធិប្រើប្រាស់ប្រព័ន្ធ។'}
              </p>
            </div>
          </div>

          <span className="inline-flex items-center gap-1.5 self-start sm:self-center text-xs font-bold text-indigo-300 transition-transform group-hover:translate-x-1 shrink-0">
            <span>{lang === 'en' ? 'Open Roster' : 'បើកបញ្ជី'}</span>
            <ChevronIcon />
          </span>
        </Link>
      )}

      {/* 4. STAFF DIRECTORY SECTION */}
      {staffFiltered.length > 0 && (
        <section className="rounded-3xl border border-slate-800 bg-slate-900/80 p-5 sm:p-6 shadow-xl shadow-black/20 space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800/80">
            <div className="flex items-center gap-3">
              <div className="h-5 w-1.5 rounded-full bg-indigo-500" />
              <div>
                <h2 className="text-base font-bold text-white font-['Montserrat']">
                  {lang === 'en' ? 'Staff Directory & Attendance' : 'បញ្ជីបុគ្គលិក និងការតាមដានវត្តមាន'}
                </h2>
                <p className="text-[11px] text-slate-400">
                  {lang === 'en' ? 'Employee master profiles, shift attendance, and payroll records' : 'ប្រវត្តិរូបបុគ្គលិក វត្តមានការងារ និងប្រាក់បៀវត្សរ៍'}
                </p>
              </div>
            </div>
            <span className="text-xs font-mono text-slate-400">{staffFiltered.length} items</span>
          </div>

          <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 lg:grid-cols-3">
            {staffFiltered.map((item) => (
              <ModuleCard key={item.key} item={item} lang={lang} />
            ))}
          </div>
        </section>
      )}

      {/* 5. ORG STRUCTURE SECTION */}
      {orgFiltered.length > 0 && (
        <section className="rounded-3xl border border-slate-800 bg-slate-900/80 p-5 sm:p-6 shadow-xl shadow-black/20 space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800/80">
            <div className="flex items-center gap-3">
              <div className="h-5 w-1.5 rounded-full bg-[#77BC1F]" />
              <div>
                <h2 className="text-base font-bold text-white font-['Montserrat']">
                  {lang === 'en' ? 'Organizational Structure' : 'រចនាសម្ព័ន្ធស្ថាប័ន'}
                </h2>
                <p className="text-[11px] text-slate-400">
                  {lang === 'en'
                    ? 'Branch offices, corporate departments, operational sections, and job titles'
                    : 'សាខាការិយាល័យ ដេប៉ាតឺម៉ង់ ផ្នែកការងារ និងមុខតំណែង'}
                </p>
              </div>
            </div>
            <span className="text-xs font-mono text-slate-400">{orgFiltered.length} items</span>
          </div>

          <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {orgFiltered.map((item) => (
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
