import type { RoundResult } from './types'

export function calcRoundScore(proportionErased: number, target: number): number {
  return Math.round((Math.abs(proportionErased - target) / target) * 10 * 100) / 100
}

export function calcTotalScore(rounds: RoundResult[]): number {
  const raw = rounds.reduce((sum, r) => sum + r.score, 0)
  return Math.round(raw * 100) / 100
}

export function scoreLabel(score: number): string {
  if (score === 0) return 'Perfect!'
  if (score < 0.5) return 'Incredible'
  if (score < 1.5) return 'Excellent'
  if (score < 3) return 'Good'
  if (score < 6) return 'Close'
  return 'Wide miss'
}

export function totalScoreLabel(total: number): string {
  if (total < 2) return 'Flawless'
  if (total < 6) return 'Sharpshooting'
  if (total < 12) return 'Pretty good'
  if (total < 20) return 'Getting there'
  return 'Keep practicing'
}
