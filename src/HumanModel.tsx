import { Suspense } from 'react'
import { OrbitControls, useGLTF } from '@react-three/drei';
import * as THREE from 'three'
import { ThreeEvent } from '@react-three/fiber';


interface HumanModelProps {
  onClick: (event: ThreeEvent<MouseEvent>) => void;
  modelRef: React.Ref<THREE.Object3D>;
}

const HumanModel: React.FC<HumanModelProps> = ({ onClick, modelRef }) => {

  const { scene } = useGLTF("human_body.glb"); // Load 3D model (GLTF or GLB format)

  return (
    <>
      <ambientLight intensity={2} />
      <pointLight position={[10, 10, 10]} />
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
        {/* <primitive object={scene} scale={[50, 50, 50]} onPointerDown={onClick} receiveShadow /> */}
      </Suspense>
    </>
  )
}

export default HumanModel