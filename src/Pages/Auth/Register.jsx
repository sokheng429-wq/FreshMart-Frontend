import { useState, useMemo } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useLanguage } from '../../context/LanguageContext'
import { useAuth } from '../../context/AuthContext'
import { authAPI } from '../../api/api'
import { useTelegramLogin } from '../../hooks/useTelegramLogin'
import { Logo } from '../../components/Logo'
import crownIcon from '../../assets/icon/3dicons-crown-dynamic-color.png'
import rocketIcon from '../../assets/icon/3dicons-rocket-dynamic-color.png'
import giftIcon from '../../assets/icon/3dicons-gift-box-dynamic-color.png'
import heartIcon from '../../assets/icon/3dicons-heart-dynamic-color.png'
import shieldIcon from '../../assets/icon/3dicons-shield-dynamic-color.png'
import starIcon from '../../assets/icon/3dicons-star-dynamic-color.png'
import './Register.css'

const TEXTS = {
  eyebrow: { en: "Join FreshMart Club", kh: "ចូលរួមក្លឹប FreshMart" },
  title1: { en: 'Create an account, ', kh: 'បង្កើតគណនី ' },
  titleHighlight: { en: 'shop smarter', kh: 'ទិញទំនិញឆ្លាតជាងមុន' },
  subtitle: { en: 'Free delivery, member-only prices, and instant reward points every time you shop.', kh: 'ដឹកជញ្ជូនឥតគិតថ្លៃ តម្លៃសម្រាប់សមាជិក និងពិន្ទុរង្វាន់ភ្លាមៗរាល់ពេលដែលអ្នកទិញទំនិញ។' },
  testimonial: { en: '"Signing up took 1 minute and the member discounts on weekly groceries saved us a lot!"', kh: '"ការចុះឈ្មោះចំណាយពេលតែ ១នាទី ហើយការបញ្ចុះតម្លៃសមាជិកលើគ្រឿងទេសបានជួយសន្សំច្រើនណាស់!"' },
  author: { en: 'Dara V., VIP Member', kh: 'តារា វ., សមាជិក VIP' },
  perk1: { en: '$10 Instant Welcome Credit', kh: 'កាដូស្វាគមន៍ ១០ដុល្លារ ភ្លាមៗ' },
  perk2: { en: 'Free Express Delivery on 3 Orders', kh: 'ដឹកជញ្ជូនរហ័សឥតគិតថ្លៃ ៣ដង' },
  perk3: { en: '2x Points on Fresh Organic Produce', kh: 'ទទួលបានពិន្ទុគុណនឹង ២ លើបន្លែស្រស់' },
  perk4: { en: 'Priority Member Support & Returns', kh: 'សេវាកម្មអាទិភាព & ប្តូរទំនិញរហ័ស' },
  heading: { en: 'Create your account', kh: 'បង្កើតគណនីរបស់អ្នក' },
  alreadyHave: { en: 'Already have an account?', kh: 'មានគណនីរួចហើយ?' },
  logIn: { en: 'Log in here', kh: 'ចូលគណនីនៅទីនេះ' },
  secBasic: { en: 'Basic Information', kh: 'ព័ត៌មានមូលដ្ឋាន' },
  secContact: { en: 'Contact & Profile', kh: 'ទំនាក់ទំនង & ប្រវត្តិរូប' },
  secSecurity: { en: 'Account Security', kh: 'សុវត្ថិភាពគណនី' },
  usernameLabel: { en: 'Username', kh: 'ឈ្មោះអ្នកប្រើ' },
  usernamePlaceholder: { en: 'e.g. YourName', kh: 'ឧ. YourName' },
  nameLabel: { en: 'Full name', kh: 'ឈ្មោះពេញ' },
  namePlaceholder: { en: 'Your full name', kh: 'ឈ្មោះពេញរបស់អ្នក' },
  emailLabel: { en: 'Email Address', kh: 'អាសយដ្ឋានអ៊ីមែល' },
  emailPlaceholder: { en: 'you@example.com', kh: 'you@example.com' },
  phoneLabel: { en: 'Phone number (required)', kh: 'លេខទូរស័ព្ទ (ចាំបាច់)' },
  phonePlaceholder: { en: '012 345 678', kh: '០១២ ៣៤៥ ៦៧៨' },
  dateOfBirthLabel: { en: 'Date of Birth', kh: 'ថ្ងៃខែឆ្នាំកំណើត' },
  genderLabel: { en: 'Gender', kh: 'ភេទ' },
  genderPlaceholder: { en: 'Select gender', kh: 'ជ្រើសរើសភេទ' },
  genderMale: { en: 'Male', kh: 'ប្រុស' },
  genderFemale: { en: 'Female', kh: 'ស្រី' },
  genderOther: { en: 'Other', kh: 'ផ្សេងទៀត' },
  genderPreferNot: { en: 'Prefer not to say', kh: 'មិនចង់បញ្ជាក់' },
  nationalityLabel: { en: 'Nationality', kh: 'សញ្ជាតិ' },
  nationalityPlaceholder: { en: 'Select nationality', kh: 'ជ្រើសរើសសញ្ជាតិ' },
  passwordLabel: { en: 'Password', kh: 'ពាក្យសម្ងាត់' },
  passwordPlaceholder: { en: 'At least 8 characters', kh: 'យ៉ាងតិច ៨តួអក្សរ' },
  confirmLabel: { en: 'Confirm password', kh: 'បញ្ជាក់ពាក្យសម្ងាត់' },
  confirmPlaceholder: { en: 'Re-enter password', kh: 'បញ្ចូលពាក្យសម្ងាត់ម្តងទៀត' },
  agree1: { en: 'I agree to the ', kh: 'ខ្ញុំយល់ព្រមនឹង ' },
  terms: { en: 'Terms of Service', kh: 'លក្ខខណ្ឌសេវាកម្ម' },
  agree2: { en: ' and ', kh: ' និង ' },
  privacy: { en: 'Privacy Policy', kh: 'គោលការណ៍ឯកជនភាព' },
  submitBtn: { en: 'Create Account', kh: 'បង្កើតគណនី' },
  passwordMismatch: { en: "Passwords do not match.", kh: 'ពាក្យសម្ងាត់ទាំងពីរមិនត្រូវគ្នាទេ។' },
  socialOr: { en: 'or register with', kh: 'ឬចុះឈ្មោះជាមួយ' },
  socialNote: { en: 'Your account is automatically created & synced securely.', kh: 'គណនីរបស់អ្នកនឹងត្រូវបានបង្កើត និងតភ្ជាប់ដោយសុវត្ថិភាព។' },
  // Strength meter
  strengthWeak: { en: 'Weak', kh: 'ខ្សោយ' },
  strengthMedium: { en: 'Medium', kh: 'មធ្យម' },
  strengthStrong: { en: 'Strong', kh: 'រឹងមាំ' },
  reqLen: { en: '8+ chars', kh: '៨+ តួ' },
  reqNum: { en: 'Number', kh: 'លេខ' },
  reqUpper: { en: 'Uppercase', kh: 'អក្សរធំ' },
  reqMatch: { en: 'Match', kh: 'ដូចគ្នា' },
}

