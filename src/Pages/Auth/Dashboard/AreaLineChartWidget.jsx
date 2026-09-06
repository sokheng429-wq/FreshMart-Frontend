import { useState, useMemo } from 'react'

export default function AreaLineChartWidget({ monthlyProducts, monthlyActivity, lang }) {
  const [metricMode, setMetricMode] = useState('products') // 'products' | 'activity' | 'combined'
  const [hoveredPoint, setHoveredPoint] = useState(null)

  // 12-month dataset construction
  const chartData = useMemo(() => {
    return monthlyProducts.map((prodMonth, idx) => {
      const actMonth = monthlyActivity[idx] || { value: 0 }
      const prodVal = prodMonth.value || 0
      const actVal = actMonth.value || 0

      let val = prodVal
      if (metricMode === 'activity') val = actVal
      if (metricMode === 'combined') val = prodVal + actVal

      return {
        index: idx,
        monthEn: prodMonth.en,
        monthKh: prodMonth.kh,
        products: prodVal,
        activity: actVal,
        value: val,
      }
    })
  }, [monthlyProducts, monthlyActivity, metricMode])

  // Dimensions & Scale
  const width = 600
  const height = 220
  const padding = { top: 40, right: 30, bottom: 35, left: 35 }
  const innerWidth = width - padding.left - padding.right
  const innerHeight = height - padding.top - padding.bottom

  const maxVal = useMemo(() => {
    const highest = Math.max(...chartData.map((d) => d.value), 1)
    // Add 20% headroom for peak annotation badge
    return Math.ceil(highest * 1.25)
  }, [chartData])

  // Find Peak month
  const peakItem = useMemo(() => {
    let peak = chartData[0]
    chartData.forEach((d) => {
      if (d.value > peak.value) peak = d
    })
    return peak
  }, [chartData])

  // Coordinate mapping
  const points = useMemo(() => {
    return chartData.map((d, i) => {
      const x = padding.left + (i / (chartData.length - 1)) * innerWidth
      const y = padding.top + innerHeight - (d.value / maxVal) * innerHeight
      return { ...d, x, y }
    })
  }, [chartData, maxVal, innerWidth, innerHeight, padding])

  // Generate Smooth Cubic Bezier Path
  const { linePath, areaPath } = useMemo(() => {
    if (points.length < 2) return { linePath: '', areaPath: '' }

    let path = `M ${points[0].x},${points[0].y}`

    for (let i = 0; i < points.length - 1; i++) {
      const current = points[i]
      const next = points[i + 1]
      const controlX = (current.x + next.x) / 2
      path += ` C ${controlX},${current.y} ${controlX},${next.y} ${next.x},${next.y}`
    }

    const baselineY = padding.top + innerHeight
    const area = `${path} L ${points[points.length - 1].x},${baselineY} L ${points[0].x},${baselineY} Z`

    return { linePath: path, areaPath: area }
  }, [points, padding, innerHeight])

  const peakPoint = points[peakItem.index] || points[0]

  // Color config based on mode
  const themeColors = {
    products: { line: '#10b981', gradientId: 'productGrad', fill: '#10b981' },
    activity: { line: '#f59e0b', gradientId: 'activityGrad', fill: '#f59e0b' },
    combined: { line: '#8b5cf6', gradientId: 'combinedGrad', fill: '#8b5cf6' },
  }[metricMode]

  return (
    <div className="relative flex flex-col justify-between overflow-hidden rounded-3xl border border-slate-700/60 bg-gradient-to-br from-slate-900 via-slate-900/90 to-slate-950 p-6 shadow-xl">
      {/* Glow ambient background */}
      <div
        className="pointer-events-none absolute -right-16 -top-16 h-60 w-60 rounded-full blur-3xl opacity-20"
        style={{ background: themeColors.line }}
      />

      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-slate-800 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-400 text-sm border border-emerald-500/20">
              📈
            </span>
            <h3 className="text-base font-black text-white">
              {lang === 'en' ? 'Annual Timeline & Trends' : 'ដំណើរវិវត្តន៍និងនិន្នាការប្រចាំឆ្នាំ'}
            </h3>
            <span className="rounded-full bg-slate-800 px-2 py-0.5 text-[10px] font-mono font-bold text-slate-400 border border-slate-700">
              {new Date().getFullYear()}
            </span>
          </div>
          <p className="mt-0.5 text-xs text-slate-400">
            {lang === 'en'
              ? 'Continuous monthly activity curve with peak volume annotation'
              : 'ខ្សែកោងសកម្មភាពប្រចាំខែជាមួយនឹងចំណុចខ្ពស់បំផុត'}
          </p>
        </div>

        {/* Mode Toggle */}
        <div className="flex items-center gap-1 rounded-xl bg-slate-800/90 p-1 border border-slate-700/60">
          {[
            { id: 'products', label: { en: 'Products', kh: 'ផលិតផល' }, color: 'emerald' },
            { id: 'activity', label: { en: 'Jobs/Apps', kh: 'ការងារ/ពាក្យសុំ' }, color: 'amber' },
            { id: 'combined', label: { en: 'Combined', kh: 'រួមបញ្ចូល' }, color: 'purple' },
          ].map((mode) => (
            <button
              key={mode.id}
              type="button"
              onClick={() => setMetricMode(mode.id)}
              className={`rounded-lg px-2.5 py-1 text-[11px] font-bold transition-all ${
                metricMode === mode.id
                  ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 font-black shadow-md shadow-emerald-500/20'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {mode.label[lang]}
            </button>
          ))}
        </div>
      </div>

      {/* SVG Chart Area */}
      <div className="relative my-4 w-full">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full h-auto overflow-visible select-none"
        >
          <defs>
            <linearGradient id="productGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#10b981" stopOpacity="0.45" />
              <stop offset="80%" stopColor="#10b981" stopOpacity="0.05" />
              <stop offset="100%" stopColor="#10b981" stopOpacity="0" />
            </linearGradient>
            <linearGradient id="activityGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.45" />
              <stop offset="80%" stopColor="#f59e0b" stopOpacity="0.05" />
              <stop offset="100%" stopColor="#f59e0b" stopOpacity="0" />
            </linearGradient>
            <linearGradient id="combinedGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#8b5cf6" stopOpacity="0.45" />
              <stop offset="80%" stopColor="#8b5cf6" stopOpacity="0.05" />
              <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0" />
            </linearGradient>
            <filter id="lineGlow" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="2" stdDeviation="4" floodColor={themeColors.line} floodOpacity="0.5" />
            </filter>
          </defs>

          {/* Horizontal Grid lines */}
          {[0, 0.33, 0.66, 1].map((ratio, i) => {
            const y = padding.top + innerHeight * (1 - ratio)
            const gridVal = Math.round(maxVal * ratio)
            return (
              <g key={i}>
                <line
                  x1={padding.left}
                  y1={y}
                  x2={padding.left + innerWidth}
                  y2={y}
                  stroke="#334155"
                  strokeOpacity="0.4"
                  strokeDasharray="4 4"
                />
                <text
                  x={padding.left - 8}
                  y={y + 4}
                  textAnchor="end"
                  fill="#64748b"
                  fontSize="10"
                  fontFamily="monospace"
                >
                  {gridVal}
                </text>
              </g>
            )
          })}

          {/* Area Fill */}
          <path d={areaPath} fill={`url(#${themeColors.gradientId})`} />

          {/* Smooth Line Curve */}
          <path
            d={linePath}
            fill="none"
            stroke={themeColors.line}
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
            filter="url(#lineGlow)"
          />

          {/* PEAK ANNOTATION CALLOUT */}
          {peakItem.value > 0 && (
            <g
              transform={`translate(${peakPoint.x}, ${peakPoint.y})`}
              className="transition-transform duration-500"
            >
              {/* Pin indicator line */}
              <line x1="0" y1="0" x2="0" y2="-22" stroke={themeColors.line} strokeWidth="1.5" strokeDasharray="2 2" />

              {/* Glowing Peak Bubble */}
              <g transform="translate(0, -24)">
                <rect
                  x="-55"
                  y="-18"
                  width="110"
                  height="22"
                  rx="6"
                  fill="#0f172a"
                  stroke={themeColors.line}
                  strokeWidth="1.5"
                  className="filter drop-shadow-md"
                />
                <text
                  x="0"
                  y="-4"
                  textAnchor="middle"
                  fill="#ffffff"
                  fontSize="10"
                  fontWeight="bold"
                  fontFamily="sans-serif"
                >
                  ⭐ PEAK: {peakItem.value} ({lang === 'kh' ? peakItem.monthKh : peakItem.monthEn})
                </text>
              </g>

              {/* Pulsing peak point dot */}
              <circle r="6" fill={themeColors.line} opacity="0.4" className="animate-ping" />
              <circle r="4" fill="#ffffff" stroke={themeColors.line} strokeWidth="2" />
            </g>
          )}

          {/* Month Axis Labels & Interactive Dots */}
          {points.map((pt, index) => {
            const isHovered = hoveredPoint?.index === index
            const isCurrentMonth = new Date().getMonth() === index

            return (
              <g
                key={index}
                className="cursor-pointer"
                onMouseEnter={() => setHoveredPoint(pt)}
                onMouseLeave={() => setHoveredPoint(null)}
              >
                {/* Invisible hover hotspot */}
                <rect
                  x={pt.x - 20}
                  y={padding.top}
                  width="40"
                  height={innerHeight + padding.bottom}
                  fill="transparent"
                />

                {/* Vertical hover crosshair line */}
                {isHovered && (
                  <line
                    x1={pt.x}
                    y1={padding.top}
                    x2={pt.x}
                    y2={padding.top + innerHeight}
                    stroke="#ffffff"
                    strokeOpacity="0.4"
                    strokeDasharray="3 3"
                  />
                )}

                {/* Data point dot */}
                <circle
                  cx={pt.x}
                  cy={pt.y}
                  r={isHovered ? 6 : isCurrentMonth ? 4 : 3}
                  fill={isHovered ? '#ffffff' : themeColors.line}
                  stroke="#0f172a"
                  strokeWidth="2"
                  className="transition-all duration-200"
                />

                {/* Month label text */}
                <text
                  x={pt.x}
                  y={padding.top + innerHeight + 18}
                  textAnchor="middle"
                  fill={isHovered || isCurrentMonth ? '#ffffff' : '#64748b'}
                  fontWeight={isHovered || isCurrentMonth ? 'bold' : 'normal'}
                  fontSize={isCurrentMonth ? '11' : '10'}
                >
                  {lang === 'kh' ? pt.monthKh : pt.monthEn}
                </text>
              </g>
            )
          })}
        </svg>

        {/* Floating Tooltip when hovering over a point */}
        {hoveredPoint && (
          <div
            className="pointer-events-none absolute -top-12 z-20 flex flex-col rounded-xl border border-slate-700 bg-slate-900/95 px-3 py-2 shadow-2xl backdrop-blur-md transition-all text-xs"
            style={{
              left: `${(hoveredPoint.x / width) * 100}%`,
              transform: 'translateX(-50%)',
            }}
          >
            <div className="flex items-center gap-1.5 font-bold text-white">
              <span className="h-2 w-2 rounded-full" style={{ backgroundColor: themeColors.line }} />
              <span>{lang === 'kh' ? hoveredPoint.monthKh : hoveredPoint.monthEn} {new Date().getFullYear()}</span>
            </div>
            <div className="mt-1 flex items-center justify-between gap-4 font-mono text-[11px] text-slate-300">
              <span>{lang === 'en' ? 'New Items:' : 'បន្ថែមថ្មី:'}</span>
              <span className="font-bold text-emerald-400">{hoveredPoint.value}</span>
            </div>
          </div>
        )}
      </div>

      {/* Summary Footer */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-800 pt-3 text-xs text-slate-400">
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
            <span>{lang === 'en' ? 'Products' : 'ផលិតផល'}</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-amber-500" />
            <span>{lang === 'en' ? 'Jobs/Apps' : 'ការងារ/ពាក្យសុំ'}</span>
          </span>
        </div>

        <div className="font-mono text-[11px] text-slate-400">
          {lang === 'en' ? 'Peak Month:' : 'ខែខ្ពស់បំផុត:'}{' '}
          <span className="font-bold text-white">
            {lang === 'kh' ? peakItem.monthKh : peakItem.monthEn} ({peakItem.value})
          </span>
        </div>
      </div>
    </div>
  )
}
