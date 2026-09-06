import { useEffect, useRef, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useLanguage } from '../../context/LanguageContext'
import { jobAPI, publicAPI } from '../../api/api'

// 3D Icons
import rocketIcon from '../../assets/icon/3dicons-rocket-dynamic-color.png'
import walletIcon from '../../assets/icon/3dicons-wallet-dynamic-color.png'
import shieldIcon from '../../assets/icon/3dicons-shield-dynamic-color.png'
import heartIcon from '../../assets/icon/3dicons-heart-dynamic-color.png'
import sunIcon from '../../assets/icon/3dicons-sun-dynamic-color.png'
import trophyIcon from '../../assets/icon/3dicons-trophy-dynamic-color.png'
import chatIcon from '../../assets/icon/3dicons-chat-bubble-dynamic-color.png'

import './Applynow.css'

const MAX_RESUME_BYTES = 2 * 1024 * 1024

const PERKS = [
  { icon: walletIcon, title: { en: 'Top-Tier Pay', kh: 'ប្រាក់ខែខ្ពស់' } },
  { icon: shieldIcon, title: { en: 'Health Coverage', kh: 'ធានារ៉ាប់រងសុខភាព' } },
  { icon: rocketIcon, title: { en: 'Rapid Growth', kh: 'រីកចម្រើនអាជីព' } },
  { icon: sunIcon, title: { en: 'Flexible Hours', kh: 'ម៉ោងបត់បែន' } },
  { icon: heartIcon, title: { en: 'Fresh Snacks', kh: 'អាហារសម្រន់' } },
  { icon: trophyIcon, title: { en: 'Team Outings', kh: 'ដំណើរកម្សាន្ត' } },
]

const TEXTS = {
  heroTitle: { en: 'Join the B\'Groceries Team', kh: 'ដាក់ពាក្យចូលរួមជាមួយ B\'Groceries' },
  heroSub: { en: 'Take the next step in your career — join a high-impact team revolutionizing fresh grocery delivery across Cambodia.', kh: 'ឈានជំហានបន្ទាប់ក្នុងអាជីពរបស់អ្នក — ចូលរួមជាមួយក្រុមការងារដែលកំពុងអភិវឌ្ឍប្រព័ន្ធដឹកជញ្ជូនគ្រឿងទេសស្រស់នៅកម្ពុជា។' },
  formTitle: { en: 'Application Form', kh: 'ទម្រង់បែបបទដាក់ពាក្យ' },
  formSub: { en: 'Complete your details below. Our talent acquisition team reviews every submission within 48 hours.', kh: 'បំពេញព័ត៌មានខាងក្រោម។ ក្រុមការងារយើងនឹងពិនិត្យនិងឆ្លើយតបក្នុងរយៈពេល ៤៨ ម៉ោង។' },
  fullName: { en: 'Full Legal Name', kh: 'ឈ្មោះពេញ' },
  namePlaceholder: { en: 'e.g. YourName', kh: 'ឧ. ' },
  email: { en: 'Email Address', kh: 'អាសយដ្ឋានអ៊ីមែល' },
  emailPlaceholder: { en: 'your@example.com', kh: 'your@example.com' },
  phone: { en: 'Phone Number (Telegram-enabled)', kh: 'លេខទូរស័ព្ទ (មាន Telegram)' },
  phonePlaceholder: { en: '012 345 678', kh: '០១២ ៣៤៥ ៦៧៨' },
  position: { en: 'Target Position', kh: 'មុខតំណែងដែលចង់បាន' },
  positionPlaceholder: { en: 'Select an open position', kh: 'ជ្រើសរើសមុខតំណែង' },
  linkedin: { en: 'LinkedIn / Portfolio / GitHub URL', kh: 'LinkedIn / Portfolio / GitHub URL' },
  linkedinPlaceholder: { en: 'https://...', kh: 'https://...' },
  coverLetter: { en: 'Why are you excited to join us?', kh: 'ហេតុអ្វីអ្នកចង់ចូលរួមជាមួយយើង?' },
  coverLetterPlaceholder: { en: 'Tell us about your background, strengths, and what drives you...', kh: 'ប្រាប់យើងអំពីប្រវត្តិ ចំណុចខ្លាំង និងអ្វីដែលជំរុញចិត្តអ្នក...' },
  resumeLabel: { en: 'Upload Resume / CV (PDF or DOCX, max 2MB)', kh: 'បញ្ចូល Resume / CV (PDF ឬ DOCX, ក្រោម 2MB)' },
  resumeHint: { en: 'Drag and drop your file here, or click to browse', kh: 'អូសទម្លាក់ឯកសារនៅទីនេះ ឬចុចដើម្បីជ្រើសរើស' },
  resumeSelected: { en: 'Attached:', kh: 'បានភ្ជាប់:' },
  submit: { en: 'Submit Application', kh: 'ដាក់ស្នើពាក្យឥឡូវ' },
  telegramApply: { en: 'Direct Telegram Fast-Track', kh: 'ដាក់ពាក្យរហ័សតាម Telegram' },
  telegramHint: { en: 'Want a faster response? Send your CV directly to our HR hiring manager on Telegram.', kh: 'ចង់បានការឆ្លើយតបរហ័ស? ផ្ញើ CV របស់អ្នកផ្ទាល់ទៅកាន់ HR តាម Telegram ។' },
  or: { en: 'OR APPLY VIA FORM', kh: 'ឬដាក់ពាក្យតាមទម្រង់បែបបទ' },
  required: { en: 'Required', kh: 'ត្រូវការ' },
  errName: { en: 'Full name is required', kh: 'សូមបញ្ចូលឈ្មោះពេញ' },
  errEmail: { en: 'Enter a valid email address', kh: 'សូមបញ្ចូលអ៊ីមែលត្រឹមត្រូវ' },
  errPhone: { en: 'Phone number is required', kh: 'សូមបញ្ចូលលេខទូរស័ព្ទ' },
  errPosition: { en: 'Please select a position', kh: 'សូមជ្រើសរើសមុខតំណែង' },
  errResume: { en: 'Resume file is required', kh: 'សូមភ្ជាប់ឯកសារ Resume' },
  errResumeSize: { en: 'Resume must be under 2MB', kh: 'Resume ត្រូវតែក្រោម 2MB' },
  errSubmit: { en: 'Could not submit your application. Please check your details and try again.', kh: 'មិនអាចដាក់ស្នើពាក្យបានទេ។ សូមពិនិត្យម្តងទៀត។' },
  submitting: { en: 'Submitting Application...', kh: 'កំពុងដាក់ស្នើ...' },
  positionsLoading: { en: 'Loading active positions...', kh: 'កំពុងផ្ទុកមុខតំណែង...' },
  successTitle: { en: 'Application Received! 🎉', kh: 'បានទទួលពាក្យស្នើសុំ! 🎉' },
  successText1: { en: 'Thank you for your interest, ', kh: 'សូមអរគុណសម្រាប់ការចាប់អារម្មណ៍ ' },
  successText2: { en: 'Our recruiting team has received your application and will reach out via Phone/Telegram within 48 hours.', kh: 'ក្រុមការងារបានទទួលពាក្យរបស់អ្នកហើយ នឹងទាក់ទងតាមទូរស័ព្ទ ឬ Telegram ក្នុងរយៈពេល ៤៨ ម៉ោង។' },
  backToCareer: { en: 'Browse More Positions', kh: 'មើលមុខតំណែងផ្សេងទៀត' },
}

