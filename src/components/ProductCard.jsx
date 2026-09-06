import { Link } from 'react-router-dom'
import { useLanguage } from '../context/LanguageContext'
import { formatPrice, formatSold, discountPct, catLabel, FALLBACK_IMG } from '../data/products'
import './ProductCard.css'

const TEXTS = {
  add: { en: 'Add', kh: 'បន្ថែម' },
  added: { en: 'Added', kh: 'បានបន្ថែម' },
  sold: { en: 'sold', kh: 'បានលក់' },
  view: { en: 'View details', kh: 'មើលលម្អិត' },
}

const StarRating = ({ rating }) => (
  <span className="pc-stars" aria-label={`${rating} / 5`}>
    {[1, 2, 3, 4, 5].map((i) => (
      <svg
        key={i}
        width="12"
        height="12"
        viewBox="0 0 24 24"
        fill={i <= Math.round(rating) ? 'currentColor' : 'none'}
        stroke="currentColor"
        strokeWidth="1.6"
        aria-hidden="true"
      >
        <path d="m12 2 2.9 6.6 7.1.6-5.4 4.7 1.6 7-6.2-3.8L6 21l1.6-7-5.4-4.7 7.1-.6L12 2Z" />
      </svg>
    ))}
  </span>
)

const HeartIcon = ({ filled }) => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill={filled ? 'currentColor' : 'none'}
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1-1.1a5.5 5.5 0 0 0-7.8 7.8l1 1L12 21l7.8-7.6 1-1a5.5 5.5 0 0 0 0-7.8Z" />
  </svg>
)

const CartPlusIcon = () => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <circle cx="9" cy="21" r="1" />
    <circle cx="20" cy="21" r="1" />
    <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
    <line x1="14" y1="3" x2="14" y2="9" />
    <line x1="11" y1="6" x2="17" y2="6" />
  </svg>
)

const CheckIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <polyline points="20 6 9 17 4 12" />
  </svg>
)

export const ProductCard = ({ product, onAdd, addedIds = new Set(), wishlist = new Set(), onWish, size = 'md' }) => {
  const { lang } = useLanguage()
  const cat = catLabel(product.category)
  const discount = discountPct(product.oldPrice, product.price)
  const isAdded = addedIds.has(product.id)
  const isWished = wishlist.has(product.id)

  return (
    <Link
      to="/product-detail"
      state={{ product }}
      className={`pc-link pc-${size}`}
      aria-label={`${product.name[lang]} — ${TEXTS.view[lang]}`}
    >
      <article className={`pc-card ${isAdded ? 'pc-card--added' : ''}`}>
        <div className="pc-media">
          <img
            src={product.image}
            alt={product.name[lang]}
            className="pc-img"
            loading="lazy"
            onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = FALLBACK_IMG }}
          />
          <div className="pc-media-shade" />
          <div className="pc-media-top">
            {product.badge && <span className="pc-badge">{product.badge[lang]}</span>}
            {discount > 0 && <span className="pc-discount">-{discount}%</span>}
          </div>
          <button
            type="button"
            className={`pc-wish ${isWished ? 'pc-wish--on' : ''}`}
            aria-pressed={isWished}
            aria-label={isWished ? 'Remove from wishlist' : 'Add to wishlist'}
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); onWish?.(product.id) }}
          >
            <HeartIcon filled={isWished} />
          </button>
          <button
            type="button"
            className={`pc-quickadd ${isAdded ? 'pc-quickadd--added' : ''}`}
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); onAdd?.(product) }}
          >
            {isAdded ? <CheckIcon /> : <CartPlusIcon />}
            <span>{isAdded ? TEXTS.added[lang] : TEXTS.add[lang]}</span>
          </button>
        </div>

        <div className="pc-body">
          <span className="pc-cat">{cat.icon} {cat[lang]}</span>
          <h3 className="pc-name">{product.name[lang]}</h3>
          <div className="pc-meta">
            <StarRating rating={product.rating} />
            <span className="pc-sold">{formatSold(product.sold)} {TEXTS.sold[lang]}</span>
          </div>
          <div className="pc-price-row">
            <span className="pc-price">{formatPrice(product.price)}</span>
            {product.oldPrice && (
              <span className="pc-old">{formatPrice(product.oldPrice)}</span>
            )}
            <span className="pc-unit">{product.unit[lang]}</span>
          </div>
        </div>
      </article>
    </Link>
  )
}

export default ProductCard
