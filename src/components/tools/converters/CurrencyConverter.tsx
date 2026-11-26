import { AlertTriangle, ArrowDownUp, RefreshCw } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { CopyButton } from '../../ui/CopyButton'
import { Field } from '../../ui/Field'
import { Panel } from '../../ui/Panel'
import { StatTile } from '../../ui/StatTile'
import { CURRENCIES, convertCurrency, getRates, type RateResult } from '../../../lib/currency'
import { cn, formatNumber } from '../../../lib/utils'

export function CurrencyConverter() {
  const [amount, setAmount] = useState('100')
  const [from, setFrom] = useState('USD')
  const [to, setTo] = useState('EUR')
  const [rates, setRates] = useState<RateResult | null>(null)
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)

  async function load(base: string, force = false) {
    setBusy(true)
    try {
      const result = await getRates(base, force)
      setRates(result)
    } finally {
      setLoading(false)
      setBusy(false)
    }
  }

  useEffect(() => {
    void load(from)
  }, [from])

  const numeric = Number(amount)
  const converted = useMemo(() => {
    if (!rates || !Number.isFinite(numeric)) return 0
    try {
      return convertCurrency(numeric, from, to, rates.rates)
    } catch {
      return 0
    }
  }, [rates, numeric, from, to])

  function swap() {
    setFrom(to)
    setTo(from)
  }

  return (
    <div className="space-y-5">
      <Panel
        title="Currency conversion"
        subtitle="Rates are fetched in your browser; a bundled snapshot is used if both APIs are unavailable."
        action={
          <button type="button" onClick={() => void load(from, true)} className="btn-ghost !py-1.5 !text-xs" disabled={busy}>
            <RefreshCw className={cn('h-3.5 w-3.5', busy && 'animate-spin')} /> Refresh rates
          </button>
        }
      >
        <div className="grid items-end gap-3 md:grid-cols-[1fr_auto_1fr]">
          <Field label="Amount" htmlFor="currency-amount">
            <input id="currency-amount" type="number" min={0} value={amount} onChange={(event) => setAmount(event.target.value)} className="input-mono text-base" />
          </Field>
          <button type="button" onClick={swap} className="btn-icon mb-0.5 md:mb-0" aria-label="Swap currencies" title="Swap currencies">
            <ArrowDownUp className="h-4 w-4" />
          </button>
          <Field label="Converted amount">
            <input readOnly value={loading ? 'Loading…' : formatNumber(converted, 4)} className="input-mono text-base text-cyan" />
          </Field>
        </div>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          <Field label="From" htmlFor="currency-from">
            <select id="currency-from" value={from} onChange={(event) => setFrom(event.target.value)} className="input">
              {CURRENCIES.map(([code, name]) => (
                <option key={code} value={code}>
                  {code} — {name}
                </option>
              ))}
            </select>
          </Field>
          <Field label="To" htmlFor="currency-to">
            <select id="currency-to" value={to} onChange={(event) => setTo(event.target.value)} className="input">
              {CURRENCIES.map(([code, name]) => (
                <option key={code} value={code}>
                  {code} — {name}
                </option>
              ))}
            </select>
          </Field>
        </div>
        <div className="mt-5 flex flex-wrap items-center gap-2">
          <CopyButton value={formatNumber(converted, 4)} label="Copy amount" />
          <CopyButton value={`1 ${from} = ${formatNumber(rates ? convertCurrency(1, from, to, rates.rates) : 0, 6)} ${to}`} label="Copy rate" />
        </div>
      </Panel>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,0.8fr)]">
        <Panel title="Popular pairs" subtitle="Click to switch the pair instantly.">
          <div className="flex flex-wrap gap-2">
            {[
              ['USD', 'EUR'],
              ['USD', 'GBP'],
              ['EUR', 'JPY'],
              ['GBP', 'USD'],
              ['USD', 'INR'],
              ['AUD', 'USD'],
            ].map(([a, b]) => (
              <button
                key={`${a}-${b}`}
                type="button"
                onClick={() => {
                  setFrom(a)
                  setTo(b)
                }}
                className={cn(
                  'chip transition hover:border-cyan/40 hover:text-cyan',
                  from === a && to === b && 'chip-active',
                )}
              >
                {a} → {b}
              </button>
            ))}
          </div>
          <div className="mt-5 grid grid-cols-2 gap-2.5 sm:grid-cols-3">
            <StatTile label="From" value={from} />
            <StatTile label="To" value={to} />
            <StatTile label="Rate" value={formatNumber(rates ? convertCurrency(1, from, to, rates.rates) : 0, 6)} />
          </div>
        </Panel>

        <Panel title="Rate source">
          {loading ? (
            <p className="text-xs text-muted">Fetching the latest rates…</p>
          ) : rates?.source === 'live' ? (
            <div className="rounded-lg border border-emerald-500/25 bg-emerald-500/[0.06] p-4">
              <p className="text-xs font-medium text-emerald-400">Live exchange rates</p>
              <p className="mt-1.5 text-xs leading-relaxed text-muted">
                Provided by <span className="font-mono text-ink">{rates.provider}</span>.
              </p>
              <p className="mt-1 text-xs text-muted">Updated {rates.date}</p>
            </div>
          ) : (
            <div className="rounded-lg border border-amber-500/25 bg-amber-500/[0.06] p-4">
              <p className="flex items-center gap-1.5 text-xs font-medium text-amber-400">
                <AlertTriangle className="h-3.5 w-3.5" /> Offline snapshot
              </p>
              <p className="mt-1.5 text-xs leading-relaxed text-muted">
                Both rate APIs were unreachable, so a bundled reference table dated {rates?.date} is
                being used. Treat the result as an estimate.
              </p>
            </div>
          )}
          <p className="field-hint">Rates are cached for 30 minutes per base currency.</p>
        </Panel>
      </div>
    </div>
  )
}
