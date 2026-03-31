import type { Point } from '../types'

export function dist(a: Point, b: Point): number {
  const dx = a.x - b.x
  const dy = a.y - b.y
  return Math.sqrt(dx * dx + dy * dy)
}

/**
 * Returns the intersection point of segments (p1-p2) and (p3-p4), or null.
 */
function segmentIntersectionPoint(
  p1: Point, p2: Point,
  p3: Point, p4: Point
): Point | null {
  const rx = p2.x - p1.x, ry = p2.y - p1.y
  const sx = p4.x - p3.x, sy = p4.y - p3.y
  const denom = rx * sy - ry * sx
  if (Math.abs(denom) < 1e-10) return null // parallel

  const t = ((p3.x - p1.x) * sy - (p3.y - p1.y) * sx) / denom
  const u = ((p3.x - p1.x) * ry - (p3.y - p1.y) * rx) / denom

  if (t >= 0 && t <= 1 && u >= 0 && u <= 1) {
    return { x: p1.x + t * rx, y: p1.y + t * ry }
  }
  return null
}

/**
 * Check if the new segment (path[-1] → newPoint) intersects any existing
 * segment. If so, return the trimmed path ending at the intersection point
 * (ready to auto-close as a valid simple polygon).
 * We skip the immediately adjacent segment (shares the last point).
 */
export function checkSelfIntersection(
  path: Point[],
  newPoint: Point
): { intersects: false } | { intersects: true; trimmedPath: Point[] } {
  if (path.length < 3) return { intersects: false }
  const last = path[path.length - 1]

  for (let i = 0; i < path.length - 2; i++) {
    const pt = segmentIntersectionPoint(last, newPoint, path[i], path[i + 1])
    if (pt !== null) {
      // Trim: keep path[0..i] and append the intersection point
      const trimmed = [...path.slice(0, i + 1), pt]
      if (trimmed.length >= 3) {
        return { intersects: true, trimmedPath: trimmed }
      }
    }
  }
  return { intersects: false }
}

// Ramer-Douglas-Peucker path simplification
export function simplifyPath(points: Point[], epsilon: number): Point[] {
  if (points.length <= 2) return points

  let maxDist = 0
  let maxIdx = 0

  const start = points[0]
  const end = points[points.length - 1]
  const lineLen = dist(start, end)

  for (let i = 1; i < points.length - 1; i++) {
    const p = points[i]
    let d: number
    if (lineLen === 0) {
      d = dist(p, start)
    } else {
      const t =
        ((p.x - start.x) * (end.x - start.x) + (p.y - start.y) * (end.y - start.y)) /
        (lineLen * lineLen)
      const projX = start.x + t * (end.x - start.x)
      const projY = start.y + t * (end.y - start.y)
      d = dist(p, { x: projX, y: projY })
    }
    if (d > maxDist) {
      maxDist = d
      maxIdx = i
    }
  }

  if (maxDist > epsilon) {
    const left = simplifyPath(points.slice(0, maxIdx + 1), epsilon)
    const right = simplifyPath(points.slice(maxIdx), epsilon)
    return [...left.slice(0, -1), ...right]
  }

  return [start, end]
}
