// 诊断：作品带 / 作品区每张卡的实际图片地址、加载状态与所属作品
import { spawn } from 'node:child_process'
import { mkdtempSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

const EDGE = 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'
const PORT = 9354
const outDir = mkdtempSync(join(tmpdir(), 'pf-diag-'))

const edge = spawn(EDGE, [
  '--headless=new', `--remote-debugging-port=${PORT}`,
  `--user-data-dir=${join(outDir, 'profile')}`, '--no-first-run', '--window-size=1920,1080', 'about:blank',
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
  if (r.result?.exceptionDetails) return 'ERR ' + JSON.stringify(r.result.exceptionDetails).slice(0, 200)
  return r.result?.result?.value
}

await send('Page.enable')
await send('Network.enable')
await send('Network.setCacheDisabled', { cacheDisabled: true })
await send('Page.navigate', { url: 'http://localhost:5173/' })
await sleep(6000)
await send('Emulation.setDeviceMetricsOverride', { width: 1920, height: 1080, deviceScaleFactor: 1, mobile: false })
await sleep(800)
await evalJs(`document.querySelector('.marquee')?.scrollIntoView(); undefined`)
await sleep(2500)

const marquee = await evalJs(`(() => {
  const tiles = [...document.querySelectorAll('.marquee__tile')]
  return JSON.stringify(tiles.map(t => {
    const img = t.querySelector('img, video')
    const href = t.getAttribute('href') || ''
    return {
      slug: (href.match(/work=[^&]+/) || [''])[0],
      title: t.querySelector('.marquee__tile-title')?.textContent,
      tagName: img?.tagName,
      src: img?.getAttribute('src'),
      srcset: (img?.getAttribute('srcset') || '').slice(0, 90),
      current: img?.currentSrc,
      natural: img ? [img.naturalWidth, img.naturalHeight] : null,
    }
  }), null, 0)
})()`)

const projects = await evalJs(`(() => {
  const cards = [...document.querySelectorAll('.proj-card')]
  return JSON.stringify(cards.map(c => {
    const a = c.querySelector('a[href*="work="]')
    const img = c.querySelector('.proj-img--big img')
    return {
      slug: a ? (a.getAttribute('href').match(/work=[^&]+/) || [''])[0] : '',
      num: c.querySelector('.proj-card__num')?.textContent,
      name: c.querySelector('.proj-card__name')?.textContent,
      big: img ? [img.getAttribute('src'), img.naturalWidth] : null,
    }
  }))
})()`)

console.log('MARQUEE ' + marquee)
console.log('PROJECTS ' + projects)

const shot = await send('Page.captureScreenshot', { format: 'png' })
writeFileSync(join(outDir, 'mq.png'), Buffer.from(shot.result.data, 'base64'))
console.log('OUT_DIR=' + outDir)
ws.close()
edge.kill()
process.exit(0)
