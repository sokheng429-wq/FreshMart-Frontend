import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useLanguage } from '../../context/LanguageContext'
import { useAuth } from '../../context/AuthContext'
import { memberAPI, publicAPI, BACKEND_URL } from '../../api/api'

// Assets
import profileImg from '../../assets/Profile.avif'
const hengImg = profileImg
const chheangImg = profileImg
const nithImg = profileImg
const meanImg = profileImg

// 3D Icons
import trophyIcon from '../../assets/icon/3dicons-trophy-dynamic-color.png'
import rocketIcon from '../../assets/icon/3dicons-rocket-dynamic-color.png'
import flashIcon from '../../assets/icon/3dicons-flash-dynamic-color.png'
import shieldIcon from '../../assets/icon/3dicons-shield-dynamic-color.png'

import './Member.css'

const FALLBACK_IMAGE = profileImg

// Complete team list created by the user with real images and biographies
const FALLBACK_TEAM = [
  {
    id: 1,
    name: { en: 'Unknow', kh: 'Unknow' },
    role: { en: 'CEO & Founder', kh: 'នាយកប្រតិបត្តិ និងស្ថាបនិក' },
    image: profileImg,
    dept: { en: 'Executive', kh: 'នាយកប្រតិបត្តិ' },
    rank: 1,
  },
  {
    id: 2,
    name: { en: 'Chenda Kim', kh: 'ចិន្តា​ គីម' },
    role: { en: 'Manager', kh: 'នាយកប្រតិបត្តិការ' },
    image: profileImg,
    dept: { en: 'Operations', kh: 'ប្រតិបត្តិការ' },
    rank: 2,
  },
  {
    id: 3,
    name: { en: 'Dara Meas', kh: 'តារា​ មាស' },
    role: { en: 'HR', kh: 'ប្រធានផ្នែកធនធានមនុស្ស' },
    image: profileImg,
    dept: { en: 'Admin', kh: 'រដ្ឋបាល' },
    rank: 3,
  },
  {
    id: 4,
    name: { en: 'Thoeun SokHeng', kh: 'ធឿន សុខហេង' },
    role: { en: 'Web Developer', kh: 'អ្នកអភិវឌ្ឍគេហទំព័រ' },
    image: hengImg,
    dept: { en: 'Technology', kh: 'បច្ចេកវិទ្យា' },
    rank: 4,
  },
  {
    id: 5,
    name: { en: 'Chham Vuthy', kh: 'ឆម​ វុទ្ធី' },
    role: { en: 'Merchant Warehouse', kh: 'ឃ្លាំងទំនិញ' },
    image: profileImg,
    dept: { en: 'Operations', kh: 'ប្រតិបត្តិការ' },
    rank: 5,
  },
  {
    id: 6,
    name: { en: 'Neang MengChheang', kh: 'នាង​ ម៉េងឈាង' },
    role: { en: 'IT Networking Engineer', kh: 'វិស្វករបណ្តាញ IT' },
    image: chheangImg,
    dept: { en: 'Technology', kh: 'បច្ចេកវិទ្យា' },
    rank: 6,
  },
  {
    id: 7,
    name: { en: 'Phal SophaNith', kh: 'ផល សុផានិត' },
    role: { en: 'Warehouse Supervisor', kh: 'អ្នកគ្រប់គ្រងឃ្លាំង' },
    image: nithImg,
    dept: { en: 'Operations', kh: 'ប្រតិបត្តិការ' },
    rank: 7,
  },
  {
    id: 8,
    name: { en: 'Oeun Ramean', kh: 'អឿន រ៉ាមាន' },
    role: { en: 'Graphic Designer', kh: 'អ្នករចនាបទ' },
    image: meanImg,
    dept: { en: 'Technology', kh: 'បច្ចេកវិទ្យា' },
    rank: 8,
  },
  {
    id: 9,
    name: { en: 'Khim Sreynich', kh: 'ខឹម ស្រីនិច' },
    role: { en: 'Quality Assurance Specialist', kh: 'អ្នកជំនាញត្រួតពិនិត្យគុណភាព' },
    image: profileImg,
    dept: { en: 'Operations', kh: 'ប្រតិបត្តិការ' },
    rank: 9,
  },
  {
    id: 10,
    name: { en: 'Heng Piseth', kh: 'ហេង ពិសិដ្ឋ' },
    role: { en: 'Logistics Fleet Lead', kh: 'ប្រធានក្រុមដឹកជញ្ជូន' },
    image: profileImg,
    dept: { en: 'Operations', kh: 'ប្រតិបត្តិការ' },
    rank: 10,
  },
  {
    id: 11,
    name: { en: 'Vannak Sopheak', kh: 'វណ្ណៈ សុភ័ក្ត្រ' },
    role: { en: 'Customer Care Lead', kh: 'ប្រធានផ្នែកបម្រើអតិថិជន' },
    image: profileImg,
    dept: { en: 'Marketing', kh: 'ទីផ្សារ' },
    rank: 11,
  },
  {
    id: 12,
    name: { en: 'Chann Borey', kh: 'ចាន់ បូរី' },
    role: { en: 'Farmer Network Coordinator', kh: 'អ្នកសម្របសម្រួលបណ្តាញកសិករ' },
    image: profileImg,
    dept: { en: 'Operations', kh: 'ប្រតិបត្តិការ' },
    rank: 12,
  },
  {
    id: 13,
    name: { en: 'Seng David', kh: 'សេង ដាវីដ' },
    role: { en: 'Mobile App Developer', kh: 'អ្នកអភិវឌ្ឍកម្មវិធីទូរស័ព្ទ' },
    image: profileImg,
    dept: { en: 'Technology', kh: 'បច្ចេកវិទ្យា' },
    rank: 13,
  },
  {
    id: 14,
    name: { en: 'Ly Socheata', kh: 'លី សុជាតា' },
    role: { en: 'Finance & Accounting Lead', kh: 'ប្រធានផ្នែកហិរញ្ញវត្ថុ' },
    image: profileImg,
    dept: { en: 'Admin', kh: 'រដ្ឋបាល' },
    rank: 14,
  },
  {
    id: 15,
    name: { en: 'Meas Sovann', kh: 'មាស សុវណ្ណ' },
    role: { en: 'Supply Chain Analyst', kh: 'អ្នកវិភាគខ្សែច្រវាក់ផ្គត់ផ្គង់' },
    image: profileImg,
    dept: { en: 'Operations', kh: 'ប្រតិបត្តិការ' },
    rank: 15,
  },
  {
    id: 16,
    name: { en: 'Teng Bunthoeun', kh: 'តេង ប៊ុនធឿន' },
    role: { en: 'Senior Cold Fleet Rider', kh: 'អ្នកដឹកជញ្ជូនជាន់ខ្ពស់' },
    image: profileImg,
    dept: { en: 'Operations', kh: 'ប្រតិបត្តិការ' },
    rank: 16,
  },
]

