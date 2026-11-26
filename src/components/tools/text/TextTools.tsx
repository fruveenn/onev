import DOMPurify from 'dompurify'
import { ArrowRightLeft, Check, Download, Eye, RefreshCw } from 'lucide-react'
import { useMemo, useState } from 'react'
import { CopyButton } from '../../ui/CopyButton'
import { Field } from '../../ui/Field'
import { Panel } from '../../ui/Panel'
import { ResultBox } from '../../ui/ResultBox'
import { Segmented } from '../../ui/Segmented'
import { StatTile } from '../../ui/StatTile'
import { Switch } from '../../ui/Switch'
import { copyToClipboard, downloadText, cn } from '../../../lib/utils'
import {
  base64ToText,
  binaryToText,
  convertCase,
  findAndReplace,
  getTextStats,
  repeatText,
  reverseText,
  slugToText,
  slugify,
  sortLines,
  textToBase64,
  textToBinary,
  urlDecode,
  urlEncode,
  type CaseStyle,
} from '../../../lib/textTools'
import { marked } from 'marked'

// ---------------------------------------------------------- Shared transform ---

interface TransformProps {
  encode: (input: string) => string
  decode: (input: string) => string
  defaultMode: 'encode' | 'decode'
  inputLabel: string
  outputLabel: string
  placeholder?: string
  hint?: string
}

function TransformTool({
  encode,
  decode,
  defaultMode,
  inputLabel,
  outputLabel,
  placeholder,
  hint,
}: TransformProps) {
  const [mode, setMode] = useState<'encode' | 'decode'>(defaultMode)
  const [input, setInput] = useState('')

  const { output, error } = useMemo(() => {
    if (!input) return { output: '', error: '' }
    try {
      return { output: mode === 'encode' ? encode(input) : decode(input), error: '' }
    } catch (cause) {
      return { output: '', error: cause instanceof Error ? cause.message : 'Invalid input' }
    }
  }, [input, mode, encode, decode])

  return (
    <div className="space-y-5">
      <Panel title="Direction">
        <Segmented
          value={mode}
          onChange={setMode}
          options={[
            { value: 'encode', label: inputLabel, icon: ArrowRightLeft },
            { value: 'decode', label: outputLabel, icon: ArrowRightLeft },
          ]}
        />
      </Panel>
      <div className="grid gap-5 lg:grid-cols-2">
        <Panel title="Input" action={<button type="button" onClick={() => setInput('')} className="btn-ghost !py-1.5 !text-xs">Clear</button>}>
          <textarea
            value={input}
            onChange={(event) => setInput(event.target.value)}
            rows={12}
            spellCheck={false}
            placeholder={placeholder ?? 'Type or paste text here…'}
            aria-label="Input text"
            className="input-mono min-h-[280px] w-full resize-y leading-relaxed"
          />
          {hint && <p className="field-hint">{hint}</p>}
          {error && <p className="mt-2 break-words text-xs text-rose-400">{error}</p>}
        </Panel>
        <Panel title="Output" action={<CopyButton value={output} label="Copy" />}>
          <ResultBox value={output} minHeight="280px" />
          <div className="mt-4 flex justify-end">
            <button
              type="button"
              className="btn-ghost !text-xs"
              disabled={!output}
              onClick={() => downloadText('onev-output.txt', output)}
            >
              <Download className="h-3.5 w-3.5" /> Download
            </button>
          </div>
        </Panel>
      </div>
    </div>
  )
}

export function TextToSlug() {
  return (
    <TransformTool
      encode={slugify}
      decode={slugToText}
      defaultMode="encode"
      inputLabel="Text → slug"
      outputLabel="Slug → text"
      placeholder="Hello, World! Let's build something."
      hint="Accents are removed and non-alphanumeric characters become hyphens."
    />
  )
}

export function SlugToText() {
  return (
    <TransformTool
      encode={slugify}
      decode={(value) => slugToText(value, true)}
      defaultMode="decode"
      inputLabel="Text → slug"
      outputLabel="Slug → text"
      placeholder="my-awesome_blog-post"
      hint="Both hyphens and underscores are treated as word separators."
    />
  )
}

