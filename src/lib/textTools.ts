import { clamp } from './utils'

export type CaseStyle =
  | 'upper'
  | 'lower'
  | 'title'
  | 'sentence'
  | 'camel'
  | 'pascal'
  | 'snake'
  | 'kebab'
  | 'constant'
  | 'alternating'

/** Unicode-aware, URL-friendly slug. */
export function slugify(input: string): string {
  return input
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/['’]/g, '')
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

/** Turn a slug back into readable text. */
export function slugToText(slug: string, capitalize = true): string {
  const words = slug
    .replace(/[-_]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase()
  if (!capitalize) return words
  return words.replace(/\b\w/g, (char) => char.toUpperCase())
}

/** UTF-8 text to space-separated 8-bit values. */
export function textToBinary(input: string): string {
  const bytes = new TextEncoder().encode(input)
  return Array.from(bytes, (byte) => byte.toString(2).padStart(8, '0')).join(' ')
}

/** Space-separated (or continuous) 8-bit values back to UTF-8 text. */
export function binaryToText(input: string): string {
  const bits = input.replace(/[^01]/g, '')
  if (!bits) return ''
  if (bits.length % 8 !== 0) {
    throw new Error(`Binary input must contain a multiple of 8 bits (received ${bits.length}).`)
  }
  const bytes = new Uint8Array(bits.length / 8)
  for (let i = 0; i < bytes.length; i += 1) {
    bytes[i] = Number.parseInt(bits.slice(i * 8, i * 8 + 8), 2)
  }
  return new TextDecoder('utf-8', { fatal: false }).decode(bytes)
}

export function textToBase64(input: string): string {
  const bytes = new TextEncoder().encode(input)
  let binary = ''
  for (const byte of bytes) binary += String.fromCharCode(byte)
  return btoa(binary)
}

export function base64ToText(input: string): string {
  const cleaned = input.replace(/\s/g, '')
  const bytes = Uint8Array.from(atob(cleaned), (char) => char.charCodeAt(0))
  return new TextDecoder('utf-8', { fatal: false }).decode(bytes)
}

export function urlEncode(input: string): string {
  return encodeURIComponent(input)
}

export function urlDecode(input: string): string {
  try {
    return decodeURIComponent(input)
  } catch {
    throw new Error('Invalid percent-encoded sequence.')
  }
}

const wordSplit = (text: string) => text.trim().split(/\s+/).filter(Boolean)

export function convertCase(input: string, style: CaseStyle): string {
  const words = wordSplit(input)
  switch (style) {
    case 'upper':
      return input.toUpperCase()
    case 'lower':
      return input.toLowerCase()
    case 'title':
      return words.map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()).join(' ')
    case 'sentence':
      return input.toLowerCase().replace(/(^\s*\w|[.!?]\s+\w)/g, (match) => match.toUpperCase())
    case 'camel':
      return words
        .map((word, index) =>
          index === 0
            ? word.toLowerCase()
            : word.charAt(0).toUpperCase() + word.slice(1).toLowerCase(),
        )
        .join('')
    case 'pascal':
      return words.map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()).join('')
    case 'snake':
      return words.map((word) => word.toLowerCase()).join('_')
    case 'kebab':
      return words.map((word) => word.toLowerCase()).join('-')
    case 'constant':
      return words.map((word) => word.toUpperCase()).join('_')
    case 'alternating':
      return Array.from(input).map((char, i) => (i % 2 === 0 ? char.toUpperCase() : char.toLowerCase())).join('')
  }
}

export interface TextStats {
  characters: number
  charactersNoSpaces: number
  words: number
  sentences: number
  paragraphs: number
  lines: number
  readingMinutes: number
}

export function getTextStats(input: string): TextStats {
  const words = wordSplit(input).length
  return {
    characters: input.length,
    charactersNoSpaces: input.replace(/\s/g, '').length,
    words,
    sentences: input.split(/[.!?]+(?:\s|$)/).filter((part) => part.trim()).length,
    paragraphs: input.split(/\n\s*\n/).filter((part) => part.trim()).length,
    lines: input ? input.split(/\r?\n/).length : 0,
    readingMinutes: words === 0 ? 0 : Math.max(1, Math.ceil(words / 200)),
  }
}

export interface FindReplaceOptions {
  caseSensitive?: boolean
  wholeWord?: boolean
  useRegex?: boolean
}

export function findAndReplace(
  input: string,
  find: string,
  replacement: string,
  options: FindReplaceOptions = {},
): { result: string; count: number; error?: string } {
  if (!find) return { result: input, count: 0 }

  let source = find
  if (!options.useRegex) source = source.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  if (options.wholeWord) source = `\\b(?:${source})\\b`

  try {
    const regex = new RegExp(source, options.caseSensitive ? 'g' : 'gi')
    const count = Array.from(input.matchAll(regex)).length
    const safeReplacement = options.useRegex ? replacement : replacement.replace(/\$/g, '$$$$')
    return { result: input.replace(regex, safeReplacement), count }
  } catch (error) {
    return {
      result: input,
      count: 0,
      error: error instanceof Error ? error.message : 'Invalid pattern',
    }
  }
}

export function repeatText(input: string, times: number, separator = '\n'): string {
  const safeTimes = clamp(Math.floor(times), 0, 1000)
  return Array.from({ length: safeTimes }, () => input).join(separator)
}

const LOREM_WORDS =
  'lorem ipsum dolor sit amet consectetur adipiscing elit sed do eiusmod tempor incididunt ut labore et dolore magna aliqua Ut enim ad minim veniam quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur Excepteur sint occaecat cupidatat non proident sunt in culpa qui officia deserunt mollit anim id est laborum'
    .split(' ')
    .filter(Boolean)

export function loremIpsum(count: number, mode: 'paragraphs' | 'sentences' | 'words'): string {
  const total = clamp(Math.floor(count), 1, 100)
  let cursor = 0
  const nextWord = () => {
    const word = LOREM_WORDS[cursor % LOREM_WORDS.length]
    cursor += 1
    return word
  }
  const sentence = () => {
    const length = 6 + Math.floor(Math.random() * 10)
    const words = Array.from({ length }, nextWord).join(' ').toLowerCase()
    return words.charAt(0).toUpperCase() + words.slice(1) + '.'
  }

  if (mode === 'words') return Array.from({ length: total }, nextWord).join(' ')
  if (mode === 'sentences') return Array.from({ length: total }, sentence).join(' ')
  return Array.from({ length: total }, () =>
    Array.from({ length: 3 + Math.floor(Math.random() * 4) }, sentence).join(' '),
  ).join('\n\n')
}

export function reverseText(input: string): string {
  return Array.from(input).reverse().join('')
}

export function sortLines(input: string, direction: 'asc' | 'desc' = 'asc', unique = false): string {
  let lines = input.split(/\r?\n/)
  if (unique) lines = Array.from(new Set(lines))
  lines.sort((a, b) => a.localeCompare(b))
  if (direction === 'desc') lines.reverse()
  return lines.join('\n')
}
