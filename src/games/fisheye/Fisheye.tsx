import { useEffect, useMemo, useState } from 'react'
import './index.css'
import {
  ANGLE_MAX,
  ANGLE_MIN,
  BOARD_HEIGHT,
  BOARD_WIDTH,
  BOW_ORIGIN,
  POWER_MAX,
  POWER_MIN,
  ROUND_COUNT,
  WATERLINE_Y,
  evaluateShot,
  fishEyeForRound,
  generateRound,
  sampleTrajectory,
} from './logic'
import type { Point, RoundSpec, ShotOutcome } from './logic'

type Phase = 'lobby' | 'aiming' | 'flying' | 'result' | 'complete'

interface RoundResult {
  score: number
  distance: number
  hit: boolean
}

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value))
}

function describeShot(result: ShotOutcome) {
  if (result.hit) return 'bullseye'
  if (result.score >= 80) return 'close cut'
  if (result.score >= 55) return 'grazed it'
  if (result.score >= 30) return 'wide'
  return 'way off'
}

function formatDistance(distance: number) {
  return `${Math.round(distance)} px away`
}

function pointsToString(points: Point[]) {
  return points.map((point) => `${point.x},${point.y}`).join(' ')
}

function shortPreviewPath(points: Point[], length: number) {
  return points.slice(0, Math.min(points.length, length))
}

function fishBodyPath(round: RoundSpec) {
  const { fishCenter, fishWidth, fishHeight } = round
  const left = fishCenter.x - fishWidth / 2
  const right = fishCenter.x + fishWidth / 2
  const top = fishCenter.y - fishHeight / 2
  const bottom = fishCenter.y + fishHeight / 2
  const tailX = right + fishWidth * 0.18

  return [
    `M ${left} ${fishCenter.y}`,
    `Q ${fishCenter.x - fishWidth * 0.2} ${top} ${right - fishWidth * 0.12} ${top + 3}`,
    `Q ${right + 10} ${fishCenter.y} ${right - fishWidth * 0.12} ${bottom - 3}`,
    `Q ${fishCenter.x - fishWidth * 0.18} ${bottom} ${left} ${fishCenter.y}`,
    `M ${right - 4} ${fishCenter.y}`,
    `L ${tailX} ${top + fishHeight * 0.14}`,
    `L ${tailX - 2} ${bottom - fishHeight * 0.14}`,
    'Z',
  ].join(' ')
}

function pondReflectionPoint(point: Point) {
  return {
    x: point.x,
    y: WATERLINE_Y + 68 + (WATERLINE_Y - point.y) * 0.2,
  }
}

function reflectionPath(round: RoundSpec) {
  return fishBodyPath({
    ...round,
    fishCenter: pondReflectionPoint(round.fishCenter),
    fishHeight: round.fishHeight * 0.56,
  })
}

function arrowAngle(points: Point[], index: number) {
  const current = points[index]
  const next = points[Math.min(index + 1, points.length - 1)] ?? current
  return (Math.atan2(next.y - current.y, next.x - current.x) * 180) / Math.PI
}

