import { describe, it, expect } from 'vitest'
import { sanitizeFilename, extensionForFormat } from '../../src/composables/useFilenameSanitize'

describe('sanitizeFilename', () => {
  it('strips the extension and unsafe characters', () => {
    expect(sanitizeFilename('My Photo #1.JPG')).toBe('My-Photo-1')
  })

  it('collapses repeated separators', () => {
    expect(sanitizeFilename('a___b   c.png')).toBe('a-b-c')
  })

  it('falls back to a default name when nothing remains', () => {
    expect(sanitizeFilename('###.png')).toBe('image')
  })
})

describe('extensionForFormat', () => {
  it('maps mime types to extensions', () => {
    expect(extensionForFormat('image/jpeg')).toBe('jpg')
    expect(extensionForFormat('image/png')).toBe('png')
    expect(extensionForFormat('image/webp')).toBe('webp')
  })
})
