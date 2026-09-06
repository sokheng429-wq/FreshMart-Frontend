import { useCallback, useEffect, useState } from 'react'
import { useLanguage } from '../../context/LanguageContext'
import { adminAttributeAPI } from '../../api/api'
import { SectionShell, Field, TextInput, PrimaryButton, GhostButton, Modal, Pill } from './stockUI'
import './Attributes.css'

const ORANGE = '#FF9900'

// Columns offered in the "Choose Column" modal — the entity fields.
// "code" is the identity column and is always shown.
const COLUMN_DEFS = [
  { key: 'nameKh', label: { en: 'Second Language', kh: 'ភាសាទី២' } },
  { key: 'type', label: { en: 'Type', kh: 'ប្រភេទ' } },
  { key: 'values', label: { en: 'Values', kh: 'តម្លៃ' } },
  { key: 'active', label: { en: 'Active', kh: 'ដំណើរការ' } },
]
const DEFAULT_COLS = ['nameKh', 'type', 'values', 'active']

// Free-text type tags for an attribute (same options as the old master-data page).
const TYPE_OPTIONS = [
  { v: 'Text', en: 'Text', kh: 'អក្សរ' },
  { v: 'Number', en: 'Number', kh: 'លេខ' },
  { v: 'Color', en: 'Color', kh: 'ពណ៌' },
  { v: 'Size', en: 'Size', kh: 'ទំហំ' },
  { v: 'Flavor', en: 'Flavor', kh: 'រសជាតិ' },
]

const T = {
  subtitle: {
    en: 'Dynamic product variants like Size, Color or Flavor.',
    kh: 'លក្ខណៈសម្បត្តិផលិតផលដូចជា ទំហំ ពណ៌ ឬរសជាតិ។',
  },
  newBtn: { en: '+ New Attribute', kh: '+ លក្ខណៈសម្បត្តិថ្មី' },
  // filter bar
  searchByLabel: { en: 'Search By', kh: 'ស្វែងរកដោយ' },
  byCode: { en: 'Code', kh: 'កូដ' },
  byDescription: { en: 'Name', kh: 'ឈ្មោះ' },
  bySecondLang: { en: 'Second Language', kh: 'ភាសាទី២' },
  byType: { en: 'Type', kh: 'ប្រភេទ' },
  byValues: { en: 'Values', kh: 'តម្លៃ' },
  searchPlaceholder: {
    en: 'Type to search attributes…',
    kh: 'បញ្ចូលដើម្បីស្វែងរកលក្ខណៈសម្បត្តិ…',
  },
  statusLabel: { en: 'Status', kh: 'ស្ថានភាព' },
  allAttributes: { en: 'All Attributes', kh: 'លក្ខណៈសម្បត្តិទាំងអស់' },
  activeOnly: { en: 'Active', kh: 'ដំណើរការ' },
  inactiveOnly: { en: 'Inactive', kh: 'អសកម្ម' },
  chooseColumn: { en: 'Choose Column', kh: 'ជ្រើសរើសជួរឈរ' },
  resetCols: { en: 'Reset to Normal', kh: 'កំណត់ឡើងវិញតាមដើម' },
  cancel: { en: 'Cancel', kh: 'បោះបង់' },
  apply: { en: 'Apply', kh: 'អនុវត្ត' },
  noResults: { en: 'No attributes match your filters.', kh: 'រកមិនឃើញលក្ខណៈសម្បត្តិតាមតម្រូវការ។' },
  // columns
  code: { en: 'Code', kh: 'កូដ' },
  description: { en: 'Name', kh: 'ឈ្មោះ' },
  secondLang: { en: 'Second Language', kh: 'ភាសាទី២' },
  type: { en: 'Type', kh: 'ប្រភេទ' },
  values: { en: 'Values', kh: 'តម្លៃ' },
  active: { en: 'Active', kh: 'ដំណើរការ' },
  // form
  newTitle: { en: 'Create Attribute', kh: 'បង្កើតលក្ខណៈសម្បត្តិ' },
  editTitle: { en: 'Edit Attribute', kh: 'កែលក្ខណៈសម្បត្តិ' },
  autoGenTitle: {
    en: 'Leave blank and the backend generates the next free AT code — or type your own',
    kh: 'ទុកចំហចង់បាន — ម៉ាស៊ីនមេនឹងបង្កើតកូដ AT បន្ទាប់ដោយស្វ័យប្រវត្តិ — ឬបញ្ចូលដោយខ្លួនឯង',
  },
  descPlaceholder: { en: 'e.g. Size', kh: 'ឧ. ទំហំ' },
  secondLangPlaceholder: { en: 'ឧ. ទំហំ', kh: 'ឧ. ទំហំ' },
  typePlaceholder: { en: 'Select type', kh: 'ជ្រើសរើសប្រភេទ' },
  valuesPlaceholder: { en: 'Small, Medium, Large', kh: 'តូច, មធ្យម, ធំ' },
  valuesHint: { en: 'Comma-separated list of allowed values.', kh: 'បញ្ជីតម្លៃដាច់គ្នាដោយសញ្ញាក្បៀស។' },
  edit: { en: 'Edit', kh: 'កែ' },
  delete: { en: 'Delete', kh: 'លុប' },
  create: { en: 'Create', kh: 'បង្កើត' },
  save: { en: 'Save', kh: 'រក្សាទុក' },
  deleteConfirm: { en: 'Delete this attribute?', kh: 'លុបលក្ខណៈសម្បត្តិនេះ?' },
  empty: { en: 'Nothing here yet — create your first attribute.', kh: 'មិនទាន់មានទិន្នន័យទេ — បង្កើតជួរដេកដំបូងរបស់អ្នក។' },
  loadFailed: { en: 'Could not load attributes from the server.', kh: 'មិនអាចផ្ទុកលក្ខណៈសម្បត្តិពីម៉ាស៊ីនមេបានទេ។' },
}

