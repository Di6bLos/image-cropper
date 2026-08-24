import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { defineComponent } from 'vue'
import { mount } from '@vue/test-utils'
import { useSinglePreviewSize, useBatchPreviewSize } from '../../src/composables/useExportPreview'
import { estimateExportSize } from '../../src/composables/useImageExport'
import type { ImportedImage } from '../../src/types/image'
import type { ExportSizeOptions } from '../../src/composables/useImageExport'

vi.mock('../../src/composables/useImageExport', () => ({
  estimateExportSize: vi.fn(),
}))

class FakeWorker {
  terminate() {}
}

const estimateMock = vi.mocked(estimateExportSize)

function makeImage(id: string): ImportedImage {
  return {
    id,
    file: new File([], `${id}.png`),
    name: `${id}.png`,
    url: `blob:${id}`,
    naturalWidth: 100,
    naturalHeight: 100,
    cropRect: { x: 0, y: 0, width: 100, height: 100 },
    status: 'ready',
    focalPoint: null,
    aiCropStatus: 'idle',
  }
}

function mountComposable<T>(useFn: () => T): T {
  let result!: T
  mount(
    defineComponent({
      setup() {
        result = useFn()
        return {}
      },
      template: '<div />',
    }),
  )
  return result
}

const options: ExportSizeOptions = { format: 'image/webp', quality: 0.8, outputSize: null }

describe('useSinglePreviewSize', () => {
  beforeEach(() => {
    vi.stubGlobal('Worker', FakeWorker)
    vi.useFakeTimers()
    estimateMock.mockReset()
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.unstubAllGlobals()
  })

  it('short-circuits to null without calling the estimator when there is no cropRect', () => {
    const preview = mountComposable(useSinglePreviewSize)
    preview.schedule({ ...makeImage('a'), cropRect: null }, options)

    expect(preview.sizeBytes.value).toBeNull()
    expect(preview.isCalculating.value).toBe(false)
    expect(estimateMock).not.toHaveBeenCalled()
  })

  it('debounces rapid schedule calls into a single estimate', async () => {
    estimateMock.mockResolvedValue(1234)
    const preview = mountComposable(useSinglePreviewSize)
    const image = makeImage('a')

    preview.schedule(image, options)
    preview.schedule(image, options)
    preview.schedule(image, options)
    expect(preview.isCalculating.value).toBe(true)

    await vi.advanceTimersByTimeAsync(300)

    expect(estimateMock).toHaveBeenCalledTimes(1)
    expect(preview.sizeBytes.value).toBe(1234)
    expect(preview.isCalculating.value).toBe(false)
  })

  it('discards a stale result when superseded by a newer schedule before it resolves', async () => {
    const image = makeImage('a')
    let resolveFirst!: (value: number) => void
    let resolveSecond!: (value: number) => void
    estimateMock
      .mockImplementationOnce(() => new Promise((resolve) => (resolveFirst = resolve)))
      .mockImplementationOnce(() => new Promise((resolve) => (resolveSecond = resolve)))

    const preview = mountComposable(useSinglePreviewSize)

    preview.schedule(image, options)
    await vi.advanceTimersByTimeAsync(300)
    expect(estimateMock).toHaveBeenCalledTimes(1)

    // A second schedule fires before the first (in-flight) estimate resolves.
    preview.schedule(image, options)
    await vi.advanceTimersByTimeAsync(300)
    expect(estimateMock).toHaveBeenCalledTimes(2)

    // The first request resolves last — it must not clobber the newer result.
    resolveFirst(111)
    await Promise.resolve()
    resolveSecond(222)
    await Promise.resolve()

    expect(preview.sizeBytes.value).toBe(222)
  })
})

describe('useBatchPreviewSize', () => {
  beforeEach(() => {
    vi.stubGlobal('Worker', FakeWorker)
    vi.useFakeTimers()
    estimateMock.mockReset()
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.unstubAllGlobals()
  })

  it('short-circuits to null without calling the estimator for an empty batch', () => {
    const preview = mountComposable(useBatchPreviewSize)
    preview.schedule([], options)

    expect(preview.totalBytes.value).toBeNull()
    expect(estimateMock).not.toHaveBeenCalled()
  })

  it('sums estimates across all images after the debounce window', async () => {
    estimateMock.mockResolvedValueOnce(100).mockResolvedValueOnce(200)
    const preview = mountComposable(useBatchPreviewSize)

    preview.schedule([makeImage('a'), makeImage('b')], options)
    expect(preview.isCalculating.value).toBe(true)

    await vi.advanceTimersByTimeAsync(300)

    expect(preview.totalBytes.value).toBe(300)
    expect(preview.isCalculating.value).toBe(false)
  })
})
