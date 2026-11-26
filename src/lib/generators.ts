import { clamp } from './utils'

export interface PasswordOptions {
  length: number
  uppercase: boolean
  lowercase: boolean
  digits: boolean
  symbols: boolean
  excludeSimilar: boolean
}

const SETS = {
  lowercase: 'abcdefghijklmnopqrstuvwxyz',
  uppercase: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
  digits: '0123456789',
  symbols: '!@#$%^&*()-_=+[]{};:,.?/~',
}

function randomInt(max: number): number {
  if (globalThis.crypto?.getRandomValues) {
    const limit = Math.floor(0x100000000 / max) * max
    const buffer = new Uint32Array(1)
    let value = 0
    do {
      globalThis.crypto.getRandomValues(buffer)
      value = buffer[0]
    } while (value >= limit)
    return value % max
  }
  return Math.floor(Math.random() * max)
}

export function generatePassword(options: PasswordOptions): string {
  const length = clamp(Math.floor(options.length), 4, 128)
  const active = [
    options.lowercase ? SETS.lowercase : '',
    options.uppercase ? SETS.uppercase : '',
    options.digits ? SETS.digits : '',
    options.symbols ? SETS.symbols : '',
  ].filter(Boolean)

  if (active.length === 0) throw new Error('Select at least one character set.')

  let pool = active.join('')
  if (options.excludeSimilar) {
    pool = pool.replace(/[Il1O0o]/g, '')
  }

  const characters: string[] = active.map((set) => {
    const cleaned = options.excludeSimilar ? set.replace(/[Il1O0o]/g, '') : set
    return cleaned.charAt(randomInt(cleaned.length))
  })

  while (characters.length < length) {
    characters.push(pool.charAt(randomInt(pool.length)))
  }

  for (let i = characters.length - 1; i > 0; i -= 1) {
    const j = randomInt(i + 1)
    ;[characters[i], characters[j]] = [characters[j], characters[i]]
  }
  return characters.slice(0, length).join('')
}

/** Simple password strength estimate for UI feedback (0-4). */
export function passwordStrength(password: string): { score: number; label: string } {
  if (!password) return { score: 0, label: 'Empty' }
  const variety = [/[a-z]/, /[A-Z]/, /\d/, /[^A-Za-z0-9]/].filter((re) => re.test(password)).length
  const lengthPoints = password.length >= 16 ? 2 : password.length >= 10 ? 1 : 0
  const score = clamp(variety + lengthPoints - 1, 1, 4)
  return { score, label: ['Very weak', 'Weak', 'Fair', 'Strong', 'Very strong'][score] }
}

export function generateRandomNumbers(
  min: number,
  max: number,
  count: number,
  unique = false,
  decimals = 0,
): number[] {
  const low = Math.min(min, max)
  const high = Math.max(min, max)
  const total = clamp(Math.floor(count), 1, 500)
  const multiplier = 10 ** clamp(Math.floor(decimals), 0, 6)
  const intLow = Math.ceil(low * multiplier)
  const intHigh = Math.floor(high * multiplier)

  if (intLow > intHigh) throw new Error('No values exist in that range with the chosen precision.')

  const numbers: number[] = []
  const seen = new Set<number>()
  let attempts = 0
  const maxAttempts = total * 100

  while (numbers.length < total && attempts < maxAttempts) {
    attempts += 1
    const value = (intLow + randomInt(intHigh - intLow + 1)) / multiplier
    if (unique && seen.has(value)) continue
    seen.add(value)
    numbers.push(value)
  }

  if (numbers.length < total) throw new Error('Range is too small for that many unique values.')
  return numbers
}

export function generateUuid(): string {
  if (globalThis.crypto?.randomUUID) return globalThis.crypto.randomUUID()
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (char) => {
    const random = (Math.random() * 16) | 0
    const value = char === 'x' ? random : (random & 0x3) | 0x8
    return value.toString(16)
  })
}

export interface Gradient {
  colors: [string, string]
  css: string
}

const GRADIENT_PALETTE = [
  ['#22D3EE', '#3B82F6'],
  ['#8B5CF6', '#EC4899'],
  ['#F59E0B', '#EF4444'],
  ['#10B981', '#22D3EE'],
  ['#F472B6', '#8B5CF6'],
  ['#0EA5E9', '#6366F1'],
  ['#FBBF24', '#F97316'],
  ['#34D399', '#059669'],
  ['#60A5FA', '#A78BFA'],
  ['#FB7185', '#F59E0B'],
]

export function generateGradient(angle = 135, palette = GRADIENT_PALETTE): Gradient {
  const [first, second] = palette[randomInt(palette.length)]
  return {
    colors: [first, second],
    css: `linear-gradient(${angle}deg, ${first}, ${second})`,
  }
}

export const GRADIENT_COLORS = GRADIENT_PALETTE.flat()

export const TIMEZONES = ['UTC', 'Local']
