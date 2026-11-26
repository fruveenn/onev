import { RefreshCw, Shuffle, Sparkles } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { CopyButton } from '../../ui/CopyButton'
import { Field } from '../../ui/Field'
import { Panel } from '../../ui/Panel'
import { ResultBox } from '../../ui/ResultBox'
import { Segmented } from '../../ui/Segmented'
import { StatTile } from '../../ui/StatTile'
import { Switch } from '../../ui/Switch'
import { copyToClipboard, cn, formatNumber } from '../../../lib/utils'
import {
  generateGradient,
  generatePassword,
  generateRandomNumbers,
  generateUuid,
  passwordStrength,
  type Gradient,
} from '../../../lib/generators'
import { loremIpsum } from '../../../lib/textTools'
import { EMOJI_CATEGORIES } from '../../../lib/emojiData'
import { useLocalStorage } from '../../../hooks/useLocalStorage'
import { useToast } from '../../../store/toast'

// ---------------------------------------------------------------- Password ----

export function PasswordGenerator() {
  const [length, setLength] = useState(20)
  const [uppercase, setUppercase] = useState(true)
  const [lowercase, setLowercase] = useState(true)
  const [digits, setDigits] = useState(true)
  const [symbols, setSymbols] = useState(true)
  const [excludeSimilar, setExcludeSimilar] = useState(false)
  const [password, setPassword] = useState('')

  const options = useMemo(
    () => ({ length, uppercase, lowercase, digits, symbols, excludeSimilar }),
    [length, uppercase, lowercase, digits, symbols, excludeSimilar],
  )

  useEffect(() => {
    try {
      setPassword(generatePassword(options))
    } catch {
      setPassword('')
    }
  }, [options])

  const strength = passwordStrength(password)
  const poolSize =
    (lowercase ? 26 : 0) +
    (uppercase ? 26 : 0) +
    (digits ? 10 : 0) +
    (symbols ? 27 : 0)
  const entropy = Math.round(length * Math.log2(Math.max(poolSize, 1)))
  const barColors = ['bg-rose-500', 'bg-orange-500', 'bg-amber-400', 'bg-emerald-400', 'bg-cyan']

  return (
    <div className="grid gap-5 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
      <Panel title="Configuration" subtitle="Adjust the rules and the password regenerates instantly.">
        <Field label={`Length — ${length} characters`} htmlFor="password-length">
          <input
            id="password-length"
            type="range"
            min={4}
            max={128}
            value={length}
            onChange={(event) => setLength(Number(event.target.value))}
            className="w-full accent-cyan"
          />
        </Field>
        <div className="mt-3 grid grid-cols-2 gap-x-5">
          <Switch checked={uppercase} onChange={setUppercase} label="Uppercase (A–Z)" />
          <Switch checked={lowercase} onChange={setLowercase} label="Lowercase (a–z)" />
          <Switch checked={digits} onChange={setDigits} label="Digits (0–9)" />
          <Switch checked={symbols} onChange={setSymbols} label="Symbols (!@#)" />
          <Switch
            checked={excludeSimilar}
            onChange={setExcludeSimilar}
            label="Exclude similar"
            hint="Remove I, l, 1, O and 0"
          />
        </div>
      </Panel>

      <div className="space-y-4">
        <Panel
          title="Generated password"
          action={
            <button
              type="button"
              className="btn-primary !py-1.5 !text-xs"
              onClick={() => setPassword(generatePassword(options))}
            >
              <RefreshCw className="h-3.5 w-3.5" /> Regenerate
            </button>
          }
        >
          <div className="rounded-lg border border-cyan/20 bg-base/60 p-4">
            <div className="break-all font-mono text-lg leading-relaxed text-cyan sm:text-xl">
              {password || 'Select at least one character set.'}
            </div>
          </div>
          <div className="mt-4">
            <div className="mb-1.5 flex items-center justify-between text-xs">
              <span className="text-muted">Strength</span>
              <span className="font-medium text-ink">{strength.label}</span>
            </div>
            <div className="flex gap-1.5">
              {[1, 2, 3, 4].map((level) => (
                <div
                  key={level}
                  className={cn(
                    'h-1.5 flex-1 rounded-full transition-colors',
                    level <= strength.score ? barColors[strength.score] : 'bg-slate-800',
                  )}
                />
              ))}
            </div>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-2.5">
            <StatTile label="Entropy" value={`${entropy} bits`} />
            <StatTile label="Characters" value={password.length} />
          </div>
          <div className="mt-4 flex justify-end">
            <CopyButton value={password} label="Copy password" />
          </div>
        </Panel>
        <p className="px-1 text-xs leading-relaxed text-slate-500">
          Generated with <code className="font-mono text-slate-400">crypto.getRandomValues</code> in your
          browser. Nothing is transmitted or stored.
        </p>
      </div>
    </div>
  )
}

