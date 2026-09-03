import { describe, it, expect } from 'vitest'
import {
  getCenteredCropRect,
  getFocalCropRect,
  getFullImageCropRect,
  panCropRect,
  resizeCropRectEdge,
} from '../../src/composables/useCropEngine'

describe('getFullImageCropRect', () => {
  it('returns a rect covering the whole image', () => {
    expect(getFullImageCropRect(1920, 1080)).toEqual({ x: 0, y: 0, width: 1920, height: 1080 })
  })
})

describe('getCenteredCropRect', () => {
  it('centers a crop for a wide image against a square ratio', () => {
    expect(getCenteredCropRect(200, 100, 1)).toEqual({ x: 50, y: 0, width: 100, height: 100 })
  })

  it('centers a crop for a tall image against a wide ratio', () => {
    expect(getCenteredCropRect(100, 200, 2)).toEqual({ x: 0, y: 75, width: 100, height: 50 })
  })

  it('fills the entire image when the ratio matches exactly', () => {
    expect(getCenteredCropRect(400, 300, 4 / 3)).toEqual({ x: 0, y: 0, width: 400, height: 300 })
  })
})

describe('getFocalCropRect', () => {
  it('matches getCenteredCropRect when the focal point is the image center', () => {
    const centered = getCenteredCropRect(200, 100, 1)
    expect(getFocalCropRect(200, 100, 1, 100, 50)).toEqual(centered)
  })

  it('centers the crop on an off-center focal point', () => {
    expect(getFocalCropRect(200, 100, 1, 20, 50)).toEqual({ x: 0, y: 0, width: 100, height: 100 })
  })

  it('clamps to the image bounds when the focal point is near a corner', () => {
    const rect = getFocalCropRect(200, 100, 1, 195, 98)
    expect(rect.x).toBeLessThanOrEqual(200 - rect.width)
    expect(rect.y).toBeLessThanOrEqual(100 - rect.height)
    expect(rect.x).toBeGreaterThanOrEqual(0)
    expect(rect.y).toBeGreaterThanOrEqual(0)
    expect(rect).toEqual({ x: 100, y: 0, width: 100, height: 100 })
  })
})

describe('panCropRect', () => {
  it('moves the rect by the given delta', () => {
    const rect = { x: 10, y: 10, width: 50, height: 50 }
    expect(panCropRect(rect, 5, -5, 200, 200)).toEqual({ x: 15, y: 5, width: 50, height: 50 })
  })

  it('clamps to the image bounds', () => {
    const rect = { x: 0, y: 0, width: 50, height: 50 }
    expect(panCropRect(rect, -100, 500, 100, 100)).toEqual({ x: 0, y: 50, width: 50, height: 50 })
  })
})

describe('resizeCropRectEdge', () => {
  const rect = { x: 20, y: 20, width: 60, height: 40 } // inside a 200x200 image

  it('moves only the east edge, anchoring the west edge', () => {
    expect(resizeCropRectEdge(rect, 'e', 30, 999, 200, 200)).toEqual({ x: 20, y: 20, width: 90, height: 40 })
  })

  it('moves only the south edge, anchoring the north edge', () => {
    expect(resizeCropRectEdge(rect, 's', 0, 25, 200, 200)).toEqual({ x: 20, y: 20, width: 60, height: 65 })
  })

  it('moves the west edge, anchoring the east edge', () => {
    expect(resizeCropRectEdge(rect, 'w', -10, 0, 200, 200)).toEqual({ x: 10, y: 20, width: 70, height: 40 })
  })

  it('adjusts both edges for a corner handle', () => {
    expect(resizeCropRectEdge(rect, 'se', 10, 10, 200, 200)).toEqual({ x: 20, y: 20, width: 70, height: 50 })
  })

  it('clamps to the image bounds', () => {
    expect(resizeCropRectEdge(rect, 'se', 999, 999, 200, 200)).toEqual({ x: 20, y: 20, width: 180, height: 180 })
  })

  it('enforces the minimum crop size instead of flipping the east edge', () => {
    expect(resizeCropRectEdge(rect, 'e', -999, 0, 200, 200)).toEqual({ x: 20, y: 20, width: 32, height: 40 })
  })

  it('enforces the minimum when dragging the north edge past the south edge', () => {
    expect(resizeCropRectEdge(rect, 'n', 0, 999, 200, 200)).toEqual({ x: 20, y: 28, width: 60, height: 32 })
  })

  it('stays inside an image smaller than the minimum crop size', () => {
    // 16x16 image: the minimum can't be honored, so the crop is capped by the image itself.
    const tiny = { x: 0, y: 0, width: 16, height: 16 }
    expect(resizeCropRectEdge(tiny, 'w', -50, 0, 16, 16)).toEqual(tiny)
    expect(resizeCropRectEdge(tiny, 'nw', 50, 50, 16, 16)).toEqual(tiny)
    expect(resizeCropRectEdge(tiny, 'se', -50, -50, 16, 16)).toEqual(tiny)
  })
})
