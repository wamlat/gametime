import { useRef, useCallback, useEffect } from 'react'
import type { Dispatch } from 'react'
import type { Point } from '../types'
import { dist, checkSelfIntersection } from '../canvas/geometry'

type Action =
  | { type: 'START_DRAW'; point: Point }
  | { type: 'CONTINUE_DRAW'; point: Point }
  | { type: 'CLOSE_LASSO'; path: Point[] }
  | { type: 'END_DRAW' }
  | { type: 'CANCEL_DRAW' }

interface ViewportTransform {
  scale: number
  tx: number
  ty: number
}

function domToLogical(
  clientX: number,
  clientY: number,
  canvas: HTMLCanvasElement,
  vp: ViewportTransform
): Point {
  const rect = canvas.getBoundingClientRect()
  const dpr = window.devicePixelRatio || 1
  const canvasPxX = (clientX - rect.left) * dpr
  const canvasPxY = (clientY - rect.top) * dpr

  return {
    x: (canvasPxX - vp.tx) / vp.scale,
    y: (canvasPxY - vp.ty) / vp.scale,
  }
}

function getClientPoint(
  e:
    | React.MouseEvent<HTMLCanvasElement>
    | React.TouchEvent<HTMLCanvasElement>
    | MouseEvent
    | TouchEvent
) {
  if ('touches' in e) {
    const touch = e.touches[0] ?? e.changedTouches[0]
    if (!touch) return null
    return { clientX: touch.clientX, clientY: touch.clientY }
  }

  return { clientX: e.clientX, clientY: e.clientY }
}

export function useLasso(
  dispatch: Dispatch<Action>,
  getViewport: () => ViewportTransform
) {
  const isDrawing = useRef(false)
  const pathRef = useRef<Point[]>([])
  const canvasRef = useRef<HTMLCanvasElement | null>(null)

  const finishDraw = useCallback(() => {
    if (!isDrawing.current) return

    isDrawing.current = false
    pathRef.current = []
    canvasRef.current = null
    dispatch({ type: 'END_DRAW' })
  }, [dispatch])

  const appendPoint = useCallback(
    (clientX: number, clientY: number) => {
      const canvas = canvasRef.current
      if (!canvas) return

      const pt = domToLogical(clientX, clientY, canvas, getViewport())
      const last = pathRef.current[pathRef.current.length - 1]
      if (!last || dist(pt, last) < 3) return

      const check = checkSelfIntersection(pathRef.current, pt)
      if (check.intersects) {
        isDrawing.current = false
        pathRef.current = check.trimmedPath
        canvasRef.current = null
        dispatch({ type: 'CLOSE_LASSO', path: check.trimmedPath })
        return
      }

      pathRef.current = [...pathRef.current, pt]
      dispatch({ type: 'CONTINUE_DRAW', point: pt })
    },
    [dispatch, getViewport]
  )

  const startDraw = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
      e.preventDefault()

      const point = getClientPoint(e)
      if (!point) return

      const canvas = e.currentTarget
      const pt = domToLogical(point.clientX, point.clientY, canvas, getViewport())

      canvasRef.current = canvas
      isDrawing.current = true
      pathRef.current = [pt]
      dispatch({ type: 'START_DRAW', point: pt })
    },
    [dispatch, getViewport]
  )

  const continueDraw = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
      if (!isDrawing.current) return

      e.preventDefault()
      canvasRef.current = e.currentTarget

      const point = getClientPoint(e)
      if (!point) return

      appendPoint(point.clientX, point.clientY)
    },
    [appendPoint]
  )

  const endDraw = useCallback(() => {
    finishDraw()
  }, [finishDraw])

  const cancelDraw = useCallback(() => {
    isDrawing.current = false
    pathRef.current = []
    canvasRef.current = null
    dispatch({ type: 'CANCEL_DRAW' })
  }, [dispatch])

  useEffect(() => {
    function handleMouseMove(e: MouseEvent) {
      if (!isDrawing.current) return
      appendPoint(e.clientX, e.clientY)
    }

    function handleTouchMove(e: TouchEvent) {
      if (!isDrawing.current) return

      const point = getClientPoint(e)
      if (!point) return

      e.preventDefault()
      appendPoint(point.clientX, point.clientY)
    }

    function handlePointerRelease() {
      finishDraw()
    }

    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('mouseup', handlePointerRelease)
    window.addEventListener('touchmove', handleTouchMove, { passive: false })
    window.addEventListener('touchend', handlePointerRelease)
    window.addEventListener('touchcancel', handlePointerRelease)

    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseup', handlePointerRelease)
      window.removeEventListener('touchmove', handleTouchMove)
      window.removeEventListener('touchend', handlePointerRelease)
      window.removeEventListener('touchcancel', handlePointerRelease)
    }
  }, [appendPoint, finishDraw])

  return { startDraw, continueDraw, endDraw, cancelDraw }
}
