export const ROUND_COUNT = 5
export const FLASH_DURATION_MS = 1000
export const CANVAS_SIZE = 400
export const MIN_OBJECTS = 4
export const MAX_OBJECTS = 30
export const MIN_SHAPE_SIZE = 16
export const MAX_SHAPE_SIZE = 36

export type ShapeKind = 'circle' | 'square' | 'triangle' | 'diamond'

export interface Shape {
  kind: ShapeKind
  x: number
  y: number
  size: number
  color: string
  rotation: number
}

export interface CounterRound {
  shapes: Shape[]
  count: number
}

const SHAPE_KINDS: ShapeKind[] = ['circle', 'square', 'triangle', 'diamond']

const COLORS = [
  '#E8832A',
  '#E85D5D',
  '#5DB8E8',
  '#5DE88D',
  '#E8D45D',
  '#B85DE8',
  '#E85DAE',
  '#5DE8D4',
]

function randomInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

function randomFloat(min: number, max: number) {
  return Math.random() * (max - min) + min
}

function randomPick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

function shapesOverlap(a: Shape, b: Shape): boolean {
  const dx = a.x - b.x
  const dy = a.y - b.y
  const minDist = (a.size + b.size) * 0.5
  return dx * dx + dy * dy < minDist * minDist
}

function generateShapes(count: number): Shape[] {
  const shapes: Shape[] = []
  const padding = MAX_SHAPE_SIZE
  let attempts = 0

  while (shapes.length < count && attempts < count * 50) {
    attempts++
    const shape: Shape = {
      kind: randomPick(SHAPE_KINDS),
      x: randomFloat(padding, CANVAS_SIZE - padding),
      y: randomFloat(padding, CANVAS_SIZE - padding),
      size: randomInt(MIN_SHAPE_SIZE, MAX_SHAPE_SIZE),
      color: randomPick(COLORS),
      rotation: randomFloat(0, Math.PI * 2),
    }

    if (!shapes.some((s) => shapesOverlap(s, shape))) {
      shapes.push(shape)
    }
  }

  return shapes
}

export function generateRounds(): CounterRound[] {
  return Array.from({ length: ROUND_COUNT }, (_, i) => {
    const minForRound = MIN_OBJECTS + Math.floor(i * 4)
    const maxForRound = Math.min(MAX_OBJECTS, minForRound + 6)
    const count = randomInt(minForRound, maxForRound)
    return {
      shapes: generateShapes(count),
      count,
    }
  })
}

export function scoreGuess(target: number, guess: number): number {
  return Math.abs(target - guess)
}

export function scoreLabel(error: number): string {
  if (error === 0) return 'perfect'
  if (error === 1) return 'so close'
  if (error <= 3) return 'decent eye'
  if (error <= 6) return 'not great'
  return 'way off'
}
