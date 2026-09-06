import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { useLanguage } from '../../context/LanguageContext'

// Assets
import homeHero2 from '../../assets/Home.png'
import inside from '../../assets/inside.png'

// 3D Icons
import leafIcon from '../../assets/icon/3dicons-leaf-dynamic-color.png'
import flashIcon from '../../assets/icon/3dicons-flash-dynamic-color.png'
import shieldIcon from '../../assets/icon/3dicons-shield-dynamic-color.png'
import heartIcon from '../../assets/icon/3dicons-heart-dynamic-color.png'
import trophyIcon from '../../assets/icon/3dicons-trophy-dynamic-color.png'
import mapPinIcon from '../../assets/icon/3dicons-map-pin-dynamic-color.png'
import bagIcon from '../../assets/icon/3dicons-bag-dynamic-color.png'
import walletIcon from '../../assets/icon/3dicons-wallet-dynamic-color.png'
import sunIcon from '../../assets/icon/3dicons-sun-dynamic-color.png'
import targetIcon from '../../assets/icon/3dicons-target-dynamic-color.png'

import './AboutUs.css'

const MILESTONES = [
  {
    year: '2020',
    icon: sunIcon,
    title: { en: 'Our First Market Stall', kh: 'ស្តង់លក់ដំបូងបង្អស់' },
    desc: {
      en: 'Started in Toul Tompoung, Phnom Penh with 3 passionate founders and a small truck sourcing from 5 local farms.',
      kh: 'ចាប់ផ្តើមនៅទួលទំពូង ភ្នំពេញ ជាមួយស្ថាបនិក ៣ នាក់ និងឡានតូចមួយដែលដឹកបន្លែពីកសិដ្ឋាន ៥ កន្លែង។',
    },
  },
  {
    year: '2022',
    icon: flashIcon,
    title: { en: 'Digital Cold-Chain Launch', kh: 'បើកដំណើរការវេទិកាឌីជីថល' },
    desc: {
      en: 'Built Cambodia’s first 45-minute temperature-controlled grocery delivery platform, reaching 10,000 households.',
      kh: 'បង្កើតវេទិកាដឹកជញ្ជូនគ្រឿងទេសត្រជាក់ ៤៥ នាទីដំបូងនៅកម្ពុជា បម្រើគ្រួសារជាង ១០,០០០។',
    },
  },
  {
    year: '2024',
    icon: trophyIcon,
    title: { en: 'Best E-Commerce Grocer Award', kh: 'ពានរង្វាន់វេទិកាគ្រឿងទេសឆ្នើម' },
    desc: {
      en: 'Recognized for empowering 200+ smallholder farmers with guaranteed fair-trade farm-gate compensation.',
      kh: 'ទទួលបានការទទួលស្គាល់ចំពោះការផ្តល់អំណាចដល់កសិករជាង ២០០ នាក់ ជាមួយតម្លៃយុត្តិធម៌។',
    },
  },
  {
    year: '2026',
    icon: mapPinIcon,
    title: { en: 'Nationwide 25-Province Expansion', kh: 'ពង្រីកទូទាំង ២៥ រាជធានី-ខេត្ត' },
    desc: {
      en: 'Operating cold hubs in Phnom Penh, Siem Reap, and Battambang, connecting families with clean farm food daily.',
      kh: 'ដំណើរការមជ្ឈមណ្ឌលត្រជាក់នៅភ្នំពេញ សៀមរាប និងបាត់ដំបង ផ្តល់អាហារស្អាតដល់គ្រប់គ្រួសារ។',
    },
  },
]

