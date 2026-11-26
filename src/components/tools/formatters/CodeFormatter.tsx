import { Download, Loader2, WandSparkles } from 'lucide-react'
import { useState } from 'react'
import { CopyButton } from '../../ui/CopyButton'
import { Field } from '../../ui/Field'
import { Panel } from '../../ui/Panel'
import { Segmented } from '../../ui/Segmented'
import { downloadText } from '../../../lib/utils'

type Language = 'css' | 'javascript' | 'html'

const CONFIG: Record<Language, { parser: string; extension: string; placeholder: string; sample: string }> = {
  css: {
    parser: 'css',
    extension: 'css',
    placeholder: 'Paste CSS here…',
    sample: `.card{display:grid;grid-template-columns:repeat(2,1fr);gap:12px;color:#C6F36B}`,
  },
  javascript: {
    parser: 'babel',
    extension: 'js',
    placeholder: 'Paste JavaScript or JSX here…',
    sample: `const tools=["json","css","html"];tools.map(t=>{return t.toUpperCase()})`,
  },
  html: {
    parser: 'html',
    extension: 'html',
    placeholder: 'Paste HTML here…',
    sample: `<main><h1>ONEV</h1><ul><li>Fast</li><li>Private</li></ul></main>`,
  },
}

/** Prettier and its plugins are fetched only when a formatter is opened. */
async function formatCode(source: string, language: Language, tabWidth: number, printWidth: number): Promise<string> {
  const prettier = await import('prettier/standalone')
  const asPlugin = (module: unknown) =>
    (module as Record<string, unknown>).default ?? module

  let plugins: unknown[]
  if (language === 'css') {
    plugins = [asPlugin(await import('prettier/plugins/postcss'))]
  } else if (language === 'javascript') {
    plugins = [
      asPlugin(await import('prettier/plugins/babel')),
      asPlugin(await import('prettier/plugins/estree')),
    ]
  } else {
    plugins = [
      asPlugin(await import('prettier/plugins/html')),
      asPlugin(await import('prettier/plugins/babel')),
      asPlugin(await import('prettier/plugins/estree')),
    ]
  }

  return prettier.format(source, {
    parser: CONFIG[language].parser,
    plugins: plugins as never,
    tabWidth,
    printWidth,
    semi: true,
  })
}

function CodeFormatter({ language }: { language: Language }) {
  const config = CONFIG[language]
  const [input, setInput] = useState('')
  const [output, setOutput] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [tabWidth, setTabWidth] = useState<'2' | '4'>('2')
  const [printWidth, setPrintWidth] = useState(80)

  async function run(source = input) {
    if (!source.trim()) {
      setOutput('')
      setError('')
      return
    }
    setBusy(true)
    setError('')
    try {
      const formatted = await formatCode(source, language, Number(tabWidth), printWidth)
      setOutput(formatted)
    } catch (cause) {
      setOutput('')
      setError(cause instanceof Error ? cause.message : 'Could not format this input.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="space-y-5">
      <Panel title="Formatting options">
        <div className="flex flex-wrap items-end gap-x-6 gap-y-4">
          <Field label="Indent width">
            <Segmented
              size="sm"
              value={tabWidth}
              onChange={setTabWidth}
              options={[
                { value: '2', label: '2 spaces' },
                { value: '4', label: '4 spaces' },
              ]}
            />
          </Field>
          <Field label={`Line width — ${printWidth}`} className="w-56">
            <input
              type="range"
              min={40}
              max={140}
              step={10}
              value={printWidth}
              onChange={(event) => setPrintWidth(Number(event.target.value))}
              className="w-full accent-cyan"
            />
          </Field>
          <button type="button" className="btn-primary mb-0.5" onClick={() => run()} disabled={busy}>
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <WandSparkles className="h-4 w-4" />}
            Format
          </button>
          <button
            type="button"
            className="btn-ghost mb-0.5 !text-xs"
            onClick={() => {
              setInput(config.sample)
              void run(config.sample)
            }}
          >
            Try sample
          </button>
        </div>
      </Panel>

      <div className="grid gap-5 lg:grid-cols-2">
        <Panel title="Source">
          <textarea
            value={input}
            onChange={(event) => setInput(event.target.value)}
            rows={16}
            spellCheck={false}
            placeholder={config.placeholder}
            aria-label={`${language} source`}
            className="input-mono min-h-[320px] w-full resize-y leading-relaxed"
          />
          <p className="field-hint">{new Blob([input]).size} bytes</p>
        </Panel>
        <Panel title="Formatted" action={<CopyButton value={output} label="Copy" />}>
          <pre className="min-h-[320px] overflow-auto rounded-lg border border-line/70 bg-base/60 p-3.5 font-mono text-[13px] leading-relaxed text-ink">
            {output || <span className="text-slate-600">Formatted output will appear here…</span>}
          </pre>
          {error && <p className="mt-3 break-words text-xs text-rose-400">{error}</p>}
          <div className="mt-4 flex justify-end">
            <button
              type="button"
              className="btn-ghost !text-xs"
              disabled={!output}
              onClick={() => downloadText(`formatted.${config.extension}`, output, 'text/plain')}
            >
              <Download className="h-3.5 w-3.5" /> Download .{config.extension}
            </button>
          </div>
        </Panel>
      </div>
    </div>
  )
}

export function CssFormatter() {
  return <CodeFormatter language="css" />
}

export function JavaScriptFormatter() {
  return <CodeFormatter language="javascript" />
}

export function HtmlFormatter() {
  return <CodeFormatter language="html" />
}
