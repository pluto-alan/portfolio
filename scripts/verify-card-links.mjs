// 核对作品区每张卡右上角按钮的跳转目标
import { spawn } from 'node:child_process'
import { mkdtempSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

const BASE = process.env.BASE_URL || 'http://localhost:5173/'
const EDGE = 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'
const PORT = 9600 + Math.floor(Math.random() * 300)
const dir = mkdtempSync(join(tmpdir(), 'pf-btn-'))
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
  if (r.result?.exceptionDetails) throw new Error(JSON.stringify(r.result.exceptionDetails).slice(0, 300))
  return r.result?.result?.value
}

await send('Page.navigate', { url: BASE })
await sleep(3500)

const rows = await evalJs(`(() => [...document.querySelectorAll('.proj-card')].map((card, i) => {
  const btn = card.querySelector('.proj-card__top .btn-ghost2')
  return {
    card: i + 1,
    num: card.querySelector('.proj-card__num')?.textContent?.trim(),
    label: btn?.textContent?.trim(),
    href: btn?.getAttribute('href'),
    works: [...card.querySelectorAll('.proj-img')].map((b) => (b.closest('a') || b.querySelector('a'))?.getAttribute('href')),
  }
}))()`)
rows.forEach((r) => console.log(`卡${r.card}(${r.num}) 按钮「${r.label}」-> ${r.href}  | 三框: ${r.works.join(' ')}`))

// 实际点击第一张卡的右上角按钮，确认落到集锦详情页
const clicked = await evalJs(`(async () => {
  const btn = document.querySelector('.proj-card .proj-card__top .btn-ghost2')
  btn.click()
  await new Promise((r) => setTimeout(r, 1200))
  const img = document.querySelector('.wd__cover-media')
  if (img && !img.complete) await new Promise((r) => { img.onload = r; img.onerror = r })
  return {
    url: location.search,
    title: document.querySelector('.wd__title')?.textContent?.trim(),
    img: img?.currentSrc?.split('/media/').pop(),
    natural: img ? img.naturalWidth + '×' + img.naturalHeight : '-',
  }
})()`)
console.log('点击卡1按钮 →', JSON.stringify(clicked, null, 0))

ws.close()
edge.kill()
process.exit(0)
