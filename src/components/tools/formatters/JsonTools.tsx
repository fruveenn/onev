import { AlertCircle, CheckCircle2, Code2, Download, FileJson, Minimize2, Sparkles } from 'lucide-react'
import { useMemo, useState } from 'react'
import { CopyButton } from '../../ui/CopyButton'
import { Field } from '../../ui/Field'
import { Panel } from '../../ui/Panel'
import { ResultBox } from '../../ui/ResultBox'
import { Segmented } from '../../ui/Segmented'
import { StatTile } from '../../ui/StatTile'
import { downloadText, safeParseJSON } from '../../../lib/utils'

const SAMPLE = `{
  "name": "ONEV",
  "version": "1.0.0",
  "toolkit": ["formatters", "converters", "generators"],
  "settings": { "localOnly": true, "theme": "midnight" }
}`

/** Escape first, then wrap JSON tokens in colored spans. */
function highlightJson(value: string): string {
  const escaped = value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')

  return escaped.replace(
    /("(?:\\.|[^"\\])*"(?=\s*:))|("(?:\\.|[^"\\])*")|(\b(?:true|false|null)\b)|(-?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?)/g,
    (match, key: string | undefined, str: string | undefined, literal: string | undefined) => {
      if (key) return `<span class="text-cyan">${key}</span>`
      if (str) return `<span class="text-emerald-300">${str}</span>`
      if (literal) return `<span class="text-rose-300">${literal}</span>`
      return `<span class="text-amber-300">${match}</span>`
    },
  )
}

function TextInput({ value, onChange, rows = 12 }: { value: string; onChange: (value: string) => void; rows?: number }) {
  return (
    <textarea
      value={value}
      onChange={(event) => onChange(event.target.value)}
      rows={rows}
      spellCheck={false}
      aria-label="JSON input"
      className="input-mono min-h-[260px] w-full resize-y leading-relaxed"
      style={{ minHeight: rows * 20 }}
      placeholder="Paste JSON here…"
    />
  )
}

// ---------------------------------------------------------------- Formatter ----

export function JsonFormatter() {
  const [input, setInput] = useState(SAMPLE)
  const [indent, setIndent] = useState<'2' | '4' | 'tab'>('2')

  const parsed = useMemo(() => safeParseJSON(input), [input])
  const output = parsed.ok
    ? JSON.stringify(parsed.value, null, indent === 'tab' ? '\t' : Number(indent))
    : ''

  return (
    <div className="grid gap-5 lg:grid-cols-2">
      <Panel
        title="Input"
        subtitle="Paste or type JSON on the left."
        action={
          <div className="flex gap-2">
            <button type="button" onClick={() => setInput(SAMPLE)} className="btn-ghost !py-1.5 !text-xs">
              <Sparkles className="h-3.5 w-3.5" /> Sample
            </button>
            <button type="button" onClick={() => setInput('')} className="btn-ghost !py-1.5 !text-xs">
              Clear
            </button>
          </div>
        }
      >
        <TextInput value={input} onChange={setInput} />
        {!parsed.ok && input && (
          <p className="mt-3 flex items-start gap-1.5 text-xs text-rose-400">
            <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" /> {parsed.error}
          </p>
        )}
        <div className="mt-4">
          <Field label="Indentation">
            <Segmented
              size="sm"
              value={indent}
              onChange={setIndent}
              options={[
                { value: '2', label: '2 spaces' },
                { value: '4', label: '4 spaces' },
                { value: 'tab', label: 'Tab' },
              ]}
            />
          </Field>
        </div>
      </Panel>

      <Panel title="Formatted output" action={<CopyButton value={output} label="Copy JSON" />}>
        <div
          className="min-h-[260px] overflow-auto rounded-lg border border-line/70 bg-base/60 p-3.5 font-mono text-[13px] leading-relaxed"
          dangerouslySetInnerHTML={{
            __html: output ? highlightJson(output) : '<span style="color:#636860">Formatted JSON will appear here…</span>',
          }}
        />
        {parsed.ok && (
          <div className="mt-4 grid grid-cols-3 gap-2.5">
            <StatTile label="Input bytes" value={new Blob([input]).size} />
            <StatTile label="Output bytes" value={new Blob([output]).size} />
            <StatTile label="Lines" value={output.split('\n').length} />
          </div>
        )}
        <div className="mt-4 flex justify-end">
          <button
            type="button"
            className="btn-ghost !text-xs"
            disabled={!output}
            onClick={() => downloadText('formatted.json', output, 'application/json')}
          >
            <Download className="h-3.5 w-3.5" /> Download .json
          </button>
        </div>
      </Panel>
    </div>
  )
}

