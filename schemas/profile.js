// 个人信息（单例）— 关于我板块的内容来源
export default {
  name: 'profile',
  title: '个人简介',
  type: 'document',
  __experimental_actions: ['create', 'update', 'delete', 'publish'], // 允许修改，不设锁
  fields: [
    { name: 'name', title: '姓名', type: 'string' },
    { name: 'nameEn', title: '英文名', type: 'string' },
    { name: 'role', title: '职位', type: 'string' },
    { name: 'roleEn', title: '职位（英文大写）', type: 'string' },
    { name: 'avatar', title: '形象照', type: 'image', options: { hotspot: true } },
    {
      name: 'intro',
      title: '介绍段落（每条一段）',
      type: 'array',
      of: [{ type: 'string' }],
    },
    {
      name: 'fields',
      title: '方向标签',
      type: 'array',
      of: [{ type: 'string' }],
    },
    {
      name: 'stats',
      title: '数据统计',
      type: 'array',
      of: [
        {
          type: 'object',
          name: 'stat',
          title: '数据项',
          fields: [
            { name: 'num', title: '数字', type: 'string' },
            { name: 'label', title: '说明', type: 'string' },
          ],
          preview: { title: 'num', subtitle: 'label' },
        },
      ],
    },
    {
      name: 'skills',
      title: '技能标签',
      type: 'array',
      of: [{ type: 'string' }],
    },
    { name: 'email', title: '邮箱', type: 'string' },
    { name: 'phone', title: '电话', type: 'string' },
    { name: 'location', title: '城市', type: 'string' },
    { name: 'status', title: '状态（如 可接新项目 / 全职机会）', type: 'string' },
  ],
  preview: {
    select: { title: 'name', subtitle: 'role', media: 'avatar' },
  },
}
