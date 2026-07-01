/**
 * useThumbnail - Async thumbnail generation composable
 *
 * Uses createImageBitmap for memory-efficient image decoding,
 * canvas pool for rendering, and blob registry for URL management.
 * Thumbnails are scaled to fit within target size while maintaining aspect ratio.
 *
 * @see D-02: Thumbnail size 64x64 or 80x80
 * @see RESEARCH Pattern 2: Thumbnail Generation
 */

import type { BlobRegistry } from './useBlobRegistry'
import type { CanvasPool } from './useCanvasPool'

export interface ThumbnailResult {
  blobUrl: string
  width: number
  height: number
}

export interface UseThumbnailOptions {
  /** Target thumbnail size (default: 64) */
  size?: number
  /** Device pixel ratio for sharp thumbnails (default: devicePixelRatio or 1) */
  devicePixelRatio?: number
  /** JPEG quality for thumbnail encoding (default: 0.8) */
  quality?: number
}

const DEFAULT_SIZE = 64
const DEFAULT_QUALITY = 0.8

export function useThumbnail(options: UseThumbnailOptions = {}) {
  const {
    size = DEFAULT_SIZE,
    quality = DEFAULT_QUALITY,
  } = toRefs(options)

  /**
   * Generate a thumbnail from a File
   *
   * @param file - The image file to generate thumbnail from
   * @param targetSize - Optional override for thumbnail size
   * @returns Promise resolving to thumbnail result or null on failure
   */
  async function generateThumbnail(
    file: File,
    targetSize?: number,
  ): Promise<ThumbnailResult | null> {
    if (!process.client) return null

    const blobRegistry = useBlobRegistry()
    const canvasPool = useCanvasPool()
    const thumbnailSize = targetSize ?? size.value
    const dpr = options.devicePixelRatio ?? (typeof window !== 'undefined' ? window.devicePixelRatio : 1) ?? 1

    try {
      // Load image via createImageBitmap (better memory than new Image())
      const bitmap = await createImageBitmap(file)

      // Calculate scaled dimensions maintaining aspect ratio
      const scale = Math.min(thumbnailSize / bitmap.width, thumbnailSize / bitmap.height)
      const width = Math.round(bitmap.width * scale)
      const height = Math.round(bitmap.height * scale)

      // Acquire canvas from pool
      const canvas = canvasPool.acquire()

      // Get 2d context
      let ctx: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D | null = null

      if (canvas instanceof OffscreenCanvas) {
        ctx = canvas.getContext('2d')
      } else {
        ctx = (canvas as HTMLCanvasElement).getContext('2d')
      }

      if (!ctx) {
        canvasPool.release(canvas)
        return null
      }

      // Set canvas size (accounting for device pixel ratio)
      canvas.width = thumbnailSize * dpr
      canvas.height = thumbnailSize * dpr

      // Scale context for DPR
      ctx.scale(dpr, dpr)

      // Clear canvas
      ctx.clearRect(0, 0, thumbnailSize, thumbnailSize)

      // Calculate centering offset
      const offsetX = (thumbnailSize - width) / 2
      const offsetY = (thumbnailSize - height) / 2

      // Draw centered thumbnail
      ctx.drawImage(bitmap, offsetX, offsetY, width, height)

      // Close the bitmap to free memory
      bitmap.close()

      // Convert to blob
      const blob = await new Promise<Blob | null>((resolve) => {
        if (canvas instanceof OffscreenCanvas) {
          canvas.convertToBlob({ type: 'image/jpeg', quality: quality.value }).then(resolve)
        } else {
          (canvas as HTMLCanvasElement).toBlob(resolve, 'image/jpeg', quality.value)
        }
      })

      if (!blob) {
        canvasPool.release(canvas)
        return null
      }

      // Create blob URL and register it
      const blobUrl = blobRegistry.create(blob)

      // Release canvas back to pool
      canvasPool.release(canvas)

      return { blobUrl, width, height }
    } catch (error) {
      console.error('Thumbnail generation failed:', error)
      return null
    }
  }

  return {
    generateThumbnail,
  }
}
