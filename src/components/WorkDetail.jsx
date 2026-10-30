import { useEffect } from 'react'
import FadeIn from './FadeIn.jsx'
import { MediaImage, MediaVideo } from './WorkMedia.jsx'
import { useContent } from '../content.jsx'
import { openWork, closeWork } from '../router.js'

function BackLink() {
  return (
    <a
      className="wd__back"
      href="./"
      onClick={(e) => {
        e.preventDefault()
        closeWork()
      }}
    >
      <span aria-hidden="true">←</span> 返回作品集
    </a>
  )
}

/** 单张图片模块 */
function ImageModule({ m }) {
  return (
    <section className={`wd-module wd-module--${m.width || 'wide'}`}>
      {m.title && <h2 className="wd-module__title">{m.title}</h2>}
      <figure className="wd-figure">
        <MediaImage
          image={m.image}
          className="wd-figure__img"
          sizes="(max-width: 1100px) 92vw, 1100px"
        />
        {m.caption && <figcaption className="wd-figure__cap">{m.caption}</figcaption>}
      </figure>
    </section>
  )
}

/** 多图画廊模块 */
function GalleryModule({ m }) {
  return (
    <section className={`wd-module wd-module--full wd-module--gallery cols-${m.columns || 2}`}>
      {m.title && <h2 className="wd-module__title">{m.title}</h2>}
      <div className="wd-gallery" style={{ '--cols': m.columns || 2 }}>
        {m.images.map((img, i) => (
          <figure className="wd-gallery__item" key={`${m.key}-${i}`}>
            <MediaImage
              image={img}
              className="wd-gallery__img"
              sizes={`(max-width: 900px) 92vw, ${Math.round(100 / (m.columns || 2))}vw`}
            />
            {img.caption && <figcaption className="wd-figure__cap">{img.caption}</figcaption>}
          </figure>
        ))}
      </div>
      {m.caption && <p className="wd-module__cap">{m.caption}</p>}
    </section>
  )
}

/** 视频模块 */
function VideoModule({ m }) {
  return (
    <section className={`wd-module wd-module--${m.width || 'wide'}`}>
      {m.title && <h2 className="wd-module__title">{m.title}</h2>}
      <div className="wd-video">
        <MediaVideo video={m.video} className="wd-video__el" controls />
      </div>
    </section>
  )
}

/** 图文模块：标题 + 正文 + 可选配图（左右可切换） */
function TextModule({ m }) {
  const paragraphs = String(m.text || '')
    .split(/\n{2,}/)
    .map((p) => p.trim())
    .filter(Boolean)

  return (
    <section className={`wd-module wd-module--wide wd-module--text ${m.image ? `img-${m.position}` : 'no-img'}`}>
      {m.title && <h2 className="wd-module__title">{m.title}</h2>}
      <div className="wd-text">
        <div className="wd-text__body">
          {paragraphs.map((p, i) => (
            <p key={i}>{p}</p>
          ))}
        </div>
        {m.image && (
          <figure className="wd-text__figure">
            <MediaImage image={m.image} className="wd-text__img" sizes="(max-width: 900px) 92vw, 520px" />
          </figure>
        )}
      </div>
    </section>
  )
}

const MODULES = {
  image: ImageModule,
  gallery: GalleryModule,
  video: VideoModule,
  text: TextModule,
}

export default function WorkDetail({ slug }) {
  // allWorks 含「集锦长图」这类不上首页列表的素材，作品区的「查看集锦」按钮要能打开它们
  const { allWorks } = useContent()
  const works = allWorks || []
  const index = works.findIndex((w) => w.slug === slug)
  const work = index >= 0 ? works[index] : null

  // 进入 / 切换作品时回到顶部
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'auto' })
  }, [slug])

  // Esc 返回列表
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') closeWork()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  if (!work) {
    return (
      <div className="wd wd--empty">
        <BackLink />
        <h1 className="wd__title">作品不存在</h1>
        <p className="wd__summary">链接可能已失效，或该作品尚未发布。</p>
      </div>
    )
  }

  const prev = index > 0 ? works[index - 1] : null
  const next = index < works.length - 1 ? works[index + 1] : null
  const total = String(works.length).padStart(2, '0')
  const num = String(index + 1).padStart(2, '0')
  // 首屏大图：后台设了「详情页大图」就用它，否则用封面
  const hero = work.detailMedia || work

  return (
    <article className="wd">
      <div className="wd__bar">
        <BackLink />
        <span className="wd__counter">
          {num} <span className="wd__counter-dim">/ {total}</span>
        </span>
      </div>

      <FadeIn y={24}>
        <header className="wd__head">
          <div className="wd__meta">
            <span>{work.tag}</span>
            {work.year ? <span>{work.year}</span> : null}
          </div>
          <h1 className="wd__title">{work.title}</h1>
          {work.summary ? <p className="wd__summary">{work.summary}</p> : null}
        </header>
      </FadeIn>

      <FadeIn y={30} delay={0.08}>
        <div className={`wd__cover ${hero.coverType === 'video' ? 'is-video' : ''}`}>
          {hero.coverType === 'video' && hero.coverVideo ? (
            <MediaVideo video={hero.coverVideo} className="wd__cover-media" controls />
          ) : (
            <MediaImage image={hero.coverImage} className="wd__cover-media" sizes="(max-width: 1200px) 100vw, 1400px" loading="eager" />
          )}
        </div>
      </FadeIn>

      {work.description ? (
        <FadeIn y={24} delay={0.12}>
          <p className="wd__desc">{work.description}</p>
        </FadeIn>
      ) : null}

      {work.modules.length ? (
        <div className="wd__modules">
          {work.modules.map((m) => {
            const Block = MODULES[m.kind]
            return Block ? <Block key={m.key} m={m} /> : null
          })}
        </div>
      ) : null}

      <nav className="wd__nav">
        {prev ? (
          <button type="button" className="wd__nav-btn" onClick={() => openWork(prev.slug)}>
            <span className="wd__nav-dir">← 上一个</span>
            <span className="wd__nav-name">{prev.title}</span>
          </button>
        ) : (
          <span />
        )}
        {next ? (
          <button type="button" className="wd__nav-btn wd__nav-btn--next" onClick={() => openWork(next.slug)}>
            <span className="wd__nav-dir">下一个 →</span>
            <span className="wd__nav-name">{next.title}</span>
          </button>
        ) : (
          <span />
        )}
      </nav>
    </article>
  )
}
