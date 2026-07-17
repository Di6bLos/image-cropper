<template>
  <ClientOnly>
    <Teleport to="body">
      <div v-if="isOpen" class="modal-backdrop" @click.self="handleBackdropClick">
        <div class="modal" role="dialog" aria-modal="true" aria-labelledby="export-modal-title">
          <!-- Header -->
          <header class="modal__header">
            <h2 id="export-modal-title" class="modal__title">Export Settings</h2>
            <button
              class="modal__close"
              aria-label="Close export modal"
              @click="hide"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </header>

          <!-- Body -->
          <div class="modal__body">
            <!-- Format Selection -->
            <fieldset class="format-group">
              <legend class="format-group__label">Format</legend>
              <div class="format-group__options">
                <label
                  v-for="fmt in formats"
                  :key="fmt"
                  class="format-option"
                  :class="{ 'format-option--selected': options.format === fmt }"
                >
                  <input
                    type="radio"
                    :value="fmt"
                    v-model="options.format"
                    class="format-option__input"
                  />
                  <span class="format-option__label">{{ fmt.toUpperCase() }}</span>
                </label>
              </div>
            </fieldset>

            <!-- Quality Slider (hidden for PNG) -->
            <div v-if="options.format !== 'png'" class="quality-control">
              <label for="quality-slider" class="quality-control__label">
                Quality: {{ options.quality }}
                <span v-if="options.format === 'jpeg'" class="quality-control__hint">(recommended: 85-92)</span>
                <span v-if="options.format === 'webp'" class="quality-control__hint">(recommended: 80-90)</span>
              </label>
              <input
                id="quality-slider"
                type="range"
                min="1"
                max="100"
                step="1"
                v-model.number="options.quality"
                class="quality-control__slider"
              />
              <div class="quality-control__range-labels">
                <span>Low</span>
                <span>High</span>
              </div>
            </div>

            <!-- PNG Notice -->
            <p v-else class="png-notice">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="png-notice__icon">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              PNG is lossless — quality setting does not apply
            </p>

            <!-- Suffix Toggle -->
            <label class="suffix-toggle">
              <input
                type="checkbox"
                v-model="options.addSuffix"
                class="suffix-toggle__input"
              />
              <span class="suffix-toggle__box"></span>
              <span class="suffix-toggle__label">Add "_cropped" suffix to filenames</span>
            </label>

            <!-- Image Count -->
            <p class="export-info">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="export-info__icon">
                <rect x="3" y="3" width="18" height="18" rx="2" />
                <circle cx="8.5" cy="8.5" r="1.5" />
                <polyline points="21 15 16 10 5 21" />
              </svg>
              {{ imageStore.imageCount }} image{{ imageStore.imageCount === 1 ? '' : 's' }} will be exported
            </p>
          </div>

          <!-- Footer -->
          <footer class="modal__footer">
            <button
              type="button"
              class="btn btn--secondary"
              @click="hide"
              :disabled="isExporting"
            >
              Cancel
            </button>
            <button
              type="button"
              class="btn btn--primary"
              @click="handleExport"
              :disabled="isExporting || imageStore.imageCount === 0"
            >
              <span v-if="isExporting" class="btn__spinner"></span>
              <span>{{ isExporting ? `Exporting ${progress.current}/${progress.total}...` : 'Download ZIP' }}</span>
            </button>
          </footer>

          <!-- Progress Bar (shown during export) -->
          <div v-if="isExporting" class="modal__progress">
            <div class="progress-bar">
              <div
                class="progress-bar__fill"
                :style="{ width: `${progressPercent}%` }"
              ></div>
            </div>
            <p class="progress-bar__label">
              {{ progress.filename || 'Processing...' }}
            </p>
          </div>
        </div>
      </div>
    </Teleport>
  </ClientOnly>
</template>

<script setup lang="ts">
import { useExportModal } from '~/composables/useExportModal'
import { useImageStore } from '~/stores/useImageStore'
import { useCropStore } from '~/stores/useCropStore'
import { useBatchProcessor } from '~/composables/useBatchProcessor'
import { useExportPipeline } from '~/composables/useExportPipeline'
import { buildExportFilename } from '~/composables/useFilenameSanitize'

const { isOpen, options, isExporting, hide, getOptions } = useExportModal()
const imageStore = useImageStore()
const cropStore = useCropStore()
const batchProcessor = useBatchProcessor()
const exportPipeline = useExportPipeline()

const formats: Array<'jpeg' | 'png' | 'webp'> = ['jpeg', 'png', 'webp']

// Progress tracking
const progress = ref({
  current: 0,
  total: 0,
  filename: '',
})

const progressPercent = computed(() => {
  if (progress.value.total === 0) return 0
  return Math.round((progress.value.current / progress.value.total) * 100)
})

/**
 * Handle backdrop click — close modal when clicking outside
 */
