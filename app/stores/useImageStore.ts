/**
 * useImageStore - Image list state management
 *
 * Manages the list of imported images, selection state, and blob URL lifecycle.
 * All imported images are tracked in the store array.
 *
 * @see PRVW-01: All imported images tracked in store array
 * @see PRVW-03: selectImage sets selected image for cropping
 * @see CROP-04: Removing image also cleans up blob URLs
 */

import { useBlobRegistry } from '~/composables/useBlobRegistry'

export interface ImageItem {
  id: string
  file: File
  blobUrl: string
  thumbnailUrl: string
  filename: string
  originalWidth: number
  originalHeight: number
}

export const useImageStore = defineStore('images', () => {
  // State
  const images = ref<ImageItem[]>([])
  const selectedId = ref<string | null>(null)

  // Computed
  const selectedImage = computed<ImageItem | null>(() =>
    images.value.find(img => img.id === selectedId.value) || null,
  )

  const imageCount = computed(() => images.value.length)
  const hasImages = computed(() => images.value.length > 0)
  const hasSelection = computed(() => selectedId.value !== null)

  /**
   * Add an image to the store
   */
  function addImage(item: ImageItem): void {
    images.value.push(item)
  }

  /**
   * Remove an image and revoke its blob URLs
   */
  function removeImage(id: string): void {
    const index = images.value.findIndex(img => img.id === id)
    if (index !== -1) {
      const img = images.value[index]

      // Revoke blob URLs to free memory
      const blobRegistry = useBlobRegistry()
      blobRegistry.revoke(img.blobUrl)
      blobRegistry.revoke(img.thumbnailUrl)

      // Remove from array
      images.value.splice(index, 1)

      // Clear selection if removed image was selected
      if (selectedId.value === id) {
        selectedId.value = null
      }
    }
  }

  /**
   * Select an image for cropping
   */
  function selectImage(id: string): void {
    if (images.value.some(img => img.id === id)) {
      selectedId.value = id
    }
  }

  /**
   * Clear selection
   */
  function clearSelection(): void {
    selectedId.value = null
  }

  /**
   * Clear all images and revoke all blob URLs
   */
  function clearAll(): void {
    const blobRegistry = useBlobRegistry()

    images.value.forEach(img => {
      blobRegistry.revoke(img.blobUrl)
      blobRegistry.revoke(img.thumbnailUrl)
    })

    images.value = []
    selectedId.value = null
  }

  /**
   * Get image by ID
   */
  function getImage(id: string): ImageItem | undefined {
    return images.value.find(img => img.id === id)
  }

  /**
   * Update an image's metadata
   */
  function updateImage(id: string, updates: Partial<Omit<ImageItem, 'id' | 'file'>>): void {
    const img = images.value.find(img => img.id === id)
    if (img) {
      Object.assign(img, updates)
    }
  }

  return {
    // State (readonly wrappers)
    images: readonly(images),
    selectedId: readonly(selectedId),

    // Computed
    selectedImage,
    imageCount,
    hasImages,
    hasSelection,

    // Actions
    addImage,
    removeImage,
    selectImage,
    clearSelection,
    clearAll,
    getImage,
    updateImage,
  }
})
