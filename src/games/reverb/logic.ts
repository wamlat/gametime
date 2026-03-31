const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
const START_LENGTH = 3

export function getLengthForRound(round: number) {
  return START_LENGTH + round
}

export function generatePrompt(length: number) {
  let value = ''

  for (let index = 0; index < length; index += 1) {
    const nextChar = ALPHABET[Math.floor(Math.random() * ALPHABET.length)]
    value += nextChar
  }

  return value
}
