/**
 * 把当前 data.js 的内容一键灌入 Sanity（首次接入时跑一次即可）
 *
 * 用法：
 *   1. 在 https://www.sanity.io/manage 创建项目，拿到 Project ID
 *   2. 生成一个 Editor 权限的 API Token
 *   3. 在项目根目录执行：
 *        SANITY_PROJECT_ID=xxxx SANITY_TOKEN=sk... npm run seed
 *
 * 说明：图片（封面/形象照）无法从本地直接迁移，稍后在 Studio 里上传即可。
 */
import { createClient } from '@sanity/client'
import { works, experience, profile } from '../src/data.js'

const projectId = process.env.SANITY_PROJECT_ID
const token = process.env.SANITY_TOKEN
const dataset = process.env.SANITY_DATASET || 'production'

if (!projectId || !token) {
  console.error('缺少环境变量：SANITY_PROJECT_ID / SANITY_TOKEN')
  process.exit(1)
}

const client = createClient({ projectId, dataset, apiVersion: '2025-01-01', token, useCdn: false })

const slugify = (s, i) => `work-${String(i + 1).padStart(2, '0')}`

const docs = [
  // 网站设置（单例）
  {
    _id: 'siteSettings',
    _type: 'siteSettings',
    siteTitle: `${profile.name} · ${profile.role}`,
    heroLine1: '2026',
    heroLine2: '作品集',
    heroMid: '用设计讲好产品故事，让每一次视觉表达都更有价值。',
    contactEmail: profile.email,
    contactPhone: profile.phone,
    location: profile.location,
    footerNote: '',
  },
  // 个人简介（单例）
  {
    _id: 'profile',
    _type: 'profile',
    name: profile.name,
    nameEn: profile.nameEn,
    role: profile.role,
    roleEn: profile.roleEn,
    intro: profile.intro,
    fields: profile.fields,
    stats: profile.stats,
    skills: profile.skills,
    email: profile.email,
    phone: profile.phone,
    location: profile.location,
    status: profile.status,
  },
  // 工作经历
  ...experience.map((e, i) => ({
    _id: `experience-${i + 1}`,
    _type: 'experience',
    time: e.time,
    company: e.company,
    title: e.title,
    points: e.points,
    sortOrder: i,
  })),
  // 作品（默认全部发布，封面稍后在后台补）
  ...works.map((w, i) => ({
    _id: `work-${i + 1}`,
    _type: 'work',
    title: w.title,
    slug: { _type: 'slug', current: slugify(w.title, i) },
    year: 2026,
    category: w.tag,
    summary: '',
    description: '',
    sortOrder: i,
    featured: i < 4,
  })),
]

const tx = client.transaction()
docs.forEach((doc) => tx.createOrReplace(doc))

tx.commit()
  .then((res) => {
    console.log(`已写入 ${docs.length} 条内容：`, res.documentIds.join(', '))
    console.log('服务内容（services）暂保留在前端代码中，可在后续版本纳入 CMS')
    console.log('下一步：打开 /studio 上传作品封面与形象照')
  })
  .catch((err) => {
    console.error('写入失败：', err.message)
    process.exit(1)
  })
