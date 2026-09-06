import { useState, useRef, useEffect } from 'react'
import { useGLTF } from '@react-three/drei'
import SceneCanvas from '../three/SceneCanvas'
import { BONES, captureRestPose, applyBlendedPose, deg } from '../three/bonePose'

const POSE_BONES = [BONES.pelvis, BONES.lumbar, BONES.thoracic, BONES.hipL, BONES.hipR]

// Two joint-angle profiles, each expressed as a function of flexion progress t (0-1).
// The slider itself is also used as the slerp blend weight between them, so the
// compensation share visibly grows the further the "hip flexion" is pushed -
// this is the exact behaviour the spike needed to validate: can a single
// rigged glTF skeleton be pose-blended smoothly with plain quaternion slerp.
function normalPose(t) {
  const hip = -deg(90) * t
  return {
    [BONES.hipL]: [hip, 0, 0],
    [BONES.hipR]: [hip, 0, 0],
    [BONES.lumbar]: [0, 0, 0],
    [BONES.thoracic]: [0, 0, 0],
    [BONES.pelvis]: [0, 0, 0],
  }
}

function compensatedPose(t) {
  const hip = -deg(45) * t
  const lumbar = -deg(35) * t
  const thoracic = -deg(12) * t
  const pelvisTilt = deg(18) * t
  return {
    [BONES.hipL]: [hip, 0, 0],
    [BONES.hipR]: [hip, 0, 0],
    [BONES.lumbar]: [lumbar, 0, 0],
    [BONES.thoracic]: [thoracic, 0, 0],
    [BONES.pelvis]: [pelvisTilt, 0, 0],
  }
}

function PosedModel({ t }) {
  const { scene, nodes } = useGLTF('/models/CesiumMan.glb')
  const restRef = useRef(null)

  useEffect(() => {
    restRef.current = captureRestPose(nodes, POSE_BONES)
  }, [nodes])

  if (restRef.current) {
    applyBlendedPose(nodes, restRef.current, normalPose(t), compensatedPose(t), t)
  }

  return <primitive object={scene} />
}

export default function Demo2HipLumbar() {
  const [value, setValue] = useState(40)
  const t = value / 100

  let label = '정상 패턴'
  if (t > 0.66) label = '뚜렷한 요추 보상'
  else if (t > 0.33) label = '경도 요추 보상 시작'

  return (
    <div className="demo">
      <div className="demo-info">
        <h2>데모 2 · 고관절 굴곡 - 요추 보상 패턴</h2>
        <p>
          슬라이더가 고관절 굴곡 진행도(0~100)와 동시에 정상↔보상 포즈의
          블렌드 가중치로 쓰입니다. 각 본의 목표 회전을 오일러 → 쿼터니언으로
          변환한 뒤 <code>Quaternion.slerp</code>로 두 포즈를 보간하고, 그
          결과를 bind pose 기준 델타로 적용합니다.
        </p>
        <label className="slider-row">
          고관절 굴곡 각도
          <input
            type="range"
            min={0}
            max={100}
            value={value}
            onChange={(e) => setValue(Number(e.target.value))}
          />
          <span>{value}</span>
        </label>
        <div className={`badge ${t > 0.66 ? 'bad' : t > 0.33 ? 'warn' : 'ok'}`}>
          {label}
        </div>
        <ul className="legend">
          <li>고관절(양측): 정상 최대 -90°→ 보상 시 최대 -45°만 기여</li>
          <li>요추: 정상 0° 유지 → 보상 시 최대 -35° 굴곡</li>
          <li>골반: 정상 0° → 보상 시 최대 18° 후방경사</li>
        </ul>
      </div>
      <SceneCanvas>
        <PosedModel t={t} />
      </SceneCanvas>
    </div>
  )
}

useGLTF.preload('/models/CesiumMan.glb')
