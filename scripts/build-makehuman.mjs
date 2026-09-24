// Builds public/models/MakeHuman.glb from the CC0 MakeHuman 1.x raw assets
// (base mesh, default skeleton, default skin weights) without Blender.
//
//   node scripts/build-makehuman.mjs [dir-with-raw-files]
//
// Raw files (all CC0, github.com/makehumancommunity/makehuman, makehuman/data/):
//   3dobjs/base.obj                        — base mesh (units: decimetres, Y up, faces +Z)
//   rigs/default.mhskel                    — bone hierarchy + joint helper vertex lists
//   rigs/default_weights.mhw               — per-bone vertex weights
//
// What the converter does:
//   • keeps the "body" faces plus the two eyeball helpers, drops every other
//     helper group (tights, skirt, hair, teeth, tongue, eyelashes, joint cubes)
//   • converts to metres, puts the soles on y = 0
//   • gives every bone an IDENTITY rest rotation (position = joint head), so a
//     bone's local frame is world-aligned at bind — the app's anatomical-axis
//     rig relies on exactly that
//   • top-4 skin weights per vertex, smooth normals, a COLOR_0 tint that reads
//     as fitted shorts + a top so the nude base mesh looks like a mannequin
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const here = path.dirname(fileURLToPath(import.meta.url))
const root = path.resolve(here, '..')
const src = process.argv[2] ? path.resolve(process.argv[2]) : path.join(here, 'makehuman')
const out = path.join(root, 'public', 'models', 'MakeHuman.glb')

const SCALE = 0.1 // dm → m
const KEEP_GROUPS = new Set(['body', 'helper-l-eye', 'helper-r-eye'])

// ---------------------------------------------------------------- parse OBJ
const V = []
const faces = [] // { g, idx: [vertex indices] }
let group = ''
for (const line of fs.readFileSync(path.join(src, 'base.obj'), 'utf8').split('\n')) {
  if (line.startsWith('v ')) {
    const a = line.trim().split(/\s+/)
    V.push([+a[1], +a[2], +a[3]])
  } else if (line.startsWith('g ')) group = line.slice(2).trim()
  else if (line.startsWith('f ') && KEEP_GROUPS.has(group)) {
    const idx = line.trim().split(/\s+/).slice(1).map((t) => +t.split('/')[0] - 1)
    faces.push({ g: group, idx })
  }
}
const skel = JSON.parse(fs.readFileSync(path.join(src, 'default.mhskel'), 'utf8'))
const weights = JSON.parse(fs.readFileSync(path.join(src, 'default_weights.mhw'), 'utf8')).weights

// ------------------------------------------------------------- joint heads
const jointPos = (name) => {
  const idx = skel.joints[name]
  const p = [0, 0, 0]
  for (const i of idx) for (let k = 0; k < 3; k++) p[k] += V[i][k] / idx.length
  return p
}
let minY = Infinity
for (const v of V) minY = Math.min(minY, v[1])
const toM = ([x, y, z]) => [x * SCALE, (y - minY) * SCALE, z * SCALE]

// ---------------------------------------------------- skeleton (metres)
// name → { parent, head: [x, y, z] }
const bones = {}
for (const [n, def] of Object.entries(skel.bones)) bones[n] = { parent: def.parent, head: toM(jointPos(def.head)) }

