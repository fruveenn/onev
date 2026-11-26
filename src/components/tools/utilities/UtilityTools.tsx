import { Check, Download, ExternalLink, Play, Plus, RotateCcw, Square, Tag, Timer, Trash2 } from 'lucide-react'
import { useEffect, useMemo, useRef, useState, type FormEvent } from 'react'
import { QRCodeCanvas } from 'qrcode.react'
import { CopyButton } from '../../ui/CopyButton'
import { Field } from '../../ui/Field'
import { Panel } from '../../ui/Panel'
import { Segmented } from '../../ui/Segmented'
import { StatTile } from '../../ui/StatTile'
import { useLocalStorage } from '../../../hooks/useLocalStorage'
import { cn, uid } from '../../../lib/utils'

// --------------------------------------------------------------- Checklist ----

interface Task {
  id: string
  text: string
  done: boolean
  createdAt: number
}

export function ChecklistMaker() {
  const [tasks, setTasks] = useLocalStorage<Task[]>('onev:checklist', [])
  const [draft, setDraft] = useState('')
  const remaining = tasks.filter((task) => !task.done).length
  const percent = tasks.length ? Math.round(((tasks.length - remaining) / tasks.length) * 100) : 0

  function add(event: FormEvent) {
    event.preventDefault()
    const text = draft.trim()
    if (!text) return
    setTasks((current) => [
      ...current,
      { id: uid(), text, done: false, createdAt: Date.now() },
    ])
    setDraft('')
  }

  return (
    <div className="grid gap-5 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)]">
      <Panel title="Checklist" subtitle="Saved automatically in this browser.">
        <form onSubmit={add} className="flex gap-2">
          <input
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            placeholder="Add a task and press Enter…"
            aria-label="New task"
            className="input"
          />
          <button type="submit" className="btn-primary shrink-0" disabled={!draft.trim()}>
            <Plus className="h-4 w-4" /> Add
          </button>
        </form>

        <div className="mt-5 space-y-2">
          {tasks.length === 0 ? (
            <div className="rounded-lg border border-dashed border-line py-12 text-center text-xs text-muted">
              No tasks yet. Add your first one above.
            </div>
          ) : (
            tasks.map((task) => (
              <div
                key={task.id}
                className={cn(
                  'group flex items-center gap-3 rounded-lg border border-line/70 bg-base/40 px-3 py-2.5 transition',
                  task.done && 'opacity-60',
                )}
              >
                <button
                  type="button"
                  onClick={() =>
                    setTasks((current) =>
                      current.map((item) =>
                        item.id === task.id ? { ...item, done: !item.done } : item,
                      ),
                    )
                  }
                  className={cn(
                    'flex h-5 w-5 shrink-0 items-center justify-center rounded border transition',
                    task.done ? 'border-cyan bg-cyan/20 text-cyan' : 'border-slate-600 text-transparent hover:border-cyan',
                  )}
                  aria-label={task.done ? 'Mark as incomplete' : 'Mark as complete'}
                >
                  <Check className="h-3 w-3" />
                </button>
                <span className={cn('flex-1 text-[13px] text-ink', task.done && 'line-through text-muted')}>
                  {task.text}
                </span>
                <button
                  type="button"
                  onClick={() => setTasks((current) => current.filter((item) => item.id !== task.id))}
                  className="text-slate-600 opacity-0 transition hover:text-rose-400 group-hover:opacity-100"
                  aria-label={`Delete ${task.text}`}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            ))
          )}
        </div>
      </Panel>
      <Panel title="Progress">
        <div className="grid grid-cols-3 gap-2.5">
          <StatTile label="Total" value={tasks.length} />
          <StatTile label="Done" value={tasks.length - remaining} />
          <StatTile label="Left" value={remaining} />
        </div>
        <div className="mt-5">
          <div className="mb-1.5 flex justify-between text-xs">
            <span className="text-muted">Completion</span>
            <span className="font-mono text-ink">{percent}%</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-slate-800">
            <div className="h-full rounded-full bg-gradient-to-r from-cyan to-electric transition-all" style={{ width: `${percent}%` }} />
          </div>
        </div>
        <button
          type="button"
          disabled={!tasks.some((task) => task.done)}
          onClick={() => setTasks((current) => current.filter((task) => !task.done))}
          className="btn-ghost mt-5 w-full !text-xs"
        >
          <Trash2 className="h-3.5 w-3.5" /> Clear completed
        </button>
      </Panel>
    </div>
  )
}

