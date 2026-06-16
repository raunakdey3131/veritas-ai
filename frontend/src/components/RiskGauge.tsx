import { useEffect, useState } from 'react'
import { motion, useSpring, useTransform } from 'framer-motion'

interface RiskGaugeProps {
  score: number
  size?: number
}

export default function RiskGauge({ score, size = 200 }: RiskGaugeProps) {
  const [animatedScore, setAnimatedScore] = useState(0)
  const springVal = useSpring(0, { stiffness: 50, damping: 20 })
  const rotation = useTransform(springVal, [0, 100], [0, 270])

  useEffect(() => {
    springVal.set(score)
    const unsubscribe = springVal.on('change', (v) => setAnimatedScore(Math.round(v)))
    const timer = setTimeout(() => setAnimatedScore(Math.round(score)), 1000)
    return () => { unsubscribe(); clearTimeout(timer) }
  }, [score, springVal])

  const getColor = (s: number) => {
    if (s <= 20) return '#22c55e'
    if (s <= 40) return '#3b82f6'
    if (s <= 60) return '#eab308'
    if (s <= 80) return '#f97316'
    return '#ef4444'
  }

  const getLabel = (s: number) => {
    if (s <= 20) return 'Reliable'
    if (s <= 40) return 'Mostly Reliable'
    if (s <= 60) return 'Needs Review'
    if (s <= 80) return 'Suspicious'
    return 'Hallucinated'
  }

  const color = getColor(score)
  const cx = size / 2
  const cy = size / 2
  const r = size * 0.38
  const circumference = 2 * Math.PI * r
  const strokeDasharray = `${circumference} ${circumference}`

  return (
    <motion.div
      className="relative inline-flex items-center justify-center"
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.6, ease: 'easeOut' }}
    >
      <svg width={size} height={size} className="transform -rotate-90">
        {/* Background track */}
        <circle
          cx={cx}
          cy={cy}
          r={r}
          fill="none"
          stroke="rgba(255,255,255,0.05)"
          strokeWidth={size * 0.04}
        />
        {/* Active arc */}
        <motion.circle
          cx={cx}
          cy={cy}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={size * 0.04}
          strokeLinecap="round"
          strokeDasharray={strokeDasharray}
          strokeDashoffset={useTransform(rotation, (r) => circumference - (r / 360) * circumference)}
          style={{ filter: `drop-shadow(0 0 8px ${color}40)` }}
        />
      </svg>

      {/* Center content */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <motion.span
          className="text-4xl font-light tracking-tight"
          style={{ color }}
          key={animatedScore}
        >
          {animatedScore}
        </motion.span>
        <span className="text-xs text-white/30 mt-1">/ 100</span>
        <motion.span
          className="text-[10px] font-medium tracking-wider uppercase mt-2 px-2.5 py-0.5 rounded-full border"
          style={{
            color,
            borderColor: `${color}40`,
            backgroundColor: `${color}10`,
          }}
          key={getLabel(score)}
        >
          {getLabel(score)}
        </motion.span>
      </div>

      {/* Segment labels */}
      {[0, 25, 50, 75, 100].map((v, i) => {
        const angle = (v / 100) * 270 - 135
        const rad = (angle * Math.PI) / 180
        const labelR = r + size * 0.08
        const lx = cx + labelR * Math.cos(rad)
        const ly = cy + labelR * Math.sin(rad)
        return (
          <div
            key={i}
            className="absolute text-[9px] text-white/15 select-none"
            style={{
              left: `${(lx / size) * 100}%`,
              top: `${(ly / size) * 100}%`,
              transform: 'translate(-50%, -50%)',
            }}
          >
            {v}
          </div>
        )
      })}
    </motion.div>
  )
}
