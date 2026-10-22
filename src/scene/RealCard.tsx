import { useMemo, type RefObject } from 'react'
import * as THREE from 'three'
import type { CardData } from '../lib/poker'
import { CARD_H, CARD_W, getCardBackTexture, getCardFaceTexture } from './textures'

export const CARD_THICKNESS = 0.009
const CORNER = 0.046

const roundedRect = (width: number, height: number, radius: number) => {
  const x = -width / 2
  const y = -height / 2
  const shape = new THREE.Shape()
  shape.moveTo(x + radius, y)
  shape.lineTo(x + width - radius, y)
  shape.absarc(x + width - radius, y + radius, radius, -Math.PI / 2, 0, false)
  shape.lineTo(x + width, y + height - radius)
  shape.absarc(x + width - radius, y + height - radius, radius, 0, Math.PI / 2, false)
  shape.lineTo(x + radius, y + height)
  shape.absarc(x + radius, y + height - radius, radius, Math.PI / 2, Math.PI, false)
  shape.lineTo(x, y + radius)
  shape.absarc(x + radius, y + radius, radius, Math.PI, Math.PI * 1.5, false)
  return shape
}

const coreGeometry = (() => {
  const geometry = new THREE.ExtrudeGeometry(roundedRect(CARD_W * 0.992, CARD_H * 0.992, CORNER), {
    depth: CARD_THICKNESS,
    bevelEnabled: false,
    curveSegments: 10,
  })
  geometry.translate(0, 0, -CARD_THICKNESS / 2)
  return geometry
})()

const planeGeometry = new THREE.PlaneGeometry(CARD_W, CARD_H)
const coreMaterial = new THREE.MeshStandardMaterial({ color: '#eee6d2', roughness: 0.7 })

const backMaterial = (() => {
  const map = getCardBackTexture()
  return new THREE.MeshPhysicalMaterial({
    map,
    roughness: 0.42,
    clearcoat: 0.2,
    clearcoatRoughness: 0.4,
    alphaTest: 0.5,
  })
})()

const frontMaterials = new Map<string, THREE.MeshPhysicalMaterial>()

const frontMaterial = (card: CardData) => {
  const key = `${card.rank}${card.suit}`
  const cached = frontMaterials.get(key)
  if (cached) return cached
  const material = new THREE.MeshPhysicalMaterial({
    map: getCardFaceTexture(card),
    roughness: 0.42,
    clearcoat: 0.2,
    clearcoatRoughness: 0.4,
    alphaTest: 0.5,
  })
  frontMaterials.set(key, material)
  return material
}

type RealCardProps = {
  card: CardData
  /** the group that is rotated to flip the card around its vertical axis (0 = face up) */
  flipRef?: RefObject<THREE.Group | null>
  castShadow?: boolean
}

/** A playing card with real thickness, a paper edge and glossy printed faces. Faces +Z. */
export const RealCard = ({ card, flipRef, castShadow = true }: RealCardProps) => {
  const front = useMemo(() => frontMaterial(card), [card])
  const offset = CARD_THICKNESS / 2 + 0.0006
  return (
    <group ref={flipRef}>
      <mesh geometry={coreGeometry} material={coreMaterial} castShadow={castShadow} receiveShadow />
      <mesh geometry={planeGeometry} material={front} position-z={offset} receiveShadow />
      <mesh geometry={planeGeometry} material={backMaterial} position-z={-offset} rotation-y={Math.PI} receiveShadow />
    </group>
  )
}