// ------------------------------------------------------------------ Numbers ---

export function RandomNumberGenerator() {
  const { notify } = useToast()
  const [min, setMin] = useState('1')
  const [max, setMax] = useState('100')
  const [count, setCount] = useState('10')
  const [decimals, setDecimals] = useState('0')
  const [unique, setUnique] = useState(false)
  const [numbers, setNumbers] = useState<number[]>([])
  const [error, setError] = useState('')

  function generate() {
    try {
      const result = generateRandomNumbers(
        Number(min),
        Number(max),
        Number(count),
        unique,
        Number(decimals),
      )
      setNumbers(result)
      setError('')
    } catch (cause) {
      setNumbers([])
      setError(cause instanceof Error ? cause.message : 'Invalid settings')
      notify('Check your range settings', 'error')
    }
  }

  const output = numbers.join('\n')

  return (
    <div className="grid gap-5 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
      <Panel title="Range & quantity">
        <div className="grid grid-cols-2 gap-3">
          <Field label="Minimum" htmlFor="rng-min">
            <input id="rng-min" className="input-mono" value={min} onChange={(e) => setMin(e.target.value)} inputMode="decimal" />
          </Field>
          <Field label="Maximum" htmlFor="rng-max">
            <input id="rng-max" className="input-mono" value={max} onChange={(e) => setMax(e.target.value)} inputMode="decimal" />
          </Field>
          <Field label="Count" htmlFor="rng-count">
            <input id="rng-count" className="input-mono" value={count} onChange={(e) => setCount(e.target.value)} inputMode="numeric" />
          </Field>
          <Field label="Decimal places" htmlFor="rng-decimals">
            <input id="rng-decimals" className="input-mono" value={decimals} onChange={(e) => setDecimals(e.target.value)} inputMode="numeric" />
          </Field>
        </div>
        <div className="mt-2">
          <Switch checked={unique} onChange={setUnique} label="Unique values only" hint="No duplicates in the result" />
        </div>
        <button type="button" onClick={generate} className="btn-primary mt-3 w-full">
          <Shuffle className="h-4 w-4" /> Generate {count || '0'} values
        </button>
        {error && <p className="mt-3 text-xs text-rose-400">{error}</p>}
      </Panel>

      <Panel
        title="Results"
        subtitle={numbers.length ? `${numbers.length} values generated` : 'Ready when you are'}
        action={<CopyButton value={output} label="Copy all" />}
      >
        {numbers.length ? (
          <div className="flex max-h-[420px] flex-wrap content-start gap-2 overflow-y-auto rounded-lg border border-line/70 bg-base/50 p-3">
            {numbers.map((value, index) => (
              <button
                key={`${value}-${index}`}
                type="button"
                onClick={async () => {
                  const ok = await copyToClipboard(String(value))
                  notify(ok ? `Copied ${value}` : 'Could not copy', ok ? 'success' : 'error')
                }}
                className="rounded-md border border-line bg-panel px-2.5 py-1.5 font-mono text-xs text-cyan transition hover:border-cyan/40"
                title="Copy this value"
              >
                {formatNumber(value, Number(decimals) || 0)}
              </button>
            ))}
          </div>
        ) : (
          <ResultBox value="" />
        )}
      </Panel>
    </div>
  )
}

// ---------------------------------------------------------------- Gradients ---

const GRADIENT_PRESETS = [
  '135deg, #22D3EE, #3B82F6',
  '135deg, #8B5CF6, #EC4899',
  '135deg, #F59E0B, #EF4444',
  '135deg, #10B981, #22D3EE',
  '135deg, #F472B6, #8B5CF6',
  '135deg, #0EA5E9, #6366F1',
]

