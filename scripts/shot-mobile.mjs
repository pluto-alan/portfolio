// 移动端视口核验：390×844 手机模拟，逐屏截图 + 检查横向溢出
import { spawn } from 'node:child_process'
import { mkdtempSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

const EDGE = 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'
const PORT = 9412
const BASE = process.env.BASE_URL || 'http://localhost:5173/'
const outDir = mkdtempSync(join(tmpdir(), 'pf-mobile-'))
const edge = spawn(EDGE, [
  '--headless=new', `--remote-debugging-port=${PORT}`,
  `--user-data-dir=${join(outDir, 'p')}`, '--no-first-run', '--window-size=420,900', 'about:blank',
], { stdio: 'ignore' })
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
let wsUrl
for (let i = 0; i < 30 && !wsUrl; i++) {
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
await send('Emulation.setDeviceMetricsOverride', {
  width: 390, height: 844, deviceScaleFactor: 2, mobile: true,
})
await send('Emulation.setTouchEmulationEnabled', { enabled: true })
await send('Emulation.setUserAgentOverride', {
  userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
})
await send('Page.navigate', { url: BASE })
await sleep(5500)

const report = []
const shot = async (name) => {
  const s = await send('Page.captureScreenshot', { format: 'png' })
  writeFileSync(join(outDir, name + '.png'), Buffer.from(s.result.data, 'base64'))
  report.push(name + '.png')
}

// 0) 全页横向溢出检测
const overflow = await ev(`(() => {
  const doc = document.documentElement
  const bad = []
  document.querySelectorAll('body *').forEach((el) => {
    const r = el.getBoundingClientRect()
    if (r.right > doc.clientWidth + 2 && r.width > 40 && getComputedStyle(el).position !== 'fixed') {
      bad.push(el.className && typeof el.className === 'string' ? el.className.split(' ')[0] : el.tagName)
    }
  })
  return JSON.stringify({ scrollW: doc.scrollWidth, clientW: doc.clientWidth, bad: [...new Set(bad)].slice(0, 12) })
})()`)
console.log('OVERFLOW ' + overflow)

await shot('01-hero')

// 逐屏滚动截图：作品带 / 作品区 / 关于 / 服务 / 联系
const sections = [
  ['02-marquee', `.marquee`],
  ['03-about', `.about2`],
  ['04-services', `.services`],
  ['05-projects', `.projects2`],
  ['06-contact', `.contact2`],
]
for (const [name, sel] of sections) {
  const ok = await ev(`(() => {
    const el = document.querySelector('${sel}')
    if (!el) return 'MISSING'
    const y = el.getBoundingClientRect().top + window.scrollY
    window.scrollTo({ top: Math.max(0, y - 40), behavior: 'instant' })
    return 'OK'
  })()`)
  await sleep(2200)
  console.log(name, ok)
  await shot(name)
}

// 作品区第一张卡（竖排后）单独截一张
await ev(`(() => { const el = document.querySelector('.proj-card'); if (!el) return 'NO'; window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - 30, behavior: 'instant' }); return 'OK' })()`)
await sleep(1800)
await shot('07-proj-card')

console.log('OUT ' + outDir)
ws.close()
edge.kill()
process.exit(0)
