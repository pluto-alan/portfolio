// 把 Sanity 文档映射成前台组件消费的结构
import { assetUrl, imageSrcSet, fileUrl } from './client.js'
import { works as fallbackWorks, projects as fallbackProjects, profile as fallbackProfile } from '../data.js'
import { HERO_WORK_COUNT, MARQUEE_WORK_COUNT } from '../config.js'

const TONES = fallbackWorks.map((w) => w.tone)
const PROJECT_TONES = fallbackProjects.map((p) => ({ c1a: p.c1a, c1b: p.c1b, big: p.big }))

const tone = (i) => TONES[i % TONES.length]
const projectTone = (i) => PROJECT_TONES[i % PROJECT_TONES.length]

/** 单张图片 → { src, srcSet, alt }（走 Sanity 图片管线 + 本地镜像） */
function imageOf(img, fallbackAlt = '', width = 1200) {
  const ref = img?.asset?._ref
  if (!ref) return null
  return {
    src: assetUrl(ref, width),
    srcSet: imageSrcSet(ref),
    alt: img?.alt || fallbackAlt || '',
    // 原始比例可用时给出，前端可据此避免布局跳动
    ratio: null,
  }
}

/** 视频对象（文件或外链）→ 播放参数 */
function videoOf(source, fallbackAlt = '') {
  const src = source?.videoUrl || fileUrl(source?.videoFile?.asset?._ref)
  if (!src) return null
  const poster = imageOf(source?.poster, fallbackAlt)
  return {
    src,
    poster,
    autoplay: source?.autoplay !== false,
    loop: source?.loop !== false,
    muted: source?.muted !== false,
  }
}

/** 封面：兼容旧结构（cover 直接是图片）与新结构（cover.type + image / 视频字段） */
function mapCover(w, field = 'cover') {
  const c = w[field]
  const isLegacyImage = Boolean(c?.asset)
  const type = isLegacyImage ? 'image' : c?.type || 'image'
  const image = imageOf(isLegacyImage ? c : c?.image, w.title)
  const video = type === 'video' ? videoOf(c, w.title) : null
  const poster = video?.poster || null

  return {
    coverType: video ? 'video' : 'image',
    // 兼容旧字段：卡片作为 poster / 图片封面使用
    cover: image?.src || poster?.src || '',
    coverSrcSet: image?.srcSet || poster?.srcSet || '',
    coverAlt: image?.alt || poster?.alt || w.title || '',
    coverImage: image,
    coverVideo: video,
  }
}

/** 详情页模块：按后台顺序输出，过滤无用模块 */
function mapModules(w) {
  const raw = Array.isArray(w.modules) ? w.modules : []
  const out = raw
    .map((m, i) => {
      const key = m?._key || `${m?._type || 'm'}-${i}`
      if (m?._type === 'moduleImage') {
        const image = imageOf(m.image, `${w.title} ${m.title || ''}`.trim())
        if (!image) return null
        return {
          key,
          kind: 'image',
          title: m.title || '',
          caption: m.caption || '',
          width: m.width || 'wide',
          image,
        }
      }
      if (m?._type === 'moduleGallery') {
        const images = (m.images || []).map((img) => imageOf(img, w.title)).filter(Boolean)
        if (!images.length) return null
        return {
          key,
          kind: 'gallery',
          title: m.title || '',
          caption: m.caption || '',
          columns: m.columns === '3' ? 3 : 2,
          images,
        }
      }
      if (m?._type === 'moduleVideo') {
        const video = videoOf(m, w.title)
        if (!video) return null
        return { key, kind: 'video', title: m.title || '', width: m.width || 'wide', video }
      }
      if (m?._type === 'moduleText') {
        const image = imageOf(m.image, w.title)
        if (!m.text && !image) return null
        return {
          key,
          kind: 'text',
          title: m.title || '',
          text: m.text || '',
          image,
          position: m.imagePosition === 'left' ? 'left' : 'right',
        }
      }
      return null
    })
    .filter(Boolean)

  // 旧数据兜底：还没建模块时，把旧图集当作一个画廊模块
  if (!out.length) {
    const images = (w.gallery || []).map((g) => imageOf(g, w.title)).filter(Boolean)
    if (images.length) {
      out.push({
        key: 'legacy-gallery',
        kind: 'gallery',
        title: '',
        caption: '',
        columns: 2,
        images,
      })
    }
  }
  return out
}

