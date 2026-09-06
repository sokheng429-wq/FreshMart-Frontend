import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import './OAuth2Redirect.css'

export const OAuth2Redirect = () => {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { login } = useAuth()
  const [error, setError] = useState('')

  useEffect(() => {
    const token = searchParams.get('token')
    const errorParam = searchParams.get('error')

    if (errorParam) {
      setError(decodeURIComponent(errorParam))
      return
    }

    if (!token) {
      setError('No token received from OAuth2 provider.')
      return
    }

    // The backend already validated the OAuth2 token and created/logged in the user.
    // It hands us back a JWT in the ?token= query param. We just need to fetch the
    // user profile with this JWT and store it in AuthContext.
    fetch('http://localhost:8081/api/users/me', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })
      .then(res => {
        if (!res.ok) throw new Error('Failed to fetch user profile')
        return res.json()
      })
      .then(response => {
        // response should be { success: true, data: { user details } }
        const userData = response.data || response
        login({ token, user: userData })
        navigate('/', { replace: true })
      })
      .catch(() => {
        setError('Failed to fetch user profile. Please try again.')
      })
  }, [searchParams, login, navigate])

  if (error) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        background: 'var(--navy)'
      }}>
        <div style={{ textAlign: 'center', maxWidth: '400px', padding: '2rem' }}>
          <div style={{
            background: '#fdecea',
            color: '#b3261e',
            padding: '1rem',
            borderRadius: '8px',
            marginBottom: '1.5rem'
          }}>
            {error}
          </div>
          <button
            onClick={() => navigate('/login')}
            style={{
              background: 'var(--brand)',
              color: '#fff',
              border: 'none',
              padding: '0.75rem 1.5rem',
              borderRadius: '8px',
              cursor: 'pointer',
              fontWeight: '600'
            }}
          >
            Back to Login
          </button>
        </div>
      </div>
    )
  }

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      background: 'var(--navy)',
      color: 'var(--text-strong)'
    }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{
          width: '48px',
          height: '48px',
          border: '4px solid var(--brand)',
          borderTopColor: 'transparent',
          borderRadius: '50%',
          animation: 'spin 0.8s linear infinite',
          margin: '0 auto 1.5rem'
        }} />
        <p style={{ color: 'var(--text-body)' }}>Signing you in...</p>
      </div>
    </div>
  )
}

export default OAuth2Redirect
