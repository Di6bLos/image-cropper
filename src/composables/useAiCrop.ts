import { useImageStore } from '../stores/useImageStore'
import { getFocalCropRect } from './useCropEngine'
import { downscaleToBase64 } from './useImageDownscale'
import { createRateLimiter } from '../lib/rateLimiter'
import type { ImportedImage } from '../types/image'

/** Gemini call cap: 5 requests per rolling 60 seconds. */
const AI_CROP_MAX_PER_MINUTE = 5
const AI_CROP_WINDOW_MS = 60_000
/** Backoff for a slipped 429: 1s, 2s, 4s across up to 3 retries. */
const AI_CROP_MAX_RETRIES = 3
const AI_CROP_BACKOFF_BASE_MS = 1000
const sleep = (ms: number): Promise<void> => new Promise((resolve) => setTimeout(resolve, ms))

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
  const limiter = createRateLimiter(AI_CROP_MAX_PER_MINUTE, AI_CROP_WINDOW_MS)
  const total = images.length
  let completed = 0
  let succeeded = 0
  let failed = 0

  for (const image of images) {
    options.onImageStart?.(image.id)
    imageStore.setAiCropStatus(image.id, 'analyzing')

    try {
      const { data, mimeType } = await downscaleToBase64(image.file)
      const { focalX, focalY } = await fetchFocalPoint(limiter, data, mimeType)
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

/**
 * Acquires a rate-limit slot, then POSTs the downscaled image to /api/ai-crop.
 * On a 429 (Gemini upstream rate limit) retries with exponential backoff,
 * re-acquiring a slot before each attempt. Other non-ok responses throw the
 * server-supplied message.
 */
async function fetchFocalPoint(limiter: { acquire: () => Promise<void> }, data: string, mimeType: string): Promise<AiCropResponse> {
  let attempt = 0
  for (;;) {
    await limiter.acquire()
    const response = await fetch('/api/ai-crop', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ image: data, mimeType }),
    })

    if (response.status === 429) {
      if (attempt >= AI_CROP_MAX_RETRIES) {
        throw new Error('Rate limited by Gemini — try again shortly')
      }
      await sleep(AI_CROP_BACKOFF_BASE_MS * 2 ** attempt)
      attempt += 1
      continue
    }

    if (!response.ok) {
      throw new Error(await messageForResponse(response))
    }

    return (await response.json()) as AiCropResponse
  }
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
