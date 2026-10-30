// 临时验证：量卡墙 / 作品带卡片的实际宽高比，并各截一张图
import { spawn } from 'node:child_process'
import { writeFileSync, mkdtempSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

const EDGE = 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'
const PORT = 9344
const outDir = mkdtempSync(join(tmpdir(), 'pf-ratio-'))

const edge = spawn(EDGE, [
  '--headless=new', `--remote-debugging-port=${PORT}`,
  `--user-data-dir=${join(outDir, 'profile')}`, '--no-first-run', '--window-size=1920,1080',
  'about:blank',
], { stdio: 'ignore' })
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

let wsUrl
for (let i = 0; i < 30 && !wsUrl; i++) {
  try {
    const list = await (await fetch(`http://127.0.0.1:${PORT}/json/list`)).json()
    wsUrl = list.find((t) => t.type === 'page')?.webSocketDebuggerUrl
  } catch {}
  if (!wsUrl) await sleep(300)
}
const ws = new WebSocket(wsUrl)
await new Promise((r) => (ws.onopen = r))
let id = 0
const pending = new Map()
ws.onmessage = (e) => {
  const m = JSON.parse(e.data)
  if (m.id && pending.has(m.id)) { pending.get(m.id)(m); pending.delete(m.id) }
}
const send = (method, params = {}) => new Promise((res) => {
  const mid = ++id
  pending.set(mid, res)
  ws.send(JSON.stringify({ id: mid, method, params }))
})
const evalJs = async (expr) => {
  const r = await send('Runtime.evaluate', { expression: expr, returnByValue: true, awaitPromise: true })
  return r.result?.result?.value
}

await send('Page.enable')
await send('Page.navigate', { url: 'http://localhost:5173/' })
await sleep(4500)
await send('Emulation.setDeviceMetricsOverride', { width: 1920, height: 1080, deviceScaleFactor: 1, mobile: false })
await sleep(600)

// 卡墙
await evalJs(`window.scrollTo(0, 640); undefined`)
await sleep(1200)
const arcShot = await send('Page.captureScreenshot', { format: 'png' })
writeFileSync(join(outDir, 'arc.png'), Buffer.from(arcShot.result.data, 'base64'))

const arcInfo = await evalJs(`(() => {
  const cards = [...document.querySelectorAll('.hero__card')]
  return JSON.stringify({
    count: cards.length,
    boxes: cards.map(c => { const r = c.getBoundingClientRect(); return [Math.round(r.width), Math.round(r.height), +(r.width / r.height).toFixed(3)] }),
    overlaps: cards.some((c, i) => cards.some((d, j) => i < j && (() => { const a = c.getBoundingClientRect(), b = d.getBoundingClientRect(); return a.left < b.right - 2 && b.left < a.right - 2 && a.top < b.bottom - 2 && b.top < a.bottom - 2 })())),
  })
})()`)

// 作品带
await evalJs(`document.querySelector('.marquee')?.scrollIntoView({ block: 'center' }); undefined`)
await sleep(1600)
const mqShot = await send('Page.captureScreenshot', { format: 'png' })
writeFileSync(join(outDir, 'marquee.png'), Buffer.from(mqShot.result.data, 'base64'))

const mqInfo = await evalJs(`(() => {
  const tiles = [...document.querySelectorAll('.marquee__tile')]
  const r = tiles[0]?.getBoundingClientRect()
  const rows = [...document.querySelectorAll('.marquee__row')].map(x => ({ scrollW: x.scrollWidth, viewW: window.innerWidth, tx: getComputedStyle(x).transform }))
  return JSON.stringify({
    count: tiles.length,
    firstBox: r ? [Math.round(r.width), Math.round(r.height), +(r.width / r.height).toFixed(3)] : null,
    rows,
  })
})()`)

console.log('OUT_DIR=' + outDir)
console.log('ARC ' + arcInfo)
console.log('MARQUEE ' + mqInfo)

ws.close()
edge.kill()
process.exit(0)
