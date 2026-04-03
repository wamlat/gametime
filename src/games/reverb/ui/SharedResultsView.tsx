import { Link } from 'react-router-dom'
import { useState } from 'react'
import { buildChallengeUrl } from '../shareUrl'

interface Props {
  seed: string
  flashSeconds: number
  score: number
  mode: 'random' | 'dictionary'
}

export function SharedResultsView({ seed, flashSeconds, score, mode }: Props) {
  const [copied, setCopied] = useState(false)

  async function copyChallenge() {
    try {
      await navigator.clipboard.writeText(buildChallengeUrl(seed, flashSeconds, mode))
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
            someone reached
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
            {score}
          </div>
          <div
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: 11,
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              color: 'var(--color-muted)',
              marginTop: 8,
            }}
          >
            flash {flashSeconds}s · 10s answer clock · can you beat them?
          </div>
        </div>

        <div
          style={{
            width: '100%',
            borderRadius: 'var(--radius-md)',
            border: '1px solid #1e1e1c',
            padding: '18px 16px',
            display: 'flex',
            flexDirection: 'column',
            gap: 10,
          }}
        >
          <div
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: 10,
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              color: '#555553',
            }}
          >
            challenge rules
          </div>
          <div style={{ fontFamily: 'var(--font-sans)', fontSize: 14, color: 'var(--color-muted)', lineHeight: 1.6 }}>
            The link contains the seed and flash setting, but not the strings themselves. You will
            see the same sequence only when you start the run.
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, width: '100%' }}>
          <Link
            to={`/reverb?seed=${encodeURIComponent(seed)}&flash=${flashSeconds}&mode=${mode}`}
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
              display: 'block',
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
            }}
          >
            {copied ? 'Copied!' : 'Copy Challenge Link'}
          </button>
        </div>
      </div>
    </div>
  )
}
