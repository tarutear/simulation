import { useGLTF } from '@react-three/drei'
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js'

export const MODEL_URL = `${import.meta.env.BASE_URL}models/Xbot.glb`

export const MODEL_INFO = {
  name: 'X Bot',
  source: 'Adobe Mixamo — three.js 예제 저장소(examples/models/gltf/Xbot.glb)에서 가져온 glTF 변환본',
  bones: 67,
  triangles: 49112,
  size: '2.9 MB',
  clips: ['idle', 'walk', 'run', 'agree', 'headShake', 'sad_pose', 'sneak_pose'],
  credit: 'Model: X Bot (mixamo.com)',
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
