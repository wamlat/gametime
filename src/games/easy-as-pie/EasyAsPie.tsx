import { useRef, useEffect, useCallback, useState } from 'react'
import { useGameState } from './hooks/useGameState'
import { PieCanvas } from './canvas/PieCanvas'
import { PieShape } from './canvas/pieShape'
import { mecOfPoints } from './canvas/enclosingCircle'
import { simplifyPath } from './canvas/geometry'
import { HUD } from './ui/HUD'
import { ConfirmButton } from './ui/ConfirmButton'
import { RoundResult } from './ui/RoundResult'
import { GameOver } from './ui/GameOver'
import { generateRandomSeed, generateTargets } from './seed'
import './ui/EasyAsPie.css'
import {
  PIE_RADIUS,
  PIE_CENTER,
  ROUND_COUNT,
  INITIAL_VIEWPORT,
} from './constants'

interface Props {
  seed: string
}

export function EasyAsPie({ seed: initialSeed }: Props) {
  const [seed, setSeed] = useState(initialSeed)
  const [targets, setTargets] = useState(() => generateTargets(initialSeed))
  const { state, dispatch } = useGameState(seed, targets)

  const initialCircle = { cx: PIE_CENTER.x, cy: PIE_CENTER.y, r: PIE_RADIUS }
  const shapeRef = useRef<PieShape>(new PieShape(initialCircle))
  const prevPixelCountRef = useRef<number>(0)
  const [needsPieRedraw, setNeedsPieRedraw] = useState(true)

  // On mount: record initial pixel count
  useEffect(() => {
    prevPixelCountRef.current = shapeRef.current.countRemainingPixels()
  }, [])

  // When phase becomes 'scoring': add lasso to shape, compute proportion, dispatch result
  useEffect(() => {
    if (state.phase !== 'scoring') return

    const before = prevPixelCountRef.current
    const lasso = simplifyPath(state.currentLasso, 1.5)
    shapeRef.current.addEaten(lasso)
    const after = shapeRef.current.countRemainingPixels()
    prevPixelCountRef.current = after

    // Proportion relative to remaining pie before this erasure
    const proportion = before > 0
      ? Math.max(0, Math.min(1, (before - after) / before))
      : 0

    // Compute MEC of remaining pie for zoom
    const pts = shapeRef.current.getRemainingPoints(3)
    const mec = pts.length > 2 ? mecOfPoints(pts) : INITIAL_VIEWPORT

    setNeedsPieRedraw(true)
    dispatch({ type: 'SCORE_COMPUTED', proportionErased: proportion, mec })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.phase])

  function handlePlayAgain() {
    const newSeed = generateRandomSeed()
    const newTargets = generateTargets(newSeed)
    setSeed(newSeed)
    setTargets(newTargets)
    shapeRef.current.reset(initialCircle)
    prevPixelCountRef.current = shapeRef.current.countRemainingPixels()
    setNeedsPieRedraw(true)
    dispatch({ type: 'RESET', seed: newSeed, targets: newTargets })
    setTimeout(() => dispatch({ type: 'START_GAME' }), 50)
  }

  const handlePieDrawn = useCallback(() => setNeedsPieRedraw(false), [])
  const handleCanvasSizeChange = useCallback(() => setNeedsPieRedraw(true), [])

  const currentRound = state.round
  const currentTarget = targets[Math.min(currentRound, ROUND_COUNT - 1)]
  const lastRoundResult = state.rounds[state.rounds.length - 1]
  const isLastRound = currentRound >= ROUND_COUNT - 1

  if (state.phase === 'lobby') {
    return (
      <div className="eap-wrapper">
        <div className="eap-card" style={{ maxWidth: 560 }}>
          <h1 className="eap-lobby-title">easy as pie.</h1>
          <p className="eap-lobby-desc">
            We'll show you a target proportion — then you draw a lasso to eat exactly that much of the pie. Five rounds. Lowest score wins.
          </p>
          <p className="eap-lobby-meta">
            Scoring: |eaten − target| / target × 10 &nbsp;·&nbsp; lower is better &nbsp;·&nbsp; 0 is perfect
          </p>
          <div className="eap-mode-buttons">
            <button
              className="eap-btn-primary"
              onClick={() => dispatch({ type: 'START_GAME' })}
            >
              Solo
            </button>
            <button
              className="eap-btn-secondary"
              onClick={() => {
                const url = `${window.location.origin}/easy-as-pie?seed=${seed}`
                navigator.clipboard.writeText(url).catch(() => {})
                dispatch({ type: 'START_GAME' })
              }}
            >
              Copy &amp; Challenge
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="eap-wrapper">
      <div className="eap-card">
        {/* HUD */}
        {(state.phase === 'idle' || state.phase === 'drawing' || state.phase === 'confirming') && (
          <HUD
            round={currentRound}
            target={currentTarget}
            totalScore={state.totalScore}
            roundCount={ROUND_COUNT}
          />
        )}

        {/* Scoring header */}
        {(state.phase === 'scoring' || state.phase === 'zooming') && lastRoundResult && (
          <div style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--color-muted)' }}>
              Round {currentRound} / {ROUND_COUNT}
            </span>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--color-muted)' }}>
              total: {state.totalScore}
            </span>
          </div>
        )}

        {/* Canvas */}
        {state.phase !== 'complete' && (
          <PieCanvas
            gameState={state}
            dispatch={dispatch}
            shape={shapeRef.current}
            needsPieRedraw={needsPieRedraw}
            onPieDrawn={handlePieDrawn}
            onCanvasSizeChange={handleCanvasSizeChange}
          />
        )}

        {state.phase === 'idle' && (
          <p className="eap-instruction">draw a lasso to eat the pie</p>
        )}

        {state.phase === 'confirming' && (
          <ConfirmButton
            onConfirm={() => dispatch({ type: 'CONFIRM_LASSO' })}
            onRedraw={() => dispatch({ type: 'REDRAW' })}
          />
        )}

        {(state.phase === 'scoring' || state.phase === 'zooming') && lastRoundResult && (
          <RoundResult
            result={lastRoundResult}
            isLastRound={isLastRound}
            onContinue={() => dispatch({ type: 'ZOOM_COMPLETE' })}
          />
        )}

        {state.phase === 'complete' && (
          <GameOver
            rounds={state.rounds}
            seed={seed}
            totalScore={state.totalScore}
            onPlayAgain={handlePlayAgain}
          />
        )}
      </div>
    </div>
  )
}
