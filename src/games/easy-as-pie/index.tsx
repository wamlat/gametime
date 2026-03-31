import { useSearchParams } from 'react-router-dom'
import { EasyAsPie } from './EasyAsPie'
import { SharedResultsView } from './ui/SharedResultsView'
import { generateRandomSeed } from './seed'

export default function EasyAsPieRoute() {
  const [searchParams] = useSearchParams()
  const seedParam = searchParams.get('seed')
  const scoresParam = searchParams.get('scores')

  // If both seed and scores are present: show shared results view
  if (seedParam && scoresParam) {
    return <SharedResultsView seed={seedParam} encodedScores={scoresParam} />
  }

  // Use provided seed (challenge mode) or generate a fresh one
  const seed = seedParam ?? generateRandomSeed()
  return <EasyAsPie seed={seed} />
}
