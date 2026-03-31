import { FormEvent, useEffect, useMemo, useRef, useState } from 'react'
import './index.css'
import { generatePrompt, getLengthForRound } from './logic'

type Phase = 'lobby' | 'revealing' | 'typing' | 'complete'

const DURATIONS = [1, 2, 5] as const

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

export default function Reverb() {
  const [phase, setPhase] = useState<Phase>('lobby')
  const [flashSeconds, setFlashSeconds] = useState<(typeof DURATIONS)[number]>(1)
  const [round, setRound] = useState(0)
  const [prompt, setPrompt] = useState('')
  const [answer, setAnswer] = useState('')
  const [lastMiss, setLastMiss] = useState('')

  const timeoutRef = useRef<number | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const targetLength = useMemo(() => getLengthForRound(round), [round])
  const score = round
  const longestClear = round > 0 ? getLengthForRound(round - 1) : 0

  useEffect(() => {
    return () => {
      if (timeoutRef.current !== null) {
        window.clearTimeout(timeoutRef.current)
      }
    }
  }, [])

  useEffect(() => {
    if (phase === 'typing') {
      inputRef.current?.focus()
      inputRef.current?.select()
    }
  }, [phase, prompt])

  function clearRevealTimeout() {
    if (timeoutRef.current !== null) {
      window.clearTimeout(timeoutRef.current)
      timeoutRef.current = null
    }
  }

  function beginRound(nextRound: number) {
    clearRevealTimeout()
    const nextLength = getLengthForRound(nextRound)
    const nextPrompt = generatePrompt(nextLength)

    setRound(nextRound)
    setPrompt(nextPrompt)
    setAnswer('')
    setPhase('revealing')

    timeoutRef.current = window.setTimeout(() => {
      setPhase('typing')
      timeoutRef.current = null
    }, flashSeconds * 1000)
  }

  function startRun() {
    setLastMiss('')
    beginRound(0)
  }

  function handleAnswerChange(nextValue: string) {
    const sanitized = nextValue.toUpperCase().replace(/[^A-Z]/g, '').slice(0, targetLength)
    setAnswer(sanitized)
  }

  function submitAnswer(event?: FormEvent<HTMLFormElement>) {
    event?.preventDefault()

    if (phase !== 'typing' || answer.length !== targetLength) {
      return
    }

    if (answer === prompt) {
      beginRound(round + 1)
      return
    }

    setLastMiss(answer)
    setPhase('complete')
  }

  if (phase === 'lobby') {
    return (
      <div className="eap-wrapper">
        <div className="eap-card" style={{ maxWidth: 560 }}>
          <h1 className="eap-lobby-title">reverb.</h1>
          <p className="eap-lobby-desc">
            A solo verbal memory game. Watch a string of letters flash on screen, then type it back
            exactly after it disappears. Every correct answer makes the next string one character longer.
          </p>
          <p className="eap-lobby-meta">
            Category: verbal · solo only · run ends on your first incorrect string
          </p>

          <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div className="reverb-stage-label" style={{ textAlign: 'left' }}>
              flash duration
            </div>
            <div className="reverb-duration-grid">
              {DURATIONS.map((duration) => (
                <button
                  key={duration}
                  className={`reverb-duration-button${flashSeconds === duration ? ' is-active' : ''}`}
                  onClick={() => setFlashSeconds(duration)}
                  type="button"
                >
                  {duration}s
                </button>
              ))}
            </div>
          </div>

          <div className="eap-mode-buttons">
            <button className="eap-btn-primary" onClick={startRun}>
              Start Run
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
              longest clear
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
              {longestClear}
            </div>
            <p className="eap-lobby-desc" style={{ marginTop: 14, textAlign: 'center' }}>
              letters remembered before the miss.
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
            <StatCard label="Mode" value="Solo" />
            <StatCard label="Flash" value={`${flashSeconds}s`} />
          </div>

          <div className="reverb-stage" style={{ minHeight: 'unset' }}>
            <div className="reverb-stage-label">final round</div>
            <div className="reverb-helper-row">
              <span>target {prompt}</span>
              <span>your answer {lastMiss || 'none'}</span>
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
          <StatCard label="Score" value={score} accent />
          <StatCard label="Length" value={targetLength} />
          <StatCard label="Flash" value={`${flashSeconds}s`} />
        </div>

        <form onSubmit={submitAnswer} style={{ width: '100%', display: 'flex', justifyContent: 'center' }}>
          <div className="reverb-stage">
            <div className="reverb-stage-label">
              {phase === 'revealing' ? 'memorize the string' : 'type it back exactly'}
            </div>

            <div className={`reverb-prompt${phase === 'typing' ? ' is-hidden' : ''}`}>
              {phase === 'revealing' ? prompt : '?'.repeat(targetLength)}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <input
                ref={inputRef}
                className="reverb-answer"
                value={answer}
                onChange={(event) => handleAnswerChange(event.target.value)}
                placeholder={'_'.repeat(Math.max(3, targetLength))}
                autoComplete="off"
                spellCheck={false}
                maxLength={targetLength}
                disabled={phase !== 'typing'}
              />
              <div className="reverb-helper-row">
                <span>{phase === 'revealing' ? `visible for ${flashSeconds}s` : `${answer.length}/${targetLength} letters`}</span>
                <span>letters only</span>
              </div>
            </div>
          </div>
        </form>

        <div className="eap-mode-buttons">
          <button
            className="eap-btn-primary reverb-submit"
            onClick={() => submitAnswer()}
            disabled={phase !== 'typing' || answer.length !== targetLength}
            type="button"
          >
            Submit String
          </button>
        </div>

        <p className="eap-instruction">
          {phase === 'revealing'
            ? 'watch closely. the string disappears when the flash timer ends'
            : 'submission unlocks only when your answer matches the required length'}
        </p>
      </div>
    </div>
  )
}
