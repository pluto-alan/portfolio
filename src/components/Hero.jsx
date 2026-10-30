import FadeIn from './FadeIn.jsx'
import CoverMedia from './WorkMedia.jsx'
import { useContent } from '../content.jsx'
import { openWork } from '../router.js'
import { HERO_WORK_COUNT } from '../config.js'

const links = [
  { label: '关于', href: '#about' },
  { label: '服务', href: '#services' },
  { label: '作品', href: '#projects' },
  { label: '联系', href: '#contact' },
]

// 弧形卡墙：沿一道上拱的弧线排布，中间高、两侧低、随弧线旋转
const ARC_TILT = 18   // 边缘最大旋转角（deg）
const ARC_DROP = 9    // 边缘下沉量（vh）

export default function Hero() {
  const { works, siteSettings } = useContent()
  const line1 = siteSettings?.heroLine1 || '2026'
  const line2 = siteSettings?.heroLine2 || '作品集'
  const midText = siteSettings?.heroMid || '用设计讲好产品故事，让每一次视觉表达都更有价值。'
  // 首屏弧形卡墙固定展示前 HERO_WORK_COUNT 个作品；之后的交给作品带与作品区，互不重复
  const featured = works.slice(0, HERO_WORK_COUNT)
  const n = featured.length
  // 卡片数量变少时收拢弧线跨度，保持排布紧凑
  const arcSpread = Math.min(46, 10 + n * 5)
  const cards = featured.map((w, i) => {
    const t = (i - (n - 1) / 2) / ((n - 1) / 2) // -1 ~ 1
    return {
      ...w,
      x: t * arcSpread,
      y: t * t * ARC_DROP,
      r: t * ARC_TILT,
      z: 10 - Math.round(Math.abs(t) * 4),
    }
  })

  return (
    <section className="hero" id="top">
      {/* 导航 */}
      <FadeIn y={-20} delay={0}>
        <nav className="topnav">
          {links.map((l) => (
            <a key={l.href} className="topnav__link" href={l.href}>{l.label}</a>
          ))}
        </nav>
      </FadeIn>

      {/* 错位双行巨型标题 */}
      <div className="hero__heading-wrap">
        <FadeIn y={40} delay={0.15}>
          <h1 className="hero-heading hero__line hero__line--1">{line1}</h1>
        </FadeIn>
        <FadeIn y={40} delay={0.28}>
          <h1 className="hero-heading hero__line hero__line--2">{line2}</h1>
        </FadeIn>
      </div>

      {/* 偏左下的小字说明 */}
      <FadeIn y={20} delay={0.42}>
        <p className="hero__mid">
          {midText}
        </p>
      </FadeIn>

      {/* 底部弧形作品卡墙 */}
      <div className="hero__arc" aria-hidden="true">
        {cards.map((c, i) => (
          <FadeIn key={i} y={60} delay={0.5 + i * 0.06} className="hero__arc-item"
            style={{
              '--cx': `${c.x}vw`,
              '--cy': `${c.y}vh`,
              '--cr': `${c.r}deg`,
              zIndex: c.z,
            }}
          >
            <a
              className="hero__card"
              href={c.slug ? `?work=${c.slug}` : '#projects'}
              onClick={(e) => {
                if (!c.slug) return
                e.preventDefault()
                openWork(c.slug)
              }}
              style={{ background: `linear-gradient(160deg, ${c.tone[0]}, ${c.tone[1]})` }}
            >
              <CoverMedia item={c} className="hero__card-cover" sizes="(max-width: 900px) 45vw, 224px" />
              <span className="hero__card-tag">{c.tag}</span>
              <span className="hero__card-title">{c.title}</span>
            </a>
          </FadeIn>
        ))}
      </div>

    </section>
  )
}
