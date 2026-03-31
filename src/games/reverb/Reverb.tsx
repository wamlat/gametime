import { FormEvent, useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import './index.css'
import { generatePromptForRound, getLengthForRound, markSeedAsPlayed, MAX_LENGTH, MAX_ROUNDS, generateUnusedSeed } from './seed'
import { buildChallengeUrl, buildShareUrl } from './shareUrl'

type Phase = 'lobby' | 'revealing' | 'typing' | 'complete'
type LossReason = 'incorrect' | 'timeout'

const DURATIONS = [1, 2, 5] as const
const ANSWER_SECONDS = 10

interface ReverbProps {
  seed: string
  initialFlashSeconds: (typeof DURATIONS)[number]
  alreadyPlayed: boolean
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

export default function Reverb({ seed, initialFlashSeconds, alreadyPlayed }: ReverbProps) {
  const navigate = useNavigate()
  const [phase, setPhase] = useState<Phase>('lobby')
  const [flashSeconds, setFlashSeconds] = useState<(typeof DURATIONS)[number]>(initialFlashSeconds)
  const [round, setRound] = useState(0)
  const [prompt, setPrompt] = useState('')
  const [answer, setAnswer] = useState('')
  const [correctPrompts, setCorrectPrompts] = useState<string[]>([])
  const [lastMiss, setLastMiss] = useState('')
  const [lossReason, setLossReason] = useState<LossReason>('incorrect')
  const [clearedAll, setClearedAll] = useState(false)
  const [answerSecondsLeft, setAnswerSecondsLeft] = useState(ANSWER_SECONDS)
  const [copied, setCopied] = useState<'results' | 'challenge' | null>(null)

  const revealTimeoutRef = useRef<number | null>(null)
  const answerTimerRef = useRef<number | null>(null)
  const copiedTimeoutRef = useRef<number | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const targetLength = useMemo(() => getLengthForRound(round), [round])
  const score = correctPrompts.length
  const longestClear = correctPrompts.length > 0 ? correctPrompts[correctPrompts.length - 1].length : 0

  useEffect(() => {
    return () => {
      if (revealTimeoutRef.current !== null) {
        window.clearTimeout(revealTimeoutRef.current)
      }
      if (answerTimerRef.current !== null) {
        window.clearInterval(answerTimerRef.current)
      }
      if (copiedTimeoutRef.current !== null) {
        window.clearTimeout(copiedTimeoutRef.current)
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
    if (revealTimeoutRef.current !== null) {
      window.clearTimeout(revealTimeoutRef.current)
      revealTimeoutRef.current = null
    }
  }

  function clearAnswerTimer() {
    if (answerTimerRef.current !== null) {
      window.clearInterval(answerTimerRef.current)
      answerTimerRef.current = null
    }
  }

  function startAnswerTimer() {
    clearAnswerTimer()
    setAnswerSecondsLeft(ANSWER_SECONDS)

    answerTimerRef.current = window.setInterval(() => {
      setAnswerSecondsLeft((current) => {
        if (current <= 1) {
          clearAnswerTimer()
          setLastMiss('')
          setLossReason('timeout')
          setPhase('complete')
          return 0
        }

        return current - 1
      })
    }, 1000)
  }

  function beginRound(nextRound: number) {
    clearRevealTimeout()
    clearAnswerTimer()

    const nextPrompt = generatePromptForRound(seed, nextRound)

    setRound(nextRound)
    setPrompt(nextPrompt)
    setAnswer('')
    setPhase('revealing')
    setAnswerSecondsLeft(ANSWER_SECONDS)

    revealTimeoutRef.current = window.setTimeout(() => {
      setPhase('typing')
      startAnswerTimer()
      revealTimeoutRef.current = null
    }, flashSeconds * 1000)
  }

  function startRun() {
    if (alreadyPlayed) {
      return
    }

    markSeedAsPlayed(seed)
    setCopied(null)
    setCorrectPrompts([])
    setLastMiss('')
    setLossReason('incorrect')
    setClearedAll(false)
    beginRound(0)
  }

  function goToFreshSeed() {
    const nextSeed = generateUnusedSeed(seed)
    navigate(`/reverb?seed=${encodeURIComponent(nextSeed)}&flash=${flashSeconds}`)
  }

  function handleAnswerChange(nextValue: string) {
    const sanitized = nextValue.toUpperCase().replace(/[^A-Z]/g, '').slice(0, targetLength)
    setAnswer(sanitized)
  }

  function finishCopy(type: 'results' | 'challenge') {
    setCopied(type)
    if (copiedTimeoutRef.current !== null) {
      window.clearTimeout(copiedTimeoutRef.current)
    }
    copiedTimeoutRef.current = window.setTimeout(() => setCopied(null), 2000)
  }

  async function copyToClipboard(text: string, type: 'results' | 'challenge') {
    try {
      await navigator.clipboard.writeText(text)
      finishCopy(type)
    } catch {
      const element = document.createElement('textarea')
      element.value = text
      document.body.appendChild(element)
      element.select()
      document.execCommand('copy')
      document.body.removeChild(element)
      finishCopy(type)
    }
  }

  function submitAnswer(event?: FormEvent<HTMLFormElement>) {
    event?.preventDefault()

    if (phase !== 'typing' || answer.length !== targetLength) {
      return
    }

    clearAnswerTimer()

    if (answer === prompt) {
      const nextCorrectPrompts = [...correctPrompts, prompt]
      setCorrectPrompts(nextCorrectPrompts)

      if (nextCorrectPrompts.length >= MAX_ROUNDS) {
        setClearedAll(true)
        setPhase('complete')
        return
      }

      beginRound(round + 1)
      return
    }

    setLastMiss(answer)
    setLossReason('incorrect')
    setPhase('complete')
  }

  if (phase === 'lobby') {
    if (alreadyPlayed) {
      return (
        <div className="eap-wrapper">
          <div className="eap-card" style={{ maxWidth: 560 }}>
            <h1 className="eap-lobby-title">reverb.</h1>
            <p className="eap-lobby-desc">
              This browser has already played seed <strong>{seed}</strong>. Challenge seeds are one-and-done here, so
              a replay needs a fresh seed.
            </p>
            <p className="eap-lobby-meta">
              Category: verbal · one play per seed per browser · flash {flashSeconds}s
            </p>
            <div className="eap-mode-buttons">
              <button className="eap-btn-primary" onClick={goToFreshSeed}>
                Fresh Seed
              </button>
            </div>
          </div>
        </div>
      )
    }

    return (
      <div className="eap-wrapper">
        <div className="eap-card" style={{ maxWidth: 560 }}>
          <h1 className="eap-lobby-title">reverb.</h1>
          <p className="eap-lobby-desc">
            A solo verbal memory game. Watch a string of letters flash on screen, then type it back
            exactly after it disappears. Every correct answer makes the next string one character longer.
          </p>
          <p className="eap-lobby-meta">
            Category: verbal · solo or challenge mode · 10-second answer timer · max string length 50
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
              Solo
            </button>
            <button
              className="eap-btn-secondary"
              onClick={() => {
                navigator.clipboard.writeText(buildChallengeUrl(seed, flashSeconds)).catch(() => {})
                startRun()
              }}
            >
              Copy &amp; Challenge
            </button>
          </div>
        </div>
      </div>
    )
  }

  if (phase === 'complete') {
    return (
      <div className="eap-wrapper">
        <div className="eap-card" style={{ maxWidth: 880 }}>
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
              {clearedAll
                ? 'you cleared the full 50-letter ladder.'
                : lossReason === 'timeout'
                  ? 'letters remembered before the answer clock expired.'
                  : 'letters remembered before the first wrong answer.'}
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
            <StatCard label="Flash" value={`${flashSeconds}s`} />
            <StatCard label="Result" value={clearedAll ? 'Perfect' : lossReason === 'timeout' ? 'Time' : 'Miss'} />
          </div>

          <div className="reverb-complete-layout">
            <div className="reverb-stage" style={{ minHeight: 'unset' }}>
              <div className="reverb-stage-label">{clearedAll ? 'full clear' : 'final round'}</div>
              <div className="reverb-helper-row">
                <span>{clearedAll ? `max length ${MAX_LENGTH}` : `target ${prompt}`}</span>
                <span>
                  {clearedAll ? 'every string solved' : lossReason === 'timeout' ? 'time ran out' : `your answer ${lastMiss || 'none'}`}
                </span>
              </div>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
                  gap: 10,
                }}
              >
                <StatCard label="Needed Length" value={clearedAll ? MAX_LENGTH : prompt.length} />
                <StatCard label="Answer Timer" value={`${ANSWER_SECONDS}s`} />
              </div>
            </div>

            <aside className="reverb-sidebar">
              <div className="reverb-stage-label" style={{ textAlign: 'left' }}>
                cleared strings
              </div>
              {correctPrompts.length === 0 ? (
                <div className="reverb-sidebar-empty">No strings cleared this run yet.</div>
              ) : (
                <div className="reverb-history-list">
                  {correctPrompts.map((word, index) => (
                    <div key={`${index}-${word}`} className="reverb-history-item">
                      <span className="reverb-history-round">#{index + 1}</span>
                      <span className="reverb-history-word">{word}</span>
                    </div>
                  ))}
                </div>
              )}
            </aside>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, width: '100%', maxWidth: 320 }}>
            <button
              className="eap-btn-primary"
              onClick={() => copyToClipboard(buildShareUrl(seed, flashSeconds, score), 'results')}
            >
              {copied === 'results' ? 'Copied!' : 'Share My Results'}
            </button>

            <button
              className="eap-btn-secondary"
              onClick={() => copyToClipboard(buildChallengeUrl(seed, flashSeconds), 'challenge')}
            >
              {copied === 'challenge' ? 'Copied!' : 'Challenge a Friend'}
            </button>

            <button
              onClick={goToFreshSeed}
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: 11,
                color: '#444442',
                background: 'transparent',
                border: 'none',
                padding: '6px',
                cursor: 'pointer',
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
              }}
            >
              Fresh Seed
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
            gridTemplateColumns: 'repeat(4, minmax(0, 1fr))',
            gap: 10,
          }}
        >
          <StatCard label="Score" value={score} accent />
          <StatCard label="Length" value={targetLength} />
          <StatCard label="Flash" value={`${flashSeconds}s`} />
          <StatCard label="Timer" value={phase === 'typing' ? `${answerSecondsLeft}s` : 'Standby'} />
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
                <span>{phase === 'typing' ? `${answerSecondsLeft}s left` : 'letters only'}</span>
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
            : 'you have 10 seconds to answer, and submission unlocks only at the exact length'}
        </p>
      </div>
    </div>
  )
}
