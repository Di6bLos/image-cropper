<template>
  <div class="crop-workspace">
    <!-- Image display area with crop overlay -->
    <div class="crop-workspace__main">
      <template v-if="selectedImage">
        <!-- Image with crop overlay -->
        <div class="crop-workspace__image-container">
          <CropOverlay
            :image-url="selectedImage.blobUrl"
            :image-width="selectedImage.originalWidth"
            :image-height="selectedImage.originalHeight"
            :crop-x="cropState.x"
            :crop-y="cropState.y"
            :crop-width="cropState.width"
            :crop-height="cropState.height"
            :overlay-opacity="overlayOpacity"
            @drag-start="onCropDragStart"
            @resize-start="onCropResizeStart"
          />
        </div>
      </template>

      <!-- Empty state -->
      <template v-else>
        <div class="crop-workspace__empty">
          <svg
            class="crop-workspace__empty-icon"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
          >
            <rect x="3" y="3" width="18" height="18" rx="2" />
            <line x1="9" y1="3" x2="9" y2="21" />
            <line x1="15" y1="3" x2="15" y2="21" />
            <line x1="3" y1="9" x2="21" y2="9" />
            <line x1="3" y1="15" x2="21" y2="15" />
          </svg>
          <p class="crop-workspace__empty-text">
            Select an image from the list to start cropping
          </p>
        </div>
      </template>
    </div>

    <!-- Ratio controls panel -->
    <div class="crop-workspace__controls">
      <RatioControls />

      <!-- Action buttons -->
      <div class="crop-workspace__actions">
        <AutoCropButton :is-processing="isAiProcessing" @click="onAutoCrop" />
        <button
          type="button"
          class="crop-workspace__action-btn crop-workspace__action-btn--primary"
          @click="onExport"
        >
          Export
        </button>
      </div>
    </div>
  </div>

  <ExportModal />
  <ToastNotification />
</template>

<script setup lang="ts">
import { useImageStore } from '~/stores/useImageStore'
import { useCropStore } from '~/stores/useCropStore'
import { useExportModal } from '~/composables/useExportModal'
import { useSmartcrop } from '~/composables/useSmartcrop'
import { useToast } from '~/composables/useToast'
import CropOverlay from './CropOverlay.vue'
import RatioControls from './RatioControls.vue'
import ExportModal from './ExportModal.vue'
import AutoCropButton from './AutoCropButton.vue'
import ToastNotification from './ToastNotification.vue'

const imageStore = useImageStore()
const cropStore = useCropStore()
const { detectCrop } = useSmartcrop()
const { showFallbackToast, showFailureToast } = useToast()

// Computed: selected image from store
const selectedImage = computed(() => imageStore.selectedImage)

// Overlay opacity from CSS variable
const overlayOpacity = computed(() => 0.65)

// Image dimensions - track selected image's dimensions
const imageWidth = computed(() => selectedImage.value?.originalWidth || 0)
const imageHeight = computed(() => selectedImage.value?.originalHeight || 0)

// Crop state - managed locally with reactive refs
const cropX = ref(0)
const cropY = ref(0)
const cropWidth = ref(100)
const cropHeight = ref(100)

// Initialize/reset crop window when image changes
watch(selectedImage, (image) => {
  if (image) {
    // Initialize crop window at center of image, 80% dimensions
    const initialWidth = image.originalWidth * 0.8
    const initialHeight = image.originalHeight * 0.8
    cropX.value = image.originalWidth * 0.1
    cropY.value = image.originalHeight * 0.1
    cropWidth.value = initialWidth
    cropHeight.value = initialHeight

    // Apply ratio constraint if active
    applyRatioConstraint()
  }
}, { immediate: true })

// Watch effectiveRatio changes and constrain crop window
watch(() => cropStore.effectiveRatio, () => {
  if (selectedImage.value) {
    applyRatioConstraint()
  }
})

