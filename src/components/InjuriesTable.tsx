import { Submission } from "../Interfaces";
import Papa from 'papaparse'; // You'll need to install papaparse: npm install papaparse @types/papaparse

interface InjuriesTableProps {
  submissions: Submission[];
  setSubmissions: React.Dispatch<React.SetStateAction<Submission[]>>;
}

const InjuriesTable = ({ submissions, setSubmissions }: InjuriesTableProps) => {

    // Convert submissions to CSV format
    const prepareCSVData = (submissions: Submission[]) => {
      return submissions.flatMap(submission => 
        submission.injuries.map(injury => ({
          manpatzIncidentNumber: submission.manpatzIncidentNumber,
          manpatzTraumaNumber: submission.manpatzTraumaNumber,
          maanahCasualtyNumber: submission.maanahCasualtyNumber,
          incidentDateTime: submission.incidentDateTime,
          demiseDateTime: submission.demiseDateTime,
          externalTestDateTime: submission.externalTestDateTime,
          PMCTDateTime: submission.PMCTDateTime,
          PMCTInterpretation: submission.PMCTInterpretation,
          injuryType: injury.type,
          injuryDescription: injury.description,
          injuryLocation: injury.selectedLocation,
          locationX: injury.location.x,
          locationY: injury.location.y,
          locationZ: injury.location.z,
          radius: injury.radius
        }))
      );
    };

    // Convert CSV data back to submissions format
  const parseCSVToSubmissions = (csvData: any[]) => {
    const submissionsMap = new Map<string, Submission>();
    
    csvData.forEach(row => {
      const key = `${row.manpatzIncidentNumber}-${row.manpatzTraumaNumber}-${row.maanahCasualtyNumber}`;
      
      if (!submissionsMap.has(key)) {
        submissionsMap.set(key, {
          manpatzIncidentNumber: row.manpatzIncidentNumber,
          manpatzTraumaNumber: row.manpatzTraumaNumber,
          maanahCasualtyNumber: row.maanahCasualtyNumber,
          incidentDateTime: row.incidentDateTime,
          demiseDateTime: row.demiseDateTime,
          externalTestDateTime: row.externalTestDateTime,
          PMCTDateTime: row.PMCTDateTime,
          PMCTInterpretation: row.PMCTInterpretation,
          injuries: [],
          id: "",
          personalNumber: ""
        });
      }

      const submission = submissionsMap.get(key)!;
      submission.injuries.push({
        type: row.injuryType,
        description: row.injuryDescription,
        selectedLocation: row.injuryLocation,
        location: {
          x: parseFloat(row.locationX),
          y: parseFloat(row.locationY),
          z: parseFloat(row.locationZ)
        },
        radius: parseFloat(row.radius)
      });
    });

    return Array.from(submissionsMap.values());
  };

    // Download CSV file
    const handleCSVDownload = () => {
      const csvData = prepareCSVData(submissions);
      const csv = Papa.unparse(csvData);
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'submissions.csv';
      link.click();
      URL.revokeObjectURL(url);
    };


  const handleFileUpload = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result;
      if (typeof content === 'string') {
        try {
          if (file.name.endsWith('.json')) {
            const data = JSON.parse(content);
            setSubmissions(data);
            localStorage.setItem('formSubmissions', content); // Use the parsed content directly
          } else if (file.name.endsWith('.csv')) {
            Papa.parse(content, {
              header: true,
              complete: (results: { data: any[]; }) => {
                const parsedSubmissions = parseCSVToSubmissions(results.data);
                setSubmissions(parsedSubmissions);
                localStorage.setItem('formSubmissions', JSON.stringify(parsedSubmissions)); // Store the parsed submissions
              },
              error: (error: any) => {
                console.error('Error parsing CSV:', error);
                alert('שגיאה בקריאת קובץ CSV');
              }
            });
          }
        } catch (error) {
          console.error('Error processing file:', error);
          alert('שגיאה בעיבוד הקובץ');
        }
      }
    };
    reader.readAsText(file);
  };

  const handleUpload = () => {
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = '.json,.csv';
    fileInput.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        handleFileUpload(file);
      }
    };
    fileInput.click();
  };

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
        {/* <button
          className="w-32 bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 mb-4 mx-2 rounded focus:outline-none focus:shadow-outline mt-6"
          onClick={handleDownload}
        >
          הורדת נתונים
        </button> */}
        <button 
              onClick={handleCSVDownload}
              className="w-32 bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 mb-4 mx-2 rounded focus:outline-none focus:shadow-outline mt-6"
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
              <td className="px-4">{submission.manpatzIncidentNumber}</td>
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
                  className='mx-2 w-16 h-8 bg-red-500 hover:bg-red-700 text-white font-bold rounded focus:outline-none focus:shadow-outline'
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