import { useEffect, useMemo, useState } from 'react'
import { store } from '../state/store'
import { STANDING, POSTURE_LIST_LEFT, POSTURE_NORMAL, hipFlexionPose } from '../three/poses'

const POSES = { standing: STANDING, listLeft: POSTURE_LIST_LEFT, normalPosture: POSTURE_NORMAL }

// Applies a step's scene preset to the shared 3D store.
function useScene(scene) {
  useEffect(() => {
    store.setState((s) => ({
      pose: POSES[scene.pose] ?? STANDING,
      plant: scene.plant ?? 'both',
      camera: scene.camera,
      demoCamera: scene.camera,
      cameraNonce: s.cameraNonce + 1,
      guides: Boolean(scene.guides),
      dermatome: scene.dermatome ?? 'off',
      animation: null,
    }))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scene])
}

// One or more multiple-choice findings for a step, submitted together.
function Questions({ step, answers, onAnswer, submitted, onSubmit }) {
  const complete = step.questions.every((q) => answers[q.id])
  return (
    <div className="questions">
      {step.questions.map((q) => (
        <fieldset key={q.id} className="question" disabled={submitted}>
          <legend>{q.prompt}</legend>
          <div className="radio-list">
            {q.options.map((o) => {
              const chosen = answers[q.id] === o.id
              const cls = ['option', chosen ? 'active' : '', submitted && o.id === q.answer ? 'correct' : '', submitted && chosen && o.id !== q.answer ? 'wrong' : '']
                .filter(Boolean)
                .join(' ')
              return (
                <label key={o.id} className={cls}>
                  <input type="radio" name={`${step.id}-${q.id}`} value={o.id} checked={chosen} onChange={() => onAnswer(q.id, o.id)} />
                  <span className="radio-title">{o.label}</span>
                </label>
              )
            })}
          </div>
        </fieldset>
      ))}
      {!submitted ? (
        <button type="button" className="btn primary" disabled={!complete} onClick={onSubmit}>
          소견 제출
        </button>
      ) : (
        <Feedback step={step} answers={answers} />
      )}
    </div>
  )
}

function Feedback({ step, answers }) {
  const allRight = step.questions.every((q) => answers[q.id] === q.answer)
  return (
    <div className={`feedback ${allRight ? 'ok' : 'bad'}`}>
      <div className="feedback-title">{allRight ? '정답입니다' : '다시 확인해 보세요'}</div>
      {!allRight && (
        <ul className="feedback-list">
          {step.questions
            .filter((q) => answers[q.id] !== q.answer)
            .map((q) => (
              <li key={q.id}>
                {q.prompt}: 정답은 <strong>{q.options.find((o) => o.id === q.answer).label}</strong>
              </li>
            ))}
        </ul>
      )}
      <p>{step.feedback}</p>
    </div>
  )
}

function IntroStep({ caseData, step, onNext }) {
  useScene(step.scene)
  const p = caseData.patient
  return (
    <>
      <p className="eyebrow">케이스 · {caseData.id.toUpperCase()}</p>
      <h1>{caseData.title}</h1>
      <div className="case-card">
        <div className="case-row">
          <span>환자</span>
          <strong>
            {p.age}세 {p.sex}, {p.job}
          </strong>
        </div>
        <div className="case-row">
          <span>주호소</span>
          <strong>{caseData.chiefComplaint}</strong>
        </div>
      </div>
      <h2 className="sub">병력</h2>
      <ul className="plain">
        {caseData.history.map((h) => (
          <li key={h}>{h}</li>
        ))}
      </ul>
      <h2 className="sub">이 케이스에서 할 일</h2>
      <ol className="plain">
        {caseData.goals.map((g) => (
          <li key={g}>{g}</li>
        ))}
      </ol>
      <p className="help">3D 뷰는 드래그로 회전, 휠·핀치로 확대할 수 있고, 단계마다 관찰에 알맞은 시점으로 자동 이동합니다.</p>
      <button type="button" className="btn primary" onClick={onNext}>
        관찰 시작
      </button>
    </>
  )
}

