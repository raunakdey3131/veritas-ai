import { useEffect, useRef, useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Cat, Headphones } from 'lucide-react'

const TIPS = [
  "Psst! Try the example queries below!",
  "Right-click any text on any page to check it — I'm also a Chrome extension!",
  "Python was created in 1991, not 2010. Don't let 'em fool you!",
  "Earth has ONE moon. If someone says two, that's a hallucination!",
  "Google was founded in 1998. By Larry Page and Sergey Brin.",
  "*adjusts headphones* Ready to verify some claims?",
  "I'm a pixel cat with a mission — keep AI honest!",
  "Try selecting text on ANY website and I can check it!",
  "The speed of light is ~300,000 km/s. Just saying.",
  "*purrs in binary* 01101101 01100101 01101111 01110111",
]

const HALLUCINATION_REACTIONS = {
  HIGHLY_RELIABLE: ['Looks good to me! 🐱✅', 'All clear! Verified! ✨', 'No hallucinations here! 🎉'],
  MOSTLY_RELIABLE: ['Seems reliable enough! 👍', 'Pretty accurate! 😸'],
  NEEDS_VERIFICATION: ['Hmm, might need a double-check 🤔', 'Not sure about this one... 🧐'],
  LIKELY_HALLUCINATED: ['This looks sus! 🚩', 'I smell something fishy... 🐟'],
  HIGHLY_HALLUCINATED: ['🚨 HALLUCINATION DETECTED! 🚨', 'Yeahhh that is NOT right 😿', 'Fake news! ❌'],
}

let talkCallback: ((text: string) => void) | null = null

export function catTalk(text: string) {
  talkCallback?.(text)
}

export function catReact(riskLevel: string) {
  const reactions = HALLUCINATION_REACTIONS[riskLevel as keyof typeof HALLUCINATION_REACTIONS]
  if (reactions) {
    const msg = reactions[Math.floor(Math.random() * reactions.length)]
    talkCallback?.(msg)
  }
}

