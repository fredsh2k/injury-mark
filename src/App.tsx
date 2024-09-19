import './App.css'
import { useState }from 'react'
import InjuriesTable from './components/InjuriesTable'
import MarkInjuries from './components/MarkInjuries'

function App() {

  const [submissions, setSubmissions] = useState(() => JSON.parse(localStorage.getItem('formSubmissions') || '[]'))
  const [activeTab, setActiveTab] = useState(() => localStorage.getItem('activeTab') || 'markInjuries')


  const handleTabChange = (tab: string) => {
    setActiveTab(tab)
    localStorage.setItem('activeTab', tab)
  }

  return (
    <>
      <div className='rounded-lg shadow-md p-6 m-6'>

        <div className='border-b'>
          <button
            className={`py-2 px-4 ${activeTab === 'markInjuries' ? 'border-b-2 border-blue-500 text-blue-500' : 'text-gray-500 hover:text-blue-500'}`}
            onClick={() => handleTabChange('markInjuries')}>סימון פציעות</button>

          <button
            className={`py-2 px-4 ${activeTab === 'injuriesTable' ? 'border-b-2 border-blue-500 text-blue-500' : 'text-gray-500 hover:text-blue-500'}`}
            onClick={() => handleTabChange('injuriesTable')}>טבלת חללים</button>
        </div>

        {activeTab === 'markInjuries' && <MarkInjuries setSubmissions={setSubmissions}></MarkInjuries>}
        {activeTab === 'injuriesTable' && <InjuriesTable submissions={submissions} setSubmissions={setSubmissions}></InjuriesTable>}

      </div>
    </>
  )
}

export default App
