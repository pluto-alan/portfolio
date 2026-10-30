import { motion } from 'framer-motion'

/**
 * 入场动画容器：进入视口时淡入 + 位移复位
 * delay 延迟 / duration 时长 / x y 初始偏移
 */
export default function FadeIn({ children, delay = 0, duration = 0.7, x = 0, y = 30, className, style }) {
  return (
    <motion.div
      className={className}
      style={style}
      initial={{ opacity: 0, x, y }}
      whileInView={{ opacity: 1, x: 0, y: 0 }}
      viewport={{ once: true, margin: '50px', amount: 0 }}
      transition={{ delay, duration, ease: [0.25, 0.1, 0.25, 1] }}
    >
      {children}
    </motion.div>
  )
}
