export function buildChallengeUrl(seed: string, flashSeconds: number, mode: string) {
  const base = `${window.location.origin}/reverb`
  const params = new URLSearchParams({ seed, flash: String(flashSeconds), mode })
  return `${base}?${params.toString()}`
}

export function buildShareUrl(seed: string, flashSeconds: number, score: number, mode: string) {
  const base = `${window.location.origin}/reverb`
  const params = new URLSearchParams({
    seed,
    flash: String(flashSeconds),
    score: String(score),
    mode,
  })

  return `${base}?${params.toString()}`
}
