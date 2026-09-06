import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useLanguage } from '../../context/LanguageContext'
import { useNotifications } from '../../context/NotificationContext'
import './AddPartner.css'

const CATEGORY_OPTIONS = [
  { key: 'fresh', icon: '🥬', en: 'Fruits & Vegetables', kh: 'ផ្លែឈើ និងបន្លែ' },
  { key: 'dairy', icon: '🥛', en: 'Dairy & Eggs', kh: 'ទឹកដោះគោ និងស៊ុត' },
  { key: 'bakery', icon: '🥖', en: 'Bakery', kh: 'នំបុ័ង' },
  { key: 'meat', icon: '🥩', en: 'Meat & Seafood', kh: 'សាច់ និងគ្រឿងសមុទ្រ' },
  { key: 'drinks', icon: '🧃', en: 'Drinks', kh: 'ភេសជ្ជៈ' },
  { key: 'pantry', icon: '🍚', en: 'Grains & Pantry', kh: 'គ្រាប់ធញ្ញជាតិ និងគ្រឿងទេស' },
  { key: 'snacks', icon: '🍿', en: 'Pantry & Snacks', kh: 'អាហារសម្រន់' },
]

const COLOR_PRESETS = [
  '#06b6d4', '#22d3ee', '#77BC1F', '#FF9900', '#3b82f6', '#8b5cf6',
  '#14b8a6', '#22c55e', '#f59e0b', '#ef4444', '#ec4899', '#64748b',
]

const EMPTY_FORM = {
  name: '',
  catKey: 'fresh',
  categoryEn: '',
  categoryKh: '',
  since: new Date().getFullYear(),
  color: COLOR_PRESETS[0],
  regionEn: '',
  regionKh: '',
  suppliesEn: '',
  suppliesKh: '',
}

