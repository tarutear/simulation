import { useMemo } from 'react'
import { useGLTF } from '@react-three/drei'
// three.js ships SkeletonUtils itself under three/addons - use that instead
// of three-stdlib, whose package root barrel re-exports postprocessing
// passes that reference three.js APIs removed in newer three versions
// (and whose package.json blocks deep imports into individual submodules).
import { clone as cloneSkeleton } from 'three/addons/utils/SkeletonUtils.js'

// drei's useGLTF caches the parsed result by URL, so every demo that calls
// useGLTF(MODEL_URL) shares the exact same THREE.Object3D/bone instances.
// Since each demo mutates bone quaternions directly, that meant switching
// tabs compounded one demo's pose onto whatever a previous tab had left in
// the shared skeleton. Cloning (skeleton-aware, via SkeletonUtils) gives
// each demo its own independent bone hierarchy to pose.
export function useClonedModel(url) {
  const { scene } = useGLTF(url)
  return useMemo(() => {
    const clonedScene = cloneSkeleton(scene)
    const nodes = {}
    clonedScene.traverse((o) => {
      if (o.name) nodes[o.name] = o
    })
    return { scene: clonedScene, nodes }
  }, [scene])
}
