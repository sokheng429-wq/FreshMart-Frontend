import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useLanguage } from '../../context/LanguageContext'
import { useNotifications } from '../../context/NotificationContext'
import { userAPI } from '../../api/api'
import { PageLoader } from '../../components/PageLoader'
import './ManageUsers.css'

// Role hierarchy: ADMIN (full access, always on top) > STORE ("Online Store" —
// products-side dashboard only) > USER (regular account).
const ROLES = {
  ADMIN: {
    color: '#a855f7', bg: 'bg-purple-500/15', text: 'text-purple-300', ring: 'ring-purple-400/40',
    desc: { en: 'Full access — can manage everything', kh: 'សិទ្ធិពេញលេញ — អាចគ្រប់គ្រងអ្វីៗទាំងអស់' },
  },
  STORE: {
    color: '#22c55e', bg: 'bg-green-500/15', text: 'text-green-300', ring: 'ring-green-400/40',
    desc: { en: 'Online Store — products, promotions & partners only', kh: 'ហាងអនឡាញ — តែផលិតផល ការផ្សព្វផ្សាយ និងដៃគូប៉ុណ្ណោះ' },
  },
  USER: {
    color: '#94a3b8', bg: 'bg-slate-500/15', text: 'text-slate-300', ring: 'ring-slate-400/40',
    desc: { en: 'Regular account — browse & order', kh: 'គណនីធម្មតា — មើល និងបញ្ជាទិញ' },
  },
}

