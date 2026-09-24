import { B, J, add, spread } from './rig'

export const smoothstep = (a, b, x) => {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)))
  return t * t * (3 - 2 * t)
}
const lerp = (a, b, w) => a + (b - a) * w

// Merges pose fragments; later entries add to earlier ones per bone.
function merge(...parts) {
  const out = {}
  for (const p of parts) for (const k in p) out[k] = add(out[k], p[k])
  return out
}

// MakeHuman's rest pose is an A-pose (arms ~40° out, elbows bent, palms in).
// Every demo starts from this relaxed standing base instead.
export const RELAXED_ARMS = {
  [B.lArm]: add(J.armDownL(34), J.armFwdL(3)),
  [B.rArm]: add(J.armDownR(34), J.armFwdR(3)),
  [B.lForeArm]: J.elbowFlexL(-34), // the rest pose already has ~45° of elbow flexion
  [B.rForeArm]: J.elbowFlexR(-34),
}

export const STANDING = { ...RELAXED_ARMS }

// How a regional angle is shared between motion segments (caudal → cranial).
// Rough proportions from segmental ROM data: lumbar flexion/extension is
// largest at L4–5 and L5–S1, lumbar side bending at L2–4, cervical motion at
// C4–6. Thoracic motion is spread evenly.
export const SEGMENT_W = {
  lumbarSagittal: [0.24, 0.24, 0.2, 0.17, 0.15], // L5 … L1
  lumbarFrontal: [0.12, 0.2, 0.24, 0.24, 0.2],
  cervical: [0.12, 0.17, 0.19, 0.17, 0.14, 0.11, 0.1], // C7 … C1
}
const lumbarFlex = (d) => spread(B.lumbar, J.spineFlex(d), SEGMENT_W.lumbarSagittal)
const lumbarExt = (d) => spread(B.lumbar, J.spineExt(d), SEGMENT_W.lumbarSagittal)
const lumbarSideBendL = (d) => spread(B.lumbar, J.sideBendL(d), SEGMENT_W.lumbarFrontal)
const thoracic = (rot) => spread(B.thoracic, rot)
const cervical = (rot) => spread(B.neck, rot, SEGMENT_W.cervical)

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

  const pose = merge(
    RELAXED_ARMS,
    {
      [B.hips]: J.pelvisPostTilt(tilt),
      [B.rUpLeg]: J.hipExt(tilt), // stance leg stays vertical under the tilted pelvis
      [B.lUpLeg]: J.hipFlex(hip),
      [B.lLeg]: J.kneeFlex(knee),
      [B.lFoot]: J.ankleDorsi(8 * t),
    },
    lumbarFlex(lumbar),
    thoracic(J.spineExt(lumbar * 0.2)), // upper trunk / gaze stay level
    cervical(J.spineExt(lumbar * 0.15)),
  )
  return { pose, readout: { thigh, hip, tilt, lumbar, knee } }
}

// ---------------------------------------------------------------------------
// Demo 3 — static posture.
// ---------------------------------------------------------------------------
export const POSTURE_NORMAL = merge(
  RELAXED_ARMS,
  lumbarExt(4), // a hint of normal lumbar lordosis
  thoracic(J.spineFlex(3)),
  cervical(J.spineFlex(1)),
)

// Left lateral trunk shift ("list"): lumbar side-bends left, the thoracic and
// cervical segments side-bend back to the right so the head stays vertical —
// the shoulders end up translated left of the pelvis. Lumbar lordosis is
// reduced by a little posterior pelvic tilt plus lumbar flexion.
export const POSTURE_LIST_LEFT = merge(
  RELAXED_ARMS,
  {
    [B.hips]: J.pelvisPostTilt(6),
    [B.lUpLeg]: J.hipExt(6),
    [B.rUpLeg]: J.hipExt(6),
  },
  lumbarFlex(9),
  lumbarSideBendL(18),
  thoracic(add(J.spineExt(2), J.sideBendR(9))),
  cervical(J.sideBendR(6)),
  { [B.head]: J.sideBendR(3) },
)

export const POSTURE_LIST_READOUT = [
  ['요추 측굴 (좌, L1–L5 합)', '18°'],
  ['흉추 측굴 (우, 보상, T1–T12 합)', '9°'],
  ['경추 측굴 (우, 보상, C1–C7 합) + 두부', '6° + 3°'],
  ['골반 후방경사', '6°'],
  ['요추 굴곡 (전만 감소, L1–L5 합)', '9°'],
]
