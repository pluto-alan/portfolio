// 首页三板块核对：卡墙 8 / 作品带 8 / 作品区每卡 3 个不同作品，全程无重复
import { spawn } from 'node:child_process'
import { mkdtempSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

const EDGE = 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'
const PORT = 9600 + Math.floor(Math.random() * 300)
const dir = mkdtempSync(join(tmpdir(), 'pf-home-'))
const edge = spawn(
  EDGE,
  ['--headless=new', `--remote-debugging-port=${PORT}`, `--user-data-dir=${join(dir, 'p')}`, '--no-first-run', '--window-size=1920,1200', 'about:blank'],
  { stdio: 'ignore' },
)
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

let wsUrl
for (let i = 0; i < 80 && !wsUrl; i++) {
  try {
    const list = await (await fetch(`http://127.0.0.1:${PORT}/json/list`)).json()
    wsUrl = list.find((t) => t.type === 'page')?.webSocketDebuggerUrl
  } catch {}
  if (!wsUrl) await sleep(300)
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
  new Promise((res) => {
    const mid = ++id
    pending.set(mid, res)
    ws.send(JSON.stringify({ id: mid, method, params }))
  })
const evalJs = async (expression) => {
  const r = await send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true })
  if (r.result?.exceptionDetails) throw new Error(JSON.stringify(r.result.exceptionDetails).slice(0, 300))
  return r.result?.result?.value
}

// 默认核对本地开发服务器；BASE_URL=http://localhost:4173/ 可核对生产构建
const BASE_URL = process.env.BASE_URL || 'http://localhost:5173/'
await send('Page.navigate', { url: BASE_URL })
await sleep(3500)
// 全页滚动一遍，触发懒加载
await evalJs(`(async()=>{const h=document.body.scrollHeight;for(let y=0;y<h;y+=600){window.scrollTo(0,y);await new Promise(r=>setTimeout(r,120))}window.scrollTo(0,0);return 1})()`)
// 等所有图片真正解码完成（大图比小图慢，别把「还在加载」判成裂图）
await evalJs(`(async()=>{
  const wait=(img)=>img.complete?1:new Promise(r=>{img.addEventListener('load',r,{once:true});img.addEventListener('error',r,{once:true})})
  await Promise.race([Promise.all([...document.images].map(wait)), new Promise(r=>setTimeout(r,15000))])
  return document.images.length
})()`)
await sleep(1500)

const data = await evalJs(`(() => {
  const norm = (s) => (s || '').trim()
  const items = (sel, nameSel) =>
    [...document.querySelectorAll(sel)].map((el) => {
      const a = el.closest('a') || el.querySelector('a')
      const img = el.querySelector('img')
      return {
        name: norm(el.querySelector(nameSel)?.textContent),
        href: a ? a.getAttribute('href') : '',
        loaded: img ? img.complete && img.naturalWidth > 0 : null,
        w: img ? img.naturalWidth : 0,
        ratio: el.clientWidth ? +(el.clientHeight / el.clientWidth).toFixed(2) : 0,
      }
    })
  const cards = [...document.querySelectorAll('.proj-card')].map((card, i) => {
    const boxes = [...card.querySelectorAll('.proj-img')].map((b) => {
      const a = b.closest('a') || b.querySelector('a')
      const img = b.querySelector('img')
      return {
        name: norm(b.querySelector('.proj-img__name')?.textContent),
        href: a ? a.getAttribute('href') : '',
        loaded: img ? img.complete && img.naturalWidth > 0 : null,
        w: img ? img.naturalWidth : 0,
      }
    })
    return { card: i + 1, boxes }
  })
  return {
    arc: items('.hero__card', '.hero__card-name, .hero__card h3, h3'),
    mq: items('.marquee__tile', '.marquee__tile-name, h3'),
    cards,
  }
})()`)

console.log('卡墙', data.arc.length)
data.arc.forEach((x, i) => console.log(' ', i + 1, x.href, '| ratio', x.ratio, '| loaded', x.loaded, x.w))
console.log('作品带', data.mq.length)
data.mq.forEach((x, i) => console.log(' ', i + 1, x.href, '| ratio', x.ratio, '| loaded', x.loaded, x.w))
console.log('作品区卡数', data.cards.length)
data.cards.forEach((c) => {
  console.log(' 卡' + c.card, c.boxes.map((b) => `${b.href}(${b.name || '-'},${b.loaded ? b.w + 'px' : 'BROKEN'})`).join('  '))
})

const all = [...data.arc, ...data.mq, ...data.cards.flatMap((c) => c.boxes)].map((x) => x.href)
const dup = all.filter((h, i) => h && all.indexOf(h) !== i)
console.log('总展示项', all.length, '| 重复', dup.length ? [...new Set(dup)] : '无')
const broken = [...data.arc, ...data.mq, ...data.cards.flatMap((c) => c.boxes)].filter((x) => x.loaded === false)
console.log('裂图', broken.length ? broken.map((b) => b.href) : '无')

ws.close()
edge.kill()
process.exit(0)
