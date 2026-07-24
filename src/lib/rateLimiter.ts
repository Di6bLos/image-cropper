const sleep = (ms: number): Promise<void> => new Promise((resolve) => setTimeout(resolve, ms))

export interface RateLimiter {
  /** Resolves when a slot is free, recording a call against the rolling window. */
  acquire(): Promise<void>
}

/**
 * Sliding-window rate limiter. Records the timestamp of each `acquire()` and
 * blocks while `maxRequests` calls have been made within the last `windowMs`.
 * Intended for a single sequential consumer (the AI Crop loop) — there is no
 * concurrency guard on the internal timestamp array.
 */
export function createRateLimiter(maxRequests: number, windowMs: number): RateLimiter {
  const timestamps: number[] = []

  async function acquire(): Promise<void> {
    for (;;) {
      const now = Date.now()
      while (timestamps.length > 0 && timestamps[0] <= now - windowMs) {
        timestamps.shift()
      }
      if (timestamps.length < maxRequests) {
        timestamps.push(now)
        return
      }
      // Wait until the oldest recorded call falls out of the window.
      await sleep(timestamps[0] + windowMs - now)
    }
  }

  return { acquire }
}