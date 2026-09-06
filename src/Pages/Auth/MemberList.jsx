import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useLanguage } from '../../context/LanguageContext'
import { useNotifications } from '../../context/NotificationContext'
import { memberAPI } from '../../api/api'
import { ConfirmModal } from './stockUI'
import { PageLoader } from '../../components/PageLoader'
import './MemberList.css'

const TEXTS = {
  back: { en: 'Dashboard', kh: 'ផ្ទាំងគ្រប់គ្រង' },
  eyebrow: { en: "FreshMart team", kh: "ក្រុម FreshMart" },
  title: { en: 'Members', kh: 'សមាជិក' },
  subtitle: {
    en: 'Manage the team directory - filter by department or category, view details, edit and remove members.',
    kh: 'គ្រប់គ្រងបញ្ជីសមាជិកក្រុម - ត្រងតាមផ្នែក ឬប្រភេទ មើលព័ត៌មានលម្អិត កែប្រែ និងលុបសមាជិក។',
  },
  addMember: { en: 'Add Member', kh: 'បន្ថែមសមាជិក' },
  totalMembers: { en: 'Total members', kh: 'សមាជិកសរុប' },
  departments: { en: 'Departments', kh: 'ផ្នែក' },
  department: { en: 'Department', kh: 'ផ្នែក' },
  allDepartments: { en: 'All departments', kh: 'គ្រប់ផ្នែក' },
  search: { en: 'Search by code or name...', kh: 'ស្វែងរកតាមលេខកូដ ឬឈ្មោះ...' },
  searchLabel: { en: 'Search', kh: 'ស្វែងរក' },
  noSearchResults: { en: 'No members match your search.', kh: 'មិនមានសមាជិកដែលត្រូវនឹងការស្វែងរកទេ។' },
  clear: { en: 'Clear filters', kh: 'សម្អាតតម្រង' },
  tableTitle: { en: 'Team directory', kh: 'បញ្ជីសមាជិកក្រុម' },
  membersCount: { en: 'members', kh: 'នាក់' },
  thCode: { en: 'Code', kh: 'លេខកូដ' },
  thName: { en: 'Full name', kh: 'ឈ្មោះពេញ' },
  thPosition: { en: 'Position', kh: 'មុខតំណែង' },
  thRank: { en: 'Rank', kh: 'ឋានៈ' },
  thDepartment: { en: 'Department', kh: 'ផ្នែក' },
  thCategory: { en: 'Category', kh: 'ប្រភេទ' },
  thActions: { en: 'Actions', kh: 'សកម្មភាព' },
  edit: { en: 'Edit', kh: 'កែប្រែ' },
  delete: { en: 'Delete', kh: 'លុប' },
  loading: { en: 'Loading members...', kh: 'កំពុងផ្ទុកសមាជិក...' },
  empty: {
    en: 'No members found. Add your first team member to get started.',
    kh: 'មិនមានសមាជិកទេ។ បន្ថែមសមាជិកដំបូងដើម្បីចាប់ផ្តើម។',
  },
  emptyFiltered: {
    en: 'No members match the current filters.',
    kh: 'មិនមានសមាជិកដែលត្រូវនឹងតម្រងបច្ចុប្បន្នទេ។',
  },
  error: { en: 'Could not load members.', kh: 'មិនអាចផ្ទុកសមាជិកបានទេ។' },
  retry: { en: 'Try again', kh: 'ព្យាយាមម្តងទៀត' },
  confirmDelete: {
    en: 'Delete this member? This action cannot be undone.',
    kh: 'លុបសមាជិកនេះ? សកម្មភាពនេះមិនអាចត្រឡប់វិញបានទេ។',
  },
  deleted: { en: 'Member deleted', kh: 'បានលុបសមាជិក' },
  dash: { en: '-', kh: '-' },
}

