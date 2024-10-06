import { Canvas } from "@react-three/fiber"
import HumanModel from "./HumanModel"
import { Suspense, useEffect, useRef, useState } from "react"
import * as THREE from "three"
import { Marker, Submission } from '../Interfaces';
import chroma from 'chroma-js';


interface AnalysisProps {
  submissions: Submission[];
}

const Analysis = ({ submissions }: AnalysisProps) => {

  const injuries = submissions.map(submission => submission.injuries)
  const allMarkers: Marker[] = injuries.flat().map(injury => ({ location: new THREE.Vector3(injury.location.x, injury.location.y, injury.location.z) }))
  const [isModelLoaded, setIsModelLoaded] = useState(false);
  const modelRef = useRef<THREE.Group>(null);

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
      const proximityThreshold = 0.15;
      const colorScale = chroma.scale(['blue', 'red']).domain([0, 1]);

      model.traverse((child: any) => {
        if (!child.isMesh) return;

        const geometry = child.geometry as THREE.BufferGeometry;
        const positions = geometry.attributes.position.array;
        const colors = geometry.attributes.color?.array;
        const vertexCount = positions.length / 3;

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
        const colorArray = colors || new Float32Array(positions.length); // Same length as positions

        // Assign colors based on normalized points
        for (let i = 0; i < positions.length; i += 9) {
          const triangleIndex = i / 9;
          const normalizedPoints = maxPoints > 0 ? pointsArray[triangleIndex] / maxPoints : 0;

          // Interpolate color (Blue for low points, Red for high points)
          // color.lerpColors(
          //   new THREE.Color(0, 0, 1), // Blue (low score)
          //   new THREE.Color(1, 0, 0), // Red (high score)
          //   normalizedPoints
          // );

          // Get the color from the scale
          const colorHex = colorScale(normalizedPoints).hex();
          const color = new THREE.Color(colorHex);



          // Skip if color is completely blue
          if (color.equals(new THREE.Color(0, 0, 1))) {
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
  }, [isModelLoaded, allMarkers]);


  return (
    <div style={{ height: "90vh" }}>
      <Canvas camera={{ position: [0, 25, 60], fov: 90 }}>
        <Suspense fallback={null}>
          <ambientLight intensity={0.5}  />
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
  )
}

export default Analysis