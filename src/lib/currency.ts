/**
 * Exchange rates are fetched live from open.er-api.com with a frankfurter.app
 * fallback. The bundled snapshot below is only used when both APIs are offline,
 * so the converter always produces a result and tells the user when it did.
 */
export const FALLBACK_RATES: Record<string, number> = {
  USD: 1,
  EUR: 0.9234,
  GBP: 0.7862,
  JPY: 151.64,
  CNY: 7.2431,
  INR: 83.12,
  AUD: 1.5312,
  CAD: 1.3724,
  CHF: 0.8842,
  HKD: 7.8214,
  SGD: 1.3421,
  SEK: 10.421,
  NOK: 10.782,
  DKK: 6.8721,
  NZD: 1.6512,
  ZAR: 18.642,
  BRL: 5.1243,
  MXN: 17.214,
  KRW: 1342.6,
  TRY: 32.184,
  RUB: 92.412,
  PLN: 3.9821,
  AED: 3.6725,
  SAR: 3.75,
}

export const FALLBACK_DATE = '2026-01-15'

export interface RateResult {
  rates: Record<string, number>
  base: string
  date: string
  source: 'live' | 'fallback'
  provider?: string
}

const cache = new Map<string, { result: RateResult; fetchedAt: number }>()
const CACHE_MS = 30 * 60 * 1000

async function fetchWithTimeout(url: string, timeoutMs = 6000): Promise<Response> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeoutMs)
  try {
    return await fetch(url, { signal: controller.signal })
  } finally {
    clearTimeout(timer)
  }
}

export async function getRates(base = 'USD', force = false): Promise<RateResult> {
  const key = base.toUpperCase()
  const cached = cache.get(key)
  if (!force && cached && Date.now() - cached.fetchedAt < CACHE_MS) return cached.result

  try {
    const response = await fetchWithTimeout(`https://open.er-api.com/v6/latest/${key}`)
    if (!response.ok) throw new Error(`HTTP ${response.status}`)
    const data = (await response.json()) as {
      result?: string
      time_last_update_utc?: string
      rates?: Record<string, number>
    }
    if (data.result !== 'success' || !data.rates) throw new Error('Unexpected payload')
    const result: RateResult = {
      rates: data.rates,
      base: key,
      date: data.time_last_update_utc ?? new Date().toISOString().slice(0, 10),
      source: 'live',
      provider: 'open.er-api.com',
    }
    cache.set(key, { result, fetchedAt: Date.now() })
    return result
  } catch {
    // Try the second provider.
  }

  try {
    const response = await fetchWithTimeout(`https://api.frankfurter.app/latest?from=${key}`)
    if (!response.ok) throw new Error(`HTTP ${response.status}`)
    const data = (await response.json()) as { date?: string; rates?: Record<string, number> }
    if (!data.rates) throw new Error('Unexpected payload')
    const result: RateResult = {
      rates: { [key]: 1, ...data.rates },
      base: key,
      date: data.date ?? new Date().toISOString().slice(0, 10),
      source: 'live',
      provider: 'frankfurter.app',
    }
    cache.set(key, { result, fetchedAt: Date.now() })
    return result
  } catch {
    // Offline: use bundled snapshot, re-based to the requested currency.
  }

  const usdRates = FALLBACK_RATES
  const baseRate = usdRates[key] ?? 1
  const rates = Object.fromEntries(
    Object.entries(usdRates).map(([code, rate]) => [code, rate / baseRate]),
  )
  return {
    rates: { [key]: 1, ...rates },
    base: key,
    date: FALLBACK_DATE,
    source: 'fallback',
  }
}

export function convertCurrency(
  amount: number,
  from: string,
  to: string,
  rates: Record<string, number>,
): number {
  const fromRate = rates[from.toUpperCase()]
  const toRate = rates[to.toUpperCase()]
  if (!fromRate || !toRate) throw new Error('Currency not available in the current rate table.')
  return (amount / fromRate) * toRate
}

export const CURRENCIES = [
  ['USD', 'US Dollar'],
  ['EUR', 'Euro'],
  ['GBP', 'British Pound'],
  ['JPY', 'Japanese Yen'],
  ['CNY', 'Chinese Yuan'],
  ['INR', 'Indian Rupee'],
  ['AUD', 'Australian Dollar'],
  ['CAD', 'Canadian Dollar'],
  ['CHF', 'Swiss Franc'],
  ['HKD', 'Hong Kong Dollar'],
  ['SGD', 'Singapore Dollar'],
  ['SEK', 'Swedish Krona'],
  ['NOK', 'Norwegian Krone'],
  ['DKK', 'Danish Krone'],
  ['NZD', 'New Zealand Dollar'],
  ['ZAR', 'South African Rand'],
  ['BRL', 'Brazilian Real'],
  ['MXN', 'Mexican Peso'],
  ['KRW', 'South Korean Won'],
  ['TRY', 'Turkish Lira'],
  ['RUB', 'Russian Ruble'],
  ['PLN', 'Polish Zloty'],
  ['AED', 'UAE Dirham'],
  ['SAR', 'Saudi Riyal'],
] as const
