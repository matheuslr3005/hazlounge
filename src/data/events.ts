export type EventKind = 'pizza' | 'sushi' | 'burger'

export type LoungeEvent = {
  id: string
  title: string
  kind: EventKind
  /** ISO date (yyyy-mm-dd), local time */
  date: string
  buyIn: number
  startTime: string
  /** false → data ainda não confirmada pelo lounge */
  confirmed: boolean
  tagline: string
}

const TAGLINES: Record<EventKind, string> = {
  pizza: 'Fatias fumegantes, fichas no centro da mesa.',
  sushi: 'Sushi na mão, blefe no olhar.',
  burger: 'Hambúrguer artesanal e pote crescendo.',
}

const buildEvent = (
  date: string,
  kind: EventKind,
  title: string,
  confirmed: boolean,
): LoungeEvent => ({
  id: `${kind}-night-${date}`,
  title,
  kind,
  date,
  buyIn: 500,
  startTime: '19h',
  confirmed,
  tagline: TAGLINES[kind],
})

/**
 * Agenda do lounge. A semana de 20–22/10 vem do post oficial;
 * as semanas seguintes repetem o formato e estão marcadas como "a confirmar".
 */
export const events: LoungeEvent[] = [
  buildEvent('2026-10-20', 'pizza', 'Pizza Night', true),
  buildEvent('2026-10-21', 'sushi', 'Sushi Night', true),
  buildEvent('2026-10-22', 'burger', 'Burger Night', true),
  buildEvent('2026-10-27', 'pizza', 'Pizza Night', false),
  buildEvent('2026-10-28', 'sushi', 'Sushi Night', false),
  buildEvent('2026-10-29', 'burger', 'Burger Night', false),
  buildEvent('2026-11-03', 'pizza', 'Pizza Night', false),
  buildEvent('2026-11-04', 'sushi', 'Sushi Night', false),
  buildEvent('2026-11-05', 'burger', 'Burger Night', false),
]

const WEEKDAYS = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado']
const MONTHS = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez']

export const parseEventDate = (iso: string) => {
  const [year, month, day] = iso.split('-').map(Number)
  return new Date(year, month - 1, day)
}

export const formatEventDate = (iso: string) => {
  const date = parseEventDate(iso)
  const day = String(date.getDate()).padStart(2, '0')
  const month = String(date.getMonth() + 1).padStart(2, '0')
  return {
    weekday: WEEKDAYS[date.getDay()],
    short: `${day}/${month}`,
    day,
    monthLabel: MONTHS[date.getMonth()],
  }
}

const startOfDay = (date: Date) => new Date(date.getFullYear(), date.getMonth(), date.getDate())

export const isEventPast = (event: LoungeEvent, now = new Date()) =>
  parseEventDate(event.date) < startOfDay(now)

export const isEventToday = (event: LoungeEvent, now = new Date()) =>
  parseEventDate(event.date).getTime() === startOfDay(now).getTime()

/** Cadeiras já confirmadas pela equipe (1 a 9), por noite. Edite aqui quando fechar uma reserva pelo WhatsApp. */
const TAKEN_SEATS: Record<string, number[]> = {
  // 'pizza-night-2026-10-27': [2, 5],
}

export const takenSeatsOf = (event: Pick<LoungeEvent, 'id'>): number[] => TAKEN_SEATS[event.id] ?? []
