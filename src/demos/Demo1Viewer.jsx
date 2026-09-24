import { useEffect } from 'react'
import { store, useAppState } from '../state/store'
import { STANDING } from '../three/poses'
import { MODEL_INFO } from '../three/model'

const CLIPS = [
  ['', '없음 — 포즈 제어 사용'],
  ['idle', 'idle · 대기'],
  ['walk', 'walk · 걷기'],
  ['run', 'run · 달리기'],
]

export function Demo1Viewer() {
  const animation = useAppState((s) => s.animation)

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

      <div className="field">
        <label className="field-label" htmlFor="clip">
          리깅 애니메이션 재생
        </label>
        <select id="clip" value={animation || ''} onChange={(e) => store.setState({ animation: e.target.value || null })}>
          {CLIPS.map(([v, l]) => (
            <option key={v} value={v}>
              {l}
            </option>
          ))}
        </select>
        <p className="help">
          모델에 포함된 Mixamo 클립을 <code>AnimationMixer</code>로 재생합니다 — 스켈레톤이 실제 애니메이션
          파이프라인에서 쓰이는 표준 리그라는 확인용입니다. 재생 중에는 포즈 제어가 잠시 꺼집니다.
        </p>
      </div>

      <dl className="readout">
        <dt>모델</dt>
        <dd>{MODEL_INFO.name} (Adobe Mixamo)</dd>
        <dt>본(뼈대)</dt>
        <dd>{MODEL_INFO.bones}개 · Hips / Spine·Spine1·Spine2 / Neck / Head + 사지·손가락</dd>
        <dt>삼각형</dt>
        <dd>{MODEL_INFO.triangles.toLocaleString()}개</dd>
        <dt>파일</dt>
        <dd>{MODEL_INFO.size} · glTF-Binary, 텍스처 없음</dd>
        <dt>클립</dt>
        <dd>{MODEL_INFO.clips.join(', ')}</dd>
      </dl>

      <details className="impl-note">
        <summary>구현 메모</summary>
        <ul>
          <li>
            <code>useGLTF</code> + <code>&lt;primitive&gt;</code>로 로드. 캔버스는 앱에서 하나만 두고 탭은 패널과
            포즈·카메라 상태만 바꿉니다(WebGL 컨텍스트 재생성 없음).
          </li>
          <li>바인드 자세가 T-pose라 어깨 관절을 72° 내려 기립 자세를 기본으로 씁니다.</li>
          <li>
            카메라는 drei <code>CameraControls</code>(camera-controls) — 시점 프리셋은 <code>setLookAt()</code>으로
            부드럽게 이동.
          </li>
        </ul>
      </details>
    </>
  )
}
