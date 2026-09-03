import { nextTick } from 'vue'
import { useImageStore } from '../stores/useImageStore'
import { useSettingsStore } from '../stores/useSettingsStore'
import { useToast } from './useToast'
import { createObjectUrl } from './useObjectUrls'
import { getFullImageCropRect } from './useCropEngine'
import { rasterizePdf, pdfPageName, MAX_PDF_PAGES } from './usePdfRasterize'
import type { ImportedImage } from '../types/image'

const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/bmp']
const PDF_TYPE = 'application/pdf'

export function useFileImport() {
  const imageStore = useImageStore()
  const settingsStore = useSettingsStore()
  const { show } = useToast()

  async function importFiles(fileList: FileList | File[]) {
    const files = Array.from(fileList)
    const accepted: ImportedImage[] = []
    const rejected: string[] = []

    for (const file of files) {
      if (file.type === PDF_TYPE) {
        try {
          const { pages, totalPages } = await rasterizePdf(file)
          for (const page of pages) {
            const name = pdfPageName(file.name, page.pageNumber)
            accepted.push({
              id: crypto.randomUUID(),
              file: new File([page.blob], `${name}.png`, { type: 'image/png' }),
              name,
              url: createObjectUrl(page.blob),
              naturalWidth: page.width,
              naturalHeight: page.height,
              cropRect: getFullImageCropRect(page.width, page.height),
              status: 'ready',
              focalPoint: null,
              aiCropStatus: 'idle',
            })
          }
          if (totalPages > MAX_PDF_PAGES) {
            show(
              `${file.name} has ${totalPages} pages — imported the first ${MAX_PDF_PAGES}`,
              'info',
            )
          }
        } catch {
          rejected.push(file.name)
        }
        continue
      }

      if (!ACCEPTED_TYPES.includes(file.type)) {
        rejected.push(file.name)
        continue
      }
      try {
        const { width, height } = await readImageDimensions(file)
        accepted.push({
          id: crypto.randomUUID(),
          file,
          name: file.name,
          url: createObjectUrl(file),
          naturalWidth: width,
          naturalHeight: height,
          cropRect: getFullImageCropRect(width, height),
          status: 'ready',
          focalPoint: null,
          aiCropStatus: 'idle',
        })
      } catch {
        rejected.push(file.name)
      }
    }

    if (accepted.length && imageStore.images.length === 0) {
      // First upload: default to Custom size (px) at the first image's own resolution,
      // so the initial crop covers the whole image. Flush the App.vue ratio watcher
      // against the still-empty list before adding, so it doesn't overwrite the
      // full-image crop rects the imported images already carry.
      settingsStore.mode = 'custom-px'
      settingsStore.customPxWidth = accepted[0].naturalWidth
      settingsStore.customPxHeight = accepted[0].naturalHeight
      await nextTick()
    }

    if (accepted.length) {
      imageStore.addImages(accepted)
      show(`Imported ${accepted.length} image${accepted.length === 1 ? '' : 's'}`, 'success')
    }
    if (rejected.length) {
      show(`Skipped ${rejected.length} unsupported file${rejected.length === 1 ? '' : 's'}`, 'error')
    }
  }

  return { importFiles }
}

function readImageDimensions(file: File): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const image = new Image()
    const tempUrl = URL.createObjectURL(file)
    image.onload = () => {
      resolve({ width: image.naturalWidth, height: image.naturalHeight })
      URL.revokeObjectURL(tempUrl)
    }
    image.onerror = () => {
      URL.revokeObjectURL(tempUrl)
      reject(new Error(`Failed to load image: ${file.name}`))
    }
    image.src = tempUrl
  })
}
