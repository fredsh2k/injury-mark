import { useState, useEffect, useRef, Suspense } from 'react'
import HumanModel from './HumanModel';

const CasualtyForm = () => {
  const initialFormState = {
    manpatzIncidentNumber: '',
    manpatzTraumaNumber: '',
    maanahCasualityNumber: '',
    id: '',
    personalNumber: '',
    casualityDate: '',
    casualityTime: '',
    demiseDate: '',
    demiseTime: '',
    pmCTDate: '',
    pmCTTime: '',
    pmCTInterpretation: '',
    injuries: [{ type: '', description: '', location: { x: 0, y: 0, z: 0 }, radius: 0 }], // Start with one empty injury
  }

  const [formData, setFormData] = useState(initialFormState)
  const [submissions, setSubmissions] = useState<any[]>([]);

  useEffect(() => {
    const savedData = JSON.parse(localStorage.getItem('formSubmissions') || '[]');
    setSubmissions(savedData);
  }, [])

  // Handle form input changes
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
    index?: number,
    field?: string,
    locationField?: string
  ) => {
    const { name, value } = e.target;
    // Convert value to number for location fields
    const updatedValue = locationField ? Number(value) : value;

    // Handle change for injury fields
    if (index !== undefined) {
      const updatedInjuries = [...formData.injuries];

      if (locationField) {
        // Update nested location fields (x, y, z)
        updatedInjuries[index].location = {
          ...updatedInjuries[index].location,
          [locationField]: updatedValue
        };
      } else if (field) {
        // Update other fields (type, description, radius)
        updatedInjuries[index][field] = updatedValue;
      }

      setFormData({
        ...formData,
        injuries: updatedInjuries,
      });
    } else {
      // Handle change for other fields (name, email, phone, address)
      setFormData({
        ...formData,
        [name]: value,
      });
    }
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const savedData = JSON.parse(localStorage.getItem('formSubmissions') || '[]')
    const updatedData = [...savedData, formData]
    localStorage.setItem('formSubmissions', JSON.stringify(updatedData))
    setSubmissions(updatedData);
    setFormData(initialFormState) // Reset form
    console.log('form submitted')
  }

  // Add a new injury object
  const addInjuryField = () => {
    setFormData({
      ...formData,
      injuries: [
        ...formData.injuries,
        { type: '', description: '', location: { x: '', y: '', z: '' }, radius: '' }
      ]
    });
  };

  // Remove an injury input field
  const removeInjuryField = (index: number) => {
    const updatedInjuries = formData.injuries.filter((_, i) => i !== index);
    setFormData({
      ...formData,
      injuries: updatedInjuries,
    });
  };

  const handleClick = (event) => {
    // Get the mouse coordinates in 3D space
    event.stopPropagation(); // Prevent event from propagating to parent elements

    const { x, y, z } = event.point;

    const xFixed = x.toFixed(4);
    const yFixed = y.toFixed(4);
    const zFixed = z.toFixed(4);

    const updatedInjuries = [...formData.injuries];
    updatedInjuries[updatedInjuries.length - 1].location = { x: xFixed, y: yFixed, z: zFixed };
    setFormData({
      ...formData,
      injuries: updatedInjuries
    });

    console.log("Click coordinates:", { x, y, z });
  };

  return (
    <>
      <div>
        <div>
          <h1>טופס</h1>
          <form onSubmit={handleSubmit}>
            <h1>זיהוי החלל</h1>
            <div>
              <label htmlFor="manpatzIncidentNumber">מספר אירוע מנפ"צ</label>
              <input
                type="text"
                id="manpatzIncidentNumber"
                name="manpatzIncidentNumber"
                value={formData.manpatzIncidentNumber}
                onChange={handleChange}
              />
            </div>
            <div>
              <label htmlFor="manpatzTraumaNumber">מספר טראומה באירוע</label>
              <input
                type="text"
                id="manpatzTraumaNumber"
                name="manpatzTraumaNumber"
                value={formData.manpatzTraumaNumber}
                onChange={handleChange}
              />
            </div>
            <div>
              <label htmlFor="maanahCasualityNumber">מספר חלל במאנ"ח</label>
              <input
                type="text"
                id="maanahCasualityNumber"
                name="maanahCasualityNumber"
                value={formData.maanahCasualityNumber}
                onChange={handleChange}
              />
            </div>
            <div>
              <label htmlFor="id">תעודת זהות</label>
              <input
                type="text"
                id="id"
                name="id"
                value={formData.id}
                onChange={handleChange}
              />
            </div>
            <div>
              <label htmlFor="personalNumber">מספר אישי</label>
              <input
                type="text"
                id="personalNumber"
                name="personalNumber"
                value={formData.personalNumber}
                onChange={handleChange}
              />
            </div>
            <div>
              <label htmlFor="casualityDate">תאריך הפגיעה</label>
              <input
                type="date"
                id="casualityDate"
                name="casualityDate"
                value={formData.casualityDate}
                onChange={handleChange}
              />
            </div>
            <div>
              <label htmlFor="casualityTime">זמן הפגיעה</label>
              <input
                type="time"
                id="casualityTime"
                name="casualityTime"
                value={formData.casualityTime}
                onChange={handleChange}
              />
            </div>
            <h1>נתוני פטירה</h1>
            <div>
              <label htmlFor="demiseDate">תאריך פטירה</label>
              <input
                type="date"
                id="demiseDate"
                name="demiseDate"
                value={formData.demiseDate}
                onChange={handleChange}
              />
            </div>
            <div>
              <label htmlFor="demiseTime">זמן פטירה</label>
              <input
                type="time"
                id="demiseTime"
                name="demiseTime"
                value={formData.demiseTime}
                onChange={handleChange}
              />
            </div>
            <div>
              <label htmlFor="pmCTDate">מועד PM-CT</label>
              <input
                type="date"
                id="pmCTDate"
                name="pmCTDate"
                value={formData.pmCTDate}
                onChange={handleChange}
              />
            </div>
            <div>
              <label htmlFor="pmCTTime">שעת PM-CT</label>
              <input
                type="time"
                id="pmCTTime"
                name="pmCTTime"
                value={formData.pmCTTime}
                onChange={handleChange}
              />
            </div>
            <div>
              <label htmlFor="pmCTInterpretation">פענוח PM-CT</label>
              <input
                type="text"
                id="pmCTInterpretation"
                name="pmCTInterpretation"
                value={formData.pmCTInterpretation}
                onChange={handleChange}
              />
            </div>
            <h1>מאפייני פציעות וטיפול</h1>

            <div>
              <label htmlFor='injuries'></label>
              {formData.injuries.map((injury, index) => (
                <div key={index}>
                  <label>סוג פציעה</label>
                  <select
                    name="injuryType"
                    value={injury.type}
                    onChange={(e) => handleChange(e, index, 'type')}>
                    <option value="">בחר</option>
                    <option value="פגיעה חודרת">פגיעה חודרת</option>
                    <option value="חבלה קהה">חבלה קהה</option>
                    <option value="כוויה \ שריפה">כוויה \ שריפה</option>
                  </select>

                  <div>
                    <label htmlFor='injury.description'>תיאור הפציעה</label>
                    <input
                      type="text"
                      name="description"
                      value={injury.description}
                      onChange={(e) => handleChange(e, index, 'description')}
                      placeholder={`תיאור פציעה ${index + 1}`}
                    />
                  </div>

                  <div>
                    <label>מיקום פציעה</label>
                    <input
                      type="number"
                      name="locationX"
                      value={injury.location.x}
                      onChange={(e) => handleChange(e, index, 'location', 'x')}
                      placeholder="x"
                    />
                    <input
                      type="number"
                      name="locationY"
                      value={injury.location.y}
                      onChange={(e) => handleChange(e, index, 'location', 'y')}
                      placeholder="y"
                    />
                    <input
                      type="number"
                      name="locationZ"
                      value={injury.location.z}
                      onChange={(e) => handleChange(e, index, 'location', 'z')}
                      placeholder="z"
                    />
                  </div>

                  <div>
                    <label>רדיוס</label>
                    <input
                      type="number"
                      name="radius"
                      value={injury.radius}
                      onChange={(e) => handleChange(e, index, 'radius')}
                      placeholder="רדיוס"
                    />
                  </div>

                  <button type="button" onClick={() => removeInjuryField(index)}>
                    הסר פציעה
                  </button>

                </div>
              ))}

              <button type="button" onClick={addInjuryField}>
                הוסף פציעה
              </button>

            </div>

            <br></br>


            <button type="submit">שמור</button>

            <h1>כל החללים</h1>
            <ul>
              {submissions.map((submission, index) => (
                <li key={index}>
                  {submission.manpatzIncidentNumber} - {submission.manpatzTraumaNumber} - {submission.maanahCasualityNumber} - {submission.id} - {submission.personalNumber} - {submission.casualityDate} - {submission.casualityTime} - {submission.demiseDate} - {submission.demiseTime} - {submission.pmCTDate} - {submission.pmCTTime} - {submission.pmCTInterpretation}
                  <ul>
                    {submission.injuries.map((injury, index) => (
                      <li key={index}>
                        {injury.type} - {injury.description} - {injury.location.x} - {injury.location.y} - {injury.location.z} - {injury.radius}
                      </li>
                    ))}
                  </ul>
                </li>
              ))}
            </ul>

          </form>
        </div>


        <div>
          <h1>בחר מיקום פציעה על גבי המודל</h1>
          <HumanModel onClick={handleClick}></HumanModel>
        </div>
      </div>
    </>
  )
}

export default CasualtyForm