// ------------------------------------------- vertebra-level spine chain
// MakeHuman's trunk is 5 spine bones + 3 neck bones. Replace them with one
// bone per vertebra: L5→L1, T12→T1, C7→C1 (24 bones). Bone "L4" has its head
// at the L4/L5 disc, so rotating it is motion at the L4–L5 segment; the
// "head" bone's head is the occipito-atlantal joint.
//   lumbar   : spine05 head (L5/S1) → spine02 head (T12/L1), equal heights
//   thoracic : spine02 head → neck01 head (C7/T1), T12 tallest → T1 shortest
//   cervical : neck01 head → head head (C0/C1), equal heights
const OLD_CHAIN = ['spine05', 'spine04', 'spine03', 'spine02', 'spine01', 'neck01', 'neck02', 'neck03']
const REGIONS = [
  { through: ['spine05', 'spine04', 'spine03', 'spine02'], names: ['L5', 'L4', 'L3', 'L2', 'L1'], rel: [1, 1, 1, 1, 1] },
  {
    through: ['spine02', 'spine01', 'neck01'],
    names: ['T12', 'T11', 'T10', 'T9', 'T8', 'T7', 'T6', 'T5', 'T4', 'T3', 'T2', 'T1'],
    rel: Array.from({ length: 12 }, (_, i) => 1.3 - (0.5 * i) / 11),
  },
  { through: ['neck01', 'neck02', 'neck03', 'head'], names: ['C7', 'C6', 'C5', 'C4', 'C3', 'C2', 'C1'], rel: [1, 1, 1, 1, 1, 1, 1] },
]
const lerp3 = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t]
function pointAlong(pts, frac) {
  // point at `frac` (0..1) of the polyline's arc length
  const seg = []
  let total = 0
  for (let i = 0; i + 1 < pts.length; i++) {
    const l = Math.hypot(pts[i + 1][0] - pts[i][0], pts[i + 1][1] - pts[i][1], pts[i + 1][2] - pts[i][2])
    seg.push(l)
    total += l
  }
  let d = frac * total
  for (let i = 0; i < seg.length; i++) {
    if (d <= seg[i] || i === seg.length - 1) return lerp3(pts[i], pts[i + 1], Math.min(1, d / seg[i]))
    d -= seg[i]
  }
}
const chain = [] // [{ name, head }], caudal → cranial
for (const r of REGIONS) {
  const pts = r.through.map((n) => bones[n].head)
  const sum = r.rel.reduce((x, y) => x + y, 0)
  let acc = 0
  r.names.forEach((name, i) => {
    chain.push({ name, head: pointAlong(pts, acc / sum) })
    acc += r.rel[i]
  })
}
const chainTop = bones.head.head // C0/C1
const chainHeads = [...chain.map((c) => c.head), chainTop]
// Which vertebra a point at height y belongs to (for re-parenting)
const vertebraAt = (y) => {
  for (let k = chain.length - 1; k >= 0; k--) if (y >= chain[k].head[1]) return chain[k].name
  return chain[0].name
}
const oldParentOf = Object.fromEntries(OLD_CHAIN.map((n) => [n, bones[n].parent]))
for (const n of OLD_CHAIN) delete bones[n]
chain.forEach((c, k) => {
  bones[c.name] = { parent: k === 0 ? oldParentOf.spine05 : chain[k - 1].name, head: c.head }
})
for (const [n, b] of Object.entries(bones)) {
  if (OLD_CHAIN.includes(b.parent)) b.parent = n === 'head' ? 'C1' : vertebraAt(b.head[1])
}

// Bone order: parents before children (depth-first from the roots).
const boneNames = Object.keys(bones)
const children = new Map(boneNames.map((n) => [n, []]))
const roots = []
for (const n of boneNames) {
  const p = bones[n].parent
  if (p) children.get(p).push(n)
  else roots.push(n)
}
const order = []
const walk = (n) => {
  order.push(n)
  for (const c of children.get(n).sort()) walk(c)
}
for (const r of roots.sort()) walk(r)
const boneIndex = new Map(order.map((n, i) => [n, i]))
const headM = new Map(order.map((n) => [n, bones[n].head]))

