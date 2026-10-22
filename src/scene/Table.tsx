import { useMemo } from 'react'
import * as THREE from 'three'
import { FELT_R, FLOOR_Y, OUTER_R, TABLE_L } from './layout'
import { createFeltBump, createFeltTexture, createLeatherTextures, createWoodTexture } from './textures'

const stadiumShape = (half: number, radius: number) => {
  const shape = new THREE.Shape()
  shape.moveTo(-half, -radius)
  shape.lineTo(half, -radius)
  shape.absarc(half, 0, radius, -Math.PI / 2, Math.PI / 2, false)
  shape.lineTo(-half, radius)
  shape.absarc(-half, 0, radius, Math.PI / 2, Math.PI * 1.5, false)
  return shape
}

const stadiumPath = (half: number, radius: number) => {
  const path = new THREE.Path()
  path.moveTo(-half, -radius)
  path.lineTo(half, -radius)
  path.absarc(half, 0, radius, -Math.PI / 2, Math.PI / 2, false)
  path.lineTo(-half, radius)
  path.absarc(-half, 0, radius, Math.PI / 2, Math.PI * 1.5, false)
  return path
}

/** Extrudes a (possibly holed) stadium so that it grows upwards (+Y) from y = 0 */
const extrudeStadium = (outerRadius: number, innerRadius: number | null, depth: number, bevel = 0, half = TABLE_L) => {
  const shape = stadiumShape(half, outerRadius)
  if (innerRadius !== null) shape.holes.push(stadiumPath(half, innerRadius))
  const geometry = new THREE.ExtrudeGeometry(shape, {
    depth,
    curveSegments: 80,
    bevelEnabled: bevel > 0,
    bevelThickness: bevel,
    bevelSize: bevel,
    bevelSegments: 10,
  })
  geometry.rotateX(-Math.PI / 2)
  return geometry
}

const feltGeometry = () => {
  const geometry = new THREE.ShapeGeometry(stadiumShape(TABLE_L, FELT_R + 0.12), 80)
  geometry.rotateX(-Math.PI / 2)
  const width = (TABLE_L + FELT_R + 0.12) * 2
  const depth = (FELT_R + 0.12) * 2
  const position = geometry.attributes.position
  const uv = geometry.attributes.uv
  for (let i = 0; i < position.count; i++) {
    uv.setXY(i, position.getX(i) / width + 0.5, 1 - (position.getZ(i) / depth + 0.5))
  }
  return geometry
}

export const RAIL_TOP = 0.28

export const Table = ({ withBase = true }: { withBase?: boolean }) => {
  const parts = useMemo(() => {
    const w = (TABLE_L + FELT_R + 0.12) * 2
    const d = (FELT_R + 0.12) * 2
    const leather = createLeatherTextures()
    const wood = createWoodTexture('#3a2415', '#1c0f06')
    wood.repeat.set(3, 1)
    return {
      felt: feltGeometry(),
      rail: extrudeStadium(OUTER_R - 0.08, FELT_R + 0.1, 0.3, 0.08),
      goldInner: extrudeStadium(FELT_R + 0.06, FELT_R - 0.03, 0.06),
      goldOuter: extrudeStadium(OUTER_R - 0.2, OUTER_R - 0.23, 0.02),
      skirt: extrudeStadium(OUTER_R - 0.1, null, 0.85, 0.03),
      goldBand: extrudeStadium(OUTER_R - 0.06, OUTER_R - 0.1, 0.05),
      pedestal: extrudeStadium(1.15, null, Math.abs(FLOOR_Y) - 1.1, 0.04, 1.4),
      feltTexture: createFeltTexture(w, d),
      feltBump: createFeltBump(w, d),
      leather,
      wood,
    }
  }, [])

  return (
    <group>
      {withBase && (
        <>
          <mesh geometry={parts.skirt} position-y={-1.0} castShadow receiveShadow>
            <meshStandardMaterial map={parts.wood} color="#c9a07a" roughness={0.5} metalness={0.1} />
          </mesh>
          <mesh geometry={parts.goldBand} position-y={-0.2}>
            <meshStandardMaterial color="#e0ad3f" metalness={1} roughness={0.3} />
          </mesh>
          <mesh geometry={parts.pedestal} position-y={FLOOR_Y + 0.04}>
            <meshStandardMaterial color="#0e0a07" roughness={0.45} metalness={0.4} />
          </mesh>
        </>
      )}

      <mesh geometry={parts.felt} receiveShadow>
        <meshStandardMaterial map={parts.feltTexture} bumpMap={parts.feltBump} bumpScale={1.2} roughness={0.98} metalness={0} />
      </mesh>

      <mesh geometry={parts.rail} position-y={-0.1} castShadow receiveShadow>
        <meshPhysicalMaterial
          map={parts.leather.map}
          bumpMap={parts.leather.bumpMap}
          bumpScale={2}
          color="#2a2118"
          roughness={0.46}
          clearcoat={0.5}
          clearcoatRoughness={0.38}
          sheen={0.7}
          sheenColor="#3a2c1c"
        />
      </mesh>

      <mesh geometry={parts.goldInner}>
        <meshStandardMaterial color="#e0ad3f" metalness={1} roughness={0.22} />
      </mesh>
      <mesh geometry={parts.goldOuter} position-y={RAIL_TOP - 0.005}>
        <meshStandardMaterial color="#e0ad3f" metalness={1} roughness={0.28} />
      </mesh>
    </group>
  )
}
