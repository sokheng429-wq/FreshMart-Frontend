import { useState, useRef } from 'react'
import { Link } from 'react-router-dom'
import { useLanguage } from '../../context/LanguageContext'
import { useNotifications } from '../../context/NotificationContext'
import './Addpromotion.css'

const TEXTS = {
  heroTitle: { en: 'Promotions', kh: 'ការផ្សព្វផ្សាយ' },
  heroSub: { en: 'Create deals and discount codes — they appear instantly on the Promotions page.', kh: 'បង្កើតការផ្សព្វផ្សាយ និងកូដបញ្ចុះតម្លៃ — បង្ហាញភ្លាមៗលើទំព័រផ្សព្វផ្សាយ។' },
  formTitle: { en: 'Promotion details', kh: 'ព័ត៌មានផ្សព្វផ្សាយ' },
  formSub: { en: 'Title, code, and badge are required. Pick a tag color so the deal stands out.', kh: 'ចំណងជើង កូដ និងផ្លាកគឺចាំបាច់។ ជ្រើសរើសពណ៌ស្លាកដើម្បីឱ្យការផ្សព្វផ្សាយលេចធ្លោ។' },
  title: { en: 'Promotion title', kh: 'ចំណងជើងផ្សព្វផ្សាយ' },
  titlePlaceholder: { en: 'e.g. Buy 2 Get 1 Free', kh: 'ឧ. ទិញ២ថែម១' },
  description: { en: 'Description', kh: 'ការពិពណ៌នា' },
  descriptionPlaceholder: { en: 'Describe the promotion details...', kh: 'ពិពណ៌នាអំពីការផ្សព្វផ្សាយ...' },
  tag: { en: 'Discount tag', kh: 'ស្លាកបញ្ចុះតម្លៃ' },
  tagPlaceholder: { en: 'e.g. 20% OFF', kh: 'ឧ. បញ្ចុះតម្លៃ ២០%' },
  code: { en: 'Promo code', kh: 'កូដផ្សព្វផ្សាយ' },
  codePlaceholder: { en: 'e.g. SAVE20', kh: 'ឧ. SAVE20' },
  badge: { en: 'Badge text', kh: 'អត្ថបទផ្លាក' },
  badgePlaceholder: { en: 'e.g. Ends in 2 days', kh: 'ឧ. នៅសល់ ២ថ្ងៃ' },
  color: { en: 'Tag color', kh: 'ពណ៌ស្លាក' },
  image: { en: 'Promotion image', kh: 'រូបភាពផ្សព្វផ្សាយ' },
  imageHint: { en: 'Drop an image here, or click to browse', kh: 'ទម្លាក់រូបភាពនៅទីនេះ ឬចុចដើម្បីជ្រើសរើស' },
  addBtn: { en: 'Add promotion', kh: 'បន្ថែមការផ្សព្វផ្សាយ' },
  updateBtn: { en: 'Save promotion', kh: 'រក្សាទុកការផ្សព្វផ្សាយ' },
  cancelBtn: { en: 'Cancel edit', kh: 'បោះបង់ការកែប្រែ' },
  required: { en: 'Required', kh: 'ត្រូវការ' },
  optional: { en: 'Optional', kh: 'មិនចាំបាច់' },
  errTitle: { en: 'Promotion title is required', kh: 'ត្រូវការចំណងជើងផ្សព្វផ្សាយ' },
  errTag: { en: 'Discount tag is required', kh: 'ត្រូវការស្លាកបញ្ចុះតម្លៃ' },
  errCode: { en: 'Promo code is required', kh: 'ត្រូវការកូដផ្សព្វផ្សាយ' },
  errBadge: { en: 'Badge text is required', kh: 'ត្រូវការអត្ថបទផ្លាក' },
  listTitle: { en: 'Active deals', kh: 'ការផ្សព្វផ្សាយសកម្ម' },
  empty: { en: 'No promotions yet. Add the first deal and it will appear here for quick edits.', kh: 'មិនទាន់មានការផ្សព្វផ្សាយនៅឡើយ។ បន្ថែមការផ្សព្វផ្សាយដំបូង។' },
  viewPage: { en: 'View promotions page', kh: 'មើលទំព័រផ្សព្វផ្សាយ' },
  remove: { en: 'Remove', kh: 'លុប' },
  edit: { en: 'Edit', kh: 'កែប្រែ' },
  delete: { en: 'Delete', kh: 'លុប' },
  back: { en: 'Dashboard', kh: 'ផ្ទាំងគ្រប់គ្រង' },
  livePreview: { en: 'Live preview', kh: 'មើលជាមុន' },
  unnamed: { en: 'New deal', kh: 'ការផ្សព្វផ្សាយថ្មី' },
  items: { en: 'Deals', kh: 'ការផ្សព្វផ្សាយ' },
  codes: { en: 'Codes', kh: 'កូដ' },
  colored: { en: 'Custom colored', kh: 'ពណ៌ផ្ទាល់ខ្លួន' },
  withImage: { en: 'With image', kh: 'មានរូបភាព' },
}

