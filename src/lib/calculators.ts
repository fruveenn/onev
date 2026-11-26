export function percentageOf(value: number, percent: number): number {
  return (value * percent) / 100
}

export function percentOfWhole(part: number, whole: number): number {
  return whole === 0 ? 0 : (part / whole) * 100
}

export function percentChange(from: number, to: number): number {
  return from === 0 ? 0 : ((to - from) / Math.abs(from)) * 100
}

export function applyPercent(value: number, percent: number, mode: 'increase' | 'decrease'): number {
  return mode === 'increase' ? value * (1 + percent / 100) : value * (1 - percent / 100)
}

export interface AgeResult {
  years: number
  months: number
  days: number
  totalDays: number
  nextBirthdayDays: number
}

function daysInMonth(year: number, monthIndex: number): number {
  return new Date(year, monthIndex + 1, 0).getDate()
}

export function calculateAge(birth: Date, today: Date = new Date()): AgeResult {
  if (Number.isNaN(birth.getTime())) throw new Error('Enter a valid date of birth.')
  if (birth > today) throw new Error('Date of birth cannot be in the future.')

  let years = today.getFullYear() - birth.getFullYear()
  let months = today.getMonth() - birth.getMonth()
  let days = today.getDate() - birth.getDate()

  if (days < 0) {
    months -= 1
    const previousMonth = (today.getMonth() + 11) % 12
    const previousYear = today.getMonth() === 0 ? today.getFullYear() - 1 : today.getFullYear()
    days += daysInMonth(previousYear, previousMonth)
  }
  if (months < 0) {
    years -= 1
    months += 12
  }

  const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate())
  const startOfBirth = new Date(birth.getFullYear(), birth.getMonth(), birth.getDate())
  const totalDays = Math.floor((startOfToday.getTime() - startOfBirth.getTime()) / 86_400_000)

  let nextBirthday = new Date(today.getFullYear(), birth.getMonth(), birth.getDate())
  if (nextBirthday < startOfToday) {
    nextBirthday = new Date(today.getFullYear() + 1, birth.getMonth(), birth.getDate())
  }
  const nextBirthdayDays = Math.round((nextBirthday.getTime() - startOfToday.getTime()) / 86_400_000)

  return { years, months, days, totalDays, nextBirthdayDays }
}

export interface SplitResult {
  subtotal: number
  tax: number
  tip: number
  total: number
  perPerson: number
}

export function splitBill(
  total: number,
  people: number,
  tipPercent = 0,
  taxPercent = 0,
  customTip = 0,
): SplitResult {
  const count = Math.max(1, Math.floor(people))
  const subtotal = Math.max(0, total)
  const tax = subtotal * (Math.max(0, taxPercent) / 100)
  const tip = customTip > 0 ? customTip : subtotal * (Math.max(0, tipPercent) / 100)
  const grandTotal = subtotal + tax + tip
  return {
    subtotal,
    tax,
    tip,
    total: grandTotal,
    perPerson: grandTotal / count,
  }
}

export interface NumberStats {
  count: number
  sum: number
  mean: number
  median: number
  min: number
  max: number
  range: number
}

export function numberStats(values: number[]): NumberStats {
  if (values.length === 0) {
    return { count: 0, sum: 0, mean: 0, median: 0, min: 0, max: 0, range: 0 }
  }
  const sorted = [...values].sort((a, b) => a - b)
  const middle = Math.floor(sorted.length / 2)
  const median =
    sorted.length % 2 === 0 ? (sorted[middle - 1] + sorted[middle]) / 2 : sorted[middle]
  const sum = values.reduce((acc, value) => acc + value, 0)
  return {
    count: values.length,
    sum,
    mean: sum / values.length,
    median,
    min: sorted[0],
    max: sorted[sorted.length - 1],
    range: sorted[sorted.length - 1] - sorted[0],
  }
}

type Token =
  | { type: 'number'; value: number }
  | { type: 'operator'; value: string }
  | { type: 'paren'; value: '(' | ')' }

