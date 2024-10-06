import { Suspense, useEffect } from 'react'
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three'
import { ThreeEvent, useLoader } from '@react-three/fiber';
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader.js'
import { Marker } from '../Interfaces';

interface HumanModelProps {
  onClick: (event: ThreeEvent<MouseEvent>) => void;
  modelRef: React.Ref<THREE.Object3D>;
  markers: Marker[];
  onLoad: () => void;
}

const HumanModel: React.FC<HumanModelProps> = ({ onClick, modelRef, markers, onLoad }) => {

  const scene = useLoader(FBXLoader, "male_body.fbx")

  useEffect(() => {
    if (scene) {
      onLoad();
    }
  }, [scene, onLoad]);
  

  return (
    <>
      <OrbitControls
        enableZoom={true}
        minPolarAngle={0}
        maxPolarAngle={Math.PI}
        enablePan={true}
      />

      <Suspense fallback={null}>
        <primitive ref={modelRef} object={scene} position={[0, 0, 0]} scale={[5, 5, 5]} zoom={10}
          onPointerDown={onClick}
          receiveShadow />

        {markers && markers.map((marker, index) => (
          <mesh key={index} position={marker.location}>
            <sphereGeometry args={[0.4]} />
            <meshStandardMaterial color="red" />
          </mesh>
        ))}
      </Suspense>
    </>
  )
}

export default HumanModel