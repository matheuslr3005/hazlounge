import { Environment, Float, Lightformer, PresentationControls } from '@react-three/drei'
import { Canvas, useFrame } from '@react-three/fiber'
import { useRef } from 'react'
import type * as THREE from 'three'
import { chipGeometry, chipMaterial } from '../scene/Chip'

const Chip = () => {
  const group = useRef<THREE.Group>(null)

  useFrame((_, delta) => {
    if (group.current) group.current.rotation.y += delta * 0.5
  })

  return (
    <group rotation={[Math.PI / 2.6, 0, 0.2]}>
      <group ref={group} scale={10}>
        <mesh geometry={chipGeometry} material={chipMaterial('green')} castShadow />
      </group>
    </group>
  )
}

/** Small draggable 3D buy-in chip used as the visual anchor of the reservation panel */
export const ChipViewer = () => (
  <Canvas dpr={[1, 1.75]} camera={{ position: [0, 0.5, 5], fov: 34 }} gl={{ antialias: true, alpha: true }}>
    <ambientLight intensity={0.5} />
    <spotLight position={[3, 5, 4]} intensity={90} angle={0.5} penumbra={1} color="#ffe0a8" />
    <pointLight position={[-4, -1, 2]} intensity={14} color="#c4a472" />
    <Environment resolution={128} frames={1}>
      <Lightformer form="rect" intensity={2.4} color="#ffd9a0" position={[0, 4, 3]} scale={[8, 4, 1]} />
      <Lightformer form="rect" intensity={1.2} color="#ffffff" position={[-5, 0, 1]} rotation-y={Math.PI / 2} scale={[4, 4, 1]} />
    </Environment>
    <PresentationControls global polar={[-0.4, 0.4]} azimuth={[-0.6, 0.6]} snap>
      <Float speed={1.6} rotationIntensity={0.25} floatIntensity={0.7}>
        <Chip />
      </Float>
    </PresentationControls>
  </Canvas>
)

export default ChipViewer
