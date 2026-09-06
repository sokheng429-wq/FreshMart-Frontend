import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import './Header2.css'
import { LanguageSwitcher } from './LanguageSwitcher'
import { Logo } from './Logo'
import { useLanguage } from '../context/LanguageContext'
import { useAuth } from '../context/AuthContext'
import { useCart } from '../context/CartContext'

const NAV_LINKS = [
  { label: { en: 'Home', kh: 'ទំព័រដើម' }, href: '/' },
  { label: { en: 'Popular Products', kh: 'ផលិតផលពេញនិយម' }, href: '/products' },
  { label: { en: 'Promotion', kh: 'ការផ្សព្វផ្សាយ' }, href: '/promotion' },
  { label: { en: 'Partners', kh: 'ដៃគូ' }, href: '/partners' },
]

// Only visible to ADMIN users.
const ADMIN_LINK = { label: { en: 'Manage', kh: 'គ្រប់គ្រង' }, href: '/admin' }

export const Header2 = () => {
  const { lang } = useLanguage()
  const { isLoggedIn, user, logout } = useAuth()
  const { totalItems } = useCart()
  const location = useLocation()
  const [mobileOpen, setMobileOpen] = useState(false)
  const isAdmin = user?.role === 'ADMIN'

  const isActive = (href) => {
    if (href === '/') return location.pathname === '/'
    return location.pathname.startsWith(href)
  }

  const cartCount = totalItems

  const t = {
    login: { en: 'Login', kh: 'ចូលគណនី' },
    register: { en: 'Register', kh: 'ចុះឈ្មោះ' },
    profile: { en: 'Profile', kh: 'គណនី' },
  }

  return (
    <header className="h2-header">
      <div className="h2-header-inner">

        {/* Logo */}
        <Link to="/" className="h2-logo-link" onClick={() => setMobileOpen(false)}>
          <Logo />
        </Link>

        {/* Desktop nav links */}
        <nav className="h2-nav-desktop">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              to={link.href}
              className={`h2-nav-link ${isActive(link.href) ? 'h2-nav-link--active' : ''}`}
            >
              {link.label[lang]}
            </Link>
          ))}
          {isAdmin && (
            <Link
              to={ADMIN_LINK.href}
              className={`h2-nav-link h2-nav-admin-link ${isActive(ADMIN_LINK.href) ? 'h2-nav-link--active' : ''}`}
            >
              {ADMIN_LINK.label[lang]}
            </Link>
          )}
        </nav>

        {/* Right side controls */}
        <div className="h2-controls-desktop">
          <LanguageSwitcher />

          {/* Shopping Cart */}
          <Link
            to="/cart"
            className={`h2-nav-cart ${isActive('/cart') ? 'h2-nav-cart--active' : ''}`}
            aria-label="Shopping cart"
          >
            <CartIcon />
            {cartCount > 0 && <span className="h2-nav-cart-badge">{cartCount}</span>}
          </Link>

          {isLoggedIn ? (
            <>
              <Link to="/profile" className="h2-nav-link h2-nav-user-name" title={user?.fullName || user?.name || 'Profile'}>
                {user?.fullName || user?.name || t.profile[lang]}
              </Link>
              <button type="button" onClick={logout} className="h2-nav-link" style={{ background: 'none', border: 'none', cursor: 'pointer', font: 'inherit', color: 'inherit' }}>
                {lang === 'en' ? 'Log Out' : 'ចាកចេញ'}
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className={`h2-nav-link ${isActive('/login') ? 'h2-nav-link--active' : ''}`}>
                {t.login[lang]}
              </Link>

              <Link to="/register" className="h2-btn-brand">
                {t.register[lang]}
              </Link>
            </>
          )}
        </div>

        {/* Mobile hamburger */}
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="h2-mobile-toggle"
          aria-label="Toggle menu"
        >
          {mobileOpen ? <CloseIcon /> : <MenuIcon />}
        </button>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="h2-mobile-menu">
          <nav className="h2-nav-mobile">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                to={link.href}
                className={`h2-nav-link-mobile ${isActive(link.href) ? 'h2-nav-link-mobile--active' : ''}`}
                onClick={() => setMobileOpen(false)}
              >
                {link.label[lang]}
              </Link>
            ))}
            {isAdmin && (
              <Link
                to={ADMIN_LINK.href}
                className={`h2-nav-link-mobile ${isActive(ADMIN_LINK.href) ? 'h2-nav-link-mobile--active' : ''}`}
                onClick={() => setMobileOpen(false)}
              >
                {ADMIN_LINK.label[lang]}
              </Link>
            )}
          </nav>

          <div className="h2-controls-mobile">
            <LanguageSwitcher />
            <Link
              to="/cart"
              className={`h2-nav-cart ${isActive('/cart') ? 'h2-nav-cart--active' : ''}`}
              onClick={() => setMobileOpen(false)}
              aria-label="Shopping cart"
            >
              <CartIcon />
              {cartCount > 0 && <span className="h2-nav-cart-badge">{cartCount}</span>}
            </Link>

            {isLoggedIn ? (
              <>
                <Link
                  to="/profile"
                  className="h2-nav-link-mobile h2-nav-user-name"
                  onClick={() => setMobileOpen(false)}
                  title={user?.fullName || user?.name || 'Profile'}
                >
                  {user?.fullName || user?.name || t.profile[lang]}
                </Link>
                <button
                  type="button"
                  onClick={() => { logout(); setMobileOpen(false); }}
                  className="h2-nav-link-mobile"
                  style={{ background: 'none', border: 'none', cursor: 'pointer', font: 'inherit', color: 'inherit', textAlign: 'left', width: '100%' }}
                >
                  {lang === 'en' ? 'Log Out' : 'ចាកចេញ'}
                </button>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  className={`h2-nav-link-mobile ${isActive('/login') ? 'h2-nav-link-mobile--active' : ''}`}
                  onClick={() => setMobileOpen(false)}
                >
                  {t.login[lang]}
                </Link>
                <Link to="/register" className="h2-btn-brand h2-btn-brand-mobile" onClick={() => setMobileOpen(false)}>
                  {t.register[lang]}
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  )
}

const MenuIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <line x1="3" y1="6" x2="21" y2="6" />
    <line x1="3" y1="12" x2="21" y2="12" />
    <line x1="3" y1="18" x2="21" y2="18" />
  </svg>
)

const CloseIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
)

const CartIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="9" cy="21" r="1" />
    <circle cx="20" cy="21" r="1" />
    <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
  </svg>
)

export default Header2