// ----------------------------------------------------------------- Validator ---

export function JsonValidator() {
  const [input, setInput] = useState('')
  const parsed = useMemo(() => safeParseJSON(input), [input])
  const validated = input.trim() ? parsed : null

  const details = useMemo(() => {
    if (!validated?.ok) return null
    const value = validated.value
    const type = Array.isArray(value)
      ? 'array'
      : value === null
        ? 'null'
        : typeof value
    const size = Array.isArray(value) ? value.length : typeof value === 'object' ? Object.keys(value as object).length : 0
    return { type, size }
  }, [validated])

  const position = validated && !validated.ok ? /position\s+(\d+)/i.exec(validated.error)?.[1] : undefined

  return (
    <div className="grid gap-5 lg:grid-cols-2">
      <Panel title="JSON to validate" action={<button type="button" onClick={() => setInput('')} className="btn-ghost !py-1.5 !text-xs">Clear</button>}>
        <TextInput value={input} onChange={setInput} />
      </Panel>
      <div className="space-y-4">
        <Panel title="Validation result">
          {!validated ? (
            <div className="flex flex-col items-center gap-2 py-10 text-center">
              <FileJson className="h-6 w-6 text-slate-600" />
              <p className="text-xs text-muted">Start typing to validate in real time.</p>
            </div>
          ) : validated.ok ? (
            <div className="rounded-lg border border-emerald-500/25 bg-emerald-500/[0.07] p-4">
              <div className="flex items-center gap-2 text-sm font-medium text-emerald-400">
                <CheckCircle2 className="h-4 w-4" /> Valid JSON
              </div>
              <p className="mt-2 text-xs text-muted">No syntax errors were found in this document.</p>
              <div className="mt-4 grid grid-cols-2 gap-2.5">
                <StatTile label="Root type" value={details?.type ?? '—'} />
                <StatTile label="Top-level items" value={details?.size ?? 0} />
              </div>
            </div>
          ) : (
            <div className="rounded-lg border border-rose-500/25 bg-rose-500/[0.07] p-4">
              <div className="flex items-center gap-2 text-sm font-medium text-rose-400">
                <AlertCircle className="h-4 w-4" /> Invalid JSON
              </div>
              <p className="mt-2 break-words font-mono text-xs leading-relaxed text-rose-200/80">
                {validated.error}
              </p>
              {position && (
                <p className="mt-2 text-xs text-muted">
                  Error near character <span className="font-mono text-ink">{position}</span>
                </p>
              )}
            </div>
          )}
        </Panel>
        <Panel title="Quick tips">
          <ul className="space-y-2 text-xs leading-relaxed text-muted">
            <li>• Keys and string values must use double quotes.</li>
            <li>• Trailing commas are not allowed in JSON.</li>
            <li>• Comments are not part of the JSON specification.</li>
            <li>• Use the JSON Formatter tool to prettify valid input.</li>
          </ul>
        </Panel>
      </div>
    </div>
  )
}

// ------------------------------------------------------------------ Minifier ---

export function JsonMinifier() {
  const [input, setInput] = useState(SAMPLE)
  const parsed = useMemo(() => safeParseJSON(input), [input])
  const output = parsed.ok ? JSON.stringify(parsed.value) : ''
  const before = new Blob([input]).size
  const after = new Blob([output]).size
  const saved = before > 0 ? Math.max(0, Math.round((1 - after / before) * 100)) : 0

  return (
    <div className="grid gap-5 lg:grid-cols-2">
      <Panel title="Input JSON">
        <TextInput value={input} onChange={setInput} />
        {!parsed.ok && input && <p className="mt-3 text-xs text-rose-400">{parsed.error}</p>}
      </Panel>
      <Panel title="Minified output" action={<CopyButton value={output} label="Copy" />}>
        <ResultBox value={output} minHeight="180px" />
        <div className="mt-4 grid grid-cols-3 gap-2.5">
          <StatTile label="Original" value={`${before} B`} />
          <StatTile label="Minified" value={`${after} B`} icon={<Minimize2 className="h-3 w-3" />} />
          <StatTile label="Saved" value={`${saved}%`} icon={<Code2 className="h-3 w-3" />} />
        </div>
        <div className="mt-4 flex justify-end">
          <button
            type="button"
            className="btn-ghost !text-xs"
            disabled={!output}
            onClick={() => downloadText('minified.json', output, 'application/json')}
          >
            <Download className="h-3.5 w-3.5" /> Download
          </button>
        </div>
      </Panel>
    </div>
  )
}
