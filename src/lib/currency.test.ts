import { describe, expect, it } from 'vitest'
import { CURRENCIES, FALLBACK_RATES, convertCurrency } from './currency'

describe('currency', () => {
  it('converts between rates relative to a base', () => {
    const rates = { USD: 1, EUR: 0.9, JPY: 150 }
    expect(convertCurrency(100, 'USD', 'EUR', rates)).toBeCloseTo(90, 6)
    expect(convertCurrency(90, 'EUR', 'USD', rates)).toBeCloseTo(100, 6)
    expect(convertCurrency(1, 'USD', 'JPY', rates)).toBeCloseTo(150, 6)
    expect(() => convertCurrency(1, 'USD', 'XXX', rates)).toThrow()
  })

  it('has a fallback rate for every listed currency', () => {
    for (const [code] of CURRENCIES) {
      expect(FALLBACK_RATES[code]).toBeGreaterThan(0)
    }
    expect(FALLBACK_RATES.USD).toBe(1)
  })
})