export function TextToBinary() {
  return (
    <TransformTool
      encode={textToBinary}
      decode={binaryToText}
      defaultMode="encode"
      inputLabel="Text → binary"
      outputLabel="Binary → text"
      placeholder="ONEV"
      hint="Each UTF-8 byte is shown as an 8-bit value, separated by spaces."
    />
  )
}

export function BinaryToText() {
  return (
    <TransformTool
      encode={textToBinary}
      decode={binaryToText}
      defaultMode="decode"
      inputLabel="Text → binary"
      outputLabel="Binary → text"
      placeholder="01001111 01001110 01000101 01010110"
      hint="Spaces, newlines and other separators are ignored."
    />
  )
}

export function Base64Encoder() {
  return (
    <TransformTool
      encode={textToBase64}
      decode={base64ToText}
      defaultMode="encode"
      inputLabel="Encode"
      outputLabel="Decode"
      placeholder="Encode UTF-8 text, including emoji 🚀"
    />
  )
}

export function UrlEncoder() {
  return (
    <TransformTool
      encode={urlEncode}
      decode={urlDecode}
      defaultMode="encode"
      inputLabel="Encode"
      outputLabel="Decode"
      placeholder="hello world & symbols? yes"
      hint="Percent-encodes the entire value, including spaces and reserved characters."
    />
  )
}

// ------------------------------------------------------------ Case converter ---

const CASE_OPTIONS: { style: CaseStyle; label: string }[] = [
  { style: 'upper', label: 'UPPERCASE' },
  { style: 'lower', label: 'lowercase' },
  { style: 'title', label: 'Title Case' },
  { style: 'sentence', label: 'Sentence case' },
  { style: 'camel', label: 'camelCase' },
  { style: 'pascal', label: 'PascalCase' },
  { style: 'snake', label: 'snake_case' },
  { style: 'kebab', label: 'kebab-case' },
  { style: 'constant', label: 'CONSTANT_CASE' },
  { style: 'alternating', label: 'aLtErNaTiNg' },
]

export function CaseConverter() {
  const [input, setInput] = useState('')
  const [selected, setSelected] = useState<CaseStyle>('camel')
  const output = input ? convertCase(input, selected) : ''

  return (
    <div className="space-y-5">
      <Panel title="Input text">
        <textarea
          value={input}
          onChange={(event) => setInput(event.target.value)}
          rows={5}
          placeholder="the quick brown fox jumps"
          aria-label="Text to convert"
          className="input w-full resize-y"
        />
      </Panel>
      <Panel title="Choose a format" subtitle="Click any result to copy it." action={<CopyButton value={output} label="Copy selected" />}>
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {CASE_OPTIONS.map((option) => {
            const value = input ? convertCase(input, option.style) : ''
            const active = selected === option.style
            return (
              <button
                key={option.style}
                type="button"
                onClick={async () => {
                  setSelected(option.style)
                  if (value) await copyToClipboard(value)
                }}
                className={cn(
                  'group rounded-lg border p-3 text-left transition',
                  active ? 'border-cyan/40 bg-cyan/[0.06]' : 'border-line/70 bg-base/40 hover:border-cyan/25',
                )}
              >
                <span className="flex items-center justify-between gap-2">
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                    {option.label}
                  </span>
                  {active && <Check className="h-3 w-3 text-cyan" />}
                </span>
                <span className="mt-1.5 block truncate font-mono text-[13px] text-ink">
                  {value || <span className="text-slate-600">—</span>}
                </span>
              </button>
            )
          })}
        </div>
      </Panel>
    </div>
  )
}

// -------------------------------------------------------------- Find & replace ---

