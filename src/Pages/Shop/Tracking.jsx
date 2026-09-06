import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useLanguage } from '../../context/LanguageContext'
import { ORDERS, STEPS, STAGE_STEP, STATUS_LABEL, orderTotal } from '../../data/orders'
import { formatPrice, FALLBACK_IMG } from '../../data/products'

// 3D Icons
import mapPinIcon from '../../assets/icon/3dicons-map-pin-dynamic-color.png'
import rocketIcon from '../../assets/icon/3dicons-rocket-dynamic-color.png'
import shieldIcon from '../../assets/icon/3dicons-shield-dynamic-color.png'
import phoneIcon from '../../assets/icon/3dicons-call-in-dynamic-color.png'
import bagIcon from '../../assets/icon/3dicons-bag-dynamic-color.png'

import './Tracking.css'

const TEXTS = {
  eyebrow: { en: 'Real-Time Radar · 45-Min Express Dispatch', kh: 'ការតាមដានផ្ទាល់ · ដឹកជញ្ជូនរហ័ស ៤៥ នាទី' },
  title: { en: 'Live Delivery Tracking & Courier Radar', kh: 'តាមដានការដឹកជញ្ជូន និងទីតាំងអ្នកដឹក' },
  subtitle: {
    en: 'Watch your temperature-locked organic basket travel from our Chroy Changvar cold-hub directly to your doorstep in real time.',
    kh: 'តាមដានកន្ត្រកទំនិញស្រស់ៗរបស់អ្នកធ្វើដំណើរពីឃ្លាំងត្រជាក់ជ្រោយចង្វារដល់មាត់ទ្វារផ្ទះអ្នកផ្ទាល់។',
  },
  selectOrder: { en: 'Select Active Order', kh: 'ជ្រើសរើសការបញ្ជាទិញ' },
  orderRef: { en: 'Order Ref', kh: 'លេខកូដបញ្ជាទិញ' },
  placedOn: { en: 'Placed at', kh: 'បញ្ជាទិញនៅម៉ោង' },
  courierTitle: { en: 'Assigned Cold Fleet Courier', kh: 'អ្នកដឹកជញ្ជូនដែលបានចាត់តាំង' },
  vehicle: { en: 'Eco Electric Scooter', kh: 'ម៉ូតូអគ្គិសនីអេកូ' },
  callRider: { en: 'Call Courier', kh: 'ទាក់ទងអ្នកដឹក' },
  messageRider: { en: 'Telegram Message', kh: 'ផ្ញើសារ Telegram' },
  eta: { en: 'Estimated Doorstep Arrival', kh: 'ពេលមកដល់ប៉ាន់ស្មាន' },
  itemsTitle: { en: 'Basket Inventory', kh: 'ទំនិញក្នុងកន្ត្រក' },
  timelineTitle: { en: 'Live Dispatch Timeline', kh: 'ដំណើរការដឹកជញ្ជូន' },
  viewOrders: { en: 'Order History', kh: 'ប្រវត្តិបញ្ជាទិញ' },
  liveMap: { en: 'Live GPS Satellite Transit Route', kh: 'ផែនទី GPS តាមដានផ្ទាល់' },
  live: { en: 'LIVE RADAR', kh: 'ផ្ទាល់' },
  storeHub: { en: 'FreshMart Cold Hub (Chroy Changvar)', kh: 'ឃ្លាំងត្រជាក់ FreshMart (ជ្រោយចង្វារ)' },
  destination: { en: 'Your Address', kh: 'អាសយដ្ឋានរបស់អ្នក' },
  courierNear: { en: 'Rider is 800m away approaching destination', kh: 'អ្នកដឹកជញ្ជូននៅចម្ងាយ ៨០០ម ជិតមកដល់' },
  minLeft: { en: 'minutes remaining', kh: 'នាទីទៀត' },
  done: { en: 'Delivered Fresh ✓', kh: 'បានដឹកជញ្ជូនស្រស់ៗ ✓' },
}

