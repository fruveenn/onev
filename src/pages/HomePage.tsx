import { ArrowRight, Clock3, Layers3, Search, ShieldCheck, Sparkles, Star } from 'lucide-react'
import { useState, type FormEvent, type ReactNode } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ToolCard } from '../components/ui/ToolCard'
import { cn } from '../lib/utils'
import { CATEGORIES } from '../registry/categories'
import { FEATURED_TOOLS, TOOLS, TOTAL_TOOLS } from '../registry/tools'
import { useT } from '../store/language'
import { useWorkspace } from '../store/workspace'

export function HomePage() {
  const [query, setQuery] = useState('')
  const navigate = useNavigate()
  const { favorites, recent, clearRecent } = useWorkspace()
  const t = useT()

  function handleSubmit(event: FormEvent) {
    event.preventDefault()
    if (query.trim()) navigate(`/search?q=${encodeURIComponent(query.trim())}`)
  }

  const recentTools = recent.map((id) => TOOLS.find((tool) => tool.id === id)).filter(Boolean)
  const favoriteTools = favorites.map((id) => TOOLS.find((tool) => tool.id === id)).filter(Boolean)

  return (
    <div className="space-y-10">
      <section className="card relative overflow-hidden px-6 py-8 sm:px-8 sm:py-10">
        <div className="grid-surface pointer-events-none absolute inset-0 opacity-60" />
        <div className="pointer-events-none absolute -right-20 -top-24 h-64 w-64 rounded-full bg-cyan/10 blur-3xl" />
        <div className="relative max-w-2xl">
          <span className="chip chip-active !text-[10px]">
            <Sparkles className="h-3 w-3" />
            THE DEVELOPER WORKSPACE
          </span>
          <h1 className="mt-5 text-[30px] font-semibold leading-[1.15] tracking-[-0.035em] sm:text-[40px]">
            Everything you need.
            <br />
            <span className="text-gradient">Nothing you don&apos;t.</span>
          </h1>
          <p className="mt-4 max-w-xl text-sm leading-relaxed text-muted sm:text-[15px]">
            {t(
              '{count} focused utilities for code, text, color, images and everyday maths. No sign-up, no uploads — just tools that get out of your way.',
              { count: TOTAL_TOOLS },
            )}
          </p>

          <form onSubmit={handleSubmit} className="mt-6 flex max-w-xl gap-2">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Try “base64”, “crop” or “currency”…"
                aria-label="Search tools"
                className="input !py-3 !pl-10"
              />
            </div>
            <button type="submit" className="btn-primary !px-4">
              Search
              <ArrowRight className="h-4 w-4" />
            </button>
          </form>

          <div className="mt-7 flex flex-wrap gap-x-6 gap-y-3 text-xs text-slate-500">
            <Stat
              icon={<Layers3 className="h-3.5 w-3.5 text-cyan/70" />}
              value={`${TOTAL_TOOLS} ${t('tools')}`}
            />
            <Stat
              icon={<Clock3 className="h-3.5 w-3.5 text-cyan/70" />}
              value={t('Instant, offline-first')}
            />
            <Stat
              icon={<ShieldCheck className="h-3.5 w-3.5 text-cyan/70" />}
              value={t('Your data stays local')}
            />
          </div>
        </div>
      </section>

      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="section-title">Browse by category</h2>
          <Link to="/#all-tools" className="text-xs text-muted transition hover:text-cyan">
            View all tools →
          </Link>
        </div>
        <div className="flex flex-wrap gap-2">
          {CATEGORIES.map((category) => {
            const Icon = category.icon
            return (
              <Link
                key={category.id}
                to={`/category/${category.id}`}
                className="focus-ring group flex items-center gap-2 rounded-lg border border-line bg-panel px-3 py-2 text-xs text-muted transition hover:border-cyan/35 hover:text-ink"
              >
                <Icon className="h-3.5 w-3.5 text-slate-500 transition group-hover:text-cyan" />
                {category.name}
                <span className="font-mono text-[10px] text-slate-600">
                  {TOOLS.filter((tool) => tool.category === category.id).length}
                </span>
              </Link>
            )
          })}
        </div>
      </section>

      <section>
        <SectionHeading title="Featured tools" subtitle={t('The ones people reach for most.')} />
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {FEATURED_TOOLS.map((tool) => (
            <ToolCard key={tool.id} tool={tool} />
          ))}
        </div>
      </section>

      {(recentTools.length > 0 || favoriteTools.length > 0) && (
        <section className="grid gap-6 lg:grid-cols-2">
          {recentTools.length > 0 && (
            <div>
              <SectionHeading
                title="Recently used"
                action={
                  <button type="button" onClick={clearRecent} className="text-xs text-slate-500 hover:text-ink">
                    Clear
                  </button>
                }
              />
              <div className="grid grid-cols-2 gap-3">
                {recentTools.slice(0, 4).map((tool) => tool && <ToolCard key={tool.id} tool={tool} compact />)}
              </div>
            </div>
          )}
          {favoriteTools.length > 0 && (
            <div>
              <SectionHeading
                title="Favorites"
                action={
                  <Link to="/favorites" className="text-xs text-slate-500 hover:text-ink">
                    See all
                  </Link>
                }
              />
              <div className="grid grid-cols-2 gap-3">
                {favoriteTools.slice(0, 4).map((tool) => tool && <ToolCard key={tool.id} tool={tool} compact />)}
              </div>
            </div>
          )}
        </section>
      )}

      <section id="all-tools" className="scroll-mt-24 space-y-9">
        <SectionHeading
          title="All tools"
          subtitle={t('Browse the full {count}-tool library.', { count: TOTAL_TOOLS })}
        />
        {CATEGORIES.map((category) => {
          const categoryTools = TOOLS.filter((tool) => tool.category === category.id)
          const Icon = category.icon
          return (
            <div key={category.id}>
              <div className="mb-3.5 flex items-center gap-2.5">
                <span className="flex h-7 w-7 items-center justify-center rounded-lg border border-line bg-panel text-cyan/80">
                  <Icon className="h-3.5 w-3.5" />
                </span>
                <h3 className="text-sm font-semibold text-ink">{category.name}</h3>
                <span className="font-mono text-[11px] text-slate-600">{categoryTools.length}</span>
                <div className="ml-2 hidden h-px flex-1 bg-line/70 sm:block" />
                <Link
                  to={`/category/${category.id}`}
                  className={cn('text-[11px] text-slate-500 transition hover:text-cyan')}
                >
                  View all
                </Link>
              </div>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {categoryTools.map((tool) => (
                  <ToolCard key={tool.id} tool={tool} />
                ))}
              </div>
            </div>
          )
        })}
      </section>

      <footer className="flex flex-wrap items-center justify-between gap-3 border-t border-line/70 pt-6 text-xs text-slate-600">
        <span>{t('ONEV — one workspace, every utility.')}</span>
        <span className="flex items-center gap-1.5">
          <Star className="h-3 w-3 text-cyan/60" /> {t('Built for people who build things.')}
        </span>
      </footer>
    </div>
  )
}

function Stat({ icon, value }: { icon: ReactNode; value: string }) {
  return (
    <span className="flex items-center gap-1.5">
      {icon}
      {value}
    </span>
  )
}

function SectionHeading({
  title,
  subtitle,
  action,
}: {
  title: string
  subtitle?: string
  action?: ReactNode
}) {
  return (
    <div className="mb-3.5 flex flex-wrap items-end justify-between gap-2">
      <div>
        <h2 className="section-title">{title}</h2>
        {subtitle && <p className="mt-1 text-xs text-slate-500">{subtitle}</p>}
      </div>
      {action}
    </div>
  )
}
