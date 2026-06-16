import { useEffect, useRef, useState, useCallback } from 'react'
import { motion } from 'framer-motion'

interface GraphNode {
  id: string
  label: string
  type: string
  x: number
  y: number
  vx: number
  vy: number
  radius: number
}

interface GraphEdge {
  source: string
  target: string
  label: string
}

interface KnowledgeGraphProps {
  onNodeClick?: (node: GraphNode) => void
}

const SAMPLE_NODES: GraphNode[] = [
  { id: 'google', label: 'Google', type: 'ORGANIZATION', x: 300, y: 200, vx: 0, vy: 0, radius: 28 },
  { id: 'larry', label: 'Larry Page', type: 'PERSON', x: 150, y: 100, vx: 0, vy: 0, radius: 22 },
  { id: 'sergey', label: 'Sergey Brin', type: 'PERSON', x: 450, y: 100, vx: 0, vy: 0, radius: 22 },
  { id: '1998', label: '1998', type: 'DATE', x: 300, y: 60, vx: 0, vy: 0, radius: 18 },
  { id: 'sundar', label: 'Sundar Pichai', type: 'PERSON', x: 300, y: 350, vx: 0, vy: 0, radius: 22 },
  { id: 'python', label: 'Python', type: 'LANGUAGE', x: 550, y: 250, vx: 0, vy: 0, radius: 24 },
  { id: 'guido', label: 'Guido van R.', type: 'PERSON', x: 550, y: 380, vx: 0, vy: 0, radius: 20 },
  { id: '1991', label: '1991', type: 'DATE', x: 550, y: 120, vx: 0, vy: 0, radius: 18 },
  { id: 'earth', label: 'Earth', type: 'PLANET', x: 80, y: 280, vx: 0, vy: 0, radius: 26 },
  { id: 'moon', label: 'Moon', type: 'SATELLITE', x: 80, y: 400, vx: 0, vy: 0, radius: 18 },
]

const SAMPLE_EDGES: GraphEdge[] = [
  { source: 'google', target: 'larry', label: 'co-founded by' },
  { source: 'google', target: 'sergey', label: 'co-founded by' },
  { source: 'google', target: '1998', label: 'founded in' },
  { source: 'google', target: 'sundar', label: 'CEO' },
  { source: 'python', target: 'guido', label: 'created by' },
  { source: 'python', target: '1991', label: 'released' },
  { source: 'earth', target: 'moon', label: 'has moon' },
]

const TYPE_COLORS: Record<string, string> = {
  ORGANIZATION: '#3b82f6',
  PERSON: '#22c55e',
  DATE: '#eab308',
  LANGUAGE: '#a855f7',
  PLANET: '#06b6d4',
  SATELLITE: '#f97316',
}

