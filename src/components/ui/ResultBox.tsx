import { Download } from 'lucide-react'
import type { ReactNode } from 'react'
import { cn, downloadText } from '../../lib/utils'
import { CopyButton } from './CopyButton'

interface ResultBoxProps {
  label?: string
  value: string
  hint?: string
  copyLabel?: string
  className?: string
  mono?: boolean
  minHeight?: string
  maxHeight?: string
  downloadFilename?: string
  downloadMime?: string
  downloadLabel?: string
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
  maxHeight = '320px',
  downloadFilename,
  downloadMime = 'text/plain',
  downloadLabel = 'Download',
  actions,
}: ResultBoxProps) {
  return (
    <div
      className={cn('min-w-0 max-w-full rounded-lg border border-line/70 bg-panel-soft/70 p-3.5', className)}
    >
      {(label || actions || value) && (
        <div className="mb-2 flex flex-wrap items-center justify-between gap-3">
          {label && <span className="label !mb-0">{label}</span>}
          <div className="ml-auto flex items-center gap-2">
            {actions}
            {value && downloadFilename && (
              <button
                type="button"
                onClick={() => downloadText(downloadFilename, value, downloadMime)}
                className="btn-ghost !px-2 !py-1 !text-[11px]"
              >
                <Download className="h-3 w-3" /> {downloadLabel}
              </button>
            )}
            {value && <CopyButton value={value} label={copyLabel} />}
          </div>
        </div>
      )}
      <div
        className={cn(
          'select-all min-w-0 max-w-full overflow-x-hidden overflow-y-auto whitespace-pre-wrap break-all text-ink',
          mono ? 'font-mono text-[13px] leading-relaxed' : 'text-sm leading-relaxed',
        )}
        style={{ minHeight, maxHeight }}
      >
        {value || <span className="text-slate-600">Result will appear here…</span>}
      </div>
      {hint && <p className="field-hint">{hint}</p>}
    </div>
  )
}
