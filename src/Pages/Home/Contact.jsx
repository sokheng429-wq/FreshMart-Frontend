import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useLanguage } from '../../context/LanguageContext'

// 3D Icons
import mapPinIcon from '../../assets/icon/3dicons-map-pin-dynamic-color.png'
import chatIcon from '../../assets/icon/3dicons-chat-bubble-dynamic-color.png'
import bellIcon from '../../assets/icon/3dicons-bell-dynamic-color.png'
import flashIcon from '../../assets/icon/3dicons-flash-dynamic-color.png'
import rocketIcon from '../../assets/icon/3dicons-rocket-dynamic-color.png'
import trophyIcon from '../../assets/icon/3dicons-trophy-dynamic-color.png'

import './Contact.css'

const INFO = [
  {
    icon: mapPinIcon,
    label: { en: 'Headquarters & Cold Hub', kh: 'ទីស្នាក់ការកណ្តាល និងឃ្លាំងត្រជាក់' },
    value: { en: 'Koh Pich - Koh Norea Bridge Area, Phnom Penh', kh: 'តំបន់អភិវឌ្ឍន៍ទីក្រុងកោះពេជ្រ-កោះនរា, ភ្នំពេញ' },
  },
  {
    icon: chatIcon,
    label: { en: 'Direct Phone & Telegram', kh: 'ទូរស័ព្ទ និង Telegram ផ្ទាល់' },
    value: { en: '+855 70 999 652', kh: '+855 70 999 652' },
  },
  {
    icon: bellIcon,
    label: { en: 'Customer Support Email', kh: 'អ៊ីមែលផ្នែកបម្រើអតិថិជន' },
    value: { en: 'freshmartcompany@gmail.com', kh: 'freshmartcompany@gmail.com' },
  },
  {
    icon: flashIcon,
    label: { en: 'Operations & Delivery Hours', kh: 'ម៉ោងប្រតិបត្តិការ និងដឹកជញ្ជូន' },
    value: { en: '24 Hours / 7 Days Active Support', kh: '២៤ ម៉ោង / ៧ ថ្ងៃជារៀងរាល់សប្តាហ៍' },
  },
]

const SOCIALS = [
  { label: 'Facebook Official', href: 'https://web.facebook.com/profile.php?id=61587630909215', tag: '@FreshMartKH' },
  { label: 'Telegram Support', href: 'https://t.me/freshmart_support', tag: '@FreshMartBot' },
  { label: 'Instagram Fresh', href: 'https://instagram.com', tag: '@freshmart.kh' },
]

const FAQ_QUICK = [
  { en: 'How do I return a damaged item?', kh: 'តើខ្ញុំអាចប្តូរទំនិញដែលខូចដោយរបៀបណា?' },
  { en: 'What areas in Phnom Penh do you cover?', kh: 'តើអ្នកដឹកជញ្ជូនទៅតំបន់ណាខ្លះនៅភ្នំពេញ?' },
  { en: 'What digital payment methods work?', kh: 'តើទទួលយកវិធីទូទាត់ឌីជីថលអ្វីខ្លះ?' },
  { en: 'How does the Fresh or Free guarantee work?', kh: 'តើការធានាភាពស្រស់ ឬឥតគិតថ្លៃដំណើរការយ៉ាងដូចម្តេច?' },
]

const TEXTS = {
  heroEyebrow: { en: '24/7 Customer Care', kh: 'សេវាបម្រើអតិថិជន ២៤/៧' },
  heroTitle: { en: 'We’re Always Here for You', kh: 'យើងនៅទីនេះដើម្បីជួយអ្នកជានិច្ច' },
  heroSub: { en: 'Have a question regarding your order, farm source, or delivery timing? Reach out and our team will assist you within minutes.', kh: 'មានសំណួរទាក់ទងនឹងការបញ្ជាទិញ ប្រភពកសិដ្ឋាន ឬការដឹកជញ្ជូន? ទំនាក់ទំនងមកយើង ក្រុមការងារនឹងឆ្លើយតបយ៉ាងរហ័ស។' },
  formTitle: { en: 'Send Direct Inquiry', kh: 'ផ្ញើសារសាកសួរផ្ទាល់' },
  name: { en: 'Your Name', kh: 'ឈ្មោះរបស់អ្នក' },
  email: { en: 'Email Address', kh: 'អាសយដ្ឋានអ៊ីមែល' },
  phone: { en: 'Phone Number', kh: 'លេខទូរស័ព្ទ' },
  subject: { en: 'Subject Matter', kh: 'ប្រធានបទ' },
  message: { en: 'Your Message', kh: 'សាររបស់អ្នក' },
  send: { en: 'Send Message Now', kh: 'ផ្ញើសារឥឡូវនេះ' },
  sending: { en: 'Transmitting...', kh: 'កំពុងបញ្ជូន...' },
  sent: { en: 'Message Delivered! We will reply shortly.', kh: 'សារត្រូវបានផ្ញើ! យើងនឹងឆ្លើយតបឆាប់ៗ។' },
  quickLinks: { en: 'Frequently Asked Questions', kh: 'សំណួរដែលសួរញឹកញាប់' },
  connectTitle: { en: 'Official Channels', kh: 'បណ្តាញទំនាក់ទំនងផ្លូវការ' },
  mapTitle: { en: 'B\'Groceries HQ & Central Fulfillment Hub', kh: 'ទីស្នាក់ការកណ្តាល និងឃ្លាំងចែកចាយកណ្តាល B\'Groceries' },
  mapSub: { en: 'Koh Pich - Koh Norea Bridge Commercial Zone, Phnom Penh, Cambodia', kh: 'តំបន់ពាណិជ្ជកម្មកោះពេជ្រ-ស្ពានកោះនរា, រាជធានីភ្នំពេញ' },
  mapBtn: { en: 'Open in Google Maps', kh: 'បើកមើលក្នុង Google Maps' },
}