export function mapWorks(raw = []) {
  return raw.map((w, i) => {
    const cover = mapCover(w, 'cover')
    // 详情页首屏大图：后台指定了就用它，否则沿用封面
    const detail = mapCover(w, 'detailCover')
    const hasDetail = Boolean(detail.coverImage || detail.coverVideo)
    return {
      title: w.title,
      tag: w.category || '作品',
      tone: tone(i),
      ...cover,
      detailMedia: hasDetail ? detail : cover,
      gallery: (w.gallery || [])
        .map((g) => ({ url: assetUrl(g?.asset?._ref) || '', alt: g?.alt || w.title || '' }))
        .filter((g) => g.url),
      modules: mapModules(w),
      slug: w.slug || '',
      year: w.year || '',
      summary: w.summary || '',
      description: w.description || '',
      featured: Boolean(w.featured),
      hideFromGrid: Boolean(w.hideFromGrid),
      sortOrder: w.sortOrder ?? i,
      createdAt: w.createdAt,
      updatedAt: w.updatedAt,
    }
  })
}

// 作品区卡片：只取卡墙 + 作品带之后的作品，与上面两个板块不重复。
// 每张卡由 3 个方框组成（左二小 + 右一大），三个方框分别是三个不同作品，
// 整个作品区内每个作品只出现一次。
const toCardWork = (w) => ({
  name: w.title,
  cat: w.tag || '作品',
  slug: w.slug,
  coverType: w.coverType,
  cover: w.cover,
  coverSrcSet: w.coverSrcSet,
  coverAlt: w.coverAlt,
  coverImage: w.coverImage,
  coverVideo: w.coverVideo,
})

export function mapProjects(works = []) {
  const offset = HERO_WORK_COUNT + MARQUEE_WORK_COUNT
  const listed = works.filter((w) => !w.hideFromGrid)
  const pool = listed.slice(offset)
  const cards = []
  for (let i = 0; i < pool.length; i += 3) {
    const group = pool.slice(i, i + 3)
    cards.push({
      num: String(cards.length + 1).padStart(2, '0'),
      ...projectTone(cards.length),
      main: toCardWork(group[0]),
      sides: group.slice(1).map(toCardWork),
      digest: null,
    })
  }

  // 集锦长图（勾了「不参与首页列表」的素材）在后台顺序里紧跟在它所服务的那组作品后面：
  // 数一下它前面有多少个上列表作品，就能换算成卡片序号，挂到该卡右上角的按钮上。
  let visibleBefore = 0
  for (const w of works) {
    if (!w.hideFromGrid) {
      visibleBefore += 1
      continue
    }
    if (!w.slug) continue
    const lastPoolIndex = visibleBefore - 1 - offset
    if (lastPoolIndex < 0) continue
    const card = cards[Math.floor(lastPoolIndex / 3)]
    if (card && !card.digest) card.digest = { slug: w.slug, title: w.title || '' }
  }

  return cards
}

export function mapProfile(raw = {}, settings = null) {
  const s = settings || {}
  return {
    name: s.name || raw.name || '丁宝强',
    nameEn: raw.nameEn || 'DING BAOQIANG',
    role: raw.role || '电商视觉设计师',
    roleEn: raw.roleEn || 'E-COMMERCE VISUAL DESIGNER',
    location: s.location || raw.location || '广州',
    email: s.contactEmail || raw.email || '2998934782@qq.com',
    phone: s.contactPhone || raw.phone || '17884799794',
    status: raw.status || '可接新项目 / 全职机会',
    avatar: assetUrl(raw.avatar?.asset?._ref, 600) || '/media/avatar.png',
    intro: Array.isArray(raw.intro) && raw.intro.length ? raw.intro : fallbackProfile.intro,
    fields: Array.isArray(raw.fields) && raw.fields.length ? raw.fields : fallbackProfile.fields,
    stats:
      Array.isArray(raw.stats) && raw.stats.length
        ? raw.stats.filter((x) => x && (x.num || x.label))
        : fallbackProfile.stats,
    skills:
      Array.isArray(raw.skills) && raw.skills.length ? raw.skills : fallbackProfile.skills,
    siteTitle: s.siteTitle || '',
    footerNote: s.footerNote || '',
  }
}

export function mapExperience(raw = []) {
  return raw.map((e, i) => ({
    time: e.time || '',
    company: e.company || '',
    title: e.title || '',
    points: Array.isArray(e.points) ? e.points : [],
    sortOrder: e.sortOrder ?? i,
  }))
}

export function mapAll({ works = [], experience = [], profile = {}, siteSettings = null }) {
  const mapped = mapWorks(works)
  // 首页三板块只用「上列表」的作品；被标记为素材的集锦长图仍然可以单独打开详情页，
  // 所以另外给一份 allWorks，详情页查找时用它。
  const listed = mapped.filter((w) => !w.hideFromGrid)
  return {
    works: listed,
    allWorks: mapped,
    projects: mapProjects(mapped),
    profile: mapProfile(profile, siteSettings),
    experience: mapExperience(experience),
    siteSettings,
  }
}
