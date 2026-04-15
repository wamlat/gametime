import { useCallback, useEffect, useRef, useState } from 'react'
import './index.css'
import {
  CANVAS_SIZE,
  FLASH_DURATION_MS,
  ROUND_COUNT,
  generateRounds,
  scoreGuess,
  scoreLabel,
} from './logic'
import type { CounterRound, Shape } from './logic'

type Phase = 'lobby' | 'flashing' | 'guessing' | 'result' | 'complete'

interface RoundResult {
  target: number
  guess: number
  error: number
}

function StatCard({ label, value, accent = false }: { label: string; value: string | number; accent?: boolean }) {
  return (
    <div
      style={{
        flex: 1,
        minWidth: 0,
        padding: '12px 14px',
        borderRadius: 'var(--radius-md)',
        background: accent ? 'rgba(232, 131, 42, 0.14)' : 'rgba(255,255,255,0.04)',
        border: accent ? '1px solid rgba(232, 131, 42, 0.28)' : '1px solid rgba(255,255,255,0.05)',
      }}
    >
      <div
        style={{
          fontFamily: 'var(--font-mono)',
          fontSize: 10,
          letterSpacing: '0.12em',
          textTransform: 'uppercase',
          color: 'var(--color-muted)',
          marginBottom: 6,
        }}
      >
        {label}
      </div>
      <div
        style={{
          fontFamily: accent ? 'var(--font-display)' : 'var(--font-sans)',
          fontSize: accent ? 34 : 20,
          lineHeight: 1,
          color: accent ? 'var(--color-accent)' : 'var(--color-text)',
          letterSpacing: accent ? '-0.03em' : undefined,
        }}
      >
        {value}
      </div>
    </div>
  )
}

function drawShape(ctx: CanvasRenderingContext2D, shape: Shape, scale: number) {
  const { kind, x, y, size, color, rotation } = shape
  const s = size * scale
  ctx.save()
  ctx.translate(x * scale, y * scale)
  ctx.rotate(rotation)
  ctx.fillStyle = color

  switch (kind) {
    case 'circle':
      ctx.beginPath()
      ctx.arc(0, 0, s / 2, 0, Math.PI * 2)
      ctx.fill()
      break
    case 'square':
      ctx.fillRect(-s / 2, -s / 2, s, s)
      break
    case 'triangle':
      ctx.beginPath()
      ctx.moveTo(0, -s / 2)
      ctx.lineTo(s / 2, s / 2)
      ctx.lineTo(-s / 2, s / 2)
      ctx.closePath()
      ctx.fill()
      break
    case 'diamond':
      ctx.beginPath()
      ctx.moveTo(0, -s / 2)
      ctx.lineTo(s / 2, 0)
      ctx.lineTo(0, s / 2)
      ctx.lineTo(-s / 2, 0)
      ctx.closePath()
      ctx.fill()
      break
  }

  ctx.restore()
}

