// Builds the app with Vite, then folds the whole thing — JS bundle, CSS and the
// glb model (base64) — into ONE HTML fragment that can be published as a
// claude.ai Artifact (no external requests at all; the platform wraps the
// fragment in its own <html>/<head> with charset + viewport).
//
//   node scripts/build-artifact.mjs   →   artifact/pt-3d-simulation.html
import { execSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const dist = path.join(root, 'dist')
const out = path.join(root, 'artifact', 'pt-3d-simulation.html')

execSync('npx vite build', { stdio: 'inherit', cwd: root })

const html = fs.readFileSync(path.join(dist, 'index.html'), 'utf8')
const jsPath = /<script[^>]+src="\.?\/?(assets\/[^"]+\.js)"/.exec(html)?.[1]
const cssPath = /<link[^>]+href="\.?\/?(assets\/[^"]+\.css)"/.exec(html)?.[1]
if (!jsPath || !cssPath) throw new Error('could not find the built asset paths in dist/index.html')

const css = fs.readFileSync(path.join(dist, cssPath), 'utf8')
// "</script" inside the bundle would end the inline tag early; it only ever
// appears inside string literals, where "<\/script" is the same string.
const js = fs.readFileSync(path.join(dist, jsPath), 'utf8').replace(/<\/script/gi, '<\\/script')
const modelB64 = fs.readFileSync(path.join(root, 'public', 'models', 'Xbot.glb')).toString('base64')

const page = `<title>PT 3D 시뮬레이션</title>
<style>${css}</style>
<div id="root"></div>
<script>window.__PT3D_MODEL_B64__=${JSON.stringify(modelB64)};</script>
<script type="module">${js}</script>
`
fs.mkdirSync(path.dirname(out), { recursive: true })
fs.writeFileSync(out, page)
console.log(`wrote ${path.relative(root, out)} (${(page.length / 1e6).toFixed(2)} MB)`)
