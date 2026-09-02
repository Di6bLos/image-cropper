import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'

const { rasterizePdfMock, showMock } = vi.hoisted(() => ({
  rasterizePdfMock: vi.fn(),
  showMock: vi.fn(),
}))

vi.mock('../../src/composables/usePdfRasterize', () => ({
  MAX_PDF_PAGES: 25,
  rasterizePdf: (file: File) => rasterizePdfMock(file),
  pdfPageName: (fileName: string, pageNumber: number) =>
    `${fileName.replace(/\.pdf$/i, '')}-p${pageNumber}`,
}))

vi.mock('../../src/composables/useToast', () => ({
  useToast: () => ({ show: showMock, toasts: [], dismiss: vi.fn() }),
}))

import { useFileImport } from '../../src/composables/useFileImport'
import { useImageStore } from '../../src/stores/useImageStore'

const origCreateObjectURL = URL.createObjectURL
const origRevokeObjectURL = URL.revokeObjectURL

function pdfPage(pageNumber: number, width = 2048, height = 1536) {
  return { blob: new Blob(['page'], { type: 'image/png' }), width, height, pageNumber }
}

describe('useFileImport — PDF import', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    rasterizePdfMock.mockReset()
    showMock.mockReset()
    URL.createObjectURL = vi.fn(() => 'blob:mock')
    URL.revokeObjectURL = vi.fn()
  })

  afterEach(() => {
    URL.createObjectURL = origCreateObjectURL
    URL.revokeObjectURL = origRevokeObjectURL
    vi.unstubAllGlobals()
  })

  it('adds one image per rasterized page', async () => {
    rasterizePdfMock.mockResolvedValue({ pages: [pdfPage(1), pdfPage(2)], totalPages: 2 })

    await useFileImport().importFiles([
      new File(['%PDF'], 'report.pdf', { type: 'application/pdf' }),
    ])

    const { images } = useImageStore()
    expect(images).toHaveLength(2)
    expect(images.map((i) => i.name)).toEqual(['report-p1', 'report-p2'])
    expect(images[0].naturalWidth).toBe(2048)
    expect(images[0].naturalHeight).toBe(1536)
    expect(images[0].cropRect).not.toBeNull()
    expect(images[0].file).toBeInstanceOf(File)
    expect(images[0].file.type).toBe('image/png')
    expect(images[0].file.name).toBe('report-p1.png')
    expect(showMock).toHaveBeenCalledWith(expect.stringContaining('Imported 2 images'), 'success')
  })

  it('caps import at MAX_PDF_PAGES and warns when the PDF is longer', async () => {
    const pages = Array.from({ length: 25 }, (_, i) => pdfPage(i + 1, 100, 100))
    rasterizePdfMock.mockResolvedValue({ pages, totalPages: 40 })

    await useFileImport().importFiles([
      new File(['%PDF'], 'big.pdf', { type: 'application/pdf' }),
    ])

    expect(useImageStore().images).toHaveLength(25)
    expect(showMock).toHaveBeenCalledWith(expect.stringContaining('40 pages'), 'info')
  })

  it('rejects the file (no throw) when rasterization fails', async () => {
    rasterizePdfMock.mockRejectedValue(new Error('encrypted'))

    await expect(
      useFileImport().importFiles([
        new File(['%PDF'], 'locked.pdf', { type: 'application/pdf' }),
      ]),
    ).resolves.toBeUndefined()

    expect(useImageStore().images).toHaveLength(0)
    expect(showMock).toHaveBeenCalledWith(expect.stringContaining('unsupported file'), 'error')
  })

  it('still rejects a non-PDF unsupported file without calling the rasterizer', async () => {
    await useFileImport().importFiles([
      new File(['x'], 'notes.txt', { type: 'text/plain' }),
    ])

    expect(rasterizePdfMock).not.toHaveBeenCalled()
    expect(useImageStore().images).toHaveLength(0)
    expect(showMock).toHaveBeenCalledWith(expect.stringContaining('unsupported file'), 'error')
  })

  it('still imports a regular raster image through the shared loop', async () => {
    class FakeImage {
      onload: (() => void) | null = null
      onerror: (() => void) | null = null
      naturalWidth = 800
      naturalHeight = 600
      set src(_value: string) {
        queueMicrotask(() => this.onload?.())
      }
    }
    vi.stubGlobal('Image', FakeImage)

    await useFileImport().importFiles([
      new File(['\x89PNG'], 'photo.png', { type: 'image/png' }),
    ])

    const { images } = useImageStore()
    expect(images).toHaveLength(1)
    expect(images[0].name).toBe('photo.png')
    expect(images[0].naturalWidth).toBe(800)
    expect(rasterizePdfMock).not.toHaveBeenCalled()
  })
})
