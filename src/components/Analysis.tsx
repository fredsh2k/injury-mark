import { Canvas } from "@react-three/fiber"
import HumanModel from "./HumanModel"
import { Suspense, useEffect, useRef, useState } from "react"
import * as THREE from "three"
import { Marker, Submission } from '../Interfaces';

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

      allMarkers.forEach(marker => {
        marker.location.x = (marker.location.x + 1) / 2 * (max.x - min.x) + min.x;
        marker.location.y = (marker.location.y + 1) / 2 * (max.y - min.y) + min.y;
        marker.location.z = (marker.location.z + 1) / 2 * (max.z - min.z) + min.z;
      });
    }
  }, [isModelLoaded, allMarkers]);

  return (
    <div style={{ height: "90vh" }}>
      <Canvas camera={{ position: [0, 25, 60], fov: 90 }}>
        <Suspense fallback={null}>
          <HumanModel modelRef={modelRef} markers={allMarkers} onClick={() => console.log("click")} onLoad={() => setIsModelLoaded(true)}></HumanModel>
        </Suspense>
      </Canvas>
    </div>
  )
}

export default Analysis