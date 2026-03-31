import { Link } from 'react-router-dom'
import { generateTargets } from '../seed'
import { decodeScores } from '../shareUrl'
import { totalScoreLabel } from '../scoring'
import { buildChallengeUrl } from '../shareUrl'
import { useState } from 'react'

interface Props {
  seed: string
  encodedScores: string
}

export function SharedResultsView({ seed, encodedScores }: Props) {
  const [copied, setCopied] = useState(false)
  const scores = decodeScores(encodedScores)
  const targets = generateTargets(seed)
  const totalScore = Math.round(scores.reduce((a, b) => a + b, 0) * 100) / 100

  async function copyChallenge() {
    try {
      await navigator.clipboard.writeText(buildChallengeUrl(seed))
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      /* ignore */
    }
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'var(--color-bg)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '80px var(--space-lg) 100px',
      }}
    >
      <div
        style={{
          background: 'var(--color-card)',
          border: '1px solid var(--color-card-border)',
          borderRadius: 'var(--radius-xl)',
          padding: '40px 36px',
          maxWidth: 480,
          width: '100%',
          boxShadow: '0 32px 64px rgba(0,0,0,0.22)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 24,
        }}
      >
        <div style={{ textAlign: 'center' }}>
          <div
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: 20,
              color: 'var(--color-muted)',
              marginBottom: 6,
              fontStyle: 'italic',
            }}
          >
            someone scored
          </div>
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
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              color: 'var(--color-muted)',
              marginTop: 4,
            }}
          >
            {totalScoreLabel(totalScore)} · can you beat them?
          </div>
        </div>

        {/* Round breakdown */}
        <div style={{ width: '100%' }}>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr 1fr',
              gap: 4,
              marginBottom: 6,
            }}
          >
            {['round', 'target', 'their score'].map((h) => (
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
          {targets.map((t, i) => (
            <div
              key={i}
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr 1fr',
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
                {Math.round(t * 100)}%
              </span>
              <span
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: 12,
                  color: scores[i] < 2 ? 'var(--color-success)' : 'var(--color-text)',
                  textAlign: 'center',
                }}
              >
                {scores[i] ?? '—'}
              </span>
            </div>
          ))}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, width: '100%' }}>
          <Link
            to={`/easy-as-pie?seed=${seed}`}
            style={{
              fontFamily: 'var(--font-sans)',
              fontWeight: 700,
              fontSize: 15,
              background: 'var(--color-bg)',
              color: 'var(--color-card)',
              borderRadius: 'var(--radius-md)',
              padding: '12px 20px',
              textAlign: 'center',
              textDecoration: 'none',
              transition: 'transform 120ms ease',
              display: 'block',
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLAnchorElement).style.transform = 'scale(1.02)'
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLAnchorElement).style.transform = ''
            }}
          >
            Accept the Challenge
          </Link>

          <button
            onClick={copyChallenge}
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
            {copied ? 'Copied!' : 'Copy Challenge Link'}
          </button>
        </div>
      </div>
    </div>
  )
}
