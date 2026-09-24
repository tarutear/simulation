import { useEffect, useRef } from 'react'
import * as THREE from 'three'
import { B } from './rig'
import { smoothstep } from './poses'
import { store, useAppState } from '../state/store'

const HIGHLIGHT = new THREE.Color('#f26a1b')

// Angular window (degrees) with feathered edges → 0..1
function angleWindow(angle, center, halfWidth, feather) {
  const d = Math.abs(((angle - center + 540) % 360) - 180)
  return 1 - smoothstep(halfWidth - feather, halfWidth + feather, d)
}

// (A) Surface overlay — a second SkinnedMesh that shares the body's skeleton.
// Its per-vertex colour+alpha mark the L5 dermatome: the anterolateral lower
// leg and the dorsum of the foot down to the great/2nd/3rd toes. Membership is
// derived from each vertex's skin weights (which bone owns it) and its
// bind-pose position relative to that bone, so it needs no UV map, no texture
// editing, and it deforms with the skin for free.
function buildOverlay(surface, rig) {
  const geo = surface.geometry
  const pos = geo.attributes.position
  const si = geo.attributes.skinIndex
  const sw = geo.attributes.skinWeight
  const bones = surface.skeleton.bones
  const index = (name) => bones.findIndex((b) => b.name === name)
  const shinSet = new Set([index(B.lLeg), index(B.lLeg2)])
  const footSet = new Set([index(B.lFoot)])
  const toeSet = new Set(B.lToes.map(index)) // toes 1–3 only (4–5 are S1)

  // Geometry and bones are both in metres with the character at the origin
  // (identity rest rotations, no armature scale), so bind-pose bone positions
  // can be compared with vertex positions directly.
  const local = (name) => rig.bones[name].getWorldPosition(new THREE.Vector3())
  const knee = local(B.lLeg)
  const ankle = local(B.lFoot)
  const toe = local(B.lToe)
  const footAxis = new THREE.Vector3().subVectors(toe, ankle)
  const footLen2 = footAxis.lengthSq()

  const colors = new Float32Array(pos.count * 4)
  const p = new THREE.Vector3()
  const d = new THREE.Vector3()
  for (let i = 0; i < pos.count; i++) {
    let wShin = 0
    let wFoot = 0
    let wToe = 0
    for (let k = 0; k < 4; k++) {
      const j = si.getComponent(i, k)
      const w = sw.getComponent(i, k)
      if (shinSet.has(j)) wShin += w
      else if (footSet.has(j)) wFoot += w
      else if (toeSet.has(j)) wToe += w
    }
    p.set(pos.getX(i), pos.getY(i), pos.getZ(i))
    let m = 0

    if (wShin > 0.05) {
      const t = (p.y - ankle.y) / (knee.y - ankle.y) // 0 = ankle … 1 = knee
      const cx = ankle.x + (knee.x - ankle.x) * t
      const cz = ankle.z + (knee.z - ankle.z) * t
      const angle = Math.atan2(p.z - cz, p.x - cx) * 57.2958 // 0° lateral (+X), 90° anterior (+Z)
      const band = angleWindow(angle, 25, 50, 22)
      const height = smoothstep(-0.05, 0.12, t) * (1 - smoothstep(0.82, 0.95, t))
      m = Math.max(m, Math.min(1, wShin * 1.5) * band * height)
    }

    const wF = wFoot + wToe
    if (wF > 0.05) {
      d.subVectors(p, ankle)
      const along = THREE.MathUtils.clamp(d.dot(footAxis) / footLen2, 0, 1.2)
      const lineY = ankle.y + footAxis.y * along
      const dorsal = smoothstep(-0.008, 0.012, p.y - lineY) // above the ankle→toe axis (m)
      const front = smoothstep(0.02, 0.28, along) // skip malleoli / heel
      const medialToes = 1 // toe membership already limited to toes 1–3 via the bone set
      m = Math.max(m, Math.min(1, wF * 1.5) * dorsal * front * medialToes)
    }

    colors[i * 4] = HIGHLIGHT.r
    colors[i * 4 + 1] = HIGHLIGHT.g
    colors[i * 4 + 2] = HIGHLIGHT.b
    colors[i * 4 + 3] = m * 0.85
  }

  const overlayGeo = geo.clone()
  overlayGeo.setAttribute('color', new THREE.BufferAttribute(colors, 4))
  const material = new THREE.MeshBasicMaterial({
    vertexColors: true, // RGBA attribute → per-vertex alpha
    transparent: true,
    depthWrite: false,
    polygonOffset: true,
    polygonOffsetFactor: -2,
    polygonOffsetUnits: -2,
    toneMapped: false,
  })
  const overlay = new THREE.SkinnedMesh(overlayGeo, material)
  overlay.name = 'L5_overlay'
  overlay.bind(surface.skeleton, surface.bindMatrix)
  overlay.frustumCulled = false
  overlay.renderOrder = 2
  surface.parent.add(overlay)
  return overlay
}

// (B) "Decal" — primitive meshes parented to the bones. Bone-local frames are
// world-aligned at the joint head, in metres. Positions were tuned by eye
// against the mesh; they only fit this rig.
function buildDecals(rig) {
  const material = new THREE.MeshStandardMaterial({
    color: HIGHLIGHT,
    transparent: true,
    opacity: 0.6,
    roughness: 0.6,
    depthWrite: false,
  })
  const shin = new THREE.Mesh(new THREE.CapsuleGeometry(0.043, 0.2, 6, 14), material)
  shin.position.set(0.075, -0.19, 0.02) // anterolateral of the shin, mid-shin
  rig.bones[B.lLeg].add(shin)

  const foot = new THREE.Mesh(new THREE.BoxGeometry(0.065, 0.02, 0.13), material.clone())
  foot.position.set(-0.005, 0.0, 0.075) // on top of the ankle→toe axis
  foot.rotation.x = 0.42 // align with the dorsum's slope
  rig.bones[B.lFoot].add(foot)
  return [shin, foot]
}

export function Dermatome() {
  const mode = useAppState((s) => s.dermatome)
  const ready = useAppState((s) => s.ready)
  const built = useRef(null)

  useEffect(() => {
    if (!ready) return
    const rig = store.getState().rig
    const surface = rig.root.getObjectByName('Body')
    const overlay = buildOverlay(surface, rig)
    const decals = buildDecals(rig)
    built.current = { overlay, decals }
    return () => {
      overlay.removeFromParent()
      overlay.geometry.dispose()
      overlay.material.dispose()
      decals.forEach((m) => {
        m.removeFromParent()
        m.geometry.dispose()
        m.material.dispose()
      })
      built.current = null
    }
  }, [ready])

  useEffect(() => {
    const b = built.current
    if (!b) return
    b.overlay.visible = mode === 'overlay'
    b.decals.forEach((m) => {
      m.visible = mode === 'decal'
    })
  }, [mode, ready])

  return null
}
