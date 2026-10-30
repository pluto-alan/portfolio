// ============================================================
// 网站内容配置 — 所有文案 / 数据集中在这里，改这一个文件即可
// 结构参考《丁宝强——电商作品集》PDF：四大板块 + 个人概述
// 标注 [待替换] 的数据是占位数字，请按真实项目情况修改
// ============================================================

export const profile = {
  name: '丁宝强',
  nameEn: 'DING BAOQIANG',
  role: '电商视觉设计师',
  roleEn: 'E-COMMERCE VISUAL DESIGNER',
  location: '广州',
  email: '2998934782@qq.com',
  phone: '17884799794',
  status: '可接新项目 / 全职机会',
  avatar: '/media/avatar.png', // 蓝帽 3D 形象照（已抠除白底），更换图片直接替换这个文件即可
  intro: [
    '拥有 3 年设计相关工作经验，专注电商视觉设计。从产品摄影、商品主图、详情页到品牌宣传物料，具备独立完成全链路视觉设计与交付的能力。',
    '坚持以商业目标为导向，结合市场趋势与数据反馈持续优化设计，让视觉不止于好看，更能传递产品价值。',
  ],
  fields: ['电商设计', '品牌设计', 'IP 设计', '物料设计'],
  stats: [
    { num: '6年', label: '设计相关经验' },
    { num: '3年', label: '电商视觉深耕' },
    { num: '200+', label: '详情页设计 [待替换]' },
    { num: '500+', label: '商品主图 [待替换]' },
  ],
  skills: ['Photoshop', 'Illustrator', 'CorelDRAW', 'Premiere', 'AI 工具', '产品摄影', '布光打光'],
}

// 四大作品板块 — 与作品集目录一致
export const chapters = [
  {
    id: 'ecommerce',
    num: '01',
    title: '电商设计',
    en: 'E-COMMERCE',
    desc: '商品主图、详情页与活动 banner：统一布光与拍摄标准，重构卖点层级，让产品讲得清楚、卖得出去。',
    items: ['商品主图', '详情页', 'Banner'],
    img: '/media/projects/ecommerce.jpg',
    tone: ['#cdd5ff', '#eef0ff'],
  },
  {
    id: 'poster',
    num: '02',
    title: '海报设计',
    en: 'POSTER',
    desc: '大促活动海报、朋友圈推广与店铺招牌：风格统一、节奏跟得上大促与日常更新。',
    items: ['活动海报', '推广素材', '店铺招牌'],
    img: '/media/projects/poster.jpg',
    tone: ['#e2d4ff', '#f5efff'],
  },
  {
    id: 'vi',
    num: '03',
    title: 'VI 设计',
    en: 'VI DESIGN',
    desc: '品牌视觉体系搭建：从标志规范到应用延展，保持品牌语言在大大小小的触点上不跑偏。',
    items: ['品牌规范', '视觉延展', 'IP 形象'],
    img: '/media/projects/vi.jpg',
    tone: ['#cde8ff', '#eef8ff'],
  },
  {
    id: 'material',
    num: '04',
    title: '线下物料',
    en: 'OFFLINE MATERIALS',
    desc: '展会物料、包装与线下宣传品：兼顾成本、工艺与呈现效果，让开箱与现场体验成为品牌记忆点。',
    items: ['包装设计', '展会物料', '宣传品'],
    img: '/media/projects/material.jpg',
    tone: ['#ffd9e8', '#fff3f8'],
  },
]

// 作品预览轮播 — 图片放 public/media/works/ 下对应文件名即可，缺图自动占位
export const works = [
  { title: '商品主图点击率优化', tag: '电商设计', img: '/media/works/w1.jpg', tone: ['#cdd5ff', '#eef0ff'] },
  { title: '详情页首屏设计', tag: '电商设计', img: '/media/works/w2.jpg', tone: ['#d4ccff', '#f2efff'] },
  { title: '大促活动海报', tag: '海报设计', img: '/media/works/w3.jpg', tone: ['#e2d4ff', '#f7f1ff'] },
  { title: '店铺 banner 更新', tag: '电商设计', img: '/media/works/w4.jpg', tone: ['#cde8ff', '#eff8ff'] },
  { title: '品牌视觉规范', tag: 'VI 设计', img: '/media/works/w5.jpg', tone: ['#cdd5ff', '#eef0ff'] },
  { title: '包装视觉方案', tag: '线下物料', img: '/media/works/w6.jpg', tone: ['#ffd9e8', '#fff4f8'] },
  { title: '朋友圈推广素材', tag: '海报设计', img: '/media/works/w7.jpg', tone: ['#d4e8ff', '#f0f7ff'] },
  { title: '展会物料设计', tag: '线下物料', img: '/media/works/w8.jpg', tone: ['#e2d4ff', '#f7f1ff'] },
]

