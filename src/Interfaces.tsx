import * as THREE from 'three';

interface Injury {
  type: string
  description: string
  selectedLocation: string
  location: {
    x: number
    y: number
    z: number
  }
  radius: number
}

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
  position: THREE.Vector3;
}

export type { Submission, Injury, Marker }