const COUNTRIES = [
  'Cambodia', 'Thailand', 'Vietnam', 'Laos', 'Myanmar',
  'Singapore', 'Malaysia', 'Indonesia', 'Philippines',
  'United States', 'United Kingdom', 'China', 'Japan',
  'South Korea', 'India', 'Australia', 'Canada', 'France',
  'Germany', 'Spain', 'Italy', 'Netherlands', 'Other'
]

export const Register = () => {
  const { lang } = useLanguage()
  const { login } = useAuth()
  const navigate = useNavigate()

  const [form, setForm] = useState({
    username: '',
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    agree: true,
    dateOfBirth: '',
    gender: '',
    nationality: 'Cambodia'
  })

  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [socialBusy, setSocialBusy] = useState('')

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    setForm((prev) => ({ ...prev, [name]: type === 'checkbox' ? checked : value }))
  }

  // Password strength calculation
  const strengthInfo = useMemo(() => {
    const pwd = form.password
    const hasLen = pwd.length >= 8
    const hasNum = /[0-9]/.test(pwd)
    const hasUpper = /[A-Z]/.test(pwd)
    const hasMatch = pwd && form.confirmPassword && pwd === form.confirmPassword

    let score = 0
    if (pwd.length >= 6) score++
    if (hasLen) score++
    if (hasNum) score++
    if (hasUpper) score++

    let label = TEXTS.strengthWeak[lang]
    let color = 'bg-rose-500'
    let width = '33%'

    if (score >= 4) {
      label = TEXTS.strengthStrong[lang]
      color = 'bg-emerald-500'
      width = '100%'
    } else if (score >= 2) {
      label = TEXTS.strengthMedium[lang]
      color = 'bg-amber-500'
      width = '66%'
    }

    return { score, label, color, width, hasLen, hasNum, hasUpper, hasMatch }
  }, [form.password, form.confirmPassword, lang])

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (form.password !== form.confirmPassword) {
      setError(TEXTS.passwordMismatch[lang])
      return
    }
    setError('')
    setLoading(true)
    try {
      const res = await authAPI.register({
        username: form.username.trim(),
        fullName: form.name.trim(),
        email: form.email.trim(),
        phoneNumber: form.phone.trim(),
        password: form.password,
        confirmPassword: form.confirmPassword,
        dateOfBirth: form.dateOfBirth || undefined,
        gender: form.gender || undefined,
        nationality: form.nationality || undefined
      })
      login(res.data)
      navigate('/')
    } catch (err) {
      setError(err.message || 'Registration failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  // Telegram signup
  const handleTelegramAuth = async (telegramUser) => {
    setError('')
    setSocialBusy('telegram')
    try {
      const res = await authAPI.socialLogin('telegram', JSON.stringify(telegramUser))
      login(res.data)
      navigate('/')
    } catch (err) {
      setError(err.message)
    } finally {
      setSocialBusy('')
    }
  }

  const { telegramButtonRef } = useTelegramLogin({
    onAuth: handleTelegramAuth,
    onError: (err) => setError(err.message),
  })

  return (
    <div className="auth auth--register">
      {/* Left Perks Showcase Panel */}
      <div className="auth-panel">
        <div className="auth-panel-top">
          <Logo />
        </div>

        <div className="auth-panel-body">
          <div className="auth-panel-eyebrow-wrap">
            <span className="auth-panel-eyebrow">
              <img src={crownIcon} alt="" className="h-4 w-4 object-contain inline-block mr-1" />
              {TEXTS.eyebrow[lang]}
            </span>
          </div>

          <h2 className="auth-panel-title">
            {TEXTS.title1[lang]}
            <span className="text-emerald-400">{TEXTS.titleHighlight[lang]}</span>
          </h2>

          <p className="auth-panel-subtitle">{TEXTS.subtitle[lang]}</p>

          {/* 4 Key Perks with 3D Icons */}
          <div className="auth-perks-list">
            <div className="auth-perk-item">
              <div className="auth-perk-icon-box bg-amber-500/15 border border-amber-500/30">
                <img src={crownIcon} alt="" className="h-6 w-6 object-contain drop-shadow" />
              </div>
              <div className="auth-perk-text">
                <h4 className="text-white font-bold text-xs">{TEXTS.perk1[lang]}</h4>
              </div>
            </div>

            <div className="auth-perk-item">
              <div className="auth-perk-icon-box bg-emerald-500/15 border border-emerald-500/30">
                <img src={rocketIcon} alt="" className="h-6 w-6 object-contain drop-shadow" />
              </div>
              <div className="auth-perk-text">
                <h4 className="text-white font-bold text-xs">{TEXTS.perk2[lang]}</h4>
              </div>
            </div>

            <div className="auth-perk-item">
              <div className="auth-perk-icon-box bg-lime-500/15 border border-lime-500/30">
                <img src={giftIcon} alt="" className="h-6 w-6 object-contain drop-shadow" />
              </div>
              <div className="auth-perk-text">
                <h4 className="text-white font-bold text-xs">{TEXTS.perk3[lang]}</h4>
              </div>
            </div>

            <div className="auth-perk-item">
              <div className="auth-perk-icon-box bg-rose-500/15 border border-rose-500/30">
                <img src={heartIcon} alt="" className="h-6 w-6 object-contain drop-shadow" />
              </div>
              <div className="auth-perk-text">
                <h4 className="text-white font-bold text-xs">{TEXTS.perk4[lang]}</h4>
              </div>
            </div>
          </div>

          {/* Member Testimonial Card */}
          <div className="auth-panel-card">
            <div className="flex items-center gap-1 mb-2">
              {[1, 2, 3, 4, 5].map((i) => (
                <img key={i} src={starIcon} alt="" className="h-4 w-4 object-contain" />
              ))}
            </div>
            <p className="italic text-slate-100 text-xs leading-relaxed">{TEXTS.testimonial[lang]}</p>
            <div className="flex items-center gap-2 mt-3 pt-2 border-t border-white/10">
              <div className="w-6 h-6 rounded-full bg-amber-500/30 flex items-center justify-center font-bold text-amber-300 text-[10px]">
                D
              </div>
              <span className="auth-panel-card-author text-xs font-semibold text-amber-300">
                {TEXTS.author[lang]}
              </span>
            </div>
          </div>
        </div>

        <div className="auth-panel-blob auth-panel-blob--1" />
        <div className="auth-panel-blob auth-panel-blob--2" />
      </div>

      {/* Right Registration Form Side */}
      <div className="auth-form-side">
        <div className="auth-form-wrap auth-form-wrap--wide">
          <div className="auth-mobile-logo">
            <Logo />
          </div>

          <div className="auth-header-block">
            <div className="flex items-center justify-between">
              <h1 className="auth-title">{TEXTS.heading[lang]}</h1>
              <img src={shieldIcon} alt="" className="h-8 w-8 object-contain drop-shadow hidden sm:block" />
            </div>
            <p className="auth-subtitle">
              {TEXTS.alreadyHave[lang]}{' '}
              <Link to="/login" className="auth-link-highlight">
                {TEXTS.logIn[lang]}
              </Link>
            </p>
          </div>

          <form className="auth-form" onSubmit={handleSubmit}>
            {/* Section 1: Basic Information */}
            <div className="auth-section-card">
              <h3 className="auth-section-title">
                <span>👤</span> {TEXTS.secBasic[lang]}
              </h3>
              <div className="auth-grid-2">
                <div className="field">
                  <label htmlFor="name">{TEXTS.nameLabel[lang]} *</label>
                  <div className="input-wrap">
                    <input
                      id="name"
                      name="name"
                      type="text"
                      placeholder={TEXTS.namePlaceholder[lang]}
                      value={form.name}
                      onChange={handleChange}
                      required
                    />
                  </div>
                </div>

                <div className="field">
                  <label htmlFor="username">{TEXTS.usernameLabel[lang]} *</label>
                  <div className="input-wrap">
                    <input
                      id="username"
                      name="username"
                      type="text"
                      placeholder={TEXTS.usernamePlaceholder[lang]}
                      value={form.username}
                      onChange={handleChange}
                      required
                      autoComplete="username"
                    />
                  </div>
                </div>
              </div>

              <div className="field mt-3">
                <label htmlFor="email">{TEXTS.emailLabel[lang]} *</label>
                <div className="input-wrap">
                  <input
                    id="email"
                    name="email"
                    type="email"
                    placeholder={TEXTS.emailPlaceholder[lang]}
                    value={form.email}
                    onChange={handleChange}
                    required
                    autoComplete="email"
                  />
                </div>
              </div>
            </div>

            {/* Section 2: Contact & Profile */}
            <div className="auth-section-card">
              <h3 className="auth-section-title">
                <span>📱</span> {TEXTS.secContact[lang]}
              </h3>
              <div className="auth-grid-2">
                <div className="field">
                  <label htmlFor="phone">{TEXTS.phoneLabel[lang]} *</label>
                  <div className="input-wrap">
                    <input
                      id="phone"
                      name="phone"
                      type="tel"
                      placeholder={TEXTS.phonePlaceholder[lang]}
                      value={form.phone}
                      onChange={handleChange}
                      required
                      autoComplete="tel"
                    />
                  </div>
                </div>

                <div className="field">
                  <label htmlFor="dateOfBirth">{TEXTS.dateOfBirthLabel[lang]}</label>
                  <div className="input-wrap">
                    <input
                      id="dateOfBirth"
                      name="dateOfBirth"
                      type="date"
                      value={form.dateOfBirth}
                      onChange={handleChange}
                      max={new Date().toISOString().split('T')[0]}
                    />
                  </div>
                </div>
              </div>

              <div className="auth-grid-2 mt-3">
                <div className="field">
                  <label htmlFor="gender">{TEXTS.genderLabel[lang]}</label>
                  <select
                    id="gender"
                    name="gender"
                    value={form.gender}
                    onChange={handleChange}
                    className="auth-select"
                  >
                    <option value="">{TEXTS.genderPlaceholder[lang]}</option>
                    <option value="Male">{TEXTS.genderMale[lang]}</option>
                    <option value="Female">{TEXTS.genderFemale[lang]}</option>
                    <option value="Other">{TEXTS.genderOther[lang]}</option>
                    <option value="Prefer not to say">{TEXTS.genderPreferNot[lang]}</option>
                  </select>
                </div>

                <div className="field">
                  <label htmlFor="nationality">{TEXTS.nationalityLabel[lang]}</label>
                  <select
                    id="nationality"
                    name="nationality"
                    value={form.nationality}
                    onChange={handleChange}
                    className="auth-select"
                  >
                    <option value="">{TEXTS.nationalityPlaceholder[lang]}</option>
                    {COUNTRIES.map((country) => (
                      <option key={country} value={country}>{country}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Section 3: Security & Passwords */}
            <div className="auth-section-card">
              <h3 className="auth-section-title">
                <span>🔒</span> {TEXTS.secSecurity[lang]}
              </h3>

              <div className="auth-grid-2">
                <div className="field">
                  <label htmlFor="password">{TEXTS.passwordLabel[lang]} *</label>
                  <div className="input-wrap input-wrap--password">
                    <input
                      id="password"
                      name="password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder={TEXTS.passwordPlaceholder[lang]}
                      value={form.password}
                      onChange={handleChange}
                      required
                      autoComplete="new-password"
                    />
                    <button
                      type="button"
                      className="password-toggle-btn"
                      onClick={() => setShowPassword(!showPassword)}
                      tabIndex="-1"
                    >
                      {showPassword ? '👁️' : '👁️‍🗨️'}
                    </button>
                  </div>
                </div>

                <div className="field">
                  <label htmlFor="confirmPassword">{TEXTS.confirmLabel[lang]} *</label>
                  <div className="input-wrap input-wrap--password">
                    <input
                      id="confirmPassword"
                      name="confirmPassword"
                      type={showConfirmPassword ? 'text' : 'password'}
                      placeholder={TEXTS.confirmPlaceholder[lang]}
                      value={form.confirmPassword}
                      onChange={handleChange}
                      required
                      autoComplete="new-password"
                    />
                    <button
                      type="button"
                      className="password-toggle-btn"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      tabIndex="-1"
                    >
                      {showConfirmPassword ? '👁️' : '👁️‍🗨️'}
                    </button>
                  </div>
                </div>
              </div>

              {/* Live Password Strength Meter */}
              {form.password && (
                <div className="auth-pwd-meter-box mt-3">
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="text-slate-400">Password Strength:</span>
                    <span className="font-bold text-slate-200">{strengthInfo.label}</span>
                  </div>
                  <div className="w-full h-1.5 bg-slate-700/60 rounded-full overflow-hidden mb-2">
                    <div
                      className={`h-full ${strengthInfo.color} transition-all duration-300`}
                      style={{ width: strengthInfo.width }}
                    />
                  </div>
                  <div className="flex flex-wrap gap-1 text-[10px]">
                    <span className={`px-2 py-0.5 rounded-md ${strengthInfo.hasLen ? 'bg-emerald-500/20 text-emerald-300' : 'bg-slate-800 text-slate-500'}`}>
                      {strengthInfo.hasLen ? '✓' : '○'} {TEXTS.reqLen[lang]}
                    </span>
                    <span className={`px-2 py-0.5 rounded-md ${strengthInfo.hasNum ? 'bg-emerald-500/20 text-emerald-300' : 'bg-slate-800 text-slate-500'}`}>
                      {strengthInfo.hasNum ? '✓' : '○'} {TEXTS.reqNum[lang]}
                    </span>
                    <span className={`px-2 py-0.5 rounded-md ${strengthInfo.hasUpper ? 'bg-emerald-500/20 text-emerald-300' : 'bg-slate-800 text-slate-500'}`}>
                      {strengthInfo.hasUpper ? '✓' : '○'} {TEXTS.reqUpper[lang]}
                    </span>
                    {form.confirmPassword && (
                      <span className={`px-2 py-0.5 rounded-md ${strengthInfo.hasMatch ? 'bg-emerald-500/20 text-emerald-300' : 'bg-rose-500/20 text-rose-300'}`}>
                        {strengthInfo.hasMatch ? '✓' : '✗'} {TEXTS.reqMatch[lang]}
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Terms Checkbox */}
            <label className="checkbox-label mt-1">
              <input
                type="checkbox"
                name="agree"
                checked={form.agree}
                onChange={handleChange}
                required
              />
              <span className="terms-text text-xs leading-relaxed">
                {TEXTS.agree1[lang]}
                <Link to="/terms-privacy" className="text-emerald-400 hover:underline">
                  {TEXTS.terms[lang]}
                </Link>
                {TEXTS.agree2[lang]}
                <Link to="/terms-privacy" className="text-emerald-400 hover:underline">
                  {TEXTS.privacy[lang]}
                </Link>
              </span>
            </label>

            {error && (
              <div className="auth-error-alert animate-shake">
                <span>⚠️ {error}</span>
                <button type="button" onClick={() => setError('')} className="auth-error-dismiss">✕</button>
              </div>
            )}

            <button type="submit" className="btn-submit btn-submit--gradient" disabled={loading}>
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <SpinnerIcon /> {lang === 'en' ? 'Creating Account…' : 'កំពុងបង្កើតគណនី…'}
                </span>
              ) : (
                <span>{TEXTS.submitBtn[lang]} →</span>
              )}
            </button>
          </form>

          {/* Social Signups */}
          <div className="auth-divider">
            <span>{TEXTS.socialOr[lang]}</span>
          </div>

          <div className="social-auth">
            <a
              href="http://localhost:8081/oauth2/authorization/google"
              className="social-btn social-btn--gmail group"
            >
              <GmailIcon />
              <span>Google</span>
            </a>

            <a
              href="http://localhost:8081/oauth2/authorization/facebook"
              className="social-btn social-btn--facebook group"
            >
              <FacebookIcon />
              <span>Facebook</span>
            </a>

            <div className="social-btn social-btn--telegram social-btn--gis-wrap group">
              {socialBusy === 'telegram' ? <SpinnerIcon /> : <TelegramIcon />}
              <span>Telegram</span>
              <div ref={telegramButtonRef} className="social-btn--gis-overlay" />
            </div>
          </div>

          <p className="auth-social-note">{TEXTS.socialNote[lang]}</p>
        </div>
      </div>
    </div>
  )
}

/* Social icons */
const GmailIcon = () => (
  <svg width="18" height="18" viewBox="0 0 48 48">
    <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
    <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
    <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
    <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
  </svg>
)

const TelegramIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
    <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" fill="#229ED9" />
  </svg>
)

const FacebookIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
    <path d="M24 12.073C24 5.405 18.627 0 12 0S0 5.405 0 12.073C0 18.1 4.388 23.094 10.125 24v-8.437H7.078v-3.49h3.047v-2.66c0-3.026 1.792-4.697 4.533-4.697 1.313 0 2.686.235 2.686.235v2.971H15.83c-1.491 0-1.956.93-1.956 1.886v2.265h3.328l-.532 3.49h-2.796V24C19.612 23.094 24 18.1 24 12.073z" fill="#1877F2" />
  </svg>
)

const SpinnerIcon = () => (
  <svg className="spin" width="18" height="18" viewBox="0 0 24 24" fill="none">
    <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="3" strokeDasharray="40 20" strokeLinecap="round" />
  </svg>
)

export default Register

