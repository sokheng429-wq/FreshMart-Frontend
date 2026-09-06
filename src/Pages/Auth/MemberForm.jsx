import { useEffect, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useLanguage } from '../../context/LanguageContext'
import { useNotifications } from '../../context/NotificationContext'
import { memberAPI } from '../../api/api'
import './MemberForm.css'

const DEPARTMENTS = [
  { en: 'Executive', kh: 'នាយកប្រតិបត្តិ' },
  { en: 'Admin', kh: 'រដ្ឋបាល' },
  { en: 'Operation', kh: 'ប្រតិបត្តិការ' },
  { en: 'Other', kh: 'ផ្សេងទៀត' },
]

const GENDERS = [
  { en: 'Male', kh: 'ប្រុស' },
  { en: 'Female', kh: 'ស្រី' },
  { en: 'Other', kh: 'ផ្សេងទៀត' },
]

const TEXTS = {
  back: { en: 'Members', kh: 'សមាជិក' },
  eyebrow: { en: "FreshMart team", kh: "ក្រុម FreshMart" },
  titleCreate: { en: 'Add Member', kh: 'បន្ថែមសមាជិក' },
  titleEdit: { en: 'Edit Member', kh: 'កែប្រែសមាជិក' },
  subtitle: {
    en: 'Record the basic profile and contact details for a team member.',
    kh: 'កត់ត្រាព័ត៌មានមូលដ្ឋាន និងទំនាក់ទំនងរបស់សមាជិកក្រុម។',
  },
  basicTitle: { en: 'Basic information', kh: 'ព័ត៌មានមូលដ្ឋាន' },
  basicSub: { en: 'The essentials shown across the directory.', kh: 'ព័ត៌មានសំខាន់ៗដែលបង្ហាញក្នុងបញ្ជីសមាជិក។' },
  detailTitle: { en: 'Contact & details', kh: 'ទំនាក់ទំនង និងព័ត៌មានលម្អិត' },
  detailSub: { en: 'Optional contact and personal information.', kh: 'ព័ត៌មានទំនាក់ទំនង និងផ្ទាល់ខ្លួន (មិនចាំបាច់)។' },
  memberCode: { en: 'Member code', kh: 'លេខកូដសមាជិក' },
  memberCodePlaceholder: { en: 'e.g. MEM-001', kh: 'ឧ. MEM-001' },
  photo: { en: 'Photo', kh: 'រូបថត' },
  photoHint: { en: 'Click to upload a picture (JPG/PNG)', kh: 'ចុចដើម្បីផ្ទុករូបថត (JPG/PNG)' },
  removePhoto: { en: 'Remove photo', kh: 'លុបរូបថត' },
  fullName: { en: 'Full name', kh: 'ឈ្មោះពេញ' },
  fullNamePlaceholder: { en: 'e.g. Jane Smith', kh: 'ឧ. ជេន ស្មីត' },
  position: { en: 'Position', kh: 'មុខតំណែង' },
  positionPlaceholder: { en: 'e.g. Marketing Lead', kh: 'ឧ. អ្នកដឹកនាំផ្នែកទីផ្សារ' },
  rank: { en: 'Rank', kh: 'ឋានៈ' },
  rankPlaceholder: { en: 'e.g. 1', kh: 'ឧ. 1' },
  department: { en: 'Department', kh: 'ផ្នែក' },
  departmentPlaceholder: { en: 'Select department', kh: 'ជ្រើសរើសផ្នែក' },
  category: { en: 'Category', kh: 'ប្រភេទ' },
  categoryPlaceholder: { en: 'e.g. Management', kh: 'ឧ. អ្នកគ្រប់គ្រង' },
  phoneNumber: { en: 'Phone number', kh: 'លេខទូរស័ព្ទ' },
  phoneNumberPlaceholder: { en: 'e.g. +855 12 345 678', kh: 'ឧ. +855 12 345 678' },
  email: { en: 'Email', kh: 'អ៊ីមែល' },
  emailPlaceholder: { en: 'e.g. jane@groceries.com', kh: 'ឧ. jane@groceries.com' },
  address: { en: 'Address', kh: 'អាសយដ្ឋាន' },
  addressPlaceholder: { en: 'Street, district, city', kh: 'ផ្លូវ ខណ្ឌ ទីក្រុង' },
  dateOfBirth: { en: 'Date of birth', kh: 'ថ្ងៃខែឆ្នាំកំណើត' },
  gender: { en: 'Gender', kh: 'ភេទ' },
  genderPlaceholder: { en: 'Select gender', kh: 'ជ្រើសរើសភេទ' },
  emergencyContact: { en: 'Emergency contact', kh: 'ទំនាក់ទំនងបន្ទាន់' },
  emergencyContactPlaceholder: { en: 'e.g. +855 98 765 432', kh: 'ឧ. +855 98 765 432' },
  startDate: { en: 'Start date', kh: 'ថ្ងៃចាប់ផ្តើមការងារ' },
  note: { en: 'Note', kh: 'កំណត់ចំណាំ' },
  notePlaceholder: { en: 'Anything worth remembering about this member...', kh: 'អ្វីដែលគួរចងចាំអំពីសមាជិកនេះ...' },
  required: { en: 'Required', kh: 'ត្រូវការ' },
  optional: { en: 'Optional', kh: 'មិនចាំបាច់' },
  errCode: { en: 'Member code is required', kh: 'ត្រូវការលេខកូដសមាជិក' },
  errName: { en: 'Full name is required', kh: 'ត្រូវការឈ្មោះពេញ' },
  errRank: { en: 'Rank must be a number', kh: 'ឋានៈត្រូវតែជាលេខ' },
  errPhoto: { en: 'Please choose an image file', kh: 'សូមជ្រើសរើសឯកសាររូបភាព' },
  submitCreate: { en: 'Add member', kh: 'បន្ថែមសមាជិក' },
  submitEdit: { en: 'Save changes', kh: 'រក្សាទុកការផ្លាស់ប្តូរ' },
  cancel: { en: 'Cancel', kh: 'បោះបង់' },
  saving: { en: 'Saving...', kh: 'កំពុងរក្សាទុក...' },
  loading: { en: 'Loading member...', kh: 'កំពុងផ្ទុកសមាជិក...' },
  loadError: { en: 'Could not load this member. It may have been removed.', kh: 'មិនអាចផ្ទុកសមាជិកនេះបានទេ។ វាអាចត្រូវបានលុប។' },
  backToList: { en: 'Back to members', kh: 'ត្រឡប់ទៅបញ្ជីសមាជិក' },
  added: { en: 'Member added', kh: 'បានបន្ថែមសមាជិក' },
  updated: { en: 'Member updated', kh: 'បានធ្វើបច្ចុប្បន្នភាពសមាជិក' },
}

