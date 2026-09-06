import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useLanguage } from '../../context/LanguageContext'
import { PROMOS, getProduct, formatPrice, discountPct, catLabel, FALLBACK_IMG } from '../../data/products'

// 3D Icons
import fireIcon from '../../assets/icon/3dicons-fire-dynamic-color.png'
import flashIcon from '../../assets/icon/3dicons-flash-dynamic-color.png'
import giftIcon from '../../assets/icon/3dicons-gift-box-dynamic-color.png'
import leafIcon from '../../assets/icon/3dicons-leaf-dynamic-color.png'
import copyIcon3d from '../../assets/icon/3dicons-copy-dynamic-color.png'

import './Promotion.css'

const TEXTS = {
  eyebrow: { en: 'Daily Flash Drops · Limited Stock', kh: 'ការផ្តល់ជូនពិសេសប្រចាំថ្ងៃ' },
  title1: { en: 'Exclusive Deals &', kh: 'ការផ្តល់ជូនពិសេស និង' },
  title2: { en: 'Flash Discounts', kh: 'បញ្ចុះតម្លៃរហូតដល់ ២៥%' },
  subtitle: {
    en: 'Grab direct-from-farm harvest deals before the countdown runs out. Instant discount applied at checkout with zero voucher hassle.',
    kh: 'ចាប់យកការផ្តល់ជូនប្រមូលផលស្រស់ៗពីកសិដ្ឋាន មុនពេលរាប់ថយក្រោយអស់។ បញ្ចុះតម្លៃភ្លាមៗនៅពេលទូទាត់។',
  },
  endsIn: { en: 'Flash sale finishes in', kh: 'ការផ្តល់ជូនបញ្ចប់ក្នុង' },
  promoCodesTitle: { en: 'Active Promo Codes', kh: 'កូដផ្សព្វផ្សាយសកម្ម' },
  promoCodesSubtitle: { en: 'Click to copy code and apply directly to your cart at checkout.', kh: 'ចុចដើម្បីចម្លងកូដ និងប្រើប្រាស់នៅពេលទូទាត់។' },
  copy: { en: 'Copy Code', kh: 'ចម្លងកូដ' },
  copied: { en: 'Copied to Clipboard! ✓', kh: 'បានចម្លងរួចរាល់! ✓' },
  saveUpTo: { en: 'SAVE UP TO', kh: 'សន្សំរហូតដល់' },
  shopDeals: { en: 'View All Deals', kh: 'មើលការផ្តល់ជូនទាំងអស់' },
  addToCart: { en: 'View Deal Details', kh: 'មើលការផ្តល់ជូន' },
  hours: { en: 'HOURS', kh: 'ម៉ោង' },
  mins: { en: 'MINUTES', kh: 'នាទី' },
  secs: { en: 'SECONDS', kh: 'វិនាទី' },
}

const useCountdown = () => {
  const [left, setLeft] = useState(() => {
    const now = new Date()
    const end = new Date(now)
    end.setHours(23, 59, 59, 999)
    return Math.max(0, end - now)
  })

  useEffect(() => {
    const id = window.setInterval(() => {
      const now = new Date()
      const end = new Date()
      end.setHours(23, 59, 59, 999)
      setLeft(Math.max(0, end - now))
    }, 1000)
    return () => window.clearInterval(id)
  }, [])

  const s = Math.floor(left / 1000)
  return {
    h: String(Math.floor(s / 3600)).padStart(2, '0'),
    m: String(Math.floor((s % 3600) / 60)).padStart(2, '0'),
    sec: String(s % 60).padStart(2, '0'),
  }
}

