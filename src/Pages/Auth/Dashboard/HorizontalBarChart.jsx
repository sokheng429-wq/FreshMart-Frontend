import { useState, useMemo } from 'react'
import { Link } from 'react-router-dom'

export default function HorizontalBarChart({ categoryData, stockKpis, topLowStock, lang }) {
  const [viewMode, setViewMode] = useState('categories') // 'categories' | 'lowstock'

  const maxVal = useMemo(() => {
    if (viewMode === 'categories') {
      return Math.max(...categoryData.map((c) => c.value || 0), 1)
    }
    return Math.max(...topLowStock.map((p) => Number(p.onHand ?? 0)), 5)
  }, [viewMode, categoryData, topLowStock])

  return (
    <div className="relative flex flex-col justify-between overflow-hidden rounded-3xl border border-slate-700/60 bg-gradient-to-br from-slate-900 via-slate-900/90 to-slate-950 p-6 shadow-xl">
      {/* Top Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-slate-800 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-sky-500/10 text-sky-400 text-sm border border-sky-500/20">
              📊
            </span>
            <h3 className="text-base font-black text-white">
              {viewMode === 'categories'
                ? (lang === 'en' ? 'Category Leaderboard' : 'ចំណាត់ថ្នាក់ប្រភេទផលិតផល')
                : (lang === 'en' ? 'Low Stock Warnings' : 'ការជូនដំណឹងស្តុកទាប')}
            </h3>
          </div>
          <p className="mt-0.5 text-xs text-slate-400">
            {viewMode === 'categories'
              ? (lang === 'en' ? 'Ranking by inventory volume & variety' : 'ចំណាត់ថ្នាក់តាមចំនួនបរិមាណនិងប្រភេទ')
              : (lang === 'en' ? 'Items needing immediate re-order' : 'ទំនិញត្រូវការកម្ម៉ង់បន្ថែមបន្ទាន់')}
          </p>
        </div>

        {/* Filter Toggle */}
        <div className="flex items-center gap-1 rounded-xl bg-slate-800/90 p-1 border border-slate-700/60">
          <button
            type="button"
            onClick={() => setViewMode('categories')}
            className={`rounded-lg px-2.5 py-1 text-[11px] font-bold transition-all ${
              viewMode === 'categories'
                ? 'bg-sky-500 text-slate-950 shadow-md shadow-sky-500/20 font-black'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            {lang === 'en' ? 'By Category' : 'តាមប្រភេទ'}
          </button>
          <button
            type="button"
            onClick={() => setViewMode('lowstock')}
            className={`rounded-lg px-2.5 py-1 text-[11px] font-bold transition-all ${
              viewMode === 'lowstock'
                ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20 font-black'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            {lang === 'en' ? 'Low Stock Alerts' : 'ស្តុកតិច'}
          </button>
        </div>
      </div>

      {/* Bar Chart Body */}
      <div className="my-5 space-y-3.5 max-h-[300px] overflow-y-auto pr-1">
        {viewMode === 'categories' ? (
          categoryData.length === 0 ? (
            <div className="py-12 text-center text-xs text-slate-500">
              {lang === 'en' ? 'No product categories available' : 'មិនទាន់មានទិន្នន័យប្រភេទ'}
            </div>
          ) : (
            categoryData.slice(0, 6).map((cat, index) => {
              const count = cat.value || 0
              const percentage = stockKpis.total > 0 ? Math.round((count / stockKpis.total) * 100) : 0
              const barWidthPercent = Math.min(100, Math.max(8, Math.round((count / maxVal) * 100)))

              const rankStyles = [
                'bg-amber-500/20 text-amber-300 border-amber-500/40', // #1 Gold
                'bg-slate-400/20 text-slate-200 border-slate-400/40', // #2 Silver
                'bg-amber-700/20 text-amber-400 border-amber-700/40', // #3 Bronze
              ]

              return (
                <div key={cat.label?.en || index} className="group rounded-xl p-2 transition-all hover:bg-slate-800/60">
                  <div className="mb-1.5 flex items-center justify-between gap-3 text-xs">
                    <div className="flex items-center gap-2 min-w-0">
                      <span
                        className={`flex h-5 w-5 items-center justify-center rounded-md text-[10px] font-black border ${
                          rankStyles[index] || 'bg-slate-800 text-slate-400 border-slate-700'
                        }`}
                      >
                        #{index + 1}
                      </span>
                      <span className="truncate font-semibold text-slate-200 group-hover:text-white transition-colors">
                        {cat.label?.[lang] || cat.label?.en}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className="font-mono text-xs font-bold text-white">
                        {count} <span className="text-[10px] text-slate-400 font-normal">{lang === 'en' ? 'SKUs' : 'មុខ'}</span>
                      </span>
                      <span
                        className="rounded px-1.5 py-0.5 text-[10px] font-black"
                        style={{
                          backgroundColor: `${cat.color}25`,
                          color: cat.color,
                        }}
                      >
                        {percentage}%
                      </span>
                    </div>
                  </div>

                  {/* Horizontal Bar */}
                  <div className="h-3 w-full overflow-hidden rounded-full bg-slate-800/80 p-0.5 border border-slate-700/30">
                    <div
                      className="h-full rounded-full transition-all duration-700 shadow-sm"
                      style={{
                        width: `${barWidthPercent}%`,
                        background: `linear-gradient(90deg, ${cat.color}99 0%, ${cat.color} 100%)`,
                      }}
                    />
                  </div>
                </div>
              )
            })
          )
        ) : (
          topLowStock.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <span className="text-3xl">✨</span>
              <p className="mt-2 text-xs font-bold text-emerald-400">
                {lang === 'en' ? 'All stock levels are optimal!' : 'ស្តុកទាំងអស់គ្រប់គ្រាន់ល្អ!'}
              </p>
            </div>
          ) : (
            topLowStock.map((prod, index) => {
              const qty = Number(prod.onHand ?? 0)
              const isOut = qty <= 0
              const name = typeof prod.name === 'object' ? (prod.name?.[lang] || prod.name?.en || '—') : (prod.name || '—')
              const barWidthPercent = isOut ? 4 : Math.min(100, Math.max(10, Math.round((qty / 5) * 100)))

              return (
                <div key={prod.id || index} className="group rounded-xl p-2 transition-all hover:bg-slate-800/60">
                  <div className="mb-1.5 flex items-center justify-between gap-3 text-xs">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-sm">{isOut ? '🚨' : '⚠️'}</span>
                      <span className="truncate font-semibold text-slate-200 group-hover:text-white">
                        {name}
                      </span>
                      <span className="hidden sm:inline font-mono text-[10px] text-slate-500">
                        ({prod.barCode || prod.code || '—'})
                      </span>
                    </div>

                    <span
                      className={`rounded-full px-2 py-0.5 text-[10px] font-black border ${
                        isOut
                          ? 'bg-rose-500/20 text-rose-300 border-rose-500/40 animate-pulse'
                          : 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                      }`}
                    >
                      {isOut ? (lang === 'en' ? '0 Out of Stock' : 'អស់ពីស្តុក') : `${qty} on hand`}
                    </span>
                  </div>

                  {/* Stock Bar */}
                  <div className="h-3 w-full overflow-hidden rounded-full bg-slate-800/80 p-0.5 border border-slate-700/30">
                    <div
                      className="h-full rounded-full transition-all duration-700"
                      style={{
                        width: `${barWidthPercent}%`,
                        background: isOut
                          ? '#ef4444'
                          : 'linear-gradient(90deg, #f59e0b 0%, #fbbf24 100%)',
                      }}
                    />
                  </div>
                </div>
              )
            })
          )
        )}
      </div>

      {/* Footer link */}
      <div className="flex items-center justify-between border-t border-slate-800 pt-3 text-xs">
        <span className="text-slate-400">
          {viewMode === 'categories'
            ? (lang === 'en' ? 'Showing top volume categories' : 'បង្ហាញប្រភេទដែលមានចំនួនច្រើន')
            : (lang === 'en' ? 'Prioritize restock orders' : 'ផ្តល់អាទិភាពដល់ការបំពេញស្តុក')}
        </span>
        <Link
          to="/admin/products/all"
          className="font-bold text-sky-400 hover:text-sky-300 hover:underline flex items-center gap-1"
        >
          <span>{lang === 'en' ? 'Full Catalog' : 'កាតាឡុកពេញលេញ'}</span>
          <span>→</span>
        </Link>
      </div>
    </div>
  )
}
