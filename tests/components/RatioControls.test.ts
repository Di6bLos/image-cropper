import { describe, it, expect, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import RatioControls from '../../src/components/RatioControls.vue'
import { useSettingsStore, RATIO_PRESETS } from '../../src/stores/useSettingsStore'
import { useImageStore } from '../../src/stores/useImageStore'

describe('RatioControls', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('renders a button for every ratio preset', () => {
    const wrapper = mount(RatioControls)
    expect(wrapper.findAll('.ratio-controls__preset')).toHaveLength(RATIO_PRESETS.length)
  })

  it('selects a preset on click', async () => {
    const wrapper = mount(RatioControls)
    const settings = useSettingsStore()
    await wrapper.findAll('.ratio-controls__preset')[2].trigger('click')
    expect(settings.mode).toBe('preset')
    expect(settings.presetIndex).toBe(2)
  })

  it('disables "apply to all" when there are no images', () => {
    const wrapper = mount(RatioControls)
    expect(wrapper.find('.ratio-controls__apply').attributes('disabled')).toBeDefined()
  })

  it('enables "apply to all" once images are imported', async () => {
    const wrapper = mount(RatioControls)
    const images = useImageStore()
    images.addImages([
      {
        id: '1',
        file: new File([], 'a.png'),
        name: 'a.png',
        url: 'blob:a',
        naturalWidth: 100,
        naturalHeight: 100,
        cropRect: null,
        status: 'ready',
        focalPoint: null,
        aiCropStatus: 'idle',
      },
    ])
    await wrapper.vm.$nextTick()
    expect(wrapper.find('.ratio-controls__apply').attributes('disabled')).toBeUndefined()
  })
})
