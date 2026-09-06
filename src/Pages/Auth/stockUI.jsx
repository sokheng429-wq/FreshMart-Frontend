import { Link } from 'react-router-dom'
import { useLanguage } from '../../context/LanguageContext'
import './stockUI.css'

// Shared building blocks for the Stocks sub-module pages (master data +
// transactions). Keeps every section visually identical: dark admin theme,
// green primary, orange destructive accents.

export const SectionShell = ({ icon, color = '#22c55e', title, subtitle, actions, children }) => {
  const { lang } = useLanguage()
  const isImg = typeof icon === 'string' && (icon.includes('/') || icon.endsWith('.png') || icon.endsWith('.svg') || icon.endsWith('.webp'))

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <Link to="/admin/products" className="mb-2 inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-[0.16em] text-green-400 transition hover:text-green-300">
            <ChevronLeftIcon /> {lang === 'en' ? 'Stocks' : 'ផលិតផល'}
          </Link>
          <div className="flex items-center gap-3">
            <span className="flex h-12 w-12 items-center justify-center rounded-2xl p-1.5 shadow-lg shadow-black/20 ring-1 ring-white/10" style={{ background: `${color}25` }}>
              {isImg ? (
                <img src={icon} alt="" className="h-8 w-8 object-contain drop-shadow-md" />
              ) : (
                <span className="text-2xl">{icon}</span>
              )}
            </span>
            <h1 className="text-2xl font-extrabold tracking-tight text-white md:text-3xl">{title[lang]}</h1>
          </div>
          {subtitle && <p className="mt-1 max-w-2xl text-sm text-slate-400">{subtitle[lang]}</p>}
        </div>
        {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
      </div>
      {children}
    </div>
  )
}

// Simple labeled input/select used across all module forms
const fieldCls =
  'w-full rounded-lg border border-slate-700/70 bg-slate-950/60 px-3 py-2.5 text-sm font-medium text-white outline-none transition placeholder:text-slate-500 focus:border-green-400 focus:bg-slate-950 focus:ring-4 focus:ring-green-500/10'

export const Field = ({ label, required, error, children }) => (
  <label className="block space-y-1.5">
    <span className="text-xs font-bold uppercase tracking-wide text-slate-400">
      {label} {required && <span style={{ color: '#FF9900' }}>*</span>}
    </span>
    {children}
    {error && <span className="block text-xs font-semibold text-red-400">{error}</span>}
  </label>
)

export const TextInput = (props) => <input {...props} className={`${fieldCls} ${props.className || ''}`} />
export const SelectInput = ({ children, ...props }) => (
  <select {...props} className={fieldCls}>{children}</select>
)

export const PrimaryButton = ({ children, ...props }) => (
  <button
    type="button"
    {...props}
    className="inline-flex items-center justify-center gap-2 rounded-xl bg-green-500 px-4 py-2.5 text-sm font-black text-slate-950 shadow-lg shadow-green-500/20 transition hover:-translate-y-0.5 hover:bg-green-400 disabled:cursor-not-allowed disabled:opacity-40"
  >
    {children}
  </button>
)

export const GhostButton = ({ children, ...props }) => (
  <button
    type="button"
    {...props}
    className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-700 px-3.5 py-2.5 text-xs font-bold text-slate-300 transition hover:border-slate-600 hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-40"
  >
    {children}
  </button>
)

