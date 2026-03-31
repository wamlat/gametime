import { Link, useLocation } from 'react-router-dom'

const gameNames: Record<string, string> = {
  '/easy-as-pie': 'easy as pie',
  '/intricate-extricate': 'intricate extricate',
  '/fisheye': 'fisheye',
  '/tempo-tap': 'tempo tap',
  '/xornado': 'xornado',
  '/reverb': 'reverb',
}

export default function StatusBar() {
  const location = useLocation()
  const gameName = gameNames[location.pathname]

  return (
    <>
      {gameName && (
        <Link
          to="/"
          style={{
            position: 'fixed',
            top: 18,
            left: 18,
            zIndex: 110,
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            padding: '10px 14px',
            borderRadius: 999,
            background: 'rgba(17,17,16,0.92)',
            border: '1px solid rgba(255,255,255,0.08)',
            color: 'var(--color-text)',
            fontFamily: 'var(--font-mono)',
            fontSize: 11,
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            boxShadow: '0 10px 24px rgba(0,0,0,0.22)',
            backdropFilter: 'blur(8px)',
          }}
        >
          <span style={{ fontSize: 13, lineHeight: 1 }}>{'<'}</span>
          <span>Back</span>
        </Link>
      )}

      <div
        style={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          height: 44,
          background: 'var(--color-card)',
          borderTop: '1px solid var(--color-card-border)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 var(--space-lg)',
          zIndex: 100,
        }}
      >
        <span
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 11,
            color: 'var(--color-muted)',
            letterSpacing: '0.08em',
          }}
        >
          gametime
        </span>

        {gameName && (
          <span
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: 11,
              color: 'var(--color-muted)',
              letterSpacing: '0.06em',
            }}
          >
            {gameName}
          </span>
        )}

        <span
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 11,
            color: '#444442',
            letterSpacing: '0.06em',
          }}
        >
          v1.0
        </span>
      </div>
    </>
  )
}