// Safely normalize member data format
const toCard = (m) => {
  if (!m) return null

  const nameObj = (typeof m.name === 'object' && m.name !== null)
    ? { en: m.name.en || m.name.kh || '', kh: m.name.kh || m.name.en || '' }
    : { en: String(m.fullName || m.name || 'Member'), kh: String(m.fullName || m.name || 'Member') }

  const roleObj = (typeof m.role === 'object' && m.role !== null)
    ? { en: m.role.en || m.role.kh || '', kh: m.role.kh || m.role.en || '' }
    : { en: String(m.position || m.role || 'Team Member'), kh: String(m.position || m.role || 'Team Member') }

  const deptObj = (typeof m.dept === 'object' && m.dept !== null)
    ? { en: m.dept.en || m.dept.kh || 'Operations', kh: m.dept.kh || m.dept.en || 'ប្រតិបត្តិការ' }
    : { en: String(m.department || m.dept || m.category || 'Operations'), kh: String(m.department || m.dept || m.category || 'ប្រតិបត្តិការ') }

  let img = m.photoUrl || m.image || m.avatar || FALLBACK_IMAGE
  if (typeof img === 'string' && img.startsWith('/')) {
    img = `${BACKEND_URL}${img}`
  }

  return {
    id: m.id || Math.random(),
    name: nameObj,
    role: roleObj,
    dept: deptObj,
    image: img || FALLBACK_IMAGE,
    rank: m.rank != null ? Number(m.rank) : null,
  }
}

const DEPT_PRIORITY = { Executive: 0, Technology: 1, Operations: 2, Marketing: 3, Admin: 4, Other: 5 }

const compareMembers = (a, b) => {
  const ar = a.rank == null ? Number.MAX_SAFE_INTEGER : a.rank
  const br = b.rank == null ? Number.MAX_SAFE_INTEGER : b.rank
  if (ar !== br) return ar - br
  const ap = DEPT_PRIORITY[a.dept?.en] ?? 99
  const bp = DEPT_PRIORITY[b.dept?.en] ?? 99
  if (ap !== bp) return ap - bp
  const an = a.name?.en || a.name || ''
  const bn = b.name?.en || b.name || ''
  return String(an).localeCompare(String(bn))
}