// Modal wrapper — click outside closes; Escape handled by caller if needed.
export const Modal = ({ open, onClose, title, children, wide }) => (
  open && (
    <div className="fixed inset-0 z-50 flex items-center justify-center modal-overlay p-3 sm:p-4" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        className={`max-h-[90vh] w-full ${wide ? 'max-w-3xl' : 'max-w-lg'} overflow-y-auto rounded-2xl border border-slate-700/80 bg-slate-900 p-4 sm:p-6 shadow-2xl shadow-black/60 modal-panel scrollbar-thin`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between pb-2 border-b border-slate-800">
          <h3 className="text-sm sm:text-base font-extrabold text-white">{title}</h3>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-800 hover:text-white"
          >
            <XIcon />
          </button>
        </div>
        {children}
      </div>
    </div>
  )
)

// Data-table shell with consistent header styling and an empty state.
export const DataTable = ({ headers, rows, emptyText, emptyIcon = '📋' }) => {
  const { lang } = useLanguage()
  return (
    <section className="overflow-hidden rounded-2xl border border-slate-700/60 bg-slate-900/80 shadow-xl shadow-black/20">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead>
            <tr className="border-b border-slate-700/60 bg-slate-800/40 text-xs font-bold uppercase tracking-wide text-slate-500">
              {headers.map((h) => (
                <th key={typeof h === 'string' ? h : JSON.stringify(h)} className="whitespace-nowrap px-4 py-3">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={headers.length} className="px-4 py-14 text-center">
                  <span className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-slate-800 text-2xl">{emptyIcon}</span>
                  <p className="text-sm text-slate-400">{emptyText[lang]}</p>
                </td>
              </tr>
            ) : (
              rows.map((row, i) => (
                <tr key={row.id ?? i} className="border-b border-slate-800/60 transition last:border-0 hover:bg-slate-800/40">
                  {row.cells.map((cell, j) => (
                    <td key={j} className={`whitespace-nowrap px-4 py-3 ${row.cellClass?.(j) || ''}`}>{cell}</td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </section>
  )
}

// Small status pill
export const Pill = ({ tone = 'green', children }) => {
  const TONES = {
    green: ['rgba(119,188,31,0.15)', '#A3E635'],
    orange: ['rgba(255,153,0,0.15)', '#FF9900'],
    red: ['rgba(244,63,94,0.15)', '#FB7185'],
    slate: ['rgba(148,163,184,0.12)', '#CBD5E1'],
    blue: ['rgba(56,189,248,0.12)', '#7DD3FC'],
  }
  const [bg, fg] = TONES[tone] || TONES.slate
  return (
    <span className="inline-block rounded-full px-2.5 py-1 text-[11px] font-bold" style={{ backgroundColor: bg, color: fg }}>
      {children}
    </span>
  )
}

// Confirmation Modal Dialog (for Save & Delete actions)
export const ConfirmModal = ({
  open,
  onClose,
  onConfirm,
  title = { en: 'Confirm Action', kh: 'បញ្ជាក់សកម្មភាព' },
  message = { en: 'Are you sure you want to proceed?', kh: 'តើអ្នកប្រាកដជាចង់បន្តឬ?' },
  confirmText = { en: 'Confirm', kh: 'យល់ព្រម' },
  cancelText = { en: 'Cancel', kh: 'បោះបង់' },
  type = 'danger', // 'danger' | 'save' | 'primary' | 'warning'
  loading = false,
}) => {
  const { lang } = useLanguage()
  const t = (val) => (typeof val === 'object' && val !== null ? (lang === 'en' ? val.en : val.kh) : val)

  if (!open) return null

  const isDanger = type === 'danger'
  const isSave = type === 'save' || type === 'primary'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center modal-overlay p-3 sm:p-4" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        className="w-full max-w-md overflow-hidden rounded-3xl border border-slate-700/80 bg-slate-900 p-5 sm:p-6 shadow-2xl shadow-black/80 modal-panel"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start gap-4">
          <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl text-2xl ${
            isDanger ? 'bg-red-500/20 text-red-400' : isSave ? 'bg-green-500/20 text-green-400' : 'bg-amber-500/20 text-amber-400'
          }`}>
            {isDanger ? '🗑️' : isSave ? '💾' : '⚠️'}
          </div>

          <div className="flex-1 min-w-0">
            <h3 className="text-base font-extrabold text-white">
              {t(title)}
            </h3>
            <p className="mt-1.5 text-xs text-slate-300 leading-relaxed font-medium">
              {t(message)}
            </p>
          </div>
        </div>

        <div className="mt-6 flex items-center justify-end gap-3 border-t border-slate-800 pt-4">
          <GhostButton onClick={onClose} disabled={loading}>
            {t(cancelText)}
          </GhostButton>
          <button
            type="button"
            disabled={loading}
            onClick={onConfirm}
            className={`inline-flex items-center justify-center gap-2 rounded-xl px-5 py-2.5 text-xs font-black shadow-lg transition active:scale-95 disabled:opacity-50 ${
              isDanger
                ? 'bg-red-600 text-white shadow-red-600/30 hover:bg-red-500'
                : 'bg-green-500 text-slate-950 shadow-green-500/25 hover:bg-green-400'
            }`}
          >
            {loading ? (lang === 'en' ? 'Processing…' : 'កំពុងដំណើរការ…') : t(confirmText)}
          </button>
        </div>
      </div>
    </div>
  )
}

/* ---------- icons ---------- */
const ChevronLeftIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
    <polyline points="15 18 9 12 15 6" />
  </svg>
)

const XIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
)
