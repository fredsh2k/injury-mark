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
    // Filter by protection means - handle undefined/null protectionMeans
    const protectionMeansArray = submission.protectionMeans || [];
    // Treat empty protection means as "ללא מיגון"
    const actualProtectionMeans = protectionMeansArray.length === 0 ? ['ללא מיגון'] : protectionMeansArray;
    
    if (selectedProtectionMeans.length === 0) {
      // When no protection means are selected, show nothing
      return false;
    } else {
      // When protection means are selected, show submissions that have at least one matching protection
      return actualProtectionMeans.some(pm => selectedProtectionMeans.includes(pm));
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

  // Defensive plate types and state
  type PlateType = 'hard' | 'long' | 'short' | 'soft' | null;
  const [selectedPlate, setSelectedPlate] = useState<PlateType>(null);

  // Define plate shapes - each plate is a 3D solid with 8 vertices (4 front + 4 back)
  interface PlateShape {
    front: THREE.Vector3[]; // 8 vertices defining the front plate
    back: THREE.Vector3[];  // 8 vertices defining the back plate
  }

  const plateShapes: Record<Exclude<PlateType, null>, PlateShape> = {
    hard: {
      // Front plate - rectangular solid
      front: [
        // Front face (4 vertices)
        new THREE.Vector3(-0.25, 0.5, 0.9),   // top left front face
        new THREE.Vector3(0.25, 0.5, 0.9),    // top right front face
        new THREE.Vector3(0.25, 0.0, 0.9),    // bottom right front face
        new THREE.Vector3(-0.25, 0.0, 0.9),   // bottom left front face
        // Back face (4 vertices)
        new THREE.Vector3(-0.25, 0.5, 0.7),   // top left back face
        new THREE.Vector3(0.25, 0.5, 0.7),    // top right back face
        new THREE.Vector3(0.25, 0.0, 0.7),    // bottom right back face
        new THREE.Vector3(-0.25, 0.0, 0.7),   // bottom left back face
      ],
      // Back plate - rectangular solid
      back: [
        // Front face (4 vertices)
        new THREE.Vector3(-0.25, 0.5, -0.9),   // top left front face
        new THREE.Vector3(0.25, 0.5, -0.9),    // top right front face
        new THREE.Vector3(0.25, 0.0, -0.9),    // bottom right front face
        new THREE.Vector3(-0.25, 0.0, -0.9),   // bottom left front face
        // Back face (4 vertices)
        new THREE.Vector3(-0.25, 0.5, -1.1),   // top left back face
        new THREE.Vector3(0.25, 0.5, -1.1),    // top right back face
        new THREE.Vector3(0.25, 0.0, -1.1),    // bottom right back face
        new THREE.Vector3(-0.25, 0.0, -1.1),   // bottom left back face
      ],
    },
    long: {
      // Long plate - extended chest to abdomen coverage
      front: [
        // Front face (4 vertices)
        new THREE.Vector3(-0.36, 0.7, 0.9),   // top left front face
        new THREE.Vector3(0.36, 0.7, 0.9),    // top right front face
        new THREE.Vector3(0.36, -0.3, 0.9),   // bottom right front face
        new THREE.Vector3(-0.36, -0.3, 0.9),  // bottom left front face
        // Back face (4 vertices)
        new THREE.Vector3(-0.36, 0.7, 0.7),   // top left back face
        new THREE.Vector3(0.36, 0.7, 0.7),    // top right back face
        new THREE.Vector3(0.36, -0.3, 0.7),   // bottom right back face
        new THREE.Vector3(-0.36, -0.3, 0.7),  // bottom left back face
      ],
      back: [
        // Front face (4 vertices)
        new THREE.Vector3(-0.34, 0.68, -0.9),   // top left front face
        new THREE.Vector3(0.34, 0.68, -0.9),    // top right front face
        new THREE.Vector3(0.34, -0.28, -0.9),   // bottom right front face
        new THREE.Vector3(-0.34, -0.28, -0.9),  // bottom left front face
        // Back face (4 vertices)
        new THREE.Vector3(-0.34, 0.68, -1.1),   // top left back face
        new THREE.Vector3(0.34, 0.68, -1.1),    // top right back face
        new THREE.Vector3(0.34, -0.28, -1.1),   // bottom right back face
        new THREE.Vector3(-0.34, -0.28, -1.1),  // bottom left back face
      ],
    },
    short: {
      // Short plate - minimal chest coverage
      front: [
        // Front face (4 vertices)
        new THREE.Vector3(-0.24, 0.5, 0.9),   // top left front face
        new THREE.Vector3(0.24, 0.5, 0.9),    // top right front face
        new THREE.Vector3(0.24, 0.2, 0.9),    // bottom right front face
        new THREE.Vector3(-0.24, 0.2, 0.9),   // bottom left front face
        // Back face (4 vertices)
        new THREE.Vector3(-0.24, 0.5, 0.7),   // top left back face
        new THREE.Vector3(0.24, 0.5, 0.7),    // top right back face
        new THREE.Vector3(0.24, 0.2, 0.7),    // bottom right back face
        new THREE.Vector3(-0.24, 0.2, 0.7),   // bottom left back face
      ],
      back: [
        // Front face (4 vertices)
        new THREE.Vector3(-0.22, 0.48, -0.9),   // top left front face
        new THREE.Vector3(0.22, 0.48, -0.9),    // top right front face
        new THREE.Vector3(0.22, 0.22, -0.9),    // bottom right front face
        new THREE.Vector3(-0.22, 0.22, -0.9),   // bottom left front face
        // Back face (4 vertices)
        new THREE.Vector3(-0.22, 0.48, -1.1),   // top left back face
        new THREE.Vector3(0.22, 0.48, -1.1),    // top right back face
        new THREE.Vector3(0.22, 0.22, -1.1),    // bottom right back face
        new THREE.Vector3(-0.22, 0.22, -1.1),   // bottom left back face
      ],
    },
    soft: {
      // Soft armor - wider coverage including sides
      front: [
        // Front face (4 vertices)
        new THREE.Vector3(-0.44, 0.76, 0.9),   // top left front face
        new THREE.Vector3(0.44, 0.76, 0.9),    // top right front face
        new THREE.Vector3(0.44, -0.1, 0.9),    // bottom right front face
        new THREE.Vector3(-0.44, -0.1, 0.9),   // bottom left front face
        // Back face (4 vertices)
        new THREE.Vector3(-0.44, 0.76, 0.7),   // top left back face
        new THREE.Vector3(0.44, 0.76, 0.7),    // top right back face
        new THREE.Vector3(0.44, -0.1, 0.7),    // bottom right back face
        new THREE.Vector3(-0.44, -0.1, 0.7),   // bottom left back face
      ],
      back: [
        // Front face (4 vertices)
        new THREE.Vector3(-0.42, 0.74, -0.9),   // top left front face
        new THREE.Vector3(0.42, 0.74, -0.9),    // top right front face
        new THREE.Vector3(0.42, -0.08, -0.9),   // bottom right front face
        new THREE.Vector3(-0.42, -0.08, -0.9),  // bottom left front face
        // Back face (4 vertices)
        new THREE.Vector3(-0.42, 0.74, -1.1),   // top left back face
        new THREE.Vector3(0.42, 0.74, -1.1),    // top right back face
        new THREE.Vector3(0.42, -0.08, -1.1),   // bottom right back face
        new THREE.Vector3(-0.42, -0.08, -1.1),  // bottom left back face
      ],
    },
  };

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
    return submissions.filter(submission => {
      const protectionMeansArray = submission.protectionMeans || [];
      // Treat empty protection means as "ללא מיגון"
      const actualProtectionMeans = protectionMeansArray.length === 0 ? ['ללא מיגון'] : protectionMeansArray;
      return actualProtectionMeans.includes(protection);
    }).reduce((count, submission) => count + submission.injuries.length, 0);
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
      <div className="w-5/6 flex flex-col">
        {/* Plate Selection Buttons */}
        <div className="p-4 bg-gray-100 border-b flex gap-2">
          <button
            onClick={() => setSelectedPlate(selectedPlate === 'hard' ? null : 'hard')}
            className={`px-4 py-2 rounded font-semibold transition-colors ${
              selectedPlate === 'hard'
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-700 hover:bg-blue-100 border border-gray-300'
            }`}
          >
            לוח קשיח
          </button>
          <button
            onClick={() => setSelectedPlate(selectedPlate === 'long' ? null : 'long')}
            className={`px-4 py-2 rounded font-semibold transition-colors ${
              selectedPlate === 'long'
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-700 hover:bg-blue-100 border border-gray-300'
            }`}
          >
            לוח ארוך
          </button>
          <button
            onClick={() => setSelectedPlate(selectedPlate === 'short' ? null : 'short')}
            className={`px-4 py-2 rounded font-semibold transition-colors ${
              selectedPlate === 'short'
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-700 hover:bg-blue-100 border border-gray-300'
            }`}
          >
            לוח קצר
          </button>
          <button
            onClick={() => setSelectedPlate(selectedPlate === 'soft' ? null : 'soft')}
            className={`px-4 py-2 rounded font-semibold transition-colors ${
              selectedPlate === 'soft'
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-700 hover:bg-blue-100 border border-gray-300'
            }`}
          >
            שכפ"צ
          </button>
          {selectedPlate && (
            <button
              onClick={() => setSelectedPlate(null)}
              className="px-4 py-2 rounded font-semibold bg-red-500 text-white hover:bg-red-600"
            >
              נקה לוח
            </button>
          )}
        </div>

        {/* Canvas */}
        <div className="flex-1">
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

              {/* Render defensive plates if selected */}
              {isModelLoaded && selectedPlate && modelRef.current && (() => {
                const boundingBox = new THREE.Box3().setFromObject(modelRef.current);
                const { min, max } = boundingBox;
                
                const plateShape = plateShapes[selectedPlate];
                
                // Denormalize vertices to world coordinates
                const denormalize = (v: THREE.Vector3) => {
                  const worldX = (v.x + 1) / 2 * (max.x - min.x) + min.x;
                  const worldY = (v.y + 1) / 2 * (max.y - min.y) + min.y;
                  const worldZ = (v.z + 1) / 2 * (max.z - min.z) + min.z;
                  return new THREE.Vector3(worldX, worldY, worldZ);
                };

                const frontPlateVertices = plateShape.front.map(denormalize);
                const backPlateVertices = plateShape.back.map(denormalize);

                // Create a 3D solid plate from 8 vertices (4 front face + 4 back face)
                const createPlateGeometry = (vertices: THREE.Vector3[]) => {
                  const positions: number[] = [];
                  
                  // Front face (vertices 0-3)
                  positions.push(
                    vertices[0].x, vertices[0].y, vertices[0].z,
                    vertices[1].x, vertices[1].y, vertices[1].z,
                    vertices[2].x, vertices[2].y, vertices[2].z,
                    
                    vertices[2].x, vertices[2].y, vertices[2].z,
                    vertices[3].x, vertices[3].y, vertices[3].z,
                    vertices[0].x, vertices[0].y, vertices[0].z,
                  );
                  
                  // Back face (vertices 4-7)
                  positions.push(
                    vertices[4].x, vertices[4].y, vertices[4].z,
                    vertices[6].x, vertices[6].y, vertices[6].z,
                    vertices[5].x, vertices[5].y, vertices[5].z,
                    
                    vertices[6].x, vertices[6].y, vertices[6].z,
                    vertices[4].x, vertices[4].y, vertices[4].z,
                    vertices[7].x, vertices[7].y, vertices[7].z,
                  );
                  
                  // Top face (0-1 front, 4-5 back)
                  positions.push(
                    vertices[0].x, vertices[0].y, vertices[0].z,
                    vertices[4].x, vertices[4].y, vertices[4].z,
                    vertices[1].x, vertices[1].y, vertices[1].z,
                    
                    vertices[1].x, vertices[1].y, vertices[1].z,
                    vertices[4].x, vertices[4].y, vertices[4].z,
                    vertices[5].x, vertices[5].y, vertices[5].z,
                  );
                  
                  // Bottom face (2-3 front, 6-7 back)
                  positions.push(
                    vertices[3].x, vertices[3].y, vertices[3].z,
                    vertices[2].x, vertices[2].y, vertices[2].z,
                    vertices[7].x, vertices[7].y, vertices[7].z,
                    
                    vertices[2].x, vertices[2].y, vertices[2].z,
                    vertices[6].x, vertices[6].y, vertices[6].z,
                    vertices[7].x, vertices[7].y, vertices[7].z,
                  );
                  
                  // Left face (0-3 front, 4-7 back)
                  positions.push(
                    vertices[0].x, vertices[0].y, vertices[0].z,
                    vertices[3].x, vertices[3].y, vertices[3].z,
                    vertices[4].x, vertices[4].y, vertices[4].z,
                    
                    vertices[3].x, vertices[3].y, vertices[3].z,
                    vertices[7].x, vertices[7].y, vertices[7].z,
                    vertices[4].x, vertices[4].y, vertices[4].z,
                  );
                  
                  // Right face (1-2 front, 5-6 back)
                  positions.push(
                    vertices[1].x, vertices[1].y, vertices[1].z,
                    vertices[5].x, vertices[5].y, vertices[5].z,
                    vertices[2].x, vertices[2].y, vertices[2].z,
                    
                    vertices[2].x, vertices[2].y, vertices[2].z,
                    vertices[5].x, vertices[5].y, vertices[5].z,
                    vertices[6].x, vertices[6].y, vertices[6].z,
                  );
                  
                  const geometry = new THREE.BufferGeometry();
                  geometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(positions), 3));
                  geometry.computeVertexNormals();
                  return geometry;
                };

                const frontPlateGeometry = createPlateGeometry(frontPlateVertices);
                const backPlateGeometry = createPlateGeometry(backPlateVertices);

                return (
                  <group>
                    {/* Front plate */}
                    <mesh geometry={frontPlateGeometry} renderOrder={999}>
                      <meshStandardMaterial 
                        color="#4A5568"
                        transparent={true}
                        opacity={0.8}
                        side={THREE.DoubleSide}
                        depthTest={true}
                        metalness={0.8}
                        roughness={0.3}
                      />
                    </mesh>

                    {/* Back plate */}
                    <mesh geometry={backPlateGeometry} renderOrder={999}>
                      <meshStandardMaterial 
                        color="#6B7280"
                        transparent={true}
                        opacity={0.8}
                        side={THREE.DoubleSide}
                        depthTest={true}
                        metalness={0.8}
                        roughness={0.3}
                      />
                    </mesh>

                    {/* Vertex markers for front plate */}
                    {frontPlateVertices.map((vertex, index) => (
                      <mesh key={`front-plate-marker-${index}`} position={vertex}>
                        <sphereGeometry args={[0.1]} />
                        <meshStandardMaterial color="#DC2626" />
                      </mesh>
                    ))}

                    {/* Vertex markers for back plate */}
                    {backPlateVertices.map((vertex, index) => (
                      <mesh key={`back-plate-marker-${index}`} position={vertex}>
                        <sphereGeometry args={[0.1]} />
                        <meshStandardMaterial color="#2563EB" />
                      </mesh>
                    ))}
                  </group>
                );
              })()}
            </Suspense>
          </Canvas>
        </div>
      </div>
    </div>
  )
}

export default Analysis