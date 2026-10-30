// 作品媒体相关 schema：封面（图片 / 视频）+ 详情页媒体模块
// 说明：
//  · 上传进度、缩略图预览、替换/删除按钮由 Sanity Studio 原生提供（拖入文件即显示进度条与缩略图）
//  · 这里补充的是「格式 + 体积」校验，以及删除被引用资源时的提示
//  · 图片前台走 Sanity 图片管线（宽高/质量/格式参数 + srcset 响应式），国内另有本地镜像兜底

const MAX_IMAGE_MB = 20
const MAX_VIDEO_MB = 400

const IMAGE_EXT = ['jpg', 'jpeg', 'png', 'webp', 'gif', 'avif']
const VIDEO_EXT = ['mp4', 'webm', 'mov', 'm4v', 'ogv']

const extOf = (ref = '') => ref.split('-').pop()?.toLowerCase()

/** 图片格式 + 体积校验（异步读取资源体积，读不到时不阻塞保存） */
async function validateImage(value, context) {
  if (!value) return true
  const ref = value?.asset?._ref
  if (!ref) return '请上传图片'
  const ext = extOf(ref)
  if (!IMAGE_EXT.includes(ext)) {
    return `不支持的图片格式 .${ext}，请使用 JPG / PNG / WebP / GIF / AVIF`
  }
  try {
    const asset = await context
      .getClient({ apiVersion: '2025-01-01' })
      .fetch('*[_id == $id][0]{size}', { id: ref })
    const mb = (asset?.size || 0) / 1024 / 1024
    if (mb > MAX_IMAGE_MB) {
      return `图片体积 ${mb.toFixed(1)}MB，超过 ${MAX_IMAGE_MB}MB 上限，请压缩后再上传`
    }
  } catch {
    // 离线或无权限时跳过体积校验，不阻塞编辑
  }
  return true
}

/** 视频格式 + 体积校验 */
async function validateVideo(value, context) {
  if (!value) return true
  const ref = value?.asset?._ref
  if (!ref) return true
  const ext = extOf(ref)
  if (!VIDEO_EXT.includes(ext)) {
    return `不支持的视频格式 .${ext}，请使用 MP4（推荐）/ WebM / MOV`
  }
  try {
    const asset = await context
      .getClient({ apiVersion: '2025-01-01' })
      .fetch('*[_id == $id][0]{size}', { id: ref })
    const mb = (asset?.size || 0) / 1024 / 1024
    if (mb > MAX_VIDEO_MB) {
      return `视频体积 ${mb.toFixed(1)}MB，超过 ${MAX_VIDEO_MB}MB 上限，请压缩或改用视频地址外链`
    }
  } catch {
    // 同上
  }
  return true
}

const altField = {
  name: 'alt',
  title: '替代文本 alt',
  type: 'string',
  description: '图片加载失败或读屏时显示的文字，建议简短描述画面内容',
  validation: (Rule) => Rule.max(160).warning('过长的替代文本会被截断'),
}

const videoFields = () => [
  {
    name: 'videoFile',
    title: '视频文件',
    type: 'file',
    options: { accept: 'video/*' },
    description: '直接上传（支持 MP4 / WebM / MOV，建议 ≤ 400MB）。与下方「视频地址」二选一',
    validation: (Rule) => Rule.custom(validateVideo),
  },
  {
    name: 'videoUrl',
    title: '或填写视频地址 (URL)',
    type: 'url',
    description: '外链视频（如 CDN / 对象存储直链），填写后优先于上传文件',
  },
  {
    name: 'poster',
    title: '视频 Poster（封面帧）',
    type: 'image',
    options: { hotspot: true },
    description: '视频加载前 / 不自动播放时显示的图片，建议与视频首帧一致',
    fields: [altField],
    validation: (Rule) => Rule.custom(validateImage),
  },
  {
    name: 'autoplay',
    title: '自动播放',
    type: 'boolean',
    initialValue: true,
  },
  {
    name: 'loop',
    title: '循环播放',
    type: 'boolean',
    initialValue: true,
  },
  {
    name: 'muted',
    title: '静音播放',
    type: 'boolean',
    initialValue: true,
    description: '浏览器要求：自动播放的视频必须静音',
  },
]

// ---------- 封面：图片 / 视频二选一 ----------

export const coverType = {
  name: 'cover',
  title: '作品封面',
  type: 'object',
  options: { collapsible: true, collapsed: false },
  description: '首页卡片与作品详情页首屏主视觉，可选择图片或视频',
  fields: [
    {
      name: 'type',
      title: '媒体类型',
      type: 'string',
      initialValue: 'image',
      options: {
        list: [
          { title: '图片', value: 'image' },
          { title: '视频', value: 'video' },
        ],
        layout: 'radio',
      },
      validation: (Rule) => Rule.required().error('请选择封面类型'),
    },
    // —— 图片类型字段 ——
    {
      name: 'image',
      title: '封面图片',
      type: 'image',
      options: { hotspot: true },
      description: '在图上拖动圆点设置焦点，前台会按卡片比例智能裁切，保证主体不被切掉',
      fields: [altField],
      hidden: ({ parent }) => (parent?.type || 'image') !== 'image',
      validation: (Rule) => Rule.custom(validateImage),
    },
    // —— 视频类型字段 ——
    ...videoFields().map((f) => ({
      ...f,
      hidden: ({ parent }) => parent?.type !== 'video',
    })),
  ],
}

