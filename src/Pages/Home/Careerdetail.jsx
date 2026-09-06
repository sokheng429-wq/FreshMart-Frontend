import { useEffect, useState } from 'react'
import { Link, useLocation, useParams } from 'react-router-dom'
import { useLanguage } from '../../context/LanguageContext'
import { publicAPI } from '../../api/api'

// 3D Icons
import flashIcon from '../../assets/icon/3dicons-flash-dynamic-color.png'
import heartIcon from '../../assets/icon/3dicons-heart-dynamic-color.png'
import shieldIcon from '../../assets/icon/3dicons-shield-dynamic-color.png'
import walletIcon from '../../assets/icon/3dicons-wallet-dynamic-color.png'
import bagIcon from '../../assets/icon/3dicons-bag-dynamic-color.png'

import './Careerdetail.css'

const TEXTS = {
  home: { en: 'Home', kh: 'ទំព័រដើម' },
  career: { en: 'Careers', kh: 'ឱកាសការងារ' },
  applyNow: { en: 'Apply for Position', kh: 'ដាក់ពាក្យសម្រាប់មុខតំណែងនេះ' },
  overviewTitle: { en: 'Position Overview', kh: 'ទិដ្ឋភាពទូទៅនៃតួនាទី' },
  responsibilitiesTitle: { en: 'Core Responsibilities', kh: 'ទំនួលខុសត្រូវចម្បង' },
  requirementsTitle: { en: 'Qualifications & Skills', kh: 'លក្ខខណ្ឌ និងជំនាញតម្រូវ' },
  benefitsTitle: { en: 'Compensation & Perks', kh: 'អត្ថប្រយោជន៍ និងការលើកទឹកចិត្ត' },
  department: { en: 'Department', kh: 'ផ្នែក' },
  location: { en: 'Location', kh: 'ទីតាំង' },
  type: { en: 'Employment Type', kh: 'ប្រភេទការងារ' },
  salary: { en: 'Salary Compensation', kh: 'ប្រាក់បៀវត្ស' },
  loading: { en: 'Loading position details...', kh: 'កំពុងផ្ទុកព័ត៌មានការងារ...' },
  notFound: { en: 'Position Not Found', kh: 'រកមិនឃើញមុខតំណែង' },
  notFoundText: { en: 'This position may have been filled or archived.', kh: 'មុខតំណែងនេះប្រហែលជាត្រូវបានជ្រើសរើសរួច ឬបិទ។' },
  backToCareer: { en: 'Back to All Openings', kh: 'ត្រលប់ទៅបញ្ជីការងារ' },
  loadError: { en: 'Could not load this position.', kh: 'មិនអាចផ្ទុកព័ត៌មានការងារនេះបានទេ។' },
  retry: { en: 'Try again', kh: 'ព្យាយាមម្តងទៀត' },
}

const splitLines = (value) =>
  (value || '').split('\n').map((line) => line.trim()).filter(Boolean)