// Apply ratio constraint to current crop window
function applyRatioConstraint() {
  const ratio = cropStore.effectiveRatio
  if (!ratio || !selectedImage.value) return

  const img = selectedImage.value
  const centerX = cropX.value + cropWidth.value / 2
  const centerY = cropY.value + cropHeight.value / 2

  // Calculate max dimensions that maintain ratio within image bounds
  let newWidth: number
  let newHeight: number

  // Start with current image-relative size
  newWidth = img.originalWidth * 0.8
  newHeight = img.originalHeight * 0.8

  // Apply ratio constraint
  if (newWidth / newHeight > ratio) {
    newWidth = newHeight * ratio
  } else {
    newHeight = newWidth / ratio
  }

  // Scale down if larger than 80% of image
  const maxWidth = img.originalWidth * 0.8
  const maxHeight = img.originalHeight * 0.8
  if (newWidth > maxWidth || newHeight > maxHeight) {
    const scale = Math.min(maxWidth / newWidth, maxHeight / newHeight)
    newWidth *= scale
    newHeight *= scale
  }

  // Update state, keeping center position
  cropX.value = Math.max(0, centerX - newWidth / 2)
  cropY.value = Math.max(0, centerY - newHeight / 2)
  cropWidth.value = newWidth
  cropHeight.value = newHeight

  // Sync to store for export
  syncCropToStore()
}

// Sync current crop state to the store (for export)
function syncCropToStore() {
  if (selectedImage.value) {
    cropStore.setCurrentCrop({
      imageId: selectedImage.value.id,
      x: cropX.value,
      y: cropY.value,
      width: cropWidth.value,
      height: cropHeight.value,
    })
  }
}

// Watch for crop changes and sync to store
watch(cropState, () => {
  syncCropToStore()
}, { deep: true })

// Crop state for template
const cropState = computed(() => ({
  x: cropX.value,
  y: cropY.value,
  width: cropWidth.value,
  height: cropHeight.value,
}))

// Drag handling
const isDragging = ref(false)
let dragStartX = 0
let dragStartY = 0
let dragStartCropX = 0
let dragStartCropY = 0

function onCropDragStart(e: MouseEvent) {
  if (!process.client || !selectedImage.value) return

  isDragging.value = true
  dragStartX = e.clientX
  dragStartY = e.clientY
  dragStartCropX = cropX.value
  dragStartCropY = cropY.value

  document.addEventListener('mousemove', onDragMove)
  document.addEventListener('mouseup', onDragEnd)
}

function onDragMove(e: MouseEvent) {
  if (!isDragging.value || !selectedImage.value) return

  const dx = e.clientX - dragStartX
  const dy = e.clientY - dragStartY

  let newX = dragStartCropX + dx
  let newY = dragStartCropY + dy

  // Clamp to image bounds
  newX = Math.max(0, Math.min(newX, selectedImage.value.originalWidth - cropWidth.value))
  newY = Math.max(0, Math.min(newY, selectedImage.value.originalHeight - cropHeight.value))

  cropX.value = newX
  cropY.value = newY
}

function onDragEnd() {
  isDragging.value = false
  document.removeEventListener('mousemove', onDragMove)
  document.removeEventListener('mouseup', onDragEnd)
}

// Resize handling
const isResizing = ref(false)
let resizeHandle = ''
let resizeStartX = 0
let resizeStartY = 0
let resizeStartCropX = 0
let resizeStartCropY = 0
let resizeStartWidth = 0
let resizeStartHeight = 0

function onCropResizeStart(handle: 'nw' | 'ne' | 'sw' | 'se') {
  return (e: MouseEvent) => {
    if (!process.client || !selectedImage.value) return

    isResizing.value = true
    resizeHandle = handle
    resizeStartX = e.clientX
    resizeStartY = e.clientY
    resizeStartCropX = cropX.value
    resizeStartCropY = cropY.value
    resizeStartWidth = cropWidth.value
    resizeStartHeight = cropHeight.value

    document.addEventListener('mousemove', onResizeMove)
    document.addEventListener('mouseup', onResizeEnd)
  }
}

