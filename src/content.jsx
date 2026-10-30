import { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react'
import * as fallback from './data.js'
import { hasSanity, activeClient, CONTENT_QUERY, isPreview } from './sanity/client.js'
import { mapAll, mapProjects } from './sanity/mappers.js'

// 本地兜底数据 → 与 CMS 输出同构
function buildFallback() {
  const works = fallback.works.map((w, i) => ({
    ...w,
    coverType: 'image',
    cover: '',
    coverSrcSet: '',
    coverAlt: w.title,
    coverImage: null,
    coverVideo: null,
    gallery: [],
    modules: [],
  }))
  return {
    works,
    allWorks: works,
    projects: mapProjects(works),
    profile: fallback.profile,
    experience: fallback.experience,
    siteSettings: null,
  }
}

const ContentContext = createContext(buildFallback())

export const useContent = () => useContext(ContentContext)

export function ContentProvider({ children }) {
  // 首帧即渲染本地数据（CMS 数据到达后无缝覆盖，视觉零跳动）
  const [content, setContent] = useState(buildFallback)
  const [ready, setReady] = useState(!hasSanity)
  const debounceRef = useRef(null)

  useEffect(() => {
    if (!hasSanity) return
    const c = activeClient()

    const load = () => {
      c.fetch(CONTENT_QUERY)
        .then((raw) => {
          setContent(mapAll(raw || {}))
          setReady(true)
          // 预览模式下同步站点标题
          const siteTitle = raw?.siteSettings?.siteTitle
          if (siteTitle) document.title = siteTitle
        })
        .catch((err) => {
          console.warn('[Sanity] 内容拉取失败，沿用本地兜底数据：', err?.message || err)
          setReady(true)
        })
    }

    const debouncedLoad = () => {
      clearTimeout(debounceRef.current)
      debounceRef.current = setTimeout(load, 600)
    }

    load()

    // 实时订阅：后台保存/发布后前台自动更新（无需刷新页面）
    const sub = c.listen(CONTENT_QUERY, {}, { visibility: 'query' }).subscribe({
      next: debouncedLoad,
      error: (err) => console.warn('[Sanity] 实时订阅断开：', err?.message || err),
    })

    return () => {
      clearTimeout(debounceRef.current)
      sub.unsubscribe()
    }
  }, [])

  const value = useMemo(() => ({ ...content, ready, preview: isPreview() }), [content, ready])

  return <ContentContext.Provider value={value}>{children}</ContentContext.Provider>
}

/** 预览模式角标 —— 仅 ?preview=1 时显示 */
export function PreviewBadge() {
  const { preview } = useContent()
  if (!preview) return null
  return (
    <div
      style={{
        position: 'fixed',
        left: 16,
        bottom: 16,
        zIndex: 999,
        padding: '8px 14px',
        borderRadius: 999,
        background: '#B600A8',
        color: '#fff',
        fontSize: 12,
        letterSpacing: '0.1em',
        fontFamily: 'monospace',
      }}
    >
      PREVIEW DRAFTS · 正式访客不可见
    </div>
  )
}
