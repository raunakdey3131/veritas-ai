import { useEffect, useRef, useState } from 'react'
import { motion, useSpring, useTransform } from 'framer-motion'

interface AnimatedCounterProps {
  value: number
  label: string
  suffix?: string
  prefix?: string
  decimals?: number
  color?: string
}

export default function AnimatedCounter({
  value,
  label,
  suffix = '',
  prefix = '',
  decimals = 0,
  color = 'text-white',
}: AnimatedCounterProps) {
  const [inView, setInView] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const springVal = useSpring(0, { stiffness: 60, damping: 25 })
  const displayVal = useTransform(springVal, (v) => `${prefix}${v.toFixed(decimals)}${suffix}`)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true)
          obs.disconnect()
        }
      },
      { threshold: 0.3 }
    )
    obs.observe(el)
    return () => obs.disconnect()
  }, [])

  useEffect(() => {
    if (inView) springVal.set(value)
  }, [inView, value, springVal])

  return (
    <motion.div
      ref={ref}
      className="text-center"
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6 }}
    >
      <motion.div
        className={`text-4xl font-light tracking-tight ${color}`}
      >
        {displayVal}
      </motion.div>
      <div className="text-xs text-white/30 mt-1 tracking-wide">{label}</div>
    </motion.div>
  )
}