const TEXTS = {
  heroEyebrow: { en: 'Our People & Creators', kh: 'ក្រុមការងារ និងអ្នកបង្កើត' },
  title: { en: 'Meet Our Leadership & Team', kh: 'ស្គាល់ថ្នាក់ដឹកនាំ និងក្រុមការងារយើង' },
  subtitle: {
    en: 'The passionate engineers, logistics leads, quality inspectors, and creators behind every 45-minute fresh harvest delivery in Cambodia.',
    kh: 'វិស្វករ អ្នកដឹកនាំភស្តុភារ អ្នកត្រួតពិនិត្យគុណភាព និងអ្នកបង្កើតនៅពីក្រោយរាល់ការដឹកជញ្ជូនបន្លែផ្លែឈើស្រស់ក្នុងរយៈពេល ៤៥ នាទីនៅកម្ពុជា។',
  },
  allDepartments: { en: 'All Members', kh: 'សមាជិកទាំងអស់' },
  searchPlaceholder: { en: 'Search by name or position...', kh: 'ស្វែងរកតាមឈ្មោះ ឬតួនាទី...' },
  joinTitle: { en: 'Want to Join Our Growing Team?', kh: 'ចង់ចូលរួមជាមួយក្រុមការងារយើង?' },
  joinSub: { en: 'We are expanding our software engineering, cold logistics, and agricultural procurement teams.', kh: 'យើងកំពុងពង្រីកក្រុមវិស្វកម្មកម្មវិធី ភស្តុភារត្រជាក់ និងការទិញកសិផល។' },
  joinBtn: { en: 'Explore Career Opportunities', kh: 'ស្វែងរកឱកាសការងារ' },
  noResults: { en: 'No team members found matching your search.', kh: 'រកមិនឃើញសមាជិកដែលត្រូវនឹងការស្វែងរករបស់អ្នកទេ។' },
}

let teamCache = null

