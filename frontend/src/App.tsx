import { useEffect } from 'react'
import { motion, useScroll, useSpring } from 'framer-motion'
import ParticleBackground from './components/ParticleBackground'
import CursorGlow, { useCursorDot } from './components/CursorGlow'
import ParticleClickBurst from './components/ParticleClickBurst'
import Header from './components/Header'
import Hero from './components/Hero'
import StatsBar from './components/StatsBar'
import Dashboard from './components/Dashboard'
import AnalyticsDashboard from './components/AnalyticsDashboard'
import Cat3DAssistant from './components/Cat3DAssistant'
import Architecture from './components/Architecture'
import Footer from './components/Footer'

export default function App() {
  const { scrollYProgress } = useScroll()
  const scaleY = useSpring(scrollYProgress, { stiffness: 100, damping: 30, restDelta: 0.001 })
  useCursorDot()

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('in-view')
          }
        })
      },
      { threshold: 0.1 }
    )
    document.querySelectorAll('.reveal').forEach((el) => observer.observe(el))
    return () => observer.disconnect()
  }, [])

  return (
    <div className="relative min-h-screen bg-black text-white selection:bg-white/20">
      <ParticleBackground />
      <CursorGlow />
      <ParticleClickBurst />

      <motion.div
        className="fixed top-0 left-0 right-0 h-[1px] bg-white/10 z-[60] origin-left"
        style={{ scaleX: scaleY }}
      />

      <Header />
      <Hero />
      <StatsBar />
      <Dashboard />
      <AnalyticsDashboard />
      <Architecture />
      <Cat3DAssistant />
      <Footer />
    </div>
  )
}
