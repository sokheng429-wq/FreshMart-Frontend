import { Link, useLocation } from 'react-router-dom'
import { useLanguage } from '../context/LanguageContext'
import { useAuth } from '../context/AuthContext'
import './ShopSidebar.css'

const SHOP_ITEMS = [
  { href: '/products', icon: '🛍️', en: 'All Products', kh: 'ផលិតផលទាំងអស់' },
  { href: '/promotion', icon: '🔥', en: 'Promotion', kh: 'ការផ្សព្វផ្សាយ' },
  { href: '/partners', icon: '🤝', en: 'Partners', kh: 'ដៃគូ' },
]

const ACCOUNT_ITEMS = [
  { href: '/orders', icon: '📦', en: 'My Orders', kh: 'ការបញ្ជាទិញរបស់ខ្ញុំ' },
  { href: '/tracking', icon: '🛵', en: 'Track Order', kh: 'តាមដានការដឹកជញ្ជូន' },
]

const TEXTS = {
  shop: { en: 'Shop', kh: 'ហាង' },
  account: { en: 'My Account', kh: 'គណនីរបស់ខ្ញុំ' },
}

export const ShopSidebar = () => {
  const { lang } = useLanguage()
  const { isLoggedIn } = useAuth()
  const location = useLocation()

  const isActive = (href) => {
    if (href === '/products') {
      return location.pathname === '/products' || location.pathname.startsWith('/product-detail')
    }
    return location.pathname.startsWith(href)
  }

  return (
    <aside className="shop-sidebar" aria-label="Shop navigation">
      <p className="shop-sidebar-title">{TEXTS.shop[lang]}</p>
      <nav className="shop-sidebar-nav">
        {SHOP_ITEMS.map((it) => (
          <Link
            key={it.href}
            to={it.href}
            className={`shop-sidebar-link ${isActive(it.href) ? 'shop-sidebar-link--on' : ''}`}
          >
            <span aria-hidden="true">{it.icon}</span>
            {it[lang]}
          </Link>
        ))}
      </nav>

      {isLoggedIn && (
        <>
          <p className="shop-sidebar-title shop-sidebar-title--acct">{TEXTS.account[lang]}</p>
          <nav className="shop-sidebar-nav">
            {ACCOUNT_ITEMS.map((it) => (
              <Link
                key={it.href}
                to={it.href}
                className={`shop-sidebar-link ${isActive(it.href) ? 'shop-sidebar-link--on' : ''}`}
              >
                <span aria-hidden="true">{it.icon}</span>
                {it[lang]}
              </Link>
            ))}
          </nav>
        </>
      )}
    </aside>
  )
}

export const ShopLayout = ({ children }) => (
  <div className="shop-layout">
    <ShopSidebar />
    <div className="shop-layout-main">{children}</div>
  </div>
)

export default ShopLayout
