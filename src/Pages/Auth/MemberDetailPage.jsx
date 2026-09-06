import { useEffect, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useLanguage } from '../../context/LanguageContext'
import { memberAPI } from '../../api/api'
import './MemberDetailPage.css'

const TEXTS = {
  back: { en: 'Members', kh: 'សមាជិក' },
  eyebrow: { en: "FreshMart team", kh: "ក្រុម FreshMart" },
  title: { en: 'Member profile', kh: 'ទម្រង់សមាជិក' },
  edit: { en: 'Edit member', kh: 'កែប្រែសមាជិក' },
  basicTitle: { en: 'Basic information', kh: 'ព័ត៌មានមូលដ្ឋាន' },
  detailTitle: { en: 'Contact & details', kh: 'ទំនាក់ទំនង និងព័ត៌មានលម្អិត' },
  memberCode: { en: 'Member code', kh: 'លេខកូដសមាជិក' },
  fullName: { en: 'Full name', kh: 'ឈ្មោះពេញ' },
  position: { en: 'Position', kh: 'មុខតំណែង' },
  rank: { en: 'Rank', kh: 'ឋានៈ' },
  department: { en: 'Department', kh: 'ផ្នែក' },
  category: { en: 'Category', kh: 'ប្រភេទ' },
  phoneNumber: { en: 'Phone number', kh: 'លេខទូរស័ព្ទ' },
  email: { en: 'Email', kh: 'អ៊ីមែល' },
  address: { en: 'Address', kh: 'អាសយដ្ឋាន' },
  dateOfBirth: { en: 'Date of birth', kh: 'ថ្ងៃខែឆ្នាំកំណើត' },
  gender: { en: 'Gender', kh: 'ភេទ' },
  emergencyContact: { en: 'Emergency contact', kh: 'ទំនាក់ទំនងបន្ទាន់' },
  startDate: { en: 'Start date', kh: 'ថ្ងៃចាប់ផ្តើមការងារ' },
  note: { en: 'Note', kh: 'កំណត់ចំណាំ' },
  loading: { en: 'Loading member...', kh: 'កំពុងផ្ទុកសមាជិក...' },
  error: { en: 'Could not load this member. It may have been removed.', kh: 'មិនអាចផ្ទុកសមាជិកនេះបានទេ។ វាអាចត្រូវបានលុប។' },
  backToList: { en: 'Back to members', kh: 'ត្រឡប់ទៅបញ្ជីសមាជិក' },
  dash: { en: '-', kh: '-' },
}

