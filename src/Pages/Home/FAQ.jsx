import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useLanguage } from '../../context/LanguageContext'

// 3D Icons
import bagIcon from '../../assets/icon/3dicons-bag-dynamic-color.png'
import walletIcon from '../../assets/icon/3dicons-wallet-dynamic-color.png'
import shieldIcon from '../../assets/icon/3dicons-shield-dynamic-color.png'
import heartIcon from '../../assets/icon/3dicons-heart-dynamic-color.png'
import chatIcon from '../../assets/icon/3dicons-chat-bubble-dynamic-color.png'
import trophyIcon from '../../assets/icon/3dicons-trophy-dynamic-color.png'

import './FAQ.css'

const FAQ_CATEGORIES = [
  {
    icon: bagIcon,
    title: { en: 'Orders & Express Delivery', kh: 'ការបញ្ជាទិញ និងដឹកជញ្ជូន' },
    items: [
      {
        q: { en: 'How fast is FreshMart express delivery in Phnom Penh?', kh: 'តើការដឹកជញ្ជូនរហ័សនៅភ្នំពេញលឿនប៉ុណ្ណា?' },
        a: { en: 'We dispatch all morning harvests via temperature-insulated eco-couriers within 45 minutes across all 14 districts in Phnom Penh. Orders placed before 8:00 PM arrive same-day.', kh: 'យើងបញ្ជូនកសិផលប្រមូលផលរាល់ព្រឹកតាមរយៈម៉ូតូរក្សាភាពត្រជាក់ក្នុងរយៈពេល ៤៥ នាទីទូទាំង ១៤ ខណ្ឌនៅភ្នំពេញ។ បញ្ជាទិញមុនម៉ោង ៨:០០ យប់នឹងទទួលបានក្នុងថ្ងៃតែមួយ។' },
      },
      {
        q: { en: 'Which provinces and cities do you deliver to?', kh: 'តើអ្នកដឹកជញ្ជូនទៅកាន់ខេត្ត និងក្រុងណាខ្លះ?' },
        a: { en: 'We operate active cold hubs in Phnom Penh, Siem Reap, and Battambang, with inter-province cold transit servicing all 25 provinces across Cambodia.', kh: 'យើងដំណើរការឃ្លាំងត្រជាក់នៅភ្នំពេញ សៀមរាប និងបាត់ដំបង ព្រមទាំងដឹកជញ្ជូនត្រជាក់ទៅកាន់ ២៥ ខេត្ត-ក្រុងទូទាំងកម្ពុជា។' },
      },
      {
        q: { en: 'Can I schedule a future delivery slot?', kh: 'តើខ្ញុំអាចកំណត់ម៉ោងទទួលទំនិញជាមុនបានទេ?' },
        a: { en: 'Yes! At checkout, simply select any convenient 2-hour delivery window up to 3 days in advance.', kh: 'បាន! នៅពេលទូទាត់ប្រាក់ អ្នកអាចជ្រើសរើសចន្លោះពេល ២ ម៉ោងដែលងាយស្រួលរហូតដល់ ៣ ថ្ងៃជាមុន។' },
      },
    ],
  },
  {
    icon: walletIcon,
    title: { en: 'Payments, Pricing & ABA Pay', kh: 'ការទូទាត់ តម្លៃ និង ABA' },
    items: [
      {
        q: { en: 'What payment methods are supported?', kh: 'តើទទួលយកវិធីទូទាត់ប្រាក់អ្វីខ្លះ?' },
        a: { en: 'We accept ABA KHQR (Instant Scan), Wing, TrueMoney, Visa/Mastercard, and Cash on Delivery (COD).', kh: 'យើងទទួលយក ABA KHQR, Wing, TrueMoney, Visa/Mastercard និងទូទាត់ជាសាច់ប្រាក់ពេលទទួលទំនិញ (COD)។' },
      },
      {
        q: { en: 'Why are prices up to 25% lower than supermarkets?', kh: 'ហេតុអ្វីបានជាតម្លៃទាបជាងផ្សារទំនើបរហូតដល់ ២៥%?' },
        a: { en: 'We purchase direct from 200+ local Cambodian farming families, eliminating middlemen, broker fees, and expensive retail overhead.', kh: 'យើងទិញដោយផ្ទាល់ពីកសិករខ្មែរជាង ២០០ គ្រួសារ ដោយកាត់បន្ថយឈ្មួញកណ្តាល និងការចំណាយលើទីតាំងលក់ថ្លៃៗ។' },
      },
      {
        q: { en: 'Is there a minimum order requirement?', kh: 'តើមានកំណត់ចំនួនបញ្ជាទិញអប្បបរមាទេ?' },
        a: { en: 'No minimum order is required! Whether you need one bunch of fresh bok choy or a week’s family groceries, we deliver.', kh: 'មិនមានកំណត់អប្បបរមាទេ! ទោះបីជាអ្នកត្រូវការបន្លែមួយក្តាប់ ឬគ្រឿងទេសសម្រាប់មួយសប្តាហ៍ យើងដឹកជូនទាំងអស់។' },
      },
    ],
  },
  {
    icon: shieldIcon,
    title: { en: 'Freshness Guarantee & Returns', kh: 'ការធានាភាពស្រស់ និងការប្តូរ' },
    items: [
      {
        q: { en: 'How does the "Fresh or 100% Free" guarantee work?', kh: 'តើការធានា "ស្រស់ ឬឥតគិតថ្លៃ ១០០%" ដំណើរការយ៉ាងដូចម្តេច?' },
        a: { en: 'If any produce arrives bruised, wilted, or imperfect, tap "Request Refund" in your order history within 24 hours for an instant 100% refund with no hassle.', kh: 'ប្រសិនបើបន្លែផ្លែឈើណាមួយមានស្នាម ឬមិនស្រស់ ចុច "ស្នើសុំបង្វិលប្រាក់" ក្នុងកម្មវិធីក្នុងរយៈពេល ២៤ ម៉ោងដើម្បីទទួលបានប្រាក់វិញ ១០០% ភ្លាមៗ។' },
      },
      {
        q: { en: 'How do returnable zero-waste crates work?', kh: 'តើប្រអប់បរិស្ថានប្រើឡើងវិញដំណើរការយ៉ាងដូចម្តេច?' },
        a: { en: 'Your groceries arrive in sanitized, insulated returnable crates. Keep them until your next delivery, and our courier will collect and sterilize them.', kh: 'គ្រឿងទេសរបស់អ្នកនឹងត្រូវដាក់ក្នុងប្រអប់រក្សាភាពត្រជាក់។ អ្នកអាចរក្សាទុកវា ហើយអ្នកដឹកជញ្ជូននឹងប្រមូលវានៅពេលដឹកលើកក្រោយ។' },
      },
    ],
  },
  {
    icon: heartIcon,
    title: { en: 'Membership, Perks & Loyalty', kh: 'សមាជិកភាព និងរង្វាន់' },
    items: [
      {
        q: { en: 'How do I join the FreshMart Member Club?', kh: 'តើខ្ញុំអាចចូលរួមជាសមាជិក FreshMart ដោយរបៀបណា?' },
        a: { en: 'Membership is 100% free forever. Creating an account unlocks exclusive weekly farm discounts, reward points on every dollar, and free delivery on orders over $15.', kh: 'សមាជិកភាពគឺឥតគិតថ្លៃជារៀងរហូត។ ការចុះឈ្មោះនឹងទទួលបានការបញ្ចុះតម្លៃប្រចាំសប្តាហ៍ ពិន្ទុរង្វាន់ និងការដឹកជញ្ជូនឥតគិតថ្លៃលើការកុម្ម៉ង់លើស $15។' },
      },
      {
        q: { en: 'How do reward points convert to grocery discounts?', kh: 'តើពិន្ទុរង្វាន់អាចប្តូរជាការបញ្ចុះតម្លៃយ៉ាងដូចម្តេច?' },
        a: { en: 'Every 100 points equals $1.00 off your next checkout. Points never expire as long as your account remains active.', kh: 'រាល់ ១០០ ពិន្ទុស្មើនឹង $1.00 បញ្ចុះតម្លៃលើការទូទាត់បន្ទាប់។ ពិន្ទុមិនផុតកំណត់ឡើយ។' },
      },
    ],
  },
]

