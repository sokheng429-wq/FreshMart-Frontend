import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useLanguage } from '../../context/LanguageContext'
import { publicAPI } from '../../api/api'
import { PageLoader } from '../../components/PageLoader'

// Assets
import careerHero from '../../assets/Career.png'

// 3D Icons
import flashIcon from '../../assets/icon/3dicons-flash-dynamic-color.png'
import heartIcon from '../../assets/icon/3dicons-heart-dynamic-color.png'
import trophyIcon from '../../assets/icon/3dicons-trophy-dynamic-color.png'
import walletIcon from '../../assets/icon/3dicons-wallet-dynamic-color.png'
import sunIcon from '../../assets/icon/3dicons-sun-dynamic-color.png'
import shieldIcon from '../../assets/icon/3dicons-shield-dynamic-color.png'
import bagIcon from '../../assets/icon/3dicons-bag-dynamic-color.png'
import rocketIcon from '../../assets/icon/3dicons-rocket-dynamic-color.png'

import './Career.css'

const formatPosted = (iso, lang) => {
  if (!iso) return ''
  try {
    return new Date(iso).toLocaleDateString(lang === 'kh' ? 'km-KH' : 'en-US', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    })
  } catch {
    return ''
  }
}

const BENEFITS = [
  { icon: walletIcon, title: { en: 'Competitive Salary', kh: 'ប្រាក់បៀវត្សសមរម្យ' }, desc: { en: 'Above-market pay with performance bonuses.', kh: 'ប្រាក់បៀវត្សលើសទីផ្សារ ជាមួយប្រាក់រង្វាន់ការងារ។' } },
  { icon: shieldIcon, title: { en: 'Health & Medical', kh: 'ធានារ៉ាប់រងសុខភាព' }, desc: { en: 'Comprehensive healthcare coverage for you and family.', kh: 'ការធានារ៉ាប់រងសុខភាពពេញលេញសម្រាប់អ្នកនិងគ្រួសារ។' } },
  { icon: rocketIcon, title: { en: 'Accelerated Growth', kh: 'ឱកាសរីកចម្រើន' }, desc: { en: 'Rapid promotion tracks and skill development.', kh: 'ការដំឡើងតំណែងរហ័ស និងការបណ្តុះបណ្តាលជំនាញ។' } },
  { icon: sunIcon, title: { en: 'Flexible Work', kh: 'ម៉ោងធ្វើការបត់បែន' }, desc: { en: 'Hybrid options and balanced work schedules.', kh: 'ការងារបត់បែន និងពេលវេលាការងារសមស្រប។' } },
  { icon: heartIcon, title: { en: 'Daily Fresh Perks', kh: 'អាហារសម្រន់ស្រស់ៗ' }, desc: { en: 'Free organic farm snacks & 30% employee grocery discount.', kh: 'អាហារសម្រន់សរីរាង្គឥតគិតថ្លៃ និងបញ្ចុះតម្លៃ ៣០% លើគ្រឿងទេស។' } },
  { icon: trophyIcon, title: { en: 'Annual Rewards', kh: 'រង្វាន់ប្រចាំឆ្នាំ' }, desc: { en: 'Annual company retreats, team outings, and awards.', kh: 'ដំណើរកម្សាន្តប្រចាំឆ្នាំ ព្រឹត្តិការណ៍ក្រុម និងពានរង្វាន់។' } },
]

const STATS = [
  { value: '200+', en: 'Team Members', kh: 'សមាជិកក្រុម', icon: trophyIcon },
  { value: '25', en: 'Provinces Covered', kh: 'ខេត្តគ្របដណ្តប់', icon: rocketIcon },
  { value: '96%', en: 'Employee Retention', kh: 'អត្រារក្សាបុគ្គលិក', icon: heartIcon },
  { value: '45m', en: 'Fast Pace Spirit', kh: 'ស្មារតីរហ័សរហួន', icon: flashIcon },
]

