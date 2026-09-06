import { useMemo } from 'react'
import { Link, useLocation, useSearchParams } from 'react-router-dom'
import { useLanguage } from '../../context/LanguageContext'

// Assets
import profileImg from '../../assets/Profile.avif'
const hengImg = profileImg
const chheangImg = profileImg
const nithImg = profileImg
const meanImg = profileImg

// 3D Icons
import trophyIcon from '../../assets/icon/3dicons-trophy-dynamic-color.png'
import chatIcon from '../../assets/icon/3dicons-chat-bubble-dynamic-color.png'
import shieldIcon from '../../assets/icon/3dicons-shield-dynamic-color.png'
import callIcon from '../../assets/icon/3dicons-call-in-dynamic-color.png'

import './Memberdetail.css'

const FALLBACK_IMAGE = profileImg

const ALL_MEMBERS = [
  {
    id: 1,
    name: { en: 'Unknow', kh: 'Unknow' },
    role: { en: 'CEO & Founder', kh: 'នាយកប្រតិបត្តិ និងស្ថាបនិក' },
    image: profileImg,
    dept: { en: 'Executive', kh: 'នាយកប្រតិបត្តិ' },
    bio: { en: '10+ years in retail. Built FreshMart from the ground up with a passion for fresh, affordable food.', kh: 'បទពិសោធន៍ជាង ១០ឆ្នាំក្នុងវិស័យលក់រាយ។ បានកសាង FreshMart ពីដំបូងដោយមានចំណង់ចំណូលចិត្តលើអាហារស្រស់ និងមានតម្លៃសមរម្យ។' },
    rank: 1,
    email: 'ceo@freshmart.com',
    phone: '+855 12 000 001',
    location: { en: 'Phnom Penh, Cambodia', kh: 'ភ្នំពេញ, កម្ពុជា' },
  },
  {
    id: 2,
    name: { en: 'Chenda Kim', kh: 'ចិន្តា​ គីម' },
    role: { en: 'Manager', kh: 'នាយកប្រតិបត្តិការ' },
    image: profileImg,
    dept: { en: 'Operations', kh: 'ប្រតិបត្តិការ' },
    bio: { en: 'Keeps everything running smoothly — from warehouse to delivery. Logistics expert with 8 years experience.', kh: 'ធានាឲ្យអ្វីៗដំណើរការរលូន — ពីឃ្លាំងដល់ការដឹកជញ្ជូន។ អ្នកជំនាញផ្នែកដឹកជញ្ជូនដែលមានបទពិសោធន៍ ៨ ឆ្នាំ។' },
    rank: 2,
    email: 'chenda.kim@freshmart.com',
    phone: '+855 12 000 002',
    location: { en: 'Phnom Penh, Cambodia', kh: 'ភ្នំពេញ, កម្ពុជា' },
  },
  {
    id: 3,
    name: { en: 'Dara Meas', kh: 'តារា​ មាស' },
    role: { en: 'HR', kh: 'ប្រធានផ្នែកធនធានមនុស្ស' },
    image: profileImg,
    dept: { en: 'Admin', kh: 'រដ្ឋបាល' },
    bio: { en: 'Creative strategist who makes FreshMart the brand everyone talks about. Former agency lead turned grocery evangelist.', kh: 'អ្នកយុទ្ធសាស្រ្តច្នៃប្រឌិតដែលធ្វើឲ្យ FreshMart ក្លាយជាម៉ាកដែលគ្រប់គ្នានិយាយអំពី។' },
    rank: 3,
    email: 'dara.meas@freshmart.com',
    phone: '+855 12 000 003',
    location: { en: 'Phnom Penh, Cambodia', kh: 'ភ្នំពេញ, កម្ពុជា' },
  },
  {
    id: 4,
    name: { en: 'Thoeun SokHeng', kh: 'ធឿន សុខហេង' },
    role: { en: 'Web Developer', kh: 'អ្នកអភិវឌ្ឍគេហទំព័រ' },
    image: hengImg,
    dept: { en: 'Technology', kh: 'បច្ចេកវិទ្យា' },
    bio: { en: 'Versatile Full Stack Developer experienced in building complete web applications from front-end interfaces to back-end systems and databases. Focused on developing secure, scalable, responsive, and user-friendly digital solutions.', kh: 'អ្នកជំនាញ Full-stack ដែលកសាងប្រព័ន្ធដឹកជញ្ជូនរាប់ពាន់ដងក្នុងមួយថ្ងៃ។ អ្នកចូលរួមចំណែក Open-source និងអ្នកចូលចិត្តកាហ្វេ។' },
    rank: 4,
    email: 'sokheng.thoeun@freshmart.com',
    phone: '+855 70 999 652',
    location: { en: 'Phnom Penh, Cambodia', kh: 'ភ្នំពេញ, កម្ពុជា' },
  },
  {
    id: 5,
    name: { en: 'Chham Vuthy', kh: 'ឆម​ វុទ្ធី' },
    role: { en: 'Merchant Warehouse', kh: 'ឃ្លាំងទំនិញ' },
    image: profileImg,
    dept: { en: 'Operations', kh: 'ប្រតិបត្តិការ' },
    bio: { en: 'Ensures every customer leaves happy. Built our support team from 2 people to 25. Known for replying in under 5 minutes.', kh: 'ធានាឲ្យអតិថិជនគ្រប់រូបពេញចិត្ត។ បានកសាងក្រុមគាំទ្រពី ២នាក់ ទៅ ២៥នាក់។ ល្បីថាឆ្លើយតបក្នុងរយៈពេលក្រោម ៥នាទី។' },
    rank: 5,
    email: 'vuthy.chham@freshmart.com',
    phone: '+855 12 000 005',
    location: { en: 'Phnom Penh, Cambodia', kh: 'ភ្នំពេញ, កម្ពុជា' },
  },
  {
    id: 6,
    name: { en: 'Neang MengChheang', kh: 'នាង​ ម៉េងឈាង' },
    role: { en: 'IT Networking Engineer', kh: 'វិស្វករបណ្តាញ IT' },
    image: chheangImg,
    dept: { en: 'Technology', kh: 'បច្ចេកវិទ្យា' },
    bio: { en: 'Skilled IT Networking Engineer specializing in designing, configuring, maintaining, and troubleshooting computer networks and IT infrastructure. Experienced in network security, connectivity, system monitoring, and maintaining reliable network performance.', kh: 'ភ្ជាប់កសិករក្នុងស្រុក និងអ្នកផលិតដោយផ្ទាល់ទៅកាន់ធ្នើរយើង។ ចូលចិត្តកាត់បន្ថយកាកសំណល់អាហារ និងគាំទ្រកសិករខ្មែរ។' },
    rank: 6,
    email: 'mengchheang.neang@freshmart.com',
    phone: '+855 12 000 006',
    location: { en: 'Phnom Penh, Cambodia', kh: 'ភ្នំពេញ, កម្ពុជា' },
  },
  {
    id: 7,
    name: { en: 'Phal SophaNith', kh: 'ផល សុផានិត' },
    role: { en: 'Warehouse Supervisor', kh: 'អ្នកគ្រប់គ្រងឃ្លាំង' },
    image: nithImg,
    dept: { en: 'Operations', kh: 'ប្រតិបត្តិការ' },
    bio: { en: 'Organized and responsible Warehouse Supervisor with experience in overseeing daily warehouse operations, inventory management, order processing, and team coordination. Focused on maintaining accurate stock levels, efficient workflows, workplace safety, and timely delivery of goods.', kh: 'រចនាបទពិសោធន៍ដ៏ស្រស់ស្អាត និងងាយស្រួលប្រើដែលអ្នកឃើញនៅលើអេក្រង់។ អតីតសិល្បករដែលក្លាយជាអ្នករចនាផលិតផល។' },
    rank: 7,
    email: 'sophanith.phal@freshmart.com',
    phone: '+855 12 000 007',
    location: { en: 'Phnom Penh, Cambodia', kh: 'ភ្នំពេញ, កម្ពុជា' },
  },
  {
    id: 8,
    name: { en: 'Oeun Ramean', kh: 'អឿន រ៉ាមាន' },
    role: { en: 'Graphic Designer', kh: 'អ្នករចនាបទ' },
    image: meanImg,
    dept: { en: 'Technology', kh: 'បច្ចេកវិទ្យា' },
    bio: { en: 'Creative and detail-oriented Graphic Designer specializing in creating visually engaging designs that communicate ideas clearly and effectively. Experienced in developing digital and print materials, branding assets, social media graphics, marketing materials, and other visual content.', kh: 'អ្នកគ្រប់គ្រងលេខដែលធានាឲ្យយើងរក្សាប្រាក់ចំណេញ ខណៈដែលរក្សាតម្លៃឲ្យទាប។ CPA ដែលមានចំណូលចិត្តលើសន្លឹកទិន្នន័យ និងអាហារតាមផ្លូវ។' },
    rank: 8,
    email: 'ramean.oeun@freshmart.com',
    phone: '+855 12 000 008',
    location: { en: 'Phnom Penh, Cambodia', kh: 'ភ្នំពេញ, កម្ពុជា' },
  },
  {
    id: 9,
    name: { en: 'Khim Sreynich', kh: 'ខឹម ស្រីនិច' },
    role: { en: 'Quality Assurance Specialist', kh: 'អ្នកជំនាញត្រួតពិនិត្យគុណភាព' },
    image: profileImg,
    dept: { en: 'Operations', kh: 'ប្រតិបត្តិការ' },
    bio: { en: 'Inspects fresh farm produce daily to guarantee 100% pesticide-free and organic standards.', kh: 'ត្រួតពិនិត្យបន្លែផ្លែឈើស្រស់ៗជារៀងរាល់ថ្ងៃដើម្បីធានាគ្មានជាតិគីមី។' },
    rank: 9,
    email: 'sreynich.khim@freshmart.com',
    phone: '+855 12 000 009',
    location: { en: 'Phnom Penh, Cambodia', kh: 'ភ្នំពេញ, កម្ពុជា' },
  },
  {
    id: 10,
    name: { en: 'Heng Piseth', kh: 'ហេង ពិសិដ្ឋ' },
    role: { en: 'Logistics Fleet Lead', kh: 'ប្រធានក្រុមដឹកជញ្ជូន' },
    image: profileImg,
    dept: { en: 'Operations', kh: 'ប្រតិបត្តិការ' },
    bio: { en: 'Coordinating 50+ sub-zero eco-couriers across Phnom Penh for guaranteed 45-minute dispatch.', kh: 'សម្របសម្រួលអ្នកដឹកជញ្ជូនជាង ៥០ នាក់សម្រាប់ល្បឿន ៤៥ នាទី។' },
    rank: 10,
    email: 'piseth.heng@freshmart.com',
    phone: '+855 12 000 010',
    location: { en: 'Phnom Penh, Cambodia', kh: 'ភ្នំពេញ, កម្ពុជា' },
  },
  {
    id: 11,
    name: { en: 'Vannak Sopheak', kh: 'វណ្ណៈ សុភ័ក្ត្រ' },
    role: { en: 'Customer Care Lead', kh: 'ប្រធានផ្នែកបម្រើអតិថិជន' },
    image: profileImg,
    dept: { en: 'Marketing', kh: 'ទីផ្សារ' },
    bio: { en: 'Available 24/7 resolving inquiries, replacement orders, and customer feedback.', kh: 'បម្រើសេវាកម្ម ២៤/៧ ឆ្លើយតបរាល់ចម្ងល់ និងការជួយអតិថិជន។' },
    rank: 11,
    email: 'sopheak.vannak@freshmart.com',
    phone: '+855 12 000 011',
    location: { en: 'Phnom Penh, Cambodia', kh: 'ភ្នំពេញ, កម្ពុជា' },
  },
  {
    id: 12,
    name: { en: 'Chann Borey', kh: 'ចាន់ បូរី' },
    role: { en: 'Farmer Network Coordinator', kh: 'អ្នកសម្របសម្រួលបណ្តាញកសិករ' },
    image: profileImg,
    dept: { en: 'Operations', kh: 'ប្រតិបត្តិការ' },
    bio: { en: 'Connecting Kandal and Kampot organic growers directly with our temperature-controlled hubs.', kh: 'តភ្ជាប់កសិករខេត្តកណ្តាល និងកំពតដោយផ្ទាល់ជាមួយឃ្លាំងត្រជាក់យើង។' },
    rank: 12,
    email: 'borey.chann@freshmart.com',
    phone: '+855 12 000 012',
    location: { en: 'Phnom Penh, Cambodia', kh: 'ភ្នំពេញ, កម្ពុជា' },
  },
  {
    id: 13,
    name: { en: 'Seng David', kh: 'សេង ដាវីដ' },
    role: { en: 'Mobile App Developer', kh: 'អ្នកអភិវឌ្ឍកម្មវិធីទូរស័ព្ទ' },
    image: profileImg,
    dept: { en: 'Technology', kh: 'បច្ចេកវិទ្យា' },
    bio: { en: 'Building iOS and Android applications for 1-tap fresh grocery ordering.', kh: 'បង្កើតកម្មវិធីទូរស័ព្ទ iOS និង Android សម្រាប់ការបញ្ជាទិញរហ័ស។' },
    rank: 13,
    email: 'david.seng@freshmart.com',
    phone: '+855 12 000 013',
    location: { en: 'Phnom Penh, Cambodia', kh: 'ភ្នំពេញ, កម្ពុជា' },
  },
  {
    id: 14,
    name: { en: 'Ly Socheata', kh: 'លី សុជាតា' },
    role: { en: 'Finance & Accounting Lead', kh: 'ប្រធានផ្នែកហិរញ្ញវត្ថុ' },
    image: profileImg,
    dept: { en: 'Admin', kh: 'រដ្ឋបាល' },
    bio: { en: 'Managing farmer settlements and transparent pricing audits.', kh: 'គ្រប់គ្រងការទូទាត់ជូនកសិករ និងគណនេយ្យភាពតម្លៃ។' },
    rank: 14,
    email: 'socheata.ly@freshmart.com',
    phone: '+855 12 000 014',
    location: { en: 'Phnom Penh, Cambodia', kh: 'ភ្នំពេញ, កម្ពុជា' },
  },
  {
    id: 15,
    name: { en: 'Meas Sovann', kh: 'មាស សុវណ្ណ' },
    role: { en: 'Supply Chain Analyst', kh: 'អ្នកវិភាគខ្សែច្រវាក់ផ្គត់ផ្គង់' },
    image: profileImg,
    dept: { en: 'Operations', kh: 'ប្រតិបត្តិការ' },
    bio: { en: 'Forecasting daily agricultural demand to eliminate post-harvest food waste.', kh: 'ព្យាករណ៍តម្រូវការបន្លែផ្លែឈើដើម្បីកាត់បន្ថយការខូចខាត។' },
    rank: 15,
    email: 'sovann.meas@freshmart.com',
    phone: '+855 12 000 015',
    location: { en: 'Phnom Penh, Cambodia', kh: 'ភ្នំពេញ, កម្ពុជា' },
  },
  {
    id: 16,
    name: { en: 'Teng Bunthoeun', kh: 'តេង ប៊ុនធឿន' },
    role: { en: 'Senior Cold Fleet Rider', kh: 'អ្នកដឹកជញ្ជូនជាន់ខ្ពស់' },
    image: profileImg,
    dept: { en: 'Operations', kh: 'ប្រតិបត្តិការ' },
    bio: { en: 'Top rated courier with over 5,000 flawless 45-minute temperature-locked deliveries.', kh: 'អ្នកដឹកជញ្ជូនឆ្នើមដែលមានការដឹកជញ្ជូនជោគជ័យជាង ៥,០០០ ដង។' },
    rank: 16,
    email: 'bunthoeun.teng@freshmart.com',
    phone: '+855 12 000 016',
    location: { en: 'Phnom Penh, Cambodia', kh: 'ភ្នំពេញ, កម្ពុជា' },
  },
]

