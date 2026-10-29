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
  return [
    'Olá, HAZ! Quero reservar minha vaga:',
    '',
    `Noite: ${event.title}, ${date.weekday} ${date.short}, ${event.startTime}`,
    `${seats.length > 1 ? 'Cadeiras' : 'Cadeira'}: ${joinSeats(seats)}`,
    `Valor: ${formatMoney(event.buyIn * seats.length)}${seats.length > 1 ? ` (${seats.length} × ${formatMoney(event.buyIn)})` : ''}`,
    `Nome: ${name}`,
    `WhatsApp: ${whatsapp}`,
    '',
    'Como faço o pagamento?',
  ].join('\n')
}

export const buildRentalMessage = (input: RentalInput) => {
  const [year, month, day] = input.date.split('-')
  return [
    'Olá, HAZ! Quero alugar o lounge para o meu jogo:',
    '',
    `Data: ${day}/${month}/${year}, às ${input.startTime}`,
    `Convidados: ${input.guests}`,
    `Ocasião: ${input.occasion}`,
    ...(input.interests.length ? [`Interesses: ${input.interests.join(', ')}`] : []),
    ...(input.message ? [`Detalhes: ${input.message}`] : []),
    `Nome: ${input.name}`,
    `WhatsApp: ${input.whatsapp}`,
    ...(input.email ? [`E-mail: ${input.email}`] : []),
    '',
    'Pode me passar disponibilidade e valores?',
  ].join('\n')
}