// ------------------------------------------------------------ Bookmark manager --

interface Bookmark {
  id: string
  title: string
  url: string
  tags: string[]
  createdAt: number
}

function normalizeUrl(value: string): string {
  const trimmed = value.trim()
  if (!trimmed) return ''
  return /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`
}

export function BookmarkManager() {
  const [bookmarks, setBookmarks] = useLocalStorage<Bookmark[]>('onev:bookmarks', [])
  const [title, setTitle] = useState('')
  const [url, setUrl] = useState('')
  const [tags, setTags] = useState('')
  const [query, setQuery] = useState('')

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase()
    if (!needle) return bookmarks
    return bookmarks.filter((bookmark) =>
      [bookmark.title, bookmark.url, ...bookmark.tags].join(' ').toLowerCase().includes(needle),
    )
  }, [bookmarks, query])

  function add(event: FormEvent) {
    event.preventDefault()
    const normalized = normalizeUrl(url)
    if (!normalized) return
    setBookmarks((current) => [
      {
        id: uid(),
        title: title.trim() || normalized.replace(/^https?:\/\//, '').split('/')[0],
        url: normalized,
        tags: tags
          .split(',')
          .map((tag) => tag.trim().toLowerCase())
          .filter(Boolean),
        createdAt: Date.now(),
      },
      ...current,
    ])
    setTitle('')
    setUrl('')
    setTags('')
  }

  return (
    <div className="grid gap-5 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)]">
      <Panel title="Save a link">
        <form onSubmit={add} className="space-y-3">
          <Field label="Title" htmlFor="bookmark-title">
            <input id="bookmark-title" className="input" value={title} onChange={(event) => setTitle(event.target.value)} placeholder="MDN Web Docs" />
          </Field>
          <Field label="URL" htmlFor="bookmark-url">
            <input id="bookmark-url" className="input" value={url} onChange={(event) => setUrl(event.target.value)} placeholder="developer.mozilla.org" required />
          </Field>
          <Field label="Tags" hint="Comma-separated, optional" htmlFor="bookmark-tags">
            <input id="bookmark-tags" className="input" value={tags} onChange={(event) => setTags(event.target.value)} placeholder="docs, reference" />
          </Field>
          <button type="submit" className="btn-primary w-full">
            <Plus className="h-4 w-4" /> Save bookmark
          </button>
        </form>
      </Panel>
      <Panel title="Saved links" subtitle={`${bookmarks.length} bookmark${bookmarks.length === 1 ? '' : 's'} stored locally.`}>
        <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search title, URL or tag…" className="input" aria-label="Search bookmarks" />
        <div className="mt-4 max-h-[460px] space-y-2 overflow-y-auto">
          {filtered.length === 0 ? (
            <div className="rounded-lg border border-dashed border-line py-12 text-center text-xs text-muted">
              {bookmarks.length ? 'No bookmarks match that search.' : 'Nothing saved yet. Add a link on the left.'}
            </div>
          ) : (
            filtered.map((bookmark) => (
              <div key={bookmark.id} className="group flex items-start gap-3 rounded-lg border border-line/70 bg-base/40 px-3 py-2.5">
                <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-cyan/15 bg-cyan/[0.06] text-cyan">
                  <Tag className="h-3.5 w-3.5" />
                </span>
                <div className="min-w-0 flex-1">
                  <a href={bookmark.url} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-[13px] font-medium text-ink transition hover:text-cyan">
                    <span className="truncate">{bookmark.title}</span>
                    <ExternalLink className="h-3 w-3 shrink-0 text-slate-600" />
                  </a>
                  <p className="truncate text-xs text-slate-500">{bookmark.url}</p>
                  {bookmark.tags.length > 0 && (
                    <div className="mt-1.5 flex flex-wrap gap-1">
                      {bookmark.tags.map((tag) => (
                        <span key={tag} className="rounded bg-slate-800 px-1.5 py-0.5 text-[10px] text-muted">#{tag}</span>
                      ))}
                    </div>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => setBookmarks((current) => current.filter((item) => item.id !== bookmark.id))}
                  className="text-slate-600 opacity-0 transition hover:text-rose-400 group-hover:opacity-100"
                  aria-label={`Delete ${bookmark.title}`}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            ))
          )}
        </div>
      </Panel>
    </div>
  )
}

// ------------------------------------------------------------------ Stopwatch --

function formatTime(ms: number): string {
  const minutes = Math.floor(ms / 60_000)
  const seconds = Math.floor((ms % 60_000) / 1000)
  const centis = Math.floor((ms % 1000) / 10)
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}.${String(centis).padStart(2, '0')}`
}

