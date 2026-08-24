import type { OutputFormat } from '../types/export'

export type EncodeStrategy = 'native' | 'jsquash-webp' | 'jsquash-jpeg'

/**
 * Chromium's native WebP canvas encoder treats quality 1 as a signal to encode true lossless
 * WebP, then drops straight into lossy 4:2:0-subsampled WebP for anything below it — a hard
 * cliff, not a curve. Staying on the native encoder at quality 1 keeps that (desired) lossless
 * behavior, while routing quality < 1 through jSquash gives a smooth, continuous lossy curve.
 * JPEG has no such lossless mode, so mozjpeg (via jSquash) is used at every quality for its
 * better quality-per-byte over the browser's baseline encoder.
 */
export function chooseEncodeStrategy(format: OutputFormat, quality: number): EncodeStrategy {
  if (format === 'image/webp') return quality >= 1 ? 'native' : 'jsquash-webp'
  if (format === 'image/jpeg') return 'jsquash-jpeg'
  return 'native'
}
