import { useEffect, useRef, useCallback } from 'react'

export default function CursorGlow() {
  const glowRef = useRef<HTMLDivElement>(null)
  const posRef = useRef({ x: -100, y: -100 })
  const trailRef = useRef<{ x: number; y: number; alpha: number }[]>([])
  const rafRef = useRef(0)

  useEffect(() => {
    const update = (e: MouseEvent) => {
      posRef.current = { x: e.clientX, y: e.clientY }
    }
    window.addEventListener('mousemove', update)

    const animate = () => {
      const glow = glowRef.current
      if (!glow) return

      const { x, y } = posRef.current

      // Main glow follows cursor directly
      glow.style.transform = `translate(${x - 150}px, ${y - 150}px)`
      glow.style.opacity = '1'

      rafRef.current = requestAnimationFrame(animate)
    }
    animate()

    return () => {
      window.removeEventListener('mousemove', update)
      cancelAnimationFrame(rafRef.current)
    }
  }, [])

  return (
    <>
      {/* Main glow */}
      <div
        ref={glowRef}
        className="fixed pointer-events-none z-[1]"
        style={{
          width: '300px',
          height: '300px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.01) 40%, transparent 70%)',
          transform: 'translate(-1000px, -1000px)',
          transition: 'transform 0.05s ease-out, opacity 0.3s ease',
          opacity: 0,
          willChange: 'transform',
        }}
      />
      {/* Subtle ambient dot */}
      <div
        className="fixed pointer-events-none z-[2] mix-blend-difference"
        style={{
          width: '8px',
          height: '8px',
          borderRadius: '50%',
          background: 'white',
          transform: 'translate(-1000px, -1000px)',
          transition: 'transform 0.08s ease-out, opacity 0.3s',
          opacity: 0,
          willChange: 'transform',
          boxShadow: '0 0 20px rgba(255,255,255,0.5), 0 0 60px rgba(255,255,255,0.2)',
        }}
        id="cursor-dot"
      />
    </>
  )
}

// Hook to update the cursor dot position (called from App level mousemove)
export function useCursorDot() {
  useEffect(() => {
    const dot = document.getElementById('cursor-dot')
    if (!dot) return

    const update = (e: MouseEvent) => {
      dot.style.transform = `translate(${e.clientX - 4}px, ${e.clientY - 4}px)`
      dot.style.opacity = '1'
    }
    window.addEventListener('mousemove', update)
    return () => window.removeEventListener('mousemove', update)
  }, [])
}
