import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useLanguage } from '../../context/LanguageContext'
import { useCart } from '../../context/CartContext'

// 3D Icons
import bagIcon from '../../assets/icon/3dicons-bag-dynamic-color.png'
import walletIcon from '../../assets/icon/3dicons-wallet-dynamic-color.png'
import flashIcon from '../../assets/icon/3dicons-flash-dynamic-color.png'
import shieldIcon from '../../assets/icon/3dicons-shield-dynamic-color.png'
import leafIcon from '../../assets/icon/3dicons-leaf-dynamic-color.png'

import './Cart.css'

const TEXTS = {
  eyebrow: { en: 'Express Checkout', kh: 'ការទូទាត់រហ័ស' },
  title: { en: 'Your Shopping Cart', kh: 'កន្ត្រកទិញទំនិញរបស់អ្នក' },
  subtitle: {
    en: 'Review your fresh items, customize quantities, and enjoy guaranteed 45-minute cold delivery across Phnom Penh.',
    kh: 'ពិនិត្យមើលទំនិញស្រស់ៗរបស់អ្នក កែសម្រួលចំនួន និងទទួលបានការដឹកជញ្ជូនត្រជាក់ក្នុង ៤៥ នាទីទូទាំងភ្នំពេញ។',
  },
  itemsCount: { en: 'items', kh: 'មុខទំនិញ' },
  emptyTitle: { en: 'Your Basket is Empty', kh: 'កន្ត្រករបស់អ្នកទទេ' },
  emptyHint: {
    en: 'Looks like you have not added any fresh farm produce or pantry staples yet.',
    kh: 'មើលទៅអ្នកមិនទាន់បានបន្ថែមបន្លែផ្លែឈើស្រស់ៗ ឬទំនិញប្រចាំថ្ងៃនៅឡើយទេ។',
  },
  startShopping: { en: 'Explore Fresh Market', kh: 'រុករកទីផ្សារស្រស់ៗ' },
  summaryTitle: { en: 'Order Summary', kh: 'សង្ខេបការបញ្ជាទិញ' },
  subtotal: { en: 'Item Subtotal', kh: 'សរុបទំនិញ' },
  delivery: { en: 'Delivery Fee', kh: 'ថ្លៃដឹកជញ្ជូន' },
  free: { en: 'FREE', kh: 'ឥតគិតថ្លៃ' },
  freeThresholdMsg: {
    en: 'Add $__DIFF__ more to get FREE Lightning Express Delivery!',
    kh: 'បន្ថែម $__DIFF__ ទៀតដើម្បីទទួលបានការដឹកជញ្ជូនលឿនឥតគិតថ្លៃ!',
  },
  freeUnlockedMsg: {
    en: '🎉 You have unlocked FREE Express Delivery!',
    kh: '🎉 អ្នកទទួលបានការដឹកជញ្ជូនលឿនឥតគិតថ្លៃ!',
  },
  discount: { en: 'Promo Discount', kh: 'ការបញ្ចុះតម្លៃ' },
  total: { en: 'Estimated Total', kh: 'តម្លៃសរុបប៉ាន់ស្មាន' },
  checkoutBtn: { en: 'Proceed to Secure Checkout', kh: 'បន្តទៅការទូទាត់ប្រាក់' },
  continueShopping: { en: 'Continue Shopping', kh: 'បន្តជ្រើសរើសទំនិញ' },
  promoCode: { en: 'Promo Code', kh: 'លេខកូដបញ្ចុះតម្លៃ' },
  apply: { en: 'Apply', kh: 'ប្រើប្រាស់' },
  applied: { en: 'Applied', kh: 'បានប្រើ' },
  clearCart: { en: 'Clear Cart', kh: 'សម្អាតកន្ត្រក' },
  secureBadge: { en: '100% Freshness Guarantee & Safe Payment', kh: 'ធានាភាពស្រស់ ១០០% និងការទូទាត់សុវត្ថិភាព' },
}

