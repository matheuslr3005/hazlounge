import type { LoungeEvent } from '../data/events'
import { parseEventDate } from '../data/events'

export type PaymentMethod = 'pix' | 'card' | 'onsite'

export type SeatReservation = {
  kind: 'seat'
  code: string
  createdAt: string
  eventId: string
  eventTitle: string
  eventDate: string
  startTime: string
  seats: number[]
  total: number
  method: PaymentMethod
  paid: boolean
  name: string
  whatsapp: string
  email: string
}

export type RentalRequest = {
  kind: 'rental'
  code: string
  createdAt: string
  name: string
  whatsapp: string
  email: string
  date: string
  startTime: string
  guests: number
  occasion: string
  interests: string[]
  message: string
}

export type SeatBookingInput = Omit<SeatReservation, 'kind' | 'code' | 'createdAt' | 'paid'> & { paid?: boolean }
export type RentalInput = Omit<RentalRequest, 'kind' | 'code' | 'createdAt'>

const STORAGE_KEY = 'haz:reservations'
const CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'

const makeCode = () =>
  `HAZ-${Array.from({ length: 5 }, () => CODE_ALPHABET[Math.floor(Math.random() * CODE_ALPHABET.length)]).join('')}`

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

const persist = (entry: SeatReservation | RentalRequest) => {
  try {
    const current = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]') as unknown[]
    localStorage.setItem(STORAGE_KEY, JSON.stringify([entry, ...current].slice(0, 50)))
  } catch {
    // storage blocked (private mode); the confirmation screen still works
  }
}

/**
 * DEMO BACKEND — swap these two functions for real API calls (and a payment provider
 * such as Mercado Pago, Pagar.me or Stripe) before going live. Nothing leaves the browser today.
 */
export const submitSeatReservation = async (input: SeatBookingInput): Promise<SeatReservation> => {
  await wait(900)
  const reservation: SeatReservation = {
    ...input,
    kind: 'seat',
    code: makeCode(),
    createdAt: new Date().toISOString(),
    paid: input.paid ?? input.method !== 'onsite',
  }
  persist(reservation)
  return reservation
}

export const submitRentalRequest = async (input: RentalInput): Promise<RentalRequest> => {
  await wait(900)
  const request: RentalRequest = { ...input, kind: 'rental', code: makeCode(), createdAt: new Date().toISOString() }
  persist(request)
  return request
}

const pad = (value: number) => String(value).padStart(2, '0')

/** Builds a minimal .ics so the player can save the night to their calendar */
export const buildCalendarFile = (event: Pick<LoungeEvent, 'title' | 'date' | 'startTime'>, code: string) => {
  const date = parseEventDate(event.date)
  const hour = Number.parseInt(event.startTime, 10) || 19
  const stamp = `${date.getFullYear()}${pad(date.getMonth() + 1)}${pad(date.getDate())}`
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//HAZ Poker Lounge//PT-BR',
    'BEGIN:VEVENT',
    `UID:${code}@hazpokerlounge`,
    `DTSTAMP:${stamp}T000000`,
    `DTSTART:${stamp}T${pad(hour)}0000`,
    `DTEND:${stamp}T235900`,
    `SUMMARY:${event.title} · HAZ Poker Lounge`,
    `DESCRIPTION:Reserva ${code}. Hold'em e variações, bebidas e narguilé liberados para os jogadores.`,
    'END:VEVENT',
    'END:VCALENDAR',
  ]
  return new Blob([lines.join('\r\n')], { type: 'text/calendar;charset=utf-8' })
}

export const formatMoney = (value: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(value)

export const formatPhone = (raw: string) => {
  const digits = raw.replace(/\D/g, '').slice(0, 11)
  if (digits.length <= 2) return digits
  if (digits.length <= 7) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`
}
