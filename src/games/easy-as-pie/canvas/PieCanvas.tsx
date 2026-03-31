import { useRef, useEffect, useCallback, useState } from 'react'
import type { Dispatch } from 'react'
import type { GameState } from '../types'
import { renderPie, renderLasso } from './renderer'
import { useLasso } from '../hooks/useLasso'
import { useViewport } from '../hooks/useViewport'
import type { PieShape } from './pieShape'

interface Props {
  gameState: GameState
  dispatch: Dispatch<any>
  shape: PieShape
  needsPieRedraw: boolean
  onPieDrawn: () => void
  onCanvasSizeChange: (pxSize: number) => void
}

export function PieCanvas({
  gameState,
  dispatch,
  shape,
  needsPieRedraw,
  onPieDrawn,
  onCanvasSizeChange,
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  const pieRef = useRef<HTMLCanvasElement>(null)
  const lassoRef = useRef<HTMLCanvasElement>(null)
  const rafRef = useRef<number>(0)
  const [canvasPxSize, setCanvasPxSize] = useState(600)

  const { transform, getViewport } = useViewport(
    gameState.viewport,
    canvasPxSize,
    useCallback(() => dispatch({ type: 'ZOOM_COMPLETE' }), [dispatch])
  )

  // Expose canvas px size to parent for proportion calc
  useEffect(() => {
    onCanvasSizeChange(canvasPxSize)
  }, [canvasPxSize, onCanvasSizeChange])

  // ResizeObserver: keep canvas pixel size = container CSS size × DPR
  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const observer = new ResizeObserver((entries) => {
      const { width } = entries[0].contentRect
      const dpr = window.devicePixelRatio || 1
      const pxSize = Math.round(width * dpr)
      if (pxSize === 0) return

      if (pieRef.current) {
        pieRef.current.width = pxSize
        pieRef.current.height = pxSize
      }
      if (lassoRef.current) {
        lassoRef.current.width = pxSize
        lassoRef.current.height = pxSize
      }
      setCanvasPxSize(pxSize)
    })

    observer.observe(container)
    return () => observer.disconnect()
  }, [])

  // Redraw pie whenever shape changes or viewport changes
  useEffect(() => {
    if (!pieRef.current) return
    const ctx = pieRef.current.getContext('2d')
    if (!ctx) return
    renderPie(ctx, shape, transform.domMatrix)
    if (needsPieRedraw) onPieDrawn()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [needsPieRedraw, shape, transform.scale, transform.tx, transform.ty, canvasPxSize])

  // RAF loop for lasso marching ants
  useEffect(() => {
    function frame(ts: number) {
      const ctx = lassoRef.current?.getContext('2d')
      if (ctx) {
        renderLasso(ctx, gameState.currentLasso, gameState.phase, transform.domMatrix, ts)
      }
      rafRef.current = requestAnimationFrame(frame)
    }
    rafRef.current = requestAnimationFrame(frame)
    return () => cancelAnimationFrame(rafRef.current)
  }, [gameState.currentLasso, gameState.phase, transform])

  const { startDraw, continueDraw, endDraw, cancelDraw } = useLasso(dispatch, getViewport)

  const canInteract =
    gameState.phase === 'idle' ||
    gameState.phase === 'drawing' ||
    gameState.phase === 'confirming'

  const handleMouseLeave = useCallback(() => {
    if (gameState.phase === 'drawing') endDraw()
  }, [gameState.phase, endDraw])

  return (
    <div
      ref={containerRef}
      style={{
        position: 'relative',
        width: '100%',
        aspectRatio: '1',
        maxWidth: 520,
        borderRadius: 'var(--radius-md)',
        overflow: 'hidden',
        background: 'var(--color-card)',
        border: '1px solid var(--color-card-border)',
      }}
    >
      {/* Canvas elements use CSS width/height 100% — actual pixel size set via JS */}
      <canvas
        ref={pieRef}
        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}
      />
      <canvas
        ref={lassoRef}
        style={{
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%',
          cursor: canInteract ? 'crosshair' : 'default',
          touchAction: 'none',
        }}
        onMouseDown={canInteract ? startDraw : undefined}
        onMouseMove={canInteract ? continueDraw : undefined}
        onMouseUp={canInteract ? endDraw : undefined}
        onMouseLeave={handleMouseLeave}
        onTouchStart={canInteract ? startDraw : undefined}
        onTouchMove={canInteract ? continueDraw : undefined}
        onTouchEnd={canInteract ? endDraw : undefined}
        onContextMenu={(e) => e.preventDefault()}
      />
    </div>
  )
}
