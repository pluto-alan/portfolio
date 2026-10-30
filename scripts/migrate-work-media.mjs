// 一次性迁移：把旧版「封面=图片 + 图集=图片数组」升级为新结构
//   cover: { type:'image', image:{...}, alt }   ← 原 cover 图片
//   modules: [{ _type:'moduleGallery', images:[...] }] ← 原 gallery 图片
// 用法：node scripts/migrate-work-media.mjs
import fs from 'node:fs'
import path from 'node:path'
import os from 'node:os'
import crypto from 'node:crypto'
import { createClient } from '@sanity/client'

const cfg = JSON.parse(fs.readFileSync(path.join(os.homedir(), '.config/sanity/config.json'), 'utf8'))
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
  token: cfg.authToken,
  useCdn: false,
})

const key = () => crypto.randomUUID().replace(/-/g, '').slice(0, 12)

const works = await client.fetch(
  /* groq */ `*[_type == "work"]{_id, title, cover, gallery, modules}`
)
console.log(`共 ${works.length} 个作品待检查`)

const tx = client.transaction()
let touched = 0

for (const w of works) {
  const patch = {}

  // 旧封面：cover 自身就是图片对象
  if (w.cover?.asset?._ref) {
    patch.cover = {
      _type: 'cover',
      type: 'image',
      image: {
        _type: 'image',
        asset: { _type: 'reference', _ref: w.cover.asset._ref },
        alt: w.cover.alt || w.title || '',
      },
    }
  }

  // 旧图集 → 一个画廊模块
  const hasModules = Array.isArray(w.modules) && w.modules.length > 0
  if (!hasModules && Array.isArray(w.gallery) && w.gallery.length) {
    patch.modules = [
      {
        _type: 'moduleGallery',
        _key: key(),
        title: '作品图集',
        columns: '2',
        images: w.gallery
          .filter((g) => g?.asset?._ref)
          .map((g) => ({
            _type: 'image',
            _key: key(),
            asset: { _type: 'reference', _ref: g.asset._ref },
            alt: g.alt || w.title || '',
          })),
      },
    ]
  }

  if (Object.keys(patch).length) {
    tx.patch(w._id, (p) => p.set(patch))
    touched++
    console.log(`· ${w.title}：${Object.keys(patch).join(' / ')}`)
  }
}

if (!touched) {
  console.log('没有需要迁移的文档')
} else {
  const res = await tx.commit({ visibility: 'sync' })
  console.log(`\n迁移完成，提交 ${res.results?.length ?? touched} 个 patch`)
}
