import JSZip from 'jszip'
import type { ExportedFile } from './useImageExport'

export async function buildAndDownloadZip(files: ExportedFile[], zipName = 'cropped-images'): Promise<void> {
  const zip = new JSZip()
  const usedNames = new Map<string, number>()

  for (const file of files) {
    zip.file(dedupeName(file.name, usedNames), file.blob)
  }

  const blob = await zip.generateAsync({ type: 'blob' })
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
  downloadBlob(blob, `${zipName}-${timestamp}.zip`)
}

function dedupeName(name: string, used: Map<string, number>): string {
  const count = used.get(name) ?? 0
  used.set(name, count + 1)
  if (count === 0) return name

  const dot = name.lastIndexOf('.')
  const base = dot > 0 ? name.slice(0, dot) : name
  const ext = dot > 0 ? name.slice(dot) : ''
  return `${base}-${count}${ext}`
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = filename
  document.body.appendChild(anchor)
  anchor.click()
  anchor.remove()
  URL.revokeObjectURL(url)
}
