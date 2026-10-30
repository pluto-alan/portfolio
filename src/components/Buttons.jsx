import { useContent } from '../content.jsx'
import { openWork } from '../router.js'

/** 渐变胶囊按钮（封面风）：紫色渐变 + 白色内描边 */
export function ContactButton({ label = '联系我', href }) {
  const { profile } = useContent()
  return (
    <a className="btn-gradient" href={href || `mailto:${profile.email}`}>
      {label}
    </a>
  )
}

/** 幽灵描边按钮：作品卡右上角的"查看案例 / 查看集锦"，传 slug 时走站内详情页 */
export function LiveProjectButton({ label = '查看案例', href = '#', slug = '' }) {
  return (
    <a
      className="btn-ghost2"
      href={slug ? `?work=${slug}` : href}
      onClick={(e) => {
        if (slug) {
          e.preventDefault()
          openWork(slug)
          return
        }
        if (href === '#') e.preventDefault()
      }}
    >
      {label}
    </a>
  )
}
