import { useState, useCallback, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Cat3D from './Cat3D'

const TIPS = [
  "Psst! Try the example queries below!",
  "Python was created in 1991, not 2010! Don't let 'em fool you!",
  "Earth has ONE moon. If someone says two, that's a hallucination!",
  "Google was founded in 1998 by Larry Page and Sergey Brin.",
  "I'm a 3D cat with a mission — keep AI honest!",
  "The speed of light is ~300,000 km/s. Just saying.",
  "Click me for tips! Double-click for facts!",
]

const HALLUCINATION_REACTIONS: Record<string, string[]> = {
  HIGHLY_RELIABLE: ['Looks good to me! 🐱✅', 'All clear! Verified! ✨'],
  MOSTLY_RELIABLE: ['Seems reliable! 👍', 'Pretty accurate! 😸'],
  NEEDS_VERIFICATION: ['Hmm, double-check this 🤔', 'Not sure... 🧐'],
  LIKELY_HALLUCINATED: ['This looks sus! 🚩', 'Something fishy... 🐟'],
  HIGHLY_HALLUCINATED: ['🚨 HALLUCINATION! 🚨', 'That is NOT right 😿'],
}

let talkFn: ((text: string) => void) | null = null

export function catTalk(text: string) { talkFn?.(text) }
export function catReact(riskLevel: string) {
  const reactions = HALLUCINATION_REACTIONS[riskLevel]
  if (reactions) talkFn?.(reactions[Math.floor(Math.random() * reactions.length)])
}

export default function Cat3DAssistant() {
  const [visible, setVisible] = useState(false)
  const [speech, setSpeech] = useState('')
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [expanded, setExpanded] = useState(false)
  const timerRef = useRef<ReturnType<typeof setTimeout>>()

  const speak = useCallback((text: string) => {
    setSpeech(text)
    setIsSpeaking(true)
    clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => setIsSpeaking(false), 4000)
  }, [])

  useEffect(() => {
    talkFn = speak
    const showTimer = setTimeout(() => setVisible(true), 1500)
    return () => { clearTimeout(showTimer); clearTimeout(timerRef.current); talkFn = null }
  }, [speak])

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          className="fixed bottom-5 right-5 z-50 flex flex-col items-end gap-2"
          initial={{ opacity: 0, y: 30, scale: 0.8 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 30, scale: 0.8 }}
          transition={{ type: 'spring', stiffness: 300, damping: 22 }}
        >
          {/* Speech bubble */}
          <AnimatePresence>
            {isSpeaking && speech && (
              <motion.div
                className="bg-[#1a1a2e]/95 backdrop-blur-xl border border-white/10 text-white/80 rounded-2xl px-4 py-2.5 text-sm leading-relaxed shadow-xl max-w-[220px]"
                initial={{ opacity: 0, y: 8, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 8, scale: 0.9 }}
              >
                {speech}
              </motion.div>
            )}
          </AnimatePresence>

          {/* 3D Cat */}
          <motion.div
            className="relative cursor-pointer overflow-hidden rounded-2xl bg-black/30 backdrop-blur-sm border border-white/5 transition-all duration-300"
            style={{
              width: expanded ? 240 : 88,
              height: expanded ? 240 : 88,
            }}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => {
              setExpanded(!expanded)
              if (!expanded) speak('Meow! 🐱')
            }}
            onDoubleClick={() => speak(TIPS[Math.floor(Math.random() * TIPS.length)])}
          >
            <div className="w-full h-full">
              <Cat3D />
            </div>

            {/* Compact status badge */}
            {!expanded && (
              <div className="absolute bottom-1 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded-full bg-black/60 backdrop-blur-sm text-[9px] text-white/40 whitespace-nowrap">
                🎧 Veritas Cat
              </div>
            )}
          </motion.div>

          {/* Controls bar */}
          <div className="flex gap-1.5">
            <button
              onClick={() => setExpanded(!expanded)}
              className="px-2.5 py-1 text-[10px] rounded-full bg-white/5 border border-white/10 text-white/40 hover:text-white/70 hover:bg-white/10 transition-all"
            >
              {expanded ? '✕ Close' : '🔍 Expand'}
            </button>
            <button
              onClick={() => speak(TIPS[Math.floor(Math.random() * TIPS.length)])}
              className="px-2.5 py-1 text-[10px] rounded-full bg-white/5 border border-white/10 text-white/40 hover:text-white/70 hover:bg-white/10 transition-all"
            >
              💡 Tip
            </button>
            <button
              onClick={() => setVisible(false)}
              className="px-2.5 py-1 text-[10px] rounded-full bg-white/5 border border-white/10 text-white/30 hover:text-white/50 transition-all"
            >
              ✕
            </button>
          </div>

          {/* Re-appear after 30s if hidden */}
          {!visible && <div />}
        </motion.div>
      )}

      {/* Re-show button if hidden */}
      {!visible && (
        <motion.button
          className="fixed bottom-5 right-5 z-50 w-10 h-10 rounded-full bg-white/5 border border-white/10 text-white/30 hover:text-white/60 hover:bg-white/10 transition-all backdrop-blur-sm flex items-center justify-center"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          onClick={() => setVisible(true)}
        >
          🐱
        </motion.button>
      )}
    </AnimatePresence>
  )
}
