import { useImageStore } from '../stores/useImageStore'
import { getFocalCropRect } from './useCropEngine'
import { downscaleToBase64 } from './useImageDownscale'
import type { ImportedImage } from '../types/image'

export interface AiCropOptions {
  onProgress?: (completed: number, total: number) => void
  onImageStart?: (id: string) => void
  onImageDone?: (id: string) => void
  onImageError?: (id: string, message: string) => void
}

export interface AiCropSummary {
  succeeded: number
  failed: number
}

interface AiCropResponse {
  focalX: number
  focalY: number
}

export async function runAiCrop(images: ImportedImage[], ratio: number, options: AiCropOptions = {}): Promise<AiCropSummary> {
  const imageStore = useImageStore()
  const total = images.length
  let completed = 0
  let succeeded = 0
  let failed = 0

  for (const image of images) {
    options.onImageStart?.(image.id)
    imageStore.setAiCropStatus(image.id, 'analyzing')

    try {
      const { data, mimeType } = await downscaleToBase64(image.file)
      const response = await fetch('/api/ai-crop', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: data, mimeType }),
      })

      if (!response.ok) {
        throw new Error(await messageForResponse(response))
      }

      const { focalX, focalY } = (await response.json()) as AiCropResponse
      const focalPoint = {
        x: focalX * image.naturalWidth,
        y: focalY * image.naturalHeight,
      }

      imageStore.setFocalPoint(image.id, focalPoint)
      imageStore.setCropRect(
        image.id,
        getFocalCropRect(image.naturalWidth, image.naturalHeight, ratio, focalPoint.x, focalPoint.y),
      )
      imageStore.setAiCropStatus(image.id, 'done')
      succeeded += 1
      options.onImageDone?.(image.id)
    } catch (error) {
      imageStore.setAiCropStatus(image.id, 'error')
      failed += 1
      const message = error instanceof Error ? error.message : 'AI crop '
      console.error(`AI crop failed for ${image.name}:`, error)
      options.onImageError?.(image.id, message)
    }

    completed += 1
    options.onProgress?.(completed, total)
  }

  return { succeeded, failed }
}

async function messageForResponse(response: Response): Promise<string> {
  if (response.status === 429) return 'Rate limited by Gemini — try again shortly'
  try {
    const body = (await response.json()) as { error?: string }
    if (body?.error) return body.error
  } catch {
    // fall through to generic message
  }
  return `AI crop request failed (${response.status})`
}
