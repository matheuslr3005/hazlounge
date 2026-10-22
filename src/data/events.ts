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

export const eventImage: Record<EventKind, string> = {
  pizza: `${import.meta.env.BASE_URL}images/pizza-night.png`,
  sushi: `${import.meta.env.BASE_URL}images/sushi-night.png`,
  burger: `${import.meta.env.BASE_URL}images/burger-night.png`,
}

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

/** Deterministic "taken seats" so the demo is stable per event until there is a real backend. */
export const takenSeatsFor = (eventId: string, seatCount: number): number[] => {
  let seed = 0
  for (const char of eventId) seed = (seed * 31 + char.charCodeAt(0)) >>> 0
  const taken: number[] = []
  const target = 3 + (seed % 3)
  let cursor = seed
  while (taken.length < target) {
    cursor = (cursor * 1664525 + 1013904223) >>> 0
    const seat = cursor % seatCount
    if (!taken.includes(seat)) taken.push(seat)
  }
  return taken
}
