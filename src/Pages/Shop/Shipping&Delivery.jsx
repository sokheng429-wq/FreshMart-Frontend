import { useLanguage } from '../../context/LanguageContext'

// 3D Icons
import rocketIcon from '../../assets/icon/3dicons-rocket-dynamic-color.png'
import flashIcon from '../../assets/icon/3dicons-flash-dynamic-color.png'
import shieldIcon from '../../assets/icon/3dicons-shield-dynamic-color.png'
import leafIcon from '../../assets/icon/3dicons-leaf-dynamic-color.png'
import clockIcon from '../../assets/icon/3dicons-clock-dynamic-color.png'
import bagIcon from '../../assets/icon/3dicons-bag-dynamic-color.png'
import walletIcon from '../../assets/icon/3dicons-wallet-dynamic-color.png'

import './Shipping&Delivery.css'

const DELIVERY_TIERS = [
  {
    icon: flashIcon,
    name: { en: 'Lightning Cold Express', kh: 'លឿនរន្ទះត្រជាក់' },
    time: { en: 'Guaranteed under 45 minutes', kh: 'ធានាជូនក្រោម ៤៥ នាទី' },
    cost: { en: '$2.50 flat', kh: '២.៥០ ដុល្លារ' },
    tag: { en: 'Most Popular', kh: 'ពេញនិយមបំផុត' },
    desc: { en: 'Dispatched immediately in sub-zero thermal box from nearest hub.', kh: 'ដឹកចេញភ្លាមៗក្នុងប្រអប់ត្រជាក់ពីឃ្លាំងដែលនៅជិតបំផុត។' },
    highlight: true,
  },
  {
    icon: clockIcon,
    name: { en: 'Same-Day Evening Run', kh: 'ដឹកជញ្ជូនល្ងាចថ្ងៃដដែល' },
    time: { en: 'Order before 5:00 PM — Arrives tonight', kh: 'បញ្ជាទិញមុនម៉ោង ៥:០០ ល្ងាច — មកដល់យប់នេះ' },
    cost: { en: '$1.50 (FREE over $15)', kh: '១.៥០ ដុល្លារ (ឥតគិតថ្លៃលើស $15)' },
    tag: { en: 'Best Value', kh: 'តម្លៃល្អបំផុត' },
    desc: { en: 'Batched eco-routing across Phnom Penh with real-time ETA.', kh: 'ដឹកជញ្ជូនតាមផ្លូវសន្សំសំចៃទូទាំងភ្នំពេញជាមួយម៉ោងច្បាស់លាស់។' },
    highlight: false,
  },
  {
    icon: bagIcon,
    name: { en: 'Scheduled Next-Day Slot', kh: 'កំណត់ម៉ោងថ្ងៃបន្ទាប់' },
    time: { en: 'Choose any 2-hour morning or evening slot', kh: 'ជ្រើសរើសពេល ២ ម៉ោងពេលព្រឹក ឬល្ងាច' },
    cost: { en: 'FREE on all orders', kh: 'ឥតគិតថ្លៃគ្រប់ការបញ្ជាទិញ' },
    tag: { en: 'Flexible Choice', kh: 'ជម្រើសបត់បែន' },
    desc: { en: 'Perfect for weekly farm box groceries and pantry restocks.', kh: 'ល្អឥតខ្ចោះសម្រាប់ការទិញបន្លែផ្លែឈើប្រចាំសប្តាហ៍។' },
    highlight: false,
  },
]

