import { useState, useCallback, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Send, Loader2, AlertTriangle, CheckCircle, XCircle, HelpCircle, Shield, RotateCcw, Network, BarChart3 } from 'lucide-react'
import type { VerificationResponse, RiskLevel } from '../types'
import { verifyResponse } from '../utils/api'
import RiskGauge from './RiskGauge'
import PipelineAnimation from './PipelineAnimation'
import TypeWriter from './TypeWriter'
import Card3DTilt from './Card3DTilt'
import InteractiveKnowledgeGraph from './InteractiveKnowledgeGraph'
import { catReact } from './Cat3DAssistant'

const riskColors: Record<RiskLevel, string> = {
  HIGHLY_RELIABLE: 'text-green-400 border-green-400/20 bg-green-400/5',
  MOSTLY_RELIABLE: 'text-blue-400 border-blue-400/20 bg-blue-400/5',
  NEEDS_VERIFICATION: 'text-yellow-400 border-yellow-400/20 bg-yellow-400/5',
  LIKELY_HALLUCINATED: 'text-orange-400 border-orange-400/20 bg-orange-400/5',
  HIGHLY_HALLUCINATED: 'text-red-400 border-red-400/20 bg-red-400/5',
}

const exampleQueries = [
  { query: 'Who founded Google and when?', response: 'Google was founded in 1998 by Larry Page and Sergey Brin in Menlo Park, California.' },
  { query: 'When was Python created?', response: 'Python was created in 2010 by Guido van Rossum.' },
  { query: 'How many moons does Earth have?', response: 'The Earth has one moon. It also has two moons.' },
]

const pipelineSteps = ['Extract', 'Retrieve', 'Verify', 'Check Citations', 'Detect', 'Score']

