import { FileUp, ImageIcon, X } from 'lucide-react'
import { useRef, useState, type DragEvent } from 'react'
import { formatBytes } from '../../lib/image'
import { cn } from '../../lib/utils'

interface FileDropProps {
  file: File | null
  onFile: (file: File | null) => void
  accept?: string
  label?: string
}

export function FileDrop({
  file,
  onFile,
  accept = 'image/png,image/jpeg,image/webp,image/gif,image/bmp',
  label = 'Drop an image here or click to browse',
}: FileDropProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [dragging, setDragging] = useState(false)

  function handleDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault()
    setDragging(false)
    const dropped = event.dataTransfer.files?.[0]
    if (dropped) onFile(dropped)
  }

  return (
    <div
      onDragOver={(event) => {
        event.preventDefault()
        setDragging(true)
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={handleDrop}
      className={cn(
        'rounded-lg border border-dashed p-5 text-center transition',
        dragging ? 'border-cyan bg-cyan/[0.06]' : 'border-line bg-base/40 hover:border-cyan/40',
      )}
    >
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        className="hidden"
        onChange={(event) => onFile(event.target.files?.[0] ?? null)}
      />
      {file ? (
        <div className="flex items-center gap-3 text-left">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-cyan/20 bg-cyan/[0.07] text-cyan">
            <ImageIcon className="h-4 w-4" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-[13px] font-medium text-ink">{file.name}</p>
            <p className="text-xs text-slate-500">{formatBytes(file.size)}</p>
          </div>
          <button type="button" onClick={() => inputRef.current?.click()} className="btn-ghost !py-1.5 !text-xs">
            Change
          </button>
          <button
            type="button"
            onClick={() => {
              onFile(null)
              if (inputRef.current) inputRef.current.value = ''
            }}
            className="btn-icon !h-8 !w-8"
            aria-label="Remove file"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      ) : (
        <button type="button" onClick={() => inputRef.current?.click()} className="group flex w-full flex-col items-center gap-2 py-2">
          <span className="flex h-10 w-10 items-center justify-center rounded-lg border border-line bg-panel-soft text-slate-500 transition group-hover:border-cyan/40 group-hover:text-cyan">
            <FileUp className="h-4 w-4" />
          </span>
          <span className="text-[13px] text-muted">{label}</span>
          <span className="text-[11px] text-slate-600">PNG, JPG, WebP, GIF or BMP</span>
        </button>
      )}
    </div>
  )
}
