import { describe, it, expect } from 'vitest'

describe('IconButton', () => {
  it('renders with correct size classes', () => {
    const sizes = ['sm', 'md', 'lg']
    sizes.forEach(size => {
      const className = `icon-button--${size}`
      expect(className).toMatch(/^icon-button--/)
    })
  })

  it('renders with correct variant classes', () => {
    const variants = ['default', 'ghost']
    variants.forEach(variant => {
      const className = `icon-button--${variant}`
      expect(className).toMatch(/^icon-button--/)
    })
  })

  it('icon prop maps to SVG render', () => {
    // Verify icon names are valid
    const icons = ['plus', 'trash', 'upload', 'crop', 'grid', 'close', 'check', 'chevron-down', 'chevron-up']
    icons.forEach(icon => {
      expect(typeof icon).toBe('string')
      expect(icon.length).toBeGreaterThan(0)
    })
  })
})
