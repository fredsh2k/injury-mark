import * as THREE from 'three';

// Model dimensions in millimeters
export const MODEL_DIMENSIONS = {
  HEIGHT: 1760, // mm (Y axis: -1 to 1)
  WIDTH: 901,   // mm (X axis: -1 to 1)
  DEPTH: 450,   // mm (Z axis: -1 to 1)
};

// Convert normalized coordinates to millimeters
export const normalizedToMm = (normalized: { x: number; y: number; z: number }) => {
  return {
    x: Math.round(((normalized.x + 1) / 2) * MODEL_DIMENSIONS.WIDTH),
    y: Math.round(((normalized.y + 1) / 2) * MODEL_DIMENSIONS.HEIGHT),
    z: Math.round(((normalized.z + 1) / 2) * MODEL_DIMENSIONS.DEPTH),
  };
};

// Convert millimeters to normalized coordinates
export const mmToNormalized = (mm: { x: number; y: number; z: number }) => {
  return {
    x: (mm.x / MODEL_DIMENSIONS.WIDTH) * 2 - 1,
    y: (mm.y / MODEL_DIMENSIONS.HEIGHT) * 2 - 1,
    z: (mm.z / MODEL_DIMENSIONS.DEPTH) * 2 - 1,
  };
};

interface BaseInjury {
  type: string
  description: string
  selectedLocation: string
  location: {
    x: number
    y: number
    z: number
  }
  locationMm: {
    x: number
    y: number
    z: number
  }
}

interface RadiusInjury extends BaseInjury {
  injuryType: 'radius'
  radius: number
}

interface PolygonInjury extends BaseInjury {
  injuryType: 'polygon'
  vertices: THREE.Vector3[]
}

type Injury = RadiusInjury | PolygonInjury

interface Submission {
  manpatzIncidentNumber: string
  manpatzTraumaNumber: string
  maanahCasualtyNumber: string
  id: string
  personalNumber: string
  incidentDateTime: string
  demiseDateTime: string
  externalTestDateTime: string
  PMCTDateTime: string
  PMCTInterpretation: string
  injuries: Injury[]
  protectionMeans: string[]
}


interface Marker {
  location: THREE.Vector3;
}

export type { Submission, Injury, Marker, RadiusInjury, PolygonInjury }