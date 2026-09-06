import { useEffect, useMemo, useState } from 'react'
import { PRODUCTS, CATEGORIES, FALLBACK_IMG } from '../../data/products'
import { adminProductAPI, adminCategoryAPI, productAPI } from '../../api/api'
import { ProductShop } from '../../components/ProductShop'
import { useLanguage } from '../../context/LanguageContext'

// 3D Icons
import starIcon from '../../assets/icon/3dicons-star-dynamic-color.png'
import flashIcon from '../../assets/icon/3dicons-flash-dynamic-color.png'
import leafIcon from '../../assets/icon/3dicons-leaf-dynamic-color.png'
import shieldIcon from '../../assets/icon/3dicons-shield-dynamic-color.png'

import './Popular Products.css'

const TEXTS = {
  eyebrow: { en: 'Handpicked · 4°C Fresh · Direct Harvest', kh: 'ជ្រើសរើសដោយដៃ · ត្រជាក់ ៤°C · ប្រមូលផលផ្ទាល់' },
  title1: { en: 'Popular Store Products &', kh: 'ផលិតផលពេញនិយម និង' },
  title2: { en: 'Fresh Market', kh: 'ទីផ្សារស្រស់ៗ' },
  subtitle: {
    en: 'Over 250+ organic vegetables, sun-ripened fruits, farm-fresh poultry, and artisan groceries delivered to your door in 45 minutes.',
    kh: 'បន្លែសរីរាង្គជាង ២៥០+ ផ្លែឈើទុំស្រស់ៗ សាច់ស្រស់ពីកសិដ្ឋាន និងគ្រឿងទេសគុណភាពខ្ពស់ ដឹកជញ្ជូនដល់ផ្ទះក្នុង ៤៥ នាទី។',
  },
  statDelivery: { en: '45-Min Cold Dispatch', kh: 'ដឹកជញ្ជូនត្រជាក់ ៤៥ នាទី' },
  statProducts: { en: 'Daily Harvest Batch', kh: 'ប្រមូលផលស្រស់រាល់ថ្ងៃ' },
  statRating: { en: '4.9★ Customer Satisfaction', kh: 'ការពេញចិត្ត ៤.៩★' },
  statPesticide: { en: '100% Pesticide-Free', kh: 'គ្មានជាតិគីមី ១០០%' },
}

const extractArray = (res) => {
  if (Array.isArray(res)) return res
  if (Array.isArray(res?.data)) return res.data
  if (Array.isArray(res?.content)) return res.content
  if (Array.isArray(res?.products)) return res.products
  if (Array.isArray(res?.items)) return res.items
  return []
}

const mapLiveCategories = (cats) =>
  cats
    .filter((c) => c.active !== false)
    .map((c) => {
      const desc = String(c.description || c.name || c.code || '')
      const kh = String(c.nameKh || c.name || desc)
      return {
        key: desc,
        icon: '🛍️',
        en: desc,
        kh: kh,
      }
    })
    .filter((c) => c.key)

const mapBackendProduct = (item) => {
  const id = item.id || Math.random()
  const nameEn = String(item.name || item.fullName || item.title || 'Fresh Product')
  const nameKh = String(item.nameKh || item.name || item.title || nameEn)

  let img = item.imageUrl || item.image || item.photoUrl || null
  if (typeof img === 'string' && img.startsWith('/')) {
    img = `http://localhost:8081${img}`
  }

  const price = Number(item.basePrice ?? item.price ?? 0) || 0
  const oldPrice = item.averageCost || item.standardCost || (item.allowDiscount ? price * 1.2 : null)

  const uomEn = item.uom || item.unit || 'piece'
  const uomKh = item.uom || item.unit || 'ដុំ'

  const cat = String(item.category || item.productGroup || 'Organic Produce')

  return {
    id,
    code: item.code || `PROD-${id}`,
    category: cat,
    name: { en: nameEn, kh: nameKh },
    price,
    oldPrice: oldPrice ? Number(oldPrice) : null,
    unit: { en: uomEn, kh: uomKh },
    weight: item.weight || (item.uom === 'kg' ? '1kg' : item.uom === 'g' ? '500g' : ''),
    rating: item.rating ? Number(item.rating) : 4.5 + ((Number(id) || 0) % 5) / 10,
    sold: item.sold ? Number(item.sold) : 100 + ((Number(id) * 137) % 2400),
    badge: item.favorite ? { en: 'Popular', kh: 'ពេញនិយម' } : item.active ? { en: 'Fresh Today', kh: 'ស្រស់ថ្ងៃនេះ' } : null,
    image: img || FALLBACK_IMG,
    origin: item.country ? { en: item.country, kh: item.country } : { en: 'Cambodia', kh: 'កម្ពុជា' },
    desc: {
      en: String(item.description || `${nameEn} sourced fresh from verified local growers.`),
      kh: String(item.description || `${nameKh} ប្រមូលផលស្រស់ពីកសិដ្ឋានក្នុងស្រុក។`),
    },
  }
}

