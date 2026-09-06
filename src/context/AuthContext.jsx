import { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react'

const AuthContext = createContext(null)

// 5 minutes in milliseconds
const INACTIVITY_TIMEOUT_MS = 5 * 60 * 1000

export const AuthProvider = ({ children }) => {
  const [isLoggedIn, setIsLoggedIn] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('isLoggedIn') === 'true'
    }
    return false
  })

  const [user, setUser] = useState(() => {
    if (typeof window !== 'undefined') {
      const savedUser = localStorage.getItem('user')
      return savedUser ? JSON.parse(savedUser) : null
    }
    return null
  })

  // Track whether the session expired due to inactivity (so UI can show a message)
  const [sessionExpired, setSessionExpired] = useState(false)

  // Ref for the inactivity timer so we can clear/reset it
  const inactivityTimer = useRef(null)

  useEffect(() => {
    localStorage.setItem('isLoggedIn', isLoggedIn)
    if (user) {
      localStorage.setItem('user', JSON.stringify(user))
    } else {
      localStorage.removeItem('user')
    }
  }, [isLoggedIn, user])

  // ---- Logout (clears state + notifies backend) ----
  const logout = useCallback(() => {
    const token = localStorage.getItem('token')
    // Tell the backend to evict the token from the activity store
    if (token) {
      fetch('http://localhost:8081/api/auth/logout', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      }).catch(() => {})
    }
    setUser(null)
    setIsLoggedIn(false)
    localStorage.removeItem('token')
    if (inactivityTimer.current) {
      clearTimeout(inactivityTimer.current)
      inactivityTimer.current = null
    }
  }, [])

  // ---- Inactivity auto-logout ----
  const resetInactivityTimer = useCallback(() => {
    if (!localStorage.getItem('token')) return // not logged in

    if (inactivityTimer.current) {
      clearTimeout(inactivityTimer.current)
    }
    inactivityTimer.current = setTimeout(() => {
      // Session expired due to inactivity
      setSessionExpired(true)
      logout()
    }, INACTIVITY_TIMEOUT_MS)
  }, [logout])

  // Set up activity listeners when logged in
  useEffect(() => {
    if (!isLoggedIn) {
      if (inactivityTimer.current) {
        clearTimeout(inactivityTimer.current)
        inactivityTimer.current = null
      }
      return
    }

    const activityEvents = ['mousedown', 'mousemove', 'keydown', 'scroll', 'touchstart', 'click']

    // Throttle: only reset the timer every 30s of activity at most
    let lastActivity = Date.now()
    const THROTTLE_MS = 30000

    const handleActivity = () => {
      const now = Date.now()
      if (now - lastActivity > THROTTLE_MS) {
        lastActivity = now
        resetInactivityTimer()
      }
    }

    // Start the initial timer
    resetInactivityTimer()

    activityEvents.forEach(event => {
      window.addEventListener(event, handleActivity, { passive: true })
    })

    return () => {
      activityEvents.forEach(event => {
        window.removeEventListener(event, handleActivity)
      })
      if (inactivityTimer.current) {
        clearTimeout(inactivityTimer.current)
        inactivityTimer.current = null
      }
    }
  }, [isLoggedIn, resetInactivityTimer])

  // login(data) accepts the backend AuthResponse: { token, tokenType, user }
  const login = (data) => {
    setSessionExpired(false)
    if (data?.token) {
      localStorage.setItem('token', data.token)
    }

    let rawUser = data?.user || (typeof data === 'object' ? data : { name: 'Admin' })
    let rawRole = rawUser?.role || data?.role || 'ADMIN'
    if (Array.isArray(rawUser?.roles) && rawUser.roles.length > 0) {
      const f = rawUser.roles[0]
      rawRole = typeof f === 'string' ? f : f.name || f.role || 'ADMIN'
    }
    const cleanRole = String(rawRole).replace(/^ROLE_/, '').toUpperCase()

    const preparedUser = {
      ...rawUser,
      role: cleanRole,
      name: rawUser.fullName || rawUser.name || rawUser.username || 'Administrator',
    }

    setUser(preparedUser)
    localStorage.setItem('user', JSON.stringify(preparedUser))
    setIsLoggedIn(true)
  }

  const clearSessionExpired = () => setSessionExpired(false)

  return (
    <AuthContext.Provider value={{ isLoggedIn, user, login, logout, sessionExpired, clearSessionExpired }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
