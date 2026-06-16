import { useRef, useState, useCallback, type ReactNode } from 'react'
import { motion } from 'framer-motion'

interface Card3DTiltProps {
  children: ReactNode
  className?: string
  intensity?: number
}

export default function Card3DTilt({ children, className = '', intensity = 8 }: Card3DTiltProps) {
  const ref = useRef<HTMLDivElement>(null)
  const [rotate, setRotate] = useState({ x: 0, y: 0 })
  const [glow, setGlow] = useState({ x: 50, y: 50 })
  const [isHovered, setIsHovered] = useState(false)

  const onMouseMove = useCallback(
    (e: React.MouseEvent) => {
      const el = ref.current
      if (!el) return
      const rect = el.getBoundingClientRect()
      const x = (e.clientX - rect.left) / rect.width
      const y = (e.clientY - rect.top) / rect.height
      setRotate({
        x: (y - 0.5) * -intensity,
        y: (x - 0.5) * intensity,
      })
      setGlow({ x: x * 100, y: y * 100 })
    },
    [intensity]
  )

  const onMouseLeave = () => {
    setRotate({ x: 0, y: 0 })
    setGlow({ x: 50, y: 50 })
    setIsHovered(false)
  }

  return (
    <motion.div
      ref={ref}
      className={`relative ${className}`}
      onMouseMove={onMouseMove}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={onMouseLeave}
      style={{
        perspective: '1000px',
        transformStyle: 'preserve-3d',
      }}
      animate={{
        rotateX: rotate.x,
        rotateY: rotate.y,
      }}
      transition={{ type: 'spring', stiffness: 200, damping: 20 }}
    >
      {children}
      {/* Interactive glow overlay */}
      {isHovered && (
        <div
          className="absolute inset-0 rounded-2xl pointer-events-none"
          style={{
            background: `radial-gradient(circle at ${glow.x}% ${glow.y}%, rgba(255,255,255,0.06) 0%, transparent 60%)`,
          }}
        />
      )}
    </motion.div>
  )
}
