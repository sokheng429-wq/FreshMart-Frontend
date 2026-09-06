import { useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { Link } from 'react-router-dom'
import * as XLSX from 'xlsx'
import { useLanguage } from '../../context/LanguageContext'
import { useNotifications } from '../../context/NotificationContext'
import { adminSupplierAPI, adminSupplierGroupAPI } from '../../api/api'
import { COUNTRIES } from '../../data/countries'
import { CountryFlag } from '../../components/CountryFlag'
import { exportStyledExcel } from '../../utils/excelExport'
import './Suppliers.css'

// Theme constants — FreshMart dark admin palette.
const GREEN = '#77BC1F'
const ORANGE = '#FF9900'
const PAGE_SIZE = 8

// Dropdown options for the create/edit form. Supplier Group is loaded live
// from the Suppliers Group master data (/admin/supplier-groups); Payment Term
// is a fixed business list. The other template/term lists are free-text
// columns on the backend (no dedicated tables yet), so they live here.
const PAYMENT_TERM_OPTIONS = ['One Week', 'Half Month', 'One Month']
const PO_TEMPLATE_OPTIONS = ['Standard PO', 'Bulk Order PO', 'Recurring PO', 'Sample PO']
const SHIPMENT_METHOD_OPTIONS = ['Road', 'Air', 'Sea', 'Rail', 'Pickup']
const TERM_CONDITION_OPTIONS = ['Standard Terms', 'Fragile Goods', 'Cold Chain', 'Consignment']
const BILL_TEMPLATE_OPTIONS = ['Standard Bill', 'Credit Bill', 'Deposit Bill']

// Debit/Deposit Payment Term choices + gender options for the contact modal.
const DEBIT_TERM_OPTIONS = ['COD', 'NET-7', 'NET-15', 'NET-30', 'NET-60', 'Prepaid', 'Deposit']
const GENDER_OPTIONS = ['Male', 'Female', 'Other']

// Every column offered in the "Choose Column" modal — the user's requested
// list. Field names match the backend SupplierDto so exports round-trip
// straight back through Import. contactName/address are derived columns
// (composed from the default contact / location rows on the backend).
const COLUMN_DEFS = [
  { key: 'supplierGroup', label: { en: 'Suppliers Group', kh: 'ក្រុមអ្នកផ្គត់ផ្គង់' } },
  { key: 'contactName', label: { en: 'Contact Name', kh: 'ឈ្មោះទំនាក់ទំនង' } },
  { key: 'phone', label: { en: 'Phone', kh: 'ទូរស័ព្ទ' }, derivedKey: 'contactPhone' },
  { key: 'email', label: { en: 'Email', kh: 'អ៊ីមែល' }, derivedKey: 'contactEmail' },
  { key: 'currentBalance', label: { en: 'Current Balance', kh: 'សមតុល្យបច្ចុប្បន្ន' } },
  { key: 'debitDepositPaymentTerm', label: { en: 'Debit/ Deposit Payment Term', kh: 'លក្ខខណ្ឌទូទាត់បញ្ជី / ប្រាកដប្រកាន' } },
  { key: 'purchasePerson', dto: 'purchasePerson', label: { en: 'Purchase Person', kh: 'អ្នកទីផ្សារទិញ' } },
  { key: 'address', label: { en: 'Address', kh: 'អាសយដ្ឋាន' } },
  { key: 'active', label: { en: 'Active', kh: 'ដំណើរការ' }, bool: true, always: true },
]

// Columns shown before the user customizes anything.
// Debit/Deposit Payment Term stays available in Choose Column but is
// unticked by default.
const DEFAULT_COLS = ['supplierGroup', 'contactName', 'phone', 'email', 'currentBalance', 'purchasePerson', 'address', 'active']

// Build an .xlsx workbook from header + data rows and trigger a download.
function downloadExcel(filename, sheetName, headerRow, dataRows) {
  const ws = XLSX.utils.aoa_to_sheet([headerRow, ...dataRows])
  // sensible column widths so the file is readable straight away
  ws['!cols'] = headerRow.map((h) => ({ wch: Math.max(12, Math.min(28, String(h).length + 6)) }))
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, sheetName)
  XLSX.writeFile(wb, filename)
}

// Parse an uploaded .xlsx/.xls/.csv file into { headers, rows } (arrays of strings).
async function readExcel(file) {
  const buffer = await file.arrayBuffer()
  const wb = XLSX.read(buffer, { type: 'array' })
  const first = wb.Sheets[wb.SheetNames[0]]
  const aoa = XLSX.utils.sheet_to_json(first, { header: 1, raw: false, defval: '' })
  if (!aoa.length) return { headers: [], rows: [] }
  const [headers, ...rows] = aoa
  return { headers: headers.map((h) => String(h)), rows: rows.map((r) => r.map((c) => String(c ?? ''))) }
}

const truthy = (v) => /^(true|1|yes|y)$/i.test(String(v).trim())

// Flexible CSV header → DTO field. Our own exports round-trip because the
// normalized header ("contactname", "currentbalance"…) hits the same aliases.
const HEADER_ALIASES = {
  contactname: 'name',
  name: 'name',
  phone: 'contactPhone',
  email: 'contactEmail',
  currentbalance: 'currentBalance',
  debitdepositpaymentterm: 'debitDepositPaymentTerm',
  debitpaymentterm: 'debitDepositPaymentTerm',
  paymenttermdebitdeposit: 'debitDepositPaymentTerm',
  purchaseperson: 'purchasePerson',
  address: 'addressLine1',
  active: 'active',
}

// One row of the Contact Information sub-table. The DEFAULT-flagged row is
// what gets persisted into the flat contact_* columns on save.
const EMPTY_CONTACT = {
  id: null, // local key only — contacts have no backend table yet
  default: false,
  firstName: '', lastName: '', gender: '', dob: '',
  phone: '', mobile: '', email: '', website: '',
}

// One row of the Location Information sub-table; the default row persists
// into the flat address_* columns on save.
const EMPTY_ADDRESS = {
  id: null,
  default: false,
  description: '', nameKh: '', line1: '', line2: '',
  phone: '', phoneExt: '', fax: '', faxExt: '',
  email: '', website: '', country: '', state: '', city: '',
}

let LOCAL_SUB_ID = -1 // decreasing keys so new sub-rows never collide
const nextSubId = () => LOCAL_SUB_ID--

// Blank create/edit form — every SupplierDto field the modal owns.
const EMPTY_FORM = {
  id: null,
  code: '',
  name: '',
  nameKh: '',
  supplierGroup: '',
  taxNumber: '',
  paymentTerm: '',
  poTemplateName: '',
  shipmentMethod: '',
  purchasePerson: '',
  termCondition: '',
  billTemplateName: '',
  currentBalance: '',
  debitDepositPaymentTerm: '',
  contacts: [],
  addresses: [],
  active: true,
}

