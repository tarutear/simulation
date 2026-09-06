import { useGLTF } from '@react-three/drei'
import SceneCanvas from '../three/SceneCanvas'
import { MODEL_URL, MODEL_CREDIT } from '../three/model'

function Model() {
  const { scene } = useGLTF(MODEL_URL)
  // VRM avatars are authored facing -Z; rotate to face the camera (+Z).
  return <primitive object={scene} position={[0, 0, 0]} rotation={[0, Math.PI, 0]} />
}

export default function Demo1Viewer() {
  return (
    <div className="demo">
      <div className="demo-info">
        <h2>데모 1 · 기본 뷰어</h2>
        <p>
          리깅된 인체 모델({MODEL_CREDIT})을 로드하고 OrbitControls로 회전/줌.
          데스크톱: 드래그 회전, 휠 줌. 모바일: 한 손가락 드래그로 회전, 두
          손가락 핀치로 줌/팬 (three.js OrbitControls 기본 터치 매핑, 별도
          구현 불필요).
        </p>
      </div>
      <SceneCanvas>
        <Model />
      </SceneCanvas>
    </div>
  )
}

useGLTF.preload(MODEL_URL)
