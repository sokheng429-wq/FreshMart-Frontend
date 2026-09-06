import React, { useState, useEffect } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useLanguage } from '../../context/LanguageContext'
import { useNotifications } from '../../context/NotificationContext'
import { adminCustomerGroupAPI } from '../../api/api'
import { SectionShell, Field, TextInput, PrimaryButton, GhostButton } from './stockUI'

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

export const CustomerGroupForm = () => {
  const { lang } = useLanguage()
  const { addNotification } = useNotifications()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const groupId = searchParams.get('id')
  const isEdit = Boolean(groupId)

  const [formData, setFormData] = useState({
    code: '',
    description: '',
    secondLanguage: '',
    active: true,
  })

  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)

  const t = {
    en: {
      dashboard: 'Dashboard',
      saleDashboard: 'Sale Dashboard',
      customerGroups: 'Customer Groups',
      subtitle: 'Add, view and edit your customer group all in one place',
      cancel: 'Cancel',
      save: 'Save',
      create: 'Create Customer Group',
      edit: 'Edit Customer Group',
      generalInfo: 'General Information',
      code: 'Code',
      autoCodeHint: 'Leave blank to auto-generate sequence (CG-0001) — or enter custom code',
      description: 'Description',
      descriptionPlaceholder: 'e.g. Wholesale B2B Partner, VIP Retail',
      secondLanguage: 'Second Language',
      secondLanguagePlaceholder: 'ឧ. ដៃគូលក់ដុំ B2B, អតិថិជន VIP',
      active: 'Active',
      descRequired: 'Description is required',
      createSuccess: 'Customer group created successfully',
      updateSuccess: 'Customer group updated successfully',
      saveFailed: 'Failed to save customer group',
    },
    kh: {
      dashboard: 'ផ្ទាំងគ្រប់គ្រង',
      saleDashboard: 'ផ្ទាំងលក់',
      customerGroups: 'ក្រុមអតិថិជន',
      subtitle: 'បន្ថែម មើល និងកែប្រែក្រុមអតិថិជនរបស់អ្នកនៅកន្លែងតែមួយ',
      cancel: 'បោះបង់',
      save: 'រក្សាទុក',
      create: 'បង្កើតក្រុមអតិថិជន',
      edit: 'កែប្រែក្រុមអតិថិជន',
      generalInfo: 'ព័ត៌មានទូទៅ',
      code: 'កូដ',
      autoCodeHint: 'ទុកចំហដើម្បីបង្កើតកូដបន្ទាប់ដោយស្វ័យប្រវត្តិ (CG-0001) — ឬបញ្ចូលកូដផ្ទាល់ខ្លួន',
      description: 'ការពិពណ៌នា',
      descriptionPlaceholder: 'ឧ. ដៃគូលក់ដុំ B2B, អតិថិជន VIP',
      secondLanguage: 'ភាសាទី២',
      secondLanguagePlaceholder: 'ឧ. ដៃគូលក់ដុំ B2B, អតិថិជន VIP',
      active: 'សកម្ម',
      descRequired: 'សូមបញ្ចូលការពិពណ៌នា',
      createSuccess: 'បានបង្កើតក្រុមអតិថិជនដោយជោគជ័យ',
      updateSuccess: 'បានធ្វើបច្ចុប្បន្នភាពក្រុមអតិថិជនដោយជោគជ័យ',
      saveFailed: 'បរាជ័យក្នុងការរក្សាទុកក្រុមអតិថិជន',
    },
  }[lang]

  useEffect(() => {
    if (groupId) {
      setLoading(true)
      adminCustomerGroupAPI
        .getById(groupId)
        .then((res) => {
          const g = res?.data ?? res
          if (g) {
            setFormData({
              code: g.code || '',
              description: g.description || '',
              secondLanguage: g.secondLanguage || '',
              active: g.active !== false,
            })
          }
        })
        .catch((err) => {
          console.error('Failed to load group:', err)
        })
        .finally(() => setLoading(false))
    }
  }, [groupId])

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!formData.description.trim()) {
      alert(t.descRequired)
      return
    }

    setSaving(true)
    const payload = {
      code: formData.code.trim() || undefined,
      description: formData.description.trim(),
      secondLanguage: formData.secondLanguage.trim() || undefined,
      active: formData.active !== false,
    }

    try {
      if (isEdit) {
        await adminCustomerGroupAPI.update(groupId, payload)
        addNotification({
          type: 'success',
          title: t.updateSuccess,
        })
      } else {
        await adminCustomerGroupAPI.create(payload)
        addNotification({
          type: 'success',
          title: t.createSuccess,
        })
      }
      navigate('/admin/sale-dashboard/customer-groups')
    } catch (err) {
      console.error('Save error:', err)
      alert(err.message || t.saveFailed)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6 max-w-3xl" style={{ fontFamily: 'Montserrat, sans-serif' }}>
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-slate-800 pb-5">
        <div>
          <Link
            to="/admin/sale-dashboard/customer-groups"
            className="mb-2 inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-[0.16em] text-green-400 transition hover:text-green-300"
          >
            ← {t.customerGroups}
          </Link>
          <div className="flex items-center gap-3">
            <span
              className="flex h-12 w-12 items-center justify-center rounded-2xl p-1.5 shadow-lg shadow-black/20 ring-1 ring-white/10"
              style={{ background: 'rgba(20, 184, 166, 0.2)' }}
            >
              <span className="text-2xl">👥</span>
            </span>
            <h1 className="text-2xl font-extrabold tracking-tight text-white md:text-3xl">
              {isEdit ? t.edit : t.create}
            </h1>
          </div>
          <p className="mt-1 text-sm text-slate-400">{t.subtitle}</p>
        </div>

        <div className="flex items-center gap-2.5">
          <GhostButton onClick={() => navigate('/admin/sale-dashboard/customer-groups')}>
            {t.cancel}
          </GhostButton>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={saving || loading}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-green-500 px-5 py-2.5 text-sm font-black text-slate-950 shadow-lg shadow-green-500/20 transition hover:-translate-y-0.5 hover:bg-green-400 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {saving ? (
              <>
                <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-slate-950 border-t-transparent" />
                <span>{lang === 'en' ? 'Saving…' : 'កំពុងរក្សាទុក…'}</span>
              </>
            ) : (
              <span>{t.save}</span>
            )}
          </button>
        </div>
      </div>

      {/* Form Card */}
      <form
        onSubmit={handleSubmit}
        className="rounded-2xl border border-slate-700/60 bg-slate-900/80 p-6 shadow-xl backdrop-blur-md space-y-5"
      >
        <Field label={t.code}>
          <TextInput
            value={formData.code}
            onChange={(e) => setFormData({ ...formData, code: e.target.value })}
            placeholder={t.autoCodeHint}
          />
          <span className="text-[11px] text-slate-400">{t.autoCodeHint}</span>
        </Field>

        <Field label={t.description} required>
          <TextInput
            required
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            placeholder={t.descriptionPlaceholder}
            autoFocus
          />
        </Field>

        <Field label={t.secondLanguage}>
          <TextInput
            value={formData.secondLanguage}
            onChange={(e) => setFormData({ ...formData, secondLanguage: e.target.value })}
            placeholder={t.secondLanguagePlaceholder}
          />
        </Field>

        <div className="pt-2">
          <ToggleSwitch
            checked={formData.active}
            onChange={() => setFormData({ ...formData, active: !formData.active })}
            label={t.active}
          />
        </div>

        <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-slate-800">
          <GhostButton onClick={() => navigate('/admin/sale-dashboard/customer-groups')} disabled={saving}>
            {t.cancel}
          </GhostButton>
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-green-500 px-5 py-2.5 text-sm font-black text-slate-950 shadow-lg shadow-green-500/20 transition hover:-translate-y-0.5 hover:bg-green-400 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {saving ? (
              <>
                <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-slate-950 border-t-transparent" />
                <span>{lang === 'en' ? 'Saving…' : 'កំពុងរក្សាទុក…'}</span>
              </>
            ) : (
              <span>{t.save}</span>
            )}
          </button>
        </div>
      </form>
    </div>
  )
}

export default CustomerGroupForm
