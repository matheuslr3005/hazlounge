import * as THREE from 'three'
import { ACE_PATH, ACE_SIZE, H_PATH, LOGO_SIZE, Z_PATH } from '../components/brand'
import { cardKey, isRedSuit, rankLabel, SUIT_SYMBOL, type CardData } from '../lib/poker'

export const CARD_W = 0.56
export const CARD_H = 0.78

const PX_W = 360
const PX_H = 504
/** card art is drawn on a 288x400 grid and scaled to the canvas */
const LOG_W = 288
const LOG_H = 400

const GOLD = '#c4a472'
const GOLD_DEEP = '#8c7347'
const BONE = '#eee7da'
const NIGHT = '#121110'
const FELT = '#1d3a2f'
const HEARTS = '#c23b2e'

const acePath = new Path2D(ACE_PATH)
const hPath = new Path2D(H_PATH)
const zPath = new Path2D(Z_PATH)

/** draws the HAZ symbol centered at (cx, cy) with the given width */
const drawAce = (ctx: CanvasRenderingContext2D, cx: number, cy: number, width: number, fill: string, flip = false) => {
  const scale = width / ACE_SIZE.width
  ctx.save()
  ctx.translate(cx, cy)
  if (flip) ctx.rotate(Math.PI)
  ctx.scale(scale, scale)
  ctx.translate(-ACE_SIZE.width / 2, -ACE_SIZE.height / 2)
  ctx.fillStyle = fill
  ctx.fill(acePath)
  ctx.restore()
}

const makeCanvas = (width: number, height: number) => {
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('2D canvas is not available')
  return { canvas, ctx }
}

const toTexture = (canvas: HTMLCanvasElement, colorSpace = true) => {
  const texture = new THREE.CanvasTexture(canvas)
  if (colorSpace) texture.colorSpace = THREE.SRGBColorSpace
  texture.anisotropy = 8
  texture.needsUpdate = true
  return texture
}

const roundRectPath = (
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
) => {
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.arcTo(x + w, y, x + w, y + h, r)
  ctx.arcTo(x + w, y + h, x, y + h, r)
  ctx.arcTo(x, y + h, x, y, r)
  ctx.arcTo(x, y, x + w, y, r)
  ctx.closePath()
}

const faceCache = new Map<string, THREE.CanvasTexture>()

export const getCardFaceTexture = (card: CardData) => {
  const key = cardKey(card)
  const cached = faceCache.get(key)
  if (cached) return cached

  const { canvas, ctx } = makeCanvas(PX_W, PX_H)
  ctx.scale(PX_W / LOG_W, PX_H / LOG_H)
  const color = isRedSuit(card.suit) ? HEARTS : NIGHT
  const rank = rankLabel(card.rank)
  const suit = SUIT_SYMBOL[card.suit]
  const isAceOfSpades = card.rank === 14 && card.suit === 'S'

  roundRectPath(ctx, 2, 2, LOG_W - 4, LOG_H - 4, 26)
  const paper = ctx.createLinearGradient(0, 0, LOG_W, LOG_H)
  paper.addColorStop(0, '#f6f2e9')
  paper.addColorStop(1, '#e9e3d4')
  ctx.fillStyle = paper
  ctx.fill()
  ctx.lineWidth = 3
  ctx.strokeStyle = 'rgba(40,30,10,0.3)'
  ctx.stroke()

  const index = (flip: boolean) => {
    ctx.save()
    if (flip) {
      ctx.translate(LOG_W, LOG_H)
      ctx.rotate(Math.PI)
    }
    ctx.fillStyle = color
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.font = `${rank.length > 1 ? 70 : 82}px 'Instrument Serif', Georgia, serif`
    ctx.fillText(rank, 46, 60)
    if (isAceOfSpades) {
      // the brand symbol is also the Ace's index
      drawAce(ctx, 46, 124, 40, NIGHT)
    } else {
      ctx.font = '700 56px Georgia, serif'
      ctx.fillText(suit, 46, 122)
    }
    ctx.restore()
  }
  index(false)
  index(true)

  if (isAceOfSpades) {
    drawAce(ctx, LOG_W / 2, LOG_H / 2 + 4, 150, NIGHT)
  } else {
    ctx.fillStyle = color
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.font = `${card.rank === 14 ? 190 : 150}px Georgia, serif`
    ctx.fillText(suit, LOG_W / 2 + 6, LOG_H / 2 + 6)
    if (card.rank >= 11 && card.rank <= 13) {
      ctx.strokeStyle = GOLD_DEEP
      ctx.lineWidth = 3
      roundRectPath(ctx, 70, 100, LOG_W - 140, LOG_H - 200, 10)
      ctx.stroke()
    }
  }

  const texture = toTexture(canvas)
  faceCache.set(key, texture)
  return texture
}

