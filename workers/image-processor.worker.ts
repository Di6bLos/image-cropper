/**
 * Image Processor Worker
 *
 * Handles image processing operations off the main thread to prevent UI freezing.
 * Uses postMessage with ImageBitmap transferables for efficient memory transfer.
 *
 * Communication Pattern:
 * - Main thread sends messages via: worker.postMessage(message, [transferables])
 * - Worker receives via: self.addEventListener('message', (event) => { ... })
 * - ImageBitmap objects are Transferable - ownership transfers to worker
 *
 * @see D-04
 */

// Log on initialization so Phase 1 verification can confirm worker loads
console.log('[ImageProcessorWorker] Initialized and ready')

/**
 * Handle incoming messages from the main thread
 * @param event - The message event containing data and transferables
 */
self.addEventListener('message', async (event: MessageEvent) => {
  const { type, payload, transferables } = event.data

  switch (type) {
    case 'init':
    case 'ping':
      // Respond to ping/init messages for worker health checks
      self.postMessage({ type: 'pong', payload: { alive: true } })
      break

    case 'processImage':
      // Example ImageBitmap handling pattern:
      // The ImageBitmap is transferred via the transferables array
      // After using drawImage(), call bitmap.close() to release GPU memory
      if (event.data.bitmap) {
        const bitmap: ImageBitmap = event.data.bitmap

        // Process the image (example structure)
        // const ctx = new OffscreenCanvas(bitmap.width, bitmap.height).getContext('2d')
        // ctx.drawImage(bitmap, 0, 0)
        // bitmap.close() // CRITICAL: Release GPU memory after drawImage

        self.postMessage({ type: 'processed', payload: { success: true } })
      }
      break

    case 'batchEncode':
      // Encode an image with optional crop region and format/quality settings
      // bitmap is transferred via transferables
      if (event.data.bitmap) {
        const bitmap: ImageBitmap = event.data.bitmap
        const { id, filename, crop, format, quality } = event.data.payload
        const outFormat = format || 'jpeg'
        const outQuality = quality || 90

        try {
          // Determine source crop region
          const srcX = crop ? crop.x : 0
          const srcY = crop ? crop.y : 0
          const srcW = crop ? crop.width : bitmap.width
          const srcH = crop ? crop.height : bitmap.height

          // Create canvas sized to crop region
          const canvas = new OffscreenCanvas(srcW, srcH)
          const ctx = canvas.getContext('2d')
          ctx.drawImage(bitmap, srcX, srcY, srcW, srcH, 0, 0, srcW, srcH)

          // Encode to blob based on format
          const blob = await canvas.convertToBlob({
            type: outFormat === 'png' ? 'image/png' : outFormat === 'webp' ? 'image/webp' : 'image/jpeg',
            quality: outQuality / 100,
          })

          // Blob is not transferable — send without transfer list
          self.postMessage({ type: 'encoded', payload: { id, filename, blob } })
        } catch (err) {
          self.postMessage({ type: 'encoded', payload: { id, filename, error: String(err) } })
        } finally {
          // CRITICAL: Release GPU memory regardless of success or failure
          bitmap.close()
        }
      }
      break

    default:
      self.postMessage({ type: 'error', payload: { message: `Unknown message type: ${type}` } })
  }
})

// Export empty object to make this a module (required for ES module workers)
export {}