// ------------------------------------------------- per-vertex skin weights
// Weights on the old trunk bones are summed and handed to the vertebrae by
// the vertex's bind-pose height: linear blend between the two vertebrae whose
// mid-heights bracket it, so each segment bends only the skin around it and
// small per-segment rotations add up to a smooth curve.
const chainMid = chain.map((c, k) => (chainHeads[k][1] + chainHeads[k + 1][1]) / 2)
function spreadOverChain(y, w, out) {
  const n = chain.length
  if (y <= chainMid[0]) return out.push([boneIndex.get(chain[0].name), w])
  if (y >= chainMid[n - 1]) return out.push([boneIndex.get(chain[n - 1].name), w])
  let k = 0
  while (chainMid[k + 1] < y) k++
  const t = (y - chainMid[k]) / (chainMid[k + 1] - chainMid[k])
  out.push([boneIndex.get(chain[k].name), w * (1 - t)], [boneIndex.get(chain[k + 1].name), w * t])
}
const perVertex = Array.from({ length: V.length }, () => [])
const chainWeight = new Float32Array(V.length)
for (const bone in weights) {
  if (OLD_CHAIN.includes(bone)) {
    for (const [vi, w] of weights[bone]) chainWeight[vi] += w
    continue
  }
  const bi = boneIndex.get(bone)
  if (bi === undefined) continue
  for (const [vi, w] of weights[bone]) perVertex[vi].push([bi, w])
}
for (let vi = 0; vi < V.length; vi++) if (chainWeight[vi] > 0) spreadOverChain(toM(V[vi])[1], chainWeight[vi], perVertex[vi])

// ------------------------------------------------- compact vertex buffers
// Separate primitives for body and eyes, each with only the vertices it uses.
function buildPrimitive(groupFilter) {
  const remap = new Map()
  const positions = []
  const origIdx = []
  const indices = []
  const use = (vi) => {
    let r = remap.get(vi)
    if (r === undefined) {
      r = positions.length / 3
      remap.set(vi, r)
      positions.push(...toM(V[vi]))
      origIdx.push(vi)
    }
    return r
  }
  for (const f of faces) {
    if (!groupFilter(f.g)) continue
    const r = f.idx.map(use)
    for (let i = 1; i + 1 < r.length; i++) indices.push(r[0], r[i], r[i + 1]) // fan triangulation
  }
  const n = positions.length / 3
  const normals = new Float32Array(n * 3)
  for (let t = 0; t < indices.length; t += 3) {
    const [a, b, c] = [indices[t], indices[t + 1], indices[t + 2]]
    const ax = positions[a * 3], ay = positions[a * 3 + 1], az = positions[a * 3 + 2]
    const ux = positions[b * 3] - ax, uy = positions[b * 3 + 1] - ay, uz = positions[b * 3 + 2] - az
    const vx = positions[c * 3] - ax, vy = positions[c * 3 + 1] - ay, vz = positions[c * 3 + 2] - az
    const nx = uy * vz - uz * vy, ny = uz * vx - ux * vz, nz = ux * vy - uy * vx
    for (const i of [a, b, c]) {
      normals[i * 3] += nx
      normals[i * 3 + 1] += ny
      normals[i * 3 + 2] += nz
    }
  }
  for (let i = 0; i < n; i++) {
    const l = Math.hypot(normals[i * 3], normals[i * 3 + 1], normals[i * 3 + 2]) || 1
    normals[i * 3] /= l
    normals[i * 3 + 1] /= l
    normals[i * 3 + 2] /= l
  }
  const joints = new Uint8Array(n * 4)
  const wts = new Float32Array(n * 4)
  for (let i = 0; i < n; i++) {
    const list = perVertex[origIdx[i]].slice().sort((p, q) => q[1] - p[1]).slice(0, 4)
    let sum = 0
    for (const [, w] of list) sum += w
    if (!list.length) {
      joints[i * 4] = boneIndex.get('root')
      wts[i * 4] = 1
      continue
    }
    list.forEach(([bi, w], k) => {
      joints[i * 4 + k] = bi
      wts[i * 4 + k] = w / sum
    })
  }
  return { positions: new Float32Array(positions), normals, joints, weights: wts, indices: new Uint16Array(indices), origIdx }
}

const body = buildPrimitive((g) => g === 'body')
const eyes = buildPrimitive((g) => g !== 'body')

