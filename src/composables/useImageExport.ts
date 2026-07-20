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
        const targetSize = options.outputSize
          ? { width: options.outputSize.width, height: options.outputSize.height }
          : null
        const blob = await runExportJob(worker, {
          id: image.id,
          bitmap,
          cropRect,
          targetSize,
          format: options.format,
          quality: options.quality,
        })
        results.push({
          name: `${sanitizeFilename(image.name)}.${extensionForFormat(options.format)}`,
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
  format: string
  quality: number
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