export default function CatAssistant() {
  const [visible, setVisible] = useState(false)
  const [speech, setSpeech] = useState('')
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [frame, setFrame] = useState(0)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const timerRef = useRef<ReturnType<typeof setInterval>>()
  const speechTimerRef = useRef<ReturnType<typeof setTimeout>>()

  // Expose talk function
  useEffect(() => {
    talkCallback = (text: string) => {
      setSpeech(text)
      setIsSpeaking(true)
      clearTimeout(speechTimerRef.current)
      speechTimerRef.current = setTimeout(() => {
        setIsSpeaking(false)
      }, 4000)
    }
    return () => { talkCallback = null }
  }, [])

  // Show after delay
  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 3000)
    return () => clearTimeout(t)
  }, [])

  // Animation loop
  useEffect(() => {
    timerRef.current = setInterval(() => {
      setFrame((f) => f + 1)
    }, 80)
    return () => clearInterval(timerRef.current)
  }, [])

  // Draw pixel cat
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    ctx.clearRect(0, 0, 80, 80)
    const f = frame

    const fur = '#8B7355'
    const furLight = '#C4A97D'
    const ear = '#D4956A'
    const eye = '#2D2D2D'
    const hp = '#2A2A2A'
    const hpPad = '#444'
    const collar = '#FF6B6B'
    const bell = '#FFD700'
    const blink = f % 100 < 4
    const breathe = Math.sin(f * 0.1) * 0.5

    // Body
    ctx.fillStyle = fur
    ctx.beginPath()
    ctx.ellipse(40, 56, 16, 14 + breathe, 0, 0, Math.PI * 2)
    ctx.fill()
    ctx.fillStyle = furLight
    ctx.beginPath()
    ctx.ellipse(40, 54, 11, 11 + breathe, 0, 0, Math.PI * 2)
    ctx.fill()

    // Head
    ctx.fillStyle = fur
    ctx.beginPath()
    ctx.ellipse(40, 30, 18, 16, 0, 0, Math.PI * 2)
    ctx.fill()
    ctx.fillStyle = furLight
    ctx.beginPath()
    ctx.ellipse(40, 34, 12, 10, 0, 0, Math.PI * 2)
    ctx.fill()

    // Ears
    ctx.fillStyle = ear
    ctx.beginPath()
    ctx.moveTo(22, 18)
    ctx.lineTo(30, 6)
    ctx.lineTo(38, 16)
    ctx.closePath()
    ctx.fill()
    ctx.beginPath()
    ctx.moveTo(42, 16)
    ctx.lineTo(50, 6)
    ctx.lineTo(58, 18)
    ctx.closePath()
    ctx.fill()

    // Headphones
    ctx.fillStyle = hp
    ctx.fillRect(12, 14, 56, 4)
    ctx.fillStyle = hpPad
    ctx.beginPath()
    ctx.ellipse(14, 26, 6, 10, 0, 0, Math.PI * 2)
    ctx.fill()
    ctx.beginPath()
    ctx.ellipse(66, 26, 6, 10, 0, 0, Math.PI * 2)
    ctx.fill()

    // Eyes
    const eyeY = 28
    if (blink) {
      ctx.strokeStyle = eye
      ctx.lineWidth = 1.5
      ctx.beginPath()
      ctx.arc(33, eyeY, 3, 0.1 * Math.PI, 0.9 * Math.PI)
      ctx.stroke()
      ctx.beginPath()
      ctx.arc(47, eyeY, 3, 0.1 * Math.PI, 0.9 * Math.PI)
      ctx.stroke()
    } else {
      ctx.fillStyle = eye
      ctx.beginPath()
      ctx.arc(33, eyeY, 3.5, 0, Math.PI * 2)
      ctx.fill()
      ctx.beginPath()
      ctx.arc(47, eyeY, 3.5, 0, Math.PI * 2)
      ctx.fill()
      ctx.fillStyle = '#fff'
      ctx.beginPath()
      ctx.arc(32, eyeY - 1.5, 1.2, 0, Math.PI * 2)
      ctx.fill()
      ctx.beginPath()
      ctx.arc(46, eyeY - 1.5, 1.2, 0, Math.PI * 2)
      ctx.fill()
    }

    // Nose
    ctx.fillStyle = '#FF9EB5'
    ctx.beginPath()
    ctx.moveTo(40, 34)
    ctx.lineTo(37, 38)
    ctx.lineTo(43, 38)
    ctx.closePath()
    ctx.fill()

    // Mouth
    ctx.strokeStyle = '#5C4A32'
    ctx.lineWidth = 1
    ctx.beginPath()
    ctx.moveTo(37, 39)
    ctx.quadraticCurveTo(40, 42, 43, 39)
    ctx.stroke()

    // Whiskers
    ctx.strokeStyle = 'rgba(90,70,50,0.4)'
    ctx.lineWidth = 0.8
    for (const [sx, sy, ex, ey] of [[24,32,10,28],[24,35,8,35],[24,38,10,42],[56,32,70,28],[56,35,72,35],[56,38,70,42]]) {
      ctx.beginPath()
      ctx.moveTo(sx, sy)
      ctx.lineTo(ex, ey)
      ctx.stroke()
    }

    // Collar
    ctx.fillStyle = collar
    ctx.beginPath()
    ctx.ellipse(40, 48, 7, 2.5, 0, 0, Math.PI * 2)
    ctx.fill()
    ctx.fillStyle = bell
    ctx.beginPath()
    ctx.arc(40, 52, 2.5, 0, Math.PI * 2)
    ctx.fill()
  }, [frame])

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          className="fixed bottom-6 right-6 z-50"
          initial={{ opacity: 0, scale: 0.5, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.5 }}
          transition={{ type: 'spring', stiffness: 300, damping: 20 }}
        >
          {/* Speech Bubble */}
          <AnimatePresence>
            {isSpeaking && speech && (
              <motion.div
                className="absolute bottom-24 right-0 bg-white/95 text-black rounded-2xl px-4 py-3 text-xs leading-relaxed shadow-xl max-w-[220px] backdrop-blur-xl"
                initial={{ opacity: 0, y: 10, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.9 }}
              >
                <div className="relative">
                  {speech}
                  <div className="absolute -bottom-2 right-8 w-0 h-0 border-l-6 border-r-6 border-t-6 border-l-transparent border-r-transparent border-t-white/95" />
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Cat */}
          <motion.button
            className="relative w-20 h-20 rounded-2xl bg-black/40 backdrop-blur-xl border border-white/10 cursor-pointer overflow-hidden group"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => {
              const tip = TIPS[Math.floor(Math.random() * TIPS.length)]
              setSpeech(tip)
              setIsSpeaking(true)
              clearTimeout(speechTimerRef.current)
              speechTimerRef.current = setTimeout(() => setIsSpeaking(false), 4000)
            }}
          >
            <canvas ref={canvasRef} width={80} height={80} className="w-full h-full" />
            <div className="absolute bottom-0 left-0 right-0 h-4 bg-gradient-to-t from-black/40 to-transparent" />

            {/* Hover glow */}
            <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity bg-gradient-to-t from-white/5 to-transparent rounded-2xl" />
          </motion.button>

          {/* Close */}
          <button
            onClick={() => setVisible(false)}
            className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-white/10 border border-white/10 flex items-center justify-center text-white/40 hover:text-white/70 transition-colors"
          >
            <X className="w-3 h-3" />
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
