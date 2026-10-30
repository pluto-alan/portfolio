import { useEffect, useRef } from 'react'
import CoverMedia from './WorkMedia.jsx'
import { useContent } from '../content.jsx'
import { openWork } from '../router.js'
import { HERO_WORK_COUNT, MARQUEE_WORK_COUNT } from '../config.js'

/**
 * 滚动驱动双向作品带：
 * 两行作品随页面滚动反向平移一次（row1 向右、row2 向左），滑到头即停。
 * 不复制、不循环——每个作品只出现一次。
 */
export default function Marquee() {
  const { works } = useContent()
  const sectionRef = useRef(null)
  const row1Ref = useRef(null)
  const row2Ref = useRef(null)

  // 卡墙占用最前的作品，作品区从这批之后开始；这里只展示中间这一段
  const rest = works.slice(HERO_WORK_COUNT, HERO_WORK_COUNT + MARQUEE_WORK_COUNT)
  const half = Math.ceil(rest.length / 2)
  const rowA = rest.slice(0, half)
  const rowB = rest.slice(half)

  useEffect(() => {
    let ticking = false
    // 每行的可滑动幅度 = 视口宽 - 行宽（行从一端滑到另一端，不出界）
    let ms1 = 0
    let ms2 = 0

    const measure = () => {
      ms1 = row1Ref.current
        ? Math.max(0, window.innerWidth - row1Ref.current.scrollWidth)
        : 0
      ms2 = row2Ref.current
        ? Math.max(0, window.innerWidth - row2Ref.current.scrollWidth)
        : 0
    }

    const isMobile = () => window.innerWidth <= 768

    const update = () => {
      ticking = false
      // 小屏：行改为原生手势横滑（CSS overflow-x auto），不再用 transform 驱动
      if (isMobile()) {
        if (row1Ref.current) row1Ref.current.style.transform = ''
        if (row2Ref.current) row2Ref.current.style.transform = ''
        return
      }
      const section = sectionRef.current
      if (!section) return
      const sectionTop = section.getBoundingClientRect().top + window.scrollY
      const raw = (window.scrollY - sectionTop + window.innerHeight) * 0.3
      const shift = Math.min(Math.max(raw / 400, 0), 1) // 0 → 1，滑完即停
      if (row1Ref.current) {
        row1Ref.current.style.transform = `translateX(${shift * ms1}px)`
      }
      if (row2Ref.current) {
        row2Ref.current.style.transform = `translateX(${(1 - shift) * ms2}px)`
      }
    }

    const onScroll = () => {
      if (!ticking) {
        ticking = true
        requestAnimationFrame(update)
      }
    }

    measure()
    update()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', () => {
      measure()
      onScroll()
    })
    return () => {
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
    }
  }, [])

  // 没有分到作品时整个作品带不渲染
  if (!rest.length) return null

  const tile = (w, key) => (
    <a
      className="marquee__tile"
      key={key}
      href={w.slug ? `?work=${w.slug}` : '#projects'}
      onClick={(e) => {
        if (!w.slug) return
        e.preventDefault()
        openWork(w.slug)
      }}
      style={{ background: `linear-gradient(135deg, ${w.tone[0]}, ${w.tone[1]})` }}
    >
      <CoverMedia item={w} className="marquee__tile-img" sizes="(max-width: 1200px) 80vw, 560px" />
      <span className="marquee__tile-tag">{w.tag}</span>
      <span className="marquee__tile-title">{w.title}</span>
    </a>
  )

  return (
    <section className="marquee" ref={sectionRef}>
      <div className="marquee__row-clip">
        <div className="marquee__row" ref={row1Ref} style={{ willChange: 'transform' }}>
          {rowA.map((w, i) => tile(w, `a${i}`))}
        </div>
      </div>
      {rowB.length > 0 && (
        <div className="marquee__row-clip">
          <div className="marquee__row" ref={row2Ref} style={{ willChange: 'transform' }}>
            {rowB.map((w, i) => tile(w, `b${i}`))}
          </div>
        </div>
      )}
    </section>
  )
}
