// 截取作品区（三框=三作品）验证图
import { spawn } from 'node:child_process'
import { mkdtempSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

const EDGE = 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'
const PORT = 9374
// 用法：node shot-projects.mjs [卡片序号]（从 0 开始，默认 0 = 第一组）
const cardIndex = Number(process.argv[2] || 0)
const outDir = mkdtempSync(join(tmpdir(), 'pf-proj-'))
const edge = spawn(EDGE, [
  '--headless=new', `--remote-debugging-port=${PORT}`,
  `--user-data-dir=${join(outDir, 'p')}`, '--no-first-run', '--window-size=1920,1080', 'about:blank',
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
await send('Page.navigate', { url: 'http://localhost:5173/' })
await sleep(5000)
await send('Emulation.setDeviceMetricsOverride', { width: 1920, height: 1080, deviceScaleFactor: 1, mobile: false })
await ev(`(() => { const el = document.querySelectorAll('.proj-card')[${cardIndex}]; if (!el) return 'NO CARD'; const y = el.getBoundingClientRect().top + window.scrollY; window.scrollTo({ top: Math.max(0, y - 60), behavior: 'instant' }); return 'OK ' + Math.round(y) })()`)
await sleep(2500)
const shot = await send('Page.captureScreenshot', { format: 'png' })
writeFileSync(join(outDir, 'projects.png'), Buffer.from(shot.result.data, 'base64'))
console.log('OUT ' + outDir)
ws.close()
edge.kill()
process.exit(0)
