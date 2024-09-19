import { Suspense } from 'react'
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three'
import { ThreeEvent, useLoader } from '@react-three/fiber';
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader.js'

interface HumanModelProps {
  onClick: (event: ThreeEvent<MouseEvent>) => void;
  modelRef: React.Ref<THREE.Object3D>;
  markers: Marker[];
}

interface Marker {
  position: THREE.Vector3;
}

const HumanModel: React.FC<HumanModelProps> = ({ onClick, modelRef, markers }) => {

  const scene = useLoader(FBXLoader, "male_body.fbx")

  return (
    <>
      <ambientLight intensity={2} />
      <spotLight position={[0, 50, 50]} angle={5} penumbra={1} decay={0} intensity={2} />
      <pointLight position={[0, 50, 50]} decay={0} intensity={1} />

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
          <mesh key={index} position={marker.position}>
            <sphereGeometry args={[0.5, 10, 10]} />
            <meshStandardMaterial color="red" />
          </mesh>
        ))}
      </Suspense>
    </>
  )
}

export default HumanModel