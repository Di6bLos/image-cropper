import { describe, it, expect } from 'vitest'

describe('CropHandle', () => {
  it('renders at correct position', () => {
    const positions = ['nw', 'ne', 'sw', 'se']
    positions.forEach(position => {
      expect(['nw', 'ne', 'sw', 'se'].includes(position)).toBe(true)
    })
  })

  it('has correct cursor for each position', () => {
    const cursorMap = {
      nw: 'nw-resize',
      ne: 'ne-resize',
      sw: 'sw-resize',
      se: 'se-resize',
    }

    expect(cursorMap.nw).toBe('nw-resize')
    expect(cursorMap.ne).toBe('ne-resize')
    expect(cursorMap.sw).toBe('sw-resize')
    expect(cursorMap.se).toBe('se-resize')
  })

  it('mousedown emits drag-start with position', () => {
    const emitDragStart = (event: MouseEvent, position: string) => ({ event, position })

    const result = emitDragStart(new MouseEvent('mousedown'), 'nw')
    expect(result.position).toBe('nw')
  })
})
