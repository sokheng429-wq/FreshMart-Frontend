import { useMemo, useState, useEffect, useRef } from 'react'
import { useLanguage } from '../context/LanguageContext'
import { useCart } from '../context/CartContext'
import { CATEGORIES } from '../data/products'
import { ProductCard } from './ProductCard'
import './ProductShop.css'

const PAGE_SIZE = 15

const TEXTS = {
  searchPlaceholder: { en: 'Search products…', kh: 'ស្វែងរកផលិតផល…' },
  all: { en: 'All', kh: 'ទាំងអស់' },
  filterOnSale: { en: 'On Sale', kh: 'បញ្ចុះតម្លៃ' },
  filterBestSeller: { en: 'Best Sellers', kh: 'លក់ដាច់បំផុត' },
  filterNew: { en: 'New Arrivals', kh: 'មកដល់ថ្មី' },
  sortDefault: { en: 'Sort: Featured', kh: 'តម្រៀប៖ លក្ខណៈពិសេស' },
  sortDeal: { en: 'Sort: Deals first', kh: 'តម្រៀប៖ ការផ្តល់ជូនមុន' },
  sortPriceLow: { en: 'Price: Low to High', kh: 'តម្លៃ៖ ទាបទៅខ្ពស់' },
  sortPriceHigh: { en: 'Price: High to Low', kh: 'តម្លៃ៖ ខ្ពស់ទៅទាប' },
  sortRating: { en: 'Top Rated', kh: 'ពិន្ទុខ្ពស់' },
  sortNameAz: { en: 'Name: A to Z', kh: 'ឈ្មោះ៖ ក្រៅទៅខាងក្នុង' },
  noResults: { en: 'No products match your search.', kh: 'រកមិនឃើញផលិតផលដែលត្រូវគ្នា។' },
  noResultsHint: { en: 'Try a different keyword or clear the filters.', kh: 'សាកល្បងពាក្យផ្សេង ឬលុបចោលការត្រង។' },
  clearAll: { en: 'Clear filters', kh: 'លុបការត្រង' },
  showing: { en: 'Showing', kh: 'បង្ហាញ' },
  of: { en: 'of', kh: 'ក្នុងចំណោម' },
  products: { en: 'products', kh: 'ផលិតផល' },
  prev: { en: 'Prev', kh: 'មុន' },
  next: { en: 'Next', kh: 'បន្ទាប់' },
  page: { en: 'Page', kh: 'ទំព័រ' },
}

const SearchIcon = () => (
  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" aria-hidden="true">
    <circle cx="11" cy="11" r="8" />
    <line x1="21" y1="21" x2="16.65" y2="16.65" />
  </svg>
)
const XIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden="true">
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
)
const SortIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <line x1="11" y1="5" x2="21" y2="5" />
    <line x1="11" y1="12" x2="19" y2="12" />
    <line x1="11" y1="19" x2="16" y2="19" />
    <polyline points="3 8 6 5 9 8" />
    <line x1="6" y1="5" x2="6" y2="19" />
  </svg>
)
const ChevronDownIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="m6 9 6 6 6-6" />
  </svg>
)
const ArrowLeftIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="m15 18-6-6 6-6" />
  </svg>
)
const ArrowRightIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="m9 18 6-6-6-6" />
  </svg>
)

/* Page numbers with ellipsis */
const pageItems = (page, total) => {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1)
  const pages = [1]
  const start = Math.max(2, page - 1)
  const end = Math.min(total - 1, page + 1)
  if (start > 2) pages.push('…')
  for (let i = start; i <= end; i++) pages.push(i)
  if (end < total - 1) pages.push('…')
  pages.push(total)
  return pages
}

