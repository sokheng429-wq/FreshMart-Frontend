import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useLanguage } from '../../context/LanguageContext'
import { useNotifications } from '../../context/NotificationContext'
import { adminCustomerAPI } from '../../api/api'

const GREEN = '#77BC1F'
const ORANGE = '#FF9900'
const NAVY = '#232F3F'
const DARK_BG = '#0B0F14'

const CustomerForm = () => {
  const { lang } = useLanguage()
  const { addNotification } = useNotifications()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const customerId = searchParams.get('id')

  // Form state
  const [formData, setFormData] = useState({
    code: '',
    active: true,
    customerName: '',
    allowCredit: false,
    creditLimit: 0,
    secondLanguage: '',
    priceBook: '',
    customerGroup: '',
    salesperson: '',
    paymentTerm: '',
    termsAndCondition: '',
    quoteTemplate: '',
    soTemplate: '',
    invoiceTemplate: '',
    doTemplate: '',
    taxNo: '',
    currentBalance: 0,
    creditDeposit: 0,
  })

  const [contacts, setContacts] = useState([])
  const [locations, setLocations] = useState([])
  const [showContactModal, setShowContactModal] = useState(false)
  const [showLocationModal, setShowLocationModal] = useState(false)
  const [editingContactIndex, setEditingContactIndex] = useState(null)
  const [editingLocationIndex, setEditingLocationIndex] = useState(null)

  const [contactForm, setContactForm] = useState({
    firstName: '',
    lastName: '',
    gender: '',
    dateOfBirth: '',
    phone: '',
    mobile: '',
    email: '',
    website: '',
    isDefault: false,
  })

  const [locationForm, setLocationForm] = useState({
    description: '',
    secondLanguage: '',
    address: '',
    address2: '',
    phone: '',
    phoneExt: '',
    fax: '',
    faxExt: '',
    email: '',
    website: '',
    city: '',
    state: '',
    country: '',
    isDefault: false,
  })

  const [saving, setSaving] = useState(false)

  // Load existing customer for edit, or leave code blank for auto-generation
  useEffect(() => {
    if (customerId) {
      adminCustomerAPI.getById(customerId)
        .then(res => {
          const c = res?.data || res
          if (!c) return
          setFormData({
            code: c.code || '',
            active: c.active !== false,
            customerName: c.customerName || '',
            allowCredit: c.allowCredit || false,
            creditLimit: c.creditLimit || 0,
            secondLanguage: c.secondLanguage || '',
            priceBook: c.priceBook || '',
            customerGroup: c.customerGroup || '',
            salesperson: c.saleEmployee || '',
            paymentTerm: c.paymentTerm || '',
            termsAndCondition: c.termsAndCondition || '',
            quoteTemplate: c.quoteTemplate || '',
            soTemplate: c.soTemplate || '',
            invoiceTemplate: c.invoiceTemplate || '',
            doTemplate: c.doTemplate || '',
            taxNo: c.taxNo || '',
            currentBalance: c.currentBalance || 0,
            creditDeposit: c.creditDeposit || 0,
          })
          // Populate default contact if present
          if (c.contactFirstName || c.contactLastName) {
            setContacts([{
              firstName: c.contactFirstName || '',
              lastName: c.contactLastName || '',
              gender: c.contactGender || '',
              dateOfBirth: c.contactDob || '',
              phone: c.contactPhone || '',
              mobile: c.contactMobile || '',
              email: c.contactEmail || '',
              website: c.contactWebsite || '',
              isDefault: true,
            }])
          }
          // Populate default location if present
          if (c.addressLine1 || c.addressCity) {
            setLocations([{
              description: c.addressDescription || '',
              secondLanguage: c.addressSecondLanguage || '',
              address: c.addressLine1 || '',
              address2: c.addressLine2 || '',
              phone: c.addressPhone || '',
              phoneExt: c.addressPhoneExt || '',
              fax: c.addressFax || '',
              faxExt: c.addressFaxExt || '',
              email: c.addressEmail || '',
              website: c.addressWebsite || '',
              city: c.addressCity || '',
              state: c.addressState || '',
              country: c.addressCountry || '',
              isDefault: true,
            }])
          }
        })
        .catch(err => {
          console.error('Failed to load customer:', err)
          addNotification('error', { en: 'Failed to load customer', kh: 'បរាជ័យក្នុងការផ្ទុកអតិថិជន' }[lang])
        })
    }
  }, [customerId])

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }))
  }

  const handleContactChange = (e) => {
    const { name, value, type, checked } = e.target
    setContactForm(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }))
  }

  const handleLocationChange = (e) => {
    const { name, value, type, checked } = e.target
    setLocationForm(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }))
  }

  const handleAddContact = () => {
    if (!contactForm.firstName && !contactForm.lastName) {
      addNotification('error', { en: 'Please enter contact name', kh: 'សូមបញ្ចូលឈ្មោះទំនាក់ទំនង' }[lang])
      return
    }

    if (editingContactIndex !== null) {
      const updated = [...contacts]
      updated[editingContactIndex] = contactForm
      setContacts(updated)
    } else {
      setContacts(prev => [...prev, contactForm])
    }

    setContactForm({
      firstName: '',
      lastName: '',
      gender: '',
      dateOfBirth: '',
      phone: '',
      mobile: '',
      email: '',
      website: '',
      isDefault: false,
    })
    setEditingContactIndex(null)
    setShowContactModal(false)
  }

  const handleAddLocation = () => {
    if (!locationForm.address) {
      addNotification('error', { en: 'Please enter address', kh: 'សូមបញ្ចូលអាសយដ្ឋាន' }[lang])
      return
    }

    if (!locationForm.country) {
      addNotification('error', { en: 'Please select country', kh: 'សូមជ្រើសរើសប្រទេស' }[lang])
      return
    }

    if (editingLocationIndex !== null) {
      const updated = [...locations]
      updated[editingLocationIndex] = locationForm
      setLocations(updated)
    } else {
      setLocations(prev => [...prev, locationForm])
    }

    setLocationForm({
      description: '',
      secondLanguage: '',
      address: '',
      address2: '',
      phone: '',
      phoneExt: '',
      fax: '',
      faxExt: '',
      email: '',
      website: '',
      city: '',
      state: '',
      country: '',
      isDefault: false,
    })
    setEditingLocationIndex(null)
    setShowLocationModal(false)
  }

  const handleEditContact = (index) => {
    setContactForm(contacts[index])
    setEditingContactIndex(index)
    setShowContactModal(true)
  }

  const handleDeleteContact = (index) => {
    setContacts(prev => prev.filter((_, i) => i !== index))
  }

  const handleEditLocation = (index) => {
    setLocationForm(locations[index])
    setEditingLocationIndex(index)
    setShowLocationModal(true)
  }

  const handleDeleteLocation = (index) => {
    setLocations(prev => prev.filter((_, i) => i !== index))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    // Validation
    if (!formData.customerName) {
      addNotification('error', { en: 'Customer name is required', kh: 'ត្រូវការឈ្មោះអតិថិជន' }[lang])
      return
    }
    if (!formData.customerGroup) {
      addNotification('error', { en: 'Customer group is required', kh: 'ត្រូវការក្រុមអតិថិជន' }[lang])
      return
    }
    if (!formData.paymentTerm) {
      addNotification('error', { en: 'Payment term is required', kh: 'ត្រូវការលក្ខខណ្ឌបង់ប្រាក់' }[lang])
      return
    }
    if (!formData.termsAndCondition) {
      addNotification('error', { en: 'Terms and condition is required', kh: 'ត្រូវការលក្ខខណ្ឌ' }[lang])
      return
    }

    // Map form data + contacts/locations to flat DTO
    const defaultContact = contacts.find(c => c.isDefault) || contacts[0] || {}
    const defaultLocation = locations.find(l => l.isDefault) || locations[0] || {}

    const dto = {
      code: formData.code || undefined,  // let backend auto-generate if blank
      customerName: formData.customerName,
      secondLanguage: formData.secondLanguage || undefined,
      customerGroup: formData.customerGroup || undefined,
      saleEmployee: formData.salesperson || undefined,
      taxNo: formData.taxNo || undefined,
      paymentTerm: formData.paymentTerm || undefined,
      termsAndCondition: formData.termsAndCondition || undefined,
      priceBook: formData.priceBook || undefined,
      quoteTemplate: formData.quoteTemplate || undefined,
      soTemplate: formData.soTemplate || undefined,
      invoiceTemplate: formData.invoiceTemplate || undefined,
      doTemplate: formData.doTemplate || undefined,
      allowCredit: formData.allowCredit || false,
      creditLimit: formData.allowCredit ? Number(formData.creditLimit) || 0 : 0,
      currentBalance: Number(formData.currentBalance) || 0,
      creditDeposit: Number(formData.creditDeposit) || 0,
      active: formData.active,
      // Flatten default contact
      contactFirstName: defaultContact.firstName || undefined,
      contactLastName: defaultContact.lastName || undefined,
      contactGender: defaultContact.gender || undefined,
      contactDob: defaultContact.dateOfBirth || undefined,
      contactPhone: defaultContact.phone || undefined,
      contactMobile: defaultContact.mobile || undefined,
      contactEmail: defaultContact.email || undefined,
      contactWebsite: defaultContact.website || undefined,
      // Flatten default location
      addressDescription: defaultLocation.description || undefined,
      addressSecondLanguage: defaultLocation.secondLanguage || undefined,
      addressLine1: defaultLocation.address || undefined,
      addressLine2: defaultLocation.address2 || undefined,
      addressCity: defaultLocation.city || undefined,
      addressState: defaultLocation.state || undefined,
      addressCountry: defaultLocation.country || undefined,
      addressPhone: defaultLocation.phone || undefined,
      addressPhoneExt: defaultLocation.phoneExt || undefined,
      addressFax: defaultLocation.fax || undefined,
      addressFaxExt: defaultLocation.faxExt || undefined,
      addressEmail: defaultLocation.email || undefined,
      addressWebsite: defaultLocation.website || undefined,
    }

    setSaving(true)
    try {
      if (customerId) {
        await adminCustomerAPI.update(customerId, dto)
        addNotification('success', { en: 'Customer updated successfully', kh: 'កែប្រែអតិថិជនបានជោគជ័យ' }[lang])
      } else {
        await adminCustomerAPI.create(dto)
        addNotification('success', { en: 'Customer created successfully', kh: 'បង្កើតអតិថិជនបានជោគជ័យ' }[lang])
      }
      navigate('/admin/sale-dashboard/customers')
    } catch (err) {
      console.error('Failed to save customer:', err)
      addNotification('error', err.message || { en: 'Failed to save customer', kh: 'បរាជ័យក្នុងការរក្សាទុកអតិថិជន' }[lang])
    } finally {
      setSaving(false)
    }
  }

  const text = {
    en: {
      title: customerId ? 'Edit Customer' : 'Create Customer',
      generalInfo: 'General Information',
      generalInfoDesc: 'Input the general customer information.',
      transactionInfo: 'Customer History Information',
      transactionInfoDesc: 'Transaction Information',
      contactInfo: 'Contact Information',
      contactInfoDesc: 'Input the contact customer information',
      locationInfo: 'Location Information',
      locationInfoDesc: 'Input the location customer information',
      addressInfo: 'Address information',
      addressInfoDesc: 'Input the customer address information',
      code: 'Code',
      active: 'Active',
      customerName: 'Customer Name',
      allowCredit: 'Allow Credit',
      creditLimit: 'Credit Limit',
      secondLanguage: 'Second Language',
      priceBook: 'Price Book',
      customerGroup: 'Customer Group',
      salesperson: 'Salesperson',
      paymentTerm: 'Payment Term',
      termsAndCondition: 'Terms and Condition',
      quoteTemplate: 'Quote Template Name',
      soTemplate: 'SO Template Name',
      invoiceTemplate: 'Invoice Template Name',
      doTemplate: 'DO Template Name',
      taxNo: 'Tax Nº',
      currentBalance: 'Current Balance',
      creditDeposit: 'Credit/Deposit',
      add: 'Add',
      save: 'Save',
      cancel: 'Cancel',
      default: 'Default',
      firstName: 'First Name',
      lastName: 'Last Name',
      gender: 'Gender',
      dateOfBirth: 'Date of Birth',
      phone: 'Phone',
      mobile: 'Mobile',
      email: 'Email',
      website: 'Website',
      description: 'Description',
      address: 'Address',
      address2: 'Address 2',
      phoneExt: 'Phone Ext',
      fax: 'Fax',
      faxExt: 'Fax Ext',
      city: 'City',
      state: 'State',
      country: 'Country',
      male: 'Male',
      female: 'Female',
      other: 'Other',
      edit: 'Edit',
      delete: 'Delete',
      actions: 'Actions',
    },
    kh: {
      title: customerId ? 'កែប្រែអតិថិជន' : 'បង្កើតអតិថិជន',
      generalInfo: 'ព័ត៌មានទូទៅ',
      generalInfoDesc: 'បញ្ចូលព័ត៌មានអតិថិជនទូទៅ។',
      transactionInfo: 'ព័ត៌មានប្រវត្តិអតិថិជន',
      transactionInfoDesc: 'ព័ត៌មានប្រតិបត្តិការ',
      contactInfo: 'ព័ត៌មានទំនាក់ទំនង',
      contactInfoDesc: 'បញ្ចូលព័ត៌មានទំនាក់ទំនងអតិថិជន',
      locationInfo: 'ព័ត៌មានទីតាំង',
      locationInfoDesc: 'បញ្ចូលព័ត៌មានទីតាំងអតិថិជន',
      addressInfo: 'ព័ត៌មានអាសយដ្ឋាន',
      addressInfoDesc: 'បញ្ចូលព័ត៌មានអាសយដ្ឋានអតិថិជន',
      code: 'លេខកូដ',
      active: 'សកម្ម',
      customerName: 'ឈ្មោះអតិថិជន',
      allowCredit: 'អនុញ្ញាតឥណទាន',
      creditLimit: 'ដែនកំណត់ឥណទាន',
      secondLanguage: 'ភាសាទី២',
      priceBook: 'សៀវភៅតម្លៃ',
      customerGroup: 'ក្រុមអតិថិជន',
      salesperson: 'បុគ្គលិកលក់',
      paymentTerm: 'លក្ខខណ្ឌបង់ប្រាក់',
      termsAndCondition: 'លក្ខខណ្ឌ',
      quoteTemplate: 'ឈ្មោះគំរូសម្រង់',
      soTemplate: 'ឈ្មោះគំរូ SO',
      invoiceTemplate: 'ឈ្មោះគំរូវិក័យប័ត្រ',
      doTemplate: 'ឈ្មោះគំរូ DO',
      taxNo: 'លេខពន្ធ',
      currentBalance: 'សមតុល្យបច្ចុប្បន្ន',
      creditDeposit: 'ឥណទាន/ប្រាក់កក់',
      add: 'បន្ថែម',
      save: 'រក្សាទុក',
      cancel: 'បោះបង់',
      default: 'លំនាំដើម',
      firstName: 'នាមត្រកូល',
      lastName: 'នាមខ្លួន',
      gender: 'ភេទ',
      dateOfBirth: 'ថ្ងៃខែឆ្នាំកំណើត',
      phone: 'ទូរស័ព្ទ',
      mobile: 'ទូរស័ព្ទចល័ត',
      email: 'អ៊ីមែល',
      website: 'គេហទំព័រ',
      description: 'ការពិពណ៌នា',
      address: 'អាសយដ្ឋាន',
      address2: 'អាសយដ្ឋាន ២',
      phoneExt: 'ផ្នែកបន្ថែមទូរស័ព្ទ',
      fax: 'ទូរសារ',
      faxExt: 'ផ្នែកបន្ថែមទូរសារ',
      city: 'ទីក្រុង',
      state: 'រដ្ឋ',
      country: 'ប្រទេស',
      male: 'ប្រុស',
      female: 'ស្រី',
      other: 'ផ្សេងទៀត',
      edit: 'កែប្រែ',
      delete: 'លុប',
      actions: 'សកម្មភាព',
    },
  }

  const t = text[lang]

  return (
    <div className="customer-form-page">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;600;700;800&display=swap');
        .customer-form-page { font-family: 'Montserrat', sans-serif; background: #1a1f2e; min-height: 100vh; padding: 2rem; color: #E5E7EB; }
        .form-header { margin-bottom: 2rem; }
        .form-header h1 { font-size: 1.75rem; font-weight: 700; margin: 0 0 0.5rem; color: #fff; }
        .breadcrumb { font-size: 0.875rem; color: #9CA3AF; }
        .breadcrumb a { color: ${GREEN}; text-decoration: none; }
        .breadcrumb a:hover { text-decoration: underline; }
        .form-section { background: ${NAVY}; border: 1px solid #3A4456; border-radius: 8px; padding: 1.5rem; margin-bottom: 1.5rem; box-shadow: 0 2px 4px rgba(0,0,0,0.2); }
        .section-header { border-left: 4px solid ${GREEN}; padding-left: 1rem; margin-bottom: 1.5rem; }
        .section-header h2 { font-size: 1rem; font-weight: 700; margin: 0 0 0.25rem; color: #fff; }
        .section-header p { font-size: 0.875rem; color: #9CA3AF; margin: 0; }
        .form-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 1rem; }
        .form-group { display: flex; flex-direction: column; gap: 0.5rem; }
        .form-group label { font-size: 0.75rem; font-weight: 600; color: #9CA3AF; text-transform: uppercase; letter-spacing: 0.5px; }
        .form-group label.required::after { content: ' *'; color: ${ORANGE}; }
        .form-group input, .form-group select, .form-group textarea { width: 100%; padding: 0.5rem 0.75rem; background: #1a1f2e; border: 1px solid #3A4456; border-radius: 6px; color: #fff; font-size: 0.875rem; font-family: 'Montserrat', sans-serif; }
        .form-group input:disabled, .form-group select:disabled, .form-group textarea:disabled { opacity: 0.7; cursor: not-allowed; background: #151a26; color: #9CA3AF; }
        .form-group input:focus, .form-group select:focus, .form-group textarea:focus { outline: none; border-color: ${GREEN}; box-shadow: 0 0 0 3px rgba(119, 188, 31, 0.15); }
        .form-group option { background: ${NAVY}; color: #fff; }
        .checkbox-group { display: flex; align-items: center; gap: 0.5rem; margin-top: 0.5rem; }
        .checkbox-group input[type="checkbox"] { width: 18px; height: 18px; cursor: pointer; accent-color: ${GREEN}; }
        .checkbox-group label { font-size: 0.875rem; color: #E5E7EB; cursor: pointer; margin: 0; text-transform: none; letter-spacing: normal; }
        .form-actions { display: flex; gap: 1rem; justify-content: flex-end; margin-top: 2rem; }
        .btn { padding: 0.5rem 1.5rem; border-radius: 6px; font-size: 0.875rem; font-weight: 600; cursor: pointer; transition: all 0.2s; border: none; font-family: 'Montserrat', sans-serif; }
        .btn-primary { background: ${GREEN}; color: #fff; }
        .btn-primary:hover { background: #6AAA1A; }
        .btn-secondary { background: transparent; color: #E5E7EB; border: 1px solid #3A4456; }
        .btn-secondary:hover { background: #2a3344; }
        .btn-small { padding: 0.35rem 0.75rem; font-size: 0.75rem; }
        .table-container { overflow-x: auto; margin-top: 1rem; background: ${NAVY}; border: 1px solid #3A4456; border-radius: 6px; }
        .data-table { width: 100%; border-collapse: collapse; }
        .data-table thead { background: #1a1f2e; }
        .data-table th { padding: 0.75rem; text-align: left; font-size: 0.75rem; font-weight: 700; color: #9CA3AF; text-transform: uppercase; letter-spacing: 0.5px; border-bottom: 2px solid #3A4456; }
        .data-table td { padding: 0.75rem; font-size: 0.875rem; color: #E5E7EB; border-bottom: 1px solid #3A4456; }
        .data-table tbody tr:hover { background: #2a3344; }
        .modal-overlay { position: fixed; inset: 0; background: rgba(11,15,20,0.75); display: flex; align-items: center; justify-content: center; z-index: 1000; }
        .modal { background: ${NAVY}; border: 1px solid #3A4456; border-radius: 8px; width: 90%; max-width: 600px; max-height: 90vh; display: flex; flex-direction: column; box-shadow: 0 10px 40px rgba(0,0,0,0.45); }
        .modal-header { padding: 1rem 1.25rem; border-bottom: 1px solid #3A4456; background: #1a1f2e; }
        .modal-header h3 { margin: 0; font-size: 1.125rem; font-weight: 700; color: #fff; }
        .modal-body { padding: 1rem 1.25rem; overflow-y: auto; flex: 1; background: ${NAVY}; }
        .modal-footer { padding: 1rem 1.25rem; border-top: 1px solid #3A4456; display: flex; gap: 0.75rem; justify-content: flex-end; background: #1a1f2e; }
        .icon-btn { background: transparent; border: none; color: #9CA3AF; cursor: pointer; padding: 0.25rem; transition: color 0.2s; font-size: 1.25rem; }
        .icon-btn:hover { color: ${GREEN}; }
        .icon-btn.delete:hover { color: #ef4444; }
      `}</style>

      <div className="form-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <div className="breadcrumb">
            <a href="#" onClick={(e) => { e.preventDefault(); navigate('/admin'); }}>{lang === 'en' ? 'Dashboard' : 'ផ្ទាំងគ្រប់គ្រង'}</a>
            {' / '}
            <a href="#" onClick={(e) => { e.preventDefault(); navigate('/admin/sale-dashboard'); }}>{lang === 'en' ? 'Sale Dashboard' : 'ផ្ទាំងលក់'}</a>
            {' / '}
            <a href="#" onClick={(e) => { e.preventDefault(); navigate('/admin/sale-dashboard/customers'); }}>{lang === 'en' ? 'Customers' : 'អតិថិជន'}</a>
            {' / '}
            <span>{customerId ? (lang === 'en' ? 'Edit' : 'កែប្រែ') : (lang === 'en' ? 'Create' : 'បង្កើត')}</span>
          </div>
          <h1>{t.title}</h1>
        </div>
        <div>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => navigate('/admin/sale-dashboard/customers')}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}
          >
            <span>←</span>
            <span>{lang === 'en' ? 'Back to Customers' : 'ត្រឡប់ទៅបញ្ជីអតិថិជន'}</span>
          </button>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        {/* General Information */}
        <div className="form-section">
          <div className="section-header">
            <h2>{t.generalInfo}</h2>
            <p>{t.generalInfoDesc}</p>
          </div>

          <div className="form-grid">
            <div className="form-group">
              <label>{t.code}</label>
              <input
                type="text"
                name="code"
                value={formData.code}
                onChange={handleInputChange}
                disabled
              />
            </div>

            <div className="form-group">
              <label className="required">{t.customerName}</label>
              <input
                type="text"
                name="customerName"
                value={formData.customerName}
                onChange={handleInputChange}
                required
              />
            </div>

            <div className="form-group">
              <label>{t.secondLanguage}</label>
              <input
                type="text"
                name="secondLanguage"
                value={formData.secondLanguage}
                onChange={handleInputChange}
              />
            </div>

            <div className="form-group">
              <label>{t.priceBook}</label>
              <select
                name="priceBook"
                value={formData.priceBook}
                onChange={handleInputChange}
              >
                <option value="">Select</option>
                <option value="retail">Retail</option>
                <option value="wholesale">Wholesale</option>
                <option value="vip">VIP</option>
              </select>
            </div>

            <div className="form-group">
              <label className="required">{t.customerGroup}</label>
              <select
                name="customerGroup"
                value={formData.customerGroup}
                onChange={handleInputChange}
                required
              >
                <option value="">Select</option>
                <option value="retail">Retail</option>
                <option value="wholesale">Wholesale</option>
                <option value="vip">VIP</option>
              </select>
            </div>

            <div className="form-group">
              <label>{t.salesperson}</label>
              <select
                name="salesperson"
                value={formData.salesperson}
                onChange={handleInputChange}
              >
                <option value="">Select</option>
                <option value="john">John Doe</option>
                <option value="jane">Jane Smith</option>
              </select>
            </div>

            <div className="form-group">
              <label className="required">{t.paymentTerm}</label>
              <select
                name="paymentTerm"
                value={formData.paymentTerm}
                onChange={handleInputChange}
                required
              >
                <option value="">Select</option>
                <option value="cash">Cash</option>
                <option value="net15">Net 15</option>
                <option value="net30">Net 30</option>
              </select>
            </div>

            <div className="form-group">
              <label className="required">{t.termsAndCondition}</label>
              <select
                name="termsAndCondition"
                value={formData.termsAndCondition}
                onChange={handleInputChange}
                required
              >
                <option value="">Select</option>
                <option value="standard">Standard Terms</option>
                <option value="custom">Custom Terms</option>
              </select>
            </div>

            <div className="form-group">
              <label>{t.quoteTemplate}</label>
              <select
                name="quoteTemplate"
                value={formData.quoteTemplate}
                onChange={handleInputChange}
              >
                <option value="">Select</option>
                <option value="default">Default Template</option>
              </select>
            </div>

            <div className="form-group">
              <label>{t.soTemplate}</label>
              <select
                name="soTemplate"
                value={formData.soTemplate}
                onChange={handleInputChange}
              >
                <option value="">Select</option>
                <option value="default">Default Template</option>
              </select>
            </div>

            <div className="form-group">
              <label>{t.invoiceTemplate}</label>
              <select
                name="invoiceTemplate"
                value={formData.invoiceTemplate}
                onChange={handleInputChange}
              >
                <option value="">Select</option>
                <option value="default">Default Template</option>
              </select>
            </div>

            <div className="form-group">
              <label>{t.doTemplate}</label>
              <select
                name="doTemplate"
                value={formData.doTemplate}
                onChange={handleInputChange}
              >
                <option value="">Select</option>
                <option value="default">Default Template</option>
              </select>
            </div>

            <div className="form-group">
              <label>{t.taxNo}</label>
              <input
                type="text"
                name="taxNo"
                value={formData.taxNo}
                onChange={handleInputChange}
              />
            </div>
          </div>

          <div className="checkbox-group">
            <input
              type="checkbox"
              id="active"
              name="active"
              checked={formData.active}
              onChange={handleInputChange}
            />
            <label htmlFor="active">{t.active}</label>
          </div>

          <div className="checkbox-group">
            <input
              type="checkbox"
              id="allowCredit"
              name="allowCredit"
              checked={formData.allowCredit}
              onChange={handleInputChange}
            />
            <label htmlFor="allowCredit">{t.allowCredit}</label>
          </div>

          {formData.allowCredit && (
            <div className="form-grid" style={{ marginTop: '1rem' }}>
              <div className="form-group">
                <label>{t.creditLimit}</label>
                <input
                  type="number"
                  name="creditLimit"
                  value={formData.creditLimit}
                  onChange={handleInputChange}
                  min="0"
                  step="0.01"
                />
              </div>
            </div>
          )}
        </div>

        {/* Transaction Information */}
        <div className="form-section">
          <div className="section-header">
            <h2>{t.transactionInfo}</h2>
            <p>{t.transactionInfoDesc}</p>
          </div>

          <div className="form-grid">
            <div className="form-group">
              <label>{t.currentBalance}</label>
              <input
                type="text"
                value={`$${formData.currentBalance.toFixed(2)}`}
                disabled
              />
            </div>

            <div className="form-group">
              <label>{t.creditDeposit}</label>
              <input
                type="text"
                value={`$${formData.creditDeposit.toFixed(2)}`}
                disabled
              />
            </div>
          </div>
        </div>

        {/* Contact Information */}
        <div className="form-section">
          <div className="section-header">
            <h2>{t.contactInfo}</h2>
            <p>{t.contactInfoDesc}</p>
          </div>

          <button
            type="button"
            className="btn btn-primary btn-small"
            onClick={() => {
              setContactForm({
                firstName: '',
                lastName: '',
                gender: '',
                dateOfBirth: '',
                phone: '',
                mobile: '',
                email: '',
                website: '',
                isDefault: false,
              })
              setEditingContactIndex(null)
              setShowContactModal(true)
            }}
          >
            {t.add}
          </button>

          {contacts.length > 0 && (
            <div className="table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>{t.default}</th>
                    <th>{t.firstName}</th>
                    <th>{t.lastName}</th>
                    <th>{t.gender}</th>
                    <th>{t.phone}</th>
                    <th>{t.email}</th>
                    <th>{t.actions}</th>
                  </tr>
                </thead>
                <tbody>
                  {contacts.map((contact, index) => (
                    <tr key={index}>
                      <td>{contact.isDefault ? '✓' : ''}</td>
                      <td>{contact.firstName}</td>
                      <td>{contact.lastName}</td>
                      <td>{contact.gender}</td>
                      <td>{contact.phone || contact.mobile}</td>
                      <td>{contact.email}</td>
                      <td>
                        <button
                          type="button"
                          className="icon-btn"
                          onClick={() => handleEditContact(index)}
                          title={t.edit}
                        >
                          ✏️
                        </button>
                        <button
                          type="button"
                          className="icon-btn delete"
                          onClick={() => handleDeleteContact(index)}
                          title={t.delete}
                        >
                          🗑️
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Location Information */}
        <div className="form-section">
          <div className="section-header">
            <h2>{t.locationInfo}</h2>
            <p>{t.locationInfoDesc}</p>
          </div>

          <button
            type="button"
            className="btn btn-primary btn-small"
            onClick={() => {
              setLocationForm({
                description: '',
                secondLanguage: '',
                address: '',
                address2: '',
                phone: '',
                phoneExt: '',
                fax: '',
                faxExt: '',
                email: '',
                website: '',
                city: '',
                state: '',
                country: '',
                isDefault: false,
              })
              setEditingLocationIndex(null)
              setShowLocationModal(true)
            }}
          >
            {t.add}
          </button>

          {locations.length > 0 && (
            <div className="table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>{t.default}</th>
                    <th>{t.description}</th>
                    <th>{t.address}</th>
                    <th>{t.city}</th>
                    <th>{t.state}</th>
                    <th>{t.country}</th>
                    <th>{t.phone}</th>
                    <th>{t.actions}</th>
                  </tr>
                </thead>
                <tbody>
                  {locations.map((location, index) => (
                    <tr key={index}>
                      <td>{location.isDefault ? '✓' : ''}</td>
                      <td>{location.description}</td>
                      <td>{location.address}</td>
                      <td>{location.city}</td>
                      <td>{location.state}</td>
                      <td>{location.country}</td>
                      <td>{location.phone}</td>
                      <td>
                        <button
                          type="button"
                          className="icon-btn"
                          onClick={() => handleEditLocation(index)}
                          title={t.edit}
                        >
                          ✏️
                        </button>
                        <button
                          type="button"
                          className="icon-btn delete"
                          onClick={() => handleDeleteLocation(index)}
                          title={t.delete}
                        >
                          🗑️
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Form Actions */}
        <div className="form-actions">
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => navigate('/admin/sale-dashboard/customers')}
          >
            {t.cancel}
          </button>
          <button type="submit" className="btn btn-primary">
            {t.save}
          </button>
        </div>
      </form>

      {/* Contact Modal */}
      {showContactModal && (
        <div className="modal-overlay" onClick={() => setShowContactModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{t.contactInfo}</h3>
              <p style={{ fontSize: '0.875rem', color: '#8B93A1', margin: '0.25rem 0 0' }}>
                {t.contactInfoDesc}
              </p>
            </div>
            <div className="modal-body">
              <div className="form-grid">
                <div className="form-group">
                  <label>{t.firstName}</label>
                  <input
                    type="text"
                    name="firstName"
                    value={contactForm.firstName}
                    onChange={handleContactChange}
                  />
                </div>

                <div className="form-group">
                  <label>{t.lastName}</label>
                  <input
                    type="text"
                    name="lastName"
                    value={contactForm.lastName}
                    onChange={handleContactChange}
                  />
                </div>

                <div className="form-group">
                  <label>{t.gender}</label>
                  <select
                    name="gender"
                    value={contactForm.gender}
                    onChange={handleContactChange}
                  >
                    <option value="">Select</option>
                    <option value="Male">{t.male}</option>
                    <option value="Female">{t.female}</option>
                    <option value="Other">{t.other}</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>{t.dateOfBirth}</label>
                  <input
                    type="date"
                    name="dateOfBirth"
                    value={contactForm.dateOfBirth}
                    onChange={handleContactChange}
                  />
                </div>

                <div className="form-group">
                  <label>{t.phone}</label>
                  <input
                    type="tel"
                    name="phone"
                    value={contactForm.phone}
                    onChange={handleContactChange}
                  />
                </div>

                <div className="form-group">
                  <label>{t.mobile}</label>
                  <input
                    type="tel"
                    name="mobile"
                    value={contactForm.mobile}
                    onChange={handleContactChange}
                  />
                </div>

                <div className="form-group">
                  <label>{t.email}</label>
                  <input
                    type="email"
                    name="email"
                    value={contactForm.email}
                    onChange={handleContactChange}
                  />
                </div>

                <div className="form-group">
                  <label>{t.website}</label>
                  <input
                    type="url"
                    name="website"
                    value={contactForm.website}
                    onChange={handleContactChange}
                  />
                </div>
              </div>

              <div className="checkbox-group" style={{ marginTop: '1rem' }}>
                <input
                  type="checkbox"
                  id="contactDefault"
                  name="isDefault"
                  checked={contactForm.isDefault}
                  onChange={handleContactChange}
                />
                <label htmlFor="contactDefault">{t.default}</label>
              </div>
            </div>
            <div className="modal-footer">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setShowContactModal(false)}
              >
                {t.cancel}
              </button>
              <button
                type="button"
                className="btn btn-primary"
                onClick={handleAddContact}
              >
                {t.save}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Location Modal */}
      {showLocationModal && (
        <div className="modal-overlay" onClick={() => setShowLocationModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{t.addressInfo}</h3>
              <p style={{ fontSize: '0.875rem', color: '#8B93A1', margin: '0.25rem 0 0' }}>
                {t.addressInfoDesc}
              </p>
            </div>
            <div className="modal-body">
              <div className="form-grid">
                <div className="form-group">
                  <label>{t.description}</label>
                  <input
                    type="text"
                    name="description"
                    value={locationForm.description}
                    onChange={handleLocationChange}
                  />
                </div>

                <div className="form-group">
                  <label>{t.secondLanguage}</label>
                  <input
                    type="text"
                    name="secondLanguage"
                    value={locationForm.secondLanguage}
                    onChange={handleLocationChange}
                  />
                </div>

                <div className="form-group">
                  <label>{t.address}</label>
                  <input
                    type="text"
                    name="address"
                    value={locationForm.address}
                    onChange={handleLocationChange}
                  />
                </div>

                <div className="form-group">
                  <label>{t.address2}</label>
                  <input
                    type="text"
                    name="address2"
                    value={locationForm.address2}
                    onChange={handleLocationChange}
                  />
                </div>

                <div className="form-group">
                  <label>{t.phone}</label>
                  <input
                    type="tel"
                    name="phone"
                    value={locationForm.phone}
                    onChange={handleLocationChange}
                  />
                </div>

                <div className="form-group">
                  <label>{t.phoneExt}</label>
                  <input
                    type="text"
                    name="phoneExt"
                    value={locationForm.phoneExt}
                    onChange={handleLocationChange}
                  />
                </div>

                <div className="form-group">
                  <label>{t.fax}</label>
                  <input
                    type="tel"
                    name="fax"
                    value={locationForm.fax}
                    onChange={handleLocationChange}
                  />
                </div>

                <div className="form-group">
                  <label>{t.faxExt}</label>
                  <input
                    type="text"
                    name="faxExt"
                    value={locationForm.faxExt}
                    onChange={handleLocationChange}
                  />
                </div>

                <div className="form-group">
                  <label>{t.email}</label>
                  <input
                    type="email"
                    name="email"
                    value={locationForm.email}
                    onChange={handleLocationChange}
                  />
                </div>

                <div className="form-group">
                  <label>{t.website}</label>
                  <input
                    type="url"
                    name="website"
                    value={locationForm.website}
                    onChange={handleLocationChange}
                  />
                </div>

                <div className="form-group">
                  <label>{t.city}</label>
                  <select
                    name="city"
                    value={locationForm.city}
                    onChange={handleLocationChange}
                  >
                    <option value="">Select</option>
                    <option value="Phnom Penh">Phnom Penh</option>
                    <option value="Siem Reap">Siem Reap</option>
                    <option value="Battambang">Battambang</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>{t.state}</label>
                  <input
                    type="text"
                    name="state"
                    value={locationForm.state}
                    onChange={handleLocationChange}
                  />
                </div>

                <div className="form-group">
                  <label className="required">{t.country}</label>
                  <select
                    name="country"
                    value={locationForm.country}
                    onChange={handleLocationChange}
                    required
                  >
                    <option value="">Select</option>
                    <option value="Cambodia">Cambodia</option>
                    <option value="Thailand">Thailand</option>
                    <option value="Vietnam">Vietnam</option>
                    <option value="USA">United States</option>
                  </select>
                </div>
              </div>

              <div className="checkbox-group" style={{ marginTop: '1rem' }}>
                <input
                  type="checkbox"
                  id="locationDefault"
                  name="isDefault"
                  checked={locationForm.isDefault}
                  onChange={handleLocationChange}
                />
                <label htmlFor="locationDefault">{t.default}</label>
              </div>
            </div>
            <div className="modal-footer">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setShowLocationModal(false)}
              >
                {t.cancel}
              </button>
              <button
                type="button"
                className="btn btn-primary"
                onClick={handleAddLocation}
              >
                {t.save}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default CustomerForm
