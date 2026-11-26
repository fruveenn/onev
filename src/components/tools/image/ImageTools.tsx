import { Download, Maximize2, Scissors, Sparkles } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Field } from '../../ui/Field'
import { FileDrop } from '../../ui/FileDrop'
import { Panel } from '../../ui/Panel'
import { Segmented } from '../../ui/Segmented'
import { StatTile } from '../../ui/StatTile'
import { Switch } from '../../ui/Switch'
import {
  extensionFor,
  fitWithin,
  formatBytes,
  readImage,
  renderImage,
  saveImage,
  type ImageFormat,
} from '../../../lib/image'
import { clamp } from '../../../lib/utils'

type Crop = { x: number; y: number; width: number; height: number }

function useLoadedImage(file: File | null) {
  const [image, setImage] = useState<HTMLImageElement | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false
    if (!file) {
      setImage(null)
      setError('')
      return
    }
    readImage(file)
      .then((loaded) => {
        if (!cancelled) {
          setImage(loaded)
          setError('')
        }
      })
      .catch((cause: unknown) => {
        if (!cancelled) {
          setImage(null)
          setError(cause instanceof Error ? cause.message : 'Could not read the image.')
        }
      })
    return () => {
      cancelled = true
    }
  }, [file])

  return { image, error }
}

function useBlobPreview(blob: Blob | null) {
  const [url, setUrl] = useState('')
  useEffect(() => {
    if (!blob) {
      setUrl('')
      return
    }
    const next = URL.createObjectURL(blob)
    setUrl(next)
    return () => URL.revokeObjectURL(next)
  }, [blob])
  return url
}

function FormatSelect({
  value,
  onChange,
}: {
  value: ImageFormat
  onChange: (value: ImageFormat) => void
}) {
  return (
    <Field label="Output format">
      <Segmented
        size="sm"
        value={value}
        onChange={onChange}
        options={[
          { value: 'image/png', label: 'PNG' },
          { value: 'image/jpeg', label: 'JPG' },
          { value: 'image/webp', label: 'WebP' },
        ]}
      />
    </Field>
  )
}

function QualitySlider({ value, onChange }: { value: number; onChange: (value: number) => void }) {
  return (
    <Field label={`Quality — ${Math.round(value * 100)}%`}>
      <input
        type="range"
        min={0.1}
        max={1}
        step={0.05}
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
        className="w-full accent-cyan"
      />
    </Field>
  )
}

function OutputPanel({
  file,
  output,
  preview,
  name,
}: {
  file: File | null
  output: Blob | null
  preview: string
  name: string
}) {
  return (
    <Panel title="Result" subtitle={output ? 'Ready to download.' : 'Configure the options and run the tool.'}>
      {output && file ? (
        <>
          <div className="flex min-h-[220px] items-center justify-center overflow-hidden rounded-lg border border-line/70 bg-base/50 p-3">
            <img src={preview} alt="Processed image preview" className="max-h-[280px] max-w-full object-contain" />
          </div>
          <div className="mt-4 grid grid-cols-2 gap-2.5">
            <StatTile label="Original" value={formatBytes(file.size)} />
            <StatTile label="Result" value={formatBytes(output.size)} />
          </div>
          <button
            type="button"
            onClick={() => saveImage(output, name, output.type as ImageFormat)}
            className="btn-primary mt-4 w-full"
          >
            <Download className="h-4 w-4" /> Download .{extensionFor(output.type as ImageFormat)}
          </button>
        </>
      ) : (
        <div className="flex min-h-[220px] flex-col items-center justify-center gap-2 text-center">
          <Sparkles className="h-5 w-5 text-slate-600" />
          <p className="text-xs text-muted">Your processed image will appear here.</p>
        </div>
      )}
    </Panel>
  )
}

// ------------------------------------------------------------------- Resizer ---

