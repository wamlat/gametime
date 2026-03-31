import type { Circle, Point } from '../types'
import { CANVAS_SIZE } from '../constants'

export class PieMask {
  private offscreen: OffscreenCanvas | HTMLCanvasElement
  private ctx: OffscreenCanvasRenderingContext2D | CanvasRenderingContext2D
  private cachedImageData: ImageData | null = null
  private dirty = true

  constructor(initialCircle: Circle) {
    if (typeof OffscreenCanvas !== 'undefined') {
      this.offscreen = new OffscreenCanvas(CANVAS_SIZE, CANVAS_SIZE)
    } else {
      this.offscreen = document.createElement('canvas')
      ;(this.offscreen as HTMLCanvasElement).width = CANVAS_SIZE
      ;(this.offscreen as HTMLCanvasElement).height = CANVAS_SIZE
    }
    this.ctx = this.offscreen.getContext('2d') as OffscreenCanvasRenderingContext2D | CanvasRenderingContext2D
    this.initCircle(initialCircle)
  }

  private initCircle(circle: Circle) {
    this.ctx.clearRect(0, 0, CANVAS_SIZE, CANVAS_SIZE)
    this.ctx.fillStyle = '#ffffff'
    this.ctx.beginPath()
    this.ctx.arc(circle.cx, circle.cy, circle.r, 0, Math.PI * 2)
    this.ctx.fill()
    this.dirty = true
  }

  eraseLasso(path: Point[]) {
    if (path.length < 3) return
    const prev = (this.ctx as CanvasRenderingContext2D).globalCompositeOperation
    this.ctx.globalCompositeOperation = 'destination-out'
    this.ctx.beginPath()
    this.ctx.moveTo(path[0].x, path[0].y)
    for (let i = 1; i < path.length; i++) {
      this.ctx.lineTo(path[i].x, path[i].y)
    }
    this.ctx.closePath()
    this.ctx.fillStyle = 'rgba(0,0,0,1)'
    this.ctx.fill()
    this.ctx.globalCompositeOperation = prev
    this.dirty = true
    this.cachedImageData = null
  }

  private getImageData(): ImageData {
    if (!this.cachedImageData || this.dirty) {
      this.cachedImageData = this.ctx.getImageData(0, 0, CANVAS_SIZE, CANVAS_SIZE)
      this.dirty = false
    }
    return this.cachedImageData
  }

  countRemainingPixels(): number {
    const data = this.getImageData().data
    let count = 0
    for (let i = 3; i < data.length; i += 4) {
      if (data[i] > 128) count++
    }
    return count
  }

  getRemainingPoints(step = 4): Point[] {
    const data = this.getImageData().data
    const points: Point[] = []
    for (let y = 0; y < CANVAS_SIZE; y += step) {
      for (let x = 0; x < CANVAS_SIZE; x += step) {
        const i = (y * CANVAS_SIZE + x) * 4 + 3
        if (data[i] > 128) points.push({ x, y })
      }
    }
    return points
  }

  getCanvas(): OffscreenCanvas | HTMLCanvasElement {
    return this.offscreen
  }

  reset(circle: Circle) {
    this.initCircle(circle)
    this.cachedImageData = null
  }
}
