import { useEffect, useState } from 'react'
import { store } from '../state/store'
import { POSTURE_LIST_LEFT, POSTURE_LIST_READOUT, POSTURE_NORMAL } from '../three/poses'

export function Demo3Posture() {
  const [list, setList] = useState(true)
  const [guides, setGuides] = useState(true)

  useEffect(() => {
    store.setState((s) => ({
      demo: 'posture',
      plant: 'both',
      camera: 'back', // therapist's view: standing behind the patient
      demoCamera: 'back',
      cameraNonce: s.cameraNonce + 1,
      dermatome: 'off',
      animation: null,
    }))
    return () => store.setState({ guides: false })
  }, [])

  useEffect(() => {
    store.setState({ pose: list ? POSTURE_LIST_LEFT : POSTURE_NORMAL })
  }, [list])

  useEffect(() => {
    store.setState({ guides })
  }, [guides])

  return (
    <>
      <p className="eyebrow">Demo 03</p>
      <h1>정적 자세 하이라이트</h1>
      <p className="lead">
        "좌측 체간 측방 편위(lateral list) + 요추 전만 감소" 자세를 고정 포즈로 만들어 정상 자세와 토글
        비교합니다. 기본 시점은 후면 — 치료사가 환자 뒤에 서서 보는 시점이라 환자의 왼쪽이 화면 왼쪽입니다.
      </p>

      <div className="field">
        <div className="segmented" role="group" aria-label="자세 선택">
          <button type="button" className={!list ? 'active' : ''} onClick={() => setList(false)}>
            정상 자세
          </button>
          <button type="button" className={list ? 'active' : ''} onClick={() => setList(true)}>
            좌측 편위 + 전만 감소
          </button>
        </div>
      </div>

      <label className="checkbox">
        <input type="checkbox" checked={guides} onChange={(e) => setGuides(e.target.checked)} />
        가이드 라인 표시 — 추선(plumb line), 어깨선, 골반선
      </label>

      <div className={`badge ${list ? 'bad' : 'ok'}`}>{list ? '좌측 체간 측방 편위 · 요추 전만 감소' : '정상 자세'}</div>

      {list && (
        <dl className="readout">
          {POSTURE_LIST_READOUT.map(([k, v]) => (
            <div key={k} style={{ display: 'contents' }}>
              <dt>{k}</dt>
              <dd>{v}</dd>
            </div>
          ))}
        </dl>
      )}

      <p className="note">
        편위 자세에서 어깨선의 중점이 추선에서 왼쪽으로 벗어나고 골반선은 추선 위에 남습니다 — 상부 흉추·경추가
        반대쪽으로 측굴해 머리는 수직을 유지하므로, 단순한 기울임이 아니라 몸통이 옆으로 "이동"한 형태가
        됩니다.
      </p>

      <details className="impl-note">
        <summary>구현 메모</summary>
        <ul>
          <li>
            포즈는 관절각 상수 하나(<code>POSTURE_LIST_LEFT</code>)입니다. 요추 좌측굴 + 흉추·경추 우측굴로 상쇄해
            머리를 수직으로 두는 것이 "list"의 핵심이고, 전만 감소는 골반 후방경사 6° + 요추 굴곡 9°로 표현했습니다.
          </li>
          <li>토글 전환은 데모 2와 같은 평활 보간을 그대로 쓰므로 두 자세 사이가 애니메이션됩니다.</li>
          <li>가이드 라인은 매 프레임 본 월드 좌표에서 그립니다(drei <code>Line</code>, 깊이 테스트 끔).</li>
        </ul>
      </details>
    </>
  )
}
