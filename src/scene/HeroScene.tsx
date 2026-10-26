import { Environment, Lightformer, Sparkles } from '@react-three/drei'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { Bloom, DepthOfField, EffectComposer, Noise, ToneMapping, Vignette } from '@react-three/postprocessing'
import { ToneMappingMode, type DepthOfFieldEffect } from 'postprocessing'
import { useEffect, useMemo, useRef, type ReactNode } from 'react'
import * as THREE from 'three'
import { parseCards } from '../lib/poker'
import { ChipStack } from './Chip'
import { useApp } from '../store'
import { isLowPower } from './quality'
import { RealCard } from './RealCard'
import {
  clamp01,
  easeInOutCubic,
  heroState,
  lerp,
  range01,
  smooth01,
} from './sceneState'
import { CARD_THICKNESS } from './RealCard'
import { CARD_H, createFeltBump, createPlainFelt, getBlobShadowTexture, getCardBackTexture } from './textures'

/* The hero is a close-up of a card table: a royal flush is riffled out of the deck, turned over and fanned. */

const HAND = parseCards('10S JS QS KS AS')
const DECK_CENTER = new THREE.Vector3(-1.25, 0, 0.1)
const DECK_HEIGHT = 0.34
const FAN_PIVOT = new THREE.Vector3(0.3, 0.02, 1.35)

const bounce = (value: number) => {
  const x = clamp01(value)
  if (x < 1 / 2.75) return 7.5625 * x * x
  if (x < 2 / 2.75) return 7.5625 * (x - 1.5 / 2.75) ** 2 + 0.75
  if (x < 2.5 / 2.75) return 7.5625 * (x - 2.25 / 2.75) ** 2 + 0.9375
  return 7.5625 * (x - 2.625 / 2.75) ** 2 + 0.984375
}

const blobGeometry = new THREE.PlaneGeometry(0.5 * 1.7, CARD_H * 1.45)

type PerformerProps = { index: number; card: ReturnType<typeof parseCards>[number]; elapsed: { t: number } }

/** One card of the hand. Flat on the felt while riffled, then lifted into a fan */
const Performer = ({ index, card, elapsed }: PerformerProps) => {
  const pivot = useRef<THREE.Group>(null)
  const tilt = useRef<THREE.Group>(null)
  const roll = useRef<THREE.Group>(null)
  const lift = useRef<THREE.Group>(null)
  const flip = useRef<THREE.Group>(null)
  const blob = useRef<THREE.Mesh>(null)
  const blobMaterial = useMemo(
    () => new THREE.MeshBasicMaterial({ map: getBlobShadowTexture(), transparent: true, opacity: 0.4, depthWrite: false }),
    [],
  )

  useFrame(() => {
    if (!pivot.current || !tilt.current || !roll.current || !lift.current || !flip.current) return
    const p = heroState.progress
    const time = elapsed.t

    const spread = easeInOutCubic(range01(p, 0.02, 0.3))
    const flipP = smooth01(range01(p, 0.26 + index * 0.045, 0.44 + index * 0.045))
    const fan = easeInOutCubic(range01(p, 0.64, 0.96))

    // flat layout: from the top of the deck to a loose ribbon
    const stackY = DECK_HEIGHT + CARD_THICKNESS / 2 + index * 0.0104
    const flatX = lerp(DECK_CENTER.x, 0.3 + (index - 2) * 0.46, spread)
    const flatZ = lerp(DECK_CENTER.z, 0.35 + Math.sin(index * 1.7) * 0.05, spread)
    const flatY = lerp(stackY, CARD_THICKNESS / 2 + 0.002 + index * 0.0104, spread) + Math.sin(Math.PI * flipP) * 0.5
    const flatYaw = lerp(0.12, (index - 2) * 0.05, spread)

    const theta = (index - 2) * 0.2
    const bob = Math.sin(time * 1.1 + index) * 0.02 * fan

    // pivot sits at the card's bottom edge so the fan can open from one point
    const flatPivotZ = flatZ + CARD_H / 2
    pivot.current.position.set(
      lerp(flatX, FAN_PIVOT.x, fan),
      lerp(flatY, FAN_PIVOT.y + 0.02 + bob, fan),
      lerp(flatPivotZ, FAN_PIVOT.z, fan),
    )
    // yaw, then pitch, then a roll around the card's own normal: every fanned card stays in a parallel plane
    pivot.current.rotation.set(0, lerp(flatYaw, 0, fan), 0)
    tilt.current.rotation.x = lerp(-Math.PI / 2, -0.3, fan)
    roll.current.rotation.z = -theta * fan
    pivot.current.scale.setScalar(lerp(1, 1.38, fan))
    // fanned cards need a little depth between them, otherwise coplanar faces fight
    lift.current.position.set(0, CARD_H / 2, index * 0.02 * fan)
    flip.current.rotation.y = Math.PI * (1 - flipP)

    if (blob.current) {
      const height = Math.max(0, pivot.current.position.y)
      blob.current.visible = fan < 0.5
      blob.current.position.set(pivot.current.position.x, 0.004, pivot.current.position.z - CARD_H / 2)
      blob.current.rotation.set(-Math.PI / 2, 0, -pivot.current.rotation.y)
      blobMaterial.opacity = 0.3 * (1 - clamp01((height - 0.02) / 1.2))
      blob.current.scale.setScalar(1 + height * 0.5)
    }
  })

  return (
    <>
      <mesh ref={blob} geometry={blobGeometry} material={blobMaterial} renderOrder={1} />
      <group ref={pivot}>
        <group ref={tilt}>
          <group ref={roll}>
            <group ref={lift}>
              <RealCard card={card} flipRef={flip} />
            </group>
          </group>
        </group>
      </group>
    </>
  )
}

