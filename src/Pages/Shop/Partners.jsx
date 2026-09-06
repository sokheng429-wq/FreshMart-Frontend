import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useLanguage } from '../../context/LanguageContext'

// 3D Icons
import leafIcon from '../../assets/icon/3dicons-leaf-dynamic-color.png'
import mapPinIcon from '../../assets/icon/3dicons-map-pin-dynamic-color.png'
import shieldIcon from '../../assets/icon/3dicons-shield-dynamic-color.png'
import starIcon from '../../assets/icon/3dicons-star-dynamic-color.png'
import rocketIcon from '../../assets/icon/3dicons-rocket-dynamic-color.png'

import './Partners.css'

const PARTNERS = [
  { name: 'Mekong Organic Farms', category: { en: 'Fruits & Vegetables', kh: 'ផ្លែឈើ និងបន្លែ' }, catKey: 'fresh', since: 2018, color: '#77BC1F', supplies: { en: ['Crisp Hydroponic Lettuce', 'Cherry Tomatoes', 'Fresh Herbs'], kh: ['សាឡាត់អ៊ីដ្រូប៉ូនិច', 'ប៉េងប៉ោះតូចៗ', 'បន្លែស្លឹក'] }, region: { en: 'Kandal Province', kh: 'ខេត្តកណ្តាល' }, acres: '45 Hectares' },
  { name: 'Angkor Heritage Rice Mill', category: { en: 'Grains & Rice', kh: 'គ្រាប់ធញ្ញជាតិ' }, catKey: 'pantry', since: 2015, color: '#FF9900', supplies: { en: ['Fragrant Phka Rumduol Jasmine', 'Organic Brown Rice', 'Glutinous Rice'], kh: ['អង្ករផ្ការំដួល', 'អង្ករសម្រូបសរីរាង្គ', 'អង្ករដំណើប'] }, region: { en: 'Battambang', kh: 'ខេត្តបាត់ដំបង' }, acres: '120 Hectares' },
  { name: 'Chaktomuk Pure Dairy', category: { en: 'Dairy & Eggs', kh: 'ទឹកដោះគោ និងស៊ុត' }, catKey: 'dairy', since: 2019, color: '#00BCD4', supplies: { en: ['Fresh Pasture Milk', 'Greek Yogurt', 'Free-Range Brown Eggs'], kh: ['ទឹកដោះគោស្រស់', 'យ៉ាអួក្រិក', 'ស៊ុតមាន់ស្រែ'] }, region: { en: 'Phnom Penh Suburbs', kh: 'ជាយរាជធានីភ្នំពេញ' }, acres: '18 Hectares' },
  { name: 'Kampot Pepper Cooperative', category: { en: 'Pantry & Spices', kh: 'គ្រឿងទេស និងគ្រឿងផ្សំ' }, catKey: 'pantry', since: 2014, color: '#FF5722', supplies: { en: ['GI-Certified Black Pepper', 'Red Kampot Pepper', 'Sea Salt Flakes'], kh: ['ម្រេចខ្មៅសម្គាល់ភូមិសាស្ត្រ', 'ម្រេចក្រហមកំពត', 'អំបិលធម្មជាតិ'] }, region: { en: 'Kampot Province', kh: 'ខេត្តកំពត' }, acres: '30 Hectares' },
  { name: 'Mondulkiri Highland Greens', category: { en: 'Fruits & Vegetables', kh: 'ផ្លែឈើ និងបន្លែ' }, catKey: 'fresh', since: 2020, color: '#8BC34A', supplies: { en: ['Highland Strawberries', 'Hass Avocados', 'Raw Forest Honey'], kh: ['ស្ត្របឺរីខ្ពង់រាប', 'ផ្លែបឺរ', 'ទឹកឃ្មុំព្រៃ'] }, region: { en: 'Mondulkiri', kh: 'ខេត្តមណ្ឌលគិរី' }, acres: '65 Hectares' },
  { name: 'Tonle Sap Artisan Catch', category: { en: 'Meat & Seafood', kh: 'សាច់ និងគ្រឿងសមុទ្រ' }, catKey: 'meat', since: 2020, color: '#03A9F4', supplies: { en: ['Wild River Tilapia', 'Freshwater Giant Prawns', 'Snakehead Fish'], kh: ['ត្រីទីឡាពីធម្មជាតិ', 'បង្គាទន្លេធំៗ', 'ត្រីរ៉ស់'] }, region: { en: 'Kampong Chhnang', kh: 'ខេត្តកំពង់ឆ្នាំង' }, acres: 'Fishery Alliance' },
  { name: 'Battambang Sun Orchards', category: { en: 'Fruits & Vegetables', kh: 'ផ្លែឈើ និងបន្លែ' }, catKey: 'fresh', since: 2017, color: '#FFB300', supplies: { en: ['Sweet Keo Romeat Mangoes', 'Cavendish Bananas', 'Green Oranges'], kh: ['ស្វាយកែវរមៀត', 'ចេកអំបូង', 'ក្រូចពោធិ៍សាត់'] }, region: { en: 'Battambang', kh: 'ខេត្តបាត់ដំបង' }, acres: '80 Hectares' },
  { name: 'Sihanouk Deep Sea Co.', category: { en: 'Meat & Seafood', kh: 'សាច់ និងគ្រឿងសមុទ្រ' }, catKey: 'meat', since: 2018, color: '#0288D1', supplies: { en: ['Kep Blue Swimmer Crab', 'Fresh Squid', 'Wild Red Snapper'], kh: ['ក្តាមសេះកែប', 'មឹកស្រស់', 'ត្រីក្រហម'] }, region: { en: 'Preah Sihanouk', kh: 'ខេត្តព្រះសីហនុ' }, acres: 'Deep Fleet' },
  { name: 'Cardamom Agroforestry', category: { en: 'Fruits & Vegetables', kh: 'ផ្លែឈើ និងបន្លែ' }, catKey: 'fresh', since: 2019, color: '#009688', supplies: { en: ['Organic Dragon Fruit', 'Robusta Coffee Beans', 'Fresh Chili'], kh: ['ផ្លែស្រកានាគសរីរាង្គ', 'គ្រាប់កាហ្វេ', 'ម្ទេសស្រស់'] }, region: { en: 'Pursat Cardamom', kh: 'ខេត្តពោធិ៍សាត់' }, acres: '50 Hectares' },
]

