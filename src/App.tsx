import { Canvas, useFrame } from '@react-three/fiber'
import './App.css'
import CasualtyForm from './CasualtyForm'
import HumanModel from './HumanModel'
import { useState, useEffect, useRef } from 'react'
import * as THREE from 'three'

const MarkInjuries = ({ submissions, setSubmissions }) => {

  const initialFormData = {
    manpatzIncidentNumber: '',
    manpatzTraumaNumber: '',
    maanahCasualtyNumber: '',
    id: '',
    personalNumber: '',
    incidentDateTime: '',
    demiseDateTime: '',
    externalTestDateTime: '',
    PMCTDateTime: '',
    PMCTInterpretation: '',
    injuries: []
  }

  const initialInjury = { type: '', description: '', selectedLocation: '', location: { x: 0, y: 0, z: 0 }, radius: 0 }

  const [formData, setFormData] = useState(initialFormData);
  const [injuryFormData, setInjuryFormData] = useState(initialInjury);

  const handleChangeInjury = (e) => {
    const { name, value } = e.target

    // if name contains location, take the last part of the string and set it as the key
    if (name.includes('location')) {
      const locationField = name.split('.').pop()
      setInjuryFormData({
        ...injuryFormData,
        location: {
          ...injuryFormData.location,
          [locationField]: value
        }
      });
      return
    }

    setInjuryFormData({
      ...injuryFormData,
      [name]: value,
    });

  }

  // Handle form input changes
  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData({
      ...formData,
      [name]: value,
    });
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    const savedData = JSON.parse(localStorage.getItem('formSubmissions') || '[]')
    const updatedData = [...savedData, formData]
    localStorage.setItem('formSubmissions', JSON.stringify(updatedData))
    setSubmissions(updatedData);
    setFormData(initialFormData) // Reset form
    console.log('form submitted')
  }

  // Add a new injury object
  const addInjuryField = () => {
    const updatedInjuries = [...formData.injuries, injuryFormData];
    setFormData({
      ...formData,
      injuries: updatedInjuries,
    });
    // reset injury form
    setInjuryFormData(initialInjury);

  };

  // Remove an injury input field
  const removeInjuryField = (index: number) => {
    const updatedInjuries = formData.injuries.filter((_, i) => i !== index);
    setFormData({
      ...formData,
      injuries: updatedInjuries,
    });
  };

  const modelRef = useRef<THREE.Group>(null);
  const [dimensions, setDimensions] = useState({ min: { x: 0, y: 0, z: 0 }, max: { x: 0, y: 0, z: 0 } })
  const [isLoaded, setIsLoaded] = useState(false)



  useEffect(() => {
    if (isLoaded && modelRef.current) {
      const boundingBox = new THREE.Box3().setFromObject(modelRef.current);
      // boundingBox.getSize(new THREE.Vector3()); 

      setDimensions({
        min: {
          x: boundingBox.min.x,
          y: boundingBox.min.y,
          z: boundingBox.min.z
        },
        max: {
          x: boundingBox.max.x,
          y: boundingBox.max.y,
          z: boundingBox.max.z
        }
      })
    }
  }, [modelRef.current]);


  const handleClick = (e) => {
    // Get the mouse coordinates in 3D space
    e.stopPropagation(); // Prevent event from propagating to parent elements

    const boundingBox = new THREE.Box3().setFromObject(modelRef.current);
    const { min, max } = boundingBox

    const { x, y, z } = e.point;
    // console.log({ x, y, z });

    // normalize x, y, z to be between -1, 1
    const normalizedX = (x - min.x) / (max.x - min.x) * 2 - 1
    const normalizedY = (y - min.y) / (max.y - min.y) * 2 - 1
    const normalizedZ = (z - min.z) / (max.z - min.z) * 2 - 1
    // console.log({normalizedX, normalizedY, normalizedZ})

    const fixedX = parseFloat(normalizedX.toFixed(4))
    const fixedY = parseFloat(normalizedY.toFixed(4))
    const fixedZ = parseFloat(normalizedZ.toFixed(4))

    console.log({ fixedX, fixedY, fixedZ })

    setInjuryFormData({
      ...injuryFormData,
      location: {
        x: fixedX,
        y: fixedY,
        z: fixedZ
      }
    });

  };

  return (
    <div>

      <div className='flex flex-row'>

        <div className='flex flex-col w-1/3'>

          <div className='rounded-lg shadow-md p-6 m-6'>

            <div className="">
              <h1 className='text-xl pb-2 mb-4 border-b'>זיהוי החלל</h1>

              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="name">
                  מספר אירוע מנפ"צ
                </label>
                <input
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  id="manpatzIncidentNumber"
                  type="text"
                  placeholder=""
                  name="manpatzIncidentNumber"
                  value={formData.manpatzIncidentNumber}
                  onChange={handleChange}
                />
              </div>

              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="name">
                  מספר טראומה מנפ"צ
                </label>
                <input
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  id="manpatzTraumaNumber"
                  type="text"
                  placeholder=""
                  name="manpatzTraumaNumber"
                  value={formData.manpatzTraumaNumber}
                  onChange={handleChange}
                />
              </div>

              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="name">
                  מספר נפגע במאנ"ח
                </label>
                <input
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  id="maanahCasualtyNumber"
                  type="text"
                  placeholder=""
                  name="maanahCasualtyNumber"
                  value={formData.maanahCasualtyNumber}
                  onChange={handleChange}
                />
              </div>

              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="name">
                  תעודת זהות
                </label>
                <input
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  id="id"
                  type="text"
                  placeholder=""
                  name="id"
                  value={formData.id}
                  onChange={handleChange}
                />
              </div>

              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="name">
                  מספר אישי
                </label>
                <input
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  id="personalNumber"
                  type="text"
                  placeholder=""
                  name="personalNumber"
                  value={formData.personalNumber}
                  onChange={handleChange}
                />
              </div>

              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="name">
                  תאריך ושעת האירוע
                </label>
                <input
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  id="incidentDateTime"
                  type="datetime-local"
                  placeholder=""
                  name="incidentDateTime"
                  value={formData.incidentDateTime}
                  onChange={handleChange}
                />

              </div>

              <h1 className='text-xl text-xl p-2 mb-4 border-b'>נתוני פטירה</h1>

              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="name">
                  תאריך ושעת פטירה
                </label>
                <input
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  id="demiseDateTime"
                  type="datetime-local"
                  placeholder=""
                  name="demiseDateTime"
                  value={formData.demiseDateTime}
                  onChange={handleChange}
                />
              </div>

              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="name">
                  תאריך ושעת בדיקה חיצונית
                </label>
                <input
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  id="externalTestDateTime"
                  type="datetime-local"
                  placeholder=""
                  name="externalTestDateTime"
                  value={formData.externalTestDateTime}
                  onChange={handleChange}
                />
              </div>

              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="name">
                  תאריך ושעת בדיקת PM-CT
                </label>
                <input
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  id="PMCTDateTime"
                  type="datetime-local"
                  placeholder=""
                  name="PMCTDateTime"
                  value={formData.PMCTDateTime}
                  onChange={handleChange}
                />
              </div>

              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="name">
                  פענות PM-CT
                </label>
                <input
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  id="PMCTInterpretation"
                  type="text"
                  placeholder=""
                  name="PMCTInterpretation"
                  value={formData.PMCTInterpretation}
                  onChange={handleChange}
                />
              </div>

            </div>

          </div>

          {/* <CasualtyForm></CasualtyForm> */}
        </div>

        <div className='flex flex-col w-1/3 rounded-lg shadow-md p-6 m-6'>
          <h1 className='text-xl border-b pb-2 mb-4'>מאפייני פציעות וטיפול</h1>

          {/* map over injuries */}
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="type">
              סוג פציעה
            </label>
            <select
              className="w-full py-2 px-3 border rounded shadow text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              name="type"
              value={injuryFormData.type}
              onChange={handleChangeInjury}
              id='type'
            >
              <option value="">בחר</option>
              <option value="פגיעה חודרת">פגיעה חודרת</option>
              <option value="חבלה קהה">חבלה קהה</option>
              <option value="כוויה \ שריפה">כוויה \ שריפה</option>
            </select>
          </div>

          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="injuries.description">
              תיאור פציעה
            </label>
            <input
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              id="injuries.description"
              type="text"
              placeholder=""
              name="description"
              value={injuryFormData.description}
              onChange={handleChangeInjury}
            />
          </div>
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="selectedLocation">
              בחירת מיקום
            </label>
            <select
              className="w-full py-2 px-3 border rounded shadow text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              name="type"
              value={injuryFormData.selectedLocation}
              onChange={handleChangeInjury}
              id='selectedLocation'
            >
              <option value="אחר">אחר</option>
              {/*איבן מין,  אגן אוזניים אחר איבר_מין אמה אף אשך בטן*/}
              <option value="אגן" >אגן</option>
              <option value="אוזניים">אוזניים</option>
              <option value="איבר מין">איבר מין</option>
              <option value="אמה">אמה</option>
              <option value="אף">אף</option>
              <option value="אשך">אשך</option>
              <option value="בטן">בטן</option>
            </select>
          </div>

          <h1 className="block text-gray-700 text-sm font-bold mb-2">
            סימון מיקום
          </h1>

          <div className="flex flex-row mb-4">

            <label className="text-gray-700 font-bold" htmlFor="location.x">x</label>
            <input
              className="shadow appearance-none border rounded w-full py-2 px-3 mx-1 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              type="number"
              placeholder="x"
              name="location.x"
              id='location.x'
              value={injuryFormData.location.x}
              onChange={handleChangeInjury}
            />

            <label className="text-gray-700 font-bold" htmlFor="location.y">y</label>
            <input
              className="shadow appearance-none border rounded w-full py-2 px-3 mx-1 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              type="number"
              placeholder="y"
              name="location.y"
              id='location.y'
              value={injuryFormData.location.y}
              onChange={handleChangeInjury}
            />

            <label className="text-gray-700 font-bold" htmlFor="location.z">z</label>
            <input
              className="shadow appearance-none border rounded w-full py-2 px-3 mx-1 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              type="number"
              placeholder="z"
              name="location.z"
              id='location.z'
              value={injuryFormData.location.z}
              onChange={handleChangeInjury}
            />
          </div>

          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="name">
              רדיוס (ס"מ)
            </label>
            <input
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              type="number"
              placeholder=""
              name="radius"
              value={injuryFormData.radius}
              onChange={handleChangeInjury}
            />
          </div>

          <button
            className='w-1/3 bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline mt-6'
            onClick={addInjuryField}>
            הוסף פציעה
          </button>


          <h1 className='text-xl border-b pb-2 my-4'>רשימת פציעות</h1>
          <ol className='list-decimal'>
            {formData.injuries.map((injury, index) => (
              <li key={index}>{`${injury.type} - ${injury.description} - (${injury.location.x} ${injury.location.y} ${injury.location.z}) - ${injury.radius}`}
                <button
                  className='w-16 h-8 mx-2 bg-red-500 hover:bg-red-700 text-white font-bold rounded focus:outline-none focus:shadow-outline'
                  onClick={() => removeInjuryField(index)}>
                  הסר
                </button>
              </li>
            ))}
          </ol>

        </div>

        <div className="flex flex-col w-1/3 rounded-lg shadow-md p-6 m-6">
          <Canvas camera={{ position: [0, 0.4, 1], fov: 90 }}>
            <HumanModel onClick={handleClick} modelRef={modelRef}></HumanModel>
          </Canvas>
          <button
            className="w-1/4 bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline mt-6"
            onClick={(e) => handleSubmit(e)}
          >
            שמור
          </button>
        </div>
      </div>
    </div>
  )
}

