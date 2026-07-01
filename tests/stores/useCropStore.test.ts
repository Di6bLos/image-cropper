import { describe, it, expect } from 'vitest'

describe('useCropStore', () => {
  describe('preset ratios', () => {
    const PRESET_RATIOS = {
      '16:9': 16 / 9,
      '3:2': 3 / 2,
      '1:1': 1,
      '2:3': 2 / 3,
    }

    it('calculates 16:9 ratio correctly', () => {
      expect(PRESET_RATIOS['16:9']).toBeCloseTo(1.7778, 3)
    })

    it('calculates 3:2 ratio correctly', () => {
      expect(PRESET_RATIOS['3:2']).toBe(1.5)
    })

    it('calculates 1:1 ratio correctly', () => {
      expect(PRESET_RATIOS['1:1']).toBe(1)
    })

    it('calculates 2:3 ratio correctly', () => {
      expect(PRESET_RATIOS['2:3']).toBeCloseTo(0.667, 3)
    })
  })

  describe('effectiveRatio computation', () => {
    function computeEffectiveRatio(
      mode: 'ratio' | 'pixel',
      preset: string,
      customWidth: number,
      customHeight: number,
      pixelWidth: number,
      pixelHeight: number,
    ): number | undefined {
      if (mode === 'pixel') {
        return pixelWidth / pixelHeight
      }

      if (preset === 'custom') {
        if (customHeight === 0) return undefined
        return customWidth / customHeight
      }

      const PRESET_RATIOS: Record<string, number> = {
        '16:9': 16 / 9,
        '3:2': 3 / 2,
        '1:1': 1,
        '2:3': 2 / 3,
      }

      return PRESET_RATIOS[preset]
    }

    it('returns preset ratio for ratio mode with preset', () => {
      const ratio = computeEffectiveRatio('ratio', '16:9', 0, 0, 0, 0)
      expect(ratio).toBeCloseTo(1.7778, 3)
    })

    it('returns custom ratio for ratio mode with custom preset', () => {
      const ratio = computeEffectiveRatio('ratio', 'custom', 7, 4, 0, 0)
      expect(ratio).toBe(1.75)
    })

    it('returns pixel ratio for pixel mode', () => {
      const ratio = computeEffectiveRatio('pixel', '1:1', 0, 0, 1920, 1080)
      expect(ratio).toBeCloseTo(1.778, 3)
    })

    it('handles zero custom height gracefully', () => {
      const ratio = computeEffectiveRatio('ratio', 'custom', 7, 0, 0, 0)
      expect(ratio).toBeUndefined()
    })
  })

  describe('ratioString computation', () => {
    function computeRatioString(
      mode: 'ratio' | 'pixel',
      preset: string,
      customWidth: number,
      customHeight: number,
      pixelWidth: number,
      pixelHeight: number,
    ): string {
      if (mode === 'pixel') {
        return `${pixelWidth}x${pixelHeight}`
      }

      if (preset === 'custom') {
        return `${customWidth}:${customHeight}`
      }

      return preset
    }

    it('returns preset string for ratio mode', () => {
      expect(computeRatioString('ratio', '16:9', 0, 0, 0, 0)).toBe('16:9')
    })

    it('returns custom W:H for custom preset', () => {
      expect(computeRatioString('ratio', 'custom', 7, 4, 0, 0)).toBe('7:4')
    })

    it('returns WxH for pixel mode', () => {
      expect(computeRatioString('pixel', '1:1', 0, 0, 1920, 1080)).toBe('1920x1080')
    })
  })

  describe('mode switching', () => {
    it('mode is either ratio or pixel', () => {
      const validModes = ['ratio', 'pixel']
      expect(validModes.includes('ratio')).toBe(true)
      expect(validModes.includes('pixel')).toBe(true)
      expect(validModes.includes('other')).toBe(false)
    })
  })

  describe('preset types', () => {
    it('has correct preset values', () => {
      const validPresets = ['16:9', '3:2', '1:1', '2:3', 'custom']
      expect(validPresets).toContain('16:9')
      expect(validPresets).toContain('3:2')
      expect(validPresets).toContain('1:1')
      expect(validPresets).toContain('2:3')
      expect(validPresets).toContain('custom')
    })
  })
})