export const Careerdetail = () => {
  const { lang } = useLanguage()
  const { id } = useParams()
  const stateJob = useLocation().state?.job
  const [job, setJob] = useState(stateJob || null)
  const [loading, setLoading] = useState(Boolean(id))
  const [error, setError] = useState('')
  const [refreshKey, setRefreshKey] = useState(0)

  useEffect(() => {
    if (!id) return
    let cancelled = false
    const load = async () => {
      try {
        const res = await publicAPI.getJobById(id)
        if (!cancelled) {
          setJob(res.data || null)
          setError('')
        }
      } catch (err) {
        if (!cancelled) setError(err.message || TEXTS.loadError[lang])
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => {
      cancelled = true
    }
  }, [id, refreshKey, lang])

  const descLines = splitLines(job?.description)
  const overview = descLines[0] || ''
  const responsibilities = descLines.slice(1)
  const requirements = splitLines(job?.requirements)
  const benefits = splitLines(job?.benefits)

  const title = job?.title || (lang === 'kh' ? 'មុខតំណែង' : 'Position')
  const department = job?.department || (lang === 'kh' ? 'ផ្នែកទូទៅ' : 'Department')
  const jobLocation = job?.location || (lang === 'kh' ? 'ភ្នំពេញ' : 'Phnom Penh, Cambodia')
  const type = job?.type || (lang === 'kh' ? 'ពេញម៉ោង' : 'Full-time')
  const salary = job?.salary || (lang === 'kh' ? 'ប្រាក់ខែសមរម្យ' : 'Competitive salary')

  if (loading) {
    return (
      <div className="cd-page">
        <div className="cd-inner">
          <div className="cd-state-box">
            <span className="cd-spinner" />
            <p>{TEXTS.loading[lang]}</p>
          </div>
        </div>
      </div>
    )
  }

  if (!job) {
    return (
      <div className="cd-page">
        <div className="cd-inner">
          <div className="cd-state-box">
            <img src={bagIcon} alt="Not Found" className="cd-state-icon" />
            <h1 className="cd-notfound-title">{TEXTS.notFound[lang]}</h1>
            <p>{error || TEXTS.notFoundText[lang]}</p>
            <div className="cd-notfound-actions">
              <Link to="/career" className="cd-btn-primary">{TEXTS.backToCareer[lang]}</Link>
              {error && (
                <button
                  type="button"
                  className="cd-btn-secondary"
                  onClick={() => { setLoading(true); setError(''); setRefreshKey((k) => k + 1) }}
                >
                  {TEXTS.retry[lang]}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="cd-page">
      <div className="cd-inner">

        {/* Breadcrumb Navigation */}
        <nav className="cd-breadcrumb">
          <Link to="/">{TEXTS.home[lang]}</Link>
          <span className="cd-sep">/</span>
          <Link to="/career">{TEXTS.career[lang]}</Link>
          <span className="cd-sep">/</span>
          <span className="cd-breadcrumb-current">{title}</span>
        </nav>

        {/* Header Hero */}
        <div className="cd-header-card">
          <div className="cd-header-copy">
            <span className="cd-department-tag">{department}</span>
            <h1 className="cd-title">{title}</h1>
            <div className="cd-meta-row">
              <span className="cd-meta-chip">📍 {jobLocation}</span>
              <span className="cd-meta-chip">⏱️ {type}</span>
              <span className="cd-meta-chip cd-meta-chip--salary">💰 {salary}</span>
            </div>
          </div>
          <Link to={`/apply-now?job=${job.id}`} className="cd-btn-primary">
            <span>{TEXTS.applyNow[lang]}</span>
            <span className="cd-btn-chevron">→</span>
          </Link>
        </div>

        {/* Main Layout */}
        <div className="cd-layout">
          <div className="cd-main">
            {overview && (
              <section className="cd-section">
                <div className="cd-section-header">
                  <img src={flashIcon} alt="Overview" className="cd-section-3d-icon" />
                  <h2 className="cd-section-title">{TEXTS.overviewTitle[lang]}</h2>
                </div>
                <p className="cd-text">{overview}</p>
              </section>
            )}

            {responsibilities.length > 0 && (
              <section className="cd-section">
                <div className="cd-section-header">
                  <img src={shieldIcon} alt="Responsibilities" className="cd-section-3d-icon" />
                  <h2 className="cd-section-title">{TEXTS.responsibilitiesTitle[lang]}</h2>
                </div>
                <ul className="cd-list">
                  {responsibilities.map((line, i) => (
                    <li key={i}>
                      <span className="cd-list-bullet">✓</span>
                      <span>{line}</span>
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {requirements.length > 0 && (
              <section className="cd-section">
                <div className="cd-section-header">
                  <img src={walletIcon} alt="Requirements" className="cd-section-3d-icon" />
                  <h2 className="cd-section-title">{TEXTS.requirementsTitle[lang]}</h2>
                </div>
                <ul className="cd-list">
                  {requirements.map((line, i) => (
                    <li key={i}>
                      <span className="cd-list-bullet">✓</span>
                      <span>{line}</span>
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {benefits.length > 0 && (
              <section className="cd-section">
                <div className="cd-section-header">
                  <img src={heartIcon} alt="Perks" className="cd-section-3d-icon" />
                  <h2 className="cd-section-title">{TEXTS.benefitsTitle[lang]}</h2>
                </div>
                <ul className="cd-list">
                  {benefits.map((line, i) => (
                    <li key={i}>
                      <span className="cd-list-bullet">✓</span>
                      <span>{line}</span>
                    </li>
                  ))}
                </ul>
              </section>
            )}
          </div>

          {/* Sticky Sidebar */}
          <aside className="cd-sidebar">
            <div className="cd-sidebar-card">
              <h3 className="cd-sidebar-heading">Position Summary</h3>
              <div className="cd-sidebar-field">
                <span className="cd-sidebar-label">{TEXTS.department[lang]}</span>
                <strong className="cd-sidebar-val">{department}</strong>
              </div>
              <div className="cd-sidebar-field">
                <span className="cd-sidebar-label">{TEXTS.location[lang]}</span>
                <strong className="cd-sidebar-val">{jobLocation}</strong>
              </div>
              <div className="cd-sidebar-field">
                <span className="cd-sidebar-label">{TEXTS.type[lang]}</span>
                <strong className="cd-sidebar-val">{type}</strong>
              </div>
              <div className="cd-sidebar-field">
                <span className="cd-sidebar-label">{TEXTS.salary[lang]}</span>
                <strong className="cd-sidebar-val cd-sidebar-val--salary">{salary}</strong>
              </div>

              <Link to={`/apply-now?job=${job.id}`} className="cd-btn-primary cd-btn-block">
                <span>{TEXTS.applyNow[lang]}</span>
                <span className="cd-btn-chevron">→</span>
              </Link>
            </div>
          </aside>
        </div>

      </div>
    </div>
  )
}

export default Careerdetail