// ------------------------------------------------- mannequin clothing tint
// Vertex colours multiply the material colour at runtime. 1 = skin tone;
// darker values = a fitted top and shorts. Membership comes from the vertex's
// dominant bone (so arms and hands stay skin) plus bind-pose height bands, and
// deforms with the skin like everything else.
const pelvisY = headM.get('pelvis.L')[1] // ≈ hip crest height
const kneeY = headM.get('lowerleg01.L')[1]
const shoulderY = headM.get('clavicle.L')[1]
const shortsTop = pelvisY + 0.06
const shortsBottom = kneeY + (pelvisY - kneeY) * 0.35
const ARM = /^(shoulder01|upperarm0[12]|lowerarm0[12]|wrist|metacarpal[1-4]|finger[1-5]-[1-3])\.[LR]$/
const dominantBone = (vi) => {
  let best = null
  for (const [bi, w] of perVertex[vi]) if (!best || w > best[1]) best = [bi, w]
  return best ? order[best[0]] : 'root'
}
const bodyColors = new Uint8Array((body.positions.length / 3) * 3)
for (let i = 0; i < body.positions.length / 3; i++) {
  const y = body.positions[i * 3 + 1]
  const arm = ARM.test(dominantBone(body.origIdx[i]))
  let c = [255, 255, 255]
  if (!arm && y > shortsBottom && y < shortsTop) c = [96, 108, 128] // shorts
  else if (!arm && y >= shortsTop && y < shoulderY + 0.03) c = [128, 136, 150] // top
  bodyColors.set(c, i * 3)
}

// ------------------------------------------------------------- write GLB
const chunks = []
let byteLength = 0
const bufferViews = []
const accessors = []
function addView(typed, target) {
  const pad = (4 - (byteLength % 4)) % 4
  if (pad) {
    chunks.push(new Uint8Array(pad))
    byteLength += pad
  }
  const view = { buffer: 0, byteOffset: byteLength, byteLength: typed.byteLength }
  if (target) view.target = target
  bufferViews.push(view)
  chunks.push(new Uint8Array(typed.buffer, typed.byteOffset, typed.byteLength))
  byteLength += typed.byteLength
  return bufferViews.length - 1
}
const CT = { Float32Array: 5126, Uint16Array: 5123, Uint8Array: 5121 }
function addAccessor(typed, type, opts = {}) {
  const comps = { SCALAR: 1, VEC3: 3, VEC4: 4, MAT4: 16 }[type]
  const acc = {
    bufferView: addView(typed, opts.target),
    componentType: CT[typed.constructor.name],
    count: typed.length / comps,
    type,
  }
  if (opts.normalized) acc.normalized = true
  if (opts.minmax) {
    acc.min = Array(comps).fill(Infinity)
    acc.max = Array(comps).fill(-Infinity)
    for (let i = 0; i < typed.length; i++) {
      const k = i % comps
      acc.min[k] = Math.min(acc.min[k], typed[i])
      acc.max[k] = Math.max(acc.max[k], typed[i])
    }
  }
  accessors.push(acc)
  return accessors.length - 1
}

function primitive(p, material, colors) {
  const attributes = {
    POSITION: addAccessor(p.positions, 'VEC3', { target: 34962, minmax: true }),
    NORMAL: addAccessor(p.normals, 'VEC3', { target: 34962 }),
    JOINTS_0: addAccessor(p.joints, 'VEC4', { target: 34962 }),
    WEIGHTS_0: addAccessor(p.weights, 'VEC4', { target: 34962 }),
  }
  if (colors) attributes.COLOR_0 = addAccessor(colors, 'VEC3', { target: 34962, normalized: true })
  return { attributes, indices: addAccessor(p.indices, 'SCALAR', { target: 34963 }), material }
}

const bodyPrim = primitive(body, 0, bodyColors)
const eyePrim = primitive(eyes, 1)

