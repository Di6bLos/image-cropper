/**
 * useFilenameSanitize - Safe filename handling for ZIP archives
 *
 * Strips path separators, null bytes, reserved characters, and control characters
 * from user-provided filenames before adding them to ZIP archives.
 *
 * @see EXPT-05: Original filenames preserved with "_cropped" suffix
 */

const MAX_FILENAME_LENGTH = 200

/**
 * Sanitize a filename for use in ZIP archive.
 * - Removes path separators (prevents path traversal)
 * - Removes null bytes
 * - Replaces reserved Windows characters with underscore
 * - Removes control characters
 * - Limits total length to 200 chars (ZIP spec limit is 255, conservatively reduced)
 */
export function sanitizeFilename(name: string): string {
  // Get base name without any path
  const base = name.replace(/^.*[\\/]/, '').replace(/\0/g, '')

  return base
    // Replace reserved Windows filename characters
    .replace(/[<>:"|?*]/g, '_')
    // Remove control characters (0x00-0x1F)
    .replace(/[\x00-\x1f]/g, '')
    // Collapse multiple dots to single dot
    .replace(/\.{2,}/g, '.')
    // Remove leading dots (hidden files on Unix)
    .replace(/^\.+/, '')
    // Limit length
    .slice(0, MAX_FILENAME_LENGTH)
    // Ensure something remains
    || 'unnamed'
}

/**
 * Build the export filename with optional "_cropped" suffix.
 * Strips original extension, applies sanitization, appends suffix and new extension.
 *
 * @param originalName - Original filename from user
 * @param extension - Target extension (without dot), e.g. 'jpg', 'png'
 * @param addSuffix - Whether to append "_cropped" before the extension
 */
export function buildExportFilename(
  originalName: string,
  extension: string,
  addSuffix: boolean
): string {
  // Sanitize the original name
  const sanitized = sanitizeFilename(originalName)

  // Remove original extension
  const base = sanitized.replace(/\.[^.]+$/, '')

  // Build suffix
  const suffix = addSuffix ? '_cropped' : ''

  // Build final filename (extension is e.g. 'jpg', not '.jpg')
  return `${base}${suffix}.${extension}`
}
