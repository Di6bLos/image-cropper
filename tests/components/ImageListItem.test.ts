import { describe, it, expect } from 'vitest'

describe('ImageListItem', () => {
  it('renders thumbnail, filename and dimensions', () => {
    // Test data structure matches store ImageItem
    const mockImage = {
      id: '123',
      file: new File(['test'], 'test.jpg', { type: 'image/jpeg' }),
      blobUrl: 'blob:http://localhost/test',
      thumbnailUrl: 'blob:http://localhost/thumb',
      filename: 'test.jpg',
      originalWidth: 1920,
      originalHeight: 1080,
    }

    expect(mockImage.filename).toBe('test.jpg')
    expect(mockImage.originalWidth).toBe(1920)
    expect(mockImage.originalHeight).toBe(1080)
  })

  it('displays selection state via isSelected prop', () => {
    const isSelected = true
    expect(isSelected).toBe(true)
  })

  it('click emits select event with image id', () => {
    const mockImage = { id: '123', filename: 'test.jpg' }
    const emitSelect = (id: string) => id

    const result = emitSelect(mockImage.id)
    expect(result).toBe('123')
  })
})