const TEXTS = {
  heroEyebrow: { en: 'Knowledge Base', kh: 'មជ្ឈមណ្ឌលជំនួយ' },
  title: { en: 'Frequently Asked Questions', kh: 'សំណួរដែលសួរញឹកញាប់' },
  subtitle: { en: 'Everything you need to know about our farm sources, express cold delivery, and quality guarantee.', kh: 'អ្វីគ្រប់យ៉ាងដែលអ្នកត្រូវដឹងអំពីប្រភពកសិដ្ឋាន ការដឹកជញ្ជូនត្រជាក់ និងការធានាគុណភាពរបស់យើង។' },
  searchPlaceholder: { en: 'Search questions, keywords, or topics...', kh: 'ស្វែងរកសំណួរ ឬប្រធានបទ...' },
  noResults: { en: 'No matching questions found. Try another search term!', kh: 'រកមិនឃើញសំណួរដែលត្រូវគ្នាទេ។ សូមសាកល្បងពាក្យផ្សេង!' },
  needMoreHelp: { en: 'Still Have Questions?', kh: 'នៅមានសំណួរទៀតទេ?' },
  helpDesc: { en: 'Our friendly customer care team is available 24/7 on Telegram and Live Chat.', kh: 'ក្រុមការងារបម្រើអតិថិជនរបស់យើងរង់ចាំជួយអ្នក ២៤/៧ តាមរយៈ Telegram និង Live Chat។' },
  contactBtn: { en: 'Contact Support', kh: 'ទាក់ទងផ្នែកគាំទ្រ' },
}

