import { Environment, Lightformer, Sparkles } from '@react-three/drei'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { Bloom, DepthOfField, EffectComposer, Noise, ToneMapping, Vignette } from '@react-three/postprocessing'
import { ToneMappingMode, type DepthOfFieldEffect } from 'postprocessing'
import { useEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'
import { parseCard, type CardData } from '../lib/poker'
import { ChipStack } from './Chip'
import {
  BURN,
  BUTTON,
  CHIPS_A,
  CHIPS_B,
  DEALER_SEAT,
  DEAL_ORDER,
  DECK_POS,
  DECK_TOP_Y,
  FLOOR_Y,
  FLOP_Z,
  HERO_SEAT,
  HOLE_FAN,
  HOLE_INSET,
  HOLE_LATERAL,
  POT_STACKS,
  seats,
  type Seat,
} from './layout'
import { RealCard } from './RealCard'
import { clamp01, easeInOutCubic, easeOutQuart, lerp, smooth01 } from './sceneState'
import { Table } from './Table'
import { CARD_H, createDealerButtonTexture, createGlowTexture, getBlobShadowTexture, getCardBackTexture } from './textures'

import { useApp } from '../store'
import { INTRO_DURATION } from './introTiming'
import { isLowPower } from './quality'

/** Intro clock, driven by the director and read by every animated piece */
const clock = { t: 0, skip: false, freeze: false }

const T = {
  dealStart: 0.5,
  dealStep: 0.12,
  fly: 0.46,
  burn: 2.45,
  flop: 2.65,
  flopStep: 0.15,
  flopFlip: 3.4,
  heroFlip: 3.6,
} as const

const REST_Y = 0.006

const HERO_HAND: CardData[] = [parseCard('AS'), parseCard('AH')]
const FILLER: CardData = parseCard('2C')
const FLOP: CardData[] = [parseCard('AD'), parseCard('KS'), parseCard('7C')]

const lateral = (seat: Seat) => ({ x: Math.cos(seat.yaw), z: -Math.sin(seat.yaw) })

/* ---------------------------------- cards --------------------------------- */

type CardPose = {
  visible: boolean
  x: number
  y: number
  z: number
  yaw: number
  flip: number
  peek: number
}

type PoseFn = (t: number) => CardPose

const HIDDEN: CardPose = { visible: false, x: 0, y: 0, z: 0, yaw: 0, flip: 0, peek: 0 }

const holeTarget = (seat: Seat, slot: 0 | 1) => {
  const side = slot === 0 ? -1 : 1
  const lat = lateral(seat)
  return {
    x: seat.x * HOLE_INSET + lat.x * side * HOLE_LATERAL,
    z: seat.z * HOLE_INSET + lat.z * side * HOLE_LATERAL,
    yaw: seat.yaw + side * HOLE_FAN,
  }
}

/** Dealt cards skim across the felt and settle with a little spin, like a real dealer's flick */
const holePose = (order: number, seat: Seat, slot: 0 | 1, hero: boolean): PoseFn => {
  const start = T.dealStart + order * T.dealStep
  const target = holeTarget(seat, slot)
  const spin = (order % 2 ? 1 : -1) * (1.4 + ((order * 0.37) % 0.9))
  const startYaw = target.yaw + spin
  return (t) => {
    if (t < start) return HIDDEN
    const u = clamp01((t - start) / T.fly)
    const e = easeOutQuart(u)
    const hop = Math.sin(Math.PI * Math.min(1, u * 1.6)) * 0.14
    const flipU = hero ? smooth01((t - T.heroFlip - slot * 0.12) / 0.55) : 0
    return {
      visible: true,
      x: lerp(DECK_POS[0], target.x, e),
      y: REST_Y + lerp(DECK_TOP_Y, 0, e) + hop + Math.sin(Math.PI * flipU) * 0.5,
      z: lerp(DECK_POS[2], target.z, e),
      yaw: lerp(startYaw, target.yaw, e),
      flip: flipU,
      peek: Math.sin(Math.PI * flipU) * 0.5,
    }
  }
}

const boardPose = (index: number, burn = false): PoseFn => {
  const start = burn ? T.burn : T.flop + index * T.flopStep
  const tx = burn ? BURN.x : (index - 1) * 0.66
  const tz = burn ? BURN.z : FLOP_Z
  const ty = burn ? BURN.yaw : 0
  return (t) => {
    if (t < start) return HIDDEN
    const u = clamp01((t - start) / 0.42)
    const e = easeOutQuart(u)
    const f = burn ? 0 : smooth01((t - T.flopFlip - index * 0.12) / 0.5)
    return {
      visible: true,
      x: lerp(DECK_POS[0], tx, e),
      y: REST_Y + lerp(DECK_TOP_Y, 0, e) + Math.sin(Math.PI * Math.min(1, u * 1.6)) * 0.14 + Math.sin(Math.PI * f) * 0.55,
      z: lerp(DECK_POS[2], tz, e),
      yaw: lerp(0.9 * (index % 2 ? 1 : -1), ty, e),
      flip: f,
      peek: Math.sin(Math.PI * f) * 0.35,
    }
  }
}

const blobGeometry = new THREE.PlaneGeometry(0.5 * 1.7, CARD_H * 1.45)

type DealtCardProps = { card: CardData; pose: PoseFn }

const DealtCard = ({ card, pose }: DealtCardProps) => {
  const outer = useRef<THREE.Group>(null)
  const pivot = useRef<THREE.Group>(null)
  const flip = useRef<THREE.Group>(null)
  const blob = useRef<THREE.Mesh>(null)
  const blobMaterial = useMemo(
    () => new THREE.MeshBasicMaterial({ map: getBlobShadowTexture(), transparent: true, opacity: 0.4, depthWrite: false }),
    [],
  )

  useFrame(() => {
    if (!outer.current || !pivot.current || !flip.current) return
    const p = pose(clock.t)
    outer.current.visible = p.visible
    if (blob.current) blob.current.visible = p.visible
    if (!p.visible) return
    outer.current.position.set(p.x, p.y, p.z)
    outer.current.rotation.y = p.yaw
    pivot.current.rotation.x = -p.peek
    flip.current.rotation.y = Math.PI * (1 - p.flip)
    if (blob.current) {
      const lift = Math.max(0, p.y - REST_Y)
      blob.current.position.set(p.x, 0.004, p.z)
      blob.current.rotation.set(-Math.PI / 2, 0, -p.yaw)
      blobMaterial.opacity = 0.34 * (1 - clamp01(lift / 0.9))
      blob.current.scale.setScalar(1 + lift * 0.5)
    }
  })

  return (
    <>
      <mesh ref={blob} geometry={blobGeometry} material={blobMaterial} visible={false} renderOrder={1} />
      <group ref={outer} visible={false}>
        <group rotation-x={-Math.PI / 2}>
          <group ref={pivot} position-y={CARD_H / 2}>
            <group position-y={-CARD_H / 2}>
              <RealCard card={card} flipRef={flip} />
            </group>
          </group>
        </group>
      </group>
    </>
  )
}

const Cards = () => {
  const items = useMemo(() => {
    const list: { key: string; card: CardData; pose: PoseFn }[] = []
    let order = 0
    for (const slot of [0, 1] as const) {
      for (const seatIndex of DEAL_ORDER) {
        const hero = seatIndex === HERO_SEAT
        list.push({
          key: `hole-${seatIndex}-${slot}`,
          card: hero ? HERO_HAND[slot] : FILLER,
          pose: holePose(order, seats[seatIndex], slot, hero),
        })
        order++
      }
    }
    list.push({ key: 'burn', card: FILLER, pose: boardPose(0, true) })
    FLOP.forEach((card, index) => list.push({ key: `flop-${index}`, card, pose: boardPose(index) }))
    return list
  }, [])

  return (
    <group>
      {items.map((item) => (
        <DealtCard key={item.key} card={item.card} pose={item.pose} />
      ))}
    </group>
  )
}

/* --------------------------------- props ---------------------------------- */

const STACK_RECIPES: Parameters<typeof ChipStack>[0]['colors'][] = [
  ['black', 'black', 'green', 'black', 'red', 'red', 'black', 'green'],
  ['red', 'black', 'red', 'black', 'red', 'black', 'green', 'green', 'black'],
  ['green', 'green', 'black', 'green', 'black', 'black'],
  ['black', 'black', 'red', 'red', 'black', 'black', 'black', 'green', 'black', 'red'],
]

const SeatChips = () => (
  <group>
    {seats.map((seat) => {
      if (seat.index === DEALER_SEAT) return null
      const lat = lateral(seat)
      // chips sit beside the hole cards, never under them (see the layout notes in layout.ts)
      const ax = seat.x * CHIPS_A.base + lat.x * CHIPS_A.side
      const az = seat.z * CHIPS_A.base + lat.z * CHIPS_A.side
      const bx = seat.x * CHIPS_B.base - lat.x * CHIPS_B.side - seat.outX * 0.1
      const bz = seat.z * CHIPS_B.base - lat.z * CHIPS_B.side - seat.outZ * 0.1
      return (
        <group key={seat.index}>
          <ChipStack position={[ax, 0.002, az]} colors={STACK_RECIPES[seat.index % STACK_RECIPES.length]} seed={seat.index + 1} />
          <ChipStack
            position={[bx, 0.002, bz]}
            colors={STACK_RECIPES[(seat.index + 2) % STACK_RECIPES.length].slice(0, 5)}
            seed={seat.index + 11}
          />
        </group>
      )
    })}
    <ChipStack position={[POT_STACKS[0][0], 0.002, POT_STACKS[0][1]]} colors={['green', 'black', 'black', 'red']} seed={31} />
    <ChipStack position={[POT_STACKS[1][0], 0.002, POT_STACKS[1][1]]} colors={['red', 'red', 'black']} seed={32} />
  </group>
)

const deckSideTexture = (() => {
  const canvas = document.createElement('canvas')
  canvas.width = 64
  canvas.height = 256
  const ctx = canvas.getContext('2d')!
  ctx.fillStyle = '#f1e9d6'
  ctx.fillRect(0, 0, 64, 256)
  ctx.fillStyle = 'rgba(80,60,30,0.28)'
  for (let y = 0; y < 256; y += 4) ctx.fillRect(0, y, 64, 1)
  const texture = new THREE.CanvasTexture(canvas)
  texture.colorSpace = THREE.SRGBColorSpace
  return texture
})()

const Deck = () => {
  const materials = useMemo(() => {
    const side = new THREE.MeshStandardMaterial({ map: deckSideTexture, roughness: 0.7 })
    const top = new THREE.MeshPhysicalMaterial({ map: getCardBackTexture(), roughness: 0.4, clearcoat: 0.4 })
    return [side, side, top, side, side, side]
  }, [])
  const button = useMemo(() => {
    const rim = new THREE.MeshPhysicalMaterial({ color: '#efe6cf', roughness: 0.3, clearcoat: 0.5 })
    const face = new THREE.MeshPhysicalMaterial({ map: createDealerButtonTexture(), roughness: 0.3, clearcoat: 0.5 })
    return [rim, face, face]
  }, [])
  return (
    <group>
      <mesh position={[DECK_POS[0], 0.17, DECK_POS[2]]} material={materials} castShadow receiveShadow rotation-y={0.06}>
        <boxGeometry args={[0.5, 0.34, CARD_H]} />
      </mesh>
      <mesh position={[BUTTON.x, 0.02, BUTTON.z]} rotation-y={0.4} material={button} castShadow>
        <cylinderGeometry args={[0.19, 0.19, 0.04, 48]} />
      </mesh>
    </group>
  )
}


const glass = new THREE.MeshPhysicalMaterial({ color: '#d7e6ec', roughness: 0.03, transparent: true, opacity: 0.22, clearcoat: 1, envMapIntensity: 2.2, depthWrite: false })
const whisky = new THREE.MeshPhysicalMaterial({ color: '#d98a24', roughness: 0.15, emissive: '#5a2c05', emissiveIntensity: 0.12, transparent: true, opacity: 0.88 })

const Tumbler = ({ position, rotation = 0 }: { position: [number, number, number]; rotation?: number }) => (
  <group position={position} rotation-y={rotation}>
    <mesh position-y={0.22} material={glass}>
      <cylinderGeometry args={[0.2, 0.17, 0.44, 40]} />
    </mesh>
    <mesh position-y={0.03} material={glass}>
      <cylinderGeometry args={[0.17, 0.17, 0.06, 40]} />
    </mesh>
    <mesh position-y={0.17} material={whisky}>
      <cylinderGeometry args={[0.185, 0.16, 0.28, 40]} />
    </mesh>
    <mesh position={[0.04, 0.34, 0.02]} rotation={[0.3, 0.4, 0.2]} material={glass}>
      <boxGeometry args={[0.13, 0.13, 0.13]} />
    </mesh>
    <mesh position={[-0.05, 0.28, -0.04]} rotation={[0.1, 0.9, 0.3]} material={glass}>
      <boxGeometry args={[0.11, 0.11, 0.11]} />
    </mesh>
  </group>
)

/* ------------------------------ scene plumbing ----------------------------- */

const glowTexture = createGlowTexture()

const Bokeh = () => {
  const dots = useMemo(
    () =>
      Array.from({ length: 28 }, (_, i) => {
        const angle = (i / 28) * Math.PI * 2
        const radius = 11 + (i % 5) * 2.4
        return {
          x: Math.cos(angle) * radius,
          z: Math.sin(angle) * radius * 0.8,
          y: FLOOR_Y + 1 + ((i * 7) % 9) * 0.6,
          s: 0.8 + ((i * 13) % 7) * 0.3,
          o: 0.1 + ((i * 5) % 6) * 0.03,
        }
      }),
    [],
  )
  return (
    <group>
      {dots.map((dot, i) => (
        <sprite key={i} position={[dot.x, dot.y, dot.z]} scale={[dot.s * 2, dot.s * 2, 1]}>
          <spriteMaterial map={glowTexture} color="#ffb85c" transparent opacity={dot.o} blending={THREE.AdditiveBlending} depthWrite={false} toneMapped={false} />
        </sprite>
      ))}
    </group>
  )
}

type Key = { t: number; pos: [number, number, number]; look: [number, number, number] }

const KEYS: Key[] = [
  { t: 0, pos: [0, 12.2, 3.2], look: [0, 0, 0.1] },
  { t: 2.3, pos: [0, 8.4, 5.8], look: [0, 0, 0.2] },
  { t: 4.0, pos: [0.3, 5.6, 6.0], look: [0, 0, 0.5] },
  { t: INTRO_DURATION, pos: [0, 2.4, 3.9], look: [0, 0.05, 1.0] },
]

const camPos = new THREE.Vector3()
const camLook = new THREE.Vector3()

const sampleCamera = (t: number) => {
  for (let i = 0; i < KEYS.length - 1; i++) {
    const a = KEYS[i]
    const b = KEYS[i + 1]
    if (t <= b.t) {
      const k = easeInOutCubic((t - a.t) / (b.t - a.t))
      camPos.set(lerp(a.pos[0], b.pos[0], k), lerp(a.pos[1], b.pos[1], k), lerp(a.pos[2], b.pos[2], k))
      camLook.set(lerp(a.look[0], b.look[0], k), lerp(a.look[1], b.look[1], k), lerp(a.look[2], b.look[2], k))
      return
    }
  }
  const last = KEYS[KEYS.length - 1]
  camPos.set(...last.pos)
  camLook.set(...last.look)
}

const focus = new THREE.Vector3()

type DirectorProps = { onProgress: (t: number) => void; onFinish: () => void }

const Director = ({ onProgress, onFinish }: DirectorProps) => {
  const frames = useRef(0)
  const done = useRef(false)
  const mountedAt = useRef(performance.now())
  const camera = useThree((state) => state.camera)
  const size = useThree((state) => state.size)

  useFrame((_, delta) => {
    frames.current += 1
    // The opening only starts once shaders are compiled here AND in the hero scene (waits at most 3 s),
    // otherwise the hero's compile would freeze the screen right when the cards flip.
    const heroGate = useApp.getState().heroReady || performance.now() - mountedAt.current > 3000
    if (frames.current > 4 && heroGate && !clock.freeze) clock.t += Math.min(delta, 0.05)
    if (clock.skip && clock.t < INTRO_DURATION - 0.9) clock.t = INTRO_DURATION - 0.9
    onProgress(clock.t)

    sampleCamera(clock.t)
    // narrow screens: pull back so the table still fits
    const aspect = size.width / size.height
    const widen = aspect < 1.2 ? Math.min(1.9, 1.2 / aspect) : 1
    camera.position.set(camLook.x + (camPos.x - camLook.x) * widen, camLook.y + (camPos.y - camLook.y) * widen, camLook.z + (camPos.z - camLook.z) * widen)
    camera.lookAt(camLook)
    focus.copy(camLook)

    if (!done.current && clock.t >= INTRO_DURATION) {
      done.current = true
      onFinish()
    }
  }, -10)

  return null
}

const Lights = () => {
  const spot = useRef<THREE.SpotLight>(null)
  const warm = useRef<THREE.PointLight>(null)
  useFrame(() => {
    const ramp = smooth01(clock.t / 0.7)
    if (spot.current) spot.current.intensity = 250 * ramp
    if (warm.current) warm.current.intensity = 30 * ramp
  })
  return (
    <>
      <ambientLight intensity={0.22} color="#ffe6c4" />
      <hemisphereLight args={['#ffd6a0', '#120b06', 0.4]} />
      <spotLight
        ref={spot}
        position={[0, 9.5, 1.2]}
        angle={0.42}
        penumbra={1}
        decay={1.5}
        distance={30}
        color="#ffdca6"
        intensity={0}
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-bias={-0.0004}
        shadow-radius={6}
        shadow-blurSamples={16}
      />
      <pointLight ref={warm} position={[0, 3, 8]} color="#ffb870" intensity={0} distance={20} decay={1.7} />
      <pointLight position={[-8, 2.5, -4]} color="#c4a472" intensity={16} distance={20} decay={1.6} />
      <pointLight position={[8, 2.5, -4]} color="#c4a472" intensity={16} distance={20} decay={1.6} />
    </>
  )
}

const Effects = ({ low }: { low: boolean }) => {
  const dof = useRef<DepthOfFieldEffect>(null)
  useFrame(() => {
    const effect = dof.current
    if (!effect) return
    effect.target = focus
    const dive = smooth01((clock.t - 3.4) / 2)
    effect.bokehScale = lerp(1.1, 4.2, dive)
  })
  if (low) {
    return (
      <EffectComposer multisampling={0}>
        <Bloom intensity={0.4} luminanceThreshold={0.9} luminanceSmoothing={0.3} mipmapBlur />
        <Vignette offset={0.22} darkness={0.95} />
        <ToneMapping mode={ToneMappingMode.ACES_FILMIC} />
      </EffectComposer>
    )
  }
  return (
    <EffectComposer multisampling={4}>
      <DepthOfField ref={dof} worldFocusRange={3.4} bokehScale={1.1} resolutionScale={0.6} focalLength={0.05} />
      <Bloom intensity={0.45} luminanceThreshold={0.9} luminanceSmoothing={0.3} mipmapBlur />
      <Noise opacity={0.04} />
      <Vignette offset={0.22} darkness={0.95} />
      <ToneMapping mode={ToneMappingMode.ACES_FILMIC} />
    </EffectComposer>
  )
}

const Contents = ({ onProgress, onFinish, low }: DirectorProps & { low: boolean }) => (
  <>
    <color attach="background" args={['#0e0d0c']} />
    <fog attach="fog" args={['#0e0d0c', 14, 38]} />
    <Director onProgress={onProgress} onFinish={onFinish} />
    <Lights />
    <Environment resolution={128} frames={1}>
      <Lightformer form="rect" intensity={2.2} color="#ffd9a0" position={[0, 7, 0]} rotation-x={Math.PI / 2} scale={[12, 6, 1]} />
      <Lightformer form="rect" intensity={1.1} color="#c4a472" position={[-9, 2, 1]} rotation-y={Math.PI / 2} scale={[6, 3, 1]} />
      <Lightformer form="rect" intensity={1.1} color="#c4a472" position={[9, 2, 1]} rotation-y={-Math.PI / 2} scale={[6, 3, 1]} />
    </Environment>

    <mesh rotation-x={-Math.PI / 2} position-y={FLOOR_Y} receiveShadow>
      <planeGeometry args={[80, 80]} />
      <meshStandardMaterial color="#0a0807" roughness={0.85} metalness={0.3} />
    </mesh>

    <Table />
    <Deck />
    <SeatChips />
    <Cards />
    <Tumbler position={[-4.15, 0.3, 1.35]} rotation={0.4} />
    <Tumbler position={[4.1, 0.3, -1.3]} rotation={1.2} />
    <Bokeh />
    <Sparkles count={70} scale={[14, 5, 9]} position={[0, 2, 0]} size={2.6} speed={0.2} opacity={0.4} color="#ffd48a" />
    <Effects low={low} />
  </>
)

type IntroSceneProps = {
  onProgress: (t: number) => void
  onFinish: () => void
  skipSignal: number
}

export const IntroScene = ({ onProgress, onFinish, skipSignal }: IntroSceneProps) => {
  const low = useMemo(isLowPower, [])
  useEffect(() => {
    if (skipSignal > 0) clock.skip = true
  }, [skipSignal])

  useEffect(() => {
    // dev only: ?introAt=5.5 jumps into the opening to inspect a frame
    const seek = import.meta.env.DEV ? Number(new URLSearchParams(location.search).get('introAt')) : 0
    clock.t = Number.isFinite(seek) ? seek : 0
    clock.skip = false
    // dev only: ?introFreeze holds the clock at introAt so a single frame can be inspected
    clock.freeze = import.meta.env.DEV && new URLSearchParams(location.search).has('introFreeze')
  }, [])

  return (
    <Canvas
      shadows="variance"
      dpr={low ? [1, 1.4] : [1, 1.75]}
      camera={{ fov: 36, near: 0.3, far: 100, position: [0, 13, 2] }}
      gl={{ antialias: false, powerPreference: 'high-performance' }}
    >
      <Contents onProgress={onProgress} onFinish={onFinish} low={low} />
    </Canvas>
  )
}