export function ImageResizer() {
  const [file, setFile] = useState<File | null>(null)
  const { image, error } = useLoadedImage(file)
  const [width, setWidth] = useState(0)
  const [height, setHeight] = useState(0)
  const [locked, setLocked] = useState(true)
  const [format, setFormat] = useState<ImageFormat>('image/png')
  const [quality, setQuality] = useState(0.9)
  const [output, setOutput] = useState<Blob | null>(null)
  const preview = useBlobPreview(output)

  useEffect(() => {
    if (image) {
      setWidth(image.naturalWidth)
      setHeight(image.naturalHeight)
    }
    setOutput(null)
  }, [image])

  const ratio = image && width > 0 ? image.naturalWidth / image.naturalHeight : 1

  async function resize() {
    if (!image) return
    setOutput(
      await renderImage(image, {
        width: clamp(Math.round(width), 1, 10000),
        height: clamp(Math.round(height), 1, 10000),
        format,
        quality,
      }),
    )
  }

  return (
    <div className="grid gap-5 lg:grid-cols-2">
      <div className="space-y-5">
        <Panel title="Source image">
          <FileDrop file={file} onFile={setFile} />
          {error && <p className="mt-2 text-xs text-rose-400">{error}</p>}
          {image && (
            <div className="mt-4 grid grid-cols-2 gap-2.5">
              <StatTile label="Original width" value={`${image.naturalWidth} px`} />
              <StatTile label="Original height" value={`${image.naturalHeight} px`} />
            </div>
          )}
        </Panel>
        <Panel title="Resize settings">
          <div className="grid grid-cols-2 gap-3">
            <Field label="Width (px)" htmlFor="resize-width">
              <input
                id="resize-width"
                type="number"
                min={1}
                value={width || ''}
                onChange={(event) => {
                  const next = Number(event.target.value)
                  setWidth(next)
                  if (locked && ratio) setHeight(Math.round(next / ratio))
                }}
                className="input-mono"
              />
            </Field>
            <Field label="Height (px)" htmlFor="resize-height">
              <input
                id="resize-height"
                type="number"
                min={1}
                value={height || ''}
                onChange={(event) => {
                  const next = Number(event.target.value)
                  setHeight(next)
                  if (locked && ratio) setWidth(Math.round(next * ratio))
                }}
                className="input-mono"
              />
            </Field>
          </div>
          <div className="mt-2">
            <Switch checked={locked} onChange={setLocked} label="Lock aspect ratio" />
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            {[25, 50, 75].map((percent) => (
              <button
                key={percent}
                type="button"
                disabled={!image}
                onClick={() => {
                  if (!image) return
                  setWidth(Math.round(image.naturalWidth * (percent / 100)))
                  setHeight(Math.round(image.naturalHeight * (percent / 100)))
                }}
                className="btn-ghost !py-1.5 !text-xs"
              >
                {percent}%
              </button>
            ))}
            {image && (
              <button
                type="button"
                onClick={() => {
                  const fitted = fitWithin(
                    { width: image.naturalWidth, height: image.naturalHeight },
                    1200,
                    1200,
                  )
                  setWidth(fitted.width)
                  setHeight(fitted.height)
                }}
                className="btn-ghost !py-1.5 !text-xs"
              >
                <Maximize2 className="h-3.5 w-3.5" /> Fit 1200px
              </button>
            )}
          </div>
          <div className="mt-5 space-y-4">
            <FormatSelect value={format} onChange={setFormat} />
            {format !== 'image/png' && <QualitySlider value={quality} onChange={setQuality} />}
          </div>
          <button type="button" onClick={resize} disabled={!image} className="btn-primary mt-5 w-full">
            <Maximize2 className="h-4 w-4" /> Resize image
          </button>
        </Panel>
      </div>
      <OutputPanel file={file} output={output} preview={preview} name="onev-resized" />
    </div>
  )
}

// ------------------------------------------------------------------- Cropper ---

