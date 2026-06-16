import { useState, useRef, useCallback, useEffect } from 'react'
import { motion } from 'framer-motion'

interface TimelineEvent {
  date: string
  label: string
  value: number
  color?: string
}

interface InteractiveTimelineProps {
  events: TimelineEvent[]
  onSelect?: (event: TimelineEvent) => void
}

export default function InteractiveTimeline({ events, onSelect }: InteractiveTimelineProps) {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null)
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  const maxValue = Math.max(...events.map((e) => e.value))

  const handleClick = useCallback(
    (idx: number) => {
      setSelectedIndex(idx)
      onSelect?.(events[idx])
    },
    [events, onSelect]
  )

  return (
    <motion.div
      ref={containerRef}
      className="glass rounded-2xl p-6"
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
    >
      <h3 className="text-xs text-white/30 tracking-widest uppercase mb-6">Verification Activity Timeline</h3>

      <div className="relative flex items-end gap-2 h-48">
        {/* Bars */}
        {events.map((event, i) => {
          const height = (event.value / maxValue) * 100
          const isSelected = i === selectedIndex
          const isHovered = i === hoveredIndex

          return (
            <div key={i} className="flex-1 flex flex-col items-center gap-1 h-full justify-end">
              <motion.div
                className="w-full rounded-t-lg cursor-pointer relative group"
                style={{
                  height: `${height}%`,
                  backgroundColor: isSelected
                    ? 'rgba(255,255,255,0.25)'
                    : isHovered
                    ? 'rgba(255,255,255,0.15)'
                    : 'rgba(255,255,255,0.05)',
                  transition: 'background-color 0.2s ease',
                }}
                onMouseEnter={() => setHoveredIndex(i)}
                onMouseLeave={() => setHoveredIndex(null)}
                onClick={() => handleClick(i)}
                initial={{ height: '0%' }}
                whileInView={{ height: `${height}%` }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: i * 0.05, ease: 'easeOut' }}
              >
                {/* Tooltip on hover */}
                {isHovered && (
                  <motion.div
                    className="absolute -top-8 left-1/2 -translate-x-1/2 bg-white/10 backdrop-blur-xl border border-white/10 rounded-lg px-2.5 py-1 whitespace-nowrap"
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                  >
                    <span className="text-[10px] text-white/70">{event.label}</span>
                    <span className="text-[10px] text-white/30 ml-2">{event.value.toLocaleString()}</span>
                  </motion.div>
                )}
              </motion.div>

              {/* Date label */}
              <span className={`text-[8px] whitespace-nowrap transition-colors ${
                isSelected ? 'text-white/50' : 'text-white/15'
              }`}>
                {event.date}
              </span>
            </div>
          )
        })}
      </div>

      {/* Selected event detail */}
      {selectedIndex !== null && (
        <motion.div
          className="mt-4 glass rounded-xl px-4 py-3"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="flex items-center justify-between">
            <div>
              <span className="text-sm text-white/70">{events[selectedIndex].label}</span>
              <span className="text-xs text-white/30 ml-3">{events[selectedIndex].date}</span>
            </div>
            <span className="text-lg text-white/50 font-light">{events[selectedIndex].value.toLocaleString()}</span>
          </div>
        </motion.div>
      )}
    </motion.div>
  )
}
