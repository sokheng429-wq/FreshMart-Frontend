import { useCallback, useEffect, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useLanguage } from '../../context/LanguageContext'
import { useNotifications } from '../../context/NotificationContext'
import { adminCustomerGroupAPI } from '../../api/api'
import { SectionShell, Field, TextInput, PrimaryButton, GhostButton, Modal } from './stockUI'

const COLUMN_DEFS = [
  { key: 'description', label: { en: 'Description', kh: 'ការពិពណ៌នា' } },
  { key: 'secondLanguage', label: { en: 'Second Language', kh: 'ភាសាទី២' } },
  { key: 'active', label: { en: 'Active', kh: 'ដំណើរការ' } },
]
const DEFAULT_COLS = ['description', 'secondLanguage', 'active']

const T = {
  subtitle: {
    en: 'Add, view and edit your customer groups all in one place.',
    kh: 'បន្ថែម មើល និងកែប្រែក្រុមអតិថិជនរបស់អ្នកនៅកន្លែងតែមួយ។',
  },
  newBtn: { en: '+ New Group', kh: '+ ក្រុមថ្មី' },
  searchByLabel: { en: 'Search By', kh: 'ស្វែងរកដោយ' },
  byCode: { en: 'Code', kh: 'កូដ' },
  byDescription: { en: 'Description', kh: 'ការពិពណ៌នា' },
  bySecondLang: { en: 'Second Language', kh: 'ភាសាទី២' },
  searchPlaceholder: {
    en: 'Type to search customer groups…',
    kh: 'បញ្ចូលដើម្បីស្វែងរកក្រុមអតិថិជន…',
  },
  statusLabel: { en: 'Status', kh: 'ស្ថានភាព' },
  allGroups: { en: 'All Groups', kh: 'ក្រុមទាំងអស់' },
  activeOnly: { en: 'Active', kh: 'ដំណើរការ' },
  inactiveOnly: { en: 'Inactive', kh: 'អសកម្ម' },
  chooseColumn: { en: 'Choose Column', kh: 'ជ្រើសរើសជួរឈរ' },
  resetCols: { en: 'Reset to Normal', kh: 'កំណត់ឡើងវិញតាមដើម' },
  cancel: { en: 'Cancel', kh: 'បោះបង់' },
  apply: { en: 'Apply', kh: 'អនុវត្ត' },
  noResults: { en: 'No customer groups match your filters.', kh: 'រកមិនឃើញក្រុមអតិថិជនតាមតម្រូវការ។' },
  code: { en: 'Code', kh: 'កូដ' },
  description: { en: 'Description', kh: 'ការពិពណ៌នា' },
  secondLang: { en: 'Second Language', kh: 'ភាសាទី២' },
  active: { en: 'Active', kh: 'ដំណើរការ' },
  newTitle: { en: 'Create Customer Group', kh: 'បង្កើតក្រុមអតិថិជន' },
  editTitle: { en: 'Edit Customer Group', kh: 'កែក្រុមអតិថិជន' },
  autoGenTitle: {
    en: 'Leave blank to auto-generate sequence (CG-0001) — or enter custom code',
    kh: 'ទុកចំហដើម្បីបង្កើតកូដបន្ទាប់ដោយស្វ័យប្រវត្តិ (CG-0001) — ឬបញ្ចូលកូដផ្ទាល់ខ្លួន',
  },
  descPlaceholder: { en: 'e.g. VIP Retail Customer, Wholesale B2B', kh: 'ឧ. ដៃគូលក់ដុំ B2B, អតិថិជន VIP' },
  secondLangPlaceholder: { en: 'ឧ. ដៃគូលក់ដុំ B2B, អតិថិជន VIP', kh: 'ឧ. ដៃគូលក់ដុំ B2B, អតិថិជន VIP' },
  edit: { en: 'Edit', kh: 'កែ' },
  delete: { en: 'Delete', kh: 'លុប' },
  create: { en: 'Create', kh: 'បង្កើត' },
  save: { en: 'Save', kh: 'រក្សាទុក' },
  saving: { en: 'Saving…', kh: 'កំពុងរក្សាទុក…' },
  deleteConfirm: { en: 'Are you sure you want to delete this customer group?', kh: 'តើអ្នកពិតជាចង់លុបក្រុមអតិថិជននេះមែនទេ?' },
  empty: { en: 'Nothing here yet — create your first customer group.', kh: 'មិនទាន់មានទិន្នន័យទេ — បង្កើតក្រុមអតិថិជនដំបូងរបស់អ្នក។' },
  loadFailed: { en: 'Could not load customer groups from server.', kh: 'មិនអាចផ្ទុកក្រុមអតិថិជនពីម៉ាស៊ីនមេបានទេ។' },
}

