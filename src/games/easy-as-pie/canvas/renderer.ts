import type { Point, GamePhase } from '../types'
import { PIE_BG, LASSO_COLOR, LASSO_FILL_COLOR } from '../constants'
import type { PieShape } from './pieShape'

/**
 * Render the background + pie shape to the main pie canvas.
 * transform maps logical 600×600 coords → canvas pixels.
 */
export function renderPie(
  ctx: CanvasRenderingContext2D,
  shape: PieShape,
  transform: DOMMatrix
) {
  const w = ctx.canvas.width
  const h = ctx.canvas.height

  // 1. Fill background
  ctx.save()
  ctx.setTransform(new DOMMatrix())
  ctx.fillStyle = PIE_BG
  ctx.fillRect(0, 0, w, h)
  ctx.restore()

  // 2. Draw faint guide circle — shows the full pie boundary for the current round
  const c = shape.getCircle()
  ctx.save()
  ctx.setTransform(transform)
  ctx.beginPath()
  ctx.arc(c.cx, c.cy, c.r, 0, Math.PI * 2)
  ctx.fillStyle = 'rgba(255,255,255,0.035)'
  ctx.fill()
  ctx.strokeStyle = 'rgba(255,255,255,0.10)'
  ctx.lineWidth = 1.5 / transform.a  // 1.5 logical pixels regardless of zoom
  ctx.setLineDash([])
  ctx.stroke()
  ctx.restore()

  // 3. Draw remaining pie (paths, crisp at any scale)
  shape.renderShape(ctx, transform)
}

/**
 * Render the lasso overlay to the lasso canvas.
 */
export function renderLasso(
  ctx: CanvasRenderingContext2D,
  path: Point[],
  phase: GamePhase,
  transform: DOMMatrix,
  timestamp: number
) {
  const w = ctx.canvas.width
  const h = ctx.canvas.height
  ctx.clearRect(0, 0, w, h)

  if (path.length < 2) return

  const isConfirming = phase === 'confirming'

  ctx.save()
  ctx.setTransform(transform)

  ctx.beginPath()
  ctx.moveTo(path[0].x, path[0].y)
  for (let i = 1; i < path.length; i++) ctx.lineTo(path[i].x, path[i].y)
  if (isConfirming) ctx.closePath()

  // Interior fill
  ctx.fillStyle = LASSO_FILL_COLOR
  ctx.fill('nonzero')

  // Marching ants stroke — keep physical stroke width constant
  const logicalLineWidth = 2 / transform.a
  ctx.strokeStyle = LASSO_COLOR
  ctx.lineWidth = logicalLineWidth
  ctx.lineCap = 'round'
  ctx.lineJoin = 'round'
  ctx.setLineDash([8 / transform.a, 5 / transform.a])
  ctx.lineDashOffset = -(timestamp / 40) % (13 / transform.a)
  ctx.stroke()

  // Faint closing-line hint
  if (phase === 'drawing' && path.length > 6) {
    ctx.beginPath()
    ctx.moveTo(path[path.length - 1].x, path[path.length - 1].y)
    ctx.lineTo(path[0].x, path[0].y)
    ctx.strokeStyle = 'rgba(255,255,255,0.18)'
    ctx.lineWidth = logicalLineWidth
    ctx.setLineDash([4 / transform.a, 7 / transform.a])
    ctx.stroke()
  }

  ctx.restore()
}
