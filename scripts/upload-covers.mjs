// 一次性脚本：把本地素材图上传到 Sanity，并挂到对应作品（封面 + 图集）
// 注意：封面按新结构写入 cover{type:'image', image}
// 用法：node scripts/upload-covers.mjs
import fs from 'node:fs'
import path from 'node:path'
import os from 'node:os'
import { createClient } from '@sanity/client'

// 读取 CLI 登录凭证（~/.config/sanity/config.json）
const cfgPath = path.join(os.homedir(), '.config/sanity/config.json')
const cfg = JSON.parse(fs.readFileSync(cfgPath, 'utf8'))
const token = cfg.authToken
if (!token) throw new Error('未找到 Sanity 登录凭证，请先在浏览器完成 Studio 登录后重试')

// 读取项目 .env 里的 projectId / dataset
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
  token,
})

const SRC = 'F:/桌面/2026作品集/素材'

// 作品 → 封面 + 图集（每个作品 1 张封面、2-4 张图集）
const PLAN = [
  {
    id: 'work-1',
    title: '商品主图点击率优化',
    cover: `${SRC}/主图/1.jpg`,
    gallery: [`${SRC}/主图/2.jpg`, `${SRC}/主图/3.jpg`, `${SRC}/主图/4.jpg`],
  },
  {
    id: 'work-2',
    title: '详情页首屏设计',
    cover: `${SRC}/images/辣木籽果精华滋润去屑洗发水-详情页设计_01.jpg`,
    gallery: [
      `${SRC}/images/辣木籽果精华滋润去屑洗发水-详情页设计_02.jpg`,
      `${SRC}/images/辣木籽果精华滋润去屑洗发水-详情页设计_03.jpg`,
    ],
  },
  {
    id: 'work-3',
    title: '大促活动海报',
    cover: `${SRC}/海报/260427_10.jpg`,
    gallery: [`${SRC}/海报/260511_1.jpg`, `${SRC}/海报/260529(1).jpg`],
  },
  {
    id: 'work-4',
    title: '店铺 banner 更新',
    cover: `${SRC}/主图详情/2/主图 (1).jpg`,
    gallery: [`${SRC}/主图详情/2/主图 (2).jpg`, `${SRC}/主图详情/2/主图 (3).jpg`],
  },
  {
    id: 'work-5',
    title: '品牌视觉规范',
    cover: `${SRC}/VI/资源 22.jpg`,
    gallery: [`${SRC}/VI/资源 23.jpg`, `${SRC}/VI/资源 24.jpg`, `${SRC}/VI/资源 25.jpg`],
  },
  {
    id: 'work-6',
    title: '包装视觉方案',
    cover: `${SRC}/images/歌澜洗发水_01.jpg`,
    gallery: [`${SRC}/images/歌澜洗发水_02.jpg`],
  },
  {
    id: 'work-7',
    title: '朋友圈推广素材',
    cover: `${SRC}/海报/260602_2.jpg`,
    gallery: [`${SRC}/海报/260604.jpg`, `${SRC}/海报/260617.jpg`, `${SRC}/海报/260626.jpg`],
  },
  {
    id: 'work-8',
    title: '展会物料设计',
    cover: `${SRC}/线下物料/资源 50.jpg`,
    gallery: [`${SRC}/线下物料/资源 51.jpg`],
  },
]

async function uploadImage(filePath) {
  const buffer = fs.readFileSync(filePath)
  const asset = await client.assets.upload('image', buffer, {
    filename: path.basename(filePath),
    contentType: 'image/jpeg',
  })
  return { _type: 'image', asset: { _type: 'reference', _ref: asset._id } }
}

async function main() {
  const tx = client.transaction()
  for (const item of PLAN) {
    if (!fs.existsSync(item.cover)) {
      console.warn(`⚠ 跳过 ${item.title}：封面文件不存在 ${item.cover}`)
      continue
    }
    const cover = await uploadImage(item.cover)
    const gallery = []
    for (const g of item.gallery || []) {
      if (fs.existsSync(g)) gallery.push(await uploadImage(g))
      else console.warn(`⚠ 图集文件不存在，跳过：${g}`)
    }
    tx.patch(item.id, (p) =>
      p.set({
        cover: {
          _type: 'cover',
          type: 'image',
          image: { ...cover, alt: item.title },
        },
        gallery: gallery.map((g) => ({ ...g, alt: item.title })),
      })
    )
    console.log(`✔ ${item.title}：封面 + ${gallery.length} 张图集`)
  }
  const res = await tx.commit({ visibility: 'sync' })
  console.log('提交完成，共', res.results?.length ?? 0, '个 patch')
}

main().catch((e) => {
  console.error('上传失败：', e.message)
  process.exit(1)
})
