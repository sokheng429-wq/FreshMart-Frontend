/**
 * PageLoader — full-page shimmer skeleton + spinner shown while live data loads.
 * Used by every admin and customer page that fetches from the backend.
 *
 * Props:
 *   loading   {boolean}  — show the loader while true, fade out on false
 *   children  {node}     — actual page content, rendered (hidden) beneath
 *   variant   {'admin'|'shop'} — color theme
 *   rows      {number}   — number of skeleton rows (default 5)
 *   message   {string}   — optional text under the spinner
 */
import { useEffect, useState } from 'react'

export const PageLoader = ({ loading, children, variant = 'admin', rows = 5, message }) => {
  // Keep the overlay mounted briefly after loading=false so the fade plays
  const [visible, setVisible] = useState(loading)
  const [fading, setFading] = useState(false)

  useEffect(() => {
    if (!loading && visible) {
      setFading(true)
      const t = setTimeout(() => {
        setFading(false)
        setVisible(false)
      }, 400)
      return () => clearTimeout(t)
    }
    if (loading && !visible) {
      setVisible(true)
      setFading(false)
    }
  }, [loading, visible])

  const isAdmin = variant === 'admin'
  const green = '#77BC1F'
  const orange = '#FF9900'
  const accent = isAdmin ? green : orange

  return (
    <div style={{ position: 'relative', minHeight: visible ? '320px' : undefined }}>
      {/* Overlay */}
      {visible && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            zIndex: 30,
            opacity: fading ? 0 : 1,
            transition: 'opacity 400ms ease',
            background: isAdmin ? '#0f172a' : '#232F3F',
            borderRadius: '16px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'flex-start',
            padding: '32px 24px',
            gap: '24px',
            overflowY: 'hidden',
          }}
        >
          {/* Spinner */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px', paddingTop: '16px' }}>
            <div style={{ position: 'relative', width: '48px', height: '48px' }}>
              {/* Outer ring */}
              <div style={{
                position: 'absolute', inset: 0,
                borderRadius: '50%',
                border: `3px solid ${accent}22`,
              }} />
              {/* Spinning arc */}
              <div style={{
                position: 'absolute', inset: 0,
                borderRadius: '50%',
                border: `3px solid transparent`,
                borderTopColor: accent,
                animation: 'pl-spin 0.7s linear infinite',
              }} />
              {/* B logo center */}
              <div style={{
                position: 'absolute', inset: '10px',
                borderRadius: '50%',
                background: `${accent}18`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '13px', fontWeight: 900, color: accent,
                fontFamily: 'Montserrat, sans-serif',
              }}>B</div>
            </div>
            {message && (
              <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '12px', fontWeight: 600, fontFamily: 'Montserrat, sans-serif' }}>
                {message}
              </p>
            )}
          </div>

          {/* Skeleton rows */}
          <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {/* Header skeleton */}
            <div style={{ display: 'flex', gap: '12px', alignItems: 'center', marginBottom: '4px' }}>
              <ShimmerBox width="40px" height="40px" radius="10px" accent={accent} delay={0} />
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <ShimmerBox width="45%" height="14px" radius="6px" accent={accent} delay={60} />
                <ShimmerBox width="30%" height="10px" radius="6px" accent={accent} delay={120} />
              </div>
              <ShimmerBox width="80px" height="32px" radius="8px" accent={accent} delay={180} />
            </div>

            {/* KPI row skeleton */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '10px' }}>
              {[0, 1, 2, 3].map((i) => (
                <ShimmerBox key={i} width="100%" height="72px" radius="12px" accent={accent} delay={i * 80} />
              ))}
            </div>

            {/* Table rows skeleton */}
            {Array.from({ length: rows }).map((_, i) => (
              <div key={i} style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                <ShimmerBox width="16px" height="16px" radius="4px" accent={accent} delay={i * 50} />
                <ShimmerBox width="36px" height="36px" radius="8px" accent={accent} delay={i * 50 + 30} />
                <ShimmerBox width={`${50 + (i % 3) * 15}%`} height="12px" radius="6px" accent={accent} delay={i * 50 + 60} />
                <div style={{ flex: 1 }} />
                <ShimmerBox width="60px" height="12px" radius="6px" accent={accent} delay={i * 50 + 90} />
                <ShimmerBox width="50px" height="24px" radius="8px" accent={accent} delay={i * 50 + 120} />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Actual content — always rendered so state is preserved */}
      <div style={{ visibility: visible ? 'hidden' : 'visible', opacity: fading ? 0 : 1, transition: 'opacity 300ms ease' }}>
        {children}
      </div>

      <style>{`
        @keyframes pl-spin { to { transform: rotate(360deg); } }
        @keyframes pl-shimmer {
          0%   { background-position: -400px 0; }
          100% { background-position: 400px 0; }
        }
      `}</style>
    </div>
  )
}

const ShimmerBox = ({ width, height, radius, accent, delay = 0 }) => (
  <div style={{
    width, height,
    borderRadius: radius,
    flexShrink: 0,
    background: `linear-gradient(90deg, rgba(255,255,255,0.04) 25%, rgba(255,255,255,0.09) 50%, rgba(255,255,255,0.04) 75%)`,
    backgroundSize: '400px 100%',
    animation: `pl-shimmer 1.4s ease-in-out ${delay}ms infinite`,
  }} />
)

export default PageLoader