const PRECEDENCE: Record<string, number> = {
  // Unary minus binds tighter than multiplication but looser than exponentiation,
  // matching conventional maths and JavaScript: -3 ^ 2 === -9.
  'u-': 2.5,
  '^': 3,
  '*': 2,
  '/': 2,
  '%': 2,
  '+': 1,
  '-': 1,
}

const RIGHT_ASSOCIATIVE = new Set(['^', 'u-'])

function applyOperator(operator: string, right: number, left?: number): number {
  switch (operator) {
    case 'u-':
      return -right
    case '+':
      return (left ?? 0) + right
    case '-':
      return (left ?? 0) - right
    case '*':
      return (left ?? 0) * right
    case '/':
      if (right === 0) throw new Error('Division by zero')
      return (left ?? 0) / right
    case '%':
      if (right === 0) throw new Error('Modulo by zero')
      return (left ?? 0) % right
    case '^':
      return (left ?? 0) ** right
    default:
      throw new Error(`Unknown operator: ${operator}`)
  }
}

/** Safe arithmetic evaluator (shunting-yard); no eval/new Function. */
export function evaluateExpression(expression: string): number {
  const input = expression.replace(/×/g, '*').replace(/÷/g, '/')
  const tokens: Token[] = []
  let index = 0

  while (index < input.length) {
    const char = input[index]
    if (/\s/.test(char)) {
      index += 1
      continue
    }
    if (/[0-9.]/.test(char)) {
      const match = /^(?:\d+\.?\d*|\.\d+)(?:e[+-]?\d+)?/i.exec(input.slice(index))
      if (!match) throw new Error(`Unexpected character at position ${index + 1}`)
      tokens.push({ type: 'number', value: Number(match[0]) })
      index += match[0].length
      continue
    }
    if ('+-*/^%()'.includes(char)) {
      tokens.push(
        char === '(' || char === ')'
          ? { type: 'paren', value: char }
          : { type: 'operator', value: char },
      )
      index += 1
      continue
    }
    throw new Error(`Unexpected character "${char}"`)
  }

  if (tokens.length === 0) throw new Error('Enter an expression')

  const output: Token[] = []
  const operators: Token[] = []

  tokens.forEach((token, position) => {
    if (token.type === 'number') {
      output.push(token)
      return
    }
    if (token.type === 'paren') {
      if (token.value === '(') {
        operators.push(token)
      } else {
        while (operators.length && operators[operators.length - 1].value !== '(') {
          output.push(operators.pop() as Token)
        }
        if (!operators.length) throw new Error('Unbalanced parentheses')
        operators.pop()
      }
      return
    }

    let operator = token.value
    const previous = tokens[position - 1]
    const isUnary =
      (operator === '-' || operator === '+') &&
      (!previous || (previous.type === 'operator' || (previous.type === 'paren' && previous.value === '(')))
    if (isUnary && operator === '-') operator = 'u-'
    if (isUnary && operator === '+') return

    while (operators.length) {
      const top = operators[operators.length - 1]
      if (top.type !== 'operator') break
      const topPrecedence = PRECEDENCE[top.value]
      const currentPrecedence = PRECEDENCE[operator]
      if (
        topPrecedence > currentPrecedence ||
        (topPrecedence === currentPrecedence && !RIGHT_ASSOCIATIVE.has(operator))
      ) {
        output.push(operators.pop() as Token)
      } else {
        break
      }
    }
    operators.push({ type: 'operator', value: operator })
  })

  while (operators.length) {
    const operator = operators.pop() as Token
    if (operator.type === 'paren') throw new Error('Unbalanced parentheses')
    output.push(operator)
  }

  const stack: number[] = []
  output.forEach((token) => {
    if (token.type === 'number') {
      stack.push(token.value)
      return
    }
    if (token.type === 'operator') {
      if (token.value === 'u-') {
        if (stack.length < 1) throw new Error('Invalid expression')
        stack.push(applyOperator('u-', stack.pop() as number))
        return
      }
      if (stack.length < 2) throw new Error('Invalid expression')
      const right = stack.pop() as number
      const left = stack.pop() as number
      stack.push(applyOperator(token.value, right, left))
    }
  })

  if (stack.length !== 1 || !Number.isFinite(stack[0])) throw new Error('Invalid result')
  return stack[0]
}
