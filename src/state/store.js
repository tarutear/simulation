import { useSyncExternalStore } from 'react'

// Tiny external store so the render loop (useFrame) can read the latest
// UI state every frame without re-rendering React, while panels/HUD can
// still subscribe to individual fields.
const listeners = new Set()

let state = {
  ready: false, // model loaded and rig captured
  rig: null, // rig controller (see three/rig.js), set by <Human/>
  demo: 'viewer',
  pose: {}, // target joint pose in degrees, keyed by bone name
  plant: 'both', // which foot is glued to the floor: 'left' | 'right' | 'both' | null
  camera: 'threeQuarter', // camera preset key (see three/cameras.js)
  demoCamera: null, // the active demo's default preset (HUD "기본 시점")
  cameraNonce: 0, // bump to re-apply the preset (= "reset view")
  guides: false, // posture guide lines (plumb line, shoulder/pelvis lines)
  dermatome: 'off', // 'off' | 'overlay' | 'decal'
  spine: false, // vertebra markers (HUD toggle, kept across demos)
  animation: null, // bundled clip name to play instead of the pose, or null
  contextLost: false,
}

export const store = {
  getState: () => state,
  setState(partial) {
    const next = typeof partial === 'function' ? partial(state) : partial
    state = { ...state, ...next }
    listeners.forEach((l) => l())
  },
  subscribe(l) {
    listeners.add(l)
    return () => listeners.delete(l)
  },
}

// Selectors must return primitives or stable references (the whole state
// object is fine) — useSyncExternalStore compares snapshots by identity.
export function useAppState(selector = (s) => s) {
  return useSyncExternalStore(
    store.subscribe,
    () => selector(store.getState()),
    () => selector(store.getState()),
  )
}