function handleBackdropClick() {
  if (!isExporting.value) {
    hide()
  }
}

/**
 * Handle export — process images and download ZIP
 */
async function handleExport() {
  if (isExporting.value || imageStore.imageCount === 0) return

  isExporting.value = true
  progress.value = { current: 0, total: imageStore.imageCount, filename: '' }

  try {
    const opts = getOptions()
    const crop = cropStore.currentCrop

    // Process all images through batch processor
    const results = await batchProcessor.processBatch(
      imageStore.images.map((img) => {
        // Use per-image crop if available (from store), otherwise fall back to stored crop
        const imgCrop = img.id === crop.imageId ? crop : null
        return {
          id: img.id,
          blobUrl: img.blobUrl,
          filename: buildExportFilename(
            img.filename,
            opts.format === 'jpeg' ? 'jpg' : opts.format,
            opts.addSuffix
          ),
          cropX: imgCrop ? imgCrop.x : 0,
          cropY: imgCrop ? imgCrop.y : 0,
          cropWidth: imgCrop ? imgCrop.width : img.originalWidth,
          cropHeight: imgCrop ? imgCrop.height : img.originalHeight,
        }
      }),
      {
        format: opts.format,
        quality: opts.quality,
        onProgress: (current, total, filename) => {
          progress.value.current = current
          progress.value.total = total
          progress.value.filename = filename
        },
      }
    )

    // Generate ZIP
    progress.value.filename = 'Packaging ZIP...'

    const zipBlob = await exportPipeline.generateZip(
      results.map((r) => ({
        ...r,
        filename: buildExportFilename(
          imageStore.getImage(r.id)?.filename || 'image',
          opts.format === 'jpeg' ? 'jpg' : opts.format,
          opts.addSuffix
        ),
      })),
      {
        format: opts.format,
        quality: opts.quality,
        onProgress: (current, total) => {
          progress.value.current = current
          progress.value.total = total
          progress.value.filename = `Packaging ${current}/${total}...`
        },
      }
    )

    // Download
    const timestamp = new Date().toISOString().slice(0, 10)
    exportPipeline.downloadBlob(zipBlob, `cropped-images-${timestamp}.zip`)

    progress.value.filename = 'Export complete!'
    setTimeout(() => {
      hide()
    }, 1500)
  } catch (err) {
    console.error('Export failed:', err)
    progress.value.filename = 'Export failed'
    setTimeout(() => {
      isExporting.value = false
    }, 2000)
  } finally {
    if (progress.value.filename !== 'Export complete!') {
      isExporting.value = false
    }
  }
}
</script>

<style lang="scss" scoped>
.modal-backdrop {
  position: fixed;
  inset: 0;
  z-index: 9998;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(2px);
  animation: fadeIn 0.15s ease-out;
}

