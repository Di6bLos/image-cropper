import { describe, it, expect } from 'vitest'
import { isCropped, resolveTargetSize } from '../../src/composables/useImageExport'

describe('isCropped', () => {
  it('is false for a crop that covers the whole image', () => {
    expect(isCropped({ x: 0, y: 0, width: 1600, height: 900 }, 1600, 900)).toBe(false)
  })

  it('is false within a 1px tolerance', () => {
    expect(isCropped({ x: 0.4, y: 0, width: 1599.5, height: 900 }, 1600, 900)).toBe(false)
  })

  it('is true when the crop is inset from an edge', () => {
    expect(isCropped({ x: 73, y: 0, width: 1210, height: 790 }, 1600, 900)).toBe(true)
  })

  it('is true when the crop is smaller but still at the origin', () => {
    expect(isCropped({ x: 0, y: 0, width: 800, height: 900 }, 1600, 900)).toBe(true)
  })
})

describe('resolveTargetSize', () => {
  it('returns null when there is no output size (export at the crop\'s native pixels)', () => {
    expect(resolveTargetSize({ width: 990, height: 754 }, null)).toBeNull()
  })

  it('honors the output size when its aspect ratio matches the crop', () => {
    // uncropped image: crop == full image == output size
    expect(resolveTargetSize({ width: 1600, height: 900 }, { width: 1600, height: 900 })).toEqual({
      width: 1600,
      height: 900,
    })
  })

  it('honors the output size for a differently-scaled but same-aspect crop', () => {
    expect(resolveTargetSize({ width: 800, height: 450 }, { width: 1600, height: 900 })).toEqual({
      width: 1600,
      height: 900,
    })
  })

  it('ignores the output size when the crop has been resized to a different shape', () => {
    // free-form crop of a 1600x900 image; forcing 1600x900 here would stretch it
    expect(resolveTargetSize({ width: 990, height: 754 }, { width: 1600, height: 900 })).toBeNull()
  })

  it('tolerates a sub-percent aspect difference', () => {
    expect(resolveTargetSize({ width: 1599, height: 900 }, { width: 1600, height: 900 })).toEqual({
      width: 1600,
      height: 900,
    })
  })
})
