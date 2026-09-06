import { useEffect, useRef } from 'react'

const FACEBOOK_APP_ID = '1352113810463033'

const SDK_URL = 'https://connect.facebook.net/en_US/sdk.js'

// Load the Facebook JS SDK once for the whole app (module-level promise).
let sdkPromise = null

function ensureSdkLoaded() {
  if (sdkPromise === null) {
    sdkPromise = new Promise((resolve, reject) => {
      // Check if FB SDK is already loaded
      if (window.FB?.login) {
        console.log('[useFacebookLogin] Facebook SDK already loaded')
        resolve()
        return
      }

      console.log('[useFacebookLogin] Loading Facebook SDK...')
      const script = document.createElement('script')
      script.src = SDK_URL
      script.async = true
      script.defer = true
      script.crossOrigin = 'anonymous'
      script.onload = () => {
        console.log('[useFacebookLogin] Facebook SDK script loaded, initializing...')
        window.fbAsyncInit = () => {
          window.FB.init({
            appId: FACEBOOK_APP_ID,
            version: 'v21.0',
            cookie: true,
            xfbml: true,
            status: true,
          })
          console.log('[useFacebookLogin] Facebook SDK initialized with App ID:', FACEBOOK_APP_ID)
          resolve()
        }
        // Trigger init if fbAsyncInit wasn't called
        if (window.FB) {
          window.FB.init({
            appId: FACEBOOK_APP_ID,
            version: 'v21.0',
            cookie: true,
            xfbml: true,
            status: true,
          })
          console.log('[useFacebookLogin] Facebook SDK initialized (manual) with App ID:', FACEBOOK_APP_ID)
          resolve()
        }
      }
      script.onerror = (error) => {
        console.error('[useFacebookLogin] Failed to load Facebook SDK:', error)
        sdkPromise = null
        reject(new Error('Could not load the Facebook SDK'))
      }
      document.head.appendChild(script)
    })
  }
  return sdkPromise
}

/**
 * Real Facebook sign-in for the styled "Continue with Facebook" button.
 *
 * Same pattern as the Google and Telegram buttons: Facebook's OWN login button
 * (`<fb:login-button>`, rendered by the SDK via XFBML) is placed into the invisible
 * overlay container the page attaches via `facebookButtonRef`, on top of our styled
 * pill. The user's real click lands on Facebook's own element → the login popup
 * opens. On success the SDK calls the global `onFacebookLogin`, and we read the
 * access token via `FB.getAuthResponse()` and hand it to `onToken`. The backend
 * FacebookSocialVerifier validates the token against the Graph API before creating
 * or logging in the user.
 *
 * NOTE: Facebook must have the page origin registered as a Valid OAuth Redirect
 * URI on the app, and the app must be in a mode that allows login (dev mode needs
 * the account added as a role/test user).
 *
 * @param {object} options
 * @param {(accessToken: string) => void} options.onToken
 * @param {(error: Error) => void} [options.onError]
 */
export function useFacebookLogin({ onToken, onError }) {
  const handlersRef = useRef({ onToken, onError })
  const containerRef = useRef(null)

  useEffect(() => {
    handlersRef.current = { onToken, onError }
  })

  useEffect(() => {
    const container = containerRef.current
    if (!container) return
    let cancelled = false

    // Global callback for Facebook login
    window.onFacebookLogin = () => {
      console.log('[useFacebookLogin] onFacebookLogin called')
      const auth = window.FB?.getAuthResponse?.()
      console.log('[useFacebookLogin] FB authResponse:', auth)
      if (auth?.accessToken) {
        console.log('[useFacebookLogin] Access token received, passing to onToken handler')
        handlersRef.current.onToken(auth.accessToken)
      } else {
        console.warn('[useFacebookLogin] Facebook login cancelled or no access token')
        handlersRef.current.onError?.(new Error('Facebook login was cancelled'))
      }
    }

    ensureSdkLoaded()
      .then(() => {
        if (cancelled || !window.FB?.XFBML) {
          console.warn('[useFacebookLogin] SDK loaded but component unmounted or XFBML not available')
          return
        }
        // StrictMode double-invokes effects in dev — clear any previous button.
        container.innerHTML = ''
        console.log('[useFacebookLogin] Creating Facebook login button element')
        const btn = document.createElement('fb:login-button')
        btn.setAttribute('scope', 'public_profile,email')
        btn.setAttribute('onlogin', 'onFacebookLogin()')
        btn.setAttribute('data-size', 'large')
        btn.setAttribute('data-width', '400')
        btn.setAttribute('data-button-type', 'continue_with')
        container.appendChild(btn)
        console.log('[useFacebookLogin] Parsing Facebook XFBML')
        window.FB.XFBML.parse(container)
      })
      .catch((error) => {
        console.error('[useFacebookLogin] SDK load error:', error)
        handlersRef.current.onError?.(error)
      })

    return () => {
      cancelled = true
      delete window.onFacebookLogin
      if (container) container.innerHTML = ''
    }
  }, [])

  return { facebookButtonRef: containerRef }
}