function PostureStep({ step, ...q }) {
  const [compare, setCompare] = useState(false)
  useScene(step.scene)
  useEffect(() => {
    store.setState({ pose: POSES[compare ? step.scene.comparePose : step.scene.pose] })
  }, [compare, step])
  return (
    <>
      <p className="instruction">{step.instruction}</p>
      <div className="btn-row">
        <button type="button" className={`btn ${compare ? 'on' : ''}`} onClick={() => setCompare((v) => !v)} aria-pressed={compare}>
          {compare ? '환자 자세로 돌아가기' : '정상 자세와 비교'}
        </button>
      </div>
      <div className={`badge ${compare ? 'ok' : 'warn'}`}>{compare ? '기준: 정상 자세' : '환자 자세'}</div>
      <Questions step={step} {...q} />
    </>
  )
}

function MovementStep({ step, ...q }) {
  const [t, setT] = useState(0)
  const [compare, setCompare] = useState(false)
  const [playing, setPlaying] = useState(false)
  const [ran, setRan] = useState(false)
  const { pose, readout } = useMemo(() => hipFlexionPose(t, compare ? 0 : 1), [t, compare])
  useScene(step.scene)
  useEffect(() => {
    store.setState({ pose, plant: 'right' })
  }, [pose])
  useEffect(() => {
    if (!playing) return
    const start = performance.now()
    let raf = 0
    const tick = (now) => {
      const p = Math.min(1, (now - start) / 2500)
      setT(p)
      if (p < 1) raf = requestAnimationFrame(tick)
      else {
        setPlaying(false)
        setRan(true)
      }
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [playing])
  const fmt = (v) => `${Math.round(v)}°`
  return (
    <>
      <p className="instruction">{step.instruction}</p>
      <div className="btn-row">
        <button
          type="button"
          className="btn primary"
          disabled={playing}
          onClick={() => {
            setT(0)
            setPlaying(true)
          }}
        >
          {ran ? '다시 재생' : '검사 시행'}
        </button>
        <button type="button" className={`btn ${compare ? 'on' : ''}`} onClick={() => setCompare((v) => !v)} aria-pressed={compare}>
          {compare ? '환자 패턴으로' : '정상 패턴과 비교'}
        </button>
      </div>
      <div className="field">
        <div className="field-label">
          <label htmlFor="case-flex">고관절 굴곡 진행</label>
          <span className="value">{Math.round(t * 100)} / 100</span>
        </div>
        <input id="case-flex" type="range" min={0} max={100} value={Math.round(t * 100)} onChange={(e) => setT(Number(e.target.value) / 100)} />
      </div>
      <dl className="readout">
        <dt>대퇴 거상각</dt>
        <dd>{fmt(readout.thigh)}</dd>
        <dt>고관절 굴곡</dt>
        <dd>{fmt(readout.hip)}</dd>
        <dt>골반 후방경사</dt>
        <dd>{fmt(readout.tilt)}</dd>
        <dt>요추 굴곡</dt>
        <dd>{fmt(readout.lumbar)}</dd>
      </dl>
      <Questions step={step} {...q} />
    </>
  )
}

function SensoryStep({ step, ...q }) {
  const [show, setShow] = useState(true)
  useScene(step.scene)
  useEffect(() => {
    store.setState({ dermatome: show ? 'overlay' : 'off' })
  }, [show])
  return (
    <>
      <p className="instruction">{step.instruction}</p>
      <div className="btn-row">
        <button type="button" className={`btn ${show ? 'on' : ''}`} onClick={() => setShow((v) => !v)} aria-pressed={show}>
          {show ? '저림 부위 표시 끄기' : '저림 부위 표시'}
        </button>
      </div>
      <Questions step={step} {...q} />
    </>
  )
}

function SummaryStep({ caseData, step, answers, onRestart, onExplore }) {
  useScene(step.scene)
  const graded = caseData.steps
    .filter((s) => s.questions)
    .flatMap((s) => s.questions.map((qq) => ({ step: s.title, prompt: qq.prompt, chosen: qq.options.find((o) => o.id === answers[qq.id])?.label ?? '—', right: answers[qq.id] === qq.answer })))
  const score = graded.filter((g) => g.right).length
  return (
    <>
      <p className="eyebrow">종합</p>
      <h1>
        소견 {score} / {graded.length} 일치
      </h1>
      <table className="grade">
        <tbody>
          {graded.map((g) => (
            <tr key={g.step + g.prompt} className={g.right ? 'right' : 'wrong'}>
              <th>{g.prompt}</th>
              <td>{g.chosen}</td>
              <td>{g.right ? '✓' : '✗'}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <h2 className="sub">해석</h2>
      <ul className="plain">
        {step.interpretation.map((line) => (
          <li key={line}>{line}</li>
        ))}
      </ul>
      <p className="note">{step.nextSteps}</p>
      <div className="btn-row">
        <button type="button" className="btn primary" onClick={onRestart}>
          처음부터 다시
        </button>
        <button type="button" className="btn" onClick={onExplore}>
          자유 탐색으로
        </button>
      </div>
    </>
  )
}

export function CaseFlow({ caseData, onExplore }) {
  const [index, setIndex] = useState(0)
  const [answers, setAnswers] = useState({})
  const [submitted, setSubmitted] = useState({})
  const step = caseData.steps[index]
  const last = index === caseData.steps.length - 1
  const needsAnswer = Boolean(step.questions) && !submitted[step.id]

  const qProps = {
    answers,
    onAnswer: (qid, oid) => setAnswers((a) => ({ ...a, [qid]: oid })),
    submitted: Boolean(submitted[step.id]),
    onSubmit: () => setSubmitted((s) => ({ ...s, [step.id]: true })),
  }
  const restart = () => {
    setIndex(0)
    setAnswers({})
    setSubmitted({})
  }

  let body
  if (step.type === 'info') body = <IntroStep caseData={caseData} step={step} onNext={() => setIndex(index + 1)} />
  else if (step.type === 'posture') body = <PostureStep step={step} {...qProps} />
  else if (step.type === 'movement') body = <MovementStep step={step} {...qProps} />
  else if (step.type === 'sensory') body = <SensoryStep step={step} {...qProps} />
  else body = <SummaryStep caseData={caseData} step={step} answers={answers} onRestart={restart} onExplore={onExplore} />

  return (
    <div className="case-flow">
      <ol className="stepper" aria-label="진행 단계">
        {caseData.steps.map((s, i) => (
          <li key={s.id} className={i === index ? 'current' : i < index ? 'done' : ''}>
            <button type="button" onClick={() => i <= index && setIndex(i)} disabled={i > index}>
              <span className="step-num">{i + 1}</span>
              <span className="step-title">{s.title}</span>
            </button>
          </li>
        ))}
      </ol>
      {step.type !== 'info' && step.type !== 'summary' && (
        <>
          <p className="eyebrow">
            단계 {index + 1} / {caseData.steps.length}
          </p>
          <h1>{step.title}</h1>
        </>
      )}
      <div key={step.id}>{body}</div>
      {step.type !== 'info' && step.type !== 'summary' && (
        <div className="nav-row">
          <button type="button" className="btn" onClick={() => setIndex(index - 1)}>
            이전
          </button>
          <button type="button" className="btn primary" disabled={needsAnswer || last} onClick={() => setIndex(index + 1)}>
            {needsAnswer ? '소견을 제출하면 진행됩니다' : '다음 단계'}
          </button>
        </div>
      )}
    </div>
  )
}
