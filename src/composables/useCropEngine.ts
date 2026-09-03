import type { CropRect } from '../types/image'

const MIN_CROP_SIZE = 32

export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max)
}

/** Crop rect covering the entire image. */
export function getFullImageCropRect(naturalWidth: number, naturalHeight: number): CropRect {
  return { x: 0, y: 0, width: naturalWidth, height: naturalHeight }
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

/**
 * Largest ratio-matching crop rect (same size as `getCenteredCropRect`), centered on
 * (focalX, focalY) in natural-image pixels instead of the image's geometric center,
 * clamped to the image bounds.
 */
export function getFocalCropRect(
  naturalWidth: number,
  naturalHeight: number,
  ratio: number,
  focalX: number,
  focalY: number,
): CropRect {
  const { width, height } = getCenteredCropRect(naturalWidth, naturalHeight, ratio)
  const x = clamp(focalX - width / 2, 0, naturalWidth - width)
  const y = clamp(focalY - height / 2, 0, naturalHeight - height)
  return { x, y, width, height }
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

export type CropHandlePosition = 'n' | 's' | 'e' | 'w' | 'ne' | 'nw' | 'se' | 'sw'

/**
 * Free-form resize: moves the edge(s) named by `handle` by (dx, dy) natural-image
 * pixels while the opposite edge(s) stay anchored. Clamps within the image bounds
 * and enforces `MIN_CROP_SIZE`; a dragged edge cannot cross its opposite edge.
 */
export function resizeCropRectEdge(
  rect: CropRect,
  handle: CropHandlePosition,
  dx: number,
  dy: number,
  naturalWidth: number,
  naturalHeight: number,
): CropRect {
  let left = rect.x
  let top = rect.y
  let right = rect.x + rect.width
  let bottom = rect.y + rect.height

  if (handle.includes('w')) left = clamp(left + dx, 0, right - MIN_CROP_SIZE)
  if (handle.includes('e')) right = clamp(right + dx, left + MIN_CROP_SIZE, naturalWidth)
  if (handle.includes('n')) top = clamp(top + dy, 0, bottom - MIN_CROP_SIZE)
  if (handle.includes('s')) bottom = clamp(bottom + dy, top + MIN_CROP_SIZE, naturalHeight)

  return { x: left, y: top, width: right - left, height: bottom - top }
}
