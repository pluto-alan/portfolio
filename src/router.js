// 极简前台路由：?work=<slug> 打开作品详情，其余为首页
// 用 history API 切换，避免整页刷新打断动画

export function readRoute() {
  if (typeof window === 'undefined') return { work: null }
  const params = new URLSearchParams(window.location.search)
  return { work: params.get('work') || null }
}

function emit() {
  window.dispatchEvent(new Event('routechange'))
}

export function openWork(slug) {
  const url = new URL(window.location.href)
  url.searchParams.set('work', slug)
  url.hash = ''
  window.history.pushState({ work: slug }, '', url)
  emit()
}

export function closeWork() {
  const url = new URL(window.location.href)
  url.searchParams.delete('work')
  window.history.pushState({}, '', url)
  emit()
}

export function onRouteChange(handler) {
  window.addEventListener('popstate', handler)
  window.addEventListener('routechange', handler)
  return () => {
    window.removeEventListener('popstate', handler)
    window.removeEventListener('routechange', handler)
  }
}
