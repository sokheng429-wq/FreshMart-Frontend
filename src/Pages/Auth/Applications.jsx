import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useLanguage } from '../../context/LanguageContext'
import { useNotifications } from '../../context/NotificationContext'
import { applicationAPI } from '../../api/api'
import { PageLoader } from '../../components/PageLoader'
import './Applications.css'

const STATUS_ORDER = ['NEW', 'REVIEWED', 'ACCEPTED', 'REJECTED']

const STATUS_META = {
  NEW: { en: 'New', kh: 'ថ្មី', badge: 'bg-cyan-500/10 text-cyan-300 ring-cyan-400/30' },
  REVIEWED: { en: 'Reviewed', kh: 'បានពិនិត្យ', badge: 'bg-amber-500/10 text-amber-300 ring-amber-400/30' },
  ACCEPTED: { en: 'Accepted', kh: 'បានទទួលយក', badge: 'bg-green-500/10 text-green-300 ring-green-400/30' },
  REJECTED: { en: 'Rejected', kh: 'បានបដិសេធ', badge: 'bg-red-500/10 text-red-300 ring-red-400/30' },
}

const TEXTS = {
  back: { en: 'Dashboard', kh: 'ផ្ទាំងគ្រប់គ្រង' },
  eyebrow: { en: "FreshMart hiring", kh: "ការជ្រើសរើសបុគ្គលិក FreshMart" },
  title: { en: 'Applications', kh: 'ពាក្យសុំការងារ' },
  subtitle: {
    en: 'Review every application, update the status workflow, and download resumes.',
    kh: 'ពិនិត្យពាក្យសុំទាំងអស់ ធ្វើបច្ចុប្បន្នភាពស្ថានភាព និងទាញយក Resume ។',
  },
  total: { en: 'Total', kh: 'សរុប' },
  search: { en: 'Search by position, email, or phone...', kh: 'ស្វែងរកតាមមុខតំណែង អ៊ីមែល ឬទូរស័ព្ទ...' },
  searchLabel: { en: 'Search applications', kh: 'ស្វែងរកពាក្យសុំការងារ' },
  noSearchResults: { en: 'No applications match your search.', kh: 'មិនមានពាក្យសុំដែលត្រូវនឹងការស្វែងរកទេ។' },
  thJob: { en: 'Position', kh: 'មុខតំណែង' },
  thApplicant: { en: 'Applicant', kh: 'អ្នកដាក់ពាក្យ' },
  thEmail: { en: 'Email', kh: 'អ៊ីមែល' },
  thPhone: { en: 'Phone', kh: 'ទូរស័ព្ទ' },
  thStatus: { en: 'Status', kh: 'ស្ថានភាព' },
  thDate: { en: 'Received', kh: 'បានទទួល' },
  thActions: { en: 'Actions', kh: 'សកម្មភាព' },
  view: { en: 'View', kh: 'មើល' },
  delete: { en: 'Delete', kh: 'លុប' },
  loading: { en: 'Loading applications...', kh: 'កំពុងផ្ទុកពាក្យសុំ...' },
  empty: {
    en: 'No applications yet. When candidates apply through the career page they will appear here.',
    kh: 'មិនទាន់មានពាក្យសុំនៅឡើយទេ។ ពេលបេក្ខជនដាក់ពាក្យតាមទំព័រការងារ ពួកគេនឹងបង្ហាញនៅទីនេះ។',
  },
  loadError: { en: 'Could not load applications.', kh: 'មិនអាចផ្ទុកពាក្យសុំបានទេ។' },
  retry: { en: 'Try again', kh: 'ព្យាយាមម្តងទៀត' },
  dash: { en: '-', kh: '-' },
  // Detail panel
  detailTitle: { en: 'Application details', kh: 'ព័ត៌មានលម្អិតនៃពាក្យសុំ' },
  close: { en: 'Close', kh: 'បិទ' },
  statusLabel: { en: 'Status', kh: 'ស្ថានភាព' },
  statusSaving: { en: 'Updating...', kh: 'កំពុងធ្វើបច្ចុប្បន្នភាព...' },
  applicant: { en: 'Applicant', kh: 'អ្នកដាក់ពាក្យ' },
  email: { en: 'Email', kh: 'អ៊ីមែល' },
  phone: { en: 'Phone', kh: 'ទូរស័ព្ទ' },
  linkedin: { en: 'LinkedIn / Portfolio', kh: 'LinkedIn / Portfolio' },
  position: { en: 'Position', kh: 'មុខតំណែង' },
  coverLetter: { en: 'Cover letter', kh: 'សំបុត្រណែនាំខ្លួន' },
  noCover: { en: 'No cover letter provided.', kh: 'មិនមានសំបុត្រណែនាំខ្លួនទេ។' },
  resume: { en: 'Resume / CV', kh: 'Resume / CV' },
  openResume: { en: 'Open resume', kh: 'បើក Resume' },
  noResume: { en: 'No resume attached.', kh: 'មិនមាន Resume ភ្ជាប់ទេ។' },
  received: { en: 'Received', kh: 'បានទទួល' },
  deleteConfirm: {
    en: 'Delete this application? This cannot be undone.',
    kh: 'លុបពាក្យសុំនេះ? សកម្មភាពនេះមិនអាចត្រឡប់វិញបានទេ។',
  },
  deleting: { en: 'Deleting...', kh: 'កំពុងលុប...' },
  statusUpdated: { en: 'Status updated', kh: 'បានធ្វើបច្ចុប្បន្នភាពស្ថានភាព' },
  deleted: { en: 'Application deleted', kh: 'បានលុបពាក្យសុំ' },
}