const EMPTY_FORM = {
  memberCode: '',
  fullName: '',
  position: '',
  rank: '',
  department: '',
  category: '',
  photoUrl: '',
  detail: {
    phoneNumber: '',
    email: '',
    address: '',
    dateOfBirth: '',
    gender: '',
    emergencyContact: '',
    startDate: '',
    note: '',
  },
}

export default function MemberForm() {
  const { lang } = useLanguage()
  const { addNotification } = useNotifications()
  const navigate = useNavigate()
  const { pathname } = useLocation()

  // AdminD renders this page for /admin/members/add and /admin/members/edit/:id,
  // so detect the mode from the path segments.
  const segments = pathname.split('/').filter(Boolean)
  const isEdit = segments.includes('edit')
  const memberId = isEdit ? segments[segments.length - 1] : null

  const [form, setForm] = useState(EMPTY_FORM)
  const [errors, setErrors] = useState({})
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(isEdit)
  const [loadError, setLoadError] = useState('')
  const [submitError, setSubmitError] = useState('')

  useEffect(() => {
    if (!isEdit || !memberId) return
    let cancelled = false
    const load = async () => {
      try {
        const res = await memberAPI.getById(memberId)
        if (cancelled) return
        const m = res.data
        if (!m) return
        setForm({
          memberCode: m.memberCode || '',
          fullName: m.fullName || '',
          position: m.position || '',
          rank: m.rank == null ? '' : String(m.rank),
          department: m.department || '',
          category: m.category || '',
          photoUrl: m.photoUrl || '',
          detail: {
            phoneNumber: m.detail?.phoneNumber || '',
            email: m.detail?.email || '',
            address: m.detail?.address || '',
            dateOfBirth: m.detail?.dateOfBirth || '',
            gender: m.detail?.gender || '',
            emergencyContact: m.detail?.emergencyContact || '',
            startDate: m.detail?.startDate || '',
            note: m.detail?.note || '',
          },
        })
      } catch (err) {
        if (!cancelled) setLoadError(err.message || TEXTS.loadError[lang])
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => {
      cancelled = true
    }
  }, [isEdit, memberId, lang])

  const handleChange = (e) => {
    const { name, value } = e.target
    if (name.startsWith('detail.')) {
      const key = name.slice(7)
      setForm((prev) => ({ ...prev, detail: { ...prev.detail, [key]: value } }))
    } else {
      setForm((prev) => ({ ...prev, [name]: value }))
    }
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: '' }))
  }

  const handlePhotoChange = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith('image/')) {
      setErrors((prev) => ({ ...prev, photoUrl: TEXTS.errPhoto[lang] }))
      return
    }
    const reader = new FileReader()
    reader.onload = () => {
      setForm((prev) => ({ ...prev, photoUrl: reader.result }))
      setErrors((prev) => ({ ...prev, photoUrl: '' }))
    }
    reader.readAsDataURL(file)
  }

  const validate = () => {
    const e = {}
    if (!form.memberCode.trim()) e.memberCode = TEXTS.errCode[lang]
    if (!form.fullName.trim()) e.fullName = TEXTS.errName[lang]
    if (form.rank !== '' && (form.rank == null || Number.isNaN(Number(form.rank)))) e.rank = TEXTS.errRank[lang]
    return e
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const v = validate()
    setErrors(v)
    if (Object.keys(v).length > 0) return

    const payload = {
      memberCode: form.memberCode.trim(),
      fullName: form.fullName.trim(),
      position: form.position.trim() || null,
      rank: form.rank === '' ? null : Number(form.rank),
      department: form.department || null,
      category: form.category.trim() || null,
      photoUrl: form.photoUrl.trim() || null,
      detail: {
        phoneNumber: form.detail.phoneNumber.trim() || null,
        email: form.detail.email.trim() || null,
        address: form.detail.address.trim() || null,
        dateOfBirth: form.detail.dateOfBirth || null,
        gender: form.detail.gender || null,
        emergencyContact: form.detail.emergencyContact.trim() || null,
        startDate: form.detail.startDate || null,
        note: form.detail.note.trim() || null,
      },
    }

    setSaving(true)
    setSubmitError('')
    try {
      if (isEdit) {
        await memberAPI.update(memberId, payload)
        addNotification({
          type: 'member',
          action: 'update',
          title: TEXTS.updated[lang],
          detail: payload.fullName,
        })
      } else {
        await memberAPI.create(payload)
        addNotification({
          type: 'member',
          action: 'add',
          title: TEXTS.added[lang],
          detail: payload.fullName,
        })
      }
      navigate('/admin/members')
    } catch (err) {
      setSubmitError(err.message || TEXTS.loadError[lang])
    } finally {
      setSaving(false)
    }
  }

  const inputBase = 'w-full rounded-xl border border-slate-700/70 bg-slate-950/60 px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-blue-400 focus:bg-slate-950 focus:ring-4 focus:ring-blue-500/10'
  const errorInput = 'border-red-500/80 bg-red-500/10 focus:border-red-400 focus:ring-red-500/10'

  if (loading) {
    return (
      <div className="flex min-h-64 flex-col items-center justify-center gap-3 rounded-3xl border border-slate-700/60 bg-slate-900/80 p-12 text-center">
        <span className="h-10 w-10 animate-spin rounded-full border-4 border-slate-700 border-t-blue-400" />
        <p className="text-sm text-slate-400">{TEXTS.loading[lang]}</p>
      </div>
    )
  }

  if (loadError) {
    return (
      <div className="flex min-h-64 flex-col items-center justify-center gap-4 rounded-3xl border border-slate-700/60 bg-slate-900/80 p-12 text-center">
        <span className="text-4xl">⚠️</span>
        <p className="text-sm font-semibold text-red-300">{loadError}</p>
        <Link to="/admin/members" className="rounded-xl border border-slate-700 px-4 py-2 text-sm font-bold text-slate-300 transition hover:border-blue-400 hover:bg-blue-500/10 hover:text-blue-300">
          {TEXTS.backToList[lang]}
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Hero */}
      <section className="relative overflow-hidden rounded-3xl border border-blue-500/20 bg-gradient-to-br from-slate-800 via-slate-900 to-slate-950 p-6 shadow-2xl shadow-blue-500/10">
        <div className="pointer-events-none absolute -right-16 -top-20 h-56 w-56 rounded-full bg-blue-500/20 blur-3xl" />
        <div className="pointer-events-none absolute bottom-0 left-1/3 h-px w-2/3 bg-gradient-to-r from-transparent via-blue-400/50 to-transparent" />
        <div className="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <Link to="/admin/members" className="mb-5 inline-flex items-center gap-2 rounded-full border border-slate-700/70 bg-slate-950/50 px-3 py-1.5 text-xs font-bold uppercase tracking-[0.18em] text-blue-300 transition hover:border-blue-400 hover:text-blue-200">
              <ChevronLeftIcon /> {TEXTS.back[lang]}
            </Link>
            <div className="flex items-center gap-4">
              <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-500/15 text-3xl ring-1 ring-blue-400/30">{isEdit ? '✏️' : '👤'}</span>
              <div>
                <p className="text-xs font-black uppercase tracking-[0.28em] text-blue-300">{TEXTS.eyebrow[lang]}</p>
                <h1 className="mt-1 text-3xl font-black tracking-tight text-white md:text-4xl">{isEdit ? TEXTS.titleEdit[lang] : TEXTS.titleCreate[lang]}</h1>
              </div>
            </div>
            <p className="mt-4 max-w-2xl text-sm leading-6 text-slate-300">{TEXTS.subtitle[lang]}</p>
          </div>
          {isEdit && (
            <span className="inline-flex w-fit items-center gap-2 rounded-full border border-blue-400/30 bg-blue-500/10 px-3 py-1 text-xs font-bold text-blue-300">
              ✏️ {TEXTS.titleEdit[lang]}
            </span>
          )}
        </div>
      </section>

      {submitError && (
        <div className="flex items-center gap-3 rounded-2xl border border-red-500/40 bg-red-500/10 px-5 py-4">
          <span className="text-xl">⚠️</span>
          <p className="text-sm font-semibold text-red-300">{submitError}</p>
        </div>
      )}

      <form id="member-form" onSubmit={handleSubmit} noValidate className="grid grid-cols-1 gap-6 2xl:grid-cols-2">
        {/* Basic information */}
        <section className="rounded-3xl border border-slate-700/60 bg-slate-900/80 p-6 shadow-xl shadow-black/20">
          <div className="mb-5 border-b border-slate-700/60 pb-4">
            <h2 className="text-xl font-black text-white">{TEXTS.basicTitle[lang]}</h2>
            <p className="mt-1 text-sm text-slate-400">{TEXTS.basicSub[lang]}</p>
          </div>
          <div className="space-y-5">
            {/* Photo upload */}
            <div className="space-y-2">
              <span className="flex items-center justify-between gap-3 text-sm font-bold text-slate-200">
                <span>{TEXTS.photo[lang]}</span>
                <span className="rounded-full bg-slate-800 px-2 py-0.5 text-[10px] font-black uppercase tracking-wide text-slate-500">{TEXTS.optional[lang]}</span>
              </span>
              <div className="flex items-center gap-4">
                {form.photoUrl ? (
                  <img src={form.photoUrl} alt={form.fullName || 'member'} className="h-20 w-20 rounded-2xl object-cover ring-1 ring-blue-400/30" />
                ) : (
                  <span className="flex h-20 w-20 items-center justify-center rounded-2xl bg-slate-950/60 text-3xl ring-1 ring-slate-700/70">📷</span>
                )}
                <div className="flex flex-col gap-2">
                  <label className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-slate-700 px-4 py-2 text-sm font-bold text-slate-300 transition hover:border-blue-400 hover:bg-blue-500/10 hover:text-blue-300">
                    <UploadIcon />
                    <span className="text-xs">{TEXTS.photoHint[lang]}</span>
                    <input type="file" accept="image/*" className="hidden" onChange={handlePhotoChange} />
                  </label>
                  {form.photoUrl && (
                    <button type="button" onClick={() => setForm((prev) => ({ ...prev, photoUrl: '' }))} className="inline-flex items-center justify-center gap-1.5 text-xs font-bold text-red-300 transition hover:text-red-200">
                      <XIcon /> {TEXTS.removePhoto[lang]}
                    </button>
                  )}
                </div>
              </div>
              {errors.photoUrl && <span className="block text-xs font-semibold text-red-300">{errors.photoUrl}</span>}
            </div>

            <Field label={TEXTS.memberCode[lang]} badge={TEXTS.required[lang]} error={errors.memberCode}>
              <input name="memberCode" type="text" placeholder={TEXTS.memberCodePlaceholder[lang]} value={form.memberCode} onChange={handleChange} className={`${inputBase} ${errors.memberCode ? errorInput : ''}`} />
            </Field>
            <Field label={TEXTS.fullName[lang]} badge={TEXTS.required[lang]} error={errors.fullName}>
              <input name="fullName" type="text" placeholder={TEXTS.fullNamePlaceholder[lang]} value={form.fullName} onChange={handleChange} className={`${inputBase} ${errors.fullName ? errorInput : ''}`} />
            </Field>
            <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
              <Field label={TEXTS.position[lang]} badge={TEXTS.optional[lang]} muted>
                <input name="position" type="text" placeholder={TEXTS.positionPlaceholder[lang]} value={form.position} onChange={handleChange} className={inputBase} />
              </Field>
              <Field label={TEXTS.rank[lang]} badge={TEXTS.optional[lang]} muted error={errors.rank}>
                <input name="rank" type="number" min="0" step="1" placeholder={TEXTS.rankPlaceholder[lang]} value={form.rank} onChange={handleChange} className={`${inputBase} ${errors.rank ? errorInput : ''}`} />
              </Field>
            </div>
            <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
              <Field label={TEXTS.department[lang]} badge={TEXTS.optional[lang]} muted>
                <select name="department" value={form.department} onChange={handleChange} className={inputBase}>
                  <option value="">{TEXTS.departmentPlaceholder[lang]}</option>
                  {DEPARTMENTS.map((d) => <option key={d.en} value={d.en}>{d[lang]}</option>)}
                </select>
              </Field>
              <Field label={TEXTS.category[lang]} badge={TEXTS.optional[lang]} muted>
                <input name="category" type="text" placeholder={TEXTS.categoryPlaceholder[lang]} value={form.category} onChange={handleChange} className={inputBase} />
              </Field>
            </div>
          </div>
        </section>

        {/* Contact & details */}
        <section className="rounded-3xl border border-slate-700/60 bg-slate-900/80 p-6 shadow-xl shadow-black/20">
          <div className="mb-5 border-b border-slate-700/60 pb-4">
            <h2 className="text-xl font-black text-white">{TEXTS.detailTitle[lang]}</h2>
            <p className="mt-1 text-sm text-slate-400">{TEXTS.detailSub[lang]}</p>
          </div>
          <div className="space-y-5">
            <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
              <Field label={TEXTS.phoneNumber[lang]} badge={TEXTS.optional[lang]} muted>
                <input name="detail.phoneNumber" type="tel" placeholder={TEXTS.phoneNumberPlaceholder[lang]} value={form.detail.phoneNumber} onChange={handleChange} className={inputBase} />
              </Field>
              <Field label={TEXTS.email[lang]} badge={TEXTS.optional[lang]} muted>
                <input name="detail.email" type="email" placeholder={TEXTS.emailPlaceholder[lang]} value={form.detail.email} onChange={handleChange} className={inputBase} />
              </Field>
            </div>
            <Field label={TEXTS.address[lang]} badge={TEXTS.optional[lang]} muted>
              <input name="detail.address" type="text" placeholder={TEXTS.addressPlaceholder[lang]} value={form.detail.address} onChange={handleChange} className={inputBase} />
            </Field>
            <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
              <Field label={TEXTS.dateOfBirth[lang]} badge={TEXTS.optional[lang]} muted>
                <input name="detail.dateOfBirth" type="date" value={form.detail.dateOfBirth} onChange={handleChange} className={inputBase} />
              </Field>
              <Field label={TEXTS.gender[lang]} badge={TEXTS.optional[lang]} muted>
                <select name="detail.gender" value={form.detail.gender} onChange={handleChange} className={inputBase}>
                  <option value="">{TEXTS.genderPlaceholder[lang]}</option>
                  {GENDERS.map((g) => <option key={g.en} value={g.en}>{g[lang]}</option>)}
                </select>
              </Field>
            </div>
            <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
              <Field label={TEXTS.emergencyContact[lang]} badge={TEXTS.optional[lang]} muted>
                <input name="detail.emergencyContact" type="tel" placeholder={TEXTS.emergencyContactPlaceholder[lang]} value={form.detail.emergencyContact} onChange={handleChange} className={inputBase} />
              </Field>
              <Field label={TEXTS.startDate[lang]} badge={TEXTS.optional[lang]} muted>
                <input name="detail.startDate" type="date" value={form.detail.startDate} onChange={handleChange} className={inputBase} />
              </Field>
            </div>
            <Field label={TEXTS.note[lang]} badge={TEXTS.optional[lang]} muted>
              <textarea name="detail.note" rows="3" placeholder={TEXTS.notePlaceholder[lang]} value={form.detail.note} onChange={handleChange} className={`${inputBase} min-h-24 resize-y`} />
            </Field>
          </div>
        </section>
      </form>

      {/* Sticky action bar */}
      <div className="sticky bottom-4 z-10">
        <div className="flex flex-col gap-3 rounded-2xl border border-slate-700/60 bg-slate-900/95 p-4 shadow-2xl shadow-black/40 backdrop-blur sm:flex-row">
          <button
            type="submit"
            form="member-form"
            disabled={saving}
            className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-blue-500 px-5 py-3 text-sm font-black text-slate-950 shadow-lg shadow-blue-500/20 transition hover:-translate-y-0.5 hover:bg-blue-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-300 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0"
          >
            {saving ? <SpinnerIcon /> : (isEdit ? <CheckIcon /> : <PlusIcon />)} {saving ? TEXTS.saving[lang] : (isEdit ? TEXTS.submitEdit[lang] : TEXTS.submitCreate[lang])}
          </button>
          <Link to="/admin/members" className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-700 px-5 py-3 text-sm font-bold text-slate-300 transition hover:border-slate-500 hover:bg-slate-800 hover:text-white">
            <XIcon /> {TEXTS.cancel[lang]}
          </Link>
        </div>
      </div>
    </div>
  )
}

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

const ChevronLeftIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
    <polyline points="15 18 9 12 15 6" />
  </svg>
)

const UploadIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    <polyline points="17 8 12 3 7 8" />
    <line x1="12" y1="3" x2="12" y2="15" />
  </svg>
)

const PlusIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
    <line x1="12" y1="5" x2="12" y2="19" />
    <line x1="5" y1="12" x2="19" y2="12" />
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

const SpinnerIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" className="animate-spin">
    <path d="M12 2a10 10 0 0 1 10 10" />
  </svg>
)
