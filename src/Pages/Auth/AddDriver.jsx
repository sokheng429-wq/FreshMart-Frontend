import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useLanguage } from '../../context/LanguageContext'
import { useNotifications } from '../../context/NotificationContext'
import './AddDriver.css'

const VEHICLE_OPTIONS = [
  { key: 'motorbike', icon: '🏍️', en: 'Motorbike', kh: 'ម៉ូតូ' },
  { key: 'car', icon: '🚗', en: 'Car', kh: 'ឡានតូច' },
  { key: 'van', icon: '🚐', en: 'Van', kh: 'ឡានវ៉ាន់' },
  { key: 'truck', icon: '🚚', en: 'Truck', kh: 'ឡានផ្ទុក' },
]

const EMPTY_FORM = {
  name: '',
  phone: '',
  email: '',
  vehicleKey: 'motorbike',
  plate: '',
  zoneEn: '',
  zoneKh: '',
}

const TEXTS = {
  heroTitle: { en: 'Delivery fleet', kh: 'ក្រុមដឹកជញ្ជូន' },
  heroSub: {
    en: 'Register delivery drivers and their vehicles so orders can be assigned and tracked across B\'Groceries.',
    kh: 'ចុះឈ្មោះអ្នកដឹកជញ្ជូន និងយានយន្តរបស់ពួកគេ ដើម្បីឱ្យការបញ្ជាទិញអាចបែងចែក និងតាមដានបាន។',
  },
  formTitle: { en: 'Driver information', kh: 'ព័ត៌មានអ្នកដឹកជញ្ជូន' },
  formSub: {
    en: 'Fill in the driver contact details, vehicle, and delivery area.',
    kh: 'បំពេញព័ត៌មានទំនាក់ទំនង យានយន្ត និងតំបន់ដឹកជញ្ជូនរបស់អ្នកបើកបរ។',
  },
  name: { en: 'Driver name', kh: 'ឈ្មោះអ្នកដឹកជញ្ជូន' },
  namePlaceholder: { en: 'e.g. Sok Dara', kh: 'ឧ. សុខ ឌារា' },
  phone: { en: 'Phone number', kh: 'លេខទូរស័ព្ទ' },
  phonePlaceholder: { en: 'e.g. 012 345 678', kh: 'ឧ. 012 345 678' },
  email: { en: 'Email', kh: 'អ៊ីមែល' },
  emailPlaceholder: { en: 'e.g. dara@freshmart.com', kh: 'ឧ. dara@freshmart.com' },
  vehicle: { en: 'Vehicle type', kh: 'ប្រភេទយានយន្ត' },
  plate: { en: 'License plate', kh: 'ផ្លាកលេខ' },
  platePlaceholder: { en: 'e.g. 1KH-2345', kh: 'ឧ. 1KH-2345' },
  zoneEn: { en: 'Delivery area (English)', kh: 'តំបន់ដឹកជញ្ជូន (អង់គ្លេស)' },
  zoneKh: { en: 'Delivery area (Khmer)', kh: 'តំបន់ដឹកជញ្ជូន (ខ្មែរ)' },
  zonePlaceholderEn: { en: 'e.g. Phnom Penh — Toul Kork', kh: 'ឧ. ភ្នំពេញ — ទួលគោក' },
  zonePlaceholderKh: { en: 'ឧ. ភ្នំពេញ — ទួលគោក', kh: 'ឧ. ភ្នំពេញ — ទួលគោក' },
  addBtn: { en: 'Add driver', kh: 'បន្ថែមអ្នកដឹកជញ្ជូន' },
  updateBtn: { en: 'Save driver', kh: 'រក្សាទុកអ្នកដឹកជញ្ជូន' },
  cancelBtn: { en: 'Cancel edit', kh: 'បោះបង់ការកែប្រែ' },
  required: { en: 'Required', kh: 'ត្រូវការ' },
  optional: { en: 'Optional', kh: 'មិនចាំបាច់' },
  errName: { en: 'Driver name is required', kh: 'ត្រូវការឈ្មោះអ្នកដឹកជញ្ជូន' },
  errPhone: { en: 'Phone number is required', kh: 'ត្រូវការលេខទូរស័ព្ទ' },
  errPlate: { en: 'License plate is required', kh: 'ត្រូវការផ្លាកលេខ' },
  listTitle: { en: 'Driver queue', kh: 'បញ្ជីអ្នកដឹកជញ្ជូន' },
  empty: { en: 'No drivers yet. Add the first driver and they will appear here for quick edits.', kh: 'មិនទាន់មានអ្នកដឹកជញ្ជូនទេ។ បន្ថែមអ្នកដឹកជញ្ជូនដំបូង ហើយពួកគេនឹងបង្ហាញនៅទីនេះ។' },
  remove: { en: 'Remove', kh: 'លុប' },
  edit: { en: 'Edit', kh: 'កែប្រែ' },
  back: { en: 'Dashboard', kh: 'ផ្ទាំងគ្រប់គ្រង' },
  livePreview: { en: 'Live preview', kh: 'មើលជាមុន' },
  unnamed: { en: 'New driver', kh: 'អ្នកដឹកជញ្ជូនថ្មី' },
  items: { en: 'Drivers', kh: 'អ្នកដឹកជញ្ជូន' },
  vehicles: { en: 'Vehicles', kh: 'យានយន្ត' },
  zones: { en: 'Areas', kh: 'តំបន់' },
  withEmail: { en: 'With email', kh: 'មានអ៊ីមែល' },
}

