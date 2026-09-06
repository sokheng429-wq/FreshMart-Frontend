import { createContext, useContext, useState, useEffect } from 'react'

const LanguageContext = createContext(null)

export const LanguageProvider = ({ children }) => {
  const [lang, setLang] = useState(() => {
    // Load from localStorage on initial render
    if (typeof window !== 'undefined') {
      return localStorage.getItem('app-lang') || 'en'
    }
    return 'en'
  })

  // Persist to localStorage whenever language changes
  useEffect(() => {
    localStorage.setItem('app-lang', lang)
    // Optional: update document lang attribute
    document.documentElement.lang = lang === 'kh' ? 'km' : 'en'
  }, [lang])

  const toggleLang = () => setLang(l => l === 'en' ? 'kh' : 'en')
  const setLanguage = (newLang) => setLang(newLang)

  return (
    <LanguageContext.Provider value={{ lang, toggleLang, setLanguage }}>
      {children}
    </LanguageContext.Provider>
  )
}

export const useLanguage = () => {
  const context = useContext(LanguageContext)
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider')
  }
  return context
}