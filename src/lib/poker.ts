export type Suit = 'S' | 'H' | 'D' | 'C'
export type Rank = 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13 | 14
export type CardData = { rank: Rank; suit: Suit }

export const SUIT_SYMBOL: Record<Suit, string> = { S: '♠', H: '♥', D: '♦', C: '♣' }
export const isRedSuit = (suit: Suit) => suit === 'H' || suit === 'D'

const RANK_LABEL: Partial<Record<Rank, string>> = { 11: 'J', 12: 'Q', 13: 'K', 14: 'A' }
export const rankLabel = (rank: Rank) => RANK_LABEL[rank] ?? String(rank)

/** Short notation: "AS", "10H", "7C" */
export const parseCard = (code: string): CardData => {
  const suit = code.slice(-1) as Suit
  const raw = code.slice(0, -1)
  const rank = ({ J: 11, Q: 12, K: 13, A: 14 }[raw] ?? Number(raw)) as Rank
  return { rank, suit }
}

export const parseCards = (codes: string) => codes.split(' ').map(parseCard)

export const cardKey = (card: CardData) => `${rankLabel(card.rank)}${card.suit}`
