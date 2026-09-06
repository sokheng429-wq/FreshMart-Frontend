import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useLanguage } from '../../context/LanguageContext'
import { useAuth } from '../../context/AuthContext'
import { authAPI, BACKEND_URL } from '../../api/api'
import { useTelegramLogin } from '../../hooks/useTelegramLogin'
import { Logo } from '../../components/Logo'
import bagIcon from '../../assets/icon/3dicons-bag-dynamic-color.png'
import shieldIcon from '../../assets/icon/3dicons-shield-dynamic-color.png'
import flashIcon from '../../assets/icon/3dicons-flash-dynamic-color.png'
import giftIcon from '../../assets/icon/3dicons-gift-box-dynamic-color.png'
import starIcon from '../../assets/icon/3dicons-star-dynamic-color.png'
import lockIcon from '../../assets/icon/3dicons-lock-dynamic-color.png'
import './Login.css'

const TEXTS = {
  eyebrow: { en: "Welcome back to FreshMart", kh: "សូមស្វាគមន៍មកកាន់ FreshMart" },
  title1: { en: 'Fresh groceries are just ', kh: 'គ្រឿងទេសស្រស់ៗត្រឹមតែ ' },
  titleHighlight: { en: 'one click away', kh: 'ចុចចូលគណនី' },
  subtitle: { en: 'Pick up where you left off — your cart, exclusive member savings, and orders are waiting for you.', kh: 'បន្តពីកន្លែងដែលអ្នកបានចាកចេញ — កន្ត្រកទំនិញ ការបញ្ចុះតម្លៃសមាជិក និងការបញ្ជាទិញកំពុងរង់ចាំអ្នក។' },
  testimonial: { en: '"Fast 30-minute delivery and guaranteed farm-fresh produce. My family\'s trusted daily grocery choice!"', kh: '"ការដឹកជញ្ជូនលឿនត្រឹម ៣០នាទី និងបន្លែផ្លែឈើស្រស់ពីកសិដ្ឋាន។ ជម្រើសទិញទំនិញប្រចាំថ្ងៃដែលទុកចិត្ត!"' },
  author: { en: 'Sophea K., Gold Member', kh: 'សុភា គ., សមាជិកកម្រិត Gold' },
  perk1: { en: 'Fast 30-Min Cold Express Delivery', kh: 'ដឹកជញ្ជូនត្រជាក់រហ័ស ៣០នាទី' },
  perk2: { en: '100% Organic & Farm Certified', kh: 'កសិផលសរីរាង្គ ១០០% ស្រស់ពីចម្ការ' },
  perk3: { en: 'Member Cashbacks & Flash Deals', kh: 'ប្រាក់ត្រឡប់មកវិញ & ប្រូម៉ូសិនពិសេស' },
  heading: { en: 'Log in to your account', kh: 'ចូលគណនីរបស់អ្នក' },
  newHere: { en: 'New here?', kh: 'ទើបតែមកដល់ថ្មី?' },
  createAccount: { en: 'Create an account', kh: 'បង្កើតគណនីឥតគិតថ្លៃ' },
  nameLabel: { en: 'Username, Email or Phone', kh: 'ឈ្មោះអ្នកប្រើ អ៊ីមែល ឬលេខទូរស័ព្ទ' },
  namePlaceholder: { en: 'e.g. sokheng or 012 345 678', kh: 'ឧ. sokheng ឬ ០១២ ៣៤៥ ៦៧៨' },
  passwordLabel: { en: 'Password', kh: 'ពាក្យសម្ងាត់' },
  passwordPlaceholder: { en: 'Enter your password', kh: 'បញ្ចូលពាក្យសម្ងាត់របស់អ្នក' },
  rememberMe: { en: 'Remember me', kh: 'ចងចាំខ្ញុំ' },
  forgotPassword: { en: 'Forgot password?', kh: 'ភ្លេចពាក្យសម្ងាត់?' },
  loginBtn: { en: 'Log in', kh: 'ចូលគណនី' },
  footerNote: { en: "By continuing, you agree to FreshMart's Terms of Service and Privacy Policy.", kh: 'ដោយបន្ត អ្នកយល់ព្រមនឹងលក្ខខណ្ឌសេវាកម្ម និងគោលការណ៍ឯកជនភាពរបស់ FreshMart។' },
  socialNote: { en: 'Secure 1-click login with your favorite provider.', kh: 'ចូលគណនីភ្លាមៗដោយសុវត្ថិភាពត្រឹមតែ ១ចុច។' },
}

