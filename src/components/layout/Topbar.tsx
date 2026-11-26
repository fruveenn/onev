import { ChevronRight, Command, Languages, Menu, Search, WifiOff } from 'lucide-react'
import { useLocation } from 'react-router-dom'
import { getCategory, isCategoryId } from '../../registry/categories'
import { getTool, TOTAL_TOOLS } from '../../registry/tools'
import { cn } from '../../lib/utils'
import { useLanguage } from '../../store/language'

interface TopbarProps {
  onMenu: () => void
  onSearch: () => void
}

export function Topbar({ onMenu, onSearch }: TopbarProps) {
  const location = useLocation()
  const { language, setLanguage } = useLanguage()
  const segments = location.pathname.split('/').filter(Boolean)

  let trail: { label: string; to?: string }[] = [{ label: 'Workspace', to: '/' }]
  if (segments[0] === 'tools' && segments[1]) {
    const tool = getTool(segments[1])
    if (tool) {
      trail = [
        ...trail,
        { label: 'Tools', to: '/#all-tools' },
        { label: tool.name },
      ]
    }
  } else if (segments[0] === 'category' && isCategoryId(segments[1])) {
    trail = [...trail, { label: getCategory(segments[1]).name }]
  } else if (['favorites', 'recent', 'search'].includes(segments[0])) {
    trail = [...trail, { label: capitalize(segments[0]) }]
  }

  return (
    <header className="sticky top-0 z-30 border-b border-line/70 bg-base/85 backdrop-blur-xl">
      <div className="mx-auto flex h-16 w-full max-w-[1400px] items-center gap-3 px-4 sm:px-6 lg:px-9">
        <button
          type="button"
          onClick={onMenu}
          className="btn-icon lg:hidden"
          aria-label="Open navigation"
        >
          <Menu className="h-5 w-5" />
        </button>

        <nav className="hidden min-w-0 items-center gap-1.5 text-[13px] sm:flex" aria-label="Breadcrumb">
          {trail.map((segment, index) => (
            <span key={`${segment.label}-${index}`} className="flex min-w-0 items-center gap-1.5">
              {index > 0 && <ChevronRight className="h-3.5 w-3.5 shrink-0 text-slate-700" />}
              {segment.to ? (
                <a href={segment.to} className="shrink-0 text-muted transition hover:text-ink">
                  {segment.label}
                </a>
              ) : (
                <span className="truncate font-medium text-ink">{segment.label}</span>
              )}
            </span>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-2">
          <button
            type="button"
            onClick={() => setLanguage(language === 'id' ? 'en' : 'id')}
            className="chip transition hover:border-cyan/40 hover:text-ink"
            title={language === 'id' ? 'Switch to English' : 'Ganti ke Bahasa Indonesia'}
            aria-label={language === 'id' ? 'Switch to English' : 'Ganti ke Bahasa Indonesia'}
          >
            <Languages className="h-3 w-3 text-cyan/70" />
            {language.toUpperCase()}
          </button>
          <span className="chip hidden md:inline-flex">
            <WifiOff className="h-3 w-3 text-cyan/70" />
            Local-first
          </span>
          <span className="chip hidden lg:inline-flex">{TOTAL_TOOLS} tools</span>
          <button
            type="button"
            onClick={onSearch}
            className="focus-ring flex items-center gap-2 rounded-lg border border-line bg-panel px-2.5 py-2 text-xs text-muted transition hover:border-cyan/40 hover:text-ink sm:px-3"
          >
            <Search className="h-3.5 w-3.5" />
            <span className={cn('hidden sm:inline')}>Search tools</span>
            <kbd className="ml-2 hidden items-center gap-0.5 rounded border border-line px-1 py-0.5 font-mono text-[10px] text-slate-500 md:inline-flex">
              <Command className="h-2.5 w-2.5" />K
            </kbd>
          </button>
        </div>
      </div>
    </header>
  )
}

function capitalize(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1)
}
