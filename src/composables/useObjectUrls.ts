const registry = new Set<string>()

export function createObjectUrl(blob: Blob): string {
  const url = URL.createObjectURL(blob)
  registry.add(url)
  return url
}

export function revokeObjectUrl(url: string): void {
  if (registry.has(url)) {
    URL.revokeObjectURL(url)
    registry.delete(url)
  }
}

export function revokeAllObjectUrls(): void {
  registry.forEach((url) => URL.revokeObjectURL(url))
  registry.clear()
}
