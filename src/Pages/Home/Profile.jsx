import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useLanguage } from '../../context/LanguageContext'
import { useAuth } from '../../context/AuthContext'
import { userAPI } from '../../api/api'

// Assets
import profileAvatar from '../../assets/Profile.avif'

// 3D Icons
import walletIcon from '../../assets/icon/3dicons-wallet-dynamic-color.png'
import shieldIcon from '../../assets/icon/3dicons-shield-dynamic-color.png'
import heartIcon from '../../assets/icon/3dicons-heart-dynamic-color.png'
import bellIcon from '../../assets/icon/3dicons-bell-dynamic-color.png'
import bagIcon from '../../assets/icon/3dicons-bag-dynamic-color.png'
import mapPinIcon from '../../assets/icon/3dicons-map-pin-dynamic-color.png'
import starIcon from '../../assets/icon/3dicons-star-dynamic-color.png'

import './Profile.css'

const PROFILE_TEXTS = {
  en: {
    logout: 'Sign Out',
    accountDetails: 'Personal Account Profile',
    edit: 'Edit Profile',
    cancel: 'Discard Changes',
    save: 'Save Changes',
    notSet: 'Not specified',
    firstName: 'First Name',
    lastName: 'Last Name',
    email: 'Registered Email',
    phone: 'Phone Number',
    dob: 'Date of Birth',
    gender: 'Gender',
    nationality: 'Nationality',
    dangerZone: 'Security & Account Management',
    deleteAccountTitle: 'Deactivate / Delete Account',
    deleteAccountDesc: 'Permanently remove your profile and all order history.',
    deleteAccountBtn: 'Delete Account',
    nav: {
      info: 'Account Profile',
      orders: 'Order History',
      addresses: 'Saved Addresses',
      wallet: 'ABA & Wallet Balance',
      payment: 'Saved Payment Methods',
      notifications: 'Alerts & Messages',
      coupons: 'Farm Coupons',
      points: 'Fresh Rewards Club',
    }
  },
  kh: {
    logout: 'ចាកចេញ',
    accountDetails: 'ព័ត៌មានគណនីផ្ទាល់ខ្លួន',
    edit: 'កែប្រែព័ត៌មាន',
    cancel: 'បោះបង់',
    save: 'រក្សាទុកការកែប្រែ',
    notSet: 'មិនទាន់កំណត់',
    firstName: 'នាមខ្លួន',
    lastName: 'នាមត្រកូល',
    email: 'អាសយដ្ឋានអ៊ីមែល',
    phone: 'លេខទូរស័ព្ទ',
    dob: 'ថ្ងៃខែឆ្នាំកំណើត',
    gender: 'ភេទ',
    nationality: 'សញ្ជាតិ',
    dangerZone: 'សុវត្ថិភាព និងការគ្រប់គ្រងគណនី',
    deleteAccountTitle: 'លុបគណនី',
    deleteAccountDesc: 'លុបគណនី និងទិន្នន័យបញ្ជាទិញទាំងអស់របស់អ្នកជារៀងរហូត។',
    deleteAccountBtn: 'លុបគណនី',
    nav: {
      info: 'ព័ត៌មានគណនី',
      orders: 'ប្រវត្តិបញ្ជាទិញ',
      addresses: 'អាសយដ្ឋានដឹកជញ្ជូន',
      wallet: 'កាបូបប្រាក់ និង ABA',
      payment: 'វិធីសាស្ត្រទូទាត់',
      notifications: 'ការជូនដំណឹង',
      coupons: 'ប័ណ្ណបញ្ចុះតម្លៃ',
      points: 'ក្លឹបរង្វាន់ភាពស្រស់',
    }
  }
}

const NAV_ITEMS = [
  { key: 'info', icon: shieldIcon },
  { key: 'orders', icon: bagIcon },
  { key: 'addresses', icon: mapPinIcon },
  { key: 'wallet', icon: walletIcon },
  { key: 'payment', icon: shieldIcon },
  { key: 'notifications', icon: bellIcon },
  { key: 'coupons', icon: heartIcon },
  { key: 'points', icon: starIcon },
]

