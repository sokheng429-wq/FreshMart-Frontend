import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useLanguage } from '../../context/LanguageContext'
import { ORDERS, STATUS_LABEL, STAGE_STEP, STEPS, formatOrderDate, orderTotal } from '../../data/orders'
import { formatPrice, FALLBACK_IMG } from '../../data/products'

// 3D Icons
import clockIcon from '../../assets/icon/3dicons-clock-dynamic-color.png'
import flashIcon from '../../assets/icon/3dicons-flash-dynamic-color.png'
import rocketIcon from '../../assets/icon/3dicons-rocket-dynamic-color.png'
import bagIcon from '../../assets/icon/3dicons-bag-dynamic-color.png'
import shieldIcon from '../../assets/icon/3dicons-shield-dynamic-color.png'

import './OrderHistory.css'

const TEXTS = {
  eyebrow: { en: 'Personal Account · Order Tracking', kh: 'គណនីផ្ទាល់ខ្លួន · ការតាមដាន' },
  title: { en: 'My Order History & Live Dispatches', kh: 'ប្រវត្តិបញ្ជាទិញ និងការដឹកជញ្ជូន' },
  subtitle: {
    en: 'Real-time overview of your active cold-chain grocery dispatches, recent receipts, and 1-click reorder shortcuts.',
    kh: 'ទិដ្ឋភាពទូទៅនៃដំណើរការដឹកជញ្ជូនត្រជាក់ បង្កាន់ដៃទូទាត់ និងការបញ្ជាទិញឡើងវិញដោយចុច ១ ដង។',
  },
  all: { en: 'All Orders', kh: 'ទាំងអស់' },
  processing: { en: 'Chiller Packing', kh: 'កំពុងវេចខ្ចប់' },
  transit: { en: 'On The Way', kh: 'កំពុងមកដល់' },
  delivered: { en: 'Delivered', kh: 'បានដឹកជញ្ជូន' },
  orderNum: { en: 'Order Ref', kh: 'លេខបញ្ជាទិញ' },
  placed: { en: 'Placed on', kh: 'កាលបរិច្ឆេទ' },
  items: { en: 'Items', kh: 'មុខទំនិញ' },
  total: { en: 'Total Amount', kh: 'ទឹកប្រាក់សរុប' },
  track: { en: 'Track Live Rider', kh: 'តាមដានការដឹកផ្ទាល់' },
  reorder: { en: 'Buy Basket Again', kh: 'ទិញម្តងទៀត' },
  active: { en: 'Live Dispatches', kh: 'កំពុងដឹកជញ្ជូន' },
  eta: { en: 'Estimated ETA', kh: 'ពេលមកដល់' },
  noOrders: { en: 'No order history in this category.', kh: 'មិនទាន់មានប្រវត្តិបញ្ជាទិញក្នុងផ្នែកនេះទេ។' },
  noOrdersHint: { en: 'Choose a different filter pill or explore today’s fresh market harvest.', kh: 'ជ្រើសរើសតម្រងផ្សេង ឬចូលមើលទីផ្សារស្រស់ៗ។' },
  browse: { en: 'Browse Fresh Market', kh: 'ទិញទំនិញឥឡូវនេះ' },
}

const FILTERS = [
  { key: 'all', text: 'all' },
  { key: 'processing', text: 'processing' },
  { key: 'transit', text: 'transit' },
  { key: 'delivered', text: 'delivered' },
]

const stagePercent = (stage) => Math.round((STAGE_STEP[stage] / STEPS.length) * 100)

const ProgressRing = ({ percent, label }) => {
  const radius = 18
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (percent / 100) * circumference

  return (
    <span className="oh-ring" aria-label={`${label} ${percent}%`}>
      <svg viewBox="0 0 44 44" aria-hidden="true">
        <circle className="oh-ring-track" cx="22" cy="22" r={radius} />
        <circle
          className="oh-ring-fill"
          cx="22"
          cy="22"
          r={radius}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
        />
      </svg>
      <span className="oh-ring-text">{percent}%</span>
    </span>
  )
}

