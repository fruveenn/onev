import { describe, expect, it } from 'vitest'
import {
  generateGradient,
  generatePassword,
  generateRandomNumbers,
  generateUuid,
  passwordStrength,
} from './generators'

const allOn = {
  length: 24,
  uppercase: true,
  lowercase: true,
  digits: true,
  symbols: true,
  excludeSimilar: false,
}

describe('generators', () => {
  it('respects password rules and requested length', () => {
    const password = generatePassword(allOn)
    expect(password).toHaveLength(24)
    expect(/[a-z]/.test(password)).toBe(true)
    expect(/[A-Z]/.test(password)).toBe(true)
    expect(/\d/.test(password)).toBe(true)
    expect(/[^A-Za-z0-9]/.test(password)).toBe(true)
    expect(generatePassword({ ...allOn, excludeSimilar: true })).not.toMatch(/[Il1O0o]/)
    expect(() => generatePassword({ ...allOn, lowercase: false, uppercase: false, digits: false, symbols: false })).toThrow()
  })

  it('rates password strength', () => {
    expect(passwordStrength('').score).toBe(0)
    expect(passwordStrength('StrongPassword123!').score).toBeGreaterThanOrEqual(3)
  })

  it('generates unique numbers when requested', () => {
    const values = generateRandomNumbers(1, 1000, 50, true)
    expect(values).toHaveLength(50)
    expect(new Set(values).size).toBe(50)
    expect(values.every((value) => value >= 1 && value <= 1000)).toBe(true)
    expect(() => generateRandomNumbers(1, 2, 5, true)).toThrow(/too small/)
  })

  it('generates UUID v4 strings and gradients', () => {
    expect(generateUuid()).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/)
    expect(generateGradient(90).css).toContain('linear-gradient(90deg')
  })
})
