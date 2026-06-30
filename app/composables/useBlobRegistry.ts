/**
 * useBlobRegistry - Centralized Blob URL lifecycle management
 *
 * Prevents Blob URL leaks by tracking all created URLs in a Set and
 * providing automatic cleanup via onUnmounted.
 *
 * @see D-05
 */
export interface BlobRegistry {
  create: (blob: Blob) => string
  revoke: (url: string) => void
  revokeAll: () => void
  urls: Readonly<Set<string>>
}

export function useBlobRegistry(): BlobRegistry {
  // Early return for SSR safety (D-02)
  if (!process.client) {
    return {
      create: () => '',
      revoke: () => {},
      revokeAll: () => {},
      urls: new Set(),
    }
  }

  // Internal Set to track all created Blob URLs
  const urls = new Set<string>()

  /**
   * Create a Blob URL from a Blob object
   * @param blob - The Blob to create a URL for
   * @returns The created Blob URL string
   */
  function create(blob: Blob): string {
    const url = URL.createObjectURL(blob)
    urls.add(url)
    return url
  }

  /**
   * Revoke a specific Blob URL and remove it from tracking
   * @param url - The Blob URL to revoke
   */
  function revoke(url: string): void {
    if (urls.has(url)) {
      URL.revokeObjectURL(url)
      urls.delete(url)
    }
  }

  /**
   * Revoke all tracked Blob URLs and clear the registry
   */
  function revokeAll(): void {
    urls.forEach((url) => {
      URL.revokeObjectURL(url)
    })
    urls.clear()
  }

  // Auto-cleanup on component unmount
  onUnmounted(() => {
    revokeAll()
  })

  return {
    create,
    revoke,
    revokeAll,
    urls: urls as Readonly<Set<string>>,
  }
}