function onResizeMove(e: MouseEvent) {
  if (!isResizing.value || !selectedImage.value) return

  const dx = e.clientX - resizeStartX
  const dy = e.clientY - resizeStartY
  const img = selectedImage.value
  const ratio = cropStore.effectiveRatio
  const minSize = 20

  let newWidth = resizeStartWidth
  let newHeight = resizeStartHeight
  let newX = resizeStartCropX
  let newY = resizeStartCropY

  switch (resizeHandle) {
    case 'se': {
      newWidth = Math.max(minSize, resizeStartWidth + dx)
      newHeight = Math.max(minSize, resizeStartHeight + dy)
      if (ratio) {
        if (newWidth / newHeight > ratio) {
          newWidth = newHeight * ratio
        } else {
          newHeight = newWidth / ratio
        }
      }
      break
    }
    case 'sw': {
      newWidth = Math.max(minSize, resizeStartWidth - dx)
      newHeight = Math.max(minSize, resizeStartHeight + dy)
      newX = resizeStartCropX + (resizeStartWidth - newWidth)
      if (ratio) {
        if (newWidth / newHeight > ratio) {
          newWidth = newHeight * ratio
        } else {
          newHeight = newWidth / ratio
        }
        newX = resizeStartCropX + (resizeStartWidth - newWidth)
      }
      break
    }
    case 'ne': {
      newWidth = Math.max(minSize, resizeStartWidth + dx)
      newHeight = Math.max(minSize, resizeStartHeight - dy)
      newY = resizeStartCropY + (resizeStartHeight - newHeight)
      if (ratio) {
        if (newWidth / newHeight > ratio) {
          newWidth = newHeight * ratio
        } else {
          newHeight = newWidth / ratio
        }
        newY = resizeStartCropY + (resizeStartHeight - newHeight)
      }
      break
    }
    case 'nw': {
      newWidth = Math.max(minSize, resizeStartWidth - dx)
      newHeight = Math.max(minSize, resizeStartHeight - dy)
      newX = resizeStartCropX + (resizeStartWidth - newWidth)
      newY = resizeStartCropY + (resizeStartHeight - newHeight)
      if (ratio) {
        if (newWidth / newHeight > ratio) {
          newWidth = newHeight * ratio
        } else {
          newHeight = newWidth / ratio
        }
        newX = resizeStartCropX + (resizeStartWidth - newWidth)
        newY = resizeStartCropY + (resizeStartHeight - newHeight)
      }
      break
    }
  }

  // Clamp to bounds
  newWidth = Math.min(newWidth, img.originalWidth)
  newHeight = Math.min(newHeight, img.originalHeight)
  newX = Math.max(0, Math.min(newX, img.originalWidth - newWidth))
  newY = Math.max(0, Math.min(newY, img.originalHeight - newHeight))

  cropX.value = newX
  cropY.value = newY
  cropWidth.value = newWidth
  cropHeight.value = newHeight
}

function onResizeEnd() {
  isResizing.value = false
  document.removeEventListener('mousemove', onResizeMove)
  document.removeEventListener('mouseup', onResizeEnd)
}

// AI processing state
const isAiProcessing = ref(false)

/**
 * Center crop fallback — positions crop at center of image
 */
function centerCrop() {
  if (!selectedImage.value) return
  const img = selectedImage.value
  const cropW = img.originalWidth * 0.8
  const cropH = img.originalHeight * 0.8
  cropX.value = img.originalWidth * 0.1
  cropY.value = img.originalHeight * 0.1
  cropWidth.value = cropW
  cropHeight.value = cropH
  syncCropToStore()
}

/**
 * Auto crop handler — triggers AI subject detection
 */
