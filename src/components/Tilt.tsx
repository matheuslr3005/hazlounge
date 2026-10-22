import { motion, useMotionTemplate, useMotionValue, useSpring, useTransform } from 'framer-motion'
import type { CSSProperties, PointerEvent, ReactNode } from 'react'

type TiltProps = {
  children: ReactNode
  className?: string
  style?: CSSProperties
  /** max rotation in degrees */
  max?: number
  glare?: boolean
}

/** Pointer-driven 3D tilt with an optional specular glare. Disabled on touch (no hover). */
export const Tilt = ({ children, max = 9, glare = true, className = '', style }: TiltProps) => {
  const x = useMotionValue(0.5)
  const y = useMotionValue(0.5)
  const springX = useSpring(x, { stiffness: 180, damping: 18 })
  const springY = useSpring(y, { stiffness: 180, damping: 18 })
  const rotateY = useTransform(springX, [0, 1], [-max, max])
  const rotateX = useTransform(springY, [0, 1], [max, -max])
  const glareX = useTransform(springX, [0, 1], [0, 100])
  const glareY = useTransform(springY, [0, 1], [0, 100])
  const background = useMotionTemplate`radial-gradient(circle at ${glareX}% ${glareY}%, rgba(255,235,180,0.22), transparent 55%)`

  const onMove = (event: PointerEvent<HTMLDivElement>) => {
    if (event.pointerType === 'touch') return
    const rect = event.currentTarget.getBoundingClientRect()
    x.set((event.clientX - rect.left) / rect.width)
    y.set((event.clientY - rect.top) / rect.height)
  }

  const reset = () => {
    x.set(0.5)
    y.set(0.5)
  }

  return (
    <div className="tilt-scene" style={{ perspective: 1000 }}>
      <motion.div
        className={`tilt ${className}`}
        style={{ rotateX, rotateY, transformStyle: 'preserve-3d', ...style }}
        onPointerMove={onMove}
        onPointerLeave={reset}
      >
        {children}
        {glare && <motion.span className="tilt__glare" style={{ background }} aria-hidden />}
      </motion.div>
    </div>
  )
}
