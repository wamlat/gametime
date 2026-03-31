import { ReactNode } from 'react'

interface GameCardProps {
  children: ReactNode
  className?: string
}

export default function GameCard({ children, className = '' }: GameCardProps) {
  return (
    <div
      className={`game-card ${className}`}
      style={{
        background: 'var(--color-card)',
        border: '1px solid var(--color-card-border)',
        borderRadius: 'var(--radius-xl)',
        padding: 'var(--space-xl)',
        boxShadow: '0 32px 64px rgba(0,0,0,0.22), 0 0 0 1px rgba(255,255,255,0.04) inset',
      }}
    >
      {children}
    </div>
  )
}
