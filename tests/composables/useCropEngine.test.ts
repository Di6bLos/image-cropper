import { describe, it, expect } from 'vitest'
import { getCenteredCropRect, panCropRect, resizeCropRect } from '../../src/composables/useCropEngine'

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

describe('resizeCropRect', () => {
  it('grows the crop while keeping it centered and within ratio', () => {
    const rect = { x: 25, y: 25, width: 50, height: 50 }
    const resized = resizeCropRect(rect, 20, 1, 100, 100)
    expect(resized.width).toBeCloseTo(70)
    expect(resized.height).toBeCloseTo(70)
    expect(resized.x).toBeCloseTo(15)
    expect(resized.y).toBeCloseTo(15)
  })

  it('does not exceed the image bounds', () => {
    const rect = { x: 25, y: 25, width: 50, height: 50 }
    const resized = resizeCropRect(rect, 1000, 1, 100, 100)
    expect(resized.width).toBeLessThanOrEqual(100)
    expect(resized.height).toBeLessThanOrEqual(100)
  })
})