const VALUES = [
  {
    icon: leafIcon,
    title: { en: '100% Farm Freshness', kh: 'ភាពស្រស់ ១០០%' },
    desc: {
      en: 'Harvested at 5:00 AM every morning and delivered at peak crispness without harmful chemical pesticides.',
      kh: 'ប្រមូលផលនៅម៉ោង ៥:០០ ព្រឹកជារៀងរាល់ថ្ងៃ និងដឹកជញ្ជូនក្នុងភាពស្រស់បំផុតដោយគ្មានគីមីពុល។',
    },
  },
  {
    icon: flashIcon,
    title: { en: '45-Min Express Speed', kh: 'ល្បឿនលឿន ៤៥ នាទី' },
    desc: {
      en: 'Equipped with sub-zero insulated packs on eco-electric couriers across every district.',
      kh: 'បំពាក់ជាមួយកញ្ចប់រក្សាភាពត្រជាក់នៅលើម៉ូតូអគ្គិសនី បម្រើសេវាគ្រប់ខណ្ឌ។',
    },
  },
  {
    icon: walletIcon,
    title: { en: 'Direct Fair Pricing', kh: 'តម្លៃយុត្តិធម៌ផ្ទាល់' },
    desc: {
      en: 'Eliminating middlemen so you save up to 25% while local farming families earn sustainable livings.',
      kh: 'កាត់បន្ថយឈ្មួញកណ្តាលដើម្បីសន្សំរហូតដល់ ២៥% ខណៈកសិករក្នុងស្រុកទទួលបានប្រាក់ចំណូលសមរម្យ។',
    },
  },
  {
    icon: heartIcon,
    title: { en: 'Zero Waste & Reusable Crates', kh: 'កាត់បន្ថយកាកសំណល់' },
    desc: {
      en: 'We collect sterilized reusable shipping boxes on subsequent orders, cutting out 100% of single-use plastics.',
      kh: 'យើងប្រមូលប្រអប់ប្រើឡើងវិញនៅពេលដឹកលើកក្រោយ ដោយកាត់បន្ថយថង់ប្លាស្ទិកបាន ១០០%។',
    },
  },
  {
    icon: shieldIcon,
    title: { en: 'Fresh or Free Guarantee', kh: 'ធានាស្រស់ ឬឥតគិតថ្លៃ' },
    desc: {
      en: 'If any produce arrives bruised or less than garden-fresh, tap once for an instant 100% refund.',
      kh: 'ប្រសិនបើបន្លែផ្លែឈើណាមួយមានស្នាម ឬមិនស្រស់ ចុចប្តូរប្រាក់វិញភ្លាមៗ ១០០%។',
    },
  },
  {
    icon: targetIcon,
    title: { en: 'Community First', kh: 'សហគមន៍ជាចម្បង' },
    desc: {
      en: 'We donate surplus organic produce daily to local youth centers and food programs across Cambodia.',
      kh: 'យើងបរិច្ចាគបន្លែផ្លែឈើលើសប្រចាំថ្ងៃទៅកាន់មជ្ឈមណ្ឌលកុមារ និងកម្មវិធីសប្បុរសធម៌។',
    },
  },
]

const STATS = [
  { value: '50K+', label: { en: 'Households Served', kh: 'គ្រួសារទទួលសេវា' }, icon: bagIcon },
  { value: '200+', label: { en: 'Partner Farms', kh: 'កសិដ្ឋានដៃគូ' }, icon: mapPinIcon },
  { value: '25', label: { en: 'Provinces Connected', kh: 'ខេត្តតភ្ជាប់' }, icon: trophyIcon },
  { value: '99.4%', label: { en: 'On-Time Rate', kh: 'អត្រាទាន់ពេល' }, icon: flashIcon },
]

function useScrollReveal() {
  const ref = useRef(null)
  const [visible, setVisible] = useState(false)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const obs = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          setVisible(true)
          obs.disconnect()
        }
      },
      { threshold: 0.15 }
    )
    obs.observe(el)
    return () => obs.disconnect()
  }, [])
  return [ref, visible]
}

