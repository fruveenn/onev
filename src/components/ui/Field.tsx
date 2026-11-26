import type { ReactNode } from 'react'
import { cn } from '../../lib/utils'

interface FieldProps {
  label: string
  hint?: string
  htmlFor?: string
  className?: string
  action?: ReactNode
  children: ReactNode
}

export function Field({ label, hint, htmlFor, className, action, children }: FieldProps) {
  return (
    <div className={cn('min-w-0', className)}>
      <div className="flex items-center justify-between gap-2">
        <label className="label" htmlFor={htmlFor}>
          {label}
        </label>
        {action}
      </div>
      {children}
      {hint && <p className="field-hint">{hint}</p>}
    </div>
  )
}
