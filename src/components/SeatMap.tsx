import { motion } from 'framer-motion'
import './SeatMap.css'

export const SEAT_TOTAL = 9
const VIEW_W = 640
const VIEW_H = 340

/** Seat 0 is the dealer; seats 1..9 follow clockwise around the table */
const seatPosition = (slot: number) => {
  const angle = (slot / (SEAT_TOTAL + 1)) * Math.PI * 2
  return { x: VIEW_W / 2 - Math.sin(angle) * 262, y: VIEW_H / 2 + Math.cos(angle) * 118 }
}

type SeatMapProps = {
  taken: number[]
  selected: number[]
  maxSelectable: number
  onToggle: (seat: number) => void
}

export const SeatMap = ({ taken, selected, maxSelectable, onToggle }: SeatMapProps) => (
  <svg className="seatmap" viewBox={`0 0 ${VIEW_W} ${VIEW_H}`} role="group" aria-label="Mapa de cadeiras da mesa">
    <defs>
      <radialGradient id="seat-felt" cx="50%" cy="50%" r="60%">
        <stop offset="0%" stopColor="#136148" />
        <stop offset="60%" stopColor="#0b3a2d" />
        <stop offset="100%" stopColor="#06231b" />
      </radialGradient>
    </defs>

    <rect x="92" y="62" width="456" height="216" rx="108" fill="#15100b" stroke="rgba(232,184,75,0.5)" strokeWidth="1.5" />
    <rect x="106" y="76" width="428" height="188" rx="94" fill="url(#seat-felt)" stroke="rgba(232,184,75,0.7)" strokeWidth="1" />
    <text x={VIEW_W / 2} y={VIEW_H / 2 + 14} textAnchor="middle" className="seatmap__logo">
      HAZ
    </text>

    {Array.from({ length: SEAT_TOTAL + 1 }, (_, slot) => {
      const { x, y } = seatPosition(slot)
      if (slot === 0) {
        return (
          <g key="dealer" className="seatmap__dealer">
            <circle cx={x} cy={y} r="19" />
            <text x={x} y={y + 5} textAnchor="middle">
              D
            </text>
          </g>
        )
      }
      const isTaken = taken.includes(slot)
      const isSelected = selected.includes(slot)
      const blocked = !isTaken && !isSelected && selected.length >= maxSelectable
      const state = isTaken ? 'taken' : isSelected ? 'selected' : blocked ? 'blocked' : 'free'
      const toggle = () => {
        if (!isTaken && !blocked) onToggle(slot)
      }
      return (
        <g
          key={slot}
          className={`seatmap__seat is-${state}`}
          role="button"
          tabIndex={isTaken || blocked ? -1 : 0}
          aria-pressed={isSelected}
          aria-disabled={isTaken || blocked}
          aria-label={`Cadeira ${slot}, ${isTaken ? 'ocupada' : isSelected ? 'selecionada' : 'livre'}`}
          onClick={toggle}
          onKeyDown={(event) => {
            if (event.key === 'Enter' || event.key === ' ') {
              event.preventDefault()
              toggle()
            }
          }}
        >
          <motion.circle
            cx={x}
            cy={y}
            r="22"
            animate={{ scale: isSelected ? 1.18 : 1 }}
            transition={{ type: 'spring', stiffness: 400, damping: 18 }}
            style={{ transformOrigin: `${x}px ${y}px`, transformBox: 'fill-box' }}
          />
          <text x={x} y={y + 5} textAnchor="middle">
            {isTaken ? '×' : slot}
          </text>
        </g>
      )
    })}
  </svg>
)
