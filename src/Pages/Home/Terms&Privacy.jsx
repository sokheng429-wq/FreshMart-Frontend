import { useState } from 'react'
import { useLanguage } from '../../context/LanguageContext'

// 3D Icons
import shieldIcon from '../../assets/icon/3dicons-shield-dynamic-color.png'
import trophyIcon from '../../assets/icon/3dicons-trophy-dynamic-color.png'
import walletIcon from '../../assets/icon/3dicons-wallet-dynamic-color.png'
import flashIcon from '../../assets/icon/3dicons-flash-dynamic-color.png'
import heartIcon from '../../assets/icon/3dicons-heart-dynamic-color.png'

import './Terms&Privacy.css'

const TABS = {
  terms: { en: 'Terms of Service', kh: 'លក្ខខណ្ឌប្រើប្រាស់' },
  privacy: { en: 'Privacy & Data Policy', kh: 'គោលការណ៍ភាពឯកជន' },
}

const LAST_UPDATED = { en: 'Last Updated: August 2026', kh: 'ធ្វើបច្ចុប្បន្នភាពចុងក្រោយ៖ សីហា ២០២៦' }

const TERMS_SECTIONS = [
  {
    icon: shieldIcon,
    title: { en: '1. Acceptance & Contractual Binding', kh: '១. ការទទួលយកលក្ខខណ្ឌ' },
    body: {
      en: 'By accessing the FreshMart platform, web portal, or placing orders via our digital catalog, you confirm full agreement to these Terms of Service.',
      kh: 'ដោយចូលប្រើ ឬប្រើប្រាស់គេហទំព័រ FreshMart និងសេវាកម្មរបស់យើង អ្នកយល់ព្រមចងភ្ជាប់ខ្លួនអ្នកជាមួយលក្ខខណ្ឌទាំងនេះ។',
    },
  },
  {
    icon: walletIcon,
    title: { en: '2. Farm Direct Pricing & Instant Checkout', kh: '២. ការកំណត់តម្លៃ និងការទូទាត់' },
    body: {
      en: 'All produce prices are displayed in USD/KHR and reflect direct farm-gate negotiations. We accept ABA KHQR, credit cards, and Cash on Delivery.',
      kh: 'តម្លៃកសិផលទាំងអស់ត្រូវបានបង្ហាញជាដុល្លារ/រៀល និងឆ្លុះបញ្ចាំងពីតម្លៃកសិដ្ឋានពិតប្រាកដ។ យើងទទួលយក ABA KHQR, កាតធនាគារ និងទូទាត់ពេលទទួលទំនិញ។',
    },
  },
  {
    icon: flashIcon,
    title: { en: '3. 45-Minute Cold-Chain Dispatch', kh: '៣. ការដឹកជញ្ជូនត្រជាក់ ៤៥ នាទី' },
    body: {
      en: 'We guarantee sub-zero insulated dispatch within 45 minutes across Phnom Penh. Extreme weather or road conditions may cause minor scheduling adjustments.',
      kh: 'យើងធានាការដឹកជញ្ជូនក្នុងប្រអប់ត្រជាក់ក្នុងរយៈពេល ៤៥ នាទីនៅភ្នំពេញ។ ករណីអាកាសធាតុធ្ងន់ធ្ងរអាចមានការផ្លាស់ប្តូរពេលវេលាបន្តិចបន្តួច។',
    },
  },
  {
    icon: heartIcon,
    title: { en: '4. "Fresh or 100% Free" Guarantee', kh: '៤. ការធានាភាពស្រស់ ឬឥតគិតថ្លៃ ១០០%' },
    body: {
      en: 'If any produce arrives damaged or less than peak harvest quality, submit a photo within 24 hours for an instant 100% refund with zero return friction.',
      kh: 'ប្រសិនបើបន្លែផ្លែឈើខូច ឬមិនស្រស់ ថតរូបផ្ញើក្នុងរយៈពេល ២៤ ម៉ោងដើម្បីទទួលបានប្រាក់វិញ ១០០% ភ្លាមៗ។',
    },
  },
  {
    icon: trophyIcon,
    title: { en: '5. Zero Single-Use Plastic Mandate', kh: '៥. គោលការណ៍កាត់បន្ថយប្លាស្ទិក' },
    body: {
      en: 'Customers agree to return sanitized delivery crates on subsequent deliveries to help us maintain a 100% circular zero-waste ecosystem.',
      kh: 'អតិថិជនយល់ព្រមប្រគល់ប្រអប់រក្សាភាពត្រជាក់វិញនៅពេលដឹកលើកក្រោយ ដើម្បីចូលរួមចំណែកការពារបរិស្ថាន។',
    },
  },
]

