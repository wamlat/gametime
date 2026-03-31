import { useEffect, useRef, useState } from 'react'
import './index.css'
import {
  BPM_MAX,
  BPM_MIN,
  ROUND_COUNT,
  generateTempoRounds,
  scoreGuess,
  scoreLabel,
} from './logic'
import type { TempoRound } from './logic'

type Phase = 'lobby' | 'guessing' | 'result' | 'complete'

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

export default function TempoTap() {
  const [phase, setPhase] = useState<Phase>('lobby')
  const [rounds, setRounds] = useState<TempoRound[]>(() => generateTempoRounds())
  const [roundIndex, setRoundIndex] = useState(0)
  const [guess, setGuess] = useState(110)
  const [results, setResults] = useState<RoundResult[]>([])
  const [isPlaying, setIsPlaying] = useState(false)

  const audioContextRef = useRef<AudioContext | null>(null)
  const playbackTimeoutsRef = useRef<number[]>([])
  const stopTimeoutRef = useRef<number | null>(null)

  const currentRound = rounds[roundIndex] ?? rounds[rounds.length - 1]
  const currentTarget = currentRound.bpm
  const currentSampleSeconds = currentRound.sampleSeconds
  const totalError = results.reduce((sum, result) => sum + result.error, 0)
  const lastResult = results[results.length - 1]
  const bestRound = results.length > 0 ? Math.min(...results.map((result) => result.error)) : 0

  useEffect(() => {
    return () => {
      playbackTimeoutsRef.current.forEach((timeout) => window.clearTimeout(timeout))
      if (stopTimeoutRef.current !== null) window.clearTimeout(stopTimeoutRef.current)
      audioContextRef.current?.close().catch(() => {})
    }
  }, [])

  async function ensureAudioContext() {
    if (!audioContextRef.current) {
      audioContextRef.current = new window.AudioContext()
    }
    if (audioContextRef.current.state === 'suspended') {
      await audioContextRef.current.resume()
    }
    return audioContextRef.current
  }

  async function playSample(targetBpm: number, sampleSeconds: number) {
    const context = await ensureAudioContext()

    playbackTimeoutsRef.current.forEach((timeout) => window.clearTimeout(timeout))
    playbackTimeoutsRef.current = []
    if (stopTimeoutRef.current !== null) window.clearTimeout(stopTimeoutRef.current)

    setIsPlaying(true)
    const beatIntervalMs = (60 / targetBpm) * 1000
    const beatCount = Math.max(1, Math.floor((sampleSeconds * 1000) / beatIntervalMs))

    for (let i = 0; i < beatCount; i++) {
      const timeout = window.setTimeout(() => {
        const oscillator = context.createOscillator()
        const gain = context.createGain()
        oscillator.type = i % 4 === 0 ? 'triangle' : 'sine'
        oscillator.frequency.value = i % 4 === 0 ? 1440 : 980
        gain.gain.setValueAtTime(i % 4 === 0 ? 0.18 : 0.11, context.currentTime)
        gain.gain.exponentialRampToValueAtTime(0.0001, context.currentTime + 0.085)
        oscillator.connect(gain)
        gain.connect(context.destination)
        oscillator.start()
        oscillator.stop(context.currentTime + 0.09)
      }, i * beatIntervalMs)

      playbackTimeoutsRef.current.push(timeout)
    }

    stopTimeoutRef.current = window.setTimeout(() => {
      setIsPlaying(false)
      stopTimeoutRef.current = null
    }, sampleSeconds * 1000 + 80)
  }

  function stopPlayback() {
    playbackTimeoutsRef.current.forEach((timeout) => window.clearTimeout(timeout))
    playbackTimeoutsRef.current = []
    if (stopTimeoutRef.current !== null) {
      window.clearTimeout(stopTimeoutRef.current)
      stopTimeoutRef.current = null
    }
    setIsPlaying(false)
  }

  function startRun() {
    stopPlayback()
    const nextRounds = generateTempoRounds()
    setRounds(nextRounds)
    setRoundIndex(0)
    setGuess(110)
    setResults([])
    setPhase('guessing')
    setIsPlaying(false)
    void playSample(nextRounds[0].bpm, nextRounds[0].sampleSeconds)
  }

  function submitGuess() {
    stopPlayback()
    const error = scoreGuess(currentTarget, guess)
    setResults((current) => [...current, { target: currentTarget, guess, error }])
    setPhase('result')
  }

  function nextRound() {
    stopPlayback()
    if (roundIndex >= ROUND_COUNT - 1) {
      setPhase('complete')
      return
    }

    const nextRoundIndex = roundIndex + 1
    const nextRound = rounds[nextRoundIndex]
    setRoundIndex(nextRoundIndex)
    setGuess(110)
    setPhase('guessing')
    setIsPlaying(false)
    void playSample(nextRound.bpm, nextRound.sampleSeconds)
  }

  if (phase === 'lobby') {
    return (
      <div className="eap-wrapper">
        <div className="eap-card" style={{ maxWidth: 560 }}>
          <h1 className="eap-lobby-title">tempo tap.</h1>
          <p className="eap-lobby-desc">
            Hear a short pulse sample between three and five seconds and estimate its tempo in beats
            per minute. Five rounds, lowest total error wins.
          </p>
          <p className="eap-lobby-meta">
            Single player only · synthetic rhythm samples · one autoplayed sample per round
          </p>
          <div className="eap-mode-buttons">
            <button className="eap-btn-primary" onClick={startRun}>
              Start Listening
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
              across {ROUND_COUNT} samples. Lower is better.
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
          <StatCard label="Sample" value={`${currentSampleSeconds}s`} />
        </div>

        <div
          style={{
            width: '100%',
            maxWidth: 520,
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--color-card-border)',
            background:
              'radial-gradient(circle at 50% 20%, rgba(232,131,42,0.18), transparent 22%), linear-gradient(180deg, rgba(255,255,255,0.04), rgba(255,255,255,0.015))',
            padding: '26px 22px 24px',
            boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.03)',
          }}
        >
          <div
            style={{
              width: '100%',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 18,
            }}
          >
            <div
              style={{
                width: '100%',
                display: 'grid',
                gridTemplateColumns: 'repeat(5, 1fr)',
                gap: 8,
                alignItems: 'end',
                minHeight: 132,
              }}
            >
              {Array.from({ length: 20 }).map((_, index) => {
                const active = isPlaying && index < 20
                const beatPulse = isPlaying && index % 4 === 0
                const height = 32 + ((index * 17) % 68)

                return (
                  <div
                    key={index}
                    style={{
                      height,
                      borderRadius: 999,
                      background: beatPulse
                        ? 'linear-gradient(180deg, rgba(255,214,158,0.95), rgba(232,131,42,0.9))'
                        : active
                          ? 'rgba(250,247,242,0.9)'
                          : 'rgba(255,255,255,0.08)',
                      opacity: isPlaying ? 1 : 0.72,
                      transform: isPlaying ? `scaleY(${1 + ((index % 3) * 0.08)})` : 'scaleY(1)',
                      transition: 'background 120ms ease, transform 120ms ease, opacity 120ms ease',
                    }}
                  />
                )
              })}
            </div>

            <div
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: 'clamp(56px, 12vw, 88px)',
                color: 'var(--color-accent)',
                lineHeight: 1,
                letterSpacing: '-0.04em',
              }}
            >
              {guess}
            </div>

            <div
              style={{
                width: '100%',
                display: 'flex',
                flexDirection: 'column',
                gap: 8,
              }}
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  fontFamily: 'var(--font-mono)',
                  fontSize: 11,
                  color: 'var(--color-muted)',
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                }}
              >
                <span>{BPM_MIN} bpm</span>
                <span>your guess</span>
                <span>{BPM_MAX} bpm</span>
              </div>
              <input
                type="range"
                min={String(BPM_MIN)}
                max={String(BPM_MAX)}
                step="1"
                value={guess}
                onChange={(event) => setGuess(Number(event.target.value))}
                style={{ width: '100%', accentColor: '#e8832a' }}
              />
            </div>
          </div>
        </div>

        {phase === 'guessing' && (
          <>
            <div className="eap-mode-buttons">
              <button className="eap-btn-primary" onClick={submitGuess} disabled={isPlaying}>
                Lock In
              </button>
            </div>
            <p className="eap-instruction">
              {isPlaying
                ? `listen closely: the ${currentSampleSeconds}-second sample is playing now`
                : 'sample finished. estimate the bpm and lock it in'}
            </p>
          </>
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
              <StatCard label="Target" value={`${lastResult.target}`} />
              <StatCard label="Your Guess" value={`${lastResult.guess}`} accent />
              <StatCard label="Error" value={`${lastResult.error}`} />
            </div>
            <p className="eap-instruction" style={{ animation: 'none' }}>
              {scoreLabel(lastResult.error)}
            </p>
            <div className="eap-mode-buttons">
              <button className="eap-btn-primary" onClick={nextRound}>
                {roundIndex >= ROUND_COUNT - 1 ? 'See Score' : 'Next Sample'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
