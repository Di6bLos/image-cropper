import type { OutputFormat } from '../types/export'

/** Slugifies a filename (dropping its extension) into a safe, zip-friendly base name. */
export function sanitizeFilename(name: string): string {
  const lastDot = name.lastIndexOf('.')
  const base = lastDot > 0 ? name.slice(0, lastDot) : name

  const slug = base
    .normalize('NFKD')
    .replace(/[^a-zA-Z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 100)

  return slug || 'image'
}

export function extensionForFormat(format: OutputFormat): string {
  switch (format) {
    case 'image/jpeg':
      return 'jpg'
    case 'image/png':
      return 'png'
    case 'image/webp':
      return 'webp'
  }
}
