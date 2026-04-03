import { useSearchParams } from 'react-router-dom'
import Reverb from './Reverb'
import { generateUnusedSeed, hasPlayedSeed } from './seed'
import { SharedResultsView } from './ui/SharedResultsView'

export default function ReverbRoute() {
  const [searchParams] = useSearchParams()
  const seedParam = searchParams.get('seed')
  const scoreParam = searchParams.get('score')
  const flashParam = Number(searchParams.get('flash') ?? '1')
  const flashSeconds = flashParam === 2 || flashParam === 5 ? flashParam : 1
  const modeParam = searchParams.get('mode')
  const initialMode: 'random' | 'dictionary' = modeParam === 'dictionary' ? 'dictionary' : 'random'

  if (seedParam && scoreParam) {
    const score = Number(scoreParam)

    if (Number.isFinite(score) && score >= 0) {
      return <SharedResultsView seed={seedParam} flashSeconds={flashSeconds} score={score} />
    }
  }

  const seed = seedParam ?? generateUnusedSeed()
  return <Reverb key={`${seed}-${flashSeconds}-${initialMode}`} seed={seed} initialFlashSeconds={flashSeconds} initialMode={initialMode} alreadyPlayed={hasPlayedSeed(seed)} />
}
