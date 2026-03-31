interface ConfirmButtonProps {
  onConfirm: () => void
  onRedraw: () => void
}

export function ConfirmButton({ onConfirm, onRedraw }: ConfirmButtonProps) {
  return (
    <div
      style={{
        display: 'flex',
        gap: 10,
        alignItems: 'center',
        animation: 'slideUp 220ms cubic-bezier(0.16,1,0.3,1) both',
      }}
    >
      <button
        onClick={onConfirm}
        style={{
          fontFamily: 'var(--font-sans)',
          fontWeight: 700,
          fontSize: 16,
          background: 'var(--color-bg)',
          color: 'var(--color-card)',
          border: 'none',
          borderRadius: 'var(--radius-md)',
          padding: '12px 28px',
          cursor: 'pointer',
          transition: 'transform 120ms ease, box-shadow 120ms ease',
          boxShadow: '0 4px 16px rgba(0,0,0,0.3)',
        }}
        onMouseEnter={(e) => {
          (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1.04)'
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLButtonElement).style.transform = ''
        }}
      >
        Lock In
      </button>

      <button
        onClick={onRedraw}
        style={{
          fontFamily: 'var(--font-mono)',
          fontSize: 12,
          color: 'var(--color-muted)',
          background: 'transparent',
          border: '1px solid var(--color-card-border)',
          borderRadius: 'var(--radius-sm)',
          padding: '10px 16px',
          cursor: 'pointer',
          letterSpacing: '0.06em',
          transition: 'color 120ms ease, border-color 120ms ease',
        }}
        onMouseEnter={(e) => {
          const btn = e.currentTarget as HTMLButtonElement
          btn.style.color = 'var(--color-text)'
          btn.style.borderColor = '#555553'
        }}
        onMouseLeave={(e) => {
          const btn = e.currentTarget as HTMLButtonElement
          btn.style.color = 'var(--color-muted)'
          btn.style.borderColor = 'var(--color-card-border)'
        }}
      >
        Redraw
      </button>
    </div>
  )
}
