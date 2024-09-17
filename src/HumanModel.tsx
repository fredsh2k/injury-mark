import { Suspense, useCallback, useEffect, useRef, useState } from 'react'
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, useGLTF } from '@react-three/drei';
import * as THREE from 'three'


const HumanModel = ({ onClick, modelRef }) => {

  const { scene } = useGLTF("src/assets/models/human_body.glb"); // Load 3D model (GLTF or GLB format)

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