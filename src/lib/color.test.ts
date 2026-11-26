import { describe, expect, it } from 'vitest'
import {
  contrastRatio,
  generatePalette,
  hexToHsl,
  hexToRgb,
  hslToHex,
  normalizeHex,
  parseColor,
  rgbToHex,
  rgbToHsl,
} from './color'

describe('color', () => {
  it('normalizes and parses colors', () => {
    expect(normalizeHex('#abc')).toBe('#AABBCC')
    expect(hexToRgb('#22d3ee')).toEqual({ r: 34, g: 211, b: 238 })
    expect(rgbToHex({ r: 34, g: 211, b: 238 })).toBe('#22D3EE')
    expect(parseColor('rgb(255, 0, 0)')).toEqual({ r: 255, g: 0, b: 0 })
    expect(parseColor('hsl(0, 100%, 50%)')).toEqual({ r: 255, g: 0, b: 0 })
    expect(parseColor('not a color')).toBeNull()
  })

  it('round-trips through HSL', () => {
    const hsl = rgbToHsl({ r: 34, g: 211, b: 238 })
    const back = hexToRgb(hslToHex(hsl))
    expect(back?.r).toBeCloseTo(34, 0)
    expect(back?.g).toBeCloseTo(211, 0)
    expect(back?.b).toBeCloseTo(238, 0)
    expect(hexToHsl('#FFFFFF')?.l).toBe(100)
  })

  it('computes WCAG contrast ratios', () => {
    expect(contrastRatio('#000000', '#FFFFFF')).toBeCloseTo(21, 2)
    expect(contrastRatio('#FFFFFF', '#FFFFFF')).toBeCloseTo(1, 2)
    expect(contrastRatio('nope', '#FFFFFF')).toBeNull()
  })

  it('generates palettes', () => {
    expect(generatePalette('#22D3EE', 'complementary')).toHaveLength(2)
    expect(generatePalette('#22D3EE', 'analogous')).toHaveLength(3)
    expect(generatePalette('#22D3EE', 'triadic')).toHaveLength(3)
    expect(generatePalette('#22D3EE', 'monochromatic')).toHaveLength(5)
  })
})
