import { ArrowLeft, Clock3, SearchX, Star } from 'lucide-react'
import { useState, type FormEvent, type ReactNode } from 'react'
import { Link, useParams, useSearchParams } from 'react-router-dom'
import { ToolCard } from '../components/ui/ToolCard'
import { getCategory, isCategoryId } from '../registry/categories'
import { searchTools, TOOLS } from '../registry/tools'
import type { ToolMeta } from '../registry/types'
import { useT } from '../store/language'
import { useWorkspace } from '../store/workspace'
import { NotFoundPage } from './NotFoundPage'

export function CategoryPage() {
  const t = useT()
  const { categoryId } = useParams()
  if (!isCategoryId(categoryId)) return <NotFoundPage />
  const category = getCategory(categoryId)
  const Icon = category.icon
  const tools = TOOLS.filter((tool) => tool.category === categoryId)

  return (
    <div>
      <PageIntro
        icon={<Icon className="h-6 w-6" />}
        eyebrow="CATEGORY"
        title={category.name}
        description={t(category.description)}
        count={tools.length}
      />
      <ToolGrid tools={tools} />
    </div>
  )
}

export function SearchPage() {
  const t = useT()
  const [params, setParams] = useSearchParams()
  const query = params.get('q') ?? ''
  const [draft, setDraft] = useState(query)
  const results = searchTools(query)

  function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setParams(draft.trim() ? { q: draft.trim() } : {})
  }

  return (
    <div>
      <PageIntro
        icon={<SearchX className="h-6 w-6" />}
        eyebrow="SEARCH"
        title={query ? `Results for “${query}”` : 'Search tools'}
        description={t('Search across names, descriptions, categories and keywords.')}
        count={results.length}
      />
      <form onSubmit={handleSubmit} className="mb-7 flex gap-2">
        <input
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          placeholder={t('Type a tool name or keyword…')}
          aria-label="Search query"
          className="input max-w-xl"
          autoFocus
        />
        <button type="submit" className="btn-primary">Search</button>
      </form>
      {results.length > 0 ? (
        <ToolGrid tools={results} />
      ) : (
        <div className="card flex flex-col items-center gap-3 px-6 py-14 text-center">
          <SearchX className="h-6 w-6 text-slate-600" />
          <p className="text-sm text-ink">{t('No tools found')}</p>
          <p className="text-xs text-muted">
            {t('Try a broader term like “convert”, “text” or “color”.')}
          </p>
          <Link to="/#all-tools" className="btn-ghost mt-2 !text-xs">
            Browse all tools
          </Link>
        </div>
      )}
    </div>
  )
}

export function FavoritesPage() {
  const t = useT()
  const { favorites } = useWorkspace()
  const tools = favorites.map((id) => TOOLS.find((tool) => tool.id === id)).filter((tool): tool is ToolMeta => Boolean(tool))
  return (
    <div>
      <PageIntro
        icon={<Star className="h-6 w-6" />}
        eyebrow="YOUR WORKSPACE"
        title="Favorites"
        description={t('Your pinned tools, saved locally in this browser.')}
        count={tools.length}
      />
      {tools.length ? (
        <ToolGrid tools={tools} />
      ) : (
        <EmptyCollection
          title="No favorites yet"
          description={t('Tap the star on any tool card to pin it here for quick access.')}
        />
      )}
    </div>
  )
}

export function RecentPage() {
  const t = useT()
  const { recent, clearRecent } = useWorkspace()
  const tools = recent.map((id) => TOOLS.find((tool) => tool.id === id)).filter((tool): tool is ToolMeta => Boolean(tool))
  return (
    <div>
      <PageIntro
        icon={<Clock3 className="h-6 w-6" />}
        eyebrow="YOUR WORKSPACE"
        title="Recently used"
        description={t('The last tools you opened, stored locally.')}
        count={tools.length}
        action={
          tools.length > 0 ? (
            <button type="button" onClick={clearRecent} className="btn-ghost !text-xs">
              Clear history
            </button>
          ) : undefined
        }
      />
      {tools.length ? (
        <ToolGrid tools={tools} />
      ) : (
        <EmptyCollection
          title="Nothing here yet"
          description={t('Tools you visit will show up here automatically.')}
        />
      )}
    </div>
  )
}

function PageIntro({
  icon,
  eyebrow,
  title,
  description,
  count,
  action,
}: {
  icon: ReactNode
  eyebrow: string
  title: string
  description: string
  count: number
  action?: ReactNode
}) {
  const t = useT()
  return (
    <div className="mb-7 flex flex-wrap items-start justify-between gap-4">
      <div className="flex items-start gap-3.5">
        <span className="mt-0.5 flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-cyan/20 bg-cyan/[0.07] text-cyan">
          {icon}
        </span>
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-cyan/70">{eyebrow}</p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight text-ink">{title}</h1>
          <p className="mt-1.5 text-sm text-muted">{description}</p>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <span className="chip">
          {count} {t(count === 1 ? 'tool' : 'tools')}
        </span>
        {action}
      </div>
    </div>
  )
}

function ToolGrid({ tools }: { tools: ToolMeta[] }) {
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {tools.map((tool) => (
        <ToolCard key={tool.id} tool={tool} />
      ))}
    </div>
  )
}

function EmptyCollection({ title, description }: { title: string; description: string }) {
  return (
    <div className="card flex flex-col items-center gap-3 px-6 py-16 text-center">
      <Star className="h-6 w-6 text-slate-600" />
      <p className="text-sm font-medium text-ink">{title}</p>
      <p className="max-w-sm text-xs leading-relaxed text-muted">{description}</p>
      <Link to="/#all-tools" className="btn-ghost mt-2 !text-xs">
        <ArrowLeft className="h-3.5 w-3.5" /> Browse tools
      </Link>
    </div>
  )
}
