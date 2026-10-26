/*
 * HAZ Poker Lounge: geometria da marca (Identidade visual, out/2026).
 * O A é um triângulo sólido com o naipe de espadas recortado em negativo; a haste abre a base e desenha as pernas da letra.
 */

/** O símbolo (o Ás). Caixa de 352 x 364 */
export const ACE_PATH =
  'M176 0 L352 364 L216 364 C194 364 184 317 182 279 C191 295 216 299 238 287 C258 275 264 252 254 227 C238 197 206 172 176 127 C146 172 114 197 98 227 C88 252 94 275 114 287 C136 299 161 295 170 279 C168 317 158 364 136 364 L0 364 Z'
export const ACE_SIZE = { width: 352, height: 364 }

/** H e Z do logotipo, na mesma grade (altura 364) */
export const H_PATH = 'M0 0 H40 V162 H228 V0 H268 V364 H228 V202 H40 V364 H0 Z'
export const Z_PATH = 'M678 0 H948 V42 L743 324 H948 V364 H678 V322 L883 40 H678 Z'
/** o símbolo entra entre o H e o Z */
export const ACE_OFFSET_X = 297

export const LOGO_SIZE = { width: 948, height: 364 }

export const BRAND = {
  night: '#121110',
  bone: '#eee7da',
  felt: '#1d3a2f',
  brass: '#c4a472',
  hearts: '#c23b2e',
} as const
