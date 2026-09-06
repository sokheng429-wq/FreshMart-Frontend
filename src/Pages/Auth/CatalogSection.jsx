import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useLanguage } from '../../context/LanguageContext'
import { ALL_CATALOG_SECTIONS } from './ProductsHub'
import './CatalogSection.css'

// Generic landing page for one catalog sub-section (groups, categories,
// brands, units, attributes, suppliers, supplier-groups). Renders the
// section identity plus an empty state until real CRUD is wired up.
export const CatalogSection = () => {
  const { lang } = useLanguage()
  const location = useLocation()
  // "Add <thing>" jumps into the real product form (only meaningful for
  // product-like sections); other sections just stay on their page.
  const navigate = useNavigate()
  const key = location.pathname.split('/').pop()
  const section = ALL_CATALOG_SECTIONS.find((item) => item.key === key)

  if (!section) {
    return (
      <div className="rounded-3xl border border-slate-700/60 bg-slate-900/80 p-12 text-center">
        <span className="text-4xl">🔍</span>
        <p className="mt-3 text-sm text-slate-400">
          {lang === 'en' ? 'Unknown catalog section.' : 'ផ្នែកកាតាឡុកមិនស្គាល់។'}
        </p>
        <Link to="/admin/products" className="mt-4 inline-block rounded-xl border border-slate-700 px-4 py-2 text-sm font-bold text-slate-300 transition hover:border-green-400 hover:text-green-300">
          {TEXTS.backToHub[lang]}
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Hero */}
      <section className="relative overflow-hidden rounded-3xl border bg-gradient-to-br from-slate-800 via-slate-900 to-slate-950 p-6 shadow-2xl"
        style={{ borderColor: `${section.color}33`, boxShadow: `0 25px 50px -12px ${section.color}1a` }}
      >
        <div className="pointer-events-none absolute -right-16 -top-20 h-56 w-56 rounded-full blur-3xl" style={{ background: `${section.color}33` }} />
        <div className="relative">
          <Link to="/admin/products" className="mb-5 inline-flex items-center gap-2 rounded-full border border-slate-700/70 bg-slate-950/50 px-3 py-1.5 text-xs font-bold uppercase tracking-[0.18em] transition hover:bg-slate-950"
            style={{ color: section.color }}
          >
            <ChevronLeftIcon /> {TEXTS.hub[lang]}
          </Link>
          <div className="flex items-center gap-4">
            <span className="flex h-14 w-14 items-center justify-center rounded-2xl text-3xl ring-1 ring-white/10" style={{ background: section.bg }}>
              {section.icon}
            </span>
            <div>
              <p className="text-xs font-black uppercase tracking-[0.28em]" style={{ color: section.color }}>FreshMart catalog</p>
              <h1 className="mt-1 text-3xl font-black tracking-tight text-white md:text-4xl">{lang === 'kh' ? section.kh : section.en}</h1>
            </div>
          </div>
          <p className="mt-4 max-w-2xl text-sm leading-6 text-slate-300">{lang === 'kh' ? section.descKh : section.descEn}</p>
        </div>
      </section>

      {/* Empty state */}
      <section className="rounded-3xl border border-slate-700/60 bg-slate-900/80 p-6 shadow-xl shadow-black/20">
        <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-slate-700 bg-slate-950/40 p-12 text-center">
          <span className="text-5xl">{section.icon}</span>
          <h2 className="text-lg font-black text-white">{lang === 'en' ? `No ${section.en.toLowerCase()} yet` : `មិនទាន់មាន${section.kh}ទេ`}</h2>
          <p className="max-w-md text-sm leading-6 text-slate-400">
            {lang === 'en'
              ? 'This section is ready for data. Connect it to the backend or add records to see them listed here.'
              : 'ផ្នែកនេះត្រៀមរួចរាល់សម្រាប់ទិន្នន័យ។ ភ្ជាប់វាទៅម៉ាស៊ីនមេ ឬបន្ថែមទិន្នន័យដើម្បីមើលវានៅទីនេះ។'}
          </p>
          <button
            type="button"
            onClick={() => navigate('/admin/products/add')}
            className="mt-2 inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-black text-slate-950 shadow-lg transition hover:-translate-y-0.5"
            style={{ background: section.color }}
          >
            <PlusIcon /> {lang === 'en' ? `Add ${section.en.replace(/s$/, '')}` : `បន្ថែម${section.kh}`}
          </button>
        </div>
      </section>
    </div>
  )
}

const TEXTS = {
  hub: { en: 'All sections', kh: 'ផ្នែកទាំងអស់' },
  backToHub: { en: 'Back to sections', kh: 'ត្រឡប់ទៅផ្នែក' },
}

const ChevronLeftIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
    <polyline points="15 18 9 12 15 6" />
  </svg>
)

const PlusIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
    <line x1="12" y1="5" x2="12" y2="19" />
    <line x1="5" y1="12" x2="19" y2="12" />
  </svg>
)

export default CatalogSection