const TEXTS = {
  back: { en: 'Dashboard', kh: 'ផ្ទាំងគ្រប់គ្រង' },
  heroEy: { en: 'Team & access', kh: 'ក្រុម និងសិទ្ធិ' },
  title: { en: 'Manage Users', kh: 'គ្រប់គ្រងអ្នកប្រើប្រាស់' },
  subtitle: { en: 'See every registered account and control who has admin access.', kh: 'មើលគណនីដែលបានចុះឈ្មោះទាំងអស់ និងគ្រប់គ្រងសិទ្ធិអ្នកគ្រប់គ្រង។' },
  addUser: { en: 'Add user', kh: 'បន្ថែមអ្នកប្រើប្រាស់' },
  editUser: { en: 'Edit User', kh: 'កែប្រែអ្នកប្រើប្រាស់' },
  viewUser: { en: 'View User Info', kh: 'មើលព័ត៌មានអ្នកប្រើប្រាស់' },
  viewUserSub: { en: 'Full account details (password hidden)', kh: 'ព័ត៌មានគណនីទាំងអស់ (លាក់ពាក្យសម្ងាត់)' },
  newUser: { en: 'Add New User', kh: 'បន្ថែមអ្នកប្រើប្រាស់ថ្មី' },
  updateUser: { en: 'Save changes', kh: 'រក្សាទុកការផ្លាស់ប្តូរ' },
  thUser: { en: 'User', kh: 'អ្នកប្រើប្រាស់' },
  thRole: { en: 'Role', kh: 'តួនាទី' },
  thStatus: { en: 'Status', kh: 'ស្ថានភាព' },
  thProvider: { en: 'Provider', kh: 'ការចូល' },
  thJoined: { en: 'Joined', kh: 'កាលបរិច្ឆេទចូល' },
  thActions: { en: 'Actions', kh: 'សកម្មភាព' },
  fullName: { en: 'Full name', kh: 'ឈ្មោះពេញ' },
  namePlaceholder: { en: 'e.g. Jane Smith', kh: 'ឧ. ជេន ស្មីត' },
  username: { en: 'Username', kh: 'ឈ្មោះអ្នកប្រើ' },
  usernamePlaceholder: { en: 'e.g. jane', kh: 'ឧ. jane' },
  email: { en: 'Email', kh: 'អ៊ីមែល' },
  emailPlaceholder: { en: 'e.g. jane@groceries.com', kh: 'ឧ. jane@groceries.com' },
  phone: { en: 'Phone number', kh: 'លេខទូរស័ព្ទ' },
  phonePlaceholder: { en: 'e.g. +855 12 345 678', kh: 'ឧ. +855 12 345 678' },
  password: { en: 'Password', kh: 'ពាក្យសម្ងាត់' },
  passwordPlaceholder: { en: 'Min 6 characters', kh: 'យ៉ាងតិច ៦តួអក្សរ' },
  role: { en: 'Role', kh: 'តួនាទី' },
  enabled: { en: 'Account active', kh: 'គណនីសកម្ម' },
  legendTitle: { en: 'Roles', kh: 'តួនាទី' },
  tableTitle: { en: 'Registered users', kh: 'អ្នកប្រើប្រាស់ដែលបានចុះឈ្មោះ' },
  totalUsers: { en: 'Total users', kh: 'អ្នកប្រើប្រាស់សរុប' },
  admins: { en: 'Admins', kh: 'អ្នកគ្រប់គ្រង' },
  active: { en: 'Active', kh: 'សកម្ម' },
  disabled: { en: 'Disabled', kh: 'បិទ' },
  providerPassword: { en: 'Password', kh: 'ពាក្យសម្ងាត់' },
  fieldId: { en: 'ID', kh: 'លេខសម្គាល់' },
  fieldFullName: { en: 'Full name', kh: 'ឈ្មោះពេញ' },
  fieldUsername: { en: 'Username', kh: 'ឈ្មោះអ្នកប្រើ' },
  fieldEmail: { en: 'Email', kh: 'អ៊ីមែល' },
  fieldPhone: { en: 'Phone number', kh: 'លេខទូរស័ព្ទ' },
  fieldRole: { en: 'Role', kh: 'តួនាទី' },
  fieldStatus: { en: 'Status', kh: 'ស្ថានភាព' },
  fieldProvider: { en: 'Login provider', kh: 'ការចូល' },
  fieldJoined: { en: 'Joined', kh: 'កាលបរិច្ឆេទចូល' },
  fieldPassword: { en: 'Password', kh: 'ពាក្យសម្ងាត់' },
  passwordHidden: { en: '•••••••• (hidden)', kh: '•••••••• (លាក់)' },
  close: { en: 'Close', kh: 'បិទ' },
  editThis: { en: 'Edit', kh: 'កែប្រែ' },
  loading: { en: 'Loading users...', kh: 'កំពុងផ្ទុកអ្នកប្រើប្រាស់...' },
  search: { en: 'Search by name, email, username or phone...', kh: 'ស្វែងរកតាមឈ្មោះ អ៊ីមែល ឈ្មោះអ្នកប្រើ ឬទូរស័ព្ទ...' },
  searchLabel: { en: 'Search', kh: 'ស្វែងរក' },
  noSearchResults: { en: 'No users match your search.', kh: 'មិនមានអ្នកប្រើប្រាស់ដែលត្រូវនឹងការស្វែងរកទេ។' },
  error: { en: 'Could not load users.', kh: 'មិនអាចផ្ទុកអ្នកប្រើប្រាស់បានទេ។' },
  retry: { en: 'Try again', kh: 'ព្យាយាមម្តងទៀត' },
  empty: { en: 'No users found.', kh: 'មិនមានអ្នកប្រើប្រាស់ទេ។' },
  required: { en: 'Required', kh: 'ត្រូវការ' },
  errName: { en: 'Name is required', kh: 'ត្រូវការឈ្មោះ' },
  errUsername: { en: 'Username is required', kh: 'ត្រូវការឈ្មោះអ្នកប្រើ' },
  errEmail: { en: 'Valid email is required', kh: 'ត្រូវការអ៊ីមែលត្រឹមត្រូវ' },
  errPassword: { en: 'Password is required (min 6 characters)', kh: 'ត្រូវការពាក្យសម្ងាត់ (យ៉ាងតិច ៦តួអក្សរ)' },
  confirmDelete: { en: 'Delete this user? This cannot be undone.', kh: 'លុបអ្នកប្រើប្រាស់នេះ? មិនអាចត្រឡប់វិញបានទេ។' },
  added: { en: 'User added', kh: 'បានបន្ថែមអ្នកប្រើប្រាស់' },
  updated: { en: 'User updated', kh: 'បានធ្វើបច្ចុប្បន្នភាពអ្នកប្រើប្រាស់' },
  deleted: { en: 'User deleted', kh: 'បានលុបអ្នកប្រើប្រាស់' },
  saving: { en: 'Saving...', kh: 'កំពុងរក្សាទុក...' },
  dash: { en: '-', kh: '-' },
}