export default function Counter() {
  const [phase, setPhase] = useState<Phase>('lobby')
  const [rounds, setRounds] = useState<CounterRound[]>(() => generateRounds())
  const [roundIndex, setRoundIndex] = useState(0)
  const [guess, setGuess] = useState('')
  const [results, setResults] = useState<RoundResult[]>([])

  const canvasRef = useRef<HTMLCanvasElement>(null)
  const timerRef = useRef<number | null>(null)
  const [needsRender, setNeedsRender] = useState(false)

  const currentRound = rounds[roundIndex] ?? rounds[rounds.length - 1]
  const totalError = results.reduce((sum, r) => sum + r.error, 0)
  const lastResult = results[results.length - 1]
  const bestRound = results.length > 0 ? Math.min(...results.map((r) => r.error)) : 0

  const renderShapes = useCallback((shapes: Shape[]) => {
    const canvas = canvasRef.current
    if (!canvas) return false
    const ctx = canvas.getContext('2d')
    if (!ctx) return false

    const dpr = window.devicePixelRatio || 1
    const displaySize = Math.min(window.innerWidth - 48, CANVAS_SIZE)
    canvas.style.width = `${displaySize}px`
    canvas.style.height = `${displaySize}px`
    canvas.width = displaySize * dpr
    canvas.height = displaySize * dpr

    const scale = (displaySize * dpr) / CANVAS_SIZE

    ctx.clearRect(0, 0, canvas.width, canvas.height)
    shapes.forEach((shape) => drawShape(ctx, shape, scale))
    return true
  }, [])

  const clearCanvas = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    ctx.clearRect(0, 0, canvas.width, canvas.height)
  }, [])

  useEffect(() => {
    return () => {
      if (timerRef.current !== null) window.clearTimeout(timerRef.current)
    }
  }, [])

  // Render shapes once canvas is mounted after phase switches to 'flashing'
  useEffect(() => {
    if (phase === 'flashing' && needsRender) {
      const drawn = renderShapes(currentRound.shapes)
      if (drawn) {
        setNeedsRender(false)
        timerRef.current = window.setTimeout(() => {
          clearCanvas()
          setPhase('guessing')
          timerRef.current = null
        }, FLASH_DURATION_MS)
      }
    }
  }, [phase, needsRender, currentRound, renderShapes, clearCanvas])

  function startRun() {
    if (timerRef.current !== null) window.clearTimeout(timerRef.current)
    const nextRounds = generateRounds()
    setRounds(nextRounds)
    setRoundIndex(0)
    setGuess('')
    setResults([])
    setPhase('flashing')
    setNeedsRender(true)
  }

  function submitGuess() {
    const guessNum = parseInt(guess, 10)
    if (isNaN(guessNum) || guessNum < 0) return
    const error = scoreGuess(currentRound.count, guessNum)
    setResults((prev) => [...prev, { target: currentRound.count, guess: guessNum, error }])
    setPhase('result')
  }

  function nextRound() {
    if (roundIndex >= ROUND_COUNT - 1) {
      setPhase('complete')
      return
    }

    const nextIdx = roundIndex + 1
    setRoundIndex(nextIdx)
    setGuess('')
    setPhase('flashing')
    setNeedsRender(true)
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && phase === 'guessing') {
      submitGuess()
    }
  }

  if (phase === 'lobby') {
    return (
      <div className="eap-wrapper">
        <div className="eap-card" style={{ maxWidth: 560 }}>
          <h1 className="eap-lobby-title">counter.</h1>
          <p className="eap-lobby-desc">
            A burst of shapes flashes on screen for one second. Count them — or try to — then type
            your best guess. Five rounds, lowest total error wins.
          </p>
          <p className="eap-lobby-meta">
            Single player · shapes get more numerous each round · lower is better
          </p>
          <div className="eap-mode-buttons">
            <button className="eap-btn-primary" onClick={startRun}>
              Start
            </button>
          </div>
        </div>
      </div>
    )
  }

  if (phase === 'complete') {
    return (
      <div className="eap-wrapper">
        <div className="eap-card" style={{ maxWidth: 560 }}>
          <div style={{ width: '100%', textAlign: 'center' }}>
            <div
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: 11,
                letterSpacing: '0.12em',
                textTransform: 'uppercase',
                color: 'var(--color-muted)',
                marginBottom: 10,
              }}
            >
              total error
            </div>
            <div
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: 'clamp(54px, 12vw, 80px)',
                color: 'var(--color-accent)',
                lineHeight: 1,
                letterSpacing: '-0.03em',
              }}
            >
              {totalError}
            </div>
            <p className="eap-lobby-desc" style={{ marginTop: 14, textAlign: 'center' }}>
              across {ROUND_COUNT} rounds. Lower is better.
            </p>
          </div>

          <div
            style={{
              width: '100%',
              display: 'grid',
              gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
              gap: 10,
            }}
          >
            <StatCard label="Best Round" value={bestRound} accent />
            <StatCard label="Rounds" value={ROUND_COUNT} />
            <StatCard label="Mode" value="Solo" />
          </div>

          <div style={{ width: '100%' }}>
            <div
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: 10,
                letterSpacing: '0.12em',
                textTransform: 'uppercase',
                color: 'var(--color-muted)',
                marginBottom: 10,
              }}
            >
              round breakdown
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {results.map((r, i) => (
                <div
                  key={i}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '8px 12px',
                    borderRadius: 'var(--radius-sm)',
                    background: 'rgba(255,255,255,0.04)',
                    border: '1px solid rgba(255,255,255,0.05)',
                    fontFamily: 'var(--font-mono)',
                    fontSize: 12,
                    color: 'var(--color-text)',
                  }}
                >
                  <span style={{ color: 'var(--color-muted)' }}>R{i + 1}</span>
                  <span>{r.target} objects</span>
                  <span>guessed {r.guess}</span>
                  <span style={{ color: r.error === 0 ? '#5DE88D' : 'var(--color-accent)' }}>
                    {r.error === 0 ? 'perfect' : `off by ${r.error}`}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="eap-mode-buttons">
            <button className="eap-btn-primary" onClick={startRun}>
              Play Again
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="eap-wrapper">
      <div className="eap-card">
        <div
          style={{
            width: '100%',
            display: 'grid',
            gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
            gap: 10,
          }}
        >
          <StatCard label="Round" value={`${roundIndex + 1}/${ROUND_COUNT}`} />
          <StatCard label="Total Error" value={totalError} accent />
          <StatCard label="Objects" value={phase === 'flashing' ? '?' : '?'} />
        </div>

        <div
          style={{
            width: '100%',
            maxWidth: 520,
            aspectRatio: '1',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--color-card-border)',
            background:
              phase === 'flashing'
                ? 'radial-gradient(circle at 50% 50%, rgba(232,131,42,0.08), transparent 60%), rgba(255,255,255,0.02)'
                : 'rgba(255,255,255,0.02)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            position: 'relative',
            overflow: 'hidden',
            boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.03)',
          }}
        >
          <canvas
            ref={canvasRef}
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
            }}
          />
          {phase === 'guessing' && (
            <div
              style={{
                position: 'absolute',
                inset: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <span
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: 14,
                  color: 'var(--color-muted)',
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                  opacity: 0.6,
                }}
              >
                how many?
              </span>
            </div>
          )}
        </div>

        {phase === 'guessing' && (
          <>
            <div
              style={{
                width: '100%',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 14,
              }}
            >
              <input
                type="number"
                min="0"
                value={guess}
                onChange={(e) => setGuess(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="enter your count"
                autoFocus
                style={{
                  width: '100%',
                  maxWidth: 240,
                  padding: '14px 18px',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid rgba(255,255,255,0.12)',
                  background: 'rgba(255,255,255,0.06)',
                  color: 'var(--color-text)',
                  fontFamily: 'var(--font-display)',
                  fontSize: 32,
                  textAlign: 'center',
                  outline: 'none',
                  letterSpacing: '-0.02em',
                }}
              />
            </div>
            <div className="eap-mode-buttons">
              <button
                className="eap-btn-primary"
                onClick={submitGuess}
                disabled={guess === '' || isNaN(parseInt(guess, 10))}
              >
                Lock In
              </button>
            </div>
            <p className="eap-instruction">type how many shapes you saw</p>
          </>
        )}

        {phase === 'flashing' && (
          <p className="eap-instruction">count the shapes!</p>
        )}

        {phase === 'result' && lastResult && (
          <>
            <div
              style={{
                width: '100%',
                display: 'grid',
                gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
                gap: 10,
              }}
            >
              <StatCard label="Actual" value={lastResult.target} />
              <StatCard label="Your Guess" value={lastResult.guess} accent />
              <StatCard label="Error" value={lastResult.error} />
            </div>
            <p className="eap-instruction" style={{ animation: 'none' }}>
              {scoreLabel(lastResult.error)}
            </p>
            <div className="eap-mode-buttons">
              <button className="eap-btn-primary" onClick={nextRound}>
                {roundIndex >= ROUND_COUNT - 1 ? 'See Score' : 'Next Round'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
