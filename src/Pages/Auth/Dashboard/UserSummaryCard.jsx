import { Link } from 'react-router-dom'
import shieldIcon from '../../../assets/icon/3dicons-shield-dynamic-color.png'
import trophyIcon from '../../../assets/icon/3dicons-trophy-dynamic-color.png'
import boyIcon from '../../../assets/icon/3dicons-boy-dynamic-color.png'

export default function UserSummaryCard({ user, dashboardData, lang, isAdmin }) {
  const displayName = user?.fullName || user?.username || (lang === 'en' ? 'Administrator' : 'អ្នកគ្រប់គ្រង')
  const email = user?.email || user?.phoneNumber || 'admin@freshmart.com'
  const role = (user?.role || 'ADMIN').toUpperCase()
  const initial = (displayName.charAt(0) || 'A').toUpperCase()

  const userCount = dashboardData.users?.length || 1
  const memberCount = dashboardData.members?.length || 0

  return (
    <div className="relative flex flex-col justify-between overflow-hidden rounded-3xl border border-slate-700/60 bg-gradient-to-br from-slate-900 via-slate-900/95 to-slate-950 p-6 shadow-xl">
      {/* Background ambient radial glow */}
      <div
        className="pointer-events-none absolute -right-12 -top-12 h-44 w-44 rounded-full blur-3xl opacity-25"
        style={{ background: isAdmin ? '#8b5cf6' : '#10b981' }}
      />

      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-4">
        <div className="flex items-center gap-2">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-purple-500/10 text-purple-400 text-sm border border-purple-500/20">
            👤
          </span>
          <h3 className="text-base font-black text-white">
            {lang === 'en' ? 'User Profile & Access' : 'ព័ត៌មានគណនីនិងសិទ្ធិ'}
          </h3>
        </div>

        <span
          className={`rounded-full px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider border shadow-sm ${
            isAdmin
              ? 'bg-purple-500/20 text-purple-300 border-purple-500/40'
              : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
          }`}
        >
          {isAdmin ? (lang === 'en' ? 'Full System Access' : 'សិទ្ធិពេញលេញ') : (lang === 'en' ? 'Store Operations' : 'គ្រប់គ្រងហាង')}
        </span>
      </div>

      {/* Profile Overview */}
      <div className="my-5 flex flex-col sm:flex-row sm:items-center gap-4">
        {/* Avatar */}
        <div className="relative flex-shrink-0">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-purple-600 via-indigo-600 to-slate-800 text-2xl font-black text-white shadow-xl ring-2 ring-purple-400/40">
            {initial}
          </div>
          <span
            className="absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-slate-900 ring-2 ring-slate-900"
            title={lang === 'en' ? 'Active Session' : 'គណនីកំពុងដំណើរការ'}
          >
            <span className="h-3 w-3 rounded-full bg-emerald-400 animate-pulse" />
          </span>
        </div>

        {/* User Info */}
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h4 className="truncate text-lg font-black text-white">{displayName}</h4>
            <span className="rounded-md bg-slate-800 px-2 py-0.5 font-mono text-[10px] font-bold text-slate-300 border border-slate-700">
              {role}
            </span>
          </div>

          <p className="truncate text-xs text-slate-400 mt-0.5">{email}</p>

          <div className="mt-2 flex flex-wrap items-center gap-3 text-[11px] text-slate-400">
            <span className="flex items-center gap-1">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
              <span>{lang === 'en' ? 'Auth: Active (JWT)' : 'ចូលប្រើ: សកម្ម'}</span>
            </span>
            <span>·</span>
            <span className="flex items-center gap-1">
              <span className="h-1.5 w-1.5 rounded-full bg-sky-400" />
              <span>{lang === 'en' ? 'Inactivity guard on' : 'សុវត្ថិភាពសកម្ម'}</span>
            </span>
          </div>
        </div>
      </div>

      {/* Quick stats row */}
      <div className="grid grid-cols-2 gap-3 my-2">
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-3">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400">
              {lang === 'en' ? 'Registered Users' : 'អ្នកប្រើប្រាស់'}
            </span>
            <img src={shieldIcon} alt="" className="h-4 w-4 object-contain" />
          </div>
          <p className="mt-1 text-xl font-black text-white">{userCount}</p>
          <p className="text-[10px] text-slate-500">
            {lang === 'en' ? 'Active system accounts' : 'គណនីក្នុងប្រព័ន្ធ'}
          </p>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-3">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400">
              {lang === 'en' ? 'Staff Directory' : 'បុគ្គលិកក្រុម'}
            </span>
            <img src={trophyIcon} alt="" className="h-4 w-4 object-contain" />
          </div>
          <p className="mt-1 text-xl font-black text-white">{memberCount}</p>
          <p className="text-[10px] text-slate-500">
            {lang === 'en' ? 'Company team roster' : 'សមាជិកក្នុងបញ្ជី'}
          </p>
        </div>
      </div>

      {/* Quick Shortcuts */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-800 pt-3">
        {isAdmin && (
          <Link
            to="/admin/users"
            className="flex items-center gap-1.5 rounded-xl border border-slate-700/60 bg-slate-800/80 px-3 py-1.5 text-xs font-bold text-slate-300 transition hover:border-purple-400 hover:text-white"
          >
            <span>🛡️</span>
            <span>{lang === 'en' ? 'Manage Users' : 'គ្រប់គ្រងអ្នកប្រើ'}</span>
          </Link>
        )}

        <Link
          to="/admin/members/add"
          className="flex items-center gap-1.5 rounded-xl border border-slate-700/60 bg-slate-800/80 px-3 py-1.5 text-xs font-bold text-slate-300 transition hover:border-blue-400 hover:text-white"
        >
          <span>➕</span>
          <span>{lang === 'en' ? 'Add Member' : 'បន្ថែមសមាជិក'}</span>
        </Link>

        <Link
          to="/profile"
          className="ml-auto text-xs font-bold text-purple-400 hover:text-purple-300 hover:underline flex items-center gap-1"
        >
          <span>{lang === 'en' ? 'My Profile' : 'គណនីខ្ញុំ'}</span>
          <span>→</span>
        </Link>
      </div>
    </div>
  )
}
