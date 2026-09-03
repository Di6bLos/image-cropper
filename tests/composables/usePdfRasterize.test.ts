import { describe, it, expect } from 'vitest'
import { computePdfRenderScale, pdfPageName } from '../../src/composables/usePdfRasterize'

describe('computePdfRenderScale', () => {
  it('scales a landscape page so its width hits the max dimension', () => {
    expect(computePdfRenderScale(1000, 500, 2048)).toBe(2.048)
  })

  it('scales a portrait page so its height hits the max dimension', () => {
    expect(computePdfRenderScale(500, 1000, 2048)).toBe(2.048)
  })

  it('upscales a page smaller than the max dimension', () => {
    expect(computePdfRenderScale(300, 200, 2048)).toBe(2048 / 300)
  })

  it('returns 1 for a degenerate zero-size viewport', () => {
    expect(computePdfRenderScale(0, 0, 2048)).toBe(1)
  })
})

describe('pdfPageName', () => {
  it('strips the .pdf extension and appends a page suffix', () => {
    expect(pdfPageName('report.pdf', 3)).toBe('report-p3')
  })

  it('is case-insensitive about the extension', () => {
    expect(pdfPageName('Scan.PDF', 1)).toBe('Scan-p1')
  })

  it('only strips a trailing .pdf, not dots elsewhere in the name', () => {
    expect(pdfPageName('q3.2024.final.pdf', 12)).toBe('q3.2024.final-p12')
  })

  it('leaves a name without a .pdf extension intact', () => {
    expect(pdfPageName('document', 2)).toBe('document-p2')
  })
})
