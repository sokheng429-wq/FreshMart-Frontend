import { useEffect, useState, useRef, useMemo } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useLanguage } from '../../context/LanguageContext'
import { authAPI } from '../../api/api'
import { Logo } from '../../components/Logo'
import lockIcon from '../../assets/icon/3dicons-lock-dynamic-color.png'
import keyIcon from '../../assets/icon/3dicons-key-dynamic-color.png'
import shieldIcon from '../../assets/icon/3dicons-shield-dynamic-color.png'
import trophyIcon from '../../assets/icon/3dicons-trophy-dynamic-color.png'
import mailIcon from '../../assets/icon/3dicons-mail-dynamic-color.png'
import './Forgotpassword.css'

const TEXTS = {
  eyebrow: { en: 'Secure Account Recovery', kh: 'ការស្តារគណនីប្រកបដោយសុវត្ថិភាព' },
  title1: { en: 'Locked out? ', kh: 'ភ្លេចពាក្យសម្ងាត់? ' },
  titleHighlight: { en: "We'll get you back in", kh: 'យើងនឹងជួយអ្នកចូលវិញភ្លាមៗ' },
  subtitle: { en: "Follow the simple 3-step verification to restore full access to your FreshMart account safely.", kh: 'អនុវត្តតាមការផ្ទៀងផ្ទាត់ ៣ជំហានងាយៗ ដើម្បីចូលប្រើប្រាស់គណនី FreshMart របស់អ្នកឡើងវិញដោយសុវត្ថិភាព។' },
  perk1: { en: 'End-to-End Encrypted Verification', kh: 'ការផ្ទៀងផ្ទាត់ដែលបានអ៊ិនគ្រីបកម្រិតខ្ពស់' },
  perk2: { en: 'Instant 6-Digit One-Time Passcode', kh: 'លេខកូដសម្ងាត់ OTP ៦ខ្ទង់ភ្លាមៗ' },
  perk3: { en: 'Zero Data Loss on Cart & History', kh: 'រក្សាទុកទំនិញក្នុងកន្ត្រក & ប្រវត្តិទិញដដែល' },
  heading: { en: 'Reset your password', kh: 'កំណត់ពាក្យសម្ងាត់ឡើងវិញ' },
  backToLogin: { en: 'back to login', kh: 'ត្រលប់ទៅចូលគណនី' },
  noWorries: { en: 'Remember your password? ', kh: 'ចាំពាក្យសម្ងាត់វិញហើយ? ' },
  emailLabel: { en: 'Registered Email Address', kh: 'អាសយដ្ឋានអ៊ីមែលដែលបានចុះឈ្មោះ' },
  emailPlaceholder: { en: 'you@example.com', kh: 'you@example.com' },
  sendOtp: { en: 'Send Reset Code', kh: 'ផ្ញើលេខកូដកំណត់ឡើងវិញ' },
  sending: { en: 'Sending Code…', kh: 'កំពុងផ្ញើលេខកូដ…' },
  // Step 2: OTP
  enterOtp: { en: 'Enter 6-Digit OTP', kh: 'បញ្ចូលលេខកូដ OTP ៦ខ្ទង់' },
  otpSentTo: { en: 'We sent a verification code to ', kh: 'យើងបានផ្ញើលេខកូដផ្ទៀងផ្ទាត់ទៅកាន់ ' },
  verifyOtp: { en: 'Verify & Continue', kh: 'ផ្ទៀងផ្ទាត់ & បន្ត' },
  resendOtp: { en: 'Resend code', kh: 'ផ្ញើលេខកូដម្តងទៀត' },
  changeEmail: { en: 'Change email address', kh: 'ប្តូរអាសយដ្ឋានអ៊ីមែល' },
  expiresIn: { en: 'Code expires in ', kh: 'កូដផុតកំណត់ក្នុងរយៈពេល ' },
  expired: { en: 'Code expired. Please request a new one.', kh: 'កូដបានផុតកំណត់។ សូមស្នើសុំកូដថ្មី។' },
  // Step 3: New password
  newPasswordTitle: { en: 'Create new password', kh: 'បង្កើតពាក្យសម្ងាត់ថ្មី' },
  newPasswordSubtitle: { en: 'Choose a strong password to protect your account.', kh: 'ជ្រើសរើសពាក្យសម្ងាត់ដែលរឹងមាំដើម្បីការពារគណនីរបស់អ្នក។' },
  newPasswordLabel: { en: 'New password', kh: 'ពាក្យសម្ងាត់ថ្មី' },
  newPasswordPlaceholder: { en: 'At least 8 characters', kh: 'យ៉ាងតិច ៨តួអក្សរ' },
  confirmLabel: { en: 'Confirm new password', kh: 'បញ្ជាក់ពាក្យសម្ងាត់ថ្មី' },
  confirmPlaceholder: { en: 'Re-enter new password', kh: 'បញ្ចូលពាក្យសម្ងាត់ម្តងទៀត' },
  resetBtn: { en: 'Update Password', kh: 'ធ្វើបច្ចុប្បន្នភាពពាក្យសម្ងាត់' },
  passwordMismatch: { en: "Passwords do not match.", kh: 'ពាក្យសម្ងាត់ទាំងពីរមិនត្រូវគ្នាទេ។' },
  // Success
  successTitle: { en: 'Password Reset Successful!', kh: 'កំណត់ពាក្យសម្ងាត់បានជោគជ័យ!' },
  successText: { en: 'Your password has been safely updated. You can now log in with your new credentials.', kh: 'ពាក្យសម្ងាត់របស់អ្នកត្រូវបានផ្លាស់ប្តូរដោយជោគជ័យ។ អ្នកអាចចូលគណនីដោយប្រើពាក្យសម្ងាត់ថ្មី។' },
  goToLogin: { en: 'Go to Login Now', kh: 'ចូលគណនីឥឡូវនេះ' },
  autoRedirect: { en: 'Redirecting to login in ', kh: 'នឹងប្តូរទៅទំព័រចូលគណនីក្នុង ' },
  // Strength meter
  strengthWeak: { en: 'Weak', kh: 'ខ្សោយ' },
  strengthMedium: { en: 'Medium', kh: 'មធ្យម' },
  strengthStrong: { en: 'Strong', kh: 'រឹងមាំ' },
}

