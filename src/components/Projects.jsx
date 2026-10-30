import FadeIn from './FadeIn.jsx'
import CoverMedia from './WorkMedia.jsx'
import { LiveProjectButton } from './Buttons.jsx'
import { useContent } from '../content.jsx'
import { openWork } from '../router.js'

function WorkBox({ w, className, sizes }) {
  // 单个作品方框：整块可点击进详情，底部挂作品名
  return (
    <a
      className={`proj-img ${className}`}
      href={w.slug ? `?work=${w.slug}` : '#projects'}
      onClick={(e) => {
        if (!w.slug) return
        e.preventDefault()
        openWork(w.slug)
      }}
      style={{ background: `linear-gradient(135deg, ${w.tone?.[0] || '#1c1c1e'}, ${w.tone?.[1] || '#2a2a2e'})` }}
    >
      <CoverMedia item={w} className="proj-img__cover" sizes={sizes} />
      <span className="proj-img__name">{w.name}</span>
    </a>
  )
}

function ProjectCard({ p }) {
  const single = p.sides.length === 0
  return (
    <article className={`proj-card${single ? ' proj-card--single' : ''}`}>
      <div className="proj-card__top">
        <span className="proj-card__num hero-heading">{p.num}</span>
        <span className="proj-card__cat">{p.main.cat}</span>
        <h3 className="proj-card__name">{p.main.name}</h3>
        {/* 右上角：有集锦大图就跳集锦，没有就跳本卡第一个作品 */}
        <LiveProjectButton
          slug={p.digest?.slug || p.main.slug}
          label={p.digest ? '查看集锦' : '查看案例'}
        />
      </div>
      <div className="proj-card__grid">
        {!single && (
          <div className="proj-card__col1">
            {p.sides.map((w, i) => (
              <WorkBox key={w.slug || i} w={w} className={`proj-img--s${i + 1}`} sizes="420px" />
            ))}
          </div>
        )}
        <WorkBox w={{ ...p.main, tone: p.big }} className="proj-img--big" sizes="(max-width: 1400px) 60vw, 900px" />
      </div>
    </article>
  )
}

// 作品区：普通文档流排列，每张作品是一个完整板块，随页面滚动依次出现在下方
export default function Projects() {
  const { projects } = useContent()

  if (!projects.length) return null

  return (
    <section className="projects2" id="projects">
      <FadeIn y={40}>
        <h2 className="hero-heading projects2__heading">作品</h2>
      </FadeIn>
      <div className="projects2__list">
        {projects.map((p) => (
          <ProjectCard key={p.num} p={p} />
        ))}
      </div>
    </section>
  )
}