const t = (key, lang) => T[key]?.[lang] || T[key]?.en || key

// Toggle switch for active status
const ToggleSwitch = ({ checked, onChange, label }) => (
  <span className="flex cursor-pointer select-none items-center gap-2.5" onClick={onChange}>
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      tabIndex={-1}
      className={`pointer-events-none relative block h-6 w-11 shrink-0 rounded-full transition-colors duration-200 ${
        checked ? 'bg-[#77BC1F]' : 'bg-slate-700'
      }`}
    >
      <span
        className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform duration-200 ${
          checked ? 'translate-x-[20px]' : 'translate-x-0'
        }`}
      />
    </button>
    {label && <span className="text-sm font-semibold text-slate-300">{label}</span>}
  </span>
)

const Dot = ({ on }) => (
  <span
    className={`inline-block h-2.5 w-2.5 rounded-full ${on ? 'bg-[#77BC1F]' : 'bg-slate-600'}`}
    title={on ? '✓' : '—'}
  />
)

const EMPTY_FORM = { id: null, code: '', description: '', secondLanguage: '', active: true }

export const CustomerGroupList = () => {
  const { lang } = useLanguage()
  const { addNotification } = useNotifications()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()

  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [loadError, setLoadError] = useState(null)
  const [formOpen, setFormOpen] = useState(false)
  const [form, setForm] = useState(EMPTY_FORM)

  // Filter bar state
  const [query, setQuery] = useState('')
  const [searchBy, setSearchBy] = useState('description')
  const [status, setStatus] = useState('all')

  // Column chooser modal
  const [visibleCols, setVisibleCols] = useState(new Set(DEFAULT_COLS))
  const [showColModal, setShowColModal] = useState(false)
  const [colDraft, setColDraft] = useState(new Set(DEFAULT_COLS))

  // Fetch live groups from Spring Boot
  const refresh = useCallback(async () => {
    setLoading(true)
    try {
      const res = await adminCustomerGroupAPI.getAll()
      const list = res?.data ?? res
      setItems(Array.isArray(list) ? list : [])
      setLoadError(null)
    } catch (err) {
      console.error('Failed to load customer groups:', err)
      setLoadError(err.message || t('loadFailed', lang))
      setItems([])
    } finally {
      setLoading(false)
    }
  }, [lang])

  useEffect(() => {
    refresh()
  }, [refresh])

  // If page requested edit with query param ?id=...
  useEffect(() => {
    const editId = searchParams.get('id')
    if (editId && items.length > 0) {
      const found = items.find((it) => String(it.id) === String(editId))
      if (found) {
        openEdit(found)
      }
    }
  }, [searchParams, items])

  const filtered = items.filter((it) => {
    if (query.trim()) {
      const needle = query.trim().toLowerCase()
      const hay = String(it[searchBy] ?? '').toLowerCase()
      if (!hay.includes(needle)) return false
    }
    if (status === 'active' && it.active === false) return false
    if (status === 'inactive' && it.active !== false) return false
    return true
  })

  const toggleColDraft = (key) =>
    setColDraft((prev) => {
      const next = new Set(prev)
      if (next.has(key)) {
        if (next.size > 1) next.delete(key)
      } else {
        next.add(key)
      }
      return next
    })

  const openColModal = () => {
    setColDraft(new Set(visibleCols))
    setShowColModal(true)
  }

  const applyColumns = () => {
    setVisibleCols(new Set(colDraft))
    setShowColModal(false)
  }

  const resetColumns = () => setColDraft(new Set(DEFAULT_COLS))

  const openAdd = () => {
    setForm({ ...EMPTY_FORM })
    setFormOpen(true)
  }

  const openEdit = (item) => {
    setForm({
      id: item.id,
      code: item.code || '',
      description: item.description || '',
      secondLanguage: item.secondLanguage || '',
      active: item.active !== false,
    })
    setFormOpen(true)
  }

  const saveForm = async (e) => {
    if (e) e.preventDefault()
    if (!form.description.trim()) {
      alert(lang === 'en' ? 'Description is required' : 'សូមបញ្ចូលការពិពណ៌នា')
      return
    }

    setSaving(true)
    const payload = {
      code: form.code.trim() || undefined,
      description: form.description.trim(),
      secondLanguage: form.secondLanguage.trim() || undefined,
      active: form.active !== false,
    }

    try {
      if (form.id != null) {
        await adminCustomerGroupAPI.update(form.id, payload)
        addNotification({
          type: 'success',
          title: lang === 'en' ? 'Customer group updated successfully' : 'បានធ្វើបច្ចុប្បន្នភាពក្រុមអតិថិជន',
        })
      } else {
        await adminCustomerGroupAPI.create(payload)
        addNotification({
          type: 'success',
          title: lang === 'en' ? 'Customer group created successfully' : 'បានបង្កើតក្រុមអតិថិជនដោយជោគជ័យ',
        })
      }
      setFormOpen(false)
      refresh()
    } catch (err) {
      console.error('Failed to save customer group:', err)
      alert(err.message || (lang === 'en' ? 'Failed to save customer group' : 'បរាជ័យក្នុងការរក្សាទុក'))
    } finally {
      setSaving(false)
    }
  }

  const removeItem = async (item) => {
    if (!window.confirm(t('deleteConfirm', lang))) return
    try {
      await adminCustomerGroupAPI.delete(item.id)
      addNotification({
        type: 'success',
        title: lang === 'en' ? 'Customer group deleted' : 'បានលុបក្រុមអតិថិជន',
      })
      refresh()
    } catch (err) {
      alert(err.message || (lang === 'en' ? 'Delete failed' : 'ការលុបបានបរាជ័យ'))
    }
  }

  const renderCell = (item, key) => {
    switch (key) {
      case 'code':
        return <span className="font-mono font-bold text-[#77BC1F]">{item.code || '—'}</span>
      case 'description':
        return <span className="font-semibold text-slate-200">{item.description || '—'}</span>
      case 'secondLanguage':
        return (
          <span className="text-slate-300 font-['Khmer_OS_Battambang',sans-serif]">
            {item.secondLanguage || '—'}
          </span>
        )
      case 'active':
        return <Dot on={item.active !== false} />
      default:
        return null
    }
  }

  const selectCls =
    'w-full rounded-lg border border-slate-700/70 bg-slate-950/60 px-3 py-2.5 text-sm font-medium text-white outline-none transition focus:border-green-400 focus:bg-slate-950 focus:ring-4 focus:ring-green-500/10 hover:border-slate-600'
  const ghostBtnCls =
    'inline-flex items-center justify-center gap-2 rounded-lg border border-slate-700 px-3.5 py-2.5 text-xs font-bold text-slate-300 transition hover:border-slate-600 hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-40'

  return (
    <div className="space-y-5" style={{ fontFamily: 'Montserrat, sans-serif' }}>
      {/* Header & Back Navigation */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between border-b border-slate-800 pb-5">
        <div>
          <Link
            to="/admin/sale-dashboard"
            className="mb-2 inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-[0.16em] text-green-400 transition hover:text-green-300"
          >
            ← {lang === 'en' ? 'Sale Dashboard' : 'ផ្ទាំងលក់'}
          </Link>
          <div className="flex items-center gap-3">
            <span
              className="flex h-12 w-12 items-center justify-center rounded-2xl p-1.5 shadow-lg shadow-black/20 ring-1 ring-white/10"
              style={{ background: 'rgba(20, 184, 166, 0.2)' }}
            >
              <span className="text-2xl">👥</span>
            </span>
            <h1 className="text-2xl font-extrabold tracking-tight text-white md:text-3xl">
              {lang === 'en' ? 'Customer Groups' : 'ក្រុមអតិថិជន'}
            </h1>
          </div>
          <p className="mt-1 max-w-2xl text-sm text-slate-400">{t('subtitle', lang)}</p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <PrimaryButton onClick={openAdd}>{t('newBtn', lang)}</PrimaryButton>
        </div>
      </div>

      {loadError && (
        <p className="rounded-lg border border-red-500/40 bg-red-500/10 px-4 py-2 text-sm font-semibold text-red-300">
          {loadError}
        </p>
      )}

      {/* Data Table Card */}
      <section className="overflow-hidden rounded-2xl border border-slate-700/60 bg-slate-900/80 shadow-xl shadow-black/20">
        {/* Filter Bar */}
        <div className="flex flex-col gap-3 border-b border-slate-700/60 p-4 lg:flex-row lg:items-center">
          {/* Search By dropdown */}
          <select
            value={searchBy}
            onChange={(e) => setSearchBy(e.target.value)}
            aria-label={t('searchByLabel', lang)}
            className={`${selectCls} w-full sm:w-auto sm:min-w-[170px]`}
          >
            <option value="description">
              {t('searchByLabel', lang)}: {t('byDescription', lang)}
            </option>
            <option value="code">
              {t('searchByLabel', lang)}: {t('byCode', lang)}
            </option>
            <option value="secondLanguage">
              {t('searchByLabel', lang)}: {t('bySecondLang', lang)}
            </option>
          </select>

          {/* Search input */}
          <div className="relative min-w-0 flex-1">
            <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 text-sm">
              🔍
            </span>
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t('searchPlaceholder', lang)}
              className="w-full rounded-lg border border-slate-700/70 bg-slate-950/60 py-2.5 pl-10 pr-4 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-green-400 focus:bg-slate-950 focus:ring-4 focus:ring-green-500/10"
            />
          </div>

          {/* Status dropdown */}
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            aria-label={t('statusLabel', lang)}
            className={`${selectCls} w-full sm:w-auto sm:min-w-[150px]`}
          >
            <option value="all">{t('allGroups', lang)}</option>
            <option value="active">{t('activeOnly', lang)}</option>
            <option value="inactive">{t('inactiveOnly', lang)}</option>
          </select>

          {/* Choose Column trigger */}
          <button
            type="button"
            onClick={openColModal}
            title={t('chooseColumn', lang)}
            className={ghostBtnCls}
          >
            <span>▦</span>
            <span className="hidden xl:inline">{t('chooseColumn', lang)}</span>
          </button>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead>
              <tr className="border-b border-slate-700/60 bg-slate-800/40 text-xs font-bold uppercase tracking-wide text-slate-400">
                <th className="whitespace-nowrap px-4 py-3">{t('code', lang)}</th>
                {COLUMN_DEFS.filter((c) => visibleCols.has(c.key)).map((col) => (
                  <th key={col.key} className="whitespace-nowrap px-4 py-3">
                    {col.label[lang]}
                  </th>
                ))}
                <th className="whitespace-nowrap px-4 py-3 text-right">
                  {lang === 'en' ? 'Actions' : 'សកម្មភាព'}
                </th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={visibleCols.size + 2} className="px-4 py-14 text-center">
                    <div className="flex items-center justify-center gap-2 text-slate-400">
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-green-500 border-t-transparent" />
                      <span>{lang === 'en' ? 'Loading customer groups…' : 'កំពុងផ្ទុកក្រុមអតិថិជន…'}</span>
                    </div>
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={visibleCols.size + 2} className="px-4 py-14 text-center">
                    <span className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-slate-800 text-2xl">
                      👥
                    </span>
                    <p className="text-sm font-bold text-slate-300">
                      {items.length === 0 ? t('empty', lang) : t('noResults', lang)}
                    </p>
                    {items.length === 0 && (
                      <div className="mt-3">
                        <PrimaryButton onClick={openAdd}>{t('newBtn', lang)}</PrimaryButton>
                      </div>
                    )}
                  </td>
                </tr>
              ) : (
                filtered.map((item) => (
                  <tr
                    key={item.id}
                    className="border-b border-slate-800/60 transition last:border-0 hover:bg-slate-800/40"
                  >
                    <td className="whitespace-nowrap px-4 py-3 font-mono font-bold text-[#77BC1F]">
                      {item.code || '—'}
                    </td>
                    {COLUMN_DEFS.filter((c) => visibleCols.has(c.key)).map((col) => (
                      <td key={col.key} className="whitespace-nowrap px-4 py-3">
                        {renderCell(item, col.key)}
                      </td>
                    ))}
                    <td className="whitespace-nowrap px-4 py-3 text-right">
                      <div className="inline-flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => openEdit(item)}
                          className="rounded-lg px-2.5 py-1 text-xs font-bold text-slate-300 hover:bg-slate-800 hover:text-white transition"
                        >
                          ✏️ {t('edit', lang)}
                        </button>
                        <button
                          type="button"
                          onClick={() => removeItem(item)}
                          className="rounded-lg px-2.5 py-1 text-xs font-bold text-red-400 hover:bg-red-500/10 transition"
                        >
                          🗑️ {t('delete', lang)}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* Create / Edit Modal (Matching Create Groups At Stocks) */}
      <Modal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        title={form.id == null ? t('newTitle', lang) : t('editTitle', lang)}
      >
        <form onSubmit={saveForm} className="space-y-4">
          <Field label={t('code', lang)}>
            <TextInput
              value={form.code}
              onChange={(e) => setForm({ ...form, code: e.target.value })}
              placeholder={t('autoGenTitle', lang)}
            />
            <span className="text-[11px] text-slate-400">{t('autoGenTitle', lang)}</span>
          </Field>

          <Field label={t('description', lang)} required>
            <TextInput
              required
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder={t('descPlaceholder', lang)}
              autoFocus
            />
          </Field>

          <Field label={t('secondLang', lang)}>
            <TextInput
              value={form.secondLanguage}
              onChange={(e) => setForm({ ...form, secondLanguage: e.target.value })}
              placeholder={t('secondLangPlaceholder', lang)}
            />
          </Field>

          <div className="pt-2">
            <ToggleSwitch
              checked={form.active}
              onChange={() => setForm({ ...form, active: !form.active })}
              label={t('active', lang)}
            />
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-slate-800">
            <GhostButton onClick={() => setFormOpen(false)} disabled={saving}>
              {t('cancel', lang)}
            </GhostButton>
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-green-500 px-5 py-2.5 text-sm font-black text-slate-950 shadow-lg shadow-green-500/20 transition hover:-translate-y-0.5 hover:bg-green-400 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {saving ? (
                <>
                  <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-slate-950 border-t-transparent" />
                  <span>{t('saving', lang)}</span>
                </>
              ) : (
                <span>{form.id == null ? t('create', lang) : t('save', lang)}</span>
              )}
            </button>
          </div>
        </form>
      </Modal>

      {/* Choose Column Modal */}
      <Modal
        open={showColModal}
        onClose={() => setShowColModal(false)}
        title={t('chooseColumn', lang)}
      >
        <div className="space-y-4">
          <div className="divide-y divide-slate-800 rounded-xl border border-slate-800 bg-slate-950/40">
            {COLUMN_DEFS.map((col) => {
              const checked = colDraft.has(col.key)
              return (
                <label
                  key={col.key}
                  className="flex items-center justify-between p-3 text-sm text-slate-200 cursor-pointer hover:bg-slate-800/40"
                >
                  <span className="font-semibold">{col.label[lang]}</span>
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => toggleColDraft(col.key)}
                    className="h-4 w-4 rounded border-slate-700 text-green-500 focus:ring-green-500"
                  />
                </label>
              )
            })}
          </div>

          <div className="flex items-center justify-between pt-2">
            <button
              type="button"
              onClick={resetColumns}
              className="text-xs font-bold text-slate-400 hover:text-green-400 transition"
            >
              {t('resetCols', lang)}
            </button>
            <div className="flex items-center gap-2">
              <GhostButton onClick={() => setShowColModal(false)}>
                {t('cancel', lang)}
              </GhostButton>
              <PrimaryButton onClick={applyColumns}>{t('apply', lang)}</PrimaryButton>
            </div>
          </div>
        </div>
      </Modal>
    </div>
  )
}

export default CustomerGroupList
