// 验证详情页图片是否保持原比例（不裁切）：对比 natural 与渲染尺寸，并截图
import { spawn } from 'node:child_process'
import { mkdtempSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

const EDGE = 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'
const PORT = 9386
const slug = process.argv[2] || 'work-02'
const outDir = mkdtempSync(join(tmpdir(), 'pf-ratio2-'))
const edge = spawn(EDGE, [
  '--headless=new', `--remote-debugging-port=${PORT}`,
  `--user-data-dir=${join(outDir, 'p')}`, '--no-first-run', '--window-size=1600,1000', 'about:blank',
], { stdio: 'ignore' })
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

let wsUrl
for (let i = 0; i < 40 && !wsUrl; i++) {
  try {
    const l = await (await fetch(`http://127.0.0.1:${PORT}/json/list`)).json()
    wsUrl = l.find((t) => t.type === 'page')?.webSocketDebuggerUrl
  } catch {}
  if (!wsUrl) await sleep(300)
}
const ws = new WebSocket(wsUrl)
await new Promise((r) => (ws.onopen = r))
let id = 0
const pend = new Map()
ws.onmessage = (e) => {
  const m = JSON.parse(e.data)
  if (m.id && pend.has(m.id)) { pend.get(m.id)(m); pend.delete(m.id) }
}
const send = (method, params = {}) => new Promise((res) => {
  const mid = ++id
  pend.set(mid, res)
  ws.send(JSON.stringify({ id: mid, method, params }))
})
const ev = async (x) => (await send('Runtime.evaluate', { expression: x, returnByValue: true, awaitPromise: true })).result?.result?.value

await send('Page.enable')
await send('Emulation.setDeviceMetricsOverride', { width: 1600, height: 1000, deviceScaleFactor: 1, mobile: false })
await send('Page.navigate', { url: `http://localhost:5173/?work=${slug}` })
await sleep(6000)

const raw = await ev(`(() => {
  const box = (el) => {
    const r = el.getBoundingClientRect()
    const cs = getComputedStyle(el)
    return { nw: el.naturalWidth, nh: el.naturalHeight, w: Math.round(r.width), h: Math.round(r.height), fit: cs.objectFit, ar: cs.aspectRatio }
  }
  const out = { cover: null, gallery: [], modules: [] }
  const c = document.querySelector('.wd__cover-media')
  if (c) out.cover = box(c)
  document.querySelectorAll('.wd-gallery__img').forEach((i) => out.gallery.push(box(i)))
  document.querySelectorAll('.wd-figure__img').forEach((i) => out.modules.push(box(i)))
  return JSON.stringify(out)
})()`)

const data = JSON.parse(raw)
const report = (label, o) => {
  if (!o || !o.nw) return `${label}: 无图`
  const nRatio = o.nw / o.nh
  const rRatio = o.w / o.h
  const dev = Math.abs(nRatio - rRatio) / nRatio
  return `${label}: 原图 ${o.nw}x${o.nh} (${nRatio.toFixed(3)}) → 显示 ${o.w}x${o.h} (${rRatio.toFixed(3)}) | 偏差 ${(dev * 100).toFixed(1)}% | object-fit:${o.fit} | ${dev < 0.02 ? '✓ 完整未裁切' : '✗ 有裁切'}`
}
console.log('=== 详情页 ' + slug + ' ===')
if (data.cover) console.log(report('封面', data.cover))
data.modules.forEach((m, i) => console.log(report(`单图模块 ${i + 1}`, m)))
data.gallery.forEach((m, i) => console.log(report(`画廊图 ${i + 1}`, m)))
if (!data.cover && !data.modules.length && !data.gallery.length) console.log('（该作品没有图片模块）')

// 封面截图
const shotCover = await ev(`(() => { const el = document.querySelector('.wd__cover'); if (!el) return 'none'; el.scrollIntoView({block:'center'}); return 'ok' })()`)
if (shotCover === 'ok') {
  await sleep(1800)
  const shot = await send('Page.captureScreenshot', { format: 'png' })
  writeFileSync(join(outDir, 'cover.png'), Buffer.from(shot.result.data, 'base64'))
}
// 画廊截图
const hasGallery = await ev(`(() => { const el = document.querySelector('.wd__modules'); if (!el) return 'none'; el.scrollIntoView({block:'start'}); return 'ok' })()`)
if (hasGallery === 'ok') {
  await sleep(2200)
  const shot2 = await send('Page.captureScreenshot', { format: 'png' })
  writeFileSync(join(outDir, 'gallery.png'), Buffer.from(shot2.result.data, 'base64'))
}
console.log('OUT ' + outDir)
ws.close()
edge.kill()
process.exit(0)
