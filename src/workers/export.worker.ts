import { encode as encodeWebp } from '@jsquash/webp'
import { encode as encodeJpeg } from '@jsquash/jpeg'
import type { OutputFormat } from '../types/export'
import { chooseEncodeStrategy } from './encodeStrategy'

export interface ExportJob {
  id: string
  bitmap: ImageBitmap
  cropRect: { x: number; y: number; width: number; height: number }
  targetSize: { width: number; height: number } | null
  format: OutputFormat
  quality: number
}

async function encodeCanvas(
  canvas: OffscreenCanvas,
  ctx: OffscreenCanvasRenderingContext2D,
  format: OutputFormat,
  quality: number,
): Promise<Blob> {
  const strategy = chooseEncodeStrategy(format, quality)
  if (strategy === 'native') {
    return canvas.convertToBlob({ type: format, quality })
  }

  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
  const jsquashQuality = Math.round(quality * 100)
  const buffer =
    strategy === 'jsquash-webp'
      ? await encodeWebp(imageData, { quality: jsquashQuality })
      : await encodeJpeg(imageData, { quality: jsquashQuality })
  return new Blob([buffer], { type: format })
}

self.onmessage = async (event: MessageEvent<ExportJob>) => {
  const { id, bitmap, cropRect, targetSize, format, quality } = event.data
  const outWidth = targetSize?.width ?? Math.round(cropRect.width)
  const outHeight = targetSize?.height ?? Math.round(cropRect.height)

  try {
    const canvas = new OffscreenCanvas(outWidth, outHeight)
    const ctx = canvas.getContext('2d')
    if (!ctx) throw new Error('2D canvas context unavailable in worker')

    ctx.drawImage(bitmap, cropRect.x, cropRect.y, cropRect.width, cropRect.height, 0, 0, outWidth, outHeight)
    bitmap.close()

    const blob = await encodeCanvas(canvas, ctx, format, quality)
    self.postMessage({ id, blob })
  } catch (error) {
    self.postMessage({ id, error: error instanceof Error ? error.message : 'Export failed' })
  }
}
