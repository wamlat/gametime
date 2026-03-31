import { useState } from 'react'
import type { RoundResult } from '../types'
import { totalScoreLabel } from '../scoring'
import { buildShareUrl, buildChallengeUrl } from '../shareUrl'

interface Props {
  rounds: RoundResult[]
  seed: string
  totalScore: number
  onPlayAgain: () => void
}

export function GameOver({ rounds, seed, totalScore, onPlayAgain }: Props) {
  const [copied, setCopied] = useState<'results' | 'challenge' | null>(null)

  const scores = rounds.map((r) => r.score)

  async function copyToClipboard(text: string, type: 'results' | 'challenge') {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(type)
      setTimeout(() => setCopied(null), 2000)
    } catch {
      // fallback
      const el = document.createElement('textarea')
      el.value = text
      document.body.appendChild(el)
      el.select()
      document.execCommand('copy')
      document.body.removeChild(el)
      setCopied(type)
      setTimeout(() => setCopied(null), 2000)
    }
  }

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 24,
        width: '100%',
        animation: 'slideUp 300ms cubic-bezier(0.16,1,0.3,1) both',
      }}
    >
      <div style={{ textAlign: 'center' }}>
        <div
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: 'clamp(52px, 12vw, 80px)',
            color: 'var(--color-accent)',
            lineHeight: 1,
            letterSpacing: '-0.02em',
          }}
        >
          {totalScore}
        </div>
        <div
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 11,
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            color: 'var(--color-muted)',
            marginTop: 4,
          }}
        >
          {totalScoreLabel(totalScore)}
        </div>
      </div>

      {/* Round breakdown */}
      <div style={{ width: '100%', maxWidth: 380 }}>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr 1fr 1fr',
            gap: 4,
            marginBottom: 6,
          }}
        >
          {['round', 'target', 'you ate', 'score'].map((h) => (
            <span
              key={h}
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: 9,
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
                color: '#555553',
                textAlign: 'center',
              }}
            >
              {h}
            </span>
          ))}
        </div>
        {rounds.map((r, i) => (
          <div
            key={i}
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr 1fr 1fr',
              gap: 4,
              padding: '6px 0',
              borderTop: '1px solid #1e1e1c',
            }}
          >
            <span
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: 12,
                color: 'var(--color-muted)',
                textAlign: 'center',
              }}
            >
              {i + 1}
            </span>
            <span
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: 12,
                color: 'var(--color-text)',
                textAlign: 'center',
              }}
            >
              {Math.round(r.targetProportion * 100)}%
            </span>
            <span
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: 12,
                color: 'var(--color-text)',
                textAlign: 'center',
              }}
            >
              {Math.round(r.proportionErased * 100)}%
            </span>
            <span
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: 12,
                color: r.score < 2 ? 'var(--color-success)' : 'var(--color-text)',
                textAlign: 'center',
              }}
            >
              {r.score}
            </span>
          </div>
        ))}
      </div>

      {/* Action buttons */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, width: '100%', maxWidth: 320 }}>
        <button
          onClick={() => copyToClipboard(buildShareUrl(seed, scores), 'results')}
          style={{
            fontFamily: 'var(--font-sans)',
            fontWeight: 600,
            fontSize: 14,
            background: 'var(--color-bg)',
            color: 'var(--color-card)',
            border: 'none',
            borderRadius: 'var(--radius-md)',
            padding: '12px 20px',
            cursor: 'pointer',
            transition: 'transform 120ms ease, opacity 120ms ease',
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1.02)'
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLButtonElement).style.transform = ''
          }}
        >
          {copied === 'results' ? 'Copied!' : 'Share My Results'}
        </button>

        <button
          onClick={() => copyToClipboard(buildChallengeUrl(seed), 'challenge')}
          style={{
            fontFamily: 'var(--font-sans)',
            fontWeight: 500,
            fontSize: 13,
            background: 'transparent',
            color: 'var(--color-muted)',
            border: '1px solid var(--color-card-border)',
            borderRadius: 'var(--radius-md)',
            padding: '10px 20px',
            cursor: 'pointer',
            transition: 'color 120ms ease, border-color 120ms ease',
          }}
          onMouseEnter={(e) => {
            const b = e.currentTarget as HTMLButtonElement
            b.style.color = 'var(--color-text)'
            b.style.borderColor = '#555553'
          }}
          onMouseLeave={(e) => {
            const b = e.currentTarget as HTMLButtonElement
            b.style.color = 'var(--color-muted)'
            b.style.borderColor = 'var(--color-card-border)'
          }}
        >
          {copied === 'challenge' ? 'Copied!' : 'Challenge a Friend'}
        </button>

        <button
          onClick={onPlayAgain}
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
            transition: 'color 120ms ease',
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLButtonElement).style.color = 'var(--color-muted)'
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLButtonElement).style.color = '#444442'
          }}
        >
          Play Again
        </button>
      </div>
    </div>
  )
}
