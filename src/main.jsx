import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { store } from './state/store'

// Debug handle for QA scripts (Playwright) — read-only inspection of the scene.
window.__pt3d = store

// No <StrictMode>: in development it mounts the tree twice, which creates and
// discards a WebGL context while the model is still parsing. With the previous
// (15 MB) model that reliably produced "WebGLRenderer: Context Lost" on cold
// loads; it buys nothing for a single-canvas app like this one.
createRoot(document.getElementById('root')).render(<App />)
