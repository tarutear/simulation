import { useGLTF } from '@react-three/drei'
import SceneCanvas from '../three/SceneCanvas'

function CesiumMan() {
  const { scene } = useGLTF('/models/CesiumMan.glb')
  return <primitive object={scene} position={[0, 0, 0]} />
}

export default function Demo1Viewer() {
  return (
    <div className="demo">
      <div className="demo-info">
        <h2>데모 1 · 기본 뷰어</h2>
        <p>
          리깅된 인체 모델(CesiumMan, glTF Sample Assets)을 로드하고
          OrbitControls로 회전/줌. 데스크톱: 드래그 회전, 휠 줌. 모바일: 한
          손가락 드래그로 회전, 두 손가락 핀치로 줌/팬 (three.js
          OrbitControls 기본 터치 매핑, 별도 구현 불필요).
        </p>
      </div>
      <SceneCanvas>
        <CesiumMan />
      </SceneCanvas>
    </div>
  )
}

useGLTF.preload('/models/CesiumMan.glb')
