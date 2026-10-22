export type HandTier = 'monster' | 'strong' | 'medium' | 'weak'

export type HandInfo = {
  id: string
  name: string
  tier: HandTier
  /** short notation, 5 cards */
  cards: string
  /** indexes of the cards that make the hand (the rest are kickers) */
  used: number[]
  description: string
  tip: string
  /** chance of finishing a 7-card Hold'em showdown with exactly this best hand */
  odds: string
}

export const tierInfo: Record<HandTier, { label: string; text: string }> = {
  monster: { label: 'Monstro', text: 'Quase imbatíveis. Raras, mas pagam o pote.' },
  strong: { label: 'Forte', text: 'Ganham a maioria dos showdowns.' },
  medium: { label: 'Média', text: 'Boas, mas pedem cuidado com a mesa.' },
  weak: { label: 'Fraca', text: 'Aparecem muito e perdem para quase tudo.' },
}

/** Strongest → weakest */
export const handRankings: HandInfo[] = [
  {
    id: 'royal-flush',
    name: 'Royal Flush',
    tier: 'monster',
    cards: 'AS KS QS JS 10S',
    used: [0, 1, 2, 3, 4],
    description: 'A, K, Q, J e 10 do mesmo naipe. É a maior mão do poker e não tem como ser vencida.',
    tip: 'Se aparecer, o desafio é fazer os outros pagarem.',
    odds: '0,003%',
  },
  {
    id: 'straight-flush',
    name: 'Straight Flush',
    tier: 'monster',
    cards: '9H 8H 7H 6H 5H',
    used: [0, 1, 2, 3, 4],
    description: 'Cinco cartas em sequência, todas do mesmo naipe. Entre dois, vence a sequência mais alta.',
    tip: 'Só perde para o royal flush.',
    odds: '0,028%',
  },
  {
    id: 'four-of-a-kind',
    name: 'Quadra',
    tier: 'monster',
    cards: 'QC QD QH QS 7D',
    used: [0, 1, 2, 3],
    description: 'Quatro cartas do mesmo valor. A quinta carta (kicker) só decide se as quadras forem iguais.',
    tip: 'Muito rara. Dá para apostar sem medo.',
    odds: '0,17%',
  },
  {
    id: 'full-house',
    name: 'Full House',
    tier: 'strong',
    cards: 'KS KH KD 4C 4S',
    used: [0, 1, 2, 3, 4],
    description: 'Uma trinca mais um par. Se houver empate, vence a trinca mais alta.',
    tip: 'Mão fortíssima. Cuidado só se a mesa tiver quadra à vista.',
    odds: '2,6%',
  },
  {
    id: 'flush',
    name: 'Flush',
    tier: 'strong',
    cards: 'AD JD 8D 6D 3D',
    used: [0, 1, 2, 3, 4],
    description: 'Cinco cartas do mesmo naipe, sem estarem em sequência. Vence quem tiver a carta mais alta.',
    tip: 'Ótima, mas um flush mais alto pode te vencer.',
    odds: '3,0%',
  },
  {
    id: 'straight',
    name: 'Sequência',
    tier: 'strong',
    cards: '10C 9D 8S 7H 6C',
    used: [0, 1, 2, 3, 4],
    description: 'Cinco cartas em sequência, de naipes variados. O Ás vale alto (10-J-Q-K-A) ou baixo (A-2-3-4-5).',
    tip: 'Boa mão, mas fique de olho em mesas com três do mesmo naipe.',
    odds: '4,6%',
  },
  {
    id: 'three-of-a-kind',
    name: 'Trinca',
    tier: 'medium',
    cards: '8S 8H 8D KC 3D',
    used: [0, 1, 2],
    description: 'Três cartas do mesmo valor, mais duas soltas. Quando você usa um par da mão, é chamada de “set”.',
    tip: 'Forte, mas pode perder para sequência e flush.',
    odds: '4,8%',
  },
  {
    id: 'two-pair',
    name: 'Dois Pares',
    tier: 'medium',
    cards: 'JS JD 4H 4C AS',
    used: [0, 1, 2, 3],
    description: 'Dois pares de valores diferentes. Vence o par mais alto; se igual, o segundo par, depois o kicker.',
    tip: 'Mão sólida, mas vulnerável a trincas e sequências.',
    odds: '23,5%',
  },
  {
    id: 'pair',
    name: 'Par',
    tier: 'weak',
    cards: '10H 10S AD 7C 3S',
    used: [0, 1],
    description: 'Duas cartas do mesmo valor. As três cartas restantes funcionam como desempate.',
    tip: 'Comum. Um par baixo raramente sustenta uma aposta grande.',
    odds: '43,8%',
  },
  {
    id: 'high-card',
    name: 'Carta Alta',
    tier: 'weak',
    cards: 'AS JD 8C 5H 2S',
    used: [0],
    description: 'Nenhuma combinação. Vale a carta mais alta da mão, depois a segunda mais alta, e assim por diante.',
    tip: 'A mais fraca de todas. Boa hora de desistir ou blefar.',
    odds: '17,4%',
  },
]
