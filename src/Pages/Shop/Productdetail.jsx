import { useMemo, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useLanguage } from '../../context/LanguageContext'
import { useCart } from '../../context/CartContext'
import {
  PRODUCTS, REVIEWS, catLabel, getProduct,
  formatPrice, discountPct, buildGallery, FALLBACK_IMG,
} from '../../data/products'
import { ProductCard } from '../../components/ProductCard'

// 3D Icons
import leafIcon from '../../assets/icon/3dicons-leaf-dynamic-color.png'
import flashIcon from '../../assets/icon/3dicons-flash-dynamic-color.png'
import shieldIcon from '../../assets/icon/3dicons-shield-dynamic-color.png'
import bagIcon from '../../assets/icon/3dicons-bag-dynamic-color.png'
import starIcon from '../../assets/icon/3dicons-star-dynamic-color.png'
import medalIcon from '../../assets/icon/3dicons-medal-dynamic-color.png'

import './Productdetail.css'

const TEXTS = {
  home: { en: 'Home', kh: 'ទំព័រដើម' },
  products: { en: 'Store Products', kh: 'ផលិតផល' },
  inStock: { en: 'In Stock · Harvested Fresh Today', kh: 'មានក្នុងស្តុក · ប្រមូលផលស្រស់ថ្ងៃនេះ' },
  sold: { en: 'sold this month', kh: 'បានលក់ក្នុងខែនេះ' },
  quantity: { en: 'Quantity Selection', kh: 'ជ្រើសរើសចំនួន' },
  addToCart: { en: 'Add to Basket', kh: 'ដាក់ក្នុងកន្ត្រក' },
  added: { en: 'Added to Basket ✓', kh: 'បានបន្ថែមក្នុងកន្ត្រក ✓' },
  buyNow: { en: 'Instant Buy Now', kh: 'ទិញភ្លាមៗ' },
  delivery45: { en: '45-Min Sub-Zero Delivery', kh: 'ដឹកជញ្ជូនត្រជាក់ ៤៥ នាទី' },
  freshGuarantee: { en: '100% Freshness or Free Return', kh: 'ធានាភាពស្រស់ ១០០% ឬដូរវិញឥតគិតថ្លៃ' },
  organicCert: { en: 'Cambodian GAP Certified Farm', kh: 'កសិដ្ឋានបញ្ជាក់ស្តង់ដារ CamGAP' },
  tabDesc: { en: 'Product Story & Highlights', kh: 'ដំណើររឿង និងលក្ខណៈពិសេស' },
  tabDetails: { en: 'Storage & Specifications', kh: 'ការរក្សាទុក និងព័ត៌មានលម្អិត' },
  tabReviews: { en: 'Verified Reviews', kh: 'ការវាយតម្លៃអតិថិជន' },
  origin: { en: 'Farm Origin', kh: 'ប្រភពកសិដ្ឋាន' },
  storage: { en: 'Storage Temperature', kh: 'សីតុណ្ហភាពរក្សាទុក' },
  netWeight: { en: 'Net Package Weight', kh: 'ទម្ងន់សុទ្ធ' },
  category: { en: 'Product Category', kh: 'ប្រភេទផលិតផល' },
  unit: { en: 'Sales Unit', kh: 'ឯកតាលក់' },
  related: { en: 'Frequently Bought Together', kh: 'ទំនិញពេញនិយមទិញជាមួយគ្នា' },
  verified: { en: 'Verified FreshMart Customer', kh: 'អតិថិជនបានផ្ទៀងផ្ទាត់' },
}

const StarRow = ({ rating, size = 16 }) => (
  <span className="pd-stars" aria-label={`${rating} / 5`}>
    {[1, 2, 3, 4, 5].map((i) => (
      <svg
        key={i}
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill={i <= Math.round(rating) ? 'currentColor' : 'none'}
        stroke="currentColor"
        strokeWidth="1.5"
        aria-hidden="true"
      >
        <path d="m12 2 2.9 6.6 7.1.6-5.4 4.7 1.6 7-6.2-3.8L6 21l1.6-7-5.4-4.7 7.1-.6L12 2Z" />
      </svg>
    ))}
  </span>
)

export const Productdetail = () => {
  const { lang } = useLanguage()
  const location = useLocation()
  const product = location.state?.product || getProduct(1)

  return <ProductDetailView key={product.id} product={product} lang={lang} />
}

