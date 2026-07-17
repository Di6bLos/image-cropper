/**
 * useExportPipeline - Streaming ZIP generation for batch exports
 *
 * Uses JSZip to generate ZIP archives from processed image blobs
 * with per-file progress reporting.
 *
 * @see EXPT-05: Multiple images bundled into single ZIP
 * @see EXPT-06: Streaming ZIP to avoid memory exhaustion
 */

import JSZip from 'jszip'
import type { ProcessedResult } from '~/composables/useBatchProcessor'

export interface ExportPipelineOptions {
  format: 'jpeg' | 'png' | 'webp'
  quality: number // 1-100
  onProgress?: (current: number, total: number) => void
  onComplete?: (zipBlob: Blob) => void
  onError?: (error: Error, filename: string) => void
}

export function useExportPipeline() {
  // Early return for SSR safety
  if (!process.client) {
    return {
      generateZip: () => Promise.resolve(new Blob()),
    }
  }

  /**
   * Generate a ZIP file from processed results
   */
  async function generateZip(
    results: ProcessedResult[],
    options: ExportPipelineOptions
  ): Promise<Blob> {
    const zip = new JSZip()

    // Track filenames to handle collisions
    const usedFilenames = new Map<string, number>()

    // Add each file to the ZIP
    for (let i = 0; i < results.length; i++) {
      const result = results[i]
      const { filename } = result

      try {
        // Handle filename collisions
        let zipFilename = filename
        if (usedFilenames.has(filename)) {
          const count = usedFilenames.get(filename)! + 1
          usedFilenames.set(filename, count)
          const ext = filename.lastIndexOf('.')
          if (ext > 0) {
            zipFilename = `${filename.slice(0, ext)}-${count}${filename.slice(ext)}`
          } else {
            zipFilename = `${filename}-${count}`
          }
        } else {
          usedFilenames.set(filename, 1)
        }

        zip.file(zipFilename, result.blob)
        options.onProgress?.(i + 1, results.length)
      } catch (err) {
        options.onError?.(err instanceof Error ? err : new Error(String(err)), filename)
      }
    }

    // Generate the ZIP blob
    try {
      const zipBlob = await zip.generateAsync({ type: 'blob', streamFiles: true })
      options.onComplete?.(zipBlob)
      return zipBlob
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err))
      options.onError?.(error, 'zip generation')
      throw error
    }
  }

  /**
   * Trigger browser download of a blob
   */
  function downloadBlob(blob: Blob, filename: string): void {
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  return {
    generateZip,
    downloadBlob,
  }
}
