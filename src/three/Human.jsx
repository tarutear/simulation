import { useEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'
import { useAnimations } from '@react-three/drei'
import { useHumanModel } from './model'
import { B, createRig, smoothPose, plantFeet } from './rig'
import { store } from '../state/store'

// Neutral "clay mannequin" look — reads as a clinical figure and gives
// highlights something to pop on.
export const SURFACE_COLOR = '#e5dcd3'
export const JOINT_COLOR = '#474c56'

export function Human() {
  const { scene, animations } = useHumanModel()
  const container = useRef(null)
  // Bind pose is captured here, exactly once, before any pose is applied.
  const rig = useMemo(() => createRig(scene), [scene])
  const { actions, mixer } = useAnimations(animations, container)
  const current = useRef({})
  const bindFeet = useRef(null)

  useEffect(() => {
    scene.traverse((o) => {
      if (!o.isSkinnedMesh) return
      o.castShadow = true
      o.receiveShadow = false
      o.frustumCulled = false // bounds are computed for the bind pose only
      const eyes = o.name === 'Eyes'
      o.material = new THREE.MeshStandardMaterial({
        color: eyes ? JOINT_COLOR : SURFACE_COLOR,
        // The body carries a COLOR_0 tint (shorts + top) that multiplies the base colour.
        vertexColors: !eyes && Boolean(o.geometry.attributes.color),
        roughness: eyes ? 0.4 : 0.85,
        metalness: 0,
      })
    })
    // Where the feet are in the bind pose (with the character at the origin),
    // used by plantFeet() to keep the stance foot glued to the floor.
    rig.apply({})
    const c = container.current
    c.position.set(0, 0, 0)
    c.updateWorldMatrix(true, true)
    bindFeet.current = {
      left: rig.bones[B.lFoot].getWorldPosition(new THREE.Vector3()),
      right: rig.bones[B.rFoot].getWorldPosition(new THREE.Vector3()),
    }
    store.setState({ ready: true, rig })
    return () => store.setState({ ready: false, rig: null })
  }, [scene, rig])

  // Bundled animation clips, if the model has any (Demo 1). While a clip plays the mixer owns the bones;
  // when it stops, the per-frame pose below takes over again from the bind pose.
  const playing = useRef(null)
  useEffect(() => {
    const sync = () => {
      const name = store.getState().animation
      if (name === playing.current) return
      mixer.stopAllAction()
      if (name && actions[name]) actions[name].reset().play()
      playing.current = name
    }
    sync()
    return store.subscribe(sync)
  }, [actions, mixer])

  useFrame((_, dt) => {
    const s = store.getState()
    if (s.animation) return
    smoothPose(current.current, s.pose, 1 - Math.exp(-Math.min(dt, 0.1) * 9))
    rig.apply(current.current)
    plantFeet(container.current, rig, s.plant, bindFeet.current)
  })

  return (
    <group ref={container}>
      <primitive object={scene} />
    </group>
  )
}