export const ApplyNow = () => {
  const { lang } = useLanguage()
  const fileRef = useRef(null)
  const [searchParams] = useSearchParams()
  const jobParam = searchParams.get('job')
  const [positions, setPositions] = useState([])
  const [positionsLoading, setPositionsLoading] = useState(true)
  const [form, setForm] = useState({ fullName: '', email: '', phone: '', position: '', linkedin: '', coverLetter: '' })
  const [resume, setResume] = useState(null)
  const [dragOver, setDragOver] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState('')
  const [errors, setErrors] = useState({})

  useEffect(() => {
    let cancelled = false
    const load = async () => {
      try {
        const res = await publicAPI.getJobs()
        const data = Array.isArray(res.data) ? res.data : []
        if (!cancelled) setPositions(data)
      } catch {
        // Fallback
      } finally {
        if (!cancelled) setPositionsLoading(false)
      }
    }
    load()
    return () => {
      cancelled = true
    }
  }, [])

  const preselectedJob = jobParam
    ? positions.find((j) => String(j.id) === String(jobParam))
    : null
  const positionValue = form.position || (preselectedJob ? String(preselectedJob.id) : '')

  const handleChange = (e) => {
    const { name, value } = e.target
    setForm((prev) => ({ ...prev, [name]: value }))
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: '' }))
  }

  const handleFile = (file) => {
    if (file && file.size > MAX_RESUME_BYTES) {
      setResume(null)
      setErrors((prev) => ({ ...prev, resume: TEXTS.errResumeSize[lang] }))
      return
    }
    setResume(file || null)
    if (errors.resume) setErrors((prev) => ({ ...prev, resume: '' }))
  }

  const handleDrop = (e) => {
    e.preventDefault()
    setDragOver(false)
    const file = e.dataTransfer.files[0]
    if (file) handleFile(file)
  }

  const validate = () => {
    const e = {}
    if (!form.fullName.trim()) e.fullName = TEXTS.errName[lang]
    if (!form.email.trim() || !/\S+@\S+\.\S+/.test(form.email)) e.email = TEXTS.errEmail[lang]
    if (!form.phone.trim()) e.phone = TEXTS.errPhone[lang]
    if (!positionValue) e.position = TEXTS.errPosition[lang]
    if (!resume) e.resume = TEXTS.errResume[lang]
    return e
  }

  const readFileAsBase64 = (file) => new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      const result = typeof reader.result === 'string' ? reader.result : ''
      resolve(result.split(',')[1] || '')
    }
    reader.onerror = () => reject(reader.error || new Error('Could not read file'))
    reader.readAsDataURL(file)
  })

  const handleSubmit = async (e) => {
    e.preventDefault()
    const v = validate()
    setErrors(v)
    if (Object.keys(v).length > 0) return

    setSubmitting(true)
    setSubmitError('')

    try {
      let resumeBase64 = ''
      if (resume) {
        resumeBase64 = await readFileAsBase64(resume)
      }

      await jobAPI.applyJob({
        jobId: positionValue,
        fullName: form.fullName.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
        linkedinUrl: form.linkedin.trim(),
        coverLetter: form.coverLetter.trim(),
        resumeFileName: resume ? resume.name : '',
        resumeData: resumeBase64,
      })

      setSubmitted(true)
    } catch (err) {
      setSubmitError(err.message || TEXTS.errSubmit[lang])
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="apply-page">
      <div className="apply-inner">

        {/* ===== HERO ===== */}
        <section className="apply-hero">
          <span className="apply-section-eyebrow">
            <img src={rocketIcon} alt="Apply" className="apply-3d-eyebrow-icon" />
            <span>{lang === 'en' ? 'Direct Application Portal' : 'ទំព័រដាក់ពាក្យផ្ទាល់'}</span>
          </span>
          <h1 className="apply-hero-title">{TEXTS.heroTitle[lang]}</h1>
          <p className="apply-hero-sub">{TEXTS.heroSub[lang]}</p>

          {/* Perks Bar */}
          <div className="apply-perks-bar">
            {PERKS.map((p) => (
              <div key={p.title.en} className="apply-perk-item">
                <img src={p.icon} alt={p.title[lang]} className="apply-perk-icon" />
                <span className="apply-perk-label">{p.title[lang]}</span>
              </div>
            ))}
          </div>
        </section>

        {/* ===== TELEGRAM FAST TRACK BANNER ===== */}
        <div className="apply-telegram-card">
          <div className="apply-telegram-left">
            <div className="apply-telegram-icon-box">
              <img src={chatIcon} alt="Telegram" className="apply-telegram-3d-icon" />
            </div>
            <div>
              <h3 className="apply-telegram-title">{TEXTS.telegramApply[lang]}</h3>
              <p className="apply-telegram-hint">{TEXTS.telegramHint[lang]}</p>
            </div>
          </div>
          <a
            href="https://t.me/freshmart_careers"
            target="_blank"
            rel="noopener noreferrer"
            className="apply-btn-telegram"
          >
            <span>Open Telegram HR</span>
            <span>→</span>
          </a>
        </div>

        <div className="apply-divider-strip">
          <span className="apply-divider-line" />
          <span className="apply-divider-text">{TEXTS.or[lang]}</span>
          <span className="apply-divider-line" />
        </div>

        {/* ===== APPLICATION FORM ===== */}
        <div className="apply-form-container">
          {submitted ? (
            <div className="apply-success-card">
              <div className="apply-success-icon-box">
                <img src={trophyIcon} alt="Success" className="apply-success-3d-icon" />
              </div>
              <h2 className="apply-success-title">{TEXTS.successTitle[lang]}</h2>
              <p className="apply-success-text">
                {TEXTS.successText1[lang]} <strong>{form.fullName}</strong>! {TEXTS.successText2[lang]}
              </p>
              <Link to="/career" className="apply-btn-primary">
                <span>{TEXTS.backToCareer[lang]}</span>
                <span>→</span>
              </Link>
            </div>
          ) : (
            <form className="apply-form" onSubmit={handleSubmit}>
              <div className="apply-form-header">
                <h2 className="apply-form-title">{TEXTS.formTitle[lang]}</h2>
                <p className="apply-form-sub">{TEXTS.formSub[lang]}</p>
              </div>

              {submitError && (
                <div className="apply-error-banner">
                  <span>⚠️</span> {submitError}
                </div>
              )}

              <div className="apply-grid-2">
                <div className="apply-field">
                  <label htmlFor="fullName">{TEXTS.fullName[lang]} <span className="apply-req">*</span></label>
                  <input
                    id="fullName"
                    name="fullName"
                    type="text"
                    placeholder={TEXTS.namePlaceholder[lang]}
                    value={form.fullName}
                    onChange={handleChange}
                    className={errors.fullName ? 'apply-input--err' : ''}
                  />
                  {errors.fullName && <span className="apply-field-err">{errors.fullName}</span>}
                </div>

                <div className="apply-field">
                  <label htmlFor="email">{TEXTS.email[lang]} <span className="apply-req">*</span></label>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    placeholder={TEXTS.emailPlaceholder[lang]}
                    value={form.email}
                    onChange={handleChange}
                    className={errors.email ? 'apply-input--err' : ''}
                  />
                  {errors.email && <span className="apply-field-err">{errors.email}</span>}
                </div>
              </div>

              <div className="apply-grid-2">
                <div className="apply-field">
                  <label htmlFor="phone">{TEXTS.phone[lang]} <span className="apply-req">*</span></label>
                  <input
                    id="phone"
                    name="phone"
                    type="tel"
                    placeholder={TEXTS.phonePlaceholder[lang]}
                    value={form.phone}
                    onChange={handleChange}
                    className={errors.phone ? 'apply-input--err' : ''}
                  />
                  {errors.phone && <span className="apply-field-err">{errors.phone}</span>}
                </div>

                <div className="apply-field">
                  <label htmlFor="position">{TEXTS.position[lang]} <span className="apply-req">*</span></label>
                  <select
                    id="position"
                    name="position"
                    value={positionValue}
                    onChange={handleChange}
                    className={errors.position ? 'apply-input--err' : ''}
                  >
                    <option value="">{positionsLoading ? TEXTS.positionsLoading[lang] : `-- ${TEXTS.positionPlaceholder[lang]} --`}</option>
                    {positions.map((j) => (
                      <option key={j.id} value={j.id}>
                        {j.title} ({j.department || 'General'})
                      </option>
                    ))}
                  </select>
                  {errors.position && <span className="apply-field-err">{errors.position}</span>}
                </div>
              </div>

              <div className="apply-field">
                <label htmlFor="linkedin">{TEXTS.linkedin[lang]}</label>
                <input
                  id="linkedin"
                  name="linkedin"
                  type="url"
                  placeholder={TEXTS.linkedinPlaceholder[lang]}
                  value={form.linkedin}
                  onChange={handleChange}
                />
              </div>

              <div className="apply-field">
                <label htmlFor="coverLetter">{TEXTS.coverLetter[lang]}</label>
                <textarea
                  id="coverLetter"
                  name="coverLetter"
                  rows="4"
                  placeholder={TEXTS.coverLetterPlaceholder[lang]}
                  value={form.coverLetter}
                  onChange={handleChange}
                />
              </div>

              {/* Resume Dropzone */}
              <div className="apply-field">
                <label>{TEXTS.resumeLabel[lang]} <span className="apply-req">*</span></label>
                <div
                  className={`apply-dropzone ${dragOver ? 'apply-dropzone--active' : ''} ${errors.resume ? 'apply-dropzone--err' : ''}`}
                  onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
                  onDragLeave={() => setDragOver(false)}
                  onDrop={handleDrop}
                  onClick={() => fileRef.current?.click()}
                >
                  <input
                    ref={fileRef}
                    type="file"
                    accept=".pdf,.doc,.docx"
                    style={{ display: 'none' }}
                    onChange={(e) => handleFile(e.target.files[0])}
                  />
                  {resume ? (
                    <div className="apply-dropzone-selected">
                      <span className="apply-file-icon">📄</span>
                      <div>
                        <strong>{TEXTS.resumeSelected[lang]} {resume.name}</strong>
                        <small>({(resume.size / 1024).toFixed(1)} KB)</small>
                      </div>
                    </div>
                  ) : (
                    <div className="apply-dropzone-prompt">
                      <span className="apply-upload-icon">☁️</span>
                      <p>{TEXTS.resumeHint[lang]}</p>
                    </div>
                  )}
                </div>
                {errors.resume && <span className="apply-field-err">{errors.resume}</span>}
              </div>

              <button
                type="submit"
                className="apply-btn-primary apply-btn-submit"
                disabled={submitting}
              >
                {submitting ? (
                  <>
                    <span className="apply-spinner" />
                    <span>{TEXTS.submitting[lang]}</span>
                  </>
                ) : (
                  <>
                    <img src={rocketIcon} alt="Submit" className="apply-btn-3d-icon" />
                    <span>{TEXTS.submit[lang]}</span>
                    <span>→</span>
                  </>
                )}
              </button>
            </form>
          )}
        </div>

      </div>
    </div>
  )
}

export default ApplyNow
