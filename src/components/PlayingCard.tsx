import { isRedSuit, rankLabel, SUIT_SYMBOL, type CardData } from '../lib/poker'
import { Mark } from './Logo'
import './PlayingCard.css'

type PlayingCardProps = {
  card?: CardData
  faceDown?: boolean
  dim?: boolean
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

export const PlayingCard = ({ card, faceDown = false, dim = false, size = 'md', className = '' }: PlayingCardProps) => {
  const classes = ['pcard', `pcard--${size}`, dim ? 'is-dim' : '', className].filter(Boolean).join(' ')

  if (faceDown || !card) {
    return (
      <div className={`${classes} pcard--back`} aria-label="Carta virada">
        <span className="pcard__seal">
          <Mark className="pcard__mark" />
        </span>
      </div>
    )
  }

  const rank = rankLabel(card.rank)
  const suit = SUIT_SYMBOL[card.suit]
  // the brand symbol doubles as the index of the Ace of spades
  const isHouseAce = card.rank === 14 && card.suit === 'S'
  const glyph = isHouseAce ? <Mark className="pcard__ace" /> : suit

  return (
    <div
      className={`${classes} ${isRedSuit(card.suit) ? 'is-red' : ''}`}
      role="img"
      aria-label={`${rank} de ${suitName(card.suit)}`}
    >
      <span className="pcard__corner">
        {rank}
        <i>{glyph}</i>
      </span>
      <span className="pcard__pip">{isHouseAce ? <Mark className="pcard__ace pcard__ace--big" /> : suit}</span>
      <span className="pcard__corner pcard__corner--end">
        {rank}
        <i>{glyph}</i>
      </span>
    </div>
  )
}

const suitName = (suit: CardData['suit']) =>
  ({ S: 'espadas', H: 'copas', D: 'ouros', C: 'paus' })[suit]
