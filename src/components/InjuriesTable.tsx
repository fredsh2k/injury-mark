import { Submission } from "../Interfaces";

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

export default InjuriesTable