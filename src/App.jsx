import { lazy, Suspense, useEffect, useState } from 'react'
import Hero from './components/Hero.jsx'
import Marquee from './components/Marquee.jsx'
import About from './components/About.jsx'
import Services from './components/Services.jsx'
import Projects from './components/Projects.jsx'
import Contact from './components/Contact.jsx'
import WorkDetail from './components/WorkDetail.jsx'
import { ContentProvider, PreviewBadge } from './content.jsx'
import { readRoute, onRouteChange } from './router.js'

// 后台按路由懒加载：只有访问 /studio 才加载 Studio 代码，前台体积不受影响
const Studio = lazy(() => import('./studio/Studio.jsx'))

const isStudioRoute = () =>
  typeof window !== 'undefined' && window.location.pathname.startsWith('/studio')

export default function App() {
  const [route, setRoute] = useState(readRoute)

  // ?work=slug ↔ 首页切换（不整页刷新，保留动画与加载状态）
  useEffect(() => onRouteChange(() => setRoute(readRoute())), [])

  // 深链锚点：带 #hash 打开首页时，等内容挂载后滚动到对应区块
  useEffect(() => {
    if (route.work) return
    const { hash } = window.location
    if (!hash || hash === '#top') return
    const id = hash.slice(1)
    const t = setTimeout(() => {
      document.getElementById(id)?.scrollIntoView({ behavior: 'auto' })
    }, 300)
    return () => clearTimeout(t)
  }, [route.work])

  if (isStudioRoute()) {
    return (
      <Suspense fallback={<div style={{ padding: 40, fontFamily: 'monospace' }}>正在加载后台…</div>}>
        <Studio />
      </Suspense>
    )
  }

  return (
    <ContentProvider>
      {route.work ? (
        <WorkDetail slug={route.work} />
      ) : (
        <div className="page">
          <Hero />
          <Marquee />
          <About />
          <Services />
          <Projects />
          <Contact />
        </div>
      )}
      <PreviewBadge />
    </ContentProvider>
  )
}