export function ImageCropper() {
  const [file, setFile] = useState<File | null>(null)
  const { image, error } = useLoadedImage(file)
  const [crop, setCrop] = useState<Crop>({ x: 0, y: 0, width: 0, height: 0 })
  const [format, setFormat] = useState<ImageFormat>('image/png')
  const [output, setOutput] = useState<Blob | null>(null)
  const preview = useBlobPreview(output)

  useEffect(() => {
    if (image) setCrop({ x: 0, y: 0, width: image.naturalWidth, height: image.naturalHeight })
    setOutput(null)
  }, [image])

  async function applyCrop() {
    if (!image || crop.width < 1 || crop.height < 1) return
    const fitted = fitWithin({ width: crop.width, height: crop.height }, 2000, 2000)
    setOutput(
      await renderImage(image, {
        ...fitted,
        format,
        quality: 0.95,
        crop,
      }),
    )
  }

  const maxX = image ? Math.max(0, image.naturalWidth - crop.width) : 0
  const maxY = image ? Math.max(0, image.naturalHeight - crop.height) : 0

  return (
    <div className="grid gap-5 lg:grid-cols-2">
      <div className="space-y-5">
        <Panel title="Source image">
          <FileDrop file={file} onFile={setFile} />
          {error && <p className="mt-2 text-xs text-rose-400">{error}</p>}
          {image && (
            <div className="relative mt-4 overflow-hidden rounded-lg border border-line/70 bg-base/50">
              <img src={image.src} alt="Crop preview" className="block w-full" />
              <div
                className="pointer-events-none absolute border-2 border-cyan bg-cyan/10 shadow-[0_0_0_9999px_rgba(11,12,14,.68)]"
                style={{
                  left: `${(crop.x / image.naturalWidth) * 100}%`,
                  top: `${(crop.y / image.naturalHeight) * 100}%`,
                  width: `${(crop.width / image.naturalWidth) * 100}%`,
                  height: `${(crop.height / image.naturalHeight) * 100}%`,
                }}
              />
            </div>
          )}
        </Panel>
        <Panel title="Crop area (pixels)">
          <div className="grid grid-cols-2 gap-3">
            {([
              ['x', 'X offset', maxX],
              ['y', 'Y offset', maxY],
              ['width', 'Width', image ? image.naturalWidth : 0],
              ['height', 'Height', image ? image.naturalHeight : 0],
            ] as const).map(([key, label, max]) => (
              <Field key={key} label={label} htmlFor={`crop-${key}`}>
                <input
                  id={`crop-${key}`}
                  type="number"
                  min={0}
                  max={max}
                  value={crop[key]}
                  disabled={!image}
                  onChange={(event) =>
                    setCrop((current) => ({
                      ...current,
                      [key]: clamp(Number(event.target.value), 0, max),
                    }))
                  }
                  className="input-mono"
                />
              </Field>
            ))}
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            <button
              type="button"
              disabled={!image}
              onClick={() => image && setCrop({ x: 0, y: 0, width: image.naturalWidth, height: image.naturalHeight })}
              className="btn-ghost !py-1.5 !text-xs"
            >
              Reset crop
            </button>
            <button
              type="button"
              disabled={!image}
              onClick={() => {
                if (!image) return
                const size = Math.min(image.naturalWidth, image.naturalHeight)
                setCrop({
                  x: Math.round((image.naturalWidth - size) / 2),
                  y: Math.round((image.naturalHeight - size) / 2),
                  width: size,
                  height: size,
                })
              }}
              className="btn-ghost !py-1.5 !text-xs"
            >
              <Scissors className="h-3.5 w-3.5" /> Center square
            </button>
          </div>
          <div className="mt-5 space-y-4">
            <FormatSelect value={format} onChange={setFormat} />
          </div>
          <button type="button" onClick={applyCrop} disabled={!image} className="btn-primary mt-5 w-full">
            <Scissors className="h-4 w-4" /> Crop image
          </button>
        </Panel>
      </div>
      <OutputPanel file={file} output={output} preview={preview} name="onev-cropped" />
    </div>
  )
}

// ------------------------------------------------------------------ Converter ---

