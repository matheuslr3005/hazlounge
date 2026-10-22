import { AnimatePresence, LayoutGroup, motion } from 'framer-motion'
import { useMemo, useState } from 'react'
import { PlayingCard } from '../components/PlayingCard'
import { handRankings, tierInfo, type HandInfo, type HandTier } from '../data/hands'
import { parseCards } from '../lib/poker'
import './Ranking.css'

type RowProps = {
  hand: HandInfo
  /** 1 = strongest */
  position: number
  open: boolean
  onToggle: () => void
}

const HandRow = ({ hand, position, open, onToggle }: RowProps) => {
  const cards = useMemo(() => parseCards(hand.cards), [hand.cards])
  const strength = (handRankings.length - position + 1) / handRankings.length
  const kickers = 5 - hand.used.length

  return (
    <motion.li
      layout="position"
      className={`rank-row rank-row--${hand.tier} ${open ? 'is-open' : ''}`}
      transition={{ type: 'spring', stiffness: 260, damping: 30 }}
    >
      <button type="button" className="rank-row__head" onClick={onToggle} aria-expanded={open}>
        <span className="rank-row__pos">{String(position).padStart(2, '0')}</span>
        <span className="rank-row__name">
          <span className="rank-row__title">
            <strong className="cond">{hand.name}</strong>
            <em className={`tier tier--${hand.tier}`}>{tierInfo[hand.tier].label}</em>
          </span>
          <span className="rank-row__meter" aria-hidden>
            <motion.i
              initial={{ scaleX: 0 }}
              whileInView={{ scaleX: strength }}
              viewport={{ once: true }}
              transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
            />
          </span>
        </span>
        <span className="rank-row__cards" aria-label={`Exemplo: ${hand.cards}`}>
          {cards.map((card, index) => (
            <PlayingCard key={index} card={card} size="sm" dim={!hand.used.includes(index)} />
          ))}
        </span>
        <span className="rank-row__plus" aria-hidden />
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            className="rank-row__body"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className="rank-row__body-inner">
              <p>{hand.description}</p>
              <p className="rank-row__tip">{hand.tip}</p>
              <dl>
                <div>
                  <dt>Chance no showdown</dt>
                  <dd>{hand.odds}</dd>
                </div>
                <div>
                  <dt>Cartas de desempate</dt>
                  <dd>{kickers === 0 ? 'Nenhuma' : `${kickers} (esmaecidas)`}</dd>
                </div>
              </dl>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.li>
  )
}

const TIERS: HandTier[] = ['monster', 'strong', 'medium', 'weak']

export const Ranking = () => {
  const [descending, setDescending] = useState(true)
  const [openPosition, setOpenPosition] = useState<number | null>(1)

  const rows = useMemo(() => {
    const ordered = handRankings.map((hand, index) => ({ hand, position: index + 1 }))
    return descending ? ordered : [...ordered].reverse()
  }, [descending])

  return (
    <section id="ranking" className="section ranking">
      <div className="section__inner">
        <header className="section-head">
          <p className="eyebrow eyebrow--left">Ranking das mãos</p>
          <h2 className="display">
            O que vale <span className="gold-text">mais</span> na mesa
          </h2>
          <p>
            Dez combinações, da mão imbatível à carta alta. Toque em cada uma para ver o exemplo, o que a faz forte ou fraca
            e a chance real de ela aparecer.
          </p>
        </header>

        <div className="ranking__layout">
          <aside className="ranking__legend" aria-label="Legenda de força">
            <p className="ranking__legend-title">Como ler</p>
            <ul>
              {TIERS.map((tier) => (
                <li key={tier} className={`tier-card tier-card--${tier}`}>
                  <strong>{tierInfo[tier].label}</strong>
                  <span>{tierInfo[tier].text}</span>
                </li>
              ))}
            </ul>
            <p className="ranking__note">
              O naipe não desempata. Se duas pessoas têm a mesma combinação, vale a carta mais alta fora dela (o kicker). Mãos
              idênticas dividem o pote.
            </p>
          </aside>

          <div className="ranking__main">
            <div className="ranking__bar">
              <span className="ranking__hint">
                {descending ? 'Da mais forte para a mais fraca' : 'Da mais fraca para a mais forte'}
              </span>
              <button type="button" className="btn btn--ghost btn--small" onClick={() => setDescending((value) => !value)}>
                Inverter ordem
              </button>
            </div>
            <LayoutGroup>
              <ol className="ranking__list">
                {rows.map(({ hand, position }) => (
                  <HandRow
                    key={hand.id}
                    hand={hand}
                    position={position}
                    open={openPosition === position}
                    onToggle={() => setOpenPosition((current) => (current === position ? null : position))}
                  />
                ))}
              </ol>
            </LayoutGroup>
          </div>
        </div>
      </div>
    </section>
  )
}
