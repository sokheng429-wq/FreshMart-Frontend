import { Link } from 'react-router-dom'
import bagIcon from '../../../assets/icon/3dicons-bag-dynamic-color.png'
import targetIcon from '../../../assets/icon/3dicons-target-dynamic-color.png'
import trophyIcon from '../../../assets/icon/3dicons-trophy-dynamic-color.png'
import mailIcon from '../../../assets/icon/3dicons-mail-dynamic-color.png'
import shieldIcon from '../../../assets/icon/3dicons-shield-dynamic-color.png'

export default function StatCards({ dashboardData, stockKpis, appsByStatus, lang, isAdmin }) {
  const formatCurrency = (val) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0,
    }).format(val || 0)
  }

  const primaryStats = [
    {
      id: 'products',
      title: { en: 'Total Stock SKUs', kh: 'ទំនិញស្តុកសរុប' },
      value: stockKpis.total,
      subtext: {
        en: `${stockKpis.active} active in catalog`,
        kh: `${stockKpis.active} សកម្មក្នុងកាតាឡុក`,
      },
      badge: { en: 'Catalog', kh: 'កាតាឡុក' },
      trend: { en: '+100% Live', kh: '+១០០% ផ្ទាល់' },
      icon: bagIcon,
      accentColor: '#10b981', // emerald
      gradient: 'from-emerald-500/20 via-slate-900 to-slate-900',
      borderGlow: 'hover:border-emerald-500/50 hover:shadow-emerald-500/10',
      link: '/admin/products/all',
    },
    {
      id: 'valuation',
      title: { en: 'Inventory Value', kh: 'តម្លៃស្តុកសរុប' },
      value: formatCurrency(stockKpis.inventoryValue),
      subtext: {
        en: 'Qty × Unit Cost valuation',
        kh: 'បរិមាណ × តម្លៃដើម',
      },
      badge: { en: 'Asset', kh: 'ទ្រព្យសកម្ម' },
      trend: { en: 'Financial', kh: 'ហិរញ្ញវត្ថុ' },
      iconEmoji: '💎',
      accentColor: '#38bdf8', // sky
      gradient: 'from-sky-500/20 via-slate-900 to-slate-900',
      borderGlow: 'hover:border-sky-500/50 hover:shadow-sky-500/10',
      link: '/admin/products/all',
    },
    {
      id: 'jobs',
      title: { en: 'Open Positions', kh: 'មុខតំណែងកំពុងរើស' },
      value: dashboardData.jobs?.length ?? 0,
      subtext: {
        en: 'Active career listings',
        kh: 'ការងារកំពុងប្រកាស',
      },
      badge: { en: 'Hiring', kh: 'ជ្រើសរើស' },
      trend: { en: 'HR Portal', kh: 'ធនធានមនុស្ស' },
      icon: targetIcon,
      accentColor: '#f59e0b', // amber
      gradient: 'from-amber-500/20 via-slate-900 to-slate-900',
      borderGlow: 'hover:border-amber-500/50 hover:shadow-amber-500/10',
      link: '/admin/jobs',
      adminOnly: true,
    },
    {
      id: 'applications',
      title: { en: 'Job Applications', kh: 'ពាក្យសុំការងារ' },
      value: dashboardData.applications?.length ?? 0,
      subtext: {
        en: `${appsByStatus['PENDING'] || 0} pending review`,
        kh: `${appsByStatus['PENDING'] || 0} រង់ចាំពិនិត្យ`,
      },
      badge: { en: `${appsByStatus['PENDING'] || 0} New`, kh: `${appsByStatus['PENDING'] || 0} ថ្មី` },
      trend: { en: 'Candidates', kh: 'បេក្ខជន' },
      icon: mailIcon,
      accentColor: '#a855f7', // purple
      gradient: 'from-purple-500/20 via-slate-900 to-slate-900',
      borderGlow: 'hover:border-purple-500/50 hover:shadow-purple-500/10',
      link: '/admin/applications',
      adminOnly: true,
      highlightBadge: (appsByStatus['PENDING'] || 0) > 0,
    },
  ].filter((item) => !item.adminOnly || isAdmin)

  const healthStats = [
    {
      id: 'in-stock',
      label: { en: 'Optimal Stock', kh: 'ស្តុកគ្រប់គ្រាន់' },
      value: Math.max(0, stockKpis.total - stockKpis.lowStock - stockKpis.outOfStock),
      subtext: { en: 'Healthy supply level (>5)', kh: 'កម្រិតស្តុកធម្មតា (>៥)' },
      color: '#22c55e',
      bg: 'bg-emerald-500/10 border-emerald-500/30',
      icon: '✅',
      barPercent: stockKpis.total ? Math.round(((stockKpis.total - stockKpis.lowStock - stockKpis.outOfStock) / stockKpis.total) * 100) : 100,
    },
    {
      id: 'low-stock',
      label: { en: 'Low Stock Alerts', kh: 'ស្តុកតិច (≤៥)' },
      value: stockKpis.lowStock,
      subtext: { en: 'Reorder suggested soon', kh: 'គួរកម្ម៉ង់បន្ថែមឆាប់ៗ' },
      color: '#f59e0b',
      bg: 'bg-amber-500/10 border-amber-500/30',
      icon: '⚠️',
      barPercent: stockKpis.total ? Math.round((stockKpis.lowStock / stockKpis.total) * 100) : 0,
    },
    {
      id: 'out-stock',
      label: { en: 'Out of Stock', kh: 'អស់ពីស្តុក (០)' },
      value: stockKpis.outOfStock,
      subtext: { en: 'Urgent restocking needed', kh: 'ត្រូវការបំពេញជាបន្ទាន់' },
      color: '#ef4444',
      bg: 'bg-rose-500/10 border-rose-500/30',
      icon: '🚨',
      barPercent: stockKpis.total ? Math.round((stockKpis.outOfStock / stockKpis.total) * 100) : 0,
    },
    {
      id: 'team-users',
      label: { en: 'Team & Accounts', kh: 'ក្រុមការងារ & គណនី' },
      value: (dashboardData.members?.length || 0) + (dashboardData.users?.length || 0),
      subtext: {
        en: `${dashboardData.members?.length || 0} Staff · ${dashboardData.users?.length || 0} Users`,
        kh: `${dashboardData.members?.length || 0} បុគ្គលិក · ${dashboardData.users?.length || 0} គណនី`,
      },
      color: '#3b82f6',
      bg: 'bg-blue-500/10 border-blue-500/30',
      icon: '👥',
      barPercent: 100,
      link: '/admin/members',
    },
  ]

  return (
    <div className="space-y-4">
      {/* ── ROW 1: PRIMARY EXECUTIVE KPI CARDS ── */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {primaryStats.map((stat) => (
          <Link
            key={stat.id}
            to={stat.link}
            className={`group relative overflow-hidden rounded-3xl border border-slate-700/60 bg-gradient-to-br ${stat.gradient} p-5 transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl ${stat.borderGlow}`}
          >
            {/* Top decorative ambient circle */}
            <div
              className="pointer-events-none absolute -right-8 -top-8 h-28 w-28 rounded-full opacity-40 blur-xl transition-all duration-500 group-hover:scale-125 group-hover:opacity-70"
              style={{ background: stat.accentColor }}
            />

            <div className="relative flex flex-col justify-between h-full gap-4">
              {/* Header: Icon + Badge */}
              <div className="flex items-center justify-between">
                <div
                  className="flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 shadow-lg backdrop-blur-md transition-transform duration-300 group-hover:scale-110"
                  style={{ backgroundColor: `${stat.accentColor}25` }}
                >
                  {stat.icon ? (
                    <img src={stat.icon} alt="" className="h-7 w-7 object-contain drop-shadow-md" />
                  ) : (
                    <span className="text-2xl">{stat.iconEmoji}</span>
                  )}
                </div>

                <div className="flex items-center gap-1.5">
                  <span
                    className={`rounded-full px-2.5 py-1 text-[10px] font-black uppercase tracking-wider border shadow-sm ${
                      stat.highlightBadge
                        ? 'bg-rose-500/20 text-rose-300 border-rose-500/40 animate-pulse'
                        : 'bg-slate-800/80 text-slate-300 border-slate-700'
                    }`}
                  >
                    {stat.badge[lang]}
                  </span>
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-slate-800/80 text-xs text-slate-400 border border-slate-700 transition-colors group-hover:bg-white group-hover:text-slate-900">
                    ↗
                  </span>
                </div>
              </div>

              {/* Main value & Labels */}
              <div>
                <p className="text-3xl font-black tracking-tight text-white group-hover:text-emerald-300 transition-colors">
                  {stat.value}
                </p>
                <h4 className="mt-1 text-xs font-bold text-slate-300">{stat.title[lang]}</h4>
                <p className="mt-0.5 text-[11px] text-slate-400 truncate">{stat.subtext[lang]}</p>
              </div>

              {/* Bottom trend & mini bar */}
              <div className="pt-2 border-t border-slate-700/40 flex items-center justify-between">
                <span className="text-[10px] font-bold text-slate-400">{stat.trend[lang]}</span>
                <span className="text-[10px] font-mono font-bold" style={{ color: stat.accentColor }}>
                  {lang === 'en' ? 'View Details' : 'មើលលម្អិត'} →
                </span>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* ── ROW 2: INVENTORY HEALTH & OPERATIONAL STATUS CARDS ── */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {healthStats.map((item) => {
          const Content = (
            <div
              key={item.id}
              className={`relative overflow-hidden rounded-2xl border ${item.bg} p-4 transition-all duration-200 hover:border-slate-500/60 hover:bg-slate-800/60`}
            >
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-900/80 text-lg border border-slate-700/60 shadow-inner">
                    {item.icon}
                  </span>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xl font-black text-white">{item.value}</span>
                      <span className="text-[11px] font-bold" style={{ color: item.color }}>
                        {item.label[lang]}
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-400">{item.subtext[lang]}</p>
                  </div>
                </div>

                <span className="text-xs font-mono font-bold text-slate-400">
                  {item.barPercent}%
                </span>
              </div>

              {/* Progress bar */}
              <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-slate-800">
                <div
                  className="h-full rounded-full transition-all duration-700"
                  style={{
                    width: `${Math.min(100, Math.max(0, item.barPercent))}%`,
                    backgroundColor: item.color,
                  }}
                />
              </div>
            </div>
          )

          return item.link ? (
            <Link to={item.link} key={item.id} className="block">
              {Content}
            </Link>
          ) : (
            <div key={item.id}>{Content}</div>
          )
        })}
      </div>
    </div>
  )
}