.modal {
  position: relative;
  width: 100%;
  max-width: 420px;
  margin: 16px;
  background: var(--bg-secondary, #ffffff);
  border-radius: 12px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  overflow: hidden;
  animation: slideUp 0.2s ease-out;

  &__header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 20px 24px;
    border-bottom: 1px solid var(--border, #e0e0e0);
  }

  &__title {
    margin: 0;
    font-size: 18px;
    font-weight: 600;
    color: var(--text-primary, #1a1a1a);
  }

  &__close {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 32px;
    height: 32px;
    padding: 0;
    color: var(--text-secondary, #666666);
    background: transparent;
    border: none;
    border-radius: 6px;
    cursor: pointer;
    transition: background 0.15s ease;

    svg {
      width: 18px;
      height: 18px;
    }

    &:hover {
      background: var(--bg-tertiary, #f0f0f0);
    }
  }

  &__body {
    padding: 24px;
    display: flex;
    flex-direction: column;
    gap: 20px;
  }

  &__footer {
    display: flex;
    gap: 12px;
    padding: 16px 24px;
    border-top: 1px solid var(--border, #e0e0e0);
    background: var(--bg-tertiary, #f8f8f8);
  }

  &__progress {
    padding: 0 24px 16px;
  }
}

.format-group {
  margin: 0;
  padding: 0;
  border: none;

  &__label {
    display: block;
    margin-bottom: 10px;
    font-size: 13px;
    font-weight: 600;
    color: var(--text-secondary, #666666);
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  &__options {
    display: flex;
    gap: 8px;
  }
}

.format-option {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 10px 12px;
  background: var(--bg-primary, #ffffff);
  border: 2px solid var(--border, #e0e0e0);
  border-radius: 8px;
  cursor: pointer;
  transition: border-color 0.15s ease, background 0.15s ease;

  &__input {
    position: absolute;
    opacity: 0;
    width: 0;
    height: 0;
  }

  &__label {
    font-size: 14px;
    font-weight: 600;
    color: var(--text-primary, #1a1a1a);
  }

  &:hover {
    border-color: var(--accent, #3b82f6);
  }

  &--selected {
    border-color: var(--accent, #3b82f6);
    background: color-mix(in srgb, var(--accent, #3b82f6) 10%, transparent);

    .format-option__label {
      color: var(--accent, #3b82f6);
    }
  }
}

.quality-control {
  display: flex;
  flex-direction: column;
  gap: 8px;

  &__label {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 13px;
    font-weight: 600;
    color: var(--text-secondary, #666666);
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  &__hint {
    font-weight: 400;
    font-size: 11px;
    color: var(--text-tertiary, #999999);
    text-transform: none;
    letter-spacing: 0;
  }

  &__slider {
    width: 100%;
    height: 6px;
    appearance: none;
    background: var(--border, #e0e0e0);
    border-radius: 3px;
    cursor: pointer;

    &::-webkit-slider-thumb {
      appearance: none;
      width: 18px;
      height: 18px;
      background: var(--accent, #3b82f6);
      border-radius: 50%;
      cursor: grab;
      box-shadow: 0 2px 6px rgba(59, 130, 246, 0.4);
    }

    &::-moz-range-thumb {
      width: 18px;
      height: 18px;
      background: var(--accent, #3b82f6);
      border: none;
      border-radius: 50%;
      cursor: grab;
    }
  }

  &__range-labels {
    display: flex;
    justify-content: space-between;
    font-size: 11px;
    color: var(--text-tertiary, #999999);
  }
}

.png-notice {
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 0;
  padding: 10px 12px;
  font-size: 13px;
  color: var(--text-secondary, #666666);
  background: var(--bg-tertiary, #f0f0f0);
  border-radius: 6px;

  &__icon {
    flex-shrink: 0;
    width: 16px;
    height: 16px;
    color: var(--text-tertiary, #999999);
  }
}

.suffix-toggle {
  display: flex;
  align-items: center;
  gap: 10px;
  cursor: pointer;

  &__input {
    position: absolute;
    opacity: 0;
    width: 0;
    height: 0;
  }

  &__box {
    flex-shrink: 0;
    width: 18px;
    height: 18px;
    border: 2px solid var(--border, #e0e0e0);
    border-radius: 4px;
    background: var(--bg-primary, #ffffff);
    transition: all 0.15s ease;

    &::after {
      content: '';
      display: block;
      width: 5px;
      height: 9px;
      margin: 1px auto;
      border: 2px solid white;
      border-top: none;
      border-left: none;
      transform: rotate(45deg) scale(0);
      transition: transform 0.15s ease;
    }
  }

  &__input:checked + &__box {
    background: var(--accent, #3b82f6);
    border-color: var(--accent, #3b82f6);

    &::after {
      transform: rotate(45deg) scale(1);
    }
  }

  &__label {
    font-size: 14px;
    color: var(--text-primary, #1a1a1a);
  }
}

.export-info {
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 0;
  padding: 10px 12px;
  font-size: 13px;
  color: var(--text-secondary, #666666);
  background: var(--bg-tertiary, #f0f0f0);
  border-radius: 6px;

  &__icon {
    flex-shrink: 0;
    width: 16px;
    height: 16px;
    color: var(--text-tertiary, #999999);
  }
}

.btn {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 10px 20px;
  font-size: 14px;
  font-weight: 600;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.15s ease;

  &--secondary {
    color: var(--text-primary, #1a1a1a);
    background: var(--bg-primary, #ffffff);
    border: 1px solid var(--border, #e0e0e0);

    &:hover:not(:disabled) {
      background: var(--bg-tertiary, #f0f0f0);
    }
  }

  &--primary {
    color: #ffffff;
    background: var(--accent, #3b82f6);

    &:hover:not(:disabled) {
      background: var(--accent-hover, #2563eb);
    }
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  &__spinner {
    width: 14px;
    height: 14px;
    border: 2px solid rgba(255, 255, 255, 0.3);
    border-top-color: white;
    border-radius: 50%;
    animation: spin 0.7s linear infinite;
  }
}

.progress-bar {
  height: 4px;
  background: var(--border, #e0e0e0);
  border-radius: 2px;
  overflow: hidden;

  &__fill {
    height: 100%;
    background: var(--accent, #3b82f6);
    border-radius: 2px;
    transition: width 0.2s ease;
  }

  &__label {
    margin: 8px 0 0;
    font-size: 12px;
    color: var(--text-secondary, #666666);
    text-align: center;
  }
}

// Animations
@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(16px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

// Dark mode
@media (prefers-color-scheme: dark) {
  .modal {
    --bg-primary: #1a1a1a;
    --bg-secondary: #2d2d2d;
    --bg-tertiary: #3d3d3d;
    --text-primary: #f5f5f5;
    --text-secondary: #a0a0a0;
    --text-tertiary: #666666;
    --border: #404040;
    --accent: #60a5fa;
    --accent-hover: #3b82f6;
  }
}
</style>
