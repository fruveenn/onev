import { Check, Copy } from 'lucide-react'
import { useEffect, useState } from 'react'
import { copyToClipboard, cn } from '../../lib/utils'
import { useToast } from '../../store/toast'

interface CopyButtonProps {
  value: string
  label?: string
  className?: string
  disabled?: boolean
}

export function CopyButton({ value, label = 'Copy', className, disabled }: CopyButtonProps) {
  const [copied, setCopied] = useState(false)
  const { notify } = useToast()

  useEffect(() => {
    if (!copied) return
    const timer = setTimeout(() => setCopied(false), 1600)
    return () => clearTimeout(timer)
  }, [copied])

  async function handleCopy() {
    const ok = await copyToClipboard(value)
    if (ok) {
      setCopied(true)
      notify('Copied to clipboard')
    } else {
      notify('Could not access the clipboard', 'error')
    }
  }

  return (
    <button
      type="button"
      onClick={handleCopy}
      disabled={disabled || !value}
      className={cn('btn-ghost !py-1.5 !text-xs', copied && '!border-emerald-500/40 !text-emerald-400', className)}
      title={`Copy ${label.toLowerCase()}`}
    >
      {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
      {copied ? 'Copied' : label}
    </button>
  )
}
