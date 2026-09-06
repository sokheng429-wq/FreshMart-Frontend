import { useEffect, useRef, useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { useLanguage } from '../../context/LanguageContext'
import { useCart } from '../../context/CartContext'
import { PRODUCTS, formatPrice } from '../../data/products'

// Main photo assets
import homeHero2 from '../../assets/Home.png'
import career from '../../assets/Career.png'
import inside from '../../assets/inside.png'
import farmInside from '../../assets/inside.png'

// Avatars for real customer stories
import avatarProfile from '../../assets/Profile.avif'

// 3D Dynamic Icons
import leafIcon from '../../assets/icon/3dicons-leaf-dynamic-color.png'
import flashIcon from '../../assets/icon/3dicons-flash-dynamic-color.png'
import shieldIcon from '../../assets/icon/3dicons-shield-dynamic-color.png'
import heartIcon from '../../assets/icon/3dicons-heart-dynamic-color.png'
import starIcon from '../../assets/icon/3dicons-star-dynamic-color.png'
import clockIcon from '../../assets/icon/3dicons-clock-dynamic-color.png'
import mapPinIcon from '../../assets/icon/3dicons-map-pin-dynamic-color.png'
import bagIcon from '../../assets/icon/3dicons-bag-dynamic-color.png'
import walletIcon from '../../assets/icon/3dicons-wallet-dynamic-color.png'
import trophyIcon from '../../assets/icon/3dicons-trophy-dynamic-color.png'
import rocketIcon from '../../assets/icon/3dicons-rocket-dynamic-color.png'
import chatIcon from '../../assets/icon/3dicons-chat-bubble-dynamic-color.png'
import canIcon from '../../assets/icon/3dicons-can-dynamic-color.png'
import cupIcon from '../../assets/icon/3dicons-tea-cup-dynamic-color.png'
import sunIcon from '../../assets/icon/3dicons-sun-dynamic-color.png'
import fireIcon from '../../assets/icon/3dicons-fire-dynamic-color.png'
import bellIcon from '../../assets/icon/3dicons-bell-dynamic-color.png'
import thumbUpIcon from '../../assets/icon/3dicons-thumb-up-dynamic-color.png'

import './Home.css'

const HERO_SLIDES = [
  { img: homeHero2, tag: 'BKK1 Flagship Market', time: '5:00 AM Harvest Batch' },
  { img: farmInside, tag: 'Chroy Changvar Hub', time: 'Direct Cold-Chain Inflow' },
  { img: inside, tag: 'Central Temperature Vault', time: 'Strict 4°C Freshness Control' },
  { img: career, tag: 'Eco Delivery Fleet', time: 'Express Doorstep Couriers' },
]

const CATEGORY_CARDS = [
  { id: 'veggies', name: { en: 'Organic Veggies', kh: 'បន្លែសរីរាង្គ' }, count: { en: '45+ Items', kh: '៤៥+ មុខ' }, icon: leafIcon, link: '/products?cat=fruits', color: '#77BC1F' },
  { id: 'fruits', name: { en: 'Sun-Ripened Fruits', kh: 'ផ្លែឈើស្រស់ៗ' }, count: { en: '30+ Items', kh: '៣០+ មុខ' }, icon: sunIcon, link: '/products?cat=fruits', color: '#FF9900' },
  { id: 'meat', name: { en: 'Grass-Fed Meat', kh: 'សាច់ស្រស់គុណភាពខ្ពស់' }, count: { en: '25+ Items', kh: '២៥+ មុខ' }, icon: fireIcon, link: '/products?cat=meat', color: '#FF5722' },
  { id: 'seafood', name: { en: 'Wild Catch Seafood', kh: 'គ្រឿងសមុទ្រស្រស់' }, count: { en: '20+ Items', kh: '២០+ មុខ' }, icon: shieldIcon, link: '/products?cat=meat', color: '#00BCD4' },
  { id: 'bakery', name: { en: 'Artisan Bakery', kh: 'នំបុ័ងធ្វើថ្មីៗ' }, count: { en: '18+ Items', kh: '១៨+ មុខ' }, icon: cupIcon, link: '/products?cat=bakery', color: '#E91E63' },
  { id: 'drinks', name: { en: 'Cold Beverages', kh: 'ភេសជ្ជៈត្រជាក់' }, count: { en: '35+ Items', kh: '៣៥+ មុខ' }, icon: canIcon, link: '/products?cat=drinks', color: '#9C27B0' },
]

const COLD_CHAIN_STAGES = [
  {
    step: '01',
    time: '05:00 AM',
    title: { en: 'Sunrise Harvest', kh: 'ប្រមូលផលពេលព្រឹកព្រលឹម' },
    desc: { en: 'Picked at dawn by 200+ partner farmers in Kandal, Kampot & Battambang for peak sugar & crispness.', kh: 'ប្រមូលផលនៅព្រឹកព្រលឹមដោយកសិករដៃគូជាង ២០០ នាក់នៅកណ្តាល កំពត និងបាត់ដំបង ដើម្បីទទួលបានជាតិស្ករនិងភាពស្រួយល្អបំផុត។' },
    origin: { en: 'Kandal & Kampot Farms', kh: 'កសិដ្ឋានកណ្តាល និងកំពត' },
    icon: sunIcon,
    metric: '100% Organic Certified',
  },
  {
    step: '02',
    time: '07:00 AM',
    title: { en: '4°C Cold-Chain Sort', kh: 'ត្រួតពិនិត្យ និងវេចខ្ចប់នៅ ៤°C' },
    desc: { en: 'Strict zero-heat handling in insulated totes with reusable iced gel packs to lock in vitamins.', kh: 'វេចខ្ចប់ដោយប្រុងប្រយ័ត្នក្នុងប្រអប់រក្សាសីតុណ្ហភាពជាមួយកញ្ចប់ជែលត្រជាក់ ដើម្បីរក្សាទុកវីតាមីន។' },
    origin: { en: 'Central Cold Hub Phnom Penh', kh: 'ឃ្លាំងត្រជាក់កណ្តាលភ្នំពេញ' },
    icon: shieldIcon,
    metric: '4.0°C Constant Temp',
  },
  {
    step: '03',
    time: '08:00 AM',
    title: { en: '45-Min Express Dispatch', kh: 'ដឹកជញ្ជូនរហ័ស ៤៥ នាទី' },
    desc: { en: 'Electric motor couriers navigate every city district with real-time temperature telemetry.', kh: 'ក្រុមដឹកជញ្ជូនតាមម៉ូតូអគ្គិសនី បម្រើសេវាគ្រប់ខណ្ឌក្នុងក្រុង ជាមួយប្រព័ន្ធតាមដានសីតុណ្ហភាពផ្ទាល់។' },
    origin: { en: '25 City Hubs Active', kh: 'ដំណើរការទូទាំងរាជធានី-ខេត្ត' },
    icon: flashIcon,
    metric: 'Avg 32 Mins Delivery',
  },
  {
    step: '04',
    time: '08:45 AM',
    title: { en: 'Freshness or 100% Free', kh: 'ធានាភាពស្រស់ ឬឥតគិតថ្លៃ' },
    desc: { en: 'Inspect at your door. If anything is less than garden-crisp, tap once for an instant refund.', kh: 'ពិនិត្យទំនិញនៅមាត់ទ្វារ។ បើផលិតផលណាមួយមិនស្រស់ស្អាត ១០០% ចុចប្តូរប្រាក់វិញភ្លាមៗ។' },
    origin: { en: 'Your Kitchen Table', kh: 'ផ្ទាល់ដល់ផ្ទះបាយអ្នក' },
    icon: heartIcon,
    metric: 'Zero-Risk Guarantee',
  },
]

const STATS_DATA = [
  { val: '50K+', label: { en: 'Happy Families Served', kh: 'គ្រួសារទទួលការបម្រើ' }, sub: { en: 'Across 25 Provinces', kh: 'ទូទាំង ២៥ រាជធានី-ខេត្ត' }, icon: bagIcon },
  { val: '200+', label: { en: 'Local Farm Partners', kh: 'កសិករដៃគូក្នុងស្រុក' }, sub: { en: 'Fair-Trade Guaranteed', kh: 'ធានាតម្លៃយុត្តិធម៌' }, icon: mapPinIcon },
  { val: '45m', label: { en: 'Avg Express Delivery', kh: 'រយៈពេលដឹកជញ្ជូនជាមធ្យម' }, sub: { en: 'Cold-Chain Protected', kh: 'រក្សាសីតុណ្ហភាពត្រជាក់' }, icon: flashIcon },
  { val: '99.4%', label: { en: '5-Star Freshness Rating', kh: 'ការវាយតម្លៃភាពស្រស់ ៥ ផ្កាយ' }, sub: { en: 'From 12,000+ Reviews', kh: 'ពីការវាយតម្លៃជាង ១២,០០០+' }, icon: starIcon },
]

const REVIEWS_DATA = [
  {
    name: 'Sokheng Chea',
    location: 'Toul Kork, Phnom Penh',
    avatar: avatarProfile,
    tag: { en: 'Weekly Organic Box', kh: 'កញ្ចប់បន្លែសរីរាង្គប្រចាំសប្តាហ៍' },
    stars: 5,
    text: {
      en: 'The crispness of the morning kale and tomatoes is unreal. Delivered in under 35 minutes in an insulated cold box. Far superior to ordinary supermarket produce!',
      kh: 'បន្លែស្ពៃក្តោប និងប៉េងប៉ោះស្រស់ខ្លាំងដូចបេះពីចម្ការផ្ទាល់។ ដឹកដល់ក្នុងរយៈពេល ៣៥ នាទីក្នុងប្រអប់ត្រជាក់។ ល្អជាងទិញនៅផ្សារធម្មតាឆ្ងាយណាស់!',
    },
  },
  {
    name: 'Vannak Heng',
    location: 'BKK1, Phnom Penh',
    avatar: avatarProfile,
    tag: { en: 'Daily Fresh Fruit Basket', kh: 'កន្ត្រកផ្លែឈើស្រស់ប្រចាំថ្ងៃ' },
    stars: 5,
    text: {
      en: 'Knowing our grocery money goes directly to smallholder farmers in Kampot and Battambang feels great. The mangoes and strawberries were immaculate.',
      kh: 'មានអារម្មណ៍រីករាយដែលដឹងថាប្រាក់ទិញម្ហូបរបស់យើងបានទៅដល់ដៃកសិករនៅកំពតនិងបាត់ដំបងផ្ទាល់។ ផ្លែស្វាយ និងស្ត្របឺរីផ្អែមឆ្ងាញ់ឥតទាស់!',
    },
  },
  {
    name: 'Sophanith Poul',
    location: 'Daun Penh, Phnom Penh',
    avatar: avatarProfile,
    tag: { en: 'Grass-Fed Meat & Seafood', kh: 'សាច់ស្រស់ និងគ្រឿងសមុទ្រ' },
    stars: 5,
    text: {
      en: 'The freshness guarantee gives complete peace of mind. One time an avocado was slightly bruised, and support refunded it in under 60 seconds. Best app in Cambodia!',
      kh: 'ការធានាភាពស្រស់ធ្វើឱ្យខ្ញុំទុកចិត្ត ១០០%។ ធ្លាប់មានម្តងផ្លែបឺរមានស្នាមតិចតួច ក្រុមការងារបានបង្វិលប្រាក់វិញក្នុងរយៈពេល ៦០ វិនាទី។ ជាសេវាកម្មល្អបំផុតនៅកម្ពុជា!',
    },
  },
  {
    name: 'Channak Mean',
    location: 'Siem Reap Central',
    avatar: avatarProfile,
    tag: { en: 'Family Weekly Essentials', kh: 'គ្រឿងទេសគ្រួសារប្រចាំសប្តាហ៍' },
    stars: 5,
    text: {
      en: 'We order twice a week for our entire family. The cold-chain delivery maintains exact temperature even on hottest afternoons. Highly recommended!',
      kh: 'គ្រួសារខ្ញុំកុម្ម៉ង់ ២ ដងក្នុងមួយសប្តាហ៍។ ការដឹកជញ្ជូនរក្សាភាពត្រជាក់បានល្អឥតខ្ចោះ សូម្បីតែនៅពេលថ្ងៃក្តៅខ្លាំង។ ពិតជាសូមណែនាំ!',
    },
  },
]

const FAQS_DATA = [
  {
    q: { en: 'How do you keep vegetables crisp in 35°C Cambodian weather?', kh: 'តើធ្វើដូចម្តេចដើម្បីរក្សាបន្លែឱ្យនៅស្រស់ក្នុងអាកាសធាតុក្តៅ ៣៥°C នៅកម្ពុជា?' },
    a: { en: 'Every order is packed inside multi-layered thermal-insulated totes equipped with sub-zero reusable food-grade ice packs. Our couriers monitor temperatures throughout the 45-minute transit to keep items at a constant 4°C.', kh: 'រាល់ការកុម្ម៉ង់ត្រូវបានវេចខ្ចប់ក្នុងកាបូបរក្សាកម្ដៅពហុស្រទាប់ រួមជាមួយកញ្ចប់ជែលត្រជាក់។ អ្នកដឹកជញ្ជូនតាមដានសីតុណ្ហភាពជាប្រចាំ ដើម្បីធានាថារក្សាបាន ៤°C ជាប់ជានិច្ចក្នុងរយៈពេល ៤៥ នាទី។' },
  },
  {
    q: { en: 'Where do your organic fruits and vegetables come from?', kh: 'តើបន្លែនិងផ្លែឈើសរីរាង្គរបស់អ្នកមានប្រភពមកពីណា?' },
    a: { en: 'We partner directly with over 200 certified family farms across Kandal, Kampot, Battambang, and Mondulkiri. Produce is harvested at 5:00 AM every single morning without harmful chemical pesticides.', kh: 'យើងសហការផ្ទាល់ជាមួយកសិដ្ឋានគ្រួសារជាង ២០០ នៅខេត្តកណ្តាល កំពត បាត់ដំបង និងមណ្ឌលគិរី។ ផលិតផលត្រូវបានប្រមូលផលនៅម៉ោង ៥:០០ ព្រឹកជារៀងរាល់ថ្ងៃ ដោយគ្មានថ្នាំគីមីពុល។' },
  },
  {
    q: { en: 'What is your "Freshness or 100% Free" guarantee policy?', kh: 'តើគោលការណ៍ "ធានាភាពស្រស់ ឬឥតគិតថ្លៃ ១០០%" មានលក្ខខណ្ឌដូចម្តេច?' },
    a: { en: 'If any fruit, vegetable, meat, or bakery item arrives less than completely fresh or damaged, you can tap "Report Issue" in your order for an instant 100% refund or free replacement within 60 minutes.', kh: 'ប្រសិនបើផ្លែឈើ បន្លែ សាច់ ឬនំប៉័ងណាមួយមកដល់មិនស្រស់ស្អាត ឬមានការខូចខាត លោកអ្នកគ្រាន់តែចុច "រាយការណ៍បញ្ហា" នឹងទទួលបានការបង្វិលប្រាក់ ១០០% ភ្លាមៗ ឬប្តូរថ្មីក្នុងរយៈពេល ៦០ នាទី។' },
  },
  {
    q: { en: 'What areas do you currently cover for 45-minute express delivery?', kh: 'តើតំបន់ណាខ្លះដែលទទួលបានការដឹកជញ្ជូនរហ័ស ៤៥ នាទី?' },
    a: { en: 'We offer express 45-minute delivery across all central Phnom Penh districts (BKK, Daun Penh, Toul Kork, Chamkarmon, Sen Sok, Chroy Changvar) and same-day morning/afternoon slots across all other 24 provinces.', kh: 'យើងដឹកជញ្ជូនរហ័ស ៤៥ នាទីទូទាំងខណ្ឌកណ្តាលនៃរាជធានីភ្នំពេញ (បឹងកេងកង ដូនពេញ ទួលគោក ចំការមន សែនសុខ ជ្រោយចង្វារ) និងសេវាដឹកជញ្ជូនក្នុងថ្ងៃតែមួយសម្រាប់បណ្តាខេត្តទាំង ២៤ ផ្សេងទៀត។' },
  },
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
      { threshold: 0.15, rootMargin: '0px 0px -40px 0px' }
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
    const dur = 1400
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

export const Home = () => {
  const { lang } = useLanguage()
  const { addToCart } = useCart()

  const [slideIndex, setSlideIndex] = useState(0)
  const [selectedDropCat, setSelectedDropCat] = useState('fruits')
  const [activeStage, setActiveStage] = useState(0)
  const [openFaq, setOpenFaq] = useState(0)
  const [addedItemIds, setAddedItemIds] = useState(new Set())

  // Slideshow auto loop
  useEffect(() => {
    const timer = setInterval(() => {
      setSlideIndex((prev) => (prev + 1) % HERO_SLIDES.length)
    }, 6000)
    return () => clearInterval(timer)
  }, [])

  // Filter curated products for "Today's Farm Drop"
  const dropProducts = useMemo(() => {
    if (!PRODUCTS || PRODUCTS.length === 0) return []
    return PRODUCTS.filter((p) => p.category === selectedDropCat).slice(0, 4)
  }, [selectedDropCat])

  const handleQuickAdd = (e, product) => {
    e.preventDefault()
    e.stopPropagation()
    addToCart(product)
    setAddedItemIds((prev) => new Set(prev).add(product.id))
    setTimeout(() => {
      setAddedItemIds((prev) => {
        const next = new Set(prev)
        next.delete(product.id)
        return next
      })
    }, 1800)
  }

  return (
    <div className="home-page">

      {/* ===== 1. LIVE COLD-CHAIN TICKER BAR ===== */}
      <div className="home-top-ticker">
        <div className="home-top-ticker-inner">
          <div className="home-ticker-pill">
            <span className="home-ticker-live-dot" />
            <span className="home-ticker-bold">{lang === 'en' ? 'LIVE COLD HUB' : 'មជ្ឈមណ្ឌលត្រជាក់'}</span>
          </div>
          <p className="home-ticker-text">
            {lang === 'en'
              ? 'Morning harvest batch #KDL-042 active • 4°C temperature locked • 45-min express dispatch in Phnom Penh'
              : 'ការប្រមូលផលពេលព្រឹក កញ្ចប់ #KDL-042 កំពុងដំណើរការ • រក្សាសីតុណ្ហភាព ៤°C • ដឹកជញ្ជូន ៤៥ នាទីនៅភ្នំពេញ'}
          </p>
          <Link to="/products" className="home-ticker-link">
            <span>{lang === 'en' ? 'Order Fresh' : 'កុម្ម៉ង់ឥឡូវនេះ'}</span>
            <span className="home-ticker-arrow">→</span>
          </Link>
        </div>
      </div>

      {/* ===== 2. HERO SECTION ===== */}
      <section className="home-hero">
        <div className="home-hero-glow-green" />
        <div className="home-hero-glow-orange" />

        {/* Full-bleed background slideshow */}
        <div className="home-hero-slides-bg">
          {HERO_SLIDES.map((slide, i) => (
            <div
              key={i}
              className={`home-hero-slide-wrap ${i === slideIndex ? 'home-hero-slide--active' : ''}`}
            >
              <img
                src={slide.img}
                alt={`FreshMart slide ${i + 1}`}
                className="home-hero-slide"
              />
            </div>
          ))}
        </div>

        {/* Hero Main Content */}
        <div className="home-hero-inner">
          <div className="home-hero-grid">

            {/* Left Copy Column */}
            <div className="home-hero-copy">
              <div className="home-hero-badge-row">
                <span className="home-hero-eyebrow">
                  <img src={leafIcon} alt="Leaf" className="home-eyebrow-3d-icon" />
                  <span>{lang === 'en' ? "Cambodia's #1 Farm-to-Table Platform" : 'វេទិកាគ្រឿងទេសពីកសិដ្ឋានលេខ១ នៅកម្ពុជា'}</span>
                </span>
                <span className="home-hero-live-badge">
                  <span className="home-live-pulse" />
                  <span>{lang === 'en' ? '200+ Active Farms' : 'កសិដ្ឋានដៃគូ ២០០+'}</span>
                </span>
              </div>

              <h1 className="home-hero-title">
                {lang === 'en' ? (
                  <>
                    FRESH HARVEST, <br />
                    <span className="home-hero-title-highlight">DELIVERED IN 45 MINS</span>
                  </>
                ) : (
                  <>
                    គ្រឿងទេសស្រស់ៗពីចម្ការ <br />
                    <span className="home-hero-title-highlight">ដឹកជញ្ជូនដល់ផ្ទះក្នុង ៤៥ នាទី</span>
                  </>
                )}
              </h1>

              <p className="home-hero-sub">
                {lang === 'en'
                  ? 'Connecting over 200 family farms in Kandal, Kampot & Battambang direct to your kitchen. 100% cold-chain protected with money-back freshness guarantee.'
                  : 'ភ្ជាប់ផ្ទាល់កសិករជាង ២០០ គ្រួសារនៅកណ្តាល កំពត និងបាត់ដំបង ត្រង់ទៅកាន់ផ្ទះបាយអ្នក។ រក្សាសីតុណ្ហភាពត្រជាក់ ១០០% ជាមួយការធានាភាពស្រស់ស្អាត។'}
              </p>

              {/* Action Buttons */}
              <div className="home-hero-cta-wrapper">
                <div className="home-hero-cta-buttons">
                  <Link to="/products" className="home-btn-shop">
                    <img src={bagIcon} alt="Cart" className="home-btn-3d-icon" />
                    <span>{lang === 'en' ? 'Shop Fresh Today' : 'ចាប់ផ្តើមទិញឥឡូវ'}</span>
                    <span className="home-btn-chevron">→</span>
                  </Link>
                  <Link to="/about" className="home-btn-contact">
                    <img src={mapPinIcon} alt="Farm" className="home-btn-3d-icon" />
                    <span>{lang === 'en' ? 'Our Farm Partners' : 'ស្វែងយល់ពីកសិដ្ឋាន'}</span>
                    <span className="home-btn-chevron">→</span>
                  </Link>
                </div>
              </div>

              {/* Quick Trust Chips with 3D Icons */}
              <div className="home-hero-feature-chips">
                <div className="home-feature-chip">
                  <img src={flashIcon} alt="Speed" className="home-chip-icon" />
                  <div>
                    <strong>45m Express</strong>
                    <span>{lang === 'en' ? 'Doorstep drop' : 'ដឹកដល់មាត់ទ្វារ'}</span>
                  </div>
                </div>
                <div className="home-feature-chip">
                  <img src={shieldIcon} alt="Shield" className="home-chip-icon" />
                  <div>
                    <strong>4°C Cold Chain</strong>
                    <span>{lang === 'en' ? 'Crispness locked' : 'រក្សាភាពស្រស់'}</span>
                  </div>
                </div>
                <div className="home-feature-chip">
                  <img src={heartIcon} alt="Guarantee" className="home-chip-icon" />
                  <div>
                    <strong>100% Free</strong>
                    <span>{lang === 'en' ? 'If not fresh' : 'បើមិនស្រស់'}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Interactive Live Hub Glass Card */}
            <div className="home-hero-widget-col">
              <div className="home-live-status-card">
                <div className="home-status-card-glow" />

                <div className="home-status-card-header">
                  <div className="home-status-header-left">
                    <span className="home-status-indicator-dot" />
                    <div>
                      <h4 className="home-status-title">{lang === 'en' ? 'Phnom Penh Cold Hub' : 'មជ្ឈមណ្ឌលត្រជាក់ភ្នំពេញ'}</h4>
                      <p className="home-status-sub">{HERO_SLIDES[slideIndex].tag}</p>
                    </div>
                  </div>
                  <span className="home-status-temp-badge">
                    <span className="home-temp-frost">❄️</span> 3.8°C
                  </span>
                </div>

                <div className="home-status-batch-info">
                  <div className="home-batch-item">
                    <span className="home-batch-lbl">{lang === 'en' ? 'Harvest Time' : 'ពេលប្រមូលផល'}</span>
                    <strong className="home-batch-val">05:30 AM Today</strong>
                  </div>
                  <div className="home-batch-item">
                    <span className="home-batch-lbl">{lang === 'en' ? 'Active Couriers' : 'អ្នកដឹកជញ្ជូនសកម្ម'}</span>
                    <strong className="home-batch-val home-batch-val--green">48 Active</strong>
                  </div>
                  <div className="home-batch-item">
                    <span className="home-batch-lbl">{lang === 'en' ? 'Express ETA' : 'រយៈពេលដឹក'}</span>
                    <strong className="home-batch-val home-batch-val--orange">~28 Mins</strong>
                  </div>
                </div>

                {/* Live order notification simulator */}
                <div className="home-status-live-banner">
                  <img src={bellIcon} alt="Alert" className="home-status-alert-icon" />
                  <div className="home-status-alert-text">
                    <strong>{lang === 'en' ? 'Recent delivery to Toul Kork' : 'ទើបដឹកជញ្ជូនដល់ទួលគោក'}</strong>
                    <span>{lang === 'en' ? 'Organic Strawberries + Farm Eggs (22m ago)' : 'ស្ត្របឺរីសរីរាង្គ + ស៊ុតកសិដ្ឋាន (២២ នាទីមុន)'}</span>
                  </div>
                </div>

                {/* Slideshow Progress Controls */}
                <div className="home-hero-slide-controls">
                  {HERO_SLIDES.map((slide, i) => (
                    <button
                      key={i}
                      type="button"
                      className={`home-hero-slide-btn ${i === slideIndex ? 'home-hero-slide-btn--active' : ''}`}
                      onClick={() => setSlideIndex(i)}
                      aria-label={`Slide ${i + 1}: ${slide.tag}`}
                    >
                      <span className="home-slide-btn-bar" />
                      <span className="home-slide-btn-label">{slide.tag.split(' ')[0]}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ===== 3. SENSORY CATEGORY EXPLORER ===== */}
      <section className="home-categories-section">
        <div className="home-inner">
          <div className="home-section-header--center">
            <span className="home-section-eyebrow">
              <img src={leafIcon} alt="Leaf" className="home-eyebrow-3d-icon" />
              <span>{lang === 'en' ? 'Direct Farm Departments' : 'ផ្នែកទំនិញពីកសិដ្ឋាន'}</span>
            </span>
            <h2 className="home-section-title">
              {lang === 'en' ? 'Explore Fresh Daily Harvests' : 'ស្វែងរកផលិតផលស្រស់ៗប្រចាំថ្ងៃ'}
            </h2>
            <div className="home-accent-line" />
            <p className="home-section-body">
              {lang === 'en'
                ? 'Handpicked every sunrise from verified organic growers across Cambodia, sealed at 4°C.'
                : 'ជ្រើសរើសដោយដៃរៀងរាល់ព្រឹកព្រលឹមពីកសិករសរីរាង្គទូទាំងកម្ពុជា រក្សាទុកនៅ ៤°C។'}
            </p>
          </div>

          <div className="home-categories-grid">
            {CATEGORY_CARDS.map((cat) => (
              <Link key={cat.id} to={cat.link} className="home-category-card">
                <div className="home-category-icon-wrap" style={{ '--cat-color': cat.color }}>
                  <img src={cat.icon} alt={cat.name[lang]} className="home-category-3d-img" />
                </div>
                <div className="home-category-meta">
                  <h3 className="home-category-name">{cat.name[lang]}</h3>
                  <span className="home-category-count">{cat.count[lang]}</span>
                </div>
                <div className="home-category-footer">
                  <span className="home-cat-browse-text">{lang === 'en' ? 'Explore' : 'ចូលមើល'}</span>
                  <span className="home-category-arrow">→</span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ===== 4. TODAY'S FARM DROP (LIVE INTERACTIVE FRESH PICKS) ===== */}
      <section className="home-drop-section">
        <div className="home-inner">
          <div className="home-drop-header">
            <div>
              <span className="home-section-eyebrow">
                <img src={sunIcon} alt="Sun" className="home-eyebrow-3d-icon" />
                <span>{lang === 'en' ? "Today's Morning Drop" : 'ទំនិញទើបប្រមូលផលព្រឹកនេះ'}</span>
              </span>
              <h2 className="home-section-title">
                {lang === 'en' ? 'Freshly Harvested Today' : 'ទំនិញស្រស់ៗទើបមកដល់'}
              </h2>
            </div>

            {/* Interactive Category Filter Pills */}
            <div className="home-drop-tabs" role="tablist">
              {[
                { id: 'fruits', label: { en: '🍎 Fruits', kh: '🍎 ផ្លែឈើ' } },
                { id: 'dairy', label: { en: '🥛 Dairy & Eggs', kh: '🥛 ទឹកដោះគោ/ស៊ុត' } },
                { id: 'drinks', label: { en: '🧃 Cold Drinks', kh: '🧃 ភេសជ្ជៈ' } },
              ].map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  role="tab"
                  aria-selected={selectedDropCat === tab.id}
                  className={`home-drop-tab-btn ${selectedDropCat === tab.id ? 'home-drop-tab-btn--active' : ''}`}
                  onClick={() => setSelectedDropCat(tab.id)}
                >
                  {tab.label[lang]}
                </button>
              ))}
            </div>
          </div>

          {/* Product Cards Grid */}
          <div className="home-drop-grid">
            {dropProducts.map((prod) => {
              const isAdded = addedItemIds.has(prod.id)
              return (
                <div key={prod.id} className="home-drop-card">
                  <div className="home-drop-media">
                    <img src={prod.image} alt={prod.name[lang]} className="home-drop-img" loading="lazy" />
                    <div className="home-drop-badges">
                      {prod.badge && <span className="home-drop-badge">{prod.badge[lang]}</span>}
                      {prod.oldPrice && (
                        <span className="home-drop-discount">
                          -{Math.round(((prod.oldPrice - prod.price) / prod.oldPrice) * 100)}%
                        </span>
                      )}
                    </div>
                    <span className="home-drop-origin-chip">
                      📍 {prod.origin[lang].split(',')[0]}
                    </span>
                  </div>

                  <div className="home-drop-body">
                    <div className="home-drop-rating">
                      <span className="home-drop-stars">{'★'.repeat(Math.round(prod.rating))}</span>
                      <span className="home-drop-sold">{prod.sold}+ sold</span>
                    </div>

                    <h3 className="home-drop-name">
                      <Link to="/products">{prod.name[lang]}</Link>
                    </h3>

                    <div className="home-drop-footer">
                      <div className="home-drop-price-wrap">
                        <span className="home-drop-price">{formatPrice(prod.price)}</span>
                        {prod.oldPrice && (
                          <span className="home-drop-old-price">{formatPrice(prod.oldPrice)}</span>
                        )}
                        <span className="home-drop-unit">/{prod.unit[lang]}</span>
                      </div>

                      <button
                        type="button"
                        className={`home-drop-add-btn ${isAdded ? 'home-drop-add-btn--added' : ''}`}
                        onClick={(e) => handleQuickAdd(e, prod)}
                        aria-label={`Add ${prod.name[lang]} to cart`}
                      >
                        {isAdded ? (
                          <>
                            <span>✓</span>
                            <span>{lang === 'en' ? 'Added' : 'បានបន្ថែម'}</span>
                          </>
                        ) : (
                          <>
                            <span>+</span>
                            <span>{lang === 'en' ? 'Add' : 'ទិញ'}</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          <div className="home-drop-bottom-cta">
            <Link to="/products" className="home-view-all-catalog-btn">
              <span>{lang === 'en' ? 'Explore Full Catalog (80+ Fresh Farm Items)' : 'មើលទំនិញទាំងអស់ (៨០+ មុខ)'}</span>
              <span className="home-btn-chevron">→</span>
            </Link>
          </div>
        </div>
      </section>

      {/* ===== 5. INTERACTIVE 4-STAGE COLD-CHAIN JOURNEY ===== */}
      <section className="home-journey-section">
        <div className="home-inner">
          <div className="home-section-header--center">
            <span className="home-section-eyebrow">
              <img src={clockIcon} alt="Clock" className="home-eyebrow-3d-icon" />
              <span>{lang === 'en' ? 'From Sunrise to Table' : 'ពីថ្ងៃរះដល់តុអាហារ'}</span>
            </span>
            <h2 className="home-section-title">
              {lang === 'en' ? 'How Your Groceries Stay 100% Crisp' : 'ដំណើរការថែរក្សាភាពស្រស់ ១០០%'}
            </h2>
            <div className="home-accent-line" />
            <p className="home-section-body">
              {lang === 'en'
                ? 'Our uninterrupted cold-chain logistics ensures produce never breaks temperature from farm harvest to doorstep delivery.'
                : 'ខ្សែច្រវាក់ត្រជាក់ឥតដាច់ ធានាថាផលិតផលមិនដែលបាត់បង់ភាពត្រជាក់ ចាប់ពីពេលប្រមូលផលដល់មាត់ទ្វារផ្ទះ។'}
            </p>
          </div>

          <div className="home-journey-stepper">
            {COLD_CHAIN_STAGES.map((stage, idx) => (
              <div
                key={stage.step}
                className={`home-journey-card ${activeStage === idx ? 'home-journey-card--active' : ''}`}
                onClick={() => setActiveStage(idx)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') setActiveStage(idx) }}
              >
                <div className="home-journey-card-top">
                  <span className="home-journey-step-num">{stage.step}</span>
                  <span className="home-journey-time-tag">⏱️ {stage.time}</span>
                  <div className="home-journey-icon-wrap">
                    <img src={stage.icon} alt={stage.title[lang]} className="home-journey-3d-img" />
                  </div>
                </div>

                <div className="home-journey-body">
                  <h3 className="home-journey-title">{stage.title[lang]}</h3>
                  <p className="home-journey-desc">{stage.desc[lang]}</p>
                </div>

                <div className="home-journey-footer">
                  <span className="home-journey-origin-tag">📍 {stage.origin[lang]}</span>
                  <span className="home-journey-metric-tag">{stage.metric}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== 6. WHY FRESHMART BENTO GRID ===== */}
      <section className="home-bento-section">
        <div className="home-inner">
          <div className="home-section-header--center">
            <span className="home-section-eyebrow">
              <img src={shieldIcon} alt="Shield" className="home-eyebrow-3d-icon" />
              <span>{lang === 'en' ? 'The FreshMart Standard' : 'ស្តង់ដារគុណភាព FreshMart'}</span>
            </span>
            <h2 className="home-section-title">
              {lang === 'en' ? 'Why 50,000+ Families Trust Us' : 'ហេតុអ្វីបានជាគ្រួសារ ៥០,០០០+ ទុកចិត្តយើង'}
            </h2>
            <div className="home-accent-line" />
          </div>

          <div className="home-bento-grid">

            {/* Bento 1: Large Farm Partnership Story */}
            <div className="home-bento-card home-bento-card--large">
              <div className="home-bento-bg-img-wrap">
                <img src={inside} alt="FreshMart Farm Network" className="home-bento-bg-img" />
                <div className="home-bento-overlay" />
              </div>
              <div className="home-bento-content">
                <div className="home-bento-pill">
                  <img src={leafIcon} alt="Leaf" className="home-bento-pill-icon" />
                  <span>{lang === 'en' ? 'Direct Farm Network' : 'បណ្តាញកសិដ្ឋានផ្ទាល់'}</span>
                </div>
                <h3 className="home-bento-title">
                  {lang === 'en'
                    ? 'Empowering 200+ Local Farming Families Across Cambodia'
                    : 'ផ្តល់អំណាចដល់កសិករក្នុងស្រុកជាង ២០០ គ្រួសារទូទាំងកម្ពុជា'}
                </h3>
                <p className="home-bento-desc">
                  {lang === 'en'
                    ? 'By removing middle traders, we guarantee fair compensation for local growers while delivering clean, chemical-free organic food at honest prices.'
                    : 'ដោយកាត់បន្ថយឈ្មួញកណ្តាល យើងធានាតម្លៃយុត្តិធម៌សម្រាប់កសិករ ព្រមទាំងផ្តល់អាហារសរីរាង្គគ្មានជាតិគីមីក្នុងតម្លៃសមរម្យ។'}
                </p>
                <div className="home-bento-stats-row">
                  <div className="home-bento-stat">
                    <strong>200+</strong>
                    <span>{lang === 'en' ? 'Smallholder Farms' : 'កសិដ្ឋានដៃគូ'}</span>
                  </div>
                  <div className="home-bento-stat">
                    <strong>100%</strong>
                    <span>{lang === 'en' ? 'Chemical Tested' : 'ត្រួតពិនិត្យជាតិគីមី'}</span>
                  </div>
                  <div className="home-bento-stat">
                    <strong>25</strong>
                    <span>{lang === 'en' ? 'Provinces Sourced' : 'ខេត្តផ្គត់ផ្គង់'}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Bento 2: 45-Min Cold Chain Logistics */}
            <div className="home-bento-card home-bento-card--medium">
              <div className="home-bento-content">
                <div className="home-bento-icon-box">
                  <img src={flashIcon} alt="Speed" className="home-bento-3d-icon" />
                </div>
                <h3 className="home-bento-title">
                  {lang === 'en' ? '45-Minute Express Cold Transit' : 'ដឹកជញ្ជូនរហ័ស ៤៥ នាទី រក្សាភាពត្រជាក់'}
                </h3>
                <p className="home-bento-desc">
                  {lang === 'en'
                    ? 'Our insulated thermal boxes maintain an exact 4°C sub-climate, preventing wilting even in high noon heat.'
                    : 'ប្រអប់រក្សាកម្ដៅរបស់យើងធានាសីតុណ្ហភាព ៤°C ជាប់ជានិច្ច ការពារមិនឱ្យបន្លែស្រពោនសូម្បីតែនៅពេលថ្ងៃក្តៅខ្លាំង។'}
                </p>
                <div className="home-bento-tag-pill">
                  <span>⚡ 32-min average delivery time</span>
                </div>
              </div>
            </div>

            {/* Bento 3: Zero Single-Use Plastic */}
            <div className="home-bento-card home-bento-card--medium">
              <div className="home-bento-content">
                <div className="home-bento-icon-box">
                  <img src={heartIcon} alt="Eco" className="home-bento-3d-icon" />
                </div>
                <h3 className="home-bento-title">
                  {lang === 'en' ? 'Eco Returnable Crate System' : 'ប្រព័ន្ធប្រអប់បរិស្ថានប្រើឡើងវិញ'}
                </h3>
                <p className="home-bento-desc">
                  {lang === 'en'
                    ? 'Say goodbye to plastic bags. Receive your groceries in sterilized, reusable containers that we collect on your next drop.'
                    : 'លាហើយថង់ប្លាស្ទិក។ ទទួលបានគ្រឿងទេសក្នុងប្រអប់ដែលសម្លាប់មេរោគស្អាត និងអាចប្រគល់ជូនវិញពេលដឹកលើកក្រោយ។'}
                </p>
                <div className="home-bento-tag-pill">
                  <span>🌱 Zero single-use plastic</span>
                </div>
              </div>
            </div>

            {/* Bento 4: 100% Satisfaction Guarantee */}
            <div className="home-bento-card home-bento-card--small">
              <div className="home-bento-content">
                <div className="home-bento-icon-box">
                  <img src={trophyIcon} alt="Guarantee" className="home-bento-3d-icon" />
                </div>
                <h3 className="home-bento-title">
                  {lang === 'en' ? '100% Fresh or Full Refund' : 'ធានាស្រស់ ១០០% ឬសងប្រាក់វិញ'}
                </h3>
                <p className="home-bento-desc">
                  {lang === 'en'
                    ? '1-tap instant resolution. No lengthy returns, no questions asked.'
                    : 'ដោះស្រាយភ្លាមៗត្រឹមតែ ១ ចុច។ គ្មានភាពស្មុគស្មាញ គ្មានការសួរនាំច្រើន។'}
                </p>
              </div>
            </div>

            {/* Bento 5: Fair Direct Pricing */}
            <div className="home-bento-card home-bento-card--small">
              <div className="home-bento-content">
                <div className="home-bento-icon-box">
                  <img src={walletIcon} alt="Price" className="home-bento-3d-icon" />
                </div>
                <h3 className="home-bento-title">
                  {lang === 'en' ? 'Honest Farm-Gate Prices' : 'តម្លៃសមរម្យផ្ទាល់ពីចម្ការ'}
                </h3>
                <p className="home-bento-desc">
                  {lang === 'en'
                    ? 'Direct sourcing saves you up to 25% compared to conventional imported produce.'
                    : 'ការទិញផ្ទាល់ពីចម្ការជួយលោកអ្នកសន្សំបានរហូតដល់ ២៥% ធៀបនឹងទំនិញនាំចូល។'}
                </p>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ===== 7. LIVE IMPACT & REAL NUMBERS ===== */}
      <section className="home-stats-section">
        <div className="home-inner">
          <div className="home-stats-band">
            {STATS_DATA.map((stat, i) => (
              <div key={stat.label.en} className="home-stat-item">
                <div className="home-stat-icon-wrap">
                  <img src={stat.icon} alt={stat.label[lang]} className="home-stat-3d-icon" />
                </div>
                <div className="home-stat-value">
                  <AnimatedNumber value={stat.val} />
                </div>
                <span className="home-stat-label">{stat.label[lang]}</span>
                <span className="home-stat-sub">{stat.sub[lang]}</span>
                {i < STATS_DATA.length - 1 && <span className="home-stat-divider" />}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== 8. AUTHENTIC COMMUNITY STORIES (TESTIMONIALS) ===== */}
      <section className="home-reviews-section">
        <div className="home-inner">
          <div className="home-section-header--center">
            <span className="home-section-eyebrow">
              <img src={thumbUpIcon} alt="Thumb Up" className="home-eyebrow-3d-icon" />
              <span>{lang === 'en' ? 'Verified Community Love' : 'ការពេញចិត្តពីអតិថិជនពិត'}</span>
            </span>
            <h2 className="home-section-title">
              {lang === 'en' ? 'Loved by Over 50,000 Households' : 'ការពេញចិត្តពីគ្រួសារជាង ៥០,០០០+'}
            </h2>
            <div className="home-accent-line" />
            <p className="home-section-body">
              {lang === 'en'
                ? 'Read real experiences from families and chefs across Cambodia who count on our morning farm drops.'
                : 'អានបទពិសោធន៍ពិតពីបណ្តាគ្រួសារ និងចុងភៅទូទាំងកម្ពុជា ដែលជឿជាក់លើសេវាកម្មរបស់យើង។'}
            </p>
          </div>

          <div className="home-reviews-grid">
            {REVIEWS_DATA.map((rev) => (
              <div key={rev.name} className="home-review-card">
                <div className="home-review-header">
                  <img src={rev.avatar} alt={rev.name} className="home-review-avatar" />
                  <div className="home-review-user-info">
                    <div className="home-review-name-row">
                      <strong className="home-review-name">{rev.name}</strong>
                      <span className="home-review-verified-badge" title="Verified Buyer">✓ {lang === 'en' ? 'Verified' : 'បានបញ្ជាក់'}</span>
                    </div>
                    <span className="home-review-location">{rev.location}</span>
                  </div>
                </div>

                <div className="home-review-stars">
                  {'★'.repeat(rev.stars)}
                </div>

                <p className="home-review-text">"{rev.text[lang]}"</p>

                <div className="home-review-footer">
                  <span className="home-review-tag">🛒 {rev.tag[lang]}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== 9. INTERACTIVE FRESHNESS FAQ ===== */}
      <section className="home-faq-section">
        <div className="home-inner">
          <div className="home-faq-grid">
            <div className="home-faq-sidebar">
              <span className="home-section-eyebrow">
                <img src={chatIcon} alt="FAQ" className="home-eyebrow-3d-icon" />
                <span>{lang === 'en' ? 'Got Questions?' : 'មានចម្ងល់ដែរឬទេ?'}</span>
              </span>
              <h2 className="home-section-title">
                {lang === 'en' ? 'Everything You Need to Know' : 'អ្វីៗដែលអ្នកគួរដឹង'}
              </h2>
              <div className="home-accent-line" />
              <p className="home-section-body">
                {lang === 'en'
                  ? 'Learn about our cold-chain standards, partner farms, and instant guarantee policy.'
                  : 'ស្វែងយល់អំពីស្តង់ដារខ្សែច្រវាក់ត្រជាក់ កសិដ្ឋានដៃគូ និងគោលការណ៍ធានារបស់យើង។'}
              </p>
              <div className="home-faq-contact-card">
                <img src={chatIcon} alt="Chat" className="home-faq-chat-icon" />
                <div>
                  <strong>{lang === 'en' ? 'Need help right away?' : 'ត្រូវការជំនួយបន្ទាន់?'}</strong>
                  <p>{lang === 'en' ? 'Our Phnom Penh support desk is online 24/7.' : 'ក្រុមការងារប្រចាំការ ២៤/៧។'}</p>
                  <Link to="/contact" className="home-faq-contact-link">
                    {lang === 'en' ? 'Chat with Support →' : 'ជជែកជាមួយក្រុមការងារ →'}
                  </Link>
                </div>
              </div>
            </div>

            <div className="home-faq-accordion">
              {FAQS_DATA.map((faq, i) => {
                const isOpen = openFaq === i
                return (
                  <div
                    key={i}
                    className={`home-faq-item ${isOpen ? 'home-faq-item--open' : ''}`}
                  >
                    <button
                      type="button"
                      className="home-faq-question"
                      onClick={() => setOpenFaq(isOpen ? -1 : i)}
                      aria-expanded={isOpen}
                    >
                      <span className="home-faq-q-text">{faq.q[lang]}</span>
                      <span className="home-faq-toggle-icon">{isOpen ? '−' : '+'}</span>
                    </button>
                    <div className="home-faq-answer">
                      <p>{faq.a[lang]}</p>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </section>

      {/* ===== 10. HIGH-IMPACT COMMUNITY CTA ===== */}
      <section className="home-cta-section">
        <div className="home-inner">
          <div className="home-cta-card">
            <div className="home-cta-glow home-cta-glow--l" />
            <div className="home-cta-glow home-cta-glow--r" />

            <div className="home-cta-content">
              <div className="home-cta-badge">
                <img src={rocketIcon} alt="Rocket" className="home-cta-3d-badge-icon" />
                <span>{lang === 'en' ? 'Fresh Morning Deliveries Daily' : 'ដឹកជញ្ជូនរៀងរាល់ព្រឹក'}</span>
              </div>

              <h2 className="home-cta-title">
                {lang === 'en'
                  ? 'Ready to Taste True Cambodian Farm Freshness?'
                  : 'ត្រៀមខ្លួនភ្លក្សរសជាតិស្រស់ៗពិតពីចម្ការកម្ពុជាហើយឬនៅ?'}
              </h2>

              <p className="home-cta-sub">
                {lang === 'en'
                  ? 'Join 50,000+ households enjoying organic, crisp groceries delivered in under 45 minutes.'
                  : 'ចូលរួមជាមួយគ្រួសារជាង ៥០,០០០+ ដែលកំពុងរីករាយជាមួយគ្រឿងទេសសរីរាង្គ ដឹកជញ្ជូនក្នុងរយៈពេលក្រោម ៤៥ នាទី។'}
              </p>

              <div className="home-cta-actions">
                <Link to="/products" className="home-btn-shop">
                  <img src={bagIcon} alt="Shop" className="home-btn-3d-icon" />
                  <span>{lang === 'en' ? 'Start Your Fresh Order' : 'ចាប់ផ្តើមកុម្ម៉ង់ទំនិញ'}</span>
                  <span className="home-btn-chevron">→</span>
                </Link>
                <Link to="/contact" className="home-btn-contact">
                  <img src={chatIcon} alt="Contact" className="home-btn-3d-icon" />
                  <span>{lang === 'en' ? 'Contact Support Team' : 'ទាក់ទងក្រុមការងារ'}</span>
                  <span className="home-btn-chevron">→</span>
                </Link>
              </div>

              <div className="home-cta-guarantee-strip">
                <span>🛡️ {lang === 'en' ? '100% Freshness Guarantee' : 'ធានាភាពស្រស់ ១០០%'}</span>
                <span className="home-cta-dot">•</span>
                <span>⚡ {lang === 'en' ? '45-Min Express Delivery' : 'ដឹកជញ្ជូនរហ័ស ៤៥ នាទី'}</span>
                <span className="home-cta-dot">•</span>
                <span>🌱 {lang === 'en' ? '200+ Local Farm Partners' : 'កសិករដៃគូ ២០០+'}</span>
              </div>
            </div>
          </div>
        </div>
      </section>

    </div>
  )
}

export default Home
