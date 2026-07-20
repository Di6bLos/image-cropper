import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { CropRect, ImageStatus, ImportedImage } from '../types/image'
import { revokeObjectUrl } from '../composables/useObjectUrls'

export const useImageStore = defineStore('images', () => {
  const images = ref<ImportedImage[]>([])
  const activeImageId = ref<string | null>(null)

  const activeImage = computed(() => images.value.find((img) => img.id === activeImageId.value) ?? null)

  function addImages(newImages: ImportedImage[]) {
    images.value.push(...newImages)
    if (!activeImageId.value && newImages.length) {
      activeImageId.value = newImages[0].id
    }
  }

  function removeImage(id: string) {
    const index = images.value.findIndex((img) => img.id === id)
    if (index === -1) return
    const [removed] = images.value.splice(index, 1)
    revokeObjectUrl(removed.url)
    if (activeImageId.value === id) {
      activeImageId.value = images.value[0]?.id ?? null
    }
  }

  function clearAll() {
    images.value.forEach((img) => revokeObjectUrl(img.url))
    images.value = []
    activeImageId.value = null
  }

  function setActiveImage(id: string) {
    activeImageId.value = id
  }

  function setCropRect(id: string, rect: CropRect) {
    const image = images.value.find((img) => img.id === id)
    if (image) image.cropRect = rect
  }

  function setStatus(id: string, status: ImageStatus) {
    const image = images.value.find((img) => img.id === id)
    if (image) image.status = status
  }

  function applyToAll(computeRect: (image: ImportedImage) => CropRect) {
    images.value.forEach((img) => {
      img.cropRect = computeRect(img)
    })
  }

  return {
    images,
    activeImageId,
    activeImage,
    addImages,
    removeImage,
    clearAll,
    setActiveImage,
    setCropRect,
    setStatus,
    applyToAll,
  }
})