export const strengths = [
  { title: '产品摄影与精修', desc: '布光、拍摄、精修全流程独立完成，保证产品图像达到电商投放标准，从源头提升素材质量。' },
  { title: '转化导向的详情页', desc: '先梳理卖点与信息层级，再做视觉表达，让页面不仅好看，更能承载用户决策路径。' },
  { title: '品牌与 IP 视觉', desc: '品牌视觉体系与 3D IP 形象设计经验，让品牌在店铺内外保持统一而有趣的表达。' },
  { title: '全链路物料交付', desc: '从线上主图到线下包装、展会物料，一站式交付，兼顾成本、工艺与呈现效果。' },
  { title: '跨团队协作', desc: '与运营、研发紧密配合，主动给出视觉侧建议，推动设计目标与业务目标对齐。' },
  { title: '数据驱动的迭代', desc: '根据市场热点与客户反馈持续调整商品展示与排版风格，用迭代代替一次性交付。' },
]

// 服务列表 — ServicesSection 白底区块
export const services = [
  { num: '01', name: '电商视觉设计', desc: '商品主图、详情页与 banner 的设计与优化：以转化为目标梳理卖点层级，让页面不仅好看，更能卖货。' },
  { num: '02', name: '产品摄影与精修', desc: '布光、拍摄、精修全流程独立完成，从源头保证产品图像达到电商投放标准。' },
  { num: '03', name: '营销海报与活动物料', desc: '大促活动海报、店铺招牌、朋友圈推广素材与 banner，风格统一、节奏跟得上大促与日常更新。' },
  { num: '04', name: '品牌与 IP 视觉', desc: '品牌视觉体系与 3D IP 形象设计，让品牌在店铺内外保持统一而有趣的表达。' },
  { num: '05', name: '包装与线下物料', desc: '包装结构、展会物料与线下宣传品设计，兼顾成本、工艺与呈现效果。' },
]

// 叠卡作品 — ProjectsSection（图片放 public/media/projects/ 后替换 tone 渐变为真实图）
export const projects = [
  {
    num: '01',
    cat: '客户项目',
    name: '电商视觉 · 主图与详情页',
    c1a: ['#cdd5ff', '#eef0ff'],
    c1b: ['#d4ccff', '#f2efff'],
    big: ['#7a70ff', '#cdd5ff'],
  },
  {
    num: '02',
    cat: '个人项目',
    name: '海报 · 大促活动视觉',
    c1a: ['#e2d4ff', '#f7f1ff'],
    c1b: ['#cde8ff', '#eff8ff'],
    big: ['#b600a8', '#e2d4ff'],
  },
  {
    num: '03',
    cat: '客户项目',
    name: 'VI · 品牌视觉体系',
    c1a: ['#cde8ff', '#f0f8ff'],
    c1b: ['#cdd5ff', '#eef0ff'],
    big: ['#7621b0', '#cde8ff'],
  },
  {
    num: '04',
    cat: '个人项目',
    name: '物料 · 包装与线下',
    c1a: ['#ffd9e8', '#fff3f8'],
    c1b: ['#e2d4ff', '#f7f1ff'],
    big: ['#be4c00', '#ffd9e8'],
  },
]

export const experience = [
  {
    time: '2025 — 2026',
    company: '广州优品生物',
    title: '电商视觉设计师',
    points: ['商品主图、详情页及产品展示图的设计与优化', '营销海报、店铺招牌、朋友圈素材与活动物料', '产品包装设计与优化，保障交付质量与效率'],
  },
  {
    time: '2024 — 2025',
    company: '广州市思蜀邦护医疗科技',
    title: '电商视觉设计师',
    points: ['产品图全流程拍摄与精细化处理', '详情页、主图、海报与 banner 的更新迭代', '配合运营研发达成产品目标，依据市场热点优化店铺排版'],
  },
  {
    time: '2023 — 2024',
    company: '广州超瑞光学科技',
    title: '外贸电商设计',
    points: ['详情页、海报与宣传材料设计，保持品牌视觉一致', '产品摄影：布光、拍摄、精修全流程把控', '定制化图像设计，增强产品展示效果'],
  },
]

export const education = {
  time: '2021 — 2024',
  school: '广州机电技师学院',
  major: '电子商务（市场营销 / 电商设计 / 新媒体）',
}
