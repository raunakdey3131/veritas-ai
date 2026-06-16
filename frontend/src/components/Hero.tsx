import { lazy, Suspense, useEffect, useRef } from 'react'
import { motion, useScroll, useTransform } from 'framer-motion'
import { ArrowDown, Shield } from 'lucide-react'

const Cat3D = lazy(() => import('./Cat3D'))

export default function Hero() {
  const ref = useRef<HTMLDivElement>(null)
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start start', 'end start'],
  })
  const opacity = useTransform(scrollYProgress, [0, 1], [1, 0])
  const y = useTransform(scrollYProgress, [0, 1], [0, 100])

  return (
    <section ref={ref} className="relative min-h-screen flex items-center justify-center px-6 overflow-hidden">
      {/* 3D Cat background element */}
      <motion.div
        className="absolute right-[5%] top-[20%] w-72 h-72 opacity-40 hidden lg:block"
        style={{ opacity: useTransform(scrollYProgress, [0, 0.5], [0.4, 0]) }}
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 0.4, scale: 1 }}
        transition={{ duration: 1.5, delay: 1 }}
      >
        <Suspense fallback={null}>
          <Cat3D />
        </Suspense>
      </motion.div>

      <motion.div style={{ opacity, y }} className="text-center max-w-4xl">
        {/* Badge */}
        <motion.div
          className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-white/10 bg-white/5 mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <Shield className="w-3 h-3 text-white/60" />
          <span className="text-xs text-white/40 tracking-widest uppercase">
            AI Safety Platform
          </span>
        </motion.div>

        {/* Title */}
        <motion.h1
          className="text-6xl sm:text-7xl md:text-8xl font-light tracking-tight mb-6"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.3 }}
        >
          <span className="text-gradient">Hallucination</span>
          <br />
          <span className="text-white/20">Detection at Scale</span>
        </motion.h1>

        {/* Subtitle */}
        <motion.p
          className="text-lg text-white/30 max-w-2xl mx-auto leading-relaxed mb-10"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.5 }}
        >
          Production-grade AI verification platform that detects, scores, explains,
          and prevents hallucinations in LLM responses — before they reach end users.
        </motion.p>

        {/* CTA */}
        <motion.div
          className="flex items-center justify-center gap-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.7 }}
        >
          <a
            href="#verify"
            className="px-6 py-3 rounded-full border border-white/20 text-white/80 hover:text-white hover:bg-white/5 hover:border-white/40 transition-all text-sm tracking-wide"
          >
            Try the Platform
          </a>
          <a
            href="#architecture"
            className="px-6 py-3 text-white/30 hover:text-white/60 transition-colors text-sm tracking-wide"
          >
            View Architecture
          </a>
        </motion.div>

        {/* Scroll indicator */}
        <motion.div
          className="absolute bottom-10 left-1/2 -translate-x-1/2"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.5 }}
        >
          <motion.div
            animate={{ y: [0, 8, 0] }}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
          >
            <ArrowDown className="w-4 h-4 text-white/20" />
          </motion.div>
        </motion.div>
      </motion.div>
    </section>
  )
}
