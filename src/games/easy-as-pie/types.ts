export interface Point {
  x: number
  y: number
}

export interface Circle {
  cx: number
  cy: number
  r: number
}

export type GamePhase =
  | 'lobby'
  | 'idle'
  | 'drawing'
  | 'confirming'
  | 'scoring'
  | 'zooming'
  | 'complete'

export interface RoundResult {
  targetProportion: number
  proportionErased: number
  score: number
}

export interface GameState {
  phase: GamePhase
  round: number          // 0-indexed, 0–4
  rounds: RoundResult[]
  currentLasso: Point[]
  lassoValid: boolean    // false if self-intersecting
  totalScore: number
  seed: string
  targets: number[]
  viewport: Circle       // current MEC for zoom
}