const HOW_IT_WORKS = [
  {
    step: '01',
    icon: leafIcon,
    title: { en: 'Farm Harvest & Quality Scan', kh: 'ប្រមូលផល និងស្កេនគុណភាព' },
    text: { en: 'Greens, fruits, and meats are picked at dawn and tested for 0% pesticide residue.', kh: 'បន្លែ ផ្លែឈើ និងសាច់ត្រូវបានប្រមូលផលពេលព្រឹកព្រលឹម និងពិនិត្យគ្មានជាតិគីមី។' },
  },
  {
    step: '02',
    icon: shieldIcon,
    title: { en: '4°C Chiller Bag Packing', kh: 'វេចខ្ចប់ក្នុងថង់ត្រជាក់ ៤°C' },
    text: { en: 'Orders are packed in vacuum insulated pouches to preserve crispness and vitamins.', kh: 'ទំនិញត្រូវបានវេចខ្ចប់ក្នុងថង់រក្សាសីតុណ្ហភាពដើម្បីរក្សាជាតិវីតាមីន។' },
  },
  {
    step: '03',
    icon: walletIcon,
    title: { en: 'Flexible Local Payment', kh: 'បង់ប្រាក់ងាយស្រួលក្នុងស្រុក' },
    text: { en: 'Pay via KHQR (ABA, Wing, ACLEDA, Bakong) or Cash on Delivery with zero fees.', kh: 'ទូទាត់តាម KHQR (ABA, Wing, ACLEDA, Bakong) ឬសាច់ប្រាក់ពេលទទួលទំនិញ។' },
  },
  {
    step: '04',
    icon: rocketIcon,
    title: { en: '45-Min Doorstep Delivery', kh: 'ដឹកដល់មាត់ទ្វារក្នុង ៤៥ នាទី' },
    text: { en: 'Track your rider live on map. If anything is less than perfect, instant free return.', kh: 'តាមដានអ្នកដឹកជញ្ជូនលើផែនទីផ្ទាល់។ មិនពេញចិត្ត ដូរវិញឥតគិតថ្លៃ។' },
  },
]

const ZONES = [
  { area: { en: 'Central Phnom Penh', kh: 'កណ្តាលរាជធានីភ្នំពេញ' }, time: { en: '25–45 mins', kh: '២៥–៤៥ នាទី' }, districts: 'Daun Penh, Chamkarmon, 7 Makara, Toul Kork, Boeung Keng Kang (BKK1/2/3)' },
  { area: { en: 'Greater Urban Phnom Penh', kh: 'ភ្នំពេញតំបន់ទីក្រុងធំ' }, time: { en: '35–60 mins', kh: '៣៥–៦០ នាទី' }, districts: 'Sen Sok, Meanchey, Russey Keo, Chroy Changvar, Por Senchey' },
  { area: { en: 'Outer Suburban Hubs', kh: 'ជាយក្រុង និងតំបន់អភិវឌ្ឍន៍' }, time: { en: '50–80 mins', kh: '៥០–៨០ នាទី' }, districts: 'Dangkao, Kamboul, Prek Pnov, Chbar Ampov, Hun Sen Blvd (Takhmao Gate)' },
]

const TEXTS = {
  eyebrow: { en: 'Cold-Chain Logistics & Distribution', kh: 'ភស្តុភារ និងការចែកចាយត្រជាក់' },
  title: { en: 'Fast, Temperature-Locked Delivery', kh: 'ការដឹកជញ្ជូនរហ័ស រក្សាសីតុណ្ហភាព' },
  subtitle: {
    en: 'From our temperature-controlled urban hubs to your kitchen counter in under 45 minutes across all 14 districts of Phnom Penh.',
    kh: 'ពីឃ្លាំងត្រជាក់របស់យើងដល់ផ្ទះបាយរបស់អ្នកក្នុងរយៈពេលក្រោម ៤៥ នាទី ទូទាំងខណ្ឌទាំង ១៤ នៃរាជធានីភ្នំពេញ។',
  },
  howTitle: { en: 'How Cold-Chain Transit Works', kh: 'របៀបដែលការដឹកជញ្ជូនដំណើរការ' },
  howSub: { en: '4 seamless steps engineered to maintain field-fresh quality.', kh: '៤ ជំហានរលូនដើម្បីរក្សាភាពស្រស់ស្អាតដូចបេះពីចម្ការ។' },
  zonesTitle: { en: 'Phnom Penh Delivery Coverage Zones', kh: 'តំបន់គ្របដណ្តប់នៅរាជធានីភ្នំពេញ' },
  zonesSub: { en: 'Real-time dispatch from 4 strategically positioned cold hubs.', kh: 'ដឹកជញ្ជូនផ្ទាល់ពីឃ្លាំងត្រជាក់ចំនួន ៤ កន្លែង។' },
  freshnessTitle: { en: '100% Cold-Chain Freshness Promise', kh: 'ការសន្យាភាពស្រស់ត្រជាក់ ១០០%' },
  freshnessText: {
    en: 'Every harvest batch is kept between 2°C and 4°C during entire transit. If any fruit, herb, or meat item does not meet your crispness standards, your rider will replace or refund it on the spot with zero questions asked.',
    kh: 'រាល់ទំនិញត្រូវបានរក្សាសីតុណ្ហភាពចន្លោះ ២°C ទៅ ៤°C ពេញមួយពេលដឹកជញ្ជូន។ ប្រសិនបើទំនិញមិនស្រស់ យើងនឹងដូរជូន ឬសងប្រាក់វិញភ្លាមៗ។',
  },
}