export function Stopwatch() {
  const [running, setRunning] = useState(false)
  const [elapsed, setElapsed] = useState(0)
  const [laps, setLaps] = useState<number[]>([])
  const startRef = useRef(0)
  const baseRef = useRef(0)

  useEffect(() => {
    if (!running) return
    startRef.current = performance.now()
    const timer = setInterval(() => {
      const now = performance.now()
      setElapsed(baseRef.current + (now - startRef.current))
    }, 10)
    return () => {
      clearInterval(timer)
      baseRef.current += performance.now() - startRef.current
    }
  }, [running])

  function toggle() {
    if (!running) {
      startRef.current = performance.now()
    }
    setRunning((current) => !current)
  }

  function reset() {
    setRunning(false)
    baseRef.current = 0
    setElapsed(0)
    setLaps([])
  }

  const best = laps.length ? Math.min(...laps) : 0
  const worst = laps.length ? Math.max(...laps) : 0

  return (
    <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,0.8fr)]">
      <Panel title="Stopwatch">
        <div className="rounded-lg border border-line/70 bg-base/60 py-10 text-center">
          <p className="font-mono text-5xl font-medium tracking-tight text-gradient sm:text-6xl">
            {formatTime(elapsed)}
          </p>
          <p className="mt-3 text-[11px] uppercase tracking-[0.18em] text-slate-500">
            {running ? 'Running' : elapsed > 0 ? 'Paused' : 'Ready'}
          </p>
        </div>
        <div className="mt-5 flex gap-2">
          <button type="button" onClick={toggle} className="btn-primary flex-1">
            {running ? <Square className="h-4 w-4" /> : <Play className="h-4 w-4" />}
            {running ? 'Pause' : elapsed > 0 ? 'Resume' : 'Start'}
          </button>
          <button type="button" onClick={() => setLaps((current) => [elapsed, ...current])} disabled={!running} className="btn-ghost flex-1">
            <Timer className="h-4 w-4" /> Lap
          </button>
          <button type="button" onClick={reset} className="btn-ghost" aria-label="Reset stopwatch">
            <RotateCcw className="h-4 w-4" />
          </button>
        </div>
      </Panel>
      <Panel title="Laps" subtitle={`${laps.length} recorded`}>
        <div className="max-h-[420px] space-y-1.5 overflow-y-auto">
          {laps.length === 0 ? (
            <div className="py-12 text-center text-xs text-muted">Laps will appear here while the timer runs.</div>
          ) : (
            laps.map((lap, index) => (
              <div key={`${lap}-${index}`} className="flex items-center justify-between rounded-lg border border-line/70 bg-base/40 px-3 py-2 font-mono text-xs">
                <span className="text-slate-500">Lap {laps.length - index}</span>
                <span className={cn('text-ink', lap === best && 'text-emerald-400', lap === worst && laps.length > 1 && 'text-rose-400')}>
                  {formatTime(lap)}
                </span>
              </div>
            ))
          )}
        </div>
        {laps.length > 1 && (
          <div className="mt-4 grid grid-cols-2 gap-2.5">
            <StatTile label="Best lap" value={formatTime(best)} />
            <StatTile label="Slowest" value={formatTime(worst)} />
          </div>
        )}
      </Panel>
    </div>
  )
}