export function FindReplace() {
  const [input, setInput] = useState('')
  const [find, setFind] = useState('')
  const [replacement, setReplacement] = useState('')
  const [caseSensitive, setCaseSensitive] = useState(false)
  const [wholeWord, setWholeWord] = useState(false)
  const [useRegex, setUseRegex] = useState(false)

  const result = useMemo(
    () => findAndReplace(input, find, replacement, { caseSensitive, wholeWord, useRegex }),
    [input, find, replacement, caseSensitive, wholeWord, useRegex],
  )

  return (
    <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
      <Panel title="Source text">
        <textarea
          value={input}
          onChange={(event) => setInput(event.target.value)}
          rows={14}
          placeholder="Text to search through…"
          aria-label="Source text"
          className="input w-full resize-y"
        />
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <Field label={useRegex ? 'Pattern (regex)' : 'Find'} htmlFor="find-value">
            <input id="find-value" className={cn('input', useRegex && 'input-mono')} value={find} onChange={(event) => setFind(event.target.value)} placeholder={useRegex ? '\\d+' : 'search term'} />
          </Field>
          <Field label="Replace with" htmlFor="replace-value">
            <input id="replace-value" className="input" value={replacement} onChange={(event) => setReplacement(event.target.value)} placeholder="new value" />
          </Field>
        </div>
        <div className="mt-2 grid grid-cols-3 gap-2">
          <Switch checked={caseSensitive} onChange={setCaseSensitive} label="Case sensitive" />
          <Switch checked={wholeWord} onChange={setWholeWord} label="Whole word" />
          <Switch checked={useRegex} onChange={setUseRegex} label="Regex" />
        </div>
      </Panel>
      <Panel
        title="Result"
        subtitle={`${result.count} replacement${result.count === 1 ? '' : 's'}`}
        action={<CopyButton value={result.result} label="Copy" />}
      >
        <ResultBox value={result.result} mono={false} minHeight="360px" />
        {result.error && <p className="mt-2 break-words text-xs text-rose-400">{result.error}</p>}
      </Panel>
    </div>
  )
}

// --------------------------------------------------------------- Word counter ---

export function WordCounter() {
  const [text, setText] = useState('')
  const stats = useMemo(() => getTextStats(text), [text])

  return (
    <div className="grid gap-5 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)]">
      <Panel title="Your text" action={<button type="button" onClick={() => setText('')} className="btn-ghost !py-1.5 !text-xs">Clear</button>}>
        <textarea
          value={text}
          onChange={(event) => setText(event.target.value)}
          rows={18}
          placeholder="Paste or write text to see live statistics…"
          aria-label="Text to analyse"
          className="input w-full resize-y leading-relaxed"
        />
      </Panel>
      <Panel title="Live statistics">
        <div className="grid grid-cols-2 gap-2.5">
          <StatTile label="Words" value={stats.words.toLocaleString()} />
          <StatTile label="Characters" value={stats.characters.toLocaleString()} />
          <StatTile label="No spaces" value={stats.charactersNoSpaces.toLocaleString()} />
          <StatTile label="Sentences" value={stats.sentences.toLocaleString()} />
          <StatTile label="Paragraphs" value={stats.paragraphs.toLocaleString()} />
          <StatTile label="Lines" value={stats.lines.toLocaleString()} />
        </div>
        <div className="mt-4 rounded-lg border border-line/70 bg-base/50 p-3.5">
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted">Reading time</span>
            <span className="font-mono text-ink">~{stats.readingMinutes} min</span>
          </div>
          <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-800">
            <div
              className="h-full rounded-full bg-gradient-to-r from-cyan to-electric transition-all"
              style={{ width: `${Math.min(100, (stats.words / 1000) * 100)}%` }}
            />
          </div>
          <p className="field-hint">Based on an average reading speed of 200 words per minute.</p>
        </div>
      </Panel>
    </div>
  )
}

// ------------------------------------------------------------ Markdown preview ---

marked.setOptions({ gfm: true, breaks: false })

export function MarkdownPreview() {
  const [source, setSource] = useState(
    '# Hello from ONEV\n\nWrite **Markdown** on the left and see the preview here.\n\n- Runs locally\n- Sanitized output\n- No uploads\n\n`code stays private`',
  )

  const html = useMemo(() => DOMPurify.sanitize(marked.parse(source) as string), [source])

  return (
    <div className="grid gap-5 lg:grid-cols-2">
      <Panel title="Markdown" action={<CopyButton value={source} label="Copy source" />}>
        <textarea
          value={source}
          onChange={(event) => setSource(event.target.value)}
          rows={20}
          spellCheck={false}
          aria-label="Markdown source"
          className="input-mono min-h-[420px] w-full resize-y leading-relaxed"
        />
      </Panel>
      <Panel title="Preview" subtitle="HTML is sanitized before rendering." action={<span className="chip !text-[10px]"><Eye className="h-3 w-3" /> Live</span>}>
        <div
          className="markdown-body min-h-[420px] overflow-auto rounded-lg border border-line/70 bg-base/50 p-5"
          dangerouslySetInnerHTML={{ __html: html }}
        />
      </Panel>
    </div>
  )
}