let backTexture: THREE.CanvasTexture | null = null

export const getCardBackTexture = () => {
  if (backTexture) return backTexture
  const { canvas, ctx } = makeCanvas(PX_W, PX_H)
  ctx.scale(PX_W / LOG_W, PX_H / LOG_H)

  // Feltro back with the "Padrão Ás": the symbol upright and inverted, like a real deck
  roundRectPath(ctx, 2, 2, LOG_W - 4, LOG_H - 4, 26)
  ctx.fillStyle = FELT
  ctx.fill()
  ctx.save()
  roundRectPath(ctx, 14, 14, LOG_W - 28, LOG_H - 28, 14)
  ctx.clip()
  const cell = 34
  for (let row = -1; row * cell < LOG_H + cell; row++) {
    for (let col = -1; col * cell < LOG_W + cell; col++) {
      drawAce(ctx, col * cell + cell / 2 + 8, row * cell + cell / 2 + 6, 17, 'rgba(238,231,218,0.1)', (row + col) % 2 !== 0)
    }
  }
  ctx.restore()

  roundRectPath(ctx, 14, 14, LOG_W - 28, LOG_H - 28, 14)
  ctx.strokeStyle = GOLD
  ctx.lineWidth = 2.5
  ctx.stroke()

  ctx.fillStyle = FELT
  ctx.beginPath()
  ctx.arc(LOG_W / 2, LOG_H / 2, 54, 0, Math.PI * 2)
  ctx.fill()
  ctx.strokeStyle = GOLD
  ctx.lineWidth = 2.5
  ctx.stroke()
  drawAce(ctx, LOG_W / 2, LOG_H / 2 + 2, 52, BONE)

  backTexture = toTexture(canvas)
  return backTexture
}

let shadowTexture: THREE.CanvasTexture | null = null

export const getBlobShadowTexture = () => {
  if (shadowTexture) return shadowTexture
  const { canvas, ctx } = makeCanvas(128, 128)
  const gradient = ctx.createRadialGradient(64, 64, 6, 64, 64, 62)
  gradient.addColorStop(0, 'rgba(0,0,0,0.85)')
  gradient.addColorStop(0.55, 'rgba(0,0,0,0.45)')
  gradient.addColorStop(1, 'rgba(0,0,0,0)')
  ctx.fillStyle = gradient
  ctx.fillRect(0, 0, 128, 128)
  shadowTexture = toTexture(canvas, false)
  return shadowTexture
}

/* ---------------------------------- chips --------------------------------- */

export type ChipColor = 'black' | 'red' | 'green'

/** Fichas da casa: as três cores da marca, com o símbolo no centro */
const CHIP_PALETTE: Record<ChipColor, { base: string; inner: string; accent: string; ink: string }> = {
  black: { base: '#1a1917', inner: '#22201d', accent: GOLD, ink: GOLD },
  red: { base: HEARTS, inner: '#a93126', accent: BONE, ink: BONE },
  green: { base: FELT, inner: '#16302a', accent: BONE, ink: BONE },
}

/* ----------------------------------- felt --------------------------------- */

