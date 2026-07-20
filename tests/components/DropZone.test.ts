import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import DropZone from '../../src/components/DropZone.vue'

describe('DropZone', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('renders drag-and-drop instructions', () => {
    const wrapper = mount(DropZone)
    expect(wrapper.text()).toContain('Drag & drop images here')
  })

  it('opens the file picker when clicked', async () => {
    const wrapper = mount(DropZone)
    const input = wrapper.find('input[type="file"]')
    const clickSpy = vi.spyOn(input.element as HTMLInputElement, 'click')
    await wrapper.find('.drop-zone').trigger('click')
    expect(clickSpy).toHaveBeenCalled()
  })

  it('toggles the active state while dragging over', async () => {
    const wrapper = mount(DropZone)
    const zone = wrapper.find('.drop-zone')
    await zone.trigger('dragover')
    expect(zone.classes()).toContain('drop-zone--active')
    await zone.trigger('dragleave')
    expect(zone.classes()).not.toContain('drop-zone--active')
  })
})
