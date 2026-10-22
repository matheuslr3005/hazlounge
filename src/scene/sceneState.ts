/** Shared between the DOM and the render loops, kept outside React so scroll never re-renders */
export const heroState = {
  /** 0 → 1 across the sticky hero section */
  target: 0,
  progress: 0,
}

export const clamp01 = (value: number) => Math.min(1, Math.max(0, value))

export const smooth01 = (value: number) => {
  const x = clamp01(value)
  return x * x * (3 - 2 * x)
}

export const easeOutCubic = (value: number) => 1 - Math.pow(1 - clamp01(value), 3)
export const easeOutQuart = (value: number) => 1 - Math.pow(1 - clamp01(value), 4)

export const easeInOutCubic = (value: number) => {
  const x = clamp01(value)
  return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2
}

export const lerp = (a: number, b: number, t: number) => a + (b - a) * t

/** 0 → 1 between a and b */
export const range01 = (value: number, a: number, b: number) => clamp01((value - a) / (b - a))
