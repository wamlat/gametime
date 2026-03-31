import { useRef, useCallback } from 'react'
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
  // DOM coords → canvas pixel coords
  const canvasPxX = (clientX - rect.left) * dpr
  const canvasPxY = (clientY - rect.top) * dpr
  // Canvas pixel coords → logical 600×600 coords (invert viewport transform)
  return {
    x: (canvasPxX - vp.tx) / vp.scale,
    y: (canvasPxY - vp.ty) / vp.scale,
  }
}

export function useLasso(
  dispatch: Dispatch<Action>,
  getViewport: () => ViewportTransform
) {
  const isDrawing = useRef(false)
  const pathRef = useRef<Point[]>([])

  const startDraw = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
      e.preventDefault()
      const canvas = e.currentTarget
      const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX
      const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY
      const pt = domToLogical(clientX, clientY, canvas, getViewport())
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
      const canvas = e.currentTarget
      const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX
      const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY
      const pt = domToLogical(clientX, clientY, canvas, getViewport())

      const last = pathRef.current[pathRef.current.length - 1]
      if (dist(pt, last) < 3) return

      // Check for self-intersection — if found, auto-close at intersection point
      const check = checkSelfIntersection(pathRef.current, pt)
      if (check.intersects) {
        isDrawing.current = false
        pathRef.current = check.trimmedPath
        dispatch({ type: 'CLOSE_LASSO', path: check.trimmedPath })
        return
      }

      pathRef.current = [...pathRef.current, pt]
      dispatch({ type: 'CONTINUE_DRAW', point: pt })
    },
    [dispatch, getViewport]
  )

  const endDraw = useCallback(() => {
    if (!isDrawing.current) return
    isDrawing.current = false
    dispatch({ type: 'END_DRAW' })
  }, [dispatch])

  const cancelDraw = useCallback(() => {
    isDrawing.current = false
    pathRef.current = []
    dispatch({ type: 'CANCEL_DRAW' })
  }, [dispatch])

  return { startDraw, continueDraw, endDraw, cancelDraw }
}
