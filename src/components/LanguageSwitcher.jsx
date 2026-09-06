import { useLanguage } from '../context/LanguageContext'
import './LanguageSwitcher.css'
import 'flag-icons/css/flag-icons.min.css'

export const LanguageSwitcher = ({ className = '' }) => {
  const { lang, setLanguage } = useLanguage()

  const isKH = lang === 'kh'

  return (
    <button
      className={`lang-pill ${className}`}
      onClick={() => setLanguage(isKH ? 'en' : 'kh')}
      aria-label={`Switch language to ${isKH ? 'English' : 'Khmer'}`}
      title={`Switch language to ${isKH ? 'English' : 'Khmer'}`}
    >
      <div className="lang-pill-track">
        <span className={`lang-pill-side ${!isKH ? 'lang-pill-side--on' : ''}`}>
          <span className="fi fi-gb" />
        </span>
        <span className={`lang-pill-side ${isKH ? 'lang-pill-side--on' : ''}`}>
          <span className="fi fi-kh" />
        </span>
      </div>
      <div className={`lang-pill-thumb ${isKH ? 'lang-pill-thumb--right' : ''}`}>
        <span className={isKH ? 'fi fi-kh' : 'fi fi-gb'} />
      </div>
    </button>
  )
}

export default LanguageSwitcher