export const createFeltTexture = (widthUnits: number, depthUnits: number) => {
  const PX_PER_UNIT = 300
  const width = Math.round(widthUnits * PX_PER_UNIT)
  const height = Math.round(depthUnits * PX_PER_UNIT)
  const { canvas, ctx } = makeCanvas(width, height)

  const base = ctx.createRadialGradient(width / 2, height / 2, 40, width / 2, height / 2, width * 0.55)
  base.addColorStop(0, '#2a5242')
  base.addColorStop(0.55, '#1d3a2f')
  base.addColorStop(1, '#0f2119')
  ctx.fillStyle = base
  ctx.fillRect(0, 0, width, height)

  for (let i = 0; i < 90000; i++) {
    const x = Math.random() * width
    const y = Math.random() * height
    const light = Math.random() > 0.5
    ctx.fillStyle = light ? 'rgba(255,255,255,0.035)' : 'rgba(0,0,0,0.12)'
    ctx.fillRect(x, y, 1.4, 1.4)
  }

  // gold inlay lines (stadium shaped), inset from the rail
  const strokeStadium = (inset: number, lineWidth: number, color: string, dash: number[] = []) => {
    const r = height / 2 - inset
    const half = width / 2 - height / 2
    ctx.save()
    ctx.translate(width / 2, height / 2)
    ctx.beginPath()
    ctx.moveTo(-half, -r)
    ctx.lineTo(half, -r)
    ctx.arc(half, 0, r, -Math.PI / 2, Math.PI / 2)
    ctx.lineTo(-half, r)
    ctx.arc(-half, 0, r, Math.PI / 2, Math.PI * 1.5)
    ctx.closePath()
    ctx.setLineDash(dash)
    ctx.lineWidth = lineWidth
    ctx.strokeStyle = color
    ctx.stroke()
    ctx.restore()
  }
  strokeStadium(26, 4, 'rgba(196,164,114,0.85)')
  strokeStadium(40, 1.5, 'rgba(196,164,114,0.5)')
  strokeStadium(height * 0.2, 2, 'rgba(196,164,114,0.28)', [14, 12])

  // faint brand mark at the center: the real logo, in brass
  ctx.save()
  ctx.translate(width / 2, height / 2)
  const logoWidth = height * 0.62
  const logoScale = logoWidth / LOGO_SIZE.width
  ctx.scale(logoScale, logoScale)
  ctx.translate(-LOGO_SIZE.width / 2, -LOGO_SIZE.height / 2 - 40)
  ctx.fillStyle = 'rgba(196,164,114,0.13)'
  ctx.fill(hPath)
  ctx.save()
  ctx.translate(297, 0)
  ctx.fill(acePath)
  ctx.restore()
  ctx.fill(zPath)
  ctx.font = '600 80px Inter, Arial, sans-serif'
  ctx.textAlign = 'left'
  ctx.textBaseline = 'alphabetic'
  ctx.letterSpacing = '56px'
  ctx.fillText('POKER LOUNGE', 8, 507)
  ctx.restore()

  return toTexture(canvas)
}

export const createDealerButtonTexture = () => {
  const { canvas, ctx } = makeCanvas(256, 256)
  ctx.fillStyle = BONE
  ctx.fillRect(0, 0, 256, 256)
  ctx.translate(128, 128)
  ctx.strokeStyle = GOLD_DEEP
  ctx.lineWidth = 10
  ctx.beginPath()
  ctx.arc(0, 0, 108, 0, Math.PI * 2)
  ctx.stroke()
  ctx.fillStyle = NIGHT
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.font = "150px 'Instrument Serif', Georgia, serif"
  ctx.fillText('D', 0, 8)
  return toTexture(canvas)
}

/* --------------------------------- leather -------------------------------- */