export default function MemberList() {
  const { lang } = useLanguage()
  const { addNotification } = useNotifications()
  const navigate = useNavigate()

  const [members, setMembers] = useState([])
  const [optionSource, setOptionSource] = useState([])
  const [department, setDepartment] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [refreshKey, setRefreshKey] = useState(0)
  const [confirmAction, setConfirmAction] = useState(null)

  useEffect(() => {
    let cancelled = false
    const load = async () => {
      try {
        const res = await memberAPI.getAll(department ? { department } : {})
        const data = Array.isArray(res.data) ? res.data : []
        if (cancelled) return
        setMembers(data)
        // Keep filter options derived from the full, unfiltered dataset.
        if (!department) setOptionSource(data)
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
  }, [department, refreshKey, lang])

  const clearFilters = () => setDepartment('')

  const departments = useMemo(
    () => [...new Set(optionSource.map((m) => m.department).filter(Boolean))].sort(),
    [optionSource]
  )

  const sortedMembers = useMemo(() => {
    const term = searchTerm.trim().toLowerCase()
    const filtered = term
      ? members.filter(
          (m) =>
            String(m.memberCode || '').toLowerCase().includes(term) ||
            String(m.fullName || '').toLowerCase().includes(term)
        )
      : [...members]
    const str = (m, key) => (m[key] == null ? '' : String(m[key]).toLowerCase())
    // Highest rank first, then by code.
    return filtered.sort((a, b) => {
      const ar = a.rank ?? Number.MAX_SAFE_INTEGER
      const br = b.rank ?? Number.MAX_SAFE_INTEGER
      return ar - br || str(a, 'memberCode').localeCompare(str(b, 'memberCode'))
    })
  }, [members, searchTerm])

  const handleDelete = (member) => {
    setConfirmAction({
      title: { en: 'Delete Team Member', kh: 'លុបសមាជិកក្រុម' },
      message: {
        en: `Are you sure you want to delete "${member.fullName || member.memberCode}"? This action cannot be undone.`,
        kh: `តើអ្នកពិតជាចង់លុប "${member.fullName || member.memberCode}" មែនទេ? សកម្មភាពនេះមិនអាចត្រឡប់វិញបានទេ។`,
      },
      confirmText: { en: 'Confirm Delete', kh: 'យល់ព្រមលុប' },
      cancelText: { en: 'Cancel', kh: 'បោះបង់' },
      type: 'danger',
      onConfirm: async () => {
        try {
          await memberAPI.delete(member.id)
          addNotification({
            type: 'member',
            action: 'delete',
            title: TEXTS.deleted[lang],
            detail: member.fullName,
          })
          setRefreshKey((k) => k + 1)
        } catch (err) {
          setError(err.message || TEXTS.error[lang])
        }
      },
    })
  }

  const inputBase = 'w-full rounded-xl border border-slate-700/70 bg-slate-950/60 px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-blue-400 focus:bg-slate-950 focus:ring-4 focus:ring-blue-500/10'

  return (
    <PageLoader loading={loading} message={lang === 'en' ? 'Loading members…' : 'កំពុងផ្ទុកសមាជិក…'}>
    <div className="space-y-6">
      {/* Hero */}
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
                <p className="text-xs font-black uppercase tracking-[0.28em] text-blue-300">{TEXTS.eyebrow[lang]}</p>
                <h1 className="mt-1 text-3xl font-black tracking-tight text-white md:text-4xl">{TEXTS.title[lang]}</h1>
              </div>
            </div>
            <p className="mt-4 max-w-2xl text-sm leading-6 text-slate-300">{TEXTS.subtitle[lang]}</p>
          </div>

          <div className="flex flex-col items-stretch gap-3 sm:items-end">
            <div className="grid grid-cols-3 gap-3">
              <Stat value={optionSource.length} label={TEXTS.totalMembers[lang]} />
              <Stat value={departments.length} label={TEXTS.departments[lang]} />
            </div>
            <Link to="/admin/members/add" className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-500 px-5 py-3 text-sm font-black text-slate-950 shadow-lg shadow-blue-500/20 transition hover:-translate-y-0.5 hover:bg-blue-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-300">
              <PlusIcon /> {TEXTS.addMember[lang]}
            </Link>
          </div>
        </div>
      </section>

      {/* Filters */}
      <section className="rounded-3xl border border-slate-700/60 bg-slate-900/80 p-5 shadow-xl shadow-black/20">
        <div className="mb-4">
          <label className="block space-y-2">
            <span className="text-xs font-black uppercase tracking-wider text-slate-400">{TEXTS.searchLabel[lang]}</span>
            <div className="relative">
              <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-500">
                <SearchIcon />
              </span>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder={TEXTS.search[lang]}
                className="w-full rounded-xl border border-slate-700/70 bg-slate-950/60 py-3 pl-11 pr-4 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-blue-400 focus:bg-slate-950 focus:ring-4 focus:ring-blue-500/10"
              />
            </div>
          </label>
        </div>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-[1fr_auto]">
          <label className="block space-y-2">
            <span className="text-xs font-black uppercase tracking-wider text-slate-400">{TEXTS.department[lang]}</span>
            <select value={department} onChange={(e) => setDepartment(e.target.value)} className={inputBase}>
              <option value="">{TEXTS.allDepartments[lang]}</option>
              {departments.map((d) => <option key={d} value={d}>{d}</option>)}
            </select>
          </label>
          <div className="flex items-end">
            <button
              type="button"
              onClick={clearFilters}
              disabled={!department}
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-slate-700 px-4 py-3 text-sm font-bold text-slate-300 transition hover:border-blue-400 hover:bg-blue-500/10 hover:text-blue-300 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:border-slate-700 disabled:hover:bg-transparent disabled:hover:text-slate-300"
            >
              <XIcon /> {TEXTS.clear[lang]}
            </button>
          </div>
        </div>
      </section>

      {/* Table */}
      <section className="overflow-hidden rounded-3xl border border-slate-700/60 bg-slate-900/80 shadow-xl shadow-black/20">
        <div className="flex items-center justify-between border-b border-slate-700/60 px-6 py-5">
          <div>
            <h2 className="text-lg font-black text-white">{TEXTS.tableTitle[lang]}</h2>
            <p className="mt-0.5 text-sm text-slate-400">{members.length} {TEXTS.membersCount[lang]}</p>
          </div>
          <span className="flex h-9 min-w-9 items-center justify-center rounded-full bg-blue-500 px-3 text-sm font-black text-slate-950">{members.length}</span>
        </div>

        {loading ? (
          <div className="flex flex-col items-center gap-3 p-12 text-center">
            <span className="h-10 w-10 animate-spin rounded-full border-4 border-slate-700 border-t-blue-400" />
            <p className="text-sm text-slate-400">{TEXTS.loading[lang]}</p>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center gap-4 p-12 text-center">
            <span className="text-4xl">⚠️</span>
            <p className="text-sm font-semibold text-red-300">{error}</p>
            <button type="button" onClick={() => { setError(''); setLoading(true); setRefreshKey((k) => k + 1) }} className="rounded-xl border border-slate-700 px-4 py-2 text-sm font-bold text-slate-300 transition hover:border-blue-400 hover:bg-blue-500/10 hover:text-blue-300">
              {TEXTS.retry[lang]}
            </button>
          </div>
        ) : sortedMembers.length === 0 ? (
          <div className="p-12 text-center">
            <span className="text-5xl">👥</span>
            <p className="mt-4 text-sm leading-6 text-slate-400">
              {searchTerm.trim() ? TEXTS.noSearchResults[lang] : department ? TEXTS.emptyFiltered[lang] : TEXTS.empty[lang]}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-700/60 bg-slate-950/50 text-xs font-black uppercase tracking-wider text-slate-400">
                  <th className="px-6 py-4">{TEXTS.thCode[lang]}</th>
                  <th className="px-6 py-4">{TEXTS.thName[lang]}</th>
                  <th className="px-6 py-4">{TEXTS.thPosition[lang]}</th>
                  <th className="px-6 py-4">{TEXTS.thRank[lang]}</th>
                  <th className="px-6 py-4">{TEXTS.thDepartment[lang]}</th>
                  <th className="px-6 py-4">{TEXTS.thCategory[lang]}</th>
                  <th className="px-6 py-4 text-right">{TEXTS.thActions[lang]}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {sortedMembers.map((member) => (
                  <tr
                    key={member.id}
                    onClick={() => navigate(`/admin/members/${member.id}`)}
                    className="cursor-pointer transition hover:bg-slate-950/40"
                  >
                    <td className="px-6 py-4 font-mono text-xs font-bold text-blue-300">{member.memberCode || TEXTS.dash[lang]}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        {member.photoUrl ? (
                          <img src={member.photoUrl} alt={member.fullName || 'member'} className="h-10 w-10 rounded-full object-cover ring-1 ring-blue-400/30" />
                        ) : (
                          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-500/15 text-sm font-black text-blue-300 ring-1 ring-blue-400/30">
                            {(member.fullName || '?').charAt(0).toUpperCase()}
                          </span>
                        )}
                        <p className="font-bold text-white">{member.fullName || TEXTS.dash[lang]}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-slate-300">{member.position || TEXTS.dash[lang]}</td>
                    <td className="px-6 py-4">
                      {member.rank != null ? (
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-500/10 px-2.5 py-1 text-xs font-black text-blue-300 ring-1 ring-blue-400/20">
                          {member.rank}
                        </span>
                      ) : TEXTS.dash[lang]}
                    </td>
                    <td className="px-6 py-4">
                      {member.department ? (
                        <span className="inline-flex rounded-full bg-slate-800 px-2.5 py-1 text-xs font-bold text-slate-300">{member.department}</span>
                      ) : TEXTS.dash[lang]}
                    </td>
                    <td className="px-6 py-4 text-slate-300">{member.category || TEXTS.dash[lang]}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2" onClick={(e) => e.stopPropagation()}>
                        <button
                          type="button"
                          onClick={() => navigate(`/admin/members/edit/${member.id}`)}
                          className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-700 text-slate-400 transition hover:border-blue-400 hover:bg-blue-500/10 hover:text-blue-300"
                          aria-label={TEXTS.edit[lang]}
                        >
                          <EditIcon />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(member)}
                          className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-700 text-slate-400 transition hover:border-red-400 hover:bg-red-500/10 hover:text-red-300"
                          aria-label={TEXTS.delete[lang]}
                        >
                          <TrashIcon />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {confirmAction && (
        <ConfirmModal
          open={!!confirmAction}
          onClose={() => setConfirmAction(null)}
          onConfirm={() => {
            const fn = confirmAction.onConfirm
            setConfirmAction(null)
            fn?.()
          }}
          {...confirmAction}
        />
      )}
    </div>
    </PageLoader>
  )
}

const Stat = ({ value, label }) => (
  <div className="min-w-[80px] rounded-xl bg-slate-900/70 px-4 py-3 text-center ring-1 ring-slate-700/60">
    <p className="text-2xl font-black text-white">{value}</p>
    <p className="mt-1 text-[10px] font-bold uppercase tracking-wide text-slate-500">{label}</p>
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

const XIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
)

const SearchIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <circle cx="11" cy="11" r="8" />
    <line x1="21" y1="21" x2="16.65" y2="16.65" />
  </svg>
)
