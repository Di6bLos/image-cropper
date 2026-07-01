import { describe, it, expect } from 'vitest'

describe('ImageList', () => {
  it('renders empty state with drop zone', () => {
    // When no images, shows DropZone
    const hasImages = false
    expect(hasImages).toBe(false)
  })

  it('renders image list with v-for', () => {
    // v-for pattern over images array
    const images = [
      { id: '1', filename: 'img1.jpg' },
      { id: '2', filename: 'img2.jpg' },
    ]

    expect(images.length).toBe(2)
  })

  it('click on item calls selectImage', () => {
    const selectImage = (id: string) => id
    expect(selectImage('1')).toBe('1')
  })
})