const FILTERS = [
  { key: 'all', en: 'All Partners', kh: 'ដៃគូទាំងអស់' },
  { key: 'fresh', en: 'Vegetables & Fruits', kh: 'បន្លែ និងផ្លែឈើ' },
  { key: 'dairy', en: 'Dairy & Eggs', kh: 'ទឹកដោះគោ និងស៊ុត' },
  { key: 'meat', en: 'Meat & Seafood', kh: 'សាច់ និងគ្រឿងសមុទ្រ' },
  { key: 'pantry', en: 'Pantry & Spices', kh: 'គ្រាប់ធញ្ញជាតិ និងគ្រឿងទេស' },
]

const TEXTS = {
  eyebrow: { en: 'Ethical Supply · Direct From Farm', kh: 'ខ្សែច្រវាក់កសិកម្មផ្ទាល់' },
  title1: { en: 'Our Valued Local Growers &', kh: 'ដៃគូកសិករក្នុងស្រុក និង' },
  title2: { en: 'Producer Network', kh: 'បណ្តាញអ្នកផលិត' },
  subtitle: {
    en: 'We work directly with over 45+ organic cooperatives and family-owned mills across 9 Cambodian provinces to guarantee fresh, honest food on your dining table.',
    kh: 'យើងធ្វើការផ្ទាល់ជាមួយសហគមន៍កសិកម្មសរីរាង្គជាង ៤៥+ និងរោងម៉ាស៊ីនគ្រួសារនៅទូទាំង ៩ ខេត្តនៃប្រទេសកម្ពុជា ដើម្បីធានាអាហារស្រស់ស្អាត។',
  },
  statPartners: { en: 'Local Producer Alliances', kh: 'សម្ព័ន្ធអ្នកផលិតក្នុងស្រុក' },
  statProvinces: { en: 'Provinces Represented', kh: 'ខេត្តតំណាង' },
  statHours: { en: '4-Hour Farm-to-Hub Transit', kh: '៤ ម៉ោងពីកសិដ្ឋានដល់ឃ្លាំង' },
  searchPlaceholder: { en: 'Search by partner name, province, or produce…', kh: 'ស្វែងរកតាមឈ្មោះដៃគូ ខេត្ត ឬផលិតផល…' },
  featuredBadge: { en: 'Featured Producer Spotlight', kh: 'ដៃគូកសិករឆ្នើមប្រចាំខែ' },
  featuredQuote: {
    en: '“Partnering with FreshMart allowed our family farm to eliminate middleman margins and invest in advanced drip-irrigation hydroponic systems.”',
    kh: '“ការចាប់ដៃគូជាមួយ FreshMart ជួយឲ្យកសិដ្ឋានគ្រួសារយើងលក់បានតម្លៃសមរម្យ និងអាចពង្រីកប្រព័ន្ធស្រោចស្រពអ៊ីដ្រូប៉ូនិចទំនើប។”',
  },
  since: { en: 'Partner Since', kh: 'ដៃគូតាំងពី' },
  location: { en: 'Region', kh: 'តំបន់' },
  supplies: { en: 'Harvest Supplies', kh: 'ការផ្គត់ផ្គង់' },
  results: { en: 'producers active', kh: 'អ្នកផលិតសកម្ម' },
  noResults: { en: 'No matching growers found.', kh: 'រកមិនឃើញដៃគូដែលត្រូវគ្នា។' },
  ctaTitle: { en: 'Are You a Local Farmer or Food Maker?', kh: 'តើអ្នកជាកសិករ ឬអ្នកផលិតអាហារក្នុងស្រុកមែនទេ?' },
  ctaSub: {
    en: 'Join the FreshMart cold-chain distribution network and reach thousands of conscious households in Phnom Penh.',
    kh: 'ចូលរួមជាមួយបណ្តាញចែកចាយត្រជាក់ FreshMart និងពង្រីកការលក់ដល់រាប់ពាន់គ្រួសារនៅភ្នំពេញ។',
  },
  ctaBtn: { en: 'Become a Partner Supplier', kh: 'ចុះឈ្មោះក្លាយជាដៃគូ' },
}

