import { useState, useEffect, useRef } from 'react'
import * as THREE from 'three'
import { useGLTF } from '@react-three/drei'
import SceneCanvas from '../three/SceneCanvas'
import { BONES } from '../three/bonePose'

const HIGHLIGHT_COLOR = '#ff5a36'

// Decal-mesh approach: small extra meshes parented directly onto the
// existing skeleton bones (Bone extends Object3D, so bone.add(mesh) just
// works and the highlight rides along with any pose/animation for free).
// Tried first because it needs zero knowledge of the base mesh's UV layout -
// see the report for why this beat a texture-overlay attempt.
function DermatomeHighlight({ visible }) {
  const { scene, nodes } = useGLTF('/models/CesiumMan.glb')
  const groupsRef = useRef([])

  useEffect(() => {
    const shin = nodes[BONES.kneeL]
    const foot = nodes[BONES.ankleL]
    if (!shin || !foot) return

    const material = new THREE.MeshBasicMaterial({
      color: HIGHLIGHT_COLOR,
      transparent: true,
      opacity: 0.55,
      depthTest: true,
    })

    // Lateral shin (outer lower leg): capsule hugging the outside of the shin bone.
    const shinGeo = new THREE.CapsuleGeometry(0.05, 0.22, 4, 8)
    const shinMesh = new THREE.Mesh(shinGeo, material)
    shinMesh.position.set(0.07, -0.14, 0.02)
    shinMesh.rotation.z = Math.PI / 2
    shin.add(shinMesh)

    // Dorsum of foot: flattened box over the top of the foot bone.
    const footGeo = new THREE.BoxGeometry(0.08, 0.22, 0.09)
    const footMesh = new THREE.Mesh(footGeo, material.clone())
    footMesh.position.set(0.02, -0.08, 0.02)
    foot.add(footMesh)

    groupsRef.current = [
      { bone: shin, mesh: shinMesh, geo: shinGeo },
      { bone: foot, mesh: footMesh, geo: footGeo },
    ]

    return () => {
      groupsRef.current.forEach(({ bone, mesh, geo }) => {
        bone.remove(mesh)
        geo.dispose()
        mesh.material.dispose()
      })
      groupsRef.current = []
    }
  }, [nodes])

  useEffect(() => {
    groupsRef.current.forEach(({ mesh }) => {
      mesh.visible = visible
    })
  }, [visible])

  return <primitive object={scene} />
}

export default function Demo4Dermatome() {
  const [visible, setVisible] = useState(true)

  return (
    <div className="demo">
      <div className="demo-info">
        <h2>데모 4 · 신체 부위 하이라이트 (L5 피부분절)</h2>
        <p>
          좌측 종아리 외측 ~ 발등 영역을 별도의 반투명 메시(decal 방식)로
          하이라이트. 이 메시들은 <code>bone.add(mesh)</code>로 기존 스켈레톤
          본에 직접 자식으로 붙어있어, 향후 포즈/애니메이션이 바뀌어도 같이
          따라 움직입니다.
        </p>
        <button className="toggle-btn" onClick={() => setVisible((v) => !v)}>
          {visible ? '하이라이트 끄기' : '하이라이트 켜기'}
        </button>
        <div className="badge warn">텍스처 오버레이 vs 데칼 메시 비교는 리포트 참고</div>
      </div>
      <SceneCanvas cameraPosition={[0.55, 0.55, 1.3]} target={[0.1, 0.35, 0]}>
        <DermatomeHighlight visible={visible} />
      </SceneCanvas>
    </div>
  )
}

useGLTF.preload('/models/CesiumMan.glb')