export default function MemberDetailPage() {
  const { lang } = useLanguage()
  const navigate = useNavigate()
  const { pathname } = useLocation()
  // AdminD renders this page for /admin/members/:id — take the last segment.
  const memberId = pathname.split('/').filter(Boolean).pop()

  const [member, setMember] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false
    const load = async () => {
      try {
        const res = await memberAPI.getById(memberId)
        if (!cancelled) setMember(res.data)
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
  }, [memberId, lang])

  const formatDate = (value) => {
    if (!value) return TEXTS.dash[lang]
    const d = new Date(value)
    if (Number.isNaN(d.getTime())) return value
    return d.toLocaleDateString(lang === 'kh' ? 'km-KH' : 'en-US', { year: 'numeric', month: 'short', day: 'numeric' })
  }

  if (loading) {
    return (
      <div className="flex min-h-64 flex-col items-center justify-center gap-3 rounded-3xl border border-slate-700/60 bg-slate-900/80 p-12 text-center">
        <span className="h-10 w-10 animate-spin rounded-full border-4 border-slate-700 border-t-blue-400" />
        <p className="text-sm text-slate-400">{TEXTS.loading[lang]}</p>
      </div>
    )
  }

  if (error || !member) {
    return (
      <div className="flex min-h-64 flex-col items-center justify-center gap-4 rounded-3xl border border-slate-700/60 bg-slate-900/80 p-12 text-center">
        <span className="text-4xl">⚠️</span>
        <p className="text-sm font-semibold text-red-300">{error || TEXTS.error[lang]}</p>
        <Link to="/admin/members" className="rounded-xl border border-slate-700 px-4 py-2 text-sm font-bold text-slate-300 transition hover:border-blue-400 hover:bg-blue-500/10 hover:text-blue-300">
          {TEXTS.backToList[lang]}
        </Link>
      </div>
    )
  }

  const detail = member.detail || {}
  const initials = (member.fullName || '?').split(' ').filter(Boolean).slice(0, 2).map((w) => w.charAt(0).toUpperCase()).join('')

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
            <div className="flex flex-wrap items-center gap-4">
              {member.photoUrl ? (
                <img src={member.photoUrl} alt={member.fullName || 'member'} className="h-20 w-20 rounded-2xl object-cover ring-2 ring-blue-400/30" />
              ) : (
                <span className="flex h-20 w-20 items-center justify-center rounded-2xl bg-blue-500/15 text-xl font-black text-blue-300 ring-1 ring-blue-400/30">{initials}</span>
              )}
              <div>
                <p className="text-xs font-black uppercase tracking-[0.28em] text-blue-300">{TEXTS.eyebrow[lang]}</p>
                <h1 className="mt-1 text-3xl font-black tracking-tight text-white md:text-4xl">{member.fullName || TEXTS.dash[lang]}</h1>
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  {member.memberCode && (
                    <span className="rounded-full bg-blue-500/10 px-2.5 py-0.5 font-mono text-xs font-bold text-blue-300 ring-1 ring-blue-400/20">{member.memberCode}</span>
                  )}
                  {member.position && (
                    <span className="rounded-full bg-slate-800 px-2.5 py-0.5 text-xs font-bold text-slate-300">{member.position}</span>
                  )}
                  {member.department && (
                    <span className="rounded-full bg-slate-800 px-2.5 py-0.5 text-xs font-bold text-slate-300">{member.department}</span>
                  )}
                </div>
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={() => navigate(`/admin/members/edit/${member.id}`)}
            className="inline-flex w-fit items-center justify-center gap-2 rounded-xl bg-blue-500 px-5 py-3 text-sm font-black text-slate-950 shadow-lg shadow-blue-500/20 transition hover:-translate-y-0.5 hover:bg-blue-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-300"
          >
            <EditIcon /> {TEXTS.edit[lang]}
          </button>
        </div>
      </section>

      <div className="grid grid-cols-1 gap-6 2xl:grid-cols-2">
        {/* Basic information */}
        <section className="rounded-3xl border border-slate-700/60 bg-slate-900/80 p-6 shadow-xl shadow-black/20">
          <div className="mb-5 border-b border-slate-700/60 pb-4">
            <h2 className="text-xl font-black text-white">{TEXTS.basicTitle[lang]}</h2>
          </div>
          <dl className="grid grid-cols-1 gap-x-6 gap-y-5 sm:grid-cols-2">
            <InfoRow label={TEXTS.memberCode[lang]} value={member.memberCode || TEXTS.dash[lang]} mono />
            <InfoRow label={TEXTS.fullName[lang]} value={member.fullName || TEXTS.dash[lang]} />
            <InfoRow label={TEXTS.position[lang]} value={member.position || TEXTS.dash[lang]} />
            <InfoRow label={TEXTS.rank[lang]} value={member.rank != null ? String(member.rank) : TEXTS.dash[lang]} />
            <InfoRow label={TEXTS.department[lang]} value={member.department || TEXTS.dash[lang]} />
            <InfoRow label={TEXTS.category[lang]} value={member.category || TEXTS.dash[lang]} />
          </dl>
        </section>

        {/* Contact & details */}
        <section className="rounded-3xl border border-slate-700/60 bg-slate-900/80 p-6 shadow-xl shadow-black/20">
          <div className="mb-5 border-b border-slate-700/60 pb-4">
            <h2 className="text-xl font-black text-white">{TEXTS.detailTitle[lang]}</h2>
          </div>
          <dl className="grid grid-cols-1 gap-x-6 gap-y-5 sm:grid-cols-2">
            <InfoRow label={TEXTS.phoneNumber[lang]} value={detail.phoneNumber || TEXTS.dash[lang]} />
            <InfoRow label={TEXTS.email[lang]} value={detail.email || TEXTS.dash[lang]} />
            <InfoRow label={TEXTS.dateOfBirth[lang]} value={formatDate(detail.dateOfBirth)} />
            <InfoRow label={TEXTS.gender[lang]} value={detail.gender || TEXTS.dash[lang]} />
            <InfoRow label={TEXTS.emergencyContact[lang]} value={detail.emergencyContact || TEXTS.dash[lang]} />
            <InfoRow label={TEXTS.startDate[lang]} value={formatDate(detail.startDate)} />
          </dl>
          <div className="mt-5 border-t border-slate-700/60 pt-5">
            <p className="mb-2 text-sm font-bold text-slate-200">{TEXTS.address[lang]}</p>
            <p className="text-sm leading-6 text-slate-300">{detail.address || TEXTS.dash[lang]}</p>
          </div>
          {detail.note && (
            <div className="mt-5 border-t border-slate-700/60 pt-5">
              <p className="mb-2 text-sm font-bold text-slate-200">{TEXTS.note[lang]}</p>
              <p className="text-sm leading-6 text-slate-300">{detail.note}</p>
            </div>
          )}
        </section>
      </div>
    </div>
  )
}

const InfoRow = ({ label, value, mono = false }) => (
  <div>
    <dt className="text-[11px] font-black uppercase tracking-wider text-slate-500">{label}</dt>
    <dd className={`mt-1 text-sm text-white ${mono ? 'font-mono text-blue-300' : 'font-semibold'}`}>{value}</dd>
  </div>
)

const ChevronLeftIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
    <polyline points="15 18 9 12 15 6" />
  </svg>
)

const EditIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
  </svg>
)
