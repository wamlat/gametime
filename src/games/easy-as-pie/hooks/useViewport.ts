import { useState, useEffect, useRef, useCallback } from 'react'
import type { Circle } from '../types'
import { INITIAL_VIEWPORT, ZOOM_DURATION_MS } from '../constants'

export interface ViewportTransform {
  /** logical scale: canvas pixels per logical unit */
  scale: number
  tx: number
  ty: number
  domMatrix: DOMMatrix
}

function easeOutExpo(t: number): number {
  return t === 1 ? 1 : 1 - Math.pow(2, -10 * t)
}

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t
}

/**
 * Compute the canvas DOMMatrix that maps logical 600×600 coords to canvas pixels,
 * showing the given circle centered and filling the canvas.
 * canvasPxSize: the canvas pixel width/height (square canvas, so same for both).
 */
export function circleToMatrix(circle: Circle, canvasPxSize: number): DOMMatrix {
  const scale = (canvasPxSize / 2) / circle.r
  const tx = canvasPxSize / 2 - circle.cx * scale
  const ty = canvasPxSize / 2 - circle.cy * scale
  const m = new DOMMatrix()
  m.a = scale; m.b = 0; m.c = 0; m.d = scale; m.e = tx; m.f = ty
  return m
}

export function useViewport(
  targetCircle: Circle,
  canvasPxSize: number,
  onComplete?: () => void
) {
  const [current, setCurrent] = useState<Circle>(INITIAL_VIEWPORT)
  const fromRef = useRef<Circle>(INITIAL_VIEWPORT)
  const targetRef = useRef<Circle>(targetCircle)
  const rafRef = useRef<number>(0)
  const startTimeRef = useRef<number>(0)

  useEffect(() => {
    if (
      targetRef.current.cx === targetCircle.cx &&
      targetRef.current.cy === targetCircle.cy &&
      targetRef.current.r === targetCircle.r
    ) return

    targetRef.current = targetCircle
    fromRef.current = current
    startTimeRef.current = 0
    cancelAnimationFrame(rafRef.current)

    function animate(ts: number) {
      if (startTimeRef.current === 0) startTimeRef.current = ts
      const elapsed = ts - startTimeRef.current
      const progress = Math.min(elapsed / ZOOM_DURATION_MS, 1)
      const eased = easeOutExpo(progress)
      const interpolated: Circle = {
        cx: lerp(fromRef.current.cx, targetRef.current.cx, eased),
        cy: lerp(fromRef.current.cy, targetRef.current.cy, eased),
        r: lerp(fromRef.current.r, targetRef.current.r, eased),
      }
      setCurrent(interpolated)
      if (progress < 1) {
        rafRef.current = requestAnimationFrame(animate)
      } else {
        setCurrent(targetRef.current)
        onComplete?.()
      }
    }

    rafRef.current = requestAnimationFrame(animate)
    return () => cancelAnimationFrame(rafRef.current)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [targetCircle.cx, targetCircle.cy, targetCircle.r])

  const matrix = circleToMatrix(current, canvasPxSize)
  const transform: ViewportTransform = {
    scale: matrix.a,
    tx: matrix.e,
    ty: matrix.f,
    domMatrix: matrix,
  }

  const getViewport = useCallback((): ViewportTransform => {
    return { scale: matrix.a, tx: matrix.e, ty: matrix.f, domMatrix: matrix }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [current.cx, current.cy, current.r, canvasPxSize])

  return { transform, getViewport }
}
