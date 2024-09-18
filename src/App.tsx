import { Canvas, ThreeEvent } from '@react-three/fiber'
import './App.css'
import HumanModel from './HumanModel'
import { useState, useEffect, useRef } from 'react'
import * as THREE from 'three'

interface Marker {
  position: THREE.Vector3;
}

const MarkInjuries = ({ setSubmissions }: { setSubmissions: React.Dispatch<React.SetStateAction<Submission[]>> }) => {



  const selectedLocations = [
    'אחר',
    'אגן',
    'אוזניים',
    'איבר מין',
    'אמה',
    'אף',
    'אשך',
    'בטן',
    'בטן עליון',
    'בטן תחתון',
    'בית השחי',
    'ברך',
    'גב',
    'גב עליון',
    'גב תחתון',
    'גפיים עליונות',
    'גפיים תחתונות',
    'התחשמלות',
    'זרוע',
    'חזה',
    'טביעה',
    'ירך',
    'כללי',
    'כף יד',
    'כף רגל',
    'כתף',
    'לא ידוע',
    'לסת',
    'מפשעה',
    'מרפק',
    'נפש',
    'עיניים',
    'עכוז',
    'פה',
    'פנים',
    'צוואר',
    'צוואר אחורי',
    'צוואר קדמי',
    'קרקפת',
    'ראש',
    'שאיפה',
    'שוק',
    'תרמי'
  ];

  // פגיעה חודרת - ירי, פגיעה חודרת - רסיס, פגיעה חודרת - דקירה, פגיעה חודרת - אחר
  // גוף זר
  // חבלה קהה
  // כוויה / שריפה - תרמית, כוויה / שריפה - כימית, כוויה / שריפה - חשמלית, כוויה / שריפה - אחר
  // פיח
  // קטיעה - קטיעה חלקית, קטיעה - קטיעה מלאה
  // שפשוף
  // המטומה תת עורית
  // דפורמציה גרמית - שבר סגור, דפורמציה גרמית - שבר פתוח
  // חסר רקמה משמעותי
  // CAT
  // חבישה - פקינג, חבישה - FC, חבישה - אחר
  // פרוצדורה רפואית פולשנית - עירוי IV, פרוצדורה רפואית פולשנית - עירוי IO, פרוצדורה רפואית פולשנית - אינטובציה, פרוצדורה רפואית פולשנית - קוניוטומיה, פרוצדורה רפואית פולשנית - נקז חזה, פרוצדורה רפואית פולשנית - נידל
  // פגיעות גדולות / אחרות / כלליות

  // create a list of injury types from the text above
  const injuryTypes = [
    'פגיעות גדולות / אחרות / כלליות',
    'פגיעה חודרת - ירי',
    'פגיעה חודרת - רסיס',
    'פגיעה חודרת - דקירה',
    'פגיעה חודרת - אחר',
    'גוף זר',
    'חבלה קהה',
    'כוויה / שריפה - תרמית',
    'כוויה / שריפה - כימית',
    'כוויה / שריפה - חשמלית',
    'כוויה / שריפה - אחר',
    'פיח',
    'קטיעה - קטיעה חלקית',
    'קטיעה - קטיעה מלאה',
    'שפשוף',
    'המטומה תת עורית',
    'דפורמציה גרמית - שבר סגור',
    'דפורמציה גרמית - שבר פתוח',
    'חסר רקמה משמעותי',
    'CAT',
    'חבישה - פקינג',
    'חבישה - FC',
    'חבישה - אחר',
    'פרוצדורה רפואית פולשנית - עירוי IV',
    'פרוצדורה רפואית פולשנית - עירוי IO',
    'פרוצדורה רפואית פולשנית - אינטובציה',
    'פרוצדורה רפואית פולשנית - קוניוטומיה',
    'פרוצדורה רפואית פולשנית - נקז חזה',
    'פרוצדורה רפואית פולשנית - נידל',
  ];

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

  const [formData, setFormData] = useState<Submission>(initialFormData);
  const [injuryFormData, setInjuryFormData] = useState(initialInjury);
  const [markers, setMarkers] = useState<Marker[]>([]);
  const [marker, setMarker] = useState<Marker | null>(null);
  const [marked, setMarked] = useState(false);


  const handleChangeInjury = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target

    // if name contains location, take the last part of the string and set it as the key
    if (name.includes('location')) {
      const locationField = name.split('.').pop()
      setInjuryFormData({
        ...injuryFormData,
        location: {
          ...injuryFormData.location,
          [locationField as string]: value
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
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;

    setFormData({
      ...formData,
      [name]: value,
    });
  }

  const handleSubmit = (e: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
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

    // add marker to markers
    if (marker) {
      setMarkers([...markers, marker]);
    }

    // reset marker
    setMarker(null);
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
  const [, setDimensions] = useState({ min: { x: 0, y: 0, z: 0 }, max: { x: 0, y: 0, z: 0 } })
  const [isLoaded] = useState(false)



  useEffect(() => {
    if (isLoaded && modelRef.current) {

      if (modelRef.current) {
        const boundingBox = new THREE.Box3().setFromObject(modelRef.current);
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
    }
    // boundingBox.getSize(new THREE.Vector3()); 

  }, [modelRef.current]);


  const handleClick = (e: ThreeEvent<MouseEvent>) => {
    // Get the mouse coordinates in 3D space
    e.stopPropagation(); // Prevent event from propagating to parent elements

    if (modelRef.current) {
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

      const intersect = e.intersections[0];
      if (intersect) {
        const point = intersect.point;
        setMarker({ position: point });

        if (marked) {
          const prevMarkers = markers.slice(0, markers.length - 1);
          setMarkers([...prevMarkers, { position: point }]);
        } else {
          setMarkers([...markers, { position: point }]);
        }

        setMarked(true);

      }

      setInjuryFormData({
        ...injuryFormData,
        location: {
          x: fixedX,
          y: fixedY,
          z: fixedZ
        }
      });

    }


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
              {/* create option from each injury type */}
              {injuryTypes.map((type, index) => (
                <option key={index} value={type}>{type}</option>
              ))}
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
              name="selectedLocation"
              value={injuryFormData.selectedLocation}
              onChange={handleChangeInjury}
              id='selectedLocation'
            >
              {/* create option from each selectedLocation */}
              {selectedLocations.map((location, index) => (
                <option key={index} value={location}>{location}</option>
              ))}
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
            {formData.injuries.map((injury: Injury, index: number) => (
              <li key={index}>{`${injury.type} - ${injury.description} - (${injury.location.x} ${injury.location.y} ${injury.location.z}) - ${injury.radius}`}
                <button
                  className='w-16 h-8 m-1 bg-red-500 hover:bg-red-700 text-white font-bold rounded focus:outline-none focus:shadow-outline'
                  onClick={() => removeInjuryField(index)}>
                  הסר
                </button>
              </li>
            ))}
          </ol>

        </div>

        <div className="flex flex-col w-1/3 rounded-lg shadow-md p-6 m-6">
          <Canvas camera={{ position: [0, 0.4, 1], fov: 90 }}>
            <HumanModel onClick={handleClick} modelRef={modelRef} markers={markers}></HumanModel>
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

// create interface injury
interface Injury {
  type: string
  description: string
  selectedLocation: string
  location: {
    x: number
    y: number
    z: number
  }
  radius: number
}
// create type submission
interface Submission {
  manpatzIncidentNumber: string
  manpatzTraumaNumber: string
  maanahCasualtyNumber: string
  id: string
  personalNumber: string
  incidentDateTime: string
  demiseDateTime: string
  externalTestDateTime: string
  PMCTDateTime: string
  PMCTInterpretation: string
  injuries: Injury[]
}

interface InjuriesTableProps {
  submissions: Submission[];
  setSubmissions: React.Dispatch<React.SetStateAction<Submission[]>>;
}

const InjuriesTable = ({ submissions, setSubmissions }: InjuriesTableProps) => {

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

  const handleRowDelete = (index: number) => {
    const updatedSubmissions = submissions.filter((_, i) => i !== index);
    setSubmissions(updatedSubmissions);
    localStorage.setItem('formSubmissions', JSON.stringify(updatedSubmissions));
  };

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
          <tr className='border border-gray-300'>
            <th>מספר אירוע מנפ"צ</th>
            <th>מספר טראומה מנפ"צ</th>
            <th>מספר נפגע במאנ"ח</th>
            <th>תאריך ושעת האירוע</th>
            <th>תאריך ושעת פטירה</th>
            <th>תאריך ושעת בדיקה חיצונית</th>
            <th>תאריך ושעת בדיקת PM-CT</th>
            <th>פענות PM-CT</th>
            <th>פציעות</th>
            <th>הסרה</th>
          </tr>
        </thead>
        <tbody>
          {submissions.map((submission: Submission, index: number) => (
            <tr key={index} className='border border-gray-300 hover:bg-gray-100'>
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
                    <li key={index}>{`${injury.type} - ${injury.description} - ${injury.selectedLocation} (${injury.location.x} ${injury.location.y} ${injury.location.z}) - ${injury.radius}`}</li>
                  ))}
                </ul>
              </td>
              <td>
                {/* row delete button */}
                <button
                  className='w-16 h-8 bg-red-500 hover:bg-red-700 text-white font-bold rounded focus:outline-none focus:shadow-outline'
                  onClick={() => handleRowDelete(index)}
                >
                  הסר
                </button>
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

        {activeTab === 'markInjuries' && <MarkInjuries setSubmissions={setSubmissions}></MarkInjuries>}
        {activeTab === 'injuriesTable' && <InjuriesTable submissions={submissions} setSubmissions={setSubmissions}></InjuriesTable>}

      </div>
    </>
  )
}

export default App