export const Login = () => {
  const { lang } = useLanguage()
  const { login, sessionExpired, clearSessionExpired } = useAuth()
  const navigate = useNavigate()

  // Form state
  const [form, setForm] = useState({ identifier: '', password: '', remember: false })
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(() => {
    if (typeof window !== 'undefined' && localStorage.getItem('sessionExpired') === 'true') {
      localStorage.removeItem('sessionExpired')
      return 'Your session expired due to inactivity. Please log in again.'
    }
    return ''
  })
  const [socialBusy, setSocialBusy] = useState('')

  // Clear session expired flag
  useEffect(() => {
    if (sessionExpired) {
      clearSessionExpired()
    }
  }, [sessionExpired, clearSessionExpired])

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    setForm((prev) => ({ ...prev, [name]: type === 'checkbox' ? checked : value }))
  }

  // Password Submit
  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res = await authAPI.login(form.identifier, form.password)
      login(res.data)
      const uRole = (res.data?.user?.role || res.data?.role || '').toString().toUpperCase().replace(/^ROLE_/, '')
      if (uRole === 'ADMIN' || uRole === 'STORE' || uRole === 'SUPERADMIN' || uRole === 'MANAGER') {
        navigate('/admin')
      } else {
        navigate('/')
      }
    } catch (err) {
      setError(err.message || 'Login failed. Please check your credentials.')
    } finally {
      setLoading(false)
    }
  }

  // Telegram login
  const { handleTelegramLogin, isPolling: isTelegramPolling, error: telegramError } = useTelegramLogin({
    onAuth: async (userData) => {
      setError('')
      setSocialBusy('telegram')
      try {
        const loginData = {
          token: userData.token || userData.jwt,
          tokenType: userData.tokenType || 'Bearer',
          user: userData.user,
        }
        login(loginData)
        navigate('/')
      } catch (err) {
        setError(err.message)
        setSocialBusy('')
      }
    },
    onError: (err) => {
      setError(err.message)
      setSocialBusy('')
    },
  })

  return (
    <div className="auth auth--login">
      {/* Left Hero & Trust Showcase Panel */}
      <div className="auth-panel">
        <div className="auth-panel-top">
          <Logo />
        </div>

        <div className="auth-panel-body">
          <div className="auth-panel-eyebrow-wrap">
            <span className="auth-panel-eyebrow">
              <img src={flashIcon} alt="" className="h-4 w-4 object-contain inline-block mr-1" />
              {TEXTS.eyebrow[lang]}
            </span>
          </div>

          <h2 className="auth-panel-title">
            {TEXTS.title1[lang]}
            <span className="text-emerald-400">{TEXTS.titleHighlight[lang]}</span>
          </h2>

          <p className="auth-panel-subtitle">{TEXTS.subtitle[lang]}</p>

          {/* Key Value Perks with 3D Icons */}
          <div className="auth-perks-list">
            <div className="auth-perk-item">
              <div className="auth-perk-icon-box bg-emerald-500/15 border border-emerald-500/30">
                <img src={flashIcon} alt="" className="h-6 w-6 object-contain drop-shadow" />
              </div>
              <div className="auth-perk-text">
                <h4 className="text-white font-bold text-xs">{TEXTS.perk1[lang]}</h4>
              </div>
            </div>

            <div className="auth-perk-item">
              <div className="auth-perk-icon-box bg-lime-500/15 border border-lime-500/30">
                <img src={bagIcon} alt="" className="h-6 w-6 object-contain drop-shadow" />
              </div>
              <div className="auth-perk-text">
                <h4 className="text-white font-bold text-xs">{TEXTS.perk2[lang]}</h4>
              </div>
            </div>

            <div className="auth-perk-item">
              <div className="auth-perk-icon-box bg-amber-500/15 border border-amber-500/30">
                <img src={giftIcon} alt="" className="h-6 w-6 object-contain drop-shadow" />
              </div>
              <div className="auth-perk-text">
                <h4 className="text-white font-bold text-xs">{TEXTS.perk3[lang]}</h4>
              </div>
            </div>
          </div>

          {/* Testimonial Card */}
          <div className="auth-panel-card">
            <div className="flex items-center gap-1 mb-2">
              {[1, 2, 3, 4, 5].map((i) => (
                <img key={i} src={starIcon} alt="" className="h-4 w-4 object-contain" />
              ))}
            </div>
            <p className="italic text-slate-100 text-xs leading-relaxed">{TEXTS.testimonial[lang]}</p>
            <div className="flex items-center gap-2 mt-3 pt-2 border-t border-white/10">
              <div className="w-6 h-6 rounded-full bg-emerald-500/30 flex items-center justify-center font-bold text-emerald-300 text-[10px]">
                S
              </div>
              <span className="auth-panel-card-author text-xs font-semibold text-emerald-300">
                {TEXTS.author[lang]}
              </span>
            </div>
          </div>
        </div>

        {/* Ambient floating blobs */}
        <div className="auth-panel-blob auth-panel-blob--1" />
        <div className="auth-panel-blob auth-panel-blob--2" />
      </div>

      {/* Right Form Panel */}
      <div className="auth-form-side">
        <div className="auth-form-wrap">
          <div className="auth-mobile-logo">
            <Logo />
          </div>

          <div className="auth-header-block">
            <div className="flex items-center justify-between">
              <h1 className="auth-title">{TEXTS.heading[lang]}</h1>
              <img src={shieldIcon} alt="" className="h-8 w-8 object-contain drop-shadow hidden sm:block" />
            </div>
            <p className="auth-subtitle">
              {TEXTS.newHere[lang]}{' '}
              <Link to="/register" className="auth-link-highlight">
                {TEXTS.createAccount[lang]}
              </Link>
            </p>
          </div>

          {/* LOGIN FORM */}
          <form className="auth-form" onSubmit={handleSubmit}>
            <div className="field">
              <label htmlFor="identifier">
                <span className="field-icon">👤</span>
                {TEXTS.nameLabel[lang]}
              </label>
              <div className="input-wrap">
                <input
                  id="identifier"
                  name="identifier"
                  type="text"
                  placeholder={TEXTS.namePlaceholder[lang]}
                  value={form.identifier}
                  onChange={handleChange}
                  required
                  autoFocus
                  autoComplete="username"
                />
              </div>
            </div>

            <div className="field">
              <label htmlFor="password">
                <span className="field-icon">🔑</span>
                {TEXTS.passwordLabel[lang]}
              </label>
              <div className="input-wrap input-wrap--password">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder={TEXTS.passwordPlaceholder[lang]}
                  value={form.password}
                  onChange={handleChange}
                  required
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  className="password-toggle-btn"
                  onClick={() => setShowPassword(!showPassword)}
                  tabIndex="-1"
                  title={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? '👁️' : '👁️‍🗨️'}
                </button>
              </div>
            </div>

            {/* Remember Me & Forgot Password below Password Textbox */}
            <div className="field-inline">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  name="remember"
                  checked={form.remember}
                  onChange={handleChange}
                />
                <span>{TEXTS.rememberMe[lang]}</span>
              </label>

              <Link to="/forgot-password" className="link-muted text-xs hover:text-emerald-400 font-semibold">
                {TEXTS.forgotPassword[lang]}
              </Link>
            </div>

            {error && (
              <div className="auth-error-alert animate-shake">
                <span>⚠️ {error}</span>
                <button type="button" onClick={() => setError('')} className="auth-error-dismiss">✕</button>
              </div>
            )}

            <button type="submit" className="btn-submit btn-submit--gradient" disabled={loading}>
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <SpinnerIcon /> {lang === 'en' ? 'Authenticating…' : 'កំពុងផ្ទៀងផ្ទាត់…'}
                </span>
              ) : (
                <span>{TEXTS.loginBtn[lang]} →</span>
              )}
            </button>
          </form>

          {/* Social login */}
          <div className="auth-divider">
            <span>{lang === 'en' ? 'or continue with' : 'ឬបន្តជាមួយ'}</span>
          </div>

          <div className="social-auth">
            <a
              href={`${BACKEND_URL}/oauth2/authorization/google`}
              className="social-btn social-btn--gmail group"
            >
              <GmailIcon />
              <span>Google</span>
            </a>

            <a
              href={`${BACKEND_URL}/oauth2/authorization/facebook`}
              className="social-btn social-btn--facebook group"
            >
              <FacebookIcon />
              <span>Facebook</span>
            </a>

            <button
              type="button"
              onClick={handleTelegramLogin}
              disabled={isTelegramPolling || socialBusy === 'telegram'}
              className="social-btn social-btn--telegram group"
            >
              {isTelegramPolling || socialBusy === 'telegram' ? <SpinnerIcon /> : <TelegramIcon />}
              <span>Telegram</span>
            </button>
          </div>

          <p className="auth-social-note">{TEXTS.socialNote[lang]}</p>
          <p className="auth-footer-note">{TEXTS.footerNote[lang]}</p>
        </div>
      </div>
    </div>
  )
}

/* Brand logos for the social buttons */
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

export default Login
