import { describe, it, expect } from 'vitest'
import { computeDownscaleDimensions } from '../../src/composables/useImageDownscale'

describe('computeDownscaleDimensions', () => {
  it('scales down an image larger than the max dimension', () => {
    expect(computeDownscaleDimensions(2000, 1000, 1000)).toEqual({ width: 1000, height: 500 })
  })

  it('never upscales an image smaller than the max dimension', () => {
    expect(computeDownscaleDimensions(400, 200, 1000)).toEqual({ width: 400, height: 200 })
  })

  it('leaves dimensions unchanged when the long edge exactly matches the max', () => {
    expect(computeDownscaleDimensions(1000, 500, 1000)).toEqual({ width: 1000, height: 500 })
  })

  it('scales based on the long edge for a tall image', () => {
    expect(computeDownscaleDimensions(500, 2000, 1000)).toEqual({ width: 250, height: 1000 })
  })
})
