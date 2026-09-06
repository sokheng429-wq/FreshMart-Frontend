import { useState, useRef } from 'react'
import { Link } from 'react-router-dom'
import { useLanguage } from '../../context/LanguageContext'
import { useNotifications } from '../../context/NotificationContext'
import './Addmember.css'

const ROLES = [
  { en: 'Founder', kh: 'ស្ថាបនិក' },
  { en: 'Manager', kh: 'អ្នកគ្រប់គ្រង' },
  { en: 'Developer', kh: 'អ្នកអភិវឌ្ឍ' },
  { en: 'Designer', kh: 'អ្នករចនា' },
  { en: 'Marketing', kh: 'ទីផ្សារ' },
  { en: 'Support', kh: 'គាំទ្រ' },
  { en: 'Other', kh: 'ផ្សេងទៀត' },
]

const TEXTS = {
  heroTitle: { en: 'Team roster', kh: 'បញ្ជីក្រុម' },
  heroSub: { en: 'Introduce the people behind the brand — profiles appear on the Team page instantly.', kh: 'ណែនាំមនុស្សនៅពីក្រោយម៉ាក — ប្រវត្តិរូបបង្ហាញលើទំព័រក្រុមភ្លាមៗ។' },
  formTitle: { en: 'Member details', kh: 'ព័ត៌មានសមាជិក' },
  formSub: { en: 'Add a name, role, and a friendly bio. The photo is optional but builds trust.', kh: 'បន្ថែមឈ្មោះ តួនាទី និងប្រវត្តិខ្លី។ រូបថតជាជម្រើន ប៉ុន្តែបង្កើនទំនុកចិត្ត។' },
  name: { en: 'Full name', kh: 'ឈ្មោះពេញ' },
  namePlaceholder: { en: 'e.g. Sokheng Chea', kh: 'ឧ. សុខេង ជា' },
  role: { en: 'Role', kh: 'តួនាទី' },
  rolePlaceholder: { en: 'Select a role', kh: 'ជ្រើសរើសតួនាទី' },
  email: { en: 'Email address', kh: 'អាសយដ្ឋានអ៊ីមែល' },
  emailPlaceholder: { en: 'you@example.com', kh: 'you@example.com' },
  photo: { en: 'Photo', kh: 'រូបថត' },
  photoHint: { en: 'Drop an image here, or click to browse', kh: 'ទម្លាក់រូបថតនៅទីនេះ ឬចុចដើម្បីជ្រើសរើស' },
  bio: { en: 'Short bio', kh: 'ប្រវត្តិខ្លី' },
  bioPlaceholder: { en: 'A short description about this member...', kh: 'ការពិពណ៌នាខ្លីអំពីសមាជិកនេះ...' },
  addBtn: { en: 'Add member', kh: 'បន្ថែមសមាជិក' },
  updateBtn: { en: 'Save member', kh: 'រក្សាទុកសមាជិក' },
  cancelBtn: { en: 'Cancel edit', kh: 'បោះបង់ការកែប្រែ' },
  required: { en: 'Required', kh: 'ត្រូវការ' },
  optional: { en: 'Optional', kh: 'មិនចាំបាច់' },
  errName: { en: 'Name is required', kh: 'ត្រូវការឈ្មោះ' },
  errRole: { en: 'Please select a role', kh: 'សូមជ្រើសរើសតួនាទី' },
  errEmail: { en: 'Enter a valid email', kh: 'បញ្ចូលអ៊ីមែលត្រឹមត្រូវ' },
  teamTitle: { en: 'Team members', kh: 'សមាជិកក្រុម' },
  empty: { en: 'No members yet. Add someone and the card shows up here for quick edits.', kh: 'មិនទាន់មានសមាជិកនៅឡើយ។ បន្ថែមនរណាម្នាក់ ហើយកាតនឹងបង្ហាញនៅទីនេះ។' },
  viewTeam: { en: 'View team page', kh: 'មើលទំព័រក្រុម' },
  remove: { en: 'Remove', kh: 'លុប' },
  edit: { en: 'Edit', kh: 'កែប្រែ' },
  delete: { en: 'Delete', kh: 'លុប' },
  back: { en: 'Dashboard', kh: 'ផ្ទាំងគ្រប់គ្រង' },
  livePreview: { en: 'Live preview', kh: 'មើលជាមុន' },
  unnamed: { en: 'New member', kh: 'សមាជិកថ្មី' },
  items: { en: 'Members', kh: 'សមាជិក' },
  roles: { en: 'Roles used', kh: 'តួនាទីបានប្រើ' },
  withPhoto: { en: 'With photo', kh: 'មានរូបថត' },
  withBio: { en: 'With bio', kh: 'មានប្រវត្តិ' },
}

