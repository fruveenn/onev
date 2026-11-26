import { downloadBlob } from './utils'

export type ImageFormat = 'image/png' | 'image/jpeg' | 'image/webp'

export interface ImageSize {
  width: number
  height: number
}

export function readImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      const image = new Image()
      image.onload = () => resolve(image)
      image.onerror = () => reject(new Error('Could not decode that image file.'))
      // A data URL stays valid for the lifetime of the element, unlike a
      // revoked object URL used by the cropper's preview.
      image.src = String(reader.result)
    }
    reader.onerror = () => reject(new Error('Could not read that image file.'))
    reader.readAsDataURL(file)
  })
}

export function fitWithin(size: ImageSize, maxWidth: number, maxHeight: number): ImageSize {
  const scale = Math.min(maxWidth / size.width, maxHeight / size.height, 1)
  return {
    width: Math.max(1, Math.round(size.width * scale)),
    height: Math.max(1, Math.round(size.height * scale)),
  }
}

export interface RenderOptions extends ImageSize {
  format: ImageFormat
  quality?: number
  background?: string
  crop?: { x: number; y: number; width: number; height: number }
}

export async function renderImage(image: HTMLImageElement, options: RenderOptions): Promise<Blob> {
  const canvas = document.createElement('canvas')
  canvas.width = Math.max(1, Math.round(options.width))
  canvas.height = Math.max(1, Math.round(options.height))
  const context = canvas.getContext('2d')
  if (!context) throw new Error('Canvas is not supported in this browser.')

  if (options.format !== 'image/png') {
    context.fillStyle = options.background || '#FFFFFF'
    context.fillRect(0, 0, canvas.width, canvas.height)
  } else {
    context.clearRect(0, 0, canvas.width, canvas.height)
  }

  const crop = options.crop ?? {
    x: 0,
    y: 0,
    width: image.naturalWidth,
    height: image.naturalHeight,
  }

  context.drawImage(
    image,
    crop.x,
    crop.y,
    crop.width,
    crop.height,
    0,
    0,
    canvas.width,
    canvas.height,
  )

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error('Could not encode the image.'))),
      options.format,
      options.quality ?? 0.9,
    )
  })
}

export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B'
  const units = ['B', 'KB', 'MB', 'GB']
  const index = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1)
  return `${(bytes / 1024 ** index).toFixed(index === 0 ? 0 : 1)} ${units[index]}`
}

export function extensionFor(format: ImageFormat): string {
  return format === 'image/jpeg' ? 'jpg' : format === 'image/webp' ? 'webp' : 'png'
}

export function saveImage(blob: Blob, baseName: string, format: ImageFormat): void {
  downloadBlob(`${baseName}.${extensionFor(format)}`, blob)
}
