// 同步 CMS 图片到本地镜像（解决国内访问不到 cdn.sanity.io 的问题）
// 原理：Sanity 资源 hash = 文件内容 SHA-1。扫描素材目录，把 SHA-1 命中 CMS 资源
// 的文件复制到 public/media/cms/<hash>.<ext>，并生成 src/cms-images.json 映射表。
// 用法：node scripts/sync-cms-images.mjs [素材目录，默认 F:/桌面/2026作品集/素材]
import fs from 'node:fs'
import path from 'node:path'
import crypto from 'node:crypto'
import { createClient } from '@sanity/client'

const SRC_DIR = process.argv[2] || 'F:/桌面/2026作品集/素材'
const OUT_DIR = new URL('../public/media/cms/', import.meta.url)
const MANIFEST = new URL('../src/cms-images.json', import.meta.url)

const env = Object.fromEntries(
  fs
    .readFileSync(new URL('../.env', import.meta.url), 'utf8')
    .split('\n')
    .filter((l) => l.includes('=') && !l.trim().startsWith('#'))
    .map((l) => [l.slice(0, l.indexOf('=')).trim(), l.slice(l.indexOf('=') + 1).trim()])
)

const client = createClient({
  projectId: env.VITE_SANITY_PROJECT_ID,
  dataset: env.VITE_SANITY_DATASET || 'production',
  apiVersion: '2025-01-01',
  useCdn: false,
})

const EXT_RE = /\.(jpe?g|png|webp|gif|avif)$/i

// 1. 取 CMS 里所有图片引用（封面/Poster、详情模块、旧图集、头像）
const data = await client.fetch(/* groq */ `{
  "works": *[_type == "work"] { cover{image, poster}, modules, gallery },
  "profile": *[_type == "profile"] { avatar }
}`)
const moduleRefs = (m) =>
  m ? [m.image?.asset?._ref, m.poster?.asset?._ref, ...(m.images || []).map((i) => i?.asset?._ref)] : []
const refs = [
  ...data.works.flatMap((w) => [
    w.cover?.image?.asset?._ref || w.cover?.asset?._ref,
    w.cover?.poster?.asset?._ref,
    ...(w.modules || []).flatMap(moduleRefs),
    ...(w.gallery || []).map((g) => g?.asset?._ref),
  ]),
  ...data.profile.map((p) => p.avatar?.asset?._ref),
].filter(Boolean)
const wanted = new Map() // hash -> ext
for (const ref of refs) {
  const m = /^image-([0-9a-f]+)-(\d+x\d+)-(\w+)$/.exec(ref)
  if (m) wanted.set(m[1], m[3])
}
console.log(`CMS 共 ${wanted.size} 张图片资源`)

// 2. 递归扫描素材目录，按 SHA-1 匹配
fs.mkdirSync(OUT_DIR, { recursive: true })
const manifestPath = MANIFEST.pathname.replace(/^\/([A-Z]:)/, '$1')
let existing = {}
try { existing = JSON.parse(fs.readFileSync(manifestPath, 'utf8')) } catch {}

let copied = 0, missing = []
function walk(dir) {
  for (const name of fs.readdirSync(dir)) {
    const p = path.join(dir, name)
    const st = fs.statSync(p)
    if (st.isDirectory()) walk(p)
    else if (EXT_RE.test(name) && st.size < 15 * 1024 * 1024) {
      const sha1 = crypto.createHash('sha1').update(fs.readFileSync(p)).digest('hex')
      if (wanted.has(sha1)) {
        const ext = wanted.get(sha1)
        const file = `${sha1}.${ext}`
        const dest = path.join(OUT_DIR.pathname.replace(/^\/([A-Z]:)/, '$1'), file)
        if (!fs.existsSync(dest)) {
          fs.copyFileSync(p, dest)
          copied++
          console.log(`✔ ${file} ← ${p}`)
        }
        existing[sha1] = file
      }
    }
  }
}
walk(SRC_DIR)

for (const [hash, ext] of wanted) {
  if (!existing[hash]) missing.push(`${hash}.${ext}`)
}

// 3. 写映射表（hash → 本地文件名）
fs.writeFileSync(manifestPath, JSON.stringify(existing, null, 2))
console.log(`\n新复制 ${copied} 张；映射表共 ${Object.keys(existing).length} 项 → src/cms-images.json`)
if (missing.length) {
  console.log(`⚠ ${missing.length} 张 CMS 图片在素材目录中没找到源文件（前台将回退 CDN 地址）：`)
  missing.forEach((f) => console.log('  -', f))
}

// ---------- 视频 / 文件资源：同样按 SHA-1 匹配，镜像到本地 ----------
const VIDEO_EXT_RE = /\.(mp4|webm|mov|m4v|ogv)$/i
const FILES_MANIFEST = new URL('../src/cms-files.json', import.meta.url)
const filesManifestPath = FILES_MANIFEST.pathname.replace(/^\/([A-Z]:)/, '$1')

const fdata = await client.fetch(/* groq */ `{
  "works": *[_type == "work"] { cover{videoFile{asset}}, modules }
}`)
const fileRefs = [
  ...fdata.works.flatMap((w) => [
    w.cover?.videoFile?.asset?._ref,
    ...(w.modules || []).map((m) => m?.videoFile?.asset?._ref),
  ]),
].filter(Boolean)
const wantedFiles = new Map() // hash -> ext
for (const ref of fileRefs) {
  const m = /^file-([0-9a-f]+)-(\w+)$/.exec(ref)
  if (m) wantedFiles.set(m[1], m[2])
}

if (wantedFiles.size) {
  console.log(`\nCMS 共 ${wantedFiles.size} 个视频/文件资源`)
  let files = {}
  try { files = JSON.parse(fs.readFileSync(filesManifestPath, 'utf8')) } catch {}
  let copiedFiles = 0
  const missingFiles = []
  function walkFiles(dir) {
    for (const name of fs.readdirSync(dir)) {
      const p = path.join(dir, name)
      const st = fs.statSync(p)
      if (st.isDirectory()) walkFiles(p)
      else if (VIDEO_EXT_RE.test(name)) {
        const sha1 = crypto.createHash('sha1').update(fs.readFileSync(p)).digest('hex')
        if (wantedFiles.has(sha1)) {
          const ext = wantedFiles.get(sha1)
          const file = `${sha1}.${ext}`
          const dest = path.join(OUT_DIR.pathname.replace(/^\/([A-Z]:)/, '$1'), file)
          if (!fs.existsSync(dest)) {
            fs.copyFileSync(p, dest)
            copiedFiles++
            console.log(`✔ ${file} ← ${p}`)
          }
          files[sha1] = file
        }
      }
    }
  }
  walkFiles(SRC_DIR)
  for (const [hash, ext] of wantedFiles) {
    if (!files[hash]) missingFiles.push(`${hash}.${ext}`)
  }
  fs.writeFileSync(filesManifestPath, JSON.stringify(files, null, 2))
  console.log(`新复制 ${copiedFiles} 个；文件映射表共 ${Object.keys(files).length} 项 → src/cms-files.json`)
  if (missingFiles.length) {
    console.log(`⚠ ${missingFiles.length} 个视频在素材目录中没找到源文件（前台将回退 CDN 地址）：`)
    missingFiles.forEach((f) => console.log('  -', f))
  }
}
