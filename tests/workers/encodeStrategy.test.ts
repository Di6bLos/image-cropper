import { describe, it, expect } from 'vitest'
import { chooseEncodeStrategy } from '../../src/workers/encodeStrategy'

describe('chooseEncodeStrategy', () => {
  it('uses the native encoder for WebP at quality 1 (true lossless)', () => {
    expect(chooseEncodeStrategy('image/webp', 1)).toBe('native')
  })

  it('uses jSquash for WebP below quality 1', () => {
    expect(chooseEncodeStrategy('image/webp', 0.99)).toBe('jsquash-webp')
    expect(chooseEncodeStrategy('image/webp', 0.5)).toBe('jsquash-webp')
  })

  it('always uses jSquash for JPEG', () => {
    expect(chooseEncodeStrategy('image/jpeg', 1)).toBe('jsquash-jpeg')
    expect(chooseEncodeStrategy('image/jpeg', 0.5)).toBe('jsquash-jpeg')
  })

  it('always uses the native encoder for PNG', () => {
    expect(chooseEncodeStrategy('image/png', 1)).toBe('native')
    expect(chooseEncodeStrategy('image/png', 0.5)).toBe('native')
  })
})
