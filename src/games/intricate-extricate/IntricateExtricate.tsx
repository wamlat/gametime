import { useEffect, useRef, useState } from 'react'
import './index.css'
import { clampVertex, countCrossings, generatePuzzle, getCrossingEdgeKeys } from './logic'
import type { Difficulty, Point, Puzzle } from './logic'

const BOARD_SIZE = 520
const GAME_DURATION = 60
const VERTEX_LABELS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('')

type Phase = 'lobby' | 'playing' | 'complete'

interface DragState {
  vertexIndex: number
  pointerId: number
}

function formatTime(seconds: number) {
  return `${seconds}s`
}

function boardPointFromPointer(
  clientX: number,
  clientY: number,
  board: HTMLDivElement,
  difficulty: Difficulty
): Point {
  const rect = board.getBoundingClientRect()
  const scaleX = BOARD_SIZE / rect.width
  const scaleY = BOARD_SIZE / rect.height

  return clampVertex(
    {
      x: (clientX - rect.left) * scaleX,
      y: (clientY - rect.top) * scaleY,
    },
    difficulty
  )
}

function MetaStat({
  label,
  value,
  accent = false,
}: {
  label: string
  value: string | number
  accent?: boolean
}) {
  return (
    <div
      style={{
        flex: 1,
        minWidth: 0,
        padding: '12px 14px',
        borderRadius: 'var(--radius-md)',
        background: accent ? 'rgba(232, 131, 42, 0.14)' : 'rgba(255,255,255,0.04)',
        border: accent
          ? '1px solid rgba(232, 131, 42, 0.28)'
          : '1px solid rgba(255,255,255,0.05)',
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

export default function IntricateExtricate() {
  const boardRef = useRef<HTMLDivElement>(null)
  const dragRef = useRef<DragState | null>(null)
  const advanceTimeoutRef = useRef<number | null>(null)
  const initialPuzzleRef = useRef<Puzzle>(generatePuzzle('standard'))

  const [phase, setPhase] = useState<Phase>('lobby')
  const [difficulty, setDifficulty] = useState<Difficulty>('standard')
  const [timeLeft, setTimeLeft] = useState(GAME_DURATION)
  const [solvedCount, setSolvedCount] = useState(0)
  const [isAdvancing, setIsAdvancing] = useState(false)
  const [puzzle, setPuzzle] = useState<Puzzle>(initialPuzzleRef.current)
  const [vertices, setVertices] = useState<Point[]>(initialPuzzleRef.current.vertices)

  const isHardMode = difficulty === 'hard'
  const vertexRadius = isHardMode ? 12 : 17
  const haloRadius = isHardMode ? 18 : 24

  useEffect(() => {
    if (phase !== 'playing') return
    if (timeLeft <= 0) {
      if (advanceTimeoutRef.current !== null) {
        window.clearTimeout(advanceTimeoutRef.current)
        advanceTimeoutRef.current = null
      }
      setIsAdvancing(false)
      setPhase('complete')
      return
    }

    const timeout = window.setTimeout(() => {
      setTimeLeft((current) => current - 1)
    }, 1000)

    return () => window.clearTimeout(timeout)
  }, [phase, timeLeft])

  useEffect(() => {
    if (phase !== 'playing') return

    function handlePointerMove(e: PointerEvent) {
      const drag = dragRef.current
      const board = boardRef.current
      if (!drag || !board || drag.pointerId !== e.pointerId) return

      const nextPoint = boardPointFromPointer(e.clientX, e.clientY, board, difficulty)
      setVertices((current) =>
        current.map((vertex, index) => (index === drag.vertexIndex ? nextPoint : vertex))
      )
    }

    function handlePointerUp(e: PointerEvent) {
      const drag = dragRef.current
      if (!drag || drag.pointerId !== e.pointerId) return
      dragRef.current = null
    }

    window.addEventListener('pointermove', handlePointerMove)
    window.addEventListener('pointerup', handlePointerUp)
    window.addEventListener('pointercancel', handlePointerUp)

    return () => {
      window.removeEventListener('pointermove', handlePointerMove)
      window.removeEventListener('pointerup', handlePointerUp)
      window.removeEventListener('pointercancel', handlePointerUp)
    }
  }, [difficulty, phase])

  useEffect(() => {
    return () => {
      if (advanceTimeoutRef.current !== null) {
        window.clearTimeout(advanceTimeoutRef.current)
      }
    }
  }, [])

  const crossingCount = countCrossings(vertices, puzzle.edges)
  const crossingEdgeKeys = getCrossingEdgeKeys(vertices, puzzle.edges)

  useEffect(() => {
    if (phase !== 'playing' || isAdvancing || crossingCount !== 0) return

    setIsAdvancing(true)
    setSolvedCount((count) => count + 1)

    advanceTimeoutRef.current = window.setTimeout(() => {
      const nextPuzzle = generatePuzzle(difficulty)
      setPuzzle(nextPuzzle)
      setVertices(nextPuzzle.vertices)
      setIsAdvancing(false)
      advanceTimeoutRef.current = null
    }, 220)
  }, [crossingCount, difficulty, isAdvancing, phase])

  useEffect(() => {
    if (phase !== 'playing' && dragRef.current) {
      dragRef.current = null
    }
  }, [phase])

  function startGame(nextDifficulty: Difficulty) {
    const nextPuzzle = generatePuzzle(nextDifficulty)
    if (advanceTimeoutRef.current !== null) {
      window.clearTimeout(advanceTimeoutRef.current)
      advanceTimeoutRef.current = null
    }

    dragRef.current = null
    setDifficulty(nextDifficulty)
    setPuzzle(nextPuzzle)
    setVertices(nextPuzzle.vertices)
    setSolvedCount(0)
    setTimeLeft(GAME_DURATION)
    setIsAdvancing(false)
    setPhase('playing')
  }

  function handleVertexPointerDown(vertexIndex: number, e: React.PointerEvent<SVGCircleElement>) {
    if (phase !== 'playing' || isAdvancing) return
    e.preventDefault()
    dragRef.current = { vertexIndex, pointerId: e.pointerId }
  }

  if (phase === 'lobby') {
    return (
      <div className="eap-wrapper">
        <div className="eap-card" style={{ maxWidth: 560 }}>
          <h1 className="eap-lobby-title">intricate extricate.</h1>
          <p className="eap-lobby-desc">
            Untangle straight-line planar graphs against the clock. Standard gives you five
            vertices; hard mode jumps to ten and packs in a lot more crossings.
          </p>
          <p className="eap-lobby-meta">
            Single player only · straight-line edges · score = graphs fully detangled in 60s
          </p>
          <div className="eap-mode-buttons">
            <button className="eap-btn-primary" onClick={() => startGame('standard')}>
              Standard
            </button>
            <button className="eap-btn-secondary" onClick={() => startGame('hard')}>
              Hard
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
              time
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
              {solvedCount}
            </div>
            <p className="eap-lobby-desc" style={{ marginTop: 14, textAlign: 'center' }}>
              graphs detangled before the clock hit zero.
            </p>
          </div>

          <div
            style={{
              width: '100%',
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: 12,
            }}
          >
            <MetaStat label="Final Score" value={solvedCount} accent />
            <MetaStat label="Mode" value={isHardMode ? 'Hard' : 'Standard'} />
          </div>

          <div className="eap-mode-buttons">
            <button className="eap-btn-primary" onClick={() => startGame(difficulty)}>
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
          <MetaStat label="Time Left" value={formatTime(timeLeft)} accent />
          <MetaStat label="Solved" value={solvedCount} />
          <MetaStat label={isHardMode ? 'Mode' : 'Crossings'} value={isHardMode ? 'Hard' : crossingCount} />
        </div>

        <div
          ref={boardRef}
          style={{
            position: 'relative',
            width: '100%',
            aspectRatio: '1',
            maxWidth: BOARD_SIZE,
            borderRadius: 'var(--radius-md)',
            overflow: 'hidden',
            background:
              'radial-gradient(circle at 50% 35%, rgba(232,131,42,0.16), transparent 40%), linear-gradient(180deg, rgba(255,255,255,0.02), rgba(255,255,255,0.01))',
            border: '1px solid var(--color-card-border)',
            boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.03)',
          }}
        >
          <svg
            viewBox={`0 0 ${BOARD_SIZE} ${BOARD_SIZE}`}
            style={{ width: '100%', height: '100%', display: 'block', touchAction: 'none' }}
          >
            <defs>
              <filter id="ie-glow">
                <feGaussianBlur stdDeviation="4" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>

            <rect
              x="18"
              y="18"
              width={BOARD_SIZE - 36}
              height={BOARD_SIZE - 36}
              rx="24"
              fill="transparent"
              stroke="rgba(255,255,255,0.05)"
              strokeDasharray="5 8"
            />

            {puzzle.edges.map(([from, to]) => {
              const edgeIsCrossed = crossingEdgeKeys.has(
                from < to ? `${from}-${to}` : `${to}-${from}`
              )

              return (
                <line
                  key={`${from}-${to}`}
                  x1={vertices[from].x}
                  y1={vertices[from].y}
                  x2={vertices[to].x}
                  y2={vertices[to].y}
                  stroke={edgeIsCrossed ? '#f29b57' : 'rgba(250,247,242,0.72)'}
                  strokeWidth={edgeIsCrossed ? 4 : 3}
                  strokeLinecap="round"
                  opacity={isAdvancing ? 0.4 : 1}
                  filter={edgeIsCrossed ? 'url(#ie-glow)' : undefined}
                />
              )
            })}

            {vertices.map((vertex, index) => (
              <g key={`${puzzle.id}-${index}`}>
                <circle
                  cx={vertex.x}
                  cy={vertex.y}
                  r={haloRadius}
                  fill="#111110"
                  stroke="rgba(255,255,255,0.18)"
                  strokeWidth="2"
                />
                <circle
                  cx={vertex.x}
                  cy={vertex.y}
                  r={vertexRadius}
                  fill="var(--color-accent)"
                  stroke="rgba(255,255,255,0.25)"
                  strokeWidth="1.5"
                  style={{ cursor: isAdvancing ? 'default' : 'grab' }}
                  onPointerDown={(e) => handleVertexPointerDown(index, e)}
                />
                <text
                  x={vertex.x}
                  y={vertex.y + (isHardMode ? 3 : 4)}
                  textAnchor="middle"
                  fontFamily="var(--font-mono)"
                  fontSize={isHardMode ? '8' : '11'}
                  letterSpacing="0.08em"
                  fill="#111110"
                  style={{ userSelect: 'none', pointerEvents: 'none' }}
                >
                  {VERTEX_LABELS[index]}
                </text>
              </g>
            ))}
          </svg>

          {isAdvancing && (
            <div
              style={{
                position: 'absolute',
                inset: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'rgba(17,17,16,0.18)',
                pointerEvents: 'none',
              }}
            >
              <div
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: 11,
                  letterSpacing: '0.14em',
                  textTransform: 'uppercase',
                  color: 'var(--color-success)',
                }}
              >
                detangled
              </div>
            </div>
          )}
        </div>

        <p className="eap-instruction">
          {isHardMode
            ? 'hard mode: drag all ten vertices until every edge is uncrossed, then the next graph appears'
            : 'drag the five vertices until every edge is uncrossed, then the next graph appears'}
        </p>
      </div>
    </div>
  )
}
