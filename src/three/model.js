import { useGLTF } from '@react-three/drei'
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js'

export const MODEL_URL = `${import.meta.env.BASE_URL}models/MakeHuman.glb`

export const MODEL_INFO = {
  name: 'MakeHuman 기본 인체',
  source: 'MakeHuman 1.x 기본 메시 + 기본 스켈레톤 + 스킨 가중치(CC0) — scripts/build-makehuman.mjs로 glTF 변환, 척추를 24분절로 세분화',
  bones: 179,
  triangles: 26756,
  size: '0.8 MB',
  clips: [],
  credit: 'Model: MakeHuman base mesh (CC0, makehumancommunity.org)',
}

// When the whole app is inlined into a single HTML page (see
// scripts/build-artifact.mjs) the model arrives as a base64 global instead of
// a URL, and is parsed in memory — no fetch, no blob URLs.
const EMBEDDED = typeof window !== 'undefined' ? window.__PT3D_MODEL_B64__ : undefined
export const IS_EMBEDDED = Boolean(EMBEDDED)

let embedded = null
function loadEmbedded(b64) {
  if (embedded) return embedded
  const entry = { status: 'pending' }
  entry.promise = new Promise((resolve, reject) => {
    const bin = atob(b64)
    const bytes = new Uint8Array(bin.length)
    for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i)
    new GLTFLoader().parse(
      bytes.buffer,
      '',
      (gltf) => {
        entry.status = 'done'
        entry.value = gltf
        resolve(gltf)
      },
      (err) => {
        entry.status = 'error'
        entry.error = err
        reject(err)
      },
    )
  })
  embedded = entry
  return entry
}

function useEmbeddedGLTF() {
  const e = loadEmbedded(EMBEDDED)
  if (e.status === 'pending') throw e.promise
  if (e.status === 'error') throw e.error
  return e.value
}

function useNetworkGLTF() {
  return useGLTF(MODEL_URL)
}

// Chosen once at module load, so the hook call order never changes.
export const useHumanModel = IS_EMBEDDED ? useEmbeddedGLTF : useNetworkGLTF

if (!IS_EMBEDDED) useGLTF.preload(MODEL_URL)
