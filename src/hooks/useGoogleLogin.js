import { useEffect, useRef } from 'react'

// Keep in sync with B-backend application.yml -> app.social.google.client-id.
// Override via VITE_GOOGLE_CLIENT_ID if you use a different client id.
const GOOGLE_CLIENT_ID =
  import.meta.env.VITE_GOOGLE_CLIENT_ID ||
  '457341066065-0ja001e981hnhhe92uffiu7cbqpg6q1v.apps.googleusercontent.com'

const GIS_URL = 'https://accounts.google.com/gsi/client'

// Load the GIS script once for the whole app (module-level promise).
let gisScriptPromise = null

function ensureGisLoaded() {
  if (gisScriptPromise === null) {
    gisScriptPromise = new Promise((resolve, reject) => {
      if (window.google?.accounts?.id) {
        resolve()
        return
      }
      const script = document.createElement('script')
      script.src = GIS_URL
      script.async = true
      script.onload = resolve
      script.onerror = () => {
        gisScriptPromise = null
        reject(new Error('Could not load Google Identity Services'))
      }
      document.head.appendChild(script)
    })
  }
  return gisScriptPromise
}

/**
 * Real Google sign-in for the "Continue with Google" button.
 *
 * Uses the Google Identity Services **Sign In With Google** flow
 * (`google.accounts.id`), which is the flow that issues ID tokens. Google renders
 * its own button into the container the page attaches via `googleButtonRef`
 * (`shape: 'pill'` keeps it looking like a rounded pill). The user clicks Google's
 * real button -> trusted click -> account-chooser popup ALWAYS opens (this is the
 * same mechanism that already opened your popup earlier and showed
 * `origin_mismatch`). The callback's `response.credential` IS the ID token (JWT
 * with aud = client id).
 *
 * The token is NOT validated here: it is sent to the backend, where
 * GoogleSocialVerifier cryptographically verifies it (issuer, audience,
 * email_verified) before any account is created or logged in.
 *
 * @param {object} options
 * @param {(credential: string) => void} options.onToken  called with the ID token
 * @param {(error: Error) => void} [options.onError]
 * @param {'continue_with'|'signup_with'|'signin_with'} [options.text]
 */
export function useGoogleLogin({ onToken, onError, text = 'continue_with' }) {
  const handlersRef = useRef({ onToken, onError })
  const containerRef = useRef(null)

  useEffect(() => {
    handlersRef.current = { onToken, onError }
  })

  // One-time GIS init (idempotent across mounts).
  useEffect(() => {
    ensureGisLoaded()
      .then(() => {
        window.google.accounts.id.initialize({
          client_id: GOOGLE_CLIENT_ID,
          ux_mode: 'popup',
          callback: (response) => {
            // Log the raw response so the browser console shows Google's exact
            // shape/reason instead of our generic message.
            console.log('[useGoogleLogin] GIS callback response:', response)
            if (response?.credential) {
              handlersRef.current.onToken(response.credential)
            } else if (response?.error) {
              const detail = response.error_description ? ` — ${response.error_description}` : ''
              handlersRef.current.onError?.(new Error(`Google sign-in failed: ${response.error}${detail}`))
            } else {
              handlersRef.current.onError?.(new Error('Google sign-in was cancelled'))
            }
          },
        })
      })
      .catch((error) => handlersRef.current.onError?.(error))
  }, [])

  // Render Google's own button (invisible, overlaid on our styled button) so the
  // user's real click lands on it -> trusted click -> popup always opens.
  useEffect(() => {
    const container = containerRef.current
    if (!container) return
    let cancelled = false
    ensureGisLoaded()
      .then(() => {
        if (cancelled || !window.google?.accounts?.id) return
        // StrictMode double-invokes effects in dev — clear any previous iframe.
        container.innerHTML = ''
        const parentWidth = container.parentElement?.clientWidth
        window.google.accounts.id.renderButton(container, {
          type: 'standard',
          theme: 'outline',
          size: 'large',
          text,
          shape: 'pill',
          width: parentWidth && parentWidth > 300 ? parentWidth : 300,
        })
      })
      .catch((error) => handlersRef.current.onError?.(error))
    return () => {
      cancelled = true
    }
  }, [text])

  return { googleButtonRef: containerRef }
}
