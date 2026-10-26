import { motion, useMotionValueEvent, useScroll, useTransform } from 'framer-motion'
import { lazy, Suspense, useEffect, useRef, useState } from 'react'
import { ArrowIcon } from '../components/Icons'
import { Logo } from '../components/Logo'
import { heroState } from '../scene/sceneState'
import { useApp } from '../store'
import './Hero.css'

const HeroScene = lazy(() => import('../scene/HeroScene').then((module) => ({ default: module.HeroScene })))

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.12, delayChildren: 0.2 } },
}

const item = {
  hidden: { opacity: 0, y: 26 },
  show: { opacity: 1, y: 0, transition: { duration: 1, ease: [0.22, 1, 0.36, 1] as const } },
}

export const Hero = () => {
  const ref = useRef<HTMLElement>(null)
  const phase = useApp((state) => state.phase)
  const heroWarm = useApp((state) => state.heroWarm)
  const openReservation = useApp((state) => state.openReservation)
  const [visible, setVisible] = useState(true)
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end end'] })

  useMotionValueEvent(scrollYProgress, 'change', (value) => {
    heroState.target = value
  })

  const copyOpacity = useTransform(scrollYProgress, [0.55, 0.85], [1, 0])
  const copyY = useTransform(scrollYProgress, [0.55, 0.85], [0, -50])

  useEffect(() => {
    const node = ref.current
    if (!node) return
    const observer = new IntersectionObserver(([entry]) => setVisible(entry.isIntersecting), { rootMargin: '0px 0px 20% 0px' })
    observer.observe(node)
    return () => observer.disconnect()
  }, [])

  return (
    <section id="topo" ref={ref} className="hero">
      <div className="hero__sticky">
        <div className="hero__canvas" aria-hidden>
          {heroWarm && (
            <Suspense fallback={null}>
              <HeroScene active={visible && phase === 'site'} />
            </Suspense>
          )}
        </div>
        <div className="hero__shade" />

        <motion.div className="hero__copy" style={{ opacity: copyOpacity, y: copyY }}>
          <motion.div variants={container} initial="hidden" animate={phase === 'site' ? 'show' : 'hidden'} className="hero__stack">
            <motion.div variants={item} className="hero__logo">
              <Logo />
              <h1 className="sr-only">HAZ Poker Lounge</h1>
            </motion.div>
            <motion.p variants={item} className="eyebrow eyebrow--left">
              Home game · Poker · Texas Hold’em
            </motion.p>
            <motion.h2 variants={item} className="display hero__title">
              Sua mão<br /> <span className="gold-text">começa aqui.</span>
            </motion.h2>
            <motion.p variants={item} className="hero__lead">
              Noites temáticas de poker, com bebidas e narguilé liberados para os jogadores. Garanta sua cadeira ou reserve o
              lounge para o seu próprio home game.
            </motion.p>
            <motion.div variants={item} className="hero__actions">
              <a className="btn" href="#reservar" onClick={() => openReservation('event')}>
                Garantir minha vaga <ArrowIcon />
              </a>
              <a className="btn btn--ghost" href="#eventos">
                Ver agenda da semana
              </a>
            </motion.div>
          </motion.div>
        </motion.div>

        <motion.a
          href="#eventos"
          className="hero__scroll"
          initial={{ opacity: 0 }}
          animate={{ opacity: phase === 'site' ? 1 : 0 }}
          transition={{ delay: 1.4, duration: 1 }}
        >
          <span>Role para virar as cartas</span>
          <i aria-hidden />
        </motion.a>
      </div>
    </section>
  )
}
