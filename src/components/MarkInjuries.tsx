import { Canvas, ThreeEvent } from "@react-three/fiber";
import * as THREE from 'three';
import HumanModel from "./HumanModel";
import { Injury, Marker, Submission } from "../Interfaces";
import { useEffect, useRef, useState } from "react";
import { injuryTypes, selectedLocations } from "../Constants";

const MarkInjuries = ({ setSubmissions }: { setSubmissions: React.Dispatch<React.SetStateAction<Submission[]>> }) => {

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

  const initialInjury = { type: injuryTypes[0], description: '', selectedLocation: selectedLocations[0], location: { x: 0, y: 0, z: 0 }, radius: 0 }

  const [formData, setFormData] = useState<Submission>(initialFormData);
  const [injuryFormData, setInjuryFormData] = useState(initialInjury);
  const [markers, setMarkers] = useState<Marker[]>([]);
  const [marked, setMarked] = useState(false);
  const [, setDimensions] = useState({ min: { x: 0, y: 0, z: 0 }, max: { x: 0, y: 0, z: 0 } })
  const [isLoaded] = useState(false)

  const modelRef = useRef<THREE.Group>(null);

  const handleChangeInjury = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
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
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
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
    setMarkers([])
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

    // reset marker
    setMarked(false);
  };

  // Remove an injury input field
  const removeInjuryField = (index: number) => {
    const updatedInjuries = formData.injuries.filter((_, i) => i !== index);
    setFormData({
      ...formData,
      injuries: updatedInjuries,
    });

    // handle markers
    const updatedMarkers = markers.filter((_, i) => i !== index);
    setMarkers(updatedMarkers);
  };

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
  }, [modelRef.current]);


  const handleClick = (e: ThreeEvent<MouseEvent>) => {
    // Get the mouse coordinates in 3D space
    e.stopPropagation(); // Prevent event from propagating to parent elements

    if (modelRef.current) {
      const boundingBox = new THREE.Box3().setFromObject(modelRef.current);
      const { min, max } = boundingBox

      const { x, y, z } = e.point;

      // // normalize x, y, z to be between -1, 1
      const normalizedX = (x - min.x) / (max.x - min.x) * 2 - 1
      const normalizedY = (y - min.y) / (max.y - min.y) * 2 - 1
      const normalizedZ = (z - min.z) / (max.z - min.z) * 2 - 1

      const fixedX = parseFloat(normalizedX.toFixed(4))
      const fixedY = parseFloat(normalizedY.toFixed(4))
      const fixedZ = parseFloat(normalizedZ.toFixed(4))


      const intersect = e.intersections[0];
      if (intersect) {
        const point = intersect.point;

        if (marked) {
          const prevMarkers = markers.slice(0, markers.length - 1);
          setMarkers([...prevMarkers, { location: point }]);
        } else {
          setMarkers([...markers, { location: point }]);
        }

        setMarked(true);

      }

      setInjuryFormData({
        ...injuryFormData,
        location: {
          x: fixedX,
          y: fixedY,
          z: fixedZ,
          // x: x,
          // y: y,
          // z: z
        }
      });

    }
  };

  const [isSidebarVisible, setIsSidebarVisible] = useState(true);

  const toggleSidebar = () => {
    setIsSidebarVisible(!isSidebarVisible);
  };

  return (
    <div className="flex mb-4" style={{ height: "93vh" }}>

      {/* Hideable sidebar */}
      {isSidebarVisible && (
        <div className="w-1/3 p-4 rounded-lg shadow-md">

          <h1 className='text-xl pb-1 mb-1 border-b'>זיהוי החלל</h1>

          <div className="mb-1">
            <label className="block text-gray-700 text-sm font-bold mb-1" htmlFor="name">
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

          <div className="mb-1">
            <label className="block text-gray-700 text-sm font-bold mb-1" htmlFor="name">
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

          <div className="mb-1">
            <label className="block text-gray-700 text-sm font-bold mb-1" htmlFor="name">
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

          <div className="mb-1">
            <label className="block text-gray-700 text-sm font-bold mb-1" htmlFor="name">
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

          <div className="mb-1">
            <label className="block text-gray-700 text-sm font-bold mb-1" htmlFor="name">
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

          <div className="mb-1">
            <label className="block text-gray-700 text-sm font-bold mb-1" htmlFor="name">
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

          <h1 className='text-xl p-2 mb-1 border-b'>נתוני פטירה</h1>

          <div className="mb-1">
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

          <div className="mb-1">
            <label className="block text-gray-700 text-sm font-bold mb-1" htmlFor="name">
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

          <div className="mb-1">
            <label className="block text-gray-700 text-sm font-bold mb-1" htmlFor="name">
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

          <div className="mb-1">
            <label className="block text-gray-700 text-sm font-bold mb-1" htmlFor="name">
              פענוח PM-CT
            </label>
            <textarea
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              id="PMCTInterpretation"
              placeholder=""
              name="PMCTInterpretation"
              value={formData.PMCTInterpretation}
              onChange={handleChange}
              rows={5}
            />
          </div>

        </div>
      )}

      {/* Main content area */}
      <div className={`flex ${isSidebarVisible ? 'w-3/4' : 'w-full'}`}>
        {/* Left column */}
        <div className={`rounded-lg shadow-md mx-4 p-2 ${isSidebarVisible ? 'w-1/2' : 'w-1/3'}`}>
          {/* Toggle button */}
          <button
            onClick={toggleSidebar}
            className=" bg-blue-500 hover:bg-blue-700 text-white px-2 py-1 rounded font-bold"
          >
            {isSidebarVisible ? '<<' : '>>'}
          </button>

          <h1 className='text-xl border-b pb-1 mb-4'>מאפייני פציעות וטיפול</h1>

          <div className="mb-1">
            <label className="block text-gray-700 text-sm font-bold mb-1" htmlFor="type">
              סוג פציעה
            </label>
            <select
              className="w-1/2 py-2 px-3 border rounded shadow text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              name="type"
              value={injuryFormData.type}
              onChange={handleChangeInjury}
              id='type'
            >
              {injuryTypes.map((type, index) => (
                <option key={index} value={type}>{type}</option>
              ))}
            </select>
          </div>

          <div className="mb-1">
            <label className="block text-gray-700 text-sm font-bold mb-1" htmlFor="injuries.description">
              תיאור פציעה
            </label>
            <textarea
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              id="injuries.description"
              placeholder=""
              name="description"
              value={injuryFormData.description}
              onChange={handleChangeInjury}
              rows={3}
            />
          </div>
          <div className="mb-1">
            <label className="block text-gray-700 text-sm font-bold mb-1" htmlFor="selectedLocation">
              בחירת מיקום
            </label>
            <select
              className="w-1/3 py-2 px-3 border rounded shadow text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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

          <div className="relative group">
            <h1 className="block text-gray-700 text-sm font-bold mb-1">
              סימון מיקום <span className="ml-2">(i)</span>
            </h1>
            <div className="absolute bottom-full left-1/2 transform -translate-x-1/4 mb-2 hidden group-hover:block w-128 bg-black text-white text-xs rounded py-2 px-3">
              לחיצה על המודל תזין את המיקום. כל קוארדינטה מסמלת את המרחק היחסי מראשית הצירים בטווח [1,1-]
            </div>
          </div>

          <div className="flex flex-row mb-1">

            <label className="text-gray-700 font-bold mt-2" htmlFor="location.x">x</label>
            <input
              className="shadow appearance-none border rounded w-full py-2 px-3 mx-1 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              type="number"
              placeholder="x"
              name="location.x"
              id='location.x'
              value={injuryFormData.location.x}
              onChange={handleChangeInjury}
            />

            <label className="text-gray-700 font-bold mt-2" htmlFor="location.y">y</label>
            <input
              className="shadow appearance-none border rounded w-full py-2 px-3 mx-1 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              type="number"
              placeholder="y"
              name="location.y"
              id='location.y'
              value={injuryFormData.location.y}
              onChange={handleChangeInjury}
            />

            <label className="text-gray-700 font-bold mt-2" htmlFor="location.z">z</label>
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

          <div className="mb-1">
            <label className="block text-gray-700 text-sm font-bold mb-1" htmlFor="name">
              רדיוס (ס"מ)
            </label>
            <input
              className="shadow appearance-none border rounded w-1/4 px-3 py-2 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              type="number"
              placeholder=""
              name="radius"
              value={injuryFormData.radius}
              onChange={handleChangeInjury}
            />
          </div>

          <button
            className='w-1/4 bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline mt-1'
            onClick={addInjuryField}>
            הוסף פציעה
          </button>


          <h1 className='text-xl border-b pb-1 my-1'>רשימת פציעות</h1>
          <ol className='list-decimal mx-4'>
            {formData.injuries.map((injury: Injury, index: number) => (
              <li key={index}>{`${injury.type} - ${injury.description} - ${injury.selectedLocation} - (${injury.location.x} ${injury.location.y} ${injury.location.z}) - ${injury.radius}`}
                <button
                  className='w-16 h-8 m-1 bg-red-500 hover:bg-red-700 text-white font-bold rounded focus:outline-none focus:shadow-outline'
                  onClick={() => removeInjuryField(index)}>
                  הסר
                </button>
                <hr></hr>
              </li>
            ))}
          </ol>

        </div>

        {/* Right column */}
        <div className={`rounded-lg shadow-md p-4 ${isSidebarVisible ? 'w-1/2' : 'w-2/3'}`}>
          <button
            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
            onClick={(e) => handleSubmit(e)}
          >
            שמור חלל
          </button>
          <Canvas camera={{ position: [0, 25, 60], fov: 90 }}>
            <ambientLight intensity={1} />
            <spotLight position={[0, 50, 50]} decay={0} intensity={5} />
            <spotLight position={[0, 50, -50]} decay={0} intensity={5} />
            <pointLight position={[0, 100, 50]} decay={0} intensity={5} />
            <pointLight position={[0, 100, -50]} decay={0} intensity={5} />
            <HumanModel onClick={handleClick} modelRef={modelRef} markers={markers} onLoad={() => console.log("loaded")}></HumanModel>
          </Canvas>
        </div>
      </div>

    </div>
  )
}

export default MarkInjuries