export const Cart = () => {
  const { lang } = useLanguage()
  const { cartItems, updateQuantity, removeItem, totalItems, subtotal } = useCart()

  const [promoInput, setPromoInput] = useState('')
  const [promoApplied, setPromoApplied] = useState(false)
  const [promoDiscount, setPromoDiscount] = useState(0)
  const [promoError, setPromoError] = useState('')

  const FREE_DELIVERY_THRESHOLD = 15.00
  const deliveryFee = subtotal >= FREE_DELIVERY_THRESHOLD || subtotal === 0 ? 0 : 2.50
  const freeDiff = Math.max(0, FREE_DELIVERY_THRESHOLD - subtotal).toFixed(2)
  const progressPct = Math.min(100, Math.round((subtotal / FREE_DELIVERY_THRESHOLD) * 100))

  const handleApplyPromo = (e) => {
    e.preventDefault()
    setPromoError('')
    const code = promoInput.trim().toUpperCase()
    if (!code) return

    if (code === 'FRESH20' || code === 'GROCERY10' || code === 'SAVE5') {
      const disc = code === 'FRESH20' ? subtotal * 0.20 : code === 'GROCERY10' ? subtotal * 0.10 : 5.00
      setPromoDiscount(Math.min(subtotal, disc))
      setPromoApplied(true)
      setPromoError('')
    } else {
      setPromoError(lang === 'en' ? 'Invalid promo code. Try FRESH20' : 'កូដមិនត្រឹមត្រូវ។ សាកល្បង FRESH20')
    }
  }

  const finalTotal = Math.max(0, subtotal + deliveryFee - promoDiscount)

  return (
    <div className="cart-page">
      <div className="cart-inner">

        {/* ── HERO BANNER ── */}
        <section className="cart-hero-card">
          <div className="cart-hero-content">
            <span className="cart-hero-eyebrow">
              <img src={bagIcon} alt="Cart" className="cart-3d-icon-sm" />
              <span>{TEXTS.eyebrow[lang]}</span>
            </span>
            <h1 className="cart-hero-title">{TEXTS.title[lang]}</h1>
            <p className="cart-hero-sub">{TEXTS.subtitle[lang]}</p>
          </div>
          <div className="cart-hero-badge">
            <span className="cart-hero-badge-num">{totalItems}</span>
            <span className="cart-hero-badge-lbl">{TEXTS.itemsCount[lang]}</span>
          </div>
        </section>

        {/* ── MAIN CONTENT ── */}
        <div className="cart-main-grid">

          {/* LEFT: CART ITEMS LIST */}
          <div className="cart-items-column">

            {/* Free Delivery Bar */}
            {cartItems.length > 0 && (
              <div className="cart-progress-box">
                <div className="cart-progress-header">
                  <span className="cart-progress-icon">
                    <img src={flashIcon} alt="Express" className="cart-3d-icon-xs" />
                  </span>
                  <p className="cart-progress-text">
                    {subtotal >= FREE_DELIVERY_THRESHOLD
                      ? TEXTS.freeUnlockedMsg[lang]
                      : TEXTS.freeThresholdMsg[lang].replace('__DIFF__', freeDiff)}
                  </p>
                </div>
                <div className="cart-progress-bar-bg">
                  <div
                    className="cart-progress-bar-fill"
                    style={{ width: `${progressPct}%` }}
                  />
                </div>
              </div>
            )}

            {cartItems.length === 0 ? (
              <div className="cart-empty-state">
                <div className="cart-empty-icon-wrap">
                  <img src={bagIcon} alt="Empty" className="cart-empty-3d-img" />
                </div>
                <h3 className="cart-empty-title">{TEXTS.emptyTitle[lang]}</h3>
                <p className="cart-empty-hint">{TEXTS.emptyHint[lang]}</p>
                <Link to="/products" className="cart-empty-btn">
                  <img src={leafIcon} alt="Shop" className="cart-btn-icon" />
                  <span>{TEXTS.startShopping[lang]}</span>
                  <span>→</span>
                </Link>
              </div>
            ) : (
              <div className="cart-list">
                {cartItems.map((item) => {
                  const itemName = typeof item.name === 'object' ? item.name[lang] || item.name.en : item.name
                  const itemUnit = typeof item.unit === 'object' ? item.unit[lang] || item.unit.en : item.unit || 'unit'
                  const itemPrice = Number(item.price) || 0
                  const lineTotal = (itemPrice * item.quantity).toFixed(2)

                  return (
                    <div key={item.id} className="cart-card">
                      <div className="cart-card-media">
                        <img src={item.image} alt={itemName} className="cart-card-img" />
                      </div>

                      <div className="cart-card-info">
                        <div className="cart-card-head">
                          <div>
                            <h3 className="cart-card-name">{itemName}</h3>
                            <span className="cart-card-unit">${itemPrice.toFixed(2)} / {itemUnit}</span>
                          </div>
                          <span className="cart-card-total">${lineTotal}</span>
                        </div>

                        <div className="cart-card-controls">
                          <div className="cart-stepper">
                            <button
                              type="button"
                              className="cart-stepper-btn"
                              onClick={() => updateQuantity(item.id, -1)}
                              aria-label="Decrease quantity"
                            >
                              −
                            </button>
                            <span className="cart-stepper-value">{item.quantity}</span>
                            <button
                              type="button"
                              className="cart-stepper-btn"
                              onClick={() => updateQuantity(item.id, 1)}
                              aria-label="Increase quantity"
                            >
                              +
                            </button>
                          </div>

                          <button
                            type="button"
                            className="cart-remove-link"
                            onClick={() => removeItem(item.id)}
                          >
                            <span>🗑️ Remove</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}

            {cartItems.length > 0 && (
              <div className="cart-actions-bar">
                <Link to="/products" className="cart-back-link">
                  <span>← {TEXTS.continueShopping[lang]}</span>
                </Link>
              </div>
            )}
          </div>

          {/* RIGHT: ORDER SUMMARY SIDEBAR */}
          <aside className="cart-summary-column">
            <div className="cart-summary-card">
              <div className="cart-summary-header">
                <img src={walletIcon} alt="Summary" className="cart-3d-icon-sm" />
                <h3 className="cart-summary-title">{TEXTS.summaryTitle[lang]}</h3>
              </div>

              {/* Promo Code Form */}
              <form onSubmit={handleApplyPromo} className="cart-promo-form">
                <div className="cart-promo-input-wrap">
                  <input
                    type="text"
                    placeholder="Enter promo (e.g. FRESH20)"
                    value={promoInput}
                    onChange={(e) => setPromoInput(e.target.value)}
                    disabled={promoApplied || cartItems.length === 0}
                    className="cart-promo-input"
                  />
                  <button
                    type="submit"
                    disabled={promoApplied || cartItems.length === 0 || !promoInput.trim()}
                    className="cart-promo-btn"
                  >
                    {promoApplied ? TEXTS.applied[lang] : TEXTS.apply[lang]}
                  </button>
                </div>
                {promoError && <p className="cart-promo-error">{promoError}</p>}
                {promoApplied && (
                  <div className="cart-promo-success">
                    <span>✓ Code active (-${promoDiscount.toFixed(2)})</span>
                    <button
                      type="button"
                      onClick={() => {
                        setPromoApplied(false)
                        setPromoDiscount(0)
                        setPromoInput('')
                      }}
                      className="cart-promo-remove"
                    >
                      ✕
                    </button>
                  </div>
                )}
              </form>

              {/* Price Breakdown */}
              <div className="cart-breakdown">
                <div className="cart-breakdown-row">
                  <span>{TEXTS.subtotal[lang]}</span>
                  <span className="cart-breakdown-val">${subtotal.toFixed(2)}</span>
                </div>

                <div className="cart-breakdown-row">
                  <span>{TEXTS.delivery[lang]}</span>
                  <span className={`cart-breakdown-val ${deliveryFee === 0 ? 'cart-val--free' : ''}`}>
                    {deliveryFee === 0 ? TEXTS.free[lang] : `$${deliveryFee.toFixed(2)}`}
                  </span>
                </div>

                {promoDiscount > 0 && (
                  <div className="cart-breakdown-row cart-row--discount">
                    <span>{TEXTS.discount[lang]}</span>
                    <span className="cart-breakdown-val">- ${promoDiscount.toFixed(2)}</span>
                  </div>
                )}

                <div className="cart-breakdown-divider" />

                <div className="cart-breakdown-row cart-row--total">
                  <span>{TEXTS.total[lang]}</span>
                  <span className="cart-total-amount">${finalTotal.toFixed(2)}</span>
                </div>
              </div>

              {/* Checkout Action */}
              <button
                type="button"
                className="cart-checkout-cta"
                disabled={cartItems.length === 0}
                onClick={() => {
                  alert(lang === 'en' ? 'Thank you! Order placed successfully with 45-minute delivery.' : 'សូមអរគុណ! ការបញ្ជាទិញរបស់អ្នកត្រូវបានទទួលជោគជ័យជាមួយការដឹកជញ្ជូន ៤៥ នាទី។')
                }}
              >
                <img src={flashIcon} alt="Pay" className="cart-btn-icon" />
                <span>{TEXTS.checkoutBtn[lang]}</span>
                <span>→</span>
              </button>

              {/* Trust Badge */}
              <div className="cart-trust-footer">
                <img src={shieldIcon} alt="Guarantee" className="cart-trust-icon" />
                <span>{TEXTS.secureBadge[lang]}</span>
              </div>
            </div>
          </aside>

        </div>

      </div>
    </div>
  )
}

export default Cart