export const createLeatherTextures = () => {
  const size = 512
  const color = makeCanvas(size, size)
  const bump = makeCanvas(size, size)
  color.ctx.fillStyle = '#17120d'
  color.ctx.fillRect(0, 0, size, size)
  bump.ctx.fillStyle = '#808080'
  bump.ctx.fillRect(0, 0, size, size)

  for (let i = 0; i < 5200; i++) {
    const x = Math.random() * size
    const y = Math.random() * size
    const r = 2 + Math.random() * 5
    const shade = Math.random() * 0.18
    color.ctx.fillStyle = `rgba(255,235,200,${shade * 0.35})`
    color.ctx.beginPath()
    color.ctx.arc(x, y, r, 0, Math.PI * 2)
    color.ctx.fill()
    const gradient = bump.ctx.createRadialGradient(x, y, 0, x, y, r)
    gradient.addColorStop(0, 'rgba(255,255,255,0.55)')
    gradient.addColorStop(0.7, 'rgba(120,120,120,0.35)')
    gradient.addColorStop(1, 'rgba(0,0,0,0.5)')
    bump.ctx.fillStyle = gradient
    bump.ctx.beginPath()
    bump.ctx.arc(x, y, r, 0, Math.PI * 2)
    bump.ctx.fill()
  }

  const map = toTexture(color.canvas)
  const bumpMap = toTexture(bump.canvas, false)
  for (const texture of [map, bumpMap]) {
    texture.wrapS = THREE.RepeatWrapping
    texture.wrapT = THREE.RepeatWrapping
    texture.repeat.set(0.45, 0.45)
  }
  return { map, bumpMap }
}

/* ---------------------------------- wood ---------------------------------- */

export const createWoodTexture = (base = '#4a2f1b', grain = '#2a1809') => {
  const { canvas, ctx } = makeCanvas(256, 512)
  ctx.fillStyle = base
  ctx.fillRect(0, 0, 256, 512)
  for (let i = 0; i < 220; i++) {
    const x = Math.random() * 256
    ctx.strokeStyle = Math.random() > 0.5 ? grain : 'rgba(255,220,170,0.12)'
    ctx.globalAlpha = 0.15 + Math.random() * 0.35
    ctx.lineWidth = 0.6 + Math.random() * 2
    ctx.beginPath()
    ctx.moveTo(x, 0)
    ctx.bezierCurveTo(x + (Math.random() - 0.5) * 24, 160, x + (Math.random() - 0.5) * 24, 340, x + (Math.random() - 0.5) * 12, 512)
    ctx.stroke()
  }
  ctx.globalAlpha = 1
  const texture = toTexture(canvas)
  texture.wrapS = THREE.RepeatWrapping
  texture.wrapT = THREE.RepeatWrapping
  return texture
}

export const createGlowTexture = () => {
  const { canvas, ctx } = makeCanvas(128, 128)
  const g = ctx.createRadialGradient(64, 64, 0, 64, 64, 64)
  g.addColorStop(0, 'rgba(255,255,255,1)')
  g.addColorStop(0.25, 'rgba(255,255,255,0.45)')
  g.addColorStop(1, 'rgba(255,255,255,0)')
  ctx.fillStyle = g
  ctx.fillRect(0, 0, 128, 128)
  return toTexture(canvas, false)
}

/* ---------------------------------- chips --------------------------------- */

const chipFaceCache = new Map<ChipColor, THREE.CanvasTexture>()
const edgeCache = new Map<ChipColor, THREE.CanvasTexture>()
const EDGE_SEGMENTS = 8

/** Planar chip face: edge spots, inner ring and the value */
export const getChipFace = (color: ChipColor) => {
  const cached = chipFaceCache.get(color)
  if (cached) return cached
  const palette = CHIP_PALETTE[color]
  const { canvas, ctx } = makeCanvas(512, 512)
  ctx.fillStyle = palette.base
  ctx.fillRect(0, 0, 512, 512)
  ctx.save()
  ctx.translate(256, 256)
  // edge spots
  ctx.strokeStyle = palette.accent
  ctx.lineWidth = 42
  for (let i = 0; i < EDGE_SEGMENTS; i++) {
    ctx.beginPath()
    ctx.arc(0, 0, 232, (i * Math.PI * 2) / EDGE_SEGMENTS + 0.13, ((i + 1) * Math.PI * 2) / EDGE_SEGMENTS - 0.13)
    ctx.stroke()
  }
  // darker inner disc with a dashed ring, as in the brand chips
  ctx.fillStyle = palette.inner
  ctx.beginPath()
  ctx.arc(0, 0, 186, 0, Math.PI * 2)
  ctx.fill()
  ctx.setLineDash([14, 10])
  ctx.lineWidth = 4
  ctx.beginPath()
  ctx.arc(0, 0, 160, 0, Math.PI * 2)
  ctx.stroke()
  ctx.restore()
  drawAce(ctx, 256, 262, 150, palette.ink)
  const texture = toTexture(canvas)
  chipFaceCache.set(color, texture)
  return texture
}

