import {
  Clock3,
  Command,
  Heart,
  LayoutGrid,
  PanelLeftClose,
  Star,
  X,
} from 'lucide-react'
import { NavLink, useLocation } from 'react-router-dom'
import { CATEGORIES } from '../../registry/categories'
import { TOOLS } from '../../registry/tools'
import { cn } from '../../lib/utils'
import { useT } from '../../store/language'
import { useWorkspace } from '../../store/workspace'

interface SidebarProps {
  open: boolean
  onClose: () => void
  onSearch: () => void
}

export function Sidebar({ open, onClose, onSearch }: SidebarProps) {
  const location = useLocation()
  const { favorites, recent } = useWorkspace()
  const t = useT()
  const activeCategory = location.pathname.startsWith('/category/')
    ? location.pathname.split('/')[2]
    : null

  return (
    <>
      {open && (
        <button
          type="button"
          aria-label="Close navigation"
          onClick={onClose}
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
        />
      )}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 flex w-[252px] flex-col border-r border-line/70 bg-panel-soft/95 backdrop-blur-xl transition-transform duration-200 lg:translate-x-0',
          open ? 'translate-x-0' : '-translate-x-full',
        )}
      >
        <div className="flex h-16 shrink-0 items-center justify-between border-b border-line/70 px-5">
          <NavLink to="/" onClick={onClose} className="focus-ring flex items-center gap-2.5 rounded-lg">
            <span className="relative flex h-8 w-8 items-center justify-center rounded-lg border border-cyan/30 bg-cyan/10 font-mono text-sm font-bold text-cyan shadow-[0_0_18px_-8px_rgba(198,243,107,.75)]">
              O
            </span>
            <span className="text-[17px] font-bold tracking-[0.16em] text-ink">
              ONEV<span className="text-cyan">.</span>
            </span>
          </NavLink>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md p-1 text-muted hover:text-ink lg:hidden"
            aria-label="Close navigation"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-3 py-4">
          <button
            type="button"
            onClick={() => {
              onSearch()
              onClose()
            }}
            className="focus-ring mb-5 flex w-full items-center gap-2.5 rounded-lg border border-line bg-panel px-3 py-2 text-left text-xs text-slate-500 transition hover:border-cyan/30 hover:text-muted"
          >
            <Command className="h-3.5 w-3.5" />
            <span className="flex-1">Search tools</span>
            <kbd className="rounded border border-line px-1 py-0.5 font-mono text-[10px] text-slate-500">
              ⌘K
            </kbd>
          </button>

          <nav className="space-y-0.5">
            <SidebarLink to="/" icon={LayoutGrid} label="All tools" onClick={onClose} count={TOOLS.length} />
            <SidebarLink
              to="/favorites"
              icon={Star}
              label="Favorites"
              onClick={onClose}
              count={favorites.length}
            />
            <SidebarLink to="/recent" icon={Clock3} label="Recent" onClick={onClose} count={recent.length} />
          </nav>

          <div className="mt-6 px-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-600">
            Categories
          </div>
          <nav className="mt-2 space-y-0.5">
            {CATEGORIES.map((category) => {
              const Icon = category.icon
              return (
                <SidebarLink
                  key={category.id}
                  to={`/category/${category.id}`}
                  icon={Icon}
                  label={category.name}
                  onClick={onClose}
                  count={TOOLS.filter((tool) => tool.category === category.id).length}
                  active={activeCategory === category.id}
                />
              )
            })}
          </nav>
        </div>

        <div className="shrink-0 border-t border-line/70 px-5 py-4">
          <div className="flex items-center gap-2 text-[11px] text-slate-500">
            <Heart className="h-3 w-3 text-cyan/70" />
            {t('Private by design — everything runs locally.')}
          </div>
          <div className="mt-1.5 flex items-center gap-1.5 font-mono text-[10px] text-slate-600">
            <PanelLeftClose className="h-3 w-3" /> ONEV v1.0.0
          </div>
        </div>
      </aside>
    </>
  )
}

interface SidebarLinkProps {
  to: string
  icon: typeof LayoutGrid
  label: string
  count?: number
  onClick?: () => void
  active?: boolean
}

function SidebarLink({ to, icon: Icon, label, count, onClick, active }: SidebarLinkProps) {
  return (
    <NavLink
      to={to}
      end={to === '/'}
      onClick={onClick}
      className={({ isActive }) =>
        cn(
          'focus-ring group flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-[13px] transition',
          (isActive || active) && to !== '/'
            ? 'bg-cyan/10 text-cyan'
            : isActive
              ? 'bg-slate-800/60 text-ink'
              : 'text-muted hover:bg-slate-800/40 hover:text-ink',
        )
      }
    >
      <Icon className="h-[15px] w-[15px] shrink-0" strokeWidth={1.8} />
      <span className="flex-1 truncate">{label}</span>
      {count !== undefined && (
        <span className="font-mono text-[10px] text-slate-600 group-hover:text-slate-500">{count}</span>
      )}
    </NavLink>
  )
}
