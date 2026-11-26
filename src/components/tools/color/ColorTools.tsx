import { ClipboardCheck, RefreshCw, Shuffle, Sun } from 'lucide-react'
import { useMemo, useState } from 'react'
import { CopyButton } from '../../ui/CopyButton'
import { Field } from '../../ui/Field'
import { Panel } from '../../ui/Panel'
import { Segmented } from '../../ui/Segmented'
import { StatTile } from '../../ui/StatTile'
import {
  contrastRatio,
  generatePalette,
  hexToHsl,
  hslToHex,
  parseColor,
  randomHexColor,
  readableTextColor,
  rgbToHex,
  rgbToHsl,
  type PaletteMode,
} from '../../../lib/color'
import { cn, copyToClipboard } from '../../../lib/utils'
import { useToast } from '../../../store/toast'

// ------------------------------------------------------------ Color converter ---

export function ColorConverter() {
  const [input, setInput] = useState('#C6F36B')
  const rgb = parseColor(input)
  const hsl = rgb ? rgbToHsl(rgb) : { h: 0, s: 0, l: 0 }
  const validHex = rgb ? rgbToHex(rgb) : '#000000'
  const invalid = input.trim().length > 0 && !rgb

  function updateRgb(channel: 'r' | 'g' | 'b', value: number) {
    if (!rgb) return
    setInput(rgbToHex({ ...rgb, [channel]: value }))
  }

  function updateHsl(channel: 'h' | 's' | 'l', value: number) {
    setInput(hslToHex({ ...hsl, [channel]: value }))
  }

  const rgbText = rgb ? `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})` : ''
  const hslText = `hsl(${hsl.h}, ${hsl.s}%, ${hsl.l}%)`

  return (
    <div className="grid gap-5 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
      <Panel title="Pick a color" subtitle="Use the picker, type a value, or move the sliders.">
        <div className="h-36 rounded-lg border border-line/70 transition-colors" style={{ background: validHex }} />
        <div className="mt-4 flex gap-2">
          <input
            type="color"
            value={validHex}
            onChange={(event) => setInput(event.target.value.toUpperCase())}
            className="h-10 w-12 shrink-0 cursor-pointer rounded border border-line bg-transparent p-0.5"
            aria-label="Color picker"
          />
          <input
            value={input}
            onChange={(event) => setInput(event.target.value)}
            className={cn('input-mono flex-1', invalid && '!border-rose-500/60')}
            placeholder="#C6F36B, rgb(198, 243, 107), hsl(80, 85%, 69%)"
            aria-label="Color value"
          />
        </div>
        {invalid && <p className="mt-2 text-xs text-rose-400">Unrecognized color format. Try #RRGGBB.</p>}

        <div className="mt-6 space-y-4">
          {(['r', 'g', 'b'] as const).map((channel) => (
            <div key={channel}>
              <div className="mb-1.5 flex justify-between text-xs">
                <span className="uppercase tracking-wider text-muted">{channel}</span>
                <span className="font-mono text-ink">{rgb?.[channel] ?? 0}</span>
              </div>
              <input
                type="range"
                min={0}
                max={255}
                value={rgb?.[channel] ?? 0}
                onChange={(event) => updateRgb(channel, Number(event.target.value))}
                className="w-full accent-cyan"
                aria-label={`${channel} channel`}
              />
            </div>
          ))}
        </div>
      </Panel>

      <div className="space-y-5">
        <Panel title="Color values" subtitle="Click any value to copy it.">
          <div className="space-y-2">
            {[
              ['HEX', validHex],
              ['RGB', rgbText],
              ['HSL', hslText],
            ].map(([label, value]) => (
              <button
                key={label}
                type="button"
                onClick={() => value && void copyToClipboard(value)}
                className="flex w-full items-center justify-between gap-3 rounded-lg border border-line/70 bg-base/50 px-3.5 py-3 text-left transition hover:border-cyan/30"
              >
                <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">{label}</span>
                <span className="font-mono text-[13px] text-ink">{value || '—'}</span>
                <ClipboardCheck className="h-3.5 w-3.5 text-slate-600" />
              </button>
            ))}
          </div>
          <div className="mt-4 grid grid-cols-2 gap-2.5">
            <StatTile label="Hue" value={`${hsl.h}°`} />
            <StatTile label="Lightness" value={`${hsl.l}%`} />
          </div>
        </Panel>

        <Panel title="HSL fine-tuning">
          <div className="grid gap-4 sm:grid-cols-3">
            {(['h', 's', 'l'] as const).map((channel) => (
              <Field key={channel} label={`${channel.toUpperCase()} — ${hsl[channel]}${channel === 'h' ? '°' : '%'}`}>
                <input
                  type="range"
                  min={0}
                  max={channel === 'h' ? 360 : 100}
                  value={hsl[channel]}
                  onChange={(event) => updateHsl(channel, Number(event.target.value))}
                  className="w-full accent-cyan"
                  aria-label={`${channel} channel`}
                />
              </Field>
            ))}
          </div>
        </Panel>

        <Panel title="On this background">
          <div
            className="flex h-24 items-center justify-center rounded-lg border border-line/70 text-sm"
            style={{ background: validHex, color: readableTextColor(validHex) }}
          >
            Readable text preview
          </div>
        </Panel>
      </div>
    </div>
  )
}

// ------------------------------------------------------------ Palette builder ---

export function PaletteGenerator() {
  const { notify } = useToast()
  const [base, setBase] = useState('#C6F36B')
  const [mode, setMode] = useState<PaletteMode>('analogous')
  const palette = useMemo(() => generatePalette(base, mode), [base, mode])

  return (
    <div className="space-y-5">
      <Panel title="Palette settings">
        <div className="flex flex-wrap items-end gap-4">
          <Field label="Base color" htmlFor="palette-color" className="w-44">
            <div className="flex gap-2">
              <input
                id="palette-color"
                type="color"
                value={parseColor(base) ? rgbToHex(parseColor(base)!) : '#C6F36B'}
                onChange={(event) => setBase(event.target.value.toUpperCase())}
                className="h-10 w-11 shrink-0 cursor-pointer rounded border border-line bg-transparent p-0.5"
              />
              <input value={base} onChange={(event) => setBase(event.target.value)} className="input-mono" />
            </div>
          </Field>
          <Field label="Harmony">
            <Segmented
              size="sm"
              value={mode}
              onChange={setMode}
              options={[
                { value: 'complementary', label: 'Complementary' },
                { value: 'analogous', label: 'Analogous' },
                { value: 'triadic', label: 'Triadic' },
                { value: 'monochromatic', label: 'Monochromatic' },
              ]}
            />
          </Field>
          <button type="button" onClick={() => setBase(randomHexColor())} className="btn-ghost mb-0.5 !text-xs">
            <Shuffle className="h-3.5 w-3.5" /> Random base
          </button>
        </div>
      </Panel>
      <Panel title="Generated palette" subtitle="Click a swatch to copy its hex value.">
        {palette.length ? (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
            {palette.map((color, index) => (
              <button
                key={`${color}-${index}`}
                type="button"
                onClick={async () => {
                  const ok = await copyToClipboard(color)
                  notify(ok ? `Copied ${color}` : 'Could not copy', ok ? 'success' : 'error')
                }}
                className="group overflow-hidden rounded-lg border border-line/70 text-left transition hover:border-cyan/40"
              >
                <div className="h-28 transition-transform group-hover:scale-[1.03]" style={{ background: color }} />
                <div className="bg-panel-soft px-3 py-2.5">
                  <p className="font-mono text-xs text-ink">{color}</p>
                  <p className="mt-0.5 text-[10px] text-slate-500">{hexToHsl(color) ? `hsl(${hexToHsl(color)!.h}, ${hexToHsl(color)!.s}%, ${hexToHsl(color)!.l}%)` : ''}</p>
                </div>
              </button>
            ))}
          </div>
        ) : (
          <p className="py-8 text-center text-xs text-rose-400">Enter a valid hex color to generate a palette.</p>
        )}
        {palette.length > 0 && (
          <div className="mt-5 flex justify-end">
            <CopyButton value={palette.join(', ')} label="Copy all hex values" />
          </div>
        )}
      </Panel>
    </div>
  )
}

// ----------------------------------------------------------- Contrast checker ---

export function ContrastChecker() {
  const [foreground, setForeground] = useState('#C6F36B')
  const [background, setBackground] = useState('#15171A')
  const ratio = useMemo(() => contrastRatio(foreground, background), [foreground, background])

  function swap() {
    setForeground(background)
    setBackground(foreground)
  }

  const passes = (threshold: number) => (ratio !== null ? ratio >= threshold : false)

  return (
    <div className="grid gap-5 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
      <Panel title="Colors" action={<button type="button" onClick={swap} className="btn-ghost !py-1.5 !text-xs"><RefreshCw className="h-3.5 w-3.5" /> Swap</button>}>
        <div className="space-y-4">
          {([
            ['Foreground', foreground, setForeground],
            ['Background', background, setBackground],
          ] as const).map(([label, value, setter]) => (
            <Field key={label} label={label} htmlFor={`color-${label}`}>
              <div className="flex gap-2">
                <input
                  id={`color-${label}`}
                  type="color"
                  value={parseColor(value) ? rgbToHex(parseColor(value)!) : '#000000'}
                  onChange={(event) => setter(event.target.value.toUpperCase())}
                  className="h-10 w-11 shrink-0 cursor-pointer rounded border border-line bg-transparent p-0.5"
                />
                <input value={value} onChange={(event) => setter(event.target.value)} className="input-mono" />
              </div>
            </Field>
          ))}
        </div>
      </Panel>

      <Panel title="Contrast result">
        <div className="rounded-lg border border-line/70 p-4" style={{ background, color: foreground }}>
          <p className="text-[10px] uppercase tracking-[0.18em] opacity-80">Preview</p>
          <p className="mt-2 text-xl font-semibold">The quick brown fox jumps.</p>
          <p className="mt-1 text-sm opacity-90">Small text should stay legible at this contrast.</p>
        </div>
        <div className="mt-4 flex items-end gap-3">
          <div>
            <p className="label">Contrast ratio</p>
            <p className="font-mono text-4xl font-medium text-gradient">{ratio ? `${ratio.toFixed(2)}:1` : '—'}</p>
          </div>
          <Sun className="ml-auto mb-2 h-5 w-5 text-cyan/60" />
        </div>
        <div className="mt-4 grid grid-cols-2 gap-2.5">
          <Result
            label="AA normal text"
            pass={passes(4.5)}
            detail="≥ 4.5:1"
          />
          <Result label="AA large text" pass={passes(3)} detail="≥ 3:1" />
          <Result label="AAA normal text" pass={passes(7)} detail="≥ 7:1" />
          <Result label="AAA large text" pass={passes(4.5)} detail="≥ 4.5:1" />
        </div>
      </Panel>
    </div>
  )
}

function Result({ label, pass, detail }: { label: string; pass: boolean; detail: string }) {
  return (
    <div
      className={cn(
        'rounded-lg border p-3',
        pass ? 'border-emerald-500/30 bg-emerald-500/[0.06]' : 'border-line/70 bg-base/50',
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="text-[11px] text-muted">{label}</span>
        <span className={cn('text-[10px] font-semibold uppercase', pass ? 'text-emerald-400' : 'text-slate-600')}>
          {pass ? 'Pass' : 'Fail'}
        </span>
      </div>
      <p className="mt-1 font-mono text-xs text-ink">{detail}</p>
    </div>
  )
}
