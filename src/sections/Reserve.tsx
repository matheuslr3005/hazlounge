import { AnimatePresence, motion } from 'framer-motion'
import { lazy, Suspense, useEffect, useMemo, useRef, useState, type FormEvent, type ReactNode } from 'react'
import { ArrowIcon, CheckIcon } from '../components/Icons'
import { SEAT_TOTAL, SeatMap } from '../components/SeatMap'
import {
  events,
  formatEventDate,
  isEventPast,
  takenSeatsFor,
  type LoungeEvent,
} from '../data/events'
import { site } from '../data/site'
import {
  buildCalendarFile,
  formatMoney,
  formatPhone,
  submitRentalRequest,
  submitSeatReservation,
  type PaymentMethod,
  type RentalRequest,
  type SeatReservation,
} from '../lib/booking'
import { useApp } from '../store'
import './Reserve.css'

const ChipViewer = lazy(() => import('../components/ChipViewer'))

const MAX_SEATS = 3

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

/** Decorative QR-like pattern seeded by a string. Not scannable: demo only. */
const PseudoQr = ({ seed, size = 132 }: { seed: string; size?: number }) => {
  const cells = useMemo(() => {
    let state = 0
    for (const char of seed) state = (state * 33 + char.charCodeAt(0)) >>> 0
    const next = () => {
      state = (state * 1664525 + 1013904223) >>> 0
      return state / 0xffffffff
    }
    const n = 25
    const finder = (x: number, y: number) =>
      (x < 7 && y < 7) || (x > n - 8 && y < 7) || (x < 7 && y > n - 8)
    return Array.from({ length: n * n }, (_, i) => {
      const x = i % n
      const y = Math.floor(i / n)
      return finder(x, y) ? false : next() > 0.52
    }).map((on, i) => ({ on, x: i % n, y: Math.floor(i / n) }))
  }, [seed])

  const Finder = ({ x, y }: { x: number; y: number }) => (
    <g transform={`translate(${x} ${y})`}>
      <rect width="7" height="7" fill="#070707" />
      <rect x="1" y="1" width="5" height="5" fill="#f4ecd9" />
      <rect x="2" y="2" width="3" height="3" fill="#070707" />
    </g>
  )

  return (
    <svg viewBox="0 0 25 25" width={size} height={size} role="img" aria-label="QR de demonstração" shapeRendering="crispEdges">
      <rect width="25" height="25" fill="#f4ecd9" />
      {cells.filter((cell) => cell.on).map((cell) => (
        <rect key={`${cell.x}-${cell.y}`} x={cell.x} y={cell.y} width="1" height="1" fill="#070707" />
      ))}
      <Finder x={0} y={0} />
      <Finder x={18} y={0} />
      <Finder x={0} y={18} />
    </svg>
  )
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

const downloadCalendar = (event: Pick<LoungeEvent, 'title' | 'date' | 'startTime'>, code: string) => {
  const url = URL.createObjectURL(buildCalendarFile(event, code))
  const link = document.createElement('a')
  link.href = url
  link.download = `${code}.ics`
  link.click()
  URL.revokeObjectURL(url)
}

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

/* ---------------------------- seat reservation ---------------------------- */

type Step = 'seat' | 'details' | 'payment' | 'pix' | 'done'

const STEP_LABELS = [
  { id: 'seat', label: 'Cadeira' },
  { id: 'details', label: 'Seus dados' },
  { id: 'payment', label: 'Pagamento' },
] as const

const stepIndex = (step: Step) => (step === 'pix' ? 2 : step === 'done' ? 3 : STEP_LABELS.findIndex((item) => item.id === step))

const PAYMENT_OPTIONS: { id: PaymentMethod; title: string; text: string }[] = [
  { id: 'pix', title: 'PIX', text: 'Pague na hora e a vaga fica garantida.' },
  { id: 'card', title: 'Cartão de crédito', text: 'Pagamento em ambiente seguro do provedor.' },
  { id: 'onsite', title: 'Pagar na chegada', text: 'A equipe confirma sua pré-reserva pelo WhatsApp.' },
]

const bookableEvents = events.filter((event) => !isEventPast(event))

const SeatBooking = () => {
  const reserveEventId = useApp((state) => state.reserveEventId)

  const [eventId, setEventId] = useState(() => reserveEventId ?? bookableEvents[0]?.id ?? '')
  const [seats, setSeats] = useState<number[]>([])
  const [step, setStep] = useState<Step>('seat')
  const [form, setForm] = useState({ name: '', whatsapp: '', email: '' })
  const [touched, setTouched] = useState(false)
  const [method, setMethod] = useState<PaymentMethod>('pix')
  const [submitting, setSubmitting] = useState(false)
  const [result, setResult] = useState<SeatReservation | null>(null)

  const event = events.find((item) => item.id === eventId) ?? bookableEvents[0]
  const taken = useMemo(() => (event ? takenSeatsFor(event.id, SEAT_TOTAL).map((seat) => seat + 1) : []), [event])
  const total = event ? seats.length * event.buyIn : 0

  useEffect(() => {
    if (reserveEventId && events.some((item) => item.id === reserveEventId)) {
      setEventId(reserveEventId)
      setSeats([])
      setStep('seat')
      setResult(null)
    }
  }, [reserveEventId])

  const errors = {
    name: form.name.trim().length < 3 ? 'Informe seu nome completo.' : undefined,
    whatsapp: form.whatsapp.replace(/\D/g, '').length < 10 ? 'Informe um WhatsApp com DDD.' : undefined,
    email: form.email && !/^\S+@\S+\.\S+$/.test(form.email) ? 'E-mail inválido.' : undefined,
  }
  const hasErrors = Boolean(errors.name || errors.whatsapp || errors.email)

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

  const goPayment = (submitEvent: FormEvent) => {
    submitEvent.preventDefault()
    setTouched(true)
    if (!hasErrors) setStep('payment')
  }

  const finish = async (paid: boolean) => {
    setSubmitting(true)
    const reservation = await submitSeatReservation({
      eventId: event.id,
      eventTitle: event.title,
      eventDate: event.date,
      startTime: event.startTime,
      seats,
      total,
      method,
      paid,
      name: form.name.trim(),
      whatsapp: form.whatsapp,
      email: form.email.trim(),
    })
    setSubmitting(false)
    setResult(reservation)
    setStep('done')
  }

  const confirm = () => (method === 'pix' ? setStep('pix') : finish(method === 'card'))

  const reset = () => {
    setSeats([])
    setStep('seat')
    setResult(null)
    setTouched(false)
  }

  const date = formatEventDate(event.date)
  const current = stepIndex(step)

  return (
    <div className="booking">
      <div className="booking__main">
        {step !== 'done' && (
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
                Disponibilidade de demonstração. Ela passa a refletir o salão de verdade quando o sistema de reservas for
                conectado.
              </p>

              <div className="panel__actions">
                <button type="button" className="btn" disabled={seats.length === 0} onClick={goDetails}>
                  Continuar <ArrowIcon />
                </button>
              </div>
            </motion.div>
          )}

          {step === 'details' && (
            <motion.form key="details" {...fade} className="panel" onSubmit={goPayment} noValidate>
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
                <Field label="WhatsApp" error={touched ? errors.whatsapp : undefined} hint="Enviamos a confirmação por aqui.">
                  <input
                    type="tel"
                    inputMode="tel"
                    autoComplete="tel"
                    value={form.whatsapp}
                    onChange={(e) => setForm({ ...form, whatsapp: formatPhone(e.target.value) })}
                    placeholder="(11) 90000-0000"
                  />
                </Field>
                <Field label="E-mail (opcional)" error={touched ? errors.email : undefined}>
                  <input
                    type="email"
                    autoComplete="email"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    placeholder="voce@email.com"
                  />
                </Field>
              </div>
              <div className="panel__actions">
                <button type="button" className="btn btn--ghost" onClick={() => setStep('seat')}>
                  Voltar
                </button>
                <button type="submit" className="btn">
                  Ir para pagamento <ArrowIcon />
                </button>
              </div>
            </motion.form>
          )}

          {step === 'payment' && (
            <motion.div key="payment" {...fade} className="panel">
              <h3 className="panel__title">Como você prefere pagar?</h3>
              <div className="pay" role="radiogroup" aria-label="Forma de pagamento">
                {PAYMENT_OPTIONS.map((option) => (
                  <button
                    key={option.id}
                    type="button"
                    role="radio"
                    aria-checked={method === option.id}
                    className={method === option.id ? 'is-active' : ''}
                    onClick={() => setMethod(option.id)}
                  >
                    <span className="pay__dot" />
                    <span>
                      <strong>{option.title}</strong>
                      <small>{option.text}</small>
                    </span>
                  </button>
                ))}
              </div>
              <p className="panel__note">
                Ambiente de demonstração: nenhum pagamento real é processado e nenhum dado de cartão é coletado aqui.
              </p>
              <div className="panel__actions">
                <button type="button" className="btn btn--ghost" onClick={() => setStep('details')}>
                  Voltar
                </button>
                <button type="button" className="btn" disabled={submitting} onClick={confirm}>
                  {submitting ? 'Confirmando…' : method === 'onsite' ? 'Pré-reservar vaga' : `Pagar ${formatMoney(total)}`}
                  {!submitting && <ArrowIcon />}
                </button>
              </div>
            </motion.div>
          )}

          {step === 'pix' && (
            <motion.div key="pix" {...fade} className="panel panel--pix">
              <h3 className="panel__title">Pague com PIX</h3>
              <div className="pix">
                <PseudoQr seed={`${event.id}-${seats.join('')}-${form.name}`} size={168} />
                <div>
                  <p className="pix__amount">{formatMoney(total)}</p>
                  <p className="panel__note">
                    QR e código de demonstração. Com o provedor de pagamento conectado, o PIX real aparece aqui e a
                    confirmação é automática.
                  </p>
                  <code className="pix__code">HAZ-DEMO-PIX-{seats.join('')}</code>
                </div>
              </div>
              <div className="panel__actions">
                <button type="button" className="btn btn--ghost" onClick={() => setStep('payment')}>
                  Voltar
                </button>
                <button type="button" className="btn" disabled={submitting} onClick={() => finish(true)}>
                  {submitting ? 'Confirmando…' : 'Simular pagamento aprovado'}
                </button>
              </div>
            </motion.div>
          )}

          {step === 'done' && result && (
            <motion.div key="done" {...fade} className="panel panel--done">
              <div className="done__badge">
                <CheckIcon />
              </div>
              <h3 className="display">Vaga {result.paid ? 'garantida' : 'pré-reservada'}</h3>
              <p className="panel__note">
                {result.paid
                  ? 'Seu pagamento foi confirmado. Apresente o código na entrada.'
                  : 'Sua pré-reserva foi registrada. A equipe confirma com você pelo WhatsApp.'}
              </p>

              <div className="ticket frame">
                <span className="corner-bl" />
                <span className="corner-br" />
                <div className="ticket__main">
                  <p className="ticket__label">{date.weekday} · {date.short} · {event.startTime}</p>
                  <h4 className="cond">{event.title}</h4>
                  <dl>
                    <div>
                      <dt>Jogador</dt>
                      <dd>{result.name}</dd>
                    </div>
                    <div>
                      <dt>{result.seats.length > 1 ? 'Cadeiras' : 'Cadeira'}</dt>
                      <dd>{result.seats.join(' · ')}</dd>
                    </div>
                    <div>
                      <dt>{result.paid ? 'Pago' : 'A pagar'}</dt>
                      <dd>{formatMoney(result.total)}</dd>
                    </div>
                  </dl>
                </div>
                <div className="ticket__stub">
                  <PseudoQr seed={result.code} size={96} />
                  <strong>{result.code}</strong>
                </div>
              </div>

              <div className="panel__actions">
                <button type="button" className="btn btn--ghost" onClick={() => downloadCalendar(event, result.code)}>
                  Salvar no calendário
                </button>
                <button type="button" className="btn" onClick={reset}>
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
              <dd>{seats.length ? seats.join(', ') : '—'}</dd>
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
  const [submitting, setSubmitting] = useState(false)
  const [result, setResult] = useState<RentalRequest | null>(null)

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

  const submit = async (submitEvent: FormEvent) => {
    submitEvent.preventDefault()
    setTouched(true)
    if (invalid) return
    setSubmitting(true)
    setResult(await submitRentalRequest({ ...form, name: form.name.trim(), message: form.message.trim() }))
    setSubmitting(false)
  }

  const whatsappLink = result && site.whatsapp
    ? `https://wa.me/${site.whatsapp}?text=${encodeURIComponent(
        `Olá! Fiz um pedido de aluguel do HAZ (${result.code}) para ${result.date}, ${result.guests} pessoas.`,
      )}`
    : null

  return (
    <div className="booking">
      <div className="booking__main">
        <AnimatePresence mode="wait">
          {result ? (
            <motion.div key="sent" {...fade} className="panel panel--done">
              <div className="done__badge">
                <CheckIcon />
              </div>
              <h3 className="display">Pedido enviado</h3>
              <p className="panel__note">
                Recebemos sua solicitação <strong>{result.code}</strong>. A equipe do HAZ retorna com disponibilidade e
                valores pelo WhatsApp informado.
              </p>
              <div className="panel__actions">
                {whatsappLink && (
                  <a className="btn" href={whatsappLink} target="_blank" rel="noreferrer">
                    Falar no WhatsApp
                  </a>
                )}
                <button type="button" className="btn btn--ghost" onClick={() => setResult(null)}>
                  Novo pedido
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
                <button type="submit" className="btn" disabled={submitting}>
                  {submitting ? 'Enviando…' : 'Solicitar orçamento'} {!submitting && <ArrowIcon />}
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
            <li>Você envia data, horário e número de convidados.</li>
            <li>A equipe confere a agenda e responde com valores.</li>
            <li>Combinado, o lounge fica reservado para o seu jogo.</li>
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
      <div className="section__inner">
        <header className="section-head section-head--center">
          <p className="eyebrow">Reservas</p>
          <h2 className="display">
            Sua cadeira <span className="gold-text">te espera</span>
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
