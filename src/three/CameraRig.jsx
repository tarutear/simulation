import { useEffect, useRef } from 'react'
import { CameraControls } from '@react-three/drei'
import { CAMERA_PRESETS } from './cameras'
import { useAppState } from '../state/store'

// camera-controls handles mouse, wheel and touch (1 finger rotate, 2 finger
// pinch-zoom / pan) out of the box; presets animate via setLookAt().
export function CameraRig() {
  const ref = useRef(null)
  const preset = useAppState((s) => s.camera)
  const nonce = useAppState((s) => s.cameraNonce)

  useEffect(() => {
    const p = CAMERA_PRESETS[preset]
    if (!p || !ref.current) return
    ref.current.setLookAt(...p.pos, ...p.target, true)
  }, [preset, nonce])

  return (
    <CameraControls
      ref={ref}
      makeDefault
      minDistance={0.4}
      maxDistance={9}
      maxPolarAngle={Math.PI * 0.58}
      smoothTime={0.3}
    />
  )
}