export function GradientGenerator() {
  const [angle, setAngle] = useState(135)
  const [from, setFrom] = useState('#22D3EE')
  const [to, setTo] = useState('#3B82F6')
  const [gradient, setGradient] = useState<Gradient | undefined>(undefined)

  useEffect(() => {
    setGradient({ colors: [from, to], css: `linear-gradient(${angle}deg, ${from}, ${to})` })
  }, [angle, from, to])

  const css = gradient?.css ?? ''

  function randomize() {
    const next = generateGradient(angle)
    setFrom(next.colors[0])
    setTo(next.colors[1])
  }

  return (
    <div className="grid gap-5 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
      <Panel title="Gradient controls">
        <div className="mb-4 h-32 rounded-lg border border-line/70" style={{ background: css }} />
        <Field label={`Angle — ${angle}°`} htmlFor="gradient-angle">
          <input
            id="gradient-angle"
            type="range"
            min={0}
            max={360}
            value={angle}
            onChange={(event) => setAngle(Number(event.target.value))}
            className="w-full accent-cyan"
          />
        </Field>
        <div className="mt-4 grid grid-cols-2 gap-3">
          <Field label="Start color" htmlFor="gradient-from">
            <div className="flex gap-2">
              <input
                id="gradient-from"
                type="color"
                value={from}
                onChange={(event) => setFrom(event.target.value.toUpperCase())}
                className="h-10 w-10 shrink-0 cursor-pointer rounded border border-line bg-transparent p-0.5"
              />
              <input className="input-mono" value={from} onChange={(event) => setFrom(event.target.value)} />
            </div>
          </Field>
          <Field label="End color" htmlFor="gradient-to">
            <div className="flex gap-2">
              <input
                id="gradient-to"
                type="color"
                value={to}
                onChange={(event) => setTo(event.target.value.toUpperCase())}
                className="h-10 w-10 shrink-0 cursor-pointer rounded border border-line bg-transparent p-0.5"
              />
              <input className="input-mono" value={to} onChange={(event) => setTo(event.target.value)} />
            </div>
          </Field>
        </div>
        <div className="mt-5">
          <span className="label">Presets</span>
          <div className="flex flex-wrap gap-2">
            {GRADIENT_PRESETS.map((preset) => (
              <button
                key={preset}
                type="button"
                onClick={() => {
                  const parts = preset.split(', ')
                  setAngle(Number(parts[0]))
                  setFrom(parts[1])
                  setTo(parts[2])
                }}
                className="h-8 w-12 rounded border border-line/70 transition hover:scale-105 hover:border-cyan/50"
                style={{ background: `linear-gradient(${preset})` }}
                aria-label={`Use preset ${preset}`}
              />
            ))}
          </div>
        </div>
        <button type="button" onClick={randomize} className="btn-ghost mt-5 w-full !text-xs">
          <Shuffle className="h-3.5 w-3.5" /> Surprise me
        </button>
      </Panel>

      <Panel title="CSS output" action={<CopyButton value={`background: ${css};`} label="Copy CSS" />}>
        <ResultBox label="background" value={`background: ${css};`} />
        <div className="mt-4 rounded-lg border border-line/70 bg-base/50 p-5">
          <p className="text-xs text-slate-500">Live preview</p>
          <div className="mt-3 h-24 rounded-lg" style={{ background: css }} />
          <div className="mt-3 flex gap-2">
            <span className="h-6 w-6 rounded-full border border-white/10" style={{ background: from }} />
            <span className="h-6 w-6 rounded-full border border-white/10" style={{ background: to }} />
            <span className="ml-2 font-mono text-[11px] text-slate-500">
              {from} → {to}
            </span>
          </div>
        </div>
      </Panel>
    </div>
  )
}

// -------------------------------------------------------------------- Emoji ----