const DeckBody = () => {
  const materials = useMemo(() => {
    const canvas = document.createElement('canvas')
    canvas.width = 64
    canvas.height = 256
    const ctx = canvas.getContext('2d')!
    ctx.fillStyle = '#f1e9d6'
    ctx.fillRect(0, 0, 64, 256)
    ctx.fillStyle = 'rgba(80,60,30,0.3)'
    for (let y = 0; y < 256; y += 4) ctx.fillRect(0, y, 64, 1)
    const edge = new THREE.CanvasTexture(canvas)
    edge.colorSpace = THREE.SRGBColorSpace
    const side = new THREE.MeshStandardMaterial({ map: edge, roughness: 0.7 })
    const top = new THREE.MeshPhysicalMaterial({ map: getCardBackTexture(), roughness: 0.4, clearcoat: 0.4 })
    return [side, side, top, side, side, side]
  }, [])
  return (
    <mesh position={[DECK_CENTER.x, DECK_HEIGHT / 2, DECK_CENTER.z]} rotation-y={0.12} material={materials} castShadow receiveShadow>
      <boxGeometry args={[0.5 * 0.992, DECK_HEIGHT, CARD_H * 0.992]} />
    </mesh>
  )
}

const LooseCard = ({ x, z, yaw, face, layer = 0 }: { x: number; z: number; yaw: number; face: string; layer?: number }) => {
  const card = useMemo(() => parseCards(face)[0], [face])
  const flip = useRef<THREE.Group>(null)
  useEffect(() => {
    if (flip.current) flip.current.rotation.y = Math.PI
  }, [])
  return (
    <group position={[x, CARD_THICKNESS / 2 + 0.002 + layer * (CARD_THICKNESS + 0.002), z]} rotation-y={yaw}>
      <group rotation-x={-Math.PI / 2}>
        <RealCard card={card} flipRef={flip} />
      </group>
    </group>
  )
}

type DropChip = { colors: Parameters<typeof ChipStack>[0]['colors']; x: number; z: number; delay: number; seed: number }

const CHIP_STACKS: DropChip[] = [
  { colors: ['green', 'black', 'black', 'green', 'black', 'red', 'red', 'black', 'green', 'black'], x: 2.15, z: 1.05, delay: 0.5, seed: 4 },
  { colors: ['red', 'black', 'red', 'black', 'red', 'black', 'green'], x: 2.6, z: 0.62, delay: 0.75, seed: 8 },
  { colors: ['black', 'black', 'green', 'black', 'black', 'green'], x: 1.9, z: 0.55, delay: 1.0, seed: 12 },
  { colors: ['black', 'black', 'red', 'red'], x: -2.4, z: 1.25, delay: 1.2, seed: 16 },
]

