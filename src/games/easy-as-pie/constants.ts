import type { Circle } from './types'

export const ROUND_COUNT = 5
export const MIN_TARGET = 0.05
export const MAX_TARGET = 0.95

export const CANVAS_SIZE = 600
export const PIE_RADIUS = 240
export const PIE_CENTER = { x: 300, y: 300 }

export const INITIAL_VIEWPORT: Circle = {
  cx: 300,
  cy: 300,
  r: 260,
}

export const PIE_COLOR = '#E8832A'
export const PIE_BG = '#111110'
export const LASSO_COLOR = 'rgba(255,255,255,0.9)'
export const LASSO_FILL_COLOR = 'rgba(255,255,255,0.10)'

export const MIN_LASSO_POINTS = 12
export const ZOOM_DURATION_MS = 700
export const SCORE_REVEAL_DURATION_MS = 400
