import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useLanguage } from '../../context/LanguageContext'

const SettingsDetail = () => {
  const { lang } = useLanguage()
  const navigate = useNavigate()
  const { settingType } = useParams()

  const SETTINGS_CONFIG = {
    company: {
      title: { en: 'Company Settings', kh: 'ការកំណត់ក្រុមហ៊ុន' },
      icon: '🏢',
      modules: [
        { id: 1, name: { en: 'Company Information', kh: 'ព័ត៌មានក្រុមហ៊ុន' }, icon: '📋', desc: { en: 'View and edit company details', kh: 'មើល និងកែប្រែព័ត៌មានក្រុមហ៊ុន' } },
        { id: 2, name: { en: 'Company Logo', kh: 'លោហូបក្រុមហ៊ុន' }, icon: '🖼️', desc: { en: 'Upload and manage company logo', kh: 'ផ្ទុក និងគ្រប់គ្រងលោហូបក្រុមហ៊ុន' } },
        { id: 3, name: { en: 'Company Address', kh: 'អាសយដ្ឋានក្រុមហ៊ុន' }, icon: '📍', desc: { en: 'Manage company locations', kh: 'គ្រប់គ្រងទីតាំងក្រុមហ៊ុន' } },
      ]
    },
    outlet: {
      title: { en: 'Outlet Settings', kh: 'ការកំណត់ច្រក' },
      icon: '🏪',
      modules: [
        { id: 1, name: { en: 'Add Outlet', kh: 'បន្ថែមច្រក' }, icon: '➕', desc: { en: 'Create new outlet', kh: 'បង្កើតច្រកថ្មី' } },
        { id: 2, name: { en: 'Edit Outlet', kh: 'កែប្រែច្រក' }, icon: '✏️', desc: { en: 'Modify outlet details', kh: 'កែប្រែព័ត៌មានច្រក' } },
        { id: 3, name: { en: 'Outlet List', kh: 'បញ្ជីច្រក' }, icon: '📑', desc: { en: 'View all outlets', kh: 'មើលច្រកទាំងអស់' } },
        { id: 4, name: { en: 'Outlet Hours', kh: 'ម៉ោងច្រក' }, icon: '⏰', desc: { en: 'Manage operating hours', kh: 'គ្រប់គ្រងម៉ោងប្រតិបត្តិការ' } },
      ]
    },
    location: {
      title: { en: 'Location Settings', kh: 'ការកំណត់ទីតាំង' },
      icon: '📍',
      modules: [
        { id: 1, name: { en: 'Add Location', kh: 'បន្ថែមទីតាំង' }, icon: '➕', desc: { en: 'Create new location', kh: 'បង្កើតទីតាំងថ្មី' } },
        { id: 2, name: { en: 'Location List', kh: 'បញ្ជីទីតាំង' }, icon: '📑', desc: { en: 'View all locations', kh: 'មើលទីតាំងទាំងអស់' } },
        { id: 3, name: { en: 'Location Types', kh: 'ប្រភេទទីតាំង' }, icon: '🏷️', desc: { en: 'Manage location types', kh: 'គ្រប់គ្រងប្រភេទទីតាំង' } },
      ]
    },
    users: {
      title: { en: 'User Settings', kh: 'ការកំណត់អ្នកប្រើប្រាស់' },
      icon: '👤',
      modules: [
        { id: 1, name: { en: 'Add User', kh: 'បន្ថែមអ្នកប្រើប្រាស់' }, icon: '➕', desc: { en: 'Create new user', kh: 'បង្កើតអ្នកប្រើប្រាស់ថ្មី' } },
        { id: 2, name: { en: 'User List', kh: 'បញ្ជីអ្នកប្រើប្រាស់' }, icon: '👥', desc: { en: 'View all users', kh: 'មើលអ្នកប្រើប្រាស់ទាំងអស់' } },
        { id: 3, name: { en: 'User Permissions', kh: 'សិទ្ធិអ្នកប្រើប្រាស់' }, icon: '🔐', desc: { en: 'Manage user access', kh: 'គ្រប់គ្រងការទទួលបានអ្នកប្រើប្រាស់' } },
        { id: 4, name: { en: 'User Roles', kh: 'តួនាទីអ្នកប្រើប្រាស់' }, icon: '🎯', desc: { en: 'Assign user roles', kh: 'កំណត់តួនាទីអ្នកប្រើប្រាស់' } },
      ]
    },
    role: {
      title: { en: 'Role Settings', kh: 'ការកំណត់តួនាទី' },
      icon: '🔑',
      modules: [
        { id: 1, name: { en: 'Add Role', kh: 'បន្ថែមតួនាទី' }, icon: '➕', desc: { en: 'Create new role', kh: 'បង្កើតតួនាទីថ្មី' } },
        { id: 2, name: { en: 'Role List', kh: 'បញ្ជីតួនាទី' }, icon: '📑', desc: { en: 'View all roles', kh: 'មើលតួនាទីទាំងអស់' } },
        { id: 3, name: { en: 'Role Permissions', kh: 'សិទ្ធិតួនាទី' }, icon: '🔑', desc: { en: 'Manage role permissions', kh: 'គ្រប់គ្រងសិទ្ធិតួនាទី' } },
      ]
    },
    tax: {
      title: { en: 'Tax Settings', kh: 'ការកំណត់ពន្ធ' },
      icon: '📋',
      modules: [
        { id: 1, name: { en: 'Tax Rates', kh: 'អត្រាពន្ធ' }, icon: '💯', desc: { en: 'Configure tax rates', kh: 'កំណត់អត្រាពន្ធ' } },
        { id: 2, name: { en: 'Tax Rules', kh: 'ច្បាប់ពន្ធ' }, icon: '📝', desc: { en: 'Set tax rules', kh: 'កំណត់ច្បាប់ពន្ធ' } },
        { id: 3, name: { en: 'Tax Groups', kh: 'ក្រុមពន្ធ' }, icon: '📦', desc: { en: 'Manage tax groups', kh: 'គ្រប់គ្រងក្រុមពន្ធ' } },
      ]
    },
    currency: {
      title: { en: 'Currency Settings', kh: 'ការកំណត់រូបិយប័ណ្ណ' },
      icon: '💱',
      modules: [
        { id: 1, name: { en: 'Active Currencies', kh: 'រូបិយប័ណ្ណសកម្ម' }, icon: '💵', desc: { en: 'Enable/disable currencies', kh: 'បើក/បិទរូបិយប័ណ្ណ' } },
        { id: 2, name: { en: 'Exchange Rates', kh: 'អត្រាបង្វិល' }, icon: '🔄', desc: { en: 'Manage exchange rates', kh: 'គ្រប់គ្រងអត្រាបង្វិល' } },
        { id: 3, name: { en: 'Currency Format', kh: 'ទម្រង់រូបិយប័ណ្ណ' }, icon: '🎨', desc: { en: 'Set currency display format', kh: 'កំណត់ទម្រង់ការបង្ហាញរូបិយប័ណ្ណ' } },
      ]
    },
    'price-book': {
      title: { en: 'Price Book Settings', kh: 'ការកំណត់សៀវភៅតម្លៃ' },
      icon: '📚',
      modules: [
        { id: 1, name: { en: 'Create Price Book', kh: 'បង្កើតសៀវភៅតម្លៃ' }, icon: '➕', desc: { en: 'Add new price book', kh: 'បន្ថែមសៀវភៅតម្លៃថ្មី' } },
        { id: 2, name: { en: 'Price List', kh: 'បញ្ជីតម្លៃ' }, icon: '💰', desc: { en: 'Manage pricing', kh: 'គ្រប់គ្រងតម្លៃ' } },
        { id: 3, name: { en: 'Price Rules', kh: 'ច្បាប់តម្លៃ' }, icon: '⚙️', desc: { en: 'Set pricing rules', kh: 'កំណត់ច្បាប់តម្លៃ' } },
      ]
    },
    'approval-type': {
      title: { en: 'Approval Type Settings', kh: 'ការកំណត់ប្រភេទការម៉ាក' },
      icon: '✅',
      modules: [
        { id: 1, name: { en: 'Approval Types', kh: 'ប្រភេទការម៉ាក' }, icon: '📋', desc: { en: 'Manage approval types', kh: 'គ្រប់គ្រងប្រភេទការម៉ាក' } },
        { id: 2, name: { en: 'Approval Workflow', kh: 'លំហូរការម៉ាក' }, icon: '🔄', desc: { en: 'Configure approval workflow', kh: 'កំណត់លំហូរការម៉ាក' } },
        { id: 3, name: { en: 'Approval Levels', kh: 'កម្រិតការម៉ាក' }, icon: '📊', desc: { en: 'Set approval levels', kh: 'កំណត់កម្រិតការម៉ាក' } },
      ]
    },
    'payment-type': {
      title: { en: 'Payment Type Settings', kh: 'ការកំណត់ប្រភេទទូទាត់' },
      icon: '💳',
      modules: [
        { id: 1, name: { en: 'Payment Methods', kh: 'មធ្យោបាយទូទាត់' }, icon: '💰', desc: { en: 'Add/edit payment methods', kh: 'បន្ថែម/កែប្រែមធ្យោបាយទូទាត់' } },
        { id: 2, name: { en: 'Payment Terms', kh: 'លក្ខខណ្ឌទូទាត់' }, icon: '📝', desc: { en: 'Set payment terms', kh: 'កំណត់លក្ខខណ្ឌទូទាត់' } },
        { id: 3, name: { en: 'Payment Gateways', kh: 'ច្រកទូទាត់' }, icon: '🌐', desc: { en: 'Configure payment gateways', kh: 'កំណត់ច្រកទូទាត់' } },
      ]
    },
    email: {
      title: { en: 'Email Settings', kh: 'ការកំណត់សារអ៊ីមែល' },
      icon: '📧',
      modules: [
        { id: 1, name: { en: 'SMTP Configuration', kh: 'ការកំណត់ SMTP' }, icon: '⚙️', desc: { en: 'Configure email server', kh: 'កំណត់ម៉ាស៊ីនមេសារអ៊ីមែល' } },
        { id: 2, name: { en: 'Email Templates', kh: 'ឯកសារគំរូសារ' }, icon: '📄', desc: { en: 'Manage email templates', kh: 'គ្រប់គ្រងឯកសារគំរូសារ' } },
        { id: 3, name: { en: 'Email Notifications', kh: 'ការជូនដំណឹងសារ' }, icon: '🔔', desc: { en: 'Configure notifications', kh: 'កំណត់ការជូនដំណឹង' } },
      ]
    },
    terms: {
      title: { en: 'Terms & Condition Settings', kh: 'ការកំណត់លក្ខខណ្ឌ' },
      icon: '📝',
      modules: [
        { id: 1, name: { en: 'Edit Terms', kh: 'កែប្រែលក្ខខណ្ឌ' }, icon: '✏️', desc: { en: 'Modify terms & conditions', kh: 'កែប្រែលក្ខខណ្ឌ' } },
        { id: 2, name: { en: 'Privacy Policy', kh: 'គោលការណ៍ឯកជនភាព' }, icon: '🔒', desc: { en: 'Manage privacy policy', kh: 'គ្រប់គ្រងគោលការណ៍ឯកជនភាព' } },
      ]
    },
    'system-key': {
      title: { en: 'System Key Settings', kh: 'ការកំណត់សោលគន្លឹះ' },
      icon: '🔐',
      modules: [
        { id: 1, name: { en: 'Change API Key', kh: 'ផ្លាស់ប្តូរសោល API' }, icon: '🔑', desc: { en: 'Update API keys', kh: 'ធ្វើបច្ចុប្បន្នភាពសោល API' } },
        { id: 2, name: { en: 'System License', kh: 'អាជ្ញាប័ណ្ណប្រព័ន្ធ' }, icon: '📜', desc: { en: 'Manage system license', kh: 'គ្រប់គ្រងអាជ្ញាប័ណ្ណប្រព័ន្ធ' } },
      ]
    },
    'bank-account': {
      title: { en: 'Bank Account Settings', kh: 'ការកំណត់គណនីធនាគារ' },
      icon: '🏦',
      modules: [
        { id: 1, name: { en: 'Add Bank Account', kh: 'បន្ថែមគណនីធនាគារ' }, icon: '➕', desc: { en: 'Create new bank account', kh: 'បង្កើតគណនីធនាគារថ្មី' } },
        { id: 2, name: { en: 'Bank List', kh: 'បញ្ជីធនាគារ' }, icon: '📑', desc: { en: 'View all bank accounts', kh: 'មើលគណនីធនាគារទាំងអស់' } },
        { id: 3, name: { en: 'Bank Details', kh: 'ព័ត៌មានលម្អិតធនាគារ' }, icon: '📋', desc: { en: 'Manage bank details', kh: 'គ្រប់គ្រងព័ត៌មានលម្អិតធនាគារ' } },
      ]
    },
    'import-beginning': {
      title: { en: 'Import Beginning', kh: 'ចាប់ផ្តើមនាំចូល' },
      icon: '📥',
      modules: [
        { id: 1, name: { en: 'Import Data', kh: 'នាំចូលទិន្នន័យ' }, icon: '📤', desc: { en: 'Import data from file', kh: 'នាំចូលទិន្នន័យពីឯកសារ' } },
        { id: 2, name: { en: 'Migration Status', kh: 'ស្ថានភាពនៃការផ្លាស់ប្តូរ' }, icon: '⏳', desc: { en: 'Check migration progress', kh: 'ពិនិត្យលម្អិតលម្អិតការផ្លាស់ប្តូរ' } },
      ]
    },
    preference: {
      title: { en: 'Preference Settings', kh: 'ការកំណត់ចូលចិត្ត' },
      icon: '⭐',
      modules: [
        { id: 1, name: { en: 'Language', kh: 'ភាសា' }, icon: '🌐', desc: { en: 'Set default language', kh: 'កំណត់ភាសាលម្អិត' } },
        { id: 2, name: { en: 'Theme', kh: 'ប្រធានបទ' }, icon: '🎨', desc: { en: 'Choose theme', kh: 'ជ្រើសរើសប្រធានបទ' } },
        { id: 3, name: { en: 'Timezone', kh: 'តំបន់ពេលវេលា' }, icon: '🕐', desc: { en: 'Set timezone', kh: 'កំណត់តំបន់ពេលវេលា' } },
      ]
    }
  }

  const config = SETTINGS_CONFIG[settingType] || SETTINGS_CONFIG.company

  return (
    <div className="min-h-screen bg-slate-950 text-white p-6">
      {/* Header */}
      <div className="mb-8">
        <button onClick={() => navigate('/admin/settings')} className="text-cyan-400 hover:text-cyan-300 text-sm mb-4 flex items-center gap-2">
          ← {lang === 'en' ? 'Back to Settings' : 'ត្រឡប់ទៅការកំណត់'}
        </button>
        <div className="flex items-center gap-4 mb-2">
          <span className="text-5xl">{config.icon}</span>
          <h1 className="text-4xl font-bold">{config.title[lang]}</h1>
        </div>
      </div>

      {/* Module Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {config.modules.map((module) => (
          <div
            key={module.id}
            className="p-5 bg-slate-800 border border-slate-700 rounded-lg hover:border-cyan-500/50 hover:bg-slate-700/50 transition-all cursor-pointer group"
          >
            <div className="flex items-start gap-3 mb-3">
              <span className="text-3xl">{module.icon}</span>
              <div className="flex-1">
                <h3 className="font-semibold text-white group-hover:text-cyan-400 transition-colors">{module.name[lang]}</h3>
              </div>
            </div>
            <p className="text-sm text-slate-400 group-hover:text-slate-300 transition-colors">{module.desc[lang]}</p>
          </div>
        ))}
      </div>
    </div>
  )
}

export default SettingsDetail
