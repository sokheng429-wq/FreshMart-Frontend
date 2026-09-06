import React, { useEffect, useMemo, useRef, useState, useCallback } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import * as XLSX from 'xlsx'
import { useLanguage } from '../../context/LanguageContext'
import { useNotifications } from '../../context/NotificationContext'
import { adminCustomerAPI } from '../../api/api'
import { PrimaryButton, GhostButton, Modal } from './stockUI'
import boyIcon from '../../assets/icon/3dicons-boy-dynamic-color.png'

const GREEN = '#77BC1F'
const PAGE_SIZE = 10

const COLUMN_DEFS = [
  { key: 'code', label: { en: 'Code', kh: 'កូដ' }, always: true },
  { key: 'customerName', label: { en: 'Customer Name', kh: 'ឈ្មោះអតិថិជន' }, always: true },
  { key: 'secondLanguage', label: { en: 'Second Language', kh: 'ភាសាទី២' } },
  { key: 'customerGroup', label: { en: 'Customer Group', kh: 'ក្រុមអតិថិជន' } },
  { key: 'phone', label: { en: 'Phone', kh: 'ទូរស័ព្ទ' } },
  { key: 'mobile', label: { en: 'Mobile', kh: 'ទូរស័ព្ទចល័ត' } },
  { key: 'email', label: { en: 'Email', kh: 'អ៊ីមែល' } },
  { key: 'balance', label: { en: 'Balance', kh: 'សមតុល្យ' } },
  { key: 'creditDeposit', label: { en: 'Credit/Deposit', kh: 'ឥណទាន/ប្រាក់កក់' } },
  { key: 'active', label: { en: 'Active', kh: 'ដំណើរការ' }, bool: true },
]

const DEFAULT_COLS = ['code', 'customerName', 'customerGroup', 'phone', 'balance', 'active']

function mapDtoToDisplay(dto) {
  return {
    ...dto,
    contactName: [dto.contactFirstName, dto.contactLastName].filter(Boolean).join(' ') || '',
    phone: dto.contactPhone || '',
    mobile: dto.contactMobile || '',
    email: dto.contactEmail || '',
    address: [dto.addressLine1, dto.addressCity, dto.addressCountry].filter(Boolean).join(', ') || '',
  }
}

function downloadExcel(filename, sheetName, headerRow, dataRows) {
  const ws = XLSX.utils.aoa_to_sheet([headerRow, ...dataRows])
  ws['!cols'] = headerRow.map((h) => ({ wch: Math.max(12, Math.min(28, String(h).length + 6)) }))
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, sheetName)
  XLSX.writeFile(wb, filename)
}

const Dot = ({ on }) => (
  <span
    className={`inline-block h-2.5 w-2.5 rounded-full ${on ? 'bg-[#77BC1F]' : 'bg-slate-600'}`}
    title={on ? '✓' : '—'}
  />
)

