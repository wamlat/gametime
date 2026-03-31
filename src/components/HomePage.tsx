import { Link } from 'react-router-dom'

const games = [
  {
    slug: 'easy-as-pie',
    title: 'easy as pie',
    description: "You think you can eyeball a fraction? Draw a lasso to eat exactly the right slice of pie. Five rounds, lowest score wins.",
    tag: 'estimation',
  },
  {
    slug: 'intricate-extricate',
    title: 'intricate extricate',
    description: 'Five vertices, seven edges, and a whole mess of crossings. Drag the dots until the graph is planar, then race the 60-second clock.',
    tag: 'spatial',
  },
  {
    slug: 'fisheye',
    title: 'fisheye',
    description: 'A single-player archery trial: read the fish eye from its reflection, set your angle and draw, and score by how close the arrow comes.',
    tag: 'spatial',
  },
  {
    slug: 'tempo-tap',
    title: 'tempo tap',
    description: 'Hear a five-second rhythm sample and estimate its tempo in bpm. Five rounds, lowest total error wins.',
    tag: 'estimation',
  },
  {
    slug: 'xornado',
    title: 'xornado',
    description: 'Two random five-bit binary numbers, one random logical operator, and sixty seconds to solve as many as you can.',
    tag: 'numerical',
  },
  {
    slug: 'reverb',
    title: 'reverb',
    description: 'Memorize a flashing string of letters, then type it back after it disappears. Every correct answer grows the string until your first miss ends the run.',
    tag: 'verbal',
  },
]

export default function HomePage() {
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
      <div style={{ maxWidth: 640, width: '100%' }}>
        <div style={{ marginBottom: 56 }}>
          <h1
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: 'clamp(40px, 8vw, 64px)',
              color: 'var(--color-card)',
              lineHeight: 1,
              letterSpacing: '-0.02em',
              marginBottom: 12,
            }}
          >
            gametime.
          </h1>
          <p
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: 13,
              color: '#888882',
              letterSpacing: '0.04em',
            }}
          >
            a small collection of perception games
          </p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {games.map((game) => (
            <Link to={`/${game.slug}`} key={game.slug} style={{ textDecoration: 'none' }}>
              <div
                style={{
                  background: 'var(--color-card)',
                  border: '1px solid var(--color-card-border)',
                  borderRadius: 'var(--radius-lg)',
                  padding: '28px 32px',
                  cursor: 'pointer',
                  transition: 'transform var(--transition-fast), box-shadow var(--transition-fast)',
                  boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-2px)'
                  ;(e.currentTarget as HTMLDivElement).style.boxShadow = '0 16px 40px rgba(0,0,0,0.25)'
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLDivElement).style.transform = ''
                  ;(e.currentTarget as HTMLDivElement).style.boxShadow = '0 8px 24px rgba(0,0,0,0.15)'
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    justifyContent: 'space-between',
                    gap: 16,
                    marginBottom: 10,
                  }}
                >
                  <h2
                    style={{
                      fontFamily: 'var(--font-display)',
                      fontSize: 28,
                      color: 'var(--color-text)',
                      letterSpacing: '-0.01em',
                    }}
                  >
                    {game.title}
                  </h2>
                  <span
                    style={{
                      fontFamily: 'var(--font-mono)',
                      fontSize: 10,
                      letterSpacing: '0.12em',
                      textTransform: 'uppercase',
                      color: 'var(--color-accent)',
                      background: 'var(--color-accent-dim)',
                      padding: '3px 8px',
                      borderRadius: 'var(--radius-sm)',
                      whiteSpace: 'nowrap',
                      marginTop: 4,
                    }}
                  >
                    {game.tag}
                  </span>
                </div>
                <p
                  style={{
                    fontFamily: 'var(--font-sans)',
                    fontSize: 14,
                    color: 'var(--color-muted)',
                    lineHeight: 1.6,
                  }}
                >
                  {game.description}
                </p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
