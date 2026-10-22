import type { ReactNode, SVGProps } from 'react'

type IconProps = SVGProps<SVGSVGElement>

const Base = ({ children, ...props }: IconProps & { children: ReactNode }) => (
  <svg
    viewBox="0 0 48 48"
    width="1em"
    height="1em"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.6"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden
    {...props}
  >
    {children}
  </svg>
)

export const CardsIcon = (props: IconProps) => (
  <Base {...props}>
    <rect x="9" y="8" width="20" height="28" rx="3" transform="rotate(-10 19 22)" />
    <rect x="19" y="10" width="20" height="28" rx="3" transform="rotate(8 29 24)" />
    <path d="M30 18c-2 3-5 4-5 7a2.6 2.6 0 0 0 4.6 1.6c-.2 2-1 3-1.8 4h4.4c-.8-1-1.6-2-1.8-4A2.6 2.6 0 0 0 35 25c0-3-3-4-5-7Z" />
  </Base>
)

export const CocktailIcon = (props: IconProps) => (
  <Base {...props}>
    <path d="M10 12h28L24 27Z" />
    <path d="M24 27v11M16 38h16" />
    <circle cx="35" cy="9" r="3.5" />
    <path d="M17 17h14" />
  </Base>
)

export const HookahIcon = (props: IconProps) => (
  <Base {...props}>
    <path d="M20 7h8l-1 5h-6Z" />
    <path d="M24 12v10M21 22h6" />
    <path d="M24 26c-8 1-11 7-11 11 0 3 4 5 11 5s11-2 11-5c0-4-3-10-11-11Z" />
    <path d="M30 24c6 1 9 4 9 9" />
  </Base>
)

export const PizzaIcon = (props: IconProps) => (
  <Base {...props}>
    <path d="M24 42 8 12c10-5 22-5 32 0Z" />
    <path d="M12 18c8-3 16-3 24 0" />
    <circle cx="20" cy="24" r="2" />
    <circle cx="28" cy="22" r="2" />
    <circle cx="24" cy="32" r="2" />
  </Base>
)

export const SushiIcon = (props: IconProps) => (
  <Base {...props}>
    <rect x="7" y="26" width="34" height="12" rx="6" />
    <path d="M9 24c2-8 8-11 15-11s13 3 15 11c-8 3-22 3-30 0Z" />
    <path d="M16 18l4 5M23 16l3 6M30 18l2 5" />
  </Base>
)

export const BurgerIcon = (props: IconProps) => (
  <Base {...props}>
    <path d="M8 21c0-8 7-13 16-13s16 5 16 13Z" />
    <path d="M7 27h34" />
    <path d="M8 27c4 4 6-2 10 2s6-2 10 2 6-2 10 0" />
    <path d="M8 36h32v1a4 4 0 0 1-4 4H12a4 4 0 0 1-4-4Z" />
    <path d="M18 14h.01M24 12h.01M30 14h.01" />
  </Base>
)

export const ArrowIcon = (props: IconProps) => (
  <Base {...props}>
    <path d="M10 24h27M28 14l10 10-10 10" />
  </Base>
)

export const CheckIcon = (props: IconProps) => (
  <Base {...props}>
    <path d="m10 25 9 9 19-20" />
  </Base>
)

export const CloseIcon = (props: IconProps) => (
  <Base {...props}>
    <path d="m12 12 24 24M36 12 12 36" />
  </Base>
)

export const MenuIcon = (props: IconProps) => (
  <Base {...props}>
    <path d="M8 15h32M8 24h32M8 33h32" />
  </Base>
)

export const ClockIcon = (props: IconProps) => (
  <Base {...props}>
    <circle cx="24" cy="24" r="16" />
    <path d="M24 14v10l7 4" />
  </Base>
)

export const InstagramIcon = (props: IconProps) => (
  <Base {...props}>
    <rect x="8" y="8" width="32" height="32" rx="9" />
    <circle cx="24" cy="24" r="7.5" />
    <circle cx="33" cy="15" r="1.2" fill="currentColor" />
  </Base>
)

export const perkIcons = {
  cards: CardsIcon,
  cocktail: CocktailIcon,
  hookah: HookahIcon,
} as const

export const eventIcons = {
  pizza: PizzaIcon,
  sushi: SushiIcon,
  burger: BurgerIcon,
} as const
