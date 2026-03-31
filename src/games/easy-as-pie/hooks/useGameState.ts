import { useReducer } from 'react'
import type { GameState, GamePhase, Point, RoundResult } from '../types'
import { INITIAL_VIEWPORT, ROUND_COUNT } from '../constants'
import { calcRoundScore, calcTotalScore } from '../scoring'
import type { Circle } from '../types'

type Action =
  | { type: 'START_GAME' }
  | { type: 'START_DRAW'; point: Point }
  | { type: 'CONTINUE_DRAW'; point: Point }
  | { type: 'CLOSE_LASSO'; path: Point[] }   // auto-close at self-intersection point
  | { type: 'END_DRAW' }
  | { type: 'CANCEL_DRAW' }
  | { type: 'CONFIRM_LASSO' }
  | { type: 'REDRAW' }
  | { type: 'SCORE_COMPUTED'; proportionErased: number; mec: Circle }
  | { type: 'ZOOM_COMPLETE' }
  | { type: 'RESET'; seed: string; targets: number[] }

function initialState(seed: string, targets: number[]): GameState {
  return {
    phase: 'lobby',
    round: 0,
    rounds: [],
    currentLasso: [],
    lassoValid: true,
    totalScore: 0,
    seed,
    targets,
    viewport: INITIAL_VIEWPORT,
  }
}

function gameReducer(state: GameState, action: Action): GameState {
  switch (action.type) {
    case 'START_GAME':
      return { ...state, phase: 'idle' }

    case 'START_DRAW':
      if (state.phase !== 'idle') return state
      return { ...state, phase: 'drawing', currentLasso: [action.point], lassoValid: true }

    case 'CONTINUE_DRAW':
      if (state.phase !== 'drawing') return state
      return { ...state, currentLasso: [...state.currentLasso, action.point] }

    case 'CLOSE_LASSO':
      // Auto-closed at intersection — jump straight to confirming with trimmed path
      if (state.phase !== 'drawing') return state
      return { ...state, phase: 'confirming', currentLasso: action.path }

    case 'END_DRAW': {
      if (state.phase !== 'drawing') return state
      if (state.currentLasso.length < 12) {
        return { ...state, phase: 'idle', currentLasso: [], lassoValid: true }
      }
      return { ...state, phase: 'confirming' }
    }

    case 'CANCEL_DRAW':
      return { ...state, phase: 'idle', currentLasso: [], lassoValid: true }

    case 'REDRAW':
      return { ...state, phase: 'idle', currentLasso: [], lassoValid: true }

    case 'CONFIRM_LASSO':
      if (state.phase !== 'confirming') return state
      return { ...state, phase: 'scoring' }

    case 'SCORE_COMPUTED': {
      const target = state.targets[state.round]
      const score = calcRoundScore(action.proportionErased, target)
      const newRound: RoundResult = {
        targetProportion: target,
        proportionErased: action.proportionErased,
        score,
      }
      const newRounds = [...state.rounds, newRound]
      const newTotal = calcTotalScore(newRounds)
      const nextPhase: GamePhase = state.round >= ROUND_COUNT - 1 ? 'complete' : 'zooming'
      return {
        ...state,
        phase: nextPhase,
        rounds: newRounds,
        totalScore: newTotal,
        currentLasso: [],
        lassoValid: true,
        viewport: action.mec,
      }
    }

    case 'ZOOM_COMPLETE':
      if (state.phase !== 'zooming') return state
      return { ...state, phase: 'idle', round: state.round + 1 }

    case 'RESET':
      return initialState(action.seed, action.targets)

    default:
      return state
  }
}

export function useGameState(seed: string, targets: number[]) {
  const [state, dispatch] = useReducer(gameReducer, undefined, () =>
    initialState(seed, targets)
  )
  return { state, dispatch }
}