/** Chip rim: bevel / striped edge / bevel, bottom to top (v = 0 is the bottom bevel) */
export const getChipEdge = (color: ChipColor) => {
  const cached = edgeCache.get(color)
  if (cached) return cached
  const palette = CHIP_PALETTE[color]
  const { canvas, ctx } = makeCanvas(1024, 192)
  const base = new THREE.Color(palette.base)
  const dark = `#${base.clone().multiplyScalar(0.78).getHexString()}`
  ctx.fillStyle = dark
  ctx.fillRect(0, 0, 1024, 192)
  ctx.fillStyle = palette.base
  ctx.fillRect(0, 64, 1024, 64)
  ctx.fillStyle = palette.accent
  for (let i = 0; i < EDGE_SEGMENTS; i++) {
    ctx.fillRect((i * 1024) / EDGE_SEGMENTS + 40, 68, 1024 / EDGE_SEGMENTS - 80, 56)
  }
  ctx.fillStyle = 'rgba(0,0,0,0.22)'
  for (let i = 0; i < 96; i++) ctx.fillRect((i * 1024) / 96, 64, 2, 64)
  const texture = toTexture(canvas)
  texture.wrapS = THREE.RepeatWrapping
  edgeCache.set(color, texture)
  return texture
}

export const createFeltBump = (widthUnits: number, depthUnits: number) => {
  const PX_PER_UNIT = 300
  const width = Math.round(widthUnits * PX_PER_UNIT)
  const height = Math.round(depthUnits * PX_PER_UNIT)
  const { canvas, ctx } = makeCanvas(width, height)
  ctx.fillStyle = '#808080'
  ctx.fillRect(0, 0, width, height)
  ctx.lineWidth = 1
  for (let i = 0; i < 160000; i++) {
    const x = Math.random() * width
    const y = Math.random() * height
    const angle = Math.random() * Math.PI
    const length = 3 + Math.random() * 6
    ctx.strokeStyle = Math.random() > 0.5 ? 'rgba(255,255,255,0.18)' : 'rgba(0,0,0,0.2)'
    ctx.beginPath()
    ctx.moveTo(x, y)
    ctx.lineTo(x + Math.cos(angle) * length, y + Math.sin(angle) * length)
    ctx.stroke()
  }
  return toTexture(canvas, false)
}

/** Tileable felt without any table markings, for large surfaces */
export const createPlainFelt = () => {
  const size = 1024
  const { canvas, ctx } = makeCanvas(size, size)
  ctx.fillStyle = '#1b372c'
  ctx.fillRect(0, 0, size, size)
  for (let i = 0; i < 70; i++) {
    const x = Math.random() * size
    const y = Math.random() * size
    const r = 60 + Math.random() * 160
    const g = ctx.createRadialGradient(x, y, 0, x, y, r)
    const light = Math.random() > 0.5
    g.addColorStop(0, light ? 'rgba(255,255,255,0.025)' : 'rgba(0,0,0,0.06)')
    g.addColorStop(1, 'rgba(0,0,0,0)')
    ctx.fillStyle = g
    ctx.fillRect(x - r, y - r, r * 2, r * 2)
  }
  for (let i = 0; i < 120000; i++) {
    ctx.fillStyle = Math.random() > 0.5 ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.14)'
    ctx.fillRect(Math.random() * size, Math.random() * size, 1.4, 1.4)
  }
  return toTexture(canvas)
}
