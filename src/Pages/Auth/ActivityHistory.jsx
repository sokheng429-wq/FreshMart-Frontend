import { useState, useEffect, useMemo } from 'react'
import { Link } from 'react-router-dom'
import * as XLSX from 'xlsx'
import { activityLogAPI } from '../../api/api'
import { useLanguage } from '../../context/LanguageContext'
import { useAuth } from '../../context/AuthContext'
import './ActivityHistory.css'

const ACTION_COLORS = {
  CREATE: { bg: 'bg-emerald-500/15', text: 'text-emerald-300', border: 'border-emerald-500/30', label: { en: 'Created', kh: 'បានបង្កើត' } },
  UPDATE: { bg: 'bg-sky-500/15', text: 'text-sky-300', border: 'border-sky-500/30', label: { en: 'Updated', kh: 'បានកែប្រែ' } },
  DELETE: { bg: 'bg-rose-500/15', text: 'text-rose-300', border: 'border-rose-500/30', label: { en: 'Deleted', kh: 'បានលុប' } },
  TRANSFER: { bg: 'bg-amber-500/15', text: 'text-amber-300', border: 'border-amber-500/30', label: { en: 'Transferred', kh: 'បានផ្ទេរ' } },
  AUTH: { bg: 'bg-purple-500/15', text: 'text-purple-300', border: 'border-purple-500/30', label: { en: 'Security', kh: 'សុវត្ថិភាព' } },
  STATUS_CHANGE: { bg: 'bg-indigo-500/15', text: 'text-indigo-300', border: 'border-indigo-500/30', label: { en: 'Status Change', kh: 'ប្តូរស្ថានភាព' } },
}

const ENTITY_ICONS = {
  PRODUCT: '📦',
  JOB: '💼',
  MEMBER: '👤',
  APPLICATION: '📋',
  PROMOTION: '🏷️',
  PARTNER: '🤝',
  DRIVER: '🚚',
  TRANSFER: '🔄',
  USER: '🛡️',
  SYSTEM: '⚙️',
}

const formatTimestamp = (ts, lang) => {
  if (!ts) return '—'
  const date = new Date(ts)
  if (isNaN(date.getTime())) return '—'

  return date.toLocaleString(lang === 'kh' ? 'km-KH' : 'en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: lang === 'en',
  })
}

const formatRelativeTime = (ts, lang) => {
  if (!ts) return '—'
  const date = new Date(ts)
  if (isNaN(date.getTime())) return '—'

  const diffMs = Math.max(0, Date.now() - date.getTime())
  const mins = Math.floor(diffMs / 60000)
  const hours = Math.floor(diffMs / 3600000)
  const days = Math.floor(diffMs / 86400000)

  if (mins < 1) return lang === 'en' ? 'Just now' : 'មុននេះ'
  if (mins < 60) return lang === 'en' ? `${mins}m ago` : `${mins}នាទីមុន`
  if (hours < 24) return lang === 'en' ? `${hours}h ago` : `${hours}ម៉ោងមុន`
  return lang === 'en' ? `${days}d ago` : `${days}ថ្ងៃមុន`
}

