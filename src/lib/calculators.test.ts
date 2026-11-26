import { describe, expect, it } from 'vitest'
import {
  applyPercent,
  calculateAge,
  evaluateExpression,
  numberStats,
  percentageOf,
  percentChange,
  percentOfWhole,
  splitBill,
} from './calculators'

describe('calculators', () => {
  it('evaluates arithmetic expressions safely', () => {
    expect(evaluateExpression('2 + 3 * 4')).toBe(14)
    expect(evaluateExpression('(2 + 3) * 4')).toBe(20)
    expect(evaluateExpression('-3 ^ 2')).toBe(-9)
    expect(evaluateExpression('2 ^ 3 ^ 2')).toBe(512)
    expect(evaluateExpression('10 % 4')).toBe(2)
    expect(evaluateExpression('1.5e2 / 3')).toBe(50)
    expect(() => evaluateExpression('1 / 0')).toThrow(/zero/)
    expect(() => evaluateExpression('(1 + 2')).toThrow(/parentheses/)
    expect(() => evaluateExpression('process.exit()')).toThrow()
  })

  it('computes percentages', () => {
    expect(percentageOf(200, 15)).toBe(30)
    expect(percentOfWhole(30, 200)).toBe(15)
    expect(percentChange(50, 60)).toBe(20)
    expect(applyPercent(100, 10, 'decrease')).toBe(90)
  })

  it('computes exact age', () => {
    const age = calculateAge(new Date(2000, 0, 15), new Date(2026, 0, 20))
    expect(age.years).toBe(26)
    expect(age.months).toBe(0)
    expect(age.days).toBe(5)
    expect(() => calculateAge(new Date(2030, 0, 1), new Date(2026, 0, 1))).toThrow(/future/)
  })

  it('splits bills with tax and tip', () => {
    const result = splitBill(100, 4, 20, 10)
    expect(result.tax).toBe(10)
    expect(result.tip).toBe(20)
    expect(result.total).toBe(130)
    expect(result.perPerson).toBe(32.5)
    expect(splitBill(100, 4, 20, 0, 12).tip).toBe(12)
  })

  it('summarises number lists', () => {
    const stats = numberStats([1, 2, 3, 4, 100])
    expect(stats.sum).toBe(110)
    expect(stats.mean).toBe(22)
    expect(stats.median).toBe(3)
    expect(stats.min).toBe(1)
    expect(stats.max).toBe(100)
    expect(numberStats([]).count).toBe(0)
  })
})