const formatDate = (iso, lang) => {
  if (!iso) return ''
  try {
    return new Date(iso).toLocaleDateString(lang === 'kh' ? 'km-KH' : 'en-US', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    })
  } catch {
    return ''
  }
}

export default function Applications() {
  const { lang } = useLanguage()
  const { addNotification } = useNotifications()
  const [applications, setApplications] = useState([])
  const [searchTerm, setSearchTerm] = useState('')
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [refreshKey, setRefreshKey] = useState(0)
  const [selectedId, setSelectedId] = useState(null)
  const [savingStatus, setSavingStatus] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [panelError, setPanelError] = useState('')

  useEffect(() => {
    let cancelled = false
    const load = async () => {
      try {
        const res = await applicationAPI.getAll()
        const data = Array.isArray(res.data) ? res.data : []
        if (!cancelled) setApplications(data)
      } catch (err) {
        if (!cancelled) setError(err.message || TEXTS.loadError[lang])
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => {
      cancelled = true
    }
  }, [refreshKey, lang])

  useEffect(() => {
    const timeout = setTimeout(() => setDebouncedSearchTerm(searchTerm), 250)
    return () => clearTimeout(timeout)
  }, [searchTerm])

  const filteredApplications = useMemo(() => {
    const term = debouncedSearchTerm.trim().toLowerCase()
    if (!term) return applications

    const phoneTerm = term.replace(/\D/g, '')
    return applications.filter((application) => {
      const positionMatches = String(application.jobTitle || '').toLowerCase().includes(term)
      const emailMatches = String(application.email || '').toLowerCase().includes(term)
      const phoneMatches = phoneTerm && String(application.phone || '').replace(/\D/g, '').includes(phoneTerm)
      return positionMatches || emailMatches || phoneMatches
    })
  }, [applications, debouncedSearchTerm])

  const selected = applications.find((a) => a.id === selectedId) || null

  const counts = STATUS_ORDER.reduce(
    (acc, s) => ({ ...acc, [s]: applications.filter((a) => a.status === s).length }),
    {}
  )

  const closePanel = () => {
    setSelectedId(null)
    setPanelError('')
  }

  const handleStatusChange = async (e) => {
    const status = e.target.value
    if (!selected || status === selected.status) return
    setSavingStatus(true)
    try {
      await applicationAPI.updateStatus(selected.id, status)
      addNotification({
        type: 'job',
        action: 'update',
        title: lang === 'en' ? TEXTS.statusUpdated.en : TEXTS.statusUpdated.kh,
        detail: `${selected.fullName} — ${selected.jobTitle}`,
      })
      setRefreshKey((k) => k + 1)
    } catch (err) {
      setPanelError(err.message || (lang === 'en' ? 'Could not update status.' : 'មិនអាចធ្វើបច្ចុប្បន្នភាពស្ថានភាពបានទេ។'))
    } finally {
      setSavingStatus(false)
    }
  }

  const handleDelete = async (app) => {
    if (!window.confirm(TEXTS.deleteConfirm[lang])) return
    setDeleting(true)
    try {
      await applicationAPI.delete(app.id)
      addNotification({
        type: 'job',
        action: 'delete',
        title: lang === 'en' ? TEXTS.deleted.en : TEXTS.deleted.kh,
        detail: app.fullName,
      })
      setSelectedId(null)
      setPanelError('')
      setRefreshKey((k) => k + 1)
    } catch (err) {
      setPanelError(err.message || (lang === 'en' ? 'Could not delete application.' : 'មិនអាចលុបពាក្យសុំបានទេ។'))
    } finally {
      setDeleting(false)
    }
  }

  const resumeHref = selected?.resumeData
    ? `data:${selected.resumeContentType || 'application/octet-stream'};base64,${selected.resumeData}`
    : null

  const inputBase = 'w-full rounded-xl border border-slate-700/70 bg-slate-950/60 px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-indigo-400 focus:bg-slate-950 focus:ring-4 focus:ring-indigo-500/10'

  return (
    <PageLoader loading={loading} message={lang === 'en' ? 'Loading applications…' : 'កំពុងផ្ទុកពាក្យសុំ…'}>
    <div className="space-y-6">
      {/* Hero */}
      <section className="relative overflow-hidden rounded-3xl border border-indigo-500/20 bg-gradient-to-br from-slate-800 via-slate-900 to-slate-950 p-6 shadow-2xl shadow-indigo-500/10">
        <div className="pointer-events-none absolute -right-16 -top-20 h-56 w-56 rounded-full bg-indigo-500/20 blur-3xl" />
        <div className="pointer-events-none absolute bottom-0 left-1/3 h-px w-2/3 bg-gradient-to-r from-transparent via-indigo-400/50 to-transparent" />
        <div className="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <Link to="/admin" className="mb-5 inline-flex items-center gap-2 rounded-full border border-slate-700/70 bg-slate-950/50 px-3 py-1.5 text-xs font-bold uppercase tracking-[0.18em] text-indigo-300 transition hover:border-indigo-400 hover:text-indigo-200">
              <ChevronLeftIcon /> {TEXTS.back[lang]}
            </Link>
            <div className="flex items-center gap-4">
              <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-500/15 text-3xl ring-1 ring-indigo-400/30">🗂️</span>
              <div>
                <p className="text-xs font-black uppercase tracking-[0.28em] text-indigo-300">{TEXTS.eyebrow[lang]}</p>
                <h1 className="mt-1 text-3xl font-black tracking-tight text-white md:text-4xl">{TEXTS.title[lang]}</h1>
              </div>
            </div>
            <p className="mt-4 max-w-2xl text-sm leading-6 text-slate-300">{TEXTS.subtitle[lang]}</p>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
            <Stat value={applications.length} label={TEXTS.total[lang]} />
            {STATUS_ORDER.map((s) => (
              <Stat key={s} value={counts[s]} label={STATUS_META[s][lang]} />
            ))}
          </div>
        </div>
      </section>

      {/* Table */}
      <section className="overflow-hidden rounded-3xl border border-slate-700/60 bg-slate-900/80 shadow-xl shadow-black/20">
        <div className="flex flex-col gap-4 border-b border-slate-700/60 px-6 py-5 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="text-lg font-black text-white">{TEXTS.title[lang]}</h2>
            <p className="mt-0.5 text-sm text-slate-400">{filteredApplications.length}</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative flex-1 lg:w-80 lg:flex-none">
              <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500">
                <SearchIcon />
              </span>
              <input
                type="search"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder={TEXTS.search[lang]}
                aria-label={TEXTS.searchLabel[lang]}
                className="w-full rounded-xl border border-slate-700/70 bg-slate-950/60 py-2.5 pl-10 pr-4 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-indigo-400 focus:bg-slate-950 focus:ring-4 focus:ring-indigo-500/10"
              />
            </div>
            <span className="flex h-9 min-w-9 items-center justify-center rounded-full bg-indigo-500 px-3 text-sm font-black text-slate-950">{filteredApplications.length}</span>
          </div>
        </div>

        {loading ? (
          <div className="flex flex-col items-center gap-3 p-12 text-center">
            <span className="h-10 w-10 animate-spin rounded-full border-4 border-slate-700 border-t-indigo-400" />
            <p className="text-sm text-slate-400">{TEXTS.loading[lang]}</p>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center gap-4 p-12 text-center">
            <span className="text-4xl">⚠️</span>
            <p className="text-sm font-semibold text-red-300">{error}</p>
            <button type="button" onClick={() => { setError(''); setLoading(true); setRefreshKey((k) => k + 1) }} className="rounded-xl border border-slate-700 px-4 py-2 text-sm font-bold text-slate-300 transition hover:border-indigo-400 hover:bg-indigo-500/10 hover:text-indigo-300">
              {TEXTS.retry[lang]}
            </button>
          </div>
        ) : applications.length === 0 ? (
          <div className="p-12 text-center">
            <span className="text-5xl">🗂️</span>
            <p className="mt-4 text-sm leading-6 text-slate-400">{TEXTS.empty[lang]}</p>
          </div>
        ) : filteredApplications.length === 0 ? (
          <div className="p-12 text-center">
            <span className="text-5xl">🔎</span>
            <p className="mt-4 text-sm leading-6 text-slate-400">{TEXTS.noSearchResults[lang]}</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-700/60 bg-slate-950/50 text-xs font-black uppercase tracking-wider text-slate-400">
                  <th className="px-6 py-4">{TEXTS.thJob[lang]}</th>
                  <th className="px-6 py-4">{TEXTS.thApplicant[lang]}</th>
                  <th className="px-6 py-4">{TEXTS.thEmail[lang]}</th>
                  <th className="px-6 py-4">{TEXTS.thPhone[lang]}</th>
                  <th className="px-6 py-4">{TEXTS.thStatus[lang]}</th>
                  <th className="px-6 py-4">{TEXTS.thDate[lang]}</th>
                  <th className="px-6 py-4 text-right">{TEXTS.thActions[lang]}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {filteredApplications.map((app) => (
                  <tr
                    key={app.id}
                    onClick={() => { setSelectedId(app.id); setPanelError('') }}
                    className={`cursor-pointer transition hover:bg-slate-950/40 ${selectedId === app.id ? 'bg-indigo-500/5' : ''}`}
                  >
                    <td className="px-6 py-4">
                      <p className="font-bold text-white">{app.jobTitle || TEXTS.dash[lang]}</p>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <span className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-500/15 text-sm font-black text-indigo-300 ring-1 ring-indigo-400/30">
                          {(app.fullName || '?').charAt(0).toUpperCase()}
                        </span>
                        <p className="font-bold text-white">{app.fullName || TEXTS.dash[lang]}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-slate-300">{app.email || TEXTS.dash[lang]}</td>
                    <td className="px-6 py-4 text-slate-300">{app.phone || TEXTS.dash[lang]}</td>
                    <td className="px-6 py-4">
                      <StatusBadge status={app.status} lang={lang} />
                    </td>
                    <td className="px-6 py-4 text-slate-300">{formatDate(app.createdAt, lang) || TEXTS.dash[lang]}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2" onClick={(e) => e.stopPropagation()}>
                        <button
                          type="button"
                          onClick={() => { setSelectedId(app.id); setPanelError('') }}
                          className="inline-flex items-center gap-1.5 rounded-xl border border-indigo-500/40 bg-indigo-500/10 px-3 py-2 text-xs font-bold text-indigo-300 transition hover:bg-indigo-500/20 hover:text-indigo-200"
                        >
                          <EyeIcon /> {TEXTS.view[lang]}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(app)}
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

      {/* Detail slide-over */}
      {selected && (
        <div className="fixed inset-0 z-[60]">
          <div className="absolute inset-0 bg-slate-950/70 backdrop-blur-sm" onClick={closePanel} />
          <aside
            role="dialog"
            aria-modal="true"
            aria-label={TEXTS.detailTitle[lang]}
            className="absolute right-0 top-0 flex h-full w-full max-w-lg flex-col border-l border-indigo-500/30 bg-slate-900 shadow-2xl shadow-black/50"
          >
            {/* Panel header */}
            <div className="flex items-start justify-between gap-4 border-b border-slate-700/60 bg-slate-950/50 px-6 py-5">
              <div className="min-w-0">
                <p className="text-xs font-black uppercase tracking-[0.22em] text-indigo-300">{TEXTS.detailTitle[lang]}</p>
                <h3 className="mt-1 truncate text-xl font-black text-white">{selected.jobTitle || TEXTS.dash[lang]}</h3>
                <p className="mt-0.5 text-sm text-slate-400">{selected.fullName}</p>
              </div>
              <button type="button" onClick={closePanel} aria-label={TEXTS.close[lang]} className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-700 text-slate-400 transition hover:border-indigo-400 hover:bg-indigo-500/10 hover:text-indigo-300">
                <XIcon />
              </button>
            </div>

            <div className="flex-1 space-y-5 overflow-y-auto px-6 py-5">
              {panelError && (
                <div className="rounded-2xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm font-semibold text-red-300" role="alert">
                  {panelError}
                </div>
              )}

              {/* Status workflow */}
              <div className="rounded-2xl border border-slate-700/60 bg-slate-950/50 p-4">
                <label className="block space-y-2">
                  <span className="text-xs font-black uppercase tracking-wider text-slate-400">{TEXTS.statusLabel[lang]}</span>
                  <select value={selected.status} onChange={handleStatusChange} disabled={savingStatus} className={inputBase}>
                    {STATUS_ORDER.map((s) => (
                      <option key={s} value={s}>{STATUS_META[s][lang]}</option>
                    ))}
                  </select>
                </label>
                {savingStatus && (
                  <p className="mt-2 flex items-center gap-2 text-xs font-semibold text-indigo-300">
                    <SpinnerIcon /> {TEXTS.statusSaving[lang]}
                  </p>
                )}
              </div>

              {/* Applicant */}
              <div className="rounded-2xl border border-slate-700/60 bg-slate-950/50 p-4">
                <p className="text-xs font-black uppercase tracking-wider text-slate-400">{TEXTS.applicant[lang]}</p>
                <dl className="mt-3 space-y-3 text-sm">
                  <div>
                    <dt className="text-xs font-bold text-slate-500">{TEXTS.email[lang]}</dt>
                    <dd>
                      <a href={`mailto:${selected.email}`} className="text-indigo-300 hover:text-indigo-200">{selected.email || TEXTS.dash[lang]}</a>
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs font-bold text-slate-500">{TEXTS.phone[lang]}</dt>
                    <dd>
                      <a href={`tel:${selected.phone}`} className="text-indigo-300 hover:text-indigo-200">{selected.phone || TEXTS.dash[lang]}</a>
                    </dd>
                  </div>
                  {selected.linkedinUrl && (
                    <div>
                      <dt className="text-xs font-bold text-slate-500">{TEXTS.linkedin[lang]}</dt>
                      <dd>
                        <a href={selected.linkedinUrl} target="_blank" rel="noopener noreferrer" className="break-all text-indigo-300 hover:text-indigo-200">{selected.linkedinUrl}</a>
                      </dd>
                    </div>
                  )}
                  <div>
                    <dt className="text-xs font-bold text-slate-500">{TEXTS.received[lang]}</dt>
                    <dd className="text-slate-300">{formatDate(selected.createdAt, lang) || TEXTS.dash[lang]}</dd>
                  </div>
                </dl>
              </div>

              {/* Resume */}
              <div className="rounded-2xl border border-slate-700/60 bg-slate-950/50 p-4">
                <p className="text-xs font-black uppercase tracking-wider text-slate-400">{TEXTS.resume[lang]}</p>
                {resumeHref ? (
                  <a
                    href={resumeHref}
                    download={selected.resumeName || 'resume'}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-xl border border-indigo-400/40 bg-indigo-500/10 px-4 py-3 text-sm font-bold text-indigo-300 transition hover:bg-indigo-500/20 hover:text-indigo-200"
                  >
                    <FileIcon /> {selected.resumeName || TEXTS.openResume[lang]}
                  </a>
                ) : (
                  <p className="mt-3 text-sm text-slate-400">{TEXTS.noResume[lang]}</p>
                )}
              </div>

              {/* Cover letter */}
              <div className="rounded-2xl border border-slate-700/60 bg-slate-950/50 p-4">
                <p className="text-xs font-black uppercase tracking-wider text-slate-400">{TEXTS.coverLetter[lang]}</p>
                {selected.coverLetter ? (
                  <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-slate-300">{selected.coverLetter}</p>
                ) : (
                  <p className="mt-3 text-sm text-slate-500">{TEXTS.noCover[lang]}</p>
                )}
              </div>
            </div>

            {/* Panel footer */}
            <div className="border-t border-slate-700/60 bg-slate-950/50 px-6 py-4">
              <button
                type="button"
                onClick={() => handleDelete(selected)}
                disabled={deleting}
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-red-500/40 bg-red-500/10 px-5 py-3 text-sm font-black text-red-300 transition hover:bg-red-500/20 hover:text-red-200 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {deleting ? <SpinnerIcon /> : <TrashIcon />} {deleting ? TEXTS.deleting[lang] : TEXTS.delete[lang]}
              </button>
            </div>
          </aside>
        </div>
      )}
    </div>
    </PageLoader>
  )
}

const Stat = ({ value, label }) => (
  <div className="min-w-[76px] rounded-xl bg-slate-900/70 px-4 py-3 text-center ring-1 ring-slate-700/60">
    <p className="text-2xl font-black text-white">{value}</p>
    <p className="mt-1 text-[10px] font-bold uppercase tracking-wide text-slate-500">{label}</p>
  </div>
)

const StatusBadge = ({ status, lang }) => {
  const meta = STATUS_META[status] || STATUS_META.NEW
  return (
    <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-black ring-1 ${meta.badge}`}>
      {meta[lang]}
    </span>
  )
}

const ChevronLeftIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
    <polyline points="15 18 9 12 15 6" />
  </svg>
)

const SearchIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <circle cx="11" cy="11" r="8" />
    <line x1="21" y1="21" x2="16.65" y2="16.65" />
  </svg>
)

const EyeIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
)

const TrashIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <polyline points="3 6 5 6 21 6" />
    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
  </svg>
)

const FileIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
    <polyline points="14 2 14 8 20 8" />
  </svg>
)

const SpinnerIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" className="animate-spin">
    <path d="M21 12a9 9 0 1 1-6.219-8.56" />
  </svg>
)

const XIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
)
