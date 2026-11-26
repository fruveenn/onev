import { ArrowLeft, Compass } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useT } from '../store/language'

export function NotFoundPage() {
  const t = useT()
  return (
    <div className="card flex min-h-[420px] flex-col items-center justify-center px-6 text-center">
      <span className="flex h-12 w-12 items-center justify-center rounded-xl border border-cyan/20 bg-cyan/[0.07] text-cyan">
        <Compass className="h-5 w-5" />
      </span>
      <h1 className="mt-5 text-xl font-semibold text-ink">Nothing at this address</h1>
      <p className="mt-2 max-w-sm text-sm leading-relaxed text-muted">
        {t("The page or tool you were looking for doesn't exist. There are plenty of others to explore.")}
      </p>
      <Link to="/" className="btn-primary mt-6 !text-xs">
        <ArrowLeft className="h-3.5 w-3.5" /> Back to workspace
      </Link>
    </div>
  )
}
