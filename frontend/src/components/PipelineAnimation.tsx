import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

interface PipelineStep {
  id: string
  label: string
  status: 'pending' | 'processing' | 'done' | 'error'
}

interface PipelineAnimationProps {
  steps: string[]
  onComplete?: () => void
  autoPlay?: boolean
}

export default function PipelineAnimation({ steps: stepLabels, onComplete, autoPlay = true }: PipelineAnimationProps) {
  const [steps, setSteps] = useState<PipelineStep[]>(
    stepLabels.map((l, i) => ({ id: `step_${i}`, label: l, status: 'pending' }))
  )
  const [activeStep, setActiveStep] = useState(-1)
  const [completed, setCompleted] = useState(false)

  const runPipeline = useCallback(() => {
    setActiveStep(0)
    setCompleted(false)
    setSteps(stepLabels.map((l, i) => ({ id: `step_${i}`, label: l, status: i === 0 ? 'processing' : 'pending' })))
  }, [stepLabels])

  useEffect(() => {
    if (!autoPlay) return
    runPipeline()
  }, [autoPlay, runPipeline])

  useEffect(() => {
    if (activeStep < 0 || activeStep >= steps.length) return

    const timer = setTimeout(() => {
      setSteps((prev) =>
        prev.map((s, i) => {
          if (i === activeStep) return { ...s, status: 'done' as const }
          if (i === activeStep + 1) return { ...s, status: 'processing' as const }
          return s
        })
      )

      if (activeStep + 1 >= steps.length) {
        setCompleted(true)
        onComplete?.()
      } else {
        setActiveStep((a) => a + 1)
      }
    }, 600 + Math.random() * 400)

    return () => clearTimeout(timer)
  }, [activeStep, steps.length, onComplete])

  if (completed) return null

  return (
    <div className="w-full">
      <div className="flex items-center justify-center gap-1.5 flex-wrap">
        {steps.map((step, i) => (
          <motion.div
            key={step.id}
            className="flex items-center"
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.08 }}
          >
            <motion.div
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-medium tracking-wider uppercase border transition-all duration-500 ${
                step.status === 'done'
                  ? 'border-white/20 bg-white/10 text-white/70'
                  : step.status === 'processing'
                  ? 'border-white/30 bg-white/5 text-white/80'
                  : 'border-white/5 text-white/15'
              }`}
              animate={
                step.status === 'processing'
                  ? { scale: [1, 1.03, 1] }
                  : {}
              }
              transition={{ repeat: Infinity, duration: 1.5 }}
            >
              {step.status === 'done' ? (
                <svg className="w-2.5 h-2.5 text-white/50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              ) : step.status === 'processing' ? (
                <motion.div
                  className="w-2 h-2 rounded-full bg-white/50"
                  animate={{ opacity: [0.3, 1, 0.3] }}
                  transition={{ repeat: Infinity, duration: 1 }}
                />
              ) : (
                <div className="w-2 h-2 rounded-full bg-white/10" />
              )}
              {step.label}
            </motion.div>
            {i < steps.length - 1 && (
              <motion.div
                className="w-4 h-px mx-0.5"
                style={{
                  background: step.status === 'done'
                    ? 'linear-gradient(90deg, rgba(255,255,255,0.2), rgba(255,255,255,0.05))'
                    : 'rgba(255,255,255,0.05)',
                }}
              />
            )}
          </motion.div>
        ))}
      </div>
    </div>
  )
}