const t = (key, lang) => T[key][lang]

export const Attributes = () => {
  const { lang } = useLanguage()
  const [items, setItems] = useState([])
  const [loadError, setLoadError] = useState(null)
  const [formOpen, setFormOpen] = useState(false)
  const [form, setForm] = useState(EMPTY_FORM)

  // Filter bar state — same shape as the Category page
  const [query, setQuery] = useState('')
  const [searchBy, setSearchBy] = useState('description') // code | description | nameKh | type | values
  const [status, setStatus] = useState('all') // all | active | inactive
  // choose-column modal: draft edits live here until "Apply"
  const [visibleCols, setVisibleCols] = useState(new Set(DEFAULT_COLS))
  const [showColModal, setShowColModal] = useState(false)
  const [colDraft, setColDraft] = useState(new Set(DEFAULT_COLS))

  // Fetch the attribute list; `refresh` is also used after create/update/delete.
  // State updates only happen in the async callbacks, never synchronously
  // inside the effect body.
  const refresh = useCallback(() => {
    adminAttributeAPI.getAll()
      .then((res) => {
        setItems(Array.isArray(res?.data) ? res.data : [])
        setLoadError(null)
      })
      .catch((err) => setLoadError(err.message || T.loadFailed[lang]))
  }, [lang])

  useEffect(() => { refresh() }, [refresh])

  const filtered = items.filter((it) => {
    // text search restricted to the chosen field
    if (query.trim()) {
      const needle = query.trim().toLowerCase()
      const hay = String(it[searchBy === 'description' ? 'description' : searchBy] ?? '').toLowerCase()
      if (!hay.includes(needle)) return false
    }
    // status filter
    if (status === 'active' && it.active === false) return false
    if (status === 'inactive' && it.active !== false) return false
    return true
  })

  // keep at least one column visible so the table never renders empty-headed
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

  // restore the default column selection inside the open modal
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
      nameKh: item.nameKh || '',
      type: item.type || '',
      values: item.values || '',
      active: item.active !== false,
    })
    setFormOpen(true)
  }

  // Code is optional: leave it blank and the backend assigns the next free
  // AT-#### automatically; a typed code must be unique (409 otherwise).
  const saveForm = async (e) => {
    e.preventDefault()
    const payload = {
      code: form.code.trim() || undefined,
      description: form.description.trim(),
      nameKh: form.nameKh.trim() || undefined,
      type: form.type.trim() || undefined,
      values: form.values.trim() || undefined,
      active: form.active,
    }
    try {
      if (form.id != null) await adminAttributeAPI.update(form.id, payload)
      else await adminAttributeAPI.create(payload)
      setFormOpen(false)
      refresh()
    } catch (err) {
      window.alert(err.message)
    }
  }

  const removeItem = async (item) => {
    if (!window.confirm(t('deleteConfirm', lang))) return
    try {
      await adminAttributeAPI.delete(item.id)
      refresh()
    } catch (err) {
      window.alert(err.message)
    }
  }

  // cell renderer per visible column key
  const renderCell = (item, key) => {
    switch (key) {
      case 'code':
        return <span className="font-mono font-semibold text-green-300">{item.code || '—'}</span>
      case 'description':
        return <span className="font-semibold text-slate-200">{item.description || '—'}</span>
      case 'nameKh':
        return <span className="text-slate-200">{item.nameKh || '—'}</span>
      case 'type':
        return item.type
          ? <Pill tone="green">{item.type}</Pill>
          : <span className="text-slate-200">—</span>
      case 'values':
        return <span className="text-slate-300">{item.values || '—'}</span>
      case 'active':
        return <Dot on={item.active !== false} />
      default:
        return null
    }
  }

  // shared dark select styling — green focus ring (matches Category)
  const selectCls = 'w-full rounded-lg border border-slate-700/70 bg-slate-950/60 px-3 py-2.5 text-sm font-medium text-white outline-none transition focus:border-green-400 focus:bg-slate-950 focus:ring-4 focus:ring-green-500/10 hover:border-slate-600'
  const ghostBtnCls = 'inline-flex items-center justify-center gap-2 rounded-lg border border-slate-700 px-3.5 py-2.5 text-xs font-bold text-slate-300 transition hover:border-slate-600 hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-40'

  return (
    <SectionShell
      icon="🧬"
      color="#ec4899"
      title={{ en: 'Attribute', kh: 'លក្ខណៈសម្បត្តិ' }}
      subtitle={T.subtitle}
      actions={<PrimaryButton onClick={openAdd}>{t('newBtn', lang)}</PrimaryButton>}
    >
      {loadError && (
        <p className="rounded-lg border border-red-500/40 bg-red-500/10 px-4 py-2 text-sm font-semibold text-red-300">
          {loadError}
        </p>
      )}

      {/* Data table card */}
      <section className="overflow-hidden rounded-2xl border border-slate-700/60 bg-slate-900/80 shadow-xl shadow-black/20">
        {/* Filter bar */}
        <div className="flex flex-col gap-3 border-b border-slate-700/60 p-4 lg:flex-row lg:items-center">
          {/* Search By dropdown */}
          <select
            value={searchBy}
            onChange={(e) => setSearchBy(e.target.value)}
            aria-label={t('searchByLabel', lang)}
            className={`${selectCls} w-full sm:w-auto sm:min-w-[170px]`}
          >
            <option value="code">{t('searchByLabel', lang)}: {t('byCode', lang)}</option>
            <option value="description">{t('searchByLabel', lang)}: {t('byDescription', lang)}</option>
            <option value="nameKh">{t('searchByLabel', lang)}: {t('bySecondLang', lang)}</option>
            <option value="type">{t('searchByLabel', lang)}: {t('byType', lang)}</option>
            <option value="values">{t('searchByLabel', lang)}: {t('byValues', lang)}</option>
          </select>

          {/* Search input */}
          <div className="relative min-w-0 flex-1">
            <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500"><SearchIcon /></span>
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
            <option value="all">{t('allAttributes', lang)}</option>
            <option value="active">{t('activeOnly', lang)}</option>
            <option value="inactive">{t('inactiveOnly', lang)}</option>
          </select>

          {/* Choose Column trigger */}
          <button type="button" onClick={openColModal} title={t('chooseColumn', lang)} className={ghostBtnCls}>
            <ColumnsIcon /> <span className="hidden xl:inline">{t('chooseColumn', lang)}</span>
          </button>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead>
              <tr className="border-b border-slate-700/60 bg-slate-800/40 text-xs font-bold uppercase tracking-wide text-slate-500">
                <th className="whitespace-nowrap px-4 py-3">{t('code', lang)}</th>
                <th className="whitespace-nowrap px-4 py-3">{t('description', lang)}</th>
                {COLUMN_DEFS.filter((col) => visibleCols.has(col.key)).map((col) => (
                  <th key={col.key} className="whitespace-nowrap px-4 py-3">{col.label[lang]}</th>
                ))}
                <th className="w-24 px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={3 + visibleCols.size} className="px-4 py-14 text-center">
                    <span className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-slate-800"><SearchIcon /></span>
                    <p className="text-sm text-slate-400">{items.length === 0 ? t('empty', lang) : t('noResults', lang)}</p>
                  </td>
                </tr>
              ) : (
                filtered.map((item) => (
                  <tr key={item.id} className="border-b border-slate-800/60 transition last:border-0 hover:bg-slate-800/40">
                    <td className="whitespace-nowrap px-4 py-3">{renderCell(item, 'code')}</td>
                    <td className="whitespace-nowrap px-4 py-3">{renderCell(item, 'description')}</td>
                    {COLUMN_DEFS.filter((col) => visibleCols.has(col.key)).map((col) => (
                      <td key={col.key} className="whitespace-nowrap px-4 py-3">{renderCell(item, col.key)}</td>
                    ))}
                    <td className="px-4 py-3">
                      <span className="flex items-center justify-end gap-2">
                        <GhostButton onClick={() => openEdit(item)}>{t('edit', lang)}</GhostButton>
                        <button
                          type="button"
                          onClick={() => removeItem(item)}
                          className="transition hover:scale-110"
                          style={{ color: ORANGE }}
                          aria-label={t('delete', lang)}
                          title={t('delete', lang)}
                        >
                          <TrashIcon />
                        </button>
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* Choose Column modal */}
      {showColModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
          onClick={() => setShowColModal(false)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-label={t('chooseColumn', lang)}
            className="w-full max-w-md overflow-hidden rounded-2xl border border-slate-700 bg-slate-900 shadow-2xl shadow-black/40"
            onClick={(e) => e.stopPropagation()}
          >
            {/* header */}
            <div className="flex items-center justify-between border-b border-slate-700/60 px-5 py-4">
              <h3 className="text-base font-extrabold text-white">{t('chooseColumn', lang)}</h3>
              <button
                type="button"
                onClick={() => setShowColModal(false)}
                aria-label={t('cancel', lang)}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 transition hover:bg-slate-800 hover:text-white"
              >
                <XSmallIcon />
              </button>
            </div>

            {/* checkbox grid — the entity columns (Code + Name are always shown) */}
            <div className="grid grid-cols-1 gap-x-6 gap-y-1 p-5 sm:grid-cols-2">
              {COLUMN_DEFS.map((col) => {
                const checked = colDraft.has(col.key)
                return (
                  <label
                    key={col.key}
                    className={`flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2 text-sm font-semibold transition ${checked ? 'text-white' : 'text-slate-400'} hover:bg-slate-800`}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggleColDraft(col.key)}
                      className="h-4 w-4 cursor-pointer rounded accent-green-500"
                    />
                    {col.label[lang]}
                  </label>
                )
              })}
            </div>

            {/* footer actions */}
            <div className="flex items-center justify-between gap-3 border-t border-slate-700/60 px-5 py-4">
              <button
                type="button"
                onClick={resetColumns}
                title={t('resetCols', lang)}
                className="inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-bold transition hover:bg-slate-800"
                style={{ color: ORANGE }}
              >
                <ResetIcon /> {t('resetCols', lang)}
              </button>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setShowColModal(false)}
                  className="rounded-lg border border-slate-700 px-5 py-2 text-sm font-bold text-slate-300 transition hover:bg-slate-800"
                >
                  {t('cancel', lang)}
                </button>
                <button
                  type="button"
                  onClick={applyColumns}
                  className="rounded-lg bg-green-500 px-5 py-2 text-sm font-black text-slate-950 shadow-md shadow-green-500/20 transition hover:bg-green-400"
                >
                  {t('apply', lang)}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <Modal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        title={form.id == null ? t('newTitle', lang) : t('editTitle', lang)}
      >
        <form onSubmit={saveForm}>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {/* Code — Auto-generated by the backend when left blank */}
            <Field label={t('code', lang)}>
              <div className="flex items-center gap-2">
                <TextInput value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} placeholder="AT-0001" />
                {!form.id && !form.code && (
                  <Pill tone="green">AUTO</Pill>
                )}
              </div>
              <span className="mt-1 block text-xs text-slate-500">{t('autoGenTitle', lang)}</span>
            </Field>

            <Field label={t('secondLang', lang)}>
              <TextInput
                value={form.nameKh}
                onChange={(e) => setForm({ ...form, nameKh: e.target.value })}
                placeholder={t('secondLangPlaceholder', lang)}
              />
            </Field>

            {/* Name — the required field (same role as Category's description) */}
            <Field label={t('description', lang)} required>
              <TextInput
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder={t('descPlaceholder', lang)}
              />
            </Field>

            <Field label={t('type', lang)}>
              <select
                value={form.type}
                onChange={(e) => setForm({ ...form, type: e.target.value })}
                className="w-full rounded-xl border border-slate-700/70 bg-slate-950/60 px-3 py-2.5 text-sm font-medium text-white outline-none transition focus:border-green-400 focus:bg-slate-950 focus:ring-4 focus:ring-green-500/10 hover:border-slate-600"
              >
                <option value="">{t('typePlaceholder', lang)}</option>
                {TYPE_OPTIONS.map((o) => <option key={o.v} value={o.v}>{o[lang]}</option>)}
              </select>
            </Field>

            <Field label={t('values', lang)}>
              <TextInput
                value={form.values}
                onChange={(e) => setForm({ ...form, values: e.target.value })}
                placeholder={t('valuesPlaceholder', lang)}
              />
              <span className="mt-1 block text-xs text-slate-500">{t('valuesHint', lang)}</span>
            </Field>
          </div>

          <div className="mt-4 flex flex-wrap gap-6">
            <ToggleSwitch
              checked={form.active}
              onChange={() => setForm({ ...form, active: !form.active })}
              label={t('active', lang)}
            />
          </div>

          <div className="mt-5 flex justify-end gap-3">
            <GhostButton onClick={() => setFormOpen(false)}>{t('cancel', lang)}</GhostButton>
            <PrimaryButton type="submit" disabled={!String(form.description).trim()}>
              {form.id == null ? t('create', lang) : t('save', lang)}
            </PrimaryButton>
          </div>
        </form>
      </Modal>
    </SectionShell>
  )
}