// "Suppliers" landing page for the Stocks menu — follows the All Products
// flow (KPI widgets as filters, Search By bar, Choose Column, pagination,
// Excel import/export) but with a Create/Edit modal instead of a separate
// page, since suppliers are master data.
export const Suppliers = () => {
  const { lang } = useLanguage()
  const { addNotification } = useNotifications()
  const importRef = useRef(null)

  const [suppliers, setSuppliers] = useState([])
  // Supplier Group dropdown options — loaded from the Suppliers Group master data
  const [groupOptions, setGroupOptions] = useState([])
  const [source, setSource] = useState('demo') // 'live' | 'demo'
  const [query, setQuery] = useState('')
  const [searchBy, setSearchBy] = useState('name') // name | code | group | taxNumber | person
  const [status, setStatus] = useState('all') // all | active | inactive
  // advanced filter panel
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [group, setGroup] = useState('all')
  const [paymentTerm, setPaymentTerm] = useState('all')
  const [person, setPerson] = useState('all')
  // row selection + pagination
  const [selected, setSelected] = useState(new Set())
  const [page, setPage] = useState(1)
  // choose-column modal: draft edits live here until "Apply"
  const [showColModal, setShowColModal] = useState(false)
  const [visibleCols, setVisibleCols] = useState(() => new Set(DEFAULT_COLS))
  const [colDraft, setColDraft] = useState(visibleCols)
  // excel import feedback
  const [importResult, setImportResult] = useState(null) // { ok, fail, errors[] }
  const [importing, setImporting] = useState(false)
  // create/edit modal
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState(EMPTY_FORM)
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState(null)

  /* ---------- loading ---------- */

  const mapBackendItem = (item, index) => ({
    id: item.id ?? index,
    code: item.code ?? '',
    name: typeof item.name === 'string' ? item.name : '',
    nameKh: typeof item.nameKh === 'string' ? item.nameKh : '',
    supplierGroup: item.supplierGroup ?? '',
    taxNumber: item.taxNumber ?? '',
    paymentTerm: item.paymentTerm ?? '',
    poTemplateName: item.poTemplateName ?? '',
    shipmentMethod: item.shipmentMethod ?? '',
    purchasePerson: item.purchasePerson ?? '',
    termCondition: item.termCondition ?? '',
    billTemplateName: item.billTemplateName ?? '',
    currentBalance: item.currentBalance ?? '',
    debitDepositPaymentTerm: item.debitDepositPaymentTerm ?? '',
    contactFirstName: item.contactFirstName ?? '',
    contactLastName: item.contactLastName ?? '',
    contactPhone: item.contactPhone ?? '',
    contactEmail: item.contactEmail ?? '',
    addressLine1: item.addressLine1 ?? '',
    addressCity: item.addressCity ?? '',
    addressState: item.addressState ?? '',
    addressCountry: item.addressCountry ?? '',
    active: item.active !== false,
  })

  const loadSuppliers = () =>
    adminSupplierAPI
      .getAll()
      .then((res) => {
        if (Array.isArray(res?.data)) {
          setSuppliers(res.data.map(mapBackendItem))
          if (res.data.length > 0) setSource('live')
        }
      })
      .catch(() => {})

  useEffect(() => {
    loadSuppliers()
    // Supplier Group dropdown is fed by the Suppliers Group master data —
    // fall back silently to just saved supplier values if it's unreachable
    adminSupplierGroupAPI
      .getAll()
      .then((res) => {
        const names = (res?.data ?? [])
          .map((g) => g.description || g.name || g.code)
          .filter(Boolean)
        setGroupOptions([...new Set(names)])
      })
      .catch(() => {})
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  /* ---------- filtering ---------- */

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return suppliers.filter((s) => {
      const matchesStatus =
        status === 'all' || (status === 'active' ? s.active : !s.active)
      const haystack =
        searchBy === 'code'
          ? `${s.code} #${s.id}`
          : searchBy === 'group'
            ? s.supplierGroup
            : searchBy === 'tax'
              ? s.taxNumber
              : searchBy === 'person'
                ? s.purchasePerson
                : lang === 'kh'
                  ? `${s.nameKh} ${s.name}`
                  : `${s.name} ${s.nameKh}`
      const matchesQuery = !q || haystack.toLowerCase().includes(q)
      return matchesStatus && matchesQuery
    })
  }, [suppliers, query, searchBy, status, lang])

  // KPIs are computed over the whole list, not just the current filters.
  const kpis = useMemo(() => {
    let activeCount = 0
    let inactiveCount = 0
    suppliers.forEach((s) => (s.active ? (activeCount += 1) : (inactiveCount += 1)))
    return [
      { key: 'total', label: { en: 'Total Suppliers', kh: 'អ្នកផ្គត់ផ្គង់សរុប' }, value: String(suppliers.length), icon: <TruckIcon />, tone: 'green', clickable: true },
      { key: 'active', label: { en: 'Active', kh: 'ដំណើរការ' }, value: String(activeCount), icon: <CheckCircleIcon />, tone: 'lime', clickable: true },
      { key: 'inactive', label: { en: 'Inactive', kh: 'អសកម្ម' }, value: String(inactiveCount), icon: <XCircleIcon />, tone: 'red', clickable: true },
      { key: 'groups', label: { en: 'Groups In Use', kh: 'ក្រុមដែលបានប្រើ' }, value: String(uniqueValuesOf(suppliers, 'supplierGroup').length), icon: <LayersIcon />, tone: 'navy', clickable: false },
    ]
  }, [suppliers])

  // KPI widgets act as one-click filters on the table.
  const onKpiClick = (key) => {
    if (key === 'total') { setStatus('all'); setPage(1); return }
    if (key === 'groups') return
    setStatus(key)
    setPage(1)
  }

  // distinct non-empty values of a field — module-level helper reused by KPIs
  function uniqueValuesOf(list, field) {
    return [...new Set(list.map((x) => x[field]).filter(Boolean))].sort()
  }

  // distinct non-empty values of a field, for the advanced filter dropdowns
  const uniqueValues = (field) => uniqueValuesOf(suppliers, field)

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const safePage = Math.min(page, totalPages)
  const paged = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE)

  const allOnPageSelected = paged.length > 0 && paged.every((s) => selected.has(String(s.id)))

  const toggleAllOnPage = () =>
    setSelected((prev) => {
      const next = new Set(prev)
      if (allOnPageSelected) paged.forEach((s) => next.delete(String(s.id)))
      else paged.forEach((s) => next.add(String(s.id)))
      return next
    })

  const toggleOne = (id) =>
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
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

  const clearFilters = () => {
    setQuery('')
    setSearchBy('name')
    setStatus('all')
    setGroup('all')
    setPaymentTerm('all')
    setPerson('all')
    setPage(1)
  }

  const activeFilterCount =
    (query ? 1 : 0) +
    (status !== 'all' ? 1 : 0) +
    (group !== 'all' ? 1 : 0) +
    (paymentTerm !== 'all' ? 1 : 0) +
    (person !== 'all' ? 1 : 0)

  // advanced filters (group / payment term / purchase person) apply on top of
  // the base filters; when none are active the plain paged rows render
  const furtherFiltered = useMemo(
    () =>
      filtered.filter(
        (s) =>
          (group === 'all' || (s.supplierGroup || '') === group) &&
          (paymentTerm === 'all' || (s.paymentTerm || '') === paymentTerm) &&
          (person === 'all' || (s.purchasePerson || '') === person)
      ),
    [filtered, group, paymentTerm, person]
  )

  const advancedActive = group !== 'all' || paymentTerm !== 'all' || person !== 'all'

  const tableRows = useMemo(
    () =>
      advancedActive
        ? furtherFiltered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE)
        : paged,
    [furtherFiltered, paged, advancedActive, safePage]
  )

  /* ---------- Excel import / export ---------- */

  // Blank template = the importable DTO column header + one example row.
  const exportTemplate = () => {
    const header = ['Contact Name', 'Supplier Name', 'Phone', 'Email', 'Current Balance', 'Debit/ Deposit Payment Term', 'Purchase Person', 'Address', 'Active']
    const example = ['Sok Dara', 'Siem Reap Farms', '+855 12 345 678', 'dara@farm.kh', 1500.0, 'NET-30', 'Sok Dara', 'St 5, Siem Reap, Cambodia', true]
    exportStyledExcel({
      filename: 'b-groceries-supplier-template.xlsx',
      sheetName: 'Suppliers Template',
      title: 'SUPPLIER BULK IMPORT TEMPLATE',
      subtitle: 'Use this template to import new vendor suppliers',
      headers: header,
      data: [example],
    })
  }

  const exportCurrent = () => {
    const cols = COLUMN_DEFS.filter((c) => visibleCols.has(c.key))
    const header = cols.map((c) => c.label.en)
    const dataset = advancedActive ? furtherFiltered : filtered
    const rows = dataset.map((s) =>
      cols.map((c) => {
        const sourceKey = c.derivedKey || c.key
        if (c.key === 'address') return [s.addressLine1, s.addressCity, s.addressState, s.addressCountry].filter(Boolean).join(', ')
        if (c.key === 'contactName') return [s.contactFirstName, s.contactLastName].filter(Boolean).join(' ') || s.name
        return c.bool ? (s[sourceKey] ? 'Active' : 'Inactive') : (s[sourceKey] ?? '')
      })
    )
    exportStyledExcel({
      filename: 'b-groceries-suppliers.xlsx',
      sheetName: 'Suppliers',
      title: 'SUPPLIER DIRECTORY & BALANCES REPORT',
      subtitle: `Supplier Group: ${supplierGroup} · Status: ${status}`,
      headers: header,
      data: rows,
      summary: {
        'Total Suppliers': rows.length,
        'Active': dataset.filter((s) => s.active !== false).length,
      },
    })
  }

  const handleImportFile = async (e) => {
    const file = e.target.files?.[0]
    e.target.value = '' // allow re-selecting the same file
    if (!file) return
    setImporting(true)
    setImportResult(null)
    try {
      const { headers, rows } = await readExcel(file)
      if (rows.length < 1) throw new Error(lang === 'en' ? 'File has no data rows.' : 'ឯកសារគ្មានទិន្នន័យ។')

      // map header row → DTO fields via aliases; unknown headers are skipped
      const colMap = headers.map((h) => HEADER_ALIASES[h.toLowerCase().replace(/[^a-z0-9]/g, '')] || null)
      const errors = []
      let ok = 0
      for (let i = 0; i < rows.length; i++) {
        const cells = rows[i]
        const record = {}
        colMap.forEach((dto, idx) => {
          if (dto && cells[idx] !== undefined && cells[idx] !== '') record[dto] = cells[idx]
        })
        const name = String(record.name || '').trim()
        if (!name) { errors.push(`Row ${i + 2}: missing Supplier Name`); continue }
        if ('active' in record) record.active = truthy(record.active)
        try {
          await adminSupplierAPI.create({ active: true, ...record })
          ok += 1
        } catch (err) {
          errors.push(`Row ${i + 2}: ${err.message}`)
        }
      }
      setImportResult({ ok, fail: errors.length, errors: errors.slice(0, 5) })
      if (ok > 0) {
        addNotification({
          type: 'product',
          action: 'add',
          title: lang === 'en' ? `${ok} supplier(s) imported` : `បាននាំចូលអ្នកផ្គត់ផ្គង់ ${ok}`,
          detail: file.name,
        })
        loadSuppliers()
      }
    } catch (err) {
      setImportResult({ ok: 0, fail: 1, errors: [err.message] })
    } finally {
      setImporting(false)
    }
  }

  /* ---------- create / edit ---------- */

  // Rebuild the sub-table rows from the flat contact_*/address_* columns —
  // the default row is the one the backend persists today.
  const subRowsFromItem = (item) => ({
    contacts: (item.contactFirstName || item.contactLastName || item.contactPhone || item.contactEmail)
      ? [{ ...EMPTY_CONTACT, id: nextSubId(), default: true, firstName: item.contactFirstName || '', lastName: item.contactLastName || '', phone: item.contactPhone || '', email: item.contactEmail || '' }]
      : [],
    addresses: (item.addressLine1 || item.addressCity || item.addressCountry)
      ? [{ ...EMPTY_ADDRESS, id: nextSubId(), default: true, line1: item.addressLine1 || '', city: item.addressCity || '', state: item.addressState || '', country: item.addressCountry || '' }]
      : [],
  })

  const openCreate = () => {
    setForm(EMPTY_FORM)
    setFormError(null)
    setShowForm(true)
  }

  const openEdit = (item) => {
    setForm({
      id: item.id,
      code: item.code || '',
      name: item.name || '',
      nameKh: item.nameKh || '',
      supplierGroup: item.supplierGroup || '',
      taxNumber: item.taxNumber || '',
      paymentTerm: item.paymentTerm || '',
      poTemplateName: item.poTemplateName || '',
      shipmentMethod: item.shipmentMethod || '',
      purchasePerson: item.purchasePerson || '',
      termCondition: item.termCondition || '',
      billTemplateName: item.billTemplateName || '',
      currentBalance: item.currentBalance ?? '',
      debitDepositPaymentTerm: item.debitDepositPaymentTerm || '',
      ...subRowsFromItem(item),
      active: item.active !== false,
    })
    setFormError(null)
    setShowForm(true)
  }

  const setField = (field, value) => setForm((prev) => ({ ...prev, [field]: value }))

  /* ---------- contact / location sub-rows (local until Save) ---------- */

  // nested add/edit modals: null = closed, { mode, row } = open
  const [contactModal, setContactModal] = useState(null)
  const [addressModal, setAddressModal] = useState(null)
  const [contactDraft, setContactDraft] = useState(EMPTY_CONTACT)
  const [addressDraft, setAddressDraft] = useState(EMPTY_ADDRESS)

  const openContactModal = (row) => {
    setContactDraft(row ? { ...row } : { ...EMPTY_CONTACT, id: nextSubId() })
    setContactModal({ mode: row ? 'edit' : 'add', key: row?.id ?? null })
  }

  const saveContactModal = () => {
    if (!contactDraft.firstName.trim() || !contactDraft.lastName.trim()) return
    setForm((prev) => {
      const wasDefault = contactModal.mode === 'edit'
        ? prev.contacts.find((c) => c.id === contactModal.key)?.default
        : prev.contacts.length === 0
      const row = { ...contactDraft, default: wasDefault }
      const contacts = contactModal.mode === 'edit'
        ? prev.contacts.map((c) => (c.id === contactModal.key ? row : c))
        : [...prev.contacts, row]
      return { ...prev, contacts }
    })
    setContactModal(null)
  }

  const openAddressModal = (row) => {
    setAddressDraft(row ? { ...row } : { ...EMPTY_ADDRESS, id: nextSubId() })
    setAddressModal({ mode: row ? 'edit' : 'add', key: row?.id ?? null })
  }

  const saveAddressModal = () => {
    if (!addressDraft.description.trim()) return
    setForm((prev) => {
      const wasDefault = addressModal.mode === 'edit'
        ? prev.addresses.find((a) => a.id === addressModal.key)?.default
        : prev.addresses.length === 0
      const row = { ...addressDraft, default: wasDefault }
      const addresses = addressModal.mode === 'edit'
        ? prev.addresses.map((a) => (a.id === addressModal.key ? row : a))
        : [...prev.addresses, row]
      return { ...prev, addresses }
    })
    setAddressModal(null)
  }

  // radio click → that row becomes the single default of its sub-table
  const setDefaultSub = (listKey, id) =>
    setForm((prev) => ({
      ...prev,
      [listKey]: prev[listKey].map((r) => ({ ...r, default: r.id === id })),
    }))

  // deleting the default row hands the flag to the next remaining row
  const removeSub = (listKey, id) =>
    setForm((prev) => {
      const list = prev[listKey].filter((r) => r.id !== id)
      if (list.length > 0 && !list.some((r) => r.default)) list[0] = { ...list[0], default: true }
      return { ...prev, [listKey]: list }
    })

  // English country name → alpha-2 code for the flag emoji in the table cell
  const countryCodeOf = (name) => COUNTRIES.find((c) => c.en === name)?.code || ''

  /* ---------- delete (with confirm modal) ---------- */

  const [deleteTarget, setDeleteTarget] = useState(null) // supplier about to be deleted
  const [deleting, setDeleting] = useState(false)

  const askDelete = (item) => setDeleteTarget(item)

  const confirmDelete = async () => {
    if (!deleteTarget || deleting) return
    setDeleting(true)
    try {
      await adminSupplierAPI.delete(deleteTarget.id)
      addNotification({
        type: 'product',
        action: 'delete',
        title:
          lang === 'en'
            ? `Deleted supplier ${deleteTarget.name}`
            : `បានលុបអ្នកផ្គត់ផ្គង់ ${deleteTarget.name}`,
      })
      setSelected((prev) => {
        const next = new Set(prev)
        next.delete(String(deleteTarget.id))
        return next
      })
      setDeleteTarget(null)
      loadSuppliers()
    } catch (err) {
      addNotification({
        type: 'product',
        action: 'delete',
        title: lang === 'en' ? 'Delete failed' : 'ការលុបបរាជ័យ',
        detail: err.message,
      })
    } finally {
      setDeleting(false)
    }
  }

  // The DEFAULT-flagged contact / address rows flatten into the DTO's
  // contact*/address* fields (no dedicated sub-tables on the backend yet).
  const defaultContact = form.contacts.find((c) => c.default) || null
  const defaultAddress = form.addresses.find((a) => a.default) || null

  const saveForm = async (e) => {
    e.preventDefault()
    if (saving) return
    setFormError(null)
    const payload = {
      code: form.code.trim() || undefined, // blank → backend auto SP-####
      name: form.name.trim(),
      nameKh: form.nameKh.trim() || undefined,
      supplierGroup: form.supplierGroup.trim() || undefined,
      taxNumber: form.taxNumber.trim() || undefined,
      paymentTerm: form.paymentTerm.trim() || undefined,
      poTemplateName: form.poTemplateName.trim() || undefined,
      shipmentMethod: form.shipmentMethod.trim() || undefined,
      purchasePerson: form.purchasePerson.trim() || undefined,
      termCondition: form.termCondition.trim() || undefined,
      billTemplateName: form.billTemplateName.trim() || undefined,
      currentBalance: form.currentBalance === '' ? undefined : Number(form.currentBalance),
      debitDepositPaymentTerm: form.debitDepositPaymentTerm.trim() || undefined,
      // flattened default Contact Information row
      contactFirstName: defaultContact?.firstName?.trim() || undefined,
      contactLastName: defaultContact?.lastName?.trim() || undefined,
      contactGender: defaultContact?.gender || undefined,
      contactDob: defaultContact?.dob || undefined,
      contactPhone: defaultContact?.phone?.trim() || undefined,
      contactMobile: defaultContact?.mobile?.trim() || undefined,
      contactEmail: defaultContact?.email?.trim() || undefined,
      contactWebsite: defaultContact?.website?.trim() || undefined,
      // flattened default Location Information row
      addressDescription: defaultAddress?.description?.trim() || undefined,
      addressNameKh: defaultAddress?.nameKh?.trim() || undefined,
      addressLine1: defaultAddress?.line1?.trim() || undefined,
      addressLine2: defaultAddress?.line2?.trim() || undefined,
      addressCity: defaultAddress?.city?.trim() || undefined,
      addressState: defaultAddress?.state?.trim() || undefined,
      addressCountry: defaultAddress?.country?.trim() || undefined,
      addressPhone: defaultAddress?.phone?.trim() || undefined,
      addressPhoneExt: defaultAddress?.phoneExt?.trim() || undefined,
      addressFax: defaultAddress?.fax?.trim() || undefined,
      addressFaxExt: defaultAddress?.faxExt?.trim() || undefined,
      addressEmail: defaultAddress?.email?.trim() || undefined,
      addressWebsite: defaultAddress?.website?.trim() || undefined,
      active: form.active,
    }
    if (!payload.name) {
      setFormError(lang === 'en' ? 'Supplier Name is required.' : 'ត្រូវបញ្ចូលឈ្មោះអ្នកផ្គត់ផ្គង់។')
      return
    }
    if (defaultContact && !(defaultContact.firstName.trim() && defaultContact.lastName.trim())) {
      setFormError(lang === 'en' ? 'The default contact needs First Name and Last Name.' : 'ទំនាក់ទំនងលំនាំដើមត្រូវការឈ្មោះ និងអតីតនាម។')
      return
    }
    if (defaultAddress && !defaultAddress.description.trim()) {
      setFormError(lang === 'en' ? 'The default location needs a Description.' : 'ទីតាំងលំនាំដើមត្រូវការការពិពណ៌នា។')
      return
    }
    setSaving(true)
    try {
      if (form.id) await adminSupplierAPI.update(form.id, payload)
      else await adminSupplierAPI.create(payload)
      addNotification({
        type: 'product',
        action: form.id ? 'edit' : 'add',
        title:
          lang === 'en'
            ? `${form.id ? 'Updated' : 'Created'} supplier ${payload.name}`
            : `${form.id ? 'បានកែប្រែ' : 'បានបង្កើត'}អ្នកផ្គត់ផ្គង់ ${payload.name}`,
      })
      setShowForm(false)
      loadSuppliers()
    } catch (err) {
      setFormError(err.message)
    } finally {
      setSaving(false)
    }
  }

  /* ---------- rendering helpers ---------- */

  const STATUS_META = {
    active: { label: { en: 'Active', kh: 'ដំណើរការ' }, color: GREEN, bg: 'rgba(119,188,31,0.15)' },
    inactive: { label: { en: 'Inactive', kh: 'អសកម្ម' }, color: '#FB7185', bg: 'rgba(244,63,94,0.15)' },
  }

  const TEXTS = {
    back: { en: 'Stocks', kh: 'ស្តុក' },
    heroTitle: { en: 'Suppliers', kh: 'អ្នកផ្គត់ផ្គង់' },
    heroSub: {
      en: 'Everyone we buy stock from — groups, terms and purchasing setup.',
      kh: 'អ្នកដែលយើងទិញទំនិញពីពួកគេ — ក្រុម លក្ខខណ្ឌ និងការរៀបចំការទិញ។',
    },
    liveData: { en: 'Live data', kh: 'ទិន្នន័យផ្ទាល់' },
    demoData: { en: 'No records yet', kh: 'មិនមានទិន្នន័យនៅឡើយ' },
    createBtn: { en: 'Create Supplier', kh: 'បង្កើតអ្នកផ្គត់ផ្គង់' },
    importBtn: { en: 'Import Excel', kh: 'នាំចូល Excel' },
    templateBtn: { en: 'Export Template', kh: 'នាំចេញទំព័រគំរូ' },
    exportBtn: { en: 'Export', kh: 'នាំចេញ' },
    importing: { en: 'Importing…', kh: 'កំពុងនាំចូល…' },
    searchByLabel: { en: 'Search By', kh: 'ស្វែងរកដោយ' },
    searchPlaceholder: { en: 'Search suppliers…', kh: 'ស្វែងរកអ្នកផ្គត់ផ្គង់…' },
    byName: { en: 'Name', kh: 'ឈ្មោះ' },
    byCode: { en: 'Code', kh: 'កូដ' },
    byGroup: { en: 'Group', kh: 'ក្រុម' },
    byTax: { en: 'Tax N', kh: 'លេខអាករ' },
    byPerson: { en: 'Purchase Person', kh: 'អ្នកទីផ្សារទិញ' },
    allStatus: { en: 'All status', kh: 'ស្ថានភាពទាំងអស់' },
    filters: { en: 'Filters', kh: 'តម្រង' },
    clearFilters: { en: 'Clear Filters', kh: 'សម្អាតតម្រង' },
    allGroups: { en: 'All groups', kh: 'ក្រុមទាំងអស់' },
    allTerms: { en: 'All terms', kh: 'លក្ខខណ្ឌទាំងអស់' },
    allPersons: { en: 'All persons', kh: 'អ្នកទាំងអស់' },
    chooseColumn: { en: 'Choose Column', kh: 'ជ្រើសរើសជួរឈរ' },
    resetCols: { en: 'Reset to Normal', kh: 'កំណត់ឡើងវិញតាមដើម' },
    cancel: { en: 'Cancel', kh: 'បោះបង់' },
    apply: { en: 'Apply', kh: 'អនុវត្ត' },
    colStatus: { en: 'Status', kh: 'ស្ថានភាព' },
    showing: { en: 'Showing', kh: 'បង្ហាញ' },
    of: { en: 'of', kh: 'ក្នុងចំណោម' },
    suppliersWord: { en: 'suppliers', kh: 'អ្នកផ្គត់ផ្គង់' },
    selected: { en: 'selected', kh: 'បានជ្រើសរើស' },
    noResults: { en: 'No suppliers match your filters.', kh: 'គ្មានអ្នកផ្គត់ផ្គង់ត្រូវនឹងការត្រងទេ។' },
    prev: { en: 'Previous', kh: 'មុន' },
    next: { en: 'Next', kh: 'បន្ទាប់' },
    edit: { en: 'Edit', kh: 'កែប្រែ' },
    delete: { en: 'Delete', kh: 'លុប' },
    deleteTitle: { en: 'Delete Supplier', kh: 'លុបអ្នកផ្គត់ផ្គង់' },
    deleteConfirm: { en: 'Yes, Delete', kh: 'បាទ/ចាស, លុប' },
    deleting: { en: 'Deleting…', kh: 'កំពុងលុប…' },
    importOk: { en: 'imported', kh: 'បាននាំចូល' },
    importFail: { en: 'failed', kh: 'បរាជ័យ' },
    // form modal
    newTitle: { en: 'New Supplier', kh: 'អ្នកផ្គត់ផ្គង់ថ្មី' },
    editTitle: { en: 'Edit Supplier', kh: 'កែប្រែអ្នកផ្គត់ផ្គង់' },
    autoCode: { en: 'AUTO', kh: 'ស្វ័យប្រវត្តិ' },
    codeLabel: { en: 'Code', kh: 'កូដ' },
    codeHint: { en: 'Leave blank to auto-generate (SP-0001…)', kh: 'ទុកទំនេរដើម្បីបង្កើតស្វ័យប្រវត្តិ (SP-0001…)' },
    nameLabel: { en: 'Supplier Name *', kh: 'ឈ្មោះអ្នកផ្គត់ផ្គង់ *' },
    namePh: { en: 'e.g. Siem Reap Farms', kh: 'ឧ. ក្រុមហ៊ុនសៀមរាប' },
    nameKhLabel: { en: 'Second Language', kh: 'ភាសាទី២' },
    groupLabel: { en: 'Supplier Group', kh: 'ក្រុមអ្នកផ្គត់ផ្គង់' },
    taxLabel: { en: 'Tax N', kh: 'លេខអាករ' },
    termLabel: { en: 'Payment Term', kh: 'លក្ខខណ្ឌទូទាត់' },
    poTemplateLabel: { en: 'PO Template Name', kh: 'ឈ្មោះគំរូ PO' },
    shipmentLabel: { en: 'Shipment Method', kh: 'វិធីដឹកជញ្ជូន' },
    personLabel: { en: 'Purchase Person', kh: 'អ្នកទីផ្សារទិញ' },
    conditionLabel: { en: 'Terms and Condition', kh: 'លក្ខខណ្ឌនិងកិច្ចសន្យា' },
    billTemplateLabel: { en: 'Bill Template Name', kh: 'ឈ្មោះគំរូវិក្កយបត្រ' },
    selectPlaceholder: { en: '— Select —', kh: '— ជ្រើសរើស —' },
    activeLabel: { en: 'Active', kh: 'ដំណើរការ' },
    balanceLabel: { en: 'Current Balance', kh: 'សមតុល្យបច្ចុប្បន្ន' },
    balancePh: { en: '0.00', kh: '0.00' },
    debitTermLabel: { en: 'Debit/ Deposit Payment Term', kh: 'លក្ខខណ្ឌទូទាត់បញ្ជី / ប្រាកដប្រកាន' },
    // contact / location sub-sections
    contactInfo: { en: 'Contact Information', kh: 'ព័ត៌មានទំនាក់ទំនង' },
    locationInfo: { en: 'Location Information', kh: 'ព័ត៌មានទីតាំង' },
    supplierHistory: { en: 'Supplier History', kh: 'ប្រវត្តិអ្នកផ្គត់ផ្គង់' },
    transactionInfo: { en: 'Transaction Information', kh: 'ព័ត៌មានប្រតិបត្តិការ' },
    debitDeposit: { en: 'Debit / Deposit', kh: 'បញ្ជី / ប្រាក់ដាក់' },
    addBtn: { en: 'Add +', kh: 'បន្ថែម +' },
    defaultCol: { en: 'Default', kh: 'លំនាំដើម' },
    firstNameCol: { en: 'First Name', kh: 'ឈ្មោះ' },
    lastNameCol: { en: 'Last Name', kh: 'អតីតនាម' },
    genderCol: { en: 'Gender', kh: 'ភេទ' },
    descriptionCol: { en: 'Description', kh: 'ការពិពណ៌នា' },
    addressCol: { en: 'Address', kh: 'អាសយដ្ឋាន' },
    cityCol: { en: 'City', kh: 'ក្រុង' },
    stateCol: { en: 'State', kh: 'រដ្ឋ' },
    countryCol: { en: 'Country', kh: 'ប្រទេស' },
    actionsCol: { en: 'Actions', kh: 'សកម្មភាព' },
    noContacts: { en: 'No contacts yet — click "Add +" to create one.', kh: 'មិនមានទំនាក់ទំនងទេ — ចុច "បន្ថែម +" ដើម្បីបង្កើត។' },
    noAddresses: { en: 'No locations yet — click "Add +" to create one.', kh: 'មិនមានទីតាំងទេ — ចុច "បន្ថែម +" ដើម្បីបង្កើត។' },
    newContactTitle: { en: 'New Contact', kh: 'ទំនាក់ទំនងថ្មី' },
    editContactTitle: { en: 'Edit Contact', kh: 'កែប្រែទំនាក់ទំនង' },
    newAddressTitle: { en: 'New Location', kh: 'ទីតាំងថ្មី' },
    editAddressTitle: { en: 'Edit Location', kh: 'កែប្រែទីតាំង' },
    add: { en: 'Add', kh: 'បន្ថែម' },
    firstNameLabel: { en: 'First Name *', kh: 'ឈ្មោះ *' },
    lastNameLabel: { en: 'Last Name *', kh: 'អតីតនាម *' },
    genderLabel: { en: 'Gender', kh: 'ភេទ' },
    dobLabel: { en: 'Date of Birth', kh: 'ថ្ងៃកំណើត' },
    phoneLabel: { en: 'Phone', kh: 'ទូរស័ព្ទ' },
    mobileLabel: { en: 'Mobile', kh: 'ទូរស័ព្ទដៃ' },
    emailLabel: { en: 'Email', kh: 'អ៊ីមែល' },
    websiteLabel: { en: 'Website', kh: 'គេហទំព័រ' },
    descLabel: { en: 'Description *', kh: 'ការពិពណ៌នា *' },
    secondLangLabel: { en: 'Second Language', kh: 'ភាសាទី២' },
    addressLabel: { en: 'Address', kh: 'អាសយដ្ឋាន' },
    address2Label: { en: 'Address 2', kh: 'អាសយដ្ឋាន ២' },
    phoneExtLabel: { en: 'Phone Ext', kh: 'ចម្រៀកទូរស័ព្ទ' },
    faxLabel: { en: 'Fax', kh: 'ផាក់ស៍' },
    faxExtLabel: { en: 'Fax Ext', kh: 'ចម្រៀក Fax' },
    stateLabel: { en: 'State / Province', kh: 'រដ្ឋ / ខេត្ត' },
    cityLabel: { en: 'City', kh: 'ក្រុង' },
    searchPh: { en: 'Search…', kh: 'ស្វែងរក…' },
    save: { en: 'Save', kh: 'រក្សាទុក' },
    saving: { en: 'Saving…', kh: 'កំពុងរក្សាទុក…' },
    clickToEdit: { en: 'Click to edit this supplier', kh: 'ចុចដើម្បីកែប្រែអ្នកផ្គត់ផ្គង់នេះ' },
  }

  // shared dark select styling — green focus ring
  const selectCls = 'w-full rounded-lg border border-slate-700/70 bg-slate-950/60 px-3 py-2.5 text-sm font-medium text-white outline-none transition focus:border-green-400 focus:bg-slate-950 focus:ring-4 focus:ring-green-500/10 hover:border-slate-600'
  const ghostBtnCls = 'inline-flex items-center justify-center gap-2 rounded-lg border border-slate-700 px-3.5 py-2.5 text-xs font-bold text-slate-300 transition hover:border-slate-600 hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-40'
  const inputCls = 'w-full rounded-lg border border-slate-700/70 bg-slate-950/60 px-3 py-2.5 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-green-400 focus:bg-slate-950 focus:ring-4 focus:ring-green-500/10'
  const fieldLabelCls = 'mb-1.5 block text-xs font-bold uppercase tracking-wide text-slate-400'

  // cell renderer per column key (used by both thead labels and tbody cells)
  const renderCell = (item, key) => {
    switch (key) {
      case 'contactName':
        return (
          <button type="button" onClick={() => openEdit(item)} className="text-left" title={TEXTS.clickToEdit[lang]}>
            <span className="block max-w-[220px] truncate font-semibold text-white">
              {[item.contactFirstName, item.contactLastName].filter(Boolean).join(' ') || item.name || '—'}
            </span>
            {item.name && (
              <span className="block max-w-[220px] truncate font-mono text-xs text-slate-500">{item.code || `#${item.id}`}</span>
            )}
          </button>
        )
      case 'address': {
        const full = [item.addressLine1, item.addressCity, item.addressState, item.addressCountry].filter(Boolean).join(', ')
        return <span className="block max-w-[260px] truncate text-slate-400">{full || '—'}</span>
      }
      case 'currentBalance': {
        if (item.currentBalance === '' || item.currentBalance == null) return <span className="text-slate-400">—</span>
        const num = Number(item.currentBalance)
        return (
          <span className="font-semibold tabular-nums" style={{ color: num < 0 ? '#FB7185' : GREEN }}>
            ${num.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
        )
      }
      case 'active': {
        const meta = STATUS_META[item.active ? 'active' : 'inactive']
        return (
          <span className="inline-block rounded-full px-2.5 py-1 text-[11px] font-bold" style={{ backgroundColor: meta.bg, color: meta.color }}>
            {meta.label[lang]}
          </span>
        )
      }
      default: {
        const def = COLUMN_DEFS.find((c) => c.key === key)
        const sourceKey = def?.derivedKey || key
        const value = def?.bool ? (item[sourceKey] ? '✓' : '✗') : (item[sourceKey] ?? '')
        return (
          <span className={def?.bool ? 'font-semibold' : 'text-slate-400'} style={def?.bool ? { color: item[sourceKey] ? GREEN : '#FB7185' } : undefined}>
            {value || '—'}
          </span>
        )
      }
    }
  }

  // columns actually rendered: the user-picked defs (Active renders as a pill)
  const activeCols = COLUMN_DEFS.filter((c) => visibleCols.has(c.key))

  return (
    <div className="space-y-5">
      {/* Page header */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <Link to="/admin/products" className="mb-2 inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-[0.16em] text-green-400 transition hover:text-green-300">
            <ChevronLeftIcon /> {TEXTS.back[lang]}
          </Link>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-extrabold tracking-tight text-white md:text-3xl">{TEXTS.heroTitle[lang]}</h1>
            <span
              className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-bold"
              style={source === 'live'
                ? { backgroundColor: 'rgba(119,188,31,0.15)', color: GREEN }
                : { backgroundColor: 'rgba(255,153,0,0.15)', color: ORANGE }}
            >
              ● {source === 'live' ? TEXTS.liveData[lang] : TEXTS.demoData[lang]}
            </span>
          </div>
          <p className="mt-1 max-w-2xl text-sm text-slate-400">{TEXTS.heroSub[lang]}</p>
        </div>
        {/* Import / Template / Export / Create */}
        <div className="flex flex-wrap items-center gap-2">
          <input ref={importRef} type="file" accept=".xlsx,.xls,.csv" onChange={handleImportFile} className="hidden" />
          <button type="button" onClick={() => importRef.current?.click()} disabled={importing} className={ghostBtnCls}>
            <UploadIcon /> {importing ? TEXTS.importing[lang] : TEXTS.importBtn[lang]}
          </button>
          <button type="button" onClick={exportTemplate} className={ghostBtnCls}>
            <TemplateIcon /> {TEXTS.templateBtn[lang]}
          </button>
          <button type="button" onClick={exportCurrent} className={ghostBtnCls}>
            <DownloadIcon /> {TEXTS.exportBtn[lang]}
          </button>
          <button
            type="button"
            onClick={openCreate}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-green-500 px-5 py-2.5 text-sm font-black text-slate-950 shadow-lg shadow-green-500/20 transition hover:-translate-y-0.5 hover:bg-green-400"
          >
            <PlusIcon /> {TEXTS.createBtn[lang]}
          </button>
        </div>
      </div>

      {/* Import result banner */}
      {importResult && (
        <div className={`rounded-xl border px-4 py-3 text-sm ${importResult.fail > 0 ? 'border-orange-500/40 bg-orange-500/10' : 'border-green-500/40 bg-green-500/10'}`}>
          <p className="font-bold" style={{ color: importResult.fail > 0 ? ORANGE : GREEN }}>
            ✓ {importResult.ok} {TEXTS.importOk[lang]} · {importResult.fail} {TEXTS.importFail[lang]}
          </p>
          {importResult.errors.length > 0 && (
            <ul className="mt-1 space-y-0.5 text-xs text-slate-400">
              {importResult.errors.map((err, i) => <li key={i}>• {err}</li>)}
            </ul>
          )}
        </div>
      )}

      {/* KPI widgets */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {kpis.map((kpi) => (
          <button
            key={kpi.key}
            type="button"
            onClick={() => onKpiClick(kpi.key)}
            disabled={!kpi.clickable}
            className={`flex items-center gap-4 rounded-2xl border border-slate-700/60 bg-slate-900/80 p-5 text-left shadow-xl shadow-black/20 transition ${kpi.clickable ? 'cursor-pointer hover:-translate-y-0.5 hover:border-green-500/40' : 'cursor-default'}`}
          >
            <span
              className="flex h-12 w-12 min-w-[48px] items-center justify-center rounded-xl"
              style={{
                backgroundColor:
                  kpi.tone === 'red' ? 'rgba(244,63,94,0.15)'
                    : kpi.tone === 'navy' ? 'rgba(148,163,184,0.12)'
                      : kpi.tone === 'lime' ? 'rgba(163,230,53,0.12)'
                        : 'rgba(119,188,31,0.15)',
                color:
                  kpi.tone === 'red' ? '#FB7185'
                    : kpi.tone === 'navy' ? '#CBD5E1'
                      : kpi.tone === 'lime' ? '#A3E635'
                        : GREEN,
              }}
            >
              {kpi.icon}
            </span>
            <span className="min-w-0">
              <span className="block truncate text-2xl font-extrabold leading-tight text-white">{kpi.value}</span>
              <span className="block text-xs font-semibold text-slate-400">{kpi.label[lang]}</span>
            </span>
          </button>
        ))}
      </div>

      {/* Data table card */}
      <section className="overflow-hidden rounded-2xl border border-slate-700/60 bg-slate-900/80 shadow-xl shadow-black/20">
        {/* Filter bar */}
        <div className="flex flex-col gap-3 border-b border-slate-700/60 p-4 lg:flex-row lg:items-center">
          {/* Search By dropdown */}
          <select
            value={searchBy}
            onChange={(e) => setSearchBy(e.target.value)}
            aria-label={TEXTS.searchByLabel[lang]}
            className={`${selectCls} w-full sm:w-auto sm:min-w-[130px]`}
          >
            <option value="name">{TEXTS.searchByLabel[lang]}: {TEXTS.byName[lang]}</option>
            <option value="code">{TEXTS.searchByLabel[lang]}: {TEXTS.byCode[lang]}</option>
            <option value="group">{TEXTS.searchByLabel[lang]}: {TEXTS.byGroup[lang]}</option>
            <option value="tax">{TEXTS.searchByLabel[lang]}: {TEXTS.byTax[lang]}</option>
            <option value="person">{TEXTS.searchByLabel[lang]}: {TEXTS.byPerson[lang]}</option>
          </select>

          {/* Search input */}
          <div className="relative min-w-0 flex-1">
            <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500"><SearchIcon /></span>
            <input
              type="text"
              value={query}
              onChange={(e) => { setQuery(e.target.value); setPage(1) }}
              placeholder={TEXTS.searchPlaceholder[lang]}
              className="w-full rounded-lg border border-slate-700/70 bg-slate-950/60 py-2.5 pl-10 pr-4 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-green-400 focus:bg-slate-950 focus:ring-4 focus:ring-green-500/10"
            />
          </div>

          {/* Status dropdown */}
          <select
            value={status}
            onChange={(e) => { setStatus(e.target.value); setPage(1) }}
            aria-label={TEXTS.colStatus[lang]}
            className={`${selectCls} w-full sm:w-auto sm:min-w-[140px]`}
          >
            <option value="all">{TEXTS.allStatus[lang]}</option>
            <option value="active">{STATUS_META.active.label[lang]}</option>
            <option value="inactive">{STATUS_META.inactive.label[lang]}</option>
          </select>

          {/* Advanced filters toggle + active-count badge */}
          <button
            type="button"
            onClick={() => setShowAdvanced((v) => !v)}
            aria-expanded={showAdvanced}
            className={`inline-flex items-center justify-center gap-2 rounded-lg border px-4 py-2.5 text-sm font-bold transition ${showAdvanced || activeFilterCount > 0 ? 'border-green-400 text-green-300' : 'border-slate-700 text-slate-300 hover:border-slate-600 hover:bg-slate-800'}`}
          >
            <FunnelIcon /> {TEXTS.filters[lang]}
            {activeFilterCount > 0 && (
              <span className="rounded-full bg-green-500 px-1.5 py-0.5 text-[10px] font-black leading-none text-slate-950">{activeFilterCount}</span>
            )}
          </button>

          {/* Choose Column trigger */}
          <button type="button" onClick={openColModal} title={TEXTS.chooseColumn[lang]} className={ghostBtnCls}>
            <ColumnsIcon /> <span className="hidden xl:inline">{TEXTS.chooseColumn[lang]}</span>
          </button>
        </div>

        {/* Advanced filter panel */}
        {showAdvanced && (
          <div className="border-b border-slate-700/60 bg-slate-800/30 p-4">
            <div className="mb-3 flex items-center justify-between">
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">{TEXTS.filters[lang]}</p>
              <button
                type="button"
                onClick={clearFilters}
                className="text-xs font-bold underline-offset-2 transition hover:underline"
                style={{ color: ORANGE }}
              >
                {TEXTS.clearFilters[lang]}
              </button>
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <label className="block space-y-1.5">
                <span className={fieldLabelCls}>{TEXTS.groupLabel[lang]}</span>
                <select value={group} onChange={(e) => { setGroup(e.target.value); setPage(1) }} className={selectCls}>
                  <option value="all">{TEXTS.allGroups[lang]}</option>
                  {[...new Set([...groupOptions, ...uniqueValues('supplierGroup')])].map((v) => (
                    <option key={v} value={v}>{v}</option>
                  ))}
                </select>
              </label>
              <label className="block space-y-1.5">
                <span className={fieldLabelCls}>{TEXTS.termLabel[lang]}</span>
                <select value={paymentTerm} onChange={(e) => { setPaymentTerm(e.target.value); setPage(1) }} className={selectCls}>
                  <option value="all">{TEXTS.allTerms[lang]}</option>
                  {uniqueValues('paymentTerm').map((v) => <option key={v} value={v}>{v}</option>)}
                </select>
              </label>
              <label className="block space-y-1.5">
                <span className={fieldLabelCls}>{TEXTS.personLabel[lang]}</span>
                <select value={person} onChange={(e) => { setPerson(e.target.value); setPage(1) }} className={selectCls}>
                  <option value="all">{TEXTS.allPersons[lang]}</option>
                  {uniqueValues('purchasePerson').map((v) => <option key={v} value={v}>{v}</option>)}
                </select>
              </label>
            </div>
          </div>
        )}

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead>
              <tr className="border-b border-slate-700/60 bg-slate-800/40 text-xs font-bold uppercase tracking-wide text-slate-500">
                <th className="w-12 px-4 py-3">
                  <input
                    type="checkbox"
                    checked={allOnPageSelected}
                    onChange={toggleAllOnPage}
                    aria-label={lang === 'en' ? 'Select all on page' : 'ជ្រើសរើសទាំងអស់'}
                    className="h-4 w-4 cursor-pointer rounded accent-green-500"
                  />
                </th>
                {activeCols.map((col) => (
                  <th key={col.key} className="whitespace-nowrap px-3 py-3">
                    {typeof col.label === 'object' ? col.label[lang] : col.label}
                  </th>
                ))}
                <th className="w-20 px-3 py-3" />
              </tr>
            </thead>
            <tbody>
              {tableRows.length === 0 ? (
                <tr>
                  <td colSpan={2 + activeCols.length} className="px-4 py-16 text-center">
                    <span className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-slate-800 text-slate-500"><SearchIcon /></span>
                    <p className="text-sm text-slate-400">{TEXTS.noResults[lang]}</p>
                  </td>
                </tr>
              ) : (
                tableRows.map((item) => {
                  const idStr = String(item.id)
                  return (
                    <tr key={item.id} className={`border-b border-slate-800/60 transition last:border-0 ${selected.has(idStr) ? 'bg-green-500/[0.06]' : 'hover:bg-slate-800/40'}`}>
                      <td className="px-4 py-3">
                        <input
                          type="checkbox"
                          checked={selected.has(idStr)}
                          onChange={() => toggleOne(idStr)}
                          aria-label={(lang === 'en' ? 'Select ' : 'ជ្រើសរើស ') + (item.name || '')}
                          className="h-4 w-4 cursor-pointer rounded accent-green-500"
                        />
                      </td>
                      {activeCols.map((col) => (
                        <td key={col.key} className="whitespace-nowrap px-3 py-3">
                          {renderCell(item, col.key)}
                        </td>
                      ))}
                      <td className="px-3 py-3">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            type="button"
                            onClick={() => openEdit(item)}
                            aria-label={TEXTS.edit[lang]}
                            title={TEXTS.edit[lang]}
                            className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 transition hover:bg-slate-800 hover:text-green-300"
                          >
                            <EditIcon />
                          </button>
                          <button
                            type="button"
                            onClick={() => askDelete(item)}
                            aria-label={TEXTS.delete[lang]}
                            title={TEXTS.delete[lang]}
                            className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 transition hover:bg-red-500/10 hover:text-red-400"
                          >
                            <TrashIcon />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination counts the rows actually displayed */}
        <div className="flex flex-col gap-3 border-t border-slate-700/60 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-slate-500">
            {tableRows.length > 0 || filtered.length > 0
              ? `${TEXTS.showing[lang]} ${(safePage - 1) * PAGE_SIZE + 1}–${Math.min(safePage * PAGE_SIZE, advancedActive ? furtherFiltered.length : filtered.length)} ${TEXTS.of[lang]} ${advancedActive ? furtherFiltered.length : filtered.length} ${TEXTS.suppliersWord[lang]}`
              : ''}
            {selected.size > 0 && (
              <span className="ml-2 inline-block rounded-full px-2 py-0.5 text-[11px] font-bold" style={{ backgroundColor: 'rgba(119,188,31,0.15)', color: GREEN }}>
                {selected.size} {TEXTS.selected[lang]}
              </span>
            )}
          </p>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={safePage <= 1}
              className="rounded-lg border border-slate-700 px-3 py-1.5 text-xs font-semibold text-slate-300 transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {TEXTS.prev[lang]}
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1)
              .filter((n) => n === 1 || n === totalPages || Math.abs(n - safePage) <= 1)
              .map((n, idx, arr) => (
                <span key={n} className="flex items-center gap-1.5">
                  {idx > 0 && arr[idx - 1] !== n - 1 && <span className="px-0.5 text-xs text-slate-600">…</span>}
                  <button
                    type="button"
                    onClick={() => setPage(n)}
                    aria-current={safePage === n ? 'page' : undefined}
                    className={`h-8 min-w-8 rounded-lg px-2 text-xs font-bold transition ${
                      safePage === n
                        ? 'bg-green-500 text-slate-950 shadow-md shadow-green-500/20'
                        : 'border border-slate-700 text-slate-300 hover:bg-slate-800'
                    }`}
                  >
                    {n}
                  </button>
                </span>
              ))}
            <button
              type="button"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={safePage >= totalPages}
              className="rounded-lg border border-slate-700 px-3 py-1.5 text-xs font-semibold text-slate-300 transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {TEXTS.next[lang]}
            </button>
          </div>
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
            aria-label={TEXTS.chooseColumn[lang]}
            className="max-h-[85vh] w-full max-w-xl overflow-hidden rounded-2xl border border-slate-700 bg-slate-900 shadow-2xl shadow-black/40"
            onClick={(e) => e.stopPropagation()}
          >
            {/* header */}
            <div className="flex items-center justify-between border-b border-slate-700/60 px-5 py-4">
              <h3 className="text-base font-extrabold text-white">{TEXTS.chooseColumn[lang]}</h3>
              <button
                type="button"
                onClick={() => setShowColModal(false)}
                aria-label={TEXTS.cancel[lang]}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 transition hover:bg-slate-800 hover:text-white"
              >
                <XSmallIcon />
              </button>
            </div>

            {/* checkbox grid */}
            <div className="grid max-h-[55vh] grid-cols-1 gap-x-6 gap-y-1 overflow-y-auto p-5 sm:grid-cols-2">
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
                title={TEXTS.resetCols[lang]}
                className="inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-bold transition hover:bg-slate-800"
                style={{ color: ORANGE }}
              >
                <ResetIcon /> {TEXTS.resetCols[lang]}
              </button>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setShowColModal(false)}
                  className="rounded-lg border border-slate-700 px-5 py-2 text-sm font-bold text-slate-300 transition hover:bg-slate-800"
                >
                  {TEXTS.cancel[lang]}
                </button>
                <button
                  type="button"
                  onClick={applyColumns}
                  className="rounded-lg bg-green-500 px-5 py-2 text-sm font-black text-slate-950 shadow-md shadow-green-500/20 transition hover:bg-green-400"
                >
                  {TEXTS.apply[lang]}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Create / Edit modal */}
      {showForm && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
          onClick={() => setShowForm(false)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-label={form.id ? TEXTS.editTitle[lang] : TEXTS.newTitle[lang]}
            className="max-h-[88vh] w-full max-w-2xl overflow-hidden rounded-2xl border border-slate-700 bg-slate-900 shadow-2xl shadow-black/40"
            onClick={(e) => e.stopPropagation()}
          >
            <form onSubmit={saveForm} className="flex max-h-[88vh] flex-col">
              {/* header */}
              <div className="flex items-center justify-between border-b border-slate-700/60 px-5 py-4">
                <h3 className="text-base font-extrabold text-white">{form.id ? TEXTS.editTitle[lang] : TEXTS.newTitle[lang]}</h3>
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  aria-label={TEXTS.cancel[lang]}
                  className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 transition hover:bg-slate-800 hover:text-white"
                >
                  <XSmallIcon />
                </button>
              </div>

              {/* fields */}
              <div className="grid flex-1 grid-cols-1 gap-4 overflow-y-auto p-5 sm:grid-cols-2">
                {/* Code — auto-generated unless filled */}
                <label className="block space-y-1.5">
                  <span className={fieldLabelCls}>{TEXTS.codeLabel[lang]}</span>
                  <div className="relative">
                    <input
                      type="text"
                      value={form.code}
                      onChange={(e) => setField('code', e.target.value)}
                      placeholder="SP-0001"
                      className={`${inputCls} pr-14 font-mono`}
                    />
                    {!form.code.trim() && (
                      <span className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full px-2 py-0.5 text-[10px] font-black tracking-wide" style={{ backgroundColor: 'rgba(255,153,0,0.15)', color: ORANGE }}>
                        {TEXTS.autoCode[lang]}
                      </span>
                    )}
                  </div>
                  <span className="block text-[11px] text-slate-500">{TEXTS.codeHint[lang]}</span>
                </label>

                {/* Supplier Name — the one required textbox */}
                <label className="block space-y-1.5">
                  <span className={fieldLabelCls}>{TEXTS.nameLabel[lang]}</span>
                  <input
                    type="text"
                    required
                    value={form.name}
                    onChange={(e) => setField('name', e.target.value)}
                    placeholder={TEXTS.namePh[lang]}
                    className={inputCls}
                  />
                </label>

                {/* Supplier Group — dropdown fed by the Suppliers Group master data */}
                <label className="block space-y-1.5">
                  <span className={fieldLabelCls}>{TEXTS.groupLabel[lang]}</span>
                  <select
                    value={form.supplierGroup}
                    onChange={(e) => setField('supplierGroup', e.target.value)}
                    className={selectCls}
                  >
                    <option value="">{TEXTS.selectPlaceholder[lang]}</option>
                    {groupOptions.map((v) => (
                      <option key={v} value={v}>{v}</option>
                    ))}
                  </select>
                </label>

                {/* Tax N — textbox */}
                <label className="block space-y-1.5">
                  <span className={fieldLabelCls}>{TEXTS.taxLabel[lang]}</span>
                  <input
                    type="text"
                    value={form.taxNumber}
                    onChange={(e) => setField('taxNumber', e.target.value)}
                    placeholder="TIN-00123"
                    className={inputCls}
                  />
                </label>

                {/* Payment Term — dropdown */}
                <label className="block space-y-1.5">
                  <span className={fieldLabelCls}>{TEXTS.termLabel[lang]}</span>
                  <select
                    value={form.paymentTerm}
                    onChange={(e) => setField('paymentTerm', e.target.value)}
                    className={selectCls}
                  >
                    <option value="">{TEXTS.selectPlaceholder[lang]}</option>
                    {PAYMENT_TERM_OPTIONS.map((v) => <option key={v} value={v}>{v}</option>)}
                  </select>
                </label>

                {/* PO Template Name — dropdown */}
                <label className="block space-y-1.5">
                  <span className={fieldLabelCls}>{TEXTS.poTemplateLabel[lang]}</span>
                  <select
                    value={form.poTemplateName}
                    onChange={(e) => setField('poTemplateName', e.target.value)}
                    className={selectCls}
                  >
                    <option value="">{TEXTS.selectPlaceholder[lang]}</option>
                    {PO_TEMPLATE_OPTIONS.map((v) => <option key={v} value={v}>{v}</option>)}
                  </select>
                </label>

                {/* Shipment Method — dropdown */}
                <label className="block space-y-1.5">
                  <span className={fieldLabelCls}>{TEXTS.shipmentLabel[lang]}</span>
                  <select
                    value={form.shipmentMethod}
                    onChange={(e) => setField('shipmentMethod', e.target.value)}
                    className={selectCls}
                  >
                    <option value="">{TEXTS.selectPlaceholder[lang]}</option>
                    {SHIPMENT_METHOD_OPTIONS.map((v) => <option key={v} value={v}>{v}</option>)}
                  </select>
                </label>

                {/* Purchase Person — textbox */}
                <label className="block space-y-1.5">
                  <span className={fieldLabelCls}>{TEXTS.personLabel[lang]}</span>
                  <input
                    type="text"
                    value={form.purchasePerson}
                    onChange={(e) => setField('purchasePerson', e.target.value)}
                    className={inputCls}
                  />
                </label>

                {/* Terms and Condition — dropdown */}
                <label className="block space-y-1.5">
                  <span className={fieldLabelCls}>{TEXTS.conditionLabel[lang]}</span>
                  <select
                    value={form.termCondition}
                    onChange={(e) => setField('termCondition', e.target.value)}
                    className={selectCls}
                  >
                    <option value="">{TEXTS.selectPlaceholder[lang]}</option>
                    {TERM_CONDITION_OPTIONS.map((v) => <option key={v} value={v}>{v}</option>)}
                  </select>
                </label>

                {/* Bill Template Name — dropdown */}
                <label className="block space-y-1.5">
                  <span className={fieldLabelCls}>{TEXTS.billTemplateLabel[lang]}</span>
                  <select
                    value={form.billTemplateName}
                    onChange={(e) => setField('billTemplateName', e.target.value)}
                    className={selectCls}
                  >
                    <option value="">{TEXTS.selectPlaceholder[lang]}</option>
                    {BILL_TEMPLATE_OPTIONS.map((v) => <option key={v} value={v}>{v}</option>)}
                  </select>
                </label>

                {/* Current Balance — number textbox */}
                <label className="block space-y-1.5">
                  <span className={fieldLabelCls}>{TEXTS.balanceLabel[lang]}</span>
                  <input
                    type="number"
                    step="0.01"
                    value={form.currentBalance}
                    onChange={(e) => setField('currentBalance', e.target.value)}
                    placeholder={TEXTS.balancePh[lang]}
                    className={inputCls}
                  />
                </label>

                {/* Debit / Deposit Payment Term — dropdown */}
                <label className="block space-y-1.5">
                  <span className={fieldLabelCls}>{TEXTS.debitTermLabel[lang]}</span>
                  <select
                    value={form.debitDepositPaymentTerm}
                    onChange={(e) => setField('debitDepositPaymentTerm', e.target.value)}
                    className={selectCls}
                  >
                    <option value="">{TEXTS.selectPlaceholder[lang]}</option>
                    {DEBIT_TERM_OPTIONS.map((v) => <option key={v} value={v}>{v}</option>)}
                  </select>
                </label>

                {/* Second Language — textbox */}
                <label className="block space-y-1.5">
                  <span className={fieldLabelCls}>{TEXTS.nameKhLabel[lang]}</span>
                  <input
                    type="text"
                    value={form.nameKh}
                    onChange={(e) => setField('nameKh', e.target.value)}
                    className={inputCls}
                  />
                </label>

                {/* Active toggle */}
                <label className="flex cursor-pointer items-center justify-between gap-4 rounded-xl border border-slate-700/70 bg-slate-950/40 px-4 py-3 sm:col-span-2">
                  <span>
                    <span className="block text-sm font-bold text-white">{TEXTS.activeLabel[lang]}</span>
                    <span className="block text-[11px] text-slate-500">{form.active ? '✓' : '✗'} {STATUS_META[form.active ? 'active' : 'inactive'].label[lang]}</span>
                  </span>
                  <span className="relative inline-flex">
                    <input
                      type="checkbox"
                      checked={form.active}
                      onChange={(e) => setField('active', e.target.checked)}
                      className="peer sr-only"
                    />
                    <span className="h-6 w-11 rounded-full bg-slate-700 transition peer-checked:bg-green-500 peer-focus-visible:ring-4 peer-focus-visible:ring-green-500/30" />
                    <span className="pointer-events-none absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white shadow transition peer-checked:translate-x-5" />
                  </span>
                </label>

                {/* ---- Contact Information sub-section ---- */}
                <div className="rounded-xl border border-slate-700/60 bg-slate-950/40 sm:col-span-2">
                  <div className="flex items-center justify-between border-b border-slate-700/60 px-4 py-3">
                    <h4 className="text-sm font-extrabold text-white flex items-center gap-2">
                      <ContactIcon /> {TEXTS.contactInfo[lang]}
                      <span className="rounded-full bg-slate-800 px-2 py-0.5 text-[10px] font-black text-slate-400">{form.contacts.length}</span>
                    </h4>
                    <button type="button" onClick={() => openContactModal(null)} className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-bold transition hover:bg-slate-800" style={{ color: GREEN }}>
                      <PlusIcon /> {TEXTS.addBtn[lang]}
                    </button>
                  </div>
                  {/* mini table */}
                  {form.contacts.length === 0 ? (
                    <p className="px-4 py-6 text-center text-xs text-slate-500">{TEXTS.noContacts[lang]}</p>
                  ) : (
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className="border-b border-slate-800/80 text-[10px] uppercase tracking-wide text-slate-500">
                          <th className="px-4 py-2">{TEXTS.defaultCol[lang]}</th>
                          <th className="px-3 py-2">{TEXTS.firstNameCol[lang]}</th>
                          <th className="px-3 py-2">{TEXTS.lastNameCol[lang]}</th>
                          <th className="px-3 py-2">{TEXTS.genderCol[lang]}</th>
                          <th className="px-3 py-2">{TEXTS.phoneLabel[lang]}</th>
                          <th className="px-3 py-2">{TEXTS.emailLabel[lang]}</th>
                          <th className="px-3 py-2" />
                        </tr>
                      </thead>
                      <tbody>
                        {form.contacts.map((c) => (
                          <tr key={c.id} className="border-b border-slate-800/50 last:border-0">
                            <td className="px-4 py-2.5">
                              <input
                                type="radio"
                                name="default-contact"
                                checked={c.default}
                                onChange={() => setDefaultSub('contacts', c.id)}
                                aria-label={TEXTS.defaultCol[lang]}
                                className="h-3.5 w-3.5 cursor-pointer accent-green-500"
                              />
                            </td>
                            <td className="max-w-[100px] truncate px-3 py-2.5 font-semibold text-white">{c.firstName || '—'}</td>
                            <td className="max-w-[100px] truncate px-3 py-2.5 text-slate-300">{c.lastName || '—'}</td>
                            <td className="px-3 py-2.5 text-slate-300">{c.gender || '—'}</td>
                            <td className="px-3 py-2.5 text-slate-300">{c.phone || '—'}</td>
                            <td className="max-w-[140px] truncate px-3 py-2.5 text-slate-300">{c.email || '—'}</td>
                            <td className="whitespace-nowrap px-3 py-2.5 text-right">
                              <button type="button" onClick={() => openContactModal(c)} title={TEXTS.edit[lang]} className="mr-1 inline-flex h-7 w-7 items-center justify-center rounded-lg text-slate-500 transition hover:bg-slate-800 hover:text-green-300"><EditIcon /></button>
                              <button type="button" onClick={() => removeSub('contacts', c.id)} title={TEXTS.delete[lang]} className="inline-flex h-7 w-7 items-center justify-center rounded-lg text-slate-500 transition hover:bg-red-500/10 hover:text-red-400"><TrashIcon /></button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>

                {/* ---- Location Information sub-section ---- */}
                <div className="rounded-xl border border-slate-700/60 bg-slate-950/40 sm:col-span-2">
                  <div className="flex items-center justify-between border-b border-slate-700/60 px-4 py-3">
                    <h4 className="text-sm font-extrabold text-white flex items-center gap-2">
                      <PinIcon /> {TEXTS.locationInfo[lang]}
                      <span className="rounded-full bg-slate-800 px-2 py-0.5 text-[10px] font-black text-slate-400">{form.addresses.length}</span>
                    </h4>
                    <button type="button" onClick={() => openAddressModal(null)} className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-bold transition hover:bg-slate-800" style={{ color: GREEN }}>
                      <PlusIcon /> {TEXTS.addBtn[lang]}
                    </button>
                  </div>
                  {form.addresses.length === 0 ? (
                    <p className="px-4 py-6 text-center text-xs text-slate-500">{TEXTS.noAddresses[lang]}</p>
                  ) : (
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className="border-b border-slate-800/80 text-[10px] uppercase tracking-wide text-slate-500">
                          <th className="px-4 py-2">{TEXTS.defaultCol[lang]}</th>
                          <th className="px-3 py-2">{TEXTS.descriptionCol[lang]}</th>
                          <th className="px-3 py-2">{TEXTS.addressCol[lang]}</th>
                          <th className="px-3 py-2">{TEXTS.cityCol[lang]}</th>
                          <th className="px-3 py-2">{TEXTS.stateCol[lang]}</th>
                          <th className="px-3 py-2">{TEXTS.countryCol[lang]}</th>
                          <th className="px-3 py-2">{TEXTS.phoneLabel[lang]}</th>
                          <th className="px-3 py-2" />
                        </tr>
                      </thead>
                      <tbody>
                        {form.addresses.map((a) => (
                          <tr key={a.id} className="border-b border-slate-800/50 last:border-0">
                            <td className="px-4 py-2.5">
                              <input
                                type="radio"
                                name="default-address"
                                checked={a.default}
                                onChange={() => setDefaultSub('addresses', a.id)}
                                aria-label={TEXTS.defaultCol[lang]}
                                className="h-3.5 w-3.5 cursor-pointer accent-green-500"
                              />
                            </td>
                            <td className="max-w-[110px] truncate px-3 py-2.5 font-semibold text-white">{a.description || '—'}</td>
                            <td className="max-w-[160px] truncate px-3 py-2.5 text-slate-300">{a.line1 || '—'}</td>
                            <td className="px-3 py-2.5 text-slate-300">{a.city || '—'}</td>
                            <td className="px-3 py-2.5 text-slate-300">{a.state || '—'}</td>
                            <td className="whitespace-nowrap px-3 py-2.5 text-slate-300">
                              <span className="flex items-center gap-1.5">
                                <CountryFlag code={countryCodeOf(a.country)} className="h-3.5 w-5" />
                                {a.country || '—'}
                              </span>
                            </td>
                            <td className="px-3 py-2.5 text-slate-300">{a.phone || '—'}</td>
                            <td className="whitespace-nowrap px-3 py-2.5 text-right">
                              <button type="button" onClick={() => openAddressModal(a)} title={TEXTS.edit[lang]} className="mr-1 inline-flex h-7 w-7 items-center justify-center rounded-lg text-slate-500 transition hover:bg-slate-800 hover:text-green-300"><EditIcon /></button>
                              <button type="button" onClick={() => removeSub('addresses', a.id)} title={TEXTS.delete[lang]} className="inline-flex h-7 w-7 items-center justify-center rounded-lg text-slate-500 transition hover:bg-red-500/10 hover:text-red-400"><TrashIcon /></button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>

                {/* ---- Supplier History / Transaction Information ---- */}
                {form.id && (
                  <div className="rounded-xl border border-slate-700/60 bg-slate-950/40 sm:col-span-2">
                    <div className="flex items-center justify-between border-b border-slate-700/60 px-4 py-3">
                      <h4 className="text-sm font-extrabold text-white flex items-center gap-2">
                        <HistoryIcon /> {TEXTS.supplierHistory[lang]}
                        <span className="rounded-full bg-green-500/15 px-2 py-0.5 text-[10px] font-black" style={{ color: GREEN }}>{TEXTS.transactionInfo[lang]}</span>
                      </h4>
                    </div>
                    <div className="grid grid-cols-1 divide-y divide-slate-800/60 sm:grid-cols-2 sm:divide-x sm:divide-y-0">
                      {/* Current Balance */}
                      <div className="flex items-center justify-between gap-4 px-4 py-4">
                        <span className="text-xs font-bold uppercase tracking-wide text-slate-400">{TEXTS.balanceLabel[lang]}</span>
                        {(() => {
                          const bal = Number(form.currentBalance)
                          const has = form.currentBalance !== '' && form.currentBalance !== null && !Number.isNaN(bal)
                          return (
                            <span className="text-lg font-extrabold tabular-nums" style={{ color: !has ? '#64748B' : bal < 0 ? '#FB7185' : GREEN }}>
                              {has ? `$${bal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : '$0.00'}
                            </span>
                          )
                        })()}
                      </div>
                      {/* Debit / Deposit */}
                      <div className="flex items-center justify-between gap-4 px-4 py-4">
                        <span className="text-xs font-bold uppercase tracking-wide text-slate-400">{TEXTS.debitDeposit[lang]}</span>
                        <span className="text-lg font-extrabold tabular-nums text-white">
                          ${(Number(form.currentBalance) || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {formError && (
                  <p className="rounded-xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm font-semibold text-red-300 sm:col-span-2">
                    ⚠ {formError}
                  </p>
                )}
              </div>

              {/* footer actions */}
              <div className="flex items-center justify-end gap-3 border-t border-slate-700/60 px-5 py-4">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="rounded-lg border border-slate-700 px-5 py-2 text-sm font-bold text-slate-300 transition hover:bg-slate-800"
                >
                  {TEXTS.cancel[lang]}
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-lg bg-green-500 px-5 py-2 text-sm font-black text-slate-950 shadow-md shadow-green-500/20 transition hover:bg-green-400 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  {saving ? TEXTS.saving[lang] : TEXTS.save[lang]}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* New / Edit Contact modal (nested inside the supplier form) */}
      {contactModal && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
          onClick={() => setContactModal(null)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-label={contactModal.mode === 'edit' ? TEXTS.editContactTitle[lang] : TEXTS.newContactTitle[lang]}
            className="max-h-[85vh] w-full max-w-lg overflow-hidden rounded-2xl border border-slate-700 bg-slate-900 shadow-2xl shadow-black/40"
            onClick={(e) => e.stopPropagation()}
          >
            <form
              onSubmit={(e) => { e.preventDefault(); saveContactModal() }}
              className="flex max-h-[85vh] flex-col"
            >
              <div className="flex items-center justify-between border-b border-slate-700/60 px-5 py-4">
                <h3 className="text-base font-extrabold text-white">
                  {contactModal.mode === 'edit' ? TEXTS.editContactTitle[lang] : TEXTS.newContactTitle[lang]}
                </h3>
                <button type="button" onClick={() => setContactModal(null)} aria-label={TEXTS.cancel[lang]} className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 transition hover:bg-slate-800 hover:text-white">
                  <XSmallIcon />
                </button>
              </div>

              <div className="grid flex-1 grid-cols-1 gap-4 overflow-y-auto p-5 sm:grid-cols-2">
                <label className="block space-y-1.5">
                  <span className={fieldLabelCls}>{TEXTS.firstNameLabel[lang]}</span>
                  <input type="text" required value={contactDraft.firstName} onChange={(e) => setContactDraft((p) => ({ ...p, firstName: e.target.value }))} className={inputCls} />
                </label>
                <label className="block space-y-1.5">
                  <span className={fieldLabelCls}>{TEXTS.lastNameLabel[lang]}</span>
                  <input type="text" required value={contactDraft.lastName} onChange={(e) => setContactDraft((p) => ({ ...p, lastName: e.target.value }))} className={inputCls} />
                </label>
                <label className="block space-y-1.5">
                  <span className={fieldLabelCls}>{TEXTS.genderLabel[lang]}</span>
                  <select value={contactDraft.gender} onChange={(e) => setContactDraft((p) => ({ ...p, gender: e.target.value }))} className={selectCls}>
                    <option value="">{TEXTS.selectPlaceholder[lang]}</option>
                    {GENDER_OPTIONS.map((v) => <option key={v} value={v}>{v}</option>)}
                  </select>
                </label>
                <label className="block space-y-1.5">
                  <span className={fieldLabelCls}>{TEXTS.dobLabel[lang]}</span>
                  <input type="date" value={contactDraft.dob} onChange={(e) => setContactDraft((p) => ({ ...p, dob: e.target.value }))} className={inputCls} />
                </label>
                <label className="block space-y-1.5">
                  <span className={fieldLabelCls}>{TEXTS.phoneLabel[lang]}</span>
                  <input type="tel" value={contactDraft.phone} onChange={(e) => setContactDraft((p) => ({ ...p, phone: e.target.value }))} className={inputCls} />
                </label>
                <label className="block space-y-1.5">
                  <span className={fieldLabelCls}>{TEXTS.mobileLabel[lang]}</span>
                  <input type="tel" value={contactDraft.mobile} onChange={(e) => setContactDraft((p) => ({ ...p, mobile: e.target.value }))} className={inputCls} />
                </label>
                <label className="block space-y-1.5">
                  <span className={fieldLabelCls}>{TEXTS.emailLabel[lang]}</span>
                  <input type="email" value={contactDraft.email} onChange={(e) => setContactDraft((p) => ({ ...p, email: e.target.value }))} className={inputCls} />
                </label>
                <label className="block space-y-1.5">
                  <span className={fieldLabelCls}>{TEXTS.websiteLabel[lang]}</span>
                  <input type="url" placeholder="https://" value={contactDraft.website} onChange={(e) => setContactDraft((p) => ({ ...p, website: e.target.value }))} className={inputCls} />
                </label>
              </div>

              <div className="flex items-center justify-end gap-3 border-t border-slate-700/60 px-5 py-4">
                <button type="button" onClick={() => setContactModal(null)} className="rounded-lg border border-slate-700 px-5 py-2 text-sm font-bold text-slate-300 transition hover:bg-slate-800">
                  {TEXTS.cancel[lang]}
                </button>
                <button type="submit" className="rounded-lg bg-green-500 px-5 py-2 text-sm font-black text-slate-950 shadow-md shadow-green-500/20 transition hover:bg-green-400">
                  {TEXTS.add[lang]}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* New / Edit Location modal (nested inside the supplier form) */}
      {addressModal && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
          onClick={() => setAddressModal(null)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-label={addressModal.mode === 'edit' ? TEXTS.editAddressTitle[lang] : TEXTS.newAddressTitle[lang]}
            className="max-h-[85vh] w-full max-w-xl overflow-hidden rounded-2xl border border-slate-700 bg-slate-900 shadow-2xl shadow-black/40"
            onClick={(e) => e.stopPropagation()}
          >
            <form
              onSubmit={(e) => { e.preventDefault(); saveAddressModal() }}
              className="flex max-h-[85vh] flex-col"
            >
              <div className="flex items-center justify-between border-b border-slate-700/60 px-5 py-4">
                <h3 className="text-base font-extrabold text-white">
                  {addressModal.mode === 'edit' ? TEXTS.editAddressTitle[lang] : TEXTS.newAddressTitle[lang]}
                </h3>
                <button type="button" onClick={() => setAddressModal(null)} aria-label={TEXTS.cancel[lang]} className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 transition hover:bg-slate-800 hover:text-white">
                  <XSmallIcon />
                </button>
              </div>

              <div className="grid flex-1 grid-cols-1 gap-4 overflow-y-auto p-5 sm:grid-cols-2">
                <label className="block space-y-1.5">
                  <span className={fieldLabelCls}>{TEXTS.descLabel[lang]}</span>
                  <input type="text" required value={addressDraft.description} onChange={(e) => setAddressDraft((p) => ({ ...p, description: e.target.value }))} className={inputCls} />
                </label>
                <label className="block space-y-1.5">
                  <span className={fieldLabelCls}>{TEXTS.secondLangLabel[lang]}</span>
                  <input type="text" value={addressDraft.nameKh} onChange={(e) => setAddressDraft((p) => ({ ...p, nameKh: e.target.value }))} className={inputCls} />
                </label>
                <label className="block space-y-1.5 sm:col-span-2">
                  <span className={fieldLabelCls}>{TEXTS.addressLabel[lang]}</span>
                  <textarea rows={2} value={addressDraft.line1} onChange={(e) => setAddressDraft((p) => ({ ...p, line1: e.target.value }))} className={`${inputCls} resize-none`} />
                </label>
                <label className="block space-y-1.5 sm:col-span-2">
                  <span className={fieldLabelCls}>{TEXTS.address2Label[lang]}</span>
                  <input type="text" value={addressDraft.line2} onChange={(e) => setAddressDraft((p) => ({ ...p, line2: e.target.value }))} className={inputCls} />
                </label>
                <label className="block space-y-1.5">
                  <span className={fieldLabelCls}>{TEXTS.countryCol[lang]} *</span>
                  <SearchSelect
                    value={addressDraft.country}
                    onChange={(v) => setAddressDraft((p) => ({ ...p, country: v }))}
                    placeholder={TEXTS.searchPh[lang]}
                    options={COUNTRIES.map((c) => ({
                      value: c.en,
                      label: c.en,
                      icon: <CountryFlag code={c.code} className="h-6 w-8 min-w-[32px]" />,
                    }))}
                  />
                </label>
                <label className="block space-y-1.5">
                  <span className={fieldLabelCls}>{TEXTS.stateLabel[lang]}</span>
                  <input type="text" value={addressDraft.state} onChange={(e) => setAddressDraft((p) => ({ ...p, state: e.target.value }))} className={inputCls} />
                </label>
                <label className="block space-y-1.5">
                  <span className={fieldLabelCls}>{TEXTS.cityLabel[lang]}</span>
                  <input type="text" value={addressDraft.city} onChange={(e) => setAddressDraft((p) => ({ ...p, city: e.target.value }))} className={inputCls} />
                </label>
                <label className="block space-y-1.5">
                  <span className={fieldLabelCls}>{TEXTS.emailLabel[lang]}</span>
                  <input type="email" value={addressDraft.email} onChange={(e) => setAddressDraft((p) => ({ ...p, email: e.target.value }))} className={inputCls} />
                </label>
                <label className="block space-y-1.5">
                  <span className={fieldLabelCls}>{TEXTS.websiteLabel[lang]}</span>
                  <input type="url" placeholder="https://" value={addressDraft.website} onChange={(e) => setAddressDraft((p) => ({ ...p, website: e.target.value }))} className={inputCls} />
                </label>
                <label className="block space-y-1.5">
                  <span className={fieldLabelCls}>{TEXTS.phoneLabel[lang]}</span>
                  <div className="flex gap-2">
                    <input type="tel" value={addressDraft.phone} onChange={(e) => setAddressDraft((p) => ({ ...p, phone: e.target.value }))} className={inputCls} />
                    <input type="text" placeholder={TEXTS.phoneExtLabel[lang]} value={addressDraft.phoneExt} onChange={(e) => setAddressDraft((p) => ({ ...p, phoneExt: e.target.value }))} className={`${inputCls} w-20 shrink-0`} />
                  </div>
                </label>
                <label className="block space-y-1.5">
                  <span className={fieldLabelCls}>{TEXTS.faxLabel[lang]}</span>
                  <div className="flex gap-2">
                    <input type="text" value={addressDraft.fax} onChange={(e) => setAddressDraft((p) => ({ ...p, fax: e.target.value }))} className={inputCls} />
                    <input type="text" placeholder={TEXTS.faxExtLabel[lang]} value={addressDraft.faxExt} onChange={(e) => setAddressDraft((p) => ({ ...p, faxExt: e.target.value }))} className={`${inputCls} w-20 shrink-0`} />
                  </div>
                </label>
              </div>

              <div className="flex items-center justify-end gap-3 border-t border-slate-700/60 px-5 py-4">
                <button type="button" onClick={() => setAddressModal(null)} className="rounded-lg border border-slate-700 px-5 py-2 text-sm font-bold text-slate-300 transition hover:bg-slate-800">
                  {TEXTS.cancel[lang]}
                </button>
                <button type="submit" className="rounded-lg bg-green-500 px-5 py-2 text-sm font-black text-slate-950 shadow-md shadow-green-500/20 transition hover:bg-green-400">
                  {TEXTS.add[lang]}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Delete confirmation modal */}
      {deleteTarget && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
          onClick={() => !deleting && setDeleteTarget(null)}
        >
          <div
            role="alertdialog"
            aria-modal="true"
            aria-label={TEXTS.deleteTitle[lang]}
            className="w-full max-w-md overflow-hidden rounded-2xl border border-slate-700 bg-slate-900 shadow-2xl shadow-black/40"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex flex-col items-center px-6 pb-5 pt-7 text-center">
              <span className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-red-500/15 text-red-400">
                <TrashIcon />
              </span>
              <h3 className="text-lg font-extrabold text-white">{TEXTS.deleteTitle[lang]}</h3>
              <p className="mt-2 text-sm text-slate-400">
                {lang === 'en'
                  ? <>Are you sure you want to delete <span className="font-bold text-white">{deleteTarget.name}</span>? This action cannot be undone.</>
                  : <>តើអ្នកប្រាកដទេថាចង់លុប <span className="font-bold text-white">{deleteTarget.name}</span>? សកម្មភាពនេះមិនអាចត្រឡប់វិញបានទេ។</>}
              </p>
            </div>
            <div className="flex items-center justify-center gap-3 border-t border-slate-700/60 bg-slate-950/40 px-6 py-4">
              <button
                type="button"
                onClick={() => setDeleteTarget(null)}
                disabled={deleting}
                className="rounded-lg border border-slate-700 px-5 py-2.5 text-sm font-bold text-slate-300 transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-40"
              >
                {TEXTS.cancel[lang]}
              </button>
              <button
                type="button"
                onClick={confirmDelete}
                disabled={deleting}
                className="rounded-lg bg-red-500 px-5 py-2.5 text-sm font-black text-white shadow-md shadow-red-500/20 transition hover:bg-red-400 disabled:cursor-not-allowed disabled:opacity-40"
              >
                {deleting ? TEXTS.deleting[lang] : TEXTS.deleteConfirm[lang]}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

/* ---------- searchable select (Country etc.) ----------
 * Trigger styled like the other selects; search box + option list in a
 * portal anchored under the trigger — portals dodge the modal's overflow
 * clipping, which used to leave only one row visible. Shows ~5 rows at a
 * time and scrolls the rest. Options may carry an `icon` node (e.g. a flag
 * <img>) shown in the list and trigger. */
const SearchSelect = ({ value, onChange, placeholder, options }) => {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  // panel coords in viewport space (fixed positioning), measured from the button
  const [panelPos, setPanelPos] = useState(null)
  const boxRef = useRef(null)
  const selectedOption = options.find((o) => o.value === value)

  // measured on open/scroll/resize — never synchronously inside the effect body
  const syncPanelPos = () => {
    const rect = boxRef.current?.getBoundingClientRect()
    if (!rect) return
    setPanelPos({ left: rect.left, top: rect.bottom + 4, width: rect.width })
  }

  const toggleOpen = () => {
    if (!open) syncPanelPos()
    else setPanelPos(null)
    setOpen((v) => !v)
  }

  useEffect(() => {
    if (!open) return
    const onDocDown = (e) => {
      if (
        boxRef.current &&
        !boxRef.current.contains(e.target) &&
        !e.target.closest('[data-search-select-panel]')
      ) setOpen(false)
    }
    const onKey = (e) => {
      if (e.key === 'Escape') setOpen(false)
    }
    // keep the panel glued to the button while the modal scrolls/resizes
    window.addEventListener('scroll', syncPanelPos, true)
    window.addEventListener('resize', syncPanelPos)
    document.addEventListener('mousedown', onDocDown)
    document.addEventListener('keydown', onKey)
    return () => {
      window.removeEventListener('scroll', syncPanelPos, true)
      window.removeEventListener('resize', syncPanelPos)
      document.removeEventListener('mousedown', onDocDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  const needle = search.trim().toLowerCase()
  const filtered = needle ? options.filter((o) => o.label.toLowerCase().includes(needle)) : options

  return (
    <div ref={boxRef} className="relative">
      <button
        type="button"
        onClick={toggleOpen}
        className={`flex w-full items-center gap-2 rounded-lg border border-slate-700/70 bg-slate-950/60 py-2 pl-2 pr-3 text-left text-sm font-medium outline-none transition hover:border-slate-600 focus:border-green-400 focus:bg-slate-950 focus:ring-4 focus:ring-green-500/10 ${value ? 'text-white' : 'text-slate-500'}`}
      >
        {selectedOption?.icon ? (
          <span className="flex min-w-0 flex-1 items-center gap-2">
            {selectedOption.icon}
            <span className="truncate font-semibold">{value}</span>
          </span>
        ) : (
          <span className="min-w-0 flex-1 truncate">{value || placeholder}</span>
        )}
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" className={`shrink-0 text-slate-400 transition-transform ${open ? 'rotate-180' : ''}`}>
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      {/* portal panel — fixed to the viewport so nothing can clip it */}
      {open && panelPos && createPortal(
        <div
          data-search-select-panel
          style={{
            position: 'fixed',
            left: panelPos.left,
            top: Math.max(8, Math.min(panelPos.top, window.innerHeight - 320)),
            width: panelPos.width,
          }}
          className="z-[80] overflow-hidden rounded-lg border border-slate-700 bg-slate-900 shadow-2xl shadow-black/40"
        >
          <div className="border-b border-slate-700/60 p-2">
            <div className="relative">
              <span className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-500"><SearchIcon /></span>
              <input
                autoFocus
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={placeholder}
                className="w-full rounded-md border border-slate-700/70 bg-slate-950/60 py-2 pl-8 pr-3 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-green-400 focus:bg-slate-950"
              />
            </div>
          </div>
          <ul className="max-h-[212px] overflow-y-auto py-1">
            {value && (
              <li>
                <button
                  type="button"
                  onClick={() => { onChange(''); setSearch(''); setOpen(false) }}
                  className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-slate-400 transition hover:bg-slate-800"
                >
                  <XSmallIcon /> Clear selection
                </button>
              </li>
            )}
            {filtered.length === 0 ? (
              <li className="px-3 py-6 text-center text-sm text-slate-500">No match</li>
            ) : (
              filtered.map((o) => {
                const selected = o.value === value
                return (
                  <li key={o.value}>
                    <button
                      type="button"
                      onClick={() => { onChange(o.value); setSearch(''); setOpen(false) }}
                      className={`flex w-full items-center gap-2.5 px-2 py-2 text-left transition hover:bg-slate-800 ${selected ? 'bg-green-500/10' : ''}`}
                    >
                      {o.icon && <span className="shrink-0">{o.icon}</span>}
                      <span className={`min-w-0 flex-1 truncate text-sm font-semibold ${selected ? 'text-green-300' : 'text-slate-200'}`}>{o.label}</span>
                    </button>
                  </li>
                )
              })
            )}
          </ul>
        </div>,
        document.body,
      )}
    </div>
  )
}

/* ---------- icons ---------- */

const ChevronLeftIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
    <polyline points="15 18 9 12 15 6" />
  </svg>
)

const PlusIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
    <line x1="12" y1="5" x2="12" y2="19" />
    <line x1="5" y1="12" x2="19" y2="12" />
  </svg>
)

const SearchIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
    <circle cx="11" cy="11" r="7" />
    <line x1="21" y1="21" x2="16.5" y2="16.5" />
  </svg>
)

const FunnelIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
  </svg>
)

const ColumnsIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <rect x="3" y="3" width="18" height="18" rx="2" />
    <line x1="9" y1="3" x2="9" y2="21" />
    <line x1="15" y1="3" x2="15" y2="21" />
  </svg>
)

const XSmallIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
)

const UploadIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    <polyline points="17 8 12 3 7 8" />
    <line x1="12" y1="3" x2="12" y2="15" />
  </svg>
)

const DownloadIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    <polyline points="7 10 12 15 17 10" />
    <line x1="12" y1="15" x2="12" y2="3" />
  </svg>
)

const TemplateIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <rect x="3" y="3" width="18" height="18" rx="2" />
    <line x1="3" y1="9" x2="21" y2="9" />
    <line x1="9" y1="9" x2="9" y2="21" />
  </svg>
)

const ResetIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
    <path d="M3 12a9 9 0 1 0 2.64-6.36L3 8" />
    <polyline points="3 3 3 8 8 8" />
  </svg>
)

const TruckIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <rect x="1" y="3" width="15" height="13" rx="1" />
    <path d="M16 8h4l3 3v5h-7V8z" />
    <circle cx="5.5" cy="18.5" r="2.5" />
    <circle cx="18.5" cy="18.5" r="2.5" />
  </svg>
)

const CheckCircleIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
    <polyline points="22 4 12 14.01 9 11.01" />
  </svg>
)

const XCircleIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <circle cx="12" cy="12" r="10" />
    <line x1="15" y1="9" x2="9" y2="15" />
    <line x1="9" y1="9" x2="15" y2="15" />
  </svg>
)

const LayersIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <polygon points="12 2 2 7 12 12 22 7 12 2" />
    <polyline points="2 17 12 22 22 17" />
    <polyline points="2 12 12 17 22 12" />
  </svg>
)

const EditIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
  </svg>
)

const TrashIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <polyline points="3 6 5 6 21 6" />
    <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
    <path d="M10 11v6M14 11v6" />
    <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
  </svg>
)

const ContactIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={GREEN} strokeWidth="2" strokeLinecap="round">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </svg>
)

const PinIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={GREEN} strokeWidth="2" strokeLinecap="round">
    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
    <circle cx="12" cy="10" r="3" />
  </svg>
)

const HistoryIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={ORANGE} strokeWidth="2" strokeLinecap="round">
    <circle cx="12" cy="12" r="10" />
    <polyline points="12 6 12 12 16 14" />
  </svg>
)
