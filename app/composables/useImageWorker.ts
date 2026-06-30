/**
 * useImageWorker - Web Worker lifecycle and message handling
 *
 * Manages a single Worker instance for non-blocking image processing
 * without freezing the UI thread.
 *
 * @see D-04
 */

export interface WorkerMessage {
  type: string
  payload: any
  transferables?: Transferable[]
}

export interface UseImageWorkerReturn {
  isProcessing: Readonly<Ref<boolean>>
  postMessage: (message: WorkerMessage) => void
  terminate: () => void
}

export function useImageWorker(): UseImageWorkerReturn {
  // Early return for SSR safety (D-02)
  if (!process.client) {
    return {
      isProcessing: { value: false } as Readonly<Ref<boolean>>,
      postMessage: () => {},
      terminate: () => {},
    }
  }

  // Processing state
  const isProcessing = ref(false)

  // Worker instance (nullable for cleanup)
  let worker: Worker | null = null

  /**
   * Initialize the Worker instance
   * Uses import.meta.url pattern for Nuxt 3 compatibility
   */
  function init(): void {
    worker = new Worker(
      new URL('../workers/image-processor.worker.ts', import.meta.url),
      { type: 'module' }
    )

    // Set up message handler to track processing state
    worker.addEventListener('message', () => {
      isProcessing.value = false
    })
  }

  /**
   * Post a message to the worker with optional Transferable objects
   * @param message - The message to post
   */
  function postMessage(message: WorkerMessage): void {
    if (worker) {
      isProcessing.value = true
      worker.postMessage(message, message.transferables ?? [])
    }
  }

  /**
   * Terminate the worker and clean up resources
   */
  function terminate(): void {
    if (worker) {
      worker.terminate()
      worker = null
    }
  }

  // Initialize worker in onMounted
  onMounted(() => {
    init()
  })

  // Terminate worker in onUnmounted
  onUnmounted(() => {
    terminate()
  })

  return {
    isProcessing: readonly(isProcessing),
    postMessage,
    terminate,
  }
}