const EMPTY_FORM = { id: null, code: '', description: '', nameKh: '', type: '', values: '', active: true }

// Left/right slide toggle used for the Active tick box.
// A plain <span> wraps it (NOT <label>) — clicking a label around a button
// re-fires the click, toggling twice and cancelling the slide animation.
export const ToggleSwitch = ({ checked, onChange, label }) => (
  <span className="flex cursor-pointer select-none items-center gap-2.5" onClick={onChange}>
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      tabIndex={-1}
      className={`pointer-events-none relative block h-6 w-11 shrink-0 rounded-full transition-colors duration-200 ${
        checked ? 'bg-green-500' : 'bg-slate-700'
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

// Status dot shown in the table's Active column.
const Dot = ({ on }) => (
  <span
    className={`inline-block h-2.5 w-2.5 rounded-full ${on ? 'bg-green-400' : 'bg-slate-600'}`}
    title={on ? '✓' : '—'}
  />
)

/* ---------- icons ---------- */

const SearchIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
    <circle cx="11" cy="11" r="7" />
    <line x1="21" y1="21" x2="16.5" y2="16.5" />
  </svg>
)

const ColumnsIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <rect x="3" y="3" width="18" height="18" rx="2" />
    <line x1="9" y1="3" x2="9" y2="21" />
    <line x1="15" y1="3" x2="15" y2="21" />
  </svg>
)

const ResetIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
    <path d="M3 12a9 9 0 1 0 2.6-6.3L3 8" />
    <polyline points="3 3 3 8 8 8" />
  </svg>
)

const XSmallIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
)

const TrashIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <polyline points="3 6 5 6 21 6" />
    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2 2v2" />
    <line x1="10" y1="11" x2="10" y2="17" />
    <line x1="14" y1="11" x2="14" y2="17" />
  </svg>
)

export default Attributes
