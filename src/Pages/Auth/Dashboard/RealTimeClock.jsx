import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import bagIcon from '../../../assets/icon/3dicons-bag-dynamic-color.png'
import mailIcon from '../../../assets/icon/3dicons-mail-dynamic-color.png'

export default function RealTimeClock({ lang, onRefresh, isRefreshing }) {
  const [time, setTime] = useState(() => new Date())

  useEffect(() => {
    const timer = setInterval(() => {
      setTime(new Date())
    }, 1000)
    return () => clearInterval(timer)
  }, [])

  const hours = time.getHours()
  const minutes = time.getMinutes().toString().padStart(2, '0')
  const seconds = time.getSeconds().toString().padStart(2, '0')
  const isAm = hours < 12
  const formattedHours = (hours % 12 || 12).toString().padStart(2, '0')

  const dateEn = time.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })

  const dateKh = time.toLocaleDateString('km-KH', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  })

  return (
    <div className="relative overflow-hidden rounded-3xl border border-slate-700/60 bg-gradient-to-br from-slate-900 via-slate-900/90 to-slate-950 p-5 lg:p-6 shadow-2xl shadow-black/40">
      {/* Background ambient glow */}
      <div
        className="pointer-events-none absolute -right-16 -top-16 h-72 w-72 rounded-full blur-3xl"
        style={{ background: 'radial-gradient(circle, rgba(119,188,31,0.15) 0%, rgba(59,130,246,0.08) 50%, transparent 80%)' }}
      />
      <div
        className="pointer-events-none absolute -bottom-16 -left-16 h-64 w-64 rounded-full blur-3xl"
        style={{ background: 'radial-gradient(circle, rgba(99,102,241,0.12) 0%, transparent 70%)' }}
      />

      <div className="relative flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
        {/* Left: Real-Time Clock & Date */}
        <div className="flex flex-wrap items-center gap-4 sm:gap-6">
          {/* Digital Clock Box */}
          <div className="flex items-center gap-3.5 rounded-2xl border border-emerald-500/30 bg-emerald-950/20 px-4 py-3 shadow-inner shadow-emerald-500/10 backdrop-blur-md">
            <div className="relative flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-500/20 text-2xl shadow-lg ring-1 ring-emerald-400/40">
              <span>🕒</span>
              <span className="absolute -top-1 -right-1 flex h-3 w-3">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex h-3 w-3 rounded-full bg-emerald-500"></span>
              </span>
            </div>

            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-black uppercase tracking-widest text-emerald-400">
                  {lang === 'en' ? 'Live System Time' : 'ម៉ោងបច្ចុប្បន្នផ្ទាល់'}
                </span>
                <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
              </div>

              <div className="flex items-baseline gap-1 font-mono">
                <span className="text-2xl sm:text-3xl font-black tracking-tight text-white">
                  {formattedHours}:{minutes}
                </span>
                <span className="text-lg sm:text-xl font-bold text-emerald-400 animate-pulse">:</span>
                <span className="text-lg sm:text-xl font-black text-emerald-300">{seconds}</span>
                <span className="ml-1 rounded-md bg-emerald-500/20 px-1.5 py-0.5 text-[10px] font-black text-emerald-300 ring-1 ring-emerald-400/30">
                  {isAm ? 'AM' : 'PM'}
                </span>
              </div>
            </div>
          </div>

          {/* Date Box */}
          <div className="flex items-center gap-3.5 rounded-2xl border border-indigo-500/30 bg-indigo-950/20 px-4 py-3 shadow-inner shadow-indigo-500/10 backdrop-blur-md">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-500/20 text-2xl shadow-lg ring-1 ring-indigo-400/40">
              <span>📅</span>
            </div>
            <div>
              <span className="text-[10px] font-black uppercase tracking-widest text-indigo-400">
                {lang === 'en' ? "Today's Date" : 'កាលបរិច្ឆេទថ្ងៃនេះ'}
              </span>
              <p className="text-sm sm:text-base font-bold text-white leading-tight">
                {lang === 'en' ? dateEn : dateKh}
              </p>
              <span className="text-[10px] text-slate-400">GMT+7 (Phnom Penh)</span>
            </div>
          </div>

          {/* Live System Status Pill */}
          <div className="hidden xl:flex items-center gap-2.5 rounded-2xl border border-cyan-500/20 bg-cyan-950/20 px-3.5 py-3">
            <div className="flex h-3 w-3 items-center justify-center">
              <span className="absolute h-2.5 w-2.5 animate-ping rounded-full bg-cyan-400 opacity-60" />
              <span className="h-2 w-2 rounded-full bg-cyan-400" />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-wider text-cyan-300">
                {lang === 'en' ? 'System Status' : 'ស្ថានភាពប្រព័ន្ធ'}
              </p>
              <p className="text-xs font-bold text-slate-200">
                {lang === 'en' ? 'Online & Synchronized' : 'ដំណើរការ & ធ្វើសមកាលកម្ម'}
              </p>
            </div>
          </div>
        </div>

        {/* Right: Quick Action Shortcuts & Refresh */}
        <div className="flex flex-wrap items-center gap-2.5 sm:gap-3">
          <Link
            to="/admin/products/all"
            className="group flex items-center gap-2 rounded-xl border border-slate-700/60 bg-slate-800/80 px-3.5 py-2.5 text-xs font-bold text-slate-200 transition-all hover:border-emerald-500/60 hover:bg-emerald-500/10 hover:text-emerald-300 hover:shadow-lg hover:shadow-emerald-500/10 active:scale-95"
          >
            <img src={bagIcon} alt="" className="h-4 w-4 object-contain transition-transform group-hover:scale-110" />
            <span>{lang === 'en' ? 'Stock Catalog' : 'កាតាឡុកស្តុក'}</span>
          </Link>

          <Link
            to="/admin/applications"
            className="group flex items-center gap-2 rounded-xl border border-slate-700/60 bg-slate-800/80 px-3.5 py-2.5 text-xs font-bold text-slate-200 transition-all hover:border-purple-500/60 hover:bg-purple-500/10 hover:text-purple-300 hover:shadow-lg hover:shadow-purple-500/10 active:scale-95"
          >
            <img src={mailIcon} alt="" className="h-4 w-4 object-contain transition-transform group-hover:scale-110" />
            <span>{lang === 'en' ? 'Applications' : 'ពាក្យសុំការងារ'}</span>
          </Link>

          <button
            type="button"
            onClick={onRefresh}
            disabled={isRefreshing}
            className={`group flex items-center gap-2 rounded-xl border border-blue-500/40 bg-gradient-to-r from-blue-600/30 to-indigo-600/30 px-3.5 py-2.5 text-xs font-bold text-blue-200 transition-all hover:border-blue-400 hover:from-blue-600/40 hover:to-indigo-600/40 hover:text-white hover:shadow-lg hover:shadow-blue-500/20 active:scale-95 ${
              isRefreshing ? 'opacity-70 cursor-not-allowed' : ''
            }`}
            title={lang === 'en' ? 'Refresh Dashboard Data' : 'ផ្ទុកទិន្នន័យឡើងវិញ'}
          >
            <span className={`text-sm transition-transform duration-700 ${isRefreshing ? 'animate-spin' : 'group-hover:rotate-180'}`}>
              🔄
            </span>
            <span>{isRefreshing ? (lang === 'en' ? 'Syncing…' : 'កំពុងផ្ទុក…') : (lang === 'en' ? 'Sync Data' : 'ធ្វើបច្ចុប្បន្នភាព')}</span>
          </button>
        </div>
      </div>
    </div>
  )
}
