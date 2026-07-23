import { useImageStore } from '../stores/useImageStore'
import { useSettingsStore } from '../stores/useSettingsStore'
import { useToast } from './useToast'
import { createObjectUrl } from './useObjectUrls'
import { getCenteredCropRect } from './useCropEngine'
import type { ImportedImage } from '../types/image'

const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/bmp']

export function useFileImport() {
  const imageStore = useImageStore()
  const settingsStore = useSettingsStore()
  const { show } = useToast()

  async function importFiles(fileList: FileList | File[]) {
    const files = Array.from(fileList)
    const accepted: ImportedImage[] = []
    const rejected: string[] = []

    for (const file of files) {
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
          cropRect: getCenteredCropRect(width, height, settingsStore.ratio),
          status: 'ready',
          focalPoint: null,
          aiCropStatus: 'idle',
        })
      } catch {
        rejected.push(file.name)
      }
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
