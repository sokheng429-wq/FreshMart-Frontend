import { Link } from 'react-router-dom'
import { useLanguage } from '../context/LanguageContext'
import { Logo } from './Logo'
import './Footer.css'

const LINK_COLUMNS = [
  {
    title: { en: 'Shop', kh: 'ទិញទំនិញ' },
    links: [
      { label: { en: 'Popular Products', kh: 'ផលិតផលពេញនិយម' }, href: '/products' },
      { label: { en: 'Promotion', kh: 'ការផ្សព្វផ្សាយ' }, href: '/promotion' },
      { label: { en: 'New Arrivals', kh: 'មកដល់ថ្មី' }, href: '/products' },
      { label: { en: 'Categories', kh: 'ប្រភេទ' }, href: '/products' },
    ],
  },
  {
    title: { en: 'Company', kh: 'ក្រុមហ៊ុន' },
    links: [
      { label: { en: 'Career', kh: 'ការងារ' }, href: '/career' },
      { label: { en: 'Member', kh: 'សមាជិក' }, href: '/member' },
      { label: { en: 'About Us', kh: 'អំពីយើង' }, href: '/about' },
      { label: { en: 'Contact', kh: 'ទំនាក់ទំនង' }, href: '/contact' },
    ],
  },
  {
    title: { en: 'Support', kh: 'ជំនួយ' },
    links: [
      { label: { en: 'FAQ', kh: 'សំណួរញឹកញាប់' }, href: '/faq' },
      { label: { en: 'Shipping & Delivery', kh: 'ការដឹកជញ្ជូន' }, href: '/shipping' },
      { label: { en: 'Discounts', kh: 'ការបញ្ចុះតម្លៃ' }, href: '/promotion' },
      { label: { en: 'Terms & Privacy', kh: 'លក្ខខណ្ឌ និងឯកជនភាព' }, href: '/terms-privacy' },
    ],
  },
]

const TEXTS = {
  tagline: { en: 'Fresh groceries, delivered fast — everything your kitchen needs, one tap away.', kh: 'គ្រឿងទេសស្រស់ៗ ដឹកជញ្ជូនលឿន — អ្វីគ្រប់យ៉ាងដែលផ្ទះបាយអ្នកត្រូវការ តែមួយចុចប៉ុណ្ណោះ។' },
  getInTouch: { en: 'Get in touch', kh: 'ទំនាក់ទំនង' },
  address: { en: 'Phnom Penh, Cambodia', kh: 'ភ្នំពេញ កម្ពុជា' },
  copyright: { en: "FreshMart. All rights reserved.", kh: 'FreshMart។ រក្សាសិទ្ធិគ្រប់យ៉ាង។' },
  terms: { en: 'Terms', kh: 'លក្ខខណ្ឌ' },
  privacy: { en: 'Privacy', kh: 'ឯកជនភាព' },
  sitemap: { en: 'Sitemap', kh: 'ផែនទីគេហទំព័រ' },
}

export const Footer = () => {
  const { lang } = useLanguage()
  const year = new Date().getFullYear()

  return (
    <footer className="footer">
      <div className="footer-top">
        <div className="footer-brand">
          <Link to="/" className="logo-link">
            <Logo />
          </Link>
          <p className="footer-tagline">{TEXTS.tagline[lang]}</p>

          <div className="footer-social">
            <a href="https://web.facebook.com/profile.php?id=61587630909215" aria-label="Facebook" className="social-icon">
              <FacebookIcon />
            </a>
            <a href="https://instagram.com" aria-label="Instagram" className="social-icon">
              <InstagramIcon />
            </a>
            <a href="https://t.me" aria-label="Telegram" className="social-icon">
              <TelegramIcon />
            </a>
          </div>
        </div>

        <div className="footer-columns">
          {LINK_COLUMNS.map((col) => (
            <div key={col.title.en} className="footer-column">
              <h4 className="footer-heading">{col.title[lang]}</h4>
              <ul className="footer-list">
                {col.links.map((link) => (
                  <li key={link.label.en}>
                    <Link to={link.href} className="footer-link">
                      {link.label[lang]}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}

          <div className="footer-column">
            <h4 className="footer-heading">{TEXTS.getInTouch[lang]}</h4>
            <ul className="footer-list">
              <li className="footer-contact-item">
                <PinIcon />
                <span>{TEXTS.address[lang]}</span>
              </li>
              <li className="footer-contact-item">
                <PhoneIcon />
                <span>+855 11 628 818</span>
              </li>
              <li className="footer-contact-item">
                <MailIcon />
                <span>freshmartcompany@gmail.com</span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      <div className="footer-bottom">
        <p className="footer-copyright">
          &copy; {year} {TEXTS.copyright[lang]}
        </p>
        <div className="footer-bottom-links">
          <Link to="/terms-privacy" className="footer-link-small">{TEXTS.terms[lang]}</Link>
          <Link to="/terms-privacy" className="footer-link-small">{TEXTS.privacy[lang]}</Link>
          <Link to="/sitemap" className="footer-link-small">{TEXTS.sitemap[lang]}</Link>
        </div>
      </div>
    </footer>
  )
}

const FacebookIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
    <path d="M22 12a10 10 0 1 0-11.6 9.87v-6.98H7.9V12h2.5V9.8c0-2.47 1.47-3.84 3.72-3.84 1.08 0 2.2.19 2.2.19v2.42h-1.24c-1.22 0-1.6.76-1.6 1.53V12h2.72l-.44 2.89h-2.28v6.98A10 10 0 0 0 22 12z" />
  </svg>
)

const InstagramIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <rect x="3" y="3" width="18" height="18" rx="5" />
    <circle cx="12" cy="12" r="4" />
    <circle cx="17.5" cy="6.5" r="0.8" fill="currentColor" stroke="none" />
  </svg>
)

const TelegramIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
    <path d="M21.5 3.5 2.7 10.9c-1 .4-1 1.6.1 1.9l4.6 1.5 1.8 5.7c.2.7 1.1.9 1.6.4l2.6-2.5 4.8 3.5c.7.5 1.7.1 1.9-.7l3-16.4c.2-.9-.7-1.6-1.6-1.3ZM8.6 13.6l8.5-6.8c.2-.2.5.1.3.3l-7 7.4-.3 3.6-1.5-4.5Z" />
  </svg>
)

const PinIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
    <circle cx="12" cy="10" r="3" />
  </svg>
)

const PhoneIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1.9.3 1.8.6 2.7a2 2 0 0 1-.5 2.1L8 9.7a16 16 0 0 0 6 6l1.2-1.2a2 2 0 0 1 2.1-.5c.9.3 1.8.5 2.7.6a2 2 0 0 1 1.7 2.3Z" />
  </svg>
)

const MailIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <rect x="2" y="4" width="20" height="16" rx="2" />
    <path d="m2 7 10 6 10-6" />
  </svg>
)

export default Footer