export const Partners = () => {
  const { lang } = useLanguage()
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('all')

  const filtered = PARTNERS.filter((p) => {
    const q = search.trim().toLowerCase()
    const matchSearch =
      !q ||
      p.name.toLowerCase().includes(q) ||
      p.category.en.toLowerCase().includes(q) ||
      p.region.en.toLowerCase().includes(q) ||
      p.supplies.en.some((s) => s.toLowerCase().includes(q))
    const matchFilter = filter === 'all' || p.catKey === filter
    return matchSearch && matchFilter
  })

  const featured = PARTNERS[0]

  return (
    <div className="partners-page">
      {/* ── HERO BANNER ── */}
      <section className="pt-hero">
        <div className="pt-hero-inner">
          <span className="pt-eyebrow">
            <img src={leafIcon} alt="Farm" className="pt-3d-micro" />
            <span>{TEXTS.eyebrow[lang]}</span>
          </span>

          <h1 className="pt-title">
            {TEXTS.title1[lang]} <span className="pt-title-highlight">{TEXTS.title2[lang]}</span>
          </h1>

          <p className="pt-subtitle">{TEXTS.subtitle[lang]}</p>

          <div className="pt-stats">
            <div className="pt-stat-pill">
              <img src={shieldIcon} alt="Alliances" className="pt-stat-icon" />
              <div>
                <strong>45+</strong>
                <span>{TEXTS.statPartners[lang]}</span>
              </div>
            </div>

            <div className="pt-stat-pill">
              <img src={mapPinIcon} alt="Provinces" className="pt-stat-icon" />
              <div>
                <strong>9</strong>
                <span>{TEXTS.statProvinces[lang]}</span>
              </div>
            </div>

            <div className="pt-stat-pill">
              <img src={rocketIcon} alt="Transit" className="pt-stat-icon" />
              <div>
                <strong>4h</strong>
                <span>{TEXTS.statHours[lang]}</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="pt-content-wrap">

        {/* ── FEATURED SPOTLIGHT ── */}
        <section className="pt-featured-card">
          <div className="pt-featured-decor" style={{ background: featured.color }} />
          <div className="pt-featured-inner">
            <div className="pt-featured-badge-tag">
              <img src={starIcon} alt="Spotlight" className="pt-3d-tag-icon" />
              <span>{TEXTS.featuredBadge[lang]}</span>
            </div>

            <h2 className="pt-featured-name">{featured.name}</h2>
            <p className="pt-featured-quote">{TEXTS.featuredQuote[lang]}</p>

            <div className="pt-featured-meta">
              <span className="pt-meta-chip">📍 {featured.region[lang]}</span>
              <span className="pt-meta-chip">🌱 {featured.acres}</span>
              <span className="pt-meta-chip">🏆 {TEXTS.since[lang]} {featured.since}</span>
            </div>
          </div>
        </section>

        {/* ── TOOLBAR & FILTER PILLS ── */}
        <div className="pt-toolbar">
          <div className="pt-search-wrap">
            <span className="pt-search-icon">🔍</span>
            <input
              type="search"
              className="pt-search-input"
              placeholder={TEXTS.searchPlaceholder[lang]}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div className="pt-filters-bar">
            {FILTERS.map((f) => (
              <button
                key={f.key}
                type="button"
                className={`pt-filter-pill ${filter === f.key ? 'pt-filter-pill--active' : ''}`}
                onClick={() => setFilter(f.key)}
              >
                <span>{f[lang]}</span>
              </button>
            ))}
          </div>
        </div>

        <p className="pt-results-count">{filtered.length} {TEXTS.results[lang]}</p>

        {/* ── PARTNERS BENTO GRID ── */}
        {filtered.length === 0 ? (
          <div className="pt-empty-box">
            <img src={leafIcon} alt="Empty" className="pt-empty-icon" />
            <h3>{TEXTS.noResults[lang]}</h3>
            <button type="button" className="pt-reset-btn" onClick={() => { setSearch(''); setFilter('all') }}>
              Reset Filters
            </button>
          </div>
        ) : (
          <div className="pt-grid">
            {filtered.map((partner) => (
              <div key={partner.name} className="pt-card">
                <div className="pt-card-top">
                  <div className="pt-card-icon-box" style={{ background: `${partner.color}22`, borderColor: partner.color }}>
                    <span style={{ color: partner.color }}>{partner.name[0]}</span>
                  </div>
                  <span className="pt-card-cat-badge">{partner.category[lang]}</span>
                </div>

                <h3 className="pt-card-title">{partner.name}</h3>

                <div className="pt-card-location">
                  <span>📍 {partner.region[lang]}</span>
                  <span className="pt-card-dot">·</span>
                  <span>{TEXTS.since[lang]} {partner.since}</span>
                </div>

                <div className="pt-card-supplies-box">
                  <span className="pt-supplies-label">{TEXTS.supplies[lang]}:</span>
                  <div className="pt-supplies-chips">
                    {partner.supplies[lang].map((item, i) => (
                      <span key={i} className="pt-supply-chip">
                        {item}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ── BECOME A PARTNER CTA BANNER ── */}
        <section className="pt-cta-banner">
          <div className="pt-cta-left">
            <img src={leafIcon} alt="Partner" className="pt-cta-3d-img" />
            <div>
              <h3 className="pt-cta-title">{TEXTS.ctaTitle[lang]}</h3>
              <p className="pt-cta-sub">{TEXTS.ctaSub[lang]}</p>
            </div>
          </div>
          <Link to="/contact" className="pt-cta-btn">
            <span>{TEXTS.ctaBtn[lang]}</span>
            <span>→</span>
          </Link>
        </section>

      </div>
    </div>
  )
}

export default Partners
