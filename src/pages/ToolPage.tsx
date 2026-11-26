import { ChevronRight, Link2, Loader2, Star } from 'lucide-react'
import { Suspense, useEffect } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ToolCard } from '../components/ui/ToolCard'
import { cn } from '../lib/utils'
import { copyToClipboard } from '../lib/utils'
import { getCategory } from '../registry/categories'
import { getRelatedTools, getTool } from '../registry/tools'
import { useT } from '../store/language'
import { useToast } from '../store/toast'
import { useWorkspace } from '../store/workspace'
import { NotFoundPage } from './NotFoundPage'

export function ToolPage() {
  const { id } = useParams()
  const tool = getTool(id)
  const category = tool ? getCategory(tool.category) : null
  const Icon = tool?.icon
  const { isFavorite, toggleFavorite, recordVisit } = useWorkspace()
  const { notify } = useToast()
  const t = useT()

  useEffect(() => {
    if (tool) recordVisit(tool.id)
  }, [tool, recordVisit])

  if (!tool || !category || !Icon) return <NotFoundPage />

  const Component = tool.component
  const related = getRelatedTools(tool)
  const favorite = isFavorite(tool.id)

  async function share() {
    const ok = await copyToClipboard(window.location.href)
    notify(ok ? 'Link copied to clipboard' : 'Could not copy the link', ok ? 'success' : 'error')
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex min-w-0 items-start gap-3.5">
          <span className="mt-0.5 flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-cyan/20 bg-cyan/[0.07] text-cyan shadow-[0_0_24px_-14px_rgba(198,243,107,.7)]">
            <Icon className="h-5 w-5" strokeWidth={1.8} />
          </span>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 text-[11px] text-slate-500">
              <Link to="/" className="transition hover:text-ink">
                Workspace
              </Link>
              <ChevronRight className="h-3 w-3" />
              <Link to={`/category/${category.id}`} className="transition hover:text-ink">
                {category.name}
              </Link>
            </div>
            <h1 className="mt-1 text-[22px] font-semibold tracking-tight text-ink sm:text-[26px]">
              {tool.name}
            </h1>
            <p className="mt-1 max-w-2xl text-[13px] leading-relaxed text-muted">{t(tool.description)}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => toggleFavorite(tool.id)}
            className={cn('btn-icon', favorite && 'border-amber-400/40 text-amber-400')}
            aria-label={favorite ? 'Remove from favorites' : 'Add to favorites'}
            title={favorite ? 'Remove from favorites' : 'Add to favorites'}
          >
            <Star className="h-4 w-4" fill={favorite ? 'currentColor' : 'none'} />
          </button>
          <button type="button" onClick={share} className="btn-ghost !py-2 !text-xs" title="Copy link to this tool">
            <Link2 className="h-3.5 w-3.5" />
            Share
          </button>
        </div>
      </div>

      <section className="card p-4 sm:p-6" aria-label={`${tool.name} workspace`}>
        <Suspense fallback={<ToolLoading />}>
          <Component {...tool.props} />
        </Suspense>
      </section>

      {related.length > 0 && (
        <section>
          <div className="mb-3.5 flex items-center justify-between">
            <h2 className="section-title">More in {category.name}</h2>
            <Link to={`/category/${category.id}`} className="text-xs text-muted transition hover:text-cyan">
              View category →
            </Link>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {related.map((item) => (
              <ToolCard key={item.id} tool={item} compact />
            ))}
          </div>
        </section>
      )}
    </div>
  )
}

function ToolLoading() {
  const t = useT()
  return (
    <div className="flex min-h-[320px] flex-col items-center justify-center gap-3 text-muted">
      <Loader2 className="h-5 w-5 animate-spin text-cyan" />
      <span className="text-xs">{t('Loading tool…')}</span>
    </div>
  )
}
