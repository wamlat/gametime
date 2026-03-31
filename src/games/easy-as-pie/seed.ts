import { ROUND_COUNT, MIN_TARGET, MAX_TARGET } from './constants'

function fnv1aHash(s: string): number {
  let h = 0x811c9dc5
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i)
    h = Math.imul(h, 0x01000193)
  }
  return h >>> 0
}

function mulberry32(seed: number): () => number {
  let s = seed
  return function () {
    s |= 0
    s = (s + 0x6d2b79f5) | 0
    let t = Math.imul(s ^ (s >>> 15), 1 | s)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

export function generateTargets(seed: string): number[] {
  const rand = mulberry32(fnv1aHash(seed))
  return Array.from({ length: ROUND_COUNT }, () =>
    MIN_TARGET + rand() * (MAX_TARGET - MIN_TARGET)
  )
}

export function generateRandomSeed(): string {
  return Math.random().toString(36).slice(2, 8).toUpperCase()
}
