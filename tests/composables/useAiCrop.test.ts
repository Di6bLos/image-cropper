import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { runAiCrop } from '../../src/composables/useAiCrop'
import type { ImportedImage } from '../../src/types/image'

const { storeStubs } = vi.hoisted(() => {
  const storeStubs = {
    setAiCropStatus: vi.fn(),
    setFocalPoint: vi.fn(),
    setCropRect: vi.fn(),
  }
  return { storeStubs }
})

vi.mock('../../src/stores/useImageStore', () => ({
  useImageStore: () => storeStubs,
}))

vi.mock('../../src/composables/useImageDownscale', () => ({
  downscaleToBase64: vi.fn(async () => ({ data: 'base64data', mimeType: 'image/jpeg' })),
}))

function makeImage(id: string): ImportedImage {
  return {
    id,
    file: new File([], `${id}.jpg`),
    name: `${id}.jpg`,
    url: '',
    naturalWidth: 1000,
    naturalHeight: 500,
    cropRect: null,
    status: 'ready',
    focalPoint: null,
    aiCropStatus: 'idle',
  }
}

function okResponse(focalX = 0.5, focalY = 0.5): Response {
  return new Response(JSON.stringify({ focalX, focalY }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  })
}

function rateLimitedResponse(): Response {
  return new Response(JSON.stringify({ error: 'rate' }), {
    status: 429,
    headers: { 'Content-Type': 'application/json' },
  })
}

describe('runAiCrop', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    storeStubs.setAiCropStatus.mockClear()
    storeStubs.setFocalPoint.mockClear()
    storeStubs.setCropRect.mockClear()
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.restoreAllMocks()
  })

  it('applies a focal point per image when every call succeeds', async () => {
    const fetchMock = vi.fn().mockImplementation(() => Promise.resolve(okResponse()))
    vi.stubGlobal('fetch', fetchMock)

    const images = [makeImage('a'), makeImage('b'), makeImage('c')]
    const summary = await runAiCrop(images, 2)

    expect(fetchMock).toHaveBeenCalledTimes(3)
    expect(summary).toEqual({ succeeded: 3, failed: 0 })
    expect(storeStubs.setFocalPoint).toHaveBeenCalledTimes(3)
    expect(storeStubs.setCropRect).toHaveBeenCalledTimes(3)
    expect(storeStubs.setAiCropStatus).toHaveBeenLastCalledWith('c', 'done')
  })

  it('retries with backoff on a 429 and succeeds on the next attempt', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(rateLimitedResponse())
      .mockResolvedValueOnce(okResponse(0.25, 0.75))
    vi.stubGlobal('fetch', fetchMock)

    const onImageError = vi.fn()
    const promise = runAiCrop([makeImage('a')], 2, { onImageError })

    // First attempt 429s, then a 1s backoff, then the retry succeeds.
    await vi.advanceTimersByTimeAsync(1000)
    const summary = await promise

    expect(fetchMock).toHaveBeenCalledTimes(2)
    expect(summary).toEqual({ succeeded: 1, failed: 0 })
    expect(storeStubs.setFocalPoint).toHaveBeenCalledWith('a', { x: 250, y: 375 })
    expect(onImageError).not.toHaveBeenCalled()
  })

  it('fails the image after exhausting 429 retries', async () => {
    const fetchMock = vi.fn().mockResolvedValue(rateLimitedResponse())
    vi.stubGlobal('fetch', fetchMock)

    const onImageError = vi.fn()
    const promise = runAiCrop([makeImage('a')], 2, { onImageError })

    // Advance through the 1s + 2s + 4s backoffs of the three retries.
    await vi.advanceTimersByTimeAsync(7000)
    const summary = await promise

    // 1 initial attempt + 3 retries = 4 calls, all 429.
    expect(fetchMock).toHaveBeenCalledTimes(4)
    expect(summary).toEqual({ succeeded: 0, failed: 1 })
    expect(storeStubs.setAiCropStatus).toHaveBeenLastCalledWith('a', 'error')
    expect(onImageError).toHaveBeenCalledWith('a', 'Rate limited by Gemini — try again shortly')
  })
})