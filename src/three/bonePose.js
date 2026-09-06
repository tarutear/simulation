import * as THREE from 'three'

// CesiumMan (KhronosGroup/glTF-Sample-Assets) skeleton joint names.
// Confirmed by inspecting the glb's node graph directly.
export const BONES = {
  pelvis: 'Skeleton_torso_joint_1', // root of spine + both legs
  lumbar: 'Skeleton_torso_joint_2', // lower spine segment
  thoracic: 'torso_joint_3', // upper spine segment
  hipL: 'leg_joint_L_1',
  kneeL: 'leg_joint_L_2',
  ankleL: 'leg_joint_L_3',
  hipR: 'leg_joint_R_1',
  kneeR: 'leg_joint_R_2',
  ankleR: 'leg_joint_R_3',
}

// Captures each bone's bind-pose quaternion once, so poses can always be
// expressed as a delta from rest instead of accumulating rotation frame over frame.
export function captureRestPose(nodes, boneNames) {
  const rest = {}
  for (const name of boneNames) {
    const bone = nodes[name]
    if (bone) rest[name] = bone.quaternion.clone()
  }
  return rest
}

const _q = new THREE.Quaternion()
const _e = new THREE.Euler()

// pose: { [boneName]: [x, y, z] } euler radians, relative to bind pose
export function applyPose(nodes, restPose, pose) {
  for (const name in pose) {
    const bone = nodes[name]
    const rest = restPose[name]
    if (!bone || !rest) continue
    const [x, y, z] = pose[name]
    _e.set(x, y, z)
    _q.setFromEuler(_e)
    bone.quaternion.copy(rest).multiply(_q)
  }
}

// Blends two full poses (same bone keys expected) by spherical-interpolating
// each bone's delta quaternion, then applies the result relative to bind pose.
export function applyBlendedPose(nodes, restPose, poseA, poseB, t) {
  const qa = new THREE.Quaternion()
  const qb = new THREE.Quaternion()
  for (const name in poseA) {
    const bone = nodes[name]
    const rest = restPose[name]
    if (!bone || !rest) continue
    const a = poseA[name] || [0, 0, 0]
    const b = poseB[name] || [0, 0, 0]
    qa.setFromEuler(_e.set(a[0], a[1], a[2]))
    qb.setFromEuler(_e.set(b[0], b[1], b[2]))
    qa.slerp(qb, t)
    bone.quaternion.copy(rest).multiply(qa)
  }
}

export const deg = (d) => (d * Math.PI) / 180
export const clamp01 = (v) => Math.min(1, Math.max(0, v))
export const smoothstep = (edge0, edge1, x) => {
  const t = clamp01((x - edge0) / (edge1 - edge0))
  return t * t * (3 - 2 * t)
}
