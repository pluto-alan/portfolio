// 临时工具：用无头浏览器下载 CDN 资源（浏览器走系统网络，可访问 cdn.sanity.io）
// 用法：node scripts/fetch-asset.mjs <url> <outPath>
import { spawn } from 'node:child_process'
import { writeFileSync, mkdtempSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

const [url, outPath] = process.argv.slice(2)
if (!url || !outPath) {
  console.error('usage: node scripts/fetch-asset.mjs <url> <outPath>')
  process.exit(1)
}

const EDGE = 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'
// 随机端口，避免连续多次调用时撞上上一次残留的调试端口
const PORT = 9500 + Math.floor(Math.random() * 400)
const dir = mkdtempSync(join(tmpdir(), 'pf-asset-'))

const edge = spawn(
  EDGE,
  ['--headless=new', `--remote-debugging-port=${PORT}`, `--user-data-dir=${join(dir, 'p')}`, '--no-first-run', 'about:blank'],
  { stdio: 'ignore' },
)
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

let wsUrl
for (let i = 0; i < 80 && !wsUrl; i++) {
  try {
    const list = await (await fetch(`http://127.0.0.1:${PORT}/json/list`)).json()
    wsUrl = list.find((t) => t.type === 'page')?.webSocketDebuggerUrl
  } catch {}
  if (!wsUrl) await sleep(400)
}
if (!wsUrl) throw new Error('CDP not ready')

const ws = new WebSocket(wsUrl)
await new Promise((r) => (ws.onopen = r))
let id = 0
const pending = new Map()
ws.onmessage = (e) => {
  const m = JSON.parse(e.data)
  if (m.id && pending.has(m.id)) {
    pending.get(m.id)(m)
    pending.delete(m.id)
  }
}
const send = (method, params = {}) =>
  new Promise((resolve) => {
    const mid = ++id
    pending.set(mid, resolve)
    ws.send(JSON.stringify({ id: mid, method, params }))
  })

await send('Page.navigate', { url: 'http://localhost:5173/' })
await sleep(2500)

const expr = `(async () => {
  const res = await fetch(${JSON.stringify(url)}, { cache: 'no-store' })
  if (!res.ok) return 'ERR ' + res.status
  const buf = await res.arrayBuffer()
  let bin = ''
  const bytes = new Uint8Array(buf)
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i])
  return btoa(bin)
})()`
const r = await send('Runtime.evaluate', { expression: expr, awaitPromise: true, returnByValue: true })
const b64 = r.result?.result?.value
if (!b64 || String(b64).startsWith('ERR')) {
  console.error('download failed:', b64 || JSON.stringify(r.result))
  ws.close()
  edge.kill()
  process.exit(1)
}
writeFileSync(outPath, Buffer.from(b64, 'base64'))
console.log('saved', outPath, Buffer.from(b64, 'base64').length, 'bytes')

ws.close()
edge.kill()
process.exit(0)
