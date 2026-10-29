import { AnimatePresence, motion } from 'framer-motion'
import { lazy, Suspense, useEffect, useMemo, useRef, useState, type FormEvent, type ReactNode } from 'react'
import { AcePattern } from '../components/AcePattern'
import { ArrowIcon, CheckIcon } from '../components/Icons'
import { SeatMap } from '../components/SeatMap'
import { events, formatEventDate, isEventPast, takenSeatsOf } from '../data/events'
import { MAX_SEATS_PER_BOOKING as MAX_SEATS, SEAT_TOTAL } from '../data/tables'
import {
  buildRentalMessage,
  buildSeatMessage,
  formatMoney,
  formatPhone,
  joinSeats,
  whatsappUrl,
  type RentalInput,
} from '../lib/booking'
import { useApp } from '../store'
import './Reserve.css'

const ChipViewer = lazy(() => import('../components/ChipViewer'))

const fade = {
  initial: { opacity: 0, y: 18 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -12 },
  transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] as const },
}

/* ------------------------------- helpers --------------------------------- */

const useInView = <T extends Element>() => {
  const ref = useRef<T>(null)
  const [seen, setSeen] = useState(false)
  useEffect(() => {
    const node = ref.current
    if (!node) return
    const observer = new IntersectionObserver(([entry]) => entry.isIntersecting && setSeen(true), {
      rootMargin: '200px',
    })
    observer.observe(node)
    return () => observer.disconnect()
  }, [])
  return [ref, seen] as const
}


const Field = ({
  label,
  hint,
  error,
  children,
}: {
  label: string
  hint?: string
  error?: string
  children: ReactNode
}) => (
  <label className={`field ${error ? 'has-error' : ''}`}>
    <span className="field__label">{label}</span>
    {children}
    {(error || hint) && <span className="field__hint">{error ?? hint}</span>}
  </label>
)

const FloatingChip = () => {
  const [ref, seen] = useInView<HTMLDivElement>()
  return (
    <div className="chip-stage" ref={ref}>
      {seen && (
        <Suspense fallback={null}>
          <ChipViewer />
        </Suspense>
      )}
      <span className="chip-stage__hint">Arraste para girar</span>
    </div>
  )
}


/** Abre o WhatsApp do HAZ com a mensagem pronta; sem número configurado, cai no botão de copiar. */
const SendButtons = ({ message, onSent }: { message: string; onSent?: () => void }) => {
  const link = whatsappUrl(message)
  const [copied, setCopied] = useState(false)
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(message)
      setCopied(true)
      setTimeout(() => setCopied(false), 2500)
    } catch {
      // sem permissão da área de transferência: o texto continua visível na tela
    }
  }
  return link ? (
    <a className="btn" href={link} target="_blank" rel="noreferrer" onClick={onSent}>
      Reservar pelo WhatsApp <ArrowIcon />
    </a>
  ) : (
    <button type="button" className="btn" onClick={copy}>
      {copied ? 'Pedido copiado' : 'Copiar pedido de reserva'}
    </button>
  )
}

/* ---------------------------- seat reservation ---------------------------- */

type Step = 'seat' | 'details' | 'send' | 'sent'

const STEP_LABELS = [
  { id: 'seat', label: 'Cadeira' },
  { id: 'details', label: 'Seus dados' },
  { id: 'send', label: 'WhatsApp' },
] as const

const stepIndex = (step: Step) => (step === 'sent' ? 3 : STEP_LABELS.findIndex((item) => item.id === step))

const bookableEvents = events.filter((event) => !isEventPast(event))

