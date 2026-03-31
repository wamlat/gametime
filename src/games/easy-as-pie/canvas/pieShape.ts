import type { Circle, Point } from '../types'
import { CANVAS_SIZE, PIE_COLOR } from '../constants'

const COUNT_SIZE = 400  // small canvas used only for pixel-counting (proportion calc)

/**
 * Stores the pie as a logical shape: original circle minus all eaten polygon paths.
 * Rendering is path-based (crisp at any zoom).
 * Pixel counting uses a small off-screen canvas only for proportion math.
 */
export class PieShape {
  private circle: Circle
  private eatenPaths: Point[][] = []
  private countCanvas: OffscreenCanvas | HTMLCanvasElement
  private countCtx: OffscreenCanvasRenderingContext2D | CanvasRenderingContext2D
  private countDirty = true
  private cachedRemainingCount = 0

  constructor(circle: Circle) {
    this.circle = circle
    if (typeof OffscreenCanvas !== 'undefined') {
      this.countCanvas = new OffscreenCanvas(COUNT_SIZE, COUNT_SIZE)
    } else {
      const c = document.createElement('canvas')
      c.width = COUNT_SIZE
      c.height = COUNT_SIZE
      this.countCanvas = c
    }
    this.countCtx = this.countCanvas.getContext('2d') as any
  }

  /**
   * Render the remaining pie shape to any canvas context.
   * Uses arc() for the circle and destination-out for eaten regions.
   * The given `transform` maps from the logical 600×600 space to canvas pixels.
   */
  renderShape(
    ctx: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D,
    transform?: DOMMatrix
  ) {
    const w = (ctx.canvas as HTMLCanvasElement).width
    const h = (ctx.canvas as HTMLCanvasElement).height

    ctx.clearRect(0, 0, w, h)

    ctx.save()
    if (transform) ctx.setTransform(transform)

    // Draw the base circle in orange
    ctx.globalCompositeOperation = 'source-over'
    ctx.fillStyle = PIE_COLOR
    ctx.beginPath()
    ctx.arc(this.circle.cx, this.circle.cy, this.circle.r, 0, Math.PI * 2)
    ctx.fill()

    // Highlight gradient (source-atop stays within circle)
    const grad = ctx.createRadialGradient(
      this.circle.cx - this.circle.r * 0.15,
      this.circle.cy - this.circle.r * 0.15,
      this.circle.r * 0.08,
      this.circle.cx,
      this.circle.cy,
      this.circle.r
    )
    grad.addColorStop(0, 'rgba(255,215,130,0.45)')
    grad.addColorStop(0.45, 'rgba(255,160,50,0.06)')
    grad.addColorStop(1, 'rgba(0,0,0,0.32)')
    ctx.globalCompositeOperation = 'source-atop'
    ctx.fillStyle = grad
    ctx.fillRect(
      this.circle.cx - this.circle.r - 2,
      this.circle.cy - this.circle.r - 2,
      this.circle.r * 2 + 4,
      this.circle.r * 2 + 4
    )

    // Erase eaten regions
    if (this.eatenPaths.length > 0) {
      ctx.globalCompositeOperation = 'destination-out'
      ctx.fillStyle = 'rgba(0,0,0,1)'
      for (const path of this.eatenPaths) {
        if (path.length < 3) continue
        ctx.beginPath()
        ctx.moveTo(path[0].x, path[0].y)
        for (let i = 1; i < path.length; i++) ctx.lineTo(path[i].x, path[i].y)
        ctx.closePath()
        ctx.fill()
      }
    }

    ctx.globalCompositeOperation = 'source-over'
    ctx.restore()
  }

  /** Add a lasso path as an eaten region. */
  addEaten(path: Point[]) {
    this.eatenPaths.push(path)
    this.countDirty = true
    this.cachedRemainingCount = 0
  }

  /** Count remaining pie pixels (in COUNT_SIZE coords) for proportion math. */
  countRemainingPixels(): number {
    if (!this.countDirty) return this.cachedRemainingCount
    this._refreshCountCanvas()
    return this.cachedRemainingCount
  }

  private _refreshCountCanvas() {
    const scale = COUNT_SIZE / CANVAS_SIZE
    const tc = this.countCtx

    // Build a unit-transform for the count canvas
    const m = new DOMMatrix()
    m.a = scale; m.b = 0; m.c = 0; m.d = scale; m.e = 0; m.f = 0

    this.renderShape(tc as any, m)

    const data = tc.getImageData(0, 0, COUNT_SIZE, COUNT_SIZE).data
    let count = 0
    for (let i = 3; i < data.length; i += 4) {
      if (data[i] > 128) count++
    }
    this.cachedRemainingCount = count
    this.countDirty = false
  }

  /** Sample remaining pie pixel positions in original 600×600 coords (for MEC). */
  getRemainingPoints(step = 3): Point[] {
    if (this.countDirty) this._refreshCountCanvas()
    const data = this.countCtx.getImageData(0, 0, COUNT_SIZE, COUNT_SIZE).data
    const invScale = CANVAS_SIZE / COUNT_SIZE
    const points: Point[] = []
    for (let y = 0; y < COUNT_SIZE; y += step) {
      for (let x = 0; x < COUNT_SIZE; x += step) {
        if (data[(y * COUNT_SIZE + x) * 4 + 3] > 128) {
          points.push({ x: x * invScale, y: y * invScale })
        }
      }
    }
    return points
  }

  reset(circle: Circle) {
    this.circle = circle
    this.eatenPaths = []
    this.countDirty = true
    this.cachedRemainingCount = 0
  }

  getCircle(): Circle {
    return this.circle
  }
}