const ROUTE = 'M 46 298 C 128 288 158 234 238 224 C 322 214 336 152 410 146 C 470 141 528 118 586 86'
const START = { x: 46, y: 298 }
const STAGE_TARGET = { processing: 0.45, transit: 0.88, delivered: 1 }

const LiveMap = ({ stage, courierName, lang }) => {
  const target = STAGE_TARGET[stage] || 0.5
  const [progress, setProgress] = useState(stage === 'delivered' ? 1 : 0)
  const [pos, setPos] = useState(START)
  const [len, setLen] = useState(0)
  const pathRef = useRef(null)

  useEffect(() => {
    let id
    const tick = () => {
      setProgress((p) => {
        if (p >= target) {
          window.clearInterval(id)
          return p
        }
        return Math.min(p + 0.004, target)
      })
    }
    id = window.setInterval(tick, 100)
    return () => window.clearInterval(id)
  }, [target])

  useEffect(() => {
    if (pathRef.current) {
      setLen(pathRef.current.getTotalLength())
    }
  }, [])

  useEffect(() => {
    const el = pathRef.current
    if (el) {
      const pt = el.getPointAtLength(progress * (len || el.getTotalLength()))
      setPos({ x: pt.x, y: pt.y })
    }
  }, [progress, len])

  const minsLeft = stage === 'delivered' ? 0 : Math.max(1, Math.ceil((target - progress) * 35))

  return (
    <div className="tr-map-card">
      <div className="tr-map-head">
        <div className="tr-map-title">
          <span className="tr-map-dot-pulse" />
          <span>{TEXTS.liveMap[lang]}</span>
        </div>
        <span className="tr-map-live-badge">
          <span>●</span> {TEXTS.live[lang]}
        </span>
      </div>

      <div className="tr-map-canvas-wrap">
        <svg viewBox="0 0 640 360" className="tr-map-svg" preserveAspectRatio="xMidYMid slice">
          {/* Background */}
          <rect width="640" height="360" fill="#1E2836" />

          {/* Grid lines */}
          {[60, 140, 220, 300].map((y) => (
            <line key={`h${y}`} x1="0" y1={y} x2="640" y2={y} stroke="#1A2432" strokeWidth="12" />
          ))}
          {[80, 200, 320, 440, 560].map((x) => (
            <line key={`v${x}`} x1={x} y1="0" x2={x} y2="360" stroke="#1A2432" strokeWidth="12" />
          ))}

          {/* City blocks */}
          {[
            [100, 15, 80, 35], [220, 15, 80, 35], [340, 15, 80, 35],
            [100, 80, 80, 45], [220, 80, 80, 45], [460, 80, 80, 45],
            [100, 160, 80, 45], [340, 160, 80, 45], [460, 160, 80, 45],
            [220, 245, 80, 40], [340, 245, 80, 40], [460, 245, 80, 40],
          ].map(([x, y, w, h], i) => (
            <rect key={i} x={x} y={y} width={w} height={h} fill="#141E2B" rx="8" />
          ))}

          {/* Mekong River curve accent */}
          <path d="M 0 340 Q 200 320 300 360" stroke="#00BCD422" strokeWidth="30" fill="none" />

          {/* Route path */}
          <path
            ref={pathRef}
            d={ROUTE}
            fill="none"
            stroke="#243447"
            strokeWidth="8"
            strokeLinecap="round"
          />
          <path
            d={ROUTE}
            fill="none"
            stroke="#77BC1F"
            strokeWidth="6"
            strokeDasharray={len || 600}
            strokeDashoffset={(len || 600) * (1 - progress)}
            strokeLinecap="round"
          />

          {/* Store Pin */}
          <g transform={`translate(${START.x}, ${START.y})`}>
            <circle r="14" fill="#77BC1F33" />
            <circle r="7" fill="#77BC1F" />
            <text x="14" y="5" fill="#A0C878" fontSize="11" fontWeight="800">
              {TEXTS.storeHub[lang].split(' ')[0]}
            </text>
          </g>

          {/* Home Pin */}
          <g transform="translate(586, 86)">
            <circle r="14" fill="#00BCD433" />
            <circle r="7" fill="#00BCD4" />
            <text x="-70" y="5" fill="#80DEEA" fontSize="11" fontWeight="800">
              {TEXTS.destination[lang]}
            </text>
          </g>

          {/* Moving Courier */}
          <g transform={`translate(${pos.x}, ${pos.y})`}>
            <circle r="18" fill="#77BC1F44">
              <animate attributeName="r" values="14;22;14" dur="2s" repeatCount="indefinite" />
            </circle>
            <circle r="10" fill="#77BC1F" stroke="#1E2836" strokeWidth="3" />
            <text x="14" y="-8" fill="#FFFFFF" fontSize="12" fontWeight="900" filter="drop-shadow(0 2px 4px rgba(0,0,0,0.8))">
              🛵 {courierName}
            </text>
          </g>
        </svg>

        {/* Floating ETA HUD */}
        <div className="tr-map-hud">
          <div className="tr-hud-eta">
            <span className="tr-hud-mins">{minsLeft}</span>
            <span className="tr-hud-lbl">{TEXTS.minLeft[lang]}</span>
          </div>
          <div className="tr-hud-info">
            <span className="tr-hud-near">{TEXTS.courierNear[lang]}</span>
            <span className="tr-hud-temp">❄️ Temperature Locked at 3.2°C</span>
          </div>
        </div>
      </div>
    </div>
  )
}