export default function InteractiveKnowledgeGraph({ onNodeClick }: KnowledgeGraphProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [nodes] = useState<GraphNode[]>(SAMPLE_NODES.map((n) => ({ ...n })))
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [hoveredId, setHoveredId] = useState<string | null>(null)
  const mouseRef = useRef({ x: 0, y: 0 })
  const dragRef = useRef<string | null>(null)
  const animRef = useRef(0)

  const getNodeAt = useCallback(
    (mx: number, my: number) => {
      for (let i = nodes.length - 1; i >= 0; i--) {
        const n = nodes[i]
        const dx = mx - n.x
        const dy = my - n.y
        if (dx * dx + dy * dy < (n.radius + 5) * (n.radius + 5)) return n
      }
      return null
    },
    [nodes]
  )

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const resize = () => {
      const parent = canvas.parentElement!
      canvas.width = parent.clientWidth
      canvas.height = parent.clientHeight
    }
    resize()
    window.addEventListener('resize', resize)

    const centerX = canvas.width / 2
    const centerY = canvas.height / 2
    if (nodes.length > 0 && nodes[0].x === 300) {
      // Re-center nodes
      nodes.forEach((n) => {
        n.x += centerX - 300
        n.y += centerY - 200
      })
    }

    const onMouse = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect()
      mouseRef.current = { x: e.clientX - rect.left, y: e.clientY - rect.top }
      const hit = getNodeAt(mouseRef.current.x, mouseRef.current.y)
      setHoveredId(hit?.id ?? null)
      canvas.style.cursor = hit ? 'pointer' : 'default'
    }
    const onDown = (e: MouseEvent) => {
      const hit = getNodeAt(mouseRef.current.x, mouseRef.current.y)
      if (hit) dragRef.current = hit.id
    }
    const onUp = () => {
      if (dragRef.current) {
        const hit = getNodeAt(mouseRef.current.x, mouseRef.current.y)
        if (hit) {
          setSelectedId(hit.id)
          onNodeClick?.(hit)
        }
      }
      dragRef.current = null
    }
    canvas.addEventListener('mousemove', onMouse)
    canvas.addEventListener('mousedown', onDown)
    canvas.addEventListener('mouseup', onUp)

    const animate = () => {
      ctx!.clearRect(0, 0, canvas!.width, canvas!.height)
      const w = canvas!.width
      const h = canvas!.height

      // Update physics
      for (let i = 0; i < nodes.length; i++) {
        const n = nodes[i]

        if (dragRef.current === n.id) {
          n.x += (mouseRef.current.x - n.x) * 0.3
          n.y += (mouseRef.current.y - n.y) * 0.3
          n.vx = 0
          n.vy = 0
        } else {
          // Spring force toward center
          n.vx += (w / 2 - n.x) * 0.0003
          n.vy += (h / 2 - n.y) * 0.0003

          // Repulsion between nodes
          for (let j = i + 1; j < nodes.length; j++) {
            const n2 = nodes[j]
            const dx = n.x - n2.x
            const dy = n.y - n2.y
            const dist = Math.sqrt(dx * dx + dy * dy) || 1
            const force = 2000 / (dist * dist)
            n.vx += (dx / dist) * force
            n.vy += (dy / dist) * force
            n2.vx -= (dx / dist) * force
            n2.vy -= (dy / dist) * force
          }

          // Damping
          n.vx *= 0.95
          n.vy *= 0.95
          n.x += n.vx
          n.y += n.vy

          // Contain
          n.x = Math.max(n.radius, Math.min(w - n.radius, n.x))
          n.y = Math.max(n.radius, Math.min(h - n.radius, n.y))
        }
      }

      // Draw edges
      for (const edge of SAMPLE_EDGES) {
        const src = nodes.find((n) => n.id === edge.source)
        const tgt = nodes.find((n) => n.id === edge.target)
        if (!src || !tgt) continue
        const isActive = selectedId === edge.source || selectedId === edge.target
        ctx!.beginPath()
        ctx!.moveTo(src.x, src.y)
        ctx!.lineTo(tgt.x, tgt.y)
        ctx!.strokeStyle = isActive ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.05)'
        ctx!.lineWidth = isActive ? 1.5 : 0.5
        ctx!.stroke()

        // Edge label
        const mx = (src.x + tgt.x) / 2
        const my = (src.y + tgt.y) / 2
        ctx!.fillStyle = 'rgba(255,255,255,0.15)'
        ctx!.font = '8px Inter, sans-serif'
        ctx!.textAlign = 'center'
        ctx!.fillText(edge.label, mx, my - 4)
      }

      // Draw nodes
      for (const n of nodes) {
        const isSelected = n.id === selectedId
        const isHovered = n.id === hoveredId
        const color = TYPE_COLORS[n.type] || 'rgba(255,255,255,0.3)'

        // Glow
        if (isSelected || isHovered) {
          const gradient = ctx!.createRadialGradient(n.x, n.y, 0, n.x, n.y, n.radius * 3)
          gradient.addColorStop(0, `${color}20`)
          gradient.addColorStop(1, 'transparent')
          ctx!.fillStyle = gradient
          ctx!.fillRect(n.x - n.radius * 3, n.y - n.radius * 3, n.radius * 6, n.radius * 6)
        }

        // Circle
        ctx!.beginPath()
        ctx!.arc(n.x, n.y, n.radius, 0, Math.PI * 2)
        ctx!.fillStyle = isSelected ? color : `${color}60`
        ctx!.fill()
        ctx!.strokeStyle = isHovered ? `${color}80` : `${color}30`
        ctx!.lineWidth = isHovered ? 2 : 1
        ctx!.stroke()

        // Label
        ctx!.fillStyle = 'rgba(255,255,255,0.7)'
        ctx!.font = isSelected ? 'bold 10px Inter, sans-serif' : '9px Inter, sans-serif'
        ctx!.textAlign = 'center'
        ctx!.fillText(n.label, n.x, n.y + n.radius + 14)
      }

      animRef.current = requestAnimationFrame(animate)
    }
    animate()

    return () => {
      cancelAnimationFrame(animRef.current)
      window.removeEventListener('resize', resize)
      canvas.removeEventListener('mousemove', onMouse)
      canvas.removeEventListener('mousedown', onDown)
      canvas.removeEventListener('mouseup', onUp)
    }
  }, [nodes, selectedId, hoveredId, getNodeAt, onNodeClick])

  const selected = nodes.find((n) => n.id === selectedId)

  return (
    <motion.div
      className="glass rounded-2xl p-5 relative overflow-hidden"
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
    >
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-xs text-white/30 tracking-widest uppercase">Knowledge Graph</h3>
        <div className="flex gap-2">
          {Object.entries(TYPE_COLORS).map(([type, color]) => (
            <div key={type} className="flex items-center gap-1">
              <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: color, opacity: 0.5 }} />
              <span className="text-[8px] text-white/20">{type}</span>
            </div>
          ))}
        </div>
      </div>

      <canvas
        ref={canvasRef}
        className="w-full rounded-xl"
        style={{ height: '300px' }}
      />

      {selected && (
        <motion.div
          className="absolute bottom-6 left-6 right-6 glass rounded-xl px-4 py-3"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: TYPE_COLORS[selected.type], opacity: 0.7 }} />
            <span className="text-sm text-white/70">{selected.label}</span>
            <span className="text-[10px] text-white/30 ml-auto">{selected.type}</span>
          </div>
        </motion.div>
      )}
    </motion.div>
  )
}

export { SAMPLE_NODES, SAMPLE_EDGES }
export type { GraphNode, GraphEdge }
