import type { ReactNode } from 'react'
import { cn } from '../../lib/utils'
import { CopyButton } from './CopyButton'

interface ResultBoxProps {
  label?: string
  value: string
  hint?: string
  copyLabel?: string
  className?: string
  mono?: boolean
  minHeight?: string
  actions?: ReactNode
}

export function ResultBox({
  label,
  value,
  hint,
  copyLabel = 'Copy',
  className,
  mono = true,
  minHeight,
  actions,
}: ResultBoxProps) {
  return (
    <div className={cn('rounded-lg border border-line/70 bg-panel-soft/70 p-3.5', className)}>
      {(label || actions || value) && (
        <div className="mb-2 flex items-center justify-between gap-3">
          {label && <span className="label !mb-0">{label}</span>}
          <div className="ml-auto flex items-center gap-2">
            {actions}
            {value && <CopyButton value={value} label={copyLabel} />}
          </div>
        </div>
      )}
      <div
        className={cn(
          'select-all whitespace-pre-wrap break-words text-ink',
          mono ? 'font-mono text-[13px] leading-relaxed' : 'text-sm leading-relaxed',
        )}
        style={minHeight ? { minHeight } : undefined}
      >
        {value || <span className="text-slate-600">Result will appear here…</span>}
      </div>
      {hint && <p className="field-hint">{hint}</p>}
    </div>
  )
}