export function ImageConverter() {
  const [file, setFile] = useState<File | null>(null)
  const { image, error } = useLoadedImage(file)
  const [format, setFormat] = useState<ImageFormat>('image/jpeg')
  const [quality, setQuality] = useState(0.9)
  const [output, setOutput] = useState<Blob | null>(null)
  const preview = useBlobPreview(output)

  useEffect(() => setOutput(null), [file, format])

  async function convert() {
    if (!image) return
    setOutput(
      await renderImage(image, {
        width: image.naturalWidth,
        height: image.naturalHeight,
        format,
        quality,
      }),
    )
  }

  return (
    <div className="grid gap-5 lg:grid-cols-2">
      <div className="space-y-5">
        <Panel title="Source image">
          <FileDrop file={file} onFile={setFile} />
          {error && <p className="mt-2 text-xs text-rose-400">{error}</p>}
          {image && (
            <div className="mt-4 flex items-center gap-3 rounded-lg border border-line/70 bg-base/50 p-3">
              <img src={image.src} alt="Source preview" className="h-16 w-16 rounded object-cover" />
              <div className="min-w-0">
                <p className="text-[13px] text-ink">{image.naturalWidth} × {image.naturalHeight} px</p>
                <p className="text-xs text-slate-500">{file?.type || 'Unknown format'}</p>
              </div>
            </div>
          )}
        </Panel>
        <Panel title="Conversion settings">
          <FormatSelect value={format} onChange={setFormat} />
          {format !== 'image/png' && <div className="mt-4"><QualitySlider value={quality} onChange={setQuality} /></div>}
          <p className="field-hint">Processing happens entirely in your browser with the Canvas API.</p>
          <button type="button" onClick={convert} disabled={!image} className="btn-primary mt-5 w-full">
            <Sparkles className="h-4 w-4" /> Convert image
          </button>
        </Panel>
      </div>
      <OutputPanel file={file} output={output} preview={preview} name="onev-converted" />
    </div>
  )
}

// ------------------------------------------------------------------ Compressor ---

export function ImageCompressor() {
  const [file, setFile] = useState<File | null>(null)
  const { image, error } = useLoadedImage(file)
  const [quality, setQuality] = useState(0.75)
  const [maxDimension, setMaxDimension] = useState(1600)
  const [format, setFormat] = useState<ImageFormat | 'original'>('original')
  const [output, setOutput] = useState<Blob | null>(null)
  const preview = useBlobPreview(output)

  useEffect(() => setOutput(null), [file, quality, maxDimension, format])

  const targetFormat: ImageFormat =
    format === 'original'
      ? file?.type === 'image/jpeg' || file?.type === 'image/webp'
        ? file.type
        : 'image/png'
      : format

  async function compress() {
    if (!image) return
    const fitted = fitWithin(
      { width: image.naturalWidth, height: image.naturalHeight },
      maxDimension,
      maxDimension,
    )
    setOutput(
      await renderImage(image, {
        ...fitted,
        format: targetFormat,
        quality,
      }),
    )
  }

  const saved = file && output ? Math.max(0, Math.round((1 - output.size / file.size) * 100)) : 0

  return (
    <div className="grid gap-5 lg:grid-cols-2">
      <div className="space-y-5">
        <Panel title="Source image">
          <FileDrop file={file} onFile={setFile} />
          {error && <p className="mt-2 text-xs text-rose-400">{error}</p>}
          {image && (
            <div className="mt-4 grid grid-cols-2 gap-2.5">
              <StatTile label="Dimensions" value={`${image.naturalWidth} × ${image.naturalHeight}`} />
              <StatTile label="File size" value={formatBytes(file?.size ?? 0)} />
            </div>
          )}
        </Panel>
        <Panel title="Compression settings">
          <div className="space-y-5">
            <QualitySlider value={quality} onChange={setQuality} />
            <Field label="Maximum dimension (px)" htmlFor="compress-max">
              <input id="compress-max" type="number" min={64} max={8000} value={maxDimension} onChange={(event) => setMaxDimension(Number(event.target.value))} className="input-mono" />
            </Field>
            <Field label="Output format">
              <Segmented
                size="sm"
                value={format}
                onChange={setFormat}
                options={[
                  { value: 'original', label: 'Original' },
                  { value: 'image/jpeg', label: 'JPG' },
                  { value: 'image/webp', label: 'WebP' },
                  { value: 'image/png', label: 'PNG' },
                ]}
              />
            </Field>
          </div>
          <button type="button" onClick={compress} disabled={!image} className="btn-primary mt-5 w-full">
            <Sparkles className="h-4 w-4" /> Compress image
          </button>
        </Panel>
      </div>
      <div className="space-y-5">
        <OutputPanel file={file} output={output} preview={preview} name="onev-compressed" />
        {output && file && (
          <Panel title="Savings">
            <div className="grid grid-cols-3 gap-2.5">
              <StatTile label="Before" value={formatBytes(file.size)} />
              <StatTile label="After" value={formatBytes(output.size)} />
              <StatTile label="Reduced" value={`${saved}%`} />
            </div>
          </Panel>
        )}
      </div>
    </div>
  )
}
