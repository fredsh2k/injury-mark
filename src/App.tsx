import './App.css'
import { useState } from 'react'
import InjuriesTable from './components/InjuriesTable'
import MarkInjuries from './components/MarkInjuries'
import Analysis from './components/Analysis'

function App() {

  const [submissions, setSubmissions] = useState(() => JSON.parse(localStorage.getItem('formSubmissions') || '[]'))
  const [activeTab, setActiveTab] = useState(() => localStorage.getItem('activeTab') || 'markInjuries')

  const handleTabChange = (tab: string) => {
    setActiveTab(tab)
    localStorage.setItem('activeTab', tab)
    window.location.reload() // TODO: hack to force re-render, find a proper fix
  }

  return (
    <div className='rounded-lg shadow-md p-1 m-1'>

      <div className='border-b'>
        <button
          className={`py-2 px-4 ${activeTab === 'markInjuries' ? 'border-b-2 border-blue-500 text-blue-500' : 'text-gray-500 hover:text-blue-500'}`}
          onClick={() => handleTabChange('markInjuries')}>סימון פציעות</button>

        <button
          className={`py-2 px-4 ${activeTab === 'injuriesTable' ? 'border-b-2 border-blue-500 text-blue-500' : 'text-gray-500 hover:text-blue-500'}`}
          onClick={() => handleTabChange('injuriesTable')}>טבלת חללים</button>

        <button
          className={`py-2 px-4 ${activeTab === 'analysis' ? 'border-b-2 border-blue-500 text-blue-500' : 'text-gray-500 hover:text-blue-500'}`}
          onClick={() => handleTabChange('analysis')}>ניתוח נתונים</button>
      </div>

      {activeTab === 'markInjuries' && <MarkInjuries setSubmissions={setSubmissions}></MarkInjuries>}
      {activeTab === 'injuriesTable' && <InjuriesTable submissions={submissions} setSubmissions={setSubmissions}></InjuriesTable>}
      {activeTab === 'analysis' && <Analysis submissions={submissions}></Analysis>}

    </div>
  )
}

export default App
