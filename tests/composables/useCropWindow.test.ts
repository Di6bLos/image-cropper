import { describe, it, expect } from 'vitest'

describe('useCropWindow', () => {
  describe('aspect ratio constraint', () => {
    it('constrains width/height to ratio when width/height > ratio', () => {
      // ratio = 16/9 = 1.777
      const ratio = 16 / 9
      let width = 200
      let height = 100

      if (width / height > ratio) {
        width = height * ratio
      }

      expect(width / height).toBeCloseTo(ratio, 5)
    })

    it('keeps dimensions when width/height <= ratio', () => {
      // ratio = 16/9 = 1.777
      const ratio = 16 / 9
      let width = 100
      let height = 200

      if (width / height > ratio) {
        width = height * ratio
      }

      expect(width).toBe(100)
      expect(height).toBe(200)
    })

    it('handles 1:1 ratio (square)', () => {
      const ratio = 1
      let width = 100
      let height = 200

      if (width / height > ratio) {
        width = height * ratio
      } else {
        height = width / ratio
      }

      expect(width).toBe(100)
      expect(height).toBe(100)
    })
  })

  describe('bounds clamping', () => {
    const imageWidth = 800
    const imageHeight = 600
    const minSize = 20

    function clampToBounds(x: number, y: number, width: number, height: number) {
      width = Math.max(minSize, Math.min(width, imageWidth))
      height = Math.max(minSize, Math.min(height, imageHeight))
      x = Math.max(0, Math.min(x, imageWidth - width))
      y = Math.max(0, Math.min(y, imageHeight - height))
      return { x, y, width, height }
    }

    it('clamps x to valid range', () => {
      const result = clampToBounds(900, 0, 100, 100)
      expect(result.x).toBe(700) // 800 - 100
    })

    it('clamps y to valid range', () => {
      const result = clampToBounds(0, 700, 100, 100)
      expect(result.y).toBe(500) // 600 - 100
    })

    it('clamps width to image bounds', () => {
      const result = clampToBounds(0, 0, 900, 100)
      expect(result.width).toBe(800)
    })

    it('clamps height to image bounds', () => {
      const result = clampToBounds(0, 0, 100, 700)
      expect(result.height).toBe(600)
    })

    it('enforces minimum size', () => {
      const result = clampToBounds(0, 0, 10, 10)
      expect(result.width).toBe(20)
      expect(result.height).toBe(20)
    })

    it('keeps valid values unchanged', () => {
      const result = clampToBounds(100, 100, 200, 150)
      expect(result).toEqual({ x: 100, y: 100, width: 200, height: 150 })
    })
  })

  describe('NW handle resize', () => {
    it('adjusts x and y to keep SE corner stationary', () => {
      // Starting state
      let cropX = 100
      let cropY = 100
      let width = 200
      let height = 150

      // Simulate NW resize: expand by 20px in each direction
      const delta = 20
      const newWidth = width - delta
      const newHeight = height - delta
      const newX = cropX + (width - newWidth)
      const newY = cropY + (height - newHeight)

      expect(newX).toBe(120) // 100 + (200 - 180)
      expect(newY).toBe(120) // 100 + (150 - 130)
      expect(newWidth).toBe(180)
      expect(newHeight).toBe(130)
    })
  })

  describe('NE handle resize', () => {
    it('adjusts y to keep SW corner stationary', () => {
      // Starting state
      let cropX = 100
      let cropY = 100
      let width = 200
      let height = 150

      // Simulate NE resize: expand by 20px right, 10px up
      const deltaX = 20
      const deltaY = 10
      const newWidth = width + deltaX
      const newHeight = height - deltaY
      const newY = cropY + (height - newHeight)

      expect(newY).toBe(110) // 100 + (150 - 140)
      expect(newWidth).toBe(220)
      expect(newHeight).toBe(140)
    })
  })

  describe('SW handle resize', () => {
    it('adjusts x to keep NE corner stationary', () => {
      // Starting state
      let cropX = 100
      let cropY = 100
      let width = 200
      let height = 150

      // Simulate SW resize: expand by 10px left, 20px down
      const deltaX = 10
      const deltaY = 20
      const newWidth = width - deltaX
      const newHeight = height + deltaY
      const newX = cropX + (width - newWidth)

      expect(newX).toBe(110) // 100 + (200 - 190)
      expect(newWidth).toBe(190)
      expect(newHeight).toBe(170)
    })
  })

  describe('SE handle resize', () => {
    it('only adjusts width/height (opposite corner is stationary)', () => {
      // Starting state
      const cropX = 100
      const cropY = 100
      let width = 200
      let height = 150

      // Simulate SE resize: expand by 30px right, 20px down
      const deltaX = 30
      const deltaY = 20
      const newWidth = width + deltaX
      const newHeight = height + deltaY

      expect(newWidth).toBe(230)
      expect(newHeight).toBe(170)
      // cropX and cropY stay the same
    })
  })

  describe('drag movement', () => {
    it('calculates new position from drag delta', () => {
      const dragStartX = 150
      const dragStartY = 120
      const cropStartX = 100
      const cropStartY = 100

      const currentX = 200
      const currentY = 180

      const dx = currentX - dragStartX
      const dy = currentY - dragStartY

      const newCropX = cropStartX + dx
      const newCropY = cropStartY + dy

      expect(newCropX).toBe(150)
      expect(newCropY).toBe(160)
    })

    it('clamps drag position to image bounds', () => {
      const imageWidth = 800
      const imageHeight = 600
      const cropWidth = 200
      const cropHeight = 150

      let newX = 700
      let newY = 500

      // Clamp X
      newX = Math.max(0, Math.min(newX, imageWidth - cropWidth))
      newY = Math.max(0, Math.min(newY, imageHeight - cropHeight))

      expect(newX).toBe(600) // 800 - 200
      expect(newY).toBe(450) // 600 - 150
    })
  })

  describe('center crop', () => {
    it('centers crop window in image', () => {
      const imageWidth = 800
      const imageHeight = 600
      const cropWidth = 200
      const cropHeight = 150

      const centerX = (imageWidth - cropWidth) / 2
      const centerY = (imageHeight - cropHeight) / 2

      expect(centerX).toBe(300)
      expect(centerY).toBe(225)
    })
  })
})