export const PopularProducts = () => {
  const { lang } = useLanguage()
  const [shopProducts, setShopProducts] = useState(PRODUCTS)
  const [isLive, setIsLive] = useState(false)
  const [shopCategories, setShopCategories] = useState(CATEGORIES)

  useEffect(() => {
    let cancelled = false

    const loadLiveData = async () => {
      // 1. Fetch live products from backend
      try {
        let res
        try {
          res = await adminProductAPI.getAll()
        } catch {
          res = await productAPI.getAll()
        }

        const rawList = extractArray(res)
        if (!cancelled && rawList.length > 0) {
          setShopProducts(rawList.map(mapBackendProduct))
          setIsLive(true)
        }
      } catch (err) {
        // Fall back to default catalog on error or empty
        void err
      }

      // 2. Fetch live master-data categories
      try {
        const catRes = await adminCategoryAPI.getAll()
        const rawCats = extractArray(catRes)
        const mapped = mapLiveCategories(rawCats)
        if (!cancelled && mapped.length > 0) {
          setShopCategories(mapped)
        }
      } catch (err) {
        void err
      }
    }

    loadLiveData()
    return () => { cancelled = true }
  }, [])

  const railCategories = useMemo(() => {
    if (!isLive) return CATEGORIES
    if (shopCategories !== CATEGORIES && shopCategories.length > 0) return shopCategories
    const used = [...new Set(shopProducts.map((p) => p.category).filter(Boolean))]
    if (used.length === 0) return []
    return used.map((c) => ({ key: c, icon: '🛍️', en: c, kh: c }))
  }, [isLive, shopCategories, shopProducts])

  return (
    <section className="popular-products">
      {/* ── HERO BANNER ── */}
      <div className="pp-hero">
        <div className="pp-hero-inner">
          <span className="pp-eyebrow">
            <img src={starIcon} alt="Star" className="pp-3d-icon-sm" />
            <span>{TEXTS.eyebrow[lang]}</span>
          </span>

          <h1 className="pp-title">
            {TEXTS.title1[lang]} <span className="pp-title-highlight">{TEXTS.title2[lang]}</span>
          </h1>

          <p className="pp-subtitle">{TEXTS.subtitle[lang]}</p>

          <div className="pp-stats">
            <span className="pp-stat">
              <img src={flashIcon} alt="Express" className="pp-3d-stat-icon" />
              <span>{TEXTS.statDelivery[lang]}</span>
            </span>

            <span className="pp-stat">
              <img src={leafIcon} alt="Fresh" className="pp-3d-stat-icon" />
              <span>{isLive ? `${shopProducts.length}+ ${lang === 'en' ? 'Live Products' : 'ផលិតផល'}` : TEXTS.statProducts[lang]}</span>
            </span>

            <span className="pp-stat">
              <img src={shieldIcon} alt="Quality" className="pp-3d-stat-icon" />
              <span>{TEXTS.statPesticide[lang]}</span>
            </span>
          </div>
        </div>
      </div>

      {/* ── PRODUCT SHOPPING FEED ── */}
      <div className="pp-inner">
        <ProductShop products={shopProducts} categories={railCategories} />
      </div>
    </section>
  )
}

export default PopularProducts