const EMPTY_FORM = {
  fullName: '',
  username: '',
  email: '',
  phoneNumber: '',
  password: '',
  role: 'USER',
  enabled: true,
}

export default function ManageUsers() {
  const { lang } = useLanguage()
  const { addNotification } = useNotifications()
  const [users, setUsers] = useState([])
  const [searchTerm, setSearchTerm] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [refreshKey, setRefreshKey] = useState(0)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [viewing, setViewing] = useState(null)
  const [form, setForm] = useState(EMPTY_FORM)
  const [errors, setErrors] = useState({})
  const [saving, setSaving] = useState(false)
  const [submitError, setSubmitError] = useState('')

  useEffect(() => {
    let cancelled = false
    const load = async () => {
      try {
        const res = await userAPI.getAll()
        if (cancelled) return
        setUsers(Array.isArray(res.data) ? res.data : [])
      } catch (err) {
        if (!cancelled) setError(err.message || TEXTS.error[lang])
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => {
      cancelled = true
    }
  }, [refreshKey, lang])

  const resetForm = () => {
    setForm(EMPTY_FORM)
    setEditingId(null)
    setShowForm(false)
    setErrors({})
    setSubmitError('')
  }

  const startEdit = (user) => {
    setForm({
      fullName: user.fullName || '',
      username: user.username || '',
      email: user.email || '',
      phoneNumber: user.phoneNumber || '',
      password: '',
      role: user.role || 'USER',
      enabled: user.enabled !== false,
    })
    setEditingId(user.id)
    setShowForm(true)
    setErrors({})
    setSubmitError('')
  }

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    setForm((prev) => ({ ...prev, [name]: type === 'checkbox' ? checked : value }))
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: '' }))
  }

  const validate = () => {
    const e = {}
    if (!form.fullName.trim()) e.fullName = TEXTS.errName[lang]
    if (!editingId && !form.username.trim()) e.username = TEXTS.errUsername[lang]
    if (!form.email.trim() || !/\S+@\S+\.\S+/.test(form.email)) e.email = TEXTS.errEmail[lang]
    if (!editingId && (!form.password || form.password.length < 6)) e.password = TEXTS.errPassword[lang]
    return e
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const v = validate()
    setErrors(v)
    if (Object.keys(v).length > 0) return

    setSaving(true)
    setSubmitError('')
    try {
      if (editingId) {
        await userAPI.update(editingId, {
          fullName: form.fullName.trim(),
          email: form.email.trim(),
          phoneNumber: form.phoneNumber.trim(),
          role: form.role,
          enabled: form.enabled,
        })
        addNotification({ type: 'user', action: 'update', title: TEXTS.updated[lang], detail: form.fullName })
      } else {
        await userAPI.create({
          fullName: form.fullName.trim(),
          username: form.username.trim(),
          email: form.email.trim(),
          phoneNumber: form.phoneNumber.trim(),
          password: form.password,
          role: form.role,
          enabled: form.enabled,
        })
        addNotification({ type: 'user', action: 'add', title: TEXTS.added[lang], detail: form.fullName })
      }
      resetForm()
      setRefreshKey((k) => k + 1)
    } catch (err) {
      setSubmitError(err.message || TEXTS.error[lang])
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (user) => {
    if (!window.confirm(TEXTS.confirmDelete[lang])) return
    try {
      await userAPI.delete(user.id)
      addNotification({ type: 'user', action: 'delete', title: TEXTS.deleted[lang], detail: user.fullName })
      setRefreshKey((k) => k + 1)
    } catch (err) {
      setError(err.message || TEXTS.error[lang])
    }
  }

  const adminCount = users.filter((u) => (u.role || 'USER') === 'ADMIN').length

  const filteredUsers = useMemo(() => {
    const term = searchTerm.trim().toLowerCase()
    if (!term) return users
    return users.filter(
      (u) =>
        String(u.fullName || '').toLowerCase().includes(term) ||
        String(u.email || '').toLowerCase().includes(term) ||
        String(u.username || '').toLowerCase().includes(term) ||
        String(u.phoneNumber || '').toLowerCase().includes(term)
    )
  }, [users, searchTerm])

  const inputBase = 'w-full rounded-xl border border-slate-700/70 bg-slate-950/60 px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-purple-400 focus:bg-slate-950 focus:ring-4 focus:ring-purple-500/10'
  const errorInput = 'border-red-500/80 bg-red-500/10 focus:border-red-400 focus:ring-red-500/10'

  return (
    <PageLoader loading={loading} message={lang === 'en' ? 'Loading users…' : 'កំពុងផ្ទុកអ្នកប្រើប្រាស់…'}>
    <div className="space-y-6">
      <section className="relative overflow-hidden rounded-3xl border border-purple-500/20 bg-gradient-to-br from-slate-800 via-slate-900 to-slate-950 p-6 shadow-2xl shadow-purple-500/10">
        <div className="pointer-events-none absolute -right-16 -top-20 h-56 w-56 rounded-full bg-purple-500/20 blur-3xl" />
        <div className="pointer-events-none absolute bottom-0 left-1/3 h-px w-2/3 bg-gradient-to-r from-transparent via-purple-400/50 to-transparent" />
        <div className="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <Link to="/admin" className="mb-5 inline-flex items-center gap-2 rounded-full border border-slate-700/70 bg-slate-950/50 px-3 py-1.5 text-xs font-bold uppercase tracking-[0.18em] text-purple-300 transition hover:border-purple-400 hover:text-purple-200">
              <ChevronLeftIcon /> {TEXTS.back[lang]}
            </Link>
            <div className="flex items-center gap-4">
              <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-purple-500/15 text-3xl ring-1 ring-purple-400/30">👥</span>
              <div>
                <p className="text-xs font-black uppercase tracking-[0.28em] text-purple-300">{TEXTS.heroEy[lang]}</p>
                <h1 className="mt-1 text-3xl font-black tracking-tight text-white md:text-4xl">{TEXTS.title[lang]}</h1>
              </div>
            </div>
            <p className="mt-4 max-w-2xl text-sm leading-6 text-slate-300">{TEXTS.subtitle[lang]}</p>
          </div>

          <div className="flex flex-col items-stretch gap-3 sm:items-end">
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              <Stat value={users.length} label={TEXTS.totalUsers[lang]} />
              <Stat value={adminCount} label={TEXTS.admins[lang]} />
              <Stat value={users.filter((u) => u.enabled !== false).length} label={TEXTS.active[lang]} />
            </div>
            <button onClick={() => { resetForm(); setShowForm(true) }} className="inline-flex items-center justify-center gap-2 rounded-xl bg-purple-500 px-5 py-3 text-sm font-black text-slate-950 shadow-lg shadow-purple-500/20 transition hover:-translate-y-0.5 hover:bg-purple-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-purple-300">
              <PlusIcon /> {TEXTS.addUser[lang]}
            </button>
          </div>
        </div>
      </section>

      {/* Role legend */}
      <section>
        <h2 className="mb-3 text-xs font-black uppercase tracking-[0.2em] text-slate-400">{TEXTS.legendTitle[lang]}</h2>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {Object.entries(ROLES).map(([name, info]) => (
            <div key={name} className="rounded-2xl border border-slate-700/70 bg-slate-900/80 p-4">
              <div className="flex items-center gap-2">
                <span className="h-3 w-3 rounded-full" style={{ background: info.color }} />
                <span className={`rounded-full px-2.5 py-0.5 text-xs font-black ${info.bg} ${info.text}`}>{name}</span>
              </div>
              <p className="mt-3 text-sm leading-6 text-slate-300">{info.desc[lang]}</p>
            </div>
          ))}
        </div>
      </section>

      {/* User table */}
      <section className="overflow-hidden rounded-3xl border border-slate-700/60 bg-slate-900/80 shadow-xl shadow-black/20">
        <div className="flex flex-col gap-4 border-b border-slate-700/60 px-6 py-5 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="text-lg font-black text-white">{TEXTS.tableTitle[lang]}</h2>
            <p className="mt-0.5 text-sm text-slate-400">{filteredUsers.length} {lang === 'en' ? 'users' : 'នាក់'}</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative flex-1 lg:w-72 lg:flex-none">
              <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500">
                <SearchIcon />
              </span>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder={TEXTS.search[lang]}
                className="w-full rounded-xl border border-slate-700/70 bg-slate-950/60 py-2.5 pl-10 pr-4 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-purple-400 focus:bg-slate-950 focus:ring-4 focus:ring-purple-500/10"
              />
            </div>
            <span className="flex h-9 min-w-9 items-center justify-center rounded-full bg-purple-500 px-3 text-sm font-black text-slate-950">{filteredUsers.length}</span>
          </div>
        </div>

        {loading ? (
          <div className="flex flex-col items-center gap-3 p-12 text-center">
            <span className="h-10 w-10 animate-spin rounded-full border-4 border-slate-700 border-t-purple-400" />
            <p className="text-sm text-slate-400">{TEXTS.loading[lang]}</p>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center gap-4 p-12 text-center">
            <span className="text-4xl">⚠️</span>
            <p className="text-sm font-semibold text-red-300">{error}</p>
            <button type="button" onClick={() => { setError(''); setLoading(true); setRefreshKey((k) => k + 1) }} className="rounded-xl border border-slate-700 px-4 py-2 text-sm font-bold text-slate-300 transition hover:border-purple-400 hover:bg-purple-500/10 hover:text-purple-300">
              {TEXTS.retry[lang]}
            </button>
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="p-12 text-center">
            <span className="text-5xl">👥</span>
            <p className="mt-4 text-sm leading-6 text-slate-400">{searchTerm.trim() ? TEXTS.noSearchResults[lang] : TEXTS.empty[lang]}</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-700/60 bg-slate-950/50 text-xs font-black uppercase tracking-wider text-slate-400">
                  <th className="px-6 py-4">{TEXTS.thUser[lang]}</th>
                  <th className="px-6 py-4">{TEXTS.thRole[lang]}</th>
                  <th className="px-6 py-4">{TEXTS.thStatus[lang]}</th>
                  <th className="px-6 py-4">{TEXTS.thProvider[lang]}</th>
                  <th className="px-6 py-4">{TEXTS.thJoined[lang]}</th>
                  <th className="px-6 py-4 text-right">{TEXTS.thActions[lang]}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {filteredUsers.map((user) => {
                  const role = (user.role || 'USER').toUpperCase()
                  const roleInfo = ROLES[role] || ROLES.USER
                  return (
                    <tr key={user.id} className="transition hover:bg-slate-950/40">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <span className="flex h-10 w-10 items-center justify-center rounded-full text-sm font-black text-slate-950" style={{ background: roleInfo.color }}>{(user.fullName || '?').charAt(0).toUpperCase()}</span>
                          <div>
                            <p className="font-bold text-white">{user.fullName || TEXTS.dash[lang]}</p>
                            <p className="text-xs text-slate-400">{user.username}{user.email ? ` · ${user.email}` : ''}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-black ${roleInfo.bg} ${roleInfo.text}`}>
                          <span className="h-2 w-2 rounded-full" style={{ background: roleInfo.color }} />
                          {role}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold ${user.enabled === false ? 'bg-red-500/10 text-red-300' : 'bg-emerald-500/10 text-emerald-300'}`}>
                          <span className={`h-2 w-2 rounded-full ${user.enabled === false ? 'bg-red-400' : 'bg-emerald-400'}`} />
                          {user.enabled === false ? TEXTS.disabled[lang] : TEXTS.active[lang]}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-xs text-slate-400">{user.loginProvider || TEXTS.providerPassword[lang]}</td>
                      <td className="px-6 py-4 font-mono text-xs text-slate-400">{user.createdAt ? user.createdAt.slice(0, 10) : TEXTS.dash[lang]}</td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end gap-2">
                          <button onClick={() => setViewing(user)} className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-700 text-slate-400 transition hover:border-blue-400 hover:bg-blue-500/10 hover:text-blue-300" aria-label={TEXTS.viewUser[lang]}>
                            <EyeIcon />
                          </button>
                          <button onClick={() => startEdit(user)} className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-700 text-slate-400 transition hover:border-purple-400 hover:bg-purple-500/10 hover:text-purple-300" aria-label="Edit">
                            <EditIcon />
                          </button>
                          <button onClick={() => handleDelete(user)} className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-700 text-slate-400 transition hover:border-red-400 hover:bg-red-500/10 hover:text-red-300" aria-label="Delete">
                            <TrashIcon />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Slide-over form panel */}
      {showForm && <div className="fixed inset-0 z-40 bg-slate-950/70 backdrop-blur-sm" onClick={resetForm} />}
      <aside className={`fixed inset-y-0 right-0 z-50 w-full max-w-md transform border-l border-slate-700 bg-slate-900 shadow-2xl shadow-black/50 transition-transform duration-300 ${showForm ? 'translate-x-0' : 'translate-x-full'}`}>
        <div className="flex items-center justify-between border-b border-slate-700/70 bg-slate-950/40 px-6 py-5">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.2em] text-purple-300">{TEXTS.heroEy[lang]}</p>
            <h2 className="mt-1 text-xl font-black text-white">{editingId ? TEXTS.editUser[lang] : TEXTS.newUser[lang]}</h2>
          </div>
          <button onClick={resetForm} className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-700 text-slate-400 transition hover:border-slate-500 hover:bg-slate-800 hover:text-white">
            <XIcon />
          </button>
        </div>

        {submitError && (
          <div className="mx-6 mt-4 rounded-2xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm font-semibold text-red-300">
            {submitError}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5 px-6 py-6" noValidate>
          <label className="block space-y-2">
            <span className="flex items-center justify-between text-sm font-bold text-slate-200">
              <span>{TEXTS.fullName[lang]}</span>
              <span className="rounded-full bg-purple-500/10 px-2 py-0.5 text-[10px] font-black uppercase tracking-wide text-purple-300">{TEXTS.required[lang]}</span>
            </span>
            <input name="fullName" type="text" placeholder={TEXTS.namePlaceholder[lang]} value={form.fullName} onChange={handleChange} className={`${inputBase} ${errors.fullName ? errorInput : ''}`} />
            {errors.fullName && <span className="block text-xs font-semibold text-red-300">{errors.fullName}</span>}
          </label>

          {!editingId && (
            <label className="block space-y-2">
              <span className="flex items-center justify-between text-sm font-bold text-slate-200">
                <span>{TEXTS.username[lang]}</span>
                <span className="rounded-full bg-purple-500/10 px-2 py-0.5 text-[10px] font-black uppercase tracking-wide text-purple-300">{TEXTS.required[lang]}</span>
              </span>
              <input name="username" type="text" placeholder={TEXTS.usernamePlaceholder[lang]} value={form.username} onChange={handleChange} className={`${inputBase} ${errors.username ? errorInput : ''}`} />
              {errors.username && <span className="block text-xs font-semibold text-red-300">{errors.username}</span>}
            </label>
          )}

          <label className="block space-y-2">
            <span className="flex items-center justify-between text-sm font-bold text-slate-200">
              <span>{TEXTS.email[lang]}</span>
              <span className="rounded-full bg-purple-500/10 px-2 py-0.5 text-[10px] font-black uppercase tracking-wide text-purple-300">{TEXTS.required[lang]}</span>
            </span>
            <input name="email" type="email" placeholder={TEXTS.emailPlaceholder[lang]} value={form.email} onChange={handleChange} className={`${inputBase} ${errors.email ? errorInput : ''}`} />
            {errors.email && <span className="block text-xs font-semibold text-red-300">{errors.email}</span>}
          </label>

          <label className="block space-y-2">
            <span className="text-sm font-bold text-slate-200">{TEXTS.phone[lang]}</span>
            <input name="phoneNumber" type="tel" placeholder={TEXTS.phonePlaceholder[lang]} value={form.phoneNumber} onChange={handleChange} className={inputBase} />
          </label>

          {!editingId && (
            <label className="block space-y-2">
              <span className="flex items-center justify-between text-sm font-bold text-slate-200">
                <span>{TEXTS.password[lang]}</span>
                <span className="rounded-full bg-purple-500/10 px-2 py-0.5 text-[10px] font-black uppercase tracking-wide text-purple-300">{TEXTS.required[lang]}</span>
              </span>
              <input name="password" type="password" placeholder={TEXTS.passwordPlaceholder[lang]} value={form.password} onChange={handleChange} className={`${inputBase} ${errors.password ? errorInput : ''}`} />
              {errors.password && <span className="block text-xs font-semibold text-red-300">{errors.password}</span>}
            </label>
          )}

          <div className="space-y-2">
            <span className="flex items-center justify-between text-sm font-bold text-slate-200">
              <span>{TEXTS.role[lang]}</span>
              <span className="rounded-full bg-purple-500/10 px-2 py-0.5 text-[10px] font-black uppercase tracking-wide text-purple-300">{TEXTS.required[lang]}</span>
            </span>
            <div className="space-y-2">
              {Object.entries(ROLES).map(([role, info]) => (
                <label key={role} className={`flex cursor-pointer items-start gap-3 rounded-xl border bg-slate-950/60 p-3 transition ${form.role === role ? 'border-purple-400 bg-purple-500/10 ring-2 ring-purple-500/20' : 'border-slate-700/70 hover:border-slate-600'}`}>
                  <input type="radio" name="role" value={role} checked={form.role === role} onChange={handleChange} className="mt-1 h-4 w-4 cursor-pointer accent-purple-500" />
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="h-2.5 w-2.5 rounded-full" style={{ background: info.color }} />
                      <span className="font-black text-white">{role}</span>
                    </div>
                    <p className="mt-0.5 text-xs text-slate-400">{info.desc[lang]}</p>
                  </div>
                </label>
              ))}
            </div>
          </div>

          <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-slate-700/70 bg-slate-950/60 p-3">
            <input type="checkbox" name="enabled" checked={form.enabled} onChange={handleChange} className="h-4 w-4 cursor-pointer accent-purple-500" />
            <span className="text-sm font-bold text-slate-200">{TEXTS.enabled[lang]}</span>
          </label>

          <div className="flex gap-3 border-t border-slate-700/60 pt-5">
            <button type="submit" disabled={saving} className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-purple-500 px-5 py-3 text-sm font-black text-slate-950 shadow-lg shadow-purple-500/20 transition hover:-translate-y-0.5 hover:bg-purple-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-purple-300 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0">
              {saving ? <SpinnerIcon /> : (editingId ? <CheckIcon /> : <PlusIcon />)} {saving ? TEXTS.saving[lang] : (editingId ? TEXTS.updateUser[lang] : TEXTS.addUser[lang])}
            </button>
            <button type="button" onClick={resetForm} className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-700 px-4 py-3 text-sm font-bold text-slate-300 transition hover:border-slate-500 hover:bg-slate-800 hover:text-white">
              <XIcon />
            </button>
          </div>
        </form>
      </aside>

      {/* View user info (read-only, password hidden) */}
      {viewing && <div className="fixed inset-0 z-40 bg-slate-950/70 backdrop-blur-sm" onClick={() => setViewing(null)} />}
      <aside className={`fixed inset-y-0 right-0 z-50 w-full max-w-md transform border-l border-slate-700 bg-slate-900 shadow-2xl shadow-black/50 transition-transform duration-300 ${viewing ? 'translate-x-0' : 'translate-x-full'}`}>
        <div className="flex items-center justify-between border-b border-slate-700/70 bg-slate-950/40 px-6 py-5">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.2em] text-blue-300">{TEXTS.heroEy[lang]}</p>
            <h2 className="mt-1 text-xl font-black text-white">{TEXTS.viewUser[lang]}</h2>
            <p className="mt-0.5 text-xs text-slate-400">{TEXTS.viewUserSub[lang]}</p>
          </div>
          <button onClick={() => setViewing(null)} className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-700 text-slate-400 transition hover:border-slate-500 hover:bg-slate-800 hover:text-white">
            <XIcon />
          </button>
        </div>

        {viewing && (
          <div className="space-y-6 px-6 py-6">
            {/* Identity */}
            <div className="flex items-center gap-4">
              <span className="flex h-14 w-14 items-center justify-center rounded-2xl text-xl font-black text-slate-950" style={{ background: (ROLES[(viewing.role || 'USER').toUpperCase()] || ROLES.USER).color }}>
                {(viewing.fullName || '?').charAt(0).toUpperCase()}
              </span>
              <div>
                <p className="text-lg font-black text-white">{viewing.fullName}</p>
                <p className="text-sm text-slate-400">{viewing.email || '—'}</p>
              </div>
            </div>

            <dl className="space-y-4">
              <InfoRow label={TEXTS.fieldId[lang]} value={String(viewing.id ?? '—')} mono />
              <InfoRow label={TEXTS.fieldUsername[lang]} value={viewing.username || '—'} mono />
              <InfoRow label={TEXTS.fieldEmail[lang]} value={viewing.email || '—'} />
              <InfoRow label={TEXTS.fieldPhone[lang]} value={viewing.phoneNumber || '—'} mono />
              <InfoRow label={TEXTS.fieldRole[lang]} value={(viewing.role || 'USER').toUpperCase()} />
              <InfoRow label={TEXTS.fieldStatus[lang]} value={viewing.enabled === false ? TEXTS.disabled[lang] : TEXTS.active[lang]} />
              <InfoRow label={TEXTS.fieldProvider[lang]} value={viewing.loginProvider || TEXTS.providerPassword[lang]} />
              <InfoRow label={TEXTS.fieldJoined[lang]} value={viewing.createdAt ? viewing.createdAt.slice(0, 10) : '—'} />
              <InfoRow label={TEXTS.fieldPassword[lang]} value={TEXTS.passwordHidden[lang]} muted />
            </dl>

            <div className="flex gap-3 border-t border-slate-700/60 pt-5">
              <button
                onClick={() => { startEdit(viewing); setViewing(null) }}
                className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-purple-500 px-5 py-3 text-sm font-black text-slate-950 shadow-lg shadow-purple-500/20 transition hover:-translate-y-0.5 hover:bg-purple-400"
              >
                <EditIcon /> {TEXTS.editThis[lang]}
              </button>
              <button onClick={() => setViewing(null)} className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-700 px-4 py-3 text-sm font-bold text-slate-300 transition hover:border-slate-500 hover:bg-slate-800 hover:text-white">
                {TEXTS.close[lang]}
              </button>
            </div>
          </div>
        )}
      </aside>
    </div>
    </PageLoader>
  )
}

const Stat = ({ value, label }) => (
  <div className="min-w-[86px] rounded-xl bg-slate-900/70 px-4 py-3 text-center ring-1 ring-slate-700/60">
    <p className="text-2xl font-black text-white">{value}</p>
    <p className="mt-1 text-[10px] font-bold uppercase tracking-wide text-slate-500">{label}</p>
  </div>
)

const InfoRow = ({ label, value, mono = false, muted = false }) => (
  <div className="flex items-center justify-between gap-4 border-b border-slate-800/70 pb-3">
    <dt className="text-[11px] font-black uppercase tracking-wider text-slate-500">{label}</dt>
    <dd className={`text-sm text-white ${mono ? 'font-mono' : 'font-semibold'} ${muted ? '!text-slate-400' : ''}`}>{value}</dd>
  </div>
)

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

const EditIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
  </svg>
)

const TrashIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <polyline points="3 6 5 6 21 6" />
    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
  </svg>
)

const CheckIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
    <polyline points="20 6 9 17 4 12" />
  </svg>
)

const XIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
)

const SpinnerIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" className="animate-spin">
    <path d="M12 2a10 10 0 0 1 10 10" />
  </svg>
)

const SearchIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <circle cx="11" cy="11" r="8" />
    <line x1="21" y1="21" x2="16.65" y2="16.65" />
  </svg>
)

const EyeIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
)