export const CustomerList = () => {
  const { lang } = useLanguage()
  const { addNotification } = useNotifications()
  const navigate = useNavigate()
  const importRef = useRef(null)

  const [customers, setCustomers] = useState([])
  const [loading, setLoading] = useState(true)
  const [deleteConfirm, setDeleteConfirm] = useState(null)
  const [query, setQuery] = useState('')
  const [searchBy, setSearchBy] = useState('any')
  const [statusFilter, setStatusFilter] = useState('all')
  const [customerGroupFilter, setCustomerGroupFilter] = useState('all')
  const [page, setPage] = useState(1)
  const [visibleCols, setVisibleCols] = useState(new Set(DEFAULT_COLS))
  const [colDraft, setColDraft] = useState(new Set(DEFAULT_COLS))
  const [showColModal, setShowColModal] = useState(false)

  const t = {
    en: {
      dashboard: 'Dashboard',
      saleDashboard: 'Sale Dashboard',
      customers: 'Customers',
      subtitle: 'Manage customer accounts, contact details, and transactions.',
      newBtn: '+ New Customer',
      searchByLabel: 'Search By',
      searchPlaceholder: 'Type to search customers…',
      statusLabel: 'Status',
      all: 'All',
      active: 'Active',
      inactive: 'Inactive',
      groupFilter: 'All Groups',
      export: 'Export Excel',
      chooseColumn: 'Choose Column',
      resetCols: 'Reset to Normal',
      cancel: 'Cancel',
      apply: 'Apply',
      empty: 'No customers found — create your first customer account.',
      noResults: 'No customers match your filters.',
      code: 'Code',
      customerName: 'Customer Name',
      secondLanguage: 'Second Language',
      customerGroup: 'Customer Group',
      phone: 'Phone',
      mobile: 'Mobile',
      balance: 'Balance',
      activeStatus: 'Active',
      edit: 'Edit',
      delete: 'Delete',
      actions: 'Actions',
      deleteConfirmTitle: 'Delete Customer',
      deleteConfirmMsg: 'Are you sure you want to delete this customer account?',
    },
    kh: {
      dashboard: 'ផ្ទាំងគ្រប់គ្រង',
      saleDashboard: 'ផ្ទាំងលក់',
      customers: 'អតិថិជន',
      subtitle: 'គ្រប់គ្រងគណនីអតិថិជន ព័ត៌មានទំនាក់ទំនង និងប្រតិបត្តិការ។',
      newBtn: '+ អតិថិជនថ្មី',
      searchByLabel: 'ស្វែងរកដោយ',
      searchPlaceholder: 'បញ្ចូលដើម្បីស្វែងរកអតិថិជន…',
      statusLabel: 'ស្ថានភាព',
      all: 'ទាំងអស់',
      active: 'ដំណើរការ',
      inactive: 'អសកម្ម',
      groupFilter: 'ក្រុមទាំងអស់',
      export: 'នាំចេញ Excel',
      chooseColumn: 'ជ្រើសរើសជួរឈរ',
      resetCols: 'កំណត់ឡើងវិញតាមដើម',
      cancel: 'បោះបង់',
      apply: 'អនុវត្ត',
      empty: 'មិនទាន់មានអតិថិជនទេ — បង្កើតគណនីអតិថិជនដំបូងរបស់អ្នក។',
      noResults: 'រកមិនឃើញអតិថិជនតាមតម្រូវការ។',
      code: 'កូដ',
      customerName: 'ឈ្មោះអតិថិជន',
      secondLanguage: 'ភាសាទី២',
      customerGroup: 'ក្រុមអតិថិជន',
      phone: 'ទូរស័ព្ទ',
      mobile: 'ទូរស័ព្ទចល័ត',
      balance: 'សមតុល្យ',
      activeStatus: 'ដំណើរការ',
      edit: 'កែ',
      delete: 'លុប',
      actions: 'សកម្មភាព',
      deleteConfirmTitle: 'លុបអតិថិជន',
      deleteConfirmMsg: 'តើអ្នកពិតជាចង់លុបគណនីអតិថិជននេះមែនទេ?',
    },
  }[lang]

  const fetchCustomers = useCallback(async () => {
    setLoading(true)
    try {
      const res = await adminCustomerAPI.getAll()
      const list = res?.data ?? res ?? []
      setCustomers(Array.isArray(list) ? list.map(mapDtoToDisplay) : [])
    } catch (err) {
      console.error('Failed to load customers:', err)
      addNotification({
        type: 'error',
        title: lang === 'en' ? 'Failed to load customers' : 'មិនអាចផ្ទុកទិន្នន័យអតិថិជនបានទេ',
      })
      setCustomers([])
    } finally {
      setLoading(false)
    }
  }, [lang, addNotification])

  useEffect(() => {
    fetchCustomers()
  }, [fetchCustomers])

  const handleDelete = async (customer) => {
    setDeleteConfirm(null)
    try {
      await adminCustomerAPI.delete(customer.id)
      addNotification({
        type: 'success',
        title: lang === 'en' ? 'Customer deleted' : 'បានលុបអតិថិជន',
      })
      fetchCustomers()
    } catch (err) {
      alert(err.message || (lang === 'en' ? 'Failed to delete' : 'ការលុបបានបរាជ័យ'))
    }
  }

  const customerGroups = useMemo(() => {
    const groups = [...new Set(customers.map((c) => c.customerGroup).filter(Boolean))]
    return groups.sort()
  }, [customers])

  const filtered = useMemo(() => {
    let result = [...customers]
    if (statusFilter === 'active') result = result.filter((c) => c.active !== false)
    if (statusFilter === 'inactive') result = result.filter((c) => c.active === false)

    if (customerGroupFilter !== 'all') {
      result = result.filter((c) => c.customerGroup === customerGroupFilter)
    }

    if (query.trim()) {
      const q = query.toLowerCase().trim()
      result = result.filter((c) => {
        if (searchBy === 'code') return (c.code || '').toLowerCase().includes(q)
        if (searchBy === 'customerName') return (c.customerName || '').toLowerCase().includes(q)
        if (searchBy === 'phone') return (c.phone || '').includes(q) || (c.mobile || '').includes(q)
        if (searchBy === 'balance') return String(c.balance || '').includes(q)
        return (
          (c.code || '').toLowerCase().includes(q) ||
          (c.customerName || '').toLowerCase().includes(q) ||
          (c.contactName || '').toLowerCase().includes(q) ||
          (c.phone || '').includes(q) ||
          (c.mobile || '').includes(q) ||
          (c.email || '').toLowerCase().includes(q)
        )
      })
    }

    return result
  }, [customers, query, searchBy, statusFilter, customerGroupFilter])

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const paginated = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE
    return filtered.slice(start, start + PAGE_SIZE)
  }, [filtered, page])

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

  const exportData = () => {
    const visibleColDefs = COLUMN_DEFS.filter((c) => visibleCols.has(c.key))
    const header = visibleColDefs.map((c) => c.label[lang])
    const rows = filtered.map((customer) =>
      visibleColDefs.map((c) => {
        const val = customer[c.key]
        if (c.bool) return val ? 'Yes' : 'No'
        return val ?? ''
      })
    )
    downloadExcel('customers.xlsx', 'Customers', header, rows)
    addNotification({
      type: 'success',
      title: lang === 'en' ? 'Exported customers successfully' : 'បាននាំចេញទិន្នន័យអតិថិជនជោគជ័យ',
    })
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
            ← {t.saleDashboard}
          </Link>
          <div className="flex items-center gap-3">
            <span
              className="flex h-12 w-12 items-center justify-center rounded-2xl p-1.5 shadow-lg shadow-black/20 ring-1 ring-white/10"
              style={{ background: 'rgba(119, 188, 31, 0.2)' }}
            >
              <img src={boyIcon} alt="" className="h-8 w-8 object-contain drop-shadow-md" />
            </span>
            <h1 className="text-2xl font-extrabold tracking-tight text-white md:text-3xl">
              {t.customers}
            </h1>
          </div>
          <p className="mt-1 max-w-2xl text-sm text-slate-400">{t.subtitle}</p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <PrimaryButton onClick={() => navigate('/admin/sale-dashboard/customers/create')}>
            {t.newBtn}
          </PrimaryButton>
        </div>
      </div>

      {/* Data Table Card */}
      <section className="overflow-hidden rounded-2xl border border-slate-700/60 bg-slate-900/80 shadow-xl shadow-black/20">
        {/* Filter Bar */}
        <div className="flex flex-col gap-3 border-b border-slate-700/60 p-4 lg:flex-row lg:items-center">
          {/* Search By dropdown */}
          <select
            value={searchBy}
            onChange={(e) => setSearchBy(e.target.value)}
            aria-label={t.searchByLabel}
            className={`${selectCls} w-full sm:w-auto sm:min-w-[160px]`}
          >
            <option value="any">{t.searchByLabel}: {lang === 'en' ? 'Any' : 'ណាមួយ'}</option>
            <option value="code">{t.searchByLabel}: {t.code}</option>
            <option value="customerName">{t.searchByLabel}: {t.customerName}</option>
            <option value="phone">{t.searchByLabel}: {t.phone}</option>
            <option value="balance">{t.searchByLabel}: {t.balance}</option>
          </select>

          {/* Search input */}
          <div className="relative min-w-0 flex-1">
            <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 text-sm">
              🔍
            </span>
            <input
              type="text"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value)
                setPage(1)
              }}
              placeholder={t.searchPlaceholder}
              className="w-full rounded-lg border border-slate-700/70 bg-slate-950/60 py-2.5 pl-10 pr-4 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-green-400 focus:bg-slate-950 focus:ring-4 focus:ring-green-500/10"
            />
          </div>

          {/* Status dropdown */}
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value)
              setPage(1)
            }}
            className={`${selectCls} w-full sm:w-auto sm:min-w-[130px]`}
          >
            <option value="all">{t.all}</option>
            <option value="active">{t.active}</option>
            <option value="inactive">{t.inactive}</option>
          </select>

          {/* Customer Group filter */}
          {customerGroups.length > 0 && (
            <select
              value={customerGroupFilter}
              onChange={(e) => {
                setCustomerGroupFilter(e.target.value)
                setPage(1)
              }}
              className={`${selectCls} w-full sm:w-auto sm:min-w-[150px]`}
            >
              <option value="all">{t.groupFilter}</option>
              {customerGroups.map((grp) => (
                <option key={grp} value={grp}>
                  {grp}
                </option>
              ))}
            </select>
          )}

          {/* Action Toolbar */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={exportData}
              title={t.export}
              className={ghostBtnCls}
            >
              <span>📥</span>
              <span className="hidden xl:inline">{t.export}</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setColDraft(new Set(visibleCols))
                setShowColModal(true)
              }}
              title={t.chooseColumn}
              className={ghostBtnCls}
            >
              <span>▦</span>
              <span className="hidden xl:inline">{t.chooseColumn}</span>
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead>
              <tr className="border-b border-slate-700/60 bg-slate-800/40 text-xs font-bold uppercase tracking-wide text-slate-400">
                {visibleCols.has('code') && (
                  <th className="whitespace-nowrap px-4 py-3">{t.code}</th>
                )}
                {visibleCols.has('customerName') && (
                  <th className="whitespace-nowrap px-4 py-3">{t.customerName}</th>
                )}
                {visibleCols.has('secondLanguage') && (
                  <th className="whitespace-nowrap px-4 py-3">{t.secondLanguage}</th>
                )}
                {visibleCols.has('customerGroup') && (
                  <th className="whitespace-nowrap px-4 py-3">{t.customerGroup}</th>
                )}
                {visibleCols.has('phone') && (
                  <th className="whitespace-nowrap px-4 py-3">{t.phone}</th>
                )}
                {visibleCols.has('mobile') && (
                  <th className="whitespace-nowrap px-4 py-3">{t.mobile}</th>
                )}
                {visibleCols.has('balance') && (
                  <th className="whitespace-nowrap px-4 py-3">{t.balance}</th>
                )}
                {visibleCols.has('active') && (
                  <th className="whitespace-nowrap px-4 py-3 text-center">{t.activeStatus}</th>
                )}
                <th className="whitespace-nowrap px-4 py-3 text-right">{t.actions}</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={visibleCols.size + 1} className="px-4 py-14 text-center">
                    <div className="flex items-center justify-center gap-2 text-slate-400">
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-green-500 border-t-transparent" />
                      <span>{lang === 'en' ? 'Loading customers…' : 'កំពុងផ្ទុកអតិថិជន…'}</span>
                    </div>
                  </td>
                </tr>
              ) : paginated.length === 0 ? (
                <tr>
                  <td colSpan={visibleCols.size + 1} className="px-4 py-14 text-center">
                    <span className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-slate-800 text-2xl">
                      👤
                    </span>
                    <p className="text-sm font-bold text-slate-300">
                      {customers.length === 0 ? t.empty : t.noResults}
                    </p>
                    {customers.length === 0 && (
                      <div className="mt-3">
                        <PrimaryButton onClick={() => navigate('/admin/sale-dashboard/customers/create')}>
                          {t.newBtn}
                        </PrimaryButton>
                      </div>
                    )}
                  </td>
                </tr>
              ) : (
                paginated.map((item) => (
                  <tr
                    key={item.id}
                    className="border-b border-slate-800/60 transition last:border-0 hover:bg-slate-800/40 cursor-pointer"
                    onClick={() => navigate(`/admin/sale-dashboard/customers/edit?id=${item.id}`)}
                  >
                    {visibleCols.has('code') && (
                      <td className="whitespace-nowrap px-4 py-3 font-mono font-bold text-[#77BC1F]">
                        {item.code || '—'}
                      </td>
                    )}
                    {visibleCols.has('customerName') && (
                      <td className="whitespace-nowrap px-4 py-3 font-semibold text-white">
                        {item.customerName || '—'}
                      </td>
                    )}
                    {visibleCols.has('secondLanguage') && (
                      <td className="whitespace-nowrap px-4 py-3 text-slate-300 font-['Khmer_OS_Battambang',sans-serif]">
                        {item.secondLanguage || '—'}
                      </td>
                    )}
                    {visibleCols.has('customerGroup') && (
                      <td className="whitespace-nowrap px-4 py-3 text-slate-300">
                        {item.customerGroup ? (
                          <span className="rounded-md bg-teal-500/10 px-2 py-0.5 text-xs font-bold text-teal-400 border border-teal-500/20">
                            {item.customerGroup}
                          </span>
                        ) : (
                          '—'
                        )}
                      </td>
                    )}
                    {visibleCols.has('phone') && (
                      <td className="whitespace-nowrap px-4 py-3 font-mono text-xs text-slate-300">
                        {item.phone || '—'}
                      </td>
                    )}
                    {visibleCols.has('mobile') && (
                      <td className="whitespace-nowrap px-4 py-3 font-mono text-xs text-slate-300">
                        {item.mobile || '—'}
                      </td>
                    )}
                    {visibleCols.has('balance') && (
                      <td className="whitespace-nowrap px-4 py-3 font-mono font-bold text-emerald-400">
                        ${Number(item.balance || 0).toFixed(2)}
                      </td>
                    )}
                    {visibleCols.has('active') && (
                      <td className="whitespace-nowrap px-4 py-3 text-center">
                        <Dot on={item.active !== false} />
                      </td>
                    )}
                    <td
                      className="whitespace-nowrap px-4 py-3 text-right"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="inline-flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => navigate(`/admin/sale-dashboard/customers/edit?id=${item.id}`)}
                          className="rounded-lg px-2.5 py-1 text-xs font-bold text-slate-300 hover:bg-slate-800 hover:text-white transition"
                        >
                          ✏️ {t.edit}
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeleteConfirm(item)}
                          className="rounded-lg px-2.5 py-1 text-xs font-bold text-red-400 hover:bg-red-500/10 transition"
                        >
                          🗑️ {t.delete}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        {filtered.length > PAGE_SIZE && (
          <div className="flex items-center justify-between border-t border-slate-800 px-4 py-3 text-xs text-slate-400">
            <div>
              {lang === 'en' ? 'Showing' : 'បង្ហាញ'}{' '}
              <span className="font-bold text-white">{(page - 1) * PAGE_SIZE + 1}</span>{' '}
              {lang === 'en' ? 'to' : 'ដល់'}{' '}
              <span className="font-bold text-white">
                {Math.min(page * PAGE_SIZE, filtered.length)}
              </span>{' '}
              {lang === 'en' ? 'of' : 'នៃ'}{' '}
              <span className="font-bold text-white">{filtered.length}</span>
            </div>

            <div className="flex items-center gap-1">
              <button
                type="button"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="rounded-lg border border-slate-700 bg-slate-800 px-2.5 py-1 font-bold text-slate-300 disabled:opacity-40"
              >
                ‹
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setPage(p)}
                  className={`rounded-lg px-2.5 py-1 font-bold transition ${
                    page === p
                      ? 'bg-green-500 text-slate-950 font-black'
                      : 'border border-slate-700 bg-slate-800 text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  {p}
                </button>
              ))}
              <button
                type="button"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                className="rounded-lg border border-slate-700 bg-slate-800 px-2.5 py-1 font-bold text-slate-300 disabled:opacity-40"
              >
                ›
              </button>
            </div>
          </div>
        )}
      </section>

      {/* Choose Column Modal */}
      <Modal
        open={showColModal}
        onClose={() => setShowColModal(false)}
        title={t.chooseColumn}
      >
        <div className="space-y-4">
          <div className="divide-y divide-slate-800 rounded-xl border border-slate-800 bg-slate-950/40 max-h-72 overflow-y-auto">
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
              onClick={() => setColDraft(new Set(DEFAULT_COLS))}
              className="text-xs font-bold text-slate-400 hover:text-green-400 transition"
            >
              {t.resetCols}
            </button>
            <div className="flex items-center gap-2">
              <GhostButton onClick={() => setShowColModal(false)}>
                {t.cancel}
              </GhostButton>
              <PrimaryButton
                onClick={() => {
                  setVisibleCols(new Set(colDraft))
                  setShowColModal(false)
                }}
              >
                {t.apply}
              </PrimaryButton>
            </div>
          </div>
        </div>
      </Modal>

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <Modal
          open={Boolean(deleteConfirm)}
          onClose={() => setDeleteConfirm(null)}
          title={t.deleteConfirmTitle}
        >
          <div className="space-y-4">
            <p className="text-sm text-slate-300">
              {t.deleteConfirmMsg} ({deleteConfirm.code} — {deleteConfirm.customerName})
            </p>
            <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-800">
              <GhostButton onClick={() => setDeleteConfirm(null)}>{t.cancel}</GhostButton>
              <button
                type="button"
                onClick={() => handleDelete(deleteConfirm)}
                className="rounded-xl bg-red-600 px-4 py-2 text-xs font-bold text-white hover:bg-red-500 transition"
              >
                {t.delete}
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
}

export default CustomerList