const GENDER_OPTIONS = [
  { value: 'Male', label: { en: 'Male', kh: 'ប្រុស' } },
  { value: 'Female', label: { en: 'Female', kh: 'ស្រី' } },
  { value: 'Other', label: { en: 'Other', kh: 'ផ្សេងទៀត' } },
]

export const Profile = () => {
  const { lang } = useLanguage()
  const { user: authUser, login, logout } = useAuth()
  const navigate = useNavigate()
  const tp = PROFILE_TEXTS[lang] || PROFILE_TEXTS.en

  const [activeTab, setActiveTab] = useState('info')
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const fullNameParts = (authUser?.fullName || authUser?.name || '').trim().split(/\s+/).filter(Boolean)

  const [user, setUser] = useState({
    firstName: fullNameParts[0] || '',
    lastName: fullNameParts.slice(1).join(' ') || '',
    email: authUser?.email || '',
    phone: authUser?.phoneNumber || '',
    dob: authUser?.dateOfBirth || '',
    gender: authUser?.gender || '',
    nationality: authUser?.nationality || 'Cambodian',
  })
  const [draft, setDraft] = useState(user)

  const applyUser = (u) => {
    const parts = (u.fullName || '').trim().split(/\s+/).filter(Boolean)
    const next = {
      firstName: parts[0] || '',
      lastName: parts.slice(1).join(' ') || '',
      email: u.email || '',
      phone: u.phoneNumber || '',
      dob: u.dateOfBirth || '',
      gender: u.gender || '',
      nationality: u.nationality || 'Cambodian',
    }
    setUser(next)
    setDraft(next)
  }

  const handleEdit = () => {
    setDraft(user)
    setError('')
    setEditing(true)
  }

  const handleCancel = () => {
    setDraft(user)
    setError('')
    setEditing(false)
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setDraft((prev) => ({ ...prev, [name]: value }))
  }

  const handleSave = async () => {
    setError('')
    setSaving(true)
    try {
      const payload = {
        fullName: [draft.firstName, draft.lastName].filter(Boolean).join(' ').trim(),
        email: draft.email,
        phoneNumber: draft.phone,
        dateOfBirth: draft.dob || null,
        gender: draft.gender || null,
        nationality: draft.nationality || null,
      }
      const res = await userAPI.updateProfile(payload)
      const updated = res.data?.user || res.data
      if (updated) {
        applyUser(updated)
        if (login && authUser) login({ ...authUser, ...updated })
      } else {
        setUser(draft)
      }
      setEditing(false)
    } catch (err) {
      setError(err.message || (lang === 'kh' ? 'មិនអាចរក្សាទុកបានទេ។' : 'Failed to update profile.'))
    } finally {
      setSaving(false)
    }
  }

  const handleLogout = () => {
    if (logout) logout()
    navigate('/')
  }

  const displayName = [user.firstName, user.lastName].filter(Boolean).join(' ') || authUser?.username || 'Valued Member'

  return (
    <div className="profile-page">
      <div className="profile-inner">

        {/* ===== PROFILE CONTAINER ===== */}
        <div className="profile-layout">

          {/* Sidebar */}
          <aside className="profile-sidebar">
            <div className="profile-user-card">
              <div className="profile-avatar-frame">
                <img src={profileAvatar} alt={displayName} className="profile-avatar-img" />
              </div>
              <h2 className="profile-user-name">{displayName}</h2>
              <p className="profile-user-email">{user.email || 'customer@freshmart.com'}</p>
              <div className="profile-member-badge">
                <img src={starIcon} alt="Star" className="profile-badge-icon" />
                <span>Club Gold Member</span>
              </div>
            </div>

            <nav className="profile-nav-menu">
              {NAV_ITEMS.map((item) => (
                <button
                  key={item.key}
                  type="button"
                  className={`profile-nav-btn ${activeTab === item.key ? 'profile-nav-btn--active' : ''}`}
                  onClick={() => setActiveTab(item.key)}
                >
                  <img src={item.icon} alt={tp.nav[item.key]} className="profile-nav-3d-icon" />
                  <span>{tp.nav[item.key]}</span>
                  <span className="profile-nav-arrow">→</span>
                </button>
              ))}

              <button
                type="button"
                className="profile-nav-btn profile-nav-btn--logout"
                onClick={handleLogout}
              >
                <span className="profile-logout-icon">🚪</span>
                <span>{tp.logout}</span>
              </button>
            </nav>
          </aside>

          {/* Main Content Area */}
          <main className="profile-main">
            {activeTab === 'info' ? (
              <div className="profile-content-card">
                <div className="profile-content-header">
                  <div>
                    <h1 className="profile-content-title">{tp.accountDetails}</h1>
                    <p className="profile-content-sub">Manage your personal identification, phone, and delivery preferences.</p>
                  </div>
                  {!editing ? (
                    <button type="button" className="profile-btn-edit" onClick={handleEdit}>
                      <span>✏️ {tp.edit}</span>
                    </button>
                  ) : (
                    <div className="profile-edit-actions">
                      <button type="button" className="profile-btn-cancel" onClick={handleCancel} disabled={saving}>
                        {tp.cancel}
                      </button>
                      <button type="button" className="profile-btn-save" onClick={handleSave} disabled={saving}>
                        {saving ? 'Saving...' : tp.save}
                      </button>
                    </div>
                  )}
                </div>

                {error && (
                  <div className="profile-err-banner">
                    <span>⚠️</span> {error}
                  </div>
                )}

                {/* Form Fields */}
                <div className="profile-fields-grid">
                  <div className="profile-field-box">
                    <label>{tp.firstName}</label>
                    {editing ? (
                      <input name="firstName" value={draft.firstName} onChange={handleChange} />
                    ) : (
                      <div className="profile-val">{user.firstName || tp.notSet}</div>
                    )}
                  </div>

                  <div className="profile-field-box">
                    <label>{tp.lastName}</label>
                    {editing ? (
                      <input name="lastName" value={draft.lastName} onChange={handleChange} />
                    ) : (
                      <div className="profile-val">{user.lastName || tp.notSet}</div>
                    )}
                  </div>

                  <div className="profile-field-box">
                    <label>{tp.email}</label>
                    <div className="profile-val profile-val--muted">{user.email || tp.notSet}</div>
                  </div>

                  <div className="profile-field-box">
                    <label>{tp.phone}</label>
                    {editing ? (
                      <input name="phone" value={draft.phone} onChange={handleChange} />
                    ) : (
                      <div className="profile-val">{user.phone || tp.notSet}</div>
                    )}
                  </div>

                  <div className="profile-field-box">
                    <label>{tp.dob}</label>
                    {editing ? (
                      <input type="date" name="dob" value={draft.dob} onChange={handleChange} />
                    ) : (
                      <div className="profile-val">{user.dob || tp.notSet}</div>
                    )}
                  </div>

                  <div className="profile-field-box">
                    <label>{tp.gender}</label>
                    {editing ? (
                      <select name="gender" value={draft.gender} onChange={handleChange}>
                        <option value="">--</option>
                        {GENDER_OPTIONS.map((g) => (
                          <option key={g.value} value={g.value}>{g.label[lang]}</option>
                        ))}
                      </select>
                    ) : (
                      <div className="profile-val">
                        {GENDER_OPTIONS.find((g) => g.value === user.gender)?.label[lang] || user.gender || tp.notSet}
                      </div>
                    )}
                  </div>
                </div>

                {/* Danger Zone */}
                <div className="profile-danger-zone">
                  <h3 className="profile-danger-title">{tp.dangerZone}</h3>
                  <div className="profile-danger-box">
                    <div>
                      <strong>{tp.deleteAccountTitle}</strong>
                      <p>{tp.deleteAccountDesc}</p>
                    </div>
                    <button type="button" className="profile-btn-danger">
                      {tp.deleteAccountBtn}
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="profile-content-card profile-content-card--empty">
                <img src={walletIcon} alt="Tab" className="profile-empty-3d-icon" />
                <h2>{tp.nav[activeTab]}</h2>
                <p>No active records found in this section. Your transaction history and rewards will appear here automatically.</p>
              </div>
            )}
          </main>

        </div>

      </div>
    </div>
  )
}

export default Profile