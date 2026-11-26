import type { ReactNode } from 'react'
import { cn } from '../../lib/utils'

interface StatTileProps {
  label: string
  value: ReactNode
  icon?: ReactNode
  className?: string
}

export function StatTile({ label, value, icon, className }: StatTileProps) {
  return (
    <div className={cn('rounded-lg border border-line/70 bg-panel-soft/60 px-3.5 py-3', className)}>
      <div className="flex items-center gap-2 text-slate-500">
        {icon}
        <span className="text-[10px] font-semibold uppercase tracking-[0.12em]">{label}</span>
      </div>
      <div className="mt-1.5 truncate font-mono text-lg font-medium text-ink">{value}</div>
    </div>
  )
}
