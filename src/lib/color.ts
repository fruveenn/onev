import { clamp } from './utils'

export interface RGB {
  r: number
  g: number
  b: number
}

export interface HSL {
  h: number
  s: number
  l: number
}

export function normalizeHex(input: string): string | null {
  const raw = input.trim().replace(/^#/, '')
  if (/^[0-9a-f]{3}$/i.test(raw)) {
    return `#${raw.split('').map((char) => char + char).join('')}`.toUpperCase()
  }
  if (/^[0-9a-f]{6}$/i.test(raw)) return `#${raw}`.toUpperCase()
  return null
}

export function hexToRgb(input: string): RGB | null {
  const hex = normalizeHex(input)
  if (!hex) return null
  return {
    r: Number.parseInt(hex.slice(1, 3), 16),
    g: Number.parseInt(hex.slice(3, 5), 16),
    b: Number.parseInt(hex.slice(5, 7), 16),
  }
}

export function rgbToHex({ r, g, b }: RGB): string {
  const part = (value: number) => clamp(Math.round(value), 0, 255).toString(16).padStart(2, '0')
  return `#${part(r)}${part(g)}${part(b)}`.toUpperCase()
}

export function rgbToHsl({ r, g, b }: RGB): HSL {
  const rn = r / 255
  const gn = g / 255
  const bn = b / 255
  const max = Math.max(rn, gn, bn)
  const min = Math.min(rn, gn, bn)
  const delta = max - min
  let h = 0
  const l = (max + min) / 2

  if (delta !== 0) {
    if (max === rn) h = ((gn - bn) / delta) % 6
    else if (max === gn) h = (bn - rn) / delta + 2
    else h = (rn - gn) / delta + 4
    h *= 60
    if (h < 0) h += 360
  }

  const s = delta === 0 ? 0 : delta / (1 - Math.abs(2 * l - 1))
  const round = (value: number) => Math.round(value * 100) / 100
  return { h: round(h), s: round(s * 100), l: round(l * 100) }
}

export function hslToRgb({ h, s, l }: HSL): RGB {
  const hue = ((h % 360) + 360) % 360
  const sat = clamp(s, 0, 100) / 100
  const light = clamp(l, 0, 100) / 100
  const c = (1 - Math.abs(2 * light - 1)) * sat
  const x = c * (1 - Math.abs(((hue / 60) % 2) - 1))
  const m = light - c / 2

  let rgb: [number, number, number]
  if (hue < 60) rgb = [c, x, 0]
  else if (hue < 120) rgb = [x, c, 0]
  else if (hue < 180) rgb = [0, c, x]
  else if (hue < 240) rgb = [0, x, c]
  else if (hue < 300) rgb = [x, 0, c]
  else rgb = [c, 0, x]

  return {
    r: Math.round((rgb[0] + m) * 255),
    g: Math.round((rgb[1] + m) * 255),
    b: Math.round((rgb[2] + m) * 255),
  }
}

export function hexToHsl(input: string): HSL | null {
  const rgb = hexToRgb(input)
  return rgb ? rgbToHsl(rgb) : null
}

export function hslToHex(hsl: HSL): string {
  return rgbToHex(hslToRgb(hsl))
}

/** Accepts #hex, rgb(...), rgba(...), hsl(...) or named CSS colors via a probe element. */
export function parseColor(input: string): RGB | null {
  const value = input.trim()
  const hex = hexToRgb(value)
  if (hex) return hex

  const rgbMatch = /^rgba?\(\s*([\d.]+)[,\s]+([\d.]+)[,\s]+([\d.]+)/i.exec(value)
  if (rgbMatch) {
    return {
      r: clamp(Number(rgbMatch[1]), 0, 255),
      g: clamp(Number(rgbMatch[2]), 0, 255),
      b: clamp(Number(rgbMatch[3]), 0, 255),
    }
  }

  const hslMatch = /^hsla?\(\s*([\d.]+)[,\s]+([\d.]+)%[,\s]+([\d.]+)%/i.exec(value)
  if (hslMatch) {
    return hslToRgb({
      h: Number(hslMatch[1]),
      s: Number(hslMatch[2]),
      l: Number(hslMatch[3]),
    })
  }

  return null
}

function luminance({ r, g, b }: RGB): number {
  const channel = (value: number) => {
    const normalized = value / 255
    return normalized <= 0.03928
      ? normalized / 12.92
      : ((normalized + 0.055) / 1.055) ** 2.4
  }
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b)
}

/** WCAG contrast ratio, from 1 to 21. */
export function contrastRatio(colorA: string, colorB: string): number | null {
  const a = parseColor(colorA)
  const b = parseColor(colorB)
  if (!a || !b) return null
  const l1 = luminance(a)
  const l2 = luminance(b)
  return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05)
}

export function readableTextColor(background: string): string {
  const rgb = parseColor(background)
  if (!rgb) return '#FFFFFF'
  return luminance(rgb) > 0.45 ? '#141710' : '#FFFFFF'
}

export function shiftHue(input: string, degrees: number): string {
  const hsl = hexToHsl(input)
  if (!hsl) return input
  return hslToHex({ ...hsl, h: hsl.h + degrees })
}

export type PaletteMode = 'complementary' | 'analogous' | 'triadic' | 'monochromatic'

export function generatePalette(base: string, mode: PaletteMode): string[] {
  const hsl = hexToHsl(base)
  if (!hsl) return []
  switch (mode) {
    case 'complementary':
      return [base, shiftHue(base, 180)]
    case 'analogous':
      return [shiftHue(base, -30), base, shiftHue(base, 30)]
    case 'triadic':
      return [base, shiftHue(base, 120), shiftHue(base, 240)]
    case 'monochromatic':
      return [15, 35, 55, 75, 90].map((l) => hslToHex({ ...hsl, l }))
  }
}

export function randomHexColor(): string {
  const bytes = new Uint8Array(3)
  crypto.getRandomValues(bytes)
  return rgbToHex({ r: bytes[0], g: bytes[1], b: bytes[2] })
}
