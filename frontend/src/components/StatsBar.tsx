import { motion } from 'framer-motion'
import AnimatedCounter from './AnimatedCounter'

export default function StatsBar() {
  return (
    <section className="px-6 py-16">
      <motion.div
        className="max-w-5xl mx-auto glass rounded-3xl p-8"
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-100px' }}
        transition={{ duration: 0.8 }}
      >
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          <AnimatedCounter value={42789123} label="Verifications Processed" suffix="+" />
          <AnimatedCounter value={94} label="Avg Confidence Score" suffix="%" color="text-green-400" />
          <AnimatedCounter value={187} label="P50 Latency (ms)" suffix="ms" color="text-blue-400" />
          <AnimatedCounter value={99} label="System Uptime" suffix="%" color="text-green-400" />
        </div>
      </motion.div>
    </section>
  )
}