export function EmojiPicker() {
  const { notify } = useToast()
  const [category, setCategory] = useState(EMOJI_CATEGORIES[0].id)
  const [query, setQuery] = useState('')
  const [recent, setRecent] = useLocalStorage<string[]>('onev:emoji-recent', [])

  const active = EMOJI_CATEGORIES.find((item) => item.id === category) ?? EMOJI_CATEGORIES[0]
  const emojis = query.trim()
    ? EMOJI_CATEGORIES.flatMap((item) => item.emojis).filter((emoji) =>
        emoji.name.includes(query.trim().toLowerCase()),
      )
    : active.emojis

  async function pick(char: string) {
    const ok = await copyToClipboard(char)
    if (ok) {
      setRecent((current) => [char, ...current.filter((item) => item !== char)].slice(0, 24))
      notify(`Copied ${char}`)
    } else {
      notify('Could not copy the emoji', 'error')
    }
  }

  return (
    <div>
      <Panel title="Emoji library" subtitle="Click any emoji to copy it to your clipboard.">
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search by name — try “rocket” or “heart”…"
          aria-label="Search emojis"
          className="input"
        />
        <div className="mt-3 flex flex-wrap gap-1.5">
          {EMOJI_CATEGORIES.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => {
                setCategory(item.id)
                setQuery('')
              }}
              className={cn(
                'rounded-md px-2.5 py-1.5 text-xs transition',
                category === item.id && !query
                  ? 'bg-cyan/10 text-cyan'
                  : 'text-muted hover:bg-slate-800/60 hover:text-ink',
              )}
            >
              {item.label}
            </button>
          ))}
        </div>

        {recent.length > 0 && !query && (
          <div className="mt-5">
            <span className="label">Recently copied</span>
            <div className="flex flex-wrap gap-1.5">
              {recent.map((char, index) => (
                <button
                  key={`${char}-${index}`}
                  type="button"
                  onClick={() => pick(char)}
                  className="h-9 w-9 rounded-lg border border-line/70 bg-base/50 text-lg transition hover:border-cyan/40"
                >
                  {char}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="mt-5">
          <span className="label">
            {query ? `${emojis.length} results` : active.label}
          </span>
          {emojis.length ? (
            <div className="grid grid-cols-[repeat(auto-fill,minmax(44px,1fr))] gap-1.5 sm:grid-cols-[repeat(auto-fill,minmax(48px,1fr))]">
              {emojis.map((emoji, index) => (
                <button
                  key={`${emoji.char}-${index}`}
                  type="button"
                  onClick={() => pick(emoji.char)}
                  title={emoji.name}
                  className="flex h-11 items-center justify-center rounded-lg border border-line/60 bg-base/40 text-xl transition hover:border-cyan/40 hover:bg-cyan/5"
                >
                  {emoji.char}
                </button>
              ))}
            </div>
          ) : (
            <p className="py-8 text-center text-xs text-muted">No emojis matched that name.</p>
          )}
        </div>
      </Panel>
    </div>
  )
}

// --------------------------------------------------------------------- UUID ----

export function UuidGenerator() {
  const [count, setCount] = useState(10)
  const [uppercase, setUppercase] = useState(false)
  const [braces, setBraces] = useState(false)
  const [values, setValues] = useState<string[]>(() =>
    Array.from({ length: 10 }, () => generateUuid()),
  )

  function generate(nextCount = count, nextUpper = uppercase, nextBraces = braces) {
    const safeCount = Math.min(Math.max(Math.floor(nextCount) || 1, 1), 100)
    setValues(
      Array.from({ length: safeCount }, () => {
        let value = generateUuid()
        if (nextUpper) value = value.toUpperCase()
        if (nextBraces) value = `{${value}}`
        return value
      }),
    )
  }

  const output = values.join('\n')

  return (
    <div className="grid gap-5 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)]">
      <Panel title="UUID options">
        <Field label="How many UUIDs" htmlFor="uuid-count">
          <input
            id="uuid-count"
            type="number"
            min={1}
            max={100}
            value={count}
            onChange={(event) => setCount(Number(event.target.value))}
            className="input-mono"
          />
        </Field>
        <div className="mt-2">
          <Switch checked={uppercase} onChange={(next) => { setUppercase(next); generate(count, next, braces) }} label="Uppercase" />
          <Switch checked={braces} onChange={(next) => { setBraces(next); generate(count, uppercase, next) }} label="Wrap in braces" />
        </div>
        <button type="button" onClick={() => generate()} className="btn-primary mt-3 w-full">
          <Sparkles className="h-4 w-4" /> Generate UUIDs
        </button>
      </Panel>
      <Panel title="Generated identifiers" action={<CopyButton value={output} label="Copy all" />}>
        <ResultBox value={output} minHeight="260px" />
      </Panel>
    </div>
  )
}

// -------------------------------------------------------------------- Lorem ----

export function LoremGenerator() {
  const [mode, setMode] = useState<'paragraphs' | 'sentences' | 'words'>('paragraphs')
  const [count, setCount] = useState(3)
  const [text, setText] = useState(() => loremIpsum(3, 'paragraphs'))

  function generate(nextMode = mode, nextCount = count) {
    setText(loremIpsum(nextCount || 1, nextMode))
  }

  return (
    <div className="space-y-5">
      <Panel title="Placeholder options">
        <div className="flex flex-wrap items-end gap-4">
          <Field label="Generate" className="w-40">
            <Segmented
              value={mode}
              onChange={(next) => {
                setMode(next)
                generate(next, count)
              }}
              options={[
                { value: 'paragraphs', label: 'Paragraphs' },
                { value: 'sentences', label: 'Sentences' },
                { value: 'words', label: 'Words' },
              ]}
              size="sm"
            />
          </Field>
          <Field label="Quantity" htmlFor="lorem-count" className="w-28">
            <input
              id="lorem-count"
              type="number"
              min={1}
              max={100}
              value={count}
              onChange={(event) => setCount(Number(event.target.value))}
              className="input-mono"
            />
          </Field>
          <button type="button" onClick={() => generate()} className="btn-primary mb-0.5">
            <RefreshCw className="h-4 w-4" /> Regenerate
          </button>
        </div>
      </Panel>
      <Panel title="Output" action={<CopyButton value={text} label="Copy text" />}>
        <ResultBox value={text} mono={false} minHeight="240px" />
      </Panel>
    </div>
  )
}
