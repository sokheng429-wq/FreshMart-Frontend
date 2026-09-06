import React from 'react'
import './Logo.css'

export const Logo = ({ size = 'normal', showSubtitle = true, className = '' }) => (
  <div className={`brand-logo brand-logo--${size} ${className}`}>
    <div className="brand-logo-icon-wrap">
      <svg
        className="brand-logo-svg"
        viewBox="0 0 44 44"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        <defs>
          <linearGradient id="fm-grad-green" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#8EE026" />
            <stop offset="100%" stopColor="#67AC12" />
          </linearGradient>
          <linearGradient id="fm-grad-orange" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FFAE1A" />
            <stop offset="100%" stopColor="#FF8000" />
          </linearGradient>
          <linearGradient id="fm-bg-grad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#1E2A38" />
            <stop offset="100%" stopColor="#111822" />
          </linearGradient>
          <filter id="fm-glow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="2" stdDeviation="3" floodColor="#77BC1F" floodOpacity="0.35" />
          </filter>
        </defs>

        {/* Rounded Container */}
        <rect width="44" height="44" rx="12" fill="url(#fm-bg-grad)" stroke="#2F4056" strokeWidth="1.2" />

        {/* Grocery Bag / Cart Outline */}
        <path
          d="M13 18C13 16.3431 14.3431 15 16 15H28C29.6569 15 31 16.3431 31 18L32.2 29.2C32.3353 30.418 31.3854 31.5 30.1578 31.5H13.8422C12.6146 31.5 11.6647 30.418 11.8 29.2L13 18Z"
          fill="url(#fm-grad-green)"
          filter="url(#fm-glow)"
        />

        {/* Bag Handle */}
        <path
          d="M18 15V12C18 9.79086 19.7909 8 22 8C24.2091 8 26 9.79086 26 12V15"
          stroke="url(#fm-grad-orange)"
          strokeWidth="2.8"
          strokeLinecap="round"
        />

        {/* Fresh Leaf Icon Inside */}
        <path
          d="M22 19C25.5 19 28 22 27 25C24.5 25.5 21 24.5 20 22C19.5 20.5 20.5 19 22 19Z"
          fill="#FFFFFF"
          opacity="0.95"
        />
        <path
          d="M22 19C22 22.5 23.5 24 25.5 25"
          stroke="url(#fm-grad-green)"
          strokeWidth="1.2"
          strokeLinecap="round"
        />

        {/* Accent Sparkle Dot */}
        <circle cx="31" cy="13" r="2" fill="url(#fm-grad-orange)" />
      </svg>
    </div>

    <div className="brand-logo-text">
      <div className="brand-logo-title">
        <span className="brand-logo-title-fresh">FRESH</span>
        <span className="brand-logo-title-mart">MART</span>
      </div>
      {showSubtitle && (
        <span className="brand-logo-subtitle">SUPERMARKET</span>
      )}
    </div>
  </div>
)

export default Logo