const initials = (name) =>
  name.trim() ? name.trim().split(/\s+/).map((w) => w[0]).slice(0, 2).join('').toUpperCase() : 'BG'

export const AddDriver = () => {
  const { lang } = useLanguage()
  const { addNotification } = useNotifications()
  const [form, setForm] = useState(EMPTY_FORM)
  const [errors, setErrors] = useState({})
  const [drivers, setDrivers] = useState([])
  const [editingId, setEditingId] = useState(null)

  const handleChange = (e) => {
    const { name, value } = e.target
    setForm((prev) => ({ ...prev, [name]: value }))
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: '' }))
  }

  const validate = () => {
    const e = {}
    if (!form.name.trim()) e.name = TEXTS.errName[lang]
    if (!form.phone.trim()) e.phone = TEXTS.errPhone[lang]
    if (!form.plate.trim()) e.plate = TEXTS.errPlate[lang]
    return e
  }

  const startEdit = (driver) => {
    setEditingId(driver.id)
    setForm({
      name: driver.name,
      phone: driver.phone,
      email: driver.email,
      vehicleKey: driver.vehicle.key,
      plate: driver.plate,
      zoneEn: driver.zone.en,
      zoneKh: driver.zone.kh,
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
      const driverData = {
        name: form.name.trim(),
        phone: form.phone.trim(),
        email: form.email.trim(),
        vehicle: VEHICLE_OPTIONS.find((vehicle) => vehicle.key === form.vehicleKey) || VEHICLE_OPTIONS[0],
        plate: form.plate.trim(),
        zone: { en: form.zoneEn.trim(), kh: form.zoneKh.trim() },
      }

      if (editingId) {
        setDrivers((prev) => prev.map((driver) => driver.id === editingId ? { ...driver, ...driverData } : driver))
        cancelEdit()
      } else {
        const newDriver = { id: Date.now(), ...driverData }
        setDrivers((prev) => [...prev, newDriver])
        addNotification({
          type: 'driver',
          title: lang === 'kh' ? 'បានបន្ថែមអ្នកដឹកជញ្ជូនថ្មី' : 'New delivery driver added',
          detail: `${newDriver.name} — ${newDriver.plate}`,
          href: '/admin/drivers/add',
        })
        setForm(EMPTY_FORM)
      }
    }
  }

  const removeDriver = (id) => {
    if (editingId === id) cancelEdit()
    setDrivers((prev) => prev.filter((driver) => driver.id !== id))
  }

  const selectedVehicle = VEHICLE_OPTIONS.find((vehicle) => vehicle.key === form.vehicleKey)
  const previewZone = lang === 'kh' ? form.zoneKh : form.zoneEn
  const vehicleCount = new Set(drivers.map((driver) => driver.vehicle.key)).size
  const zoneCount = new Set(drivers.map((driver) => driver.zone.en).filter(Boolean)).size
  const withEmail = drivers.filter((driver) => driver.email).length

  const inputBase = 'w-full rounded-xl border border-slate-700/70 bg-slate-950/60 px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-orange-400 focus:bg-slate-950 focus:ring-4 focus:ring-orange-500/10'
  const errorInput = 'border-red-500/80 bg-red-500/10 focus:border-red-400 focus:ring-red-500/10'

  return (
    <div className="space-y-6">
      <section className="relative overflow-hidden rounded-3xl border border-orange-500/20 bg-gradient-to-br from-slate-800 via-slate-900 to-slate-950 p-6 shadow-2xl shadow-orange-500/10">
        <div className="pointer-events-none absolute -right-16 -top-20 h-56 w-56 rounded-full bg-orange-500/20 blur-3xl" />
        <div className="pointer-events-none absolute bottom-0 left-1/3 h-px w-2/3 bg-gradient-to-r from-transparent via-orange-400/50 to-transparent" />
        <div className="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <Link to="/admin" className="mb-5 inline-flex items-center gap-2 rounded-full border border-slate-700/70 bg-slate-950/50 px-3 py-1.5 text-xs font-bold uppercase tracking-[0.18em] text-orange-300 transition hover:border-orange-400 hover:text-orange-200">
              <ChevronLeftIcon /> {TEXTS.back[lang]}
            </Link>
            <div className="flex items-center gap-4">
              <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-orange-500/15 text-3xl ring-1 ring-orange-400/30">🚚</span>
              <div>
                <p className="text-xs font-black uppercase tracking-[0.28em] text-orange-300">FreshMart delivery team</p>
                <h1 className="mt-1 text-3xl font-black tracking-tight text-white md:text-4xl">{TEXTS.heroTitle[lang]}</h1>
              </div>
            </div>
            <p className="mt-4 max-w-2xl text-sm leading-6 text-slate-300">{TEXTS.heroSub[lang]}</p>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Stat value={drivers.length} label={TEXTS.items[lang]} />
            <Stat value={vehicleCount} label={TEXTS.vehicles[lang]} />
            <Stat value={zoneCount} label={TEXTS.zones[lang]} />
            <Stat value={withEmail} label={TEXTS.withEmail[lang]} />
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

              <Field label={TEXTS.phone[lang]} badge={TEXTS.required[lang]} error={errors.phone}>
                <input id="phone" name="phone" type="tel" placeholder={TEXTS.phonePlaceholder[lang]} value={form.phone} onChange={handleChange} className={`${inputBase} ${errors.phone ? errorInput : ''}`} />
              </Field>
            </div>

            <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
              <Field label={TEXTS.email[lang]} badge={TEXTS.optional[lang]} muted>
                <input id="email" name="email" type="email" placeholder={TEXTS.emailPlaceholder[lang]} value={form.email} onChange={handleChange} className={inputBase} />
              </Field>

              <Field label={TEXTS.vehicle[lang]} badge={TEXTS.required[lang]}>
                <select id="vehicleKey" name="vehicleKey" value={form.vehicleKey} onChange={handleChange} className={inputBase}>
                  {VEHICLE_OPTIONS.map((vehicle) => (
                    <option key={vehicle.key} value={vehicle.key}>{vehicle.icon} {vehicle[lang]}</option>
                  ))}
                </select>
              </Field>
            </div>

            <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
              <Field label={TEXTS.plate[lang]} badge={TEXTS.required[lang]} error={errors.plate}>
                <input id="plate" name="plate" type="text" placeholder={TEXTS.platePlaceholder[lang]} value={form.plate} onChange={handleChange} className={`${inputBase} ${errors.plate ? errorInput : ''}`} />
              </Field>

              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                <Field label={TEXTS.zoneEn[lang]} badge={TEXTS.optional[lang]} muted>
                  <input id="zoneEn" name="zoneEn" type="text" placeholder={TEXTS.zonePlaceholderEn[lang]} value={form.zoneEn} onChange={handleChange} className={inputBase} />
                </Field>
                <Field label={TEXTS.zoneKh[lang]} badge={TEXTS.optional[lang]} muted>
                  <input id="zoneKh" name="zoneKh" type="text" placeholder={TEXTS.zonePlaceholderKh[lang]} value={form.zoneKh} onChange={handleChange} className={inputBase} />
                </Field>
              </div>
            </div>

            <div className="flex flex-col gap-3 border-t border-slate-700/60 pt-5 sm:flex-row">
              <button type="submit" className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-orange-500 px-5 py-3 text-sm font-black text-slate-950 shadow-lg shadow-orange-500/20 transition hover:-translate-y-0.5 hover:bg-orange-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-300">
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
          <div className="rounded-3xl border border-orange-500/20 bg-gradient-to-br from-slate-900 to-slate-950 p-5 shadow-xl shadow-black/20">
            <div className="mb-4 flex items-center justify-between">
              <p className="text-xs font-black uppercase tracking-[0.2em] text-orange-300">{TEXTS.livePreview[lang]}</p>
              <span className="rounded-full bg-orange-500/15 px-3 py-1 text-xs font-black text-orange-300">{selectedVehicle?.icon} {selectedVehicle?.[lang]}</span>
            </div>
            <div className="rounded-2xl border border-slate-700 bg-slate-950/60 p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-orange-500 to-amber-600 text-base font-black text-slate-950 shadow-lg shadow-black/30 ring-2 ring-white/10">
                  {initials(form.name)}
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="truncate text-base font-black text-white">{form.name || TEXTS.unnamed[lang]}</h3>
                  <p className="truncate text-xs font-bold text-orange-300">{form.phone || '—'}</p>
                  {form.email && <p className="mt-0.5 truncate text-xs text-slate-500">{form.email}</p>}
                </div>
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                <span className="rounded-full bg-orange-500/10 px-3 py-1 text-xs font-bold text-orange-300">{selectedVehicle?.icon} {form.plate || '—'}</span>
              </div>
              <p className="mt-4 flex items-center gap-2 text-sm font-semibold text-slate-400"><PinIcon /> {previewZone || '—'}</p>
            </div>
          </div>

          <div className="rounded-3xl border border-slate-700/60 bg-slate-900/80 p-5 shadow-xl shadow-black/20">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-black text-white">{TEXTS.listTitle[lang]}</h3>
              <span className="flex h-8 min-w-8 items-center justify-center rounded-full bg-orange-500 px-2 text-sm font-black text-slate-950">{drivers.length}</span>
            </div>

            {drivers.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-700 bg-slate-950/40 p-8 text-center">
                <span className="text-4xl">🚚</span>
                <p className="mt-3 text-sm leading-6 text-slate-400">{TEXTS.empty[lang]}</p>
              </div>
            ) : (
              <div className="max-h-[540px] space-y-3 overflow-y-auto pr-1 scrollbar-thin scrollbar-track-slate-900">
                {drivers.map((driver) => (
                  <article key={driver.id} className="group rounded-2xl border border-slate-700/70 bg-slate-950/50 p-3 transition hover:border-orange-500/50 hover:bg-slate-950">
                    <div className="flex items-start gap-3">
                      <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-orange-500 to-amber-600 text-sm font-black text-slate-950 ring-1 ring-orange-500/20">
                        {initials(driver.name)}
                      </div>
                      <div className="min-w-0 flex-1">
                        <h4 className="truncate text-sm font-black text-white">{driver.name}</h4>
                        <p className="truncate text-xs font-bold text-orange-300">{driver.phone}</p>
                        <div className="mt-2 flex flex-wrap gap-1.5">
                          <span className="rounded-full bg-slate-800 px-2 py-0.5 text-[11px] font-bold text-slate-300">{driver.vehicle.icon} {driver.plate}</span>
                          {(driver.zone[lang] || driver.zone.en) && <span className="rounded-full bg-orange-500/10 px-2 py-0.5 text-[11px] font-bold text-orange-300">📍 {driver.zone[lang] || driver.zone.en}</span>}
                        </div>
                        {driver.email && <p className="mt-2 truncate text-xs leading-5 text-slate-400">{driver.email}</p>}
                      </div>
                      <div className="flex flex-col gap-2 opacity-100 sm:opacity-70 sm:transition sm:group-hover:opacity-100">
                        <button className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-700 text-slate-400 transition hover:border-blue-400 hover:bg-blue-500/10 hover:text-blue-300" onClick={() => startEdit(driver)} aria-label={TEXTS.edit[lang]}>
                          <EditIcon />
                        </button>
                        <button className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-700 text-slate-400 transition hover:border-red-400 hover:bg-red-500/10 hover:text-red-300" onClick={() => removeDriver(driver.id)} aria-label={TEXTS.remove[lang]}>
                          <TrashIcon />
                        </button>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            )}
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
      {badge && <span className={`rounded-full px-2 py-0.5 text-[10px] font-black uppercase tracking-wide ${muted ? 'bg-slate-800 text-slate-500' : 'bg-orange-500/10 text-orange-300'}`}>{badge}</span>}
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
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round" className="text-orange-300">
    <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
    <circle cx="12" cy="10" r="3" />
  </svg>
)

export default AddDriver
