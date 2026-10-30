// 详情页首屏大图核对（禁用缓存，避免读到旧文件）
import { spawn } from 'node:child_process'
import { mkdtempSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

const BASE = process.env.BASE_URL || 'http://localhost:5173/'
const EDGE = 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'
const PORT = 9600 + Math.floor(Math.random() * 300)
const dir = mkdtempSync(join(tmpdir(), 'pf-det-'))
const edge = spawn(EDGE, ['--headless=new', `--remote-debugging-port=${PORT}`, `--user-data-dir=${join(dir, 'p')}`, '--no-first-run', '--window-size=1920,1200', 'about:blank'], { stdio: 'ignore' })
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

let wsUrl
for (let i = 0; i < 80 && !wsUrl; i++) {
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
const send = (method, params = {}) => new Promise((res) => { const mid = ++id; pending.set(mid, res); ws.send(JSON.stringify({ id: mid, method, params })) })
const evalJs = async (expression) => {
  const r = await send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true })
  return r.result?.result?.value
}

await send('Network.enable')
await send('Network.setCacheDisabled', { cacheDisabled: true })

for (const slug of (process.env.SLUGS || 'work-20,work-24,work-28').split(',')) {
  await send('Page.navigate', { url: `${BASE}?work=${slug}` })
  await sleep(2800)
  const info = await evalJs(`(async () => {
    const img = document.querySelector('.wd__cover-media')
    if (img && !img.complete) await new Promise((r) => { img.onload = r; img.onerror = r })
    return {
      title: document.querySelector('.wd__title')?.textContent?.trim(),
      img: img?.currentSrc?.split('/media/').pop(),
      natural: img ? img.naturalWidth + '×' + img.naturalHeight : '-',
      shown: img ? img.clientWidth + '×' + img.clientHeight : '-',
      fit: img ? getComputedStyle(img).objectFit : '-',
    }
  })()`)
  console.log(slug, '|', info.title, '|', info.img, '| 原图', info.natural, '| 显示', info.shown, '|', info.fit)
}
ws.close()
edge.kill()
process.exit(0)
