import { onBeforeUnmount, ref, shallowRef } from 'vue'
import type { ImportedImage } from '../types/image'
import { estimateExportSize, type ExportSizeOptions } from './useImageExport'

const DEBOUNCE_MS = 300

function usePreviewWorker() {
  let worker: Worker | null = null
  let timer: ReturnType<typeof setTimeout> | undefined
  let generation = 0

  function ensureWorker(): Worker {
    worker ??= new Worker(new URL('../workers/export.worker.ts', import.meta.url), { type: 'module' })
    return worker
  }

  function nextGeneration(): { id: number; isStale: () => boolean } {
    generation += 1
    const id = generation
    clearTimeout(timer)
    return { id, isStale: () => id !== generation }
  }

  function debounce(run: () => void) {
    timer = setTimeout(run, DEBOUNCE_MS)
  }

  function dispose() {
    clearTimeout(timer)
    worker?.terminate()
    worker = null
  }

  onBeforeUnmount(dispose)
  return { ensureWorker, nextGeneration, debounce, dispose }
}

export function useSinglePreviewSize() {
  const sizeBytes = shallowRef<number | null>(null)
  const isCalculating = ref(false)
  const { ensureWorker, nextGeneration, debounce } = usePreviewWorker()

  function schedule(image: ImportedImage | null, options: ExportSizeOptions) {
    const { isStale } = nextGeneration()

    if (!image?.cropRect) {
      sizeBytes.value = null
      isCalculating.value = false
      return
    }

    isCalculating.value = true
    debounce(async () => {
      if (isStale()) return
      try {
        const size = await estimateExportSize(image, options, ensureWorker())
        if (!isStale()) sizeBytes.value = size
      } catch {
        if (!isStale()) sizeBytes.value = null
      } finally {
        if (!isStale()) isCalculating.value = false
      }
    })
  }

  return { sizeBytes, isCalculating, schedule }
}

export function useBatchPreviewSize() {
  const totalBytes = shallowRef<number | null>(null)
  const isCalculating = ref(false)
  const { ensureWorker, nextGeneration, debounce } = usePreviewWorker()

  function schedule(images: ImportedImage[], options: ExportSizeOptions) {
    const { isStale } = nextGeneration()

    if (!images.length) {
      totalBytes.value = null
      isCalculating.value = false
      return
    }

    isCalculating.value = true
    debounce(async () => {
      if (isStale()) return
      const worker = ensureWorker()
      let sum = 0
      for (const image of images) {
        if (isStale()) return
        try {
          sum += (await estimateExportSize(image, options, worker)) ?? 0
        } catch {
          // best-effort estimate — skip images that fail to encode
        }
      }
      if (isStale()) return
      totalBytes.value = sum
      isCalculating.value = false
    })
  }

  return { totalBytes, isCalculating, schedule }
}
