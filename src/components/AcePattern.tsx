import { useId } from 'react'
import { ACE_PATH, ACE_SIZE } from './brand'
import './AcePattern.css'

const CELL = 64
const GRID = 4
/** which cells of the 4x4 tile glow in brass, like the "Padrão Ás" of the brand */
const HIGHLIGHT = new Set(['1-2', '3-0'])
const SYMBOL = 0.125

type AcePatternProps = { className?: string }

/** The brand's "Padrão Ás": the symbol upright and inverted, like the back of a card. Decorative background. */
export const AcePattern = ({ className = '' }: AcePatternProps) => {
  const id = useId()
  const tile = CELL * GRID
  return (
    <svg className={`ace-pattern ${className}`} aria-hidden>
      <defs>
        <pattern id={id} width={tile} height={tile} patternUnits="userSpaceOnUse">
          {Array.from({ length: GRID * GRID }, (_, index) => {
            const row = Math.floor(index / GRID)
            const col = index % GRID
            const up = (row + col) % 2 === 0
            const width = ACE_SIZE.width * SYMBOL
            const height = ACE_SIZE.height * SYMBOL
            const x = col * CELL + (CELL - width) / 2
            const y = row * CELL + (CELL - height) / 2
            const glow = HIGHLIGHT.has(`${row}-${col}`)
            return (
              <path
                key={index}
                d={ACE_PATH}
                fill={glow ? 'var(--gold)' : 'var(--ink)'}
                fillOpacity={glow ? 0.3 : 0.035}
                transform={
                  up
                    ? `translate(${x} ${y}) scale(${SYMBOL})`
                    : `translate(${x + width} ${y + height}) rotate(180) scale(${SYMBOL})`
                }
              />
            )
          })}
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill={`url(#${id})`} />
    </svg>
  )
}