const PRIVACY_SECTIONS = [
  {
    icon: shieldIcon,
    title: { en: '1. Personal Information Collection', kh: '១. ព័ត៌មានដែលយើងប្រមូល' },
    body: {
      en: 'We collect your name, delivery address, phone number, and optional dietary preferences strictly to fulfill 45-minute order dispatch and customer support.',
      kh: 'យើងប្រមូលឈ្មោះ អាសយដ្ឋានដឹកជញ្ជូន លេខទូរស័ព្ទ និងចំណង់ចំណូលចិត្តអាហាររបស់អ្នក ដើម្បីដំណើរការការបញ្ជាទិញ និងសេវាបម្រើអតិថិជន។',
    },
  },
  {
    icon: walletIcon,
    title: { en: '2. Payment Security & Zero Card Storage', kh: '២. សុវត្ថិភាពការទូទាត់' },
    body: {
      en: 'All ABA KHQR and card transactions are encrypted end-to-end via Bakong and PCI-DSS compliant gateways. We never store credit card numbers on our servers.',
      kh: 'រាល់ប្រតិបត្តិការ ABA KHQR និងកាត ត្រូវបានការពារសុវត្ថិភាពខ្ពស់បំផុត។ យើងមិនដែលរក្សាទុកលេខកាតរបស់អ្នកនៅលើ Server របស់យើងឡើយ។',
    },
  },
  {
    icon: flashIcon,
    title: { en: '3. Zero Data Resale Guarantee', kh: '៣. ធានាមិនលក់ទិន្នន័យផ្ទាល់ខ្លួន' },
    body: {
      en: 'FreshMart does not monetize, broker, or sell customer profiles to third-party ad networks. Your grocery history is private and confidential.',
      kh: 'FreshMart មិនលក់ ឬចែករំលែកទិន្នន័យអតិថិជនទៅកាន់ភាគីទីបីឡើយ។ ប្រវត្តិទិញទំនិញរបស់អ្នកត្រូវបានរក្សាជាការសម្ងាត់។',
    },
  },
  {
    icon: trophyIcon,
    title: { en: '4. Right to Deletion & Data Portability', kh: '៤. សិទ្ធិក្នុងការលុបទិន្នន័យ' },
    body: {
      en: 'You may export or permanently delete your account data at any time via your Profile Settings or by emailing freshmartcompany@gmail.com.',
      kh: 'អ្នកអាចស្នើសុំទាញយក ឬលុបទិន្នន័យគណនីរបស់អ្នកជារៀងរហូតគ្រប់ពេល តាមរយៈទំព័រ Profile ឬតាមអ៊ីមែល។',
    },
  },
]

export const TermsPrivacy = () => {
  const { lang } = useLanguage()
  const [activeTab, setActiveTab] = useState('terms')
  const sections = activeTab === 'terms' ? TERMS_SECTIONS : PRIVACY_SECTIONS

  return (
    <div className="tp-page">
      <div className="tp-inner">

        {/* ===== HERO ===== */}
        <section className="tp-hero">
          <span className="tp-section-eyebrow">
            <img src={shieldIcon} alt="Legal" className="tp-3d-eyebrow-icon" />
            <span>{activeTab === 'terms' ? 'Legal Terms' : 'Data Privacy'}</span>
          </span>
          <h1 className="tp-hero-title">{TABS[activeTab][lang]}</h1>
          <p className="tp-hero-sub">
            {activeTab === 'terms'
              ? { en: 'Clear, transparent rules built to ensure trust and speed for every Cambodian shopper.', kh: 'ច្បាប់ច្បាស់លាស់ និងមានតម្លាភាព ដើម្បីធានាទំនុកចិត្តលើការទិញទំនិញរបស់អ្នក។' }[lang]
              : { en: 'How we rigorously protect your personal information, address data, and payment security.', kh: 'របៀបដែលយើងការពារព័ត៌មានផ្ទាល់ខ្លួន អាសយដ្ឋាន និងសុវត្ថិភាពទូទាត់របស់អ្នក។' }[lang]}
          </p>

          <span className="tp-last-updated">{LAST_UPDATED[lang]}</span>

          {/* Tab Switcher */}
          <div className="tp-tabs-bar">
            {Object.entries(TABS).map(([key, label]) => (
              <button
                key={key}
                type="button"
                className={`tp-tab-pill ${activeTab === key ? 'tp-tab-pill--active' : ''}`}
                onClick={() => setActiveTab(key)}
              >
                <span>{label[lang]}</span>
              </button>
            ))}
          </div>
        </section>

        {/* ===== SECTION CARDS ===== */}
        <div className="tp-cards-list">
          {sections.map((section) => (
            <div key={section.title.en} className="tp-card">
              <div className="tp-card-icon-box">
                <img src={section.icon} alt="Icon" className="tp-card-3d-icon" />
              </div>
              <div className="tp-card-copy">
                <h3 className="tp-card-title">{section.title[lang]}</h3>
                <p className="tp-card-text">{section.body[lang]}</p>
              </div>
            </div>
          ))}
        </div>

      </div>
    </div>
  )
}

export default TermsPrivacy
