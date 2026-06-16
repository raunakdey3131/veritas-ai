import { motion } from 'framer-motion'
import { motion as m } from 'framer-motion'

const microservices = [
  { name: 'API Gateway', desc: 'Kong/Envoy — routing, auth, rate limiting', color: 'border-white/20' },
  { name: 'Auth Service', desc: 'JWT, OAuth 2.0, RBAC, API key mgmt', color: 'border-white/20' },
  { name: 'Claim Extraction', desc: 'NER, dependency parsing, segmentation', color: 'border-white/20' },
  { name: 'Knowledge Retrieval', desc: 'Dense + sparse + graph retrieval', color: 'border-white/20' },
  { name: 'Verification Engine', desc: 'NLI-based claim verification', color: 'border-white/30' },
  { name: 'Citation Validation', desc: 'URL, DOI, author verification', color: 'border-white/20' },
  { name: 'Contradiction Detection', desc: 'Internal/external/temporal', color: 'border-white/20' },
  { name: 'Uncertainty Estimation', desc: 'Entropy, consistency, ensemble', color: 'border-white/20' },
  { name: 'Risk Scoring', desc: 'Multi-factor hallucination scoring', color: 'border-white/30' },
  { name: 'Monitoring', desc: 'Prometheus, Grafana, OpenTelemetry', color: 'border-white/20' },
  { name: 'Analytics', desc: 'Real-time dashboards and trends', color: 'border-white/20' },
  { name: 'Human Review', desc: 'Human-in-the-loop verification', color: 'border-white/20' },
]

export default function Architecture() {
  return (
    <section id="architecture" className="min-h-screen px-6 py-24">
      <div className="max-w-6xl mx-auto">
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
        >
          <h2 className="text-4xl font-light tracking-tight mb-4">
            <span className="text-gradient">Microservice</span>{' '}
            <span className="text-white/20">Architecture</span>
          </h2>
          <p className="text-white/30 text-sm">
            12 loosely coupled services · Event-driven · Multi-region · 100M verifications/day
          </p>
        </motion.div>

        {/* Flow Diagram */}
        <div className="glass rounded-2xl p-8 mb-12 overflow-x-auto">
          <div className="flex items-center justify-center gap-2 min-w-[700px]">
            {['Client', 'Gateway', 'Claims', 'Retrieval', 'Verify', 'Score', 'Response'].map((step, i) => (
              <motion.div
                key={step}
                className="flex items-center"
                initial={{ opacity: 0, x: 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
              >
                <div className="px-3 py-1.5 rounded-full border border-white/10 bg-white/5 text-xs text-white/50 whitespace-nowrap">
                  {step}
                </div>
                {i < 6 && <div className="w-4 h-px bg-white/10 mx-1" />}
              </motion.div>
            ))}
          </div>
        </div>

        {/* Service Grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {microservices.map((svc, i) => (
            <motion.div
              key={svc.name}
              className={`glass rounded-xl p-5 border ${svc.color} hover:bg-white/[0.06] transition-all cursor-default`}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.05 }}
            >
              <div className="flex items-center gap-2 mb-2">
                <div className={`w-1.5 h-1.5 rounded-full ${svc.color.includes('30') ? 'bg-white/50' : 'bg-white/20'}`} />
                <h3 className="text-sm text-white/70 font-medium">{svc.name}</h3>
              </div>
              <p className="text-xs text-white/30 pl-3.5">{svc.desc}</p>
            </motion.div>
          ))}
        </div>

        {/* Stack */}
        <motion.div
          className="glass rounded-2xl p-6 mt-8"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
        >
          <h3 className="text-xs text-white/30 tracking-widest uppercase mb-4">Technology Stack</h3>
          <div className="flex flex-wrap gap-3">
            {[
              'Python', 'FastAPI', 'PyTorch', 'Transformers', 'PostgreSQL', 'Neo4j',
              'Redis', 'Elasticsearch', 'Qdrant', 'Kafka', 'Docker', 'Kubernetes',
              'Terraform', 'Prometheus', 'Grafana', 'OpenTelemetry', 'Jaeger',
            ].map((tech) => (
              <span key={tech} className="px-3 py-1 rounded-full border border-white/5 bg-white/[0.02] text-xs text-white/30">
                {tech}
              </span>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  )
}