export const OrderHistory = () => {
  const { lang } = useLanguage()
  const [filter, setFilter] = useState('all')

  const stats = useMemo(() => ({
    all: ORDERS.length,
    processing: ORDERS.filter((o) => o.stage === 'processing').length,
    transit: ORDERS.filter((o) => o.stage === 'transit').length,
    delivered: ORDERS.filter((o) => o.stage === 'delivered').length,
  }), [])

  const filtered = filter === 'all' ? ORDERS : ORDERS.filter((o) => o.stage === filter)
  const activeOrders = ORDERS.filter((o) => o.stage !== 'delivered').length

  return (
    <div className="oh-page">
      {/* ── HERO BANNER ── */}
      <section className="oh-hero">
        <div className="oh-hero-inner">
          <div className="oh-copy">
            <span className="oh-eyebrow">
              <img src={clockIcon} alt="History" className="oh-3d-micro" />
              <span>{TEXTS.eyebrow[lang]}</span>
            </span>
            <h1 className="oh-title">{TEXTS.title[lang]}</h1>
            <p className="oh-subtitle">{TEXTS.subtitle[lang]}</p>
          </div>

          <div className="oh-hero-ticket">
            <div className="oh-ticket-icon-box">
              <img src={flashIcon} alt="Active" className="oh-ticket-3d-icon" />
            </div>
            <div>
              <span className="oh-ticket-label">{TEXTS.active[lang]}</span>
              <strong className="oh-ticket-number">{activeOrders}</strong>
              <span className="oh-ticket-note">{stats.processing} Packing · {stats.transit} On Route</span>
            </div>
          </div>
        </div>
      </section>

      <main className="oh-inner">
        {/* ── FILTER TABS ── */}
        <div className="oh-filters-bar" role="tablist" aria-label="Order status">
          {FILTERS.map((f) => (
            <button
              key={f.key}
              type="button"
              role="tab"
              aria-selected={filter === f.key}
              className={`oh-filter-pill ${filter === f.key ? 'oh-filter-pill--active' : ''}`}
              onClick={() => setFilter(f.key)}
            >
              <span>{TEXTS[f.text][lang]}</span>
              <span className="oh-filter-count">{stats[f.key]}</span>
            </button>
          ))}
        </div>

        {/* ── ORDERS LIST ── */}
        {filtered.length === 0 ? (
          <div className="oh-empty-card">
            <img src={bagIcon} alt="Empty" className="oh-empty-3d-img" />
            <h3 className="oh-empty-title">{TEXTS.noOrders[lang]}</h3>
            <p className="oh-empty-hint">{TEXTS.noOrdersHint[lang]}</p>
            <Link to="/products" className="oh-empty-btn">
              <span>{TEXTS.browse[lang]}</span>
              <span>→</span>
            </Link>
          </div>
        ) : (
          <div className="oh-list">
            {filtered.map((order) => {
              const total = orderTotal(order) + order.delivery.fee
              const percent = stagePercent(order.stage)
              const isActive = order.stage !== 'delivered'
              const previewItems = order.items.slice(0, 3)
              const extraItems = order.items.length - previewItems.length

              return (
                <article className={`oh-card ${isActive ? 'oh-card--active' : ''}`} key={order.id}>
                  <div className="oh-card-header">
                    <div className="oh-card-header-left">
                      <ProgressRing percent={percent} label={STATUS_LABEL[order.stage][lang]} />
                      <div>
                        <div className="oh-card-title-row">
                          <h3 className="oh-order-code">#{order.id}</h3>
                          <span className={`oh-status-tag oh-status-tag--${order.stage}`}>
                            {STATUS_LABEL[order.stage][lang]}
                          </span>
                          {isActive && <span className="oh-live-pulse-tag">● LIVE</span>}
                        </div>
                        <span className="oh-order-date">
                          {TEXTS.placed[lang]}: {formatOrderDate(order.date, lang)}
                        </span>
                      </div>
                    </div>

                    <div className="oh-card-header-right">
                      <span className="oh-total-label">{TEXTS.total[lang]}</span>
                      <strong className="oh-total-amount">${formatPrice(total).slice(1)}</strong>
                    </div>
                  </div>

                  <div className="oh-card-body">
                    {/* Items preview */}
                    <div className="oh-items-preview">
                      {previewItems.map((item, idx) => (
                        <div key={idx} className="oh-item-chip">
                          <img
                            src={item.image}
                            alt={item.name[lang]}
                            onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = FALLBACK_IMG }}
                            className="oh-item-img"
                          />
                          <span className="oh-item-name">{item.name[lang]}</span>
                          <span className="oh-item-qty">x{item.qty}</span>
                        </div>
                      ))}
                      {extraItems > 0 && (
                        <span className="oh-extra-count">+{extraItems} more</span>
                      )}
                    </div>

                    {/* ETA or Delivery Note */}
                    <div className="oh-delivery-info">
                      {isActive ? (
                        <div className="oh-eta-box">
                          <img src={flashIcon} alt="ETA" className="oh-eta-icon" />
                          <span><strong>{TEXTS.eta[lang]}:</strong> {order.eta[lang] || '45 mins'}</span>
                        </div>
                      ) : (
                        <div className="oh-delivered-box">
                          <img src={shieldIcon} alt="Done" className="oh-done-icon" />
                          <span>Delivered to {order.delivery.address}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="oh-card-footer">
                    <div className="oh-rider-brief">
                      <span>Rider: <strong>{order.rider.name}</strong> ({order.rider.phone})</span>
                    </div>

                    <div className="oh-footer-actions">
                      <Link to="/products" className="oh-btn-reorder">
                        <span>{TEXTS.reorder[lang]}</span>
                      </Link>

                      {isActive && (
                        <Link to="/tracking" state={{ orderId: order.id }} className="oh-btn-track">
                          <img src={rocketIcon} alt="Track" className="oh-btn-3d-micro" />
                          <span>{TEXTS.track[lang]}</span>
                          <span>→</span>
                        </Link>
                      )}
                    </div>
                  </div>
                </article>
              )
            })}
          </div>
        )}
      </main>
    </div>
  )
}

export default OrderHistory
