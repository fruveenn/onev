import { ArrowUpRight, Star } from 'lucide-react'
import { Link } from 'react-router-dom'
import { getCategory } from '../../registry/categories'
import type { ToolMeta } from '../../registry/types'
import { cn } from '../../lib/utils'
import { useT } from '../../store/language'
import { useWorkspace } from '../../store/workspace'

interface ToolCardProps {
  tool: ToolMeta
  compact?: boolean
}

export function ToolCard({ tool, compact = false }: ToolCardProps) {
  const Icon = tool.icon
  const category = getCategory(tool.category)
  const { isFavorite, toggleFavorite } = useWorkspace()
  const t = useT()
  const favorite = isFavorite(tool.id)

  return (
    <div className="group relative">
      <Link
        to={`/tools/${tool.id}`}
        className={cn(
          'card focus-ring block h-full transition duration-200 hover:-translate-y-0.5 hover:border-cyan/35 hover:shadow-glow',
          compact ? 'p-3.5' : 'p-4',
        )}
      >
        <div className="flex items-start justify-between gap-3">
          <span className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-cyan/15 bg-cyan/[0.07] text-cyan transition group-hover:border-cyan/30 group-hover:bg-cyan/10">
            <Icon className="h-[18px] w-[18px]" strokeWidth={1.8} />
          </span>
          <ArrowUpRight className="h-4 w-4 text-slate-600 transition group-hover:text-cyan" />
        </div>
        <h3 className="mt-3.5 truncate text-[14px] font-semibold text-ink">{tool.name}</h3>
        {!compact && (
          <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-muted">{t(tool.description)}</p>
        )}
        <div className="mt-3 flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-600">
          <span className="h-1 w-1 rounded-full bg-cyan/60" />
          {category.name}
        </div>
      </Link>
      <button
        type="button"
        onClick={() => toggleFavorite(tool.id)}
        aria-label={favorite ? `Remove ${tool.name} from favorites` : `Add ${tool.name} to favorites`}
        title={favorite ? 'Remove from favorites' : 'Add to favorites'}
        className={cn(
          'absolute right-9 top-3.5 rounded-md p-1 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan/60',
          favorite
            ? 'text-amber-400 opacity-100'
            : 'text-slate-600 opacity-0 hover:text-amber-300 group-hover:opacity-100 focus:opacity-100',
        )}
      >
        <Star className="h-3.5 w-3.5" fill={favorite ? 'currentColor' : 'none'} />
      </button>
    </div>
  )
}

export function ToolCardSkeleton() {
  return (
    <div className="card animate-pulse p-4">
      <div className="h-9 w-9 rounded-lg bg-slate-800" />
      <div className="mt-3.5 h-3.5 w-3/4 rounded bg-slate-800" />
      <div className="mt-2 h-2.5 w-full rounded bg-slate-800/70" />
      <div className="mt-1.5 h-2.5 w-2/3 rounded bg-slate-800/70" />
    </div>
  )
}
