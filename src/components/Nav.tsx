import { AnimatePresence, motion } from 'framer-motion'
import { useEffect, useState } from 'react'
import { useApp } from '../store'
import { CloseIcon, MenuIcon } from './Icons'
import { Logo } from './Logo'
import './Nav.css'

const links = [
  { href: '#topo', label: 'A Mesa' },
  { href: '#eventos', label: 'Eventos' },
  { href: '#ranking', label: 'Ranking' },
  { href: '#reservar', label: 'Reservar' },
]

export const Nav = () => {
  const ready = useApp((state) => state.phase === 'site')
  const openReservation = useApp((state) => state.openReservation)
  const [scrolled, setScrolled] = useState(false)
  const [logoShown, setLogoShown] = useState(false)
  const [open, setOpen] = useState(false)

  useEffect(() => {
    const onScroll = () => {
      setScrolled(window.scrollY > 40)
      // the hero carries its own big logo, so the nav one only appears once the hero copy is gone
      setLogoShown(window.scrollY > window.innerHeight * 0.9)
    }
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    document.body.classList.toggle('is-locked', open || !ready)
    return () => document.body.classList.remove('is-locked')
  }, [open, ready])

  const close = () => setOpen(false)

  return (
    <motion.header
      className={`nav ${scrolled ? 'is-scrolled' : ''} ${logoShown ? 'is-logo' : ''}`}
      initial={false}
      animate={{ opacity: ready ? 1 : 0, y: ready ? 0 : -24 }}
      transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
      style={{ pointerEvents: ready ? 'auto' : 'none' }}
    >
      <a className="nav__logo" href="#topo" aria-label="HAZ Poker Lounge, início">
        <Logo compact className="nav__logo-svg" />
      </a>

      <nav className="nav__links" aria-label="Principal">
        {links.map((link) => (
          <a key={link.href} href={link.href}>
            {link.label}
          </a>
        ))}
      </nav>

      <a
        className="btn btn--small nav__cta"
        href="#reservar"
        onClick={() => openReservation('event')}
      >
        Garantir vaga
      </a>

      <button
        className="nav__toggle"
        type="button"
        aria-label={open ? 'Fechar menu' : 'Abrir menu'}
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
      >
        {open ? <CloseIcon /> : <MenuIcon />}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            className="nav__sheet"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
          >
            {links.map((link, index) => (
              <motion.a
                key={link.href}
                href={link.href}
                onClick={close}
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.05 * index + 0.1, duration: 0.5 }}
              >
                {link.label}
              </motion.a>
            ))}
            <a
              className="btn"
              href="#reservar"
              onClick={() => {
                openReservation('event')
                close()
              }}
            >
              Garantir vaga
            </a>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.header>
  )
}
