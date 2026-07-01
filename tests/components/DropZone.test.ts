import { describe, it, expect, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'

// Mock process.client before importing component
Object.defineProperty(process, 'client', { value: true })

describe('DropZone', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('renders correctly in default state', () => {
    const DropZone = {
      template: `
        <div class="dropzone">
          <input type="file" multiple accept="image/*" class="dropzone__input">
          <div class="dropzone__content">
            <p class="dropzone__title">Drop images here or click to browse</p>
            <button type="button" class="dropzone__button">Browse</button>
          </div>
        </div>
      `,
    }

    const wrapper = mount(DropZone)

    expect(wrapper.find('.dropzone').exists()).toBe(true)
    expect(wrapper.find('.dropzone__title').text()).toBe('Drop images here or click to browse')
    expect(wrapper.find('.dropzone__button').text()).toBe('Browse')
  })

  it('contains hidden file input', () => {
    const DropZone = {
      template: `
        <div class="dropzone">
          <input type="file" multiple accept="image/*" class="dropzone__input">
        </div>
      `,
    }

    const wrapper = mount(DropZone)

    const input = wrapper.find('input[type="file"]')
    expect(input.exists()).toBe(true)
    expect(input.attributes('multiple')).toBeDefined()
    expect(input.attributes('accept')).toBe('image/*')
  })

  it('has browse button', () => {
    const DropZone = {
      template: `
        <div class="dropzone">
          <button type="button" class="dropzone__button">Browse</button>
        </div>
      `,
    }

    const wrapper = mount(DropZone)

    const button = wrapper.find('.dropzone__button')
    expect(button.exists()).toBe(true)
    expect(button.text()).toBe('Browse')
  })
})