export const Member = () => {
  const { lang } = useLanguage()
  const { user } = useAuth()
  const isAdmin = (user?.role || '').toUpperCase() === 'ADMIN'

  const [filter, setFilter] = useState('all')
  const [query, setQuery] = useState('')
  const [team, setTeam] = useState(() => teamCache || FALLBACK_TEAM.map(toCard))

  useEffect(() => {
    let cancelled = false
    const fetchTeam = async () => {
      try {
        let res
        try {
          res = await publicAPI.getMembers()
        } catch {
          res = await memberAPI.getAll()
        }

        const rawList = Array.isArray(res)
          ? res
          : Array.isArray(res?.data)
          ? res.data
          : Array.isArray(res?.content)
          ? res.content
          : []

        if (!cancelled && rawList.length > 0) {
          const mapped = rawList.map(toCard).filter(Boolean)
          teamCache = mapped
          setTeam(mapped)
        }
      } catch {
        if (!cancelled) {
          setTeam(FALLBACK_TEAM.map(toCard).filter(Boolean))
        }
      }
    }

    fetchTeam()
    return () => {
      cancelled = true
    }
  }, [])

  const departments = useMemo(() => {
    const keys = [...new Set(team.map((m) => m.dept?.en || m.dept || '').filter(Boolean))]
    keys.sort((a, b) => (DEPT_PRIORITY[a] ?? 99) - (DEPT_PRIORITY[b] ?? 99) || a.localeCompare(b))
    return [
      { key: 'all', en: TEXTS.allDepartments.en, kh: TEXTS.allDepartments.kh, count: team.length },
      ...keys.map((k) => ({
        key: k,
        en: k,
        kh: k,
        count: team.filter((m) => (m.dept?.en || m.dept || '') === k).length,
      })),
    ]
  }, [team])

  const filteredMembers = useMemo(() => {
    let list = [...team]

    if (filter !== 'all') {
      list = list.filter((m) => {
        const d = m.dept?.en || m.dept || ''
        return String(d).toLowerCase() === String(filter).toLowerCase()
      })
    }

    if (query.trim()) {
      const q = query.trim().toLowerCase()
      list = list.filter((m) => {
        const nameEn = String(m.name?.en || '').toLowerCase()
        const nameKh = String(m.name?.kh || '').toLowerCase()
        const roleEn = String(m.role?.en || '').toLowerCase()
        const roleKh = String(m.role?.kh || '').toLowerCase()
        return (
          nameEn.includes(q) ||
          nameKh.includes(q) ||
          roleEn.includes(q) ||
          roleKh.includes(q)
        )
      })
    }

    return list.sort(compareMembers)
  }, [team, filter, query])

  return (
    <div className="member-page">
      <div className="member-inner">

        {/* ===== HERO BANNER ===== */}
        <section className="member-hero">
          <span className="member-section-eyebrow">
            <img src={trophyIcon} alt="Team" className="member-3d-eyebrow-icon" />
            <span>{TEXTS.heroEyebrow[lang]}</span>
          </span>
          <h1 className="member-hero-title">{TEXTS.title[lang]}</h1>
          <p className="member-hero-sub">{TEXTS.subtitle[lang]}</p>

          {/* Department Filter & Search Bar */}
          <div className="member-controls-bar">
            <div className="member-filter-pills" role="tablist">
              {departments.map((dept) => (
                <button
                  key={dept.key}
                  type="button"
                  role="tab"
                  aria-selected={filter === dept.key}
                  className={`member-pill ${filter === dept.key ? 'member-pill--active' : ''}`}
                  onClick={() => setFilter(dept.key)}
                >
                  <span>{dept[lang] || dept.en}</span>
                  <span className="member-pill-count">{dept.count}</span>
                </button>
              ))}
            </div>

            <div className="member-search-box">
              <span className="member-search-icon">🔍</span>
              <input
                type="text"
                className="member-search-input"
                placeholder={TEXTS.searchPlaceholder[lang]}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
              {query && (
                <button
                  type="button"
                  className="member-search-clear"
                  onClick={() => setQuery('')}
                  aria-label="Clear search"
                >
                  ✕
                </button>
              )}
            </div>
          </div>
        </section>

        {/* ===== TEAM GRID (ONLY PIC, NAME & POSITION) ===== */}
        {filteredMembers.length === 0 ? (
          <div className="member-empty-card">
            <img src={shieldIcon} alt="No members" className="member-empty-3d-icon" />
            <h3 className="member-empty-title">{TEXTS.noResults[lang]}</h3>
            <button
              type="button"
              className="member-empty-btn"
              onClick={() => { setFilter('all'); setQuery('') }}
            >
              <span>{TEXTS.allDepartments[lang]}</span>
            </button>
          </div>
        ) : (
          <div className="member-grid">
            {filteredMembers.map((m) => {
              const memberName = m.name?.[lang] || m.name?.en || m.name || 'Member'
              const memberRole = m.role?.[lang] || m.role?.en || m.role || 'Position'
              const memberImage = m.image || profileImg

              const CardTag = isAdmin ? Link : 'div'
              const cardProps = isAdmin
                ? { to: '/member-detail', state: { member: m } }
                : {}

              return (
                <CardTag
                  key={m.id || memberName}
                  {...cardProps}
                  className={`member-card ${isAdmin ? 'member-card--admin' : ''}`}
                >
                  {/* Picture */}
                  <div className="member-card-visual">
                    <img
                      src={memberImage}
                      alt={memberName}
                      className="member-card-img"
                      onError={(e) => { e.currentTarget.src = profileImg }}
                      loading="lazy"
                    />
                    <div className="member-card-visual-overlay" />
                  </div>

                  {/* Name & Position Only */}
                  <div className="member-card-body">
                    <h3 className="member-card-name">{memberName}</h3>
                    <p className="member-card-role">{memberRole}</p>
                    {isAdmin && (
                      <span className="member-admin-edit-hint">Admin View Details →</span>
                    )}
                  </div>
                </CardTag>
              )
            })}
          </div>
        )}

        {/* ===== JOIN TEAM BANNER ===== */}
        <section className="member-join-banner">
          <div className="member-join-left">
            <div className="member-join-icon-box">
              <img src={rocketIcon} alt="Join" className="member-join-3d-icon" />
            </div>
            <div>
              <h3 className="member-join-title">{TEXTS.joinTitle[lang]}</h3>
              <p className="member-join-sub">{TEXTS.joinSub[lang]}</p>
            </div>
          </div>
          <Link to="/career" className="member-btn-join">
            <img src={flashIcon} alt="Roles" className="member-join-btn-icon" />
            <span>{TEXTS.joinBtn[lang]}</span>
            <span>→</span>
          </Link>
        </section>

      </div>
    </div>
  )
}

export default Member
