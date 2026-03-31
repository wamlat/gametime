export interface Point {
  x: number
  y: number
}

export type Difficulty = 'standard' | 'hard'

export interface Puzzle {
  id: string
  difficulty: Difficulty
  vertexCount: number
  vertices: Point[]
  edges: Array<[number, number]>
}

const BOARD_SIZE = 520

const DIFFICULTY_CONFIG: Record<
  Difficulty,
  {
    vertexCount: number
    padding: number
    minVertexDistance: number
    requiredCrossings: number
    attempts: number
  }
> = {
  standard: {
    vertexCount: 5,
    padding: 72,
    minVertexDistance: 86,
    requiredCrossings: 2,
    attempts: 400,
  },
  hard: {
    vertexCount: 10,
    padding: 54,
    minVertexDistance: 46,
    requiredCrossings: 6,
    attempts: 900,
  },
}

function randomBetween(min: number, max: number) {
  return min + Math.random() * (max - min)
}

function dist(a: Point, b: Point) {
  const dx = a.x - b.x
  const dy = a.y - b.y
  return Math.sqrt(dx * dx + dy * dy)
}

function ccw(a: Point, b: Point, c: Point) {
  return (b.x - a.x) * (c.y - a.y) - (b.y - a.y) * (c.x - a.x)
}

function segmentsIntersect(a: Point, b: Point, c: Point, d: Point) {
  const ab1 = ccw(a, b, c)
  const ab2 = ccw(a, b, d)
  const cd1 = ccw(c, d, a)
  const cd2 = ccw(c, d, b)

  return ab1 * ab2 < 0 && cd1 * cd2 < 0
}

function edgeKey(a: number, b: number) {
  return a < b ? `${a}-${b}` : `${b}-${a}`
}

function generatePlanarEdges(vertexCount: number) {
  const edges: Array<[number, number]> = []

  for (let i = 0; i < vertexCount; i++) {
    edges.push([i, (i + 1) % vertexCount])
  }

  for (let i = 2; i < vertexCount - 1; i++) {
    edges.push([0, i])
  }

  return edges
}

function randomVertexLayout(vertexCount: number, padding: number, minVertexDistance: number) {
  const vertices: Point[] = []

  while (vertices.length < vertexCount) {
    const candidate = {
      x: randomBetween(padding, BOARD_SIZE - padding),
      y: randomBetween(padding, BOARD_SIZE - padding),
    }

    if (vertices.every((vertex) => dist(vertex, candidate) >= minVertexDistance)) {
      vertices.push(candidate)
    }
  }

  return vertices
}

export function getCrossingEdgeKeys(vertices: Point[], edges: Array<[number, number]>) {
  const crossings = new Set<string>()

  for (let i = 0; i < edges.length; i++) {
    const [a1, a2] = edges[i]

    for (let j = i + 1; j < edges.length; j++) {
      const [b1, b2] = edges[j]

      if (a1 === b1 || a1 === b2 || a2 === b1 || a2 === b2) continue

      if (segmentsIntersect(vertices[a1], vertices[a2], vertices[b1], vertices[b2])) {
        crossings.add(edgeKey(a1, a2))
        crossings.add(edgeKey(b1, b2))
      }
    }
  }

  return crossings
}

export function countCrossings(vertices: Point[], edges: Array<[number, number]>) {
  let total = 0

  for (let i = 0; i < edges.length; i++) {
    const [a1, a2] = edges[i]

    for (let j = i + 1; j < edges.length; j++) {
      const [b1, b2] = edges[j]

      if (a1 === b1 || a1 === b2 || a2 === b1 || a2 === b2) continue

      if (segmentsIntersect(vertices[a1], vertices[a2], vertices[b1], vertices[b2])) {
        total += 1
      }
    }
  }

  return total
}

export function clampVertex(point: Point, difficulty: Difficulty) {
  const { padding } = DIFFICULTY_CONFIG[difficulty]

  return {
    x: Math.max(padding - 18, Math.min(BOARD_SIZE - padding + 18, point.x)),
    y: Math.max(padding - 18, Math.min(BOARD_SIZE - padding + 18, point.y)),
  }
}

export function generatePuzzle(difficulty: Difficulty = 'standard'): Puzzle {
  const config = DIFFICULTY_CONFIG[difficulty]
  const edges = generatePlanarEdges(config.vertexCount)

  for (let attempt = 0; attempt < config.attempts; attempt++) {
    const vertices = randomVertexLayout(
      config.vertexCount,
      config.padding,
      config.minVertexDistance
    )

    if (countCrossings(vertices, edges) >= config.requiredCrossings) {
      return {
        id: `${difficulty}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        difficulty,
        vertexCount: config.vertexCount,
        vertices,
        edges,
      }
    }
  }

  const fallbackVertices =
    difficulty === 'hard'
      ? [
          { x: 86, y: 92 },
          { x: 234, y: 74 },
          { x: 408, y: 88 },
          { x: 160, y: 172 },
          { x: 336, y: 176 },
          { x: 92, y: 306 },
          { x: 248, y: 258 },
          { x: 418, y: 284 },
          { x: 172, y: 430 },
          { x: 356, y: 426 },
        ]
      : [
          { x: 94, y: 92 },
          { x: 416, y: 124 },
          { x: 168, y: 422 },
          { x: 358, y: 430 },
          { x: 260, y: 242 },
        ]

  return {
    id: `${difficulty}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    difficulty,
    vertexCount: config.vertexCount,
    vertices: fallbackVertices,
    edges,
  }
}
