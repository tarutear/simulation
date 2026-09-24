import { useEffect } from 'react'
import { store, useAppState } from '../state/store'
import { STANDING } from '../three/poses'

const MODES = [
  {
    id: 'overlay',
    title: '표면 오버레이 — 정점 마스크',
    desc: '피부 정점의 skin weight(어느 뼈에 속하는지)와 바인드 위치로 L5 영역을 계산해 두 번째 SkinnedMesh로 그립니다. 피부에 딱 붙고 자세를 바꿔도 따라옵니다.',
  },
  {
    id: 'decal',
    title: '데칼 — 뼈에 붙인 별도 메시',
    desc: '캡슐·상자 프리미티브를 정강이뼈·발뼈에 자식으로 붙입니다. 10줄이면 되지만 피부 위에 떠 있고 위치를 손으로 맞춰야 합니다.',
  },
  { id: 'off', title: '끄기', desc: '' },
]

export function Demo4Dermatome() {
  const mode = useAppState((s) => s.dermatome)

  useEffect(() => {
    store.setState((s) => ({
      demo: 'dermatome',
      pose: STANDING,
      plant: 'both',
      camera: 'lowerLeg',
      demoCamera: 'lowerLeg',
      cameraNonce: s.cameraNonce + 1,
      guides: false,
      dermatome: 'overlay',
      animation: null,
    }))
    return () => store.setState({ dermatome: 'off' })
  }, [])

  return (
    <>
      <p className="eyebrow">Demo 04</p>
      <h1>신체 부위 하이라이트 — L5 피부분절</h1>
      <p className="lead">
        좌측 종아리 외측에서 발등, 엄지~셋째 발가락까지의 L5 피부분절 영역을 색으로 표시합니다. 두 가지 방식을
        모두 구현해 두었으니 전환해서 비교해 보세요.
      </p>

      <div className="radio-list" role="radiogroup" aria-label="하이라이트 방식">
        {MODES.map((m) => (
          <label key={m.id} className={mode === m.id ? 'active' : ''}>
            <input
              type="radio"
              name="dermatome"
              value={m.id}
              checked={mode === m.id}
              onChange={() => store.setState({ dermatome: m.id })}
            />
            <span>
              <span className="radio-title">{m.title}</span>
              {m.desc && <span className="radio-desc"> {m.desc}</span>}
            </span>
          </label>
        ))}
      </div>

      <p className="note">
        결론: 더 간단한 쪽은 <strong>데칼</strong>(코드 ~15줄)이지만 결과물은 <strong>표면 오버레이</strong>(~60줄)가 압도적으로
        낫습니다. 오버레이는 UV 맵이나 텍스처 편집 없이도 skin weight만으로 영역을 정하기 때문에, 텍스처
        오버레이 방식의 장점(피부에 밀착)을 텍스처 작업 없이 얻습니다.
      </p>

      <details className="impl-note">
        <summary>구현 메모</summary>
        <ul>
          <li>
            오버레이: 원본 <code>Body</code> 지오메트리를 복제해 RGBA 정점 색(alpha = 소속도)을 넣고, 같은
            스켈레톤에 <code>bind()</code>한 두 번째 SkinnedMesh를 <code>MeshBasicMaterial(vertexColors, transparent)</code>로
            그립니다. 소속도 = 정강이 뼈 weight × 외측 각도 창 × 높이 창, 발등 = 발 뼈 weight × 발 축 위쪽 × 내측
            발가락.
          </li>
          <li>진짜 텍스처 페인팅(UV 기반)은 이 모델에 UV/텍스처가 없어 시도하지 않았고, 필요도 없었습니다.</li>
          <li>
            three.js의 <code>DecalGeometry</code>(투영 데칼)는 스킨 변형을 따라가지 않아 정적 메시에만 맞습니다 —
            여기서는 뼈에 붙인 프리미티브로 대신했습니다.
          </li>
        </ul>
      </details>
    </>
  )
}
