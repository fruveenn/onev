import { Delete, Equal, Plus } from 'lucide-react'
import { useMemo, useState, type KeyboardEvent } from 'react'
import { CopyButton } from '../../ui/CopyButton'
import { Field } from '../../ui/Field'
import { Panel } from '../../ui/Panel'
import { ResultBox } from '../../ui/ResultBox'
import { Segmented } from '../../ui/Segmented'
import { StatTile } from '../../ui/StatTile'
import {
  applyPercent,
  calculateAge,
  evaluateExpression,
  numberStats,
  percentageOf,
  percentChange,
  percentOfWhole,
  splitBill,
} from '../../../lib/calculators'
import { cn, formatNumber } from '../../../lib/utils'

const money = (value: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value)
const num = (value: number, digits = 4) => formatNumber(Number(value.toFixed(digits)), digits)

// ------------------------------------------------------------------- Basic -----

const KEYS = [
  ['C', '(', ')', '÷'],
  ['7', '8', '9', '×'],
  ['4', '5', '6', '−'],
  ['1', '2', '3', '+'],
  ['0', '.', '⌫', '='],
]

export function BasicCalculator() {
  const [expression, setExpression] = useState('')
  const [result, setResult] = useState('')
  const [error, setError] = useState('')

  const preview = useMemo(() => {
    if (!expression.trim()) return ''
    try {
      return num(evaluateExpression(expression))
    } catch {
      return ''
    }
  }, [expression])

  function calculate() {
    try {
      const value = evaluateExpression(expression)
      setResult(num(value, 10))
      setError('')
    } catch (cause) {
      setResult('')
      setError(cause instanceof Error ? cause.message : 'Invalid expression')
    }
  }

  function append(key: string) {
    if (key === 'C') {
      setExpression('')
      setResult('')
      setError('')
      return
    }
    if (key === '⌫') {
      setExpression((current) => current.slice(0, -1))
      return
    }
    if (key === '=') {
      calculate()
      return
    }
    const symbol: Record<string, string> = { '÷': '/', '×': '*', '−': '-' }
    setExpression((current) => current + (symbol[key] ?? key))
  }

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === 'Enter') {
      event.preventDefault()
      calculate()
    }
    if (event.key === 'Escape') {
      setExpression('')
      setResult('')
      setError('')
    }
  }

  return (
    <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,0.9fr)]">
      <Panel title="Calculator" subtitle="Type an expression or use the keypad. Enter evaluates.">
        <div className="rounded-lg border border-line/70 bg-base/60 p-4">
          <input
            value={expression}
            onChange={(event) => setExpression(event.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="e.g. (12 + 8) * 3 ^ 2"
            aria-label="Expression"
            className="w-full bg-transparent text-right font-mono text-lg text-ink outline-none placeholder:text-slate-600"
          />
          <div className="mt-1 min-h-6 text-right font-mono text-xs text-slate-500">
            {preview && `≈ ${preview}`}
          </div>
          <div className="mt-2 border-t border-line/70 pt-3 text-right font-mono text-3xl font-medium text-gradient">
            {result || '0'}
          </div>
        </div>

        <div className="mt-4 grid grid-cols-4 gap-2">
          {KEYS.flat().map((key) => {
            const isAction = ['C', '⌫', '='].includes(key)
            return (
              <button
                key={key}
                type="button"
                onClick={() => append(key)}
                className={cn(
                  'flex h-12 items-center justify-center rounded-lg border text-sm font-medium transition',
                  key === '='
                    ? 'border-cyan/40 bg-gradient-to-r from-cyan to-electric text-slate-950 hover:brightness-110'
                    : isAction
                      ? 'border-line bg-panel-soft text-muted hover:border-cyan/30 hover:text-ink'
                      : 'border-line/70 bg-panel-soft/60 text-ink hover:border-cyan/30 hover:bg-cyan/5',
                )}
              >
                {key === '=' ? <Equal className="h-4 w-4" /> : key === '⌫' ? <Delete className="h-4 w-4" /> : key}
              </button>
            )
          })}
        </div>
        <div className="mt-3 flex gap-2">
          <button type="button" onClick={() => { setExpression(''); setResult(''); setError('') }} className="btn-ghost flex-1 !text-xs">
            Clear all
          </button>
          <button type="button" onClick={calculate} className="btn-primary flex-1 !text-xs">
            <Plus className="h-3.5 w-3.5" /> Calculate
          </button>
        </div>
        {error && <p className="mt-3 text-xs text-rose-400">{error}</p>}
      </Panel>

      <Panel title="Supported input">
        <ul className="space-y-2.5 text-xs leading-relaxed text-muted">
          <li>• Operators: <code className="font-mono text-cyan">+ - * / % ^</code> (also × and ÷)</li>
          <li>• Parentheses and unary minus, e.g. <code className="font-mono text-cyan">-3*(2+4)</code></li>
          <li>• Scientific notation, e.g. <code className="font-mono text-cyan">1.5e3</code></li>
          <li>• No <code className="font-mono">eval()</code> — expressions are parsed locally.</li>
        </ul>
        <div className="mt-5">
          <CopyButton value={result} label="Copy result" />
        </div>
      </Panel>
    </div>
  )
}

