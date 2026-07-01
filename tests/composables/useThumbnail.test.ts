import { describe, it, expect } from 'vitest'

describe('useThumbnail', () => {
  describe('aspect ratio preservation', () => {
    it('calculates correct scale for landscape image', () => {
      // 200x100 image, size=64
      const bitmapWidth = 200
      const bitmapHeight = 100
      const size = 64

      const scale = Math.min(size / bitmapWidth, size / bitmapHeight)
      const width = Math.round(bitmapWidth * scale)
      const height = Math.round(bitmapHeight * scale)

      expect(scale).toBe(0.32)
      expect(width).toBe(64)
      expect(height).toBe(32)
    })

    it('calculates correct scale for portrait image', () => {
      // 100x200 image, size=64
      const bitmapWidth = 100
      const bitmapHeight = 200
      const size = 64

      const scale = Math.min(size / bitmapWidth, size / bitmapHeight)
      const width = Math.round(bitmapWidth * scale)
      const height = Math.round(bitmapHeight * scale)

      expect(scale).toBe(0.32)
      expect(width).toBe(32)
      expect(height).toBe(64)
    })

    it('calculates correct scale for square image', () => {
      // 100x100 image, size=64
      const bitmapWidth = 100
      const bitmapHeight = 100
      const size = 64

      const scale = Math.min(size / bitmapWidth, size / bitmapHeight)
      const width = Math.round(bitmapWidth * scale)
      const height = Math.round(bitmapHeight * scale)

      expect(scale).toBe(0.64)
      expect(width).toBe(64)
      expect(height).toBe(64)
    })

    it('uses full size for small images', () => {
      // 50x50 image, size=64 (image is smaller than target)
      const bitmapWidth = 50
      const bitmapHeight = 50
      const size = 64

      const scale = Math.min(size / bitmapWidth, size / bitmapHeight)
      const width = Math.round(bitmapWidth * scale)
      const height = Math.round(bitmapHeight * scale)

      expect(scale).toBe(1.28)
      expect(width).toBe(64)
      expect(height).toBe(64)
    })
  })

  describe('centering calculation', () => {
    it('centers landscape thumbnail in square canvas', () => {
      const size = 64
      const thumbWidth = 64
      const thumbHeight = 32

      const offsetX = (size - thumbWidth) / 2
      const offsetY = (size - thumbHeight) / 2

      expect(offsetX).toBe(0)
      expect(offsetY).toBe(16)
    })

    it('centers portrait thumbnail in square canvas', () => {
      const size = 64
      const thumbWidth = 32
      const thumbHeight = 64

      const offsetX = (size - thumbWidth) / 2
      const offsetY = (size - thumbHeight) / 2

      expect(offsetX).toBe(16)
      expect(offsetY).toBe(0)
    })

    it('centers square thumbnail at origin', () => {
      const size = 64
      const thumbWidth = 64
      const thumbHeight = 64

      const offsetX = (size - thumbWidth) / 2
      const offsetY = (size - thumbHeight) / 2

      expect(offsetX).toBe(0)
      expect(offsetY).toBe(0)
    })
  })

  describe('DPR scaling', () => {
    it('doubles canvas size for 2x DPR', () => {
      const size = 64
      const dpr = 2

      const canvasWidth = size * dpr
      const canvasHeight = size * dpr

      expect(canvasWidth).toBe(128)
      expect(canvasHeight).toBe(128)
    })

    it('triples canvas size for 3x DPR', () => {
      const size = 64
      const dpr = 3

      const canvasWidth = size * dpr
      const canvasHeight = size * dpr

      expect(canvasWidth).toBe(192)
      expect(canvasHeight).toBe(192)
    })
  })
})