async function onAutoCrop() {
  if (!selectedImage.value || isAiProcessing.value) return

  isAiProcessing.value = true
  try {
    const img = selectedImage.value
    const result = await detectCrop(
      img.blobUrl,
      cropWidth.value,
      cropHeight.value,
      img.originalWidth,
      img.originalHeight
    )
    cropX.value = result.x
    cropY.value = result.y
    cropWidth.value = result.width
    cropHeight.value = result.height
    syncCropToStore()
  } catch {
    showFailureToast()
    centerCrop()
  } finally {
    isAiProcessing.value = false
  }
}

// Keyboard shortcut: 'A' triggers auto crop when no input is focused
function onKeydown(e: KeyboardEvent) {
  const target = e.target as HTMLElement
  const tag = target.tagName.toLowerCase()
  if (tag === 'input' || tag === 'textarea' || target.isContentEditable) return
  if (e.key === 'A' || e.key === 'a') {
    onAutoCrop()
  }
}

onMounted(() => {
  if (process.client) {
    window.addEventListener('keydown', onKeydown)
  }
})

onUnmounted(() => {
  if (process.client) {
    window.removeEventListener('keydown', onKeydown)
    document.removeEventListener('mousemove', onDragMove)
    document.removeEventListener('mouseup', onDragEnd)
    document.removeEventListener('mousemove', onResizeMove)
    document.removeEventListener('mouseup', onResizeEnd)
  }
})

/**
 * Open the export modal with format/quality options
 */
function onExport() {
  const { show } = useExportModal()
  show()
}
</script>

<style lang="scss" scoped>
.crop-workspace {
  --cw-bg: var(--bg-primary, #ffffff);
  --cw-bg-secondary: var(--bg-secondary, #f5f5f5);
  --cw-text: var(--text-primary, #1a1a1a);
  --cw-text-secondary: var(--text-secondary, #666666);
  --cw-border: var(--border, #e0e0e0);
  --cw-accent: var(--accent, #3b82f6);
  --cw-accent-hover: var(--accent-hover, #2563eb);

  display: flex;
  flex-direction: column;
  height: 100%;
  background: var(--cw-bg);

  &__main {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    overflow: hidden;
    padding: 24px;
    background: var(--cw-bg-secondary);
  }

  &__image-container {
    position: relative;
    max-width: 100%;
    max-height: calc(100vh - 200px);
  }

  &__empty {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 16px;
    padding: 48px;
    text-align: center;
  }

  &__empty-icon {
    width: 64px;
    height: 64px;
    color: var(--cw-text-secondary);
    opacity: 0.5;
  }

  &__empty-text {
    margin: 0;
    font-size: 14px;
    color: var(--cw-text-secondary);
  }

  &__controls {
    flex-shrink: 0;
    padding: 16px;
    background: var(--cw-bg);
    border-top: 1px solid var(--cw-border);
  }

  &__actions {
    display: flex;
    gap: 12px;
    margin-top: 16px;
  }

  &__action-btn {
    flex: 1;
    padding: 12px 24px;
    font-size: 14px;
    font-weight: 500;
    color: var(--cw-text);
    background: var(--cw-bg-secondary);
    border: 1px solid var(--cw-border);
    border-radius: 6px;
    cursor: pointer;
    transition: background 150ms ease, border-color 150ms ease;

    &:hover {
      background: var(--cw-bg-tertiary, var(--cw-bg-secondary));
      border-color: var(--cw-text-secondary);
    }

    &--primary {
      color: white;
      background: var(--cw-accent);
      border-color: var(--cw-accent);

      &:hover {
        background: var(--cw-accent-hover);
        border-color: var(--cw-accent-hover);
      }
    }
  }
}

// Dark mode
@media (prefers-color-scheme: dark) {
  .crop-workspace {
    --cw-bg: var(--bg-primary, #1a1a1a);
    --cw-bg-secondary: var(--bg-secondary, #2d2d2d);
    --cw-text: var(--text-primary, #f5f5f5);
    --cw-text-secondary: var(--text-secondary, #a0a0a0);
    --cw-border: var(--border, #404040);
    --cw-accent: var(--accent, #60a5fa);
    --cw-accent-hover: var(--accent-hover, #3b82f6);
  }
}
</style>
