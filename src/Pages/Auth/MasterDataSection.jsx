import { useState } from 'react'
import { useLanguage } from '../../context/LanguageContext'
import { useCollection } from './stockStore'
import { SectionShell, Field, TextInput, SelectInput, PrimaryButton, GhostButton, Modal, DataTable, ConfirmModal } from './stockUI'
import './MasterDataSection.css'

const ORANGE = '#FF9900'

// Shared header dictionary — every section picks the columns it shows.
const H = {
  name: { en: 'Name', kh: 'ឈ្មោះ' },
  code: { en: 'Code', kh: 'កូដ' },
  description: { en: 'Description', kh: 'ការពិពណ៌នា' },
  parent: { en: 'Parent', kh: 'ក្រុមធំ' },
  unit: { en: 'Base Unit', kh: 'ឯកតាដើម' },
  factorToPcs: { en: '1 Unit = (PCS)', kh: '១ ឯកតា = (ដុំ)' },
  type: { en: 'Type', kh: 'ប្រភេទ' },
  values: { en: 'Values', kh: 'តម្លៃ' },
  contact: { en: 'Contact Person', kh: 'ទំនាក់ទំនង' },
  phone: { en: 'Phone', kh: 'ទូរស័ព្ទ' },
  email: { en: 'Email', kh: 'អ៊ីមែល' },
  address: { en: 'Address', kh: 'អាសយដ្ឋាន' },
  terms: { en: 'Payment Terms', kh: 'លក្ខខណ្ឌទូទាត់' },
  members: { en: 'Members', kh: 'សមាជិក' },
}

// Per-section configuration: identity + which form fields/columns to render.
const CONFIG = {
  groups: {
    icon: '🗂️', color: '#14b8a6',
    title: { en: 'Product Groups', kh: 'ក្រុមផលិតផល' },
    subtitle: { en: 'Group related products together for pricing, discounting rules and reporting.', kh: 'បង្កុំប្រជុំផលិតផលទាក់ទងគ្នា សម្រាប់តម្លៃ បញ្ចុះតម្លៃ និងរបាយការណ៍។' },
    entity: { en: 'group', kh: 'ក្រុម' },
    fields: ['name', 'code', 'parent', 'description'],
    columns: ['name', 'code', 'parent', 'description'],
  },
  categories: {
    icon: '🏷️', color: '#f59e0b',
    title: { en: 'Category', kh: 'ប្រភេទ' },
    subtitle: { en: 'Manage the product categories shown across the shop.', kh: 'គ្រប់គ្រងប្រភេទផលិតផលដែលបង្ហាញក្នុងហាងទាំងមូល។' },
    entity: { en: 'category', kh: 'ប្រភេទ' },
    fields: ['name', 'code', 'parent', 'description'],
    columns: ['name', 'code', 'parent', 'description'],
  },
  brands: {
    icon: '🅰️', color: '#8b5cf6',
    title: { en: 'Brands', kh: 'ម៉ាក' },
    subtitle: { en: 'Register the brands carried by B\'Groceries.', kh: 'ចុះឈ្មោះម៉ាកទំនិញដែល B\'Groceries លក់។' },
    entity: { en: 'brand', kh: 'ម៉ាក' },
    fields: ['name', 'code', 'description'],
    columns: ['name', 'code', 'description'],
  },
  units: {
    icon: '⚖️', color: '#06b6d4',
    title: { en: 'Unit of Measure', kh: 'ឯកតាវាស់' },
    subtitle: { en: 'Define base units and conversion factors (e.g. 1 Box = 12 PCS).', kh: 'កំណត់ឯកតាដើម និងកត្តាបម្លែង (ឧ. ១ ប្រអប់ = ១២ ដុំ)។' },
    entity: { en: 'unit', kh: 'ឯកតា' },
    fields: ['name', 'code', 'factorToPcs', 'description'],
    columns: ['name', 'code', 'factorToPcs', 'description'],
  },
  attributes: {
    icon: '🧬', color: '#ec4899',
    title: { en: 'Attribute', kh: 'លក្ខណៈសម្បត្តិ' },
    subtitle: { en: 'Dynamic product variants like Size, Color or Flavor.', kh: 'លក្ខណៈសម្បត្តិផលិតផលដូចជា ទំហំ ពណ៌ ឬរសជាតិ។' },
    entity: { en: 'attribute', kh: 'លក្ខណៈសម្បត្តិ' },
    fields: ['name', 'type', 'values'],
    columns: ['name', 'type', 'values'],
    typeOptions: [
      { v: 'Text', en: 'Text', kh: 'អក្សរ' },
      { v: 'Number', en: 'Number', kh: 'លេខ' },
      { v: 'Color', en: 'Color', kh: 'ពណ៌' },
      { v: 'Size', en: 'Size', kh: 'ទំហំ' },
      { v: 'Flavor', en: 'Flavor', kh: 'រសជាតិ' },
    ],
  },
  suppliers: {
    icon: '🚛', color: '#22c55e',
    title: { en: 'Suppliers', kh: 'អ្នកផ្គត់ផ្គង់' },
    subtitle: { en: 'Vendor records with contacts and payment terms for purchasing.', kh: 'កំណត់ត្រាអ្នកផ្គត់ផ្គង់ ទំនាក់ទំនង និងលក្ខខណ្ឌទូទាត់។' },
    entity: { en: 'supplier', kh: 'អ្នកផ្គត់ផ្គង់' },
    fields: ['name', 'code', 'contact', 'phone', 'email', 'address', 'terms'],
    columns: ['name', 'contact', 'phone', 'terms'],
  },
  'supplier-groups': {
    icon: '👥', color: '#0ea5e9',
    title: { en: 'Suppliers Group', kh: 'ក្រុមអ្នកផ្គត់ផ្គង់' },
    subtitle: { en: 'Organize suppliers into groups for reporting and terms.', kh: 'រៀបចំអ្នកផ្គត់ផ្គង់ជាក្រុម សម្រាប់របាយការណ៍ និងលក្ខខណ្ឌ។' },
    entity: { en: 'supplier group', kh: 'ក្រុមអ្នកផ្គត់ផ្គង់' },
    fields: ['name', 'code', 'members', 'note'],
    columns: ['name', 'code', 'members'],
  },
}

