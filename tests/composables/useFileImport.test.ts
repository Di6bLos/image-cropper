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

import { useFileImport, resolveFileType } from '../../src/composables/useFileImport'
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

  it('reports a read failure (not "unsupported") when rasterization fails', async () => {
    rasterizePdfMock.mockRejectedValue(new Error('corrupt'))

    await expect(
      useFileImport().importFiles([
        new File(['%PDF'], 'broken.pdf', { type: 'application/pdf' }),
      ]),
    ).resolves.toBeUndefined()

    expect(useImageStore().images).toHaveLength(0)
    expect(showMock).toHaveBeenCalledWith(expect.stringContaining("Couldn't read broken.pdf"), 'error')
    expect(showMock).not.toHaveBeenCalledWith(expect.stringContaining('unsupported file'), 'error')
  })

  it('names a password-protected PDF as such', async () => {
    const error = new Error('No password given')
    error.name = 'PasswordException'
    rasterizePdfMock.mockRejectedValue(error)

    await useFileImport().importFiles([
      new File(['%PDF'], 'locked.pdf', { type: 'application/pdf' }),
    ])

    expect(showMock).toHaveBeenCalledWith(
      expect.stringContaining('locked.pdf (password protected)'),
      'error',
    )
  })

  it('rasterizes a PDF whose File carries no MIME type', async () => {
    rasterizePdfMock.mockResolvedValue({ pages: [pdfPage(1)], totalPages: 1 })

    await useFileImport().importFiles([new File(['%PDF'], 'dragged.pdf', { type: '' })])

    expect(rasterizePdfMock).toHaveBeenCalled()
    expect(useImageStore().images).toHaveLength(1)
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

  it('imports an image whose File carries no MIME type', async () => {
    class FakeImage {
      onload: (() => void) | null = null
      onerror: (() => void) | null = null
      naturalWidth = 640
      naturalHeight = 480
      set src(_value: string) {
        queueMicrotask(() => this.onload?.())
      }
    }
    vi.stubGlobal('Image', FakeImage)

    await useFileImport().importFiles([new File(['\xFF\xD8'], 'dragged.JPEG', { type: '' })])

    expect(useImageStore().images).toHaveLength(1)
  })
})

describe('resolveFileType', () => {
  it('passes a declared MIME type straight through', () => {
    expect(resolveFileType(new File([''], 'a.pdf', { type: 'image/png' }))).toBe('image/png')
  })

  it('falls back to the extension when the MIME type is empty', () => {
    expect(resolveFileType(new File([''], 'a.PDF', { type: '' }))).toBe('application/pdf')
    expect(resolveFileType(new File([''], 'a.jpg', { type: '' }))).toBe('image/jpeg')
  })

  it('is empty for an unknown extension with no MIME type', () => {
    expect(resolveFileType(new File([''], 'notes.txt', { type: '' }))).toBe('')
    expect(resolveFileType(new File([''], 'noextension', { type: '' }))).toBe('')
  })
})
