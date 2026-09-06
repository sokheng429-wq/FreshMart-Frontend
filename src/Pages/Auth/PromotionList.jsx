import React, { useState, useEffect, useMemo, useCallback } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useLanguage } from '../../context/LanguageContext'
import { useNotifications } from '../../context/NotificationContext'
import { adminSalePromotionAPI } from '../../api/api'
import giftIcon from '../../assets/icon/3dicons-gift-box-dynamic-color.png'

export const PromotionList = () => {
  const { lang } = useLanguage()
  const { addNotification } = useNotifications()
  const navigate = useNavigate()

  const [promotions, setPromotions] = useState([])
  const [loading, setLoading] = useState(true)

  // Search & Filters
  const [searchQuery, setSearchQuery] = useState('')
  const [searchBy, setSearchBy] = useState('any') // any, code, description
  const [filterActive, setFilterActive] = useState('all') // all, active, inactive

  // Delete modal
  const [deleteConfirm, setDeleteConfirm] = useState(null)

  // Pagination
  const [page, setPage] = useState(1)
  const pageSize = 12

  // Fetch Promotions
  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      const res = await adminSalePromotionAPI.getAll({
        search: searchQuery,
        searchBy: searchBy,
        activeOnly: filterActive === 'active' ? true : undefined,
      })
      const list = res?.data || res || []
      let arr = Array.isArray(list) ? list : []
      if (filterActive === 'inactive') {
        arr = arr.filter((p) => p.active === false)
      }
      setPromotions(arr)
      setLoading(false)
    } catch (err) {
      console.error('Failed to load promotions:', err)
      setLoading(false)
    }
  }, [searchQuery, searchBy, filterActive])

  useEffect(() => {
    loadData()
  }, [loadData])

  // Toggle Active
  const handleToggleActive = async (id, currentVal) => {
    try {
      await adminSalePromotionAPI.toggleActive(id)
      setPromotions((prev) =>
        prev.map((p) => (p.id === id ? { ...p, active: !currentVal } : p))
      )
      addNotification?.({
        type: 'success',
        title: 'Status Updated',
        message: `Promotion is now ${!currentVal ? 'Active' : 'Inactive'}.`,
      })
    } catch (err) {
      console.error('Failed to toggle status:', err)
      addNotification?.({
        type: 'error',
        title: 'Update Failed',
        message: 'Could not change promotion status.',
      })
    }
  }

  // Delete Promotion
  const handleDelete = async (id) => {
    try {
      await adminSalePromotionAPI.delete(id)
      setDeleteConfirm(null)
      loadData()
      addNotification?.({
        type: 'success',
        title: 'Promotion Deleted',
        message: 'Promotion removed successfully.',
      })
    } catch (err) {
      console.error('Delete failed:', err)
      addNotification?.({
        type: 'error',
        title: 'Delete Failed',
        message: err.message || 'Could not delete promotion.',
      })
    }
  }

  // Stats
  const stats = useMemo(() => {
    const total = promotions.length
    const activeCount = promotions.filter((p) => p.active !== false).length
    const percentageCount = promotions.filter((p) => p.discountType === 'PERCENTAGE').length
    return { total, activeCount, percentageCount }
  }, [promotions])

  // Pagination Slice
  const totalPages = Math.ceil(promotions.length / pageSize) || 1
  const paginatedPromotions = useMemo(() => {
    const start = (page - 1) * pageSize
    return promotions.slice(start, start + pageSize)
  }, [promotions, page])

  const formatDiscountVal = (p) => {
    if (p.discountType === 'PERCENTAGE') return `${p.discountValue || 0}%`
    if (p.discountType === 'FIXED_AMOUNT') return `$${Number(p.discountValue || 0).toFixed(2)}`
    return 'Buy X Get Y'
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white p-4 sm:p-6 lg:p-8 space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800/80 pb-6">
        <div className="flex items-center gap-3">
          <Link
            to="/admin/sale-dashboard"
            className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-900 border border-slate-700 text-slate-300 hover:text-white hover:bg-slate-800 transition"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
          </Link>
          <img src={giftIcon} alt="Promotions" className="w-10 h-10 object-contain drop-shadow-md" />
          <div>
            <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white flex items-center gap-2">
              <span>{lang === 'en' ? 'Promotions & Deals' : 'ការផ្សព្វផ្សាយ និងការបញ្ចុះតម្លៃ'}</span>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-green-500/10 text-[#77BC1F] border border-green-500/20 font-bold">
                {promotions.length} {lang === 'en' ? 'Deals' : 'ការផ្តល់ជូន'}
              </span>
            </h1>
            <p className="text-xs text-slate-400 mt-0.5">
              {lang === 'en'
                ? 'Create discount rules, percentage vouchers, minimum orders, and recurrent campaign schedules'
                : 'បង្កើតការបញ្ចុះតម្លៃ កូដប្រូម៉ូសិន និងលក្ខខណ្ឌពិសេស'}
            </p>
          </div>
        </div>

        <Link
          to="/admin/sale-dashboard/promotions/create"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#77BC1F] to-[#5ea113] hover:from-[#65a317] hover:to-[#4e880e] text-slate-950 font-black text-xs uppercase tracking-wider shadow-lg shadow-green-500/20 transition active:scale-95"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4" />
          </svg>
          {lang === 'en' ? 'Create Promotion' : 'បង្កើតការផ្សព្វផ្សាយ'}
        </Link>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-2xl border border-slate-800/80 bg-slate-900/60 p-4 flex items-center justify-between shadow-lg">
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">{lang === 'en' ? 'Total Campaigns' : 'យុទ្ធនាការសរុប'}</p>
            <h3 className="text-2xl font-black text-white mt-1">{stats.total}</h3>
          </div>
          <div className="h-11 w-11 rounded-xl bg-blue-500/15 flex items-center justify-center text-blue-400">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-800/80 bg-slate-900/60 p-4 flex items-center justify-between shadow-lg">
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">{lang === 'en' ? 'Active Promotions' : 'កំពុងដំណើរការ'}</p>
            <h3 className="text-2xl font-black text-[#77BC1F] mt-1">{stats.activeCount}</h3>
          </div>
          <div className="h-11 w-11 rounded-xl bg-green-500/15 flex items-center justify-center text-[#77BC1F]">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-800/80 bg-slate-900/60 p-4 flex items-center justify-between shadow-lg">
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">{lang === 'en' ? 'Percentage Deals' : 'បញ្ចុះជាភាគរយ'}</p>
            <h3 className="text-2xl font-black text-amber-400 mt-1">{stats.percentageCount}</h3>
          </div>
          <div className="h-11 w-11 rounded-xl bg-amber-500/15 flex items-center justify-center text-amber-400">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 7h.01M17 17h.01M7 17L17 7" />
            </svg>
          </div>
        </div>
      </div>

      {/* General Information Search Bar */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-4 space-y-3 shadow-xl">
        <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3">
          {/* Search Textbox */}
          <div className="relative flex-1">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value)
                setPage(1)
              }}
              placeholder={lang === 'en' ? 'Search promotions by code, description...' : 'ស្វែងរកការផ្សព្វផ្សាយ...'}
              className="w-full rounded-xl border border-slate-700 bg-slate-950 pl-10 pr-4 py-2.5 text-xs sm:text-sm text-white placeholder-slate-500 focus:border-green-400 focus:outline-none"
            />
            <svg className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>

          {/* Search By Dropdown: Any - Code - Description */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider whitespace-nowrap">
              {lang === 'en' ? 'Search By:' : 'ស្វែងរកតាម:'}
            </span>
            <select
              value={searchBy}
              onChange={(e) => {
                setSearchBy(e.target.value)
                setPage(1)
              }}
              className="rounded-xl border border-slate-700 bg-slate-950 px-3 py-2.5 text-xs font-bold text-slate-200 focus:border-green-400 focus:outline-none cursor-pointer"
            >
              <option value="any">{lang === 'en' ? 'Any' : 'ទាំងអស់'}</option>
              <option value="code">{lang === 'en' ? 'Code' : 'លេខកូដ'}</option>
              <option value="description">{lang === 'en' ? 'Description' : 'ការពិពណ៌នា'}</option>
            </select>
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800">
            <button
              onClick={() => setFilterActive('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                filterActive === 'all' ? 'bg-[#77BC1F] text-slate-950' : 'text-slate-400 hover:text-white'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setFilterActive('active')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                filterActive === 'active' ? 'bg-[#77BC1F] text-slate-950' : 'text-slate-400 hover:text-white'
              }`}
            >
              Active
            </button>
            <button
              onClick={() => setFilterActive('inactive')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                filterActive === 'inactive' ? 'bg-red-500 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              Inactive
            </button>
          </div>
        </div>
      </div>

      {/* Promotion List Table */}
      <div className="rounded-2xl border border-slate-800/80 bg-slate-900/60 overflow-hidden shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-950/70 text-slate-400 uppercase text-[10px] tracking-wider">
                <th className="py-3 px-4 w-12 text-center">#</th>
                <th className="py-3 px-4 font-bold">{lang === 'en' ? 'Code' : 'លេខកូដ'}</th>
                <th className="py-3 px-4 font-bold">{lang === 'en' ? 'Description' : 'ការពិពណ៌នា'}</th>
                <th className="py-3 px-4 font-bold text-center">{lang === 'en' ? 'Discount Type' : 'ប្រភេទបញ្ចុះ'}</th>
                <th className="py-3 px-4 font-bold text-right">{lang === 'en' ? 'Discount Value' : 'តម្លៃបញ្ចុះ'}</th>
                <th className="py-3 px-4 font-bold text-center">{lang === 'en' ? 'Date Type' : 'កាលវិភាគ'}</th>
                <th className="py-3 px-4 font-bold text-center">{lang === 'en' ? 'Active' : 'ស្ថានភាព'}</th>
                <th className="py-3 px-4 text-right">{lang === 'en' ? 'Actions' : 'សកម្មភាព'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <div className="h-7 w-7 animate-spin rounded-full border-2 border-green-500 border-t-transparent" />
                      <span>{lang === 'en' ? 'Loading promotions...' : 'កំពុងផ្ទុកការផ្សព្វផ្សាយ...'}</span>
                    </div>
                  </td>
                </tr>
              ) : paginatedPromotions.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <span className="text-3xl">🎁</span>
                      <span className="font-bold text-slate-300">
                        {lang === 'en' ? 'No promotions found' : 'មិនមានការផ្សព្វផ្សាយនៅឡើយទេ'}
                      </span>
                      <span className="text-xs text-slate-500">
                        {lang === 'en' ? 'Create a promotion rule to drive customer sales.' : 'បង្កើតការបញ្ចុះតម្លៃថ្មីដើម្បីជំរុញការលក់។'}
                      </span>
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedPromotions.map((p, idx) => (
                  <tr key={p.id || idx} className="hover:bg-slate-800/40 transition">
                    <td className="py-3.5 px-4 text-center font-bold text-slate-500">
                      {(page - 1) * pageSize + idx + 1}
                    </td>

                    <td className="py-3.5 px-4">
                      <Link
                        to={`/admin/sale-dashboard/promotions/edit/${p.id}`}
                        className="font-black text-[#FF9900] hover:text-orange-300 hover:underline"
                      >
                        {p.code}
                      </Link>
                    </td>

                    <td className="py-3.5 px-4 max-w-xs">
                      <p className="font-bold text-white truncate">{p.description}</p>
                      {p.secondLanguage && <p className="text-[11px] text-slate-400 truncate">{p.secondLanguage}</p>}
                      {p.priceBook && <p className="text-[10px] text-blue-400">{p.priceBook}</p>}
                    </td>

                    <td className="py-3.5 px-4 text-center">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-slate-800 text-slate-300 border border-slate-700">
                        {p.discountType || 'PERCENTAGE'}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <span className="font-black text-emerald-400 text-sm">
                        {formatDiscountVal(p)}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-center">
                      <div className="space-y-0.5">
                        <span className="text-[10px] font-bold text-purple-400 bg-purple-500/10 px-2 py-0.5 rounded">
                          {p.dateType || 'INTERVAL'}
                        </span>
                        {p.startDate && p.endDate && (
                          <p className="text-[10px] text-slate-500">
                            {p.startDate} ~ {p.endDate}
                          </p>
                        )}
                      </div>
                    </td>

                    <td className="py-3.5 px-4 text-center">
                      <button
                        onClick={() => handleToggleActive(p.id, p.active !== false)}
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider transition ${
                          p.active !== false
                            ? 'bg-green-500/15 text-[#77BC1F] border border-green-500/30 hover:bg-green-500/25'
                            : 'bg-slate-800 text-slate-500 border border-slate-700 hover:bg-slate-700'
                        }`}
                      >
                        <span className={`h-1.5 w-1.5 rounded-full ${p.active !== false ? 'bg-[#77BC1F]' : 'bg-slate-500'}`} />
                        {p.active !== false ? 'Active' : 'Inactive'}
                      </button>
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <Link
                          to={`/admin/sale-dashboard/promotions/edit/${p.id}`}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
                          title="Edit"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </Link>
                        <button
                          onClick={() => setDeleteConfirm(p)}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-500/10"
                          title="Delete"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-slate-800 bg-slate-950/60 text-xs">
            <span className="text-slate-400">
              {lang === 'en'
                ? `Showing ${paginatedPromotions.length} of ${promotions.length} entries`
                : `បង្ហាញ ${paginatedPromotions.length} ក្នុងចំណោម ${promotions.length}`}
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-3 py-1 rounded-lg border border-slate-700 disabled:opacity-40"
              >
                {lang === 'en' ? 'Prev' : 'មុន'}
              </button>
              <span className="font-bold text-[#77BC1F]">
                {page} / {totalPages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="px-3 py-1 rounded-lg border border-slate-700 disabled:opacity-40"
              >
                {lang === 'en' ? 'Next' : 'បន្ទាប់'}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* DELETE CONFIRMATION MODAL */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-2xl border border-red-500/50 bg-slate-900 p-6 shadow-2xl text-center space-y-4">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-red-500/20 text-red-400">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </div>
            <div>
              <h3 className="text-base font-black text-white">Delete Promotion #{deleteConfirm.code}?</h3>
              <p className="mt-1 text-xs text-slate-400">
                Are you sure you want to permanently delete this promotion rule?
              </p>
            </div>
            <div className="flex items-center justify-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setDeleteConfirm(null)}
                className="px-4 py-2 rounded-xl border border-slate-700 text-xs font-bold text-slate-300 hover:bg-slate-800"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleDelete(deleteConfirm.id)}
                className="px-5 py-2 rounded-xl bg-red-600 text-white text-xs font-black uppercase tracking-wider"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
export default PromotionList