/**
 * Compiles every shader asynchronously and renders one hidden frame, so the hero can start later
 * without a hitch. Until the page asks for it, the canvas stays in frameloop "never".
 */
const Warmup = () => {
  const gl = useThree((state) => state.gl)
  const scene = useThree((state) => state.scene)
  const camera = useThree((state) => state.camera)
  const advance = useThree((state) => state.advance)
  const setHeroReady = useApp((state) => state.setHeroReady)

  useEffect(() => {
    let cancelled = false
    const run = async () => {
      try {
        await gl.compileAsync(scene, camera)
      } catch {
        // older drivers: the first frame compiles synchronously instead
      }
      if (cancelled) return
      advance(performance.now())
      requestAnimationFrame(() => !cancelled && setHeroReady())
    }
    void run()
    return () => {
      cancelled = true
    }
  }, [gl, scene, camera, advance, setHeroReady])

  return null
}

const Chips = ({ elapsed }: { elapsed: { t: number } }) => {
  const groups = useRef<(THREE.Group | null)[]>([])
  useFrame(() => {
    CHIP_STACKS.forEach((stack, i) => {
      const group = groups.current[i]
      if (!group) return
      const u = clamp01((elapsed.t - stack.delay) / 0.9)
      group.visible = u > 0
      group.position.set(stack.x, (1 - bounce(u)) * 2.6, stack.z)
    })
  })
  return (
    <>
      {CHIP_STACKS.map((stack, i) => (
        <group key={i} ref={(node) => void (groups.current[i] = node)}>
          <ChipStack colors={stack.colors} seed={stack.seed} />
        </group>
      ))}
    </>
  )
}

const HeroFelt = () => {
  const { map, bump } = useMemo(() => {
    const felt = createPlainFelt()
    const fibers = createFeltBump(4, 4)
    for (const texture of [felt, fibers]) {
      texture.wrapS = THREE.RepeatWrapping
      texture.wrapT = THREE.RepeatWrapping
      texture.repeat.set(5, 3.4)
    }
    return { map: felt, bump: fibers }
  }, [])
  return (
    <mesh rotation-x={-Math.PI / 2} receiveShadow>
      <planeGeometry args={[40, 26]} />
      <meshStandardMaterial map={map} bumpMap={bump} bumpScale={1.4} roughness={0.98} />
    </mesh>
  )
}

const Rig = ({ children }: { children: ReactNode }) => {
  const group = useRef<THREE.Group>(null)
  const pointer = useThree((state) => state.pointer)
  const size = useThree((state) => state.size)
  useFrame((_, delta) => {
    if (!group.current) return
    const k = 1 - Math.exp(-delta * 3)
    group.current.rotation.y += (pointer.x * 0.1 - group.current.rotation.y) * k
    group.current.rotation.x += (-pointer.y * 0.04 - group.current.rotation.x) * k
    const narrow = size.width / size.height < 0.9
    const scale = narrow ? 0.62 : size.width / size.height < 1.3 ? 0.82 : 1
    group.current.scale.setScalar(lerp(group.current.scale.x, scale, k))
  })
  return <group ref={group}>{children}</group>
}

const focus = new THREE.Vector3(0.3, 0.3, 0.5)

const CameraControl = () => {
  const camera = useThree((state) => state.camera) as THREE.PerspectiveCamera
  const size = useThree((state) => state.size)
  useFrame(() => {
    const aspect = size.width / size.height
    const narrow = aspect < 0.9
    const p = heroState.progress
    const lean = smooth01(range01(p, 0.62, 1))
    // closer and lower while the hand stands up
    const y = lerp(6.3, 3.3, lean)
    const z = lerp(6.2, 5.4, lean)
    const distance = narrow ? 1.5 : aspect < 1.3 ? 1.2 : 1
    camera.position.set(0.15, y * distance, z * distance)
    focus.set(0.3, lerp(0.15, 0.85, lean), lerp(0.4, 1.35, lean))
    camera.lookAt(focus)

    // text lives on the left on wide screens and on top on tall ones
    const wide = aspect >= 0.9
    const offsetX = wide ? -size.width * lerp(0.17, 0.03, lean) : 0
    const offsetY = wide ? 0 : -size.height * 0.2
    camera.setViewOffset(size.width, size.height, offsetX, offsetY, size.width, size.height)
  })
  return null
}