// -------------------------------------------------------------- QR generator ---

export function QrCodeGenerator() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [mode, setMode] = useState<'text' | 'url' | 'wifi'>('text')
  const [text, setText] = useState('https://onev.dev')
  const [ssid, setSsid] = useState('')
  const [password, setPassword] = useState('')
  const [size, setSize] = useState(256)
  const [foreground, setForeground] = useState('#141710')
  const [background, setBackground] = useState('#FFFFFF')

  const value =
    mode === 'wifi'
      ? `WIFI:T:WPA;S:${ssid};P:${password};;`
      : mode === 'url'
        ? normalizeUrl(text)
        : text

  function download() {
    const canvas = canvasRef.current
    if (!canvas || !value) return
    canvas.toBlob((blob) => {
      if (!blob) return
      const url = URL.createObjectURL(blob)
      const anchor = document.createElement('a')
      anchor.href = url
      anchor.download = 'onev-qr-code.png'
      anchor.click()
      URL.revokeObjectURL(url)
    }, 'image/png')
  }

  return (
    <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,0.8fr)]">
      <Panel title="QR content">
        <Segmented
          value={mode}
          onChange={setMode}
          options={[
            { value: 'text', label: 'Text' },
            { value: 'url', label: 'URL' },
            { value: 'wifi', label: 'Wi-Fi' },
          ]}
        />
        <div className="mt-5 space-y-3">
          {mode === 'wifi' ? (
            <>
              <Field label="Network name (SSID)" htmlFor="wifi-ssid">
                <input id="wifi-ssid" className="input" value={ssid} onChange={(event) => setSsid(event.target.value)} placeholder="My Network" />
              </Field>
              <Field label="Password" htmlFor="wifi-password">
                <input id="wifi-password" className="input" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Network password" />
              </Field>
            </>
          ) : (
            <Field label={mode === 'url' ? 'Link' : 'Text or data'} htmlFor="qr-value">
              <textarea id="qr-value" className="input min-h-[100px] w-full resize-y" value={text} onChange={(event) => setText(event.target.value)} placeholder="Anything you want to encode…" />
            </Field>
          )}
        </div>
        <div className="mt-5 grid grid-cols-3 gap-3">
          <Field label="Size (px)" htmlFor="qr-size">
            <input id="qr-size" type="number" min={128} max={1024} step={32} value={size} onChange={(event) => setSize(Number(event.target.value))} className="input-mono" />
          </Field>
          <Field label="Ink" htmlFor="qr-fg">
            <input id="qr-fg" type="color" value={foreground} onChange={(event) => setForeground(event.target.value)} className="h-10 w-full cursor-pointer rounded border border-line bg-transparent p-0.5" />
          </Field>
          <Field label="Paper" htmlFor="qr-bg">
            <input id="qr-bg" type="color" value={background} onChange={(event) => setBackground(event.target.value)} className="h-10 w-full cursor-pointer rounded border border-line bg-transparent p-0.5" />
          </Field>
        </div>
      </Panel>
      <Panel title="Preview" subtitle="Generated locally — the content is never sent anywhere.">
        <div className="flex min-h-[300px] flex-col items-center justify-center rounded-lg border border-line/70 bg-base/50 p-6">
          {value ? (
            <div className="rounded-xl bg-white p-3 shadow-card">
              <QRCodeCanvas
                ref={canvasRef}
                value={value}
                size={Math.min(Math.max(size, 128), 512)}
                fgColor={foreground}
                bgColor={background}
                level="M"
                includeMargin
              />
            </div>
          ) : (
            <p className="text-xs text-muted">Enter some content to generate a QR code.</p>
          )}
          <p className="mt-4 max-w-full break-all text-center font-mono text-[10px] text-slate-500">{value}</p>
        </div>
        <div className="mt-4 space-y-2">
          <button type="button" onClick={download} disabled={!value} className="btn-primary w-full">
            <Download className="h-4 w-4" /> Download PNG
          </button>
          <CopyButton value={value} label="Copy encoded value" className="w-full" />
        </div>
      </Panel>
    </div>
  )
}
