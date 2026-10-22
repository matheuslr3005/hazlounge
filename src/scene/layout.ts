/** Half the straight section of the stadium-shaped table */
export const TABLE_L = 2.6
/** Felt half-depth (inner radius of the stadium) */
export const FELT_R = 1.8
export const RAIL_WIDTH = 0.5
export const OUTER_R = FELT_R + RAIL_WIDTH
export const FLOOR_Y = -3.4

export const SEAT_COUNT = 8

export type Seat = {
  index: number
  x: number
  z: number
  /** rotation around Y so cards read upright from the player's side */
  yaw: number
  /** unit vector from the table center toward the seat */
  outX: number
  outZ: number
}

const SEAT_RX = 3.9
const SEAT_RZ = 1.269
/** Angle (deg, 0 = front) of the diagonal seats. Chosen so no dealt card, chip stack or prop overlaps another */
const DIAGONAL = 39.229
const SEAT_ANGLES = [0, DIAGONAL, 90, 180 - DIAGONAL, 180, 180 + DIAGONAL, 270, 360 - DIAGONAL]

export const seats: Seat[] = Array.from({ length: SEAT_COUNT }, (_, index) => {
  const theta = (SEAT_ANGLES[index] * Math.PI) / 180
  const x = Math.sin(theta) * SEAT_RX
  const z = Math.cos(theta) * SEAT_RZ
  const length = Math.hypot(x / SEAT_RX, z / SEAT_RZ) || 1
  return { index, x, z, yaw: Math.atan2(x, z * 2.4), outX: x / SEAT_RX / length, outZ: z / SEAT_RZ / length }
})

/** Seat 0 is you (front), seat 4 is the dealer (back) */
export const HERO_SEAT = 0
export const DEALER_SEAT = 4

/** Dealing order: clockwise from the dealer's left, you receive last */
export const DEAL_ORDER = [5, 6, 7, 0, 1, 2, 3]

export const DECK_POS: [number, number, number] = [0.55, 0.05, -1.35]
export const FLOP_Z = 0.08

/*
 * Table layout. These numbers come from an overlap check over every card, chip stack and prop
 * (min clearance ~0.07): change one and re-check, or things will end up inside each other.
 */
export const HOLE_INSET = 0.864
export const HOLE_LATERAL = 0.332
export const HOLE_FAN = 0.046
/** chip stacks beside the hole cards: [distance toward the seat, sideways offset] */
export const CHIPS_A = { base: 0.741, side: 1.245 }
export const CHIPS_B = { base: 0.739, side: 1.015 }
export const BURN = { x: -0.16, z: -0.952, yaw: -0.047 }
export const BUTTON = { x: -0.428, z: -1.624 }
export const POT_STACKS: [number, number][] = [
  [-0.758, -0.721],
  [-1.46, -0.575],
]
/** top of the deck, where dealt cards start */
export const DECK_TOP_Y = 0.36
