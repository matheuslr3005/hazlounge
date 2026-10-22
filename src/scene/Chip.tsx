import { useMemo } from 'react'
import * as THREE from 'three'
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js'
import { getChipEdge, getChipFace, type ChipColor } from './textures'

export const CHIP_R = 0.115
export const CHIP_H = 0.042
const BEVEL = 0.009

const buildChipGeometry = () => {
  const h = CHIP_H / 2
  const rim = CHIP_R - BEVEL
  // rim: bevel, vertical edge, bevel (material 0)
  const profile = [
    [rim, -h],
    [CHIP_R, -h + BEVEL],
    [CHIP_R, h - BEVEL],
    [rim, h],
  ].map(([x, y]) => new THREE.Vector2(x, y))
  const side = new THREE.LatheGeometry(profile, 64)
  // flat faces with planar UVs (materials 1 and 2)
  const top = new THREE.CircleGeometry(rim, 64)
  top.rotateX(-Math.PI / 2)
  top.translate(0, h, 0)
  const bottom = new THREE.CircleGeometry(rim, 64)
  bottom.rotateX(Math.PI / 2)
  bottom.translate(0, -h, 0)
  const merged = mergeGeometries([side, top, bottom], true)
  side.dispose()
  top.dispose()
  bottom.dispose()
  return merged
}

export const chipGeometry = buildChipGeometry()

const materials = new Map<ChipColor, THREE.MeshPhysicalMaterial[]>()

/** [rim, top face, bottom face] */
export const chipMaterial = (color: ChipColor) => {
  const cached = materials.get(color)
  if (cached) return cached
  const common = { roughness: 0.42, metalness: 0, clearcoat: 0.3, clearcoatRoughness: 0.35 }
  const rim = new THREE.MeshPhysicalMaterial({ ...common, map: getChipEdge(color) })
  const face = new THREE.MeshPhysicalMaterial({ ...common, map: getChipFace(color) })
  const created = [rim, face, face]
  materials.set(color, created)
  return created
}

type ChipStackProps = {
  colors: ChipColor[]
  seed?: number
  position?: [number, number, number]
}

/** A slightly imperfect stack: each chip is nudged and rotated like real ones */
export const ChipStack = ({ colors, seed = 1, position = [0, 0, 0] }: ChipStackProps) => {
  const chips = useMemo(
    () =>
      colors.map((color, i) => {
        const noise = Math.sin(seed * 12.9898 + i * 78.233) * 43758.5453
        const rand = noise - Math.floor(noise)
        return {
          color,
          y: CHIP_H / 2 + i * (CHIP_H + 0.0008),
          dx: (rand - 0.5) * 0.012,
          dz: (((rand * 7) % 1) - 0.5) * 0.012,
          rot: rand * Math.PI * 2,
        }
      }),
    [colors, seed],
  )
  return (
    <group position={position}>
      {chips.map((chip, i) => (
        <mesh
          key={i}
          geometry={chipGeometry}
          material={chipMaterial(chip.color)}
          position={[chip.dx, chip.y, chip.dz]}
          rotation-y={chip.rot}
          castShadow
          receiveShadow
        />
      ))}
    </group>
  )
}
