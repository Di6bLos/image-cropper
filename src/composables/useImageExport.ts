import type { ImportedImage } from '../types/image'
import type { OutputFormat } from '../types/export'
import { sanitizeFilename, extensionForFormat } from './useFilenameSanitize'

export interface ExportOptions {
  format: OutputFormat
  quality: number
  outputSize: { width: number; height: number } | null
  onProgress?: (completed: number, total: number) => void
  onImageStart?: (id: string) => void
  onImageDone?: (id: string) => void
  onImageError?: (id: string) => void
}

export interface ExportedFile {
  name: string
  blob: Blob
}

/** True when the crop rect trims the image rather than covering it in full. */
export function isCropped(
  cropRect: { x: number; y: number; width: number; height: number },
  naturalWidth: number,
  naturalHeight: number,
): boolean {
  const epsilon = 1
  return (
    cropRect.x > epsilon ||
    cropRect.y > epsilon ||
    cropRect.width < naturalWidth - epsilon ||
    cropRect.height < naturalHeight - epsilon
  )
}

export function resolveTargetSize(
  cropRect: { width: number; height: number },
  outputSize: { width: number; height: number } | null,
): { width: number; height: number } | null {
  if (!outputSize) return null
  const targetAspect = outputSize.width / outputSize.height
  // Compare in pixels, not as a relative aspect difference: a percentage tolerance scales with
  // the crop, so a large hand-resized crop could still be stretched to the target shape. Only
  // sub-pixel geometry noise (the crop is exactly this shape, up to rounding) is accepted.
  if (Math.abs(cropRect.width / targetAspect - cropRect.height) > 1) return null
  return { width: outputSize.width, height: outputSize.height }
}

export async function exportImages(images: ImportedImage[], options: ExportOptions): Promise<ExportedFile[]> {
  const worker = new Worker(new URL('../workers/export.worker.ts', import.meta.url), { type: 'module' })
  const results: ExportedFile[] = []
  const total = images.length
  let completed = 0

  try {
    for (const image of images) {
      if (!image.cropRect) {
        completed += 1
        options.onProgress?.(completed, total)
        continue
      }

      options.onImageStart?.(image.id)
      try {
        const bitmap = await createImageBitmap(image.file)
        // Reactive Pinia state can't survive structuredClone for postMessage — copy to plain objects.
        const cropRect = {
          x: image.cropRect.x,
          y: image.cropRect.y,
          width: image.cropRect.width,
          height: image.cropRect.height,
        }
        const targetSize = resolveTargetSize(cropRect, options.outputSize)
        const blob = await runExportJob(worker, {
          id: image.id,
          bitmap,
          cropRect,
          targetSize,
          format: options.format,
          quality: options.quality,
        })
        const suffix = isCropped(cropRect, image.naturalWidth, image.naturalHeight) ? '_cropped' : ''
        results.push({
          // Sanitize `file.name`, not the display `name`: PDF page names carry no extension, so
          // `sanitizeFilename` would read the last dotted segment of e.g. "q3.2024.final-p1" as
          // one and drop the page suffix. `file.name` always ends in a real extension.
          name: `${sanitizeFilename(image.file.name)}${suffix}.${extensionForFormat(options.format)}`,
          blob,
        })
        options.onImageDone?.(image.id)
      } catch (error) {
        console.error(`Failed to export ${image.name}:`, error)
        options.onImageError?.(image.id)
      }

      completed += 1
      options.onProgress?.(completed, total)
    }
  } finally {
    worker.terminate()
  }

  return results
}

interface WorkerJob {
  id: string
  bitmap: ImageBitmap
  cropRect: { x: number; y: number; width: number; height: number }
  targetSize: { width: number; height: number } | null
  format: OutputFormat
  quality: number
}

export interface ExportSizeOptions {
  format: OutputFormat
  quality: number
  outputSize: { width: number; height: number } | null
}

let previewRequestCounter = 0

/**
 * Runs a single encode job and returns only its byte size, reusing the exact same worker/encode
 * path as a real export so the estimate can never disagree with the actual algorithm. The job id
 * must be unique per call (not `image.id`) — callers may reuse one persistent worker across many
 * debounced calls, and if a stale in-flight job shared its id with a fresh one for the same
 * image, `runExportJob`'s id-matching would let the first response resolve both promises.
 */
export async function estimateExportSize(
  image: ImportedImage,
  options: ExportSizeOptions,
  worker: Worker,
): Promise<number | null> {
  if (!image.cropRect) return null

  const bitmap = await createImageBitmap(image.file)
  const cropRect = {
    x: image.cropRect.x,
    y: image.cropRect.y,
    width: image.cropRect.width,
    height: image.cropRect.height,
  }
  const targetSize = resolveTargetSize(cropRect, options.outputSize)

  const blob = await runExportJob(worker, {
    id: `preview-${image.id}-${++previewRequestCounter}`,
    bitmap,
    cropRect,
    targetSize,
    format: options.format,
    quality: options.quality,
  })
  return blob.size
}

function runExportJob(worker: Worker, job: WorkerJob): Promise<Blob> {
  return new Promise((resolve, reject) => {
    function handleMessage(event: MessageEvent) {
      if (event.data?.id !== job.id) return
      worker.removeEventListener('message', handleMessage)
      if (event.data.error) {
        reject(new Error(event.data.error))
      } else {
        resolve(event.data.blob as Blob)
      }
    }
    worker.addEventListener('message', handleMessage)
    worker.postMessage(job, [job.bitmap])
  })
}