export const ShippingDelivery = () => {
  const { lang } = useLanguage()

  return (
    <div className="shipping-page">
      <div className="shipping-inner">

        {/* ── HERO BANNER ── */}
        <section className="shipping-hero-card">
          <span className="shipping-eyebrow">
            <img src={rocketIcon} alt="Express" className="shipping-3d-micro" />
            <span>{TEXTS.eyebrow[lang]}</span>
          </span>

          <h1 className="shipping-title">{TEXTS.title[lang]}</h1>
          <p className="shipping-subtitle">{TEXTS.subtitle[lang]}</p>
        </section>

        {/* ── DELIVERY SPEED TIERS ── */}
        <section className="shipping-tiers-section">
          <div className="shipping-tiers-grid">
            {DELIVERY_TIERS.map((tier) => (
              <div
                key={tier.name.en}
                className={`shipping-tier-card ${tier.highlight ? 'shipping-tier-card--featured' : ''}`}
              >
                {tier.tag && <span className="shipping-tier-tag">{tier.tag[lang]}</span>}
                <div className="shipping-tier-icon-wrap">
                  <img src={tier.icon} alt={tier.name.en} className="shipping-tier-3d-img" />
                </div>
                <h3 className="shipping-tier-name">{tier.name[lang]}</h3>
                <span className="shipping-tier-time">{tier.time[lang]}</span>
                <p className="shipping-tier-desc">{tier.desc[lang]}</p>
                <div className="shipping-tier-cost-badge">{tier.cost[lang]}</div>
              </div>
            ))}
          </div>
        </section>

        {/* ── HOW IT WORKS 4-STEP TIMELINE ── */}
        <section className="shipping-how-section">
          <div className="shipping-section-head">
            <img src={shieldIcon} alt="How" className="shipping-section-3d-sm" />
            <div>
              <h2 className="shipping-section-title">{TEXTS.howTitle[lang]}</h2>
              <p className="shipping-section-sub">{TEXTS.howSub[lang]}</p>
            </div>
          </div>

          <div className="shipping-steps-grid">
            {HOW_IT_WORKS.map((item) => (
              <div key={item.step} className="shipping-step-card">
                <div className="shipping-step-top">
                  <span className="shipping-step-num">{item.step}</span>
                  <img src={item.icon} alt={item.step} className="shipping-step-3d-icon" />
                </div>
                <h4 className="shipping-step-title">{item.title[lang]}</h4>
                <p className="shipping-step-desc">{item.text[lang]}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ── FRESHNESS PROMISE GUARANTEE CARD ── */}
        <section className="shipping-freshness-banner">
          <div className="shipping-freshness-left">
            <img src={leafIcon} alt="Guarantee" className="shipping-freshness-3d-img" />
          </div>
          <div className="shipping-freshness-content">
            <h3 className="shipping-freshness-title">{TEXTS.freshnessTitle[lang]}</h3>
            <p className="shipping-freshness-desc">{TEXTS.freshnessText[lang]}</p>
          </div>
        </section>

        {/* ── DELIVERY ZONES MATRIX ── */}
        <section className="shipping-zones-section">
          <div className="shipping-section-head">
            <img src={rocketIcon} alt="Zones" className="shipping-section-3d-sm" />
            <div>
              <h2 className="shipping-section-title">{TEXTS.zonesTitle[lang]}</h2>
              <p className="shipping-section-sub">{TEXTS.zonesSub[lang]}</p>
            </div>
          </div>

          <div className="shipping-zones-grid">
            {ZONES.map((zone) => (
              <div key={zone.area.en} className="shipping-zone-card">
                <div className="shipping-zone-head">
                  <h4 className="shipping-zone-name">{zone.area[lang]}</h4>
                  <span className="shipping-zone-time-pill">{zone.time[lang]}</span>
                </div>
                <p className="shipping-zone-districts">{zone.districts}</p>
              </div>
            ))}
          </div>
        </section>

      </div>
    </div>
  )
}

export default ShippingDelivery
