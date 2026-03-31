import { useLocation } from 'react-router-dom'

const gameNames: Record<string, string> = {
  '/easy-as-pie': 'easy as pie',
  '/intricate-extricate': 'intricate extricate',
  '/fisheye': 'fisheye',
}

export default function StatusBar() {
  const location = useLocation()
  const gameName = gameNames[location.pathname]

  return (
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
  )
}
