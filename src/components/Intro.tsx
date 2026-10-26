import { AnimatePresence, motion } from 'framer-motion'
import { Component, lazy, Suspense, useCallback, useEffect, useRef, useState, type ReactNode } from 'react'
import { INTRO_DURATION } from '../scene/introTiming'
import { useApp } from '../store'
import { Logo } from './Logo'
import './Intro.css'

const IntroScene = lazy(() => import('../scene/IntroScene').then((module) => ({ default: module.IntroScene })))

const STATUS = [
  { until: 0.5, text: 'Embaralhando' },
  { until: 2.5, text: 'Distribuindo as cartas' },
  { until: 3.8, text: 'Abrindo o flop' },
  { until: 99, text: 'Bora pra mesa' },
]

class SceneBoundary extends Component<{ children: ReactNode; onError: () => void }, { failed: boolean }> {
  state = { failed: false }
  static getDerivedStateFromError() {
    return { failed: true }
  }
  componentDidCatch(error: unknown) {
    console.error('3D intro failed, opening the site directly', error)
    this.props.onError()
  }
  render() {
    return this.state.failed ? null : this.props.children
  }
}

const supportsWebGL = () => {
  try {
    const canvas = document.createElement('canvas')
    return Boolean(canvas.getContext('webgl2') ?? canvas.getContext('webgl'))
  } catch {
    return false
  }
}

/** Full-screen loading page: a realistic poker table where the cards are dealt, then the site opens */
export const Intro = () => {
  const phase = useApp((state) => state.phase)
  const finishIntro = useApp((state) => state.finishIntro)
  const warmHero = useApp((state) => state.warmHero)
  const [progress, setProgress] = useState(0)
  const [status, setStatus] = useState(STATUS[0].text)
  const [skipSignal, setSkipSignal] = useState(0)
  const [flash, setFlash] = useState(false)
  const [started, setStarted] = useState(false)
  const warmed = useRef(false)

  const open = useCallback(() => {
    setFlash(true)
    window.setTimeout(finishIntro, 380)
  }, [finishIntro])

  useEffect(() => {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (reduced || !supportsWebGL()) finishIntro()
  }, [finishIntro])

  // never trap the visitor on the loading page: give up early if the table never starts rendering
  useEffect(() => {
    const timer = window.setTimeout(finishIntro, started ? 20000 : 18000)
    return () => window.clearTimeout(timer)
  }, [finishIntro, started])

  // The hero scene compiles its shaders while the loading screen is still up, never during the animation
  useEffect(() => {
    if (warmed.current) return
    warmed.current = true
    warmHero()
  }, [warmHero])

  const lastProgress = useRef(-1)
  const onProgress = useCallback((t: number) => {
    if (t > 0.05) setStarted(true)
    // this runs every frame: only touch React when something visible actually changed
    const next = Math.round(Math.min(1, t / INTRO_DURATION) * 100) / 100
    if (next !== lastProgress.current) {
      lastProgress.current = next
      setProgress(next)
    }
    const text = (STATUS.find((item) => t < item.until) ?? STATUS[3]).text
    setStatus((previous) => (previous === text ? previous : text))
  }, [])

  return (
    <AnimatePresence>
      {phase === 'intro' && (
        <motion.div className="intro" initial={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.7, ease: 'easeOut' }}>
          <div className="intro__canvas">
            <SceneBoundary onError={finishIntro}>
              <Suspense fallback={null}>
                <IntroScene onProgress={onProgress} onFinish={open} skipSignal={skipSignal} />
              </Suspense>
            </SceneBoundary>
          </div>

          <div className="intro__shade" />

          <motion.div
            className="intro__brand"
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: progress > 0.6 ? 0 : 1, y: 0 }}
            transition={{ delay: progress > 0.6 ? 0 : 0.3, duration: progress > 0.6 ? 0.6 : 1.1, ease: [0.22, 1, 0.36, 1] }}
          >
            <Logo className="intro__logo" />
          </motion.div>

          <div className="intro__footer">
            <div className="intro__status" aria-live="polite">
              <span className="intro__dot" />
              {started ? status : 'Preparando a mesa'}
            </div>
            <div className="intro__bar" aria-hidden>
              <span style={{ transform: `scaleX(${progress})` }} />
            </div>
            <button className="intro__skip" type="button" onClick={() => setSkipSignal((value) => value + 1)}>
              Pular abertura
            </button>
          </div>

          <div className={`intro__flash ${flash ? 'is-on' : ''}`} />
        </motion.div>
      )}
    </AnimatePresence>
  )
}
