/**
 * useCanvasPool - Canvas element pooling for batch operations
 *
 * Pre-allocates a pool of canvas elements to prevent resource exhaustion
 * during batch image processing operations.
 *
 * @see D-06
 */

interface CanvasPool {
  acquire: () => OffscreenCanvas | HTMLCanvasElement
  release: (canvas: OffscreenCanvas | HTMLCanvasElement) => void
  dispose: () => void
}

// Canvas dimensions sufficient for image processing
const CANVAS_WIDTH = 4096
const CANVAS_HEIGHT = 4096

export function useCanvasPool(): CanvasPool {
  // Early return for SSR safety (D-02)
  if (!process.client) {
    return {
      acquire: () => createCanvas(),
      release: () => {},
      dispose: () => {},
    }
  }

  // Pool size based on hardware concurrency (D-06)
  const poolSize = Math.max(2, navigator.hardwareConcurrency ?? 2)
  const pool: (OffscreenCanvas | HTMLCanvasElement)[] = []

  /**
   * Create a canvas element (OffscreenCanvas if available, fallback to HTMLCanvasElement)
   * @returns Created canvas
   */
  function createCanvas(): OffscreenCanvas | HTMLCanvasElement {
    // Check for OffscreenCanvas availability (Safari fallback per RESEARCH.md)
    if (typeof OffscreenCanvas !== 'undefined') {
      return new OffscreenCanvas(CANVAS_WIDTH, CANVAS_HEIGHT)
    }
    const canvas = document.createElement('canvas')
    canvas.width = CANVAS_WIDTH
    canvas.height = CANVAS_HEIGHT
    return canvas
  }

  /**
   * Acquire a canvas from the pool (or create one if pool is empty)
   * @returns Available canvas element
   */
  function acquire(): OffscreenCanvas | HTMLCanvasElement {
    if (pool.length > 0) {
      return pool.pop()!
    }
    // Lazy creation if pool is exhausted
    return createCanvas()
  }

  /**
   * Release a canvas back to the pool (if below poolSize limit)
   * @param canvas - The canvas to release
   */
  function release(canvas: OffscreenCanvas | HTMLCanvasElement): void {
    if (pool.length < poolSize) {
      pool.push(canvas)
    }
  }

  /**
   * Dispose of all canvases in the pool
   */
  function dispose(): void {
    pool.length = 0
  }

  // Auto-dispose on component unmount
  onUnmounted(() => {
    dispose()
  })

  return {
    acquire,
    release,
    dispose,
  }
}
