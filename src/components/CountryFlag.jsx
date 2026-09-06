import { useState } from 'react'

/**
 * Country flag as a real image (flagcdn.com) instead of an emoji — Windows
 * Chrome renders flag emojis as plain letter pairs ("KH"), so images are the
 * only reliable way to show colored flags there. Falls back to the bare ISO
 * code badge when offline / unknown code.
 */
export const CountryFlag = ({ code, className = '' }) => {
  const [failed, setFailed] = useState(false)
  const iso = String(code || '').toUpperCase().replace(/[^A-Z]/g, '')

  // no valid code → nothing useful to show
  if (iso.length !== 2) return null

  if (failed) {
    // offline or missing asset — emoji where supported, letters elsewhere
    return (
      <span
        aria-hidden="true"
        className={`inline-flex items-center justify-center rounded border border-slate-700/60 bg-slate-800/60 font-mono text-[9px] font-bold tracking-tight text-slate-400 ${className}`}
      >
        {iso}
      </span>
    )
  }

  return (
    <img
      src={`https://flagcdn.com/w80/${iso.toLowerCase()}.png`}
      srcSet={`https://flagcdn.com/w160/${iso.toLowerCase()}.png 2x`}
      alt=""
      loading="lazy"
      onError={() => setFailed(true)}
      className={`inline-block rounded border border-slate-700/60 bg-slate-800/60 object-cover ${className}`}
    />
  )
}