const InjuriesTable = ({ submissions, setSubmissions }) => {

  // Download JSON file
  const handleDownload = () => {
    const data = JSON.stringify(submissions)
    const blob = new Blob([data], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = 'submissions.json'
    link.click()
    URL.revokeObjectURL(url)
  }

  const handleUpload = () => {
    const fileInput = document.createElement('input')
    fileInput.type = 'file'
    fileInput.accept = '.json'
    fileInput.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0]
      if (file) {
        const reader = new FileReader()
        reader.onload = (e) => {
          const content = e.target?.result
          if (typeof content === 'string') {
            const data = JSON.parse(content)
            setSubmissions(data)
            localStorage.setItem('formSubmissions', JSON.stringify(data))
          }
        }
        reader.readAsText(file)
      }
    }
    fileInput.click()
  }

  const handleDelete = () => {
    localStorage.removeItem('formSubmissions')
    setSubmissions([])
  }

  return (
    <div className='flex flex-col'>
      <div className='flex flex-row'>
        <button
          className="w-32 bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 mb-4 mx-2 rounded focus:outline-none focus:shadow-outline mt-6"
          onClick={handleDownload}
        >
          הורדת נתונים
        </button>
        <button
          className="w-32 bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 mb-4 mx-2 rounded focus:outline-none focus:shadow-outline mt-6"
          onClick={handleUpload}
        >
          העלאת נתונים
        </button>
        <button
          className="w-32 bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 mb-4 mx-2 rounded focus:outline-none focus:shadow-outline mt-6"
          onClick={handleDelete}
        >
          הסרת נתונים
        </button>
      </div>


      {/* create a table from submissions, split each injury to a new line */}
      <table>
        <thead className='bg-gray-100'>
          <tr>
            <th>מספר אירוע מנפ"צ</th>
            <th>מספר טראומה מנפ"צ</th>
            <th>מספר נפגע במאנ"ח</th>
            <th>תאריך ושעת האירוע</th>
            <th>תאריך ושעת פטירה</th>
            <th>תאריך ושעת בדיקה חיצונית</th>
            <th>תאריך ושעת בדיקת PM-CT</th>
            <th>פענות PM-CT</th>
            <th>פציעות</th>
          </tr>
        </thead>
        <tbody>
          {submissions.map((submission, index) => (
            <tr key={index}>
              <td>{submission.manpatzIncidentNumber}</td>
              <td>{submission.manpatzTraumaNumber}</td>
              <td>{submission.maanahCasualtyNumber}</td>
              <td>{submission.incidentDateTime}</td>
              <td>{submission.demiseDateTime}</td>
              <td>{submission.externalTestDateTime}</td>
              <td>{submission.PMCTDateTime}</td>
              <td>{submission.PMCTInterpretation}</td>
              <td>
                <ul className='list-decimal'>
                  {submission.injuries.map((injury, index) => (
                    <li key={index}>{`${injury.type} - ${injury.description} - ${injury.selectedLocation} - (${injury.location.x} ${injury.location.y} ${injury.location.z}) - ${injury.radius}`}</li>
                  ))}
                </ul>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

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

        {activeTab === 'markInjuries' && <MarkInjuries submissions={submissions} setSubmissions={setSubmissions}></MarkInjuries>}
        {activeTab === 'injuriesTable' && <InjuriesTable submissions={submissions} setSubmissions={setSubmissions}></InjuriesTable>}

      </div>
    </>
  )
}

export default App