const TEXTS = {
  heroTitle: { en: 'Partner network', kh: 'បណ្ដាញដៃគូ' },
  heroSub: {
    en: 'Add farms, producers, and suppliers that keep B\'Groceries stocked with fresh local goods.',
    kh: 'បន្ថែមកសិដ្ឋាន អ្នកផលិត និងអ្នកផ្គត់ផ្គង់ដែលផ្គត់ផ្គង់ទំនិញស្រស់ក្នុងស្រុក។',
  },
  formTitle: { en: 'Partner details', kh: 'ព័ត៌មានដៃគូ' },
  formSub: {
    en: 'Use bilingual labels so the partner card reads naturally in the public directory.',
    kh: 'ប្រើស្លាកជាពីរភាសា ដើម្បីឱ្យកាតដៃគូអាចបង្ហាញបានល្អក្នុងបញ្ជីសាធារណៈ។',
  },
  name: { en: 'Partner name', kh: 'ឈ្មោះដៃគូ' },
  namePlaceholder: { en: 'e.g. Mekong Farms', kh: 'ឧ. Mekong Farms' },
  category: { en: 'Category type', kh: 'ប្រភេទ' },
  categoryPlaceholder: { en: 'Select category type', kh: 'ជ្រើសរើសប្រភេទ' },
  categoryEn: { en: 'Category label (English)', kh: 'ឈ្មោះប្រភេទ (អង់គ្លេស)' },
  categoryKh: { en: 'Category label (Khmer)', kh: 'ឈ្មោះប្រភេទ (ខ្មែរ)' },
  since: { en: 'Partner since', kh: 'ជាដៃគូតាំងពី' },
  color: { en: 'Badge color', kh: 'ពណ៌ស្លាកសញ្ញា' },
  regionEn: { en: 'Region (English)', kh: 'តំបន់ (អង់គ្លេស)' },
  regionKh: { en: 'Region (Khmer)', kh: 'តំបន់ (ខ្មែរ)' },
  regionPlaceholderEn: { en: 'e.g. Kampot', kh: 'ឧ. Kampot' },
  regionPlaceholderKh: { en: 'e.g. កំពត', kh: 'ឧ. កំពត' },
  suppliesEn: { en: 'Supplies (English)', kh: 'ទំនិញ (អង់គ្លេស)' },
  suppliesKh: { en: 'Supplies (Khmer)', kh: 'ទំនិញ (ខ្មែរ)' },
  suppliesHint: { en: 'Separate each supply with a comma.', kh: 'បំបែកទំនិញនីមួយៗដោយសញ្ញាក្បៀស។' },
  suppliesPlaceholderEn: { en: 'Leafy greens, Seasonal fruit, Herbs', kh: 'Leafy greens, Seasonal fruit, Herbs' },
  suppliesPlaceholderKh: { en: 'បន្លែស្លឹក, ផ្លែឈើតាមរដូវ, ជីរនាងវង', kh: 'បន្លែស្លឹក, ផ្លែឈើតាមរដូវ, ជីរនាងវង' },
  addBtn: { en: 'Add partner', kh: 'បន្ថែមដៃគូ' },
  updateBtn: { en: 'Save partner', kh: 'រក្សាទុកដៃគូ' },
  cancelBtn: { en: 'Cancel edit', kh: 'បោះបង់ការកែប្រែ' },
  required: { en: 'Required', kh: 'ត្រូវការ' },
  optional: { en: 'Optional', kh: 'មិនចាំបាច់' },
  errName: { en: 'Partner name is required', kh: 'ត្រូវការឈ្មោះដៃគូ' },
  errCategoryEn: { en: 'English category label is required', kh: 'ត្រូវការឈ្មោះប្រភេទជាអង់គ្លេស' },
  errCategoryKh: { en: 'Khmer category label is required', kh: 'ត្រូវការឈ្មោះប្រភេទជាខ្មែរ' },
  errRegionEn: { en: 'English region is required', kh: 'ត្រូវការតំបន់ជាអង់គ្លេស' },
  errRegionKh: { en: 'Khmer region is required', kh: 'ត្រូវការតំបន់ជាខ្មែរ' },
  listTitle: { en: 'Partner queue', kh: 'បញ្ជីដៃគូ' },
  empty: { en: 'No partners yet. Add the first supplier and it will appear here for quick edits.', kh: 'មិនទាន់មានដៃគូទេ។ បន្ថែមអ្នកផ្គត់ផ្គង់ដំបូង ហើយវានឹងបង្ហាញនៅទីនេះ។' },
  viewPage: { en: 'View partners page', kh: 'មើលទំព័រដៃគូ' },
  remove: { en: 'Remove', kh: 'លុប' },
  edit: { en: 'Edit', kh: 'កែប្រែ' },
  back: { en: 'Dashboard', kh: 'ផ្ទាំងគ្រប់គ្រង' },
  livePreview: { en: 'Live preview', kh: 'មើលជាមុន' },
  unnamed: { en: 'New partner', kh: 'ដៃគូថ្មី' },
  items: { en: 'Partners', kh: 'ដៃគូ' },
  categories: { en: 'Categories', kh: 'ប្រភេទ' },
  withSupplies: { en: 'With supplies', kh: 'មានទំនិញ' },
  withRegion: { en: 'With region', kh: 'មានតំបន់' },
  previewSince: { en: 'Partner since', kh: 'ដៃគូតាំងពី' },
}

const toList = (str) => str.split(',').map((s) => s.trim()).filter(Boolean)

const initials = (name) =>
  name.trim() ? name.trim().split(/\s+/).map((w) => w[0]).slice(0, 2).join('').toUpperCase() : 'BG'

