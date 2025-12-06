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
  const [proximityThreshold, setProximityThreshold] = useState<number>(() => 
    loadProximityThreshold()
  );
  const [isMeasuring, setIsMeasuring] = useState(false);
  const [measurementPoints, setMeasurementPoints] = useState<THREE.Vector3[]>([]);

  // Pointer tracking for detecting clicks vs drags on plates
  const pointerDownPos = useRef<{ x: number; y: number } | null>(null);
  const dragThreshold = 5; // pixels

  const handlePlatePointerDown = (e: any) => {
    if (isMeasuring) {
      e.stopPropagation();
      pointerDownPos.current = { x: e.clientX, y: e.clientY };
    }
  };

  const handlePlatePointerUp = (e: any) => {
    if (isMeasuring && pointerDownPos.current) {
      e.stopPropagation();
      const dx = e.clientX - pointerDownPos.current.x;
      const dy = e.clientY - pointerDownPos.current.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      pointerDownPos.current = null;
      
      if (dist < dragThreshold) {
        // Treat as click - add measurement point
        const point = e.point;
        if (measurementPoints.length === 0) {
          const newPoints = [point];
          setMeasurementPoints(newPoints);
        } else if (measurementPoints.length === 1) {
          const newPoints = [measurementPoints[0], point];
          setMeasurementPoints(newPoints);
        } else {
          // Reset and start new measurement
          const newPoints = [point];
          setMeasurementPoints(newPoints);
        }
      }
    }
  };

  // Defensive plate types and state
  type PlateType = 'hard' | 'long' | 'short' | 'soft' | null;
  const [selectedPlate, setSelectedPlate] = useState<PlateType>(null);

  // Plate center Y position controls
  const [hardCenterYFront, setHardCenterYFront] = useState(0.08);
  const [hardCenterYBack, setHardCenterYBack] = useState(0.10);
  const [longCenterYFront, setLongCenterYFront] = useState(0.46);
  const [longCenterYBack, setLongCenterYBack] = useState(0.48);
  const [shortCenterYFront, setShortCenterYFront] = useState(0.46);
  const [shortCenterYBack, setShortCenterYBack] = useState(0.48);
  const [softCenterYFront, setSoftCenterYFront] = useState(0.14);
  const [softCenterYBack, setSoftCenterYBack] = useState(0.14);

  // Define plate shapes - 2D shape with depth and positioning
  interface PlateShape {
    shape?: { x: number; y: number }[]; // 2D shape (x, y coordinates) - used when front/back are same
    shapeFront?: { x: number; y: number }[]; // Front plate shape (if different from back)
    shapeBack?: { x: number; y: number }[];  // Back plate shape (if different from front)
    depth: number;        // Thickness of each plate
    zFront: number;       // Z position for front plate
    zBack: number;        // Z position for back plate
    centerYFront: number; // Y offset for front plate center
    centerYBack: number;  // Y offset for back plate center
  }

  const plateShapes: Record<Exclude<PlateType, null>, PlateShape> = {
    hard: {
      // Hexagonal shape (shooter's cut armor plate)
      // Exact dimensions: bottom 260mm wide, top 195mm wide, height 337mm
      shape: [
        { x: -0.2164, y: 0.55 },    // top left (97.5mm from center)
        { x: 0.2164, y: 0.55 },     // top right (97.5mm from center)
        { x: 0.2886, y: 0.50 },     // right shoulder (130mm from center)
        { x: 0.2886, y: 0.1670 },   // bottom right (130mm from center, 337mm down)
        { x: -0.2886, y: 0.1670 },  // bottom left
        { x: -0.2886, y: 0.50 },    // left shoulder
      ],
      depth: 0.1,     // 10cm thick plate
      zFront: 0.88,    // Position in front
      zBack: -0.9,    // Position in back
      centerYFront: hardCenterYFront,  // Vertical offset for front plate
      centerYBack: hardCenterYBack,   // Vertical offset for back plate
    },
    long: {
      // Front plate: 248mm wide (±0.28), 352mm tall (0.40) with curved top
      shapeFront: [
        { x: -0.23, y: -0.20 },  // bottom left
        { x: -0.28, y: -0.16 },  // left side 1
        { x: -0.28, y: -0.04 },  // left side 2
        { x: -0.25, y: 0.04 },   // left side 3
        { x: -0.24, y: 0.12 },   // left side 4
        { x: -0.18, y: 0.17 },   // left top 5
        { x: 0.0, y: 0.16 },     // top center peak
        { x: 0.18, y: 0.17 },    // right top 5
        { x: 0.24, y: 0.12 },    // right side 4
        { x: 0.25, y: 0.04 },    // right side 3
        { x: 0.28, y: -0.04 },   // right side 2
        { x: 0.28, y: -0.16 },   // right side 1
        { x: 0.23, y: -0.20 },   // bottom right
      ],
      // Back plate: wider and taller (390mm = 0.44)
      shapeBack: [
        { x: -0.26, y: -0.22 },  // bottom left
        { x: -0.32, y: -0.18 },  // left side 1
        { x: -0.32, y: -0.04 },  // left side 2
        { x: -0.28, y: 0.04 },   // left side 3
        { x: -0.27, y: 0.13 },   // left side 4
        { x: -0.20, y: 0.19 },   // left top 5
        { x: 0.0, y: 0.18 },     // top center peak
        { x: 0.20, y: 0.19 },    // right top 5
        { x: 0.27, y: 0.13 },    // right side 4
        { x: 0.28, y: 0.04 },    // right side 3
        { x: 0.32, y: -0.04 },   // right side 2
        { x: 0.32, y: -0.18 },   // right side 1
        { x: 0.26, y: -0.22 },   // bottom right
      ],
      depth: 0.15,
      zFront: 0.9,
      zBack: -0.9,
      centerYFront: longCenterYFront,
      centerYBack: longCenterYBack,
    },
    short: {
      // Front plate: 248mm wide (±0.28), 310mm tall (0.35) with curved top
      shapeFront: [
        { x: -0.23, y: -0.18 },  // bottom left
        { x: -0.28, y: -0.14 },  // left side 1
        { x: -0.28, y: -0.04 },  // left side 2
        { x: -0.25, y: 0.04 },   // left side 3
        { x: -0.24, y: 0.11 },   // left side 4
        { x: -0.18, y: 0.15 },   // left top 5
        { x: 0.0, y: 0.14 },     // top center peak
        { x: 0.18, y: 0.15 },    // right top 5
        { x: 0.24, y: 0.11 },    // right side 4
        { x: 0.25, y: 0.04 },    // right side 3
        { x: 0.28, y: -0.04 },   // right side 2
        { x: 0.28, y: -0.14 },   // right side 1
        { x: 0.23, y: -0.18 },   // bottom right
      ],
      // Back plate: wider and taller (340mm = 0.39)
      shapeBack: [
        { x: -0.26, y: -0.19 },  // bottom left
        { x: -0.32, y: -0.16 },  // left side 1
        { x: -0.32, y: -0.04 },  // left side 2
        { x: -0.28, y: 0.04 },   // left side 3
        { x: -0.27, y: 0.12 },   // left side 4
        { x: -0.20, y: 0.16 },   // left top 5
        { x: 0.0, y: 0.15 },     // top center peak
        { x: 0.20, y: 0.16 },    // right top 5
        { x: 0.27, y: 0.12 },    // right side 4
        { x: 0.28, y: 0.04 },    // right side 3
        { x: 0.32, y: -0.04 },   // right side 2
        { x: 0.32, y: -0.16 },   // right side 1
        { x: 0.26, y: -0.19 },   // bottom right
      ],
      depth: 0.15,
      zFront: 0.9,
      zBack: -0.9,
      centerYFront: shortCenterYFront,
      centerYBack: shortCenterYBack,
    },
    soft: {
      // Rectangular shape - wider coverage
      shape: [
        { x: -0.4, y: 0.6 },  // top left
        { x: 0.4, y: 0.6 },   // top right
        { x: 0.4, y: 0 },   // bottom right
        { x: -0.4, y: 0 },  // bottom left
      ],
      depth: 1,
      zFront: 0.9,
      zBack: -0.1,
      centerYFront: softCenterYFront,
      centerYBack: softCenterYBack,
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

        {/* Plate Position Controls */}
        {selectedPlate && (
          <div className="mt-6 border-t pt-4">
            <h3 className="text-md font-semibold mb-3">מיקום לוח</h3>
            
            {selectedPlate === 'hard' && (
              <>
                <div className="mb-3">
                  <label className="block text-xs font-bold mb-1">
                    קדמי Y: {hardCenterYFront.toFixed(2)}
                  </label>
                  <input
                    type="range"
                    min="-0.5"
                    max="0.5"
                    step="0.01"
                    value={hardCenterYFront}
                    onChange={(e) => setHardCenterYFront(parseFloat(e.target.value))}
                    className="w-full"
                  />
                </div>
                <div className="mb-3">
                  <label className="block text-xs font-bold mb-1">
                    אחורי Y: {hardCenterYBack.toFixed(2)}
                  </label>
                  <input
                    type="range"
                    min="-0.5"
                    max="0.5"
                    step="0.01"
                    value={hardCenterYBack}
                    onChange={(e) => setHardCenterYBack(parseFloat(e.target.value))}
                    className="w-full"
                  />
                </div>
              </>
            )}

            {selectedPlate === 'long' && (
              <>
                <div className="mb-3">
                  <label className="block text-xs font-bold mb-1">
                    קדמי Y: {longCenterYFront.toFixed(2)}
                  </label>
                  <input
                    type="range"
                    min="-0.5"
                    max="0.5"
                    step="0.01"
                    value={longCenterYFront}
                    onChange={(e) => setLongCenterYFront(parseFloat(e.target.value))}
                    className="w-full"
                  />
                </div>
                <div className="mb-3">
                  <label className="block text-xs font-bold mb-1">
                    אחורי Y: {longCenterYBack.toFixed(2)}
                  </label>
                  <input
                    type="range"
                    min="-0.5"
                    max="0.5"
                    step="0.01"
                    value={longCenterYBack}
                    onChange={(e) => setLongCenterYBack(parseFloat(e.target.value))}
                    className="w-full"
                  />
                </div>
              </>
            )}

            {selectedPlate === 'short' && (
              <>
                <div className="mb-3">
                  <label className="block text-xs font-bold mb-1">
                    קדמי Y: {shortCenterYFront.toFixed(2)}
                  </label>
                  <input
                    type="range"
                    min="-0.5"
                    max="0.5"
                    step="0.01"
                    value={shortCenterYFront}
                    onChange={(e) => setShortCenterYFront(parseFloat(e.target.value))}
                    className="w-full"
                  />
                </div>
                <div className="mb-3">
                  <label className="block text-xs font-bold mb-1">
                    אחורי Y: {shortCenterYBack.toFixed(2)}
                  </label>
                  <input
                    type="range"
                    min="-0.5"
                    max="0.5"
                    step="0.01"
                    value={shortCenterYBack}
                    onChange={(e) => setShortCenterYBack(parseFloat(e.target.value))}
                    className="w-full"
                  />
                </div>
              </>
            )}

            {selectedPlate === 'soft' && (
              <>
                <div className="mb-3">
                  <label className="block text-xs font-bold mb-1">
                    קדמי Y: {softCenterYFront.toFixed(2)}
                  </label>
                  <input
                    type="range"
                    min="-0.5"
                    max="0.5"
                    step="0.01"
                    value={softCenterYFront}
                    onChange={(e) => setSoftCenterYFront(parseFloat(e.target.value))}
                    className="w-full"
                  />
                </div>
                <div className="mb-3">
                  <label className="block text-xs font-bold mb-1">
                    אחורי Y: {softCenterYBack.toFixed(2)}
                  </label>
                  <input
                    type="range"
                    min="-0.5"
                    max="0.5"
                    step="0.01"
                    value={softCenterYBack}
                    onChange={(e) => setSoftCenterYBack(parseFloat(e.target.value))}
                    className="w-full"
                  />
                </div>
              </>
            )}
          </div>
        )}
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
          <button
            onClick={() => {
              const newMeasuring = !isMeasuring;
              setIsMeasuring(newMeasuring);
              // Always clear points when toggling measurement mode
              setMeasurementPoints([]);
            }}
            className={`px-4 py-2 rounded font-semibold transition-colors ${
              isMeasuring
                ? 'bg-yellow-600 text-white'
                : 'bg-white text-gray-700 hover:bg-yellow-100 border border-gray-300'
            }`}
          >
            {isMeasuring ? 'ביטול מדידה' : 'כלי מדידה'}
          </button>
        </div>
        {isMeasuring && measurementPoints.length > 0 && (
          <div className="mt-2 text-center">
            {measurementPoints.length === 1 && (
              <p className="text-gray-600">בחר נקודה שנייה</p>
            )}
            {measurementPoints.length === 2 && (
              <p className="font-bold text-xl text-yellow-600">
                מרחק: {Math.round(calculateDistance(measurementPoints) || 0)}mm
              </p>
            )}
          </div>
        )}

        {/* Canvas */}
        <div className="flex-1">
          <Canvas camera={{ position: [0, 25, 60], fov: 90 }}>
            <Suspense fallback={null}>
              <ambientLight intensity={0.5} />
              <spotLight position={[0, 50, 50]} decay={0} intensity={1} />
              <spotLight position={[0, 50, -50]} decay={0} intensity={1} />
              <pointLight position={[0, 100, 50]} decay={0} intensity={1} />
              <pointLight position={[0, 100, -50]} decay={0} intensity={1} />

              <HumanModel 
                modelRef={modelRef} 
                onLoad={() => setIsModelLoaded(true)} 
                markers={[]} 
                onClick={() => console.log('click')} 
                isMeasuring={isMeasuring} 
                onMeasurementChange={setMeasurementPoints}
                measurementPoints={measurementPoints}
              ></HumanModel>

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
                
                const plateConfig = plateShapes[selectedPlate];
                
                // Create 3D vertices from 2D shape + z position and depth with Y offset
                const createPlateVertices = (zPosition: number, depth: number, centerY: number, shapeOverride?: { x: number; y: number }[]) => {
                  const vertices: THREE.Vector3[] = [];
                  const shapeToUse = shapeOverride || plateConfig.shape || [];
                  
                  // Front face vertices
                  shapeToUse.forEach(point => {
                    vertices.push(new THREE.Vector3(point.x, point.y + centerY, zPosition));
                  });
                  
                  // Back face vertices (same x,y but different z)
                  shapeToUse.forEach(point => {
                    vertices.push(new THREE.Vector3(point.x, point.y + centerY, zPosition - depth));
                  });
                  
                  return vertices;
                };
                
                // Denormalize vertices to world coordinates
                const denormalize = (v: THREE.Vector3) => {
                  const worldX = (v.x + 1) / 2 * (max.x - min.x) + min.x;
                  const worldY = (v.y + 1) / 2 * (max.y - min.y) + min.y;
                  const worldZ = (v.z + 1) / 2 * (max.z - min.z) + min.z;
                  return new THREE.Vector3(worldX, worldY, worldZ);
                };

                const frontPlateVertices = createPlateVertices(
                  plateConfig.zFront, 
                  plateConfig.depth, 
                  plateConfig.centerYFront, 
                  plateConfig.shapeFront
                ).map(denormalize);
                const backPlateVertices = createPlateVertices(
                  plateConfig.zBack, 
                  plateConfig.depth, 
                  plateConfig.centerYBack, 
                  plateConfig.shapeBack
                ).map(denormalize);

                // Create a 3D solid plate from vertices
                const createPlateGeometry = (vertices: THREE.Vector3[]) => {
                  const numShapeVertices = vertices.length / 2; // Half the vertices are front, half are back
                  const positions: number[] = [];
                  
                  // Front face - triangle fan from vertices 0 to numShapeVertices-1
                  for (let i = 1; i < numShapeVertices - 1; i++) {
                    positions.push(
                      vertices[0].x, vertices[0].y, vertices[0].z,
                      vertices[i].x, vertices[i].y, vertices[i].z,
                      vertices[i + 1].x, vertices[i + 1].y, vertices[i + 1].z,
                    );
                  }
                  
                  // Back face - triangle fan from vertices numShapeVertices to end
                  for (let i = 1; i < numShapeVertices - 1; i++) {
                    positions.push(
                      vertices[numShapeVertices].x, vertices[numShapeVertices].y, vertices[numShapeVertices].z,
                      vertices[numShapeVertices + i + 1].x, vertices[numShapeVertices + i + 1].y, vertices[numShapeVertices + i + 1].z,
                      vertices[numShapeVertices + i].x, vertices[numShapeVertices + i].y, vertices[numShapeVertices + i].z,
                    );
                  }
                  
                  // Side faces - connect front and back edges
                  for (let i = 0; i < numShapeVertices; i++) {
                    const nextI = (i + 1) % numShapeVertices;
                    const frontI = i;
                    const frontNext = nextI;
                    const backI = i + numShapeVertices;
                    const backNext = nextI + numShapeVertices;
                    
                    // Two triangles per side
                    positions.push(
                      vertices[frontI].x, vertices[frontI].y, vertices[frontI].z,
                      vertices[frontNext].x, vertices[frontNext].y, vertices[frontNext].z,
                      vertices[backNext].x, vertices[backNext].y, vertices[backNext].z,
                      
                      vertices[backNext].x, vertices[backNext].y, vertices[backNext].z,
                      vertices[backI].x, vertices[backI].y, vertices[backI].z,
                      vertices[frontI].x, vertices[frontI].y, vertices[frontI].z,
                    );
                  }
                  
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
                    <mesh 
                      geometry={frontPlateGeometry} 
                      renderOrder={999}
                      onPointerDown={handlePlatePointerDown}
                      onPointerUp={handlePlatePointerUp}
                    >
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
                    <mesh 
                      geometry={backPlateGeometry} 
                      renderOrder={999}
                      onPointerDown={handlePlatePointerDown}
                      onPointerUp={handlePlatePointerUp}
                    >
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