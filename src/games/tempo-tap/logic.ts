export const ROUND_COUNT = 5
export const BPM_MIN = 50
export const BPM_MAX = 190
export const SAMPLE_SECONDS_MIN = 3
export const SAMPLE_SECONDS_MAX = 5

export interface TempoRound {
  bpm: number
  sampleSeconds: number
}

function randomInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

export function generateTempoRounds(): TempoRound[] {
  return Array.from({ length: ROUND_COUNT }, () => ({
    bpm: randomInt(BPM_MIN, BPM_MAX),
    sampleSeconds: randomInt(SAMPLE_SECONDS_MIN, SAMPLE_SECONDS_MAX),
  }))
}

export function scoreGuess(target: number, guess: number) {
  return Math.abs(target - guess)
}

export function scoreLabel(error: number) {
  if (error <= 1) return 'locked in'
  if (error <= 4) return 'ridiculously close'
  if (error <= 8) return 'solid ear'
  if (error <= 15) return 'not bad'
  return 'way off'
}