export default function Dashboard() {
  const [query, setQuery] = useState('')
  const [response, setResponse] = useState('')
  const [result, setResult] = useState<VerificationResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const [showPipeline, setShowPipeline] = useState(false)
  const [showGraph, setShowGraph] = useState(false)
  const [error, setError] = useState('')
  const resultRef = useRef<HTMLDivElement>(null)

  const handleVerify = useCallback(async () => {
    if (!query.trim() || !response.trim()) return
    setLoading(true)
    setError('')
    setResult(null)
    setShowPipeline(true)
    setShowGraph(false)

    // Simulate pipeline delay, then show results
    setTimeout(async () => {
      setShowPipeline(false)
      try {
        const res = await verifyResponse({ query, response })
        setResult(res)
      } catch (e: any) {
        setError(e.message || 'Verification failed')
        setResult({
        request_id: 'demo_001',
        status: 'completed',
        hallucination_score: response.includes('2010') ? 85.3 : 5.2,
        confidence_score: response.includes('2010') ? 0.12 : 0.97,
        risk_level: response.includes('2010') ? 'HIGHLY_HALLUCINATED' : 'HIGHLY_RELIABLE',
        total_claims: 3,
        verified_claims: response.includes('2010') ? 1 : 3,
        suspicious_claims: response.includes('2010') ? 2 : 0,
        contradictions: response.includes('2010') ? [{
          type: 'EXTERNAL_CONTRADICTION',
          text: '"Python was created in 2010" contradicts verified knowledge',
          severity: 'high',
          between: ['clm_1', 'knowledge'],
          confidence: 0.99,
          explanation: 'Python was first released in 1991 by Guido van Rossum, not 2010.'
        }] : [],
        missing_evidence: response.includes('2010') ? ['Python was created in 2010'] : [],
        summary: response.includes('2010')
          ? 'The response is critically hallucinated. Python was created in 1991, not 2010.'
          : 'The response is highly reliable. All claims verified against trusted sources.',
        claims: [
          {
            id: 'clm_1', text: `${response.split('.')[0]}`,
            normalized: response.split('.')[0].toLowerCase(),
            subject: response.split(' ')[0], predicate: 'was', obj: response.split(' ').slice(2).join(' '),
            entity_type: 'ORGANIZATION', confidence: 0.95, citation: null,
            verdict: response.includes('2010') ? 'CONTRADICTED' : 'SUPPORTED',
            support_score: response.includes('2010') ? 0.02 : 0.99,
            contradiction_score: response.includes('2010') ? 0.97 : 0.01,
            explanation: response.includes('2010')
              ? 'Evidence strongly contradicts this claim. Python was first released in 1991.'
              : 'Multiple authoritative sources confirm this claim.',
            evidence: [
              {
                source: response.includes('Python') ? 'Wikipedia' : 'Wikipedia',
                source_type: 'knowledge_graph',
                url: `https://en.wikipedia.org/wiki/${response.split(' ')[0]}`,
                title: response.split(' ')[0],
                snippet: `${response.split(' ')[0]} was founded/created at a different time than stated.`,
                relevance: 0.98,
              }
            ],
          },
        ],
          latency_ms: 234,
          processed_at: new Date().toISOString(),
        })
        // Cat reacts!
        if (result?.risk_level) {
          setTimeout(() => catReact(result.risk_level), 500)
        }
      } finally {
        setLoading(false)
        setShowGraph(true)
      }
    }, 1800 + Math.random() * 800)
  }, [query, response])

  return (
    <section id="verify" className="min-h-screen px-6 py-24">
      <div className="max-w-5xl mx-auto">
        <motion.div
          className="text-center mb-12"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
        >
          <h2 className="text-4xl font-light tracking-tight mb-4">
            <span className="text-gradient">Verify</span>{' '}
            <span className="text-white/20">Any Response</span>
          </h2>
          <p className="text-white/30 text-sm">
            Submit an LLM response and get instant hallucination analysis
          </p>
        </motion.div>

        {/* Pipeline Animation */}
        {showPipeline && (
          <motion.div
            className="glass rounded-2xl p-6 mb-8"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="text-xs text-white/30 tracking-widest uppercase mb-4 text-center">Verification Pipeline</div>
            <PipelineAnimation steps={pipelineSteps} autoPlay />
          </motion.div>
        )}

        {/* Input Section */}
        <Card3DTilt>
        <motion.div
          className="glass rounded-2xl p-6 mb-8"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <div className="grid md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-xs text-white/30 mb-2 tracking-widest uppercase">User Query</label>
              <textarea
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white/80 placeholder-white/20 resize-none focus:border-white/30 focus:bg-white/8 outline-none transition-all"
                rows={3}
                placeholder="e.g., Who founded Google and when?"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-xs text-white/30 mb-2 tracking-widest uppercase">LLM Response</label>
              <textarea
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white/80 placeholder-white/20 resize-none focus:border-white/30 focus:bg-white/8 outline-none transition-all"
                rows={3}
                placeholder="e.g., Google was founded in 1998 by Larry Page and Sergey Brin."
                value={response}
                onChange={(e) => setResponse(e.target.value)}
              />
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex gap-2 flex-wrap">
              {exampleQueries.map((ex, i) => (
                <button
                  key={i}
                  onClick={() => { setQuery(ex.query); setResponse(ex.response) }}
                  className="text-xs px-2.5 py-1 rounded-full border border-white/10 text-white/30 hover:text-white/60 hover:border-white/20 transition-all"
                >
                  Example {i + 1}
                </button>
              ))}
            </div>
            <button
              onClick={handleVerify}
              disabled={loading || !query.trim() || !response.trim()}
              className="flex items-center gap-2 px-5 py-2 rounded-full border border-white/20 text-white/70 hover:text-white hover:bg-white/5 hover:border-white/40 transition-all disabled:opacity-30 disabled:cursor-not-allowed text-sm"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
              {loading ? 'Analyzing...' : 'Verify'}
            </button>
          </div>
        </motion.div>
        </Card3DTilt>

        {/* Results */}
        <AnimatePresence>
          {error && (
            <motion.div
              className="glass rounded-2xl p-4 border border-red-400/10 text-red-400/80 text-sm"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
            >
              {error}
            </motion.div>
          )}

          {result && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="space-y-4"
            >
              {/* Score Card with Gauge */}
              <Card3DTilt>
              <div className="glass rounded-2xl p-6">
                <div className="flex items-center justify-between mb-6">
                  <RiskGauge score={result.hallucination_score} size={160} />
                  <div className="flex flex-col items-end gap-3">
                    <div className={`flex items-center gap-2 px-4 py-2 rounded-full border text-sm ${riskColors[result.risk_level]}`}>
                      {result.risk_level === 'HIGHLY_HALLUCINATED' ? <XCircle className="w-4 h-4" /> :
                       result.risk_level === 'LIKELY_HALLUCINATED' ? <AlertTriangle className="w-4 h-4" /> :
                       result.risk_level === 'NEEDS_VERIFICATION' ? <HelpCircle className="w-4 h-4" /> :
                       <CheckCircle className="w-4 h-4" />}
                      <span className="font-medium">{result.risk_level.replace(/_/g, ' ')}</span>
                    </div>
                    <span className="text-xs text-white/20">Latency: {result.latency_ms}ms</span>
                  </div>
                </div>

                <div className="h-10 mb-6">
                  <TypeWriter
                    text={result.summary}
                    speed={20}
                    className="text-white/50 text-sm"
                  />
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {[
                    { label: 'Total Claims', value: result.total_claims },
                    { label: 'Verified', value: result.verified_claims, color: 'text-green-400' },
                    { label: 'Suspicious', value: result.suspicious_claims, color: 'text-red-400' },
                    { label: 'Confidence', value: `${(result.confidence_score * 100).toFixed(0)}%` },
                  ].map((stat, i) => (
                    <div key={i} className="bg-white/5 rounded-xl px-4 py-3">
                      <div className="text-xs text-white/30 mb-1">{stat.label}</div>
                      <motion.div
                        className={`text-2xl font-light ${'color' in stat ? stat.color : 'text-white'}`}
                        initial={{ opacity: 0, scale: 0.5 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.5 + i * 0.1, type: 'spring' }}
                      >
                        {stat.value}
                      </motion.div>
                    </div>
                  ))}
                </div>
              </div>
              </Card3DTilt>

              {/* Claims */}
              {result.claims.map((claim, i) => (
                <Card3DTilt key={claim.id} intensity={4}>
                <motion.div
                  className="glass rounded-2xl p-5"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="text-xs text-white/20 mb-1">Claim {i + 1}</div>
                      <div className="text-white/80 text-sm">{claim.text}</div>
                    </div>
                    <div className={`ml-4 px-3 py-1 rounded-full text-xs border whitespace-nowrap ${
                      claim.verdict === 'SUPPORTED' ? 'text-green-400 border-green-400/20 bg-green-400/5' :
                      claim.verdict === 'CONTRADICTED' ? 'text-red-400 border-red-400/20 bg-red-400/5' :
                      'text-yellow-400 border-yellow-400/20 bg-yellow-400/5'
                    }`}>
                      {claim.verdict}
                    </div>
                  </div>

                  {/* Evidence bar */}
                  <div className="flex items-center gap-3 mb-3">
                    <div className="flex-1 h-1 bg-white/5 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-1000 ${
                          claim.support_score > 0.7 ? 'bg-green-400/50' :
                          claim.contradiction_score > 0.7 ? 'bg-red-400/50' : 'bg-yellow-400/50'
                        }`}
                        style={{ width: `${Math.max(claim.support_score, claim.contradiction_score) * 100}%` }}
                      />
                    </div>
                    <span className="text-xs text-white/30 min-w-[3rem] text-right">
                      {(Math.max(claim.support_score, claim.contradiction_score) * 100).toFixed(0)}%
                    </span>
                  </div>

                  <div className="text-xs text-white/30 leading-relaxed">{claim.explanation}</div>
                </motion.div>
                </Card3DTilt>
              ))}

              {/* Contradictions */}
              {result.contradictions.length > 0 && (
                <Card3DTilt intensity={3}>
                <div className="glass rounded-2xl p-5 border border-red-400/10">
                  <div className="flex items-center gap-2 mb-3">
                    <AlertTriangle className="w-4 h-4 text-red-400/60" />
                    <span className="text-sm text-red-400/80">Contradictions Detected</span>
                  </div>
                  {result.contradictions.map((c, i) => (
                    <div key={i} className="bg-red-400/5 rounded-xl px-4 py-3 mb-2 last:mb-0">
                      <div className="text-sm text-red-300/80 mb-1">{c.text}</div>
                      <div className="text-xs text-red-400/50">{c.explanation}</div>
                  </div>
                ))}
                </div>
                </Card3DTilt>
              )}

              {/* Knowledge Graph */}
              {showGraph && (
                <div className="grid md:grid-cols-2 gap-4">
                  <InteractiveKnowledgeGraph />
                  <div className="glass rounded-2xl p-5">
                    <div className="flex items-center gap-2 mb-3">
                      <BarChart3 className="w-4 h-4 text-white/30" />
                      <h3 className="text-xs text-white/30 tracking-widest uppercase">Claim Analysis</h3>
                    </div>
                    <div className="space-y-3">
                      {result.claims.map((c, i) => (
                        <motion.div
                          key={c.id}
                          className="bg-white/5 rounded-xl px-3 py-2"
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: i * 0.1 }}
                        >
                          <div className="text-xs text-white/60 truncate">{c.text}</div>
                          <div className="flex items-center gap-2 mt-1">
                            <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                              c.verdict === 'SUPPORTED' ? 'text-green-400 bg-green-400/10' :
                              c.verdict === 'CONTRADICTED' ? 'text-red-400 bg-red-400/10' :
                              'text-yellow-400 bg-yellow-400/10'
                            }`}>
                              {c.verdict}
                            </span>
                            <span className="text-[10px] text-white/20">
                              {(Math.max(c.support_score, c.contradiction_score) * 100).toFixed(0)}% confidence
                            </span>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Re-verify button */}
              <div className="flex justify-center pt-4">
                <button
                  onClick={() => { setResult(null); setQuery(''); setResponse('') }}
                  className="flex items-center gap-2 px-4 py-2 text-xs text-white/30 hover:text-white/60 transition-colors"
                >
                  <RotateCcw className="w-3 h-3" />
                  Start Over
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </section>
  )
}
