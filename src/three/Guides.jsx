import { useRef } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'
import { Line } from '@react-three/drei'
import { B } from './rig'
import { store, useAppState } from '../state/store'

const v1 = new THREE.Vector3()
const v2 = new THREE.Vector3()

function setLine(line, a, b) {
  if (!line) return
  line.geometry.setPositions([a.x, a.y, a.z, b.x, b.y, b.z])
  line.computeLineDistances()
}

// Posture-assessment overlays: a plumb line through the midpoint between the
// ankles, plus lines through the shoulder joints and the hip joints. In a
// lateral list the shoulder line's midpoint drifts off the plumb line while
// the pelvis line stays centred on it.
export function Guides() {
  const show = useAppState((s) => s.guides)
  const ready = useAppState((s) => s.ready)
  const plumb = useRef(null)
  const shoulders = useRef(null)
  const pelvis = useRef(null)

  useFrame(() => {
    const rig = store.getState().rig
    if (!rig || !show) return
    const bones = rig.bones
    bones[B.lFoot].getWorldPosition(v1)
    bones[B.rFoot].getWorldPosition(v2)
    const mx = (v1.x + v2.x) / 2
    const mz = (v1.z + v2.z) / 2
    setLine(plumb.current, { x: mx, y: 0, z: mz }, { x: mx, y: 1.95, z: mz })
    setLine(shoulders.current, bones[B.lArm].getWorldPosition(v1), bones[B.rArm].getWorldPosition(v2))
    setLine(pelvis.current, bones[B.lUpLeg].getWorldPosition(v1), bones[B.rUpLeg].getWorldPosition(v2))
  })

  if (!show || !ready) return null
  return (
    <group>
      <Line
        ref={plumb}
        points={[
          [0, 0, 0],
          [0, 1.95, 0],
        ]}
        color="#0f766e"
        lineWidth={1.5}
        dashed
        dashSize={0.06}
        gapSize={0.04}
        depthTest={false}
        renderOrder={10}
      />
      <Line
        ref={shoulders}
        points={[
          [-0.2, 1.4, 0],
          [0.2, 1.4, 0],
        ]}
        color="#c2410c"
        lineWidth={3}
        depthTest={false}
        renderOrder={10}
      />
      <Line
        ref={pelvis}
        points={[
          [-0.1, 1.0, 0],
          [0.1, 1.0, 0],
        ]}
        color="#c2410c"
        lineWidth={3}
        depthTest={false}
        renderOrder={10}
      />
    </group>
  )
}
