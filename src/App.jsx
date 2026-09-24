import { useState } from 'react'
import { Viewport } from './three/Viewport'
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
      </header>
      <main className="main">
        {/* One persistent canvas; tabs only swap the side panel and the pose/camera state. */}
        <Viewport />
        <aside className="panel" key={active}>
          <Panel />
        </aside>
      </main>
    </div>
  )
}
