import { Shield } from 'lucide-react'

export default function Footer() {
  return (
    <footer className="border-t border-white/5 px-6 py-8">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Shield className="w-3.5 h-3.5 text-white/20" />
          <span className="text-xs text-white/20 tracking-widest uppercase">Veritas AI</span>
        </div>
        <div className="text-xs text-white/10">
          Designed for production — 100M verifications/day at P99 &lt; 500ms
        </div>
      </div>
    </footer>
  )
}
