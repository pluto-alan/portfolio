import { defineConfig } from 'sanity'
import { structureTool } from 'sanity/structure'
import { visionTool } from '@sanity/vision'
import { orderableDocumentListDeskItem } from '@sanity/orderable-document-list'
import { schemaTypes } from './schemas/index.js'

const projectId = import.meta.env.VITE_SANITY_PROJECT_ID || 'YOUR_PROJECT_ID'
const dataset = import.meta.env.VITE_SANITY_DATASET || 'production'

export default defineConfig({
  name: 'portfolio',
  title: '丁宝强 · 作品集后台',
  projectId,
  dataset,
  basePath: '/studio', // 与 Vite 路由一致：/studio 即后台根路径
  plugins: [
    structureTool({
      structure: (S, context) =>
        S.list()
          .id('root') // Sanity v6 要求根列表显式 id，否则序列化报 "'id' is required for lists"
          .title('内容管理')
          .items([
            // 作品：支持拖拽排序 / 复制 / 删除
            orderableDocumentListDeskItem({
              type: 'work',
              title: '作品',
              S,
              context,
            }),
            S.listItem()
              .id('experience-list')
              .title('工作经历')
              .child(S.documentTypeList('experience').title('工作经历')),
            S.divider(),
            // 单例：全局信息与个人简介
            S.listItem()
              .id('profile-item')
              .title('个人简介')
              .child(S.document().schemaType('profile').documentId('profile')),
            S.listItem()
              .id('siteSettings-item')
              .title('网站设置')
              .child(S.document().schemaType('siteSettings').documentId('siteSettings')),
          ]),
    }),
    visionTool(),
  ],
  schema: {
    types: schemaTypes,
  },
  document: {
    // 单例不允许新建重复文档
    newDocumentOptions: (prev) =>
      prev.filter((item) => !['profile', 'siteSettings'].includes(item.templateId)),
  },
})
