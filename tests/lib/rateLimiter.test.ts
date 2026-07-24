import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { createRateLimiter } from '../../src/lib/rateLimiter'

describe('createRateLimiter', () => {
  beforeEach(() => vi.useFakeTimers())
  afterEach(() => vi.useRealTimers())

  it('lets the first maxRequests calls through without waiting', async () => {
    const limiter = createRateLimiter(3, 1000)
    const start = Date.now()
    await limiter.acquire()
    await limiter.acquire()
    await limiter.acquire()
    expect(Date.now()).toBe(start)
  })

  it('blocks the next call until the oldest timestamp exits the window', async () => {
    const limiter = createRateLimiter(2, 1000)
    const start = Date.now()
    await limiter.acquire() // t=start
    await limiter.acquire() // t=start
    const acquirePromise = limiter.acquire() // needs t=start+1000

    let resolved = false
    acquirePromise.then(() => {
      resolved = true
    })

    await vi.advanceTimersByTimeAsync(999)
    expect(resolved).toBe(false)

    await vi.advanceTimersByTimeAsync(1)
    expect(resolved).toBe(true)
    expect(Date.now()).toBe(start + 1000)
  })

  it('prunes timestamps and allows a fresh burst after the window slides', async () => {
    const limiter = createRateLimiter(2, 1000)
    await limiter.acquire()
    await limiter.acquire()
    await vi.advanceTimersByTimeAsync(1000)
    // Window has slid; both prior calls are pruned.
    const start = Date.now()
    await limiter.acquire()
    await limiter.acquire()
    expect(Date.now()).toBe(start)
  })

  it('respects configurable maxRequests and windowMs', async () => {
    const limiter = createRateLimiter(1, 500)
    await limiter.acquire()
    const acquirePromise = limiter.acquire()
    let resolved = false
    acquirePromise.then(() => {
      resolved = true
    })
    await vi.advanceTimersByTimeAsync(499)
    expect(resolved).toBe(false)
    await vi.advanceTimersByTimeAsync(1)
    expect(resolved).toBe(true)
  })
})