const TEXTS = {
  heroEyebrow: { en: "FreshMart Careers", kh: "FreshMart ឱកាសការងារ" },
  title: { en: 'Build Cambodia’s Fresh Food Future', kh: 'រួមគ្នាកសាងអនាគតអាហារស្រស់នៅកម្ពុជា' },
  subtitle: { en: 'Join a fast-moving, high-craft team transforming agriculture, cold-chain logistics, and e-commerce across Cambodia.', kh: 'ចូលរួមជាមួយក្រុមការងារដែលកំពុងផ្លាស់ប្តូរវិស័យកសិកម្ម ប្រព័ន្ធដឹកជញ្ជូនត្រជាក់ និងពាណិជ្ជកម្មអេឡិចត្រូនិកនៅកម្ពុជា។' },
  benefitsEyebrow: { en: 'Perks & Culture', kh: 'វប្បធម៌ និងអត្ថប្រយោជន៍' },
  benefits: { en: 'Why You’ll Love Working Here', kh: 'ហេតុអ្វីអ្នកនឹងស្រលាញ់ការងារនៅទីនេះ' },
  benefitsSub: { en: 'We invest in our people — because delivering exceptional service starts with an empowered team.', kh: 'យើងវិនិយោគលើបុគ្គលិករបស់យើង — ព្រោះសេវាកម្មល្អឥតខ្ចោះចាប់ផ្តើមពីក្រុមការងារដែលមានសមត្ថភាព។' },
  apply: { en: 'Apply Now', kh: 'ដាក់ពាក្យឥឡូវ' },
  details: { en: 'Role Details', kh: 'ព័ត៌មានលម្អិត' },
  allDepartments: { en: 'All Departments', kh: 'គ្រប់ផ្នែក' },
  noResults: { en: 'No open positions in this department right now — check back soon!', kh: 'មិនទាន់មានមុខតំណែងបើកក្នុងផ្នែកនេះទេ — សូមពិនិត្យម្តងទៀតឆាប់ៗ!' },
  loading: { en: 'Loading open positions...', kh: 'កំពុងផ្ទុកមុខតំណែង...' },
  loadError: { en: 'Could not load open positions.', kh: 'មិនអាចផ្ទុកមុខតំណែងបានទេ។' },
  retry: { en: 'Try again', kh: 'ព្យាយាមម្តងទៀត' },
  posted: { en: 'Posted', kh: 'បានប្រកាស' },
  viewOpenings: { en: 'View All Open Roles', kh: 'មើលមុខតំណែងទាំងអស់' },
}

