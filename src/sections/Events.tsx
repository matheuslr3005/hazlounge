import { AnimatePresence, motion } from 'framer-motion'
import { useMemo, useState } from 'react'
import { AcePattern } from '../components/AcePattern'
import { ArrowIcon, ClockIcon, eventIcons, perkIcons } from '../components/Icons'
import { Tilt } from '../components/Tilt'
import {
  events,
  formatEventDate,
  isEventPast,
  isEventToday,
  parseEventDate,
  type LoungeEvent,
} from '../data/events'
import { eventImage } from '../data/eventImages'
import { site } from '../data/site'
import { useApp } from '../store'
import './Events.css'

type Tab = 'week' | 'upcoming'

const startOfWeek = (date: Date) => {
  const copy = new Date(date.getFullYear(), date.getMonth(), date.getDate())
  const offset = (copy.getDay() + 6) % 7
  copy.setDate(copy.getDate() - offset)
  return copy
}

const statusOf = (event: LoungeEvent) => {
  if (isEventPast(event)) return { label: 'Encerrado', tone: 'past' as const }
  if (isEventToday(event)) return { label: 'Hoje', tone: 'live' as const }
  if (!event.confirmed) return { label: 'A confirmar', tone: 'soon' as const }
  return { label: 'Vagas abertas', tone: 'open' as const }
}

const EventCard = ({ event, index }: { event: LoungeEvent; index: number }) => {
  const openReservation = useApp((state) => state.openReservation)
  const date = formatEventDate(event.date)
  const status = statusOf(event)
  const Icon = eventIcons[event.kind]
  const past = status.tone === 'past'

  return (
    <motion.li
      className={`event-card event-card--${status.tone}`}
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{ delay: index * 0.1, duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
    >
      <Tilt className="event-card__tilt" max={6}>
        <div className="event-card__media">
          <img src={eventImage[event.kind]} alt="" loading="lazy" />
          <span className={`event-card__status is-${status.tone}`}>{status.label}</span>
        </div>
        <div className="event-card__body">
          <p className="event-card__date">
            {date.weekday} {date.short}
          </p>
          <h3 className="cond event-card__title">{event.title}</h3>
          <p className="event-card__tag">{event.tagline}</p>
          <div className="event-card__meta">
            <span>
              Buy-in <strong>{site.currency} {event.buyIn}</strong>
            </span>
            <span>
              <ClockIcon /> Início às {event.startTime}
            </span>
          </div>
          <a
            className={`btn btn--small ${past ? 'btn--ghost' : ''}`}
            href="#reservar"
            aria-disabled={past}
            tabIndex={past ? -1 : 0}
            onClick={(clickEvent) => {
              if (past) return clickEvent.preventDefault()
              openReservation('event', event.id)
            }}
          >
            {past ? 'Evento encerrado' : 'Garantir vaga'} {!past && <ArrowIcon />}
          </a>
        </div>
        <Icon className="event-card__icon" />
      </Tilt>
    </motion.li>
  )
}

const UpcomingRow = ({ event, index }: { event: LoungeEvent; index: number }) => {
  const openReservation = useApp((state) => state.openReservation)
  const date = formatEventDate(event.date)
  const Icon = eventIcons[event.kind]
  const status = statusOf(event)

  return (
    <motion.li
      className="upcoming-row"
      initial={{ opacity: 0, x: -24 }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={{ once: true, margin: '-40px' }}
      transition={{ delay: (index % 3) * 0.08, duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
    >
      <div className="upcoming-row__date">
        <strong className="display">{date.day}</strong>
        <span>{date.monthLabel}</span>
      </div>
      <Icon className="upcoming-row__icon" />
      <div className="upcoming-row__main">
        <h3 className="cond">{event.title}</h3>
        <p>
          {date.weekday} · início às {event.startTime} · buy-in {site.currency} {event.buyIn}
        </p>
      </div>
      <span className={`event-card__status is-${status.tone}`}>{status.label}</span>
      <a className="btn btn--ghost btn--small" href="#reservar" onClick={() => openReservation('event', event.id)}>
        Reservar
      </a>
    </motion.li>
  )
}

export const Events = () => {
  const [tab, setTab] = useState<Tab>('week')

  const { week, upcoming, weekLabel } = useMemo(() => {
    const now = new Date()
    const start = startOfWeek(now)
    const end = new Date(start)
    end.setDate(end.getDate() + 7)
    const inWeek = events.filter((event) => {
      const date = parseEventDate(event.date)
      return date >= start && date < end
    })
    const later = events.filter((event) => parseEventDate(event.date) >= end)
    const first = inWeek[0] ? formatEventDate(inWeek[0].date).short : ''
    const last = inWeek.length ? formatEventDate(inWeek[inWeek.length - 1].date).short : ''
    return { week: inWeek, upcoming: later, weekLabel: first && last ? `${first} → ${last}` : '' }
  }, [])

  return (
    <section id="eventos" className="section section--felt events">
      <AcePattern />
      <div className="section__inner">
        <header className="section-head section-head--center">
          <p className="eyebrow">Agenda</p>
          <h2 className="display">
            <span className="gold-text">Agenda</span> da semana
          </h2>
          <p>Fichas, cartas e boa companhia. Noites temáticas de poker, com comida boa e a mesa sempre cheia.</p>
        </header>

        <div className="tabs" role="tablist" aria-label="Período">
          {(
            [
              { id: 'week', label: 'Esta semana' },
              { id: 'upcoming', label: 'Próximos eventos' },
            ] as const
          ).map((item) => (
            <button
              key={item.id}
              role="tab"
              type="button"
              aria-selected={tab === item.id}
              className={tab === item.id ? 'is-active' : ''}
              onClick={() => setTab(item.id)}
            >
              {item.label}
              {tab === item.id && <motion.span layoutId="events-tab" className="tabs__marker" />}
            </button>
          ))}
        </div>

        <AnimatePresence mode="wait">
          {tab === 'week' ? (
            <motion.div
              key="week"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
            >
              {week.length > 0 ? (
                <>
                  {weekLabel && <p className="events__range">{weekLabel}</p>}
                  <ul className="events__grid">
                    {week.map((event, index) => (
                      <EventCard key={event.id} event={event} index={index} />
                    ))}
                  </ul>
                </>
              ) : (
                <p className="events__empty">
                  Nenhum evento marcado para esta semana. Veja os próximos eventos ou chame a gente no Instagram.
                </p>
              )}
            </motion.div>
          ) : (
            <motion.div
              key="upcoming"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
            >
              <ul className="events__list">
                {upcoming.map((event, index) => (
                  <UpcomingRow key={event.id} event={event} index={index} />
                ))}
              </ul>
              <p className="events__note">
                As próximas semanas seguem o formato Pizza, Sushi e Burger Night. Datas marcadas como “a confirmar”
                dependem da agenda oficial do lounge.
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="events__perks">
          <p className="eyebrow">Em todas as noites</p>
          <ul>
            {site.perks.map((perk) => {
              const Icon = perkIcons[perk.icon]
              return (
                <li key={perk.id}>
                  <Icon />
                  <span>{perk.title}</span>
                </li>
              )
            })}
          </ul>
        </div>
      </div>
    </section>
  )
}
