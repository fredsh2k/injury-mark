import { Submission, RadiusInjury, PolygonInjury } from "../Interfaces";
import Papa from 'papaparse'; // You'll need to install papaparse: npm install papaparse @types/papaparse
import * as THREE from 'three'; // Add this line to import the THREE library

interface InjuriesTableProps {
  submissions: Submission[];
  setSubmissions: React.Dispatch<React.SetStateAction<Submission[]>>;
}

const InjuriesTable = ({ submissions, setSubmissions }: InjuriesTableProps) => {

  // Type guard to check if an injury is a RadiusInjury
  const isRadiusInjury = (injury: any): injury is RadiusInjury => {
    return (injury as RadiusInjury).radius !== undefined;
  };

  // Type guard to check if an injury is a PolygonInjury
  const isPolygonInjury = (injury: any): injury is PolygonInjury => {
    return (injury as PolygonInjury).vertices !== undefined;
  };



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
        protectionMeans: (submission.protectionMeans && submission.protectionMeans.length > 0) ? submission.protectionMeans.join(', ') : '',
        injuryType: injury.type,
        injuryDescription: injury.description,
        injuryLocation: injury.selectedLocation,
        locationX: injury.location.x,
        locationY: injury.location.y,
        locationZ: injury.location.z,
        radius: isRadiusInjury(injury) ? (injury as RadiusInjury).radius : undefined,
        vertices: isPolygonInjury(injury) ? injury.vertices : undefined
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
          personalNumber: "",
          protectionMeans: Array.isArray(row.protectionMeans)
            ? row.protectionMeans
            : typeof row.protectionMeans === 'string' && row.protectionMeans.trim().length > 0
              ? row.protectionMeans.split(',').map((s: string) => s.trim())
              : [],
        });
      }

      const submission = submissionsMap.get(key)!;
    // Determine if the injury is a RadiusInjury or PolygonInjury
    if (row.radius !== undefined) {
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
      } as RadiusInjury);
    } else if (row.vertices !== undefined) {
      submission.injuries.push({
        type: row.injuryType,
        description: row.injuryDescription,
        selectedLocation: row.injuryLocation,
        location: {
          x: parseFloat(row.locationX),
          y: parseFloat(row.locationY),
          z: parseFloat(row.locationZ)
        },
        vertices: JSON.parse(row.vertices).map((v: any) => new THREE.Vector3(v.x, v.y, v.z))
      } as PolygonInjury);
    }
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
    <div className='flex flex-col p-6 h-full'>
      {/* Action Buttons */}
      <div className='flex gap-3 mb-6'>
        <button
          onClick={handleCSVDownload}
          className="btn-primary"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
          </svg>
          הורדת נתונים
        </button>
        <button
          className="btn-secondary"
          onClick={handleUpload}
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
          </svg>
          העלאת נתונים
        </button>
        <button
          className="btn-danger"
          onClick={handleDelete}
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
          </svg>
          הסרת נתונים
        </button>
      </div>

      {/* Table */}
      <div className="card overflow-hidden flex-1">
        <div className="overflow-auto h-full">
          <table className="w-full">
            <thead>
              <tr className='bg-surface-50 border-b border-surface-200'>
                <th className="px-4 py-3 text-right text-xs font-semibold text-surface-500 uppercase tracking-wider">מספר אירוע מנפ"צ</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-surface-500 uppercase tracking-wider">מספר טראומה מנפ"צ</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-surface-500 uppercase tracking-wider">מספר נפגע במאנ"ח</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-surface-500 uppercase tracking-wider">אמצעי מיגון</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-surface-500 uppercase tracking-wider">פציעות</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-surface-500 uppercase tracking-wider w-20">פעולות</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-100">
              {submissions.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-surface-400">
                    <div className="flex flex-col items-center gap-2">
                      <svg className="w-10 h-10 text-surface-300" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5m6 4.125l2.25 2.25m0 0l2.25 2.25M12 13.875l2.25-2.25M12 13.875l-2.25 2.25M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" />
                      </svg>
                      <span className="text-sm">אין נתונים להצגה</span>
                    </div>
                  </td>
                </tr>
              ) : (
              submissions.map((submission: Submission, index: number) => (
                <tr key={index} className='hover:bg-brand-50/30 transition-colors duration-150'>
                  <td className="px-4 py-3 text-sm text-surface-700 font-medium">{submission.manpatzIncidentNumber}</td>
                  <td className="px-4 py-3 text-sm text-surface-600">{submission.manpatzTraumaNumber}</td>
                  <td className="px-4 py-3 text-sm text-surface-600">{submission.maanahCasualtyNumber}</td>
                  <td className="px-4 py-3 text-sm text-surface-600">
                    {(submission.protectionMeans && submission.protectionMeans.length > 0) ? (
                      <div className="flex flex-wrap gap-1">
                        {submission.protectionMeans.map((pm, i) => (
                          <span key={i} className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-brand-50 text-brand-700 border border-brand-200">
                            {pm}
                          </span>
                        ))}
                      </div>
                    ) : ''}
                  </td>
                  <td className="px-4 py-3">
                    <ul className='space-y-1'>
                      {submission.injuries.map((injury, injIndex) => (
                        <li key={injIndex} className="text-sm text-surface-600">
                          <span className="font-medium text-surface-700">{injIndex + 1}.</span>{' '}
                          {injury.type} - {injury.description} - {injury.selectedLocation}
                          <span className="text-surface-400 text-xs mr-1">({injury.location.x} {injury.location.y} {injury.location.z})</span>
                        </li>
                      ))}
                    </ul>
                  </td>
                  <td className="px-4 py-3">
                    <button
                      className='btn-danger btn-sm'
                      onClick={() => handleRowDelete(index)}
                    >
                      הסר
                    </button>
                  </td>
                </tr>
              ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

export default InjuriesTable