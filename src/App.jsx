import { useState } from 'react'
import { Viewport } from './three/Viewport'
import { CaseFlow } from './case/CaseFlow'
import { CASE_01 } from './cases/case01'
import { Demo1Viewer } from './demos/Demo1Viewer'
import { Demo2HipLumbar } from './demos/Demo2HipLumbar'
import { Demo3Posture } from './demos/Demo3Posture'
import { Demo4Dermatome } from './demos/Demo4Dermatome'
import './App.css'

const DEMOS = [
  { id: 'viewer', label: '1 · 기본 뷰어', Panel: Demo1Viewer },
  { id: 'hip', label: '2 · 고관절–요추 보상', Panel: Demo2HipLumbar },
  { id: 'posture', label: '3 · 정적 자세', Panel: Demo3Posture },
  { id: 'dermatome', label: '4 · 부위 하이라이트', Panel: Demo4Dermatome },
]

export default function App() {
  const [mode, setMode] = useState('case') // 'case' | 'explore'
  const [active, setActive] = useState('viewer')
  const { Panel } = DEMOS.find((d) => d.id === active)

  return (
    <div className="app">
      <header className="topbar">
        <div className="brand">
          <span className="brand-mark">PT</span>
          <div>
            <div className="brand-title">3D 시뮬레이션 스파이크</div>
            <div className="brand-sub">React · react-three-fiber · Mixamo X Bot</div>
          </div>
        </div>
        <div className="mode-switch" role="group" aria-label="모드">
          <button type="button" className={mode === 'case' ? 'active' : ''} onClick={() => setMode('case')}>
            임상 케이스
          </button>
          <button type="button" className={mode === 'explore' ? 'active' : ''} onClick={() => setMode('explore')}>
            자유 탐색
          </button>
        </div>
        {mode === 'explore' && (
          <nav className="tabs" aria-label="데모">
            {DEMOS.map((d) => (
              <button
                key={d.id}
                type="button"
                className={d.id === active ? 'tab active' : 'tab'}
                aria-pressed={d.id === active}
                onClick={() => setActive(d.id)}
              >
                {d.label}
              </button>
            ))}
          </nav>
        )}
      </header>
      <main className="main">
        {/* One persistent canvas; the side panel and store state change per mode/step. */}
        <Viewport />
        <aside className="panel" key={mode === 'case' ? 'case' : active}>
          {mode === 'case' ? <CaseFlow caseData={CASE_01} onExplore={() => setMode('explore')} /> : <Panel />}
        </aside>
      </main>
    </div>
  )
}
