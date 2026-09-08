import { useState } from 'react'
import { FiUsers, FiBriefcase } from 'react-icons/fi'
import IndividualsPage from './IndividualsPage'
import CompaniesPage from './CompaniesPage'

// Single "Users" screen that holds both user types as internal tabs
// (replaces the separate Individual Users / Companies nav items).
export default function UsersPage() {
  const [tab, setTab] = useState('individuals')

  const tabs = [
    { key: 'individuals', label: 'Individual Users', icon: FiUsers },
    { key: 'companies', label: 'Companies', icon: FiBriefcase },
  ]

  return (
    <div>
      <div className="flex flex-wrap gap-2 mb-6">
        {tabs.map((t) => {
          const Icon = t.icon
          return (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                tab === t.key
                  ? 'bg-primary text-white'
                  : 'bg-white border border-gray-300 text-gray-600 hover:bg-gray-50'
              }`}
            >
              <Icon className="w-4 h-4" />
              {t.label}
            </button>
          )
        })}
      </div>

      {tab === 'individuals' ? <IndividualsPage /> : <CompaniesPage />}
    </div>
  )
}