function StatBlock({
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

export default function Fisheye() {
  const [phase, setPhase] = useState<Phase>('lobby')
  const [roundIndex, setRoundIndex] = useState(0)
  const [angle, setAngle] = useState(-105)
  const [power, setPower] = useState(128)
  const [round, setRound] = useState<RoundSpec>(() => generateRound())
  const [results, setResults] = useState<RoundResult[]>([])
  const [lastShot, setLastShot] = useState<ShotOutcome | null>(null)
  const [flightIndex, setFlightIndex] = useState(0)

  const eye = useMemo(() => fishEyeForRound(round), [round])
  const reflectedEye = useMemo(() => pondReflectionPoint(eye), [eye])
  const previewPath = useMemo(() => sampleTrajectory(angle, power), [angle, power])
  const launchPreviewPath = useMemo(() => shortPreviewPath(previewPath, 8), [previewPath])
  const totalScore = results.reduce((sum, result) => sum + result.score, 0)
  const animatedPath = lastShot?.trajectory.slice(0, flightIndex + 1) ?? []
  const arrowPoint = lastShot?.trajectory[Math.min(flightIndex, (lastShot.trajectory.length || 1) - 1)] ?? null
  const currentArrowAngle = lastShot ? arrowAngle(lastShot.trajectory, Math.min(flightIndex, lastShot.trajectory.length - 1)) : angle
  const drawStrength = Math.round(((power - POWER_MIN) / (POWER_MAX - POWER_MIN)) * 100)
  const revealFish = phase === 'flying' || phase === 'result'

  useEffect(() => {
    if (phase !== 'aiming') return
    setLastShot(null)
    setFlightIndex(0)
  }, [phase, round])

  useEffect(() => {
    if (phase !== 'flying' || !lastShot) return

    if (flightIndex >= lastShot.trajectory.length - 1) {
      setPhase('result')
      return
    }

    const timeout = window.setTimeout(() => {
      setFlightIndex((current) => current + 1)
    }, 18)

    return () => window.clearTimeout(timeout)
  }, [flightIndex, lastShot, phase])

  function beginRun() {
    setPhase('aiming')
    setRoundIndex(0)
    setAngle(-105)
    setPower(128)
    setResults([])
    setLastShot(null)
    setFlightIndex(0)
    setRound(generateRound())
  }

  function fireArrow() {
    if (phase !== 'aiming') return

    const outcome = evaluateShot(round, angle, power)
    setLastShot(outcome)
    setResults((current) => [
      ...current,
      {
        score: outcome.score,
        distance: outcome.minDistance,
        hit: outcome.hit,
      },
    ])
    setFlightIndex(0)
    setPhase('flying')
  }

  function advanceRound() {
    if (roundIndex >= ROUND_COUNT - 1) {
      setPhase('complete')
      return
    }

    setRoundIndex((current) => current + 1)
    setRound(generateRound())
    setAngle(-105)
    setPower(128)
    setFlightIndex(0)
    setPhase('aiming')
  }

  if (phase === 'lobby') {
    return (
      <div className="eap-wrapper">
        <div className="eap-card" style={{ maxWidth: 560 }}>
          <h1 className="eap-lobby-title">fisheye.</h1>
          <p className="eap-lobby-desc">
            A single-player archery trial inspired by Arjuna and the wooden fish. Read the fish eye
            from its reflection in the water, choose your angle and draw strength, then loose the
            shot.
          </p>
          <p className="eap-lobby-meta">
            Single player only · five shots per run · the real fish only reveals after release
          </p>
          <div className="eap-mode-buttons">
            <button className="eap-btn-primary" onClick={beginRun}>
              Start Trial
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
              final score
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
              {totalScore}
            </div>
            <p className="eap-lobby-desc" style={{ marginTop: 14, textAlign: 'center' }}>
              over {ROUND_COUNT} arrows. Precision matters more than luck.
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
            <StatBlock
              label="Best Shot"
              value={Math.max(...results.map((result) => result.score), 0)}
              accent
            />
            <StatBlock label="Hits" value={results.filter((result) => result.hit).length} />
            <StatBlock label="Mode" value="Solo" />
          </div>

          <div className="eap-mode-buttons">
            <button className="eap-btn-primary" onClick={beginRun}>
              Shoot Again
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
          <StatBlock label="Round" value={`${roundIndex + 1}/${ROUND_COUNT}`} />
          <StatBlock label="Score" value={totalScore} accent />
          <StatBlock label="Mode" value="Solo" />
        </div>

        <div
          style={{
            position: 'relative',
            width: '100%',
            aspectRatio: '1',
            maxWidth: BOARD_WIDTH,
            borderRadius: 'var(--radius-md)',
            overflow: 'hidden',
            border: '1px solid var(--color-card-border)',
            background:
              'radial-gradient(circle at 50% 14%, rgba(255,205,120,0.12), transparent 20%), linear-gradient(180deg, rgba(94,66,42,0.75) 0%, rgba(45,31,21,0.94) 62%, rgba(18,16,14,1) 100%)',
            boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.03)',
          }}
        >
          <svg
            viewBox={`0 0 ${BOARD_WIDTH} ${BOARD_HEIGHT}`}
            style={{ width: '100%', height: '100%', display: 'block' }}
          >
            <defs>
              <radialGradient id="fish-wood" cx="40%" cy="40%">
                <stop offset="0%" stopColor="#d6aa62" />
                <stop offset="100%" stopColor="#8c5b25" />
              </radialGradient>
              <linearGradient id="water-shine" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="rgba(255,215,150,0.28)" />
                <stop offset="100%" stopColor="rgba(43,53,64,0.04)" />
              </linearGradient>
            </defs>

            {revealFish && (
              <>
                <path
                  d={fishBodyPath(round)}
                  fill="url(#fish-wood)"
                  stroke="rgba(255,220,170,0.38)"
                  strokeWidth="2"
                />
                <circle
                  cx={eye.x}
                  cy={eye.y}
                  r={round.eyeRadius + 2}
                  fill="rgba(0,0,0,0.26)"
                  opacity="0.08"
                />
                <line
                  x1={40}
                  y1={44}
                  x2={round.fishCenter.x}
                  y2={round.fishCenter.y - round.fishHeight / 2}
                  stroke="rgba(255,246,230,0.28)"
                  strokeWidth="1.5"
                />
              </>
            )}

            <ellipse
              cx={260}
              cy={WATERLINE_Y + 68}
              rx={178}
              ry={44}
              fill="rgba(8,8,10,0.92)"
              stroke="rgba(215,166,98,0.6)"
              strokeWidth="8"
            />
            <ellipse
              cx={260}
              cy={WATERLINE_Y + 68}
              rx={154}
              ry={29}
              fill="url(#water-shine)"
              opacity="0.35"
            />

            <path
              d={reflectionPath(round)}
              fill="rgba(206,164,112,0.2)"
              stroke="rgba(255,230,180,0.18)"
              strokeWidth="1.5"
              opacity="0.85"
            />
            <circle
              cx={reflectedEye.x}
              cy={reflectedEye.y}
              r={round.eyeRadius + 1}
              fill="rgba(242,131,42,0.95)"
              opacity="0.9"
            />

            {phase === 'aiming' && (
              <>
                <polyline
                  points={pointsToString(launchPreviewPath)}
                  fill="none"
                  stroke="rgba(255,255,255,0.48)"
                  strokeWidth="2"
                  strokeDasharray="6 8"
                  opacity="0.95"
                />
                <g transform={`translate(${BOARD_WIDTH - 46} ${124})`}>
                  <rect
                    x="0"
                    y="0"
                    width="14"
                    height="164"
                    rx="7"
                    fill="rgba(255,255,255,0.08)"
                    stroke="rgba(255,255,255,0.12)"
                  />
                  <rect
                    x="0"
                    y={164 - Math.max(14, 1.64 * drawStrength)}
                    width="14"
                    height={Math.max(14, 1.64 * drawStrength)}
                    rx="7"
                    fill="rgba(242,131,42,0.92)"
                  />
                  <text
                    x="7"
                    y="-12"
                    textAnchor="middle"
                    fontFamily="var(--font-mono)"
                    fontSize="9"
                    letterSpacing="0.12em"
                    fill="rgba(255,255,255,0.68)"
                  >
                    DRAW
                  </text>
                  <text
                    x="7"
                    y="184"
                    textAnchor="middle"
                    fontFamily="var(--font-mono)"
                    fontSize="8"
                    letterSpacing="0.08em"
                    fill="rgba(255,255,255,0.38)"
                  >
                    LOW
                  </text>
                  <text
                    x="7"
                    y="200"
                    textAnchor="middle"
                    fontFamily="var(--font-mono)"
                    fontSize="8"
                    letterSpacing="0.08em"
                    fill="rgba(255,255,255,0.38)"
                  >
                    HIGH
                  </text>
                </g>
              </>
            )}

            {(phase === 'flying' || phase === 'result') && lastShot && animatedPath.length > 1 && (
              <polyline
                points={pointsToString(animatedPath)}
                fill="none"
                stroke={lastShot.hit ? 'rgba(114,196,114,0.8)' : 'rgba(242,131,42,0.85)'}
                strokeWidth="3"
              />
            )}

            {(phase === 'flying' || phase === 'result') && lastShot && arrowPoint && (
              <g transform={`translate(${arrowPoint.x} ${arrowPoint.y}) rotate(${currentArrowAngle})`}>
                <line x1="-16" y1="0" x2="10" y2="0" stroke="rgba(255,255,255,0.95)" strokeWidth="2.5" />
                <polygon points="10,0 3,-4 3,4" fill="rgba(190,220,255,0.95)" />
                <polyline points="-16,0 -21,-4 -21,4 -16,0" fill="none" stroke="rgba(255,230,190,0.8)" strokeWidth="1.2" />
              </g>
            )}

            {phase === 'result' && lastShot && (
              <>
                <circle
                  cx={lastShot.closestPoint.x}
                  cy={lastShot.closestPoint.y}
                  r="6"
                  fill={lastShot.hit ? 'rgba(114,196,114,1)' : 'rgba(242,131,42,1)'}
                />
                <circle
                  cx={eye.x}
                  cy={eye.y}
                  r={round.eyeRadius + 3}
                  fill="none"
                  stroke="rgba(255,255,255,0.8)"
                  strokeWidth="2"
                />
              </>
            )}

            <path
              d="M 236 428 Q 260 338 282 428"
              fill="none"
              stroke="rgba(235,205,88,0.85)"
              strokeWidth="7"
              strokeLinecap="round"
            />
            <line
              x1={228}
              y1={430}
              x2={292}
              y2={382}
              stroke="rgba(255,255,255,0.75)"
              strokeWidth="2"
            />
            <circle cx={BOW_ORIGIN.x} cy={BOW_ORIGIN.y} r="6" fill="rgba(255,255,255,0.9)" />
          </svg>
        </div>

        {phase === 'aiming' && (
          <>
            <div
              style={{ width: '100%', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}
            >
              <label style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <span className="eap-instruction" style={{ animation: 'none', textAlign: 'left' }}>
                  angle {Math.round(angle)}°
                </span>
                <input
                  type="range"
                  min={String(ANGLE_MIN)}
                  max={String(ANGLE_MAX)}
                  step="1"
                  value={angle}
                  onChange={(event) =>
                    setAngle(clamp(Number(event.target.value), ANGLE_MIN, ANGLE_MAX))
                  }
                />
              </label>
              <label style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <span className="eap-instruction" style={{ animation: 'none', textAlign: 'left' }}>
                  draw {Math.round(power)}
                </span>
                <input
                  type="range"
                  min={String(POWER_MIN)}
                  max={String(POWER_MAX)}
                  step="1"
                  value={power}
                  onChange={(event) =>
                    setPower(clamp(Number(event.target.value), POWER_MIN, POWER_MAX))
                  }
                />
              </label>
            </div>

            <div className="eap-mode-buttons">
              <button className="eap-btn-primary" onClick={fireArrow}>
                Loose Arrow
              </button>
            </div>
            <p className="eap-instruction">
              watch the glowing eye in the water, use the short launch cue, and read the vertical draw meter on the right
            </p>
          </>
        )}

        {phase === 'flying' && (
          <p className="eap-instruction">arrow in flight...</p>
        )}

        {phase === 'result' && lastShot && (
          <>
            <div
              style={{
                width: '100%',
                display: 'grid',
                gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
                gap: 10,
              }}
            >
              <StatBlock label="Shot" value={lastShot.score} accent />
              <StatBlock label="Call" value={describeShot(lastShot)} />
              <StatBlock label="Miss" value={formatDistance(lastShot.minDistance)} />
            </div>

            <div className="eap-mode-buttons">
              <button className="eap-btn-primary" onClick={advanceRound}>
                {roundIndex >= ROUND_COUNT - 1 ? 'See Score' : 'Next Fish'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