/** 封面必填校验（在 work.js 的字段上生效） */
export function validateCover(value) {
  if (!value) return '请设置作品封面'
  if (value.type === 'video') {
    if (!value.videoFile?.asset && !value.videoUrl) return '视频封面需要上传视频文件或填写视频地址'
  } else if (!value.image?.asset) {
    return '图片封面需要上传图片'
  }
  return true
}

/** 视频模块：文件或地址二选一 */
export function validateVideoModule(value) {
  if (!value) return true
  if (!value.videoFile?.asset && !value.videoUrl) return '请上传视频文件或填写视频地址'
  return true
}

// ---------- 详情页媒体模块 ----------

const moduleBase = (name, title, icon) => ({
  name,
  title,
  type: 'object',
  icon,
})

const widthField = {
  name: 'width',
  title: '显示宽度',
  type: 'string',
  options: {
    list: [
      { title: '通栏', value: 'full' },
      { title: '宽（默认）', value: 'wide' },
      { title: '窄 · 居中', value: 'narrow' },
    ],
    layout: 'radio',
  },
  initialValue: 'wide',
}

export const moduleImage = {
  ...moduleBase('moduleImage', '单张图片', 'image'),
  fields: [
    { name: 'title', title: '模块标题（选填）', type: 'string' },
    {
      name: 'image',
      title: '图片',
      type: 'image',
      options: { hotspot: true },
      fields: [altField],
      validation: (Rule) => Rule.required().custom(validateImage),
    },
    { name: 'caption', title: '图片说明（选填）', type: 'string' },
    widthField,
  ],
  preview: {
    select: { title: 'title', subtitle: 'caption', media: 'image' },
    prepare: ({ title, subtitle, media }) => ({
      title: title || '单张图片',
      subtitle,
      media,
    }),
  },
}

export const moduleGallery = {
  ...moduleBase('moduleGallery', '多图画廊', 'images'),
  fields: [
    { name: 'title', title: '模块标题（选填）', type: 'string' },
    {
      name: 'images',
      title: '图片（可多张，拖拽排序）',
      type: 'array',
      of: [
        {
          type: 'image',
          options: { hotspot: true },
          fields: [altField, { name: 'caption', title: '单图说明（选填）', type: 'string' }],
          validation: (Rule) => Rule.custom(validateImage),
        },
      ],
      validation: (Rule) => Rule.min(2).error('画廊至少需要 2 张图片'),
    },
    {
      name: 'columns',
      title: '每行张数',
      type: 'string',
      options: {
        list: [
          { title: '2 列', value: '2' },
          { title: '3 列', value: '3' },
        ],
        layout: 'radio',
      },
      initialValue: '2',
    },
    { name: 'caption', title: '整组说明（选填）', type: 'string' },
  ],
  preview: {
    select: { title: 'title', media: 'images.0' },
    prepare: ({ title, media }) => ({ title: title || '多图画廊', media }),
  },
}

export const moduleVideo = {
  ...moduleBase('moduleVideo', '视频', 'play'),
  fields: [
    { name: 'title', title: '模块标题（选填）', type: 'string' },
    ...videoFields(),
    widthField,
  ],
  preview: {
    select: { title: 'title', media: 'poster' },
    prepare: ({ title, media }) => ({ title: title || '视频模块', media }),
  },
}

export const moduleText = {
  ...moduleBase('moduleText', '图文模块', 'block-content'),
  fields: [
    { name: 'title', title: '小标题（选填）', type: 'string' },
    {
      name: 'text',
      title: '正文',
      type: 'text',
      rows: 6,
      description: '空行分段，换行会保留',
    },
    {
      name: 'image',
      title: '配图（选填）',
      type: 'image',
      options: { hotspot: true },
      fields: [altField],
      validation: (Rule) => Rule.custom(validateImage),
    },
    {
      name: 'imagePosition',
      title: '配图位置',
      type: 'string',
      options: {
        list: [
          { title: '图在右', value: 'right' },
          { title: '图在左', value: 'left' },
        ],
        layout: 'radio',
      },
      initialValue: 'right',
      hidden: ({ parent }) => !parent?.image?.asset,
    },
  ],
  preview: {
    select: { title: 'title', subtitle: 'text', media: 'image' },
    prepare: ({ title, subtitle, media }) => ({
      title: title || '图文模块',
      subtitle: subtitle?.slice(0, 60),
      media,
    }),
  },
}

export const mediaModuleTypes = [moduleImage, moduleGallery, moduleVideo, moduleText]
