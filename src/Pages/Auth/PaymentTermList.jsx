import React, { useState, useEffect, useMemo, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { useLanguage } from '../../context/LanguageContext'
import { useNotifications } from '../../context/NotificationContext'
import { adminPaymentTermAPI } from '../../api/api'
import calendarIcon from '../../assets/icon/3dicons-calendar-dynamic-color.png'
import './ProductsHub.css'

// Available columns for Choose Column modal & table
const ALL_COLUMNS = [
  { key: 'code', label: { en: 'Code', kh: 'លេខកូដ' }, always: true },
  { key: 'description', label: { en: 'Description', kh: 'ការពិពណ៌នា' }, always: true },
  { key: 'secondLanguage', label: { en: 'Second Language', kh: 'ភាសាទីពីរ' } },
  { key: 'days', label: { en: 'Day(s)', kh: 'ចំនួនថ្ងៃ' }, always: true },
  { key: 'active', label: { en: 'Active', kh: 'ស្ថានភាព' }, always: true },
  { key: 'note', label: { en: 'Note', kh: 'កំណត់ចំណាំ' } },
]

const DEFAULT_VISIBLE = [
  'code',
  'description',
  'secondLanguage',
  'days',
  'active',
  'note',
]

export default function PaymentTermList() {
  const { lang } = useLanguage()
  const { addNotification } = useNotifications()

  // State - starts empty until user creates or fetches data
  const [terms, setTerms] = useState([])
  const [loading, setLoading] = useState(true)

  // Search Payment Term State
  const [searchText, setSearchText] = useState('')
  // Search By: Any - Code - Description - Day
  const [searchBy, setSearchBy] = useState('any')
  // Status: Active - All - Inactive (default All so all terms are visible)
  const [statusFilter, setStatusFilter] = useState('ALL')

  // Choose Column Modal State
  const [chooseColumnOpen, setChooseColumnOpen] = useState(false)
  const [visibleColumns, setVisibleColumns] = useState(DEFAULT_VISIBLE)

  // Modal State: Create / Edit
  const [modalOpen, setModalOpen] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [saving, setSaving] = useState(false)

  // Form State: General Information
  const [formData, setFormData] = useState({
    code: 'Auto Generate Code',
    active: true,
    description: '',
    secondLanguage: '',
    days: 0,
    note: '',
  })

  // Load payment terms from backend
  const loadTerms = useCallback(async () => {
    setLoading(true)
    try {
      const params = {}
      if (searchText.trim()) params.search = searchText.trim()
      if (searchBy && searchBy !== 'any') params.searchBy = searchBy
      if (statusFilter && statusFilter !== 'ALL') params.status = statusFilter

      const res = await adminPaymentTermAPI.getAll(params)
      const data = res?.data != null ? res.data : (Array.isArray(res) ? res : [])
      if (Array.isArray(data)) {
        setTerms(data)
      }
    } catch {
      // Keep current state on error
    } finally {
      setLoading(false)
    }
  }, [searchText, searchBy, statusFilter])

  // Initial load
  useEffect(() => {
    loadTerms()
  }, [loadTerms])

  // Filtered terms displayed in table (with client-side fallback)
  const displayedTerms = useMemo(() => {
    let list = terms

    // Status filter: Active, All, Inactive
    if (statusFilter === 'ACTIVE') {
      list = list.filter((t) => t.active === true)
    } else if (statusFilter === 'INACTIVE') {
      list = list.filter((t) => t.active === false)
    }

    // Search text & Search by
    const q = searchText.trim().toLowerCase()
    if (q) {
      list = list.filter((t) => {
        const code = (t.code || '').toLowerCase()
        const desc = (t.description || '').toLowerCase()
        const sec = (t.secondLanguage || '').toLowerCase()
        const dayStr = String(t.days != null ? t.days : '')
        const note = (t.note || '').toLowerCase()

        switch (searchBy) {
          case 'code':
            return code.includes(q)
          case 'description':
            return desc.includes(q) || sec.includes(q)
          case 'day':
            return dayStr.includes(q)
          case 'any':
          default:
            return (
              code.includes(q) ||
              desc.includes(q) ||
              sec.includes(q) ||
              dayStr.includes(q) ||
              note.includes(q)
            )
        }
      })
    }

    // Sort by days ascending
    return [...list].sort((a, b) => {
      const dayA = a.days != null ? Number(a.days) : 0
      const dayB = b.days != null ? Number(b.days) : 0
      if (dayA !== dayB) return dayA - dayB
      return (a.code || '').localeCompare(b.code || '')
    })
  }, [terms, statusFilter, searchText, searchBy])

  // Open Create Modal
  const openCreateModal = async () => {
    setEditingId(null)
    try {
      const res = await adminPaymentTermAPI.getNextCode()
      const nextCode = res?.data || res || 'Auto Generate Code'
      setFormData({
        code: nextCode,
        active: true,
        description: '',
        secondLanguage: '',
        days: 30,
        note: '',
      })
    } catch {
      setFormData({
        code: 'Auto Generate Code',
        active: true,
        description: '',
        secondLanguage: '',
        days: 30,
        note: '',
      })
    }
    setModalOpen(true)
  }

  // Open Edit Modal
  const openEditModal = (term) => {
    setEditingId(term.id)
    setFormData({
      code: term.code || '',
      active: term.active !== false,
      description: term.description || '',
      secondLanguage: term.secondLanguage || '',
      days: term.days != null ? term.days : 0,
      note: term.note || '',
    })
    setModalOpen(true)
  }

  // Save (Create or Update) Payment Term
  const handleSaveTerm = async (e) => {
    e.preventDefault()

    if (!formData.description.trim()) {
      addNotification?.('Please enter Description for the payment term.', 'warning')
      return
    }

    if (formData.days === '' || formData.days == null || Number(formData.days) < 0) {
      addNotification?.('Please enter a valid number of days (e.g. 0, 7, 15, 30).', 'warning')
      return
    }

    setSaving(true)
    const newCode =
      formData.code && formData.code !== 'Auto Generate Code'
        ? formData.code.trim().toUpperCase()
        : `PT-${Date.now().toString().slice(-4)}`

    const payload = {
      code: newCode,
      description: formData.description.trim(),
      secondLanguage: formData.secondLanguage.trim(),
      days: Number(formData.days),
      active: Boolean(formData.active),
      note: formData.note.trim(),
    }

    // Optimistic record for immediate visual display
    const optimisticRecord = {
      id: editingId || Date.now(),
      ...payload,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    try {
      if (editingId) {
        const res = await adminPaymentTermAPI.update(editingId, payload)
        const updated = res?.data || res || optimisticRecord
        setTerms((prev) => prev.map((t) => (t.id === editingId ? { ...t, ...updated } : t)))
        addNotification?.(`Payment term ${payload.code} updated successfully!`, 'success')
      } else {
        const res = await adminPaymentTermAPI.create(payload)
        const created = res?.data || res || optimisticRecord
        setTerms((prev) => [created, ...prev.filter((t) => t.code !== created.code)])
        addNotification?.(`Payment term ${payload.code} created successfully!`, 'success')
      }
      setModalOpen(false)
      loadTerms()
    } catch {
      // Offline / optimistic update fallback
      if (editingId) {
        setTerms((prev) => prev.map((t) => (t.id === editingId ? { ...t, ...optimisticRecord } : t)))
        addNotification?.(`Payment term ${payload.code} updated locally!`, 'info')
      } else {
        setTerms((prev) => [optimisticRecord, ...prev.filter((t) => t.code !== optimisticRecord.code)])
        addNotification?.(`Payment term ${payload.code} saved locally!`, 'info')
      }
      setModalOpen(false)
    } finally {
      setSaving(false)
    }
  }

  // Toggle Active Status
  const handleToggleActive = async (term) => {
    const newActive = !term.active
    try {
      await adminPaymentTermAPI.updateStatus(term.id, newActive)
      setTerms((prev) =>
        prev.map((t) => (t.id === term.id ? { ...t, active: newActive } : t))
      )
      addNotification?.(
        `Payment term ${term.code} set to ${newActive ? 'Active' : 'Inactive'}`,
        'success'
      )
    } catch {
      setTerms((prev) =>
        prev.map((t) => (t.id === term.id ? { ...t, active: newActive } : t))
      )
      addNotification?.(
        `Payment term ${term.code} set to ${newActive ? 'Active' : 'Inactive'} locally`,
        'info'
      )
    }
  }

  // Delete Payment Term
  const handleDeleteTerm = async (id, code) => {
    if (!window.confirm(`Are you sure you want to delete Payment Term ${code}?`)) return
    try {
      await adminPaymentTermAPI.delete(id)
      setTerms((prev) => prev.filter((t) => t.id !== id && t.code !== code))
      addNotification?.(`Payment term ${code} deleted`, 'success')
      loadTerms()
    } catch {
      setTerms((prev) => prev.filter((t) => t.id !== id && t.code !== code))
      addNotification?.('Payment term removed locally', 'info')
    }
  }

  // Toggle Column Visibility
  const toggleColumn = (colKey) => {
    const colDef = ALL_COLUMNS.find((c) => c.key === colKey)
    if (colDef?.always) return
    setVisibleColumns((prev) =>
      prev.includes(colKey) ? prev.filter((k) => k !== colKey) : [...prev, colKey]
    )
  }

  const handleSelectAllColumns = () => {
    setVisibleColumns(ALL_COLUMNS.map((c) => c.key))
  }

  const handleClearColumns = () => {
    setVisibleColumns(ALL_COLUMNS.filter((c) => c.always).map((c) => c.key))
  }

  return (
    <div className="space-y-6 text-slate-100" style={{ fontFamily: 'Montserrat, sans-serif' }}>
      {/* 1. HERO BANNER */}
      <section className="relative overflow-hidden rounded-3xl border border-amber-500/20 bg-gradient-to-br from-[#1e1b15] via-[#14120e] to-[#0a0907] p-5 sm:p-7 shadow-2xl shadow-amber-500/10">
        <div className="pointer-events-none absolute -right-16 -top-20 h-64 w-64 rounded-full bg-amber-500/15 blur-3xl" />
        <div className="pointer-events-none absolute bottom-0 left-1/4 h-px w-2/3 bg-gradient-to-r from-transparent via-amber-500/40 to-transparent" />

        <div className="relative flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-3">
            <Link
              to="/admin/sale-payment"
              className="inline-flex items-center gap-2 rounded-full border border-slate-700/80 bg-slate-950/60 px-3.5 py-1.5 text-xs font-bold uppercase tracking-[0.18em] text-amber-400 transition hover:border-amber-400 hover:text-white active:scale-95"
            >
              <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <path d="M15 19l-7-7 7-7" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              {lang === 'en' ? 'Sale Payment Hub' : 'ផ្ទាំងគ្រប់គ្រងទូទាត់លក់'}
            </Link>

            <div className="flex items-center gap-3.5">
              <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-amber-500/15 p-2 ring-1 ring-amber-500/30 shadow-lg shadow-amber-500/20">
                <img src={calendarIcon} alt="" className="h-9 w-9 object-contain drop-shadow-md" />
              </span>
              <div>
                <p className="text-[11px] font-black uppercase tracking-[0.25em] text-amber-400">
                  {lang === 'en' ? 'Payment Term Configuration' : 'ការកំណត់លក្ខខណ្ឌទូទាត់'}
                </p>
                <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
                  {lang === 'en' ? 'Payment Term' : 'លក្ខខណ្ឌនៃការទូទាត់'}
                </h1>
              </div>
            </div>

            <p className="max-w-2xl text-xs sm:text-sm leading-relaxed text-slate-300">
              {lang === 'en'
                ? 'Define credit periods (COD, Net 15, Net 30, Net 60), settlement due days, and payment conditions for customer sales.'
                : 'កំណត់រយៈពេលឥណទាន (COD, Net 15, Net 30, Net 60) ចំនួនថ្ងៃទូទាត់ និងលក្ខខណ្ឌទូទាត់សម្រាប់ការលក់។'}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={openCreateModal}
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 px-5 py-2.5 text-xs font-black uppercase tracking-wider text-white shadow-lg shadow-amber-500/25 transition hover:brightness-110 active:scale-95"
            >
              <span className="text-base leading-none">+</span>
              <span>{lang === 'en' ? 'New Payment Term' : 'បង្កើតលក្ខខណ្ឌថ្មី'}</span>
            </button>
          </div>
        </div>
      </section>

      {/* 2. SEARCH PAYMENT TERM SECTION */}
      <section className="rounded-3xl border border-slate-800 bg-slate-900/80 p-5 sm:p-6 shadow-xl shadow-black/20 space-y-4">
        <div className="flex items-center gap-3 pb-3 border-b border-slate-800/80">
          <div className="h-5 w-1.5 rounded-full bg-amber-500" />
          <h2 className="text-base font-bold text-white font-['Montserrat']">
            {lang === 'en' ? 'Search Payment Term' : 'ស្វែងរកលក្ខខណ្ឌទូទាត់'}
          </h2>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-12">
          {/* Search - Textbox */}
          <div className="sm:col-span-5 md:col-span-6">
            <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
              {lang === 'en' ? 'Search' : 'ស្វែងរក'}
            </label>
            <div className="relative">
              <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 text-xs">
                🔍
              </span>
              <input
                type="text"
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && loadTerms()}
                placeholder={
                  lang === 'en'
                    ? 'Search payment term by code, description, days...'
                    : 'ស្វែងរកតាមលេខកូដ ការពិពណ៌នា ចំនួនថ្ងៃ...'
                }
                className="w-full rounded-xl border border-slate-700/80 bg-slate-950/90 py-2 pl-9 pr-4 text-xs font-semibold text-white placeholder-slate-500 outline-none transition focus:border-amber-400 focus:ring-2 focus:ring-amber-400/20"
              />
              {searchText && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchText('')
                    setTimeout(loadTerms, 0)
                  }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white text-xs"
                >
                  ✕
                </button>
              )}
            </div>
          </div>

          {/* Search by - Dropdown: Any - Code - Description - Day */}
          <div className="sm:col-span-3 md:col-span-2">
            <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
              {lang === 'en' ? 'Search by' : 'ស្វែងរកតាម'}
            </label>
            <select
              value={searchBy}
              onChange={(e) => setSearchBy(e.target.value)}
              className="w-full rounded-xl border border-slate-700/80 bg-slate-950/90 py-2 px-3 text-xs font-semibold text-white outline-none transition focus:border-amber-400 focus:ring-2 focus:ring-amber-400/20"
            >
              <option value="any">{lang === 'en' ? 'Any' : 'ទាំងអស់'}</option>
              <option value="code">{lang === 'en' ? 'Code' : 'លេខកូដ'}</option>
              <option value="description">{lang === 'en' ? 'Description' : 'ការពិពណ៌នា'}</option>
              <option value="day">{lang === 'en' ? 'Day' : 'ចំនួនថ្ងៃ'}</option>
            </select>
          </div>

          {/* Status - Dropdown: Active - All - Inactive */}
          <div className="sm:col-span-2 md:col-span-2">
            <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
              {lang === 'en' ? 'Status' : 'ស្ថានភាព'}
            </label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full rounded-xl border border-slate-700/80 bg-slate-950/90 py-2 px-3 text-xs font-semibold text-white outline-none transition focus:border-amber-400 focus:ring-2 focus:ring-amber-400/20"
            >
              <option value="ACTIVE">{lang === 'en' ? 'Active' : 'សកម្ម'}</option>
              <option value="ALL">{lang === 'en' ? 'All' : 'ទាំងអស់'}</option>
              <option value="INACTIVE">{lang === 'en' ? 'Inactive' : 'អសកម្ម'}</option>
            </select>
          </div>

          {/* Search Button */}
          <div className="sm:col-span-2 flex items-end">
            <button
              type="button"
              onClick={loadTerms}
              className="w-full rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 hover:brightness-110 py-2 px-4 text-xs font-bold text-white transition active:scale-95 shadow-md shadow-amber-600/20"
            >
              {lang === 'en' ? 'Search' : 'ស្វែងរក'}
            </button>
          </div>
        </div>
      </section>

      {/* 3. PAYMENT TERM TABLE SECTION */}
      <section className="rounded-3xl border border-slate-800 bg-slate-900/80 p-5 sm:p-6 shadow-xl shadow-black/20 space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between pb-3 border-b border-slate-800/80">
          <div className="flex items-center gap-3">
            <div className="h-5 w-1.5 rounded-full bg-amber-500" />
            <div>
              <h2 className="text-base font-bold text-white font-['Montserrat']">
                {lang === 'en' ? 'Payment Term List' : 'បញ្ជីលក្ខខណ្ឌនៃការទូទាត់'}
              </h2>
              <p className="text-[11px] text-slate-400">
                {lang === 'en'
                  ? 'Configure payment periods and terms assigned to invoices and quotations.'
                  : 'កំណត់រយៈពេលទូទាត់ និងលក្ខខណ្ឌដែលត្រូវប្រើលើវិក័យប័ត្រ និងតារាងតម្លៃ។'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Choose Column Button */}
            <button
              type="button"
              onClick={() => setChooseColumnOpen(true)}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-950/80 px-3.5 py-1.5 text-xs font-bold text-slate-300 hover:border-amber-400 hover:text-white transition active:scale-95"
            >
              <span>⚙️</span>
              <span>{lang === 'en' ? 'Choose Column' : 'ជ្រើសរើសជួរឈរ'}</span>
            </button>

            {/* Create Button */}
            <button
              type="button"
              onClick={openCreateModal}
              className="inline-flex items-center gap-1.5 rounded-xl bg-amber-600 hover:bg-amber-500 px-4 py-1.5 text-xs font-bold text-white transition active:scale-95 shadow-md shadow-amber-600/25"
            >
              <span>+</span>
              <span>{lang === 'en' ? 'Create' : 'បង្កើត'}</span>
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto rounded-2xl border border-slate-800">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950/90 text-[11px] uppercase tracking-wider text-slate-400 font-bold border-b border-slate-800">
              <tr>
                {visibleColumns.includes('code') && <th className="py-3 px-3.5">Code</th>}
                {visibleColumns.includes('description') && <th className="py-3 px-3.5">Description</th>}
                {visibleColumns.includes('secondLanguage') && <th className="py-3 px-3.5">Second Language</th>}
                {visibleColumns.includes('days') && <th className="py-3 px-3.5 text-center">Day(s)</th>}
                {visibleColumns.includes('active') && <th className="py-3 px-3.5 text-center">Active</th>}
                {visibleColumns.includes('note') && <th className="py-3 px-3.5">Note</th>}
                <th className="py-3 px-3.5 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80 bg-slate-900/40">
              {loading && terms.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-500 font-mono">
                    <span className="inline-block animate-spin mr-2">🌀</span>
                    {lang === 'en' ? 'Loading payment terms...' : 'កំពុងផ្ទុកទិន្នន័យ...'}
                  </td>
                </tr>
              ) : displayedTerms.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-500 space-y-2">
                    <div className="text-3xl">📅</div>
                    <p className="font-semibold">
                      {lang === 'en' ? 'No payment terms found' : 'មិនមានលក្ខខណ្ឌទូទាត់ឡើយ'}
                    </p>
                    <button
                      type="button"
                      onClick={openCreateModal}
                      className="inline-flex items-center gap-1.5 rounded-lg bg-amber-600/30 border border-amber-500/40 px-3 py-1 text-xs font-bold text-amber-300 hover:bg-amber-600/50 transition"
                    >
                      + {lang === 'en' ? 'Create Payment Term' : 'បង្កើតលក្ខខណ្ឌទូទាត់'}
                    </button>
                  </td>
                </tr>
              ) : (
                displayedTerms.map((t) => (
                  <tr key={t.id || t.code} className="hover:bg-slate-800/50 transition">
                    {/* Code */}
                    {visibleColumns.includes('code') && (
                      <td className="py-3 px-3.5 font-mono font-bold text-amber-400 whitespace-nowrap">
                        <span className="bg-amber-500/10 border border-amber-500/25 px-2 py-0.5 rounded-lg">
                          {t.code}
                        </span>
                      </td>
                    )}

                    {/* Description */}
                    {visibleColumns.includes('description') && (
                      <td className="py-3 px-3.5 font-semibold text-white">
                        {t.description}
                      </td>
                    )}

                    {/* Second Language */}
                    {visibleColumns.includes('secondLanguage') && (
                      <td className="py-3 px-3.5 text-slate-300">
                        {t.secondLanguage || '---'}
                      </td>
                    )}

                    {/* Day(s) */}
                    {visibleColumns.includes('days') && (
                      <td className="py-3 px-3.5 text-center">
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full font-mono text-xs font-black bg-blue-500/15 text-blue-400 border border-blue-500/30">
                          <span>{t.days != null ? t.days : 0}</span>
                          <span className="text-[10px] uppercase font-sans font-bold">Days</span>
                        </span>
                      </td>
                    )}

                    {/* Active */}
                    {visibleColumns.includes('active') && (
                      <td className="py-3 px-3.5 text-center">
                        <button
                          type="button"
                          onClick={() => handleToggleActive(t)}
                          className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold border transition active:scale-95 ${
                            t.active !== false
                              ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/25'
                              : 'bg-slate-800 text-slate-400 border-slate-700 hover:bg-slate-700'
                          }`}
                        >
                          <span
                            className={`h-1.5 w-1.5 rounded-full ${
                              t.active !== false ? 'bg-emerald-400' : 'bg-slate-500'
                            }`}
                          />
                          <span>
                            {t.active !== false
                              ? lang === 'en'
                                ? 'Active'
                                : 'សកម្ម'
                              : lang === 'en'
                              ? 'Inactive'
                              : 'អសកម្ម'}
                          </span>
                        </button>
                      </td>
                    )}

                    {/* Note */}
                    {visibleColumns.includes('note') && (
                      <td className="py-3 px-3.5 text-slate-400 max-w-xs truncate">
                        {t.note || '---'}
                      </td>
                    )}

                    {/* Actions */}
                    <td className="py-3 px-3.5 text-center whitespace-nowrap">
                      <div className="inline-flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => openEditModal(t)}
                          title="Edit"
                          className="px-2 py-0.5 rounded text-[11px] font-bold bg-amber-500/20 text-amber-300 hover:bg-amber-500/30 transition"
                        >
                          Edit
                        </button>

                        <button
                          type="button"
                          onClick={() => handleDeleteTerm(t.id, t.code)}
                          title="Delete"
                          className="p-1 text-slate-500 hover:text-rose-400 transition"
                        >
                          🗑️
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

      {/* 4. CHOOSE COLUMN MODAL */}
      {chooseColumnOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-3xl border border-slate-800 bg-slate-900 p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <span className="text-xl">⚙️</span>
                <div>
                  <h3 className="text-base font-bold text-white">
                    {lang === 'en' ? 'Choose Columns' : 'ជ្រើសរើសជួរឈរ'}
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    {lang === 'en'
                      ? 'Select columns you want to display on table'
                      : 'ជ្រើសរើសជួរឈរដែលអ្នកចង់បង្ហាញលើតារាង'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setChooseColumnOpen(false)}
                className="text-slate-400 hover:text-white text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <div className="flex items-center justify-between text-xs pb-1">
              <button
                type="button"
                onClick={handleSelectAllColumns}
                className="text-amber-400 hover:underline font-semibold"
              >
                {lang === 'en' ? 'Select All' : 'ជ្រើសទាំងអស់'}
              </button>
              <button
                type="button"
                onClick={handleClearColumns}
                className="text-slate-400 hover:underline font-semibold"
              >
                {lang === 'en' ? 'Reset to Default' : 'កំណត់លំនាំដើម'}
              </button>
            </div>

            <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
              {ALL_COLUMNS.map((col) => {
                const checked = visibleColumns.includes(col.key)
                return (
                  <label
                    key={col.key}
                    className={`flex items-center justify-between p-2.5 rounded-xl border transition cursor-pointer ${
                      checked
                        ? 'border-amber-500/40 bg-amber-500/10 text-white'
                        : 'border-slate-800 bg-slate-950/60 text-slate-400 hover:bg-slate-800/40'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={checked}
                        disabled={col.always}
                        onChange={() => toggleColumn(col.key)}
                        className="rounded border-slate-700 text-amber-600 focus:ring-amber-500 h-4 w-4 accent-amber-500"
                      />
                      <span className="text-xs font-semibold">
                        {lang === 'en' ? col.label.en : col.label.kh}
                      </span>
                    </div>
                    {col.always && (
                      <span className="text-[10px] uppercase font-bold text-amber-400 bg-amber-500/20 px-2 py-0.5 rounded">
                        Required
                      </span>
                    )}
                  </label>
                )
              })}
            </div>

            <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setChooseColumnOpen(false)}
                className="rounded-xl bg-amber-600 hover:bg-amber-500 px-5 py-2 text-xs font-bold text-white transition active:scale-95"
              >
                {lang === 'en' ? 'Done' : 'រួចរាល់'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 5. CREATE / EDIT PAYMENT TERM MODAL */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-3 sm:p-4 backdrop-blur-md overflow-y-auto">
          <div className="w-full max-w-xl flex flex-col rounded-3xl border border-amber-500/30 bg-slate-900 shadow-2xl shadow-amber-950/40 my-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-5 border-b border-slate-800 bg-gradient-to-r from-slate-950 via-slate-900 to-amber-950/30 rounded-t-3xl">
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/20 border border-amber-500/30">
                  <img src={calendarIcon} alt="" className="h-6 w-6 object-contain" />
                </span>
                <div>
                  <h3 className="text-lg font-black text-white">
                    {editingId
                      ? lang === 'en'
                        ? 'Edit Payment Term'
                        : 'កែសម្រួលលក្ខខណ្ឌទូទាត់'
                      : lang === 'en'
                      ? 'New Payment Term'
                      : 'បង្កើតលក្ខខណ្ឌទូទាត់ថ្មី'}
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    {lang === 'en'
                      ? 'Input the general payment term information'
                      : 'បញ្ចូលព័ត៌មានទូទៅនៃលក្ខខណ្ឌទូទាត់'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="h-8 w-8 rounded-full bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white flex items-center justify-center text-sm font-bold transition"
              >
                ✕
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSaveTerm} className="p-5 space-y-5">
              {/* SECTION: GENERAL INFORMATION */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 pb-2 border-b border-slate-800/80">
                  <div className="h-4 w-1 rounded-full bg-amber-500" />
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-amber-400">
                      {lang === 'en' ? 'General Information' : 'ព័ត៌មានទូទៅ'}
                    </h4>
                    <p className="text-[10px] text-slate-400">
                      {lang === 'en'
                        ? 'Input the general payment term information'
                        : 'បញ្ចូលព័ត៌មានទូទៅនៃលក្ខខណ្ឌទូទាត់'}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Code - Auto Generate Code - Textbox */}
                  <div>
                    <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                      {lang === 'en' ? 'Code' : 'លេខកូដ'}
                    </label>
                    <input
                      type="text"
                      value={formData.code}
                      onChange={(e) => setFormData((prev) => ({ ...prev, code: e.target.value }))}
                      placeholder="Auto Generate Code"
                      className="w-full rounded-xl border border-slate-700/80 bg-slate-950/90 py-2 px-3 text-xs font-mono font-bold text-amber-400 outline-none transition focus:border-amber-400 focus:ring-2 focus:ring-amber-400/20"
                    />
                  </div>

                  {/* Active - Tickbox */}
                  <div className="flex flex-col justify-end">
                    <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                      {lang === 'en' ? 'Active' : 'សកម្ម'}
                    </label>
                    <label className="inline-flex items-center gap-2.5 p-2 rounded-xl border border-slate-700/80 bg-slate-950/60 cursor-pointer hover:border-amber-400/50 transition">
                      <input
                        type="checkbox"
                        checked={formData.active}
                        onChange={(e) => setFormData((prev) => ({ ...prev, active: e.target.checked }))}
                        className="h-4 w-4 rounded border-slate-700 text-amber-600 focus:ring-amber-500 accent-amber-500 cursor-pointer"
                      />
                      <span className="text-xs font-bold text-slate-200 select-none">
                        {formData.active ? (
                          <span className="text-emerald-400 font-black">✓ Active (Enabled)</span>
                        ) : (
                          <span className="text-slate-400">✕ Inactive (Disabled)</span>
                        )}
                      </span>
                    </label>
                  </div>

                  {/* Description* - Textbox */}
                  <div className="sm:col-span-2">
                    <label className="block text-[11px] font-bold text-amber-400 uppercase tracking-wider mb-1">
                      {lang === 'en' ? 'Description *' : 'ការពិពណ៌នា *'}
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.description}
                      onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
                      placeholder={lang === 'en' ? 'e.g. Net 30 Days / Cash on Delivery' : 'ឧ. ទូទាត់ក្នុងរយៈពេល 30 ថ្ងៃ'}
                      className="w-full rounded-xl border border-amber-500/50 bg-slate-950/90 py-2 px-3 text-xs font-semibold text-white outline-none transition focus:border-amber-400 focus:ring-2 focus:ring-amber-400/20"
                    />
                  </div>

                  {/* Second Language - Textbox */}
                  <div className="sm:col-span-2">
                    <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                      {lang === 'en' ? 'Second Language' : 'ភាសាទីពីរ'}
                    </label>
                    <input
                      type="text"
                      value={formData.secondLanguage}
                      onChange={(e) => setFormData((prev) => ({ ...prev, secondLanguage: e.target.value }))}
                      placeholder={lang === 'en' ? 'Second language translation / Khmer label...' : 'ការបកប្រែជាភាសាខ្មែរ...'}
                      className="w-full rounded-xl border border-slate-700/80 bg-slate-950/90 py-2 px-3 text-xs text-white outline-none focus:border-amber-400"
                    />
                  </div>

                  {/* Day(s)* - Textbox */}
                  <div>
                    <label className="block text-[11px] font-bold text-amber-400 uppercase tracking-wider mb-1">
                      {lang === 'en' ? 'Day(s) *' : 'ចំនួនថ្ងៃ *'}
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="1"
                      required
                      value={formData.days}
                      onChange={(e) => setFormData((prev) => ({ ...prev, days: e.target.value }))}
                      placeholder="0"
                      className="w-full rounded-xl border border-amber-500/50 bg-slate-950/90 py-2 px-3 text-xs font-mono font-bold text-blue-400 outline-none transition focus:border-amber-400 focus:ring-2 focus:ring-amber-400/20"
                    />
                    <p className="text-[10px] text-slate-500 mt-1">
                      {lang === 'en' ? '0 = Immediate / COD' : '0 = ទូទាត់ភ្លាមៗ'}
                    </p>
                  </div>

                  {/* Note - Textbox */}
                  <div className="sm:col-span-2">
                    <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                      {lang === 'en' ? 'Note' : 'កំណត់ចំណាំ'}
                    </label>
                    <textarea
                      rows={2}
                      value={formData.note}
                      onChange={(e) => setFormData((prev) => ({ ...prev, note: e.target.value }))}
                      placeholder={lang === 'en' ? 'Optional terms, discount conditions, or settlement notes...' : 'លក្ខខណ្ឌបញ្ចុះតម្លៃ ឬកំណត់ចំណាំបន្ថែម...'}
                      className="w-full rounded-xl border border-slate-700/80 bg-slate-950/90 py-2 px-3 text-xs text-white outline-none focus:border-amber-400"
                    />
                  </div>
                </div>
              </div>

              {/* Modal Actions */}
              <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="rounded-xl border border-slate-700 bg-slate-800 px-5 py-2.5 text-xs font-bold text-slate-300 hover:bg-slate-700 transition"
                >
                  {lang === 'en' ? 'Cancel' : 'បោះបង់'}
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 px-6 py-2.5 text-xs font-black uppercase tracking-wider text-white shadow-lg shadow-amber-600/30 transition hover:brightness-110 active:scale-95 disabled:opacity-50"
                >
                  {saving ? (
                    <span className="inline-flex items-center gap-2">
                      <span className="animate-spin">🌀</span>
                      {lang === 'en' ? 'Saving...' : 'កំពុងរក្សាទុក...'}
                    </span>
                  ) : (
                    <span>{editingId ? (lang === 'en' ? 'Update Term' : 'កែប្រែ') : (lang === 'en' ? 'Save Payment Term' : 'រក្សាទុក')}</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
