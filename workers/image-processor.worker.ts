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
self.addEventListener('message', (event: MessageEvent) => {
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

    default:
      self.postMessage({ type: 'error', payload: { message: `Unknown message type: ${type}` } })
  }
})

// Export empty object to make this a module (required for ES module workers)
export {}