const SeatBooking = () => {
  const reserveEventId = useApp((state) => state.reserveEventId)

  const [eventId, setEventId] = useState(() => reserveEventId ?? bookableEvents[0]?.id ?? '')
  const [seats, setSeats] = useState<number[]>([])
  const [step, setStep] = useState<Step>('seat')
  const [form, setForm] = useState({ name: '', whatsapp: '' })
  const [touched, setTouched] = useState(false)

  const event = events.find((item) => item.id === eventId) ?? bookableEvents[0]
  const taken = useMemo(() => (event ? takenSeatsOf(event) : []), [event])
  const total = event ? seats.length * event.buyIn : 0

  useEffect(() => {
    if (reserveEventId && events.some((item) => item.id === reserveEventId)) {
      setEventId(reserveEventId)
      setSeats([])
      setStep('seat')
    }
  }, [reserveEventId])

  const errors = {
    name: form.name.trim().length < 3 ? 'Informe seu nome completo.' : undefined,
    whatsapp: form.whatsapp.replace(/\D/g, '').length < 10 ? 'Informe um WhatsApp com DDD.' : undefined,
  }
  const hasErrors = Boolean(errors.name || errors.whatsapp)

  if (!event) {
    return <p className="panel__empty">Nenhum evento aberto para reserva no momento.</p>
  }

  const pickEvent = (id: string) => {
    setEventId(id)
    setSeats([])
  }

  const toggleSeat = (seat: number) =>
    setSeats((current) => (current.includes(seat) ? current.filter((item) => item !== seat) : [...current, seat].sort((a, b) => a - b)))

  const goDetails = () => seats.length > 0 && setStep('details')

  const goSend = (submitEvent: FormEvent) => {
    submitEvent.preventDefault()
    setTouched(true)
    if (!hasErrors) setStep('send')
  }

  const reset = () => {
    setSeats([])
    setStep('seat')
    setTouched(false)
  }

  const message = buildSeatMessage({ event, seats, name: form.name.trim(), whatsapp: form.whatsapp })
  const date = formatEventDate(event.date)
  const current = stepIndex(step)

  return (
    <div className="booking">
      <div className="booking__main">
        {step !== 'sent' && (
          <ol className="steps" aria-label="Etapas da reserva">
            {STEP_LABELS.map((item, index) => (
              <li key={item.id} className={index === current ? 'is-active' : index < current ? 'is-done' : ''}>
                <span>{index < current ? <CheckIcon /> : index + 1}</span>
                {item.label}
              </li>
            ))}
          </ol>
        )}

        <AnimatePresence mode="wait">
          {step === 'seat' && (
            <motion.div key="seat" {...fade} className="panel">
              <h3 className="panel__title">Escolha a noite</h3>
              <div className="event-pills" role="radiogroup" aria-label="Evento">
                {bookableEvents.map((item) => {
                  const itemDate = formatEventDate(item.date)
                  return (
                    <button
                      key={item.id}
                      type="button"
                      role="radio"
                      aria-checked={item.id === event.id}
                      className={item.id === event.id ? 'is-active' : ''}
                      onClick={() => pickEvent(item.id)}
                    >
                      <small>
                        {itemDate.weekday.slice(0, 3)} · {itemDate.short}
                      </small>
                      <strong className="cond">{item.title}</strong>
                    </button>
                  )
                })}
              </div>

              <h3 className="panel__title">
                Escolha {MAX_SEATS > 1 ? `até ${MAX_SEATS} cadeiras` : 'sua cadeira'}
                <small>
                  {SEAT_TOTAL - taken.length} de {SEAT_TOTAL} livres
                </small>
              </h3>
              <SeatMap taken={taken} selected={seats} maxSelectable={MAX_SEATS} onToggle={toggleSeat} />
              <ul className="legend" aria-hidden>
                <li>
                  <i className="is-free" /> Livre
                </li>
                <li>
                  <i className="is-selected" /> Sua escolha
                </li>
                <li>
                  <i className="is-taken" /> Ocupada
                </li>
              </ul>
              <p className="panel__note">
                Cadeiras ocupadas já foram confirmadas pela equipe. A sua só fica garantida depois da confirmação pelo WhatsApp.
              </p>

              <div className="panel__actions">
                <button type="button" className="btn" disabled={seats.length === 0} onClick={goDetails}>
                  Continuar <ArrowIcon />
                </button>
              </div>
            </motion.div>
          )}

          {step === 'details' && (
            <motion.form key="details" {...fade} className="panel" onSubmit={goSend} noValidate>
              <h3 className="panel__title">Quem vai sentar à mesa?</h3>
              <div className="fields">
                <Field label="Nome completo" error={touched ? errors.name : undefined}>
                  <input
                    type="text"
                    autoComplete="name"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    placeholder="Como está no seu documento"
                  />
                </Field>
                <Field label="Seu WhatsApp" error={touched ? errors.whatsapp : undefined} hint="A equipe responde por este número.">
                  <input
                    type="tel"
                    inputMode="tel"
                    autoComplete="tel"
                    value={form.whatsapp}
                    onChange={(e) => setForm({ ...form, whatsapp: formatPhone(e.target.value) })}
                    placeholder="(11) 90000-0000"
                  />
                </Field>
              </div>
              <div className="panel__actions">
                <button type="button" className="btn btn--ghost" onClick={() => setStep('seat')}>
                  Voltar
                </button>
                <button type="submit" className="btn">
                  Revisar pedido <ArrowIcon />
                </button>
              </div>
            </motion.form>
          )}

          {step === 'send' && (
            <motion.div key="send" {...fade} className="panel">
              <h3 className="panel__title">Confira e envie pelo WhatsApp</h3>
              <pre className="message">{message}</pre>
              <p className="panel__note">
                Ao tocar no botão, abrimos a conversa com o HAZ com este pedido já escrito. A equipe confirma sua cadeira e
                combina o pagamento com você por lá. Não cobramos nada neste site.
              </p>
              <div className="panel__actions">
                <button type="button" className="btn btn--ghost" onClick={() => setStep('details')}>
                  Voltar
                </button>
                <SendButtons message={message} onSent={() => setStep('sent')} />
              </div>
            </motion.div>
          )}

          {step === 'sent' && (
            <motion.div key="sent" {...fade} className="panel panel--done">
              <div className="done__badge">
                <CheckIcon />
              </div>
              <h3 className="display">Pedido pronto</h3>
              <p className="panel__note">
                Falta só enviar a mensagem no WhatsApp, se ela ainda não saiu. Sua cadeira fica garantida quando a equipe
                confirmar e combinar o pagamento com você.
              </p>
              <div className="panel__actions">
                <SendButtons message={message} />
                <button type="button" className="btn btn--ghost" onClick={reset}>
                  Nova reserva
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <aside className="booking__aside">
        <FloatingChip />
        <div className="summary frame">
          <span className="corner-bl" />
          <span className="corner-br" />
          <p className="eyebrow eyebrow--left">Resumo</p>
          <h4 className="cond">{event.title}</h4>
          <p className="summary__date">
            {date.weekday} {date.short} · início às {event.startTime}
          </p>
          <dl>
            <div>
              <dt>Buy-in</dt>
              <dd>{formatMoney(event.buyIn)}</dd>
            </div>
            <div>
              <dt>Cadeiras</dt>
              <dd>{seats.length ? joinSeats(seats) : '—'}</dd>
            </div>
            <div className="summary__total">
              <dt>Total</dt>
              <dd className="gold-text">{formatMoney(total)}</dd>
            </div>
          </dl>
          {!event.confirmed && <p className="summary__warn">Data a confirmar pelo lounge.</p>}
        </div>
      </aside>
    </div>
  )
}

/* -------------------------------- rental --------------------------------- */

const OCCASIONS = ['Home game privado', 'Aniversário', 'Confraternização', 'Despedida', 'Torneio entre amigos', 'Outro']
const INTERESTS = ['Dealer profissional', 'Bebidas liberadas', 'Narguilé', 'Pizza / Sushi / Burger', 'Torneio estruturado']

const todayIso = () => {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
}

const RentalForm = () => {
  const [form, setForm] = useState({
    name: '',
    whatsapp: '',
    email: '',
    date: '',
    startTime: '19:00',
    guests: 10,
    occasion: OCCASIONS[0],
    interests: [] as string[],
    message: '',
  })
  const [touched, setTouched] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  const errors = {
    name: form.name.trim().length < 3 ? 'Informe seu nome.' : undefined,
    whatsapp: form.whatsapp.replace(/\D/g, '').length < 10 ? 'Informe um WhatsApp com DDD.' : undefined,
    date: form.date ? undefined : 'Escolha uma data.',
  }
  const invalid = Boolean(errors.name || errors.whatsapp || errors.date)

  const toggleInterest = (value: string) =>
    setForm((current) => ({
      ...current,
      interests: current.interests.includes(value)
        ? current.interests.filter((item) => item !== value)
        : [...current.interests, value],
    }))

  const submit = (submitEvent: FormEvent) => {
    submitEvent.preventDefault()
    setTouched(true)
    if (invalid) return
    const input: RentalInput = { ...form, name: form.name.trim(), email: form.email.trim(), message: form.message.trim() }
    setMessage(buildRentalMessage(input))
  }

  return (
    <div className="booking">
      <div className="booking__main">
        <AnimatePresence mode="wait">
          {message ? (
            <motion.div key="sent" {...fade} className="panel panel--done">
              <div className="done__badge">
                <CheckIcon />
              </div>
              <h3 className="display">Pedido pronto</h3>
              <pre className="message">{message}</pre>
              <p className="panel__note">
                Envie pelo WhatsApp. A equipe do HAZ confere a agenda e responde com disponibilidade e valores.
              </p>
              <div className="panel__actions">
                <SendButtons message={message} />
                <button type="button" className="btn btn--ghost" onClick={() => setMessage(null)}>
                  Editar pedido
                </button>
              </div>
            </motion.div>
          ) : (
            <motion.form key="form" {...fade} className="panel" onSubmit={submit} noValidate>
              <h3 className="panel__title">Reserve o lounge para o seu jogo</h3>
              <div className="fields fields--two">
                <Field label="Nome" error={touched ? errors.name : undefined}>
                  <input type="text" autoComplete="name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
                </Field>
                <Field label="WhatsApp" error={touched ? errors.whatsapp : undefined}>
                  <input
                    type="tel"
                    inputMode="tel"
                    autoComplete="tel"
                    value={form.whatsapp}
                    onChange={(e) => setForm({ ...form, whatsapp: formatPhone(e.target.value) })}
                    placeholder="(11) 90000-0000"
                  />
                </Field>
                <Field label="Data desejada" error={touched ? errors.date : undefined}>
                  <input type="date" min={todayIso()} value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
                </Field>
                <Field label="Horário de início">
                  <input type="time" value={form.startTime} onChange={(e) => setForm({ ...form, startTime: e.target.value })} />
                </Field>
              </div>

              <Field label="E-mail (opcional)">
                <input type="email" autoComplete="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
              </Field>

              <div className="field">
                <span className="field__label">Quantidade de convidados</span>
                <div className="stepper">
                  <button type="button" aria-label="Menos um convidado" onClick={() => setForm({ ...form, guests: Math.max(2, form.guests - 1) })}>
                    −
                  </button>
                  <output aria-live="polite">{form.guests}</output>
                  <button type="button" aria-label="Mais um convidado" onClick={() => setForm({ ...form, guests: Math.min(80, form.guests + 1) })}>
                    +
                  </button>
                </div>
              </div>

              <fieldset className="field">
                <legend className="field__label">Ocasião</legend>
                <div className="pills">
                  {OCCASIONS.map((item) => (
                    <button
                      key={item}
                      type="button"
                      className={form.occasion === item ? 'is-active' : ''}
                      aria-pressed={form.occasion === item}
                      onClick={() => setForm({ ...form, occasion: item })}
                    >
                      {item}
                    </button>
                  ))}
                </div>
              </fieldset>

              <fieldset className="field">
                <legend className="field__label">Tenho interesse em</legend>
                <div className="pills">
                  {INTERESTS.map((item) => (
                    <button
                      key={item}
                      type="button"
                      className={form.interests.includes(item) ? 'is-active' : ''}
                      aria-pressed={form.interests.includes(item)}
                      onClick={() => toggleInterest(item)}
                    >
                      {item}
                    </button>
                  ))}
                </div>
              </fieldset>

              <Field label="Detalhes (opcional)">
                <textarea rows={3} value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} placeholder="Conte como imagina a noite" />
              </Field>

              <div className="panel__actions">
                <button type="submit" className="btn">
                  Revisar pedido <ArrowIcon />
                </button>
              </div>
            </motion.form>
          )}
        </AnimatePresence>
      </div>

      <aside className="booking__aside">
        <FloatingChip />
        <div className="summary frame">
          <span className="corner-bl" />
          <span className="corner-br" />
          <p className="eyebrow eyebrow--left">Como funciona</p>
          <ol className="summary__steps">
            <li>Você escolhe data, horário e número de convidados.</li>
            <li>Enviamos o pedido pronto para o WhatsApp do HAZ.</li>
            <li>A equipe confere a agenda, passa os valores e combina o pagamento por lá.</li>
          </ol>
        </div>
      </aside>
    </div>
  )
}

/* -------------------------------- section -------------------------------- */

export const Reserve = () => {
  const tab = useApp((state) => state.reserveTab)
  const openReservation = useApp((state) => state.openReservation)

  return (
    <section id="reservar" className="section reserve">
      <AcePattern />
      <div className="section__inner">
        <header className="section-head section-head--center">
          <p className="eyebrow">Reservas</p>
          <h2 className="display reserve__title">
            Sente-se. <span className="gold-text">A mesa é sua.</span>
          </h2>
          <p>Garanta uma vaga em um dos eventos ou reserve o lounge inteiro para o seu próprio home game.</p>
        </header>

        <div className="tabs" role="tablist" aria-label="Tipo de reserva">
          {(
            [
              { id: 'event', label: 'Vaga em evento' },
              { id: 'rental', label: 'Alugar o lounge' },
            ] as const
          ).map((item) => (
            <button
              key={item.id}
              role="tab"
              type="button"
              aria-selected={tab === item.id}
              className={tab === item.id ? 'is-active' : ''}
              onClick={() => openReservation(item.id)}
            >
              {item.label}
              {tab === item.id && <motion.span layoutId="reserve-tab" className="tabs__marker" />}
            </button>
          ))}
        </div>

        <AnimatePresence mode="wait">
          <motion.div key={tab} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.25 }}>
            {tab === 'event' ? <SeatBooking /> : <RentalForm />}
          </motion.div>
        </AnimatePresence>
      </div>
    </section>
  )
}