export default function ActivityHistory() {
  const { lang } = useLanguage()
  const { user } = useAuth()
  const role = (user?.role || 'USER').toUpperCase()
  const isAdmin = role === 'ADMIN'

  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [viewMode, setViewMode] = useState('timeline') // 'timeline' | 'table'

  // Filters
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedEntity, setSelectedEntity] = useState('ALL')
  const [selectedAction, setSelectedAction] = useState('ALL')
  const [selectedRole, setSelectedRole] = useState('ALL')

  // Selected Log for detail modal
  const [activeLogModal, setActiveLogModal] = useState(null)

  // Fetch logs
  const fetchLogs = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await activityLogAPI.getAll({
        keyword: searchQuery || undefined,
        entityType: selectedEntity !== 'ALL' ? selectedEntity : undefined,
        actionType: selectedAction !== 'ALL' ? selectedAction : undefined,
        userRole: selectedRole !== 'ALL' ? selectedRole : undefined,
      })
      const items = Array.isArray(res?.data) ? res.data : []
      setLogs(items)
    } catch (err) {
      console.error('Failed to load activity logs:', err)
      setError(lang === 'en' ? 'Could not load activity history.' : 'មិនអាចទាញយកប្រវត្តិសកម្មភាពបានទេ។')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchLogs()
  }, [selectedEntity, selectedAction, selectedRole])

  const handleSearchSubmit = (e) => {
    e.preventDefault()
    fetchLogs()
  }

  // Delete single log
  const handleDeleteLog = async (id, e) => {
    e?.stopPropagation()
    if (!window.confirm(lang === 'en' ? 'Are you sure you want to delete this log entry?' : 'តើអ្នកប្រាកដជាចង់លុបកំណត់ត្រានេះ?')) {
      return
    }
    try {
      await activityLogAPI.delete(id)
      setLogs((prev) => prev.filter((item) => item.id !== id))
      if (activeLogModal?.id === id) setActiveLogModal(null)
    } catch (err) {
      alert(lang === 'en' ? 'Failed to delete log entry' : 'បរាជ័យក្នុងការលុប')
    }
  }

  // Clear all logs
  const handleClearAll = async () => {
    if (!window.confirm(lang === 'en' ? 'Are you sure you want to clear ALL activity history?' : 'តើអ្នកប្រាកដជាចង់លុបប្រវត្តិសកម្មភាពទាំងអស់?')) {
      return
    }
    try {
      await activityLogAPI.clearAll()
      setLogs([])
      setActiveLogModal(null)
    } catch (err) {
      alert(lang === 'en' ? 'Failed to clear activity logs' : 'បរាជ័យក្នុងការលុបទាំងអស់')
    }
  }

  // Export to Excel
  const handleExportExcel = () => {
    if (logs.length === 0) return
    const exportData = logs.map((l) => ({
      ID: l.id,
      Date: formatTimestamp(l.createdAt, 'en'),
      Username: l.username,
      Role: l.userRole,
      'Full Name': l.userFullName || '—',
      Action: l.actionType,
      Entity: l.entityType,
      'Entity Name': l.entityName || '—',
      Description: l.description,
      Status: l.status,
      'IP Address': l.ipAddress || '—',
    }))

    const ws = XLSX.utils.json_to_sheet(exportData)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Activity_History')
    XLSX.writeFile(wb, `FreshMart_Activity_Logs_${new Date().toISOString().slice(0, 10)}.xlsx`)
  }

  // Stats calculation
  const stats = useMemo(() => {
    const total = logs.length
    const adminCount = logs.filter((l) => (l.userRole || '').toUpperCase() === 'ADMIN').length
    const storeCount = logs.filter((l) => (l.userRole || '').toUpperCase() === 'STORE').length
    const today = new Date().toDateString()
    const todayCount = logs.filter((l) => {
      if (!l.createdAt) return false
      return new Date(l.createdAt).toDateString() === today
    }).length

    return { total, adminCount, storeCount, todayCount }
  }, [logs])

  return (
    <div className="space-y-6 pb-12">
      {/* ── HEADER BANNER ── */}
      <div className="relative overflow-hidden rounded-3xl border border-slate-700/60 bg-gradient-to-br from-slate-900 via-slate-900/90 to-slate-950 p-6 shadow-2xl shadow-black/40">
        <div
          className="pointer-events-none absolute -right-16 -top-16 h-72 w-72 rounded-full blur-3xl opacity-20"
          style={{ background: '#8b5cf6' }}
        />

        <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-3">
              <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-purple-500/20 text-2xl shadow-lg ring-1 ring-purple-400/40">
                🔔
              </span>
              <div>
                <h1 className="text-2xl font-black tracking-tight text-white sm:text-3xl">
                  {lang === 'en' ? 'Stored Notification & Activity History' : 'ប្រវត្តិការជូនដំណឹង & សកម្មភាព'}
                </h1>
                <p className="mt-0.5 text-xs sm:text-sm text-slate-400">
                  {lang === 'en'
                    ? 'Audit log tracking who performed actions (Admin/Store) with time, date, and changes'
                    : 'កំណត់ត្រាសវនកម្មតាមដានអ្នកអនុវត្តសកម្មភាព (Admin/Store) ជាមួយកាលបរិច្ឆេទ និងព័ត៌មានលម្អិត'}
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              onClick={fetchLogs}
              disabled={loading}
              className="flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-800/80 px-3.5 py-2 text-xs font-bold text-slate-200 transition hover:border-slate-500 hover:bg-slate-700 active:scale-95"
            >
              <span className={loading ? 'animate-spin' : ''}>🔄</span>
              <span>{lang === 'en' ? 'Refresh' : 'ផ្ទុកឡើងវិញ'}</span>
            </button>

            <button
              type="button"
              onClick={handleExportExcel}
              disabled={logs.length === 0}
              className="flex items-center gap-2 rounded-xl border border-emerald-500/40 bg-emerald-950/40 px-3.5 py-2 text-xs font-bold text-emerald-300 transition hover:bg-emerald-900/40 hover:border-emerald-400 active:scale-95 disabled:opacity-50"
            >
              <span>📊</span>
              <span>{lang === 'en' ? 'Export Excel' : 'ទាញយក Excel'}</span>
            </button>

            {isAdmin && (
              <button
                type="button"
                onClick={handleClearAll}
                disabled={logs.length === 0}
                className="flex items-center gap-2 rounded-xl border border-rose-500/40 bg-rose-950/30 px-3.5 py-2 text-xs font-bold text-rose-300 transition hover:bg-rose-900/40 hover:border-rose-400 active:scale-95 disabled:opacity-50"
              >
                <span>🗑️</span>
                <span>{lang === 'en' ? 'Clear History' : 'លុបទាំងអស់'}</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ── METRIC STATS ── */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {[
          { label: { en: 'Total Actions', kh: 'សកម្មភាពសរុប' }, val: stats.total, icon: '📋', color: '#8b5cf6', sub: { en: 'Stored in Database', kh: 'រក្សាទុកក្នុងទិន្នន័យ' } },
          { label: { en: 'Today’s Activities', kh: 'សកម្មភាពថ្ងៃនេះ' }, val: stats.todayCount, icon: '⚡', color: '#10b981', sub: { en: 'Logged today', kh: 'ថ្ងៃនេះ' } },
          { label: { en: 'Admin Role Actions', kh: 'សកម្មភាព Admin' }, val: stats.adminCount, icon: '👑', color: '#f59e0b', sub: { en: 'Executive Operations', kh: 'ប្រតិបត្តិការ Admin' } },
          { label: { en: 'Store Role Actions', kh: 'សកម្មភាព Store' }, val: stats.storeCount, icon: '🏬', color: '#38bdf8', sub: { en: 'Inventory & Transfers', kh: 'ស្តុក & ផ្ទេរទំនិញ' } },
        ].map((item, i) => (
          <div
            key={i}
            className="flex items-center gap-3.5 rounded-2xl border border-slate-700/60 bg-slate-900/80 p-4 shadow-md backdrop-blur-md"
          >
            <div
              className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl text-xl shadow-inner border border-white/10"
              style={{ backgroundColor: `${item.color}20`, color: item.color }}
            >
              {item.icon}
            </div>
            <div>
              <p className="text-2xl font-black text-white">{item.val}</p>
              <h4 className="text-xs font-bold text-slate-300">{item.label[lang]}</h4>
              <p className="text-[10px] text-slate-500">{item.sub[lang]}</p>
            </div>
          </div>
        ))}
      </div>

      {/* ── FILTER & SEARCH TOOLBAR ── */}
      <div className="flex flex-col gap-4 rounded-3xl border border-slate-700/60 bg-slate-900/80 p-5 shadow-xl backdrop-blur-md">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          {/* Search Form */}
          <form onSubmit={handleSearchSubmit} className="relative flex-1 max-w-md">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={lang === 'en' ? 'Search by username, item name, keyword…' : 'ស្វែងរកតាមឈ្មោះអ្នកប្រើ, ឈ្មោះទំនិញ, ពាក្យគន្លឹះ…'}
              className="w-full rounded-2xl border border-slate-700 bg-slate-950/80 px-4 py-2.5 pl-10 text-xs font-medium text-white placeholder-slate-500 transition focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500/20"
            />
            <span className="pointer-events-none absolute left-3.5 top-2.5 text-sm text-slate-400">
              🔍
            </span>
          </form>

          {/* View Mode Toggle (Timeline vs Table) */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-400">
              {lang === 'en' ? 'View:' : 'ទម្រង់បង្ហាញ:'}
            </span>
            <div className="flex items-center gap-1 rounded-xl bg-slate-950 p-1 border border-slate-800">
              <button
                type="button"
                onClick={() => setViewMode('timeline')}
                className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition-all ${
                  viewMode === 'timeline'
                    ? 'bg-purple-600 text-white shadow-md shadow-purple-600/30'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <span>⏳</span>
                <span>{lang === 'en' ? 'Timeline' : 'បន្ទាត់ពេលវេលា'}</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode('table')}
                className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition-all ${
                  viewMode === 'table'
                    ? 'bg-purple-600 text-white shadow-md shadow-purple-600/30'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <span>📑</span>
                <span>{lang === 'en' ? 'Table' : 'តារាង'}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Filter Pills */}
        <div className="flex flex-wrap items-center gap-3 border-t border-slate-800/80 pt-4">
          {/* Entity Category Filter */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-400">{lang === 'en' ? 'Category:' : 'ប្រភេទ:'}</span>
            <select
              value={selectedEntity}
              onChange={(e) => setSelectedEntity(e.target.value)}
              className="rounded-xl border border-slate-700 bg-slate-950 px-3 py-1.5 text-xs font-bold text-slate-200 focus:border-purple-500 focus:outline-none"
            >
              <option value="ALL">{lang === 'en' ? 'All Entities' : 'គ្រប់ផ្នែកទាំងអស់'}</option>
              <option value="PRODUCT">📦 {lang === 'en' ? 'Products & Stock' : 'ផលិតផល & ស្តុក'}</option>
              <option value="JOB">💼 {lang === 'en' ? 'Jobs & Careers' : 'ការងារ'}</option>
              <option value="MEMBER">👤 {lang === 'en' ? 'Team Members' : 'សមាជិក'}</option>
              <option value="APPLICATION">📋 {lang === 'en' ? 'Applications' : 'ពាក្យសុំការងារ'}</option>
              <option value="PROMOTION">🏷️ {lang === 'en' ? 'Promotions' : 'ការផ្សព្វផ្សាយ'}</option>
              <option value="TRANSFER">🔄 {lang === 'en' ? 'Stock Transfers' : 'ការផ្ទេរស្តុក'}</option>
              <option value="PARTNER">🤝 {lang === 'en' ? 'Partners' : 'ដៃគូ'}</option>
              <option value="DRIVER">🚚 {lang === 'en' ? 'Drivers' : 'អ្នកដឹកជញ្ជូន'}</option>
              <option value="USER">🛡️ {lang === 'en' ? 'Users & Access' : 'អ្នកប្រើប្រាស់'}</option>
            </select>
          </div>

          {/* Action Filter */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-400">{lang === 'en' ? 'Action:' : 'សកម្មភាព:'}</span>
            <select
              value={selectedAction}
              onChange={(e) => setSelectedAction(e.target.value)}
              className="rounded-xl border border-slate-700 bg-slate-950 px-3 py-1.5 text-xs font-bold text-slate-200 focus:border-purple-500 focus:outline-none"
            >
              <option value="ALL">{lang === 'en' ? 'All Actions' : 'គ្រប់សកម្មភាព'}</option>
              <option value="CREATE">➕ {lang === 'en' ? 'Create / Add' : 'បង្កើត / បន្ថែម'}</option>
              <option value="UPDATE">✏️ {lang === 'en' ? 'Update / Edit' : 'កែប្រែ'}</option>
              <option value="DELETE">🗑️ {lang === 'en' ? 'Delete' : 'លុប'}</option>
              <option value="TRANSFER">🔄 {lang === 'en' ? 'Transfer' : 'ផ្ទេរ'}</option>
              <option value="AUTH">🛡️ {lang === 'en' ? 'Authentication' : 'សុវត្ថិភាព'}</option>
            </select>
          </div>

          {/* Role Filter */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-400">{lang === 'en' ? 'Role:' : 'តួនាទី:'}</span>
            <select
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value)}
              className="rounded-xl border border-slate-700 bg-slate-950 px-3 py-1.5 text-xs font-bold text-slate-200 focus:border-purple-500 focus:outline-none"
            >
              <option value="ALL">{lang === 'en' ? 'All Roles' : 'គ្រប់តួនាទី'}</option>
              <option value="ADMIN">👑 {lang === 'en' ? 'Admin' : 'អ្នកគ្រប់គ្រង'}</option>
              <option value="STORE">🏬 {lang === 'en' ? 'Store Manager' : 'អ្នកគ្រប់គ្រងហាង'}</option>
            </select>
          </div>

          <span className="ml-auto text-xs font-mono text-slate-400">
            {lang === 'en' ? `Showing ${logs.length} entries` : `បង្ហាញ ${logs.length} កំណត់ត្រា`}
          </span>
        </div>
      </div>

      {/* ── MAIN CONTENT (TIMELINE OR TABLE) ── */}
      {loading ? (
        <div className="flex flex-col items-center justify-center rounded-3xl border border-slate-700/60 bg-slate-900/80 p-16 text-center">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-purple-500 border-t-transparent mb-4" />
          <p className="text-sm font-bold text-slate-300">
            {lang === 'en' ? 'Loading activity history from database…' : 'កំពុងទាញយកប្រវត្តិសកម្មភាព…'}
          </p>
        </div>
      ) : error ? (
        <div className="flex flex-col items-center justify-center rounded-3xl border border-amber-500/40 bg-amber-500/10 p-12 text-center text-amber-200">
          <span className="text-3xl mb-2">⚠️</span>
          <p className="text-sm font-bold">{error}</p>
          <button
            type="button"
            onClick={fetchLogs}
            className="mt-4 rounded-xl border border-amber-400 bg-amber-500/20 px-4 py-2 text-xs font-bold text-amber-100 hover:bg-amber-500/30"
          >
            {lang === 'en' ? 'Retry' : 'ព្យាយាមម្ដងទៀត'}
          </button>
        </div>
      ) : logs.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-3xl border border-slate-700/60 bg-slate-900/80 p-16 text-center">
          <span className="text-4xl mb-3">🔔</span>
          <h3 className="text-base font-bold text-white">
            {lang === 'en' ? 'No activity history found' : 'មិនមានប្រវត្តិសកម្មភាពត្រូវបានរកឃើញទេ'}
          </h3>
          <p className="mt-1 text-xs text-slate-400 max-w-sm">
            {lang === 'en'
              ? 'Activity will automatically be logged when you or store managers create, edit, or delete items.'
              : 'សកម្មភាពនឹងត្រូវបានកត់ត្រាដោយស្វ័យប្រវត្តិនៅពេលអ្នក ឬអ្នកគ្រប់គ្រងហាងបង្កើត កែប្រែ ឬលុបទិន្នន័យ។'}
          </p>
        </div>
      ) : viewMode === 'timeline' ? (
        /* ── TIMELINE VIEW ── */
        <div className="relative rounded-3xl border border-slate-700/60 bg-slate-900/80 p-6 shadow-xl backdrop-blur-md">
          {/* Vertical continuous line */}
          <div className="absolute left-10 top-10 bottom-10 w-0.5 bg-gradient-to-b from-purple-500 via-indigo-500/40 to-slate-800 hidden sm:block" />

          <div className="space-y-6">
            {logs.map((logItem, idx) => {
              const actionMeta = ACTION_COLORS[logItem.actionType] || ACTION_COLORS.CREATE
              const icon = logItem.icon || ENTITY_ICONS[logItem.entityType] || '📦'
              const userInitial = (logItem.username || 'A').charAt(0).toUpperCase()
              const isStoreRole = (logItem.userRole || '').toUpperCase() === 'STORE'

              return (
                <div
                  key={logItem.id || idx}
                  onClick={() => setActiveLogModal(logItem)}
                  className="group relative flex flex-col sm:flex-row sm:items-start gap-4 rounded-2xl border border-slate-800/80 bg-slate-950/60 p-4 transition-all duration-300 hover:border-purple-500/50 hover:bg-slate-900 hover:shadow-xl hover:shadow-purple-500/10 cursor-pointer sm:pl-16"
                >
                  {/* Timeline node icon */}
                  <div className="hidden sm:flex absolute left-6 top-5 -translate-x-1/2 items-center justify-center">
                    <div
                      className="flex h-9 w-9 items-center justify-center rounded-xl text-base shadow-lg ring-2 ring-slate-900"
                      style={{ backgroundColor: isStoreRole ? 'rgba(56, 189, 248, 0.25)' : 'rgba(168, 85, 247, 0.25)' }}
                    >
                      {icon}
                    </div>
                  </div>

                  {/* Body */}
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      {/* User + Role info */}
                      <div className="flex items-center gap-2 min-w-0">
                        <span
                          className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-black text-white ${
                            isStoreRole ? 'bg-sky-600' : 'bg-purple-600'
                          }`}
                        >
                          {userInitial}
                        </span>
                        <span className="font-bold text-white text-sm truncate">
                          {logItem.username}
                        </span>
                        <span
                          className={`rounded px-1.5 py-0.5 text-[10px] font-black uppercase tracking-wider border ${
                            isStoreRole
                              ? 'bg-sky-500/20 text-sky-300 border-sky-500/30'
                              : 'bg-purple-500/20 text-purple-300 border-purple-500/30'
                          }`}
                        >
                          {logItem.userRole || 'ADMIN'}
                        </span>
                      </div>

                      {/* Action & Entity Badges */}
                      <div className="flex items-center gap-1.5">
                        <span
                          className={`rounded-md px-2 py-0.5 text-[10px] font-black uppercase tracking-wider border ${actionMeta.bg} ${actionMeta.text} ${actionMeta.border}`}
                        >
                          {actionMeta.label[lang] || logItem.actionType}
                        </span>
                        <span className="rounded-md bg-slate-800 px-2 py-0.5 text-[10px] font-bold text-slate-300 border border-slate-700">
                          {logItem.entityType}
                        </span>
                      </div>
                    </div>

                    {/* Entity title & description */}
                    <div className="mt-2">
                      {logItem.entityName && (
                        <h4 className="text-xs sm:text-sm font-bold text-slate-200 group-hover:text-purple-300 transition-colors">
                          {logItem.entityName}
                        </h4>
                      )}
                      <p className="mt-0.5 text-xs text-slate-400 leading-relaxed">
                        {logItem.description}
                      </p>
                    </div>

                    {/* Footer with timestamp and relative time */}
                    <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-slate-800/60 pt-2 text-[11px] text-slate-500">
                      <div className="flex items-center gap-3">
                        <span className="flex items-center gap-1 text-slate-400">
                          <span>🕒</span>
                          <span>{formatTimestamp(logItem.createdAt, lang)}</span>
                        </span>
                        <span className="font-mono text-purple-400 font-bold">
                          ({formatRelativeTime(logItem.createdAt, lang)})
                        </span>
                      </div>

                      {isAdmin && (
                        <button
                          type="button"
                          onClick={(e) => handleDeleteLog(logItem.id, e)}
                          className="opacity-0 group-hover:opacity-100 text-slate-500 hover:text-rose-400 transition-all text-xs flex items-center gap-1"
                          title={lang === 'en' ? 'Delete entry' : 'លុប'}
                        >
                          <span>🗑️</span>
                          <span className="text-[10px]">{lang === 'en' ? 'Delete' : 'លុប'}</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      ) : (
        /* ── TABLE VIEW ── */
        <div className="overflow-x-auto rounded-3xl border border-slate-700/60 bg-slate-900/80 shadow-xl backdrop-blur-md">
          <table className="w-full border-collapse text-left text-xs">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-950/80 text-slate-400 font-bold uppercase tracking-wider text-[11px]">
                <th className="py-4 px-4">{lang === 'en' ? 'User' : 'អ្នកប្រើ'}</th>
                <th className="py-4 px-4">{lang === 'en' ? 'Action' : 'សកម្មភាព'}</th>
                <th className="py-4 px-4">{lang === 'en' ? 'Target Entity' : 'ផ្នែកគោលដៅ'}</th>
                <th className="py-4 px-6">{lang === 'en' ? 'Description' : 'ការពិពណ៌នា'}</th>
                <th className="py-4 px-4">{lang === 'en' ? 'Date & Time' : 'កាលបរិច្ឆេទ'}</th>
                <th className="py-4 px-4 text-right">{lang === 'en' ? 'Actions' : 'ប្រតិបត្តិការ'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {logs.map((logItem) => {
                const actionMeta = ACTION_COLORS[logItem.actionType] || ACTION_COLORS.CREATE
                const isStoreRole = (logItem.userRole || '').toUpperCase() === 'STORE'

                return (
                  <tr
                    key={logItem.id}
                    onClick={() => setActiveLogModal(logItem)}
                    className="cursor-pointer transition-colors hover:bg-slate-800/50"
                  >
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2">
                        <span
                          className={`flex h-7 w-7 items-center justify-center rounded-lg text-xs font-black text-white ${
                            isStoreRole ? 'bg-sky-600' : 'bg-purple-600'
                          }`}
                        >
                          {(logItem.username || 'A').charAt(0).toUpperCase()}
                        </span>
                        <div>
                          <p className="font-bold text-white">{logItem.username}</p>
                          <span
                            className={`rounded px-1.5 py-0.2 text-[9px] font-black uppercase border ${
                              isStoreRole
                                ? 'bg-sky-500/20 text-sky-300 border-sky-500/30'
                                : 'bg-purple-500/20 text-purple-300 border-purple-500/30'
                            }`}
                          >
                            {logItem.userRole || 'ADMIN'}
                          </span>
                        </div>
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      <span
                        className={`rounded-md px-2 py-0.5 text-[10px] font-black uppercase tracking-wider border ${actionMeta.bg} ${actionMeta.text} ${actionMeta.border}`}
                      >
                        {actionMeta.label[lang] || logItem.actionType}
                      </span>
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-1.5 font-bold text-slate-200">
                        <span>{logItem.icon || ENTITY_ICONS[logItem.entityType] || '📦'}</span>
                        <span>{logItem.entityType}</span>
                      </div>
                    </td>

                    <td className="py-3.5 px-6 max-w-xs sm:max-w-md">
                      {logItem.entityName && (
                        <p className="font-bold text-white truncate">{logItem.entityName}</p>
                      )}
                      <p className="text-slate-400 truncate text-[11px]">{logItem.description}</p>
                    </td>

                    <td className="py-3.5 px-4 whitespace-nowrap font-mono text-[11px] text-slate-300">
                      <div>{formatTimestamp(logItem.createdAt, lang)}</div>
                      <span className="text-[10px] text-purple-400 font-sans">
                        {formatRelativeTime(logItem.createdAt, lang)}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      {isAdmin && (
                        <button
                          type="button"
                          onClick={(e) => handleDeleteLog(logItem.id, e)}
                          className="rounded-lg p-1.5 text-slate-400 hover:bg-rose-500/20 hover:text-rose-300 transition"
                          title={lang === 'en' ? 'Delete' : 'លុប'}
                        >
                          🗑️
                        </button>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* ── DETAIL MODAL ── */}
      {activeLogModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm animate-in fade-in-0 duration-200">
          <div className="relative w-full max-w-lg overflow-hidden rounded-3xl border border-slate-700 bg-slate-900 p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center gap-2">
                <span className="text-2xl">{activeLogModal.icon || '🔔'}</span>
                <div>
                  <h3 className="text-base font-black text-white">
                    {lang === 'en' ? 'Audit Log Details' : 'ព័ត៌មានលម្អិតនៃកំណត់ត្រា'}
                  </h3>
                  <p className="text-xs text-slate-400">ID #{activeLogModal.id}</p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setActiveLogModal(null)}
                className="flex h-8 w-8 items-center justify-center rounded-xl bg-slate-800 text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="my-5 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3 rounded-2xl border border-slate-800 bg-slate-950 p-4">
                <div>
                  <span className="text-slate-500 uppercase font-bold text-[10px]">{lang === 'en' ? 'Operator' : 'អ្នកអនុវត្ត'}:</span>
                  <p className="text-sm font-black text-white mt-0.5">{activeLogModal.username}</p>
                  <span className="text-purple-400 font-bold text-[10px]">{activeLogModal.userRole}</span>
                </div>

                <div>
                  <span className="text-slate-500 uppercase font-bold text-[10px]">{lang === 'en' ? 'Action & Type' : 'សកម្មភាព'}:</span>
                  <p className="text-sm font-black text-white mt-0.5">{activeLogModal.actionType}</p>
                  <span className="text-slate-400 text-[10px]">{activeLogModal.entityType}</span>
                </div>
              </div>

              {activeLogModal.entityName && (
                <div>
                  <span className="text-slate-500 font-bold">{lang === 'en' ? 'Item / Entity Name:' : 'ឈ្មោះទំនិញ / ផ្នែក:'}</span>
                  <p className="mt-1 font-bold text-white text-sm bg-slate-800/60 p-2.5 rounded-xl border border-slate-700/50">
                    {activeLogModal.entityName}
                  </p>
                </div>
              )}

              <div>
                <span className="text-slate-500 font-bold">{lang === 'en' ? 'Full Description:' : 'ការពិពណ៌នាពេញលេញ:'}</span>
                <p className="mt-1 text-slate-200 bg-slate-800/60 p-3 rounded-xl border border-slate-700/50 leading-relaxed">
                  {activeLogModal.description}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3 text-slate-400">
                <div>
                  <span className="text-slate-500 font-bold block">{lang === 'en' ? 'Timestamp:' : 'ពេលវេលា:'}</span>
                  <span className="font-mono text-slate-200">{formatTimestamp(activeLogModal.createdAt, lang)}</span>
                </div>
                <div>
                  <span className="text-slate-500 font-bold block">{lang === 'en' ? 'Status:' : 'ស្ថានភាព:'}</span>
                  <span className="font-bold text-emerald-400">{activeLogModal.status || 'SUCCESS'}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between border-t border-slate-800 pt-4">
              {isAdmin && (
                <button
                  type="button"
                  onClick={() => handleDeleteLog(activeLogModal.id)}
                  className="rounded-xl border border-rose-500/40 bg-rose-950/40 px-3.5 py-2 text-xs font-bold text-rose-300 hover:bg-rose-900/40"
                >
                  {lang === 'en' ? 'Delete Record' : 'លុបកំណត់ត្រា'}
                </button>
              )}

              <button
                type="button"
                onClick={() => setActiveLogModal(null)}
                className="ml-auto rounded-xl bg-purple-600 px-5 py-2 text-xs font-bold text-white hover:bg-purple-500 shadow-lg shadow-purple-600/30"
              >
                {lang === 'en' ? 'Close' : 'បិទ'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
