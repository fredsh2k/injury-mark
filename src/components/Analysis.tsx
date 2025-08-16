import { Canvas } from "@react-three/fiber"
import HumanModel from "./HumanModel"
import { Suspense, useEffect, useRef, useState } from "react"
import * as THREE from "three"
import { Marker, Submission } from '../Interfaces';
import { selectedLocations, injuryTypes, protectionMeans } from '../Constants';
import chroma from 'chroma-js';


interface AnalysisProps {
  submissions: Submission[];
}

const Analysis = ({ submissions }: AnalysisProps) => {
  // Helper function to load saved filter state from localStorage
  const loadFilterState = (key: string, defaultValue: string[]): string[] => {
    try {
      const saved = localStorage.getItem(key);
      return saved ? JSON.parse(saved) : defaultValue;
    } catch {
      return defaultValue;
    }
  };

  // Helper function to load proximity threshold from localStorage
  const loadProximityThreshold = (): number => {
    try {
      const saved = localStorage.getItem('analysis_proximityThreshold');
      return saved ? parseFloat(saved) : 0.15;
    } catch {
      return 0.15;
    }
  };

  // Filter states - load from localStorage or default to all selected
  const [selectedInjuryTypes, setSelectedInjuryTypes] = useState<string[]>(() => 
    loadFilterState('analysis_selectedInjuryTypes', injuryTypes)
  );
  const [selectedProtectionMeans, setSelectedProtectionMeans] = useState<string[]>(() => 
    loadFilterState('analysis_selectedProtectionMeans', protectionMeans)
  );
  const [selectedInjuryLocations, setSelectedInjuryLocations] = useState<string[]>(() => 
    loadFilterState('analysis_selectedInjuryLocations', selectedLocations)
  );

  // Get all injuries and calculate totals
  const injuries = submissions.map(submission => submission.injuries)
  const totalInjuries = injuries.flat().length
  
  // Filter injuries based on selected criteria AND protection means
  const filteredInjuries = submissions.filter(submission => {
    // Filter by protection means
    if (selectedProtectionMeans.length === 0) {
      // When no protection means are selected, show only submissions with no protection
      return submission.protectionMeans.length === 0;
    } else {
      // When protection means are selected, show submissions that have at least one matching protection
      return submission.protectionMeans.some(pm => selectedProtectionMeans.includes(pm));
    }
  }).map(submission => submission.injuries).flat().filter(injury => {
    // Then filter by injury type and location
    const typeMatch = selectedInjuryTypes.includes(injury.type);
    const locationMatch = selectedInjuryLocations.includes(injury.selectedLocation);
    return typeMatch && locationMatch;
  });

  const allMarkers: Marker[] = filteredInjuries.map(injury => ({ location: new THREE.Vector3(injury.location.x, injury.location.y, injury.location.z) }))
  const [isModelLoaded, setIsModelLoaded] = useState(false);
  const modelRef = useRef<THREE.Group>(null);
  const [proximityThreshold, setProximityThreshold] = useState<number>(() => 
    loadProximityThreshold()
  );

  // Save filter states to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('analysis_selectedInjuryTypes', JSON.stringify(selectedInjuryTypes));
  }, [selectedInjuryTypes]);

  useEffect(() => {
    localStorage.setItem('analysis_selectedProtectionMeans', JSON.stringify(selectedProtectionMeans));
  }, [selectedProtectionMeans]);

  useEffect(() => {
    localStorage.setItem('analysis_selectedInjuryLocations', JSON.stringify(selectedInjuryLocations));
  }, [selectedInjuryLocations]);

  useEffect(() => {
    localStorage.setItem('analysis_proximityThreshold', proximityThreshold.toString());
  }, [proximityThreshold]);

  // Helper functions for filter changes
  const handleInjuryTypeChange = (type: string, checked: boolean) => {
    if (checked) {
      setSelectedInjuryTypes(prev => [...prev, type]);
    } else {
      setSelectedInjuryTypes(prev => prev.filter(t => t !== type));
    }
  };

  const handleProtectionMeansChange = (protection: string, checked: boolean) => {
    if (checked) {
      setSelectedProtectionMeans(prev => [...prev, protection]);
    } else {
      setSelectedProtectionMeans(prev => prev.filter(p => p !== protection));
    }
  };

  const handleLocationChange = (location: string, checked: boolean) => {
    if (checked) {
      setSelectedInjuryLocations(prev => [...prev, location]);
    } else {
      setSelectedInjuryLocations(prev => prev.filter(l => l !== location));
    }
  };

  // Helper functions to toggle all selections
  const toggleAllInjuryTypes = () => {
    if (selectedInjuryTypes.length === injuryTypes.length) {
      setSelectedInjuryTypes([]);
    } else {
      setSelectedInjuryTypes(injuryTypes);
    }
  };

  const toggleAllProtectionMeans = () => {
    if (selectedProtectionMeans.length === protectionMeans.length) {
      setSelectedProtectionMeans([]);
    } else {
      setSelectedProtectionMeans(protectionMeans);
    }
  };

  const toggleAllLocations = () => {
    if (selectedInjuryLocations.length === selectedLocations.length) {
      setSelectedInjuryLocations([]);
    } else {
      setSelectedInjuryLocations(selectedLocations);
    }
  };

  // Reset all filters to default values
  const resetAllFilters = () => {
    setSelectedInjuryTypes(injuryTypes);
    setSelectedProtectionMeans(protectionMeans);
    setSelectedInjuryLocations(selectedLocations);
    setProximityThreshold(0.15);
  };

  // Helper functions to count injuries for each filter option
  const countInjuriesByType = (type: string): number => {
    return injuries.flat().filter(injury => injury.type === type).length;
  };

  const countSubmissionsByProtection = (protection: string): number => {
    return submissions.filter(submission => 
      submission.protectionMeans.includes(protection)
    ).reduce((count, submission) => count + submission.injuries.length, 0);
  };

  const countInjuriesByLocation = (location: string): number => {
    return injuries.flat().filter(injury => injury.selectedLocation === location).length;
  };


  useEffect(() => {
    if (isModelLoaded && modelRef.current) {
      const boundingBox = new THREE.Box3().setFromObject(modelRef.current);
      const { min, max } = boundingBox;

      // Normalize marker locations within the bounding box
      allMarkers.forEach(marker => {
        marker.location.x = (marker.location.x + 1) / 2 * (max.x - min.x) + min.x;
        marker.location.y = (marker.location.y + 1) / 2 * (max.y - min.y) + min.y;
        marker.location.z = (marker.location.z + 1) / 2 * (max.z - min.z) + min.z;
      });

      const model = modelRef.current;
      // const proximityThreshold = 0.15;
      const colorScale = chroma.scale(['blue', 'red'])

      model.traverse((child: any) => {
        if (!child.isMesh) return;

        const geometry = child.geometry as THREE.BufferGeometry;
        const positions = geometry.attributes.position.array;
        const vertexCount = positions.length / 3;

        // Create a color array for vertex colors, initialized with white
        let colorArray = new Float32Array(positions.length).fill(1); // White color

        // Apply white color to the entire model
        for (let i = 0; i < positions.length; i += 3) {
          colorArray[i] = 1;     // Red channel
          colorArray[i + 1] = 1; // Green channel
          colorArray[i + 2] = 1; // Blue channel
        }

        // Apply vertex colors to the geometry
        geometry.setAttribute('color', new THREE.BufferAttribute(colorArray, 3));
        const colors = geometry.attributes.color?.array;


        const pointsArray = new Float32Array(vertexCount / 3).fill(0); // Points for each triangle
        let maxPoints = 0;

        const vA = new THREE.Vector3();
        const vB = new THREE.Vector3();
        const vC = new THREE.Vector3();
        const centroid = new THREE.Vector3();

        // Calculate points and maximum score in a single loop
        for (let i = 0; i < positions.length; i += 9) {
          // Extract triangle vertices
          vA.set(positions[i], positions[i + 1], positions[i + 2]);
          vB.set(positions[i + 3], positions[i + 4], positions[i + 5]);
          vC.set(positions[i + 6], positions[i + 7], positions[i + 8]);

          // Calculate the centroid of the triangle
          centroid.set(0, 0, 0).add(vA).add(vB).add(vC).divideScalar(3);

          let points = 0;
          allMarkers.forEach(marker => {
            const markerInLocalSpace = model.worldToLocal(marker.location.clone());
            if (centroid.distanceTo(markerInLocalSpace) < proximityThreshold) {
              points += 1;
            }
          });

          // Store points and track the maximum points
          const triangleIndex = i / 9;
          pointsArray[triangleIndex] = points;
          maxPoints = Math.max(maxPoints, points);
        }

        // Create a color array for vertex colors
        colorArray = colors ? new Float32Array(colors) : new Float32Array(positions.length); // Same length as positions

        // Assign colors based on normalized points
        for (let i = 0; i < positions.length; i += 9) {
          const triangleIndex = i / 9;
          const normalizedPoints = maxPoints > 0 ? pointsArray[triangleIndex] / maxPoints : 0;

          // Get the color from the scale
          const colorHex = colorScale(normalizedPoints).hex();
          const color = new THREE.Color(colorHex);

          // Skip if no points
          if (pointsArray[triangleIndex] === 0) {
            continue;
          }

          // Assign color to each vertex of the triangle
          for (let j = 0; j < 3; j++) {
            const vertexIndex = i + j * 3;
            colorArray[vertexIndex] = color.r;
            colorArray[vertexIndex + 1] = color.g;
            colorArray[vertexIndex + 2] = color.b;
          }
        }

        // Apply vertex colors to the geometry
        geometry.setAttribute('color', new THREE.BufferAttribute(colorArray, 3));

        // Use a material that supports vertex colors
        child.material = new THREE.MeshStandardMaterial({
          vertexColors: true,
          wireframe: false, // Set to true if you want to add wireframe overlay
        });

        // Optionally, add a wireframe overlay
        // const wireframe = new THREE.LineSegments(
        //   new THREE.EdgesGeometry(geometry),
        //   new THREE.LineBasicMaterial({ color: 0x000000 })
        // );
        // model.add(wireframe);
      });
    }
  }, [isModelLoaded, modelRef, allMarkers, proximityThreshold]);


  return (
    <div className="h-screen flex">
      {/* Filters Panel */}
      <div className="w-1/6 bg-gray-100 p-2 overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-sm font-bold">מסננים</h2>
          <button
            onClick={resetAllFilters}
            className="text-xs bg-red-500 text-white px-1 py-1 rounded hover:bg-red-600"
            title="איפוס כל המסננים"
          >
            איפוס
          </button>
        </div>
        
        {/* Proximity Threshold Filter */}
        <div className="mb-6">
          <label htmlFor="proximityThreshold" className="block text-gray-700 text-sm font-bold mb-2">
            סף קרבה לפציעה: {proximityThreshold.toFixed(2)}
          </label>
          <input
            type="range"
            id="proximityThreshold"
            name="proximityThreshold"
            min="0"
            max="0.5"
            step="0.01"
            value={proximityThreshold}
            onChange={(e) => setProximityThreshold(parseFloat(e.target.value))}
            className="w-full"
          />
        </div>

        {/* Injury Types Filter */}
        <div className="mb-6">
          <div className="flex justify-between items-center mb-2">
            <h3 className="text-md font-semibold">סוגי פציעות</h3>
            <button
              onClick={toggleAllInjuryTypes}
              className="text-xs text-blue-600 hover:text-blue-800"
            >
              {selectedInjuryTypes.length === injuryTypes.length ? 'בטל הכל' : 'בחר הכל'}
            </button>
          </div>
          <div className="max-h-64 overflow-y-auto border border-gray-300 rounded p-2">
            {injuryTypes.map((type) => (
              <label key={type} className="flex items-center mb-1 text-xs">
                <input
                  type="checkbox"
                  checked={selectedInjuryTypes.includes(type)}
                  onChange={(e) => handleInjuryTypeChange(type, e.target.checked)}
                  className="mr-2 ml-1"
                />
                <span className="flex-1">
                  {type} ({countInjuriesByType(type)})
                </span>
              </label>
            ))}
          </div>
        </div>

        {/* Protection Means Filter */}
        <div className="mb-6">
          <div className="flex justify-between items-center mb-2">
            <h3 className="text-md font-semibold">אמצעי הגנה</h3>
            <button
              onClick={toggleAllProtectionMeans}
              className="text-xs text-blue-600 hover:text-blue-800"
            >
              {selectedProtectionMeans.length === protectionMeans.length ? 'בטל הכל' : 'בחר הכל'}
            </button>
          </div>
          <div className="max-h-40 overflow-y-auto border border-gray-300 rounded p-2">
            {protectionMeans.map((protection) => (
              <label key={protection} className="flex items-center mb-1 text-sm">
                <input
                  type="checkbox"
                  checked={selectedProtectionMeans.includes(protection)}
                  onChange={(e) => handleProtectionMeansChange(protection, e.target.checked)}
                  className="mr-2 ml-1"
                />
                <span className="flex-1">
                  {protection} ({countSubmissionsByProtection(protection)})
                </span>
              </label>
            ))}
          </div>
        </div>

        {/* Injury Locations Filter */}
        <div className="mb-6">
          <div className="flex justify-between items-center mb-2">
            <h3 className="text-md font-semibold">מיקומי פציעות</h3>
            <button
              onClick={toggleAllLocations}
              className="text-xs text-blue-600 hover:text-blue-800"
            >
              {selectedInjuryLocations.length === selectedLocations.length ? 'בטל הכל' : 'בחר הכל'}
            </button>
          </div>
          <div className="max-h-64 overflow-y-auto border border-gray-300 rounded p-2">
            {selectedLocations.map((location) => (
              <label key={location} className="flex items-center mb-1 text-xs">
                <input
                  type="checkbox"
                  checked={selectedInjuryLocations.includes(location)}
                  onChange={(e) => handleLocationChange(location, e.target.checked)}
                  className="mr-2 ml-1"
                />
                <span className="flex-1">
                  {location} ({countInjuriesByLocation(location)})
                </span>
              </label>
            ))}
          </div>
        </div>

        {/* Filter Summary */}
        <div className="text-xs text-gray-600 border-t pt-2">
          <div>פציעות מוצגות: {allMarkers.length} מתוך {totalInjuries}</div>
        </div>
      </div>

      {/* 3D Model Display */}
      <div className="w-5/6">
        <Canvas camera={{ position: [0, 25, 60], fov: 90 }}>
          <Suspense fallback={null}>
            <ambientLight intensity={0.5} />
            <spotLight position={[0, 50, 50]} decay={0} intensity={1} />
            <spotLight position={[0, 50, -50]} decay={0} intensity={1} />
            <pointLight position={[0, 100, 50]} decay={0} intensity={1} />
            <pointLight position={[0, 100, -50]} decay={0} intensity={1} />

            <HumanModel modelRef={modelRef} onLoad={() => setIsModelLoaded(true)} markers={[]} onClick={() => console.log('click')}></HumanModel>

            {isModelLoaded &&
              allMarkers.map((marker, index) => (
                <mesh key={index} position={marker.location}>
                  <sphereGeometry args={[0.15]} />
                  <meshStandardMaterial color='red' />
                </mesh>
              ))}
          </Suspense>
        </Canvas>
      </div>
    </div>
  )
}

export default Analysis