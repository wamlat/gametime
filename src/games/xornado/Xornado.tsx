import { useEffect, useRef, useState } from 'react'
import './index.css'
import { generatePuzzle } from './logic'
import type { Puzzle } from './logic'

const GAME_SECONDS = 60

type Phase = 'lobby' | 'playing' | 'complete'

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

export default function Xornado() {
  const [phase, setPhase] = useState<Phase>('lobby')
  const [timeLeft, setTimeLeft] = useState(GAME_SECONDS)
  const [score, setScore] = useState(0)
  const [input, setInput] = useState('')
  const [mistakes, setMistakes] = useState(0)
  const [puzzle, setPuzzle] = useState<Puzzle>(() => generatePuzzle())

  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (phase !== 'playing') return
    if (timeLeft <= 0) {
      setPhase('complete')
      return
    }

    const timeout = window.setTimeout(() => {
      setTimeLeft((current) => current - 1)
    }, 1000)

    return () => window.clearTimeout(timeout)
  }, [phase, timeLeft])

  useEffect(() => {
    if (phase === 'playing') {
      inputRef.current?.focus()
    }
  }, [phase, puzzle])

  function startRun() {
    setPhase('playing')
    setTimeLeft(GAME_SECONDS)
    setScore(0)
    setMistakes(0)
    setInput('')
    setPuzzle(generatePuzzle())
  }

  function handleInputChange(nextValue: string) {
    const sanitized = nextValue.replace(/[^01]/g, '').slice(0, 5)
    setInput(sanitized)

    if (sanitized.length !== 5) return

    if (sanitized === puzzle.answer) {
      setScore((current) => current + 1)
      setInput('')
      setPuzzle(generatePuzzle())
      return
    }

    setMistakes((current) => current + 1)
    setInput('')
  }

  if (phase === 'lobby') {
    return (
      <div className="eap-wrapper">
        <div className="eap-card" style={{ maxWidth: 560 }}>
          <h1 className="eap-lobby-title">xornado.</h1>
          <p className="eap-lobby-desc">
            Two random five-bit binary numbers. One random logical operator. Type the correct
            five-bit result as fast as you can for sixty seconds.
          </p>
          <p className="eap-lobby-meta">
            Tag: numerical · operators: AND OR NOR XOR · score = solved puzzles in 60s
          </p>
          <div className="eap-mode-buttons">
            <button className="eap-btn-primary" onClick={startRun}>
              Start Storm
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
              {score}
            </div>
            <p className="eap-lobby-desc" style={{ marginTop: 14, textAlign: 'center' }}>
              puzzles solved before the timer expired.
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
            <StatCard label="Score" value={score} accent />
            <StatCard label="Mistakes" value={mistakes} />
            <StatCard label="Mode" value="Solo" />
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
          <StatCard label="Time Left" value={`${timeLeft}s`} accent />
          <StatCard label="Score" value={score} />
          <StatCard label="Mistakes" value={mistakes} />
        </div>

        <div
          style={{
            width: '100%',
            maxWidth: 520,
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--color-card-border)',
            background:
              'radial-gradient(circle at 50% 20%, rgba(232,131,42,0.14), transparent 26%), linear-gradient(180deg, rgba(255,255,255,0.03), rgba(255,255,255,0.012))',
            padding: '28px 22px 24px',
            boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.03)',
          }}
        >
          <div
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: 11,
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              color: 'var(--color-muted)',
              marginBottom: 18,
              textAlign: 'center',
            }}
          >
            compute the result
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr auto 1fr',
              gap: 14,
              alignItems: 'center',
              marginBottom: 20,
            }}
          >
            <div className="xornado-word">{puzzle.left}</div>
            <div className="xornado-op">{puzzle.op}</div>
            <div className="xornado-word">{puzzle.right}</div>
          </div>

          <input
            ref={inputRef}
            value={input}
            onChange={(event) => handleInputChange(event.target.value)}
            inputMode="numeric"
            autoComplete="off"
            spellCheck={false}
            className="xornado-input"
            placeholder="_____"
            maxLength={5}
          />
        </div>

        <p className="eap-instruction">
          type a five-bit answer using only 0 and 1. correct answers advance instantly.
        </p>
      </div>
    </div>
  )
}