const ProductDetailView = ({ product, lang }) => {
  const { addToCart } = useCart()
  const [qty, setQty] = useState(1)
  const [imgIdx, setImgIdx] = useState(0)
  const [tab, setTab] = useState('desc')
  const [added, setAdded] = useState(false)

  const t = (k) => TEXTS[k][lang]
  const cat = catLabel(product.category)
  const discount = discountPct(product.oldPrice, product.price)
  const gallery = useMemo(() => buildGallery(product), [product])

  const productName = typeof product.name === 'object' ? product.name[lang] || product.name.en : product.name
  const productDesc = typeof product.desc === 'object' ? product.desc[lang] || product.desc.en : product.desc
  const productOrigin = typeof product.origin === 'object' ? product.origin[lang] || product.origin.en : product.origin || 'Kandal Province, Cambodia'
  const productUnit = typeof product.unit === 'object' ? product.unit[lang] || product.unit.en : product.unit || 'kg'
  const productWeight = product.weight || '500g'

  const reviews = useMemo(() => {
    const start = (Number(product.id) || 1) % REVIEWS.length
    return [0, 1, 2].map((i) => REVIEWS[(start + i) % REVIEWS.length])
  }, [product.id])

  const related = useMemo(() => {
    const same = PRODUCTS.filter((p) => p.category === product.category && p.id !== product.id)
    const others = PRODUCTS.filter((p) => p.category !== product.category)
    return [...same, ...others].slice(0, 4)
  }, [product.id, product.category])

  const handleAdd = () => {
    addToCart({ ...product, quantity: qty })
    setAdded(true)
    window.setTimeout(() => setAdded(false), 1600)
  }

  return (
    <div className="pd-page">
      <div className="pd-inner">

        {/* ── Breadcrumb ── */}
        <nav className="pd-breadcrumb" aria-label="Breadcrumb">
          <Link to="/">{t('home')}</Link>
          <span className="pd-crumb-sep">/</span>
          <Link to="/products">{t('products')}</Link>
          <span className="pd-crumb-sep">/</span>
          <span className="pd-crumb-current">{productName}</span>
        </nav>

        {/* ── Main Layout ── */}
        <div className="pd-layout">

          {/* LEFT: GALLERY */}
          <div className="pd-gallery">
            <div className="pd-gallery-main">
              <img
                src={gallery[imgIdx]}
                alt={productName}
                onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = FALLBACK_IMG }}
                className="pd-main-image"
              />
              {discount > 0 && <span className="pd-float-pct">-{discount}% OFF</span>}
              {product.badge && <span className="pd-float-badge">{typeof product.badge === 'object' ? product.badge[lang] : product.badge}</span>}
            </div>

            <div className="pd-thumbs">
              {gallery.map((g, i) => (
                <button
                  key={i}
                  type="button"
                  className={`pd-thumb ${i === imgIdx ? 'pd-thumb--on' : ''}`}
                  onClick={() => setImgIdx(i)}
                  aria-label={`View photo ${i + 1}`}
                >
                  <img src={g} alt="" loading="lazy" />
                </button>
              ))}
            </div>
          </div>

          {/* RIGHT: BUY BOX */}
          <div className="pd-buy-box">
            <div className="pd-header">
              <div className="pd-cat-badge">
                <img src={leafIcon} alt="Cat" className="pd-3d-micro" />
                <span>{cat[lang]}</span>
              </div>
              <h1 className="pd-title">{productName}</h1>

              <div className="pd-rating-strip">
                <StarRow rating={product.rating || 4.8} />
                <span className="pd-rating-val">{product.rating || 4.8}</span>
                <span className="pd-rating-count">({product.sold || 340}+ {t('sold')})</span>
              </div>

              <div className="pd-price-row">
                <span className="pd-price">{formatPrice(product.price)}</span>
                <span className="pd-unit-label">/ {productUnit}</span>
                {product.oldPrice && (
                  <s className="pd-price-old">{formatPrice(product.oldPrice)}</s>
                )}
              </div>

              <div className="pd-stock-pill">
                <span className="pd-stock-dot" />
                <span>{t('inStock')}</span>
              </div>
            </div>

            {/* Quantity Selector */}
            <div className="pd-qty-section">
              <span className="pd-qty-label">{t('quantity')}</span>
              <div className="pd-qty-row">
                <div className="pd-stepper">
                  <button
                    type="button"
                    onClick={() => setQty((q) => Math.max(1, q - 1))}
                    aria-label="Decrease"
                    className="pd-stepper-btn"
                  >
                    −
                  </button>
                  <span className="pd-stepper-num">{qty}</span>
                  <button
                    type="button"
                    onClick={() => setQty((q) => q + 1)}
                    aria-label="Increase"
                    className="pd-stepper-btn"
                  >
                    +
                  </button>
                </div>
                <span className="pd-calc-total">
                  = ${(Number(product.price) * qty).toFixed(2)}
                </span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="pd-action-buttons">
              <button
                type="button"
                className={`pd-btn-add ${added ? 'pd-btn-add--done' : ''}`}
                onClick={handleAdd}
              >
                <img src={bagIcon} alt="Bag" className="pd-btn-3d-icon" />
                <span>{added ? t('added') : t('addToCart')}</span>
              </button>

              <Link to="/cart" className="pd-btn-buy" onClick={() => addToCart({ ...product, quantity: qty })}>
                <img src={flashIcon} alt="Express" className="pd-btn-3d-icon" />
                <span>{t('buyNow')}</span>
              </Link>
            </div>

            {/* Feature Guarantees */}
            <div className="pd-guarantee-cards">
              <div className="pd-guarantee-card">
                <img src={flashIcon} alt="Speed" className="pd-guarantee-icon" />
                <div>
                  <h4>{t('delivery45')}</h4>
                  <p>Strict 4°C sub-zero insulated boxes for peak freshness.</p>
                </div>
              </div>

              <div className="pd-guarantee-card">
                <img src={shieldIcon} alt="Quality" className="pd-guarantee-icon" />
                <div>
                  <h4>{t('freshGuarantee')}</h4>
                  <p>Unhappy with crispness or taste? Instant replacement on the spot.</p>
                </div>
              </div>

              <div className="pd-guarantee-card">
                <img src={medalIcon} alt="Organic" className="pd-guarantee-icon" />
                <div>
                  <h4>{t('organicCert')}</h4>
                  <p>Sourced directly from verified GAP-certified growers in Cambodia.</p>
                </div>
              </div>
            </div>

          </div>

        </div>

        {/* ── TABS SECTION ── */}
        <section className="pd-tabs-section">
          <div className="pd-tab-bar" role="tablist">
            <button
              type="button"
              className={`pd-tab-btn ${tab === 'desc' ? 'pd-tab-btn--on' : ''}`}
              onClick={() => setTab('desc')}
            >
              <span>{t('tabDesc')}</span>
            </button>
            <button
              type="button"
              className={`pd-tab-btn ${tab === 'details' ? 'pd-tab-btn--on' : ''}`}
              onClick={() => setTab('details')}
            >
              <span>{t('tabDetails')}</span>
            </button>
            <button
              type="button"
              className={`pd-tab-btn ${tab === 'reviews' ? 'pd-tab-btn--on' : ''}`}
              onClick={() => setTab('reviews')}
            >
              <span>{t('tabReviews')} ({reviews.length})</span>
            </button>
          </div>

          <div className="pd-tab-content">
            {tab === 'desc' && (
              <div className="pd-tab-pane">
                <p className="pd-desc-lead">{productDesc}</p>
                <div className="pd-desc-highlights">
                  <div className="pd-highlight-item">
                    <span className="pd-hl-dot">🌱</span>
                    <span>Directly sourced at sunrise from partner farms to prevent nutrient loss.</span>
                  </div>
                  <div className="pd-highlight-item">
                    <span className="pd-hl-dot">💧</span>
                    <span>Washed with reverse-osmosis purified water and vacuum sealed.</span>
                  </div>
                  <div className="pd-highlight-item">
                    <span className="pd-hl-dot">🚚</span>
                    <span>Transported in refrigerated dispatch vans directly to Phnom Penh hubs.</span>
                  </div>
                </div>
              </div>
            )}

            {tab === 'details' && (
              <div className="pd-tab-pane pd-spec-grid">
                <div className="pd-spec-row">
                  <span className="pd-spec-k">{t('origin')}</span>
                  <span className="pd-spec-v">{productOrigin}</span>
                </div>
                <div className="pd-spec-row">
                  <span className="pd-spec-k">{t('storage')}</span>
                  <span className="pd-spec-v">2°C – 4°C in chiller compartment</span>
                </div>
                <div className="pd-spec-row">
                  <span className="pd-spec-k">{t('netWeight')}</span>
                  <span className="pd-spec-v">{productWeight}</span>
                </div>
                <div className="pd-spec-row">
                  <span className="pd-spec-k">{t('category')}</span>
                  <span className="pd-spec-v">{cat[lang]}</span>
                </div>
                <div className="pd-spec-row">
                  <span className="pd-spec-k">{t('unit')}</span>
                  <span className="pd-spec-v">1 {productUnit}</span>
                </div>
              </div>
            )}

            {tab === 'reviews' && (
              <div className="pd-tab-pane pd-reviews-list">
                {reviews.map((rev, idx) => (
                  <div key={idx} className="pd-review-card">
                    <div className="pd-rev-head">
                      <div>
                        <h4 className="pd-rev-author">{rev.author}</h4>
                        <span className="pd-rev-badge">✓ {t('verified')}</span>
                      </div>
                      <StarRow rating={rev.rating} size={14} />
                    </div>
                    <p className="pd-rev-comment">“{rev.comment}”</p>
                    <span className="pd-rev-date">{rev.date}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* ── RELATED PRODUCTS ── */}
        <section className="pd-related-section">
          <div className="pd-related-head">
            <img src={starIcon} alt="Related" className="pd-3d-sm" />
            <h2 className="pd-related-title">{t('related')}</h2>
          </div>
          <div className="pd-related-grid">
            {related.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </section>

      </div>
    </div>
  )
}

export default Productdetail