const TEXTS = {
  breadcrumbHome: { en: 'Home', kh: 'ទំព័រដើម' },
  breadcrumbTeam: { en: 'Team Directory', kh: 'បញ្ជីក្រុមការងារ' },
  contactTitle: { en: 'Direct Contact & Office', kh: 'ព័ត៌មានទំនាក់ទំនងផ្ទាល់' },
  aboutTitle: { en: 'Professional Background & Role', kh: 'ជីវប្រវត្តិ និងតួនាទីការងារ' },
  email: { en: 'Work Email', kh: 'អ៊ីមែលការងារ' },
  phone: { en: 'Direct Phone', kh: 'លេខទូរស័ព្ទ' },
  location: { en: 'Station Location', kh: 'ទីតាំងបំពេញការងារ' },
  department: { en: 'Division', kh: 'ផ្នែក' },
  otherMembers: { en: 'Explore Other Team Members', kh: 'សមាជិកក្រុមការងារផ្សេងទៀត' },
  callNow: { en: 'Call Phone', kh: 'ទូរស័ព្ទផ្ទាល់' },
  sendMail: { en: 'Send Email', kh: 'ផ្ញើអ៊ីមែល' },
  backToTeam: { en: '← Back to All Members', kh: '← ត្រលប់ទៅបញ្ជីសមាជិក' },
  verifiedBadge: { en: 'Verified Staff', kh: 'បុគ្គលិកផ្លូវការ' },
}

