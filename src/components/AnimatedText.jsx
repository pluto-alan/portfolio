import { useRef } from 'react'
import { motion, useScroll, useTransform } from 'framer-motion'

/**
 * 逐字点亮：文字随滚动逐个从 opacity 0.2 变为 1
 * offset ['start 0.8', 'end 0.2']
 */
function Char({ char, progress, range }) {
  const opacity = useTransform(progress, range, [0.2, 1])
  return <motion.span style={{ opacity }}>{char}</motion.span>
}

export default function AnimatedText({ text, className }) {
  const ref = useRef(null)
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start 0.8', 'end 0.2'],
  })

  const chars = Array.from(text)

  return (
    <p ref={ref} className={className}>
      {chars.map((c, i) => (
        <Char
          key={i}
          char={c}
          progress={scrollYProgress}
          range={[i / chars.length, Math.min(1, (i + 1) / chars.length)]}
        />
      ))}
    </p>
  )
}
