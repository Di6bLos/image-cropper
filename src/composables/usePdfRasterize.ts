import PdfWorkerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url'

/** Longest edge, in pixels, each PDF page is rasterized to. */
export const PDF_RENDER_MAX_DIMENSION = 2048

/** Maximum number of pages imported from a single PDF. */
export const MAX_PDF_PAGES = 25

export interface RasterizedPdfPage {
  blob: Blob
  width: number
  height: number
  pageNumber: number
}

export interface RasterizedPdf {
  pages: RasterizedPdfPage[]
  /** Real page count of the source document, before the `MAX_PDF_PAGES` cap. */
  totalPages: number
}

/**
 * Scale factor for `PDFPageProxy.getViewport` so the rendered page's long edge lands on
 * `maxDimension`. PDF pages are vector, so upscaling small pages is fine.
 */
export function computePdfRenderScale(
  viewportWidth: number,
  viewportHeight: number,
  maxDimension: number,
): number {
  const longEdge = Math.max(viewportWidth, viewportHeight)
  if (longEdge <= 0) return 1
  return maxDimension / longEdge
}

/** `"annual report.pdf"` + `3` -> `"annual report-p3"` (extension stripped, page suffix added). */
export function pdfPageName(fileName: string, pageNumber: number): string {
  const base = fileName.replace(/\.pdf$/i, '')
  return `${base}-p${pageNumber}`
}

let workerConfigured = false

/**
 * Rasterizes the first `MAX_PDF_PAGES` pages of a PDF to PNG blobs, client-side, via pdf.js.
 * The caller's thread drives rendering (this is invoked from the import handler); pdf.js
 * parsing runs in its own worker.
 */
export async function rasterizePdf(file: File): Promise<RasterizedPdf> {
  const pdfjs = await import('pdfjs-dist')

  if (!workerConfigured) {
    pdfjs.GlobalWorkerOptions.workerSrc = PdfWorkerUrl
    workerConfigured = true
  }

  const buffer = await file.arrayBuffer()
  const loadingTask = pdfjs.getDocument({ data: buffer })

  try {
    // Awaited inside the try so a malformed/encrypted PDF still tears down the pdf.js worker.
    const doc = await loadingTask.promise
    const totalPages = doc.numPages
    const pageCount = Math.min(totalPages, MAX_PDF_PAGES)
    const pages: RasterizedPdfPage[] = []

    for (let pageNumber = 1; pageNumber <= pageCount; pageNumber++) {
      const page = await doc.getPage(pageNumber)
      const unscaled = page.getViewport({ scale: 1 })
      const scale = computePdfRenderScale(
        unscaled.width,
        unscaled.height,
        PDF_RENDER_MAX_DIMENSION,
      )
      const viewport = page.getViewport({ scale })

      const canvas = document.createElement('canvas')
      canvas.width = Math.round(viewport.width)
      canvas.height = Math.round(viewport.height)

      await page.render({ canvas, viewport }).promise

      pages.push({
        blob: await canvasToPngBlob(canvas),
        width: canvas.width,
        height: canvas.height,
        pageNumber,
      })
    }

    return { pages, totalPages }
  } finally {
    await loadingTask.destroy()
  }
}

function canvasToPngBlob(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob)
      else reject(new Error('Failed to encode PDF page to PNG'))
    }, 'image/png')
  })
}
