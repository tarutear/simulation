import { B, J, add } from './rig'

export const smoothstep = (a, b, x) => {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)))
  return t * t * (3 - 2 * t)
}
const lerp = (a, b, w) => a + (b - a) * w

// The rig is bound in a T-pose (arms straight out), which no patient stands
// in. Every demo starts from this relaxed standing base instead.
export const RELAXED_ARMS = {
  [B.lArm]: add(J.armDownL(72), J.armFwdL(5)),
  [B.rArm]: add(J.armDownR(72), J.armFwdR(5)),
  [B.lForeArm]: J.elbowFlexL(14),
  [B.rForeArm]: J.elbowFlexR(14),
}

export const STANDING = { ...RELAXED_ARMS }

// ---------------------------------------------------------------------------
// Demo 2 — standing left hip flexion (knee lift) with lumbar compensation.
//   t: 0..1 flexion progress (slider)
//   w: 0 = normal pattern, 1 = compensated pattern (blend)
// Both patterns raise the thigh to the same apparent height. The normal
// pattern does it all at the hip. The compensated pattern posteriorly tilts
// the pelvis and flexes the lumbar spine EARLY in the range, so part of the
// apparent thigh elevation comes from the pelvis and the true femur-on-pelvis
// flexion is smaller. The stance (right) leg counter-rotates by the pelvic
// tilt so it stays vertical over the planted foot.
// ---------------------------------------------------------------------------
export function hipFlexionPose(t, w) {
  const thigh = 95 * t // apparent thigh elevation from vertical
  const tiltC = 25 * smoothstep(0.05, 0.8, t) // posterior pelvic tilt (compensated)
  const lumbarC = 32 * smoothstep(0.05, 0.85, t) // lumbar flexion (compensated)
  const tilt = lerp(0, tiltC, w)
  const lumbar = lerp(0, lumbarC, w)
  const hip = thigh - tilt // true hip (femur-on-pelvis) flexion
  const knee = 90 * t

  const pose = {
    ...RELAXED_ARMS,
    [B.hips]: J.pelvisPostTilt(tilt),
    [B.rUpLeg]: J.hipExt(tilt), // stance leg stays vertical under the tilted pelvis
    [B.lUpLeg]: J.hipFlex(hip),
    [B.lLeg]: J.kneeFlex(knee),
    [B.lFoot]: J.ankleDorsi(8 * t),
    [B.spine]: J.spineFlex(lumbar * 0.6),
    [B.spine1]: J.spineFlex(lumbar * 0.4),
    [B.spine2]: J.spineExt(lumbar * 0.2), // upper trunk / gaze stay level
    [B.neck]: J.spineExt(lumbar * 0.15),
  }
  return { pose, readout: { thigh, hip, tilt, lumbar, knee } }
}

// ---------------------------------------------------------------------------
// Demo 3 — static posture.
// ---------------------------------------------------------------------------
export const POSTURE_NORMAL = {
  ...RELAXED_ARMS,
  [B.spine]: J.spineExt(3), // a hint of normal lumbar lordosis
  [B.spine1]: J.spineExt(1),
  [B.spine2]: J.spineFlex(3),
  [B.neck]: J.spineFlex(1),
}

// Left lateral trunk shift ("list"): lumbar side-bends left, the thoracic and
// cervical segments side-bend back to the right so the head stays vertical —
// the shoulders end up translated left of the pelvis. Lumbar lordosis is
// reduced by a little posterior pelvic tilt plus lumbar flexion.
export const POSTURE_LIST_LEFT = {
  ...RELAXED_ARMS,
  [B.hips]: J.pelvisPostTilt(6),
  [B.lUpLeg]: J.hipExt(6),
  [B.rUpLeg]: J.hipExt(6),
  [B.spine]: add(J.spineFlex(6), J.sideBendL(11)),
  [B.spine1]: add(J.spineFlex(3), J.sideBendL(7)),
  [B.spine2]: add(J.spineExt(2), J.sideBendR(9)),
  [B.neck]: J.sideBendR(6),
  [B.head]: J.sideBendR(3),
}

export const POSTURE_LIST_READOUT = [
  ['요추 측굴 (좌)', '11° + 7°'],
  ['흉추 측굴 (우, 보상)', '9°'],
  ['경추 측굴 (우, 보상)', '6° + 3°'],
  ['골반 후방경사', '6°'],
  ['요추 굴곡 (전만 감소)', '6° + 3°'],
]
