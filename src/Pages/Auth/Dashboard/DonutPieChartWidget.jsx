import { useState, useMemo } from 'react'

export default function DonutPieChartWidget({ categoryData, stockKpis, appsByStatus, lang }) {
  const [activeTab, setActiveTab] = useState('categories') // 'categories' | 'stock' | 'apps'
  const [hoveredIndex, setHoveredIndex] = useState(null)

  // Compute dataset based on selected tab
  const chartDataset = useMemo(() => {
    if (activeTab === 'categories') {
      const total = categoryData.reduce((sum, item) => sum + (item.value || 0), 0)
      return {
        title: { en: 'Products by Category', kh: 'ផលិតផលតាមប្រភេទ' },
        subtitle: { en: 'Inventory distribution across categories', kh: 'ការបែងចែកស្តុកតាមប្រភេទនីមួយៗ' },
        centerLabel: { en: 'Total SKUs', kh: 'ចំនួន SKU សរុប' },
        total,
        slices: categoryData.map((item, idx) => ({
          id: `cat-${idx}`,
          label: item.label?.[lang] || item.label?.en || 'Other',
          value: item.value || 0,
          color: item.color || '#10b981',
          percentage: total > 0 ? Math.round(((item.value || 0) / total) * 100) : 0,
        })),
      }
    }

    if (activeTab === 'stock') {
      const inStock = Math.max(0, stockKpis.total - stockKpis.lowStock - stockKpis.outOfStock)
      const slices = [
        { id: 'in-stock', label: lang === 'en' ? 'Healthy Stock (>5)' : 'ស្តុកគ្រប់គ្រាន់ (>៥)', value: inStock, color: '#22c55e' },
        { id: 'low-stock', label: lang === 'en' ? 'Low Stock (≤5)' : 'ស្តុកតិច (≤៥)', value: stockKpis.lowStock, color: '#f59e0b' },
        { id: 'out-stock', label: lang === 'en' ? 'Out of Stock (0)' : 'អស់ស្តុក (០)', value: stockKpis.outOfStock, color: '#ef4444' },
      ].filter((s) => s.value > 0)

      const total = stockKpis.total || 0
      return {
        title: { en: 'Inventory Health', kh: 'ស្ថានភាពស្តុកទំនិញ' },
        subtitle: { en: 'Optimal vs low vs out-of-stock items', kh: 'សមាមាត្រស្តុកល្អ ស្តុកតិច និងអស់ស្តុក' },
        centerLabel: { en: 'Total Items', kh: 'ទំនិញសរុប' },
        total,
        slices: slices.map((item) => ({
          ...item,
          percentage: total > 0 ? Math.round((item.value / total) * 100) : 0,
        })),
      }
    }

    // applications
    const appStages = [
      { id: 'PENDING', label: lang === 'en' ? 'Pending' : 'រង់ចាំពិនិត្យ', value: appsByStatus['PENDING'] || 0, color: '#94a3b8' },
      { id: 'REVIEWED', label: lang === 'en' ? 'Under Review' : 'កំពុងពិនិត្យ', value: appsByStatus['REVIEWED'] || 0, color: '#38bdf8' },
      { id: 'SHORTLISTED', label: lang === 'en' ? 'Shortlisted' : 'ជ្រើសរើសបន្ត', value: appsByStatus['SHORTLISTED'] || 0, color: '#f59e0b' },
      { id: 'ACCEPTED', label: lang === 'en' ? 'Accepted' : 'បានទទួល', value: appsByStatus['ACCEPTED'] || 0, color: '#22c55e' },
      { id: 'REJECTED', label: lang === 'en' ? 'Rejected' : 'បដិសេធ', value: appsByStatus['REJECTED'] || 0, color: '#ef4444' },
    ].filter((s) => s.value > 0)

    const total = appStages.reduce((sum, s) => sum + s.value, 0)
    return {
      title: { en: 'Application Funnel', kh: 'ដំណើរការបេក្ខជន' },
      subtitle: { en: 'Candidates by evaluation stage', kh: 'ការបែងចែកបេក្ខជនតាមដំណាក់កាល' },
      centerLabel: { en: 'Applicants', kh: 'បេក្ខជនសរុប' },
      total,
      slices: appStages.map((item) => ({
        ...item,
        percentage: total > 0 ? Math.round((item.value / total) * 100) : 0,
      })),
    }
  }, [activeTab, categoryData, stockKpis, appsByStatus, lang])

  // SVG Donut calculation
  const radius = 64
  const strokeWidth = 24
  const circumference = 2 * Math.PI * radius

  // Compute strokeDasharray and strokeDashoffset for each slice
  let accumulatedOffset = 0
  const renderedSlices = chartDataset.slices.map((slice, index) => {
    const fraction = chartDataset.total > 0 ? slice.value / chartDataset.total : 0
    const strokeDash = fraction * circumference
    const offset = accumulatedOffset
    accumulatedOffset += strokeDash

    return {
      ...slice,
      index,
      strokeDasharray: `${strokeDash} ${circumference - strokeDash}`,
      strokeDashoffset: -offset,
    }
  })

  const currentHovered = hoveredIndex !== null ? chartDataset.slices[hoveredIndex] : null

  return (
    <div className="relative flex flex-col justify-between overflow-hidden rounded-3xl border border-slate-700/60 bg-gradient-to-br from-slate-900 via-slate-900/90 to-slate-950 p-6 shadow-xl">
      {/* Background radial glow */}
      <div
        className="pointer-events-none absolute -right-12 -top-12 h-48 w-48 rounded-full blur-3xl opacity-30"
        style={{
          background: currentHovered ? currentHovered.color : '#10b981',
          transition: 'background 0.5s ease',
        }}
      />

      {/* Header with Title & Tab Switchers */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-slate-800 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-400 text-sm border border-emerald-500/20">
              🍩
            </span>
            <h3 className="text-base font-black text-white">{chartDataset.title[lang]}</h3>
          </div>
          <p className="mt-0.5 text-xs text-slate-400">{chartDataset.subtitle[lang]}</p>
        </div>

        {/* Tab Switcher Pills */}
        <div className="flex items-center gap-1 rounded-xl bg-slate-800/90 p-1 border border-slate-700/60">
          {[
            { id: 'categories', label: { en: 'Categories', kh: 'ប្រភេទ' } },
            { id: 'stock', label: { en: 'Health', kh: 'សុខភាពស្តុក' } },
            { id: 'apps', label: { en: 'Pipeline', kh: 'បេក្ខជន' } },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => {
                setActiveTab(tab.id)
                setHoveredIndex(null)
              }}
              className={`rounded-lg px-2.5 py-1 text-[11px] font-bold transition-all ${
                activeTab === tab.id
                  ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20 font-black'
                  : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
              }`}
            >
              {tab.label[lang]}
            </button>
          ))}
        </div>
      </div>

      {/* Body: Donut SVG + Interactive Legend */}
      <div className="my-6 grid grid-cols-1 items-center gap-6 md:grid-cols-12">
        {/* SVG Donut Center */}
        <div className="flex items-center justify-center md:col-span-6">
          <div className="relative flex h-52 w-52 items-center justify-center">
            {chartDataset.total === 0 ? (
              <div className="flex flex-col items-center text-center">
                <span className="text-3xl">📊</span>
                <p className="mt-2 text-xs font-bold text-slate-500">
                  {lang === 'en' ? 'No data recorded' : 'មិនទាន់មានទិន្នន័យ'}
                </p>
              </div>
            ) : (
              <>
                <svg className="h-full w-full -rotate-90 transform" viewBox="0 0 160 160">
                  {/* Background Track Circle */}
                  <circle
                    cx="80"
                    cy="80"
                    r={radius}
                    fill="transparent"
                    stroke="#1e293b"
                    strokeWidth={strokeWidth}
                  />

                  {/* Dynamic Donut Arcs */}
                  {renderedSlices.map((slice) => {
                    const isHovered = hoveredIndex === slice.index
                    return (
                      <circle
                        key={slice.id}
                        cx="80"
                        cy="80"
                        r={radius}
                        fill="transparent"
                        stroke={slice.color}
                        strokeWidth={isHovered ? strokeWidth + 4 : strokeWidth}
                        strokeDasharray={slice.strokeDasharray}
                        strokeDashoffset={slice.strokeDashoffset}
                        className="cursor-pointer transition-all duration-300"
                        style={{
                          filter: isHovered ? `drop-shadow(0 0 8px ${slice.color})` : 'none',
                          opacity: hoveredIndex !== null && !isHovered ? 0.45 : 1,
                        }}
                        onMouseEnter={() => setHoveredIndex(slice.index)}
                        onMouseLeave={() => setHoveredIndex(null)}
                      />
                    )
                  })}
                </svg>

                {/* Donut Center Display */}
                <div className="pointer-events-none absolute flex flex-col items-center justify-center text-center px-4">
                  {currentHovered ? (
                    <>
                      <span
                        className="text-2xl font-black transition-all"
                        style={{ color: currentHovered.color }}
                      >
                        {currentHovered.percentage}%
                      </span>
                      <p className="max-w-[100px] truncate text-[11px] font-bold text-white">
                        {currentHovered.label}
                      </p>
                      <span className="text-[10px] font-mono text-slate-400">
                        {currentHovered.value} {lang === 'en' ? 'items' : 'មុខ'}
                      </span>
                    </>
                  ) : (
                    <>
                      <span className="text-3xl font-black tracking-tight text-white">
                        {chartDataset.total}
                      </span>
                      <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                        {chartDataset.centerLabel[lang]}
                      </p>
                    </>
                  )}
                </div>
              </>
            )}
          </div>
        </div>

        {/* Legend List */}
        <div className="flex flex-col justify-center space-y-2 md:col-span-6 max-h-56 overflow-y-auto pr-1">
          {chartDataset.slices.length === 0 ? (
            <p className="text-center text-xs text-slate-500">
              {lang === 'en' ? 'No items available' : 'មិនមានទិន្នន័យ'}
            </p>
          ) : (
            chartDataset.slices.map((slice, idx) => {
              const isHovered = hoveredIndex === idx
              return (
                <div
                  key={slice.id}
                  onMouseEnter={() => setHoveredIndex(idx)}
                  onMouseLeave={() => setHoveredIndex(null)}
                  className={`flex cursor-pointer items-center justify-between gap-2 rounded-xl p-2 transition-all ${
                    isHovered
                      ? 'bg-slate-800 shadow-md ring-1 ring-slate-600 scale-[1.02]'
                      : 'hover:bg-slate-800/50'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span
                      className="h-3 w-3 rounded-full flex-shrink-0 shadow-sm"
                      style={{ backgroundColor: slice.color }}
                    />
                    <span className="truncate text-xs font-semibold text-slate-200">
                      {slice.label}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className="font-mono text-xs font-bold text-white">{slice.value}</span>
                    <span
                      className="rounded-md px-1.5 py-0.5 text-[10px] font-black"
                      style={{
                        backgroundColor: `${slice.color}20`,
                        color: slice.color,
                      }}
                    >
                      {slice.percentage}%
                    </span>
                  </div>
                </div>
              )
            })
          )}
        </div>
      </div>

      {/* Footer Insight Note */}
      <div className="flex items-center justify-between border-t border-slate-800 pt-3 text-[11px] text-slate-400">
        <span>{lang === 'en' ? 'Hover slices for interactive breakdown' : 'ដាក់ព្រួញកណ្ដុរដើម្បីមើលភាគរយ'}</span>
        <span className="font-mono text-emerald-400">100% {lang === 'en' ? 'Live' : 'ផ្ទាល់'}</span>
      </div>
    </div>
  )
}
