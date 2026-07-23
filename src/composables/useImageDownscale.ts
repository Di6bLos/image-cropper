export interface DownscaledImage {
  data: string
  mimeType: string
}

/** Fit dimensions within `maxDimension` on the long edge, without ever upscaling. */
export function computeDownscaleDimensions(
  naturalWidth: number,
  naturalHeight: number,
  maxDimension: number,
): { width: number; height: number } {
  const longEdge = Math.max(naturalWidth, naturalHeight)
  const scale = Math.min(1, maxDimension / longEdge)
  return {
    width: Math.max(1, Math.round(naturalWidth * scale)),
    height: Math.max(1, Math.round(naturalHeight * scale)),
  }
}

/**
 * Downscales an image file to a JPEG, base64-encoded (no data-URI prefix) for upload to
 * the AI-crop API — keeps the request payload well under Vercel's serverless body limit.
 */
export async function downscaleToBase64(
  file: File,
  maxDimension = 1024,
  quality = 0.82,
): Promise<DownscaledImage> {
  const bitmap = await createImageBitmap(file)
  try {
    const { width, height } = computeDownscaleDimensions(bitmap.width, bitmap.height, maxDimension)

    const canvas = new OffscreenCanvas(width, height)
    const ctx = canvas.getContext('2d')
    if (!ctx) throw new Error('2D canvas context unavailable')

    ctx.drawImage(bitmap, 0, 0, width, height)
    const blob = await canvas.convertToBlob({ type: 'image/jpeg', quality })
    const dataUrl = await blobToDataUrl(blob)
    const data = dataUrl.slice(dataUrl.indexOf(',') + 1)

    return { data, mimeType: 'image/jpeg' }
  } finally {
    bitmap.close()
  }
}

function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = () => reject(new Error('Failed to read downscaled image'))
    reader.readAsDataURL(blob)
  })
}