export const Tracking = () => {
  const { lang } = useLanguage()
  const location = useLocation()
  const passedId = location.state?.orderId

  const [selectedId, setSelectedId] = useState(passedId || ORDERS[0].id)
  const order = useMemo(() => ORDERS.find((o) => o.id === selectedId) || ORDERS[0], [selectedId])

  const total = orderTotal(order) + order.delivery.fee
  const activeStepIdx = STAGE_STEP[order.stage] || 1

  return (
    <div className="tracking-page">
      <div className="tracking-inner">

        {/* ── HERO BANNER ── */}
        <section className="tracking-hero">
          <span className="tracking-eyebrow">
            <img src={mapPinIcon} alt="Track" className="tracking-3d-micro" />
            <span>{TEXTS.eyebrow[lang]}</span>
          </span>

          <h1 className="tracking-title">{TEXTS.title[lang]}</h1>
          <p className="tracking-subtitle">{TEXTS.subtitle[lang]}</p>

          {/* Active Orders Switcher */}
          <div className="tracking-orders-bar">
            {ORDERS.map((o) => (
              <button
                key={o.id}
                type="button"
                className={`tr-order-pill ${selectedId === o.id ? 'tr-order-pill--on' : ''}`}
                onClick={() => setSelectedId(o.id)}
              >
                <span>#{o.id}</span>
                <span className="tr-order-pill-status">({STATUS_LABEL[o.stage][lang]})</span>
              </button>
            ))}
          </div>
        </section>

        {/* ── MAIN CONTENT GRID ── */}
        <div className="tracking-grid">

          {/* LEFT: MAP & TIMELINE */}
          <div className="tracking-main-col">
            <LiveMap
              stage={order.stage}
              courierName={order.rider.name}
              lang={lang}
            />

            {/* 4-Step Interactive Timeline */}
            <div className="tr-timeline-card">
              <div className="tr-timeline-head">
                <img src={rocketIcon} alt="Timeline" className="tr-3d-sm" />
                <h3 className="tr-timeline-title">{TEXTS.timelineTitle[lang]}</h3>
              </div>

              <div className="tr-timeline-steps">
                {STEPS.map((step, idx) => {
                  const stepNum = idx + 1
                  const isPassed = stepNum <= activeStepIdx
                  const isCurrent = stepNum === activeStepIdx

                  return (
                    <div
                      key={step.key}
                      className={`tr-step-node ${isPassed ? 'tr-step--passed' : ''} ${isCurrent ? 'tr-step--current' : ''}`}
                    >
                      <div className="tr-step-marker">
                        {isPassed ? <span>✓</span> : <span>{stepNum}</span>}
                      </div>
                      <div className="tr-step-text">
                        <h4 className="tr-step-name">{step[lang]}</h4>
                        <span className="tr-step-time">
                          {isCurrent ? '● Active Step' : isPassed ? 'Completed' : 'Pending'}
                        </span>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>

          {/* RIGHT: RIDER CARD & ORDER SUMMARY */}
          <aside className="tracking-sidebar-col">

            {/* Courier Card */}
            <div className="tr-courier-card">
              <div className="tr-courier-top">
                <div className="tr-courier-avatar">
                  <span>🛵</span>
                </div>
                <div>
                  <span className="tr-courier-tag">{TEXTS.courierTitle[lang]}</span>
                  <h3 className="tr-courier-name">{order.rider.name}</h3>
                  <div className="tr-courier-rating">
                    <span>★ {order.rider.rating || '4.9'}</span>
                    <span className="tr-courier-plate">· {order.rider.plate}</span>
                  </div>
                </div>
              </div>

              <div className="tr-courier-actions">
                <a href={`tel:${order.rider.phone}`} className="tr-btn-call">
                  <img src={phoneIcon} alt="Call" className="tr-btn-3d-icon" />
                  <span>{TEXTS.callRider[lang]}</span>
                </a>
                <a
                  href={`https://t.me/freshmart_dispatch`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="tr-btn-msg"
                >
                  <span>{TEXTS.messageRider[lang]}</span>
                </a>
              </div>
            </div>

            {/* Destination & Order Details */}
            <div className="tr-order-summary-card">
              <div className="tr-summary-head">
                <img src={bagIcon} alt="Items" className="tr-3d-sm" />
                <h4 className="tr-summary-title">{TEXTS.itemsTitle[lang]} ({order.items.length})</h4>
              </div>

              <div className="tr-items-list">
                {order.items.map((item, i) => (
                  <div key={i} className="tr-item-row">
                    <img
                      src={item.image}
                      alt={item.name[lang]}
                      onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = FALLBACK_IMG }}
                      className="tr-item-thumb"
                    />
                    <div className="tr-item-info">
                      <span className="tr-item-title">{item.name[lang]}</span>
                      <span className="tr-item-meta">x{item.qty} · ${Number(item.price).toFixed(2)}</span>
                    </div>
                    <span className="tr-item-price">${(Number(item.price) * item.qty).toFixed(2)}</span>
                  </div>
                ))}
              </div>

              <div className="tr-price-breakdown">
                <div className="tr-price-row">
                  <span>Subtotal</span>
                  <span>${orderTotal(order).toFixed(2)}</span>
                </div>
                <div className="tr-price-row">
                  <span>Cold Express Delivery</span>
                  <span className="tr-free-tag">${order.delivery.fee.toFixed(2)}</span>
                </div>
                <div className="tr-price-row tr-price-row--total">
                  <span>Total</span>
                  <span className="tr-total-val">${formatPrice(total)}</span>
                </div>
              </div>

              <div className="tr-dest-box">
                <div className="tr-dest-header">
                  <img src={shieldIcon} alt="Address" className="tr-dest-icon" />
                  <span>Delivery Address</span>
                </div>
                <p className="tr-dest-address">{order.delivery.address}</p>
                <span className="tr-dest-contact">Recipient: {order.delivery.recipient} ({order.delivery.phone})</span>
              </div>

              <Link to="/orders" className="tr-btn-back">
                <span>← {TEXTS.viewOrders[lang]}</span>
              </Link>
            </div>

          </aside>

        </div>

      </div>
    </div>
  )
}

export default Tracking