// 网站全局信息（单例）— 首屏标题 / 联系信息 / 站点名称
export default {
  name: 'siteSettings',
  title: '网站设置',
  type: 'document',
  __experimental_actions: ['create', 'update', 'delete', 'publish'],
  fields: [
    { name: 'siteTitle', title: '网站标题（浏览器标签页）', type: 'string' },
    { name: 'heroLine1', title: '首屏大标题 第一行', type: 'string' },
    { name: 'heroLine2', title: '首屏大标题 第二行', type: 'string' },
    { name: 'heroMid', title: '首屏小字说明', type: 'text', rows: 2 },
    { name: 'contactEmail', title: '联系邮箱', type: 'string' },
    { name: 'contactPhone', title: '联系电话', type: 'string' },
    { name: 'location', title: '城市', type: 'string' },
    { name: 'footerNote', title: '页脚备注', type: 'string' },
  ],
  preview: {
    select: { title: 'siteTitle', subtitle: 'heroLine1' },
  },
}
