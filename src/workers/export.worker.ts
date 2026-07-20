export interface ExportJob {
  id: string
  bitmap: ImageBitmap
  cropRect: { x: number; y: number; width: number; height: number }
  targetSize: { width: number; height: number } | null
  format: string
  quality: number
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

    const blob = await canvas.convertToBlob({ type: format, quality })
    self.postMessage({ id, blob })
  } catch (error) {
    self.postMessage({ id, error: error instanceof Error ? error.message : 'Export failed' })
  }
}
