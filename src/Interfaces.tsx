import * as THREE from 'three';

interface BaseInjury {
  type: string
  description: string
  selectedLocation: string
  location: {
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
}


interface Marker {
  location: THREE.Vector3;
}

export type { Submission, Injury, Marker, RadiusInjury, PolygonInjury }