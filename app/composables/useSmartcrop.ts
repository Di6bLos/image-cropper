/**
 * useSmartcrop - Smartcrop.js CDN loader and AI-powered crop detection
 *
 * Lazy-loads Smartcrop.js from CDN on first use. Provides detectCrop()
 * which runs subject detection in a Web Worker to avoid UI freezes.
 *
 * @see AIDT-01, AIDT-02, AIDT-03, AIDT-04, AIDT-05
 */

import { useImageWorker } from './useImageWorker'

// Smartcrop.js type declaration
declare const smartcrop: {
  crop: (
    canvas: OffscreenCanvas,
    options: { width: number; height: number; ruleOfThirds: boolean }
  ) => Promise<{ topCrop: { x: number; y: number; width: number; height: number } }>
}

const SMARTGRCP_CDN_URL = 'https://cdn.jsdelivr.net/npm/smartcrop@2.0.5/smartcrop.min.js'

interface DetectCropResult {
  x: number
  y: number
  width: number
  height: number
}

interface AIDetectResult {
  success: boolean
  crop?: DetectCropResult
  error?: string
}

let smartcropLoaded = false

/**
 * Load Smartcrop.js from CDN (singleton, idempotent)
 */
async function loadSmartcropFromCDN(): Promise<void> {
  if (!process.client) return
  if (smartcropLoaded) return

  return new Promise((resolve, reject) => {
    // Check if already loaded via previous call
    if (typeof smartcrop !== 'undefined') {
      smartcropLoaded = true
      resolve()
      return
    }

    const script = document.createElement('script')
    script.src = SMARTGRCP_CDN_URL
    script.onload = () => {
      smartcropLoaded = true
      resolve()
    }
    script.onerror = () => reject(new Error('Failed to load Smartcrop.js from CDN'))
    document.head.appendChild(script)
  })
}

/**
 * Calculate center-crop in image pixel coordinates
 */
function calculateCenterCrop(
  imageWidth: number,
  imageHeight: number,
  targetWidth: number,
  targetHeight: number
): DetectCropResult {
  // Scale target dimensions to image pixel space
  // We use the image's natural dimensions as reference
  const scaleX = imageWidth / targetWidth
  const scaleY = imageHeight / targetHeight

  // Determine crop dimensions that fill the target while maintaining aspect ratio
  const imageAspect = imageWidth / imageHeight
  const targetAspect = targetWidth / targetHeight

  let cropWidth: number
  let cropHeight: number

  if (imageAspect > targetAspect) {
    // Image is wider — crop width to target, crop height proportionally
    cropHeight = imageHeight
    cropWidth = cropHeight * targetAspect
  } else {
    // Image is taller — crop height to target, crop width proportionally
    cropWidth = imageWidth
    cropHeight = cropWidth / targetAspect
  }

  // Center the crop window
  const x = (imageWidth - cropWidth) / 2
  const y = (imageHeight - cropHeight) / 2

  return { x, y, width: cropWidth, height: cropHeight }
}

/**
 * Detect optimal crop using Smartcrop.js
 *
 * @param imageUrl - Blob URL of the selected image
 * @param targetWidth - Desired crop width in pixels (from crop window)
 * @param targetHeight - Desired crop height in pixels (from crop window)
 * @param imageWidth - Original image width
 * @param imageHeight - Original image height
 */
export async function detectCrop(
  imageUrl: string,
  targetWidth: number,
  targetHeight: number,
  imageWidth: number,
  imageHeight: number
): Promise<DetectCropResult> {
  if (!process.client) {
    return calculateCenterCrop(imageWidth, imageHeight, targetWidth, targetHeight)
  }

  // Ensure Smartcrop.js is loaded
  await loadSmartcropFromCDN()

  try {
    // Fetch image and create ImageBitmap
    const response = await fetch(imageUrl)
    const blob = await response.blob()
    const bitmap = await createImageBitmap(blob)

    // Use worker for AI detection
    const { postMessage } = useImageWorker()

    return new Promise((resolve, reject) => {
      // Build a one-time message handler
      const timeout = setTimeout(() => {
        reject(new Error('AI detection timed out'))
      }, 15000)

      // We need to handle the response via the image worker's message handler
      // Since useImageWorker doesn't expose the onMessage callback, we'll use
      // a direct approach with a dedicated worker instance for this call
      const worker = new Worker(
        new URL('../workers/image-processor.worker.ts', import.meta.url),
        { type: 'module' }
      )

      worker.addEventListener('message', (event) => {
        const msg = event.data as { type: string; payload: AIDetectResult }
        if (msg.type === 'aiDetectResult') {
          clearTimeout(timeout)
          worker.terminate()
          if (msg.payload.success && msg.payload.crop) {
            // Scale crop coordinates from the canvas space to image pixel space
            const scaleX = imageWidth / bitmap.width
            const scaleY = imageHeight / bitmap.height
            resolve({
              x: msg.payload.crop.x * scaleX,
              y: msg.payload.crop.y * scaleY,
              width: msg.payload.crop.width * scaleX,
              height: msg.payload.crop.height * scaleY,
            })
          } else {
            reject(new Error(msg.payload.error || 'AI detection failed'))
          }
        }
      })

      // Transfer bitmap to worker for processing
      worker.postMessage(
        {
          type: 'aiDetect',
          payload: { bitmap, targetWidth, targetHeight },
          transferables: [bitmap],
        },
        [bitmap]
      )
    })
  } catch {
    // Fallback to center-crop on any error
    return calculateCenterCrop(imageWidth, imageHeight, targetWidth, targetHeight)
  }
}

export function useSmartcrop() {
  return { detectCrop, loadSmartcropFromCDN }
}
