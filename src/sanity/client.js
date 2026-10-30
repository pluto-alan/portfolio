import { createClient } from '@sanity/client'

const projectId = import.meta.env.VITE_SANITY_PROJECT_ID
const dataset = import.meta.env.VITE_SANITY_DATASET || 'production'
const apiVersion = import.meta.env.VITE_SANITY_API_VERSION || '2025-01-01'

// 未配置 projectId（或仍是模板占位符）时视为未接入 CMS，前台回退到本地 data.js
export const hasSanity = Boolean(projectId && projectId !== 'YOUR_PROJECT_ID')

export const client = createClient({
  projectId: projectId || 'placeholder',
  dataset,
  apiVersion,
  useCdn: false, // 走 API 直连：后台发布后前台立即拿到新内容（CDN 有最长 60s 的缓存延迟）
  perspective: 'published', // 永不返回草稿
})

export const sanityEnv = { projectId: projectId || '', dataset, apiVersion }

// 发布前预览：加 ?preview=1 时读取「包含草稿」的视角
export const isPreview = () =>
  typeof window !== 'undefined' &&
  new URLSearchParams(window.location.search).get('preview') === '1'

export const previewClient = createClient({
  projectId: projectId || 'placeholder',
  dataset,
  apiVersion,
  useCdn: false,
  perspective: 'previewDrafts',
  token: import.meta.env.VITE_SANITY_PREVIEW_TOKEN, // 草稿需要读权限 token（可选）
})

export const activeClient = () => (isPreview() ? previewClient : client)

// 本地镜像映射表（scripts/sync-cms-images.mjs 生成）：hash → public/media/cms/ 下的文件名
// 国内网络普遍访问不到 cdn.sanity.io，有本地镜像时优先走站点自身
import cmsImages from '../cms-images.json'
import cmsImageVariants from '../cms-image-variants.json'
import cmsFiles from '../cms-files.json'

/** 响应式图片备选宽度（生成变体 / CDN 参数共用同一组） */
export const RESPONSIVE_WIDTHS = [400, 800, 1200, 1600]

const IMAGE_REF_RE = /^image-(.+)-(\d+x\d+)-(\w+)$/
const FILE_REF_RE = /^file-([0-9a-f]+)-(\w+)$/

const parseImageRef = (ref) => {
  const m = IMAGE_REF_RE.exec(ref || '')
  return m ? { id: m[1], dims: m[2], ext: m[3] } : null
}

// Sanity 图片管线：宽 / 质量 / 自动格式（webp/avif）、fit=max 保留完整画面
function cdnImageUrl(id, ext, width, { fit = 'max', quality = 78 } = {}) {
  const params = new URLSearchParams({ auto: 'format', q: String(quality), fit })
  if (width) params.set('w', String(width))
  return `https://cdn.sanity.io/images/${sanityEnv.projectId}/${sanityEnv.dataset}/${id}.${ext}?${params}`
}

/**
 * Sanity 图片引用 → 站点可用地址
 * 优先使用本地镜像（可选出最接近目标宽度的变体），没有镜像时回退 Sanity CDN
 */
export function assetUrl(ref, width = 1200, opts = {}) {
  const p = parseImageRef(ref)
  if (!p) return ''
  const local = cmsImages[p.id]
  if (local) {
    const variants = cmsImageVariants[p.id] || []
    const hit = variants.filter((w) => w <= width).pop() || variants[0]
    if (hit) return `/media/cms/${p.id}-w${hit}.${p.ext}`
    return `/media/cms/${local}`
  }
  return cdnImageUrl(p.id, p.ext, width, opts)
}

/** 响应式 srcset：本地镜像给出全部变体，否则用 CDN 多宽度 */
export function imageSrcSet(ref, opts = {}) {
  const p = parseImageRef(ref)
  if (!p) return ''
  const variants = cmsImageVariants[p.id]
  if (cmsImages[p.id] && Array.isArray(variants) && variants.length) {
    return variants.map((w) => `/media/cms/${p.id}-w${w}.${p.ext} ${w}w`).join(', ')
  }
  return RESPONSIVE_WIDTHS.map((w) => `${cdnImageUrl(p.id, p.ext, w, opts)} ${w}w`).join(', ')
}

/** Sanity 文件（视频等）→ 地址：本地镜像优先，回退 CDN */
export function fileUrl(ref) {
  const m = FILE_REF_RE.exec(ref || '')
  if (!m) return ''
  const [, id, ext] = m
  const local = cmsFiles[id]
  if (local) return `/media/cms/${local}`
  return `https://cdn.sanity.io/files/${sanityEnv.projectId}/${sanityEnv.dataset}/${id}.${ext}`
}

// 一次性拉取全站内容
export const CONTENT_QUERY = /* groq */ `
{
  "works": *[_type == "work"] | order(orderRank asc) {
    title, "slug": slug.current, year, category, summary, description,
    cover{
      type, image, videoFile{asset}, videoUrl,
      poster, autoplay, loop, muted
    },
    detailCover{
      type, image, videoFile{asset}, videoUrl,
      poster, autoplay, loop, muted
    },
    modules[]{
      _type, _key, title, caption, width, columns, text, imagePosition,
      image, images, poster, videoFile{asset}, videoUrl, autoplay, loop, muted
    },
    gallery, sortOrder, featured, hideFromGrid, "createdAt": _createdAt, "updatedAt": _updatedAt
  },
  "experience": *[_type == "experience"] | order(sortOrder asc) {
    time, company, title, points, sortOrder
  },
  "profile": *[_type == "profile" && _id == "profile"][0] {
    name, nameEn, role, roleEn, avatar, intro, fields, stats, skills,
    email, phone, location, status
  },
  "siteSettings": *[_type == "siteSettings" && _id == "siteSettings"][0] {
    siteTitle, heroLine1, heroLine2, heroMid,
    contactEmail, contactPhone, location, footerNote
  }
}
`
