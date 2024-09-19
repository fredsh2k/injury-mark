import { Suspense } from 'react'
import { OrbitControls, useGLTF } from '@react-three/drei';
import * as THREE from 'three'
import { ThreeEvent } from '@react-three/fiber';


interface HumanModelProps {
  onClick: (event: ThreeEvent<MouseEvent>) => void;
  modelRef: React.Ref<THREE.Object3D>;
  markers: Marker[];
}

interface Marker {
  position: THREE.Vector3;
}

const HumanModel: React.FC<HumanModelProps> = ({ onClick, modelRef, markers }) => {

  const { scene } = useGLTF("human_body.glb");

  return (
    <>
      <ambientLight intensity={2} />
      <spotLight position={[10, 10, 10]} angle={0.15} penumbra={1} decay={0} intensity={1.5} />
      <pointLight position={[-10, -10, -10]} decay={0} intensity={1.5} />

      <OrbitControls
        enableZoom={true}
        minPolarAngle={0}
        maxPolarAngle={Math.PI}
        enablePan={true}
      />
      <Suspense fallback={null}>
        <primitive ref={modelRef} object={scene} position={[0, 0, 0]} scale={[50, 50, 50]}
          onPointerDown={onClick}

          receiveShadow />
        {markers && markers.map((marker, index) => (
          <mesh key={index} position={marker.position}>
            <sphereGeometry args={[0.005, 10, 10]} />
            <meshStandardMaterial color="red" />
          </mesh>
        ))}
      </Suspense>
    </>
  )
}

export default HumanModel