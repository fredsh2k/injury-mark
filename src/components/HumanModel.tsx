import { Suspense, useEffect } from 'react';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import { ThreeEvent, useLoader } from '@react-three/fiber';
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader.js';
import { Marker } from '../Interfaces';

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
      <mesh position={[0, 0, temporaryVertices[0].z]}>
        <shapeGeometry args={[shape]} />
        <meshBasicMaterial 
          color="red" 
          transparent={true} 
          opacity={0.2} 
          side={THREE.DoubleSide}
        />
      </mesh>
    );
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
          onPointerDown={onClick}
          receiveShadow 
        />
        {renderMarkers()}
        {renderPolygonLines()}
        {renderPolygonFill()}
      </Suspense>
    </>
  );
};

export default HumanModel;