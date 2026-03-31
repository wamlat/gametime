import { useEffect, useState } from 'react'
import type { RoundResult as RoundResultType } from '../types'
import { scoreLabel } from '../scoring'
import { SCORE_REVEAL_DURATION_MS } from '../constants'

interface Props {
  result: RoundResultType
  onContinue: () => void
  isLastRound: boolean
}

export function RoundResult({ result, onContinue, isLastRound }: Props) {
  const [displayScore, setDisplayScore] = useState(0)
  const target = Math.round(result.targetProportion * 100)
  const erased = Math.round(result.proportionErased * 100)
  const diff = erased - target

  useEffect(() => {
    const start = performance.now()
    const target = result.score
    function animate(ts: number) {
      const p = Math.min((ts - start) / SCORE_REVEAL_DURATION_MS, 1)
      setDisplayScore(Math.round(target * p * 100) / 100)
      if (p < 1) requestAnimationFrame(animate)
    }
    requestAnimationFrame(animate)
  }, [result.score])

  const barWidth = Math.min(Math.abs(result.proportionErased - result.targetProportion) / 0.9, 1)
  const isGood = result.score < 2

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 12,
        animation: 'slideUp 280ms cubic-bezier(0.16,1,0.3,1) both',
        width: '100%',
      }}
    >
      <div style={{ display: 'flex', gap: 20, alignItems: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <div
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: 10,
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              color: 'var(--color-muted)',
              marginBottom: 2,
            }}
          >
            target
          </div>
          <div
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: 32,
              color: 'var(--color-text)',
            }}
          >
            {target}%
          </div>
        </div>

        <div
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 18,
            color: 'var(--color-muted)',
          }}
        >
          →
        </div>

        <div style={{ textAlign: 'center' }}>
          <div
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: 10,
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              color: 'var(--color-muted)',
              marginBottom: 2,
            }}
          >
            you ate
          </div>
          <div
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: 32,
              color: diff === 0 ? 'var(--color-success)' : diff > 0 ? '#f0a050' : '#e06060',
            }}
          >
            {erased}%
          </div>
        </div>
      </div>

      {/* Score bar */}
      <div
        style={{
          width: '100%',
          maxWidth: 280,
          height: 4,
          background: '#222220',
          borderRadius: 2,
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            height: '100%',
            width: `${barWidth * 100}%`,
            background: isGood ? 'var(--color-success)' : 'var(--color-danger)',
            borderRadius: 2,
            transition: `width ${SCORE_REVEAL_DURATION_MS}ms cubic-bezier(0.16,1,0.3,1)`,
          }}
        />
      </div>

      <div style={{ display: 'flex', gap: 10, alignItems: 'baseline' }}>
        <span
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: 28,
            color: isGood ? 'var(--color-success)' : 'var(--color-text)',
          }}
        >
          {displayScore}
        </span>
        <span
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 11,
            color: isGood ? 'var(--color-success)' : 'var(--color-muted)',
            letterSpacing: '0.08em',
          }}
        >
          {scoreLabel(result.score)}
        </span>
      </div>

      <button
        onClick={onContinue}
        style={{
          fontFamily: 'var(--font-sans)',
          fontWeight: 600,
          fontSize: 14,
          background: 'var(--color-bg)',
          color: 'var(--color-card)',
          border: 'none',
          borderRadius: 'var(--radius-md)',
          padding: '10px 24px',
          cursor: 'pointer',
          marginTop: 4,
          transition: 'transform 120ms ease',
        }}
        onMouseEnter={(e) => {
          (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1.04)'
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLButtonElement).style.transform = ''
        }}
      >
        {isLastRound ? 'See Results' : 'Continue'}
      </button>
    </div>
  )
}