const SUBJECTS = [
  { en: 'Order Delivery Status', kh: 'ស្ថានភាពដឹកជញ្ជូន' },
  { en: 'Produce Quality or Refund', kh: 'គុណភាពទំនិញ ឬការបង្វិលប្រាក់' },
  { en: 'Farm Partnership Inquiry', kh: 'ភាពជាដៃគូកសិដ្ឋាន' },
  { en: 'Corporate / Bulk Order', kh: 'ការកុម្ម៉ង់សម្រាប់ស្ថាប័ន' },
  { en: 'General Feedback', kh: 'មតិកែលម្អទូទៅ' },
]

export const Contact = () => {
  const { lang } = useLanguage()
  const [form, setForm] = useState({ name: '', email: '', phone: '', subject: '', message: '' })
  const [status, setStatus] = useState('idle')

  const handleChange = (e) => {
    const { name, value } = e.target
    setForm((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    setStatus('sending')
    setTimeout(() => {
      setStatus('sent')
      setForm({ name: '', email: '', phone: '', subject: '', message: '' })
      setTimeout(() => setStatus('idle'), 6000)
    }, 1000)
  }

  return (
    <div className="contact-page">
      <div className="contact-inner">

        {/* ===== HERO ===== */}
        <section className="contact-hero">
          <span className="contact-section-eyebrow">
            <img src={chatIcon} alt="Chat" className="contact-3d-eyebrow-icon" />
            <span>{TEXTS.heroEyebrow[lang]}</span>
          </span>
          <h1 className="contact-hero-title">{TEXTS.heroTitle[lang]}</h1>
          <p className="contact-hero-sub">{TEXTS.heroSub[lang]}</p>

          {/* Social Badges */}
          <div className="contact-social-strip">
            {SOCIALS.map((s) => (
              <a
                key={s.label}
                href={s.href}
                className="contact-social-pill"
                target="_blank"
                rel="noopener noreferrer"
              >
                <span className="contact-social-dot" />
                <span className="contact-social-name">{s.label}</span>
                <span className="contact-social-tag">{s.tag}</span>
              </a>
            ))}
          </div>
        </section>

        {/* ===== MAIN CONTENT GRID ===== */}
        <div className="contact-grid">

          {/* Left Column: HQ Cards & FAQ Links */}
          <div className="contact-left-col">
            <div className="contact-cards-group">
              {INFO.map((item) => (
                <div key={item.label.en} className="contact-info-card">
                  <div className="contact-info-icon-box">
                    <img src={item.icon} alt={item.label[lang]} className="contact-info-3d-icon" />
                  </div>
                  <div className="contact-info-copy">
                    <span className="contact-info-lbl">{item.label[lang]}</span>
                    <strong className="contact-info-val">{item.value[lang]}</strong>
                  </div>
                </div>
              ))}
            </div>

            {/* Quick FAQ Shortcuts */}
            <div className="contact-faq-box">
              <h3 className="contact-faq-heading">
                <img src={trophyIcon} alt="FAQ" className="contact-faq-3d-icon" />
                <span>{TEXTS.quickLinks[lang]}</span>
              </h3>
              <div className="contact-faq-list">
                {FAQ_QUICK.map((q) => (
                  <Link key={q.en} to="/faq" className="contact-faq-link">
                    <span>{q[lang]}</span>
                    <span className="contact-faq-arrow">→</span>
                  </Link>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column: Interactive Form */}
          <div className="contact-right-col">
            <div className="contact-form-card">
              <h2 className="contact-form-title">{TEXTS.formTitle[lang]}</h2>

              {status === 'sent' ? (
                <div className="contact-success-state">
                  <div className="contact-success-icon-box">
                    <img src={rocketIcon} alt="Sent" className="contact-success-3d-icon" />
                  </div>
                  <h3>{TEXTS.sent[lang]}</h3>
                  <p>Our concierge support team has received your ticket and will follow up immediately.</p>
                </div>
              ) : (
                <form className="contact-form" onSubmit={handleSubmit}>
                  <div className="contact-form-grid-2">
                    <div className="contact-field">
                      <label htmlFor="name">{TEXTS.name[lang]} *</label>
                      <input
                        id="name"
                        name="name"
                        type="text"
                        placeholder="e.g. name"
                        value={form.name}
                        onChange={handleChange}
                        required
                      />
                    </div>
                    <div className="contact-field">
                      <label htmlFor="email">{TEXTS.email[lang]} *</label>
                      <input
                        id="email"
                        name="email"
                        type="email"
                        placeholder="you@example.com"
                        value={form.email}
                        onChange={handleChange}
                        required
                      />
                    </div>
                  </div>

                  <div className="contact-form-grid-2">
                    <div className="contact-field">
                      <label htmlFor="phone">{TEXTS.phone[lang]}</label>
                      <input
                        id="phone"
                        name="phone"
                        type="tel"
                        placeholder="012 345 678"
                        value={form.phone}
                        onChange={handleChange}
                      />
                    </div>
                    <div className="contact-field">
                      <label htmlFor="subject">{TEXTS.subject[lang]} *</label>
                      <select
                        id="subject"
                        name="subject"
                        value={form.subject}
                        onChange={handleChange}
                        required
                      >
                        <option value="">-- Select Subject --</option>
                        {SUBJECTS.map((s) => (
                          <option key={s.en} value={s.en}>{s[lang]}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="contact-field">
                    <label htmlFor="message">{TEXTS.message[lang]} *</label>
                    <textarea
                      id="message"
                      name="message"
                      rows="5"
                      placeholder={lang === 'en' ? 'Describe how we can assist you...' : 'ប្រាប់យើងពីរបៀបដែលយើងអាចជួយអ្នកបាន...'}
                      value={form.message}
                      onChange={handleChange}
                      required
                    />
                  </div>

                  <button
                    type="submit"
                    className="contact-btn-submit"
                    disabled={status === 'sending'}
                  >
                    {status === 'sending' ? (
                      <>
                        <span className="contact-spinner" />
                        <span>{TEXTS.sending[lang]}</span>
                      </>
                    ) : (
                      <>
                        <img src={flashIcon} alt="Send" className="contact-btn-3d-icon" />
                        <span>{TEXTS.send[lang]}</span>
                        <span>→</span>
                      </>
                    )}
                  </button>
                </form>
              )}
            </div>
          </div>

        </div>

        {/* ===== GOOGLE MAP SECTION ===== */}
        <section className="contact-map-section">
          <div className="contact-map-card">
            <div className="contact-map-header">
              <div className="contact-map-header-left">
                <img src={mapPinIcon} alt="Location" className="contact-map-3d-pin" />
                <div>
                  <h3 className="contact-map-title">{TEXTS.mapTitle[lang]}</h3>
                  <p className="contact-map-subtitle">{TEXTS.mapSub[lang]}</p>
                </div>
              </div>
              <a
                href="https://www.google.com/maps/place/B'%20Groceries%20Hyperstore/@11.5468235,104.9529718,17z"
                target="_blank"
                rel="noopener noreferrer"
                className="contact-map-directions-btn"
              >
                <span>{TEXTS.mapBtn[lang]}</span>
                <span>↗</span>
              </a>
            </div>

            <div className="contact-map-iframe-wrap">
              <iframe
                title="B' Groceries Hyperstore Location Map"
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3909.070178587878!2d104.95297177584446!3d11.546823544509882!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x310957fce50292d5%3A0x536c4e59191c151e!2sB'%20Groceries%20Hyperstore!5e0!3m2!1sen!2skh!4v1787802586026!5m2!1sen!2skh"
                width="100%"
                height="450"
                style={{ border: 0 }}
                allowFullScreen=""
                loading="lazy"
                referrerPolicy="strict-origin-when-cross-origin"
              />
            </div>
          </div>
        </section>

      </div>
    </div>
  )
}

export default Contact