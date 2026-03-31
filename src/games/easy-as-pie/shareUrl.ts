export function encodeScores(scores: number[]): string {
  return scores
    .map((s) => Math.round(s * 100).toString(36).padStart(4, '0'))
    .join('-')
}

export function decodeScores(encoded: string): number[] {
  return encoded.split('-').map((s) => parseInt(s, 36) / 100)
}

export function buildShareUrl(seed: string, scores: number[]): string {
  const base = window.location.origin + '/easy-as-pie'
  const params = new URLSearchParams({ seed, scores: encodeScores(scores) })
  return `${base}?${params.toString()}`
}

export function buildChallengeUrl(seed: string): string {
  return `${window.location.origin}/easy-as-pie?seed=${seed}`
}
