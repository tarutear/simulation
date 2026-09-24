import { useEffect } from 'react'
import { store } from '../state/store'
import { STANDING } from '../three/poses'
import { MODEL_INFO } from '../three/model'

export function Demo1Viewer() {
  useEffect(() => {
    store.setState((s) => ({
      demo: 'viewer',
      pose: STANDING,
      plant: 'both',
      camera: 'threeQuarter',
      demoCamera: 'threeQuarter',
      cameraNonce: s.cameraNonce + 1,
      guides: false,
      dermatome: 'off',
      animation: null,
    }))
    return () => store.setState({ animation: null })
  }, [])

  return (
    <>
      <p className="eyebrow">Demo 01</p>
      <h1>기본 뷰어</h1>
      <p className="lead">
        리깅된 인체 모델을 불러와 회전·줌으로 살펴봅니다. 뷰 왼쪽 위의 시점 버튼으로 정면·측면·후면을
        바로 바꿀 수 있고, 데스크톱은 드래그/휠, 모바일은 한 손가락 회전·두 손가락 핀치 줌이 별도
        구현 없이 동작합니다.
      </p>


      <dl className="readout">
        <dt>모델</dt>
        <dd>{MODEL_INFO.name} — CC0</dd>
        <dt>본(뼈대)</dt>
        <dd>{MODEL_INFO.bones}개 · root / spine05→spine01(5분절) / neck01→03 / head + 사지·손가락·발가락·얼굴</dd>
        <dt>삼각형</dt>
        <dd>{MODEL_INFO.triangles.toLocaleString()}개</dd>
        <dt>파일</dt>
        <dd>{MODEL_INFO.size} · glTF-Binary, 텍스처 없음</dd>
        <dt>출처</dt>
        <dd>{MODEL_INFO.source}</dd>
      </dl>

      <details className="impl-note">
        <summary>구현 메모</summary>
        <ul>
          <li>
            <code>useGLTF</code> + <code>&lt;primitive&gt;</code>로 로드. 캔버스는 앱에서 하나만 두고 탭은 패널과
            포즈·카메라 상태만 바꿉니다(WebGL 컨텍스트 재생성 없음).
          </li>
          <li>바인드 자세가 A-pose(팔 약 40° 벌림)라 어깨 관절을 34° 내려, 팔꿈치를 34° 펴서 기립 자세를 기본으로 씁니다.</li>
          <li>
            카메라는 drei <code>CameraControls</code>(camera-controls) — 시점 프리셋은 <code>setLookAt()</code>으로
            부드럽게 이동.
          </li>
        </ul>
      </details>
    </>
  )
}