const blankForm = (fields) => Object.fromEntries(fields.map((f) => [f, '']))

export const MasterDataSection = ({ sectionKey }) => {
  const { lang } = useLanguage()
  const cfg = CONFIG[sectionKey]
  const [items, itemApi] = useCollection(`md-${sectionKey}`)
  const [formOpen, setFormOpen] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [form, setForm] = useState(() => blankForm(cfg ? cfg.fields : []))
  const [query, setQuery] = useState('')

  const [confirmAction, setConfirmAction] = useState(null)
  if (!cfg) return null

  const filtered = items.filter((it) => JSON.stringify(it).toLowerCase().includes(query.toLowerCase()))

  const openAdd = () => {
    setEditingId(null)
    setForm(blankForm(cfg.fields))
    setFormOpen(true)
  }

  const openEdit = (item) => {
    setEditingId(item.id)
    setForm({ ...blankForm(cfg.fields), ...Object.fromEntries(cfg.fields.map((f) => [f, item[f] ?? ''])) })
    setFormOpen(true)
  }

  const saveForm = () => {
    if (!String(form.name || '').trim()) return
    if (editingId != null) itemApi.update(editingId, form)
    else itemApi.add(form)
    setFormOpen(false)
  }

  const promptSaveForm = () => {
    if (!String(form.name || '').trim()) return
    const label = lang === 'en' ? cfg.entity.en : cfg.entity.kh
    setConfirmAction({
      title: editingId == null
        ? { en: `Create New ${cfg.entity.en}`, kh: `បង្កើត ${cfg.entity.kh} ថ្មី` }
        : { en: `Save Changes to ${cfg.entity.en}`, kh: `រក្សាទុកការផ្លាស់ប្តូរ ${cfg.entity.kh}` },
      message: {
        en: `Are you sure you want to save "${form.name}"?`,
        kh: `តើអ្នកពិតជាចង់រក្សាទុក "${form.name}" (${label}) មែនទេ?`,
      },
      confirmText: { en: 'Confirm & Save', kh: 'យល់ព្រមរក្សាទុក' },
      cancelText: { en: 'Cancel', kh: 'បោះបង់' },
      type: 'save',
      onConfirm: saveForm,
    })
  }

  const promptRemoveItem = (item) => {
    const label = lang === 'en' ? cfg.entity.en : cfg.entity.kh
    setConfirmAction({
      title: { en: `Delete ${cfg.entity.en}`, kh: `លុប ${cfg.entity.kh}` },
      message: {
        en: `Are you sure you want to delete "${item.name}"? This action cannot be undone.`,
        kh: `តើអ្នកពិតជាចង់លុប "${item.name}" (${label}) មែនទេ? សកម្មភាពនេះមិនអាចត្រឡប់វិញបានទេ។`,
      },
      confirmText: { en: 'Confirm Delete', kh: 'យល់ព្រមលុប' },
      cancelText: { en: 'Cancel', kh: 'បោះបង់' },
      type: 'danger',
      onConfirm: () => itemApi.remove(item.id),
    })
  }

  const t = (en, kh) => (lang === 'en' ? en : kh)

  return (
    <SectionShell
      icon={cfg.icon}
      color={cfg.color}
      title={cfg.title}
      subtitle={cfg.subtitle}
      actions={
        <PrimaryButton onClick={openAdd}>
          + {lang === 'en' ? `New ${cfg.entity.en}` : `${cfg.entity.kh}ថ្មី`}
        </PrimaryButton>
      }
    >
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

      <div className="max-w-sm">
        <TextInput placeholder={t('Search…', 'ស្វែងរក…')} value={query} onChange={(e) => setQuery(e.target.value)} />
      </div>

      <DataTable
        headers={[...cfg.columns.map((c) => H[c]?.[lang] || c), t('Actions', 'សកម្មភាព')]}
        rows={filtered.map((item) => ({
          id: item.id,
          cells: [
            ...cfg.columns.map((col) => (
              <span key={col} className="text-slate-200">{item[col] || '—'}</span>
            )),
            <span key="act" className="flex items-center justify-end gap-2">
              <GhostButton onClick={() => openEdit(item)}>{t('Edit', 'កែ')}</GhostButton>
              <button
                type="button"
                onClick={() => promptRemoveItem(item)}
                className="transition hover:scale-110"
                style={{ color: ORANGE }}
                aria-label={t('Delete', 'លុប')}
                title={t('Delete', 'លុប')}
              >
                <TrashIcon />
              </button>
            </span>,
          ],
        }))}
        emptyText={{ en: 'Nothing here yet — create your first record.', kh: 'មិនទាន់មានទិន្នន័យទេ — បង្កើតជួរដេកដំបូងរបស់អ្នក។' }}
        emptyIcon={cfg.icon}
      />

      <Modal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        title={editingId == null
          ? t(`New ${cfg.entity.en}`, `${cfg.entity.kh}ថ្មី`)
          : t(`Edit ${cfg.entity.en}`, `កែ${cfg.entity.kh}`)}
      >
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {cfg.fields.map((f) => (
            <Field key={f} label={H[f]?.[lang] || f} required={f === 'name'}>
              {/* attribute "type" gets a dropdown; everything else is text */}
              {f === 'type' && cfg.typeOptions ? (
                <SelectInput value={form[f]} onChange={(e) => setForm({ ...form, [f]: e.target.value })}>
                  <option value="">{t('Select…', 'ជ្រើសរើស…')}</option>
                  {cfg.typeOptions.map((o) => <option key={o.v} value={o.v}>{o[lang]}</option>)}
                </SelectInput>
              ) : f === 'values' ? (
                <TextInput
                  value={form[f]}
                  onChange={(e) => setForm({ ...form, [f]: e.target.value })}
                  placeholder={t('Small, Medium, Large', 'តូច, មធ្យម, ធំ')}
                />
              ) : (
                <TextInput value={form[f]} onChange={(e) => setForm({ ...form, [f]: e.target.value })} />
              )}
            </Field>
          ))}
        </div>
        <div className="mt-5 flex justify-end gap-3">
          <GhostButton onClick={() => setFormOpen(false)}>{t('Cancel', 'បោះបង់')}</GhostButton>
          <PrimaryButton onClick={promptSaveForm} disabled={!String(form.name || '').trim()}>
            {t('Save', 'រក្សាទុក')}
          </PrimaryButton>
        </div>
      </Modal>
    </SectionShell>
  )
}

const TrashIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <polyline points="3 6 5 6 21 6" />
    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
    <line x1="10" y1="11" x2="10" y2="17" />
    <line x1="14" y1="11" x2="14" y2="17" />
  </svg>
)

export default MasterDataSection
