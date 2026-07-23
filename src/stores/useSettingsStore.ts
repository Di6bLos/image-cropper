import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { RatioMode, RatioPreset } from '../types/ratio'
import type { OutputFormat } from '../types/export'

export const RATIO_PRESETS: RatioPreset[] = [
  { label: '1:1', width: 1, height: 1 },
  { label: '2:3', width: 2, height: 3 },
  { label: '3:2', width: 3, height: 2 },
  { label: '16:9', width: 16, height: 9 },
]

export const useSettingsStore = defineStore('settings', () => {
  const mode = ref<RatioMode>('preset')
  const presetIndex = ref(0)
  const customRatioWidth = ref(1)
  const customRatioHeight = ref(1)
  const customPxWidth = ref(1200)
  const customPxHeight = ref(1200)
  const outputFormat = ref<OutputFormat>('image/webp')
  const quality = ref(1.0)

  const ratio = computed(() => {
    if (mode.value === 'preset') {
      const preset = RATIO_PRESETS[presetIndex.value]
      return preset.width / preset.height
    }
    if (mode.value === 'custom-ratio') {
      return Math.max(customRatioWidth.value, 1) / Math.max(customRatioHeight.value, 1)
    }
    return Math.max(customPxWidth.value, 1) / Math.max(customPxHeight.value, 1)
  })

  const outputSize = computed(() => {
    if (mode.value !== 'custom-px') return null
    return {
      width: Math.max(Math.round(customPxWidth.value), 1),
      height: Math.max(Math.round(customPxHeight.value), 1),
    }
  })

  return {
    mode,
    presetIndex,
    customRatioWidth,
    customRatioHeight,
    customPxWidth,
    customPxHeight,
    outputFormat,
    quality,
    ratio,
    outputSize,
  }
})