// `categories` lets pages feed live master-data categories (Stocks →
// Categories) into the rail; falls back to the built-in demo list.
export const ProductShop = ({ products = [], initialSort = 'default', showCategories = true, categories = CATEGORIES }) => {
  const { lang } = useLanguage()
  const { addToCart } = useCart()
  const t = (k) => TEXTS[k][lang]
  const sortRef = useRef(null)

  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('all')
  const [filter, setFilter] = useState('all')
  const [sort, setSort] = useState(initialSort)
  const [sortOpen, setSortOpen] = useState(false)
  const [page, setPage] = useState(1)
  const [addedIds, setAddedIds] = useState(new Set())
  const [wishlist, setWishlist] = useState(new Set())

  // Close sort dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (sortRef.current && !sortRef.current.contains(event.target)) {
        setSortOpen(false)
      }
    }
    if (sortOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [sortOpen])

  const toggleId = (set, id) => set((prev) => {
    const next = new Set(prev)
    if (next.has(id)) next.delete(id)
    else next.add(id)
    return next
  })

  const handleAdd = (product) => {
    addToCart(product)
    toggleId(setAddedIds, product.id)
    window.setTimeout(() => setAddedIds((prev) => {
      const next = new Set(prev)
      next.delete(product.id)
      return next
    }), 1400)
  }

  /* Jump back to page 1 whenever the visible result set changes */
  const goFirst = () => setPage(1)

  const filtered = useMemo(() => {
    let list = [...products]

    // Apply search filter
    if (search.trim()) {
      const q = search.trim().toLowerCase()
      list = list.filter((p) =>
        p.name.en.toLowerCase().includes(q) ||
        p.name.kh.includes(q) ||
        p.desc?.en?.toLowerCase().includes(q) ||
        p.desc?.kh?.includes(q)
      )
    }

    // Apply category filter
    if (category !== 'all') {
      list = list.filter((p) => p.category === category)
    }

    // Apply quick filters
    if (filter === 'sale') {
      list = list.filter((p) => Boolean(p.oldPrice))
    } else if (filter === 'bestseller') {
      list = list.filter((p) => p.badge?.en === 'Best Seller')
    } else if (filter === 'new') {
      list = list.filter((p) => p.badge?.en === 'New')
    }

    // Apply sorting
    if (sort === 'price-low') {
      list = list.sort((a, b) => a.price - b.price)
    } else if (sort === 'price-high') {
      list = list.sort((a, b) => b.price - a.price)
    } else if (sort === 'rating') {
      list = list.sort((a, b) => b.rating - a.rating)
    } else if (sort === 'name-az') {
      list = list.sort((a, b) => (a.name.en || '').localeCompare(b.name.en || ''))
    } else if (sort === 'deal') {
      list = list.sort((a, b) => {
        const aHasDeal = a.oldPrice ? 1 : 0
        const bHasDeal = b.oldPrice ? 1 : 0
        if (bHasDeal !== aHasDeal) return bHasDeal - aHasDeal
        return b.sold - a.sold
      })
    }

    return list
  }, [products, search, category, filter, sort])

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const safePage = Math.min(page, totalPages)
  const slice = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE)
  const from = filtered.length === 0 ? 0 : (safePage - 1) * PAGE_SIZE + 1
  const to = Math.min(filtered.length, safePage * PAGE_SIZE)

  const hasActiveFilters = search || category !== 'all' || filter !== 'all'

  return (
    <div className="pshop">
      {/* Toolbar */}
      <div className="pshop-toolbar">
        <div className="pshop-search-wrap">
          <span className="pshop-search-icon"><SearchIcon /></span>
          <input
            type="search"
            className="pshop-search"
            placeholder={t('searchPlaceholder')}
            value={search}
            onChange={(e) => { setSearch(e.target.value); goFirst() }}
            aria-label={t('searchPlaceholder')}
          />
          {search && (
            <button className="pshop-search-clear" onClick={() => { setSearch(''); goFirst() }} aria-label="Clear search">
              <XIcon />
            </button>
          )}
        </div>

        <div className="pshop-controls">
          <div className="pshop-filters" role="group" aria-label="Filters">
            {[
              { key: 'all', icon: '⚡', label: t('all') },
              { key: 'sale', icon: '🔥', label: t('filterOnSale') },
              { key: 'bestseller', icon: '🏆', label: t('filterBestSeller') },
              { key: 'new', icon: '✨', label: t('filterNew') },
            ].map((f) => (
              <button
                key={f.key}
                type="button"
                className={`pshop-filter ${filter === f.key ? 'pshop-filter--on' : ''}`}
                onClick={() => { setFilter(f.key); goFirst() }}
                aria-pressed={filter === f.key}
              >
                <span className="pshop-filter-icon" aria-hidden="true">{f.icon}</span>
                {f.label}
              </button>
            ))}
          </div>

          <div className="pshop-sort-wrap" ref={sortRef}>
            <button
              type="button"
              className={`pshop-sort ${sortOpen ? 'pshop-sort--open' : ''}`}
              onClick={() => setSortOpen((v) => !v)}
              aria-haspopup="listbox"
              aria-expanded={sortOpen}
            >
              <SortIcon />
              <span>{t(sort === 'default' ? 'sortDefault' : sort === 'deal' ? 'sortDeal' : sort === 'price-low' ? 'sortPriceLow' : sort === 'price-high' ? 'sortPriceHigh' : sort === 'name-az' ? 'sortNameAz' : 'sortRating')}</span>
              <ChevronDownIcon />
            </button>
            {sortOpen && (
              <div className="pshop-sort-menu" role="listbox">
                {[
                  { key: 'default', label: t('sortDefault') },
                  { key: 'deal', label: t('sortDeal') },
                  { key: 'price-low', label: t('sortPriceLow') },
                  { key: 'price-high', label: t('sortPriceHigh') },
                  { key: 'rating', label: t('sortRating') },
                  { key: 'name-az', label: t('sortNameAz') },
                ].map((s) => (
                  <button
                    key={s.key}
                    type="button"
                    className={`pshop-sort-item ${sort === s.key ? 'pshop-sort-item--on' : ''}`}
                    onClick={() => { setSort(s.key); setSortOpen(false); goFirst() }}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Category rail */}
      {showCategories && (
        <div className="pshop-rail" role="tablist" aria-label="Categories">
          <button
            type="button"
            className={`pshop-rail-chip ${category === 'all' ? 'pshop-rail-chip--on' : ''}`}
            onClick={() => { setCategory('all'); goFirst() }}
            role="tab"
            aria-selected={category === 'all'}
          >
            <span aria-hidden="true">🛒</span>
            {t('all')}
          </button>
          {categories.map((c) => (
            <button
              key={c.key}
              type="button"
              className={`pshop-rail-chip ${category === c.key ? 'pshop-rail-chip--on' : ''}`}
              onClick={() => { setCategory(c.key); goFirst() }}
              role="tab"
              aria-selected={category === c.key}
            >
              <span aria-hidden="true">{c.icon}</span>
              {c[lang]}
            </button>
          ))}
        </div>
      )}

      {/* Results bar */}
      <div className="pshop-results-bar">
        <p className="pshop-count">
          {filtered.length === 0
            ? '0'
            : `${t('showing')} ${from}–${to} ${t('of')} ${filtered.length}`}{' '}
          {t('products')}
        </p>
        {hasActiveFilters && (
          <button
            type="button"
            className="pshop-clear-filters"
            onClick={() => { setSearch(''); setCategory('all'); setFilter('all'); goFirst() }}
          >
            <XIcon /> {t('clearAll')}
          </button>
        )}
      </div>

      {/* Grid */}
      {slice.length === 0 ? (
        <div className="pshop-empty">
          <span className="pshop-empty-icon" aria-hidden="true">🔍</span>
          <p className="pshop-empty-title">{t('noResults')}</p>
          <p className="pshop-empty-hint">{t('noResultsHint')}</p>
        </div>
      ) : (
        <div className="pshop-grid">
          {slice.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              onAdd={handleAdd}
              addedIds={addedIds}
              wishlist={wishlist}
              onWish={(id) => toggleId(setWishlist, id)}
            />
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <nav className="pshop-pagination" aria-label="Pagination">
          <button
            type="button"
            className="pshop-page-btn"
            disabled={safePage <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
          >
            <ArrowLeftIcon /> {t('prev')}
          </button>
          <div className="pshop-page-numbers">
            {pageItems(safePage, totalPages).map((item, i) =>
              item === '…' ? (
                <span key={`e${i}`} className="pshop-page-ellipsis" aria-hidden="true">…</span>
              ) : (
                <button
                  key={item}
                  type="button"
                  className={`pshop-page-num ${item === safePage ? 'pshop-page-num--on' : ''}`}
                  onClick={() => setPage(item)}
                  aria-current={item === safePage ? 'page' : undefined}
                  aria-label={`${t('page')} ${item}`}
                >
                  {item}
                </button>
              )
            )}
          </div>
          <button
            type="button"
            className="pshop-page-btn"
            disabled={safePage >= totalPages}
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
          >
            {t('next')} <ArrowRightIcon />
          </button>
        </nav>
      )}
    </div>
  )
}

export default ProductShop
