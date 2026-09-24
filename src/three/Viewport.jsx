import { Component, Suspense } from 'react'
import { Canvas } from '@react-three/fiber'
import { Grid, useProgress } from '@react-three/drei'
import { Human } from './Human'
import { Guides } from './Guides'
import { Dermatome } from './Dermatome'
import { CameraRig } from './CameraRig'
import { CAMERA_PRESETS, HUD_PRESETS } from './cameras'
import { MODEL_INFO, IS_EMBEDDED } from './model'
import { store, useAppState } from '../state/store'

class CanvasErrorBoundary extends Component {
  state = { error: null }
  static getDerivedStateFromError(error) {
    return { error }
  }
  render() {
    if (this.state.error) {
      return (
        <div className="viewport-error">
          <strong>3D 뷰를 표시하지 못했습니다.</strong>
          <span>{String(this.state.error?.message || this.state.error)}</span>
          <span>WebGL을 지원하는 브라우저(최신 Chrome / Safari / Edge)에서 다시 열어주세요.</span>
        </div>
      )
    }
    return this.props.children
  }
}

function Ground() {
  return (
    <>
      <mesh rotation-x={-Math.PI / 2} position-y={0.001} receiveShadow>
        <planeGeometry args={[30, 30]} />
        <shadowMaterial transparent opacity={0.22} />
      </mesh>
      <Grid
        args={[30, 30]}
        cellSize={0.25}
        cellThickness={0.6}
        cellColor="#c3ccd5"
        sectionSize={1}
        sectionThickness={1}
        sectionColor="#9aa7b4"
        fadeDistance={14}
        fadeStrength={1.2}
        infiniteGrid
      />
    </>
  )
}

function ViewHud() {
  const camera = useAppState((s) => s.camera)
  const demoCamera = useAppState((s) => s.demoCamera)
  const setCamera = (key) =>
    store.setState((s) => ({ camera: key, cameraNonce: s.cameraNonce + 1 }))
  return (
    <div className="hud">
      <div className="hud-views" role="group" aria-label="카메라 시점">
        {HUD_PRESETS.map((k) => (
          <button
            key={k}
            type="button"
            className={k === camera ? 'hud-btn active' : 'hud-btn'}
            onClick={() => setCamera(k)}
          >
            {CAMERA_PRESETS[k].label}
          </button>
        ))}
        {demoCamera && (
          <button type="button" className="hud-btn reset" onClick={() => setCamera(demoCamera)}>
            기본 시점
          </button>
        )}
      </div>
      <div className="hud-hint">드래그 회전 · 휠/핀치 줌 · 우클릭/두 손가락 이동</div>
      <div className="hud-credit">{MODEL_INFO.credit}</div>
    </div>
  )
}

function LoadingOverlay() {
  const ready = useAppState((s) => s.ready)
  const { progress, active } = useProgress()
  if (ready) return null
  const pct = !IS_EMBEDDED && active ? ` ${Math.round(progress)}%` : ''
  return (
    <div className="loading-overlay" role="status">
      <div className="spinner" />
      <div className="loading-title">모델 불러오는 중{pct}</div>
      <div className="loading-sub">{MODEL_INFO.name} · {MODEL_INFO.size}</div>
    </div>
  )
}

function ContextLostNotice() {
  const lost = useAppState((s) => s.contextLost)
  if (!lost) return null
  return <div className="context-lost">그래픽 컨텍스트가 끊겼습니다. 복구 중… 계속 비어 있으면 새로고침해 주세요.</div>
}

export function Viewport() {
  return (
    <div className="viewport">
      <CanvasErrorBoundary>
        <Canvas
          shadows
          dpr={[1, 1.75]}
          camera={{ fov: 35, near: 0.05, far: 60, position: [2.3, 1.35, 2.9] }}
          gl={{ antialias: true, powerPreference: 'high-performance' }}
          onCreated={({ gl }) => {
            const el = gl.domElement
            el.addEventListener('webglcontextlost', (e) => {
              e.preventDefault() // lets the browser restore the context
              store.setState({ contextLost: true })
            })
            el.addEventListener('webglcontextrestored', () => store.setState({ contextLost: false }))
          }}
        >
          <color attach="background" args={['#eef2f5']} />
          <hemisphereLight args={['#ffffff', '#c9d1d9', 0.85]} />
          <directionalLight
            position={[2.5, 5, 3]}
            intensity={1.7}
            castShadow
            shadow-mapSize-width={2048}
            shadow-mapSize-height={2048}
            shadow-bias={-0.00015}
            shadow-normalBias={0.02}
            shadow-camera-near={0.5}
            shadow-camera-far={15}
            shadow-camera-left={-2.5}
            shadow-camera-right={2.5}
            shadow-camera-top={3}
            shadow-camera-bottom={-1}
          />
          <directionalLight position={[-3, 2.5, -2.5]} intensity={0.4} />
          <Ground />
          <Suspense fallback={null}>
            <Human />
            <Guides />
            <Dermatome />
          </Suspense>
          <CameraRig />
        </Canvas>
      </CanvasErrorBoundary>
      <ViewHud />
      <LoadingOverlay />
      <ContextLostNotice />
    </div>
  )
}