function AnimatedNumber({ value }) {
  const [ref, visible] = useScrollReveal()
  const [count, setCount] = useState(0)
  const num = parseInt(value.replace(/[^0-9]/g, '')) || 0
  const suffix = value.replace(/[0-9]/g, '')
  useEffect(() => {
    if (!visible) return
    let raf
    const start = performance.now()
    const dur = 1200
    const tick = (now) => {
      const p = Math.min((now - start) / dur, 1)
      setCount(Math.floor((1 - Math.pow(1 - p, 3)) * num))
      if (p < 1) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [visible, num])
  return <span ref={ref}>{count}{suffix}</span>
}

export const About = () => {
  const { lang } = useLanguage()

  return (
    <div className="about-page">

      {/* ===== 1. HERO SECTION ===== */}
      <section className="about-hero">
        <div className="about-hero-glow" />
        <div className="about-inner">
          <div className="about-hero-grid">
            <div className="about-hero-copy">
              <span className="about-section-eyebrow">
                <img src={leafIcon} alt="Leaf" className="about-3d-eyebrow-icon" />
                <span>{lang === 'en' ? 'Our Roots & Purpose' : 'ប្រភព និងគោលបំណងរបស់យើង'}</span>
              </span>
              <h1 className="about-hero-title">
                {lang === 'en' ? (
                  <>
                    CULTIVATING A HEALTHIER, <br />
                    <span className="about-title-highlight">CLEANER CAMBODIA</span>
                  </>
                ) : (
                  <>
                    កសាងកម្ពុជាដែលមានសុខភាពល្អ <br />
                    <span className="about-title-highlight">និងបរិភោគអាហារស្អាត</span>
                  </>
                )}
              </h1>
              <p className="about-hero-sub">
                {lang === 'en'
                  ? 'FreshMart is Cambodia’s premier farm-to-table platform, bridging over 200 smallholder family farms in Kandal, Kampot, and Battambang with thousands of urban households daily.'
                  : 'FreshMart គឺជាវេទិកាគ្រឿងទេសពីកសិដ្ឋានឈានមុខគេនៅកម្ពុជា ដែលតភ្ជាប់កសិករជាង ២០០ គ្រួសារនៅកណ្តាល កំពត និងបាត់ដំបង ទៅកាន់គ្រប់គេហដ្ឋានជារៀងរាល់ថ្ងៃ។'}
              </p>
              <div className="about-hero-cta-group">
                <Link to="/products" className="about-btn-primary">
                  <img src={bagIcon} alt="Shop" className="about-btn-3d-icon" />
                  <span>{lang === 'en' ? 'Explore Fresh Produce' : 'ទិញទំនិញស្រស់ៗ'}</span>
                  <span className="about-btn-chevron">→</span>
                </Link>
                <Link to="/contact" className="about-btn-secondary">
                  <span>{lang === 'en' ? 'Get In Touch' : 'ទាក់ទងយើង'}</span>
                </Link>
              </div>
            </div>

            <div className="about-hero-visual">
              <div className="about-hero-image-frame">
                <img src={homeHero2} alt="FreshMart Flagship" className="about-hero-img" />
                <div className="about-hero-badge about-hero-badge--1">
                  <img src={sunIcon} alt="Sun" className="about-badge-icon" />
                  <div>
                    <strong>5:00 AM</strong>
                    <span>{lang === 'en' ? 'Daily Harvest' : 'ប្រមូលផលរាល់ព្រឹក'}</span>
                  </div>
                </div>
                <div className="about-hero-badge about-hero-badge--2">
                  <img src={shieldIcon} alt="Shield" className="about-badge-icon" />
                  <div>
                    <strong>4°C Locked</strong>
                    <span>{lang === 'en' ? 'Cold-Chain Protected' : 'រក្សាភាពត្រជាក់'}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===== 2. MISSION SPOTLIGHT ===== */}
      <section className="about-mission-section">
        <div className="about-inner">
          <div className="about-mission-card">
            <div className="about-mission-media">
              <img src={inside} alt="Inside FreshMart Cold Hub" className="about-mission-img" />
            </div>
            <div className="about-mission-content">
              <div className="about-mission-badge">
                <img src={targetIcon} alt="Mission" className="about-mission-3d-icon" />
                <span>{lang === 'en' ? 'Our Core Mission' : 'បេសកកម្មចម្បង'}</span>
              </div>
              <h2 className="about-mission-title">
                {lang === 'en'
                  ? 'Making clean, organic groceries affordable and delivered within 45 minutes to every family in Cambodia.'
                  : 'ធ្វើឱ្យគ្រឿងទេសសរីរាង្គស្អាត មានតម្លៃសមរម្យ និងដឹកជញ្ជូនក្នុងរយៈពេល ៤៥ នាទីដល់គ្រប់ក្រុមគ្រួសារនៅកម្ពុជា។'}
              </h2>
              <p className="about-mission-desc">
                {lang === 'en'
                  ? 'We believe everyone deserves pesticide-free produce at honest farm-gate prices. By establishing cold-storage sorting hubs in farming communities, we eliminate post-harvest waste and build long-term prosperity for local growers.'
                  : 'យើងជឿជាក់ថាគ្រប់គ្នាគប្បីទទួលបានបន្លែផ្លែឈើគ្មានគីមីក្នុងតម្លៃសមរម្យ។ តាមរយៈការបង្កើតឃ្លាំងត្រជាក់ក្នុងសហគមន៍កសិកម្ម យើងកាត់បន្ថយការខូចខាតទំនិញ និងបង្កើតស្ថិរភាពសេដ្ឋកិច្ចសម្រាប់កសិករ។'}
              </p>
              <div className="about-mission-highlights">
                <div className="about-highlight-item">
                  <span className="about-highlight-check">✓</span>
                  <span>{lang === 'en' ? 'Direct contracts with 200+ family farmers' : 'កិច្ចសន្យាផ្ទាល់ជាមួយកសិករ ២០០+ គ្រួសារ'}</span>
                </div>
                <div className="about-highlight-item">
                  <span className="about-highlight-check">✓</span>
                  <span>{lang === 'en' ? 'Zero single-use plastic in delivery logistics' : 'គ្មានថង់ប្លាស្ទិកក្នុងការដឹកជញ្ជូន'}</span>
                </div>
                <div className="about-highlight-item">
                  <span className="about-highlight-check">✓</span>
                  <span>{lang === 'en' ? 'Continuous 4°C cold-chain tracking' : 'តាមដានសីតុណ្ហភាព ៤°C ជាប្រចាំ'}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===== 3. IMPACT NUMBERS ===== */}
      <section className="about-stats-section">
        <div className="about-inner">
          <div className="about-stats-band">
            {STATS.map((s, idx) => (
              <div key={s.label.en} className="about-stat-item">
                <div className="about-stat-icon-wrap">
                  <img src={s.icon} alt={s.label[lang]} className="about-stat-3d-icon" />
                </div>
                <div className="about-stat-val">
                  <AnimatedNumber value={s.value} />
                </div>
                <span className="about-stat-label">{s.label[lang]}</span>
                {idx < STATS.length - 1 && <span className="about-stat-divider" />}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== 4. STORY TIMELINE ===== */}
      <section className="about-story-section">
        <div className="about-inner">
          <div className="about-section-header--center">
            <span className="about-section-eyebrow">
              <img src={trophyIcon} alt="Journey" className="about-3d-eyebrow-icon" />
              <span>{lang === 'en' ? 'Our Growth Story' : 'ដំណើរនៃការរីកចម្រើន'}</span>
            </span>
            <h2 className="about-section-title">
              {lang === 'en' ? 'From A Small Shop to Cambodia’s Largest Cold Network' : 'ពីហាងតូចមួយ ទៅជាបណ្តាញដឹកជញ្ជូនត្រជាក់ធំបំផុត'}
            </h2>
            <div className="about-accent-line" />
          </div>

          <div className="about-timeline-grid">
            {MILESTONES.map((m, i) => (
              <div key={m.year} className="about-timeline-card">
                <div className="about-timeline-top">
                  <span className="about-timeline-year">{m.year}</span>
                  <div className="about-timeline-icon-box">
                    <img src={m.icon} alt={m.year} className="about-timeline-3d-icon" />
                  </div>
                </div>
                <h3 className="about-timeline-card-title">{m.title[lang]}</h3>
                <p className="about-timeline-card-desc">{m.desc[lang]}</p>
                <div className="about-timeline-card-footer">
                  <span className="about-timeline-step-tag">Step 0{i + 1}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== 5. CORE PRINCIPLES ===== */}
      <section className="about-values-section">
        <div className="about-inner">
          <div className="about-section-header--center">
            <span className="about-section-eyebrow">
              <img src={shieldIcon} alt="Values" className="about-3d-eyebrow-icon" />
              <span>{lang === 'en' ? 'What Drives Us' : 'គោលការណ៍ស្នូល'}</span>
            </span>
            <h2 className="about-section-title">
              {lang === 'en' ? 'Our Guiding Principles' : 'តម្លៃដែលយើងប្រកាន់ខ្ជាប់'}
            </h2>
            <div className="about-accent-line" />
          </div>

          <div className="about-values-grid">
            {VALUES.map((v) => (
              <div key={v.title.en} className="about-value-card">
                <div className="about-value-icon-box">
                  <img src={v.icon} alt={v.title[lang]} className="about-value-3d-icon" />
                </div>
                <h3 className="about-value-title">{v.title[lang]}</h3>
                <p className="about-value-desc">{v.desc[lang]}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== 6. CTA BANNER ===== */}
      <section className="about-cta-section">
        <div className="about-inner">
          <div className="about-cta-card">
            <div className="about-cta-content">
              <h2 className="about-cta-title">
                {lang === 'en'
                  ? 'Join Us in Supporting Local Cambodian Farmers'
                  : 'ចូលរួមគាំទ្រកសិករខ្មែរជាមួយ FreshMart'}
              </h2>
              <p className="about-cta-sub">
                {lang === 'en'
                  ? 'Order crisp, farm-fresh produce delivered to your doorstep in under 45 minutes.'
                  : 'កុម្ម៉ង់បន្លែផ្លែឈើស្រស់ៗ ដឹកជញ្ជូនដល់មាត់ទ្វារអ្នកក្នុងរយៈពេល ៤៥ នាទី។'}
              </p>
              <div className="about-cta-actions">
                <Link to="/products" className="about-btn-primary">
                  <img src={bagIcon} alt="Shop" className="about-btn-3d-icon" />
                  <span>{lang === 'en' ? 'Start Shopping' : 'ចាប់ផ្តើមទិញឥឡូវ'}</span>
                  <span className="about-btn-chevron">→</span>
                </Link>
                <Link to="/career" className="about-btn-secondary">
                  <span>{lang === 'en' ? 'Join Our Team' : 'ចូលរួមជាមួយក្រុមការងារ'}</span>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

    </div>
  )
}

export default About
