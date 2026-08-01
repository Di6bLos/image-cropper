<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useImageStore } from '../stores/useImageStore'
import { useSettingsStore } from '../stores/useSettingsStore'
import { exportImages } from '../composables/useImageExport'
import { buildAndDownloadZip } from '../composables/useZipExport'
import { useToast } from '../composables/useToast'
import { useBatchPreviewSize } from '../composables/useExportPreview'
import { formatBytes } from '../composables/useFileSize'

const imageStore = useImageStore()
const settingsStore = useSettingsStore()
const { show } = useToast()
const batchPreview = useBatchPreviewSize()

const isExporting = ref(false)
const progress = ref({ completed: 0, total: 0 })

const canExport = computed(() => imageStore.images.length > 0 && !isExporting.value)
const supportsQuality = computed(() => settingsStore.outputFormat !== 'image/png')

const batchWatchKey = computed(() =>
  JSON.stringify([
    settingsStore.outputFormat,
    settingsStore.quality,
    settingsStore.outputSize,
    imageStore.images.length,
  ]),
)

watch(
  batchWatchKey,
  () =>
    batchPreview.schedule(imageStore.images, {
      format: settingsStore.outputFormat,
      quality: settingsStore.quality,
      outputSize: settingsStore.outputSize,
    }),
  { immediate: true },
)

async function exportAll() {
  if (!imageStore.images.length) return
  isExporting.value = true
  progress.value = { completed: 0, total: imageStore.images.length }

  try {
    const files = await exportImages(imageStore.images, {
      format: settingsStore.outputFormat,
      quality: settingsStore.quality,
      outputSize: settingsStore.outputSize,
      onProgress: (completed, total) => {
        progress.value = { completed, total }
      },
      onImageStart: (id) => imageStore.setStatus(id, 'exporting'),
      onImageDone: (id) => imageStore.setStatus(id, 'done'),
      onImageError: (id) => imageStore.setStatus(id, 'error'),
    })

    if (files.length) {
      await buildAndDownloadZip(files)
      show(`Exported ${files.length} image${files.length === 1 ? '' : 's'}`, 'success')
    } else {
      show('Nothing to export', 'error')
    }
  } catch (error) {
    console.error('Export failed:', error)
    show('Export failed. Please try again.', 'error')
  } finally {
    isExporting.value = false
  }
}
</script>

<template>
  <section class="export-panel">
    <h2 class="export-panel__heading">Export</h2>

    <label class="export-panel__field">
      Format
      <select v-model="settingsStore.outputFormat">
        <option value="image/jpeg">JPEG</option>
        <option value="image/png">PNG</option>
        <option value="image/webp">WebP</option>
      </select>
    </label>

    <label v-if="supportsQuality" class="export-panel__field">
      Quality ({{ Math.round(settingsStore.quality * 100) }}%)
      <input type="range" min="0.5" max="1" step="0.01" v-model.number="settingsStore.quality" />
    </label>

    <p v-if="imageStore.images.length" class="export-panel__size-preview">
      <template v-if="batchPreview.isCalculating.value">Calculating total size…</template>
      <template v-else-if="batchPreview.totalBytes.value != null">
        Estimated total: ~{{ formatBytes(batchPreview.totalBytes.value) }}
      </template>
    </p>

    <button type="button" class="export-panel__button" :disabled="!canExport" @click="exportAll">
      {{ isExporting ? `Exporting ${progress.completed}/${progress.total}…` : 'Export all as ZIP' }}
    </button>

    <div v-if="isExporting" class="export-panel__progress">
      <div
        class="export-panel__progress-bar"
        :style="{ width: `${progress.total ? (progress.completed / progress.total) * 100 : 0}%` }"
      />
    </div>
  </section>
</template>

<style scoped lang="scss">
@use '../assets/styles/variables' as *;

.export-panel {
  display: flex;
  flex-direction: column;
  gap: $space-sm;
}

.export-panel__heading {
  margin: 0;
  font-size: 1rem;
}

.export-panel__field {
  display: flex;
  flex-direction: column;
  gap: $space-xs;
  font-size: 0.9rem;

  select,
  input[type='range'] {
    padding: $space-xs;
  }

  select {
    border: 1px solid $color-border;
    border-radius: $radius-sm;
  }
}

.export-panel__size-preview {
  margin: 0;
  font-size: 0.85rem;
  color: $color-text-muted;
}

.export-panel__button {
  padding: $space-sm;
  border: none;
  border-radius: $radius-sm;
  background: $color-primary;
  color: #fff;
  cursor: pointer;

  &:hover:not(:disabled) {
    background: $color-primary-hover;
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
}

.export-panel__progress {
  height: 6px;
  border-radius: 3px;
  background: $color-surface-hover;
  overflow: hidden;
}

.export-panel__progress-bar {
  height: 100%;
  background: $color-primary;
  transition: width 0.15s ease;
}
</style>
