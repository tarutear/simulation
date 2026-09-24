import * as THREE from 'three'

// Mixamo skeleton (Adobe Mixamo "X Bot", redistributed in the three.js
// examples). The file names bones "mixamorig:Hips" etc., but three.js's
// GLTFLoader sanitizes node names (PropertyBinding.sanitizeNodeName strips
// the colon), so at runtime they are "mixamorigHips".
export const B = {
  hips: 'mixamorigHips',
  spine: 'mixamorigSpine', // lumbar
  spine1: 'mixamorigSpine1', // thoracolumbar
  spine2: 'mixamorigSpine2', // thoracic
  neck: 'mixamorigNeck',
  head: 'mixamorigHead',
  lShoulder: 'mixamorigLeftShoulder',
  lArm: 'mixamorigLeftArm',
  lForeArm: 'mixamorigLeftForeArm',
  lHand: 'mixamorigLeftHand',
  rShoulder: 'mixamorigRightShoulder',
  rArm: 'mixamorigRightArm',
  rForeArm: 'mixamorigRightForeArm',
  rHand: 'mixamorigRightHand',
  lUpLeg: 'mixamorigLeftUpLeg',
  lLeg: 'mixamorigLeftLeg',
  lFoot: 'mixamorigLeftFoot',
  lToe: 'mixamorigLeftToeBase',
  rUpLeg: 'mixamorigRightUpLeg',
  rLeg: 'mixamorigRightLeg',
  rFoot: 'mixamorigRightFoot',
  rToe: 'mixamorigRightToeBase',
}

// ---------------------------------------------------------------------------
// Joint rotation helpers. Angles are degrees. Each returns a partial
// {x, y, z} rotation about ANATOMICAL axes expressed in the parent segment's
// bind-pose frame. For this rig (standing, facing +Z, left side = +X, all bind
// rotations identity) those axes coincide with world axes at bind pose:
//   X = mediolateral   -> sagittal-plane motion (flexion / extension, tilt)
//   Z = anteroposterior -> frontal-plane motion (side bending, abduction)
//   Y = vertical        -> axial rotation
// Signs were derived once from the rig's geometry (see README) — e.g. a thigh
// pointing -Y swings toward +Z (flexion) under a NEGATIVE rotation about X,
// while a spine segment pointing +Y flexes forward under a POSITIVE one.
// ---------------------------------------------------------------------------
export const J = {
  hipFlex: (d) => ({ x: -d }),
  hipExt: (d) => ({ x: d }),
  kneeFlex: (d) => ({ x: d }),
  ankleDorsi: (d) => ({ x: -d }),
  anklePlantar: (d) => ({ x: d }),
  spineFlex: (d) => ({ x: d }),
  spineExt: (d) => ({ x: -d }),
  pelvisPostTilt: (d) => ({ x: -d }),
  pelvisAntTilt: (d) => ({ x: d }),
  sideBendL: (d) => ({ z: -d }),
  sideBendR: (d) => ({ z: d }),
  armDownL: (d) => ({ z: -d }),
  armDownR: (d) => ({ z: d }),
  armFwdL: (d) => ({ y: -d }),
  armFwdR: (d) => ({ y: d }),
  elbowFlexL: (d) => ({ y: -d }),
  elbowFlexR: (d) => ({ y: d }),
}

export function add(...parts) {
  const out = { x: 0, y: 0, z: 0 }
  for (const p of parts) {
    if (!p) continue
    out.x += p.x || 0
    out.y += p.y || 0
    out.z += p.z || 0
  }
  return out
}

const DEG = Math.PI / 180

// Captures the bind pose ONCE (before anything mutates the skeleton) and
// applies poses as deltas from it, so nothing can accumulate frame to frame
// or leak from one demo to the next.
export function createRig(root) {
  root.updateWorldMatrix(true, true)
  const bones = {}
  root.traverse((o) => {
    if (o.isBone) bones[o.name] = o
  })

  const bind = new Map()
  for (const bone of Object.values(bones)) {
    const pw = new THREE.Quaternion()
    if (bone.parent) bone.parent.getWorldQuaternion(pw)
    bind.set(bone, {
      q: bone.quaternion.clone(),
      p: bone.position.clone(),
      pw, // parent's world rotation at bind
      pwInv: pw.clone().invert(),
    })
  }

  const _d = new THREE.Quaternion()
  const _e = new THREE.Euler()

  // pose: { [boneName]: {x, y, z} } degrees, see J above.
  function apply(pose) {
    for (const [bone, b] of bind) {
      bone.quaternion.copy(b.q)
      bone.position.copy(b.p)
    }
    for (const name in pose) {
      const bone = bones[name]
      if (!bone) continue
      const r = pose[name]
      const b = bind.get(bone)
      _e.set((r.x || 0) * DEG, (r.y || 0) * DEG, (r.z || 0) * DEG, 'XYZ')
      _d.setFromEuler(_e)
      // A delta D about the parent's bind-frame axes becomes, in the bone's
      // local frame: L' = P⁻¹ · D · P · L_bind   (P = parent world rotation at bind)
      bone.quaternion.copy(b.pwInv).multiply(_d).multiply(b.pw).multiply(b.q)
    }
  }

  return { root, bones, apply }
}

// Exponential smoothing of the current pose toward the target pose, per axis.
// Bones that leave the target relax back to 0 and are dropped once settled.
const ZERO = { x: 0, y: 0, z: 0 }
export function smoothPose(current, target, alpha) {
  for (const k in target) if (!current[k]) current[k] = { x: 0, y: 0, z: 0 }
  for (const k in current) {
    const c = current[k]
    const t = target[k] || ZERO
    c.x += ((t.x || 0) - c.x) * alpha
    c.y += ((t.y || 0) - c.y) * alpha
    c.z += ((t.z || 0) - c.z) * alpha
    if (!target[k] && Math.abs(c.x) + Math.abs(c.y) + Math.abs(c.z) < 0.01) delete current[k]
  }
}

// Keeps the chosen foot (or the midpoint of both) exactly where it was in the
// bind pose by translating the whole character — pelvic tilt and spine motion
// then read as the trunk moving over a planted foot instead of the feet
// sliding around.
const _a = new THREE.Vector3()
const _b = new THREE.Vector3()
const _now = new THREE.Vector3()
const _ref = new THREE.Vector3()
export function plantFeet(container, rig, mode, bindFeet) {
  container.position.set(0, 0, 0)
  if (!mode || !bindFeet) return
  container.updateWorldMatrix(true, true)
  if (mode === 'both') {
    _now.addVectors(
      rig.bones[B.lFoot].getWorldPosition(_a),
      rig.bones[B.rFoot].getWorldPosition(_b),
    ).multiplyScalar(0.5)
    _ref.addVectors(bindFeet.left, bindFeet.right).multiplyScalar(0.5)
  } else {
    const left = mode === 'left'
    _now.copy(rig.bones[left ? B.lFoot : B.rFoot].getWorldPosition(_a))
    _ref.copy(left ? bindFeet.left : bindFeet.right)
  }
  container.position.copy(_ref).sub(_now)
}
