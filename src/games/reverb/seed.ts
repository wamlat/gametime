const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
const START_LENGTH = 3
export const MAX_LENGTH = 50
export const MAX_ROUNDS = MAX_LENGTH - START_LENGTH + 1

function fnv1aHash(value: string): number {
  let hash = 0x811c9dc5

  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index)
    hash = Math.imul(hash, 0x01000193)
  }

  return hash >>> 0
}

function mulberry32(seed: number): () => number {
  let state = seed

  return function next() {
    state |= 0
    state = (state + 0x6d2b79f5) | 0
    let temp = Math.imul(state ^ (state >>> 15), 1 | state)
    temp = (temp + Math.imul(temp ^ (temp >>> 7), 61 | temp)) ^ temp
    return ((temp ^ (temp >>> 14)) >>> 0) / 4294967296
  }
}

export function getLengthForRound(round: number) {
  return Math.min(START_LENGTH + round, MAX_LENGTH)
}

export function generatePromptForRound(seed: string, round: number) {
  const rand = mulberry32(fnv1aHash(`${seed}:${round}`))
  const length = getLengthForRound(round)
  let value = ''

  for (let index = 0; index < length; index += 1) {
    value += ALPHABET[Math.floor(rand() * ALPHABET.length)]
  }

  return value
}

export function generateRandomSeed() {
  return Math.random().toString(36).slice(2, 8).toUpperCase()
}