// --------------------------------------------------------------- Percentage ----

type PercentMode = 'of' | 'what' | 'change'

export function PercentageCalculator() {
  const [mode, setMode] = useState<PercentMode>('of')
  const [a, setA] = useState('20')
  const [b, setB] = useState('150')

  const result = useMemo(() => {
    const x = Number(a)
    const y = Number(b)
    if (!Number.isFinite(x) || !Number.isFinite(y)) return null
    switch (mode) {
      case 'of':
        return { label: `${num(x)}% of ${num(y)}`, value: num(percentageOf(y, x)), unit: '' }
      case 'what':
        return { label: `${num(x)} is what % of ${num(y)}`, value: num(percentOfWhole(x, y)), unit: '%' }
      case 'change':
        return { label: `Change from ${num(x)} to ${num(y)}`, value: num(percentChange(x, y)), unit: '%' }
    }
  }, [mode, a, b])

  return (
    <div className="space-y-5">
      <Panel title="Choose a calculation">
        <Segmented
          value={mode}
          onChange={setMode}
          options={[
            { value: 'of', label: 'X% of Y' },
            { value: 'what', label: 'What % is X of Y' },
            { value: 'change', label: '% change' },
          ]}
        />
      </Panel>
      <div className="grid gap-5 lg:grid-cols-2">
        <Panel title="Values">
          <div className="grid grid-cols-2 gap-3">
            <Field label={mode === 'of' ? 'Percentage (%)' : 'X (initial)'} htmlFor="percent-a">
              <input id="percent-a" type="number" className="input-mono" value={a} onChange={(event) => setA(event.target.value)} />
            </Field>
            <Field label={mode === 'of' ? 'Value' : 'Y (final)'} htmlFor="percent-b">
              <input id="percent-b" type="number" className="input-mono" value={b} onChange={(event) => setB(event.target.value)} />
            </Field>
          </div>
          <div className="mt-5 grid grid-cols-2 gap-3">
            <StatTile label="Increase by X%" value={num(applyPercent(Number(b) || 0, Number(a) || 0, 'increase'))} />
            <StatTile label="Decrease by X%" value={num(applyPercent(Number(b) || 0, Number(a) || 0, 'decrease'))} />
          </div>
        </Panel>
        <Panel title="Result" action={<CopyButton value={result ? `${result.value}${result.unit}` : ''} label="Copy" />}>
          <div className="rounded-lg border border-cyan/20 bg-cyan/[0.04] p-5">
            <p className="text-xs text-muted">{result?.label ?? 'Enter valid numbers'}</p>
            <p className="mt-2 font-mono text-4xl font-medium text-gradient">
              {result ? `${result.value}${result.unit}` : '—'}
            </p>
          </div>
        </Panel>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------- Age ----

export function AgeCalculator() {
  const [birth, setBirth] = useState('')
  const result = useMemo(() => {
    if (!birth) return { value: null, error: '' }
    try {
      return { value: calculateAge(new Date(`${birth}T00:00:00`)), error: '' }
    } catch (cause) {
      return { value: null, error: cause instanceof Error ? cause.message : 'Invalid date' }
    }
  }, [birth])

  return (
    <div className="grid gap-5 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)]">
      <Panel title="Date of birth">
        <Field label="Birth date" htmlFor="birth-date">
          <input id="birth-date" type="date" value={birth} max={new Date().toISOString().slice(0, 10)} onChange={(event) => setBirth(event.target.value)} className="input" />
        </Field>
        {result.error && <p className="mt-3 text-xs text-rose-400">{result.error}</p>}
        <p className="field-hint">Your date is only used in this browser tab.</p>
      </Panel>
      <Panel title="Exact age">
        {result.value ? (
          <>
            <div className="grid grid-cols-3 gap-2.5">
              <StatTile label="Years" value={result.value.years} />
              <StatTile label="Months" value={result.value.months} />
              <StatTile label="Days" value={result.value.days} />
            </div>
            <div className="mt-4 rounded-lg border border-line/70 bg-base/50 p-4">
              <p className="font-mono text-2xl text-ink">
                {result.value.years} <span className="text-sm text-muted">years old</span>
              </p>
              <p className="mt-2 text-xs text-muted">
                That&apos;s roughly <span className="font-mono text-cyan">{result.value.totalDays.toLocaleString()}</span> days on Earth.
              </p>
              <p className="mt-1 text-xs text-muted">
                Next birthday in <span className="font-mono text-cyan">{result.value.nextBirthdayDays}</span> days.
              </p>
            </div>
          </>
        ) : (
          <ResultBox value="" />
        )}
      </Panel>
    </div>
  )
}

// ----------------------------------------------------------------- Split bill --

export function SplitBillCalculator() {
  const [total, setTotal] = useState('120')
  const [people, setPeople] = useState('4')
  const [tax, setTax] = useState('8.5')
  const [tipPercent, setTipPercent] = useState('15')
  const [customTip, setCustomTip] = useState('0')

  const result = useMemo(
    () =>
      splitBill(
        Number(total) || 0,
        Number(people) || 1,
        Number(tipPercent) || 0,
        Number(tax) || 0,
        Number(customTip) || 0,
      ),
    [total, people, tipPercent, tax, customTip],
  )

  return (
    <div className="grid gap-5 lg:grid-cols-2">
      <Panel title="Bill details">
        <div className="grid grid-cols-2 gap-3">
          <Field label="Bill total" htmlFor="bill-total">
            <input id="bill-total" type="number" min={0} className="input-mono" value={total} onChange={(event) => setTotal(event.target.value)} />
          </Field>
          <Field label="People" htmlFor="bill-people">
            <input id="bill-people" type="number" min={1} className="input-mono" value={people} onChange={(event) => setPeople(event.target.value)} />
          </Field>
          <Field label="Tax %" htmlFor="bill-tax">
            <input id="bill-tax" type="number" min={0} className="input-mono" value={tax} onChange={(event) => setTax(event.target.value)} />
          </Field>
          <Field label="Tip %" htmlFor="bill-tip">
            <input id="bill-tip" type="number" min={0} className="input-mono" value={tipPercent} onChange={(event) => setTipPercent(event.target.value)} />
          </Field>
          <Field label="Custom tip (overrides %)" htmlFor="bill-custom-tip" className="col-span-2">
            <input id="bill-custom-tip" type="number" min={0} className="input-mono" value={customTip} onChange={(event) => setCustomTip(event.target.value)} />
          </Field>
        </div>
      </Panel>
      <Panel title="Breakdown" action={<CopyButton value={money(result.perPerson)} label="Copy per person" />}>
        <div className="space-y-2 text-sm">
          <Row label="Subtotal" value={money(result.subtotal)} />
          <Row label={`Tax (${Number(tax) || 0}%)`} value={money(result.tax)} />
          <Row label="Tip" value={money(result.tip)} />
          <div className="divider my-2" />
          <Row label="Grand total" value={money(result.total)} strong />
          <div className="mt-4 rounded-lg border border-cyan/25 bg-cyan/[0.06] p-4">
            <p className="text-[11px] uppercase tracking-wider text-cyan/70">Per person</p>
            <p className="mt-1 font-mono text-3xl font-medium text-ink">{money(result.perPerson)}</p>
            <p className="mt-1 text-xs text-muted">Split across {Math.max(1, Math.floor(Number(people) || 1))} people</p>
          </div>
        </div>
      </Panel>
    </div>
  )
}

function Row({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className={cn('text-muted', strong && 'font-medium text-ink')}>{label}</span>
      <span className={cn('font-mono text-ink', strong && 'font-semibold')}>{value}</span>
    </div>
  )
}

// ------------------------------------------------------------------ Average ----

export function AverageCalculator() {
  const [input, setInput] = useState('12, 18, 24, 30, 36')
  const values = useMemo(
    () =>
      input
        .split(/[\s,;]+/)
        .map((part) => Number(part))
        .filter((value) => Number.isFinite(value)),
    [input],
  )
  const stats = numberStats(values)

  return (
    <div className="grid gap-5 lg:grid-cols-2">
      <Panel title="Numbers" subtitle="Separate values with commas, spaces or new lines.">
        <textarea value={input} onChange={(event) => setInput(event.target.value)} rows={12} className="input-mono min-h-[240px] w-full resize-y" placeholder="10, 20, 30" aria-label="Numbers" />
      </Panel>
      <Panel title="Statistics">
        <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
          <StatTile label="Count" value={stats.count} />
          <StatTile label="Sum" value={num(stats.sum)} />
          <StatTile label="Mean" value={num(stats.mean)} />
          <StatTile label="Median" value={num(stats.median)} />
          <StatTile label="Minimum" value={num(stats.min)} />
          <StatTile label="Maximum" value={num(stats.max)} />
          <StatTile label="Range" value={num(stats.range)} />
        </div>
        <div className="mt-4">
          <CopyButton value={String(stats.mean)} label="Copy mean" />
        </div>
      </Panel>
    </div>
  )
}

// ---------------------------------------------------------------------- Tip ----

export function TipCalculator() {
  const [bill, setBill] = useState('80')
  const [tip, setTip] = useState(18)
  const [people, setPeople] = useState('1')
  const tipAmount = percentageOf(Number(bill) || 0, tip)
  const total = (Number(bill) || 0) + tipAmount
  const perPerson = total / Math.max(1, Math.floor(Number(people) || 1))

  return (
    <div className="space-y-5">
      <Panel title="Tip percentage">
        <div className="flex flex-wrap gap-2">
          {[10, 15, 18, 20, 25].map((value) => (
            <button
              key={value}
              type="button"
              onClick={() => setTip(value)}
              className={cn(
                'rounded-lg border px-4 py-2 text-sm font-medium transition',
                tip === value
                  ? 'border-cyan/40 bg-cyan/10 text-cyan'
                  : 'border-line bg-panel-soft text-muted hover:text-ink',
              )}
            >
              {value}%
            </button>
          ))}
          <div className="ml-auto flex items-center gap-2">
            <input
              type="number"
              min={0}
              value={tip}
              onChange={(event) => setTip(Number(event.target.value))}
              aria-label="Custom tip percentage"
              className="input-mono w-20"
            />
            <span className="text-xs text-muted">custom %</span>
          </div>
        </div>
      </Panel>
      <div className="grid gap-5 lg:grid-cols-2">
        <Panel title="Bill">
          <div className="grid grid-cols-2 gap-3">
            <Field label="Bill amount" htmlFor="tip-bill">
              <input id="tip-bill" type="number" min={0} className="input-mono" value={bill} onChange={(event) => setBill(event.target.value)} />
            </Field>
            <Field label="Split between" htmlFor="tip-people">
              <input id="tip-people" type="number" min={1} className="input-mono" value={people} onChange={(event) => setPeople(event.target.value)} />
            </Field>
          </div>
        </Panel>
        <Panel title="Result" action={<CopyButton value={money(total)} label="Copy total" />}>
          <div className="grid grid-cols-2 gap-2.5">
            <StatTile label="Tip" value={money(tipAmount)} />
            <StatTile label="Total" value={money(total)} />
            <StatTile label="Per person" value={money(perPerson)} />
            <StatTile label="Tip rate" value={`${tip}%`} />
          </div>
        </Panel>
      </div>
    </div>
  )
}
