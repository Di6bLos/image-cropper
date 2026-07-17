<template>
  <div class="app-layout">
    <!-- Header bar -->
    <header class="app-header">
      <h1 class="app-header__title">Image Cropper</h1>
      <button
        v-if="imageStore.imageCount > 0"
        class="batch-export-btn"
        :disabled="batchProgress.isProcessing"
        @click="triggerBatchExport"
      >
        <span v-if="batchProgress.isProcessing">
          Processing {{ batchProgress.current }}/{{ batchProgress.total }}...
        </span>
        <span v-else>Export All</span>
      </button>
    </header>

    <!-- Two-column layout -->
    <div class="app-layout__content">
      <!-- Left sidebar: Image list -->
      <aside class="app-layout__sidebar">
        <ImageList />
      </aside>

      <!-- Main area: Crop workspace -->
      <main class="app-layout__main">
        <CropWorkspace />
      </main>
    </div>
  </div>
</template>

<script setup lang="ts">
import ImageList from '~/components/ImageList.vue'
import CropWorkspace from '~/components/CropWorkspace.vue'
import { useBatchProcessor } from '~/composables/useBatchProcessor'
import { useExportPipeline } from '~/composables/useExportPipeline'
import { useImageStore } from '~/stores/useImageStore'
import { useCropStore } from '~/stores/useCropStore'

// Page title
useHead({
  title: 'Image Cropper',
})

// Stores
const imageStore = useImageStore()
const cropStore = useCropStore()

// Batch processor and export pipeline
const batchProcessor = useBatchProcessor()
const exportPipeline = useExportPipeline()

// Batch export state
const batchProgress = ref({
  isProcessing: false,
  current: 0,
  total: 0,
  currentFilename: '',
})

/**
 * Trigger batch export of all images with current crop settings
 */
async function triggerBatchExport() {
  if (batchProgress.value.isProcessing || imageStore.imageCount === 0) return

  batchProgress.value = {
    isProcessing: true,
    current: 0,
    total: imageStore.imageCount,
    currentFilename: '',
  }

  try {
    // Get current crop settings from store
    const crop = cropStore.currentCrop

    // Process all images with current crop settings applied uniformly
    const results = await batchProcessor.processBatch(
      imageStore.images.map((img) => {
        // Use stored crop if this image was the one being cropped
        const imgCrop = img.id === crop.imageId ? crop : null
        return {
          id: img.id,
          blobUrl: img.blobUrl,
          filename: img.filename,
          cropX: imgCrop ? imgCrop.x : 0,
          cropY: imgCrop ? imgCrop.y : 0,
          cropWidth: imgCrop ? imgCrop.width : img.originalWidth,
          cropHeight: imgCrop ? imgCrop.height : img.originalHeight,
        }
      }),
      {
        format: 'jpeg',
        quality: 90,
        onProgress: (current, total, filename) => {
          batchProgress.value.current = current
          batchProgress.value.total = total
          batchProgress.value.currentFilename = filename
        },
      }
    )

    // Generate ZIP
    const zipBlob = await exportPipeline.generateZip(results, {
      format: 'jpeg',
      quality: 90,
      onProgress: (current, total) => {
        batchProgress.value.currentFilename = `Packaging ${current}/${total}...`
      },
    })

    // Trigger download
    const timestamp = new Date().toISOString().slice(0, 10)
    exportPipeline.downloadBlob(zipBlob, `cropped-images-${timestamp}.zip`)

    batchProgress.value.currentFilename = 'Export complete!'
  } catch (err) {
    console.error('Batch export failed:', err)
    batchProgress.value.currentFilename = 'Export failed'
  } finally {
    // Reset after a brief delay so user sees the message
    setTimeout(() => {
      batchProgress.value.isProcessing = false
      batchProgress.value.currentFilename = ''
    }, 2000)
  }
}
</script>

<style lang="scss" scoped>
.app-layout {
  display: flex;
  flex-direction: column;
  height: 100vh;
  background: var(--bg-primary);

  &__content {
    flex: 1;
    display: grid;
    grid-template-columns: 280px 1fr;
    overflow: hidden;
  }

  &__sidebar {
    overflow: hidden;
    border-right: 1px solid var(--border);
  }

  &__main {
    overflow: hidden;
  }
}

.app-header {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  padding: 12px 24px;
  background: var(--bg-secondary);
  border-bottom: 1px solid var(--border);

  &__title {
    margin: 0;
    font-size: 16px;
    font-weight: 600;
    color: var(--text-primary);
  }

  .batch-export-btn {
    margin-left: auto;
    padding: 6px 16px;
    font-size: 14px;
    font-weight: 500;
    color: #fff;
    background: var(--accent, #3b82f6);
    border: none;
    border-radius: 6px;
    cursor: pointer;
    transition: opacity 0.15s ease;

    &:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }

    &:not(:disabled):hover {
      opacity: 0.9;
    }
  }
}

// Responsive: stack vertically on narrow screens
@media (max-width: 768px) {
  .app-layout {
    &__content {
      grid-template-columns: 1fr;
      grid-template-rows: 200px 1fr;
    }

    &__sidebar {
      border-right: none;
      border-bottom: 1px solid var(--border);
    }
  }
}
</style>
