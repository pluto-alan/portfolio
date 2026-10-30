import { useEffect, useRef } from 'react'

/**
 * 统一媒体渲染：图片走 Sanity 图片管线（srcset 响应式 + 本地镜像），
 * 视频按后台开关控制自动播放 / 循环 / 静音，全部内联播放（移动端不接管全屏）。
 */

export function MediaImage({ image, alt, className, sizes = '100vw', loading = 'lazy', style }) {
  if (!image?.src) return null
  return (
    <img
      className={className}
      src={image.src}
      srcSet={image.srcSet || undefined}
      sizes={sizes}
      alt={alt ?? image.alt ?? ''}
      loading={loading}
      decoding="async"
      style={style}
    />
  )
}

export function MediaVideo({ video, className, sizes, style, controls = false }) {
  const ref = useRef(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    // React 的 muted 属性在部分浏览器不生效，这里强制同步一次
    el.muted = video?.muted !== false
    if (video?.autoplay) {
      const p = el.play()
      if (p?.catch) p.catch(() => {}) // 浏览器策略拦截时静默失败，保留 poster
    } else {
      el.pause()
    }
  }, [video?.src, video?.autoplay, video?.muted])

  if (!video?.src) return null

  return (
    <video
      ref={ref}
      className={className}
      style={style}
      src={video.src}
      poster={video.poster?.src || undefined}
      autoPlay={Boolean(video.autoplay)}
      loop={Boolean(video.loop)}
      muted={video.muted !== false}
      playsInline
      preload={video.autoplay ? 'auto' : 'metadata'}
      controls={controls}
    />
  )
}

/** 作品封面（图片或视频），item 为 mapper 输出的作品对象 */
export default function CoverMedia({ item, className, sizes = '100vw', controls = false }) {
  if (!item) return null
  if (item.coverType === 'video' && item.coverVideo) {
    return <MediaVideo video={item.coverVideo} className={className} style={{ width: '100%', height: '100%' }} controls={controls} />
  }
  const image =
    item.coverImage || (item.cover ? { src: item.cover, srcSet: item.coverSrcSet, alt: item.coverAlt } : null)
  return <MediaImage image={image} className={className} sizes={sizes} alt={item.coverAlt || item.title || ''} />
}
