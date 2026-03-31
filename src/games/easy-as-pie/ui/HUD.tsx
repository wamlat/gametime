interface HUDProps {
  round: number        // 0-indexed
  target: number
  totalScore: number
  roundCount: number
}

export function HUD({ round, target, totalScore, roundCount }: HUDProps) {
  const pct = Math.round(target * 100)

  return (
    <div
      style={{
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 4,
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          width: '100%',
          marginBottom: 8,
        }}
      >
        <span
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 11,
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            color: 'var(--color-muted)',
          }}
        >
          Round {round + 1} / {roundCount}
        </span>
        {totalScore > 0 && (
          <span
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: 11,
              letterSpacing: '0.06em',
              color: 'var(--color-muted)',
            }}
          >
            score: {totalScore}
          </span>
        )}
      </div>

      <div
        style={{
          fontFamily: 'var(--font-display)',
          fontSize: 'clamp(64px, 14vw, 96px)',
          color: 'var(--color-accent)',
          lineHeight: 1,
          letterSpacing: '-0.03em',
        }}
      >
        {pct}%
      </div>

      <span
        style={{
          fontFamily: 'var(--font-mono)',
          fontSize: 11,
          letterSpacing: '0.12em',
          textTransform: 'uppercase',
          color: 'var(--color-muted)',
          marginTop: 2,
        }}
      >
        eat this much
      </span>
    </div>
  )
}
