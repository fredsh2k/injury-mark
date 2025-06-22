import { Suspense, useEffect } from 'react';
import { OrbitControls, Text, Billboard } from '@react-three/drei';
import * as THREE from 'three';
import { ThreeEvent, useLoader } from '@react-three/fiber';
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader.js';
import { Marker } from '../Interfaces';
import { useRef } from 'react';

interface HumanModelProps {
  onClick: (event: ThreeEvent<MouseEvent>) => void;
  modelRef: React.Ref<THREE.Object3D>;
  markers: Marker[];
  onLoad: () => void;
  temporaryVertices?: THREE.Vector3[]; // Add this for polygon drawing
  isDrawingPolygon?: boolean; // Add this to determine visualization mode
  currentRadius?: number; // Add this for radius visualization
}

const HumanModel: React.FC<HumanModelProps> = ({ 
  onClick, 
  modelRef, 
  markers, 
  onLoad,
  temporaryVertices = [],
  isDrawingPolygon = false,
  currentRadius = 1
}) => {
  const scene = useLoader(FBXLoader, "male_body.fbx");

  // Track pointer state to distinguish click vs drag
  const pointerDownPos = useRef<{x: number, y: number} | null>(null);
  const dragThreshold = 5; // px

  useEffect(() => {
    if (scene) {
      onLoad();
    }
  }, [scene, onLoad]);

  const renderMarkers = () => {
    if (!markers.length) return null;

    return markers.map((marker, index) => {
      if (isDrawingPolygon) {
        // Render smaller markers for polygon vertices
        return (
          <mesh key={index} position={marker.location}>
            <sphereGeometry args={[0.2]} />
            <meshStandardMaterial color="red" />
          </mesh>
        );
      } else {
        // Render regular markers with radius for radius mode
        return (
          <group key={index}>
            {/* Center point */}
            <mesh position={marker.location}>
              <sphereGeometry args={[0.2]} />
              <meshStandardMaterial color="red" />
            </mesh>
            {/* Radius visualization */}
            <mesh position={marker.location}>
              <sphereGeometry args={[currentRadius]} />
              <meshStandardMaterial 
                color="red" 
                transparent={true} 
                opacity={0.2} 
              />
            </mesh>
          </group>
        );
      }
    });
  };

  const renderPolygonLines = () => {
    if (!isDrawingPolygon || temporaryVertices.length < 2) return null;

    // Create points for the line
    const points = temporaryVertices.map(vertex => new THREE.Vector3(vertex.x, vertex.y, vertex.z));
    
    // If we have more than 2 points, close the polygon by adding the first point again
    if (points.length > 2) {
      points.push(points[0]);
    }

    return (
      <line>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            count={points.length}
            array={new Float32Array(points.flatMap(v => [v.x, v.y, v.z]))}
            itemSize={3}
          />
        </bufferGeometry>
        <lineBasicMaterial color="red" />
      </line>
    );
  };

  const renderPolygonFill = () => {
    if (!isDrawingPolygon || temporaryVertices.length < 3) return null;

    // Create a shape from the vertices
    const shape = new THREE.Shape();
    shape.moveTo(temporaryVertices[0].x, temporaryVertices[0].y);
    for (let i = 1; i < temporaryVertices.length; i++) {
      shape.lineTo(temporaryVertices[i].x, temporaryVertices[i].y);
    }
    shape.lineTo(temporaryVertices[0].x, temporaryVertices[0].y);

    return (
      <mesh
        position={[0, 0, temporaryVertices[0].z]}
        renderOrder={1}
      >
        <shapeGeometry args={[shape]} />
        <meshBasicMaterial 
          color="red" 
          transparent={true} 
          opacity={0.2} 
          side={THREE.DoubleSide}
          depthTest={false}
        />
      </mesh>
    );
  };

  const renderOrientationLabels = () => {
    return (
      <>
        {/* Left side label and arrow */}
        <group position={[-14, 25, 0]}>
          <Billboard>
            <Text
              position={[0, 2, 0]}
              fontSize={2}
              color="black"
              anchorX="center"
              anchorY="middle"
            >
              R
            </Text>
          </Billboard>
          {/* Left pointing arrow */}
          <mesh position={[0, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
            <coneGeometry args={[0.5, 2]} />
            <meshBasicMaterial color="blue" />
          </mesh>
          <mesh position={[-1, 0, 0]}>
            <cylinderGeometry args={[0.1, 0.1, 2]} />
            <meshBasicMaterial color="blue" />
          </mesh>
        </group>

        {/* Right side label and arrow */}
        <group position={[14, 25, 0]}>
          <Billboard>
            <Text
              position={[0, 2, 0]}
              fontSize={2}
              color="black"
              anchorX="center"
              anchorY="middle"
            >
              L
            </Text>
          </Billboard>
          {/* Right pointing arrow */}
          <mesh position={[0, 0, 0]} rotation={[0, 0, -Math.PI / 2]}>
            <coneGeometry args={[0.5, 2]} />
            <meshBasicMaterial color="red" />
          </mesh>
          <mesh position={[1, 0, 0]}>
            <cylinderGeometry args={[0.1, 0.1, 2]} />
            <meshBasicMaterial color="red" />
          </mesh>
        </group>
      </>
    );
  };


  // Only call onClick if not a drag
  const handlePointerDown = (e: any) => {
    pointerDownPos.current = { x: e.clientX, y: e.clientY };
  };

  const handlePointerUp = (e: any) => {
    if (!pointerDownPos.current) return;
    const dx = e.clientX - pointerDownPos.current.x;
    const dy = e.clientY - pointerDownPos.current.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    pointerDownPos.current = null;
    if (dist < dragThreshold) {
      // Only treat as click if pointer didn't move much
      onClick(e);
    }
  };

  return (
    <>
      <OrbitControls
        enableZoom={true}
        minPolarAngle={0}
        maxPolarAngle={Math.PI}
        enablePan={true}
      />
      <Suspense fallback={null}>
        <primitive 
          ref={modelRef} 
          object={scene} 
          position={[0, 0, 0]} 
          scale={[5, 5, 5]} 
          zoom={10}
          onPointerDown={handlePointerDown}
          onPointerUp={handlePointerUp}
          receiveShadow 
        />
        {renderMarkers()}
        {renderPolygonLines()}
        {renderPolygonFill()}
        {renderOrientationLabels()}
      </Suspense>
    </>
  );
};

export default HumanModel;