export const Career = () => {
  const { lang } = useLanguage()
  const [jobs, setJobs] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [refreshKey, setRefreshKey] = useState(0)
  const [filter, setFilter] = useState('all')

  useEffect(() => {
    let cancelled = false
    const load = async () => {
      try {
        const res = await publicAPI.getJobs()
        const data = Array.isArray(res.data) ? res.data : []
        if (!cancelled) setJobs(data)
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
  }, [refreshKey, lang])

  // Department filter options derived from data
  const departments = useMemo(
    () => [...new Set(jobs.map((j) => j.department).filter(Boolean))].sort(),
    [jobs]
  )

  const filterOptions = useMemo(
    () => [{ key: 'all', label: TEXTS.allDepartments[lang] }, ...departments.map((d) => ({ key: d, label: d }))],
    [departments, lang]
  )

  const filteredJobs = filter === 'all'
    ? jobs
    : jobs.filter((j) => j.department === filter)

  return (
    <div className="career-page">

      {/* ===== 1. HERO SECTION ===== */}
      <section className="career-hero">
        <div className="career-hero-glow" />
        <div className="career-inner">
          <div className="career-hero-grid">
            <div className="career-hero-copy">
              <span className="career-section-eyebrow">
                <img src={rocketIcon} alt="Rocket" className="career-3d-eyebrow-icon" />
                <span>{TEXTS.heroEyebrow[lang]}</span>
              </span>
              <h1 className="career-hero-title">{TEXTS.title[lang]}</h1>
              <p className="career-hero-subtitle">{TEXTS.subtitle[lang]}</p>
              <div className="career-hero-actions">
                <a href="#openings" className="career-btn-primary">
                  <img src={bagIcon} alt="Job" className="career-btn-3d-icon" />
                  <span>{TEXTS.viewOpenings[lang]}</span>
                  <span className="career-btn-chevron">↓</span>
                </a>
              </div>
            </div>

            <div className="career-hero-visual">
              <div className="career-hero-frame">
                <img src={careerHero} alt="FreshMart team" className="career-hero-img" />
              </div>
            </div>
          </div>

          {/* Stats strip */}
          <div className="career-stats-strip">
            {STATS.map((stat) => (
              <div key={stat.value} className="career-stat-item">
                <div className="career-stat-icon-wrap">
                  <img src={stat.icon} alt={stat.en} className="career-stat-3d-icon" />
                </div>
                <div className="career-stat-val">{stat.value}</div>
                <div className="career-stat-lbl">{stat[lang]}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== 2. PERKS & BENEFITS ===== */}
      <section className="career-benefits">
        <div className="career-inner">
          <div className="career-section-header--center">
            <span className="career-section-eyebrow">
              <img src={heartIcon} alt="Heart" className="career-3d-eyebrow-icon" />
              <span>{TEXTS.benefitsEyebrow[lang]}</span>
            </span>
            <h2 className="career-section-title">{TEXTS.benefits[lang]}</h2>
            <div className="career-accent-line" />
            <p className="career-section-sub">{TEXTS.benefitsSub[lang]}</p>
          </div>

          <div className="career-benefits-grid">
            {BENEFITS.map((b) => (
              <div key={b.title.en} className="career-benefit-card">
                <div className="career-benefit-icon-box">
                  <img src={b.icon} alt={b.title[lang]} className="career-benefit-3d-icon" />
                </div>
                <h3 className="career-benefit-title">{b.title[lang]}</h3>
                <p className="career-benefit-desc">{b.desc[lang]}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== 3. OPEN POSITIONS ===== */}
      <section id="openings" className="career-jobs-section">
        <div className="career-inner">
          <div className="career-jobs-header">
            <div>
              <span className="career-section-eyebrow">
                <img src={flashIcon} alt="Jobs" className="career-3d-eyebrow-icon" />
                <span>{lang === 'en' ? `${filteredJobs.length} Open Roles` : `${filteredJobs.length} មុខតំណែង`}</span>
              </span>
              <h2 className="career-section-title">{lang === 'en' ? 'Explore Open Positions' : 'ស្វែងរកមុខតំណែងដែលកំពុងត្រូវការ'}</h2>
            </div>

            {/* Department Filter Pills */}
            <div className="career-filters">
              {filterOptions.map((dept) => (
                <button
                  key={dept.key}
                  type="button"
                  className={`career-filter-pill ${filter === dept.key ? 'career-filter-pill--active' : ''}`}
                  onClick={() => setFilter(dept.key)}
                >
                  {dept.label}
                </button>
              ))}
            </div>
          </div>

          {loading ? (
            <div className="career-state-box">
              <span className="career-spinner" />
              <p>{TEXTS.loading[lang]}</p>
            </div>
          ) : error ? (
            <div className="career-state-box">
              <span className="career-state-icon">⚠️</span>
              <p>{error}</p>
              <button
                type="button"
                onClick={() => { setError(''); setLoading(true); setRefreshKey((k) => k + 1) }}
                className="career-retry-btn"
              >
                {TEXTS.retry[lang]}
              </button>
            </div>
          ) : filteredJobs.length === 0 ? (
            <div className="career-state-box">
              <span className="career-state-icon">📭</span>
              <p>{TEXTS.noResults[lang]}</p>
            </div>
          ) : (
            <div className="career-job-list">
              {filteredJobs.map((job) => (
                <div key={job.id} className="career-job-card">
                  <div className="career-job-main">
                    <div className="career-job-top">
                      <span className="career-job-dept-tag">{job.department || 'General'}</span>
                      {job.createdAt && (
                        <span className="career-job-posted">
                          ⏱️ {TEXTS.posted[lang]} {formatPosted(job.createdAt, lang)}
                        </span>
                      )}
                    </div>
                    <h3 className="career-job-title">
                      <Link to={`/career-detail/${job.id}`}>{job.title}</Link>
                    </h3>
                    <div className="career-job-meta">
                      <span className="career-meta-chip">📍 {job.location || 'Phnom Penh'}</span>
                      <span className="career-meta-chip">⏳ {job.type || 'Full-time'}</span>
                      <span className="career-meta-chip career-meta-chip--salary">💰 {job.salary || 'Competitive'}</span>
                    </div>
                  </div>

                  <div className="career-job-actions">
                    <Link to={`/career-detail/${job.id}`} className="career-btn-details">
                      {TEXTS.details[lang]}
                    </Link>
                    <Link to={`/apply-now?job=${job.id}`} className="career-btn-apply">
                      <span>{TEXTS.apply[lang]}</span>
                      <span className="career-btn-chevron">→</span>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

    </div>
  )
}

export default Career
