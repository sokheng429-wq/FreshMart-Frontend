import { Link } from 'react-router-dom'
import { useLanguage } from '../../context/LanguageContext'
import targetIcon from '../../assets/icon/3dicons-target-dynamic-color.png'
import trophyIcon from '../../assets/icon/3dicons-trophy-dynamic-color.png'
import shieldIcon from '../../assets/icon/3dicons-shield-dynamic-color.png'
import mailIcon from '../../assets/icon/3dicons-mail-dynamic-color.png'
import boyIcon from '../../assets/icon/3dicons-boy-dynamic-color.png'
import rocketIcon from '../../assets/icon/3dicons-rocket-dynamic-color.png'
import cupIcon from '../../assets/icon/3dicons-cup-dynamic-color.png'
import linkIcon from '../../assets/icon/3dicons-link-dynamic-color.png'

const INFORMATION_SECTIONS = [
  {
    categoryEn: 'Jobs & Careers',
    categoryKh: 'ការងារ និងឱកាសការងារ',
    items: [
      {
        key: 'jobs-manage',
        to: '/admin/jobs',
        icon: targetIcon,
        en: 'Manage Jobs',
        kh: 'គ្រប់គ្រងការងារ',
        descEn: 'View, edit, and manage all current job openings and postings.',
        descKh: 'មើល កែសម្រួល និងគ្រប់គ្រងឱកាសការងារដែលកំពុងជ្រើសរើស។',
        color: '#f97316',
        bg: 'rgba(249, 115, 22, 0.12)',
      },
      {
        key: 'jobs-add',
        to: '/admin/jobs/add',
        icon: rocketIcon,
        en: 'Post New Job',
        kh: 'ប្រកាសការងារថ្មី',
        descEn: 'Create a new job posting with requirements, benefits, and salary.',
        descKh: 'បង្កើតការប្រកាសការងារថ្មីជាមួយលក្ខខណ្ឌ តម្រូវការ និងប្រាក់ខែ។',
        color: '#ea580c',
        bg: 'rgba(234, 88, 12, 0.12)',
      },
      {
        key: 'applications',
        to: '/admin/applications',
        icon: mailIcon,
        en: 'Job Applications',
        kh: 'ពាក្យសុំការងារ',
        descEn: 'Review incoming resumes, candidate details, and applicant status.',
        descKh: 'ពិនិត្យប្រវត្តិរូបសង្ខេប ពាក្យសុំ និងស្ថានភាពបេក្ខជន។',
        color: '#a855f7',
        bg: 'rgba(168, 85, 247, 0.12)',
      },
    ],
  },
  {
    categoryEn: 'Company Information & Team',
    categoryKh: 'ព័ត៌មានក្រុមហ៊ុន និងក្រុមការងារ',
    items: [
      {
        key: 'members-manage',
        to: '/admin/members',
        icon: trophyIcon,
        en: 'Team Members',
        kh: 'សមាជិកក្រុម',
        descEn: 'Manage executive leadership, team members, and departments.',
        descKh: 'គ្រប់គ្រងថ្នាក់ដឹកនាំ សមាជិកក្រុម និងនាយកដ្ឋាននានា។',
        color: '#3b82f6',
        bg: 'rgba(59, 130, 246, 0.12)',
      },
      {
        key: 'members-add',
        to: '/admin/members/add',
        icon: boyIcon,
        en: 'Add Team Member',
        kh: 'បន្ថែមសមាជិក',
        descEn: 'Add new staff members, photos, positions, and contact details.',
        descKh: 'បន្ថែមបុគ្គលិកថ្មី រូបថត តួនាទី និងព័ត៌មានទំនាក់ទំនង។',
        color: '#06b6d4',
        bg: 'rgba(6, 182, 212, 0.12)',
      },
      {
        key: 'partners',
        to: '/admin/partners',
        icon: linkIcon,
        en: 'Company Partners',
        kh: 'ដៃគូសហការ',
        descEn: 'Manage official brand partners, distributors, and business alliances.',
        descKh: 'គ្រប់គ្រងដៃគូសហការផ្លូវការ អ្នកចែកចាយ និងសម្ព័ន្ធភាពអាជីវកម្ម។',
        color: '#10b981',
        bg: 'rgba(16, 185, 129, 0.12)',
      },
      {
        key: 'partners-add',
        to: '/admin/partners/add',
        icon: cupIcon,
        en: 'Add Partner',
        kh: 'បន្ថែមដៃគូ',
        descEn: 'Register a new strategic partner and display logo on storefront.',
        descKh: 'ចុះឈ្មោះដៃគូយុទ្ធសាស្ត្រថ្មី និងបង្ហាញរូបសញ្ញានៅលើគេហទំព័រ។',
        color: '#14b8a6',
        bg: 'rgba(20, 184, 166, 0.12)',
      },
    ],
  },
  {
    categoryEn: 'Users & System Access',
    categoryKh: 'អ្នកប្រើប្រាស់ និងសិទ្ធិប្រព័ន្ធ',
    items: [
      {
        key: 'users-manage',
        to: '/admin/users',
        icon: shieldIcon,
        en: 'Manage Users',
        kh: 'គ្រប់គ្រងអ្នកប្រើប្រាស់',
        descEn: 'Manage registered user accounts, assign roles, and control access permissions.',
        descKh: 'គ្រប់គ្រងគណនីអ្នកប្រើប្រាស់ កំណត់តួនាទី និងសិទ្ធិប្រើប្រាស់។',
        color: '#8b5cf6',
        bg: 'rgba(139, 92, 246, 0.12)',
      },
    ],
  },
]

