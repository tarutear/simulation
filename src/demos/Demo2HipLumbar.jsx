import { useEffect, useState } from 'react'
import { store } from '../state/store'
import { hipFlexionPose } from '../three/poses'

const fmt = (v) => `${Math.round(v)}°`

export function Demo2HipLumbar() {
  const [flex, setFlex] = useState(60)
  const [blend, setBlend] = useState(100)
  const [playing, setPlaying] = useState(false)

  useEffect(() => {
    store.setState((s) => ({
      demo: 'hip',
      plant: 'right', // stance foot stays on the floor while the left leg lifts
      camera: 'left',
      demoCamera: 'left',
      cameraNonce: s.cameraNonce + 1,
      guides: false,
      dermatome: 'off',
      animation: null,
    }))
  }, [])

  const t = flex / 100
  const w = blend / 100
  const { pose, readout } = hipFlexionPose(t, w)

  useEffect(() => {
    store.setState({ pose })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [flex, blend])

  // "재생": sweeps the flexion slider 0 → 100 → 0 every 4 s
  useEffect(() => {
    if (!playing) return
    const start = performance.now()
    let raf = 0
    const tick = (now) => {
      const s = ((now - start) / 2000) % 2
      setFlex(Math.round((s < 1 ? s : 2 - s) * 100))
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [playing])

  const status =
    readout.tilt < 4
      ? { cls: 'ok', text: '고관절 단독 움직임 — 요추 중립 유지' }
      : readout.tilt < 12
        ? { cls: 'warn', text: '경도 보상 — 골반 후방경사 시작' }
        : { cls: 'bad', text: '뚜렷한 보상 — 골반 후방경사 + 요추 굴곡' }

  return (
    <>
      <p className="eyebrow">Demo 02 · 핵심</p>
      <h1>고관절 굴곡 – 요추 보상 패턴</h1>
      <p className="lead">
        선 자세에서 왼쪽 무릎을 들어 올리는 고관절 굴곡입니다. 정상 패턴은 움직임이 고관절에서만 일어나고
        요추는 중립을 유지합니다. 보상 패턴은 굴곡이 진행되면서 골반이 후방경사되고 요추가 먼저 굴곡되기
        시작해, 대퇴가 같은 높이까지 올라가도 실제 고관절 굴곡은 그만큼 작습니다.
      </p>

      <div className="field">
        <div className="field-label">
          <label htmlFor="flex">고관절 굴곡 진행</label>
          <span className="value">{flex} / 100</span>
        </div>
        <input id="flex" type="range" min={0} max={100} value={flex} onChange={(e) => setFlex(Number(e.target.value))} />
      </div>
      <div className="btn-row">
        <button type="button" className="btn" onClick={() => setPlaying((p) => !p)}>
          {playing ? '■ 정지' : '▶ 반복 재생'}
        </button>
        <button type="button" className="btn" onClick={() => setFlex(0)}>
          0으로
        </button>
      </div>

      <div className="field">
        <div className="field-label">
          <span>패턴</span>
        </div>
        <div className="segmented" role="group" aria-label="패턴 선택">
          <button type="button" className={blend === 0 ? 'active' : ''} onClick={() => setBlend(0)}>
            정상 — 고관절 단독
          </button>
          <button type="button" className={blend === 100 ? 'active' : ''} onClick={() => setBlend(100)}>
            보상 — 골반·요추 개입
          </button>
        </div>
      </div>
      <div className="field">
        <div className="field-label">
          <label htmlFor="blend">두 패턴 블렌딩 (보상 정도)</label>
          <span className="value">{blend}%</span>
        </div>
        <input id="blend" type="range" min={0} max={100} value={blend} onChange={(e) => setBlend(Number(e.target.value))} />
      </div>

      <div className={`badge ${status.cls}`}>{status.text}</div>

      <dl className="readout">
        <dt>대퇴 거상각 (겉보기)</dt>
        <dd>{fmt(readout.thigh)}</dd>
        <dt>고관절 굴곡 (대퇴–골반)</dt>
        <dd>{fmt(readout.hip)}</dd>
        <dt>골반 후방경사</dt>
        <dd>{fmt(readout.tilt)}</dd>
        <dt>요추 굴곡</dt>
        <dd>{fmt(readout.lumbar)}</dd>
        <dt>무릎 굴곡</dt>
        <dd>{fmt(readout.knee)}</dd>
      </dl>

      <p className="note">
        측면(좌측면) 시점에서 보세요. 보상 패턴에서는 골반이 뒤로 말리고 허리가 둥글어지며, 지지하는
        오른발은 바닥에 고정된 채 상체가 그 위에서 움직입니다. 블렌딩 슬라이더로 두 패턴 사이의 중간
        정도(경도 보상)도 만들 수 있습니다.
      </p>

      <details className="impl-note">
        <summary>구현 메모 — 포즈 블렌딩</summary>
        <ul>
          <li>
            각 패턴은 진행도 t의 함수로 정의한 관절각 세트입니다(고관절·무릎·골반경사·요추 2분절·흉추). 두
            세트를 보상 정도 w로 선형 보간하면 그것이 곧 포즈 블렌딩입니다.
          </li>
          <li>
            관절각은 부모 분절의 해부학적 축(X 시상면, Z 관상면) 기준 델타로 두고, 바인드 포즈에 곱해서
            적용합니다 — 매 프레임 바인드 포즈에서 다시 계산하므로 값이 누적되거나 탭 간에 새지 않습니다.
          </li>
          <li>
            골반 후방경사 시 지지 다리는 같은 각도만큼 고관절 신전으로 역보정하고, 지지 발 위치는 바인드 위치에
            고정(planting)합니다.
          </li>
          <li>목표 포즈로의 이동은 지수 평활(초당 9)로 부드럽게 처리합니다.</li>
        </ul>
      </details>
    </>
  )
}