const PRESET_COLORS = [
  '#e63946', '#f4a261', '#2a9d8f', '#FF9900', '#e76f51',
  '#6a994e', '37', '#bc6c25', '#264653', '#9c89b8', '#f72585',
]

export const Addpromotion = () => {
  const { lang } = useLanguage()
  const { addNotification } = useNotifications()
  const fileRef = useRef(null)
  const [form, setForm] = useState({ title: '', description: '', tag: '', code: '', badge: '', color: '#e63946', image: '' })
  const [imageFile, setImageFile] = useState(null)
  const [imagePreview, setImagePreview] = useState(null)
  const [dragOver, setDragOver] = useState(false)
  const [errors, setErrors] = useState({})
  const [promotions, setPromotions] = useState([])
  const [editingId, setEditingId] = useState(null)

  const handleChange = (e) => {
    const { name, value } = e.target
    setForm((prev) => ({ ...prev, [name]: value }))
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: '' }))
  }

  const handleImage = (file) => {
    if (file) {
      setImageFile(file)
      setImagePreview(URL.createObjectURL(file))
      setForm((prev) => ({ ...prev, image: URL.createObjectURL(file) }))
    }
  }

  const handleDrop = (e) => {
    e.preventDefault()
    setDragOver(false)
    const file = e.dataTransfer.files[0]
    if (file && file.type.startsWith('image/')) handleImage(file)
  }

  const validate = () => {
    const e = {}
    if (!form.title.trim()) e.title = TEXTS.errTitle[lang]
    if (!form.tag.trim()) e.tag = TEXTS.errTag[lang]
    if (!form.code.trim()) e.code = TEXTS.errCode[lang]
    if (!form.badge.trim()) e.badge = TEXTS.errBadge[lang]
    return e
  }

  const startEdit = (promo) => {
    setEditingId(promo.id)
    setForm({
      title: promo.title, description: promo.description || '', tag: promo.tag,
      code: promo.code, badge: promo.badge, color: promo.color || '#e63946',
      image: promo.image || '',
    })
    setImagePreview(promo.image || null)
    setImageFile(null)
    setErrors({})
  }

  const cancelEdit = () => {
    setEditingId(null)
    setForm({ title: '', description: '', tag: '', code: '', badge: '', color: '#e63946', image: '' })
    setImageFile(null)
    setImagePreview(null)
    if (fileRef.current) fileRef.current.value = ''
    setErrors({})
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    const v = validate()
    setErrors(v)
    if (Object.keys(v).length === 0) {
      const promoData = { ...form, image: imagePreview || form.image }
      if (editingId) {
        setPromotions((prev) => prev.map((p) => p.id === editingId ? { ...p, ...promoData } : p))
        cancelEdit()
      } else {
        const newPromo = { id: Date.now(), ...promoData }
        setPromotions((prev) => [...prev, newPromo])
        addNotification({
          type: 'promotion',
          action: 'add',
          title: lang === 'en' ? 'Promotion created' : 'បានបង្កើតការផ្សព្វផ្សាយ',
          detail: form.title,
        })
        setForm({ title: '', description: '', tag: '', code: '', badge: '', color: '#e63946', image: '' })
        setImageFile(null)
        setImagePreview(null)
        if (fileRef.current) fileRef.current.value = ''
      }
    }
  }

  const removePromotion = (id) => {
    if (editingId === id) cancelEdit()
    setPromotions((prev) => prev.filter((p) => p.id !== id))
  }

  const codeCount = new Set(promotions.map((p) => p.code).filter(Boolean)).size
  const withImage = promotions.filter((p) => p.image).length
  const customColor = promotions.filter((p) => p.color && !PRESET_COLORS.includes(p.color)).length

  const inputBase = 'w-full rounded-xl border border-slate-700/70 bg-slate-950/60 px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-pink-400 focus:bg-slate-950 focus:ring-4 focus:ring-pink-500/10'
  const errorInput = 'border-red-500/80 bg-red-500/10 focus:border-red-400 focus:ring-red-500/10'

  return (
    <div className="space-y-6">
      <section className="relative overflow-hidden rounded-3xl border border-pink-500/20 bg-gradient-to-br from-slate-800 via-slate-900 to-slate-950 p-6 shadow-2xl shadow-pink-500/10">
        <div className="pointer-events-none absolute -right-16 -top-20 h-56 w-56 rounded-full bg-pink-500/20 blur-3xl" />
        <div className="pointer-events-none absolute bottom-0 left-1/3 h-px w-2/3 bg-gradient-to-r from-transparent via-pink-400/50 to-transparent" />
        <div className="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <Link to="/admin" className="mb-5 inline-flex items-center gap-2 rounded-full border border-slate-700/70 bg-slate-950/50 px-3 py-1.5 text-xs font-bold uppercase tracking-[0.18em] text-pink-300 transition hover:border-pink-400 hover:text-pink-200">
              <ChevronLeftIcon /> {TEXTS.back[lang]}
            </Link>
            <div className="flex items-center gap-4">
              <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-pink-500/15 text-3xl ring-1 ring-pink-400/30">🏷️</span>
              <div>
                <p className="text-xs font-black uppercase tracking-[0.28em] text-pink-300">FreshMart deals</p>
                <h1 className="mt-1 text-3xl font-black tracking-tight text-white md:text-4xl">{TEXTS.heroTitle[lang]}</h1>
              </div>
            </div>
            <p className="mt-4 max-w-2xl text-sm leading-6 text-slate-300">{TEXTS.heroSub[lang]}</p>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Stat value={promotions.length} label={TEXTS.items[lang]} />
            <Stat value={codeCount} label={TEXTS.codes[lang]} />
            <Stat value={withImage} label={TEXTS.withImage[lang]} />
            <Stat value={customColor} label={TEXTS.colored[lang]} />
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
              <span className="inline-flex w-fit items-center gap-2 rounded-full border border-orange-400/30 bg-orange-500/10 px-3 py-1 text-xs font-bold text-orange-300">
                ✏️ {TEXTS.updateBtn[lang]}
              </span>
            )}
          </div>

          <form className="space-y-5" onSubmit={handleSubmit} noValidate>
            <Field label={TEXTS.title[lang]} badge={TEXTS.required[lang]} error={errors.title}>
              <input id="title" name="title" type="text" placeholder={TEXTS.titlePlaceholder[lang]} value={form.title} onChange={handleChange} className={`${inputBase} ${errors.title ? errorInput : ''}`} />
            </Field>

            <Field label={TEXTS.description[lang]} badge={TEXTS.optional[lang]} muted>
              <textarea id="description" name="description" rows="3" placeholder={TEXTS.descriptionPlaceholder[lang]} value={form.description} onChange={handleChange} className={`${inputBase} min-h-24 resize-y`} />
            </Field>

            <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
              <Field label={TEXTS.tag[lang]} badge={TEXTS.required[lang]} error={errors.tag}>
                <input id="tag" name="tag" type="text" placeholder={TEXTS.tagPlaceholder[lang]} value={form.tag} onChange={handleChange} className={`${inputBase} ${errors.tag ? errorInput : ''}`} />
              </Field>
              <Field label={TEXTS.code[lang]} badge={TEXTS.required[lang]} error={errors.code}>
                <input id="code" name="code" type="text" placeholder={TEXTS.codePlaceholder[lang]} value={form.code} onChange={handleChange} className={`${inputBase} font-mono uppercase ${errors.code ? errorInput : ''}`} />
              </Field>
            </div>

            <Field label={TEXTS.badge[lang]} badge={TEXTS.required[lang]} error={errors.badge}>
              <input id="badge" name="badge" type="text" placeholder={TEXTS.badgePlaceholder[lang]} value={form.badge} onChange={handleChange} className={`${inputBase} ${errors.badge ? errorInput : ''}`} />
            </Field>

            <Field label={TEXTS.color[lang]} badge={TEXTS.optional[lang]} muted>
              <div className="flex flex-wrap items-center gap-2">
                {PRESET_COLORS.map((c) => (
                  <button key={c} type="button" className={`h-9 w-9 rounded-full border-2 transition hover:scale-110 ${form.color === c ? 'border-white scale-110' : 'border-transparent'}`} style={{ background: c }} onClick={() => setForm((prev) => ({ ...prev, color: c }))} aria-label={c} />
                ))}
                <label className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-full border-2 border-slate-700 bg-slate-950 transition hover:border-pink-400" style={{ background: form.color }} title="Custom color">
                  <input type="color" value={form.color} onChange={(e) => setForm((prev) => ({ ...prev, color: e.target.value }))} className="h-full w-full cursor-pointer opacity-0" />
                  <span className="absolute text-xs font-black text-white">+</span>
                </label>
                <span className="ml-2 rounded-lg border border-slate-700 bg-slate-950/60 px-3 py-1.5 font-mono text-xs text-slate-400">{form.color}</span>
              </div>
            </Field>

            <Field label={TEXTS.image[lang]} badge={TEXTS.optional[lang]} muted>
              {imagePreview ? (
                <div className="group relative h-44 overflow-hidden rounded-2xl border border-slate-700 bg-slate-950">
                  <img src={imagePreview} alt="Preview" className="h-full w-full object-cover" />
                  <button type="button" className="absolute inset-x-4 bottom-4 rounded-xl bg-slate-950/85 px-4 py-2 text-sm font-bold text-white backdrop-blur transition hover:bg-pink-500" onClick={() => { setImageFile(null); setImagePreview(null); setForm((prev) => ({ ...prev, image: '' })) }}>
                    {lang === 'en' ? 'Change image' : 'ផ្លាស់ប្តូររូបភាព'}
                  </button>
                </div>
              ) : (
                <div
                  className={`flex h-44 cursor-pointer flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed bg-slate-950/50 p-5 text-center transition ${dragOver ? 'border-pink-300 bg-pink-500/10' : 'border-slate-700 hover:border-pink-400 hover:bg-pink-500/5'}`}
                  onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
                  onDragLeave={() => setDragOver(false)}
                  onDrop={handleDrop}
                  onClick={() => fileRef.current?.click()}
                >
                  <input ref={fileRef} type="file" accept="image/*" onChange={(e) => handleImage(e.target.files[0])} className="hidden" />
                  <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-pink-500/10 text-pink-300"><PhotoIcon /></span>
                  <span className="text-sm font-semibold text-slate-300">{TEXTS.imageHint[lang]}</span>
                </div>
              )}
            </Field>

            <div className="flex flex-col gap-3 border-t border-slate-700/60 pt-5 sm:flex-row">
              <button type="submit" className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-pink-500 px-5 py-3 text-sm font-black text-slate-950 shadow-lg shadow-pink-500/20 transition hover:-translate-y-0.5 hover:bg-pink-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-pink-300">
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
          <div className="rounded-3xl border border-pink-500/20 bg-gradient-to-br from-slate-900 to-slate-950 p-5 shadow-xl shadow-black/20">
            <div className="mb-4 flex items-center justify-between">
              <p className="text-xs font-black uppercase tracking-[0.2em] text-pink-300">{TEXTS.livePreview[lang]}</p>
              {form.tag && <span className="rounded-full px-3 py-1 text-xs font-black text-white" style={{ background: form.color }}>{form.tag}</span>}
            </div>
            <div className="overflow-hidden rounded-2xl border border-slate-700 bg-slate-950/60">
              {imagePreview ? <img src={imagePreview} alt="Preview" className="h-36 w-full object-cover" /> : <div className="flex h-36 items-center justify-center text-5xl">🏷️</div>}
              <div className="space-y-2 p-4">
                <h3 className="text-base font-black text-white">{form.title || TEXTS.unnamed[lang]}</h3>
                {form.badge && <p className="text-xs text-slate-400">⏰ {form.badge}</p>}
                {form.code && <p className="font-mono text-xs font-black text-pink-300">{form.code}</p>}
                {form.description && <p className="line-clamp-3 text-sm leading-6 text-slate-400">{form.description}</p>}
              </div>
            </div>
          </div>

          <div className="rounded-3xl border border-slate-700/60 bg-slate-900/80 p-5 shadow-xl shadow-black/20">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-black text-white">{TEXTS.listTitle[lang]}</h3>
              <span className="flex h-8 min-w-8 items-center justify-center rounded-full bg-pink-500 px-2 text-sm font-black text-slate-950">{promotions.length}</span>
            </div>

            {promotions.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-700 bg-slate-950/40 p-8 text-center">
                <span className="text-4xl">🏷️</span>
                <p className="mt-3 text-sm leading-6 text-slate-400">{TEXTS.empty[lang]}</p>
              </div>
            ) : (
              <div className="max-h-[540px] space-y-3 overflow-y-auto pr-1 scrollbar-thin scrollbar-track-slate-900">
                {promotions.map((promo) => (
                  <article key={promo.id} className="group rounded-2xl border border-slate-700/70 bg-slate-950/50 p-3 transition hover:border-pink-500/50 hover:bg-slate-950">
                    <div className="flex gap-3">
                      <div className="h-14 w-14 flex-shrink-0 overflow-hidden rounded-xl bg-slate-800">
                        {promo.image ? <img src={promo.image} alt={promo.title} className="h-full w-full object-cover" /> : <div className="flex h-full items-center justify-center text-2xl">🏷️</div>}
                      </div>
                      <div className="min-w-0 flex-1">
                        <h4 className="truncate text-sm font-black text-white">{promo.title}</h4>
                        <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                          <span className="rounded-full px-2 py-0.5 text-[11px] font-black text-white" style={{ background: promo.color || '#e63946' }}>{promo.tag}</span>
                          <span className="rounded bg-slate-800 px-2 py-0.5 font-mono text-[11px] font-bold text-slate-300">{promo.code}</span>
                        </div>
                        {promo.badge && <p className="mt-1 text-[10px] font-bold uppercase tracking-wide text-slate-500">⏰ {promo.badge}</p>}
                      </div>
                      <div className="flex flex-col gap-2 opacity-100 sm:opacity-70 sm:transition sm:group-hover:opacity-100">
                        <button className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-700 text-slate-400 transition hover:border-blue-400 hover:bg-blue-500/10 hover:text-blue-300" onClick={() => startEdit(promo)} aria-label={TEXTS.edit[lang]}>
                          <EditIcon />
                        </button>
                        <button className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-700 text-slate-400 transition hover:border-red-400 hover:bg-red-500/10 hover:text-red-300" onClick={() => removePromotion(promo.id)} aria-label={TEXTS.remove[lang]}>
                          <TrashIcon />
                        </button>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            )}

            <Link to="/promotion" className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl border border-slate-700 px-4 py-3 text-sm font-bold text-pink-300 transition hover:border-pink-400 hover:bg-pink-500/10">
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
      {badge && <span className={`rounded-full px-2 py-0.5 text-[10px] font-black uppercase tracking-wide ${muted ? 'bg-slate-800 text-slate-500' : 'bg-pink-500/10 text-pink-300'}`}>{badge}</span>}
    </span>
    {children}
    {error && <span className="block text-xs font-semibold text-red-300">{error}</span>}
  </label>
)

const PhotoIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
    <circle cx="8.5" cy="8.5" r="1.5" />
    <polyline points="21 15 16 10 5 21" />
  </svg>
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

export default Addpromotion