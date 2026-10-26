import { ACE_OFFSET_X, ACE_PATH, ACE_SIZE, H_PATH, LOGO_SIZE, Z_PATH } from './brand'

type LogoProps = {
  className?: string
  /** só HAZ, sem o "POKER LOUNGE" (nav, assinaturas pequenas) */
  compact?: boolean
  title?: string
}

/** Logo principal: HAZ com o A virando o Ás de espadas, e POKER LOUNGE em latão. */
export const Logo = ({ className, compact = false, title = 'HAZ Poker Lounge' }: LogoProps) => (
  <svg
    className={className}
    viewBox={compact ? `0 0 ${LOGO_SIZE.width} ${LOGO_SIZE.height}` : `0 0 ${LOGO_SIZE.width} 520`}
    role="img"
    aria-label={title}
  >
    <title>{title}</title>
    <g fill="currentColor">
      <path d={H_PATH} />
      <path d={ACE_PATH} transform={`translate(${ACE_OFFSET_X} 0)`} />
      <path d={Z_PATH} />
    </g>
    {!compact && (
      <text
        x="8"
        y="507"
        fill="var(--logo-sub, #c4a472)"
        fontFamily="Inter, system-ui, sans-serif"
        fontSize="80"
        fontWeight="600"
        textLength="932"
        lengthAdjust="spacing"
      >
        POKER LOUNGE
      </text>
    )}
  </svg>
)

type MarkProps = { className?: string; title?: string }

/** O símbolo sozinho: avatar, ficha, verso da carta, favicon. */
export const Mark = ({ className, title = 'HAZ' }: MarkProps) => (
  <svg className={className} viewBox={`0 0 ${ACE_SIZE.width} ${ACE_SIZE.height}`} role="img" aria-label={title}>
    <title>{title}</title>
    <path d={ACE_PATH} fill="currentColor" />
  </svg>
)
