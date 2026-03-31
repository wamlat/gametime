import type { Circle, Point } from '../types'

function dist(a: Point, b: Point): number {
  const dx = a.x - b.x
  const dy = a.y - b.y
  return Math.sqrt(dx * dx + dy * dy)
}

function circleFrom1(p: Point): Circle {
  return { cx: p.x, cy: p.y, r: 0 }
}

function circleFrom2(p1: Point, p2: Point): Circle {
  const cx = (p1.x + p2.x) / 2
  const cy = (p1.y + p2.y) / 2
  return { cx, cy, r: dist(p1, p2) / 2 }
}

function circleFrom3(p1: Point, p2: Point, p3: Point): Circle {
  const ax = p2.x - p1.x, ay = p2.y - p1.y
  const bx = p3.x - p1.x, by = p3.y - p1.y
  const D = 2 * (ax * by - ay * bx)
  if (Math.abs(D) < 1e-10) return circleFrom2(p1, p3)
  const ux = (by * (ax * ax + ay * ay) - ay * (bx * bx + by * by)) / D
  const uy = (ax * (bx * bx + by * by) - bx * (ax * ax + ay * ay)) / D
  const cx = p1.x + ux
  const cy = p1.y + uy
  return { cx, cy, r: dist({ x: cx, y: cy }, p1) }
}

function inCircle(c: Circle, p: Point): boolean {
  return dist({ x: c.cx, y: c.cy }, p) <= c.r + 1e-10
}

// Welzl's algorithm (iterative with shuffled input)
export function minimumEnclosingCircle(points: Point[]): Circle {
  if (points.length === 0) return { cx: 300, cy: 300, r: 10 }
  if (points.length === 1) return circleFrom1(points[0])
  if (points.length === 2) return circleFrom2(points[0], points[1])

  // Shuffle for expected O(n) time
  const pts = [...points]
  for (let i = pts.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[pts[i], pts[j]] = [pts[j], pts[i]]
  }

  let circle = circleFrom2(pts[0], pts[1])

  for (let i = 2; i < pts.length; i++) {
    if (!inCircle(circle, pts[i])) {
      circle = circleFrom2(pts[0], pts[i])
      for (let j = 1; j < i; j++) {
        if (!inCircle(circle, pts[j])) {
          circle = circleFrom2(pts[j], pts[i])
          for (let k = 0; k < j; k++) {
            if (!inCircle(circle, pts[k])) {
              circle = circleFrom3(pts[i], pts[j], pts[k])
            }
          }
        }
      }
    }
  }

  return circle
}

export function mecOfPoints(points: Point[]): Circle {
  if (points.length === 0) return { cx: 300, cy: 300, r: 10 }
  const c = minimumEnclosingCircle(points)
  // Add padding and enforce minimum radius
  return { cx: c.cx, cy: c.cy, r: Math.max(c.r + 16, 10) }
}
