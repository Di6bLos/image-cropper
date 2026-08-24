import { describe, it, expect } from 'vitest'
import { formatBytes } from '../../src/composables/useFileSize'

describe('formatBytes', () => {
  it('formats zero bytes', () => {
    expect(formatBytes(0)).toBe('0 B')
  })

  it('formats sub-1024 byte counts without decimals', () => {
    expect(formatBytes(512)).toBe('512 B')
  })

  it('formats exactly 1024 bytes as 1 KB', () => {
    expect(formatBytes(1024)).toBe('1.0 KB')
  })

  it('formats fractional megabytes', () => {
    expect(formatBytes(1_536_000)).toBe('1.5 MB')
  })

  it('formats gigabytes', () => {
    expect(formatBytes(2_147_483_648)).toBe('2.0 GB')
  })

  it('returns a placeholder for negative or non-finite input', () => {
    expect(formatBytes(-5)).toBe('—')
    expect(formatBytes(NaN)).toBe('—')
    expect(formatBytes(Infinity)).toBe('—')
  })
})
