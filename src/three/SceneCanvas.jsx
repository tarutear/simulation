import { Canvas } from '@react-three/fiber'
import { OrbitControls, Grid } from '@react-three/drei'

// Shared scene chrome (lights, ground, camera controls) reused across all 4 demos
// so each demo file only has to worry about the model / pose logic.
export default function SceneCanvas({ children, cameraPosition = [0, 1.3, 3.4], target = [0, 1, 0] }) {
  return (
    <Canvas
      shadows
      dpr={[1, 2]}
      camera={{ position: cameraPosition, fov: 45, near: 0.1, far: 50 }}
    >
      <color attach="background" args={['#111318']} />
      <hemisphereLight args={['#ffffff', '#3a3a3a', 1.1]} />
      <directionalLight
        position={[3, 5, 2]}
        intensity={1.4}
        castShadow
        shadow-mapSize={[1024, 1024]}
      />
      <Grid
        position={[0, 0, 0]}
        args={[10, 10]}
        cellColor="#333844"
        sectionColor="#4b5163"
        fadeDistance={12}
        infiniteGrid
      />
      {children}
      <OrbitControls
        makeDefault
        target={target}
        enableDamping
        dampingFactor={0.1}
        minDistance={0.8}
        maxDistance={10}
        // three.js OrbitControls default touch mapping already does
        // one-finger rotate + two-finger pinch-zoom/pan, no override needed
      />
    </Canvas>
  )
}
