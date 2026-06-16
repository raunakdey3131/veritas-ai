import { useEffect, useRef, useCallback, useState } from 'react'

interface BurstParticle {
  id: number
  x: number
  y: number
  vx: number
  vy: number
  size: number
  alpha: number
  life: number
}

export default function ParticleClickBurst() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const particlesRef = useRef<BurstParticle[]>([])
  const idRef = useRef(0)
  const animRef = useRef(0)

  const burst = useCallback((x: number, y: number) => {
    const count = 12
    const particles: BurstParticle[] = []
    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 * i) / count + (Math.random() - 0.5) * 0.5
      const speed = 1 + Math.random() * 3
      particles.push({
        id: idRef.current++,
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: 1 + Math.random() * 2.5,
        alpha: 0.6 + Math.random() * 0.4,
        life: 1,
      })
    }
    particlesRef.current.push(...particles)
  }, [])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const resize = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
    }
    resize()
    window.addEventListener('resize', resize)

    const onClick = (e: MouseEvent) => burst(e.clientX, e.clientY)
    window.addEventListener('click', onClick)

    const animate = () => {
      ctx!.clearRect(0, 0, canvas!.width, canvas!.height)
      const particles = particlesRef.current

      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i]
        p.x += p.vx
        p.y += p.vy
        p.vx *= 0.97
        p.vy *= 0.97
        p.life -= 0.02
        p.alpha = p.life * 0.6

        if (p.life <= 0) {
          particles.splice(i, 1)
          continue
        }

        ctx!.beginPath()
        ctx!.arc(p.x, p.y, p.size, 0, Math.PI * 2)
        ctx!.fillStyle = `rgba(255,255,255,${p.alpha})`
        ctx!.fill()
      }

      animRef.current = requestAnimationFrame(animate)
    }
    animate()

    return () => {
      cancelAnimationFrame(animRef.current)
      window.removeEventListener('resize', resize)
      window.removeEventListener('click', onClick)
    }
  }, [burst])

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-50"
    />
  )
}