export const Promotion = () => {
  const { lang } = useLanguage()
  const { h, m, sec } = useCountdown()
  const [copiedCode, setCopiedCode] = useState(null)

  const copyToClipboard = (code) => {
    navigator.clipboard?.writeText(code)
    setCopiedCode(code)
    window.setTimeout(() => setCopiedCode(null), 1800)
  }

  const deals = PROMOS
    .map((promo) => ({ promo, product: getProduct(promo.productId) }))
    .filter((d) => Boolean(d.product))

  const VOUCHERS = [
    { code: 'FRESH20', disc: '20% OFF', desc: { en: 'All Organic Veggies & Fruits', kh: 'បន្លែ និងផ្លែឈើសរីរាង្គទាំងអស់' }, min: '$15 Min. Order' },
    { code: 'GROCERY10', disc: '10% OFF', desc: { en: 'Bakery, Dairy & Pantry Items', kh: 'នំបុ័ង ទឹកដោះគោ និងគ្រឿងទេស' }, min: '$20 Min. Order' },
    { code: 'SAVE5', disc: '$5 FLAT', desc: { en: 'First-time customer welcome gift', kh: 'កាដូស្វាគមន៍អតិថិជនថ្មី' }, min: '$25 Min. Order' },
  ]

  return (
    <div className="promo-page">
      {/* ── HERO BANNER ── */}
      <section className="promo-hero-card">
        <div className="promo-hero-inner">
          <div className="promo-hero-copy">
            <span className="promo-eyebrow">
              <img src={fireIcon} alt="Hot" className="promo-3d-micro" />
              <span>{TEXTS.eyebrow[lang]}</span>
            </span>

            <h1 className="promo-title">
              {TEXTS.title1[lang]} <span className="promo-title-highlight">{TEXTS.title2[lang]}</span>
            </h1>

            <p className="promo-subtitle">{TEXTS.subtitle[lang]}</p>

            {/* Countdown Box */}
            <div className="promo-timer-box">
              <span className="promo-timer-lbl">{TEXTS.endsIn[lang]}:</span>
              <div className="promo-clock">
                <div className="promo-clock-cell">
                  <span className="promo-clock-num">{h}</span>
                  <span className="promo-clock-sub">{TEXTS.hours[lang]}</span>
                </div>
                <span className="promo-clock-colon">:</span>
                <div className="promo-clock-cell">
                  <span className="promo-clock-num">{m}</span>
                  <span className="promo-clock-sub">{TEXTS.mins[lang]}</span>
                </div>
                <span className="promo-clock-colon">:</span>
                <div className="promo-clock-cell">
                  <span className="promo-clock-num">{sec}</span>
                  <span className="promo-clock-sub">{TEXTS.secs[lang]}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="promo-hero-visual">
            <div className="promo-visual-glow" />
            <img src={giftIcon} alt="Promo" className="promo-hero-3d-img" />
            <div className="promo-badge-float">
              <img src={flashIcon} alt="Flash" className="promo-badge-icon" />
              <span>-25% Maximum Drop</span>
            </div>
          </div>
        </div>
      </section>

      <div className="promo-content-wrap">

        {/* ── ACTIVE VOUCHERS STRIP ── */}
        <section className="promo-vouchers-section">
          <div className="promo-section-head">
            <img src={giftIcon} alt="Vouchers" className="promo-section-3d-sm" />
            <div>
              <h2 className="promo-section-title">{TEXTS.promoCodesTitle[lang]}</h2>
              <p className="promo-section-sub">{TEXTS.promoCodesSubtitle[lang]}</p>
            </div>
          </div>

          <div className="promo-vouchers-grid">
            {VOUCHERS.map((v) => (
              <div key={v.code} className="promo-voucher-card">
                <div className="promo-voucher-left">
                  <span className="promo-voucher-disc">{v.disc}</span>
                  <span className="promo-voucher-min">{v.min}</span>
                </div>
                <div className="promo-voucher-right">
                  <p className="promo-voucher-desc">{v.desc[lang]}</p>
                  <div className="promo-voucher-code-row">
                    <span className="promo-voucher-code-tag">{v.code}</span>
                    <button
                      type="button"
                      className={`promo-btn-copy ${copiedCode === v.code ? 'promo-btn-copy--done' : ''}`}
                      onClick={() => copyToClipboard(v.code)}
                    >
                      {copiedCode === v.code ? '✓ Copied!' : TEXTS.copy[lang]}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ── DAILY DEALS SHOWCASE ── */}
        <section className="promo-deals-section">
          <div className="promo-section-head">
            <img src={fireIcon} alt="Deals" className="promo-section-3d-sm" />
            <div>
              <h2 className="promo-section-title">Today's Highlighted Harvest Deals</h2>
              <p className="promo-section-sub">High-grade pesticide-free greens and fruit packages on deep discount.</p>
            </div>
          </div>

          <div className="promo-deals-grid">
            {deals.map(({ promo, product }) => {
              const saved = product.oldPrice ? product.oldPrice - product.price : product.price * 0.20
              const cat = catLabel(product.category)
              const discount = discountPct(product.oldPrice, product.price) || 20

              return (
                <div className="promo-deal-card" key={promo.id}>
                  <div className="promo-deal-media">
                    <img
                      src={product.image}
                      alt={product.name[lang]}
                      onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = FALLBACK_IMG }}
                      className="promo-deal-img"
                    />
                    <span className="promo-deal-discount-pill">-{discount}%</span>
                    <span className="promo-deal-save-badge">
                      Save ${saved.toFixed(2)}
                    </span>
                  </div>

                  <div className="promo-deal-body">
                    <div className="promo-deal-cat">
                      <img src={leafIcon} alt="Cat" className="promo-deal-micro-leaf" />
                      <span>{cat[lang]}</span>
                    </div>

                    <h3 className="promo-deal-name">{product.name[lang]}</h3>

                    <div className="promo-deal-price-box">
                      <span className="promo-deal-price">{formatPrice(product.price)}</span>
                      {product.oldPrice && (
                        <s className="promo-deal-price-old">{formatPrice(product.oldPrice)}</s>
                      )}
                    </div>

                    <Link
                      to="/product-detail"
                      state={{ product }}
                      className="promo-deal-cta"
                    >
                      <span>{TEXTS.addToCart[lang]}</span>
                      <span>→</span>
                    </Link>
                  </div>
                </div>
              )
            })}
          </div>
        </section>

      </div>
    </div>
  )
}

export default Promotion
