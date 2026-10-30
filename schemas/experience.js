// 工作经历文档 — 履历时间线内容，支持多条、按 sortOrder 排序
export default {
  name: 'experience',
  title: '工作经历',
  type: 'document',
  fields: [
    { name: 'time', title: '时间段（如 2025 — 2026）', type: 'string' },
    { name: 'company', title: '公司', type: 'string' },
    { name: 'title', title: '职位', type: 'string' },
    {
      name: 'points',
      title: '工作要点',
      type: 'array',
      of: [{ type: 'string' }],
    },
    { name: 'sortOrder', title: '展示顺序（数字越小越靠前）', type: 'number', initialValue: 0 },
  ],
  orderings: [
    { title: '展示顺序', name: 'sortOrderAsc', by: [{ field: 'sortOrder', direction: 'asc' }] },
  ],
  preview: {
    select: { title: 'company', subtitle: 'title', media: 'time' },
    prepare({ title, subtitle, media }) {
      return { title, subtitle: [subtitle, media].filter(Boolean).join(' · ') }
    },
  },
}
