import { useEffect, useRef, useState } from "react";
import * as THREE from 'three';
import { Canvas, ThreeEvent } from "@react-three/fiber";
import { Disclosure, DisclosureButton, DisclosurePanel } from '@headlessui/react';
import { ChevronUpIcon } from '@heroicons/react/20/solid';

import { Injury, Marker, Submission, RadiusInjury, PolygonInjury, normalizedToMm } from "../Interfaces";
import { injuryTypes, selectedLocations, protectionMeans } from "../Constants";
import HumanModel from "./HumanModel";

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
    injuries: [],
    protectionMeans: [] as string[],
  }

  const initialRadiusInjury: RadiusInjury = {
    type: injuryTypes[0],
    description: '',
    selectedLocation: selectedLocations[0],
    location: { x: 0, y: 0, z: 0 },
    locationMm: { x: 0, y: 0, z: 0 },
    radius: 0,
    injuryType: 'radius'
  }

  const initialPolygonInjury: PolygonInjury = {
    type: injuryTypes[0],
    description: '',
    selectedLocation: selectedLocations[0],
    locationMm: { x: 0, y: 0, z: 0 },
    location: { x: 0, y: 0, z: 0 },
    vertices: [],
    injuryType: 'polygon'
  }

  const [formData, setFormData] = useState<Submission>(initialFormData);
  const [currentInjuryType, setCurrentInjuryType] = useState<'radius' | 'polygon'>('radius');
  const [injuryFormData, setInjuryFormData] = useState<RadiusInjury | PolygonInjury>(initialRadiusInjury);
  const [markers, setMarkers] = useState<Marker[]>([]);
  const [temporaryVertices, setTemporaryVertices] = useState<THREE.Vector3[]>([]);
  const [marked, setMarked] = useState(false);
  const [, setDimensions] = useState({ min: { x: 0, y: 0, z: 0 }, max: { x: 0, y: 0, z: 0 } });
  const [isLoaded] = useState(false);
  const [isMeasuring, setIsMeasuring] = useState(false);
  const [measurementPoints, setMeasurementPoints] = useState<THREE.Vector3[]>([]);

  const modelRef = useRef<THREE.Group>(null);

  const handleChangeInjury = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;

    if (name.includes('location')) {
      const locationField = name.split('.').pop();
      setInjuryFormData({
        ...injuryFormData,
        location: {
          ...injuryFormData.location,
          [locationField as string]: value
        }
      });
      return;
    }

    setInjuryFormData({
      ...injuryFormData,
      [name]: value,
    });
  }

  const handleInjuryTypeChange = (type: 'radius' | 'polygon') => {
    setCurrentInjuryType(type);
    setInjuryFormData(type === 'radius' ? initialRadiusInjury : initialPolygonInjury);
    setMarkers([]);
    setTemporaryVertices([]);
    setMarked(false);
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
    // reset injury form, but keep the current type
    if (currentInjuryType === 'radius') {
      setInjuryFormData(initialRadiusInjury);
    } else {
      setInjuryFormData(initialPolygonInjury);
    }

    // do not reset currentInjuryType

    // reset marker
    setMarkers([]);
    setMarked(false);

    // reset polygon
    setTemporaryVertices([]);
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

  const normalizePoint = (point: THREE.Vector3) => {
    if (!modelRef.current) return point;
    const boundingBox = new THREE.Box3().setFromObject(modelRef.current);
    const { min, max } = boundingBox;

    const { x, y, z } = point;
    const normalizedX = (x - min.x) / (max.x - min.x) * 2 - 1;
    const normalizedY = (y - min.y) / (max.y - min.y) * 2 - 1;
    const normalizedZ = (z - min.z) / (max.z - min.z) * 2 - 1;

    const fixedX = parseFloat(normalizedX.toFixed(4));
    const fixedY = parseFloat(normalizedY.toFixed(4));
    const fixedZ = parseFloat(normalizedZ.toFixed(4));

    return { x: fixedX, y: fixedY, z: fixedZ };
  }


  const handleClick = (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation();

    const intersect = e.intersections[0];
    if (intersect) {
      const point = intersect.point;

      if (currentInjuryType === 'radius') {
        if (marked) {
          const prevMarkers = markers.slice(0, markers.length - 1);
          setMarkers([...prevMarkers, { location: point }]);
        } else {
          setMarkers([...markers, { location: point }]);
        }
        setMarked(true);
        const normalizedLoc = normalizePoint(point);
        const mmLoc = normalizedToMm(normalizedLoc);
        setInjuryFormData({
          ...injuryFormData,
          location: normalizedLoc,
          locationMm: mmLoc
        });
      } else if (currentInjuryType === 'polygon') {
        setTemporaryVertices([...temporaryVertices, point]);
        setMarkers([...markers, { location: point }]);
        // set location as centroid of polygon
        const centroid = new THREE.Vector3();
        temporaryVertices.forEach(vertex => {
          centroid.add(vertex);
        });
        centroid.divideScalar(temporaryVertices.length);
        const normalizedLoc = normalizePoint(centroid);
        const mmLoc = normalizedToMm(normalizedLoc);
        setInjuryFormData({
          ...injuryFormData,
          location: normalizedLoc,
          locationMm: mmLoc
        });
      }
    }
  };


  const [isSidebarVisible, setIsSidebarVisible] = useState(true);

  const toggleSidebar = () => {
    setIsSidebarVisible(!isSidebarVisible);
  };

  const calculateDistance = (points: THREE.Vector3[]) => {
    if (points.length !== 2) return null;
    
    const p1 = points[0];
    const p2 = points[1];
    
    // Calculate distance components in world space
    const dx = Math.abs(p2.x - p1.x);
    const dy = Math.abs(p2.y - p1.y);
    const dz = Math.abs(p2.z - p1.z);
    
    // Convert to mm using calibrated scale factors
    // These were derived from actual measurements:
    // Shoulder width should be ~460mm (not full body width of 901mm)
    // Height: 1760mm, Depth: 450mm
    const dx_mm = dx * 23.336362;  // X-axis: 23.336362 mm per world unit (460mm shoulders)
    const dy_mm = dy * 24.417468;  // Y-axis: 24.417468 mm per world unit
    const dz_mm = dz * 42.631579;  // Z-axis: 42.631579 mm per world unit
    
    // Calculate 3D Euclidean distance
    const distanceMm = Math.sqrt(dx_mm * dx_mm + dy_mm * dy_mm + dz_mm * dz_mm);
    return distanceMm;
  };

  // Add the injury type selector to your JSX
  const renderInjuryTypeSelector = () => (
    <div className="mb-4">
      <label className="label-text">
        סוג סימון
      </label>
      <div className="flex gap-2">
        <button
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${currentInjuryType === 'radius' ? 'bg-brand-600 text-white shadow-sm' : 'bg-surface-100 text-surface-600 hover:bg-surface-200'}`}
          onClick={() => handleInjuryTypeChange('radius')}
        >
          סימון רדיוס
        </button>
        <button
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${currentInjuryType === 'polygon' ? 'bg-brand-600 text-white shadow-sm' : 'bg-surface-100 text-surface-600 hover:bg-surface-200'}`}
          onClick={() => handleInjuryTypeChange('polygon')}
        >
          סימון פוליגון
        </button>
        <button
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${isMeasuring ? 'bg-amber-500 text-white shadow-sm' : 'bg-surface-100 text-surface-600 hover:bg-surface-200'}`}
          onClick={() => {
            setIsMeasuring(!isMeasuring);
            if (!isMeasuring) {
              setMarkers([]);
              setTemporaryVertices([]);
              setMeasurementPoints([]);
            } else {
              setMeasurementPoints([]);
            }
          }}
        >
          {isMeasuring ? 'ביטול מדידה' : 'כלי מדידה'}
        </button>
      </div>
      {isMeasuring && measurementPoints.length > 0 && (
        <div className="mt-2 text-sm">
          {measurementPoints.length === 1 && (
            <p className="text-surface-500">בחר נקודה שנייה</p>
          )}
          {measurementPoints.length === 2 && (
            <p className="font-bold text-lg text-amber-600">
              מרחק: {Math.round(calculateDistance(measurementPoints) || 0)}mm
            </p>
          )}
        </div>
      )}
    </div>
  );

  const removeVertex = (index: number) => {
    const updatedVertices = temporaryVertices.filter((_, i) => i !== index);
    setTemporaryVertices(updatedVertices);

    const updatedMarkers = markers.filter((_, i) => i !== index);
    setMarkers(updatedMarkers);
  }

  // Modify your existing form to conditionally render radius or polygon specific inputs
  const renderInjurySpecificInputs = () => {
    if (currentInjuryType === 'radius') {
      return (
        <div className="mb-3">
          <label className="label-text" htmlFor="radius">
            רדיוס (ס"מ)
          </label>
          <input
            className="input-field w-1/4"
            type="number"
            name="radius"
            step={0.5}
            value={(injuryFormData as RadiusInjury).radius}
            onChange={handleChangeInjury}
          />
          <div className="mt-3">
            <label className="label-text">מיקום</label>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="text-xs text-surface-500 font-medium" htmlFor="location.x">X</label>
                <input
                  className="input-field"
                  type="number"
                  placeholder="x"
                  name="location.x"
                  id='location.x'
                  value={injuryFormData.location.x}
                  onChange={handleChangeInjury}
                />
                <div className="text-xs text-surface-400 mt-0.5">{injuryFormData.locationMm.x}mm</div>
              </div>

              <div>
                <label className="text-xs text-surface-500 font-medium" htmlFor="location.y">Y</label>
                <input
                  className="input-field"
                  type="number"
                  placeholder="y"
                  name="location.y"
                  id='location.y'
                  value={injuryFormData.location.y}
                  onChange={handleChangeInjury}
                />
                <div className="text-xs text-surface-400 mt-0.5">{injuryFormData.locationMm.y}mm</div>
              </div>

              <div>
                <label className="text-xs text-surface-500 font-medium" htmlFor="location.z">Z</label>
                <input
                  className="input-field"
                  type="number"
                  placeholder="z"
                  name="location.z"
                  id='location.z'
                  value={injuryFormData.location.z}
                  onChange={handleChangeInjury}
                />
                <div className="text-xs text-surface-400 mt-0.5">{injuryFormData.locationMm.z}mm</div>
              </div>
            </div>
          </div>
        </div>
      );
    } else {
      return (
        <div className="mb-3">
          <span className="text-sm text-surface-500 font-medium">
            {temporaryVertices.length} נקודות נבחרו
          </span>
          <ol className='list-decimal mx-4 mt-2 space-y-1'>
            {temporaryVertices.map((vertex, index) => (
              <li key={index} className="text-sm text-surface-600">{`(${normalizePoint(vertex).x} ${normalizePoint(vertex).y} ${normalizePoint(vertex).z})`}
                <button
                  className='btn-danger btn-sm mr-2'
                  onClick={() => removeVertex(index)}>
                  הסר
                </button>
              </li>
            ))}
          </ol>
        </div>
      );
    }
  };

  // Remove the old multi-select handler and add a checkbox handler
  const handleProtectionMeansCheckbox = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    let updated: string[];
    if (e.target.checked) {
      updated = [...formData.protectionMeans, value];
    } else {
      updated = formData.protectionMeans.filter((item) => item !== value);
    }
    setFormData({
      ...formData,
      protectionMeans: updated,
    });
  }

  return (
    <div className="flex h-full">

      {/* Hideable sidebar */}
      {isSidebarVisible && (
        <div className="w-1/3 py-4 px-5 bg-white border-l border-surface-200 overflow-y-auto">
          
          {/* זיהוי החלל Section */}
          <Disclosure defaultOpen>
            {({ open }) => (
              <>
                <DisclosureButton className="flex w-full justify-between items-center rounded-lg bg-gradient-to-l from-brand-600 to-brand-700 px-4 py-2.5 text-sm font-medium text-white hover:from-brand-500 hover:to-brand-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 transition-all duration-200 shadow-sm">
                  <span className="text-base font-bold">זיהוי החלל</span>
                  <ChevronUpIcon
                    className={`${
                      open ? 'rotate-180 transform' : ''
                    } h-5 w-5 text-white/80 transition-transform duration-200`}
                  />
                </DisclosureButton>
                <DisclosurePanel className="px-1 pt-4 pb-2 space-y-3">
                  <div>
                    <label className="label-text" htmlFor="manpatzIncidentNumber">
                      מספר אירוע מנפ"צ
                    </label>
                    <input
                      className="input-field"
                      id="manpatzIncidentNumber"
                      type="text"
                      name="manpatzIncidentNumber"
                      value={formData.manpatzIncidentNumber}
                      onChange={handleChange}
                    />
                  </div>

                  <div>
                    <label className="label-text" htmlFor="manpatzTraumaNumber">
                      מספר טראומה מנפ"צ
                    </label>
                    <input
                      className="input-field"
                      id="manpatzTraumaNumber"
                      type="text"
                      name="manpatzTraumaNumber"
                      value={formData.manpatzTraumaNumber}
                      onChange={handleChange}
                    />
                  </div>

                  <div>
                    <label className="label-text" htmlFor="maanahCasualtyNumber">
                      מספר נפגע במאנ"ח
                    </label>
                    <input
                      className="input-field"
                      id="maanahCasualtyNumber"
                      type="text"
                      name="maanahCasualtyNumber"
                      value={formData.maanahCasualtyNumber}
                      onChange={handleChange}
                    />
                  </div>

                  <div>
                    <label className="label-text" htmlFor="id">
                      תעודת זהות
                    </label>
                    <input
                      className="input-field"
                      id="id"
                      type="text"
                      name="id"
                      value={formData.id}
                      onChange={handleChange}
                    />
                  </div>

                  <div>
                    <label className="label-text" htmlFor="personalNumber">
                      מספר אישי
                    </label>
                    <input
                      className="input-field"
                      id="personalNumber"
                      type="text"
                      name="personalNumber"
                      value={formData.personalNumber}
                      onChange={handleChange}
                    />
                  </div>

                  <div>
                    <label className="label-text" htmlFor="incidentDateTime">
                      תאריך ושעת האירוע
                    </label>
                    <input
                      className="input-field"
                      id="incidentDateTime"
                      type="datetime-local"
                      name="incidentDateTime"
                      value={formData.incidentDateTime}
                      onChange={handleChange}
                    />
                  </div>
                </DisclosurePanel>
              </>
            )}
          </Disclosure>

          {/* נתוני פטירה Section */}
          <Disclosure defaultOpen>
            {({ open }) => (
              <>
                <DisclosureButton className="flex w-full justify-between items-center rounded-lg bg-gradient-to-l from-brand-600 to-brand-700 px-4 py-2.5 text-sm font-medium text-white hover:from-brand-500 hover:to-brand-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 transition-all duration-200 shadow-sm mt-3">
                  <span className="text-base font-bold">נתוני פטירה</span>
                  <ChevronUpIcon
                    className={`${
                      open ? 'rotate-180 transform' : ''
                    } h-5 w-5 text-white/80 transition-transform duration-200`}
                  />
                </DisclosureButton>
                <DisclosurePanel className="px-1 pt-4 pb-2 space-y-3">
                  <div>
                    <label className="label-text" htmlFor="demiseDateTime">
                      תאריך ושעת פטירה
                    </label>
                    <input
                      className="input-field"
                      id="demiseDateTime"
                      type="datetime-local"
                      name="demiseDateTime"
                      value={formData.demiseDateTime}
                      onChange={handleChange}
                    />
                  </div>

                  <div>
                    <label className="label-text" htmlFor="externalTestDateTime">
                      תאריך ושעת בדיקה חיצונית
                    </label>
                    <input
                      className="input-field"
                      id="externalTestDateTime"
                      type="datetime-local"
                      name="externalTestDateTime"
                      value={formData.externalTestDateTime}
                      onChange={handleChange}
                    />
                  </div>

                  <div>
                    <label className="label-text" htmlFor="PMCTDateTime">
                      תאריך ושעת בדיקת PM-CT
                    </label>
                    <input
                      className="input-field"
                      id="PMCTDateTime"
                      type="datetime-local"
                      name="PMCTDateTime"
                      value={formData.PMCTDateTime}
                      onChange={handleChange}
                    />
                  </div>

                  <div>
                    <label className="label-text" htmlFor="PMCTInterpretation">
                      פענוח PM-CT
                    </label>
                    <textarea
                      className="input-field"
                      id="PMCTInterpretation"
                      name="PMCTInterpretation"
                      value={formData.PMCTInterpretation}
                      onChange={handleChange}
                      rows={4}
                    />
                  </div>
                </DisclosurePanel>
              </>
            )}
          </Disclosure>

          {/* אמצעי מיגון Section */}
          <Disclosure defaultOpen>
            {({ open }) => (
              <>
                <DisclosureButton className="flex w-full justify-between items-center rounded-lg bg-gradient-to-l from-brand-600 to-brand-700 px-4 py-2.5 text-sm font-medium text-white hover:from-brand-500 hover:to-brand-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 transition-all duration-200 shadow-sm mt-3">
                  <span className="text-base font-bold">אמצעי מיגון</span>
                  <ChevronUpIcon
                    className={`${
                      open ? 'rotate-180 transform' : ''
                    } h-5 w-5 text-white/80 transition-transform duration-200`}
                  />
                </DisclosureButton>
                <DisclosurePanel className="px-1 pt-4 pb-2">
                  <div className="flex flex-col gap-1.5 bg-surface-50 border border-surface-200 rounded-lg p-3">
                    {protectionMeans.map((item) => (
                      <label key={item} className="flex items-center gap-2 cursor-pointer hover:bg-white rounded px-1 py-0.5 transition-colors">
                        <input
                          type="checkbox"
                          value={item}
                          checked={formData.protectionMeans.includes(item)}
                          onChange={handleProtectionMeansCheckbox}
                          className="filter-checkbox ml-1"
                        />
                        <span className="text-sm text-surface-700">{item}</span>
                      </label>
                    ))}
                  </div>
                </DisclosurePanel>
              </>
            )}
          </Disclosure>

        </div>
      )}

      {/* Main content area */}
      <div className={`flex ${isSidebarVisible ? 'w-3/4' : 'w-full'}`}>
        {/* Left column */}
        <div className={`card mx-3 my-3 p-5 overflow-y-auto ${isSidebarVisible ? 'w-1/2' : 'w-1/3'}`}>
          {/* Toggle button */}
          <button
            onClick={toggleSidebar}
            className="btn-secondary btn-sm mb-4"
          >
            {isSidebarVisible ? (
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M18.75 19.5l-7.5-7.5 7.5-7.5m-6 15L5.25 12l7.5-7.5" />
              </svg>
            ) : (
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M11.25 4.5l7.5 7.5-7.5 7.5m-6-15l7.5 7.5-7.5 7.5" />
              </svg>
            )}
          </button>

          <h2 className='section-title border-b border-surface-200 pb-2 mb-5'>מאפייני פציעות וטיפול</h2>

          <div className="space-y-4">
            <div>
              <label className="label-text" htmlFor="type">
                סוג פציעה
              </label>
              <select
                className="input-field w-2/3"
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

            <div>
              <label className="label-text" htmlFor="injuries.description">
                תיאור פציעה
              </label>
              <textarea
                className="input-field"
                id="injuries.description"
                name="description"
                value={injuryFormData.description}
                onChange={handleChangeInjury}
                rows={3}
              />
            </div>

            <div>
              <label className="label-text" htmlFor="selectedLocation">
                בחירת מיקום
              </label>
              <select
                className="input-field w-1/2"
                name="selectedLocation"
                value={injuryFormData.selectedLocation}
                onChange={handleChangeInjury}
                id='selectedLocation'
              >
                {selectedLocations.map((location, index) => (
                  <option key={index} value={location}>{location}</option>
                ))}
              </select>
            </div>

            <div className="relative group">
              <label className="label-text flex items-center gap-1">
                סימון מיקום
                <span className="inline-flex items-center justify-center w-4 h-4 bg-surface-200 rounded-full text-[10px] text-surface-500 cursor-help">i</span>
              </label>
              <div className="absolute bottom-full right-0 mb-2 hidden group-hover:block w-72 bg-surface-800 text-white text-xs rounded-lg py-2 px-3 shadow-lg z-10">
                לחיצה על המודל תזין את המיקום. כל קואורדינטה מסמלת את המרחק היחסי ממרכז המודל בטווח [1,1-]
              </div>
            </div>

            {renderInjuryTypeSelector()}
            {renderInjurySpecificInputs()}
          </div>

          <button
            className='btn-primary mt-4'
            onClick={addInjuryField}>
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            הוסף פציעה
          </button>


          <h2 className='section-title border-b border-surface-200 pb-2 mt-6 mb-3'>רשימת פציעות</h2>
          {formData.injuries.length === 0 ? (
            <p className="text-sm text-surface-400 italic">אין פציעות רשומות</p>
          ) : (
          <ol className='space-y-2'>
            {formData.injuries.map((injury: Injury, index: number) => (
              <li key={index} className="flex items-center justify-between bg-surface-50 rounded-lg p-3 border border-surface-100">
                <span className="text-sm text-surface-700 flex-1">
                  <span className="font-medium text-surface-800">{index + 1}.</span>{' '}
                  {`${injury.type} - ${injury.description} - ${injury.selectedLocation}`}
                  <span className="text-surface-400 text-xs block mt-0.5">{`(${injury.location.x} ${injury.location.y} ${injury.location.z})`}</span>
                </span>
                <button
                  className='btn-danger btn-sm mr-2 flex-shrink-0'
                  onClick={() => removeInjuryField(index)}>
                  הסר
                </button>
              </li>
            ))}
          </ol>
          )}

        </div>

        {/* Right column - 3D Model */}
        <div className={`card m-3 p-4 flex flex-col ${isSidebarVisible ? 'w-1/2' : 'w-2/3'}`}>
          <button
            className="btn-primary self-start mb-3"
            onClick={(e) => handleSubmit(e)}
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            שמור חלל
          </button>
          <div className="flex-1 rounded-lg overflow-hidden">
            <Canvas camera={{ position: [0, 25, 60], fov: 90 }}>
              <ambientLight intensity={1} />
              <spotLight position={[0, 50, 50]} decay={0} intensity={5} />
              <spotLight position={[0, 50, -50]} decay={0} intensity={5} />
              <pointLight position={[0, 100, 50]} decay={0} intensity={5} />
              <pointLight position={[0, 100, -50]} decay={0} intensity={5} />
              <HumanModel
                onClick={handleClick}
                modelRef={modelRef}
                markers={markers}
                onLoad={() => console.log("loaded")}
                temporaryVertices={temporaryVertices}
                isDrawingPolygon={currentInjuryType === 'polygon'}
                currentRadius={Number((injuryFormData as RadiusInjury).radius)*0.5 || 0.1}
                isMeasuring={isMeasuring}
                onMeasurementChange={setMeasurementPoints}
              />
            </Canvas>
          </div>
        </div>
      </div>

    </div>
  )
}

export default MarkInjuries