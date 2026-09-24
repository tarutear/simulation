import { useEffect } from 'react'
import * as THREE from 'three'
import { B } from './rig'
import { store, useAppState } from '../state/store'

// "X-ray" view of the vertebra-level spine: one small block per vertebra bone,
// parented to that bone so it follows every pose, drawn through the body
// (depthTest off). Colour marks the region; the gaps between blocks are the
// motion segments the poses rotate.
const REGIONS = [
  { names: B.lumbar, color: '#d97706', size: [0.046, 0.034] },
  { names: B.thoracic, color: '#4f46e5', size: [0.034, 0.028] },
  { names: B.neck, color: '#0891b2', size: [0.026, 0.022] },
]

function buildMarkers(rig) {
  const chain = [...B.lumbar, ...B.thoracic, ...B.neck, B.head]
  const meshes = []
  for (const r of REGIONS) {
    const material = new THREE.MeshBasicMaterial({
      color: r.color,
      transparent: true,
      opacity: 0.9,
      depthTest: false,
      depthWrite: false,
      toneMapped: false,
    })
    for (const name of r.names) {
      const bone = rig.bones[name]
      const next = rig.bones[chain[chain.indexOf(name) + 1]]
      // Rest rotations are identity, so the next vertebra's local position is
      // this vertebra's extent (disc to disc) in this bone's own frame.
      const span = next.position.clone()
      const h = span.length() * 0.72 // leave a visible "disc" gap
      const mesh = new THREE.Mesh(new THREE.BoxGeometry(r.size[0], h, r.size[1]), material)
      mesh.position.copy(span).multiplyScalar(0.5)
      mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), span.clone().normalize())
      mesh.renderOrder = 6
      mesh.name = `marker_${name}`
      bone.add(mesh)
      meshes.push(mesh)
    }
  }
  return meshes
}

export function SpineMarkers() {
  const show = useAppState((s) => s.spine)
  const ready = useAppState((s) => s.ready)

  useEffect(() => {
    if (!ready || !show) return
    const meshes = buildMarkers(store.getState().rig)
    return () => {
      const mats = new Set()
      meshes.forEach((m) => {
        m.removeFromParent()
        m.geometry.dispose()
        mats.add(m.material)
      })
      mats.forEach((m) => m.dispose())
    }
  }, [ready, show])

  return null
}
