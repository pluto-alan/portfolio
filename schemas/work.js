// 作品文档 — 后台可增删改、拖拽排序
// 状态说明：Sanity 原生「草稿/已发布」机制即 status 字段——
//   未发布的文档自动存为 draft（不出现在正式网站），点击 Publish 后才生效
//   createdAt / updatedAt 使用系统自带的 _createdAt / _updatedAt，无需手填
import { orderRankField } from '@sanity/orderable-document-list'
import {
  coverType,
  mediaModuleTypes,
  validateCover,
  validateVideoModule,
} from './objects/media.js'

export default {
  name: 'work',
  title: '作品',
  type: 'document',
  fields: [
    {
      name: 'title',
      title: '标题',
      type: 'string',
      validation: (Rule) => Rule.required().error('必填'),
    },
    {
      name: 'slug',
      title: '唯一地址 (slug)',
      type: 'slug',
      options: { source: 'title', maxLength: 96 },
      validation: (Rule) => Rule.required().error('必填，点击 Generate 自动生成'),
    },
    {
      name: 'year',
      title: '年份',
      type: 'number',
      initialValue: 2026,
    },
    {
      name: 'category',
      title: '分类',
      type: 'string',
      options: {
        list: ['电商设计', '海报设计', 'VI 设计', '线下物料'],
      },
    },
    {
      name: 'summary',
      title: '项目摘要',
      type: 'text',
      rows: 3,
    },
    {
      name: 'description',
      title: '项目详细文案',
      type: 'text',
      rows: 8,
    },
    // 封面：图片 / 视频二选一，选类型后只显示对应字段
    {
      ...coverType,
      name: 'cover',
      title: '作品封面（图片 / 视频）',
      validation: (Rule) => Rule.custom(validateCover),
    },
    // 详情页首屏大图：留空则沿用封面；用于「卡片用局部图、点进去看完整长图」的场景
    {
      ...coverType,
      name: 'detailCover',
      title: '详情页大图（选填 · 留空则用封面）',
      description:
        '点击作品进入详情页后首屏展示的大图。留空则使用上方「作品封面」；可以单独指定一张完整稿 / 长图，卡片缩略图不受影响',
      options: { collapsible: true, collapsed: true },
    },
    // 详情页媒体模块：可增删、可拖拽自由排序
    {
      name: 'modules',
      title: '详情页内容模块（可拖拽排序）',
      type: 'array',
      description:
        '按顺序自上而下展示。点击「+」添加模块：单张图片 / 多图画廊 / 视频 / 图文；拖动左侧手柄可调整顺序',
      of: [
        { ...mediaModuleTypes[0] },
        { ...mediaModuleTypes[1] },
        { ...mediaModuleTypes[2], validation: (Rule) => Rule.custom(validateVideoModule) },
        { ...mediaModuleTypes[3] },
      ],
      options: {
        insertMenu: {
          views: [{ name: 'grid', preview: 'media' }],
        },
      },
    },
    // 旧版图集：已并入详情页模块，保留字段仅为兼容历史数据
    {
      name: 'gallery',
      title: '作品图集（旧版，已迁移到详情页模块）',
      type: 'array',
      of: [
        {
          type: 'image',
          options: { hotspot: true },
          fields: [{ name: 'alt', title: '替代文本', type: 'string' }],
        },
      ],
      hidden: true,
    },
    // 拖拽排序字段（@sanity/orderable-document-list 要求，勿改名/删除）
    orderRankField({ type: 'work' }),
    {
      name: 'sortOrder',
      title: '展示顺序（旧版数字，已被拖拽排序取代）',
      type: 'number',
      initialValue: 0,
      hidden: true,
    },
    {
      name: 'featured',
      title: '是否精选',
      type: 'boolean',
      initialValue: false,
    },
    {
      name: 'hideFromGrid',
      title: '不参与首页列表',
      type: 'boolean',
      description:
        '用于「集锦长图」这类素材：它的作用是充当其他作品详情页的首屏大图，本身不单独成卡。勾选后不会出现在卡墙、作品带、作品区。',
      initialValue: false,
    },
  ],
  orderings: [
    {
      title: '展示顺序',
      name: 'sortOrderAsc',
      by: [{ field: 'sortOrder', direction: 'asc' }],
    },
    {
      title: '创建时间（新→旧）',
      name: 'createdDesc',
      by: [{ field: '_createdAt', direction: 'desc' }],
    },
  ],
  preview: {
    select: {
      title: 'title',
      subtitle: 'category',
      year: 'year',
      featured: 'featured',
      coverType: 'cover.type',
      image: 'cover.image',
      poster: 'cover.poster',
    },
    prepare({ title, subtitle, year, featured, coverType, image, poster }) {
      const tags = [subtitle, year, featured ? '★ 精选' : null, coverType === 'video' ? '视频封面' : null]
        .filter(Boolean)
      return { title, subtitle: tags.join(' · '), media: image || poster }
    },
  },
}