const TEXTS = {
  back: { en: 'Dashboard', kh: 'ផ្ទាំងគ្រប់គ្រង' },
  eyebrow: { en: 'Workforce & Corporate Hub', kh: 'មជ្ឈមណ្ឌលព័ត៌មាន និងធនធានមនុស្ស' },
  heroTitle: { en: 'Information Side', kh: 'ផ្នែកព័ត៌មាន' },
  heroSub: {
    en: 'Central management for corporate information, job vacancies, candidate applications, team members, partners, and user permissions.',
    kh: 'ការគ្រប់គ្រងរួមនៃព័ត៌មានក្រុមហ៊ុន ឱកាសការងារ ពាក្យសុំបេក្ខជន សមាជិកក្រុម ដៃគូសហការ និងសិទ្ធិអ្នកប្រើប្រាស់។',
  },
  open: { en: 'Open', kh: 'បើក' },
}

export const InformationHub = () => {
  const { lang } = useLanguage()

  return (
    <div className="space-y-8">
      {/* Hero */}
      <section className="relative overflow-hidden rounded-3xl border border-blue-500/20 bg-gradient-to-br from-slate-800 via-slate-900 to-slate-950 p-6 shadow-2xl shadow-blue-500/10">
        <div className="pointer-events-none absolute -right-16 -top-20 h-56 w-56 rounded-full bg-blue-500/20 blur-3xl" />
        <div className="pointer-events-none absolute bottom-0 left-1/3 h-px w-2/3 bg-gradient-to-r from-transparent via-blue-400/50 to-transparent" />
        <div className="relative">
          <Link
            to="/admin"
            className="mb-5 inline-flex items-center gap-2 rounded-full border border-slate-700/70 bg-slate-950/50 px-3 py-1.5 text-xs font-bold uppercase tracking-[0.18em] text-blue-300 transition hover:border-blue-400 hover:text-blue-200"
          >
            <ChevronLeftIcon /> {TEXTS.back[lang]}
          </Link>
          <div className="flex items-center gap-4">
            <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-500/15 p-2 ring-1 ring-blue-400/30 shadow-lg shadow-blue-500/20">
              <img src={trophyIcon} alt="" className="h-9 w-9 object-contain drop-shadow-md" />
            </span>
            <div>
              <p className="text-xs font-black uppercase tracking-[0.28em] text-blue-400">{TEXTS.eyebrow[lang]}</p>
              <h1 className="mt-1 text-3xl font-black tracking-tight text-white md:text-4xl">{TEXTS.heroTitle[lang]}</h1>
            </div>
          </div>
          <p className="mt-4 max-w-2xl text-sm leading-6 text-slate-300">{TEXTS.heroSub[lang]}</p>
        </div>
      </section>

      {/* Sections */}
      {INFORMATION_SECTIONS.map((sectionGroup, idx) => (
        <section
          key={idx}
          className="rounded-3xl border border-slate-700/60 bg-slate-900/80 p-6 shadow-xl shadow-black/20"
        >
          <div className="mb-5 flex items-center justify-between border-b border-slate-800 pb-3">
            <h2 className="text-lg font-bold text-white">
              {lang === 'kh' ? sectionGroup.categoryKh : sectionGroup.categoryEn}
            </h2>
            <span className="text-xs text-slate-400">
              {sectionGroup.items.length} {lang === 'en' ? 'Modules' : 'ម៉ូឌុល'}
            </span>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {sectionGroup.items.map((item) => (
              <Link
                key={item.key}
                to={item.to}
                className="group flex flex-col rounded-2xl border border-slate-700/60 bg-slate-950/50 p-5 transition-all duration-300 hover:-translate-y-1 hover:border-slate-500 hover:bg-slate-950 hover:shadow-xl"
              >
                <span
                  className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl p-2 ring-1 ring-white/10 shadow-lg shadow-black/20"
                  style={{ background: item.bg }}
                >
                  <img
                    src={item.icon}
                    alt=""
                    className="h-9 w-9 object-contain drop-shadow-md transition-transform duration-300 group-hover:scale-110"
                  />
                </span>
                <h3 className="text-base font-black text-white">{lang === 'kh' ? item.kh : item.en}</h3>
                <p className="mt-1.5 flex-1 text-xs leading-5 text-slate-400">
                  {lang === 'kh' ? item.descKh : item.descEn}
                </p>
                <span
                  className="mt-4 inline-flex items-center gap-1.5 text-xs font-bold transition-transform group-hover:translate-x-1"
                  style={{ color: item.color }}
                >
                  {TEXTS.open[lang]} <ChevronIcon />
                </span>
              </Link>
            ))}
          </div>
        </section>
      ))}
    </div>
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

export default InformationHub
