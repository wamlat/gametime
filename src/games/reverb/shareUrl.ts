export function buildChallengeUrl(seed: string, flashSeconds: number) {
  const base = `${window.location.origin}/reverb`
  const params = new URLSearchParams({ seed, flash: String(flashSeconds) })
  return `${base}?${params.toString()}`
}

export function buildShareUrl(seed: string, flashSeconds: number, score: number) {
  const base = `${window.location.origin}/reverb`
  const params = new URLSearchParams({
    seed,
    flash: String(flashSeconds),
    score: String(score),
  })

  return `${base}?${params.toString()}`
}
