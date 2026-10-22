import * as THREE from 'three'
import { cardKey, isRedSuit, rankLabel, SUIT_SYMBOL, type CardData } from '../lib/poker'

export const CARD_W = 0.56
export const CARD_H = 0.78

const PX_W = 360
const PX_H = 504
/** card art is drawn on a 288x400 grid and scaled to the canvas */
const LOG_W = 288
const LOG_H = 400

const GOLD = '#e8b84b'
const GOLD_DEEP = '#a8771f'

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
  const color = isRedSuit(card.suit) ? '#b3202a' : '#15151a'
  const rank = rankLabel(card.rank)
  const suit = SUIT_SYMBOL[card.suit]

  roundRectPath(ctx, 2, 2, LOG_W - 4, LOG_H - 4, 26)
  const paper = ctx.createLinearGradient(0, 0, LOG_W, LOG_H)
  paper.addColorStop(0, '#fbf6ea')
  paper.addColorStop(1, '#ece3cd')
  ctx.fillStyle = paper
  ctx.fill()
  ctx.lineWidth = 3
  ctx.strokeStyle = 'rgba(40,30,10,0.35)'
  ctx.stroke()

  ctx.fillStyle = color
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  const rankSize = rank.length > 1 ? 66 : 78
  ctx.font = `700 ${rankSize}px Georgia, 'Times New Roman', serif`
  ctx.fillText(rank, 46, 62)
  ctx.font = '700 58px Georgia, serif'
  ctx.fillText(suit, 46, 122)

  ctx.save()
  ctx.translate(LOG_W, LOG_H)
  ctx.rotate(Math.PI)
  ctx.font = `700 ${rankSize}px Georgia, 'Times New Roman', serif`
  ctx.fillText(rank, 46, 62)
  ctx.font = '700 58px Georgia, serif'
  ctx.fillText(suit, 46, 122)
  ctx.restore()

  const isFace = card.rank >= 11 && card.rank <= 13
  ctx.font = `${card.rank === 14 ? 190 : 150}px Georgia, serif`
  ctx.fillText(suit, LOG_W / 2 + 6, LOG_H / 2 + 6)
  if (isFace) {
    ctx.strokeStyle = GOLD_DEEP
    ctx.lineWidth = 3
    roundRectPath(ctx, 70, 100, LOG_W - 140, LOG_H - 200, 10)
    ctx.stroke()
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

  roundRectPath(ctx, 2, 2, LOG_W - 4, LOG_H - 4, 26)
  ctx.fillStyle = '#0b0b0c'
  ctx.fill()
  ctx.lineWidth = 3
  ctx.strokeStyle = GOLD_DEEP
  ctx.stroke()

  ctx.save()
  roundRectPath(ctx, 18, 18, LOG_W - 36, LOG_H - 36, 16)
  ctx.clip()
  ctx.strokeStyle = 'rgba(232,184,75,0.28)'
  ctx.lineWidth = 1.5
  const step = 22
  for (let i = -LOG_H; i < LOG_W + LOG_H; i += step) {
    ctx.beginPath()
    ctx.moveTo(i, 0)
    ctx.lineTo(i + LOG_H, LOG_H)
    ctx.moveTo(i, 0)
    ctx.lineTo(i - LOG_H, LOG_H)
    ctx.stroke()
  }
  ctx.restore()

  roundRectPath(ctx, 18, 18, LOG_W - 36, LOG_H - 36, 16)
  ctx.strokeStyle = GOLD
  ctx.lineWidth = 3
  ctx.stroke()

  ctx.fillStyle = '#0b0b0c'
  ctx.beginPath()
  ctx.arc(LOG_W / 2, LOG_H / 2, 62, 0, Math.PI * 2)
  ctx.fill()
  ctx.strokeStyle = GOLD
  ctx.lineWidth = 3
  ctx.stroke()

  ctx.fillStyle = GOLD
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.font = '700 52px Georgia, serif'
  ctx.fillText('HAZ', LOG_W / 2, LOG_H / 2 - 4)
  ctx.font = '600 11px Arial, sans-serif'
  ctx.fillText('POKER LOUNGE', LOG_W / 2, LOG_H / 2 + 30)

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

export type ChipColor = 'gold' | 'black' | 'red' | 'cream'

const CHIP_PALETTE: Record<ChipColor, { base: string; accent: string; ink: string; label: string }> = {
  gold: { base: '#c99a31', accent: '#f6e2a1', ink: '#1a1304', label: '500' },
  black: { base: '#141414', accent: '#e8b84b', ink: '#e8b84b', label: '100' },
  red: { base: '#8f1d22', accent: '#f1e6d0', ink: '#f1e6d0', label: '50' },
  cream: { base: '#e9e0c9', accent: '#8f1d22', ink: '#1a1a1a', label: '25' },
}

/* ----------------------------------- felt --------------------------------- */

export const createFeltTexture = (widthUnits: number, depthUnits: number) => {
  const PX_PER_UNIT = 300
  const width = Math.round(widthUnits * PX_PER_UNIT)
  const height = Math.round(depthUnits * PX_PER_UNIT)
  const { canvas, ctx } = makeCanvas(width, height)

  const base = ctx.createRadialGradient(width / 2, height / 2, 40, width / 2, height / 2, width * 0.55)
  base.addColorStop(0, '#12503f')
  base.addColorStop(0.55, '#0b3a2d')
  base.addColorStop(1, '#05211a')
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
  strokeStadium(26, 4, 'rgba(232,184,75,0.85)')
  strokeStadium(40, 1.5, 'rgba(232,184,75,0.5)')
  strokeStadium(height * 0.2, 2, 'rgba(232,184,75,0.28)', [14, 12])

  // faint brand mark at the center
  ctx.save()
  ctx.translate(width / 2, height / 2)
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillStyle = 'rgba(232,184,75,0.09)'
  ctx.font = `700 ${height * 0.34}px Georgia, serif`
  ctx.fillText('HAZ', 0, -height * 0.03)
  ctx.font = `600 ${height * 0.05}px Arial, sans-serif`
  ctx.letterSpacing = `${height * 0.02}px`
  ctx.fillText('POKER LOUNGE', 0, height * 0.2)
  ctx.restore()

  return toTexture(canvas)
}

export const createDealerButtonTexture = () => {
  const { canvas, ctx } = makeCanvas(256, 256)
  ctx.fillStyle = '#f3ead2'
  ctx.fillRect(0, 0, 256, 256)
  ctx.translate(128, 128)
  ctx.strokeStyle = GOLD_DEEP
  ctx.lineWidth = 10
  ctx.beginPath()
  ctx.arc(0, 0, 108, 0, Math.PI * 2)
  ctx.stroke()
  ctx.fillStyle = '#16120a'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.font = '700 120px Georgia, serif'
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
  ctx.translate(256, 256)
  ctx.strokeStyle = palette.accent
  ctx.lineWidth = 40
  for (let i = 0; i < EDGE_SEGMENTS; i++) {
    ctx.beginPath()
    ctx.arc(0, 0, 232, (i * Math.PI * 2) / EDGE_SEGMENTS + 0.13, ((i + 1) * Math.PI * 2) / EDGE_SEGMENTS - 0.13)
    ctx.stroke()
  }
  ctx.lineWidth = 6
  ctx.beginPath()
  ctx.arc(0, 0, 178, 0, Math.PI * 2)
  ctx.stroke()
  ctx.lineWidth = 2
  ctx.beginPath()
  ctx.arc(0, 0, 150, 0, Math.PI * 2)
  ctx.stroke()
  ctx.fillStyle = palette.ink
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.font = '700 96px Georgia, serif'
  ctx.fillText(palette.label, 0, 6)
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
  ctx.fillStyle = '#0c4234'
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