export const ForgotPassword = () => {
  const { lang } = useLanguage()
  const navigate = useNavigate()

  const [step, setStep] = useState(1)
  const [email, setEmail] = useState('')
  
  // 6-digit segmented OTP
  const [otpDigits, setOtpDigits] = useState(['', '', '', '', '', ''])
  const otpInputRefs = useRef([])

  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  
  const [sending, setSending] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [expiresAt, setExpiresAt] = useState(null)
  const [remaining, setRemaining] = useState(null)
  const [redirectCountdown, setRedirectCountdown] = useState(5)

  // Full OTP string
  const fullOtp = otpDigits.join('')

  // Handle OTP Segment Input
  const handleDigitChange = (index, value) => {
    const val = value.replace(/\D/g, '').slice(-1)
    const newDigits = [...otpDigits]
    newDigits[index] = val
    setOtpDigits(newDigits)

    if (val && index < 5) {
      otpInputRefs.current[index + 1]?.focus()
    }
  }

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otpDigits[index] && index > 0) {
      otpInputRefs.current[index - 1]?.focus()
    }
  }

  const handlePaste = (e) => {
    e.preventDefault()
    const pastedData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6)
    if (pastedData) {
      const newDigits = [...otpDigits]
      for (let i = 0; i < pastedData.length; i++) {
        newDigits[i] = pastedData[i]
      }
      setOtpDigits(newDigits)
      const nextIndex = Math.min(pastedData.length, 5)
      otpInputRefs.current[nextIndex]?.focus()
    }
  }

  // Password strength calculation
  const strengthInfo = useMemo(() => {
    const pwd = newPassword
    const hasLen = pwd.length >= 8
    const hasNum = /[0-9]/.test(pwd)
    const hasUpper = /[A-Z]/.test(pwd)

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

    return { label, color, width }
  }, [newPassword, lang])

  // Step 1: Send OTP
  const handleSendOtp = async (e) => {
    e.preventDefault()
    if (sending) return
    setSending(true)
    setError('')
    try {
      const res = await authAPI.sendForgotPasswordOtp(email.trim())
      startCountdown(res)
      setStep(2)
    } catch (err) {
      setError(err.message || 'Failed to send reset code. Please verify your email.')
    } finally {
      setSending(false)
    }
  }

  // Resend OTP
  const handleResendOtp = async () => {
    if (sending) return
    setSending(true)
    setError('')
    try {
      const res = await authAPI.sendForgotPasswordOtp(email.trim())
      startCountdown(res)
      setOtpDigits(['', '', '', '', '', ''])
      otpInputRefs.current[0]?.focus()
    } catch (err) {
      setError(err.message || 'Failed to resend code.')
    } finally {
      setSending(false)
    }
  }

  const startCountdown = (res) => {
    const seconds = res?.expiresInSeconds ?? 300
    setExpiresAt(Date.now() + seconds * 1000)
    setRemaining(seconds)
  }

  // Tick the countdown
  useEffect(() => {
    if (step !== 2 || !expiresAt) return
    const tick = () => setRemaining(Math.max(0, Math.round((expiresAt - Date.now()) / 1000)))
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [step, expiresAt])

  const secondsLeft = remaining ?? 0
  const isExpired = secondsLeft === 0
  const mm = Math.floor(secondsLeft / 60)
  const ss = String(secondsLeft % 60).padStart(2, '0')

  // Step 2: Verify OTP
  const handleVerifyOtp = async (e) => {
    e.preventDefault()
    if (fullOtp.length < 6) {
      setError(lang === 'en' ? 'Please enter the complete 6-digit OTP code.' : 'សូមបញ្ចូលលេខកូដ OTP ៦ខ្ទង់ឱ្យបានពេញលេញ។')
      return
    }
    setError('')
    setLoading(true)
    try {
      await authAPI.verifyForgotPasswordOtp(email.trim(), fullOtp)
      setStep(3)
    } catch (err) {
      setError(err.message || 'Invalid or expired OTP code.')
    } finally {
      setLoading(false)
    }
  }

  // Step 3: Reset Password
  const handleReset = async (e) => {
    e.preventDefault()
    if (newPassword !== confirmPassword) {
      setError(TEXTS.passwordMismatch[lang])
      return
    }
    setError('')
    setLoading(true)
    try {
      await authAPI.resetPassword(email.trim(), newPassword)
      setStep(4)
    } catch (err) {
      setError(err.message || 'Failed to update password. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  // Auto redirect on step 4
  useEffect(() => {
    if (step === 4) {
      const interval = setInterval(() => {
        setRedirectCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(interval)
            navigate('/login')
            return 0
          }
          return prev - 1
        })
      }, 1000)
      return () => clearInterval(interval)
    }
  }, [step, navigate])

  const goToStep = (s) => {
    setStep(s)
    if (s === 1) {
      setOtpDigits(['', '', '', '', '', ''])
      setNewPassword('')
      setConfirmPassword('')
    }
  }

  return (
    <div className="auth auth--forgot">
      {/* Left Trust & Recovery Panel */}
      <div className="auth-panel">
        <div className="auth-panel-top">
          <Logo />
        </div>

        <div className="auth-panel-body">
          <div className="auth-panel-eyebrow-wrap">
            <span className="auth-panel-eyebrow">
              <img src={lockIcon} alt="" className="h-4 w-4 object-contain inline-block mr-1" />
              {TEXTS.eyebrow[lang]}
            </span>
          </div>

          <h2 className="auth-panel-title">
            {TEXTS.title1[lang]}
            <span className="text-emerald-400">{TEXTS.titleHighlight[lang]}</span>
          </h2>

          <p className="auth-panel-subtitle">{TEXTS.subtitle[lang]}</p>

          {/* Recovery assurances */}
          <div className="auth-perks-list">
            <div className="auth-perk-item">
              <div className="auth-perk-icon-box bg-emerald-500/15 border border-emerald-500/30">
                <img src={shieldIcon} alt="" className="h-6 w-6 object-contain drop-shadow" />
              </div>
              <div className="auth-perk-text">
                <h4 className="text-white font-bold text-xs">{TEXTS.perk1[lang]}</h4>
              </div>
            </div>

            <div className="auth-perk-item">
              <div className="auth-perk-icon-box bg-amber-500/15 border border-amber-500/30">
                <img src={keyIcon} alt="" className="h-6 w-6 object-contain drop-shadow" />
              </div>
              <div className="auth-perk-text">
                <h4 className="text-white font-bold text-xs">{TEXTS.perk2[lang]}</h4>
              </div>
            </div>

            <div className="auth-perk-item">
              <div className="auth-perk-icon-box bg-lime-500/15 border border-lime-500/30">
                <img src={mailIcon} alt="" className="h-6 w-6 object-contain drop-shadow" />
              </div>
              <div className="auth-perk-text">
                <h4 className="text-white font-bold text-xs">{TEXTS.perk3[lang]}</h4>
              </div>
            </div>
          </div>
        </div>

        <div className="auth-panel-blob auth-panel-blob--1" />
        <div className="auth-panel-blob auth-panel-blob--2" />
      </div>

      {/* Right Stepper Flow Side */}
      <div className="auth-form-side">
        <div className="auth-form-wrap">
          <div className="auth-mobile-logo">
            <Logo />
          </div>

          {/* Prominent Back to Login Button */}
          <div className="forgot-back-top mb-4">
            <Link
              to="/login"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-emerald-400 transition-colors py-1 px-2.5 rounded-lg bg-slate-800/60 border border-slate-700/50 hover:border-emerald-500/40 no-underline"
            >
              <span>←</span>
              <span>{TEXTS.backToLogin[lang]}</span>
            </Link>
          </div>

          {/* 4-Step Progress Indicator */}
          <div className="forgot-steps-bar">
            {[1, 2, 3, 4].map((s) => (
              <div
                key={s}
                className={`forgot-step-node ${s < step ? 'forgot-step-node--done' : ''} ${s === step ? 'forgot-step-node--active' : ''}`}
              >
                <div className="forgot-step-circle">
                  {s < step ? '✓' : s}
                </div>
                <span className="forgot-step-title">
                  {s === 1
                    ? (lang === 'en' ? 'Email' : 'អ៊ីមែល')
                    : s === 2
                    ? 'OTP'
                    : s === 3
                    ? (lang === 'en' ? 'Password' : 'ពាក្យសម្ងាត់')
                    : (lang === 'en' ? 'Done' : 'រួចរាល់')}
                </span>
              </div>
            ))}
          </div>

          {/* STEP 1: ENTER EMAIL */}
          {step === 1 && (
            <div className="auth-step-container">
              <div className="auth-header-block">
                <h1 className="auth-title">{TEXTS.heading[lang]}</h1>
                <p className="auth-subtitle">
                  {TEXTS.noWorries[lang]}
                  <Link to="/login" className="auth-link-highlight">
                    {TEXTS.backToLogin[lang]}
                  </Link>
                </p>
              </div>

              <form className="auth-form" onSubmit={handleSendOtp}>
                <div className="field">
                  <label htmlFor="email">
                    <span className="field-icon">✉️</span>
                    {TEXTS.emailLabel[lang]}
                  </label>
                  <div className="input-wrap">
                    <input
                      id="email"
                      name="email"
                      type="email"
                      placeholder={TEXTS.emailPlaceholder[lang]}
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      autoFocus
                      autoComplete="email"
                    />
                  </div>
                </div>

                {error && (
                  <div className="auth-error-alert animate-shake">
                    <span>⚠️ {error}</span>
                    <button type="button" onClick={() => setError('')} className="auth-error-dismiss">✕</button>
                  </div>
                )}

                <button type="submit" className="btn-submit btn-submit--gradient" disabled={sending}>
                  {sending ? (
                    <span className="flex items-center justify-center gap-2">
                      <SpinnerIcon /> {TEXTS.sending[lang]}
                    </span>
                  ) : (
                    <span>{TEXTS.sendOtp[lang]} →</span>
                  )}
                </button>
              </form>
            </div>
          )}

          {/* STEP 2: ENTER 6-DIGIT OTP */}
          {step === 2 && (
            <div className="auth-step-container">
              <div className="auth-header-block">
                <h1 className="auth-title">{TEXTS.enterOtp[lang]}</h1>
                <p className="auth-subtitle">
                  {TEXTS.otpSentTo[lang]}<strong className="text-emerald-400">{email}</strong>
                </p>
              </div>

              <form className="auth-form" onSubmit={handleVerifyOtp}>
                <div className="field">
                  <label className="text-center block mb-2">{TEXTS.enterOtp[lang]}</label>
                  
                  {/* Segmented 6-Box OTP Input */}
                  <div className="segmented-otp-wrap" onPaste={handlePaste}>
                    {otpDigits.map((digit, idx) => (
                      <input
                        key={idx}
                        ref={(el) => (otpInputRefs.current[idx] = el)}
                        type="text"
                        inputMode="numeric"
                        maxLength="1"
                        value={digit}
                        onChange={(e) => handleDigitChange(idx, e.target.value)}
                        onKeyDown={(e) => handleKeyDown(idx, e)}
                        className="segmented-otp-box"
                        autoFocus={idx === 0}
                      />
                    ))}
                  </div>
                </div>

                {/* Countdown Timer */}
                <div className={`otp-timer-badge ${isExpired ? 'otp-timer-badge--expired' : ''}`}>
                  {isExpired ? (
                    <span>⚠️ {TEXTS.expired[lang]}</span>
                  ) : (
                    <span>
                      ⏱️ {TEXTS.expiresIn[lang]}
                      <strong className="font-mono text-emerald-300 font-bold ml-1">{mm}:{ss}</strong>
                    </span>
                  )}
                </div>

                {error && (
                  <div className="auth-error-alert animate-shake">
                    <span>⚠️ {error}</span>
                    <button type="button" onClick={() => setError('')} className="auth-error-dismiss">✕</button>
                  </div>
                )}

                <button
                  type="submit"
                  className="btn-submit btn-submit--gradient"
                  disabled={isExpired || loading || fullOtp.length < 6}
                >
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <SpinnerIcon /> {lang === 'en' ? 'Verifying…' : 'កំពុងផ្ទៀងផ្ទាត់…'}
                    </span>
                  ) : (
                    <span>{TEXTS.verifyOtp[lang]} →</span>
                  )}
                </button>

                <div className="flex items-center justify-between text-xs pt-2">
                  <button
                    type="button"
                    className="text-slate-400 hover:text-white transition-colors"
                    onClick={() => goToStep(1)}
                  >
                    ← {TEXTS.changeEmail[lang]}
                  </button>

                  <button
                    type="button"
                    className={`font-bold transition-colors ${
                      sending ? 'text-slate-500 cursor-not-allowed' : 'text-emerald-400 hover:underline'
                    }`}
                    onClick={handleResendOtp}
                    disabled={sending}
                  >
                    {sending ? TEXTS.sending[lang] : TEXTS.resendOtp[lang]}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* STEP 3: CREATE NEW PASSWORD */}
          {step === 3 && (
            <div className="auth-step-container">
              <div className="auth-header-block">
                <h1 className="auth-title">{TEXTS.newPasswordTitle[lang]}</h1>
                <p className="auth-subtitle">{TEXTS.newPasswordSubtitle[lang]}</p>
              </div>

              <form className="auth-form" onSubmit={handleReset}>
                <div className="field">
                  <label htmlFor="newPassword">
                    <span className="field-icon">🔑</span>
                    {TEXTS.newPasswordLabel[lang]}
                  </label>
                  <div className="input-wrap input-wrap--password">
                    <input
                      id="newPassword"
                      name="newPassword"
                      type={showPassword ? 'text' : 'password'}
                      placeholder={TEXTS.newPasswordPlaceholder[lang]}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      required
                      autoFocus
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

                {newPassword && (
                  <div className="auth-pwd-meter-box">
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="text-slate-400">Password Strength:</span>
                      <span className="font-bold text-slate-200">{strengthInfo.label}</span>
                    </div>
                    <div className="w-full h-1.5 bg-slate-700/60 rounded-full overflow-hidden">
                      <div
                        className={`h-full ${strengthInfo.color} transition-all duration-300`}
                        style={{ width: strengthInfo.width }}
                      />
                    </div>
                  </div>
                )}

                <div className="field">
                  <label htmlFor="confirmPassword">
                    <span className="field-icon">🔒</span>
                    {TEXTS.confirmLabel[lang]}
                  </label>
                  <div className="input-wrap input-wrap--password">
                    <input
                      id="confirmPassword"
                      name="confirmPassword"
                      type={showConfirmPassword ? 'text' : 'password'}
                      placeholder={TEXTS.confirmPlaceholder[lang]}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
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

                {error && (
                  <div className="auth-error-alert animate-shake">
                    <span>⚠️ {error}</span>
                    <button type="button" onClick={() => setError('')} className="auth-error-dismiss">✕</button>
                  </div>
                )}

                <button type="submit" className="btn-submit btn-submit--gradient" disabled={loading}>
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <SpinnerIcon /> {lang === 'en' ? 'Updating…' : 'កំពុងធ្វើបច្ចុប្បន្នភាព…'}
                    </span>
                  ) : (
                    <span>{TEXTS.resetBtn[lang]} →</span>
                  )}
                </button>
              </form>
            </div>
          )}

          {/* STEP 4: SUCCESS CONFIRMED */}
          {step === 4 && (
            <div className="auth-step-container text-center py-4">
              <div className="w-20 h-20 mx-auto mb-4 bg-emerald-500/20 border-2 border-emerald-500/40 rounded-full flex items-center justify-center animate-bounce">
                <img src={trophyIcon} alt="" className="h-12 w-12 object-contain drop-shadow" />
              </div>

              <h1 className="auth-title text-2xl mb-2">{TEXTS.successTitle[lang]}</h1>
              <p className="auth-subtitle text-sm mb-6 leading-relaxed">
                {TEXTS.successText[lang]}
              </p>

              <div className="p-3 bg-slate-800/80 border border-slate-700/60 rounded-xl text-xs text-slate-400 mb-6">
                <span>
                  {TEXTS.autoRedirect[lang]}
                  <strong className="text-emerald-400 font-bold ml-1">{redirectCountdown}s</strong>…
                </span>
              </div>

              <Link
                to="/login"
                className="btn-submit btn-submit--gradient inline-flex items-center justify-center no-underline"
              >
                {TEXTS.goToLogin[lang]} →
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

const SpinnerIcon = () => (
  <svg className="spin" width="16" height="16" viewBox="0 0 24 24" fill="none">
    <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="3" strokeDasharray="40 20" strokeLinecap="round" />
  </svg>
)

export default ForgotPassword

