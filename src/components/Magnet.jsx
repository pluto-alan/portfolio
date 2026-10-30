import { useEffect, useRef, useState } from 'react'

/**
 * 磁吸效果：鼠标靠近元素时，元素跟随鼠标偏移（偏移量除以 strength 衰减）
 * padding 感应距离（px），strength 衰减系数（越大越轻微）
 */
export default function Magnet({
  children,
  padding = 150,
  strength = 3,
  activeTransition = 'transform 0.3s ease-out',
  inactiveTransition = 'transform 0.6s ease-in-out',
  className,
  style,
}) {
  const ref = useRef(null)
  const [pos, setPos] = useState({ x: 0, y: 0 })
  const [active, setActive] = useState(false)

  useEffect(() => {
    const onMove = (e) => {
      const el = ref.current
      if (!el) return
      const r = el.getBoundingClientRect()
      const cx = r.left + r.width / 2
      const cy = r.top + r.height / 2
      const dx = Math.abs(e.clientX - cx) - r.width / 2
      const dy = Math.abs(e.clientY - cy) - r.height / 2
      if (dx < padding && dy < padding) {
        setActive(true)
        setPos({ x: (e.clientX - cx) / strength, y: (e.clientY - cy) / strength })
      } else {
        setActive(false)
        setPos({ x: 0, y: 0 })
      }
    }
    window.addEventListener('mousemove', onMove)
    return () => window.removeEventListener('mousemove', onMove)
  }, [padding, strength])

  return (
    <div
      ref={ref}
      className={className}
      style={{
        ...style,
        transform: `translate3d(${pos.x}px, ${pos.y}px, 0)`,
        transition: active ? activeTransition : inactiveTransition,
        willChange: 'transform',
      }}
    >
      {children}
    </div>
  )
}
