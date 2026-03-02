import './App.css'
import { useState } from 'react'
import InjuriesTable from './components/InjuriesTable'
import MarkInjuries from './components/MarkInjuries'
import Analysis from './components/Analysis'

const tabs = [
  { id: 'markInjuries', label: 'סימון פציעות', icon: (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
    </svg>
  )},
  { id: 'injuriesTable', label: 'טבלת חללים', icon: (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3.375 19.5h17.25m-17.25 0a1.125 1.125 0 01-1.125-1.125M3.375 19.5h7.5c.621 0 1.125-.504 1.125-1.125m-9.75 0V5.625m0 12.75v-1.5c0-.621.504-1.125 1.125-1.125m18.375 2.625V5.625m0 12.75c0 .621-.504 1.125-1.125 1.125m1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125m0 3.75h-7.5A1.125 1.125 0 0112 18.375m9.75-12.75c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125m19.5 0v1.5c0 .621-.504 1.125-1.125 1.125M2.25 5.625v1.5c0 .621.504 1.125 1.125 1.125m0 0h17.25m-17.25 0h7.5c.621 0 1.125.504 1.125 1.125M3.375 8.25c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125m17.25-3.75h-7.5c-.621 0-1.125.504-1.125 1.125m8.625-1.125c.621 0 1.125.504 1.125 1.125v1.5c0 .621-.504 1.125-1.125 1.125m-17.25 0h7.5m-7.5 0c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125M12 10.875v-1.5m0 1.5c0 .621-.504 1.125-1.125 1.125M12 10.875c0 .621.504 1.125 1.125 1.125m-2.25 0c.621 0 1.125.504 1.125 1.125M13.125 12h7.5m-7.5 0c-.621 0-1.125.504-1.125 1.125M20.625 12c.621 0 1.125.504 1.125 1.125v1.5c0 .621-.504 1.125-1.125 1.125m-17.25 0h7.5M12 14.625v-1.5m0 1.5c0 .621-.504 1.125-1.125 1.125M12 14.625c0 .621.504 1.125 1.125 1.125m-2.25 0c.621 0 1.125.504 1.125 1.125m0 0v1.5c0 .621-.504 1.125-1.125 1.125" />
    </svg>
  )},
  { id: 'analysis', label: 'ניתוח נתונים', icon: (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
    </svg>
  )},
] as const

function App() {

  const [submissions, setSubmissions] = useState(() => JSON.parse(localStorage.getItem('formSubmissions') || '[]'))
  const [activeTab, setActiveTab] = useState(() => localStorage.getItem('activeTab') || 'markInjuries')

  const handleTabChange = (tab: string) => {
    setActiveTab(tab)
    localStorage.setItem('activeTab', tab)
    window.location.reload() // TODO: hack to force re-render, find a proper fix
  }

  return (
    <div className="min-h-screen bg-surface-50">
      {/* Header */}
      <header className="bg-white border-b border-surface-200 sticky top-0 z-50 shadow-sm">
        <div className="px-4 sm:px-6">
          <div className="flex items-center justify-between h-16">
            {/* Logo / Brand */}
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-gradient-to-br from-brand-500 to-brand-700 rounded-lg flex items-center justify-center shadow-sm">
                <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
                </svg>
              </div>
              <div>
                <h1 className="text-lg font-bold text-surface-900 tracking-tight">Injury Mark</h1>
                <p className="text-xs text-surface-400 -mt-0.5">מערכת סימון פציעות</p>
              </div>
            </div>

            {/* Tab Navigation */}
            <nav className="flex items-center gap-1">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  className={`relative flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                    activeTab === tab.id
                      ? 'bg-brand-50 text-brand-700 shadow-sm'
                      : 'text-surface-500 hover:text-surface-700 hover:bg-surface-100'
                  }`}
                  onClick={() => handleTabChange(tab.id)}
                >
                  {tab.icon}
                  <span>{tab.label}</span>
                  {activeTab === tab.id && (
                    <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-brand-600 rounded-full" />
                  )}
                </button>
              ))}
            </nav>

            {/* Stats Badge */}
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-surface-100 rounded-full text-xs font-medium text-surface-600">
                <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                {submissions.length} חללים
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="h-[calc(100vh-4rem)]">
        {activeTab === 'markInjuries' && <MarkInjuries setSubmissions={setSubmissions} />}
        {activeTab === 'injuriesTable' && <InjuriesTable submissions={submissions} setSubmissions={setSubmissions} />}
        {activeTab === 'analysis' && <Analysis submissions={submissions} />}
      </main>
    </div>
  )
}

export default App
