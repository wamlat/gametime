export interface Point {
  x: number
  y: number
}

export interface RoundSpec {
  fishCenter: Point
  fishWidth: number
  fishHeight: number
  eyeRadius: number
  eyeOffsetX: number
}

export interface ShotOutcome {
  minDistance: number
  closestPoint: Point
  closestIndex: number
  score: number
  hit: boolean
  trajectory: Point[]
}

export const BOARD_WIDTH = 520
export const BOARD_HEIGHT = 520
export const WATERLINE_Y = 382
export const BOW_ORIGIN: Point = { x: 260, y: 404 }
export const ROUND_COUNT = 5
export const GRAVITY = 28
export const ANGLE_MIN = -165
export const ANGLE_MAX = -15
export const POWER_MIN = 88
export const POWER_MAX = 170

function randomBetween(min: number, max: number) {
  return min + Math.random() * (max - min)
}

export function fishEyeForRound(round: RoundSpec): Point {
  return {
    x: round.fishCenter.x + round.eyeOffsetX,
    y: round.fishCenter.y - 3,
  }
}

export function generateCandidateRound(): RoundSpec {
  const fishCenterX = randomBetween(118, 402)
  const width = randomBetween(112, 144)

  return {
    fishCenter: {
      x: fishCenterX,
      y: randomBetween(104, 150),
    },
    fishWidth: width,
    fishHeight: randomBetween(44, 58),
    eyeRadius: randomBetween(6, 8.5),
    eyeOffsetX: fishCenterX < BOW_ORIGIN.x ? randomBetween(-30, -18) : randomBetween(18, 30),
  }
}

export function velocityFromAim(angleDeg: number, power: number) {
  const angle = (angleDeg * Math.PI) / 180

  return {
    vx: Math.cos(angle) * power,
    vy: Math.sin(angle) * power,
  }
}

export function sampleTrajectory(angleDeg: number, power: number, steps = 90) {
  const { vx, vy } = velocityFromAim(angleDeg, power)
  const points: Point[] = []

  for (let i = 0; i <= steps; i++) {
    const t = i * 0.11
    const x = BOW_ORIGIN.x + vx * t
    const y = BOW_ORIGIN.y + vy * t + 0.5 * GRAVITY * t * t

    points.push({ x, y })

    if (x < -24 || x > BOARD_WIDTH + 24 || y < -24 || y > BOARD_HEIGHT + 24) {
      break
    }
  }

  return points
}

function minDistanceToEye(round: RoundSpec, trajectory: Point[]) {
  const eye = fishEyeForRound(round)
  let minDistance = Number.POSITIVE_INFINITY
  let closestPoint = trajectory[0] ?? BOW_ORIGIN
  let closestIndex = 0

  for (let index = 0; index < trajectory.length; index++) {
    const point = trajectory[index]
    const dx = point.x - eye.x
    const dy = point.y - eye.y
    const distance = Math.sqrt(dx * dx + dy * dy)

    if (distance < minDistance) {
      minDistance = distance
      closestPoint = point
      closestIndex = index
    }
  }

  return { minDistance, closestPoint, closestIndex }
}

export function evaluateShot(round: RoundSpec, angleDeg: number, power: number): ShotOutcome {
  const trajectory = sampleTrajectory(angleDeg, power, 130)
  const { minDistance, closestPoint, closestIndex } = minDistanceToEye(round, trajectory)
  const score = Math.max(0, Math.round(100 - minDistance * 3.25))

  return {
    minDistance,
    closestPoint,
    closestIndex,
    score,
    hit: minDistance <= round.eyeRadius + 5,
    trajectory: trajectory.slice(0, closestIndex + 1),
  }
}

function isRoundReachable(round: RoundSpec) {
  for (let angle = ANGLE_MIN; angle <= ANGLE_MAX; angle += 3) {
    for (let power = POWER_MIN; power <= POWER_MAX; power += 4) {
      const trajectory = sampleTrajectory(angle, power, 130)
      const { minDistance } = minDistanceToEye(round, trajectory)
      if (minDistance <= round.eyeRadius + 5) {
        return true
      }
    }
  }

  return false
}

export function generateRound(): RoundSpec {
  for (let attempt = 0; attempt < 500; attempt++) {
    const round = generateCandidateRound()
    if (isRoundReachable(round)) return round
  }

  return {
    fishCenter: { x: 326, y: 126 },
    fishWidth: 128,
    fishHeight: 52,
    eyeRadius: 7,
    eyeOffsetX: 24,
  }
}