export const FAQ = () => {
  const { lang } = useLanguage()
  const [openKey, setOpenKey] = useState('0-0')
  const [activeCat, setActiveCat] = useState(0)
  const [search, setSearch] = useState('')

  const toggle = (catIdx, itemIdx) => {
    const key = `${catIdx}-${itemIdx}`
    setOpenKey(openKey === key ? null : key)
  }

  const filteredCategories = FAQ_CATEGORIES.map((cat, catIdx) => ({
    ...cat,
    originalIdx: catIdx,
    items: cat.items.filter(
      (item) =>
        item.q[lang].toLowerCase().includes(search.toLowerCase()) ||
        item.a[lang].toLowerCase().includes(search.toLowerCase())
    ),
  })).filter((cat) => cat.items.length > 0)

  return (
    <div className="faq-page">
      <div className="faq-inner">

        {/* ===== HERO ===== */}
        <section className="faq-hero">
          <span className="faq-section-eyebrow">
            <img src={trophyIcon} alt="FAQ" className="faq-3d-eyebrow-icon" />
            <span>{TEXTS.heroEyebrow[lang]}</span>
          </span>
          <h1 className="faq-hero-title">{TEXTS.title[lang]}</h1>
          <p className="faq-hero-sub">{TEXTS.subtitle[lang]}</p>

          {/* Search Bar */}
          <div className="faq-search-box">
            <span className="faq-search-icon">🔍</span>
            <input
              className="faq-search-input"
              type="text"
              placeholder={TEXTS.searchPlaceholder[lang]}
              value={search}
              onChange={(e) => {
                setSearch(e.target.value)
                setActiveCat(0)
              }}
            />
            {search && (
              <button
                type="button"
                className="faq-search-clear"
                onClick={() => setSearch('')}
              >
                ✕
              </button>
            )}
          </div>
        </section>

        {/* ===== CATEGORY TABS (when not searching) ===== */}
        {!search && (
          <div className="faq-cat-bar">
            {FAQ_CATEGORIES.map((cat, i) => (
              <button
                key={cat.title.en}
                type="button"
                className={`faq-cat-pill ${activeCat === i ? 'faq-cat-pill--active' : ''}`}
                onClick={() => {
                  setActiveCat(i)
                  setOpenKey(`${i}-0`)
                }}
              >
                <img src={cat.icon} alt={cat.title[lang]} className="faq-cat-3d-icon" />
                <span>{cat.title[lang]}</span>
              </button>
            ))}
          </div>
        )}

        {/* ===== ACCORDION LIST ===== */}
        <div className="faq-list-container">
          {filteredCategories.length === 0 ? (
            <div className="faq-empty-state">
              <span className="faq-empty-icon">🔍</span>
              <p>{TEXTS.noResults[lang]}</p>
            </div>
          ) : (
            filteredCategories.map((cat) => {
              if (!search && cat.originalIdx !== activeCat) return null
              return (
                <div key={cat.title.en} className="faq-cat-group">
                  {search && (
                    <div className="faq-search-cat-header">
                      <img src={cat.icon} alt={cat.title[lang]} className="faq-search-cat-icon" />
                      <h3>{cat.title[lang]}</h3>
                    </div>
                  )}

                  <div className="faq-accordion-group">
                    {cat.items.map((item, itemIdx) => {
                      const key = `${cat.originalIdx}-${itemIdx}`
                      const isOpen = openKey === key
                      return (
                        <div
                          key={item.q.en}
                          className={`faq-card ${isOpen ? 'faq-card--open' : ''}`}
                        >
                          <button
                            type="button"
                            className="faq-card-header"
                            onClick={() => toggle(cat.originalIdx, itemIdx)}
                          >
                            <span className="faq-card-q">{item.q[lang]}</span>
                            <span className="faq-card-toggle">{isOpen ? '−' : '+'}</span>
                          </button>
                          {isOpen && (
                            <div className="faq-card-body">
                              <p className="faq-card-a">{item.a[lang]}</p>
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </div>
              )
            })
          )}
        </div>

        {/* ===== NEED MORE HELP CARD ===== */}
        <div className="faq-help-card">
          <div className="faq-help-icon-box">
            <img src={chatIcon} alt="Help" className="faq-help-3d-icon" />
          </div>
          <div className="faq-help-copy">
            <h3 className="faq-help-title">{TEXTS.needMoreHelp[lang]}</h3>
            <p className="faq-help-desc">{TEXTS.helpDesc[lang]}</p>
          </div>
          <Link to="/contact" className="faq-btn-help">
            <span>{TEXTS.contactBtn[lang]}</span>
            <span>→</span>
          </Link>
        </div>

      </div>
    </div>
  )
}

export default FAQ