export const AddPartner = () => {
  const { lang } = useLanguage()
  const { addNotification } = useNotifications()
  const [form, setForm] = useState(EMPTY_FORM)
  const [errors, setErrors] = useState({})
  const [partners, setPartners] = useState([])
  const [editingId, setEditingId] = useState(null)

  const handleChange = (e) => {
    const { name, value } = e.target
    setForm((prev) => ({ ...prev, [name]: value }))
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: '' }))
  }

  const validate = () => {
    const e = {}
    if (!form.name.trim()) e.name = TEXTS.errName[lang]
    if (!form.categoryEn.trim()) e.categoryEn = TEXTS.errCategoryEn[lang]
    if (!form.categoryKh.trim()) e.categoryKh = TEXTS.errCategoryKh[lang]
    if (!form.regionEn.trim()) e.regionEn = TEXTS.errRegionEn[lang]
    if (!form.regionKh.trim()) e.regionKh = TEXTS.errRegionKh[lang]
    return e
  }

  const startEdit = (partner) => {
    setEditingId(partner.id)
    setForm({
      name: partner.name,
      catKey: partner.catKey,
      categoryEn: partner.category.en,
      categoryKh: partner.category.kh,
      since: partner.since,
      color: partner.color,
      regionEn: partner.region.en,
      regionKh: partner.region.kh,
      suppliesEn: partner.supplies.en.join(', '),
      suppliesKh: partner.supplies.kh.join(', '),
    })
    setErrors({})
  }

  const cancelEdit = () => {
    setEditingId(null)
    setForm(EMPTY_FORM)
    setErrors({})
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    const v = validate()
    setErrors(v)

    if (Object.keys(v).length === 0) {
      const partnerData = {
        name: form.name.trim(),
        catKey: form.catKey,
        category: { en: form.categoryEn.trim(), kh: form.categoryKh.trim() },
        since: Number(form.since) || new Date().getFullYear(),
        color: form.color,
        region: { en: form.regionEn.trim(), kh: form.regionKh.trim() },
        supplies: {
          en: toList(form.suppliesEn),
          kh: toList(form.suppliesKh),
        },
      }

      if (editingId) {
        setPartners((prev) => prev.map((partner) => partner.id === editingId ? { ...partner, ...partnerData } : partner))
        cancelEdit()
      } else {
        const newPartner = { id: Date.now(), ...partnerData }
        setPartners((prev) => [...prev, newPartner])
        addNotification({
          type: 'partner',
          title: lang === 'kh' ? 'បានបន្ថែមដៃគូថ្មី' : 'New partner added',
          detail: newPartner.name,
          href: '/admin/partners/add',
        })
        setForm(EMPTY_FORM)
      }
    }
  }

  const removePartner = (id) => {
    if (editingId === id) cancelEdit()
    setPartners((prev) => prev.filter((partner) => partner.id !== id))
  }

  const selectedCategory = CATEGORY_OPTIONS.find((category) => category.key === form.catKey)
  const previewCategory = lang === 'kh' ? form.categoryKh || selectedCategory?.kh : form.categoryEn || selectedCategory?.en
  const previewRegion = lang === 'kh' ? form.regionKh : form.regionEn
  const previewSupplies = toList(lang === 'kh' ? form.suppliesKh : form.suppliesEn)
  const categoryCount = new Set(partners.map((partner) => partner.catKey).filter(Boolean)).size
  const withSupplies = partners.filter((partner) => partner.supplies.en.length || partner.supplies.kh.length).length
  const withRegion = partners.filter((partner) => partner.region.en || partner.region.kh).length

  const inputBase = 'w-full rounded-xl border border-slate-700/70 bg-slate-950/60 px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-cyan-400 focus:bg-slate-950 focus:ring-4 focus:ring-cyan-500/10'
  const errorInput = 'border-red-500/80 bg-red-500/10 focus:border-red-400 focus:ring-red-500/10'

  return (
    <div className="space-y-6">
      <section className="relative overflow-hidden rounded-3xl border border-cyan-500/20 bg-gradient-to-br from-slate-800 via-slate-900 to-slate-950 p-6 shadow-2xl shadow-cyan-500/10">
        <div className="pointer-events-none absolute -right-16 -top-20 h-56 w-56 rounded-full bg-cyan-500/20 blur-3xl" />
        <div className="pointer-events-none absolute bottom-0 left-1/3 h-px w-2/3 bg-gradient-to-r from-transparent via-cyan-400/50 to-transparent" />
        <div className="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <Link to="/admin" className="mb-5 inline-flex items-center gap-2 rounded-full border border-slate-700/70 bg-slate-950/50 px-3 py-1.5 text-xs font-bold uppercase tracking-[0.18em] text-cyan-300 transition hover:border-cyan-400 hover:text-cyan-200">
              <ChevronLeftIcon /> {TEXTS.back[lang]}
            </Link>
            <div className="flex items-center gap-4">
              <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-cyan-500/15 text-3xl ring-1 ring-cyan-400/30">🤝</span>
              <div>
                <p className="text-xs font-black uppercase tracking-[0.28em] text-cyan-300">FreshMart supply guild</p>
                <h1 className="mt-1 text-3xl font-black tracking-tight text-white md:text-4xl">{TEXTS.heroTitle[lang]}</h1>
              </div>
            </div>
            <p className="mt-4 max-w-2xl text-sm leading-6 text-slate-300">{TEXTS.heroSub[lang]}</p>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Stat value={partners.length} label={TEXTS.items[lang]} />
            <Stat value={categoryCount} label={TEXTS.categories[lang]} />
            <Stat value={withSupplies} label={TEXTS.withSupplies[lang]} />
            <Stat value={withRegion} label={TEXTS.withRegion[lang]} />
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-6 2xl:grid-cols-[minmax(0,1fr)_420px]">
        <div className="rounded-3xl border border-slate-700/60 bg-slate-900/80 p-6 shadow-xl shadow-black/20">
          <div className="mb-6 flex flex-col gap-3 border-b border-slate-700/60 pb-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-xl font-black text-white">{TEXTS.formTitle[lang]}</h2>
              <p className="mt-1 text-sm text-slate-400">{TEXTS.formSub[lang]}</p>
            </div>
            {editingId && (
              <span className="inline-flex w-fit items-center gap-2 rounded-full border border-cyan-400/30 bg-cyan-500/10 px-3 py-1 text-xs font-bold text-cyan-300">
                ✏️ {TEXTS.updateBtn[lang]}
              </span>
            )}
          </div>

          <form className="space-y-5" onSubmit={handleSubmit} noValidate>
            <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
              <Field label={TEXTS.name[lang]} badge={TEXTS.required[lang]} error={errors.name}>
                <input id="name" name="name" type="text" placeholder={TEXTS.namePlaceholder[lang]} value={form.name} onChange={handleChange} className={`${inputBase} ${errors.name ? errorInput : ''}`} />
              </Field>

              <Field label={TEXTS.category[lang]} badge={TEXTS.required[lang]}>
                <select id="catKey" name="catKey" value={form.catKey} onChange={handleChange} className={inputBase}>
                  {CATEGORY_OPTIONS.map((category) => (
                    <option key={category.key} value={category.key}>{category.icon} {category[lang]}</option>
                  ))}
                </select>
              </Field>
            </div>

            <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
              <Field label={TEXTS.categoryEn[lang]} badge={TEXTS.required[lang]} error={errors.categoryEn}>
                <input id="categoryEn" name="categoryEn" type="text" placeholder="Fruits & Vegetables" value={form.categoryEn} onChange={handleChange} className={`${inputBase} ${errors.categoryEn ? errorInput : ''}`} />
              </Field>
              <Field label={TEXTS.categoryKh[lang]} badge={TEXTS.required[lang]} error={errors.categoryKh}>
                <input id="categoryKh" name="categoryKh" type="text" placeholder="ផ្លែឈើ និងបន្លែ" value={form.categoryKh} onChange={handleChange} className={`${inputBase} ${errors.categoryKh ? errorInput : ''}`} />
              </Field>
            </div>

            <div className="grid grid-cols-1 gap-5 lg:grid-cols-[180px_minmax(0,1fr)]">
              <Field label={TEXTS.since[lang]} badge={TEXTS.optional[lang]} muted>
                <input id="since" name="since" type="number" min="1990" max={new Date().getFullYear()} value={form.since} onChange={handleChange} className={inputBase} />
              </Field>

              <Field label={TEXTS.color[lang]} badge={TEXTS.optional[lang]} muted>
                <div className="flex flex-wrap items-center gap-2">
                  {COLOR_PRESETS.map((color) => (
                    <button key={color} type="button" className={`h-9 w-9 rounded-full border-2 transition hover:scale-110 ${form.color === color ? 'scale-110 border-white' : 'border-transparent'}`} style={{ background: color }} onClick={() => setForm((prev) => ({ ...prev, color }))} aria-label={color} />
                  ))}
                  <label className="relative flex h-9 w-9 cursor-pointer items-center justify-center overflow-hidden rounded-full border-2 border-slate-700 bg-slate-950 transition hover:border-cyan-400" style={{ background: form.color }} title="Custom color">
                    <input type="color" name="color" value={form.color} onChange={handleChange} className="absolute inset-0 h-full w-full cursor-pointer opacity-0" />
                    <span className="pointer-events-none text-xs font-black text-white">+</span>
                  </label>
                  <span className="ml-2 rounded-lg border border-slate-700 bg-slate-950/60 px-3 py-1.5 font-mono text-xs text-slate-400">{form.color}</span>
                </div>
              </Field>
            </div>

            <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
              <Field label={TEXTS.regionEn[lang]} badge={TEXTS.required[lang]} error={errors.regionEn}>
                <input id="regionEn" name="regionEn" type="text" placeholder={TEXTS.regionPlaceholderEn[lang]} value={form.regionEn} onChange={handleChange} className={`${inputBase} ${errors.regionEn ? errorInput : ''}`} />
              </Field>
              <Field label={TEXTS.regionKh[lang]} badge={TEXTS.required[lang]} error={errors.regionKh}>
                <input id="regionKh" name="regionKh" type="text" placeholder={TEXTS.regionPlaceholderKh[lang]} value={form.regionKh} onChange={handleChange} className={`${inputBase} ${errors.regionKh ? errorInput : ''}`} />
              </Field>
            </div>

            <div className="rounded-2xl border border-slate-700/60 bg-slate-950/30 p-4">
              <p className="mb-4 text-xs font-semibold text-slate-400">{TEXTS.suppliesHint[lang]}</p>
              <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
                <Field label={TEXTS.suppliesEn[lang]} badge={TEXTS.optional[lang]} muted>
                  <textarea id="suppliesEn" name="suppliesEn" rows="4" placeholder={TEXTS.suppliesPlaceholderEn[lang]} value={form.suppliesEn} onChange={handleChange} className={`${inputBase} min-h-28 resize-y`} />
                </Field>
                <Field label={TEXTS.suppliesKh[lang]} badge={TEXTS.optional[lang]} muted>
                  <textarea id="suppliesKh" name="suppliesKh" rows="4" placeholder={TEXTS.suppliesPlaceholderKh[lang]} value={form.suppliesKh} onChange={handleChange} className={`${inputBase} min-h-28 resize-y`} />
                </Field>
              </div>
            </div>

            <div className="flex flex-col gap-3 border-t border-slate-700/60 pt-5 sm:flex-row">
              <button type="submit" className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-cyan-500 px-5 py-3 text-sm font-black text-slate-950 shadow-lg shadow-cyan-500/20 transition hover:-translate-y-0.5 hover:bg-cyan-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-300">
                {editingId ? <CheckIcon /> : <PlusIcon />} {editingId ? TEXTS.updateBtn[lang] : TEXTS.addBtn[lang]}
              </button>
              {editingId && (
                <button type="button" className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-700 px-5 py-3 text-sm font-bold text-slate-300 transition hover:border-slate-500 hover:bg-slate-800 hover:text-white" onClick={cancelEdit}>
                  <XIcon /> {TEXTS.cancelBtn[lang]}
                </button>
              )}
            </div>
          </form>
        </div>

        <aside className="space-y-6">
          <div className="rounded-3xl border border-cyan-500/20 bg-gradient-to-br from-slate-900 to-slate-950 p-5 shadow-xl shadow-black/20">
            <div className="mb-4 flex items-center justify-between">
              <p className="text-xs font-black uppercase tracking-[0.2em] text-cyan-300">{TEXTS.livePreview[lang]}</p>
              <span className="rounded-full bg-cyan-500/15 px-3 py-1 text-xs font-black text-cyan-300">{selectedCategory?.icon} {selectedCategory?.[lang]}</span>
            </div>
            <div className="rounded-2xl border border-slate-700 bg-slate-950/60 p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-2xl text-base font-black text-slate-950 shadow-lg shadow-black/30 ring-2 ring-white/10" style={{ background: form.color }}>
                  {initials(form.name)}
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="truncate text-base font-black text-white">{form.name || TEXTS.unnamed[lang]}</h3>
                  <p className="truncate text-xs font-bold text-cyan-300">{previewCategory || selectedCategory?.[lang]}</p>
                  <p className="mt-1 truncate text-xs text-slate-500">{TEXTS.previewSince[lang]} {form.since}</p>
                </div>
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                {previewSupplies.length > 0 ? previewSupplies.map((supply) => (
                  <span key={supply} className="rounded-full bg-cyan-500/10 px-3 py-1 text-xs font-bold text-cyan-300">{supply}</span>
                )) : <span className="rounded-full bg-slate-800 px-3 py-1 text-xs font-bold text-slate-500">—</span>}
              </div>
              <p className="mt-4 flex items-center gap-2 text-sm font-semibold text-slate-400"><PinIcon /> {previewRegion || '—'}</p>
            </div>
          </div>

          <div className="rounded-3xl border border-slate-700/60 bg-slate-900/80 p-5 shadow-xl shadow-black/20">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-black text-white">{TEXTS.listTitle[lang]}</h3>
              <span className="flex h-8 min-w-8 items-center justify-center rounded-full bg-cyan-500 px-2 text-sm font-black text-slate-950">{partners.length}</span>
            </div>

            {partners.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-700 bg-slate-950/40 p-8 text-center">
                <span className="text-4xl">🤝</span>
                <p className="mt-3 text-sm leading-6 text-slate-400">{TEXTS.empty[lang]}</p>
              </div>
            ) : (
              <div className="max-h-[540px] space-y-3 overflow-y-auto pr-1 scrollbar-thin scrollbar-track-slate-900">
                {partners.map((partner) => (
                  <article key={partner.id} className="group rounded-2xl border border-slate-700/70 bg-slate-950/50 p-3 transition hover:border-cyan-500/50 hover:bg-slate-950">
                    <div className="flex items-start gap-3">
                      <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl text-sm font-black text-slate-950 ring-1 ring-cyan-500/20" style={{ background: partner.color }}>
                        {initials(partner.name)}
                      </div>
                      <div className="min-w-0 flex-1">
                        <h4 className="truncate text-sm font-black text-white">{partner.name}</h4>
                        <p className="truncate text-xs font-bold text-cyan-300">{partner.category[lang]}</p>
                        <div className="mt-2 flex flex-wrap gap-1.5">
                          <span className="rounded-full bg-slate-800 px-2 py-0.5 text-[11px] font-bold text-slate-300">📍 {partner.region[lang]}</span>
                          <span className="rounded-full bg-cyan-500/10 px-2 py-0.5 text-[11px] font-bold text-cyan-300">{partner.since}</span>
                        </div>
                        {(partner.supplies[lang]?.length || 0) > 0 && <p className="mt-2 line-clamp-2 text-xs leading-5 text-slate-400">{partner.supplies[lang].join(', ')}</p>}
                      </div>
                      <div className="flex flex-col gap-2 opacity-100 sm:opacity-70 sm:transition sm:group-hover:opacity-100">
                        <button className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-700 text-slate-400 transition hover:border-blue-400 hover:bg-blue-500/10 hover:text-blue-300" onClick={() => startEdit(partner)} aria-label={TEXTS.edit[lang]}>
                          <EditIcon />
                        </button>
                        <button className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-700 text-slate-400 transition hover:border-red-400 hover:bg-red-500/10 hover:text-red-300" onClick={() => removePartner(partner.id)} aria-label={TEXTS.remove[lang]}>
                          <TrashIcon />
                        </button>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            )}

            <Link to="/partners" className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl border border-slate-700 px-4 py-3 text-sm font-bold text-cyan-300 transition hover:border-cyan-400 hover:bg-cyan-500/10">
              <EyeIcon /> {TEXTS.viewPage[lang]}
            </Link>
          </div>
        </aside>
      </section>
    </div>
  )
}

const Stat = ({ value, label }) => (
  <div className="min-w-[86px] rounded-xl bg-slate-900/70 px-4 py-3 text-center ring-1 ring-slate-700/60">
    <p className="text-2xl font-black text-white">{value}</p>
    <p className="mt-1 text-[10px] font-bold uppercase tracking-wide text-slate-500">{label}</p>
  </div>
)

const Field = ({ label, badge, error, muted = false, children }) => (
  <label className="block space-y-2">
    <span className="flex items-center justify-between gap-3 text-sm font-bold text-slate-200">
      <span>{label}</span>
      {badge && <span className={`rounded-full px-2 py-0.5 text-[10px] font-black uppercase tracking-wide ${muted ? 'bg-slate-800 text-slate-500' : 'bg-cyan-500/10 text-cyan-300'}`}>{badge}</span>}
    </span>
    {children}
    {error && <span className="block text-xs font-semibold text-red-300">{error}</span>}
  </label>
)

const PlusIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
    <line x1="12" y1="5" x2="12" y2="19" />
    <line x1="5" y1="12" x2="19" y2="12" />
  </svg>
)

const TrashIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <polyline points="3 6 5 6 21 6" />
    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
  </svg>
)

const EyeIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
)

const EditIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
  </svg>
)

const CheckIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
    <polyline points="20 6 9 17 4 12" />
  </svg>
)

const XIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
)

const ChevronLeftIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
    <polyline points="15 18 9 12 15 6" />
  </svg>
)

const PinIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round" className="text-cyan-300">
    <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
    <circle cx="12" cy="10" r="3" />
  </svg>
)

export default AddPartner