export const AddMember = () => {
  const { lang } = useLanguage()
  const { addNotification } = useNotifications()
  const fileRef = useRef(null)
  const [form, setForm] = useState({ name: '', role: '', email: '', bio: '' })
  const [photo, setPhoto] = useState(null)
  const [photoPreview, setPhotoPreview] = useState(null)
  const [dragOver, setDragOver] = useState(false)
  const [errors, setErrors] = useState({})
  const [members, setMembers] = useState([])
  const [editingId, setEditingId] = useState(null)

  const handleChange = (e) => {
    const { name, value } = e.target
    setForm((prev) => ({ ...prev, [name]: value }))
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: '' }))
  }

  const handlePhoto = (file) => {
    if (file) {
      setPhoto(file)
      setPhotoPreview(URL.createObjectURL(file))
      if (errors.photo) setErrors((prev) => ({ ...prev, photo: '' }))
    }
  }

  const handleDrop = (e) => {
    e.preventDefault()
    setDragOver(false)
    const file = e.dataTransfer.files[0]
    if (file && file.type.startsWith('image/')) handlePhoto(file)
  }

  const validate = () => {
    const e = {}
    if (!form.name.trim()) e.name = TEXTS.errName[lang]
    if (!form.role) e.role = TEXTS.errRole[lang]
    if (!form.email.trim() || !/\S+@\S+\.\S+/.test(form.email)) e.email = TEXTS.errEmail[lang]
    return e
  }

  const startEdit = (member) => {
    setEditingId(member.id)
    setForm({ name: member.name, role: member.role, email: member.email, bio: member.bio || '' })
    setPhotoPreview(member.photo)
    setPhoto(null)
    setErrors({})
  }

  const cancelEdit = () => {
    setEditingId(null)
    setForm({ name: '', role: '', email: '', bio: '' })
    setPhoto(null)
    setPhotoPreview(null)
    if (fileRef.current) fileRef.current.value = ''
    setErrors({})
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    const v = validate()
    setErrors(v)
    if (Object.keys(v).length === 0) {
      if (editingId) {
        setMembers((prev) => prev.map((m) => m.id === editingId ? { ...m, ...form, photo: photoPreview || m.photo } : m))
        cancelEdit()
      } else {
        const newMember = { id: Date.now(), ...form, photo: photoPreview }
        setMembers((prev) => [...prev, newMember])
        addNotification({
          type: 'member',
          action: 'add',
          title: lang === 'en' ? 'Team member added' : 'បានបន្ថែមសមាជិកក្រុម',
          detail: form.name,
        })
        setForm({ name: '', role: '', email: '', bio: '' })
        setPhoto(null)
        setPhotoPreview(null)
        if (fileRef.current) fileRef.current.value = ''
      }
    }
  }

  const removeMember = (id) => {
    if (editingId === id) cancelEdit()
    setMembers((prev) => prev.filter((m) => m.id !== id))
  }

  const roleCount = new Set(members.map((m) => m.role).filter(Boolean)).size
  const withPhoto = members.filter((m) => m.photo).length
  const withBio = members.filter((m) => m.bio && m.bio.trim()).length

  const inputBase = 'w-full rounded-xl border border-slate-700/70 bg-slate-950/60 px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-blue-400 focus:bg-slate-950 focus:ring-4 focus:ring-blue-500/10'
  const errorInput = 'border-red-500/80 bg-red-500/10 focus:border-red-400 focus:ring-red-500/10'

  return (
    <div className="space-y-6">
      <section className="relative overflow-hidden rounded-3xl border border-blue-500/20 bg-gradient-to-br from-slate-800 via-slate-900 to-slate-950 p-6 shadow-2xl shadow-blue-500/10">
        <div className="pointer-events-none absolute -right-16 -top-20 h-56 w-56 rounded-full bg-blue-500/20 blur-3xl" />
        <div className="pointer-events-none absolute bottom-0 left-1/3 h-px w-2/3 bg-gradient-to-r from-transparent via-blue-400/50 to-transparent" />
        <div className="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <Link to="/admin" className="mb-5 inline-flex items-center gap-2 rounded-full border border-slate-700/70 bg-slate-950/50 px-3 py-1.5 text-xs font-bold uppercase tracking-[0.18em] text-blue-300 transition hover:border-blue-400 hover:text-blue-200">
              <ChevronLeftIcon /> {TEXTS.back[lang]}
            </Link>
            <div className="flex items-center gap-4">
              <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-500/15 text-3xl ring-1 ring-blue-400/30">👥</span>
              <div>
                <p className="text-xs font-black uppercase tracking-[0.28em] text-blue-300">FreshMart people</p>
                <h1 className="mt-1 text-3xl font-black tracking-tight text-white md:text-4xl">{TEXTS.heroTitle[lang]}</h1>
              </div>
            </div>
            <p className="mt-4 max-w-2xl text-sm leading-6 text-slate-300">{TEXTS.heroSub[lang]}</p>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Stat value={members.length} label={TEXTS.items[lang]} />
            <Stat value={roleCount} label={TEXTS.roles[lang]} />
            <Stat value={withPhoto} label={TEXTS.withPhoto[lang]} />
            <Stat value={withBio} label={TEXTS.withBio[lang]} />
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
            <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
              <Field label={TEXTS.name[lang]} badge={TEXTS.required[lang]} error={errors.name}>
                <input id="name" name="name" type="text" placeholder={TEXTS.namePlaceholder[lang]} value={form.name} onChange={handleChange} className={`${inputBase} ${errors.name ? errorInput : ''}`} />
              </Field>
              <Field label={TEXTS.email[lang]} badge={TEXTS.required[lang]} error={errors.email}>
                <input id="email" name="email" type="email" placeholder={TEXTS.emailPlaceholder[lang]} value={form.email} onChange={handleChange} className={`${inputBase} ${errors.email ? errorInput : ''}`} />
              </Field>
            </div>

            <Field label={TEXTS.role[lang]} badge={TEXTS.required[lang]} error={errors.role}>
              <select id="role" name="role" value={form.role} onChange={handleChange} className={`${inputBase} ${errors.role ? errorInput : ''}`}>
                <option value="">{TEXTS.rolePlaceholder[lang]}</option>
                {ROLES.map((r) => <option key={r.en} value={r.en}>{r[lang]}</option>)}
              </select>
            </Field>

            <div className="grid grid-cols-1 gap-5 xl:grid-cols-[200px_minmax(0,1fr)]">
              <Field label={TEXTS.photo[lang]} badge={TEXTS.optional[lang]} muted>
                {photoPreview ? (
                  <div className="group relative h-44 overflow-hidden rounded-2xl border border-slate-700 bg-slate-950">
                    <img src={photoPreview} alt="Preview" className="h-full w-full object-cover" />
                    <button type="button" className="absolute inset-x-4 bottom-4 rounded-xl bg-slate-950/85 px-4 py-2 text-sm font-bold text-white backdrop-blur transition hover:bg-blue-500" onClick={() => { setPhoto(null); setPhotoPreview(null) }}>
                      {lang === 'en' ? 'Change photo' : 'ផ្លាស់ប្តូររូបថត'}
                    </button>
                  </div>
                ) : (
                  <div
                    className={`flex h-44 cursor-pointer flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed bg-slate-950/50 p-5 text-center transition ${dragOver ? 'border-blue-300 bg-blue-500/10' : 'border-slate-700 hover:border-blue-400 hover:bg-blue-500/5'}`}
                    onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
                    onDragLeave={() => setDragOver(false)}
                    onDrop={handleDrop}
                    onClick={() => fileRef.current?.click()}
                  >
                    <input ref={fileRef} type="file" accept="image/*" onChange={(e) => handlePhoto(e.target.files[0])} className="hidden" />
                    <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-500/10 text-blue-300"><PhotoIcon /></span>
                    <span className="text-sm font-semibold text-slate-300">{TEXTS.photoHint[lang]}</span>
                  </div>
                )}
              </Field>

              <Field label={TEXTS.bio[lang]} badge={TEXTS.optional[lang]} muted>
                <textarea id="bio" name="bio" rows="6" placeholder={TEXTS.bioPlaceholder[lang]} value={form.bio} onChange={handleChange} className={`${inputBase} min-h-44 resize-y`} />
              </Field>
            </div>

            <div className="flex flex-col gap-3 border-t border-slate-700/60 pt-5 sm:flex-row">
              <button type="submit" className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-blue-500 px-5 py-3 text-sm font-black text-slate-950 shadow-lg shadow-blue-500/20 transition hover:-translate-y-0.5 hover:bg-blue-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-300">
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
          <div className="rounded-3xl border border-blue-500/20 bg-gradient-to-br from-slate-900 to-slate-950 p-5 shadow-xl shadow-black/20">
            <div className="mb-4 flex items-center justify-between">
              <p className="text-xs font-black uppercase tracking-[0.2em] text-blue-300">{TEXTS.livePreview[lang]}</p>
              {form.role && <span className="rounded-full bg-blue-500/15 px-3 py-1 text-xs font-black text-blue-300">{ROLES.find((r) => r.en === form.role)?.[lang]}</span>}
            </div>
            <div className="rounded-2xl border border-slate-700 bg-slate-950/60 p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-14 w-14 flex-shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-slate-800 ring-2 ring-blue-500/30">
                  {photoPreview ? <img src={photoPreview} alt={form.name || 'preview'} className="h-full w-full object-cover" /> : <span className="text-lg font-black text-blue-300">{(form.name || '?').charAt(0).toUpperCase()}</span>}
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="truncate text-base font-black text-white">{form.name || TEXTS.unnamed[lang]}</h3>
                  {form.email && <p className="truncate text-xs text-slate-400">{form.email}</p>}
                </div>
              </div>
              {form.bio && <p className="mt-3 line-clamp-4 text-sm leading-6 text-slate-400">{form.bio}</p>}
            </div>
          </div>

          <div className="rounded-3xl border border-slate-700/60 bg-slate-900/80 p-5 shadow-xl shadow-black/20">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-black text-white">{TEXTS.teamTitle[lang]}</h3>
              <span className="flex h-8 min-w-8 items-center justify-center rounded-full bg-blue-500 px-2 text-sm font-black text-slate-950">{members.length}</span>
            </div>

            {members.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-700 bg-slate-950/40 p-8 text-center">
                <span className="text-4xl">👥</span>
                <p className="mt-3 text-sm leading-6 text-slate-400">{TEXTS.empty[lang]}</p>
              </div>
            ) : (
              <div className="max-h-[540px] space-y-3 overflow-y-auto pr-1 scrollbar-thin scrollbar-track-slate-900">
                {members.map((m) => (
                  <article key={m.id} className="group rounded-2xl border border-slate-700/70 bg-slate-950/50 p-3 transition hover:border-blue-500/50 hover:bg-slate-950">
                    <div className="flex items-start gap-3">
                      <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center overflow-hidden rounded-xl bg-slate-800 ring-1 ring-blue-500/20">
                        {m.photo ? <img src={m.photo} alt={m.name} className="h-full w-full object-cover" /> : <span className="text-base font-black text-blue-300">{m.name.charAt(0).toUpperCase()}</span>}
                      </div>
                      <div className="min-w-0 flex-1">
                        <h4 className="truncate text-sm font-black text-white">{m.name}</h4>
                        <p className="truncate text-xs font-bold text-blue-300">{ROLES.find((r) => r.en === m.role)?.[lang] || m.role}</p>
                        {m.bio && <p className="mt-1 line-clamp-2 text-xs leading-5 text-slate-400">{m.bio}</p>}
                      </div>
                      <div className="flex flex-col gap-2 opacity-100 sm:opacity-70 sm:transition sm:group-hover:opacity-100">
                        <button className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-700 text-slate-400 transition hover:border-blue-400 hover:bg-blue-500/10 hover:text-blue-300" onClick={() => startEdit(m)} aria-label={TEXTS.edit[lang]}>
                          <EditIcon />
                        </button>
                        <button className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-700 text-slate-400 transition hover:border-red-400 hover:bg-red-500/10 hover:text-red-300" onClick={() => removeMember(m.id)} aria-label={TEXTS.remove[lang]}>
                          <TrashIcon />
                        </button>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            )}

            <Link to="/member" className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl border border-slate-700 px-4 py-3 text-sm font-bold text-blue-300 transition hover:border-blue-400 hover:bg-blue-500/10">
              <EyeIcon /> {TEXTS.viewTeam[lang]}
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
      {badge && <span className={`rounded-full px-2 py-0.5 text-[10px] font-black uppercase tracking-wide ${muted ? 'bg-slate-800 text-slate-500' : 'bg-blue-500/10 text-blue-300'}`}>{badge}</span>}
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

export default AddMember