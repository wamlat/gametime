export type BinaryOp = 'AND' | 'OR' | 'NOR' | 'XOR'

export interface Puzzle {
  left: string
  right: string
  op: BinaryOp
  answer: string
}

const OPS: BinaryOp[] = ['AND', 'OR', 'NOR', 'XOR']

function randomBit() {
  return Math.random() < 0.5 ? '0' : '1'
}

function randomBinaryWord(length = 5) {
  return Array.from({ length }, () => randomBit()).join('')
}

function applyBitOp(a: string, b: string, op: BinaryOp) {
  switch (op) {
    case 'AND':
      return a === '1' && b === '1' ? '1' : '0'
    case 'OR':
      return a === '1' || b === '1' ? '1' : '0'
    case 'NOR':
      return a === '1' || b === '1' ? '0' : '1'
    case 'XOR':
      return a === b ? '0' : '1'
  }
}

export function solveBinaryOp(left: string, right: string, op: BinaryOp) {
  return left
    .split('')
    .map((bit, index) => applyBitOp(bit, right[index], op))
    .join('')
}

export function generatePuzzle(): Puzzle {
  const left = randomBinaryWord()
  const right = randomBinaryWord()
  const op = OPS[Math.floor(Math.random() * OPS.length)]

  return {
    left,
    right,
    op,
    answer: solveBinaryOp(left, right, op),
  }
}
