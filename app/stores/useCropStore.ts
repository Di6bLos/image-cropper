/**
 * useCropStore - Crop state and ratio settings management
 *
 * Manages ratio/pixel mode state, ratio presets, custom inputs,
 * and computed effectiveRatio for crop window constraint.
 *
 * @see RATIO-01: Preset ratios defined (16:9, 3:2, 1:1, 2:3)
 * @see RATIO-02: effectiveRatio updates when preset/mode changes
 * @see RATIO-05: Tab interface (Ratio/Pixel) implemented via mode toggle
 */

export type RatioMode = 'ratio' | 'pixel'
export type RatioPreset = '16:9' | '3:2' | '1:1' | '2:3' | 'custom'

// Preset ratio values (width/height)
const PRESET_RATIOS: Record<Exclude<RatioPreset, 'custom'>, number> = {
  '16:9': 16 / 9,   // ~1.777
  '3:2': 3 / 2,     // 1.5
  '1:1': 1,         // 1.0
  '2:3': 2 / 3,     // ~0.667
}

export interface RatioState {
  mode: RatioMode
  preset: RatioPreset
  customWidth: number
  customHeight: number
  pixelWidth: number
  pixelHeight: number
}

export const useCropStore = defineStore('crop', () => {
  // Initial state
  const ratioState = ref<RatioState>({
    mode: 'ratio',
    preset: '1:1',
    customWidth: 4,
    customHeight: 3,
    pixelWidth: 1200,
    pixelHeight: 800,
  })

  /**
   * Computed effective ratio based on current mode and preset
   * - If mode='pixel': pixelWidth / pixelHeight
   * - If preset='custom': customWidth / customHeight
   * - Otherwise: lookup preset ratio
   */
  const effectiveRatio = computed<number | undefined>(() => {
    if (ratioState.value.mode === 'pixel') {
      return ratioState.value.pixelWidth / ratioState.value.pixelHeight
    }

    if (ratioState.value.preset === 'custom') {
      // Avoid division by zero
      if (ratioState.value.customHeight === 0) return undefined
      return ratioState.value.customWidth / ratioState.value.customHeight
    }

    return PRESET_RATIOS[ratioState.value.preset]
  })

  /**
   * Computed human-readable ratio string
   */
  const ratioString = computed<string>(() => {
    if (ratioState.value.mode === 'pixel') {
      return `${ratioState.value.pixelWidth}x${ratioState.value.pixelHeight}`
    }

    if (ratioState.value.preset === 'custom') {
      return `${ratioState.value.customWidth}:${ratioState.value.customHeight}`
    }

    return ratioState.value.preset
  })

  /**
   * Set the mode (ratio or pixel)
   */
  function setMode(mode: RatioMode): void {
    ratioState.value.mode = mode
  }

  /**
   * Set the ratio preset
   */
  function setPreset(preset: RatioPreset): void {
    ratioState.value.preset = preset
  }

  /**
   * Set custom ratio dimensions
   */
  function setCustomRatio(width: number, height: number): void {
    ratioState.value.customWidth = width
    ratioState.value.customHeight = height
    // Automatically switch to custom preset when setting custom values
    ratioState.value.preset = 'custom'
  }

  /**
   * Set pixel dimensions
   */
  function setPixelSize(width: number, height: number): void {
    ratioState.value.pixelWidth = width
    ratioState.value.pixelHeight = height
  }

  /**
   * Reset to defaults
   */
  function reset(): void {
    ratioState.value = {
      mode: 'ratio',
      preset: '1:1',
      customWidth: 4,
      customHeight: 3,
      pixelWidth: 1200,
      pixelHeight: 800,
    }
  }

  /**
   * Get preset ratio value
   */
  function getPresetRatio(preset: Exclude<RatioPreset, 'custom'>): number {
    return PRESET_RATIOS[preset]
  }

  return {
    // State (readonly wrapper)
    ratioState: readonly(ratioState),

    // Computed
    effectiveRatio,
    ratioString,

    // Actions
    setMode,
    setPreset,
    setCustomRatio,
    setPixelSize,
    reset,
    getPresetRatio,

    // Constants for templates
    PRESET_RATIOS,
  }
})
