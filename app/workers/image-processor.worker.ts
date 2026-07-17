/**
 * image-processor.worker - Web Worker for off-main-thread image processing
 *
 * Handles CPU-intensive operations:
 * - AI subject detection via Smartcrop.js
 *
 * Smartcrop.js is loaded via importScripts from CDN to avoid bundling.
 *
 * @see AIDT-02, AIDT-05
 */

// Smartcrop.js type declaration for worker scope
declare function importScripts(...urls: string[]): void

interface AIResult {
  x: number
  y: number
  width: number
  height: number
}

self.addEventListener('message', async (event: MessageEvent) => {
  const { type, payload } = event.data

  switch (type) {
    case 'aiDetect': {
      const { bitmap, targetWidth, targetHeight } = payload as {
        bitmap: ImageBitmap
        targetWidth: number
        targetHeight: number
      }

      try {
        // Load Smartcrop.js in worker scope via importScripts
        if (typeof (self as any).smartcrop === 'undefined') {
          importScripts('https://cdn.jsdelivr.net/npm/smartcrop@2.0.5/smartcrop.min.js')
        }

        // Draw bitmap to OffscreenCanvas
        const canvas = new OffscreenCanvas(bitmap.width, bitmap.height)
        const ctx = canvas.getContext('2d')!
        ctx.drawImage(bitmap, 0, 0)

        // Release bitmap memory immediately after drawing
        bitmap.close()

        // Run Smartcrop.js analysis
        const result: { topCrop: AIResult } = await (self as any).smartcrop.crop(canvas, {
          width: targetWidth,
          height: targetHeight,
          ruleOfThirds: true,
        })

        self.postMessage({
          type: 'aiDetectResult',
          payload: { success: true, crop: result.topCrop },
        })
      } catch (err) {
        self.postMessage({
          type: 'aiDetectResult',
          payload: { success: false, error: String(err) },
        })
      }
      break
    }

    default:
      // Unknown message type — ignore
      break
  }
})
