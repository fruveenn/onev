import { ArrowRight, CornerDownLeft, Search, SearchX } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { useNavigate } from 'react-router-dom'
import { getCategory } from '../../registry/categories'
import { searchTools, TOTAL_TOOLS } from '../../registry/tools'
import { cn } from '../../lib/utils'
import { useT } from '../../store/language'

interface CommandPaletteProps {
  open: boolean
  onClose: () => void
}

export function CommandPalette({ open, onClose }: CommandPaletteProps) {
  const [query, setQuery] = useState('')
  const [selected, setSelected] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const navigate = useNavigate()
  const t = useT()

  const results = useMemo(() => searchTools(query).slice(0, 8), [query])

  useEffect(() => {
    setSelected(0)
  }, [query])

  useEffect(() => {
    if (!open) return
    setQuery('')
    setSelected(0)
    document.body.style.overflow = 'hidden'
    const timer = setTimeout(() => inputRef.current?.focus(), 20)
    return () => {
      document.body.style.overflow = ''
      clearTimeout(timer)
    }
  }, [open])

  useEffect(() => {
    if (!open) return
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault()
        onClose()
      } else if (event.key === 'ArrowDown') {
        event.preventDefault()
        setSelected((current) => Math.min(current + 1, results.length - 1))
      } else if (event.key === 'ArrowUp') {
        event.preventDefault()
        setSelected((current) => Math.max(current - 1, 0))
      } else if (event.key === 'Enter') {
        event.preventDefault()
        if (results[selected]) goTo(results[selected].id)
        else if (query.trim()) goTo(`/search?q=${encodeURIComponent(query.trim())}`)
      }
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
    // goTo only depends on stable navigate/onClose references.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, results, selected, query, onClose])

  function goTo(path: string) {
    navigate(path.startsWith('/') ? path : `/tools/${path}`)
    onClose()
  }

  if (!open) return null

  return createPortal(
    <div className="fixed inset-0 z-[80] flex items-start justify-center px-4 pt-[12vh] sm:pt-[16vh]">
      <button
        type="button"
        aria-label="Close search"
        onClick={onClose}
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
      />
      <div className="relative w-full max-w-[620px] animate-fade-up overflow-hidden rounded-xl border border-line bg-panel shadow-[0_30px_80px_-20px_rgba(0,0,0,.9)]">
        <div className="flex items-center gap-3 border-b border-line px-4">
          <Search className="h-4 w-4 shrink-0 text-cyan" />
          <input
            ref={inputRef}
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={t('Search {count} tools by name, category or keyword…', {
              count: TOTAL_TOOLS,
            })}
            className="w-full bg-transparent py-4 text-sm text-ink outline-none placeholder:text-slate-500"
          />
          <kbd className="rounded border border-line px-1.5 py-0.5 font-mono text-[10px] text-slate-500">
            ESC
          </kbd>
        </div>

        <div className="max-h-[52vh] overflow-y-auto p-2">
          {results.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-10 text-center">
              <SearchX className="h-5 w-5 text-slate-600" />
              <p className="text-sm text-muted">{t('No tools matched “{query}”', { query })}</p>
              <p className="text-xs text-slate-600">
                {t('Press Enter to run a full search anyway.')}
              </p>
            </div>
          ) : (
            results.map((tool, index) => {
              const Icon = tool.icon
              const category = getCategory(tool.category)
              return (
                <button
                  key={tool.id}
                  type="button"
                  onMouseEnter={() => setSelected(index)}
                  onClick={() => goTo(tool.id)}
                  className={cn(
                    'flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition',
                    selected === index ? 'bg-cyan/10' : 'hover:bg-slate-800/50',
                  )}
                >
                  <span
                    className={cn(
                      'flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border',
                      selected === index
                        ? 'border-cyan/30 bg-cyan/10 text-cyan'
                        : 'border-line bg-panel-soft text-muted',
                    )}
                  >
                    <Icon className="h-4 w-4" strokeWidth={1.8} />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[13px] font-medium text-ink">{tool.name}</span>
                    <span className="block truncate text-[11px] text-slate-500">
                      {t(tool.description)}
                    </span>
                  </span>
                  <span className="hidden shrink-0 font-mono text-[10px] uppercase tracking-wider text-slate-600 sm:block">
                    {category.name}
                  </span>
                  {selected === index && <ArrowRight className="h-3.5 w-3.5 shrink-0 text-cyan" />}
                </button>
              )
            })
          )}
        </div>

        <div className="flex items-center gap-4 border-t border-line bg-panel-soft/50 px-4 py-2.5 text-[10px] text-slate-600">
          <span className="flex items-center gap-1">
            <kbd className="rounded border border-line px-1 font-mono">↑</kbd>
            <kbd className="rounded border border-line px-1 font-mono">↓</kbd> navigate
          </span>
          <span className="flex items-center gap-1">
            <CornerDownLeft className="h-3 w-3" /> open
          </span>
          <span className="ml-auto">ONEV command bar</span>
        </div>
      </div>
    </div>,
    document.body,
  )
}
