<template>
  <div class="image-list">
    <!-- Header with "Add more" button -->
    <div class="image-list__header">
      <h3 class="image-list__title">
        Images
        <span v-if="imageStore.imageCount > 0" class="image-list__count">
          ({{ imageStore.imageCount }})
        </span>
      </h3>
      <IconButton
        v-if="imageStore.hasImages"
        icon="plus"
        aria-label="Add more images"
        size="sm"
        @click="triggerFilePicker"
      />
    </div>

    <!-- List content -->
    <div class="image-list__content">
      <!-- Empty state: DropZone inside list area -->
      <template v-if="!imageStore.hasImages">
        <DropZone
          ref="dropZoneRef"
          title="Drop images here or click to browse"
          @files-added="onFilesAdded"
        />
      </template>

      <!-- Image list with scroll -->
      <template v-else>
        <div class="image-list__items">
          <ImageListItem
            v-for="image in imageStore.images"
            :key="image.id"
            :image="image"
            :is-selected="image.id === imageStore.selectedId"
            @select="onSelectImage"
          />
        </div>

        <!-- Add more drop zone at bottom -->
        <div class="image-list__add-more">
          <DropZone
            ref="addMoreDropZoneRef"
            title="Add more images"
            @files-added="onFilesAdded"
          />
        </div>
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useImageStore } from '~/stores/useImageStore'
import { useThumbnail } from '~/composables/useThumbnail'
import { useBlobRegistry } from '~/composables/useBlobRegistry'

const imageStore = useImageStore()
const { generateThumbnail } = useThumbnail()
const blobRegistry = useBlobRegistry()

// Refs for DropZone imperative access
const dropZoneRef = ref<{ openFilePicker: () => void } | null>(null)
const addMoreDropZoneRef = ref<{ openFilePicker: () => void } | null>(null)

// Trigger file picker on "Add more" button click
function triggerFilePicker() {
  // Use the addMoreDropZone if available, otherwise use the main one
  if (addMoreDropZoneRef.value?.openFilePicker) {
    addMoreDropZoneRef.value.openFilePicker()
  } else if (dropZoneRef.value?.openFilePicker) {
    dropZoneRef.value.openFilePicker()
  }
}

// Handle image selection
function onSelectImage(id: string) {
  imageStore.selectImage(id)
}

// Handle files added via drop or picker
async function onFilesAdded(files: File[]) {
  for (const file of files) {
    // Create blob URL for the original image
    const blobUrl = blobRegistry.create(file)

    // Get image dimensions
    const img = new Image()
    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve()
      img.onerror = reject
      img.src = blobUrl
    })

    // Generate thumbnail
    const thumbnailResult = await generateThumbnail(file)

    // Add to store
    imageStore.addImage({
      id: crypto.randomUUID(),
      file,
      blobUrl,
      thumbnailUrl: thumbnailResult?.blobUrl || blobUrl, // Fallback to full image
      filename: file.name,
      originalWidth: img.naturalWidth,
      originalHeight: img.naturalHeight,
    })
  }

  // Auto-select first image if none selected
  if (!imageStore.hasSelection && imageStore.images.length > 0) {
    imageStore.selectImage(imageStore.images[0].id)
  }
}
</script>

<style lang="scss" scoped>
.image-list {
  --il-bg: var(--bg-primary, #ffffff);
  --il-bg-secondary: var(--bg-secondary, #f5f5f5);
  --il-text: var(--text-primary, #1a1a1a);
  --il-text-secondary: var(--text-secondary, #666666);
  --il-border: var(--border, #e0e0e0);

  display: flex;
  flex-direction: column;
  height: 100%;
  background: var(--il-bg);
  border: 1px solid var(--il-border);
  border-radius: 8px;
  overflow: hidden;

  &__header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 12px 16px;
    border-bottom: 1px solid var(--il-border);
    background: var(--il-bg-secondary);
  }

  &__title {
    margin: 0;
    font-size: 14px;
    font-weight: 600;
    color: var(--il-text);
  }

  &__count {
    font-weight: 400;
    color: var(--il-text-secondary);
  }

  &__content {
    flex: 1;
    display: flex;
    flex-direction: column;
    overflow: hidden;
    padding: 12px;
  }

  &__items {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 8px;
    overflow-y: auto;
    padding-right: 4px;
    margin-bottom: 12px;

    // Custom scrollbar
    &::-webkit-scrollbar {
      width: 6px;
    }

    &::-webkit-scrollbar-track {
      background: transparent;
    }

    &::-webkit-scrollbar-thumb {
      background: var(--il-border);
      border-radius: 3px;

      &:hover {
        background: var(--il-text-secondary);
      }
    }
  }

  &__add-more {
    flex-shrink: 0;

    :deep(.dropzone) {
      padding: 16px;
    }
  }
}

// Dark mode
@media (prefers-color-scheme: dark) {
  .image-list {
    --il-bg: var(--bg-primary, #1a1a1a);
    --il-bg-secondary: var(--bg-secondary, #2d2d2d);
    --il-text: var(--text-primary, #f5f5f5);
    --il-text-secondary: var(--text-secondary, #a0a0a0);
    --il-border: var(--border, #404040);
  }
}
</style>