// --------------------------------------------------------------- Text repeater ---

export function TextRepeater() {
  const [input, setInput] = useState('')
  const [times, setTimes] = useState(5)
  const [separator, setSeparator] = useState('\\n')
  const separators: Record<string, string> = {
    '\\n': '\n',
    ' ': ' ',
    ', ': ', ',
    '': '',
  }
  const output = repeatText(input, times, separators[separator] ?? '\n')

  return (
    <div className="space-y-5">
      <Panel title="Repeat settings">
        <div className="flex flex-wrap items-end gap-4">
          <Field label="Text" className="min-w-[220px] flex-1">
            <input value={input} onChange={(event) => setInput(event.target.value)} className="input" placeholder="Text to repeat" />
          </Field>
          <Field label="Times" htmlFor="repeat-count" className="w-24">
            <input id="repeat-count" type="number" min={0} max={1000} value={times} onChange={(event) => setTimes(Number(event.target.value))} className="input-mono" />
          </Field>
          <Field label="Separator">
            <Segmented
              size="sm"
              value={separator}
              onChange={setSeparator}
              options={[
                { value: '\\n', label: 'New line' },
                { value: ' ', label: 'Space' },
                { value: ', ', label: 'Comma' },
                { value: '', label: 'None' },
              ]}
            />
          </Field>
        </div>
      </Panel>
      <Panel title="Output" action={<CopyButton value={output} label="Copy" />}>
        <ResultBox value={output} minHeight="220px" />
      </Panel>
    </div>
  )
}

// ---------------------------------------------------------------- Text reverser ---

export function TextReverser() {
  const [input, setInput] = useState('')
  const output = reverseText(input)

  return (
    <div className="grid gap-5 lg:grid-cols-2">
      <Panel title="Input">
        <textarea value={input} onChange={(event) => setInput(event.target.value)} rows={14} className="input w-full resize-y" placeholder="Type something to flip it…" aria-label="Text to reverse" />
      </Panel>
      <Panel title="Reversed" action={<CopyButton value={output} label="Copy" />}>
        <ResultBox value={output} mono={false} minHeight="320px" />
        <button type="button" onClick={() => setInput(output)} className="btn-ghost mt-4 !text-xs">
          <RefreshCw className="h-3.5 w-3.5" /> Use result as input
        </button>
      </Panel>
    </div>
  )
}

// ----------------------------------------------------------------- Line sorter ---

export function LineSorter() {
  const [input, setInput] = useState('')
  const [direction, setDirection] = useState<'asc' | 'desc'>('asc')
  const [unique, setUnique] = useState(false)
  const output = sortLines(input, direction, unique)

  return (
    <div className="grid gap-5 lg:grid-cols-2">
      <Panel title="Lines to sort">
        <textarea
          value={input}
          onChange={(event) => setInput(event.target.value)}
          rows={16}
          spellCheck={false}
          placeholder={'banana\napple\ncherry\napple'}
          aria-label="Lines to sort"
          className="input-mono min-h-[320px] w-full resize-y"
        />
        <div className="mt-4 flex flex-wrap items-center gap-4">
          <Segmented
            size="sm"
            value={direction}
            onChange={setDirection}
            options={[
              { value: 'asc', label: 'A → Z' },
              { value: 'desc', label: 'Z → A' },
            ]}
          />
          <Switch checked={unique} onChange={setUnique} label="Remove duplicates" />
        </div>
      </Panel>
      <Panel title="Sorted output" action={<CopyButton value={output} label="Copy" />}>
        <ResultBox value={output} minHeight="320px" />
      </Panel>
    </div>
  )
}
