import { useState, useRef, useEffect } from 'react'
import { useFrame } from '@react-three/fiber'
import { useGLTF } from '@react-three/drei'
import SceneCanvas from '../three/SceneCanvas'
import { BONES, captureRestPose, applyBlendedPose, deg } from '../three/bonePose'

const POSE_BONES = [BONES.pelvis, BONES.lumbar, BONES.thoracic]

// Normal standing: slight lumbar extension (normal lordosis), trunk vertical.
const NEUTRAL_POSE = {
  [BONES.pelvis]: [0, 0, 0],
  [BONES.lumbar]: [deg(6), 0, 0],
  [BONES.thoracic]: [0, 0, 0],
}

// Left lateral trunk shift (list) + reduced lumbar lordosis: side-bend the
// lumbar/thoracic segments toward the left (+Z here) and remove the normal
// lumbar extension.
const LIST_POSTURE_POSE = {
  [BONES.pelvis]: [0, 0, 0],
  [BONES.lumbar]: [deg(-4), 0, deg(22)],
  [BONES.thoracic]: [0, 0, deg(16)],
}

function PosedModel({ target }) {
  const { scene, nodes } = useGLTF('/models/CesiumMan.glb')
  const restRef = useRef(null)
  const blendRef = useRef(0)

  useEffect(() => {
    restRef.current = captureRestPose(nodes, POSE_BONES)
  }, [nodes])

  useFrame((_, delta) => {
    if (!restRef.current) return
    const goal = target ? 1 : 0
    blendRef.current += (goal - blendRef.current) * Math.min(1, delta * 6)
    applyBlendedPose(nodes, restRef.current, NEUTRAL_POSE, LIST_POSTURE_POSE, blendRef.current)
  })

  return <primitive object={scene} />
}

export default function Demo3StaticPosture() {
  const [showPosture, setShowPosture] = useState(true)

  return (
    <div className="demo">
      <div className="demo-info">
        <h2>데모 3 · 정적 자세 하이라이트</h2>
        <p>
          "좌측 체간 측방 편위(list) + 요추 전만 감소" 자세를 고정 포즈로
          세팅하고, 정상 자세와 토글 비교. 전환 시 부드러운 보간(스프링 형태)이
          적용되어 있어 두 자세 사이 전이도 자연스럽게 확인 가능합니다.
        </p>
        <button className="toggle-btn" onClick={() => setShowPosture((v) => !v)}>
          {showPosture ? '정상 자세로 전환' : '보상 자세(list)로 전환'}
        </button>
        <div className={`badge ${showPosture ? 'bad' : 'ok'}`}>
          {showPosture ? '좌측 체간 측방 편위 + 요추 전만 감소' : '정상 자세'}
        </div>
      </div>
      <SceneCanvas>
        <PosedModel target={showPosture} />
      </SceneCanvas>
    </div>
  )
}

useGLTF.preload('/models/CesiumMan.glb')
