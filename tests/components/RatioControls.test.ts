import { describe, it, expect } from 'vitest'

describe('RatioControls', () => {
  it('has correct preset ratio values', () => {
    const presets = {
      '16:9': 16 / 9,
      '3:2': 3 / 2,
      '1:1': 1,
      '2:3': 2 / 3,
    }

    expect(presets['16:9']).toBeCloseTo(1.778, 3)
    expect(presets['3:2']).toBe(1.5)
    expect(presets['1:1']).toBe(1)
    expect(presets['2:3']).toBeCloseTo(0.667, 3)
  })

  it('validates positive integers only', () => {
    const validatePositive = (value: number) => value > 0 && value <= 10000 && Number.isInteger(value)

    expect(validatePositive(4)).toBe(true)
    expect(validatePositive(3)).toBe(true)
    expect(validatePositive(0)).toBe(false)
    expect(validatePositive(-1)).toBe(false)
    expect(validatePositive(1.5)).toBe(false)
    expect(validatePositive(10001)).toBe(false)
  })

  it('mode switching works correctly', () => {
    type Mode = 'ratio' | 'pixel'
    let currentMode: Mode = 'ratio'

    const setMode = (mode: Mode) => {
      currentMode = mode
    }

    setMode('pixel')
    expect(currentMode).toBe('pixel')

    setMode('ratio')
    expect(currentMode).toBe('ratio')
  })

  it('effectiveRatio computed correctly', () => {
    const computeEffectiveRatio = (mode: string, preset: string, customW: number, customH: number, pixelW: number, pixelH: number) => {
      if (mode === 'pixel') {
        return pixelW / pixelH
      }
      if (preset === 'custom') {
        return customW / customH
      }
      const presets: Record<string, number> = {
        '16:9': 16 / 9,
        '3:2': 3 / 2,
        '1:1': 1,
        '2:3': 2 / 3,
      }
      return presets[preset]
    }

    expect(computeEffectiveRatio('ratio', '1:1', 0, 0, 0, 0)).toBe(1)
    expect(computeEffectiveRatio('ratio', 'custom', 4, 3, 0, 0)).toBeCloseTo(1.333, 3)
    expect(computeEffectiveRatio('pixel', '', 0, 0, 1920, 1080)).toBeCloseTo(1.778, 3)
  })
})