// Inverse bind matrices: bones have identity rotation, so IBM = translate(-head).
const ibm = new Float32Array(order.length * 16)
order.forEach((n, i) => {
  const [x, y, z] = headM.get(n)
  ibm.set([1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, -x, -y, -z, 1], i * 16)
})
const ibmAccessor = addAccessor(ibm, 'MAT4')

// Nodes: 0 = Armature, 1 = Body mesh, 2 = Eyes mesh, 3.. = bones (in `order`).
const BONE0 = 3
const nodes = [
  { name: 'Armature', children: [1, 2, ...roots.map((r) => BONE0 + boneIndex.get(r))] },
  { name: 'Body', mesh: 0, skin: 0 },
  { name: 'Eyes', mesh: 1, skin: 0 },
]
for (const n of order) {
  const p = bones[n].parent
  const h = headM.get(n)
  const ph = p ? headM.get(p) : [0, 0, 0]
  // three.js's GLTFLoader strips '.' from node names, so use '_' up front
  // ("upperleg01.L" → "upperleg01_L") and the runtime names are predictable.
  const node = { name: n.replace(/\./g, '_'), translation: [h[0] - ph[0], h[1] - ph[1], h[2] - ph[2]] }
  const kids = children.get(n)
  if (kids.length) node.children = kids.sort().map((c) => BONE0 + boneIndex.get(c))
  nodes.push(node)
}

const json = {
  asset: { version: '2.0', generator: 'scripts/build-makehuman.mjs', copyright: 'MakeHuman base mesh, skeleton and weights: CC0 (makehumancommunity.org)' },
  scene: 0,
  scenes: [{ nodes: [0] }],
  nodes,
  meshes: [
    { name: 'Body', primitives: [bodyPrim] },
    { name: 'Eyes', primitives: [eyePrim] },
  ],
  skins: [{ name: 'Armature', inverseBindMatrices: ibmAccessor, joints: order.map((n) => BONE0 + boneIndex.get(n)), skeleton: BONE0 + boneIndex.get('root') }],
  materials: [
    { name: 'Skin', pbrMetallicRoughness: { baseColorFactor: [1, 1, 1, 1], metallicFactor: 0, roughnessFactor: 0.85 } },
    { name: 'Eye', pbrMetallicRoughness: { baseColorFactor: [0.2, 0.2, 0.22, 1], metallicFactor: 0, roughnessFactor: 0.4 } },
  ],
  bufferViews,
  accessors,
  buffers: [{ byteLength }],
}

const jsonBytes = Buffer.from(JSON.stringify(json))
const jsonPad = (4 - (jsonBytes.length % 4)) % 4
const bin = Buffer.concat([...chunks.map((c) => Buffer.from(c.buffer, c.byteOffset, c.byteLength))])
const binPad = (4 - (bin.length % 4)) % 4
const total = 12 + 8 + jsonBytes.length + jsonPad + 8 + bin.length + binPad
const glb = Buffer.alloc(total)
let o = 0
glb.write('glTF', o); o += 4
glb.writeUInt32LE(2, o); o += 4
glb.writeUInt32LE(total, o); o += 4
glb.writeUInt32LE(jsonBytes.length + jsonPad, o); o += 4
glb.writeUInt32LE(0x4e4f534a, o); o += 4
jsonBytes.copy(glb, o); o += jsonBytes.length
glb.fill(0x20, o, o + jsonPad); o += jsonPad
glb.writeUInt32LE(bin.length + binPad, o); o += 4
glb.writeUInt32LE(0x004e4942, o); o += 4
bin.copy(glb, o); o += bin.length
fs.mkdirSync(path.dirname(out), { recursive: true })
fs.writeFileSync(out, glb)
console.log(
  `wrote ${path.relative(root, out)}: ${(glb.length / 1e6).toFixed(2)} MB, ` +
    `${order.length} bones, body ${body.positions.length / 3} verts / ${body.indices.length / 3} tris, ` +
    `eyes ${eyes.positions.length / 3} verts, height ${(toM([0, 8.4967, 0])[1]).toFixed(2)} m`,
)
