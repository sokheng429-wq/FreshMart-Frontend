import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import RealTimeClock from './RealTimeClock'
import StatCards from './StatCards'
import DonutPieChartWidget from './DonutPieChartWidget'
import HorizontalBarChart from './HorizontalBarChart'
import AreaLineChartWidget from './AreaLineChartWidget'
import UserSummaryCard from './UserSummaryCard'

import bagIcon from '../../../assets/icon/3dicons-bag-dynamic-color.png'
import targetIcon from '../../../assets/icon/3dicons-target-dynamic-color.png'
import boyIcon from '../../../assets/icon/3dicons-boy-dynamic-color.png'
import canIcon from '../../../assets/icon/3dicons-can-dynamic-color.png'

export default function DashboardOverview({
  dashboardData,
  dashboardLoading,
  dashboardError,
  setDashboardRefreshKey,
  lang,
  isAdmin,
  user,
  categoryData,
  monthlyProducts,
  monthlyData,
  stockKpis,
  appsByStatus,
  topLowStock,
  recentActivity,
  formatTime,
  TEXTS,
}) {
  return (
    <div className="space-y-6">
      {/* Loading / Error Banner */}
      {(dashboardLoading || dashboardError) && (
        <div
          className={`flex flex-wrap items-center justify-between gap-3 rounded-2xl border px-4 py-3 text-sm backdrop-blur-md ${
            dashboardError
              ? 'border-amber-500/40 bg-amber-500/10 text-amber-200'
              : 'border-emerald-500/30 bg-emerald-500/10 text-emerald-200'
          }`}
        >
          <div className="flex items-center gap-2">
            <span className="text-lg">{dashboardError ? '⚠️' : '⚡'}</span>
            <span>{dashboardLoading ? TEXTS.loadingOverview[lang] : TEXTS.overviewError[lang]}</span>
          </div>
          {dashboardError && (
            <button
              type="button"
              onClick={() => setDashboardRefreshKey((k) => k + 1)}
              className="rounded-lg border border-amber-400/50 bg-amber-500/20 px-3 py-1.5 text-xs font-bold text-amber-100 transition hover:bg-amber-400/30"
            >
              {TEXTS.retry[lang]}
            </button>
          )}
        </div>
      )}

      {/* ── 1. REAL-TIME STATUS BAR & CLOCK ── */}
      <RealTimeClock
        lang={lang}
        onRefresh={() => setDashboardRefreshKey((k) => k + 1)}
        isRefreshing={dashboardLoading}
      />

      {/* ── 2. EXECUTIVE STAT CARDS ── */}
      <StatCards
        dashboardData={dashboardData}
        stockKpis={stockKpis}
        appsByStatus={appsByStatus}
        lang={lang}
        isAdmin={isAdmin}
      />

      {/* ── 3. CHARTS ROW 1: DONUT & HORIZONTAL BAR ── */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <DonutPieChartWidget
          categoryData={categoryData}
          stockKpis={stockKpis}
          appsByStatus={appsByStatus}
          lang={lang}
        />
        <HorizontalBarChart
          categoryData={categoryData}
          stockKpis={stockKpis}
          topLowStock={topLowStock}
          lang={lang}
        />
      </div>

      {/* ── 4. CHARTS ROW 2: AREA / LINE CHART WITH PEAK ANNOTATIONS & USER SUMMARY CARD ── */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <div className="xl:col-span-2">
          <AreaLineChartWidget
            monthlyProducts={monthlyProducts}
            monthlyActivity={monthlyData}
            lang={lang}
          />
        </div>
        <div className="xl:col-span-1">
          <UserSummaryCard
            user={user}
            dashboardData={dashboardData}
            lang={lang}
            isAdmin={isAdmin}
          />
        </div>
      </div>

      {/* ── 5. BOTTOM ROW: RECENT AUDIT ACTIVITY & DIRECT SHORTCUTS ── */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        {/* Recent Activity Timeline */}
        <div className="xl:col-span-2 rounded-3xl border border-slate-700/60 bg-gradient-to-br from-slate-900 via-slate-900/90 to-slate-950 p-6 shadow-xl">
          <div className="mb-4 flex items-center justify-between border-b border-slate-800 pb-3">
            <div>
              <h3 className="text-base font-black text-white">{TEXTS.recentTitle[lang]}</h3>
              <p className="text-xs text-slate-400">{TEXTS.recentSub[lang]}</p>
            </div>
            <Link
              to="/admin/applications"
              className="text-xs font-bold text-purple-400 hover:text-purple-300 hover:underline"
            >
              {lang === 'en' ? 'All Activity' : 'សកម្មភាពទាំងអស់'} →
            </Link>
          </div>

          {recentActivity.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-500">{TEXTS.noActivity[lang]}</div>
          ) : (
            <div className="space-y-3">
              {recentActivity.map((item, idx) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between gap-4 rounded-2xl border border-slate-800/80 bg-slate-900/60 p-3.5 transition hover:border-slate-700 hover:bg-slate-800/50"
                >
                  <div className="flex items-center gap-3.5 min-w-0">
                    <span
                      className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl text-lg border border-slate-700/60 shadow-inner"
                      style={{ backgroundColor: `${item.color}20` }}
                    >
                      {item.icon}
                    </span>
                    <div className="min-w-0">
                      <p className="truncate text-xs sm:text-sm font-bold text-white">
                        {item.detail}
                      </p>
                      <p className="text-[10px] text-slate-400 capitalize">
                        {item.type === 'job'
                          ? (lang === 'en' ? '💼 Job Position' : '💼 មុខតំណែងការងារ')
                          : (lang === 'en' ? '📋 Candidate Application' : '📋 ពាក្យសុំបេក្ខជន')}
                      </p>
                    </div>
                  </div>

                  <span className="flex-shrink-0 rounded-lg bg-slate-800 px-2.5 py-1 text-[11px] font-mono text-slate-300 border border-slate-700/60">
                    {formatTime(item.timestamp)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Quick Management Shortcuts */}
        <div className="xl:col-span-1 rounded-3xl border border-slate-700/60 bg-gradient-to-br from-slate-900 via-slate-900/90 to-slate-950 p-6 shadow-xl flex flex-col justify-between">
          <div>
            <div className="mb-4 border-b border-slate-800 pb-3">
              <h3 className="text-base font-black text-white">{TEXTS.quickActions[lang]}</h3>
              <p className="text-xs text-slate-400">{TEXTS.quickActionsSub[lang]}</p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {[
                { to: '/admin/products/add', icon: bagIcon, label: { en: 'Add Product', kh: 'បន្ថែមផលិតផល' }, color: '#10b981' },
                { to: '/admin/jobs/add', icon: targetIcon, label: { en: 'Post Job', kh: 'ប្រកាសការងារ' }, color: '#f59e0b', adminOnly: true },
                { to: '/admin/members/add', icon: boyIcon, label: { en: 'Add Member', kh: 'បន្ថែមសមាជិក' }, color: '#3b82f6', adminOnly: true },
                { to: '/products', icon: canIcon, label: { en: 'Public Shop', kh: 'ហាងទំនិញ' }, color: '#a855f7' },
              ]
                .filter((item) => !item.adminOnly || isAdmin)
                .map((action) => (
                  <Link
                    key={action.to}
                    to={action.to}
                    className="group flex flex-col items-center gap-2 rounded-2xl border border-slate-800 bg-slate-900/80 p-3.5 text-center transition hover:-translate-y-0.5 hover:border-slate-600 hover:bg-slate-800 hover:shadow-lg"
                  >
                    <span
                      className="flex h-10 w-10 items-center justify-center rounded-xl shadow-inner transition-transform group-hover:scale-110"
                      style={{ backgroundColor: `${action.color}20` }}
                    >
                      <img src={action.icon} alt="" className="h-6 w-6 object-contain" />
                    </span>
                    <span className="text-xs font-bold text-slate-300 group-hover:text-white">
                      {action.label[lang]}
                    </span>
                  </Link>
                ))}
            </div>
          </div>

          <div className="mt-4 rounded-2xl border border-emerald-500/20 bg-emerald-950/20 p-3 text-center">
            <p className="text-[11px] font-bold text-emerald-400">
              {lang === 'en' ? 'FreshMart ERP Suite v2.0' : 'ប្រព័ន្ធគ្រប់គ្រង FreshMart ២.០'}
            </p>
            <p className="text-[10px] text-slate-400">
              {lang === 'en' ? 'All systems active and operational' : 'ប្រព័ន្ធទាំងអស់ដំណើរការយ៉ាងល្អ'}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
