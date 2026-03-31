import { useSearchParams } from 'react-router-dom'
import Reverb from './Reverb'
import { generateRandomSeed } from './seed'
import { SharedResultsView } from './ui/SharedResultsView'

export default function ReverbRoute() {
  const [searchParams] = useSearchParams()
  const seedParam = searchParams.get('seed')
  const scoreParam = searchParams.get('score')
  const flashParam = Number(searchParams.get('flash') ?? '1')
  const flashSeconds = flashParam === 2 || flashParam === 5 ? flashParam : 1

  if (seedParam && scoreParam) {
    const score = Number(scoreParam)

    if (Number.isFinite(score) && score >= 0) {
      return <SharedResultsView seed={seedParam} flashSeconds={flashSeconds} score={score} />
    }
  }

  const seed = seedParam ?? generateRandomSeed()
  return <Reverb seed={seed} initialFlashSeconds={flashSeconds} />
}