export const Memberdetail = () => {
  const { lang } = useLanguage()
  const location = useLocation()
  const [searchParams] = useSearchParams()

  const queryId = searchParams.get('id')
  const queryName = searchParams.get('name')

  // Resolve member from state or search query or fallback list
  const member = useMemo(() => {
    if (location.state?.member) return location.state.member
    if (queryId) {
      const found = ALL_MEMBERS.find((m) => String(m.id) === String(queryId))
      if (found) return found
    }
    if (queryName) {
      const found = ALL_MEMBERS.find((m) =>
        String(m.name?.en || m.name || '').toLowerCase() === queryName.toLowerCase()
      )
      if (found) return found
    }
    // Default to Thoeun SokHeng or First member if visited directly
    return ALL_MEMBERS.find((m) => m.id === 4) || ALL_MEMBERS[0]
  }, [location.state, queryId, queryName])

  const memberName = typeof member.name === 'object' ? member.name[lang] || member.name.en : member.name || 'Team Member'
  const memberRole = typeof member.role === 'object' ? member.role[lang] || member.role.en : member.role || 'Staff'
  const memberDept = typeof member.dept === 'object' ? member.dept[lang] || member.dept.en : member.dept || 'Operations'
  const memberBio = typeof member.bio === 'object' ? member.bio[lang] || member.bio.en : member.bio || ''
  const memberLocation = typeof member.location === 'object' ? member.location[lang] || member.location.en : member.location || 'Phnom Penh, Cambodia'
  const memberImage = member.image || FALLBACK_IMAGE

  // Other colleagues for quick navigation
  const otherMembers = useMemo(() => {
    return ALL_MEMBERS.filter((m) => m.id !== member.id).slice(0, 4)
  }, [member.id])

  return (
    <div className="md-page">
      <div className="md-inner">

        {/* ── BREADCRUMB ── */}
        <nav className="md-breadcrumb" aria-label="Breadcrumb">
          <Link to="/">{TEXTS.breadcrumbHome[lang]}</Link>
          <span className="md-sep">/</span>
          <Link to="/member">{TEXTS.breadcrumbTeam[lang]}</Link>
          <span className="md-sep">/</span>
          <span className="md-breadcrumb-current">{memberName}</span>
        </nav>

        {/* ── HERO BANNER CARD ── */}
        <section className="md-hero-card">
          <div className="md-avatar-frame">
            <img
              src={memberImage}
              alt={memberName}
              className="md-avatar-img"
              onError={(e) => { e.currentTarget.src = profileImg }}
            />
          </div>

          <div className="md-hero-copy">
            <div className="md-hero-top-badges">
              {memberDept && <span className="md-dept-tag">{memberDept}</span>}
              <span className="md-verified-tag">✓ {TEXTS.verifiedBadge[lang]}</span>
            </div>

            <h1 className="md-name">{memberName}</h1>
            <p className="md-role">{memberRole}</p>

            <div className="md-hero-chips">
              <span className="md-chip">📍 {memberLocation}</span>
              {member.phone && <span className="md-chip">📞 {member.phone}</span>}
              {member.email && <span className="md-chip">✉️ {member.email}</span>}
            </div>
          </div>
        </section>

        {/* ── MAIN CONTENT & SIDEBAR GRID ── */}
        <div className="md-layout">

          {/* LEFT: BIO & BACKGROUND */}
          <div className="md-main-col">
            <section className="md-section">
              <div className="md-section-header">
                <img src={shieldIcon} alt="About" className="md-section-3d-icon" />
                <h2 className="md-section-title">{TEXTS.aboutTitle[lang]}</h2>
              </div>
              <p className="md-bio">{memberBio}</p>
            </section>
          </div>

          {/* RIGHT: CONTACT CARD */}
          <aside className="md-sidebar-col">
            <div className="md-sidebar-card">
              <div className="md-section-header">
                <img src={chatIcon} alt="Contact" className="md-section-3d-icon" />
                <h3 className="md-sidebar-heading">{TEXTS.contactTitle[lang]}</h3>
              </div>

              {member.email && (
                <div className="md-info-item">
                  <span className="md-info-lbl">{TEXTS.email[lang]}</span>
                  <a href={`mailto:${member.email}`} className="md-info-val md-info-link">
                    {member.email}
                  </a>
                </div>
              )}

              {member.phone && (
                <div className="md-info-item">
                  <span className="md-info-lbl">{TEXTS.phone[lang]}</span>
                  <a href={`tel:${member.phone}`} className="md-info-val md-info-link">
                    {member.phone}
                  </a>
                </div>
              )}

              <div className="md-info-item">
                <span className="md-info-lbl">{TEXTS.location[lang]}</span>
                <span className="md-info-val">{memberLocation}</span>
              </div>

              {memberDept && (
                <div className="md-info-item">
                  <span className="md-info-lbl">{TEXTS.department[lang]}</span>
                  <span className="md-info-val">{memberDept}</span>
                </div>
              )}

              <div className="md-contact-actions">
                {member.phone && (
                  <a href={`tel:${member.phone}`} className="md-btn-call">
                    <img src={callIcon} alt="Call" className="md-btn-icon-micro" />
                    <span>{TEXTS.callNow[lang]}</span>
                  </a>
                )}
                {member.email && (
                  <a href={`mailto:${member.email}`} className="md-btn-mail">
                    <span>{TEXTS.sendMail[lang]}</span>
                  </a>
                )}
              </div>

              <Link to="/member" className="md-btn-back">
                <span>{TEXTS.backToTeam[lang]}</span>
              </Link>
            </div>
          </aside>

        </div>

        {/* ── EXPLORE OTHER MEMBERS ROW ── */}
        <section className="md-other-section">
          <div className="md-other-header">
            <img src={trophyIcon} alt="Team" className="md-3d-sm" />
            <h3 className="md-other-title">{TEXTS.otherMembers[lang]}</h3>
          </div>

          <div className="md-other-grid">
            {otherMembers.map((colleague) => {
              const cName = colleague.name?.[lang] || colleague.name?.en || 'Member'
              const cRole = colleague.role?.[lang] || colleague.role?.en || 'Staff'
              const cDept = colleague.dept?.[lang] || colleague.dept?.en || ''
              const cImg = colleague.image || profileImg

              return (
                <Link
                  key={colleague.id}
                  to="/member-detail"
                  state={{ member: colleague }}
                  className="md-other-card"
                >
                  <img
                    src={cImg}
                    alt={cName}
                    className="md-other-img"
                    onError={(e) => { e.currentTarget.src = profileImg }}
                  />
                  <div className="md-other-info">
                    <span className="md-other-dept">{cDept}</span>
                    <h4 className="md-other-name">{cName}</h4>
                    <p className="md-other-role">{cRole}</p>
                  </div>
                </Link>
              )
            })}
          </div>
        </section>

      </div>
    </div>
  )
}

export default Memberdetail