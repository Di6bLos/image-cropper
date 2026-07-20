import type { CropRect } from '../types/image'

const MIN_CROP_SIZE = 32

export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max)
}

/** Largest centered crop rect matching `ratio` (width/height) that fits inside the image. */
export function getCenteredCropRect(naturalWidth: number, naturalHeight: number, ratio: number): CropRect {
  const imageRatio = naturalWidth / naturalHeight
  let width: number
  let height: number

  if (imageRatio > ratio) {
    height = naturalHeight
    width = height * ratio
  } else {
    width = naturalWidth
    height = width / ratio
  }

  return {
    x: (naturalWidth - width) / 2,
    y: (naturalHeight - height) / 2,
    width,
    height,
  }
}

/** Moves a crop rect by (dx, dy) in natural-image pixels, clamped to the image bounds. */
export function panCropRect(rect: CropRect, dx: number, dy: number, naturalWidth: number, naturalHeight: number): CropRect {
  const maxX = Math.max(naturalWidth - rect.width, 0)
  const maxY = Math.max(naturalHeight - rect.height, 0)
  return {
    ...rect,
    x: clamp(rect.x + dx, 0, maxX),
    y: clamp(rect.y + dy, 0, maxY),
  }
}

/**
 * Resizes a crop rect around its own center by `widthDelta` natural-image pixels,
 * keeping it locked to `ratio` and within the image bounds.
 */
export function resizeCropRect(
  rect: CropRect,
  widthDelta: number,
  ratio: number,
  naturalWidth: number,
  naturalHeight: number,
): CropRect {
  const centerX = rect.x + rect.width / 2
  const centerY = rect.y + rect.height / 2

  const maxWidth = Math.min(naturalWidth, naturalHeight * ratio)
  const minWidth = Math.min(MIN_CROP_SIZE, maxWidth)

  const nextWidth = clamp(rect.width + widthDelta, minWidth, maxWidth)
  const nextHeight = nextWidth / ratio

  const x = clamp(centerX - nextWidth / 2, 0, Math.max(naturalWidth - nextWidth, 0))
  const y = clamp(centerY - nextHeight / 2, 0, Math.max(naturalHeight - nextHeight, 0))

  return { x, y, width: nextWidth, height: nextHeight }
}
