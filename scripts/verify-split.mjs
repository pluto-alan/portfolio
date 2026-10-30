// 临时验证脚本：无头 Edge 打开首页，分别截取弧形卡墙与作品带
import { spawn } from 'node:child_process'
import { writeFileSync, mkdtempSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

const EDGE = 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'
const PORT = 9333
const outDir = mkdtempSync(join(tmpdir(), 'pf-verify-'))
const profile = join(outDir, 'profile')

const edge = spawn(EDGE, [
  '--headless=new', `--remote-debugging-port=${PORT}`,
  `--user-data-dir=${profile}`, '--no-first-run', '--window-size=1920,1080',
  'about:blank',
], { stdio: 'ignore' })

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

async function getTarget() {
  for (let i = 0; i < 30; i++) {
    try {
      const res = await fetch(`http://127.0.0.1:${PORT}/json/list`)
      const list = await res.json()
      const page = list.find((t) => t.type === 'page')
      if (page) return page.webSocketDebuggerUrl
    } catch {}
    await sleep(300)
  }
  throw new Error('CDP not ready')
}

const wsUrl = await getTarget()
const ws = new WebSocket(wsUrl)
await new Promise((r) => (ws.onopen = r))

let id = 0
const pending = new Map()
ws.onmessage = (e) => {
  const msg = JSON.parse(e.data)
  if (msg.id && pending.has(msg.id)) {
    pending.get(msg.id)(msg)
    pending.delete(msg.id)
  }
}
const send = (method, params = {}) =>
  new Promise((resolve) => {
    const mid = ++id
    pending.set(mid, resolve)
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
await sleep(800)

// 截图1：首屏弧形卡墙
const shot1 = await send('Page.captureScreenshot', { format: 'png' })
writeFileSync(join(outDir, 'hero.png'), Buffer.from(shot1.result.data, 'base64'))

// 滚动到作品带（marquee 区块），截图2
await evalJs(`document.querySelector('.marquee')?.scrollIntoView({block:'center'}); undefined`)
await sleep(1500)
const shot2 = await send('Page.captureScreenshot', { format: 'png' })
writeFileSync(join(outDir, 'marquee.png'), Buffer.from(shot2.result.data, 'base64'))

// 输出两个板块的作品标题，便于核对不重复；同时检查裂图
const titles = await evalJs(`(() => {
  const arc = [...document.querySelectorAll('.hero__card-title')].map(e => e.textContent)
  const mq = [...document.querySelectorAll('.marquee__tile-title')].map(e => e.textContent)
  const broken = [...document.querySelectorAll('img')]
    .filter(i => i.complete && i.naturalWidth === 0)
    .map(i => i.getAttribute('src'))
  return JSON.stringify({ arc, mq, broken })
})()`)
console.log('OUT_DIR=' + outDir)
console.log('TITLES=' + titles)

ws.close()
edge.kill()
process.exit(0)