const Effects = ({ low }: { low: boolean }) => {
  const dof = useRef<DepthOfFieldEffect>(null)
  useFrame(() => {
    if (!dof.current) return
    dof.current.target = focus
  })
  if (low) {
    return (
      <EffectComposer multisampling={0}>
        <Bloom intensity={0.35} luminanceThreshold={0.9} luminanceSmoothing={0.3} mipmapBlur />
        <Vignette offset={0.2} darkness={0.95} />
        <ToneMapping mode={ToneMappingMode.ACES_FILMIC} />
      </EffectComposer>
    )
  }
  return (
    <EffectComposer multisampling={4}>
      <DepthOfField ref={dof} worldFocusRange={3.2} bokehScale={2.2} resolutionScale={0.6} focalLength={0.05} />
      <Bloom intensity={0.4} luminanceThreshold={0.9} luminanceSmoothing={0.3} mipmapBlur />
      <Noise opacity={0.04} />
      <Vignette offset={0.2} darkness={0.95} />
      <ToneMapping mode={ToneMappingMode.ACES_FILMIC} />
    </EffectComposer>
  )
}

const Contents = ({ low }: { low: boolean }) => {
  const elapsed = useMemo(() => ({ t: 0 }), [])
  useFrame((_, delta) => {
    elapsed.t += Math.min(delta, 0.05)
    const k = 1 - Math.exp(-delta * 7)
    heroState.progress += (heroState.target - heroState.progress) * k
  }, -10)

  return (
    <>
      <color attach="background" args={['#0e0d0c']} />
      <fog attach="fog" args={['#0e0d0c', 11, 26]} />
      <CameraControl />

      <ambientLight intensity={0.28} color="#ffe6c4" />
      <hemisphereLight args={['#ffd6a0', '#120b06', 0.35]} />
      <spotLight
        position={[-3.5, 7.5, 4]}
        angle={0.55}
        penumbra={1}
        decay={1.5}
        distance={28}
        intensity={210}
        color="#ffdca6"
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-bias={-0.0008}
        shadow-normalBias={0.03}
        shadow-radius={7}
        shadow-blurSamples={18}
      />
      <pointLight position={[4.5, 2.2, -2]} color="#c4a472" intensity={34} distance={16} decay={1.6} />
      <pointLight position={[-5, 2, -3]} color="#ffb15c" intensity={22} distance={16} decay={1.6} />
      <Environment resolution={256} frames={1}>
        <Lightformer form="rect" intensity={2.2} color="#ffd9a0" position={[-2, 6, 3]} rotation-x={Math.PI / 2} scale={[8, 5, 1]} />
        <Lightformer form="rect" intensity={1.3} color="#c4a472" position={[6, 2, -2]} rotation-y={-Math.PI / 2} scale={[6, 3, 1]} />
      </Environment>

      <Rig>
        <HeroFelt />
        <DeckBody />
        {HAND.map((card, index) => (
          <Performer key={index} index={index} card={card} elapsed={elapsed} />
        ))}
        <LooseCard x={-2.5} z={-0.9} yaw={0.5} face="2C" />
        <LooseCard x={-2.2} z={-1.1} yaw={-0.25} face="2C" layer={1} />
        <LooseCard x={2.7} z={-1.2} yaw={0.9} face="2C" />
        <Chips elapsed={elapsed} />
      </Rig>

      <Sparkles count={60} scale={[12, 5, 8]} position={[0, 2, 0]} size={2.4} speed={0.2} opacity={0.4} color="#ffd48a" />
      <Effects low={low} />
      <Warmup />
    </>
  )
}

type HeroSceneProps = { active: boolean }

export const HeroScene = ({ active }: HeroSceneProps) => {
  const low = useMemo(isLowPower, [])
  return (
  <Canvas
    frameloop={active ? 'always' : 'never'}
    shadows="variance"
    dpr={low ? [1, 1.4] : [1, 1.75]}
    camera={{ fov: 30, near: 0.5, far: 80, position: [0.15, 6.3, 6.2] }}
    gl={{ antialias: false, powerPreference: 'high-performance' }}
  >
    <Contents low={low} />
  </Canvas>
  )
}
