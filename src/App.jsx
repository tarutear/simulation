import { useState, Suspense } from 'react'
import Demo1Viewer from './demos/Demo1Viewer'
import Demo2HipLumbar from './demos/Demo2HipLumbar'
import Demo3StaticPosture from './demos/Demo3StaticPosture'
import Demo4Dermatome from './demos/Demo4Dermatome'
import './App.css'

const TABS = [
  { id: 'demo1', label: '1. 기본 뷰어', Component: Demo1Viewer },
  { id: 'demo2', label: '2. 고관절-요추 보상', Component: Demo2HipLumbar },
  { id: 'demo3', label: '3. 정적 자세', Component: Demo3StaticPosture },
  { id: 'demo4', label: '4. 부위 하이라이트', Component: Demo4Dermatome },
]

export default function App() {
  const [active, setActive] = useState('demo1')
  const Active = TABS.find((t) => t.id === active).Component

  return (
    <div className="app">
      <header className="app-header">
        <h1>PT 3D 시각화 feasibility spike</h1>
        <nav className="tabs">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              className={tab.id === active ? 'tab active' : 'tab'}
              onClick={() => setActive(tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </header>
      <main className="app-main">
        <Suspense fallback={<div className="loading">모델 로딩 중…</div>}>
          <Active />
        </Suspense>
      </main>
    </div>
  )
}
