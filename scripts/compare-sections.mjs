// 临时验证：分别截取首页卡墙与作品区，并列出两边图片实际加载的地址
import { spawn } from 'node:child_process'
import { writeFileSync, mkdtempSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

const EDGE = 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'
const PORT = 9334
const outDir = mkdtempSync(join(tmpdir(), 'pf-cmp-'))

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
await sleep(500)

// 卡墙：滚到卡片完整可见的位置
await evalJs(`window.scrollTo(0, 700); undefined`)
await sleep(1200)
const shot1 = await send('Page.captureScreenshot', { format: 'png' })
writeFileSync(join(outDir, 'arc.png'), Buffer.from(shot1.result.data, 'base64'))

// 作品区
await evalJs(`document.querySelector('.projects2')?.scrollIntoView(); undefined`)
await sleep(1500)
const shot2 = await send('Page.captureScreenshot', { format: 'png' })
writeFileSync(join(outDir, 'projects.png'), Buffer.from(shot2.result.data, 'base64'))

const info = await evalJs(`(() => {
  const arc = [...document.querySelectorAll('.hero__card')].map(a => {
    const img = a.querySelector('img')
    return { title: a.querySelector('.hero__card-title')?.textContent, src: img?.getAttribute('src') }
  })
  const proj = [...document.querySelectorAll('.proj-card')].map(card => {
    const img = card.querySelector('.proj-img--big img')
    return { name: card.querySelector('.proj-card__name')?.textContent, src: img?.getAttribute('src') }
  })
  return JSON.stringify({ arc, proj }, null, 1)
})()`)
console.log('OUT_DIR=' + outDir)
console.log(info)

ws.close()
edge.kill()
process.exit(0)
