type LogoProps = {
  className?: string
  /** hide the "POKER LOUNGE" subtitle (compact nav version) */
  compact?: boolean
  title?: string
}

/** Wordmark rebuilt as SVG: thin H and Z around a solid "A" with a hookah cut-out. */
export const Logo = ({ className, compact = false, title = 'HAZ Poker Lounge' }: LogoProps) => (
  <svg
    className={className}
    viewBox={compact ? '0 0 320 124' : '0 0 320 160'}
    role="img"
    aria-label={title}
    fill="none"
  >
    <title>{title}</title>
    <g stroke="currentColor" strokeWidth="7" strokeLinecap="butt" strokeLinejoin="miter">
      <path d="M14 8V116M72 8V116M14 62H72" />
      <path d="M246 8H308L246 116H310" />
    </g>
    <path d="M160 2 210 118H110Z" fill="currentColor" />
    <g fill="var(--logo-cut, #070707)">
      <rect x="153" y="42" width="14" height="8" rx="1.5" />
      <rect x="157.5" y="50" width="5" height="22" />
      <path d="M150 72h20l4 6h-28z" />
      <path d="M160 80c-13 2-20 12-20 22 0 7 9 11 20 11s20-4 20-11c0-10-7-20-20-20Z" />
    </g>
    <path d="M167 58c14 0 22 10 22 28" stroke="var(--logo-cut, #070707)" strokeWidth="3" fill="none" />
    {!compact && (
      <text
        x="160"
        y="152"
        textAnchor="middle"
        fill="#c7a15a"
        fontFamily="Inter, sans-serif"
        fontSize="17"
        fontWeight="500"
        letterSpacing="9"
      >
        POKER LOUNGE
      </text>
    )}
  </svg>
)
