import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, AreaChart, Area,
} from 'recharts'
import { TrendingUp, Activity, Zap, Clock, AlertTriangle, Shield } from 'lucide-react'
import type { AnalyticsData } from '../types'
import InteractiveTimeline from './InteractiveTimeline'

const RISK_COLORS: Record<string, string> = {
  HIGHLY_RELIABLE: '#22c55e',
  MOSTLY_RELIABLE: '#3b82f6',
  NEEDS_VERIFICATION: '#eab308',
  LIKELY_HALLUCINATED: '#f97316',
  HIGHLY_HALLUCINATED: '#ef4444',
}

export default function AnalyticsDashboard() {
  const [data, setData] = useState<AnalyticsData | null>(null)

  useEffect(() => {
    // Simulated data
    setData({
      total_verifications: 42789123,
      hallucination_rate: 0.068,
      avg_confidence: 0.94,
      risk_distribution: {
        HIGHLY_RELIABLE: 52,
        MOSTLY_RELIABLE: 22,
        NEEDS_VERIFICATION: 12,
        LIKELY_HALLUCINATED: 8,
        HIGHLY_HALLUCINATED: 6,
      },
      top_topics: [
        { topic: 'Historical Events', count: 12450, hallucination_rate: 0.12 },
        { topic: 'Scientific Facts', count: 8920, hallucination_rate: 0.08 },
        { topic: 'Biographical Data', count: 6730, hallucination_rate: 0.18 },
        { topic: 'Statistics & Numbers', count: 5410, hallucination_rate: 0.22 },
        { topic: 'Legal References', count: 2890, hallucination_rate: 0.28 },
      ],
      latency_p50: 187,
      latency_p99: 642,
      trend: Array.from({ length: 14 }, (_, i) => {
        const d = new Date()
        d.setDate(d.getDate() - (13 - i))
        return {
          date: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          hallucination_rate: 0.04 + Math.random() * 0.08,
          total_verifications: 2500000 + Math.random() * 1500000,
          avg_latency_ms: 180 + Math.random() * 80,
        }
      }),
    })
  }, [])

  if (!data) return null

  const pieData = Object.entries(data.risk_distribution).map(([name, value]) => ({ name, value }))

  return (
    <section id="analytics" className="min-h-screen px-6 py-24">
      <div className="max-w-7xl mx-auto">
        <motion.div
          className="text-center mb-12"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
        >
          <h2 className="text-4xl font-light tracking-tight mb-4">
            <span className="text-gradient">Platform</span>{' '}
            <span className="text-white/20">Analytics</span>
          </h2>
          <p className="text-white/30 text-sm">Real-time hallucination detection metrics across all models</p>
        </motion.div>

        {/* KPI Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            { icon: Activity, label: 'Total Verified', value: `${(data.total_verifications / 1e6).toFixed(1)}M`, sub: '+12.3% vs last week' },
            { icon: TrendingUp, label: 'Hallucination Rate', value: `${(data.hallucination_rate * 100).toFixed(1)}%`, sub: 'of all responses' },
            { icon: Shield, label: 'Avg Confidence', value: `${(data.avg_confidence * 100).toFixed(0)}%`, sub: 'across all claims' },
            { icon: Clock, label: 'P99 Latency', value: `${data.latency_p99}ms`, sub: 'verification time' },
          ].map((kpi, i) => (
            <motion.div
              key={i}
              className="glass rounded-2xl p-5"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
            >
              <div className="flex items-center gap-2 mb-3">
                <kpi.icon className="w-3.5 h-3.5 text-white/30" />
                <span className="text-xs text-white/30">{kpi.label}</span>
              </div>
              <div className="text-3xl font-light text-white mb-1">{kpi.value}</div>
              <div className="text-xs text-white/20">{kpi.sub}</div>
            </motion.div>
          ))}
        </div>

        {/* Charts Row */}
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          {/* Trend Chart */}
          <motion.div
            className="glass rounded-2xl p-6"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h3 className="text-sm text-white/40 mb-6 tracking-wide">Hallucination Rate Trend (14 days)</h3>
            <ResponsiveContainer width="100%" height={250}>
              <AreaChart data={data.trend}>
                <defs>
                  <linearGradient id="colorRate" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.1} />
                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: 'rgba(255,255,255,0.2)', fontSize: 11 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: 'rgba(255,255,255,0.2)', fontSize: 11 }} domain={[0, 'auto']} tickFormatter={(v) => `${(v * 100).toFixed(0)}%`} />
                <Tooltip
                  contentStyle={{ background: 'rgba(0,0,0,0.9)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', color: 'white' }}
                  formatter={(value: number) => [`${(value * 100).toFixed(1)}%`, 'Hallucination Rate']}
                />
                <Area type="monotone" dataKey="hallucination_rate" stroke="#ef444480" fill="url(#colorRate)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </motion.div>

          {/* Risk Distribution */}
          <motion.div
            className="glass rounded-2xl p-6"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
          >
            <h3 className="text-sm text-white/40 mb-6 tracking-wide">Risk Distribution</h3>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {pieData.map((entry) => (
                    <Cell key={entry.name} fill={RISK_COLORS[entry.name]} opacity={0.7} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ background: 'rgba(0,0,0,0.9)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', color: 'white' }}
                  formatter={(value: number) => [`${value}%`, '']}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex justify-center gap-4 mt-4 flex-wrap">
              {pieData.map((d) => (
                <div key={d.name} className="flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: RISK_COLORS[d.name], opacity: 0.7 }} />
                  <span className="text-xs text-white/30">{d.name.replace(/_/g, ' ')}</span>
                </div>
              ))}
            </div>
          </motion.div>
        </div>

        {/* Timeline */}
        <div className="mb-8">
          <InteractiveTimeline
            events={[
              { date: 'Jun 3', label: 'GPT-4o Update', value: 2850000 },
              { date: 'Jun 5', label: 'Gemini 2.5', value: 3200000 },
              { date: 'Jun 7', label: 'Claude 3.5', value: 2400000 },
              { date: 'Jun 9', label: 'Peak Traffic', value: 4100000 },
              { date: 'Jun 11', label: 'Llama 3', value: 3600000 },
              { date: 'Jun 13', label: 'Mistral Large', value: 2900000 },
              { date: 'Jun 15', label: 'DeepSeek V3', value: 3800000 },
            ]}
          />
        </div>

        {/* Bottom Row */}
        <div className="grid md:grid-cols-2 gap-6">
          {/* Top Topics */}
          <motion.div
            className="glass rounded-2xl p-6"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h3 className="text-sm text-white/40 mb-6 tracking-wide">Top Hallucinated Topics</h3>
            <div className="space-y-3">
              {data.top_topics.map((topic, i) => (
                <div key={i} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-white/20 w-4">{i + 1}</span>
                    <span className="text-sm text-white/60">{topic.topic}</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-xs text-white/30">{topic.count.toLocaleString()} claims</span>
                    <span className={`text-xs ${topic.hallucination_rate > 0.2 ? 'text-red-400' : topic.hallucination_rate > 0.1 ? 'text-yellow-400' : 'text-green-400'}`}>
                      {(topic.hallucination_rate * 100).toFixed(1)}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Latency Chart */}
          <motion.div
            className="glass rounded-2xl p-6"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
          >
            <h3 className="text-sm text-white/40 mb-6 tracking-wide">Verification Latency (14 days)</h3>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={data.trend}>
                <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: 'rgba(255,255,255,0.2)', fontSize: 11 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: 'rgba(255,255,255,0.2)', fontSize: 11 }} />
                <Tooltip
                  contentStyle={{ background: 'rgba(0,0,0,0.9)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', color: 'white' }}
                />
                <Line type="monotone" dataKey="avg_latency_ms" stroke="#3b82f680" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </motion.div>
        </div>
      </div>
    </section>
  )
}
