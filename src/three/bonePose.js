import * as THREE from 'three'

export const deg = (d) => (d * Math.PI) / 180

// "Victoria Rubin" VRoid sample avatar skeleton joint names, read from the
// VRM 0.x "humanoid" bone map embedded in the file (extensions.VRM.humanoid
// .humanBones), which is at least as detailed as a Mixamo rig (separate
// hips/spine/chest/upperChest/neck/head, full per-side leg chains including
// toes, plus full finger chains we don't need here).
export const BONES = {
  pelvis: 'J_Bip_C_Hips',
  lumbar: 'J_Bip_C_Spine', // lower spine segment
  thoracic: 'J_Bip_C_Chest', // upper spine segment
  hipL: 'J_Bip_L_UpperLeg',
  kneeL: 'J_Bip_L_LowerLeg',
  ankleL: 'J_Bip_L_Foot',
  toeL: 'J_Bip_L_ToeBase',
  hipR: 'J_Bip_R_UpperLeg',
  kneeR: 'J_Bip_R_LowerLeg',
  ankleR: 'J_Bip_R_Foot',
  armL: 'J_Bip_L_UpperArm',
  armR: 'J_Bip_R_UpperArm',
}

// VRM 0.x mandates a T-pose bind (arms straight out horizontally) for every
// avatar - this is true across every sample we checked, not just this one -
// so a relaxed standing patient needs the upper arms explicitly rotated
// down to the sides. Rotating +/-80 deg around Z (the arm's bind pose
// points along local X, identity bind rotation on this rig) swings each
// arm from horizontal to hanging just short of straight down, matching
// standard anatomical position without clipping into the torso.
export const ARM_BONES = [BONES.armL, BONES.armR]
export const ARMS_DOWN_POSE = {
  [BONES.armL]: [0, 0, deg(80)],
  [BONES.armR]: [0, 0, -deg(80)],
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

export const clamp01 = (v) => Math.min(1, Math.max(0, v))
export const smoothstep = (edge0, edge1, x) => {
  const t = clamp01((x - edge0) / (edge1 - edge0))
  return t * t * (3 - 2 * t)
}
