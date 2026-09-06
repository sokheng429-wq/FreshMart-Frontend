import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import './Header.css'
import { LanguageSwitcher } from './LanguageSwitcher'
import { Logo } from './Logo'
import { useLanguage } from '../context/LanguageContext'
import { useAuth } from '../context/AuthContext'
import { useCart } from '../context/CartContext'

const NAV_LINKS = [
  { label: { en: 'Home', kh: 'ទំព័រដើម' }, href: '/' },
  { label: { en: 'Member', kh: 'សមាជិក' }, href: '/member' },
  { label: { en: 'Career', kh: 'ការងារ' }, href: '/career' },
  { label: { en: 'Contact', kh: 'ទំនាក់ទំនង' }, href: '/contact' },
  { label: { en: 'About Us', kh: 'អំពីយើង' }, href: '/about' },
]

// Only visible to ADMIN users; link is a button-style CTA next to About Us.
const ADMIN_LINK = { label: { en: 'Manage', kh: 'គ្រប់គ្រង' }, href: '/admin' }

export const Header = () => {
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
    <header className="header">
      <div className="header-inner">

        {/* Logo */}
        <Link to="/" className="logo-link" onClick={() => setMobileOpen(false)}>
          <Logo />
        </Link>

        {/* Desktop nav links */}
        <nav className="nav-desktop">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              to={link.href}
              className={`nav-link ${isActive(link.href) ? 'nav-link--active' : ''}`}
            >
              {link.label[lang]}
            </Link>
          ))}
          {isAdmin && (
            <Link
              to={ADMIN_LINK.href}
              className={`nav-link nav-admin-link ${isActive(ADMIN_LINK.href) ? 'nav-link--active' : ''}`}
            >
              {ADMIN_LINK.label[lang]}
            </Link>
          )}
        </nav>

        {/* Right side controls */}
        <div className="controls-desktop">
          <LanguageSwitcher />

          {/* Shopping Cart */}
          {/* <Link
            to="/cart"
            className={`nav-cart ${isActive('/cart') ? 'nav-cart--active' : ''}`}
            aria-label="Shopping cart"
          >
            <CartIcon />
            {cartCount > 0 && <span className="nav-cart-badge">{cartCount}</span>}
          </Link>
          */}

          {isLoggedIn ? (
            <>
              <Link to="/profile" className="nav-link nav-user-name" title={user?.fullName || user?.name || 'Profile'}>
                {user?.fullName || user?.name || t.profile[lang]}
              </Link>
              <button type="button" onClick={logout} className="nav-link" style={{ background: 'none', border: 'none', cursor: 'pointer', font: 'inherit', color: 'inherit' }}>
                {lang === 'en' ? 'Log Out' : 'ចាកចេញ'}
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className={`nav-link ${isActive('/login') ? 'nav-link--active' : ''}`}>
                {t.login[lang]}
              </Link>

              <Link to="/register" className="btn-brand">
                {t.register[lang]}
              </Link>
            </>
          )}
        </div>

        {/* Mobile hamburger */}
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="mobile-toggle"
          aria-label="Toggle menu"
        >
          {mobileOpen ? <CloseIcon /> : <MenuIcon />}
        </button>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="mobile-menu">
          <nav className="nav-mobile">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                to={link.href}
                className={`nav-link-mobile ${isActive(link.href) ? 'nav-link-mobile--active' : ''}`}
                onClick={() => setMobileOpen(false)}
              >
                {link.label[lang]}
              </Link>
            ))}
            {isAdmin && (
              <Link
                to={ADMIN_LINK.href}
                className={`nav-link-mobile ${isActive(ADMIN_LINK.href) ? 'nav-link-mobile--active' : ''}`}
                onClick={() => setMobileOpen(false)}
              >
                {ADMIN_LINK.label[lang]}
              </Link>
            )}
          </nav>

          <div className="controls-mobile">
            <LanguageSwitcher />
            <Link
              to="/cart"
              className={`nav-cart ${isActive('/cart') ? 'nav-cart--active' : ''}`}
              onClick={() => setMobileOpen(false)}
              aria-label="Shopping cart"
            >
              <CartIcon />
              {cartCount > 0 && <span className="nav-cart-badge">{cartCount}</span>}
            </Link>
            {isLoggedIn ? (
              <>
                <Link
                  to="/profile"
                  className="nav-link nav-user-name"
                  onClick={() => setMobileOpen(false)}
                  title={user?.fullName || user?.name || 'Profile'}
                >
                  {user?.fullName || user?.name || t.profile[lang]}
                </Link>
                <button
                  type="button"
                  onClick={() => { logout(); setMobileOpen(false); }}
                  className="nav-link"
                  style={{ background: 'none', border: 'none', cursor: 'pointer', font: 'inherit', color: 'inherit', textAlign: 'left', padding: '0.5rem 0' }}
                >
                  {lang === 'en' ? 'Log Out' : 'ចាកចេញ'}
                </button>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  className={`nav-link ${isActive('/login') ? 'nav-link--active' : ''}`}
                  onClick={() => setMobileOpen(false)}
                >
                  {t.login[lang]}
                </Link>
                <Link to="/register" className="btn-brand btn-brand-mobile" onClick={() => setMobileOpen(false)}>
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

export default Header