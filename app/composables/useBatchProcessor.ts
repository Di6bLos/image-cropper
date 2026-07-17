/**
 * useBatchProcessor - Worker pool orchestration for batch image processing
 *
 * Maintains a pool of workers sized to navigator.hardwareConcurrency for
 * parallel image encoding without freezing the UI thread.
 *
 * @see EXPT-04: Worker pool with hardwareConcurrency sizing
 * @see EXPT-06: Per-file progress reporting
 */

import { useCanvasPool } from '~/composables/useCanvasPool'
import { useBlobRegistry } from '~/composables/useBlobRegistry'

export interface ProcessedResult {
  id: string
  blob: Blob
  filename: string
}

export interface BatchItem {
  id: string
  blobUrl: string
  filename: string
  cropX?: number
  cropY?: number
  cropWidth?: number
  cropHeight?: number
}

export interface BatchProcessorOptions {
  format?: 'jpeg' | 'png' | 'webp'
  quality?: number
  onProgress?: (current: number, total: number, filename: string) => void
  onComplete?: (results: ProcessedResult[]) => void
  onError?: (error: Error, imageId: string) => void
}

interface PendingTask {
  resolve: (result: ProcessedResult) => void
  reject: (error: Error) => void
  filename: string
}

export function useBatchProcessor() {
  // Early return for SSR safety
  if (!process.client) {
    return {
      processBatch: () => Promise.resolve([]),
      terminate: () => {},
    }
  }

  const canvasPool = useCanvasPool()
  const blobRegistry = useBlobRegistry()

  // Worker pool sized to hardware concurrency
  const poolSize = Math.max(2, navigator.hardwareConcurrency ?? 2)
  const workers: Worker[] = []
  const workerLoads: number[] = []

  // Pending tasks for each worker
  const pendingTasks: Map<Worker, PendingTask[]> = new Map()

  // All completed results
  const results: ProcessedResult[] = []

  // Pool initialization flag
  let isInitialized = false

  /**
   * Initialize the worker pool
   */
  function initPool(): void {
    if (isInitialized) return

    for (let i = 0; i < poolSize; i++) {
      const worker = new Worker(
        new URL('../workers/image-processor.worker.ts', import.meta.url),
        { type: 'module' }
      )

      worker.addEventListener('message', createMessageHandler(worker))
      workers.push(worker)
      workerLoads.push(0)
      pendingTasks.set(worker, [])
    }

    isInitialized = true
  }

  /**
   * Route worker responses to the correct pending task
   */
  function createMessageHandler(worker: Worker) {
    return (event: MessageEvent) => {
      const { type, payload } = event.data

      if (type === 'encoded') {
        const pending = pendingTasks.get(worker)
        if (!pending || pending.length === 0) return

        const task = pending.shift()!
        workerLoads[workers.indexOf(worker)] = Math.max(0, workerLoads[workers.indexOf(worker)] - 1)

        if (payload.error) {
          task.reject(new Error(payload.error))
        } else {
          const result: ProcessedResult = {
            id: payload.id,
            blob: payload.blob,
            filename: task.filename,
          }
          results.push(result)
          task.resolve(result)
        }
      }
    }
  }

  /**
   * Find the worker with the smallest current load (round-robin)
   */
  function selectWorker(): Worker {
    let minLoad = Infinity
    let selectedIdx = 0

    for (let i = 0; i < workers.length; i++) {
      if (workerLoads[i] < minLoad) {
        minLoad = workerLoads[i]
        selectedIdx = i
      }
    }

    return workers[selectedIdx]
  }

  /**
   * Process a batch of images with progress reporting
   */
  async function processBatch(
    items: BatchItem[],
    options: BatchProcessorOptions
  ): Promise<ProcessedResult[]> {
    initPool()

    const total = items.length
    results.length = 0

    // Create deferred promises for each item
    const promises = items.map((item) => {
      return new Promise<ProcessedResult>((resolve, reject) => {
        const worker = selectWorker()
        const idx = workers.indexOf(worker)

        // Track pending task
        const pending = pendingTasks.get(worker)!
        pending.push({ resolve, reject, filename: item.filename })
        workerLoads[idx]++

        // Create ImageBitmap and transfer to worker
        fetch(item.blobUrl)
          .then((res) => res.blob())
          .then((blob) => createImageBitmap(blob))
          .then((bitmap) => {
            // Build crop payload if crop params are provided
            const crop = (item.cropX !== undefined)
              ? { x: item.cropX, y: item.cropY, width: item.cropWidth, height: item.cropHeight }
              : undefined

            worker.postMessage(
              {
                type: 'batchEncode',
                payload: {
                  id: item.id,
                  filename: item.filename,
                  crop,
                  format: options.format || 'jpeg',
                  quality: options.quality || 90,
                },
                transferables: [bitmap],
              },
              [bitmap]
            )

            // Report progress after dispatch
            const current = results.length + pending.length
            options.onProgress?.(current, total, item.filename)
          })
          .catch((err) => {
            // Remove from pending if fetch/createImageBitmap failed
            const p = pendingTasks.get(worker)!
            const taskIdx = p.findIndex((t) => t.filename === item.filename)
            if (taskIdx !== -1) {
              p.splice(taskIdx, 1)
              workerLoads[idx] = Math.max(0, workerLoads[idx] - 1)
            }
            reject(err)
          })
      })
    })

    try {
      const allResults = await Promise.all(promises)
      options.onComplete?.(allResults)
      return allResults
    } catch (err) {
      if (err instanceof Error) {
        options.onError?.(err, 'batch')
      }
      throw err
    }
  }

  /**
   * Terminate all workers and clean up
   */
  function terminate(): void {
    workers.forEach((w) => w.terminate())
    workers.length = 0
    workerLoads.length = 0
    pendingTasks.clear()
    results.length = 0
    isInitialized = false
  }

  return {
    processBatch,
    terminate,
  }
}
