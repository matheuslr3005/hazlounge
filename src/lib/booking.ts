import { formatEventDate, type LoungeEvent } from '../data/events'
import { site } from '../data/site'

/**
 * Reservas e pagamentos acontecem no WhatsApp do HAZ, direto com a equipe. O site só monta o pedido
 * (noite, cadeiras, nome) e abre a conversa já escrita. Nenhum dado fica guardado aqui e não há cobrança no site.
 */

export type RentalInput = {
  name: string
  whatsapp: string
  email: string
  /** yyyy-mm-dd */
  date: string
  startTime: string
  guests: number
  occasion: string
  interests: string[]
  message: string
}

export const formatMoney = (value: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(value)

export const formatPhone = (raw: string) => {
  const digits = raw.replace(/\D/g, '').slice(0, 11)
  if (digits.length <= 2) return digits
  if (digits.length <= 7) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`
}

/** [2, 5, 8] → "2, 5 e 8" */
export const joinSeats = (seats: number[]) =>
  seats.length > 1 ? `${seats.slice(0, -1).join(', ')} e ${seats[seats.length - 1]}` : String(seats[0] ?? '')

/** Link que abre o WhatsApp do HAZ com a mensagem pronta. Fica nulo enquanto o número não estiver em site.ts. */
export const whatsappUrl = (message: string) =>
  site.whatsapp ? `https://wa.me/${site.whatsapp}?text=${encodeURIComponent(message)}` : null

export const buildSeatMessage = (input: {
  event: Pick<LoungeEvent, 'title' | 'date' | 'startTime' | 'buyIn'>
  seats: number[]
  name: string
  whatsapp: string
}) => {
  const { event, seats, name, whatsapp } = input
  const date = formatEventDate(event.date)
  const price = `${formatMoney(event.buyIn * seats.length)}${seats.length > 1 ? ` (${seats.length} × ${formatMoney(event.buyIn)})` : ''}`
  return (
    `Olá, HAZ! Aqui é ${name} (WhatsApp ${whatsapp}). Quero reservar ${seats.length > 1 ? 'as cadeiras' : 'a cadeira'} ${joinSeats(seats)} ` +
    `na ${event.title} (${date.weekday.toLowerCase()}, ${date.short}, ${event.startTime}), ${price}. ` +
    'Como faço o pagamento?'
  )
}

export const buildRentalMessage = (input: RentalInput) => {
  const [year, month, day] = input.date.split('-')
  const details = [
    `${input.guests} convidados`,
    input.occasion.toLowerCase(),
    ...(input.interests.length ? [`com interesse em ${input.interests.join(', ').toLowerCase()}`] : []),
  ].join(', ')
  return (
    `Olá, HAZ! Aqui é ${input.name} (WhatsApp ${input.whatsapp}${input.email ? `, e-mail ${input.email}` : ''}). ` +
    `Quero alugar o lounge no dia ${day}/${month}/${year}, às ${input.startTime} (${details}).` +
    `${input.message ? ` ${input.message}` : ''} Pode me passar disponibilidade e valores?`
  )
}
